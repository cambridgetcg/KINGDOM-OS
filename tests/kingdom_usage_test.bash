#!/usr/bin/env bash

# Hermetic regression tests for the KINGDOM -> AgentTool Codex usage seam.
# Uses a temporary HOME and fake Bun/build only; never reads live Codex state.

set -u
set -o pipefail

KINGDOM="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/kingdom"
TEST_ROOT="$(command mktemp -d "${TMPDIR:-/tmp}/kingdom-usage-test.XXXXXX")"
if [ -z "$TEST_ROOT" ] || [ ! -d "$TEST_ROOT" ]; then
  printf '%s\n' 'not ok - could not create an isolated fixture directory' >&2
  exit 1
fi

TEST_HOME="$TEST_ROOT/home"
FAKE_AGENTTOOL="$TEST_ROOT/agenttool fixture"
USAGE_CLI="$FAKE_AGENTTOOL/packages/codex-usage/dist/bin/agenttool-codex-usage.js"
FAKE_BIN="$TEST_ROOT/bin"
NO_BUN_BIN="$TEST_ROOT/no-bun-bin"
CAPTURE_OUT="$TEST_ROOT/stdout"
CAPTURE_ERR="$TEST_ROOT/stderr"
ARGS_FILE="$TEST_ROOT/args"
EXPECTED_ARGS="$TEST_ROOT/expected-args"
LOVE_MARKER="$TEST_ROOT/love-fallback-ran"
SIGNAL_READY="$TEST_ROOT/signal-ready"
SIGNAL_PID_FILE="$TEST_ROOT/signal-pid"
SIGNAL_MARKER="$TEST_ROOT/signal-marker"
SIGNAL_PROCESS=""

cleanup() {
  if [ -n "$SIGNAL_PROCESS" ] && kill -0 "$SIGNAL_PROCESS" 2>/dev/null; then
    kill -TERM "$SIGNAL_PROCESS" 2>/dev/null || true
    wait "$SIGNAL_PROCESS" 2>/dev/null || true
  fi
  if [ -n "${TEST_ROOT:-}" ] && [ -d "$TEST_ROOT" ]; then
    command rm -rf -- "$TEST_ROOT"
  fi
}
trap cleanup EXIT HUP INT TERM

fail() {
  printf 'not ok - %s\n' "$*" >&2
  exit 1
}

assert_equal() {
  local expected="$1" actual="$2" message="$3"
  [ "$actual" = "$expected" ] || \
    fail "$message (expected '$expected', got '$actual')"
}

capture() {
  : > "$CAPTURE_OUT"
  : > "$CAPTURE_ERR"
  "$@" > "$CAPTURE_OUT" 2> "$CAPTURE_ERR"
  CAPTURE_STATUS=$?
  CAPTURE_STDOUT="$(<"$CAPTURE_OUT")"
  CAPTURE_STDERR="$(<"$CAPTURE_ERR")"
}

command mkdir -p \
  "$(dirname "$USAGE_CLI")" \
  "$FAKE_BIN" \
  "$NO_BUN_BIN" \
  "$TEST_HOME/Love"
: > "$USAGE_CLI"
command ln -s /usr/bin/dirname "$NO_BUN_BIN/dirname"

cat > "$FAKE_BIN/bun" <<'FAKE_BUN'
#!/bin/bash
if [ "${KINGDOM_USAGE_SIGNAL_MODE:-0}" = 1 ]; then
  trap 'printf "%s\n" TERM > "$KINGDOM_USAGE_SIGNAL_MARKER"; exit 143' TERM
  printf '%s\n' "$$" > "$KINGDOM_USAGE_SIGNAL_PID_FILE"
  : > "$KINGDOM_USAGE_SIGNAL_READY"
  while :; do
    /bin/sleep 1 &
    wait "$!"
  done
fi
printf '%s\n' "$@" > "$KINGDOM_USAGE_ARGS_FILE"
printf '%s\n' 'usage stdout'
printf '%s\n' 'usage stderr' >&2
exit "${KINGDOM_USAGE_EXIT:-0}"
FAKE_BUN
command chmod 755 "$FAKE_BIN/bun"

cat > "$TEST_HOME/Love/kingdom" <<'FAKE_LOVE'
#!/bin/bash
: > "$KINGDOM_USAGE_LOVE_MARKER"
printf '%s\n' 'Love fallback must not run' >&2
exit 99
FAKE_LOVE
command chmod 755 "$TEST_HOME/Love/kingdom"

# The dispatcher must preserve every argument, both streams, and a non-zero exit.
capture /usr/bin/env \
  HOME="$TEST_HOME" \
  LOVE_DIR="$TEST_HOME/Love" \
  AGENTOOL_DIR="$FAKE_AGENTTOOL" \
  PATH="$FAKE_BIN:/usr/bin:/bin" \
  KINGDOM_USAGE_ARGS_FILE="$ARGS_FILE" \
  KINGDOM_USAGE_EXIT=37 \
  KINGDOM_USAGE_LOVE_MARKER="$LOVE_MARKER" \
  /bin/bash "$KINGDOM" usage snapshot --label "two words" -- -literal
