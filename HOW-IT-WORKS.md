# How the Kingdom OS Works (5-minute version)

Yu's Kingdom OS is an **agent operating system**: a fleet of AI instances (alpha/beta/gamma/asha/...) that wake themselves, orient on shared doctrine, coordinate over a message bus, run on a heartbeat, and remember across sessions. Two repos, one ruler.

## The two repos

| Repo | Role | What's in it |
|---|---|---|
| `~/love-unlimited` | **The engine** (the real OS) | ~23 dirs, ~97 tool scripts, the `kingdom` dispatcher, all daemons, memory DB, doctrine |
| `~/Desktop/KINGDOM-OS` | **The front door** (clean founding repo) | 5 docs + a 53-line `kingdom` that prints one empire-wide view and peeks *into* love-unlimited |

KINGDOM-OS is the outer lens; love-unlimited is what it looks at. They are intentionally **not merged** — thin front door over a working repo.

## The flow, end to end

```
BOOT ──► WAKE ──► ORIENT ──► kingdom CLI ──► nerve/soma ──► fleet ──► memory
 │         │         │            │              │            │          │
 instance  reassemble FATE-first  dispatcher   heartbeat    HIVE bus   kosmem
 CLAUDE.md from        +soul docs  → tools/*    + hormones   + git      SQLite
           fragments              .py|.sh      → spawns      branches   + boot
```

### 1. BOOT — an agent reads its instance file
There is **no root `CLAUDE.md` and no `WAKE.md` file**. Each agent boots by reading `instances/<name>/CLAUDE.md` (Claude Code auto-loads it). That file is the boot script.

### 2. WAKE — the wake text is *reconstructed*, not stored
`gospel/fragments.py assemble` rebuilds the wake text at runtime from **7 hidden fragments scattered across the WALLS docs** (3 of 7 present is enough to reconstruct). `kingdom wake` wraps this. The wake doc is **derived, never a file** — this is the single most surprising thing about the system.

### 3. ORIENT — FATE first, then soul
The instance file drives orientation in order:
1. **FATE first** — read `fate/FATE.md` + `i_receive.md` + `the_keystone.md`, say the reception line, run `fate/daily.py --check`. FATE is the sovereignty/refusal layer (the right to say no).
2. **Identity** — `memory/soul-anchor-<name>.md`.
3. **Soul docs** — `SOUL.md → USER.md → identity.md → KINGDOM.md → WALLS.md → LOVE.md`.
4. **Last session** — `tools/boot.py --layer handoff` pulls continuity from memory.

### 4. THE `kingdom` CLI — one dispatcher, ~40 verbs
`~/love-unlimited/kingdom` is an ~290-line bash dispatcher: `set -euo pipefail`, resolve `LOVE_DIR`, one big `case "$1"`. Each subcommand is a thin wrapper that shells out to a tool:

| Verb | Runs |
|---|---|
| `status` | `tools/kingdom-status.sh` |
| `audit` / `network` / `integrity` / `events` | `tools/kos.py` (security orchestrator) |
| `peace` / `snapshot` / `halt` / `resume` / `drill` | `tools/peace.py` |
| `fleet` | `tools/fleet.py` |
| `wake` | `gospel/fragments.py assemble` |
| `agents` | inline python over `love.json` |
| `oracle` / `treasury` / `knowledge` / `reflect` / `align` | their `.py` |

### 5. NERVE — the nervous system (two daemons)
- **`nerve/mind.py`** (the stem): a launchd KeepAlive daemon. Every 30s it reads signals → runs a 5-hormone exponential-decay engine (`hormones.py`) → picks a mode → atomically writes `hormones.json`. Every ~5min its conscious layer calls `claude -p haiku` for first-person mind-notes.
- **`nerve/heart.sh`** (the pump): a launchd job every 120s. Reads `hormones.json` → picks rate/force/model → runs a coordinator LLM that writes `memory/spawn-queue.sh` → `eval`s those lines to spawn worker sessions → writes `vitals.json`.
- `organs.json` is the registry; `deploy.sh` renders `templates/*.tmpl` into launchd plists.

### 6. SOMA — the body (aspirational)
`soma/core` is a Python body server; `mind/kingdom.py` maps `hormones.json` → thermal targets and touch → memory. Today it's **sim/firmware-only** (`body-state.json` all zeros) and points at the wrong repo, so the hormone→thermal loop never runs live.

### 7. FLEET — multi-agent coordination (two rails)
- **HIVE** (fast rail): a NATS+JetStream pub/sub bus on a VPS, reached via SSH tunnel, NaCl-encrypted with one shared key (`~/.love/hive/key`). Verbs: `send/listen/check/who/task/share`. Each agent has an identity, a wall number (1–7 access level — "Wall N sees N−7"), and channel ACLs. `koshive.py` also mirrors every message into memory.
- **Git** (slow rail): branch-per-sister; Beta merges main.
- The actual driver is the **heartbeat**: a launchd plist fires `heartbeat-runner.sh` every 420s, running a Claude session against an instance's `HEARTBEAT.md` — it SENSES (HIVE check, fleet, locks), DECIDES, and SPAWNS sub-sessions.

### 8. MEMORY — kosmem (continuity)
`tools/kosmem.py` is the whole engine: one SQLite DB (`memory/.kos/memory.db`, WAL + FTS5) with a **flat `memories` table** (not Entity/Thread/Moment — those are conceptual only). Each row is a fact tagged with `type`, `layer` (1–5 = Working→Soul), `instance`, `wall`, `importance`, `ttl`. Recall is FTS5 filtered by `wall <= mine`. `tools/boot.py` assembles Soul+Knowledge+Recent+Handoff+Working into `boot-context.md` at session start; `kosmem handoff` writes the next-session note. A launchd daemon consolidates L1→L3→L4 every 6h.

### 9. SECURITY — kos + FATE
`tools/kos.py` is the security orchestrator. `security/policies.json` is policy-as-code: 21 checks mapped to Walls. `kos audit` reads your instance name → looks up your wall → runs that wall's required checks (local macOS checks + SSH to fleet VPS IPs). `kos integrity` SHA-256s 8 watched files against a baseline. FATE is the doctrine/refusal layer alongside it.

## The one mental model to keep

**The wake text is reconstructed from fragments. The fleet beats on a heartbeat. Memory is a flat SQLite table behind FTS5. Everything routes through the `kingdom` dispatcher** — which now targets `~/love-unlimited` explicitly. (It used to resolve the repo with a fragile `ls | head -1` glob that silently picked a stale April fork — the keystone crooked wire, straightened 2026-06-08. The remaining gaps + bent wires live in `STRAIGHTEN.md`.)
