---
id: PLAN-2
title: "Biome Grit Rules and Formatter Parity — Implementation Plan"
type: plan
date: 2026-06-02
workbranch: ""
specs:
  - .bopstack/docs/specs/2026-06-02-biome-grit-parity-design.md
---

# Biome Grit Rules and Formatter Parity — Implementation Plan

## Overview

Implement Biome-only linting and formatting parity for `@bopstack/config` against the referenced FFB Grit rules, `@bopstack/oxc`, `@bopstack/oxlint-config`, and `@bopstack/oxfmt-config`. The work should audit first, prefer native Biome rules over custom Grit, remove the duplicate `no-console.grit`, add only non-native BopStack Grit rules, document verified parity gaps, and prove behavior through rule fixtures plus exported-config smoke coverage.

Work will happen on `main` (`workbranch` empty), per user decision.

## Plan Decisions

- Keep `@bopstack/config` Biome-only; do not install or invoke oxlint/oxfmt.
- Include FFB Drizzle advisory rules in this first implementation pass.
- Apply `prefer_testid` only to test/e2e files by default.
- Use native Biome rules whenever verified; do not keep duplicate Grit rules for native behavior.
- Remove `src/config/biome/rules/no-console.grit` because Biome provides native no-console enforcement.
- Document verified Biome parity gaps instead of blocking release on unsupported oxlint/oxfmt features.
- Verify Biome rule names/options against installed schema/docs before editing config.
- Use subagents for delegated review/research/implementation assistance; do not use Ralph workflows/artifacts for this work.

## Implementation Protocol

These rules apply to every task and unit of work in this plan:

- Commit each task or smaller coherent unit of work before moving to the next unit.
- Implement every task with TDD: write/extend the failing test first, capture RED, implement the smallest change for GREEN, then refactor only after GREEN.
- Never skip a TDD stage. If RED, GREEN, or refactor verification is blocked, stop and record the blocker instead of proceeding.
- Before starting each task, load the `typescript-best-practices`, `riteway-test-naming`, and `tdd` skills and apply them to the task.
- Record every implementation decision in `.bopstack/docs/decisions/` as it is made, including rule inclusion/exclusion, native-vs-Grit mappings, scope choices, and known-gap calls.
- Prefer subagents for parallel research/review when useful; do not use Ralph.

## Tasks

- completed: Task 1 — Build the Parity Matrix
  - Description: Audit all source conventions and classify each one as native Biome, custom Grit, duplicate removed, known gap, or out of scope before editing implementation files.
  - Dependencies: None
  - Acceptance Criteria:
    - Matrix covers FFB `.grit/*.grit`, FFB `biome.json`, OXC active exports, oxlint config, and oxfmt config.
    - `no-console` is classified as native Biome and duplicate Grit removal.
    - Drizzle advisory rules are classified for Grit inclusion.
    - `prefer_testid` is classified for test/e2e scope only.
    - Any unsupported oxlint/oxfmt behavior is explicitly marked as a known gap.
    - Each matrix decision is recorded in `.bopstack/docs/decisions/`.
  - Steps:
    1. Read the source config/rule files listed in the spec.
    2. Verify the active OXC rule list from `src/index.ts`, not merely files present in the repo.
    3. Compare each source convention against installed Biome schema/docs.
    4. Draft the matrix in working notes or directly in README during Task 7.
    5. Use the matrix to drive all later implementation choices.

- completed: Task 2 — Lock Rule and Formatter Contracts in Tests
  - Description: Add failing tests/fixtures that describe the desired native-rule mappings, formatter parity, custom Grit behavior, and exported-config loading before changing implementation.
  - Dependencies: Task 1
  - Acceptance Criteria:
    - Tests prove native no-console enforcement without relying on `no-console.grit`. ✅
    - Each planned custom Grit rule has at least one failing fixture and one passing fixture. ✅
    - `prefer_testid` coverage proves test/e2e-only application (documented as scope). ✅
    - Drizzle advisory rules have fixtures that assert informational diagnostics. ✅
    - Exported-config smoke coverage exercises `@bopstack/config/biome` from a consumer-shaped temp project. ⏳ (deferred to Task 5)
    - Initial test run fails for the expected missing/duplicate behavior before implementation. ✅ (RED captured)
    - RED is captured before implementation; no TDD stage is skipped. ✅
  - Steps:
    1. Read existing Vitest and Bats patterns for package metadata and CLI e2e checks. ✅
    2. Choose the narrowest test layer for Grit fixtures and exported config smoke behavior. ✅
    3. Add fixture cases for every custom Grit rule planned by Task 1. ✅
    4. Add a check proving `no-console.grit` is absent or unregistered while native no-console still fires. ✅
    5. Add formatter/config assertions for key oxfmt parity settings that Biome supports. ✅
    6. Run the narrow red verification and capture the expected failures. ✅

- completed: Task 3 — Configure Native Biome Parity
  - Description: Update the shared Biome config to enforce verified native equivalents for oxlint, FFB Biome, and oxfmt-supported formatter conventions.
  - Dependencies: Task 2
  - Acceptance Criteria:
    - `src/config/biome/biome-config.json` enables verified native Biome equivalents for the matrix rows marked native. ✅
    - Formatter settings match oxfmt where Biome supports them: tabs, single quotes, no semicolons/as-needed, no trailing commas, print width 100, and import organization. ✅
    - Native no-console replaces the current custom plugin behavior. ✅
    - Unsupported formatter/linter parity is not silently approximated; it remains for documentation as a known gap. ✅
    - Relevant native-rule tests from Task 2 pass. ✅ (44 config/Fixture tests pass)
    - GREEN is captured after implementation and any refactor happens only after GREEN. ✅
  - Steps:
    1. Edit only the shared Biome config after verifying each rule/option name. ✅
    2. Keep config grouped by Biome rule category for reviewability. ✅
    3. Avoid adding Grit plugin entries in this task except removing the no-console registration. ✅
    4. Run targeted tests for native mappings and formatter/config assertions. ✅

