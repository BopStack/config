---
title: "Bopstack Config Tooling — Multi-Repo Architecture & Package Design"
type: brainstorm
date: 2026-05-29
---

# Bopstack Config Tooling — Multi-Repo Architecture & Package Design

## Problem Statement

Every new TypeScript project requires manually copying tsconfig, oxlint, oxfmt, justfile, lefthook, commitlint, and other config files from a previous project. Configs drift, fixes don't propagate, and conventions weaken. Need a focused set of small repositories under `~/Projects/bopstack/` that ship Bruno's linting and configuration standards as installable packages.

This is **not** a giant monorepo. The goal is independent mini repos with clear ownership, small surface area, and simple publishing.

## Context

- **Current state**: `config/` was explored as a possible monorepo. `oxc/` already exists separately and ships an oxlint JS plugin. Config values are scattered across existing projects.
- **Revised target**: multiple mini repos at `~/Projects/bopstack/`, one repo per durable package or tightly related package family.
- **Source of truth**: Config values derived from oxc (production), cross-validated with UniPi and ai projects.
- **Key constraint**: No dotfiles inside packages. Files use clean names like `oxlintrc.json`, `oxfmtrc.json`, `lefthook.yml`, `commitlintrc.ts`. Target projects copy/rename when a tool requires dotfile names.
- **Explicit non-action for this design phase**: Do not delete `.git`, move repos, initialize repos, or restructure files yet. This spec only records the intended architecture.

## Chosen Approach

**Multiple mini repos under `~/Projects/bopstack/`, scoped to linting and configuration.** Each repo has one stable responsibility. Packages can depend on each other through normal npm versions, not workspace links. `@bopstack/config` becomes the optional setup CLI that installs or wires the other packages into target projects.

## Why This Approach

- **Rejected: One giant monorepo** — too much scope creep. It invites AI tooling, Pi extensions, apps, and unrelated automation into a repo meant for linting/config. Also couples release process and repo maintenance for packages that may move at different speeds.
- **Rejected: Single package** — too many unrelated concerns in one installable unit. Users should be able to install only `@bopstack/tsconfig`, only `@bopstack/oxfmt`, or only the CLI.
- **Chosen: Mini repos** — simple mental model, simpler git history, independent release cadence, low repo plumbing, easy extraction/sharing. Slightly more version coordination, but that is acceptable for this stage.

## Repository Map

All repos live directly under `~/Projects/bopstack/`.

```
~/Projects/bopstack/
├── config/              # @bopstack/config — optional CLI/meta installer
├── tsconfig/            # @bopstack/tsconfig — TypeScript configs
├── oxlint/              # @bopstack/oxlint — oxlint config
├── oxc/                 # @bopstack/oxc — oxlint JS plugin/custom rules
├── oxfmt/               # @bopstack/oxfmt — oxfmt config
├── just/                # @bopstack/just — justfile templates
├── git-hook/            # @bopstack/git-hook — lefthook config
├── custom-lint/         # @bopstack/custom-lint — custom lint/check scripts
├── tsdown/              # @bopstack/tsdown — tsdown config
├── commitlint/          # @bopstack/commitlint — commitlint config
├── markdownlint/        # @bopstack/markdownlint — markdownlint config
└── spellcheck/          # @bopstack/spellcheck — cspell config
```

### Boundary Rule

A repo belongs in this family only if it configures or enforces project quality/build conventions.

**In scope:**

- TypeScript compiler config
- Formatter config
- Linter config
- Custom lint/check scripts
- Build config
- Git hooks
- Task recipes
- Commit message linting
- Markdown/spelling checks
- Optional CLI that wires the above together

**Out of scope:**

- AI/Pi extensions
- Apps
- Runtime libraries unrelated to config/linting
- Personal automation not needed by target projects
- Large all-in-one `bopstack` platform repo

## Design

### Repo: `config/` — `@bopstack/config`

Purpose: optional CLI/meta installer that wires the config packages into a target project.

**MVP CLI**: `bopstack-config init [--target <path>]`

Behavior:

1. Reads target project directory (defaults to cwd)
2. Detects or prompts for project kind (MVP: just `default`)
3. Installs required `@bopstack/*` packages as dev dependencies or prints the exact install command
4. Copies or symlinks config files into the target root
5. Renames dotfile-required files when needed, such as `lefthook.yml` → `.lefthook.yml`
6. Reports what changed and what commands to run next

Dependencies: may depend on the other published `@bopstack/*` packages, but should avoid pulling heavy/optional tools unless needed.

