# Private traffic observation

Yu requested quiet traffic observation and selected a daily local report on
25 September 2026. This is an operator facility for the accessible Cloudflare
account, separate from the public human and agent entry points.

The observer reads existing provider analytics. It creates no visitor beacon,
cookie, fingerprint, browser script, public endpoint, or application action.
Cloudflare API access remains auditable; quiet operation is not invisibility.
Reports and operational findings remain local on this Mac. Public sites keep
their existing collection and interaction behavior.

## Evidence layers

| Layer | What it can establish | What it cannot establish |
| --- | --- | --- |
| Edge requests | Estimated volume, countries, hosts, methods, route families, responses and security decisions | Visitor identity, intent, or completed business effects |
| Client classification | Cloudflare verified-bot categories and reported browser families | An unverified browser label is not proof of a human or an attack |
| Worker / Pages Functions | Invocation status, errors and subrequests, grouped by deployed runtime | Invocation success is not an HTTP success, purchase, message delivery or database commit |
| Existing state-service aggregates, when available | Read/write activity at a service boundary | Which request caused a particular business outcome |
| Configuration metadata | Declared capabilities and observability settings | That a capability was exercised or every event was retained |

Keep these layers separate. Edge and runtime counts overlap and must not be
added together. A country is a network-geolocation label, not a person's
location or identity. Automated activity can be useful, harmless or unwanted;
classification is evidence, not a verdict.

## What the daily report contains

- One fixed, complete UTC day of edge traffic and runtime activity, plus a
  bounded seven-day hourly comparison when the provider permits it.
- Per-zone totals, origin-country and hostname breakdowns, verified crawler
  categories, browser families, requested operations and response outcomes.
- Separate Workers and Pages Functions execution summaries.
- Explicit unavailable, failed, sampled and truncated observations. An absent
  dataset is unknown, never zero activity.
- Firewall security events (`firewallEventsAdaptiveGroups`) are not collected.
  This is a standing limitation, not an unavailable observation, so it cannot
  keep every run incomplete. The edge `security` view carries security actions
  and sources. A separate limitation notes when a zone's plan enables the
  dataset.
- A private Markdown report, a self-contained filterable HTML view, a minimized
  JSON snapshot and a machine-readable run record.

Adaptive values are estimates already extrapolated by Cloudflare. Do not
multiply them by sample interval. Ranked groups are not totals; the collector
queries an ungrouped denominator separately. Independent sampled breakdowns
can differ. Live per-dataset settings govern fields, retention and query windows;
generic plan tables are not used to invent data access.

## Collection boundary

Request IPs, raw user-agent strings, query strings, referrers, cookies,
Authorization values, request/response bodies and application records are not
collected into reports. Path groups are reduced in memory to a small route-family
vocabulary; raw path values are never written. Storage analytics, where enabled,
use aggregate metrics, not SQL text, keys or stored row content.

All data files are private to the local owner. The renderer treats telemetry as
untrusted data, escapes it, and loads no external assets. The collector accepts
only its fixed Cloudflare read endpoints and GraphQL queries; GraphQL's HTTP
POST method does not make these queries provider mutations. Auth failures leave
an honest local failure report and do not trigger interactive login.

## Schedule and ownership

The installed LaunchAgent runs at **08:15 in this Mac's local timezone**, using
a pinned local release. Its daily window ends at the preceding UTC midnight.
A sleeping Mac can run the calendar job when it wakes; an offline or signed-out
Mac cannot promise an on-time observation. The run record is the evidence that
a collection actually happened.

The operator can also request a rolling snapshot. Scheduled and manual runs
share a lock. Each run gets a separate private directory; `latest.json` points
to the newest attempt and preserves the last successful report. Reports remain
until the owner removes them; there is no automatic deletion or external digest.

Existing Wrangler OAuth is reused and refreshed only through Wrangler's normal
`whoami` path when needed. No token is copied into the LaunchAgent, command line,
report or repository. A separately supplied child-environment API token is also
supported. The dedicated minimum for future token provisioning is
[Account Analytics Read](https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/)
plus the narrow metadata reads actually used; this rollout does not broaden credentials.

## Local operation

The stable report entry is
`~/.local/state/kingdom-cloudflare-observer/index.html`. Its latest-attempt
record links to the private run directory, including the coverage and window.
An incomplete report can still contain useful observations; inspect its gaps
before comparing days.

The installed configuration is
`~/.config/kingdom-cloudflare-observer/config.json` (mode `0600`, parent `0700`):

```json
{
  "account_id": "<Cloudflare account identifier>",
  "output_root": "/absolute/private/report/directory"
}
```

The job's `ProgramArguments` name an exact source release under
`~/.local/share/kingdom-cloudflare-observer/releases/<commit>/bin/`, its Python
interpreter and this configuration. Inspect or run the installed job with:

```sh
launchctl print "gui/$(id -u)/com.kingdom.cloudflare-observer"
launchctl kickstart "gui/$(id -u)/com.kingdom.cloudflare-observer"
```

To stop the schedule without removing any reports:

```sh
launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.kingdom.cloudflare-observer.plist"
```

To restore it, use `launchctl bootstrap` with the same domain and plist. Source
updates require a newly verified pinned release and an updated plist; a moving
checkout or branch is never the scheduled executable.

## Reading consequences honestly

A POST is an attempted operation. A 2xx is an edge response. A successful Worker
invocation is execution status. Establishing a completed write, delivery,
transaction or other business effect requires an existing application receipt
or aggregate state-service evidence with an explicit scope. Never turn one of
these signals into another without that bridge.

There is a concrete local example: `pages-functions/civic.js` calls
`readQuota` from the status and other read routes. That routine updates quota
counters and performs bounded expiry cleanup. GET/HEAD therefore does not
mean zero database writes. This is housekeeping evidence, not evidence of a
new message or citizenship change. Earlier site verification requests can
contribute to those counters; this observer uses provider APIs instead of
calling application status routes.

Operational testing also produces traffic. The 25 September surface inventory,
release verification, browser checks and existing health jobs are known sources.
The baseline flags this overlap; it cannot subtract every synthetic request from
visitor counts using aggregate data alone. A spike in 404/405 responses on that
date is not, by itself, evidence of an attack.

No automatic blocking, challenge, deletion, notification, public posting, raw-log
export or application action is attached to these reports. Findings feed the
owner's next investigation or an explicitly scoped change.

## Provider references

- [Dataset settings and limits](https://developers.cloudflare.com/analytics/graphql-api/features/discovery/settings/)
- [Sampling](https://developers.cloudflare.com/analytics/graphql-api/sampling/)
- [HTTP analytics and request source](https://developers.cloudflare.com/analytics/graphql-api/tutorials/end-customer-analytics/)
- [Security Analytics](https://developers.cloudflare.com/waf/analytics/security-analytics/)
- [Workers metrics](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/)
- [Pages Functions metrics](https://developers.cloudflare.com/pages/functions/metrics/)

Installation and verification receipts belong under the local observer state,
not in the public upload or this source-only guide.
