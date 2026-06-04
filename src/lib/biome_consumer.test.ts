/**
 * Consumer smoke test: proves that `@bopstack/config/biome` works
 * when extended from a consumer-like project.
 *
 * Creates a temp project with a `biome.json` that extends
 * `@bopstack/config/biome`, runs biome lint on fixture files,
 * and asserts both native and Grit diagnostic categories fire.
 */

import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const BIOME_BIN = join(PACKAGE_DIR, 'node_modules', '.bin', 'biome')

/**
 * Run biome lint in a temp consumer project that extends @bopstack/config/biome.
 * Returns the JSON stdout (empty string if biome crashed).
 */
function run_as_consumer(fixture_code: string, fixture_name: string): string {
	const tmp_dir = mkdtempSync(join(tmpdir(), 'biome-consumer-'))
	try {
		// Set up node_modules/@bopstack/config as a symlink back to the repo
		mkdirSync(join(tmp_dir, 'node_modules', '@bopstack'), { recursive: true })
		// Symlink the package dir so biome can resolve @bopstack/config/biome.json
		symlinkSync(PACKAGE_DIR, join(tmp_dir, 'node_modules', '@bopstack', 'config'), 'dir')

		// Create a consumer biome.json that extends @bopstack/config/biome
		const biome_json = JSON.stringify(
			{
				$schema: 'https://biomejs.dev/schemas/2.4.16/schema.json',
				root: true,
				extends: ['@bopstack/config/biome']
			},
			null,
			2
		)
		writeFileSync(join(tmp_dir, 'biome.json'), biome_json)

		// Write the fixture file
		const fixture_path = join(tmp_dir, 'src', fixture_name)
		mkdirSync(join(tmp_dir, 'src'), { recursive: true })
		writeFileSync(fixture_path, fixture_code, 'utf-8')

		try {
			return execSync(`"${BIOME_BIN}" lint --reporter json "${fixture_path}"`, {
				cwd: tmp_dir,
				encoding: 'utf-8',
				timeout: 15_000
			})
		} catch (e) {
			// biome exits with code 1 when diagnostics are emitted
			const err = e as { stdout?: string; stderr?: string }
			return err.stdout ?? ''
		}
	} finally {
		try {
			execSync(`rm -rf "${tmp_dir}"`, { encoding: 'utf-8', timeout: 5000 })
		} catch {
			// cleanup best-effort
		}
	}
}

describe('consumer extending @bopstack/config/biome', () => {
	it('given a fixture with console.log: should trigger native noConsole diagnostic', () => {
		const code = `console.log("hello");`
		const output = run_as_consumer(code, 'no_console.ts')
		expect(output).toContain('noConsole')
		expect(output).toContain('lint/suspicious/noConsole')
	})

	it('given a fixture with inline if body: should trigger Grit no_inline_if diagnostic', () => {
		const code = `
function example(x: number) {
  if (x > 0) console.log();
}
`
		const output = run_as_consumer(code, 'no_inline_if.ts')
		expect(output).toContain('"category":"plugin"')
		expect(output).toContain('Use braces')
	})

	it('given a fixture with nested if: should trigger Grit max_nesting_depth diagnostic', () => {
		const code = `
function example(x: number, y: number) {
  if (x > 0) {
    if (y > 0) {
      console.log();
    }
  }
}
`
		const output = run_as_consumer(code, 'max_nesting.ts')
		expect(output).toContain('"category":"plugin"')
		expect(output).toContain('Maximum nesting depth')
	})

	it('given a passing fixture (braces on if): should not trigger Grit no_inline_if', () => {
		const code = `
function example(x: number) {
  if (x > 0) {
    console.log();
  }
}
`
		const output = run_as_consumer(code, 'pass_inline_if.ts')
		// The "Use braces" message should NOT appear
		expect(output).not.toContain('Use braces')
		// But native noConsole will still fire
		expect(output).toContain('noConsole')
	})
})
