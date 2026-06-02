/**
 * Tests for file copy logic.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { CopyFileResult } from './file_copy.js'
import { compute_summary, copy_config_file } from './file_copy.js'

/** Create a temp dir for a single test. */
function create_temp_target(): string {
	return mkdtempSync(join(tmpdir(), 'bopstack-config-test-'))
}

/** Create a package fixture dir with a config file. */
function create_package_fixture(
	root: string,
	packageName: string,
	sourceFileName: string,
	subDir: string = '',
	content: string = 'test content'
): string {
	const pkgDir = join(root, 'node_modules', packageName, subDir)
	mkdirSync(pkgDir, { recursive: true })
	const filePath = join(pkgDir, sourceFileName)
	writeFileSync(filePath, content, 'utf-8')
	return filePath
}

describe('copy_config_file', () => {
	let targetDir: string
	let modulesRoot: string

	beforeEach(() => {
		targetDir = create_temp_target()
		modulesRoot = create_temp_target()
	})

	afterEach(() => {
		rmSync(targetDir, { recursive: true, force: true })
		rmSync(modulesRoot, { recursive: true, force: true })
	})

	it('dry-run reports create without writing', () => {
		const result = copy_config_file({
			targetDir,
			fileEntry: {
				packageName: '@bopstack/git-hook',
				sourceFileName: 'lefthook.yml',
				targetFileName: '.lefthook.yml'
			},
			dryRun: true,
			nodeModulesRoot: modulesRoot
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(false)
		expect(result!.existing).toBe(false)
		expect(existsSync(join(targetDir, '.lefthook.yml'))).toBe(false)
	})

	it('dry-run reports overwrite when target exists', () => {
		// Create target file first
		mkdirSync(targetDir, { recursive: true })
		writeFileSync(join(targetDir, '.lefthook.yml'), 'existing content', 'utf-8')

		const result = copy_config_file({
			targetDir,
			fileEntry: {
				packageName: '@bopstack/git-hook',
				sourceFileName: 'lefthook.yml',
				targetFileName: '.lefthook.yml'
			},
			dryRun: true,
			nodeModulesRoot: modulesRoot
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(false)
		expect(result!.existing).toBe(true)
	})

	it('copies from root node_modules candidate', () => {
		create_package_fixture(modulesRoot, '@bopstack/tsconfig', 'tsconfig.base.json', '')
		const result = copy_config_file({
			targetDir,
			fileEntry: {
				packageName: '@bopstack/tsconfig',
				sourceFileName: 'tsconfig.base.json',
				targetFileName: 'tsconfig.base.json'
			},
			dryRun: false,
			nodeModulesRoot: modulesRoot
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(true)
		expect(result!.targetPath).toBe(join(targetDir, 'tsconfig.base.json'))
		expect(existsSync(join(targetDir, 'tsconfig.base.json'))).toBe(true)
	})

	it('copies from src/ candidate', () => {
		create_package_fixture(modulesRoot, '@bopstack/test-pkg', 'config.json', 'src')
		const result = copy_config_file({
			targetDir,
			fileEntry: {
				packageName: '@bopstack/test-pkg',
				sourceFileName: 'config.json',
				targetFileName: 'config.json'
			},
			dryRun: false,
			nodeModulesRoot: modulesRoot
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(true)
		expect(existsSync(join(targetDir, 'config.json'))).toBe(true)
	})

	it('copies from dist/ candidate', () => {
		create_package_fixture(modulesRoot, '@bopstack/test-pkg', 'config.json', 'dist')
		const result = copy_config_file({
			targetDir,
			fileEntry: {
				packageName: '@bopstack/test-pkg',
				sourceFileName: 'config.json',
				targetFileName: 'config.json'
			},
			dryRun: false,
			nodeModulesRoot: modulesRoot
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(true)
		expect(existsSync(join(targetDir, 'config.json'))).toBe(true)
	})

	it('prefers root over src over dist candidate', () => {
		// Create all three: should pick root
		const rootPath = create_package_fixture(modulesRoot, '@bopstack/test-pkg', 'config.json', '')
		create_package_fixture(modulesRoot, '@bopstack/test-pkg', 'config.json', 'src')
		create_package_fixture(modulesRoot, '@bopstack/test-pkg', 'config.json', 'dist')

		copy_config_file({
			targetDir,
			fileEntry: {
				packageName: '@bopstack/test-pkg',
				sourceFileName: 'config.json',
				targetFileName: 'config.json'
			},
			dryRun: false,
			nodeModulesRoot: modulesRoot
		})

		// Verify content came from root path
		const targetContent = readFileSync(join(targetDir, 'config.json'), 'utf-8')
		const rootContent = readFileSync(rootPath, 'utf-8')
		expect(targetContent).toBe(rootContent)
	})

	it('returns null when source not found and no existing target', () => {
		const result = copy_config_file({
			targetDir,
			fileEntry: {
				packageName: '@bopstack/nonexistent',
				sourceFileName: 'missing.json',
				targetFileName: 'missing.json'
			},
			dryRun: false,
			nodeModulesRoot: modulesRoot
		})

		expect(result).toBeNull()
	})

	it('returns written=true when source not found but target exists', () => {
		// Create target file first
		writeFileSync(join(targetDir, 'missing.json'), 'existing content', 'utf-8')

		const result = copy_config_file({
			targetDir,
			fileEntry: {
				packageName: '@bopstack/nonexistent',
				sourceFileName: 'missing.json',
				targetFileName: 'missing.json'
			},
			dryRun: false,
			nodeModulesRoot: modulesRoot
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(true)
		expect(result!.existing).toBe(true)
	})

	it('creates nested target directories', () => {
		create_package_fixture(modulesRoot, '@bopstack/test-pkg', 'config.json', '')
		const nestedTarget = join(targetDir, 'subdir', 'nested')

		const result = copy_config_file({
			targetDir: nestedTarget,
			fileEntry: {
				packageName: '@bopstack/test-pkg',
				sourceFileName: 'config.json',
				targetFileName: 'config.json'
			},
			dryRun: false,
			nodeModulesRoot: modulesRoot
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(true)
		expect(existsSync(join(nestedTarget, 'config.json'))).toBe(true)
	})
})

describe('compute_summary', () => {
	it('counts written, skipped, existing', () => {
		const results: (CopyFileResult | null)[] = [
			{ targetPath: '/a', existing: false, written: true },
			{ targetPath: '/b', existing: false, written: true },
			null,
			null,
			{ targetPath: '/c', existing: true, written: false }
		]

		const summary = compute_summary(results, 3)

		expect(summary.packageCount).toBe(3)
		expect(summary.written).toHaveLength(2)
		expect(summary.skipped).toBe(2)
		expect(summary.existing).toHaveLength(1)
		expect(summary.existing[0].targetPath).toBe('/c')
	})

	it('handles empty results', () => {
		const summary = compute_summary([], 0)
		expect(summary.written).toHaveLength(0)
		expect(summary.skipped).toBe(0)
		expect(summary.existing).toHaveLength(0)
		expect(summary.packageCount).toBe(0)
	})

	it('handles all null results', () => {
		const summary = compute_summary([null, null, null], 5)
		expect(summary.packageCount).toBe(5)
		expect(summary.written).toHaveLength(0)
		expect(summary.skipped).toBe(3)
		expect(summary.existing).toHaveLength(0)
	})

	it('handles dry-run results (written=false, not existing)', () => {
		const results: (CopyFileResult | null)[] = [
			{ targetPath: '/a', existing: false, written: false },
			{ targetPath: '/b', existing: true, written: false }
		]

		const summary = compute_summary(results, 1)

		expect(summary.written).toHaveLength(0)
		expect(summary.skipped).toBe(0)
		expect(summary.existing).toHaveLength(1)
	})
})
