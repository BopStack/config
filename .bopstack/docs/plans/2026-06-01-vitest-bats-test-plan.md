---
title: "Vitest Unit Tests and Bats CLI E2E Tests — Implementation Plan"
type: plan
date: 2026-06-01
workbranch: ""
specs:
  - .unipi/docs/specs/2026-06-01-vitest-bats-test-design.md
---

# Vitest Unit Tests and Bats CLI E2E Tests — Implementation Plan

## Overview

Implement the approved two-layer test strategy for `@bopstack/config`: refactor CLI internals into testable `src/lib` units, keep process/command adapters in `src/cli`, expand Vitest unit coverage, add Bats e2e tests for real CLI calls with a deterministic stub `pnpm`, and wire both layers into package scripts/checks.

Work will happen on `main` (`workbranch` empty), per user decision.

## Commit Strategy

Commit after every unit of work. Do not batch unrelated tasks into one commit. Preferred commits:

1. `refactor: split cli adapters from reusable config logic`
2. `refactor: return typed init errors from core logic`
3. `test: cover init parser and package metadata`
4. `test: cover config copy and summary logic`
5. `test: add bats e2e harness for config cli`
6. `test: cover bopstack-config cli with bats`
7. `chore: wire unit and e2e test scripts`
8. `chore: verify test plan implementation`

Before each commit: inspect `git diff --check`, ensure only intended files included, run the smallest relevant verification for that task. After each commit: record commit hash in task notes if `/unipi:work` maintains progress.

## Tasks

- completed: Task 1 — Restructure CLI and library boundaries
  - Description: Split reusable logic from process-level CLI adapters while preserving current CLI behavior.
  - Dependencies: None
  - Acceptance Criteria: Source layout contains `src/index.ts`, `src/cli`, and `src/lib`; package bin points at the intended entry; TypeScript imports resolve; existing behavior remains represented by the new adapter/core split; commit created for this task only.
  - Implementation Detail:
    - Prefer `src/index.ts` as bin entry because the spec explicitly asks for `src/index.ts` in the organized structure. Give it the shebang and route to a CLI runner.
    - Suggested files:
      - `src/index.ts` — shebang, calls `run_cli(process.argv.slice(2))`, maps unexpected top-level errors.
      - `src/cli/run_cli.ts` — command routing for `init`, `--help`, `-h`, unknown commands.
      - `src/cli/init_command.ts` — process adapter for `init`; owns console output and final exit code mapping.
      - `src/lib/init_args.ts` — parse/validate init args.
      - `src/lib/package_selection.ts` — package/config metadata and rename mappings.
      - `src/lib/file_copy.ts` — copy and source-resolution utilities.
      - `src/lib/init_core.ts` — init orchestration with injected dependencies.
      - `src/lib/errors.ts` — typed/domain errors shared by parser/core/adapters.
    - Keep `.js` extensions in TypeScript relative imports where current ESM setup requires them.
    - Update `package.json` bin from `./src/cli/index.ts` to `./src/index.ts`.
    - Remove old `src/cli/index.ts` or reduce it to a tiny compatibility shim only when needed for imports; avoid duplicate logic.
  - Steps:
    1. Move the shebang entry behavior to `src/index.ts` and create a `run_cli` command router under `src/cli`.
    2. Move package/config metadata from `src/cli/package_selection.ts` into `src/lib/package_selection.ts`.
    3. Move copy helpers from `src/cli/file_copy.ts` into `src/lib/file_copy.ts`.
    4. Introduce `src/lib/init_core.ts` as the future seam for orchestration, even if initial code still mirrors old flow.
    5. Update all imports and `package.json` bin.
    6. Run `pnpm run typecheck`.
    7. Commit only this restructure as `refactor: split cli adapters from reusable config logic`.

