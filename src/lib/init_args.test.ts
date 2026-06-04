/**
 * Tests for init argument parsing.
 */

import { describe, expect, test } from 'vitest'

import { parse_init_args } from './init_args.js'

describe('parse_init_args', () => {
	test('defaults target to cwd when no --target', () => {
		const result = parse_init_args([], { cwd: '/tmp/project' })
		expect(result.ok).toBe(true)
		if (!result.ok) {
			return
		}
		expect(result.value.target).toBe('/tmp/project')
		expect(result.value.kind).toBe('default')
		expect(result.value.dryRun).toBe(false)
	})

	test('parses --target argument', () => {
		const result = parse_init_args(['--target=/custom/path'], { cwd: '/tmp/project' })
		expect(result.ok).toBe(true)
		if (!result.ok) {
			return
		}
		expect(result.value.target).toBe('/custom/path')
	})

	test('parses --kind=default', () => {
		const result = parse_init_args(['--kind=default'], { cwd: '/tmp/project' })
		expect(result.ok).toBe(true)
		if (!result.ok) {
			return
		}
		expect(result.value.kind).toBe('default')
	})

	test('parses --dry-run', () => {
		const result = parse_init_args(['--dry-run'], { cwd: '/tmp/project' })
		expect(result.ok).toBe(true)
		if (!result.ok) {
			return
		}
		expect(result.value.dryRun).toBe(true)
	})

	test('rejects unknown project kind', () => {
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

	test('rejects unknown arguments', () => {
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

	test('rejects multiple unknown arguments (first wins)', () => {
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

	test('combines --target, --kind, --dry-run', () => {
		const result = parse_init_args(['--target=/x', '--kind=default', '--dry-run'], {
			cwd: '/tmp/project'
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
