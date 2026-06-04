# Parity Matrix — Biome Grit & Formatter Parity

date: 2026-06-04
source_conventions: FFB .grit/, FFB biome.json, @bopstack/oxc/src/index.ts,
                    @bopstack/oxlint/oxlintrc.json, @bopstack/oxfmt/oxfmtrc.json
biome_version: 2.4.16

## oxlint parity

| oxlint rule | Desired severity | Biome native equivalent | Config key | Status |
|---|---|---|---|---|
| `eslint/curly` (all) | error | `useBlockStatements` | `style.useBlockStatements: "error"` | native — add to config |
| `eqeqeq` | error | `noDoubleEquals` | `suspicious.noDoubleEquals` (recommended) | native — covered by recommended |
| `no-eval` | error | `noGlobalEval` | `security.noGlobalEval` (recommended) | native — covered by recommended |
| `no-debugger` | error | `noDebugger` | `suspicious.noDebugger` (recommended) | native — covered by recommended |
| `no-console` | error | `noConsole` | `suspicious.noConsole: "error"` | native — already configured |
| `prefer-const` | error | `useConst` | `style.useConst: "error"` | native — already configured |
| `prefer-optional-chain` | error | `useOptionalChain` | `complexity.useOptionalChain` (recommended) | native — covered by recommended |
| `no-nested-ternary` | error | `noNestedTernary` | `style.noNestedTernary: "error"` | native — already configured |
| `max-params` (max: 3) | error | `useMaxParams` (max: 3) | `complexity.useMaxParams { max: 3 }` | native — already configured |
| `unicorn/filename-case` (snakeCase) | error | `useFilenamingConvention` | — | known gap — too invasive for a shared config; consumers should configure per-project
| `typescript/no-explicit-any` | error | `noExplicitAny` | `suspicious.noExplicitAny: "error"` | native — already configured |
| `typescript/no-unused-vars` | error | `noUnusedVariables` | `correctness.noUnusedVariables: "error"` | native — already configured |
| `import/no-cycle` | error | `noImportCycles` | `correctness.noImportCycles: "error"` | native — add to config |

## oxfmt parity

| oxfmt setting | Desired value | Biome equivalent | Config key | Status |
|---|---|---|---|---|
| useTabs | true | `indentStyle: "tab"` | `formatter.indentStyle` | native — already configured |
| singleQuote | true | `quoteStyle: "single"` | `javascript.formatter.quoteStyle` | native — already configured |
| semi | false | `semicolons: "asNeeded"` | `javascript.formatter.semicolons` | native — already configured |
| trailingComma | none | `trailingCommas: "none"` | `javascript.formatter.trailingCommas` | native — already configured |
| printWidth | 100 | `lineWidth: 100` | `formatter.lineWidth` | native — already configured |
| sortImports | true | `organizeImports: "on"` | `assist.actions.source.organizeImports` | native — already configured |
| sortTailwindcss | true | `useSortedClasses` | `nursery.useSortedClasses` | native — add to config |
| sortPackageJson | true | no Biome equivalent | — | known gap — Biome does not sort package.json |
| insertFinalNewline | false | no Biome equivalent | — | known gap — Biome always inserts final newline |

## Custom Grit rules (no native Biome equivalent, port required)

| Convention | Source | Desired severity | Grit filename | Scope | Status |
|---|---|---|---|---|---|
| Require braces for if/else bodies | FFB `no_inline_if.grit`, OXC `no-inline-styles` (different) | error | `no_inline_if.grit` | all | Grit — port |
| No hardcoded colors (hex/rgb/hsl in CSS) | FFB `no_hardcoded_colors.grit`, OXC `no-hardcoded-colors` | warn | `no_hardcoded_colors.grit` | all | Grit — port (Biome `noHexColors` partial, covers hex only) |
| Riteway test naming convention | FFB `test_naming.grit`, OXC `test-naming` | error | `test_naming.grit` | all | Grit — port |
| Prefer getByTestId over DOM queries | FFB `prefer_testid.grit` | error | `prefer_testid.grit` | test/e2e only | Grit — port |
| Max nesting depth (1 level) | FFB `max_nesting_depth.grit` | error | `max_nesting_depth.grit` | all | Grit — port |
| Drizzle FK index advisory | FFB `drizzle_fk_index.grit` | info | `drizzle_fk_index.grit` | Drizzle files | Grit — port |
| Drizzle relations advisory | FFB `drizzle_no_relations.grit` | info | `drizzle_no_relations.grit` | Drizzle files | Grit — port |

## Native Biome rules replacing FFB/OXC Grit (duplicate, not ported)

| Convention | Source | Biome native | Reason |
|---|---|---|---|
| no-console | FFB `no-console.grit`, oxlint `no-console` | `suspicious.noConsole` | Native fully covers it. Remove `no-console.grit`. |
| no-ts-ignore | FFB `no_ts_ignore.grit`, OXC `no-ts-ignore` | `suspicious.noTsIgnore` (recommended) | Native covers it. |
| empty catch | FFB `no_empty_catch.grit`, OXC `no-empty-catch` | `correctness.noEmptyBlockStatements` | Native covers it. Need to add to config. |
| strict equality | FFB `strict_equality.grit` | `suspicious.noDoubleEquals` (recommended) | Native covers it. |
| no inline styles | FFB `no_inline_styles.grit`, OXC `no-inline-styles` | `nursery.noInlineStyles` | Already configured as native. |

## Known gaps (Biome cannot match, documented in README)

| Convention | Source | Reason |
|---|---|---|
| package JSON sorting | oxfmt | No Biome equivalent |
| No final newline insertion | oxfmt | Biome always inserts final newline |

## Out of scope

- `@bopstack/oxc/src/no_throw.ts` — not exported from OXC plugin entry point
- OXC `naming-convention` — covered by Biome `useNamingConvention` (already configured)
