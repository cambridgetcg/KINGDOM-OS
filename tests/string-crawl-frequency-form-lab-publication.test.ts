import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "bun:test";

import { PUBLICATION_FAMILIES } from "../bin/check-hub-live.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import {
  STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_LOCATOR,
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_LOCATOR,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_LOCATOR,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_URL,
  evaluateStringCrawlFrequencyFormLab,
  loadStringCrawlFrequencyFormLab,
  stringCrawlFrequencyFormLabPublicDiscovery,
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
import {
  STRAND_DESCENT_LAB_GUIDE_URL,
  STRAND_DESCENT_LAB_SCHEMA_URL,
  STRAND_DESCENT_LAB_URL,
} from "../bin/strand-descent-lab.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bytes = (path: string): Buffer => readFileSync(join(ROOT, path));
const read = (path: string): string => bytes(path).toString("utf8");
const json = (path: string): any => JSON.parse(read(path));
const sha256 = (path: string): string => createHash("sha256").update(bytes(path)).digest("hex");
const destination = (url: string): string => new URL(url).pathname.slice(1);

const RECORD_DESTINATION = destination(STRING_CRAWL_FREQUENCY_FORM_LAB_URL);
const SCHEMA_DESTINATION = destination(STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL);
const GUIDE_DESTINATION = destination(STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL);
const PUBLIC_URLS = [
  STRING_CRAWL_FREQUENCY_FORM_LAB_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL,
] as const;
const PUBLIC_TRIPLET = [
  { source: STRING_CRAWL_FREQUENCY_FORM_LAB_LOCATOR, destination: RECORD_DESTINATION },
  { source: STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_LOCATOR, destination: SCHEMA_DESTINATION },
  { source: STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_LOCATOR, destination: GUIDE_DESTINATION },
] as const;
const EFFECT_BOUNDARY = {
  synthetic_not_observed: true,
  offline: true,
  read_only: true,
  stdout_only: true,
  network_requests: 0,
  storage_writes: 0,
  live_crawl: false,
  crawler_runtime: false,
  drug_administration: false,
  dose_guidance: false,
  preparation_guidance: false,
  procurement_guidance: false,
  combination_guidance: false,
  use_or_eligibility_guidance: false,
  recruitment: false,
  participant_data_ingested: false,
  participant_data_collected: false,
  human_subject_research_authority: false,
  clinical_authority: false,
  medical_authority: false,
  external_entity_claim: false,
  physical_extra_dimension_claim: false,
  physical_string_claim: false,
  portal_claim: false,
  carrier_frequency_claim: false,
  causal_chain_claim: false,
  entity_specific_frequency_claim: false,
  message_truth_claim: false,
  reported_message_is_instruction: false,
  reported_message_is_identity_proof: false,
  reported_message_is_consent: false,
  reported_message_is_delegation: false,
  reported_message_is_authority: false,
  diagnosis: false,
  treatment_or_medical_action: false,
  subprocesses: 0,
  mcp_invocation: false,
  ability_invocation: false,
  nen_invocation: false,
  zerone_karma_event_observed: false,
  zerone_karma_event_created: false,
  kingdom_karma_receipt_created: false,
  karma_adapter: false,
  person_score: false,
  rank_or_qualification: false,
  reward_or_punishment: false,
  economic_effect: false,
  governance_effect: false,
  deployment_authority: false,
  authority: false,
  authority_effect: "NONE",
  action: false,
} as const;

