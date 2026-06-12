/**
 * Tests for package selection logic.
 */

import { describe, expect, test } from 'vitest'

import { get_config_files, get_packages, ProjectKindSchema } from './package_selection.js'

const EXPECTED_PACKAGES = ['@bopstack/config', '@biomejs/biome', 'typescript']

const OLD_PACKAGES = [
	'@bopstack/tsconfig',
	'@bopstack/oxfmt',
	'@bopstack/oxlint',
	'@bopstack/oxc',
	'@bopstack/commitlint',
	'@bopstack/markdownlint',
	'@bopstack/spellcheck',
	'@bopstack/just',
	'@bopstack/custom-lint',
	'@bopstack/git-hook'
]

describe('package_selection', () => {
	test('given default kind: should return the expected package set', () => {
		const packages = get_packages('default')
		expect([...packages].sort()).toEqual([...EXPECTED_PACKAGES].sort())
	})

	test('given default kind: should not include old default packages', () => {
		const packages = get_packages('default')
		for (const old of OLD_PACKAGES) {
			expect(packages.includes(old)).toBe(false)
		}
	})

	test('given default kind: should return biome.json and tsconfig.json shim entries', () => {
		const files = get_config_files('default')
		expect(
			files.some((f) => f.targetFileName === 'biome.json' && f.sourceFileName === 'biome.json')
		).toBe(true)
		expect(
			files.some(
				(f) => f.targetFileName === 'tsconfig.json' && f.sourceFileName === 'tsconfig.json'
			)
		).toBe(true)
	})

	test('given default kind: should not contain old out-of-scope entries', () => {
		const files = get_config_files('default')
		const old_packages = [
			'@bopstack/tsconfig',
			'@bopstack/oxfmt',
			'@bopstack/oxlint',
			'@bopstack/oxc',
			'@bopstack/commitlint',
			'@bopstack/markdownlint',
			'@bopstack/spellcheck',
			'@bopstack/just',
			'@bopstack/custom-lint',
			'@bopstack/git-hook'
		]
		for (const pkg of old_packages) {
			expect(files.some((f) => f.packageName === pkg)).toBe(false)
		}
	})

	test('given "default" value: should be accepted by ProjectKindSchema', () => {
		expect(ProjectKindSchema('default')).toEqual('default')
	})
})