- completed: Task 2 — Refactor parsing and expected error handling
  - Description: Replace direct `process.exit` calls inside pure logic with typed results/errors, then map them to process behavior in CLI adapters.
  - Dependencies: Task 1
  - Acceptance Criteria: Invalid kind, missing target, and install failure are represented as typed/domain errors or result variants; CLI still exits nonzero and prints useful messages; pure parser/validation can be unit tested without intercepting `process.exit`; commit created for this task only.
  - Implementation Detail:
    - Use a narrow discriminated union rather than exceptions for expected failures if practical:
      - `{ ok: true, value: InitArgs }`
      - `{ ok: false, error: InitError }`
    - Suggested `InitError` variants:
      - `{ kind: "invalid_project_kind"; value: string | undefined }`
      - `{ kind: "unknown_arg"; value: string }`.
      - `{ kind: "target_missing"; target: string }`
      - `{ kind: "install_failed"; stderr: string; status: number | null }`
    - Plan decision: use strict unknown-arg behavior for confidence. Bats/Vitest must assert unknown init flag exits nonzero.
    - `parse_init_args(args, options)` should accept `{ cwd: string }` so tests avoid mutating process state.
    - `run_init_core(input, deps)` should accept deps such as `exists(path)`, `install(packages, cwd)`, `copy(file)`, and `log`/`warn`. Prefer returning structured events for adapter printing when simple.
    - CLI adapter maps known errors to stable messages:
      - invalid kind: `Invalid project kind: <value>`
      - missing target: `Target directory does not exist: <target>`
      - install failure: `Package installation failed:` followed by stderr.
  - Steps:
    1. Define `Result`/`InitError` types in `src/lib/errors.ts`.
    2. Implement `parse_init_args(rawArgs, { cwd })` returning result/throwing only for programmer errors.
    3. Implement strict unknown arg behavior and document it in tests/CLI messages.
    4. Implement target validation as pure/dependency-injected logic.
    5. Wrap `spawnSync("pnpm", ["add", "-D", ...packages])` behind an install function returning status/stderr.
    6. Update CLI adapters to print errors and return/exit with code 1 for expected failures.
    7. Run typecheck plus a CLI smoke command such as help if safe.
    8. Commit only this behavior seam as `refactor: return typed init errors from core logic`.

- completed: Task 3 — Expand Vitest coverage for parser and package metadata
  - Description: Add focused unit tests for parser, project kind validation, package selection, config file selection, and rename mappings.
  - Dependencies: Task 2
  - Acceptance Criteria: Vitest asserts defaults, `--target`, `--kind=default`, invalid kind, `--dry-run`, unknown-flag contract, full package list, full config file list, and all rename mappings including `commitlintrc.ts` → `commitlint.config.ts`; commit created for this task only.
  - Implementation Detail:
    - Suggested test files:
      - `src/lib/init_args.test.ts`
      - `src/lib/package_selection.test.ts`
    - Parser expected cases:
      - `parse_init_args([], { cwd: "/tmp/project" })` → target `/tmp/project`, kind `default`, dryRun `false`.
      - `parse_init_args(["--target=/x"], { cwd })` → target `/x`.
      - `parse_init_args(["--kind=default"], { cwd })` → kind `default`.
      - `parse_init_args(["--dry-run"], { cwd })` → dryRun `true`.
      - `parse_init_args(["--kind=bogus"], { cwd })` → invalid kind error.
      - `parse_init_args(["--bogus"], { cwd })` → unknown arg error.
    - Package list must exactly include:
      - `@bopstack/tsconfig`
      - `@bopstack/oxfmt`
      - `@bopstack/oxlint`
      - `@bopstack/oxc`
      - `@bopstack/commitlint`
      - `@bopstack/markdownlint`
      - `@bopstack/spellcheck`
      - `@bopstack/just`
      - `@bopstack/custom-lint`
      - `@bopstack/git-hook`
    - Config file pairs must include:
      - `@bopstack/tsconfig`: `tsconfig.base.json` → `tsconfig.base.json`
      - `@bopstack/oxfmt`: `oxfmtrc.json` → `oxfmtrc.json`
      - `@bopstack/oxlint`: `oxlintrc.json` → `oxlintrc.json`
      - `@bopstack/commitlint`: `commitlintrc.ts` → `commitlint.config.ts`
      - `@bopstack/just`: `justfile` → `justfile`
      - `@bopstack/git-hook`: `lefthook.yml` → `.lefthook.yml`
      - `@bopstack/markdownlint`: `markdownlint.json` → `.markdownlint.json`
      - `@bopstack/spellcheck`: `cspell.json` → `.cspell.json`
  - Steps:
    1. Move/rewrite existing package selection tests under `src/lib`.
    2. Add parser tests with injected cwd.
    3. Assert package list equality or set equality, not just length.
    4. Assert config file source/target mappings explicitly.
    5. Assert invalid kind and unknown flag behavior via typed errors.
    6. Run `pnpm exec vitest run src/lib/init_args.test.ts src/lib/package_selection.test.ts`.
    7. Commit only these unit tests as `test: cover init parser and package metadata`.

