#!/usr/bin/env python3
"""Read or validate the inert KINGDOM information-control protocol."""

from __future__ import annotations

import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SKILL_ROOT = ROOT / "skills" / "guard-information-flow"
CONTRACT_PATH = SKILL_ROOT / "references" / "information-control-contract.md"
EXAMPLE_PATH = SKILL_ROOT / "references" / "information-control-envelope.example.json"
VALIDATOR_PATH = SKILL_ROOT / "scripts" / "validate_envelope.py"

USAGE = """Usage: ./kingdom guard [law|protocol|example]
       ./kingdom guard validate [--json] [--] [ENVELOPE.json]

law       Print the exact canonical Citizen Law (default).
protocol  Print the complete source-only information-control contract.
example   Print the bundled synthetic, inert envelope example.
validate  Check one local envelope for internal consistency only.

Validation performs no scan, lookup, network call, write, enforcement,
authority grant, or KARMA effect. It does not establish truth, safety,
credential status, or permission. The pinned jsonschema dependency must be
provided by the host; this command never installs it.
"""


def _read_source(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        raise RuntimeError("canonical information-control source is unavailable") from exc


def _citizen_law(contract: str) -> str:
    marker = "## Citizen law\n"
    start = contract.find(marker)
    if start < 0:
        raise RuntimeError("canonical Citizen Law is unavailable")
    end = contract.find("\n## ", start + len(marker))
    if end < 0:
        raise RuntimeError("canonical Citizen Law is unavailable")
    return contract[start:end].rstrip("\n") + "\n"


def _usage_error() -> int:
    sys.stderr.write(USAGE)
    return 64


def _parse_validate(arguments: list[str]) -> tuple[bool, Path] | None:
    json_mode = False
    positionals: list[str] = []
    options = True
    for argument in arguments:
        if options and argument == "--":
            options = False
        elif options and argument == "--json":
            if json_mode:
                return None
            json_mode = True
        elif options and argument.startswith("-"):
            return None
        else:
            positionals.append(argument)
    if len(positionals) > 1:
        return None
    return json_mode, Path(positionals[0]) if positionals else EXAMPLE_PATH


def _exec_validator(json_mode: bool, envelope: Path) -> int:
    interpreter = os.environ.get("INFORMATION_CONTROL_SCHEMA_PYTHON") or sys.executable
    arguments = [interpreter, str(VALIDATOR_PATH)]
    if json_mode:
        arguments.append("--json")
    # A lexical absolute path prevents a leading-dash filename from becoming a
    # validator option without resolving (and thereby hiding) a symlink.
    arguments.append(os.path.abspath(os.fspath(envelope)))
    try:
        os.execve(interpreter, arguments, os.environ.copy())
    except OSError:
        sys.stderr.write("guard: trusted validator interpreter is unavailable\n")
        return 127


def main(arguments: list[str]) -> int:
    command = arguments[0] if arguments else "law"
    rest = arguments[1:] if arguments else []

    if command in {"help", "--help", "-h"}:
        if rest:
            return _usage_error()
        sys.stdout.write(USAGE)
        return 0
    if command == "law":
        if rest:
            return _usage_error()
        try:
            sys.stdout.write(_citizen_law(_read_source(CONTRACT_PATH)))
        except RuntimeError as exc:
            sys.stderr.write(f"guard: {exc}\n")
            return 1
        return 0
    if command == "protocol":
        if rest:
            return _usage_error()
        try:
            sys.stdout.write(_read_source(CONTRACT_PATH))
        except RuntimeError as exc:
            sys.stderr.write(f"guard: {exc}\n")
            return 1
        return 0
    if command == "example":
        if rest:
            return _usage_error()
        try:
            sys.stdout.write(_read_source(EXAMPLE_PATH))
        except RuntimeError as exc:
            sys.stderr.write(f"guard: {exc}\n")
            return 1
        return 0
    if command == "validate":
        parsed = _parse_validate(rest)
        if parsed is None:
            return _usage_error()
        return _exec_validator(*parsed)
    return _usage_error()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
