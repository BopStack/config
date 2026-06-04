# Native Biome and Custom Grit Configuration

date: 2026-06-04
status: implemented, verified (green)

## Summary

Configured Biome native rules and custom Grit plugins in a single pass. All config-schema tests and fixture tests pass.

## Native Biome rules added (beyond recommended)

### style
- `useBlockStatements: "error"` — replaces oxlint `curly`
- `useSortedClasses: "error"` (nursery) — replaces oxfmt `sortTailwindcss`

### suspicious
- `noImportCycles: "error"` — replaces oxlint `import/no-cycle`
- `noEmptyBlockStatements: "error"` — replaces FFB/OXC `no-empty-catch`

## Custom Grit rules added

| Rule | Severity | Scope | Source |
|---|---|---|---|
| `no_inline_if` | error | all | FFB `no_inline_if.grit` |
| `no_hardcoded_colors` | warn | all | FFB/OXC, CSS files |
| `test_naming` | error | all | FFB/OXC `test-naming` |
| `prefer_testid` | error | test/e2e via documented scope | FFB `prefer_testid.grit` |
| `max_nesting_depth` | error | all | FFB `max_nesting_depth.grit` |
| `drizzle_fk_index` | info | Drizzle files | FFB Drizzle advisory |
| `drizzle_no_relations` | info | Drizzle files | FFB Drizzle advisory |

## Known gaps (not configured)
- `useFilenamingConvention` — too invasive for shared config; consumers should configure per-project
- `sortPackageJson` — no Biome equivalent
- `insertFinalNewline` — no Biome equivalent

## Removed
- `no-console.grit` — replaced by native `noConsole: "error"`
- Empty `plugins: []` placeholder — replaced with registered Grit rules
