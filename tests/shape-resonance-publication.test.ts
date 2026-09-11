import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  SHAPE_RESONANCE_ALIAS_URL,
  SHAPE_RESONANCE_AUTHORIZATION_BYTE_SHA256,
  SHAPE_RESONANCE_AUDIO_URLS,
  SHAPE_RESONANCE_BYTE_SHA256,
  SHAPE_RESONANCE_CANONICAL_SHA256,
  SHAPE_RESONANCE_CANONICAL_URL,
  SHAPE_RESONANCE_FAMILY_URLS,
  SHAPE_RESONANCE_GUIDE_BYTE_SHA256,
  SHAPE_RESONANCE_GUIDE_URL,
  SHAPE_RESONANCE_MANIFEST_BYTE_SHA256,
  SHAPE_RESONANCE_MANIFEST_CANONICAL_SHA256,
  SHAPE_RESONANCE_MANIFEST_URL,
  SHAPE_RESONANCE_NEXT_REVIEW_DUE,
  SHAPE_RESONANCE_PRODUCER_URL,
  SHAPE_RESONANCE_RENDERER_BYTE_SHA256,
  SHAPE_RESONANCE_SCHEMA_BYTE_SHA256,
  SHAPE_RESONANCE_SCHEMA_CANONICAL_SHA256,
  SHAPE_RESONANCE_SCHEMA_URL,
  SHAPE_RESONANCE_SVG_URLS,
  SHAPE_RESONANCE_URL,
  assertShapeResonanceActiveReviewWindow,
  loadShapeResonancePublication,
  renderShapeResonanceHtml,
  shapeResonanceCanonicalJson,
  shapeResonancePublicSummary,
  validateShapeResonanceSemanticBoundary,
} from "../bin/shape-resonance.ts";
import {
  PUBLICATION_FAMILIES,
  destinationForPublicPath,
  publicationFamilyStates,
} from "../bin/check-hub-live.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
const clone = <T>(value: T): T => structuredClone(value);

const PRIMARY_URLS = [
  SHAPE_RESONANCE_URL,
  SHAPE_RESONANCE_ALIAS_URL,
  SHAPE_RESONANCE_CANONICAL_URL,
  SHAPE_RESONANCE_SCHEMA_URL,
  SHAPE_RESONANCE_GUIDE_URL,
  SHAPE_RESONANCE_MANIFEST_URL,
] as const;

