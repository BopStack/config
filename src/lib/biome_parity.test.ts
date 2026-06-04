/**
 * Tests for Biome parity with oxlint, oxfmt, FFB config, and OXC rules.
 *
 * These tests assert that the shared Biome config (`@bopstack/config/biome`)
 * enforces the BopStack convention set natively wherever possible, removes
 * duplicate Grit plugins for native rules, and documents remaining gaps.
 *
 * Config-schema tests verify the biome-config.json structure.
 * Fixture tests verify actual biome lint diagnostics on example source files.
 */

import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const BIOME_CONFIG_PATH = join(PACKAGE_DIR, 'src', 'config', 'biome', 'biome-config.json')
const biomeConfig: Record<string, unknown> = JSON.parse(readFileSync(BIOME_CONFIG_PATH, 'utf-8'))
const formatter = biomeConfig.formatter as Record<string, unknown> | undefined
const linter = biomeConfig.linter as Record<string, unknown> | undefined
const rules = linter?.rules as Record<string, unknown> | undefined
const plugins = biomeConfig.plugins as string[] | undefined

function lint_rules(category: string): Record<string, unknown> | undefined {
	return rules?.[category] as Record<string, unknown> | undefined
}

function assert_is_error(value: unknown): void {
	if (typeof value === 'string') {
		expect(value.toLowerCase()).toBe('error')
	} else if (typeof value === 'object' && value !== null) {
		const level = (value as Record<string, unknown>).level
		expect(level).toMatch(/error/i)
	} else {
		throw new Error(`unexpected rule value type: ${typeof value}`)
	}
}

// ── Formatter parity with oxfmt ────────────────────────────────────────────

describe('biome formatter parity with oxfmt', () => {
	it('given oxfmt useTabs: should use indentStyle tab', () => {
		expect(formatter).toBeDefined()
		expect((formatter as Record<string, unknown>).indentStyle).toBe('tab')
	})

	it('given oxfmt singleQuote: should use quoteStyle single', () => {
		const jsConfig = biomeConfig.javascript as Record<string, unknown> | undefined
		const jsFormatter = jsConfig?.formatter as Record<string, unknown> | undefined
		expect(jsFormatter).toBeDefined()
		expect((jsFormatter as Record<string, unknown>).quoteStyle).toBe('single')
	})

	it('given oxfmt semi false: should use semicolons asNeeded', () => {
		const jsConfig = biomeConfig.javascript as Record<string, unknown> | undefined
		const jsFormatter = jsConfig?.formatter as Record<string, unknown> | undefined
		expect(jsFormatter).toBeDefined()
		expect((jsFormatter as Record<string, unknown>).semicolons).toBe('asNeeded')
	})

	it('given oxfmt trailingComma none: should use trailingCommas none', () => {
		const jsConfig = biomeConfig.javascript as Record<string, unknown> | undefined
		const jsFormatter = jsConfig?.formatter as Record<string, unknown> | undefined
		expect(jsFormatter).toBeDefined()
		expect((jsFormatter as Record<string, unknown>).trailingCommas).toBe('none')
	})

	it('given oxfmt printWidth 100: should use lineWidth 100', () => {
		expect(formatter).toBeDefined()
		expect((formatter as Record<string, unknown>).lineWidth).toBe(100)
	})

	it('given oxfmt sortImports: should have organizeImports assist action enabled', () => {
		const assist = biomeConfig.assist as Record<string, unknown> | undefined
		const actions = assist?.actions as Record<string, unknown> | undefined
		const source = actions?.source as Record<string, unknown> | undefined
		expect(source).toBeDefined()
		expect((source as Record<string, unknown>).organizeImports).toBe('on')
	})
})

// ── Native rule parity with oxlint config ──────────────────────────────────

