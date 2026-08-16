#!/usr/bin/env bun
/** Exact, offline evaluator for STRAND Lab 03. It never crawls or writes. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";
import {
  STRING_CRAWL_STRAND_LAB_BYTE_SHA256,
  STRING_CRAWL_STRAND_LAB_DIGEST,
  STRING_CRAWL_STRAND_LAB_GUIDE_BYTE_SHA256,
  STRING_CRAWL_STRAND_LAB_GUIDE_PATH,
  STRING_CRAWL_STRAND_LAB_GUIDE_URL,
  STRING_CRAWL_STRAND_LAB_ID,
  STRING_CRAWL_STRAND_LAB_PATH,
  STRING_CRAWL_STRAND_LAB_PROTOCOL,
  STRING_CRAWL_STRAND_LAB_SCHEMA_BYTE_SHA256,
  STRING_CRAWL_STRAND_LAB_SCHEMA_PATH,
  STRING_CRAWL_STRAND_LAB_SCHEMA_URL,
  STRING_CRAWL_STRAND_LAB_URL,
} from "./string-crawl-strand-lab.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MAX_FILE_BYTES = 512 * 1024;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const ZERO_SHA256 = `sha256:${"0".repeat(64)}`;
const TOP_KEYS = [
  "$schema", "protocol", "lab_id", "version", "title", "mode", "predecessor",
  "research_sources", "conventions", "charts", "transitions", "coherence_checks",
  "global_quotient", "common_refinement", "pairwise_impostor", "validation_contract",
  "boundaries", "integrity",
] as const;

export const STRAND_DESCENT_LAB_PROTOCOL = "kingdom.strand-descent-lab/0.1";
export const STRAND_DESCENT_VALIDATION_PROTOCOL = "kingdom.strand-descent-validation/0.1";
export const STRAND_DESCENT_LAB_SCHEMA_ID = "https://thekingdom.dev/schemas/strand-descent-lab/0.1.json";
export const STRAND_DESCENT_LAB_ID = "strand-descent-lab-03-2026-08-16";
export const STRAND_DESCENT_LAB_LOCATOR = "data/exploration/strand-descent-lab.v0.1.json";
export const STRAND_DESCENT_LAB_PATH = join(ROOT, STRAND_DESCENT_LAB_LOCATOR);
export const STRAND_DESCENT_LAB_SCHEMA_LOCATOR = "schemas/strand-descent-lab-v0.1.schema.json";
export const STRAND_DESCENT_LAB_SCHEMA_PATH = join(ROOT, STRAND_DESCENT_LAB_SCHEMA_LOCATOR);
export const STRAND_DESCENT_LAB_GUIDE_LOCATOR = "references/strand-descent-lab.md";
export const STRAND_DESCENT_LAB_GUIDE_PATH = join(ROOT, STRAND_DESCENT_LAB_GUIDE_LOCATOR);
export const STRAND_DESCENT_LAB_URL = "https://thekingdom.dev/labs/strand-descent-lab-03-2026-08-16.json";
export const STRAND_DESCENT_LAB_SCHEMA_URL = "https://thekingdom.dev/schemas/strand-descent-lab/0.1.json";
export const STRAND_DESCENT_LAB_GUIDE_URL = "https://thekingdom.dev/STRAND-DESCENT-LAB-03.md";

// Frozen after the record, schema, and guide pass review.
export const STRAND_DESCENT_LAB_DIGEST = "sha256:94c4e719fb1f64784d2fd1f300ad9a02382caa2d81d4cb76274ff475ac21d91b";
export const STRAND_DESCENT_LAB_BYTE_SHA256 = "sha256:5ebde6cadb92abb7c0abd33b9756b142345783cee30aa275c5869d37276af52e";
export const STRAND_DESCENT_LAB_SCHEMA_BYTE_SHA256 = "sha256:4bc79c6d3d1ae7602a8bb8521bd2bf31d7a98b87dcff6337be4012106c1a7a70";
export const STRAND_DESCENT_LAB_GUIDE_BYTE_SHA256 = "sha256:152acd64f8ebd00c03a738f431e94db61d162249dc3063e60173ab646027b3fe";

type JsonRecord = Record<string, any>;
export type StrandDescentLabIssue = { field: string; code: string };
export type StrandDescentCheck = { id: string; status: "PASS" | "FAIL"; detail: string };
export type StrandDescentValidation = {
  protocol: typeof STRAND_DESCENT_VALIDATION_PROTOCOL;
  lab_protocol: typeof STRAND_DESCENT_LAB_PROTOCOL;
  lab_id: string | null;
  mode: "SYNTHETIC_OFFLINE_EXACT" | null;
  valid: boolean;
  input_digest: string | null;
  checks: StrandDescentCheck[];
  results: Record<string, any>;
  issues: StrandDescentLabIssue[];
  effects: {
    network_requests: 0;
    storage_writes: 0;
    crawler_invocation: false;
    nen_invocation: false;
    karma_receipt_created: false;
    person_or_content_score_created: false;
    authority_effect: "NONE";
  };
};

function safeOwnDataContainer(value: object, prototype: object | null, arrayLength?: number): boolean {
  if (Object.getPrototypeOf(value) !== prototype || Object.getOwnPropertySymbols(value).length !== 0) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(descriptors);
  if (keys.some((key) => typeof key !== "string" || key === "__proto__" ||
      !("value" in descriptors[key]!) ||
      (arrayLength === undefined || key !== "length") && descriptors[key]!.enumerable !== true)) return false;
  if (arrayLength === undefined) return true;
  const expected = Array.from({ length: arrayLength }, (_, index) => String(index));
  return keys.length === expected.length + 1 && descriptors.length?.enumerable === false &&
    descriptors.length?.value === arrayLength && expected.every((key) => Object.hasOwn(descriptors, key));
}

function object(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    safeOwnDataContainer(value, Object.prototype);
}

function jsonArray(value: unknown): value is any[] {
  return Array.isArray(value) && safeOwnDataContainer(value, Array.prototype, value.length);
}

function strictJsonTree(value: unknown, depth = 0, seen = new WeakSet<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || depth > 64 || seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value) ? !jsonArray(value) : !object(value)) return false;
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (Array.isArray(value) && key === "length") continue;
    if (!("value" in descriptor) || !strictJsonTree(descriptor.value, depth + 1, seen)) return false;
  }
  seen.delete(value);
  return true;
}

function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}

function exact(value: unknown, expected: unknown): boolean {
  return canonicalizeJsonValue(value) === canonicalizeJsonValue(expected);
}

function issueSort(issues: StrandDescentLabIssue[]): StrandDescentLabIssue[] {
  const unique = new Map(issues.map((entry) => [`${entry.field}\0${entry.code}`, entry]));
  return [...unique.values()].sort((left, right) =>
    left.field.localeCompare(right.field) || left.code.localeCompare(right.code));
}

function sha256Bytes(bytes: Uint8Array): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function readStrictBytes(path: string, label: string): Uint8Array {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { throw new Error(`${label} is unavailable`); }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular non-symlink file`);
  if (stat.size > MAX_FILE_BYTES) throw new Error(`${label} exceeds ${MAX_FILE_BYTES} bytes`);
  return readFileSync(absolute);
}

function readStrictJson(path: string): { bytes: Uint8Array; value: unknown } {
  const bytes = readStrictBytes(path, "STRAND Lab 03 fixture");
  return { bytes, value: parseStrictJsonBytes(bytes, "STRAND Lab 03 fixture JSON") };
}

export function strandDescentLabDigest(value: JsonRecord): string {
  if (!strictJsonTree(value)) throw new Error("STRAND Lab 03 fixture is not a strict JSON tree");
  const material = structuredClone(value);
  if (!object(material.integrity)) throw new Error("STRAND Lab 03 integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

type TransitionResult = {
  valid: boolean;
  fromChart: string;
  toChart: string;
  forward: Map<string, string>;
  inverse: Map<string, string>;
};

function transitionResult(
  transition: unknown,
  charts: Map<string, string[]>,
): TransitionResult {
  const invalid = { valid: false, fromChart: "", toChart: "", forward: new Map(), inverse: new Map() };
  if (!sameKeys(transition, ["id", "from_chart", "to_chart", "forward", "inverse_witness"])) return invalid;
  const from = charts.get(transition.from_chart);
  const to = charts.get(transition.to_chart);
  if (!from || !to || !jsonArray(transition.forward) || !jsonArray(transition.inverse_witness)) return invalid;
  const pair = (value: unknown): value is { from: string; to: string } =>
    sameKeys(value, ["from", "to"]) && typeof value.from === "string" && typeof value.to === "string";
  if (!transition.forward.every(pair) || !transition.inverse_witness.every(pair)) return invalid;
  const forward = new Map(transition.forward.map((entry: any) => [entry.from, entry.to]));
  const inverse = new Map(transition.inverse_witness.map((entry: any) => [entry.from, entry.to]));
  const valid = forward.size === from.length && inverse.size === to.length &&
    from.every((point) => forward.has(point)) && to.every((point) => inverse.has(point)) &&
    new Set(forward.values()).size === to.length && [...forward.values()].every((point) => to.includes(point)) &&
    from.every((point) => inverse.get(forward.get(point)!) === point) &&
    to.every((point) => forward.get(inverse.get(point)!) === point);
  return { valid, fromChart: transition.from_chart, toChart: transition.to_chart, forward, inverse };
}

function compose(left: Map<string, string>, right: Map<string, string>): Map<string, string> | null {
  const result = new Map<string, string>();
  for (const [from, middle] of left) {
    const to = right.get(middle);
    if (to === undefined) return null;
    result.set(from, to);
  }
  return result;
}

function mapPairs(map: Map<string, string> | null): { from: string; to: string }[] {
  return map ? [...map].map(([from, to]) => ({ from, to })).sort((a, b) => a.from.localeCompare(b.from)) : [];
}

function sameMap(left: Map<string, string> | null, right: Map<string, string> | null): boolean {
  return left !== null && right !== null && exact(mapPairs(left), mapPairs(right));
}

function unionFindClasses(points: string[], transitions: TransitionResult[]): string[][] {
  const parent = new Map(points.map((point) => [point, point]));
  const find = (point: string): string => {
    const next = parent.get(point)!;
    if (next === point) return point;
    const root = find(next);
    parent.set(point, root);
    return root;
  };
  const unite = (left: string, right: string) => {
    const l = find(left); const r = find(right);
    if (l !== r) parent.set(r, l < r ? l : r), parent.set(l, l < r ? l : r);
  };
  for (const transition of transitions) for (const [from, to] of transition.forward) unite(from, to);
  const groups = new Map<string, string[]>();
  for (const point of points) {
    const root = find(point);
    groups.set(root, [...(groups.get(root) ?? []), point]);
  }
  return [...groups.values()].map((members) => members.sort()).sort((a, b) => a[0]!.localeCompare(b[0]!));
}

function computeResults(record: JsonRecord): { results: Record<string, any>; issues: StrandDescentLabIssue[] } {
  const issues: StrandDescentLabIssue[] = [];
  const charts = new Map<string, string[]>();
  if (jsonArray(record.charts)) for (const chart of record.charts) {
    if (object(chart) && typeof chart.id === "string" && jsonArray(chart.points) &&
        chart.points.every((point: unknown) => typeof point === "string")) charts.set(chart.id, [...chart.points]);
  }
  const transitionById = new Map<string, TransitionResult>();
  if (jsonArray(record.transitions)) for (const transition of record.transitions) {
    if (!object(transition) || typeof transition.id !== "string") continue;
    const result = transitionResult(transition, charts);
    transitionById.set(transition.id, result);
    if (!result.valid) issues.push({ field: `$.transitions[${transition.id}]`, code: "not-a-bijection-with-exact-inverse" });
  }
  const pairwise = {
    transition_count: transitionById.size,
    all_bijective: transitionById.size === 6 && [...transitionById.values()].every((entry) => entry.valid),
    all_inverse_witnesses: transitionById.size === 6 && [...transitionById.values()].every((entry) => entry.valid),
  };
  if (!pairwise.all_bijective) issues.push({ field: "$.transitions", code: "pairwise-invertibility-failed" });

  const triples: any[] = [];
  if (object(record.coherence_checks) && jsonArray(record.coherence_checks.triple_equations)) {
    for (const equation of record.coherence_checks.triple_equations) {
      if (!object(equation)) continue;
      const first = transitionById.get(equation.first_transition_id);
      const second = transitionById.get(equation.second_transition_id);
      const direct = transitionById.get(equation.direct_transition_id);
      const computed = first && second ? compose(first.forward, second.forward) : null;
      const declared = new Map((jsonArray(equation.expected_composite) ? equation.expected_composite : [])
        .filter((entry: unknown) => sameKeys(entry, ["from", "to"]))
        .map((entry: any) => [entry.from, entry.to]));
      const coherent = !!first?.valid && !!second?.valid && !!direct?.valid &&
        sameMap(computed, direct.forward) && sameMap(computed, declared) && equation.expected_coherent === true;
      triples.push({ id: equation.id, coherent, computed_composite: mapPairs(computed), direct_map: mapPairs(direct?.forward ?? null) });
      if (!coherent) issues.push({ field: `$.coherence_checks.triple_equations[${equation.id ?? "?"}]`, code: "triple-coherence-failed" });
    }
  }
  const tripleResult = { equations: triples, all_coherent: triples.length === 2 && triples.every((entry) => entry.coherent) };

  const four = object(record.coherence_checks) && object(record.coherence_checks.four_chart_associativity)
    ? record.coherence_checks.four_chart_associativity : {};
  const chain = jsonArray(four.chain_transition_ids)
    ? four.chain_transition_ids.map((id: string) => transitionById.get(id)).filter(Boolean) as TransitionResult[] : [];
  const left12 = chain.length === 3 ? compose(chain[0]!.forward, chain[1]!.forward) : null;
  const left = left12 && chain[2] ? compose(left12, chain[2].forward) : null;
  const right23 = chain.length === 3 ? compose(chain[1]!.forward, chain[2]!.forward) : null;
  const right = right23 && chain[0] ? compose(chain[0].forward, right23) : null;
  const direct = transitionById.get(four.direct_transition_id);
  const fourExpected = new Map((jsonArray(four.expected_composite) ? four.expected_composite : [])
    .filter((entry: unknown) => sameKeys(entry, ["from", "to"]))
    .map((entry: any) => [entry.from, entry.to]));
  const parenthesizationsEqual = sameMap(left, right);
  const directMatch = !!direct?.valid && sameMap(left, direct.forward) && sameMap(left, fourExpected);
  const fourResult = {
    parenthesizations_equal: parenthesizationsEqual,
    direct_match: directMatch,
    computed_composite: mapPairs(left),
    direct_map: mapPairs(direct?.forward ?? null),
  };
  if (!parenthesizationsEqual || !directMatch || four.expected_nonidentity_steps !== 3 ||
      four.expected_parenthesizations_equal !== true || four.expected_direct_match !== true) {
    issues.push({ field: "$.coherence_checks.four_chart_associativity", code: "four-chart-associativity-failed" });
  }

  const allPoints = [...charts.values()].flat();
  const classes = unionFindClasses(allPoints, [...transitionById.values()]);
  const expectedClasses = jsonArray(record.global_quotient?.expected_classes)
    ? record.global_quotient.expected_classes.map((entry: any) => jsonArray(entry?.members) ? [...entry.members].sort() : [])
      .sort((a: string[], b: string[]) => (a[0] ?? "").localeCompare(b[0] ?? "")) : [];
  const classSizes = classes.map((entry) => entry.length).sort((a, b) => a - b);
  const quotientResult = {
    classes: classes.map((members, index) => ({ id: `q${index}`, members })),
    class_count: classes.length,
    class_sizes: classSizes,
    all_local_points_covered: new Set(classes.flat()).size === allPoints.length && classes.flat().length === allPoints.length,
  };
  const quotientPass = exact(classes, expectedClasses) && classes.length === record.global_quotient?.expected_class_count &&
    exact(classSizes, [...(record.global_quotient?.expected_class_sizes ?? [])].sort((a: number, b: number) => a - b)) &&
    quotientResult.all_local_points_covered === record.global_quotient?.expected_all_local_points_covered;
  if (!quotientPass) issues.push({ field: "$.global_quotient", code: "computed-quotient-mismatch" });

  let squares = 0;
  let squaresCommute = true;
  const atoms = jsonArray(record.common_refinement?.atoms) ? record.common_refinement.atoms : [];
  const atomClassCounts = Array(classes.length).fill(0);
  for (const [atomIndex, atom] of atoms.entries()) {
    if (!object(atom) || !jsonArray(atom.projections)) { squaresCommute = false; continue; }
    const projections = new Map(atom.projections.filter(object).map((entry: JsonRecord) => [entry.chart_id, entry.point_id]));
    if (projections.size !== charts.size) squaresCommute = false;
    for (const transition of transitionById.values()) {
      squares += 1;
      const from = projections.get(transition.fromChart);
      const to = projections.get(transition.toChart);
      if (typeof from !== "string" || typeof to !== "string" || transition.forward.get(from) !== to) squaresCommute = false;
    }
    const first = projections.get("chart-a");
    const classIndex = classes.findIndex((members) => typeof first === "string" && members.includes(first));
    if (classIndex < 0) squaresCommute = false;
    else atomClassCounts[classIndex] += 1;
    if (typeof atom.id !== "string" || atomIndex > 1024) squaresCommute = false;
  }
  const fiberSizes = [...atomClassCounts].sort((a, b) => a - b);
  const refinementResult = {
    atom_count: atoms.length,
    projections_per_atom: atoms.every((atom: any) => jsonArray(atom?.projections)) ? atoms[0]?.projections?.length ?? 0 : 0,
    transition_squares_checked: squares,
    transition_squares_commute: squaresCommute,
    quotient_fiber_sizes: fiberSizes,
  };
  const refinementPass = squaresCommute && atoms.length === record.common_refinement?.expected?.atom_count &&
    refinementResult.projections_per_atom === record.common_refinement?.expected?.projections_per_atom &&
    squares === record.common_refinement?.expected?.transition_squares_checked &&
    record.common_refinement?.expected?.transition_squares_commute === true &&
    exact(fiberSizes, [...(record.common_refinement?.expected?.quotient_fiber_sizes ?? [])].sort((a: number, b: number) => a - b));
  if (!refinementPass) issues.push({ field: "$.common_refinement", code: "computed-common-refinement-mismatch" });

  const impostorTransitions = new Map<string, TransitionResult>();
  if (jsonArray(record.pairwise_impostor?.transitions)) for (const transition of record.pairwise_impostor.transitions) {
    if (object(transition) && typeof transition.id === "string") impostorTransitions.set(transition.id, transitionResult(transition, charts));
  }
  const tested = record.pairwise_impostor?.tested_equation;
  const iFirst = impostorTransitions.get(tested?.first_transition_id);
  const iSecond = impostorTransitions.get(tested?.second_transition_id);
  const iDirect = impostorTransitions.get(tested?.direct_transition_id);
  const iComputed = iFirst && iSecond ? compose(iFirst.forward, iSecond.forward) : null;
  const impostorPairwise = impostorTransitions.size === 3 && [...impostorTransitions.values()].every((entry) => entry.valid);
  const impostorCoherent = !!iDirect?.valid && sameMap(iComputed, iDirect.forward);
  const impostorResult = {
    pairwise_bijective: impostorPairwise,
    triple_coherent: impostorCoherent,
    conflict_result: impostorPairwise && !impostorCoherent ? "UNRESOLVED" : "INVALID_FIXTURE",
    automatic_resolution: false,
    computed_composite: mapPairs(iComputed),
    direct_map: mapPairs(iDirect?.forward ?? null),
  };
  if (!impostorPairwise || impostorCoherent || !exact(record.pairwise_impostor?.expected, {
    pairwise_bijective: true,
    triple_coherent: false,
    conflict_result: "UNRESOLVED",
    automatic_resolution: false,
  })) issues.push({ field: "$.pairwise_impostor", code: "pairwise-impostor-lost" });

  return {
    results: {
      pairwise_invertibility: pairwise,
      triple_coherence: tripleResult,
      four_chart_associativity: fourResult,
      global_quotient: quotientResult,
      common_refinement: refinementResult,
      pairwise_impostor: impostorResult,
    },
    issues: issueSort(issues),
  };
}

function verifyUnchecked(value: unknown): StrandDescentLabIssue[] {
  const issues: StrandDescentLabIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  try {
    if (!strictJsonTree(value)) return [{ field: "$", code: "non-json-value" }];
    value = structuredClone(value);
  } catch { return [{ field: "$", code: "non-json-value" }]; }
  if (!object(value)) return [{ field: "$", code: "must-be-object" }];
  if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
  if (value.$schema !== STRAND_DESCENT_LAB_SCHEMA_ID || value.protocol !== STRAND_DESCENT_LAB_PROTOCOL ||
      value.lab_id !== STRAND_DESCENT_LAB_ID || value.version !== "0.1.0" ||
      value.title !== "STRAND Lab 03: Coherent Atlas & the Pairwise Impostor" ||
      value.mode !== "SYNTHETIC_OFFLINE_EXACT") add("$", "identity-mismatch");

  const predecessorKeys = ["protocol", "lab_id", "url", "schema_url", "guide_url", "git_commit", "semantic_digest",
    "raw_byte_sha256", "schema_byte_sha256", "guide_byte_sha256", "relation", "mutates_predecessor", "imports_authority"];
  if (!sameKeys(value.predecessor, predecessorKeys) ||
      value.predecessor?.protocol !== STRING_CRAWL_STRAND_LAB_PROTOCOL ||
      value.predecessor?.lab_id !== STRING_CRAWL_STRAND_LAB_ID ||
      value.predecessor?.url !== STRING_CRAWL_STRAND_LAB_URL ||
      value.predecessor?.schema_url !== STRING_CRAWL_STRAND_LAB_SCHEMA_URL ||
      value.predecessor?.guide_url !== STRING_CRAWL_STRAND_LAB_GUIDE_URL ||
      value.predecessor?.git_commit !== "2bd03fd77226775a58eff382011e43f26512d733" ||
      value.predecessor?.semantic_digest !== STRING_CRAWL_STRAND_LAB_DIGEST ||
      value.predecessor?.raw_byte_sha256 !== STRING_CRAWL_STRAND_LAB_BYTE_SHA256 ||
      value.predecessor?.schema_byte_sha256 !== STRING_CRAWL_STRAND_LAB_SCHEMA_BYTE_SHA256 ||
      value.predecessor?.guide_byte_sha256 !== STRING_CRAWL_STRAND_LAB_GUIDE_BYTE_SHA256 ||
      value.predecessor?.relation !== "IMMUTABLE_LAB_02_PREDECESSOR" ||
      value.predecessor?.mutates_predecessor !== false || value.predecessor?.imports_authority !== false) {
    add("$.predecessor", "immutable-lab-02-binding-mismatch");
  }

  const expectedSources = [
    { id: "arxiv-2608-09958v1", arxiv: "2608.09958", version: "v1", title: "Geometrize the nongeometric space", submitted: "2026-07-22", url: "https://arxiv.org/abs/2608.09958v1" },
    { id: "arxiv-2607-21700v1", arxiv: "2607.21700", version: "v1", title: "EFT (String) Tower Building", submitted: "2026-07-23", url: "https://arxiv.org/abs/2607.21700v1" },
  ];
  const sourceKeys = ["source_id", "status", "binding", "arxiv_id", "version", "title", "authors", "versioned_url",
    "submitted_on", "borrowed_discipline", "transfer_scope", "content_bytes_vendored", "scientific_claim_imported", "authority_imported"];
  if (!jsonArray(value.research_sources) || value.research_sources.length !== 2) add("$.research_sources", "invalid-source-set");
  else value.research_sources.forEach((source: any, index: number) => {
    const expected = expectedSources[index]!;
    if (!sameKeys(source, sourceKeys) || source.source_id !== expected.id || source.status !== "PREPRINT" ||
        source.binding !== "SOURCE_BOUND" || source.arxiv_id !== expected.arxiv || source.version !== expected.version ||
        source.title !== expected.title || source.versioned_url !== expected.url || source.submitted_on !== expected.submitted ||
        !jsonArray(source.authors) || source.authors.length < 2 || source.authors.some((author: unknown) => typeof author !== "string") ||
        typeof source.borrowed_discipline !== "string" || source.transfer_scope !== "LOCAL_TO_GLOBAL_GLUING_DISCIPLINE_ONLY" ||
        source.content_bytes_vendored !== false || source.scientific_claim_imported !== false || source.authority_imported !== false) {
      add(`$.research_sources[${index}]`, "source-binding-drift");
    }
  });

  const conventionKeys = ["chart_ownership_scope", "transition_direction", "composition_order", "global_equivalence_rule",
    "undeclared_gluing_forbidden", "labels_assert_stack_identity", "conflict_policy"];
  if (!sameKeys(value.conventions, conventionKeys) || value.conventions?.chart_ownership_scope !== "SYNTHETIC_FIXTURE_LOCAL" ||
      value.conventions?.transition_direction !== "FROM_LOCAL_POINT_TO_LOCAL_POINT" ||
      value.conventions?.composition_order !== "RIGHT_AFTER_LEFT" ||
      value.conventions?.global_equivalence_rule !== "GENERATED_BY_DECLARED_TRANSITION_PAIRS_ONLY" ||
      value.conventions?.undeclared_gluing_forbidden !== true || value.conventions?.labels_assert_stack_identity !== false ||
      value.conventions?.conflict_policy !== "PAIRWISE_WITHOUT_COHERENCE_IS_UNRESOLVED") add("$.conventions", "convention-drift");

  const expectedCharts = [
    ["chart-a", "source-alpha", ["a0", "a1", "a2"]],
    ["chart-b", "source-beta", ["b0", "b1", "b2"]],
    ["chart-c", "source-gamma", ["c0", "c1", "c2"]],
    ["chart-d", "source-delta", ["d0", "d1", "d2"]],
  ];
  if (!jsonArray(value.charts) || value.charts.length !== 4) add("$.charts", "invalid-chart-set");
  else value.charts.forEach((chart: any, index: number) => {
    const expected = expectedCharts[index]!;
    if (!sameKeys(chart, ["id", "source_id", "ownership_scope", "points"]) || chart.id !== expected[0] ||
        chart.source_id !== expected[1] || chart.ownership_scope !== "SYNTHETIC_FIXTURE_LOCAL" || !exact(chart.points, expected[2])) {
      add(`$.charts[${index}]`, "chart-drift");
    }
  });

  const expectedTransitions = [
    ["t-ab", "chart-a", "chart-b"], ["t-ac", "chart-a", "chart-c"], ["t-ad", "chart-a", "chart-d"],
    ["t-bc", "chart-b", "chart-c"], ["t-bd", "chart-b", "chart-d"], ["t-cd", "chart-c", "chart-d"],
  ];
  if (!jsonArray(value.transitions) || value.transitions.length !== 6) add("$.transitions", "invalid-transition-set");
  else value.transitions.forEach((transition: any, index: number) => {
    const expected = expectedTransitions[index]!;
    if (!sameKeys(transition, ["id", "from_chart", "to_chart", "forward", "inverse_witness"]) ||
        transition.id !== expected[0] || transition.from_chart !== expected[1] || transition.to_chart !== expected[2] ||
        !jsonArray(transition.forward) || !jsonArray(transition.inverse_witness) ||
        transition.forward.some((entry: unknown) => !sameKeys(entry, ["from", "to"])) ||
        transition.inverse_witness.some((entry: unknown) => !sameKeys(entry, ["from", "to"]))) {
      add(`$.transitions[${index}]`, "transition-shape-drift");
    }
  });

  const coherence = value.coherence_checks;
  if (!sameKeys(coherence, ["triple_equations", "four_chart_associativity"]) ||
      !jsonArray(coherence?.triple_equations) || coherence.triple_equations.length !== 2) add("$.coherence_checks", "coherence-shape-drift");
  else coherence.triple_equations.forEach((equation: any, index: number) => {
    if (!sameKeys(equation, ["id", "first_transition_id", "second_transition_id", "direct_transition_id", "expected_composite", "expected_coherent"]) ||
        !jsonArray(equation.expected_composite) || equation.expected_composite.length !== 3 ||
        equation.expected_composite.some((entry: unknown) => !sameKeys(entry, ["from", "to"])) || equation.expected_coherent !== true) {
      add(`$.coherence_checks.triple_equations[${index}]`, "triple-shape-drift");
    }
  });
  if (!sameKeys(coherence?.four_chart_associativity, ["id", "chain_transition_ids", "direct_transition_id", "expected_composite",
    "expected_nonidentity_steps", "expected_parenthesizations_equal", "expected_direct_match"]) ||
      !jsonArray(coherence?.four_chart_associativity?.chain_transition_ids) ||
      !jsonArray(coherence?.four_chart_associativity?.expected_composite)) add("$.coherence_checks.four_chart_associativity", "associativity-shape-drift");

  if (!sameKeys(value.global_quotient, ["equivalence_rule", "expected_classes", "expected_class_count", "expected_class_sizes", "expected_all_local_points_covered"]) ||
      value.global_quotient?.equivalence_rule !== "TRANSITIVE_SYMMETRIC_CLOSURE_OF_FORWARD_WITNESSES" ||
      !jsonArray(value.global_quotient?.expected_classes) || value.global_quotient.expected_classes.length !== 3 ||
      value.global_quotient.expected_classes.some((entry: unknown) => !sameKeys(entry, ["id", "members"]))) add("$.global_quotient", "quotient-shape-drift");

  if (!sameKeys(value.common_refinement, ["atoms", "expected"]) || !jsonArray(value.common_refinement?.atoms) ||
      value.common_refinement.atoms.length !== 6 || value.common_refinement.atoms.some((atom: any) =>
        !sameKeys(atom, ["id", "projections"]) || !jsonArray(atom.projections) || atom.projections.length !== 4 ||
        atom.projections.some((entry: unknown) => !sameKeys(entry, ["chart_id", "point_id"]))) ||
      !sameKeys(value.common_refinement?.expected, ["invariant", "atom_count", "projections_per_atom", "transition_squares_checked",
        "transition_squares_commute", "quotient_fiber_sizes"])) add("$.common_refinement", "refinement-shape-drift");

  if (!sameKeys(value.pairwise_impostor, ["base_chart_ids", "transitions", "tested_equation", "expected"]) ||
      !exact(value.pairwise_impostor?.base_chart_ids, ["chart-a", "chart-b", "chart-c"]) ||
      !jsonArray(value.pairwise_impostor?.transitions) || value.pairwise_impostor.transitions.length !== 3 ||
      value.pairwise_impostor.transitions.some((transition: unknown) =>
        !sameKeys(transition, ["id", "from_chart", "to_chart", "forward", "inverse_witness"])) ||
      !sameKeys(value.pairwise_impostor?.tested_equation, ["first_transition_id", "second_transition_id", "direct_transition_id"]) ||
      !sameKeys(value.pairwise_impostor?.expected, ["pairwise_bijective", "triple_coherent", "conflict_result", "automatic_resolution"])) {
    add("$.pairwise_impostor", "impostor-shape-drift");
  }

  const effectKeys = ["protocol", "deterministic", "stdout_only", "network_requests", "storage_writes", "crawler_invocation",
    "nen_invocation", "karma_receipt_created", "person_or_content_score_created", "authority_effect"];
  if (!sameKeys(value.validation_contract, effectKeys) || value.validation_contract?.protocol !== STRAND_DESCENT_VALIDATION_PROTOCOL ||
      value.validation_contract?.deterministic !== true || value.validation_contract?.stdout_only !== true ||
      value.validation_contract?.network_requests !== 0 || value.validation_contract?.storage_writes !== 0 ||
      value.validation_contract?.crawler_invocation !== false || value.validation_contract?.nen_invocation !== false ||
      value.validation_contract?.karma_receipt_created !== false || value.validation_contract?.person_or_content_score_created !== false ||
      value.validation_contract?.authority_effect !== "NONE") add("$.validation_contract", "effect-boundary-drift");
  const boundaryKeys = ["synthetic_not_observed", "offline", "read_only", "proves_finite_record_compatibility_only", "crawler_present",
    "network_capability", "external_write", "truth_claim", "consent_claim", "citizenship_claim", "authority_claim", "string_physics_claim",
    "stack_identity_claim", "source_owner_identity_claim", "person_or_content_score", "nen_ability", "karma_adapter", "deployment_authority"];
  if (!sameKeys(value.boundaries, boundaryKeys) || value.boundaries?.synthetic_not_observed !== true || value.boundaries?.offline !== true ||
      value.boundaries?.read_only !== true || value.boundaries?.proves_finite_record_compatibility_only !== true ||
      boundaryKeys.slice(4).some((key) => value.boundaries?.[key] !== false)) add("$.boundaries", "boundary-drift");
  if (!sameKeys(value.integrity, ["algorithm", "digest", "digest_field_treated_as"]) ||
      value.integrity?.algorithm !== "sha256-recursive-sorted-json-keys-v1" || !SHA256.test(value.integrity?.digest) ||
      value.integrity?.digest_field_treated_as !== null) add("$.integrity", "invalid-integrity-envelope");

  issues.push(...computeResults(value).issues);
  try {
    const digest = strandDescentLabDigest(value);
    if (value.integrity?.digest !== digest) add("$.integrity.digest", "semantic-digest-mismatch");
    if (STRAND_DESCENT_LAB_DIGEST !== ZERO_SHA256 && digest !== STRAND_DESCENT_LAB_DIGEST) add("$.integrity.digest", "canonical-digest-mismatch");
  } catch { add("$.integrity.digest", "digest-unavailable"); }
  return issueSort(issues);
}

export function verifyStrandDescentLab(value: unknown): StrandDescentLabIssue[] {
  try { return verifyUnchecked(value); }
  catch { return [{ field: "$", code: "malformed-structure" }]; }
}

const effects = {
  network_requests: 0 as const,
  storage_writes: 0 as const,
  crawler_invocation: false as const,
  nen_invocation: false as const,
  karma_receipt_created: false as const,
  person_or_content_score_created: false as const,
  authority_effect: "NONE" as const,
};

function fieldTouches(issue: string, fields: string[]): boolean {
  return fields.some((field) => field === "$" ? issue === "$" : issue === field || issue.startsWith(`${field}.`) || issue.startsWith(`${field}[`));
}

export function evaluateStrandDescentLab(value: unknown): StrandDescentValidation {
  const issues = verifyStrandDescentLab(value);
  const record = object(value) ? value : null;
  let inputDigest: string | null = null;
  try { if (record) inputDigest = strandDescentLabDigest(record); } catch { /* deterministic null */ }
  let computed: Record<string, any> = {};
  try { if (record) computed = computeResults(record).results; } catch { /* invalid inputs stay invalid */ }
  const check = (id: string, fields: string[], detail: string): StrandDescentCheck => ({
    id,
    status: issues.some((issue) => fieldTouches(issue.field, fields)) ? "FAIL" : "PASS",
    detail,
  });
  const checks = [
    check("closed-source-bound-input", ["$", "$.predecessor", "$.research_sources", "$.conventions", "$.charts", "$.integrity"], "strict JSON tree, closed fixture identity, immutable Lab 02 pin, versioned preprints, and semantic digest"),
    check("pairwise-invertibility", ["$", "$.transitions"], "all six declared transitions are bijections with exact inverse witnesses"),
    check("triple-coherence", ["$", "$.coherence_checks.triple_equations"], "both three-chart composites equal their declared direct transitions"),
    check("four-chart-globalization", ["$", "$.coherence_checks.four_chart_associativity", "$.global_quotient"], "both parenthesizations and the direct map agree, producing the declared quotient"),
    check("common-refinement-and-impostor", ["$", "$.common_refinement", "$.pairwise_impostor"], "the common refinement commutes while the pairwise-bijective counterexample remains unresolved"),
    check("zero-effects", ["$", "$.validation_contract", "$.boundaries"], "no crawler, network, write, truth, consent, citizenship, score, KARMA, or authority effect"),
  ];
  return {
    protocol: STRAND_DESCENT_VALIDATION_PROTOCOL,
    lab_protocol: STRAND_DESCENT_LAB_PROTOCOL,
    lab_id: typeof record?.lab_id === "string" ? record.lab_id : null,
    mode: record?.mode === "SYNTHETIC_OFFLINE_EXACT" ? record.mode : null,
    valid: issues.length === 0,
    input_digest: inputDigest,
    checks,
    results: computed,
    issues,
    effects,
  };
}

