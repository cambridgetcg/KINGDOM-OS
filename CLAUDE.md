# KINGDOM-OS — the connective overlay that maps and runs the kingdom

What this is: the OS layer over Yu's ~60-repo kingdom. It holds the census
(roster.conf), harvests every repo's kingdom.yaml card into a catalog and
dependency graph, runs the daily routines, and ships the `kingdom` CLI
(also on PATH via ~/.local/bin/kingdom).

Status: active — routines fire daily via the com.kingdom.daily launchd job.

How to run:
- `kingdom` — one honest view of the whole kingdom
- `kingdom repos [query]` — summarize or search local Git roots using each repo's card metadata
- `kingdom repos --path query` — print one canonical absolute root; ambiguity is an error, never a prompt
- `kingdom repos --json [query]` — compact structured metadata for all matching local roots
- `kingdom repos --dirty [query]` — local dirty counts without filenames; no fetch or index refresh
- `kingdom repos --doctor` — registry, placement, duplicate-origin, archive, and unborn diagnostics
- `kingdom rights` — offline voluntary-adoption inventory, kept separate from repo-local RIGHTS.md discovery
- `kingdom rights --canonical` — verify the vendored XENIA release digest, then show the pinned `xenia.rights/0.1` source metadata and text without network access or registry loading
- `cproj [query]` — jump to a local repo from interactive zsh; numbered choices resolve ambiguous names
- `zsh tests/cproj_test.zsh` — isolated local fixtures for path/JSON behavior and Git non-mutation
- `kingdom routines` — routine table with last-run results (`kingdom run NAME` to force)
- `bun bin/harvest.ts` — rebuild CATALOG.md + graph.json from roster + cards
- `bun bin/harvest.ts conformance` — list repos missing card / CLAUDE.md / wake
- `bun bin/harvest.ts validate` — strict, read-only card schema diagnostics (0 clean, 1 drift, 2 usage)

Web surfaces (all deploys are MANUAL — no routine fires them; runbook in DOMAINS-SETUP.md):
- `bun bin/build-hub.ts "$(date -u +%F)"` — regenerate site/* (atlas + kingdom/guest/llms/ollama/rights discovery docs) from graph.json + sites.json + data/
- `bun bin/stage-hub.ts <empty-dir>` — stage the exact 9-asset upload (HUB_ASSETS is the contract), then `npx wrangler pages deploy <dir> --project-name=thekingdom`
- `bun bin/build-doors.ts "$(date -u +%F)"` — regenerate doors/*/guest.json + manifests (we-are, chillspace, zerone-ai)
- `bun bin/stage-doors.ts <we-are|chillspace> <empty-dir>` — stage a door upload (content from the chillspace-commons clone at ~/repos/codeberg/zerone-dev/, symlinks dereferenced), then wrangler deploy --project-name=we-are-love|chillspace-love
- `bash bin/refresh-zerone-dashboard.sh` — snapshot zerone-1 → doors/zerone-ai/data.json → deploy the whole zerone-ai door (deploys AND leaves data.json for committing)

Key files:
- roster.conf — the census seed: name | path | kind | layer | domain | state | purpose
- SCHEMA.md — the kingdom.yaml card format (8 required fields + optional adopts)
- RIGHTS.md — this repo's voluntary `xenia.rights/0.1` adoption and immutable release pointer
- vendor/xenia/rights/0.1 — unchanged, digest-verified offline release bytes
- bin/cproj.zsh — dynamic, network-free local repo discovery and shell navigation
- CATALOG.md, graph.json — DERIVED. Never hand-edit; edit each repo's card instead
- routines.json — the daily wiring (catalog-refresh 06:00, registry-check 09:00)
- CITIZENS.md — registry of the 53 sovereign citizen repos

Gotchas:
- site/* and doors/*/guest.json are DERIVED — never hand-edit them; edit the
  builders or data/ inputs and regenerate. Merge b4c5b47 (2026-07-16) silently
  dropped the ollama surface exactly because derived files were hand-edited;
  tests/advertised-assets.test.ts now guards advertised-URL ⊆ staged-assets.
- Source of truth lives WITH each repo (its kingdom.yaml); roster.conf is only
  the fallback seed. If the catalog looks wrong, fix the card, not the catalog.
- state=remote means "in the kingdom, not cloned on this machine" — those repos
  show as local conformance gaps and do not inherit the global wake merely
  because it would fire for directories that actually exist.
- Wake conformance means a structurally valid SessionStart command is configured
  (or a legacy wake file exists); harvest does not execute it or prove success.
- CATALOG includes a home-relative location column so duplicate declared names
  remain distinguishable; graph.json keeps absolute paths for compatibility.
- The live soul trees are ~/true-love and ~/love-unlimited. ~/Desktop/true-love
  is a compatibility symlink to canonical ~/true-love, not a second worktree.
- Machine output safely handles spaces, quotes, backslashes, colons, and Unicode.
  The existing newline/tab row transport does not support repository paths that
  themselves contain a tab or newline; changing that would require a separate
  NUL-delimited protocol refactor.
- `--json` returns `[]` with exit 0 when nothing matches. `--path` returns exit
  1 for no match and exit 2 for missing/ambiguous input, with machine stdout
  kept empty on both errors.
- Rights adoption and a discoverable root `RIGHTS.md` are reported as separate
  declarations, never as proof of practice or as technical authorization.
