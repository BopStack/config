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
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const BIOME_CONFIG_PATH = join(PACKAGE_DIR, 'src', 'config', 'biome', 'biome-config.json')
const biome_config: Record<string, unknown> = JSON.parse(readFileSync(BIOME_CONFIG_PATH, 'utf-8'))
const formatter = biome_config.formatter as Record<string, unknown> | undefined
const linter = biome_config.linter as Record<string, unknown> | undefined
const rules = linter?.rules as Record<string, unknown> | undefined
const plugins = biome_config.plugins as string[] | undefined

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
	test('given oxfmt useTabs: should use indentStyle tab', () => {
		expect(formatter).toBeDefined()
		expect((formatter as Record<string, unknown>).indentStyle).toBe('tab')
	})

	test('given oxfmt singleQuote: should use quoteStyle single', () => {
		const js_config = biome_config.javascript as Record<string, unknown> | undefined
		const js_formatter = js_config?.formatter as Record<string, unknown> | undefined
		expect(js_formatter).toBeDefined()
		expect((js_formatter as Record<string, unknown>).quoteStyle).toBe('single')
	})

	test('given oxfmt semi false: should use semicolons asNeeded', () => {
		const js_config = biome_config.javascript as Record<string, unknown> | undefined
		const js_formatter = js_config?.formatter as Record<string, unknown> | undefined
		expect(js_formatter).toBeDefined()
		expect((js_formatter as Record<string, unknown>).semicolons).toBe('asNeeded')
	})

	test('given oxfmt trailingComma all: should use trailingCommas all', () => {
		const js_config = biome_config.javascript as Record<string, unknown> | undefined
		const js_formatter = js_config?.formatter as Record<string, unknown> | undefined
		expect(js_formatter).toBeDefined()
		expect((js_formatter as Record<string, unknown>).trailingCommas).toBe('all')
	})

	test('given oxfmt printWidth 100: should use lineWidth 100', () => {
		expect(formatter).toBeDefined()
		expect((formatter as Record<string, unknown>).lineWidth).toBe(100)
	})

	test('given oxfmt sortImports: should have organizeImports assist action enabled', () => {
		const assist = biome_config.assist as Record<string, unknown> | undefined
		const actions = assist?.actions as Record<string, unknown> | undefined
		const source = actions?.source as Record<string, unknown> | undefined
		expect(source).toBeDefined()
		expect((source as Record<string, unknown>).organizeImports).toBe('on')
	})
})

// ── Native rule parity with oxlint config ──────────────────────────────────