### Repo: `tsconfig/` — `@bopstack/tsconfig`

Purpose: TypeScript base config for target projects.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "exactOptionalPropertyTypes": false,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

Consumption:

```json
{
  "extends": "@bopstack/tsconfig",
  "include": ["src"]
}
```

### Repo: `oxc/` — `@bopstack/oxc`

Purpose: oxlint JS plugin with custom bopstack rules.

Current source: existing `~/Projects/bopstack/oxc/` repo.

Rules include naming conventions, no inline styles, no hardcoded colors, test naming, no empty catch, no ts-ignore, no throw, and other project-specific checks.

Dependencies: oxlint as dev dependency/plugin target.

### Repo: `oxlint/` — `@bopstack/oxlint`

Purpose: oxlint configuration with bopstack custom rules plus core rules.

Content: `oxlintrc.json` with the production ruleset from oxc and cross-checked projects, including bopstack rules, eslint/curly, no-console, max-params, unicorn/filename-case, typescript/no-explicit-any, import/no-cycle, React rules when relevant, and test overrides.

Dependencies: peer or documented companion dependency on `@bopstack/oxc`.

### Repo: `oxfmt/` — `@bopstack/oxfmt`

Purpose: oxfmt formatter config.

```json
{
  "useTabs": true,
  "singleQuote": true,
  "trailingComma": "none",
  "semi": false,
  "printWidth": 100,
  "sortImports": true,
  "sortTailwindcss": true,
  "sortPackageJson": true,
  "insertFinalNewline": false
}
```

### Repo: `just/` — `@bopstack/just`

Purpose: justfile templates with standard recipes.

Recipes:

- `install`
- `build`
- `format`
- `lint`
- `typecheck`
- `test`
- `e2e`
- `lint_just`
- `lint_no_coauthor`

Target projects can copy the justfile, import it when Just supports the needed path shape, or let `@bopstack/config` install it.

### Repo: `git-hook/` — `@bopstack/git-hook`

Purpose: lefthook configuration for git hooks.

Content: `lefthook.yml` with:

- pre-commit: typecheck, lint, secretlint, just validation
- commit-msg: commitlint, coauthor check
- pre-push: typecheck/check gate
- output config matching current production usage

### Repo: `custom-lint/` — `@bopstack/custom-lint`

Purpose: shell/Node scripts for checks that oxlint does not cover.

Initial scripts:

- `check-justfile-syntax` — validates justfile syntax
- `check-no-coauthor` — prevents `Co-authored-by` trailers

Additional scripts only added when repeated across projects.

### Repo: `tsdown/` — `@bopstack/tsdown`

Purpose: tsdown bundler configuration for library builds.

Content: tsdown config with ESM output, declaration generation, and external dependency handling.

Status: lower confidence than the other packages because current production projects do not yet standardize on tsdown. Can be delayed until first real consumer exists.

### Repo: `commitlint/` — `@bopstack/commitlint`

Purpose: commitlint configuration for Conventional Commits.

Content: `commitlintrc.ts` extending `@commitlint/config-conventional` and enforcing allowed types:

```ts
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "build", "ci", "chore", "docs", "style", "perf", "test"]
    ]
  }
}
```

### Repo: `markdownlint/` — `@bopstack/markdownlint`

Purpose: markdownlint configuration.

```json
{
  "default": true,
  "MD013": false,
  "MD033": false,
  "MD041": false
}
```

Status: optional/future unless multiple active repos need it immediately.

### Repo: `spellcheck/` — `@bopstack/spellcheck`

Purpose: cspell configuration.

```json
{
  "version": "0.2",
  "language": "en",
  "words": ["bopstack", "tsconfig", "oxlint", "oxfmt", "tsdown", "lefthook", "codegraph"]
}
```

Status: optional/future unless multiple active repos need it immediately.

## Inter-Repo Dependencies

```
@bopstack/oxlint ──(peer/documented companion)──> @bopstack/oxc
@bopstack/git-hook ──(expects)──────────────────> @bopstack/commitlint + @bopstack/custom-lint
@bopstack/config ──(installs/orchestrates)──────> selected @bopstack/* config packages
```

All other repos should stay independent.

## Versioning & Release Strategy

Each mini repo versions independently.

Recommended initial approach:

- Start every new repo at `0.1.0`
- Use Conventional Commits
- Keep CHANGELOG per repo
- Publish only repos that are immediately useful
- Let `@bopstack/config` pin or recommend compatible versions

Why independent versions:

