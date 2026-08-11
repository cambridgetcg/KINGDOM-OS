import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RITONAVIR_MECHANISM_DIGEST,
  RITONAVIR_MECHANISM_DOCUMENT_URL,
  RITONAVIR_MECHANISM_ID,
  RITONAVIR_MECHANISM_PATH,
  RITONAVIR_MECHANISM_PROTOCOL,
  RITONAVIR_MECHANISM_SCHEMA_URL,
  RITONAVIR_MECHANISM_URL,
  loadRitonavirMechanismLandscape,
  ritonavirMechanismDigest,
  ritonavirMechanismPublicDiscovery,
  verifyRitonavirMechanismLandscape,
} from "../bin/ritonavir-mechanism.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SCHEMA = join(ROOT, "schemas", "ritonavir-mechanism-landscape-v1.schema.json");
const GUIDE = join(ROOT, "references", "ritonavir-mechanism-landscape.md");
const KINGDOM = join(ROOT, "kingdom");
const HISTORY_DIGEST = "sha256:6c759f595f0c6753dcf47d25d2a3490246984ef2b79adf31a558261b26ef8116";
const tempRoots: string[] = [];

afterEach(() => {
  while (tempRoots.length > 0) rmSync(tempRoots.pop()!, { recursive: true, force: true });
});

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "kingdom-ritonavir-mechanism-test."));
  tempRoots.push(root);
  return root;
}

function authoredLandscape(): any {
  return JSON.parse(readFileSync(RITONAVIR_MECHANISM_PATH, "utf8"));
}

function reSign(value: any): any {
  value.integrity.digest = ritonavirMechanismDigest(value);
  return value;
}

function issueCodes(value: unknown): string[] {
  return verifyRitonavirMechanismLandscape(value).map((issue) => issue.code);
}

function byId(entries: any[], id: string): any {
  return entries.find((entry) => entry.id === id);
}

function writeJson(root: string, name: string, value: unknown): string {
  const path = join(root, name);
  writeFileSync(path, JSON.stringify(value));
  return path;
}

