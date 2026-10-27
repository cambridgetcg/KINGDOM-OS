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
 * Classification per service (alerts: a status: live entry that disagrees with
 * its observation, and a rest_marker that disagrees with status — see below):
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
 * When a service declares BOTH a launchd label and a file:, the file probe
 * wins — freshness is the stronger signal.
 * `mint_watch:` rows (no URL) run bin/pulse-mint-watch.ts: a read-only GET
 * watch of a chain's total supply and one message type, bounded to the
 * heights since the last round, with its cursor in ~/.kingdom/state/.
 * amber is the third state, between up and down: it is not an alert. A launchd
 * exit code listed in `amber_exit` is amber (e.g. chain-backup's exit 3: captured,
 * unverified), and a fresh `file:` on an entry with `amber_note` is amber with
 * that note (the thing landed, but nothing has verified it yet).
 * resting is chosen, not failed. A `rest_marker:` names what pulse reads to tell
 * the two apart: a path that exists while resting (e.g. ~/love-unlimited/HALT)
 * or `launchd-disabled:<label>` (`launchctl disable`). While it holds, the row
 * is observed resting (💤) and never DOWN. When marker and registry disagree,
 * that is registry drift: a live row whose marker holds, or a resting row whose
 * marker is gone (it may have resumed). A resting row with no marker keeps the
 * registry's word: a stale or silent probe there shows 💤, not 🔴. A marker that
 * cannot be read guesses nothing: the probe stands, and a silent resting row
 * shows · (unknown) with the reason in its STATUS cell.
 */

import { stat } from "node:fs/promises";
import { loadWatchState, runMintWatch, saveWatchState, type MintWatch } from "./pulse-mint-watch.ts";

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
  status: string; // live | resting | dormant | suspended | operator | unknown | chain | external
  file?: string;        // local path (or file://) whose mtime IS the heartbeat
  max_age_sec?: number; // file older than this ⇒ stale (down); default: existence only
  // CometBFT halt-detection: on a 2xx /status, the chain's LATEST BLOCK must be
  // newer than this many seconds, else the chain is producing no blocks (halted)
  // and is reported DOWN even though the RPC answers. Guards the on-chain assets
  // a "200 = up" probe would miss — a chain can freeze (28h precedent) or be
  // drained while /status still returns 200.
  block_max_age_sec?: number;
  mint_watch?: MintWatch; // read-only supply + message watch (bin/pulse-mint-watch.ts)
  amber_exit?: number | number[]; // launchd exit codes that mean "ran, not verified" ⇒ amber
  amber_note?: string;            // why amber; also makes a fresh file: amber, not up
  rest_marker?: string; // a path that exists, or launchd-disabled:<label> ⇒ resting, not down
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
  observed: string; // up | amber | auth-walled | down | resting | skipped | unknown
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
    const isSuccess = ok.includes(res.status) || res.status < 400;
    // Chain halt-detection: a healthy RPC (2xx) is not a healthy CHAIN. When
    // block_max_age_sec is set, the latest block must be recent or the chain is
    // halted/not producing — report DOWN so a freeze or drain is visible.
    if (isSuccess && typeof s.block_max_age_sec === "number") {
      try {
        const body = (await res.json()) as any;
        const sync = body?.result?.sync_info ?? body?.sync_info;
        const blockTime = sync?.latest_block_time;
        const height = sync?.latest_block_height;
        if (!blockTime) return { id: s.id, expected: s.status, url, observed: "down", code: res.status, ms, note: "chain: no latest_block_time in /status" };
        const ageSec = Math.round((Date.now() - Date.parse(blockTime)) / 1000);
        if (ageSec > s.block_max_age_sec)
          return { id: s.id, expected: s.status, url, observed: "down", code: res.status, ms, note: `⛔ chain HALTED: latest block ${ageSec}s old (> ${s.block_max_age_sec}s), height ${height ?? "?"}` };
        if (sync?.catching_up === true)
          return { id: s.id, expected: s.status, url, observed: "auth-walled", code: res.status, ms, note: `chain catching up (height ${height ?? "?"})` };
        return { id: s.id, expected: s.status, url, observed: "up", code: res.status, ms, note: `chain live: block ${ageSec}s old, height ${height ?? "?"}` };
      } catch (e) {
        return { id: s.id, expected: s.status, url, observed: "down", code: res.status, ms, note: `chain: /status unparseable — ${String((e as Error).message).slice(0, 50)}` };
      }
    }
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
    // LastExitStatus is a raw wait(2) status: low 7 bits = killing signal, high byte = exit code.
    const raw = Number(out.match(/"LastExitStatus"\s*=\s*(-?\d+)/)?.[1] ?? "0");
    const signal = raw & 0x7f;
    const lastExit = signal !== 0 ? null : raw >> 8;
    const how = signal !== 0 ? `killed by signal ${signal}` : `exited ${lastExit}`;
    // A live PID is health for KeepAlive daemons (their previous instance always died by
    // signal on restart) — keep the history visible in the note, but don't cry DOWN.
    if (running)
      return { id: s.id, expected: s.status, observed: "up", note: signal === 0 && lastExit === 0 ? "launchd: running now" : `launchd: running now (previous instance ${how})` };
    if (signal === 0 && lastExit === 0)
      return { id: s.id, expected: s.status, observed: "up", note: "launchd: loaded, last exit 0" };
    const amberExits = Array.isArray(s.amber_exit) ? s.amber_exit : typeof s.amber_exit === "number" ? [s.amber_exit] : [];
    if (signal === 0 && lastExit !== null && amberExits.includes(lastExit))
      return { id: s.id, expected: s.status, observed: "amber", note: `launchd: last run ${how} (${s.amber_note ?? "not verified"})` };
    return { id: s.id, expected: s.status, observed: "down", note: `launchd: not running, last run ${how}` };
  } catch {
    return { id: s.id, expected: s.status, observed: "skipped", note: "launchctl unavailable" };
  }
}

