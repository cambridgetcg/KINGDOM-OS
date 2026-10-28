import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  backoffMs,
  loadWatchState,
  runMintWatch,
  saveWatchState,
  txSearchUrl,
  type MintWatch,
} from "../bin/pulse-mint-watch.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const WATCH: MintWatch = {
  rpc: "http://rpc.example:26657",
  rest: "http://rest.example:1317/",
  denom: "uzrn",
  baseline: "1000",
  baseline_height: 100,
  baseline_date: "2026-10-19",
  claim_msg: "/zerone.knowledge.v1.MsgClaimTrainingFundDisbursement",
  max_window: 50,
};

interface Seen {
  url: string;
  method: string | undefined;
}

function fakeChain(opts: { supply?: string; height?: number; claims?: number; claimHeight?: number; fail?: string }) {
  const seen: Seen[] = [];
  const fetcher = async (url: string, init?: RequestInit) => {
    seen.push({ url, method: init?.method });
    if (opts.fail && url.includes(opts.fail)) throw new Error("The operation timed out.");
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
    if (url.includes("/cosmos/bank/v1beta1/supply/by_denom")) return json({ amount: { denom: "uzrn", amount: opts.supply ?? "1000" } });
    if (url.endsWith("/status")) return json({ result: { sync_info: { latest_block_height: String(opts.height ?? 120) } } });
    if (url.includes("/tx_search")) {
      const count = opts.claims ?? 0;
      return json({ result: { total_count: String(count), txs: count ? [{ height: String(opts.claimHeight ?? 110) }] : [] } });
    }
    return new Response("not found", { status: 404 });
  };
  return { seen, fetcher };
}

const NOW = new Date("2026-10-20T22:00:00Z");

