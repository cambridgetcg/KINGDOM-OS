import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { hasExactCacheDirectives } from "../bin/check-hub-live.ts";
import { parseStrictJsonBytes } from "../bin/principality.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import {
  UK_GOVERNMENT_ENGINE_ALIAS_LOCATOR,
  UK_GOVERNMENT_ENGINE_ALIAS_URL,
  UK_GOVERNMENT_ENGINE_BYTE_SHA256,
  UK_GOVERNMENT_ENGINE_CANONICAL_SHA256,
  UK_GOVERNMENT_ENGINE_CANONICAL_URL,
  UK_GOVERNMENT_ENGINE_GUIDE_BYTE_SHA256,
  UK_GOVERNMENT_ENGINE_GUIDE_LOCATOR,
  UK_GOVERNMENT_ENGINE_GUIDE_URL,
  UK_GOVERNMENT_ENGINE_LOCATOR,
  UK_GOVERNMENT_ENGINE_PAGE_LOCATOR,
  UK_GOVERNMENT_ENGINE_PRODUCER_URL,
  UK_GOVERNMENT_ENGINE_PROTOCOL,
  UK_GOVERNMENT_ENGINE_SCHEMA_BYTE_SHA256,
  UK_GOVERNMENT_ENGINE_SCHEMA_CANONICAL_SHA256,
  UK_GOVERNMENT_ENGINE_SCHEMA_LOCATOR,
  UK_GOVERNMENT_ENGINE_SCHEMA_URL,
  UK_GOVERNMENT_ENGINE_URL,
  loadUkGovernmentEnginePublication,
  parseUkGovernmentEngineSnapshotBytes,
  renderUkGovernmentEngineHtml,
  ukGovernmentEngineCanonicalJson,
  ukGovernmentEnginePublicSummary,
  validateUkGovernmentEngineSnapshot,
} from "../bin/uk-government-engine.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const readBytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => readBytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const anchor = (id: string) => `record-${id.replaceAll(":", "-")}`;
const htmlEscape = (value: unknown) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

function changedSnapshot(change: (snapshot: any) => void): Uint8Array {
  const snapshot = structuredClone(loadUkGovernmentEnginePublication().snapshot);
  change(snapshot);
  return Buffer.from(JSON.stringify(snapshot));
}

