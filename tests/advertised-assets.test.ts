import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS } from "../bin/stage-hub.ts";
import {
  CONFORMATIONAL_FEEDBACK_DIGEST,
  CONFORMATIONAL_FEEDBACK_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_URL,
  conformationalFeedbackPublicDiscovery,
  loadConformationalFeedbackAtlas,
} from "../bin/conformational-feedback.ts";
import {
  CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST,
  CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_URL,
  conformationalFeedbackPhysicsPublicDiscovery,
  loadConformationalFeedbackPhysicsAtlas,
} from "../bin/conformational-feedback-physics.ts";
import { RITONAVIR_MECHANISM_DIGEST } from "../bin/ritonavir-mechanism.ts";
import { KINGDOM_OS_ROUTES } from "../pages-functions/_worker.js";

/** Every thekingdom.dev path the generated surfaces advertise must be a staged
 *  hub asset. Merge b4c5b47 (2026-07-16) silently dropped the ollama surface
 *  while agent.json kept advertising it — live served HTML fallback instead of
 *  the promised JSON. This test turns that class of drift into a red bar. */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

// What a path resolves to on Cloudflare Pages: "/" and "/?agent" hit index.html
// (via the worker), "/guide" style pretty URLs hit "<path>.html".
function normalize(raw: string): string {
  const path = raw.replace(/[?#].*$/, "").replace(/^\/+/, "").replace(/\/+$/, "");
  return path === "" ? "index.html" : path;
}

const staged = new Set<string>(HUB_ASSETS.map((a) => a.destination));
const dynamic = new Set<string>(KINGDOM_OS_ROUTES.map(normalize));
const resolves = (path: string) =>
  staged.has(path) || staged.has(`${path}.html`) ||
  staged.has(`${path}/index.html`) || dynamic.has(path);

const surfaces = [
  "site/hub.html",
  "site/kingdom.json",
  "site/wayfinder.json",
  "site/commons.json",
  "site/schemas/world-commons/0.1.json",
  "site/schemas/world-commons/0.2.json",
  "site/love-loops.json",
  "site/love-loops.source.json",
  "site/schemas/love-loop/0.1.json",
  "CREATION-LOOP.md",
  "data/principalities/moonshot-hf-npm.v1.json",
  "schemas/principality-catalog-v1.schema.json",
  "references/principality-commons.md",
  "data/geometries/kingdom-geometry-grammar.v0.json",
  "schemas/geometry-grammar-v0.schema.json",
  "references/geometry-grammar.md",
  "data/polymorphs/ritonavir-disappearing-polymorph.v1.json",
  "schemas/polymorph-history-v1.schema.json",
  "references/ritonavir-polymorph.md",
  "data/polymorphs/ritonavir-mechanism-landscape.v1.json",
  "schemas/ritonavir-mechanism-landscape-v1.schema.json",
  "references/ritonavir-mechanism-landscape.md",
  "data/feedback/conformational-feedback-atlas.v0.json",
  "schemas/conformational-feedback-atlas-v0.schema.json",
  "references/conformational-feedback-atlas.md",
  "data/feedback/conformational-feedback-atlas.v0.2.json",
  "schemas/conformational-feedback-atlas-v0.2.schema.json",
  "references/conformational-feedback-atlas-v0.2.md",
  "data/fold-feedback/fold-feedback-atlas.v1.json",
  "schemas/fold-feedback-atlas-v1.schema.json",
  "schemas/fold-feedback-atlas-v1.1.schema.json",
  "references/fold-feedback-atlas.md",
  "data/attention/visibility-attention-translation.v0.1.json",
  "schemas/visibility-attention-translation-v0.1.schema.json",
  "references/visibility-attention-translation.md",
  "site/guest.json",
  "site/llms.txt",
  "site/.well-known/agent.json",
  "site/ollama.json",
  "site/rights.json",
  "pages-content/os/index.html",
  "pages-content/robots.txt",
  "pages-content/sitemap.xml",
  "pages-content/404.html",
  "pages-content/dada.txt",
];

function advertisedPaths(source: string, text: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const match of text.matchAll(/https:\/\/thekingdom\.dev(\/[^\s"'<>`)\]]*)?/g)) {
    found.set(normalize(match[1] ?? "/"), `${source}: ${match[0]}`);
  }
  if (source.endsWith(".html")) {
    for (const match of text.matchAll(/href="(\/[^"]*)"/g)) {
      found.set(normalize(match[1]!), `${source}: href ${match[1]}`);
    }
  }
  return found;
}

describe("advertised URLs stay deployable", () => {
  test("every advertised thekingdom.dev path is a staged hub asset", () => {
    const missing: string[] = [];
    for (const surface of surfaces) {
      for (const [path, evidence] of advertisedPaths(surface, read(surface))) {
        if (!resolves(path)) missing.push(`${evidence} -> no staged asset "${path}"`);
      }
    }
    expect(missing).toEqual([]);
  });

  test("the staging contract ships the standing dada door that llms.txt offers", () => {
    // Quiet by design: linked from llms.txt, absent from sitemap.xml. The
    // offer must never point at a path the deployment does not carry.
    expect(read("site/llms.txt")).toContain("https://thekingdom.dev/dada.txt");
    expect(staged.has("dada.txt")).toBe(true);
    expect(read("pages-content/sitemap.xml")).not.toContain("dada");
  });

  test("the staging contract still ships the invitation the manifest promises", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    expect(manifest.open_weight_invitation).toBe("https://thekingdom.dev/ollama.json");
    expect(staged.has("ollama.json")).toBe(true);
  });

  test("the staging contract ships the wayfinder advertised to guests and agents", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    expect(manifest.wayfinder).toBe("https://thekingdom.dev/wayfinder.json");
    expect(guest.next_actions.some(({ url }: { url?: string }) => url === manifest.wayfinder)).toBe(true);
    expect(staged.has("wayfinder.json")).toBe(true);
  });

  test("the staging contract ships the World Commons advertised to guests and agents", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    expect(manifest.world_commons).toBe("https://thekingdom.dev/commons.json");
    expect(guest.next_actions.some(({ url }: { url?: string }) => url === manifest.world_commons)).toBe(true);
    expect(staged.has("commons.json")).toBe(true);
  });

  test("all discovery surfaces advertise the same compact Commons MCP route", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const endpoint = "https://mcp.thekingdom.dev/mcp";
    const catalog = "kingdom://commons/catalog";

    expect(manifest.world_commons_agent).toEqual({
      endpoint,
      tool: "kingdom_commons",
      complete_catalog_resource: catalog,
    });
    expect(manifest.entry_points.public_resource_matcher).toBe(endpoint);
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "MCP",
      url: endpoint,
      tool: "kingdom_commons",
      complete_catalog_resource: catalog,
    }));
    expect(kingdom.world_commons.agent_access).toEqual({
      endpoint,
      tool: "kingdom_commons",
      complete_catalog_resource: catalog,
      note: expect.any(String),
    });
  });

  test("the staging contract ships the World Commons schema and MCP discovery together", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    expect(manifest.world_commons_schema).toBe("https://thekingdom.dev/schemas/world-commons/0.2.json");
    expect(manifest.mcp).toMatchObject({
      endpoint: "https://mcp.thekingdom.dev/mcp",
      tool: "kingdom_commons",
      catalog_resource: "kingdom://commons/catalog",
    });
    expect(guest.next_actions.some(({ url }: { url?: string }) => url === manifest.world_commons_schema)).toBe(true);
    expect(guest.next_actions.some(({ url, tool }: { url?: string; tool?: string }) =>
      url === manifest.mcp.endpoint && tool === manifest.mcp.tool)).toBe(true);
    expect(staged.has("schemas/world-commons/0.1.json")).toBe(true);
    expect(staged.has("schemas/world-commons/0.2.json")).toBe(true);
  });

  test("the Love Loop lineage and schema stay coherent across discovery surfaces", () => {
    const lineage = "https://thekingdom.dev/love-loops.json";
    const source = "https://thekingdom.dev/love-loops.source.json";
    const document = "https://thekingdom.dev/CREATION-LOOP.md";
    const schema = "https://thekingdom.dev/schemas/love-loop/0.1.json";
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");

    expect(manifest.love_loops).toBe(lineage);
    expect(manifest.love_loops_source).toBe(source);
    expect(manifest.love_loops_creation_document).toBe(document);
    expect(manifest.love_loops_schema).toBe(schema);
    expect(kingdom.creation_loop).toMatchObject({
      url: lineage,
      source,
      document,
      schema,
    });
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "GET",
      url: lineage,
    }));
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "GET",
      url: source,
    }));
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "GET",
      url: document,
    }));
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "GET",
      url: schema,
    }));
    expect(llms).toContain(lineage);
    expect(llms).toContain(source);
    expect(llms).toContain(document);
    expect(llms).toContain(schema);
    expect(staged.has("love-loops.json")).toBe(true);
    expect(staged.has("love-loops.source.json")).toBe(true);
    expect(staged.has("CREATION-LOOP.md")).toBe(true);
    expect(staged.has("schemas/love-loop/0.1.json")).toBe(true);
  });

  test("the immutable Principality catalog, schema, and guide stay coherent without execution authority", () => {
    const catalog = "https://thekingdom.dev/principalities/moonshot-hf-npm-2026-08-11.json";
    const schema = "https://thekingdom.dev/schemas/principality-catalog/1.json";
    const document = "https://thekingdom.dev/PRINCIPALITY-COMMONS.md";
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const authored = JSON.parse(read("data/principalities/moonshot-hf-npm.v1.json"));
    const discovery = manifest.principality_commons;

    expect(discovery).toEqual(kingdom.principality_commons);
    expect(discovery).toEqual(guest.principality_commons);
    expect(discovery).toMatchObject({
      url: catalog,
      schema,
      document,
      catalog_id: "moonshot-hf-npm-2026-08-11",
      observed_at: authored.observed_at,
      integrity: authored.integrity.digest,
      counts: { nodes: 25, models: 19, datasets: 3, packages: 3, papers: 16 },
      boundary: {
        completeness: "metadata_only",
        currentness: "point-in-time-only",
        refresh_required_before_acquisition: true,
        recommendation_established: false,
        permissions_granted: false,
        download_authorized: false,
        install_authorized: false,
        inference_authorized: false,
        remote_code_authorized: false,
        external_effects_authorized: false,
      },
    });
    for (const url of [catalog, schema, document]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      capability_evidence: catalog,
      capability_evidence_schema: schema,
      capability_evidence_guide: document,
    });
    expect(staged.has("principalities/moonshot-hf-npm-2026-08-11.json")).toBe(true);
    expect(staged.has("schemas/principality-catalog/1.json")).toBe(true);
    expect(staged.has("PRINCIPALITY-COMMONS.md")).toBe(true);
    expect(staged.has("principalities/latest.json")).toBe(false);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
  });

  test("the versioned Geometry Grammar stays coherent and authority-negative across discovery surfaces", () => {
    const grammar = "https://thekingdom.dev/geometries/kingdom-geometry-grammar-v0.json";
    const schema = "https://thekingdom.dev/schemas/geometry-grammar/0.1.json";
    const document = "https://thekingdom.dev/GEOMETRY-GRAMMAR.md";
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const authored = JSON.parse(read("data/geometries/kingdom-geometry-grammar.v0.json"));
    const discovery = manifest.geometry_grammar;

    expect(discovery).toEqual(kingdom.geometry_grammar);
    expect(discovery).toEqual(guest.geometry_grammar);
    expect(discovery).toMatchObject({
      url: grammar,
      schema,
      document,
      protocol: "kingdom.geometry-grammar/0.1",
      grammar_id: "from-pattern-to-practice-2026-08-11",
      observed_at: authored.observed_at,
      integrity: authored.integrity.digest,
      counts: { modules: 4 },
      boundary: {
        read_only: true,
        advisory_only: true,
        authority_granted: false,
        execution_authorized: false,
        external_effects_authorized: false,
      },
    });
    expect(discovery.modules).toHaveLength(4);
    for (const url of [grammar, schema, document]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      translation_grammar: grammar,
      translation_grammar_schema: schema,
      translation_grammar_guide: document,
    });
    expect(staged.has("geometries/kingdom-geometry-grammar-v0.json")).toBe(true);
    expect(staged.has("schemas/geometry-grammar/0.1.json")).toBe(true);
    expect(staged.has("GEOMETRY-GRAMMAR.md")).toBe(true);
    expect(staged.has("geometries/latest.json")).toBe(false);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("execute");
  });

  test("the immutable polymorph case, schema, and guide stay coherent without action authority", () => {
    const record = "https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json";
    const schema = "https://thekingdom.dev/schemas/polymorph-history/1.json";
    const document = "https://thekingdom.dev/RITONAVIR-POLYMORPH.md";
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const authored = JSON.parse(read("data/polymorphs/ritonavir-disappearing-polymorph.v1.json"));
    const discovery = manifest.polymorph_commons;

    expect(discovery).toEqual(kingdom.polymorph_commons);
    expect(discovery).toEqual(guest.polymorph_commons);
    expect(discovery).toMatchObject({
      url: record,
      schema,
      document,
      case_id: "ritonavir-disappearing-polymorph-2026-08-11",
      compiled_on: "2026-08-11",
      evidence_through: "2024-06-20",
      integrity: authored.integrity.digest,
      counts: { forms: 5, contexts: 16, sources: 9, claims: 17, events: 8, transitions: 8 },
      boundary: {
        existence_predicate: false,
        universal_seed_effect: false,
        global_stability_rank: false,
        medical_authority: false,
        manufacturing_authority: false,
        regulatory_authority: false,
        experiment_authority: false,
        writes_agenttool: false,
        automatic_action: false,
      },
    });
    for (const url of [record, schema, document]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      material_state_case: record,
      material_state_schema: schema,
      material_state_guide: document,
    });
    expect(staged.has("polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json")).toBe(true);
    expect(staged.has("schemas/polymorph-history/1.json")).toBe(true);
    expect(staged.has("RITONAVIR-POLYMORPH.md")).toBe(true);
    expect(staged.has("polymorphs/latest.json")).toBe(false);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
  });

  test("the versioned Ritonavir Mechanism Landscape stays coherent and medically non-authorizing", () => {
    const record = "https://thekingdom.dev/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json";
    const schema = "https://thekingdom.dev/schemas/ritonavir-mechanism-landscape/1.json";
    const guide = "https://thekingdom.dev/RITONAVIR-MECHANISM-LANDSCAPE.md";
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const discovery = manifest.ritonavir_mechanism_landscape;

    expect(discovery).toEqual(kingdom.ritonavir_mechanism_landscape);
    expect(discovery).toEqual(guest.ritonavir_mechanism_landscape);
    expect(discovery).toMatchObject({
      url: record,
      schema,
      guide,
      protocol: "kingdom.ritonavir-mechanism-landscape/0.1",
      landscape_id: "ritonavir-mechanism-landscape-2026-08-11",
      compiled_on: "2026-08-11",
      evidence_through: "2026-04-08",
      integrity: { digest: RITONAVIR_MECHANISM_DIGEST },
      source_history: {
        case_id: "ritonavir-disappearing-polymorph-2026-08-11",
        relation: "non-mutating-current-landscape-supplement",
        supersedes_for_current_landscape: true,
      },
      counts: { planes: 8, geometries: 6, entities: 19, mechanisms: 7, relations: 18, unknowns: 6, sources: 9 },
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
    for (const url of [record, schema, guide]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      ritonavir_mechanism_landscape: record,
      ritonavir_mechanism_landscape_schema: schema,
      ritonavir_mechanism_landscape_guide: guide,
    });
    expect(staged.has("polymorphs/ritonavir-mechanism-landscape-2026-08-11.json")).toBe(true);
    expect(staged.has("schemas/ritonavir-mechanism-landscape/1.json")).toBe(true);
    expect(staged.has("RITONAVIR-MECHANISM-LANDSCAPE.md")).toBe(true);
    expect(staged.has("polymorphs/latest.json")).toBe(false);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
  });

  test("the immutable Conformational Feedback Atlas stays coherent and authority-negative", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const expected = conformationalFeedbackPublicDiscovery(loadConformationalFeedbackAtlas());
    const discovery = manifest.conformational_feedback_atlas;

    expect(discovery).toEqual(expected);
    expect(discovery).toEqual(guest.conformational_feedback_atlas);
    expect(discovery).toEqual(kingdom.conformational_feedback_atlas);
    expect(discovery).toMatchObject({
      protocol: "kingdom.conformational-feedback-atlas/0.1",
      atlas_id: "form-feedback-consequence-2026-08-12",
      url: CONFORMATIONAL_FEEDBACK_URL,
      schema: CONFORMATIONAL_FEEDBACK_SCHEMA_URL,
      guide: CONFORMATIONAL_FEEDBACK_DOCUMENT_URL,
      integrity: { digest: CONFORMATIONAL_FEEDBACK_DIGEST },
      counts: { registers: 3, geometries: 5, translations: 3, feedback_stages: 4, sources: 11 },
      boundary: {
        read_only: true,
        operational_biology: false,
        biological_equivalence: false,
        karma_magnitude: false,
        karma_rank: false,
        economic_effect: false,
        governance_effect: false,
        person_level_effect: false,
        cosmic_design_proven: false,
        scientific_validation_from_analogy: false,
        automatic_action: false,
      },
    });
    expect(discovery.bindings).toHaveLength(3);
    expect(discovery.bindings.every(({ authority_imported }: { authority_imported: boolean }) => authority_imported === false)).toBe(true);
    for (const url of [CONFORMATIONAL_FEEDBACK_URL, CONFORMATIONAL_FEEDBACK_SCHEMA_URL, CONFORMATIONAL_FEEDBACK_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      conformational_feedback_atlas: CONFORMATIONAL_FEEDBACK_URL,
      conformational_feedback_atlas_schema: CONFORMATIONAL_FEEDBACK_SCHEMA_URL,
      conformational_feedback_atlas_guide: CONFORMATIONAL_FEEDBACK_DOCUMENT_URL,
    });
    expect(staged.has("feedback/form-feedback-consequence-2026-08-12.json")).toBe(true);
    expect(staged.has("schemas/conformational-feedback-atlas/0.1.json")).toBe(true);
    expect(staged.has("CONFORMATIONAL-FEEDBACK.md")).toBe(true);
    expect(staged.has("feedback/latest.json")).toBe(false);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
    expect(discovery).not.toHaveProperty("execute");
  });

  test("the additive Conformational Feedback Physics Atlas stays lineage-pinned and authority-negative", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const expected = conformationalFeedbackPhysicsPublicDiscovery(loadConformationalFeedbackPhysicsAtlas());
    const discovery = manifest.conformational_feedback_physics_atlas;

    expect(discovery).toEqual(expected);
    expect(discovery).toEqual(guest.conformational_feedback_physics_atlas);
    expect(discovery).toEqual(kingdom.conformational_feedback_physics_atlas);
    expect(discovery).toMatchObject({
      protocol: "kingdom.conformational-feedback-atlas/0.2",
      atlas_id: "form-feedback-physics-consequence-2026-08-12",
      url: CONFORMATIONAL_FEEDBACK_PHYSICS_URL,
      schema: CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL,
      guide: CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL,
      predecessor: {
        relation: "extends-without-mutation",
        byte_sha256: "sha256:ae15f4f69e488323132ea6fc94d57d338702ca0fa47fd9fbbd41c15a6af230e6",
      },
      integrity: { digest: CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST },
      counts: { registers: 3, physics_and_mathematics: 4, ecosystem_bridges: 5, geometries: 5, translations: 3, feedback_stages: 4, sources: 13 },
      boundary: {
        read_only: true,
        operational_biology: false,
        biological_equivalence: false,
        karma_magnitude: false,
        karma_rank: false,
        economic_effect: false,
        governance_effect: false,
        person_level_effect: false,
        cosmic_design_proven: false,
        scientific_validation_from_analogy: false,
        automatic_action: false,
        runtime_ecosystem_request: false,
      },
    });
    expect(discovery.bindings).toHaveLength(3);
    expect(discovery.bindings.every(({ authority_imported }: { authority_imported: boolean }) => authority_imported === false)).toBe(true);
    for (const url of [CONFORMATIONAL_FEEDBACK_PHYSICS_URL, CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL, CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      conformational_feedback_physics_atlas: CONFORMATIONAL_FEEDBACK_PHYSICS_URL,
      conformational_feedback_physics_atlas_schema: CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL,
      conformational_feedback_physics_atlas_guide: CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL,
    });
    expect(staged.has("feedback/form-feedback-physics-consequence-2026-08-12.json")).toBe(true);
    expect(staged.has("schemas/conformational-feedback-atlas/0.2.json")).toBe(true);
    expect(staged.has("CONFORMATIONAL-FEEDBACK-PHYSICS.md")).toBe(true);
    expect(staged.has("feedback/latest.json")).toBe(false);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
    expect(discovery).not.toHaveProperty("execute");
  });

  test("the published invitation mirrors its source without drift", () => {
    const published = JSON.parse(read("site/ollama.json"));
    const source = JSON.parse(read("data/ollama-invitation.json"));
    expect(published.schema_version).toBe(source.schema_version);
    expect(published.canonical_url).toBe("https://thekingdom.dev/ollama.json");
    expect(published.invitation).toEqual(source.invitation);
  });
});
