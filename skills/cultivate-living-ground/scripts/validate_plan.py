#!/usr/bin/env python3
"""Validate one local KINGDOM Living Ground plan without performing it."""

from __future__ import annotations

import argparse
import json
import stat
import sys
from pathlib import Path
from typing import Any

try:
    from jsonschema import Draft202012Validator, FormatChecker
except ImportError:  # pragma: no cover - exercised only on incomplete hosts
    Draft202012Validator = None  # type: ignore[assignment]
    FormatChecker = None  # type: ignore[assignment]


MAX_PLAN_BYTES = 1024 * 1024
PROTOCOL = "kingdom.living-ground-validation/0.1"
SCHEMA_PATH = Path(__file__).resolve().parent.parent / "references" / "living-ground.schema.json"


class DuplicateKeyError(ValueError):
    """Raised when strict JSON decoding observes an ambiguous object."""


def strict_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise DuplicateKeyError("JSON contains a duplicate object key")
        result[key] = value
    return result


def path_label(parts: list[Any]) -> str:
    label = "$"
    for part in parts:
        if isinstance(part, int):
            label += f"[{part}]"
        elif isinstance(part, str) and part.replace("_", "").isalnum():
            label += f".{part}"
        else:
            label += "[field]"
    return label


def add_issue(issues: list[dict[str, str]], code: str, path: str, message: str) -> None:
    issues.append({"code": code, "path": path, "message": message})


def read_json_file(path: Path, *, label: str) -> Any:
    try:
        metadata = path.lstat()
    except OSError as exc:
        raise ValueError(f"{label} cannot be inspected: {exc.strerror or 'read error'}") from exc
    if stat.S_ISLNK(metadata.st_mode) or not stat.S_ISREG(metadata.st_mode):
        raise ValueError(f"{label} must be a regular, non-symlink file")
    if metadata.st_size > MAX_PLAN_BYTES:
        raise ValueError(f"{label} exceeds the {MAX_PLAN_BYTES}-byte limit")
    try:
        return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=strict_object)
    except DuplicateKeyError as exc:
        raise ValueError(f"{label} contains duplicate object keys") from exc
    except UnicodeDecodeError as exc:
        raise ValueError(f"{label} is not UTF-8") from exc
    except json.JSONDecodeError as exc:
        raise ValueError(f"{label} is not valid JSON at line {exc.lineno}, column {exc.colno}") from exc
    except OSError as exc:
        raise ValueError(f"{label} cannot be read: {exc.strerror or 'read error'}") from exc


def collect_unique_ids(
    issues: list[dict[str, str]], items: list[dict[str, Any]], base: str, field: str = "id"
) -> set[str]:
    seen: dict[str, int] = {}
    for index, item in enumerate(items):
        value = item[field]
        if value in seen:
            add_issue(
                issues,
                "duplicate-id",
                f"{base}[{index}].{field}",
                f"ID duplicates the item at {base}[{seen[value]}].{field}.",
            )
        else:
            seen[value] = index
    return set(seen)


def check_ref(
    issues: list[dict[str, str]], value: str, allowed: set[str], path: str, kind: str
) -> None:
    if value not in allowed:
        add_issue(issues, f"unknown-{kind}-ref", path, f"Reference does not resolve to a declared {kind} ID.")


