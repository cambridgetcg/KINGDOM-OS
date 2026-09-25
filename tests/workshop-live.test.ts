import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { handlePowerAtlasRequest, isPowerAtlasPath } from "../pages-functions/power-atlas.js";
import { POWER_ATLAS_ROUTES } from "../pages-functions/power-atlas.js";
import { HUB_ASSETS } from "../bin/stage-hub.ts";
import {
  assertWorkshopResponse,
  checkHubLive,
  DIRECT_HUB_ASSETS,
  publicationFamilyStates,
} from "../bin/check-hub-live.ts";

const contracts = [
  { path: "/workshop/", contentType: "text/html; charset=utf-8" },
  { path: "/workshop/workshop.css", contentType: "text/css; charset=utf-8" },
  { path: "/workshop/workshop.js", contentType: "text/javascript; charset=utf-8" },
] as const;
type Contract = typeof contracts[number];
type Method = "GET" | "HEAD";
const retiredPaths = new Set(
  [...publicationFamilyStates(new Set(HUB_ASSETS.map(({ destination }) => destination))).values()]
    .filter(({ active }) => !active)
    .flatMap(({ family }) => family.routes),
);

function headersFor(contract: Contract): Headers {
  const html = contract.path === "/workshop/";
  return new Headers({
    "content-type": contract.contentType,
    "cache-control": "no-store, no-transform",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "permissions-policy": "accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
    "content-security-policy": "default-src 'none'; base-uri 'none'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; " +
      (html ? "script-src 'self'; style-src 'self'" : "script-src 'none'; style-src 'none'"),
  });
}

async function assertResponse(contract: Contract, method: Method, response: Response): Promise<void> {
  assertWorkshopResponse({
    path: contract.path, method, response,
    body: new Uint8Array(await response.arrayBuffer()),
  });
}

// Stop at the existing missing-route boundary, after the real direct-asset loop,
// Workshop headers, Power Atlas edges, and canonical retired-route responses.
async function runAssetGate(options: {
  path?: string;
  method?: Method;
  cache?: string;
  expectedError?: string;
} = {}): Promise<{ path: string; method: string }[]> {
  const originalFetch = globalThis.fetch;
  const calls: { path: string; method: string }[] = [];
  const assets = new Map(DIRECT_HUB_ASSETS.map((asset) => [
    asset.destination === "index.html" ? "/" :
      `/${asset.destination.replace(/\/index\.html$/, "/")}`,
    asset,
  ]));
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const target = new URL(input instanceof Request ? input.url : input);
    expect(target.origin).toBe("https://thekingdom.dev");
    expect(target.searchParams.has("verify")).toBe(true);
    if (isPowerAtlasPath(target.pathname)) {
      const media = POWER_ATLAS_ROUTES.find(({ path }) => path === target.pathname)?.mediaType;
      const asset = assets.get(target.pathname);
      if (asset && (!init?.method || ["GET", "HEAD"].includes(init.method))) calls.push({ path: target.pathname, method: init?.method ?? "GET" });
      return handlePowerAtlasRequest(new Request(target, init), { ASSETS: { fetch: async () => new Response(
        init?.method === "HEAD" ? null : readFileSync(new URL(`../${asset!.source}`, import.meta.url)),
        { headers: { "content-type": media! } },
      ) } });
    }
    expect(init?.redirect).toBe("error");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    if (target.pathname.startsWith("/no-such-path-")) {
      throw new Error("Workshop fixture stopped after asset gate");
    }
    const path = target.pathname;
    const method = init?.method ?? "GET";
    if (retiredPaths.has(path)) {
      expect(["GET", "HEAD"]).toContain(method);
      calls.push({ path, method });
      return new Response(method === "HEAD" ? null :
        readFileSync(new URL("../pages-content/404.html", import.meta.url)), { status: 404 });
    }
    const asset = assets.get(path);
    if (!asset) throw new Error(`unexpected fixture route ${path}`);
    const contract = contracts.find((candidate) => candidate.path === path);
    expect(method === "GET" || (method === "HEAD" && contract !== undefined)).toBe(true);
    calls.push({ path, method });
    const headers = contract ? headersFor(contract) : new Headers();
    if (path === options.path && method === options.method) {
      headers.set("cache-control", options.cache!);
    }
    const body = method === "HEAD" ? null : readFileSync(new URL(`../${asset.source}`, import.meta.url));
    return new Response(body, { headers });
  }) as typeof fetch;
  try {
    await expect(checkHubLive("https://thekingdom.dev", { checkedOn: "2026-09-25" }))
      .rejects.toThrow(options.expectedError ?? "Workshop fixture stopped after asset gate");
  } finally {
    globalThis.fetch = originalFetch;
  }
  return calls;
}

