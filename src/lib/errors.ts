/**
 * Domain error types for bopstack-config operations.
 *
 * Expected init failures are modeled as a discriminated union
 * so parsers and orchestrators can return them without process.exit.
 */

/** Parsed init command arguments. */
export type InitArgs = {
	target: string
	kind: string
	dryRun: boolean
}

/** Expected init failures. */
export type InitError =
	| { kind: 'invalid_project_kind'; value: string | undefined }
	| { kind: 'unknown_arg'; value: string }
	| { kind: 'target_missing'; target: string }
	| { kind: 'install_failed'; stderr: string; status: number | null }

/** Result type for operations that can fail with expected errors. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
