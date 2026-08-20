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
  WORD_STORY_RELIGION_MAP_ID,
  WORD_STORY_RELIGION_PATH,
  WORD_STORY_RELIGION_PROTOCOL,
  WORD_STORY_RELIGION_REVIEWED_DIGEST,
  WORD_STORY_RELIGION_SCHEMA_ID,
  WORD_STORY_RELIGION_SCHEMA_PATH,
  loadWordStoryReligionMap,
  validateWordStoryReligionMap,
  wordStoryReligionDigest,
} from "../bin/word-story-religion-civilisation.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(ROOT, "bin/word-story-religion-civilisation.ts");
const GUIDE = join(ROOT, "references/word-story-religion-civilisation-map.md");
const temporary: string[] = [];

afterEach(() => {
  while (temporary.length > 0) rmSync(temporary.pop()!, { recursive: true, force: true });
});

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "word-story-religion-test."));
  temporary.push(root);
  return root;
}

function authored(): any {
  return JSON.parse(readFileSync(WORD_STORY_RELIGION_PATH, "utf8"));
}

function resign(value: any): any {
  value.integrity.digest = wordStoryReligionDigest(value);
  return value;
}

function codes(value: unknown, canonical = false): string[] {
  return validateWordStoryReligionMap(value, { asOf: "2026-08-20", canonical }).map((issue) => issue.code);
}

