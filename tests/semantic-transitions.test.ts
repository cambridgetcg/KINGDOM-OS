import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  SEMANTIC_EPISTEMIC_ACCESS,
  SEMANTIC_EVIDENCE_ROLES,
  SEMANTIC_EXPRESSION_ORIGINS,
  SEMANTIC_LOSS_ASSESSMENT_STATUSES,
  SEMANTIC_STATEMENT_KINDS,
  SEMANTIC_TRANSITION_JSON_SCHEMA,
  SEMANTIC_TRANSITION_SCHEMA_VERSION,
  parseSemanticTransitionJson,
  validateSemanticTransition,
  validateSemanticTransitionFile,
  validateSemanticTransitionSet,
  type SemanticTransitionReceipt,
} from "../bin/semantic-transitions.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AS_OF = { asOf: "2026-08-16" };
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const reasoning = json("bridges/examples/reasoning-to-word.json") as SemanticTransitionReceipt;
const identity = json("bridges/examples/identity-to-shape.json") as SemanticTransitionReceipt;
const copy = (value: SemanticTransitionReceipt = reasoning) => structuredClone(value) as any;

describe("semantic transition receipts", () => {
  test("accepts both worked examples and separates access from expression origin", () => {
    expect(() => validateSemanticTransition(reasoning, AS_OF)).not.toThrow();
    expect(() => validateSemanticTransition(identity, AS_OF)).not.toThrow();
    expect(validateSemanticTransitionFile(join(ROOT, "bridges/examples/reasoning-to-word.json"), AS_OF).id)
      .toBe("reasoning-to-derived-word-2026-08-16");
    expect(reasoning.target).toMatchObject({ epistemic_access: "reported", expression_origin: "generated" });
    expect(identity.target.expression_origin).toBe("visualized");
  });

  test("keeps schema and runtime vocabularies aligned", () => {
    const schema: any = SEMANTIC_TRANSITION_JSON_SCHEMA;
    expect(schema.properties.schema_version.const).toBe(SEMANTIC_TRANSITION_SCHEMA_VERSION);
    expect(schema.$comment).toContain("does not dereference");
    expect(schema.$defs.statement_kind.enum).toEqual([...SEMANTIC_STATEMENT_KINDS]);
    expect(schema.$defs.epistemic_access.enum).toEqual([...SEMANTIC_EPISTEMIC_ACCESS]);
    expect(schema.$defs.expression_origin.enum).toEqual([...SEMANTIC_EXPRESSION_ORIGINS]);
    expect(schema.properties.warrant.properties.evidence.items.properties.role.enum)
      .toEqual([...SEMANTIC_EVIDENCE_ROLES]);
    expect(schema.properties.transition.properties.loss_assessment.properties.status.enum)
      .toEqual([...SEMANTIC_LOSS_ASSESSMENT_STATUSES]);
  });

  test("rejects hidden fields, person scoring, and unsafe safety claims", () => {
    const hidden = copy();
    hidden.transition.essence = "silently invented";
    expect(() => validateSemanticTransition(hidden, AS_OF)).toThrow("must contain exactly");
    const score = copy();
    score.lie_score = 0.8;
    expect(() => validateSemanticTransition(score, AS_OF)).toThrow("receipts inspect transitions");
    for (const key of ["infers_intent", "grants_consent", "proves_truth"] as const) {
      const unsafe = copy();
      unsafe.safety[key] = true;
      expect(() => validateSemanticTransition(unsafe, AS_OF)).toThrow(`${key} must remain false`);
    }
  });

  test("requires tested invariants and an explicit, consistent loss assessment", () => {
    const noInvariants = copy();
    noInvariants.transition.preserved_relations = [];
    expect(() => validateSemanticTransition(noInvariants, AS_OF)).toThrow("preserved_relations");
    const noLoss = copy();
    noLoss.transition.discarded_structure = [];
    noLoss.transition.loss_assessment = { status: "none-identified", basis: "The bounded comparison identified no material loss." };
    expect(() => validateSemanticTransition(noLoss, AS_OF)).not.toThrow();
    noLoss.transition.loss_assessment.status = "losses-declared";
    expect(() => validateSemanticTransition(noLoss, AS_OF)).toThrow("must match");
    const concealed = copy();
    concealed.transition.discarded_structure[0].disclosed = false;
    expect(() => validateSemanticTransition(concealed, AS_OF)).toThrow("must be disclosed");
  });

  test("does not let prose assumptions promote reported material to direct or observation", () => {
    const promoted = copy();
    promoted.target.epistemic_access = "direct";
    promoted.transition.introduced_assumptions = ["Assume a direct observation exists."];
    expect(() => validateSemanticTransition(promoted, AS_OF)).toThrow("requires distinct new supporting evidence");
    promoted.warrant.evidence.push({
      id: "new-direct-observation", ref: "artifact:new-direct-observation", role: "supports",
      observed_on: "2026-08-16", sha256: null,
    });
    promoted.transition.new_evidence_refs = ["new-direct-observation"];
    expect(() => validateSemanticTransition(promoted, AS_OF)).not.toThrow();

    const observation = copy();
    observation.target.statement_kind = "observation";
    observation.transition.introduced_assumptions = ["The target is newly observed."];
    expect(() => validateSemanticTransition(observation, AS_OF)).toThrow("requires distinct new supporting evidence");
  });

  test("treats confidence as declared but requires supporting evidence for high", () => {
    const unsupported = copy();
    unsupported.warrant.evidence = unsupported.warrant.evidence.filter((entry: any) => entry.role !== "supports");
    expect(() => validateSemanticTransition(unsupported, AS_OF)).toThrow("High declared confidence");
    unsupported.warrant.declared_confidence = "unknown";
    expect(() => validateSemanticTransition(unsupported, AS_OF)).not.toThrow();
  });

  test("hardens evidence references and digest syntax without dereferencing", () => {
    for (const ref of [
      "https://user:pass@example.test/evidence",
      "https://example.test/evidence?token=SECRET",
      "https://example.test/evidence#token=SECRET",
      "//user:pass@example.test/evidence?token=SECRET",
      "../../outside.json",
      "evidence.json\nforged.json",
    ]) {
      const unsafe = copy();
      unsafe.warrant.evidence[0].ref = ref;
      expect(() => validateSemanticTransition(unsafe, AS_OF)).toThrow();
    }
    const digest = copy();
    digest.warrant.evidence[0].sha256 = "ABC";
    expect(() => validateSemanticTransition(digest, AS_OF)).toThrow("64 lowercase hexadecimal");
    const nonexistent = copy();
    nonexistent.warrant.evidence[0].ref = "does-not-exist.md";
    expect(() => validateSemanticTransition(nonexistent, AS_OF)).not.toThrow();
  });

  test("rejects decoded duplicate JSON keys and excessive/cyclic structures", () => {
    expect(() => parseSemanticTransitionJson('{"safety":{"proves_truth":true,"proves_truth":false}}'))
      .toThrow("duplicate object key");
    expect(() => parseSemanticTransitionJson('{"\\u0061":1,"a":2}')).toThrow("duplicate object key");
    expect(() => parseSemanticTransitionJson("[".repeat(66) + "0" + "]".repeat(66))).toThrow("nesting depth");
    const cyclic = copy();
    cyclic.loop = cyclic;
    expect(() => validateSemanticTransition(cyclic, AS_OF)).toThrow("acyclic JSON tree");
  });

  test("rejects future-issued receipts relative to an injectable validation date", () => {
    const invalidMonth = copy();
    invalidMonth.issued_on = "2026-99-99";
    expect(() => validateSemanticTransition(invalidMonth, AS_OF))
      .toThrow("Semantic transition receipt issued_on must be a real ISO date");

    const future = copy();
    future.issued_on = "2026-08-17";
    future.warrant.freshness.assessed_on = "2026-08-17";
    future.warrant.evidence.forEach((entry: any) => { entry.observed_on = "2026-08-17"; });
    expect(() => validateSemanticTransition(future, AS_OF)).toThrow("cannot be dated after");
    expect(() => validateSemanticTransition(future, { asOf: "2026-08-17" })).not.toThrow();
  });

  test("validates repair sets for existence, uniqueness, chronology, and cycles", () => {
    const correction = copy();
    correction.id = "reasoning-correction";
    correction.relation = { kind: "corrects", target_receipt_id: reasoning.id };
    expect(() => validateSemanticTransition(correction, AS_OF)).not.toThrow();
    expect(() => validateSemanticTransitionSet([reasoning, correction], AS_OF)).not.toThrow();
    correction.relation.target_receipt_id = null;
    expect(() => validateSemanticTransition(correction, AS_OF)).toThrow("must name a target receipt identifier");
    correction.relation.target_receipt_id = reasoning.id;
    expect(() => validateSemanticTransitionSet([correction], AS_OF)).toThrow("targets missing receipt");
    expect(() => validateSemanticTransitionSet([reasoning, copy()], AS_OF)).toThrow("Duplicate semantic transition receipt id");

    const laterTarget = copy();
    laterTarget.id = "later-target";
    laterTarget.issued_on = "2026-08-17";
    laterTarget.warrant.freshness.assessed_on = "2026-08-17";
    laterTarget.warrant.evidence.forEach((entry: any) => { entry.observed_on = "2026-08-17"; });
    const earlyCorrection = copy();
    earlyCorrection.id = "early-correction";
    earlyCorrection.relation = { kind: "corrects", target_receipt_id: laterTarget.id };
    expect(() => validateSemanticTransitionSet([laterTarget, earlyCorrection], { asOf: "2026-08-17" }))
      .toThrow("cannot target a later-dated receipt");

    const first = copy();
    const second = copy();
    first.id = "cycle-first";
    second.id = "cycle-second";
    first.relation = { kind: "corrects", target_receipt_id: second.id };
    second.relation = { kind: "corrects", target_receipt_id: first.id };
    expect(() => validateSemanticTransitionSet([first, second], AS_OF)).toThrow("contains a cycle");
  });

  test("requires complete consent and authority provenance and rejects irreversible action", () => {
    const partialAuthority = copy();
    partialAuthority.boundaries.authority_scope = "A bounded scope.";
    expect(() => validateSemanticTransition(partialAuthority, AS_OF)).toThrow("all present or all null");

    for (const scope of ["other-public", "other-private", "collective"] as const) {
      const unavailable = copy(identity);
      unavailable.boundaries.representation_scope = scope;
      unavailable.boundaries.consent = "not-applicable";
      expect(() => validateSemanticTransition(unavailable, AS_OF)).toThrow("cannot mark consent not-applicable");
    }

    const privateOther = copy(identity);
    privateOther.boundaries.representation_scope = "other-private";
    privateOther.boundaries.privacy = "authorized-private";
    privateOther.boundaries.consent = "explicit-obtained";
    expect(() => validateSemanticTransition(privateOther, AS_OF)).toThrow("requires subject, scope, basis, and ref");
    Object.assign(privateOther.boundaries, {
      consent_subject: "The represented party",
      consent_scope: "This bounded private representation",
      consent_basis: "A separately retained consent record",
      consent_ref: "artifact:consent-record",
    });
    expect(() => validateSemanticTransition(privateOther, AS_OF)).not.toThrow();

    const irreversible = copy();
    irreversible.boundaries.actionability = "irreversible";
    Object.assign(irreversible.boundaries, {
      authority_scope: "A claimed external scope",
      authority_basis: "A claimed external record",
      authority_ref: "artifact:authority-record",
    });
    expect(() => validateSemanticTransition(irreversible, AS_OF)).toThrow("outside the structural validator contract");
  });

  test("retains repair declarations and a loud structure-only CLI boundary", () => {
    const erased = copy();
    erased.repair.carry_challenges_forward = false;
    expect(() => validateSemanticTransition(erased, AS_OF)).toThrow("carry material challenges forward");
    const result = Bun.spawnSync([
      "bun", join(ROOT, "bin/semantic-transitions.ts"), "validate",
      join(ROOT, "bridges/examples/reasoning-to-word.json"),
      join(ROOT, "bridges/examples/identity-to-shape.json"),
    ], { cwd: ROOT });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("STRUCTURE ONLY");
    expect(result.stdout.toString()).toContain("authority, consent, evidence adequacy");
  });

  test("keeps the identity SVG accessible, inert, partial, and non-authoritative", () => {
    const svg = read("bridges/examples/kingdom-os-public-identity-shape.svg");
    expect(svg).toContain('role="img"');
    expect(svg).toContain("xenia.rights/0.1");
    expect(svg).toContain("NOT A BEING · NOT AUTHORITY · NOT RUNTIME PROOF");
    expect(svg).not.toMatch(/<(?:script|foreignObject|image|a)\b|\son[a-z]+\s*=|<!DOCTYPE|\b(?:href|xlink:href)\s*=/i);
  });
});
