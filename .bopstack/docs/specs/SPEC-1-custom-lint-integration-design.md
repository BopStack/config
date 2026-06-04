---
id: SPEC-1
title: "custom-lint Integration"
type: brainstorm
date: 2026-06-04
---

# custom-lint Integration

## Problem Statement

`@bopstack/custom-lint` (two CLI scripts — `check-justfile-syntax` and `check-no-coauthor`) lives in a separate repo at `~/Projects/bopstack/custom-lint/`. It uses oxlint/oxfmt for its own dev tooling, but the `bopstack` config ecosystem has consolidated around Biome. The functionality needs to move into `@bopstack/config` so there's one package to install, one set of conventions, and one CLI to discover. The standalone package is deprecated after a one-cycle migration window.

## Context

- `@bopstack/config` is the single entry point for BopStack project configuration — shared Biome config, tsconfig, and `bopstack-config init` CLI.
- `@bopstack/custom-lint` ships two standalone bin scripts: `check-justfile-syntax` (validates justfiles) and `check-no-coauthor` (rejects `Co-authored-by:` in commit messages).
- Both scripts are runtime checkers that shell out (`spawnSync` to `just`) or read commit message files. They are NOT Biome/GritQL lint rules — they're operational checks that run in CI or git hooks.
- The original design doc (2026-05-29) envisioned `@bopstack/config` as a meta-installer for many sub-packages. That was abandoned in the single-package pivot. This integration brings one sub-package's functionality back as built-in source, keeping the single-package model.
- The standalone `@bopstack/custom-lint` repo keeps publishing for one release cycle with a deprecation notice, then archived.

## Chosen Approach

Copy the two check implementations directly into `@bopstack/config`'s source tree under `src/lint/`. Expose them through a new `bopstack-config lint <name>` subcommand. No standalone bin entries in package.json — the lint subcommand is the only CLI entry point. No init integration (git hook scaffolding is out of scope).

## Why This Approach

- **Rejected: Runtime dependency on `@bopstack/custom-lint`** — would create a circular-ish dependency and require the standalone package to stay alive indefinitely. Source copy severs the link cleanly.
- **Rejected: GritQL plugins** — these checks run external binaries (`just --summary`) or read files dynamic to the environment. They aren't static-analysis lint rules. GritQL can't express them.
- **Rejected: Separate bin entries** — the user wants a single discoverable CLI (`bopstack-config lint <name>`), not two more global commands polluting the namespace.
- **Rejected: Init integration** — adding git hook setup logic to `bopstack-config init` is scope creep. These checks remain manual opt-in via the CLI.

## Design

### CLI: `bopstack-config lint <name> [args...]`

New subcommand routed from `run_cli.ts`.

**Usage:**

```bash
bopstack-config lint check-justfile-syntax <path-to-justfile>
bopstack-config lint check-no-coauthor <path-to-commit-msg>
bopstack-config lint                     # → list available checks
bopstack-config lint unknown-thing       # → stderr + exit 1
```

**Exit codes:**
- `0` — check passed
- `1` — check failed or unknown name or missing arg

### Module layout

```
src/
  cli/
    run_cli.ts              # add "lint" to subcommand router
    lint_command.ts         # parse lint <name> [args], dispatch, handle exit
  lint/
    index.ts                # registry: Record<string, LintCheck>
    check_justfile_syntax.ts
    check_no_coauthor.ts
    check_justfile_syntax.test.ts
    check_no_coauthor.test.ts
```

### Key type

```ts
interface LintCheck {
  description: string   // short one-liner for listing
  usage: string         // "check-justfile-syntax <path-to-justfile>"
  run: (...args: string[]) => boolean | Promise<boolean>
}
```

### Source porting

