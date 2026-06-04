import { describe, test, expect } from 'vitest'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { check_justfile_syntax } from './check_justfile_syntax.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesDir = join(__dirname, '..', '..', 'tmp', 'fixtures')

describe('check_justfile_syntax', () => {
	test('given a valid justfile: should return true', () => {
		const result = check_justfile_syntax(join(fixturesDir, 'valid_justfile'))
		expect(result).toBe(true)
	})

	test('given an invalid justfile: should return false', () => {
		const result = check_justfile_syntax(join(fixturesDir, 'invalid_justfile'))
		expect(result).toBe(false)
	})

	test('given a non-existent path: should return false', () => {
		const result = check_justfile_syntax('/nonexistent/justfile')
		expect(result).toBe(false)
	})
})
