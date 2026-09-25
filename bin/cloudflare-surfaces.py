#!/usr/bin/env python3
"""Render private, offline maintainer views of an observed web estate.

No network calls, deployment, source harvesting, or public staging. The JSON
snapshot is the input; HTML and Markdown are disposable projections.
"""
import argparse
import collections
import html
import json
import os
import pathlib
import re
import stat
import sys
import tempfile
import urllib.parse

AUDIENCES = {"human", "agent", "mixed", "operator", "infrastructure", "unknown"}
MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024
MAX_SURFACES = 10_000
MAX_OBSERVATIONS = 50_000


def bounded_text(value, *, limit=8192, empty=True):
    if (not isinstance(value, str) or len(value) > limit or (not empty and not value)
            or any(ord(c) < 32 or ord(c) == 127 for c in value)):
        raise ValueError("invalid bounded text")
    return value


def https_url(value):
    bounded_text(value, limit=4096, empty=False)
    if any(ord(c) < 32 or ord(c) == 127 for c in urllib.parse.unquote(value)):
        raise ValueError("URL contains controls")
    u = urllib.parse.urlsplit(value)
    if (u.scheme != "https" or not u.hostname or u.username or u.password
            or u.query or u.fragment or u.port not in (None, 443)):
        raise ValueError("URL must be credential-free HTTPS without query or fragment")
    return u


def text_list(value, *, limit=10_000):
    if not isinstance(value, list) or len(value) > limit:
        raise ValueError("invalid bounded list")
    for item in value:
        bounded_text(item)


def check_observation(route):
    if not isinstance(route, dict):
        raise ValueError("invalid observation")
    https_url(route.get("url"))
    for key in ("machine_usable", "html", "valid_json", "valid_text", "truncated"):
        if key in route and type(route[key]) is not bool:
            raise ValueError("observation flags must be booleans")
    status = route.get("status")
    if status is not None and (type(status) is not int or not 100 <= status <= 599):
        raise ValueError("invalid HTTP status")
    if "bytes_read" in route and (type(route["bytes_read"]) is not int or not 0 <= route["bytes_read"] <= MAX_SNAPSHOT_BYTES):
        raise ValueError("invalid response size")
    for key in ("content_type", "error", "observed_at", "sha256", "title"):
        if route.get(key) is not None:
            bounded_text(route[key])
    if route.get("machine_usable"):
        media = (route.get("content_type") or "").split(";", 1)[0].strip().lower()
        json_typed = media == "application/json" or bool(re.fullmatch(r"application/[a-z0-9!#$&^_.+-]+\+json", media))
        text_typed = media in {"text/plain", "text/markdown", "text/agent"}
        if (status != 200 or route.get("html") is not False or route.get("truncated") is not False
                or route.get("error") or not ((route.get("valid_json") is True and json_typed)
                    or (route.get("valid_text") is True and text_typed))):
            raise ValueError("machine success requires a complete typed response")


