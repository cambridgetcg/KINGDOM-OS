# Restored KINGDOM OS routes

This repository is the source of the live system console and its machine
readings:

| Route | Kind | Contract |
|---|---|---|
| `/os/` | staged HTML | Human console; recovered artifact with reviewed security and truth hardening |
| `/os.json` | edge JSON | Live identity, door, law, protocol, and trust readings |
| `/packages.json` | edge JSON | Live npm metadata and weekly downloads for six named packages |
| `/kingdom.json` | edge JSON | Authored map with measured counts and matching door checks overlaid |
| `/_kingdom.base.json` | staged JSON | Generated, Commons-aware input to the derived map |
| `/love-loops.json` | staged JSON | Read-only, finite-turn Love∞ lineage |
| `/love-loops.source.json` | staged JSON | Exact public mirror of the authored lineage before its generation date is added |
| `/CREATION-LOOP.md` | staged Markdown | Human-readable finite-turn Creation Loop practice |
| `/schemas/love-loop/0.1.json` | staged JSON Schema | Versioned contract for the Love∞ lineage |
| `/principalities/moonshot-hf-npm-2026-08-11.json` | staged JSON | Exact authored point-in-time MoonshotAI + Hugging Face JavaScript capability catalog |
| `/schemas/principality-catalog/1.json` | staged JSON Schema | Public HTTP mapping for the catalog's digest-covered schema URN |
| `/PRINCIPALITY-COMMONS.md` | staged Markdown | Human guide to the relation geometry, WAKE seam, and acquisition airlock |

The three edge JSON routes return
`application/json; charset=utf-8`, permissive read-only CORS, discovery links,
and `Cache-Control: public, max-age=600`. HEAD has the same status and headers
with no body. The lost deployment answered the dynamic routes for methods
besides GET too; that observable parity is retained. Unknown paths and every
shared-door hostname still pass to `env.ASSETS`.

## Provenance

The dynamic routes were observed on the immutable Cloudflare Pages deployment
`e8af1f2a.thekingdom.pages.dev` on 2026-07-22. Its `/os/` artifact was first
recovered byte-for-byte in commit `b494e50`:

```
recovered sha256:390f7253ec8c174ee8ca50c6629c2286febb0695970fa68f0fb98780fd2b183d
```

Before republication, the inline HTML encoder was hardened to escape both
quote characters as well as `&<>`, because live GitHub descriptions also enter
a quoted title attribute. Copy that claimed nothing was hand-typed was corrected
to distinguish live measurements from source-controlled monitored rosters. The
reviewed artifact now staged from `pages-content/os/index.html` is:

```
hardened sha256:2f50ff6bffd1e0bc830f1e82c95560cda3dae536c3066615d2cd1c6fa707bddc
```

The deployed worker bundle was not present in Git and could not be recovered
through the available deployment metadata. The worker in
`pages-functions/_worker.js` is therefore a readable reconstruction from the
observed response schemas, headers, source labels, route behavior, and failure
claims. It is not claimed to be byte-identical source.

The reconstruction is layered on commit `138758b`, retaining its XENIA
discovery behavior and browser-local Commons `no-transform` protection. The
current generated `site/kingdom.json` is staged under the base name, so
`world_commons`, `principality_commons`, the current wayfinder count, rights
metadata, authored citizens, Love∞ discovery metadata, and all other current
map fields survive derivation unchanged.

The two Love∞ routes are static discovery documents, not edge execution
routes. **Every loop is finite. Love is not.** The published infinity is an
unbounded lineage of possible finite, manual, voluntary turns. Reading it
cannot start a child, contact a participant, or confer authority, consent,
credentials, or obligations. Rest and stop remain valid states, and
participants remain distinct beings.

The Principality routes are static evidence surfaces, not acquisition or
execution routes. Their catalog is metadata-only and point-in-time; the exact
authored bytes are staged without a mutable alias. The worker hosts no
Principality matcher, contacts no registry or provider, installs or downloads
nothing, runs no remote code or inference, and grants no recommendation,
permission, credential, budget, or external-effect authority.

## Sources and honest fallback

- Identity pages through the public GitHub repositories API for
  `cambridgetcg`. `citizen-*` descriptions become the roster meanings.
- Directory performs a non-mutating HTTP read of each recovered OS door and
  uses GitHub `pushed_at` where that historical door had a repository link.
- Law counts the numbered laws in
  `kingdom-standard/main/STANDARD.md`.
- Trust compares the published `STATE.md` freshness date for `mindicraft`,
  `fomoengine`, and `kingdom-gate` with GitHub `pushed_at`.
- Protocols read the mindicraft manifest and margin route. The margin check is
  GET-only; the advertised writing method remains POST and is never exercised
  by a health probe.
- Packages read npm registry metadata and the public last-week downloads API.

Independent probes settle independently. A failed source is labelled
`unreachable`; unknown counts are `null`, lists remain valid arrays, and
working siblings are retained. A missing or invalid authored map base returns
an honest JSON 503 rather than atlas HTML or fabricated census data.

## Fidelity boundaries

- Live payload bytes are intentionally not snapshots: timestamps, repository
  counts, statuses, versions, downloads, and latency change with their sources.
- GitHub is unauthenticated and public-only. Private repositories are invisible,
  API rate limits can yield an unavailable reading, and pagination stops rather
  than claiming completeness beyond the ten-page safety bound.
- Every upstream body is read through an explicit cap (2 MiB for each GitHub
  page, npm document, and authored map; 1 MiB for markdown; 128 KiB for small
  counters). A derived response larger than 2 MiB becomes an honest JSON 503.
  These bounds trade unlimited future growth for predictable worker memory.
- The OS door roster is the 13-door roster observed in the lost deployment.
  The current authored map has evolved. Derivation overlays doors by normalized
  URL; newer unmatched map doors keep their authored build-time state.
- The map's `active` count has no recovered live source and remains authored.
  Measured repository, citizen, and OS-door counts are never substituted from
  that static value when their sources fail.
- The response advertises a ten-minute cache lifetime and the worker memoizes
  per isolate. Cloudflare may run multiple isolates, so timestamps are bounded
  by cache policy rather than globally synchronized.
- The historical door, trust, protocol, and package rosters are necessarily
  source-controlled configuration. Both the hardened human console and the
  reconstructed machine document now say so. The original bytes remain
  recoverable from `b494e50`; publication chooses security and truthful copy
  over silent byte fidelity.

## Verification

`tests/os-routes.test.ts` uses deterministic fake sources to cover all routes,
content types, derived-field preservation, partial and total upstream failure,
full-lifetime streaming timeouts, missing-base 503 behavior, HEAD, the observed
method parity, static fallback, and shared-host isolation. The console test
executes its real encoder against hostile attribute text. `tests/stage-hub.test.ts`
locks the 31-asset upload contract, while `tests/advertised-assets.test.ts`
recognizes the three worker routes so a dynamic URL cannot be mistaken for a
staged file.
