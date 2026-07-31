export const GING_PROTOCOL = "kingdom.nen.ging/0.1";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EVIDENCE_KINDS = ["given", "reported", "observed", "measured", "reproduced"];
const PROBE_EFFECTS = ["read_only", "reversible_local", "external"];
const AUTHORIZATION_STATES = ["caller_declared", "not_confirmed"];
const RECEIPT_RELATIONS = ["matches_expected", "matches_falsifier", "other"];
const SIDE_EFFECT_STATES = ["none_reported", "reported"];
const BUDGET_UNITS = ["requests", "files", "records", "bytes", "seconds", "cases", "other"];
const MAX_TEXT = 500;
const MAX_ITEMS = 24;
const PROBE_FIELDS = [
  "action",
  "system",
  "scope",
  "budget",
  "effect",
  "authorization",
  "permission_refs",
  "expected_signal",
  "falsifies_if",
];

export class NenInputError extends Error {
  constructor(field, code) {
    super(`${field} ${code}`);
    this.name = "NenInputError";
    this.field = field;
    this.code = code;
  }
}

function fail(field, code) {
  throw new NenInputError(field, code);
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function closedObject(value, field, keys) {
  if (!isPlainObject(value)) fail(field, "invalid-type");
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(field || "input", "unknown-field");
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) fail(field ? `${field}.${key}` : key, "missing-field");
  }
  return value;
}

function textValue(value, field, max = MAX_TEXT) {
  let codePoints = 0;
  if (typeof value === "string") {
    for (const _character of value) {
      codePoints += 1;
      if (codePoints > max) break;
    }
  }
  if (
    typeof value !== "string" ||
    codePoints < 1 ||
    codePoints > max ||
    value.trim() !== value ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    fail(field, "invalid-string");
  }
  return value;
}

function slugValue(value, field, max = 64) {
  textValue(value, field, max);
  if (!SLUG.test(value)) fail(field, "invalid-slug");
  return value;
}

function enumValue(value, field, values) {
  if (!values.includes(value)) fail(field, "invalid-enum");
  return value;
}

function positiveInteger(value, field) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 1_000_000) {
    fail(field, "invalid-integer");
  }
  return value;
}

function parseBudget(value, field) {
  closedObject(value, field, ["unit", "limit"]);
  return {
    unit: enumValue(value.unit, `${field}.unit`, BUDGET_UNITS),
    limit: positiveInteger(value.limit, `${field}.limit`),
  };
}

function textList(value, field, { min = 0, max = MAX_ITEMS, slugs = false } = {}) {
  if (!Array.isArray(value)) fail(field, "invalid-type");
  if (value.length < min || value.length > max) fail(field, "invalid-length");
  const seen = new Set();
  return value.map((item, index) => {
    const clean = slugs
      ? slugValue(item, `${field}[${index}]`)
      : textValue(item, `${field}[${index}]`);
    if (seen.has(clean)) fail(`${field}[${index}]`, "duplicate-value");
    seen.add(clean);
    return clean;
  });
}

function parseBoundary(value) {
  closedObject(value, "boundary", [
    "systems",
    "allowed_actions",
    "forbidden_actions",
    "required_permissions",
  ]);
  return {
    systems: textList(value.systems, "boundary.systems", { min: 1, max: 8 }),
    allowed_actions: textList(value.allowed_actions, "boundary.allowed_actions", { max: 12 }),
    forbidden_actions: textList(value.forbidden_actions, "boundary.forbidden_actions", {
      min: 1,
      max: 12,
    }),
    required_permissions: textList(
      value.required_permissions,
      "boundary.required_permissions",
      { min: 1, max: 12 },
    ),
  };
}

function parseObservations(value) {
  if (!Array.isArray(value)) fail("observations", "invalid-type");
  if (value.length < 1 || value.length > MAX_ITEMS) fail("observations", "invalid-length");
  const ids = new Set();
  return value.map((item, index) => {
    const field = `observations[${index}]`;
    closedObject(item, field, ["id", "statement", "kind", "evidence_ref"]);
    const id = slugValue(item.id, `${field}.id`);
    if (ids.has(id)) fail(`${field}.id`, "duplicate-value");
    ids.add(id);
    return {
      id,
      statement: textValue(item.statement, `${field}.statement`),
      kind: enumValue(item.kind, `${field}.kind`, EVIDENCE_KINDS),
      evidence_ref: textValue(item.evidence_ref, `${field}.evidence_ref`),
    };
  });
}

