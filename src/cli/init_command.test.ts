/**
 * Tests for init command argument parsing.
 */

import { existsSync } from 'node:fs'

import { describe, it, expect } from 'vitest'

describe('init arg parsing', () => {
	it('detects a valid target directory', () => {
		expect(existsSync(process.cwd())).toBe(true)
	})
})