#!/usr/bin/env python3
"""Render a private, offline Cloudflare traffic snapshot as Markdown and HTML.

Rendering success does not mean analytics coverage is complete. No network,
application actions, external assets, telemetry, or provider writes are used.
"""
import argparse
import base64
from datetime import datetime
import hashlib
import html
import json
import math
import os
from pathlib import Path
import re
import secrets
import stat
import sys

SCHEMA = "kingdom.cloudflare-traffic/0.1"
MAX_BYTES = 8 * 1024 * 1024
MAX_REPORT_BYTES = 32 * 1024 * 1024
MAX_ROWS = 50_000
VIEWS = {
    "traffic_total": "Edge totals", "hosts": "Hostnames", "countries": "Network origins",
    "methods": "HTTP methods", "operations": "Operations and edge outcomes",
    "clients": "Client classifications", "security": "Security decisions",
    "security_events": "Security event coverage",
    "request_sources": "Request sources", "timeline": "Timeline",
    "workers": "Worker execution", "pages_functions": "Pages Function execution",
    "d1_operations": "D1 database operations", "kv_operations": "KV storage operations",
}
DIMENSIONS = {
    "clientCountryName": "Network country", "clientRequestHTTPHost": "Hostname",
    "clientRequestHTTPMethodName": "HTTP method", "route_family": "Route family",
    "edgeResponseStatus": "Edge HTTP", "originResponseStatus": "Origin HTTP",
    "requestSource": "Request source", "cacheStatus": "Cache",
    "userAgentBrowser": "Browser claim (unverified)",
    "verifiedBotCategory": "Cloudflare verified bot category",
    "securityAction": "Security action", "securitySource": "Security source",
    "datetimeHour": "UTC hour", "scriptName": "Runtime identifier", "status": "Runtime outcome",
    "projectName": "Pages project (exact API mapping)",
    "databaseId": "Database identifier", "databaseName": "Database name (exact mapping)",
    "namespaceId": "Namespace identifier", "namespaceName": "Namespace name (exact mapping)",
    "actionType": "Storage operation", "responseStatusCode": "Storage response code", "result": "Storage result",
}
ROUTES = {"discovery", "human-root", "static", "api-read", "api-write-attempt", "config-probe", "other"}
METRICS = {"requests": "Requests", "bytes": "Response bytes", "errors": "Runtime errors",
           "subrequests": "Subrequests", "sample_interval": "Sample interval",
           "cpu_p50": "CPU p50 (provider units)", "cpu_p99": "CPU p99 (provider units)",
           "read_queries": "Read queries", "write_queries": "Write queries",
           "rows_read": "Rows read", "rows_written": "Rows written"}
BOUNDARIES = [
    "Requests are requests, not people. Network geography is not a person's identity or location; browser labels are client claims, not verified identity.",
    "Edge HTTP status and successful runtime execution do not establish business effects. A write-method attempt does not prove a message, database write, purchase, or other action completed; effects remain unknown here.",
    "Edge requests, security decisions, and Worker/Pages executions are separate observations. They overlap and must not be added. Subrequests can include static asset fetches.",
    "Storage write queries and rows written are evidence at the storage service boundary, not business outcomes or proof of which HTTP request caused them. KV operation/result counters describe storage operations, not the meaning of stored data. No SQL text, keys or row content is included.",
    "In this estate, Civic GET/HEAD handlers can update quota counters and perform expiry cleanup. Storage writes may therefore be housekeeping, including effects of earlier release checks. This observer reads provider analytics and does not invoke application endpoints.",
    "Sampled request counts are provider estimates already adjusted for sampling. Do not multiply by sample interval. A missing sample or unavailable dataset does not establish zero activity.",
]
RELEASE_PROBE_NOTE = "This report includes windows overlapping 2026-09-25, when known release verification and monitoring probes ran. Their requests may be included; this snapshot cannot reliably isolate or subtract them, so no visitor-only claim is made."


def text(value, limit=2048):
    if not isinstance(value, str) or not value or len(value) > limit or any(ord(c) < 32 or ord(c) == 127 for c in value):
        raise ValueError("invalid bounded text")
    return value


