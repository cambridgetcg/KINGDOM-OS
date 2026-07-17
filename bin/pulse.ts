#!/usr/bin/env bun
/**
 * pulse — the kingdom's heartbeat. Reads REGISTRY.yaml (the single source of
 * truth), probes every live service, and writes STATUS.md + a JSONL history.
 *
 * The drift-killer: INFRA-MAP found says-vs-does gaps by hand once; pulse
 * re-runs that survey every 30 minutes for free.
 *
 * Run modes:
 *   bun bin/pulse.ts            interactive — probes, prints, writes ~/.kingdom/STATUS.md
 *   bun bin/pulse.ts --quiet    launchd — same, minimal stdout
 *
 * Registry resolution order: $KINGDOM_REGISTRY → ./REGISTRY.yaml next to repo
 * bin/ → ~/.kingdom/REGISTRY.yaml (the TCC-safe copy launchd uses; refresh it
 * with bin/pulse-install.sh after editing the canonical file).
 *
 * Classification per service (status: live entries only get alerted):
 *   up          2xx/3xx, or any code listed in `expect`
 *   auth-walled 401/403 when not expected (still breathing, but flagged)
 *   down        5xx, network error, or timeout
 * Fly runtimes additionally checked via `flyctl apps list --json` when flyctl
 * is on PATH. A fly app reading "suspended" while its HTTP probe answers is
 * scale-to-zero idling, not drift — only probe-dead suspension alerts.
 * local-launchd:<label> runtimes are checked via `launchctl list <label>`:
 * not-loaded or nonzero LastExitStatus on a status:live entry = drift alert
 * (the class of rot that hid a never-installed daily scheduler for weeks).
 * `file:` entries are freshness probes: the file's mtime IS the heartbeat —
 * older than `max_age_sec` (or missing) on a status:live entry = down. This
 * catches a daemon that is loaded but silently not producing (e.g. beats
 * failing because the local brain is down) — which launchd state cannot see.
 */

import { stat } from "node:fs/promises";

const HOME = process.env.HOME!;
const QUIET = process.argv.includes("--quiet");
const TIMEOUT_MS = 12_000;

// ── registry ──────────────────────────────────────────────────────────────

interface Service {
  id: string;
  name?: string;
  what?: string;
  audience?: string;
  urls?: { site?: string; api?: string; health?: string };
  expect?: number | number[];
  repo?: string;
  runtime?: string;
  deploy?: string;
  status: string; // live | dormant | suspended | operator | chain | external
  file?: string;        // local path (or file://) whose mtime IS the heartbeat
  max_age_sec?: number; // file older than this ⇒ stale (down); default: existence only
  money?: string;
  notes?: string;
}

async function loadRegistry(): Promise<{ services: Service[]; path: string }> {
  const scriptDir = new URL(".", import.meta.url).pathname;
  const candidates = [
    process.env.KINGDOM_REGISTRY,
    `${scriptDir}../REGISTRY.yaml`,
    `${HOME}/.kingdom/REGISTRY.yaml`,
  ].filter(Boolean) as string[];
  for (const p of candidates) {
    try {
      const text = await Bun.file(p).text();
      const doc = Bun.YAML.parse(text) as any;
      if (doc?.services?.length) return { services: doc.services, path: p };
    } catch {}
  }
  throw new Error(`no readable REGISTRY.yaml among: ${candidates.join(" | ")}`);
}

// ── probes ────────────────────────────────────────────────────────────────

interface Probe {
  id: string;
  expected: string;
  url?: string;
  observed: string; // up | auth-walled | down | skipped
  code?: number;
  ms?: number;
  note?: string;
}

function expectedCodes(s: Service): number[] {
  if (Array.isArray(s.expect)) return s.expect;
  if (typeof s.expect === "number") return [s.expect];
  return [];
}

