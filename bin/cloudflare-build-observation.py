#!/usr/bin/env python3
"""Join private Cloudflare metadata, bounded HTTP observations and source evidence.

Offline only. This creates an observation, never a canonical source registry.
"""
import argparse
import collections
import datetime
import fnmatch
import importlib.util
import json
import pathlib
import re
import urllib.parse


def load(path):
    return json.loads(path.read_text())


def origin(url):
    u = urllib.parse.urlsplit(url)
    return u.hostname


def observation(raw):
    keys = ("url", "observed_at", "status", "content_type", "location", "bytes_read", "truncated", "sha256", "html", "valid_json", "error", "title")
    out = {k: raw[k] for k in keys if k in raw}
    location = out.get("location")
    if location:
        u = urllib.parse.urlsplit(location)
        if u.query or u.fragment or u.username or u.password or any(ord(c) < 32 or ord(c) == 127 for c in location):
            out.pop("location", None)
            out["location_omitted"] = "non-canonical-or-sensitive-url"
    media = str(out.get("content_type", "")).split(";", 1)[0].strip().lower()
    path = urllib.parse.urlsplit(out["url"]).path
    out["valid_text"] = bool(out.get("html") is False and media in {"text/plain", "text/markdown", "text/agent"} and path.endswith((".txt", ".md")))
    json_typed = media == "application/json" or media.endswith("+json")
    out["machine_usable"] = bool(type(out.get("status")) is int and out["status"] == 200 and out.get("truncated") is False and out.get("html") is False and
                                 ((out.get("valid_json") is True and json_typed) or out["valid_text"]))
    if path == "/robots.txt":
        out["machine_usable"] = False  # crawler guidance is not an agent start
    return out


def matches_route(url, pattern):
    """Match only the supplied scheme/host/path; never turn HTTP into HTTPS."""
    if "://" not in pattern:
        pattern = "*://" + pattern
    return fnmatch.fnmatchcase(url, pattern)


