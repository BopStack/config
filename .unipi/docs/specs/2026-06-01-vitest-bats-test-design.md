---
title: "Vitest Unit Tests and Bats CLI E2E Tests"
type: brainstorm
date: 2026-06-01
---

# Vitest Unit Tests and Bats CLI E2E Tests

## Problem Statement

`@bopstack/config` is the consumer-facing meta-installer, so publish readiness depends on more than TypeScript compiling. The package needs confidence for maintainers before publishing, CI on future PRs, and downstream users who invoke the CLI. Existing Vitest coverage is minimal and does not prove the full `bopstack-config init` command path.

The goal is a two-layer test strategy: Vitest verifies units and reusable logic; Bats verifies real CLI calls and user-visible behavior.

## Context

Current package state:

- `package.json` already uses Vitest via `test` and `check` scripts.
- `vitest.config.ts` exists.
- Existing tests cover a few shallow cases under `src/cli/*.test.ts`.
- CLI behavior lives mostly under `src/cli`:
  - `src/cli/index.ts` routes subcommands and handles top-level failures.
  - `src/cli/init.ts` parses args, validates target/kind, runs `pnpm add -D`, copies config files, reports summary.
  - `src/cli/package_selection.ts` defines package/config file tables and rename behavior.
  - `src/cli/file_copy.ts` copies package config files from `node_modules` into target projects.
- Some behavior is hard to unit test cleanly because parsing and validation currently call `process.exit` directly.
- Bats is not yet wired into scripts.

## Chosen Approach

Refactor toward testable layers, then add Vitest unit tests and Bats CLI e2e tests.

Recommended structure:

- `src/index.ts` — package/bin entry point or public entry, depending on final packaging choice.
- `src/cli/` — command adapters: process args, console output, exit codes, process-level wiring, child process invocation boundary.
- `src/lib/` — reusable/testable logic: arg parsing, package selection, config file resolution/copy logic, summary/result modeling, typed errors.
- `src/**/*.test.ts` — Vitest unit tests colocated with logic.
- `test/e2e/*.bats` — Bats tests for real command invocations.
- `test/e2e/helpers/` — Bats helper functions, temp project setup, stub `pnpm` setup.

Bats should run real CLI invocations. To keep full-flow tests deterministic while still exercising install behavior, e2e tests should put a stub `pnpm` first in `PATH`. The stub validates `pnpm add -D ...` args, can simulate success/failure, and creates fixture `node_modules/@bopstack/*` config files so the CLI performs real copy/rename work after installation.

## Why This Approach

This approach optimizes for confidence without making the default suite dependent on the npm registry or sibling package state.

Alternatives rejected:

1. **Black-box CLI-only tests** — strong user-facing coverage, but weak diagnostics and poor coverage of edge branches such as parsing, rename tables, summary counts, and missing source paths.
2. **Mock-heavy Vitest with minimal Bats** — fast, but risks over-testing implementation details and under-testing actual CLI behavior.
3. **Real registry install in Bats** — closest to downstream usage, but slow/flaky for normal CI and can fail for reasons unrelated to this package.
4. **Local pack/link of all sibling packages** — realistic, but requires wider monorepo/package orchestration and is better suited for a later smoke fixture or release workflow.

The chosen plan keeps unit tests precise and fast while making Bats prove command behavior, install invocation, file writes, dotfile renames, summaries, stdout/stderr, and exit codes.

## Design

### Architecture

Move pure/reusable logic into `src/lib`:

- Arg parsing returns a typed result or typed domain error. It should not call `process.exit`.
- Project kind validation lives beside parser/package metadata and can be unit-tested directly.
- Package selection and config file selection remain deterministic data/functions.
- File copy helpers expose inputs/outputs clearly enough to test dry-run, existing targets, missing source files, nested dirs, and rename behavior.
- Summary modeling/counting should be testable without relying only on console assertions.

Keep process concerns in `src/cli`:

- Read `process.argv`.
- Print help/errors.
- Map typed errors to stderr and exit codes.
- Run `pnpm` through a small boundary function or injected dependency.
- Orchestrate init: parse args → validate target → install packages → copy config files → report summary.

### Unit Tests With Vitest

Vitest should cover units, not CLI shells:

