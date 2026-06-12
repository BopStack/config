/**
 * lint command — handler for `bopstack-config lint <name> [args...]`.
 *
 * Dispatches to named lint checks, returns a result object.
 * The CLI router handles process.exit based on the result.
 */

import { lint_checks, list_checks } from '../lint/index.js'

/** Result from running a lint check. */
export type LintResult = {
	/** Exit code: 0 for pass, 1 for fail/error. */
	code: number
	/** Printable message(s) for the user. */
	messages: string[]
}

/**
 * Run a named lint check.
 *
 * @param raw_args — CLI arguments after `lint` (name + args to pass to the check).
 * @returns a LintResult with exit code and user-facing messages.
 */
export async function lint(raw_args: string[]): Promise<LintResult> {
	const [name, ...args] = raw_args

	// No name → list available checks
	if (!name) {
		return {
			code: 0,
			messages: ['Available lint checks:', list_checks()],
		}
	}

	// Unknown name → error
	const check = lint_checks[name]
	if (!check) {
		return {
			code: 1,
			messages: [`Unknown lint check: '${name}'. Available:`, list_checks()],
		}
	}

	// Known name, no args → show usage
	if (args.length === 0) {
		return {
			code: 1,
			messages: [`Usage: ${check.usage}`],
		}
	}

	// Run the check
	try {
		const result = await Promise.resolve(check.run(...args))
		if (!result) {
			return { code: 1, messages: [] }
		}
		return { code: 0, messages: [] }
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)
		return {
			code: 1,
			messages: [`Lint check '${name}' failed: ${message}`],
		}
	}
}