| From `custom-lint/src/` | To `config/src/lint/` | Changes |
|---|---|---|
| `check_justfile_syntax.ts` | `check_justfile_syntax.ts` | Remove shebang, remove CLI entry guard (`if (process.argv[1]?.endsWith...)`). Keep exported function + imports. |
| `check_no_coauthor.ts` | `check_no_coauthor.ts` | Same changes. |
| `check_justfile_syntax.test.ts` | `check_justfile_syntax.test.ts` | Port verbatim. |
| `check_no_coauthor.test.ts` | `check_no_coauthor.test.ts` | Port verbatim. |
| `index.ts` | `src/lint/index.ts` | Write new registry. |

### Package exports

```json
{
  "exports": {
    "./lint": "./dist/lint/index.js",
    "./lint/check-justfile-syntax": "./dist/lint/check_justfile_syntax.js",
    "./lint/check-no-coauthor": "./dist/lint/check_no_coauthor.js"
  }
}
```

No `bin` entries. No runtime dependency on `@bopstack/custom-lint`.

### Error handling

- **Unknown check name** → `console.error("Unknown lint check: '${name}'. Available: ${names.join(', ')}")`, exit 1
- **Missing arguments** → `console.error("Usage: bopstack-config lint ${usage}")`, exit 1
- **Check returns false** → exit 1 (check already printed its own error to stderr)
- **Check throws** → `console.error("Lint check '${name}' failed: ${error.message}")`, exit 1

### Testing

- Unit tests for `check_justfile_syntax` and `check_no_coauthor` ported from custom-lint
- Unit test for `lint_command.ts` — unknown name, missing arg, success path
- No e2e changes (the lint subcommand is covered by unit tests + ported fixture tests)

## Deprecation plan

1. This release of `@bopstack/config` (v0.2.0) contains the `lint` subcommand
2. Same-day: update `@bopstack/custom-lint` README + add deprecation notice to its package.json:
   ```
   "deprecated": "Use @bopstack/config lint instead. See https://github.com/BopStack/config"
   ```
3. Next release cycle: consider unpublishing or archiving the standalone repo

### Checklist for standalone package

- [ ] Add `deprecated` field to `custom-lint/package.json`
- [ ] Mark `README.md` with deprecation banner pointing to `@bopstack/config lint`
- [ ] Update `custom-lint/CHANGELOG.md`
- [ ] After one cycle, archive the repo or stop publishing

## Implementation Checklist

- [x] Port `check_justfile_syntax.ts` to `src/lint/` — strip shebang + CLI guard — PLAN-1 Task 1
- [x] Port `check_no_coauthor.ts` to `src/lint/` — strip shebang + CLI guard — PLAN-1 Task 2
- [x] Create `src/lint/index.ts` — `LintCheck` type + registry map — PLAN-1 Task 3
- [x] Create `src/cli/lint_command.ts` — parse, dispatch, exit-code handling — PLAN-1 Task 4
- [x] Wire `lint` subcommand in `src/cli/run_cli.ts` — PLAN-1 Task 5
- [x] Add `./lint`, `./lint/check-justfile-syntax`, `./lint/check-no-coauthor` to package.json exports — PLAN-1 Task 6
- [x] Port `check_justfile_syntax.test.ts` from custom-lint — PLAN-1 Task 7
- [x] Port `check_no_coauthor.test.ts` from custom-lint — PLAN-1 Task 8
- [x] Add `lint_command.test.ts` — unknown name, missing arg, success — PLAN-1 Task 9
- [x] Update `@bopstack/custom-lint` with deprecation notice — PLAN-1 Task 10
- [x] Run `just check` — format, lint, typecheck, tests, pack — PLAN-1 Task 10

## Open Questions

- None — all decisions resolved during brainstorm.

## Out of Scope

- Git hook scaffolding via `bopstack-config init` — may revisit later
- Additional lint checks beyond the two existing ones
- GritQL/Biome plugin equivalents for these checks (not possible — they run external binaries)
- Converting custom-lint's test runner or build toolchain (config uses Biome + tsc; custom-lint used oxlint + oxfmt — the ported source adopts config's toolchain)