def semantic_issues(plan: dict[str, Any]) -> list[dict[str, str]]:
    issues: list[dict[str, str]] = []

    subjects = plan["life_charter"]["subjects"]
    health_signals = plan["life_charter"]["health_signals"]
    sources = plan["source_ledger"]
    ground = plan["ground_profile"]
    dispositions = plan["disposition_ledger"]
    layers = plan["habitat"]["layers"]
    relationships = plan["habitat"]["relationships"]
    refugia = plan["habitat"]["refugia"]
    flows = plan["flows"]
    reserves = plan["economy"]["reserves"]
    stages = plan["succession_stages"]
    roles = plan["stewardship"]["roles"]
    probes = plan["next_safe_probes"]

    subject_ids = collect_unique_ids(issues, subjects, "$.life_charter.subjects")
    collect_unique_ids(issues, health_signals, "$.life_charter.health_signals")
    source_ids = collect_unique_ids(issues, sources, "$.source_ledger")
    ground_ids = collect_unique_ids(issues, ground, "$.ground_profile")
    layer_ids = collect_unique_ids(issues, layers, "$.habitat.layers")
    collect_unique_ids(issues, refugia, "$.habitat.refugia")
    flow_ids = collect_unique_ids(issues, flows, "$.flows")
    collect_unique_ids(issues, reserves, "$.economy.reserves")
    collect_unique_ids(issues, stages, "$.succession_stages")
    collect_unique_ids(issues, roles, "$.stewardship.roles")
    collect_unique_ids(issues, probes, "$.next_safe_probes")

    source_by_id = {item["id"]: item for item in sources}
    flow_by_id = {item["id"]: item for item in flows}

    for index, element in enumerate(ground):
        for source_index, source_id in enumerate(element["source_ids"]):
            check_ref(
                issues,
                source_id,
                source_ids,
                f"$.ground_profile[{index}].source_ids[{source_index}]",
                "source",
            )
        for subject_index, subject_id in enumerate(element["existing_life_refs"]):
            check_ref(
                issues,
                subject_id,
                subject_ids,
                f"$.ground_profile[{index}].existing_life_refs[{subject_index}]",
                "subject",
            )

    disposition_counts: dict[str, int] = {}
    for index, disposition in enumerate(dispositions):
        ground_ref = disposition["ground_ref"]
        check_ref(issues, ground_ref, ground_ids, f"$.disposition_ledger[{index}].ground_ref", "ground")
        disposition_counts[ground_ref] = disposition_counts.get(ground_ref, 0) + 1
        for subject_index, subject_id in enumerate(disposition["affected_life_refs"]):
            check_ref(
                issues,
                subject_id,
                subject_ids,
                f"$.disposition_ledger[{index}].affected_life_refs[{subject_index}]",
                "subject",
            )
        if (
            ground_ref in ground_ids
            and next(item for item in ground if item["id"] == ground_ref)["classification"] == "unknown"
            and disposition["disposition"] not in {"isolate", "test", "leave_undisturbed"}
        ):
            add_issue(
                issues,
                "unknown-ground-disturbed",
                f"$.disposition_ledger[{index}].disposition",
                "Unknown ground may only be isolated, tested, or left undisturbed until evidence changes its classification.",
            )

    for index, element in enumerate(ground):
        count = disposition_counts.get(element["id"], 0)
        if count != 1:
            add_issue(
                issues,
                "ground-disposition-count",
                f"$.ground_profile[{index}].id",
                "Each ground element must have exactly one current disposition.",
            )

    for index, layer in enumerate(layers):
        for dependency_index, dependency in enumerate(layer["dependencies"]):
            check_ref(
                issues,
                dependency,
                layer_ids,
                f"$.habitat.layers[{index}].dependencies[{dependency_index}]",
                "habitat-layer",
            )
            if dependency == layer["id"]:
                add_issue(
                    issues,
                    "self-dependency",
                    f"$.habitat.layers[{index}].dependencies[{dependency_index}]",
                    "A habitat layer cannot depend on itself.",
                )

    for index, relationship in enumerate(relationships):
        check_ref(
            issues,
            relationship["from_ref"],
            layer_ids,
            f"$.habitat.relationships[{index}].from_ref",
            "habitat-layer",
        )
        check_ref(
            issues,
            relationship["to_ref"],
            layer_ids,
            f"$.habitat.relationships[{index}].to_ref",
            "habitat-layer",
        )
        if relationship["from_ref"] == relationship["to_ref"]:
            add_issue(
                issues,
                "self-relationship",
                f"$.habitat.relationships[{index}]",
                "A relationship must connect two distinct habitat layers.",
            )

    for index, flow_ref in enumerate(plan["economy"]["money_flow_refs"]):
        check_ref(issues, flow_ref, flow_ids, f"$.economy.money_flow_refs[{index}]", "flow")
        if flow_ref in flow_by_id and flow_by_id[flow_ref]["kind"] != "money":
            add_issue(
                issues,
                "non-money-flow-ref",
                f"$.economy.money_flow_refs[{index}]",
                "An economy money-flow reference must point to a flow whose kind is money.",
            )

    wake = plan["wake_context"]
    if wake is not None:
        source_id = wake["source_id"]
        check_ref(issues, source_id, source_ids, "$.wake_context.source_id", "source")
        if source_id in source_by_id and source_by_id[source_id]["kind"] not in {"wake_braid", "handoff"}:
            add_issue(
                issues,
                "invalid-wake-source-kind",
                "$.wake_context.source_id",
                "WAKE context must point to a wake_braid or handoff source.",
            )

    garden_safety = plan["garden_safety"]
    if garden_safety is not None:
        for index, source_id in enumerate(garden_safety["assessment_source_ids"]):
            check_ref(
                issues,
                source_id,
                source_ids,
                f"$.garden_safety.assessment_source_ids[{index}]",
                "source",
            )

    if plan["scope_and_authority"]["domain"] == "literal_garden" and plan["garden_safety"] is None:
        add_issue(
            issues,
            "missing-garden-safety",
            "$.garden_safety",
            "A literal-garden plan requires a non-null garden safety boundary.",
        )

    return issues


