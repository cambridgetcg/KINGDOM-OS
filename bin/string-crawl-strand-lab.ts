#!/usr/bin/env bun
/** Exact, offline evaluator for STRAND Lab 02. It never crawls or writes. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";
import {
  STRING_CRAWL_TRACE_SHEET_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_DIGEST,
  STRING_CRAWL_TRACE_SHEET_ID,
  STRING_CRAWL_TRACE_SHEET_LOCATOR,
  STRING_CRAWL_TRACE_SHEET_PATH,
} from "./string-crawl-trace-sheet.ts";
import {
  STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_DIGEST,
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_PATH,
  STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_ID,
  STRING_CRAWL_TRACE_SHEET_LAB_PATH,
  STRING_CRAWL_TRACE_SHEET_LAB_PROTOCOL,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_PATH,
  STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL,
  STRING_CRAWL_TRACE_SHEET_LAB_URL,
} from "./string-crawl-trace-sheet-lab.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MAX_FILE_BYTES = 512 * 1024;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const TOP_KEYS = [
  "$schema", "protocol", "lab_id", "version", "title", "mode", "predecessor", "source_binding",
  "conventions", "release_slices", "tracked_routes", "vertices", "edges", "faces",
  "subcomplexes", "frontiers", "cospans", "composition_checks", "validation_contract",
  "boundaries", "integrity",
] as const;

export const STRING_CRAWL_STRAND_LAB_PROTOCOL = "kingdom.string-crawl-strand-lab/0.1";
export const STRING_CRAWL_STRAND_VALIDATION_PROTOCOL = "kingdom.string-crawl-strand-validation/0.1";
export const STRING_CRAWL_STRAND_LAB_SCHEMA_ID = "https://thekingdom.dev/schemas/string-crawl-strand-lab/0.1.json";
export const STRING_CRAWL_STRAND_LAB_ID = "string-crawl-strand-lab-02-2026-08-16";
export const STRING_CRAWL_STRAND_LAB_LOCATOR = "data/exploration/string-crawl-strand-lab.v0.1.json";
export const STRING_CRAWL_STRAND_LAB_PATH = join(ROOT, STRING_CRAWL_STRAND_LAB_LOCATOR);
export const STRING_CRAWL_STRAND_LAB_SCHEMA_LOCATOR = "schemas/string-crawl-strand-lab-v0.1.schema.json";
export const STRING_CRAWL_STRAND_LAB_SCHEMA_PATH = join(ROOT, STRING_CRAWL_STRAND_LAB_SCHEMA_LOCATOR);
export const STRING_CRAWL_STRAND_LAB_GUIDE_LOCATOR = "references/string-crawl-strand-lab.md";
export const STRING_CRAWL_STRAND_LAB_GUIDE_PATH = join(ROOT, STRING_CRAWL_STRAND_LAB_GUIDE_LOCATOR);
export const STRING_CRAWL_STRAND_LAB_URL = "https://thekingdom.dev/labs/string-crawl-strand-lab-02-2026-08-16.json";
export const STRING_CRAWL_STRAND_LAB_SCHEMA_URL = "https://thekingdom.dev/schemas/string-crawl-strand-lab/0.1.json";
export const STRING_CRAWL_STRAND_LAB_GUIDE_URL = "https://thekingdom.dev/STRING-CRAWL-STRAND-LAB-02.md";

// Frozen only after the record, schema, and guide pass independent review.
export const STRING_CRAWL_STRAND_LAB_DIGEST = "sha256:cb07f3408cee01b0b465fa9ee543257e4d38e9cfddc203e47b4c8d429bcc3a1c";
export const STRING_CRAWL_STRAND_LAB_BYTE_SHA256 = "sha256:9aa56248ed6bdda8da4fd177617b87b2f5e3d5d1a657fedbb5059acb43b4b429";
export const STRING_CRAWL_STRAND_LAB_SCHEMA_BYTE_SHA256 = "sha256:6387cc7e2152f3e1e45c0dfb10eb6f14f22fbcdc933918bfed2c5ebea5866fb4";
export const STRING_CRAWL_STRAND_LAB_GUIDE_BYTE_SHA256 = "sha256:34256139d0f630278b0e9baf9688b04aaab09945e97b0901a9ee273787b1ea41";

type JsonRecord = Record<string, any>;
export type StringCrawlStrandLabIssue = { field: string; code: string };
export type StringCrawlStrandCheck = {
  id: string;
  status: "PASS" | "FAIL" | "NOT_APPLICABLE";
  detail: string;
};

export type StringCrawlStrandValidation = {
  protocol: typeof STRING_CRAWL_STRAND_VALIDATION_PROTOCOL;
  lab_protocol: typeof STRING_CRAWL_STRAND_LAB_PROTOCOL;
  lab_id: string | null;
  mode: "SYNTHETIC_OFFLINE_EXACT" | null;
  valid: boolean;
  input_digest: string | null;
  checks: StringCrawlStrandCheck[];
  invariants: Record<string, unknown>;
  local_findings: Record<string, unknown>;
  issues: StringCrawlStrandLabIssue[];
  effects: {
    network_requests: 0;
    storage_writes: 0;
    nen_invocation: false;
    karma_receipt_created: false;
    zerone_event_created: false;
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
  const arrayValue = Array.isArray(value);
  if (arrayValue ? !jsonArray(value) : !object(value)) return false;
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (arrayValue && key === "length") continue;
    if (!("value" in descriptor) || !strictJsonTree(descriptor.value, depth + 1, seen)) return false;
  }
  seen.delete(value);
  return true;
}

function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}

function id(value: unknown): value is string {
  return typeof value === "string" && value.length <= 160 && ID.test(value);
}

function integer(value: unknown, min = 0, max = 1024): value is number {
  return Number.isInteger(value) && Number(value) >= min && Number(value) <= max;
}

function exactStrings(value: unknown, expected: readonly unknown[]): boolean {
  return jsonArray(value) && value.length === expected.length &&
    value.every((entry, index) => entry === expected[index]);
}

function uniqueIds(value: unknown, key: string, count: number): Set<string> | null {
  if (!jsonArray(value) || value.length !== count) return null;
  const ids = value.map((entry) => object(entry) ? entry[key] : null);
  if (!ids.every(id) || new Set(ids).size !== count) return null;
  return new Set(ids as string[]);
}

function issueSort(issues: StringCrawlStrandLabIssue[]): StringCrawlStrandLabIssue[] {
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
  const bytes = readStrictBytes(path, "STRAND Lab 02 fixture");
  return { bytes, value: parseStrictJsonBytes(bytes, "STRAND Lab 02 fixture JSON") };
}

export function stringCrawlStrandLabDigest(value: JsonRecord): string {
  if (!strictJsonTree(value)) throw new Error("STRAND Lab 02 fixture is not a strict JSON tree");
  const material = structuredClone(value);
  if (!object(material.integrity)) throw new Error("STRAND Lab 02 fixture integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function rankF2(columns: number[][], rows: number): number {
  if (columns.length === 0 || rows === 0) return 0;
  const matrix = Array.from({ length: rows }, (_, row) => columns.map((column) => column[row] ?? 0));
  let pivot = 0;
  for (let column = 0; column < columns.length && pivot < rows; column += 1) {
    let candidate = pivot;
    while (candidate < rows && matrix[candidate]![column] === 0) candidate += 1;
    if (candidate === rows) continue;
    [matrix[pivot], matrix[candidate]] = [matrix[candidate]!, matrix[pivot]!];
    for (let row = 0; row < rows; row += 1) {
      if (row === pivot || matrix[row]![column] === 0) continue;
      for (let index = column; index < columns.length; index += 1) {
        matrix[row]![index] ^= matrix[pivot]![index]!;
      }
    }
    pivot += 1;
  }
  return pivot;
}

function components(vertexIds: string[], edges: JsonRecord[]): number {
  const adjacency = new Map(vertexIds.map((vertex) => [vertex, new Set<string>()]));
  for (const edge of edges) {
    if (!adjacency.has(edge.from) || !adjacency.has(edge.to)) continue;
    adjacency.get(edge.from)!.add(edge.to);
    adjacency.get(edge.to)!.add(edge.from);
  }
  let count = 0;
  const seen = new Set<string>();
  for (const start of vertexIds) {
    if (seen.has(start)) continue;
    count += 1;
    const stack = [start];
    seen.add(start);
    while (stack.length > 0) {
      const vertex = stack.pop()!;
      for (const next of adjacency.get(vertex) ?? []) {
        if (!seen.has(next)) { seen.add(next); stack.push(next); }
      }
    }
  }
  return count;
}

type Invariants = {
  vertices: number;
  edges: number;
  faces: number;
  components: number;
  euler_characteristic: number;
  graph_cycle_rank: number;
  boundary_matrix_rank_1: number;
  boundary_matrix_rank_2: number;
  betti_f2: [number, number, number];
  boundary_squared_zero: boolean;
};

function calculateInvariants(
  vertexIds: string[], edgeIds: string[], faceIds: string[],
  edgeById: Map<string, JsonRecord>, faceById: Map<string, JsonRecord>,
): Invariants | null {
  const vertices = new Map(vertexIds.map((entry, index) => [entry, index]));
  const edges = edgeIds.map((entry) => edgeById.get(entry)).filter(object);
  const faces = faceIds.map((entry) => faceById.get(entry)).filter(object);
  if (vertices.size !== vertexIds.length || edges.length !== edgeIds.length || faces.length !== faceIds.length) return null;
  const edgeIndex = new Map(edgeIds.map((entry, index) => [entry, index]));
  const d1 = edges.map((edge) => {
    const column = Array(vertices.size).fill(0);
    const from = vertices.get(edge.from);
    const to = vertices.get(edge.to);
    if (from === undefined || to === undefined) return column;
    column[from] ^= 1;
    column[to] ^= 1;
    return column;
  });
  const d2 = faces.map((face) => {
    const column = Array(edges.length).fill(0);
    for (const occurrence of jsonArray(face.attaching_cycle) ? face.attaching_cycle : []) {
      const index = object(occurrence) ? edgeIndex.get(occurrence.edge_id) : undefined;
      if (index !== undefined) column[index] ^= 1;
    }
    return column;
  });
  const boundarySquaredZero = d2.every((faceColumn) =>
    Array.from({ length: vertices.size }, (_, vertex) =>
      faceColumn.reduce((sum, included, edge) => sum ^ (included & (d1[edge]?.[vertex] ?? 0)), 0),
    ).every((entry) => entry === 0));
  const componentCount = components(vertexIds, edges);
  const rank1 = rankF2(d1, vertices.size);
  const rank2 = rankF2(d2, edges.length);
  return {
    vertices: vertices.size,
    edges: edges.length,
    faces: faces.length,
    components: componentCount,
    euler_characteristic: vertices.size - edges.length + faces.length,
    graph_cycle_rank: edges.length - vertices.size + componentCount,
    boundary_matrix_rank_1: rank1,
    boundary_matrix_rank_2: rank2,
    betti_f2: [vertices.size - rank1, edges.length - rank1 - rank2, faces.length - rank2],
    boundary_squared_zero: boundarySquaredZero,
  };
}

function endpoint(edge: JsonRecord, orientation: number, start: boolean): string | null {
  if (orientation === 1) return start ? edge.from : edge.to;
  if (orientation === -1) return start ? edge.to : edge.from;
  return null;
}

type LinkFinding = { vertex_id: string; components: number; degrees: number[]; valid_surface_link: boolean };

function localLinkFindings(
  vertexIds: string[], edgeIds: string[], faceIds: string[],
  edgeById: Map<string, JsonRecord>, faceById: Map<string, JsonRecord>,
): LinkFinding[] {
  const allowedEdges = new Set(edgeIds);
  const linkNodes = new Map(vertexIds.map((vertex) => [vertex, new Set<string>()]));
  for (const edgeId of edgeIds) {
    const edge = edgeById.get(edgeId);
    if (!edge) continue;
    if (linkNodes.has(edge.from)) linkNodes.get(edge.from)!.add(edgeId);
    if (linkNodes.has(edge.to)) linkNodes.get(edge.to)!.add(edgeId);
  }
  const linkEdges = new Map(vertexIds.map((vertex) => [vertex, [] as [string, string][]]));
  for (const faceId of faceIds) {
    const face = faceById.get(faceId);
    const cycle = face && jsonArray(face.attaching_cycle) ? face.attaching_cycle : [];
    for (let index = 0; index < cycle.length; index += 1) {
      const current = cycle[index];
      const next = cycle[(index + 1) % cycle.length];
      if (!object(current) || !object(next) || !allowedEdges.has(current.edge_id) || !allowedEdges.has(next.edge_id)) continue;
      const currentEdge = edgeById.get(current.edge_id);
      const nextEdge = edgeById.get(next.edge_id);
      if (!currentEdge || !nextEdge) continue;
      const vertex = endpoint(currentEdge, current.orientation, false);
      if (vertex !== endpoint(nextEdge, next.orientation, true) || !linkEdges.has(vertex!)) continue;
      linkEdges.get(vertex!)!.push([current.edge_id, next.edge_id]);
    }
  }
  return vertexIds.map((vertex) => {
    const nodes = [...(linkNodes.get(vertex) ?? [])];
    const adjacency = new Map(nodes.map((node) => [node, [] as string[]]));
    for (const [left, right] of linkEdges.get(vertex) ?? []) {
      adjacency.get(left)?.push(right);
      adjacency.get(right)?.push(left);
    }
    const degrees = nodes.map((node) => adjacency.get(node)?.length ?? 0).sort((a, b) => a - b);
    let componentCount = 0;
    const seen = new Set<string>();
    for (const node of nodes) {
      if (seen.has(node)) continue;
      componentCount += 1;
      const stack = [node]; seen.add(node);
      while (stack.length > 0) {
        for (const next of adjacency.get(stack.pop()!) ?? []) {
          if (!seen.has(next)) { seen.add(next); stack.push(next); }
        }
      }
    }
    const isCycle = nodes.length >= 3 && degrees.every((degree) => degree === 2);
    const isPath = nodes.length >= 2 && degrees.filter((degree) => degree === 1).length === 2 &&
      degrees.every((degree) => degree === 1 || degree === 2);
    return { vertex_id: vertex, components: componentCount, degrees, valid_surface_link: componentCount === 1 && (isPath || isCycle) };
  });
}

function canonicalStringSet(values: string[]): string {
  return [...new Set(values)].sort().join("\0");
}

function intersection(values: unknown, other: unknown): string[] {
  const strings = (entry: unknown): entry is string => typeof entry === "string";
  const right = new Set(jsonArray(other) ? other.filter(strings) : []);
  return [...new Set((jsonArray(values) ? values : []).filter(strings).filter((entry) => right.has(entry)))].sort();
}

function namespaced(namespace: string, values: unknown): string[] {
  return (jsonArray(values) ? values.filter((entry): entry is string => typeof entry === "string") : []).map((entry) => `${namespace}:${entry}`).sort();
}

function unionValues(...values: unknown[]): string[] {
  return [...new Set(values.flatMap((entry) => jsonArray(entry) ?
    entry.filter((item): item is string => typeof item === "string") : []))].sort();
}

function expectedInvariantObject(value: JsonRecord): JsonRecord {
  const { classification: _classification, ...numeric } = value;
  return numeric;
}

function verifyStringCrawlStrandLabUnchecked(value: unknown): StringCrawlStrandLabIssue[] {
  const issues: StringCrawlStrandLabIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  try {
    if (!strictJsonTree(value)) return [{ field: "$", code: "non-json-value" }];
    value = structuredClone(value);
  } catch { return [{ field: "$", code: "non-json-value" }]; }
  if (!object(value)) return [{ field: "$", code: "must-be-object" }];
  if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
  if (value.$schema !== STRING_CRAWL_STRAND_LAB_SCHEMA_ID ||
      value.protocol !== STRING_CRAWL_STRAND_LAB_PROTOCOL ||
      value.lab_id !== STRING_CRAWL_STRAND_LAB_ID || value.version !== "0.1.0" ||
      value.title !== "STRAND Lab 02: Release Cospans & the χ=1 Impostor" ||
      value.mode !== "SYNTHETIC_OFFLINE_EXACT") add("$", "identity-mismatch");

  if (!sameKeys(value.predecessor, [
    "protocol", "lab_id", "url", "schema_url", "guide_url", "git_commit",
    "semantic_digest", "byte_sha256", "schema_byte_sha256", "guide_byte_sha256",
    "relation", "mutates_predecessor", "imports_authority",
  ]) || value.predecessor?.protocol !== STRING_CRAWL_TRACE_SHEET_LAB_PROTOCOL ||
      value.predecessor?.lab_id !== STRING_CRAWL_TRACE_SHEET_LAB_ID ||
      value.predecessor?.url !== STRING_CRAWL_TRACE_SHEET_LAB_URL ||
      value.predecessor?.schema_url !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL ||
      value.predecessor?.guide_url !== STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL ||
      value.predecessor?.git_commit !== "57f1f8a1d018d5128501b82c5ddde1976677b3a1" ||
      value.predecessor?.semantic_digest !== STRING_CRAWL_TRACE_SHEET_LAB_DIGEST ||
      value.predecessor?.byte_sha256 !== STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256 ||
      value.predecessor?.schema_byte_sha256 !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256 ||
      value.predecessor?.guide_byte_sha256 !== STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256 ||
      value.predecessor?.relation !== "IMMUTABLE_LAB_01_PREDECESSOR" ||
      value.predecessor?.mutates_predecessor !== false || value.predecessor?.imports_authority !== false) {
    add("$.predecessor", "immutable-lab-01-binding-mismatch");
  }

  if (!sameKeys(value.source_binding, ["protocol", "project_id", "git_commit", "locator", "semantic_digest", "raw_sha256", "relation", "mutates_source", "imports_authority"]) ||
      value.source_binding?.protocol !== "kingdom.explore-phenomena-deep-project/0.1" ||
      value.source_binding?.project_id !== STRING_CRAWL_TRACE_SHEET_ID ||
      value.source_binding?.git_commit !== "a3a5ab28a058953f577576d0e1be3dd7beab046d" ||
      value.source_binding?.locator !== STRING_CRAWL_TRACE_SHEET_LOCATOR ||
      value.source_binding?.semantic_digest !== STRING_CRAWL_TRACE_SHEET_DIGEST ||
      value.source_binding?.raw_sha256 !== STRING_CRAWL_TRACE_SHEET_BYTE_SHA256 ||
      value.source_binding?.relation !== "BOUNDED_SYNTHETIC_FALSIFIER_FIXTURE" ||
      value.source_binding?.mutates_source !== false || value.source_binding?.imports_authority !== false) {
    add("$.source_binding", "source-binding-mismatch");
  }
  const expectedConventions = {
    coefficient_field: "F2", cell_model: "FINITE_REGULAR_CW_FIXTURE",
    occurrence_identity_retained: true, route_labels_identify_occurrences: false,
    alignment_requires_explicit_edge: true, face_requires_explicit_attaching_cycle: true,
    orientations_used_for_f2_rank: false, empty_face_frontier: true,
  };
  if (!sameKeys(value.conventions, Object.keys(expectedConventions)) ||
      Object.entries(expectedConventions).some(([key, expected]) => value.conventions?.[key] !== expected)) {
    add("$.conventions", "convention-mismatch");
  }

  const sliceIds = uniqueIds(value.release_slices, "id", 3);
  if (!sliceIds || !exactStrings(value.release_slices?.map((slice: any) => slice.id), ["r0", "r1", "r2"]) ||
      value.release_slices.some((slice: any, index: number) =>
        !sameKeys(slice, ["id", "order", "label"]) || slice.order !== index || !id(slice.label))) {
    add("$.release_slices", "invalid-release-slices");
  }
  const routeIds = uniqueIds(value.tracked_routes, "route_id", 6);
  const stableRoutes = jsonArray(value.tracked_routes) ? value.tracked_routes.filter((route: any) => route?.thread === "stable") : [];
  const bornRoutes = jsonArray(value.tracked_routes) ? value.tracked_routes.filter((route: any) => route?.thread === "born") : [];
  if (!routeIds || stableRoutes.length !== 5 || bornRoutes.length !== 1 ||
      stableRoutes.some((route: any) => !sameKeys(route, ["route_id", "thread", "present_in", "born_in"]) ||
        !exactStrings(route.present_in, ["r0", "r1", "r2"]) || route.born_in !== null) ||
      bornRoutes.some((route: any) => !sameKeys(route, ["route_id", "thread", "present_in", "born_in"]) ||
        !exactStrings(route.present_in, ["r1", "r2"]) || route.born_in !== "r1")) {
    add("$.tracked_routes", "five-stable-one-born-contract-failed");
  }

  const vertexIds = uniqueIds(value.vertices, "id", 18);
  const edgeIds = uniqueIds(value.edges, "id", 26);
  const faceIds = uniqueIds(value.faces, "id", 9);
  const vertices = jsonArray(value.vertices) ? value.vertices.filter(object) : [];
  const edges = jsonArray(value.edges) ? value.edges.filter(object) : [];
  const faces = jsonArray(value.faces) ? value.faces.filter(object) : [];
  const vertexById = new Map(vertices.map((entry) => [entry.id, entry]));
  const edgeById = new Map(edges.map((entry) => [entry.id, entry]));
  const faceById = new Map(faces.map((entry) => [entry.id, entry]));
  if (!vertexIds) add("$.vertices", "invalid-or-duplicate-vertices");
  if (!edgeIds) add("$.edges", "invalid-or-duplicate-edges");
  if (!faceIds) add("$.faces", "invalid-or-duplicate-faces");

  const occurrenceKeys = new Set<string>();
  let redirectTargets = 0;
  for (const [index, vertex] of vertices.entries()) {
    const field = `$.vertices[${index}]`;
    if (!sameKeys(vertex, ["id", "slice_id", "kind", "route_id", "redirect_target_label"]) ||
        !sliceIds?.has(vertex.slice_id)) { add(field, "invalid-vertex-shape"); continue; }
    if (vertex.kind === "TRACKED_ROUTE_OCCURRENCE") {
      if (!routeIds?.has(vertex.route_id) || vertex.redirect_target_label !== null) add(field, "invalid-route-occurrence");
      const key = `${vertex.route_id}\0${vertex.slice_id}`;
      if (occurrenceKeys.has(key)) add(field, "duplicate-route-occurrence");
      occurrenceKeys.add(key);
    } else if (vertex.kind === "REDIRECT_TARGET_ONLY") {
      redirectTargets += 1;
      if (vertex.route_id !== null || !id(vertex.redirect_target_label)) add(field, "invalid-redirect-target");
    } else add(field, "unknown-vertex-kind");
  }
  if (redirectTargets !== 1) add("$.vertices", "redirect-target-count-mismatch");
  for (const route of [...stableRoutes, ...bornRoutes]) {
    for (const slice of route.present_in ?? []) {
      if (!occurrenceKeys.has(`${route.route_id}\0${slice}`)) add("$.vertices", "missing-declared-route-occurrence");
    }
  }

  for (const [index, edge] of edges.entries()) {
    const field = `$.edges[${index}]`;
    if (!sameKeys(edge, ["id", "kind", "from", "to", "slice_id", "between_slices", "route_id", "face_ids"]) ||
        !vertexIds?.has(edge.from) || !vertexIds?.has(edge.to) || edge.from === edge.to ||
        !jsonArray(edge.between_slices) || !jsonArray(edge.face_ids) ||
        new Set(edge.face_ids).size !== edge.face_ids.length ||
        edge.face_ids.some((face: unknown) => !faceIds?.has(String(face)))) {
      add(field, "invalid-edge-shape"); continue;
    }
    const from = vertexById.get(edge.from)!;
    const to = vertexById.get(edge.to)!;
    if (edge.kind === "PATH") {
      if (from.slice_id !== to.slice_id || edge.slice_id !== from.slice_id || edge.between_slices.length !== 0 || edge.route_id !== null) add(field, "invalid-path-edge");
    } else if (edge.kind === "ALIGNMENT") {
      if (edge.slice_id !== null || edge.between_slices.length !== 2 ||
          edge.between_slices[0] !== from.slice_id || edge.between_slices[1] !== to.slice_id ||
          !routeIds?.has(edge.route_id) || from.route_id !== edge.route_id || to.route_id !== edge.route_id) add(field, "invalid-alignment-edge");
    } else if (edge.kind === "REDIRECT_SPUR") {
      if (from.slice_id !== to.slice_id || edge.slice_id !== from.slice_id || edge.between_slices.length !== 0 ||
          edge.route_id !== null || to.kind !== "REDIRECT_TARGET_ONLY") add(field, "invalid-redirect-spur");
    } else add(field, "unknown-edge-kind");
  }
  if (edges.filter((edge) => edge.kind === "REDIRECT_SPUR").length !== 1) add("$.edges", "redirect-spur-count-mismatch");

  const calculatedFaceIdsByEdge = new Map(edges.map((edge) => [edge.id, [] as string[]]));
  for (const [index, face] of faces.entries()) {
    const field = `$.faces[${index}]`;
    if (!sameKeys(face, ["id", "kind", "between_slices", "attaching_cycle"]) ||
        !["STABLE_ALIGNMENT_FACE", "BORN_ROUTE_ALIGNMENT_FACE"].includes(face.kind) ||
        !jsonArray(face.between_slices) || face.between_slices.length !== 2 ||
        new Set(face.between_slices).size !== 2 ||
        !face.between_slices.every((slice: unknown) => sliceIds?.has(String(slice))) ||
        !(["r0\0r1", "r1\0r2"].includes(face.between_slices.join("\0"))) ||
        !jsonArray(face.attaching_cycle) || face.attaching_cycle.length !== 4) {
      add(field, "invalid-face-shape"); continue;
    }
    const distinctEdges = new Set<string>();
    const distinctVertices = new Set<string>();
    let closed = true;
    for (let cycleIndex = 0; cycleIndex < 4; cycleIndex += 1) {
      const occurrence = face.attaching_cycle[cycleIndex];
      const next = face.attaching_cycle[(cycleIndex + 1) % 4];
      if (!sameKeys(occurrence, ["edge_id", "orientation"]) ||
          !sameKeys(next, ["edge_id", "orientation"]) ||
          !edgeIds?.has(occurrence.edge_id) || ![-1, 1].includes(occurrence.orientation)) {
        closed = false; continue;
      }
      distinctEdges.add(occurrence.edge_id);
      calculatedFaceIdsByEdge.get(occurrence.edge_id)?.push(face.id);
      const currentEdge = edgeById.get(occurrence.edge_id)!;
      const nextEdge = edgeById.get(next.edge_id);
      const start = endpoint(currentEdge, occurrence.orientation, true);
      const end = endpoint(currentEdge, occurrence.orientation, false);
      if (start) distinctVertices.add(start);
      if (!nextEdge || end !== endpoint(nextEdge, next.orientation, true)) closed = false;
      const currentSlices = new Set([vertexById.get(currentEdge.from)?.slice_id, vertexById.get(currentEdge.to)?.slice_id]);
      if ([...currentSlices].some((slice) => !face.between_slices.includes(slice))) closed = false;
    }
    if (!closed) add(field, "attaching-cycle-not-closed");
    if (distinctEdges.size !== 4 || distinctVertices.size !== 4) add(field, "non-regular-quadrilateral-face");
    const touchesBorn = face.attaching_cycle.some((occurrence: any) => {
      const edge = edgeById.get(occurrence.edge_id);
      return edge && [edge.from, edge.to].some((vertexId) => vertexById.get(vertexId)?.route_id === "route-lab");
    });
    if ((face.kind === "BORN_ROUTE_ALIGNMENT_FACE") !== touchesBorn) add(field, "face-kind-incidence-mismatch");
  }
  for (const edge of edges) {
    const declared = canonicalStringSet(edge.face_ids);
    const calculated = canonicalStringSet(calculatedFaceIdsByEdge.get(edge.id) ?? []);
    if (declared !== calculated) add(`$.edges.${edge.id}.face_ids`, "face-incidence-parity-failed");
  }

  const subcomplexIds = uniqueIds(value.subcomplexes, "id", 2);
  if (!subcomplexIds || !exactStrings(value.subcomplexes?.map((entry: any) => entry.id), ["stable-strip", "full-complex"])) {
    add("$.subcomplexes", "invalid-subcomplex-identities");
  }
  const invariantResults: Record<string, Invariants> = {};
  const linkResults: Record<string, LinkFinding[]> = {};
  for (const [index, subcomplex] of (jsonArray(value.subcomplexes) ? value.subcomplexes : []).entries()) {
    const field = `$.subcomplexes[${index}]`;
    if (!sameKeys(subcomplex, ["id", "vertex_ids", "edge_ids", "face_ids", "expected", "witnesses"]) ||
        !jsonArray(subcomplex.vertex_ids) || !jsonArray(subcomplex.edge_ids) || !jsonArray(subcomplex.face_ids) ||
        new Set(subcomplex.vertex_ids).size !== subcomplex.vertex_ids.length ||
        new Set(subcomplex.edge_ids).size !== subcomplex.edge_ids.length ||
        new Set(subcomplex.face_ids).size !== subcomplex.face_ids.length ||
        subcomplex.vertex_ids.some((entry: unknown) => !vertexIds?.has(String(entry))) ||
        subcomplex.edge_ids.some((entry: unknown) => !edgeIds?.has(String(entry))) ||
        subcomplex.face_ids.some((entry: unknown) => !faceIds?.has(String(entry))) ||
        !sameKeys(subcomplex.expected, ["vertices", "edges", "faces", "components", "euler_characteristic", "graph_cycle_rank", "boundary_matrix_rank_1", "boundary_matrix_rank_2", "betti_f2", "classification"]) ||
        !["vertices", "edges", "faces", "components", "graph_cycle_rank", "boundary_matrix_rank_1", "boundary_matrix_rank_2"].every((key) => integer(subcomplex.expected?.[key], 0, 128)) ||
        !integer(subcomplex.expected?.euler_characteristic, -128, 128) ||
        !jsonArray(subcomplex.expected?.betti_f2) || subcomplex.expected.betti_f2.length !== 3 ||
        !subcomplex.expected.betti_f2.every((entry: unknown) => integer(entry, 0, 128)) ||
        !["BOUNDARY_DISK", "NON_PURE_BRANCHED_CELL_COMPLEX"].includes(subcomplex.expected?.classification) ||
        !jsonArray(subcomplex.witnesses) || subcomplex.witnesses.length === 0 || subcomplex.witnesses.length > 12 ||
        new Set(subcomplex.witnesses).size !== subcomplex.witnesses.length ||
        !subcomplex.witnesses.every((entry: unknown) => typeof entry === "string" && entry.trim() === entry && entry.length > 0 && entry.length <= 500)) {
      add(field, "invalid-subcomplex-shape"); continue;
    }
    const localVertices = new Set(subcomplex.vertex_ids);
    const localEdges = new Set(subcomplex.edge_ids);
    for (const edgeId of subcomplex.edge_ids) {
      const edge = edgeById.get(edgeId)!;
      if (!localVertices.has(edge.from) || !localVertices.has(edge.to)) add(field, "subcomplex-edge-not-closed");
    }
    for (const faceId of subcomplex.face_ids) {
      const face = faceById.get(faceId)!;
      if (face.attaching_cycle.some((occurrence: any) => !localEdges.has(occurrence.edge_id))) add(field, "subcomplex-face-not-closed");
    }
    const calculated = calculateInvariants(subcomplex.vertex_ids, subcomplex.edge_ids, subcomplex.face_ids, edgeById, faceById);
    if (!calculated || !object(subcomplex.expected)) { add(field, "invariants-unavailable"); continue; }
    invariantResults[subcomplex.id] = calculated;
    const expected = expectedInvariantObject(subcomplex.expected);
    for (const key of ["vertices", "edges", "faces", "components", "euler_characteristic", "graph_cycle_rank", "boundary_matrix_rank_1", "boundary_matrix_rank_2"] as const) {
      if (calculated[key] !== expected[key]) add(`${field}.expected.${key}`, "computed-invariant-mismatch");
    }
    if (!exactStrings(calculated.betti_f2, subcomplex.expected.betti_f2)) add(`${field}.expected.betti_f2`, "computed-betti-mismatch");
    if (!calculated.boundary_squared_zero) add(field, "boundary-squared-nonzero");
    const findings = localLinkFindings(subcomplex.vertex_ids, subcomplex.edge_ids, subcomplex.face_ids, edgeById, faceById);
    linkResults[subcomplex.id] = findings;
    const incidenceCounts = subcomplex.edge_ids.map((entry: string) => (calculatedFaceIdsByEdge.get(entry) ?? []).filter((face) => subcomplex.face_ids.includes(face)).length);
    const surfacePass = findings.every((entry) => entry.valid_surface_link) && incidenceCounts.every((count) => count === 1 || count === 2);
    if (subcomplex.id === "stable-strip") {
      if (subcomplex.expected.classification !== "BOUNDARY_DISK" || !surfacePass) add(field, "stable-strip-not-boundary-surface");
    } else if (subcomplex.id === "full-complex") {
      const badVertices = findings.filter((entry) => !entry.valid_surface_link).map((entry) => entry.vertex_id).sort();
      if (subcomplex.expected.classification !== "NON_PURE_BRANCHED_CELL_COMPLEX" || surfacePass ||
          !exactStrings(badVertices, ["v-r1-commons", "v-r2-commons", "v-r2-contact", "v-r2-redirect-target"]) ||
          !subcomplex.edge_ids.some((entry: string) => (calculatedFaceIdsByEdge.get(entry) ?? []).length > 2) ||
          !subcomplex.edge_ids.some((entry: string) => (calculatedFaceIdsByEdge.get(entry) ?? []).length === 0)) {
        add(field, "full-complex-singularity-witness-mismatch");
      }
    }
  }

  const frontierIds = uniqueIds(value.frontiers, "id", 3);
  if (!frontierIds || !exactStrings(value.frontiers?.map((entry: any) => entry.id), ["b0", "b1", "b2"])) add("$.frontiers", "invalid-frontiers");
  const frontierById = new Map((jsonArray(value.frontiers) ? value.frontiers.filter(object) : []).map((entry) => [entry.id, entry]));
  for (const [index, frontier] of (jsonArray(value.frontiers) ? value.frontiers : []).entries()) {
    const field = `$.frontiers[${index}]`;
    if (!sameKeys(frontier, ["id", "slice_id", "vertex_ids", "edge_ids"]) || !sliceIds?.has(frontier.slice_id) ||
        !jsonArray(frontier.vertex_ids) || !jsonArray(frontier.edge_ids) ||
        frontier.vertex_ids.length === 0 || frontier.edge_ids.length === 0 ||
        new Set(frontier.vertex_ids).size !== frontier.vertex_ids.length ||
        new Set(frontier.edge_ids).size !== frontier.edge_ids.length ||
        frontier.vertex_ids.some((entry: unknown) => !vertexIds?.has(String(entry))) ||
        frontier.edge_ids.some((entry: unknown) => !edgeIds?.has(String(entry)))) { add(field, "invalid-frontier-shape"); continue; }
    const verticesInFrontier = new Set(frontier.vertex_ids);
    if (frontier.vertex_ids.some((entry: string) => vertexById.get(entry)?.slice_id !== frontier.slice_id) ||
        frontier.edge_ids.some((entry: string) => {
          const edge = edgeById.get(entry);
          return !edge || !verticesInFrontier.has(edge.from) || !verticesInFrontier.has(edge.to) || edge.slice_id !== frontier.slice_id;
        })) add(field, "frontier-not-slice-subcomplex");
  }

  const cospanIds = uniqueIds(value.cospans, "id", 2);
  const cospanById = new Map((jsonArray(value.cospans) ? value.cospans.filter(object) : []).map((entry) => [entry.id, entry]));
  if (!cospanIds || !exactStrings(value.cospans?.map((entry: any) => entry.id), ["c01", "c12"])) add("$.cospans", "invalid-cospans");
  for (const [index, cospan] of (jsonArray(value.cospans) ? value.cospans : []).entries()) {
    const field = `$.cospans[${index}]`;
    if (!sameKeys(cospan, ["id", "input_frontier_id", "output_frontier_id", "vertex_ids", "edge_ids", "face_ids", "expected_counts"]) ||
        !frontierIds?.has(cospan.input_frontier_id) || !frontierIds?.has(cospan.output_frontier_id) ||
        !jsonArray(cospan.vertex_ids) || !jsonArray(cospan.edge_ids) || !jsonArray(cospan.face_ids) ||
        cospan.vertex_ids.length === 0 || cospan.edge_ids.length === 0 || cospan.face_ids.length === 0 ||
        new Set(cospan.vertex_ids).size !== cospan.vertex_ids.length ||
        new Set(cospan.edge_ids).size !== cospan.edge_ids.length ||
        new Set(cospan.face_ids).size !== cospan.face_ids.length ||
        cospan.vertex_ids.some((entry: unknown) => !vertexIds?.has(String(entry))) ||
        cospan.edge_ids.some((entry: unknown) => !edgeIds?.has(String(entry))) ||
        cospan.face_ids.some((entry: unknown) => !faceIds?.has(String(entry))) ||
        !exactStrings([cospan.vertex_ids.length, cospan.edge_ids.length, cospan.face_ids.length], cospan.expected_counts)) {
      add(field, "invalid-cospan-shape"); continue;
    }
    const apexVertices = new Set(cospan.vertex_ids);
    const apexEdges = new Set(cospan.edge_ids);
    for (const frontierId of [cospan.input_frontier_id, cospan.output_frontier_id]) {
      const frontier = frontierById.get(frontierId);
      if (!frontier || frontier.vertex_ids.some((entry: string) => !apexVertices.has(entry)) ||
          frontier.edge_ids.some((entry: string) => !apexEdges.has(entry))) add(field, "literal-inclusion-leg-failed");
    }
    if (cospan.edge_ids.some((entry: string) => {
      const edge = edgeById.get(entry);
      return !edge || !apexVertices.has(edge.from) || !apexVertices.has(edge.to);
    }) || cospan.face_ids.some((entry: string) => {
      const face = faceById.get(entry);
      return !face || face.attaching_cycle.some((occurrence: any) => !apexEdges.has(occurrence.edge_id));
    })) {
      add(field, "cospan-apex-not-subcomplex");
    }
  }

  const sequential = value.composition_checks?.sequential;
  const identity = value.composition_checks?.identity;
  const parallel = value.composition_checks?.parallel;
  const associativity = value.composition_checks?.associativity_scope;
  if (!sameKeys(value.composition_checks, ["sequential", "identity", "parallel", "associativity_scope"]) ||
      !sameKeys(sequential, ["left_cospan_id", "right_cospan_id", "shared_frontier_id", "identification_rule", "expected_counts", "expected_subcomplex_id", "passes"]) ||
      !sameKeys(identity, ["rule", "left_identity_passes", "right_identity_passes"]) ||
      !sameKeys(parallel, ["operation", "copies", "expected_counts", "expected_components", "expected_euler_characteristic", "expected_graph_cycle_rank", "expected_betti_f2", "namespace_swap_passes", "empty_unit_passes", "interchange_passes"])) {
    add("$.composition_checks", "unexpected-or-missing-field");
  }
  const left = cospanById.get(sequential?.left_cospan_id);
  const right = cospanById.get(sequential?.right_cospan_id);
  const shared = frontierById.get(sequential?.shared_frontier_id);
  const full = (jsonArray(value.subcomplexes) ? value.subcomplexes : []).find((entry: any) => entry?.id === sequential?.expected_subcomplex_id);
  const union = (a: unknown, b: unknown) => canonicalStringSet(unionValues(a, b));
  const exactSharedIntersection = Boolean(left && right && shared &&
    exactStrings(intersection(left.vertex_ids, right.vertex_ids), [...shared.vertex_ids].sort()) &&
    exactStrings(intersection(left.edge_ids, right.edge_ids), [...shared.edge_ids].sort()) &&
    intersection(left.face_ids, right.face_ids).length === 0);
  const sequentialPass = object(sequential) && left && right && shared && full &&
    left.output_frontier_id === shared.id && right.input_frontier_id === shared.id &&
    exactSharedIntersection &&
    sequential.identification_rule === "EXACT_OCCURRENCE_ID_ONLY" &&
    union(left.vertex_ids, right.vertex_ids) === canonicalStringSet(full.vertex_ids) &&
    union(left.edge_ids, right.edge_ids) === canonicalStringSet(full.edge_ids) &&
    union(left.face_ids, right.face_ids) === canonicalStringSet(full.face_ids) &&
    exactStrings(sequential.expected_counts, [full.vertex_ids.length, full.edge_ids.length, full.face_ids.length]);
  if (!sequentialPass || sequential.passes !== true) add("$.composition_checks.sequential", "computed-pushout-failed");
  const identityPass = object(identity) && identity.rule === "B_TO_B_FROM_B" &&
    [left, right].every((cospan) => cospan && [cospan.input_frontier_id, cospan.output_frontier_id].every((frontierId: string) => {
      const frontier = frontierById.get(frontierId)!;
      const identityApex = { vertex_ids: frontier.vertex_ids, edge_ids: frontier.edge_ids, face_ids: [] };
      return intersection(cospan.vertex_ids, identityApex.vertex_ids).length === frontier.vertex_ids.length &&
        intersection(cospan.edge_ids, identityApex.edge_ids).length === frontier.edge_ids.length &&
        intersection(cospan.face_ids, identityApex.face_ids).length === 0 &&
        union(cospan.vertex_ids, identityApex.vertex_ids) === canonicalStringSet(cospan.vertex_ids) &&
        union(cospan.edge_ids, identityApex.edge_ids) === canonicalStringSet(cospan.edge_ids) &&
        union(cospan.face_ids, identityApex.face_ids) === canonicalStringSet(cospan.face_ids);
    }));
  if (!identityPass || identity.left_identity_passes !== true || identity.right_identity_passes !== true) add("$.composition_checks.identity", "computed-identity-failed");
  const fullInvariant = invariantResults["full-complex"];
  const parallelTemporal = (cospan: JsonRecord | undefined) => ({
    vertex_ids: cospan ? unionValues(namespaced("L", cospan.vertex_ids), namespaced("R", cospan.vertex_ids)) : [],
    edge_ids: cospan ? unionValues(namespaced("L", cospan.edge_ids), namespaced("R", cospan.edge_ids)) : [],
    face_ids: cospan ? unionValues(namespaced("L", cospan.face_ids), namespaced("R", cospan.face_ids)) : [],
  });
  const p01 = parallelTemporal(left);
  const p12 = parallelTemporal(right);
  const sequentialThenParallel = full ? {
    vertex_ids: unionValues(namespaced("L", full.vertex_ids), namespaced("R", full.vertex_ids)),
    edge_ids: unionValues(namespaced("L", full.edge_ids), namespaced("R", full.edge_ids)),
    face_ids: unionValues(namespaced("L", full.face_ids), namespaced("R", full.face_ids)),
  } : { vertex_ids: [], edge_ids: [], face_ids: [] };
  const parallelThenSequential = {
    vertex_ids: unionValues(p01.vertex_ids, p12.vertex_ids),
    edge_ids: unionValues(p01.edge_ids, p12.edge_ids),
    face_ids: unionValues(p01.face_ids, p12.face_ids),
  };
  const parallelShared = shared ? {
    vertex_ids: unionValues(namespaced("L", shared.vertex_ids), namespaced("R", shared.vertex_ids)),
    edge_ids: unionValues(namespaced("L", shared.edge_ids), namespaced("R", shared.edge_ids)),
    face_ids: [],
  } : { vertex_ids: [], edge_ids: [], face_ids: [] };
  const parallelIntersectionPass = exactStrings(intersection(p01.vertex_ids, p12.vertex_ids), parallelShared.vertex_ids) &&
    exactStrings(intersection(p01.edge_ids, p12.edge_ids), parallelShared.edge_ids) &&
    intersection(p01.face_ids, p12.face_ids).length === 0;
  const interchangePass = exactStrings(parallelThenSequential.vertex_ids, sequentialThenParallel.vertex_ids) &&
    exactStrings(parallelThenSequential.edge_ids, sequentialThenParallel.edge_ids) &&
    exactStrings(parallelThenSequential.face_ids, sequentialThenParallel.face_ids);
  const swapNamespace = (entry: string) => entry.startsWith("L:") ? `R:${entry.slice(2)}` : entry.startsWith("R:") ? `L:${entry.slice(2)}` : entry;
  const namespaceSwapPass = exactStrings(sequentialThenParallel.vertex_ids.map(swapNamespace).sort(), sequentialThenParallel.vertex_ids) &&
    exactStrings(sequentialThenParallel.edge_ids.map(swapNamespace).sort(), sequentialThenParallel.edge_ids) &&
    exactStrings(sequentialThenParallel.face_ids.map(swapNamespace).sort(), sequentialThenParallel.face_ids);
  const emptyUnitPass = full ? union([], full.vertex_ids) === canonicalStringSet(full.vertex_ids) &&
    union([], full.edge_ids) === canonicalStringSet(full.edge_ids) && union([], full.face_ids) === canonicalStringSet(full.face_ids) : false;
  const parallelPass = object(parallel) && fullInvariant && parallel.operation === "DISJOINT_UNION_WITH_L_AND_R_NAMESPACES" &&
    parallel.copies === 2 && exactStrings(parallel.expected_counts, [36, 52, 18]) &&
    parallel.expected_components === 2 && parallel.expected_euler_characteristic === 2 &&
    parallel.expected_graph_cycle_rank === 18 && exactStrings(parallel.expected_betti_f2, [2, 0, 0]) &&
    parallelIntersectionPass && interchangePass && namespaceSwapPass && emptyUnitPass &&
    sequentialThenParallel.vertex_ids.length === 36 && sequentialThenParallel.edge_ids.length === 52 && sequentialThenParallel.face_ids.length === 18;
  if (!parallelPass || parallel.namespace_swap_passes !== namespaceSwapPass ||
      parallel.empty_unit_passes !== emptyUnitPass || parallel.interchange_passes !== interchangePass) {
    add("$.composition_checks.parallel", "computed-disjoint-union-failed");
  }
  if (!sameKeys(associativity, ["nontrivial_associativity_tested", "reason", "identity_smoke_test_only"]) ||
      associativity.nontrivial_associativity_tested !== false || associativity.identity_smoke_test_only !== true ||
      typeof associativity.reason !== "string" || associativity.reason.length === 0 || associativity.reason.length > 500 ||
      !associativity.reason.includes("four slices")) {
    add("$.composition_checks.associativity_scope", "associativity-scope-drift");
  }

  const effects = value.validation_contract;
  if (!sameKeys(effects, ["protocol", "deterministic", "stdout_only", "network_requests", "storage_writes", "nen_invocation", "karma_receipt_created", "zerone_event_created", "authority_effect"]) ||
      effects?.protocol !== STRING_CRAWL_STRAND_VALIDATION_PROTOCOL || effects?.deterministic !== true ||
      effects?.stdout_only !== true || effects?.network_requests !== 0 || effects?.storage_writes !== 0 ||
      effects?.nen_invocation !== false || effects?.karma_receipt_created !== false ||
      effects?.zerone_event_created !== false || effects?.authority_effect !== "NONE") add("$.validation_contract", "effect-boundary-drift");
  const boundaryKeys = ["synthetic_not_observed", "offline", "read_only", "crawler_present", "network_capability", "external_write", "surface_claim_for_full_complex", "physical_string_claim", "spacetime_claim", "gauge_or_weyl_claim", "causal_claim", "consent_or_authorization_claim", "person_or_content_score", "nen_ability", "karma_adapter", "deployment_authority"];
  if (!sameKeys(value.boundaries, boundaryKeys) || value.boundaries?.synthetic_not_observed !== true ||
      value.boundaries?.offline !== true || value.boundaries?.read_only !== true ||
      boundaryKeys.slice(3).some((key) => value.boundaries?.[key] !== false)) add("$.boundaries", "boundary-drift");
  if (!sameKeys(value.integrity, ["algorithm", "digest", "digest_field_treated_as"]) ||
      value.integrity?.algorithm !== "sha256-recursive-sorted-json-keys-v1" ||
      !SHA256.test(value.integrity?.digest) || value.integrity?.digest_field_treated_as !== null) add("$.integrity", "invalid-integrity-envelope");
  try {
    const digest = stringCrawlStrandLabDigest(value);
    if (value.integrity?.digest !== digest) add("$.integrity.digest", "semantic-digest-mismatch");
    if (STRING_CRAWL_STRAND_LAB_DIGEST !== `sha256:${"0".repeat(64)}` && digest !== STRING_CRAWL_STRAND_LAB_DIGEST) add("$.integrity.digest", "canonical-digest-mismatch");
  } catch { add("$.integrity.digest", "digest-unavailable"); }
  return issueSort(issues);
}

export function verifyStringCrawlStrandLab(value: unknown): StringCrawlStrandLabIssue[] {
  try {
    return verifyStringCrawlStrandLabUnchecked(value);
  } catch {
    return [{ field: "$", code: "malformed-structure" }];
  }
}

function makeValidation(value: unknown, extraIssues: StringCrawlStrandLabIssue[] = []): StringCrawlStrandValidation {
  const issues = issueSort([...extraIssues, ...verifyStringCrawlStrandLab(value)]);
  const record = object(value) ? value : null;
  const failed = new Set(issues.map((entry) => entry.field));
  const fieldMatches = (entry: string, field: string): boolean => field === "$"
    ? entry === "$"
    : entry === field || entry.startsWith(`${field}.`) || entry.startsWith(`${field}[`);
  const check = (id: string, fields: string[], detail: string): StringCrawlStrandCheck => ({
    id,
    status: fields.some((field) => [...failed].some((entry) => fieldMatches(entry, field))) ? "FAIL" : "PASS",
    detail,
  });
  const checks = [
    check("strict-closed-input", ["$", "$.predecessor", "$.source_binding", "$.conventions", "$.integrity"], "strict JSON tree, closed identity, immutable lineage, and semantic digest"),
    check("occurrence-and-incidence", ["$", "$.release_slices", "$.tracked_routes", "$.vertices", "$.edges", "$.faces"], "occurrence identity, explicit alignments, regular attaching cycles, and reverse incidence"),
    check("exact-f2-chain-complex", ["$", "$.subcomplexes"], "exact F2 ranks, Betti numbers, Euler characteristic, and boundary squared zero"),
    check("local-surface-audit", ["$", "$.subcomplexes"], "stable disk links pass while all declared full-complex singularities remain visible"),
    check("inclusion-cospan-composition", ["$", "$.frontiers", "$.cospans", "$.composition_checks"], "literal inclusion legs, exact-occurrence pushout, identity, and disjoint-union checks"),
    check("zero-effects", ["$", "$.validation_contract", "$.boundaries"], "no crawler, network, write, NEN invocation, receipt, event, score, or authority"),
  ];
  const effects = {
    network_requests: 0 as const,
    storage_writes: 0 as const,
    nen_invocation: false as const,
    karma_receipt_created: false as const,
    zerone_event_created: false as const,
    authority_effect: "NONE" as const,
  };
  if (issues.length > 0) {
    let inputDigest: string | null = null;
    try { if (record) inputDigest = stringCrawlStrandLabDigest(record); } catch { /* deterministic null */ }
    return {
      protocol: STRING_CRAWL_STRAND_VALIDATION_PROTOCOL,
      lab_protocol: STRING_CRAWL_STRAND_LAB_PROTOCOL,
      lab_id: typeof record?.lab_id === "string" ? record.lab_id : null,
      mode: record?.mode === "SYNTHETIC_OFFLINE_EXACT" ? record.mode : null,
      valid: false,
      input_digest: inputDigest,
      checks,
      invariants: {},
      local_findings: { bad_vertices: [], branch_edges: [], faceless_edges: [] },
      issues,
      effects,
    };
  }
  const edges = record && jsonArray(record.edges) ? record.edges.filter(object) : [];
  const faces = record && jsonArray(record.faces) ? record.faces.filter(object) : [];
  const edgeById = new Map(edges.map((entry) => [entry.id, entry]));
  const faceById = new Map(faces.map((entry) => [entry.id, entry]));
  const invariants: Record<string, unknown> = {};
  const links: Record<string, LinkFinding[]> = {};
  if (record && jsonArray(record.subcomplexes)) {
    for (const subcomplex of record.subcomplexes.filter(object)) {
      if (!jsonArray(subcomplex.vertex_ids) || !jsonArray(subcomplex.edge_ids) || !jsonArray(subcomplex.face_ids)) continue;
      const result = calculateInvariants(subcomplex.vertex_ids, subcomplex.edge_ids, subcomplex.face_ids, edgeById, faceById);
      if (result) invariants[subcomplex.id] = result;
      links[subcomplex.id] = localLinkFindings(subcomplex.vertex_ids, subcomplex.edge_ids, subcomplex.face_ids, edgeById, faceById);
    }
  }
  const badVertices = (links["full-complex"] ?? []).filter((entry) => !entry.valid_surface_link);
  const faceCounts = new Map(edges.map((edge) => [edge.id, 0]));
  for (const face of faces) for (const occurrence of jsonArray(face.attaching_cycle) ? face.attaching_cycle : []) {
    if (object(occurrence) && faceCounts.has(occurrence.edge_id)) faceCounts.set(occurrence.edge_id, faceCounts.get(occurrence.edge_id)! + 1);
  }
  const branchEdges = [...faceCounts.entries()].filter(([, count]) => count > 2).map(([edge]) => edge).sort();
  const facelessEdges = [...faceCounts.entries()].filter(([, count]) => count === 0).map(([edge]) => edge).sort();
  let inputDigest: string | null = null;
  try { if (record) inputDigest = stringCrawlStrandLabDigest(record); } catch { /* deterministic null */ }
  return {
    protocol: STRING_CRAWL_STRAND_VALIDATION_PROTOCOL,
    lab_protocol: STRING_CRAWL_STRAND_LAB_PROTOCOL,
    lab_id: typeof record?.lab_id === "string" ? record.lab_id : null,
    mode: record?.mode === "SYNTHETIC_OFFLINE_EXACT" ? record.mode : null,
    valid: issues.length === 0,
    input_digest: inputDigest,
    checks,
    invariants,
    local_findings: {
      bad_vertices: badVertices,
      branch_edges: branchEdges,
      faceless_edges: facelessEdges,
    },
    issues,
    effects,
  };
}

