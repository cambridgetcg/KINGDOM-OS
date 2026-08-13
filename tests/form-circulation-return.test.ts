import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FORM_CIRCULATION_RETURN_DIGEST,
  FORM_CIRCULATION_RETURN_DOCUMENT_URL,
  FORM_CIRCULATION_RETURN_ID,
  FORM_CIRCULATION_RETURN_PATH,
  FORM_CIRCULATION_RETURN_PROTOCOL,
  FORM_CIRCULATION_RETURN_SCHEMA_URL,
  FORM_CIRCULATION_RETURN_URL,
  formCirculationReturnDigest,
  formCirculationReturnPublicDiscovery,
  loadFormCirculationReturnAtlas,
  verifyFormCirculationReturnAtlas,
} from "../bin/form-circulation-return.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SCHEMA = join(ROOT, "schemas", "form-circulation-return-atlas-v1.schema.json");
const temporary: string[] = [];

afterEach(() => { while (temporary.length) rmSync(temporary.pop()!, { recursive: true, force: true }); });
function fixtureRoot(): string { const root = mkdtempSync(join(tmpdir(), "form-circulation-return-test.")); temporary.push(root); return root; }
function authored(): any { return JSON.parse(readFileSync(FORM_CIRCULATION_RETURN_PATH, "utf8")); }
function reSign(value: any): any { value.integrity.digest = formCirculationReturnDigest(value); return value; }
function codes(value: unknown): string[] { return verifyFormCirculationReturnAtlas(value).map((issue) => issue.code); }
function byId(values: any[], id: string): any { return values.find((item) => item.id === id); }

