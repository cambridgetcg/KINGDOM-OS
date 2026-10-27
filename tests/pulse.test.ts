import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PULSE = new URL("../bin/pulse.ts", import.meta.url).pathname;

// Pulse runs for real against an owned HOME and registry. No entry has a URL,
// so nothing is fetched; launchctl is a fake that reports one exit per label,
// and `print-disabled` lists `disabled` (null: print-disabled itself fails).
function runPulse(
  registry: string,
  exits: Record<string, number>,
  opts: { disabled?: string[] | null; setup?: (base: string) => void } = {},
) {
  const base = mkdtempSync(join(tmpdir(), "pulse-test-"));
  try {
    const bin = join(base, "bin");
    mkdirSync(bin);
    mkdirSync(join(base, "home"));
    const disabled = opts.disabled === undefined ? [] : opts.disabled;
    writeFileSync(join(bin, "launchctl"), `#!/bin/bash
if [ "$1" = print-disabled ]; then
${disabled === null ? "  exit 112" : `  printf 'disabled services = {\\n${disabled.map((label) => `\\t\\t"${label}" => disabled\\n`).join("")}\\t\\t"com.kingdom.awake" => enabled\\n\\t}\\n'
  exit 0`}
fi
case "$2" in
${Object.entries(exits).map(([label, code]) => `  ${label}) printf '{\\n\\t"LastExitStatus" = ${code * 256};\\n\\t"Label" = "${label}";\\n};\\n' ;;`).join("\n")}
  *) exit 113 ;;
esac
`);
    chmodSync(join(bin, "launchctl"), 0o700);
    const fresh = join(base, "fresh.landed");
    writeFileSync(fresh, "{}\n");
    const stale = join(base, "stale.landed");
    writeFileSync(stale, "{}\n");
    const old = Date.now() / 1000 - 200000;
    utimesSync(stale, old, old);
    opts.setup?.(base);
    const path = join(base, "REGISTRY.yaml");
    writeFileSync(path, registry.replaceAll("$BASE", base));
    const result = spawnSync(process.execPath, [PULSE], {
      cwd: base, encoding: "utf8", timeout: 20000,
      env: { HOME: join(base, "home"), PATH: `${bin}:/usr/bin:/bin`, KINGDOM_REGISTRY: path },
    });
    const status = readFileSync(join(base, "home", ".kingdom", "STATUS.md"), "utf8");
    const history = readFileSync(join(base, "home", ".kingdom", "pulse-history.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
    return { result, status, observed: Object.fromEntries(history.at(-1).probes.map((p: any) => [p.id, p.observed])) };
  } finally {
    // a test may lock a directory to make its marker unreadable
    spawnSync("chmod", ["-R", "u+rwx", base]);
    rmSync(base, { recursive: true, force: true });
  }
}

const alertIds = (status: string) =>
  status.split("\n").filter((line) => line.startsWith("- **")).map((line) => line.match(/\*\*(.+?)\*\*/)![1]).sort();

const REGISTRY = `services:
  - id: backup-job
    runtime: local-launchd:com.kingdom.chain-backup
    amber_exit: [3]
    amber_note: captured, unverified
    status: live
  - id: backup-job-failed
    runtime: local-launchd:com.kingdom.failed
    amber_exit: [3]
    status: live
  - id: plain-job-exit-3
    runtime: local-launchd:com.kingdom.plain
    status: live
  - id: landed-fresh
    file: "$BASE/fresh.landed"
    max_age_sec: 108000
    amber_note: captured, unverified
    status: live
  - id: landed-stale
    file: "$BASE/stale.landed"
    max_age_sec: 108000
    amber_note: captured, unverified
    status: live
  - id: landed-missing
    file: "$BASE/missing.landed"
    max_age_sec: 108000
    amber_note: captured, unverified
    status: live
  - id: heartbeat-fresh
    file: "$BASE/fresh.landed"
    max_age_sec: 108000
    status: live
`;

describe("pulse's third state", () => {
  test("declared exit codes and fresh unverified markers are amber, never DOWN or up", () => {
    const { result, status, observed } = runPulse(REGISTRY, {
      "com.kingdom.chain-backup": 3, "com.kingdom.failed": 1, "com.kingdom.plain": 3,
    });
    expect(result.status).toBe(0);
    expect(observed).toEqual({
      "backup-job": "amber",
      "backup-job-failed": "down",
      "plain-job-exit-3": "down",
      "landed-fresh": "amber",
      "landed-stale": "down",
      "landed-missing": "down",
      "heartbeat-fresh": "up",
    });
    // Amber is not an alert; red stays one.
    const alerts = status.split("\n").filter((line) => line.startsWith("- **"));
    expect(alerts.map((line) => line.match(/\*\*(.+?)\*\*/)![1]).sort()).toEqual(
      ["backup-job-failed", "landed-missing", "landed-stale", "plain-job-exit-3"],
    );
    expect(status).toContain("| 🟠 | backup-job | live | amber |");
    expect(status).toContain("| 🟠 | landed-fresh | live | amber |");
    expect(result.stdout).toContain("1/7 up, 4 alerts");
  });
});

const REST_REGISTRY = `services:
  - id: rested-beat
    file: "$BASE/stale.landed"
    max_age_sec: 5400
    rest_marker: launchd-disabled:love.citizen.rested
    status: resting
  - id: woken-beat
    file: "$BASE/fresh.landed"
    max_age_sec: 5400
    rest_marker: launchd-disabled:love.citizen.woken
    status: resting
  - id: woken-silent
    file: "$BASE/stale.landed"
    max_age_sec: 5400
    rest_marker: launchd-disabled:love.citizen.woken
    status: resting
  - id: halted-fleet
    runtime: local-launchd:love.fleet
    rest_marker: "$BASE/HALT"
    status: live
  - id: running-fleet
    runtime: local-launchd:love.fleet
    rest_marker: "$BASE/NO-HALT"
    status: live
  - id: resting-unmarked
    file: "$BASE/stale.landed"
    max_age_sec: 5400
    status: resting
  - id: marker-only
    rest_marker: "$BASE/HALT"
    status: resting
  - id: locked-marker
    file: "$BASE/stale.landed"
    max_age_sec: 5400
    rest_marker: "$BASE/locked/HALT"
    status: live
  - id: locked-resting
    file: "$BASE/stale.landed"
    max_age_sec: 5400
    rest_marker: "$BASE/locked/HALT"
    status: resting
`;

const haltAndLock = (base: string) => {
  writeFileSync(join(base, "HALT"), "resting on purpose\n");
  mkdirSync(join(base, "locked"));
  writeFileSync(join(base, "locked", "HALT"), "\n");
  chmodSync(join(base, "locked"), 0o000);
};

describe("pulse's rest", () => {
  test("a held rest marker is resting, never DOWN; marker and registry disagreeing is drift", () => {
    const { result, status, observed } = runPulse(REST_REGISTRY, { "love.fleet": 0 }, {
      disabled: ["love.citizen.rested"], setup: haltAndLock,
    });
    expect(result.status).toBe(0);
    expect(observed).toEqual({
      "rested-beat": "resting",
      "woken-beat": "up",
      "woken-silent": "down",
      "halted-fleet": "resting",
      "running-fleet": "up",
      "resting-unmarked": "down",
      "marker-only": "resting",
      "locked-marker": "down",
      "locked-resting": "down",
    });
    // locked-resting: an unreadable marker is not "gone", so no drift alarm on a resting row
    expect(alertIds(status)).toEqual(["halted-fleet", "locked-marker", "woken-beat", "woken-silent"]);
    expect(status).toContain("**woken-beat** registry says resting, but its rest marker `launchd-disabled:love.citizen.woken` is gone");
    expect(status).toContain("**halted-fleet** registry says live, but its rest marker");
    // an unreadable marker proves nothing: a live row that is stale stays an honest DOWN
    expect(status).toContain("**locked-marker** expected live, observed DOWN");
    expect(status).not.toMatch(/\*\*(rested-beat|halted-fleet|marker-only)\*\* expected live, observed DOWN/);
    expect(status).toContain("| 💤 | rested-beat | resting | resting |");
    expect(status).toContain("| 💤 | halted-fleet | live | resting |");
    expect(status).toContain("| 💤 | resting-unmarked | resting | down |");
    expect(status).toContain("| 🔴 | woken-silent | resting | down |");
    expect(status).toContain("| 🟢 | woken-beat | resting | up |");
    expect(status).toContain("| 🟢 | running-fleet | live | up |");
    expect(status).toContain("| 💤 | locked-resting | resting | down |");
    expect(result.stdout).toContain("2/9 up, 3 resting, 4 alerts");
  });

  test("when launchd's disabled list cannot be read, no rest is guessed either way", () => {
    const { status, observed } = runPulse(REST_REGISTRY, { "love.fleet": 0 }, { disabled: null, setup: haltAndLock });
    expect(observed["rested-beat"]).toBe("down");
    expect(observed["woken-beat"]).toBe("up");
    expect(alertIds(status)).not.toContain("rested-beat");
    expect(alertIds(status)).not.toContain("woken-beat");
    expect(status).toContain("| 💤 | rested-beat | resting | down |");
  });
});

describe("registry rest rows", () => {
  const ROOT = new URL("..", import.meta.url).pathname;
  const registry = Bun.YAML.parse(readFileSync(join(ROOT, "REGISTRY.yaml"), "utf8")) as { services: any[] };

  test("every resting row says why and since when", () => {
    for (const row of registry.services.filter((s) => s.status === "resting")) {
      expect(`${row.id}: ${row.notes ?? ""}`).toMatch(/\b20\d\d-\d\d-\d\d\b/);
    }
  });

  test("every rest marker is a path or a launchd label pulse can read", () => {
    for (const row of registry.services.filter((s) => s.rest_marker !== undefined)) {
      expect(String(row.rest_marker)).toMatch(/^(launchd-disabled:[\w.-]+|(file:\/\/)?~?\/\S+)$/);
    }
  });
});
