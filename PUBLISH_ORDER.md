# Publish Order for @bopstack/\* Packages

Packages must be published to npm in dependency order. Each package depends only on
standard npm packages (no internal deps) except where noted.

## Wave 1 — Foundations (no internal deps, any order)

1. `@bopstack/tsconfig`
2. `@bopstack/oxfmt`
3. `@bopstack/commitlint`
4. `@bopstack/tsdown`
5. `@bopstack/markdownlint`
6. `@bopstack/spellcheck`

## Wave 2 — Plugin + scripts (no internal deps)

7. `@bopstack/oxlint` — peer-refs `@bopstack/oxc` (documented, not runtime dep)
8. `@bopstack/custom-lint`
9. `@bopstack/oxc` — rename from `@bopstack/lint`

## Wave 3 — Recipes + hooks (depend on Wave 2 packages for recipe commands)

10. `@bopstack/just` — recipes call `@bopstack/custom-lint` scripts
11. `@bopstack/git-hook` — hooks call `@bopstack/commitlint` and `@bopstack/custom-lint`

## Wave 4 — Meta CLI (depends on everything published)

12. `@bopstack/config` — meta-installer CLI for the package set

## Notes

- All packages start at version `0.1.0`.
- The old `@bopstack/lint` npm package must be deprecated (not unpublished) after
  `@bopstack/oxc` is published under its new name.
- Semver discipline: breaking changes to config files (e.g. removing a rule, changing
  a default) warrant a minor bump for the affected package.
- This order was derived from `.unipi/docs/plans/2026-05-29-bopstack-config-mini-repos-plan.md`.
