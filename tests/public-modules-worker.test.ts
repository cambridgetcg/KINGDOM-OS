import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub";
import worker from "../pages-functions/_worker.js";

// Route tests use synthetic bodies, independently of the catalogue builder.
const body = '{"fixture":"public module directory","modules":[]}\n';
const etag = '"synthetic-modules"';
const modified = "Sun, 27 Sep 2026 00:00:00 GMT";
const environment = (fetch: (request: Request) => Response | Promise<Response>) => ({ ASSETS: { fetch } });
const json = () => new Response(body, { headers: {
  "content-type": "application/json", etag, "last-modified": modified,
  "set-cookie": "unwanted=1", link: '</upstream>; rel="alternate"',
} });

describe("public module directory", () => {
  test("stages exactly one mutable modules.json without an immutable publication", () => {
    expect(HUB_ASSETS.filter(({ source, destination }) => source === "site/modules.json" || destination === "modules.json"))
      .toEqual([{ source: "site/modules.json", destination: "modules.json" }]);
    expect(MUTABLE_HUB_DESTINATIONS.filter((destination) => destination === "modules.json")).toEqual(["modules.json"]);
    expect(HUB_ASSETS.length).toBeLessThanOrEqual(256);
    const ledger = JSON.parse(readFileSync(join(import.meta.dir, "../publications/immutable-publications.v1.json"), "utf8"));
    expect(ledger.entries.some((entry: { route: string; source: string; destination: string }) =>
      entry.route === "/modules.json" || entry.source === "site/modules.json" || entry.destination === "modules.json"))
      .toBe(false);
  });

  test.each(["https://thekingdom.dev", "https://www.thekingdom.dev", "https://thekingdom.pages.dev", "https://preview.thekingdom.pages.dev"])
    ("GET serves exact module bytes on %s through a validator-only asset request", async (origin) => {
      const requests: Request[] = [];
      const validators = { "if-none-match": '"previous"', "if-modified-since": modified };
      const response = await worker.fetch(new Request(`${origin}/modules.json?agent&json&private=do-not-forward`, { headers: {
        ...validators, cookie: "private=secret", authorization: "Bearer do-not-forward", accept: "text/html", range: "bytes=0-10",
      } }), environment((request) => { requests.push(request); return json(); }));
      expect(response.status).toBe(200);
      expect(await response.text()).toBe(body);
      expect(requests).toHaveLength(1);
      expect(requests[0]!.url).toBe(`${origin}/modules.json`);
      expect(requests[0]!.method).toBe("GET");
      expect(Object.fromEntries(requests[0]!.headers)).toEqual(validators);
      expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
      expect(response.headers.get("etag")).toBe(etag);
      expect(response.headers.get("last-modified")).toBe(modified);
      expect(response.headers.get("set-cookie")).toBeNull();
      const link = response.headers.get("link")!;
      expect(link).toContain('</#civic-modules>; rel="alternate"; type="text/html"');
      expect(link.match(/rel="alternate"/g)).toHaveLength(1);
      expect(link).toContain('</.well-known/agent.json>; rel="service-desc"');
      expect(link).toContain('</rights.json>; rel="service-meta"');
      expect(link).toContain('</RIGHTS.md>; rel="service-doc"');
      expect(link).not.toContain("/upstream");
    });

  test.each([
    [200, "text/html", 503],
    [200, "text/plain", 503],
    [200, "application/schema+json", 503],
    [200, "", 503],
    [206, "application/json", 503],
    [302, "application/json", 503],
    [304, "text/html", 503],
    [404, "text/html", 404],
    [404, "application/json", 404],
    [500, "application/json", 503],
  ] as const)("upstream %i with MIME %s fails with a module-specific error", async (status, media, expectedStatus) => {
    const response = await worker.fetch(new Request("https://thekingdom.dev/modules.json"), environment(() => {
      const asset = new Response(status === 304 ? null : "untrusted asset", { status, headers: {
        "content-type": media, etag, "set-cookie": "unwanted=1", location: "/",
      } });
      if (!media) asset.headers.delete("content-type");
      return asset;
    }));
    expect(response.status).toBe(expectedStatus);
    expect(await response.json()).toEqual({ error: "public_modules_unavailable" });
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("etag")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("link")).toContain('</#civic-modules>; rel="alternate"');
  });

  test("transport failure has a module-specific error", async () => {
    const response = await worker.fetch(new Request("https://thekingdom.dev/modules.json"), environment(() => { throw new Error("unavailable"); }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "public_modules_unavailable" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test("HEAD keeps module metadata but returns no body", async () => {
    const requests: Request[] = [];
    const response = await worker.fetch(new Request("https://thekingdom.dev/modules.json?private=secret", {
      method: "HEAD", headers: { cookie: "private=secret" },
    }), environment((request) => { requests.push(request); return json(); }));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
    expect(requests).toHaveLength(1);
    expect(requests[0]!.method).toBe("HEAD");
    expect(requests[0]!.url).toBe("https://thekingdom.dev/modules.json");
    expect([...requests[0]!.headers]).toEqual([]);
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");
    expect(response.headers.get("etag")).toBe(etag);
    expect(response.headers.get("last-modified")).toBe(modified);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("link")).toContain('</#civic-modules>; rel="alternate"');
  });

  test.each(["GET", "HEAD"])("%s delegates conditional validators and preserves bodyless 304 metadata", async (method) => {
    for (const media of [undefined, "application/json", "Application/JSON; charset=utf-8"]) {
      const requests: Request[] = [];
      const validators = { "if-none-match": etag, "if-modified-since": modified };
      const response = await worker.fetch(new Request("https://thekingdom.dev/modules.json?private=secret", {
        method, headers: { ...validators, cookie: "private=secret", "if-match": '"not-forwarded"' },
      }), environment((request) => {
        requests.push(request);
        return new Response(null, { status: 304, headers: {
          ...(media ? { "content-type": media } : {}), etag, "last-modified": modified, "set-cookie": "unwanted=1",
        } });
      }));
      expect(response.status).toBe(304);
      expect(await response.text()).toBe("");
      expect(requests).toHaveLength(1);
      expect(requests[0]!.url).toBe("https://thekingdom.dev/modules.json");
      expect(requests[0]!.method).toBe(method);
      expect(Object.fromEntries(requests[0]!.headers)).toEqual(validators);
      expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(response.headers.get("etag")).toBe(etag);
      expect(response.headers.get("last-modified")).toBe(modified);
      expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(response.headers.get("link")).toContain('</#civic-modules>; rel="alternate"');
    }
  });

  test.each(["POST", "PUT", "PATCH", "DELETE", "OPTIONS", "REPORT"])("%s rejects without reading the body or any asset", async (method) => {
    let calls = 0;
    const request = new Request("https://thekingdom.dev/modules.json", { method, body: "must-not-read" });
    const response = await worker.fetch(request, environment(() => { calls++; return json(); }));
    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({ error: "method_not_allowed" });
    expect(calls).toBe(0);
    expect(request.bodyUsed).toBe(false);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("link")).toContain('</#civic-modules>; rel="alternate"');
  });

  test("HEAD failures stay bodyless, including a missing asset binding", async () => {
    for (const [env, status] of [
      [environment(() => new Response("<html>fallback</html>", { headers: { "content-type": "text/html" } })), 503],
      [environment(() => new Response("missing", { status: 404 })), 404],
      [environment(() => new Response(null, { status: 304, headers: { "content-type": "text/html" } })), 503],
      [environment(() => { throw new Error("unavailable"); }), 503],
      [{}, 503],
    ] as const) {
      const response = await worker.fetch(new Request("https://thekingdom.dev/modules.json", { method: "HEAD" }), env);
      expect(response.status).toBe(status);
      expect(await response.text()).toBe("");
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(response.headers.get("link")).toContain('</#civic-modules>; rel="alternate"');
    }
  });

  test("a rejected asset stream is cancelled rather than served", async () => {
    let cancelled = false;
    const stream = new ReadableStream({ cancel() { cancelled = true; } });
    const response = await worker.fetch(new Request("https://thekingdom.dev/modules.json"), environment(() =>
      new Response(stream, { headers: { "content-type": "text/html" } })));
    expect(response.status).toBe(503);
    expect(cancelled).toBe(true);
    expect(await response.json()).toEqual({ error: "public_modules_unavailable" });
  });

  test.each(["http://localhost:8788", "http://127.0.0.1:8788", "http://[::1]:8788"])
    ("%s only enables hub module dispatch with explicit local activation", async (origin) => {
      const env = environment(() => new Response("local asset"));
      const inactive = await worker.fetch(new Request(`${origin}/modules.json`), env);
      expect(await inactive.text()).toBe("local asset");
      expect(inactive.headers.get("link") ?? "").not.toContain("/#civic-modules");
      const active = await worker.fetch(new Request(`${origin}/modules.json`), { ...environment(() => json()), CIVIC_LOCAL: "true" });
      expect(active.status).toBe(200);
      expect(await active.text()).toBe(body);
      expect(active.headers.get("link")).toContain('</#civic-modules>; rel="alternate"');
    });

  test.each(["https://we-are.ai-love.cc", "https://thekingdom.dev.example.test", "https://thekingdom.pages.dev.example.test", "https://other.pages.dev"])
    ("shared doors and unrelated hosts remain untouched on %s", async (origin) => {
      const requests: Request[] = [];
      const url = `${origin}/modules.json?door=value`;
      const response = await worker.fetch(new Request(url, { headers: { cookie: "door=value" } }), {
        ...environment((request) => { requests.push(request); return new Response("door asset"); }), CIVIC_LOCAL: "true",
      });
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("door asset");
      expect(requests).toHaveLength(1);
      expect(requests[0]!.url).toBe(url);
      expect(requests[0]!.headers.get("cookie")).toBe("door=value");
      expect(response.headers.get("link") ?? "").not.toContain("/#civic-modules");
    });

  test.each(["/modules", "/modules.json/", "/Modules.json", "/modules.json.extra", "/modules.json/index.html", "/agents/"])
    ("does not invent an alias at %s", async (path) => {
      const response = await worker.fetch(new Request(`https://thekingdom.dev${path}`), environment(() => new Response("unrelated asset")));
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("unrelated asset");
      expect(response.headers.get("link") ?? "").not.toContain("/#civic-modules");
    });
});
