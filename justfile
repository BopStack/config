install:
    pnpm install

build:
    pnpm exec tsc

format:
    pnpm exec oxfmt .

lint:
    pnpm exec oxlint .

typecheck:
    pnpm exec tsc --noEmit

test:
    pnpm exec vitest run

check: format lint typecheck test

e2e:
    @echo "No e2e tests for @bopstack/config"
