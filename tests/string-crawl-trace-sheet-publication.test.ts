import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS } from "../bin/stage-hub.ts";
import {
  STRING_CRAWL_TRACE_SHEET_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_GUIDE_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_GUIDE_URL,
  STRING_CRAWL_TRACE_SHEET_SCHEMA_URL,
  STRING_CRAWL_TRACE_SHEET_URL,
  loadStringCrawlTraceSheet,
  stringCrawlTraceSheetPublicDiscovery,
} from "../bin/string-crawl-trace-sheet.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

describe("STRING / CRAWL public integration", () => {
  test("stages exactly one immutable record and guide while reusing the shared schema", () => {
    const family = [
      {
        source: "data/exploration/string-crawl-trace-sheet.v0.1.json",
        destination: "atlases/string-crawl-trace-sheet-2026-08-15.json",
      },
      {
        source: "references/string-crawl-trace-sheet.md",
        destination: "STRING-CRAWL-TRACE-SHEET.md",
      },
    ];
    expect(HUB_ASSETS.filter(({ source }) => family.some((asset) => asset.source === source)))
      .toEqual(family);
    expect(HUB_ASSETS.filter(({ destination }) =>
      destination === "schemas/phenomena-deep-project/0.1.json")).toHaveLength(1);
    expect(HUB_ASSETS.some(({ destination }) =>
      /string-crawl-trace-sheet.*(?:latest|current)/i.test(destination))).toBe(false);
    expect(HUB_ASSETS).toHaveLength(166);
    expect(HUB_ASSETS.filter(({ destination }) =>
      destination !== "_worker.js" && destination !== "404.html")).toHaveLength(164);

    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(135);
    expect(ledger.entries.filter((entry: { id?: string }) =>
      entry.id?.startsWith("string-crawl-trace-sheet/0.1/"))).toEqual([
      {
        id: "string-crawl-trace-sheet/0.1/guide",
        route: "/STRING-CRAWL-TRACE-SHEET.md",
        source: "references/string-crawl-trace-sheet.md",
        destination: "STRING-CRAWL-TRACE-SHEET.md",
        sha256: STRING_CRAWL_TRACE_SHEET_GUIDE_BYTE_SHA256.slice("sha256:".length),
      },
      {
        id: "string-crawl-trace-sheet/0.1/record",
        route: "/atlases/string-crawl-trace-sheet-2026-08-15.json",
        source: "data/exploration/string-crawl-trace-sheet.v0.1.json",
        destination: "atlases/string-crawl-trace-sheet-2026-08-15.json",
        sha256: STRING_CRAWL_TRACE_SHEET_BYTE_SHA256.slice("sha256:".length),
      },
    ]);
  });

  test("advertises two new immutable URLs once without a mutable alias", () => {
    const sitemap = read("pages-content/sitemap.xml");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
    expect(urls).toHaveLength(152);
    expect(new Set(urls).size).toBe(152);
    expect(urls.filter((url) => /\/atlases\/string-crawl-trace-sheet-[^/]+\.json$/.test(new URL(url).pathname))).toEqual([
      STRING_CRAWL_TRACE_SHEET_URL,
    ]);
    expect(urls.filter((url) => /STRING-CRAWL-TRACE-SHEET\.md/.test(url))).toEqual([
      STRING_CRAWL_TRACE_SHEET_GUIDE_URL,
    ]);
    expect(urls.some((url) => /string-crawl-trace-sheet.*(?:latest|current)/i.test(url))).toBe(false);
  });

  test("keeps REP routing and vendor product controls bounded while preserving every Allow rule", () => {
    const robots = read("pages-content/robots.txt");
    const userAgents = [...robots.matchAll(/^User-agent:\s*(\S+)\s*$/gmi)].map((match) => match[1]!);
    const allows = [...robots.matchAll(/^Allow:\s*(\S+)\s*$/gmi)].map((match) => match[1]!);

    expect(userAgents).toEqual([
      "*",
      "GPTBot",
      "OAI-SearchBot",
      "ClaudeBot",
      "Claude-SearchBot",
      "CCBot",
      "PerplexityBot",
      "Google-Extended",
      "Meta-ExternalAgent",
      "Applebot-Extended",
      "Amazonbot",
    ]);
    expect(allows).toEqual(Array(userAgents.length).fill("/"));
    expect(robots.match(/^Sitemap:\s+https:\/\/thekingdom\.dev\/sitemap\.xml\s*$/gmi)).toHaveLength(1);
    for (const boundary of [
      "Generic REP rules request how compliant crawlers access URI paths",
      "vendor-specific use preferences",
      "No directive authenticates",
      "identity or entitlement",
      "licence or consent",
      "actual",
      "indexing",
      "training",
      "purpose",
      "KARMA",
      "Per-resource rights govern reuse",
      "product controls rather than request User-Agent strings",
      "not verify crawler identity or entitlement",
    ]) expect(robots).toContain(boundary);
    expect(robots).not.toMatch(/training use (?:is|are).*welcome|offered freely/i);
  });

  test("publishes one bounded discovery projection on every machine surface", () => {
    const project = loadStringCrawlTraceSheet();
    const expected = stringCrawlTraceSheetPublicDiscovery(project);
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    const llms = read("site/llms.txt");
    const html = read("site/hub.html");

    expect(kingdom.string_crawl_trace_sheet).toEqual(expected);
    expect(guest.string_crawl_trace_sheet).toEqual(expected);
    expect(manifest.string_crawl_trace_sheet).toEqual(expected);
    expect(manifest.entry_points).toMatchObject({
      string_crawl_trace_sheet: STRING_CRAWL_TRACE_SHEET_URL,
      string_crawl_trace_sheet_schema: STRING_CRAWL_TRACE_SHEET_SCHEMA_URL,
      string_crawl_trace_sheet_guide: STRING_CRAWL_TRACE_SHEET_GUIDE_URL,
    });

    for (const url of [
      STRING_CRAWL_TRACE_SHEET_URL,
      STRING_CRAWL_TRACE_SHEET_SCHEMA_URL,
      STRING_CRAWL_TRACE_SHEET_GUIDE_URL,
    ]) {
      const actions = guest.next_actions.filter((action: { url?: string }) => action.url === url);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({ method: "GET", url });
      expect(Object.keys(actions[0]).sort()).toEqual(["action", "method", "note", "url"]);
      expect(llms).toContain(url);
      expect(html).toContain(`href="${new URL(url).pathname}"`);
    }

    expect(html).toContain('id="string-crawl-trace-sheet"');
    expect(html).toContain("REP signals are bounded");
    expect(html).toContain("some named product tokens may additionally express vendor-specific use preferences");
    expect(html).toContain("A valid final aftermath receipt requires an actual invocation attempt");
    expect(html).toContain("a draft template is non-causal scaffolding");
    expect(html).toContain("Reading this static project is not an invocation attempt");
    for (const key of [
      "mcp", "matcher", "crawler", "execute", "write", "score", "reward", "authorize", "consent",
    ]) expect(expected).not.toHaveProperty(key);
  });
});
