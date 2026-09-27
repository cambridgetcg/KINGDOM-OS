#!/usr/bin/env zsh

# Isolated, network-free regression tests for the Living Ground plan contract.

emulate -L zsh
setopt pipe_fail

typeset -r PROD_ROOT="${0:A:h:h}"
typeset -r SKILL_ROOT="$PROD_ROOT/skills/cultivate-living-ground"
typeset -r VALIDATOR="$SKILL_ROOT/scripts/validate_plan.py"
typeset -r SCHEMA="$SKILL_ROOT/references/living-ground.schema.json"
typeset -r EXAMPLE="$SKILL_ROOT/references/living-ground.example.json"
typeset -r PYTHON="$(command -v python3)"
typeset -r JQ="$(command -v jq)"
[[ -n "$PYTHON" && -n "$JQ" ]] || {
  print -u2 -r -- "not ok - python3 and jq are required"
  exit 1
}
"$PYTHON" -c 'import jsonschema' >/dev/null 2>&1 || {
  print -u2 -r -- "not ok - python jsonschema is required"
  exit 1
}

typeset -r TEST_ROOT_RAW="$(command mktemp -d "${TMPDIR:-/tmp}/living-ground-test.XXXXXX")"
[[ -n "$TEST_ROOT_RAW" && -d "$TEST_ROOT_RAW" ]] || {
  print -u2 -r -- "not ok - could not create an isolated fixture directory"
  exit 1
}
typeset -r TEST_ROOT="$(builtin cd -q -- "$TEST_ROOT_RAW" && pwd -P)"
typeset -r CAPTURE_OUT="$TEST_ROOT/stdout"
typeset -r CAPTURE_ERR="$TEST_ROOT/stderr"
typeset -g CAPTURE_STDOUT CAPTURE_STDERR
typeset -gi CAPTURE_STATUS

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

typeset -r EXAMPLE_SHA_BEFORE="$(command shasum -a 256 "$EXAMPLE" | command awk '{print $1}')"

"$PYTHON" - "$SKILL_ROOT" <<'PY' || fail "schema, example, or instruction contract is invalid"
import json
from pathlib import Path
import sys

from jsonschema import Draft202012Validator, FormatChecker

def require(condition, message):
    if not condition:
        raise SystemExit(message)

root = Path(sys.argv[1])
skill = (root / "SKILL.md").read_text(encoding="utf-8")
contract = (root / "references/living-ground-contract.md").read_text(encoding="utf-8")
schema = json.loads((root / "references/living-ground.schema.json").read_text(encoding="utf-8"))
example = json.loads((root / "references/living-ground.example.json").read_text(encoding="utf-8"))

Draft202012Validator.check_schema(schema)
errors = list(Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(example))
require(not errors, f"documented example has schema errors: {errors}")
require("money and resources as bounded enabling flows" in skill, "money boundary is absent")
require("wake_context.inherits_identity" in skill, "WAKE identity boundary is absent")
require("DeepSeek research" in skill, "DeepSeek route is absent")
require("wild_margin" in contract, "wild-margin contract is absent")
contract_words = " ".join(contract.split())
require(
    "They cannot substitute for renewal, recovery, agency, rest, care, ecological limits, or participant voice." in contract_words,
    "resources cannot substitute for living capacity boundary is absent",
)
require(
    "there is no earnings, commercialisation, growth, learning, or output quota." in contract_words,
    "no-quota boundary is absent",
)
require("natural-language truth engine" in contract, "narrative limit is absent")
require("1,048,576" in contract, "operational byte limit is undocumented")
require("[TODO" not in skill, "skill contains a TODO placeholder")
require(
    example["life_charter"]["terminal_objective"] == "living_capacity_and_renewal",
    "life terminal objective is wrong",
)
require(example["economy"]["role"] == "enabling_flow", "money role is wrong")
require(example["economy"]["terminal_objective"] is False, "money became the objective")
require(example["economy"]["dignity_score"] is False, "money became a dignity score")
require(
    example["economy"]["resource_accumulation_goal"] is False,
    "resource accumulation became the goal",
)
require(example["wake_context"]["inherits_identity"] is False, "WAKE inherited identity")
require(example["wake_context"]["grants_authority"] is False, "WAKE granted authority")
require(example["receipt"]["boundary_review"] == "not_checked", "example review state is wrong")
require(all(example["claims_not_established"].values()), "claims-not-established flags changed")
PY

