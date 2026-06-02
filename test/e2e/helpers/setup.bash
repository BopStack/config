# Bats helper: test setup and teardown for bopstack-config e2e tests.
#
# Provides:
#   - Isolated temp project directories per test
#   - Stub `pnpm` binary in PATH that records args
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
# Stub pnpm — records args and creates minimal fixture.

ARGS_FILE="$BATS_TEST_TMPDIR/pnpm-args.txt"
echo "\$@" > "\$ARGS_FILE"

if [ "\${BOPSTACK_STUB_PNPM_FAIL:-0}" = "1" ]; then
  echo "stub pnpm failure" >&2
  exit 42
fi
STUB
  chmod +x "$STUB_BIN/pnpm"

  # Prepend stub bin to PATH
  PATH="$STUB_BIN:$PATH"

  # CLI invocation with tsx (use explicit loader path for reliable CWD-agnostic resolution).
  BOPSTACK_CONFIG_CLI="node --import $REPO_ROOT/node_modules/tsx/dist/loader.mjs $REPO_ROOT/src/index.ts"
}

common_teardown() {
  # BATS_TEST_TMPDIR is automatically cleaned by bats
  :
}
