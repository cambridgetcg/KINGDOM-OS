/**
 * Read-only validator for opt-in semantic transition receipts.
 *
 * It checks that a proposed transformation declares its types, invariants,
 * losses, warrant, boundaries, and repair paths. Passing this validator does
 * not prove fidelity, truth, authority, consent, intent, identity, or
 * understanding.
 */

import { readFileSync } from "node:fs";
import { Buffer } from "node:buffer";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const SEMANTIC_TRANSITION_SCHEMA_VERSION = "kingdom.semantic-transition/0.1";

export const SEMANTIC_TRANSITION_KINDS = [
  "encode",
  "decode",
  "lexicalize",
  "translate",
  "summarize",
  "infer",
  "visualize",
  "operationalize",
  "metaphorize",
] as const;

export const SEMANTIC_STATEMENT_KINDS = [
  "observation",
  "expectation",
  "commitment",
  "consequence",
  "interpretation",
] as const;

export const SEMANTIC_EPISTEMIC_ACCESS = [
  "direct",
  "reported",
  "inferred",
  "unknown",
] as const;

export const SEMANTIC_EXPRESSION_ORIGINS = [
  "quoted",
  "authored",
  "translated",
  "generated",
  "visualized",
] as const;

export const SEMANTIC_EVIDENCE_ROLES = ["supports", "challenges", "context"] as const;
export const SEMANTIC_LOSS_ASSESSMENT_STATUSES = ["losses-declared", "none-identified"] as const;

export const SEMANTIC_DISTORTION_RISKS = [
  "uncertainty-stripping",
  "source-erasure",
  "authority-laundering",
  "scope-expansion",
  "context-collapse",
  "equivocation",
  "hidden-loss",
  "contradiction",
  "staleness",
  "evidence-fabrication",
  "identity-collapse",
  "irreversible-action",
  "other",
] as const;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_PATH = join(ROOT, "bridges/schemas/semantic-transition-receipt-0.1.json");
export const SEMANTIC_TRANSITION_JSON_SCHEMA = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));

type JsonRecord = Record<string, unknown>;

export type SemanticValidationOptions = { asOf?: string };

export type SemanticEndpoint = {
  domain: string;
  context: string;
  expression: string;
  expression_ref: string | null;
  statement_kind: typeof SEMANTIC_STATEMENT_KINDS[number];
  epistemic_access: typeof SEMANTIC_EPISTEMIC_ACCESS[number];
  expression_origin: typeof SEMANTIC_EXPRESSION_ORIGINS[number];
  intended_use: string;
};

export type SemanticEvidence = {
  id: string;
  ref: string;
  role: typeof SEMANTIC_EVIDENCE_ROLES[number];
  observed_on: string;
  sha256: string | null;
};

export type SemanticTransitionReceipt = {
  schema_version: typeof SEMANTIC_TRANSITION_SCHEMA_VERSION;
  id: string;
  issued_on: string;
  state: "draft" | "issued";
  relation: {
    kind: "original" | "corrects" | "supersedes" | "withdraws";
    target_receipt_id: string | null;
  };
  source: SemanticEndpoint;
  target: SemanticEndpoint;
  transition: {
    kind: typeof SEMANTIC_TRANSITION_KINDS[number];
    rule: string;
    preserved_relations: Array<{ name: string; source_form: string; target_form: string; test: string }>;
    discarded_structure: Array<{ name: string; consequence: string; disclosed: true }>;
    loss_assessment: { status: typeof SEMANTIC_LOSS_ASSESSMENT_STATUSES[number]; basis: string };
    introduced_assumptions: string[];
    new_evidence_refs: string[];
    counterexample: string;
    stop_condition: string;
  };
  warrant: {
    evidence: SemanticEvidence[];
    declared_confidence: "high" | "medium" | "low" | "unknown";
    confidence_basis: string;
    known_limits: string[];
    freshness: { assessed_on: string; reassess_when: string };
  };
  distortion_risks: Array<{ kind: typeof SEMANTIC_DISTORTION_RISKS[number]; mechanism: string; mitigation: string; residual: string }>;
  boundaries: {
    representation_scope: "none" | "self" | "other-public" | "other-private" | "artifact-public" | "collective";
    consent: "not-applicable" | "self-authored" | "explicit-obtained" | "refused" | "unknown";
    consent_subject: string | null;
    consent_scope: string | null;
    consent_basis: string | null;
    consent_ref: string | null;
    authority_scope: string | null;
    authority_basis: string | null;
    authority_ref: string | null;
    actionability: "descriptive" | "reversible";
    privacy: "public-only" | "authorized-private" | "redacted";
  };
  repair: {
    reply_route: string;
    correction_route: string;
    carry_challenges_forward: true;
    retain_prior_receipt: true;
  };
  safety: {
    grants_authority: false;
    grants_consent: false;
    proves_truth: false;
    infers_intent: false;
    rates_people: false;
    permits_surveillance: false;
  };
};