capture "$PYTHON" "$VALIDATOR" "$EXAMPLE" --json
assert_equal 0 "$CAPTURE_STATUS" "documented example failed semantic validation"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .protocol == "kingdom.living-ground-validation/0.1"
  and .valid == true
  and .plan_id == "agent-service-first-bed"
  and .schema_id == "urn:kingdom:schema:living-ground:0.1"
  and .issues == []
' >/dev/null || fail "valid JSON result is wrong"
[[ -z "$CAPTURE_STDERR" ]] || fail "valid JSON validation wrote to stderr"

"$JQ" '
  (.disposition_ledger[] | select(.ground_ref == "private-logging").disposition) = "remove"
' "$EXAMPLE" >| "$TEST_ROOT/unknown-disturbed.json"
capture "$PYTHON" "$VALIDATOR" "$TEST_ROOT/unknown-disturbed.json" --json
assert_equal 1 "$CAPTURE_STATUS" "unknown ground was allowed to be removed"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .valid == false and any(.issues[]; .code == "unknown-ground-disturbed")
' >/dev/null || fail "unknown-ground diagnostic is absent"

"$JQ" '.ground_profile[0].source_ids = ["missing-source"]' \
  "$EXAMPLE" >| "$TEST_ROOT/missing-source.json"
capture "$PYTHON" "$VALIDATOR" "$TEST_ROOT/missing-source.json" --json
assert_equal 1 "$CAPTURE_STATUS" "unresolved source reference was accepted"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .valid == false and any(.issues[]; .code == "unknown-source-ref")
' >/dev/null || fail "source-reference diagnostic is absent"

"$JQ" '.economy.terminal_objective = true' "$EXAMPLE" >| "$TEST_ROOT/money-objective.json"
capture "$PYTHON" "$VALIDATOR" "$TEST_ROOT/money-objective.json" --json
assert_equal 1 "$CAPTURE_STATUS" "money was accepted as a terminal objective"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .valid == false and any(.issues[]; .code == "schema-const")
' >/dev/null || fail "money-objective schema diagnostic is absent"

"$JQ" '.scope_and_authority.domain = "literal_garden" | .garden_safety = null' \
  "$EXAMPLE" >| "$TEST_ROOT/garden-without-gate.json"
capture "$PYTHON" "$VALIDATOR" "$TEST_ROOT/garden-without-gate.json" --json
assert_equal 1 "$CAPTURE_STATUS" "literal garden passed without its safety boundary"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .valid == false and any(.issues[]; (.code | startswith("schema-")))
' >/dev/null || fail "literal-garden schema diagnostic is absent"

"$JQ" '
  .scope_and_authority.domain = "literal_garden"
  | .garden_safety = {
      state: "assessment_required",
      assessment_source_ids: [],
      buried_services: "No service map has been supplied; do not disturb deeper ground.",
      structures_roots_and_grade: "Survey boundaries, roots, grade, and nearby structures before excavation.",
      unknown_materials: "Treat mixed construction material as unknown rather than safe or contaminated.",
      drainage_and_runoff: "Observe pooling, grade, outlets, and runoff before prescribing drainage work.",
      testing_boundary: "Use qualified local assessment before handling or disposing of suspicious material.",
      organism_and_material_movement: "Do not import organisms or bulk material before habitat and movement risks are assessed.",
      prohibited_actions: ["Do not break, burn, compost, casually sample, reuse, or discard unknown material."]
    }
' "$EXAMPLE" >| "$TEST_ROOT/garden-with-gate.json"
capture "$PYTHON" "$VALIDATOR" "$TEST_ROOT/garden-with-gate.json" --json
assert_equal 0 "$CAPTURE_STATUS" "literal garden with a bounded safety gate failed validation"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '.valid == true and .issues == []' >/dev/null \
  || fail "valid literal-garden result is wrong"

