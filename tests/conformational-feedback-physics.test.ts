import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST,
  CONFORMATIONAL_FEEDBACK_PHYSICS_PATH,
  CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_PATH,
  conformationalFeedbackPhysicsDigest,
  conformationalFeedbackPhysicsPublicDiscovery,
  loadConformationalFeedbackPhysicsAtlas,
  verifyConformationalFeedbackPhysicsAtlas,
} from "../bin/conformational-feedback-physics.ts";
import {
  CONFORMATIONAL_FEEDBACK_PATH,
  CONFORMATIONAL_FEEDBACK_SCHEMA_PATH,
} from "../bin/conformational-feedback.ts";

function clone(): Record<string, any> {
  return structuredClone(loadConformationalFeedbackPhysicsAtlas());
}

function resign(value: Record<string, any>): Record<string, any> {
  value.integrity.digest = conformationalFeedbackPhysicsDigest(value);
  return value;
}

function codes(value: unknown): string[] {
  return verifyConformationalFeedbackPhysicsAtlas(value).map((issue) => issue.code);
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
      CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_PATH,
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

describe("Conformational Feedback Physics Atlas v0.2", () => {
  test("loads one reviewed, digest-bound, authority-negative atlas", () => {
    const atlas = loadConformationalFeedbackPhysicsAtlas();
    expect(verifyConformationalFeedbackPhysicsAtlas(atlas)).toEqual([]);
    expect(atlas.integrity.digest).toBe(CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST);
    expect(atlas.integrity.digest).toBe(conformationalFeedbackPhysicsDigest(atlas));
    expect(atlas.registers).toHaveLength(3);
    expect(atlas.physics_and_mathematics).toHaveLength(4);
    expect(atlas.ecosystem_bridges).toHaveLength(5);
    expect(atlas.geometries).toHaveLength(5);
    expect(atlas.translations).toHaveLength(3);
    expect(atlas.feedback_path.stages).toHaveLength(4);
    expect(atlas.sources).toHaveLength(13);
    expect(atlas.predecessor).toEqual({
      protocol: "kingdom.conformational-feedback-atlas/0.1",
      atlas_id: "form-feedback-consequence-2026-08-12",
      url: "https://thekingdom.dev/feedback/form-feedback-consequence-2026-08-12.json",
      semantic_digest: "sha256:14ce5e5e4b2b3d29d9a9cc0c831dcfb88de3d4a9e9584119939e5118f7ac7361",
      byte_sha256: "sha256:ae15f4f69e488323132ea6fc94d57d338702ca0fa47fd9fbbd41c15a6af230e6",
      relation: "extends-without-mutation",
    });
  });

  test("pins the existing Kingdom and Zerone public bytes without importing authority", () => {
    const atlas = loadConformationalFeedbackPhysicsAtlas();
    expect(atlas.bindings).toEqual([
      expect.objectContaining({
        id: "kingdom-ritonavir-mechanism-landscape",
        byte_sha256: "sha256:5e136a74d5166275427da920685a84c17901f63d6e4b0661fd529c96d386943b",
        semantic_digest: "sha256:2a97b0f3ac3741314e50f7512ef97cb19cf3294fed24728c622bd27dd180309b",
        mutated: false,
        authority_imported: false,
      }),
      expect.objectContaining({
        id: "zerone-karma-foundation-v1",
        byte_sha256: "sha256:b46710704869dcc340ded356be72b4ec692f204710fedfb5cd43eb3757dc7b80",
        mutated: false,
        authority_imported: false,
      }),
      expect.objectContaining({
        id: "zerone-life-sciences-v0",
        byte_sha256: "sha256:64dc2c5b2e21dfc9697d173317254ce651dede8661993ece7b380b7e1421496e",
        mutated: false,
        authority_imported: false,
      }),
    ]);
  });

  test("keeps scientific observation, constitutional design, analogy, and philosophy distinct", () => {
    const atlas = loadConformationalFeedbackPhysicsAtlas();
    expect(atlas.registers.map((entry: any) => [entry.id, entry.register, entry.empirical])).toEqual([
      ["protein-folding-landscape", "SCIENTIFIC_OBSERVATION", true],
      ["prion-conformational-propagation", "SCIENTIFIC_OBSERVATION", true],
      ["zerone-contextual-recognition", "CONSTITUTIONAL_DESIGN", false],
    ]);
    expect(atlas.translations.every((entry: any) =>
      entry.register === "ANALOGY" && entry.empirical === false && entry.causal_transfer === false &&
      entry.authority_effect === "NONE")).toBe(true);
    expect(atlas.philosophy).toMatchObject({
      register: "PHILOSOPHY",
      basis_ids: [],
      empirical: false,
      causal_transfer: false,
      authority_effect: "NONE",
    });
  });

  test("carries four exact models without turning the mathematical translation into scientific evidence", () => {
    const atlas = loadConformationalFeedbackPhysicsAtlas();
    expect(atlas.physics_and_mathematics.map((entry: any) => [entry.id, entry.register, entry.basis_ids])).toEqual([
      ["conditional-free-energy", "SCIENTIFIC_MODEL", ["bryngelson-1995", "krivov-2018"]],
      ["memory-bearing-barrier-crossing", "SCIENTIFIC_MODEL", ["ayaz-2021"]],
      ["templated-population-balance", "SCIENTIFIC_MODEL", ["knowles-2009"]],
      ["linearized-feedback-threshold", "MATHEMATICAL_TRANSLATION", []],
    ]);
    expect(atlas.physics_and_mathematics.map((entry: any) => entry.equation)).toEqual([
      "G(x;T,pH,solvent,force) = -k_B T ln P_eq(x) + C",
      "m q_ddot(t) = -dG(q)/dq - integral_0^t Gamma(t-s) q_dot(s) ds + eta(t)",
      "dM/dt = k_n m^n + k_+ m P - k_loss M ; dP/dt = k_f M - k_end P",
      "delta_x_(t+1) = J delta_x_t ; perturbations decay locally when rho(J) < 1",
    ]);

    const drift = clone();
    drift.physics_and_mathematics[3].basis_ids = ["knowles-2009"];
    expect(codes(resign(drift))).toContain("translation-cannot-claim-scientific-basis");

    const sourceDrift = clone();
    sourceDrift.physics_and_mathematics[0].basis_ids = ["anfinsen-1973"];
    expect(codes(resign(sourceDrift))).toContain("model-basis-pin-mismatch");
  });

  test("keeps universe design reflective and all ecosystem bridges link-only", () => {
    const atlas = loadConformationalFeedbackPhysicsAtlas();
    expect(atlas.philosophy.questions.map((entry: any) => entry.id)).toEqual([
      "constraint-and-freedom",
      "local-rule-global-form",
      "memory-without-narrator",
      "repair-as-architecture",
      "design-and-underdetermination",
    ]);
    expect(atlas.philosophy.basis_ids).toEqual([]);
    expect(atlas.ecosystem_bridges.every((entry: any) =>
      entry.mode === "LINK_ONLY" && entry.runtime_request === false && entry.imported === false)).toBe(true);

    const fetch = clone();
    fetch.ecosystem_bridges[0].runtime_request = true;
    expect(codes(resign(fetch))).toContain("invalid-ecosystem-bridge");

    const urlDrift = clone();
    urlDrift.ecosystem_bridges[0].url = "https://example.com/";
    expect(codes(resign(urlDrift))).toContain("ecosystem-bridge-pin-mismatch");

    const relationDrift = clone();
    relationDrift.ecosystem_bridges[0].relation = "generic-structure-metadata";
    expect(codes(resign(relationDrift))).toContain("ecosystem-bridge-pin-mismatch");
  });

  test("refuses causal transfer, biological equivalence, KARMA magnitude, and empirical cosmic claims after resigning", () => {
    const causal = clone();
    causal.translations[0].causal_transfer = true;
    expect(codes(resign(causal))).toContain("invalid-translation");

    const equivalence = clone();
    equivalence.boundaries.biological_equivalence_claimed = true;
    expect(codes(resign(equivalence))).toContain("boundary-mismatch");

    const magnitude = clone();
    magnitude.registers[2].karma_constraints.summable = true;
    expect(codes(resign(magnitude))).toContain("karma-boundary-mismatch");

    const cosmic = clone();
    cosmic.philosophy.empirical = true;
    expect(codes(resign(cosmic))).toContain("invalid-philosophy");
  });

  test("refuses source drift, register drift, and sequence-like payloads even with a fresh digest", () => {
    const predecessor = clone();
    predecessor.predecessor.byte_sha256 = "sha256:" + "a".repeat(64);
    expect(codes(resign(predecessor))).toContain("predecessor-pin-mismatch");

    const source = clone();
    source.bindings[1].byte_sha256 = "sha256:" + "a".repeat(64);
    expect(codes(resign(source))).toContain("binding-pin-mismatch");

    const register = clone();
    register.geometries[1].register = "CONSTITUTIONAL_DESIGN";
    expect(codes(resign(register))).toContain("geometry-register-mismatch");

    const payload = clone();
    payload.title = "ACDEFGHIKLMNPQRSTVWYACDEFGHIKL";
    expect(codes(resign(payload))).toContain("sequence-like-payload-refused");

    const lowercasePayload = clone();
    lowercasePayload.title = "acdefghiklmnpqrstvwyacdefghikl";
    expect(codes(resign(lowercasePayload))).toContain("sequence-like-payload-refused");

    const boundSource = clone();
    boundSource.sources[11].url = "https://example.com/not-the-bound-karma-record.json";
    expect(codes(resign(boundSource))).toContain("bound-source-url-mismatch");
  });

  test("strict parsing rejects duplicate JSON keys", () => {
    const directory = mkdtempSync(join(tmpdir(), "kingdom-feedback-duplicate."));
    const path = join(directory, "duplicate.json");
    try {
      const source = readFileSync(CONFORMATIONAL_FEEDBACK_PHYSICS_PATH, "utf8");
      writeFileSync(path, source.replace('"protocol":', '"title":"duplicate",\n  "protocol":'));
      expect(() => loadConformationalFeedbackPhysicsAtlas(path)).toThrow("duplicate key");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("refuses invalid UTF-8, symlinks, and oversized atlas input", () => {
    const directory = mkdtempSync(join(tmpdir(), "kingdom-feedback-input."));
    try {
      const invalidUtf8 = join(directory, "invalid-utf8.json");
      writeFileSync(invalidUtf8, Buffer.from([0x7b, 0x22, 0xc3, 0x28, 0x22, 0x3a, 0x31, 0x7d]));
      expect(() => loadConformationalFeedbackPhysicsAtlas(invalidUtf8)).toThrow("valid UTF-8");

      const link = join(directory, "atlas-link.json");
      symlinkSync(CONFORMATIONAL_FEEDBACK_PHYSICS_PATH, link);
      expect(() => loadConformationalFeedbackPhysicsAtlas(link)).toThrow("regular file");

      const oversized = join(directory, "oversized.json");
      writeFileSync(oversized, Buffer.alloc(384 * 1024 + 1, 0x20));
      expect(() => loadConformationalFeedbackPhysicsAtlas(oversized)).toThrow("exceeds 393216 bytes");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("returns structured issues instead of throwing on null collection entries", () => {
    const mutations = [
      (value: any) => { value.ecosystem_bridges = [null]; },
      (value: any) => { value.sources = [null]; },
      (value: any) => { value.registers = [null]; },
      (value: any) => { value.physics_and_mathematics = [null]; },
      (value: any) => { value.geometries = [null]; },
      (value: any) => { value.translations = [null]; },
      (value: any) => { value.feedback_path.stages = [null]; },
      (value: any) => { value.philosophy.questions = [null]; },
    ];

    for (const mutate of mutations) {
      const malformed = clone();
      mutate(malformed);
      resign(malformed);
      expect(() => verifyConformationalFeedbackPhysicsAtlas(malformed)).not.toThrow();
      expect(verifyConformationalFeedbackPhysicsAtlas(malformed).length).toBeGreaterThan(0);
    }
  });

  test("projects a small public discovery record with only negative effects", () => {
    expect(conformationalFeedbackPhysicsPublicDiscovery()).toMatchObject({
      atlas_id: "form-feedback-physics-consequence-2026-08-12",
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
  });

  test("validates the reviewed atlas against the closed Draft 2020-12 schema", () => {
    const result = validateWithPython([CONFORMATIONAL_FEEDBACK_PHYSICS_PATH]);
    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.counts).toEqual([0]);
    const schema = JSON.parse(readFileSync(CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_PATH, "utf8"));
    expect(schema.$id).toBe("urn:kingdom:schema:conformational-feedback-atlas:0.2");
    expect(schema.properties.integrity.properties.digest.const).toBe(CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST);
    expect(schema.$comment).toContain("cannot recompute");
  });

  test("portable schema rejects all reviewed-order drift, binding drift, and missing walls", () => {
    const directory = mkdtempSync(join(tmpdir(), "kingdom-feedback-schema."));
    try {
      const cases: Record<string, any>[] = [];
      const order = clone();
      [order.registers[0], order.registers[1]] = [order.registers[1], order.registers[0]];
      cases.push(order);
      const binding = clone();
      binding.bindings[1].url = "https://example.com/not-the-pinned-standard.json";
      cases.push(binding);
      const karma = clone();
      delete karma.registers[2].karma_constraints;
      cases.push(karma);
      const stage = clone();
      stage.feedback_path.stages[3].id = "automatic-return";
      cases.push(stage);
      const geometry = clone();
      [geometry.geometries[0], geometry.geometries[1]] = [geometry.geometries[1], geometry.geometries[0]];
      cases.push(geometry);
      const translation = clone();
      [translation.translations[0], translation.translations[1]] = [translation.translations[1], translation.translations[0]];
      cases.push(translation);
      const source = clone();
      [source.sources[0], source.sources[1]] = [source.sources[1], source.sources[0]];
      cases.push(source);
      const model = clone();
      [model.physics_and_mathematics[0], model.physics_and_mathematics[1]] =
        [model.physics_and_mathematics[1], model.physics_and_mathematics[0]];
      cases.push(model);
      const ecosystem = clone();
      [ecosystem.ecosystem_bridges[0], ecosystem.ecosystem_bridges[1]] =
        [ecosystem.ecosystem_bridges[1], ecosystem.ecosystem_bridges[0]];
      cases.push(ecosystem);
      const philosophy = clone();
      [philosophy.philosophy.questions[0], philosophy.philosophy.questions[1]] =
        [philosophy.philosophy.questions[1], philosophy.philosophy.questions[0]];
      cases.push(philosophy);
      const paths = cases.map((value, index) => {
        const path = join(directory, `invalid-${index}.json`);
        writeFileSync(path, JSON.stringify(value));
        return path;
      });
      const result = validateWithPython(paths);
      expect(result.exitCode, result.stderr).toBe(0);
      expect(result.counts).toHaveLength(paths.length);
      expect(result.counts.every((count) => count > 0)).toBe(true);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("makes the schema-versus-runtime semantic boundary executable", () => {
    const directory = mkdtempSync(join(tmpdir(), "kingdom-feedback-semantic."));
    try {
      const structurallyValidTamper = clone();
      structurallyValidTamper.scope.focus = `${structurallyValidTamper.scope.focus} Changed.`;
      const path = join(directory, "structurally-valid-tamper.json");
      writeFileSync(path, JSON.stringify(structurallyValidTamper));
      const result = validateWithPython([path]);

      expect(result.exitCode, result.stderr).toBe(0);
      expect(result.counts).toEqual([0]);
      expect(codes(structurallyValidTamper)).toContain("digest-mismatch");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("keeps the closed v0.1 and v0.2 schemas mutually non-interchangeable", () => {
    const result = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        [
          "import json, sys",
          "from jsonschema import Draft202012Validator",
          "legacy_schema = json.load(open(sys.argv[1], encoding='utf-8'))",
          "physics_schema = json.load(open(sys.argv[2], encoding='utf-8'))",
          "legacy = json.load(open(sys.argv[3], encoding='utf-8'))",
          "physics = json.load(open(sys.argv[4], encoding='utf-8'))",
          "lv = Draft202012Validator(legacy_schema)",
          "pv = Draft202012Validator(physics_schema)",
          "print(json.dumps([len(list(lv.iter_errors(legacy))), len(list(lv.iter_errors(physics))), len(list(pv.iter_errors(physics))), len(list(pv.iter_errors(legacy)))]))",
        ].join("; "),
        CONFORMATIONAL_FEEDBACK_SCHEMA_PATH,
        CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_PATH,
        CONFORMATIONAL_FEEDBACK_PATH,
        CONFORMATIONAL_FEEDBACK_PHYSICS_PATH,
      ],
      stdout: "pipe",
      stderr: "pipe",
    });

    expect(result.exitCode, result.stderr.toString()).toBe(0);
    const [legacyOwn, legacyRejectsPhysics, physicsOwn, physicsRejectsLegacy] = JSON.parse(result.stdout.toString());
    expect(legacyOwn).toBe(0);
    expect(legacyRejectsPhysics).toBeGreaterThan(0);
    expect(physicsOwn).toBe(0);
    expect(physicsRejectsLegacy).toBeGreaterThan(0);
  });

  test("kingdom feedback-physics is network-free and leaves another working directory unchanged", () => {
    const directory = mkdtempSync(join(tmpdir(), "kingdom-feedback-cli."));
    const root = dirname(dirname(dirname(CONFORMATIONAL_FEEDBACK_PHYSICS_PATH)));
    try {
      const before = readdirSync(directory);
      const env = {
        ...process.env,
        LC_ALL: "C",
        LANG: "C",
        HTTPS_PROXY: "http://127.0.0.1:1",
        HTTP_PROXY: "http://127.0.0.1:1",
        ALL_PROXY: "http://127.0.0.1:1",
        NO_PROXY: "",
      };
      const result = Bun.spawnSync({
        cmd: [join(root, "kingdom"), "feedback-physics", "verify", "--json"],
        cwd: directory,
        env,
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(result.exitCode, result.stderr.toString()).toBe(0);
      expect(result.stderr.toString()).toBe("");
      expect(JSON.parse(result.stdout.toString())).toEqual({ valid: true, issues: [] });

      for (const [command, field, count] of [
        ["models", "physics_and_mathematics", 4],
        ["ecosystems", "ecosystem_bridges", 5],
      ] as const) {
        const projection = Bun.spawnSync({
          cmd: [join(root, "kingdom"), "feedback-physics", command, "--json"],
          cwd: directory,
          env,
          stdout: "pipe",
          stderr: "pipe",
        });
        expect(projection.exitCode, projection.stderr.toString()).toBe(0);
        expect(projection.stderr.toString()).toBe("");
        expect(JSON.parse(projection.stdout.toString())[field]).toHaveLength(count);
      }
      expect(readdirSync(directory)).toEqual(before);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