export function evaluateStringCrawlStrandLab(value: unknown): StringCrawlStrandValidation {
  return makeValidation(value);
}

export function loadStringCrawlStrandLab(path = STRING_CRAWL_STRAND_LAB_PATH): JsonRecord {
  const { bytes, value } = readStrictJson(path);
  const issues = verifyStringCrawlStrandLab(value);
  if (issues.length > 0) throw new Error(`STRAND Lab 02 fixture failed validation: ${JSON.stringify(issues)}`);
  if (resolve(path) === resolve(STRING_CRAWL_STRAND_LAB_PATH)) {
    if (STRING_CRAWL_STRAND_LAB_BYTE_SHA256 !== `sha256:${"0".repeat(64)}` && sha256Bytes(bytes) !== STRING_CRAWL_STRAND_LAB_BYTE_SHA256) {
      throw new Error("STRAND Lab 02 fixture raw-byte digest mismatch");
    }
    const sourceBytes = readStrictBytes(STRING_CRAWL_TRACE_SHEET_PATH, "bound STRING / CRAWL Trace-Sheet");
    if (sha256Bytes(sourceBytes) !== STRING_CRAWL_TRACE_SHEET_BYTE_SHA256) throw new Error("bound STRING / CRAWL Trace-Sheet bytes drifted");
    if (sha256Bytes(readStrictBytes(STRING_CRAWL_TRACE_SHEET_LAB_PATH, "bound STRING / CRAWL Lab 01 record")) !== STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256 ||
        sha256Bytes(readStrictBytes(STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_PATH, "bound STRING / CRAWL Lab 01 schema")) !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256 ||
        sha256Bytes(readStrictBytes(STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_PATH, "bound STRING / CRAWL Lab 01 guide")) !== STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256) {
      throw new Error("bound STRING / CRAWL Lab 01 bytes drifted");
    }
    if (STRING_CRAWL_STRAND_LAB_SCHEMA_BYTE_SHA256 !== `sha256:${"0".repeat(64)}` &&
        sha256Bytes(readStrictBytes(STRING_CRAWL_STRAND_LAB_SCHEMA_PATH, "STRAND Lab 02 fixture schema")) !== STRING_CRAWL_STRAND_LAB_SCHEMA_BYTE_SHA256) {
      throw new Error("STRAND Lab 02 fixture schema bytes drifted");
    }
    if (STRING_CRAWL_STRAND_LAB_GUIDE_BYTE_SHA256 !== `sha256:${"0".repeat(64)}` &&
        sha256Bytes(readStrictBytes(STRING_CRAWL_STRAND_LAB_GUIDE_PATH, "STRAND Lab 02 guide")) !== STRING_CRAWL_STRAND_LAB_GUIDE_BYTE_SHA256) {
      throw new Error("STRAND Lab 02 guide bytes drifted");
    }
  }
  return structuredClone(value) as JsonRecord;
}

