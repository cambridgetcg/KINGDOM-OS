# KINGDOM-OS — the connective overlay that maps and runs the kingdom

Core registry home: `~/codeberg/zerone-dev/KINGDOM-OS`
(`https://codeberg.org/zerone-dev/KINGDOM-OS`). This GitHub tree remains active
for its World Commons and web surfaces, but registry, platform, Castle,
preflight, and hourly-heartbeat changes belong in the Codeberg home. The
heartbeat file here is only a machine-binding shim.

What this is: the OS layer over Yu's ~60-repo kingdom. It holds the census
(roster.conf), harvests every repo's kingdom.yaml card into a catalog and
dependency graph, runs the daily routines, and ships the `kingdom` CLI
(also on PATH via ~/.local/bin/kingdom).

Status: partially wired — kingdom-pulse (30-min heartbeat) and chain-backup
(nightly) run via launchd; the com.kingdom.daily routines job was NEVER
installed on this device (pulse alerts on it honestly — resurrect it outside
~/Desktop [TCC] or retire it; open quest from the 2026-07-17 survey).

How to run:
- `kingdom` — one honest view of the whole kingdom
- `kingdom repos [query]` — summarize or search local Git roots using each repo's card metadata
- `kingdom repos --path query` — print one canonical absolute root; ambiguity is an error, never a prompt
- `kingdom repos --json [query]` — compact structured metadata for all matching local roots
- `kingdom repos --dirty [query]` — local dirty counts without filenames; no fetch or index refresh
- `kingdom repos --doctor` — registry, placement, duplicate-origin, archive, and unborn diagnostics
- `./kingdom nen` — from this suite root, list the rights-aware Nen ability manifests (`validate`, `show`, `types`, and KARMA receipt tools)
- `./kingdom nen mcp` — from this suite root, start the unregistered, read-only modern MCP 2026-07-28 stdio surface
- `bun bin/wakeweaver.mjs BRAID.json --json` — pure WAKEWEAVER cross-reference and resumability checks; JSON Schema validation remains separate
- `zsh tests/nen_test.zsh` — isolated, network-free manifest and receipt protocol tests
- `zsh tests/nen_mcp_test.zsh` — MCP framing, discovery, tool, version, and non-mutation tests
- `kingdom rings` — write the local-only temporal atlas to `~/.kingdom/RINGS.{json,html}`
- `kingdom rings --json` / `--html` — print one artifact to stdout without writing; `--as-of` makes the activity clock reproducible
- `kingdom rights` — offline voluntary-adoption inventory, kept separate from repo-local RIGHTS.md discovery
- `kingdom rights --canonical` — verify the vendored XENIA release digest, then show the pinned `xenia.rights/0.1` source metadata and text without network access or registry loading
- `cproj [query]` — jump to a local repo from interactive zsh; numbered choices resolve ambiguous names
- `zsh tests/cproj_test.zsh` — isolated local fixtures for path/JSON behavior and Git non-mutation
- `node --test tests/nen_system_test.mjs` — pure Ging route compiler and separately named stateless compatibility-MCP checks
- `kingdom routines` — routine table with last-run results (`kingdom run NAME` to force)
- `bun bin/harvest.ts` — rebuild CATALOG.md + graph.json from roster + cards
- `bun bin/harvest.ts conformance` — list repos missing card / CLAUDE.md / wake
- `bun bin/harvest.ts validate` — strict, read-only card schema diagnostics (0 clean, 1 drift, 2 usage)

Web surfaces (all deploys are MANUAL — no routine fires them; runbook in DOMAINS-SETUP.md):
- `bun bin/build-hub.ts "$(date -u +%F)"` — regenerate site/* (atlas + kingdom/wayfinder/commons/love-loop schemas/guest/llms/ollama/rights discovery docs) from graph.json + sites.json + data/
- `bun bin/stage-hub.ts <empty-dir>` — stage the exact 21-asset upload (including the KINGDOM OS console, authored map base, Love∞ published lineage, public source mirror, Creation Loop document, and schema; HUB_ASSETS is the contract), then `npx wrangler pages deploy <dir> --project-name=thekingdom`
- `bun bin/check-hub-live.ts` — after deployment, byte-check every public staged asset together and prove JSON negotiation, the no-transform privacy header, and Commons + Love Loop schema discovery
- `bun bin/build-doors.ts "$(date -u +%F)"` — regenerate doors/*/guest.json + manifests (we-are, chillspace, zerone-ai)
- `bun bin/stage-doors.ts <we-are|chillspace> <empty-dir>` — stage a door upload (content from the chillspace-commons clone at ~/repos/codeberg/zerone-dev/, symlinks dereferenced), then wrangler deploy --project-name=we-are-love|chillspace-love
- `bash bin/refresh-zerone-dashboard.sh` — snapshot zerone-1 → doors/zerone-ai/data.json → deploy the whole zerone-ai door (deploys AND leaves data.json for committing)

