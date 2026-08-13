import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CULTURAL_ATTENTION_FEEDBACK_DIGEST,
  CULTURAL_ATTENTION_FEEDBACK_ID,
  CULTURAL_ATTENTION_FEEDBACK_PATH,
  CULTURAL_ATTENTION_FEEDBACK_PROTOCOL,
  CULTURAL_ATTENTION_FEEDBACK_SCHEMA_ID,
  CULTURAL_ATTENTION_FEEDBACK_SCHEMA_PATH,
  culturalAttentionFeedbackDigest,
  culturalAttentionFeedbackPublicDiscovery,
  loadCulturalAttentionFeedbackAtlas,
  verifyCulturalAttentionFeedbackAtlas,
} from "../bin/cultural-attention-feedback.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const temporary: string[] = [];

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop()!, { recursive: true, force: true });
});

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "cultural-attention-feedback-test."));
  temporary.push(root);
  return root;
}

function authored(): any {
  return JSON.parse(readFileSync(CULTURAL_ATTENTION_FEEDBACK_PATH, "utf8"));
}

function reSign(value: any): any {
  value.integrity.digest = culturalAttentionFeedbackDigest(value);
  return value;
}

function codes(value: unknown): string[] {
  return verifyCulturalAttentionFeedbackAtlas(value).map((issue) => issue.code);
}

function byId(values: any[], id: string): any {
  return values.find((item) => item.id === id);
}

