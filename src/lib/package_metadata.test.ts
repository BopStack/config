/**
 * Tests for package.json metadata contracts.
 *
 * Asserts that @bopstack/config exposes the expected exports
 * for Biome and TypeScript shared configs.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const PACKAGE_JSON = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf-8'))

describe('package.json exports', () => {
	test('given package.json exports: should include ./biome for shared Biome config', () => {
		expect(PACKAGE_JSON.exports).toBeDefined()
		expect(PACKAGE_JSON.exports['./biome']).toBeDefined()
	})

	test('given package.json exports: should include ./tsconfig/base', () => {
		expect(PACKAGE_JSON.exports).toBeDefined()
		expect(PACKAGE_JSON.exports['./tsconfig/base']).toBeDefined()
	})

	test('given export entries: should resolve to existing source files', () => {
		const biome_export = PACKAGE_JSON.exports['./biome']
		const ts_export = PACKAGE_JSON.exports['./tsconfig/base']

		// Biome export should point to a .json file under src/config/biome
		expect(typeof biome_export).toBe('string')
		expect(biome_export).toMatch(/^\.\/src\/config\/biome\//)

		// TypeScript export should point to a .json file under src/config/tsconfig
		expect(typeof ts_export).toBe('string')
		expect(ts_export).toMatch(/^\.\/src\/config\/tsconfig\//)
	})
})
