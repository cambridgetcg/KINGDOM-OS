import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AGENT_ENTRY_MAX_BYTES, renderAgentEntry } from "../bin/agent-entry";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub";
import worker from "../pages-functions/_worker.js";

const body = renderAgentEntry();
const document = JSON.parse(body);
const environment = (fetch: (request: Request) => Response | Promise<Response>) => ({ ASSETS: { fetch } });
const json = (text = body) => new Response(text, { headers: { "content-type": "application/json", etag: '"entry"', "set-cookie": "unwanted=1" } });

describe("compact hub entry", () => {
  test("is a bounded public link index with current status delegated to its owner", () => {
    expect(Buffer.byteLength(body)).toBeLessThan(2_000);
    expect(Buffer.byteLength(body)).toBeLessThanOrEqual(AGENT_ENTRY_MAX_BYTES);
    expect(document.protocol).toBe("kingdom.agent-entry/0.1");
    expect(document.read.find((entry: { url: string }) => entry.url.endsWith("/api/civic/status"))).toBeDefined();
    expect(body).not.toMatch(/"(?:available|writable|live|counts|repos|layers|entry_points)"\s*:/);
    expect(document.full_reference.guest).toBe("https://thekingdom.dev/guest.json");
    expect(document.full_reference.manifest).toBe("https://thekingdom.dev/.well-known/agent.json");
  });

  test("every hub link targets an exact staged asset or existing dynamic route", () => {
    const publicPaths = new Set(HUB_ASSETS.map(({ destination }) => `/${destination}`));
    publicPaths.add("/"); publicPaths.add("/kingdom.json"); publicPaths.add("/api/civic/status");
    for (const [, value] of body.matchAll(/"(https:[^"]+)"/g)) {
      const url = new URL(value);
      expect(url.username + url.password + url.search + url.hash).toBe("");
      if (url.hostname === "thekingdom.dev") expect(publicPaths.has(url.pathname)).toBe(true);
      else expect(url.href).toBe("https://mcp.thekingdom.dev/mcp");
    }
    expect(MUTABLE_HUB_DESTINATIONS).toContain("agent-entry.json");
  });

  test("generated compact entry matches its builder", () => {
    const published = readFileSync(join(import.meta.dir, "../site/agent-entry.json"), "utf8");
    expect(published).toBe(body);
  });

  test("adds one public module directory link without replacing existing discovery", () => {
    const moduleLink = { name: "Public module directory", url: "https://thekingdom.dev/modules.json" };
    expect(document.read.filter((entry: { name: string; url: string }) => entry.name === moduleLink.name || entry.url === moduleLink.url))
      .toEqual([moduleLink]);
    expect(document.read.filter((entry: { url: string }) => entry.url !== moduleLink.url)).toEqual([
      { name: "World Commons catalog", url: "https://thekingdom.dev/commons.json" },
      { name: "Public map and measured census", url: "https://thekingdom.dev/kingdom.json" },
      { name: "Wayfinder paths", url: "https://thekingdom.dev/wayfinder.json" },
      { name: "Current Civic availability", url: "https://thekingdom.dev/api/civic/status" },
      { name: "Civic interaction contract", url: "https://thekingdom.dev/CIVIC-v0.1.md" },
      { name: "Rights recognition", url: "https://thekingdom.dev/rights.json" },
    ]);
    expect(document.full_reference).toEqual({
      guest: "https://thekingdom.dev/guest.json",
      manifest: "https://thekingdom.dev/.well-known/agent.json",
      text_index: "https://thekingdom.dev/llms.txt",
      research_atlas: "https://thekingdom.dev/atlas.html",
    });
    expect(document.mcp).toEqual({
      url: "https://mcp.thekingdom.dev/mcp",
      scope: "Read-only public Kingdom resources; consult the server's tool and resource descriptions.",
    });
  });

  test("human root has a prominent agent door and a separately labelled full reference", async () => {
    const { projectDashboardData, renderDashboardPage } = await import("../bin/build-dashboard");
    const html = renderDashboardPage("explore", projectDashboardData({}));
    expect(html).toContain('<link rel="alternate" type="application/json" href="/agent-entry.json" title="Compact agent entry">');
    const doors = html.match(/<nav class="service-line" aria-label="Human and agent entries">([\s\S]*?)<\/nav>/)?.[1];
    expect(doors).toContain("Human page");
    expect(doors).toContain('href="/agent-entry.json"');
    expect(doors).toContain('href="/guest.json"');
    expect(doors).toContain("Full agent reference");
    expect(html.indexOf('aria-label="Human and agent entries"')).toBeLessThan(html.indexOf('class="hall-intro"'));
    expect(renderDashboardPage("meet", projectDashboardData({}))).not.toContain('title="Compact agent entry"');
  });

  test("full references advertise the compact entry without replacing their compatibility views", () => {
    for (const path of ["site/guest.json", "site/.well-known/agent.json"]) {
      const full = JSON.parse(readFileSync(join(import.meta.dir, "..", path), "utf8"));
      expect(full.compact_entry).toBe(document.canonical_url);
      if (full.agent_view) expect(full.agent_view).toBe("https://thekingdom.dev/?agent");
    }
    const text = readFileSync(join(import.meta.dir, "../site/llms.txt"), "utf8");
    expect(text.slice(0, 350)).toContain(document.canonical_url);
    expect(text.slice(0, 350)).toContain("full references");
  });

  test.each(["https://thekingdom.dev", "https://preview.thekingdom.pages.dev"])("GET serves exact JSON bytes on %s without query or cookies", async (origin) => {
    let requested: Request | undefined;
    const response = await worker.fetch(new Request(`${origin}/agent-entry.json?private=do-not-forward`, { headers: { cookie: "private=secret", "if-none-match": '"previous"' } }), environment((request) => { requested = request; return json(); }));
    expect(response.status).toBe(200); expect(await response.text()).toBe(body);
    expect(new URL(requested!.url).search).toBe("");
    expect(requested!.headers.get("cookie")).toBeNull();
    expect(requested!.headers.get("if-none-match")).toBe('"previous"');
    expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("etag")).toBe('"entry"');
    expect(response.headers.get("link")).toContain('</>; rel="alternate"; type="text/html"');
    expect(response.headers.get("link")).toContain('</.well-known/agent.json>; rel="service-desc"');
  });

  test("HEAD and conditional responses are bodyless", async () => {
    const response = await worker.fetch(new Request("https://thekingdom.dev/agent-entry.json", { method: "HEAD" }), environment(() => json()));
    expect(response.status).toBe(200); expect(await response.text()).toBe("");
    const unchanged = await worker.fetch(new Request("https://thekingdom.dev/agent-entry.json"), environment(() => new Response(null, { status: 304, headers: { etag: '"entry"' } })));
    expect(unchanged.status).toBe(304); expect(await unchanged.text()).toBe("");
    expect(unchanged.headers.get("etag")).toBe('"entry"');
  });

  test.each(["POST", "PUT", "DELETE"])("%s rejects before reading any asset", async (method) => {
    let called = false;
    const response = await worker.fetch(new Request("https://thekingdom.dev/agent-entry.json", { method }), environment(() => { called = true; return json(); }));
    expect(response.status).toBe(405); expect(called).toBe(false);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test.each([200, 302, 404, 500])("asset failure or HTML fallback (%s) cannot masquerade as the JSON index", async (status) => {
    const response = await worker.fetch(new Request("https://thekingdom.dev/agent-entry.json"), environment(() => new Response("<html>fallback</html>", { status, headers: { "content-type": "text/html" } })));
    expect(response.status).toBe(status === 404 ? 404 : 503);
    expect(await response.json()).toEqual({ error: "agent_entry_unavailable" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test("asset transport errors fail explicitly", async () => {
    const response = await worker.fetch(new Request("https://thekingdom.dev/agent-entry.json"), environment(() => { throw new Error("unavailable"); }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "agent_entry_unavailable" });
  });

  test("root advertises the compact alternate; legacy negotiation still returns the full guest", async () => {
    const response = await worker.fetch(new Request("https://thekingdom.dev/"), environment(() => new Response("human", { headers: { "content-type": "text/html" } })));
    expect(response.headers.get("link")).toContain('</agent-entry.json>; rel="alternate"');
    const legacy = await worker.fetch(new Request("https://thekingdom.dev/?agent"), environment((request) => {
      expect(new URL(request.url).pathname).toBe("/guest.json"); return json('{"legacy":"full guest"}');
    }));
    expect(await legacy.json()).toEqual({ legacy: "full guest" });
  });

  test("the shared door worker neither claims nor intercepts hub-only discovery", async () => {
    const response = await worker.fetch(new Request("https://we-are.ai-love.cc/agent-entry.json"), environment(() => new Response("door asset")));
    expect(await response.text()).toBe("door asset");
    expect(response.headers.get("link") ?? "").not.toContain("agent-entry.json");
    const root = await worker.fetch(new Request("https://we-are.ai-love.cc/"), environment(() => new Response("door", { headers: { "content-type": "text/html" } })));
    expect(root.headers.get("link") ?? "").not.toContain("agent-entry.json");
  });
});
