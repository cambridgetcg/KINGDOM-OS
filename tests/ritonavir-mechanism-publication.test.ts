import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadRitonavirMechanismLandscape,
  RITONAVIR_MECHANISM_DIGEST,
  RITONAVIR_MECHANISM_DOCUMENT_URL,
  RITONAVIR_MECHANISM_SCHEMA_URL,
  RITONAVIR_MECHANISM_URL,
  ritonavirMechanismPublicDiscovery,
  verifyRitonavirMechanismLandscape,
} from "../bin/ritonavir-mechanism.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const bytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => bytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");

describe("Ritonavir mechanism landscape publication", () => {
  test("does not rewrite the byte-preserved Polymorph History v1 artifacts", () => {
    expect(sha256("data/polymorphs/ritonavir-disappearing-polymorph.v1.json"))
      .toBe("08148603a1228960ac35df1378f1283c3fce43874a9fc07e6687f18e980dcb1c");
    expect(sha256("schemas/polymorph-history-v1.schema.json"))
      .toBe("e09dbcfa982fd61124b6220eb4587dded354620b498e45664d000950b67de174");
    expect(sha256("references/ritonavir-polymorph.md"))
      .toBe("101dbe11a36393c2687784ab01aa229e4cd6e7e032f8c8f03642ea480f168b91");
  });

  test("stages one separate versioned record, schema, and guide without a mutable alias", () => {
    expect(HUB_ASSETS).toContainEqual({
      source: "data/polymorphs/ritonavir-mechanism-landscape.v1.json",
      destination: "polymorphs/ritonavir-mechanism-landscape-2026-08-11.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "schemas/ritonavir-mechanism-landscape-v1.schema.json",
      destination: "schemas/ritonavir-mechanism-landscape/1.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "references/ritonavir-mechanism-landscape.md",
      destination: "RITONAVIR-MECHANISM-LANDSCAPE.md",
    });
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("polymorphs/"))).toHaveLength(2);
    expect(HUB_ASSETS.some(({ destination }) => /polymorphs\/(?:latest|current)\.json/.test(destination))).toBe(false);
  });

  test("binds the portable schema, semantic digest, and byte-preserved source lineage", () => {
    const landscape = loadRitonavirMechanismLandscape();
    const schema = json("schemas/ritonavir-mechanism-landscape-v1.schema.json");

    expect(verifyRitonavirMechanismLandscape(landscape)).toEqual([]);
    expect(landscape.$schema).toBe("urn:kingdom:schema:ritonavir-mechanism-landscape:1");
    expect(schema.$id).toBe(landscape.$schema);
    expect(landscape.integrity.digest).toBe(RITONAVIR_MECHANISM_DIGEST);
    expect(landscape.source_history).toMatchObject({
      case_id: "ritonavir-disappearing-polymorph-2026-08-11",
      semantic_digest: "sha256:6c759f595f0c6753dcf47d25d2a3490246984ef2b79adf31a558261b26ef8116",
      mutates_source_history: false,
      supersedes_source_history: false,
      supersedes_for_current_landscape: true,
    });
  });

  test("projects one coherent, authority-negative discovery contract without changing MCP", () => {
    const discovery = ritonavirMechanismPublicDiscovery();
    const manifest = json("site/.well-known/agent.json");
    const guest = json("site/guest.json");
    const kingdom = json("site/kingdom.json");
    const llms = read("site/llms.txt");

    expect(manifest.ritonavir_mechanism_landscape).toEqual(discovery);
    expect(guest.ritonavir_mechanism_landscape).toEqual(discovery);
    expect(kingdom.ritonavir_mechanism_landscape).toEqual(discovery);
    expect(discovery).toMatchObject({
      url: RITONAVIR_MECHANISM_URL,
      schema: RITONAVIR_MECHANISM_SCHEMA_URL,
      guide: RITONAVIR_MECHANISM_DOCUMENT_URL,
      compiled_on: "2026-08-11",
      evidence_through: "2026-04-08",
      source_history: { supersedes_for_current_landscape: true },
      integrity: { digest: RITONAVIR_MECHANISM_DIGEST },
      counts: {
        planes: 8,
        geometries: 6,
        entities: 19,
        naming_charts: 2,
        mechanisms: 7,
        relations: 18,
        claims: 9,
        analytical_windows: 5,
        unknowns: 6,
        sources: 9,
      },
      boundary: {
        medical_advice: false,
        interaction_checker: false,
        treatment_change_authority: false,
        direct_crystal_form_to_clinical_outcome: false,
        form_iv_exact_equivalence_established: false,
        complete_solid_form_landscape_established: false,
        experiment_authority: false,
        automatic_action: false,
        public_surface_read_only: true,
      },
    });
    for (const url of [RITONAVIR_MECHANISM_URL, RITONAVIR_MECHANISM_SCHEMA_URL, RITONAVIR_MECHANISM_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      ritonavir_mechanism_landscape: RITONAVIR_MECHANISM_URL,
      ritonavir_mechanism_landscape_schema: RITONAVIR_MECHANISM_SCHEMA_URL,
      ritonavir_mechanism_landscape_guide: RITONAVIR_MECHANISM_DOCUMENT_URL,
    });
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
    expect(manifest.mcp).toEqual(kingdom.world_commons.mcp);
  });

  test("renders the complete mechanism graph in no-JS HTML beside its inline SVG", () => {
    const landscape = loadRitonavirMechanismLandscape();
    const html = read("site/hub.html");
    const staticHtml = html.slice(0, html.indexOf("<script>"));
    const relationBlock = staticHtml.slice(
      staticHtml.indexOf('<div class="mechanismrelations">'),
      staticHtml.indexOf('<p class="commonsverified">', staticHtml.indexOf('<div class="mechanismrelations">')),
    );
    const planeBlock = staticHtml.slice(
      staticHtml.indexOf('<div class="mechanismplanes">'),
      staticHtml.indexOf('<div class="mechanismrelations">'),
    );
    const figureBlock = staticHtml.slice(
      staticHtml.indexOf('<figure class="mechanismfigure"'),
      staticHtml.indexOf('</figure>', staticHtml.indexOf('<figure class="mechanismfigure"')),
    );

    expect(staticHtml).toContain('href="#polymorph-history"');
    expect(staticHtml).toContain('<svg viewBox="0 0 1280 620" role="img"');
    expect(staticHtml).toContain("Material lane");
    expect(staticHtml).toContain("Biological lane");
    expect(staticHtml).toContain("The typed bridge is dissolution and exposure.");
    expect(staticHtml).toContain("Every declared relation records <code>direct_clinical_edge: false</code>.");
    expect(staticHtml).toContain("not medical advice");
    expect(staticHtml).toContain("serious or life-threatening drug interactions");
    expect(staticHtml).toContain("do not start, stop, or change treatment");
    expect(staticHtml).toContain(landscape.evidence_through);
    expect(staticHtml).toContain("selected primary research through 2026-04-08");
    expect(staticHtml).toContain("one official label observed 2026-08-11");
    expect(staticHtml).toContain(RITONAVIR_MECHANISM_DIGEST);
    expect(staticHtml).toContain(".mechanismsafety strong{display:block;margin-bottom:4px;color:var(--verm)");
    expect(staticHtml).toContain(".mechanismsublabel{fill:#aaa39a");
    expect(figureBlock).toContain(">2003 Form III<");
    expect(figureBlock).toContain(">formamide solvate<");
    expect(figureBlock).toContain(">2023 Form III<");
    expect(figureBlock).toContain(">anhydrous<");
    for (const match of figureBlock.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)) {
      expect([...match[1]!].length).toBeLessThanOrEqual(18);
    }
    expect((relationBlock.match(/<li>/g) ?? [])).toHaveLength(landscape.relations.length);
    expect((planeBlock.match(/<li>/g) ?? [])).toHaveLength(landscape.ontology.planes.length);
    for (const relation of landscape.relations) expect(relationBlock).toContain(`<code>${relation.subject_id}</code>`);
    for (const url of [
      "/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json",
      "/schemas/ritonavir-mechanism-landscape/1.json",
      "/RITONAVIR-MECHANISM-LANDSCAPE.md",
    ]) expect(staticHtml).toContain(`href="${url}"`);
  });
});