function validateWithPython(paths: string[]): { exitCode: number; stderr: string; counts: number[] } {
  const result = Bun.spawnSync({
    cmd: [
      "python3",
      "-c",
      [
        "import json, sys",
        "from jsonschema import Draft202012Validator, FormatChecker",
        "schema = json.load(open(sys.argv[1], encoding='utf-8'))",
        "Draft202012Validator.check_schema(schema)",
        "validator = Draft202012Validator(schema, format_checker=FormatChecker())",
        "print(json.dumps([len(list(validator.iter_errors(json.load(open(path, encoding='utf-8'))))) for path in sys.argv[2:]]))",
      ].join("; "),
      SCHEMA,
      ...paths,
    ],
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    exitCode: result.exitCode,
    stderr: result.stderr.toString(),
    counts: result.exitCode === 0 ? JSON.parse(result.stdout.toString()) : [],
  };
}

describe("Ritonavir mechanism landscape", () => {
  test("loads one reviewed, deterministic, source-bound landscape", () => {
    const landscape = loadRitonavirMechanismLandscape();

    expect(verifyRitonavirMechanismLandscape(landscape)).toEqual([]);
    expect(landscape.protocol).toBe(RITONAVIR_MECHANISM_PROTOCOL);
    expect(landscape.landscape_id).toBe(RITONAVIR_MECHANISM_ID);
    expect(landscape.compiled_on).toBe("2026-08-11");
    expect(landscape.evidence_through).toBe("2026-04-08");
    expect(landscape.integrity).toEqual({
      algorithm: "sha256-recursive-sorted-json-keys-v1",
      digest: RITONAVIR_MECHANISM_DIGEST,
    });
    expect(ritonavirMechanismDigest(landscape)).toBe(RITONAVIR_MECHANISM_DIGEST);
    expect(landscape.ontology.planes).toHaveLength(8);
    expect(landscape.ontology.geometry).toHaveLength(6);
    expect(landscape.entities).toHaveLength(19);
    expect(landscape.naming_charts).toHaveLength(2);
    expect(landscape.mechanisms).toHaveLength(7);
    expect(landscape.relations).toHaveLength(18);
    expect(landscape.claims).toHaveLength(9);
    expect(landscape.analytical_windows).toHaveLength(5);
    expect(landscape.unknowns).toHaveLength(6);
    expect(landscape.sources).toHaveLength(9);
  });

  test("preserves the immutable history while selecting the supplement as the current landscape", () => {
    const lineage = loadRitonavirMechanismLandscape().source_history;

    expect(lineage).toEqual({
      case_id: "ritonavir-disappearing-polymorph-2026-08-11",
      semantic_digest: HISTORY_DIGEST,
      public_url: "https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json",
      relation: "non-mutating-current-landscape-supplement",
      mutates_source_history: false,
      supersedes_source_history: false,
      supersedes_for_current_landscape: true,
    });
  });

  test("keeps eight non-equivalent planes and six finite geometry translations", () => {
    const { ontology } = loadRitonavirMechanismLandscape();

    expect(ontology.non_equivalence).toBe(
      "chemical_entity != molecular_conformer != crystal_phase != particle_population != formulation_dissolution != dissolved_exposure != pharmacological_action != clinical_decision",
    );
    expect(ontology.planes.map((entry: any) => entry.id)).toEqual([
      "chemical-entity",
      "molecular-conformer",
      "crystal-phase",
      "particle-population",
      "formulation-dissolution",
      "dissolved-exposure",
      "pharmacological-action",
      "clinical-decision",
    ]);
    expect(ontology.geometry.map((entry: any) => entry.id)).toEqual([
      "identity-fiber",
      "source-chart-atlas",
      "conditional-energy-landscape",
      "kinetic-path-graph",
      "observer-cover",
      "causal-dissolution-bridge",
    ]);
    expect(ontology.planes.every((entry: any) => entry.does_not_establish.length > 0)).toBe(true);
    expect(ontology.geometry.every((entry: any) => entry.does_not_imply.length > 0)).toBe(true);
  });

  test("represents molecular pose separately from covalent identity and crystal phase", () => {
    const landscape = loadRitonavirMechanismLandscape();
    const formOneConformer = byId(landscape.entities, "form-i-trans-carbamate-conformer");
    const formTwoConformer = byId(landscape.entities, "form-ii-cis-carbamate-conformer");

    expect(formOneConformer.kind).toBe("molecular-conformer");
    expect(formTwoConformer.kind).toBe("molecular-conformer");
    expect(byId(landscape.relations, "form-i-conformer-of-ritonavir")).toMatchObject({
      subject_id: formOneConformer.id,
      predicate: "conformer-of",
      object_id: "ritonavir-chemical-entity",
      universal: false,
    });
    expect(byId(landscape.relations, "form-i-packs-with-conformer")).toMatchObject({
      subject_id: "abbott-form-i",
      predicate: "packs-with-conformer",
      object_id: formOneConformer.id,
      condition_dependent: true,
    });
    expect(byId(landscape.relations, "form-ii-packs-with-conformer").object_id).toBe(formTwoConformer.id);
  });

  test("makes the source-local Form III name collision explicit", () => {
    const landscape = loadRitonavirMechanismLandscape();
    const historical = byId(landscape.entities, "morissette-2003-form-iii-solvate");
    const modern = byId(landscape.entities, "modern-2023-form-iii-anhydrous");
    const crosswalk = byId(landscape.relations, "form-iii-labels-not-same");

    expect(historical).toMatchObject({ kind: "formamide-solvate", label: "Form III" });
    expect(modern).toMatchObject({ kind: "anhydrous-polymorph", label: "Form III" });
    expect(crosswalk).toMatchObject({
      subject_id: historical.id,
      predicate: "not-same-phase-as",
      object_id: modern.id,
      evidence_class: "composition-and-structure-supported",
      universal: true,
    });
    expect(crosswalk.source_ids).toEqual(["morissette-2003", "parent-2023", "yao-2023"]);
    expect(landscape.naming_charts.map((chart: any) => chart.id)).toEqual([
      "morissette-2003-chart",
      "modern-anhydrous-chart",
    ]);
  });

  test("keeps the two Form IV structure records at candidate equivalence only", () => {
    const landscape = loadRitonavirMechanismLandscape();
    const relation = byId(landscape.relations, "two-form-iv-records-candidate-equivalent");
    const unknown = byId(landscape.unknowns, "two-form-iv-records-exact-equivalence");

    expect(byId(landscape.entities, "iuzzolino-2025-form-4-structure").label).toContain("CCDC 2411739");
    expect(byId(landscape.entities, "parent-2026-form-iv-structure").label).toContain("CCDC 2482055");
    expect(relation).toMatchObject({
      predicate: "candidate-equivalent-to",
      evidence_class: "strongly-supported-inference",
      condition_dependent: false,
      universal: false,
      direct_clinical_edge: false,
    });
    expect(unknown.status).toBe("candidate-equivalence-not-proven");
    expect(landscape.boundaries.form_iv_exact_equivalence_established).toBe(false);
  });

  test("requires the full condition-dependent dissolution bridge", () => {
    const landscape = loadRitonavirMechanismLandscape();
    const expected = [
      ["phase-to-particle-bridge", "abbott-form-i", "bounded-ritonavir-particle-population"],
      [
        "particle-to-formulation-dissolution-bridge",
        "bounded-ritonavir-particle-population",
        "named-formulation-dissolution-context",
      ],
      [
        "formulation-to-dissolved-exposure-bridge",
        "named-formulation-dissolution-context",
        "ritonavir-dissolved-exposure",
      ],
    ];

    for (const [id, subject, object] of expected) {
      expect(byId(landscape.relations, id)).toMatchObject({
        subject_id: subject,
        object_id: object,
        mechanism_id: "dissolution-bridge",
        condition_dependent: true,
        universal: false,
        direct_clinical_edge: false,
      });
    }
    expect(byId(landscape.entities, "bounded-ritonavir-particle-population").kind).toBe("particle-population");
    expect(byId(landscape.entities, "named-formulation-dissolution-context").kind).toBe(
      "formulation-dissolution-context",
    );
  });

  test("branches from dissolved exposure into two separate biological mechanisms", () => {
    const landscape = loadRitonavirMechanismLandscape();
    const protease = byId(landscape.mechanisms, "hiv-protease-inhibition");
    const cyp3a = byId(landscape.mechanisms, "cyp3a-inhibition");

    expect(protease.source_ids).toEqual(["dailymed-ritonavir-2023"]);
    expect(cyp3a.source_ids).toEqual(["dailymed-ritonavir-2023"]);
    expect(byId(landscape.relations, "dissolved-ritonavir-inhibits-hiv-protease")).toMatchObject({
      subject_id: "ritonavir-dissolved-exposure",
      predicate: "inhibits",
      object_id: "hiv-1-protease",
      mechanism_id: protease.id,
    });
    expect(byId(landscape.relations, "protease-inhibition-reduces-processing")).toMatchObject({
      subject_id: "hiv-1-protease",
      object_id: "hiv-gag-pol-processing",
      mechanism_id: protease.id,
    });
    expect(byId(landscape.relations, "reduced-processing-leads-to-immature-particles")).toMatchObject({
      subject_id: "hiv-gag-pol-processing",
      object_id: "immature-noninfectious-hiv-particles",
      mechanism_id: protease.id,
    });
    expect(byId(landscape.relations, "dissolved-ritonavir-inhibits-cyp3a")).toMatchObject({
      subject_id: "ritonavir-dissolved-exposure",
      predicate: "inhibits",
      object_id: "cyp3a",
      mechanism_id: cyp3a.id,
    });
    expect(byId(landscape.relations, "cyp3a-inhibition-may-alter-exposure")).toMatchObject({
      subject_id: "cyp3a",
      object_id: "co-medication-exposure",
      mechanism_id: cyp3a.id,
    });
    expect(protease.id).not.toBe(cyp3a.id);
  });

  test("pins one observed official label without calling it the only or latest label", () => {
    const source = byId(loadRitonavirMechanismLandscape().sources, "dailymed-ritonavir-2023");

    expect(source).toMatchObject({
      title: "RITONAVIR tablets official structured product label",
      source_kind: "official-product-label-observed",
      published_on: "2023-02-23",
      observed_on: "2026-08-11",
      url: "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=db633374-6d8e-4622-9fe1-f9d68baa59bb",
      doi: null,
    });
    expect(source.authority_note).toContain("not claimed to be the only or latest");
    expect(source.authority_note).toContain("recheck current labeling");
  });

  test("keeps unknowns and all medical, quality, experiment, and action authority closed", () => {
    const landscape = loadRitonavirMechanismLandscape();

    expect(landscape.unknowns.map((entry: any) => entry.id)).toEqual([
      "first-1998-nucleant",
      "complete-solid-form-landscape",
      "two-form-iv-records-exact-equivalence",
      "nucleation-from-energy-landscape",
      "current-product-state",
      "individual-clinical-outcome",
    ]);
    expect(landscape.boundaries).toMatchObject({
      phase_name_is_global_identity: false,
      form_iv_exact_equivalence_established: false,
      complete_solid_form_landscape_established: false,
      global_stability_ranking_established: false,
      exclusive_1998_cause_established: false,
      universal_seed_effect_established: false,
      direct_crystal_form_to_clinical_outcome: false,
      current_product_defect_established: false,
      medical_advice: false,
      diagnostic_authority: false,
      dosing_authority: false,
      interaction_checker: false,
      treatment_change_authority: false,
      formulation_instruction: false,
      manufacturing_instruction: false,
      gmp_authority: false,
      batch_release_authority: false,
      regulatory_authority: false,
      experiment_authority: false,
      procurement_authority: false,
      automatic_action: false,
      writes_agenttool: false,
      writes_wake: false,
      public_surface_read_only: true,
    });
    expect(landscape.plain_language.safety).toContain("serious or life-threatening");
    expect(landscape.plain_language.safety).toContain("do not start, stop, or change");
  });

  test("exposes stable public discovery without an action surface", () => {
    const discovery = ritonavirMechanismPublicDiscovery();

    expect(discovery).toMatchObject({
      protocol: RITONAVIR_MECHANISM_PROTOCOL,
      landscape_id: RITONAVIR_MECHANISM_ID,
      url: RITONAVIR_MECHANISM_URL,
      schema: RITONAVIR_MECHANISM_SCHEMA_URL,
      guide: RITONAVIR_MECHANISM_DOCUMENT_URL,
      integrity: { digest: RITONAVIR_MECHANISM_DIGEST },
      source_history: {
        semantic_digest: HISTORY_DIGEST,
        supersedes_for_current_landscape: true,
      },
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
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("action");
    expect(discovery).not.toHaveProperty("matcher");
  });

  test("rejects raw tampering and refuses a self-signed replacement of the reviewed artifact", () => {
    const tampered = authoredLandscape();
    tampered.title = `${tampered.title} changed`;
    expect(issueCodes(tampered)).toContain("digest-mismatch");
    expect(issueCodes(tampered)).not.toContain("reviewed-digest-mismatch");

    reSign(tampered);
    expect(tampered.integrity.digest).not.toBe(RITONAVIR_MECHANISM_DIGEST);
    expect(issueCodes(tampered)).toContain("reviewed-digest-mismatch");
    expect(issueCodes(tampered)).not.toContain("digest-mismatch");
  });

  test("rejects collapsed Form III and Form IV crosswalks even when self-signed", () => {
    const formThree = authoredLandscape();
    byId(formThree.relations, "form-iii-labels-not-same").predicate = "same-phase-as";
    reSign(formThree);
    expect(issueCodes(formThree)).toContain("form-iii-crosswalk-missing");

    const formFourExact = authoredLandscape();
    byId(formFourExact.relations, "two-form-iv-records-candidate-equivalent").predicate = "same-phase-as";
    reSign(formFourExact);
    expect(issueCodes(formFourExact)).toContain("form-iv-uncertainty-collapsed");

    const formFourUniversal = authoredLandscape();
    byId(formFourUniversal.relations, "two-form-iv-records-candidate-equivalent").universal = true;
    reSign(formFourUniversal);
    expect(issueCodes(formFourUniversal)).toContain("candidate-equivalence-cannot-be-universal");
    expect(issueCodes(formFourUniversal)).toContain("form-iv-uncertainty-collapsed");
  });

  test("rejects direct solid-to-exposure shortcuts and broken bridge conditions", () => {
    const shortcut = authoredLandscape();
    byId(shortcut.relations, "phase-to-particle-bridge").object_id = "ritonavir-dissolved-exposure";
    reSign(shortcut);
    expect(issueCodes(shortcut)).toContain("forbidden-solid-to-biological-shortcut");
    expect(issueCodes(shortcut)).toContain("dissolution-path-boundary-mismatch");

    const universal = authoredLandscape();
    byId(universal.relations, "particle-to-formulation-dissolution-bridge").condition_dependent = false;
    byId(universal.relations, "particle-to-formulation-dissolution-bridge").universal = true;
    reSign(universal);
    expect(issueCodes(universal)).toContain("dissolution-path-boundary-mismatch");

    const clinical = authoredLandscape();
    byId(clinical.relations, "formulation-to-dissolved-exposure-bridge").direct_clinical_edge = true;
    reSign(clinical);
    expect(issueCodes(clinical)).toContain("invalid-relation");
  });

  test("rejects source, reference, order, date, safety, unknown, and authority drift", () => {
    const source = authoredLandscape();
    byId(source.sources, "dailymed-ritonavir-2023").url = "https://example.com/not-the-pinned-label";
    reSign(source);
    expect(issueCodes(source)).toContain("source-pin-or-shape-mismatch");

    const reference = authoredLandscape();
    reference.claims[0].source_ids = ["missing-source"];
    reSign(reference);
    expect(issueCodes(reference)).toContain("unresolved-reference");

    const order = authoredLandscape();
    [order.entities[0], order.entities[1]] = [order.entities[1], order.entities[0]];
    reSign(order);
    expect(issueCodes(order)).toContain("entity-order-or-membership-mismatch");

    const date = authoredLandscape();
    date.compiled_on = "2026-02-30";
    reSign(date);
    expect(issueCodes(date)).toContain("invalid-date");

    const safety = authoredLandscape();
    safety.plain_language.safety = "Educational only.";
    reSign(safety);
    expect(issueCodes(safety)).toContain("medical-safety-boundary-mismatch");

    const unknowns = authoredLandscape();
    unknowns.unknowns = [];
    reSign(unknowns);
    expect(issueCodes(unknowns)).toContain("invalid-unknown-set");

    const limitations = authoredLandscape();
    limitations.claims[0].limitations = [];
    reSign(limitations);
    expect(issueCodes(limitations)).toContain("invalid-claim");

    for (const field of [
      "medical_advice",
      "interaction_checker",
      "treatment_change_authority",
      "manufacturing_instruction",
      "experiment_authority",
      "automatic_action",
    ]) {
      const authority = authoredLandscape();
      authority.boundaries[field] = true;
      reSign(authority);
      expect(verifyRitonavirMechanismLandscape(authority)).toContainEqual({
        field: `$.boundaries.${field}`,
        code: "boundary-mismatch",
      });
    }
  });

  test("rejects unknown fields, duplicate keys, invalid UTF-8, symlinks, and oversized input", () => {
    const unknown = authoredLandscape();
    unknown.global_rank = "Form II";
    reSign(unknown);
    expect(issueCodes(unknown)).toContain("unexpected-or-missing-field");

    const root = fixtureRoot();
    const duplicate = join(root, "duplicate.json");
    writeFileSync(duplicate, '{"a":1,"\\u0061":2}');
    expect(() => loadRitonavirMechanismLandscape(duplicate)).toThrow("duplicate key");

    const invalidUtf8 = join(root, "invalid-utf8.json");
    writeFileSync(invalidUtf8, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]));
    expect(() => loadRitonavirMechanismLandscape(invalidUtf8)).toThrow("valid UTF-8");

    const link = join(root, "landscape-link.json");
    symlinkSync(RITONAVIR_MECHANISM_PATH, link);
    expect(() => loadRitonavirMechanismLandscape(link)).toThrow("regular non-symlink");

    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, Buffer.alloc(512 * 1024 + 1, 0x20));
    expect(() => loadRitonavirMechanismLandscape(oversized)).toThrow("exceeds 524288 bytes");
  });

  test("validates the authored artifact against the closed Draft 2020-12 schema", () => {
    const result = validateWithPython([RITONAVIR_MECHANISM_PATH]);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.counts).toEqual([0]);
    const schema = JSON.parse(readFileSync(SCHEMA, "utf8"));
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe("urn:kingdom:schema:ritonavir-mechanism-landscape:1");
    expect(schema.properties.protocol.const).toBe(RITONAVIR_MECHANISM_PROTOCOL);
    expect(schema.properties.landscape_id.const).toBe(RITONAVIR_MECHANISM_ID);
    expect(schema.properties.integrity.properties.digest.const).toBe(RITONAVIR_MECHANISM_DIGEST);
    expect(schema.$comment).toContain("cannot recompute the semantic digest");
  });

  test("portable schema rejects structural, source-pin, date, boundary, and seal drift", () => {
    const root = fixtureRoot();
    const extraTop = authoredLandscape();
    extraTop.extra = true;
    const extraNested = authoredLandscape();
    extraNested.entities[0].extra = true;
    const protocol = authoredLandscape();
    protocol.protocol = "kingdom.ritonavir-mechanism-landscape/9.9";
    const digest = authoredLandscape();
    digest.integrity.digest = `sha256:${"0".repeat(64)}`;
    const source = authoredLandscape();
    source.sources[0].url = "https://example.com/history.json";
    const date = authoredLandscape();
    date.sources[1].published_on = "2001-13";
    const boundary = authoredLandscape();
    boundary.boundaries.medical_advice = true;
    const missingUnknowns = authoredLandscape();
    missingUnknowns.unknowns = [];
    const paths = [extraTop, extraNested, protocol, digest, source, date, boundary, missingUnknowns]
      .map((value, index) => writeJson(root, `schema-invalid-${index}.json`, value));
    const result = validateWithPython(paths);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.counts).toHaveLength(paths.length);
    expect(result.counts.every((count) => count > 0)).toBe(true);
  });

  test("makes the schema-versus-runtime semantic boundary executable", () => {
    const root = fixtureRoot();
    const structurallyValidTamper = authoredLandscape();
    byId(structurallyValidTamper.relations, "form-iii-labels-not-same").predicate = "same-phase-as";
    const path = writeJson(root, "structurally-valid-semantic-tamper.json", structurallyValidTamper);
    const schemaResult = validateWithPython([path]);

    expect(schemaResult.exitCode, schemaResult.stderr).toBe(0);
    expect(schemaResult.counts).toEqual([0]);
    expect(issueCodes(structurallyValidTamper)).toContain("form-iii-crosswalk-missing");
    expect(issueCodes(structurallyValidTamper)).toContain("digest-mismatch");
  });

  test("documents the scientific and operational boundaries in plain language", () => {
    const guide = readFileSync(GUIDE, "utf8");

    expect(guide).toContain("formamide solvate");
    expect(guide).toContain("candidate-equivalent-to");
    expect(guide).toContain("CCDC 2411739");
    expect(guide).toContain("CCDC 2482055");
    expect(guide).toContain("HIV-1 protease inhibition");
    expect(guide).toContain("CYP3A inhibition");
    expect(guide).toContain("phase\n  -> bounded particle population");
    expect(guide).toContain("not medical advice");
    expect(guide).toContain("serious or life-threatening");
    expect(guide).toContain("JSON Schema cannot recompute");
    expect(guide).toContain("./kingdom polymorph verify-landscape --json");
    expect(guide).toContain("/schemas/ritonavir-mechanism-landscape/1.json");
  });
});