describe("UK Government Engine Phase-0 publication", () => {
  test("keeps the frozen snapshot, schema, and guide bytes exact", () => {
    const snapshotBytes = readBytes(UK_GOVERNMENT_ENGINE_LOCATOR);
    const schemaBytes = readBytes(UK_GOVERNMENT_ENGINE_SCHEMA_LOCATOR);
    const guideBytes = readBytes(UK_GOVERNMENT_ENGINE_GUIDE_LOCATOR);
    expect(snapshotBytes.byteLength).toBe(196_005);
    expect(schemaBytes.byteLength).toBe(25_852);
    expect(guideBytes.byteLength).toBe(5_524);
    expect(sha256(snapshotBytes)).toBe(UK_GOVERNMENT_ENGINE_BYTE_SHA256);
    expect(sha256(schemaBytes)).toBe(UK_GOVERNMENT_ENGINE_SCHEMA_BYTE_SHA256);
    expect(sha256(guideBytes)).toBe(UK_GOVERNMENT_ENGINE_GUIDE_BYTE_SHA256);

    const publication = loadUkGovernmentEnginePublication();
    expect(Buffer.from(publication.bytes)).toEqual(snapshotBytes);
    expect(sha256(ukGovernmentEngineCanonicalJson(publication.snapshot)))
      .toBe(UK_GOVERNMENT_ENGINE_CANONICAL_SHA256);
    const schema = JSON.parse(schemaBytes.toString("utf8"));
    expect(schema.$id).toBe(UK_GOVERNMENT_ENGINE_SCHEMA_URL);
    expect(sha256(ukGovernmentEngineCanonicalJson(schema)))
      .toBe(UK_GOVERNMENT_ENGINE_SCHEMA_CANONICAL_SHA256);
  });

  test("declares one dated five-route family and its frozen producer", () => {
    expect(UK_GOVERNMENT_ENGINE_PROTOCOL).toBe("kingdom.government-engine-public-snapshot/0.1");
    expect(UK_GOVERNMENT_ENGINE_URL).toBe("https://thekingdom.dev/government-engine/");
    expect(UK_GOVERNMENT_ENGINE_ALIAS_URL).toBe("https://thekingdom.dev/government.json");
    expect(UK_GOVERNMENT_ENGINE_CANONICAL_URL)
      .toBe("https://thekingdom.dev/government/uk-government-engine-2026-08-21.json");
    expect(UK_GOVERNMENT_ENGINE_SCHEMA_URL)
      .toBe("https://thekingdom.dev/government/schemas/v0.1/public-snapshot.schema.json");
    expect(UK_GOVERNMENT_ENGINE_GUIDE_URL).toBe("https://thekingdom.dev/UK-GOVERNMENT-ENGINE-v0.1.md");
    expect(UK_GOVERNMENT_ENGINE_PRODUCER_URL)
      .toBe("https://github.com/cambridgetcg/kingdom-government-engine/tree/v0.1.0");
  });

  test("loads the complete typed graph without collapsing its planes or effects", () => {
    const snapshot = loadUkGovernmentEnginePublication().snapshot;
    expect(snapshot.counts).toEqual({
      bodies: 39,
      claims: 58,
      externalBridges: 2,
      flows: 10,
      planes: 6,
      rails: 11,
      redressRoutes: 10,
      relatedResources: 2,
      relations: 34,
      sources: 66,
      unknowns: 10,
    });
    expect(snapshot.authorship).toEqual({
      compiledBy: "codex-assisted-publication",
      exactTextHumanReviewed: false,
      humanDirectionRecorded: true,
      origin: "maintainer-authorized-assisted-publication",
    });
    expect(snapshot.sourceLedgerPolicy.reviewMode).toBe("maintainer-authorized-assisted-url-review");
    expect(snapshot.sourceLedgerPolicy.integrity).toMatchObject({
      byteVerified: false,
      contentReceipt: null,
      exactTextHumanReviewed: false,
      rawBodyRetained: false,
      rawHashVerified: false,
      rawSha256: null,
    });
    expect(snapshot.sourceLedgerPolicy.rights).toEqual({
      licence: null,
      officialSourceBodyRepublished: false,
      publicationMode: "link-only",
      reuseLicenceInferred: false,
    });
    expect(Object.keys(snapshot.boundaries)).toHaveLength(32);
    expect(Object.values(snapshot.boundaries).every((value) => value === false)).toBe(true);
    expect(snapshot.boundaries.mcpExposure).toBe(false);
    expect(snapshot.boundaries.automaticAction).toBe(false);
    expect(snapshot.boundaries.eligibilityDetermination).toBe(false);
    expect(snapshot.boundaries.liabilityCalculation).toBe(false);
    expect(snapshot.boundaries.filingCapability).toBe(false);
    expect(snapshot.boundaries.paymentCapability).toBe(false);
  });

  test("keeps official evidence URL-linked while TaxSorted remains an exact-receipt crosswalk only", () => {
    const snapshot = loadUkGovernmentEnginePublication().snapshot;
    expect(snapshot.sources.every((source: any) =>
      source.checkedOn === snapshot.asOf &&
      source.integrity.exactTextHumanReviewed === false &&
      source.integrity.rawBodyRetained === false &&
      source.integrity.rawSha256 === null &&
      source.integrity.contentReceipt === null &&
      source.integrity.byteVerified === false &&
      source.rights.publicationMode === "link-only")).toBe(true);

    const receipts = new Map<string, any>();
    const selectedRecordIds = new Set<string>();
    for (const bridge of snapshot.externalBridges) {
      receipts.set(bridge.releaseLedgerReceipt.path, bridge.releaseLedgerReceipt);
      Object.values(bridge.captureReceipts).forEach((receipt: any) => receipts.set(receipt.path, receipt));
      expect(bridge.bridgeMode).toBe("receipt-bound-crosswalk-only");
      expect(bridge.boundaryScope).toBe("government-engine-public-projection");
      expect(Object.values(bridge.boundaries).every((value) => value === false)).toBe(true);
      for (const binding of bridge.selectedRecordBindings) selectedRecordIds.add(binding.recordId);
    }
    expect(receipts.size).toBe(9);
    expect([...receipts.values()].every((receipt) =>
      receipt.path.startsWith("vendor/captures/taxsorted/") &&
      receipt.url.startsWith("https://api.taxsorted.io/") &&
      /^sha256:[a-f0-9]{64}$/.test(receipt.sha256))).toBe(true);
    const claims = JSON.stringify(snapshot.claims);
    expect([...selectedRecordIds].some((id) => claims.includes(id))).toBe(false);
    expect(snapshot.relatedResources[0]).toMatchObject({
      duplicatedContent: false,
      relationship: "independent-non-official-receipt-bound-crosswalk",
      url: "https://taxsorted.io",
    });
  });

  test("rejects critical semantic drift even when a mutation remains self-consistent", () => {
    const cases: Array<[string, (snapshot: any) => void]> = [
      ["assisted authorship", (snapshot) => { snapshot.authorship.exactTextHumanReviewed = true; }],
      ["official host firewall", (snapshot) => { snapshot.sources[0].url = "https://evil.example/official"; }],
      ["URL observation date", (snapshot) => { snapshot.sources[0].checkedOn = "2026-08-20"; }],
      ["claim source reference", (snapshot) => { snapshot.claims[0].sourceIds[0] = "source:not-present"; }],
      ["body plane reference", (snapshot) => { snapshot.bodies[0].planeIds[0] = "plane:not-present"; }],
      ["relation endpoint", (snapshot) => { snapshot.relations[0].fromId = "body:not-present"; }],
      ["flow body reference", (snapshot) => { snapshot.flows[0].steps[0].bodyIds[0] = "body:not-present"; }],
      ["redress authority", (snapshot) => { snapshot.redressRoutes[0].eligibilityDetermined = true; }],
      ["negative boundary", (snapshot) => { snapshot.boundaries.automaticAction = true; }],
      ["closed MCP surface", (snapshot) => { snapshot.mcp = {}; }],
      ["official raw-body weakening", (snapshot) => { snapshot.sources[0].integrity.rawBodyRetained = true; }],
      ["TaxSorted record-text projection", (snapshot) => {
        snapshot.externalBridges[0].selectedRecordBindings[0].recordText = "projected upstream claim text";
      }],
      ["scalar score", (snapshot) => { snapshot.score = 1; }],
      ["related resource", (snapshot) => { snapshot.relatedResources[1].title = "Changed World Commons"; }],
      ["duplicate selected record", (snapshot) => {
        snapshot.externalBridges[1].selectedRecordBindings[0].recordId =
          snapshot.externalBridges[0].selectedRecordBindings[0].recordId;
      }],
      ["self-consistent receipt rewrite", (snapshot) => {
        const replacement = `sha256:${"0".repeat(64)}`;
        snapshot.externalBridges[0].captureReceipts.graph.sha256 = replacement;
        snapshot.externalBridges[0].graphManifestDatasetHash = replacement;
      }],
      ["self-consistent count rewrite", (snapshot) => {
        snapshot.bodies.pop();
        snapshot.counts.bodies -= 1;
      }],
    ];
    for (const [label, change] of cases) {
      expect(() => parseUkGovernmentEngineSnapshotBytes(changedSnapshot(change)), label).toThrow();
    }
  });

  test("fails closed on duplicate keys, invalid UTF-8, excess depth, oversized input, and symlinks", () => {
    const duplicate = read(UK_GOVERNMENT_ENGINE_LOCATOR)
      .replace(/^\{\n/, '{\n  "schema": "kingdom.government-engine-public-snapshot/0.1",\n');
    expect(() => parseUkGovernmentEngineSnapshotBytes(Buffer.from(duplicate))).toThrow(/duplicate key/i);
    expect(() => parseUkGovernmentEngineSnapshotBytes(
      Buffer.from('{"schema":"first","\\u0073chema":"decoded duplicate"}'),
    )).toThrow(/duplicate key/i);
    expect(() => parseUkGovernmentEngineSnapshotBytes(Buffer.from([0xff]))).toThrow(/valid UTF-8/i);
    expect(() => parseUkGovernmentEngineSnapshotBytes(Buffer.alloc(512 * 1024 + 1, 0x20)))
      .toThrow(/exceeds 524288 bytes/i);
    let nested: any = "end";
    for (let index = 0; index < 40; index += 1) nested = { nested };
    expect(() => parseUkGovernmentEngineSnapshotBytes(Buffer.from(JSON.stringify({ nested }))))
      .toThrow(/nesting exceeds 36/i);

    const temporary = mkdtempSync(join(ROOT, ".uk-government-engine-test-"));
    try {
      const link = join(temporary, "snapshot.json");
      symlinkSync(join(ROOT, UK_GOVERNMENT_ENGINE_LOCATOR), link);
      expect(() => loadUkGovernmentEnginePublication(`${basename(temporary)}/snapshot.json`))
        .toThrow(/symbolic-link/i);
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });

  test("preserves poison-looking own keys for canonical receipts without prototype pollution", () => {
    const specimens = [
      '{"safe":{"value":1}}',
      '{"safe":{"value":1},"__proto__":{"root":true}}',
      '{"safe":{"value":1,"__proto__":{"nested":true}}}',
      '{"safe":{"value":1},"constructor":{"own":true}}',
      '{"safe":{"value":1},"prototype":{"own":true}}',
    ].map((source) => parseStrictJsonBytes(Buffer.from(source), "Government Engine poison-key receipt fixture"));
    const receipts = specimens.map((specimen) => sha256(ukGovernmentEngineCanonicalJson(specimen)));
    expect(new Set(receipts).size).toBe(specimens.length);

    const value: any = parseStrictJsonBytes(Buffer.from(
      '{"__proto__":{"polluted":true},"constructor":"own","nested":{"prototype":"own","__proto__":{"inside":true}}}',
    ), "Government Engine combined poison-key fixture");
    expect(Object.hasOwn(value, "__proto__")).toBe(true);
    expect(Object.hasOwn(value, "constructor")).toBe(true);
    expect(Object.hasOwn(value.nested, "prototype")).toBe(true);
    expect(Object.hasOwn(value.nested, "__proto__")).toBe(true);
    expect(({} as any).polluted).toBeUndefined();
    const canonical = ukGovernmentEngineCanonicalJson(value);
    expect(canonical.match(/"__proto__"/g)).toHaveLength(2);
    expect(canonical).toContain('"constructor"');
    expect(canonical).toContain('"prototype"');
    expect(() => validateUkGovernmentEngineSnapshot(value)).toThrow(/closed schema|publication identity/i);
  });

  test("renders every body, typed relation, and claim in an accessible no-JavaScript atlas", () => {
    const snapshot = loadUkGovernmentEnginePublication().snapshot;
    const html = renderUkGovernmentEngineHtml(snapshot);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('class="skip" href="#main"');
    expect(html).toContain('<main class="shell" id="main" tabindex="-1">');
    expect(html).toContain("Thirty-nine named bodies");
    expect(html).toContain("Thirty-four institutional relations");
    expect(html).toContain("All fifty-eight bounded claims");
    expect(html).toContain("not a single hierarchy or chain of command");
    expect(html).toContain("exact record and claim text has not been separately human-reviewed");
    for (const plane of snapshot.planes) expect(html).toContain(`id="${anchor(plane.id)}"`);
    for (const body of snapshot.bodies) {
      expect(html).toContain(`id="${anchor(body.id)}"`);
      expect(html).toContain(`<code>${body.id}</code>`);
    }
    for (const relation of snapshot.relations) {
      expect(html).toContain(`id="${anchor(relation.id)}"`);
      expect(html).toContain(`<code>${relation.relationType}</code>`);
    }
    for (const claim of snapshot.claims) {
      expect(html).toContain(`id="${anchor(claim.id)}"`);
      expect(html).toContain(htmlEscape(claim.limitation));
    }
    for (const source of snapshot.sources) expect(html).toContain(`id="${anchor(source.id)}"`);
    for (const flow of snapshot.flows) {
      expect(html).toContain(`id="${anchor(flow.id)}"`);
      for (const step of flow.steps) {
        for (const bodyId of step.bodyIds) expect(html).toContain(`href="#${anchor(bodyId)}"`);
      }
    }
    for (const rail of snapshot.rails) expect(html).toContain(`id="${anchor(rail.id)}"`);
    for (const route of snapshot.redressRoutes) {
      expect(html).toContain(`id="${anchor(route.id)}"`);
      expect(html).toContain("<code>eligibilityDetermined</code>: false");
    }
    for (const unknown of snapshot.unknowns) expect(html).toContain(`id="${anchor(unknown.id)}"`);
    for (const bridge of snapshot.externalBridges) {
      expect(html).toContain(`id="${anchor(bridge.id)}"`);
      for (const binding of bridge.selectedRecordBindings) expect(html).toContain(binding.recordId);
    }
    for (const resource of snapshot.relatedResources) {
      expect(html).toContain(`id="${anchor(resource.id)}"`);
      for (const linkedId of resource.linkedRecordIds) expect(html).toContain(`<code>${linkedId}</code>`);
    }
    const officialUrls = new Set(snapshot.sources.map((source: any) => source.url));
    for (const url of officialUrls) expect(html).toContain(`href="${url}"`);
    const permitted = new Set([...officialUrls, UK_GOVERNMENT_ENGINE_PRODUCER_URL, "https://taxsorted.io"]);
    const external = [...html.matchAll(/href="(https:\/\/[^"#]+)"/g)].map((match) => match[1]!);
    expect(external.every((url) => permitted.has(url))).toBe(true);
    expect(external.some((url) => url.startsWith("https://api.taxsorted.io/"))).toBe(false);
    expect(html).not.toContain('target="_blank"');
    expect(html).not.toMatch(/<(?:script|form|input|button|iframe)\b|onclick\s*=|fetch\s*\(/i);
    expect(html).toContain("@media(prefers-reduced-motion:reduce)");
    expect(html).toContain("@media(forced-colors:active)");
  });

  test("escapes hostile record text and rejects hostile external URLs", () => {
    const snapshot = structuredClone(loadUkGovernmentEnginePublication().snapshot);
    snapshot.claims[0].text = '</style><script src="https://evil.example/run.js">run()</script>';
    snapshot.claims[0].limitation = '<img src=x onerror="evil()">';
    snapshot.bodies[0].name = '<svg onload="evil()">';
    const html = renderUkGovernmentEngineHtml(snapshot);
    expect(html).toContain("&lt;/style&gt;&lt;script src=&quot;https://evil.example/run.js&quot;&gt;run()&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=&quot;evil()&quot;&gt;");
    expect(html).toContain("&lt;svg onload=&quot;evil()&quot;&gt;");
    expect(html).not.toMatch(/<script src="https:\/\/evil|<img src=x|<svg onload/i);

    const official = structuredClone(loadUkGovernmentEnginePublication().snapshot);
    official.sources[0].url = "https://evil.example/looks-official";
    expect(() => renderUkGovernmentEngineHtml(official)).toThrow(/official-source host set/i);
    const crosswalk = structuredClone(loadUkGovernmentEnginePublication().snapshot);
    crosswalk.relatedResources[0].url = "https://evil.example/taxsorted";
    expect(() => renderUkGovernmentEngineHtml(crosswalk)).toThrow(/related-resource firewall/i);
  });

  test("publishes the same summary and exact snapshot across generated discovery surfaces", () => {
    const snapshot = loadUkGovernmentEnginePublication().snapshot;
    const expected = ukGovernmentEnginePublicSummary(snapshot);
    expect(expected.authorship.exactTextHumanReviewed).toBe(false);
    expect(expected.evidence).toEqual({
      official_sources: "source-linked-maintainer-authorized-assisted-url-review",
      official_source_bodies_republished: false,
      exact_text_human_reviewed: false,
      taxsorted_bridge: "receipt-bound-crosswalk-only",
      taxsorted_distinct_capture_receipts: 9,
      taxsorted_government_evidence: false,
    });
    expect(readBytes(UK_GOVERNMENT_ENGINE_ALIAS_LOCATOR)).toEqual(readBytes(UK_GOVERNMENT_ENGINE_LOCATOR));
    expect(read(UK_GOVERNMENT_ENGINE_PAGE_LOCATOR)).toBe(renderUkGovernmentEngineHtml(snapshot));
    for (const path of ["site/kingdom.json", "site/guest.json", "site/.well-known/agent.json"]) {
      expect(json(path).uk_government_engine).toEqual(expected);
    }
    const manifest = json("site/.well-known/agent.json");
    expect(manifest.entry_points).toMatchObject({
      uk_government_engine: UK_GOVERNMENT_ENGINE_URL,
      uk_government_engine_alias: UK_GOVERNMENT_ENGINE_ALIAS_URL,
      uk_government_engine_canonical: UK_GOVERNMENT_ENGINE_CANONICAL_URL,
      uk_government_engine_guide: UK_GOVERNMENT_ENGINE_GUIDE_URL,
      uk_government_engine_schema: UK_GOVERNMENT_ENGINE_SCHEMA_URL,
    });
    const actions = json("site/guest.json").next_actions.filter((action: any) =>
      [UK_GOVERNMENT_ENGINE_URL, UK_GOVERNMENT_ENGINE_ALIAS_URL, UK_GOVERNMENT_ENGINE_CANONICAL_URL,
        UK_GOVERNMENT_ENGINE_SCHEMA_URL, UK_GOVERNMENT_ENGINE_GUIDE_URL].includes(action.url));
    expect(actions).toHaveLength(5);
    expect(actions.every((action: any) => action.method === "GET")).toBe(true);
    for (const url of [UK_GOVERNMENT_ENGINE_URL, UK_GOVERNMENT_ENGINE_ALIAS_URL,
      UK_GOVERNMENT_ENGINE_CANONICAL_URL, UK_GOVERNMENT_ENGINE_SCHEMA_URL,
      UK_GOVERNMENT_ENGINE_GUIDE_URL, UK_GOVERNMENT_ENGINE_PRODUCER_URL]) {
      expect(read("site/llms.txt")).toContain(url);
    }
  });

  test("stages exactly five assets with only the page and dated alias mutable", () => {
    const family = [
      { source: UK_GOVERNMENT_ENGINE_PAGE_LOCATOR, destination: "government-engine/index.html" },
      { source: UK_GOVERNMENT_ENGINE_ALIAS_LOCATOR, destination: "government.json" },
      { source: UK_GOVERNMENT_ENGINE_LOCATOR, destination: "government/uk-government-engine-2026-08-21.json" },
      { source: UK_GOVERNMENT_ENGINE_SCHEMA_LOCATOR, destination: "government/schemas/v0.1/public-snapshot.schema.json" },
      { source: UK_GOVERNMENT_ENGINE_GUIDE_LOCATOR, destination: "UK-GOVERNMENT-ENGINE-v0.1.md" },
    ];
    expect(HUB_ASSETS.filter(({ source }) => family.some((asset) => asset.source === source))).toEqual(family);
    expect(HUB_ASSETS).toHaveLength(138);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(27);
    expect(MUTABLE_HUB_DESTINATIONS).toContain("government-engine/index.html");
    expect(MUTABLE_HUB_DESTINATIONS).toContain("government.json");
    expect(MUTABLE_HUB_DESTINATIONS).not.toContain("government/uk-government-engine-2026-08-21.json");
    expect(MUTABLE_HUB_DESTINATIONS).not.toContain("government/schemas/v0.1/public-snapshot.schema.json");
    expect(MUTABLE_HUB_DESTINATIONS).not.toContain("UK-GOVERNMENT-ENGINE-v0.1.md");
    const immutable = json("publications/immutable-publications.v1.json").entries
      .filter((entry: any) => entry.id.startsWith("government-engine/"));
    expect(immutable.map(({ id, sha256: hash }: any) => [id, hash])).toEqual([
      ["government-engine/0.1/guide", UK_GOVERNMENT_ENGINE_GUIDE_BYTE_SHA256],
      ["government-engine/0.1/schema", UK_GOVERNMENT_ENGINE_SCHEMA_BYTE_SHA256],
      ["government-engine/0.1/snapshot", UK_GOVERNMENT_ENGINE_BYTE_SHA256],
    ]);
  });

  test("requires exact normalized cache directive sets and rejects contradictory mutations", () => {
    const mutable = ["no-cache", "no-transform"];
    const immutable = ["public", "max-age=31536000", "immutable", "no-transform"];
    expect(hasExactCacheDirectives(" NO-TRANSFORM, no-cache ", mutable)).toBe(true);
    expect(hasExactCacheDirectives("immutable, no-transform, PUBLIC, max-age=31536000", immutable)).toBe(true);
    expect(hasExactCacheDirectives("no-cache, no-transform, immutable", mutable)).toBe(false);
    expect(hasExactCacheDirectives("public, max-age=31536000, immutable, no-transform, no-cache", immutable)).toBe(false);
    expect(hasExactCacheDirectives("public, max-age=0, immutable, no-transform", immutable)).toBe(false);
    expect(hasExactCacheDirectives("public, max-age=31536000, immutable", immutable)).toBe(false);
    expect(hasExactCacheDirectives("no-cache, no-cache, no-transform", mutable)).toBe(false);
  });
});
