---
id: PLAN-1
title: "Single-Package Biome and TypeScript Config Migration — Implementation Plan"
type: plan
date: 2026-06-02
workbranch: ""
specs:
  - .bopstack/docs/specs/2026-06-02-single-package-biome-tsconfig-design.md
---

# Single-Package Biome and TypeScript Config Migration — Implementation Plan

## Overview

Migrate `@bopstack/config` from a meta-installer for many independent `@bopstack/*` config packages into a single consumer-facing package for the initial Biome and TypeScript scope. The package will own the CLI plus shared config assets under `src/config`, export Biome and TypeScript config entrypoints, install only `@bopstack/config`, `@biomejs/biome`, and `typescript` during default init, and generate minimal consumer shims.

Work will happen on `main` (`workbranch` empty), per user decision.

## Plan Decisions

- Keep the initial migration scoped to Biome and TypeScript only.
- Preserve current overwrite behavior for generated target config files; overwrite safety is out of scope.
- Generate minimal consumer shims:
  - `biome.json` extends `@bopstack/config/biome` only.
  - `tsconfig.json` extends `@bopstack/config/tsconfig/base` only.
- Use the smoke-tested Biome GritQL plugin path form inside the shared Biome config: `./node_modules/@bopstack/config/src/config/biome/rules/<rule>.grit`.
- Use the existing dependency style for package metadata and let `bopstack-config init` install bare package names so the package manager resolves versions.
- Treat missing package exports, missing shared config files, missing GritQL rule files, Biome plugin load failures, and TypeScript config resolution failures as hard validation failures.

## Commit Strategy

Commit after each unit of work. Do not batch unrelated behavior, docs, and smoke-test changes into one commit. Preferred commits:

1. `test: lock single-package config contracts`
2. `feat: add shared biome and tsconfig exports`
3. `feat: generate biome and tsconfig init shims`
4. `test: update config cli e2e coverage`
5. `test: smoke exported biome and tsconfig configs`
6. `docs: describe single-package biome typescript setup`
7. `chore: verify biome typescript migration`

Before each commit: inspect status/diff, run the smallest relevant verification for the task, and keep changes reviewable.

## Tasks

- completed: Task 1 — Lock Single-Package Contracts in Tests
- completed: Task 2 — Add Shared Biome and TypeScript Config Assets
- completed: Task 3 — Refactor Package/Config Metadata and Shim Generation
- completed: Task 4 — Update E2E Test Fixtures
- completed: Task 5 — Update README and Docs
- completed: Task 6 — Create Project Root biome.json and Adapt Justfile
- completed: Task 7 — Smoke Test End-to-End
  - Description: Add or update unit-level contract tests before implementation so the intended package exports, dependency set, generated shim files, and removed old package set are explicit.
  - Dependencies: None
  - Acceptance Criteria:
    - Unit tests assert default init packages are exactly `@bopstack/config`, `@biomejs/biome`, and `typescript`.
    - Unit tests assert default generated config entries are exactly `biome.json` and `tsconfig.json`.
    - Unit tests assert generated `biome.json` extends `@bopstack/config/biome`.
    - Unit tests assert generated `tsconfig.json` extends `@bopstack/config/tsconfig/base`.
    - Unit tests assert `package.json` exports include `./biome` and `./tsconfig/base`.
    - Unit tests assert old default packages are absent: `@bopstack/tsconfig`, `@bopstack/oxfmt`, `@bopstack/oxlint`, `@bopstack/oxc`, `@bopstack/commitlint`, `@bopstack/markdownlint`, `@bopstack/spellcheck`, `@bopstack/just`, `@bopstack/custom-lint`, and `@bopstack/git-hook`.
    - The new or updated tests fail before implementation for the expected missing behavior.
  - Steps:
    1. Read existing package selection, init core, file copy, and package metadata tests end-to-end.
    2. Add package-selection expectations for the new default dependency set and target files.
    3. Add tests for consumer shim contents, using a pure writer/generator seam if one exists or introducing the expected seam as a test target.
    4. Add a package metadata test that reads `package.json` and validates required exports.
    5. Run the narrow unit test command for the changed tests and confirm the expected red failures.
    6. Commit only the contract tests.

