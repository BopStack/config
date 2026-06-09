# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Features
- add custom-lint scripts as bopstack-config lint subcommand

### Bug Fixes
- configure biome to prefer type, add trailing newline to shims, enable tailwindDirectives

## [0.1.0] - 2026-06-04

### Features
- add VISION.md and pnpx usage note to AGENTS.md
- implement bopstack-config init CLI
- implement bopstack-config init CLI
- refactor package/config metadata and shim generation
- add shared biome and tsconfig config assets
- implement biome-native parity and custom grit rules (tasks 2-4)
- complete parity gate and fix pack recipe (task 7)
- **biome:** tighten rules to error-only for agent-heavy dev
- add consumer smoke test for @bopstack/config/biome (task 5)

### Bug Fixes
- **biome:** configure useConsistentTestIt to enforce 'test' (riteway)

### Refactors
- split cli adapters from reusable config logic
- return typed init errors from core logic

### Tests
- cover init parser and package metadata
- add bats e2e harness for config cli
- cover bopstack-config cli with bats
- cover config copy and summary logic
- lock single-package config contracts
- update e2e fixtures for single-package config

### Documentation
- add publish order note, update README with package list
- add vitest and bats test design
- design single-package biome tsconfig config
- update readme, vision, and remove stale publish-order
- add biome grit parity design
- mark all plan tasks complete (plan finished)
- update README with parity matrix, custom grit rules, and known gaps (task 6)

### Style
- biome format/lint auto-fixes across src/
- biome format fixes on grit rule files

### Build
- add project root biome.json, fix lint issues
- exclude dist/ from biome lint/format/check

### Chores
- initial commit — project config, AGENTS.md, USER.md, .gitignore
- README and PUBLISH_ORDER updates
- add LICENSE, prepare package.json, commit all work-in-progress
- wire unit and e2e test scripts
- migrate scripts from package.json to justfile
- prepare package publishing
- add pnpm-lock.yaml

## [0.1.1] - 2026-06-04

### Chores
- bump 0.1.0 → 0.1.1

[Unreleased]: https://github.com/BopStack/config/compare/v0.1.1...HEAD
[0.1.0]: https://github.com/BopStack/config/releases/tag/v0.1.0
[0.1.1]: https://github.com/BopStack/config/compare/v0.1.0...v0.1.1
