import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import {
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_LOCATOR,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_BYTE_SHA256,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_SHA256,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_BYTE_SHA256,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_LOCATOR,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_LOCATOR,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_PAGE_LOCATOR,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_PRODUCER_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_PROTOCOL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_BYTE_SHA256,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_CANONICAL_SHA256,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_LOCATOR,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_URL,
  assertUkGovernmentTransformationActiveReviewWindow,
  loadUkGovernmentTransformationPublication,
  parseUkGovernmentTransformationSnapshotBytes,
  renderUkGovernmentTransformationHtml,
  ukGovernmentTransformationCanonicalJson,
  ukGovernmentTransformationPublicSummary,
  validateUkGovernmentTransformationSnapshot,
} from "../bin/uk-government-transformation-engine.ts";
import { loadUkGovernmentEnginePublication } from "../bin/uk-government-engine.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const readBytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => readBytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
const htmlEscape = (value: unknown) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

function changedSnapshot(change: (snapshot: any) => void): Uint8Array {
  const snapshot = structuredClone(
    loadUkGovernmentTransformationPublication().snapshot,
  );
  change(snapshot);
  return Buffer.from(JSON.stringify(snapshot));
}

function schemaObjects(value: unknown): any[] {
  if (Array.isArray(value)) return value.flatMap(schemaObjects);
  if (value === null || typeof value !== "object") return [];
  const objectValue = value as Record<string, unknown>;
  return [
    ...(objectValue.type === "object" ? [objectValue] : []),
    ...Object.values(objectValue).flatMap(schemaObjects),
  ];
}

