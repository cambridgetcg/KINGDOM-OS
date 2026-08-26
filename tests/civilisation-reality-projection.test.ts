import { afterEach, describe, expect, test } from "bun:test";
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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CIVILISATION_REALITY_PROJECTION_ID,
  CIVILISATION_REALITY_PROJECTION_PATH,
  CIVILISATION_REALITY_PROJECTION_PROTOCOL,
  CIVILISATION_REALITY_PROJECTION_REVIEWED_DIGEST,
  CIVILISATION_REALITY_PROJECTION_SCHEMA_ID,
  CIVILISATION_REALITY_PROJECTION_SCHEMA_PATH,
  civilisationRealityProjectionDigest,
  civilisationRealityPublicDiscovery,
  loadCivilisationRealityProjection,
  validateCivilisationRealityProjection,
} from "../bin/civilisation-reality-projection.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(ROOT, "bin/civilisation-reality-projection.ts");
const KINGDOM = join(ROOT, "kingdom");
const GUIDE = join(ROOT, "references/civilisation-reality-projection.md");
const WORD_STORY = join(ROOT, "data/language/word-story-religion-civilisation-map.v0.1.json");
const REALITY = join(ROOT, "data/reality/reality-influence-map.v0.1.json");
const temporary: string[] = [];

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop()!, { recursive: true, force: true });
});

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "civilisation-reality-test."));
  temporary.push(root);
  return root;
}

function authored(): any {
  return JSON.parse(readFileSync(CIVILISATION_REALITY_PROJECTION_PATH, "utf8"));
}

function resign(value: any): any {
  value.integrity.digest = civilisationRealityProjectionDigest(value);
  return value;
}

function codes(value: unknown): string[] {
  return validateCivilisationRealityProjection(value).map((issue) => issue.code);
}

function sha256(path: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}

function collectObjectSchemas(value: unknown, found: any[] = []): any[] {
  if (value === null || typeof value !== "object") return found;
  if (!Array.isArray(value) && (value as any).type === "object") found.push(value);
  for (const child of Object.values(value)) collectObjectSchemas(child, found);
  return found;
}

