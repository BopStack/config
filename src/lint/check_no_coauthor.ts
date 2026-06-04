/**
 * check-no-coauthor — rejects commit messages that contain `Co-authored-by:` trailers.
 *
 * Reads a commit message file (typically `.git/COMMIT_EDITMSG` or the path passed
 * by a git hook), scans for lines matching `^Co-authored-by:`, and exits non-zero
 * when found. Also warns if `GIT_AUTHOR_NAME` or `GIT_AUTHOR_EMAIL` overrides are
 * detected when no file is provided.
 */

import { existsSync, readFileSync } from 'node:fs'

const CO_AUTHOR_RE = /^Co-authored-by:/m

/**
 * Check a commit message for `Co-authored-by:` trailers.
 *
 * @param filePath — path to the commit message file.
 * @returns `true` if the message is clean (no co-author lines), `false` if rejected.
 */
export function check_no_coauthor(filePath: string): boolean {
	if (!existsSync(filePath)) {
		console.error(`check-no-coauthor: file not found: ${filePath}`)
		return false
	}

	const content = readFileSync(filePath, 'utf-8')

	if (CO_AUTHOR_RE.test(content)) {
		console.error('check-no-coauthor: rejected — commit message contains Co-authored-by: trailer')
		return false
	}

	return true
}