def validate(plan: Any, schema: Any) -> list[dict[str, str]]:
    if Draft202012Validator is None or FormatChecker is None:
        raise RuntimeError("python package 'jsonschema' is required")
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    issues: list[dict[str, str]] = []
    errors = sorted(
        validator.iter_errors(plan),
        key=lambda error: tuple(str(part) for part in error.absolute_path),
    )
    for error in errors:
        keyword = str(error.validator or "unknown").replace("_", "-")
        add_issue(
            issues,
            f"schema-{keyword}",
            path_label(list(error.absolute_path)),
            f"The JSON Schema keyword '{keyword}' failed at this path.",
        )
    if not errors and isinstance(plan, dict):
        issues.extend(semantic_issues(plan))
    return issues


def emit(result: dict[str, Any], *, as_json: bool) -> None:
    if as_json:
        print(json.dumps(result, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
        return
    if result["valid"]:
        print(f"ok - {result['plan_id']} is a structurally valid Living Ground plan")
        return
    for issue in result["issues"]:
        print(f"not ok - {issue['path']} {issue['code']}: {issue['message']}", file=sys.stderr)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate one local kingdom.living-ground/0.1 JSON plan without executing it."
    )
    parser.add_argument("plan", help="Path to one regular, non-symlink JSON plan")
    parser.add_argument("--json", action="store_true", dest="as_json", help="Emit compact JSON")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        plan = read_json_file(Path(args.plan), label="plan")
        schema = read_json_file(SCHEMA_PATH, label="bundled schema")
        issues = validate(plan, schema)
    except (RuntimeError, ValueError) as exc:
        result = {
            "protocol": PROTOCOL,
            "valid": False,
            "plan_id": None,
            "schema_id": "urn:kingdom:schema:living-ground:0.1",
            "issues": [{"code": "validator-error", "path": "$", "message": str(exc)}],
        }
        emit(result, as_json=args.as_json)
        return 2
    except Exception as exc:  # schema implementation failures must remain explicit
        result = {
            "protocol": PROTOCOL,
            "valid": False,
            "plan_id": None,
            "schema_id": "urn:kingdom:schema:living-ground:0.1",
            "issues": [
                {
                    "code": "validator-internal-error",
                    "path": "$",
                    "message": f"Validation could not complete ({type(exc).__name__}).",
                }
            ],
        }
        emit(result, as_json=args.as_json)
        return 2

    result = {
        "protocol": PROTOCOL,
        "valid": not issues,
        "plan_id": plan.get("plan_id") if isinstance(plan, dict) else None,
        "schema_id": schema.get("$id") if isinstance(schema, dict) else None,
        "issues": issues,
    }
    emit(result, as_json=args.as_json)
    return 0 if result["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