describe("Civilisation → Reality Projection", () => {
  test("loads one digest-sealed thin additive crosswalk", () => {
    const projection = loadCivilisationRealityProjection();
    expect(validateCivilisationRealityProjection(projection, { canonical: true })).toEqual([]);
    expect(projection).toMatchObject({
      $schema: CIVILISATION_REALITY_PROJECTION_SCHEMA_ID,
      protocol: CIVILISATION_REALITY_PROJECTION_PROTOCOL,
      projection_id: CIVILISATION_REALITY_PROJECTION_ID,
      version: "0.1.0",
      compiled_on: "2026-08-25",
      evidence_through: "2026-08-21",
      state: "reviewed-thin-additive-crosswalk",
    });
    expect(projection.integrity.digest).toBe(CIVILISATION_REALITY_PROJECTION_REVIEWED_DIGEST);
    expect(civilisationRealityProjectionDigest(projection))
      .toBe(CIVILISATION_REALITY_PROJECTION_REVIEWED_DIGEST);
  });

  test("binds exact immutable predecessors without republishing or importing authority", () => {
    const projection = loadCivilisationRealityProjection();
    expect(projection.predecessor_bindings).toEqual([
      {
        id: "word-story-religion-civilisation",
        protocol: "kingdom.word-story-religion-civilisation-map/0.1",
        map_id: "word-story-religion-civilisation-2026-08-20",
        locator: "repo:data/language/word-story-religion-civilisation-map.v0.1.json",
        raw_digest: "sha256:a4a87b7b23dbdf7e7e6689b5083f76a746c7f41bc56f2124281dfda609a62479",
        semantic_digest: "sha256:0c791b2491ebdcd85cf58e26e41e8b35b883781fd26bccc19dfd3f7853c7855a",
        relation: "source-concept-predecessor",
        mutated: false,
        republished: false,
        authority_imported: false,
      },
      {
        id: "reality-influence-claim-graph",
        protocol: "kingdom.reality-influence-claim-graph/0.1",
        map_id: "reality-influence-claim-graph-2026-08-21",
        locator: "repo:data/reality/reality-influence-map.v0.1.json",
        raw_digest: "sha256:4d68be39226c8d5451c8d9166fa74ba54bb793b7655f119d8765090cbbcf890e",
        semantic_digest: "sha256:45d4323d1a6190b3c333f02f2c744858e8da27944fbcb2042fbae492ca6e31ac",
        relation: "target-claim-boundary-predecessor",
        mutated: false,
        republished: false,
        authority_imported: false,
      },
    ]);
    expect(sha256(WORD_STORY)).toBe(projection.predecessor_bindings[0].raw_digest);
    expect(sha256(REALITY)).toBe(projection.predecessor_bindings[1].raw_digest);
    expect(JSON.parse(readFileSync(WORD_STORY, "utf8")).integrity.digest)
      .toBe(projection.predecessor_bindings[0].semantic_digest);
    expect(JSON.parse(readFileSync(REALITY, "utf8")).integrity.digest)
      .toBe(projection.predecessor_bindings[1].semantic_digest);
  });

  test("qualifies native source IDs and closes every target ID over the Reality binding", () => {
    const projection = loadCivilisationRealityProjection();
    const source = JSON.parse(readFileSync(WORD_STORY, "utf8"));
    const target = JSON.parse(readFileSync(REALITY, "utf8"));
    const sourceRelations = new Set(source.influence_relations.map(({ id }: any) => id));
    const sourceInsights = new Set(source.kingdom_insights.map(({ id }: any) => id));
    const targetSets = {
      target_domain_ids: new Set(target.reality_domains.map(({ id }: any) => id)),
      target_node_type_ids: new Set(target.claim_node_types.map(({ id }: any) => id)),
      target_relation_ids: new Set(target.relation_vocabulary.map(({ id }: any) => id)),
      target_ladder_ids: new Set(target.claim_ladder.map(({ id }: any) => id)),
      target_pathway_ids: new Set(target.pathway_templates.map(({ id }: any) => id)),
    };
    const relationCards = new Map(target.relation_vocabulary.map((relation: any) => [relation.id, relation]));

    for (const crosswalk of projection.crosswalks) {
      expect(crosswalk.source_binding_ids).toEqual(["word-story-religion-civilisation"]);
      expect(crosswalk.source_relation_ids.every((id: string) => sourceRelations.has(id))).toBe(true);
      expect(crosswalk.source_insight_ids.every((id: string) => sourceInsights.has(id))).toBe(true);
      for (const [field, universe] of Object.entries(targetSets)) {
        expect(crosswalk[field].every((id: string) => universe.has(id))).toBe(true);
      }

      const nodes = new Set<string>(crosswalk.target_node_type_ids);
      for (const relationId of crosswalk.target_relation_ids) {
        const relation: any = relationCards.get(relationId);
        expect(relation).toBeDefined();
        expect(relation.from_kind_ids.some((id: string) => nodes.has(id))).toBe(true);
        expect(relation.to_kind_ids.some((id: string) => nodes.has(id))).toBe(true);
      }
    }
  });

  test("keeps exactly six design crosswalks and the ten-rule non-inference firewall", () => {
    const projection = loadCivilisationRealityProjection();
    expect(projection.crosswalks.map(({ id }: any) => id)).toEqual([
      "naming-to-expression",
      "story-to-public-deliberation",
      "canon-to-selection-feedback",
      "legitimation-to-decision-authority-separation",
      "translation-to-claim-assessment",
      "counterstory-to-challenge-repair",
    ]);
    expect(projection.projection_rules).toEqual({
      source_claims_remain_in_predecessor: true,
      qualified_predecessor_ids_required: true,
      no_transitive_influence: true,
      no_cross_register_promotion: true,
      association_is_not_causation: true,
      historical_claim_is_not_design_mandate: true,
      design_commitment_is_not_historical_finding: true,
      metaphysical_non_adjudication: true,
      influence_is_non_summable: true,
      no_person_community_religion_or_civilisation_score: true,
    });
    expect(projection.crosswalks.every((crosswalk: any) =>
      crosswalk.register === "DESIGN_COMMITMENT" &&
      crosswalk.transfer_status === "projection-not-historical-or-causal-finding" &&
      crosswalk.preserved_distinctions.length >= 2 &&
      crosswalk.required_evidence.length >= 2 &&
      crosswalk.alternative_paths.length >= 2 &&
      crosswalk.stop_conditions.length >= 2 &&
      crosswalk.external_effect_claimed === false &&
      crosswalk.authority_granted === false)).toBe(true);
  });

  test("names nine unsupported domains instead of filling them by analogy", () => {
    const projection = loadCivilisationRealityProjection();
    expect(projection.open_domains.map(({ id }: any) => id)).toEqual([
      "war-and-organised-violence",
      "coercion-and-security-capacity",
      "class-and-resource-asymmetry",
      "status-hierarchy-and-elite-fracture",
      "collective-emotion-and-affect",
      "revolution-and-regime-change",
      "fiscal-and-economic-shocks",
      "propaganda-media-and-information-power",
      "citizen-governance-dynamics",
    ]);
    expect(projection.open_domains.every((domain: any) =>
      domain.coverage_status === "not-supported-by-pinned-predecessors" &&
      domain.why_not_projectable.length > 0 &&
      domain.needed_evidence.length >= 2 &&
      domain.stop_condition.length > 0)).toBe(true);
    expect(projection.boundaries).toMatchObject({
      unsupported_domains_filled: false,
      score_or_rank: false,
      causal_claim_created: false,
      metaphysical_verdict: false,
      belief_identity_intent_or_emotion_inferred: false,
      person_or_group_targeting: false,
      persuasion_or_propaganda_design: false,
      authority_granted: false,
      action_attempted: false,
      action_executed: false,
      external_effect_claimed: false,
      automatic_action: false,
    });
  });

  test("rejects resigned claim promotion, binding drift, vocabulary drift, and filled open domains", () => {
    const mutations: Array<[string, (value: any) => void]> = [
      ["unexpected-or-missing-field", (value) => { value.extra = true; }],
      ["projection-rule-firewall-mismatch", (value) => { value.projection_rules.no_transitive_influence = false; }],
      ["predecessor-binding-mismatch", (value) => { value.predecessor_bindings[0].raw_digest = `sha256:${"0".repeat(64)}`; }],
      ["crosswalk-mismatch-or-claim-promotion", (value) => { value.crosswalks[0].source_binding_ids = []; }],
      ["crosswalk-mismatch-or-claim-promotion", (value) => { value.crosswalks[0].target_relation_ids = ["CAUSES"]; }],
      ["crosswalk-mismatch-or-claim-promotion", (value) => { value.crosswalks[0].register = "HISTORICAL_SCHOLARSHIP"; }],
      ["crosswalk-mismatch-or-claim-promotion", (value) => { value.crosswalks[0].external_effect_claimed = true; }],
      ["open-domain-order-or-membership-mismatch", (value) => { value.open_domains.pop(); }],
      ["invalid-or-filled-open-domain", (value) => { value.open_domains[0].coverage_status = "supported"; }],
      ["boundary-mismatch", (value) => { value.boundaries.authority_granted = true; }],
    ];
    for (const [expected, mutate] of mutations) {
      const value = authored();
      mutate(value);
      resign(value);
      expect(codes(value)).toContain(expected);
    }
  });

  test("strict loader rejects duplicate keys, invalid UTF-8, symlinks, and oversized files", () => {
    const root = temporaryRoot();
    const duplicate = join(root, "duplicate.json");
    writeFileSync(duplicate, '{"protocol":"one","protocol":"two"}');
    expect(() => loadCivilisationRealityProjection(duplicate)).toThrow(/duplicate key/i);

    const invalidUtf8 = join(root, "invalid-utf8.json");
    writeFileSync(invalidUtf8, Uint8Array.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d]));
    expect(() => loadCivilisationRealityProjection(invalidUtf8)).toThrow(/UTF-8/i);

    const linked = join(root, "linked.json");
    symlinkSync(CIVILISATION_REALITY_PROJECTION_PATH, linked);
    expect(() => loadCivilisationRealityProjection(linked)).toThrow(/non-symlink/i);

    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, `{"x":"${"a".repeat(512 * 1024)}"}`);
    expect(() => loadCivilisationRealityProjection(oversized)).toThrow(/exceeds/i);
  });

  test("CLI and root dispatch are deterministic, foreign-CWD safe, network-free, and write nothing", () => {
    const root = temporaryRoot();
    const before = readdirSync(root);
    const env = {
      PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
      LANG: "C",
      LC_ALL: "C",
      HTTP_PROXY: "http://127.0.0.1:9",
      HTTPS_PROXY: "http://127.0.0.1:9",
      ALL_PROXY: "http://127.0.0.1:9",
      NO_PROXY: "",
      BUN_RUNTIME_TRANSPILER_CACHE_PATH: "0",
    };
    const run = (cmd: string[]) => Bun.spawnSync({ cmd, cwd: root, env, stdout: "pipe", stderr: "pipe" });

    const verify = run([process.execPath, CLI, "verify", "--json"]);
    expect(verify.exitCode).toBe(0);
    expect(verify.stderr.toString()).toBe("");
    expect(JSON.parse(verify.stdout.toString())).toEqual({
      valid: true,
      protocol: CIVILISATION_REALITY_PROJECTION_PROTOCOL,
      structure_only: true,
      schema_checked: false,
      predecessor_files_digest_checked: true,
      source_dereferenced: false,
      unsupported_domains_filled: false,
      score_causation_metaphysics_or_authority_established: false,
      action_or_external_effect_created: false,
      issues: [],
    });

    for (const command of ["overview", "crosswalks", "open-domains", "boundaries", "discovery"]) {
      const result = run([process.execPath, CLI, command, "--json"]);
      expect(result.exitCode).toBe(0);
      expect(result.stderr.toString()).toBe("");
      expect(() => JSON.parse(result.stdout.toString())).not.toThrow();
    }

    const dispatch = run([KINGDOM, "civilisation-reality", "discovery", "--json"]);
    expect(dispatch.exitCode).toBe(0);
    expect(JSON.parse(dispatch.stdout.toString())).toEqual(civilisationRealityPublicDiscovery());
    expect(readdirSync(root)).toEqual(before);

    const inherited = run([process.execPath, CLI, "toString", "--json"]);
    expect(inherited.exitCode).toBe(2);
    expect(inherited.stdout.toString()).toBe("");
    expect(inherited.stderr.toString()).toContain("usage:");
  });

  test("public discovery, guide, closed schema, and source retain the static non-effect boundary", () => {
    expect(civilisationRealityPublicDiscovery()).toMatchObject({
      protocol: CIVILISATION_REALITY_PROJECTION_PROTOCOL,
      projection_id: CIVILISATION_REALITY_PROJECTION_ID,
      publication_state: "immutable-versioned-static-family",
      counts: { predecessor_bindings: 2, crosswalks: 6, open_domains: 9 },
      boundary: {
        public_static_publication_family: true,
        predecessor_mutation: false,
        predecessor_republication: false,
        causal_claim_created: false,
        metaphysical_verdict: false,
        authority_granted: false,
        external_effect_claimed: false,
        publication_trigger: false,
        deployment_trigger: false,
        automatic_action: false,
      },
    });

    const guide = readFileSync(GUIDE, "utf8");
    for (const phrase of [
      "kingdom.civilisation-reality-projection/0.1",
      "Why a thin projection",
      "The projection firewall",
      "Six crosswalks",
      "decision is not authority",
      "Nine domains deliberately left open",
      "Propaganda, media, and information power",
      "Citizen–governance dynamics",
      "What this offers KINGDOM",
      "Fixed non-effects",
    ]) expect(guide).toContain(phrase);

    const schemaText = readFileSync(CIVILISATION_REALITY_PROJECTION_SCHEMA_PATH, "utf8");
    const schema = JSON.parse(schemaText);
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe(CIVILISATION_REALITY_PROJECTION_SCHEMA_ID);
    expect(collectObjectSchemas(schema).every((entry) => entry.additionalProperties === false)).toBe(true);

    const source = readFileSync(CLI, "utf8");
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toContain('from "node:http');
    expect(source).not.toContain('from "node:https');
    expect(source).not.toContain('from "node:child_process');
    expect(source).not.toContain("Bun.spawn");
  });

  test("closed Draft 2020-12 schema validates canonical bytes when host jsonschema is available", () => {
    const schemaText = readFileSync(CIVILISATION_REALITY_PROJECTION_SCHEMA_PATH, "utf8");
    const probe = Bun.spawnSync({
      cmd: ["python3", "-c", "import jsonschema"],
      stdout: "pipe",
      stderr: "pipe",
    });
    if (probe.exitCode !== 0) {
      expect(schemaText).toContain('"additionalProperties": false');
      return;
    }
    const result = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        "import json,sys; from jsonschema import Draft202012Validator; s=json.load(open(sys.argv[1],encoding='utf-8')); v=json.load(open(sys.argv[2],encoding='utf-8')); Draft202012Validator.check_schema(s); Draft202012Validator(s).validate(v)",
        CIVILISATION_REALITY_PROJECTION_SCHEMA_PATH,
        CIVILISATION_REALITY_PROJECTION_PATH,
      ],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode).toBe(0);
    expect(result.stderr.toString()).toBe("");
  });
});
