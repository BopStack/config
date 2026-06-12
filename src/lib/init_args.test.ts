/**
 * Tests for init argument parsing.
 */

import { describe, expect, test } from 'vitest'

import { parse_init_args } from './init_args.js'

describe('parse_init_args', () => {
	test('given no --target flag: should default target to cwd', () => {
		const result = parse_init_args([], { cwd: '/tmp/project' })
		expect(result.ok).toBe(true)
		if (!result.ok) {
			return
		}
		expect(result.value.target).toBe('/tmp/project')
		expect(result.value.kind).toBe('default')
		expect(result.value.dryRun).toBe(false)
	})

	test('given --target argument: should parse the target path', () => {
		const result = parse_init_args(['--target=/custom/path'], { cwd: '/tmp/project' })
		expect(result.ok).toBe(true)
		if (!result.ok) {
			return
		}
		expect(result.value.target).toBe('/custom/path')
	})

	test('given --kind=default: should parse the kind', () => {
		const result = parse_init_args(['--kind=default'], { cwd: '/tmp/project' })
		expect(result.ok).toBe(true)
		if (!result.ok) {
			return
		}
		expect(result.value.kind).toBe('default')
	})

	test('given --dry-run flag: should enable dry-run mode', () => {
		const result = parse_init_args(['--dry-run'], { cwd: '/tmp/project' })
		expect(result.ok).toBe(true)
		if (!result.ok) {
			return
		}
		expect(result.value.dryRun).toBe(true)
	})

	test('given an unknown project kind: should reject it', () => {
		const result = parse_init_args(['--kind=bogus'], { cwd: '/tmp/project' })
		expect(result.ok).toBe(false)
		if (result.ok) {
			return
		}
		expect(result.error.kind).toBe('invalid_project_kind')
		if (result.error.kind === 'invalid_project_kind') {
			expect(result.error.value).toBe('bogus')
		}
	})

	test('given an unknown argument: should reject it', () => {
		const result = parse_init_args(['--bogus'], { cwd: '/tmp/project' })
		expect(result.ok).toBe(false)
		if (result.ok) {
			return
		}
		expect(result.error.kind).toBe('unknown_arg')
		if (result.error.kind === 'unknown_arg') {
			expect(result.error.value).toBe('--bogus')
		}
	})

	test('given multiple unknown arguments: should reject with the first one', () => {
		const result = parse_init_args(['--bogus', '--also-bogus'], { cwd: '/tmp/project' })
		expect(result.ok).toBe(false)
		if (result.ok) {
			return
		}
		expect(result.error.kind).toBe('unknown_arg')
		if (result.error.kind === 'unknown_arg') {
			expect(result.error.value).toBe('--bogus')
		}
	})

	test('given --target, --kind, and --dry-run: should combine all options', () => {
		const result = parse_init_args(['--target=/x', '--kind=default', '--dry-run'], {
			cwd: '/tmp/project',
		})
		expect(result.ok).toBe(true)
		if (!result.ok) {
			return
		}
		expect(result.value.target).toBe('/x')
		expect(result.value.kind).toBe('default')
		expect(result.value.dryRun).toBe(true)
	})
})
