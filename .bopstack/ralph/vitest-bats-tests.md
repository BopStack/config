# Vitest Unit Tests and Bats CLI E2E Tests

Implement plan `.unipi/docs/plans/2026-06-01-vitest-bats-test-plan.md` on main.

Goals:
- Refactor CLI into `src/index.ts`, `src/cli`, `src/lib`.
- Typed expected init errors.
- Vitest unit tests.
- Bats e2e tests w/stub pnpm.
- Scripts/docs.
- Commit per unit of work.

Checklist:
- [x] Task 1 restructure CLI/lib (`117c0da`)
- [x] Task 2 typed errors (`32b04e4`)
- [x] Task 3 parser/package tests (`2df8235`)
- [x] Task 4 copy/core tests (`f92d80e`)
- [x] Task 5 Bats harness (`4713a63`)
- [x] Task 6 Bats behavior tests (`cbff818`)
- [x] Task 7 scripts/docs + migrate to justfile (`7d19d53`, `ad4c505`)
- [x] Task 8 final verify — `just check` ✅ 38 vitest + 15 bats