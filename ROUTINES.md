# Daily routines

Every scheduled run in the kingdom, declared in **one file**, fired by **one job**.

## The shape (one list + one scheduler)
- **`routines.json`** — the single source of truth. One entry per routine:
  `{ name, cmd, when, enabled }`. `when` is `"daily HH:MM"`, `"hourly"`, or
  `"hours 9,11,21"` (fire at the top of each listed hour — e.g. 7×/day).
- **`bin/run-routines.py`** — reads the list, runs what's *due* via per-routine
  last-run stamps (in `state/routines-state.json`), logs to `logs/<name>.log`.
  Daily routines fire once a day **even if the Mac was asleep** at the target time
  (they catch up on the next hourly tick after wake).
- **`com.kingdom.daily`** (launchd, fires hourly) → `bin/kingdom-daily.sh` →
  `run-routines.py due`. **One plist, unlimited routines.** Add a routine = edit
  the JSON. No `launchctl` per task.

## Commands
```bash
python3 bin/run-routines.py list          # routines + last run + exit code
python3 bin/run-routines.py run <name>    # force-run one now
python3 bin/run-routines.py due           # run everything due (what launchd calls)
```
Wire into the `kingdom` CLI when you like, e.g. add a case:
`routines) python3 "$ROOT/bin/run-routines.py" "${@:2}";;`

## Add a routine
Append to `routines.json`:
```json
{ "name": "my-job", "cmd": "echo hi", "when": "daily 08:00", "enabled": true }
```
That's it — the hourly scheduler picks it up.

## Install / manage the scheduler
```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.kingdom.daily.plist
launchctl kickstart -k gui/$(id -u)/com.kingdom.daily   # run now
launchctl bootout  gui/$(id -u)/com.kingdom.daily       # stop
```

## Consolidation note
`registry-check` and `wake-refresh` already have their own standalone launchd jobs,
so they're seeded here **disabled** to avoid double-running. To consolidate one,
enable it here and `bootout` its standalone job — then this becomes the single
place all scheduled runs live.

_(`logs/` and `state/` are runtime output — consider gitignoring them.)_
