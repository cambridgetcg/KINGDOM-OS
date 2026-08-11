#!/usr/bin/env zsh

# Isolated regression tests for Nen ability manifests and KARMA receipts.
# Production skills, schemas, and outputs remain read-only.

emulate -L zsh
setopt pipe_fail

typeset -r PROD_ROOT="${0:A:h:h}"
typeset -r SUBJECT="$PROD_ROOT/bin/nen.mjs"
typeset -r BUN="$(command -v bun)"
typeset -r JQ="$(command -v jq)"
typeset -r PYTHON="$(command -v python3)"
[[ -n "$BUN" && -n "$JQ" && -n "$PYTHON" ]] || {
  print -u2 -r -- "not ok - bun, jq, and python3 are required"
  exit 1
}
"$PYTHON" -c 'import jsonschema' >/dev/null 2>&1 || {
  print -u2 -r -- "not ok - python jsonschema is required"
  exit 1
}

typeset -r TEST_ROOT_RAW="$(command mktemp -d "${TMPDIR:-/tmp}/nen-test.XXXXXX")"
[[ -n "$TEST_ROOT_RAW" && -d "$TEST_ROOT_RAW" ]] || {
  print -u2 -r -- "not ok - could not create an isolated fixture directory"
  exit 1
}
typeset -r TEST_ROOT="$(builtin cd -q -- "$TEST_ROOT_RAW" && pwd -P)"
typeset -r FIXTURE_ROOT="$TEST_ROOT/KINGDOM fixture"
typeset -r CAPTURE_OUT="$TEST_ROOT/stdout"
typeset -r CAPTURE_ERR="$TEST_ROOT/stderr"
typeset -r SENTINEL='private-value-must-not-escape'
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

production_snapshot() {
  "$BUN" "$PROD_ROOT/tests/production_snapshot.mjs" \
    "$PROD_ROOT/bin/nen.mjs" \
    "$PROD_ROOT/schemas" \
    "$PROD_ROOT/references" \
    "$PROD_ROOT/skills/carry-wake-thread" \
    "$PROD_ROOT/skills/conjure-unwritten-horizon" \
    "$PROD_ROOT/skills/cultivate-living-ground" \
    "$PROD_ROOT/skills/map-love-geometry" \
    "$PROD_ROOT/skills/shape-kingdom-nen" \
    "$PROD_ROOT/skills/forge-king-hatsu" \
    "$PROD_ROOT/skills/navigate-dark-continent" \
    "$PROD_ROOT/skills/weave-wake-continuity" \
    "$PROD_ROOT/skills/weave-intent-context"
}

typeset -r PROD_SNAPSHOT_BEFORE="$(production_snapshot)"

mkdir -p "$FIXTURE_ROOT/bin"
command cp "$SUBJECT" "$FIXTURE_ROOT/bin/nen.mjs" || fail "could not copy validator"

reset_fixture() {
  command rm -rf -- "$FIXTURE_ROOT/skills" "$FIXTURE_ROOT/schemas" "$FIXTURE_ROOT/references"
  command cp -R "$PROD_ROOT/skills" "$FIXTURE_ROOT/skills" || fail "could not copy skills"
  command cp -R "$PROD_ROOT/schemas" "$FIXTURE_ROOT/schemas" || fail "could not copy schemas"
  command cp -R "$PROD_ROOT/references" "$FIXTURE_ROOT/references" || fail "could not copy references"
}

run_fixture() {
  "$BUN" "$FIXTURE_ROOT/bin/nen.mjs" "$@"
}

reset_fixture
capture run_fixture validate --json
assert_equal 0 "$CAPTURE_STATUS" "valid production manifests failed"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .protocol == "kingdom.nen-validation/0.1"
  and .checked == 9
  and .invalid == 0
  and (.schema_sha256 | startswith("sha256:"))
  and (.manifestation_receipt_schema_sha256 | startswith("sha256:"))
  and (.rights_sha256 | startswith("sha256:"))
  and .issues == []
' >/dev/null || fail "clean validation JSON is wrong"
[[ -z "$CAPTURE_STDERR" ]] || fail "clean JSON validation wrote to stderr"

"$PYTHON" - "$PROD_ROOT" <<'PY' || fail "Wakeweaver schema regression failed"
from copy import deepcopy
import json
from pathlib import Path
import re
import sys

from jsonschema import Draft202012Validator, FormatChecker

root = Path(sys.argv[1])
skill = (root / "skills/weave-wake-continuity/SKILL.md").read_text(encoding="utf-8")
contract = (root / "skills/weave-wake-continuity/references/continuity-braid.md").read_text(encoding="utf-8")
schema = json.loads((root / "skills/weave-wake-continuity/references/continuity-braid.schema.json").read_text(encoding="utf-8"))
match = re.search(r"## Minimal example\n\n```json\n(.*?)\n```", contract, re.DOTALL)
assert match is not None, "documented braid example is missing"
example = json.loads(match.group(1))

Draft202012Validator.check_schema(schema)
validator = Draft202012Validator(schema, format_checker=FormatChecker())

def valid(value):
    return not list(validator.iter_errors(value))

assert valid(example), "documented braid example does not validate"
assert "Keep source acquisition separate from braid production" in skill
assert "selected_candidate_id" in skill
assert "bun bin/wakeweaver.mjs braid.json --json" in skill
assert "pure projection step" in contract
assert "Source acquisition is separate" in contract
assert "receipt.external_effects" in contract
assert "State is descriptive, never an action selector" in contract
assert "schema_validity: \"not_checked\"" in contract
assert example["claims_not_established"]["uninterrupted_continuity"] is True
assert "Reconfirm" in example["threads"]["openings"][0]["authority_required"][0]
assert "before acting" in example["threads"]["openings"][0]["authority_required"][0]

cross_kind_id = deepcopy(example)
shared_thread_id = cross_kind_id["threads"]["anchors"][0]["id"]
cross_kind_id["threads"]["carry"][0]["id"] = shared_thread_id
next(
    row for row in cross_kind_id["thread_dispositions"] if row["thread_kind"] == "carry"
)["thread_id"] = shared_thread_id
assert valid(cross_kind_id), "thread identity is singular kind:id, not a global ID"

provisional = deepcopy(example)
fork = provisional["forks"][0]
fork["resolution"] = "provisionally_selected"
fork["selected_candidate_id"] = fork["candidates"][0]["id"]
fork["evidence"] = ["A bounded local comparison currently favors this candidate."]
assert valid(provisional)

