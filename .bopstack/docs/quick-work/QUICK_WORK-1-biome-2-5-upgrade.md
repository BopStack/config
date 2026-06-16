---
id: QUICK_WORK-1
title: "Biome 2.5 Upgrade"
type: quick-work
date: 2026-06-15
---

# Biome 2.5 Upgrade

## Task
Update `@bopstack/config` from Biome 2.4.16 → 2.5.0, including config migration via `biome migrate`.

## Changes
- **package.json**: Bump `@biomejs/biome` from `^2.4.16` to `^2.5.0`
- **pnpm-lock.yaml**: Auto-updated by pnpm
- **src/config/biome/biome-config.json**: 
  - `$schema` URL → 2.5.0
  - `"recommended": true` → `"preset": "recommended"`
  - Moved 24 promoted nursery rules to their stable groups (style, suspicious, complexity, security, performance)
  - Renamed `useFind` → `useArrayFind` (complexity), `useSpread` → `useSpreadOverApply` (style)
- **biome.json**: Regenerated via `just sync-biome`
- **src/lib/sync_biome_config.ts**: Moved `useDestructuring: off` override from nursery to style (it was promoted)
- **src/lib/biome_consumer.test.ts**: Updated consumer test `$schema` URL to 2.5.0

## Verification
- `biome check` passes clean on 39 files
- `tsc --noEmit` passes (0 errors)
- `vitest run` — 97 tests pass across 12 test files
- `bats test/e2e` — 13/13 e2e tests pass

## Notes
- The `biome migrate` command automatically handled all config transformations
- Consumer plugin paths (GritQL) are unaffected — the plugin API didn't change
- 49 nursery rules remain (not promoted): `noInlineStyles`, `useSortedClasses`, `useExhaustiveSwitchCases`, `useAwaitThenable`, `useArraySome`, `useNullishCoalescing`, `useStringStartsEndsWith`, `useRegexpTest`, `useRegexpExec`, `useMathMinMax`, `useDomQuerySelector`, `useDomNodeTextContent`, `noComponentHookFactories`, `noFloatingPromises`, `noMisusedPromises`, `noUselessTypeConversion`, `noExcessiveNestedCallbacks`, `useExplicitType`, `useExplicitReturnType`, `useConsistentTestIt`, `useDisposables`, `noConditionalExpect`, `noIdenticalTestTitle`, `useExpect`, `useTestHooksInOrder`, `useTestHooksOnTop`, `noUnsafePlusOperands`, `noBaseToString`, `noMisleadingReturnType`, `useImportsFirst` + 19 more
- New 2.5 features (`delimiterSpacing`, plugin `includes`, `sortBareImports`) are available but not adopted — can be added as separate tasks
