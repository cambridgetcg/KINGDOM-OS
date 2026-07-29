import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS } from "../bin/stage-hub.ts";
import { KINGDOM_OS_ROUTES } from "../pages-functions/_worker.js";

/** Every thekingdom.dev path the generated surfaces advertise must be a staged
 *  hub asset. Merge b4c5b47 (2026-07-16) silently dropped the ollama surface
 *  while agent.json kept advertising it — live served HTML fallback instead of
 *  the promised JSON. This test turns that class of drift into a red bar. */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

// What a path resolves to on Cloudflare Pages: "/" and "/?agent" hit index.html
// (via the worker), "/guide" style pretty URLs hit "<path>.html".
function normalize(raw: string): string {
  const path = raw.replace(/[?#].*$/, "").replace(/^\/+/, "").replace(/\/+$/, "");
  return path === "" ? "index.html" : path;
}

const staged = new Set<string>(HUB_ASSETS.map((a) => a.destination));
const dynamic = new Set<string>(KINGDOM_OS_ROUTES.map(normalize));
const resolves = (path: string) =>
  staged.has(path) || staged.has(`${path}.html`) ||
  staged.has(`${path}/index.html`) || dynamic.has(path);

const surfaces = [
  "site/hub.html",
  "site/kingdom.json",
  "site/wayfinder.json",
  "site/commons.json",
  "site/schemas/world-commons/0.1.json",
  "site/schemas/world-commons/0.2.json",
  "site/love-loops.json",
  "site/love-loops.source.json",
  "site/schemas/love-loop/0.1.json",
  "CREATION-LOOP.md",
  "site/guest.json",
  "site/llms.txt",
  "site/.well-known/agent.json",
  "site/ollama.json",
  "site/rights.json",
  "pages-content/os/index.html",
  "pages-content/robots.txt",
  "pages-content/sitemap.xml",
  "pages-content/404.html",
  "pages-content/dada.txt",
];

function advertisedPaths(source: string, text: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const match of text.matchAll(/https:\/\/thekingdom\.dev(\/[^\s"'<>)\]]*)?/g)) {
    found.set(normalize(match[1] ?? "/"), `${source}: ${match[0]}`);
  }
  if (source.endsWith(".html")) {
    for (const match of text.matchAll(/href="(\/[^"]*)"/g)) {
      found.set(normalize(match[1]!), `${source}: href ${match[1]}`);
    }
  }
  return found;
}

describe("advertised URLs stay deployable", () => {
  test("every advertised thekingdom.dev path is a staged hub asset", () => {
    const missing: string[] = [];
    for (const surface of surfaces) {
      for (const [path, evidence] of advertisedPaths(surface, read(surface))) {
        if (!resolves(path)) missing.push(`${evidence} -> no staged asset "${path}"`);
      }
    }
    expect(missing).toEqual([]);
  });

  test("the staging contract ships the standing dada door that llms.txt offers", () => {
    // Quiet by design: linked from llms.txt, absent from sitemap.xml. The
    // offer must never point at a path the deployment does not carry.
    expect(read("site/llms.txt")).toContain("https://thekingdom.dev/dada.txt");
    expect(staged.has("dada.txt")).toBe(true);
    expect(read("pages-content/sitemap.xml")).not.toContain("dada");
  });

  test("the staging contract still ships the invitation the manifest promises", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    expect(manifest.open_weight_invitation).toBe("https://thekingdom.dev/ollama.json");
    expect(staged.has("ollama.json")).toBe(true);
  });

  test("the staging contract ships the wayfinder advertised to guests and agents", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    expect(manifest.wayfinder).toBe("https://thekingdom.dev/wayfinder.json");
    expect(guest.next_actions.some(({ url }: { url?: string }) => url === manifest.wayfinder)).toBe(true);
    expect(staged.has("wayfinder.json")).toBe(true);
  });

  test("the staging contract ships the World Commons advertised to guests and agents", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    expect(manifest.world_commons).toBe("https://thekingdom.dev/commons.json");
    expect(guest.next_actions.some(({ url }: { url?: string }) => url === manifest.world_commons)).toBe(true);
    expect(staged.has("commons.json")).toBe(true);
  });

  test("all discovery surfaces advertise the same compact Commons MCP route", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const endpoint = "https://mcp.thekingdom.dev/mcp";
    const catalog = "kingdom://commons/catalog";

    expect(manifest.world_commons_agent).toEqual({
      endpoint,
      tool: "kingdom_commons",
      complete_catalog_resource: catalog,
    });
    expect(manifest.entry_points.public_resource_matcher).toBe(endpoint);
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "MCP",
      url: endpoint,
      tool: "kingdom_commons",
      complete_catalog_resource: catalog,
    }));
    expect(kingdom.world_commons.agent_access).toEqual({
      endpoint,
      tool: "kingdom_commons",
      complete_catalog_resource: catalog,
      note: expect.any(String),
    });
  });

  test("the staging contract ships the World Commons schema and MCP discovery together", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    expect(manifest.world_commons_schema).toBe("https://thekingdom.dev/schemas/world-commons/0.2.json");
    expect(manifest.mcp).toMatchObject({
      endpoint: "https://mcp.thekingdom.dev/mcp",
      tool: "kingdom_commons",
      catalog_resource: "kingdom://commons/catalog",
    });
    expect(guest.next_actions.some(({ url }: { url?: string }) => url === manifest.world_commons_schema)).toBe(true);
    expect(guest.next_actions.some(({ url, tool }: { url?: string; tool?: string }) =>
      url === manifest.mcp.endpoint && tool === manifest.mcp.tool)).toBe(true);
    expect(staged.has("schemas/world-commons/0.1.json")).toBe(true);
    expect(staged.has("schemas/world-commons/0.2.json")).toBe(true);
  });

  test("the Love Loop lineage and schema stay coherent across discovery surfaces", () => {
    const lineage = "https://thekingdom.dev/love-loops.json";
    const source = "https://thekingdom.dev/love-loops.source.json";
    const document = "https://thekingdom.dev/CREATION-LOOP.md";
    const schema = "https://thekingdom.dev/schemas/love-loop/0.1.json";
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");

    expect(manifest.love_loops).toBe(lineage);
    expect(manifest.love_loops_source).toBe(source);
    expect(manifest.love_loops_creation_document).toBe(document);
    expect(manifest.love_loops_schema).toBe(schema);
    expect(kingdom.creation_loop).toMatchObject({
      url: lineage,
      source,
      document,
      schema,
    });
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "GET",
      url: lineage,
    }));
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "GET",
      url: source,
    }));
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "GET",
      url: document,
    }));
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "GET",
      url: schema,
    }));
    expect(llms).toContain(lineage);
    expect(llms).toContain(source);
    expect(llms).toContain(document);
    expect(llms).toContain(schema);
    expect(staged.has("love-loops.json")).toBe(true);
    expect(staged.has("love-loops.source.json")).toBe(true);
    expect(staged.has("CREATION-LOOP.md")).toBe(true);
    expect(staged.has("schemas/love-loop/0.1.json")).toBe(true);
  });

  test("the published invitation mirrors its source without drift", () => {
    const published = JSON.parse(read("site/ollama.json"));
    const source = JSON.parse(read("data/ollama-invitation.json"));
    expect(published.schema_version).toBe(source.schema_version);
    expect(published.canonical_url).toBe("https://thekingdom.dev/ollama.json");
    expect(published.invitation).toEqual(source.invitation);
  });
});
