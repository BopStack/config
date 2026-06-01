# @bopstack/config

Meta-installer CLI for `@bopstack/*` config packages. Wires up tsconfig, oxlint, oxfmt, justfile, lefthook, and more into target projects.

## Install

```bash
pnpm add -D @bopstack/config
```

## Usage

```bash
pnpm exec bopstack-config init
pnpm exec bopstack-config init --target=/path/to/project
pnpm exec bopstack-config init --kind=default --dry-run
```

### Options

| Flag              | Default   | Description                             |
| ----------------- | --------- | --------------------------------------- |
| `--target=<path>` | `cwd`     | Target project directory                |
| `--kind=<type>`   | `default` | Project kind (currently only `default`) |
| `--dry-run`       | `false`   | Preview changes without writing         |

## What It Does

1. Installs `@bopstack/*` packages as devDependencies
2. Copies config files from each package into the project root
3. Renames files when the tool requires a dotfile prefix (e.g. `lefthook.yml` → `.lefthook.yml`)
4. Reports changed files and suggested next commands

## Packages Installed

- `@bopstack/tsconfig` — TypeScript base config
- `@bopstack/oxfmt` — oxfmt formatter config
- `@bopstack/oxlint` — oxlint linter config
- `@bopstack/oxc` — custom oxlint plugin (style and naming rules)
- `@bopstack/commitlint` — commitlint config
- `@bopstack/markdownlint` — markdownlint config
- `@bopstack/spellcheck` — cspell config
- `@bopstack/just` — shared justfile recipes
- `@bopstack/custom-lint` — custom lint scripts
- `@bopstack/git-hook` — lefthook git hook config

## Development

### Prerequisites

- [Bats](https://bats-core.readthedocs.io/) for e2e tests:
  - macOS: `brew install bats-core`
  - Other: install `bats-core` via system package manager or from GitHub releases

### Commands

```bash
# Unit tests (Vitest)
pnpm run test:unit

# E2E tests (Bats — uses deterministic stub pnpm, no network registry)
pnpm run test:e2e

# Both layers
pnpm test

# Full gate (format, lint, typecheck, unit, e2e)
pnpm run check
```

The e2e tests use a stub `pnpm` that records install arguments and creates fixture config files. No real packages are downloaded.