def integer(value, maximum=MAX_ROWS):
    if type(value) is not int or not 0 <= value <= maximum:
        raise ValueError("invalid bounded count")


def timestamp(value):
    text(value, 64)
    result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if result.tzinfo is None:
        raise ValueError("timestamp requires a timezone")
    return result


def window(value):
    if not isinstance(value, dict) or set(value) != {"start", "end"} or timestamp(value["start"]) >= timestamp(value["end"]):
        raise ValueError("invalid observation window")


def validate(data):
    if not isinstance(data, dict) or data.get("schema") != SCHEMA or data.get("provider_writes") is not False:
        raise ValueError("unsupported read-only snapshot")
    timestamp(data.get("observed_at"))
    window(data.get("window"))
    window(data.get("history_window"))
    scope = data.get("scope")
    if not isinstance(scope, dict):
        raise ValueError("scope required")
    integer(scope.get("zones_expected"), 10_000)
    text(scope.get("account_id"), 256)
    names = scope.get("zone_names", [])
    if not isinstance(names, list) or len(names) > scope["zones_expected"]:
        raise ValueError("invalid expected zones")
    for name in names:
        text(name, 512)
    if len(names) != len(set(names)):
        raise ValueError("duplicate expected zone")
    limitations = data.get("limitations")
    if not isinstance(limitations, list) or len(limitations) > 100:
        raise ValueError("invalid limitations")
    for item in limitations:
        text(item)
    observations = data.get("observations")
    if not isinstance(observations, list) or len(observations) > 5000:
        raise ValueError("invalid observations")
    total_rows = 0
    for observation in observations:
        if not isinstance(observation, dict) or observation.get("scope") not in {"zone", "account"} or observation.get("view") not in VIEWS or observation.get("state") not in {"ok", "unavailable", "error"}:
            raise ValueError("invalid observation identity")
        text(observation.get("name"), 512)
        text(observation.get("dataset"), 256)
        window(observation.get("window"))
        for key in ("sampled", "truncated"):
            if type(observation.get(key)) is not bool:
                raise ValueError("observation flag must be boolean")
        integer(observation.get("group_limit"))
        integer(observation.get("rows_received"))
        rows = observation.get("rows")
        if not isinstance(rows, list) or (len(rows) > observation["rows_received"] if observation["view"] == "operations" else len(rows) != observation["rows_received"]):
            raise ValueError("row count mismatch")
        total_rows += len(rows)
        if total_rows > MAX_ROWS:
            raise ValueError("too many rows")
        if observation["state"] != "ok" and rows:
            raise ValueError("unavailable data cannot contain successful rows")
        if "reason" in observation:
            text(observation["reason"])
        for row in rows:
            if not isinstance(row, dict) or set(row) - (set(METRICS) | {"dimensions"}) or (observation["view"] != "d1_operations" and "requests" not in row):
                raise ValueError("unexpected row field")
            for key in set(row) & set(METRICS):
                value = row[key]
                if type(value) not in (int, float) or not 0 <= value <= 1e18 or not math.isfinite(value):
                    raise ValueError("invalid numeric metric")
            dimensions = row.get("dimensions")
            if not isinstance(dimensions, dict) or set(dimensions) - set(DIMENSIONS):
                raise ValueError("unexpected or raw telemetry dimension")
            for key, value in dimensions.items():
                if key == "route_family" and value not in ROUTES:
                    raise ValueError("raw route or unknown route family")
                if value is not None:
                    if isinstance(value, str):
                        if value:
                            text(value, 1024)
                    elif type(value) is int:
                        integer(value, 1_000_000_000)
                    else:
                        raise ValueError("invalid dimension value")
    coverage = data.get("coverage")
    if not isinstance(coverage, dict) or type(coverage.get("complete")) is not bool:
        raise ValueError("coverage required")
    counts = {"observations": len(observations), "ok": 0, "unavailable": 0, "errors": 0}
    for observation in observations:
        counts["errors" if observation["state"] == "error" else observation["state"]] += 1
    for key, actual in counts.items():
        integer(coverage.get(key), 5000)
        if coverage[key] != actual:
            raise ValueError("coverage counts disagree")
    if coverage["complete"] and any(o["state"] != "ok" or o["truncated"] for o in observations):
        raise ValueError("coverage claims completeness despite missing data")