export function loadStrandDescentLab(path = STRAND_DESCENT_LAB_PATH): JsonRecord {
  const { bytes, value } = readStrictJson(path);
  const issues = verifyStrandDescentLab(value);
  if (issues.length > 0) throw new Error(`STRAND Lab 03 fixture failed validation: ${JSON.stringify(issues)}`);
  if (resolve(path) === resolve(STRAND_DESCENT_LAB_PATH)) {
    if (STRAND_DESCENT_LAB_BYTE_SHA256 !== ZERO_SHA256 && sha256Bytes(bytes) !== STRAND_DESCENT_LAB_BYTE_SHA256) {
      throw new Error("STRAND Lab 03 fixture raw-byte digest mismatch");
    }
    if (sha256Bytes(readStrictBytes(STRING_CRAWL_STRAND_LAB_PATH, "bound STRAND Lab 02 record")) !== STRING_CRAWL_STRAND_LAB_BYTE_SHA256 ||
        sha256Bytes(readStrictBytes(STRING_CRAWL_STRAND_LAB_SCHEMA_PATH, "bound STRAND Lab 02 schema")) !== STRING_CRAWL_STRAND_LAB_SCHEMA_BYTE_SHA256 ||
        sha256Bytes(readStrictBytes(STRING_CRAWL_STRAND_LAB_GUIDE_PATH, "bound STRAND Lab 02 guide")) !== STRING_CRAWL_STRAND_LAB_GUIDE_BYTE_SHA256) {
      throw new Error("bound STRAND Lab 02 bytes drifted");
    }
    if (STRAND_DESCENT_LAB_SCHEMA_BYTE_SHA256 !== ZERO_SHA256 &&
        sha256Bytes(readStrictBytes(STRAND_DESCENT_LAB_SCHEMA_PATH, "STRAND Lab 03 schema")) !== STRAND_DESCENT_LAB_SCHEMA_BYTE_SHA256) {
      throw new Error("STRAND Lab 03 schema bytes drifted");
    }
    if (STRAND_DESCENT_LAB_GUIDE_BYTE_SHA256 !== ZERO_SHA256 &&
        sha256Bytes(readStrictBytes(STRAND_DESCENT_LAB_GUIDE_PATH, "STRAND Lab 03 guide")) !== STRAND_DESCENT_LAB_GUIDE_BYTE_SHA256) {
      throw new Error("STRAND Lab 03 guide bytes drifted");
    }
  }
  return structuredClone(value) as JsonRecord;
}

