import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  J_SPACE_CASE_URL,
  J_SPACE_GUIDE_URL,
  J_SPACE_PUBLICATION_BOUNDARY,
  J_SPACE_SCHEMA_URL,
  jSpacePublicationPublicSummary,
  loadJSpacePublicationCase,
} from "../bin/j-space-publication.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const PUBLIC_URLS = [J_SPACE_CASE_URL, J_SPACE_SCHEMA_URL, J_SPACE_GUIDE_URL] as const;

describe("J-space static research publication", () => {
  test("stages one immutable three-route family and no observer or validator runtime", () => {
    expect(HUB_ASSETS).toHaveLength(138);
    expect(HUB_ASSETS).toContainEqual({
      source: "bridges/examples/j-space-reasoning-to-word-inference.json",
      destination: "records/j-space-reasoning-to-word-2026-08-17.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "bridges/schemas/relational-inference-case-0.1.json",
      destination: "schemas/relational-inference-case/0.1.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "bridges/j-space-verbalizable-workspace.md",
      destination: "J-SPACE-VERBALIZABLE-WORKSPACE.md",
    });
    expect(HUB_ASSETS.filter(({ destination }) => /j-space|relational-inference-case/i.test(destination))).toHaveLength(3);
    expect(HUB_ASSETS.some(({ source, destination }) =>
      source.startsWith("bin/relational-inference") ||
      /j-space.*(?:latest|current)|(?:monitor|observer|mcp).*j-space/i.test(destination))).toBe(false);

    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(111);
    expect(ledger.entries.filter((entry: any) => entry.id.startsWith("j-space-verbalizable-workspace/0.1/"))).toEqual([
      {
        id: "j-space-verbalizable-workspace/0.1/case",
        route: "/records/j-space-reasoning-to-word-2026-08-17.json",
        source: "bridges/examples/j-space-reasoning-to-word-inference.json",
        destination: "records/j-space-reasoning-to-word-2026-08-17.json",
        sha256: "0f3827ec422afed88fb2b4396d9f25550892ce458f84d0bfe8ded0735a6cbc26",
      },
      {
        id: "j-space-verbalizable-workspace/0.1/guide",
        route: "/J-SPACE-VERBALIZABLE-WORKSPACE.md",
        source: "bridges/j-space-verbalizable-workspace.md",
        destination: "J-SPACE-VERBALIZABLE-WORKSPACE.md",
        sha256: "97f979aff120eaa4b1eff19dfb627b57293d32ac3e450a21309f92085671f2f5",
      },
      {
        id: "j-space-verbalizable-workspace/0.1/schema",
        route: "/schemas/relational-inference-case/0.1.json",
        source: "bridges/schemas/relational-inference-case-0.1.json",
        destination: "schemas/relational-inference-case/0.1.json",
        sha256: "c244cc072eb20396bbc1de9ee2d8a30510e78c7a25a3fecef53ae1bd6a34fa7c",
      },
    ]);
  });

  test("projects only an unrun, structure-only case", () => {
    const helper = read("bin/j-space-publication.ts");
    expect(helper).toContain("validateRelationalInferenceFile(join(ROOT, J_SPACE_CASE_LOCATOR))");
    const value = loadJSpacePublicationCase();
    const summary = jSpacePublicationPublicSummary(value);
    expect(value.probes).toHaveLength(3);
    expect(value.probes.every((probe: any) => probe.run_status === "not-run" &&
      probe.source_ref === null && probe.observed_on === null && probe.epistemic_access === "unknown")).toBe(true);
    expect(value.candidate_models).toHaveLength(4);
    expect(value.candidate_models.every((model: any) => model.status === "unassessed")).toBe(true);
    expect(value.inference).toMatchObject({ conclusion_status: "underdetermined", declared_confidence: "unknown" });
    expect(Object.values(value.safety)).toEqual(new Array(12).fill(false));
    expect(summary.urls).toEqual({ record: PUBLIC_URLS[0], schema: PUBLIC_URLS[1], guide: PUBLIC_URLS[2] });
    expect(summary.publication_state).toBe("static-structure-only");
    expect(summary.artifact_kind).toBe("OPTIONAL_RESEARCH_BRIDGE");
    expect(summary.evidence_status).toBe("TEST_DESIGN_NOT_RUN");
    expect(summary.probe_status).toBe("not-run");
    expect(summary.counts).toMatchObject({ probes_declared: 3, probes_run: 0 });
    expect(summary.boundary).toEqual(J_SPACE_PUBLICATION_BOUNDARY);
    expect(summary.boundary.runtime_action).toBe(false);
  });

  test("renders a static homepage explanation and bounded machine discovery", () => {
    const builder = read("bin/build-hub.ts");
    const start = builder.indexOf('<section class="blk" id="j-space"');
    const end = builder.indexOf("</section>", start) + "</section>".length;
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const section = builder.slice(start, end);
    expect(section).toContain("Structure, not a hidden-state verdict");
    expect(section).toContain("No monitoring or person inference");
    expect(section).toContain("Privacy is not deception");
    expect(section).toContain("jSpacePublicationDiscovery.counts.probes_declared");
    expect(section).not.toMatch(/<(?:script|form|input|button|select|textarea|iframe)\b/i);
    expect(section).not.toMatch(/(?:fetch\(|sendBeacon|WebSocket|EventSource|postMessage)/);
    expect(builder.match(/\n  j_space_verbalizable_workspace: jSpacePublicationDiscovery,/g) ?? []).toHaveLength(3);
    expect(builder).toContain("j_space_reasoning_to_word_case: jSpaceCaseUrl");
    expect(builder).toContain("j_space_reasoning_to_word_schema: jSpaceSchemaUrl");
    expect(builder).toContain("j_space_verbalizable_workspace_guide: jSpaceGuideUrl");
    for (const variable of ["jSpaceCaseUrl", "jSpaceSchemaUrl", "jSpaceGuideUrl"]) {
      expect(builder).toContain(`method: "GET", url: ${variable}`);
    }
    expect(builder).not.toContain("j_space_mcp");
  });

  test("serves typed routes and advertises exactly the immutable triplet", () => {
    const worker = read("pages-functions/_worker.js");
    expect(worker).toContain('const J_SPACE_CASE_PATH = "/records/j-space-reasoning-to-word-2026-08-17.json"');
    expect(worker).toContain('const J_SPACE_SCHEMA_PATH = "/schemas/relational-inference-case/0.1.json"');
    expect(worker).toContain('const J_SPACE_GUIDE_PATH = "/J-SPACE-VERBALIZABLE-WORKSPACE.md"');
    expect(worker).toContain("addJSpaceSchemaLink(headers)");
    expect(worker).toContain('if (servesJSpaceSchema) {\n      headers.set("content-type", "application/schema+json; charset=utf-8")');

    const checker = read("bin/check-hub-live.ts");
    expect(checker).toContain('id: "j-space-verbalizable-workspace"');
    expect(checker).toContain("hasUniqueCanonicalLinkRelation(");
    expect(checker).toContain("J-space static publication, unrun-test boundary, discovery, or negative-authority boundary drifted");

    const sitemapUrls = [...read("pages-content/sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => match[1]!);
    expect(sitemapUrls).toHaveLength(135);
    expect(new Set(sitemapUrls).size).toBe(sitemapUrls.length);
    for (const url of PUBLIC_URLS) expect(sitemapUrls).toContain(url);
    expect(sitemapUrls.filter((url) => /j-space|relational-inference-case/i.test(url))).toEqual(PUBLIC_URLS);
  });
});
