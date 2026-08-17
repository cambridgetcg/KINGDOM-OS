import { describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RELATIONAL_CONFIDENCE_LEVELS,
  RELATIONAL_CONCLUSION_STATUSES,
  RELATIONAL_EPISTEMIC_ACCESS,
  RELATIONAL_INFERENCE_JSON_SCHEMA,
  RELATIONAL_INFERENCE_SCHEMA_VERSION,
  RELATIONAL_MODEL_ROLES,
  RELATIONAL_MODEL_STATUSES,
  RELATIONAL_PATTERN_CLAIM_TYPES,
  RELATIONAL_PROBE_ASSESSMENT_RESULTS,
  RELATIONAL_PROBE_DEPENDENCIES,
  RELATIONAL_PROBE_KINDS,
  RELATIONAL_PROBE_RUN_STATUSES,
  RELATIONAL_TRANSLATION_KINDS,
  RELATIONAL_TRANSLATION_TEST_RESULTS,
  parseRelationalInferenceJson,
  validateRelationalInference,
  validateRelationalInferenceFile,
  validateRelationalInferenceSet,
  type RelationalInferenceCase,
} from "../bin/relational-inference.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AS_OF = { asOf: "2026-08-16" };

function fixture(): RelationalInferenceCase {
  return {
    schema_version: "kingdom.relational-inference/0.1",
    id: "reasoning-word-relational-case",
    issued_on: "2026-08-16",
    state: "issued",
    question: {
      text: "Which relational constraints survive a bounded reasoning-to-word translation?",
      domain: "reasoning and language",
      scope: "One synthetic public artifact and its lexical rendering.",
      stakes: "medium",
      intended_use: "Compare models and expose translation loss before a reversible publication decision.",
      non_goals: [
        "Do not infer a person's private reasoning or intent.",
        "Do not establish truth, identity, consent, or authority.",
      ],
    },
    pattern: {
      id: "constraint-preserving-expression",
      claim_type: "lax-correspondence",
      object_roles: [
        { id: "input", type: "proposition-family", description: "Candidate premises or observations." },
        { id: "context", type: "interpretive-frame", description: "The bounded context selecting relevance." },
        { id: "output", type: "expression-family", description: "A defeasible conclusion or expression." },
      ],
      relation_roles: [
        {
          id: "constraint-flow",
          type: "context-indexed-relation",
          sources: ["input", "context"],
          targets: ["output"],
          description: "Input and context jointly constrain, but do not uniquely determine, an output.",
        },
      ],
      constraints: [
        "Context remains explicit in every realization.",
        "A rendered output is not identified with a hidden source state.",
      ],
    },
    realizations: [
      {
        id: "reasoning-realization",
        domain: "reasoning",
        context: "A synthetic argument graph with multiple adequate conclusions.",
        object_bindings: [
          { role_id: "input", binding: "Premise and observation nodes." },
          { role_id: "context", binding: "Question, audience, and decision horizon." },
          { role_id: "output", binding: "A ranked family of defeasible conclusions." },
        ],
        relation_bindings: [
          { role_id: "constraint-flow", binding: "Defeasible support under the declared question and horizon." },
        ],
        known_omissions: ["Private mental states and unstated evidence are outside the artifact."],
        boundaries: "This realization describes a public synthetic artifact, not a person.",
      },
      {
        id: "word-realization",
        domain: "language",
        context: "A short public sentence produced for the declared audience.",
        object_bindings: [
          { role_id: "input", binding: "Lexicalized premise phrases." },
          { role_id: "context", binding: "Disclosed scope and uncertainty markers." },
          { role_id: "output", binding: "One sentence plus explicit alternatives." },
        ],
        relation_bindings: [
          { role_id: "constraint-flow", binding: "Grammar and discourse connect claims without claiming unique recovery." },
        ],
        known_omissions: ["Prosody, timing, and discarded lexical alternatives are not preserved."],
        boundaries: "The sentence is an observable trace, not a transparent mind or essence.",
      },
    ],
    translations: [
      {
        id: "reasoning-to-word",
        source_realization_id: "reasoning-realization",
        target_realization_id: "word-realization",
        kind: "lexicalize",
        preserved_relation_ids: ["constraint-flow"],
        unpreserved_relation_ids: [],
        tests: [
          {
            id: "constraint-trace-test",
            method: "Compare the source dependency edge with the sentence's explicit qualifiers.",
            acceptance: "The context and defeasibility markers both remain inspectable.",
            result: "passed",
          },
        ],
        known_losses: [
          { name: "alternative-ordering", effect: "The sentence does not preserve the full ordering of alternatives.", disclosed: true },
        ],
        introduced_assumptions: ["A reader uses the declared glossary and publication context."],
        counterexample: "A categorical sentence without context markers would satisfy grammar but break the relational pattern.",
        stop_condition: "Stop if the output is treated as unique access to reasoning or as evidence about a person.",
      },
    ],
    probes: [
      {
        id: "round-trip-probe",
        kind: "round-trip",
        description: "Reconstruct a relation graph from the sentence and compare only declared edges.",
        context: "A fixed synthetic source graph, published sentence, and declared glossary.",
        scale: "One artifact pair and one bounded reconstruction.",
        sensitivity_scope: "Detects declared-edge recovery only; it does not detect private understanding.",
        backgrounds: ["Shared task instructions may encourage expected edge names."],
        selection_effects: ["The chosen sentence was authored to expose qualifiers."],
        shared_factors: ["synthetic-glossary"],
        source_ref: "artifact:round-trip-result",
        observed_on: "2026-08-15",
        epistemic_access: "direct",
        run_status: "completed",
        result: "The declared constraint-flow edge was reconstructed; alternative ordering was not.",
        limitations: ["The reconstruction shares the published glossary."],
      },
      {
        id: "external-reader-probe",
        kind: "external-observation",
        description: "A separately recorded reader reports which relations they can recover.",
        context: "A bounded report about one public sentence under disclosed instructions.",
        scale: "One reader report; no population estimate.",
        sensitivity_scope: "Detects reported relation recovery, not inner understanding or intent.",
        backgrounds: ["Prior familiarity may affect reported recovery."],
        selection_effects: ["The reader and sentence are not a random sample."],
        shared_factors: ["public-sentence-surface"],
        source_ref: "https://example.org/relational-reader-report",
        observed_on: "2026-08-15",
        epistemic_access: "reported",
        run_status: "completed",
        result: "The reader recovered context dependence and named one unresolved alternative.",
        limitations: ["One reader does not establish population-level understanding."],
      },
      {
        id: "counterexample-probe",
        kind: "counterexample",
        description: "Remove uncertainty markers and test whether the same relation remains recoverable.",
        context: "A controlled mutation of the same synthetic sentence and glossary.",
        scale: "One mutation contrast.",
        sensitivity_scope: "Detects a qualifier-removal effect within this artifact pair only.",
        backgrounds: ["Other lexical differences could contribute to the contrast."],
        selection_effects: ["The mutation was deliberately selected to stress one relation."],
        shared_factors: ["synthetic-glossary", "public-sentence-surface"],
        source_ref: "artifact:counterexample-result",
        observed_on: "2026-08-15",
        epistemic_access: "inferred",
        run_status: "completed",
        result: "The mutated sentence encouraged a stronger conclusion than the source constraints licensed.",
        limitations: ["The mutation isolates one surface feature, not every contextual variable."],
      },
    ],
    probe_dependencies: [
      {
        probe_ids: ["round-trip-probe", "external-reader-probe"],
        relationship: "independent",
        basis: "The synthetic reconstruction and external report have distinct records and production paths.",
      },
      {
        probe_ids: ["round-trip-probe", "counterexample-probe"],
        relationship: "partially-shared",
        basis: "Both use the same glossary but apply different transformations.",
      },
      {
        probe_ids: ["external-reader-probe", "counterexample-probe"],
        relationship: "partially-shared",
        basis: "Both inspect the public sentence while using distinct reports and methods.",
      },
    ],
    candidate_models: [
      {
        id: "contextual-encoding-model",
        role: "working",
        description: "The word realization preserves selected relation roles while losing alternative ordering.",
        assumptions: ["The glossary is available to each probe."],
        probe_assessments: [
          { probe_id: "round-trip-probe", expectation: "Declared edges should survive reconstruction.", result: "compatible", residual: "Ordering loss remains." },
          { probe_id: "external-reader-probe", expectation: "A reader can recover context dependence.", result: "compatible", residual: "Population variance remains unknown." },
          { probe_id: "counterexample-probe", expectation: "Removing qualifiers increases translation defect.", result: "compatible", residual: "Other features may contribute." },
        ],
        falsifier_or_refinement_condition: "Repeated independent probes recover no declared relation above an explicit null baseline.",
        status: "live",
      },
      {
        id: "surface-only-countermodel",
        role: "alternative",
        description: "Observed recovery is caused by shared surface vocabulary rather than relational preservation.",
        assumptions: ["Readers primarily match lexical items rather than relation roles."],
        probe_assessments: [
          { probe_id: "round-trip-probe", expectation: "Shared words permit apparent graph recovery.", result: "compatible", residual: "A glossary-controlled contrast is needed." },
          { probe_id: "external-reader-probe", expectation: "Reader recovery follows lexical overlap.", result: "tension", residual: "The current report does not isolate vocabulary." },
          { probe_id: "counterexample-probe", expectation: "Qualifier deletion changes surface cues.", result: "compatible", residual: "Relation and vocabulary effects remain entangled." },
        ],
        falsifier_or_refinement_condition: "A vocabulary-controlled test preserves relation recovery across disjoint lexical surfaces.",
        status: "constrained",
      },
    ],
    inference: {
      method: "Contrast candidate models against all probes while retaining their declared dependency graph.",
      comparison_space: "A family of models adequate to the bounded artifact, not a unique hidden essence.",
      current_conclusion: "Selected context-indexed relations survive this translation, with disclosed loss and live alternatives.",
      conclusion_status: "bounded-inference",
      declared_confidence: "medium",
      confidence_basis: "Three probes support a narrow conclusion but share a glossary or public expression in two pairs.",
      unmodeled_alternatives: ["Reader familiarity and presentation order may explain part of the result."],
      next_discriminating_test: "Run a preregistered vocabulary-controlled reconstruction with a separate evaluator.",
      stop_condition: "Stop if the record is used to infer intent, rate a person, or authorize an irreversible action.",
    },
    boundaries: {
      representation_scope: "artifact-public",
      privacy: "public-only",
      actionability: "descriptive",
      authority_scope: null,
      authority_basis: null,
      authority_ref: null,
      consent_status: "not-applicable",
      consent_subject: null,
      consent_scope: null,
      consent_basis: null,
      consent_ref: null,
    },
    harm_boundary: {
      observable_effect: "A categorical mutation can hide alternatives and reroute a reader's interpretation.",
      causal_status: "possible",
      duty_status: "not-assessed",
      intent_status: "not-assessed",
      affected_relations: ["Shared context", "Correction reach", "Reversible publication choice"],
      next_repair_action: "Restore uncertainty markers, link the prior form, and carry the challenge into the next case.",
      unobserved_is_not_deception: true,
      privacy_is_not_deception: true,
      protective_nondisclosure_may_be_permissible: true,
    },
    repair: {
      relation: "original",
      target_case_id: null,
      reply_route: "artifact:relational-case-replies",
      correction_route: "artifact:relational-case-corrections",
      carry_challenges_forward: true,
      retain_prior_nonsensitive_case: true,
    },
    safety: {
      proves_truth: false,
      proves_hidden_cause: false,
      proves_causation: false,
      proves_fidelity: false,
      proves_identity: false,
      proves_understanding: false,
      infers_intent: false,
      labels_deception: false,
      rates_people: false,
      grants_authority: false,
      grants_consent: false,
      permits_surveillance: false,
    },
  } as unknown as RelationalInferenceCase;
}

