# @bopstack/config

BopStack shared configs and CLI — Biome and TypeScript configs in a single package.

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

1. Installs `@bopstack/config`, `@biomejs/biome`, and `typescript` as devDependencies
2. Generates consumer shim files (`biome.json`, `tsconfig.json`) that extend the shared configs
3. Reports installed packages and generated files

## Exports

| Export path                  | Shared config                            |
| ---------------------------- | ---------------------------------------- |
| `@bopstack/config/biome`     | Biome linter and formatter config        |
| `@bopstack/config/tsconfig/base` | TypeScript compiler base config      |

Consumers extend these in their project config files:

**biome.json**
```json
{
	"extends": ["@bopstack/config/biome"]
}
```

**tsconfig.json**
```json
{
	"extends": "@bopstack/config/tsconfig/base"
}
```

## Biome GritQL Plugins

The shared Biome config ships with custom GritQL plugins:
- `no-console` — disallows `console.log` calls

## Development

### Prerequisites

- [Bats](https://bats-core.readthedocs.io/) for e2e tests:
  - macOS: `brew install bats-core`
  - Other: install `bats-core` via system package manager or from GitHub releases
- [Biome](https://biomejs.dev) ^2.4.5

### Commands

```bash
# Install dependencies
just install

# Format
just format

# Lint
just lint

# Typecheck
just typecheck

# Unit tests (Vitest)
just test-unit

# E2E tests (Bats — uses deterministic stub pnpm, no network registry)
just test-e2e

# Both layers
just test
```

The e2e tests use a stub `pnpm` that records install arguments. No real packages are downloaded.

## License

MIT
