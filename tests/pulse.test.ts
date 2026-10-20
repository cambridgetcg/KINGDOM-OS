import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PULSE = new URL("../bin/pulse.ts", import.meta.url).pathname;

// Pulse runs for real against an owned HOME and registry. No entry has a URL,
// so nothing is fetched; launchctl is a fake that reports one exit per label.
function runPulse(registry: string, exits: Record<string, number>) {
  const base = mkdtempSync(join(tmpdir(), "pulse-test-"));
  try {
    const bin = join(base, "bin");
    mkdirSync(bin);
    mkdirSync(join(base, "home"));
    writeFileSync(join(bin, "launchctl"), `#!/bin/bash
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
    rmSync(base, { recursive: true, force: true });
  }
}

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
