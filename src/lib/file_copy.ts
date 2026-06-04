/**
 * File copy utilities for bopstack-config init.
 *
 * Copies/renames config files from installed @bopstack/* packages
 * into a target project directory, handling dotfile renaming.
 */

import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** Options for copying a single config file. */
export interface CopyFileOptions {
	/** Target project root directory. */
	targetDir: string
	/** Source config file entry describing what to copy. */
	fileEntry: {
		packageName: string
		sourceFileName: string
		targetFileName: string
	}
	/** If true, only report what would be written. */
	dryRun: boolean
	/**
	 * Root directory for resolving node_modules (default: process.cwd()).
	 * Allows tests to inject a temp dir instead of relying on CWD.
	 */
	nodeModulesRoot?: string
}

/** Result from copying a file. */
export interface CopyFileResult {
	/** Target file path that was (or would be) written. */
	targetPath: string
	/** Whether the file already exists. */
	existing: boolean
	/** Whether the copy was performed (false in dry-run). */
	written: boolean
}

/** Structured summary data (pure, no console.log). */
export interface CopySummary {
	/** Results of files that were actually written. */
	written: CopyFileResult[]
	/** Results of files that were skipped (source not found). */
	skipped: number
	/** Results of files that already existed and were not overwritten. */
	existing: CopyFileResult[]
	/** Count of packages installed. */
	packageCount: number
}

/**
 * Resolve the source path for a package's config file.
 */
function resolve_package_config_path(
	root: string,
	packageName: string,
	fileName: string
): string | null {
	const candidates = [
		join(root, 'node_modules', packageName, fileName),
		join(root, 'node_modules', packageName, 'src', fileName),
		join(root, 'node_modules', packageName, 'dist', fileName)
	]

	for (const candidate of candidates) {
		if (existsSync(candidate)) {
			return candidate
		}
	}

	return null
}

/**
 * Copy a config file from its package to the target project directory.
 * Handles dotfile renames (e.g. lefthook.yml → .lefthook.yml).
 */
export function copy_config_file(options: CopyFileOptions): CopyFileResult | null {
	const { targetDir, fileEntry, dryRun, nodeModulesRoot = process.cwd() } = options
	const { sourceFileName, targetFileName } = fileEntry
	const targetPath = join(targetDir, targetFileName)
	const existing = existsSync(targetPath)

	if (dryRun) {
		console.log(
			`[dry-run] ${existing ? 'overwrite' : 'create'} ${targetPath}` +
				(targetFileName !== sourceFileName ? ` (from ${sourceFileName})` : '')
		)
		return { targetPath, existing, written: false }
	}

	const sourcePath = resolve_package_config_path(
		nodeModulesRoot,
		fileEntry.packageName,
		sourceFileName
	)

	if (!(sourcePath || existing)) {
		console.warn(`[skip] source not found for ${fileEntry.packageName}/${sourceFileName}`)
		return null
	}

	// Ensure target directory exists
	const targetDirPath = dirname(targetPath)
	if (!existsSync(targetDirPath)) {
		mkdirSync(targetDirPath, { recursive: true })
	}

	if (sourcePath) {
		copyFileSync(sourcePath, targetPath)
		console.log(`[write] ${targetPath}`)
	} else {
		console.log(`[skip] ${targetPath} (already exists, no source to update)`)
	}

	return { targetPath, existing, written: true }
}

/**
 * Compute summary data from copy results (pure, no side effects).
 */
export function compute_summary(
	results: (CopyFileResult | null)[],
	packageCount: number
): CopySummary {
	const copyResults = results.filter((r): r is CopyFileResult => r !== null)
	const written = copyResults.filter((r) => r.written)
	const skipped = results.filter((r) => r === null).length
	const existing = copyResults.filter((r) => r.existing && !r.written)

	return { written, skipped, existing, packageCount }
}

/**
 * Report summary of copied files to the user (side-effect: console.log).
 */
export function report_summary(
	results: (CopyFileResult | null)[],
	packagesInstalled: string[]
): void {
	const summary = compute_summary(results, packagesInstalled.length)

	console.log('\n--- Summary ---')
	console.log(`Packages installed: ${summary.packageCount}`)
	console.log(`Config files written: ${summary.written.length}`)
	if (summary.existing.length > 0) {
		console.log(`Config files already existing (skipped): ${summary.existing.length}`)
	}
	if (summary.skipped > 0) {
		console.log(`Config files skipped (source not found): ${summary.skipped}`)
	}
	console.log('\nSuggested next steps:')
	console.log('  Review the copied config files and adjust as needed.')
	console.log('  Run `just check` to verify the setup.')
}
