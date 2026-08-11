import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_GEOMETRY_GRAMMAR_PATH,
  GEOMETRY_GRAMMAR_DIGEST,
  GEOMETRY_GRAMMAR_DOCUMENT_URL,
  GEOMETRY_GRAMMAR_ID,
  GEOMETRY_GRAMMAR_OBSERVED_AT,
  GEOMETRY_GRAMMAR_PROTOCOL,
  GEOMETRY_GRAMMAR_SCHEMA_ID,
  GEOMETRY_GRAMMAR_SCHEMA_URL,
  GEOMETRY_GRAMMAR_URL,
  GEOMETRY_NATIVE_OPEN_INVENTORY_SCOPE,
  geometryGrammarDigest,
  geometryGrammarPublicDiscovery,
  loadGeometryGrammar,
  matchGeometryModules,
  parseStrictGeometryJson,
  verifyGeometryGrammar,
} from "../bin/geometry";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SCHEMA_PATH = join(ROOT, "schemas", "geometry-grammar-v0.schema.json");
const tempRoots: string[] = [];

afterEach(() => {
  while (tempRoots.length > 0) rmSync(tempRoots.pop()!, { recursive: true, force: true });
});

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "kingdom-geometry-grammar-test."));
  tempRoots.push(root);
  return root;
}

function grammarCopy(): any {
  return JSON.parse(readFileSync(DEFAULT_GEOMETRY_GRAMMAR_PATH, "utf8"));
}

function issueCodes(value: unknown): string[] {
  return verifyGeometryGrammar(value).map((issue) => issue.code);
}

