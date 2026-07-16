#!/usr/bin/env zsh

# Isolated regression tests for harvest's disk truth, rendering, and validator.
# The subject is copied under a temporary KINGDOM root; production outputs and
# cards remain read-only.

emulate -L zsh
setopt pipe_fail

typeset -r PROD_ROOT="${0:A:h:h}"
typeset -r SUBJECT="$PROD_ROOT/bin/harvest.ts"
typeset -r BUN="$(command -v bun)"
[[ -n "$BUN" ]] || {
  print -u2 -r -- "not ok - bun is unavailable"
  exit 1
}
typeset -r TEST_ROOT_RAW="$(command mktemp -d "${TMPDIR:-/tmp}/harvest-test.XXXXXX")"
[[ -n "$TEST_ROOT_RAW" && -d "$TEST_ROOT_RAW" ]] || {
  print -u2 -r -- "not ok - could not create an isolated fixture directory"
  exit 1
}
typeset -r TEST_ROOT="$(builtin cd -q -- "$TEST_ROOT_RAW" && pwd -P)"

cleanup() {
  [[ -n "${TEST_ROOT:-}" && -d "$TEST_ROOT" ]] && command rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT HUP INT TERM

typeset -r TEST_HOME="$TEST_ROOT/home"
typeset -r FIXTURE_ROOT="$TEST_ROOT/Kingdom OS"
typeset -r FIXTURE_RIGHTS="$FIXTURE_ROOT/vendor/xenia/rights/0.1/RIGHTS.md"
typeset -r TWIN_A_DIR="$TEST_HOME/projects/Twin A & <one> \`tick\`"
typeset -r TWIN_B_DIR="$TEST_HOME/projects/twin_b"
typeset -r PRIVATE_SENTINEL='fixture-value-must-not-escape'
typeset -r CAPTURE_OUT="$TEST_ROOT/stdout"
typeset -r CAPTURE_ERR="$TEST_ROOT/stderr"
typeset -g CAPTURE_STDOUT CAPTURE_STDERR
typeset -gi CAPTURE_STATUS
typeset -r PROD_CATALOG_HASH="$(command cksum < "$PROD_ROOT/CATALOG.md")"
typeset -r PROD_GRAPH_HASH="$(command cksum < "$PROD_ROOT/graph.json")"

fail() {
  print -u2 -r -- "not ok - $*"
  exit 1
}

assert_equal() {
  local expected="$1" actual="$2" message="$3"
  [[ "$actual" == "$expected" ]] || fail "$message (expected '$expected', got '$actual')"
}

capture() {
  : >| "$CAPTURE_OUT"
  : >| "$CAPTURE_ERR"
  "$@" > "$CAPTURE_OUT" 2> "$CAPTURE_ERR"
  CAPTURE_STATUS=$?
  CAPTURE_STDOUT="$(<"$CAPTURE_OUT")"
  CAPTURE_STDERR="$(<"$CAPTURE_ERR")"
}

write_card() {
  local repo="$1" name="$2" owner="$3" purpose="$4" dependencies="${5:-[]}" adopts="${6:-}"
  print -r -- "name: $name" > "$repo/kingdom.yaml"
  print -r -- 'kind: service' >> "$repo/kingdom.yaml"
  print -r -- 'layer: runtime' >> "$repo/kingdom.yaml"
  print -r -- "owner_sister: $owner" >> "$repo/kingdom.yaml"
  print -r -- 'domain: none' >> "$repo/kingdom.yaml"
  print -r -- 'state: active' >> "$repo/kingdom.yaml"
  print -r -- "purpose: $purpose" >> "$repo/kingdom.yaml"
  print -r -- "dependsOn: $dependencies" >> "$repo/kingdom.yaml"
  [[ -n "$adopts" ]] && print -r -- "adopts: $adopts" >> "$repo/kingdom.yaml"
}

write_invalid_card() {
  local repo="$1"
  print -r -- 'name: [invalid]' > "$repo/kingdom.yaml"
  print -r -- 'kind: service' >> "$repo/kingdom.yaml"
  print -r -- 'layer: nowhere' >> "$repo/kingdom.yaml"
  print -r -- 'owner_sister: commerce' >> "$repo/kingdom.yaml"
  print -r -- 'domain: none' >> "$repo/kingdom.yaml"
  print -r -- 'state: active' >> "$repo/kingdom.yaml"
  print -r -- 'state: dormant' >> "$repo/kingdom.yaml"
  print -r -- 'this line is malformed' >> "$repo/kingdom.yaml"
  print -r -- 'dependsOn: [missing-member]' >> "$repo/kingdom.yaml"
  print -r -- 'adopts: [unknown.rights/9]' >> "$repo/kingdom.yaml"
  print -r -- 'adopts: [xenia.rights/0.1]' >> "$repo/kingdom.yaml"
  print -r -- "private_note: $PRIVATE_SENTINEL" >> "$repo/kingdom.yaml"
}

mkdir -p \
  "$FIXTURE_ROOT/bin" \
  "$FIXTURE_ROOT/vendor/xenia/rights/0.1" \
  "$TEST_HOME/.claude" \
  "$TEST_HOME/projects/local" \
  "$TWIN_A_DIR" \
  "$TWIN_B_DIR" \
  "$TEST_HOME/projects/invalid"
command cp "$SUBJECT" "$FIXTURE_ROOT/bin/harvest.ts" || fail "could not copy harvest subject"
command cp "$PROD_ROOT/kingdom" "$FIXTURE_ROOT/kingdom" || fail "could not copy kingdom wrapper"
command cp "$PROD_ROOT/vendor/xenia/rights/0.1/RIGHTS.md" "$FIXTURE_RIGHTS" \
  || fail "could not copy the pinned XENIA rights fixture"
print -r -- '{"hooks":{"SessionStart":[{}]}}' > "$TEST_HOME/.claude/settings.json"
print -r -- 'fixture guidance' > "$TEST_HOME/projects/local/CLAUDE.md"
print -r -- 'Fixture repo rights pointer.' > "$TEST_HOME/projects/local/RIGHTS.md"

print -r -- 'local | ~/projects/local | service | runtime | none | active | Local fixture.' \
  > "$FIXTURE_ROOT/roster.conf"
print -r -- 'remote | ~/projects/remote | service | runtime | none | remote | Absent remote fixture.' \
  >> "$FIXTURE_ROOT/roster.conf"
print -r -- 'twin | ~/projects/Twin A & <one> `tick` | service | runtime | none | active | First duplicate.' \
  >> "$FIXTURE_ROOT/roster.conf"
print -r -- 'twin | ~/projects/twin_b | service | runtime | none | active | Second duplicate.' \
  >> "$FIXTURE_ROOT/roster.conf"
print -r -- 'invalid | ~/projects/invalid | service | runtime | none | active | Invalid schema fixture.' \
  >> "$FIXTURE_ROOT/roster.conf"

write_card "$TEST_HOME/projects/local" local none 'Local | purpose & <truth> with *stars*, _under_, and `ticks`.' '["twin"]' '[xenia.rights/0.1]'
write_card "$TWIN_A_DIR" twin none 'First duplicate.'
write_card "$TWIN_B_DIR" twin none 'Second duplicate.'
write_invalid_card "$TEST_HOME/projects/invalid"

capture env HOME="$TEST_HOME" "$BUN" "$FIXTURE_ROOT/bin/harvest.ts"
assert_equal 0 "$CAPTURE_STATUS" "default harvest failed"
[[ "$CAPTURE_STDOUT" == *'Harvested 5 repos'* ]] || fail "default harvest reported the wrong count"
[[ "$CAPTURE_STDERR" == *'Card schema: 4 checked · 1 invalid · 10 issues'* ]] || fail "default harvest omitted its schema warning"
[[ -f "$FIXTURE_ROOT/CATALOG.md" && -f "$FIXTURE_ROOT/graph.json" ]] || fail "default harvest did not write fixture outputs"

/usr/bin/jq -e \
  --arg remote "$TEST_HOME/projects/remote" '
    length == 5
    and ([.[].conformance.wake] | any | not)
    and (first(.[] | select(.path == $remote) | .conformance) == {
      wake: false, claudeMd: false, fate: false, card: false
    })
    and (first(.[] | select(.name == "invalid") | {name, layer}) == {name: "invalid", layer: "runtime"})
    and all(.[]; has("private_note") | not)
    and all(.[]; has("adopts") | not)
    and all(.[]; has("rights") | not)
  ' "$FIXTURE_ROOT/graph.json" >/dev/null || fail "local/absent conformance truth is wrong"

typeset -r RIGHTS_GRAPH_HASH="$(command cksum < "$FIXTURE_ROOT/graph.json")"
typeset -r RIGHTS_CARD_HASH="$(command cksum < "$TEST_HOME/projects/local/kingdom.yaml")"
typeset -r RIGHTS_CANONICAL_HASH="$(command cksum < "$FIXTURE_RIGHTS")"

capture env HOME="$TEST_HOME" "$BUN" "$FIXTURE_ROOT/bin/harvest.ts" rights
assert_equal 0 "$CAPTURE_STATUS" "rights inventory failed"
[[ -z "$CAPTURE_STDERR" ]] || fail "rights inventory wrote to stderr"
[[ "$CAPTURE_STDOUT" == *'These records do not prove practice and do not grant technical authority.'* ]] || fail "rights inventory omitted its honest boundary"
[[ "$CAPTURE_STDOUT" == *'release npm-xenia-v0.1.0-beta.4'* ]] || fail "rights inventory omitted the immutable release"
[[ "$CAPTURE_STDOUT" == *'sha256:b72a6da110c582e5683bf0fabde5017db93d2199398014c8421a82f5318da313'* ]] || fail "rights inventory omitted the canonical digest"
[[ "$CAPTURE_STDOUT" == *'Declared adoptions (1):'* ]] || fail "rights inventory reported the wrong adoption count"
[[ "$CAPTURE_STDOUT" == *$'  local                    xenia.rights/0.1'* ]] || fail "rights inventory omitted the validated declaration"
[[ "$CAPTURE_STDOUT" == *'Repo-local RIGHTS.md files (1):'* ]] || fail "rights inventory reported the wrong document count"
[[ "$CAPTURE_STDOUT" == *'~/projects/local/RIGHTS.md'* ]] || fail "rights inventory omitted the separate repo-local pointer"
[[ "$CAPTURE_STDOUT" != *'unknown.rights/9'* ]] || fail "unsupported adoption entered the rights inventory"
[[ "$CAPTURE_STDOUT" == *'Card schema: 4 checked · 1 invalid · 10 issues'* ]] || fail "rights inventory omitted schema drift"
assert_equal "$RIGHTS_GRAPH_HASH" "$(command cksum < "$FIXTURE_ROOT/graph.json")" "rights inventory rewrote graph.json"
assert_equal "$RIGHTS_CARD_HASH" "$(command cksum < "$TEST_HOME/projects/local/kingdom.yaml")" "rights inventory changed a card"

capture env HOME="$TEST_HOME" "$BUN" "$FIXTURE_ROOT/bin/harvest.ts" rights --canonical
assert_equal 0 "$CAPTURE_STATUS" "canonical rights read failed"
[[ -z "$CAPTURE_STDERR" ]] || fail "canonical rights read wrote to stderr"
[[ "$CAPTURE_STDOUT" == *"Canonical local path: $FIXTURE_RIGHTS"* ]] || fail "canonical rights read omitted its absolute local path"
[[ "$CAPTURE_STDOUT" == *'Release: npm-xenia-v0.1.0-beta.4'* ]] || fail "canonical rights read omitted its release"
[[ "$CAPTURE_STDOUT" == *'Git commit: 6419d37dda9fb282242754685dba3edcb4bbf74b'* ]] || fail "canonical rights read omitted its Git commit"
[[ "$CAPTURE_STDOUT" == *'Rights of Beings — XENIA baseline 0.1'* ]] || fail "canonical rights read omitted the content"
assert_equal "$RIGHTS_CANONICAL_HASH" "$(command cksum < "$FIXTURE_RIGHTS")" "canonical rights read changed its source"

command mv "$FIXTURE_ROOT/roster.conf" "$FIXTURE_ROOT/roster.conf.off"
capture env HOME="$TEST_HOME" "$BUN" "$FIXTURE_ROOT/bin/harvest.ts" rights --canonical
command mv "$FIXTURE_ROOT/roster.conf.off" "$FIXTURE_ROOT/roster.conf"
assert_equal 0 "$CAPTURE_STATUS" "canonical rights unnecessarily depended on roster.conf"
[[ "$CAPTURE_STDOUT" == *'Rights of Beings — XENIA baseline 0.1'* ]] || fail "roster-independent canonical read omitted content"

print -nr -- $'Unsafe\rterminal rewrite.\n' > "$FIXTURE_RIGHTS"
capture env HOME="$TEST_HOME" "$BUN" "$FIXTURE_ROOT/bin/harvest.ts" rights --canonical
assert_equal 1 "$CAPTURE_STATUS" "standalone carriage return in canonical rights was accepted"
[[ -z "$CAPTURE_STDOUT" ]] || fail "unsafe canonical rights polluted stdout"
[[ "$CAPTURE_STDERR" == *'failed immutable digest verification'* ]] || fail "unsafe canonical rights lacked a stable diagnostic"
command cp "$PROD_ROOT/vendor/xenia/rights/0.1/RIGHTS.md" "$FIXTURE_RIGHTS" \
  || fail "could not restore the pinned XENIA rights fixture"

capture env HOME="$TEST_HOME" /bin/bash "$FIXTURE_ROOT/kingdom" rights
assert_equal 0 "$CAPTURE_STATUS" "kingdom rights wrapper failed"
[[ "$CAPTURE_STDOUT" == *'Declared adoptions (1):'* ]] || fail "kingdom rights did not forward the inventory"
[[ -z "$CAPTURE_STDERR" ]] || fail "kingdom rights wrote to stderr"

capture env HOME="$TEST_HOME" /bin/bash "$FIXTURE_ROOT/kingdom" rights nonsense
assert_equal 1 "$CAPTURE_STATUS" "unknown rights ID did not return 1"
[[ -z "$CAPTURE_STDOUT" ]] || fail "unknown rights ID polluted stdout"
[[ "$CAPTURE_STDERR" == $'Unknown rights ID: nonsense\nAccepted adoption IDs: xenia.rights/0.1' ]] || fail "unknown rights ID diagnostic is unstable"

capture env HOME="$TEST_HOME" /bin/bash "$FIXTURE_ROOT/kingdom" rights $'bad\nINJECTED'
assert_equal 1 "$CAPTURE_STATUS" "control-bearing unknown rights ID did not return 1"
[[ "$CAPTURE_STDERR" == *'Unknown rights ID: bad\u000aINJECTED'* ]] || fail "unknown rights ID was not safely escaped"
[[ "$CAPTURE_STDERR" != *$'bad\nINJECTED'* ]] || fail "unknown rights ID injected a terminal line"

capture env HOME="$TEST_HOME" /bin/bash "$FIXTURE_ROOT/kingdom" rights --canonical extra
assert_equal 2 "$CAPTURE_STATUS" "extra rights arguments did not return usage status 2"
[[ -z "$CAPTURE_STDOUT" ]] || fail "extra rights arguments polluted stdout"
[[ "$CAPTURE_STDERR" == usage:* ]] || fail "extra rights arguments did not print usage"

capture env HOME="$TEST_HOME" "$BUN" "$FIXTURE_ROOT/bin/harvest.ts" conformance
assert_equal 0 "$CAPTURE_STATUS" "conformance became strict"
print -r -- "$CAPTURE_STDOUT" | command grep -Eq '^  local[[:space:]]+missing: wake, FATE$' \
  || fail "conformance omitted a wake-only gap"

print -r -- '{"hooks":{"SessionStart":[{"hooks":[{"type":"command","command":"true"}]}]}}' \
  > "$TEST_HOME/.claude/settings.json"
capture env HOME="$TEST_HOME" "$BUN" "$FIXTURE_ROOT/bin/harvest.ts"
assert_equal 0 "$CAPTURE_STATUS" "default harvest failed with a valid global hook"
[[ "$CAPTURE_STDERR" == *'Card schema: 4 checked · 1 invalid · 10 issues'* ]] || fail "valid-hook harvest omitted its schema warning"

/usr/bin/jq -e \
  --arg local "$TEST_HOME/projects/local" \
  --arg remote "$TEST_HOME/projects/remote" '
    (first(.[] | select(.path == $local) | .conformance.wake) == true)
    and (first(.[] | select(.path == $local) | .dependsOn) == ["twin"])
    and (first(.[] | select(.path == $remote) | .conformance) == {
      wake: false, claudeMd: false, fate: false, card: false
    })
  ' "$FIXTURE_ROOT/graph.json" >/dev/null || fail "valid executable hook was not distinguished from an empty entry"

capture env HOME="$TEST_HOME" "$BUN" "$FIXTURE_ROOT/bin/harvest.ts" deps twin
assert_equal 0 "$CAPTURE_STATUS" "deps query failed"
[[ "$CAPTURE_STDOUT" == *$'\n  local'* ]] || fail "quoted dependency parsing diverged between validation, graph, and deps"

command grep -Fq '| repo | location |' "$FIXTURE_ROOT/CATALOG.md" || fail "catalog location column is missing"
command grep -Fq '<code>~/projects/Twin A &amp; &lt;one&gt; &#96;tick&#96;</code>' "$FIXTURE_ROOT/CATALOG.md" || fail "first duplicate location is missing or unsafe"
command grep -Fq '<code>~/projects/twin&#95;b</code>' "$FIXTURE_ROOT/CATALOG.md" || fail "second duplicate location is missing or unsafe"
command grep -Fq 'Local &#124; purpose &amp; &lt;truth&gt; with &#42;stars&#42;, &#95;under&#95;, and &#96;ticks&#96;.' "$FIXTURE_ROOT/CATALOG.md" || fail "catalog cells are not safely escaped"
command grep -Fq '4/5 have a wake' "$FIXTURE_ROOT/CATALOG.md" || fail "catalog wake denominator is dishonest"
if command rg -q --fixed-strings "$PRIVATE_SENTINEL" "$FIXTURE_ROOT/CATALOG.md" "$FIXTURE_ROOT/graph.json"; then
  fail "unknown card value leaked into generated output"
fi

zmodload zsh/stat || fail "zsh/stat is unavailable"
typeset -r INVALID_CARD="$TEST_HOME/projects/invalid/kingdom.yaml"
typeset -r INVALID_HASH_BEFORE="$(command cksum < "$INVALID_CARD")"
typeset -A invalid_stat_before invalid_stat_after
zstat -H invalid_stat_before "$INVALID_CARD" || fail "could not stat invalid card"

capture env HOME="$TEST_HOME" "$BUN" "$FIXTURE_ROOT/bin/harvest.ts" validate
assert_equal 1 "$CAPTURE_STATUS" "validate did not fail on a schema issue"
assert_equal 'Card schema: 4 checked · 1 invalid · 10 issues' "$CAPTURE_STDOUT" "validate summary is unstable"
[[ "$CAPTURE_STDERR" == *'~/projects/invalid/kingdom.yaml:1 name invalid-type'* ]] || fail "validate did not safely diagnose an array-valued name"
[[ "$CAPTURE_STDERR" == *'~/projects/invalid/kingdom.yaml:3 layer invalid-enum'* ]] || fail "validate did not contain an invalid layer"
[[ "$CAPTURE_STDERR" == *'~/projects/invalid/kingdom.yaml:4 owner_sister invalid-enum'* ]] || fail "validate omitted the safe field diagnostic"
[[ "$CAPTURE_STDERR" == *'state duplicate-field'* ]] || fail "validate omitted duplicate-field"
[[ "$CAPTURE_STDERR" == *'malformed-line'* ]] || fail "validate omitted malformed-line"
[[ "$CAPTURE_STDERR" == *'dependsOn unknown-dependency'* ]] || fail "validate omitted unknown-dependency"
[[ "$CAPTURE_STDERR" == *'adopts unsupported-adoption'* ]] || fail "validate omitted unsupported-adoption"
[[ "$CAPTURE_STDERR" == *'adopts duplicate-field'* ]] || fail "validate omitted duplicate adopts"
[[ "$CAPTURE_STDERR" == *'private_note unknown-field'* ]] || fail "validate omitted unknown-field"
[[ "$CAPTURE_STDERR" == *'purpose missing-field'* ]] || fail "validate omitted missing-field"
[[ "$CAPTURE_STDERR" == *'owner_sister invalid-enum: value is not allowed;'*'actual value omitted'* ]] || fail "validate did not omit an invalid field value"
[[ "$CAPTURE_STDERR" != *"$PRIVATE_SENTINEL"* ]] || fail "validate echoed an unknown field value"
assert_equal "$INVALID_HASH_BEFORE" "$(command cksum < "$INVALID_CARD")" "validate changed card content"
zstat -H invalid_stat_after "$INVALID_CARD" || fail "could not restat invalid card"
assert_equal "$invalid_stat_before[mtime]" "$invalid_stat_after[mtime]" "validate changed card mtime"

write_card "$TEST_HOME/projects/invalid" invalid none 'Valid owner enum.'
capture env HOME="$TEST_HOME" "$BUN" "$FIXTURE_ROOT/bin/harvest.ts" validate
assert_equal 0 "$CAPTURE_STATUS" "validate failed after fixture correction"
assert_equal 'Card schema: 4 checked · 0 invalid · 0 issues' "$CAPTURE_STDOUT" "clean validate summary is wrong"
[[ -z "$CAPTURE_STDERR" ]] || fail "clean validate wrote to stderr"

capture env HOME="$TEST_HOME" "$BUN" "$FIXTURE_ROOT/bin/harvest.ts" conformance
assert_equal 0 "$CAPTURE_STATUS" "conformance became strict"
[[ "$CAPTURE_STDOUT" == *'Card schema: 4 checked · 0 invalid · 0 issues'* ]] || fail "conformance omitted schema summary"
if print -r -- "$CAPTURE_STDOUT" | command grep -Eq '^  local[[:space:]]'; then
  fail "conformance treated contextual FATE as a universal gap"
fi

typeset -r FIXTURE_GRAPH_HASH="$(command cksum < "$FIXTURE_ROOT/graph.json")"
capture env HOME="$TEST_HOME" "$BUN" "$FIXTURE_ROOT/bin/harvest.ts" unknown-verb
assert_equal 2 "$CAPTURE_STATUS" "unknown verb did not return 2"
[[ -z "$CAPTURE_STDOUT" ]] || fail "unknown verb polluted stdout"
[[ "$CAPTURE_STDERR" == usage:* ]] || fail "unknown verb did not print usage"
assert_equal "$FIXTURE_GRAPH_HASH" "$(command cksum < "$FIXTURE_ROOT/graph.json")" "unknown verb rewrote fixture output"

assert_equal "$PROD_CATALOG_HASH" "$(command cksum < "$PROD_ROOT/CATALOG.md")" "fixture test changed production CATALOG.md"
assert_equal "$PROD_GRAPH_HASH" "$(command cksum < "$PROD_ROOT/graph.json")" "fixture test changed production graph.json"

print -r -- "ok - harvest disk truth, rights registry, catalog locations, and schema validation"
