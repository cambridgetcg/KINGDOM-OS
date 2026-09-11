import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { assertPowerAtlasResponse, checkHubLive, checkPowerAtlasEdges, DIRECT_HUB_ASSETS } from "../bin/check-hub-live.ts";
import { handlePowerAtlasRequest, POWER_ATLAS_ROUTES, POWER_ATLAS_CSP, POWER_ATLAS_PERMISSIONS } from "../pages-functions/power-atlas.js";

function headers(mediaType?: string) {
  return new Headers({ ...(mediaType ? { "content-type": mediaType } : {}),
    "cache-control": "no-store, no-transform", "content-security-policy": POWER_ATLAS_CSP,
    "permissions-policy": POWER_ATLAS_PERMISSIONS, "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff", "x-frame-options": "DENY" });
}
const assert = (path: string, method: string, response: Response, body = new Uint8Array()) =>
  assertPowerAtlasResponse({ path, method, response, body });

describe("Power Atlas exact live contract (fake fetch only)", () => {
  test.each(POWER_ATLAS_ROUTES)("GET/HEAD $path enforce exact MIME/privacy/cache", ({ path, mediaType }) => {
    for (const method of ["GET", "HEAD"]) {
      assert(path, method, new Response(null, { headers: headers(mediaType) }));
      for (const [key, value] of [
        ["content-type", "text/html"], ["cache-control", "no-cache, no-transform"],
        ["cache-control", "no-store"], ["cache-control", "no-transform, no-store"],
        ["content-security-policy", POWER_ATLAS_CSP + "; script-src 'unsafe-inline'"],
        ["permissions-policy", "camera=(self)"], ["referrer-policy", "unsafe-url"],
        ["x-content-type-options", ""], ["x-frame-options", "SAMEORIGIN"], ["set-cookie", ""],
      ]) {
        const invalid = headers(mediaType); invalid.set(key!, value!);
        expect(() => assert(path, method, new Response(null, { headers: invalid }))).toThrow("Power Atlas contract");
      }
      for (const key of [...headers(mediaType).keys()]) {
        const invalid = headers(mediaType); invalid.delete(key);
        expect(() => assert(path, method, new Response(null, { headers: invalid }))).toThrow("Power Atlas contract");
      }
      for (const status of [201, 204, 206, 304, 308, 404, 503])
        expect(() => assert(path, method, new Response(null, { status, headers: headers(mediaType) }))).toThrow("Power Atlas contract");
    }
    expect(() => assert(path, "HEAD", new Response(null, { headers: headers(mediaType) }), new Uint8Array([1]))).toThrow("Power Atlas contract");
  });

  test("edge probes exercise both aliases, private misses and all known mutation refusals", async () => {
    const calls: string[] = [];
    await checkPowerAtlasEdges((async (input, init) => {
      const req = new Request(input, init); calls.push(`${req.method} ${new URL(req.url).pathname}`);
      expect(init?.redirect).toBe("manual"); expect(init?.signal).toBeInstanceOf(AbortSignal);
      expect(req.body).toBeNull();
      return handlePowerAtlasRequest(req, { ASSETS: { fetch: () => { throw new Error("must not fetch"); } } });
    }) as typeof fetch);
    expect(calls).toHaveLength(284);
    expect(new Set(calls).size).toBe(284);
    for (const [path, method, status, extra] of [
      ["/power-atlas", "GET", 308, { location: "/power-atlas/#lost" }],
      ["/power-atlas/", "POST", 405, { allow: "GET" }],
      ["/power-atlas/nope", "GET", 200, {}],
    ] as const) {
      const h = headers(); for (const [k, v] of Object.entries(extra)) h.set(k, v);
      expect(() => assert(path, method, new Response(null, { status, headers: h }))).toThrow("Power Atlas contract");
    }
  });

  test("main rejects Power Atlas HEAD drift after byte-correct GETs", async () => {
    const original = globalThis.fetch;
    const seen: string[] = [];
    const assets = new Map(DIRECT_HUB_ASSETS.map((asset) => [asset.destination === "index.html" ? "/" : `/${asset.destination.replace(/\/index\.html$/, "/")}`, asset]));
    globalThis.fetch = (async (input, init) => {
      const req = new Request(input, init), path = new URL(req.url).pathname;
      seen.push(`${req.method} ${path}`);
      const asset = assets.get(path); if (!asset) throw new Error(`unexpected ${path}`);
      const power = POWER_ATLAS_ROUTES.find((a) => a.path === path);
      let h = power ? headers(power.mediaType) : new Headers();
      if (path.startsWith("/workshop/")) {
        const html = path === "/workshop/";
        h = new Headers({ "content-type": html ? "text/html; charset=utf-8" : path.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8",
          "cache-control": "no-store, no-transform", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff", "x-frame-options": "DENY", "permissions-policy": POWER_ATLAS_PERMISSIONS,
          "content-security-policy": "default-src 'none'; base-uri 'none'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; " + (html ? "script-src 'self'; style-src 'self'" : "script-src 'none'; style-src 'none'") });
      }
      if (power && req.method === "HEAD") h.set("cache-control", "public, max-age=14400");
      return new Response(req.method === "HEAD" ? null : readFileSync(new URL(`../${asset.source}`, import.meta.url)), { headers: h });
    }) as typeof fetch;
    try {
      await expect(checkHubLive("https://thekingdom.dev", { checkedOn: "2026-09-08" })).rejects.toThrow("lost the exact Power Atlas contract");
      expect(seen.some((call) => call.startsWith("HEAD /power-atlas/"))).toBe(true);
    } finally { globalThis.fetch = original; }
  });
});
