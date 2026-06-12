---
id: QUICK_WORK-3
title: "Update shared Biome comma and explicit type rules"
type: quick-work
date: 2026-06-12
---

# Update shared Biome comma and explicit type rules

## Task

Force the shared Biome config to use comma formatting and also disable `lint/nursery/useExplicitType`.

## Changes

- `src/config/biome/biome-config.json`: set `javascript.formatter.trailingCommas` to `all` and disabled `nursery.useExplicitType`.
- `biome.json`: synced the root Biome config from the shared config.
- `src/lib/biome_parity.test.ts`: updated formatter parity coverage and added coverage that explicit type annotations are not required.
- `README.md`: documented the trailing comma setting and the disabled explicit type rule.
- `src/**/*.ts` and `vitest.config.ts`: accepted formatter output from the updated trailing comma setting.

## Verification

- Ran `just test` after updating the test first; it failed while the shared config still used `trailingCommas: "none"`.
- Ran `just sync-biome`.
- Ran `just test` successfully.
- Ran `just check` successfully.

## Notes

Biome does not expose a leading comma option; the implemented shared formatter setting is `javascript.formatter.trailingCommas: "all"`.
