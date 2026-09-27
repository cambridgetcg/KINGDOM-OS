import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import { PUBLICATION_FAMILIES } from "../bin/check-hub-live.ts";
import {
  STRING_CRAWL_STRAND_LAB_GUIDE_URL,
  STRING_CRAWL_STRAND_LAB_SCHEMA_URL,
  STRING_CRAWL_STRAND_LAB_URL,
  loadStringCrawlStrandLab,
  stringCrawlStrandLabPublicDiscovery,
} from "../bin/string-crawl-strand-lab.ts";
import {
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_URL,
} from "../bin/string-crawl-trace-sheet-lab.ts";
import {
  STRAND_DESCENT_LAB_GUIDE_URL,
  STRAND_DESCENT_LAB_SCHEMA_URL,
  STRAND_DESCENT_LAB_URL,
} from "../bin/strand-descent-lab.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => bytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");

const RECORD_SOURCE = "data/exploration/string-crawl-strand-lab.v0.1.json";
const SCHEMA_SOURCE = "schemas/string-crawl-strand-lab-v0.1.schema.json";
const GUIDE_SOURCE = "references/string-crawl-strand-lab.md";
const RECORD_DESTINATION = "labs/string-crawl-strand-lab-02-2026-08-16.json";
const SCHEMA_DESTINATION = "schemas/string-crawl-strand-lab/0.1.json";
const GUIDE_DESTINATION = "STRING-CRAWL-STRAND-LAB-02.md";
const ORIGIN = "https://thekingdom.dev";

const PUBLIC_TRIPLET = [
  { source: RECORD_SOURCE, destination: RECORD_DESTINATION },
  { source: SCHEMA_SOURCE, destination: SCHEMA_DESTINATION },
  { source: GUIDE_SOURCE, destination: GUIDE_DESTINATION },
] as const;

