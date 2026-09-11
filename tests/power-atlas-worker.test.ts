import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createKingdomWorker } from "../pages-functions/_worker.js";
import { POWER_ATLAS_ROUTES, POWER_ATLAS_ALIASES, isPowerAtlasPath } from "../pages-functions/power-atlas.js";

const root = join(import.meta.dir, "..");
const worker = createKingdomWorker({ fetchImpl: () => { throw new Error("network forbidden"); } });
function security(res: Response) {
  expect(res.headers.get("cache-control")).toBe("no-store, no-transform");
  expect(res.headers.get("referrer-policy")).toBe("no-referrer");
  expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  expect(res.headers.get("x-frame-options")).toBe("DENY");
  expect(res.headers.has("set-cookie")).toBe(false);
  expect(res.headers.get("content-security-policy")).toBe("default-src 'none'; base-uri 'none'; object-src 'none'; form-action 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self'");
  expect(res.headers.get("permissions-policy")).toContain("camera=()");
}
function request(path: string, method = "GET", asset?: () => Response | Promise<Response>, origin = "https://thekingdom.dev", local = false) {
  let calls = 0;
  const result = worker.fetch(new Request(`${origin}${path}`, { method, headers: { accept: "application/json" } }), {
    CIVIC_LOCAL: local ? "true" : "false",
    ASSETS: { fetch: async () => { calls++; return asset ? asset() : new Response("asset fallback", { status: 418 }); } },
  });
  return { result, calls: () => calls };
}

describe("Power Atlas exact Worker dispatch", () => {
  test.each(POWER_ATLAS_ROUTES)("GET and HEAD $path retain exact bytes/MIME", async ({ path, mediaType }) => {
    const relative = path === "/power-atlas/" ? "power-atlas/index.html" : path.slice(1);
    const bytes = readFileSync(join(root, "pages-content", relative));
    for (const method of ["GET", "HEAD"]) {
      const call = request(path + "?agent", method, () => new Response(method === "HEAD" ? null : bytes, { headers: { "content-type": mediaType, "set-cookie": "discard=1", "cache-control": "public, max-age=999" } }));
      const res = await call.result;
      expect(res.status).toBe(200); security(res);
      expect(res.headers.get("content-type")).toBe(mediaType);
      expect(Buffer.from(await res.arrayBuffer())).toEqual(method === "HEAD" ? Buffer.alloc(0) : bytes);
      expect(call.calls()).toBe(1);
    }
  });
  test.each(POWER_ATLAS_ALIASES)("canonical alias %s is 308 without a fragment", async (path) => {
    for (const method of ["GET", "HEAD"]) {
      const call = request(`${path}?json#mode=table`, method);
      const res = await call.result;
      expect(res.status).toBe(308); expect(res.headers.get("location")).toBe("/power-atlas/");
      security(res); expect(await res.text()).toBe(""); expect(call.calls()).toBe(0);
    }
  });
  test.each(["POST", "PUT", "PATCH", "DELETE", "OPTIONS"])("%s rejects every known path before fetching", async (method) => {
    for (const path of [...POWER_ATLAS_ROUTES.map((r) => r.path), ...POWER_ATLAS_ALIASES]) {
      const call = request(path, method); const res = await call.result;
      expect(res.status).toBe(405); expect(res.headers.get("allow")).toBe("GET, HEAD");
      expect(await res.text()).toBe(""); security(res); expect(call.calls()).toBe(0);
    }
  });
  test.each(["/power-atlas/nope", "/power-atlas/src/App.tsx", "/power-atlas/manifest.json", "/power-atlas/artifact.v1.json", "/power-atlas/.env", "/power-atlas/assets/main.js", "/power-atlas/assets/index.js.map", "/power-atlas/%69ndex.html", "/power-atlas//index.html"])("unknown %s is 404, never SPA fallback", async (path) => {
    for (const method of ["GET", "HEAD", "POST"]) {
      const call = request(path, method); const res = await call.result;
      expect(res.status).toBe(404); expect(await res.text()).toBe(""); security(res); expect(call.calls()).toBe(0);
    }
  });
  test("missing, wrong MIME, upstream redirect and failed fetch cannot return homepage HTML", async () => {
    const css = POWER_ATLAS_ROUTES.find((r) => r.path.endsWith(".css"))!.path;
    for (const [status, mime, expected] of [[200, "text/html", 502], [200, "application/octet-stream", 502], [404, "text/html", 404], [500, "text/html", 503], [302, "text/html", 502], [204, "text/css", 502]] as const) {
      const res = await request(css, "GET", () => new Response(status === 204 ? null : "<html>homepage</html>", { status, headers: { "content-type": mime, location: "/", "set-cookie": "no=1" } })).result;
      expect(res.status).toBe(expected); security(res); expect(await res.text()).toBe(""); expect(res.headers.has("location")).toBe(false);
    }
    const failed = await request(css, "GET", () => { throw new Error("asset failed"); }).result;
    expect(failed.status).toBe(503); expect(await failed.text()).toBe("");
    expect((await request("/power-atlas/", "GET", () => new Response(null, { headers: { "content-type": "text/html" } })).result).status).toBe(502);
  });
  test("304 may omit MIME; wrong MIME still fails; HEAD never carries a body", async () => {
    for (const method of ["GET", "HEAD"]) for (const mime of [null, "text/html", "text/css"]) {
      const res = await request("/power-atlas/", method, () => new Response(null, { status: 304, headers: mime ? { "content-type": mime } : {} })).result;
      expect(res.status).toBe(mime === "text/css" ? 502 : 304); expect(await res.text()).toBe(""); security(res);
    }
  });
  test("only Kingdom hosts and explicit loopback activation dispatch the app", async () => {
    for (const origin of ["https://thekingdom.dev", "https://www.thekingdom.dev", "https://thekingdom.pages.dev", "https://preview.thekingdom.pages.dev", "http://127.0.0.1:1234"]) {
      expect((await request("/power-atlas", "GET", undefined, origin, true).result).status).toBe(308);
    }
    for (const [origin, local] of [["https://we-are.love", false], ["https://chillspace.love", true], ["https://thekingdom.dev.evil.test", true], ["http://localhost:1234", false]] as const) {
      expect((await request("/power-atlas", "GET", undefined, origin, local).result).status).toBe(418);
    }
    expect(isPowerAtlasPath("/power-atlas-other")).toBe(false);
  });
});