export function stringCrawlStrandLabPublicDiscovery(value = loadStringCrawlStrandLab()): Record<string, unknown> {
  const validation = evaluateStringCrawlStrandLab(value);
  if (!validation.valid) throw new Error("cannot project an invalid STRAND Lab 02 fixture");
  return {
    protocol: value.protocol,
    lab_id: value.lab_id,
    title: value.title,
    mode: value.mode,
    url: STRING_CRAWL_STRAND_LAB_URL,
    schema_url: STRING_CRAWL_STRAND_LAB_SCHEMA_URL,
    guide_url: STRING_CRAWL_STRAND_LAB_GUIDE_URL,
    predecessor: {
      lab_id: value.predecessor.lab_id,
      url: value.predecessor.url,
      schema_url: value.predecessor.schema_url,
      guide_url: value.predecessor.guide_url,
      semantic_digest: value.predecessor.semantic_digest,
      byte_sha256: value.predecessor.byte_sha256,
      schema_byte_sha256: value.predecessor.schema_byte_sha256,
      guide_byte_sha256: value.predecessor.guide_byte_sha256,
      relation: value.predecessor.relation,
      mutates_predecessor: false,
      imports_authority: false,
    },
    source_binding: {
      project_id: value.source_binding.project_id,
      semantic_digest: value.source_binding.semantic_digest,
      raw_sha256: value.source_binding.raw_sha256,
      mutates_source: false,
      imports_authority: false,
    },
    counts: {
      releases: value.release_slices.length,
      stable_threads: value.tracked_routes.filter((route: JsonRecord) => route.thread === "stable").length,
      born_threads: value.tracked_routes.filter((route: JsonRecord) => route.thread === "born").length,
      vertices: value.vertices.length,
      edges: value.edges.length,
      faces: value.faces.length,
      cospans: value.cospans.length,
    },
    validation: {
      protocol: validation.protocol,
      valid: validation.valid,
      checks: validation.checks,
      invariants: validation.invariants,
      local_findings: validation.local_findings,
    },
    boundaries: value.boundaries,
    effects: validation.effects,
    integrity: { semantic_digest: value.integrity.digest },
  };
}

