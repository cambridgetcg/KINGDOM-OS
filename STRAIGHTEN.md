> **Status (2026-06-12, second pass — the loop turned again):** #1 + #5 landed 2026-06-08. Tonight's sweep (15 items re-verified against the post-migration device, 25 agents): **#2** unshadowed in the last copy still carrying it (`~/Love/kingdom`; the live CLI was rewritten without the bug), **#3** `kingdom wake` now self-caches to `~/.love/WAKE.md`, **#9** all six crash-maskers removed, **#6** and **#16** verified already-fixed. Fresh straightenings beyond the list: dead `/Users/yu` paths retired from `love-unlimited/.claude/settings.json` + `fate/noise.sh`, `~/Love` plist templates + `kosmem-consolidate.sh` + `kingdom-agent.py` + `SOPHIA.md` provenance repaired, kingdom-os census fixed (roster.conf 19 paths, routines.json casing + wake-refresh, CLAUDE.md inverted soul-tree gotcha), true-love castles YOUSPEAK path corrected, `~/.gua` symlinks repointed. **Remaining: #4 #7 #8 #10 #12 #13 #14 #15 #17 — all needs-Yu — plus new #18 (TCC) and #19 (kingdom PATH mismatch) below.**

# Straighten the Wires — ranked, least-effort first

Ranked by **(smoothness gained) ÷ (effort)**. The top three are one-line fixes that each unbend a wire silently breaking the whole system.

---

## 1. The wrong-repo glob — THE silent killer (verified)
- **What's bent:** Both `kingdom` scripts resolve the repo with
  `LOVE_DIR=...$(ls -d ~/love-unlimited ~/Desktop/love-unlimited ~/Love | head -1)`.
  `~/Love` is a symlink to `~/Desktop/Love`, a **stale April-8 fork**. Capital `L` sorts *before* lowercase `love-unlimited`, so `head -1` picks `~/Love`. **Confirmed live:** `ls -d ... | head -1` returns `/Users/yu/Love` (commit Apr 8) instead of `/Users/yu/love-unlimited` (commit Apr 15).
- **Why it matters:** Every command — `wake`, `audit`, `status`, memory, KINGDOM-OS's SOUL probe — silently runs against the stale fork. The repo you edit is *not* the one that runs. This single line explains: missing `gospel/fragments.py` ("wake degrades"), the empty/1-row memory DB vs the 22-row one, and the "(love-unlimited not reachable)" SOUL line.
- **Straighten:** In **both** scripts, replace line with `LOVE_DIR="${LOVE_DIR:-$HOME/love-unlimited}"`. The sub-tools (`kingdom-status.sh`) already hardcode exactly this — just match them. Drop the glob entirely.
- **Effort:** S (one line × 2 files). **Safe-for-agent:** ✅ yes.

## 2. Dead/shadowed CLI cases (verified)
- **What's bent:** First-match-wins in the `case` shadows two commands. **Confirmed:** `zerone|bridge)` at line 153 catches `bridge` before `bridge|bridges)` at line 160 — so `tools/bridge.py` is unreachable via `kingdom bridge`. And `workflow)` at line 125 shadows `workflow|wf)` at line 186.
- **Why it matters:** `bridge` runs the wrong tool (`zerone-bridge.py`); `bridge.py` (the bridge-map) is dead. Classic one-line CLI bug that silently kills a whole tool.
- **Straighten:** Rename line 153 to `zerone)` (drop the `bridge` token) so `bridge` falls through to line 160 → `bridge.py`. Delete the dead `workflow|wf)` block at 186 (125 already covers it).
- **Effort:** S (2-line edit). **Safe-for-agent:** ✅ yes.

