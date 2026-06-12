/**
 * Custom lint check registry for @bopstack/config.
 *
 * Defines the `LintCheck` interface and maps check names to their
 * handler functions. New lint checks register here.
 */

import { check_justfile_syntax } from './check_justfile_syntax.js'
import { check_no_coauthor } from './check_no_coauthor.js'

/** A named lint check that can be run via `bopstack-config lint <name>`. */
export type LintCheck = {
	/** Short one-liner describing what this check does. */
	description: string
	/** Usage string shown when args are missing. */
	usage: string
	/** Run the check with the given positional arguments. */
	run: (...args: string[]) => boolean | Promise<boolean>
}

/** Registry of all available lint checks, keyed by lowercase kebab-case name. */
export const lint_checks: Record<string, LintCheck> = {
	'check-justfile-syntax': {
		description: 'Validate a justfile using `just --summary`',
		usage: 'bopstack-config lint check-justfile-syntax <path-to-justfile>',
		run: (filePath: string) => check_justfile_syntax(filePath),
	},
	'check-no-coauthor': {
		description: 'Reject commit messages containing Co-authored-by: trailers',
		usage: 'bopstack-config lint check-no-coauthor <path-to-commit-message>',
		run: (filePath: string) => check_no_coauthor(filePath),
	},
}

/**
 * Return a formatted listing of available lint checks.
 */
export function list_checks(): string {
	return Object.entries(lint_checks)
		.map(([name, check]) => `  ${name}  — ${check.description}`)
		.join('\n')
}
