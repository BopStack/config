---
id: QUICK_WORK-1
title: "Fix biome config & shim generator"
type: quick-work
date: 2026-06-08
---

# Fix biome config & shim generator

## Task
Fix three problems:
1. Biome `useConsistentTypeDefinitions` rule should enforce `type` (not `interface`)
2. Generated `tsconfig.json` shim missing trailing newline (fails biome format)
3. Enable `tailwindDirectives` in CSS parser options

## Changes
- **biome.json**: Configured `useConsistentTypeDefinitions` with `style: "type"`; added `css.parser.tailwindDirectives: true`
- **src/lib/shim_generator.ts**: Fixed `BIOME_SHIM` to produce compact array syntax (single-line `extends`); fixed both shims to include trailing `\n`; converted `interface` → `type` for `GenerateShimOptions` and `GenerateShimResult`; fixed string concatenation (useTemplate rule)
- **src/lib/file_copy.ts**, **src/lib/errors.ts**, **src/cli/lint_command.ts**, **src/lib/package_selection.ts**: Converted remaining `interface` declarations to `type` aliases (auto-fixed by biome)

## Verification
- Unit tests: 94 passed (11 files)
- Biome check passes on touched files (no format/lint errors)
- Shim content verified: both `biome.json` and `tsconfig.json` shims pass `biome format` cleanly

## Notes
- The `useConsistentTypeDefinitions` rule now has `style: "type"` option, flipping default from `interface` to `type`
- Remaining biome diagnostics (35) are from pre-existing Grit plugin rules (test naming conventions) — not in scope
- Schema version mismatch info is benign (project uses biome 2.4.16, global CLI is 2.4.15)
