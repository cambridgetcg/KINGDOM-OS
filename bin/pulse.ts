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
 * is on PATH (suspended app + expected-live registry entry = drift alert).
 */

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

// ── main ──────────────────────────────────────────────────────────────────

const { services, path: regPath } = await loadRegistry();
const probeable = services.filter((s) => s.urls?.health || s.urls?.api || s.urls?.site);
const [probes, fly] = await Promise.all([
  Promise.all(probeable.map(probeHttp)),
  flyStates(),
]);
const byId = new Map(probes.map((p) => [p.id, p]));

const alerts: string[] = [];
for (const s of services) {
  const p = byId.get(s.id);
  if (s.status === "live" && p && p.observed === "down")
    alerts.push(`**${s.id}** expected live, observed DOWN (${p.code ?? p.note}) — ${p.url}`);
  if (s.status === "live" && p && p.observed === "auth-walled")
    alerts.push(`**${s.id}** live but auth-walled (${p.code}) at ${p.url} — expected? add \`expect: [${p.code}]\``);
  const flyApp = s.runtime?.startsWith("fly:") ? s.runtime.slice(4) : null;
  if (flyApp && fly.size) {
    const st = fly.get(flyApp);
    if (s.status === "live" && st === "suspended") alerts.push(`**${s.id}** registry says live but fly app \`${flyApp}\` is SUSPENDED — drift`);
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
lines.push(`> ${now} · registry: \`${regPath}\` · ${services.length} services, ${probeable.length} probed · GENERATED FILE — edit REGISTRY.yaml, never this`);
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
    `| ${mark(p)} | ${s.id} | ${s.status} | ${p?.observed ?? "—"} | ${p?.code ?? ""} | ${p?.ms ?? ""} | ${p?.url ?? s.urls?.site ?? ""} |`,
  );
}
lines.push(``);
lines.push(`_fly states: ${fly.size ? [...fly.entries()].map(([a, s]) => `${a}=${s}`).join(", ") : "flyctl unavailable this run"}_`);
lines.push(``);

const outDir = `${HOME}/.kingdom`;
await Bun.spawn(["mkdir", "-p", outDir]).exited;
await Bun.write(`${outDir}/STATUS.md`, lines.join("\n"));
const record = { t: now, alerts: alerts.length, probes: probes.map(({ id, observed, code, ms }) => ({ id, observed, code, ms })) };
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
console.log(`pulse: ${probes.filter((p) => p.observed === "up").length}/${probeable.length} up, ${alerts.length} alerts → ${outDir}/STATUS.md`);