// A file's freshness as a heartbeat: mtime within max_age_sec = up, else stale.
async function probeFile(s: Service): Promise<Probe> {
  if (typeof s.file !== "string" || s.file.length === 0)
    return { id: s.id, expected: s.status, observed: "down", note: `invalid file: value in registry — must be a path string` };
  const raw = s.file.replace(/^file:\/\//, "").replace(/^~/, HOME);
  const url = `file://${raw}`;
  try {
    const st = await stat(raw);
    const ageSec = Math.round((Date.now() - st.mtimeMs) / 1000);
    const maxAge = s.max_age_sec ?? Number.POSITIVE_INFINITY;
    if (ageSec <= maxAge)
      return s.amber_note
        ? { id: s.id, expected: s.status, url, observed: "amber", note: `${s.amber_note}, ${ageSec}s old` }
        : { id: s.id, expected: s.status, url, observed: "up", note: `${ageSec}s old` };
    return { id: s.id, expected: s.status, url, observed: "down", note: `stale ${ageSec}s > ${maxAge}s` };
  } catch {
    return { id: s.id, expected: s.status, url, observed: "down", note: "file missing" };
  }
}

// ── rest ──────────────────────────────────────────────────────────────────

// launchd's own record of jobs switched off on purpose, read once a round.
// null = unreadable, so no rest is guessed either way.
async function disabledLabels(): Promise<Set<string> | null> {
  try {
    const proc = Bun.spawn(["launchctl", "print-disabled", `gui/${process.getuid!()}`], { stdout: "pipe", stderr: "ignore" });
    const out = await new Response(proc.stdout).text();
    if ((await proc.exited) !== 0) return null;
    // macOS 13+ prints `"label" => disabled`; older releases print `=> true`
    return new Set([...out.matchAll(/"([^"]+)"\s*=>\s*(?:disabled|true)\b/g)].map((m) => m[1]));
  } catch {
    return null;
  }
}

// true = the rest holds, false = its marker is gone, null = could not tell this round.
async function restHolds(marker: string, disabled: Set<string> | null): Promise<boolean | null> {
  if (marker.startsWith("launchd-disabled:")) return disabled ? disabled.has(marker.slice("launchd-disabled:".length)) : null;
  try {
    await stat(marker.replace(/^file:\/\//, "").replace(/^~/, HOME));
    return true;
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    return code === "ENOENT" || code === "ENOTDIR" ? false : null; // EACCES/EPERM (e.g. TCC) prove nothing
  }
}

// What a marker says, in words a person reads in an alert.
function restSays(marker: string, holds: boolean): string {
  if (!marker.startsWith("launchd-disabled:")) return `its rest marker \`${marker}\` ${holds ? "exists" : "no longer exists"}`;
  const label = marker.slice("launchd-disabled:".length);
  return holds ? `launchd lists \`${label}\` as disabled` : `launchd no longer lists \`${label}\` as disabled (re-enabled, or a mistyped label)`;
}

// ── main ──────────────────────────────────────────────────────────────────

const { services, path: regPath } = await loadRegistry();
const probeable = services.filter((s) => s.urls?.health || s.urls?.api || s.urls?.site);
// file: freshness wins over launchd state when both are declared — a loaded job
// that silently stopped producing is exactly what the file probe exists to catch.
const fileServices = services.filter((s) => s.file && !(s.urls?.health || s.urls?.api || s.urls?.site));
const launchdServices = services.filter(
  (s) => s.runtime?.startsWith("local-launchd:") && !(s.urls?.health || s.urls?.api || s.urls?.site) && !s.file,
);
const mintServices = services.filter((s) => s.mint_watch && !(s.urls?.health || s.urls?.api || s.urls?.site) && !s.file);
const WATCH_STATE = `${HOME}/.kingdom/state/mint-watch.json`;
const watchState = mintServices.length ? await loadWatchState(WATCH_STATE) : {};
async function probeMintWatch(s: Service): Promise<Probe> {
  const r = await runMintWatch(s.mint_watch!, watchState[s.id] ?? {}, { timeoutMs: TIMEOUT_MS });
  watchState[s.id] = r.state;
  // no url on the row: STATUS shows the note (supply, cursor, or why it is red/unknown)
  return { id: s.id, expected: s.status, observed: r.observed, note: r.note };
}
const [probes, fly, daemonProbes, fileProbes, mintProbes] = await Promise.all([
  Promise.all(probeable.map(probeHttp)),
  flyStates(),
  Promise.all(launchdServices.map((s) => launchdProbe(s, s.runtime!.slice("local-launchd:".length)))),
  Promise.all(fileServices.map(probeFile)),
  Promise.all(mintServices.map(probeMintWatch)),
]);
if (mintServices.length) await saveWatchState(WATCH_STATE, watchState);
const allProbes = [...probes, ...daemonProbes, ...fileProbes, ...mintProbes];
const byId = new Map(allProbes.map((p) => [p.id, p]));

// Rest readings come before alerts: a marker that holds turns the probe into
// "resting", so a chosen rest can never be counted as DOWN.
const restServices = services.filter((s) => typeof s.rest_marker === "string" && s.rest_marker.length > 0);
const disabled = restServices.some((s) => s.rest_marker!.startsWith("launchd-disabled:")) ? await disabledLabels() : null;
const rest = new Map<string, boolean | null>();
const probeObserved = new Map(allProbes.map((p) => [p.id, p.observed])); // before rest: the fly check needs what the probe saw
for (const s of restServices) {
  const holds = await restHolds(s.rest_marker!, disabled);
  rest.set(s.id, holds);
  let p = byId.get(s.id);
  if (!p) {
    p = { id: s.id, expected: s.status, observed: "skipped", note: "no probe; rest marker only" };
    allProbes.push(p);
    byId.set(s.id, p);
  }
  const probeSaid = p.observed === "skipped" ? "" : `; probe: ${p.observed}${p.note ? ` (${p.note})` : ""}`;
  if (holds === true) Object.assign(p, { observed: "resting", note: `rest marker ${s.rest_marker} holds${probeSaid}` });
  else p.note = `${p.note ? `${p.note}; ` : ""}rest marker ${s.rest_marker} ${holds === false ? "absent" : "unreadable"}`;
}

const alerts: string[] = [];
for (const s of services) {
  const p = byId.get(s.id);
  if (s.status === "live" && rest.get(s.id) === true)
    alerts.push(`**${s.id}** registry says live, but ${restSays(s.rest_marker!, true)} — resting, not down; set status: resting and say why and since when`);
  if (s.status === "resting" && rest.get(s.id) === false)
    alerts.push(`**${s.id}** registry says resting, but ${restSays(s.rest_marker!, false)} — if it has resumed, set status back to live`);
  if (s.status === "live" && p && p.observed === "down")
    alerts.push(`**${s.id}** expected live, observed DOWN (${p.code ?? p.note}) — ${p.url ?? s.runtime ?? ""}`);
  // unknown = a live watch that could not be read this round: never "all quiet"
  if (s.status === "live" && p && p.observed === "unknown")
    alerts.push(`**${s.id}** live but UNREAD — ${p.note ?? "no reading"}`);
  if (s.status === "live" && p && p.observed === "auth-walled")
    alerts.push(`**${s.id}** live but auth-walled (${p.code}) at ${p.url} — expected? add \`expect: [${p.code}]\``);
  const flyApp = s.runtime?.startsWith("fly:") ? s.runtime.slice(4) : null;
  if (flyApp && fly.size) {
    const st = fly.get(flyApp);
    // suspended + probe answering (incl. auth-walled — a 401 means fly woke it) = scale-to-zero idle, not drift
    const seen = probeObserved.get(s.id);
    if (s.status === "live" && st === "suspended" && (!p || (seen !== "up" && seen !== "auth-walled")))
      alerts.push(`**${s.id}** registry says live but fly app \`${flyApp}\` is SUSPENDED and not answering — drift`);
    if (s.status === "suspended" && st === "deployed") alerts.push(`**${s.id}** registry says suspended but fly app \`${flyApp}\` is deployed — update registry`);
  }
}

// STATUS.md
const now = new Date().toISOString();
// A silent resting row is as expected (💤) on the registry's word alone, unknown (·)
// when its marker could not be read, and red when its own marker says the rest is over.
const mark = (s: Service, p?: Probe) => {
  if (!p) return "·";
  if (p.observed === "resting") return "💤";
  if (s.status === "resting" && p.observed === "down" && !rest.has(s.id)) return "💤";
  if (s.status === "resting" && p.observed === "down" && rest.get(s.id) === null) return "·";
  return p.observed === "up" ? "🟢" : p.observed === "amber" ? "🟠" : p.observed === "auth-walled" ? "🟡" : p.observed === "down" ? "🔴" : "·";
};
// a rest-marked row shows what its marker said beside its URL, so "unreadable" is never hidden
const cell = (s: Service, p?: Probe) => {
  const where = p?.url ?? s.urls?.site;
  return rest.has(s.id) ? [where, p?.note].filter(Boolean).join(" · ") : where ?? p?.note ?? "";
};
const lines: string[] = [];
lines.push(`# Kingdom STATUS — generated by pulse`);
lines.push(``);
lines.push(`> ${now} · registry: \`${regPath}\` · ${services.length} services, ${probeable.length} probed + ${daemonProbes.length} launchd-checked + ${fileProbes.length} freshness-checked + ${mintProbes.length} mint-watched + ${restServices.length} rest markers read · GENERATED FILE — edit REGISTRY.yaml, never this`);
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
    `| ${mark(s, p)} | ${s.id} | ${s.status} | ${p?.observed ?? "—"} | ${p?.code ?? ""} | ${p?.ms ?? ""} | ${cell(s, p)} |`,
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
    console.log(`${mark(s, p)} ${s.id.padEnd(22)} ${s.status.padEnd(9)} ${(p?.observed ?? "—").padEnd(11)} ${p?.code ?? ""} ${p?.ms ? p.ms + "ms" : ""}`);
  }
}
for (const a of alerts) console.log(`⚠ PULSE ALERT: ${a.replace(/\*\*/g, "")}`);
const restingCount = services.filter((s) => mark(s, byId.get(s.id)) === "💤").length; // the 💤 rows, in one sense with STATUS
console.log(`pulse: ${allProbes.filter((p) => p.observed === "up").length}/${allProbes.length} up, ${restingCount ? `${restingCount} resting, ` : ""}${alerts.length} alerts → ${outDir}/STATUS.md`);