def number(value):
    if value is None:
        return "Unknown"
    return f"{value:,.0f}" if value == int(value) else f"{value:,.2f}"


def md(value):
    escaped = html.escape(str(value), quote=False)
    return re.sub(r"([\\`*_{}\[\]()#!|])", r"\\\1", escaped)


def window_label(value):
    return value["start"] + " → " + value["end"]


def evidence_limits(data):
    limits = list(BOUNDARIES)
    probe_start = timestamp("2026-09-25T00:00:00Z")
    probe_end = timestamp("2026-09-26T00:00:00Z")
    windows = [data["window"], data["history_window"]] + [o["window"] for o in data["observations"]]
    if any(timestamp(w["start"]) < probe_end and timestamp(w["end"]) > probe_start for w in windows):
        limits.append(RELEASE_PROBE_NOTE)
    return limits + data["limitations"]


def zone_totals(data):
    names = set(data["scope"].get("zone_names", [])) | {o["name"] for o in data["observations"] if o["scope"] == "zone"}
    result = []
    for name in sorted(names):
        candidates = [o for o in data["observations"] if o["scope"] == "zone" and o["name"] == name and o["view"] == "traffic_total" and o["window"] == data["window"]]
        eligible = len(candidates) == 1 and candidates[0]["state"] == "ok" and not candidates[0]["truncated"] and bool(candidates[0]["rows"])
        if eligible:
            observation = candidates[0]
            result.append((name, sum(row["requests"] for row in observation["rows"]), "Sampled estimate" if observation["sampled"] else "Observed"))
        else:
            result.append((name, None, "Unknown — missing, degraded, truncated, or ambiguous total"))
    return result


def coverage_label(data):
    totals = zone_totals(data)
    full = data["coverage"]["complete"] and len(totals) == data["scope"]["zones_expected"] and all(value is not None for _, value, _ in totals)
    return "Complete for requested datasets" if full else "Degraded / incomplete coverage"


def status_label(observation):
    if observation["state"] != "ok":
        return observation["state"].capitalize() + " — activity unknown"
    flags = ["Sampled estimate" if observation["sampled"] else "Observed"]
    if observation["truncated"]:
        flags.append("TRUNCATED — returned groups only")
    if not observation["rows"]:
        flags.append("No rows returned (not proof of no activity)")
    return " · ".join(flags)


def group_label(observation):
    if observation["view"] == "operations":
        return f"Raw returned groups: {observation['rows_received']}; normalized route groups: {len(observation['rows'])}; raw group limit: {observation['group_limit']}."
    return f"Returned groups: {observation['rows_received']}; group limit: {observation['group_limit']}."


def dataset_coverage(data):
    coverage = data["coverage"]
    return f"Datasets: {coverage['ok']} available, {coverage['unavailable']} unavailable, {coverage['errors']} errors; {sum(o['truncated'] for o in data['observations'])} truncated views."


def columns(observation):
    keys = {key for row in observation["rows"] for key in row["dimensions"]}
    dimensions = [key for key in DIMENSIONS if key in keys]
    metrics = [key for key in METRICS if any(key in row for row in observation["rows"])]
    return [(key, DIMENSIONS[key], True) for key in dimensions] + [(key, METRICS[key], False) for key in metrics]


def cell(row, key, dimension):
    value = row["dimensions"].get(key) if dimension else row.get(key)
    if value is None or value == "":
        return "Unknown / unclassified" if dimension else "Not supplied"
    if key == "originResponseStatus" and value in (0, "0"):
        return "0 — no origin response recorded"
    return str(value) if dimension else number(value)


def ordered_rows(observation):
    if observation["view"] == "timeline":
        return sorted(observation["rows"], key=lambda row: str(row["dimensions"].get("datetimeHour", "")))
    return observation["rows"]