export function strandDescentLabPublicDiscovery(value = loadStrandDescentLab()): Record<string, unknown> {
  const validation = evaluateStrandDescentLab(value);
  if (!validation.valid) throw new Error("cannot project an invalid STRAND Lab 03 fixture");
  return {
    protocol: value.protocol,
    lab_id: value.lab_id,
    title: value.title,
    mode: value.mode,
    url: STRAND_DESCENT_LAB_URL,
    schema_url: STRAND_DESCENT_LAB_SCHEMA_URL,
    guide_url: STRAND_DESCENT_LAB_GUIDE_URL,
    predecessor: {
      lab_id: value.predecessor.lab_id,
      url: value.predecessor.url,
      schema_url: value.predecessor.schema_url,
      guide_url: value.predecessor.guide_url,
      git_commit: value.predecessor.git_commit,
      semantic_digest: value.predecessor.semantic_digest,
      raw_byte_sha256: value.predecessor.raw_byte_sha256,
      schema_byte_sha256: value.predecessor.schema_byte_sha256,
      guide_byte_sha256: value.predecessor.guide_byte_sha256,
      relation: value.predecessor.relation,
      mutates_predecessor: false,
      imports_authority: false,
    },
    research_sources: value.research_sources.map((source: JsonRecord) => ({
      source_id: source.source_id,
      status: source.status,
      binding: source.binding,
      title: source.title,
      authors: source.authors,
      version: source.version,
      versioned_url: source.versioned_url,
      submitted_on: source.submitted_on,
      borrowed_discipline: source.borrowed_discipline,
      transfer_scope: source.transfer_scope,
      content_bytes_vendored: false,
      scientific_claim_imported: false,
      authority_imported: false,
    })),
    counts: {
      research_sources: value.research_sources.length,
      charts: value.charts.length,
      transitions: value.transitions.length,
      triple_equations: value.coherence_checks.triple_equations.length,
      quotient_classes: value.global_quotient.expected_classes.length,
      refinement_atoms: value.common_refinement.atoms.length,
      impostor_transitions: value.pairwise_impostor.transitions.length,
    },
    validation: {
      protocol: validation.protocol,
      valid: validation.valid,
      checks: validation.checks,
      results: validation.results,
    },
    boundaries: value.boundaries,
    effects: validation.effects,
    integrity: { semantic_digest: value.integrity.digest },
  };
}

