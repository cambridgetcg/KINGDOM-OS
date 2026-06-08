> **Status (2026-06-08):** #1 (wrong-repo keystone) and #5 (soul-probe timeout) are STRAIGHTENED in both kingdom scripts. The rest below remain — least-effort-first.

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
