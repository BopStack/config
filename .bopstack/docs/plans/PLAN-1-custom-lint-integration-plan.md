---
id: PLAN-1
title: "custom-lint Integration — Implementation Plan"
type: plan
date: 2026-06-04
workbranch: ""
specs:
  - .bopstack/docs/specs/SPEC-1-custom-lint-integration-design.md
---

# custom-lint Integration — Implementation Plan

## Overview

Port the two check scripts from `@bopstack/custom-lint` into `@bopstack/config` as a new `bopstack-config lint <name>` subcommand. No standalone bin entries — only the subcommand. The standalone `@bopstack/custom-lint` package gets a deprecation notice after this release.

**Total: 8 new files, 1 modified file, ~200 LOC.**

## Tasks

### Task 1: Port `check_justfile_syntax.ts` to `src/lint/`

- **Status:** `completed`
- **Description:** Copy `check_justfile_syntax.ts` from custom-lint repo to `src/lint/check_justfile_syntax.ts`. Remove the shebang line and the CLI entry guard `if (process.argv[1]?.endsWith(..))` block. Keep the exported `check_justfile_syntax(filePath: string): boolean` function unchanged.
- **Dependencies:** None
- **Acceptance Criteria:**
  - File exists at `src/lint/check_justfile_syntax.ts`
  - No shebang line
  - No CLI guard block
  - Exported function signature matches original
- **Steps:**
  1. Read `~/Projects/bopstack/custom-lint/src/check_justfile_syntax.ts`
  2. Write to `src/lint/check_justfile_syntax.ts` — strip line 1 shebang `#!/usr/bin/env node`, strip the CLI guard block at end of file
  3. Verify `import { check_justfile_syntax } from './check_justfile_syntax.js'` works

### Task 2: Port `check_no_coauthor.ts` to `src/lint/`

- **Status:** `completed`
- **Description:** Same as Task 1 but for `check_no_coauthor.ts`. Copy to `src/lint/check_no_coauthor.ts`, strip shebang + CLI guard.
- **Dependencies:** None
- **Acceptance Criteria:**
  - File exists at `src/lint/check_no_coauthor.ts`
  - No shebang line
  - No CLI guard block
  - Exported function signature matches original
- **Steps:**
  1. Read `~/Projects/bopstack/custom-lint/src/check_no_coauthor.ts`
  2. Write to `src/lint/check_no_coauthor.ts` — strip shebang, strip CLI guard block
  3. Verify exports are clean

### Task 3: Create `src/lint/index.ts` — lint check registry

- **Status:** `completed`
- **Description:** Write a registry module that defines the `LintCheck` interface and maps check names to their handler functions.
- **Dependencies:** Task 1, Task 2 (imports the two check functions)
- **Acceptance Criteria:**
  - Exports a `LintCheck` interface with `description`, `usage`, and `run` fields
  - Exports a `lint_checks` record mapping lowercase kebab-case names to `LintCheck`
  - `run` delegates to the imported check function, passing remaining args
  - Exports a `list_checks()` function returning formatted listing
- **Steps:**
  1. Define `LintCheck` interface
  2. Import both check functions from sibling files
  3. Build `lint_checks` record with name → `{ description, usage, run }` mapping
  4. Export helper `list_checks()` that joins names and descriptions

### Task 4: Create `src/cli/lint_command.ts` — lint subcommand handler

- **Status:** `completed`
- **Description:** Write the handler for `bopstack-config lint <name> [args...]`. Parses the name arg, dispatches to the registry, prints errors, exits with appropriate code.
- **Dependencies:** Task 3
- **Acceptance Criteria:**
  - No name arg → list available checks, exit 0
  - Unknown name → `console.error("Unknown lint check: '{name}'. Available: {list}")`, exit 1
  - Known name, no args → `console.error("Usage: bopstack-config lint {usage}")`, exit 1
  - Known name, args passed → calls `run(...args)`, exits 0 on true, 1 on false
  - Check throws → catches, prints error, exits 1
- **Steps:**
  1. Import `lint_checks` from `../lint/index.js`
  2. Export async function `lint(raw_args: string[])`
  3. Implement dispatch logic per acceptance criteria
  4. Pattern-match existing `init_command.ts` structure (export async fn, import process.exit)

### Task 5: Wire `lint` subcommand in `src/cli/run_cli.ts`

- **Status:** `completed`
- **Description:** Add `case 'lint'` to the switch statement in `run_cli.ts`, routing to `lint_command.lint(args)`.
- **Dependencies:** Task 4
- **Acceptance Criteria:**
  - `bopstack-config lint` calls `lint_command.ts`
  - `bopstack-config --help` lists `lint` command in usage text
  - Unknown subcommand still errors correctly
- **Steps:**
  1. Add `import { lint } from './lint_command.js'`
  2. Add `case 'lint': await lint(args); break` to switch
  3. Update help text with `lint` command description

### Task 6: Add subpath exports to `package.json`