describe("Cultural Attention & Feedback Atlas", () => {
  test("loads one deterministic source-bound atlas", () => {
    const atlas = loadCulturalAttentionFeedbackAtlas();
    expect(verifyCulturalAttentionFeedbackAtlas(atlas)).toEqual([]);
    expect(atlas).toMatchObject({
      $schema: CULTURAL_ATTENTION_FEEDBACK_SCHEMA_ID,
      protocol: CULTURAL_ATTENTION_FEEDBACK_PROTOCOL,
      atlas_id: CULTURAL_ATTENTION_FEEDBACK_ID,
      compiled_on: "2026-08-13",
      evidence_through: "2025-06-26",
    });
    expect(atlas.integrity.digest).toBe(CULTURAL_ATTENTION_FEEDBACK_DIGEST);
    expect(culturalAttentionFeedbackDigest(atlas)).toBe(CULTURAL_ATTENTION_FEEDBACK_DIGEST);
    expect(atlas.source_bindings.map((binding: any) => binding.id)).toEqual([
      "kingdom-polymorph-history",
      "kingdom-ritonavir-mechanism",
      "kingdom-conformational-physics",
      "kingdom-fold-feedback",
      "zerone-karma-foundation",
    ]);
    expect(atlas.ontology.planes).toHaveLength(8);
    expect(atlas.scientific_observations).toHaveLength(6);
    expect(atlas.models).toHaveLength(7);
    expect(atlas.translations).toHaveLength(4);
    expect(atlas.feedback).toHaveLength(5);
    expect(atlas.sources).toHaveLength(19);
  });

  test("keeps observation, model, analogy, design, and philosophy in declared registers", () => {
    const atlas = loadCulturalAttentionFeedbackAtlas();
    expect(atlas.ontology.planes.map((plane: any) => plane.id)).toEqual([
      "chemical-entity-and-crystal-phase",
      "bounded-particle-population",
      "cultural-item-and-remix",
      "exposure-and-attention",
      "cascade-and-platform-policy",
      "measured-outcome",
      "contextual-consequence-record",
      "philosophy-and-faith",
    ]);
    expect(byId(atlas.ontology.planes, "cultural-item-and-remix").does_not_establish).toContain("gene-like");
    expect(byId(atlas.ontology.planes, "measured-outcome").does_not_establish).toContain("diagnosis");
    expect(byId(atlas.scientific_observations, "ritonavir-disappearance-was-process-contingent").statement).toContain("process-contingent");
    expect(byId(atlas.models, "finite-attention-entropy").does_not_establish).toContain("diagnosis");
    expect(atlas.boundaries).toMatchObject({
      cultural_label_is_diagnosis: false,
      meme_is_crystal: false,
      meme_is_prion: false,
      meme_is_gene: false,
      popularity_is_truth: false,
      popularity_is_merit: false,
    });
  });

  test("makes every cross-domain translation bounded and non-causal", () => {
    const translations = loadCulturalAttentionFeedbackAtlas().translations;
    expect(translations.map((translation: any) => translation.id)).toEqual([
      "history-dependent-accessibility",
      "finite-capacity-and-competition",
      "returning-consequence",
      "form-pattern-and-meaning",
    ]);
    for (const translation of translations) {
      expect(translation).toMatchObject({
        register: "ANALOGY",
        relation: "bounded-analogy-not-same-as",
        causal_transfer: false,
        universal: false,
        authority_effect: "NONE",
      });
      expect(translation.preserved_patterns.length).toBeGreaterThan(0);
      expect(translation.analogy_breaks.length).toBeGreaterThan(0);
    }
    expect(byId(translations, "history-dependent-accessibility").analogy_breaks.join(" ")).toContain("No energy, temperature, seed, state, or probability is numerically transferred across domains");
  });

  test("separates feedback, KARMA, and moral value", () => {
    const atlas = loadCulturalAttentionFeedbackAtlas();
    expect(atlas.feedback.map((relation: any) => relation.id)).toEqual([
      "material-process-history-loop",
      "limited-attention-competition-loop",
      "recommender-observation-loop",
      "evidence-correction-loop",
      "rights-preserving-counterloop",
    ]);
    for (const relation of atlas.feedback) {
      expect(relation).toMatchObject({ truth_effect: false, person_score_effect: false, automatic_effect: false });
    }
    expect(atlas.karma.feedback_is_not_karma).toBe(true);
    expect(atlas.karma.zerone).toMatchObject({
      protocol: "zerone.karma.edge",
      event_refs: [],
      event_status: "not_observed",
    });
    expect(atlas.karma.kingdom).toMatchObject({
      protocol: "kingdom.karma/0.1",
      accounting: "receipts_not_scores",
      receipt_refs: [],
      receipt_status: "not_created",
    });
    expect(atlas.karma.adapter.exists).toBe(false);
    expect(atlas.boundaries).toMatchObject({
      feedback_is_moral_value: false,
      feedback_is_optimization: false,
      person_scoring: false,
      writes_karma: false,
      creates_kingdom_karma_receipt: false,
      observes_zerone_karma_event: false,
      karma_adapter: false,
    });
  });

  test("keeps ecosystem bridges inspectable, link-only, and non-authorizing", () => {
    const bridges = loadCulturalAttentionFeedbackAtlas().ecosystem_bridges;
    expect(bridges).toHaveLength(5);
    for (const bridge of bridges) {
      expect(bridge).toMatchObject({
        mode: "LINK_ONLY",
        runtime_request: false,
        imported: false,
        mutated: false,
        authority_imported: false,
        authority_effect: "NONE",
        write_authorized: false,
        automatic_action: false,
      });
    }
    expect(byId(bridges, "agenttool-signed-virality").does_not_establish).toContain("not an empirical diffusion law");
    expect(byId(bridges, "zerone-frontier-commons").does_not_establish).toContain("Inspection is not participation");
  });

  test("keeps universe design opt-in and scientifically underdetermined", () => {
    const atlas = loadCulturalAttentionFeedbackAtlas();
    expect(atlas.universe_lens).toMatchObject({
      participation: "opt-in",
      register: "philosophical-interpretation",
    });
    expect(atlas.universe_lens.questions).toHaveLength(5);
    expect(atlas.universe_lens.nonclaims).toContain("scientifically proves intentional universe design");
    expect(atlas.universe_lens.nonclaims).toContain("scientifically disproves a creator or metaphysical purpose");
    expect(atlas.boundaries).toMatchObject({
      scientifically_proves_universe_design: false,
      scientifically_disproves_universe_design: false,
      scientifically_proves_cosmic_karma: false,
      universal_mechanism_claimed: false,
    });
  });

  test("publishes a compact read-only discovery projection", () => {
    const discovery = culturalAttentionFeedbackPublicDiscovery();
    expect(discovery).toMatchObject({
      protocol: CULTURAL_ATTENTION_FEEDBACK_PROTOCOL,
      atlas_id: CULTURAL_ATTENTION_FEEDBACK_ID,
      integrity: { digest: CULTURAL_ATTENTION_FEEDBACK_DIGEST },
      counts: {
        source_bindings: 5,
        planes: 8,
        scientific_observations: 6,
        models: 7,
        translations: 4,
        feedback_relations: 5,
        universe_questions: 5,
        ecosystem_bridges: 5,
        unknowns: 10,
        sources: 19,
      },
      karma: {
        zerone_event_status: "not_observed",
        zerone_event_refs: 0,
        kingdom_receipt_status: "not_created",
        kingdom_receipt_refs: 0,
        adapter_exists: false,
      },
      boundary: {
        educational_metadata_only: true,
        public_surface_read_only: true,
        runtime_ecosystem_request: false,
        writes_karma: false,
        medical_authority: false,
        recommendation_authority: false,
        automatic_action: false,
      },
    });
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("write");
    expect(discovery).not.toHaveProperty("execute");
    expect(discovery).not.toHaveProperty("matcher");
  });

  test("rejects raw tampering and a self-signed replacement", () => {
    const raw = authored();
    raw.title += " changed";
    expect(codes(raw)).toContain("digest-mismatch");
    reSign(raw);
    expect(codes(raw)).toContain("reviewed-digest-mismatch");
  });

  test("rejects collapsed analogy, feedback, KARMA, philosophy, and authority firewalls", () => {
    const analogy = authored();
    analogy.translations[0].causal_transfer = true;
    reSign(analogy);
    expect(codes(analogy)).toContain("analogy-firewall-mismatch");

    const universal = authored();
    universal.translations[1].universal = true;
    reSign(universal);
    expect(codes(universal)).toContain("analogy-firewall-mismatch");

    const feedback = authored();
    feedback.feedback[0].truth_effect = true;
    reSign(feedback);
    expect(codes(feedback)).toContain("invalid-or-authorizing-feedback");

    const adapter = authored();
    adapter.karma.adapter.exists = true;
    reSign(adapter);
    expect(codes(adapter)).toContain("implicit-karma-adapter");

    const event = authored();
    event.karma.zerone.event_refs = ["bibliography-is-not-an-event"];
    reSign(event);
    expect(codes(event)).toContain("zerone-karma-mismatch");

    const philosophy = authored();
    philosophy.universe_lens.participation = "default";
    reSign(philosophy);
    expect(codes(philosophy)).toContain("universe-lens-mismatch");

    const nestedAuthority = authored();
    nestedAuthority.ecosystem_bridges[0].automatic_action = true;
    reSign(nestedAuthority);
    expect(verifyCulturalAttentionFeedbackAtlas(nestedAuthority)).toContainEqual({
      field: "$.ecosystem_bridges[0].automatic_action",
      code: "forbidden-authority-effect",
    });

    for (const field of [
      "contains_operational_protocol", "contains_personal_data", "cultural_label_is_diagnosis",
      "meme_is_crystal", "meme_is_prion", "meme_is_gene", "attention_is_consent",
      "engagement_is_welfare", "popularity_is_truth", "popularity_is_merit",
      "feedback_is_moral_value", "feedback_is_optimization", "person_scoring",
      "runtime_ecosystem_request", "ecosystem_write", "writes_karma",
      "creates_kingdom_karma_receipt", "observes_zerone_karma_event", "karma_adapter",
      "medical_authority", "clinical_authority", "experiment_authority",
      "manufacturing_authority", "moderation_authority", "recommendation_authority",
      "engagement_optimization_authority", "automatic_action",
      "scientifically_proves_universe_design", "scientifically_disproves_universe_design",
      "scientifically_proves_cosmic_karma", "universal_mechanism_claimed",
    ]) {
      const authority = authored();
      authority.boundaries[field] = true;
      reSign(authority);
      expect(verifyCulturalAttentionFeedbackAtlas(authority)).toContainEqual({
        field: `$.boundaries.${field}`,
        code: "boundary-mismatch",
      });
    }
  });

  test("rejects pin, reference, order, bridge, and unknown-state drift", () => {
    const pin = authored();
    pin.source_bindings[0].byte_sha256 = `sha256:${"0".repeat(64)}`;
    reSign(pin);
    expect(codes(pin)).toContain("reviewed-digest-mismatch");

    const reference = authored();
    reference.models[0].basis_ids = ["missing-source"];
    reSign(reference);
    expect(codes(reference)).toContain("invalid-or-unbounded-model");

    const bridge = authored();
    bridge.ecosystem_bridges[0].mode = "RUNTIME";
    reSign(bridge);
    expect(codes(bridge)).toContain("ecosystem-bridge-not-link-only");

    const unknown = authored();
    unknown.unknowns[0].status = "settled";
    reSign(unknown);
    expect(codes(unknown)).toContain("invalid-unknown");

    const duplicate = authored();
    duplicate.models[1].id = duplicate.models[0].id;
    reSign(duplicate);
    expect(codes(duplicate)).toContain("invalid-model-set");
  });

  test("rejects duplicate keys, invalid UTF-8, symlinks, and oversized input", () => {
    const root = fixtureRoot();
    const duplicate = join(root, "duplicate.json");
    writeFileSync(duplicate, '{"a":1,"\\u0061":2}');
    expect(() => loadCulturalAttentionFeedbackAtlas(duplicate)).toThrow("duplicate key");

    const invalidUtf8 = join(root, "invalid-utf8.json");
    writeFileSync(invalidUtf8, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]));
    expect(() => loadCulturalAttentionFeedbackAtlas(invalidUtf8)).toThrow("valid UTF-8");

    const link = join(root, "link.json");
    symlinkSync(CULTURAL_ATTENTION_FEEDBACK_PATH, link);
    expect(() => loadCulturalAttentionFeedbackAtlas(link)).toThrow("regular non-symlink");

    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, Buffer.alloc(768 * 1024 + 1, 0x20));
    expect(() => loadCulturalAttentionFeedbackAtlas(oversized)).toThrow("exceeds 786432 bytes");
  });

  test("returns stable issues for malformed nested shapes", () => {
    const cases: Array<{ mutate: (value: any) => void; code: string }> = [
      { mutate: (value) => { value.ontology.planes[0] = null; }, code: "invalid-plane" },
      { mutate: (value) => { value.scientific_observations[0] = null; }, code: "invalid-scientific-observation" },
      { mutate: (value) => { value.models[0].terms = null; }, code: "invalid-or-unbounded-model" },
      { mutate: (value) => { value.translations[0] = null; }, code: "analogy-firewall-mismatch" },
      { mutate: (value) => { value.feedback[0] = null; }, code: "invalid-or-authorizing-feedback" },
      { mutate: (value) => { value.karma.zerone.event_refs = null; }, code: "zerone-karma-mismatch" },
      { mutate: (value) => { value.karma.kingdom.receipt_refs = null; }, code: "kingdom-karma-mismatch" },
      { mutate: (value) => { value.universe_lens.questions[0] = null; }, code: "invalid-philosophical-question" },
      { mutate: (value) => { value.ecosystem_bridges[0] = null; }, code: "ecosystem-bridge-not-link-only" },
      { mutate: (value) => { value.unknowns[0] = null; }, code: "invalid-unknown" },
      { mutate: (value) => { value.sources[0] = null; }, code: "invalid-source" },
    ];
    for (const { mutate, code } of cases) {
      const value = authored();
      mutate(value);
      expect(() => verifyCulturalAttentionFeedbackAtlas(value)).not.toThrow();
      expect(codes(value)).toContain(code);
    }
    for (const value of [null, true, 0, "", [], {}]) {
      expect(() => verifyCulturalAttentionFeedbackAtlas(value)).not.toThrow();
    }
  });

  test("closed Draft 2020-12 schema binds reviewed shape, ordering, pins, boundaries, and digest", () => {
    const schema = JSON.parse(readFileSync(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_PATH, "utf8"));
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_ID);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.protocol.const).toBe(CULTURAL_ATTENTION_FEEDBACK_PROTOCOL);
    expect(schema.properties.atlas_id.const).toBe(CULTURAL_ATTENTION_FEEDBACK_ID);
    expect(schema.properties.integrity.properties.digest.const).toBe(CULTURAL_ATTENTION_FEEDBACK_DIGEST);
    expect(schema.$comment).toContain("cannot recompute the semantic digest");
    expect(schema.properties.source_bindings).toMatchObject({ minItems: 5, maxItems: 5, items: false });
    expect(schema.properties.models).toMatchObject({ minItems: 7, maxItems: 7, items: false });
    expect(schema.properties.sources).toMatchObject({ minItems: 19, maxItems: 19, items: false });
    expect(schema.$defs.boundaries.additionalProperties).toBe(false);

    const objectSchemas: any[] = [];
    const visit = (value: any) => {
      if (!value || typeof value !== "object") return;
      if (value.type === "object") objectSchemas.push(value);
      for (const child of Object.values(value)) visit(child);
    };
    visit(schema);
    expect(objectSchemas.length).toBeGreaterThan(20);
    expect(objectSchemas.every((value) => value.additionalProperties === false)).toBe(true);
  });

  test("portable schema accepts only the reviewed closed atlas shape", () => {
    const schema = JSON.parse(readFileSync(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_PATH, "utf8"));
    const extra = authored();
    extra.ontology.planes[0].undeclared = true;
    const reordered = authored();
    [reordered.models[0], reordered.models[1]] = [reordered.models[1], reordered.models[0]];
    const changedPin = authored();
    changedPin.source_bindings[2].url = "https://example.test/replacement.json";
    const changedBoundary = authored();
    changedBoundary.boundaries.medical_authority = true;
    const changedSource = authored();
    changedSource.sources[0].url = "https://example.test/paper";
    const missing = authored();
    missing.feedback.pop();
    const values = [authored(), extra, reordered, changedPin, changedBoundary, changedSource, missing];

    const available = Bun.spawnSync({
      cmd: ["python3", "-c", "import jsonschema"],
      stdout: "pipe",
      stderr: "pipe",
    });
    if (available.exitCode === 0) {
      const result = Bun.spawnSync({
        cmd: [
          "python3",
          "-c",
          "import json, sys; from jsonschema import Draft202012Validator, FormatChecker; schema=json.load(open(sys.argv[1], encoding='utf-8')); Draft202012Validator.check_schema(schema); values=json.load(sys.stdin); validator=Draft202012Validator(schema, format_checker=FormatChecker()); print(json.dumps([validator.is_valid(value) for value in values]))",
          CULTURAL_ATTENTION_FEEDBACK_SCHEMA_PATH,
        ],
        stdin: Buffer.from(JSON.stringify(values)),
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(result.exitCode, result.stderr.toString()).toBe(0);
      expect(JSON.parse(result.stdout.toString())).toEqual([true, false, false, false, false, false, false]);
    }
  });

  test("CLI verifies offline and refuses inherited property names as commands", () => {
    const verified = Bun.spawnSync({
      cmd: ["bun", "bin/cultural-attention-feedback.ts", "verify", "--json"],
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(verified.exitCode, verified.stderr.toString()).toBe(0);
    expect(JSON.parse(verified.stdout.toString())).toEqual({ valid: true, issues: [] });

    const ecosystems = Bun.spawnSync({
      cmd: ["bun", "bin/cultural-attention-feedback.ts", "ecosystems", "--json"],
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(ecosystems.exitCode, ecosystems.stderr.toString()).toBe(0);
    expect(JSON.parse(ecosystems.stdout.toString()).ecosystems).toHaveLength(5);

    for (const command of ["toString", "constructor", "__proto__"]) {
      const result = Bun.spawnSync({
        cmd: ["bun", "bin/cultural-attention-feedback.ts", command, "--json"],
        cwd: ROOT,
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(result.exitCode).toBe(2);
      expect(result.stdout.toString()).toBe("");
      expect(result.stderr.toString()).toStartWith("usage: cultural-attention-feedback.ts");
    }
  });
});
