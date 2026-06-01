# @bopstack/config — Handoff

## Identity

- **Directory**: `/Users/bruno/Projects/bopstack/config/`
- **Package**: `@bopstack/config` v0.1.0
- **Plan task**: T12 (Wave 4, Meta CLI) — **last code task in the plan**
- **Latest commit**: `3395923` — `chore: README and PUBLISH_ORDER updates`

## What it ships

CLI (`bopstack-config`) with subcommands:

- **`init`** — installs selected `@bopstack/*` packages into a target project, copies/renames config files (handling dotfile renames), reports next steps
  - `src/cli/init.ts` — main init logic (detect target, install pkgs, copy files, rename for dotfiles)
  - `src/cli/package_selection.ts` — returns package list per project kind
  - `src/cli/file_copy.ts` — handles dotfile rename table
  - `src/index.ts` — CLI entry with subcommand routing

### Dotfile rename table (applied during `init`)

| Package file (in-repo) | Installed as           |
| ---------------------- | ---------------------- |
| `lefthook.yml`         | `.lefthook.yml`        |
| `markdownlint.json`    | `.markdownlint.json`   |
| `cspell.json`          | `.cspell.json`         |
| `commitlintrc.ts`      | `commitlint.config.ts` |

## Dependencies

- **Runtime**: `effect`, `arktype`
- **Install-time**: all other `@bopstack/*` packages are installed into the target project via `pnpm add -D`

## Validation

- `just check` ✅ (7 tests — init, package selection, file copy)

## Notes

- `config/VISION.md` rewritten to describe the meta-installer role
- `config/PUBLISH_ORDER.md` documents the recommended npm publish sequence
- This is the **consumer-facing entry point** — most users will only install `@bopstack/config` and run `bopstack-config init`

## Publish order (from PUBLISH_ORDER.md)

1. `@bopstack/tsconfig`
2. `@bopstack/oxfmt`
3. `@bopstack/oxlint`
4. `@bopstack/commitlint`
5. `@bopstack/tsdown`
6. `@bopstack/markdownlint`
7. `@bopstack/spellcheck`
8. `@bopstack/custom-lint`
9. `@bopstack/just`
10. `@bopstack/git-hook`
11. `@bopstack/oxc` (publish new name, then deprecate old `@bopstack/lint`)
12. `@bopstack/config`

## Next steps

- Run publish order above
- Then create T13 smoke fixture to validate end-to-end
- Then T14 compat matrix + cross-repo docs