def render_markdown(data):
    validate(data)
    totals = zone_totals(data)
    out = ["# Cloudflare traffic observation", "", "Private · observed " + md(data["observed_at"]), "",
           "**" + coverage_label(data) + "**", "", dataset_coverage(data), "", "Traffic window: " + md(window_label(data["window"])),
           "", "History window: " + md(window_label(data["history_window"])), "",
           "Expected zones: " + str(data["scope"]["zones_expected"]) + ". Requests are not people. Business effects remain unknown.",
           "", "## Edge totals by zone", "", "Only the traffic_total view is used here; runtime and security counts are not added.", "",
           "| Zone | Edge requests | Evidence |", "| --- | ---: | --- |"]
    for name, value, label in totals:
        out.append("| " + " | ".join(md(v) for v in (name, number(value), label)) + " |")
    missing = max(0, data["scope"]["zones_expected"] - len(totals))
    if missing:
        out += ["", f"{missing} expected zone(s) have no name or observation in this snapshot; activity is unknown."]
    out += ["", "## Reading this evidence", ""] + ["- " + md(item) for item in evidence_limits(data)]
    for observation in data["observations"]:
        out += ["", "## " + md(observation["name"] + " · " + VIEWS[observation["view"]]), "",
                md(status_label(observation)), "", "Dataset: " + md(observation["dataset"]) + "; window: " + md(window_label(observation["window"])), "",
                group_label(observation)]
        if observation.get("reason"):
            out += ["", "Coverage reason: " + md(observation["reason"])]
        if observation["view"] in {"workers", "pages_functions"}:
            out += ["", "Runtime identifiers without an exact API project mapping remain unassigned; counts do not establish ownership."]
        if observation["view"] in {"d1_operations", "kv_operations"}:
            out += ["", "Storage service evidence only. Business outcome and causal HTTP request remain unknown."]
        cols = columns(observation)
        if cols:
            out += ["", "| " + " | ".join(md(label) for _, label, _ in cols) + " |", "| " + " | ".join("---" for _ in cols) + " |"]
            for row in ordered_rows(observation):
                out.append("| " + " | ".join(md(cell(row, key, dimension)) for key, _, dimension in cols) + " |")
    return "\n".join(out) + "\n"


STYLE = """
:root{color-scheme:light;font:15px/1.55 system-ui,sans-serif;color:#21323a;background:#f4f5f1}*{box-sizing:border-box}body{margin:0}main{max-width:1240px;margin:auto;padding:36px 22px}h1{font-size:clamp(2rem,5vw,3.5rem);letter-spacing:-.04em;line-height:1.1;margin:.3em 0}h2{font-size:1.2rem}p{max-width:90ch}.muted,small{color:#5d6a70}.summary,.evidence,.limits{background:#fff;border:1px solid #d4dbd6;border-radius:12px;padding:20px;margin:18px 0}.coverage{font-weight:700;color:#835519}.filters{display:flex;flex-wrap:wrap;gap:15px;align-items:end;margin:25px 0}label{display:grid;gap:4px}input,select{font:inherit;max-width:100%;padding:8px;border:1px solid #aab9b2;border-radius:5px;background:white}input{width:280px}.table{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:.85rem}td,th{padding:9px;text-align:left;border-bottom:1px solid #e0e6e1;overflow-wrap:anywhere}th{color:#455d54}td{max-width:450px}.badge{font-size:.85rem;color:#765018;font-weight:600}.runtime{border-left:5px solid #617b94}.storage{border-left:5px solid #8b6b7c}.timeline{border-left:5px solid #558274}meter{display:block;width:100%;min-width:100px;height:12px}summary{cursor:pointer;font-weight:600}.evidence[hidden]{display:none}a{color:#216751}footer{margin:30px 0;color:#5d6a70}@media(max-width:500px){main{padding:22px 12px}.summary,.evidence,.limits{padding:14px}}@media print{.filters{display:none}.evidence[hidden]{display:block}}
main{overflow-wrap:anywhere}
.table th{overflow-wrap:normal}.summary td:nth-child(2),td.metric{white-space:nowrap}
""".strip()
SCRIPT = """
const zone=document.querySelector('#zone'),view=document.querySelector('#view'),search=document.querySelector('#search');
const cards=[...document.querySelectorAll('.evidence')];
function filter(){let shown=0;for(const card of cards){const visible=(!zone.value||card.dataset.zone===zone.value)&&(!view.value||card.dataset.view===view.value)&&card.textContent.toLowerCase().includes(search.value.toLowerCase());card.hidden=!visible;if(visible)shown++;}document.querySelector('#shown').textContent=shown+' of '+cards.length+' evidence views shown. Snapshot-wide totals above do not change.';}
for(const input of [zone,view,search])input.addEventListener('input',filter);filter();
""".strip()


