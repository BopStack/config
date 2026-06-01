# Vision — @bopstack/config

## Intent

`@bopstack/config` is a meta-installer CLI that wires up the `@bopstack/*` config packages into target projects. It does **not** ship config files itself — each config lives in its own focused repo and the CLI orchestrates them.

## How It Works

1. `bopstack-config init` detects the target project directory
2. Installs selected `@bopstack/*` packages via `pnpm add -D`
3. Copies config files from each installed package into the project root
4. Renames files when the target tool requires a dotfile prefix (e.g. `lefthook.yml` → `.lefthook.yml`)
5. Reports changed files and suggested next commands

## Why Not a Monorepo

The old VISION described a single package shipping all configs. That approach was abandoned in favor of independent mini-repos because:

- Smaller surface area per package (less drift)
- Independent versioning and release cadence
- Consumers can install only what they need
- Clear ownership per config domain

## Scope

### In Scope

- `bopstack-config init` — install and wire up config packages
- Dotfile rename handling (in-package clean names → installed dotfiles)
- Package selection by project kind

### Out of Scope

- Config file contents (these live in individual `@bopstack/*` packages)
- Update/diff mechanism (future)
- Drift detection (future)