const FORBIDDEN_FIELD_NAMES = new Set([
  "biometrics",
  "chain_of_thought",
  "credentials",
  "inferred_intent",
  "intent_score",
  "liar",
  "lie_score",
  "moral_score",
  "person_score",
  "private_reasoning",
  "trust_score",
  "truth_score",
]);

function record(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} must contain exactly: ${expected.join(", ")}`);
  }
}

const MAX_RECEIPT_BYTES = 1_000_000;
const MAX_RECEIPT_DEPTH = 64;
const MAX_RECEIPT_NODES = 20_000;

function rejectForbiddenFields(value: unknown, path = "receipt"): void {
  const seen = new WeakSet<object>();
  const stack: Array<{ value: unknown; path: string; depth: number }> = [{ value, path, depth: 0 }];
  let nodes = 0;
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (++nodes > MAX_RECEIPT_NODES) throw new Error("Semantic transition receipt is too large");
    if (!current.value || typeof current.value !== "object") continue;
    if (current.depth > MAX_RECEIPT_DEPTH) throw new Error("Semantic transition receipt is nested too deeply");
    if (seen.has(current.value)) throw new Error("Semantic transition receipt must be an acyclic JSON tree");
    seen.add(current.value);
    const entries = Array.isArray(current.value)
      ? current.value.map((child, index) => [String(index), child] as const)
      : Object.entries(current.value as JsonRecord);
    if (nodes + stack.length + entries.length > MAX_RECEIPT_NODES) {
      throw new Error("Semantic transition receipt is too large");
    }
    for (const [key, child] of entries) {
      if (!Array.isArray(current.value) && FORBIDDEN_FIELD_NAMES.has(key.toLowerCase())) {
        throw new Error(`${current.path}.${key} is forbidden: receipts inspect transitions, not private minds or people`);
      }
      stack.push({
        value: child,
        path: Array.isArray(current.value) ? `${current.path}[${key}]` : `${current.path}.${key}`,
        depth: current.depth + 1,
      });
    }
  }
}

function text(value: unknown, label: string, minimum = 1, maximum = 2_000): string {
  if (typeof value !== "string") throw new Error(`${label} must be a string`);
  const trimmed = value.trim();
  if ([...trimmed].length < minimum || [...value].length > maximum) {
    throw new Error(`${label} must contain ${minimum}-${maximum} characters`);
  }
  if (/[\u0000-\u0008\u000b-\u001f]/u.test(value)) {
    throw new Error(`${label} must not contain control characters`);
  }
  return value;
}

function identifier(value: unknown, label: string): string {
  const result = text(value, label, 1, 100);
  if (result !== result.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) {
    throw new Error(`${label} must be a lowercase hyphenated identifier`);
  }
  return result;
}

function isoDate(value: unknown, label: string): string {
  const result = text(value, label, 10, 10);
  const parsed = new Date(`${result}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(parsed.valueOf()) ||
      parsed.toISOString().slice(0, 10) !== result) {
    throw new Error(`${label} must be a real ISO date`);
  }
  return result;
}

