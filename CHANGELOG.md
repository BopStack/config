# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2026-06-12

### Fixed

- **biome:** Set `correctness/useImportExtensions` to `off` in shared biome config to suppress recommended `warn` level for downstream consumers
- **biome:** Add `just sync-biome` to copy shared biome config into root `biome.json` with local plugin paths
- **biome:** Fix local Biome diagnostics for test naming and import ordering

### Chores

- Release v0.2.2
## [0.2.1] - 2026-06-09

### Fixed

- Missing quote in release recipe echo line
- Publish biome-config.json with useConsistentTypeDefinitions style:type and tailwindDirectives
## [0.2.0] - 2026-06-09

### Added

- Add custom-lint scripts as bopstack-config lint subcommand
- Add changelog generator, backwards tags v0.1.0/v0.1.1, and CHANGELOG.md
- Add git-cliff changelog generator with Keep a Changelog config

### Chores

- Release v0.2.0

### Fixed

- Configure biome to prefer type, add trailing newline to shims, enable tailwindDirectives
## [0.1.1] - 2026-06-04

### Chores

- Bump 0.1.0 → 0.1.1
## [0.1.0] - 2026-06-04

### Added

- Add VISION.md and pnpx usage note to AGENTS.md
- Implement bopstack-config init CLI
- Implement bopstack-config init CLI
- Add shared biome and tsconfig config assets
- Refactor package/config metadata and shim generation
- Implement biome-native parity and custom grit rules (tasks 2-4)
- Add consumer smoke test for @bopstack/config/biome (task 5)
- Complete parity gate and fix pack recipe (task 7)
- **biome:** Tighten rules to error-only for agent-heavy dev

### Build

- Add project root biome.json, fix lint issues
- Exclude dist/ from biome lint/format/check

### Changed

- Split cli adapters from reusable config logic
- Return typed init errors from core logic

### Chores

- Initial commit — project config, AGENTS.md, USER.md, .gitignore
- README and PUBLISH_ORDER updates
- Wire unit and e2e test scripts
- Migrate scripts from package.json to justfile
- Add LICENSE, prepare package.json, commit all work-in-progress
- Prepare package publishing
- Add pnpm-lock.yaml

### Documentation

- Add publish order note, update README with package list
- Add vitest and bats test design
- Design single-package biome tsconfig config
- Update readme, vision, and remove stale publish-order
- Add biome grit parity design
- Update README with parity matrix, custom grit rules, and known gaps (task 6)
- Mark all plan tasks complete (plan finished)

### Fixed

- **biome:** Configure useConsistentTestIt to enforce 'test' (riteway)

### Style

- Biome format/lint auto-fixes across src/
- Biome format fixes on grit rule files

### Tests

- Cover init parser and package metadata
- Cover config copy and summary logic
- Add bats e2e harness for config cli
- Cover bopstack-config cli with bats
- Lock single-package config contracts
- Update e2e fixtures for single-package config

[0.2.2]: https://github.com/BopStack/config/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/BopStack/config/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/BopStack/config/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/BopStack/config/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/BopStack/config/releases/tag/v0.1.0
