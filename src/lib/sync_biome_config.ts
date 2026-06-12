/**
 * Root Biome config synchronisation utilities.
 *
 * The published shared config uses consumer-facing plugin paths under
 * `node_modules/@bopstack/config`. The repository root needs the same rules
 * with local plugin paths so Biome can lint this package without installing
 * itself as a dependency.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type JsonValue =
	| null
	| boolean
	| number
	| string
	| JsonValue[]
	| { [key: string]: JsonValue }

export type JsonObject = { [key: string]: JsonValue }

const SHARED_PLUGIN_PREFIX = './node_modules/@bopstack/config/src/config/biome/rules/'
const LOCAL_PLUGIN_PREFIX = './src/config/biome/rules/'

const TEST_FILE_OVERRIDES: JsonObject[] = [
	{
		includes: ['**/*.test.ts', '**/*.spec.ts'],
		linter: {
			rules: {
				style: {
					noMagicNumbers: 'off',
					noNestedTernary: 'off'
				},
				nursery: {
					noConditionalExpect: 'off',
					useDestructuring: 'off',
					useExplicitType: 'off',
					useExplicitReturnType: 'off'
				},
				correctness: {
					noUnresolvedImports: 'off'
				},
				suspicious: {
					noEmptyBlockStatements: 'off'
				},
				security: {
					noSecrets: 'off'
				},
				performance: {
					useTopLevelRegex: 'off'
				},
				complexity: {
					useMaxParams: 'off',
					noExcessiveLinesPerFunction: 'off',
					useSimplifiedLogicExpression: 'off'
				}
			}
		}
	}
]

const ROOT_CORRECTNESS_RULES: JsonObject = {
	noUnresolvedImports: 'off'
}

const ROOT_STYLE_RULES: JsonObject = {
	useNamingConvention: 'off'
}

const ROOT_SUSPICIOUS_RULES: JsonObject = {
	noConsole: 'off'
}

/**
 * Checks whether a JSON value is a plain JSON object.
 */
function is_json_object(value: JsonValue | unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Parse file content that must contain a JSON object.
 */
function parse_json_object(content: string): JsonObject {
	const value: unknown = JSON.parse(content)

	if (is_json_object(value)) {
		return value
	}

	throw new Error('Expected shared biome config to be a JSON object')
}

/**
 * Convert shared plugin paths to repository-local plugin paths.
 */
function local_plugin_paths(plugins: JsonValue | undefined): string[] {
	if (!Array.isArray(plugins)) {
		throw new Error('Expected shared biome config plugins to be an array')
	}

	return plugins.map((plugin) => {
		if (typeof plugin !== 'string') {
			throw new Error('Expected shared biome config plugins to be strings')
		}

		return plugin.replace(SHARED_PLUGIN_PREFIX, LOCAL_PLUGIN_PREFIX)
	})
}

/**
 * Merge root-only lint rule overrides into the shared config rules.
 */
function root_linter_config(shared_config: JsonObject): JsonObject {
	if (!is_json_object(shared_config.linter)) {
		throw new Error('Expected shared biome config linter to be an object')
	}

	const shared_linter = shared_config.linter
	if (!is_json_object(shared_linter.rules)) {
		throw new Error('Expected shared biome config linter rules to be an object')
	}

	const shared_rules = shared_linter.rules
	return {
		...shared_linter,
		rules: {
			...shared_rules,
			correctness: {
				...(is_json_object(shared_rules.correctness) ? shared_rules.correctness : {}),
				...ROOT_CORRECTNESS_RULES
			},
			style: {
				...(is_json_object(shared_rules.style) ? shared_rules.style : {}),
				...ROOT_STYLE_RULES
			},
			suspicious: {
				...(is_json_object(shared_rules.suspicious) ? shared_rules.suspicious : {}),
				...ROOT_SUSPICIOUS_RULES
			}
		}
	}
}

/**
 * Build the root biome.json content from the shared biome config.
 */
export function create_root_biome_config(shared_config: JsonObject): JsonObject {
	return {
		...shared_config,
		linter: root_linter_config(shared_config),
		root: true,
		overrides: TEST_FILE_OVERRIDES,
		plugins: local_plugin_paths(shared_config.plugins)
	}
}

/**
 * Copy the shared Biome config to the repository root with local plugin paths.
 */
export function sync_root_biome_config(root = process.cwd()): void {
	const shared_path = join(root, 'src', 'config', 'biome', 'biome-config.json')
	const root_config_path = join(root, 'biome.json')
	const shared_config = parse_json_object(readFileSync(shared_path, 'utf-8'))
	const root_config = create_root_biome_config(shared_config)

	writeFileSync(root_config_path, `${JSON.stringify(root_config, null, '\t')}\n`)
}
