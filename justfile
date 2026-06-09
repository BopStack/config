install:
    pnpm install

build:
    rm -rf dist
    pnpm exec tsc -p tsconfig.build.json

check-biome:
    pnpm exec biome check src/ biome.json vitest.config.ts

format:
    pnpm exec biome format --write src/ biome.json vitest.config.ts

lint:
    pnpm exec biome lint src/ biome.json vitest.config.ts

# Regenerate CHANGELOG.md from git tags and commit history.
changelog:
    bun scripts/changelog.ts

# Create a new release: bumps package.json, tags, re-generates changelog, commits.
# Usage: just release 0.2.0
release version:
    @echo "=== Releasing {{ version }} ==="
    # Ensure working tree is clean
    @test -z "$(git status --porcelain)" || { echo "ERROR: working tree not clean" >&2; exit 1; }
    # Update package.json version
    pnpm pkg set version={{ version }}
    # Stage and commit the version bump
    git add package.json
    git commit -m "chore: release v{{ version }}"
    # Create the tag
    git tag -a v{{ version }} -m "v{{ version }}"
    # Regenerate changelog (new tag is detected, populates that version's section)
    bun scripts/changelog.ts
    # Commit the changelog and move the tag to include it
    git add CHANGELOG.md
    git commit --amend --no-edit 2>&1 | tail -1
    git tag -f v{{ version }} > /dev/null 2>&1
    @echo "=== v{{ version }} released (tag moved to include CHANGELOG.md) ===

typecheck:
    pnpm exec tsc --noEmit

test: test-unit test-e2e

test-unit:
    pnpm exec vitest run

test-e2e:
    bats test/e2e

e2e: test-e2e

pack: build
    pnpm pack --pack-destination /tmp/bopstack-pack-test --json 2>&1 && echo 'pack ok' && rm -rf /tmp/bopstack-pack-test

publish-dry-run: build
    pnpm publish --dry-run

check: format lint typecheck test-unit test-e2e pack