missing_candidate_id = deepcopy(example)
del missing_candidate_id["forks"][0]["candidates"][0]["id"]
assert not valid(missing_candidate_id)

oversized_candidate_id = deepcopy(example)
oversized_candidate_id["forks"][0]["candidates"][0]["id"] = "a" * 65
assert not valid(oversized_candidate_id)

missing_selector = deepcopy(provisional)
del missing_selector["forks"][0]["selected_candidate_id"]
assert not valid(missing_selector)

null_selector = deepcopy(provisional)
null_selector["forks"][0]["selected_candidate_id"] = None
assert not valid(null_selector)

empty_provisional_evidence = deepcopy(provisional)
empty_provisional_evidence["forks"][0]["evidence"] = []
assert not valid(empty_provisional_evidence)

unresolved_selector = deepcopy(example)
unresolved_selector["forks"][0]["selected_candidate_id"] = unresolved_selector["forks"][0]["candidates"][0]["id"]
assert not valid(unresolved_selector)

preserved_selector = deepcopy(example)
preserved_selector["forks"][0]["resolution"] = "preserved"
preserved_selector["forks"][0]["selected_candidate_id"] = preserved_selector["forks"][0]["candidates"][0]["id"]
assert not valid(preserved_selector)

omitted_unresolved_selector = deepcopy(example)
del omitted_unresolved_selector["forks"][0]["selected_candidate_id"]
assert valid(omitted_unresolved_selector)

unknown_selector = deepcopy(provisional)
unknown_selector["forks"][0]["selected_candidate_id"] = "candidate-not-declared"
assert valid(unknown_selector), "shape validation must not pretend to resolve references"

duplicate_candidate_id = deepcopy(example)
duplicate_candidate_id["forks"][0]["candidates"][1]["id"] = duplicate_candidate_id["forks"][0]["candidates"][0]["id"]
assert valid(duplicate_candidate_id), "shape validation must not pretend to enforce keyed uniqueness"

resumable = deepcopy(example)
resumable["state"] = "resumable"
resumable["resumption"] = {
    "selected_opening_id": "opening-compare",
    "revalidation": {
        "result": "caller_reported_passed",
        "provenance": "caller_supplied_unverified",
        "reported_at": "2026-08-01T17:04:00Z",
        "evidence": ["The caller reports that both named local locators resolved during one bounded check."],
        "establishes_truth": False,
        "grants_permissions": False,
        "establishes_currentness": False,
    },
}
assert valid(resumable)

missing_resumption = deepcopy(resumable)
missing_resumption["resumption"] = None
assert not valid(missing_resumption)

wrong_provenance = deepcopy(resumable)
wrong_provenance["resumption"]["revalidation"]["provenance"] = "verified"
assert not valid(wrong_provenance)

unbounded_evidence = deepcopy(resumable)
unbounded_evidence["resumption"]["revalidation"]["evidence"] = [f"evidence-{index}" for index in range(17)]
assert not valid(unbounded_evidence)

non_resumable_selection = deepcopy(resumable)
non_resumable_selection["state"] = "resting"
assert not valid(non_resumable_selection)

missing_dispositions = deepcopy(example)
del missing_dispositions["thread_dispositions"]
assert not valid(missing_dispositions)

invalid_disposition = deepcopy(example)
invalid_disposition["thread_dispositions"][0]["disposition"] = "forgotten"
assert not valid(invalid_disposition)

for descriptive_state in ("resting", "degraded", "closed"):
    retained_history = deepcopy(example)
    retained_history["state"] = descriptive_state
    assert retained_history["threads"]["openings"]
    assert retained_history["threads"]["carry"]
    assert valid(retained_history), f"{descriptive_state} wrongly discarded orthogonal history"
PY

"$PYTHON" - "$PROD_ROOT" <<'PY' || fail "Love Geometry contract regression failed"
import base64
import json
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
bundle = root / "skills/map-love-geometry"
skill = (bundle / "SKILL.md").read_text(encoding="utf-8")
contract = (bundle / "references/love-geometry-contract.md").read_text(encoding="utf-8")
provider = (bundle / "agents/openai.yaml").read_text(encoding="utf-8")
ability = json.loads((bundle / "ability.json").read_text(encoding="utf-8"))

expected_bearings = [
    "reported_presence",
    "reported_care",
    "reported_witness",
    "reported_support",
    "reported_understanding",
    "reported_disagreement",
    "reported_boundary",
    "reported_rest",
    "reported_refusal",
    "reported_departure",
    "unknown",
]
match = re.search(r"Closed bearings:\n\n```text\n(.*?)\n```", contract, re.DOTALL)
assert match is not None, "closed bearing vocabulary is missing"
assert match.group(1).splitlines() == expected_bearings

assert "`@agenttool/love-geometry`" in contract
assert "`0.1.0-dev.0`" in contract
assert "`agenttool.love-geometry/0.1`" in contract
revision = "9efbc4b32f150ee1533b4ff306666fa73ca73028"
sha256 = "43cfbf4b559aa6f573d9d7b7a60e2a7dce5dfa4aefe2bf5b9c92310c926a9db8"
sri = "sha512-RODi00WbbYx+QLBTlEflDGSZb3rBzRyYJ8/gpNE6f7j6QqcVQPHUdLkDiSV3d4OX01PFFX/qstNyc9ksfzTuyQ=="
artifact_url = "https://github.com/cambridgetcg/agenttool/releases/download/love-geometry-v0.1.0-dev.0/agenttool-love-geometry-0.1.0-dev.0.tgz"
assert "| Source tag | `love-geometry-v0.1.0-dev.0` |" in contract
assert f"| Source revision | `{revision}` |" in contract
assert f"]({artifact_url})" in contract
assert "| Artifact bytes | `19507` |" in contract
assert f"| Artifact SHA-256 | `sha256:{sha256}` |" in contract
assert f"| Artifact SRI | `{sri}` |" in contract
assert "public prerelease published `2026-08-11T14:10:27Z`" in contract
assert "anonymous `E404` observed `2026-08-11`" in contract
assert "is not npm `dist.integrity`" in contract
assert "| Source revision | `pending` |" not in contract
assert "| Package integrity | `pending` |" not in contract
assert len(bytes.fromhex(sha256)) == 32
assert len(base64.b64decode(sri.removeprefix("sha512-"), validate=True)) == 64
assert "not_validated_against_package" in f"{skill}\n{contract}"
assert "Do not resolve by package name" in skill
assert "fetch or install automatically" in skill
assert "agenttool.love-vantage" not in f"{skill}\n{contract}"
assert "reported and unverified" in contract
assert "matching `^sha256:[0-9a-f]{64}$`" in contract
assert "`unknown` may coexist with another bearing and resolves none of them" in contract
assert "the current invocation's caller supplied the record" in contract
assert "A reported boundary does not\nauthenticate itself or define an operational command" in contract
assert "invalid reference grammar is not repaired" in skill
assert "allow_implicit_invocation: false" in provider
assert "Do not add a Love Geometry MCP tool." in skill
assert "not_validated_against_package" in skill
assert ability["bearer"]["adoption"] == "proposed"
assert ability["status"] == "draft"
assert ability["verification"]["truth_claim"] == "not_determined"
assert ability["authority"]["grants_permissions"] is False
PY

