# @bopstack/config

CLI for installing @bopstack/\* config packages into target projects.

## Install

```bash
pnpm add -D @bopstack/config
```

## Usage

```bash
pnpm exec bopstack-config init
```

Or specify a target directory:

```bash
pnpm exec bopstack-config init --target /path/to/project
```

### What It Does

1. Installs the recommended `@bopstack/*` packages as devDependencies
2. Copies config files into the project root (renaming dotfiles as needed)
3. Reports what was changed and what commands to run next

### Package Set (default kind)

| Package                | Description               |
| ---------------------- | ------------------------- |
| @bopstack/tsconfig     | TypeScript base config    |
| @bopstack/oxfmt        | oxfmt formatter config    |
| @bopstack/oxlint       | oxlint linter config      |
| @bopstack/oxc          | custom oxlint JS plugin   |
| @bopstack/just         | justfile recipe templates |
| @bopstack/git-hook     | lefthook git hooks        |
| @bopstack/custom-lint  | custom check scripts      |
| @bopstack/commitlint   | commitlint config         |
| @bopstack/markdownlint | markdownlint config       |
| @bopstack/spellcheck   | cspell config             |
| @bopstack/tsdown       | tsdown bundler config     |
