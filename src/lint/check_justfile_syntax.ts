/**
 * check-justfile-syntax — validates a justfile by running `just --summary -f <path>`.
 *
 * Exits with code 0 if the justfile parses successfully, or prints the error
 * and exits with a non-zero code on failure.
 */

import { spawnSync } from 'node:child_process'

/**
 * Validate a justfile at the given path.
 *
 * @param filePath — absolute or relative path to a justfile.
 * @returns `true` if the justfile parses cleanly, `false` otherwise.
 */
export function check_justfile_syntax(filePath: string): boolean {
	const result = spawnSync('just', ['--summary', '-f', filePath], {
		stdio: ['ignore', 'pipe', 'pipe'],
	})

	if (result.status === 0) {
		return true
	}

	const stderr = result.stderr?.toString() ?? ''
	console.error(`check-justfile-syntax: invalid justfile at ${filePath}`)
	if (stderr) {
		console.error(stderr)
	}
	return false
}
