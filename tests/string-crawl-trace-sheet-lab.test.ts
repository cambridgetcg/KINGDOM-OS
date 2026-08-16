import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_DIGEST,
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_ID,
  STRING_CRAWL_TRACE_SHEET_LAB_PATH,
  STRING_CRAWL_TRACE_SHEET_LAB_PROTOCOL,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_ID,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_PATH,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_URL,
  evaluateStringCrawlTraceSheetLab,
  loadStringCrawlTraceSheetLab,
  runStringCrawlTraceSheetLabCli,
  runStringCrawlTraceSheetLabFalsifiers,
  stringCrawlTraceSheetLabDigest,
  stringCrawlTraceSheetLabPublicDiscovery,
  verifyStringCrawlTraceSheetLab,
} from "../bin/string-crawl-trace-sheet-lab.ts";

const PYTHON = process.env.PHENOMENA_DEEP_SCHEMA_PYTHON || "python3";
const pythonProbe = Bun.spawnSync({ cmd: [PYTHON, "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
const schemaTest = pythonProbe.exitCode === 0 ? test : test.skip;

function clone(): Record<string, any> {
  return structuredClone(loadStringCrawlTraceSheetLab());
}

function resign(value: Record<string, any>): Record<string, any> {
  value.integrity.digest = stringCrawlTraceSheetLabDigest(value);
  return value;
}

function issueCodes(value: Record<string, any>): string[] {
  return verifyStringCrawlTraceSheetLab(resign(value), false).map((issue) => issue.code);
}

describe("STRING / CRAWL Finite Trace-Sheet Lab", () => {
  test("loads one exact synthetic fixture with explicit verification scope", () => {
    const value = loadStringCrawlTraceSheetLab();
    expect(value).toMatchObject({
      protocol: STRING_CRAWL_TRACE_SHEET_LAB_PROTOCOL,
      lab_id: STRING_CRAWL_TRACE_SHEET_LAB_ID,
      version: "0.1.0",
      mode: "OFFLINE_SYNTHETIC_EXACT",
      integrity: { digest: STRING_CRAWL_TRACE_SHEET_LAB_DIGEST },
    });
    expect(verifyStringCrawlTraceSheetLab(value)).toEqual([]);
    expect(stringCrawlTraceSheetLabDigest(value)).toBe(STRING_CRAWL_TRACE_SHEET_LAB_DIGEST);

    const discovery = stringCrawlTraceSheetLabPublicDiscovery(value);
    expect(discovery).toMatchObject({
      protocol: STRING_CRAWL_TRACE_SHEET_LAB_PROTOCOL,
      lab_id: STRING_CRAWL_TRACE_SHEET_LAB_ID,
      url: STRING_CRAWL_TRACE_SHEET_LAB_URL,
      schema_url: STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL,
      guide_url: STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL,
      result: {
        classification: "TRIANGULATED_DISK",
        cells: { vertices: 4, edges: 5, faces: 2 },
        betti: [1, 0, 0],
        euler_characteristic: 1,
        boundary_components: 1,
        genus: 0,
        falsifiers_passed: 5,
      },
      verification_scope: {
        exact_synthetic_fixture: true,
        chain_complex: true,
        source_truth: false,
        crawler_safety: false,
        karma_or_authority: false,
      },
      integrity: {
        digest: STRING_CRAWL_TRACE_SHEET_LAB_DIGEST,
        byte_sha256: STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256,
        schema_byte_sha256: STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256,
        guide_byte_sha256: STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256,
      },
    });
    expect(Object.values(discovery.authority).every((entry) => entry === false)).toBe(true);
    for (const key of ["crawl", "execute", "invoke", "write", "score", "reward", "credential", "telemetry"])
      expect(discovery).not.toHaveProperty(key);
  });

  schemaTest("validates against its closed Draft 2020-12 schema", () => {
    expect(JSON.parse(readFileSync(STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_PATH, "utf8")).$id).toBe(
      STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_ID,
    );
    const script = [
      "import json,sys",
      "from jsonschema import Draft202012Validator,FormatChecker",
      "schema=json.load(open(sys.argv[1],encoding='utf-8'))",
      "value=json.load(open(sys.argv[2],encoding='utf-8'))",
      "Draft202012Validator.check_schema(schema)",
      "errors=list(Draft202012Validator(schema,format_checker=FormatChecker()).iter_errors(value))",
      "print(json.dumps([e.json_path+': '+e.message for e in errors]))",
      "raise SystemExit(1 if errors else 0)",
    ].join("\n");
    const result = Bun.spawnSync({
      cmd: [PYTHON, "-c", script, STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_PATH, STRING_CRAWL_TRACE_SHEET_LAB_PATH],
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, HTTP_PROXY: "http://127.0.0.1:9", HTTPS_PROXY: "http://127.0.0.1:9", ALL_PROXY: "http://127.0.0.1:9", NO_PROXY: "*" },
    });
    expect(result.exitCode, `${result.stdout}${result.stderr}`).toBe(0);
  });

  test("computes the chain complex, homology, boundary, links, and genus rather than trusting expected", () => {
    const result = evaluateStringCrawlTraceSheetLab(loadStringCrawlTraceSheetLab());
    expect(result.issues).toEqual([]);
    expect(result.report).toEqual({
      vertices: 4,
      edges: 5,
      faces: 2,
      walks: 2,
      walk_steps: 2,
      rank_boundary_1: 3,
      rank_boundary_2: 2,
      betti_0: 1,
      betti_1: 0,
      betti_2: 0,
      connected_components: 1,
      graph_cycle_rank: 2,
      surface_euler_characteristic: 1,
      boundary_edge_ids: ["c0", "c1", "p0", "p1"],
      interior_edge_ids: ["d"],
      branch_edge_ids: [],
      boundary_components: 1,
      vertex_links: { a0: "PATH", a1: "PATH", b0: "PATH", b1: "PATH" },
      pure_2d: true,
      surface_eligible: true,
      orientable: true,
      surface_genus: 0,
      chain_boundary_defects: 0,
      euler_poincare_holds: true,
      classification: "TRIANGULATED_DISK",
    });
    expect(result.report!.graph_cycle_rank).not.toBe(result.report!.surface_genus);
  });

  test("is invariant to JSON key order and declaration-array order", () => {
    const original = clone();
    const reorderedKeys = Object.fromEntries(Object.entries(original).reverse());
    expect(stringCrawlTraceSheetLabDigest(reorderedKeys)).toBe(STRING_CRAWL_TRACE_SHEET_LAB_DIGEST);

    const reorderedCells = clone();
    for (const key of ["vertices", "edges", "walks", "faces"] as const) {
      reorderedCells.fixture[key].reverse();
    }
    const evaluated = evaluateStringCrawlTraceSheetLab(reorderedCells);
    expect(evaluated.issues).toEqual([]);
    expect(evaluated.report).toEqual(evaluateStringCrawlTraceSheetLab(original).report);
  });

  test("runs five deterministic counterexamples and conformance mutations", () => {
    expect(runStringCrawlTraceSheetLabFalsifiers(loadStringCrawlTraceSheetLab())).toEqual([
      expect.objectContaining({ id: "face-sign-broken", outcome: "PASS", surface_eligible: false }),
      expect.objectContaining({ id: "walk-endpoint-broken", outcome: "PASS" }),
      expect.objectContaining({ id: "expected-chi-tamper", outcome: "PASS" }),
      expect.objectContaining({ id: "duplicate-occurrence", outcome: "PASS" }),
      expect.objectContaining({ id: "branch-edge-over-two", outcome: "PASS", surface_eligible: false }),
    ]);
  });

  test("rejects re-signed mathematical drift with stable named issues", () => {
    const face = clone();
    face.fixture.faces[0].boundary[2].sign = 1;
    expect(issueCodes(face)).toEqual(expect.arrayContaining(["face-boundary-not-cyclic", "chain-square-nonzero"]));
    expect(evaluateStringCrawlTraceSheetLab(resign(face)).report?.euler_poincare_holds).toBe(false);

    const walk = clone();
    walk.fixture.walks[0].edge_ids[0] = "c0";
    expect(issueCodes(walk)).toContain("walk-edge-endpoint-mismatch");

    const expected = clone();
    expected.expected.surface_euler_characteristic = 2;
    expect(issueCodes(expected)).toContain("expected-output-mismatch");

    const occurrence = clone();
    occurrence.fixture.vertices[1].occurrence = 0;
    expect(issueCodes(occurrence)).toContain("duplicate-occurrence");

    const slices = clone();
    slices.fixture.slices[1].order = 0;
    expect(issueCodes(slices)).toContain("slice-order-invalid");

    const walks = clone();
    walks.fixture.walks[1].id = walks.fixture.walks[0].id;
    expect(issueCodes(walks)).toContain("cell-reference-invalid");

    const branch = clone();
    branch.fixture.faces.push({ id: "f2", boundary: structuredClone(branch.fixture.faces[0].boundary) });
    branch.expected.faces = 3;
    expect(issueCodes(branch)).toEqual(expect.arrayContaining(["edge-face-incidence-over-two", "vertex-link-not-manifold"]));
    expect(evaluateStringCrawlTraceSheetLab(resign(branch)).report).toMatchObject({
      classification: "FINITE_TWO_COMPLEX",
      orientable: false,
    });
  });

  test("returns typed issues rather than throwing for duplicate cell identifiers", () => {
    const mutations: Array<(value: Record<string, any>) => void> = [
      (value) => { value.fixture.vertices[1].id = value.fixture.vertices[0].id; },
      (value) => { value.fixture.edges[1].id = value.fixture.edges[0].id; },
      (value) => { value.fixture.faces[1].id = value.fixture.faces[0].id; },
    ];
    for (const mutate of mutations) {
      const value = clone();
      mutate(value);
      resign(value);
      expect(() => evaluateStringCrawlTraceSheetLab(value)).not.toThrow();
      expect(() => runStringCrawlTraceSheetLabFalsifiers(value)).not.toThrow();
      expect(() => verifyStringCrawlTraceSheetLab(value, false)).not.toThrow();
      expect(verifyStringCrawlTraceSheetLab(value, false).map((issue) => issue.code)).toContain("cell-reference-invalid");
    }
  });

  test("enforces schema identity, source roles, and unique nonclaims in the runtime verifier", () => {
    const mutations: Array<(value: Record<string, any>) => void> = [
      (value) => { value.predecessor.protocol = "kingdom.explore-phenomena-deep-project/9.9"; },
      (value) => { value.predecessor.url = "https://example.invalid/predecessor.json"; },
      (value) => { value.sources[0].role = "UNDECLARED_ROLE"; },
      (value) => { value.nonclaims[1] = value.nonclaims[0]; },
    ];
    for (const mutate of mutations) {
      const value = clone();
      mutate(value);
      const codes = issueCodes(value);
      expect(codes.length).toBeGreaterThan(0);
    }
  });

  test("retains occurrence identity even when route labels repeat", () => {
    const value = loadStringCrawlTraceSheetLab();
    expect(value.fixture.vertices.filter((vertex: any) => vertex.route_label === "route-a").map((vertex: any) => vertex.id)).toEqual(["a0", "a1"]);
    expect(value.fixture.vertices.filter((vertex: any) => vertex.route_label === "route-b").map((vertex: any) => vertex.id)).toEqual(["b0", "b1"]);
    expect(evaluateStringCrawlTraceSheetLab(value).report?.vertices).toBe(4);
  });

  test("rejects authority, KARMA, rights, operational, and release laundering after re-signing", () => {
    const mutations: Array<[string, (value: Record<string, any>) => void]> = [
      ["synthetic-boundary-drift", (value) => { value.scope.network_request = true; }],
      ["authority-enabled", (value) => { value.authority.crawl = true; }],
      ["karma-lanes-not-empty", (value) => { value.karma.kingdom_receipts.push({ state: "final" }); }],
      ["rights-regression", (value) => { value.rights.penalty = true; }],
      ["publication-boundary-drift", (value) => { value.release.runtime_activation = "ACTIVE"; }],
    ];
    for (const [code, mutate] of mutations) {
      const value = clone();
      mutate(value);
      expect(issueCodes(value)).toContain(code);
    }
  });

  test("returns stable issues instead of throwing for malformed safe JSON trees", () => {
    for (const value of [{}, { fixture: {} }, { falsifiers: [] }, { integrity: {} }]) {
      expect(() => evaluateStringCrawlTraceSheetLab(value)).not.toThrow();
      expect(() => runStringCrawlTraceSheetLabFalsifiers(value)).not.toThrow();
      expect(() => verifyStringCrawlTraceSheetLab(value, false)).not.toThrow();
      expect(verifyStringCrawlTraceSheetLab(value, false).map((issue) => issue.code)).toContain("falsifier-result-drift");
    }
  });

  test("rejects oversized custom cell sets before allocating boundary matrices", () => {
    const value = clone();
    value.fixture.vertices = Array.from({ length: 257 }, (_, index) => ({
      id: `v-${index}`,
      slice_id: "t0",
      occurrence: index,
      route_label: `route-${index}`,
    }));
    value.fixture.edges = [];
    value.fixture.faces = [];
    resign(value);
    const evaluated = evaluateStringCrawlTraceSheetLab(value);
    expect(evaluated.report).toBeNull();
    expect(evaluated.issues.map((issue) => issue.code)).toContain("resource-bound-drift");
    expect(() => verifyStringCrawlTraceSheetLab(value, false)).not.toThrow();
  });

  test("strict loader refuses duplicate keys, invalid UTF-8, oversize files, and symlinks", () => {
    const directory = mkdtempSync(join(tmpdir(), "trace-sheet-lab-test-"));
    try {
      const raw = readFileSync(STRING_CRAWL_TRACE_SHEET_LAB_PATH, "utf8");
      const duplicate = join(directory, "duplicate.json");
      writeFileSync(duplicate, raw.replace(
        '"lab_id": "string-crawl-trace-sheet-lab-2026-08-16",',
        '"lab_id": "string-crawl-trace-sheet-lab-2026-08-16",\n  "lab\\u005fid": "duplicate",',
      ));
      expect(() => loadStringCrawlTraceSheetLab(duplicate)).toThrow(/duplicate/i);

      const invalid = join(directory, "invalid.json");
      writeFileSync(invalid, Buffer.from([0xff, 0xfe, 0xfd]));
      expect(() => loadStringCrawlTraceSheetLab(invalid)).toThrow();

      const oversized = join(directory, "oversized.json");
      writeFileSync(oversized, "x".repeat(64 * 1024 + 1));
      expect(() => loadStringCrawlTraceSheetLab(oversized)).toThrow(/exceeds/);

      const symlink = join(directory, "symlink.json");
      symlinkSync(STRING_CRAWL_TRACE_SHEET_LAB_PATH, symlink);
      expect(() => loadStringCrawlTraceSheetLab(symlink)).toThrow(/non-symlink/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("CLI is fixed-fixture, offline, read-only, and explicit about valid scope", () => {
    const cli = readFileSync(new URL("../bin/string-crawl-trace-sheet-lab.ts", import.meta.url), "utf8");
    expect(cli).not.toMatch(/\bfetch\s*\(/);
    expect(cli).not.toMatch(/\bwriteFileSync\b|\bappendFileSync\b|\bspawn(?:Sync)?\b/);
    expect(runStringCrawlTraceSheetLabCli(["verify", "--json"])).toBe(0);
    expect(runStringCrawlTraceSheetLabCli(["falsifiers", "--json"])).toBe(0);
    expect(runStringCrawlTraceSheetLabCli(["verify", "/tmp/caller.json"])).toBe(2);
    expect(runStringCrawlTraceSheetLabCli(["constructor"])).toBe(2);
  });
});
