#!/usr/bin/env python3
"""Send one compiled KINGDOM task packet without placing its content or key in argv."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request


ENDPOINT = "https://api.anthropic.com/v1/messages"
MODEL = "claude-opus-4-8"
MAX_INPUT_BYTES = 512 * 1024
MAX_RESPONSE_BYTES = 4 * 1024 * 1024


def refuse(message: str, status: int) -> None:
    print(f"kingdom ask: {message}", file=sys.stderr)
    raise SystemExit(status)


def main() -> None:
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        refuse("ANTHROPIC_API_KEY was not provided to this process", 2)

    prompt = sys.stdin.buffer.read(MAX_INPUT_BYTES + 1)
    if not prompt or len(prompt) > MAX_INPUT_BYTES:
        refuse("compiled task packet is empty or exceeds the local input limit", 1)
    try:
        text = prompt.decode("utf-8")
    except UnicodeDecodeError:
        refuse("compiled task packet is not UTF-8", 1)

    payload = json.dumps(
        {
            "model": MODEL,
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": text}],
        },
        ensure_ascii=False,
    ).encode("utf-8")
    request = urllib.request.Request(
        ENDPOINT,
        data=payload,
        method="POST",
        headers={
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            body = response.read(MAX_RESPONSE_BYTES + 1)
    except urllib.error.HTTPError as error:
        refuse(f"Anthropic API returned HTTP {error.code}", 1)
    except urllib.error.URLError:
        refuse("Anthropic API request failed", 1)

    if len(body) > MAX_RESPONSE_BYTES:
        refuse("Anthropic API response exceeds the local output limit", 1)
    try:
        document = json.loads(body)
        blocks = document.get("content", [])
        output = "".join(
            block.get("text", "")
            for block in blocks
            if isinstance(block, dict) and isinstance(block.get("text", ""), str)
        )
    except (UnicodeDecodeError, json.JSONDecodeError, AttributeError):
        refuse("Anthropic API returned an invalid response", 1)
    if not output:
        refuse("Anthropic API returned no text content", 1)
    print(output)


if __name__ == "__main__":
    main()