describe("STRAND Lab 03 public integration", () => {
  test("stages and advertises one immutable triplet with exact ledger hashes and no aliases", () => {
    expect(HUB_ASSETS.filter(({ source }) =>
      PUBLIC_TRIPLET.some((asset) => asset.source === source))).toEqual(PUBLIC_TRIPLET);
    expect(HUB_ASSETS).toHaveLength(201);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(41);
    expect(HUB_ASSETS.filter(({ destination: path }) =>
      path !== "_worker.js" && path !== "404.html")).toHaveLength(199);
    for (const asset of PUBLIC_TRIPLET) {
      expect(MUTABLE_HUB_DESTINATIONS).not.toContain(asset.destination);
    }
    expect(HUB_ASSETS.filter(({ destination: path }) => path.startsWith("experiments/")))
      .toEqual([PUBLIC_TRIPLET[0]]);
    expect(HUB_ASSETS.some(({ destination: path }) =>
      /string-crawl-frequency-form-lab.*(?:latest|current)/i.test(path))).toBe(false);

    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(160);
    expect(ledger.entries.filter(({ id }: { id?: string }) =>
      id?.startsWith("string-crawl-frequency-form-lab/0.1/"))).toEqual([
      {
        id: "string-crawl-frequency-form-lab/0.1/guide",
        route: `/${GUIDE_DESTINATION}`,
        source: STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_LOCATOR,
        destination: GUIDE_DESTINATION,
        sha256: sha256(STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_LOCATOR),
      },
      {
        id: "string-crawl-frequency-form-lab/0.1/record",
        route: `/${RECORD_DESTINATION}`,
        source: STRING_CRAWL_FREQUENCY_FORM_LAB_LOCATOR,
        destination: RECORD_DESTINATION,
        sha256: sha256(STRING_CRAWL_FREQUENCY_FORM_LAB_LOCATOR),
      },
      {
        id: "string-crawl-frequency-form-lab/0.1/schema",
        route: `/${SCHEMA_DESTINATION}`,
        source: STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_LOCATOR,
        destination: SCHEMA_DESTINATION,
        sha256: sha256(STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_LOCATOR),
      },
    ]);
    expect(`sha256:${sha256(STRING_CRAWL_FREQUENCY_FORM_LAB_LOCATOR)}`)
      .toBe(STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256);
    expect(`sha256:${sha256(STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_LOCATOR)}`)
      .toBe(STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256);
    expect(`sha256:${sha256(STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_LOCATOR)}`)
      .toBe(STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256);

    const sitemap = read("pages-content/sitemap.xml");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
    expect(urls).toHaveLength(185);
    expect(new Set(urls).size).toBe(185);
    for (const url of PUBLIC_URLS) expect(urls.filter((candidate) => candidate === url)).toHaveLength(1);
    expect(urls.some((url) =>
      /string-crawl-frequency-form-lab.*(?:latest|current)/i.test(url))).toBe(false);
  });

  test("projects one exact discovery object and one bounded guest GET action per public URL", () => {
    const expected = stringCrawlFrequencyFormLabPublicDiscovery(loadStringCrawlFrequencyFormLab());
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const agent = json("site/.well-known/agent.json");

    expect(kingdom.string_crawl_frequency_form_lab).toEqual(expected);
    expect(guest.string_crawl_frequency_form_lab).toEqual(expected);
    expect(agent.string_crawl_frequency_form_lab).toEqual(expected);
    expect(agent.entry_points).toMatchObject({
      string_crawl_frequency_form_lab: STRING_CRAWL_FREQUENCY_FORM_LAB_URL,
      string_crawl_frequency_form_lab_schema: STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL,
      string_crawl_frequency_form_lab_guide: STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL,
    });

    expect(expected.counts).toEqual({
      frequency_types: 3,
      dimension_registers: 4,
      presence_evidence_levels: 4,
      evidence_cards: 8,
      nonimplication_firewalls: 17,
      validation_checks: 9,
    });
    expect(expected.exact_findings).toMatchObject({
      temporal_bin: 16,
      temporal_unit: "CYCLES_PER_SYNTHETIC_TICK",
      graph_eigenvalue: 2,
      graph_unit: "DIMENSIONLESS_OPERATOR_SPECIFIC_EIGENVALUE",
      betti: [1, 0],
      effective_mode_count: 2,
      onset_order: {
        oscillation: 0,
        form: 1,
        world: 2,
        presence: 2,
        world_before_or_concurrent_with_presence: true,
        strict_world_before_presence: false,
        interpretation: "ORDER_ONLY_NOT_CAUSAL",
      },
    });
    expect(expected.effect_boundary).toEqual(EFFECT_BOUNDARY);
    for (const key of [
      "mcp", "tool", "matcher", "crawler", "request", "response", "karma",
      "receipt", "adapter", "execute", "write", "score", "reward", "sanction",
      "authorize", "consent", "invoke", "publish", "deploy", "authority", "action",
    ]) expect(Object.hasOwn(expected, key)).toBe(false);

    for (const url of PUBLIC_URLS) {
      const actions = guest.next_actions.filter((action: { url?: string }) => action.url === url);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({ method: "GET", url });
      expect(Object.keys(actions[0]).sort()).toEqual(["action", "method", "note", "url"]);
      expect(read("site/llms.txt")).toContain(url);
    }
    const labActions = guest.next_actions.filter((action: { url?: string }) =>
      PUBLIC_URLS.includes(action.url as (typeof PUBLIC_URLS)[number]));
    expect(labActions.map((action: { note?: string }) => action.note).join(" "))
      .not.toMatch(/temporal hertz|report occurrence/i);
    expect(labActions.find((action: { url?: string }) =>
      action.url === STRING_CRAWL_FREQUENCY_FORM_LAB_URL)?.note).toContain("coded-experience occurrence");
    expect(labActions.find((action: { url?: string }) =>
      action.url === STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL)?.note)
      .toContain("cycles per synthetic tick");
  });

  test("renders one static, resource-linked explanation without a runtime input surface", () => {
    const html = read("site/hub.html");
    const start = html.indexOf('<section class="blk" id="string-crawl-frequency-form-lab"');
    const end = html.indexOf("</section>", start) + "</section>".length;
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const section = html.slice(start, end);
    const fixture = loadStringCrawlFrequencyFormLab();

    for (const url of PUBLIC_URLS) {
      expect(section).toContain(`href="${new URL(url).pathname}"`);
    }
    for (const card of fixture.evidence_cards) expect(section).toContain(`href="${card.url}"`);
    for (const text of [
      "Three things called “frequency” enter",
      "The arrow is not a causal conveyor belt.",
      "No entity frequency. No portal. No medical or moral instruction.",
      "coded-experience occurrence",
      "display 16 · DFT_BIN_INDEX_DISPLAY; normalized 0.25 · CYCLES_PER_SYNTHETIC_TICK",
      "LEVEL 1 · NOT_MEASURED",
      "NO_NEURAL_MEASUREMENT_PROTOCOL_IN_THIS_LAB",
      "PRESENT(0)",
      "MISSING(null)",
    ]) expect(section).toContain(text);

    expect(section).not.toMatch(/<(?:script|canvas|form|input|button|select|textarea|iframe)\b/i);
    expect(section).not.toMatch(/(?:fetch\(|sendBeacon|WebSocket|EventSource|postMessage)/);
    expect(section).not.toMatch(/graph-spatial modes,\s*report occurrence/i);
    expect(section.match(/data-frequency-kind=/g)).toHaveLength(fixture.quantity_register.length);
    expect(section.match(/class="frequencydimension"/g)).toHaveLength(fixture.dimension_register.length);
    expect(section.match(/data-frequency-form-check=/g)).toHaveLength(9);
    expect(section.match(/class="frequencysources"[\s\S]*?<\/div>/)?.[0].match(/<a href=/g))
      .toHaveLength(fixture.evidence_cards.length);
  });

  test("keeps every visible register source-derived and the layout accessible without motion", () => {
    const builder = read("bin/build-hub.ts");
    for (const seam of [
      "stringCrawlFrequencyFormLab.quantity_register.map",
      "stringCrawlFrequencyFormLab.temporal_fixture.samples.map",
      "stringCrawlFrequencyFormLab.dimension_register.map",
      "stringCrawlFrequencyFormLab.presence_evidence_ladder.map",
      "stringCrawlFrequencyFormLab.nonimplication_firewall.map",
      "stringCrawlFrequencyFormLab.evidence_cards.map",
      "Object.entries(stringCrawlFrequencyFormLab.karma_lanes).map",
      "stringCrawlFrequencyFormLabChecks.map",
    ]) expect(builder).toContain(seam);
    for (const contract of [
      "stringCrawlFrequencyFormLabChecks.length !== 9",
      "stringCrawlFrequencyFormLab.effect_boundary?.network_requests !== 0",
      "It administers no drug",
      "stringCrawlFrequencyFormLab.effect_boundary?.external_entity_claim !== false",
      "stringCrawlFrequencyFormLab.effect_boundary?.kingdom_karma_receipt_created !== false",
      "stringCrawlFrequencyFormLab.effect_boundary?.authority_effect !== \"NONE\"",
      "@media (max-width:520px){.frequencyformfield",
      "@media (prefers-reduced-motion:reduce){.frequencyformfield",
      "@media (forced-colors:active){.frequencyformfield",
    ]) expect(builder).toContain(contract);
    expect(builder).not.toMatch(/temporal hertz|report occurrence/i);
  });

  test("keeps crawler, medical, entity, KARMA, scoring, and authority effects exactly absent", () => {
    const fixture = loadStringCrawlFrequencyFormLab();
    const evaluation = evaluateStringCrawlFrequencyFormLab(fixture);
    const schema = json(STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_LOCATOR);

    expect(evaluation.valid).toBe(true);
    expect(evaluation.issues).toEqual([]);
    expect(evaluation.checks).toHaveLength(9);
    expect(evaluation.checks.every(({ status }) => status === "PASS")).toBe(true);
    expect(evaluation.results.occurrence).toEqual({
      coded_entity_experience_count: 1719,
      selected_experience_count: 3778,
      selected_post_count: 3305,
      reported_percentage_tenths: 455,
      population_prevalence: false,
    });
    expect(evaluation.results.states).toEqual({
      present: 7,
      missing: 5,
      present_zero: 1,
      born_before_present_encoded_as: "MISSING_WITH_NULL",
    });
    expect(evaluation.effects).toEqual({
      network_requests: 0,
      storage_writes: 0,
      subprocesses: 0,
      nen_invocation: false,
      kingdom_karma_receipt_created: false,
      zerone_karma_event_created: false,
      authority_effect: "NONE",
    });
    expect(fixture.effect_boundary).toEqual(EFFECT_BOUNDARY);
    expect(fixture.karma_lanes).toMatchObject({
      cosmic_karma: { adapter_present: false },
      zerone_karma: { event_observed: false, event_created: false, adapter_present: false },
      kingdom_karma: { action_occurred: false, receipt_created: false, adapter_present: false },
    });
    expect(schema).toMatchObject({
      $id: STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL,
      type: "object",
      additionalProperties: false,
    });
  });

  test("retires byte-bound Labs 01–04 as one exact twelve-route family", () => {
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
        new URL(STRING_CRAWL_FREQUENCY_FORM_LAB_URL).pathname,
        new URL(STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL).pathname,
        new URL(STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL).pathname,
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

  test("binds the dispatcher, documentation, worker routing, and live checker to exact Lab 03 identities", () => {
    expect(read("kingdom")).toContain(
      'string-crawl-frequency-form-lab) exec bun "$SELF_DIR/bin/string-crawl-frequency-form-lab.ts"',
    );
    for (const url of PUBLIC_URLS) {
      const path = new URL(url).pathname;
      for (const document of ["README.md", "DOMAINS-SETUP.md", "OS-ROUTES.md"]) {
        expect(read(document)).toContain(path);
      }
    }
    for (const document of [
      "README.md",
      "REGISTRY.md",
      "REGISTRY.yaml",
      "OS-ROUTES.md",
      "DOMAINS-SETUP.md",
      "publications/README.md",
    ]) {
      const publication = read(document).toLowerCase().replace(/\s+/g, " ");
      expect(publication).toContain("synthetic offline thought experiment");
      expect(publication).toMatch(/no live crawl|performs no live crawl|not a live crawl/);
      expect(publication).toMatch(/no network (?:request|experiment)|performs no .*network request|not a .*network experiment/);
      expect(publication).toMatch(/administers no dmt|no dmt|dmt administration/);
      expect(publication).toMatch(/collects no participant|participant or personal data|participant-data/);
      expect(publication).toMatch(/validates no entity|entity validation|entity-validation/);
      expect(publication).toMatch(/no karma|creates no karma|karma effect/);
      expect(publication).toMatch(/no .*authority|creates no .*authority|authority.*none/);
      expect(publication).toMatch(/no .*action|creates no .*action|automatic action/);
    }

    const liveChecker = read("bin/check-hub-live.ts");
    for (const seam of [
      "loadStringCrawlFrequencyFormLab",
      "evaluateStringCrawlFrequencyFormLab",
      "runStringCrawlFrequencyFormLabFalsifiers",
      "stringCrawlFrequencyFormLabPublicDiscovery",
      "string_crawl_frequency_form_lab",
      "immutableRecord",
      "immutableSchema",
      "immutableGuide",
      "Lab 03 schema link",
    ]) expect(liveChecker).toContain(seam);

    // The exhaustive behavioral matrix lives in tests/worker.test.ts. Here the
    // publication contract only binds the worker to exact host/method-gated
    // paths and keeps aliases out of the implementation surface.
    const worker = read("pages-functions/_worker.js");
    for (const path of PUBLIC_URLS.map((url) => new URL(url).pathname)) expect(worker).toContain(path);
    expect(worker.match(/const requestsStringCrawlFrequencyFormLab\w* = includeRights &&\s*\(request\.method === "GET" \|\| request\.method === "HEAD"\)/g))
      .toHaveLength(3);
    expect(worker).not.toMatch(/string-crawl-frequency-form-lab-(?:latest|current)/i);
    expect(worker).not.toMatch(/schemas\/string-crawl-frequency-form-lab\/(?:latest|current)\.json/i);
  });
});