function usage(): string {
  return [
    "Usage: ./kingdom string-crawl-strand-lab [view] [--json]",
    "       ./kingdom string-crawl-strand-lab verify-file <fixture.json> [--json]",
    "",
    "Views: overview | topology | composition | effects | discovery | verify | verify-file",
    "",
    "Synthetic, offline, deterministic, and stdout-only. It performs no crawl or KARMA action.",
  ].join("\n");
}

function output(value: unknown, json: boolean): void {
  if (!json && typeof value === "string") process.stdout.write(value.endsWith("\n") ? value : `${value}\n`);
  else process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function runStringCrawlStrandLabCli(argv = process.argv.slice(2)): number {
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
      const validation = evaluateStringCrawlStrandLab(value);
      output(validation, true);
      return validation.valid ? 0 : 1;
    }
    if (positional.length !== 1) { console.error(usage()); return 2; }
    const fixture = loadStringCrawlStrandLab();
    const validation = evaluateStringCrawlStrandLab(fixture);
    if (command === "verify") { output(validation, true); return validation.valid ? 0 : 1; }
    const views: Record<string, () => unknown> = Object.create(null);
    views.overview = () => json ? stringCrawlStrandLabPublicDiscovery(fixture) : [
      fixture.title,
      "",
      "A stable strip and a branched full complex both report chi=1 and Betti (1,0,0).",
      "Local incidence catches the three-face branch and face-less redirect spur that global invariants miss.",
      "",
      "Synthetic fixture only: zero network requests, writes, NEN invocations, receipts, events, scores, or authority.",
    ].join("\n");
    views.topology = () => ({ invariants: validation.invariants, local_findings: validation.local_findings, subcomplexes: fixture.subcomplexes });
    views.composition = () => ({ frontiers: fixture.frontiers, cospans: fixture.cospans, checks: fixture.composition_checks });
    views.effects = () => ({ validation_contract: fixture.validation_contract, boundaries: fixture.boundaries, evaluated: validation.effects });
    views.discovery = () => stringCrawlStrandLabPublicDiscovery(fixture);
    if (!Object.hasOwn(views, command)) { console.error(usage()); return 2; }
    output(views[command]!(), json);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    output({ valid: false, error: message, effects: { network_requests: 0, storage_writes: 0, nen_invocation: false, karma_receipt_created: false, zerone_event_created: false, authority_effect: "NONE" } }, true);
    return command === "verify" || command === "verify-file" ? 1 : 2;
  }
}

if (import.meta.main) process.exitCode = runStringCrawlStrandLabCli();
