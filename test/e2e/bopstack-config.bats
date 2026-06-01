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

@test "harness smoke: --help prints usage" {
  cd "$REPO_ROOT"
  run $BOPSTACK_CONFIG_CLI --help
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "Usage: bopstack-config"
}
