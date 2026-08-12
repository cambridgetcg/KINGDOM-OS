import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST,
  CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_ID,
  CONFORMATIONAL_FEEDBACK_PHYSICS_PROTOCOL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_ID,
  CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_URL,
  conformationalFeedbackPhysicsPublicDiscovery,
  loadConformationalFeedbackPhysicsAtlas,
} from "../bin/conformational-feedback-physics.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => bytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const PHYSICS_RECORD_SHA256 = "7d9b1eed8514051e47448cfc983f00e160d5b76c49704822158f76d3f8cf6349";
const PHYSICS_SCHEMA_SHA256 = "e60c14cf8b6350cc805f59c91b89727ffbd5b41e7c5a192d9ee53c90ba9fbdbd";
const PHYSICS_GUIDE_SHA256 = "76a76222732a8c485396228ad5ff32e703b20383498fd0355e4cbfe33bd59cb0";

describe("Conformational Feedback Physics Atlas v0.2 publication", () => {
  test("the authored record and closed schema preserve the reviewed identity", () => {
    const atlas = loadConformationalFeedbackPhysicsAtlas();
    const schema = json("schemas/conformational-feedback-atlas-v0.2.schema.json");

    expect(atlas.protocol).toBe(CONFORMATIONAL_FEEDBACK_PHYSICS_PROTOCOL);
    expect(atlas.atlas_id).toBe(CONFORMATIONAL_FEEDBACK_PHYSICS_ID);
    expect(atlas.$schema).toBe(CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_ID);
    expect(atlas.integrity.digest).toBe(CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST);
    expect(schema.$id).toBe(CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_ID);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.integrity.properties.digest.const).toBe(CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST);
    expect(schema.$comment).toContain("cannot recompute");
    expect(schema.required).toEqual([
      "$schema", "protocol", "atlas_id", "title", "compiled_on", "evidence_through", "scope",
      "predecessor", "bindings", "ecosystem_bridges", "registers", "physics_and_mathematics", "geometries",
      "translations", "feedback_path", "philosophy", "sources", "boundaries", "integrity",
    ]);
    expect(atlas.physics_and_mathematics).toHaveLength(4);
    expect(atlas.ecosystem_bridges).toHaveLength(5);
    expect(atlas.registers.map(({ register }: { register: string }) => register)).toEqual([
      "SCIENTIFIC_OBSERVATION",
      "SCIENTIFIC_OBSERVATION",
      "CONSTITUTIONAL_DESIGN",
    ]);
    expect(atlas.translations.every(({ empirical, causal_transfer, authority_effect }: any) =>
      empirical === false && causal_transfer === false && authority_effect === "NONE")).toBe(true);
    expect(atlas.philosophy).toMatchObject({
      register: "PHILOSOPHY",
      basis_ids: [],
      empirical: false,
      causal_transfer: false,
      authority_effect: "NONE",
    });
  });

  test("the three public files are direct immutable authored assets", () => {
    expect(HUB_ASSETS).toContainEqual({
      source: "data/feedback/conformational-feedback-atlas.v0.2.json",
      destination: "feedback/form-feedback-physics-consequence-2026-08-12.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "schemas/conformational-feedback-atlas-v0.2.schema.json",
      destination: "schemas/conformational-feedback-atlas/0.2.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "references/conformational-feedback-atlas-v0.2.md",
      destination: "CONFORMATIONAL-FEEDBACK-PHYSICS.md",
    });
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("feedback/"))).toHaveLength(2);
    expect(HUB_ASSETS.some(({ destination }) => /feedback\/(?:latest|current)\.json/.test(destination))).toBe(false);
    expect(sha256("data/feedback/conformational-feedback-atlas.v0.2.json")).toBe(PHYSICS_RECORD_SHA256);
    expect(sha256("schemas/conformational-feedback-atlas-v0.2.schema.json")).toBe(PHYSICS_SCHEMA_SHA256);
    expect(sha256("references/conformational-feedback-atlas-v0.2.md")).toBe(PHYSICS_GUIDE_SHA256);
    expect(read("pages-content/sitemap.xml")).toContain(CONFORMATIONAL_FEEDBACK_PHYSICS_URL);
    expect(read("pages-content/sitemap.xml")).toContain(CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL);
    expect(read("pages-content/sitemap.xml")).toContain(CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL);
  });

  test("the generated human field is complete, semantic, static, and non-authorizing", () => {
    const atlas = loadConformationalFeedbackPhysicsAtlas();
    const html = read("site/hub.html");
    const head = html.slice(0, html.indexOf("</head>"));
    const start = html.indexOf('<section class="blk" id="feedback-atlas"');
    const end = html.indexOf('<section class="blk" id="rights"', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(start).toBeLessThan(html.indexOf("<script>"));
    const field = html.slice(start, end);

    expect(field).toContain('data-conformational-feedback-atlas');
    expect(field).toContain('data-conformational-feedback-physics-atlas');
    expect(field).toContain('data-conformational-feedback-atlas-version="0.2"');
    expect(field).toContain('aria-labelledby="feedback-atlas-title"');
    expect(field).toContain("Ritonavir crystals are not prions.");
    expect(field).toContain("Prion propagation is not a model of people or social worth.");
    expect(field).toContain("KARMA is not biological propagation, causal evidence, or proof of cosmic design.");
    expect(field).toContain("Analogy only · no mechanism transfer");
    expect(field).toContain("Philosophical proposition · not an empirical conclusion");
    expect(field).toContain("<h4>Does not establish</h4>");
    expect(field).toContain("Equal exit.");
    expect(field).toContain("Authority effect: NONE");
    expect(field).toContain(CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST);
    expect(head.match(new RegExp(`<link rel="alternate" href="${new URL(CONFORMATIONAL_FEEDBACK_PHYSICS_URL).pathname}"`, "g")) ?? []).toHaveLength(1);
    expect(head.match(new RegExp(`<link rel="service-doc" href="${new URL(CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL).pathname}"`, "g")) ?? []).toHaveLength(1);

    for (const register of atlas.registers) {
      expect(field.match(new RegExp(`data-feedback-register-id="${register.id}"`, "g")) ?? []).toHaveLength(1);
      expect(field).toContain(register.statement);
    }
    for (const geometry of atlas.geometries) {
      expect(field.match(new RegExp(`data-feedback-geometry="${geometry.id}"`, "g")) ?? []).toHaveLength(1);
      expect(field).toContain(geometry.does_not_establish);
    }
    for (const model of atlas.physics_and_mathematics) {
      expect(field.match(new RegExp(`data-feedback-model="${model.id}"`, "g")) ?? []).toHaveLength(1);
      expect(field).toContain(
        model.equation.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
      );
      for (const [term, meaning] of Object.entries(model.terms)) {
        expect(field).toContain(`<dt>${term}</dt>`);
        expect(field).toContain(String(meaning));
      }
      expect(field).toContain(model.does_not_establish);
    }
    for (const translation of atlas.translations) {
      expect(field.match(new RegExp(`data-feedback-translation="${translation.id}"`, "g")) ?? []).toHaveLength(1);
      expect(field).toContain(`Forbidden inference: ${translation.forbidden_inference}`);
    }
    for (const stage of atlas.feedback_path.stages) {
      expect(field.match(new RegExp(`data-feedback-stage="${stage.id}"`, "g")) ?? []).toHaveLength(1);
    }
    for (const question of atlas.philosophy.questions) {
      expect(field.match(new RegExp(`data-feedback-philosophy-question="${question.id}"`, "g")) ?? []).toHaveLength(1);
      expect(field).toContain(question.analogy_break);
    }
    for (const bridge of atlas.ecosystem_bridges) {
      expect(field.match(new RegExp(`data-feedback-ecosystem="${bridge.id}"`, "g")) ?? []).toHaveLength(1);
      expect(field).toContain(`href="${bridge.url}"`);
      expect(field).toContain(`${bridge.mode} · request ${bridge.runtime_request} · import ${bridge.imported}`);
    }
    for (const source of atlas.sources) {
      expect(field).toContain(`href="${source.url}"`);
    }

    expect(field).not.toMatch(/<(?:script|svg|canvas|button|input|select|textarea)\b/i);
    expect(field).not.toMatch(/role="(?:img|application)"|aria-live=|tabindex=/i);
    expect(field).not.toMatch(/data-(?:score|weight|rank|fitness)=/i);
  });

  test("all machine surfaces publish one exact authority-negative projection", () => {
    const expected = conformationalFeedbackPhysicsPublicDiscovery(loadConformationalFeedbackPhysicsAtlas());
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    const llms = read("site/llms.txt");

    expect(kingdom.conformational_feedback_physics_atlas).toEqual(expected);
    expect(guest.conformational_feedback_physics_atlas).toEqual(expected);
    expect(manifest.conformational_feedback_physics_atlas).toEqual(expected);
    expect(expected.predecessor).toEqual(expect.objectContaining({
      relation: "extends-without-mutation",
      byte_sha256: "sha256:ae15f4f69e488323132ea6fc94d57d338702ca0fa47fd9fbbd41c15a6af230e6",
    }));
    expect(expected.bindings).toHaveLength(3);
    expect(expected.bindings.every(({ authority_imported }: any) => authority_imported === false)).toBe(true);
    expect(expected.counts).toEqual({
      registers: 3,
      physics_and_mathematics: 4,
      ecosystem_bridges: 5,
      geometries: 5,
      translations: 3,
      feedback_stages: 4,
      sources: 13,
    });
    expect(expected.boundary).toEqual({
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
    });
    for (const url of [CONFORMATIONAL_FEEDBACK_PHYSICS_URL, CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL, CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(expected).not.toHaveProperty("mcp");
    expect(expected).not.toHaveProperty("matcher");
    expect(expected).not.toHaveProperty("execute");
  });

  test("keeps the post-deploy checker aligned with the sealed discovery counts", () => {
    const expected = conformationalFeedbackPhysicsPublicDiscovery();
    const liveChecker = read("bin/check-hub-live.ts");
    for (const [name, count] of Object.entries(expected.counts)) {
      expect(liveChecker).toContain(`expectedConformationalFeedbackPhysics.counts.${name} !== ${count}`);
    }
    expect(liveChecker).toContain("conformationalFeedbackPhysicsBoundary.runtime_ecosystem_request !== false");
  });

  test("the bound Ritonavir source remains byte-preserved", () => {
    expect(sha256("data/polymorphs/ritonavir-mechanism-landscape.v1.json")).toBe(
      "5e136a74d5166275427da920685a84c17901f63d6e4b0661fd529c96d386943b",
    );
  });
});