def validate(data):
    if not isinstance(data, dict):
        raise ValueError("observation must be an object")
    if data.get("format") != "cloudflare-surface-observation/1":
        raise ValueError("unsupported observation format")
    if data.get("visibility") != "private-maintainer":
        raise ValueError("operational map must remain private")
    bounded_text(data.get("as_of"), limit=128, empty=False)
    text_list(data.get("limitations"), limit=1000)
    coverage = data.get("coverage")
    if not isinstance(coverage, dict):
        raise ValueError("coverage required")
    for key in ("pages", "workers", "zones", "public_requests"):
        if type(coverage.get(key)) is not int or not 0 <= coverage[key] <= 1_000_000:
            raise ValueError("coverage counts must be bounded nonnegative integers")
    for key in ("metadata_complete", "dns_complete"):
        if key in coverage and type(coverage[key]) is not bool:
            raise ValueError("completeness must be boolean")
    if not isinstance(data.get("surfaces"), list) or len(data["surfaces"]) > MAX_SURFACES:
        raise ValueError("invalid surface list")
    seen = set()
    kinds = collections.Counter()
    observation_count = 0
    for row in data["surfaces"]:
        if not isinstance(row, dict):
            raise ValueError("invalid surface")
        for key in ("id", "name", "kind", "audience", "state", "next_action"):
            bounded_text(row.get(key), empty=False)
        if row["kind"] not in {"pages", "worker"} or row["id"] != row["kind"] + ":" + row["name"]:
            raise ValueError("surface identifier and kind disagree")
        if row["id"] in seen:
            raise ValueError("duplicate surface")
        seen.add(row["id"])
        kinds[row["kind"]] += 1
        if row["audience"] not in AUDIENCES:
            raise ValueError("unknown audience")
        if not isinstance(row.get("source"), dict) or not row["source"]:
            raise ValueError("source state and next action required")
        source = row["source"]
        bounded_text(source.get("state"), empty=False)
        for key in ("repo", "revision"):
            if source.get(key) is not None:
                bounded_text(source[key])
        if source.get("repo"):
            https_url(source["repo"])
        if row.get("purpose") is not None:
            bounded_text(row["purpose"])
        for key in ("human_start", "workers_dev_url"):
            if row.get(key) is not None:
                https_url(row[key])
        text_list(row.get("findings", []))
        text_list(row.get("bindings", []))
        if not isinstance(row.get("observations"), list):
            raise ValueError("observations must be a list")
        observation_count += len(row["observations"])
        if observation_count > MAX_OBSERVATIONS:
            raise ValueError("too many observations")
        for route in row["observations"]:
            check_observation(route)
    if kinds["pages"] != coverage["pages"] or kinds["worker"] != coverage["workers"]:
        raise ValueError("surface kinds do not match deployment inventory counts")
    if not isinstance(data.get("dns_hosts"), list) or len(data["dns_hosts"]) > MAX_SURFACES:
        raise ValueError("invalid DNS host list")
    for host in data["dns_hosts"]:
        if not isinstance(host, dict):
            raise ValueError("invalid DNS host")
        for key in ("host", "role", "binding", "state"):
            bounded_text(host.get(key, ""))
    external = data.get("external_document_observations", [])
    if not isinstance(external, list) or len(external) + observation_count > MAX_OBSERVATIONS:
        raise ValueError("too many observations")
    for route in external:
        check_observation(route)


def safe_link(url, label=None):
    try:
        https_url(url)
    except (TypeError, ValueError):
        return html.escape(label or "Link unavailable")
    return '<a rel="noreferrer" href="' + html.escape(url, quote=True) + '">' + html.escape(label or url) + '</a>'


def md(value):
    escaped = html.escape(str(value), quote=True).replace("\n", " ").replace("\r", " ")
    return re.sub(r"([\\`*_{}\[\]()#!|])", r"\\\1", escaped)


def source_label(row):
    s = row["source"]
    return s.get("repo") or s.get("state", "unresolved")


def coverage_status(data, key):
    value = data["coverage"].get(key)
    return "complete for requested scope" if value is True else "incomplete" if value is False else "not established"


def render_markdown(data):
    validate(data)
    c = data["coverage"]
    out = ["# Cloudflare surface map", "", "Private maintainer observation · " + md(data["as_of"]), "",
           f"{c['pages']} Pages projects · {c['workers']} Workers · {c['zones']} zones · {c['public_requests']} bounded public requests.", "",
           "Metadata coverage: " + coverage_status(data, "metadata_complete") + ". DNS coverage: " + coverage_status(data, "dns_complete") + ".", "",
           "[Interactive map](index.html) · [Machine map](surfaces.json) · [Framework](../FRAMEWORK.md) · [Roadmap](../ROADMAP.md)", "",
           "## Scope", ""] + ["- " + md(x) for x in data["limitations"]]
    out += ["", "## Deployments", "", "| Surface | Audience observed | Human start / binding | Machine entry observed | State / findings | Source | Next action |",
            "| --- | --- | --- | --- | --- | --- | --- |"]
    for r in data["surfaces"]:
        machine = ", ".join(x["url"] for x in r["observations"] if x.get("machine_usable")) or "Not established by these probes"
        human = r.get("human_start") or ", ".join(r.get("bindings", [])) or "No public binding established"
        out.append("| " + " | ".join(md(x) for x in [r["id"], r["audience"], human, machine,
                   r["state"] + "; " + ", ".join(r["findings"]), source_label(r), r["next_action"]]) + " |")
    out += ["", "## DNS and external origins", "", "Observed address/CNAME hostnames are shown below; completeness depends on the recorded DNS coverage. Infrastructure names are not invitations to probe or publish their contents.", "",
            "| Host | Role | Cloudflare binding / backend evidence | Observation |", "| --- | --- | --- | --- |"]
    for r in data["dns_hosts"]:
        out.append("| " + " | ".join(md(r.get(k, "")) for k in ["host", "role", "binding", "state"]) + " |")
    out += ["", "## Evidence", "", "`surfaces.json` includes bounded HTTP evidence and deployment metadata. `ownership.json` retains source-matching evidence and unresolved candidates. A deployment commit claim does not prove byte equality. No response bodies, credentials, DNS address values, bindings or environment variables are included.", ""]
    return "\n".join(out)


