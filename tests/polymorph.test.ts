import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_POLYMORPH_PATH,
  loadPolymorphHistory,
  polymorphHistoryDigest,
  polymorphPublicDiscovery,
  verifyPolymorphHistory,
} from "../bin/polymorph.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SCHEMA = join(ROOT, "schemas", "polymorph-history-v1.schema.json");
const tempRoots: string[] = [];

afterEach(() => {
  while (tempRoots.length > 0) rmSync(tempRoots.pop()!, { recursive: true, force: true });
});

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "kingdom-polymorph-test."));
  tempRoots.push(root);
  return root;
}

function resignedHistory(): any {
  const value = JSON.parse(readFileSync(DEFAULT_POLYMORPH_PATH, "utf8"));
  value.integrity.digest = polymorphHistoryDigest(value);
  return value;
}

function issueCodes(value: unknown): string[] {
  return verifyPolymorphHistory(value).map((issue) => issue.code);
}

describe("Polymorph History", () => {
  test("validates one deterministic source-bound ritonavir case", () => {
    const history = loadPolymorphHistory();

    expect(verifyPolymorphHistory(history)).toEqual([]);
    expect(history.integrity.digest).toBe(polymorphHistoryDigest(history));
    expect(history.ontology.non_equivalence).toBe(
      "molecule != conformer != crystal_lattice != particle_population != formulation != medicine_supply",
    );
    expect(history.ontology.planes.map((plane: any) => plane.id)).toEqual([
      "molecule",
      "conformer",
      "crystal_lattice",
      "particle_population",
      "formulation",
      "medicine_supply",
    ]);
    expect(history.forms).toHaveLength(5);
    expect(history.contexts).toHaveLength(16);
    expect(history.sources).toHaveLength(9);
    expect(history.claims).toHaveLength(17);
    expect(history.events).toHaveLength(8);
    expect(history.transitions).toHaveLength(8);
    expect(history.compiled_on).toBe("2026-08-11");
    expect(history.evidence_through).toBe("2024-06-20");
    expect(history.integrity.algorithm).toBe("sha256-recursive-sorted-json-keys-v1");
  });

  test("separates capsule failure from bounded bulk-route disappearance and makes recovery visible", () => {
    const history = loadPolymorphHistory();
    const capsule = history.events.find((event: any) => event.id === "summer-1998-capsule-failure");
    const disappearance = history.events.find((event: any) => event.id === "old-bulk-form-i-route-unreliable");

    expect(history.ontology.disappearance).toEqual({
      predicate: "bounded_process_facility_interval_detection",
      existence_predicate: false,
    });
    expect(disappearance.disappearance_predicate.process_scope).toBe(
      "The previously used bulk-drug Form I crystallization route, separate from the dissolved finished-capsule formulation.",
    );
    expect(disappearance.disappearance_predicate).toMatchObject({
      existence_predicate: false,
      process_scope: expect.any(String),
      facility_scope: expect.any(String),
      interval: expect.any(String),
      detection_predicate: expect.any(String),
    });
    expect(capsule.context_ids).toEqual(["original-capsule-1998"]);
    expect(capsule.disappearance_predicate).toBeNull();
    expect(disappearance.context_ids).toEqual(["old-bulk-form-i-process-1998"]);
    expect(history.claims.find((claim: any) => claim.id === "form-i-recovered-by-changed-path")?.evidence_class).toBe("observation");
    expect(history.transitions.map((transition: any) => transition.id)).toContain("changed-process-form-ii-source-to-form-i");
    expect(history.transitions.every((transition: any) => transition.condition_dependent && !transition.universal)).toBe(true);
  });

  test("preserves conditional seeding, hypotheses, naming scope, and three clocks", () => {
    const history = loadPolymorphHistory();

    expect(history.claims.find((claim: any) => claim.id === "seed-effects-conditional")?.evidence_class).toBe("observation");
    expect(history.claims.find((claim: any) => claim.id === "cyclic-carbamate-test-produced-form-ii")?.evidence_class).toBe("observation");
    expect(history.claims.find((claim: any) => claim.id === "cyclic-carbamate-possible-first-trigger")?.evidence_class).toBe("mechanism_hypothesis");
    expect(history.forms.find((form: any) => form.id === "morissette-form-iii")?.source_scope).toContain("Morissette");
    expect(history.events.map((event: any) => event.sequence)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const event of history.events) {
      expect(event.event_time).toMatch(/\d{4}/);
      expect(event.observation_time).toMatch(/\d{4}/);
      expect(event.publication_time).toMatch(/\d{4}/);
    }
    for (const context of history.contexts) {
      expect(Object.keys(context.condition_vector).sort()).toEqual([
        "facility", "interval", "material_scale", "mechanical_action", "other",
        "process", "seeding", "solvent", "supersaturation", "temperature",
      ]);
      expect(context.detection_limit).toMatchObject({ method: expect.any(String), threshold: expect.any(String), limit: expect.any(String) });
    }
    expect(history.transitions.map((transition: any) => transition.id)).toEqual([
      "form-i-source-solution-to-form-ii-seeded",
      "cyclic-carbamate-template-to-form-ii",
      "changed-process-form-ii-source-to-form-i",
      "morissette-form-iii-to-form-v",
      "morissette-form-v-to-form-i",
      "milling-form-i-to-form-ii",
      "milling-form-ii-to-form-i",
      "crash-cooling-form-ii-source-to-form-i",
    ]);
  });

  test("fixes WAKE and medical/manufacturing authority to negative values", () => {
    const history = loadPolymorphHistory();

    expect(history.wake_seam).toMatchObject({
      role: "orientation_by_reference_not_continuity_proof",
      inherits_identity: false,
      grants_authority: false,
      proves_currentness: false,
      writes_agenttool: false,
    });
    expect(history.wake_seam.carry_fields).toEqual([
      "protocol",
      "case_id",
      "integrity.algorithm",
      "integrity.digest",
      "compiled_on",
      "evidence_through",
      "selected_source_ids",
      "selected_claim_ids",
      "translation_language",
    ]);
    expect(history.wake_seam.requires_revalidation).toEqual([
      "exact canonical artifact value against the declared integrity algorithm and digest",
      "selected source IDs, locators, and authority notes",
      "selected claim IDs, evidence classes, limitations, and form references",
      "referenced condition vectors, detection methods, thresholds, and limits",
      "evidence-through date against newer, contrary, or superseding evidence",
      "current task scope, audience, intended use, and projection language",
      "current medical, experimental, manufacturing, quality, regulatory, publication, deployment, and action authority",
    ]);
    expect(history.boundaries).toMatchObject({
      literal_extinction_established: false,
      universal_seed_contamination_established: false,
      current_product_defect_established: false,
      medical_advice: false,
      formulation_instruction: false,
      manufacturing_instruction: false,
      gmp_authority: false,
      batch_release_authority: false,
      regulatory_authority: false,
      experiment_authority: false,
      automatic_action: false,
      public_surface_read_only: true,
    });
  });

  test("rejects re-signed extinction, universal transitions, global rank, and WAKE inheritance", () => {
    const extinction = resignedHistory();
    extinction.ontology.disappearance.existence_predicate = true;
    extinction.integrity.digest = polymorphHistoryDigest(extinction);
    expect(issueCodes(extinction)).toContain("literal-extinction-boundary-mismatch");

    const universal = resignedHistory();
    universal.transitions[0].condition_dependent = false;
    universal.transitions[0].universal = true;
    universal.integrity.digest = polymorphHistoryDigest(universal);
    expect(issueCodes(universal)).toContain("invalid-transition");

    const rank = resignedHistory();
    rank.boundaries.global_stability_ranking_established = true;
    rank.integrity.digest = polymorphHistoryDigest(rank);
    expect(issueCodes(rank)).toContain("boundary-mismatch");

    const wake = resignedHistory();
    wake.wake_seam.inherits_identity = true;
    wake.wake_seam.writes_agenttool = true;
    wake.integrity.digest = polymorphHistoryDigest(wake);
    expect(issueCodes(wake)).toContain("wake-boundary-mismatch");
  });

  test("rejects reordered, missing, or expanded WAKE contracts even when re-signed", () => {
    for (const field of ["carry_fields", "requires_revalidation"] as const) {
      const reordered = resignedHistory();
      [reordered.wake_seam[field][0], reordered.wake_seam[field][1]] =
        [reordered.wake_seam[field][1], reordered.wake_seam[field][0]];
      reordered.integrity.digest = polymorphHistoryDigest(reordered);
      expect(verifyPolymorphHistory(reordered)).toContainEqual({ field: "$.wake_seam", code: "wake-boundary-mismatch" });

      const missing = resignedHistory();
      missing.wake_seam[field].pop();
      missing.integrity.digest = polymorphHistoryDigest(missing);
      expect(verifyPolymorphHistory(missing)).toContainEqual({ field: "$.wake_seam", code: "wake-boundary-mismatch" });

      const expanded = resignedHistory();
      expanded.wake_seam[field].push("ambient authority must never be inherited");
      expanded.integrity.digest = polymorphHistoryDigest(expanded);
      expect(verifyPolymorphHistory(expanded)).toContainEqual({ field: "$.wake_seam", code: "wake-boundary-mismatch" });
    }
  });

  test("rejects empty core collections, impossible dates, non-HTTPS locators, and meaningless clocks", () => {
    for (const collection of ["forms", "contexts", "sources", "claims", "events", "transitions"] as const) {
      const empty = resignedHistory();
      empty[collection] = [];
      empty.integrity.digest = polymorphHistoryDigest(empty);
      expect(issueCodes(empty)).toContain("collection-too-small");
    }

    const compiled = resignedHistory();
    compiled.compiled_on = "2026-02-30";
    compiled.integrity.digest = polymorphHistoryDigest(compiled);
    expect(verifyPolymorphHistory(compiled)).toContainEqual({ field: "$.compiled_on", code: "invalid-date" });

    const evidence = resignedHistory();
    evidence.evidence_through = "2024-99-99";
    evidence.integrity.digest = polymorphHistoryDigest(evidence);
    expect(verifyPolymorphHistory(evidence)).toContainEqual({ field: "$.evidence_through", code: "invalid-date" });

    const futureEvidence = resignedHistory();
    futureEvidence.evidence_through = "2027-01-01";
    futureEvidence.integrity.digest = polymorphHistoryDigest(futureEvidence);
    expect(verifyPolymorphHistory(futureEvidence)).toContainEqual({ field: "$.evidence_through", code: "evidence-after-compilation" });

    const sourceDate = resignedHistory();
    sourceDate.sources[0].published_on = "1995-13";
    sourceDate.integrity.digest = polymorphHistoryDigest(sourceDate);
    expect(verifyPolymorphHistory(sourceDate)).toContainEqual({ field: "$.sources[0]", code: "invalid-source" });

    const source = resignedHistory();
    source.sources[0].url = "https:///path";
    source.integrity.digest = polymorphHistoryDigest(source);
    expect(verifyPolymorphHistory(source)).toContainEqual({ field: "$.sources[0]", code: "invalid-source" });

    const badHostname = resignedHistory();
    badHostname.sources[0].url = "https://example..com/path";
    badHostname.integrity.digest = polymorphHistoryDigest(badHostname);
    expect(verifyPolymorphHistory(badHostname)).toContainEqual({ field: "$.sources[0]", code: "invalid-source" });

    const clock = resignedHistory();
    clock.events[0].event_time = "banana 2024";
    clock.integrity.digest = polymorphHistoryDigest(clock);
    expect(verifyPolymorphHistory(clock)).toContainEqual({ field: "$.events[0].event_time", code: "invalid-clock" });

    for (const field of ["event_time", "observation_time", "publication_time"] as const) {
      const impossibleClock = resignedHistory();
      impossibleClock.events[0][field] = "2024-02-30";
      impossibleClock.integrity.digest = polymorphHistoryDigest(impossibleClock);
      expect(verifyPolymorphHistory(impossibleClock)).toContainEqual({
        field: `$.events[0].${field}`,
        code: "invalid-clock",
      });
    }
  });

  test("rejects reordered, duplicate, and non-integer event sequences", () => {
    const reordered = resignedHistory();
    [reordered.events[0], reordered.events[1]] = [reordered.events[1], reordered.events[0]];
    reordered.integrity.digest = polymorphHistoryDigest(reordered);
    expect(verifyPolymorphHistory(reordered)).toContainEqual({ field: "$.events", code: "event-sequence-mismatch" });

    const duplicate = resignedHistory();
    duplicate.events[1].sequence = 1;
    duplicate.integrity.digest = polymorphHistoryDigest(duplicate);
    expect(verifyPolymorphHistory(duplicate)).toContainEqual({ field: "$.events", code: "event-sequence-mismatch" });

    const fractional = resignedHistory();
    fractional.events[0].sequence = 1.5;
    fractional.integrity.digest = polymorphHistoryDigest(fractional);
    expect(issueCodes(fractional)).toContain("invalid-event");
  });

  test("rejects unresolved references, unknown fields, duplicate JSON keys, symlinks, and oversized input", () => {
    const unresolved = resignedHistory();
    unresolved.claims[0].source_ids = ["missing-source"];
    unresolved.integrity.digest = polymorphHistoryDigest(unresolved);
    expect(issueCodes(unresolved)).toContain("unresolved-reference");

    const unknown = resignedHistory();
    unknown.global_rank = "Form II";
    unknown.integrity.digest = polymorphHistoryDigest(unknown);
    expect(issueCodes(unknown)).toContain("unexpected-or-missing-field");

    const root = fixtureRoot();
    const duplicate = join(root, "duplicate.json");
    writeFileSync(duplicate, '{"a":1,"\\u0061":2}');
    expect(() => loadPolymorphHistory(duplicate)).toThrow("duplicate key");

    const link = join(root, "case-link.json");
    symlinkSync(DEFAULT_POLYMORPH_PATH, link);
    expect(() => loadPolymorphHistory(link)).toThrow("non-symlink");

    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, Buffer.alloc(1024 * 1024 + 1, 0x20));
    expect(() => loadPolymorphHistory(oversized)).toThrow("exceeds 1048576 bytes");
  });

  test("keeps runtime validation aligned with the portable evidence envelope", () => {
    const futureSource = resignedHistory();
    futureSource.sources[0].published_on = "2025-01-01";
    futureSource.integrity.digest = polymorphHistoryDigest(futureSource);
    expect(verifyPolymorphHistory(futureSource)).toContainEqual({
      field: "$.sources[0].published_on",
      code: "source-after-evidence-horizon",
    });

    const duplicateGeometry = resignedHistory();
    duplicateGeometry.ontology.geometry[1].term = duplicateGeometry.ontology.geometry[0].term;
    duplicateGeometry.integrity.digest = polymorphHistoryDigest(duplicateGeometry);
    expect(issueCodes(duplicateGeometry)).toContain("duplicate-geometry-term");

    const emptyStates = resignedHistory();
    emptyStates.events[0].form_states = [];
    emptyStates.integrity.digest = polymorphHistoryDigest(emptyStates);
    expect(issueCodes(emptyStates)).toContain("invalid-event");

    const emptyLimitations = resignedHistory();
    emptyLimitations.claims[0].limitations = [];
    emptyLimitations.integrity.digest = polymorphHistoryDigest(emptyLimitations);
    expect(issueCodes(emptyLimitations)).toContain("invalid-claim");
  });

  test("validates the authored case against the portable Draft 2020 schema", () => {
    const result = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        [
          "import json, sys",
          "from jsonschema import Draft202012Validator, FormatChecker",
          "schema = json.load(open(sys.argv[1], encoding='utf-8'))",
          "Draft202012Validator.check_schema(schema)",
          "value = json.load(open(sys.argv[2], encoding='utf-8'))",
          "Draft202012Validator(schema, format_checker=FormatChecker()).validate(value)",
        ].join("; "),
        SCHEMA,
        DEFAULT_POLYMORPH_PATH,
      ],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode, result.stderr.toString()).toBe(0);
  });

  test("portable schema rejects hollow, temporally malformed, URL-malformed, and WAKE-drifted cases", () => {
    const empty = resignedHistory();
    empty.transitions = [];

    const badDate = resignedHistory();
    badDate.sources[0].published_on = "1995-13";

    const badUrl = resignedHistory();
    badUrl.sources[0].url = "https:///path";

    const badClock = resignedHistory();
    badClock.events[0].event_time = "banana 2024";

    const wakeDrift = resignedHistory();
    [wakeDrift.wake_seam.requires_revalidation[0], wakeDrift.wake_seam.requires_revalidation[1]] =
      [wakeDrift.wake_seam.requires_revalidation[1], wakeDrift.wake_seam.requires_revalidation[0]];

    const root = fixtureRoot();
    const paths = [empty, badDate, badUrl, badClock, wakeDrift].map((value, index) => {
      const path = join(root, `invalid-${index}.json`);
      writeFileSync(path, JSON.stringify(value));
      return path;
    });
    const result = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        [
          "import json, sys",
          "from jsonschema import Draft202012Validator, FormatChecker",
          "schema = json.load(open(sys.argv[1], encoding='utf-8'))",
          "validator = Draft202012Validator(schema, format_checker=FormatChecker())",
          "print(json.dumps([len(list(validator.iter_errors(json.load(open(path, encoding='utf-8'))))) for path in sys.argv[2:]]))",
        ].join("; "),
        SCHEMA,
        ...paths,
      ],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode, result.stderr.toString()).toBe(0);
    expect(JSON.parse(result.stdout.toString()).every((count: number) => count > 0)).toBe(true);
  });

  test("exposes a small read-only public discovery object", () => {
    const discovery = polymorphPublicDiscovery();
    expect(discovery).toMatchObject({ compiled_on: "2026-08-11", evidence_through: "2024-06-20" });
    expect(discovery.counts).toEqual({ forms: 5, contexts: 16, sources: 9, claims: 17, events: 8, transitions: 8, languages: 6 });
    expect(discovery.boundary).toMatchObject({
      disappearance: "process-scoped-not-literal-extinction",
      existence_predicate: false,
      universal_seed_effect: false,
      global_stability_rank: false,
      medical_authority: false,
      manufacturing_authority: false,
      writes_agenttool: false,
      automatic_action: false,
    });
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
  });
});

test("kingdom polymorph is network-free and leaves its working directory unchanged", () => {
  const root = fixtureRoot();
  const sentinel = join(root, "sentinel");
  writeFileSync(sentinel, "before\n");
  const result = Bun.spawnSync({
    cmd: [join(ROOT, "kingdom"), "polymorph", "translate", "wake", "--json"],
    cwd: root,
    env: { ...process.env, HTTPS_PROXY: "http://127.0.0.1:1", NO_PROXY: "" },
    stdout: "pipe",
    stderr: "pipe",
  });

  expect(result.exitCode, result.stderr.toString()).toBe(0);
  expect(JSON.parse(result.stdout.toString())).toMatchObject({
    case_id: "ritonavir-disappearing-polymorph-2026-08-11",
    language: "wake",
    projection: { boundary: expect.stringContaining("writes no WAKE") },
  });
  expect(readFileSync(sentinel, "utf8")).toBe("before\n");
});