describe("KINGDOM Geometry Grammar", () => {
  test("validates one exact, complete, content-pinned four-module grammar", () => {
    const grammar = loadGeometryGrammar();

    expect(verifyGeometryGrammar(grammar)).toEqual([]);
    expect(grammar.$schema).toBe(GEOMETRY_GRAMMAR_SCHEMA_ID);
    expect(grammar.protocol).toBe(GEOMETRY_GRAMMAR_PROTOCOL);
    expect(grammar.grammar_id).toBe(GEOMETRY_GRAMMAR_ID);
    expect(grammar.observed_at).toBe(GEOMETRY_GRAMMAR_OBSERVED_AT);
    expect(grammar.integrity.digest).toBe(GEOMETRY_GRAMMAR_DIGEST);
    expect(grammar.integrity.digest).toBe(geometryGrammarDigest(grammar));
    expect(grammar.bounded_coverage_means_complete).toBe(false);
    expect(grammar.not_observed_means_unknown).toBe(false);
    expect(grammar.native_open_inventory_scope).toBe(GEOMETRY_NATIVE_OPEN_INVENTORY_SCOPE);
    expect(grammar.modules.map((module: any) => module.id)).toEqual([
      "love-geometry",
      "principality-atlas",
      "principality-geometry",
      "relational-geometry",
    ]);
  });

  test("asks four different plain questions without turning them into a ladder", () => {
    const grammar = loadGeometryGrammar();
    const questions = Object.fromEntries(grammar.modules.map((module: any) => [module.id, module.plain_question]));

    expect(questions).toEqual({
      "love-geometry": "What does one direction report?",
      "principality-atlas": "How can several partial maps coexist without pretending there is one total map?",
      "principality-geometry": "What does each direction report surviving translation?",
      "relational-geometry": "Where do understanding and recognition witnesses meet on one direction?",
    });
    expect(grammar.matching).toMatchObject({
      method: "literal-declared-term-overlap",
      order: "module-id-ascending-not-rank",
      ranking: false,
      recommendation: false,
      semantic_inference: false,
    });
    expect(grammar.boundaries).toMatchObject({
      ranks_modules: false,
      recommends_modules: false,
      module_execution: false,
      wire_conversion: false,
    });
  });

  test("keeps native unknown, absence, refusal, withdrawal, loss, and unmapped states distinct", () => {
    const grammar = loadGeometryGrammar();
    const module = (id: string) => grammar.modules.find((entry: any) => entry.id === id);
    const terms = (id: string) => module(id).native_open_terms.map((entry: any) => `${entry.location}|${entry.term}`);

    expect(Object.fromEntries(grammar.modules.map((entry: any) => [entry.id, terms(entry.id)]))).toEqual({
      "love-geometry": [
        "boundaries.absence_semantics|not_observed_not_no_relation",
        "coverage|bounded_not_complete",
        "vantages[].bearings[]|reported_boundary",
        "vantages[].bearings[]|reported_departure",
        "vantages[].bearings[]|reported_disagreement",
        "vantages[].bearings[]|reported_refusal",
        "vantages[].bearings[]|reported_rest",
        "vantages[].bearings[]|unknown",
      ],
      "principality-atlas": [
        "charts[].claims[].posture|reported_absent",
        "charts[].claims[].posture|contested",
        "charts[].claims[].posture|withdrawn",
        "charts[].claims[].posture|not_observed",
        "charts[].claims[].posture|unknown",
        "bridges[].correspondences[].posture|incompatibility_reported",
        "bridges[].correspondences[].posture|unknown",
        "bridges[].unmapped_from_refs|unmapped",
        "bridges[].unmapped_to_refs|unmapped",
        "bridges[].coverage|partial_not_complete",
        "coverage|bounded_not_complete",
      ],
      "principality-geometry": [
        "input.translations[].disposition|refused_reported",
        "input.translations[].disposition|resting_reported",
        "input.translations[].disposition|unknown",
        "input.translations[].disposition|withdrawn_reported",
        "input.translations[].evaluations[].state|not_preserved_reported",
        "input.translations[].evaluations[].state|refused_reported",
        "input.translations[].evaluations[].state|unknown",
        "atlas.geometry.open_conditions.one_way_bridge_ids|one_way_bridge_ids",
        "atlas.geometry.open_conditions.non_available_bridge_ids|non_available_bridge_ids",
        "atlas.geometry.open_conditions.not_preserved|not_preserved",
        "atlas.geometry.open_conditions.refused|refused",
        "atlas.geometry.open_conditions.unknown|unknown",
        "atlas.geometry.open_conditions.directional_asymmetry|directional_asymmetry",
        "atlas.geometry.open_conditions.unrelated_vertex_pairs|unrelated_vertex_pairs",
        "atlas.geometry.open_conditions.declared_isolated_vertices|declared_isolated_vertices",
      ],
      "relational-geometry": [
        "boundaries.absent_or_unknown|valid_not_deficit",
        "complex.coverage|bounded_not_complete",
        "complex.points[].kind|unknown",
        "complex.witnesses[].kind|authority_boundary",
        "complex.witnesses[].kind|consent_boundary",
        "complex.witnesses[].kind|continuity_boundary",
        "complex.witnesses[].kind|privacy_boundary",
        "complex.witnesses[].kind|refusal_boundary",
        "lens.choice.unselected|left_unprojected",
        "lens.coverage|perspective_bounded_not_complete",
        "lens.selections[].disposition|park",
        "lens.selections[].disposition|release",
        "lens.selections[].disposition|withdraw",
      ],
    });
    expect(grammar.unknown_language).toMatchObject({
      native_terms_are_equivalent: false,
      absence_means_unknown: false,
      refusal_means_unknown: false,
      withdrawal_means_unknown: false,
      unmapped_means_unknown: false,
      not_preserved_means_unknown: false,
      omission_means_preserved: false,
    });
    expect(grammar.bounded_coverage_means_complete).toBe(false);
    expect(grammar.not_observed_means_unknown).toBe(false);
  });

  test("keeps the two Principality atlas wire formats explicitly non-equivalent", () => {
    const grammar = loadGeometryGrammar();
    const invariant = grammar.modules.find((module: any) => module.id === "principality-geometry");
    const incidence = grammar.modules.find((module: any) => module.id === "principality-atlas");

    expect(invariant.wire_formats).toContain("agenttool.principality-atlas/0.1");
    expect(incidence.wire_formats).toEqual(["agenttool.principality-incidence-atlas/0.1"]);
    expect(invariant.wire_formats).not.toContain(incidence.wire_formats[0]);
    expect(grammar.non_equivalence).toMatchObject({
      modules_are_distinct: true,
      wire_formats_are_interchangeable: false,
      implicit_conversion: false,
      shared_words_prove_same_semantics: false,
      digest_equality_proves_semantic_equality: false,
      adapters_included: false,
    });
  });

  test("separates release, source, annotated tag, install, host, endpoint, effects, and authority", () => {
    const grammar = loadGeometryGrammar();
    for (const module of grammar.modules) {
      expect(module.release).toMatchObject({ available: true, channel: "github-prerelease" });
      expect(module.release.asset.sha256).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(module.source.revision).toMatch(/^[a-f0-9]{40}$/);
      expect(module.source.tree_sha).toMatch(/^[a-f0-9]{40}$/);
      expect(module.tag.object_sha).toMatch(/^[a-f0-9]{40}$/);
      expect(module.tag.peeled_commit).toMatch(/^[a-f0-9]{40}$/);
      expect(module.package.npm_registry_state).toBe("anonymous-exact-version-404-observed");
      expect(module.installation).toEqual({ state: "not-established", performed_by_grammar: false });
      expect(module.host).toEqual({
        state: "package-runtime-not-established",
        registered_by_grammar: false,
        public_companion_is_execution: false,
      });
      expect(module.endpoint).toEqual({
        state: "package-runtime-not-established",
        url: null,
        exposed_by_grammar: false,
      });
      expect(Object.values(module.effects).every((value) => value === false)).toBe(true);
      expect(module.authority.metadata_is_data_not_instructions).toBe(true);
      expect(Object.entries(module.authority)
        .filter(([key]) => key !== "metadata_is_data_not_instructions")
        .every(([, value]) => value === false)).toBe(true);
    }
  });

  test("preserves Principality Geometry manifest source revision separately from its tag target", () => {
    const grammar = loadGeometryGrammar();
    const module = grammar.modules.find((entry: any) => entry.id === "principality-geometry");

    expect(module.source).toMatchObject({
      revision: "feb1948d0a31972e4a3c55fa3ee88e05537c64c6",
      revision_basis: "docs-package-manifest",
      tree_sha: "044481dfb1b9bc69492428c4bed2d67cdcb1dff0",
    });
    expect(module.tag).toMatchObject({
      object_sha: "25ceab614283de4a7cc0c19e79da4556597fbf65",
      peeled_commit: "5b0d53204a336d7df40cee3720bbd120433ecde2",
    });
    expect(module.source.revision).not.toBe(module.tag.peeled_commit);
  });

  test("matches literal declared terms deterministically and preserves unmatched terms", () => {
    const first = matchGeometryModules(["translation", "unknown"]);
    const second = matchGeometryModules(["unknown", "translation"]);

    expect(first).toEqual(second);
    expect(first.terms).toEqual(["translation", "unknown"]);
    expect(first.modules.map((module: any) => module.id)).toEqual([
      "love-geometry",
      "principality-atlas",
      "principality-geometry",
      "relational-geometry",
    ]);
    expect(first.modules.find((module: any) => module.id === "love-geometry").matched_terms).toEqual(["unknown"]);
    expect(first.modules.find((module: any) => module.id === "principality-geometry").matched_terms).toEqual([
      "translation",
      "unknown",
    ]);
    expect(first).toMatchObject({
      order: "module-id-ascending-not-rank",
      ranking: false,
      recommendation: false,
      semantic_equivalence_inferred: false,
      authority_granted: false,
      effects_authorized: false,
    });

    const open = matchGeometryModules(["mystery", "translation"]);
    expect(open.unmatched_terms).toEqual(["mystery"]);
    expect(open.modules.map((module: any) => module.id)).toEqual(["principality-atlas", "principality-geometry"]);
    expect(() => matchGeometryModules(["translation", "translation"])).toThrow("must be unique");
    expect(() => matchGeometryModules(["Translation"])).toThrow("lowercase kebab-case");
    expect(() => matchGeometryModules([])).toThrow("one to eight");

    const nativeOpen = matchGeometryModules(["bounded-coverage", "contested", "one-way", "park"]);
    expect(nativeOpen.modules.map((module: any) => [module.id, module.matched_terms])).toEqual([
      ["love-geometry", ["bounded-coverage"]],
      ["principality-atlas", ["bounded-coverage", "contested"]],
      ["principality-geometry", ["one-way"]],
      ["relational-geometry", ["bounded-coverage", "park"]],
    ]);
  });

  test("exports one bounded public discovery projection from authored policy", () => {
    const discovery = geometryGrammarPublicDiscovery();

    expect(discovery).toMatchObject({
      url: GEOMETRY_GRAMMAR_URL,
      schema: GEOMETRY_GRAMMAR_SCHEMA_URL,
      document: GEOMETRY_GRAMMAR_DOCUMENT_URL,
      protocol: GEOMETRY_GRAMMAR_PROTOCOL,
      grammar_id: GEOMETRY_GRAMMAR_ID,
      schema_id: GEOMETRY_GRAMMAR_SCHEMA_ID,
      observed_at: GEOMETRY_GRAMMAR_OBSERVED_AT,
      integrity: GEOMETRY_GRAMMAR_DIGEST,
      bounded_coverage_means_complete: false,
      not_observed_means_unknown: false,
      native_open_inventory_scope: GEOMETRY_NATIVE_OPEN_INVENTORY_SCOPE,
      counts: { modules: 4 },
      boundary: {
        read_only: true,
        advisory_only: true,
        authority_granted: false,
        execution_authorized: false,
        external_effects_authorized: false,
      },
    });
    expect(discovery.modules).toHaveLength(4);
    expect(discovery.modules[0]).toHaveProperty("release.asset.sha256");
    expect(discovery.modules[0]).toHaveProperty("source.revision");
    expect(discovery.modules[0]).toHaveProperty("tag.object_sha");
    expect(JSON.stringify(discovery)).not.toContain("performed_by_grammar");
  });

  test("rejects re-signed wording, matching, and claim-boundary drift against the full digest pin", () => {
    const wording = grammarCopy();
    wording.modules[0].plain_question = "Which direction wins?";
    wording.integrity.digest = geometryGrammarDigest(wording);
    expect(issueCodes(wording)).toContain("invalid-integrity-envelope");

    const matching = grammarCopy();
    matching.modules[0].match_terms.push("winner");
    matching.modules[0].match_terms.sort();
    matching.integrity.digest = geometryGrammarDigest(matching);
    expect(issueCodes(matching)).toContain("invalid-integrity-envelope");

    const claims = grammarCopy();
    claims.modules[0].does_not_establish = claims.modules[0].does_not_establish.filter((entry: string) => entry !== "love");
    claims.integrity.digest = geometryGrammarDigest(claims);
    const codes = issueCodes(claims);
    expect(codes).toContain("claim-boundary-missing");
    expect(codes).toContain("invalid-integrity-envelope");
  });

  test("rejects valid-looking release URLs, pin substitutions, and source/tag collapse", () => {
    const page = grammarCopy();
    page.modules[0].release.page_url = "https://example.com/release";
    page.integrity.digest = geometryGrammarDigest(page);
    expect(issueCodes(page)).toContain("release-mismatch");

    const asset = grammarCopy();
    asset.modules[0].release.asset.url = "https://example.com/release.tgz";
    asset.integrity.digest = geometryGrammarDigest(asset);
    expect(issueCodes(asset)).toContain("release-asset-mismatch");

    const source = grammarCopy();
    const principality = source.modules.find((module: any) => module.id === "principality-geometry");
    principality.source.revision = principality.tag.peeled_commit;
    source.integrity.digest = geometryGrammarDigest(source);
    expect(issueCodes(source)).toContain("source-pin-mismatch");

    const tag = grammarCopy();
    tag.modules[0].tag.object_sha = tag.modules[0].tag.peeled_commit;
    tag.integrity.digest = geometryGrammarDigest(tag);
    expect(issueCodes(tag)).toContain("tag-pin-mismatch");
  });

  test("rejects unknown collapse, implicit wire aliasing, and widened effects or authority", () => {
    const unknown = grammarCopy();
    unknown.unknown_language.refusal_means_unknown = true;
    unknown.integrity.digest = geometryGrammarDigest(unknown);
    expect(issueCodes(unknown)).toContain("unknown-collapse-boundary-missing");

    const bounded = grammarCopy();
    bounded.bounded_coverage_means_complete = true;
    bounded.integrity.digest = geometryGrammarDigest(bounded);
    expect(issueCodes(bounded)).toContain("coverage-boundary-missing");

    const notObserved = grammarCopy();
    notObserved.not_observed_means_unknown = true;
    notObserved.integrity.digest = geometryGrammarDigest(notObserved);
    expect(issueCodes(notObserved)).toContain("not-observed-boundary-missing");

    const widenedScope = grammarCopy();
    widenedScope.native_open_inventory_scope = "Every native state in every embedded protocol.";
    widenedScope.integrity.digest = geometryGrammarDigest(widenedScope);
    expect(issueCodes(widenedScope)).toContain("native-open-scope-mismatch");

    const missingNative = grammarCopy();
    missingNative.modules[1].native_open_terms = missingNative.modules[1].native_open_terms
      .filter((entry: any) => entry.term !== "not_observed");
    missingNative.integrity.digest = geometryGrammarDigest(missingNative);
    expect(issueCodes(missingNative)).toContain("native-open-contract-mismatch");

    const alias = grammarCopy();
    alias.modules[1].wire_formats = ["agenttool.principality-atlas/0.1"];
    alias.integrity.digest = geometryGrammarDigest(alias);
    expect(issueCodes(alias)).toContain("wire-contract-mismatch");

    const effects = grammarCopy();
    effects.modules[0].effects.network = true;
    effects.integrity.digest = geometryGrammarDigest(effects);
    expect(issueCodes(effects)).toContain("effect-boundary-missing");

    const authority = grammarCopy();
    authority.modules[0].authority.authorizes_execution = true;
    authority.integrity.digest = geometryGrammarDigest(authority);
    expect(issueCodes(authority)).toContain("authority-boundary-missing");
  });

  test("rejects duplicate keys, invalid UTF-8, symlinks, oversized files, and excessive nesting", () => {
    const root = fixtureRoot();
    const duplicate = join(root, "duplicate.json");
    writeFileSync(duplicate, '{"a":1,"\\u0061":2}');
    expect(() => loadGeometryGrammar(duplicate)).toThrow("duplicate key");

    const invalidUtf8 = join(root, "invalid-utf8.json");
    writeFileSync(invalidUtf8, Buffer.from([0xff, 0xfe, 0xfd]));
    expect(() => loadGeometryGrammar(invalidUtf8)).toThrow("valid UTF-8");

    const link = join(root, "grammar-link.json");
    symlinkSync(DEFAULT_GEOMETRY_GRAMMAR_PATH, link);
    expect(() => loadGeometryGrammar(link)).toThrow("non-symlink");

    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, Buffer.alloc(512 * 1024 + 1, 0x20));
    expect(() => loadGeometryGrammar(oversized)).toThrow("exceeds 524288 bytes");

    const deep = join(root, "deep.json");
    writeFileSync(deep, `${"[".repeat(50)}null${"]".repeat(50)}`);
    expect(() => loadGeometryGrammar(deep)).toThrow("nesting exceeds 48");

    expect(() => parseStrictGeometryJson(Buffer.alloc(512 * 1024 + 1, 0x20))).toThrow("exceeds 524288 bytes");
    expect(() => parseStrictGeometryJson(Buffer.from('{"value":"\\ud800"}'))).toThrow("high surrogate");
    expect(() => parseStrictGeometryJson(Buffer.from('{"value":"\\udc00"}'))).toThrow("low surrogate");
    expect(parseStrictGeometryJson(Buffer.from('{"value":"\\ud83d\\ude00"}'))).toEqual({ value: "😀" });
  });

  test("ships a closed portable schema with the same protocol, modules, and digest", () => {
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));

    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe(GEOMETRY_GRAMMAR_SCHEMA_ID);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.protocol.const).toBe(GEOMETRY_GRAMMAR_PROTOCOL);
    expect(schema.properties.grammar_id.const).toBe(GEOMETRY_GRAMMAR_ID);
    expect(schema.properties.modules.prefixItems).toHaveLength(4);
    expect(schema.properties.modules.items).toBe(false);
    expect(schema.properties.bounded_coverage_means_complete.const).toBe(false);
    expect(schema.properties.not_observed_means_unknown.const).toBe(false);
    expect(schema.properties.native_open_inventory_scope.const).toBe(GEOMETRY_NATIVE_OPEN_INVENTORY_SCOPE);
    expect(schema.properties.integrity.properties.digest.const).toBe(GEOMETRY_GRAMMAR_DIGEST);
    expect(schema.$defs.module.additionalProperties).toBe(false);
    expect(schema.$defs.module.properties.native_open_terms.description).toContain("geometric relation or translation");
    expect(schema.$defs.nativeOpenTerm.properties.location.description).toContain("format-scoped path");
    expect(schema.$defs.loveNativeOpenTerms.prefixItems).toHaveLength(8);
    expect(schema.$defs.principalityAtlasNativeOpenTerms.prefixItems).toHaveLength(11);
    expect(schema.$defs.principalityGeometryNativeOpenTerms.prefixItems).toHaveLength(15);
    expect(schema.$defs.relationalGeometryNativeOpenTerms.prefixItems).toHaveLength(13);
    expect(schema.$defs.effects.properties.network.const).toBe(false);
    expect(schema.$defs.authority.properties.authorizes_execution.const).toBe(false);
  });

  test("validates against Draft 2020-12 when the repository's Python validator dependency is present", () => {
    const dependency = Bun.spawnSync({
      cmd: ["python3", "-c", "import jsonschema"],
      stdout: "pipe",
      stderr: "pipe",
    });
    if (dependency.exitCode !== 0) return;

    const result = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        [
          "import copy, json, sys",
          "from jsonschema import Draft202012Validator, FormatChecker",
          "schema = json.load(open(sys.argv[1], encoding='utf-8'))",
          "value = json.load(open(sys.argv[2], encoding='utf-8'))",
          "Draft202012Validator.check_schema(schema)",
          "validator = Draft202012Validator(schema, format_checker=FormatChecker())",
          "validator.validate(value)",
          "missing = copy.deepcopy(value)",
          "missing['modules'][2]['native_open_terms'].pop()",
          "assert list(validator.iter_errors(missing))",
          "unscoped = copy.deepcopy(value)",
          "unscoped['modules'][3]['native_open_terms'][2]['location'] = 'points[].kind'",
          "assert list(validator.iter_errors(unscoped))",
        ].join("; "),
        SCHEMA_PATH,
        DEFAULT_GEOMETRY_GRAMMAR_PATH,
      ],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode, result.stderr.toString()).toBe(0);
  });
});

