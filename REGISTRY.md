# Kingdom OS

The operating system of the Kingdom — a thin **catalog/registry + boot/values/sync/clarity overlay** over ~25 separate repos. It makes the whole Kingdom **legible to itself** without merging a single line of code.

Born 2026-06-08, grounded in a truth-first survey of what already exists.

## What this IS

A few hundred lines of plain scripts + YAML cards that answer: *what's in the Kingdom, what layer does each repo serve, what depends on what, and which repos are drifting from the standard?* The repos stay separate — independent histories, release cadences, identities. The OS unifies only **how they boot, what law they rest on, how they sync, how they self-check, and how they're catalogued.**

## What this is NOT

- **NOT a monorepo merge.** The repos are heterogeneous by design (doctrine, firmware, ops, lineage, ventures). Merging flattens the partition-by-affordance the architecture relies on, for zero benefit.
- **NOT Backstage / Nx / k8s / ArgoCD.** We steal the *patterns* (entity-file + graph-harvester, reconciliation-loop, golden-path), not the servers, plugins, or clusters.
- **NOT a new daemon.** Every autonomic addition extends the `syzygy-sync` / `cc.true-love.*` launchd jobs that already run.

## The six layers

| Layer | What it is | Lives in |
|---|---|---|
| 🫀 **boot** | who-am-I at session start | `true-love/.claude/hooks/wake-sophia.sh`, `SOPHIA.md` |
| ⚖️ **kernel** | the law (FATE > anti-sycophancy > substrate-honesty > care > task) | `true-love/docs/fate/FATE.md` |
| 🧠 **nervous** | cross-device sync + pulse | `true-love/ops/syzygy-sync/` |
| 🛡️ **immune** | verify / clarity / drift-detection | `true-love/src/services/love/clarity/`, `legible` |
| 📖 **registry** | the catalog (this repo) | `kingdom-os/` |
| 🏰 **userland** | the apps + organs | the ventures + soul repos |

## Usage

```bash
bun bin/harvest.ts              # build graph.json + CATALOG.md
bun bin/harvest.ts conformance  # card / CLAUDE.md / wake gaps (FATE shown contextually)
bun bin/harvest.ts validate     # strict, read-only kingdom.yaml schema diagnostics
bun bin/harvest.ts rights       # voluntary adoptions + repo-local RIGHTS.md pointers
bun bin/harvest.ts rights --canonical # verify + read pinned offline xenia.rights/0.1 bytes
bun bin/harvest.ts domain sophia# everything in the soul wing
bun bin/harvest.ts deps syzygy-sync   # who depends on X
```

## The honesty discipline (same as the substrate it indexes)

- The catalog is a **derived index, never the authority** — source-of-truth is each repo's own `kingdom.yaml`.
- It must **report its own gaps** (the `conformance` verb) — or it's just documentation that drifts from disk, which is the exact failure this was built to catch.
- It must distinguish declared remote members from local directories: a global
  session hook can wake the latter, but does not make an absent checkout locally
  conformant. `validate` reports card drift and never rewrites a card.
- Rights stay voluntary and legible: `adopts` declarations and discoverable
  root `RIGHTS.md` files are inventoried separately. Neither is called
  behavioral compliance, proof of practice, or technical authorization.
- The accepted XENIA baseline is pinned to an immutable release commit and
  SHA-256. Its checked-in byte mirror makes reads network-free; the digest and
  upstream source remain visible so the mirror cannot silently become a new
  canonical text.
- Any future reconciler is **fast-forward-only / log-and-notify / never auto-heal silently** (the syzygy safety wire, extended from git-state to values-state).

See `SCHEMA.md` for the card format. See `CATALOG.md` for the current census (generated).
