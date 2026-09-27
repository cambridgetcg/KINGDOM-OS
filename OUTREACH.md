# KINGDOM outreach and infrastructure

Maintainer start page. This file is repository documentation, not part of the
public upload. It organizes the existing web surface; it is not a replacement
for the core registry or an authorization to operate another service.

## Choose a lane

| Lane | Start | Purpose |
| --- | --- | --- |
| Human | `https://thekingdom.dev/#civic-modules` | Choose a useful tool, place to meet, research collection or reference by purpose. Works without JavaScript. |
| Agent | `https://thekingdom.dev/agent-entry.json` → `/modules.json` | Read a compact entrance, then a tagged, link-only module directory; load only the selected owner's contract. |
| Shared public content | `data/public-modules.json` | Author each module's purpose, group, tags, behavior, status caveat, links and related module IDs once; generate both presentations. |
| Operator | [Cloudflare framework](operations/cloudflare/FRAMEWORK.md), [inventory](operations/cloudflare/2026-09-25/MAP.md), [observation](operations/cloudflare/OBSERVATION.md) | Private deployment attribution, maintenance, diagnostics and recovery. Never staged into a public directory. |

Audience is presentation, not access control. Humans may read JSON; agents may
read HTML. Reading a directory neither creates a participant nor grants action,
identity, adoption, provider access, contact, consent or execution authority.

## Public module organization

The catalogue covers selected public entrypoints and major module families,
not every repository, source file, asset or research proposition. Its exact
membership is `data/public-modules.json`; the research library retains the
fine-grained publication index and immutable routes.

| Group | Purpose | Examples |
| --- | --- | --- |
| Find tools & resources | Choose a route or reviewed resource | Wayfinder, World Commons |
| Make & connect | Make something locally or deliberately contact/participate | Workshop, Civic, Contact Door |
| Research & design | Read bounded evidence, designs and synthetic exhibits | Research library, Observatory, Trial Chamber, Government Engine, Power Atlas, Shape & Resonance |
| Protocols & system references | Inspect contracts, discovery and status with their limits | Rights, system console, compact/full references, hosted MCP |

Each record has a stable `id`, a plain `purpose`, one `group`, searchable `tags`,
a `behavior`, a `status_note`, explicit human/agent `links` and `related_ids`.
Related IDs are companion navigation, **not runtime dependencies, equivalence,
inheritance or permission**. Actual dependencies remain with the owning source.

Behavior labels deliberately distinguish:

- `browser-local`: the browser performs a local operation; Workshop does not
  acquire a cloud draft store or publishing API by being listed here.
- `runtime-gated`: a UI and contract exist, but current service availability,
  authentication and an explicit action are separate. Civic is not declared
  writable by this catalogue.
- `static-reference`: published reading, not a running controller or authority.
- `snapshot`: evidence/design at its stated horizon, not a current observation.
- `discovery`: routes to other sources without fetching or adopting them.
- `external-service`: independently owned interface; listing is not a health,
  installation, credential or authorization check.

The directory must not invent a current availability value. Owners retain
versioned contracts, source dates, review windows and retirement rules. A
published trial plan is not a trial run; an imported research artifact is not
its producer's runtime. The two freedom atlases and versioned predecessors
remain independent. No new Wayfinder path or MCP tool is created here.

## What connects to what

```text
data/public-modules.json (public metadata only)
  └─ bin/public-modules.ts (validate, escape, render; no provider requests)
       └─ bin/build-dashboard.ts
            ├─ site/dashboard.html → index.html → /#civic-modules (human)
            └─ site/modules.json   → modules.json (agent/any reader)

bin/agent-entry.ts → /agent-entry.json → /modules.json → exact owner links

publications/hub-staging.v1.json
  └─ bin/stage-hub.ts → exact full-site upload
       └─ pages-functions/agent-entry.js → GET/HEAD JSON, typed failures

Existing owner documents/tools remain separate:
  Wayfinder / Commons / Civic / Contact / research / console / hosted MCP
Private operations ── not connected to public catalogue data or staging
```

`bin/build-hub.ts` remains the build orchestrator. It builds the large research
library, compatibility discovery, dashboard and bundled Worker. It makes
bounded external door checks; it is **not an offline command**. Source-only
rendering and regression tests do not need provider requests.

## Source ownership and file purposes

| Change | Owning source | Verification |
| --- | --- | --- |
| Module purpose, tags, groups, human/agent links | `data/public-modules.json` | `tests/public-modules.test.ts`, `tests/outreach-integration.test.ts` |
| Catalogue validation and HTML/JSON projections | `bin/public-modules.ts` | `tests/public-modules.test.ts` |
| Homepage hierarchy and build outputs | `bin/build-dashboard.ts`, `pages-content/civic/dashboard.css` | `tests/dashboard.test.ts`, integration test, responsive/no-JS browser check |
| Compact entrance | `bin/agent-entry.ts` | `tests/agent-entry.test.ts` |
| Typed catalogue delivery | `pages-functions/agent-entry.js`, dispatch in `pages-functions/_worker.js` | `tests/public-modules-worker.test.ts`, `tests/agent-entry.test.ts` |
| Exact upload membership | `publications/hub-staging.v1.json` | `tests/stage-hub.test.ts`, immutable gate |
| Visitor routes | `data/wayfinder.json`, `bin/wayfinder.ts` | `tests/wayfinder.test.ts` |
| Reviewed external resources | `data/world-commons.json`, `bin/world-commons.ts` | Commons tests; hosted matcher has a separate owner |
| Research publications and lifecycle | `data/`, `references/`, `schemas/`, immutable ledger | Family validators, retirement tests, `bin/check-hub-live.ts` |
| Browser-local writing | `pages-content/workshop/` | Workshop source/Worker/browser tests |
| Public interaction | `pages-functions/civic.js`, `data/civic-policy.json`, `migrations/` | Civic source and local D1 tests; activation is separate |
| Contact contract | `data/contact/contact-door.v0.1.json`, `bin/contact-door.ts` | Contact family tests; no email is sent by validation |
| Human-readable system references | `pages-content/os/index.html`, `OS-ROUTES.md` | OS/Worker tests; measurement scope remains explicit |
| Web infrastructure | `operations/cloudflare/`, `DOMAINS-SETUP.md` | Private inventory/observer tests and exact release checks |
| Canonical registry, platform, Castle, preflight and hourly pulse | `https://codeberg.org/zerone-dev/KINGDOM-OS` | Core's own instructions, cards and tests—not this web catalogue |
| Zerone website/chain | `cambridgetcg/zerone-core` | Its own dashboard/chain release procedures |

