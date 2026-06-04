---
id: SPEC-1
title: "Biome Grit Rules and Formatter Parity"
type: brainstorm
date: 2026-06-02
---

# Biome Grit Rules and Formatter Parity

## Problem Statement

`@bopstack/config` should stay a Biome-only shared config package, but it should enforce the same practical linting and formatting conventions currently spread across FFB's Grit rules, `@bopstack/oxc`, `@bopstack/oxlint-config`, and `@bopstack/oxfmt-config`.

The actual problem is parity without tool sprawl: consumers should get BopStack's current lint and format behavior through Biome plus GritQL plugins, not by installing oxlint, oxfmt, or custom oxlint plugin packages. Duplicated custom rules should be removed when Biome already has a native rule; custom Grit rules should exist only for conventions Biome cannot enforce natively.

## Context

Observed current state in this repo:

- `src/config/biome/biome-config.json` currently enables Biome formatting, recommended linting, import organization, and one custom Grit plugin path for `no-console.grit`.
- `src/config/biome/rules/no-console.grit` is the only current in-package Grit rule.
- The current Biome formatter settings already overlap with oxfmt: tabs, single quotes, no semicolons, no trailing commas, and line width 100.
- `@bopstack/config` is now publish-prepared as the package that ships `src/config/` assets.

Observed source inputs:

- `/Users/bruno/Projects/ffb/.grit/` contains Grit rules for Drizzle advisory checks, nesting depth, empty catch blocks, hardcoded colors, inline control-flow bodies, inline styles, `@ts-ignore`, test-id selector preference, strict equality, and test naming.
- `/Users/bruno/Projects/ffb/biome.json` shows a stricter Biome config with many native rules already configured, including naming conventions, no console, no debugger, no explicit any, optional chaining, max params, cognitive complexity, lines-per-function, lines-per-file, and several performance/security/style rules.
- `/Users/bruno/Projects/bopstack/oxc/src/index.ts` exports active custom oxlint plugin rules: naming convention, no inline styles, no hardcoded colors, test naming, no empty catch, and no ts-ignore.
- `/Users/bruno/Projects/bopstack/oxc/src/no_throw.ts` exists but is not exported from the plugin entrypoint observed in `src/index.ts`; it is not part of the active parity target unless it becomes exported later.
- `/Users/bruno/Projects/bopstack/oxlint/oxlintrc.json` configures oxlint native rules for curly bodies, strict equality, no eval, no debugger, no console, prefer const, optional chaining, no nested ternary, max params, snake_case filenames, no explicit any, unused variables, and import cycles.
- `/Users/bruno/Projects/bopstack/oxfmt/oxfmtrc.json` configures tabs, single quotes, no trailing commas, no semicolons, print width 100, sorted imports, Tailwind sorting, package JSON sorting, and no final newline insertion.

User decisions made during brainstorm:

- `@bopstack/config` should remain Biome-only.
- Target outcome is 100% linting and formatting parity with the mentioned tools/configs where Biome can support it.
- Native Biome rules should win over custom Grit duplicates.
- The existing custom `no-console.grit` should be removed because Biome already provides no-console behavior.
- The chosen implementation style is audit-first direct port: make a parity matrix, configure Biome native rules, port only missing conventions as Grit plugins, then test and document the result.

## Chosen Approach

Use an audit-first direct port.

Implementation should first build a parity matrix across the source configs/rules, then update the shared Biome config in one pass:

1. Map every oxlint, oxfmt, FFB Grit, and active OXC convention to either a native Biome setting, a BopStack Grit plugin, or an explicit known gap.
2. Configure native Biome rules wherever available.
3. Copy or rewrite only non-native FFB/OXC conventions as GritQL plugins under `src/config/biome/rules/`.
4. Remove `no-console.grit` and replace it with the native Biome no-console rule.
5. Add fixtures/tests that prove both native mappings and custom Grit plugins are active from the exported package config.
6. Update README with the parity matrix and known gaps.

## Why This Approach

This optimizes for parity and maintainability. Native Biome rules are easier to maintain, less fragile than custom AST patterns, and follow upstream behavior. Grit plugins remain useful for BopStack-specific conventions that Biome does not cover, especially UI/test conventions and project-specific advisory checks.

