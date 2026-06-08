/**
 * Package selection logic for bopstack-config init.
 *
 * Defines which packages to install per project kind,
 * and which config shim files to generate.
 */

import { type } from 'arktype'

/**
 * A config file entry describing a generated shim file.
 */
export type ConfigFile = {
	/** Package name providing the shared config. */
	packageName: string
	/** File name to generate inside the package (e.g. 'biome.json'). */
	sourceFileName: string
	/** Target file name in the consumer project. */
	targetFileName: string
}

/** Project kind schema. */
export const PROJECT_KINDS = ['default'] as const
export type ProjectKind = (typeof PROJECT_KINDS)[number]

export const ProjectKindSchema = type('"default"')

/** Default package set — the single consumer-facing package plus tooling. */
const DEFAULT_PACKAGES = ['@bopstack/config', '@biomejs/biome', 'typescript'] as const

/** Config shim entries generated into the consumer project. */
const DEFAULT_CONFIG_FILES: ConfigFile[] = [
	{
		packageName: '@bopstack/config',
		sourceFileName: 'biome.json',
		targetFileName: 'biome.json'
	},
	{
		packageName: '@bopstack/config',
		sourceFileName: 'tsconfig.json',
		targetFileName: 'tsconfig.json'
	}
]

/**
 * Get npm packages to install for a given project kind.
 */
export function get_packages(kind: ProjectKind): readonly string[] {
	switch (kind) {
		case 'default':
			return DEFAULT_PACKAGES
		default:
			return DEFAULT_PACKAGES
	}
}

/**
 * Get config file shim entries for a given project kind.
 */
export function get_config_files(kind: ProjectKind): ConfigFile[] {
	switch (kind) {
		case 'default':
			return DEFAULT_CONFIG_FILES
		default:
			return DEFAULT_CONFIG_FILES
	}
}