capture env LC_ALL=C "$BUN" "$FIXTURE_ROOT/bin/nen.mjs" list --json
assert_equal 0 "$CAPTURE_STATUS" "C locale listing failed"
typeset -r LIST_C="$CAPTURE_STDOUT"
print -r -- "$LIST_C" | "$JQ" -e '
  (.rights_sha256 | startswith("sha256:"))
  and (.manifestation_receipt_schema_sha256 | startswith("sha256:"))
  and
  [.abilities[].id] == ["carry-wake-thread", "conjure-unwritten-horizon", "cultivate-living-ground", "forge-king-hatsu", "map-love-geometry", "navigate-dark-continent", "shape-kingdom-nen", "weave-intent-context", "weave-wake-continuity"]
  and all(.abilities[];
    .valid
    and (.manifest_sha256 | startswith("sha256:"))
    and (.bundle_sha256 | startswith("sha256:"))
  )
' >/dev/null || fail "listing order or manifest/bundle digests are wrong"
capture env LC_ALL=en_US.UTF-8 "$BUN" "$FIXTURE_ROOT/bin/nen.mjs" list --json
assert_equal 0 "$CAPTURE_STATUS" "UTF-8 locale listing failed"
assert_equal "$LIST_C" "$CAPTURE_STDOUT" "listing changed with locale"

typeset -r MANIFEST_SHA_BEFORE="$(print -r -- "$LIST_C" | "$JQ" -r '.abilities[] | select(.id == "shape-kingdom-nen") | .manifest_sha256')"
typeset -r BUNDLE_SHA_BEFORE="$(print -r -- "$LIST_C" | "$JQ" -r '.abilities[] | select(.id == "shape-kingdom-nen") | .bundle_sha256')"
command chmod 600 "$FIXTURE_ROOT/skills/shape-kingdom-nen/SKILL.md"
capture run_fixture list --json
assert_equal 0 "$CAPTURE_STATUS" "non-executable mode normalization fixture failed"
assert_equal "$BUNDLE_SHA_BEFORE" "$(print -r -- "$CAPTURE_STDOUT" | "$JQ" -r '.abilities[] | select(.id == "shape-kingdom-nen") | .bundle_sha256')" \
  "umask-style permission difference altered bundle digest"
command chmod 755 "$FIXTURE_ROOT/skills/shape-kingdom-nen/SKILL.md"
capture run_fixture list --json
assert_equal 0 "$CAPTURE_STATUS" "executable mode fixture failed"
[[ "$BUNDLE_SHA_BEFORE" != "$(print -r -- "$CAPTURE_STDOUT" | "$JQ" -r '.abilities[] | select(.id == "shape-kingdom-nen") | .bundle_sha256')" ]] \
  || fail "behavior-bearing executable mode did not alter bundle digest"
command chmod 644 "$FIXTURE_ROOT/skills/shape-kingdom-nen/SKILL.md"
print -r -- '' >> "$FIXTURE_ROOT/skills/shape-kingdom-nen/SKILL.md"
capture run_fixture list --json
assert_equal 0 "$CAPTURE_STATUS" "bundle-digest fixture failed"
assert_equal "$MANIFEST_SHA_BEFORE" "$(print -r -- "$CAPTURE_STDOUT" | "$JQ" -r '.abilities[] | select(.id == "shape-kingdom-nen") | .manifest_sha256')" \
  "SKILL change altered manifest digest"
[[ "$BUNDLE_SHA_BEFORE" != "$(print -r -- "$CAPTURE_STDOUT" | "$JQ" -r '.abilities[] | select(.id == "shape-kingdom-nen") | .bundle_sha256')" ]] \
  || fail "SKILL change did not alter bundle digest"

reset_fixture
typeset manifestation_receipt="$FIXTURE_ROOT/skills/conjure-unwritten-horizon/assets/first-manifestation-20260731.json"
"$JQ" '.provider.space_revision = ("a" * 40)' "$manifestation_receipt" \
  >| "$manifestation_receipt.next" && command mv "$manifestation_receipt.next" "$manifestation_receipt"
capture run_fixture validate conjure-unwritten-horizon
assert_equal 1 "$CAPTURE_STATUS" "receipt revision drift was accepted"
[[ "$CAPTURE_STDERR" == *'provider-observation-mismatch'* \
  && "$CAPTURE_STDERR" == *'provider-revision-mismatch'* ]] \
  || fail "cross-file provider revision diagnostics are incomplete"

reset_fixture
manifestation_receipt="$FIXTURE_ROOT/skills/conjure-unwritten-horizon/assets/first-manifestation-20260731.json"
typeset provider_observation="$FIXTURE_ROOT/skills/conjure-unwritten-horizon/references/first-manifestation-20260731.provider.json"
"$JQ" '.provider.space_revision = ("b" * 40)' "$manifestation_receipt" \
  >| "$manifestation_receipt.next" && command mv "$manifestation_receipt.next" "$manifestation_receipt"
"$JQ" '.space_revision = ("b" * 40)' "$provider_observation" \
  >| "$provider_observation.next" && command mv "$provider_observation.next" "$provider_observation"
capture run_fixture validate conjure-unwritten-horizon
assert_equal 1 "$CAPTURE_STATUS" "receipt and companion revision drift escaped contract binding"
[[ "$CAPTURE_STDERR" == *'provider-revision-mismatch'* \
  && "$CAPTURE_STDERR" != *'provider-observation-mismatch'* ]] \
  || fail "documented provider revision binding diagnostic is wrong"