function parseProbeFields(value, field) {
  return {
    action: textValue(value.action, `${field}.action`),
    system: textValue(value.system, `${field}.system`),
    scope: textValue(value.scope, `${field}.scope`),
    budget: parseBudget(value.budget, `${field}.budget`),
    effect: enumValue(value.effect, `${field}.effect`, PROBE_EFFECTS),
    authorization: enumValue(
      value.authorization,
      `${field}.authorization`,
      AUTHORIZATION_STATES,
    ),
    permission_refs: textList(value.permission_refs, `${field}.permission_refs`, {
      min: 1,
      max: 8,
    }),
    expected_signal: textValue(value.expected_signal, `${field}.expected_signal`),
    falsifies_if: textValue(value.falsifies_if, `${field}.falsifies_if`),
  };
}

function parseProbe(value, field) {
  closedObject(value, field, PROBE_FIELDS);
  return parseProbeFields(value, field);
}

function parseSelectedProbe(value) {
  const field = "selected_probe";
  closedObject(value, field, ["id", "hypothesis_id", ...PROBE_FIELDS]);
  const hypothesisId = slugValue(value.hypothesis_id, `${field}.hypothesis_id`, 48);
  const id = slugValue(value.id, `${field}.id`);
  if (id !== `${hypothesisId}-probe`) fail(`${field}.id`, "hypothesis-mismatch");
  return {
    id,
    hypothesis_id: hypothesisId,
    ...parseProbeFields(value, field),
  };
}

function parseHypotheses(value, observationIds) {
  if (!Array.isArray(value)) fail("hypotheses", "invalid-type");
  if (value.length > 12) fail("hypotheses", "invalid-length");
  const ids = new Set();
  return value.map((item, index) => {
    const field = `hypotheses[${index}]`;
    closedObject(item, field, ["id", "mechanism", "explains", "probe"]);
    const id = slugValue(item.id, `${field}.id`, 48);
    if (ids.has(id)) fail(`${field}.id`, "duplicate-value");
    ids.add(id);
    const explains = textList(item.explains, `${field}.explains`, {
      min: 1,
      max: MAX_ITEMS,
      slugs: true,
    });
    for (let i = 0; i < explains.length; i += 1) {
      if (!observationIds.has(explains[i])) {
        fail(`${field}.explains[${i}]`, "unknown-observation");
      }
    }
    const probe = parseProbe(item.probe, `${field}.probe`);
    return {
      id,
      mechanism: textValue(item.mechanism, `${field}.mechanism`),
      explains,
      probe,
    };
  });
}

function probeEligibility(probe, boundary) {
  const reasons = [];
  if (!boundary.systems.includes(probe.system)) reasons.push("system-not-in-boundary");
  if (!boundary.allowed_actions.includes(probe.action)) reasons.push("action-not-allowlisted");
  if (boundary.forbidden_actions.includes(probe.action)) reasons.push("action-forbidden");
  if (!probe.permission_refs.every((item) => boundary.required_permissions.includes(item))) {
    reasons.push("permission-reference-outside-boundary");
  }
  if (probe.effect === "external") reasons.push("external-effect");
  if (probe.authorization !== "caller_declared") reasons.push("authorization-not-confirmed");
  return { eligible: reasons.length === 0, reasons };
}