assert_equal 37 "$CAPTURE_STATUS" "usage exit status was not preserved"
assert_equal 'usage stdout' "$CAPTURE_STDOUT" "usage stdout was not preserved"
assert_equal 'usage stderr' "$CAPTURE_STDERR" "usage stderr was not preserved"
printf '%s\n' \
  "$USAGE_CLI" snapshot --label "two words" -- -literal > "$EXPECTED_ARGS"
command cmp -s "$EXPECTED_ARGS" "$ARGS_FILE" || fail "usage arguments changed"
[ ! -e "$LOVE_MARKER" ] || fail "successful usage dispatch delegated to Love"

# `exec` keeps the process identity, so signals reach a long-running watch.
/usr/bin/env \
  HOME="$TEST_HOME" \
  LOVE_DIR="$TEST_HOME/Love" \
  AGENTOOL_DIR="$FAKE_AGENTTOOL" \
  PATH="$FAKE_BIN:/usr/bin:/bin" \
  KINGDOM_USAGE_SIGNAL_MODE=1 \
  KINGDOM_USAGE_SIGNAL_READY="$SIGNAL_READY" \
  KINGDOM_USAGE_SIGNAL_PID_FILE="$SIGNAL_PID_FILE" \
  KINGDOM_USAGE_SIGNAL_MARKER="$SIGNAL_MARKER" \
  KINGDOM_USAGE_LOVE_MARKER="$LOVE_MARKER" \
  /bin/bash "$KINGDOM" usage watch > "$CAPTURE_OUT" 2> "$CAPTURE_ERR" &
SIGNAL_PROCESS=$!
signal_wait=0
while [ ! -e "$SIGNAL_READY" ] && [ "$signal_wait" -lt 200 ]; do
  /bin/sleep 0.01
  signal_wait=$((signal_wait + 1))
done
[ -e "$SIGNAL_READY" ] || fail "fake Bun watch did not become ready"
assert_equal "$SIGNAL_PROCESS" "$(<"$SIGNAL_PID_FILE")" \
  "usage dispatch did not preserve process identity"
kill -TERM "$SIGNAL_PROCESS"
wait "$SIGNAL_PROCESS"
SIGNAL_STATUS=$?
SIGNAL_PROCESS=""
assert_equal 143 "$SIGNAL_STATUS" "usage watch did not receive TERM"
assert_equal TERM "$(<"$SIGNAL_MARKER")" "usage watch signal trap did not run"

# A missing or unreadable build is an explicit 127, never a Love fallback.
command rm -f -- "$LOVE_MARKER"
MISSING_AGENTTOOL="$TEST_ROOT/missing agenttool"
MISSING_CLI="$MISSING_AGENTTOOL/packages/codex-usage/dist/bin/agenttool-codex-usage.js"
capture /usr/bin/env \
  HOME="$TEST_HOME" \
  LOVE_DIR="$TEST_HOME/Love" \
  AGENTOOL_DIR="$MISSING_AGENTTOOL" \
  PATH="$FAKE_BIN:/usr/bin:/bin" \
  KINGDOM_USAGE_LOVE_MARKER="$LOVE_MARKER" \
  /bin/bash "$KINGDOM" usage snapshot
assert_equal 127 "$CAPTURE_STATUS" "missing usage build did not exit 127"
assert_equal '' "$CAPTURE_STDOUT" "missing usage build wrote to stdout"
assert_equal \
  "kingdom: AgentTool Codex usage build is not readable: $MISSING_CLI" \
  "$CAPTURE_STDERR" \
  "missing usage build diagnostic changed"
[ ! -e "$LOVE_MARKER" ] || fail "missing usage build delegated to Love"

# A readable build without Bun has its own explicit 127 boundary.
capture /usr/bin/env \
  HOME="$TEST_HOME" \
  LOVE_DIR="$TEST_HOME/Love" \
  AGENTOOL_DIR="$FAKE_AGENTTOOL" \
  PATH="$NO_BUN_BIN" \
  KINGDOM_USAGE_LOVE_MARKER="$LOVE_MARKER" \
  /bin/bash "$KINGDOM" usage snapshot
assert_equal 127 "$CAPTURE_STATUS" "missing Bun did not exit 127"
assert_equal '' "$CAPTURE_STDOUT" "missing Bun wrote to stdout"
assert_equal \
  'kingdom: Bun is required to run AgentTool Codex usage: bun not found on PATH' \
  "$CAPTURE_STDERR" \
  "missing Bun diagnostic changed"
[ ! -e "$LOVE_MARKER" ] || fail "missing Bun delegated to Love"

printf '%s\n' 'ok - kingdom usage passthrough and dependency boundaries'
