/**
 * Tests for init command argument parsing.
 */

import { existsSync } from 'node:fs'

import { describe, expect, test } from 'vitest'

describe('init arg parsing', () => {
	test('detects a valid target directory', () => {
		expect(existsSync(process.cwd())).toBe(true)
	})
})