describe("UK Government Transformation Engine Phase-0 publication", () => {
  test("keeps the exact frozen snapshot, schema, guide and canonical receipts", () => {
    const snapshotBytes = readBytes(UK_GOVERNMENT_TRANSFORMATION_ENGINE_LOCATOR);
    const schemaBytes = readBytes(UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_LOCATOR);
    const guideBytes = readBytes(UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_LOCATOR);
    expect(snapshotBytes.byteLength).toBe(83_915);
    expect(schemaBytes.byteLength).toBe(47_800);
    expect(guideBytes.byteLength).toBe(6_770);
    expect(sha256(snapshotBytes)).toBe(
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_BYTE_SHA256,
    );
    expect(sha256(schemaBytes)).toBe(
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_BYTE_SHA256,
    );
    expect(sha256(guideBytes)).toBe(
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_BYTE_SHA256,
    );

    const publication = loadUkGovernmentTransformationPublication();
    expect(Buffer.from(publication.bytes)).toEqual(snapshotBytes);
    expect(sha256(ukGovernmentTransformationCanonicalJson(publication.snapshot)))
      .toBe(UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_SHA256);
    const schema = JSON.parse(schemaBytes.toString("utf8"));
    expect(schema.$id).toBe(UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL);
    expect(sha256(ukGovernmentTransformationCanonicalJson(schema)))
      .toBe(UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_CANONICAL_SHA256);
    const objects = schemaObjects(schema);
    expect(objects.length).toBeGreaterThan(20);
    for (const entry of objects) {
      expect(entry.additionalProperties).toBe(false);
      expect([...entry.required].sort()).toEqual(Object.keys(entry.properties).sort());
    }
  });

  test("declares one exact dated five-route family and pinned producer", () => {
    expect(UK_GOVERNMENT_TRANSFORMATION_ENGINE_PROTOCOL)
      .toBe("kingdom.government-transformation-orientation-public-snapshot/0.1");
    expect(UK_GOVERNMENT_TRANSFORMATION_ENGINE_URL)
      .toBe("https://thekingdom.dev/government-transformation-engine/");
    expect(UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_URL)
      .toBe("https://thekingdom.dev/government-transformations.json");
    expect(UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_URL)
      .toBe("https://thekingdom.dev/government/uk-government-transformation-engine-2026-08-21.json");
    expect(UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL)
      .toBe("https://thekingdom.dev/government/transformations/schemas/v0.1/public-snapshot.schema.json");
    expect(UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_URL)
      .toBe("https://thekingdom.dev/UK-GOVERNMENT-TRANSFORMATION-ENGINE-v0.1.md");
    expect(UK_GOVERNMENT_TRANSFORMATION_ENGINE_PRODUCER_URL)
      .toBe("https://github.com/cambridgetcg/kingdom-government-transformation-engine/tree/v0.1.0");
  });

  test("independently admits the exact base and resolves every typed base reference", () => {
    const snapshot = loadUkGovernmentTransformationPublication().snapshot;
    const { snapshot: base, bytes } = loadUkGovernmentEnginePublication();
    expect(bytes.byteLength).toBe(196_005);
    expect(snapshot.baseSnapshot).toMatchObject({
      bytes: 196_005,
      byteReceipt: "sha256:1751b2ac331d6a1283cbf57b5b6961d9071f528298f97589fcbd7cf36407e139",
      canonicalReceipt: "sha256:cc2c22e356cef0160ed5da1e2fd756bad5801f574c4cb064dec157b9207b9739",
      canonicalUrl: "https://thekingdom.dev/government/uk-government-engine-2026-08-21.json",
      officialSourceHandling: "link-only",
      exactTextHumanReviewed: false,
      runtimeFetch: false,
    });
    const typed = new Map<string, Set<string>>([
      ["body", new Set(base.bodies.map((entry: any) => entry.id))],
      ["claim", new Set(base.claims.map((entry: any) => entry.id))],
      ["flow", new Set(base.flows.map((entry: any) => entry.id))],
      ["plane", new Set(base.planes.map((entry: any) => entry.id))],
      ["rail", new Set(base.rails.map((entry: any) => entry.id))],
      ["redressRoute", new Set(base.redressRoutes.map((entry: any) => entry.id))],
      ["relation", new Set(base.relations.map((entry: any) => entry.id))],
      ["source", new Set(base.sources.map((entry: any) => entry.id))],
      ["unknown", new Set(base.unknowns.map((entry: any) => entry.id))],
    ]);
    const all = new Set([...typed.values()].flatMap((ids) => [...ids]));
    for (const dossier of snapshot.dossiers) {
      for (const atom of dossier.evidenceAtoms) {
        expect(typed.get(atom.baseEntityType)?.has(atom.baseEntityId), atom.id)
          .toBe(true);
        expect(atom.supportsConclusion).toBe(false);
      }
      for (const node of dossier.authorityDependencyGraph.nodes) {
        expect(node.baseEntityIds.every((id: string) => all.has(id)), node.id)
          .toBe(true);
      }
      for (const branch of dossier.jurisdictionBranches) {
        expect(branch.baseBodyIds.every((id: string) => typed.get("body")!.has(id)))
          .toBe(true);
        expect(branch.baseClaimIds.every((id: string) => typed.get("claim")!.has(id)))
          .toBe(true);
      }
      for (const route of dossier.routeOrientations) {
        expect(typed.get("redressRoute")!.has(route.baseRedressRouteId)).toBe(true);
      }
    }
  });

  test("keeps every dossier held, synthetic, non-selected and human-gated", () => {
    const snapshot = loadUkGovernmentTransformationPublication().snapshot;
    expect(snapshot.counts).toEqual({
      authorityDependencyEdges: 17,
      authorityDependencyNodes: 25,
      causalEdges: 24,
      causalNodes: 30,
      desiredOutcomes: 3,
      dossiers: 3,
      evidenceAtoms: 30,
      externalContextBindings: 4,
      humanGates: 6,
      jurisdictionBranches: 4,
      options: 9,
      planeAssessments: 18,
      routeOrientations: 4,
    });
    expect(Object.values(snapshot.boundaries).every((value) => value === false))
      .toBe(true);
    expect(Object.values(snapshot.actionArrays).every((value: any) =>
      Array.isArray(value) && value.length === 0)).toBe(true);
    for (const dossier of snapshot.dossiers) {
      expect(dossier.synthetic).toBe(true);
      expect(dossier.title.startsWith("Synthetic ")).toBe(true);
      expect(dossier.hold).toMatchObject({ state: "held", stopsProgression: true });
      expect(dossier.adoption).toEqual({
        authorityLocation: "outside-this-system",
        state: "not-adopted",
      });
      expect(dossier.trialChamber).toEqual({
        compatibility: "unavailable",
        result: null,
        useAsAuthority: false,
      });
      expect(dossier.preferredOptionId).toBeNull();
      expect(dossier.selectionState).toBe("not-selected");
      expect(dossier.options.every((option: any) => option.selected === false))
        .toBe(true);
      expect(dossier.humanGates.every((gate: any) =>
        gate.required === true &&
        gate.completed === false &&
        gate.authorityOutsideSystem === true)).toBe(true);
      expect(dossier.planeAssessments).toHaveLength(6);
      expect(dossier.planeAssessments.every((assessment: any) =>
        assessment.unresolvedQuestionIds.length > 0 &&
        assessment.status !== "orientation-supported")).toBe(true);
      expect(dossier.authorityDependencyGraph.automaticProgression).toBe(false);
      expect(dossier.causalChangeHypothesisGraph.claimsCausalTruth).toBe(false);
      expect(Object.values(dossier.actionArrays).every((value: any) =>
        Array.isArray(value) && value.length === 0)).toBe(true);
    }
  });

  test("keeps TaxSorted bindings exact, transitive and tainted through summary projection", () => {
    const snapshot = loadUkGovernmentTransformationPublication().snapshot;
    const base = loadUkGovernmentEnginePublication().snapshot;
    const admitted = new Set<string>();
    const forbiddenTexts: string[] = [];
    for (const bridge of base.externalBridges) {
      for (const binding of bridge.selectedRecordBindings) {
        admitted.add(
          bridge.id + "\u0000" + binding.collection + "\u0000" + binding.recordId,
        );
        forbiddenTexts.push(binding.purpose);
      }
    }
    const contexts = snapshot.dossiers.flatMap((dossier: any) =>
      dossier.externalContext);
    expect(contexts).toHaveLength(4);
    for (const context of contexts) {
      expect(admitted.has(
        context.bridgeId + "\u0000" + context.collection + "\u0000" +
          context.recordId,
      )).toBe(true);
      expect(context.taint).toBe("external-context-only");
      expect(context.supportsClaimIds).toEqual([]);
    }
    const summary = ukGovernmentTransformationPublicSummary(snapshot);
    const projected = summary.dossiers.flatMap((dossier: any) =>
      dossier.external_context);
    expect(projected).toHaveLength(4);
    expect(projected.every((context: any) =>
      context.taint === "external-context-only" &&
      context.supports_claim_ids.length === 0 &&
      Object.keys(context).sort().join(",") ===
        "bridge_id,collection,record_id,supports_claim_ids,taint")).toBe(true);
    const summaryText = JSON.stringify(summary);
    for (const text of forbiddenTexts) expect(summaryText).not.toContain(text);
    expect(summaryText).not.toContain("api.taxsorted.io");
  });

  test("rejects critical semantic drift, even across self-consistent-looking mutations", () => {
    const cases: Array<[string, (snapshot: any) => void]> = [
      ["human review", (snapshot) => { snapshot.authorship.humanReviewCompleted = true; }],
      ["base receipt", (snapshot) => { snapshot.baseSnapshot.bytes = 196_004; }],
      ["boundary", (snapshot) => { snapshot.boundaries.automatedAction = true; }],
      ["top action", (snapshot) => { snapshot.actionArrays.decision.push("act"); }],
      ["synthetic", (snapshot) => { snapshot.dossiers[0].synthetic = false; }],
      ["hold", (snapshot) => { snapshot.dossiers[0].hold.stopsProgression = false; }],
      ["adoption", (snapshot) => { snapshot.dossiers[0].adoption.state = "adopted"; }],
      ["Trial Chamber", (snapshot) => {
        snapshot.dossiers[0].trialChamber.useAsAuthority = true;
      }],
      ["selection", (snapshot) => { snapshot.dossiers[0].options[0].selected = true; }],
      ["preferred option", (snapshot) => {
        snapshot.dossiers[0].preferredOptionId = snapshot.dossiers[0].options[0].id;
      }],
      ["orientation support", (snapshot) => {
        snapshot.dossiers[0].planeAssessments[0].status = "orientation-supported";
      }],
      ["missing unresolved question", (snapshot) => {
        snapshot.dossiers[0].planeAssessments[0].unresolvedQuestionIds = [];
      }],
      ["mistyped base ID", (snapshot) => {
        snapshot.dossiers[0].evidenceAtoms[0].baseEntityType = "unknown";
      }],
      ["supporting evidence", (snapshot) => {
        snapshot.dossiers[0].evidenceAtoms[0].supportsConclusion = true;
      }],
      ["automatic progression", (snapshot) => {
        snapshot.dossiers[0].authorityDependencyGraph.automaticProgression = true;
      }],
      ["causal truth", (snapshot) => {
        snapshot.dossiers[0].causalChangeHypothesisGraph.claimsCausalTruth = true;
      }],
      ["completed human gate", (snapshot) => {
        snapshot.dossiers[0].humanGates[0].completed = true;
      }],
      ["determinative route", (snapshot) => {
        snapshot.dossiers[1].routeOrientations[0].deadlineDetermined = true;
      }],
      ["TaxSorted claim support", (snapshot) => {
        snapshot.dossiers[1].externalContext[0].supportsClaimIds.push("claim:x");
      }],
      ["TaxSorted text projection", (snapshot) => {
        snapshot.dossiers[1].externalContext[0].recordText = "forbidden text";
      }],
      ["TaxSorted binding drift", (snapshot) => {
        snapshot.dossiers[1].externalContext[0].recordId = "not-admitted";
      }],
      ["count rewrite", (snapshot) => {
        snapshot.dossiers[0].options.pop();
        snapshot.counts.options -= 1;
      }],
      ["scalar score", (snapshot) => { snapshot.score = 1; }],
      ["MCP surface", (snapshot) => { snapshot.mcp = {}; }],
    ];
    for (const [label, change] of cases) {
      expect(
        () => parseUkGovernmentTransformationSnapshotBytes(changedSnapshot(change)),
        label,
      ).toThrow();
    }
  });

  test("fails closed on duplicate keys, invalid UTF-8, excess bounds and symlinks", () => {
    const duplicate = read(UK_GOVERNMENT_TRANSFORMATION_ENGINE_LOCATOR)
      .replace(/^\{\n/u, '{\n  "schema": "duplicate",\n');
    expect(() => parseUkGovernmentTransformationSnapshotBytes(
      Buffer.from(duplicate),
    )).toThrow(/duplicate key/i);
    expect(() => parseUkGovernmentTransformationSnapshotBytes(
      Buffer.from('{"schema":"first","\\u0073chema":"decoded duplicate"}'),
    )).toThrow(/duplicate key/i);
    expect(() => parseUkGovernmentTransformationSnapshotBytes(Buffer.from([0xff])))
      .toThrow(/valid UTF-8/i);
    expect(() => parseUkGovernmentTransformationSnapshotBytes(
      Buffer.alloc(256 * 1024 + 1, 0x20),
    )).toThrow(/exceeds 262144 bytes/i);
    let nested: any = "end";
    for (let index = 0; index < 45; index += 1) nested = { nested };
    expect(() => parseUkGovernmentTransformationSnapshotBytes(
      Buffer.from(JSON.stringify({ nested })),
    )).toThrow(/nesting exceeds 40/i);

    const temporary = mkdtempSync(join(ROOT, ".uk-transformation-test-"));
    try {
      const link = join(temporary, "snapshot.json");
      symlinkSync(
        join(ROOT, UK_GOVERNMENT_TRANSFORMATION_ENGINE_LOCATOR),
        link,
      );
      expect(() => loadUkGovernmentTransformationPublication(
        basename(temporary) + "/snapshot.json",
      )).toThrow(/symbolic-link/i);
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });

  test("renders held evidence before outcomes and two separate accessible graphs per dossier", () => {
    const snapshot = loadUkGovernmentTransformationPublication().snapshot;
    const html = renderUkGovernmentTransformationHtml(snapshot);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("Synthetic · Phase 0 · Orientation only");
    expect(html).toContain('class="skip" href="#main"');
    expect(html).toContain('<main class="shell" id="main" tabindex="-1">');
    expect(html.match(/class="graph authority-graph"/g)).toHaveLength(3);
    expect(html.match(/class="graph causal-graph"/g)).toHaveLength(3);
    expect(html.match(/Complete linear edge equivalent/g)).toHaveLength(6);
    expect(html.match(/claimsCausalTruth:false/g)).toHaveLength(3);
    expect(html.match(/State at publication only:/g)).toHaveLength(4);
    expect(html.match(/next review due/g)).toHaveLength(5);
    for (const type of [
      "prerequisite",
      "parallel",
      "alternative",
      "feedback",
      "does-not-imply",
    ]) {
      expect(html).toContain("<code>" + type + "</code>");
    }
    for (const dossier of snapshot.dossiers) {
      const start = html.indexOf('id="transformation-' +
        dossier.id.replace(/[^a-z0-9]+/giu, "-").replace(/-+$/u, "") + '"');
      const end = html.indexOf('</article><article class="dossier"', start);
      const section = html.slice(start, end < 0 ? undefined : end);
      const held = section.indexOf("Why held");
      const gates = section.indexOf("Human gates");
      const evidence = section.indexOf("Evidence limitations");
      const authority = section.indexOf("Graph A · authority dependencies");
      const causal = section.indexOf("Graph B · causal hypotheses");
      const outcomes = section.indexOf("Aspirational outcomes come last");
      expect(held).toBeGreaterThanOrEqual(0);
      expect(gates).toBeGreaterThan(held);
      expect(evidence).toBeGreaterThan(gates);
      expect(authority).toBeGreaterThan(evidence);
      expect(causal).toBeGreaterThan(authority);
      expect(outcomes).toBeGreaterThan(causal);
      for (const atom of dossier.evidenceAtoms) {
        expect(section).toContain("<code>" + atom.baseEntityId + "</code>");
        expect(section).not.toContain(
          "<code>" + atom.baseEntityType + ":" + atom.baseEntityId + "</code>",
        );
      }
      for (const context of dossier.externalContext) {
        expect(section).toContain("<code>" + context.bridgeId + "</code>");
        expect(section).toContain("<code>" + context.collection + "</code>");
        expect(section).toContain("<code>" + context.recordId + "</code>");
        expect(section).toContain("<code>taint:external-context-only</code>");
      }
    }
    const external = [...html.matchAll(/href="(https:\/\/[^"#]+)"/g)]
      .map((match) => match[1]!);
    expect(external).toEqual([UK_GOVERNMENT_TRANSFORMATION_ENGINE_PRODUCER_URL]);
    expect(html).not.toContain("https://api.taxsorted.io");
    expect(html).not.toContain('target="_blank"');
    expect(html).not.toMatch(
      /<(?:script|form|input|button|iframe)\b|onclick\s*=|fetch\s*\(/i,
    );
    expect(html).toContain("@media(prefers-reduced-motion:reduce)");
    expect(html).toContain("@media(forced-colors:active)");
  });

  test("escapes hostile dossier text before rendering", () => {
    const snapshot = structuredClone(
      loadUkGovernmentTransformationPublication().snapshot,
    );
    snapshot.dossiers[0].causalChangeHypothesisGraph.nodes[0].statement =
      '</style><script src="https://evil.example/run.js">run()</script>';
    snapshot.dossiers[0].options[0].description =
      '<img src=x onerror="evil()">';
    const html = renderUkGovernmentTransformationHtml(snapshot);
    expect(html).toContain(htmlEscape(
      '</style><script src="https://evil.example/run.js">run()</script>',
    ));
    expect(html).toContain(htmlEscape('<img src=x onerror="evil()">'));
    expect(html).not.toMatch(/<script src="https:\/\/evil|<img src=x/i);
  });

  test("publishes exact alias, page, summaries, five GET actions and five entry points", () => {
    const snapshot = loadUkGovernmentTransformationPublication().snapshot;
    const expected = ukGovernmentTransformationPublicSummary(snapshot);
    expect(readBytes(UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_LOCATOR))
      .toEqual(readBytes(UK_GOVERNMENT_TRANSFORMATION_ENGINE_LOCATOR));
    expect(read(UK_GOVERNMENT_TRANSFORMATION_ENGINE_PAGE_LOCATOR))
      .toBe(renderUkGovernmentTransformationHtml(snapshot));
    for (const path of [
      "site/kingdom.json",
      "site/guest.json",
      "site/.well-known/agent.json",
    ]) {
      expect(json(path).uk_government_transformation_engine).toEqual(expected);
    }
    const manifest = json("site/.well-known/agent.json");
    const entryPoints = Object.fromEntries(
      Object.entries(manifest.entry_points).filter(([key]) =>
        key.startsWith("uk_government_transformation_engine")),
    );
    expect(entryPoints).toEqual({
      uk_government_transformation_engine:
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_URL,
      uk_government_transformation_engine_alias:
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_URL,
      uk_government_transformation_engine_canonical:
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_URL,
      uk_government_transformation_engine_schema:
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL,
      uk_government_transformation_engine_guide:
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_URL,
    });
    expect(manifest.mcp).toEqual({
      endpoint: "https://mcp.thekingdom.dev/mcp",
      transport: "streamable-http",
      tool: "kingdom_commons",
      catalog_resource: "kingdom://commons/catalog",
      default_detail: "brief",
      exact_filters: ["category", "cost", "account", "reuse", "automation"],
      privacy: expect.any(String),
    });
    const routes = [
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_URL,
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_URL,
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_URL,
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_URL,
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_URL,
    ];
    const actions = json("site/guest.json").next_actions.filter((action: any) =>
      routes.includes(action.url));
    expect(actions).toHaveLength(5);
    expect(actions.every((action: any) => action.method === "GET")).toBe(true);
    expect(actions.every((action: any) =>
      action.tool === undefined && action.schemas === undefined)).toBe(true);
    for (const url of [
      ...routes,
      UK_GOVERNMENT_TRANSFORMATION_ENGINE_PRODUCER_URL,
    ]) {
      expect(read("site/llms.txt")).toContain(url);
    }
    expect(read("site/hub.html")).toContain(
      'id="uk-government-transformation-engine"',
    );
  });

  test("stages exactly five assets with page and alias mutable and three immutable", () => {
    const family = [
      {
        source: UK_GOVERNMENT_TRANSFORMATION_ENGINE_PAGE_LOCATOR,
        destination: "government-transformation-engine/index.html",
      },
      {
        source: UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_LOCATOR,
        destination: "government-transformations.json",
      },
      {
        source: UK_GOVERNMENT_TRANSFORMATION_ENGINE_LOCATOR,
        destination:
          "government/uk-government-transformation-engine-2026-08-21.json",
      },
      {
        source: UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_LOCATOR,
        destination:
          "government/transformations/schemas/v0.1/public-snapshot.schema.json",
      },
      {
        source: UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_LOCATOR,
        destination: "UK-GOVERNMENT-TRANSFORMATION-ENGINE-v0.1.md",
      },
    ];
    expect(HUB_ASSETS.filter(({ source }) =>
      family.some((asset) => asset.source === source))).toEqual(family);
    expect(HUB_ASSETS).toHaveLength(178);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(31);
    expect(MUTABLE_HUB_DESTINATIONS)
      .toContain("government-transformation-engine/index.html");
    expect(MUTABLE_HUB_DESTINATIONS)
      .toContain("government-transformations.json");
    for (const destination of family.slice(2).map((entry) => entry.destination)) {
      expect(MUTABLE_HUB_DESTINATIONS).not.toContain(destination);
    }
    const immutable = json("publications/immutable-publications.v1.json").entries
      .filter((entry: any) =>
        entry.id.startsWith("government-transformation-engine/"));
    expect(immutable.map(({ id, sha256: hash }: any) => [id, hash])).toEqual([
      [
        "government-transformation-engine/0.1/guide",
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_BYTE_SHA256,
      ],
      [
        "government-transformation-engine/0.1/schema",
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_BYTE_SHA256,
      ],
      [
        "government-transformation-engine/0.1/snapshot",
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_BYTE_SHA256,
      ],
    ]);
  });

  test("uses an injected deployment date without changing historical rendering", () => {
    expect(assertUkGovernmentTransformationActiveReviewWindow("2026-09-21"))
      .toMatchObject({
        active: true,
        checkedOn: "2026-09-21",
        nextReviewDue: UK_GOVERNMENT_TRANSFORMATION_ENGINE_NEXT_REVIEW_DUE,
        state: "within-review-window",
      });
    expect(() =>
      assertUkGovernmentTransformationActiveReviewWindow("2026-09-22"))
      .toThrow(/replace or fully retire all five routes/i);
    expect(assertUkGovernmentTransformationActiveReviewWindow(
      "2026-09-22",
      false,
    )).toMatchObject({ active: false, state: "retired" });
    expect(() =>
      assertUkGovernmentTransformationActiveReviewWindow("not-a-date"))
      .toThrow(/YYYY-MM-DD/);
    const snapshot = loadUkGovernmentTransformationPublication().snapshot;
    expect(renderUkGovernmentTransformationHtml(snapshot))
      .toBe(renderUkGovernmentTransformationHtml(snapshot));
  });

  test("validates the already parsed object independently of byte loading", () => {
    const snapshot = structuredClone(
      loadUkGovernmentTransformationPublication().snapshot,
    );
    expect(validateUkGovernmentTransformationSnapshot(snapshot)).toBe(snapshot);
  });
});