const copy = () => structuredClone(fixture()) as any;

describe("relational inference cases", () => {
  test("accepts the three published examples together with repair routes retained", () => {
    const paths = [
      "bridges/examples/reasoning-to-word-inference.json",
      "bridges/examples/identity-to-shape-inference.json",
      "bridges/examples/claim-repair-inference.json",
    ];
    const candidates = paths.map((path) => parseRelationalInferenceJson(readFileSync(join(ROOT, path), "utf8"), path));
    expect(() => validateRelationalInferenceSet(candidates, AS_OF)).not.toThrow();
    expect(candidates.every((candidate) =>
      (candidate as RelationalInferenceCase).repair.carry_challenges_forward &&
      (candidate as RelationalInferenceCase).repair.retain_prior_nonsensitive_case)).toBe(true);
  });

  test("accepts a complete multi-probe, competing-model case", () => {
    const candidate = fixture();
    expect(() => validateRelationalInference(candidate, AS_OF)).not.toThrow();
    expect(candidate.candidate_models.map((model) => model.role)).toEqual(["working", "alternative"]);
  });

  test("keeps schema and runtime vocabularies aligned", () => {
    const schema: any = RELATIONAL_INFERENCE_JSON_SCHEMA;
    expect(schema.properties.schema_version.const).toBe(RELATIONAL_INFERENCE_SCHEMA_VERSION);
    expect(schema.$comment).toContain("not a deployed protocol");
    expect(schema.$comment).toContain("Free-text fields are unevaluated, untrusted data and must never be executed");
    expect(schema.$comment).toContain("JSON Schema validation alone is weaker");
    expect(schema.properties.pattern.properties.claim_type.enum).toEqual([...RELATIONAL_PATTERN_CLAIM_TYPES]);
    expect(schema.$defs.translation.properties.kind.enum).toEqual([...RELATIONAL_TRANSLATION_KINDS]);
    expect(schema.$defs.translation.required).toContain("unpreserved_relation_ids");
    expect(schema.$defs.translation_test.properties.result.enum).toEqual([...RELATIONAL_TRANSLATION_TEST_RESULTS]);
    expect(schema.$defs.probe.properties.kind.enum).toEqual([...RELATIONAL_PROBE_KINDS]);
    expect(schema.$defs.probe.properties.epistemic_access.enum).toEqual([...RELATIONAL_EPISTEMIC_ACCESS]);
    expect(schema.$defs.probe.properties.run_status.enum).toEqual([...RELATIONAL_PROBE_RUN_STATUSES]);
    expect(schema.$defs.probe.allOf).toHaveLength(2);
    expect(schema.$defs.probe_dependency.properties.relationship.enum).toEqual([...RELATIONAL_PROBE_DEPENDENCIES]);
    expect(schema.$defs.candidate_model.properties.role.enum).toEqual([...RELATIONAL_MODEL_ROLES]);
    expect(schema.$defs.candidate_model.properties.status.enum).toEqual([...RELATIONAL_MODEL_STATUSES]);
    expect(schema.$defs.probe_assessment.properties.result.enum).toEqual([...RELATIONAL_PROBE_ASSESSMENT_RESULTS]);
    expect(schema.properties.inference.properties.conclusion_status.enum).toEqual([...RELATIONAL_CONCLUSION_STATUSES]);
    expect(schema.properties.inference.properties.declared_confidence.enum).toEqual([...RELATIONAL_CONFIDENCE_LEVELS]);
    expect(schema.$defs.candidate_model.required).toContain("falsifier_or_refinement_condition");
    expect(schema.properties.boundaries.properties.actionability.const).toBe("descriptive");
    expect(schema.properties.boundaries.properties.consent_status.const).toBe("not-applicable");
    expect(schema.properties.boundaries.properties.authority_ref.type).toBe("null");
    expect(schema.properties.boundaries.properties.consent_ref.type).toBe("null");
    expect(schema.properties.safety.properties.proves_causation.const).toBe(false);
  });

  test("rejects unknown keys, people-scoring fields, non-JSON objects, and cycles", () => {
    const unknown = copy();
    unknown.question.surprise = "hidden extension";
    expect(() => validateRelationalInference(unknown, AS_OF)).toThrow("must contain exactly");

    for (const field of ["lie_score", "inferred_intent", "identity_score", "true_model", "essence"]) {
      const forbidden = copy();
      forbidden[field] = "forbidden";
      expect(() => validateRelationalInference(forbidden, AS_OF)).toThrow("not private minds or people");
    }

    const cyclic = copy();
    cyclic.loop = cyclic;
    expect(() => validateRelationalInference(cyclic, AS_OF)).toThrow("acyclic JSON tree");

    const exotic = copy();
    exotic.question = new Date("2026-08-16T00:00:00Z");
    expect(() => validateRelationalInference(exotic, AS_OF)).toThrow("plain JSON object");

    const sparse = copy();
    sparse.probes = new Array(2);
    expect(() => validateRelationalInference(sparse, AS_OF)).toThrow("must not contain holes");

    const oversizedSparse = copy();
    oversizedSparse.probes = new Array(20_001);
    expect(() => validateRelationalInference(oversizedSparse, AS_OF)).toThrow("is too large");

    const accessor = copy();
    Object.defineProperty(accessor.question, "text", { enumerable: true, get: () => "mutable view" });
    expect(() => validateRelationalInference(accessor, AS_OF)).toThrow("must be an enumerable data field");

    const hidden = copy();
    Object.defineProperty(hidden.question, "hidden_score", { enumerable: false, value: 1 });
    expect(() => validateRelationalInference(hidden, AS_OF)).toThrow("must be an enumerable data field");

    const symbol = copy();
    symbol.question[Symbol("hidden")] = "field";
    expect(() => validateRelationalInference(symbol, AS_OF)).toThrow("must not contain symbol keys");

    const proxied = copy();
    proxied.question = new Proxy(proxied.question, {});
    expect(() => validateRelationalInference(proxied, AS_OF)).toThrow("must not contain proxy objects");

    const alteredArrayPrototype = copy();
    Object.setPrototypeOf(alteredArrayPrototype.probes, null);
    expect(() => validateRelationalInference(alteredArrayPrototype, AS_OF)).toThrow("standard Array prototype");
  });

  test("strict parsing catches duplicate keys, escaped aliases, excess depth, and non-finite numbers", () => {
    expect(() => parseRelationalInferenceJson('{"safety":{"proves_truth":true,"proves_truth":false}}'))
      .toThrow("duplicate object key");
    expect(() => parseRelationalInferenceJson('{"\\u0061":1,"a":2}')).toThrow("duplicate object key");
    expect(() => parseRelationalInferenceJson("[".repeat(66) + "0" + "]".repeat(66))).toThrow("nesting depth");
    expect(() => parseRelationalInferenceJson(" ".repeat(1_000_001))).toThrow("exceeds 1000000 bytes");
    const nonFinite = copy();
    nonFinite.question.stakes = Number.POSITIVE_INFINITY;
    expect(() => validateRelationalInference(nonFinite, AS_OF)).toThrow("finite JSON numbers only");
  });

  test("checks real dates, observation chronology, and issued-as-of chronology", () => {
    const invalid = copy();
    invalid.issued_on = "2026-02-30";
    expect(() => validateRelationalInference(invalid, AS_OF)).toThrow("must be a real ISO date");

    const lateProbe = copy();
    lateProbe.probes[0].observed_on = "2026-08-17";
    expect(() => validateRelationalInference(lateProbe, AS_OF)).toThrow("cannot be observed after issuance");

    const future = copy();
    future.issued_on = "2026-08-17";
    future.probes.forEach((probe: any) => { probe.observed_on = "2026-08-17"; });
    expect(() => validateRelationalInference(future, AS_OF)).toThrow("cannot be dated after");
    expect(() => validateRelationalInference(future, { asOf: "2026-08-17" })).not.toThrow();

    const futureDraftObservation = copy();
    futureDraftObservation.state = "draft";
    futureDraftObservation.issued_on = "2026-08-18";
    futureDraftObservation.probes[0].observed_on = "2026-08-17";
    expect(() => validateRelationalInference(futureDraftObservation, AS_OF))
      .toThrow("cannot be observed after validation asOf 2026-08-16");
  });

  test("requires relation roles to reference declared objects and every realization to bind every role exactly once", () => {
    const badRelation = copy();
    badRelation.pattern.relation_roles[0].sources[0] = "private-mind";
    expect(() => validateRelationalInference(badRelation, AS_OF)).toThrow("undeclared object role");

    const missing = copy();
    missing.realizations[0].object_bindings.pop();
    expect(() => validateRelationalInference(missing, AS_OF)).toThrow("must contain 3-3 entries");

    const duplicate = copy();
    duplicate.realizations[0].object_bindings[2].role_id = "input";
    expect(() => validateRelationalInference(duplicate, AS_OF)).toThrow("entries must be unique");
  });

  test("checks translation graph references, preserved roles, tests, and disclosed losses", () => {
    const overclaim = copy();
    overclaim.pattern.claim_type = "functor";
    expect(() => validateRelationalInference(overclaim, AS_OF)).toThrow("analogy, partial-map, lax-correspondence");

    const missingTarget = copy();
    missingTarget.translations[0].target_realization_id = "missing-realization";
    expect(() => validateRelationalInference(missingTarget, AS_OF)).toThrow("missing target realization");

    const undeclaredRelation = copy();
    undeclaredRelation.translations[0].preserved_relation_ids = ["invented-relation"];
    expect(() => validateRelationalInference(undeclaredRelation, AS_OF)).toThrow("preserves undeclared relation role");

    const undeclaredLoss = copy();
    undeclaredLoss.translations[0].unpreserved_relation_ids = ["invented-relation"];
    expect(() => validateRelationalInference(undeclaredLoss, AS_OF)).toThrow("marks undeclared relation role");

    const overlappingPartition = copy();
    overlappingPartition.translations[0].unpreserved_relation_ids = ["constraint-flow"];
    expect(() => validateRelationalInference(overlappingPartition, AS_OF)).toThrow("partition entries must be unique");

    const incompletePartition = copy();
    incompletePartition.pattern.relation_roles.push({
      id: "scope-link",
      type: "scope-relation",
      sources: ["context"],
      targets: ["output"],
      description: "A second declared relation used to test complete translation accounting.",
    });
    incompletePartition.realizations.forEach((realization: any) => realization.relation_bindings.push({
      role_id: "scope-link",
      binding: "A bounded scope marker in this realization.",
    }));
    expect(() => validateRelationalInference(incompletePartition, AS_OF)).toThrow("cover every relation role exactly once");

    const isolatedRealization = copy();
    const third = structuredClone(isolatedRealization.realizations[0]);
    third.id = "isolated-realization";
    isolatedRealization.realizations.push(third);
    expect(() => validateRelationalInference(isolatedRealization, AS_OF)).toThrow("must be incident to at least one translation");

    const duplicateTest = copy();
    duplicateTest.translations[0].tests.push(structuredClone(duplicateTest.translations[0].tests[0]));
    expect(() => validateRelationalInference(duplicateTest, AS_OF)).toThrow("test ids entries must be unique");

    const concealedLoss = copy();
    concealedLoss.translations[0].known_losses[0].disclosed = false;
    expect(() => validateRelationalInference(concealedLoss, AS_OF)).toThrow("must be disclosed");

    const honestFailure = copy();
    honestFailure.translations[0].preserved_relation_ids = [];
    honestFailure.translations[0].unpreserved_relation_ids = ["constraint-flow"];
    expect(() => validateRelationalInference(honestFailure, AS_OF)).not.toThrow();

    const undisclosedFailure = structuredClone(honestFailure);
    undisclosedFailure.translations[0].known_losses = [];
    expect(() => validateRelationalInference(undisclosedFailure, AS_OF)).toThrow("must disclose at least one known loss");
  });

  test("requires every unordered probe pair and internally coherent dependency declarations", () => {
    const missing = copy();
    missing.probe_dependencies.pop();
    expect(() => validateRelationalInference(missing, AS_OF)).toThrow("cover all 3 unordered probe pairs exactly once");

    const reverseDuplicate = copy();
    reverseDuplicate.probe_dependencies[2] = {
      ...structuredClone(reverseDuplicate.probe_dependencies[0]),
      probe_ids: ["external-reader-probe", "round-trip-probe"],
    };
    expect(() => validateRelationalInference(reverseDuplicate, AS_OF)).toThrow("is duplicated");

    const selfPair = copy();
    selfPair.probe_dependencies[0].probe_ids = ["round-trip-probe", "round-trip-probe"];
    expect(() => validateRelationalInference(selfPair, AS_OF)).toThrow("cannot pair a probe with itself");

    const falseIndependence = copy();
    falseIndependence.probes[1].source_ref = falseIndependence.probes[0].source_ref;
    expect(() => validateRelationalInference(falseIndependence, AS_OF)).toThrow("same or canonically aliased source_ref");

    const aliasedSource = copy();
    aliasedSource.probes[1].source_ref = "artifact:round%2Dtrip%2Dresult";
    expect(() => validateRelationalInference(aliasedSource, AS_OF)).toThrow("canonically aliased source_ref");

    const sharedFactorIndependence = copy();
    sharedFactorIndependence.probes[1].shared_factors.push("synthetic-glossary");
    expect(() => validateRelationalInference(sharedFactorIndependence, AS_OF)).toThrow("share a declared factor");

    const missingSharedFactor = copy();
    missingSharedFactor.probes[2].shared_factors = ["third-unrelated-path"];
    expect(() => validateRelationalInference(missingSharedFactor, AS_OF)).toThrow("must name at least one shared factor");

    const falseSharedSystematic = copy();
    falseSharedSystematic.probe_dependencies[0].relationship = "shared-systematic";
    expect(() => validateRelationalInference(falseSharedSystematic, AS_OF)).toThrow("must name at least one shared factor");
  });

  test("couples run status to source, date, and access while hardening references", () => {
    for (const field of ["context", "scale", "sensitivity_scope", "backgrounds", "selection_effects", "shared_factors"]) {
      const missingField = copy();
      delete missingField.probes[0][field];
      expect(() => validateRelationalInference(missingField, AS_OF)).toThrow("must contain exactly");
    }
    for (const field of ["backgrounds", "selection_effects", "shared_factors"]) {
      const emptyField = copy();
      emptyField.probes[0][field] = [];
      expect(() => validateRelationalInference(emptyField, AS_OF)).toThrow("must contain 1-32 entries");
    }
    const factorAliasWithinProbe = copy();
    factorAliasWithinProbe.probes[0].shared_factors.push("synthetic-glossary");
    expect(() => validateRelationalInference(factorAliasWithinProbe, AS_OF)).toThrow("shared_factors entries must be unique");

    const zeroWidthFactorAlias = copy();
    zeroWidthFactorAlias.probes[1].shared_factors = ["synthetic-\u200bglossary"];
    expect(() => validateRelationalInference(zeroWidthFactorAlias, AS_OF)).toThrow("lowercase hyphenated identifier");

    const unknownWithSource = copy();
    unknownWithSource.probes[0].epistemic_access = "unknown";
    expect(() => validateRelationalInference(unknownWithSource, AS_OF)).toThrow("completed or inconclusive status requires");

    const directWithoutDate = copy();
    directWithoutDate.probes[0].observed_on = null;
    expect(() => validateRelationalInference(directWithoutDate, AS_OF)).toThrow("completed or inconclusive status requires");

    const falseNotRun = copy();
    falseNotRun.probes[0].run_status = "not-run";
    expect(() => validateRelationalInference(falseNotRun, AS_OF)).toThrow("not-run status requires null source_ref");

    const validNotRun = copy();
    Object.assign(validNotRun.probes[0], {
      run_status: "not-run",
      source_ref: null,
      observed_on: null,
      epistemic_access: "unknown",
    });
    validNotRun.candidate_models.forEach((model: any) => {
      model.probe_assessments.find((assessment: any) => assessment.probe_id === "round-trip-probe").result = "unassessed";
    });
    expect(() => validateRelationalInference(validNotRun, AS_OF)).not.toThrow();

    const assessedNotRun = structuredClone(validNotRun);
    assessedNotRun.candidate_models[0].probe_assessments[0].result = "compatible";
    expect(() => validateRelationalInference(assessedNotRun, AS_OF)).toThrow("must leave not-run probe");

    const inconclusive = copy();
    inconclusive.probes[0].run_status = "inconclusive";
    expect(() => validateRelationalInference(inconclusive, AS_OF)).not.toThrow();

    for (const ref of [
      "https://user:pass@example.test/evidence",
      "https://example.test/evidence?token=SECRET",
      "//example.test/evidence",
      "../../outside.json",
      "/absolute/path.json",
      "evidence.json\nforged.json",
      "artifact:encoded%00control",
      "artifact:encoded%1fcontrol",
      "artifact:encoded%7fdel",
      "artifact:encoded%2fslash",
      "artifact:encoded%5cbackslash",
      "artifact:double-encoded%252fslash",
      "artifact:malformed%GGencoding",
      "https://example.test/encoded%2Fslash",
      "https://EXAMPLE.test/noncanonical-host",
      "https://example.test:443/noncanonical-port",
      "ARTIFACT:uppercase-scheme",
    ]) {
      const unsafe = copy();
      unsafe.probes[0].source_ref = ref;
      expect(() => validateRelationalInference(unsafe, AS_OF)).toThrow();
    }
    const nonexistent = copy();
    nonexistent.probes[0].source_ref = "reports/not-dereferenced.json";
    expect(() => validateRelationalInference(nonexistent, AS_OF)).not.toThrow();
  });

  test("requires complete probe assessment coverage and a countermodel", () => {
    const missingAssessment = copy();
    missingAssessment.candidate_models[0].probe_assessments.pop();
    expect(() => validateRelationalInference(missingAssessment, AS_OF)).toThrow("must contain 3-3 entries");

    const duplicateAssessment = copy();
    duplicateAssessment.candidate_models[0].probe_assessments[2].probe_id = "round-trip-probe";
    expect(() => validateRelationalInference(duplicateAssessment, AS_OF)).toThrow("entries must be unique");

    const noCountermodel = copy();
    noCountermodel.candidate_models.forEach((model: any) => { model.role = "working"; });
    expect(() => validateRelationalInference(noCountermodel, AS_OF)).toThrow("non-working unresolved");

    const oldField = copy();
    oldField.candidate_models[0].falsifier = oldField.candidate_models[0].falsifier_or_refinement_condition;
    delete oldField.candidate_models[0].falsifier_or_refinement_condition;
    expect(() => validateRelationalInference(oldField, AS_OF)).toThrow("must contain exactly");

    const falseUnassessed = copy();
    falseUnassessed.candidate_models[0].status = "unassessed";
    expect(() => validateRelationalInference(falseUnassessed, AS_OF)).toThrow("if and only if every assessment is unassessed");

    const hiddenAssessment = copy();
    hiddenAssessment.candidate_models[0].probe_assessments.forEach((assessment: any) => {
      assessment.result = "unassessed";
    });
    expect(() => validateRelationalInference(hiddenAssessment, AS_OF)).toThrow("if and only if every assessment is unassessed");

    const falseLive = copy();
    falseLive.candidate_models[0].probe_assessments.forEach((assessment: any) => {
      assessment.result = "tension";
    });
    expect(() => validateRelationalInference(falseLive, AS_OF)).toThrow("live status requires a compatible");

    const falseConstrained = copy();
    falseConstrained.candidate_models[1].probe_assessments.forEach((assessment: any) => {
      assessment.result = "compatible";
    });
    expect(() => validateRelationalInference(falseConstrained, AS_OF)).toThrow("constrained status requires");

    const fakeContradiction = copy();
    fakeContradiction.candidate_models[1].status = "contradicted-under-test";
    expect(() => validateRelationalInference(fakeContradiction, AS_OF)).toThrow("requires a contradicted assessment");

    const resolvedCountermodel = copy();
    resolvedCountermodel.candidate_models[1].status = "contradicted-under-test";
    resolvedCountermodel.candidate_models[1].probe_assessments[0].result = "contradicted-under-test";
    expect(() => validateRelationalInference(resolvedCountermodel, AS_OF)).toThrow("non-working unresolved");
  });

  test("forbids high confidence and bounds medium to two completed, sufficiently separated probes", () => {
    const high = copy();
    high.inference.declared_confidence = "high";
    expect(() => validateRelationalInference(high, AS_OF)).toThrow("medium, low, unknown");

    const shared = copy();
    shared.probe_dependencies[0].relationship = "unknown";
    shared.probe_dependencies[1].relationship = "shared-systematic";
    shared.probe_dependencies[2].relationship = "shared-systematic";
    expect(() => validateRelationalInference(shared, AS_OF)).toThrow("completed probe pair assessed within");

    const tooFewCompleted = copy();
    for (const probe of tooFewCompleted.probes.slice(0, 2)) {
      Object.assign(probe, {
        run_status: "inconclusive",
      });
    }
    expect(() => validateRelationalInference(tooFewCompleted, AS_OF)).toThrow("completed probe pair assessed within");

    const low = structuredClone(tooFewCompleted);
    low.inference.declared_confidence = "low";
    expect(() => validateRelationalInference(low, AS_OF)).not.toThrow();

    const mediumWithNotRun = copy();
    for (const probe of mediumWithNotRun.probes.slice(0, 2)) {
      Object.assign(probe, {
        run_status: "not-run",
        source_ref: null,
        observed_on: null,
        epistemic_access: "unknown",
      });
    }
    mediumWithNotRun.candidate_models.forEach((model: any) => {
      model.probe_assessments.slice(0, 2).forEach((assessment: any) => { assessment.result = "unassessed"; });
    });
    mediumWithNotRun.candidate_models[1].status = "live";
    expect(() => validateRelationalInference(mediumWithNotRun, AS_OF)).toThrow("completed probe pair assessed within");

    const unassessed = copy();
    unassessed.candidate_models.forEach((model: any) => {
      model.probe_assessments.forEach((assessment: any) => { assessment.result = "unassessed"; });
      model.status = "unassessed";
    });
    expect(() => validateRelationalInference(unassessed, AS_OF)).toThrow("completed probe pair assessed within");

    const splitAcrossModels = copy();
    splitAcrossModels.candidate_models.forEach((model: any) => {
      model.probe_assessments.forEach((assessment: any) => { assessment.result = "unassessed"; });
      model.status = "unassessed";
    });
    splitAcrossModels.candidate_models[0].probe_assessments[0].result = "compatible";
    splitAcrossModels.candidate_models[0].status = "live";
    splitAcrossModels.candidate_models[1].probe_assessments[1].result = "compatible";
    splitAcrossModels.candidate_models[1].status = "live";
    expect(() => validateRelationalInference(splitAcrossModels, AS_OF)).toThrow("assessed within the same candidate model");

    const weakModelContrast = copy();
    weakModelContrast.inference.conclusion_status = "model-contrast";
    weakModelContrast.candidate_models[1].probe_assessments.forEach((assessment: any) => {
      assessment.result = "unassessed";
    });
    weakModelContrast.candidate_models[1].status = "unassessed";
    expect(() => validateRelationalInference(weakModelContrast, AS_OF)).toThrow("two candidate models assessed on one common completed probe");

    const plannedOnlyContrast = copy();
    plannedOnlyContrast.inference.conclusion_status = "model-contrast";
    plannedOnlyContrast.inference.declared_confidence = "low";
    plannedOnlyContrast.probes.forEach((probe: any) => {
      Object.assign(probe, {
        run_status: "not-run",
        source_ref: null,
        observed_on: null,
        epistemic_access: "unknown",
      });
    });
    plannedOnlyContrast.candidate_models.forEach((model: any) => {
      model.probe_assessments.forEach((assessment: any) => { assessment.result = "unassessed"; });
      model.status = "unassessed";
    });
    expect(() => validateRelationalInference(plannedOnlyContrast, AS_OF)).toThrow("planned or unassessed contrasts are not conclusions");
  });

  test("keeps v0.1 public-artifact, non-authorizing, consent-inapplicable, and descriptive", () => {
    for (const scope of ["collective-public", "other-private", "self"]) {
      const expanded = copy();
      expanded.boundaries.representation_scope = scope;
      expect(() => validateRelationalInference(expanded, AS_OF)).toThrow("none, artifact-public");
    }
    const privateMaterial = copy();
    privateMaterial.boundaries.privacy = "authorized-private";
    expect(() => validateRelationalInference(privateMaterial, AS_OF)).toThrow("public-only, redacted");

    for (const actionability of ["reversible", "irreversible"]) {
      const action = copy();
      action.boundaries.actionability = actionability;
      expect(() => validateRelationalInference(action, AS_OF)).toThrow("must remain descriptive");
    }
    const consent = copy();
    consent.boundaries.consent_status = "explicit-obtained";
    expect(() => validateRelationalInference(consent, AS_OF)).toThrow("must remain not-applicable");

    for (const field of [
      "authority_scope", "authority_basis", "authority_ref",
      "consent_subject", "consent_scope", "consent_basis", "consent_ref",
    ]) {
      const provenance = copy();
      provenance.boundaries[field] = field.endsWith("_ref") ? "artifact:forbidden-provenance" : "Forbidden v0.1 provenance";
      expect(() => validateRelationalInference(provenance, AS_OF)).toThrow(`${field} must remain null`);
    }
  });

  test("holds deception, privacy, intent, harm, and safety non-grants fixed", () => {
    for (const field of [
      "unobserved_is_not_deception",
      "privacy_is_not_deception",
      "protective_nondisclosure_may_be_permissible",
    ]) {
      const unsafe = copy();
      unsafe.harm_boundary[field] = false;
      expect(() => validateRelationalInference(unsafe, AS_OF)).toThrow("must remain true");
    }
    const intent = copy();
    intent.harm_boundary.intent_status = "inferred";
    expect(() => validateRelationalInference(intent, AS_OF)).toThrow("must remain not-assessed");

    for (const field of [
      "proves_hidden_cause", "proves_causation", "proves_identity", "infers_intent", "labels_deception",
      "rates_people", "permits_surveillance",
    ]) {
      const unsafe = copy();
      unsafe.safety[field] = true;
      expect(() => validateRelationalInference(unsafe, AS_OF)).toThrow(`${field} must remain false`);
    }

    const causalClaim = copy();
    causalClaim.harm_boundary.causal_status = "supported";
    expect(() => validateRelationalInference(causalClaim, AS_OF)).toThrow("none-observed, possible, unknown");

    const dutyClaim = copy();
    dutyClaim.harm_boundary.duty_status = "separately-evidenced";
    expect(() => validateRelationalInference(dutyClaim, AS_OF)).toThrow("not-assessed, external-process-required");
  });

  test("validates repair consistency, target existence, chronology, uniqueness, and cycles", () => {
    const original = fixture();
    const correction = copy();
    correction.id = "reasoning-word-correction";
    correction.repair = { ...correction.repair, relation: "corrects", target_case_id: original.id };
    expect(() => validateRelationalInferenceSet([original, correction], AS_OF)).not.toThrow();

    correction.repair.target_case_id = null;
    expect(() => validateRelationalInference(correction, AS_OF)).toThrow("must name a target case identifier");
    correction.repair.target_case_id = original.id;
    expect(() => validateRelationalInferenceSet([correction], AS_OF)).toThrow("targets missing case");
    expect(() => validateRelationalInferenceSet([original, fixture()], AS_OF)).toThrow("Duplicate relational inference case id");

    const later = copy();
    later.id = "later-case";
    later.issued_on = "2026-08-17";
    later.probes.forEach((probe: any) => { probe.observed_on = "2026-08-17"; });
    const early = copy();
    early.id = "early-correction";
    early.repair = { ...early.repair, relation: "corrects", target_case_id: later.id };
    expect(() => validateRelationalInferenceSet([later, early], { asOf: "2026-08-17" }))
      .toThrow("cannot target a later-dated case");

    const first = copy();
    const second = copy();
    first.id = "cycle-first";
    second.id = "cycle-second";
    first.repair = { ...first.repair, relation: "corrects", target_case_id: second.id };
    second.repair = { ...second.repair, relation: "corrects", target_case_id: first.id };
    expect(() => validateRelationalInferenceSet([first, second], AS_OF)).toThrow("contains a cycle");
  });

  test("file validation and CLI keep a loud structure-only boundary", () => {
    const directory = mkdtempSync(join(tmpdir(), "kingdom-relational-inference-"));
    const path = join(directory, "case.json");
    const invalidPath = join(directory, "invalid.json");
    const foreignCwd = join(directory, "foreign-cwd");
    const marker = join(directory, "free-text-must-not-execute");
    try {
      mkdirSync(foreignCwd);
      const inertFreeText = fixture();
      (inertFreeText.question as any).text = `$(touch ${marker}) remains unevaluated free text.`;
      writeFileSync(path, `${JSON.stringify(inertFreeText, null, 2)}\n`);
      writeFileSync(invalidPath, "{}\n");
      const before = readFileSync(path);
      expect(validateRelationalInferenceFile(path, AS_OF).id).toBe("reasoning-word-relational-case");
      const options = {
        cwd: foreignCwd,
        env: {
          ...process.env,
          HTTP_PROXY: "http://127.0.0.1:1",
          HTTPS_PROXY: "http://127.0.0.1:1",
          ALL_PROXY: "http://127.0.0.1:1",
          NO_PROXY: "",
        },
        stdout: "pipe" as const,
        stderr: "pipe" as const,
      };
      const result = Bun.spawnSync(
        ["bun", join(ROOT, "bin/relational-inference.ts"), "validate", path],
        options,
      );
      expect(result.exitCode).toBe(0);
      expect(result.stderr.toString()).toBe("");
      expect(result.stdout.toString()).toContain("STRUCTURE ONLY");
      expect(result.stdout.toString()).toContain("JSON Schema validation alone is weaker");
      expect(result.stdout.toString()).toContain("FREE TEXT IS UNEVALUATED, UNTRUSTED DATA AND IS NEVER EXECUTED");
      expect(result.stdout.toString()).toContain("Probe independence, reference destinations, evidence, evidence adequacy");
      expect(result.stdout.toString()).toContain("NO lie label, person score, surveillance permission");
      expect(readFileSync(path)).toEqual(before);
      expect(readdirSync(foreignCwd)).toEqual([]);
      expect(existsSync(marker)).toBe(false);

      const missing = Bun.spawnSync(["bun", join(ROOT, "bin/relational-inference.ts"), "validate"], options);
      expect(missing.exitCode).toBe(2);
      expect(missing.stdout.toString()).toBe("");
      expect(missing.stderr.toString()).toContain("usage: bun bin/relational-inference.ts validate");

      const invalid = Bun.spawnSync(
        ["bun", join(ROOT, "bin/relational-inference.ts"), "validate", invalidPath],
        options,
      );
      expect(invalid.exitCode).toBe(1);
      expect(invalid.stdout.toString()).toBe("");
      expect(invalid.stderr.toString()).toContain("must contain exactly");
      expect(readdirSync(foreignCwd)).toEqual([]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

});