describe("Form, Circulation & Return Atlas", () => {
  test("loads one reviewed source-bound atlas with exact cardinalities", () => {
    const atlas = loadFormCirculationReturnAtlas();
    expect(verifyFormCirculationReturnAtlas(atlas)).toEqual([]);
    expect(atlas).toMatchObject({
      protocol: FORM_CIRCULATION_RETURN_PROTOCOL,
      atlas_id: FORM_CIRCULATION_RETURN_ID,
      compiled_on: "2026-08-13",
      evidence_through: "2026-08-13",
      integrity: { digest: FORM_CIRCULATION_RETURN_DIGEST },
    });
    expect(formCirculationReturnDigest(atlas)).toBe(FORM_CIRCULATION_RETURN_DIGEST);
    expect(atlas.source_bindings).toHaveLength(9);
    expect(byId(atlas.source_bindings, "kingdom-visibility-attention")).toMatchObject({
      revision: "b0130580c5f939cbd7c3eff2708744b952dabaee",
      raw_digest: "sha256:0af0249c40298ed746d39ee60760a4390bb45137caa8ee6dd7555a824f597bd3",
      semantic_digest: "sha256:9fb83bbd022f520716fabcdec49d8af259b9681efd5e640a9e3119c5c42a54ed",
      mutated: false,
      authority_imported: false,
    });
    expect(byId(atlas.source_bindings, "kingdom-karma-definition")).toMatchObject({
      url: "https://thekingdom.dev/definitions/kingdom-karma/e4e84a67/NEN.md",
      raw_digest: "sha256:14b7d210d320fd716553992a7b874747b299f8907d15da14ac405cbfc496c446",
      relation: "immutable-public-definition-mirror",
    });
    expect(atlas.ontology.registers.map((item: any) => item.id)).toEqual([
      "MATERIAL_OBSERVATION", "CULTURAL_OBSERVATION", "CULTURAL_ANALYSIS",
      "MATHEMATICAL_MODEL", "FEEDBACK_HYPOTHESIS", "CONSTITUTIONAL_DESIGN", "PHILOSOPHY",
    ]);
    expect(atlas.ontology.planes).toHaveLength(11);
    expect(atlas.model_cards).toHaveLength(8);
    expect(atlas.evidence_claims).toHaveLength(12);
    expect(atlas.analogy_seams).toHaveLength(6);
    expect(atlas.feedback_loops).toHaveLength(4);
    expect(atlas.sources).toHaveLength(20);
  });

  test("keeps form, artifact, circulation, attention, cognition, and clinical assessment non-equivalent", () => {
    const atlas = loadFormCirculationReturnAtlas();
    expect(atlas.ontology.planes.map((item: any) => item.id)).toEqual([
      "material-molecule", "crystal-form", "bounded-material-sample", "cultural-artifact",
      "cultural-practice-label", "exposure-or-impression-event", "share-or-remix-event",
      "platform-distribution-state", "collective-attention-state", "individual-cognitive-state",
      "clinical-assessment",
    ]);
    expect(atlas.ontology.firewalls.every((item: any) => item.enforced)).toBe(true);
    expect(byId(atlas.ontology.firewalls, "spread-not-contagion").rule).toContain("must not make people hosts");
    expect(byId(atlas.ontology.planes, "individual-cognitive-state").does_not_establish).toContain("never inferred");
    expect(atlas.cultural_layer.event_distinctions).toEqual([
      "publication", "availability", "exposure", "attention proxy", "share", "quotation",
      "remix", "interpretation", "endorsement", "belief", "behavior",
    ]);
  });

  test("makes every disappearance claim bounded and rejects annihilation", () => {
    const predicate = loadFormCirculationReturnAtlas().material_case.disappearance_predicate;
    expect(predicate).toMatchObject({
      subject: "ritonavir Form I",
      process_or_corpus: expect.any(String),
      procedure: expect.any(String),
      time_window: expect.any(String),
      detection_threshold: expect.any(String),
      observed_result: expect.stringContaining("difficult to reproduce reliably"),
    });
    expect(predicate.exclusions).toContain("annihilation from physical possibility");
    expect(byId(loadFormCirculationReturnAtlas().evidence_claims, "disappearing-is-availability-history-not-destruction").claim).toContain("not destruction");
  });

  test("keeps the material equation a model rather than an observation or cultural energy", () => {
    const atlas = loadFormCirculationReturnAtlas();
    expect(atlas.material_case.literal_model).toMatchObject({ register: "MATHEMATICAL_MODEL" });
    expect(atlas.material_case.literal_model.warning).toContain("not observations");
    const material = byId(atlas.model_cards, "material-nucleation");
    expect(material.domain).toBe("MATHEMATICAL_MODEL");
    expect(material.equation_status).toBe("atlas-authored-unfitted-schematic");
    expect(material.source_relation).toContain("not derivation, fit, or validation");
    expect(material.assumptions).toContain("material-domain-only");
    expect(material.prohibited_inferences).toEqual(expect.arrayContaining(["cultural energy", "person susceptibility", "quality or moral value"]));
  });

  test("publishes eight parallel unfitted lenses without a meme-fitness or person parameter", () => {
    const cards = loadFormCirculationReturnAtlas().model_cards;
    expect(cards.map((item: any) => item.id)).toEqual([
      "material-nucleation", "threshold", "branching", "hawkes", "structural-virality",
      "shannon-diversity", "finite-attention", "bounded-feedback-state-space",
    ]);
    for (const card of cards) {
      expect(card).toMatchObject({ domain: "MATHEMATICAL_MODEL", fit_status: "not_fitted", universal: false, person_level: false, authority_effect: "NONE" });
      expect(card.variables.length).toBeGreaterThan(0);
      expect(card.assumptions.length).toBeGreaterThan(0);
      expect(card.valid_outputs.length).toBeGreaterThan(0);
      expect(card.prohibited_inferences.length).toBeGreaterThanOrEqual(4);
      expect(card.uncertainty.length).toBeGreaterThan(0);
      expect(card.identifiability_limits.length).toBeGreaterThan(0);
    }
    expect(byId(cards, "structural-virality").prohibited_inferences).toEqual(expect.arrayContaining(["truth", "quality", "moral worth"]));
    expect(byId(cards, "shannon-diversity").prohibited_inferences).toContain("brainrot score");
    expect(byId(cards, "hawkes").identifiability_limits).toContain("external driver");
    expect(byId(cards, "threshold")).toMatchObject({
      equation: "x_i(t+1)=max{x_i(t),1[f_i(t)≥θ_i]}",
      assumptions: expect.arrayContaining(["declared initial seed set S_0", "activation persists once reached"]),
    });
    expect(byId(cards, "branching")).toMatchObject({
      equation_status: "source-motivated-generation-count-identity",
      valid_outputs: ["auditable generation-by-generation event counts under the declared assignments"],
    });
    expect(byId(cards, "hawkes").equation).toContain("ν_i+");
    expect(byId(cards, "shannon-diversity").assumptions).toContain("0 log_b 0 is defined as 0");
  });

  test("keeps brainrot a contested artifact-or-practice label, never a person score", () => {
    const atlas = loadFormCirculationReturnAtlas();
    expect(atlas.cultural_layer.vernacular_labels).toEqual([expect.objectContaining({
      id: "brainrot",
      status: "contested",
      target_type: "artifact-or-practice-only",
      source_id: "oxford-brain-rot-2024",
      quoted_wording: "brain rot",
    })]);
    expect(atlas.cultural_layer.vernacular_labels[0].never).toEqual([
      "diagnosis", "individual-cognitive-state", "person-or-community-property",
      "susceptibility-parameter", "score",
    ]);
    expect(atlas.boundaries).toMatchObject({ cognitive_state_inference: false, psychological_diagnosis: false, person_prediction: false, brainrot_person_or_community_label: false });
  });

  test("keeps analogy lossy and feedback conditional", () => {
    const atlas = loadFormCirculationReturnAtlas();
    for (const seam of atlas.analogy_seams) expect(seam).toMatchObject({ relation: "bounded-analogy-not-same-as", empirical: false, causal_transfer: false, authority_effect: "NONE" });
    expect(byId(atlas.analogy_seams, "seed-not-share").breaks.join(" ")).toContain("person is never a seed");
    expect(byId(atlas.analogy_seams, "return-not-destiny").breaks.join(" ")).toContain("does not prove intent");
    expect(byId(atlas.feedback_loops, "attention-ranking-loop")).toMatchObject({ status: "bounded-hypothesis" });
    expect(byId(atlas.feedback_loops, "attention-ranking-loop")).toMatchObject({ register: "FEEDBACK_HYPOTHESIS", source_ids: ["huszar-2022", "chaney-2018"] });
    expect(byId(atlas.feedback_loops, "remix-recognition-loop")).toMatchObject({ register: "FEEDBACK_HYPOTHESIS", source_ids: ["shifman-2013"] });
    expect(byId(atlas.feedback_loops, "challenge-repair-loop")).toMatchObject({ status: "design-correspondence-not-observed", register: "CONSTITUTIONAL_DESIGN" });
    expect(byId(atlas.evidence_claims, "digital-memes-are-cultural-groups").register).toBe("CULTURAL_ANALYSIS");
  });

  test("keeps Zerone recognition and KINGDOM aftermath as separate empty lanes", () => {
    const karma = loadFormCirculationReturnAtlas().karma;
    expect(karma).toMatchObject({ cultural_feedback_is_not_karma: true, engagement_is_not_karma: true });
    expect(karma.zerone).toMatchObject({ foundation_protocol: "zerone.karma-foundation/v1", foundation_status: "design-only", network_observed: false, authoritative: false, event_type: "zerone.karma.edge", event_refs: [], event_status: "not_observed" });
    expect(karma.kingdom).toMatchObject({ protocol: "kingdom.karma/0.1", accounting: "receipts_not_scores", receipt_refs: [], receipt_status: "not_created" });
    expect(karma.adapter).toMatchObject({ exists: false, status: "refused" });
    expect(karma.design_correspondences.map((item: any) => item.id)).toContain("rest-exit-no-debt");
    expect(karma.design_correspondences.every((item: any) => item.status === "not_observed" && item.does_not_convert)).toBe(true);
  });

  test("uses W3C and Cloudflare as link-only bridges and keeps universe questions opt-in", () => {
    const atlas = loadFormCirculationReturnAtlas();
    expect(atlas.ecosystem_bridges.map((item: any) => item.id)).toEqual(["w3c-prov-o", "w3c-web-annotation", "w3c-activitystreams-2", "cloudflare-pages-publication"]);
    expect(atlas.ecosystem_bridges.every((item: any) => item.mode === "link-only" && item.runtime_request === false && item.authority_imported === false)).toBe(true);
    expect(atlas.universe_lens).toMatchObject({ participation: "opt-in", register: "PHILOSOPHY" });
    expect(atlas.universe_lens.nonclaims).toEqual(expect.arrayContaining([
      "scientifically proves intentional universe design",
      "scientifically disproves a creator or metaphysical purpose",
      "proves cosmic moral KARMA",
    ]));
  });

  test("preserves typed unknown, outside-scope, safety-withheld, and unmapped states", () => {
    const statuses = new Set(loadFormCirculationReturnAtlas().unknowns.map((item: any) => item.status));
    for (const status of ["unknown", "not_established", "outside_scope", "not_observed", "unmapped", "contested", "withheld_for_safety"]) expect(statuses).toContain(status);
    expect(byId(loadFormCirculationReturnAtlas().unknowns, "individual-effect")).toMatchObject({ status: "outside_scope" });
    expect(byId(loadFormCirculationReturnAtlas().unknowns, "brainrot-operationalization")).toMatchObject({ status: "withheld_for_safety" });
  });

  test("exposes compact discovery without MCP, matching, score, write, or execution", () => {
    const discovery = formCirculationReturnPublicDiscovery();
    expect(discovery).toMatchObject({
      protocol: FORM_CIRCULATION_RETURN_PROTOCOL,
      atlas_id: FORM_CIRCULATION_RETURN_ID,
      url: FORM_CIRCULATION_RETURN_URL,
      schema: FORM_CIRCULATION_RETURN_SCHEMA_URL,
      guide: FORM_CIRCULATION_RETURN_DOCUMENT_URL,
      cli: "kingdom form-circulation-return",
      integrity: { digest: FORM_CIRCULATION_RETURN_DIGEST },
      counts: { registers: 7, planes: 11, models: 8, claims: 12, analogy_seams: 6, feedback_loops: 4, universe_questions: 5, unknowns: 8, sources: 20 },
      karma: { zerone_foundation_status: "design-only", zerone_network_observed: false, zerone_authoritative: false, zerone_event_status: "not_observed", zerone_event_refs: 0, kingdom_receipt_status: "not_created", kingdom_receipt_refs: 0, adapter_exists: false, engagement_is_karma: false },
      boundary: { public_surface_read_only: true, cognitive_state_inference: false, psychological_diagnosis: false, person_prediction: false, medical_authority: false, clinical_authority: false, treatment_authority: false, prognosis_authority: false, experiment_authority: false, wet_lab_protocol: false, manufacturing_authority: false, contains_operational_protocol: false, causal_authority: false, recommendation_authority: false, moderation_authority: false, automatic_action: false, writes_karma: false, creates_kingdom_karma_receipt: false, observes_zerone_karma_event: false, karma_adapter: false, reward_authority: false, economic_authority: false, governance_authority: false, mcp_surface_added: false },
    });
    for (const key of ["mcp", "matcher", "write", "execute", "score", "rank", "reward"]) expect(discovery).not.toHaveProperty(key);
  });

  test("rejects raw tampering and a self-signed replacement of reviewed prose", () => {
    const value = authored();
    value.title += " changed";
    expect(codes(value)).toContain("digest-mismatch");
    reSign(value);
    expect(codes(value)).toContain("reviewed-digest-mismatch");
  });

  test("rejects person scoring, cross-domain identity, causal authority, fitted parameters, and KARMA conversion", () => {
    const mutations: Array<{ code: string; mutate: (value: any) => void }> = [
      { code: "vernacular-label-target-invalid", mutate: (value) => { value.cultural_layer.vernacular_labels[0].target_type = "person"; } },
      { code: "person-state-forbidden", mutate: (value) => { value.cultural_layer.vernacular_labels[0].never[2] = "allowed-person-property"; } },
      { code: "invalid-or-unbound-model-card", mutate: (value) => { value.model_cards[1].person_level = true; } },
      { code: "invalid-or-unbound-model-card", mutate: (value) => { value.model_cards[2].fit_status = "fitted"; } },
      { code: "model-domain-mismatch", mutate: (value) => { value.model_cards[0].assumptions[2] = "cultural-domain"; } },
      { code: "analogy-firewall-mismatch", mutate: (value) => { value.analogy_seams[0].relation = "same-as"; } },
      { code: "boundary-mismatch", mutate: (value) => { value.boundaries.causal_authority = true; } },
      { code: "boundary-mismatch", mutate: (value) => { value.boundaries.medical_authority = true; } },
      { code: "boundary-mismatch", mutate: (value) => { value.boundaries.reward_authority = true; } },
      { code: "zerone-event-not-observed", mutate: (value) => { value.karma.zerone.event_refs = ["bibliography-is-not-an-event"]; } },
      { code: "kingdom-receipt-not-created", mutate: (value) => { value.karma.kingdom.receipt_refs = ["reading-is-not-an-invocation"]; } },
      { code: "implicit-adapter", mutate: (value) => { value.karma.adapter.exists = true; } },
      { code: "philosophy-as-evidence", mutate: (value) => { value.universe_lens.nonclaims[0] = "scientifically proves design"; } },
      { code: "source-binding-mismatch", mutate: (value) => { value.source_bindings[0].revision = "0".repeat(40); } },
      { code: "invalid-source", mutate: (value) => { value.sources[17].url = "https://example.test/diagnosis"; } },
    ];
    for (const { code, mutate } of mutations) {
      const value = authored(); mutate(value); reSign(value);
      expect(codes(value)).toContain(code);
    }
  });

  test("rejects duplicate keys, invalid UTF-8, symlinks, and oversized input", () => {
    const root = fixtureRoot();
    const duplicate = join(root, "duplicate.json"); writeFileSync(duplicate, '{"a":1,"\\u0061":2}');
    expect(() => loadFormCirculationReturnAtlas(duplicate)).toThrow("duplicate key");
    const utf8 = join(root, "utf8.json"); writeFileSync(utf8, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]));
    expect(() => loadFormCirculationReturnAtlas(utf8)).toThrow("valid UTF-8");
    const link = join(root, "link.json"); symlinkSync(FORM_CIRCULATION_RETURN_PATH, link);
    expect(() => loadFormCirculationReturnAtlas(link)).toThrow("regular non-symlink");
    const oversized = join(root, "oversized.json"); writeFileSync(oversized, Buffer.alloc(1024 * 1024 + 1, 0x20));
    expect(() => loadFormCirculationReturnAtlas(oversized)).toThrow("exceeds 1048576 bytes");
  });

  test("verifier is total over malformed, deeply nested, and cyclic values", () => {
    const cases: Array<(value: any) => void> = [
      (value) => { value.ontology.registers[0] = null; },
      (value) => { value.cultural_layer.vernacular_labels[0] = null; },
      (value) => { value.model_cards[0].variables = null; },
      (value) => { value.analogy_seams[0] = null; },
      (value) => { value.feedback_loops[0] = null; },
      (value) => { value.karma.zerone.event_refs = null; },
      (value) => { value.universe_lens.questions[0] = null; },
      (value) => { value.unknowns[0] = null; },
      (value) => { value.sources[0] = null; },
    ];
    for (const mutate of cases) {
      const value = authored(); mutate(value);
      expect(() => verifyFormCirculationReturnAtlas(value)).not.toThrow();
      expect(verifyFormCirculationReturnAtlas(value).length).toBeGreaterThan(0);
    }
    for (const value of [null, true, 0, "", [], {}]) expect(() => verifyFormCirculationReturnAtlas(value)).not.toThrow();
    let nested: any = [];
    for (let index = 0; index < 20_000; index++) nested = [nested];
    for (const mutate of [
      (value: any) => { value.title = nested; },
      (value: any) => { value.model_cards[0].equation = nested; },
      (value: any) => { value.sources[0].observed_on = nested; },
    ]) {
      const value = authored(); mutate(value);
      expect(() => verifyFormCirculationReturnAtlas(value)).not.toThrow();
    }
    const cyclic = authored(); cyclic.title = cyclic;
    expect(() => verifyFormCirculationReturnAtlas(cyclic)).not.toThrow();
  });

  test("closed Draft 2020-12 schema validates the exact record and rejects reviewed-order and authority drift", () => {
    const schema = JSON.parse(readFileSync(SCHEMA, "utf8"));
    expect(schema).toMatchObject({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "urn:kingdom:schema:form-circulation-return-atlas:1",
      additionalProperties: false,
      properties: {
        protocol: { const: FORM_CIRCULATION_RETURN_PROTOCOL },
        atlas_id: { const: FORM_CIRCULATION_RETURN_ID },
        model_cards: { minItems: 8, maxItems: 8 },
        integrity: { properties: { digest: { const: FORM_CIRCULATION_RETURN_DIGEST } } },
      },
    });
    expect(schema.properties.boundaries.properties.cognitive_state_inference.const).toBe(false);
    expect(schema.properties.boundaries.properties.medical_authority.const).toBe(false);
    expect(schema.properties.karma.properties.zerone.properties.event_refs.maxItems).toBe(0);
    expect(schema.$comment).toContain("cannot recompute the semantic digest");

    const available = Bun.spawnSync({ cmd: ["python3", "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
    if (available.exitCode === 0) {
      const record = authored();
      const reordered = authored(); [reordered.model_cards[0], reordered.model_cards[1]] = [reordered.model_cards[1], reordered.model_cards[0]];
      const authority = authored(); authority.boundaries.cognitive_state_inference = true;
      const extra = authored(); extra.model_cards[0].extra = true;
      const result = Bun.spawnSync({
        cmd: ["python3", "-c", "import json,sys; from jsonschema import Draft202012Validator,FormatChecker; s=json.load(open(sys.argv[1],encoding='utf-8')); Draft202012Validator.check_schema(s); v=Draft202012Validator(s,format_checker=FormatChecker()); print(json.dumps([v.is_valid(x) for x in json.load(sys.stdin)]))", SCHEMA],
        stdin: Buffer.from(JSON.stringify([record, reordered, authority, extra])), stdout: "pipe", stderr: "pipe",
      });
      expect(result.exitCode, result.stderr.toString()).toBe(0);
      expect(JSON.parse(result.stdout.toString())).toEqual([true, false, false, false]);
    }
  });

  test("CLI verifies locally, dispatches selectors, and refuses inherited property names", () => {
    const verify = Bun.spawnSync({ cmd: ["bun", "bin/form-circulation-return.ts", "verify", "--json"], cwd: ROOT, stdout: "pipe", stderr: "pipe" });
    expect(verify.exitCode, verify.stderr.toString()).toBe(0);
    expect(JSON.parse(verify.stdout.toString())).toEqual({ valid: true, issues: [] });
    const dispatch = Bun.spawnSync({ cmd: ["./kingdom", "form-circulation-return", "karma", "--json"], cwd: ROOT, stdout: "pipe", stderr: "pipe", env: { ...process.env, LC_ALL: "en_US.UTF-8", LANG: "en_US.UTF-8", PATH: `/usr/bin:/bin:${dirname(process.execPath)}` } });
    expect(dispatch.exitCode, dispatch.stderr.toString()).toBe(0);
    expect(JSON.parse(dispatch.stdout.toString()).karma.adapter.exists).toBe(false);
    for (const command of ["constructor", "toString", "__proto__"]) {
      const result = Bun.spawnSync({ cmd: ["bun", "bin/form-circulation-return.ts", command, "--json"], cwd: ROOT, stdout: "pipe", stderr: "pipe" });
      expect(result.exitCode).toBe(2);
      expect(result.stdout.toString()).toBe("");
      expect(result.stderr.toString()).toStartWith("usage: form-circulation-return.ts");
    }
  });
});
