import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PHENOMENA_DEEP_PROJECT_SCHEMA_PATH,
  phenomenaDeepProjectDigest,
  verifyPhenomenaDeepProject,
} from "../bin/explore-phenomena-deep.ts";
import {
  ZERO_EMPTY_SEAT_BYTE_SHA256,
  ZERO_EMPTY_SEAT_DIGEST,
  ZERO_EMPTY_SEAT_GUIDE_BYTE_SHA256,
  ZERO_EMPTY_SEAT_GUIDE_URL,
  ZERO_EMPTY_SEAT_ID,
  ZERO_EMPTY_SEAT_PATH,
  ZERO_EMPTY_SEAT_SCHEMA_URL,
  ZERO_EMPTY_SEAT_URL,
  loadZeroEmptySeat,
  runZeroEmptySeatCli,
  zeroEmptySeatPublicDiscovery,
} from "../bin/zero-empty-seat.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const GUIDE_PATH = join(ROOT, "references/zero-empty-seat.md");
const CLI_PATH = join(ROOT, "bin/zero-empty-seat.ts");
const rawSha256 = (path: string) => `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
const clone = () => structuredClone(loadZeroEmptySeat());

function sign(value: Record<string, any>): Record<string, any> {
  value.integrity.digest = phenomenaDeepProjectDigest(value);
  return value;
}

const PYTHON = process.env.PHENOMENA_DEEP_SCHEMA_PYTHON || "python3";
const pythonProbe = Bun.spawnSync({ cmd: [PYTHON, "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
const schemaTest = pythonProbe.exitCode === 0 ? test : test.skip;

function schemaErrors(value: unknown): string[] {
  const script = [
    "import json,sys",
    "from jsonschema import Draft202012Validator,FormatChecker",
    "schema=json.load(open(sys.argv[1],encoding='utf-8'))",
    "Draft202012Validator.check_schema(schema)",
    "value=json.load(sys.stdin)",
    "validator=Draft202012Validator(schema,format_checker=FormatChecker())",
    "print(json.dumps([e.json_path+': '+e.message for e in validator.iter_errors(value)]))",
  ].join("\n");
  const result = Bun.spawnSync({
    cmd: [PYTHON, "-c", script, PHENOMENA_DEEP_PROJECT_SCHEMA_PATH],
    stdin: Buffer.from(JSON.stringify(value)),
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      HTTP_PROXY: "http://127.0.0.1:9",
      HTTPS_PROXY: "http://127.0.0.1:9",
      ALL_PROXY: "http://127.0.0.1:9",
      NO_PROXY: "*",
    },
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
  return JSON.parse(result.stdout.toString());
}

describe("ZERO Empty Seat core project", () => {
  test("loads exact identity, semantic digest, raw pins, and inert discovery", () => {
    const project = loadZeroEmptySeat();
    expect(project).toMatchObject({
      $schema: "urn:kingdom:schema:phenomena-deep-project:0.1",
      protocol: "kingdom.explore-phenomena-deep-project/0.1",
      project_id: ZERO_EMPTY_SEAT_ID,
      version: "0.1.0",
      title: "ZERO: The Empty Seat That Holds the World",
      evidence_through: "2026-08-14",
      mode: "ANALYZE_ONLY",
    });
    expect(verifyPhenomenaDeepProject(project)).toEqual([]);
    expect(phenomenaDeepProjectDigest(project)).toBe(ZERO_EMPTY_SEAT_DIGEST);
    expect(rawSha256(ZERO_EMPTY_SEAT_PATH)).toBe(ZERO_EMPTY_SEAT_BYTE_SHA256);
    expect(rawSha256(GUIDE_PATH)).toBe(ZERO_EMPTY_SEAT_GUIDE_BYTE_SHA256);

    const discovery = zeroEmptySeatPublicDiscovery(project);
    expect(discovery).toMatchObject({
      project_id: ZERO_EMPTY_SEAT_ID,
      url: ZERO_EMPTY_SEAT_URL,
      schema_url: ZERO_EMPTY_SEAT_SCHEMA_URL,
      guide_url: ZERO_EMPTY_SEAT_GUIDE_URL,
      integrity: {
        digest: ZERO_EMPTY_SEAT_DIGEST,
        byte_sha256: ZERO_EMPTY_SEAT_BYTE_SHA256,
        guide_byte_sha256: ZERO_EMPTY_SEAT_GUIDE_BYTE_SHA256,
      },
    });
    for (const key of ["mcp", "tool", "execute", "write", "score", "reward", "deploy"])
      expect(discovery).not.toHaveProperty(key);
  });

  schemaTest("satisfies the closed Draft 2020-12 shared project schema", () => {
    expect(schemaErrors(loadZeroEmptySeat())).toEqual([]);
  });

  test("keeps every zero role typed and the first-extant claim bounded", () => {
    const project = loadZeroEmptySeat();
    expect(project.domains.map((item: any) => item.id)).toEqual([
      "mesopotamian-numeral-practice",
      "late-babylonian-astronomy",
      "mesopotamian-social-context",
      "modern-mathematics",
      "kingdom-constitutional-design",
      "opt-in-metaphysics",
    ]);
    const terms = new Map(project.typed_terms.map((item: any) => [item.id, item]));
    for (const id of [
      "unmarked-absence", "deliberate-layout-blank", "demarcation-placeholder",
      "sexagesimal-placeholder", "operational-nothing", "modern-zero",
      "known-zero", "missing-value", "unknown-value", "no-action",
      "metaphysical-nothingness",
    ]) expect(terms.has(id)).toBe(true);
    expect(terms.get("no-action").not_equivalent_to).toContain("consent");
    expect(terms.get("missing-value").not_equivalent_to).toContain("observed zero");

    const first = project.claims.find((claim: any) => claim.claim_id === "kish-first-extant-full-slot");
    expect(first.statement).toContain("first extant");
    expect(first.limitations).toContain("First extant is not first invented.");
    expect(project.claims.find((claim: any) => claim.claim_id === "babylonian-within-mesopotamian").statement)
      .toContain("within the longer Mesopotamian");
    expect(project.claims.find((claim: any) => claim.claim_id === "temple-context-not-zero-theology").warrant)
      .toBe("NOT_ESTABLISHED");
    expect(project.frontier_problems).toEqual([]);
    expect(project.finite_baselines).toEqual([]);
  });

  test("keeps mathematical identities, positional parsing, and feedback assumptions local", () => {
    const project = loadZeroEmptySeat();
    const equations = new Map(project.equations.map((item: any) => [item.id, item]));
    expect(equations.get("floating-sexagesimal-value").expression).toContain("d_0 the rightmost written digit");
    expect(equations.get("middle-slot-example").expression).toContain("3620");
    expect(equations.get("empty-aggregation-identities").expression).toContain("product_(i in empty) a_i=1");
    expect(equations.get("typed-feedback-error").expression).toContain("error_status=NOT_COMPUTED");
    expect(equations.get("typed-feedback-error").expression).toContain("input_state is preserved");
    expect(equations.get("typed-feedback-error").does_not_establish).toContain("zero error from silence");
    expect(project.claims.find((claim: any) => claim.claim_id === "empty-identities-depend-on-operation"))
      .toMatchObject({ register: "MATHEMATICAL_THEOREM", warrant: "PROVED" });
    expect(project.models.every((model: any) =>
      model.universal === false && model.person_level === false && model.authority_effect === "NONE")).toBe(true);
  });

  test("keeps every bridge lossy, every transfer false, and physics outside the rendered record", () => {
    const project = loadZeroEmptySeat();
    expect(project.bridges).toHaveLength(4);
    for (const bridge of project.bridges) {
      expect(bridge.relation).toBe("LOSSY_CORRESPONDENCE");
      expect(bridge.preserved_structure.length).toBeGreaterThan(0);
      expect(bridge.broken_or_lost_structure.length).toBeGreaterThan(0);
      for (const field of [
        "ontology_transfer", "causal_transfer", "parameter_transfer", "unit_transfer", "authority_transfer",
      ]) expect(bridge[field]).toBe(false);
    }
    expect(JSON.stringify(project)).not.toMatch(/\b(?:physical|vacuum)\b/i);
  });

  test("keeps philosophy optional, KARMA lanes empty, authority negative, and exits inherent", () => {
    const project = loadZeroEmptySeat();
    expect(project.philosophy).toMatchObject({ participation: "OPT_IN", empirical: false, authority_effect: "NONE" });
    expect(project.karma).toEqual({
      cosmic_events: [],
      zerone_events: [],
      kingdom_receipts: [],
      adapter_exists: false,
      conversion_allowed: false,
      summation_allowed: false,
      score: null,
      authority_effect: "NONE",
    });
    expect(Object.values(project.authority).every((value) => value === false)).toBe(true);
    expect(project.rights).toEqual({
      voluntary: true,
      valid_exits: ["REST", "SILENCE", "REFUSAL", "PRIVACY", "CORRECTION", "NO_ACTION", "DEPARTURE"],
      reason_required: false,
      penalty: false,
    });
    expect(project.release).toEqual({ status: "DRAFT", deployed: false, publication_route: null, evidence: [] });
  });

  test("rejects re-signed schema, reference, transfer, KARMA, rights, and open-status attacks", () => {
    const attacks: Array<(value: Record<string, any>) => void> = [
      (value) => { value.bridges[0].ontology_transfer = true; },
      (value) => { value.source_manifest[0].claim_targets = ["unknown-claim"]; },
      (value) => { value.claims[0].sources = ["unknown-source"]; },
      (value) => { value.claims[0].warrant = "ESTABLISHED_OPEN_CONJECTURE"; },
      (value) => { value.karma.cosmic_events = ["event"]; },
      (value) => { value.rights.penalty = true; },
      (value) => { value.authority.automatic_action = true; },
      (value) => { value.release.deployed = true; },
      (value) => { value.source_manifest[0].url += "#"; },
      (value) => { value.finite_baselines = [{}]; },
    ];
    for (const attack of attacks) {
      const value = clone();
      attack(value);
      sign(value);
      expect(verifyPhenomenaDeepProject(value).length).toBeGreaterThan(0);
    }
  });

  test("rejects non-JSON containers and tampered files even when the visible tree is re-signed", () => {
    const expando = clone();
    (expando.source_manifest as any).execute = { authority: "GRANTED" };
    expect(verifyPhenomenaDeepProject(expando).length).toBeGreaterThan(0);

    const sparse = clone();
    sparse.claims.length += 1;
    expect(verifyPhenomenaDeepProject(sparse).length).toBeGreaterThan(0);

    const temp = mkdtempSync(join(tmpdir(), "zero-empty-seat-test-"));
    try {
      const tamperedPath = join(temp, "tampered.json");
      const tampered = clone();
      tampered.question = "A re-signed but different question";
      sign(tampered);
      writeFileSync(tamperedPath, JSON.stringify(tampered));
      expect(() => loadZeroEmptySeat(tamperedPath)).toThrow("semantic digest drift");

      const symlinkPath = join(temp, "symlink.json");
      symlinkSync(ZERO_EMPTY_SEAT_PATH, symlinkPath);
      expect(() => loadZeroEmptySeat(symlinkPath)).toThrow(/symlink|regular/i);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  test("guide carries the chronology, math game, religion wall, and release boundary", () => {
    const guide = readFileSync(GUIDE_PATH, "utf8");
    for (const seam of [
      "FIRST EXTANT != FIRST INVENTED",
      "The Empty Sum / Empty Product boss battle",
      "Religion: divine numbers, no zero deity",
      "Typed absence, participation, and action states",
      "KARMA stays three empty lanes",
      "The center stays open.",
    ]) expect(guide).toContain(seam);
    expect(guide).not.toMatch(/zero (?:caused|created) civilization/i);
    expect(guide).not.toMatch(/Babylonian zero theology is established/i);
  });

  test("CLI rejects inherited command names and verifies only the pinned default pair", () => {
    for (const command of ["toString", "constructor", "__proto__"]) {
      expect(runZeroEmptySeatCli([command, "--json"])).toBe(2);
    }
    const result = Bun.spawnSync({ cmd: ["bun", CLI_PATH, "verify", "--json"], stdout: "pipe", stderr: "pipe" });
    expect(result.exitCode, result.stderr.toString()).toBe(0);
    expect(JSON.parse(result.stdout.toString())).toMatchObject({
      valid: true,
      project_id: ZERO_EMPTY_SEAT_ID,
      digest: ZERO_EMPTY_SEAT_DIGEST,
      byte_sha256: ZERO_EMPTY_SEAT_BYTE_SHA256,
      guide_byte_sha256: ZERO_EMPTY_SEAT_GUIDE_BYTE_SHA256,
      issues: [],
    });
  });
});