describe("Ritonavir mechanism CLI", () => {
  test("exposes the network-free mechanisms and landscape views through kingdom", () => {
    const root = fixtureRoot();
    const sentinel = join(root, "sentinel");
    writeFileSync(sentinel, "before\n");
    const env = { ...process.env, HTTPS_PROXY: "http://127.0.0.1:1", HTTP_PROXY: "http://127.0.0.1:1", NO_PROXY: "" };

    const mechanisms = Bun.spawnSync({
      cmd: [KINGDOM, "polymorph", "mechanisms", "--json"],
      cwd: root,
      env,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(mechanisms.exitCode, mechanisms.stderr.toString()).toBe(0);
    expect(JSON.parse(mechanisms.stdout.toString())).toMatchObject({
      landscape_id: RITONAVIR_MECHANISM_ID,
      mechanisms: expect.any(Array),
    });
    expect(JSON.parse(mechanisms.stdout.toString()).mechanisms).toHaveLength(7);

    const landscape = Bun.spawnSync({
      cmd: [KINGDOM, "polymorph", "landscape", "--json"],
      cwd: root,
      env,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(landscape.exitCode, landscape.stderr.toString()).toBe(0);
    expect(JSON.parse(landscape.stdout.toString())).toMatchObject({
      landscape_id: RITONAVIR_MECHANISM_ID,
      entities: expect.any(Array),
      relations: expect.any(Array),
    });
    expect(JSON.parse(landscape.stdout.toString()).relations).toHaveLength(18);
    expect(readFileSync(sentinel, "utf8")).toBe("before\n");
  });

  test("verifies the runtime contract and says that JSON Schema is a separate check", () => {
    const json = Bun.spawnSync({
      cmd: [KINGDOM, "polymorph", "verify-landscape", "--json"],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(json.exitCode, json.stderr.toString()).toBe(0);
    expect(JSON.parse(json.stdout.toString())).toEqual({ valid: true, issues: [] });

    const text = Bun.spawnSync({
      cmd: [KINGDOM, "polymorph", "verify-landscape"],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(text.exitCode, text.stderr.toString()).toBe(0);
    expect(text.stdout.toString()).toContain("semantic digest");
    expect(text.stdout.toString()).toContain("JSON Schema not checked");
  });

  test("refuses a self-signed replacement from an explicit file", () => {
    const root = fixtureRoot();
    const replacement = authoredLandscape();
    replacement.title = `${replacement.title} replacement`;
    reSign(replacement);
    const path = writeJson(root, "replacement.json", replacement);
    const result = Bun.spawnSync({
      cmd: ["bun", join(ROOT, "bin", "ritonavir-mechanism.ts"), "verify", path, "--json"],
      stdout: "pipe",
      stderr: "pipe",
    });

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout.toString())).toMatchObject({
      valid: false,
      issues: expect.arrayContaining([
        { field: "$.integrity.digest", code: "reviewed-digest-mismatch" },
      ]),
    });
  });
});
