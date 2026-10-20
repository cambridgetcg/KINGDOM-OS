/**
 * pulse-mint-watch — a read-only supply watch for a Cosmos SDK chain, run by
 * bin/pulse.ts for every REGISTRY.yaml row that carries a `mint_watch:` block.
 *
 * Each round it makes at most three GET requests and never a full-history scan:
 *   1. REST  /cosmos/bank/v1beta1/supply/by_denom?denom=<denom>   total supply
 *   2. RPC   /status                                               latest height
 *   3. RPC   /tx_search for one message type, bounded to the heights since the
 *            last successful round (at most `max_window` blocks per round)
 *
 * Red (down) when the supply is above the dated baseline, or when any such
 * transaction has been seen since the baseline height. Both stay red until a
 * person explains them and re-dates the baseline in the registry; advancing
 * the scan cursor never clears a seen transaction, and a re-dated baseline
 * starts a fresh watch. A failed read is `unknown` — never green, and pulse
 * alerts on it — and backs off: the next attempt waits 30 min × 2^(failures−1),
 * capped at 8 h, so a struggling single validator is not hammered.
 */

export interface MintWatch {
  rpc: string; // CometBFT RPC base URL
  rest: string; // Cosmos REST base URL
  denom: string; // e.g. "uzrn"
  baseline: string | number; // total supply in the smallest unit at baseline_height
  baseline_height: number;
  baseline_date?: string;
  claim_msg: string; // full type URL, e.g. "/zerone.knowledge.v1.MsgClaimTrainingFundDisbursement"
  max_window?: number; // blocks scanned per round; default 20000
}

export interface WatchState {
  baseline_id?: string; // "<baseline>@<baseline_height>" the counts below belong to
  last_height?: number; // tx_search has covered (baseline_height, last_height]
  claims_seen?: number;
  first_claim_height?: number;
  failures?: number;
  backoff_until?: string; // ISO time
  last_supply?: string;
  checked_at?: string;
}

export interface WatchResult {
  observed: "up" | "down" | "unknown";
  note: string;
  url: string;
  state: WatchState;
}

export interface WatchOptions {
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
  now?: Date;
  timeoutMs?: number;
}

const DEFAULT_WINDOW = 20_000;
const BACKOFF_BASE_MS = 30 * 60_000;
const BACKOFF_CAP_MS = 8 * 60 * 60_000;

const trimSlash = (u: string) => u.replace(/\/+$/, "");

