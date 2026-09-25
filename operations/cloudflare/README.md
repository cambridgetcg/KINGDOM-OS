# Private web-surface maintenance

Start with the [interactive map](2026-09-25/index.html),
[machine observation](2026-09-25/surfaces.json),
[framework](FRAMEWORK.md), or [roadmap](ROADMAP.md).

The observation covers one authenticated account, 21 zones, 50 Pages projects,
38 Workers, 39 custom Pages bindings, and 144 address/CNAME records across 135
DNS hostnames. All 136 requested metadata sets completed. Of those custom
Pages bindings, 30 were active, 8 deactivated and 1 pending. Workers.dev was
enabled for 32 Workers; enablement is metadata, not a runtime health check.

The 425 public observations consist of 415 fixed landing/discovery requests
plus 10 explicitly advertised document checks. Requests used no credentials,
did not follow redirects, and did not execute JavaScript or API actions. The
underlying Pages project and a Worker overlay may share a hostname while
serving different routes. A successful root does not validate the whole site.

Ownership evidence is complete as a list, incomplete as attribution:
14 deployment-commit matches, 10 tracked-configuration matches, 4 tracked
deployment-document matches, and 60 unresolved entries. Each established
source locator has an exact revision, path and byte digest. These are evidence
locators, not a claim that every deploy reproduced those bytes.

## Refresh commands

Use Python 3.11 or newer. Create an owner-only local state directory. The API
collector requires a new output file in that directory and never prints
credentials, configuration bodies or response bodies. It prefers a
child-scoped `CLOUDFLARE_API_TOKEN`, otherwise the existing Wrangler OAuth
configuration. Refresh an expired OAuth identity through Wrangler separately.

```sh
python3 bin/cloudflare-inventory.py --output /absolute/private-state/new-inventory.json
```

For DNS, a credential helper can supply a **separate child environment variable**
and add `--dns-token-env CF_DNS_READ_TOKEN`. Never paste credentials into a
command, source file, report or process argument. The existing macOS credential
helper used for this observation is Keychain service `agenttool-cloudflare-token`,
account `macair`; no credential value is recorded here. The collector's DNS
projection excludes addresses, record contents and mail/TXT values.

The collector exits 0 for complete requested scope, 1 for a partial observation
with explicit gaps, and 2 for local/auth/setup failures. A credential can see
only its own account scope; a complete response does not prove global ownership.

Review public probe targets and source evidence separately. Do not infer a
safe runtime probe from a Worker name. Once these inputs exist, join them
offline into a new dated snapshot:

```sh
python3 bin/cloudflare-build-observation.py \
  --inventory /absolute/private-state/new-inventory.json \
  --ownership /absolute/private-state/ownership.json \
  --dns /absolute/private-state/dns-web-hosts.json \
  --probes /absolute/private-state/public-probes.json \
  --output operations/cloudflare/NEW-DATE/surfaces.json
python3 bin/cloudflare-surfaces.py operations/cloudflare/NEW-DATE/surfaces.json
python3 bin/cloudflare-surfaces.py operations/cloudflare/NEW-DATE/surfaces.json --check
```

The joiner consumes the documented collector shape, source rows of
`{id, source}`, probe files containing `results`, and minimized DNS input
`{zones: [{records: [{name, type, proxied, target?}]}]}`. `target` is an optional
public CNAME destination, never an A/AAAA address or mail/TXT value. The JSON
snapshot is the observation; MAP.md and index.html are generated offline.
The builder refuses to replace an existing snapshot. Archive earlier evidence
and update the directory links intentionally.

## Checks and publication boundary

```sh
python3 -m unittest discover -s tests -p 'test_cloudflare*.py'
bun test tests/agent-entry.test.ts tests/stage-hub.test.ts
```

The public upload uses `publications/hub-staging.v1.json`, not repository-wide
copying. Everything under `operations/cloudflare/` stays in the private
maintainer repository. Public changes use the current owner runbook in
`DOMAINS-SETUP.md`. The compact public entry and source-locator repair are the
first implementation wave; the remainder of the estate has a mapped roadmap,
not an implied completed migration.

