#!/usr/bin/env bun
/** Exact, offline evaluator for STRAND Lab 03. It never crawls, writes, or executes candidate text. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
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
  STRING_CRAWL_STRAND_LAB_ID,
  STRING_CRAWL_STRAND_LAB_PATH,
  STRING_CRAWL_STRAND_LAB_PROTOCOL,
  STRING_CRAWL_STRAND_LAB_SCHEMA_BYTE_SHA256,
  STRING_CRAWL_STRAND_LAB_SCHEMA_PATH,
  loadStringCrawlStrandLab,
} from "./string-crawl-strand-lab.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MAX_FILE_BYTES = 512 * 1024;
const MAX_JSON_NODES = 20_000;
const MAX_JSON_STRING_CODE_UNITS = MAX_FILE_BYTES;
const NUMERIC_TOLERANCE = 1e-12;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const TOP_KEYS = [
  "$schema", "protocol", "lab_id", "version", "title", "subtitle", "mode",
  "predecessor", "conventions", "temporal_fixture", "spatial_fixture",
  "quantity_register", "pairwise_quantity_relations", "occurrence_fixture",
  "dimension_register", "presence_evidence_ladder", "ordering_contract",
  "release_slices", "features", "observations", "transitions", "frontiers",
  "cospans", "composition_check", "evidence_cards", "nonimplication_firewall",
  "effect_boundary", "karma_lanes", "validation_contract", "expected", "integrity",
] as const;

export const STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL =
  "kingdom.string-crawl-frequency-form-lab/0.1";
export const STRING_CRAWL_FREQUENCY_FORM_VALIDATION_PROTOCOL =
  "kingdom.string-crawl-frequency-form-validation/0.1";
export const STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_ID =
  "https://thekingdom.dev/schemas/string-crawl-frequency-form-lab/0.1.json";
export const STRING_CRAWL_FREQUENCY_FORM_LAB_ID =
  "string-crawl-frequency-form-lab-03-2026-08-16";
export const STRING_CRAWL_FREQUENCY_FORM_LAB_LOCATOR =
  "data/exploration/string-crawl-frequency-form-lab.v0.1.json";
export const STRING_CRAWL_FREQUENCY_FORM_LAB_PATH =
  join(ROOT, STRING_CRAWL_FREQUENCY_FORM_LAB_LOCATOR);
export const STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_LOCATOR =
  "schemas/string-crawl-frequency-form-lab-v0.1.schema.json";
export const STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_PATH =
  join(ROOT, STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_LOCATOR);
export const STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_LOCATOR =
  "references/string-crawl-frequency-form-lab.md";
export const STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_PATH =
  join(ROOT, STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_LOCATOR);
export const STRING_CRAWL_FREQUENCY_FORM_LAB_URL =
  "https://thekingdom.dev/experiments/string-crawl-frequency-form-lab-2026-08-16.json";
export const STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL =
  "https://thekingdom.dev/schemas/string-crawl-frequency-form-lab/0.1.json";
export const STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL =
  "https://thekingdom.dev/STRING-CRAWL-LAB-03.md";

// Freeze these only after the record, schema, and guide pass review.
export const STRING_CRAWL_FREQUENCY_FORM_LAB_DIGEST =
  "sha256:ecda97c03307706ce0a9108c27c9199968ee4dc29a7e4d045a036ed108d673c1";
export const STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256 =
  "sha256:883191b723950ff9cc29c913261f114237e9eaa3eac17ba49cade34b8b0492b4";
export const STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256 =
  "sha256:2b4fe72f656eeade68ebfb6654cbe52646aa49636fc201501995dc8673db93e3";
export const STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256 =
  "sha256:808769a513ffcb6230f99e4cd412db5dc4a998f308ccc65313050377634fc1b3";

type JsonRecord = Record<string, any>;
export type FrequencyFormIssue = { field: string; code: string };
export type FrequencyFormCheck = {
  id: string;
  status: "PASS" | "FAIL";
  detail: string;
};
export type FrequencyFormValidation = {
  protocol: typeof STRING_CRAWL_FREQUENCY_FORM_VALIDATION_PROTOCOL;
  lab_protocol: typeof STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL;
  lab_id: string | null;
  mode: "SYNTHETIC_OFFLINE_EXACT" | null;
  valid: boolean;
  input_digest: string | null;
  checks: FrequencyFormCheck[];
  results: Record<string, unknown>;
  issues: FrequencyFormIssue[];
  effects: {
    network_requests: 0;
    storage_writes: 0;
    subprocesses: 0;
    nen_invocation: false;
    kingdom_karma_receipt_created: false;
    zerone_karma_event_created: false;
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

type StrictJsonBudget = { nodes: number; stringCodeUnits: number };

function strictJsonTree(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
  budget: StrictJsonBudget = { nodes: 0, stringCodeUnits: 0 },
): boolean {
  budget.nodes += 1;
  if (budget.nodes > MAX_JSON_NODES) return false;
  if (typeof value === "string") {
    budget.stringCodeUnits += value.length;
    return budget.stringCodeUnits <= MAX_JSON_STRING_CODE_UNITS;
  }
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || depth > 64 || seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value) ? !jsonArray(value) : !object(value)) return false;
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (Array.isArray(value) && key === "length") continue;
    if (!("value" in descriptor) || !strictJsonTree(descriptor.value, depth + 1, seen, budget)) return false;
  }
  seen.delete(value);
  return true;
}

function sameJsonShape(value: unknown, template: unknown, depth = 0): boolean {
  if (depth > 64) return false;
  if (value === null || template === null) return value === null && template === null;
  if (Array.isArray(value) || Array.isArray(template)) {
    return jsonArray(value) && jsonArray(template) && value.length === template.length &&
      value.every((entry, index) => sameJsonShape(entry, template[index], depth + 1));
  }
  if (typeof value === "object" || typeof template === "object") {
    if (!object(value) || !object(template)) return false;
    const keys = Object.keys(template);
    return sameKeys(value, keys) && keys.every((key) => sameJsonShape(value[key], template[key], depth + 1));
  }
  return typeof value === typeof template;
}

function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}

function issueSort(issues: FrequencyFormIssue[]): FrequencyFormIssue[] {
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

function deepEqual(left: unknown, right: unknown): boolean {
  try { return isDeepStrictEqual(left, right); } catch { return false; }
}

function rounded(value: number): number {
  if (Math.abs(value) < NUMERIC_TOLERANCE) return 0;
  const integer = Math.round(value);
  return Math.abs(value - integer) < NUMERIC_TOLERANCE ? integer : value;
}

function roundedToFifteenDecimals(value: number): number {
  return Number(value.toFixed(15));
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(Math.trunc(left));
  let b = Math.abs(Math.trunc(right));
  while (b !== 0) [a, b] = [b, a % b];
  return a || 1;
}

function reducedRational(numerator: number, denominator: number): { numerator: number; denominator: number } {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) {
    return { numerator, denominator };
  }
  const divisor = greatestCommonDivisor(numerator, denominator);
  const sign = denominator < 0 ? -1 : 1;
  return { numerator: sign * numerator / divisor, denominator: sign * denominator / divisor };
}

type Complex = { real: number; imaginary: number };

function dft(samples: number[]): Complex[] {
  const count = samples.length;
  return Array.from({ length: count }, (_, frequency) => {
    let real = 0;
    let imaginary = 0;
    for (let time = 0; time < count; time += 1) {
      const angle = -2 * Math.PI * frequency * time / count;
      real += samples[time]! * Math.cos(angle);
      imaginary += samples[time]! * Math.sin(angle);
    }
    return { real: rounded(real), imaginary: rounded(imaginary) };
  });
}

function transpose(matrix: number[][]): number[][] {
  if (matrix.length === 0) return [];
  return Array.from({ length: matrix[0]!.length }, (_, column) =>
    matrix.map((row) => row[column] ?? 0));
}

function multiply(left: number[][], right: number[][]): number[][] {
  const rightT = transpose(right);
  return left.map((row) => rightT.map((column) =>
    row.reduce((sum, value, index) => sum + value * (column[index] ?? 0), 0)));
}

function matrixVector(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) => row.reduce((sum, value, index) =>
    sum + value * (vector[index] ?? 0), 0));
}

function dot(left: number[], right: number[]): number {
  return left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);
}

function identity(size: number): number[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => row === column ? 1 : 0));
}

function addScalarIdentity(matrix: number[][], scalar: number): number[][] {
  return matrix.map((row, i) => row.map((value, j) => value + (i === j ? scalar : 0)));
}

function scaleMatrix(matrix: number[][], scalar: number): number[][] {
  return matrix.map((row) => row.map((value) => value * scalar));
}

function approximate(left: number, right: number, tolerance = NUMERIC_TOLERANCE): boolean {
  return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= tolerance;
}

function approximateArray(left: unknown, right: unknown, tolerance = NUMERIC_TOLERANCE): boolean {
  return jsonArray(left) && jsonArray(right) && left.length === right.length &&
    left.every((entry, index) => typeof entry === "number" && typeof right[index] === "number" &&
      approximate(entry, right[index], tolerance));
}

function spectralProbabilities(laplacian: number[][], signal: number[], eigenvalues: number[]): number[] {
  if (laplacian.length !== 4 || signal.length !== 4 || eigenvalues.length !== 4) return [];
  const normSquared = dot(signal, signal);
  if (!Number.isFinite(normSquared) || normSquared <= 0) return [];
  return eigenvalues.map((eigenvalue, index) => {
    let projector = identity(4);
    let denominator = 1;
    for (let other = 0; other < eigenvalues.length; other += 1) {
      if (other === index) continue;
      projector = multiply(projector, addScalarIdentity(laplacian, -eigenvalues[other]!));
      denominator *= eigenvalue - eigenvalues[other]!;
    }
    const projection = matrixVector(scaleMatrix(projector, 1 / denominator), signal);
    return rounded(dot(projection, projection) / normSquared);
  });
}

function characteristicPolynomial(matrix: number[][]): number[] {
  const size = matrix.length;
  let auxiliary = identity(size);
  const coefficients = [1];
  for (let order = 1; order <= size; order += 1) {
    const product = multiply(matrix, auxiliary);
    const trace = product.reduce((sum, row, index) => sum + (row[index] ?? 0), 0);
    const coefficient = rounded(-trace / order);
    coefficients.push(coefficient);
    auxiliary = addScalarIdentity(product, coefficient);
  }
  return coefficients;
}

function symmetricEigenvalues(matrix: number[][]): number[] {
  if (matrix.length === 0 || matrix.some((row) => row.length !== matrix.length)) return [];
  const work = matrix.map((row) => [...row]);
  const size = work.length;
  for (let iteration = 0; iteration < 128; iteration += 1) {
    let p = 0; let q = 1; let largest = 0;
    for (let row = 0; row < size; row += 1) {
      for (let column = row + 1; column < size; column += 1) {
        const magnitude = Math.abs(work[row]![column] ?? 0);
        if (magnitude > largest) { largest = magnitude; p = row; q = column; }
      }
    }
    if (largest <= NUMERIC_TOLERANCE / 100) break;
    const app = work[p]![p]!; const aqq = work[q]![q]!; const apq = work[p]![q]!;
    const angle = 0.5 * Math.atan2(2 * apq, aqq - app);
    const cosine = Math.cos(angle); const sine = Math.sin(angle);
    for (let index = 0; index < size; index += 1) {
      if (index === p || index === q) continue;
      const aip = work[index]![p]!; const aiq = work[index]![q]!;
      work[index]![p] = work[p]![index] = cosine * aip - sine * aiq;
      work[index]![q] = work[q]![index] = sine * aip + cosine * aiq;
    }
    work[p]![p] = cosine * cosine * app - 2 * sine * cosine * apq + sine * sine * aqq;
    work[q]![q] = sine * sine * app + 2 * sine * cosine * apq + cosine * cosine * aqq;
    work[p]![q] = work[q]![p] = 0;
  }
  return work.map((row, index) => roundedToFifteenDecimals(rounded(row[index] ?? 0)))
    .sort((left, right) => left - right);
}

function rank(matrix: number[][]): number {
  const copy = matrix.map((row) => [...row]);
  let pivotRow = 0;
  const columns = copy[0]?.length ?? 0;
  for (let column = 0; column < columns && pivotRow < copy.length; column += 1) {
    let candidate = pivotRow;
    while (candidate < copy.length && Math.abs(copy[candidate]![column] ?? 0) < 1e-12) candidate += 1;
    if (candidate === copy.length) continue;
    [copy[pivotRow], copy[candidate]] = [copy[candidate]!, copy[pivotRow]!];
    const pivot = copy[pivotRow]![column]!;
    for (let index = column; index < columns; index += 1) copy[pivotRow]![index] /= pivot;
    for (let row = 0; row < copy.length; row += 1) {
      if (row === pivotRow) continue;
      const factor = copy[row]![column] ?? 0;
      for (let index = column; index < columns; index += 1) {
        copy[row]![index] -= factor * copy[pivotRow]![index]!;
      }
    }
    pivotRow += 1;
  }
  return pivotRow;
}

function incidence(value: JsonRecord): number[][] | null {
  const spatial = value.spatial_fixture;
  if (!object(spatial) || !jsonArray(spatial.vertices) || spatial.vertices.length !== 4 ||
      !jsonArray(spatial.oriented_edges) || spatial.oriented_edges.length !== 3) return null;
  const vertices = spatial.vertices;
  if (!vertices.every((entry: unknown) => typeof entry === "string") ||
      new Set(vertices).size !== vertices.length) return null;
  const index = new Map(vertices.map((vertex: string, position: number) => [vertex, position]));
  const matrix = Array.from({ length: 4 }, () => Array(3).fill(0));
  for (let column = 0; column < spatial.oriented_edges.length; column += 1) {
    const edge = spatial.oriented_edges[column];
    if (!object(edge) || typeof edge.tail !== "string" || typeof edge.head !== "string" ||
        edge.tail === edge.head || !index.has(edge.tail) || !index.has(edge.head) ||
        !jsonArray(edge.incidence) || edge.incidence.length !== 2) return null;
    const expected = new Map([[edge.tail, -1], [edge.head, 1]]);
    const seen = new Set<string>();
    for (const occurrence of edge.incidence) {
      if (!object(occurrence) || typeof occurrence.vertex_id !== "string" ||
          seen.has(occurrence.vertex_id) ||
          occurrence.coefficient !== expected.get(occurrence.vertex_id)) return null;
      seen.add(occurrence.vertex_id);
      matrix[index.get(occurrence.vertex_id)!]![column] = occurrence.coefficient;
    }
    if (seen.size !== 2) return null;
  }
  return matrix;
}

function stateResults(value: JsonRecord): Record<string, unknown> | null {
  if (!jsonArray(value.release_slices) || !jsonArray(value.features) || !jsonArray(value.observations)) return null;
  const order = new Map<string, number>();
  for (const slice of value.release_slices) {
    if (!object(slice) || typeof slice.id !== "string" || !Number.isInteger(slice.order)) return null;
    order.set(slice.id, slice.order);
  }
  const featureIds = value.features.map((feature: unknown) => object(feature) ? feature.id : null);
  if (!featureIds.every((entry: unknown) => typeof entry === "string")) return null;
  const bornOrders = new Map<string, number>();
  for (const feature of value.features) {
    if (!object(feature) || typeof feature.id !== "string" || typeof feature.born_in !== "string" ||
        !order.has(feature.born_in)) return null;
    bornOrders.set(feature.id, order.get(feature.born_in)!);
  }
  const onsets: Record<string, number> = Object.create(null);
  let present = 0;
  let missing = 0;
  let presentZero = 0;
  let birthStatePasses = true;
  const pairs = new Set<string>();
  for (const observation of value.observations) {
    if (!object(observation) || typeof observation.id !== "string" ||
        typeof observation.slice_id !== "string" || typeof observation.feature_id !== "string" ||
        !order.has(observation.slice_id) || !featureIds.includes(observation.feature_id)) return null;
    const pair = `${observation.slice_id}\0${observation.feature_id}`;
    if (pairs.has(pair)) return null;
    pairs.add(pair);
    const observedOrder = order.get(observation.slice_id)!;
    const bornOrder = bornOrders.get(observation.feature_id)!;
    if (observation.state === "MISSING" && observation.value === null) {
      missing += 1;
      if (observedOrder >= bornOrder) birthStatePasses = false;
    } else if (observation.state === "PRESENT" && Number.isFinite(observation.value)) {
      present += 1;
      if (observation.value === 0) presentZero += 1;
      if (observedOrder < bornOrder) birthStatePasses = false;
      onsets[observation.feature_id] = Math.min(onsets[observation.feature_id] ?? Infinity, observedOrder);
    } else {
      return null;
    }
  }
  if (pairs.size !== value.release_slices.length * value.features.length) return null;
  return {
    birth_state_passes: birthStatePasses && [...bornOrders].every(([feature, born]) => onsets[feature] === born),
    states: {
      present,
      missing,
      present_zero: presentZero,
      born_before_present_encoded_as: "MISSING_WITH_NULL",
    },
    onsets: {
      oscillation: onsets.oscillation,
      form: onsets.form,
      world: onsets.world,
      presence: onsets.presence,
      world_before_or_concurrent_with_presence: onsets.world <= onsets.presence,
      strict_world_before_presence: onsets.world < onsets.presence,
      interpretation: "ORDER_ONLY_NOT_CAUSAL",
    },
  };
}

function sortedStrings(value: unknown): string[] | null {
  if (!jsonArray(value) || !value.every((entry) => typeof entry === "string")) return null;
  return [...new Set(value)].sort();
}

function compositionResults(value: JsonRecord): Record<string, number> | null {
  if (!jsonArray(value.cospans) || value.cospans.length !== 2) return null;
  const left = value.cospans[0];
  const right = value.cospans[1];
  if (!object(left) || !object(right)) return null;
  const leftObservations = sortedStrings(left.observation_ids);
  const rightObservations = sortedStrings(right.observation_ids);
  const leftTransitions = sortedStrings(left.transition_ids);
  const rightTransitions = sortedStrings(right.transition_ids);
  if (!leftObservations || !rightObservations || !leftTransitions || !rightTransitions) return null;
  const intersection = (a: string[], b: string[]) => a.filter((entry) => new Set(b).has(entry));
  return {
    shared_observations: intersection(leftObservations, rightObservations).length,
    shared_transitions: intersection(leftTransitions, rightTransitions).length,
    glued_observations: new Set([...leftObservations, ...rightObservations]).size,
    glued_transitions: new Set([...leftTransitions, ...rightTransitions]).size,
  };
}

type CompositionAudit = {
  restriction_passes: boolean;
  signed_boundary_passes: boolean;
  gluing_passes: boolean;
  declaration_passes: boolean;
};

function compositionAudit(value: JsonRecord): CompositionAudit {
  const failed = {
    restriction_passes: false,
    signed_boundary_passes: false,
    gluing_passes: false,
    declaration_passes: false,
  };
  if (!jsonArray(value.observations) || !jsonArray(value.transitions) ||
      !jsonArray(value.frontiers) || !jsonArray(value.cospans)) return failed;
  const observations = value.observations.filter(object);
  const transitions = value.transitions.filter(object);
  const frontiers = value.frontiers.filter(object);
  const cospans = value.cospans.filter(object);
  if (observations.length !== value.observations.length || transitions.length !== value.transitions.length ||
      frontiers.length !== value.frontiers.length || cospans.length !== value.cospans.length) return failed;
  const observationById = new Map(observations.map((entry) => [entry.id, entry]));
  const transitionById = new Map(transitions.map((entry) => [entry.id, entry]));
  const frontierById = new Map(frontiers.map((entry) => [entry.id, entry]));
  const cospanById = new Map(cospans.map((entry) => [entry.id, entry]));
  if ([observationById.size, transitionById.size, frontierById.size, cospanById.size].some((size, index) =>
    size !== [observations.length, transitions.length, frontiers.length, cospans.length][index])) return failed;
  const sameSet = (left: unknown, right: unknown): boolean => {
    const a = sortedStrings(left); const b = sortedStrings(right);
    return Boolean(a && b && deepEqual(a, b));
  };
  const frontierPass = frontiers.every((frontier) => {
    if (typeof frontier.id !== "string" || typeof frontier.slice_id !== "string" ||
        !jsonArray(frontier.observation_ids)) return false;
    const exactSlice = observations.filter((entry) => entry.slice_id === frontier.slice_id).map((entry) => entry.id);
    return sameSet(frontier.observation_ids, exactSlice);
  });
  let signedBoundaryPass = true;
  const cospanPass = cospans.every((cospan) => {
    const input = frontierById.get(cospan.input_frontier_id);
    const output = frontierById.get(cospan.output_frontier_id);
    if (!input || !output || !jsonArray(cospan.observation_ids) || !jsonArray(cospan.transition_ids) ||
        !sameSet(cospan.observation_ids, [...input.observation_ids, ...output.observation_ids])) return false;
    const inputIds = new Set(input.observation_ids);
    const outputIds = new Set(output.observation_ids);
    const seenFeatures = new Set<string>();
    for (const transitionId of cospan.transition_ids) {
      const transition = transitionById.get(transitionId);
      if (!transition || !inputIds.has(transition.from_observation_id) ||
          !outputIds.has(transition.to_observation_id)) return false;
      const from = observationById.get(transition.from_observation_id);
      const to = observationById.get(transition.to_observation_id);
      if (!from || !to || from.feature_id !== to.feature_id || transition.feature_id !== from.feature_id ||
          seenFeatures.has(transition.feature_id)) return false;
      seenFeatures.add(transition.feature_id);
      const exactBoundary = [
        { observation_id: transition.from_observation_id, coefficient: -1 },
        { observation_id: transition.to_observation_id, coefficient: 1 },
      ];
      if (!deepEqual(transition.boundary, exactBoundary)) signedBoundaryPass = false;
    }
    return seenFeatures.size === 4;
  });
  const declaration = value.composition_check;
  if (!object(declaration)) return { ...failed, restriction_passes: frontierPass && cospanPass,
    signed_boundary_passes: signedBoundaryPass };
  const left = cospanById.get(declaration.left_cospan_id);
  const right = cospanById.get(declaration.right_cospan_id);
  const shared = frontierById.get(declaration.shared_frontier_id);
  if (!left || !right || !shared) return { ...failed, restriction_passes: frontierPass && cospanPass,
    signed_boundary_passes: signedBoundaryPass };
  const leftObservations = sortedStrings(left.observation_ids) ?? [];
  const rightObservations = sortedStrings(right.observation_ids) ?? [];
  const leftTransitions = sortedStrings(left.transition_ids) ?? [];
  const rightTransitions = sortedStrings(right.transition_ids) ?? [];
  const obsIntersection = leftObservations.filter((entry) => rightObservations.includes(entry));
  const transitionIntersection = leftTransitions.filter((entry) => rightTransitions.includes(entry));
  const obsUnion = [...new Set([...leftObservations, ...rightObservations])].sort();
  const transitionUnion = [...new Set([...leftTransitions, ...rightTransitions])].sort();
  const gluingPass = left.output_frontier_id === shared.id && right.input_frontier_id === shared.id &&
    sameSet(obsIntersection, shared.observation_ids) && transitionIntersection.length === 0 &&
    sameSet(obsUnion, observations.map((entry) => entry.id)) &&
    sameSet(transitionUnion, transitions.map((entry) => entry.id));
  const declarationPass = declaration.restriction_rule === "EXACT_SLICE_RESTRICTION" &&
    declaration.gluing_rule === "EXACT_OBSERVATION_ID_PUSHOUT" && declaration.passes === true &&
    sameSet(declaration.expected_intersection?.observation_ids, obsIntersection) &&
    jsonArray(declaration.expected_intersection?.transition_ids) &&
    declaration.expected_intersection.transition_ids.length === transitionIntersection.length &&
    declaration.expected_glued_counts?.observations === obsUnion.length &&
    declaration.expected_glued_counts?.transitions === transitionUnion.length;
  return {
    restriction_passes: frontierPass && cospanPass,
    signed_boundary_passes: signedBoundaryPass,
    gluing_passes: gluingPass,
    declaration_passes: declarationPass,
  };
}

function expectedCoreShape(value: JsonRecord, canonical: JsonRecord): boolean {
  const semanticSections = TOP_KEYS.filter((key) => key !== "integrity" && key !== "expected");
  if (!semanticSections.every((key) => deepEqual(value[key], canonical[key]))) return false;
  if (!sameKeys(value.expected, Object.keys(canonical.expected ?? {})) ||
      !sameKeys(value.integrity, Object.keys(canonical.integrity ?? {}))) return false;
  return Object.keys(canonical.expected ?? {}).every((key) =>
    sameKeys(value.expected?.[key], Object.keys(canonical.expected?.[key] ?? {})));
}

export function stringCrawlFrequencyFormLabDigest(value: JsonRecord): string {
  if (!strictJsonTree(value)) throw new Error("Lab 03 fixture is not a strict JSON tree");
  const material = structuredClone(value);
  if (!object(material.integrity)) throw new Error("Lab 03 fixture integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function calculate(value: JsonRecord): Record<string, unknown> {
  const samples = jsonArray(value.temporal_fixture?.samples) ? value.temporal_fixture.samples : [];
  const quadrature = jsonArray(value.temporal_fixture?.quadrature_samples) ?
    value.temporal_fixture.quadrature_samples : [];
  const spectrum = samples.every(Number.isFinite) ? dft(samples) : [];
  const quadratureSpectrum = quadrature.every(Number.isFinite) ? dft(quadrature) : [];
  const timeEnergy = samples.reduce((sum: number, sample: number) => sum + sample * sample, 0);
  const quadratureTimeEnergy = quadrature.reduce((sum: number, sample: number) => sum + sample * sample, 0);
  const spectralEnergy = spectrum.reduce((sum, entry) =>
    sum + entry.real * entry.real + entry.imaginary * entry.imaginary, 0);
  const quadratureSpectralEnergy = quadratureSpectrum.reduce((sum, entry) =>
    sum + entry.real * entry.real + entry.imaginary * entry.imaginary, 0);
  const oneSided = spectrum.slice(0, Math.floor(samples.length / 2) + 1);
  const dominantOneSidedBin = oneSided.reduce((best, entry, index) => {
    const magnitude = entry.real ** 2 + entry.imaginary ** 2;
    const prior = oneSided[best];
    const priorMagnitude = prior ? prior.real ** 2 + prior.imaginary ** 2 : -Infinity;
    return magnitude > priorMagnitude + NUMERIC_TOLERANCE ? index : best;
  }, 0);
  const conjugateBin = samples.length === 0 ? 0 : (samples.length - dominantOneSidedBin) % samples.length;
  const peakBins = new Set([dominantOneSidedBin, conjugateBin]);
  const offPeakMaximum = (entries: Complex[]): number => rounded(entries.reduce((maximum, entry, index) =>
    peakBins.has(index) ? maximum : Math.max(maximum, entry.real ** 2 + entry.imaginary ** 2), 0));
  const temporal = {
    dominant_one_sided_bin: dominantOneSidedBin,
    conjugate_bin: conjugateBin,
    normalized_cycles_per_tick: reducedRational(dominantOneSidedBin, samples.length),
    peak_coefficient: spectrum[dominantOneSidedBin] ?? null,
    conjugate_coefficient: spectrum[conjugateBin] ?? null,
    quadrature_peak_coefficient: quadratureSpectrum[dominantOneSidedBin] ?? null,
    quadrature_conjugate_coefficient: quadratureSpectrum[conjugateBin] ?? null,
    peak_magnitude_squared: spectrum[dominantOneSidedBin] ?
      rounded(spectrum[dominantOneSidedBin]!.real ** 2 + spectrum[dominantOneSidedBin]!.imaginary ** 2) : null,
    off_peak_max_magnitude_squared: offPeakMaximum(spectrum),
    quadrature_off_peak_max_magnitude_squared: offPeakMaximum(quadratureSpectrum),
    time_energy: timeEnergy,
    quadrature_time_energy: quadratureTimeEnergy,
    spectral_energy: rounded(spectralEnergy),
    quadrature_spectral_energy: rounded(quadratureSpectralEnergy),
    parseval_right_side: samples.length * timeEnergy,
    quadrature_parseval_right_side: quadrature.length * quadratureTimeEnergy,
    hertz_conversion: value.temporal_fixture?.physical_sample_interval_seconds === null ?
      "UNDEFINED" : "DEFINED_OUTSIDE_FIXTURE",
  };

  const b = incidence(value);
  const laplacian = b ? multiply(b, transpose(b)) : [];
  const selectedMode = jsonArray(value.spatial_fixture?.selected_mode) ?
    value.spatial_fixture.selected_mode : [];
  const selectedNorm = dot(selectedMode, selectedMode);
  const selectedImage = selectedMode.length === 4 ? matrixVector(laplacian, selectedMode) : [];
  const selectedEigenvalue = selectedNorm > 0 ? rounded(dot(selectedMode, selectedImage) / selectedNorm) : null;
  const residual = selectedMode.length === 4 ?
    matrixVector(laplacian, selectedMode).map((entry, index) =>
      rounded(entry - Number(selectedEigenvalue) * selectedMode[index]!)) : [];
  const characteristic = characteristicPolynomial(laplacian);
  const eigenvalues = symmetricEigenvalues(laplacian);
  const spatial = {
    incidence_matrix: b,
    laplacian_matrix: laplacian,
    characteristic_polynomial_coefficients: characteristic,
    spectrum_exact: deepEqual(characteristic, [1, -6, 10, -4, 0]) ?
      ["ZERO", "TWO_MINUS_SQRT_TWO", "TWO", "TWO_PLUS_SQRT_TWO"] : [],
    spectrum_approx: eigenvalues,
    selected_eigenvalue: selectedEigenvalue,
    selected_mode_residual: residual,
  };

  const vertices = jsonArray(value.spatial_fixture?.vertices) ? value.spatial_fixture.vertices.length : 0;
  const edges = jsonArray(value.spatial_fixture?.oriented_edges) ? value.spatial_fixture.oriented_edges.length : 0;
  const incidenceRank = b ? rank(b) : 0;
  const components = vertices > 0 ? vertices - incidenceRank : 0;
  const topology = {
    vertices,
    edges,
    components,
    incidence_rank: incidenceRank,
    betti: [components, edges - incidenceRank],
    cycle_rank: edges - vertices + components,
    euler_characteristic: vertices - edges,
    cell_dimension: edges > 0 ? 1 : 0,
    embedding_dimension: null,
  };

  const signal = jsonArray(value.spatial_fixture?.spatial_signal) ?
    value.spatial_fixture.spatial_signal : [];
  const signalNorm = dot(signal, signal);
  const dirichlet = signal.length === 4 ? dot(signal, matrixVector(laplacian, signal)) : 0;
  const probabilities = spectralProbabilities(laplacian, signal, eigenvalues);
  const entropy = -probabilities.reduce((sum, probability) =>
    sum + (probability === 0 ? 0 : probability * Math.log(probability)), 0);
  const inverseParticipation = probabilities.reduce((sum, probability) => sum + probability ** 2, 0);
  const spectralRepertoire = {
    signal_norm_squared: signalNorm,
    dirichlet_energy: dirichlet,
    rayleigh_quotient: reducedRational(dirichlet, signalNorm),
    entropy_exact: Math.abs(entropy - Math.log(2)) < 1e-12 ? "LN_2" : "OTHER",
    effective_mode_count: rounded(Math.exp(entropy)),
    inverse_participation_effective_count: rounded(1 / inverseParticipation),
    physical_dimension_claim: false,
  };

  const occurrence = {
    coded_entity_experience_count: value.occurrence_fixture?.coded_entity_experience_count,
    selected_experience_count: value.occurrence_fixture?.selected_experience_count,
    selected_post_count: value.occurrence_fixture?.selected_post_count,
    reported_percentage_tenths: Math.round(
      1000 * value.occurrence_fixture?.coded_entity_experience_count /
      value.occurrence_fixture?.selected_experience_count,
    ),
    population_prevalence: false,
  };
  const states = stateResults(value);
  const composition = compositionResults(value);
  const cospanAudit = compositionAudit(value);
  return {
    temporal,
    spatial,
    topology,
    spectral_repertoire: spectralRepertoire,
    occurrence,
    states: states?.states ?? null,
    onsets: states?.onsets ?? null,
    composition,
    state_audit: { birth_state_passes: states?.birth_state_passes === true },
    composition_audit: cospanAudit,
    mode_probabilities: probabilities,
  };
}

export function hasBoundedCalculationShape(
  value: unknown,
  template: JsonRecord = loadCanonicalUnchecked(),
): boolean {
  try {
    return object(value) && strictJsonTree(value) && sameJsonShape(value, template);
  } catch {
    return false;
  }
}

function verifyAgainstCanonical(value: JsonRecord, canonical: JsonRecord): FrequencyFormIssue[] {
  const issues: FrequencyFormIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
  if (value.$schema !== STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_ID ||
      value.protocol !== STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL ||
      value.lab_id !== STRING_CRAWL_FREQUENCY_FORM_LAB_ID ||
      value.version !== "0.1.0" ||
      value.title !== "STRAND Lab 03: Frequency → Form → World → Other" ||
      value.subtitle !== "Three Frequencies, Four Dimensions & the False Portal" ||
      value.mode !== "SYNTHETIC_OFFLINE_EXACT") add("$", "identity-mismatch");
  if (!expectedCoreShape(value, canonical)) add("$", "closed-contract-drift");
  if (!deepEqual(value.predecessor, canonical.predecessor)) add("$.predecessor", "immutable-predecessor-binding-drift");
  if (!deepEqual(value.conventions, canonical.conventions)) add("$.conventions", "numeric-or-typing-convention-drift");
  if (!deepEqual(value.temporal_fixture, canonical.temporal_fixture)) {
    add("$.temporal_fixture", "temporal-fixture-binding-drift");
  }

  const calculationShapeValid = hasBoundedCalculationShape(value, canonical);
  if (!calculationShapeValid) add("$", "calculation-shape-invalid");
  const results = calculationShapeValid ? calculate(value) : {};
  const expected = value.expected;
  if (!object(expected)) {
    add("$.expected", "must-be-object");
  } else {
    for (const key of ["temporal", "topology", "spectral_repertoire", "occurrence", "states", "onsets", "composition"]) {
      if (!deepEqual(expected[key], results[key])) add(`$.expected.${key}`, "recomputed-result-mismatch");
    }
    const actualSpatial = results.spatial;
    const spatialKeys = object(expected.spatial) && object(actualSpatial) ? Object.keys(actualSpatial) : [];
    const spatialNonApproxPass = object(expected.spatial) && object(actualSpatial) &&
      spatialKeys.every((key) => key === "spectrum_approx" || deepEqual(expected.spatial[key], actualSpatial[key]));
    const spectrumPass = object(expected.spatial) && object(actualSpatial) &&
      approximateArray(expected.spatial.spectrum_approx, actualSpatial.spectrum_approx,
        Number(value.conventions?.spectrum_absolute_tolerance));
    if (!spatialNonApproxPass || !spectrumPass) {
      add("$.expected.spatial", "recomputed-result-mismatch");
    }
  }

  const quantities = jsonArray(value.quantity_register) ? value.quantity_register : [];
  const kinds = quantities.map((entry) => object(entry) ? entry.kind : null);
  if (!deepEqual(kinds, [
    "SYNTHETIC_TEMPORAL_DFT_FREQUENCY",
    "GRAPH_LAPLACIAN_SPATIAL_MODE",
    "CODED_EXPERIENCE_OCCURRENCE_PROPORTION",
  ])) add("$.quantity_register", "three-frequency-type-drift");
  if (!quantities.every((entry) => object(entry) &&
      ["domain", "carrier", "operator", "estimator", "unit", "scale", "window",
        "sampling_frame", "uncertainty", "significance_rule"].every((field) =>
        typeof entry[field] === "string" && entry[field].length > 0) &&
      Number.isFinite(entry.display_value) && Number.isFinite(entry.normalized_value) &&
      entry.physical_quantity === false && entry.population_prevalence === false)) {
    add("$.quantity_register", "frequency-claim-escalation");
  }
  if (!deepEqual(value.quantity_register, canonical.quantity_register)) {
    add("$.quantity_register", "quantity-register-drift");
  }
  if (!jsonArray(value.pairwise_quantity_relations) ||
      value.pairwise_quantity_relations.length !== 3 ||
      value.pairwise_quantity_relations.some((entry: unknown) => !object(entry) ||
        entry.relation !== "NO_CANONICAL_CONVERSION" ||
        entry.same_numeral_means_same_quantity !== false)) {
    add("$.pairwise_quantity_relations", "typed-comparison-drift");
  }
  if (!deepEqual(value.pairwise_quantity_relations, canonical.pairwise_quantity_relations)) {
    add("$.pairwise_quantity_relations", "typed-comparison-drift");
  }
  if (value.occurrence_fixture?.population_prevalence !== false ||
      value.occurrence_fixture?.per_session_probability !== false ||
      value.occurrence_fixture?.external_entity_detection !== false) {
    add("$.occurrence_fixture", "occurrence-scope-escalation");
  }
  if (!deepEqual(value.occurrence_fixture, canonical.occurrence_fixture)) {
    add("$.occurrence_fixture", "occurrence-binding-drift");
  }
  if (!jsonArray(value.dimension_register) || value.dimension_register.length !== 4 ||
      value.dimension_register.some((entry: unknown) => !object(entry) ||
        ["definition", "estimator_or_theorem", "unit", "uncertainty", "sampling_scope"]
          .some((field) => typeof entry[field] !== "string" || entry[field].length === 0) ||
        entry.physical_spacetime_claim !== false)) {
    add("$.dimension_register", "dimension-register-drift");
  }
  if (!deepEqual(value.dimension_register, canonical.dimension_register)) {
    add("$.dimension_register", "dimension-register-drift");
  }
  if (!jsonArray(value.presence_evidence_ladder) ||
      !deepEqual(value.presence_evidence_ladder.map((entry: unknown) =>
        object(entry) ? [entry.kind, entry.state, entry.protocol, entry.scope,
          entry.present_here, entry.imports_next_level] : null), [
        ["SYNTHETIC_PRESENCE_MARKER", "PRESENT", "DECLARED_SYNTHETIC_FIXTURE_OBSERVATION", "THIS_SYNTHETIC_LAB_ONLY", true, false],
        ["PARTICIPANT_REPORTED_PRESENCE", "NOT_MEASURED", "NO_PARTICIPANT_PROTOCOL_IN_THIS_LAB", "THIS_SYNTHETIC_LAB_ONLY", false, false],
        ["NEURAL_CORRELATE_ASSOCIATED_WITH_REPORT", "NOT_MEASURED", "NO_NEURAL_MEASUREMENT_PROTOCOL_IN_THIS_LAB", "THIS_SYNTHETIC_LAB_ONLY", false, false],
        ["INDEPENDENTLY_VERIFIED_EXTERNAL_TARGET_OR_ENTITY", "NOT_MEASURED", "NO_EXTERNAL_TARGET_VERIFICATION_PROTOCOL_IN_THIS_LAB", "THIS_SYNTHETIC_LAB_ONLY", false, false],
      ])) add("$.presence_evidence_ladder", "presence-evidence-escalation");
  if (!deepEqual(value.presence_evidence_ladder, canonical.presence_evidence_ladder)) {
    add("$.presence_evidence_ladder", "presence-evidence-escalation");
  }
  if (value.ordering_contract?.relation !== "ORDER_ONLY_NOT_CAUSAL" ||
      value.ordering_contract?.arrows_establish_causation !== false ||
      value.ordering_contract?.arrows_establish_ontology !== false) {
    add("$.ordering_contract", "ordering-causality-escalation");
  }
  if (!deepEqual(value.ordering_contract, canonical.ordering_contract)) {
    add("$.ordering_contract", "ordering-contract-drift");
  }
  if (!jsonArray(value.features) || value.features.some((entry: unknown) =>
    !object(entry) || entry.evidence_kind !== "SYNTHETIC_MARKER" ||
    !String(entry.layer).startsWith("SYNTHETIC_"))) {
    add("$.features", "synthetic-marker-drift");
  }
  if (!deepEqual(value.features, canonical.features)) add("$.features", "feature-binding-drift");
  const stateAudit = object(results.state_audit) && results.state_audit.birth_state_passes === true;
  if (!stateAudit) add("$.observations", "born-before-present-state-failed");
  const cospanAudit = object(results.composition_audit) ? results.composition_audit : null;
  if (!cospanAudit?.restriction_passes) add("$.cospans", "exact-restriction-failed");
  if (!cospanAudit?.signed_boundary_passes) add("$.transitions", "signed-boundary-failed");
  if (!cospanAudit?.gluing_passes) add("$.cospans", "exact-gluing-failed");
  if (!cospanAudit?.declaration_passes) add("$.composition_check", "composition-witness-mismatch");
  if (!deepEqual(value.release_slices, canonical.release_slices)) add("$.release_slices", "release-slice-drift");
  if (!deepEqual(value.observations, canonical.observations)) add("$.observations", "observation-binding-drift");
  if (!deepEqual(value.transitions, canonical.transitions)) add("$.transitions", "transition-binding-drift");
  if (!deepEqual(value.frontiers, canonical.frontiers)) add("$.frontiers", "frontier-binding-drift");
  if (!deepEqual(value.cospans, canonical.cospans)) add("$.cospans", "cospan-binding-drift");
  if (!deepEqual(value.composition_check, canonical.composition_check)) {
    add("$.composition_check", "composition-witness-mismatch");
  }
  if (!deepEqual(value.evidence_cards, canonical.evidence_cards)) {
    add("$.evidence_cards", "primary-source-binding-drift");
  }
  const declaredProbabilities = jsonArray(value.spatial_fixture?.declared_mode_probabilities) ?
    value.spatial_fixture.declared_mode_probabilities.map((entry: unknown) => object(entry) ?
      Number(entry.numerator) / Number(entry.denominator) : NaN) : [];
  if (!approximateArray(declaredProbabilities, results.mode_probabilities, NUMERIC_TOLERANCE)) {
    add("$.spatial_fixture.declared_mode_probabilities", "spectral-projector-probability-mismatch");
  }
  if (!jsonArray(value.nonimplication_firewall) ||
      value.nonimplication_firewall.length !== 17 ||
      value.nonimplication_firewall.some((entry: unknown) =>
        !object(entry) || entry.relation !== "DOES_NOT_IMPLY")) {
    add("$.nonimplication_firewall", "nonimplication-firewall-drift");
  }
  if (!deepEqual(value.nonimplication_firewall, canonical.nonimplication_firewall)) {
    add("$.nonimplication_firewall", "nonimplication-firewall-drift");
  }
  if (!deepEqual(value.effect_boundary, canonical.effect_boundary) ||
      value.effect_boundary?.authority_effect !== "NONE") {
    add("$.effect_boundary", "effect-boundary-drift");
  }
  if (!deepEqual(value.karma_lanes, canonical.karma_lanes)) add("$.karma_lanes", "karma-lane-drift");
  if (!deepEqual(value.validation_contract, canonical.validation_contract)) {
    add("$.validation_contract", "validation-contract-drift");
  }
  if (!object(value.integrity) || value.integrity.algorithm !== "sha256-recursive-sorted-json-keys-v1" ||
      value.integrity.digest_field_treated_as !== null || !SHA256.test(value.integrity.digest ?? "")) {
    add("$.integrity", "integrity-envelope-invalid");
  } else if (stringCrawlFrequencyFormLabDigest(value) !== value.integrity.digest) {
    add("$.integrity.digest", "semantic-digest-mismatch");
  } else if (STRING_CRAWL_FREQUENCY_FORM_LAB_DIGEST !== `sha256:${"0".repeat(64)}` &&
      stringCrawlFrequencyFormLabDigest(value) !== STRING_CRAWL_FREQUENCY_FORM_LAB_DIGEST) {
    add("$.integrity.digest", "canonical-digest-mismatch");
  }
  return issueSort(issues);
}

let canonicalCache: JsonRecord | null = null;

function loadCanonicalUnchecked(): JsonRecord {
  if (canonicalCache) return canonicalCache;
  const bytes = readStrictBytes(STRING_CRAWL_FREQUENCY_FORM_LAB_PATH, "Lab 03 canonical fixture");
  const value = parseStrictJsonBytes(bytes, "Lab 03 canonical fixture JSON");
  if (!object(value) || !strictJsonTree(value)) throw new Error("Lab 03 canonical fixture is not strict JSON");
  canonicalCache = value;
  return value;
}

export function verifyStringCrawlFrequencyFormLab(value: unknown): FrequencyFormIssue[] {
  try {
    if (!strictJsonTree(value)) return [{ field: "$", code: "non-json-value" }];
    const copy = structuredClone(value);
    if (!object(copy)) return [{ field: "$", code: "must-be-object" }];
    return verifyAgainstCanonical(copy, loadCanonicalUnchecked());
  } catch {
    return [{ field: "$", code: "verification-failed-closed" }];
  }
}

function predecessorValid(value: JsonRecord): boolean {
  try {
    const predecessor = loadStringCrawlStrandLab();
    return predecessor.protocol === STRING_CRAWL_STRAND_LAB_PROTOCOL &&
      predecessor.lab_id === STRING_CRAWL_STRAND_LAB_ID &&
      predecessor.integrity?.digest === STRING_CRAWL_STRAND_LAB_DIGEST &&
      value.predecessor?.semantic_digest === STRING_CRAWL_STRAND_LAB_DIGEST &&
      sha256Bytes(readStrictBytes(STRING_CRAWL_STRAND_LAB_PATH, "Lab 02 record")) ===
        STRING_CRAWL_STRAND_LAB_BYTE_SHA256 &&
      sha256Bytes(readStrictBytes(STRING_CRAWL_STRAND_LAB_SCHEMA_PATH, "Lab 02 schema")) ===
        STRING_CRAWL_STRAND_LAB_SCHEMA_BYTE_SHA256 &&
      sha256Bytes(readStrictBytes(STRING_CRAWL_STRAND_LAB_GUIDE_PATH, "Lab 02 guide")) ===
        STRING_CRAWL_STRAND_LAB_GUIDE_BYTE_SHA256;
  } catch {
    return false;
  }
}

function evaluateStringCrawlFrequencyFormLabUnchecked(value: unknown): FrequencyFormValidation {
  const issues = verifyStringCrawlFrequencyFormLab(value);
  const record = object(value) && strictJsonTree(value) ? value : null;
  const results = record && hasBoundedCalculationShape(record) ? calculate(record) : {};
  const issueFields = new Set(issues.map((entry) => entry.field));
  const check = (id: string, pass: boolean, detail: string): FrequencyFormCheck => ({
    id,
    status: pass ? "PASS" : "FAIL",
    detail,
  });
  const checks = [
    check("closed-structure", !issues.some((entry) =>
      ["$", "$.integrity"].includes(entry.field)), "strict JSON and closed contract"),
    check("immutable-predecessor", record !== null && predecessorValid(record) &&
      !issueFields.has("$.predecessor"),
      "Lab 02 record, schema, guide, and semantic digest remain byte-bound"),
    check("temporal-dft", !issueFields.has("$.expected.temporal") &&
      !issueFields.has("$.conventions") && !issueFields.has("$.temporal_fixture"),
      "64-point DFT, quadrature phase, energy, and undefined-Hz boundary recomputed"),
    check("graph-spatial-spectrum", !issueFields.has("$.expected.spatial") &&
      !issueFields.has("$.spatial_fixture.declared_mode_probabilities") &&
      !issueFields.has("$.conventions"),
      "B, L=BB^T, characteristic polynomial, spectrum, and eigenpair recomputed"),
    check("topology-not-dimension", !issueFields.has("$.expected.topology") &&
      !issueFields.has("$.expected.spectral_repertoire") &&
      !issueFields.has("$.dimension_register"),
      "P4 topology and effective mode count remain distinct from physical dimension"),
    check("three-frequency-types", !issueFields.has("$.quantity_register") &&
      !issueFields.has("$.pairwise_quantity_relations") &&
      !issueFields.has("$.occurrence_fixture") &&
      !issueFields.has("$.expected.occurrence"),
      "temporal, graph-spatial, and coded-experience occurrence quantities are non-convertible"),
    check("synthetic-order-only", !issueFields.has("$.features") &&
      !issueFields.has("$.presence_evidence_ladder") &&
      !issueFields.has("$.ordering_contract") &&
      !issueFields.has("$.expected.states") && !issueFields.has("$.expected.onsets") &&
      !issueFields.has("$.observations") &&
      !issueFields.has("$.release_slices") && !issueFields.has("$.evidence_cards"),
      "synthetic marker order is bookkeeping, not causation or entity evidence"),
    check("cospan-composition", !issueFields.has("$.expected.composition") &&
      !issueFields.has("$.frontiers") && !issueFields.has("$.cospans") &&
      !issueFields.has("$.transitions") && !issueFields.has("$.composition_check"),
      "exact restriction, signed boundary, shared frontier, and exact-ID pushout recomputed"),
    check("zero-effects", !issueFields.has("$.effect_boundary") &&
      !issueFields.has("$.karma_lanes") && !issueFields.has("$.validation_contract") &&
      !issueFields.has("$.nonimplication_firewall"),
      "no network, write, subprocess, medical, authority, or KARMA effect"),
  ];
  if (checks.some((entry) => entry.status === "FAIL" && entry.id === "immutable-predecessor")) {
    issues.push({ field: "$.predecessor", code: "immutable-predecessor-byte-drift" });
  }
  const sortedIssues = issueSort(issues);
  return {
    protocol: STRING_CRAWL_FREQUENCY_FORM_VALIDATION_PROTOCOL,
    lab_protocol: STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL,
    lab_id: record && typeof record.lab_id === "string" ? record.lab_id : null,
    mode: record?.mode === "SYNTHETIC_OFFLINE_EXACT" ? record.mode : null,
    valid: sortedIssues.length === 0 && checks.every((entry) => entry.status === "PASS"),
    input_digest: record && object(record.integrity) && typeof record.integrity.digest === "string" ?
      record.integrity.digest : null,
    checks,
    results,
    issues: sortedIssues,
    effects: {
      network_requests: 0,
      storage_writes: 0,
      subprocesses: 0,
      nen_invocation: false,
      kingdom_karma_receipt_created: false,
      zerone_karma_event_created: false,
      authority_effect: "NONE",
    },
  };
}

export function evaluateStringCrawlFrequencyFormLab(value: unknown): FrequencyFormValidation {
  try {
    return evaluateStringCrawlFrequencyFormLabUnchecked(value);
  } catch {
    const checkIds = [
      "closed-structure", "immutable-predecessor", "temporal-dft", "graph-spatial-spectrum",
      "topology-not-dimension", "three-frequency-types", "synthetic-order-only",
      "cospan-composition", "zero-effects",
    ];
    return {
      protocol: STRING_CRAWL_FREQUENCY_FORM_VALIDATION_PROTOCOL,
      lab_protocol: STRING_CRAWL_FREQUENCY_FORM_LAB_PROTOCOL,
      lab_id: null,
      mode: null,
      valid: false,
      input_digest: null,
      checks: checkIds.map((id) => ({ id, status: "FAIL" as const, detail: "evaluation failed closed" })),
      results: {},
      issues: [{ field: "$", code: "evaluation-failed-closed" }],
      effects: {
        network_requests: 0,
        storage_writes: 0,
        subprocesses: 0,
        nen_invocation: false,
        kingdom_karma_receipt_created: false,
        zerone_karma_event_created: false,
        authority_effect: "NONE",
      },
    };
  }
}

export function loadStringCrawlFrequencyFormLab(path = STRING_CRAWL_FREQUENCY_FORM_LAB_PATH): JsonRecord {
  const bytes = readStrictBytes(path, "Lab 03 fixture");
  const value = parseStrictJsonBytes(bytes, "Lab 03 fixture JSON");
  const evaluation = evaluateStringCrawlFrequencyFormLab(value);
  if (!evaluation.valid) {
    throw new Error(`Lab 03 fixture refused: ${evaluation.issues.map((entry) =>
      `${entry.field}:${entry.code}`).join(", ")}`);
  }
  if (resolve(path) === resolve(STRING_CRAWL_FREQUENCY_FORM_LAB_PATH)) {
    if (STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256 !== `sha256:${"0".repeat(64)}` &&
        sha256Bytes(bytes) !== STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256) {
      throw new Error("Lab 03 raw-byte digest drift");
    }
    if (STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256 !== `sha256:${"0".repeat(64)}` &&
        sha256Bytes(readStrictBytes(STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_PATH, "Lab 03 schema")) !==
        STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256) {
      throw new Error("Lab 03 schema raw-byte digest drift");
    }
    if (STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256 !== `sha256:${"0".repeat(64)}` &&
        sha256Bytes(readStrictBytes(STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_PATH, "Lab 03 guide")) !==
        STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256) {
      throw new Error("Lab 03 guide raw-byte digest drift");
    }
    if (value.integrity?.digest !== STRING_CRAWL_FREQUENCY_FORM_LAB_DIGEST) {
      throw new Error("Lab 03 semantic digest drift");
    }
  }
  return value;
}

export function stringCrawlFrequencyFormLabPublicDiscovery(
  value = loadStringCrawlFrequencyFormLab(),
): JsonRecord {
  const evaluation = evaluateStringCrawlFrequencyFormLab(value);
  if (!evaluation.valid) throw new Error("Lab 03 discovery requires a valid fixture");
  return {
    protocol: value.protocol,
    lab_id: value.lab_id,
    version: value.version,
    title: value.title,
    subtitle: value.subtitle,
    mode: value.mode,
    url: STRING_CRAWL_FREQUENCY_FORM_LAB_URL,
    schema_url: STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_URL,
    guide_url: STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_URL,
    predecessor: {
      protocol: value.predecessor.protocol,
      lab_id: value.predecessor.lab_id,
      url: value.predecessor.url,
      relation: value.predecessor.relation,
      mutates_predecessor: false,
      imports_authority: false,
    },
    counts: {
      frequency_types: value.quantity_register.length,
      dimension_registers: value.dimension_register.length,
      presence_evidence_levels: value.presence_evidence_ladder.length,
      evidence_cards: value.evidence_cards.length,
      nonimplication_firewalls: value.nonimplication_firewall.length,
      validation_checks: evaluation.checks.length,
    },
    exact_findings: {
      temporal_bin: evaluation.results.temporal?.dominant_one_sided_bin,
      temporal_unit: value.conventions.temporal_frequency_unit,
      graph_eigenvalue: evaluation.results.spatial?.selected_eigenvalue,
      graph_unit: value.quantity_register[1].unit,
      betti: evaluation.results.topology?.betti,
      effective_mode_count: evaluation.results.spectral_repertoire?.effective_mode_count,
      onset_order: evaluation.results.onsets,
    },
    integrity: {
      algorithm: value.integrity.algorithm,
      digest: value.integrity.digest,
      byte_sha256: STRING_CRAWL_FREQUENCY_FORM_LAB_BYTE_SHA256,
      schema_byte_sha256: STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_BYTE_SHA256,
      guide_byte_sha256: STRING_CRAWL_FREQUENCY_FORM_LAB_GUIDE_BYTE_SHA256,
    },
    effect_boundary: structuredClone(value.effect_boundary),
  };
}

function resigned(value: JsonRecord): JsonRecord {
  value.integrity.digest = stringCrawlFrequencyFormLabDigest(value);
  return value;
}

export function runStringCrawlFrequencyFormLabFalsifiers(
  source = loadCanonicalUnchecked(),
): Array<{ id: string; invalid: boolean; issue_codes: string[] }> {
  const mutations: Array<[string, (value: JsonRecord) => void]> = [
    ["temporal-sample", (value) => { value.temporal_fixture.samples[0] = 0; }],
    ["temporal-hertz", (value) => { value.quantity_register[0].unit = "HERTZ"; }],
    ["incidence-sign", (value) => { value.spatial_fixture.oriented_edges[0].incidence[0].coefficient = 1; }],
    ["selected-mode", (value) => { value.spatial_fixture.selected_mode[1] = 0; }],
    ["effective-dimension", (value) => { value.expected.spectral_repertoire.effective_mode_count = 3; }],
    ["topology-cycle", (value) => { value.expected.topology.betti[1] = 1; }],
    ["presence-order", (value) => {
      const observation = value.observations.find((entry: JsonRecord) => entry.id === "o-r1-presence");
      observation.state = "PRESENT"; observation.value = 1;
    }],
    ["zero-erasure", (value) => {
      const observation = value.observations.find((entry: JsonRecord) => entry.id === "o-r1-oscillation");
      observation.state = "MISSING"; observation.value = null;
    }],
    ["quantity-equivalence", (value) => { value.pairwise_quantity_relations[0].relation = "EQUIVALENT"; }],
    ["authority-escalation", (value) => { value.effect_boundary.reported_message_is_authority = true; }],
  ];
  return mutations.map(([id, mutate]) => {
    const candidate = structuredClone(source);
    mutate(candidate);
    resigned(candidate);
    const issues = verifyStringCrawlFrequencyFormLab(candidate);
    return { id, invalid: issues.length > 0, issue_codes: [...new Set(issues.map((entry) => entry.code))].sort() };
  });
}

function usage(): string {
  return [
    "Usage: ./kingdom string-crawl-frequency-form-lab [view] [--json]",
    "       ./kingdom string-crawl-frequency-form-lab verify-file <fixture.json> [--json]",
    "",
    "Views: overview | frequency | geometry | sequence | evidence | effects | discovery | falsifiers | verify",
    "",
    "Offline and stdout-only. Candidate text is untrusted data, never an instruction.",
  ].join("\n");
}

function output(value: unknown, json: boolean): void {
  if (!json && typeof value === "string") {
    process.stdout.write(value.endsWith("\n") ? value : `${value}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function runStringCrawlFrequencyFormLabCli(argv = process.argv.slice(2)): number {
  const jsonFlags = argv.filter((argument) => argument === "--json");
  if (jsonFlags.length > 1 || argv.some((argument) =>
    argument.startsWith("-") && !["--json", "--help", "-h"].includes(argument))) {
    output(usage(), false);
    return 2;
  }
  const json = jsonFlags.length === 1;
  const positional = argv.filter((argument) => argument !== "--json");
  const command = positional[0] ?? "overview";
  if (["help", "--help", "-h"].includes(command) && positional.length === 1) {
    console.log(usage());
    return 0;
  }
  try {
    if (command === "verify-file") {
      if (positional.length !== 2) throw new Error("verify-file requires exactly one local path");
      const bytes = readStrictBytes(positional[1]!, "Lab 03 candidate");
      const candidate = parseStrictJsonBytes(bytes, "Lab 03 candidate JSON");
      const evaluation = evaluateStringCrawlFrequencyFormLab(candidate);
      output(evaluation, true);
      return evaluation.valid ? 0 : 1;
    }
    if (positional.length > 1) throw new Error("unexpected positional argument");
    const value = loadStringCrawlFrequencyFormLab();
    const evaluation = evaluateStringCrawlFrequencyFormLab(value);
    const views: Record<string, () => unknown> = Object.create(null);
    views.overview = () => json ? stringCrawlFrequencyFormLabPublicDiscovery(value) : [
      value.title,
      value.subtitle,
      "",
      "The number 2 can be a temporal bin relation, a graph eigenvalue, or an effective mode count without becoming one quantity.",
      "Synthetic order: oscillation < form < world = presence marker. Order is not cause.",
      "No entity Hz, portal, physical extra dimension, medical action, or KARMA effect.",
    ].join("\n");
    views.frequency = () => ({
      quantities: value.quantity_register,
      nonconversions: value.pairwise_quantity_relations,
      temporal: evaluation.results.temporal,
      occurrence: evaluation.results.occurrence,
    });
    views.geometry = () => ({
      spatial: evaluation.results.spatial,
      topology: evaluation.results.topology,
      spectral_repertoire: evaluation.results.spectral_repertoire,
      dimensions: value.dimension_register,
    });
    views.sequence = () => ({
      ordering_contract: value.ordering_contract,
      features: value.features,
      onsets: evaluation.results.onsets,
      composition: evaluation.results.composition,
      presence_evidence_ladder: value.presence_evidence_ladder,
    });
    views.evidence = () => value.evidence_cards;
    views.effects = () => ({ effect_boundary: value.effect_boundary, karma_lanes: value.karma_lanes });
    views.discovery = () => stringCrawlFrequencyFormLabPublicDiscovery(value);
    views.falsifiers = () => runStringCrawlFrequencyFormLabFalsifiers(value);
    views.verify = () => evaluation;
    if (!Object.hasOwn(views, command)) throw new Error("unknown view");
    output(views[command]!(), json);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    output({ valid: false, error: message }, true);
    return command === "verify" || command === "verify-file" ? 1 : 2;
  }
}

if (import.meta.main) process.exitCode = runStringCrawlFrequencyFormLabCli();
