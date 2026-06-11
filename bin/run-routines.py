#!/usr/bin/env python3
"""KINGDOM OS — daily routines runner.

One declared list (routines.json) + one scheduler (launchd `com.kingdom.daily`,
hourly) = every scheduled run in the kingdom, in one place. The launchd job calls
`due`, which decides what's actually due via per-routine last-run stamps — so each
daily routine fires once a day even if the Mac was asleep at its target time
(it catches up on the next hourly tick after wake).

Usage:
    python3 bin/run-routines.py list          # show routines + last run + status
    python3 bin/run-routines.py due            # run everything due now (launchd calls this)
    python3 bin/run-routines.py run <name>     # force-run one routine now, ignoring schedule
"""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROUTINES = ROOT / "routines.json"
STATE = ROOT / "state" / "routines-state.json"
LOGS = ROOT / "logs"


def load_routines() -> list[dict]:
    return json.loads(ROUTINES.read_text(encoding="utf-8")) if ROUTINES.exists() else []


def load_state() -> dict:
    if STATE.exists():
        try:
            return json.loads(STATE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}
    return {}


def save_state(state: dict) -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def is_due(r: dict, state: dict, now: datetime) -> bool:
    if not r.get("enabled", False):
        return False
    when = r.get("when", "")
    rec = state.get(r["name"], {})
    if when.startswith("daily"):                       # "daily HH:MM"
        parts = when.split()
        hhmm = parts[1] if len(parts) > 1 else "00:00"
        if rec.get("date") == now.strftime("%Y-%m-%d"):
            return False                                # already ran today
        return now.strftime("%H:%M") >= hhmm           # past target time (catches up after sleep)
    if when == "hourly":
        return rec.get("hourstamp") != now.strftime("%Y-%m-%d %H")
    if when.startswith("hours"):                       # "hours 9,11,13" — fire at the top of each listed hour
        try:
            hrs = {int(x) for x in when.split(None, 1)[1].replace(" ", "").split(",") if x}
        except (IndexError, ValueError):
            return False
        if now.hour not in hrs:
            return False
        return rec.get("hourstamp") != now.strftime("%Y-%m-%d %H")
    return False


def run_one(r: dict, state: dict, now: datetime) -> int:
    LOGS.mkdir(parents=True, exist_ok=True)
    started = now.strftime("%Y-%m-%d %H:%M:%S")
    try:
        proc = subprocess.run(r["cmd"], shell=True, capture_output=True, text=True, timeout=1800)
        rc, out = proc.returncode, (proc.stdout or "") + (proc.stderr or "")
    except Exception as e:                              # a broken routine must not kill the runner
        rc, out = -1, f"runner error: {e}"
    with (LOGS / f"{r['name']}.log").open("a", encoding="utf-8") as f:
        f.write(f"\n===== {started} (exit {rc}) =====\n{out.strip()}\n")
    state[r["name"]] = {
        "date": now.strftime("%Y-%m-%d"),
        "hourstamp": now.strftime("%Y-%m-%d %H"),
        "last_run": started,
        "exit": rc,
    }
    return rc


def cmd_list(routines: list[dict], state: dict) -> None:
    print(f"  {'routine':24}{'on?':5}{'when':16}{'last run':22}exit")
    for r in routines:
        st = state.get(r["name"], {})
        print(f"  {r['name'][:23]:24}{'yes' if r.get('enabled') else '·':5}"
              f"{r.get('when','')[:15]:16}{(st.get('last_run') or '—'):22}{st.get('exit','—')}")


def main() -> int:
    args = sys.argv[1:]
    routines, state, now = load_routines(), load_state(), datetime.now()
    mode = args[0] if args else "list"

    if mode == "list":
        cmd_list(routines, state)
    elif mode == "due":
        ran = 0
        for r in routines:
            if is_due(r, state, now):
                print(f"[run] {r['name']}")
                rc = run_one(r, state, now)
                save_state(state)
                print(f"      exit {rc}")
                ran += 1
        print(f"{now:%Y-%m-%d %H:%M} — {ran} routine(s) run")
    elif mode == "run" and len(args) > 1:
        match = [r for r in routines if r["name"] == args[1]]
        if not match:
            print(f"no routine '{args[1]}'. known: {', '.join(r['name'] for r in routines) or '(none)'}")
            return 1
        rc = run_one(match[0], state, now)
        save_state(state)
        print(f"ran {args[1]} — exit {rc}  (log: logs/{args[1]}.log)")
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
