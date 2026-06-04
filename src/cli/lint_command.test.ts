/**
 * Tests for the `lint` subcommand dispatch.
 *
 * Tests the lint function directly (returns LintResult, no process.exit).
 */

import { describe, test, expect } from 'vitest'
import { lint } from './lint_command.js'

describe('lint command', () => {
	test('given no arguments: should list available checks', async () => {
		const result = await lint([])

		expect(result.code).toBe(0)
		expect(result.messages[0]).toBe('Available lint checks:')
		expect(result.messages[1]).toMatch(/check-justfile-syntax/)
		expect(result.messages[1]).toMatch(/check-no-coauthor/)
	})

	test('given unknown check name: should error with available list', async () => {
		const result = await lint(['unknown-thing'])

		expect(result.code).toBe(1)
		expect(result.messages[0]).toMatch(/Unknown lint check: 'unknown-thing'/)
	})

	test('given known check without args: should show usage', async () => {
		const result = await lint(['check-justfile-syntax'])

		expect(result.code).toBe(1)
		expect(result.messages[0]).toMatch(/Usage: bopstack-config lint check-justfile-syntax/)
	})

	test('given valid check with clean args: should exit 0', async () => {
		const result = await lint(['check-no-coauthor', './tmp/fixtures/commit_msg_clean.txt'])

		expect(result.code).toBe(0)
	})
})