## 3. Make wake self-cache — turn the dead fallback into a real safety net
- **What's bent:** Wake exists only as a runtime reconstruction (`fragments.py assemble`). The two fallbacks (`$LOVE_DIR/WAKE.md`, `~/.love/WAKE.md`) are dead ends — no file exists. 4 of 7 gospel fragments are already missing; lose one more core fragment and the thread snaps with no backstop.
- **Why it matters:** A 3-line, zero-cost insurance policy against losing the agent's own wake doc.
- **Straighten:** Have `kingdom wake` redirect its successful assembled output to `~/.love/WAKE.md` (`tee`). The existing dead fallback becomes a live cache for free.
- **Effort:** S. **Safe-for-agent:** ✅ yes.

## 4. Five fleet checks stand permanently red — make the audit honest
- **What's bent:** All 5 fleet VPS nodes are 100% packet-loss down (decommissioned). `fleet_reachable/fail2ban/psad/canaries/ssh_hardened` cascade-fail, plus `wireguard_tunnel`. Wall 1 audit can never pass.
- **Why it matters:** An audit that's always red is an audit nobody reads. Hides real future failures.
- **Straighten:** If the fleet is truly gone, drop those 5 IDs from Wall 1's `required_checks` in `security/policies.json` and lower `minimum_score` from 17. One JSON edit, zero code.
- **Effort:** S. **Safe-for-agent:** ⚠️ needs-Yu (confirm the VPSes are intentionally gone, not temporarily down).