reset_fixture
manifestation_receipt="$FIXTURE_ROOT/skills/conjure-unwritten-horizon/assets/first-manifestation-20260731.json"
provider_observation="$FIXTURE_ROOT/skills/conjure-unwritten-horizon/references/first-manifestation-20260731.provider.json"
"$JQ" '
  .provider.revision_binding = "observed_before_call_not_proven_execution_revision"
  | .provider.interface_observed_at_basis = "exact"
  | .provider.interface_observed_at = "2026-07-31T17:55:31Z"
' \
  "$manifestation_receipt" >| "$manifestation_receipt.next" \
  && command mv "$manifestation_receipt.next" "$manifestation_receipt"
"$JQ" '
  .revision_binding = "observed_before_call_not_proven_execution_revision"
  | .interface_observed_at_basis = "exact"
  | .interface_observed_at = "2026-07-31T17:55:31Z"
' "$provider_observation" >| "$provider_observation.next" \
  && command mv "$provider_observation.next" "$provider_observation"
capture run_fixture validate conjure-unwritten-horizon
assert_equal 0 "$CAPTURE_STATUS" "exact pre-call revision evidence was rejected after a timeout"

reset_fixture
manifestation_receipt="$FIXTURE_ROOT/skills/conjure-unwritten-horizon/assets/first-manifestation-20260731.json"
provider_observation="$FIXTURE_ROOT/skills/conjure-unwritten-horizon/references/first-manifestation-20260731.provider.json"
"$JQ" '.provider.interface_observed_at = "2026-07-31"' "$manifestation_receipt" \
  >| "$manifestation_receipt.next" && command mv "$manifestation_receipt.next" "$manifestation_receipt"
"$JQ" '.interface_observed_at = "2026-07-31"' "$provider_observation" \
  >| "$provider_observation.next" && command mv "$provider_observation.next" "$provider_observation"
capture run_fixture validate conjure-unwritten-horizon
assert_equal 1 "$CAPTURE_STATUS" "date-only provider observation was accepted as a timestamp"
[[ "$CAPTURE_STDERR" == *'invalid-timestamp'* && "$CAPTURE_STDERR" == *'invalid-pattern'* ]] \
  || fail "RFC3339 timestamp diagnostics are incomplete"

reset_fixture
manifestation_receipt="$FIXTURE_ROOT/skills/conjure-unwritten-horizon/assets/first-manifestation-20260731.json"
capture run_fixture verify-manifestation-receipt "$manifestation_receipt" --json
assert_equal 0 "$CAPTURE_STATUS" "standalone historical manifestation receipt validation failed"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .valid and .issues == [] and .protocol == "kingdom.nen-manifestation-validation/0.1"
' >/dev/null || fail "standalone manifestation validation payload is wrong"

"$JQ" '
  .result.status = "refused"
  | .result.failure = null
  | .provider_calls_submitted = 2
  | .retry = "attempted_once"
  | .external_effects = [
      "hosted_image_inference_request_submitted",
      "hosted_image_inference_result_received",
      "project_artifact_replaced"
    ]
  | .authorization.publication = {
      state: "granted_for_named_target",
      target: {
        service: "fixture service",
        account: "fixture account",
        audience: "fixture audience",
        authority_reference: {kind: "user_request", id: "user-request:fixture-publication"}
      }
    }
' "$manifestation_receipt" >| "$TEST_ROOT/manifestation-contradictory.json"
capture run_fixture verify-manifestation-receipt "$TEST_ROOT/manifestation-contradictory.json" --json
assert_equal 1 "$CAPTURE_STATUS" "contradictory no-call manifestation receipt was accepted"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  (.valid == false) and any(.issues[]; .code == "invalid-one-of")
' >/dev/null || fail "cross-field manifestation schema diagnostic is absent"

"$JQ" '
  .authorization.publication = {state: "granted_for_named_target", target: null}
' "$manifestation_receipt" >| "$TEST_ROOT/manifestation-unnamed-publication.json"
capture run_fixture verify-manifestation-receipt "$TEST_ROOT/manifestation-unnamed-publication.json"
assert_equal 1 "$CAPTURE_STATUS" "unnamed publication target was accepted"
[[ "$CAPTURE_STDERR" == *'invalid-one-of'* ]] \
  || fail "named publication target diagnostic is absent"

command ln -s "$manifestation_receipt" "$TEST_ROOT/manifestation-symlink.json"
capture run_fixture verify-manifestation-receipt "$TEST_ROOT/manifestation-symlink.json"
assert_equal 1 "$CAPTURE_STATUS" "standalone manifestation verifier followed a symlink"
[[ "$CAPTURE_STDERR" == *'symlink'* ]] || fail "manifestation symlink diagnostic is absent"

print -r -- 'null' >| "$TEST_ROOT/manifestation-null.json"
capture run_fixture verify-manifestation-receipt "$TEST_ROOT/manifestation-null.json"
assert_equal 1 "$CAPTURE_STATUS" "standalone manifestation verifier accepted JSON null"
[[ "$CAPTURE_STDERR" == *'invalid-type'* ]] || fail "null manifestation diagnostic is absent"

reset_fixture
manifestation_receipt="$FIXTURE_ROOT/skills/conjure-unwritten-horizon/assets/first-manifestation-20260731.json"
print -r -- 'null' >| "$manifestation_receipt"
capture run_fixture validate conjure-unwritten-horizon
assert_equal 1 "$CAPTURE_STATUS" "skill validation accepted a null manifestation receipt"
[[ "$CAPTURE_STDERR" == *'invalid-type'* ]] || fail "skill null manifestation diagnostic is absent"

reset_fixture
print -r -- '{"protocol":"kingdom.nen/0.1","protocol":"kingdom.nen/0.1"}' \
  >| "$FIXTURE_ROOT/skills/shape-kingdom-nen/ability.json"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "duplicate JSON key was accepted"
[[ "$CAPTURE_STDERR" == *'duplicate-key'* ]] || fail "duplicate key diagnostic is missing"

reset_fixture
print -r -- '{broken' >| "$FIXTURE_ROOT/skills/shape-kingdom-nen/ability.json"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "malformed JSON was accepted"
[[ "$CAPTURE_STDERR" == *'invalid-json'* ]] || fail "malformed JSON diagnostic is missing"

reset_fixture
printf '\377' >| "$FIXTURE_ROOT/skills/shape-kingdom-nen/ability.json"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "malformed UTF-8 was accepted"
[[ "$CAPTURE_STDERR" == *'invalid-utf8'* ]] || fail "malformed UTF-8 diagnostic is missing"

