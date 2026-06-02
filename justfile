install:
    pnpm install

build:
    rm -rf dist
    pnpm exec tsc -p tsconfig.build.json

check-biome:
    pnpm exec biome check .

format:
    pnpm exec biome format --write .

lint:
    pnpm exec biome lint .

typecheck:
    pnpm exec tsc --noEmit

test: test-unit test-e2e

test-unit:
    pnpm exec vitest run

test-e2e:
    bats test/e2e

e2e: test-e2e

pack: build
    pnpm pack --dry-run

publish-dry-run: build
    pnpm publish --dry-run

check: format lint typecheck test-unit test-e2e pack