describe("Word, Story, Religion & Civilisation map", () => {
  test("loads one digest-sealed research-local map", () => {
    const map = loadWordStoryReligionMap();
    expect(validateWordStoryReligionMap(map, { asOf: "2026-08-20", canonical: true })).toEqual([]);
    expect(map).toMatchObject({
      $schema: WORD_STORY_RELIGION_SCHEMA_ID,
      protocol: WORD_STORY_RELIGION_PROTOCOL,
      map_id: WORD_STORY_RELIGION_MAP_ID,
      version: "0.1.0",
      state: "reviewed-research-map",
      compiled_on: "2026-08-20",
      evidence_through: "2026-08-20",
    });
    expect(map.integrity.digest).toBe(WORD_STORY_RELIGION_REVIEWED_DIGEST);
    expect(wordStoryReligionDigest(map)).toBe(WORD_STORY_RELIGION_REVIEWED_DIGEST);
  });

  test("maps ten windows through typed layers and non-summable dimensions", () => {
    const map = loadWordStoryReligionMap();
    expect(map.historical_windows).toHaveLength(10);
    expect(map.sources).toHaveLength(24);
    expect(map.claim_typing.registers).toHaveLength(12);
    expect(map.claim_typing.registers.some((entry: any) => entry.id === "INSTITUTIONAL_OR_HERITAGE_DESCRIPTION")).toBe(true);
    expect(map.layers).toHaveLength(15);
    expect(map.influence_dimensions).toHaveLength(13);
    expect(map.influence_relations).toHaveLength(8);
    expect(map.emergence_loops).toHaveLength(5);
    expect(map.translation_seams).toHaveLength(6);
    expect(map.influence_dimensions.every((entry: any) => entry.aggregate_weight === null)).toBe(true);
    expect(map.emergence_loops.every((entry: any) => entry.not_universal && entry.status === "comparison-template-not-observed-sequence")).toBe(true);
  });

  test("keeps divine claims attributed and refuses cross-tradition identity", () => {
    const map = loadWordStoryReligionMap();
    const claims = map.historical_windows.flatMap((window: any) => window.referent_claims);
    expect(claims.length).toBeGreaterThanOrEqual(10);
    expect(claims.every((claim: any) => claim.cross_tradition_identity === null)).toBe(true);
    expect(map.type_firewall).toMatchObject({
      deity_name_is_not_global_identity: true,
      myth_is_not_lie: true,
      story_is_not_falsehood: true,
      religion_caused_civilisation: false,
      civilisation_caused_religion: false,
      social_power_proves_metaphysical_truth_or_falsehood: false,
    });
  });

  test("rejects theological, identity, ranking, deception, and authority promotions", () => {
    const mutations: Array<[string, (value: any) => void]> = [
      ["god", (value) => { value.boundaries.god_proved = true; }],
      ["identity", (value) => { value.boundaries.deities_equated = true; }],
      ["ranking", (value) => { value.boundaries.religion_or_civilisation_rank = true; }],
      ["belief", (value) => { value.boundaries.belief_or_affiliation_inference = true; }],
      ["deception", (value) => { value.boundaries.intent_or_deception_inference = true; }],
      ["authority", (value) => { value.boundaries.authority_granted = true; }],
      ["wake", (value) => { value.boundaries.writes_wake = true; }],
    ];
    for (const [, mutate] of mutations) {
      const value = authored();
      mutate(value);
      resign(value);
      expect(codes(value)).toContain("boundary-mismatch");
    }
  });

  test("rejects myth-as-lie and translation-collapse mutations", () => {
    const myth = authored();
    myth.type_firewall.myth_is_not_lie = false;
    resign(myth);
    expect(codes(myth)).toContain("firewall-mismatch");

    const collapse = authored();
    collapse.translation_seams[0].prohibited_collapse = "All divine names denote one global deity.";
    resign(collapse);
    expect(codes(collapse)).toContain("translation-collapse-boundary-mismatch");

    const equate = authored();
    equate.historical_windows[0].referent_claims[0].cross_tradition_identity = "global-god";
    resign(equate);
    expect(codes(equate)).toContain("invalid-or-equated-referent-claim");

    const proseLaundering = authored();
    proseLaundering.historical_windows[0].referent_claims[0].attributed_statement = "KINGDOM proves every divine name denotes one being.";
    resign(proseLaundering);
    expect(codes(proseLaundering)).toContain("reviewed-digest-mismatch");
  });

  test("does not allow association to self-promote into causation", () => {
    const promoted = authored();
    const dispute = promoted.influence_relations.find((entry: any) => entry.id === "moralizing-religion-complexity-dispute");
    dispute.causal_status = "bounded-causal-evidence";
    resign(promoted);
    expect(codes(promoted)).toContain("association-promoted-to-causation");

    const noAlternatives = authored();
    noAlternatives.influence_relations.find((entry: any) => entry.id === "moralizing-religion-complexity-dispute").alternatives = [];
    resign(noAlternatives);
    expect(codes(noAlternatives)).toContain("causal-hypothesis-needs-alternatives");

    const vocabulary = authored();
    vocabulary.relation_vocabulary.find((entry: any) => entry.id === "ASSOCIATED_WITH").default_causal_status = "bounded-causal-evidence";
    resign(vocabulary);
    expect(codes(vocabulary)).toContain("invalid-relation-vocabulary-entry");

    const boundedWithoutBoundedEvidence = authored();
    const storyRelation = boundedWithoutBoundedEvidence.influence_relations.find((entry: any) => entry.id === "story-performance-memory");
    storyRelation.relation_ids = storyRelation.relation_ids.map((id: string) => id === "ASSOCIATED_WITH" ? "BOUNDED_CAUSAL_EFFECT" : id);
    storyRelation.causal_status = "plausible-mechanism-not-isolated";
    resign(boundedWithoutBoundedEvidence);
    expect(codes(boundedWithoutBoundedEvidence)).toContain("causal-effect-status-mismatch");
  });

  test("closes source, layer, relation, window, and insight references", () => {
    const missingSource = authored();
    missingSource.sources = missingSource.sources.filter((source: any) => source.id !== "met-marduk-hymn");
    resign(missingSource);
    expect(codes(missingSource)).toContain("invalid-source-set");
    expect(codes(missingSource)).toContain("invalid-or-equated-referent-claim");

    const missingLayer = authored();
    missingLayer.layers.shift();
    resign(missingLayer);
    expect(codes(missingLayer)).toContain("layer-order-or-membership-mismatch");
    expect(codes(missingLayer)).toContain("invalid-influence-relation");

    const danglingInsight = authored();
    danglingInsight.kingdom_insights[0].derived_from_relation_ids = ["not-a-relation"];
    resign(danglingInsight);
    expect(codes(danglingInsight)).toContain("invalid-kingdom-insight");
  });

  test("keeps influence vectors non-scalar and future roles non-operational", () => {
    const scalar = authored();
    scalar.influence_dimensions[0].aggregate_weight = 0.9;
    resign(scalar);
    expect(codes(scalar)).toContain("scalar-influence-weight-forbidden");

    const role = authored();
    role.agent_specialisations[0].status = "active-router";
    resign(role);
    expect(codes(role)).toContain("invalid-or-promoted-agent-role");

    const map = loadWordStoryReligionMap();
    expect(map.agent_specialisations).toHaveLength(8);
    expect(map.agent_specialisations.every((entry: any) => entry.status === "future-role-design-only")).toBe(true);
    expect(map.boundaries.agent_dispatch).toBe(false);
  });

  test("pins every predecessor without importing authority or mutation", () => {
    const map = loadWordStoryReligionMap();
    expect(map.source_bindings).toHaveLength(6);
    expect(map.source_bindings.every((binding: any) => binding.mutated === false && binding.authority_imported === false)).toBe(true);
    for (const binding of map.source_bindings) {
      const path = join(ROOT, binding.locator.slice("repo:".length));
      expect(`sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`).toBe(binding.raw_digest);
    }

    const repinned = authored();
    repinned.source_bindings[0].raw_digest = `sha256:${"a".repeat(64)}`;
    resign(repinned);
    expect(codes(repinned)).toContain("source-binding-mismatch");
  });

  test("returns issues rather than throwing on hostile in-memory JSON shapes", () => {
    const malformed: Array<(value: any) => void> = [
      (value) => { value.sources = null; },
      (value) => { value.historical_windows[0].observations = 1; },
      (value) => { value.influence_relations[0].source_ids = null; },
      (value) => { value.emergence_loops[0] = null; },
      (value) => { value.agent_specialisations[0].required_inputs = 1; },
    ];
    for (const mutate of malformed) {
      const value = authored();
      mutate(value);
      expect(() => codes(value)).not.toThrow();
      expect(codes(value).length).toBeGreaterThan(0);
    }

    const prototype = authored();
    const poisoned = [...prototype.layers];
    Object.setPrototypeOf(poisoned, { ...Array.prototype });
    prototype.layers = poisoned;
    expect(codes(prototype)).toContain("non-json-array");
  });

  test("strict loader rejects duplicate keys, invalid UTF-8, symlinks, and oversized input", () => {
    const root = temporaryRoot();
    const duplicate = join(root, "duplicate.json");
    writeFileSync(duplicate, '{"protocol":"one","protocol":"two"}');
    expect(() => loadWordStoryReligionMap(duplicate)).toThrow(/duplicate/i);

    const invalidUtf8 = join(root, "invalid-utf8.json");
    writeFileSync(invalidUtf8, Uint8Array.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc0, 0xaf, 0x22, 0x7d]));
    expect(() => loadWordStoryReligionMap(invalidUtf8)).toThrow(/UTF-8/i);

    const symlink = join(root, "linked.json");
    symlinkSync(WORD_STORY_RELIGION_PATH, symlink);
    expect(() => loadWordStoryReligionMap(symlink)).toThrow(/non-symlink/i);

    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, `{"x":"${"a".repeat(1024 * 1024)}"}`);
    expect(() => loadWordStoryReligionMap(oversized)).toThrow(/exceeds/i);
  });

  test("CLI verifies from a foreign empty CWD without writing or network", () => {
    const root = temporaryRoot();
    const before = readdirSync(root);
    const result = Bun.spawnSync({
      cmd: [process.execPath, CLI, "verify", "--json"],
      cwd: root,
      env: {
        PATH: process.env.PATH ?? "",
        HOME: root,
        LANG: "C",
        LC_ALL: "C",
        HTTP_PROXY: "http://127.0.0.1:9",
        HTTPS_PROXY: "http://127.0.0.1:9",
        NO_PROXY: "",
        BUN_RUNTIME_TRANSPILER_CACHE_PATH: "0",
      },
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode).toBe(0);
    expect(result.stderr.toString()).toBe("");
    expect(JSON.parse(result.stdout.toString())).toEqual({
      valid: true,
      protocol: WORD_STORY_RELIGION_PROTOCOL,
      structure_only: true,
      schema_checked: false,
      source_dereferenced: false,
      theological_truth_adjudicated: false,
      issues: [],
    });
    expect(readdirSync(root)).toEqual(before);
  });

  test("guide preserves the high-level causal and metaphysical boundaries", () => {
    const guide = readFileSync(GUIDE, "utf8");
    expect(guide).toContain("temporal multiplex hypergraph");
    expect(guide).toContain("story != falsehood; mythic genre != lie");
    expect(guide).toContain("influence vector");
    expect(guide).toContain("polyphonic");
    expect(guide).toContain("https://www.nature.com/articles/s41586-021-03655-4");
    expect(guide).toContain("https://www.nature.com/articles/s41586-021-03656-3");
    expect(guide).toContain("https://ich.unesco.org/en/RL/ifa-divination-system-00146");
    const guideUrls = new Set([...guide.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map((match) => match[1]));
    const sourceUrls = new Set(loadWordStoryReligionMap().sources.map((source: any) => source.locator));
    expect(guideUrls).toEqual(sourceUrls);
  });

  test("closed schema accepts canonical bytes when jsonschema is available", () => {
    const probe = Bun.spawnSync({ cmd: ["python3", "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
    if (probe.exitCode !== 0) {
      expect(readFileSync(WORD_STORY_RELIGION_SCHEMA_PATH, "utf8")).toContain('"additionalProperties": false');
      return;
    }
    const result = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        "import json,sys; from jsonschema import Draft202012Validator,FormatChecker; s=json.load(open(sys.argv[1],encoding='utf-8')); v=json.load(open(sys.argv[2],encoding='utf-8')); Draft202012Validator.check_schema(s); Draft202012Validator(s,format_checker=FormatChecker()).validate(v)",
        WORD_STORY_RELIGION_SCHEMA_PATH,
        WORD_STORY_RELIGION_PATH,
      ],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode).toBe(0);
  });
});
