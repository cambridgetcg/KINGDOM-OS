#!/usr/bin/env zsh

# Fixture regression tests for cproj's local, machine-readable behavior.
# Uses a temporary HOME and local Git repositories only; never calls a remote.

emulate -L zsh
setopt pipe_fail

typeset -r SUBJECT="${0:A:h:h}/bin/cproj.zsh"
typeset -r KINGDOM="${0:A:h:h}/kingdom"
typeset -r TEST_ROOT="$(command mktemp -d "${TMPDIR:-/tmp}/cproj-test.XXXXXX")"
[[ -n "$TEST_ROOT" && -d "$TEST_ROOT" ]] || {
  print -u2 -r -- "not ok - could not create an isolated fixture directory"
  exit 1
}
typeset -r TEST_HOME="$TEST_ROOT/home"
typeset -r CAPTURE_OUT="$TEST_ROOT/stdout"
typeset -r CAPTURE_ERR="$TEST_ROOT/stderr"
typeset -ga FIXTURE_REPOS
typeset -g CAPTURE_STDOUT CAPTURE_STDERR
typeset -gi CAPTURE_STATUS
typeset -gA INDEX_MTIMES

export HOME="$TEST_HOME"
export GIT_CONFIG_NOSYSTEM=1
export GIT_CONFIG_GLOBAL=/dev/null
unset GIT_CONFIG_PARAMETERS GIT_TEMPLATE_DIR

