/**
 * Tests for package.json metadata contracts.
 *
 * Asserts that @bopstack/config exposes the expected exports
 * for Biome and TypeScript shared configs.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const PACKAGE_JSON = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf-8'))

describe('package.json exports', () => {
	it('exports ./biome for shared Biome config', () => {
		expect(PACKAGE_JSON.exports).toBeDefined()
		expect(PACKAGE_JSON.exports['./biome']).toBeDefined()
	})

	it('exports ./tsconfig/base for shared TypeScript base config', () => {
		expect(PACKAGE_JSON.exports).toBeDefined()
		expect(PACKAGE_JSON.exports['./tsconfig/base']).toBeDefined()
	})

	it('exports values resolve to existing source files', () => {
		const biomeExport = PACKAGE_JSON.exports['./biome']
		const tsExport = PACKAGE_JSON.exports['./tsconfig/base']

		// Biome export should point to a .json file under src/config/biome
		expect(typeof biomeExport).toBe('string')
		expect(biomeExport).toMatch(/^\.\/src\/config\/biome\//)

		// TypeScript export should point to a .json file under src/config/tsconfig
		expect(typeof tsExport).toBe('string')
		expect(tsExport).toMatch(/^\.\/src\/config\/tsconfig\//)
	})
})
