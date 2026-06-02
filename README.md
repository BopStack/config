# @bopstack/config

Shared Biome and TypeScript configs plus an init CLI for BopStack projects.

## Install

```bash
pnpm add -D @bopstack/config
```

## CLI

Initialize a project with the shared config shims and dev dependencies:

```bash
pnpm exec bopstack-config init
```

Common options:

```bash
pnpm exec bopstack-config init --target=/path/to/project
pnpm exec bopstack-config init --kind=default --dry-run
```

| Flag              | Default   | Description                     |
| ----------------- | --------- | ------------------------------- |
| `--target=<path>` | `cwd`     | Target project directory        |
| `--kind=<type>`   | `default` | Project kind; currently default |
| `--dry-run`       | `false`   | Preview changes without writing |

## What `init` does

1. Adds `@bopstack/config`, `@biomejs/biome`, and `typescript` as dev dependencies.
2. Writes consumer shim files that extend the shared configs.
3. Prints the package installs and files it changed.

## Shared config exports

| Export path                       | Purpose                         |
| --------------------------------- | ------------------------------- |
| `@bopstack/config/biome`          | Biome formatter and linter base |
| `@bopstack/config/tsconfig/base`  | TypeScript compiler base        |

### `biome.json`

```json
{
	"extends": ["@bopstack/config/biome"]
}
```

### `tsconfig.json`

```json
{
	"extends": "@bopstack/config/tsconfig/base"
}
```

## Biome GritQL plugins

The Biome config includes custom GritQL rules:

- `no-console` — disallows `console.log` calls.

## Development

Requirements:

- Node.js 20+
- pnpm
- [just](https://github.com/casey/just)
- [Bats](https://bats-core.readthedocs.io/) for e2e tests (`brew install bats-core` on macOS)

Commands live in `justfile` instead of `package.json` scripts:

```bash
just install          # install dependencies
just format           # format with Biome
just lint             # lint with Biome
just typecheck        # TypeScript no-emit check
just test-unit        # Vitest tests
just test-e2e         # Bats e2e tests; uses stub pnpm, no registry network
just test             # unit + e2e
just build            # compile publishable dist/
just pack             # build + pnpm pack --dry-run
just check            # format, lint, typecheck, tests, pack dry-run
```

## License

MIT © BopStack