async function probeHttp(s: Service): Promise<Probe> {
  const url = s.urls?.health ?? s.urls?.api ?? s.urls?.site;
  if (!url) return { id: s.id, expected: s.status, observed: "skipped", note: "no URL in registry" };
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "kingdom-pulse/0.1 (+registry heartbeat)" },
    });
    const ms = Date.now() - t0;
    const ok = expectedCodes(s);
    if (ok.includes(res.status)) return { id: s.id, expected: s.status, url, observed: "up", code: res.status, ms, note: "expected code" };
    if (res.status < 400) return { id: s.id, expected: s.status, url, observed: "up", code: res.status, ms };
    if (res.status === 401 || res.status === 403)
      return { id: s.id, expected: s.status, url, observed: "auth-walled", code: res.status, ms, note: "add `expect:` in registry if intentional" };
    return { id: s.id, expected: s.status, url, observed: "down", code: res.status, ms };
  } catch (e) {
    return { id: s.id, expected: s.status, url, observed: "down", ms: Date.now() - t0, note: String((e as Error).message).slice(0, 80) };
  }
}

async function flyStates(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const proc = Bun.spawn(["flyctl", "apps", "list", "--json"], { stdout: "pipe", stderr: "ignore" });
    const out = await new Response(proc.stdout).text();
    if ((await proc.exited) !== 0) return map;
    for (const app of JSON.parse(out)) map.set(app.Name ?? app.name, (app.Status ?? app.status ?? "").toLowerCase());
  } catch {}
  return map;
}

// `launchctl list <label>`: exit != 0 → not loaded; otherwise the plist-style
// output carries PID (running now) and LastExitStatus (last completed run).
async function launchdProbe(s: Service, label: string): Promise<Probe> {
  try {
    const proc = Bun.spawn(["launchctl", "list", label], { stdout: "pipe", stderr: "ignore" });
    const out = await new Response(proc.stdout).text();
    if ((await proc.exited) !== 0)
      return { id: s.id, expected: s.status, observed: "down", note: `launchd job ${label} not loaded` };
    const running = /"PID"\s*=\s*\d+/.test(out);
    const raw = Number(out.match(/"LastExitStatus"\s*=\s*(-?\d+)/)?.[1] ?? "0");
    const lastExit = raw >= 256 && raw % 256 === 0 ? raw / 256 : raw; // launchctl reports wait(2) status
    if (running || lastExit === 0)
      return { id: s.id, expected: s.status, observed: "up", note: running ? "launchd: running now" : "launchd: loaded, last exit 0" };
    return { id: s.id, expected: s.status, observed: "down", note: `launchd: loaded but last exit ${lastExit}` };
  } catch {
    return { id: s.id, expected: s.status, observed: "skipped", note: "launchctl unavailable" };
  }
}