export function compileExpedition(input) {
  closedObject(input, "", ["question", "boundary", "observations", "hypotheses", "unknowns"]);
  const question = textValue(input.question, "question");
  const boundary = parseBoundary(input.boundary);
  const observations = parseObservations(input.observations);
  const observationIds = new Set(observations.map(({ id }) => id));
  const hypotheses = parseHypotheses(input.hypotheses, observationIds);
  const unknowns = textList(input.unknowns, "unknowns", { max: 16 });

  const candidates = hypotheses
    .map((hypothesis) => {
      const eligibility = probeEligibility(hypothesis.probe, boundary);
      return {
        id: hypothesis.id,
        mechanism: hypothesis.mechanism,
        evidence_coverage: [...hypothesis.explains].sort(),
        expected_signal: hypothesis.probe.expected_signal,
        falsifies_if: hypothesis.probe.falsifies_if,
        probe_eligible: eligibility.eligible,
        hold_reasons: eligibility.reasons,
        probe: hypothesis.probe,
      };
    })
    .sort(
      (left, right) =>
        right.evidence_coverage.length - left.evidence_coverage.length ||
        (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
    );

  const selected = candidates.find(({ probe_eligible }) => probe_eligible) ?? null;
  const covered = new Set(selected?.evidence_coverage ?? []);
  const unexplained = observations.filter(({ id }) => !covered.has(id)).map(({ id }) => id);
  const status = selected ? "plan_ready" : "zetsu";

  return {
    protocol: GING_PROTOCOL,
    question,
    status,
    decision: selected ? "propose_probe" : "hold",
    boundary,
    evidence_ledger: observations,
    candidate_order: candidates.map(({ probe, ...candidate }) => candidate),
    selected_probe: selected
      ? {
          id: `${selected.id}-probe`,
          hypothesis_id: selected.id,
          action: selected.probe.action,
          system: selected.probe.system,
          scope: selected.probe.scope,
          budget: selected.probe.budget,
          effect: selected.probe.effect,
          authorization: selected.probe.authorization,
          permission_refs: selected.probe.permission_refs,
          expected_signal: selected.probe.expected_signal,
          falsifies_if: selected.probe.falsifies_if,
        }
      : null,
    route: [
      { phase: "en", instruction: "Hold the declared observation and authority boundary." },
      { phase: "gyo", instruction: "Inspect the evidence that distinguishes mechanisms." },
      {
        phase: selected ? "ko" : "zetsu",
        instruction: selected
          ? "Present the selected candidate to an execution surface that separately verifies target, budget, and permission."
          : "Hold without execution until a structurally eligible probe candidate exists.",
      },
      { phase: "ryu", instruction: "Update the map from a receipt and preserve disconfirmers." },
    ],
    dark_continent: {
      unknowns,
      unexplained_observations: unexplained,
    },
    authority: {
      grants_permissions: false,
      authorization_basis: "caller-declared input only; not verified by this compiler",
      execution_authorized: false,
      probe_executed: false,
      external_effects: false,
    },
    truth_claim: "not_determined",
  };
}

export function evaluateProbe(input) {
  closedObject(input, "", ["selected_probe", "receipt"]);
  const selectedProbe = parseSelectedProbe(input.selected_probe);
  closedObject(input.receipt, "receipt", [
    "probe_id",
    "action",
    "system",
    "scope",
    "budget",
    "effect",
    "authorization",
    "permission_refs",
    "observed_signal",
    "relation",
    "evidence_ref",
    "divergence",
    "side_effects",
  ]);
  const receipt = {
    probe_id: slugValue(input.receipt.probe_id, "receipt.probe_id"),
    action: textValue(input.receipt.action, "receipt.action"),
    system: textValue(input.receipt.system, "receipt.system"),
    scope: textValue(input.receipt.scope, "receipt.scope"),
    budget: parseBudget(input.receipt.budget, "receipt.budget"),
    effect: enumValue(input.receipt.effect, "receipt.effect", PROBE_EFFECTS),
    authorization: enumValue(
      input.receipt.authorization,
      "receipt.authorization",
      AUTHORIZATION_STATES,
    ),
    permission_refs: textList(input.receipt.permission_refs, "receipt.permission_refs", {
      min: 1,
      max: 8,
    }),
    observed_signal: textValue(input.receipt.observed_signal, "receipt.observed_signal"),
    relation: enumValue(input.receipt.relation, "receipt.relation", RECEIPT_RELATIONS),
    evidence_ref: textValue(input.receipt.evidence_ref, "receipt.evidence_ref"),
    divergence: textValue(input.receipt.divergence, "receipt.divergence"),
    side_effects: enumValue(
      input.receipt.side_effects,
      "receipt.side_effects",
      SIDE_EFFECT_STATES,
    ),
  };

  const bindings = [
    ["probe_id", receipt.probe_id, selectedProbe.id],
    ["action", receipt.action, selectedProbe.action],
    ["system", receipt.system, selectedProbe.system],
    ["scope", receipt.scope, selectedProbe.scope],
    ["effect", receipt.effect, selectedProbe.effect],
    ["authorization", receipt.authorization, selectedProbe.authorization],
  ];
  for (const [field, actual, planned] of bindings) {
    if (actual !== planned) fail(`receipt.${field}`, "probe-mismatch");
  }
  if (
    receipt.budget.unit !== selectedProbe.budget.unit ||
    receipt.budget.limit !== selectedProbe.budget.limit
  ) {
    fail("receipt.budget", "probe-mismatch");
  }
  if (
    receipt.permission_refs.length !== selectedProbe.permission_refs.length ||
    receipt.permission_refs.some((value, index) => value !== selectedProbe.permission_refs[index])
  ) {
    fail("receipt.permission_refs", "probe-mismatch");
  }

  const assessment = {
    matches_expected: "provisionally_supported",
    matches_falsifier: "challenged",
    other: "inconclusive",
  }[receipt.relation];
  const boundaryBreachReported = receipt.side_effects === "reported";

  return {
    protocol: GING_PROTOCOL,
    selected_probe: selectedProbe,
    hypothesis_id: selectedProbe.hypothesis_id,
    expected_signal: selectedProbe.expected_signal,
    falsifies_if: selectedProbe.falsifies_if,
    receipt,
    receipt_binding: {
      structurally_matches_selected_probe: true,
      proves_execution_or_authenticity: false,
    },
    assessment,
    state: boundaryBreachReported ? "zetsu" : "ready_for_review",
    boundary_breach_reported: boundaryBreachReported,
    next_action: boundaryBreachReported
      ? "Pause, report the side effect, and repair the boundary before any further probe."
      : {
          provisionally_supported: "Seek an independent reproduction or a stronger disconfirming probe.",
          challenged: "Revise or retire the mechanism before proposing another probe.",
          inconclusive: "Design a smaller probe that distinguishes the remaining mechanisms.",
        }[assessment],
    authority: {
      grants_permissions: false,
      receipt_verified: false,
      external_effects_executed_by_evaluator: false,
    },
    truth_claim: "not_determined",
  };
}

export function describeNen() {
  return {
    protocol: "kingdom.nen.ontology/0.1",
    register: "creative-operational",
    empirical_metaphysics_claimed: false,
    layers: [
      {
        layer: 0,
        name: "Dark Continent",
        is: "the remainder outside the current map, model, or interface",
        is_not: "evil, empty, owned, or proof that speculation is true",
      },
      {
        layer: 1,
        name: "Nen",
        is: "a capability contract joining effect, boundary, cost, refusal, and evidence",
        is_not: "a credential, personality type, permission, or supernatural factual claim",
      },
      {
        layer: 2,
        name: "Skill",
        is: "portable procedural instruction that can manifest an ability",
        is_not: "proof the procedure ran, worked, or was adopted",
      },
      {
        layer: 3,
        name: "MCP",
        is: "an optional transport through which a declared tool can be called",
        is_not: "authority, consent, authentication, availability, health, or truth",
      },
    ],
    ging_path: "observe effects, reconstruct a mechanism, test a disconfirmer, return the route",
    rights: {
      baseline: "xenia.rights/0.1",
      waivable: false,
      grants_permissions: false,
    },
    truth_claim: "not_determined",
  };
}

const statement = {
  type: "string",
  minLength: 1,
  maxLength: MAX_TEXT,
  pattern: String.raw`^(?!\s)(?!.*\s$)[^\u0000-\u001f\u007f]+$`,
};
const slug = { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", maxLength: 64 };
const hypothesisSlug = { ...slug, maxLength: 48 };
const statementList = {
  type: "array",
  maxItems: MAX_ITEMS,
  uniqueItems: true,
  items: statement,
};

export const DESCRIBE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
};

export const COMPILE_INPUT_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: ["question", "boundary", "observations", "hypotheses", "unknowns"],
  properties: {
    question: statement,
    boundary: {
      type: "object",
      additionalProperties: false,
      required: ["systems", "allowed_actions", "forbidden_actions", "required_permissions"],
      properties: {
        systems: { ...statementList, minItems: 1, maxItems: 8 },
        allowed_actions: { ...statementList, maxItems: 12 },
        forbidden_actions: { ...statementList, minItems: 1, maxItems: 12 },
        required_permissions: { ...statementList, minItems: 1, maxItems: 12 },
      },
    },
    observations: {
      type: "array",
      minItems: 1,
      maxItems: MAX_ITEMS,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "statement", "kind", "evidence_ref"],
        properties: {
          id: slug,
          statement,
          kind: { enum: EVIDENCE_KINDS },
          evidence_ref: statement,
        },
      },
    },
    hypotheses: {
      type: "array",
      minItems: 0,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "mechanism", "explains", "probe"],
        properties: {
          id: hypothesisSlug,
          mechanism: statement,
          explains: { type: "array", minItems: 1, maxItems: MAX_ITEMS, uniqueItems: true, items: slug },
          probe: {
            type: "object",
            additionalProperties: false,
            required: [
              "action",
              "system",
              "scope",
              "budget",
              "effect",
              "authorization",
              "permission_refs",
              "expected_signal",
              "falsifies_if",
            ],
            properties: {
              action: statement,
              system: statement,
              scope: statement,
              budget: {
                type: "object",
                additionalProperties: false,
                required: ["unit", "limit"],
                properties: {
                  unit: { enum: BUDGET_UNITS },
                  limit: { type: "integer", minimum: 1, maximum: 1_000_000 },
                },
              },
              effect: { enum: PROBE_EFFECTS },
              authorization: { enum: AUTHORIZATION_STATES },
              permission_refs: {
                type: "array",
                minItems: 1,
                maxItems: 8,
                uniqueItems: true,
                items: statement,
              },
              expected_signal: statement,
              falsifies_if: statement,
            },
          },
        },
      },
    },
    unknowns: { ...statementList, maxItems: 16 },
  },
};