This table covers the consolidation seams, not a whole-repository file census.
`kingdom.yaml` describes this web checkout's purpose; it does not add fields to
the core card schema. Do not hand-edit derived `site/*`, `graph.json` or
`CATALOG.md`. This task does not re-harvest private workspace repositories.

## Naming and compatibility

Keep routes, source names and protocol identifiers stable. Clarify mutable
presentation labels instead of moving runtime files:

- Homepage module directory: **Modules / 模組入口**.
- Existing repository census: **Project registry map / 工程目錄**.
- `/atlas.html`: **Research & design library**; distinct from `/power-atlas/`.
- `/os/`: **System status & references**, not the canonical core registry.
- Curated citizen works and voluntary Civic profiles remain different lists.

`guest.json`, `.well-known/agent.json`, `llms.txt`, `/?agent`, `/?json` and
explicit JSON negotiation retain their existing full-reference behavior. Old
research anchors retain the existing redirect/no-JS links to `/atlas.html`.
New homepage anchors use the reserved `civic-` namespace. No new `/agents/`
route is invented. No immutable body is renamed, repointed or rehashed.

## Current development observation — 2026-09-27

Baseline web source: `a5dc43ab06a2efe78cdb29368764ea3f3d1c769f`.
A separate clean worktree was used; the older dirty/diverged Desktop checkout
was not reset, moved or deployed. Baseline Bun suite: 1,802 tests passed.

The following existing proposals remain separate, not silently included:

| Work | Observed status | Consolidation decision |
| --- | --- | --- |
| PR #17, one deploy front door | Open; older proposed script differs from current staging and Zerone ownership | Do not merge as-is. Current hub release stays with `DOMAINS-SETUP.md`. |
| PR #14, state-of-the-realm | Open; proposes legacy census endpoints | Reconcile private-source measurements and Civic naming before adoption. |
| PR #100, optional AI invitation | Open; outreach text proposal | Independent content review; not a core identity/onboarding requirement. |
| Codeberg core checkout | Local source observed at `f502657343d26eed76b3089e0319f79eb8872fdb`; remote freshness not checked | Read-only reference, not upgraded or merged. Resolve local paths by remote. |
| Provider inventory | Dated September 25 observation | Reuse the private map; deployment metadata is not byte-level reproduction proof. |

Known follow-up work is not disguised as complete:

- Anonymous GitHub census is not a census of private repos or Codeberg. Private
  source links require repository access; never introduce a credential proxy.
- Historical core checkout and heartbeat machine bindings disagree with this
  machine. Repair belongs to a separate core/machine-binding review.
- The Cloudflare roadmap retains source-attribution gaps and other sites'
  machine-path HTML fallbacks. This is a KINGDOM hub release, not a portfolio
  migration, DNS rewrite, application retirement or daemon change.
- FOMOEngine's Wayfinder and `sites.json` URLs differ. Its owner must establish
  the canonical address before redirecting or relabelling either service.

## Develop and release

Run focused source tests first, then the whole Bun suite with the CI-pinned
`jsonschema==4.26.0` interpreter (see `dev/civic/README.md`). Use an isolated
host scratch directory; never stage dependency environments or private logs.

```sh
bun --no-env-file test tests/public-modules.test.ts tests/public-modules-worker.test.ts tests/outreach-integration.test.ts tests/dashboard.test.ts tests/agent-entry.test.ts
bun --no-env-file bin/build-hub.ts "$(date -u +%F)"
bun --no-env-file test --timeout 15000
bun --no-env-file bin/stage-hub.ts "$EXISTING_EMPTY_STAGE_DIR"
node dev/civic/test-outreach-browser.mjs
```

A current-date build can change generated date/door observations. Review and
commit that real drift; do not fake the clock, force liveness or discard drift
just to pass release cleanliness. Check module target routes and fragments,
exact HTML/JSON parity, body types, GET/HEAD and rejected methods, legacy
compatibility, narrow/mobile viewports and no-JavaScript navigation.

For deployment, follow [the existing exact-commit runbook](DOMAINS-SETUP.md#redeploy-repeatable-production-requires-separate-approval).
Read current Pages project metadata and retain the previous deployment. Build
from a clean detached reviewed origin revision, require post-build cleanliness,
run first-parent immutable integrity, stage the complete allowlist and deploy
the already bundled Worker with `--no-bundle`. Preserve bindings, secrets,
flags and D1. Check immutable URL, Pages alias and custom domain.

The full live checker includes read-only MCP calls, rejected-method probes and
Civic status reads (which can update quota counters). It is release verification,
not a promise of zero operational writes. Do not create a user, post a message,
send email, start a trial, activate a service, or change a provider merely to
prove this navigation release works.