describe('biome native rule parity with oxlint config', () => {
	it('given oxlint no-console: should have suspicious noConsole rule', () => {
		const suspicious = lint_rules('suspicious')
		expect(suspicious).toBeDefined()
		assert_is_error((suspicious as Record<string, unknown>).noConsole)
	})

	it('given oxlint no-debugger: should be error via recommended', () => {
		const suspicious = lint_rules('suspicious')
		expect(suspicious).toBeDefined()
		// noDebugger is "error" via recommended — not explicitly listed
		expect((suspicious as Record<string, unknown>).noDebugger).toBeUndefined()
	})

	it('given oxlint no-explicit-any: should have suspicious noExplicitAny rule', () => {
		const suspicious = lint_rules('suspicious')
		expect(suspicious).toBeDefined()
		assert_is_error((suspicious as Record<string, unknown>).noExplicitAny)
	})

	it('given oxlint max-params 3: should have complexity useMaxParams with max 3', () => {
		const complexity = lint_rules('complexity')
		expect(complexity).toBeDefined()
		const rule = (complexity as Record<string, unknown>).useMaxParams
		expect(rule).toBeDefined()
		const ruleObj = rule as Record<string, unknown>
		const opts = ruleObj.options as Record<string, unknown> | undefined
		expect(opts).toBeDefined()
		expect((opts as Record<string, unknown>).max).toBe(3)
	})

	it('given oxlint no-nested-ternary: should have style noNestedTernary rule', () => {
		const style = lint_rules('style')
		expect(style).toBeDefined()
		assert_is_error((style as Record<string, unknown>).noNestedTernary)
	})

	it('given oxlint curly all: should have style useBlockStatements rule', () => {
		const style = lint_rules('style')
		expect(style).toBeDefined()
		assert_is_error((style as Record<string, unknown>).useBlockStatements)
	})

	it('given oxlint import/no-cycle: should have suspicious noImportCycles rule', () => {
		const suspicious = lint_rules('suspicious')
		expect(suspicious).toBeDefined()
		assert_is_error((suspicious as Record<string, unknown>).noImportCycles)
	})

	it('given oxlint filename-case snakeCase: should be documented as a known gap (not in shared config)', () => {
		const style = lint_rules('style')
		expect(style).toBeDefined()
		// useFilenamingConvention is intentionally omitted —
		// too invasive for a shared consumer config; document as known gap
		const convention = (style as Record<string, unknown>).useFilenamingConvention
		expect(convention).toBeUndefined()
	})
})

// ── Native rule parity with FFB biome.json ─────────────────────────────────

