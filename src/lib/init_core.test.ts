/**
 * Tests for init orchestration core.
 */

import { describe, expect, it } from 'vitest'
import type { InitDeps } from './init_core.js'
import { run_init_core } from './init_core.js'

function create_mock_deps(overrides: Partial<InitDeps> = {}): InitDeps {
	const noop = (..._args: unknown[]) => {}
	return {
		exists: () => true,
		install: () => ({ status: 0, stderr: '' }),
		log: noop,
		warn: noop,
		...overrides
	}
}

describe('run_init_core', () => {
	it('returns target_missing error when target does not exist', () => {
		const deps = create_mock_deps({ exists: () => false })
		const result = run_init_core({ target: '/nonexistent', kind: 'default', dryRun: true }, deps)

		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toMatchObject({ kind: 'target_missing', target: '/nonexistent' })
		}
	})

	it('returns install_failed error when install fails', () => {
		const deps = create_mock_deps({
			install: () => ({ status: 42, stderr: 'mock failure' })
		})

		const result = run_init_core({ target: '/tmp/project', kind: 'default', dryRun: false }, deps)

		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toMatchObject({
				kind: 'install_failed',
				stderr: 'mock failure',
				status: 42
			})
		}
	})

	it('returns ok with packageCount on successful dry-run', () => {
		const result = run_init_core(
			{ target: '/tmp/project', kind: 'default', dryRun: true },
			create_mock_deps()
		)

		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.packageCount).toBe(3)
		}
	})

	it('returns ok on successful install', () => {
		const result = run_init_core(
			{ target: '/tmp/project', kind: 'default', dryRun: false },
			create_mock_deps()
		)

		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.packageCount).toBe(3)
		}
	})

	it('calls log and warn deps', () => {
		const logs: string[] = []
		const warns: string[] = []

		const deps = create_mock_deps({
			log: (msg: string) => {
				logs.push(msg)
			},
			warn: (msg: string) => {
				warns.push(msg)
			}
		})

		run_init_core({ target: '/tmp/project', kind: 'default', dryRun: true }, deps)

		expect(logs.length).toBeGreaterThan(0)
		expect(logs.some((l) => l.includes('Initializing @bopstack config'))).toBe(true)
	})
})
