/**
 * init command — process adapter for @bopstack/config init.
 *
 * Wires real dependencies (fs, child_process, console) and maps
 * domain errors to stderr messages and exit codes.
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { exit } from 'node:process'

import type { InitError } from '../lib/errors.js'
import { parse_init_args } from '../lib/init_args.js'
import { run_init_core } from '../lib/init_core.js'

/**
 * Map a domain error to a user-facing stderr message.
 */
function report_error(error: InitError): void {
	switch (error.kind) {
		case 'invalid_project_kind':
			console.error(`Invalid project kind: ${error.value}`)
			break
		case 'unknown_arg':
			console.error(`Unknown argument: ${error.value}`)
			console.error('Run `bopstack-config --help` for usage.')
			break
		case 'target_missing':
			console.error(`Target directory does not exist: ${error.target}`)
			break
		case 'install_failed':
			console.error('Package installation failed:')
			console.error(error.stderr)
			break
		default:
			console.error(`Unhandled error kind: ${error satisfies never}`)
	}
}

/**
 * Real install function using spawnSync.
 */
function install_packages(
	packages: string[],
	target: string
): { status: number | null; stderr: string } {
	const result = spawnSync('pnpm', ['add', '-D', ...packages], {
		cwd: target,
		stdio: ['ignore', 'pipe', 'pipe']
	})

	return {
		status: result.status,
		stderr: result.stderr?.toString() ?? ''
	}
}

/**
 * Init command handler — entry point from CLI router.
 */
export async function init(raw_args: string[]): Promise<void> {
	const parsed = parse_init_args(raw_args, { cwd: process.cwd() })

	if (!parsed.ok) {
		report_error(parsed.error)
		exit(1)
		return
	}

	const result = run_init_core(parsed.value, {
		exists: existsSync,
		install: install_packages,
		log: console.log,
		warn: console.warn
	})

	if (!result.ok) {
		report_error(result.error)
		exit(1)
		return
	}
}
