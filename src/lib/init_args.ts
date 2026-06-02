/**
 * Init argument parsing.
 *
 * Pure function that returns typed results for testability.
 * CLI adapter maps results to process behavior (exit codes, stderr).
 */

import { type } from 'arktype'

import type { InitArgs, InitError, Result } from './errors.js'
import { ProjectKindSchema } from './package_selection.js'

/**
 * Parse and validate init command arguments.
 *
 * @param rawArgs - Raw CLI argument strings (after subcommand)
 * @param options - Context options (cwd for default target)
 * @returns Ok with parsed args or Err with a domain error
 */
export function parse_init_args(
	rawArgs: string[],
	options: { cwd: string }
): Result<InitArgs, InitError> {
	let target: string | undefined
	let kind: string | undefined
	let dryRun = false

	for (const arg of rawArgs) {
		if (arg.startsWith('--target=')) {
			target = arg.slice('--target='.length)
		} else if (arg.startsWith('--kind=')) {
			kind = arg.slice('--kind='.length)
		} else if (arg === '--dry-run') {
			dryRun = true
		} else {
			// Strict unknown-arg behavior
			return { ok: false, error: { kind: 'unknown_arg', value: arg } }
		}
	}

	const kindStr = kind ?? 'default'
	const kindResult = ProjectKindSchema(kindStr)
	if (kindResult instanceof type.errors) {
		return { ok: false, error: { kind: 'invalid_project_kind', value: kind } }
	}

	return {
		ok: true,
		value: {
			target: target ?? options.cwd,
			kind: kindStr,
			dryRun
		}
	}
}