- Parser behavior:
  - default target is `process.cwd()` or injected cwd equivalent.
  - `--target=<path>` is accepted.
  - `--kind=default` is accepted.
  - invalid kind produces a typed error.
  - `--dry-run` toggles dry-run.
  - unknown/unsupported args behavior is explicitly tested according to final parser contract.
- Package/config selection:
  - default package list includes all intended `@bopstack/*` packages.
  - config file list includes tsconfig, oxfmt, oxlint, commitlint, just, git-hook, markdownlint, spellcheck.
  - rename behavior includes `lefthook.yml` → `.lefthook.yml`, `markdownlint.json` → `.markdownlint.json`, `cspell.json` → `.cspell.json`, and `commitlintrc.ts` → `commitlint.config.ts`.
- File copy logic:
  - dry-run reports create/overwrite without writing.
  - real copy writes from package fixture to target.
  - missing source with no existing target skips predictably.
  - existing target behavior is covered.
  - nested target dirs are created when needed.
- Summary/error logic:
  - written/skipped/existing counts are correct.
  - install failure handling preserves stderr and nonzero failure.

### E2E Tests With Bats

Bats should verify real command behavior from the user perspective:

- `bopstack-config --help` prints usage and exits 0.
- unknown command prints error/help hint and exits nonzero.
- `bopstack-config init --target=<missing>` exits nonzero with target error.
- invalid `--kind` exits nonzero with kind error.
- `bopstack-config init --target=<tmp> --dry-run` prints install/copy preview and does not write files.
- `bopstack-config init --target=<tmp>` calls stub `pnpm add -D` with expected package args.
- successful full init writes expected config files.
- dotfile/rename results are asserted on disk:
  - `.lefthook.yml`
  - `.markdownlint.json`
  - `.cspell.json`
  - `commitlint.config.ts`
- summary output reports expected package/file counts.
- simulated `pnpm` failure exits nonzero and prints install failure stderr.

Bats helpers should create isolated temp dirs per test, clean them up, prepend a stub-bin dir to `PATH`, and provide assertions for files/output/exit codes. The stub `pnpm` should be part of test fixtures, not production code.

### Scripts and Tooling

Package scripts should distinguish layers:

- `test:unit` runs Vitest.
- `test:e2e` runs Bats.
- `test` runs both layers.
- `check` includes formatting, linting, typecheck, unit tests, and e2e tests.

If Bats needs installation, document expected dependency path in README or contributor docs. Prefer using the system `bats` binary in CI, with clear failure text if unavailable.

### Error Handling

Use typed/domain errors or result objects for expected failures:

- invalid project kind
- missing target directory
- package installation failure
- copy source missing

CLI adapters convert these to user-facing stderr/stdout and exit codes. Unit tests assert the typed behavior; Bats asserts the process behavior.

## Implementation Checklist

- [ ] Restructure source into `src/index.ts`, `src/cli`, and `src/lib` with process concerns separated from reusable logic.
- [ ] Refactor init argument parsing and validation so invalid input returns typed errors instead of directly exiting from pure logic.
- [ ] Add/expand Vitest unit tests for parser, project kind validation, package selection, config file selection, and rename mappings.
- [ ] Add/expand Vitest unit tests for file copy behavior, dry-run behavior, missing/existing source/target cases, nested dirs, and summary counts.
- [ ] Add Bats e2e harness with temp project helpers, stub `pnpm`, fixture package files, and cleanup.
- [ ] Add Bats tests for help, unknown command, missing target, invalid kind, dry-run init, successful full init, rename outputs, summary output, and install failure.
- [ ] Update package scripts so `test:unit`, `test:e2e`, `test`, and `check` run the intended layers.
- [ ] Document local/CI prerequisites for running Bats.

## Open Questions

- Should `src/index.ts` remain the bin entry directly, or should it delegate to a separate `src/cli/index.ts` while also serving as package public entry?
- Should unknown `init` flags be ignored for backward compatibility or rejected for stricter CLI behavior?
- Should Bats be installed as a project/dev dependency via an npm package wrapper, or treated as a system dependency in docs/CI setup?
- Should a later release smoke test run real package install/link across all `@bopstack/*` packages outside the default fast suite?

## Out of Scope

- Publishing packages.
- Implementing changelog automation.
- Running real npm registry installs in default tests.
- Creating the later T13 smoke fixture or T14 compatibility matrix.
- Changing CLI product behavior beyond testability-focused seams and explicit parser/error contracts.
