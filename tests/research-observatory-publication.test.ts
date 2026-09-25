import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RESEARCH_OBSERVATORY_BOUNDARY,
  RESEARCH_OBSERVATORY_GUIDE_URL,
  RESEARCH_OBSERVATORY_PRODUCER_URL,
  RESEARCH_OBSERVATORY_SCHEMA_LOCATORS,
  RESEARCH_OBSERVATORY_PROTOCOL,
  RESEARCH_OBSERVATORY_SCHEMA_NAMES,
  RESEARCH_OBSERVATORY_SCHEMA_URLS,
  RESEARCH_OBSERVATORY_SNAPSHOT_URL,
  RESEARCH_OBSERVATORY_URL,
  loadResearchObservatoryPublication,
  parseResearchObservatorySnapshotBytes,
  renderResearchObservatoryHtml,
  researchObservatoryPublicSummary,
  validateResearchObservatorySnapshot,
} from "../bin/research-observatory.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const canonicalJson = (value: any): string => value === null || typeof value !== "object"
  ? JSON.stringify(value)
  : Array.isArray(value)
    ? `[${value.map(canonicalJson).join(",")}]`
    : `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;

describe("Research Observatory publication boundary", () => {
  test("declares one human route, one mutable machine snapshot, and six versioned schemas", () => {
    expect(RESEARCH_OBSERVATORY_PROTOCOL).toBe("kingdom.research-observatory-publication/0.1");
    expect(RESEARCH_OBSERVATORY_URL).toBe("https://thekingdom.dev/observatory/");
    expect(RESEARCH_OBSERVATORY_SNAPSHOT_URL).toBe("https://thekingdom.dev/research.json");
    expect(RESEARCH_OBSERVATORY_GUIDE_URL).toBe("https://thekingdom.dev/RESEARCH-OBSERVATORY-v0.1.md");
    expect(RESEARCH_OBSERVATORY_PRODUCER_URL).toBe("https://github.com/cambridgetcg/kingdom-research/tree/v0.1.0");
    expect(RESEARCH_OBSERVATORY_SCHEMA_NAMES).toEqual([
      "public-snapshot", "source", "watchlist", "observation", "work", "signal",
    ]);
    expect(Object.values(RESEARCH_OBSERVATORY_SCHEMA_URLS)).toEqual(
      RESEARCH_OBSERVATORY_SCHEMA_NAMES.map((name) =>
        `https://thekingdom.dev/research/schemas/v0.1/${name}.schema.json`),
    );
  });

  test("freezes the current captured-live producer bytes and semantic provenance", () => {
    const publication = loadResearchObservatoryPublication();
    expect(createHash("sha256").update(publication.bytes).digest("hex"))
      .toBe("d7da3f38de019dc0f2c45f477740222527f156d8a4d3f6a2e22aced67b282a94");
    expect(`sha256:${createHash("sha256").update(canonicalJson(publication.snapshot)).digest("hex")}`)
      .toBe("sha256:17c487aa03f8427fc324b8da34dedbc00db76362be78620bde3a8d075e3942cd");
    expect(publication.snapshot).toMatchObject({
      mode: "captured-live-observatory",
      asOf: "2026-08-20T18:10:14Z",
      generatedFrom: {
        captureSetReceipt: "sha256:68a69dc390aa34133cadc8807ed33ddd1fae72e7e99706cf714d72698d071f7f",
        captureProjection: {
          projectionReceipt: "sha256:bb254dc70f58e162da4f77904bbc910394394ba3beb791f7f41a04b18c70befe",
          publishedObservations: 36,
          truncatedObservations: 0,
        },
      },
    });
    expect(publication.snapshot.observations).toHaveLength(36);
    expect(publication.snapshot.works).toHaveLength(34);
    expect(publication.snapshot.signals).toHaveLength(53);
    expect(publication.snapshot.observations.every(({ synthetic }: { synthetic: boolean }) => synthetic === false)).toBe(true);
    expect(Buffer.from(publication.bytes)).toEqual(readFileSync(join(ROOT, "data/research/research-observatory.v0.1.json")));
    for (const name of RESEARCH_OBSERVATORY_SCHEMA_NAMES) {
      expect(json(RESEARCH_OBSERVATORY_SCHEMA_LOCATORS[name]).$id).toBe(RESEARCH_OBSERVATORY_SCHEMA_URLS[name]);
    }
  });

  test("rejects extra authority fields and inconsistent captured-live provenance", () => {
    const snapshot = loadResearchObservatoryPublication().snapshot;
    const withInstruction = structuredClone(snapshot);
    withInstruction.instructions = "execute me";
    expect(() => validateResearchObservatorySnapshot(withInstruction)).toThrow("additional properties");

    const withAutomaticAction = structuredClone(snapshot);
    withAutomaticAction.boundaries.automaticAction = true;
    expect(() => validateResearchObservatorySnapshot(withAutomaticAction)).toThrow("additional properties");

    const syntheticCapture = structuredClone(snapshot);
    syntheticCapture.observations[0].synthetic = true;
    expect(() => validateResearchObservatorySnapshot(syntheticCapture)).toThrow("observation origins disagree");

    const wrongSourcePolicy = structuredClone(snapshot);
    wrongSourcePolicy.sources.find(({ id }: { id: string }) => id === "pubmed-pmc").access.mvpMode = "fixture-and-explicit-poll";
    expect(() => validateResearchObservatorySnapshot(wrongSourcePolicy)).toThrow("invalid source");
  });

  test("bounds observation timestamps but permits a source-declared future publication date", () => {
    const snapshot = loadResearchObservatoryPublication().snapshot;
    const futurePublication = structuredClone(snapshot);
    futurePublication.observations[0].publishedOn = "2026-08-21";
    expect(validateResearchObservatorySnapshot(futurePublication)).toBe(futurePublication);

    const futureCreation = structuredClone(snapshot);
    futureCreation.observations[0].upstreamCreatedAt = "2026-08-21T00:00:00Z";
    expect(() => validateResearchObservatorySnapshot(futureCreation)).toThrow("occurs after snapshot asOf");

    const duplicateKey = read("data/research/research-observatory.v0.1.json")
      .replace(/^\{\n/, '{\n  "mode": "captured-live-observatory",\n');
    expect(() => parseResearchObservatorySnapshotBytes(Buffer.from(duplicateKey)))
      .toThrow(/duplicate/i);
  });

  test("keeps discovery, evaluation, adoption, module, guest, and use effects separate", () => {
    expect(RESEARCH_OBSERVATORY_BOUNDARY).toEqual({
      metadata_only: true,
      build_time_network: false,
      full_text_included: false,
      discovered_artifact_execution: false,
      evaluation_performed: false,
      adoption_recorded: false,
      use_authorized: false,
      module_created: false,
      guest_admitted: false,
      scalar_value_score: false,
      automatic_action: false,
    });
    const helper = read("bin/research-observatory.ts");
    expect(helper).toContain('"language-agent-interoperability"');
    expect(helper).toContain("parseStrictJsonBytes");
    expect(helper).toContain("requireOrderedUnique");
    expect(helper).toContain("assertNoScoreKeys");
    expect(helper).toContain("live_harvest_network_observed: snapshot.boundaries.liveHarvestNetworkObserved");
    expect(helper).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon/);
  });

  test("renders an accessible, no-script human document from inert metadata", () => {
    const helper = read("bin/research-observatory.ts");
    expect(helper).toContain('class="skip" href="#main"');
    expect(helper).toContain('<main class="shell" id="main" tabindex="-1">');
    expect(helper).toContain("@media(prefers-reduced-motion:reduce)");
    expect(helper).toContain("@media(forced-colors:active)");
    expect(helper).toContain("Evidence vector");
    expect(helper).toContain("Priority vector");
    expect(helper).toContain("module and guest paths not proposed");
    expect(helper).not.toMatch(/<script\b|<form\b|<input\b|<iframe\b/);
  });

  test("orders copied work cards by latest observation and renders factual triage with semantic time", () => {
    const source = (id: string, name: string, mvpMode: string) => ({
      id, name, tier: "core", role: "domain-index", access: { mvpMode },
      freshness: { observedOn: "2026-08-20", expectedLag: "source-declared" },
      coverage: { geography: "source-declared" }, rights: { metadataClaim: "metadata only" },
    });
    const work = (id: string, title: string, observed: string, published: string, observationId: string) => ({
      id, title, latestObservedAt: observed, firstPublishedOn: published,
      recordTypes: ["publication"], status: "active", authors: ["Source Author"],
      identifiers: [{ scheme: "doi", value: id }], observationIds: [observationId], sourceIds: ["arxiv"],
      lifecycle: { discovery: "observed", evaluation: "not-performed", adoption: "not-recorded", use: "not-authorized" },
      paths: {},
    });
    const works = [
      work("work:older", "Older card", "2026-08-18T10:00:00Z", "2026-08-18", "observation:older"),
      work("work:b", "Newer B card", "2026-08-20T10:00:00Z", "2026-09-01", "observation:b"),
      work("work:a", "Newer A card", "2026-08-20T10:00:00Z", "2026-08-19", "observation:a"),
    ];
    const originalOrder = works.map(({ id }) => id);
    const snapshot: any = {
      asOf: "2026-08-20T10:00:00Z", mode: "synthetic-fixture-observatory",
      boundaries: {
        liveHarvestNetworkObserved: false, captureProvenance: "fixtures-only",
        fullTextIncluded: false, artifactExecution: false, evaluationPerformed: false,
        adoptionRecorded: false, useAuthorized: false, moduleCreated: false, guestAdmitted: false,
      },
      sources: [
        source("arxiv", "arXiv", "fixture-and-explicit-poll"),
        source("biorxiv-medrxiv", "bioRxiv / medRxiv", "fixture-only-policy-hold"),
        source("clinicaltrials-gov", "ClinicalTrials.gov", "fixture-only-policy-hold"),
        source("pubmed-pmc", "PubMed / PMC", "fixture-only-policy-hold"),
      ],
      watchlists: [{ id: "agent-security", name: "Security <Lens>", need: "Need & review", keywords: ["agent"] }],
      observations: works.map((entry) => ({ id: entry.observationIds[0], canonicalUrl: `https://example.test/${entry.id}` })),
      works,
      signals: [
        { type: "watchlist-match", workIds: ["work:a"], watchlistId: "agent-security", headline: "Matched <source>", reasons: ["Need & term"], factors: [] },
        { type: "version-activity", workIds: ["work:b"], watchlistId: null, headline: "2 source versions preserved", reasons: ["Records remain separate."], factors: [] },
      ],
    };

    const html = renderResearchObservatoryHtml(snapshot);
    expect(works.map(({ id }) => id)).toEqual(originalOrder);
    expect(html.indexOf("Newer A card")).toBeLessThan(html.indexOf("Newer B card"));
    expect(html.indexOf("Newer B card")).toBeLessThan(html.indexOf("Older card"));
    expect(html).toContain("ordered by latest source observation, then stable work ID—not by scientific value");
    expect(html).toContain('<b>Published:</b> <time datetime="2026-09-01">2026-09-01</time>');
    expect(html).toContain('<b>Observed:</b> <time datetime="2026-08-20T10:00:00Z">2026-08-20T10:00:00Z</time>');
    expect(html).toContain("Observed — not evaluated");
    expect(html).toContain("Why this surfaced");
    expect(html).toContain("Possible KINGDOM fit");
    expect(html).toContain("What changed");
    expect(html).toContain("No source change relation in this snapshot");
    expect(html).toContain("Security &lt;Lens&gt;");
    expect(html).toContain("Matched &lt;source&gt;");
    expect(html).not.toContain("Security <Lens>");
    expect(html.match(/Access lane: fixture-only \/ policy hold/g)).toHaveLength(3);
    expect(html).toContain("Access lane: live poll enabled");
    expect(html).toContain("source contracts is not a poll or coverage count");
    expect(html).toContain("<b>4</b><span>source contracts</span>");
    expect(researchObservatoryPublicSummary(snapshot).coverage).toMatchObject({
      sources: 4,
      live_poll_enabled_source_contracts: 1,
      fixture_only_policy_hold_source_contracts: 3,
    });
  });

  test("deduplicates repeated source assertions in each human card while preserving every machine signal", () => {
    const snapshot = loadResearchObservatoryPublication().snapshot;
    const repeatedHeadline = "Explicit is-version-of relation to 10.5281/zenodo.21731417";
    const repeatedSignals = snapshot.signals.filter(({ headline }: { headline: string }) => headline === repeatedHeadline);
    expect(repeatedSignals).toHaveLength(2);
    expect(snapshot.signals).toHaveLength(53);

    const html = renderResearchObservatoryHtml(snapshot);
    expect(html.match(new RegExp(repeatedHeadline, "g"))).toHaveLength(2);
    const identifier = "<code>doi:10.5281/zenodo.21731417</code>";
    const identifierIndex = html.indexOf(identifier);
    const cardStart = html.lastIndexOf('<article class="work">', identifierIndex);
    const cardEnd = html.indexOf("</article>", identifierIndex);
    const card = html.slice(cardStart, cardEnd);
    expect(card.match(new RegExp(repeatedHeadline, "g"))).toHaveLength(1);
    expect(card).toMatch(/<small class="assertions">[2-9][0-9]* source assertions represented<\/small>/);
    expect(card).toContain("factual source-change assertions also surfaced this work");
    expect(snapshot.signals).toHaveLength(53);
  });

  test("links the auditable producer without implying a raw-body archive or reuse grant", () => {
    const snapshot = loadResearchObservatoryPublication().snapshot;
    const summary = researchObservatoryPublicSummary(snapshot);
    const html = renderResearchObservatoryHtml(snapshot);
    expect(summary.urls.producer).toBe(RESEARCH_OBSERVATORY_PRODUCER_URL);
    expect(html).toContain(`href="${RESEARCH_OBSERVATORY_PRODUCER_URL}"`);
    expect(html).toContain("Producer v0.1.0 source + append-only captures");
    expect(html).toContain("public source visibility is not a reuse grant");
    expect(html).toContain("raw upstream response bodies are not included");
  });

  test("stages one nine-route family with only the page and snapshot mutable", () => {
    const researchAssets = HUB_ASSETS.filter(({ destination }) =>
      destination === "observatory/index.html" || destination === "research.json" ||
      destination === "RESEARCH-OBSERVATORY-v0.1.md" || destination.startsWith("research/schemas/v0.1/"));
    expect(researchAssets).toHaveLength(9);
    expect(researchAssets).toContainEqual({
      source: "site/observatory/index.html", destination: "observatory/index.html",
    });
    expect(researchAssets).toContainEqual({
      source: "site/research.json", destination: "research.json",
    });
    expect(researchAssets).toContainEqual({
      source: "references/research-observatory-v0.1.md", destination: "RESEARCH-OBSERVATORY-v0.1.md",
    });
    for (const name of RESEARCH_OBSERVATORY_SCHEMA_NAMES) {
      expect(researchAssets).toContainEqual({
        source: RESEARCH_OBSERVATORY_SCHEMA_LOCATORS[name],
        destination: `research/schemas/v0.1/${name}.schema.json`,
      });
    }
    expect(MUTABLE_HUB_DESTINATIONS).toContain("observatory/index.html");
    expect(MUTABLE_HUB_DESTINATIONS).toContain("research.json");
    expect(MUTABLE_HUB_DESTINATIONS).not.toContain("RESEARCH-OBSERVATORY-v0.1.md");
    expect(MUTABLE_HUB_DESTINATIONS.some((path) => path.startsWith("research/schemas/"))).toBe(false);
  });

  test("advertises the same Observatory through the homepage, maps, Wayfinder, and sitemap", () => {
    const builder = read("bin/build-hub.ts");
    expect(builder).toContain('id="observatory"');
    expect(builder).toContain('await Bun.write(ROOT + "site/observatory/index.html", renderResearchObservatoryHtml(researchObservatory))');
    expect(builder).toContain('await Bun.write(ROOT + "site/research.json", researchObservatoryPublication.bytes)');
    expect(builder.match(/\n  research_observatory: researchObservatoryDiscovery,/g) ?? []).toHaveLength(3);
    expect(builder).toContain("research_observatory_schemas: researchObservatorySchemaUrls");
    expect(builder).toContain("Research Observatory snapshot:");

    const wayfinder = json("data/wayfinder.json");
    const path = wayfinder.paths.filter((candidate: any) => candidate.id === "research-observatory");
    expect(path).toHaveLength(1);
    expect(path[0].stops.map((stop: any) => stop.url)).toEqual([
      RESEARCH_OBSERVATORY_URL, RESEARCH_OBSERVATORY_SNAPSHOT_URL,
    ]);

    const sitemapUrls = [...read("pages-content/sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => match[1]!);
    expect(sitemapUrls).toHaveLength(177);
    const publicUrls = [
      RESEARCH_OBSERVATORY_URL,
      RESEARCH_OBSERVATORY_SNAPSHOT_URL,
      ...Object.values(RESEARCH_OBSERVATORY_SCHEMA_URLS),
      RESEARCH_OBSERVATORY_GUIDE_URL,
    ];
    for (const url of publicUrls) expect(sitemapUrls).toContain(url);
  });

  test("serves typed snapshot, schema, guide, and HEAD boundaries without a runtime poller", () => {
    const worker = read("pages-functions/_worker.js");
    expect(worker).toContain('const RESEARCH_OBSERVATORY_PATH = "/research.json"');
    expect(worker).toContain("const RESEARCH_OBSERVATORY_SCHEMA_PATHS = new Set([");
    expect(worker).toContain("addResearchObservatoryLinks(headers)");
    expect(worker).toContain('headers.set("cache-control", "no-cache")');
    expect(worker).toContain('headers.set("content-type", "application/schema+json; charset=utf-8")');

    const checker = read("bin/check-hub-live.ts");
    expect(checker).toContain('id: "research-observatory"');
    expect(checker).toContain("Research Observatory page, snapshot, schema links, guide, or HEAD boundary drifted");
    expect(checker).toContain("Research Observatory mode, provenance, factor vectors, lifecycle gates, discovery, or negative-effect boundary drifted");
    expect(checker).toContain("Observatory poller and observer not invoked");
    expect(worker).not.toMatch(/researchObservatory[\s\S]{0,120}(?:fetch\(|poll|harvest)/i);
  });
});