Rejected alternatives:

1. **Copy every FFB Grit rule directly.** Rejected because it would duplicate native Biome rules, including the known `no-console` duplicate, and would create unnecessary maintenance risk.
2. **Generated config layer.** Rejected because a manifest-to-config generator adds a build step and indirection before the rule set is stable enough to justify it.
3. **Multiple Biome profiles.** Rejected because the desired outcome is default parity, not a weaker base profile plus optional strict profile.
4. **Keep oxlint/oxfmt as companion tools.** Rejected because the target package is explicitly Biome-only.

## Design

### Architecture

`@bopstack/config` remains the source package for shared Biome config assets:

```text
src/config/biome/
├── biome-config.json        shared Biome config export
└── rules/
    ├── rule_name.grit
    └── ...
```

The shared Biome config should express the ruleset in this priority order:

1. Biome native formatter/linter/assist settings.
2. BopStack GritQL plugins only for non-native conventions.
3. Documentation of unsupported parity gaps, if any remain after audit.

### Parity Matrix

The implementation should create a working parity matrix before editing rules. The matrix does not need to live forever as a separate source file, but its final decisions must be reflected in README.

Required columns:

- Source convention.
- Source package/file.
- Desired severity.
- Biome native equivalent, if verified.
- Grit plugin filename, if custom enforcement is required.
- Status: native, Grit, removed duplicate, known gap, or out of scope.
- Notes about semantic differences.

Initial known decisions:

| Source convention | Decision |
| --- | --- |
| `no-console.grit` / oxlint `no-console` | Remove custom Grit duplicate; configure native Biome no-console. |
| OXC `naming-convention` | Prefer native Biome naming convention config if parity is sufficient. |
| OXC/FFB `no-inline-styles` | Port as Grit unless a native Biome equivalent is verified. |
| OXC/FFB `no-hardcoded-colors` | Port as Grit unless a native Biome equivalent is verified. |
| OXC/FFB `test-naming` | Port as Grit unless a native Biome equivalent is verified. |
| OXC/FFB `no-empty-catch` | Use native Biome if it can match the convention; otherwise port as Grit. |
| OXC/FFB `no-ts-ignore` | Use native Biome if it can match the convention; otherwise port as Grit. |
| FFB `prefer_testid` | Port as Grit if retained as a BopStack test convention. |
| FFB Drizzle advisory rules | Keep as Grit only if this package intentionally covers Drizzle advisory checks. |
| `oxfmt` Tailwind/package JSON sorting | Verify Biome support; document as known gap if unavailable. |
| oxlint `import/no-cycle` and filename case | Verify native Biome support or document as known gaps; do not invent weak Grit substitutes. |

### Biome Native Rule Configuration

Native Biome configuration should absorb as much of the oxlint and FFB Biome behavior as possible. The implementation must verify exact Biome rule names against the installed Biome schema or documentation before changing `biome-config.json`.

Likely native rule categories to audit:

- Correctness: unused variables/imports, dependency declarations, nested components where relevant.
- Style: const usage, templates, naming conventions, useless else, nested ternaries, inferrable types, collapsed if, non-null assertions.
- Suspicious: console, debugger, explicit any.
- Complexity: optional chaining, banned types, implicit coercions, cognitive complexity, lines per function, max params.
- Security: eval, dangerous HTML, secrets.
- Performance: accumulating spread, barrel files, await in loops.
- Nursery: excessive lines per file and any strict rules already present in FFB.

Because the implementation target is Biome-only parity, each oxlint native rule should either map to a verified Biome rule or be documented as a known gap. Unsupported parity must be explicit rather than silently dropped.

### GritQL Plugin Rules

Grit rules should be copied from FFB only after the native-rule audit. The implementation should preserve or improve rule messages and severities, but only for non-native conventions.

Expected custom-rule candidates after audit:

- `no_inline_styles.grit`
- `no_hardcoded_colors.grit`
- `test_naming.grit`
- `prefer_testid.grit`
- Drizzle advisory rules, if kept in scope
- Any OXC active rule that lacks sufficient Biome coverage

