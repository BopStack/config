# shellcheck shell=bats
# bats file_tags=e2e,cli

setup() {
  load helpers/setup.bash
  common_setup
  cd "$PROJECT_DIR"
}

teardown() {
  common_teardown
}

# --- Help / Usage ---

@test "help: --help prints usage and exits 0" {
  cd "$REPO_ROOT"
  run $BOPSTACK_CONFIG_CLI --help
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "Usage: bopstack-config <command>"
  echo "$output" | grep -q "init"
}

@test "help: -h prints usage and exits 0" {
  cd "$REPO_ROOT"
  run $BOPSTACK_CONFIG_CLI -h
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "Usage: bopstack-config"
}

@test "help: no arguments prints usage and exits 0" {
  cd "$REPO_ROOT"
  run $BOPSTACK_CONFIG_CLI
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "Usage: bopstack-config"
}

# --- Unknown command ---

@test "unknown command exits nonzero and prints error" {
  cd "$REPO_ROOT"
  run $BOPSTACK_CONFIG_CLI bogus
  [ "$status" -ne 0 ]
  echo "$output" | grep -q "Unknown command: bogus"
  echo "$output" | grep -q "Run \`bopstack-config --help\`"
}

# --- Missing target ---

@test "init with missing target exits nonzero" {
  cd "$REPO_ROOT"
  run $BOPSTACK_CONFIG_CLI init --target=/nonexistent/path/xyz123
  [ "$status" -ne 0 ]
  echo "$output" | grep -q "Target directory does not exist: /nonexistent/path/xyz123"
}

# --- Invalid kind ---

@test "init with invalid kind exits nonzero" {
  cd "$REPO_ROOT"
  run $BOPSTACK_CONFIG_CLI init --kind=bogus
  [ "$status" -ne 0 ]
  echo "$output" | grep -q "Invalid project kind: bogus"
}

# --- Unknown init argument ---

@test "init with unknown argument exits nonzero" {
  cd "$REPO_ROOT"
  run $BOPSTACK_CONFIG_CLI init --bogus
  [ "$status" -ne 0 ]
  echo "$output" | grep -q "Unknown argument: --bogus"
  echo "$output" | grep -q "Run \`bopstack-config --help\`"
}

# --- Dry-run ---

@test "init --dry-run prints preview and does not write files" {
  run $BOPSTACK_CONFIG_CLI init --target="$PROJECT_DIR" --dry-run
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "\[dry-run\] Would install packages"
  echo "$output" | grep -q "\[dry-run\] create"
  # Verify no config files were written
  [ ! -f "$PROJECT_DIR/.lefthook.yml" ]
  [ ! -f "$PROJECT_DIR/.markdownlint.json" ]
  [ ! -f "$PROJECT_DIR/.cspell.json" ]
  [ ! -f "$PROJECT_DIR/commitlint.config.ts" ]
}

# --- Successful full init ---

@test "init installs packages and copies config files" {
  run $BOPSTACK_CONFIG_CLI init --target="$PROJECT_DIR"
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "Packages installed successfully"

  # Stub pnpm should have been called with correct args
  ARGS_FILE="$BATS_TEST_TMPDIR/pnpm-args.txt"
  [ -f "$ARGS_FILE" ]
  ARGS=$(cat "$ARGS_FILE")
  echo "$ARGS" | grep -q "add -D"
  echo "$ARGS" | grep -q "@bopstack/tsconfig"
  echo "$ARGS" | grep -q "@bopstack/oxfmt"
  echo "$ARGS" | grep -q "@bopstack/git-hook"

  # Config files should exist with fixture content
  [ -f "$PROJECT_DIR/tsconfig.base.json" ]
  [ -f "$PROJECT_DIR/oxfmtrc.json" ]
  [ -f "$PROJECT_DIR/oxlintrc.json" ]
  [ -f "$PROJECT_DIR/justfile" ]
}

# --- Rename assertions ---

@test "init renames lefthook.yml to .lefthook.yml" {
  run $BOPSTACK_CONFIG_CLI init --target="$PROJECT_DIR"
  [ "$status" -eq 0 ]
  [ -f "$PROJECT_DIR/.lefthook.yml" ]
  [ ! -f "$PROJECT_DIR/lefthook.yml" ]
}

@test "init renames markdownlint.json to .markdownlint.json" {
  run $BOPSTACK_CONFIG_CLI init --target="$PROJECT_DIR"
  [ "$status" -eq 0 ]
  [ -f "$PROJECT_DIR/.markdownlint.json" ]
  [ ! -f "$PROJECT_DIR/markdownlint.json" ]
}

@test "init renames cspell.json to .cspell.json" {
  run $BOPSTACK_CONFIG_CLI init --target="$PROJECT_DIR"
  [ "$status" -eq 0 ]
  [ -f "$PROJECT_DIR/.cspell.json" ]
  [ ! -f "$PROJECT_DIR/cspell.json" ]
}

@test "init renames commitlintrc.ts to commitlint.config.ts" {
  run $BOPSTACK_CONFIG_CLI init --target="$PROJECT_DIR"
  [ "$status" -eq 0 ]
  [ -f "$PROJECT_DIR/commitlint.config.ts" ]
}

# --- Summary output ---

@test "init prints summary with package and file counts" {
  run $BOPSTACK_CONFIG_CLI init --target="$PROJECT_DIR"
  [ "$status" -eq 0 ]
  echo "$output" | grep -qF -- "--- Summary ---"
  echo "$output" | grep -q "Packages installed:"
  echo "$output" | grep -q "Config files written:"
}

# --- Install failure ---

@test "init with install failure exits nonzero, prints error, no copied files" {
  BOPSTACK_STUB_PNPM_FAIL=1 run $BOPSTACK_CONFIG_CLI init --target="$PROJECT_DIR"
  [ "$status" -ne 0 ]
  echo "$output" | grep -q "Package installation failed:"
  echo "$output" | grep -q "stub pnpm failure"
  # No config files should have been copied
  [ ! -f "$PROJECT_DIR/tsconfig.base.json" ]
  [ ! -f "$PROJECT_DIR/.lefthook.yml" ]
}
