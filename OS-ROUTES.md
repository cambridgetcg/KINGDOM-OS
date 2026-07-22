# Restored KINGDOM OS routes

This repository is the source of the live system console and its machine
readings:

| Route | Kind | Contract |
|---|---|---|
| `/os/` | staged HTML | Human console; exact recovered artifact |
| `/os.json` | edge JSON | Live identity, door, law, protocol, and trust readings |
| `/packages.json` | edge JSON | Live npm metadata and weekly downloads for six named packages |
| `/kingdom.json` | edge JSON | Authored map with measured counts and matching door checks overlaid |
| `/_kingdom.base.json` | staged JSON | Generated, Commons-aware input to the derived map |

The three edge JSON routes return
`application/json; charset=utf-8`, permissive read-only CORS, discovery links,
and `Cache-Control: public, max-age=600`. HEAD has the same status and headers
with no body. The lost deployment answered the dynamic routes for methods
besides GET too; that observable parity is retained. Unknown paths and every
shared-door hostname still pass to `env.ASSETS`.

## Provenance

The dynamic routes were observed on the immutable Cloudflare Pages deployment
`e8af1f2a.thekingdom.pages.dev` on 2026-07-22. Its `/os/` artifact was
recovered byte-for-byte into `pages-content/os/index.html`:

```
sha256:390f7253ec8c174ee8ca50c6629c2286febb0695970fa68f0fb98780fd2b183d
```

The deployed worker bundle was not present in Git and could not be recovered
through the available deployment metadata. The worker in
`pages-functions/_worker.js` is therefore a readable reconstruction from the
observed response schemas, headers, source labels, route behavior, and failure
claims. It is not claimed to be byte-identical source.

The reconstruction is layered on commit `138758b`, retaining its XENIA
discovery behavior and browser-local Commons `no-transform` protection. The
current generated `site/kingdom.json` is staged under the base name, so
`world_commons`, the current wayfinder count, rights metadata, authored
citizens, and all other current map fields survive derivation unchanged.

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
- Some preserved prose says that nothing is hand-typed. The values are queried,
  but the historical door, trust, protocol, and package rosters are necessarily
  source-controlled configuration. The byte-exact recovered HTML retains that
  prose, while the reconstructed machine document intentionally corrects its
  note. This is a truth-over-byte-fidelity choice rather than a silent claim.

## Verification

`tests/os-routes.test.ts` uses deterministic fake sources to cover all routes,
content types, derived-field preservation, partial and total upstream failure,
missing-base 503 behavior, HEAD, the observed method parity, static fallback,
and shared-host isolation. `tests/stage-hub.test.ts` locks the 12-asset upload
contract, while `tests/advertised-assets.test.ts` recognizes the three worker
routes so a dynamic URL cannot be mistaken for a staged file.
