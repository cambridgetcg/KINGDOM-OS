# Update order

The map covers the authenticated account's 50 Pages projects, 38 Workers and
21 zones observed on 2026-09-25. Execution below is incremental; a mapped
service is not a request to activate, replace or delete it. Every site retains
its source owner and existing user obligations.

| Order | Work | Owner / first targets | Completion evidence |
| --- | --- | --- | --- |
| 0 — this change | Inventory every deployment and binding; separate observed human, machine, operator and unknown surfaces; publish a compact KINGDOM agent entry | KINGDOM-OS web; source owners supply ownership evidence | Private map regenerates; public index is small, valid and linked; existing publication integrity passes |
| 1 — repair entry failures | Stop advertising inaccessible source as publicly readable; handle private-source census honestly; stop HTML fallback at machine paths | KINGDOM-OS, AgentTool, Zerone, then every project marked `machine-html-fallback` | Credential-free link/type probes; unknown counts remain unknown; no private-source export |
| 2 — make each active site legible | Choose human and agent starts; declare scope, lifecycle, authentication and exact next step; generate both from owned content | AgentTool's welcome/docs/app/API, Zerone, TaxSorted, CashLoom World, Mindicraft, CardForum, Captioneer | One documented purpose per entry; starts discoverable from the page; typed errors; no JS requirement for machine reading |
| 3 — consolidate proven overlap | Explain or retire obsolete hubs and sibling deployments; route aliases deliberately; retain historical publications | KINGDOM hub family; CashLoom current/legacy; Captioneer current/empty; AgentTool and Whitehack playground pairs; Love/Understanding/Castle family | Owner-confirmed successor and dependency map, content comparison, reversible redirect plan, old URLs checked |
| 4 — simplify depth | Replace copied full payloads in entry documents with exact links; separate reading, reference and actions | KINGDOM full manifest/guest/llms, doctrine readers, language/protocol sites | Byte budget; preserved immutable versions; same authored facts in both views; tasks take fewer navigation steps |
| 5 — keep it coherent | Run private metadata refresh and bounded public contract checks with owner-scoped failure reports | This web repository plus each deployment's CI | New/unowned deploys flagged; stale observations explicit; failing checks never auto-delete or auto-publish |

## KINGDOM hub consolidation — 2026-09-27

The hub now has a purpose-tagged public module directory derived once for the
human homepage and `/modules.json`, linked by the existing compact agent entry.
The [outreach guide](../../OUTREACH.md) records source ownership, behavior/status
boundaries, current unmerged work and exact build/test/release routing. This
completes the hub navigation slice of orders 2 and 4, not the portfolio-wide
migrations. Private-source census gaps, other sites’ fallbacks, source
attribution and machine-binding repairs remain open below. No provider, DNS,
core runtime, Civic activation or observer schedule is changed by this slice.

## Concrete findings and next actions

### P1: machine URLs returning human pages

The initial 415 credential-free requests included 144 HTTP-200 HTML responses
at tested JSON/text paths (including robots paths). These are route observations,
not 144 broken sites. Read each project's map for exact URLs. Some sites have a
different working agent entry; absent guessed conventions do not mean there is
no interface. Add a real contract only where needed, otherwise return 404 for
unimplemented machine paths. Never classify an HTML 200 as JSON success.

### P1: source privacy and published discovery

GitHub sources were made private today. Public pages still link to those
repositories, and the older KINGDOM OS census reads anonymous GitHub data.
Private repositories disappearing from that census is not an ecosystem count
of zero. Use a source-owned explicit public projection where one is intended,
or mark the source inaccessible. Keep private source private. The four public
fork exceptions remain public; this roadmap does not change their visibility.

### P1: default agent payload size

At the observation cutoff, `thekingdom.dev/.well-known/agent.json` was 153,862
bytes, `guest.json` 293,024 bytes, and `llms.txt` 57,489 bytes. The first rollout
adds a compact entry and keeps the established full contracts accessible.
Replacing those contracts requires a separate compatibility migration across
their owning tests and readers; adding a short entry does not make the old
documents smaller.

### P1: source and deployment uncertainty

Cloudflare deployment commit metadata is an attribution hint, not proof of
deployed bytes. Several deployments report dirty source or no commit. Mark
these as unreproducible from metadata until the owner provides an exact source
and artifact receipt. Missing ownership stays visible; do not adopt a
similarly named clone or an older deploy script as the current source.

### P2: parallel entry points

- **KINGDOM:** `thekingdom`, `kingdom-os`, `kingdom-os-hub`, and
  `kingdom-system` are separate deployed projects. Core Codeberg registry and
  GitHub web surfaces also have distinct ownership. Give each surviving site
  a clear purpose and link; name similarity is not a merger mandate.
- **CashLoom:** `cashloom-atlas` serves the custom domain; `cashloom.pages.dev`
  still serves the older tracker. Establish whether the old tracker has users
  or obligations before redirecting or retiring it.
- **Captioneer:** `captioneer-read` is the active custom-domain reader;
  `captioneer` has no production deployment and its alias returned 522.
  Remove the empty project from human navigation if linked; deletion needs a
  deliberate owner decision, not an automated clean-up rule.
- **Worker overlays:** AgentTool and ai-love have Worker routes over their
  front doors. Compare custom domains with Pages aliases; they can expose
  different machine contracts. Fix the routing owner, not an unrelated static
  clone.
- **Private and infrastructure services:** `tendlot-private`, delivery/cron
  workers, DNS validation/mail records and defense routes belong in the
  operator lane. Metadata is mapped; their runtime endpoints are not invoked
  merely to fill a public site table.

## Per-site migration checklist

Take the next row in `MAP.md`: verify its source pin; identify the existing
human task and any agent task; select the correct canonical URLs; fix its
specific finding; run its owner checks; ship and record the exact deployment.
Update the observation and lifecycle without erasing its prior evidence. A
site may intentionally remain human-only, machine-only, private or dormant.