Rules should be named with snake_case filenames and registered in `src/config/biome/biome-config.json` through the existing package-relative plugin-path strategy used by the package.

### Formatter Alignment

The Biome formatter config should match `@bopstack/oxfmt-config` wherever Biome exposes equivalent options:

- Tabs enabled.
- Single quotes.
- Semicolons disabled/as-needed to match no semicolon output.
- Trailing commas disabled.
- Print width 100.
- Import organization enabled through Biome assist.

The implementation must verify whether Biome can match these oxfmt options:

- Tailwind CSS class sorting.
- Package JSON sorting.
- Final newline insertion disabled.

If Biome cannot express one of these settings, README should mark it as a known formatter parity gap rather than pretending parity is complete.

### Testing and Verification

Testing should prove the exported package behavior, not just local rule files.

Required verification layers:

1. **Rule fixtures** for each custom Grit rule retained. Each rule needs at least one failing fixture and one passing fixture.
2. **Native mapping checks** that demonstrate important migrated native rules are active, especially no-console replacing the deleted Grit rule.
3. **Exported-config smoke test** from a temp consumer shape so plugin paths are validated through `@bopstack/config/biome` as consumers use it.
4. **README parity review** ensuring every source convention is classified as native, Grit, duplicate removed, known gap, or out of scope.
5. **Existing package gate** through the repo's normal `just` commands during implementation, including e2e checks.

### Documentation

README should gain a compact parity section with:

- Formatter parity with oxfmt.
- Native Biome rule mappings from oxlint/FFB.
- Custom Grit rules shipped by `@bopstack/config`.
- Removed duplicates such as `no-console.grit`.
- Known gaps and why they are not enforced.

This documentation is part of the design because users need to understand that this package replaces behavior from multiple former tools while intentionally remaining Biome-only.

## Implementation Checklist

- [x] Build the parity matrix from FFB Grit rules, FFB Biome config, OXC active exports, oxlint config, and oxfmt config. — covered by PLAN-2 Task 1
- [x] Verify native Biome rule names and formatter options against the installed Biome schema/docs before editing config. — covered by PLAN-2 Task 1 and Task 3
- [x] Update `src/config/biome/biome-config.json` with verified native Biome lint and formatter parity settings. — covered by PLAN-2 Task 3
- [x] Remove `src/config/biome/rules/no-console.grit` and its plugin registration. — covered by PLAN-2 Task 4
- [x] Copy or adapt only non-native FFB/OXC conventions into `src/config/biome/rules/*.grit`. — covered by PLAN-2 Task 4
- [x] Add passing and failing fixtures/tests for every retained custom Grit rule. — covered by PLAN-2 Task 2 and Task 4
- [x] Add verification that native no-console behavior replaces the deleted custom Grit rule. — covered by PLAN-2 Task 2 and Task 3
- [x] Add exported-config smoke coverage proving custom Grit rules load through `@bopstack/config/biome`. — covered by PLAN-2 Task 5
- [x] Update README with the final parity matrix, custom rules, removed duplicates, and known gaps. — covered by PLAN-2 Task 6
- [x] Run the repo gate, including e2e, before implementation handoff. — covered by PLAN-2 Task 7

## Open Questions

- Should Drizzle advisory rules from FFB be included in this general config package, or should they wait for a Drizzle-specific decision?
- Should `prefer_testid` apply to every project by default, or only to test/e2e files?
- If Biome lacks parity for oxlint `import/no-cycle` or filename-case, should those be documented as known gaps or handled later by a different Biome-compatible mechanism?
- If Biome lacks Tailwind or package JSON sorting parity with oxfmt, is a documented gap acceptable for the first Biome-only release?

## Out of Scope

- Installing or invoking oxlint from `@bopstack/config`.
- Installing or invoking oxfmt from `@bopstack/config`.
- Publishing changes to `@bopstack/oxc`, `@bopstack/oxlint-config`, or `@bopstack/oxfmt-config`.
- Creating a generated config system or manifest compiler.
- Implementing code during this brainstorm workflow.