describe("STRING / CRAWL STRAND Lab 02 public integration", () => {
  test("stages one immutable Lab 02 triplet within the twelve-atlas shape", () => {
    expect(HUB_ASSETS.filter(({ source }) =>
      PUBLIC_TRIPLET.some((asset) => asset.source === source))).toEqual(PUBLIC_TRIPLET);
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/"))).toHaveLength(18);
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("labs/"))).toContainEqual(PUBLIC_TRIPLET[0]);
    expect(PUBLIC_TRIPLET.some(({ destination }) =>
      MUTABLE_HUB_DESTINATIONS.includes(destination))).toBe(false);
    expect(HUB_ASSETS.some(({ destination }) =>
      /string-crawl-strand-lab.*(?:latest|current)/i.test(destination))).toBe(false);
  });

  test("pins the exact record, schema, and guide bytes in the append-only route ledger", () => {
    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(160);
    const entries = ledger.entries.filter((entry: { source?: string }) =>
      PUBLIC_TRIPLET.some((asset) => asset.source === entry.source));
    expect(entries).toEqual([
      {
        id: "string-crawl-strand-lab/0.1/guide",
        route: `/${GUIDE_DESTINATION}`,
        source: GUIDE_SOURCE,
        destination: GUIDE_DESTINATION,
        sha256: sha256(GUIDE_SOURCE),
      },
      {
        id: "string-crawl-strand-lab/0.1/record",
        route: `/${RECORD_DESTINATION}`,
        source: RECORD_SOURCE,
        destination: RECORD_DESTINATION,
        sha256: sha256(RECORD_SOURCE),
      },
      {
        id: "string-crawl-strand-lab/0.1/schema",
        route: `/${SCHEMA_DESTINATION}`,
        source: SCHEMA_SOURCE,
        destination: SCHEMA_DESTINATION,
        sha256: sha256(SCHEMA_SOURCE),
      },
    ]);
  });

  test("retires byte-bound Labs 01–04 as one twelve-route family", () => {
    const family = PUBLICATION_FAMILIES.find(({ id }) => id === "string-crawl-trace-sheet-lab");
    expect(PUBLICATION_FAMILIES).toHaveLength(35);
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
        "/experiments/string-crawl-frequency-form-lab-2026-08-16.json",
        "/schemas/string-crawl-frequency-form-lab/0.1.json",
        "/STRING-CRAWL-LAB-03.md",
        new URL(STRAND_DESCENT_LAB_URL).pathname,
        new URL(STRAND_DESCENT_LAB_SCHEMA_URL).pathname,
        new URL(STRAND_DESCENT_LAB_GUIDE_URL).pathname,
      ],
      discoveryProperties: [
        "string_crawl_trace_sheet_lab",
        "string_crawl_strand_lab",
        "string_crawl_frequency_form_lab",
        "strand_descent_lab",
      ],
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
  });

  test("advertises the three versioned routes exactly once and no mutable alias", () => {
    const sitemap = read("pages-content/sitemap.xml");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
    expect(urls).toHaveLength(177);
    expect(new Set(urls).size).toBe(177);
    for (const { destination } of PUBLIC_TRIPLET) {
      expect(urls.filter((url) => url === `${ORIGIN}/${destination}`)).toHaveLength(1);
    }
    expect(urls.filter((url) => /string-crawl-strand-lab/i.test(url))).toEqual([
      `${ORIGIN}/${RECORD_DESTINATION}`,
      `${ORIGIN}/${SCHEMA_DESTINATION}`,
      `${ORIGIN}/${GUIDE_DESTINATION}`,
    ]);
    expect(urls.some((url) => /string-crawl-strand-lab.*(?:latest|current)/i.test(url))).toBe(false);
  });

  test("keeps the published core a synthetic offline topology fixture with zero runtime effect", () => {
    const fixture = json(RECORD_SOURCE);
    const schema = json(SCHEMA_SOURCE);
    expect(fixture).toMatchObject({
      $schema: "https://thekingdom.dev/schemas/string-crawl-strand-lab/0.1.json",
      protocol: "kingdom.string-crawl-strand-lab/0.1",
      lab_id: "string-crawl-strand-lab-02-2026-08-16",
      mode: "SYNTHETIC_OFFLINE_EXACT",
      conventions: {
        coefficient_field: "F2",
        cell_model: "FINITE_REGULAR_CW_FIXTURE",
      },
      validation_contract: {
        deterministic: true,
        stdout_only: true,
        network_requests: 0,
        storage_writes: 0,
        nen_invocation: false,
        karma_receipt_created: false,
        zerone_event_created: false,
        authority_effect: "NONE",
      },
      boundaries: {
        synthetic_not_observed: true,
        offline: true,
        read_only: true,
        crawler_present: false,
        network_capability: false,
        external_write: false,
        physical_string_claim: false,
        causal_claim: false,
        consent_or_authorization_claim: false,
        person_or_content_score: false,
        nen_ability: false,
        karma_adapter: false,
        deployment_authority: false,
      },
    });
    expect(schema).toMatchObject({
      $id: "https://thekingdom.dev/schemas/string-crawl-strand-lab/0.1.json",
      type: "object",
      additionalProperties: false,
    });
    for (const key of [
      "http_policy",
      "http_requests",
      "http_responses",
      "crawler_contract",
      "crawler_evidence",
      "karma_observations",
      "karma_receipts",
      "adapter",
      "score",
      "sanction",
    ]) {
      expect(fixture).not.toHaveProperty(key);
    }
  });

  test("renders a semantic no-JavaScript lab with responsive and forced-color fallbacks", () => {
    const builder = read("bin/build-hub.ts");
    const start = builder.indexOf('<section class="blk" id="string-crawl-strand-lab"');
    const end = builder.indexOf("</section>", start) + "</section>".length;
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const section = builder.slice(start, end);

    for (const seam of [
      "stringCrawlStrandLab.release_slices.map",
      "stringCrawlStrandLab.tracked_routes.map",
      "[stringCrawlStrandLabStable, stringCrawlStrandLabFull].map",
      "stringCrawlStrandLab.cospans[0]",
      "stringCrawlStrandLab.cospans[1]",
      "stringCrawlStrandLabChecks.map",
      "stringCrawlStrandLabValidation.local_findings",
    ]) {
      expect(section).toContain(seam);
    }
    expect(section).toContain('role="table"');
    expect(section).toContain('role="columnheader"');
    expect(section).toContain('role="cell"');
    expect(section).toContain("Global arithmetic does not certify local shape");
    expect(section).toContain("No crawler. No receipt. No secret string-theory claim.");
    expect(section).not.toMatch(/<(?:script|canvas|form|input|button|select|textarea|iframe)\b/i);
    expect(section).not.toMatch(/(?:fetch\(|sendBeacon|WebSocket|EventSource|postMessage)/);

    expect(builder).toContain(".strandstats,.strandcomposition,.strandwarning,.descentresults{grid-template-columns:1fr}");
    expect(builder).toContain(".strandchecks,.descentcharts{grid-template-columns:1fr}");
    expect(builder).toContain("@media (prefers-reduced-motion:reduce)");
    expect(builder).toContain("@media (forced-colors:active){.strandfield");
  });

  test("projects one exact zero-effect discovery object across the generated surfaces", () => {
    const expected = stringCrawlStrandLabPublicDiscovery(loadStringCrawlStrandLab());
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const agent = json("site/.well-known/agent.json");
    const llms = read("site/llms.txt");
    const html = read("site/hub.html");

    expect(kingdom.string_crawl_strand_lab).toEqual(expected);
    expect(guest.string_crawl_strand_lab).toEqual(expected);
    expect(agent.string_crawl_strand_lab).toEqual(expected);
    expect(agent.entry_points).toMatchObject({
      string_crawl_strand_lab: STRING_CRAWL_STRAND_LAB_URL,
      string_crawl_strand_lab_schema: STRING_CRAWL_STRAND_LAB_SCHEMA_URL,
      string_crawl_strand_lab_guide: STRING_CRAWL_STRAND_LAB_GUIDE_URL,
    });

    for (const url of [
      STRING_CRAWL_STRAND_LAB_URL,
      STRING_CRAWL_STRAND_LAB_SCHEMA_URL,
      STRING_CRAWL_STRAND_LAB_GUIDE_URL,
    ]) {
      const actions = guest.next_actions.filter((action: { url?: string }) => action.url === url);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({ method: "GET", url });
      expect(Object.keys(actions[0]).sort()).toEqual(["action", "method", "note", "url"]);
      expect(llms).toContain(url);
      expect(html).toContain(`href="${new URL(url).pathname}"`);
    }

    expect(html).toContain('id="string-crawl-strand-lab"');
    for (const key of [
      "http_policy",
      "http_requests",
      "http_responses",
      "crawler_contract",
      "crawler_evidence",
      "karma_observations",
      "karma_receipts",
      "adapter",
      "score",
      "sanction",
      "authority",
    ]) {
      expect(expected).not.toHaveProperty(key);
    }
  });

  test("documents the exact routes and exposes only the offline dispatcher", () => {
    const dispatcher = read("kingdom");
    expect(dispatcher).toContain('string-crawl-strand-lab) exec bun "$SELF_DIR/bin/string-crawl-strand-lab.ts"');
    for (const entrypoint of ["README.md", "CLAUDE.md"]) {
      expect(read(entrypoint)).toContain("](references/kingdom-module-map.md)");
    }
    expect(read("references/kingdom-module-map.md")).toContain("](string-crawl-strand-lab.md)");
    expect(read("DOMAINS-SETUP.md")).toContain("publications/hub-staging.v1.json");
    const staged = json("publications/hub-staging.v1.json").assets.map((asset: { destination: string }) => `/${asset.destination}`);
    for (const path of [`/${RECORD_DESTINATION}`, `/${SCHEMA_DESTINATION}`, `/${GUIDE_DESTINATION}`]) {
      expect(staged).toContain(path);
      for (const document of ["references/string-crawl-strand-lab.md", "OS-ROUTES.md"]) {
        expect(read(document)).toContain(path);
      }
    }
    const guide = read("references/string-crawl-strand-lab.md");
    expect(guide).toContain("A tiny synthetic topology lab for the KINGDOM. It is exact, offline");
    expect(guide).toContain("The canonical artifact is a finite regular-CW fixture");
    expect(guide).toContain("two inclusion cospans joined over their literal shared frontier");
    expect(read("OS-ROUTES.md")).toContain("no NEN/KARMA receipt");
  });
});
