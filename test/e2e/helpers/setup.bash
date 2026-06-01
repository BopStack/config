# Bats helper: test setup and teardown for bopstack-config e2e tests.
#
# Provides:
#   - Isolated temp project directories per test
#   - Stub `pnpm` binary in PATH that records args and creates fixture files
#   - BOPSTACK_CONFIG_CLI variable for invoking the TypeScript CLI
#
# Usage in .bats files:
#   setup()   { load helpers/setup.bash; common_setup; }
#   teardown() { common_teardown; }

REPO_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/../.." && pwd)"

common_setup() {
  # Create temp project dir and stub bin dir
  PROJECT_DIR="$BATS_TEST_TMPDIR/project"
  STUB_BIN="$BATS_TEST_TMPDIR/bin"
  mkdir -p "$PROJECT_DIR" "$STUB_BIN"

  # Create stub pnpm.
  # Expand BATS_TEST_TMPDIR now but keep runtime vars ($@, $1...) literal.
  cat > "$STUB_BIN/pnpm" <<STUB
#!/usr/bin/env bash
# Stub pnpm — records args and creates fixture files.

ARGS_FILE="$BATS_TEST_TMPDIR/pnpm-args.txt"
echo "\$@" > "\$ARGS_FILE"

if [ "\${BOPSTACK_STUB_PNPM_FAIL:-0}" = "1" ]; then
  echo "stub pnpm failure" >&2
  exit 42
fi

# Parse packages from "add -D <pkgs...>"
if [ "\${1:-}" = "add" ] && [ "\${2:-}" = "-D" ]; then
  shift 2
  for pkg in "\$@"; do
    case "\$pkg" in
      @bopstack/tsconfig)
        mkdir -p "node_modules/@bopstack/tsconfig"
        echo '{"compilerOptions":{"strict":true}}' > "node_modules/@bopstack/tsconfig/tsconfig.base.json"
        ;;
      @bopstack/oxfmt)
        mkdir -p "node_modules/@bopstack/oxfmt"
        echo '{"indent":2}' > "node_modules/@bopstack/oxfmt/oxfmtrc.json"
        ;;
      @bopstack/oxlint)
        mkdir -p "node_modules/@bopstack/oxlint"
        echo '{"rules":{"noDebugger":"error"}}' > "node_modules/@bopstack/oxlint/oxlintrc.json"
        ;;
      @bopstack/commitlint)
        mkdir -p "node_modules/@bopstack/commitlint"
        echo 'export default {};' > "node_modules/@bopstack/commitlint/commitlintrc.ts"
        ;;
      @bopstack/just)
        mkdir -p "node_modules/@bopstack/just"
        echo 'check:' > "node_modules/@bopstack/just/justfile"
        ;;
      @bopstack/git-hook)
        mkdir -p "node_modules/@bopstack/git-hook"
        echo 'pre-commit:' > "node_modules/@bopstack/git-hook/lefthook.yml"
        ;;
      @bopstack/markdownlint)
        mkdir -p "node_modules/@bopstack/markdownlint"
        echo '{"MD013":false}' > "node_modules/@bopstack/markdownlint/markdownlint.json"
        ;;
      @bopstack/spellcheck)
        mkdir -p "node_modules/@bopstack/spellcheck"
        echo '{"words":[]}' > "node_modules/@bopstack/spellcheck/cspell.json"
        ;;
      @bopstack/custom-lint)
        mkdir -p "node_modules/@bopstack/custom-lint"
        ;;
      @bopstack/oxc)
        mkdir -p "node_modules/@bopstack/oxc"
        ;;
    esac
  done
fi
STUB
  chmod +x "$STUB_BIN/pnpm"

  # Prepend stub bin to PATH
  PATH="$STUB_BIN:$PATH"

  # CLI invocation command.
  # After Task 7 (pnpm add -D tsx): BOPSTACK_CONFIG_CLI="node --import tsx src/index.ts"
  # Fallback using npx for now:
  BOPSTACK_CONFIG_CLI="npx --package=tsx tsx $REPO_ROOT/src/index.ts"
}

common_teardown() {
  # BATS_TEST_TMPDIR is automatically cleaned by bats
  :
}
