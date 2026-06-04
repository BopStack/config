# @bopstack/config

Shared Biome and TypeScript configs plus an init CLI for BopStack projects.

This package provides a **Biome-only** config that achieves BopStack's lint and format parity with oxlint, oxfmt, and FFB conventions — all without installing oxlint or oxfmt.

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

## Biome parity with oxlint, oxfmt, and FFB

### Formatter parity with oxfmt

| oxfmt setting       | Biome equivalent                        | Status |
| ------------------- | --------------------------------------- | ------ |
| `useTabs: true`     | `formatter.indentStyle: "tab"`          | native |
| `singleQuote: true` | `javascript.formatter.quoteStyle: "single"` | native |
| `semi: false`       | `javascript.formatter.semicolons: "asNeeded"` | native |
| `trailingComma: none` | `javascript.formatter.trailingCommas: "none"` | native |
| `printWidth: 100`   | `formatter.lineWidth: 100`              | native |
| `sortImports: true` | `assist.actions.source.organizeImports: "on"` | native |
| `sortTailwindcss: true` | `nursery.useSortedClasses: "error"`  | native |
| `sortPackageJson: true` | no Biome equivalent                 | known gap |
| `insertFinalNewline: false` | no Biome equivalent            | known gap |

### Native Biome lint rules (enforced natively)

Rules from oxlint, FFB `biome.json`, and OXC that Biome enforces natively:

| Convention | Source | Biome category | Rule |
|---|---|---|---|
| no `console.log` | oxlint, FFB Grit | `suspicious` | `noConsole: "error"` |
| no `debugger` | oxlint | `suspicious` | `noDebugger` (via recommended) |
| no `eval` | oxlint | `security` | `noGlobalEval` (via recommended) |
| strict equality (`===`) | oxlint, FFB Grit | `suspicious` | `noDoubleEquals` (via recommended) |
| no `any` type | oxlint | `suspicious` | `noExplicitAny: "error"` |
| no unused variables | oxlint | `correctness` | `noUnusedVariables: "error"` |
| no unused imports | FFB | `correctness` | `noUnusedImports: "error"` |
| `prefer-const` | oxlint | `style` | `useConst: "error"` |
| no nested ternary | oxlint | `style` | `noNestedTernary: "error"` |
| max 3 function params | oxlint | `complexity` | `useMaxParams { max: 3 }` |
| require curly braces | oxlint | `style` | `useBlockStatements: "error"` |
| no import cycles | oxlint | `suspicious` | `noImportCycles: "error"` |
| exhaustive deps | FFB | `correctness` | `useExhaustiveDependencies: "error"` |
| no nested components | FFB | `correctness` | `noNestedComponentDefinitions: "error"` |
| no useless else | FFB | `style` | `noUselessElse: "error"` |
| no magic numbers | FFB | `style` | `noMagicNumbers: "error"` |
| no inferrable types | FFB | `style` | `noInferrableTypes: "error"` |
| collapsed if | FFB | `style` | `useCollapsedIf: "error"` |
| no `forEach` | FFB | `complexity` | `noForEach: "error"` |
| no implicit coercions | FFB | `complexity` | `noImplicitCoercions: "error"` |
| cognitive complexity 15 | FFB | `complexity` | `noExcessiveCognitiveComplexity { max: 15 }` |
| max 80 lines/function | FFB | `complexity` | `noExcessiveLinesPerFunction { max: 80 }` |
| no inline styles | FFB, OXC | `nursery` | `noInlineStyles: "error"` |
| no secrets | FFB | `security` | `noSecrets: "error"` |
| no empty catch | FFB, OXC | `suspicious` | `noEmptyBlockStatements: "error"` |
| template literals | FFB | `style` | `useTemplate: "error"` |
| no `@ts-ignore` | FFB, OXC | `suspicious` | `noTsIgnore` (via recommended) |
| naming convention | OXC | `style` | `useNamingConvention` |
| Tailwind class sorting | oxfmt | `nursery` | `useSortedClasses: "error"` |
| no accumulating spread | FFB | `performance` | `noAccumulatingSpread: "error"` |
| no barrel file | FFB | `performance` | `noBarrelFile: "error"` |
| no await in loops | FFB | `performance` | `noAwaitInLoops: "error"` |

### Custom GritQL rules (Biome does not have native equivalents)

These rules ship as GritQL plugins in `@bopstack/config/biome`:

| Rule | Severity | Scope | Description |
|---|---|---|---|
| `no_inline_if` | error | all | Require braces for `if`/`else`/`while`/`for` bodies. |
| `no_hardcoded_colors` | warn | CSS files | Deny hex, rgb, hsl hardcoded color values. Use CSS custom properties (`var(--color-*)`) instead. |
| `test_naming` | error | all test files | Enforce riteway naming convention: `test('given <condition>: should <behavior>')`. |
| `prefer_testid` | error | test/e2e files | Prefer `getByTestId` over DOM queries like `getByText`, `getByRole`. |
| `max_nesting_depth` | error | all | Limit control flow nesting to at most 1 level per function. |
| `drizzle_fk_index` | info | Drizzle schema files | Suggest adding indexes for FK columns referenced with `references()`. |
| `drizzle_no_relations` | info | Drizzle schema files | Suggest adding `relations()` for type-safe relational queries. |

### Removed duplicates

The following rules had GritQL custom implementations that were replaced by native Biome rules:

| Removed Grit rule | Replaced by | Reason |
|---|---|---|
| `no-console.grit` | `suspicious.noConsole: "error"` | Biome native rule covers the same enforcement. |

### Known gaps

These source conventions are not enforced by the shared config because Biome lacks equivalent support, or because a native equivalent would be too invasive for a shared consumer config:

| Convention | Source | Reason |
|---|---|---|
| Package JSON sorting | oxfmt | No Biome equivalent. |
| No final newline insertion | oxfmt | Biome always inserts a final newline. |
| snake_case filenames | oxlint `filename-case` | Intentionally omitted — `useFilenamingConvention` is too invasive for a shared config; consumers should configure per-project. |

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