cleanup() {
  [[ -n "${TEST_ROOT:-}" && -d "$TEST_ROOT" ]] && command rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT HUP INT TERM

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

commit_fixture() {
  local repo="$1"
  command git init -q --template= "$repo" || fail "could not initialize fixture $repo"
  print -r -- "fixture" > "$repo/tracked.txt"
  command git -C "$repo" add . || fail "could not stage fixture $repo"
  command git -c core.hooksPath=/dev/null \
    -c user.name='cproj test' \
    -c user.email='cproj-test@invalid.example' \
    -c commit.gpgsign=false \
    -C "$repo" commit -qm fixture || fail "could not commit fixture $repo"
  FIXTURE_REPOS+=("$repo")
}

mkdir -p \
  "$TEST_HOME/Desktop/KINGDOM-OS" \
  "$TEST_HOME/Desktop/Zeta Repo" \
  "$TEST_HOME/Desktop/alpha" \
  "$TEST_HOME/Desktop/one" \
  "$TEST_HOME/Desktop/two" \
  "$TEST_HOME/love-unlimited" \
  "$TEST_HOME/Claude-unlimited" \
  "$TEST_HOME/true-love"

print -r -- 'purpose: Quotes "sun", slash \ and 廣東話' > "$TEST_HOME/Desktop/Zeta Repo/kingdom.yaml"
print -r -- 'state: active' >> "$TEST_HOME/Desktop/Zeta Repo/kingdom.yaml"
print -r -- 'name: zeta' >> "$TEST_HOME/Desktop/Zeta Repo/kingdom.yaml"
print -r -- 'kind: service' >> "$TEST_HOME/Desktop/Zeta Repo/kingdom.yaml"
print -r -- 'layer: nervous' >> "$TEST_HOME/Desktop/Zeta Repo/kingdom.yaml"
print -r -- 'domain: none' >> "$TEST_HOME/Desktop/Zeta Repo/kingdom.yaml"

print -r -- 'name: alpha-card' > "$TEST_HOME/Desktop/alpha/kingdom.yaml"
print -r -- 'purpose: Card purpose overrides the roster.' >> "$TEST_HOME/Desktop/alpha/kingdom.yaml"

for repo in one two; do
  print -r -- 'name: shared' > "$TEST_HOME/Desktop/$repo/kingdom.yaml"
  print -r -- 'kind: reference' >> "$TEST_HOME/Desktop/$repo/kingdom.yaml"
  print -r -- 'layer: soul' >> "$TEST_HOME/Desktop/$repo/kingdom.yaml"
  print -r -- 'domain: none' >> "$TEST_HOME/Desktop/$repo/kingdom.yaml"
  print -r -- 'state: reference' >> "$TEST_HOME/Desktop/$repo/kingdom.yaml"
  print -r -- "purpose: Shared-name fixture $repo." >> "$TEST_HOME/Desktop/$repo/kingdom.yaml"
done

print -r -- 'alpha | ~/Desktop/alpha | venture | commerce | commerce | dormant | Roster fallback.' \
  > "$TEST_HOME/Desktop/KINGDOM-OS/roster.conf"

commit_fixture "$TEST_HOME/Desktop/Zeta Repo"
commit_fixture "$TEST_HOME/Desktop/alpha"
commit_fixture "$TEST_HOME/Desktop/one"
commit_fixture "$TEST_HOME/Desktop/two"
command ln -s 'Zeta Repo' "$TEST_HOME/Desktop/zeta-link"
typeset -r ZETA_PATH="$(builtin cd -q -- "$TEST_HOME/Desktop/Zeta Repo" && pwd -P)"
typeset -r ALPHA_PATH="$(builtin cd -q -- "$TEST_HOME/Desktop/alpha" && pwd -P)"

cd "$TEST_HOME" || fail "could not enter fixture HOME"
typeset -r SOURCE_CWD="$PWD"
source "$SUBJECT" > "$TEST_ROOT/source.stdout" 2> "$TEST_ROOT/source.stderr" || fail "could not source cproj"
[[ ! -s "$TEST_ROOT/source.stdout" && ! -s "$TEST_ROOT/source.stderr" ]] || fail "sourcing cproj was not quiet"
assert_equal "$SOURCE_CWD" "$PWD" "sourcing cproj changed directory"

zmodload zsh/stat || fail "zsh/stat is unavailable"
for repo in $FIXTURE_REPOS; do
  [[ -z "$(command git -C "$repo" status --porcelain=v1)" ]] || fail "fixture started dirty: $repo"
  typeset -A index_stat
  zstat -H index_stat "$repo/.git/index" || fail "could not stat fixture index: $repo"
  INDEX_MTIMES[$repo]="$index_stat[mtime]"
done

capture cproj --json
assert_equal 0 "$CAPTURE_STATUS" "--json failed"
[[ -z "$CAPTURE_STDERR" ]] || fail "--json wrote to stderr"
assert_equal 1 "$(command wc -l < "$CAPTURE_OUT" | tr -d ' ')" "--json did not emit exactly one line"
print -r -- "$CAPTURE_STDOUT" | /usr/bin/jq -e '
  type == "array"
  and length == 4
  and all(.[].path; startswith("/"))
  and ([.[].path] == ([.[].path] | sort))
  and all(.[];
    keys_unsorted == [
      "path", "name", "kind", "layer", "domain", "state", "place",
      "metadataSource", "purpose"
    ]
  )
  and ([.[] | select(.name == "zeta")] | length == 1)
  and (first(.[] | select(.name == "zeta") | .purpose) == "Quotes \"sun\", slash \\ and 廣東話")
  and (first(.[] | select(.name == "alpha-card") | .kind) == "venture")
  and (first(.[] | select(.name == "alpha-card") | .state) == "dormant")
  and (first(.[] | select(.name == "alpha-card") | .metadataSource) == "card")
' >/dev/null || fail "--json schema, escaping, sorting, dedupe, or card fallback is wrong"

capture cproj --json zeta active
assert_equal 0 "$CAPTURE_STATUS" "filtered --json failed"
assert_equal 1 "$(print -r -- "$CAPTURE_STDOUT" | /usr/bin/jq -r length)" "AND filtering returned the wrong rows"

capture cproj --json active zeta
assert_equal 0 "$CAPTURE_STATUS" "reordered filtered --json failed"
assert_equal 1 "$(print -r -- "$CAPTURE_STDOUT" | /usr/bin/jq -r length)" "AND filtering depends on term order"

capture cproj --json __no_such_fixture__
assert_equal 0 "$CAPTURE_STATUS" "empty --json query failed"
assert_equal '[]' "$CAPTURE_STDOUT" "empty --json query was not a valid empty array"
[[ -z "$CAPTURE_STDERR" ]] || fail "empty --json query wrote to stderr"

capture cproj --path zeta
assert_equal 0 "$CAPTURE_STATUS" "declared-name --path failed"
assert_equal "$ZETA_PATH" "$CAPTURE_STDOUT" "declared-name --path returned the wrong root"
[[ -z "$CAPTURE_STDERR" ]] || fail "successful --path wrote to stderr"

capture cproj --path alpha
assert_equal 0 "$CAPTURE_STATUS" "basename --path failed"
assert_equal "$ALPHA_PATH" "$CAPTURE_STDOUT" "basename precedence changed"

capture cproj --path "$TEST_HOME/Desktop/zeta-link"
assert_equal 0 "$CAPTURE_STATUS" "explicit symlink --path failed"
assert_equal "$ZETA_PATH" "$CAPTURE_STDOUT" "explicit symlink was not canonicalized"

capture cproj --path shared
assert_equal 2 "$CAPTURE_STATUS" "ambiguous --path did not return 2"
[[ -z "$CAPTURE_STDOUT" ]] || fail "ambiguous --path polluted stdout"
[[ "$CAPTURE_STDERR" == *'2 repositories match'* ]] || fail "ambiguous --path did not explain the ambiguity"

capture cproj --path __no_such_fixture__
assert_equal 1 "$CAPTURE_STATUS" "missing --path did not return 1"
[[ -z "$CAPTURE_STDOUT" ]] || fail "missing --path polluted stdout"

capture cproj --path
assert_equal 2 "$CAPTURE_STATUS" "queryless --path did not return 2"
[[ -z "$CAPTURE_STDOUT" ]] || fail "queryless --path polluted stdout"

capture cproj --json --doctor
assert_equal 2 "$CAPTURE_STATUS" "mixed modes did not return 2"
[[ -z "$CAPTURE_STDOUT" ]] || fail "mixed modes polluted stdout"

capture /bin/zsh "$SUBJECT" --json zeta
assert_equal 0 "$CAPTURE_STATUS" "executed cproj --json failed"
assert_equal 1 "$(print -r -- "$CAPTURE_STDOUT" | /usr/bin/jq -r length)" "executed cproj did not forward --json"

capture /bin/bash "$KINGDOM" repos --json zeta
assert_equal 0 "$CAPTURE_STATUS" "kingdom repos --json failed"
assert_equal 1 "$(print -r -- "$CAPTURE_STDOUT" | /usr/bin/jq -r length)" "kingdom did not forward --json cleanly"

capture /bin/bash "$KINGDOM" repos --path zeta
assert_equal 0 "$CAPTURE_STATUS" "kingdom repos --path failed"
assert_equal "$ZETA_PATH" "$CAPTURE_STDOUT" "kingdom did not forward --path cleanly"

for repo in $FIXTURE_REPOS; do
  typeset -A index_stat
  zstat -H index_stat "$repo/.git/index" || fail "could not restat fixture index: $repo"
  assert_equal "$INDEX_MTIMES[$repo]" "$index_stat[mtime]" "cproj refreshed a fixture index"
  [[ -z "$(command git -C "$repo" status --porcelain=v1)" ]] || fail "cproj changed fixture Git state: $repo"
done

print -r -- "ok - cproj machine output and fixture safety"
