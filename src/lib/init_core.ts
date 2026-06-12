/**
 * Init orchestration core.
 *
 * Pure orchestration with injected dependencies for testability.
 * CLI adapter wires real implementations (fs, spawnSync).
 */

import type { InitArgs, InitError, Result } from './errors.js'
import { get_config_files, get_packages } from './package_selection.js'
import type { GenerateShimResult } from './shim_generator.js'
import { generate_config } from './shim_generator.js'

/** Dependencies injected into the init orchestrator. */
export type InitDeps = {
	exists: (path: string) => boolean
	install: (packages: string[], target: string) => { status: number | null; stderr: string }
	log: (message: string) => void
	warn: (message: string) => void
}

/** Structured result from a successful init run. */
export type InitResult = {
	packageCount: number
	copyResults: (GenerateShimResult | null)[]
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
	const shimEntries = get_config_files(kind as 'default')

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
					status: installResult.status,
				},
			}
		}
		deps.log('Packages installed successfully.\n')
	} else {
		deps.log(`[dry-run] Would install packages via: pnpm add -D ${packages.join(' ')}\n`)
	}

	// Step 2: Generate config shim files
	deps.log('Generating config shim files...')
	const copyResults = shimEntries.map((entry) => {
		const result = generate_config({
			targetDir: target,
			fileEntry: entry,
			dryRun,
		})

		let label: string
		if (result.written) {
			label = '  ✓'
		} else if (dryRun) {
			label = '  [dry-run]'
		} else {
			label = '  -'
		}
		deps.log(`${label} ${result.targetPath}`)

		return result
	})

	// Step 3: Print summary
	const written = copyResults.filter((r) => r?.written).length
	deps.log(`\n--- Summary ---`)
	deps.log(`  Packages installed: ${packages.length}`)
	deps.log(`  Config files written: ${written}`)

	return {
		ok: true,
		value: {
			packageCount: packages.length,
			copyResults,
		},
	}
}
