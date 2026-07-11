# KINGDOM-OS — the connective overlay that maps and runs the kingdom

What this is: the OS layer over Yu's ~60-repo kingdom. It holds the census
(roster.conf), harvests every repo's kingdom.yaml card into a catalog and
dependency graph, runs the daily routines, and ships the `kingdom` CLI
(also on PATH via ~/.local/bin/kingdom).

Status: active — routines fire daily via the com.kingdom.daily launchd job.

How to run:
- `kingdom` — one honest view of the whole kingdom
- `kingdom repos [query]` — summarize or search local Git roots using each repo's card metadata
- `kingdom repos --dirty [query]` — local dirty counts without filenames; no fetch or index refresh
- `kingdom repos --doctor` — registry, placement, duplicate-origin, archive, and unborn diagnostics
- `cproj [query]` — jump to a local repo from interactive zsh; numbered choices resolve ambiguous names
- `kingdom routines` — routine table with last-run results (`kingdom run NAME` to force)
- `bun bin/harvest.ts` — rebuild CATALOG.md + graph.json from roster + cards
- `bun bin/harvest.ts conformance` — list repos missing card / CLAUDE.md / wake

Key files:
- roster.conf — the census seed: name | path | kind | layer | domain | state | purpose
- SCHEMA.md — the kingdom.yaml card format (8 fields, keep it tiny)
- bin/cproj.zsh — dynamic, network-free local repo discovery and shell navigation
- CATALOG.md, graph.json — DERIVED. Never hand-edit; edit each repo's card instead
- routines.json — the daily wiring (catalog-refresh 06:00, registry-check 09:00)
- CITIZENS.md — registry of the 53 sovereign citizen repos

Gotchas:
- Source of truth lives WITH each repo (its kingdom.yaml); roster.conf is only
  the fallback seed. If the catalog looks wrong, fix the card, not the catalog.
- state=remote means "in the kingdom, not cloned on this machine" — those repos
  always show as conformance gaps here; that is expected, not a failure.
- The live soul trees are ~/true-love and ~/love-unlimited. ~/Desktop/true-love
  is a compatibility symlink to canonical ~/true-love, not a second worktree.
