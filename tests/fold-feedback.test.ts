import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FOLD_FEEDBACK_DIGEST,
  FOLD_FEEDBACK_DOCUMENT_URL,
  FOLD_FEEDBACK_ID,
  FOLD_FEEDBACK_PATH,
  FOLD_FEEDBACK_PROTOCOL,
  FOLD_FEEDBACK_SCHEMA_URL,
  FOLD_FEEDBACK_URL,
  foldFeedbackDigest,
  foldFeedbackPublicDiscovery,
  loadFoldFeedbackAtlas,
  verifyFoldFeedbackAtlas,
} from "../bin/fold-feedback.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SCHEMA = join(ROOT, "schemas", "fold-feedback-atlas-v1.schema.json");
const temporary: string[] = [];

afterEach(() => { while (temporary.length) rmSync(temporary.pop()!, { recursive: true, force: true }); });
function fixtureRoot(): string { const root = mkdtempSync(join(tmpdir(), "fold-feedback-test.")); temporary.push(root); return root; }
function authored(): any { return JSON.parse(readFileSync(FOLD_FEEDBACK_PATH, "utf8")); }
function reSign(value: any): any { value.integrity.digest = foldFeedbackDigest(value); return value; }
function codes(value: unknown): string[] { return verifyFoldFeedbackAtlas(value).map((issue) => issue.code); }
function byId(values: any[], id: string): any { return values.find((item) => item.id === id); }