- **Status:** `completed`
- **Description:** Add three new entries to the `exports` field: `./lint` (registry index), `./lint/check-justfile-syntax`, and `./lint/check-no-coauthor`.
- **Dependencies:** Task 1, Task 2, Task 3
- **Acceptance Criteria:**
  - `@bopstack/config/lint` resolves to `./dist/lint/index.js`
  - `@bopstack/config/lint/check-justfile-syntax` resolves to `./dist/lint/check_justfile_syntax.js`
  - `@bopstack/config/lint/check-no-coauthor` resolves to `./dist/lint/check_no_coauthor.js`
  - TypeScript types point to corresponding `.d.ts` files
- **Steps:**
  1. Read current `package.json` exports field
  2. Add three new entries matching existing pattern (types + import + default)
  3. Verify with `pnpm exec tsc --noEmit` and manual review

### Task 7: Port test — `check_justfile_syntax.test.ts`

- **Status:** `completed`
- **Description:** Copy test file from custom-lint, adapt import paths to new location. No other changes needed — vitest is already the test runner in both repos.
- **Dependencies:** Task 1
- **Acceptance Criteria:**
  - Tests pass: `pnpm exec vitest run src/lint/check_justfile_syntax.test.ts`
  - Same coverage as original
- **Steps:**
  1. Read `~/Projects/bopstack/custom-lint/src/check_justfile_syntax.test.ts`
  2. Write to `src/lint/check_justfile_syntax.test.ts` — update import path from `./check_justfile_syntax.js` (same relative path, just new location)
  3. Run to verify

### Task 8: Port test — `check_no_coauthor.test.ts`

- **Status:** `completed`
- **Description:** Same as Task 7 for the coauthor check test file.
- **Dependencies:** Task 2
- **Acceptance Criteria:**
  - Tests pass: `pnpm exec vitest run src/lint/check_no_coauthor.test.ts`
  - Same coverage as original
- **Steps:**
  1. Read `~/Projects/bopstack/custom-lint/src/check_no_coauthor.test.ts`
  2. Write to `src/lint/check_no_coauthor.test.ts` — update import path
  3. Run to verify

### Task 9: Add `lint_command.test.ts`

- **Status:** `completed`
- **Description:** Write a new test for the lint subcommand dispatch logic. Tests: unknown check name, missing args for known check, listing available checks (no name arg), and success/exit-codes.
- **Dependencies:** Task 4 (needs `lint` function to be importable)
- **Acceptance Criteria:**
  - Tests pass: `pnpm exec vitest run src/cli/lint_command.test.ts`
  - Covers: unknown name → error message, missing arg → usage message, no name → listing, success → calls through
  - Uses vi.spyOn for process.exit to avoid killing the test runner
- **Steps:**
  1. Create `src/cli/lint_command.test.ts`
  2. Test unknown check name
  3. Test missing args
  4. Test listing (no args)
  5. Test successful dispatch
  6. Mock `process.exit` with `vi.spyOn`

### Task 10: Build verification + deprecation notice

- **Status:** `completed`

- **Description:** Run full build gate (`just check`), verify everything compiles and tests pass. Then update the standalone `@bopstack/custom-lint` package with deprecation notice.
- **Dependencies:** All previous tasks
- **Acceptance Criteria:**
  - `just check` passes (format, lint, typecheck, vitest, e2e, pack)
  - `@bopstack/custom-lint/package.json` has `"deprecated": "Use @bopstack/config lint instead."`
  - `@bopstack/custom-lint/README.md` has deprecation banner at top
  - `@bopstack/custom-lint/CHANGELOG.md` updated with deprecation entry
- **Steps:**
  1. Run `just check` in config repo
  2. Fix any issues
  3. Navigate to custom-lint repo
  4. Add `deprecated` field to package.json
  5. Update README.md with deprecation banner
  6. Update CHANGELOG.md
  7. Run `just check` in custom-lint to ensure clean state

## Sequencing

```
Task 1 ─┐
         ├── Task 3 ── Task 4 ── Task 5 ──┐
Task 2 ─┘         │                       │
                  ├── Task 6 ─────────────┤
Task 7 ───────────┤                       ├── Task 10
Task 8 ───────────┤                       │
         Task 9 ──┘                       │
                                          ┘
```

Tasks 1-2 (port source) are independent and can run in parallel.
Tasks 7-8 (port tests) depend on 1-2 but are independent of the CLI layer.
Task 3 (registry) needs 1+2.
Task 4 (lint command) needs 3.
Task 5 (router wiring) needs 4.
Task 6 (exports) needs 1-3 but independent of 4-5.
Task 9 (lint command test) needs 4.
Task 10 (verification + deprecation) needs everything.

## Risks

- **`process.exit` mocking in vitest** — `process.exit(1)` in the lint command kills the test runner. Task 9 must mock/disable this with `vi.spyOn(process, 'exit').mockImplementation(...)`. Low risk once handled.
- **custom-lint deprecation notice timing** — applying deprecation to custom-lint before config is published means a gap where neither works. Apply notice AFTER verifying config builds and tests pass.
- **Test porting** — custom-lint may use slightly different vitest config or patterns. Low risk — both use vitest, and test files are simple.