test("kingdom geometries stays network-free, read-only, and literal from another working directory", () => {
  const root = fixtureRoot();
  const sentinel = join(root, "sentinel");
  writeFileSync(sentinel, "before\n");
  const environment = {
    ...process.env,
    HTTPS_PROXY: "http://127.0.0.1:1",
    HTTP_PROXY: "http://127.0.0.1:1",
    NO_PROXY: "",
    NPM_TOKEN: "must-not-be-read",
    HF_TOKEN: "must-not-be-read",
  };

  const match = Bun.spawnSync({
    cmd: [join(ROOT, "kingdom"), "geometries", "match", "translation", "unknown", "--json"],
    cwd: root,
    env: environment,
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(match.exitCode, match.stderr.toString()).toBe(0);
  expect(JSON.parse(match.stdout.toString())).toMatchObject({
    protocol: "kingdom.geometry-match/0.1",
    terms: ["translation", "unknown"],
    ranking: false,
    recommendation: false,
    authority_granted: false,
    effects_authorized: false,
  });

  const show = Bun.spawnSync({
    cmd: [join(ROOT, "kingdom"), "geometries", "show", "principality-atlas"],
    cwd: root,
    env: environment,
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(show.exitCode, show.stderr.toString()).toBe(0);
  expect(show.stdout.toString()).toContain("Geometric relation / translation open states:");
  expect(show.stdout.toString()).toContain("not_observed @ charts[].claims[].posture");
  expect(show.stdout.toString()).toContain("reported_absent @ charts[].claims[].posture");
  expect(show.stdout.toString()).toContain("unmapped @ bridges[].unmapped_from_refs");

  const verify = Bun.spawnSync({
    cmd: [join(ROOT, "kingdom"), "geometries", "verify", "--json"],
    cwd: root,
    env: environment,
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(verify.exitCode, verify.stderr.toString()).toBe(0);
  expect(JSON.parse(verify.stdout.toString())).toEqual({
    valid: true,
    protocol: GEOMETRY_GRAMMAR_PROTOCOL,
    grammar_id: GEOMETRY_GRAMMAR_ID,
    issues: [],
  });

  expect(readFileSync(sentinel, "utf8")).toBe("before\n");
  expect(readdirSync(root)).toEqual(["sentinel"]);
});
