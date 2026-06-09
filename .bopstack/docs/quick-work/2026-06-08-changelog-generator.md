---
id: QUICK_WORK-2
title: "Add changelog generator and backwards tags"
type: quick-work
date: 2026-06-08
---

# Add changelog generator and backwards tags

## Task
Create a changelog generator + create backwards tags to generate and maintain a changelog.

## Changes
- **cliff.toml**: git-cliff configuration for Keep a Changelog format with proper group mapping (Added/Fixed/Changed/Documentation/etc.) and reference links footer
- **CHANGELOG.md**: Generated using git-cliff with Unreleased, v0.1.1, and v0.1.0 sections
- **justfile**: Added `changelog` (`git-cliff -o CHANGELOG.md`) and `release <ver>` (bump, tag, regenerate, commit) recipes
- **package.json**: Added `git-cliff` devDependency
- **Git tags v0.1.0, v0.1.1**: Established backwards tags on existing commits

## Verification
- Unit tests: 94 passed (11 files)
- `just changelog` regenerates CHANGELOG.md correctly
- Footer reference links verified: Unreleased, v0.1.1 (compare), v0.1.0 (release)

## Notes
- v0.1.0 tagged at 131b88c; v0.1.1 at 740716c
- git-cliff v2.13.1 — Rust binary via npm, 1 dep (execa), actively maintained
- Config: conventional commits parser, topo-ordered oldest-first, Keep a Changelog groups
