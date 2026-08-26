import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import {
  STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_URL,
  loadStringCrawlTraceSheetLab,
  stringCrawlTraceSheetLabPublicDiscovery,
} from "../bin/string-crawl-trace-sheet-lab.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => `sha256:${createHash("sha256").update(readFileSync(join(ROOT, path))).digest("hex")}`;

const FAMILY = [
  {
    source: "data/exploration/string-crawl-trace-lab.v0.1.json",
    destination: "labs/string-crawl-trace-sheet-lab-2026-08-16.json",
  },
  {
    source: "schemas/string-crawl-trace-sheet-lab-v0.1.schema.json",
    destination: "schemas/string-crawl-trace-sheet-lab/0.1.json",
  },
  {
    source: "references/string-crawl-trace-sheet-lab.md",
    destination: "STRING-CRAWL-TRACE-SHEET-LAB.md",
  },
] as const;

const PUBLIC_URLS = [
  STRING_CRAWL_TRACE_SHEET_LAB_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL,
] as const;

describe("STRING / CRAWL Finite Trace-Sheet Lab public integration", () => {
  test("stages exactly one immutable record, schema, and guide without a mutable alias", () => {
    expect(HUB_ASSETS.filter(({ source }) => FAMILY.some((asset) => asset.source === source)))
      .toEqual(FAMILY);
    expect(HUB_ASSETS.filter(({ destination }) => /string-crawl-trace-sheet-lab/i.test(destination)))
      .toEqual(FAMILY);
    expect(HUB_ASSETS).toHaveLength(166);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(31);
    expect(HUB_ASSETS.filter(({ destination }) =>
      destination !== "_worker.js" && destination !== "404.html")).toHaveLength(164);
    expect(HUB_ASSETS.some(({ destination }) =>
      /string-crawl-trace-sheet-lab.*(?:latest|current)/i.test(destination))).toBe(false);
    expect(MUTABLE_HUB_DESTINATIONS.some((destination) =>
      /string-crawl-trace-sheet-lab/i.test(destination))).toBe(false);
  });

  test("pins all three authored byte identities in the append-only publication ledger", () => {
    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(135);
    expect(ledger.entries.filter((entry: { id?: string }) =>
      entry.id?.startsWith("string-crawl-trace-sheet-lab/0.1/"))).toEqual([
      {
        id: "string-crawl-trace-sheet-lab/0.1/guide",
        route: "/STRING-CRAWL-TRACE-SHEET-LAB.md",
        source: "references/string-crawl-trace-sheet-lab.md",
        destination: "STRING-CRAWL-TRACE-SHEET-LAB.md",
        sha256: STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256.slice("sha256:".length),
      },
      {
        id: "string-crawl-trace-sheet-lab/0.1/record",
        route: "/labs/string-crawl-trace-sheet-lab-2026-08-16.json",
        source: "data/exploration/string-crawl-trace-lab.v0.1.json",
        destination: "labs/string-crawl-trace-sheet-lab-2026-08-16.json",
        sha256: STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256.slice("sha256:".length),
      },
      {
        id: "string-crawl-trace-sheet-lab/0.1/schema",
        route: "/schemas/string-crawl-trace-sheet-lab/0.1.json",
        source: "schemas/string-crawl-trace-sheet-lab-v0.1.schema.json",
        destination: "schemas/string-crawl-trace-sheet-lab/0.1.json",
        sha256: STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256.slice("sha256:".length),
      },
    ]);
    expect(sha256(FAMILY[0].source)).toBe(STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256);
    expect(sha256(FAMILY[1].source)).toBe(STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256);
    expect(sha256(FAMILY[2].source)).toBe(STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256);
  });

  test("advertises the immutable triplet once and never advertises latest or current", () => {
    const sitemap = read("pages-content/sitemap.xml");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
    expect(urls).toHaveLength(152);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.filter((url) => /string-crawl-trace-sheet-lab/i.test(url))).toEqual(PUBLIC_URLS);
    for (const url of PUBLIC_URLS) expect(urls.filter((candidate) => candidate === url)).toHaveLength(1);
    expect(urls.some((url) => /string-crawl-trace-sheet-lab.*(?:latest|current)/i.test(url))).toBe(false);
  });

  test("publishes one bounded discovery projection on every public machine surface", () => {
    const lab = loadStringCrawlTraceSheetLab();
    const expected = stringCrawlTraceSheetLabPublicDiscovery(lab);
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    const llms = read("site/llms.txt");
    const html = read("site/hub.html");

    expect(kingdom.string_crawl_trace_sheet_lab).toEqual(expected);
    expect(guest.string_crawl_trace_sheet_lab).toEqual(expected);
    expect(manifest.string_crawl_trace_sheet_lab).toEqual(expected);
    expect(manifest.entry_points).toMatchObject({
      string_crawl_trace_sheet_lab: STRING_CRAWL_TRACE_SHEET_LAB_URL,
      string_crawl_trace_sheet_lab_schema: STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL,
      string_crawl_trace_sheet_lab_guide: STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL,
    });

    const actions = guest.next_actions.filter((action: { url?: string }) =>
      PUBLIC_URLS.includes(action.url as typeof PUBLIC_URLS[number]));
    expect(actions).toHaveLength(PUBLIC_URLS.length);
    for (const url of PUBLIC_URLS) {
      expect(actions.filter((action: { url?: string }) => action.url === url)).toEqual([
        expect.objectContaining({ method: "GET", url }),
      ]);
      expect(llms).toContain(url);
      expect(html).toContain(`href="${new URL(url).pathname}"`);
    }
    expect(actions.every((action: Record<string, unknown>) =>
      Object.keys(action).sort().join(",") === "action,method,note,url")).toBe(true);

    expect(expected.result).toMatchObject({
      classification: "TRIANGULATED_DISK",
      cells: { vertices: 4, edges: 5, faces: 2 },
      betti: [1, 0, 0],
      euler_characteristic: 1,
      boundary_components: 1,
      genus: 0,
      falsifiers_passed: 5,
    });
    expect(expected.verification_scope).toMatchObject({
      exact_synthetic_fixture: true,
      source_truth: false,
      empirical_web_fact: false,
      crawler_safety: false,
      physical_worldsheet: false,
      identity_or_purpose: false,
      karma_or_authority: false,
    });
    expect(Object.values(expected.authority)).toEqual(Array(12).fill(false));
    for (const key of [
      "mcp", "tool", "input", "credential", "crawler", "execute", "write", "score",
      "reward", "authorize", "consent", "telemetry", "registry", "threshold", "canary",
    ]) expect(expected).not.toHaveProperty(key);
  });

  test("keeps the rendered lab static and separates publication from runtime activation", () => {
    const lab = loadStringCrawlTraceSheetLab();
    expect(lab.release).toMatchObject({
      artifact_publication: "PUBLISHED",
      runtime_activation: "INACTIVE",
      crawler_activation: "INACTIVE",
      karma_adapter: "ABSENT",
      immutable: true,
      supersede_not_mutate: true,
    });
    expect(lab.scope).toMatchObject({
      fixture_kind: "SYNTHETIC_DECLARED_DATA",
      network_request: false,
      crawler: false,
      live_observation: false,
      external_input: false,
      credential_input: false,
      personal_data: false,
      telemetry: false,
      filesystem_write: false,
      external_effect: false,
    });

    const html = read("site/hub.html");
    const start = html.indexOf('<section class="blk" id="string-crawl-trace-sheet-lab"');
    const end = html.indexOf("</section>", start) + "</section>".length;
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const section = html.slice(start, end);
    expect(section).toContain("data-string-crawl-trace-sheet-lab");
    expect(section).toContain("TRIANGULATED_DISK");
    expect(section).toContain("∂1∂2 = 0");
    expect(section).not.toMatch(/<(?:script|form|input|button|select|textarea|iframe|canvas)\b/i);
    expect(section).not.toMatch(/(?:fetch\(|sendBeacon|WebSocket|EventSource|postMessage)/);
  });
});
