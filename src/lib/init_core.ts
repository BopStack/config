/**
 * Init orchestration core.
 *
 * Pure orchestration with injected dependencies for testability.
 * CLI adapter wires real implementations (fs, spawnSync).
 */

import type { InitArgs, InitError, Result } from './errors.js'
import { copy_config_file, report_summary } from './file_copy.js'
import type { CopyFileResult } from './file_copy.js'
import { get_packages, get_config_files } from './package_selection.js'

/** Dependencies injected into the init orchestrator. */
export interface InitDeps {
	exists: (path: string) => boolean
	install: (packages: string[], target: string) => { status: number | null; stderr: string }
	log: (message: string) => void
	warn: (message: string) => void
}

/** Structured result from a successful init run. */
export interface InitResult {
	packageCount: number
	copyResults: (CopyFileResult | null)[]
}

/**
 * Run the init orchestration with injected dependencies.
 *
 * Validates target, installs packages (unless dry-run), copies config files,
 * and reports summary. Returns structured result on success or a domain error.
 */
export function run_init_core(args: InitArgs, deps: InitDeps): Result<InitResult, InitError> {
	const { target, kind, dryRun } = args

	// Validate target directory exists
	if (!deps.exists(target)) {
		return { ok: false, error: { kind: 'target_missing', target } }
	}

	const packages = get_packages(kind as 'default')
	const configFiles = get_config_files(kind as 'default')

	deps.log(`Initializing @bopstack config in: ${target}`)
	deps.log(`Project kind: ${kind}`)
	deps.log(`Packages to install: ${packages.join(', ')}\n`)

	// Step 1: Install packages (unless dry-run)
	if (!dryRun) {
		deps.log('Installing packages...')
		const installResult = deps.install([...packages], target)
		if (installResult.status !== 0) {
			return {
				ok: false,
				error: {
					kind: 'install_failed',
					stderr: installResult.stderr,
					status: installResult.status
				}
			}
		}
		deps.log('Packages installed successfully.\n')
	} else {
		deps.log('[dry-run] Would install packages via: pnpm add -D ' + packages.join(' ') + '\n')
	}

	// Step 2: Copy config files
	deps.log('Copying config files...')
	const copyResults = configFiles.map((file) =>
		copy_config_file({
			targetDir: target,
			fileEntry: {
				packageName: file.packageName,
				sourceFileName: file.sourceFileName,
				targetFileName: file.targetFileName
			},
			dryRun
		})
	)

	// Step 3: Report summary
	report_summary(copyResults, [...packages])

	return {
		ok: true,
		value: {
			packageCount: packages.length,
			copyResults
		}
	}
}