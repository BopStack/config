/**
 * Tests for package selection logic.
 */

import { describe, it, expect } from 'vitest'

import { get_packages, get_config_files, ProjectKindSchema } from './package_selection.js'

const EXPECTED_PACKAGES = [
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
	it('get_packages returns all expected packages for default kind', () => {
		const packages = get_packages('default')
		expect([...packages].sort()).toEqual([...EXPECTED_PACKAGES].sort())
	})

	it('get_config_files returns files for default kind', () => {
		const files = get_config_files('default')
		expect(files.length).toBeGreaterThanOrEqual(8)
		expect(files.some((f) => f.packageName === '@bopstack/tsconfig')).toBe(true)
		expect(files.some((f) => f.packageName === '@bopstack/git-hook')).toBe(true)
	})

	it('maps tsconfig.base.json -> tsconfig.base.json', () => {
		const files = get_config_files('default')
		const entry = files.find((f) => f.packageName === '@bopstack/tsconfig')
		expect(entry).toBeDefined()
		expect(entry!.sourceFileName).toBe('tsconfig.base.json')
		expect(entry!.targetFileName).toBe('tsconfig.base.json')
	})

	it('maps oxfmtrc.json -> oxfmtrc.json', () => {
		const files = get_config_files('default')
		const entry = files.find((f) => f.packageName === '@bopstack/oxfmt')
		expect(entry).toBeDefined()
		expect(entry!.sourceFileName).toBe('oxfmtrc.json')
		expect(entry!.targetFileName).toBe('oxfmtrc.json')
	})

	it('maps oxlintrc.json -> oxlintrc.json', () => {
		const files = get_config_files('default')
		const entry = files.find((f) => f.packageName === '@bopstack/oxlint')
		expect(entry).toBeDefined()
		expect(entry!.sourceFileName).toBe('oxlintrc.json')
		expect(entry!.targetFileName).toBe('oxlintrc.json')
	})

	it('maps commitlintrc.ts -> commitlint.config.ts', () => {
		const files = get_config_files('default')
		const entry = files.find((f) => f.packageName === '@bopstack/commitlint')
		expect(entry).toBeDefined()
		expect(entry!.sourceFileName).toBe('commitlintrc.ts')
		expect(entry!.targetFileName).toBe('commitlint.config.ts')
	})

	it('maps justfile -> justfile', () => {
		const files = get_config_files('default')
		const entry = files.find((f) => f.packageName === '@bopstack/just')
		expect(entry).toBeDefined()
		expect(entry!.sourceFileName).toBe('justfile')
		expect(entry!.targetFileName).toBe('justfile')
	})

	it('maps lefthook.yml -> .lefthook.yml', () => {
		const files = get_config_files('default')
		const entry = files.find((f) => f.packageName === '@bopstack/git-hook')
		expect(entry).toBeDefined()
		expect(entry!.sourceFileName).toBe('lefthook.yml')
		expect(entry!.targetFileName).toBe('.lefthook.yml')
	})

	it('maps markdownlint.json -> .markdownlint.json', () => {
		const files = get_config_files('default')
		const entry = files.find((f) => f.packageName === '@bopstack/markdownlint')
		expect(entry).toBeDefined()
		expect(entry!.sourceFileName).toBe('markdownlint.json')
		expect(entry!.targetFileName).toBe('.markdownlint.json')
	})

	it('maps cspell.json -> .cspell.json', () => {
		const files = get_config_files('default')
		const entry = files.find((f) => f.packageName === '@bopstack/spellcheck')
		expect(entry).toBeDefined()
		expect(entry!.sourceFileName).toBe('cspell.json')
		expect(entry!.targetFileName).toBe('.cspell.json')
	})

	it('ProjectKindSchema accepts "default"', () => {
		expect(ProjectKindSchema('default')).toEqual('default')
	})
})