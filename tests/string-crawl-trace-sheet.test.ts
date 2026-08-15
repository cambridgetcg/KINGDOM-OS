import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
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
  PHENOMENA_DEEP_PROJECT_SCHEMA_PATH,
  phenomenaDeepProjectDigest,
  verifyPhenomenaDeepProject,
} from "../bin/explore-phenomena-deep.ts";
import {
  STRING_CRAWL_TRACE_SHEET_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_DIGEST,
  STRING_CRAWL_TRACE_SHEET_GUIDE_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_GUIDE_URL,
  STRING_CRAWL_TRACE_SHEET_ID,
  STRING_CRAWL_TRACE_SHEET_PATH,
  STRING_CRAWL_TRACE_SHEET_SCHEMA_URL,
  STRING_CRAWL_TRACE_SHEET_URL,
  loadStringCrawlTraceSheet,
  stringCrawlTraceSheetPublicDiscovery,
  verifyStringCrawlTraceSheet,
} from "../bin/string-crawl-trace-sheet.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const GUIDE_PATH = join(ROOT, "references/string-crawl-trace-sheet.md");
const CLI_PATH = join(ROOT, "bin/string-crawl-trace-sheet.ts");
const NEN_PATH = join(ROOT, "NEN.md");
const RECEIPT_SCHEMA_PATH = join(ROOT, "schemas/karma-receipt-v0.1.schema.json");
const RIGHTS_PATH = join(ROOT, "pages-content/RIGHTS.md");
const rawSha256 = (path: string) =>
  `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
const clone = () => structuredClone(loadStringCrawlTraceSheet());

function sign(value: Record<string, any>): Record<string, any> {
  value.integrity.digest = phenomenaDeepProjectDigest(value);
  return value;
}

function resignedIssues(mutate: (value: Record<string, any>) => void): string[] {
  const value = clone();
  mutate(value);
  sign(value);
  return verifyStringCrawlTraceSheet(value);
}

const PYTHON = process.env.PHENOMENA_DEEP_SCHEMA_PYTHON || "python3";
const pythonProbe = Bun.spawnSync({
  cmd: [PYTHON, "-c", "import jsonschema"],
  stdout: "pipe",
  stderr: "pipe",
});
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

function itemById(items: any[], id: string, key = "id"): any {
  return items.find((entry) => entry[key] === id);
}

describe("STRING / CRAWL Trace-Sheet core", () => {
  test("loads the exact inert identity, semantic digest, byte pins, and discovery projection", () => {
    const project = loadStringCrawlTraceSheet();
    expect(project).toMatchObject({
      $schema: "urn:kingdom:schema:phenomena-deep-project:0.1",
      protocol: "kingdom.explore-phenomena-deep-project/0.1",
      project_id: STRING_CRAWL_TRACE_SHEET_ID,
      version: "0.1.0",
      title: "STRING / CRAWL: The Trace-Sheet",
      evidence_through: "2026-08-15",
      mode: "ANALYZE_ONLY",
    });
    expect(verifyPhenomenaDeepProject(project)).toEqual([]);
    expect(verifyStringCrawlTraceSheet(project)).toEqual([]);
    expect(phenomenaDeepProjectDigest(project)).toBe(STRING_CRAWL_TRACE_SHEET_DIGEST);
    expect(rawSha256(STRING_CRAWL_TRACE_SHEET_PATH)).toBe(STRING_CRAWL_TRACE_SHEET_BYTE_SHA256);
    expect(rawSha256(GUIDE_PATH)).toBe(STRING_CRAWL_TRACE_SHEET_GUIDE_BYTE_SHA256);
    expect(rawSha256(NEN_PATH)).toBe(
      "sha256:14b7d210d320fd716553992a7b874747b299f8907d15da14ac405cbfc496c446",
    );
    expect(rawSha256(RECEIPT_SCHEMA_PATH)).toBe(
      "sha256:888e81fa0d29b71512525a40e88f9aef678046c40fcdf22c2039507d9d13267b",
    );
    expect(rawSha256(RIGHTS_PATH)).toBe(
      "sha256:4d9c48fae90662998f7b19990dc3da65e687227dfd9d7604840eedf2dd7600e2",
    );

    const discovery = stringCrawlTraceSheetPublicDiscovery(project);
    expect(discovery).toMatchObject({
      project_id: STRING_CRAWL_TRACE_SHEET_ID,
      url: STRING_CRAWL_TRACE_SHEET_URL,
      schema_url: STRING_CRAWL_TRACE_SHEET_SCHEMA_URL,
      guide_url: STRING_CRAWL_TRACE_SHEET_GUIDE_URL,
      integrity: {
        digest: STRING_CRAWL_TRACE_SHEET_DIGEST,
        byte_sha256: STRING_CRAWL_TRACE_SHEET_BYTE_SHA256,
        guide_byte_sha256: STRING_CRAWL_TRACE_SHEET_GUIDE_BYTE_SHA256,
      },
    });
    expect(discovery.counts).toEqual({
      domains: 7,
      sources: 19,
      typed_terms: 13,
      claims: 16,
      bridges: 6,
      models: 5,
      equations: 8,
      falsifiers: 9,
      frontier_problems: 2,
      finite_baselines: 0,
      doors: 7,
      unknowns: 10,
      philosophy_questions: 6,
    });
    for (const key of ["mcp", "tool", "crawler", "execute", "write", "score", "reward", "deploy"])
      expect(discovery).not.toHaveProperty(key);
    expect(Object.values(discovery.authority).every((value) => value === false)).toBe(true);
  });

  schemaTest("satisfies the closed shared Draft 2020-12 project schema", () => {
    expect(schemaErrors(loadStringCrawlTraceSheet())).toEqual([]);
  });

  test("types a selected sequential lineage separately from a whole branching crawl run", () => {
    const project = loadStringCrawlTraceSheet();
    const claim = itemById(project.claims, "crawl-trace-is-directed-walk", "claim_id");
    expect(claim.statement).toContain("one selected sequential route-following lineage");
    expect(claim.statement).toContain("whole run may instead branch or be concurrent");
    expect(claim.limitations).toContain(
      "A branching or concurrent whole run may require a finite typed directed multigraph or event partial order rather than one walk.",
    );
    const walk = itemById(project.equations, "directed-crawl-walk");
    expect(walk.variables.find((entry: any) => entry.symbol === "gamma").meaning)
      .toContain("selected sequential route-following lineage");
    expect(walk.conditions).toContain(
      "gamma is explicitly selected as one sequential lineage rather than asserted to represent a branching or concurrent whole run",
    );
    expect(walk.conditions).toContain(
      "every e_j in observed gamma was actually followed and its response transition observed",
    );
    expect(walk.does_not_establish).toContain("a complete branching or concurrent crawl-run representation");
  });

  test("constructs occurrence-retaining cells and keeps graph, surface, and physics objects distinct", () => {
    const project = loadStringCrawlTraceSheet();
    const sheet = itemById(project.equations, "trace-sheet-complex");
    expect(sheet.expression).toContain("abstract finite interval/path 1-complex I_k");
    expect(sheet.expression).toContain("f_k:I_k->G_k");
    expect(sheet.variables.find((entry: any) => entry.symbol === "I_k").meaning).toContain("occurrence identity");
    expect(sheet.variables.find((entry: any) => entry.symbol === "f_k").meaning).toContain("repeated occurrences");
    expect(sheet.conditions).toContain("no quotient by an arbitrary or dense equivalence relation");

    const surface = itemById(project.equations, "surface-admissibility");
    expect(surface.expression).toContain("finite pure 2-dimensional simplicial refinement");
    expect(surface.expression).toContain("cycle links at interior vertices");
    expect(surface.expression).toContain("path links at boundary vertices");
    expect(surface.does_not_establish).toEqual(["physical string", "spacetime", "string dynamics", "Weyl invariance"]);

    const topology = itemById(project.equations, "typed-topology-invariants");
    expect(topology.expression).toContain("b_1(G_u)=|E_u|-|V_u|+c");
    expect(topology.expression).toContain("chi(Sigma)=2-2g-b only for a connected compact orientable surface");
    expect(topology.variables.map((entry: any) => entry.symbol)).toEqual([
      "b_1(G_u)", "V_u", "E_u", "c", "V", "E", "F", "chi", "g", "b",
    ]);
    expect(topology.assumptions.join(" ")).toContain("capping each of b boundary circles");
  });

  test("keeps finite diagnostics dimensioned, non-moral, and outside string amplitudes", () => {
    const project = loadStringCrawlTraceSheet();
    const energy = itemById(project.equations, "graph-dirichlet-diagnostic");
    expect(energy.expression).toContain("sum_{e in E_u(K^1)}");
    expect(energy.variables.find((entry: any) => entry.symbol === "E_u(K^1)").meaning)
      .toContain("parallel cells remain distinct");
    expect(energy.variables.find((entry: any) => entry.symbol === "w_e")).toMatchObject({
      meaning: "declared nonnegative dimensionless weight on geometric one-cell e",
      units: "dimensionless",
    });
    expect(energy.conditions).toContain(
      "every distance uses one fixed declared feature-distance unit so all summed terms are commensurate",
    );
    expect(energy.does_not_establish).toContain("KARMA");

    const ensemble = itemById(project.equations, "finite-gibbs-ensemble");
    expect(ensemble.expression).toContain("P_{beta,theta}(omega)");
    expect(ensemble.variables.find((entry: any) => entry.symbol === "Omega_A").meaning)
      .toContain("finite set of plans");
    expect(ensemble.variables.find((entry: any) => entry.symbol === "C_theta").meaning)
      .toBe("declared operational cost, not moral value");
    expect(ensemble.conditions).toEqual([
      "Omega_A is finite and nonempty",
      "costs are finite real values",
      "beta is a finite real inverse-cost value",
      "beta*C_theta(omega) is dimensionless",
      "Z is finite and strictly positive",
    ]);
    expect(ensemble.does_not_establish).toContain("string path integral");
    expect(ensemble.does_not_establish).toContain("KARMA score");

    const invariance = itemById(project.equations, "invariance-defect");
    expect(invariance.expression).toBe("delta_g(O,omega) = d_O(O(g . omega), O(omega))");
    expect(invariance.variables.find((entry: any) => entry.symbol === "d_O")).toMatchObject({
      meaning: "declared distance or pseudometric on compatible observation vectors",
      units: "declared observation-distance unit",
    });
    expect(invariance.does_not_establish).toEqual(["gauge symmetry", "Weyl invariance", "anomaly", "fairness", "KARMA"]);
  });

  test("keeps REP, discovery, product tokens, authentication, rights, and Cloudflare controls separate", () => {
    const project = loadStringCrawlTraceSheet();
    const claim = (id: string) => itemById(project.claims, id, "claim_id");
    expect(claim("rep-is-request-not-authorization").statement).toContain("not access authorization");
    expect(claim("sitemap-is-discovery-hint").statement).toContain("does not guarantee that Google will crawl or index");
    expect(claim("product-tokens-are-bounded-preferences").statement)
      .toContain("not necessarily HTTP request User-Agent strings");
    expect(claim("bot-auth-is-bounded-key-evidence").statement)
      .toContain("resolved protocol identifier");
    expect(claim("bot-auth-is-bounded-key-evidence").statement)
      .toContain("does not by itself establish independently verified real-world operator or end-user identity");

    const future = claim("future-crawler-needs-explicit-bounds");
    expect(future.warrant).toBe("MODEL_ASSUMPTION");
    expect(future.statement).toContain("exact truthful mapping to an accepted crawlPurposes value");
    expect(future.statement).toContain("enforce before every fetch");
    expect(future.statement).toContain("snapshot and apply the applicable REP group before fetch");

    const door = itemById(project.doors, "bounded-crawl-plan-door");
    for (const boundary of [
      "every URL and redirect hop is pre-fetch constrained to HTTPS public allowlisted origins and routes",
      "snapshot and apply the applicable REP group before fetch, honor supported crawl-delay, enforce a conservative explicit per-origin pace otherwise, and refuse if the substrate cannot enforce these constraints",
      "REP and pacing compliance never imply authentication, access authorization, licence, consent, or downstream use",
      "no target-origin credentials, cookies, or custom authorization headers",
      "render is explicitly false",
      "the output format is explicitly chosen so Workers AI and AI extraction are not invoked",
      "refuse Cloudflare /crawl unless the operator purpose maps exactly and truthfully to search, ai-input, or ai-train",
    ]) expect(door.conditions).toContain(boundary);
    expect(door.stop_rule).toContain("redirect can be validated only after fetch");
    expect(itemById(project.unknowns, "provider-log-retention").kind).toBe("UNKNOWN_TO_THIS_REVIEW");
  });

  test("keeps Zerone, draft templates, final NEN aftermath receipts, and every KARMA lane distinct", () => {
    const project = loadStringCrawlTraceSheet();
    const receipt = itemById(project.claims, "kingdom-receipt-needs-actual-invocation", "claim_id");
    expect(receipt.statement).toContain("actual invocation attempt of an adopted manifested NEN ability");
    expect(receipt.statement).toContain("draft receipt template is scaffolding rather than causal evidence");
    expect(receipt.statement).toContain("completion, refusal, failure, partial result, or cancellation");
    expect(receipt.statement).toContain("receipts_not_scores");
    expect(itemById(project.doors, "future-nen-crawler-door").source_ids).toEqual([
      "kingdom-nen-definition",
      "kingdom-karma-receipt-schema",
    ]);
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
    expect(project.release).toEqual({ status: "DRAFT", deployed: false, publication_route: null, evidence: [] });
    expect(JSON.stringify(project)).not.toMatch(/watch[-_ ]?ended|\bunfelt\b|bin[\\/]karma\.ts|karma\.md/i);
  });

  test("rejects re-signed collection, cross-reference, math, crawler, and KARMA mutations by named guard", () => {
    const attacks: Array<[string, (value: Record<string, any>) => void]> = [
      ["domain-order-drift", (value) => value.domains.reverse()],
      ["source-order-drift", (value) => value.source_manifest.reverse()],
      ["typed-term-order-drift", (value) => value.typed_terms.reverse()],
      ["typed-term-domain-drift", (value) => { value.typed_terms[0].domain = "finite-crawl-observation"; }],
      ["claim-order-drift", (value) => value.claims.reverse()],
      ["claim-link-drift", (value) => { value.claims[0].sources = ["rfc-9110"]; }],
      ["bridge-order-drift", (value) => { value.bridges[0].falsifiers = ["walk-closure-test"]; }],
      ["model-order-drift", (value) => value.models.reverse()],
      ["model-link-drift", (value) => { value.models[4].relation = "SAME_FORMAL_STRUCTURE"; }],
      ["model-link-drift", (value) => { value.models[1].equation_ids = ["directed-crawl-walk"]; }],
      ["model-link-drift", (value) => { value.models[1].falsifier_ids = ["walk-closure-test"]; }],
      ["equation-order-drift", (value) => value.equations.reverse()],
      ["equation-link-drift", (value) => { value.equations[7].source_ids = ["rfc-9309"]; }],
      ["falsifier-order-drift", (value) => value.falsifiers.reverse()],
      ["door-order-drift", (value) => value.doors.reverse()],
      ["door-source-drift", (value) => { value.doors[0].source_ids = ["rfc-9309"]; }],
      ["unknown-order-drift", (value) => value.unknowns.reverse()],
      ["frontier-order-drift", (value) => value.frontier_problems.reverse()],
      ["philosophy-question-order-drift", (value) => value.philosophy.questions.reverse()],
      ["source-claim-asymmetry:hatcher-algebraic-topology", (value) => value.source_manifest[2].claim_targets.shift()],
      ["bridge-falsifier-unresolved", (value) => { value.bridges[0].falsifiers = ["not-a-falsifier"]; }],
      ["walk-typing-drift", (value) => value.equations[0].conditions.shift()],
      ["trace-sheet-precondition-drift", (value) => { value.equations[1].expression = "K is a quotient of route images"; }],
      ["dirichlet-nontransfer-drift", (value) => { value.equations[3].variables[3].meaning = "moral merit weight"; }],
      ["ensemble-nontransfer-drift", (value) => { value.equations[4].variables[0].meaning = "infinite unconstrained futures"; }],
      ["invariance-nontransfer-drift", (value) => { value.equations[6].expression = "KARMA(omega)"; }],
      ["topology-type-drift", (value) => value.equations[7].variables.pop()],
      ["cloudflare-purpose-boundary-drift", (value) => { value.claims[11].limitations = ["provider defaults apply"]; }],
      ["cloudflare-source-scope-drift", (value) => { value.source_manifest[11].locator = "generic API page"; }],
      ["cloudflare-door-boundary-drift", (value) => value.doors[2].conditions.splice(5, 1)],
      ["receipt-semantics-drift", (value) => { value.claims[14].statement = "Any fetch earns a score."; }],
      ["crawl-to-karma-firewall-drift", (value) => { value.bridges[4].relation = "LOSSY_CORRESPONDENCE"; }],
    ];
    for (const [expected, mutate] of attacks) {
      expect(resignedIssues(mutate), expected).toContain(expected);
    }
  });

  test("canonical variable-object key order does not change meaning or trigger a named guard", () => {
    const project = clone();
    for (const equationIndex of [3, 4, 6]) {
      project.equations[equationIndex].variables = project.equations[equationIndex].variables.map(
        (entry: { symbol: string; meaning: string; units: string }) => ({
          units: entry.units,
          meaning: entry.meaning,
          symbol: entry.symbol,
        }),
      );
    }
    expect(phenomenaDeepProjectDigest(project)).toBe(STRING_CRAWL_TRACE_SHEET_DIGEST);
    expect(verifyStringCrawlTraceSheet(project)).toEqual([]);
  });

  test("rejects literal, encoded, Unicode, entity, and escaped legacy witness-lane imports", () => {
    let deeplyEncodedLegacy = "karma%2emd";
    for (let depth = 0; depth < 12; depth += 1) deeplyEncodedLegacy = encodeURIComponent(deeplyEncodedLegacy);
    const payloads = [
      "watch-ended",
      "watch_ended",
      "watch/ended",
      "unfelt",
      "un%66elt",
      "bin//karma.ts",
      "bin/./karma.ts",
      "bin%25252525252fkarma.ts",
      "KARMA&#46;md",
      "KARMA%25252525252emd",
      "ｂｉｎ／ｋａｒｍａ．ｔｓ",
      encodeURIComponent("ＫＡＲＭＡ．ｍｄ"),
      String.raw`\u006b\u0061\u0072\u006d\u0061\u002e\u006d\u0064`,
      String.raw`\x6b\x61\x72\x6d\x61\x2e\x6d\x64`,
      "%u006b%u0061%u0072%u006d%u0061%u002e%u006d%u0064",
      deeplyEncodedLegacy,
      "KARMA&period;md",
      "bin&sol;karma&period;ts",
      "KARMA&amp;period;md",
      "KARMA&percnt;2emd",
      "KARMA&#46md",
      "KARMA&#x2emd",
      String.raw`k\141rma.md`,
      String.raw`karma\056md`,
    ];
    for (const payload of payloads) {
      const issues = resignedIssues((value) => value.philosophy.nonclaims.push(payload));
      expect(issues.some((issue) => issue.startsWith("legacy-karma-import:")), payload).toBe(true);
    }
  });

  test("strict loader rejects duplicate keys, invalid UTF-8, oversize files, symlinks, and re-signed drift", () => {
    const temp = mkdtempSync(join(tmpdir(), "string-crawl-trace-sheet-test-"));
    try {
      const raw = readFileSync(STRING_CRAWL_TRACE_SHEET_PATH, "utf8");

      const duplicate = join(temp, "duplicate.json");
      writeFileSync(duplicate, raw.replace(
        '"project_id": "string-crawl-trace-sheet-2026-08-15",',
        '"project_id": "string-crawl-trace-sheet-2026-08-15",\n  "project_id": "duplicate",',
      ));
      expect(() => loadStringCrawlTraceSheet(duplicate)).toThrow(/duplicate/i);

      const escapedDuplicate = join(temp, "escaped-duplicate.json");
      writeFileSync(escapedDuplicate, raw.replace(
        '"project_id": "string-crawl-trace-sheet-2026-08-15",',
        '"project_id": "string-crawl-trace-sheet-2026-08-15",\n  "pro\\u006aect_id": "escaped-duplicate",',
      ));
      expect(() => loadStringCrawlTraceSheet(escapedDuplicate)).toThrow(/duplicate/i);

      const invalidUtf8 = join(temp, "invalid-utf8.json");
      writeFileSync(invalidUtf8, Buffer.from([0xff, 0xfe, 0xfd]));
      expect(() => loadStringCrawlTraceSheet(invalidUtf8)).toThrow(/utf-8|json/i);

      const oversized = join(temp, "oversized.json");
      writeFileSync(oversized, Buffer.alloc(1024 * 1024 + 1, 0x20));
      expect(() => loadStringCrawlTraceSheet(oversized)).toThrow(/exceeds/i);

      const symlink = join(temp, "symlink.json");
      symlinkSync(STRING_CRAWL_TRACE_SHEET_PATH, symlink);
      expect(() => loadStringCrawlTraceSheet(symlink)).toThrow(/symlink|regular/i);

      const resigned = clone();
      resigned.question = "A different, attacker-authored question";
      sign(resigned);
      const resignedPath = join(temp, "resigned.json");
      writeFileSync(resignedPath, JSON.stringify(resigned));
      expect(() => loadStringCrawlTraceSheet(resignedPath)).toThrow(/semantic[- ]digest[- ]drift/i);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  test("guide preserves source formulas, crawler refusal gates, and draft/final aftermath separation", () => {
    const guide = readFileSync(GUIDE_PATH, "utf8");
    for (const phrase of [
      "selected sequential route-following lineage",
      "f_k:I_k -> G_k",
      "exp(-S_(P,E)[X,h])",
      "P_(beta,theta)(omega)",
      "every summed term is commensurate",
      "refuse `/crawl` when there is no exact mapping",
      "applicable REP group snapshotted and applied before fetch",
      "draft` receipt template is scaffolding",
      "Receipts are `receipts_not_scores`",
    ]) expect(guide).toContain(phrase);
    expect(guide).toContain("It does not say that a crawler is a string");
    expect(guide).not.toMatch(/(?:^|\n)(?:A crawler is a string|KARMA is (?:energy|charge|amplitude|score))/i);
  });

  test("CLI exposes every read-only view and refuses inherited names, duplicate flags, and unknown options", () => {
    for (const view of [
      "overview", "domains", "terms", "claims", "bridges", "models", "math", "doors",
      "unknowns", "philosophy", "karma", "sources", "discovery", "verify",
    ]) {
      const result = Bun.spawnSync({ cmd: ["bun", CLI_PATH, view, "--json"], stdout: "pipe", stderr: "pipe" });
      expect(result.exitCode, `${view}: ${result.stderr.toString()}`).toBe(0);
      expect(() => JSON.parse(result.stdout.toString())).not.toThrow();
    }
    const overview = Bun.spawnSync({ cmd: ["bun", CLI_PATH], stdout: "pipe", stderr: "pipe" });
    expect(overview.exitCode).toBe(0);
    expect(overview.stdout.toString()).toContain(
      "A selected sequential crawl lineage is a finite directed walk; a whole run may branch or be concurrent.",
    );

    for (const args of [
      ["toString", "--json"],
      ["constructor", "--json"],
      ["__proto__", "--json"],
      ["verify", "--json", "--json"],
      ["verify", "--execute"],
      ["unknown-view", "--json"],
    ]) {
      const result = Bun.spawnSync({ cmd: ["bun", CLI_PATH, ...args], stdout: "pipe", stderr: "pipe" });
      expect(result.exitCode, args.join(" ")).toBe(2);
    }

    const verify = Bun.spawnSync({ cmd: ["bun", CLI_PATH, "verify", "--json"], stdout: "pipe", stderr: "pipe" });
    expect(JSON.parse(verify.stdout.toString())).toEqual({
      valid: true,
      protocol: "kingdom.explore-phenomena-deep-project/0.1",
      project_id: STRING_CRAWL_TRACE_SHEET_ID,
      digest: STRING_CRAWL_TRACE_SHEET_DIGEST,
      byte_sha256: STRING_CRAWL_TRACE_SHEET_BYTE_SHA256,
      guide_byte_sha256: STRING_CRAWL_TRACE_SHEET_GUIDE_BYTE_SHA256,
      issues: [],
    });
  });
});