async function getJson(fetcher: NonNullable<WatchOptions["fetch"]>, url: string, timeoutMs: number): Promise<any> {
  const res = await fetcher(url, {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { accept: "application/json", "user-agent": "kingdom-pulse/0.1 (+read-only mint watch)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).pathname}`);
  return res.json();
}

function digits(value: unknown, what: string): string {
  const text = typeof value === "number" ? String(value) : value;
  if (typeof text !== "string" || !/^\d+$/.test(text)) throw new Error(`${what} is not a non-negative integer`);
  return text;
}

export function txSearchUrl(w: MintWatch, from: number, to: number): string {
  const query = `"message.action='${w.claim_msg}' AND tx.height>${from} AND tx.height<=${to}"`;
  return `${trimSlash(w.rpc)}/tx_search?query=${encodeURIComponent(query)}&per_page=1&page=1&order_by=${encodeURIComponent('"asc"')}`;
}

export function baselineId(w: MintWatch): string {
  return `${w.baseline}@${w.baseline_height}`;
}

export function backoffMs(failures: number): number {
  return Math.min(BACKOFF_BASE_MS * 2 ** Math.max(0, failures - 1), BACKOFF_CAP_MS);
}

export async function runMintWatch(w: MintWatch, prior: WatchState = {}, opts: WatchOptions = {}): Promise<WatchResult> {
  const fetcher = opts.fetch ?? ((url: string, init?: RequestInit) => fetch(url, init));
  const now = opts.now ?? new Date();
  const timeoutMs = opts.timeoutMs ?? 12_000;
  const url = trimSlash(w.rpc);
  // A re-dated baseline starts a new watch: counts and cursor from the old one
  // must not carry over (a claim before the new baseline is not "since" it).
  if (prior.baseline_id !== undefined && prior.baseline_id !== baselineId(w)) prior = {};

  if (prior.backoff_until && now.getTime() < Date.parse(prior.backoff_until)) {
    return {
      observed: "unknown",
      url,
      note: `not read: backing off after ${prior.failures ?? 1} failed round(s) until ${prior.backoff_until}`,
      state: prior,
    };
  }

  try {
    const baseline = BigInt(digits(w.baseline, "baseline"));
    const supplyBody = await getJson(
      fetcher,
      `${trimSlash(w.rest)}/cosmos/bank/v1beta1/supply/by_denom?denom=${encodeURIComponent(w.denom)}`,
      timeoutMs,
    );
    if (supplyBody?.amount?.denom !== w.denom) throw new Error(`supply reply is not for ${w.denom}`);
    const supply = BigInt(digits(supplyBody.amount.amount, "supply"));

    const statusBody = await getJson(fetcher, `${url}/status`, timeoutMs);
    const sync = statusBody?.result?.sync_info ?? statusBody?.sync_info;
    const height = Number(digits(sync?.latest_block_height, "latest_block_height"));

    const from = Math.max(prior.last_height ?? w.baseline_height, w.baseline_height);
    const to = Math.min(height, from + (w.max_window ?? DEFAULT_WINDOW));
    let found = 0;
    let firstHeight = prior.first_claim_height;
    if (to > from) {
      const search = await getJson(fetcher, txSearchUrl(w, from, to), timeoutMs);
      const result = search?.result;
      if (!result) throw new Error(`tx_search error: ${String(search?.error?.data ?? search?.error?.message ?? "no result").slice(0, 80)}`);
      found = Number(digits(result.total_count, "tx_search total_count"));
      if (found > 0 && firstHeight === undefined) {
        const h = Number(result.txs?.[0]?.height);
        firstHeight = Number.isFinite(h) && h > 0 ? h : to;
      }
    }

    const state: WatchState = {
      baseline_id: baselineId(w),
      last_height: Math.max(to, from),
      claims_seen: (prior.claims_seen ?? 0) + found,
      first_claim_height: firstHeight,
      failures: 0,
      last_supply: supply.toString(),
      checked_at: now.toISOString(),
    };

    const rise = supply - baseline;
    const msgName = w.claim_msg.split(".").pop() ?? w.claim_msg;
    const reds: string[] = [];
    if ((state.claims_seen ?? 0) > 0)
      reds.push(`⛔ ${state.claims_seen} ${msgName} tx(s) since h${w.baseline_height} (first at h${state.first_claim_height})`);
    if (rise > 0n)
      reds.push(`⛔ supply ${supply} ${w.denom} is above the ${w.baseline_date ?? "dated"} baseline ${baseline} (+${rise}): explain it, then re-date the baseline`);
    const scanned = to < height ? `scanned to h${state.last_height} of h${height} (catching up)` : `scanned to h${state.last_height}`;
    if (reds.length) return { observed: "down", url, note: `${reds.join("; ")}; ${scanned}`, state };
    const level = rise === 0n ? "at the baseline" : `${-rise} below the baseline`;
    return { observed: "up", url, note: `supply ${level}; 0 ${msgName} since h${w.baseline_height}; ${scanned}`, state };
  } catch (error) {
    const failures = (prior.failures ?? 0) + 1;
    const backoff_until = new Date(now.getTime() + backoffMs(failures)).toISOString();
    return {
      observed: "unknown",
      url,
      note: `read failed (${String((error as Error).message ?? error).slice(0, 80)}); next try after ${backoff_until}`,
      state: { ...prior, baseline_id: baselineId(w), failures, backoff_until },
    };
  }
}

/** Load the per-row watch state; a missing or unreadable file starts empty. */
export async function loadWatchState(path: string): Promise<Record<string, WatchState>> {
  try {
    const parsed = JSON.parse(await Bun.file(path).text());
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** Write the watch state through a temporary file, then rename it into place. */
export async function saveWatchState(path: string, state: Record<string, WatchState>): Promise<void> {
  const { rename, mkdir } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  await Bun.write(tmp, JSON.stringify(state, null, 1) + "\n");
  await rename(tmp, path);
}