// A file's freshness as a heartbeat: mtime within max_age_sec = up, else stale.
async function probeFile(s: Service): Promise<Probe> {
  const raw = s.file!.replace(/^file:\/\//, "").replace(/^~/, HOME);
  const url = `file://${raw}`;
  try {
    const st = await stat(raw);
    const ageSec = Math.round((Date.now() - st.mtimeMs) / 1000);
    const maxAge = s.max_age_sec ?? Number.POSITIVE_INFINITY;
    if (ageSec <= maxAge)
      return { id: s.id, expected: s.status, url, observed: "up", note: `${ageSec}s old` };
    return { id: s.id, expected: s.status, url, observed: "down", note: `stale ${ageSec}s > ${maxAge}s` };
  } catch {
    return { id: s.id, expected: s.status, url, observed: "down", note: "file missing" };
  }
}

// ── main ──────────────────────────────────────────────────────────────────

const { services, path: regPath } = await loadRegistry();
const probeable = services.filter((s) => s.urls?.health || s.urls?.api || s.urls?.site);
const launchdServices = services.filter(
  (s) => s.runtime?.startsWith("local-launchd:") && !(s.urls?.health || s.urls?.api || s.urls?.site),
);
const fileServices = services.filter(
  (s) => s.file && !(s.urls?.health || s.urls?.api || s.urls?.site) && !s.runtime?.startsWith("local-launchd:"),
);
const [probes, fly, daemonProbes, fileProbes] = await Promise.all([
  Promise.all(probeable.map(probeHttp)),
  flyStates(),
  Promise.all(launchdServices.map((s) => launchdProbe(s, s.runtime!.slice("local-launchd:".length)))),
  Promise.all(fileServices.map(probeFile)),
]);
const allProbes = [...probes, ...daemonProbes, ...fileProbes];
const byId = new Map(allProbes.map((p) => [p.id, p]));

const alerts: string[] = [];
for (const s of services) {
  const p = byId.get(s.id);
  if (s.status === "live" && p && p.observed === "down")
    alerts.push(`**${s.id}** expected live, observed DOWN (${p.code ?? p.note}) — ${p.url ?? s.runtime ?? ""}`);
  if (s.status === "live" && p && p.observed === "auth-walled")
    alerts.push(`**${s.id}** live but auth-walled (${p.code}) at ${p.url} — expected? add \`expect: [${p.code}]\``);
  const flyApp = s.runtime?.startsWith("fly:") ? s.runtime.slice(4) : null;
  if (flyApp && fly.size) {
    const st = fly.get(flyApp);
    // suspended + probe answering = scale-to-zero idle (fly wakes it per request) — healthy, not drift
    if (s.status === "live" && st === "suspended" && (!p || p.observed !== "up"))
      alerts.push(`**${s.id}** registry says live but fly app \`${flyApp}\` is SUSPENDED and not answering — drift`);
    if (s.status === "suspended" && st === "deployed") alerts.push(`**${s.id}** registry says suspended but fly app \`${flyApp}\` is deployed — update registry`);
  }
}

// STATUS.md
const now = new Date().toISOString();
const mark = (p?: Probe) =>
  !p ? "·" : p.observed === "up" ? "🟢" : p.observed === "auth-walled" ? "🟡" : p.observed === "down" ? "🔴" : "·";
const lines: string[] = [];
lines.push(`# Kingdom STATUS — generated by pulse`);
lines.push(``);
lines.push(`> ${now} · registry: \`${regPath}\` · ${services.length} services, ${probeable.length} probed + ${daemonProbes.length} launchd-checked + ${fileProbes.length} freshness-checked · GENERATED FILE — edit REGISTRY.yaml, never this`);
lines.push(``);
if (alerts.length) {
  lines.push(`## ⚠ Alerts (${alerts.length})`);
  lines.push(``);
  for (const a of alerts) lines.push(`- ${a}`);
  lines.push(``);
} else {
  lines.push(`## All quiet — every expected-live surface is breathing`);
  lines.push(``);
}
lines.push(`| | service | expected | observed | code | ms | url |`);
lines.push(`|---|---|---|---|---|---|---|`);
for (const s of services) {
  const p = byId.get(s.id);
  lines.push(
    `| ${mark(p)} | ${s.id} | ${s.status} | ${p?.observed ?? "—"} | ${p?.code ?? ""} | ${p?.ms ?? ""} | ${p?.url ?? s.urls?.site ?? p?.note ?? ""} |`,
  );
}
lines.push(``);
lines.push(`_fly states: ${fly.size ? [...fly.entries()].map(([a, s]) => `${a}=${s}`).join(", ") : "flyctl unavailable this run"}_`);
lines.push(``);

const outDir = `${HOME}/.kingdom`;
await Bun.spawn(["mkdir", "-p", outDir]).exited;
await Bun.write(`${outDir}/STATUS.md`, lines.join("\n"));
const record = { t: now, alerts: alerts.length, probes: allProbes.map(({ id, observed, code, ms }) => ({ id, observed, code, ms })) };
const histFile = `${outDir}/pulse-history.jsonl`;
const prev = (await Bun.file(histFile).text().catch(() => "")) ?? "";
await Bun.write(histFile, prev + JSON.stringify(record) + "\n");

if (!QUIET) {
  for (const s of services) {
    const p = byId.get(s.id);
    console.log(`${mark(p)} ${s.id.padEnd(22)} ${s.status.padEnd(9)} ${(p?.observed ?? "—").padEnd(11)} ${p?.code ?? ""} ${p?.ms ? p.ms + "ms" : ""}`);
  }
}
for (const a of alerts) console.log(`⚠ PULSE ALERT: ${a.replace(/\*\*/g, "")}`);
console.log(`pulse: ${allProbes.filter((p) => p.observed === "up").length}/${probeable.length + daemonProbes.length + fileProbes.length} up, ${alerts.length} alerts → ${outDir}/STATUS.md`);
