/**
 * Tests for file copy logic.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import type { CopyFileResult } from './file_copy.js'
import { compute_summary, copy_config_file } from './file_copy.js'

/** Create a temp dir for a single test. */
function create_temp_target(): string {
	return mkdtempSync(join(tmpdir(), 'bopstack-config-test-'))
}

/** Create a package fixture dir with a config file. */
function create_package_fixture(
	root: string,
	package_name: string,
	source_file_name: string,
	sub_dir = '',
	content = 'test content'
): string {
	const pkg_dir = join(root, 'node_modules', package_name, sub_dir)
	mkdirSync(pkg_dir, { recursive: true })
	const file_path = join(pkg_dir, source_file_name)
	writeFileSync(file_path, content, 'utf-8')
	return file_path
}

describe('copy_config_file', () => {
	let target_dir: string
	let modules_root: string

	beforeEach(() => {
		target_dir = create_temp_target()
		modules_root = create_temp_target()
	})

	afterEach(() => {
		rmSync(target_dir, { recursive: true, force: true })
		rmSync(modules_root, { recursive: true, force: true })
	})

	test('dry-run reports create without writing', () => {
		const result = copy_config_file({
			targetDir: target_dir,
			fileEntry: {
				packageName: '@bopstack/git-hook',
				sourceFileName: 'lefthook.yml',
				targetFileName: '.lefthook.yml'
			},
			dryRun: true,
			nodeModulesRoot: modules_root
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(false)
		expect(result!.existing).toBe(false)
		expect(existsSync(join(target_dir, '.lefthook.yml'))).toBe(false)
	})

	test('dry-run reports overwrite when target exists', () => {
		// Create target file first
		mkdirSync(target_dir, { recursive: true })
		writeFileSync(join(target_dir, '.lefthook.yml'), 'existing content', 'utf-8')

		const result = copy_config_file({
			targetDir: target_dir,
			fileEntry: {
				packageName: '@bopstack/git-hook',
				sourceFileName: 'lefthook.yml',
				targetFileName: '.lefthook.yml'
			},
			dryRun: true,
			nodeModulesRoot: modules_root
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(false)
		expect(result!.existing).toBe(true)
	})

	test('copies from root node_modules candidate', () => {
		create_package_fixture(modules_root, '@bopstack/tsconfig', 'tsconfig.base.json', '')
		const result = copy_config_file({
			targetDir: target_dir,
			fileEntry: {
				packageName: '@bopstack/tsconfig',
				sourceFileName: 'tsconfig.base.json',
				targetFileName: 'tsconfig.base.json'
			},
			dryRun: false,
			nodeModulesRoot: modules_root
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(true)
		expect(result!.targetPath).toBe(join(target_dir, 'tsconfig.base.json'))
		expect(existsSync(join(target_dir, 'tsconfig.base.json'))).toBe(true)
	})

	test('copies from src/ candidate', () => {
		create_package_fixture(modules_root, '@bopstack/test-pkg', 'config.json', 'src')
		const result = copy_config_file({
			targetDir: target_dir,
			fileEntry: {
				packageName: '@bopstack/test-pkg',
				sourceFileName: 'config.json',
				targetFileName: 'config.json'
			},
			dryRun: false,
			nodeModulesRoot: modules_root
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(true)
		expect(existsSync(join(target_dir, 'config.json'))).toBe(true)
	})

	test('copies from dist/ candidate', () => {
		create_package_fixture(modules_root, '@bopstack/test-pkg', 'config.json', 'dist')
		const result = copy_config_file({
			targetDir: target_dir,
			fileEntry: {
				packageName: '@bopstack/test-pkg',
				sourceFileName: 'config.json',
				targetFileName: 'config.json'
			},
			dryRun: false,
			nodeModulesRoot: modules_root
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(true)
		expect(existsSync(join(target_dir, 'config.json'))).toBe(true)
	})

	test('prefers root over src over dist candidate', () => {
		// Create all three: should pick root
		const root_path = create_package_fixture(modules_root, '@bopstack/test-pkg', 'config.json', '')
		create_package_fixture(modules_root, '@bopstack/test-pkg', 'config.json', 'src')
		create_package_fixture(modules_root, '@bopstack/test-pkg', 'config.json', 'dist')

		copy_config_file({
			targetDir: target_dir,
			fileEntry: {
				packageName: '@bopstack/test-pkg',
				sourceFileName: 'config.json',
				targetFileName: 'config.json'
			},
			dryRun: false,
			nodeModulesRoot: modules_root
		})

		// Verify content came from root path
		const target_content = readFileSync(join(target_dir, 'config.json'), 'utf-8')
		const root_content = readFileSync(root_path, 'utf-8')
		expect(target_content).toBe(root_content)
	})

	test('returns null when source not found and no existing target', () => {
		const result = copy_config_file({
			targetDir: target_dir,
			fileEntry: {
				packageName: '@bopstack/nonexistent',
				sourceFileName: 'missing.json',
				targetFileName: 'missing.json'
			},
			dryRun: false,
			nodeModulesRoot: modules_root
		})

		expect(result).toBeNull()
	})

	test('returns written=true when source not found but target exists', () => {
		// Create target file first
		writeFileSync(join(target_dir, 'missing.json'), 'existing content', 'utf-8')

		const result = copy_config_file({
			targetDir: target_dir,
			fileEntry: {
				packageName: '@bopstack/nonexistent',
				sourceFileName: 'missing.json',
				targetFileName: 'missing.json'
			},
			dryRun: false,
			nodeModulesRoot: modules_root
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(true)
		expect(result!.existing).toBe(true)
	})

	test('creates nested target directories', () => {
		create_package_fixture(modules_root, '@bopstack/test-pkg', 'config.json', '')
		const nested_target = join(target_dir, 'subdir', 'nested')

		const result = copy_config_file({
			targetDir: nested_target,
			fileEntry: {
				packageName: '@bopstack/test-pkg',
				sourceFileName: 'config.json',
				targetFileName: 'config.json'
			},
			dryRun: false,
			nodeModulesRoot: modules_root
		})

		expect(result).not.toBeNull()
		expect(result!.written).toBe(true)
		expect(existsSync(join(nested_target, 'config.json'))).toBe(true)
	})
})

describe('compute_summary', () => {
	test('counts written, skipped, existing', () => {
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

	test('handles empty results', () => {
		const summary = compute_summary([], 0)
		expect(summary.written).toHaveLength(0)
		expect(summary.skipped).toBe(0)
		expect(summary.existing).toHaveLength(0)
		expect(summary.packageCount).toBe(0)
	})

	test('handles all null results', () => {
		const summary = compute_summary([null, null, null], 5)
		expect(summary.packageCount).toBe(5)
		expect(summary.written).toHaveLength(0)
		expect(summary.skipped).toBe(3)
		expect(summary.existing).toHaveLength(0)
	})

	test('handles dry-run results (written=false, not existing)', () => {
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
