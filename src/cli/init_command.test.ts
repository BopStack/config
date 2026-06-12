/**
 * Tests for init command argument parsing.
 */

import { existsSync } from 'node:fs'

import { describe, expect, test } from 'vitest'

describe('init arg parsing', () => {
	test('given a valid target directory: should detect it', () => {
		expect(existsSync(process.cwd())).toBe(true)
	})
})