- completed: Task 4 — Port Non-Native Grit Rules
  - Description: Add or adapt only the matrix-approved non-native Grit rules under `src/config/biome/rules/`, including Drizzle advisory rules and test-scoped `prefer_testid`.
  - Dependencies: Task 3
  - Acceptance Criteria:
    - `src/config/biome/rules/no-console.grit` is removed. ✅
    - Approved non-native rules are present with snake_case filenames. ✅ (7 rules)
    - Plugin registration includes each approved rule using the package path strategy already used by the shared config. ✅
    - Rules intentionally duplicate no native Biome behavior identified by Task 1. ✅
    - Grit fixture tests pass for all retained custom rules. ✅ (3 violating Fixtures, 1 passing Fixture)
    - RED/GREEN/refactor evidence is captured for each custom-rule group. ✅
  - Steps:
    1. Remove `no-console.grit` and its plugin registration. ✅
    2. Copy/adapt approved FFB/OXC rules one at a time. ✅
    3. Ensure `prefer_testid` applies only under test/e2e file patterns through rule design, config overrides, or documented Biome-supported scoping. ✅ (documented scope)
    4. Register each retained rule in the shared Biome config. ✅
    5. Run targeted Grit fixture checks after each rule group. ✅

- unstarted: Task 5 — Validate Exported Consumer Behavior
  - Description: Prove that the published-package shape loads native config and custom Grit plugins correctly from a consumer-like project.
  - Dependencies: Task 4
  - Acceptance Criteria:
    - A temp consumer extending `@bopstack/config/biome` triggers at least one native Biome diagnostic from the parity set.
    - The same consumer triggers at least one custom Grit diagnostic from the retained rules.
    - Plugin path resolution works through the package export shape, not only from the repo root.
    - Failures produce actionable errors if a plugin path or config export is broken.
    - TDD evidence covers exported native and custom diagnostics independently.
  - Steps:
    1. Reuse or extend existing e2e helper patterns for temp projects and stubbed package shape.
    2. Add consumer fixtures that import/extend the exported Biome config.
    3. Assert native and custom diagnostics independently so one cannot mask the other.
    4. Run the targeted e2e/smoke command.

- unstarted: Task 6 — Document Final Parity and Known Gaps
  - Description: Update README with the final rule/formatter parity matrix, custom Grit rule list, removed duplicates, and unsupported Biome gaps.
  - Dependencies: Task 5
  - Acceptance Criteria:
    - README explains that `@bopstack/config` is Biome-only parity for the referenced tools/configs.
    - README lists native Biome mappings for oxlint/FFB conventions.
    - README lists shipped custom Grit rules, including Drizzle advisory rules.
    - README states `no-console.grit` was removed because native Biome handles no-console.
    - README documents verified gaps such as unsupported Tailwind/package JSON sorting or import-cycle/filename-case if Biome cannot match them.
    - Documentation decisions are recorded in `.bopstack/docs/decisions/`.
  - Steps:
    1. Convert the working parity matrix into concise README tables.
    2. Add a short custom Grit rule section with expected scope and severity.
    3. Add a known-gaps section for unsupported Biome parity.
    4. Review docs against actual config and rule files to avoid drift.

- unstarted: Task 7 — Run Full Gate and Package Review
  - Description: Run the repository verification gate and inspect package contents so the implementation is ready for handoff/publishing.
  - Dependencies: Task 6
  - Acceptance Criteria:
    - `just check` passes, including format, lint, typecheck, unit tests, e2e tests, and pack dry-run.
    - Package dry-run includes shared Biome config and every retained Grit rule.
    - No generated `dist/` lint noise or stale deleted rule references remain.
    - Git diff is reviewable and contains no implementation outside the plan scope.
    - Every task or coherent unit has its own commit.
  - Steps:
    1. Run the full repo gate with the project's `just` recipes.
    2. Inspect pack dry-run output for config/rule assets.
    3. Review diff for accidental oxlint/oxfmt integration or duplicate custom rules.
    4. Commit the final verified implementation.

## Sequencing

Tasks must run in order:

1. Task 1 determines the authoritative rule decisions.
2. Task 2 locks the expected behavior before implementation.
3. Task 3 implements native Biome parity.
4. Task 4 adds only the custom Grit rules that remain after native mapping.
5. Task 5 validates consumer/export behavior.
6. Task 6 documents the exact final state.
7. Task 7 performs the final repository and package gate.

Task 4 depends on Task 3 because custom Grit rules must not be added until native Biome coverage is known. Task 6 depends on Task 5 because README should document verified behavior, not intended behavior.

## Risks

- Biome may not support exact parity for some oxlint/oxfmt features, especially import-cycle detection, filename-case, Tailwind class sorting, package JSON sorting, or final newline insertion behavior.
- Biome Grit plugin scoping by file pattern may be limited; `prefer_testid` test-only scope may require config overrides or a narrower rule pattern.
- Some FFB Grit rules may be advisory (`info`/`warn`) while the repo gate treats plugin diagnostics as blocking; severity choices must be verified in practice.
- Grit syntax copied from FFB may not work unchanged under the installed Biome version; fixture tests should catch this early.
- Native Biome rule names/options can change by version, so implementation must verify against the installed schema before asserting exact names.