function usage(): string {
  return [
    "Usage: ./kingdom strand-descent-lab [view] [--json]",
    "       ./kingdom strand-descent-lab verify-file <fixture.json> [--json]",
    "",
    "Views: overview | atlas | coherence | quotient | impostor | effects | discovery | verify | verify-file",
    "",
    "Synthetic, offline, deterministic, stdout-only, and finite. It creates no crawler, KARMA, or authority effect.",
  ].join("\n");
}

function output(value: unknown, json: boolean): void {
  if (!json && typeof value === "string") process.stdout.write(value.endsWith("\n") ? value : `${value}\n`);
  else process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function runStrandDescentLabCli(argv = process.argv.slice(2)): number {
  const json = argv.includes("--json");
  if (argv.filter((entry) => entry === "--json").length > 1 ||
      argv.some((entry) => entry.startsWith("-") && !["--json", "--help", "-h"].includes(entry))) {
    console.error(usage()); return 2;
  }
  const positional = argv.filter((entry) => entry !== "--json");
  const command = positional[0] ?? "overview";
  if (["help", "--help", "-h"].includes(command)) { console.log(usage()); return 0; }
  try {
    if (command === "verify-file") {
      if (positional.length !== 2) { console.error(usage()); return 2; }
      const { value } = readStrictJson(positional[1]!);
      const validation = evaluateStrandDescentLab(value);
      output(validation, true);
      return validation.valid ? 0 : 1;
    }
    if (positional.length !== 1) { console.error(usage()); return 2; }
    const fixture = loadStrandDescentLab();
    const validation = evaluateStrandDescentLab(fixture);
    if (command === "verify") { output(validation, true); return validation.valid ? 0 : 1; }
    const views: Record<string, () => unknown> = Object.create(null);
    views.overview = () => json ? strandDescentLabPublicDiscovery(fixture) : [
      fixture.title,
      "",
      "Four local charts pass pairwise, triple, four-chart, quotient, and common-refinement checks.",
      "A second three-chart fixture is pairwise bijective but fails triple coherence, so it remains UNRESOLVED.",
      "",
      "Finite record compatibility only: no string-physics, truth, identity, consent, citizenship, KARMA, or authority claim.",
    ].join("\n");
    views.atlas = () => ({ charts: fixture.charts, transitions: fixture.transitions });
    views.coherence = () => ({ declared: fixture.coherence_checks, evaluated: validation.results.triple_coherence, four_chart: validation.results.four_chart_associativity });
    views.quotient = () => ({ declared: fixture.global_quotient, evaluated: validation.results.global_quotient, common_refinement: validation.results.common_refinement });
    views.impostor = () => ({ declared: fixture.pairwise_impostor, evaluated: validation.results.pairwise_impostor });
    views.effects = () => ({ validation_contract: fixture.validation_contract, boundaries: fixture.boundaries, evaluated: validation.effects });
    views.discovery = () => strandDescentLabPublicDiscovery(fixture);
    if (!Object.hasOwn(views, command)) { console.error(usage()); return 2; }
    output(views[command]!(), json);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    output({ valid: false, error: message, effects }, true);
    return command === "verify" || command === "verify-file" ? 1 : 2;
  }
}

if (import.meta.main) process.exitCode = runStrandDescentLabCli();