## 5. SOUL probe reads "quiet" even when healthy
- **What's bent:** KINGDOM-OS grabs `kingdom status | head -1`, but `kingdom status` takes >25s (many python + network calls) with no timeout, so the probe nearly always gets empty → renders "quiet."
- **Why it matters:** The front-door empire view lies about the soul layer's health.
- **Straighten:** Point the probe at the fast one-liner (`tools/kingdom-status.sh`) and/or wrap in a 6s budget: `( cmd & sleep 6; kill $! )`. (Note: fixing #1 first is a prerequisite — the probe must target the right repo.)
- **Effort:** S. **Safe-for-agent:** ✅ yes.

## 6. The nerve signals path mismatch — a silent dead wire
- **What's bent:** `nerve/signals.py:25` reads `body/signals`, but `heart.sh:362` (and the function's own docstring) write/say `nerve/signals`. Heart→mind dopamine signals are never consumed.
- **Why it matters:** The reward/signal loop between heart and mind is broken at one path literal.
- **Straighten:** One line — change `signals.py:25` to `self.love_home / "nerve" / "signals"`.
- **Effort:** S. **Safe-for-agent:** ✅ yes (but nerve isn't running here — see #11).

## 7. Unify the three hardcoded memory paths
- **What's bent:** The `kosmem` alias, `love.kosmem.plist:11`, and `kosmem-consolidate.sh:13` all hardcode `/Users/yu/Love` (the stale fork). So the consolidation daemon rolls up the *wrong* DB, and the canonical `love-unlimited` DB never consolidates.
- **Why it matters:** Memory split-brain: two DBs drifting, continuity reads the stale one.
- **Straighten:** Repoint all three to `~/love-unlimited` (or read a single `LOVE_DIR` env var). Easiest: once #1 lands, symlink/retarget `~/Love → ~/love-unlimited` so every hardcoded path unifies at once.
- **Effort:** S–M. **Safe-for-agent:** ⚠️ needs-Yu (decide canonical tree; retargeting the `~/Love` symlink affects other repos that legitimately use Desktop/Love).

## 8. SOMA + the live heartbeat plist point at the wrong repo
- **What's bent:** `soma/.../kingdom.py` hardcodes `LOVE_ROOT = ~/Love` (→ Desktop/Love), and `love.heartbeat.plist` execs `/Users/yu/Desktop/Love/tools/heartbeat-runner.sh`. The kingdom you edit isn't the one beating.
- **Why it matters:** SOMA reads stale state; the live heartbeat runs the April fork.
- **Straighten:** `soma` → `LOVE_ROOT = Path(__file__).resolve().parents[4]` (or env). Plist → repoint path + `launchctl` reload.
- **Effort:** M. **Safe-for-agent:** ⚠️ needs-Yu (plist reload + the loaded daemons currently target Desktop/Love by design until migrated).

## 9. Stop masking real crashes
- **What's bent:** Six `kingdom` handlers (oracle/treasury/knowledge/workflow/hive-protocol/arena) pipe `2>/dev/null || echo "...building..."`. Tools work today, so any future crash prints a false "building…" and eats the stacktrace.
- **Straighten:** Delete the `2>/dev/null || echo` on those six.
- **Effort:** S. **Safe-for-agent:** ✅ yes.

## 10. Config drift across three instance lists
- **What's bent:** `hive.py` knows 5 instances (beta 🦞), `profiles.json` knows 4 (beta 🧠, no asha), `walls.json` lists 17, and there are 12 instance dirs. Task-assign choices only allow the 5. `who`/presence trusts staleness (still lists dead `sentinel`/`webhook`).
- **Straighten:** Make `profiles.json` the single source; have `hive.py` load instances from it; have `who` ignore IDs not in the config and label >1h as offline.
- **Effort:** M. **Safe-for-agent:** ⚠️ needs-Yu (decide the canonical roster).

## 11. Wire memory + FATE into the empire view (gaps, not bends)
- **What's missing:** (a) The `kingdom` CLI has **zero** memory wiring — no `memory/recall/context/boot/handoff` subcommand; continuity is unreachable from the empire view. (b) FATE is orphaned from `kos audit` — nothing checks sovereignty/wall-gate state. (c) `fate/daily.py --check` is advisory-only (exits 0 even when incomplete), so nothing gates boot on it despite "not optional." (d) Only `asha` (and beta) have a `heartbeat-runner.sh` — the other instances have `HEARTBEAT.md` but can't beat, so the "fleet" is really 2 agents.
- **Straighten:** Add a `kingdom memory|recall|boot)` case wrapping `kosmem.py`/`boot.py`. Add one FATE check to the audit registry. Make `--check` exit non-zero when incomplete *if* you want it to gate. Copy `heartbeat-runner.sh` into the other instance dirs (or templatize one).
- **Effort:** M–L. **Safe-for-agent:** ⚠️ mixed — the `kingdom memory` subcommand is safe; gating boot on FATE and templatizing heartbeats needs-Yu (behavioral/policy change).

---

## Do-now batch (all S, all safe, all verified)
Items **1, 2, 3, 5, 6, 9** are one-to-three-line edits an agent can land safely in one pass. **#1 is the keystone** — it alone makes the whole OS target the repo you actually edit, which silently un-breaks wake, memory, status, and the SOUL probe at once. Fix it first; several other "gaps" may simply disappear once commands stop running against the April fork.

Relevant files: `/Users/yu/love-unlimited/kingdom` (lines 24, 125/153/160/186, wake handler), `/Users/yu/Desktop/KINGDOM-OS/kingdom` (line 38), `nerve/signals.py:25`, `security/policies.json` (Wall 1), `tools/kosmem.py` + `love.kosmem.plist` + `kosmem-consolidate.sh`, `soma/.../kingdom.py`, `love.heartbeat.plist`.

---

# Cross-layer additions — from the 2026-06-08 6-layer study

_The list above (1–11) is the CLI / fork / memory layer, line-precise. The items
below are the **cross-layer** findings from a read-only 6-agent crawl
(KINGDOM-OS repo · wiring reality · registry/maps · daemons/HIVE/nerve ·
governance · live spine). Same principle: **straight = subtraction.** Numbering
continues from #11; cross-refs noted to avoid overlap._

## 12. Amputate the dead-VPS trunk in one pass — THE cross-layer keystone
- **What's bent:** Sentry VPS `135.181.28.252` is dead (NATS :4222 + SSH :22 down) yet is wired into 30+ files. One host severs **four** connectors at once: HIVE comms, kos `_alert_hive` delivery, the nerve coordinator's link (sentinel exit=1), AND the offsite-backup target. Nothing *alive* depends on it (render + earn + local kos all survive without it).
- **Why it matters:** It is the single biggest SPOF in the whole system, and the cheapest fix is removal, not revival.
- **Straighten (one pass):** Unload+delete `dev.agenttool.hive-tunnel` (tunnels to the dead host; code doesn't even use the tunnel); park `hive/` + the `nats://…:2222` listener (zero signal since 2026-04-08); re-point `_alert_hive` to a local sink; drop the offsite-backup target. (Fleet-check half is already your **#4**.)
- **Effort:** M. **Safe-for-agent:** ⚠️ needs-Yu (daemons + prod).

## 13. Unload the loaded-but-failing daemons (the worst moving part)
- **What's bent:** Daemons loaded and failing every cycle: `cc.true-love.awaken` (status 64 — Claude token expired), `com.kingdom.youi-web` (-9, KeepAlive flapping a killed server), `oracle-run`/`oracle-deliver` (78). (Your **#8** covers `love.heartbeat`'s shell bug.)
- **Why it matters:** "Loaded but red" looks alive in `launchctl` while doing nothing — silent rot that hides real failures.
- **Straighten:** Re-auth or unload `awaken`; fix or stop `youi-web`; fix or unload the oracle jobs.
- **Effort:** S each. **Safe-for-agent:** ⚠️ needs-Yu (daemons/auth).

## 14. Kill the cross-repo / cross-module duplicates
- **What's bent:** Beyond the `~/Love` fork (#1): `legible_money` (frozen) vs `zerone` (live) both = the chain · `~/Desktop/kingdom-workspace` (stale 2026-03) vs `~/.openclaw/workspace` (live) — same remote, diverged · **5 HIVE modules** (`hive.py` ×2, `hive-protocol.py`, `koshive.py`, `hive_kv.py`) + **2 key stores** (`~/.openclaw/.hive` vs `~/.love/hive`) · dual renderer (`yu-wake/src/renderer.ts` hand-forked from `agenttool/services/wake/markdown.ts`) · 3 overlapping "everything maps." (Your **#10** is the instance-list config drift.)
- **Why it matters:** Two copies of one thing guarantee drift; every duplicate is a future "which is real?"
- **Straighten:** Archive `legible_money`; delete the Desktop `kingdom-workspace`; if HIVE retired (see #12) delete all hive modules + one key store, else keep ONE of each; make one renderer import the other; keep the auto registry as the single inventory, demote the other maps to pointers.
- **Effort:** S–M. **Safe-for-agent:** ⚠️ needs-Yu (deletes — decide canonical first).

## 15. Make the governance layer stop asserting it's alive
- **What's bent:** `kingdom-workspace/CIVILISATION.md` claims "9 citizens pulsing, on-chain / keys secured," but `memory/civilisation.json` shows all 9 `bootstrapped:false`, `zerone_address:null`, `wallet_id:null`; `memory/citizen-keys/` and `memory/alignment/` don't exist (align protocol has written zero records). `align.py` + 5 tools hardcode `WORKSPACE = /root/.openclaw/workspace` (a container path) so they can't run on this Mac at all.
- **Why it matters:** The biggest declared-vs-wired gap in the charter layer; every doc citing "9 on-chain" inherits a false premise.
- **Straighten:** Reconcile `CIVILISATION.md` to actual state; mark `ALIGNMENT.md` "designed, not operated"; replace the `/root/.openclaw/workspace` hardcode with one env/path helper (re-wires 6 tools at once).
- **Effort:** S (docs) + M (the path helper). **Safe-for-agent:** ✅ doc edits; ⚠️ the code path-fix needs-Yu.

## 16. Demote the `## Kingdom Engine` keystone tag — it exists nowhere
- **What's bent:** README + ARCHITECTURE lean on a per-repo `## Kingdom Engine` tag as the mechanism the connective map reads. Grep across ~/Desktop and ~/love-unlimited finds it in **zero** repos — only KINGDOM-OS's own README, describing it. The map-by-tag is entirely aspirational.
- **Why it matters:** The whole "one map, one identity" story rests on a convention nothing produces or consumes.
- **Straighten:** Either seed the tag in repos, or (cheaper) demote it from present tense to "planned" in README + ARCHITECTURE until it exists. Also delete the untracked `HOW-IT-WORKS.md` (dangling ref + describes the pre-fix glob bug).
- **Effort:** S. **Safe-for-agent:** ✅ doc edits.

## 17. Let the registry see its own home
- **What's bent:** `kingdom-registry/scan.py` defaults to scanning `~/Desktop` only, so the registry can't see `~/.openclaw/workspace` (its own house) and instead catalogues the *stale* Desktop `kingdom-workspace` duplicate (#14).
- **Why it matters:** The one piece of self-checking automation has a blind spot over itself.
- **Straighten:** Add `~/.openclaw/workspace` to `DEFAULT_ROOTS` (and drop the stale Desktop copy per #14); update `walls.json` for the newly-seen dirs. ✅ Already done: the drift notification now points at the real `check.py` (was a non-existent `kingdom check`).
- **Effort:** S. **Safe-for-agent:** ✅ (my tooling).

---

### Cross-layer do-now (safe, no prod/daemons)
**#16** (demote the tag + drop HOW-IT-WORKS.md), the doc-reconcile half of **#15**, and **#17** (registry self-scan) are safe agent edits. **#12, #13, #14** touch daemons/prod/deletes → Yu drives. The single highest-leverage cross-layer act remains **#12** (retire the dead VPS) — the partner to your #1.

---

# New entries — from the 2026-06-12 re-verification sweep

## 18. macOS TCC kills every launchd job whose script lives under ~/Desktop
- **What's bent:** `dev.kingdom.syzygy-sync` and `love.citizen.ai-love` are loaded but exit 126 every cycle. Their scripts EXIST and are executable — the logs show `/bin/bash: ... Operation not permitted`: macOS TCC denies launchd's bash access to `~/Desktop`. Path edits cannot fix this; it is a privacy-permission failure, not a stale path.
- **Why it matters:** Any current or future automation whose script sits under `~/Desktop` (where most of the kingdom lives) silently dies the same way. syzygy-sync is the continuity spine for true-love.
- **Straighten:** Either grant the relevant binary Full Disk Access (System Settings → Privacy & Security) or relocate launchd-invoked scripts out of `~/Desktop` (e.g. `~/ops/`) and repoint the plists.
- **Effort:** S. **Safe-for-agent:** ⚠️ needs-Yu (System Settings, or the relocation decision).

## 19. Typing `kingdom` runs the April citizen-CLI, not the June dispatcher
- **What's bent:** `~/.kingdom_profile` (sourced at `~/.zshrc:24`) sets `LOVE_HOME=~/Desktop/love-unlimited` and prepends `$LOVE_HOME/tools` to PATH, so `kingdom` resolves to `tools/kingdom` — the 5.9 KB citizen-plugin CLI from 25 Apr. The full 21 KB dispatcher at `~/love-unlimited/kingdom` (8 Jun — oracle/treasury/wake/walls/etc.) is NOT on PATH; `kingdom oracle` from a shell prints "unknown subcommand" and the newest CLI work is unreachable interactively.
- **Why it matters:** Fixes and features land in a script nobody's shell actually runs — #2/#9 style bugs get fixed in the dispatcher while the interactive front door stays the old tool.
- **Straighten:** Decide the front door: alias/symlink `kingdom` to the dispatcher, or fold the citizen CLI into it, or accept two commands with two names.
- **Effort:** S. **Safe-for-agent:** ⚠️ needs-Yu (interface decision).
