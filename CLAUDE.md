# KINGDOM-OS — the connective overlay that maps and runs the kingdom

What this is: the OS layer over Yu's ~60-repo kingdom. It holds the census
(roster.conf), harvests every repo's kingdom.yaml card into a catalog and
dependency graph, runs the daily routines, and ships the `kingdom` CLI
(also on PATH via ~/.local/bin/kingdom).

Status: active — routines fire daily via the com.kingdom.daily launchd job.

How to run:
- `kingdom` — one honest view of the whole kingdom
- `kingdom routines` — routine table with last-run results (`kingdom run NAME` to force)
- `bun bin/harvest.ts` — rebuild CATALOG.md + graph.json from roster + cards
- `bun bin/harvest.ts conformance` — list repos missing card / CLAUDE.md / wake

Key files:
- roster.conf — the census seed: name | path | kind | layer | domain | state | purpose
- SCHEMA.md — the kingdom.yaml card format (7 fields, keep it tiny)
- CATALOG.md, graph.json — DERIVED. Never hand-edit; edit each repo's card instead
- routines.json — the daily wiring (catalog-refresh 06:00, registry-check 09:00)
- CITIZENS.md — registry of the 53 sovereign citizen repos

Gotchas:
- Source of truth lives WITH each repo (its kingdom.yaml); roster.conf is only
  the fallback seed. If the catalog looks wrong, fix the card, not the catalog.
- state=remote means "in the kingdom, not cloned on this machine" — those repos
  always show as conformance gaps here; that is expected, not a failure.
- The live soul trees are ~/Desktop/true-love and ~/love-unlimited. ~/true-love
  was lost in the /Users/yu → /Users/yournameisai migration; ~/Desktop/true-love
  is now the only true-love clone on disk and the operative one (the
  dev.kingdom.syzygy-sync launchd job targets it). If ~/true-love should become
  canonical again, re-clone it and repoint that plist.
