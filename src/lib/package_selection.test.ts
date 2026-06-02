/**
 * Tests for package selection logic.
 */

import { describe, it, expect } from 'vitest'

import { get_packages, get_config_files, ProjectKindSchema, type ConfigFile } from './package_selection.js'

const EXPECTED_PACKAGES = [
	'@bopstack/config',
	'@biomejs/biome',
	'typescript'
]

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
	it('get_packages returns the new single-package set for default kind', () => {
		const packages = get_packages('default')
		expect([...packages].sort()).toEqual([...EXPECTED_PACKAGES].sort())
	})

	it('get_packages does not include old default packages', () => {
		const packages = get_packages('default')
		for (const old of OLD_PACKAGES) {
			expect(packages.includes(old)).toBe(false)
		}
	})

	it('get_config_files returns biome.json and tsconfig.json shim entries for default kind', () => {
		const files = get_config_files('default')
		expect(files.some((f) => f.targetFileName === 'biome.json' && f.sourceFileName === 'biome.json')).toBe(true)
		expect(files.some((f) => f.targetFileName === 'tsconfig.json' && f.sourceFileName === 'tsconfig.json')).toBe(true)
	})

	it('get_config_files does not contain old out-of-scope entries', () => {
		const files = get_config_files('default')
		const oldPackages = ['@bopstack/tsconfig', '@bopstack/oxfmt', '@bopstack/oxlint', '@bopstack/oxc', '@bopstack/commitlint', '@bopstack/markdownlint', '@bopstack/spellcheck', '@bopstack/just', '@bopstack/custom-lint', '@bopstack/git-hook']
		for (const pkg of oldPackages) {
			expect(files.some((f) => f.packageName === pkg)).toBe(false)
		}
	})

	it('ProjectKindSchema accepts "default"', () => {
		expect(ProjectKindSchema('default')).toEqual('default')
	})
})