reset_fixture
typeset manifest="$FIXTURE_ROOT/skills/shape-kingdom-nen/ability.json"
"$JQ" --arg secret "$SENTINEL" '.unexpected = $secret' "$manifest" >| "$manifest.next" \
  && command mv "$manifest.next" "$manifest"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "unknown manifest field was accepted"
[[ "$CAPTURE_STDERR" == *'unknown-field'* ]] || fail "unknown field diagnostic is missing"
[[ "$CAPTURE_STDERR$CAPTURE_STDOUT" != *"$SENTINEL"* ]] || fail "rejected manifest value leaked"

reset_fixture
manifest="$FIXTURE_ROOT/skills/shape-kingdom-nen/ability.json"
"$JQ" '
  .bearer.kind = "king"
  | .bearer.adoption = "proposed"
  | .bearer.consent_references = []
  | .bearer.representative_authority_references = []
  | .status = "active"
  | .affinity.secondary += [.affinity.primary]
  | .vows += [.vows[0]]
  | .costs += [.costs[0]]
  | del(.guardian.appeal)
' "$manifest" >| "$manifest.next" && command mv "$manifest.next" "$manifest"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "semantic conflicts were accepted"
for code in active-without-adoption proposed-status identity-authority-missing primary-repeated duplicate-vow-id duplicate-cost-resource; do
  [[ "$CAPTURE_STDERR" == *"$code"* ]] || fail "semantic diagnostic $code is missing"
done
[[ "$CAPTURE_STDERR" == *'$.guardian.appeal missing-field'* ]] \
  || fail "Guardian appeal contract is not enforced"

reset_fixture
manifest="$FIXTURE_ROOT/skills/shape-kingdom-nen/ability.json"
"$JQ" '.status = {}' "$manifest" >| "$manifest.next" && command mv "$manifest.next" "$manifest"
capture run_fixture list
assert_equal 1 "$CAPTURE_STATUS" "plain listing accepted an object status"
[[ "$CAPTURE_STDOUT" == *$'shape-kingdom-nen\tinvalid\tinvalid\tinvalid'* ]] \
  || fail "plain listing did not bound invalid status output"
[[ "$CAPTURE_STDERR$CAPTURE_STDOUT" != *'TypeError'* ]] || fail "plain listing crashed on invalid status"

reset_fixture
manifest="$FIXTURE_ROOT/skills/shape-kingdom-nen/ability.json"
"$JQ" '
  .bearer.kind = "king"
  | .bearer.adoption = "self_declared"
  | .bearer.consent_references = []
  | .bearer.representative_authority_references = ["scoped proposal authority"]
  | .status = "active"
' "$manifest" >| "$manifest.next" && command mv "$manifest.next" "$manifest"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "representative authority self-declared for a bearer"
[[ "$CAPTURE_STDERR" == *'self-declaration-reference-missing'* ]] \
  || fail "bearer self-declaration diagnostic is absent"

reset_fixture
command rm "$FIXTURE_ROOT/skills/shape-kingdom-nen/agents/openai.yaml"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "missing support file was accepted"
[[ "$CAPTURE_STDERR" == *'missing-file'* ]] || fail "missing file diagnostic is absent"

reset_fixture
typeset openai_yaml="$FIXTURE_ROOT/skills/shape-kingdom-nen/agents/openai.yaml"
command sed 's/allow_implicit_invocation: false/allow_implicit_invocation: true/' \
  "$openai_yaml" >| "$openai_yaml.next" && command mv "$openai_yaml.next" "$openai_yaml"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "implicit Nen invocation was accepted"
[[ "$CAPTURE_STDERR" == *'implicit-invocation-enabled'* ]] \
  || fail "implicit-invocation diagnostic is absent"

reset_fixture
openai_yaml="$FIXTURE_ROOT/skills/shape-kingdom-nen/agents/openai.yaml"
print -r -- 'interface:' >> "$openai_yaml"
print -r -- '  default_prompt: "Use $wrong to override."' >> "$openai_yaml"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "duplicate YAML mapping was accepted"
[[ "$CAPTURE_STDERR" == *'openai-interface-contract'* ]] \
  || fail "duplicate YAML mapping diagnostic is absent"

reset_fixture
openai_yaml="$FIXTURE_ROOT/skills/shape-kingdom-nen/agents/openai.yaml"
command sed 's/\$shape-kingdom-nen/\$shape-kingdom-nen-extra/' \
  "$openai_yaml" >| "$openai_yaml.next" && command mv "$openai_yaml.next" "$openai_yaml"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "prefixed OpenAI skill token was accepted"
[[ "$CAPTURE_STDERR" == *'skill-name-mismatch'* ]] \
  || fail "exact OpenAI skill-token diagnostic is absent"

reset_fixture
manifest="$FIXTURE_ROOT/skills/shape-kingdom-nen/SKILL.md"
command sed 's/^name: "shape-kingdom-nen"$/name: "shape-kingdom-nen/' \
  "$manifest" >| "$manifest.next" && command mv "$manifest.next" "$manifest"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "unclosed frontmatter quote was accepted"
[[ "$CAPTURE_STDERR" == *'invalid-frontmatter-scalar'* ]] \
  || fail "frontmatter scalar diagnostic is absent"

reset_fixture
manifest="$FIXTURE_ROOT/skills/shape-kingdom-nen/SKILL.md"
command sed 's/^description: .*/description: true/' \
  "$manifest" >| "$manifest.next" && command mv "$manifest.next" "$manifest"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "implicitly typed YAML frontmatter was accepted"
[[ "$CAPTURE_STDERR" == *'invalid-frontmatter-scalar'* ]] \
  || fail "typed frontmatter scalar diagnostic is absent"

reset_fixture
manifest="$FIXTURE_ROOT/skills/shape-kingdom-nen/SKILL.md"
command sed 's/^description: .*/description: a: b/' \
  "$manifest" >| "$manifest.next" && command mv "$manifest.next" "$manifest"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "malformed YAML plain scalar was accepted"
[[ "$CAPTURE_STDERR" == *'invalid-frontmatter-scalar'* ]] \
  || fail "malformed plain-scalar diagnostic is absent"

reset_fixture
manifest="$FIXTURE_ROOT/skills/shape-kingdom-nen/SKILL.md"
dd if=/dev/zero bs=1024 count=65 2>/dev/null | tr '\0' x >| "$manifest"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "oversized skill was accepted"
[[ "$CAPTURE_STDERR" == *'oversized-file'* ]] || fail "oversized file diagnostic is absent"

