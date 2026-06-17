---
id: DEBUG-1
title: "Biome Config Test Failure — Debug Report"
type: debug
date: 2026-06-16
severity: low
status: root-caused
---

# Biome Config Test Failure — Debug Report

## Summary
Directly testing `src/config/biome/biome-config.json` in this repository fails because its plugin paths are intentionally consumer-facing; the supported root and consumer test paths pass.

## Expected Behavior
The Biome config should be testable in a way that proves both native Biome rules and Grit plugin rules load successfully.

## Actual Behavior
- `just check-biome` passes against the repository root `biome.json`.
- `just sync-biome && just test` passes after regenerating/formatting the root `biome.json`.
- `just sync-biome && pnpm exec biome check src/ biome.json vitest.config.ts` passes after regenerating/formatting the root `biome.json`.
- `just test-unit` passes, including consumer and parity tests.
- `just e2e` passes.
- A direct in-place check of `src/config/biome/biome-config.json` fails while loading plugins because its plugin paths point at `./node_modules/@bopstack/config/...`, which does not exist from the package root.

## Reproduction Steps
1. `cd /Users/bruno/Projects/bopstack/config`
2. Run the supported repository check: `just check-biome`
3. Observe success: `Checked 39 files in 422ms. No fixes applied.`
4. Run the direct shared-config diagnostic: `pnpm exec biome check --config-path src/config/biome/biome-config.json src/lib/sync_biome_config.ts`
5. Observe failure: `Error(s) during loading of plugins: Cannot read file...`

## Environment
- Repository: `/Users/bruno/Projects/bopstack/config`
- Package: `@bopstack/config` version `0.2.5`
- Biome dependency: `@biomejs/biome` `^2.5.0`
- Package manager: `pnpm@10.0.0`
- Date investigated: `2026-06-16`

## Root Cause Analysis

### Failure Chain
1. The shared config exported as `@bopstack/config/biome` is stored at `src/config/biome/biome-config.json`.
2. That shared JSON registers Grit plugins with consumer-layout paths under `./node_modules/@bopstack/config/src/config/biome/rules/`.
3. Running Biome with `--config-path src/config/biome/biome-config.json` from the package root resolves those plugin paths relative to the package root.
4. The package root does not contain `./node_modules/@bopstack/config/...`, so all nine plugin files fail to load.
5. Supported paths avoid this:
   - The root `biome.json` rewrites plugin paths to local `./src/config/biome/rules/...` paths.
   - Consumer tests create a `node_modules/@bopstack/config` symlink and extend `@bopstack/config/biome`.
   - Parity fixture tests rewrite plugin paths to absolute local rule paths before invoking Biome.

### Root Cause
The shared Biome config has environment-specific plugin paths. It is valid for installed consumers, but not directly executable from the package root via `--config-path` unless the expected consumer `node_modules/@bopstack/config` layout exists or the paths are rewritten.

### Evidence
- File: `src/config/biome/biome-config.json:320-329` — shared config plugin paths point to `./node_modules/@bopstack/config/src/config/biome/rules/*.grit`.
- File: `src/lib/sync_biome_config.ts:23-24` — sync utility defines shared and local plugin prefixes.
- File: `src/lib/sync_biome_config.ts:98-109` — `local_plugin_paths` rewrites shared paths to root-local plugin paths.
- File: `src/lib/sync_biome_config.ts:149-156` — root config is built from shared config plus local plugin paths and root-only overrides.
- File: `src/lib/biome_consumer.test.ts:26-43` — consumer smoke test creates a temp `node_modules/@bopstack/config` symlink before extending `@bopstack/config/biome`.
- File: `src/lib/biome_parity.test.ts:325-342` — parity tests rewrite plugin paths to absolute rule paths before running Biome from temp fixtures.
- File: `justfile:8-9` — `just check-biome` checks `src/ biome.json vitest.config.ts`, i.e. the root config path, not the shared JSON directly.
- Diagnostic command output — `pnpm exec biome check --config-path src/config/biome/biome-config.json src/lib/sync_biome_config.ts` exits `1` with plugin load errors.
- Diagnostic command output — Python path check found `shared: plugins=9 missing=9` from the package root and `root: plugins=9 missing=0`.
- Diagnostic command output — `just sync-biome && just test` exits `0`; Vitest reports `97` passing tests and Bats reports `13/13` passing e2e tests.
- Diagnostic command output — `just sync-biome && pnpm exec biome check src/ biome.json vitest.config.ts` exits `0` with `Checked 39 files in 108ms. No fixes applied.`