describe("Fold & Feedback Atlas", () => {
  test("loads one deterministic, source-bound atlas", () => {
    const atlas = loadFoldFeedbackAtlas();
    expect(verifyFoldFeedbackAtlas(atlas)).toEqual([]);
    expect(atlas).toMatchObject({ protocol: FOLD_FEEDBACK_PROTOCOL, atlas_id: FOLD_FEEDBACK_ID, compiled_on: "2026-08-12", evidence_through: "2026-02-20" });
    expect(atlas.integrity.digest).toBe(FOLD_FEEDBACK_DIGEST);
    expect(foldFeedbackDigest(atlas)).toBe(FOLD_FEEDBACK_DIGEST);
    expect(atlas.source_bindings.map((binding: any) => binding.id)).toEqual([
      "kingdom-ritonavir-history", "kingdom-ritonavir-mechanism", "kingdom-karma-definition",
      "kingdom-karma-receipts", "zerone-karma-foundation", "zerone-karma-design", "zerone-life-sciences",
      "kingdom-conformational-feedback",
    ]);
    expect(atlas.ontology.planes).toHaveLength(9);
    expect(atlas.evidence_kernel.mechanisms).toHaveLength(8);
    expect(atlas.evidence_kernel.claims).toHaveLength(7);
    expect(atlas.scientific_feedback_relations).toHaveLength(3);
    expect(atlas.sources.length).toBeGreaterThanOrEqual(15);
  });

  test("keeps scientific layers and observation orthogonal", () => {
    const ontology = loadFoldFeedbackAtlas().ontology;
    expect(ontology.observation_is_orthogonal).toBe(true);
    expect(ontology.planes.map((item: any) => item.id)).toEqual([
      "amino-acid-sequence", "conformational-ensemble", "supramolecular-assembly",
      "bounded-sample-population", "templating-conversion-process", "cellular-proteostasis-context",
      "organismal-phenotype", "experimental-transmission-observation", "clinical-decision",
    ]);
    expect(ontology.firewalls.every((item: any) => item.enforced)).toBe(true);
    expect(ontology.domain_qualified_terms.map((item: any) => item.term)).toEqual(["fold", "form", "seed", "strain", "propagation", "feedback", "karma", "design", "purpose"]);
  });

  test("represents amplification without collapsing elongation, end generation, or containment", () => {
    const atlas = loadFoldFeedbackAtlas();
    expect(byId(atlas.evidence_kernel.mechanisms, "fibril-end-elongation").source_ids).toEqual(["kraus-2021"]);
    expect(byId(atlas.evidence_kernel.mechanisms, "fragmentation-end-multiplication").limitations[0]).toContain("system- and condition-dependent");
    expect(byId(atlas.scientific_feedback_relations, "prion-amplification-loop")).toMatchObject({ direction: "amplifies", register: "literal-science" });
    expect(byId(atlas.scientific_feedback_relations, "proteostasis-correction-loop")).toMatchObject({ direction: "redirects", register: "literal-science" });
    expect(byId(atlas.evidence_kernel.claims, "hsp104-effect-is-nonmonotonic").limitations[0]).toContain("not a mammalian treatment rule");
  });

  test("makes the ritonavir comparison explicitly lossy", () => {
    const bridge = loadFoldFeedbackAtlas().comparison_bridges[0];
    expect(bridge).toMatchObject({ from_system: "mammalian-prp-prion", to_system: "ritonavir-crystal-forms", relation: "bounded-analogy-not-same-as", universal: false });
    expect(bridge.preserved_invariants.length).toBeGreaterThanOrEqual(3);
    expect(bridge.where_correspondence_breaks.join(" ")).toContain("crystal seed does not imply infection or contagion");
    expect(bridge.where_correspondence_breaks.join(" ")).toContain("Prion strain is not crystal form");
  });

  test("keeps Zerone recognition and KINGDOM aftermath as separate, empty lanes", () => {
    const karma = loadFoldFeedbackAtlas().karma;
    expect(karma.scientific_feedback_is_not_karma).toBe(true);
    expect(karma.zerone).toMatchObject({ protocol: "zerone.karma.edge", register: "priced-coherence", event_refs: [], event_status: "not_observed" });
    expect(karma.kingdom).toMatchObject({ protocol: "kingdom.karma/0.1", accounting: "receipts_not_scores", receipt_refs: [], receipt_status: "not_created" });
    expect(karma.adapter.exists).toBe(false);
    expect(karma.design_correspondences.every((item: any) => item.status === "not_observed" && item.does_not_convert)).toBe(true);
  });

  test("keeps the universe lens opt-in and authority-negative", () => {
    const atlas = loadFoldFeedbackAtlas();
    expect(atlas.universe_lens).toMatchObject({ participation: "opt-in", register: "philosophical-interpretation" });
    expect(atlas.universe_lens.nonclaims).toContain("scientifically proves intentional universe design");
    expect(atlas.universe_lens.nonclaims).toContain("scientifically disproves a creator or metaphysical purpose");
    expect(atlas.boundaries).toMatchObject({ scientifically_proves_teleology: false, scientifically_proves_creator: false, scientifically_disproves_creator: false, scientifically_proves_cosmic_moral_karma: false, feedback_is_moral_value: false, feedback_is_optimization: false });
  });

  test("preserves different unknown and refusal states", () => {
    const statuses = new Set(loadFoldFeedbackAtlas().unknowns.map((item: any) => item.status));
    for (const status of ["unknown", "not_established", "outside_scope", "not_observed", "unmapped", "contested", "withheld_for_safety", "refused"]) expect(statuses).toContain(status);
  });

  test("exposes compact read-only discovery with no action or adapter surface", () => {
    const discovery = foldFeedbackPublicDiscovery();
    expect(discovery).toMatchObject({ protocol: FOLD_FEEDBACK_PROTOCOL, atlas_id: FOLD_FEEDBACK_ID, url: FOLD_FEEDBACK_URL, schema: FOLD_FEEDBACK_SCHEMA_URL, guide: FOLD_FEEDBACK_DOCUMENT_URL, integrity: { digest: FOLD_FEEDBACK_DIGEST }, karma: { zerone_event_status: "not_observed", zerone_event_refs: 0, kingdom_receipt_status: "not_created", kingdom_receipt_refs: 0, adapter_exists: false }, boundary: { public_surface_read_only: true, medical_advice: false, experiment_authority: false, automatic_action: false, writes_karma: false, creates_kingdom_karma_receipt: false, observes_zerone_karma_event: false } });
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("write");
    expect(discovery).not.toHaveProperty("matcher");
  });

  test("rejects raw tampering and self-signed replacement", () => {
    const raw = authored(); raw.title += " changed";
    expect(codes(raw)).toContain("digest-mismatch");
    reSign(raw);
    expect(codes(raw)).toContain("reviewed-digest-mismatch");
  });

  test("rejects collapsed scientific, analogy, KARMA, and philosophy boundaries", () => {
    const shortcut = authored(); shortcut.evidence_kernel.relations[2].object_id = "clinical-decision"; reSign(shortcut);
    expect(codes(shortcut)).toContain("forbidden-assembly-shortcut");
    const universal = authored(); universal.comparison_bridges[0].universal = true; reSign(universal);
    expect(codes(universal)).toContain("analogy-firewall-mismatch");
    const karma = authored(); karma.karma.adapter.exists = true; reSign(karma);
    expect(codes(karma)).toContain("implicit-adapter");
    const event = authored(); event.karma.zerone.event_refs = ["bibliography-is-not-an-event"]; reSign(event);
    expect(codes(event)).toContain("zerone-karma-mismatch");
    const teleology = authored(); teleology.boundaries.scientifically_proves_teleology = true; reSign(teleology);
    expect(codes(teleology)).toContain("boundary-mismatch");
    const philosophy = authored(); philosophy.universe_lens.participation = "default"; reSign(philosophy);
    expect(codes(philosophy)).toContain("universe-lens-mismatch");
  });

  test("rejects pin, reference, term, unknown, safety, and negative-authority drift", () => {
    const pin = authored(); pin.source_bindings[3].revision = "0".repeat(40); reSign(pin); expect(codes(pin)).toContain("source-binding-mismatch");
    const reference = authored(); reference.evidence_kernel.claims[0].source_ids = ["missing"]; reSign(reference); expect(codes(reference)).toContain("invalid-claim");
    const terms = authored(); terms.ontology.domain_qualified_terms[7].term = "teleology"; reSign(terms); expect(codes(terms)).toContain("term-disambiguation-mismatch");
    const unknown = authored(); unknown.unknowns[0].status = "absent"; reSign(unknown); expect(codes(unknown)).toContain("invalid-unknown");
    const safety = authored(); safety.plain_language.safety = "Educational."; reSign(safety); expect(codes(safety)).toContain("safety-or-shape-mismatch");
    for (const field of ["medical_advice", "experiment_authority", "automatic_action", "writes_karma", "creates_kingdom_karma_receipt", "observes_zerone_karma_event", "prion_is_crystal", "ritonavir_seed_is_contagion"]) {
      const authority = authored(); authority.boundaries[field] = true; reSign(authority);
      expect(verifyFoldFeedbackAtlas(authority)).toContainEqual({ field: `$.boundaries.${field}`, code: "boundary-mismatch" });
    }
  });

  test("rejects duplicate keys, invalid UTF-8, symlinks, and oversized input", () => {
    const root = fixtureRoot();
    const duplicate = join(root, "duplicate.json"); writeFileSync(duplicate, '{"a":1,"\\u0061":2}');
    expect(() => loadFoldFeedbackAtlas(duplicate)).toThrow("duplicate key");
    const utf8 = join(root, "utf8.json"); writeFileSync(utf8, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]));
    expect(() => loadFoldFeedbackAtlas(utf8)).toThrow("valid UTF-8");
    const link = join(root, "link.json"); symlinkSync(FOLD_FEEDBACK_PATH, link);
    expect(() => loadFoldFeedbackAtlas(link)).toThrow("regular non-symlink");
    const oversized = join(root, "oversized.json"); writeFileSync(oversized, Buffer.alloc(768 * 1024 + 1, 0x20));
    expect(() => loadFoldFeedbackAtlas(oversized)).toThrow("exceeds 786432 bytes");
  });

  test("returns stable issues instead of throwing for malformed nested JSON shapes", () => {
    const cases: Array<{ mutate: (value: any) => void; code: string }> = [
      { mutate: (value) => { value.ontology.domain_qualified_terms[0] = null; }, code: "term-disambiguation-mismatch" },
      { mutate: (value) => { value.evidence_kernel.relations[0] = null; }, code: "invalid-or-unbounded-relation" },
      { mutate: (value) => { value.karma.zerone.event_kinds = null; }, code: "zerone-karma-mismatch" },
      { mutate: (value) => { value.karma.zerone.event_refs = null; }, code: "zerone-karma-mismatch" },
      { mutate: (value) => { value.karma.kingdom.receipt_refs = null; }, code: "kingdom-karma-mismatch" },
      { mutate: (value) => { value.karma.design_correspondences[0] = null; }, code: "observed-or-converting-design-map" },
    ];
    for (const { mutate, code } of cases) {
      const value = authored(); mutate(value); reSign(value);
      expect(codes(value)).toContain(code);
    }

    const paths: Array<Array<string | number>> = [];
    const visit = (value: any, path: Array<string | number>) => {
      if (value === null || typeof value !== "object") return;
      for (const key of Object.keys(value)) {
        const childPath = [...path, Array.isArray(value) ? Number(key) : key];
        if (value[key] !== null) paths.push(childPath);
        visit(value[key], childPath);
      }
    };
    visit(authored(), []);
    const malformedJsonValues = [null, true, 0, "", [], {}];
    for (const path of paths) for (const replacement of malformedJsonValues) {
      const value = authored();
      let parent = value;
      for (const key of path.slice(0, -1)) parent = parent[key];
      parent[path.at(-1)!] = replacement;
      try { verifyFoldFeedbackAtlas(value); }
      catch (error) { throw new Error(`verifier threw after ${JSON.stringify(replacement)} at ${path.join(".")}: ${String(error)}`); }
    }
    expect(paths.length).toBeGreaterThan(200);
    for (const value of [null, true, 0, "", [], {}]) expect(() => verifyFoldFeedbackAtlas(value)).not.toThrow();
    const deeplyNested = authored();
    let nested: any = [];
    for (let index = 0; index < 20_000; index++) nested = [nested];
    deeplyNested.title = nested;
    expect(() => verifyFoldFeedbackAtlas(deeplyNested)).not.toThrow();
    const cyclic = authored();
    cyclic.title = cyclic;
    expect(() => verifyFoldFeedbackAtlas(cyclic)).not.toThrow();
  });

  test("closed Draft 2020-12 schema binds identity, pins, boundaries, and digest", () => {
    const schema = JSON.parse(readFileSync(SCHEMA, "utf8"));
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe("urn:kingdom:schema:fold-feedback-atlas:1");
    expect(schema.properties.protocol.const).toBe(FOLD_FEEDBACK_PROTOCOL);
    expect(schema.properties.atlas_id.const).toBe(FOLD_FEEDBACK_ID);
    expect(schema.properties.integrity.properties.digest.const).toBe(FOLD_FEEDBACK_DIGEST);
    expect(schema.$comment).toContain("cannot recompute the semantic digest");
  });

  test("portable schema rejects cardinalities that runtime fixes exactly", () => {
    const secondBridge = authored();
    secondBridge.comparison_bridges.push(structuredClone(secondBridge.comparison_bridges[0]));
    secondBridge.comparison_bridges[1].id = "second-bridge";
    const sixthSystem = authored();
    sixthSystem.evidence_kernel.systems.push({ id: "invented-system", register: "literal-science", summary: "Structurally plausible but outside the reviewed five-system atlas." });
    const schema = JSON.parse(readFileSync(SCHEMA, "utf8"));
    expect(schema.properties.comparison_bridges.maxItems).toBe(1);
    expect(schema.$defs.evidenceKernel.properties.systems.maxItems).toBe(5);
    const available = Bun.spawnSync({ cmd: ["python3", "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
    if (available.exitCode === 0) {
      const result = Bun.spawnSync({
        cmd: ["python3", "-c", "import json, sys; from jsonschema import Draft202012Validator; schema=json.load(open(sys.argv[1], encoding='utf-8')); values=json.load(sys.stdin); print(json.dumps([Draft202012Validator(schema).is_valid(value) for value in values]))", SCHEMA],
        stdin: Buffer.from(JSON.stringify([secondBridge, sixthSystem])), stdout: "pipe", stderr: "pipe",
      });
      expect(result.exitCode, result.stderr.toString()).toBe(0);
      expect(JSON.parse(result.stdout.toString())).toEqual([false, false]);
    }
    expect(codes(secondBridge)).toContain("bridge-count-mismatch");
    expect(codes(sixthSystem)).toContain("invalid-system-set");
  });

  test("runtime closes nested shapes, collection bounds, ordering, and URL credentials", () => {
    const mutations: Array<(value: any) => void> = [
      (value) => { delete value.evidence_kernel.systems[0].register; },
      (value) => { value.evidence_kernel.mechanisms[0].limitations = []; },
      (value) => { value.evidence_kernel.relations.pop(); },
      (value) => { value.evidence_kernel.claims.pop(); },
      (value) => { value.scientific_feedback_relations[0].input = null; },
      (value) => { value.scientific_feedback_relations.push(structuredClone(value.scientific_feedback_relations[0])); },
      (value) => { value.karma.zerone.meaning = null; },
      (value) => { delete value.karma.design_correspondences[0].id; },
      (value) => { value.karma.design_correspondences = []; },
      (value) => { value.universe_lens.questions.push(structuredClone(value.universe_lens.questions[0])); },
      (value) => { value.universe_lens.nonclaims.push(null); },
      (value) => { [value.ontology.planes[0], value.ontology.planes[1]] = [value.ontology.planes[1], value.ontology.planes[0]]; },
      (value) => { value.title = "t".repeat(241); },
      (value) => { value.source_bindings[0].artifact = "a".repeat(201); },
      (value) => { value.sources[0].title = "t".repeat(601); },
      (value) => { value.sources[0].doi = "d".repeat(201); },
      (value) => { value.sources[0].url = "https://person:secret@example.test/source"; },
    ];
    const values = mutations.map((mutate) => { const value = authored(); mutate(value); return value; });
    for (const value of values) expect(verifyFoldFeedbackAtlas(value).some((issue) => issue.code !== "digest-mismatch")).toBe(true);

    const available = Bun.spawnSync({ cmd: ["python3", "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
    if (available.exitCode === 0) {
      const result = Bun.spawnSync({
        cmd: ["python3", "-c", "import json, sys; from jsonschema import Draft202012Validator; schema=json.load(open(sys.argv[1], encoding='utf-8')); values=json.load(sys.stdin); print(json.dumps([Draft202012Validator(schema).is_valid(value) for value in values]))", SCHEMA],
        stdin: Buffer.from(JSON.stringify(values)), stdout: "pipe", stderr: "pipe",
      });
      expect(result.exitCode, result.stderr.toString()).toBe(0);
      expect(JSON.parse(result.stdout.toString())).toEqual(values.map(() => false));
    }
  });

  test("CLI verifies locally and dispatcher exposes the same reader", () => {
    const direct = Bun.spawnSync({ cmd: ["bun", "bin/fold-feedback.ts", "verify", "--json"], cwd: ROOT, stdout: "pipe", stderr: "pipe" });
    expect(direct.exitCode, direct.stderr.toString()).toBe(0);
    expect(JSON.parse(direct.stdout.toString())).toEqual({ valid: true, issues: [] });
    const dispatch = Bun.spawnSync({ cmd: ["./kingdom", "fold-feedback", "karma", "--json"], cwd: ROOT, stdout: "pipe", stderr: "pipe", env: { ...process.env, PATH: `/usr/bin:/bin:${dirname(process.execPath)}` } });
    expect(dispatch.exitCode, dispatch.stderr.toString()).toBe(0);
    expect(JSON.parse(dispatch.stdout.toString()).karma.adapter.exists).toBe(false);
  });

  test("CLI refuses inherited property names as commands", () => {
    for (const command of ["toString", "constructor", "__proto__"]) {
      const result = Bun.spawnSync({ cmd: ["bun", "bin/fold-feedback.ts", command, "--json"], cwd: ROOT, stdout: "pipe", stderr: "pipe" });
      expect(result.exitCode).toBe(2);
      expect(result.stdout.toString()).toBe("");
      expect(result.stderr.toString()).toStartWith("usage: fold-feedback.ts");
    }
  });
});