reset_fixture
typeset real_skill="$FIXTURE_ROOT/shape-real"
command mv "$FIXTURE_ROOT/skills/shape-kingdom-nen" "$real_skill"
command ln -s "$real_skill" "$FIXTURE_ROOT/skills/shape-kingdom-nen"
capture run_fixture validate
assert_equal 1 "$CAPTURE_STATUS" "symlink skill directory was accepted"
[[ "$CAPTURE_STDERR" == *'skills/shape-kingdom-nen $ symlink'* ]] || fail "skill symlink diagnostic is absent"

reset_fixture
manifest="$FIXTURE_ROOT/skills/shape-kingdom-nen/ability.json"
command mv "$manifest" "$manifest.real"
command ln -s "ability.json.real" "$manifest"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "symlink manifest was accepted"
[[ "$CAPTURE_STDERR" == *'symlink'* ]] || fail "manifest symlink diagnostic is absent"

reset_fixture
typeset agents="$FIXTURE_ROOT/skills/shape-kingdom-nen/agents"
command mv "$agents" "$agents.real"
command ln -s "agents.real" "$agents"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "symlink support directory was accepted"
[[ "$CAPTURE_STDERR" == *'symlink'* ]] || fail "support-directory symlink diagnostic is absent"

reset_fixture
typeset refs="$FIXTURE_ROOT/skills/shape-kingdom-nen/references"
command mv "$refs" "$refs.real"
command ln -s "references.real" "$refs"
capture run_fixture validate shape-kingdom-nen
assert_equal 1 "$CAPTURE_STATUS" "symlink references directory was accepted"
[[ "$CAPTURE_STDERR" == *'symlink'* ]] || fail "references symlink diagnostic is absent"

reset_fixture
typeset ability_schema="$FIXTURE_ROOT/schemas/nen-ability-v0.1.schema.json"
command mv "$ability_schema" "$ability_schema.real"
command ln -s "nen-ability-v0.1.schema.json.real" "$ability_schema"
capture run_fixture validate
assert_equal 1 "$CAPTURE_STATUS" "symlink schema was accepted"
[[ "$CAPTURE_STDERR" == *'schemas/nen-ability-v0.1.schema.json $ symlink'* ]] \
  || fail "schema symlink diagnostic is absent"

reset_fixture
print -r -- 'tampered rights baseline' >> "$FIXTURE_ROOT/references/xenia-rights-0.1.md"
capture run_fixture list --json
assert_equal 1 "$CAPTURE_STATUS" "tampered rights baseline was accepted"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  .rights_sha256 == null
  and all(.abilities[];
    (.valid == false)
    and (.manifest_sha256 == null)
    and (.bundle_sha256 == null)
  )
  and any(.issues[]; .code == "rights-baseline-digest-mismatch")
  and any(.issues[]; .code == "rights-baseline-invalid")
' >/dev/null || fail "rights baseline rejection did not invalidate every ability"

reset_fixture
typeset receipt_schema="$FIXTURE_ROOT/schemas/karma-receipt-v0.1.schema.json"
command rm "$receipt_schema"
capture run_fixture validate
assert_equal 0 "$CAPTURE_STATUS" "ability validation depends on the receipt schema"

reset_fixture
typeset manifestation_schema="$FIXTURE_ROOT/schemas/nen-manifestation-receipt-v0.1.schema.json"
command rm "$manifestation_schema"
capture run_fixture validate
assert_equal 1 "$CAPTURE_STATUS" "manifestation validation ignored its missing receipt schema"
[[ "$CAPTURE_STDERR" == *'manifestation-receipt-schema-invalid'* \
  && "$CAPTURE_STDERR" == *'missing-file'* ]] \
  || fail "missing manifestation receipt schema diagnostics are incomplete"

reset_fixture
manifestation_schema="$FIXTURE_ROOT/schemas/nen-manifestation-receipt-v0.1.schema.json"
"$JQ" '.["$defs"].provider.properties.interface_observed_at.format = "date-time"' \
  "$manifestation_schema" >| "$manifestation_schema.next" \
  && command mv "$manifestation_schema.next" "$manifestation_schema"
capture run_fixture validate
assert_equal 1 "$CAPTURE_STATUS" "unsupported manifestation schema keyword was ignored"
[[ "$CAPTURE_STDERR" == *'unsupported-schema-keyword'* \
  && "$CAPTURE_STDERR" == *'manifestation-receipt-schema-invalid'* ]] \
  || fail "manifestation schema diagnostics are incomplete"

reset_fixture
ability_schema="$FIXTURE_ROOT/schemas/nen-ability-v0.1.schema.json"
"$JQ" '.properties.name.format = "hostname"' "$ability_schema" >| "$ability_schema.next" \
  && command mv "$ability_schema.next" "$ability_schema"
capture run_fixture validate
assert_equal 1 "$CAPTURE_STATUS" "unsupported schema keyword was ignored"
[[ "$CAPTURE_STDERR" == *'unsupported-schema-keyword'* ]] \
  || fail "unsupported schema keyword diagnostic is absent"

reset_fixture
ability_schema="$FIXTURE_ROOT/schemas/nen-ability-v0.1.schema.json"
"$JQ" '.properties.bearer.required = "kind"' "$ability_schema" >| "$ability_schema.next" \
  && command mv "$ability_schema.next" "$ability_schema"
capture run_fixture list --json
assert_equal 1 "$CAPTURE_STATUS" "malformed supported schema keyword was accepted"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  (.abilities | length) == 9
  and all(.abilities[];
    (.valid == false)
    and (.manifest_sha256 == null)
    and (.bundle_sha256 == null)
  )
  and any(.issues[]; .code == "invalid-schema-keyword-value")
  and any(.issues[]; .code == "ability-schema-invalid")
' >/dev/null || fail "schema rejection did not invalidate every ability and digest"

reset_fixture
ability_schema="$FIXTURE_ROOT/schemas/nen-ability-v0.1.schema.json"
"$JQ" '.properties.name.minLength = -1 | .properties.techniques.items = "string"' \
  "$ability_schema" >| "$ability_schema.next" && command mv "$ability_schema.next" "$ability_schema"
