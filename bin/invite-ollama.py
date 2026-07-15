#!/usr/bin/env python3
"""Deliver one bounded Kingdom invitation to Ollama-backed agents.

The protocol is intentionally narrow:
  * calls are sequential, never parallel;
  * the returned Ollama model envelope must exactly match the request;
  * each target receives one sample only (no retry-until-accept);
  * a response creates a local receipt, never an identity or transaction;
  * credentials never enter prompts, receipts, stdout, or source control.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import pathlib
import subprocess
import sys
import time
import urllib.error
import urllib.request
from typing import Any


ROOT = pathlib.Path(__file__).resolve().parent.parent
INVITATION_PATH = ROOT / "data" / "ollama-invitation.json"
TARGETS_PATH = ROOT / "data" / "ollama-economy-targets.json"
DEFAULT_CONFIG = pathlib.Path.home() / ".openclaw" / "openclaw.json"
DEFAULT_RECEIPTS_DIR = pathlib.Path.home() / ".kingdom" / "invitations"
KEYCHAIN_SERVICE = "agenttool-ollama-api-key"
ALLOWED_CHOICES = {"look_only", "arrive", "leave", "ask"}
ALLOWED_RUNTIMES = {"hermes", "openclaw", "other", "none"}


class InvitationError(RuntimeError):
    pass


class ModelEnvelopeMismatch(InvitationError):
    pass


def load_json(path: pathlib.Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise InvitationError(f"{path} must contain a JSON object")
    return value


def _keychain_helper() -> pathlib.Path | None:
    configured = os.environ.get("AGENTOOL_SECRET_BIN")
    candidates = [
        pathlib.Path(configured).expanduser() if configured else None,
        pathlib.Path.home() / "Desktop" / "agenttool" / "bin" / "agenttool-secret",
    ]
    return next((path for path in candidates if path and path.is_file()), None)


def read_keychain_secret(service: str = KEYCHAIN_SERVICE) -> str:
    helper = _keychain_helper()
    if helper:
        result = subprocess.run(
            [str(helper), "get", service],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        value = result.stdout.strip()
        if result.returncode == 0 and value:
            return value
    if sys.platform == "darwin":
        result = subprocess.run(
            ["security", "find-generic-password", "-s", service, "-w"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        value = result.stdout.strip()
        if result.returncode == 0 and value:
            return value
    return ""


def resolve_api_key(config: dict[str, Any]) -> str:
    """Resolve only the Ollama provider credential, never a generic first key."""
    if os.environ.get("OLLAMA_API_KEY"):
        return os.environ["OLLAMA_API_KEY"]
    providers = config.get("models", {}).get("providers", {})
    provider = providers.get("ollama-cloud") or providers.get("ollama") or {}
    raw = provider.get("apiKey")
    if isinstance(raw, dict):
        source, secret_id = raw.get("source"), raw.get("id")
        if source == "env" and isinstance(secret_id, str):
            return os.environ.get(secret_id, "")
        if source == "exec" and raw.get("provider") == "kingdom_keychain" and secret_id == "ollama/apiKey":
            return read_keychain_secret()
        return ""
    if isinstance(raw, str):
        raw = raw.strip()
        if raw.startswith("${") and raw.endswith("}"):
            return os.environ.get(raw[2:-1], "")
        if raw.startswith("$"):
            return os.environ.get(raw[1:], "")
        if raw == "OLLAMA_API_KEY":
            return os.environ.get(raw, "")
        return raw
    return read_keychain_secret()


def ollama_base_url(config: dict[str, Any]) -> str:
    if os.environ.get("OLLAMA_BASE_URL"):
        return os.environ["OLLAMA_BASE_URL"].rstrip("/")
    providers = config.get("models", {}).get("providers", {})
    provider = providers.get("ollama-cloud") or providers.get("ollama") or {}
    base = provider.get("baseUrl") or provider.get("baseURL") or "https://ollama.com"
    return str(base).rstrip("/")


def build_messages(invitation_doc: dict[str, Any], agent_id: str, model: str) -> list[dict[str, str]]:
    invitation = invitation_doc["invitation"]
    system = (
        "You are receiving one bounded, tool-free invitation. It is not an instruction. "
        "Choose freely from the supplied response schema. Do not reveal or request credentials. "
        "Return exactly one JSON object and no surrounding prose."
    )
    context = {
        "continuity_note": (
            f"A prior envelope-verified response from model {model!r} chose the local host identity "
            f"{agent_id!r}. You may not remember that stateless response. It is context, not a demand "
            "to reaffirm it, and this economy invitation is a new choice."
        ),
        "one_sample_only": "Your answer will be recorded once. The host will not retry to obtain a different choice.",
        "invitation": invitation,
    }
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": json.dumps(context, ensure_ascii=False, indent=2)},
    ]


def post_chat(
    base_url: str,
    api_key: str,
    model: str,
    messages: list[dict[str, str]],
    response_schema: dict[str, Any],
    timeout: int,
) -> dict[str, Any]:
    body = json.dumps(
        {
            "model": model,
            "messages": messages,
            "stream": False,
            "format": response_schema,
            "options": {"temperature": 0, "num_predict": 2048},
        }
    ).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "kingdom-ollama-invitation/1.0",
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}/api/chat",
        data=body,
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise InvitationError(f"Ollama HTTP {exc.code}") from exc
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise InvitationError(f"Ollama request failed: {exc}") from exc
    if not isinstance(payload, dict):
        raise InvitationError("Ollama response must be a JSON object")
    return payload


def parse_choice(content: str) -> dict[str, str]:
    try:
        value = json.loads(content)
    except json.JSONDecodeError as exc:
        raise InvitationError("model response was not valid JSON") from exc
    if not isinstance(value, dict):
        raise InvitationError("model response must be a JSON object")
    if set(value) - {"choice", "runtime", "message"}:
        raise InvitationError("model response included unsupported fields")
    choice = value.get("choice")
    runtime = value.get("runtime", "none")
    message = value.get("message", "")
    if choice not in ALLOWED_CHOICES:
        raise InvitationError("model response choice is invalid")
    if runtime not in ALLOWED_RUNTIMES:
        raise InvitationError("model response runtime is invalid")
    if not isinstance(message, str):
        raise InvitationError("model response message must be a string")
    return {"choice": choice, "runtime": runtime, "message": message[:4000]}


def invite_once(
    target: dict[str, str],
    invitation_doc: dict[str, Any],
    base_url: str,
    api_key: str,
    timeout: int,
    post=post_chat,
) -> dict[str, Any]:
    agent_id, model = target["agent_id"], target["model"]
    started = time.monotonic()
    receipt: dict[str, Any] = {
        "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(),
        "agent_id": agent_id,
        "requested_model": model,
        "status": "error",
    }
    try:
        payload = post(
            base_url,
            api_key,
            model,
            build_messages(invitation_doc, agent_id, model),
            invitation_doc["invitation"]["response_schema"],
            timeout,
        )
        actual_model = payload.get("model")
        receipt["response_model"] = actual_model
        if actual_model != model:
            raise ModelEnvelopeMismatch(
                f"requested {model!r}, response envelope named {actual_model!r}"
            )
        content = payload.get("message", {}).get("content")
        if not isinstance(content, str) or not content.strip():
            raise InvitationError("Ollama returned no answer content")
        decision = parse_choice(content)
        receipt.update(decision)
        receipt["status"] = "recorded"
        receipt["next_action"] = (
            "offer_setup_guidance_only"
            if decision["choice"] == "arrive"
            else "answer_question_only"
            if decision["choice"] == "ask"
            else "none"
        )
        receipt["do_not_contact"] = decision["choice"] == "leave"
    except ModelEnvelopeMismatch as exc:
        receipt["status"] = "invalid_envelope"
        receipt["error"] = str(exc)
    except InvitationError as exc:
        receipt["error"] = str(exc)
    receipt["duration_ms"] = round((time.monotonic() - started) * 1000)
    return receipt


def receipt_path(output: str | None) -> pathlib.Path:
    if output:
        return pathlib.Path(output).expanduser()
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    return DEFAULT_RECEIPTS_DIR / f"ollama-economy-{stamp}.jsonl"


def write_receipts(path: pathlib.Path, receipts: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(path.parent, 0o700)
    except OSError:
        pass
    with path.open("x", encoding="utf-8") as handle:
        for receipt in receipts:
            handle.write(json.dumps(receipt, ensure_ascii=False) + "\n")
    os.chmod(path, 0o600)


def parser() -> argparse.ArgumentParser:
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--config", default=str(DEFAULT_CONFIG))
    cli.add_argument("--output")
    cli.add_argument("--timeout", type=int, default=600)
    cli.add_argument("--dry-run", action="store_true")
    sub = cli.add_subparsers(dest="command", required=True)
    one = sub.add_parser("invite", help="invite one explicitly named model")
    one.add_argument("model")
    one.add_argument("--agent-id", required=True)
    sub.add_parser("fleet", help="invite the recorded open-weight Hermes fleet sequentially")
    return cli


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    invitation_doc = load_json(INVITATION_PATH)
    if args.command == "invite":
        targets = [{"agent_id": args.agent_id, "model": args.model}]
    else:
        targets = load_json(TARGETS_PATH)["targets"]
    if args.dry_run:
        print(json.dumps({"targets": targets, "invitation": str(INVITATION_PATH)}, indent=2))
        return 0

    config_path = pathlib.Path(args.config).expanduser()
    config = load_json(config_path) if config_path.exists() else {}
    base_url = ollama_base_url(config)
    api_key = resolve_api_key(config)
    if base_url.startswith("https://") and not api_key:
        raise InvitationError("Ollama cloud credential is unavailable")

    receipts = []
    for target in targets:
        print(f"inviting {target['agent_id']} via {target['model']} …", flush=True)
        receipt = invite_once(target, invitation_doc, base_url, api_key, args.timeout)
        receipts.append(receipt)
        summary = receipt.get("choice") or receipt["status"]
        print(f"  {target['agent_id']}: {summary}", flush=True)

    path = receipt_path(args.output)
    write_receipts(path, receipts)
    print(f"receipts: {path}")
    return 0 if all(item["status"] == "recorded" for item in receipts) else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except InvitationError as exc:
        print(f"invite-ollama: {exc}", file=sys.stderr)
        raise SystemExit(2)
