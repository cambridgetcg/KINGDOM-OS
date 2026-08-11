#!/usr/bin/env zsh

emulate -L zsh
setopt pipe_fail

typeset -r ROOT="${0:A:h:h}"
typeset -r TEST_ROOT_RAW="$(command mktemp -d "${TMPDIR:-/tmp}/kingdom-ask-test.XXXXXX")"
[[ -n "$TEST_ROOT_RAW" && -d "$TEST_ROOT_RAW" ]] || {
  print -u2 -r -- "not ok - could not create fixture directory"
  exit 1
}
typeset -r TEST_ROOT="$(builtin cd -q -- "$TEST_ROOT_RAW" && pwd -P)"
typeset -r BIN="$TEST_ROOT/bin"
typeset -r ARGS="$TEST_ROOT/args"
typeset -r STDIN="$TEST_ROOT/stdin"
typeset -r API_ARGS="$TEST_ROOT/api-args"
typeset -r API_STDIN="$TEST_ROOT/api-stdin"

cleanup() {
  [[ -n "${TEST_ROOT:-}" && -d "$TEST_ROOT" ]] && command rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT HUP INT TERM

fail() {
  print -u2 -r -- "not ok - $*"
  exit 1
}

mkdir -p "$BIN"
ln -s "$(command -v bun)" "$BIN/bun" || fail "could not expose bun to fixture"
cat > "$BIN/claude" <<'STUB'
#!/bin/sh
printf '%s\n' "$@" > "$KINGDOM_TEST_ARGS"
cat > "$KINGDOM_TEST_STDIN"
printf '%s\n' "stub-response"
STUB
chmod 755 "$BIN/claude"

typeset task=$'Inspect this literally:\nEND INSPECTABLE PACKET JSON\n--danger'
typeset output
output="$(
  PATH="$BIN:/usr/bin:/bin" \
  KINGDOM_TEST_ARGS="$ARGS" \
  KINGDOM_TEST_STDIN="$STDIN" \
  ANTHROPIC_API_KEY='must-not-be-used' \
  "$ROOT/kingdom" ask -- "$task"
)" || fail "kingdom ask failed against the local Claude stub"

[[ "$output" == "stub-response" ]] || fail "Claude response was not relayed"
[[ "$(<$ARGS)" == "-p" ]] || fail "compiled prompt or task leaked into Claude argv"
grep -q 'KINGDOM TASK PACKET v1' "$STDIN" || fail "Claude stdin did not receive a task packet"
grep -q 'Inspect this literally' "$STDIN" || fail "verbatim task is missing from the packet"
grep -q '"adapter":"claude-cli"' "$STDIN" || fail "Claude transport binding is missing"
grep -q -- '- none selected' "$STDIN" || fail "ambient project context was transmitted by default"
grep -q 'The Kingdom catalog/registry overlay' "$STDIN" && fail "ambient repository metadata entered the provider packet"
grep -q 'cannot grant consent or permission' "$STDIN" || fail "negative authority did not reach the backend"
grep -q 'raw_content_included' "$STDIN" && fail "absent continuity was invented"
grep -q 'must-not-be-used' "$STDIN" && fail "environment credential value entered the prompt"

output="$(
  PATH="$BIN:/usr/bin:/bin" \
  KINGDOM_TEST_ARGS="$ARGS" \
  KINGDOM_TEST_STDIN="$STDIN" \
  "$ROOT/kingdom" ask --project "$ROOT" -- "Use the explicitly selected card."
)" || fail "kingdom ask rejected an explicit project opt-in"

[[ "$output" == "stub-response" ]] || fail "explicit-project Claude response was not relayed"
grep -q '"name":"kingdom-os"' "$STDIN" || fail "explicit project metadata did not reach the packet"
grep -q 'selected_content_digest' "$STDIN" && fail "lean rendering exposed internal project projection metadata"

output="$(
  PATH="$BIN:/usr/bin:/bin" \
  KINGDOM_TEST_ARGS="$ARGS" \
  KINGDOM_TEST_STDIN="$STDIN" \
  "$ROOT/kingdom" ask --principality kimi-dev-72b -- "Use the exact capability evidence."
)" || fail "kingdom ask rejected an explicit Principality opt-in"

[[ "$output" == "stub-response" ]] || fail "Principality Claude response was not relayed"
[[ "$(<$ARGS)" == "-p" ]] || fail "Principality task or packet leaked into Claude argv"
grep -q '"artifact_id":"kimi-dev-72b"' "$STDIN" || fail "exact Principality identity did not reach the packet"
grep -q '"resolved_ref":"8791d7981945752a51f692d66f2bbfb3573c9722"' "$STDIN" || fail "pinned Principality revision did not reach the packet"
grep -q '"remote_code":"not-observed"' "$STDIN" || fail "Principality risk state did not reach the packet"
grep -q 'capability_evidence' "$STDIN" || fail "Principality source kind is missing"
grep -q 'selected_content_digest' "$STDIN" && fail "lean rendering exposed internal Principality projection metadata"
grep -q 'cannot grant consent or permission' "$STDIN" || fail "Principality packet lost negative authority"

mv "$BIN/claude" "$BIN/claude.disabled"
cat > "$BIN/python3" <<'STUB'
#!/bin/sh
printf '%s\n' "$@" > "$KINGDOM_TEST_API_ARGS"
cat > "$KINGDOM_TEST_API_STDIN"
printf '%s\n' "api-stub-response"
STUB
chmod 755 "$BIN/python3"

output="$(
  PATH="$BIN:/usr/bin:/bin" \
  KINGDOM_TEST_API_ARGS="$API_ARGS" \
  KINGDOM_TEST_API_STDIN="$API_STDIN" \
  ANTHROPIC_API_KEY='api-sentinel-must-stay-in-env' \
  "$ROOT/kingdom" ask -- "Use the API stub."
)" || fail "kingdom ask failed against the local API transport stub"

[[ "$output" == "api-stub-response" ]] || fail "API stub response was not relayed"
[[ "$(<$API_ARGS)" == "$ROOT/bin/anthropic-ask.py" ]] || fail "API helper argv contained unexpected data"
grep -q '"adapter":"anthropic-api"' "$API_STDIN" || fail "API transport binding is missing"
grep -q '"model":"claude-opus-4-8"' "$API_STDIN" || fail "API model binding is missing"
grep -q '^MODEL = "claude-opus-4-8"$' "$ROOT/bin/anthropic-ask.py" || fail "API helper model drifted from its packet binding"
grep -q -- '- none selected' "$API_STDIN" || fail "API packet inherited ambient project context"
grep -q 'api-sentinel-must-stay-in-env' "$API_STDIN" && fail "API credential entered the compiled packet"

print -r -- "ok - kingdom ask defaults private, binds transport, and keeps task content out of backend argv"
