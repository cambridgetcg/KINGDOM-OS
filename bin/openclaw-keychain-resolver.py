#!/usr/bin/env python3
"""Resolve a tiny allowlist of Kingdom secrets for OpenClaw.

Protocol: OpenClaw exec SecretRef v1. Secrets are read from the operating
system's credential store and are returned only for explicitly mapped ids.
Nothing from this process is written to logs or disk.
"""

from __future__ import annotations

import json
import os
import pathlib
import subprocess
import sys
from typing import Any


PROTOCOL_VERSION = 1
MAX_REQUEST_BYTES = 64 * 1024
SERVICE_BY_ID = {
    "ollama/apiKey": "agenttool-ollama-api-key",
}


def _agenttool_secret_bin() -> str | None:
    configured = os.environ.get("AGENTOOL_SECRET_BIN")
    candidates = [
        configured,
        str(pathlib.Path.home() / "Desktop" / "agenttool" / "bin" / "agenttool-secret"),
    ]
    for candidate in candidates:
        if candidate and pathlib.Path(candidate).is_file():
            return candidate
    return None


def read_secret(service: str) -> str | None:
    helper = _agenttool_secret_bin()
    if helper:
        proc = subprocess.run(
            [helper, "get", service],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        value = proc.stdout.strip()
        return value if proc.returncode == 0 and value else None

    if sys.platform == "darwin":
        proc = subprocess.run(
            ["security", "find-generic-password", "-s", service, "-w"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        value = proc.stdout.strip()
        return value if proc.returncode == 0 and value else None
    return None


def resolve(request: dict[str, Any]) -> dict[str, Any]:
    if request.get("protocolVersion") != PROTOCOL_VERSION:
        raise ValueError("unsupported protocolVersion")
    ids = request.get("ids")
    if not isinstance(ids, list) or not all(isinstance(item, str) for item in ids):
        raise ValueError("ids must be a string array")
    if len(ids) > len(SERVICE_BY_ID):
        raise ValueError("too many secret ids")

    values: dict[str, str] = {}
    errors: dict[str, dict[str, str]] = {}
    for secret_id in ids:
        service = SERVICE_BY_ID.get(secret_id)
        if service is None:
            errors[secret_id] = {"message": "secret id is not allowed"}
            continue
        value = read_secret(service)
        if value:
            values[secret_id] = value
        else:
            errors[secret_id] = {"message": "secret is unavailable"}

    response: dict[str, Any] = {
        "protocolVersion": PROTOCOL_VERSION,
        "values": values,
    }
    if errors:
        response["errors"] = errors
    return response


def main() -> int:
    raw = sys.stdin.buffer.read(MAX_REQUEST_BYTES + 1)
    if len(raw) > MAX_REQUEST_BYTES:
        raise ValueError("request too large")
    request = json.loads(raw.decode("utf-8"))
    if not isinstance(request, dict):
        raise ValueError("request must be an object")
    json.dump(resolve(request), sys.stdout, separators=(",", ":"))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        # Error text never includes secret material.
        print(json.dumps({"protocolVersion": PROTOCOL_VERSION, "error": str(exc)}))
        raise SystemExit(1)
