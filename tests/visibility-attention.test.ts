import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  VISIBILITY_ATTENTION_DIGEST,
  VISIBILITY_ATTENTION_ID,
  VISIBILITY_ATTENTION_PATH,
  VISIBILITY_ATTENTION_PROTOCOL,
  loadVisibilityAttentionTranslation,
  verifyVisibilityAttentionTranslation,
  visibilityAttentionDigest,
  visibilityAttentionPublicDiscovery,
} from "../bin/visibility-attention.ts";

const ROOT = dirname(dirname(dirname(VISIBILITY_ATTENTION_PATH)));
const temporary: string[] = [];
afterEach(() => { while (temporary.length) rmSync(temporary.pop()!, { recursive: true, force: true }); });
function fixtureRoot(): string { const root = mkdtempSync(join(tmpdir(), "visibility-attention-test.")); temporary.push(root); return root; }
function authored(): any { return JSON.parse(readFileSync(VISIBILITY_ATTENTION_PATH, "utf8")); }
function resign(value: any): any { value.integrity.digest = visibilityAttentionDigest(value); return value; }
function codes(value: unknown): string[] { return verifyVisibilityAttentionTranslation(value).map((issue) => issue.code); }

describe("Visibility & Attention Translation", () => {
  test("loads one reviewed four-register translation with exact local geometry", () => {
    const value = loadVisibilityAttentionTranslation();
    expect(verifyVisibilityAttentionTranslation(value)).toEqual([]);
    expect(value).toMatchObject({
      protocol: VISIBILITY_ATTENTION_PROTOCOL,
      translation_id: VISIBILITY_ATTENTION_ID,
      title: "Visibility is not existence",
      compiled_on: "2026-08-13",
      evidence_through: "2026-08-13",
    });
    expect(value.integrity.digest).toBe(VISIBILITY_ATTENTION_DIGEST);
    expect(visibilityAttentionDigest(value)).toBe(VISIBILITY_ATTENTION_DIGEST);
    expect(value.registers.map((item: any) => item.id)).toEqual([
      "material-science", "computational-social-science", "lexical-usage", "zerone-karma",
    ]);
    expect(value.local_models.map((item: any) => [item.id, item.equation])).toEqual([
      ["finite-window-crystal-detection", "P(T_detect <= t) = 1 - exp[-J V max(t - t_g, 0)]"],
      ["retrospective-diffusion-tree-geometry", "nu(T) = 2/[n(n-1)] sum_{i<j} d_T(i,j), for n >= 2"],
    ]);
    expect(value.translation_seams.map((item: any) => item.kind)).toEqual([
      "ANALOGY_ONLY", "MATHEMATICAL_TRANSLATION", "DESIGN_CORRESPONDENCE",
    ]);
  });

  test("keeps every model local, retrospective, non-personal, and non-optimizing", () => {
    const models = loadVisibilityAttentionTranslation().local_models;
    expect(models).toHaveLength(2);
    expect(models.map((item: any) => item.variables.map((term: any) => term.symbol))).toEqual([
      ["T_detect", "t", "J", "V", "t_g"],
      ["T", "n", "d_T(i,j)", "nu(T)"],
    ]);
    expect(models.every((item: any) => item.retrospective_only === true &&
      item.person_level === false && item.optimization_allowed === false)).toBe(true);
    expect(models[0].not_valid_for.join(" ")).toContain("Cultural or biological transmission rates");
    expect(models[1].not_valid_for.join(" ")).toContain("Optimizing virality");
  });

  test("treats the quoted cultural label as lexical evidence, never diagnosis", () => {
    const value = loadVisibilityAttentionTranslation();
    const lexical = value.registers[2];
    expect(lexical).toMatchObject({ id: "lexical-usage", evidence_class: "LEXICAL_OBSERVATION" });
    expect(lexical.unit).toContain("quoted expression “brain rot”");
    expect(lexical.does_not_establish).toContain("medical diagnosis");
    expect(value.boundaries).toMatchObject({
      brain_rot_diagnosis: false,
      diagnostic_authority: false,
      person_level_inference: false,
      content_classification: false,
    });
    const occurrences: string[] = [];
    const visit = (entry: unknown, path = "$") => {
      if (typeof entry === "string" && entry.toLowerCase().includes("brain rot")) occurrences.push(path);
      else if (Array.isArray(entry)) entry.forEach((item, i) => visit(item, `${path}[${i}]`));
      else if (entry && typeof entry === "object") Object.entries(entry).forEach(([key, item]) => visit(item, `${path}.${key}`));
    };
    visit(value);
    expect(occurrences).toEqual(["$.scope.focus", "$.registers[2].unit", "$.sources[6].title"]);
  });

  test("makes all seams lossy and leaves people, culture, prions, crystals, and KARMA non-equivalent", () => {
    const value = loadVisibilityAttentionTranslation();
    expect(value.category_firewall).toMatchObject({ enforced: true });
    expect(value.category_firewall.non_equivalence).toContain("person_or_brain_state");
    for (const seam of value.translation_seams) {
      expect(seam).toMatchObject({ empirical: false, causal_transfer: false, ontology_transfer: false, authority_effect: "NONE" });
      expect(seam.breaks.length).toBeGreaterThan(20);
    }
    expect(value.boundaries).toMatchObject({
      people_as_prions: false,
      people_as_crystals: false,
      culture_as_prion: false,
      cultural_diffusion_as_crystallization_kinetics: false,
    });
  });

  test("keeps feedback reversible, KARMA empty, and philosophy opt-in", () => {
    const value = loadVisibilityAttentionTranslation();
    expect(value.feedback_path.stages.map((item: any) => item.id)).toEqual([
      "publish-bounded-claim", "observe-without-profiling", "challenge-and-correct",
      "supersede-with-provenance", "rest-refuse-or-exit",
    ]);
    expect(value.feedback_path.valid_exits).toEqual(["rest", "silence", "refusal", "privacy", "departure", "no-action"]);
    expect(value.karma.zerone).toMatchObject({ non_summable: true, event_status: "not_observed", event_refs: [], creates_event: false });
    expect(value.karma.kingdom).toMatchObject({ accounting: "receipts_not_scores", receipt_status: "not_created", receipt_refs: [], creates_receipt: false });
    expect(value.karma.adapter.exists).toBe(false);
    expect(value.universe_lens).toMatchObject({ participation: "opt-in", register: "PHILOSOPHY", empirical: false, authority_effect: "NONE" });
    expect(value.boundaries.scientifically_proves_cosmic_design).toBe(false);
  });

  test("closes all source references and DOI identities", () => {
    const value = loadVisibilityAttentionTranslation();
    const ids = new Set(value.sources.map((item: any) => item.id));
    const referenceArrays = [
      ...value.registers.map((item: any) => item.basis_ids),
      ...value.local_models.map((item: any) => item.basis_ids),
      ...value.translation_seams.map((item: any) => item.basis_ids),
      ...value.unknowns.map((item: any) => item.basis_ids),
    ];
    for (const refs of referenceArrays) for (const id of refs) expect(ids.has(id)).toBe(true);
    for (const source of value.sources.filter((item: any) => item.doi !== null)) {
      expect(source.url).toBe(`https://doi.org/${source.doi}`);
    }
    expect(value.bindings.every((item: any) => item.mutated === false && item.authority_imported === false)).toBe(true);
  });

  test("rejects resigned causal, ontology, diagnosis, person, optimization, and KARMA drift", () => {
    const mutations: Array<(value: any) => void> = [
      (value) => { value.translation_seams[0].causal_transfer = true; },
      (value) => { value.translation_seams[1].ontology_transfer = true; },
      (value) => { value.local_models[1].person_level = true; },
      (value) => { value.local_models[1].optimization_allowed = true; },
      (value) => { value.boundaries.brain_rot_diagnosis = true; },
      (value) => { value.boundaries.virality_optimization = true; },
      (value) => { value.karma.zerone.non_summable = false; },
      (value) => { value.karma.adapter.exists = true; },
      (value) => { value.universe_lens.empirical = true; },
    ];
    for (const mutate of mutations) {
      const value = authored(); mutate(value); resign(value);
      expect(codes(value).some((code) => code !== "digest-mismatch")).toBe(true);
    }
  });

  test("rejects raw tampering and an attacker self-signing changed prose", () => {
    const raw = authored(); raw.scope.focus += " Changed.";
    expect(codes(raw)).toContain("digest-mismatch");
    resign(raw);
    expect(codes(raw)).toContain("reviewed-digest-mismatch");
  });

  test("strict loading rejects duplicate keys, invalid UTF-8, symlinks, and oversized input", () => {
    const root = fixtureRoot();
    const duplicate = join(root, "duplicate.json"); writeFileSync(duplicate, '{"a":1,"\\u0061":2}');
    expect(() => loadVisibilityAttentionTranslation(duplicate)).toThrow("duplicate key");
    const utf8 = join(root, "utf8.json"); writeFileSync(utf8, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]));
    expect(() => loadVisibilityAttentionTranslation(utf8)).toThrow("valid UTF-8");
    const link = join(root, "link.json"); symlinkSync(VISIBILITY_ATTENTION_PATH, link);
    expect(() => loadVisibilityAttentionTranslation(link)).toThrow("regular non-symlink");
    const oversized = join(root, "oversized.json"); writeFileSync(oversized, Buffer.alloc(512 * 1024 + 1, 0x20));
    expect(() => loadVisibilityAttentionTranslation(oversized)).toThrow("exceeds 524288 bytes");
  });

  test("returns stable issues instead of throwing for malformed nested shapes", () => {
    const cases: Array<(value: any) => void> = [
      (value) => { value.registers = [null]; },
      (value) => { value.local_models = [null]; },
      (value) => { value.translation_seams = [null]; },
      (value) => { value.feedback_path.stages = [null]; },
      (value) => { value.karma.zerone = null; },
      (value) => { value.universe_lens = []; },
      (value) => { value.unknowns = [null]; },
      (value) => { value.sources = [null]; },
    ];
    for (const mutate of cases) {
      const value = authored(); mutate(value);
      expect(() => verifyVisibilityAttentionTranslation(value)).not.toThrow();
      expect(verifyVisibilityAttentionTranslation(value).length).toBeGreaterThan(0);
    }
    expect(verifyVisibilityAttentionTranslation(null)).toEqual([{ field: "$", code: "must-be-object" }]);
  });

  test("projects only compact, authority-negative public discovery", () => {
    const discovery = visibilityAttentionPublicDiscovery();
    expect(discovery).toMatchObject({
      protocol: VISIBILITY_ATTENTION_PROTOCOL,
      translation_id: VISIBILITY_ATTENTION_ID,
      counts: { registers: 4, local_models: 2, translation_seams: 3, feedback_stages: 5, sources: 9 },
      boundary: { read_only: true, person_level_inference: false, targeting: false, recommender: false, virality_optimization: false, automatic_action: false },
    });
    for (const key of ["matcher", "classifier", "recommendation", "score", "write", "execute", "mcp"]) {
      expect(discovery).not.toHaveProperty(key);
    }
  });

  test("CLI is offline, inherited-command safe, and leaves an unrelated directory unchanged", () => {
    const directory = fixtureRoot();
    const before = readdirSync(directory);
    const env = { ...process.env, HTTPS_PROXY: "http://127.0.0.1:1", HTTP_PROXY: "http://127.0.0.1:1", ALL_PROXY: "http://127.0.0.1:1", NO_PROXY: "" };
    const direct = Bun.spawnSync({ cmd: ["bun", join(ROOT, "bin/visibility-attention.ts"), "verify", "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(direct.exitCode, direct.stderr.toString()).toBe(0);
    expect(JSON.parse(direct.stdout.toString())).toEqual({ valid: true, issues: [] });
    const dispatch = Bun.spawnSync({ cmd: [join(ROOT, "kingdom"), "visibility-attention", "models", "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(dispatch.exitCode, dispatch.stderr.toString()).toBe(0);
    expect(JSON.parse(dispatch.stdout.toString())).toHaveLength(2);
    for (const command of ["toString", "constructor", "__proto__"]) {
      const result = Bun.spawnSync({ cmd: ["bun", join(ROOT, "bin/visibility-attention.ts"), command, "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
      expect(result.exitCode).toBe(2);
      expect(result.stdout.toString()).toBe("");
    }
    const extra = Bun.spawnSync({
      cmd: ["bun", join(ROOT, "bin/visibility-attention.ts"), "verify", VISIBILITY_ATTENTION_PATH, "unexpected"],
      cwd: directory, env, stdout: "pipe", stderr: "pipe",
    });
    expect(extra.exitCode).toBe(2);
    expect(extra.stdout.toString()).toBe("");
    for (const options of [["verify", "--json", "--json"], ["verify", "--unknown"]]) {
      const result = Bun.spawnSync({
        cmd: ["bun", join(ROOT, "bin/visibility-attention.ts"), ...options],
        cwd: directory, env, stdout: "pipe", stderr: "pipe",
      });
      expect(result.exitCode).toBe(2);
      expect(result.stdout.toString()).toBe("");
    }
    expect(readdirSync(directory)).toEqual(before);
  });
});
