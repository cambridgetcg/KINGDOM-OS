#!/usr/bin/env python3
"""Read bounded Cloudflare aggregate traffic into a new private JSON snapshot.

No login, token refresh, provider mutation, hosted-service probe, or raw log export.
Adaptive counts are estimates, and independent views must never be added together.
Contracts: https://developers.cloudflare.com/analytics/graphql-api/
https://developers.cloudflare.com/analytics/graphql-api/features/discovery/settings/
https://developers.cloudflare.com/analytics/graphql-api/sampling/
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
import json
import math
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
SCHEMA = "kingdom.cloudflare-traffic/0.1"
MAX_RESPONSE = 8 * 1024 * 1024
MAX_OUTPUT = 8 * 1024 * 1024
MAX_ZONES = 1000
ID = re.compile(r"[a-fA-F0-9]{32}\Z")
HOST = re.compile(r"(?=.{1,253}\Z)[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.?\Z")
HTTP_DATASET = "httpRequestsAdaptiveGroups"
FIREWALL_DATASET = "firewallEventsAdaptiveGroups"
RUNTIME_DATASETS = {
    "workers": "workersInvocationsAdaptive",
    "pages_functions": "pagesFunctionsInvocationsAdaptiveGroups",
    "d1_operations": "d1AnalyticsAdaptiveGroups",
    "kv_operations": "kvOperationsAdaptiveGroups",
}
ACCOUNT_DIMS = {
    "workers": ("scriptName", "status"), "pages_functions": ("scriptName", "status"),
    "d1_operations": ("databaseId",),
    "kv_operations": ("namespaceId", "actionType", "responseStatusCode", "result"),
}
METRIC_NAMES = {
    "sum_edgeResponseBytes": "bytes", "sum_errors": "errors", "sum_subrequests": "subrequests",
    "sum_requests": "requests", "sum_readQueries": "read_queries", "sum_writeQueries": "write_queries",
    "sum_rowsRead": "rows_read", "sum_rowsWritten": "rows_written", "sum_objectBytes": "bytes",
}
ACCOUNT_METRICS = {
    "workers": ("sum_requests", "sum_errors", "sum_subrequests", "avg_sampleInterval"),
    "pages_functions": ("sum_requests", "sum_errors", "sum_subrequests", "avg_sampleInterval"),
    "d1_operations": ("sum_readQueries", "sum_writeQueries", "sum_rowsRead", "sum_rowsWritten", "avg_sampleInterval"),
    "kv_operations": ("sum_requests", "sum_objectBytes", "avg_sampleInterval"),
}
# Provider dimensions are a strict request allowlist. In particular, no query,
# raw User-Agent, IP, referrer, cookie, authorization, or user identifier is queried.
VIEWS = {
    "traffic_total": ((), 1),
    "hosts": (("clientRequestHTTPHost",), 300),
    "countries": (("clientCountryName",), 300),
    "methods": (("clientRequestHTTPMethodName", "edgeResponseStatus", "originResponseStatus"), 300),
    "operations": (("clientRequestPath", "clientRequestHTTPMethodName", "edgeResponseStatus"), 1000),
    "clients": (("userAgentBrowser", "verifiedBotCategory"), 300),
    "security": (("securityAction", "securitySource", "edgeResponseStatus"), 300),
    "request_sources": (("requestSource",), 300),
    "timeline": (("datetimeHour",), 1000),
}
DIMENSIONS = {
    "clientRequestHTTPHost": "clientRequestHTTPHost", "clientCountryName": "clientCountryName",
    "clientRequestHTTPMethodName": "clientRequestHTTPMethodName", "edgeResponseStatus": "edgeResponseStatus",
    "originResponseStatus": "originResponseStatus", "userAgentBrowser": "userAgentBrowser",
    "verifiedBotCategory": "verifiedBotCategory", "securityAction": "securityAction",
    "securitySource": "securitySource", "requestSource": "requestSource",
    "datetimeHour": "datetimeHour", "scriptName": "scriptName", "status": "status",
    "databaseId": "databaseId", "namespaceId": "namespaceId", "actionType": "actionType",
    "responseStatusCode": "responseStatusCode", "result": "result",
}
METHODS = frozenset({"GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "CONNECT", "TRACE"})
REASONS = frozenset({
    "permission_denied", "authentication_failed", "redirect_refused", "http_error",
    "transport_error", "response_too_large", "invalid_json", "invalid_response",
    "graphql_error", "api_failure", "request_budget_exhausted", "dataset_disabled",
    "settings_unavailable", "required_fields_unavailable", "window_exceeds_max_duration",
    "window_outside_retention", "security_events_not_collected",
})


class TrafficError(Exception):
    """Only fixed, content-free diagnostic codes are raised by this module."""


def integer(value, minimum=0, maximum=10**18):
    return type(value) is int and minimum <= value <= maximum


def number(value):
    return type(value) in (int, float) and 0 <= value <= 10**24 and math.isfinite(value)


def utc(value):
    return value.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def parse_utc(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|\+00:00)", value):
        raise TrafficError("invalid_window_end")
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise TrafficError("invalid_window_end") from None


def windows(now, window_end=None):
    if not isinstance(now, datetime) or now.tzinfo is None:
        raise TrafficError("invalid_clock")
    now = now.astimezone(timezone.utc)
    ceiling = now.replace(minute=0, second=0, microsecond=0)
    end = ceiling if window_end is None else parse_utc(window_end)
    if end > ceiling or end.minute or end.second or end.microsecond:
        raise TrafficError("invalid_window_end")
    return ({"start": utc(end - timedelta(days=1)), "end": utc(end)},
            {"start": utc(end - timedelta(days=7)), "end": utc(end)})


def strict_json(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("duplicate_key")
            result[key] = value
        return result
    def invalid_constant(_):
        raise ValueError("nonfinite_number")
    return json.loads(raw, object_pairs_hook=pairs, parse_constant=invalid_constant)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Budget:
    def __init__(self, requests=250, seconds=480):
        self.remaining = requests
        self.deadline = time.monotonic() + seconds
        self.lock = threading.Lock()

    def take(self):
        with self.lock:
            if self.remaining <= 0 or time.monotonic() >= self.deadline:
                return False
            self.remaining -= 1
            return True


def guarded_query(query, variables):
    """Accept only the two generated read query shapes and their bounded variables."""
    if not isinstance(query, str) or len(query) > 8192:
        raise TrafficError("invalid_query")
    # All our queries use variables: there are no quoted strings or comments.
    if not re.fullmatch(r"[A-Za-z0-9_$!{}():,\[\]\s]+", query.replace('"eyeball"', "eyeball")):
        raise TrafficError("invalid_query")
    tokens = re.findall(r"[A-Za-z_][A-Za-z0-9_]*", query)
    allowed = {
        "query", "TrafficSettings", "TrafficData", "tag", "start", "end", "limit",
        "string", "Time", "int", "viewer", "zones", "accounts", "filter", "zoneTag",
        "accountTag", "settings", "enabled", "availableFields", "maxPageSize", "maxDuration",
        "notOlderThan", "datetime_geq", "datetime_lt", "requestSource", "eyeball",
        "orderBy", "count_DESC", "sum_requests_DESC", "sum_readQueries_DESC", "datetimeHour_ASC",
        "count", "sum", "avg", "edgeResponseBytes", "sampleInterval", "requests",
        "errors", "subrequests", "readQueries", "writeQueries", "rowsRead", "rowsWritten", "objectBytes",
        "dimensions", HTTP_DATASET, FIREWALL_DATASET,
        *RUNTIME_DATASETS.values(), *DIMENSIONS, "clientRequestPath",
    }
    if (len(tokens) < 2 or tokens[0] != "query" or tokens[1] not in {"TrafficSettings", "TrafficData"}
            or tokens.count("query") != 1 or not set(tokens) <= allowed
            or query.count("{") != query.count("}") or not isinstance(variables, dict)):
        raise TrafficError("invalid_query")
    expected = {"tag"} if tokens[1] == "TrafficSettings" else {"tag", "start", "end", "limit"}
    if set(variables) != expected or not isinstance(variables.get("tag"), str) or not ID.fullmatch(variables["tag"]):
        raise TrafficError("invalid_query_variables")
    if "start" in variables:
        try:
            start, end = parse_utc(variables["start"]), parse_utc(variables["end"])
        except TrafficError:
            raise TrafficError("invalid_query_variables") from None
        if not (timedelta(0) < end - start <= timedelta(days=7)) or not integer(variables["limit"], 1, 1000):
            raise TrafficError("invalid_query_variables")


class Client:
    def __init__(self, token, *, opener=None, budget=None):
        self._token = token
        self.opener = opener or urllib.request.build_opener(NoRedirect())
        self.budget = budget or Budget()

    def _request(self, path, payload=None):
        if not self.budget.take():
            return {"ok": False, "code": "request_budget_exhausted"}
        url = API + path
        body = None if payload is None else json.dumps(payload, allow_nan=False).encode("utf-8")
        request = urllib.request.Request(url, data=body, method="GET" if body is None else "POST", headers={
            "Authorization": "Bearer " + self._token, "Accept": "application/json",
            "Content-Type": "application/json", "User-Agent": "kingdom-cloudflare-traffic/0.1",
        })
        try:
            with self.opener.open(request, timeout=30) as response:
                if response.geturl() != url:
                    return {"ok": False, "code": "redirect_refused"}
                raw = response.read(MAX_RESPONSE + 1)
            if len(raw) > MAX_RESPONSE:
                return {"ok": False, "code": "response_too_large"}
            result = strict_json(raw)
            if not isinstance(result, dict):
                return {"ok": False, "code": "invalid_response"}
            return {"ok": True, "payload": result}
        except urllib.error.HTTPError as error:
            code = error.code
            error.close()
            return {"ok": False, "code": "authentication_failed" if code == 401 else
                    "permission_denied" if code == 403 else "redirect_refused" if 300 <= code < 400 else "http_error"}
        except (urllib.error.URLError, OSError, TimeoutError):
            return {"ok": False, "code": "transport_error"}
        except (ValueError, RecursionError):
            return {"ok": False, "code": "invalid_json"}

    def get_zones_page(self, account_id, page):
        if not isinstance(account_id, str) or not ID.fullmatch(account_id) or not integer(page, 1, 20):
            raise TrafficError("invalid_zone_query")
        query = urllib.parse.urlencode({"account.id": account_id, "page": page, "per_page": 50,
                                      "type": "full,partial,secondary,internal"})
        reply = self._request("/zones?" + query)
        if reply["ok"] and reply["payload"].get("success") is not True:
            return {"ok": False, "code": "api_failure"}
        return reply

    def graphql(self, query, variables):
        guarded_query(query, variables)
        reply = self._request("/graphql", {"query": query, "variables": variables})
        if reply["ok"]:
            payload = reply["payload"]
            if payload.get("errors") is not None and not isinstance(payload["errors"], list):
                return {"ok": False, "code": "invalid_response"}
            if payload.get("errors"):
                # Even error messages and arbitrary extension codes may contain
                # queries or account data. Persist neither.
                return {"ok": False, "code": "graphql_error"}
            if not isinstance(payload.get("data"), dict):
                return {"ok": False, "code": "invalid_response"}
        return reply

    def get_metadata_page(self, account_id, kind, page):
        paths = {"pages": "/pages/projects", "d1": "/d1/database", "kv": "/storage/kv/namespaces"}
        if (not isinstance(account_id, str) or not ID.fullmatch(account_id)
                or kind not in paths or not integer(page, 1, 20)):
            raise TrafficError("invalid_metadata_query")
        query = urllib.parse.urlencode({"page": page, "per_page": 10 if kind == "pages" else 50})
        reply = self._request("/accounts/" + account_id + paths[kind] + "?" + query)
        if reply["ok"] and reply["payload"].get("success") is not True:
            return {"ok": False, "code": "api_failure"}
        return reply


def list_zones(client, account_id):
    zones, seen, expected, page_total = [], set(), None, None
    for page in range(1, 21):
        reply = client.get_zones_page(account_id, page)
        if not reply.get("ok"):
            raise TrafficError("zone_inventory_unavailable")
        payload = reply.get("payload", {})
        items, info = payload.get("result"), payload.get("result_info")
        if not isinstance(items, list) or len(items) > 50 or not isinstance(info, dict):
            raise TrafficError("zone_inventory_invalid")
        total, pages = info.get("total_count"), info.get("total_pages")
        if (not integer(total, 0, MAX_ZONES) or not integer(pages, 0, 20)
                or info.get("page") != page or type(info.get("page")) is not int
                or info.get("per_page") != 50 or type(info.get("per_page")) is not int
                or ("count" in info and (not integer(info["count"]) or info["count"] != len(items)))
                or (pages != math.ceil(total / 50) and not (total == 0 and pages == 1))):
            raise TrafficError("zone_inventory_invalid")
        if expected is None:
            expected, page_total = total, pages
        if total != expected or pages != page_total:
            raise TrafficError("zone_inventory_changed")
        for item in items:
            if not isinstance(item, dict):
                raise TrafficError("zone_inventory_invalid")
            tag, name, owner = item.get("id"), item.get("name"), item.get("account")
            if (not isinstance(tag, str) or not ID.fullmatch(tag) or tag in seen
                    or not isinstance(name, str) or not HOST.fullmatch(name)
                    or not isinstance(owner, dict) or owner.get("id") != account_id):
                raise TrafficError("zone_inventory_invalid")
            seen.add(tag)
            zones.append({"id": tag, "name": name.lower()})
        if page >= pages:
            if len(zones) != expected:
                raise TrafficError("zone_inventory_incomplete")
            return sorted(zones, key=lambda item: item["name"])
        if len(items) != 50:
            raise TrafficError("zone_inventory_incomplete")
    raise TrafficError("zone_inventory_incomplete")


def settings_query(scope):
    datasets = (HTTP_DATASET, FIREWALL_DATASET) if scope == "zone" else tuple(RUNTIME_DATASETS.values())
    container, tag = ("zones", "zoneTag") if scope == "zone" else ("accounts", "accountTag")
    body = " ".join(dataset + " { enabled availableFields maxPageSize maxDuration notOlderThan }" for dataset in datasets)
    return "query TrafficSettings($tag: string!) { viewer { " + container + "(filter: {" + tag + ": $tag}) { settings { " + body + " } } } }"


def scope_data(reply, scope):
    if not isinstance(reply, dict) or reply.get("ok") is not True:
        return None
    payload = reply.get("payload")
    data = payload.get("data") if isinstance(payload, dict) else None
    viewer = data.get("viewer") if isinstance(data, dict) else None
    groups = viewer.get("zones" if scope == "zone" else "accounts") if isinstance(viewer, dict) else None
    return groups[0] if isinstance(groups, list) and len(groups) == 1 and isinstance(groups[0], dict) else None


def read_settings(client, scope, tag):
    reply = client.graphql(settings_query(scope), {"tag": tag})
    data = scope_data(reply, scope)
    settings = data.get("settings") if data is not None else None
    if isinstance(settings, dict):
        return settings
    code = reply.get("code")
    reason = code if code in REASONS else "invalid_response"
    datasets = (HTTP_DATASET, FIREWALL_DATASET) if scope == "zone" else tuple(RUNTIME_DATASETS.values())
    return {dataset: {"_read_error": reason} for dataset in datasets}


def eligibility(setting, required, window, now):
    if not isinstance(setting, dict) or type(setting.get("enabled")) is not bool:
        return "settings_unavailable"
    if setting["enabled"] is False:
        return "dataset_disabled"
    fields = setting.get("availableFields")
    if (not isinstance(fields, list) or len(fields) > 2000
            or any(not isinstance(field, str) or len(field) > 160 for field in fields)
            or not integer(setting.get("maxPageSize"), 1, 100000)
            or not integer(setting.get("maxDuration"), 1)
            or not integer(setting.get("notOlderThan"), 1)):
        return "settings_unavailable"
    if not set(required) <= set(fields):
        return "required_fields_unavailable"
    start, end = parse_utc(window["start"]), parse_utc(window["end"])
    if (end - start).total_seconds() > setting["maxDuration"]:
        return "window_exceeds_max_duration"
    if (now - start).total_seconds() > setting["notOlderThan"]:
        return "window_outside_retention"
    return None


def data_query(scope, dataset, dims, metrics, view):
    container, tag = ("zones", "zoneTag") if scope == "zone" else ("accounts", "accountTag")
    filters = "datetime_geq: $start, datetime_lt: $end"
    if scope == "zone" and view != "request_sources":
        filters += ', requestSource: "eyeball"'
    # ZoneHttpRequestsAdaptiveGroupsOrderBy introspection, 2026-09-25:
    # datetimeHour_ASC / datetimeHour_DESC (no dimensions_ prefix).
    order = "datetimeHour_ASC" if view == "timeline" else "count_DESC" if scope == "zone" else "sum_readQueries_DESC" if view == "d1_operations" else "sum_requests_DESC"
    selected = []
    if scope == "zone":
        selected.append("count")
    sums = [field[4:] for field in metrics if field.startswith("sum_")]
    if sums:
        selected.append("sum { " + " ".join(sums) + " }")
    if "avg_sampleInterval" in metrics:
        selected.append("avg { sampleInterval }")
    if dims:
        selected.append("dimensions { " + " ".join(dims) + " }")
    return ("query TrafficData($tag: string!, $start: Time!, $end: Time!, $limit: int!) { viewer { "
            + container + "(filter: {" + tag + ": $tag}) { " + dataset
            + "(limit: $limit, filter: {" + filters + "}, orderBy: [" + order + "]) { "
            + " ".join(selected) + " } } } }")


def route_family(raw, method):
    """Lossy heuristic only; never return request-derived text or infer intent."""
    if not isinstance(raw, str) or len(raw) > 8192:
        return "other"
    path = raw.split("?", 1)[0].split("#", 1)[0].lower()
    for _ in range(2):
        path = urllib.parse.unquote(path, errors="replace")
    if not path.startswith("/") or any(ord(c) < 32 for c in path):
        return "other"
    parts = path.split("/")
    if (any(part in {".git", ".svn", ".aws", ".ssh", "wp-admin", "phpmyadmin"} or part.startswith(".env") for part in parts)
            or parts[-1] in {"wp-login.php", "wp-config.php", "config.php", "configuration.php",
                             "composer.json", "package.json", ".ds_store", "server-status"}):
        return "config-probe"
    if path in {"/agent-entry.json", "/agents.json", "/llms.txt", "/llms-full.txt", "/robots.txt", "/sitemap.xml"} or path.startswith("/.well-known/"):
        return "discovery"
    if path in {"/", "/index.html", "/index.htm"}:
        return "human-root"
    if re.match(r"/(?:api|v[0-9]+|graphql|mcp|rpc|public)(?:/|$)", path):
        return "api-read" if method in {"GET", "HEAD", "OPTIONS"} else "api-write-attempt"
    if path.startswith(("/assets/", "/static/")) or re.search(r"\.(?:css|js|mjs|map|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot)$", path):
        return "static"
    return "other"


def dimension(key, value, window):
    if key in {"edgeResponseStatus", "originResponseStatus", "responseStatusCode"}:
        if not integer(value, 0, 599):
            raise TrafficError("invalid_response")
        return value
    maximum = 259 if key == "clientRequestHTTPHost" else 253
    if not isinstance(value, str) or len(value) > maximum or any(ord(c) < 32 or ord(c) == 127 for c in value):
        raise TrafficError("invalid_response")
    if key == "clientRequestHTTPMethodName":
        return value if value in METHODS else "OTHER"
    if key == "clientRequestHTTPHost":
        host, separator, port = value.partition(":")
        if (value and not HOST.fullmatch(host)) or (separator and (
                not re.fullmatch(r"[0-9]{1,5}", port) or not 1 <= int(port) <= 65535)):
            raise TrafficError("invalid_response")
        return value.lower()
    if key == "clientCountryName":
        if value and not re.fullmatch(r"[A-Z0-9]{2,3}", value):
            raise TrafficError("invalid_response")
    elif key == "datetimeHour":
        try:
            hour = parse_utc(value)
        except TrafficError:
            raise TrafficError("invalid_response") from None
        if hour.minute or hour.second or not parse_utc(window["start"]) <= hour < parse_utc(window["end"]):
            raise TrafficError("invalid_response")
        return utc(hour)
    elif key == "scriptName":
        if not re.fullmatch(r"[A-Za-z0-9_.-]{1,128}", value):
            raise TrafficError("invalid_response")
    elif key in {"databaseId", "namespaceId"}:
        if not re.fullmatch(r"[a-fA-F0-9-]{1,64}", value):
            raise TrafficError("invalid_response")
    elif key in {"userAgentBrowser", "verifiedBotCategory"}:
        if not re.fullmatch(r"[A-Za-z0-9 _./()+&-]{0,80}", value):
            raise TrafficError("invalid_response")
    elif not re.fullmatch(r"[A-Za-z0-9 _./()+-]{0,80}", value):
        raise TrafficError("invalid_response")
    return value


def project_rows(raw, *, scope, dims, metrics, view, window, limit):
    if not isinstance(raw, list) or len(raw) > limit:
        raise TrafficError("invalid_response")
    rows = []
    for item in raw:
        if not isinstance(item, dict):
            raise TrafficError("invalid_response")
        sums = item.get("sum", {})
        if not isinstance(sums, dict):
            raise TrafficError("invalid_response")
        row = {"dimensions": {}}
        if scope == "zone":
            count = item.get("count")
            if not number(count):
                raise TrafficError("invalid_response")
            row["requests"] = count
        for metric, output in METRIC_NAMES.items():
            if metric in metrics:
                value = sums.get(metric[4:])
                if not number(value):
                    raise TrafficError("invalid_response")
                row[output] = value
        if "avg_sampleInterval" in metrics:
            avg = item.get("avg")
            value = avg.get("sampleInterval") if isinstance(avg, dict) else None
            if not number(value) or value < 1:
                raise TrafficError("invalid_response")
            row["sample_interval"] = value
        provider_dims = item.get("dimensions", {})
        if not isinstance(provider_dims, dict):
            raise TrafficError("invalid_response")
        for key in dims:
            if key != "clientRequestPath":
                row["dimensions"][DIMENSIONS[key]] = dimension(key, provider_dims.get(key), window)
        if view == "operations":
            # Raw paths exist only transiently inside this local call. They never
            # enter an observation, error, diagnostic, or serialized artifact.
            if not isinstance(provider_dims.get("clientRequestPath"), str):
                raise TrafficError("invalid_response")
            row["dimensions"]["route_family"] = route_family(provider_dims["clientRequestPath"], row["dimensions"]["clientRequestHTTPMethodName"])
        rows.append(row)
    if view == "operations":
        grouped = {}
        for row in rows:
            key = tuple(sorted(row["dimensions"].items()))
            current = grouped.setdefault(key, {"requests": 0, "dimensions": row["dimensions"]})
            for metric in ("requests", "bytes"):
                if metric in row:
                    current[metric] = current.get(metric, 0) + row[metric]
            # An average-of-averages after collapsing raw path groups would be
            # misleading. Retain this estimate only when all group values agree.
            if "sample_interval" in row:
                current.setdefault("_intervals", set()).add(row["sample_interval"])
        rows = []
        for row in grouped.values():
            intervals = row.pop("_intervals", set())
            if len(intervals) == 1:
                row["sample_interval"] = intervals.pop()
            rows.append(row)
    return sorted(rows, key=lambda row: (-row.get("requests", row.get("read_queries", 0)), json.dumps(row["dimensions"], sort_keys=True))) if view != "timeline" else sorted(rows, key=lambda row: row["dimensions"]["datetimeHour"])


def observation(scope, name, view, dataset, window, group_limit):
    return {"scope": scope, "name": name, "view": view, "dataset": dataset,
            "state": "unavailable", "window": dict(window), "sampled": True,
            "group_limit": group_limit, "rows_received": 0, "truncated": False, "rows": []}


def collect_view(client, scope, tag, name, view, dataset, setting, window, now):
    dims, requested_limit = VIEWS[view] if scope == "zone" else (ACCOUNT_DIMS[view], 1000)
    obs = observation(scope, name, view, dataset, window, requested_limit)
    if isinstance(setting, dict) and setting.get("_read_error") in REASONS:
        obs.update(state="error", reason=setting["_read_error"])
        return obs
    required = ["count"] if scope == "zone" else ["sum_readQueries", "sum_writeQueries", "sum_rowsRead", "sum_rowsWritten"] if view == "d1_operations" else ["sum_requests"]
    required += ["dimensions_" + key for key in dims]
    reason = eligibility(setting, required, window, now)
    if reason:
        obs["reason"] = reason
        return obs
    limit = min(requested_limit, setting["maxPageSize"])
    obs["group_limit"] = limit
    candidates = ("sum_edgeResponseBytes", "avg_sampleInterval") if scope == "zone" else ACCOUNT_METRICS[view]
    metrics = [field for field in candidates if field in setting["availableFields"]]
    missing = [field for field in candidates if field not in metrics]
    if missing:
        obs["missing_metrics"] = missing
    reply = client.graphql(data_query(scope, dataset, dims, metrics, view),
                           {"tag": tag, **window, "limit": limit})
    if not reply.get("ok"):
        code = reply.get("code")
        obs.update(state="error", reason=code if code in REASONS else "invalid_response")
        return obs
    data = scope_data(reply, scope)
    raw = data.get(dataset) if data is not None else None
    try:
        rows = project_rows(raw, scope=scope, dims=dims, metrics=metrics, view=view, window=window, limit=limit)
    except TrafficError:
        obs.update(state="error", reason="invalid_response")
        return obs
    obs.update(state="ok", rows_received=len(raw), rows=rows,
               truncated=bool(dims) and len(raw) == limit)
    return obs


def metadata_names(client, account_id, kind):
    """Project exact service-ID/name metadata, never bindings or deployment config."""
    names, seen, expected = {}, set(), None
    per_page = 10 if kind == "pages" else 50
    complete_fields = True
    for page in range(1, 21):
        reply = client.get_metadata_page(account_id, kind, page)
        if reply.get("ok") is not True:
            return names, False
        payload = reply.get("payload", {})
        items, info = payload.get("result"), payload.get("result_info")
        if not isinstance(items, list) or len(items) > per_page or not isinstance(info, dict):
            return names, False
        total = info.get("total_count")
        if (not integer(total, 0, 20 * per_page) or type(info.get("page")) is not int or info["page"] != page
                or type(info.get("per_page")) is not int or info["per_page"] != per_page
                or ("count" in info and (not integer(info["count"]) or info["count"] != len(items)))):
            return names, False
        pages = max(1, math.ceil(total / per_page))
        if ("total_pages" in info and (not integer(info["total_pages"]) or info["total_pages"] not in ({0, 1} if total == 0 else {pages}))) or (expected is not None and expected != total):
            return names, False
        expected = total
        for item in items:
            if not isinstance(item, dict):
                return names, False
            identity = item.get("name") if kind == "pages" else item.get("uuid") if kind == "d1" else item.get("id")
            name = item.get("name") if kind != "kv" else item.get("title")
            if (not isinstance(identity, str) or not re.fullmatch(r"[A-Za-z0-9_.-]{1,128}", identity)
                    or identity in seen or not isinstance(name, str)
                    or not re.fullmatch(r"[A-Za-z0-9 _.()+-]{1,128}", name)):
                return names, False
            seen.add(identity)
            if kind == "pages":
                found = False
                for key in ("production_script_name", "preview_script_name"):
                    script = item.get(key)
                    if script is None or script == "":
                        continue
                    if not isinstance(script, str) or not re.fullmatch(r"[A-Za-z0-9_.-]{1,128}", script):
                        return names, False
                    if script in names and names[script] != name:
                        return {}, False
                    names[script] = name
                    found = True
                if not found:
                    complete_fields = False
            else:
                names[identity] = name
        if page >= pages:
            return names, complete_fields and len(seen) == total
        if len(items) != per_page:
            return names, False
    return names, False


def collect(client, account_id, *, now=None, window_end=None):
    if not isinstance(account_id, str) or not ID.fullmatch(account_id):
        raise TrafficError("invalid_account_id")
    now = datetime.now(timezone.utc) if now is None else now
    window, history = windows(now, window_end)
    zones = list_zones(client, account_id)
    account_settings = read_settings(client, "account", account_id)
    observations = [collect_view(client, "account", account_id, "Cloudflare account", view, dataset,
                                 account_settings.get(dataset), window, now)
                    for view, dataset in RUNTIME_DATASETS.items()]
    metadata_gaps = []
    for kind, view, id_key, name_key in (("pages", "pages_functions", "scriptName", "projectName"),
                                        ("d1", "d1_operations", "databaseId", "databaseName"),
                                        ("kv", "kv_operations", "namespaceId", "namespaceName")):
        names, complete = metadata_names(client, account_id, kind)
        if not complete:
            metadata_gaps.append(kind + "_name_lookup_incomplete")
        for obs in observations:
            if obs["view"] != view:
                continue
            for row in obs["rows"]:
                identity = row["dimensions"][id_key]
                if identity in names:
                    row["dimensions"][name_key] = names[identity]
                elif kind + "_identity_unmapped" not in metadata_gaps:
                    metadata_gaps.append(kind + "_identity_unmapped")

    def zone_views(zone):
        settings = read_settings(client, "zone", zone["id"])
        out = [collect_view(client, "zone", zone["id"], zone["name"], view, HTTP_DATASET,
                            settings.get(HTTP_DATASET), history if view == "timeline" else window, now)
               for view in VIEWS]
        security = observation("zone", zone["name"], "security_events", FIREWALL_DATASET, window, 300)
        setting = settings.get(FIREWALL_DATASET)
        security["reason"] = "dataset_disabled" if isinstance(setting, dict) and setting.get("enabled") is False else "security_events_not_collected" if isinstance(setting, dict) and setting.get("enabled") is True else "settings_unavailable"
        if isinstance(setting, dict) and setting.get("_read_error") in REASONS:
            security.update(state="error", reason=setting["_read_error"])
        out.append(security)
        return out

    with ThreadPoolExecutor(max_workers=3) as pool:
        for zone_observations in pool.map(zone_views, zones):
            observations.extend(zone_observations)
    counts = {state: sum(item["state"] == state for item in observations) for state in ("ok", "unavailable", "error")}
    limitations = [
        "credential_visible_account_scope_only", "adaptive_estimates_not_unique_people",
        "independent_views_not_additive", "runtime_invocations_not_unique_edge_requests",
        "zone_http_excludes_unproxied_and_direct_provider_host_traffic",
        "route_families_are_lossy_heuristics_not_intent_or_success",
        "operation_families_aggregate_only_returned_top_path_groups",
        "security_actions_do_not_prove_malice", "no_raw_logs_or_new_telemetry_enabled",
        "account_runtime_timeline_not_collected", "runtime_cpu_units_not_assumed",
        "application_reads_may_write_quota_or_housekeeping_state",
        "storage_writes_do_not_alone_establish_business_actions_or_request_causality",
    ]
    limitations.extend(metadata_gaps)
    if any(item["truncated"] for item in observations):
        limitations.append("group_limit_reached_population_may_be_incomplete")
    if any(item.get("missing_metrics") for item in observations):
        limitations.append("optional_metrics_unavailable")
    return {"schema": SCHEMA, "observed_at": utc(now), "window": window, "history_window": history,
            "provider_writes": False, "scope": {"account_id": account_id, "zones_expected": len(zones),
            "zone_names": [item["name"] for item in zones]}, "observations": observations,
            "limitations": limitations, "coverage": {
                "complete": counts["unavailable"] == counts["error"] == 0 and not metadata_gaps and not any(item["truncated"] or item.get("missing_metrics") for item in observations),
                "observations": len(observations), "ok": counts["ok"],
                "unavailable": counts["unavailable"], "errors": counts["error"]}}


def credential(*, environ=None, home=None):
    environ = os.environ if environ is None else environ
    if "CLOUDFLARE_API_TOKEN" in environ:
        token = environ["CLOUDFLARE_API_TOKEN"]
    else:
        home = Path.home() if home is None else Path(home)
        base = home / "Library/Preferences" if sys.platform == "darwin" else Path(environ.get("XDG_CONFIG_HOME", str(home / ".config")))
        candidates = (base / ".wrangler/config/default.toml", home / ".wrangler/config/default.toml")
        config = next((path for path in candidates if path.exists() or path.is_symlink()), None)
        if config is None:
            raise TrafficError("credential_unavailable")
        try:
            fd = os.open(config, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
            with os.fdopen(fd, "rb") as stream:
                info = os.fstat(stream.fileno())
                if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid():
                    raise TrafficError("credential_config_unreadable")
                raw = stream.read(128 * 1024 + 1)
            if len(raw) > 128 * 1024:
                raise TrafficError("credential_config_unreadable")
            token = tomllib.loads(raw.decode("utf-8")).get("oauth_token")
        except (OSError, ValueError):
            raise TrafficError("credential_config_unreadable") from None
    if not isinstance(token, str) or not token or len(token) > 8192 or any(ord(c) <= 32 or ord(c) == 127 or c.isspace() for c in token):
        raise TrafficError("credential_unavailable")
    return token


@contextmanager
def private_output(path):
    """Reserve a new owner-only regular file before credentials or API reads."""
    path = Path(path).expanduser()
    directory = fd = None
    completed = False
    try:
        directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        info = os.fstat(directory)
        if info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) & 0o077:
            raise TrafficError("output_directory_not_private")
        fd = os.open(path.name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=directory)
        os.fchmod(fd, 0o600)
        created = os.fstat(fd)
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            fd = None
            yield stream
            stream.flush()
            os.fsync(stream.fileno())
        completed = True
    except OSError:
        raise TrafficError("output_unavailable") from None
    finally:
        if fd is not None:
            os.close(fd)
        if directory is not None:
            if not completed and "created" in locals():
                try:
                    current = os.stat(path.name, dir_fd=directory, follow_symlinks=False)
                    if (current.st_dev, current.st_ino) == (created.st_dev, created.st_ino):
                        os.unlink(path.name, dir_fd=directory)
                except OSError:
                    pass
            os.close(directory)


def write_snapshot(stream, snapshot):
    encoded = json.dumps(snapshot, ensure_ascii=True, indent=2, allow_nan=False) + "\n"
    if len(encoded) > MAX_OUTPUT:
        raise TrafficError("snapshot_too_large")
    stream.write(encoded)


def safe_write_new(path, snapshot):
    with private_output(path) as stream:
        write_snapshot(stream, snapshot)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--account-id", required=True, help="32 hexadecimal characters")
    parser.add_argument("--output", required=True, help="new file in an existing owner-only directory")
    parser.add_argument("--window-end", help="completed UTC hour, for example 2026-09-25T12:00:00Z")
    args = parser.parse_args(argv)
    try:
        if not ID.fullmatch(args.account_id):
            raise TrafficError("invalid_account_id")
        now = datetime.now(timezone.utc)
        windows(now, args.window_end)
        with private_output(args.output) as stream:
            client = Client(credential())
            result = collect(client, args.account_id, now=now, window_end=args.window_end)
            write_snapshot(stream, result)
        print(json.dumps({"status": "complete" if result["coverage"]["complete"] else "partial",
                          **result["coverage"], "provider_writes": False}))
        return 0  # A valid partial snapshot is useful; it is never called complete.
    except TrafficError as error:
        print(json.dumps({"status": "failed", "code": str(error)}), file=sys.stderr)
        return 2
    except (OSError, ValueError, TypeError, RecursionError, KeyboardInterrupt):
        print('{"status":"failed","code":"collection_interrupted_or_failed"}', file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
