import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  STRAND_DESCENT_LAB_BYTE_SHA256,
  STRAND_DESCENT_LAB_DIGEST,
  STRAND_DESCENT_LAB_GUIDE_BYTE_SHA256,
  STRAND_DESCENT_LAB_GUIDE_PATH,
  STRAND_DESCENT_LAB_PATH,
  STRAND_DESCENT_LAB_SCHEMA_BYTE_SHA256,
  STRAND_DESCENT_LAB_SCHEMA_PATH,
  STRAND_DESCENT_LAB_URL,
  evaluateStrandDescentLab,
  loadStrandDescentLab,
  strandDescentLabDigest,
  strandDescentLabPublicDiscovery,
  verifyStrandDescentLab,
} from "../bin/strand-descent-lab.ts";
import {
  STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_DIGEST,
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_ID,
  STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256,
  STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL,
  STRING_CRAWL_FREQUENCY_FORM_LAB_URL,
} from "../bin/string-crawl-frequency-form-lab.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const clone = <T>(value: T): T => structuredClone(value);
const sha256 = (path: string) => `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
const codes = (value: unknown) => verifyStrandDescentLab(value).map(({ code }) => code);
const resigned = (mutate: (value: any) => void) => {
  const value = clone(loadStrandDescentLab());
  mutate(value);
  value.integrity.digest = strandDescentLabDigest(value);
  return value;
};

describe("STRAND Lab 04 exact local-to-global evaluator", () => {
  test("recomputes the coherent atlas, quotient, refinement, and pairwise impostor", () => {
    const fixture = loadStrandDescentLab();
    const report = evaluateStrandDescentLab(fixture);
    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
    expect(report.checks).toHaveLength(6);
    expect(report.checks.every(({ status }) => status === "PASS")).toBe(true);
    expect(report.results).toMatchObject({
      pairwise_invertibility: {
        transition_count: 6,
        all_bijective: true,
        all_inverse_witnesses: true,
      },
      triple_coherence: { all_coherent: true },
      four_chart_associativity: { parenthesizations_equal: true, direct_match: true },
      global_quotient: {
        class_count: 3,
        class_sizes: [4, 4, 4],
        all_local_points_covered: true,
      },
      common_refinement: {
        atom_count: 6,
        projections_per_atom: 4,
        transition_squares_checked: 36,
        transition_squares_commute: true,
        quotient_fiber_sizes: [2, 2, 2],
      },
      pairwise_impostor: {
        pairwise_bijective: true,
        triple_coherent: false,
        conflict_result: "UNRESOLVED",
        automatic_resolution: false,
      },
    });
    expect(report.results.triple_coherence.equations).toHaveLength(2);
    expect(report.results.triple_coherence.equations.every(({ coherent }: any) => coherent)).toBe(true);
  });

  test("binds semantic and authored byte identities", () => {
    const fixture = loadStrandDescentLab();
    expect(strandDescentLabDigest(fixture)).toBe(STRAND_DESCENT_LAB_DIGEST);
    expect(fixture.integrity.digest).toBe(STRAND_DESCENT_LAB_DIGEST);
    expect(sha256(STRAND_DESCENT_LAB_PATH)).toBe(STRAND_DESCENT_LAB_BYTE_SHA256);
    expect(sha256(STRAND_DESCENT_LAB_SCHEMA_PATH)).toBe(STRAND_DESCENT_LAB_SCHEMA_BYTE_SHA256);
    expect(sha256(STRAND_DESCENT_LAB_GUIDE_PATH)).toBe(STRAND_DESCENT_LAB_GUIDE_BYTE_SHA256);
    expect(fixture.predecessor).toEqual({
      protocol: STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL,
      lab_id: STRING_CRAWL_FREQUENCY_FORM_LAB_ID,
      url: STRING_CRAWL_FREQUENCY_FORM_LAB_URL,
      schema_url: STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL,
      guide_url: STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL,
      git_commit: "d2452d4500c274237097e142609422ebbab7f68d",
      semantic_digest: STRING_CRAWL_FREQUENCY_FORM_LAB_DIGEST,
      raw_byte_sha256: STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256,
      schema_byte_sha256: STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256,
      guide_byte_sha256: STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256,
      relation: "IMMUTABLE_LAB_03_PREDECESSOR",
      mutates_predecessor: false,
      imports_authority: false,
    });
  });

  test("detects valid pairwise maps that fail triple or four-chart coherence", () => {
    const triple = resigned((value) => {
      const direct = value.transitions.find(({ id }: any) => id === "t-ac");
      direct.forward = [{ from: "a0", to: "c2" }, { from: "a1", to: "c1" }, { from: "a2", to: "c0" }];
      direct.inverse_witness = [{ from: "c0", to: "a2" }, { from: "c1", to: "a1" }, { from: "c2", to: "a0" }];
      value.coherence_checks.triple_equations[0].expected_composite = clone(direct.forward);
    });
    expect(codes(triple)).toContain("triple-coherence-failed");

    const four = resigned((value) => {
      const direct = value.transitions.find(({ id }: any) => id === "t-ad");
      direct.forward = [{ from: "a0", to: "d0" }, { from: "a1", to: "d1" }, { from: "a2", to: "d2" }];
      direct.inverse_witness = [{ from: "d0", to: "a0" }, { from: "d1", to: "a1" }, { from: "d2", to: "a2" }];
      value.coherence_checks.four_chart_associativity.expected_composite = clone(direct.forward);
    });
    expect(codes(four)).toContain("four-chart-associativity-failed");
  });

  test("detects inverse, quotient, refinement, and impostor drift independently", () => {
    expect(codes(resigned((value) => {
      value.transitions[0].inverse_witness[0].to = "a0";
    }))).toContain("not-a-bijection-with-exact-inverse");

    expect(codes(resigned((value) => {
      value.global_quotient.expected_classes[0].members[0] = "a1";
    }))).toContain("computed-quotient-mismatch");

    expect(codes(resigned((value) => {
      value.common_refinement.atoms[0].projections[1].point_id = "b0";
    }))).toContain("computed-common-refinement-mismatch");

    expect(codes(resigned((value) => {
      const direct = value.pairwise_impostor.transitions.find(({ id }: any) => id === "i-ac");
      direct.forward = clone(value.coherence_checks.triple_equations[0].expected_composite);
      direct.inverse_witness = [{ from: "c0", to: "a2" }, { from: "c1", to: "a0" }, { from: "c2", to: "a1" }];
    }))).toContain("pairwise-impostor-lost");
  });

  test("rejects effect and authority expansion even after a matching semantic resign", () => {
    expect(codes(resigned((value) => { value.validation_contract.network_requests = 1; })))
      .toContain("effect-boundary-drift");
    expect(codes(resigned((value) => { value.boundaries.truth_claim = true; })))
      .toContain("boundary-drift");
    expect(codes(resigned((value) => { value.research_sources[0].scientific_claim_imported = true; })))
      .toContain("source-binding-drift");
  });

  test("rejects unknown, sparse, accessor, inherited, cyclic, and non-finite input", () => {
    const unknown = clone(loadStrandDescentLab());
    (unknown as any).execute = true;
    expect(codes(unknown)).toContain("unexpected-or-missing-field");

    const sparse = clone(loadStrandDescentLab());
    delete sparse.transitions[1];
    expect(verifyStrandDescentLab(sparse)).toEqual([{ field: "$", code: "non-json-value" }]);

    const accessor = clone(loadStrandDescentLab());
    Object.defineProperty(accessor.charts, "1", { get: () => accessor.charts[0], enumerable: true });
    expect(verifyStrandDescentLab(accessor)).toEqual([{ field: "$", code: "non-json-value" }]);

    const inherited = clone(loadStrandDescentLab());
    Object.setPrototypeOf(inherited.boundaries, { authority: true });
    expect(verifyStrandDescentLab(inherited)).toEqual([{ field: "$", code: "non-json-value" }]);

    const cyclic: any = clone(loadStrandDescentLab());
    cyclic.loop = cyclic;
    expect(verifyStrandDescentLab(cyclic)).toEqual([{ field: "$", code: "non-json-value" }]);

    const nonFinite = clone(loadStrandDescentLab());
    nonFinite.common_refinement.expected.atom_count = Infinity;
    expect(verifyStrandDescentLab(nonFinite)).toEqual([{ field: "$", code: "non-json-value" }]);
  });

  test("returns a deterministic invalid report for malformed but JSON-safe input", () => {
    const malformed = {
      charts: [],
      transitions: [],
      coherence_checks: { triple_equations: [], four_chart_associativity: {} },
      global_quotient: {
        expected_classes: [],
        expected_class_count: 0,
        expected_class_sizes: 1,
        expected_all_local_points_covered: true,
      },
      common_refinement: { atoms: [], expected: {} },
      pairwise_impostor: { transitions: [] },
    };
    expect(evaluateStrandDescentLab(malformed)).toMatchObject({
      valid: false,
      results: {},
      issues: [{ field: "$", code: "malformed-structure" }],
      effects: { network_requests: 0, storage_writes: 0, authority_effect: "NONE" },
    });
  });

  test("uses a valid Draft 2020-12 schema that accepts only the exact Lab 04 record", () => {
    const probe = Bun.spawnSync({
      cmd: ["python3", "-c", "import jsonschema"],
      stdout: "pipe",
      stderr: "pipe",
    });
    if (probe.exitCode !== 0) return;

    const canonical = loadStrandDescentLab();
    const incoherent = clone(canonical);
    const direct = incoherent.transitions.find(({ id }: any) => id === "t-ac");
    direct.forward = [{ from: "a0", to: "c2" }, { from: "a1", to: "c1" }, { from: "a2", to: "c0" }];
    direct.inverse_witness = [{ from: "c0", to: "a2" }, { from: "c1", to: "a1" }, { from: "c2", to: "a0" }];

    const duplicateId = clone(canonical);
    duplicateId.transitions[1].id = "t-ab";

    const result = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        [
          "import json,sys",
          "from jsonschema import Draft202012Validator,FormatChecker",
          "schema=json.load(open(sys.argv[1],encoding='utf-8'))",
          "Draft202012Validator.check_schema(schema)",
          "validator=Draft202012Validator(schema,format_checker=FormatChecker())",
          "print(json.dumps([validator.is_valid(value) for value in json.load(sys.stdin)]))",
        ].join(";"),
        STRAND_DESCENT_LAB_SCHEMA_PATH,
      ],
      stdin: Buffer.from(JSON.stringify([canonical, incoherent, duplicateId])),
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode, result.stderr.toString()).toBe(0);
    expect(JSON.parse(result.stdout.toString())).toEqual([true, false, false]);
  });

  test("projects one compact zero-effect public discovery record", () => {
    const discovery = strandDescentLabPublicDiscovery(loadStrandDescentLab());
    expect(discovery).toMatchObject({
      protocol: "kingdom.strand-descent-lab/0.1",
      lab_id: "strand-descent-lab-04-2026-08-16",
      url: STRAND_DESCENT_LAB_URL,
      counts: {
        research_sources: 2,
        charts: 4,
        transitions: 6,
        triple_equations: 2,
        quotient_classes: 3,
        refinement_atoms: 6,
        impostor_transitions: 3,
      },
      validation: { valid: true },
      effects: {
        network_requests: 0,
        storage_writes: 0,
        crawler_invocation: false,
        nen_invocation: false,
        karma_receipt_created: false,
        person_or_content_score_created: false,
        authority_effect: "NONE",
      },
    });
    for (const key of ["crawler", "credential", "score", "authority", "consent", "write", "execute", "deploy"]) {
      expect(discovery).not.toHaveProperty(key);
    }
  });

  test("dispatches through the offline Kingdom command", () => {
    const verify = Bun.spawnSync([join(ROOT, "kingdom"), "strand-descent-lab", "verify", "--json"], { cwd: ROOT });
    expect(verify.exitCode).toBe(0);
    expect(JSON.parse(verify.stdout.toString())).toMatchObject({ valid: true, issues: [] });

    const impostor = Bun.spawnSync([join(ROOT, "kingdom"), "strand-descent-lab", "impostor", "--json"], { cwd: ROOT });
    expect(impostor.exitCode).toBe(0);
    expect(JSON.parse(impostor.stdout.toString()).evaluated).toMatchObject({
      pairwise_bijective: true,
      triple_coherent: false,
      conflict_result: "UNRESOLVED",
    });

    const unknown = Bun.spawnSync([join(ROOT, "kingdom"), "strand-descent-lab", "wake"], { cwd: ROOT });
    expect(unknown.exitCode).toBe(2);
  });
});