## Affected Files
- `src/config/biome/biome-config.json` — published shared config with consumer-facing plugin paths.
- `biome.json` — repository-local generated config that works in this repo.
- `src/lib/sync_biome_config.ts` — transforms shared config into root config by rewriting plugin paths.
- `src/lib/biome_consumer.test.ts` — validates the installed-consumer path.
- `src/lib/biome_parity.test.ts` — validates rule parity with path rewriting.
- `justfile` — exposes `check-biome` for the root config but no dedicated direct shared-config check.

## Suggested Fix
Do not test the shared JSON in-place as if it were a root config. Add or document a supported shared-config validation path that creates the consumer layout before invoking Biome.

### Fix Strategy
1. Add a dedicated shared-config test/check that creates a temporary consumer project with `node_modules/@bopstack/config` pointing at this package, then runs Biome through `extends: ["@bopstack/config/biome"]`.
2. Keep `just check-biome` focused on the repository root `biome.json`, because that file is intentionally synced to local plugin paths.
3. Document that `src/config/biome/biome-config.json` is consumer-facing and should not be invoked directly with `--config-path` from this repository unless plugin paths are rewritten.
4. Optionally centralize the existing path-rewrite/consumer-layout helpers so parity and consumer tests exercise the same resolution model.

### Risk Assessment
- Risk: Changing shared plugin paths to local paths would break installed consumers. Mitigation: preserve consumer-facing paths in `src/config/biome/biome-config.json`; only adapt test harnesses.
- Risk: Only testing root `biome.json` can miss publish/consumer resolution bugs. Mitigation: keep or strengthen the consumer smoke test that extends `@bopstack/config/biome` from a temp consumer project.
- Risk: Path rewrite helpers can diverge from real consumer behavior. Mitigation: prefer the temp consumer symlink layout for at least one smoke test.

## Verification Plan
How to verify the fix works:
1. Run `just check-biome` and confirm the repository root config still passes.
2. Run `just test-unit` and confirm the consumer smoke test and parity tests pass.
3. Run `just e2e` and confirm CLI init still generates a shim extending `@bopstack/config/biome`.
4. Run the new shared-config validation check, if added, and confirm it invokes Biome from a temp consumer layout rather than direct package-root `--config-path`.

## Related Issues
- `.bopstack/docs/quick-work/QUICK_WORK-1-biome-2-5-upgrade.md` — recent Biome 2.5 upgrade notes confirm `biome check`, unit tests, and e2e passed after migration.
- `.bopstack/docs/quick-work/2026-06-08-fix-biome-config-shim.md` — earlier shim/config work notes direct Biome config and shim formatting fixes.
- `.bopstack/docs/decisions/2026-06-04-parity-matrix.md` — documents native vs Grit rule parity and known Biome gaps.

## Notes
- The current supported checks passed during this investigation: `just check-biome`, `just sync-biome && just test`, `just sync-biome && pnpm exec biome check src/ biome.json vitest.config.ts`, `just test-unit`, and `just e2e`.
- Running `just sync-biome` formatted `biome.json` but left no tracked diff.
- This is not a root `biome.json` failure and not a Biome 2.5 schema failure.
- The failure is reproducible only when the published shared config is run directly from the package root without consumer-style module resolution.
