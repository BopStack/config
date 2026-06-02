/**
 * Config shim generator for bopstack-config init.
 *
 * Produces minimal consumer shim files that extend the shared
 * @bopstack/config packages. Replaces the old copy-from-package
 * mechanism for Biome and TypeScript configs.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

import type { ConfigFile } from './package_selection.js'

/** Shim content for biome.json. */
const BIOME_SHIM = JSON.stringify(
	{
		$schema: 'https://biomejs.dev/schemas/latest/schema.json',
		extends: ['@bopstack/config/biome']
	},
	null,
	'\t'
)

/** Shim content for tsconfig.json. */
const TSCONFIG_SHIM = JSON.stringify(
	{
		extends: '@bopstack/config/tsconfig/base'
	},
	null,
	'\t'
)

/** Map of source file name to shim content generator. */
const SHIM_CONTENTS: Record<string, string> = {
	'biome.json': BIOME_SHIM,
	'tsconfig.json': TSCONFIG_SHIM
}

/** Options for generating a config shim. */
export interface GenerateShimOptions {
	/** Target consumer project root directory. */
	targetDir: string
	/** Config file entry describing what shim to generate. */
	fileEntry: ConfigFile
	/** If true, only report what would be written. */
	dryRun: boolean
}

/** Result from generating a config shim. */
export interface GenerateShimResult {
	/** Target file path that was (or would be) written. */
	targetPath: string
	/** Whether the file already exists. */
	existing: boolean
	/** Whether the write was performed (false in dry-run). */
	written: boolean
}

/**
 * Generate a consumer config shim file.
 *
 * Produces a minimal shim (e.g. biome.json) that extends the
 * shared @bopstack/config package, at the target project root.
 */
export function generate_config(options: GenerateShimOptions): GenerateShimResult {
	const { targetDir, fileEntry, dryRun } = options
	const targetPath = join(targetDir, fileEntry.targetFileName)

	const existing = false // placeholder — no overwrite detection yet
	if (dryRun) {
		return { targetPath, existing, written: false }
	}

	const content = SHIM_CONTENTS[fileEntry.sourceFileName]
	if (!content) {
		return { targetPath, existing, written: false }
	}

	const dir = dirname(targetPath)
	mkdirSync(dir, { recursive: true })
	writeFileSync(targetPath, content, 'utf-8')

	return { targetPath, existing: false, written: true }
}