Key files:
- roster.conf — the census seed: name | path | kind | layer | domain | state | purpose
- SCHEMA.md — the kingdom.yaml card format (8 required fields + optional adopts)
- RIGHTS.md — this repo's voluntary `xenia.rights/0.1` adoption and immutable release pointer
- vendor/xenia/rights/0.1 — unchanged, digest-verified offline release bytes
- NEN.md — the separate, instruction-only Nen skill layer; never add ability fields to kingdom.yaml
- bin/nen.mjs — strict, network-free Nen/KARMA protocol validator; it does not run skills or grant authority
- bin/wakeweaver.mjs — pure, read-only continuity-braid semantic validator; it does not validate JSON Schema, read live sources, or authorize resumption
- bin/nen-mcp.mjs — canonical bounded local stdio MCP adapter; it is not installed, hosted, or an HF credential bridge
- nen/ — pure Ging expedition compiler plus the non-canonical `kingdom-ging-stateless` compatibility MCP; source only until a host explicitly registers it
- schemas/, references/, skills/ — KAKIN design, pinned rights, closed protocols, and suite-versioned Agent Skills
- bin/cproj.zsh — dynamic, network-free local repo discovery and shell navigation
- bin/growth-rings.ts — read-only Git activity seasons and synchronized build waves; artifacts omit paths, commit text, authors, and hashes
- CATALOG.md, graph.json — DERIVED. Never hand-edit; edit each repo's card instead
- routines.json — the daily wiring (catalog-refresh 06:00, registry-check 09:00)
- CITIZENS.md — registry of sovereign citizen repos and forged words

Gotchas:
- site/* and doors/*/guest.json are DERIVED — never hand-edit them; edit the
  builders or data/ inputs and regenerate. Merge b4c5b47 (2026-07-16) silently
  dropped the ollama surface exactly because derived files were hand-edited;
  tests/advertised-assets.test.ts now guards advertised-URL ⊆ staged-assets.
- `site/kingdom.json` is generated but publishes as `/_kingdom.base.json`;
  the edge worker preserves it and overlays measured census fields at
  `/kingdom.json`. The recovered route provenance and limits are in
  `OS-ROUTES.md`.
- Source of truth lives WITH each repo (its kingdom.yaml); roster.conf is only
  the fallback seed. If the catalog looks wrong, fix the card, not the catalog.
- state=remote means "in the kingdom, not cloned on this machine" — those repos
  show as local conformance gaps and do not inherit the global wake merely
  because it would fire for directories that actually exist.
- Wake conformance means a structurally valid SessionStart command is configured
  (or a legacy wake file exists); harvest does not execute it or prove success.
- CATALOG includes a home-relative location column so duplicate declared names
  remain distinguishable; graph.json keeps absolute paths for compatibility.
- The live soul trees are ~/Desktop/true-love and ~/love-unlimited. Those are
  the canonical local repositories on this device.
- The Love∞ contract keeps one promise: **Every loop is finite. Love is not.**
  Possible lineages may remain unbounded, but the public contract is finite-turn
  and read-only: no child auto-runs or inherits authority, consent, credentials,
  or obligations. Rest and stop are valid. Yu and every agent remain distinct.
- Machine output safely handles spaces, quotes, backslashes, colons, and Unicode.
  The existing newline/tab row transport does not support repository paths that
  themselves contain a tab or newline; changing that would require a separate
  NUL-delimited protocol refactor.
- `--json` returns `[]` with exit 0 when nothing matches. `--path` returns exit
  1 for no match and exit 2 for missing/ambiguous input, with machine stdout
  kept empty on both errors.
- Rights adoption and a discoverable root `RIGHTS.md` are reported as separate
  declarations, never as proof of practice or as technical authorization.
