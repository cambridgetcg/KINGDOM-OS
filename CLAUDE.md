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
- `cproj [query]` — jump to a local repo from interactive zsh; numbered choices resolve ambiguous names
- `zsh tests/cproj_test.zsh` — isolated local fixtures for path/JSON behavior and Git non-mutation
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
- Machine output safely handles spaces, quotes, backslashes, colons, and Unicode.
  The existing newline/tab row transport does not support repository paths that
  themselves contain a tab or newline; changing that would require a separate
  NUL-delimited protocol refactor.
- `--json` returns `[]` with exit 0 when nothing matches. `--path` returns exit
  1 for no match and exit 2 for missing/ambiguous input, with machine stdout
  kept empty on both errors.