def render_html(data):
    validate(data)
    esc = html.escape
    counts = data["coverage"]
    cards = []
    for r in data["surfaces"]:
        machine = [x for x in r["observations"] if x.get("machine_usable")]
        details = []
        for o in r["observations"]:
            value = str(o.get("status", o.get("error", "unknown")))
            value += " · " + str(o.get("content_type") or "type unknown")
            if o.get("bytes_read") is not None:
                value += " · " + str(o["bytes_read"]) + " bytes"
            if o.get("html") and o["url"].endswith((".json", ".txt")):
                value += " · HTML at machine path"
            details.append("<li>" + safe_link(o["url"]) + "<br><small>" + esc(value) + "</small></li>")
        source = r["source"]
        source_text = source_label(r)
        if source.get("revision"):
            source_text += " @ " + source["revision"]
        search = " ".join([r["id"], r.get("purpose", ""), r["audience"], source_text] + r["findings"] + r.get("bindings", []))
        human = safe_link(r["human_start"], "Open human entry") if r.get("human_start") else "Human entry not established"
        agent = "<br>".join(safe_link(x["url"], urllib.parse.urlsplit(x["url"]).path) for x in machine) or "No typed entry established by these probes"
        findings = " · ".join(r["findings"]) or "No issue established in the inspected paths"
        cards.append(f'''<article data-audience="{esc(r['audience'])}" data-kind="{esc(r['kind'])}" data-search="{esc(search, quote=True)}">
<div class="eyebrow">{esc(r['kind'])} · {esc(r['audience'])} · {esc(r['state'])}</div>
<h2>{esc(r['name'])}</h2><p>{esc(r.get('purpose', ''))}</p>
<div class="lanes"><div><b>Human</b><p>{human}</p></div><div><b>Agent</b><p>{agent}</p></div></div>
<p class="finding">{esc(findings)}</p><p><b>Next:</b> {esc(r['next_action'])}</p>
<details><summary>Owner, bindings and observations ({len(details)})</summary><p>{esc(source_text)}</p>
<p>Source state: {esc(source.get('state', 'unresolved'))}</p><p>{esc(', '.join(r.get('bindings', [])))}</p>
<ul>{''.join(details)}</ul></details></article>''')
    dns_rows = "".join("<tr>" + "".join("<td>" + esc(str(r.get(k, ""))) + "</td>" for k in ["host", "role", "binding", "state"]) + "</tr>" for r in data["dns_hosts"])
    limits = "".join("<li>" + esc(x) + "</li>" for x in data["limitations"])
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Cloudflare · Human and agent surface map</title>
<style>
:root{{color-scheme:light dark;font:16px/1.55 system-ui,sans-serif;background:#121918;color:#e7eee9}}*{{box-sizing:border-box}}body{{margin:0}}main{{max-width:1280px;margin:auto;padding:40px 24px}}a{{color:#a3dac3;overflow-wrap:anywhere}}h1{{font-size:clamp(2rem,5vw,3.6rem);line-height:1.1;max-width:850px;letter-spacing:-.04em}}h2{{font-size:1.25rem;overflow-wrap:anywhere}}p{{max-width:85ch}}.eyebrow,small{{color:#aac0b5;font-size:.8rem}}.stats{{font-size:1.3rem}}nav,.filters{{display:flex;flex-wrap:wrap;gap:18px;align-items:center;margin:28px 0}}label{{display:grid;gap:5px;max-width:100%;min-width:0}}input,select{{font:inherit;padding:9px 12px;border:1px solid #496358;border-radius:6px;background:#1b2722;color:inherit;max-width:100%}}input{{width:min(360px,100%);min-width:0}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,370px),1fr));gap:18px}}article{{border:1px solid #344c40;border-radius:12px;padding:24px;background:#18231e}}article[hidden]{{display:none}}.lanes{{display:grid;grid-template-columns:1fr 1fr;gap:20px;border-top:1px solid #344c40;border-bottom:1px solid #344c40;padding-top:16px}}.lanes p{{font-size:.86rem}}.finding{{font-size:.85rem;color:#e4cd9a}}summary{{cursor:pointer}}details ul{{padding-left:20px;font-size:.8rem}}.table{{overflow-x:auto}}table{{border-collapse:collapse;width:100%;font-size:.8rem}}td,th{{padding:10px;text-align:left;border-bottom:1px solid #344c40;overflow-wrap:anywhere}}.scope{{padding:20px;border:1px solid #344c40;border-radius:10px;margin:24px 0}}footer{{margin:40px 0;color:#aac0b5}}
</style></head><body><main><div class="eyebrow">PRIVATE MAINTAINER MAP · {esc(data['as_of'])}</div>
<h1>Clear places for people.<br>Clear paths for agents.</h1>
<p class="stats">{esc(str(counts['pages']))} Pages projects · {esc(str(counts['workers']))} Workers · {esc(str(counts['zones']))} zones</p>
<p>Metadata coverage: {coverage_status(data, 'metadata_complete')}. DNS coverage: {coverage_status(data, 'dns_complete')}.</p>
<p>One observed estate, with separate reading, machine and operator surfaces. Choose an audience to see the current evidence and the next useful change.</p>
<nav><a href="MAP.md">Readable map</a><a href="surfaces.json">Machine map</a><a href="../FRAMEWORK.md">Framework</a><a href="../ROADMAP.md">Update roadmap</a></nav>
<details class="scope"><summary>Scope and limits</summary><ul>{limits}</ul></details>
<div class="filters"><label>Find a site, owner or issue<input id="search" type="search" placeholder="Search the estate"></label>
<label>Audience<select id="audience"><option value="">All audiences</option>{''.join('<option>'+x+'</option>' for x in sorted(AUDIENCES))}</select></label>
<label>Deployment<select id="kind"><option value="">Pages and Workers</option><option>pages</option><option>worker</option></select></label>
<span id="count" aria-live="polite">{len(cards)} deployments</span></div>
<section class="grid" id="cards">{''.join(cards)}</section>
<details class="scope"><summary>DNS and external-origin map ({len(data['dns_hosts'])} hostnames)</summary><div class="table"><table><thead><tr><th>Host</th><th>Role</th><th>Binding / backend evidence</th><th>Observed state</th></tr></thead><tbody>{dns_rows}</tbody></table></div></details>
<footer>Generated offline from surfaces.json. No analytics, API calls or automatic service invocation. No-JavaScript readers receive the full map. This file is excluded from public site staging.</footer>
</main><script>
const cards=Array.from(document.querySelectorAll('article')), search=document.getElementById('search'), audience=document.getElementById('audience'), kind=document.getElementById('kind');
function filter(){{let count=0;const q=search.value.trim().toLowerCase();for(const card of cards){{const show=(!q||card.dataset.search.toLowerCase().includes(q))&&(!audience.value||card.dataset.audience===audience.value)&&(!kind.value||card.dataset.kind===kind.value);card.hidden=!show;if(show)count++;}}document.getElementById('count').textContent=count+' deployments';}}
for(const input of [search,audience,kind])input.addEventListener('input',filter);
</script></body></html>'''


def reject_duplicate_keys(pairs):
    out = {}
    for key, value in pairs:
        if key in out:
            raise ValueError("duplicate JSON key")
        out[key] = value
    return out


def reject_constant(value):
    raise ValueError("non-finite JSON number")


def read_snapshot(path):
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(descriptor, "rb") as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_size > MAX_SNAPSHOT_BYTES:
            raise ValueError("snapshot must be a bounded regular file")
        raw = stream.read(MAX_SNAPSHOT_BYTES + 1)
    if len(raw) > MAX_SNAPSHOT_BYTES:
        raise ValueError("snapshot is too large")
    return json.loads(raw, object_pairs_hook=reject_duplicate_keys, parse_constant=reject_constant)


def write_projection(path, value):
    # Replacing a symlink replaces the link itself, never its destination.
    # Both disposable projections are fully rendered before either is replaced.
    descriptor, temporary = tempfile.mkstemp(prefix=".cloudflare-projection-", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
            stream.write(value)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("snapshot", type=pathlib.Path)
    parser.add_argument("--check", action="store_true", help="validate without writing")
    args = parser.parse_args(argv)
    try:
        data = read_snapshot(args.snapshot)
        validate(data)
        if not args.check:
            markdown, markup = render_markdown(data), render_html(data)
            write_projection(args.snapshot.with_name("MAP.md"), markdown)
            write_projection(args.snapshot.with_name("index.html"), markup)
        print(json.dumps({"surfaces": len(data["surfaces"]), "visibility": data["visibility"],
            "metadata_complete": data["coverage"].get("metadata_complete"),
            "dns_complete": data["coverage"].get("dns_complete"),
            "mode": "validated" if args.check else "rendered-offline"}))
        return 0
    except (OSError, ValueError, TypeError, KeyError, RecursionError):
        print('{"status":"failed","code":"invalid_or_unreadable_snapshot"}', file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
