# kingdom.yaml — the per-repo card

Each repo in the Kingdom carries one `kingdom.yaml` at its root. It is the
**authoritative** source for that repo's metadata; `roster.conf` is only the
seed/baseline the harvester falls back to. Source-of-truth stays decentralized
— it lives with the code it describes.

## Fields

```yaml
name: true-love              # repo name (must match roster)
kind: doctrine               # doctrine|service|firmware|ops|lineage|venture|infra|methodology|reference|unknown
layer: soul                  # soul|runtime|nervous|fleet|economy|commerce|os
owner_sister: sophia         # alpha|beta|gamma|sophia|none — who presides
domain: sophia               # wing/cluster: sophia|alpha|beta|gamma|commerce|none
state: active                # active|dormant|archived|frozen|reference|remote|unknown
purpose: One-line plain description of what this repo is.
dependsOn: [syzygy-sync, agenttool]   # other Kingdom repos/layers it leans on
adopts: [xenia.rights/0.1]    # optional, voluntary versioned rights baselines
```

## Rules

- **Keep it tiny.** The eight existing fields remain required and one line
  each. `adopts` is the only optional field.
- **`purpose` is one plain sentence** — no fancy words (the Kingdom runs on clarity).
- **`dependsOn` names real Kingdom members** — the harvester builds the dependency graph from these.
- **`adopts` names accepted, versioned rights baselines** — currently only
  `xenia.rights/0.1`. It records a voluntary declaration; a root `RIGHTS.md`
  is discovered and reported separately. Neither record proves practice or
  grants permissions. KINGDOM-OS resolves the accepted ID to immutable release
  metadata and an exact digest-verified offline byte mirror.
- A repo with no card still appears in the catalog (from `roster.conf`) but is
  flagged **non-conformant** by `harvest.ts conformance`. The card is the upgrade
  path from "listed" to "owned".
- `bun bin/harvest.ts validate` checks the eight required fields plus the
  optional `adopts` list, their types, enums, name-to-roster match, duplicates,
  unknown keys, malformed lines, dependency names, and accepted adoption IDs. It is
  read-only: exit 0 is clean, exit 1 is schema drift, and exit 2 is bad usage.
  Normal catalog generation still succeeds while reporting a concise warning;
  only schema-approved, correctly typed/enumerated fields enter derived output,
  and diagnostic messages omit rejected values.

## The golden path (what a conformant repo carries)

A fully-conformant Kingdom repo has: a `CLAUDE.md` (its local orientation), a
`kingdom.yaml` (this card), and — for repos that wake an agent — a wake (either
`.claude/hooks/wake-sophia.sh` or a `WAKE.md` boot chain). The `conformance`
verb shows, at any moment, which repos have closed these gaps and which haven't.