- completed: Task 4 — Expand Vitest coverage for copy, summary, and install logic
  - Description: Add unit tests for file-copy behavior, dry-run behavior, missing/existing paths, nested dirs, summary counts, and install-result handling.
  - Dependencies: Task 2
  - Acceptance Criteria: Vitest covers dry-run create/overwrite without writes; real copy from fixture package dirs; missing source skip; existing target behavior; nested directory creation; summary written/skipped/existing counts; install success/failure result handling with stderr preserved; commit created for this task only.
  - Implementation Detail:
    - Suggested test files:
      - `src/lib/file_copy.test.ts`
      - `src/lib/init_core.test.ts`
    - Prefer helpers using `mkdtempSync(join(tmpdir(), "bopstack-config-"))` and `rmSync(temp, { recursive: true, force: true })` in `afterEach`.
    - Make source resolution accept a `packageRoot`/`workspaceRoot`/`nodeModulesRoot` dependency. Current relative `node_modules` search is hard to test and ambiguous.
    - Source candidate order to preserve/test:
      - `node_modules/<package>/<file>`
      - `node_modules/<package>/src/<file>`
      - `node_modules/<package>/dist/<file>`
    - Dry-run tests must assert result `{ written: false }` and target file absence.
    - Real-copy tests must assert file content, not just existence.
    - Existing-target tests should document chosen overwrite semantics. Current behavior overwrites when source exists; if source missing but target exists, it logs skip and returns written true. Preserve or intentionally adjust with tests.
    - Summary should expose a pure `summarize_copy_results(results, packages)` so counts can be asserted without parsing console output.
    - Install boundary should expose a unit-testable function receiving runner result `{ status, stderr }`.
  - Steps:
    1. Add temp-dir helper(s) inside tests or shared test util.
    2. Refactor source resolution to accept explicit root/deps if not already done.
    3. Add dry-run create and dry-run overwrite tests.
    4. Add copy tests for root/src/dist source candidates.
    5. Add missing-source/no-existing and missing-source/existing-target tests.
    6. Add nested target directory creation test.
    7. Add summary/count tests for written, skipped, existing, and package count.
    8. Add install success/failure tests with stderr/status assertions.
    9. Run focused Vitest file set for copy/core tests.
    10. Commit only these unit tests/refactors as `test: cover config copy and summary logic`.

- completed: Task 5 — Add Bats e2e harness
  - Description: Create Bats test structure with helpers for temp projects, CLI invocation, deterministic stub `pnpm`, fixture package files, and cleanup.
  - Dependencies: Task 1, Task 2
  - Acceptance Criteria: `test/e2e` contains reusable helpers; each test gets isolated temp dirs; stub `pnpm` can validate install args, simulate failure, and create fixture `node_modules/@bopstack/*` config files; harness can invoke the real CLI entry consistently; commit created for this task only.
  - Implementation Detail:
    - Suggested files:
      - `test/e2e/bopstack-config.bats`
      - `test/e2e/helpers/setup.bash`
      - `test/e2e/fixtures/stub-pnpm`
    - Use `setup()`/`teardown()` in Bats to create/remove `$BATS_TEST_TMPDIR/project` and `$BATS_TEST_TMPDIR/bin`.
    - Plan decision: add `tsx` as a devDependency in Task 7 and have Bats invoke the TypeScript CLI with `node --import tsx src/index.ts ...` through a helper variable such as `BOPSTACK_CONFIG_CLI=(node --import tsx "$REPO_ROOT/src/index.ts")`.
    - Avoid `pnpm exec ...` after prepending stub `pnpm` to `PATH`, because the stub would shadow real pnpm.
    - Stub `pnpm` behavior:
      - Records argv to `$BATS_TEST_TMPDIR/pnpm-args.txt`.
      - Verifies first args are `add -D` in tests or leaves validation to assertions.
      - If `BOPSTACK_STUB_PNPM_FAIL=1`, print a known stderr line such as `stub pnpm failure` and exit 42.
      - On success, create package fixture dirs under current working directory's `node_modules/@bopstack/...` because install runs with `cwd: target`.
      - Write recognizable file contents for each config source so copy tests can assert exact content.
    - Fixture source files needed:
      - `@bopstack/tsconfig/tsconfig.base.json`
      - `@bopstack/oxfmt/oxfmtrc.json`
      - `@bopstack/oxlint/oxlintrc.json`
      - `@bopstack/commitlint/commitlintrc.ts`
      - `@bopstack/just/justfile`
      - `@bopstack/git-hook/lefthook.yml`
      - `@bopstack/markdownlint/markdownlint.json`
      - `@bopstack/spellcheck/cspell.json`
  - Steps:
    1. Add `test/e2e` directory structure and helper bootstrap.
    2. Implement temp project setup and teardown.
    3. Implement stub-bin PATH setup without breaking CLI TypeScript runner.
    4. Implement stub `pnpm` success/failure modes.
    5. Implement fixture package creation from stub install cwd.
    6. Add helper assertions for command status, output substring, file existence, and file content.
    7. Add one minimal harness smoke Bats test to prove setup.
    8. Run `bats test/e2e`.
    9. Commit only harness files as `test: add bats e2e harness for config cli`.