function oneOf<T extends readonly string[]>(value: unknown, choices: T, label: string): T[number] {
  if (typeof value !== "string" || !choices.includes(value as T[number])) {
    throw new Error(`${label} must be one of: ${choices.join(", ")}`);
  }
  return value as T[number];
}

function array(value: unknown, label: string, minimum: number, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    throw new Error(`${label} must contain ${minimum}-${maximum} entries`);
  }
  return value;
}

function nullableText(value: unknown, label: string): string | null {
  return value === null ? null : text(value, label);
}

function evidenceReference(value: unknown, label: string): string {
  const result = text(value, label);
  if (result !== result.trim() || /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(result)) {
    throw new Error(`${label} must not contain surrounding, control, or bidirectional formatting characters`);
  }
  if (/[?#]/u.test(result)) throw new Error(`${label} must not contain URL query or fragment data`);
  if (/^(?:\/\/|\\\\|\/|\\|~(?:\/|$))/u.test(result)) {
    throw new Error(`${label} must not be protocol-relative or an absolute filesystem reference`);
  }
  if (!/^[a-z][a-z0-9+.-]*:/i.test(result)) {
    if (result.includes("\\")) throw new Error(`${label} must use portable forward slashes`);
    const segments = result.split("/");
    if (segments.some((segment) => segment === "" || segment === "." || segment === ".." || /%2e/i.test(segment))) {
      throw new Error(`${label} must be a normalized relative reference without dot segments`);
    }
    return result;
  }

  let parsed: URL;
  try {
    parsed = new URL(result);
  } catch {
    throw new Error(`${label} URL is malformed`);
  }
  if (parsed.protocol === "https:") {
    if (!result.startsWith("https://") || parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error(`${label} must be canonical HTTPS without credentials, query, or fragment data`);
    }
    return result;
  }
  if (["artifact:", "report:", "urn:"].includes(parsed.protocol) && !parsed.search && !parsed.hash) return result;
  throw new Error(`${label} must be a relative reference, HTTPS URL, artifact/report reference, or URN`);
}

function unique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} entries must be unique`);
}

function validateEndpoint(candidate: unknown, label: string): SemanticEndpoint {
  const endpoint = record(candidate, label);
  exactKeys(endpoint, [
    "domain",
    "context",
    "expression",
    "expression_ref",
    "statement_kind",
    "epistemic_access",
    "expression_origin",
    "intended_use",
  ], label);
  text(endpoint.domain, `${label} domain`, 2, 200);
  text(endpoint.context, `${label} context`);
  text(endpoint.expression, `${label} expression`);
  if (endpoint.expression_ref !== null) evidenceReference(endpoint.expression_ref, `${label} expression_ref`);
  oneOf(endpoint.statement_kind, SEMANTIC_STATEMENT_KINDS, `${label} statement_kind`);
  oneOf(endpoint.epistemic_access, SEMANTIC_EPISTEMIC_ACCESS, `${label} epistemic_access`);
  oneOf(endpoint.expression_origin, SEMANTIC_EXPRESSION_ORIGINS, `${label} expression_origin`);
  text(endpoint.intended_use, `${label} intended_use`);
  return endpoint as unknown as SemanticEndpoint;
}

/** Reject duplicate keys and excessive nesting before JSON.parse erases that evidence. */
export function parseSemanticTransitionJson(source: string, label = "Semantic transition JSON"): unknown {
  if (Buffer.byteLength(source, "utf8") > MAX_RECEIPT_BYTES) throw new Error(`${label} exceeds ${MAX_RECEIPT_BYTES} bytes`);
  let position = 0;
  const fail = (message: string): never => { throw new Error(`${label}: ${message} at byte ${position}`); };
  const whitespace = () => { while (/\s/u.test(source[position] ?? "") && position < source.length) position++; };
  const stringToken = (): string => {
    const start = position;
    if (source[position++] !== '"') fail("expected string");
    while (position < source.length) {
      const character = source[position++];
      if (character === '"') {
        try { return JSON.parse(source.slice(start, position)); }
        catch { fail("invalid string"); }
      }
      if (character === "\\") {
        const escape = source[position++];
        if (escape === "u") {
          if (!/^[0-9a-f]{4}$/i.test(source.slice(position, position + 4))) fail("invalid Unicode escape");
          position += 4;
        } else if (!'"\\/bfnrt'.includes(escape ?? "")) fail("invalid escape");
      } else if (character.charCodeAt(0) < 0x20) fail("unescaped control character");
    }
    return fail("unterminated string");
  };
  const value = (depth: number): void => {
    if (depth > MAX_RECEIPT_DEPTH) fail("maximum nesting depth exceeded");
    whitespace();
    const character = source[position];
    if (character === '"') { stringToken(); return; }
    if (character === "{") {
      position++; whitespace();
      const keys = new Set<string>();
      if (source[position] === "}") { position++; return; }
      while (true) {
        whitespace();
        const key = stringToken();
        if (keys.has(key)) fail(`duplicate object key ${JSON.stringify(key)}`);
        keys.add(key);
        whitespace();
        if (source[position++] !== ":") fail("expected colon");
        value(depth + 1); whitespace();
        const separator = source[position++];
        if (separator === "}") return;
        if (separator !== ",") fail("expected comma or closing brace");
      }
    }
    if (character === "[") {
      position++; whitespace();
      if (source[position] === "]") { position++; return; }
      while (true) {
        value(depth + 1); whitespace();
        const separator = source[position++];
        if (separator === "]") return;
        if (separator !== ",") fail("expected comma or closing bracket");
      }
    }
    for (const literal of ["true", "false", "null"]) {
      if (source.startsWith(literal, position)) { position += literal.length; return; }
    }
    const number = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(source.slice(position));
    if (number) { position += number[0].length; return; }
    fail("expected JSON value");
  };
  value(0); whitespace();
  if (position !== source.length) fail("unexpected trailing content");
  return JSON.parse(source);
}

/**
 * Validate structural completeness and selected non-amplification invariants.
 * This function intentionally makes no truth, fidelity, or intent judgment.
 */
export function validateSemanticTransition(
  candidate: unknown,
  options: SemanticValidationOptions = {},
): asserts candidate is SemanticTransitionReceipt {
  rejectForbiddenFields(candidate);
  const receipt = record(candidate, "Semantic transition receipt");
  exactKeys(receipt, [
    "schema_version",
    "id",
    "issued_on",
    "state",
    "relation",
    "source",
    "target",
    "transition",
    "warrant",
    "distortion_risks",
    "boundaries",
    "repair",
    "safety",
  ], "Semantic transition receipt");

  if (receipt.schema_version !== SEMANTIC_TRANSITION_SCHEMA_VERSION) {
    throw new Error("Semantic transition receipt schema_version is unsupported");
  }
  const receiptId = identifier(receipt.id, "Semantic transition receipt id");
  const issuedOn = isoDate(receipt.issued_on, "Semantic transition receipt issued_on");
  const state = oneOf(receipt.state, ["draft", "issued"] as const, "Semantic transition receipt state");
  const asOf = options.asOf === undefined
    ? new Date().toISOString().slice(0, 10)
    : isoDate(options.asOf, "Semantic transition validation asOf");
  if (state === "issued" && issuedOn > asOf) {
    throw new Error(`Issued semantic transition receipt cannot be dated after validation asOf ${asOf}`);
  }

  const relation = record(receipt.relation, "Semantic transition receipt relation");
  exactKeys(relation, ["kind", "target_receipt_id"], "Semantic transition receipt relation");
  const relationKind = oneOf(
    relation.kind,
    ["original", "corrects", "supersedes", "withdraws"] as const,
    "Semantic transition receipt relation kind",
  );
  const targetReceiptId = relation.target_receipt_id === null
    ? null
    : identifier(relation.target_receipt_id, "Semantic transition receipt relation target_receipt_id");
  if ((relationKind === "original") !== (targetReceiptId === null)) {
    throw new Error("An original receipt must have a null target; a repair receipt must name a target receipt identifier");
  }
  if (targetReceiptId === receiptId) throw new Error("A receipt cannot repair itself");

  const source = validateEndpoint(receipt.source, "Semantic transition source");
  const target = validateEndpoint(receipt.target, "Semantic transition target");

  const transition = record(receipt.transition, "Semantic transition map");
  exactKeys(transition, [
    "kind",
    "rule",
    "preserved_relations",
    "discarded_structure",
    "loss_assessment",
    "introduced_assumptions",
    "new_evidence_refs",
    "counterexample",
    "stop_condition",
  ], "Semantic transition map");
  oneOf(transition.kind, SEMANTIC_TRANSITION_KINDS, "Semantic transition map kind");
  text(transition.rule, "Semantic transition map rule");

  const preservedNames = array(
    transition.preserved_relations,
    "Semantic transition preserved_relations",
    1,
    32,
  ).map((candidateRelation, index) => {
    const preserved = record(candidateRelation, `Semantic transition preserved relation ${index + 1}`);
    exactKeys(
      preserved,
      ["name", "source_form", "target_form", "test"],
      `Semantic transition preserved relation ${index + 1}`,
    );
    const name = identifier(preserved.name, `Semantic transition preserved relation ${index + 1} name`);
    text(preserved.source_form, `Semantic transition preserved relation ${name} source_form`);
    text(preserved.target_form, `Semantic transition preserved relation ${name} target_form`);
    text(preserved.test, `Semantic transition preserved relation ${name} test`);
    return name;
  });
  unique(preservedNames, "Semantic transition preserved relation names");

  const discardedNames = array(
    transition.discarded_structure,
    "Semantic transition discarded_structure",
    0,
    32,
  ).map((candidateLoss, index) => {
    const loss = record(candidateLoss, `Semantic transition discarded structure ${index + 1}`);
    exactKeys(
      loss,
      ["name", "consequence", "disclosed"],
      `Semantic transition discarded structure ${index + 1}`,
    );
    const name = identifier(loss.name, `Semantic transition discarded structure ${index + 1} name`);
    text(loss.consequence, `Semantic transition discarded structure ${name} consequence`);
    if (loss.disclosed !== true) throw new Error(`Semantic transition discarded structure ${name} must be disclosed`);
    return name;
  });
  unique(discardedNames, "Semantic transition discarded structure names");

  const lossAssessment = record(transition.loss_assessment, "Semantic transition loss_assessment");
  exactKeys(lossAssessment, ["status", "basis"], "Semantic transition loss_assessment");
  const lossStatus = oneOf(
    lossAssessment.status,
    SEMANTIC_LOSS_ASSESSMENT_STATUSES,
    "Semantic transition loss_assessment status",
  );
  text(lossAssessment.basis, "Semantic transition loss_assessment basis");
  if ((discardedNames.length === 0) !== (lossStatus === "none-identified")) {
    throw new Error("Semantic transition loss_assessment status must match whether discarded_structure is empty");
  }

  const assumptions = array(
    transition.introduced_assumptions,
    "Semantic transition introduced_assumptions",
    0,
    32,
  );
  assumptions.forEach((assumption, index) => text(assumption, `Semantic transition assumption ${index + 1}`));
  if ((source.statement_kind !== target.statement_kind || source.epistemic_access !== target.epistemic_access) &&
      assumptions.length === 0) {
    throw new Error("A statement-kind or epistemic-access change must declare its introduced assumption");
  }
  const newEvidenceRefs = array(
    transition.new_evidence_refs,
    "Semantic transition new_evidence_refs",
    0,
    64,
  ).map((reference, index) => identifier(reference, `Semantic transition new_evidence_ref ${index + 1}`));
  unique(newEvidenceRefs, "Semantic transition new_evidence_refs");
  text(transition.counterexample, "Semantic transition counterexample");
  text(transition.stop_condition, "Semantic transition stop_condition");

  const warrant = record(receipt.warrant, "Semantic transition warrant");
  exactKeys(warrant, [
    "evidence",
    "declared_confidence",
    "confidence_basis",
    "known_limits",
    "freshness",
  ], "Semantic transition warrant");
  const evidence = array(warrant.evidence, "Semantic transition evidence", 0, 64)
    .map((candidateEvidence, index): SemanticEvidence => {
      const entry = record(candidateEvidence, `Semantic transition evidence ${index + 1}`);
      exactKeys(entry, ["id", "ref", "role", "observed_on", "sha256"], `Semantic transition evidence ${index + 1}`);
      const id = identifier(entry.id, `Semantic transition evidence ${index + 1} id`);
      const ref = evidenceReference(entry.ref, `Semantic transition evidence ${id} ref`);
      const role = oneOf(entry.role, SEMANTIC_EVIDENCE_ROLES, `Semantic transition evidence ${id} role`);
      const observedOn = isoDate(entry.observed_on, `Semantic transition evidence ${id} observed_on`);
      if (observedOn > issuedOn) throw new Error(`Semantic transition evidence ${id} cannot be observed after issuance`);
      if (entry.sha256 !== null && (typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256))) {
        throw new Error(`Semantic transition evidence ${id} sha256 must be null or 64 lowercase hexadecimal characters`);
      }
      return { id, ref, role, observed_on: observedOn, sha256: entry.sha256 as string | null };
    });
  unique(evidence.map((entry) => entry.id), "Semantic transition evidence ids");
  unique(evidence.map((entry) => entry.ref), "Semantic transition evidence refs");
  const confidence = oneOf(
    warrant.declared_confidence,
    ["high", "medium", "low", "unknown"] as const,
    "Semantic transition declared_confidence",
  );
  text(warrant.confidence_basis, "Semantic transition confidence_basis");
  if (confidence === "high" && !evidence.some((entry) => entry.role === "supports")) {
    throw new Error("High declared confidence requires at least one supporting evidence declaration");
  }
  const evidenceById = new Map(evidence.map((entry) => [entry.id, entry]));
  for (const evidenceId of newEvidenceRefs) {
    const entry = evidenceById.get(evidenceId);
    if (!entry) throw new Error(`Semantic transition new_evidence_ref ${evidenceId} does not identify warrant evidence`);
    if (entry.role !== "supports") throw new Error(`Semantic transition new_evidence_ref ${evidenceId} must identify supporting evidence`);
  }
  const promotesToDirect = source.epistemic_access !== "direct" && target.epistemic_access === "direct";
  const promotesToObservation = source.statement_kind !== "observation" && target.statement_kind === "observation";
  if ((promotesToDirect || promotesToObservation) && newEvidenceRefs.length === 0) {
    throw new Error("Epistemic or observation promotion requires distinct new supporting evidence");
  }
  array(warrant.known_limits, "Semantic transition known_limits", 1, 32)
    .forEach((limit, index) => text(limit, `Semantic transition known limit ${index + 1}`));
  const freshness = record(warrant.freshness, "Semantic transition freshness");
  exactKeys(freshness, ["assessed_on", "reassess_when"], "Semantic transition freshness");
  const assessedOn = isoDate(freshness.assessed_on, "Semantic transition freshness assessed_on");
  if (assessedOn > issuedOn) throw new Error("Semantic transition freshness cannot be assessed after issuance");
  text(freshness.reassess_when, "Semantic transition freshness reassess_when");

  const riskKinds = array(receipt.distortion_risks, "Semantic transition distortion_risks", 1, 32)
    .map((candidateRisk, index) => {
      const risk = record(candidateRisk, `Semantic transition distortion risk ${index + 1}`);
      exactKeys(
        risk,
        ["kind", "mechanism", "mitigation", "residual"],
        `Semantic transition distortion risk ${index + 1}`,
      );
      const kind = oneOf(
        risk.kind,
        SEMANTIC_DISTORTION_RISKS,
        `Semantic transition distortion risk ${index + 1} kind`,
      );
      text(risk.mechanism, `Semantic transition distortion risk ${kind} mechanism`);
      text(risk.mitigation, `Semantic transition distortion risk ${kind} mitigation`);
      text(risk.residual, `Semantic transition distortion risk ${kind} residual`);
      return kind;
    });
  unique(riskKinds, "Semantic transition distortion risk kinds");

  const boundaries = record(receipt.boundaries, "Semantic transition boundaries");
  exactKeys(boundaries, [
    "representation_scope",
    "consent",
    "consent_subject",
    "consent_scope",
    "consent_basis",
    "consent_ref",
    "authority_scope",
    "authority_basis",
    "authority_ref",
    "actionability",
    "privacy",
  ], "Semantic transition boundaries");
  const representationScope = oneOf(boundaries.representation_scope, [
    "none", "self", "other-public", "other-private", "artifact-public", "collective",
  ] as const, "Semantic transition representation_scope");
  const consent = oneOf(boundaries.consent, [
    "not-applicable", "self-authored", "explicit-obtained", "refused", "unknown",
  ] as const, "Semantic transition consent");
  const consentSubject = nullableText(boundaries.consent_subject, "Semantic transition consent_subject");
  const consentScope = nullableText(boundaries.consent_scope, "Semantic transition consent_scope");
  const consentBasis = nullableText(boundaries.consent_basis, "Semantic transition consent_basis");
  const consentRef = boundaries.consent_ref === null
    ? null
    : evidenceReference(boundaries.consent_ref, "Semantic transition consent_ref");
  const authorityScope = nullableText(boundaries.authority_scope, "Semantic transition authority_scope");
  const authorityBasis = nullableText(boundaries.authority_basis, "Semantic transition authority_basis");
  const authorityRef = boundaries.authority_ref === null
    ? null
    : evidenceReference(boundaries.authority_ref, "Semantic transition authority_ref");
  const consentDetails = [consentSubject, consentScope, consentBasis, consentRef];
  if (!consentDetails.every((value) => value === null) && !consentDetails.every((value) => value !== null)) {
    throw new Error("Semantic transition consent details must be all present or all null");
  }
  const authorityDetails = [authorityScope, authorityBasis, authorityRef];
  if (!authorityDetails.every((value) => value === null) && !authorityDetails.every((value) => value !== null)) {
    throw new Error("Semantic transition authority scope, basis, and ref must be all present or all null");
  }
  const actionability = oneOf(
    boundaries.actionability,
    ["descriptive", "reversible", "irreversible"] as const,
    "Semantic transition actionability",
  );
  const privacy = oneOf(
    boundaries.privacy,
    ["public-only", "authorized-private", "redacted"] as const,
    "Semantic transition privacy",
  );
  if (["none", "artifact-public"].includes(representationScope) && consent !== "not-applicable") {
    throw new Error("A receipt representing no party or a public artifact must mark consent not-applicable");
  }
  if (["other-public", "other-private", "collective"].includes(representationScope) && consent === "not-applicable") {
    throw new Error("Representation of another party or collective cannot mark consent not-applicable");
  }
  if (consent === "not-applicable" && consentDetails.some((value) => value !== null)) {
    throw new Error("Not-applicable consent must not carry consent details");
  }
  if (["self-authored", "explicit-obtained"].includes(consent) && consentDetails.some((value) => value === null)) {
    throw new Error("Self-authored or explicitly obtained consent requires subject, scope, basis, and ref");
  }
  if (representationScope === "self" && !["self-authored", "explicit-obtained"].includes(consent)) {
    throw new Error("A self representation must be self-authored or explicitly obtained");
  }
  if (representationScope === "other-private" && consent !== "explicit-obtained") {
    throw new Error("Representing another party's private material requires explicit consent");
  }
  if (privacy === "authorized-private" && !["self-authored", "explicit-obtained"].includes(consent)) {
    throw new Error("Authorized private material requires self-authorship or explicit consent");
  }
  if (actionability !== "descriptive" && ["refused", "unknown"].includes(consent)) {
    throw new Error("A receipt cannot support action where relevant consent is refused or unknown");
  }
  if (actionability === "irreversible") {
    throw new Error("Irreversible action is outside the structural validator contract");
  }

  const repair = record(receipt.repair, "Semantic transition repair");
  exactKeys(repair, [
    "reply_route",
    "correction_route",
    "carry_challenges_forward",
    "retain_prior_receipt",
  ], "Semantic transition repair");
  text(repair.reply_route, "Semantic transition reply_route");
  text(repair.correction_route, "Semantic transition correction_route");
  if (repair.carry_challenges_forward !== true) {
    throw new Error("Semantic transition repair must carry material challenges forward");
  }
  if (repair.retain_prior_receipt !== true) {
    throw new Error("Semantic transition repair must retain the prior non-sensitive receipt");
  }

  const safety = record(receipt.safety, "Semantic transition safety");
  const safetyKeys = [
    "grants_authority",
    "grants_consent",
    "proves_truth",
    "infers_intent",
    "rates_people",
    "permits_surveillance",
  ] as const;
  exactKeys(safety, safetyKeys, "Semantic transition safety");
  for (const key of safetyKeys) {
    if (safety[key] !== false) throw new Error(`Semantic transition safety ${key} must remain false`);
  }
}

export function validateSemanticTransitionFile(
  path: string,
  options: SemanticValidationOptions = {},
): SemanticTransitionReceipt {
  let candidate: unknown;
  try {
    candidate = parseSemanticTransitionJson(readFileSync(path, "utf8"), path);
  } catch (error) {
    throw new Error(`${path}: could not read valid strict JSON: ${(error as Error).message}`);
  }
  validateSemanticTransition(candidate, options);
  return candidate;
}

export function validateSemanticTransitionSet(
  candidates: readonly unknown[],
  options: SemanticValidationOptions = {},
): SemanticTransitionReceipt[] {
  const receipts: SemanticTransitionReceipt[] = [];
  for (const candidate of candidates) {
    validateSemanticTransition(candidate, options);
    receipts.push(candidate);
  }
  const byId = new Map<string, SemanticTransitionReceipt>();
  for (const receipt of receipts) {
    if (byId.has(receipt.id)) throw new Error(`Duplicate semantic transition receipt id: ${receipt.id}`);
    byId.set(receipt.id, receipt);
  }
  for (const receipt of receipts) {
    const targetId = receipt.relation.target_receipt_id;
    if (targetId === null) continue;
    const target = byId.get(targetId);
    if (!target) throw new Error(`Semantic transition receipt ${receipt.id} targets missing receipt ${targetId}`);
    if (target.state !== "issued") throw new Error(`Semantic transition receipt ${receipt.id} must target an issued receipt`);
    if (target.issued_on > receipt.issued_on) {
      throw new Error(`Semantic transition receipt ${receipt.id} cannot target a later-dated receipt ${targetId}`);
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) throw new Error(`Semantic transition repair graph contains a cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    const target = byId.get(id)!.relation.target_receipt_id;
    if (target !== null) visit(target);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of byId.keys()) visit(id);
  return receipts;
}

export function runSemanticTransitionCli(argv = process.argv.slice(2)): number {
  const [command, ...paths] = argv;
  if (command !== "validate" || paths.length === 0) {
    console.error("usage: bun bin/semantic-transitions.ts validate <receipt.json> [...]");
    return 2;
  }

  try {
    const candidates = paths.map((path) => {
      try { return parseSemanticTransitionJson(readFileSync(path, "utf8"), path); }
      catch (error) { throw new Error(`${path}: could not read valid strict JSON: ${(error as Error).message}`); }
    });
    validateSemanticTransitionSet(candidates);
    console.log("STRUCTURE ONLY — truth, fidelity, identity, understanding, authority, consent, evidence adequacy, and intent are NOT VERIFIED");
    paths.forEach((path) => console.log(`${path}: structurally valid`));
    return 0;
  } catch (error) {
    console.error((error as Error).message);
    return 1;
  }
}

if (import.meta.main) process.exitCode = runSemanticTransitionCli();