def render_html(data):
    validate(data)
    esc = html.escape
    totals = zone_totals(data)
    summary = "".join("<tr>" + "".join("<td>" + esc(str(value)) + "</td>" for value in (name, number(count), label)) + "</tr>" for name, count, label in totals)
    unknown = max(0, data["scope"]["zones_expected"] - len(totals))
    cards = []
    for observation in data["observations"]:
        cols = columns(observation)
        rows = ordered_rows(observation)
        maximum = max((row.get("requests", 0) for row in rows), default=0)
        header = "".join("<th scope=\"col\">" + esc(label) + "</th>" for _, label, _ in cols)
        body = []
        for row in rows:
            cells = []
            for key, _, dimension in cols:
                content = esc(cell(row, key, dimension))
                if key == "requests" and observation["view"] == "timeline" and maximum:
                    content += f'<meter min="0" max="{maximum}" value="{row["requests"]}" aria-label="Estimated requests in returned hour"></meter>'
                cells.append(("<td>" if dimension else '<td class="metric">') + content + "</td>")
            body.append("<tr>" + "".join(cells) + "</tr>")
        table = '<div class="table"><table><thead><tr>' + header + '</tr></thead><tbody>' + "".join(body) + '</tbody></table></div>' if cols else '<p>No usable rows; activity is not established by this view.</p>'
        note = '<p>Coverage reason: ' + esc(observation["reason"]) + '</p>' if observation.get("reason") else ""
        if observation["view"] in {"workers", "pages_functions"}:
            note += '<p>Runtime identifiers without an exact API project mapping remain unassigned; counts do not establish ownership.</p>'
        if observation["view"] in {"d1_operations", "kv_operations"}:
            note += '<p>Storage service evidence only. Business outcome and causal HTTP request remain unknown.</p>'
        kind = " runtime" if observation["view"] in {"workers", "pages_functions"} else " storage" if observation["view"] in {"d1_operations", "kv_operations"} else " timeline" if observation["view"] == "timeline" else ""
        cards.append(f'<section class="evidence{kind}" data-zone="{esc(observation["name"], quote=True)}" data-view="{esc(observation["view"], quote=True)}"><h2>{esc(observation["name"])} · {VIEWS[observation["view"]]}</h2><p class="badge">{esc(status_label(observation))}</p><p class="muted">{esc(observation["dataset"])} · {esc(window_label(observation["window"]))}<br>{group_label(observation)}</p>{note}{table}</section>')
    zone_options = "".join('<option value="' + esc(name, quote=True) + '">' + esc(name) + '</option>' for name in sorted({o["name"] for o in data["observations"]}))
    view_options = "".join('<option value="' + key + '">' + label + '</option>' for key, label in VIEWS.items())
    limits = "".join("<li>" + esc(item) + "</li>" for item in evidence_limits(data))
    csp = "default-src 'none'; base-uri 'none'; form-action 'none'; connect-src 'none'; img-src 'none'; object-src 'none'; " + "; ".join(kind + " 'sha256-" + base64.b64encode(hashlib.sha256(value.encode()).digest()).decode() + "'" for kind, value in (("style-src", STYLE), ("script-src", SCRIPT)))
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="{esc(csp, quote=True)}"><title>Private Cloudflare traffic observation</title><style>{STYLE}</style></head><body><main>
<div class="muted">PRIVATE · OFFLINE REPORT · {esc(data['observed_at'])}</div><h1>Traffic, with its limits visible.</h1>
<p>Network origins, requested operations and observed responses. Requests are not people; business effects remain unknown.</p>
<p class="coverage">{coverage_label(data)}</p><p>{dataset_coverage(data)}</p><p>Traffic: {esc(window_label(data['window']))}<br>History: {esc(window_label(data['history_window']))}</p>
<section class="summary"><h2>Edge totals by zone</h2><p>Expected zones: {data['scope']['zones_expected']}. Only traffic_total contributes here. Runtime and security counts stay separate.</p><div class="table"><table><thead><tr><th>Zone</th><th>Edge requests</th><th>Evidence</th></tr></thead><tbody>{summary}</tbody></table></div><p>{unknown} expected zone(s) lack a name or observation; their activity is unknown.</p></section>
<details class="limits" open><summary>What these observations can establish</summary><ul>{limits}</ul></details>
<div class="filters"><label>Zone / account<select id="zone"><option value="">All scopes</option>{zone_options}</select></label><label>Evidence<select id="view"><option value="">All views</option>{view_options}</select></label><label>Find within evidence<input id="search" type="search" autocomplete="off" placeholder="Country, script, route family…"></label></div><p id="shown" role="status" aria-live="polite"></p>
{''.join(cards)}<footer>Provider writes: none. This report contains no request payloads, raw paths, IPs, raw user agents, query strings or referrers. Missing timeline buckets stay missing. <a href="REPORT.md">Markdown report</a></footer></main><script>{SCRIPT}</script></body></html>'''


def open_directory(path, private=False):
    if ".." in Path(path).parts:
        raise ValueError("parent traversal is not accepted")
    path = Path(os.path.abspath(os.path.expanduser(path)))
    fd = os.open(path.anchor, os.O_RDONLY | os.O_DIRECTORY)
    try:
        for part in path.parts[1:]:
            next_fd = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = next_fd
            info = os.fstat(fd)
            if info.st_uid not in (0, os.getuid()) or (info.st_mode & 0o022 and not (info.st_uid == 0 and info.st_mode & stat.S_ISVTX)):
                raise ValueError("unsafe directory ownership or permissions")
        info = os.fstat(fd)
        if private and (info.st_uid != os.getuid() or info.st_mode & 0o077):
            raise ValueError("output directory must already be private and owned")
        return fd
    except BaseException:
        os.close(fd)
        raise


def reject_duplicates(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON key")
        result[key] = value
    return result


def read_snapshot(path):
    path = Path(os.path.abspath(os.path.expanduser(path)))
    directory = open_directory(path.parent)
    try:
        descriptor = os.open(path.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=directory)
    finally:
        os.close(directory)
    with os.fdopen(descriptor, "rb") as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_size > MAX_BYTES:
            raise ValueError("snapshot must be a bounded owned regular file")
        raw = stream.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("snapshot exceeds size bound")
    def invalid_constant(_):
        raise ValueError("invalid JSON number")
    return json.loads(raw, object_pairs_hook=reject_duplicates, parse_constant=invalid_constant)


def write_reports(data, output_dir):
    contents = {"REPORT.md": render_markdown(data), "index.html": render_html(data)}
    if any(len(content.encode("utf-8")) > MAX_REPORT_BYTES for content in contents.values()):
        raise ValueError("rendered report exceeds byte bound")
    directory = open_directory(output_dir, private=True)
    pending = []
    try:
        for name in contents:
            try:
                info = os.stat(name, dir_fd=directory, follow_symlinks=False)
            except FileNotFoundError:
                continue
            if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_nlink != 1:
                raise ValueError("unsafe existing report target")
        for name, content in contents.items():
            temporary = ".traffic-report-" + secrets.token_hex(12)
            descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=directory)
            pending.append((temporary, name))
            with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
                os.fchmod(stream.fileno(), 0o600)
                stream.write(content)
                stream.flush()
                os.fsync(stream.fileno())
        for temporary, name in pending:
            os.replace(temporary, name, src_dir_fd=directory, dst_dir_fd=directory)
    finally:
        for temporary, _ in pending:
            try:
                os.unlink(temporary, dir_fd=directory)
            except FileNotFoundError:
                pass
        os.close(directory)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("snapshot", type=Path)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        data = read_snapshot(args.snapshot)
        write_reports(data, args.output_dir)
        print(json.dumps({"status": "rendered", "coverage": coverage_label(data), "provider_writes": False}))
        return 0
    except (OSError, ValueError, TypeError, KeyError, RecursionError, OverflowError):
        print('{"status":"failed","reason":"invalid_snapshot_or_unsafe_output"}', file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