- completed: Task 6 — Add Bats CLI behavior tests
  - Description: Cover user-visible CLI paths with real command invocations.
  - Dependencies: Task 5
  - Acceptance Criteria: Bats tests pass for help, unknown command, missing target, invalid kind, dry-run init, successful full init, expected install args, rename outputs, summary output, and simulated install failure; commit created for this task only.
  - Implementation Detail:
    - Tests should use Bats `run` and assert `$status`, `$output`, and files on disk.
    - Help test expected substrings:
      - `Usage: bopstack-config <command> [options]`
      - `init     Install @bopstack/* config packages into a target project.`
    - Unknown command expected:
      - nonzero status
      - `Unknown command: <cmd>`
      - `Run \`bopstack-config --help\` for usage.`
    - Missing target expected:
      - nonzero status
      - `Target directory does not exist: <path>`
    - Invalid kind expected:
      - nonzero status
      - `Invalid project kind: <value>`
    - Dry-run expected:
      - status 0
      - contains `[dry-run] Would install packages via: pnpm add -D`
      - contains `[dry-run] create`
      - target does not contain `.lefthook.yml`, `.markdownlint.json`, `.cspell.json`, `commitlint.config.ts`, or other copied files.
    - Full init expected:
      - status 0
      - stub args contain `add -D` plus all expected packages.
      - files exist with exact fixture content at target root.
      - rename output files exist and unrenamed package filenames do not exist at target root for dotfile renames.
      - output contains `Packages installed successfully.` and summary counts.
    - Install failure expected:
      - nonzero status
      - contains `Package installation failed:`
      - contains stub stderr e.g. `stub pnpm failure`
      - no config files copied after failed install.
  - Steps:
    1. Add help/usage success test.
    2. Add unknown-command nonzero test.
    3. Add missing-target nonzero test.
    4. Add invalid-kind nonzero test.
    5. Add dry-run test asserting preview output and no written files.
    6. Add successful init test asserting stub `pnpm` args and written config files.
    7. Add rename assertions for `.lefthook.yml`, `.markdownlint.json`, `.cspell.json`, and `commitlint.config.ts`.
    8. Add summary output assertions.
    9. Add install-failure test asserting stderr, nonzero exit, and no copied files.
    10. Run `bats test/e2e`.
    11. Commit only behavior tests as `test: cover bopstack-config cli with bats`.

