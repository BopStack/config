import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { create_root_biome_config, type JsonObject } from './sync_biome_config.js'

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SHARED_CONFIG_PATH = join(PACKAGE_DIR, 'src', 'config', 'biome', 'biome-config.json')
const ROOT_CONFIG_PATH = join(PACKAGE_DIR, 'biome.json')

/**
 * Read a JSON file as an object.
 */
function read_json_object(path: string): JsonObject {
	return JSON.parse(readFileSync(path, 'utf-8'))
}

describe('root biome config sync', () => {
	test('given the shared biome config: should match checked-in root biome config', () => {
		const shared_config = read_json_object(SHARED_CONFIG_PATH)
		const root_config = read_json_object(ROOT_CONFIG_PATH)

		expect(create_root_biome_config(shared_config)).toEqual(root_config)
	})

	test('given the shared biome config: should disable import extensions', () => {
		const shared_config = read_json_object(SHARED_CONFIG_PATH)
		const linter = shared_config.linter as JsonObject
		const rules = linter.rules as JsonObject
		const correctness = rules.correctness as JsonObject

		expect(correctness.useImportExtensions).toBe('off')
	})
})
