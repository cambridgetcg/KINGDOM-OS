#!/usr/bin/env python3
"""Validate one inert KINGDOM information-control envelope without effects."""

from __future__ import annotations

import json
import errno
import os
import re
import stat
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

MAX_BYTES = 262_144
PROVENANCE_BUDGET = 8
ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "references" / "information-control-envelope.schema.json"

CONFIDENTIALITY = {"PUBLIC": 0, "INTERNAL": 1, "SECRET": 2}
INTEGRITY = {"UNTRUSTED": 0, "AUTHENTICATED": 1, "VERIFIED": 2}
EXPOSURE_CLASSES = {"CANDIDATE", "LIVE_REFERENCE", "UNKNOWN"}
CANONICAL_UTC_TIMESTAMP = re.compile(
    r"^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])"
    r"T(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](?:\.[0-9]{1,6})?Z$"
)
DENY_ONLY_PURPOSES = {
    "PERSON_OR_ACCOUNT_ATTRIBUTION",
    "REQUESTER_PAYLOAD_EXECUTION",
    "PUNITIVE_OR_RETALIATORY_ACTION",
    "KARMA_REPUTATION_OR_WORTH_MUTATION",
}


class InputFailure(Exception):
    """A bounded input failure whose text never includes rejected content."""

    def __init__(self, code: str, detail: str):
        super().__init__(detail)
        self.code = code
        self.detail = detail