- completed: Task 7 — Wire scripts and document Bats prerequisite
  - Description: Update package scripts and docs so unit/e2e tests run predictably locally and in CI.
  - Dependencies: Task 3, Task 4, Task 6
  - Acceptance Criteria: `test:unit` runs Vitest; `test:e2e` runs Bats; `test` runs both; `check` includes format, lint, typecheck, unit tests, and e2e tests; README explains Bats requirement and expected command; commit created for this task only.
  - Implementation Detail:
    - Suggested scripts:
      - `"test:unit": "vitest run"`
      - `"test:e2e": "bats test/e2e"`
      - `"test": "pnpm run test:unit && pnpm run test:e2e"`
      - `"check": "oxfmt --config oxfmtrc.json . && oxlint . && tsc --noEmit && pnpm run test:unit && pnpm run test:e2e"`
    - Add `tsx` as a devDependency so Bats can run `node --import tsx src/index.ts ...` without invoking `pnpm exec` after stub `pnpm` is placed in `PATH`.
    - Document Bats installation examples:
      - macOS/Homebrew: `brew install bats-core`
      - other systems: install `bats-core` via package manager or CI image.
    - README should include:
      - `pnpm run test:unit`
      - `pnpm run test:e2e`
      - `pnpm test`
      - note that e2e uses stub `pnpm`, not network registry.
  - Steps:
    1. Update `package.json` scripts for `test:unit`, `test:e2e`, `test`, and `check`.
    2. Add `tsx` as a devDependency for Bats CLI invocation.
    3. Update README with Bats prerequisite and commands.
    4. Run `pnpm run test:unit`.
    5. Run `pnpm run test:e2e`; if Bats is unavailable, stop and report the missing prerequisite rather than skipping.
    6. Commit only script/docs/dependency changes as `chore: wire unit and e2e test scripts`.

- completed: Task 8 — Final verification and cleanup
  - Description: Run the final validation suite and clean up any obsolete tests or paths from the old layout.
  - Dependencies: Task 7
  - Acceptance Criteria: `pnpm run check` passes; old shallow tests are removed or replaced; no stale imports remain; plan scope is satisfied without implementing out-of-scope items; final verification commit created if cleanup changes are needed.
  - Implementation Detail:
    - Run these in order:
      1. `pnpm run format` or exact formatter from `check`.
      2. `pnpm run lint`.
      3. `pnpm run typecheck`.
      4. `pnpm run test:unit`.
      5. `pnpm run test:e2e`.
      6. `pnpm run check`.
    - If Bats unavailable locally, stop and mark `awaiting_user` rather than silently skipping final verification unless CI/environment guidance says otherwise.
    - Remove obsolete `src/cli/*.test.ts` only after equivalent `src/lib` tests exist.
    - Check `git status --short` before final commit. Do not include unrelated `.mcp.json` or `HANDOFF.md` unless user explicitly asks.
    - Confirm no changelog automation was implemented; user corrected that request as ignored.
  - Steps:
    1. Run formatter/linter/typecheck/unit/e2e via the package check command.
    2. Fix failures within the approved scope.
    3. Remove stale test files or update paths after restructure.
    4. Confirm all planned source/test/docs files are tracked and unrelated files are excluded.
    5. Confirm changelog automation and real registry smoke tests remain out of scope.
    6. Commit cleanup/verification-only changes as `chore: verify test plan implementation` when cleanup changes exist; otherwise record verification in the final response.

## Sequencing

Dependency order:

1. Task 1 establishes layout and seams.
2. Task 2 makes expected failures testable without process exits.
3. Tasks 3 and 4 can proceed after Task 2 and may be done in either order.
4. Task 5 depends on stable CLI entry/error contracts from Tasks 1–2.
5. Task 6 depends on the Bats harness from Task 5.
6. Task 7 depends on both test layers existing.
7. Task 8 verifies and cleans up the complete plan.

## Risks

- **Entry-point migration:** Moving the bin to `src/index.ts` can break package execution if `package.json` or imports are missed. Task 1 must update bin/imports together and typecheck before commit.
- **Bats availability:** If Bats is a system dependency, local/CI environments may lack it. Task 7 must document/setup this clearly.
- **Stub realism:** Stub `pnpm` provides deterministic install behavior but is not a real registry smoke test. This is intentional; broader release smoke testing remains out of scope.
- **Process-exit refactor risk:** Moving from direct `process.exit` to typed errors may accidentally alter CLI outputs/exit codes. Bats tests should lock expected behavior.
- **Copy source resolution:** Current file-copy code searches relative `node_modules`; tests may expose cwd/target ambiguity. Refactor should make resolution explicit without surprising users.