describe("Workshop strict live contract", () => {
  for (const contract of contracts) {
    for (const method of ["GET", "HEAD"] as const) {
      test(`${method} ${contract.path} accepts only the exact success and privacy headers`, async () => {
        const body = method === "GET" ? "already byte-checked by the asset gate" : null;
        await expect(assertResponse(contract, method, new Response(body, {
          headers: headersFor(contract),
        }))).resolves.toBeUndefined();

        for (const status of [201, 204, 206, 304, 308, 404, 503]) {
          await expect(assertResponse(contract, method, new Response(null, {
            status, headers: headersFor(contract),
          }))).rejects.toThrow(`${method} ${contract.path} lost the exact Workshop contract`);
        }

        const invalidHeaders: [string, string | null][] = [
          ["content-type", null],
          ["content-type", contract.contentType.split(";")[0]!],
          ["content-type", "application/octet-stream"],
          ["content-type", "application/javascript; charset=utf-8"],
          ["content-type", contract.contentType.replace("utf-8", "utf-16")],
          ["cache-control", null],
          ["cache-control", "max-age=14400, no-transform"],
          ["cache-control", "no-cache, no-transform"],
          ["cache-control", "no-store"],
          ["cache-control", "no-transform, no-store"],
          ["cache-control", "no-store, no-transform, max-age=14400"],
          ["cache-control", "no-store, no-transform, immutable"],
          ["cache-control", "no-store, no-transform, no-store"],
          ["referrer-policy", null],
          ["referrer-policy", "unsafe-url"],
          ["x-content-type-options", null],
          ["x-content-type-options", ""],
          ["x-frame-options", null],
          ["x-frame-options", "SAMEORIGIN"],
          ["content-security-policy", null],
          ["content-security-policy", headersFor(contract).get("content-security-policy")!
            .replace("connect-src 'none'", "connect-src 'self'")],
          ["permissions-policy", null],
          ["permissions-policy", headersFor(contract).get("permissions-policy")!
            .replace("camera=()", "camera=(self)")],
          ["set-cookie", "fixture=only; Secure; HttpOnly"],
          ["set-cookie", ""],
        ];
        for (const [name, value] of invalidHeaders) {
          const headers = headersFor(contract);
          if (value === null) headers.delete(name);
          else headers.set(name, value);
          await expect(assertResponse(contract, method, new Response(body, { headers })))
            .rejects.toThrow(`${method} ${contract.path} lost the exact Workshop contract`);
        }
      });

      test(`main rejects ${method} ${contract.path} cache drift despite correct GET bytes`, async () => {
        await runAssetGate({
          path: contract.path, method, cache: "max-age=14400, no-transform",
          expectedError: `${method} ${contract.path} lost the exact Workshop contract`,
        });
      });
    }

    test(`HEAD ${contract.path} rejects a nonempty body`, async () => {
      await expect(assertResponse(contract, "HEAD", new Response("not bodyless", {
        headers: headersFor(contract),
      }))).rejects.toThrow(`HEAD ${contract.path} lost the exact Workshop contract`);
    });
  }

  test("main reuses every active GET and checks Workshop, Power Atlas, and retired route methods", async () => {
    const calls = await runAssetGate();
    const activeCalls = calls.filter(({ path }) => !retiredPaths.has(path));
    expect(activeCalls.filter(({ method }) => method === "GET")).toHaveLength(DIRECT_HUB_ASSETS.length);
    expect(new Set(activeCalls.filter(({ method }) => method === "GET").map(({ path }) => path)).size)
      .toBe(DIRECT_HUB_ASSETS.length);
    expect(activeCalls.filter(({ method }) => method === "HEAD").map(({ path }) => path))
      .toEqual([...contracts.map(({ path }) => path), ...POWER_ATLAS_ROUTES.map(({ path }) => path)]);
    expect(activeCalls).toHaveLength(DIRECT_HUB_ASSETS.length + 3 + 52);
    expect(retiredPaths.size).toBe(10);
    expect(calls).toHaveLength(activeCalls.length + 2 * retiredPaths.size);
    for (const path of [...contracts.map(({ path }) => path), ...retiredPaths]) {
      expect(calls.filter((call) => call.path === path)).toEqual([
        { path, method: "GET" }, { path, method: "HEAD" },
      ]);
    }
  });
});