- unstarted: Task 2 — Add Shared Biome and TypeScript Config Assets
  - Description: Add first-party shared config assets under `src/config`, expose them through package exports, and switch repository tooling metadata from Oxfmt/Oxlint/Oxc to Biome for this package.
  - Dependencies: Task 1
  - Acceptance Criteria:
    - `src/config/biome/biome.json` exists and is exported as `@bopstack/config/biome`.
    - `src/config/biome/rules/*.grit` contains at least one initial smoke-testable GritQL rule with a diagnostic.
    - Shared Biome config registers GritQL plugins using `./node_modules/@bopstack/config/src/config/biome/rules/<rule>.grit` paths.
    - `src/config/tsconfig/base.json` exists and is exported as `@bopstack/config/tsconfig/base`.
    - `package.json` keeps config assets publishable through the existing `files` policy or an updated equivalent.
    - `package.json` dev tooling uses `@biomejs/biome` and `typescript`; Oxfmt/Oxlint/Oxc dev tooling is removed unless a temporary compatibility note explains why it remains.
    - Relevant Task 1 package metadata/config asset tests pass.
  - Steps:
    1. Create `src/config/biome` and `src/config/tsconfig` directories.
    2. Add the shared Biome config with formatter/linter settings and GritQL plugin registration.
    3. Add the first GritQL rule file; prefer a rule that can be triggered by a tiny smoke fixture.
    4. Add the TypeScript base config source.
    5. Update `package.json` exports for `./biome` and `./tsconfig/base`.
    6. Update `package.json` dependency metadata for Biome/TypeScript tooling.
    7. Run the package metadata/config asset unit tests.
    8. Commit only shared assets and metadata.

- unstarted: Task 3 — Generate Consumer Biome and TypeScript Shims During Init
  - Description: Replace the default copy-from-many-packages init behavior with generated local shim files for Biome and TypeScript while preserving existing domain errors and dry-run behavior.
  - Dependencies: Task 2
  - Acceptance Criteria:
    - `bopstack-config init` default package list is exactly `@bopstack/config`, `@biomejs/biome`, and `typescript`.
    - Successful init writes `biome.json` with an `extends` entry for `@bopstack/config/biome`.
    - Successful init writes `tsconfig.json` with an `extends` entry for `@bopstack/config/tsconfig/base`.
    - Default init no longer writes `tsconfig.base.json`, `oxfmtrc.json`, `oxlintrc.json`, `commitlint.config.ts`, `justfile`, `.lefthook.yml`, `.markdownlint.json`, or `.cspell.json`.
    - `target_missing` and `install_failed` behavior remains unchanged.
    - Dry-run previews the two shim files and writes nothing.
    - Summary output reports the new package and generated-file counts accurately.
  - Steps:
    1. Refactor package/config metadata from copy entries into generated-file entries, or introduce a dedicated generated-config writer while leaving old copy utilities isolated.
    2. Implement `biome.json` shim generation with stable JSON formatting.
    3. Implement `tsconfig.json` shim generation with stable JSON formatting.
    4. Update `run_init_core` to install the new dependency set and write generated shims after successful install.
    5. Preserve existing error result variants and CLI error messages.
    6. Update dry-run logging and summary calculation for generated files.
    7. Run affected unit tests for package selection, init core, and file writing.
    8. Commit only init behavior changes.

- unstarted: Task 4 — Update CLI E2E Coverage and Stub Installer
  - Description: Update Bats e2e tests and the deterministic stub `pnpm` setup to validate the new install flow and generated consumer files without using the network.
  - Dependencies: Task 3
  - Acceptance Criteria:
    - E2E install assertions expect `@bopstack/config`, `@biomejs/biome`, and `typescript`.
    - E2E install assertions reject old package names from the recorded install args.
    - E2E success test verifies generated `biome.json` content includes `@bopstack/config/biome`.
    - E2E success test verifies generated `tsconfig.json` content includes `@bopstack/config/tsconfig/base`.
    - E2E dry-run test verifies neither shim file is written.
    - E2E install-failure test verifies neither shim file is written after a failed install.
    - Rename tests for lefthook, markdownlint, cspell, and commitlint are removed or rewritten as negative assertions because those domains are out of scope.
    - The e2e suite passes with the stub package manager.
  - Steps:
    1. Read the Bats helper and existing CLI e2e file end-to-end.
    2. Update the stub `pnpm` package cases for `@bopstack/config`, `@biomejs/biome`, and `typescript`.
    3. Update successful init assertions for the new dependency set and generated files.
    4. Update dry-run and install-failure assertions for the new shim files.
    5. Remove obsolete rename/copy assertions tied to out-of-scope packages.
    6. Run `just test-e2e`.
    7. Commit only e2e and stub changes.