def build(inventory, probes, ownership, dns):
    if len(inventory["accounts"]["items"]) != 1:
        raise ValueError("this source concordance is scoped to one account; split account evidence before joining")
    rows = []
    source = {r["id"]: r["source"] for r in ownership["rows"]}
    observed = [observation(r) for r in probes]
    routes = [r for z in inventory["zone_routes"] for r in z["items"]]
    bound = collections.defaultdict(set)
    worker_bound = collections.defaultdict(set)
    for account in inventory["accounts_inventory"]:
        for project in account["pages"]["items"]:
            for host in project.get("domains", []):
                bound[host].add("pages:" + project["name"])
        for d in account["worker_domains"]["items"]:
            worker_bound[d["service"]].add(d["hostname"])
            bound[d["hostname"]].add("worker:" + d["service"])
    for route in routes:
        if not route.get("script"):
            continue
        pattern = route["pattern"]
        host = urllib.parse.urlsplit(pattern if "://" in pattern else "https://" + pattern).hostname
        if host and "*" not in host:
            worker_bound[route["script"]].add(host)
            bound[host].add("worker:" + route["script"])

    def common(kind, name, hosts, deployment=None, allowed=None):
        ident = kind + ":" + name
        observations = [r for r in observed if origin(r["url"]) in hosts and (allowed is None or allowed(r["url"]))]
        roots = [r for r in observations if urllib.parse.urlsplit(r["url"]).path == "/" and r.get("html") and r.get("status") == 200]
        roots.sort(key=lambda r: (origin(r["url"]).endswith(".pages.dev"), origin(r["url"]).startswith("www."), r["url"]))
        machine = [r for r in observations if r.get("machine_usable")]
        audience = "mixed" if roots and machine else "human" if roots else "agent" if machine else "unknown"
        findings = []
        own = source.get(ident, {"state": "unresolved", "repo": None, "revision": None, "path": None, "sha256": None})
        if own.get("state") == "unresolved":
            findings.append("source-unresolved")
        if any(r.get("status") == 200 and r.get("html") and r["url"].endswith((".json", ".txt")) for r in observations):
            findings.append("machine-html-fallback")
        if any(r.get("machine_usable") and r.get("bytes_read", 0) > 5120 for r in observations):
            findings.append("large-machine-document")
        if roots and not machine:
            findings.append("no-typed-entry-observed")
        if deployment:
            meta = (deployment.get("trigger") or {}).get("metadata") or {}
            if meta.get("commit_dirty"):
                findings.append("deployment-declared-dirty")
            if not re.fullmatch(r"[a-f0-9]{40}", meta.get("commit_hash", "")):
                findings.append("deployment-without-full-source-pin")
        row = {"id": ident, "kind": kind, "name": name, "audience": audience,
               "audience_basis": "bounded response observations, not identity or access control",
               "purpose": roots[0].get("title", "") if roots else "Runtime purpose not established by this observation",
               "human_start": roots[0]["url"] if roots else None, "bindings": sorted(hosts),
               "state": "content-observed" if roots or machine else "metadata-only",
               "source": own, "findings": findings, "observations": observations,
               "next_action": "Confirm source owner and intended audience before any route change."}
        if roots:
            row["next_action"] = "Keep the human reading path; confirm whether an agent entry is needed."
        if machine:
            row["next_action"] = "Choose the existing typed start; keep full reference documents one link deeper."
        if "machine-html-fallback" in findings:
            row["next_action"] = "Point agents to the real typed entry; return 404 for unimplemented machine paths."
        if "source-unresolved" in findings:
            row["next_action"] = "Resolve the owning source first. " + row["next_action"]
        if deployment:
            row["deployment"] = deployment
        return row

    for a in inventory["accounts_inventory"]:
        for p in a["pages"]["items"]:
            dep = p.get("canonical_deployment") or p.get("deployment")
            row = common("pages", p["name"], set(p.get("domains", [])), dep)
            row["production_branch"] = p.get("production_branch")
            row["custom_domains"] = [d for group in a.get("page_domains", []) if group["project"] == p["name"] for d in group["items"]]
            for status in sorted({d.get("status", "unknown") for d in row["custom_domains"]} - {"active"}):
                row["findings"].append("domain-binding-" + status)
            if not dep:
                row["state"] = "no-production-deployment"
                row["findings"].append("empty-project")
                row["next_action"] = "Keep out of active navigation; confirm purpose before reuse or retirement."
            row["overlays"] = sorted({"worker:" + r["script"] for r in routes if r.get("script") and
                                       any(h in r["pattern"] for h in p.get("domains", []))})
            rows.append(row)
        subdomains = {x["script"]: x for x in a.get("worker_subdomains", [])}
        subdomain = a.get("worker_subdomain", {}).get("item", a.get("worker_subdomain", {}).get("result", {})) or {}
        for w in a["workers"]["items"]:
            wroutes = [r["pattern"] for r in routes if r.get("script") == w["id"]]
            custom = [d["hostname"] for d in a["worker_domains"]["items"] if d["service"] == w["id"]]
            def allowed(url):
                applicable = [r for r in routes if matches_route(url, r["pattern"])]
                if applicable:
                    # Ambiguous ties are not evidence of a particular responder.
                    specificity = max(len(r["pattern"].replace("*", "")) for r in applicable)
                    winners = {r.get("script") for r in applicable if len(r["pattern"].replace("*", "")) == specificity}
                    return winners == {w["id"]}
                return origin(url) in custom
            row = common("worker", w["id"], worker_bound[w["id"]], allowed=allowed)
            # Shared hostname content cannot establish which path-limited Worker served it.
            broad = any(urllib.parse.urlsplit(x if "://" in x else "https://" + x).path == "/*" for x in wroutes)
            if not custom and not broad:
                row.update(audience="unknown", purpose="Path-specific or service Worker; runtime not invoked", human_start=None,
                           state="metadata-only", observations=[], findings=[x for x in row["findings"] if x == "source-unresolved"],
                           next_action="Pin source and classify public API, scheduled job, private service or route overlay before changes.")
            if w["id"] in {"tendlot-private", "flypaper"}:
                row.update(audience="operator" if w["id"] == "tendlot-private" else "infrastructure", human_start=None,
                           state="metadata-only-excluded-from-content-probes", observations=[],
                           audience_basis="explicit private-service or defense-route exclusion; runtime access not inspected",
                           next_action="Keep in the operator inventory; do not expose it through public discovery.")
            row["routes"] = wroutes
            row["workers_dev"] = subdomains.get(w["id"], {"complete": False, "item": {}})
            if row["workers_dev"].get("item", {}).get("enabled") and subdomain.get("subdomain"):
                row["workers_dev_url"] = "https://" + w["id"] + "." + subdomain["subdomain"] + ".workers.dev"
            row["modified_on"] = w.get("modified_on")
            rows.append(row)

    dns_records = collections.defaultdict(list)
    for zone in dns.get("zones", []):
        for record in zone["records"]:
            dns_records[record["name"]].append(record)
    dns_hosts = []
    for host, records in sorted(dns_records.items()):
        bindings = sorted(bound.get(host, set()))
        roots = [r for r in observed if origin(r["url"]) == host and urllib.parse.urlsplit(r["url"]).path == "/"]
        if bindings:
            role = "cloudflare-deployment-binding"
        elif re.search(r"(^_|\._|^(mail|email|autoconfig|autodiscover|mta-sts|ua-auto-config|sip|lyncdiscover|msoid|ftp|cpanel|whm|webmail|webdisk|cpcontacts|cpcalendars|localhost)\.)", host):
            role = "infrastructure-not-content"
        elif host.startswith(("api.", "rpc.", "mcp.")):
            role = "external-service-reference"
        elif host.startswith(("admin.", "sentry.", "webhook.", "alpha.", "beta.", "gamma.")):
            role = "operator-or-host-reference"
        else:
            role = "external-or-unresolved-origin"
        targets = [r["target"] for r in records if r.get("target")]
        dns_hosts.append({"host": host, "role": role, "binding": ", ".join(bindings or targets) or "address exists; origin address omitted",
                          "state": "HTTP " + str(roots[0].get("status", roots[0].get("error"))) if roots else "not content-probed",
                          "types": sorted({r["type"] for r in records}), "proxied": sorted({bool(r["proxied"]) for r in records})})
    rows.sort(key=lambda r: (r["kind"] != "pages", r["name"]))
    return {"format": "cloudflare-surface-observation/1", "visibility": "private-maintainer", "as_of": inventory["as_of"],
            "coverage": {"accounts": len(inventory["accounts"]["items"]), "zones": len(inventory["zones"]["items"]),
                         "pages": sum(r["kind"] == "pages" for r in rows), "workers": sum(r["kind"] == "worker" for r in rows),
                         "public_requests": len(observed), "dns_address_records": sum(len(x) for x in dns_records.values()),
                         "metadata_complete": inventory.get("complete", False),
                         "dns_complete": len(dns.get("zones", [])) == len(inventory["zones"]["items"]) and all(z.get("complete") is True for z in dns.get("zones", [])),
                         "dns_incomplete_zones": [z.get("zone", "unknown") for z in dns.get("zones", []) if z.get("complete") is not True],
                         "metadata_sets": inventory.get("coverage", {}),
                         "enabled_workers_dev": sum(bool(s.get("item", {}).get("enabled")) for a in inventory["accounts_inventory"] for s in a.get("worker_subdomains", [])),
                         "page_custom_domain_states": dict(collections.Counter(d.get("status", "unknown") for a in inventory["accounts_inventory"] for p in a.get("page_domains", []) for d in p["items"]))},
            "limitations": [
                "Inventory covers resources visible to the existing credentials, not proof of all accounts a person owns.",
                "Content inspection is a bounded set of public landing/discovery GETs; it is not a crawl of every route, a browser interaction test, or an API action test.",
                "Redirects are recorded, not followed. Worker services, private apps, mail/validation hosts and defense paths were not invoked. Workers.dev enablement is metadata only.",
                "A valid JSON or text response is a typed document, not proof of its truth, authority, completeness, action permission or full schema conformance.",
                "Source matches distinguish deployment commit hints, tracked configuration and deployment documentation. None alone proves deployed byte equality; unresolved sources remain unresolved.",
                "Audience is observed presentation, not identity, permission or access control. Human-only and absent machine paths may be intentional.",
                "DNS records include infrastructure and external backends. DNS ownership does not mean Cloudflare hosts that application.",
                "This is a pre-change snapshot. Release verification records later production changes separately; these observations do not silently update themselves."],
            "surfaces": rows, "dns_hosts": dns_hosts,
            "external_document_observations": [o for o in observed if origin(o["url"]) not in bound]}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    for name in ("inventory", "ownership", "dns", "output"):
        p.add_argument("--" + name, required=True, type=pathlib.Path)
    p.add_argument("--probes", required=True, type=pathlib.Path, nargs="+")
    a = p.parse_args()
    if a.output.exists():
        raise SystemExit("refusing to overwrite an observation; create a new snapshot")
    observations = [r for path in a.probes for r in load(path)["results"]]
    data = build(load(a.inventory), observations, load(a.ownership), load(a.dns))
    spec = importlib.util.spec_from_file_location("surface_renderer", pathlib.Path(__file__).with_name("cloudflare-surfaces.py"))
    renderer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(renderer)
    renderer.validate(data)
    a.output.write_text(json.dumps(data, indent=2) + "\n")
    print(json.dumps(data["coverage"]))


if __name__ == "__main__":
    main()