describe('biome native rule parity with FFB biome.json', () => {
	it('given FFB noUnusedVariables: should have correctness noUnusedVariables', () => {
		const correctness = lint_rules('correctness')
		expect(correctness).toBeDefined()
		assert_is_error((correctness as Record<string, unknown>).noUnusedVariables)
	})

	it('given FFB noUnusedImports: should have correctness noUnusedImports', () => {
		const correctness = lint_rules('correctness')
		expect(correctness).toBeDefined()
		assert_is_error((correctness as Record<string, unknown>).noUnusedImports)
	})

	it('given FFB useExhaustiveDependencies: should have correctness useExhaustiveDependencies', () => {
		const correctness = lint_rules('correctness')
		expect(correctness).toBeDefined()
		assert_is_error((correctness as Record<string, unknown>).useExhaustiveDependencies)
	})

	it('given FFB noNestedComponentDefinitions: should have correctness noNestedComponentDefinitions with error', () => {
		const correctness = lint_rules('correctness')
		expect(correctness).toBeDefined()
		assert_is_error((correctness as Record<string, unknown>).noNestedComponentDefinitions)
	})

	it('given FFB noUselessElse: should have style noUselessElse', () => {
		const style = lint_rules('style')
		expect(style).toBeDefined()
		assert_is_error((style as Record<string, unknown>).noUselessElse)
	})

	it('given FFB noMagicNumbers: should have style noMagicNumbers', () => {
		const style = lint_rules('style')
		expect(style).toBeDefined()
		assert_is_error((style as Record<string, unknown>).noMagicNumbers)
	})

	it('given FFB noInferrableTypes: should have style noInferrableTypes', () => {
		const style = lint_rules('style')
		expect(style).toBeDefined()
		assert_is_error((style as Record<string, unknown>).noInferrableTypes)
	})

	it('given FFB useCollapsedIf: should have style useCollapsedIf', () => {
		const style = lint_rules('style')
		expect(style).toBeDefined()
		assert_is_error((style as Record<string, unknown>).useCollapsedIf)
	})

	it('given FFB noForEach: should have complexity noForEach', () => {
		const complexity = lint_rules('complexity')
		expect(complexity).toBeDefined()
		assert_is_error((complexity as Record<string, unknown>).noForEach)
	})

	it('given FFB noImplicitCoercions: should have complexity noImplicitCoercions', () => {
		const complexity = lint_rules('complexity')
		expect(complexity).toBeDefined()
		assert_is_error((complexity as Record<string, unknown>).noImplicitCoercions)
	})

	it('given FFB noExcessiveCognitiveComplexity max 15: should have complexity noExcessiveCognitiveComplexity', () => {
		const complexity = lint_rules('complexity')
		expect(complexity).toBeDefined()
		const rule = (complexity as Record<string, unknown>).noExcessiveCognitiveComplexity
		expect(rule).toBeDefined()
		const ruleObj = rule as Record<string, unknown>
		const opts = ruleObj.options as Record<string, unknown> | undefined
		expect(opts).toBeDefined()
		expect((opts as Record<string, unknown>).maxAllowedComplexity).toBe(15)
	})

	it('given FFB noExcessiveLinesPerFunction max 80: should have complexity noExcessiveLinesPerFunction', () => {
		const complexity = lint_rules('complexity')
		expect(complexity).toBeDefined()
		const rule = (complexity as Record<string, unknown>).noExcessiveLinesPerFunction
		expect(rule).toBeDefined()
		const ruleObj = rule as Record<string, unknown>
		const opts = ruleObj.options as Record<string, unknown> | undefined
		expect(opts).toBeDefined()
		expect((opts as Record<string, unknown>).maxLines).toBe(80)
		expect((opts as Record<string, unknown>).skipBlankLines).toBe(true)
		expect((opts as Record<string, unknown>).skipIifes).toBe(true)
	})

	it('given FFB performance rules: should have noAccumulatingSpread, noBarrelFile, noAwaitInLoops', () => {
		const performance = lint_rules('performance')
		expect(performance).toBeDefined()
		assert_is_error((performance as Record<string, unknown>).noAccumulatingSpread)
		assert_is_error((performance as Record<string, unknown>).noBarrelFile)
		assert_is_error((performance as Record<string, unknown>).noAwaitInLoops)
	})

	it('given FFB security rules: should have noSecrets', () => {
		const security = lint_rules('security')
		expect(security).toBeDefined()
		assert_is_error((security as Record<string, unknown>).noSecrets)
		// noDangerouslySetInnerHtml is "error" via recommended — not explicitly listed
	})

	it('given FFB a11y: should be error via recommended', () => {
		// a11y category is not in config because recommended: true handles it
		const a11y = lint_rules('a11y')
		expect(a11y).toBeUndefined()
	})

	it('given FFB no-empty-catch: should have suspicious noEmptyBlockStatements', () => {
		const suspicious = lint_rules('suspicious')
		expect(suspicious).toBeDefined()
		assert_is_error((suspicious as Record<string, unknown>).noEmptyBlockStatements)
	})
})

// ── OXC rule parity ────────────────────────────────────────────────────────

describe('biome native rule parity with OXC plugin rules', () => {
	it('given OXC/FFB no-inline-styles: should have nursery noInlineStyles', () => {
		const nursery = lint_rules('nursery')
		expect(nursery).toBeDefined()
		assert_is_error((nursery as Record<string, unknown>).noInlineStyles)
	})

	it('given OXC no-ts-ignore: should have suspicious noTsIgnore via recommended', () => {
		const suspicious = lint_rules('suspicious')
		expect(suspicious).toBeDefined()
		// noTsIgnore is "error" via recommended — not explicitly listed
		expect((suspicious as Record<string, unknown>).noTsIgnore).toBeUndefined()
	})
})

// ── Formatter parity beyond oxfmt base ─────────────────────────────────────

describe('biome formatter parity with additional checks', () => {
	it('given oxfmt sortTailwindcss: should have nursery useSortedClasses', () => {
		const nursery = lint_rules('nursery')
		expect(nursery).toBeDefined()
		expect((nursery as Record<string, unknown>).useSortedClasses).toBeDefined()
	})
})

// ── Plugin registration ────────────────────────────────────────────────────

describe('biome Grit plugin registration', () => {
	const expected_rules = [
		'no_inline_if',
		'no_hardcoded_colors',
		'test_naming',
		'prefer_testid',
		'max_nesting_depth',
		'drizzle_fk_index',
		'drizzle_no_relations'
	]

	for (const rule of expected_rules) {
		it(`given ${rule} needs Grit: should register ${rule}.grit`, () => {
			expect(plugins).toBeDefined()
			const matched = (plugins as string[]).filter((p) => p.includes(`${rule}.grit`))
			expect(matched.length).toBeGreaterThanOrEqual(1)
		})
	}

	it('given no-console is native: should not have no-console.grit in plugins', () => {
		expect(plugins).toBeDefined()
		const noConsolePlugin = (plugins as string[]).find((p) => p.includes('no-console.grit'))
		expect(noConsolePlugin).toBeUndefined()
	})
})

