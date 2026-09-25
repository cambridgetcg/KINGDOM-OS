#!/usr/bin/env python3
"""Private Cloudflare surface metadata; GET only, never probe hosted services.

Python 3.11+. Use a child-scoped CLOUDFLARE_API_TOKEN or an existing Wrangler
OAuth config. This tool never logs in, refreshes credentials, or changes Cloudflare.
The output is an inventory of resources visible to the selected credentials,
not proof that those credentials cover every account owned by a person.

API contracts checked 2026-09-25: developers.cloudflare.com/api/resources/
accounts/methods/list/, zones/methods/list/, pages/subresources/projects/methods/list/,
workers/subresources/{scripts,domains,routes}/methods/list/. Workers scripts,
domains, routes and Pages domains are single-page endpoints; projects are paged.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import stat
import sys
import threading
import time
import tomllib
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.cloudflare.com/client/v4"
MAX_RESPONSE = 8 * 1024 * 1024
MAX_ITEMS = 10_000
ID = re.compile(r"[a-fA-F0-9]{32}\Z")
DOMAIN_ID = re.compile(r"[A-Za-z0-9_-]{1,128}\Z")
NAME = re.compile(r"[A-Za-z0-9_.-]{1,128}\Z")
ENV_NAME = re.compile(r"[A-Za-z_][A-Za-z0-9_]*\Z")


class InventoryError(Exception):
    """Only constant, content-free diagnostic codes belong in this exception."""


def text(value, limit=512):
    return value if isinstance(value, str) and len(value) <= limit and all(
        ord(c) >= 32 and ord(c) != 127 for c in value
    ) else None


def fields(value, strings=(), booleans=()):
    """Typed allowlist; never copy a provider dictionary into the result."""
    if not isinstance(value, dict):
        return {}
    out = {key: text(value[key]) for key in strings if text(value.get(key)) is not None}
    out.update({key: value[key] for key in booleans if type(value.get(key)) is bool})
    return out


def required(value, key, pattern):
    candidate = value.get(key) if isinstance(value, dict) else None
    if not isinstance(candidate, str) or not pattern.fullmatch(candidate):
        raise InventoryError("invalid_item")
    return candidate


def account(value):
    return {"id": required(value, "id", ID), **fields(value, ("name",))}


def zone(value):
    out = {"id": required(value, "id", ID), **fields(value, ("name", "status", "type"), ("paused",))}
    if isinstance(value.get("account"), dict):
        out["account"] = account(value["account"])
    return out


def deployment(value):
    out = fields(value, ("id", "environment", "created_on", "modified_on"))
    if not isinstance(value, dict):
        return out
    # A deployment URL is an origin, not a place to persist a token-bearing URL.
    url = text(value.get("url"))
    if url:
        parsed = urllib.parse.urlsplit(url)
        if (parsed.scheme == "https" and parsed.hostname and parsed.hostname.endswith(".pages.dev")
                and not parsed.username and not parsed.password and not parsed.query
                and not parsed.fragment and parsed.path in ("", "/")):
            out["url"] = url
    out["latest_stage"] = fields(value.get("latest_stage"), ("name", "status"))
    trigger = value.get("deployment_trigger")
    if isinstance(trigger, dict):
        out["trigger"] = fields(trigger, ("type",))
        config = trigger.get("metadata")
        out["trigger"]["metadata"] = fields(config, ("branch",), ("commit_dirty",))
        commit = config.get("commit_hash") if isinstance(config, dict) else None
        if isinstance(commit, str) and re.fullmatch(r"[a-fA-F0-9]{7,64}", commit):
            out["trigger"]["metadata"]["commit_hash"] = commit
    return out


def project(value):
    out = {"name": required(value, "name", NAME), **fields(value, ("subdomain", "production_branch", "created_on"))}
    domains = value.get("domains")
    if isinstance(domains, list):
        out["domains"] = [entry for entry in domains if text(entry, 253) is not None]
    for key in ("canonical_deployment", "latest_deployment"):
        if isinstance(value.get(key), dict):
            out[key] = deployment(value[key])
    source = value.get("source")
    if isinstance(source, dict):
        out["source"] = fields(source, ("type",))
        out["source"].update(fields(source.get("config"), ("owner", "repo_name", "production_branch")))
    return out


def worker(value):
    return {"id": required(value, "id", NAME), **fields(value,
        ("created_on", "modified_on", "compatibility_date", "last_deployed_from"),
        ("has_assets", "has_modules"))}


def worker_domain(value):
    return {"id": required(value, "id", DOMAIN_ID), **fields(value,
        ("hostname", "service", "environment", "zone_id", "zone_name"))}


def page_domain(value):
    if not isinstance(value, dict) or text(value.get("name"), 253) is None:
        raise InventoryError("invalid_item")
    return fields(value, ("name", "status", "created_on"))


def route(value):
    return {"id": required(value, "id", ID), **fields(value, ("pattern", "script"))}


def dns_record(value):
    # Do not retain record content: TXT values, mail targets, and origin IPs
    # have no place in this surface inventory.
    return {"id": required(value, "id", ID), **fields(value, ("name", "type"), ("proxied",))}


def subdomain(value):
    if not isinstance(value, dict) or text(value.get("subdomain"), 253) is None:
        raise InventoryError("invalid_item")
    return fields(value, ("subdomain",))


def subdomain_enabled(value):
    if not isinstance(value, dict) or type(value.get("enabled")) is not bool:
        raise InventoryError("invalid_item")
    return fields(value, booleans=("enabled", "previews_enabled"))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # In particular, never forward an Authorization header elsewhere.
        return None


class Budget:
    def __init__(self, max_requests=2000, seconds=900):
        self.remaining = max_requests
        self.deadline = time.monotonic() + seconds
        self.lock = threading.Lock()

    def take(self):
        with self.lock:
            if self.remaining <= 0 or time.monotonic() >= self.deadline:
                return False
            self.remaining -= 1
            return True


class Client:
    def __init__(self, token, *, timeout=20, budget=None, opener=None):
        self._token = token
        self.timeout = timeout
        self.budget = budget or Budget()
        self.opener = opener or urllib.request.build_opener(NoRedirect())

    def get(self, path):
        if not path.startswith(("/accounts", "/zones")) or "\r" in path or "\n" in path:
            raise InventoryError("invalid_api_path")
        if not self.budget.take():
            return {"ok": False, "code": "request_budget_exhausted"}
        request = urllib.request.Request(API + path, method="GET", headers={
            "Authorization": "Bearer " + self._token,
            "Accept": "application/json", "User-Agent": "kingdom-cloudflare-inventory/1",
        })
        try:
            with self.opener.open(request, timeout=self.timeout) as response:
                if response.geturl().split("?", 1)[0] != (API + path).split("?", 1)[0]:
                    return {"ok": False, "code": "redirect_refused"}
                raw = response.read(MAX_RESPONSE + 1)
            if len(raw) > MAX_RESPONSE:
                return {"ok": False, "code": "response_too_large"}
            payload = json.loads(raw)
        except urllib.error.HTTPError as error:
            status_code = error.code
            error.close()
            return {"ok": False, "http_status": status_code, "code":
                "permission_denied" if status_code == 403 else
                "authentication_failed" if status_code == 401 else
                "redirect_refused" if 300 <= status_code < 400 else "http_error"}
        except (urllib.error.URLError, OSError, TimeoutError):
            return {"ok": False, "code": "transport_error"}
        except (ValueError, RecursionError):
            return {"ok": False, "code": "invalid_json"}
        if not isinstance(payload, dict) or payload.get("success") is not True:
            return {"ok": False, "code": "api_failure"}
        # Internal-only raw result; callers project it before persistence.
        return {"ok": True, "result": payload.get("result"), "pagination": payload.get("result_info")}


def failure(reply):
    out = {"code": reply["code"]}
    if type(reply.get("http_status")) is int:
        out["http_status"] = reply["http_status"]
    return out


def positive_integer(value):
    return type(value) is int and value >= 0


def listing(client, path, projector, *, per_page=None, max_pages=100):
    """Bounded pagination with explicit partial, malformed and drift outcomes."""
    out = {"endpoint": path, "page_size": per_page, "complete": False,
        "items": [], "pages_read": 0, "pages": [], "errors": []}
    seen = set()
    expected_total = None
    expected_pages = None
    for page in range(1, max_pages + 1):
        query = path
        if per_page is not None:
            query += ("&" if "?" in path else "?") + urllib.parse.urlencode({"page": page, "per_page": per_page})
        reply = client.get(query)
        visited = {"page": page, "ok": reply["ok"]}
        out["pages"].append(visited)
        if not reply["ok"]:
            visited.update(failure(reply))
            out["errors"].append(failure(reply))
            return out
        items = reply.get("result")
        if not isinstance(items, list):
            out["errors"].append({"code": "expected_list"})
            return out
        out["pages_read"] += 1
        visited["item_count"] = len(items)
        if len(out["items"]) + len(items) > MAX_ITEMS:
            out["errors"].append({"code": "item_limit"})
            return out
        for item in items:
            try:
                selected = projector(item)
            except (InventoryError, ValueError, TypeError):
                out["errors"].append({"code": "invalid_item"})
                continue
            identity = selected.get("id", selected.get("name"))
            if identity in seen:
                out["errors"].append({"code": "duplicate_item"})
                continue
            seen.add(identity)
            out["items"].append(selected)
        info = reply.get("pagination")
        if info is None:
            info = {}
        if not isinstance(info, dict) or any(
            key in info and not positive_integer(info[key])
            for key in ("page", "per_page", "count", "total_count", "total_pages")
        ) or any(key in info and info[key] == 0 for key in ("page", "per_page")):
            out["errors"].append({"code": "invalid_pagination"})
            return out
        if ("page" in info and info["page"] != page or
                "count" in info and info["count"] != len(items) or
                info.get("total_pages") == 0 and items or
                "per_page" in info and len(items) > info["per_page"]):
            out["errors"].append({"code": "inconsistent_pagination"})
            return out
        total = info.get("total_count")
        if total is not None:
            if expected_total is not None and total != expected_total:
                out["errors"].append({"code": "inventory_changed_during_pagination"})
                return out
            expected_total = total
        total_pages = info.get("total_pages")
        if total_pages is not None:
            if expected_pages is not None and total_pages != expected_pages:
                out["errors"].append({"code": "inventory_changed_during_pagination"})
                return out
            expected_pages = total_pages
        if per_page is None:
            # These endpoints are documented as SinglePage. Fail visibly if
            # a future API reports undisclosed remaining pages.
            finished = True
            if info.get("total_pages", 1) > 1:
                out["errors"].append({"code": "unexpected_pagination"})
        elif expected_pages is not None:
            finished = page >= expected_pages
        elif expected_total is not None:
            finished = len(out["items"]) >= expected_total
        else:
            # Without totals, require an empty terminal page rather than
            # treating a provider-imposed smaller page size as completion.
            finished = not items
        if finished:
            if expected_total is not None and len(out["items"]) != expected_total:
                out["errors"].append({"code": "count_mismatch"})
            out["complete"] = not out["errors"]
            return out
        if not items or out["errors"]:
            out["errors"].append({"code": "pagination_stalled"})
            return out
    out["errors"].append({"code": "page_limit"})
    return out


def object_read(client, path, projector):
    reply = client.get(path)
    if not reply["ok"]:
        return {"endpoint": path, "complete": False, "item": None, "errors": [failure(reply)]}
    try:
        item = projector(reply.get("result"))
    except (InventoryError, ValueError, TypeError):
        return {"endpoint": path, "complete": False, "item": None, "errors": [{"code": "invalid_item"}]}
    return {"endpoint": path, "complete": True, "item": item, "errors": []}


def collect(client, *, dns_client=None, max_pages=100):
    accounts = listing(client, "/accounts", account, per_page=50, max_pages=max_pages)
    # Explicitly include internal zones; Cloudflare's default excludes them.
    zones = listing(client, "/zones?type=full,partial,secondary,internal", zone,
                    per_page=50, max_pages=max_pages)
    out = {"schema": "kingdom.cloudflare-surfaces/1", "as_of": datetime.now(timezone.utc).isoformat(),
        "scope": "resources_visible_to_selected_credentials", "provider_writes": 0,
        "hosted_service_probes": 0, "credential_refreshes": 0,
        "accounts": accounts, "zones": zones, "accounts_inventory": [], "zone_routes": [],
        "zone_dns": [], "dns_requested": dns_client is not None}
    # A scoped credential can return a zone whose account is omitted from
    # /accounts. Inventory known accounts too; never pretend the list was complete.
    known_accounts = {item["id"] for item in accounts["items"]}
    known_accounts.update(item["account"]["id"] for item in zones["items"] if "account" in item)
    with ThreadPoolExecutor(max_workers=4) as pool:
        for account_id in sorted(known_accounts):
            base = "/accounts/" + account_id
            pages = listing(client, base + "/pages/projects", project, per_page=10, max_pages=max_pages)
            workers = listing(client, base + "/workers/scripts", worker)
            entry = {"account_id": account_id, "pages": pages, "workers": workers,
                "worker_domains": listing(client, base + "/workers/domains", worker_domain),
                "worker_subdomain": object_read(client, base + "/workers/subdomain", subdomain)}
            def project_domains(item):
                path = base + "/pages/projects/" + urllib.parse.quote(item["name"], safe="") + "/domains"
                return {"project": item["name"], **listing(client, path, page_domain)}
            entry["page_domains"] = list(pool.map(project_domains, pages["items"]))
            def worker_subdomains(item):
                path = base + "/workers/scripts/" + urllib.parse.quote(item["id"], safe="") + "/subdomain"
                return {"script": item["id"], **object_read(client, path, subdomain_enabled)}
            entry["worker_subdomains"] = list(pool.map(worker_subdomains, workers["items"]))
            out["accounts_inventory"].append(entry)
        def zone_metadata(item):
            base = "/zones/" + item["id"]
            routes = {"zone": item.get("name"), "zone_id": item["id"],
                **listing(client, base + "/workers/routes", route)}
            dns = {"zone": item.get("name"), "zone_id": item["id"], "complete": False,
                "items": [], "errors": [{"code": "not_requested"}]}
            if dns_client is not None:
                dns.update(listing(dns_client, base + "/dns_records", dns_record,
                    per_page=100, max_pages=max_pages))
            return routes, dns
        for routes, dns in pool.map(zone_metadata, zones["items"]):
            out["zone_routes"].append(routes)
            out["zone_dns"].append(dns)
    sets = [accounts, zones, *out["zone_routes"]]
    for entry in out["accounts_inventory"]:
        sets.extend(entry[key] for key in ("pages", "workers", "worker_domains", "worker_subdomain"))
        sets.extend(entry["page_domains"])
        sets.extend(entry["worker_subdomains"])
    if dns_client is not None:
        sets.extend(out["zone_dns"])
    out["complete"] = all(item["complete"] for item in sets)
    out["coverage"] = {"requested_sets": len(sets), "incomplete_sets": sum(not item["complete"] for item in sets)}
    return out


def credential(*, environ=None, config=None, home=None):
    environ = os.environ if environ is None else environ
    if "CLOUDFLARE_API_TOKEN" in environ:
        token = environ["CLOUDFLARE_API_TOKEN"]
        source = "child_environment"
    else:
        home = Path.home() if home is None else Path(home)
        if config is None:
            base = home / "Library/Preferences" if sys.platform == "darwin" else Path(
                environ.get("XDG_CONFIG_HOME", str(home / ".config")))
            candidates = [base / ".wrangler/config/default.toml", home / ".wrangler/config/default.toml"]
            config = next((p for p in candidates if p.is_file()), None)
        if config is None:
            raise InventoryError("credential_unavailable")
        try:
            descriptor = os.open(config, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
            with os.fdopen(descriptor, "rb") as stream:
                if not stat.S_ISREG(os.fstat(stream.fileno()).st_mode):
                    raise InventoryError("credential_config_unreadable")
                raw = stream.read(128 * 1024 + 1)
            if len(raw) > 128 * 1024:
                raise InventoryError("credential_config_too_large")
            token = tomllib.loads(raw.decode("utf-8")).get("oauth_token")
        except (OSError, ValueError):
            raise InventoryError("credential_config_unreadable") from None
        source = "existing_wrangler_oauth"
    if not isinstance(token, str) or not token or len(token) > 8192 or any(c.isspace() for c in token):
        raise InventoryError("credential_unavailable")
    return token, source


def open_private_output(path):
    """Refuse replacement, symlinks and shared output directories before reads."""
    path = Path(path).expanduser()
    try:
        descriptor = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            info = os.fstat(descriptor)
            if info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) & 0o077:
                raise InventoryError("output_directory_not_private")
            output = os.open(path.name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                             0o600, dir_fd=descriptor)
            os.fchmod(output, 0o600)
        finally:
            os.close(descriptor)
        return os.fdopen(output, "w", encoding="utf-8")
    except OSError:
        raise InventoryError("output_unavailable") from None


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, help="new JSON file in an existing owner-only directory")
    parser.add_argument("--wrangler-config", type=Path, help="read this existing OAuth config; never refresh it")
    parser.add_argument("--dns", action="store_true", help="also read DNS metadata using the selected credential")
    parser.add_argument("--dns-token-env", help="read DNS with this separate child-scoped environment variable")
    parser.add_argument("--max-pages", type=int, default=100)
    args = parser.parse_args(argv)
    if not 1 <= args.max_pages <= 1000:
        parser.error("--max-pages must be between 1 and 1000")
    try:
        token, source = credential(config=args.wrangler_config)
        dns_token = token if args.dns else None
        if args.dns_token_env:
            if not ENV_NAME.fullmatch(args.dns_token_env):
                raise InventoryError("invalid_dns_environment_name")
            dns_token, _ = credential(environ={"CLOUDFLARE_API_TOKEN": os.environ.get(args.dns_token_env)})
        budget = Budget()
        client = Client(token, budget=budget)
        dns_client = Client(dns_token, budget=budget) if dns_token is not None else None
        with open_private_output(args.output) as stream:
            result = collect(client, dns_client=dns_client, max_pages=args.max_pages)
            result["credential_source"] = source
            json.dump(result, stream, ensure_ascii=True, indent=2, allow_nan=False)
            stream.write("\n")
        print(json.dumps({"status": "complete" if result["complete"] else "partial",
            "accounts": len(result["accounts"]["items"]), "zones": len(result["zones"]["items"]),
            **result["coverage"], "provider_writes": 0, "hosted_service_probes": 0}))
        return 0 if result["complete"] else 1
    except InventoryError as error:
        print(json.dumps({"status": "failed", "code": str(error)}), file=sys.stderr)
        return 2
    except (OSError, ValueError, TypeError, KeyboardInterrupt):
        print('{"status":"failed","code":"collection_interrupted_or_failed"}', file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
