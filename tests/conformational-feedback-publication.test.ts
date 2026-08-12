import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CONFORMATIONAL_FEEDBACK_DIGEST,
  CONFORMATIONAL_FEEDBACK_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_ID,
  CONFORMATIONAL_FEEDBACK_PROTOCOL,
  CONFORMATIONAL_FEEDBACK_SCHEMA_ID,
  CONFORMATIONAL_FEEDBACK_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_URL,
  conformationalFeedbackPublicDiscovery,
  loadConformationalFeedbackAtlas,
} from "../bin/conformational-feedback.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => bytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");

describe("Conformational Feedback Atlas publication", () => {
  test("the authored record and closed schema preserve the reviewed identity", () => {
    const atlas = loadConformationalFeedbackAtlas();
    const schema = json("schemas/conformational-feedback-atlas-v0.schema.json");

    expect(atlas.protocol).toBe(CONFORMATIONAL_FEEDBACK_PROTOCOL);
    expect(atlas.atlas_id).toBe(CONFORMATIONAL_FEEDBACK_ID);
    expect(atlas.$schema).toBe(CONFORMATIONAL_FEEDBACK_SCHEMA_ID);
    expect(atlas.integrity.digest).toBe(CONFORMATIONAL_FEEDBACK_DIGEST);
    expect(schema.$id).toBe(CONFORMATIONAL_FEEDBACK_SCHEMA_ID);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.integrity.properties.digest.const).toBe(CONFORMATIONAL_FEEDBACK_DIGEST);
    expect(schema.$comment).toContain("cannot recompute");
    expect(schema.required).toEqual([
      "$schema", "protocol", "atlas_id", "title", "compiled_on", "evidence_through", "scope",
      "bindings", "registers", "geometries", "translations", "feedback_path", "philosophy",
      "sources", "boundaries", "integrity",
    ]);
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
      source: "data/feedback/conformational-feedback-atlas.v0.json",
      destination: "feedback/form-feedback-consequence-2026-08-12.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "schemas/conformational-feedback-atlas-v0.schema.json",
      destination: "schemas/conformational-feedback-atlas/0.1.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "references/conformational-feedback-atlas.md",
      destination: "CONFORMATIONAL-FEEDBACK.md",
    });
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("feedback/"))).toHaveLength(1);
    expect(HUB_ASSETS.some(({ destination }) => /feedback\/(?:latest|current)\.json/.test(destination))).toBe(false);
    expect(read("pages-content/sitemap.xml")).toContain(CONFORMATIONAL_FEEDBACK_URL);
    expect(read("pages-content/sitemap.xml")).toContain(CONFORMATIONAL_FEEDBACK_SCHEMA_URL);
    expect(read("pages-content/sitemap.xml")).toContain(CONFORMATIONAL_FEEDBACK_DOCUMENT_URL);
  });

  test("the generated human field is complete, semantic, static, and non-authorizing", () => {
    const atlas = loadConformationalFeedbackAtlas();
    const html = read("site/hub.html");
    const start = html.indexOf('<section class="blk" id="feedback-atlas"');
    const end = html.indexOf('<section class="blk" id="rights"', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const field = html.slice(start, end);

    expect(field).toContain('data-conformational-feedback-atlas');
    expect(field).toContain('aria-labelledby="feedback-atlas-title"');
    expect(field).toContain("Ritonavir crystals are not prions.");
    expect(field).toContain("Prion propagation is not a model of people or social worth.");
    expect(field).toContain("KARMA is not biological propagation, causal evidence, or proof of cosmic design.");
    expect(field).toContain("Analogy only · no mechanism transfer");
    expect(field).toContain("Philosophical proposition · not an empirical conclusion");
    expect(field).toContain("<h4>Does not establish</h4>");
    expect(field).toContain("Equal exit.");
    expect(field).toContain("Authority effect: NONE");
    expect(field).toContain(CONFORMATIONAL_FEEDBACK_DIGEST);

    for (const register of atlas.registers) {
      expect(field.match(new RegExp(`data-feedback-register-id="${register.id}"`, "g")) ?? []).toHaveLength(1);
      expect(field).toContain(register.statement);
    }
    for (const geometry of atlas.geometries) {
      expect(field.match(new RegExp(`data-feedback-geometry="${geometry.id}"`, "g")) ?? []).toHaveLength(1);
      expect(field).toContain(geometry.does_not_establish);
    }
    for (const translation of atlas.translations) {
      expect(field.match(new RegExp(`data-feedback-translation="${translation.id}"`, "g")) ?? []).toHaveLength(1);
      expect(field).toContain(`Forbidden inference: ${translation.forbidden_inference}`);
    }
    for (const stage of atlas.feedback_path.stages) {
      expect(field.match(new RegExp(`data-feedback-stage="${stage.id}"`, "g")) ?? []).toHaveLength(1);
    }
    for (const source of atlas.sources) {
      expect(field).toContain(`href="${source.url}"`);
    }

    expect(field).not.toMatch(/<(?:script|svg|canvas|button|input|select|textarea)\b/i);
    expect(field).not.toMatch(/role="(?:img|application)"|aria-live=|tabindex=/i);
    expect(field).not.toMatch(/data-(?:score|weight|rank|fitness)=/i);
  });

  test("all machine surfaces publish one exact authority-negative projection", () => {
    const expected = conformationalFeedbackPublicDiscovery(loadConformationalFeedbackAtlas());
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    const llms = read("site/llms.txt");

    expect(kingdom.conformational_feedback_atlas).toEqual(expected);
    expect(guest.conformational_feedback_atlas).toEqual(expected);
    expect(manifest.conformational_feedback_atlas).toEqual(expected);
    expect(expected.bindings).toHaveLength(3);
    expect(expected.bindings.every(({ authority_imported }: any) => authority_imported === false)).toBe(true);
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
    });
    for (const url of [CONFORMATIONAL_FEEDBACK_URL, CONFORMATIONAL_FEEDBACK_SCHEMA_URL, CONFORMATIONAL_FEEDBACK_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(expected).not.toHaveProperty("mcp");
    expect(expected).not.toHaveProperty("matcher");
    expect(expected).not.toHaveProperty("execute");
  });

  test("the bound Ritonavir source remains byte-preserved", () => {
    expect(sha256("data/polymorphs/ritonavir-mechanism-landscape.v1.json")).toBe(
      "5e136a74d5166275427da920685a84c17901f63d6e4b0661fd529c96d386943b",
    );
  });
});