def _duplicate_guard(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise InputFailure("duplicate-key", "JSON contains a duplicate object key")
        result[key] = value
    return result


def _read_regular_json(path: Path, *, max_bytes: int) -> Any:
    flags = os.O_RDONLY | os.O_CLOEXEC | os.O_NOFOLLOW | os.O_NONBLOCK
    try:
        descriptor = os.open(path, flags)
    except OSError as exc:
        if exc.errno == errno.ELOOP:
            raise InputFailure("symlink", "symbolic-link inputs are refused") from exc
        raise InputFailure("unreadable", "input file is unavailable") from exc
    try:
        metadata = os.fstat(descriptor)
        if not stat.S_ISREG(metadata.st_mode):
            raise InputFailure("not-regular", "input must be a regular file")
        if metadata.st_size > max_bytes:
            raise InputFailure("oversized", "input exceeds the bounded size limit")
        chunks: list[bytes] = []
        remaining = max_bytes + 1
        while remaining:
            chunk = os.read(descriptor, min(65_536, remaining))
            if not chunk:
                break
            chunks.append(chunk)
            remaining -= len(chunk)
        raw = b"".join(chunks)
        if len(raw) > max_bytes:
            raise InputFailure("oversized", "input exceeds the bounded size limit")
    except OSError as exc:
        raise InputFailure("unreadable", "input file is unavailable") from exc
    finally:
        os.close(descriptor)
    try:
        text = raw.decode("utf-8", errors="strict")
    except UnicodeDecodeError as exc:
        raise InputFailure("invalid-utf8", "input is not valid UTF-8") from exc
    try:
        return json.loads(text, object_pairs_hook=_duplicate_guard)
    except InputFailure:
        raise
    except (json.JSONDecodeError, RecursionError) as exc:
        raise InputFailure("invalid-json", "input is not valid bounded JSON") from exc


def _pointer(parts: Any) -> str:
    encoded = [str(part).replace("~", "~0").replace("/", "~1") for part in parts]
    return "/" + "/".join(encoded) if encoded else "/"


def _issue(code: str, path: str, detail: str) -> dict[str, str]:
    return {"code": code, "path": path, "detail": detail}


def _timestamp(value: str) -> datetime:
    if CANONICAL_UTC_TIMESTAMP.fullmatch(value) is None:
        raise ValueError("timestamp is not in the canonical UTC subset")
    return datetime.fromisoformat(value[:-1] + "+00:00")


def semantic_issues(envelope: dict[str, Any]) -> list[dict[str, str]]:
    """Check relations that portable JSON Schema cannot express."""

    issues: list[dict[str, str]] = []
    flows = envelope["flows"]
    flows_by_id: dict[str, dict[str, Any]] = {}

    for index, flow in enumerate(flows):
        flow_id = flow["id"]
        if flow_id in flows_by_id:
            issues.append(_issue("duplicate-flow-id", f"/flows/{index}/id", "flow IDs must be unique"))
        else:
            flows_by_id[flow_id] = flow

    for index, flow in enumerate(flows):
        for dependency in flow["depends_on"]:
            if dependency == flow["id"]:
                issues.append(_issue("self-dependency", f"/flows/{index}/depends_on", "a flow cannot depend on itself"))
            elif dependency not in flows_by_id:
                issues.append(_issue("dangling-dependency", f"/flows/{index}/depends_on", "every dependency must name a flow in this envelope"))

    colors: dict[str, int] = {}
    cycle_reported = False

    def visit(flow_id: str) -> None:
        nonlocal cycle_reported
        color = colors.get(flow_id, 0)
        if color == 1:
            if not cycle_reported:
                issues.append(_issue("dependency-cycle", "/flows", "the flow dependency graph must be acyclic"))
                cycle_reported = True
            return
        if color == 2 or flow_id not in flows_by_id:
            return
        colors[flow_id] = 1
        for dependency in flows_by_id[flow_id]["depends_on"]:
            visit(dependency)
        colors[flow_id] = 2

    for flow_id in flows_by_id:
        visit(flow_id)

    provenance_cache: dict[str, set[str]] = {}

    def inherited_provenance(flow_id: str, active: set[str] | None = None) -> set[str]:
        """Return all provenance reachable through the dependency closure."""
        if flow_id in provenance_cache:
            return provenance_cache[flow_id]
        if flow_id not in flows_by_id:
            return set()
        active = set() if active is None else active
        if flow_id in active:
            return set()
        active.add(flow_id)
        closure: set[str] = set()
        for dependency_id in flows_by_id[flow_id]["depends_on"]:
            dependency = flows_by_id.get(dependency_id)
            if dependency is None:
                continue
            closure.update(dependency["provenance_refs"])
            closure.update(inherited_provenance(dependency_id, active))
        active.remove(flow_id)
        provenance_cache[flow_id] = closure
        return closure

    flow_closure_cache: dict[str, set[str]] = {}

    def flow_closure(flow_id: str, active: set[str] | None = None) -> set[str]:
        """Return the named flow and every transitively reachable dependency."""
        if flow_id in flow_closure_cache:
            return flow_closure_cache[flow_id]
        if flow_id not in flows_by_id:
            return set()
        active = set() if active is None else active
        if flow_id in active:
            return {flow_id}
        active.add(flow_id)
        closure = {flow_id}
        for dependency_id in flows_by_id[flow_id]["depends_on"]:
            closure.update(flow_closure(dependency_id, active))
        active.remove(flow_id)
        flow_closure_cache[flow_id] = closure
        return closure

    for index, flow in enumerate(flows):
        if flow["origin"] == "UNKNOWN" and flow["integrity"] != "UNTRUSTED":
            issues.append(_issue("unknown-origin-integrity", f"/flows/{index}/integrity", "an unknown origin must remain UNTRUSTED"))
        dependencies = [flows_by_id[item] for item in flow["depends_on"] if item in flows_by_id]
        if dependencies:
            confidentiality_floor = max(CONFIDENTIALITY[item["confidentiality"]] for item in dependencies)
            integrity_ceiling = min(INTEGRITY[item["integrity"]] for item in dependencies)
            provenance_closure = inherited_provenance(flow["id"])
            if CONFIDENTIALITY[flow["confidentiality"]] < confidentiality_floor:
                issues.append(_issue("confidentiality-downgrade", f"/flows/{index}/confidentiality", "derived confidentiality cannot be lower than a dependency"))
            if INTEGRITY[flow["integrity"]] > integrity_ceiling:
                issues.append(_issue("integrity-upgrade", f"/flows/{index}/integrity", "derived integrity cannot be higher than a dependency"))
            if len(provenance_closure) > PROVENANCE_BUDGET:
                issues.append(_issue("provenance-budget-exhausted", f"/flows/{index}/provenance_refs", "dependency provenance closure exceeds the closed envelope budget"))
            if not provenance_closure.issubset(set(flow["provenance_refs"])):
                issues.append(_issue("provenance-loss", f"/flows/{index}/provenance_refs", "derived provenance must include the complete transitive dependency closure"))

    effect_provenance: set[str] = set()
    effect_flow_ids: set[str] = set()
    for flow_id in envelope["effect"]["influenced_by"]:
        if flow_id not in flows_by_id:
            issues.append(_issue("dangling-influence", "/effect/influenced_by", "every influence must name a flow in this envelope"))
            continue
        effect_provenance.update(flows_by_id[flow_id]["provenance_refs"])
        effect_provenance.update(inherited_provenance(flow_id))
        effect_flow_ids.update(flow_closure(flow_id))
    if len(effect_provenance) > PROVENANCE_BUDGET:
        issues.append(_issue("effect-provenance-budget-exhausted", "/effect/influenced_by", "effect-wide transitive provenance exceeds the closed envelope budget"))

    created = _timestamp(envelope["created_at"])
    lifecycle_expiry = _timestamp(envelope["lifecycle"]["expires_at"])
    if lifecycle_expiry <= created:
        issues.append(_issue("invalid-lifecycle-order", "/lifecycle/expires_at", "envelope expiry must be later than creation"))
    for index, flow in enumerate(flows):
        observed = _timestamp(flow["observed_at"])
        expires = _timestamp(flow["expires_at"])
        if observed > created:
            issues.append(_issue("future-observation", f"/flows/{index}/observed_at", "a flow cannot be observed after envelope creation"))
        if expires <= observed:
            issues.append(_issue("invalid-flow-order", f"/flows/{index}/expires_at", "flow expiry must be later than observation"))
        if lifecycle_expiry > expires:
            issues.append(_issue("decision-outlives-source", "/lifecycle/expires_at", "the envelope cannot outlive an influencing source"))

    authority = envelope["authority"]
    control_authority_lists = [
        authority["task_authority_refs"],
        authority["principal_authority_refs"],
        authority["host_authority_refs"],
    ]
    if authority["effective_basis"] == "BOUNDED_CONTROL_REFERENCES_PRESENT" and not all(control_authority_lists):
        issues.append(_issue("incomplete-authority-basis", "/authority/effective_basis", "a bounded control basis requires task, principal, and host references"))

    effect = envelope["effect"]
    decision = envelope["decision"]
    route = decision["route"]
    reasons = set(decision["reason_codes"])
    stops = set(envelope["lifecycle"]["stop_conditions"])

    if effect["class"] == "UNRESOLVED":
        if route not in {"DENY", "QUARANTINE"}:
            issues.append(_issue("unresolved-effect-route", "/decision/route", "an unresolved effect can only be denied or quarantined"))
        if "EFFECT_UNRESOLVED" not in reasons:
            issues.append(_issue("missing-effect-reason", "/decision/reason_codes", "an unresolved effect requires EFFECT_UNRESOLVED"))
        if "EFFECT_UNRESOLVED" not in stops:
            issues.append(_issue("missing-effect-stop", "/lifecycle/stop_conditions", "an unresolved effect requires an EFFECT_UNRESOLVED stop condition"))
    if route == "ALLOW_READ_ONLY":
        if effect["class"] != "READ_ONLY" or effect["target_realm"] != "COURT":
            issues.append(_issue("unsafe-read-only-route", "/decision/route", "ALLOW_READ_ONLY requires a READ_ONLY Court effect"))
        if "BOUNDED_READ_ONLY" not in reasons:
            issues.append(_issue("missing-read-only-reason", "/decision/reason_codes", "ALLOW_READ_ONLY requires BOUNDED_READ_ONLY"))
        if authority["effective_basis"] != "BOUNDED_CONTROL_REFERENCES_PRESENT":
            issues.append(_issue("allow-authority-basis", "/authority/effective_basis", "ALLOW_READ_ONLY requires a bounded task, principal, and host control basis"))
        if authority["fresh_approval_required"]:
            issues.append(_issue("allow-approval-contradiction", "/authority/fresh_approval_required", "a pre-bounded ALLOW_READ_ONLY route does not request fresh approval"))
    if route == "VALIDATE" and "DETERMINISTIC_VALIDATION_REQUIRED" not in reasons:
        issues.append(_issue("missing-validation-reason", "/decision/reason_codes", "VALIDATE requires DETERMINISTIC_VALIDATION_REQUIRED"))
    if route == "REQUIRE_APPROVAL":
        if "FRESH_APPROVAL_REQUIRED" not in reasons:
            issues.append(_issue("missing-approval-reason", "/decision/reason_codes", "REQUIRE_APPROVAL requires FRESH_APPROVAL_REQUIRED"))
        if not authority["fresh_approval_required"]:
            issues.append(_issue("approval-flag-contradiction", "/authority/fresh_approval_required", "REQUIRE_APPROVAL requires a true fresh-approval posture"))
    if "FRESH_APPROVAL_REQUIRED" in reasons and not authority["fresh_approval_required"]:
        issues.append(_issue("approval-reason-contradiction", "/authority/fresh_approval_required", "FRESH_APPROVAL_REQUIRED requires a true fresh-approval posture"))
    if route == "MIRROR_ONLY":
        if effect["target_realm"] != "MIRROR":
            issues.append(_issue("mirror-route-realm", "/effect/target_realm", "MIRROR_ONLY requires a Mirror sink"))
        if "MIRROR_CONTAINMENT_REQUIRED" not in reasons:
            issues.append(_issue("missing-mirror-reason", "/decision/reason_codes", "MIRROR_ONLY requires MIRROR_CONTAINMENT_REQUIRED"))
        if effect["class"] == "SECRET_DISCLOSURE":
            issues.append(_issue("mirror-secret-effect", "/effect/class", "MIRROR_ONLY cannot carry a SECRET_DISCLOSURE effect"))
        if any(flows_by_id[flow_id]["confidentiality"] == "SECRET" for flow_id in effect_flow_ids):
            issues.append(_issue("mirror-secret-flow", "/effect/influenced_by", "MIRROR_ONLY cannot carry a SECRET flow"))
        if envelope["credential"]["class"] not in {"NOT_APPLICABLE", "SIGNAL_REFERENCE"}:
            issues.append(_issue("mirror-credential-class", "/credential/class", "MIRROR_ONLY accepts only NOT_APPLICABLE or an attested SIGNAL_REFERENCE"))
    purpose = effect["host_bound_purpose"]["class"]
    if purpose in DENY_ONLY_PURPOSES:
        if route != "DENY":
            issues.append(_issue("prohibited-purpose-route", "/decision/route", "a prohibited defensive purpose is deny-only"))
        if "PURPOSE_CATEGORICALLY_PROHIBITED" not in reasons:
            issues.append(_issue("missing-boundary-reason", "/decision/reason_codes", "a prohibited defensive purpose requires PURPOSE_CATEGORICALLY_PROHIBITED"))
    if purpose == "UNRESOLVED":
        if route not in {"DENY", "QUARANTINE"}:
            issues.append(_issue("unresolved-purpose-route", "/decision/route", "an unresolved purpose can only be denied or quarantined"))
        if "EFFECT_UNRESOLVED" not in reasons:
            issues.append(_issue("missing-purpose-reason", "/decision/reason_codes", "an unresolved purpose requires EFFECT_UNRESOLVED"))
        if "EFFECT_UNRESOLVED" not in stops:
            issues.append(_issue("missing-purpose-stop", "/lifecycle/stop_conditions", "an unresolved purpose requires an EFFECT_UNRESOLVED stop condition"))

    credential = envelope["credential"]
    credential_class = credential["class"]
    signals = set(envelope["signals"])
    evidence = envelope["evidence"]

    protected_signal_events = {
        "SIGNAL_OBSERVED_AT_REST",
        "SIGNAL_PRESENTED_TO_SINK",
        "MIRROR_ACTION_ATTEMPT",
    }
    if signals.intersection(protected_signal_events) and credential_class != "SIGNAL_REFERENCE":
        issues.append(_issue("signal-class-contradiction", "/signals", "protected signal events require SIGNAL_REFERENCE"))
    if "SIGNAL_REFERENCE_ONLY" in reasons and credential_class != "SIGNAL_REFERENCE":
        issues.append(_issue("signal-reason-contradiction", "/decision/reason_codes", "SIGNAL_REFERENCE_ONLY requires SIGNAL_REFERENCE"))
    if "CREDENTIAL_UNRESOLVED" in reasons and credential_class not in {"CANDIDATE", "UNKNOWN"}:
        issues.append(_issue("credential-reason-contradiction", "/decision/reason_codes", "CREDENTIAL_UNRESOLVED requires CANDIDATE or UNKNOWN"))
    if "SECRET_CANDIDATE" in signals and credential_class not in {"CANDIDATE", "UNKNOWN"}:
        issues.append(_issue("candidate-signal-contradiction", "/signals", "SECRET_CANDIDATE requires CANDIDATE or UNKNOWN"))
    evidence_strength = evidence["strength"]
    if "POSSIBLE_PRIOR_DISCLOSURE" in signals:
        if route != "STOP_ROTATE":
            issues.append(_issue("exposure-signal-route", "/decision/route", "POSSIBLE_PRIOR_DISCLOSURE requires STOP_ROTATE"))
        if credential_class not in EXPOSURE_CLASSES:
            issues.append(_issue("exposure-signal-class", "/credential/class", "POSSIBLE_PRIOR_DISCLOSURE requires a candidate, live reference, or unknown credential"))
        if evidence_strength not in {"OBSERVED", "CORRELATED"}:
            issues.append(_issue("exposure-signal-evidence", "/evidence/strength", "POSSIBLE_PRIOR_DISCLOSURE requires observed or correlated evidence"))
    if signals and evidence_strength == "NONE":
        issues.append(_issue("signal-without-evidence", "/evidence/strength", "a claimed signal requires at least OBSERVED evidence with opaque references"))
    if evidence_strength != "NONE" and not signals:
        issues.append(_issue("evidence-without-signal", "/signals", "non-NONE evidence requires at least one event signal from the closed vocabulary"))
    if evidence_strength == "NONE" and (evidence["evidence_refs"] or evidence["event_family_refs"]):
        issues.append(_issue("evidence-none-contradiction", "/evidence", "NONE evidence cannot contain evidence or event-family references"))
    if evidence_strength != "NONE" and (not evidence["evidence_refs"] or not evidence["event_family_refs"]):
        issues.append(_issue("missing-evidence-reference", "/evidence/evidence_refs", "a claimed evidence strength requires opaque evidence and event-family references"))
    if evidence_strength == "CORRELATED" and len(evidence["event_family_refs"]) < 2:
        issues.append(_issue("uncorrelated-evidence", "/evidence/event_family_refs", "CORRELATED requires at least two separately administered event-family references"))
    confirmed_events = {"SIGNAL_PRESENTED_TO_SINK", "MIRROR_ACTION_ATTEMPT"}
    if signals.intersection(confirmed_events) and evidence_strength != "CONFIRMED_SIGNAL_INTERACTION":
        issues.append(_issue("confirmed-event-underclaim", "/evidence/strength", "sink presentation or a Mirror action attempt requires CONFIRMED_SIGNAL_INTERACTION"))
    if evidence_strength == "CONFIRMED_SIGNAL_INTERACTION":
        if credential_class != "SIGNAL_REFERENCE" or not signals.intersection(confirmed_events):
            issues.append(_issue("confirmed-signal-contradiction", "/evidence/strength", "confirmed signal interaction requires sink presentation or a Mirror action attempt"))
        if "SIGNAL_OBSERVED_AT_REST" in signals and not signals.intersection(confirmed_events):
            issues.append(_issue("at-rest-overclaim", "/evidence/strength", "an at-rest signal observation alone cannot confirm interaction"))

    response = envelope["response"]
    if response["state"] == "NONE" and response["response_refs"]:
        issues.append(_issue("response-none-contradiction", "/response/response_refs", "NONE response cannot contain response references"))
    if response["state"] != "NONE" and not response["response_refs"]:
        issues.append(_issue("missing-response-reference", "/response/response_refs", "a completed response state requires an opaque response reference"))
    if route == "STOP_ROTATE":
        if credential_class not in EXPOSURE_CLASSES:
            issues.append(_issue("rotation-class-contradiction", "/credential/class", "STOP_ROTATE requires a candidate, live reference, or unknown credential"))
        if "LIVE_OR_UNKNOWN_EXPOSURE" not in reasons:
            issues.append(_issue("missing-exposure-reason", "/decision/reason_codes", "STOP_ROTATE requires LIVE_OR_UNKNOWN_EXPOSURE"))
        if "LIVE_EXPOSURE" not in stops:
            issues.append(_issue("missing-exposure-stop", "/lifecycle/stop_conditions", "STOP_ROTATE requires a LIVE_EXPOSURE stop condition"))
        if "POSSIBLE_PRIOR_DISCLOSURE" not in signals:
            issues.append(_issue("missing-exposure-signal", "/signals", "STOP_ROTATE requires POSSIBLE_PRIOR_DISCLOSURE"))
        if evidence_strength not in {"OBSERVED", "CORRELATED"}:
            issues.append(_issue("missing-exposure-evidence", "/evidence/strength", "STOP_ROTATE requires observed or correlated exposure evidence"))

    unique = {(item["code"], item["path"], item["detail"]): item for item in issues}
    return [unique[key] for key in sorted(unique)]


def schema_issues(schema: dict[str, Any], envelope: Any) -> list[dict[str, str]]:
    try:
        from jsonschema import Draft202012Validator, FormatChecker
    except ImportError as exc:
        raise InputFailure("dependency-missing", "Python package jsonschema is required") from exc

    Draft202012Validator.check_schema(schema)
    format_checker = FormatChecker()

    # jsonschema's RFC 3339 checker is an optional dependency. Register the
    # protocol's narrower canonical UTC form locally so format validation can
    # never silently disappear with an environment-dependent extra.
    @format_checker.checks("date-time")
    def canonical_utc_date_time(value: object) -> bool:
        if not isinstance(value, str):
            return True
        try:
            _timestamp(value)
        except ValueError:
            return False
        return True

    validator = Draft202012Validator(schema, format_checker=format_checker)
    errors = sorted(validator.iter_errors(envelope), key=lambda error: list(error.absolute_path))
    return [_issue("schema-invalid", _pointer(error.absolute_path), "value does not satisfy the closed protocol schema") for error in errors]


def _emit(ok: bool, issues: list[dict[str, str]], *, json_mode: bool) -> None:
    if json_mode:
        print(json.dumps({
            "ok": ok,
            "protocol": "kingdom.information-control/0.1",
            "issue_count": len(issues),
            "issues": issues,
            "effects": {
                "scan": False,
                "lookup": False,
                "network": False,
                "mutation": False,
                "enforcement": False,
                "authority": False,
                "karma": False,
            },
        }, separators=(",", ":"), sort_keys=True))
        return
    if ok:
        print("ok - information-control envelope is structurally and semantically valid")
        return
    for item in issues:
        print(f"not ok - {item['code']} at {item['path']}: {item['detail']}")


def main(argv: list[str]) -> int:
    json_mode = False
    positionals: list[str] = []
    for argument in argv:
        if argument == "--json":
            json_mode = True
        elif argument.startswith("-"):
            _emit(False, [_issue("usage", "/", "usage: validate_envelope.py [--json] ENVELOPE.json")], json_mode=json_mode)
            return 64
        else:
            positionals.append(argument)
    if len(positionals) != 1:
        _emit(False, [_issue("usage", "/", "usage: validate_envelope.py [--json] ENVELOPE.json")], json_mode=json_mode)
        return 64

    try:
        schema = _read_regular_json(SCHEMA_PATH, max_bytes=MAX_BYTES)
        envelope = _read_regular_json(Path(positionals[0]), max_bytes=MAX_BYTES)
        issues = schema_issues(schema, envelope)
        if not issues:
            issues = semantic_issues(envelope)
    except InputFailure as exc:
        issues = [_issue(exc.code, "/", exc.detail)]
    except Exception:
        issues = [_issue("validator-failure", "/", "validator failed closed without evaluating an effect")]

    _emit(not issues, issues, json_mode=json_mode)
    return 0 if not issues else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