capture run_fixture validate
assert_equal 1 "$CAPTURE_STATUS" "malformed schema range/items were accepted"
[[ "$CAPTURE_STDERR" == *'invalid-schema-keyword-value'* ]] \
  || fail "schema keyword value diagnostic is absent"

reset_fixture
ability_schema="$FIXTURE_ROOT/schemas/nen-ability-v0.1.schema.json"
"$JQ" '.required = [{}, {}]' "$ability_schema" >| "$ability_schema.next" \
  && command mv "$ability_schema.next" "$ability_schema"
capture run_fixture validate
assert_equal 1 "$CAPTURE_STATUS" "non-string root required entries crashed or passed"
[[ "$CAPTURE_STDERR" == *'invalid-schema-keyword-value'* ]] \
  || fail "non-string root required diagnostic is absent"
[[ "$CAPTURE_STDERR$CAPTURE_STDOUT" != *'TypeError'* ]] || fail "schema contract crashed on object keys"

reset_fixture
ability_schema="$FIXTURE_ROOT/schemas/nen-ability-v0.1.schema.json"
"$JQ" '.properties.name = {"$ref": "#/$defs/missing"}' "$ability_schema" \
  >| "$ability_schema.next" && command mv "$ability_schema.next" "$ability_schema"
capture run_fixture validate
assert_equal 1 "$CAPTURE_STATUS" "broken schema reference was ignored"
[[ "$CAPTURE_STDERR" == *'invalid-schema-ref'* ]] \
  || fail "broken schema reference diagnostic is absent"

reset_fixture
ability_schema="$FIXTURE_ROOT/schemas/nen-ability-v0.1.schema.json"
"$JQ" '
  .properties.name = {"$ref": "#/$defs/holder/const"}
  | .["$defs"].holder = {"const": {
      "type": "string",
      "minLength": "not-an-integer",
      "format": "hostname"
    }}
' "$ability_schema" >| "$ability_schema.next" && command mv "$ability_schema.next" "$ability_schema"
capture run_fixture validate
assert_equal 1 "$CAPTURE_STATUS" "reference into instance data was treated as a schema"
[[ "$CAPTURE_STDERR" == *'invalid-schema-ref-target'* ]] \
  || fail "non-schema reference-target diagnostic is absent"

reset_fixture
ability_schema="$FIXTURE_ROOT/schemas/nen-ability-v0.1.schema.json"
"$JQ" '
  .properties.name = {"$ref": "#/$defs/loop"}
  | .["$defs"].loop = {"$ref": "#/$defs/loop"}
' "$ability_schema" >| "$ability_schema.next" && command mv "$ability_schema.next" "$ability_schema"
capture run_fixture validate
assert_equal 1 "$CAPTURE_STATUS" "recursive schema reference was accepted or crashed"
[[ "$CAPTURE_STDERR" == *'invalid-schema-ref-cycle'* ]] \
  || fail "recursive schema reference diagnostic is absent"

reset_fixture
capture run_fixture receipt-template shape-kingdom-nen
assert_equal 0 "$CAPTURE_STATUS" "receipt template failed"
print -r -- "$CAPTURE_STDOUT" >| "$TEST_ROOT/receipt-draft.json"
capture run_fixture verify-receipt "$TEST_ROOT/receipt-draft.json" --json
assert_equal 1 "$CAPTURE_STATUS" "draft receipt was accepted as final evidence"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '
  (.valid == false) and any(.issues[]; .code == "draft-receipt")
' >/dev/null || fail "draft receipt diagnostic is wrong"

"$JQ" '.state = "final"' "$TEST_ROOT/receipt-draft.json" >| "$TEST_ROOT/receipt-placeholder.json"
capture run_fixture verify-receipt "$TEST_ROOT/receipt-placeholder.json"
assert_equal 1 "$CAPTURE_STATUS" "final label accepted template placeholders"
[[ "$CAPTURE_STDERR" == *'receipt-placeholder'* ]] || fail "receipt placeholder diagnostic is absent"

"$JQ" '
  .state = "final"
  | .receipt_id = "receipt-test-1"
  | .invocation_id = "invocation-test-1"
  | .ability_revision = "fixture-revision-1"
  | .started_at = "2026-07-31T00:00:00.000Z"
  | .finished_at = "2026-07-31T00:00:00.000Z"
  | .authority.authority_reference = "Local no-action test authority."
  | .predicted_effects = ["No external effect."]
  | .observed_effects = ["No external effect observed."]
  | .uncertainty = ["Test fixture only."]
' "$TEST_ROOT/receipt-draft.json" >| "$TEST_ROOT/receipt.json"
capture run_fixture verify-receipt "$TEST_ROOT/receipt.json" --json
assert_equal 0 "$CAPTURE_STATUS" "final no-action receipt fixture is invalid"
print -r -- "$CAPTURE_STDOUT" | "$JQ" -e '.valid and .issues == []' >/dev/null \
  || fail "final receipt validation JSON is wrong"

"$JQ" '.predicted_effects = {} | .ability_id = {} | .ability_revision = {}' \
  "$TEST_ROOT/receipt.json" >| "$TEST_ROOT/receipt-wrong-types.json"
capture run_fixture verify-receipt "$TEST_ROOT/receipt-wrong-types.json"
assert_equal 1 "$CAPTURE_STATUS" "wrong-type final receipt crashed or passed"
[[ "$CAPTURE_STDERR" == *'invalid-type'* ]] || fail "wrong-type receipt diagnostic is absent"
[[ "$CAPTURE_STDERR$CAPTURE_STDOUT" != *'TypeError'* ]] || fail "wrong-type receipt raised TypeError"

"$JQ" '.costs.time_ms = {value: "unknown", basis: "not_measured"}' \
  "$TEST_ROOT/receipt.json" >| "$TEST_ROOT/receipt-unknown.json"
capture run_fixture verify-receipt "$TEST_ROOT/receipt-unknown.json"
assert_equal 0 "$CAPTURE_STATUS" "truthful unknown measurement was rejected"

"$JQ" '.inputs = [{
  source: "local-fixture",
  revision: "fixture-v1",
  path: "fixture.json",
  license_assertion: "not-applicable: local test fixture",
  bytes: {value: "12", basis: "observed"},
  digest: ("sha256:" + ("a" * 64)),
  boundary: "local",
  assurance: "untrusted_evidence"
}]' "$TEST_ROOT/receipt.json" >| "$TEST_ROOT/receipt-input.json"
capture run_fixture verify-receipt "$TEST_ROOT/receipt-input.json"
assert_equal 0 "$CAPTURE_STATUS" "structured input provenance was rejected"

