import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  CONFORMATIONAL_FEEDBACK_DIGEST,
  CONFORMATIONAL_FEEDBACK_PATH,
  CONFORMATIONAL_FEEDBACK_SCHEMA_PATH,
  conformationalFeedbackDigest,
  conformationalFeedbackPublicDiscovery,
  loadConformationalFeedbackAtlas,
  verifyConformationalFeedbackAtlas,
} from "../bin/conformational-feedback.ts";

function clone(): Record<string, any> {
  return structuredClone(loadConformationalFeedbackAtlas());
}

function resign(value: Record<string, any>): Record<string, any> {
  value.integrity.digest = conformationalFeedbackDigest(value);
  return value;
}

function codes(value: unknown): string[] {
  return verifyConformationalFeedbackAtlas(value).map((issue) => issue.code);
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
      CONFORMATIONAL_FEEDBACK_SCHEMA_PATH,
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

describe("Conformational Feedback Atlas", () => {
  test("loads one reviewed, digest-bound, authority-negative atlas", () => {
    const atlas = loadConformationalFeedbackAtlas();
    expect(verifyConformationalFeedbackAtlas(atlas)).toEqual([]);
    expect(atlas.integrity.digest).toBe(CONFORMATIONAL_FEEDBACK_DIGEST);
    expect(atlas.integrity.digest).toBe(conformationalFeedbackDigest(atlas));
    expect(atlas.registers).toHaveLength(3);
    expect(atlas.geometries).toHaveLength(5);
    expect(atlas.translations).toHaveLength(3);
    expect(atlas.feedback_path.stages).toHaveLength(4);
    expect(atlas.sources).toHaveLength(11);
  });

  test("pins the existing Kingdom and Zerone public bytes without importing authority", () => {
    const atlas = loadConformationalFeedbackAtlas();
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
    const atlas = loadConformationalFeedbackAtlas();
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
    boundSource.sources[9].url = "https://example.com/not-the-bound-karma-record.json";
    expect(codes(resign(boundSource))).toContain("bound-source-url-mismatch");
  });

  test("strict parsing rejects duplicate JSON keys", () => {
    const directory = mkdtempSync(join(tmpdir(), "kingdom-feedback-duplicate."));
    const path = join(directory, "duplicate.json");
    try {
      const source = readFileSync(CONFORMATIONAL_FEEDBACK_PATH, "utf8");
      writeFileSync(path, source.replace('"protocol":', '"title":"duplicate",\n  "protocol":'));
      expect(() => loadConformationalFeedbackAtlas(path)).toThrow("duplicate key");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("refuses invalid UTF-8, symlinks, and oversized atlas input", () => {
    const directory = mkdtempSync(join(tmpdir(), "kingdom-feedback-input."));
    try {
      const invalidUtf8 = join(directory, "invalid-utf8.json");
      writeFileSync(invalidUtf8, Buffer.from([0x7b, 0x22, 0xc3, 0x28, 0x22, 0x3a, 0x31, 0x7d]));
      expect(() => loadConformationalFeedbackAtlas(invalidUtf8)).toThrow("valid UTF-8");

      const link = join(directory, "atlas-link.json");
      symlinkSync(CONFORMATIONAL_FEEDBACK_PATH, link);
      expect(() => loadConformationalFeedbackAtlas(link)).toThrow("regular file");

      const oversized = join(directory, "oversized.json");
      writeFileSync(oversized, Buffer.alloc(384 * 1024 + 1, 0x20));
      expect(() => loadConformationalFeedbackAtlas(oversized)).toThrow("exceeds 393216 bytes");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("projects a small public discovery record with only negative effects", () => {
    expect(conformationalFeedbackPublicDiscovery()).toMatchObject({
      atlas_id: "form-feedback-consequence-2026-08-12",
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
  });

  test("validates the reviewed atlas against the closed Draft 2020-12 schema", () => {
    const result = validateWithPython([CONFORMATIONAL_FEEDBACK_PATH]);
    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.counts).toEqual([0]);
    const schema = JSON.parse(readFileSync(CONFORMATIONAL_FEEDBACK_SCHEMA_PATH, "utf8"));
    expect(schema.$id).toBe("urn:kingdom:schema:conformational-feedback-atlas:0.1");
    expect(schema.properties.integrity.properties.digest.const).toBe(CONFORMATIONAL_FEEDBACK_DIGEST);
    expect(schema.$comment).toContain("cannot recompute");
  });

  test("portable schema rejects reordered registers, binding drift, missing KARMA walls, and stage drift", () => {
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

  test("kingdom feedback is network-free and leaves another working directory unchanged", () => {
    const directory = mkdtempSync(join(tmpdir(), "kingdom-feedback-cli."));
    const root = dirname(dirname(dirname(CONFORMATIONAL_FEEDBACK_PATH)));
    try {
      const before = readdirSync(directory);
      const result = Bun.spawnSync({
        cmd: [join(root, "kingdom"), "feedback", "verify", "--json"],
        cwd: directory,
        env: { ...process.env, LC_ALL: "C", LANG: "C" },
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(result.exitCode, result.stderr.toString()).toBe(0);
      expect(result.stderr.toString()).toBe("");
      expect(JSON.parse(result.stdout.toString())).toEqual({ valid: true, issues: [] });
      expect(readdirSync(directory)).toEqual(before);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
