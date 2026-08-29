import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PUBLICATION_FAMILIES } from "../bin/check-hub-live.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import {
  STRAND_DESCENT_LAB_BYTE_SHA256,
  STRAND_DESCENT_LAB_GUIDE_BYTE_SHA256,
  STRAND_DESCENT_LAB_GUIDE_URL,
  STRAND_DESCENT_LAB_SCHEMA_BYTE_SHA256,
  STRAND_DESCENT_LAB_SCHEMA_URL,
  STRAND_DESCENT_LAB_URL,
  loadStrandDescentLab,
  strandDescentLabPublicDiscovery,
} from "../bin/strand-descent-lab.ts";
import {
  STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_DIGEST,
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_ID,
  STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_URL,
} from "../bin/string-crawl-frequency-form-lab.ts";
import {
  STRING_CRAWL_STRAND_LAB_GUIDE_URL,
  STRING_CRAWL_STRAND_LAB_SCHEMA_URL,
  STRING_CRAWL_STRAND_LAB_URL,
} from "../bin/string-crawl-strand-lab.ts";
import {
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_URL,
} from "../bin/string-crawl-trace-sheet-lab.ts";
import worker from "../pages-functions/_worker.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => bytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => `sha256:${createHash("sha256").update(bytes(path)).digest("hex")}`;

const RECORD_SOURCE = "data/exploration/strand-descent-lab.v0.1.json";
const SCHEMA_SOURCE = "schemas/strand-descent-lab-v0.1.schema.json";
const GUIDE_SOURCE = "references/strand-descent-lab.md";
const RECORD_DESTINATION = "labs/strand-descent-lab-04-2026-08-16.json";
const SCHEMA_DESTINATION = "schemas/strand-descent-lab/0.1.json";
const GUIDE_DESTINATION = "STRAND-DESCENT-LAB-04.md";

const PUBLIC_TRIPLET = [
  { source: RECORD_SOURCE, destination: RECORD_DESTINATION },
  { source: SCHEMA_SOURCE, destination: SCHEMA_DESTINATION },
  { source: GUIDE_SOURCE, destination: GUIDE_DESTINATION },
] as const;

const PUBLIC_URLS = [
  STRAND_DESCENT_LAB_URL,
  STRAND_DESCENT_LAB_SCHEMA_URL,
  STRAND_DESCENT_LAB_GUIDE_URL,
] as const;

