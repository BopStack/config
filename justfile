install:
    pnpm install

build:
    pnpm exec tsc

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

check: format lint typecheck test-unit test-e2e