describe("pulse mint watch", () => {
  test("quiet chain: green, GET only, scans exactly the heights since the baseline", async () => {
    const chain = fakeChain({ height: 120 });
    const r = await runMintWatch(WATCH, {}, { fetch: chain.fetcher, now: NOW });
    expect(r.observed).toBe("up");
    expect(r.state.last_height).toBe(120);
    expect(r.state.claims_seen).toBe(0);
    expect(chain.seen).toHaveLength(3);
    expect(chain.seen.every((s) => s.method === "GET")).toBe(true);
    const search = decodeURIComponent(chain.seen[2]!.url);
    expect(search).toContain("message.action='/zerone.knowledge.v1.MsgClaimTrainingFundDisbursement'");
    expect(search).toContain("tx.height>100 AND tx.height<=120");
    expect(chain.seen[0]!.url).toBe("http://rest.example:1317/cosmos/bank/v1beta1/supply/by_denom?denom=uzrn");
  });

  test("the next round resumes from the cursor and never rescans history", async () => {
    const chain = fakeChain({ height: 130 });
    const r = await runMintWatch(WATCH, { last_height: 120, claims_seen: 0 }, { fetch: chain.fetcher, now: NOW });
    expect(decodeURIComponent(chain.seen[2]!.url)).toContain("tx.height>120 AND tx.height<=130");
    expect(r.state.last_height).toBe(130);
  });

  test("a long gap is scanned at most max_window blocks per round", async () => {
    const chain = fakeChain({ height: 10_000 });
    const r = await runMintWatch(WATCH, { last_height: 200 }, { fetch: chain.fetcher, now: NOW });
    expect(decodeURIComponent(chain.seen[2]!.url)).toContain("tx.height>200 AND tx.height<=250");
    expect(r.state.last_height).toBe(250);
    expect(r.observed).toBe("up");
    expect(r.note).toContain("catching up");
  });

  test("no new block: no tx_search at all", async () => {
    const chain = fakeChain({ height: 120 });
    const r = await runMintWatch(WATCH, { last_height: 120 }, { fetch: chain.fetcher, now: NOW });
    expect(chain.seen).toHaveLength(2);
    expect(r.observed).toBe("up");
  });

  test("supply above the baseline is red and says how much", async () => {
    const chain = fakeChain({ supply: "3000", height: 120 });
    const r = await runMintWatch(WATCH, {}, { fetch: chain.fetcher, now: NOW });
    expect(r.observed).toBe("down");
    expect(r.note).toContain("+2000");
    expect(r.note).toContain("re-date the baseline");
  });

  test("supply below the baseline stays green", async () => {
    const chain = fakeChain({ supply: "900", height: 120 });
    expect((await runMintWatch(WATCH, {}, { fetch: chain.fetcher, now: NOW })).observed).toBe("up");
  });

  test("a claim tx is red, and stays red after the cursor moves past it", async () => {
    const first = await runMintWatch(WATCH, {}, { fetch: fakeChain({ height: 120, claims: 1, claimHeight: 111 }).fetcher, now: NOW });
    expect(first.observed).toBe("down");
    expect(first.note).toContain("first at h111");
    const later = await runMintWatch(WATCH, first.state, { fetch: fakeChain({ height: 140, claims: 0 }).fetcher, now: NOW });
    expect(later.observed).toBe("down");
    expect(later.state.claims_seen).toBe(1);
    expect(later.state.first_claim_height).toBe(111);
  });

  test("a failed read is unknown (never green), keeps the cursor, and backs off", async () => {
    const chain = fakeChain({ height: 130, fail: "/tx_search" });
    const r = await runMintWatch(WATCH, { last_height: 120 }, { fetch: chain.fetcher, now: NOW });
    expect(r.observed).toBe("unknown");
    expect(r.state.last_height).toBe(120);
    expect(r.state.failures).toBe(1);
    expect(Date.parse(r.state.backoff_until!)).toBe(NOW.getTime() + 30 * 60_000);

    const quiet = fakeChain({ height: 130 });
    const during = await runMintWatch(WATCH, r.state, { fetch: quiet.fetcher, now: new Date(NOW.getTime() + 10 * 60_000) });
    expect(during.observed).toBe("unknown");
    expect(quiet.seen).toHaveLength(0);

    const after = await runMintWatch(WATCH, r.state, { fetch: quiet.fetcher, now: new Date(NOW.getTime() + 31 * 60_000) });
    expect(after.observed).toBe("up");
    expect(after.state.failures).toBe(0);
    expect(after.state.backoff_until).toBeUndefined();
  });

  test("a re-dated baseline starts a fresh watch instead of keeping old claims", async () => {
    const red = await runMintWatch(WATCH, {}, { fetch: fakeChain({ height: 120, claims: 1, claimHeight: 111 }).fetcher, now: NOW });
    expect(red.observed).toBe("down");
    const rebased = { ...WATCH, baseline_height: 150 };
    const chain = fakeChain({ height: 160 });
    const fresh = await runMintWatch(rebased, red.state, { fetch: chain.fetcher, now: NOW });
    expect(fresh.observed).toBe("up");
    expect(fresh.state.claims_seen).toBe(0);
    expect(fresh.state.first_claim_height).toBeUndefined();
    expect(fresh.state.baseline_id).toBe("1000@150");
    expect(decodeURIComponent(chain.seen[2]!.url)).toContain("tx.height>150 AND tx.height<=160");
  });

  test("backoff doubles per failure and is capped at eight hours", () => {
    expect(backoffMs(1)).toBe(30 * 60_000);
    expect(backoffMs(2)).toBe(60 * 60_000);
    expect(backoffMs(3)).toBe(120 * 60_000);
    expect(backoffMs(10)).toBe(8 * 60 * 60_000);
  });

  test("a reply for another denom is not read as supply", async () => {
    const fetcher = async (url: string) =>
      url.includes("supply") ? new Response(JSON.stringify({ amount: { denom: "stake", amount: "1" } })) : new Response("{}");
    expect((await runMintWatch(WATCH, {}, { fetch: fetcher, now: NOW })).observed).toBe("unknown");
  });

  test("tx_search URL quotes the query the way CometBFT expects", () => {
    const url = txSearchUrl(WATCH, 5, 9);
    expect(url.startsWith("http://rpc.example:26657/tx_search?query=%22")).toBe(true);
    expect(url).toContain("per_page=1");
    expect(url).toContain("order_by=%22asc%22");
  });

  test("state round-trips through an atomic write", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mint-watch-"));
    const path = join(dir, "state", "mint-watch.json");
    expect(await loadWatchState(path)).toEqual({});
    await saveWatchState(path, { a: { last_height: 7, claims_seen: 0 } });
    expect(await loadWatchState(path)).toEqual({ a: { last_height: 7, claims_seen: 0 } });
  });
});

