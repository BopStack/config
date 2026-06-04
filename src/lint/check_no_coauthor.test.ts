import { describe, test, expect } from 'vitest'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { check_no_coauthor } from './check_no_coauthor.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesDir = join(__dirname, '..', '..', 'tmp', 'fixtures')

describe('check_no_coauthor', () => {
	test('given commit with Co-authored-by: should reject', () => {
		const result = check_no_coauthor(join(fixturesDir, 'commit_msg_with_coauthor.txt'))
		expect(result).toBe(false)
	})

	test('given clean commit: should pass', () => {
		const result = check_no_coauthor(join(fixturesDir, 'commit_msg_clean.txt'))
		expect(result).toBe(true)
	})

	test('given non-existent file: should return false', () => {
		const result = check_no_coauthor('/nonexistent/commit_msg.txt')
		expect(result).toBe(false)
	})
})