describe('biome native rule parity with oxlint config', () => {
	test('given oxlint no-console: should have suspicious noConsole rule', () => {
		const suspicious = lint_rules('suspicious')
		expect(suspicious).toBeDefined()
		assert_is_error((suspicious as Record<string, unknown>).noConsole)
	})

	test('given oxlint no-debugger: should be error via recommended', () => {
		const suspicious = lint_rules('suspicious')
		expect(suspicious).toBeDefined()
		// noDebugger is "error" via recommended — not explicitly listed
		expect((suspicious as Record<string, unknown>).noDebugger).toBeUndefined()
	})

	test('given oxlint no-explicit-any: should have suspicious noExplicitAny rule', () => {
		const suspicious = lint_rules('suspicious')
		expect(suspicious).toBeDefined()
		assert_is_error((suspicious as Record<string, unknown>).noExplicitAny)
	})

	test('given oxlint max-params 3: should have complexity useMaxParams with max 3', () => {
		const complexity = lint_rules('complexity')
		expect(complexity).toBeDefined()
		const rule = (complexity as Record<string, unknown>).useMaxParams
		expect(rule).toBeDefined()
		const rule_obj = rule as Record<string, unknown>
		const opts = rule_obj.options as Record<string, unknown> | undefined
		expect(opts).toBeDefined()
		expect((opts as Record<string, unknown>).max).toBe(3)
	})

	test('given oxlint no-nested-ternary: should have style noNestedTernary rule', () => {
		const style = lint_rules('style')
		expect(style).toBeDefined()
		assert_is_error((style as Record<string, unknown>).noNestedTernary)
	})

	test('given oxlint curly all: should have style useBlockStatements rule', () => {
		const style = lint_rules('style')
		expect(style).toBeDefined()
		assert_is_error((style as Record<string, unknown>).useBlockStatements)
	})

	test('given oxlint import/no-cycle: should have suspicious noImportCycles rule', () => {
		const suspicious = lint_rules('suspicious')
		expect(suspicious).toBeDefined()
		assert_is_error((suspicious as Record<string, unknown>).noImportCycles)
	})

	test('given oxlint filename-case snakeCase: should be documented as a known gap (not in shared config)', () => {
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
	test('given FFB noUnusedVariables: should have correctness noUnusedVariables', () => {
		const correctness = lint_rules('correctness')
		expect(correctness).toBeDefined()
		assert_is_error((correctness as Record<string, unknown>).noUnusedVariables)
	})

	test('given FFB noUnusedImports: should have correctness noUnusedImports', () => {
		const correctness = lint_rules('correctness')
		expect(correctness).toBeDefined()
		assert_is_error((correctness as Record<string, unknown>).noUnusedImports)
	})

	test('given FFB useExhaustiveDependencies: should have correctness useExhaustiveDependencies', () => {
		const correctness = lint_rules('correctness')
		expect(correctness).toBeDefined()
		assert_is_error((correctness as Record<string, unknown>).useExhaustiveDependencies)
	})

	test('given FFB noNestedComponentDefinitions: should have correctness noNestedComponentDefinitions with error', () => {
		const correctness = lint_rules('correctness')
		expect(correctness).toBeDefined()
		assert_is_error((correctness as Record<string, unknown>).noNestedComponentDefinitions)
	})

	test('given FFB noUselessElse: should have style noUselessElse', () => {
		const style = lint_rules('style')
		expect(style).toBeDefined()
		assert_is_error((style as Record<string, unknown>).noUselessElse)
	})

	test('given FFB noMagicNumbers: should have style noMagicNumbers', () => {
		const style = lint_rules('style')
		expect(style).toBeDefined()
		assert_is_error((style as Record<string, unknown>).noMagicNumbers)
	})

	test('given FFB noInferrableTypes: should have style noInferrableTypes', () => {
		const style = lint_rules('style')
		expect(style).toBeDefined()
		assert_is_error((style as Record<string, unknown>).noInferrableTypes)
	})

	test('given FFB useCollapsedIf: should have style useCollapsedIf', () => {
		const style = lint_rules('style')
		expect(style).toBeDefined()
		assert_is_error((style as Record<string, unknown>).useCollapsedIf)
	})

	test('given FFB noForEach: should have complexity noForEach', () => {
		const complexity = lint_rules('complexity')
		expect(complexity).toBeDefined()
		assert_is_error((complexity as Record<string, unknown>).noForEach)
	})

	test('given FFB noImplicitCoercions: should have complexity noImplicitCoercions', () => {
		const complexity = lint_rules('complexity')
		expect(complexity).toBeDefined()
		assert_is_error((complexity as Record<string, unknown>).noImplicitCoercions)
	})

	test('given FFB noExcessiveCognitiveComplexity max 15: should have complexity noExcessiveCognitiveComplexity', () => {
		const complexity = lint_rules('complexity')
		expect(complexity).toBeDefined()
		const rule = (complexity as Record<string, unknown>).noExcessiveCognitiveComplexity
		expect(rule).toBeDefined()
		const rule_obj = rule as Record<string, unknown>
		const opts = rule_obj.options as Record<string, unknown> | undefined
		expect(opts).toBeDefined()
		expect((opts as Record<string, unknown>).maxAllowedComplexity).toBe(15)
	})

	test('given FFB noExcessiveLinesPerFunction max 80: should have complexity noExcessiveLinesPerFunction', () => {
		const complexity = lint_rules('complexity')
		expect(complexity).toBeDefined()
		const rule = (complexity as Record<string, unknown>).noExcessiveLinesPerFunction
		expect(rule).toBeDefined()
		const rule_obj = rule as Record<string, unknown>
		const opts = rule_obj.options as Record<string, unknown> | undefined
		expect(opts).toBeDefined()
		expect((opts as Record<string, unknown>).maxLines).toBe(80)
		expect((opts as Record<string, unknown>).skipBlankLines).toBe(true)
		expect((opts as Record<string, unknown>).skipIifes).toBe(true)
	})

	test('given FFB performance rules: should have noAccumulatingSpread, noBarrelFile, noAwaitInLoops', () => {
		const performance = lint_rules('performance')
		expect(performance).toBeDefined()
		assert_is_error((performance as Record<string, unknown>).noAccumulatingSpread)
		assert_is_error((performance as Record<string, unknown>).noBarrelFile)
		assert_is_error((performance as Record<string, unknown>).noAwaitInLoops)
	})

	test('given FFB security rules: should have noSecrets', () => {
		const security = lint_rules('security')
		expect(security).toBeDefined()
		assert_is_error((security as Record<string, unknown>).noSecrets)
		// noDangerouslySetInnerHtml is "error" via recommended — not explicitly listed
	})

	test('given FFB a11y: should be error via recommended', () => {
		// a11y category is not in config because recommended: true handles it
		const a11y = lint_rules('a11y')
		expect(a11y).toBeUndefined()
	})

	test('given FFB no-empty-catch: should have suspicious noEmptyBlockStatements', () => {
		const suspicious = lint_rules('suspicious')
		expect(suspicious).toBeDefined()
		assert_is_error((suspicious as Record<string, unknown>).noEmptyBlockStatements)
	})
})

// ── OXC rule parity ────────────────────────────────────────────────────────

describe('biome native rule parity with OXC plugin rules', () => {
	test('given OXC/FFB no-inline-styles: should have nursery noInlineStyles', () => {
		const nursery = lint_rules('nursery')
		expect(nursery).toBeDefined()
		assert_is_error((nursery as Record<string, unknown>).noInlineStyles)
	})

	test('given OXC no-ts-ignore: should have suspicious noTsIgnore via recommended', () => {
		const suspicious = lint_rules('suspicious')
		expect(suspicious).toBeDefined()
		// noTsIgnore is now explicitly listed as "error"
		expect((suspicious as Record<string, unknown>).noTsIgnore).toBe('error')
	})
})

// ── Formatter parity beyond oxfmt base ─────────────────────────────────────

describe('biome formatter parity with additional checks', () => {
	test('given oxfmt sortTailwindcss: should have nursery useSortedClasses', () => {
		const nursery = lint_rules('nursery')
		expect(nursery).toBeDefined()
		expect((nursery as Record<string, unknown>).useSortedClasses).toBeDefined()
	})

	test('given shared consumer config: should not require explicit types', () => {
		const nursery = lint_rules('nursery')
		expect(nursery).toBeDefined()
		expect((nursery as Record<string, unknown>).useExplicitType).toBe('off')
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
		'drizzle_no_relations',
	]

	for (const rule of expected_rules) {
		test(`given ${rule} needs Grit: should register ${rule}.grit`, () => {
			expect(plugins).toBeDefined()
			const matched = (plugins as string[]).filter((p) => p.includes(`${rule}.grit`))
			expect(matched.length).toBeGreaterThanOrEqual(1)
		})
	}

	test('given no-console is native: should not have no-console.grit in plugins', () => {
		expect(plugins).toBeDefined()
		const no_console_plugin = (plugins as string[]).find((p) => p.includes('no-console.grit'))
		expect(no_console_plugin).toBeUndefined()
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
			`${rules_dir}/`,
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
					timeout: 15_000,
				},
			)
		} catch (e) {
			// biome exits with code 1 when diagnostics are emitted;
			// the stdout still contains the JSON we want to inspect
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

describe('custom Grit rules produce diagnostics on violating fixtures', () => {
	// `no_inline_if`: violating fixture uses inline if body
	// Expected: lint/plugins/no_inline_if diagnostic
	test('given no_inline_if is registered: should flag inline if bodies', () => {
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
	test('given no_hardcoded_colors is registered: should flag hardcoded colors in CSS', () => {
		const code = `a { color: #fff; }`
		const output = run_lint_on_fixture(code, 'fixture_no_hardcoded_colors.css')
		// Grit plugin diagnostics use category "plugin" — check message content
		expect(output).toContain('hardcoded colors')
		expect(output).toContain('"category":"plugin"')
	})

	// `max_nesting_depth`: two levels of if (violation)
	test('given max_nesting_depth is registered: should flag deep nesting', () => {
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
	test('given no_inline_if with braces: should not flag inline if', () => {
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