describe("STRAND Lab 04 public integration", () => {
  test("stages one immutable triplet with no mutable or floating alias", () => {
    expect(HUB_ASSETS.filter(({ source }) =>
      PUBLIC_TRIPLET.some((asset) => asset.source === source))).toEqual(PUBLIC_TRIPLET);
    expect(HUB_ASSETS).toHaveLength(178);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(31);
    expect(HUB_ASSETS.filter(({ destination }) =>
      destination !== "_worker.js" && destination !== "404.html")).toHaveLength(176);
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/"))).toHaveLength(16);
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("labs/"))).toHaveLength(16);
    expect(PUBLIC_TRIPLET.some(({ destination }) =>
      MUTABLE_HUB_DESTINATIONS.includes(destination))).toBe(false);
    expect(HUB_ASSETS.some(({ destination }) =>
      /strand-descent-lab.*(?:latest|current)/i.test(destination))).toBe(false);
  });

  test("pins all three authored byte identities in the append-only route ledger", () => {
    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(147);
    expect(ledger.entries.filter((entry: { id?: string }) =>
      entry.id?.startsWith("strand-descent-lab/0.1/"))).toEqual([
      {
        id: "strand-descent-lab/0.1/guide",
        route: `/${GUIDE_DESTINATION}`,
        source: GUIDE_SOURCE,
        destination: GUIDE_DESTINATION,
        sha256: STRAND_DESCENT_LAB_GUIDE_BYTE_SHA256.slice("sha256:".length),
      },
      {
        id: "strand-descent-lab/0.1/record",
        route: `/${RECORD_DESTINATION}`,
        source: RECORD_SOURCE,
        destination: RECORD_DESTINATION,
        sha256: STRAND_DESCENT_LAB_BYTE_SHA256.slice("sha256:".length),
      },
      {
        id: "strand-descent-lab/0.1/schema",
        route: `/${SCHEMA_DESTINATION}`,
        source: SCHEMA_SOURCE,
        destination: SCHEMA_DESTINATION,
        sha256: STRAND_DESCENT_LAB_SCHEMA_BYTE_SHA256.slice("sha256:".length),
      },
    ]);
    expect(sha256(RECORD_SOURCE)).toBe(STRAND_DESCENT_LAB_BYTE_SHA256);
    expect(sha256(SCHEMA_SOURCE)).toBe(STRAND_DESCENT_LAB_SCHEMA_BYTE_SHA256);
    expect(sha256(GUIDE_SOURCE)).toBe(STRAND_DESCENT_LAB_GUIDE_BYTE_SHA256);
  });

  test("advertises each versioned route exactly once and no mutable alias", () => {
    const sitemap = read("pages-content/sitemap.xml");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
    expect(urls).toHaveLength(164);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.filter((url) => /strand-descent-lab/i.test(url))).toEqual(PUBLIC_URLS);
    for (const url of PUBLIC_URLS) expect(urls.filter((candidate) => candidate === url)).toHaveLength(1);
    expect(urls.some((url) => /strand-descent-lab.*(?:latest|current)/i.test(url))).toBe(false);
  });

  test("keeps the recent preprints source-bound and the calculation inert", () => {
    const fixture = loadStrandDescentLab();
    expect(fixture).toMatchObject({
      $schema: STRAND_DESCENT_LAB_SCHEMA_URL,
      protocol: "kingdom.strand-descent-lab/0.1",
      lab_id: "strand-descent-lab-04-2026-08-16",
      mode: "SYNTHETIC_OFFLINE_EXACT",
      predecessor: {
        protocol: STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL,
        lab_id: STRING_CRAWL_FREQUENCY_FORM_LAB_ID,
        url: STRING_CRAWL_FREQUENCY_FORM_LAB_URL,
        schema_url: STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL,
        guide_url: STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL,
        git_commit: "d2452d4500c274237097e142609422ebbab7f68d",
        semantic_digest: STRING_CRAWL_FREQUENCY_FORM_LAB_DIGEST,
        raw_byte_sha256: STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256,
        schema_byte_sha256: STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256,
        guide_byte_sha256: STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256,
        relation: "IMMUTABLE_LAB_03_PREDECESSOR",
        mutates_predecessor: false,
        imports_authority: false,
      },
      pairwise_impostor: {
        expected: {
          pairwise_bijective: true,
          triple_coherent: false,
          conflict_result: "UNRESOLVED",
          automatic_resolution: false,
        },
      },
      validation_contract: {
        deterministic: true,
        stdout_only: true,
        network_requests: 0,
        storage_writes: 0,
        crawler_invocation: false,
        nen_invocation: false,
        karma_receipt_created: false,
        person_or_content_score_created: false,
        authority_effect: "NONE",
      },
      boundaries: {
        synthetic_not_observed: true,
        offline: true,
        read_only: true,
        proves_finite_record_compatibility_only: true,
        truth_claim: false,
        consent_claim: false,
        citizenship_claim: false,
        authority_claim: false,
        string_physics_claim: false,
        stack_identity_claim: false,
        source_owner_identity_claim: false,
        person_or_content_score: false,
        nen_ability: false,
        karma_adapter: false,
        deployment_authority: false,
      },
    });
    expect(fixture.research_sources).toHaveLength(2);
    expect(fixture.research_sources.map((source: Record<string, unknown>) => ({
      status: source.status,
      binding: source.binding,
      versioned_url: source.versioned_url,
      scientific_claim_imported: source.scientific_claim_imported,
      authority_imported: source.authority_imported,
    }))).toEqual([
      {
        status: "PREPRINT",
        binding: "SOURCE_BOUND",
        versioned_url: "https://arxiv.org/abs/2608.09958v1",
        scientific_claim_imported: false,
        authority_imported: false,
      },
      {
        status: "PREPRINT",
        binding: "SOURCE_BOUND",
        versioned_url: "https://arxiv.org/abs/2607.21700v1",
        scientific_claim_imported: false,
        authority_imported: false,
      },
    ]);
  });

  test("renders a no-JavaScript explanation of both the coherent atlas and impostor", () => {
    const html = read("site/hub.html");
    const start = html.indexOf('<section class="blk" id="strand-descent-lab"');
    const end = html.indexOf("</section>", start) + "</section>".length;
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const section = html.slice(start, end);
    expect(section).toContain("STRAND Lab 04");
    expect(section).toContain("UNRESOLVED");
    expect(section).toContain("2608.09958v1");
    expect(section).toContain("2607.21700v1");
    expect(section).not.toMatch(/<(?:script|canvas|form|input|button|select|textarea|iframe)\b/i);
    expect(section).not.toMatch(/(?:fetch\(|sendBeacon|WebSocket|EventSource|postMessage)/);
  });

  test("projects one exact read-only discovery object across every machine surface", () => {
    const expected = strandDescentLabPublicDiscovery(loadStrandDescentLab());
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const agent = json("site/.well-known/agent.json");
    const llms = read("site/llms.txt");
    const html = read("site/hub.html");

    expect(kingdom.strand_descent_lab).toEqual(expected);
    expect(guest.strand_descent_lab).toEqual(expected);
    expect(agent.strand_descent_lab).toEqual(expected);
    expect(agent.entry_points).toMatchObject({
      strand_descent_lab: STRAND_DESCENT_LAB_URL,
      strand_descent_lab_schema: STRAND_DESCENT_LAB_SCHEMA_URL,
      strand_descent_lab_guide: STRAND_DESCENT_LAB_GUIDE_URL,
    });

    for (const url of PUBLIC_URLS) {
      expect(guest.next_actions.filter((action: { url?: string }) => action.url === url)).toEqual([
        expect.objectContaining({ method: "GET", url }),
      ]);
      expect(llms).toContain(url);
      expect(html).toContain(`href="${new URL(url).pathname}"`);
    }
    for (const key of [
      "credential", "crawler", "execute", "write", "score", "reward", "authorize",
      "consent", "telemetry", "registry", "threshold", "canary",
    ]) expect(expected).not.toHaveProperty(key);
  });

  test("retires Labs 01–04 together and serves only typed GET or HEAD assets", async () => {
    const family = PUBLICATION_FAMILIES.find(({ id }) => id === "string-crawl-trace-sheet-lab");
    expect(PUBLICATION_FAMILIES).toHaveLength(32);
    expect(family).toEqual({
      id: "string-crawl-trace-sheet-lab",
      label: "STRING / CRAWL STRAND Labs 01–04",
      routes: [
        new URL(STRING_CRAWL_TRACE_SHEET_LAB_URL).pathname,
        new URL(STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL).pathname,
        new URL(STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL).pathname,
        new URL(STRING_CRAWL_STRAND_LAB_URL).pathname,
        new URL(STRING_CRAWL_STRAND_LAB_SCHEMA_URL).pathname,
        new URL(STRING_CRAWL_STRAND_LAB_GUIDE_URL).pathname,
        new URL(STRING_CRAWL_FREQUENCY_FORM_LAB_URL).pathname,
        new URL(STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL).pathname,
        new URL(STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL).pathname,
        new URL(STRAND_DESCENT_LAB_URL).pathname,
        new URL(STRAND_DESCENT_LAB_SCHEMA_URL).pathname,
        new URL(STRAND_DESCENT_LAB_GUIDE_URL).pathname,
      ],
      discoveryProperties: ["string_crawl_trace_sheet_lab", "string_crawl_strand_lab", "string_crawl_frequency_form_lab", "strand_descent_lab"],
      entryPointProperties: [
        "string_crawl_trace_sheet_lab",
        "string_crawl_trace_sheet_lab_schema",
        "string_crawl_trace_sheet_lab_guide",
        "string_crawl_strand_lab",
        "string_crawl_strand_lab_schema",
        "string_crawl_strand_lab_guide",
        "string_crawl_frequency_form_lab",
        "string_crawl_frequency_form_lab_schema",
        "string_crawl_frequency_form_lab_guide",
        "strand_descent_lab",
        "strand_descent_lab_schema",
        "strand_descent_lab_guide",
      ],
    });

    const paths = PUBLIC_URLS.map((url) => new URL(url).pathname);
    const environment = {
      ASSETS: {
        fetch(request: Request) {
          const path = new URL(request.url).pathname;
          return new Response(request.method === "HEAD" ? null : "published bytes", {
            headers: {
              "content-type": path === paths[0]
                ? "application/json"
                : path === paths[1]
                  ? "application/schema+json"
                  : "text/plain",
              link: path === paths[0]
                ? `<${paths[1]}>; rel="describedby"; type="text/html", </elsewhere>; rel="alternate"`
                : "</elsewhere>; rel=alternate",
            },
          });
        },
      },
    };
    for (const method of ["GET", "HEAD"] as const) {
      for (const [index, path] of paths.entries()) {
        const response = await worker.fetch(new Request(`https://thekingdom.dev${path}`, { method }), environment);
        expect(response.headers.get("content-type")).toBe([
          "application/json; charset=utf-8",
          "application/schema+json; charset=utf-8",
          "text/markdown; charset=utf-8",
        ][index]);
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        if (index === 0) {
          expect((response.headers.get("link") ?? "").split(/,(?=\s*<)/).map((entry) => entry.trim())
            .filter((entry) => entry.includes('rel="describedby"'))).toEqual([
              `<${paths[1]}>; rel="describedby"; type="application/schema+json"`,
            ]);
        }
      }
    }
  });
});