- Config-only changes should not force unrelated package releases
- `@bopstack/oxc` can release custom rule fixes without publishing `@bopstack/tsconfig`
- Optional packages like markdownlint/spellcheck can mature later

Main tradeoff: compatible-version coordination is manual. Mitigation: document known-good package set in `@bopstack/config` and update it when config packages change.

## Target Project Consumption

Without CLI:

```bash
pnpm add -D @bopstack/tsconfig @bopstack/oxlint @bopstack/oxfmt @bopstack/git-hook
```

Then manually extend/copy files.

With CLI:

```bash
pnpm add -D @bopstack/config
pnpm exec bopstack-config init
```

The CLI installs or wires only selected packages. It should not require every possible package.

## Testing Strategy

- **Config repos**: parse config JSON/YAML/TS, validate expected keys, run a small fixture project when useful
- **`@bopstack/oxc`**: preserve existing vitest tests
- **`@bopstack/config` CLI**: vitest tests for init logic, file copy/symlink behavior, dotfile rename behavior, package selection
- **`@bopstack/custom-lint`**: unit/fixture tests per script
- **Integration smoke test**: one fixture project installs the common package set and runs typecheck/lint/format validation

## Migration Notes

No migration actions should happen during brainstorm/spec work. Later implementation can decide exact sequence.

Potential future sequence:

1. Keep existing `~/Projects/bopstack/config/` repo as `@bopstack/config` CLI repo
2. Remove or replace its `.git` only after explicit approval and backup/remote check
3. Keep existing `~/Projects/bopstack/oxc/` repo as the `@bopstack/oxc` repo
4. Create new sibling repos under `~/Projects/bopstack/` for each package
5. Start with core repos only: `tsconfig`, `oxfmt`, `oxlint`, `git-hook`, `just`, `custom-lint`, `config`
6. Delay `tsdown`, `commitlint`, `markdownlint`, `spellcheck` if no immediate consumer exists

## Implementation Checklist

- [ ] Confirm final mini-repo list and which repos are MVP vs later
- [ ] Keep `~/Projects/bopstack/config/` as the `@bopstack/config` CLI repo
- [ ] Keep `~/Projects/bopstack/oxc/` as the `@bopstack/oxc` plugin repo
- [ ] Create `~/Projects/bopstack/tsconfig/` — `@bopstack/tsconfig`
- [ ] Create `~/Projects/bopstack/oxlint/` — `@bopstack/oxlint`
- [ ] Create `~/Projects/bopstack/oxfmt/` — `@bopstack/oxfmt`
- [ ] Create `~/Projects/bopstack/just/` — `@bopstack/just`
- [ ] Create `~/Projects/bopstack/git-hook/` — `@bopstack/git-hook`
- [ ] Create `~/Projects/bopstack/custom-lint/` — `@bopstack/custom-lint`
- [ ] Decide whether `commitlint`, `markdownlint`, `spellcheck`, and `tsdown` are MVP or future repos
- [ ] Add smoke tests for each config repo
- [ ] Add CLI tests for `@bopstack/config`
- [ ] Document manual install path for users who do not want the CLI
- [ ] Document package compatibility matrix in `@bopstack/config`
- [ ] Publish MVP repos to npm

## Open Questions

- **MVP repo set**: Should MVP include only `tsconfig`, `oxfmt`, `oxlint`, `oxc`, `just`, `git-hook`, `custom-lint`, and `config`?
- **Current `config/.git`**: Should it be removed/reinitialized later, or should the existing repo history remain the `@bopstack/config` CLI history?
- **Package registry**: npm or GitHub Packages? npm for now unless privacy is needed.
- **Version coordination**: Should `@bopstack/config` pin exact versions or use ranges for companion packages?
- **oxc plugin loading**: Verify oxlint loads JS plugins from `node_modules/@bopstack/oxc/dist/` with the separated repo/package layout.
- **custom-lint scripts location**: Should scripts be executable files in `@bopstack/custom-lint`, justfile recipes in `@bopstack/just`, or both?
- **tsdown**: Include now as planned config, or delay until a repo actually uses tsdown?
- **markdownlint/spellcheck**: Include now because they are config/linting, or delay to avoid premature package sprawl?

## Out of Scope

- Monorepo workspace setup
- Moving AI/Pi extension packages
- Moving apps or runtime libraries
- Removing `.git` or restructuring directories during brainstorm
- Update/diff mechanism for installed configs
- Interactive project kind selection in CLI beyond MVP default
- Config partial overrides
- CI propagation across repos
- Postinstall automation in target projects