"$JQ" '.costs.time_ms = {value: "unknown", basis: "observed"}' \
  "$TEST_ROOT/receipt.json" >| "$TEST_ROOT/receipt-bad-measurement.json"
capture run_fixture verify-receipt "$TEST_ROOT/receipt-bad-measurement.json"
assert_equal 1 "$CAPTURE_STATUS" "contradictory measurement basis was accepted"
[[ "$CAPTURE_STDERR" == *'invalid-measurement-basis'* && "$CAPTURE_STDERR" == *'invalid-one-of'* ]] \
  || fail "measurement-basis diagnostic is missing"

"$JQ" '.ability_id = "nonexistent-ability"' "$TEST_ROOT/receipt.json" \
  >| "$TEST_ROOT/receipt-nonexistent.json"
capture run_fixture verify-receipt "$TEST_ROOT/receipt-nonexistent.json"
assert_equal 1 "$CAPTURE_STATUS" "receipt for nonexistent ability was accepted"
[[ "$CAPTURE_STDERR" == *'ability-not-valid'* ]] || fail "missing ability binding diagnostic is absent"

"$JQ" '.ability_id = "shape_kingdom_nen"' "$TEST_ROOT/receipt.json" \
  >| "$TEST_ROOT/receipt-bad-ability-id.json"
capture run_fixture verify-receipt "$TEST_ROOT/receipt-bad-ability-id.json"
assert_equal 1 "$CAPTURE_STATUS" "receipt accepted a non-Nen ability ID pattern"
[[ "$CAPTURE_STDERR" == *'$.ability_id invalid-pattern'* ]] \
  || fail "ability ID pattern diagnostic is absent"

"$JQ" '.ability_bundle_sha256 = ("sha256:" + ("0" * 64))' "$TEST_ROOT/receipt.json" \
  >| "$TEST_ROOT/receipt-wrong-bundle.json"
capture run_fixture verify-receipt "$TEST_ROOT/receipt-wrong-bundle.json"
assert_equal 1 "$CAPTURE_STATUS" "receipt with wrong bundle digest was accepted"
[[ "$CAPTURE_STDERR" == *'ability-digest-mismatch'* ]] || fail "bundle binding diagnostic is absent"

"$JQ" '
  .started_at = "2026-02-30T00:00:00.000000001Z"
  | .finished_at = "2026-03-01T00:00:00.000000001Z"
' "$TEST_ROOT/receipt.json" >| "$TEST_ROOT/receipt-bad-date.json"
capture run_fixture verify-receipt "$TEST_ROOT/receipt-bad-date.json"
assert_equal 1 "$CAPTURE_STATUS" "nonexistent calendar date was accepted"
[[ "$CAPTURE_STDERR" == *'invalid-timestamp'* ]] || fail "invalid calendar date diagnostic is absent"

"$JQ" '
  .started_at = "2026-07-31T00:00:00.000000002Z"
  | .finished_at = "2026-07-31T00:00:00.000000001Z"
' "$TEST_ROOT/receipt.json" >| "$TEST_ROOT/receipt-nanosecond-order.json"
capture run_fixture verify-receipt "$TEST_ROOT/receipt-nanosecond-order.json"
assert_equal 1 "$CAPTURE_STATUS" "sub-millisecond time reversal was accepted"
[[ "$CAPTURE_STDERR" == *'invalid-time-order'* ]] || fail "sub-millisecond ordering diagnostic is absent"

"$JQ" --arg secret "$SENTINEL" '
  .finished_at = "1969-12-31T23:59:59.000Z"
  | del(.accounting)
  | .karma_score = $secret
' "$TEST_ROOT/receipt.json" >| "$TEST_ROOT/receipt-invalid.json"
capture run_fixture verify-receipt "$TEST_ROOT/receipt-invalid.json"
assert_equal 1 "$CAPTURE_STATUS" "invalid receipt was accepted"
[[ "$CAPTURE_STDERR" == *'unknown-field'* && "$CAPTURE_STDERR" == *'invalid-time-order'* ]] \
  || fail "invalid receipt diagnostics are incomplete"
[[ "$CAPTURE_STDERR" == *'$.accounting missing-field'* ]] \
  || fail "receipt accounting invariant is not enforced"
[[ "$CAPTURE_STDERR$CAPTURE_STDOUT" != *"$SENTINEL"* ]] || fail "rejected receipt value leaked"

reset_fixture
receipt_schema="$FIXTURE_ROOT/schemas/karma-receipt-v0.1.schema.json"
"$JQ" '.properties.authority.required = [{}]' "$receipt_schema" >| "$receipt_schema.next" \
  && command mv "$receipt_schema.next" "$receipt_schema"
capture run_fixture verify-receipt "$TEST_ROOT/receipt.json"
assert_equal 1 "$CAPTURE_STATUS" "malformed receipt schema crashed or passed"
[[ "$CAPTURE_STDERR" == *'invalid-schema-keyword-value'* ]] \
  || fail "malformed receipt schema diagnostic is absent"
[[ "$CAPTURE_STDERR$CAPTURE_STDOUT" != *'TypeError'* ]] || fail "malformed receipt schema raised TypeError"

reset_fixture
typeset hostile_name=$'hostile\n\e[31m\u2028\u202ename'
command ln -s "$FIXTURE_ROOT/skills/shape-kingdom-nen" "$FIXTURE_ROOT/skills/$hostile_name"
capture run_fixture validate
assert_equal 1 "$CAPTURE_STATUS" "hostile diagnostic path was accepted"
[[
  "$CAPTURE_STDERR" != *$'\e'*
  && "$CAPTURE_STDERR" != *$'\u2028'*
  && "$CAPTURE_STDERR" != *$'\u202e'*
  && "$CAPTURE_STDERR" == *'\u000a\u001b'*
  && "$CAPTURE_STDERR" == *'\u2028\u202e'*
]] \
  || fail "plain diagnostics did not neutralize control characters"

capture run_fixture --skills-root relative/path validate
assert_equal 2 "$CAPTURE_STATUS" "relative skills root did not return usage status"
[[ "$CAPTURE_STDERR" == usage:* ]] || fail "usage diagnostic is missing"

assert_equal "$PROD_SNAPSHOT_BEFORE" "$(production_snapshot)" "tests changed production Nen files"

print -r -- "ok - Nen manifests, boundaries, deterministic digests, and KARMA receipts"
