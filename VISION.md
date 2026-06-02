# Vision — @bopstack/config

## Intent

`@bopstack/config` is a single consumer-facing package that ships shared tool configs (Biome rules, TypeScript options, and more) plus a CLI to wire them into target projects. Configs live **in this package** and are extended by consumer shims.

## How It Works

1. `bopstack-config init` installs `@bopstack/config`, `@biomejs/biome`, and `typescript` as devDependencies
2. Generates minimal consumer shim files (`biome.json`, `tsconfig.json`) that extend the shared configs via package exports
3. Reports installed packages and generated files

## Why a Single Package

The earlier approach shipped configs in independent mini-repos. That was abandoned because:

- Release overhead across N packages (version bumps, changelogs, CI runs)
- Version-sync risk between packages that are always installed together
- Complex multi-package install story for a simple setup
- Single source of truth for config conventions

## Scope

### In Scope

- Shared config assets for Biome and TypeScript (initially)
- `bopstack-config init` — install packages and generate consumer shims
- Biome GritQL plugins for custom lint rules

### Out of Scope

- Config domains beyond Biome and TypeScript (future)
- Update/diff mechanism (future)
- Drift detection (future)