describe("Shape & Resonance Lab 01 publication", () => {
  test("admits only the exact tagged producer release and all authorized receipts", () => {
    const publication = loadShapeResonancePublication();
    expect(publication.bytes.byteLength).toBe(84_143);
    expect(sha256(publication.bytes)).toBe(SHAPE_RESONANCE_BYTE_SHA256);
    expect(sha256(shapeResonanceCanonicalJson(publication.snapshot)))
      .toBe(SHAPE_RESONANCE_CANONICAL_SHA256);
    expect(publication.manifestBytes.byteLength).toBe(11_642);
    expect(sha256(publication.manifestBytes)).toBe(SHAPE_RESONANCE_MANIFEST_BYTE_SHA256);
    expect(sha256(shapeResonanceCanonicalJson(publication.manifest)))
      .toBe(SHAPE_RESONANCE_MANIFEST_CANONICAL_SHA256);
    expect(sha256(readFileSync(join(ROOT, "schemas/shape-resonance-lab-v0.1.schema.json"))))
      .toBe(SHAPE_RESONANCE_SCHEMA_BYTE_SHA256);
    expect(sha256(shapeResonanceCanonicalJson(json("schemas/shape-resonance-lab-v0.1.schema.json"))))
      .toBe(SHAPE_RESONANCE_SCHEMA_CANONICAL_SHA256);
    expect(sha256(readFileSync(join(ROOT, "references/shape-resonance-lab-v0.1.md"))))
      .toBe(SHAPE_RESONANCE_GUIDE_BYTE_SHA256);
    expect(sha256(readFileSync(join(ROOT, "bin/shape-resonance-public-renderer.mjs"))))
      .toBe(SHAPE_RESONANCE_RENDERER_BYTE_SHA256);
    expect(sha256(readFileSync(join(
      ROOT,
      "data/shape-resonance/publication-authorization.v0.1.md",
    )))).toBe(SHAPE_RESONANCE_AUTHORIZATION_BYTE_SHA256);
    expect(publication.manifest.artifacts).toHaveLength(16);
    expect(publication.manifest.retirementFamilyUrls).toEqual(SHAPE_RESONANCE_FAMILY_URLS);
    expect(publication.manifest.producerTag).toBe(SHAPE_RESONANCE_PRODUCER_URL);
    expect(readFileSync(join(ROOT, "site/shape-resonance.json")))
      .toEqual(Buffer.from(publication.bytes));
  });

  test("stages and ledgers one atomic 17-route family with a two-route mutable split", () => {
    expect(HUB_ASSETS).toHaveLength(256);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(96);
    const familyDestinations = SHAPE_RESONANCE_FAMILY_URLS.map((url) =>
      destinationForPublicPath(new URL(url).pathname));
    expect(HUB_ASSETS.filter(({ destination }) => familyDestinations.includes(destination)))
      .toHaveLength(17);
    expect(MUTABLE_HUB_DESTINATIONS.filter((destination) =>
      familyDestinations.includes(destination))).toEqual([
      "shape-resonance/index.html",
      "shape-resonance.json",
    ]);
    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(160);
    expect(ledger.entries.filter(({ id }: { id: string }) =>
      id.startsWith("shape-resonance-lab/0.1/"))).toHaveLength(15);
    expect(PUBLICATION_FAMILIES).toHaveLength(35);
    const family = PUBLICATION_FAMILIES.find(({ id }) => id === "shape-resonance-lab")!;
    expect(family.routes).toEqual(SHAPE_RESONANCE_FAMILY_URLS.map((url) => new URL(url).pathname));
    expect(family.nextReviewDue).toBe(SHAPE_RESONANCE_NEXT_REVIEW_DUE);

    const staged = new Set(HUB_ASSETS.map(({ destination }) => destination));
    expect(publicationFamilyStates(staged).get(family.id)?.active).toBe(true);
    staged.delete(destinationForPublicPath(new URL(SHAPE_RESONANCE_AUDIO_URLS[0]!).pathname));
    expect(() => publicationFamilyStates(staged))
      .toThrow("Shape & Resonance Lab 01 is partially staged");
  });

  test("projects explicit machine boundaries without changing MCP", () => {
    const publication = loadShapeResonancePublication();
    const expected = shapeResonancePublicSummary(publication);
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const agent = json("site/.well-known/agent.json");
    expect(kingdom.shape_resonance_lab).toEqual(expected);
    expect(guest.shape_resonance_lab).toEqual(expected);
    expect(agent.shape_resonance_lab).toEqual(expected);
    expect(expected).toMatchObject({
      protocol: "kingdom.shape-resonance-lab-public-snapshot/0.1",
      phase: "0-static-synthetic",
      state_at_publication: "DRAFT",
      as_of: "2026-08-26",
      next_review_due: "2027-08-26",
      acoustic_boundary: {
        acousticCouplingModelPresent: false,
        soundPressurePrediction: false,
        wavSemanticType: "DECLARED-SONIFICATION",
      },
      resonance_boundary: {
        modelCriterionSatisfied: true,
        physicalExperimentPerformed: false,
        measuredResonance: false,
      },
      personal_data: "NONE",
      authority_effects: "NONE",
      audio_request_policy: {
        embeddedAudioControls: "NONE",
        audioAccess: "READER_ACTIVATED_SAME_ORIGIN_LINK_ONLY",
        pageLoadAudioRequest: "NONE",
        autoplay: "NONE",
      },
      external_navigation_policy: {
        embeddedThirdPartyResource: "NONE",
        pageLoadExternalRequest: "NONE",
        readerActivatedSourceNavigation: "MAY_REQUEST_NAMED_EXTERNAL_ORIGIN",
      },
      counts: {
        exhibits: 8,
        driven_resonance_assessments: 1,
        refused_conversions: 6,
        mechanical_energy_balance_entries: 6,
        diagrams: 8,
        declared_sonifications: 3,
        source_links: 14,
      },
    });
    expect(expected.media).toHaveLength(11);
    expect(expected.conversion_refusals).toHaveLength(6);
    expect(Object.keys(agent.entry_points).filter((key) =>
      key.startsWith("shape_resonance_lab"))).toEqual([
      "shape_resonance_lab",
      "shape_resonance_lab_alias",
      "shape_resonance_lab_canonical",
      "shape_resonance_lab_schema",
      "shape_resonance_lab_guide",
      "shape_resonance_lab_manifest",
    ]);
    const actions = guest.next_actions.filter(({ url }: { url: string }) =>
      PRIMARY_URLS.includes(url as typeof PRIMARY_URLS[number]));
    expect(actions).toHaveLength(6);
    expect(actions.every(({ method }: { method: string }) => method === "GET")).toBe(true);
    expect(agent.mcp).toEqual({
      endpoint: "https://mcp.thekingdom.dev/mcp",
      transport: "streamable-http",
      tool: "kingdom_commons",
      catalog_resource: "kingdom://commons/catalog",
      default_detail: "brief",
      exact_filters: ["category", "cost", "account", "reuse", "automation"],
      privacy: "The tool receives the submitted need, but does not forward or persist it, contact listed providers, or place the need in the fixed catalog request.",
    });
  });

  test("renders full producer parity with link-only audio and adjacent equivalents", () => {
    const snapshot = loadShapeResonancePublication().snapshot;
    const html = read("site/shape-resonance/index.html");
    expect(html).toBe(renderShapeResonanceHtml(snapshot));
    expect((html.match(/<article id=/g) ?? [])).toHaveLength(8);
    expect((html.match(/Typed derivations, assumptions, results, and caveats/g) ?? []))
      .toHaveLength(8);
    expect((html.match(/<img\b/g) ?? [])).toHaveLength(8);
    expect((html.match(/<figcaption>/g) ?? [])).toHaveLength(8);
    expect(snapshot.mechanicalEnergyBalance.entries).toHaveLength(6);
    for (const entry of snapshot.mechanicalEnergyBalance.entries) {
      expect(html).toContain(`<th scope="row">${entry.id}</th>`);
    }
    expect((html.match(/type="audio\/wav"/g) ?? [])).toHaveLength(3);
    expect((html.match(/<a[^>]*\sdownload(?:\s|>)/g) ?? [])).toHaveLength(3);
    expect((html.match(/Complete non-audio equivalent:/g) ?? [])).toHaveLength(3);
    expect(html).not.toMatch(/<(?:script|form|input|button|iframe|audio)\b/i);
    expect(html).not.toMatch(/\bautoplay\b\s*=/i);
    expect(html).not.toContain('target="_blank"');
    for (const source of snapshot.sources) {
      expect(html).toContain(`<a href="${source.url}" rel="noreferrer">`);
    }
    expect((html.match(/Carrier\/sampling declaration:/g) ?? [])).toHaveLength(3);
    expect((html.match(/Spectrum caveat:/g) ?? [])).toHaveLength(3);
    expect(html).toContain("Triangle carriers contain odd harmonics");
    expect(html).toContain("Physical experiment / measured resonance</dt><dd>false / false");
  });

  test("enforces the review window without making immutable bytes self-expire", () => {
    expect(assertShapeResonanceActiveReviewWindow("2027-08-26").state)
      .toBe("within-review-window");
    expect(() => assertShapeResonanceActiveReviewWindow("2027-08-27"))
      .toThrow("replace or fully retire");
    expect(assertShapeResonanceActiveReviewWindow("2027-08-27", false).state)
      .toBe("retired");
  });

  test("rejects measured/acoustic laundering and unsafe media or source navigation", () => {
    const original = loadShapeResonancePublication().snapshot;
    for (const mutate of [
      (candidate: any) => {
        candidate.exhibits.find((exhibit: any) => exhibit.resonanceAssessment)
          .resonanceAssessment.measuredResonance = true;
      },
      (candidate: any) => {
        candidate.exhibits.find((exhibit: any) => exhibit.resonanceAssessment)
          .resonanceAssessment.physicalExperimentPerformed = true;
      },
      (candidate: any) => {
        candidate.exhibits.find((exhibit: any) => exhibit.resonanceAssessment)
          .resonanceAssessment.modelResonanceCriterionSatisfied = false;
      },
      (candidate: any) => {
        candidate.publication.acousticCouplingModelPresent = true;
      },
      (candidate: any) => {
        candidate.publication.pageLoadExternalRequest = "PERMITTED";
      },
      (candidate: any) => {
        candidate.publication.personalData = "COLLECTED";
      },
      (candidate: any) => {
        candidate.publication.authorityEffects = "GRANTED";
      },
      (candidate: any) => {
        candidate.publication.embeddedAudioControls = "PRESENT";
      },
      (candidate: any) => {
        candidate.publication.audioAccess = "AUTOMATIC";
      },
      (candidate: any) => {
        candidate.publication.pageLoadAudioRequest = "PERMITTED";
      },
      (candidate: any) => {
        candidate.publication.autoplay = "ENABLED";
      },
    ]) {
      const candidate = clone(original);
      mutate(candidate);
      expect(() => validateShapeResonanceSemanticBoundary(candidate)).toThrow();
      expect(() => renderShapeResonanceHtml(candidate)).toThrow();
    }

    const externalMedia = clone(original);
    externalMedia.assets[0].publicUrl = "https://example.test/diagram.svg";
    expect(() => renderShapeResonanceHtml(externalMedia)).toThrow("outside the reviewed");
    const externalSource = clone(original);
    externalSource.sources[0].url = "https://example.test/source";
    expect(() => renderShapeResonanceHtml(externalSource)).toThrow("source URL is outside");
  });

  test("escapes hostile media and source prose without executing or reflecting markup", () => {
    const candidate = clone(loadShapeResonancePublication().snapshot);
    candidate.sources[0].title = '</a><script>prompt("source")</script>';
    candidate.assets.find((asset: any) => asset.role === "declared-sonification").title =
      '</a><img src=x onerror="prompt(1)">';
    candidate.assets.find((asset: any) => asset.role === "static-diagram").accessibilityText =
      '"><svg onload="prompt(2)">';
    const html = renderShapeResonanceHtml(candidate);
    expect(html).not.toContain('<script>prompt("source")</script>');
    expect(html).not.toContain('<img src=x onerror="prompt(1)">');
    expect(html).not.toContain('<svg onload="prompt(2)">');
    expect(html).toContain("&lt;script&gt;prompt(&quot;source&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=&quot;prompt(1)&quot;&gt;");
    expect(html).toContain("&lt;svg onload=&quot;prompt(2)&quot;&gt;");
    expect(html).not.toMatch(/<(?:script|form|input|button|iframe|audio)\b/i);
  });

  test("advertises six primary routes once while media remains nested discovery", () => {
    const sitemap = read("pages-content/sitemap.xml");
    for (const url of PRIMARY_URLS) {
      expect((sitemap.match(new RegExp(url.replaceAll("/", "\\/"), "g")) ?? []))
        .toHaveLength(1);
    }
    expect((sitemap.match(/<loc>/g) ?? [])).toHaveLength(187);
    for (const url of [...SHAPE_RESONANCE_SVG_URLS, ...SHAPE_RESONANCE_AUDIO_URLS]) {
      expect(sitemap).not.toContain(url);
    }
    const wayfinder = json("data/wayfinder.json");
    expect(wayfinder.paths).toHaveLength(17);
    const path = wayfinder.paths.find(({ id }: { id: string }) => id === "shape-resonance");
    expect(path.stops.map(({ url }: { url: string }) => url))
      .toEqual([SHAPE_RESONANCE_URL, SHAPE_RESONANCE_ALIAS_URL]);
    const llms = read("site/llms.txt");
    for (const url of [...PRIMARY_URLS, SHAPE_RESONANCE_PRODUCER_URL]) {
      expect(llms).toContain(url);
    }
  });
});