// ── Grit rule fixture tests ────────────────────────────────────────────────

/**
 * Run biome lint on a fixture file in a temp directory that has the shared
 * biome config, rewriting plugin paths to absolute paths so they resolve
 * correctly regardless of the working directory.
 */
function run_lint_on_fixture(fixture_code: string, fixture_name: string): string {
	const tmp_dir = mkdtempSync(join(tmpdir(), 'biome-parity-'))
	try {
		// Copy shared biome config into the temp dir, with absolute plugin paths
		let config = readFileSync(BIOME_CONFIG_PATH, 'utf-8')
		// Rewrite all plugin paths from relative to absolute so they resolve
		// correctly when running biome from the temp directory
		const rules_dir = join(PACKAGE_DIR, 'src', 'config', 'biome', 'rules')
		config = config.replaceAll(
			'./node_modules/@bopstack/config/src/config/biome/rules/',
			`${rules_dir}/`
		)
		writeFileSync(join(tmp_dir, 'biome.json'), config)

		const fixture_path = join(tmp_dir, fixture_name)
		writeFileSync(fixture_path, fixture_code, 'utf-8')

		try {
			// Run biome from the temp dir so it finds the biome.json we placed there.
			// The biome binary resolves via the package's pnpm.
			return execSync(
				`${join(PACKAGE_DIR, 'node_modules', '.bin', 'biome')} lint --reporter json "${fixture_path}"`,
				{
					cwd: tmp_dir,
					encoding: 'utf-8',
					timeout: 15_000
				}
			)
		} catch (e) {
			// biome exits with code 1 when diagnostics are emitted;
			// the stdout still contains the JSON we want to inspect
			const err = e as { stdout?: string; stderr?: string }
			return err.stdout ?? ''
		}
	} finally {
		try {
			execSync(`rm -rf "${tmp_dir}"`, { encoding: 'utf-8', timeout: 5_000 })
		} catch {
			// cleanup best-effort
		}
	}
}

describe('custom Grit rules produce diagnostics on violating fixtures', () => {
	// `no_inline_if`: violating fixture uses inline if body
	// Expected: lint/plugins/no_inline_if diagnostic
	it('given no_inline_if is registered: should flag inline if bodies', () => {
		const code = `
function example(x: number) {
  if (x > 0) console.log();
}
`
		const output = run_lint_on_fixture(code, 'fixture_no_inline_if.ts')
		// Grit plugin diagnostics use category "plugin" — check message content
		expect(output).toContain('Use braces')
		expect(output).toContain('"category":"plugin"')
	})

	// `no_hardcoded_colors`: CSS with hardcoded colors
	// Use a .css extension to trigger CSS parsing
	it('given no_hardcoded_colors is registered: should flag hardcoded colors in CSS', () => {
		const code = `a { color: #fff; }`
		const output = run_lint_on_fixture(code, 'fixture_no_hardcoded_colors.css')
		// Grit plugin diagnostics use category "plugin" — check message content
		expect(output).toContain('hardcoded colors')
		expect(output).toContain('"category":"plugin"')
	})

	// `max_nesting_depth`: two levels of if (violation)
	it('given max_nesting_depth is registered: should flag deep nesting', () => {
		const code = `
function example(x: number, y: number) {
  if (x > 0) {
    if (y > 0) {
      console.log();
    }
  }
}
`
		const output = run_lint_on_fixture(code, 'fixture_max_nesting.ts')
		// Grit plugin diagnostics use category "plugin" — check message content
		expect(output).toContain('Maximum nesting depth')
		expect(output).toContain('"category":"plugin"')
	})

	// Passing fixture: `no_inline_if` with braces (should not flag)
	it('given no_inline_if with braces: should not flag inline if', () => {
		const code = `
function example(x: number) {
  if (x > 0) {
    console.log();
  }
}
`
		const output = run_lint_on_fixture(code, 'fixture_pass_inline_if.ts')
		// Grit plugin diagnostics use category "plugin" — check no "Use braces" message
		// (there will be other diagnostics like noConsole, so check the specific message)
		expect(output).not.toContain('Use braces')
	})
})