describe("pulse alerts on an unread watch", () => {
  test("STATUS never says all quiet while a live watch is unknown", () => {
    const home = mkdtempSync(join(tmpdir(), "pulse-unread-"));
    const registry = join(home, "REGISTRY.yaml");
    writeFileSync(
      registry,
      [
        "version: 1",
        "services:",
        "  - id: chain-supply-watch",
        "    what: test watch",
        "    status: live",
        "    mint_watch:",
        '      rpc: "http://127.0.0.1:9"',
        '      rest: "http://127.0.0.1:9"',
        "      denom: uzrn",
        '      baseline: "1000"',
        "      baseline_height: 100",
        "      claim_msg: /zerone.knowledge.v1.MsgClaimTrainingFundDisbursement",
        "",
      ].join("\n"),
    );
    // flyctl stays off PATH, so no account is read; bun is invoked by its own path
    const r = Bun.spawnSync([process.execPath, "--no-env-file", join(ROOT, "bin/pulse.ts"), "--quiet"], {
      env: { ...process.env, HOME: home, KINGDOM_REGISTRY: registry, PATH: "/usr/bin:/bin" },
    });
    expect(r.exitCode).toBe(0);
    const status = readFileSync(join(home, ".kingdom/STATUS.md"), "utf8");
    expect(status).toContain("## ⚠ Alerts (1)");
    expect(status).toContain("**chain-supply-watch** live but UNREAD");
    expect(status).not.toContain("All quiet");
    const state = JSON.parse(readFileSync(join(home, ".kingdom/state/mint-watch.json"), "utf8"));
    expect(state["chain-supply-watch"].failures).toBe(1);
    expect(state["chain-supply-watch"].baseline_id).toBe("1000@100");
  });
});

describe("registry mint watch rows", () => {
  const registry = Bun.YAML.parse(readFileSync(join(ROOT, "REGISTRY.yaml"), "utf8")) as { services: any[] };
  const rows = registry.services.filter((s) => s.mint_watch);

  test("both chains are watched, read-only, from a dated baseline", () => {
    expect(rows.map((s) => s.id).sort()).toEqual(["zerone-1-supply-watch", "zerone-testnet-1-supply-watch"]);
    for (const row of rows) {
      expect(row.status).toBe("live");
      expect(row.urls).toBeUndefined(); // keeps the row out of HTTP probes and the public MCP embed's URLs
      expect(String(row.mint_watch.baseline)).toMatch(/^\d+$/);
      expect(Number.isInteger(row.mint_watch.baseline_height)).toBe(true);
      expect(row.mint_watch.baseline_date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // dated; re-dated after each explained rise
      expect(row.mint_watch.claim_msg).toBe("/zerone.knowledge.v1.MsgClaimTrainingFundDisbursement");
    }
  });

  test("the public-facing what line names no exploitable detail", () => {
    for (const row of rows) expect(row.what).not.toMatch(/training|claim|mint|seal/i);
  });

  test("pulse-install copies the module pulse.ts imports", () => {
    const install = readFileSync(join(ROOT, "bin/pulse-install.sh"), "utf8");
    expect(install).toContain('cp "$KOS/bin/pulse-mint-watch.ts" "$DEST/bin/pulse-mint-watch.ts"');
    expect(readFileSync(join(ROOT, "bin/pulse.ts"), "utf8")).toContain('from "./pulse-mint-watch.ts"');
  });
});