- unstarted: Task 5 — Add Exported Config Smoke Validation
  - Description: Add smoke validation that proves real consumers can resolve and use the exported Biome and TypeScript configs, including the GritQL plugin path behavior verified in the brainstorm.
  - Dependencies: Task 2, Task 3, Task 4
  - Acceptance Criteria:
    - A temp consumer project can run Biome against a fixture file through `biome.json` extending `@bopstack/config/biome`.
    - The Biome smoke test proves at least one GritQL diagnostic fires through the shared config.
    - Biome plugin load failure fails the smoke test clearly.
    - A temp consumer project can run TypeScript with `tsconfig.json` extending `@bopstack/config/tsconfig/base`.
    - TypeScript config resolution failure fails the smoke test clearly.
    - Smoke validation is wired into the project verification flow, preferably `just test-e2e` or `just check`.
    - Smoke test temp files and logs stay under `tmp/` or test temp directories.
  - Steps:
    1. Choose the smoke-test harness location, reusing Bats if it can invoke real local tools deterministically.
    2. Create a temp consumer fixture with a local `node_modules/@bopstack/config` view of this package's config assets.
    3. Generate or copy the same consumer `biome.json` shim produced by init.
    4. Add a fixture source file that triggers the initial GritQL rule.
    5. Run Biome through the project package manager and assert the custom diagnostic appears.
    6. Create a TypeScript temp consumer with a shim extending `@bopstack/config/tsconfig/base`.
    7. Run `tsc --noEmit` and assert successful config resolution.
    8. Wire the smoke test into the relevant `just` recipe.
    9. Commit only smoke validation changes.

- unstarted: Task 6 — Update CLI Help, README, Vision, and Publish Docs
  - Description: Align user-facing docs and CLI wording with the single-package Biome/TypeScript direction and remove the old multi-package/Oxc-first install story from current guidance.
  - Dependencies: Task 3
  - Acceptance Criteria:
    - CLI help describes init as installing `@bopstack/config`, Biome, and TypeScript config support rather than installing all `@bopstack/*` packages.
    - `README.md` describes the new install flow, generated files, package exports, and supported scope.
    - `README.md` no longer presents commitlint, markdownlint, spellcheck, just recipes, git hooks, Oxfmt, Oxlint, or Oxc as current default init behavior.
    - `VISION.md` states that `@bopstack/config` owns CLI plus shared Biome/TypeScript configs for the current scope.
    - `PUBLISH_ORDER.md` is updated so the old many-package publish order is historical/deferred, not current required workflow.
    - Docs mention that other config domains remain out of scope/deferred.
    - Documentation examples match the actual generated `biome.json` and `tsconfig.json` shims.
  - Steps:
    1. Update CLI help text in the command router.
    2. Rewrite README overview, usage, what-it-does, package list, and development command references as needed.
    3. Rewrite VISION to reflect the new single-package direction and scoped domains.
    4. Update PUBLISH_ORDER to remove or clearly demote the old dependency-ordered multi-package release requirement.
    5. Cross-check docs against implemented package names, generated files, and exports.
    6. Run docs-relevant tests or CLI help e2e assertions.
    7. Commit only docs/help changes.

- unstarted: Task 7 — Final Verification and Migration Cleanup
  - Description: Run the full project gate, inspect the final diff, and remove obsolete implementation remnants that conflict with the new scoped direction.
  - Dependencies: Task 1, Task 2, Task 3, Task 4, Task 5, Task 6
  - Acceptance Criteria:
    - `just check` passes.
    - Unit tests pass.
    - E2E tests pass.
    - Smoke validation for Biome and TypeScript passes.
    - No generated default init path still references old default packages.
    - No current docs describe old packages as installed by default.
    - Final diff contains only intended migration changes.
    - Plan task statuses are updated by the work workflow as tasks complete.
  - Steps:
    1. Run the full gate with `just check`.
    2. If failures occur, stop and fix within the smallest relevant task boundary.
    3. Search the repo for old default package references and classify each as removed, historical/deferred, or still required.
    4. Inspect final `git status` and `git diff`.
    5. Update the implementation plan task statuses if the work workflow uses the plan as progress state.
    6. Commit final cleanup or verification notes if needed.

## Sequencing

```text
Task 1
  ↓
Task 2
  ↓
Task 3
  ↓
Task 4
  ↓
Task 5
  ↓
Task 6
  ↓
Task 7
```

Task 6 can start after Task 3, but it should be finalized after Task 5 so smoke-test wording matches actual validation. Task 7 must stay last.

## Risks

- Biome GritQL plugin path resolution is brittle because shared config plugin paths are interpreted from the consumer project. Smoke validation must guard this.
- TypeScript package-subpath config resolution may expose package export or module-resolution edge cases. Smoke validation must guard this.
- The existing init code is copy-oriented; generated shims may require a cleaner writer abstraction rather than stretching `copy_config_file`.
- Removing old default packages changes CLI behavior sharply. E2E negative assertions should prevent accidental partial migration.
- Exact Oxc custom-rule parity is not fully known in this repo. The first GritQL wave should include a smoke-testable seed rule, and deeper parity can be planned later if external rule sources appear.
- Docs and implementation can drift during this migration because README, VISION, PUBLISH_ORDER, CLI help, tests, and package metadata all describe the install story.