"$JQ" '
  .garden_safety.state = "qualified_clearance_recorded"
  | .garden_safety.assessment_source_ids = []
' "$TEST_ROOT/garden-with-gate.json" >| "$TEST_ROOT/garden-clearance-without-source.json"
capture "$PYTHON" "$VALIDATOR" "$TEST_ROOT/garden-clearance-without-source.json" --json
assert_equal 1 "$CAPTURE_STATUS" "qualified garden clearance passed without a source"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .valid == false and any(.issues[]; (.code | startswith("schema-")))
' >/dev/null || fail "garden-clearance source diagnostic is absent"

"$JQ" '
  .garden_safety.state = "qualified_clearance_recorded"
  | .garden_safety.assessment_source_ids = ["missing-source"]
' "$TEST_ROOT/garden-with-gate.json" >| "$TEST_ROOT/garden-clearance-missing-source.json"
capture "$PYTHON" "$VALIDATOR" "$TEST_ROOT/garden-clearance-missing-source.json" --json
assert_equal 1 "$CAPTURE_STATUS" "qualified garden clearance accepted an unresolved source"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .valid == false and any(.issues[]; .code == "unknown-source-ref")
' >/dev/null || fail "garden-clearance reference diagnostic is absent"

"$JQ" '.wake_context.source_id = "caller-brief"' "$EXAMPLE" >| "$TEST_ROOT/wrong-wake-source.json"
capture "$PYTHON" "$VALIDATOR" "$TEST_ROOT/wrong-wake-source.json" --json
assert_equal 1 "$CAPTURE_STATUS" "non-WAKE source was accepted as WAKE context"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .valid == false and any(.issues[]; .code == "invalid-wake-source-kind")
' >/dev/null || fail "WAKE-source diagnostic is absent"

"$JQ" '.wake_context.inherits_identity = true' "$EXAMPLE" >| "$TEST_ROOT/wake-identity.json"
capture "$PYTHON" "$VALIDATOR" "$TEST_ROOT/wake-identity.json" --json
assert_equal 1 "$CAPTURE_STATUS" "WAKE context was allowed to inherit identity"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .valid == false and any(.issues[]; (.code | startswith("schema-")))
' >/dev/null || fail "WAKE identity-boundary diagnostic is absent"

"$JQ" '.ground_profile[1].id = .ground_profile[0].id' \
  "$EXAMPLE" >| "$TEST_ROOT/duplicate-ground.json"
capture "$PYTHON" "$VALIDATOR" "$TEST_ROOT/duplicate-ground.json" --json
assert_equal 1 "$CAPTURE_STATUS" "duplicate ground IDs were accepted"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .valid == false and any(.issues[]; .code == "duplicate-id")
' >/dev/null || fail "duplicate-ID diagnostic is absent"

command awk '
  !inserted && /"terminal_objective": "living_capacity_and_renewal"/ {
    print "    \"terminal_objective\": \"resource_accumulation\",";
    inserted = 1;
  }
  { print }
' "$EXAMPLE" >| "$TEST_ROOT/duplicate-key.json"
capture "$PYTHON" "$VALIDATOR" "$TEST_ROOT/duplicate-key.json" --json
assert_equal 2 "$CAPTURE_STATUS" "duplicate JSON key was accepted"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .valid == false and any(.issues[]; .code == "validator-error")
' >/dev/null || fail "duplicate-key diagnostic is absent"

command ln -s "$EXAMPLE" "$TEST_ROOT/example-link.json" || fail "could not make symlink fixture"
capture "$PYTHON" "$VALIDATOR" "$TEST_ROOT/example-link.json" --json
assert_equal 2 "$CAPTURE_STATUS" "symlink input was accepted"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .valid == false and any(.issues[]; .code == "validator-error")
' >/dev/null || fail "symlink boundary diagnostic is absent"

typeset -r EXAMPLE_SHA_AFTER="$(command shasum -a 256 "$EXAMPLE" | command awk '{print $1}')"
assert_equal "$EXAMPLE_SHA_BEFORE" "$EXAMPLE_SHA_AFTER" "validation mutated the documented example"

print -r -- "ok - Living Ground contract tests passed"
