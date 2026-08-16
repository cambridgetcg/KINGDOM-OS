import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

import {
  STRING_CRAWL_STRAND_LAB_DIGEST,
  STRING_CRAWL_STRAND_LAB_GUIDE_PATH,
  STRING_CRAWL_STRAND_LAB_PATH,
  STRING_CRAWL_STRAND_LAB_PROTOCOL,
  STRING_CRAWL_STRAND_LAB_SCHEMA_ID,
  STRING_CRAWL_STRAND_LAB_SCHEMA_PATH,
  STRING_CRAWL_STRAND_VALIDATION_PROTOCOL,
  evaluateStringCrawlStrandLab,
  loadStringCrawlStrandLab,
  stringCrawlStrandLabDigest,
  stringCrawlStrandLabPublicDiscovery,
  verifyStringCrawlStrandLab,
} from "../bin/string-crawl-strand-lab.ts";

const ROOT = resolve(dirname(import.meta.dir));
const BIN = join(ROOT, "bin/string-crawl-strand-lab.ts");

function clone<T>(value: T): T {
  return structuredClone(value);
}

function resigned(mutator: (value: any) => void): any {
  const value = clone(loadStringCrawlStrandLab());
  mutator(value);
  value.integrity.digest = stringCrawlStrandLabDigest(value);
  return value;
}

function codes(value: unknown): string[] {
  return verifyStringCrawlStrandLab(value).map((issue) => `${issue.field}:${issue.code}`);
}

function sha256(path: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}