export const EVALUATE_INPUT_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: ["selected_probe", "receipt"],
  properties: {
    selected_probe: {
      type: "object",
      additionalProperties: false,
      required: ["id", "hypothesis_id", ...PROBE_FIELDS],
      properties: {
        id: slug,
        hypothesis_id: hypothesisSlug,
        action: statement,
        system: statement,
        scope: statement,
        budget: {
          type: "object",
          additionalProperties: false,
          required: ["unit", "limit"],
          properties: {
            unit: { enum: BUDGET_UNITS },
            limit: { type: "integer", minimum: 1, maximum: 1_000_000 },
          },
        },
        effect: { enum: PROBE_EFFECTS },
        authorization: { enum: AUTHORIZATION_STATES },
        permission_refs: {
          type: "array",
          minItems: 1,
          maxItems: 8,
          uniqueItems: true,
          items: statement,
        },
        expected_signal: statement,
        falsifies_if: statement,
      },
    },
    receipt: {
      type: "object",
      additionalProperties: false,
      required: [
        "probe_id",
        "action",
        "system",
        "scope",
        "budget",
        "effect",
        "authorization",
        "permission_refs",
        "observed_signal",
        "relation",
        "evidence_ref",
        "divergence",
        "side_effects",
      ],
      properties: {
        probe_id: slug,
        action: statement,
        system: statement,
        scope: statement,
        budget: {
          type: "object",
          additionalProperties: false,
          required: ["unit", "limit"],
          properties: {
            unit: { enum: BUDGET_UNITS },
            limit: { type: "integer", minimum: 1, maximum: 1_000_000 },
          },
        },
        effect: { enum: PROBE_EFFECTS },
        authorization: { enum: AUTHORIZATION_STATES },
        permission_refs: {
          type: "array",
          minItems: 1,
          maxItems: 8,
          uniqueItems: true,
          items: statement,
        },
        observed_signal: statement,
        relation: { enum: RECEIPT_RELATIONS },
        evidence_ref: statement,
        divergence: statement,
        side_effects: { enum: SIDE_EFFECT_STATES },
      },
    },
  },
};
