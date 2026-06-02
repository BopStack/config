---
title: "Single-Package Biome and TypeScript Config Migration"
type: brainstorm
date: 2026-06-02
---

# Single-Package Biome and TypeScript Config Migration

## Problem Statement

BopStack config should stop being a collection of independent config repositories/packages and become a single consumer-facing `@bopstack/config` package for the first supported domains: Biome and TypeScript. The current multi-package direction creates release overhead, version-sync risk, and a more complex install story. The current Oxc/Oxfmt/Oxlint path also splits formatting, linting, and custom rules across tools/packages when the desired direction is Biome with GritQL rules.

The immediate goal is not to migrate every config domain. It is to establish the new package shape and install flow for Biome and TypeScript only.

## Context

Current observed repo state:

- `@bopstack/config` is currently a meta-installer CLI.
- `README.md` says the CLI installs many `@bopstack/*` config packages, then copies files from each installed package.
- `VISION.md` explicitly says configs do not ship in this package and live in independent mini-repos.
- `src/lib/package_selection.ts` currently installs packages such as `@bopstack/tsconfig`, `@bopstack/oxfmt`, `@bopstack/oxlint`, `@bopstack/oxc`, `@bopstack/commitlint`, `@bopstack/markdownlint`, `@bopstack/spellcheck`, `@bopstack/just`, `@bopstack/custom-lint`, and `@bopstack/git-hook`.
- Current root tooling uses `oxfmtrc.json`, `oxlintrc.json`, `oxfmt`, and `oxlint`.
- `PUBLISH_ORDER.md` exists because the old direction required dependency-ordered publishing across many config packages.

External docs checked:

- Biome supports exporting shared configuration from npm packages through `package.json` exports. Example docs show `"exports": { "./biome": "./biome.json" }` and consumer `biome.json` extending `@org/shared-configs/biome`.
- Biome supports GritQL linter plugins through `"plugins": ["./path-to-plugin.grit"]`.
- Biome docs state paths in shared configs are interpreted from the extending config location, not from the extended file location.

Smoke validation performed after explicit user override:

- A temp consumer extended `@bopstack/config/biome` from `node_modules`.
- Exported Biome config with plugin path `./rules/no-console.grit` failed with `Cannot read file`.
- Exported Biome config with plugin path `@bopstack/config/biome/rules/no-console.grit` failed with `Cannot read file`.
- Exported Biome config with plugin path `./node_modules/@bopstack/config/src/config/biome/rules/no-console.grit` loaded the GritQL plugin and produced the expected custom diagnostic.

## Chosen Approach

Use a narrowed hybrid single-package design for Biome and TypeScript:

- `@bopstack/config` owns the CLI and the shared config assets.
- Config assets live under `src/config` in this package.
- `package.json` exports expose shared Biome and TypeScript config entrypoints.
- `bopstack-config init` ensures the target project has `@bopstack/config`, `@biomejs/biome`, and `typescript` as devDependencies.
- `bopstack-config init` writes a minimal consumer `biome.json` that extends `@bopstack/config/biome`.
- `bopstack-config init` writes a minimal consumer `tsconfig.json` that extends `@bopstack/config/tsconfig/base`.
- The exported Biome config includes GritQL plugins using explicit `./node_modules/@bopstack/config/...` plugin paths because smoke validation showed that this is the working path form for exported configs.

## Why This Approach

This design optimizes for a clean consumer install story while avoiding the old multi-repo release burden. Users get one BopStack package plus the actual tools it configures. Maintainers update Biome, GritQL rules, and TypeScript presets in one package and publish one artifact.

Rejected alternatives:

1. Keep multiple config packages.
   - Rejected because it preserves the release burden, publish-order complexity, and version drift that motivated the direction change.

2. Copy-first design for all config files.
   - Rejected for the initial design because it weakens package exports as the source of truth and makes consumer projects own more copied config than needed.

3. Export-first with package-subpath GritQL plugin paths.
   - Rejected because smoke validation showed package-subpath plugin paths did not load in Biome from an exported config.

4. Migrate all config domains now.
   - Rejected because the user narrowed scope to Biome and TypeScript. Commitlint, markdownlint, spellcheck, just recipes, git hooks, and custom lint scripts stay out of scope for this spec.

## Design

### Architecture

`@bopstack/config` becomes both installer and source package for the first-party shared configs in this scope.

```text
@bopstack/config
├─ src/
│  ├─ cli/                  CLI adapter and command routing
│  ├─ lib/                  init orchestration, package selection, file writing
│  └─ config/
│     ├─ biome/
│     │  ├─ biome.json       exported shared Biome config
│     │  └─ rules/
│     │     └─ *.grit        BopStack GritQL plugin rules
│     └─ tsconfig/
│        └─ base.json        exported TypeScript base config
└─ package.json
   └─ exports
      ├─ ./biome            -> ./src/config/biome/biome.json
      └─ ./tsconfig/base    -> ./src/config/tsconfig/base.json
```

Consumer projects should not install `@bopstack/tsconfig`, `@bopstack/oxfmt`, `@bopstack/oxlint`, or `@bopstack/oxc`. They install/use `@bopstack/config`, `@biomejs/biome`, and `typescript`.

### Components

#### Package exports

`package.json` should expose at least:

- `./biome` for the shared Biome config.
- `./tsconfig/base` for the shared TypeScript base config.

Exports are required so Biome and TypeScript can resolve configs through package specifiers instead of fragile file paths in consumer projects.

#### Biome shared config

`src/config/biome/biome.json` owns formatter/linter settings and GritQL plugin registration. It replaces the Oxfmt/Oxlint/Oxc config split for this scope.

The plugin paths should use the smoke-tested working form:

```text
./node_modules/@bopstack/config/src/config/biome/rules/<rule>.grit
```

This is intentionally explicit. Biome docs state shared config paths are interpreted from the extending config location, and the smoke test confirmed relative paths inside the package do not resolve from the package config directory.

#### GritQL rules

Custom rules move from Oxc custom rules to GritQL `.grit` files under `src/config/biome/rules`. Rules should register diagnostics through Biome's GritQL plugin API. Rule severity should be set in the plugin where needed, with error-level diagnostics used for project conventions that must block checks.

#### TypeScript shared config

`src/config/tsconfig/base.json` replaces the separate `@bopstack/tsconfig` package for this scope. Generated consumer `tsconfig.json` extends `@bopstack/config/tsconfig/base`.

#### Init command

`bopstack-config init` should stop installing the old config package set for the default kind. For this scoped migration it should ensure:

- `@bopstack/config`
- `@biomejs/biome`
- `typescript`

Then it should write:

- `biome.json`
- `tsconfig.json`

The generated files should be minimal shims that point to package exports.

### Data Flow

1. User runs `bopstack-config init` in or against a target project.
2. CLI validates the target directory exists.
3. CLI installs/ensures devDependencies: `@bopstack/config`, `@biomejs/biome`, `typescript`.
4. CLI writes target `biome.json` that extends `@bopstack/config/biome`.
5. CLI writes target `tsconfig.json` that extends `@bopstack/config/tsconfig/base`.
6. When the user runs `biome check`, Biome loads target `biome.json`, resolves `@bopstack/config/biome` through package exports, then loads GritQL plugin files through explicit `./node_modules/@bopstack/config/...` paths.
7. When the user runs `tsc --noEmit`, TypeScript resolves `@bopstack/config/tsconfig/base` through package exports.

### Error Handling

- Missing target directory should continue returning the existing `target_missing` domain error.
- Dependency install failure should continue returning the existing `install_failed` domain error.
- Missing package export, missing shared Biome config, missing shared TypeScript config, or missing GritQL rule file should surface as a clear validation/copy failure during implementation rather than a vague downstream tool error.
- Existing target `biome.json` or `tsconfig.json` should follow current overwrite behavior unless the implementation plan adds an explicit safeguard. If overwrite safety becomes a priority, it should be planned as a separate decision.
- Biome plugin load failures must be treated as hard failures in validation because they mean custom rules are not active.

### Testing

Planned coverage:

- Unit tests update package selection from many `@bopstack/*` config packages to `@bopstack/config`, `@biomejs/biome`, and `typescript`.
- Unit tests assert default config file generation now targets `biome.json` and `tsconfig.json`.
- Unit tests assert `package.json` exports include Biome and TypeScript entrypoints.
- E2E tests update the stub install assertions to expect the new dependency set and no old Oxc/Oxfmt/Oxlint packages.
- E2E tests assert `bopstack-config init` writes `biome.json` extending `@bopstack/config/biome`.
- E2E tests assert `bopstack-config init` writes `tsconfig.json` extending `@bopstack/config/tsconfig/base`.
- Smoke test creates a temp consumer project, runs `biome check`, and proves a GritQL diagnostic fires through the exported Biome config.
- Smoke test creates a temp consumer project, runs `tsc --noEmit`, and proves TypeScript can resolve the exported base config.

## Implementation Checklist

- [x] Add `src/config/biome/biome.json` and initial `src/config/biome/rules/*.grit` files that replace the current Oxc custom-rule direction. — covered by Task 2
- [x] Add `src/config/tsconfig/base.json` as the new TypeScript base config source. — covered by Task 2
- [x] Update `package.json` dependencies/devDependencies to use Biome and TypeScript instead of Oxfmt/Oxlint/Oxc tooling. — covered by Task 2
- [x] Add `package.json` exports for `./biome` and `./tsconfig/base`. — covered by Task 2
- [x] Refactor package selection so default init installs `@bopstack/config`, `@biomejs/biome`, and `typescript` only. — covered by Task 3
- [x] Refactor init file generation so target projects receive `biome.json` and `tsconfig.json` shims that extend the exported configs. — covered by Task 3
- [x] Update CLI output, README, VISION, and publish-order docs to describe the single-package Biome/TypeScript direction. — covered by Task 6
- [x] Update unit tests for package selection, generated config entries, and exports. — covered by Task 1
- [x] Update e2e tests for new dependency install assertions and generated `biome.json`/`tsconfig.json` files. — covered by Task 4
- [x] Add smoke validation for exported Biome config loading GritQL rules via `./node_modules/@bopstack/config/...` plugin paths. — covered by Task 5
- [x] Add smoke validation for TypeScript resolving `@bopstack/config/tsconfig/base` from a temp consumer project. — covered by Task 5

## Open Questions

- Should `bopstack-config init` preserve existing `biome.json` and `tsconfig.json` by default, or overwrite them as the current copy behavior does?
- Which exact Oxc custom rules are required for the first GritQL migration wave?
- Should generated `biome.json` include only `extends`, or also project-local overrides such as `vcs.useIgnoreFile`?
- Should generated `tsconfig.json` include only `extends`, or include project-local `include`/`exclude` defaults?
- Should Biome and TypeScript versions be pinned exactly, ranged, or left to package-manager resolution during init?

## Out of Scope

- Migrating commitlint config.
- Migrating markdownlint config.
- Migrating cspell/spellcheck config.
- Migrating just recipes.
- Migrating lefthook/git-hook config.
- Rebuilding custom lint scripts outside Biome/GritQL.
- Publishing or deprecating old packages.
- Implementing update/diff/drift detection.
- Running a full production migration of existing consumer projects.