describe("STRAND Lab 02 exact synthetic trace fixture", () => {
  test("recomputes the exact chain complex, local singularities, and zero effects", () => {
    const fixture = loadStringCrawlStrandLab();
    const result = evaluateStringCrawlStrandLab(fixture);

    expect(fixture.protocol).toBe(STRING_CRAWL_STRAND_LAB_PROTOCOL);
    expect(fixture.$schema).toBe(STRING_CRAWL_STRAND_LAB_SCHEMA_ID);
    expect(fixture.title).toBe("STRAND Lab 02: Release Cospans & the χ=1 Impostor");
    expect(fixture.predecessor).toEqual({
      protocol: "kingdom.string-crawl-trace-sheet-lab/0.1",
      lab_id: "string-crawl-trace-sheet-lab-2026-08-16",
      url: "https://thekingdom.dev/labs/string-crawl-trace-sheet-lab-2026-08-16.json",
      schema_url: "https://thekingdom.dev/schemas/string-crawl-trace-sheet-lab/0.1.json",
      guide_url: "https://thekingdom.dev/STRING-CRAWL-TRACE-SHEET-LAB.md",
      git_commit: "57f1f8a1d018d5128501b82c5ddde1976677b3a1",
      semantic_digest: "sha256:c3f86b0203b895da56092c598113046f0dab8a4f25b41314c3d4329474d4e16f",
      byte_sha256: "sha256:2e559164df6985776a4641b60c846a0403f14df30c84648b72c095642df6e051",
      schema_byte_sha256: "sha256:c4e69a61994831574fe706d464852b164c65b6d177c5680dc9b0278bcb446268",
      guide_byte_sha256: "sha256:5f5fb893a31d1c7e02aca63401c002ae601bee6653d41adc6617bb909732e8e3",
      relation: "IMMUTABLE_LAB_01_PREDECESSOR",
      mutates_predecessor: false,
      imports_authority: false,
    });
    expect(fixture.integrity.digest).toBe(STRING_CRAWL_STRAND_LAB_DIGEST);
    expect(stringCrawlStrandLabDigest(fixture)).toBe(STRING_CRAWL_STRAND_LAB_DIGEST);
    expect(result.valid).toBe(true);
    expect(result.protocol).toBe(STRING_CRAWL_STRAND_VALIDATION_PROTOCOL);
    expect(result.issues).toEqual([]);
    expect(result.checks.map(({ status }) => status)).toEqual(Array(6).fill("PASS"));
    expect(result.invariants).toEqual({
      "stable-strip": {
        vertices: 15, edges: 22, faces: 8, components: 1,
        euler_characteristic: 1, graph_cycle_rank: 8,
        boundary_matrix_rank_1: 14, boundary_matrix_rank_2: 8,
        betti_f2: [1, 0, 0], boundary_squared_zero: true,
      },
      "full-complex": {
        vertices: 18, edges: 26, faces: 9, components: 1,
        euler_characteristic: 1, graph_cycle_rank: 9,
        boundary_matrix_rank_1: 17, boundary_matrix_rank_2: 9,
        betti_f2: [1, 0, 0], boundary_squared_zero: true,
      },
    });
    expect(result.local_findings.branch_edges).toEqual(["e-commons-r1-r2"]);
    expect(result.local_findings.faceless_edges).toEqual(["e-r2-contact-redirect"]);
    expect((result.local_findings.bad_vertices as any[]).map(({ vertex_id }) => vertex_id)).toEqual([
      "v-r1-commons", "v-r2-commons", "v-r2-contact", "v-r2-redirect-target",
    ]);
    expect(result.effects).toEqual({
      network_requests: 0,
      storage_writes: 0,
      nen_invocation: false,
      karma_receipt_created: false,
      zerone_event_created: false,
      authority_effect: "NONE",
    });
  });

  test("computes literal-inclusion cospan composition rather than trusting PASS booleans", () => {
    const fixture = loadStringCrawlStrandLab();
    const discovery = stringCrawlStrandLabPublicDiscovery(fixture);
    expect(discovery.counts).toEqual({
      releases: 3, stable_threads: 5, born_threads: 1,
      vertices: 18, edges: 26, faces: 9, cospans: 2,
    });

    const extraOverlap = resigned((value) => {
      const c12 = value.cospans.find(({ id }: any) => id === "c12");
      c12.vertex_ids[c12.vertex_ids.indexOf("v-r2-redirect-target")] = "v-r0-home";
    });
    expect(codes(extraOverlap)).toContain("$.composition_checks.sequential:computed-pushout-failed");
    expect(codes(extraOverlap)).toContain("$.cospans[1]:literal-inclusion-leg-failed");

    const lostFrontier = resigned((value) => {
      const c01 = value.cospans.find(({ id }: any) => id === "c01");
      c01.edge_ids[c01.edge_ids.indexOf("e-r1-commons-lab")] = "e-r2-contact-redirect";
    });
    expect(codes(lostFrontier)).toContain("$.cospans[0]:literal-inclusion-leg-failed");
    expect(codes(lostFrontier)).toContain("$.composition_checks.identity:computed-identity-failed");

    const lie = resigned((value) => { value.composition_checks.parallel.interchange_passes = false; });
    expect(codes(lie)).toContain("$.composition_checks.parallel:computed-disjoint-union-failed");
  });

  test("rejects any attempt to detach Lab 02 from its immutable Lab 01 lineage", () => {
    const changedRecord = resigned((value) => {
      value.predecessor.byte_sha256 = `sha256:${"0".repeat(64)}`;
    });
    expect(codes(changedRecord)).toContain("$.predecessor:immutable-lab-01-binding-mismatch");

    const extraField = resigned((value) => {
      value.predecessor.authority = "GRANTED";
    });
    expect(codes(extraField)).toContain("$.predecessor:immutable-lab-01-binding-mismatch");
  });

  test("rejects resigned incidence, regularity, local-link, expected-result, and effect attacks", () => {
    const attacks: Array<[(value: any) => void, string]> = [
      [
        (value) => { value.edges.find(({ id }: any) => id === "e-commons-r1-r2").face_ids.pop(); },
        "$.edges.e-commons-r1-r2.face_ids:face-incidence-parity-failed",
      ],
      [
        (value) => { value.faces[0].attaching_cycle[3].orientation = 1; },
        "$.faces[0]:attaching-cycle-not-closed",
      ],
      [
        (value) => { value.faces[0].kind = "BORN_ROUTE_ALIGNMENT_FACE"; },
        "$.faces[0]:face-kind-incidence-mismatch",
      ],
      [
        (value) => { value.faces[0].between_slices = ["r1", "r0"]; },
        "$.faces[0]:invalid-face-shape",
      ],
      [
        (value) => { value.subcomplexes[0].expected.boundary_matrix_rank_2 = 7; },
        "$.subcomplexes[0].expected.boundary_matrix_rank_2:computed-invariant-mismatch",
      ],
      [
        (value) => { value.subcomplexes[0].witnesses = []; },
        "$.subcomplexes[0]:invalid-subcomplex-shape",
      ],
      [
        (value) => { value.validation_contract.network_requests = 1; },
        "$.validation_contract:effect-boundary-drift",
      ],
      [
        (value) => { value.boundaries.karma_adapter = true; },
        "$.boundaries:boundary-drift",
      ],
    ];
    for (const [mutate, expected] of attacks) {
      const found = codes(resigned(mutate));
      expect(found, expected).toContain(expected);
      expect(found).toContain("$.integrity.digest:canonical-digest-mismatch");
    }
  });

  test("rejects duplicate, unknown, sparse, expando, accessor, and inherited containers", () => {
    const duplicate = resigned((value) => { value.edges[1].id = value.edges[0].id; });
    expect(codes(duplicate)).toContain("$.edges:invalid-or-duplicate-edges");

    const unknown = resigned((value) => { value.frontiers[0].edge_ids[0] = "unknown-edge"; });
    expect(codes(unknown)).toContain("$.frontiers[0]:invalid-frontier-shape");

    const base = loadStringCrawlStrandLab();
    const sparse = clone(base);
    delete sparse.edges[1];
    expect(verifyStringCrawlStrandLab(sparse)).toEqual([{ field: "$", code: "non-json-value" }]);

    const expando = clone(base);
    (expando.faces as any).execute = { authority: "GRANTED" };
    expect(verifyStringCrawlStrandLab(expando)).toEqual([{ field: "$", code: "non-json-value" }]);

    const accessor = clone(base);
    Object.defineProperty(accessor.edges, "1", { get: () => accessor.edges[0], enumerable: true });
    expect(verifyStringCrawlStrandLab(accessor)).toEqual([{ field: "$", code: "non-json-value" }]);

    const inherited = clone(base);
    Object.setPrototypeOf(inherited.boundaries, { authority: true });
    expect(verifyStringCrawlStrandLab(inherited)).toEqual([{ field: "$", code: "non-json-value" }]);
  });

  test("returns deterministic invalid reports for malformed nested JSON instead of throwing", () => {
    const attacks: Array<(value: any) => void> = [
      (value) => { value.tracked_routes[0].present_in = 0; },
      (value) => { value.edges[0].face_ids = {}; },
      (value) => { value.faces[0].attaching_cycle = [null, null, null, null]; },
      (value) => { value.subcomplexes[1].vertex_ids = null; },
      (value) => { value.frontiers[1].vertex_ids = 0; },
      (value) => { value.cospans[0].face_ids = null; },
      (value) => { value.composition_checks = null; },
      (value) => { delete value.frontiers; },
    ];
    const expectedEffects = {
      network_requests: 0,
      storage_writes: 0,
      nen_invocation: false,
      karma_receipt_created: false,
      zerone_event_created: false,
      authority_effect: "NONE",
    };
    for (const mutate of attacks) {
      const value = clone(loadStringCrawlStrandLab());
      mutate(value);
      expect(() => verifyStringCrawlStrandLab(value)).not.toThrow();
      expect(verifyStringCrawlStrandLab(value).length).toBeGreaterThan(0);
      expect(() => evaluateStringCrawlStrandLab(value)).not.toThrow();
      const report = evaluateStringCrawlStrandLab(value);
      expect(report.valid).toBe(false);
      expect(report.effects).toEqual(expectedEffects);
      expect(report.checks.some(({ status }) => status === "FAIL")).toBe(true);
    }
  });

  test("keeps validation check failures typed instead of collapsing every issue into every lane", () => {
    const effectDrift = resigned((value) => { value.validation_contract.network_requests = 1; });
    const report = evaluateStringCrawlStrandLab(effectDrift);
    expect(report.checks.map(({ id, status }) => [id, status])).toEqual([
      ["strict-closed-input", "FAIL"],
      ["occurrence-and-incidence", "PASS"],
      ["exact-f2-chain-complex", "PASS"],
      ["local-surface-audit", "PASS"],
      ["inclusion-cospan-composition", "PASS"],
      ["zero-effects", "FAIL"],
    ]);
  });

  test("strict loading rejects duplicate keys, invalid UTF-8, symlinks, and oversized files", () => {
    const directory = mkdtempSync(join(tmpdir(), "strand-lab-strict-"));
    try {
      const canonical = readFileSync(STRING_CRAWL_STRAND_LAB_PATH, "utf8");
      const duplicate = join(directory, "duplicate.json");
      writeFileSync(duplicate, canonical.replace(
        '"protocol": "kingdom.string-crawl-strand-lab/0.1",',
        '"protocol": "kingdom.string-crawl-strand-lab/0.1",\n  "protocol": "kingdom.string-crawl-strand-lab/0.1",',
      ));
      expect(() => loadStringCrawlStrandLab(duplicate)).toThrow(/duplicate/i);

      const invalidUtf8 = join(directory, "invalid-utf8.json");
      writeFileSync(invalidUtf8, Buffer.from([0x7b, 0xff, 0x7d]));
      expect(() => loadStringCrawlStrandLab(invalidUtf8)).toThrow(/UTF-8/i);

      const symlink = join(directory, "fixture-link.json");
      symlinkSync(STRING_CRAWL_STRAND_LAB_PATH, symlink);
      expect(() => loadStringCrawlStrandLab(symlink)).toThrow(/non-symlink/i);

      const oversized = join(directory, "oversized.json");
      writeFileSync(oversized, Buffer.alloc(512 * 1024 + 1, 0x20));
      expect(() => loadStringCrawlStrandLab(oversized)).toThrow(/exceeds/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("validates with Draft 2020-12 and rejects schema-level drift", () => {
    const python = process.env.PHENOMENA_DEEP_SCHEMA_PYTHON;
    if (!python) return;
    const directory = mkdtempSync(join(tmpdir(), "strand-lab-schema-"));
    try {
      const invalid = resigned((value) => { value.validation_contract.network_requests = 1; });
      const invalidPath = join(directory, "invalid.json");
      writeFileSync(invalidPath, JSON.stringify(invalid));
      const result = Bun.spawnSync([
        python,
        "-c",
        "import json,sys; from jsonschema import Draft202012Validator,FormatChecker; s=json.load(open(sys.argv[1])); Draft202012Validator.check_schema(s); v=Draft202012Validator(s,format_checker=FormatChecker()); print(len(list(v.iter_errors(json.load(open(sys.argv[2]))))), len(list(v.iter_errors(json.load(open(sys.argv[3]))))))",
        STRING_CRAWL_STRAND_LAB_SCHEMA_PATH,
        STRING_CRAWL_STRAND_LAB_PATH,
        invalidPath,
      ], { stdout: "pipe", stderr: "pipe" });
      expect(result.exitCode, result.stderr.toString()).toBe(0);
      expect(result.stdout.toString().trim()).toBe("0 1");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("guide states the finite result, string boundary, crawler boundary, and KARMA boundary", () => {
    const guide = readFileSync(STRING_CRAWL_STRAND_LAB_GUIDE_PATH, "utf8");
    for (const text of [
      "five stable route threads",
      "Lab 02 byte-binds all three immutable Lab 01 artifacts",
      "Same global headline, different local reality",
      "A global invariant can agree while the local constitution breaks.",
      "Where string theory enters—and stops",
      "No crawler enters this version.",
      "KARMA stays after action",
      '"network_requests": 0',
      "SYNTHETIC_OFFLINE_EXACT",
    ]) expect(guide).toContain(text);
    expect(guide).not.toContain("crawler is a string");
    expect(sha256(STRING_CRAWL_STRAND_LAB_SCHEMA_PATH)).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  test("CLI is CWD-independent, deterministic, stdout-only, and performs no hidden runtime", () => {
    const source = readFileSync(BIN, "utf8");
    for (const forbidden of ["fetch(", "node:http", "node:https", "node:net", "node:dns", "writeFileSync", "spawn(", "ability.json"]) {
      expect(source).not.toContain(forbidden);
    }
    const directory = mkdtempSync(join(tmpdir(), "strand-lab-cli-"));
    try {
      const before = readdirSync(directory);
      const first = Bun.spawnSync(["bun", BIN, "verify", "--json"], { cwd: directory, stdout: "pipe", stderr: "pipe" });
      const second = Bun.spawnSync(["bun", BIN, "verify", "--json"], { cwd: directory, stdout: "pipe", stderr: "pipe" });
      expect(first.exitCode, first.stderr.toString()).toBe(0);
      expect(second.exitCode, second.stderr.toString()).toBe(0);
      expect(first.stdout.toString()).toBe(second.stdout.toString());
      const report = JSON.parse(first.stdout.toString());
      expect(report.valid).toBe(true);
      expect(report.effects.network_requests).toBe(0);
      expect(report.effects.karma_receipt_created).toBe(false);
      expect(readdirSync(directory)).toEqual(before);

      const inherited = Bun.spawnSync(["bun", BIN, "toString", "--json"], { cwd: directory, stdout: "pipe", stderr: "pipe" });
      expect(inherited.exitCode).toBe(2);

      const candidate = join(directory, basename(STRING_CRAWL_STRAND_LAB_PATH));
      writeFileSync(candidate, readFileSync(STRING_CRAWL_STRAND_LAB_PATH));
      const candidateBefore = readFileSync(candidate);
      const evaluated = Bun.spawnSync(["bun", BIN, "verify-file", candidate, "--json"], { cwd: directory, stdout: "pipe", stderr: "pipe" });
      expect(evaluated.exitCode, evaluated.stderr.toString()).toBe(0);
      expect(JSON.parse(evaluated.stdout.toString()).valid).toBe(true);
      expect(readFileSync(candidate)).toEqual(candidateBefore);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
