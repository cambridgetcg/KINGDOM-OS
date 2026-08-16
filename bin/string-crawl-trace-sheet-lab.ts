#!/usr/bin/env bun
/** Exact, deterministic, offline evaluator for one synthetic Trace-Sheet fixture. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MAX_FILE_BYTES = 64 * 1024;
const MAX_DEPTH = 16;
const MAX_CELLS = 256;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const STRING_CRAWL_TRACE_SHEET_LAB_PROTOCOL = "kingdom.string-crawl-trace-sheet-lab/0.1";
export const STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_ID = "https://thekingdom.dev/schemas/string-crawl-trace-sheet-lab/0.1.json";
export const STRING_CRAWL_TRACE_SHEET_LAB_ID = "string-crawl-trace-sheet-lab-2026-08-16";
export const STRING_CRAWL_TRACE_SHEET_LAB_LOCATOR = "data/exploration/string-crawl-trace-lab.v0.1.json";
export const STRING_CRAWL_TRACE_SHEET_LAB_PATH = join(ROOT, STRING_CRAWL_TRACE_SHEET_LAB_LOCATOR);
export const STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_LOCATOR = "schemas/string-crawl-trace-sheet-lab-v0.1.schema.json";
export const STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_PATH = join(ROOT, STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_LOCATOR);
export const STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_LOCATOR = "references/string-crawl-trace-sheet-lab.md";
export const STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_PATH = join(ROOT, STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_LOCATOR);
export const STRING_CRAWL_TRACE_SHEET_LAB_URL = "https://thekingdom.dev/labs/string-crawl-trace-sheet-lab-2026-08-16.json";
export const STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL = "https://thekingdom.dev/schemas/string-crawl-trace-sheet-lab/0.1.json";
export const STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL = "https://thekingdom.dev/STRING-CRAWL-TRACE-SHEET-LAB.md";
export const STRING_CRAWL_TRACE_SHEET_LAB_DIGEST = "sha256:c3f86b0203b895da56092c598113046f0dab8a4f25b41314c3d4329474d4e16f";
export const STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256 = "sha256:2e559164df6985776a4641b60c846a0403f14df30c84648b72c095642df6e051";
export const STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256 = "sha256:c4e69a61994831574fe706d464852b164c65b6d177c5680dc9b0278bcb446268";
export const STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256 = "sha256:5f5fb893a31d1c7e02aca63401c002ae601bee6653d41adc6617bb909732e8e3";
export const STRING_CRAWL_TRACE_SHEET_PREDECESSOR_BYTE_SHA256 = "sha256:4afc5f15c258a0ac4274889783bd2d91445950c92103c60442ed9ed89d1fdc72";

type AnyRecord = Record<string, any>;
export type TraceLabIssue = { path: string; code: string };

export type TraceLabReport = {
  vertices: number;
  edges: number;
  faces: number;
  walks: number;
  walk_steps: number;
  rank_boundary_1: number;
  rank_boundary_2: number;
  betti_0: number;
  betti_1: number;
  betti_2: number;
  connected_components: number;
  graph_cycle_rank: number;
  surface_euler_characteristic: number;
  boundary_edge_ids: string[];
  interior_edge_ids: string[];
  branch_edge_ids: string[];
  boundary_components: number;
  vertex_links: Record<string, "PATH" | "CYCLE" | "OTHER">;
  pure_2d: boolean;
  surface_eligible: boolean;
  orientable: boolean;
  surface_genus: number | null;
  chain_boundary_defects: number;
  euler_poincare_holds: boolean;
  classification: "TRIANGULATED_DISK" | "SURFACE_WITH_BOUNDARY" | "CLOSED_SURFACE" | "FINITE_TWO_COMPLEX";
};

const TOP_KEYS = [
  "$schema", "protocol", "lab_id", "version", "title", "compiled_on", "mode",
  "predecessor", "sources", "scope", "fixture", "expected", "falsifiers",
  "nonclaims", "rights", "karma", "authority", "release", "integrity",
] as const;

const REPORT_KEYS = [
  "vertices", "edges", "faces", "walks", "walk_steps", "rank_boundary_1",
  "rank_boundary_2", "betti_0", "betti_1", "betti_2", "connected_components",
  "graph_cycle_rank", "surface_euler_characteristic", "boundary_edge_ids",
  "interior_edge_ids", "branch_edge_ids", "boundary_components", "vertex_links",
  "pure_2d", "surface_eligible", "orientable", "surface_genus",
  "chain_boundary_defects", "euler_poincare_holds", "classification",
] as const;

const AUTHORITY_KEYS = [
  "crawl", "network", "authentication", "authorization", "licence", "consent",
  "nen_invocation", "karma_write", "reward", "governance", "deployment", "automatic_action",
] as const;

const SOURCE_ROLES = new Set([
  "IMMUTABLE_PREDECESSOR", "FINITE_COMPLEX_REFERENCE", "LOSSY_WORLDSHEET_LENS_ONLY",
]);

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function object(value: unknown): value is AnyRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype && Object.getOwnPropertySymbols(value).length === 0;
}

function exactKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}

function strictTree(value: unknown, depth = 0, seen = new WeakSet<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isSafeInteger(value);
  if (typeof value !== "object" || depth > MAX_DEPTH || seen.has(value)) return false;
  const isArray = Array.isArray(value);
  if (!isArray && !object(value)) return false;
  if (isArray && Object.getPrototypeOf(value) !== Array.prototype) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  seen.add(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (isArray && key === "length") continue;
    if (FORBIDDEN_KEYS.has(key) || !("value" in descriptor) || !descriptor.enumerable ||
      !strictTree(descriptor.value, depth + 1, seen)) return false;
  }
  seen.delete(value);
  return true;
}

function id(value: unknown): value is string {
  return typeof value === "string" && value.length <= 120 && ID.test(value);
}

function safeText(value: unknown, maximum = 4000): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximum && value.trim() === value &&
    !/[\u0000-\u001f\u007f]/u.test(value);
}

function httpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048 || !value.startsWith("https://")) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname.length > 0 && parsed.username === "" && parsed.password === "";
  } catch {
    return false;
  }
}

function add(issues: TraceLabIssue[], path: string, code: string): void {
  if (!issues.some((issue) => issue.path === path && issue.code === code)) issues.push({ path, code });
}

function canonicalEqual(left: unknown, right: unknown): boolean {
  try { return canonicalizeJsonValue(left) === canonicalizeJsonValue(right); } catch { return false; }
}

function sha256Bytes(bytes: Uint8Array): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function cloneJson<T>(value: T): T {
  if (!strictTree(value)) throw new Error("unsafe-json-tree");
  return structuredClone(value);
}

export function stringCrawlTraceSheetLabDigest(value: unknown): string {
  const material = cloneJson(value) as AnyRecord;
  if (!object(material.integrity)) throw new Error("integrity envelope missing");
  material.integrity.digest = null;
  return sha256Bytes(Buffer.from(canonicalizeJsonValue(material)));
}

function readStrictJson(path: string, label: string): { value: unknown; digest: string } {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { throw new Error(`${label} is unavailable`); }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular non-symlink file`);
  if (stat.size > MAX_FILE_BYTES) throw new Error(`${label} exceeds ${MAX_FILE_BYTES} bytes`);
  const bytes = readFileSync(absolute);
  return { value: parseStrictJsonBytes(bytes, label), digest: sha256Bytes(bytes) };
}

function fileDigest(path: string, label: string, maximum = MAX_FILE_BYTES): string {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { throw new Error(`${label} is unavailable`); }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular non-symlink file`);
  if (stat.size > maximum) throw new Error(`${label} exceeds ${maximum} bytes`);
  return sha256Bytes(readFileSync(absolute));
}

function uniqueIds(items: unknown, key = "id"): Set<string> | null {
  if (!Array.isArray(items)) return null;
  const values = items.map((item) => object(item) ? item[key] : null);
  if (!values.every(id) || new Set(values).size !== values.length) return null;
  return new Set(values as string[]);
}

function connectedComponents(vertices: string[], edgePairs: Array<[string, string]>): number {
  const adjacent = new Map(vertices.map((vertex) => [vertex, new Set<string>()]));
  for (const [left, right] of edgePairs) {
    adjacent.get(left)?.add(right);
    adjacent.get(right)?.add(left);
  }
  let components = 0;
  const seen = new Set<string>();
  for (const vertex of vertices) {
    if (seen.has(vertex)) continue;
    components += 1;
    const pending = [vertex];
    seen.add(vertex);
    while (pending.length > 0) {
      const current = pending.pop()!;
      for (const next of adjacent.get(current) ?? []) {
        if (!seen.has(next)) { seen.add(next); pending.push(next); }
      }
    }
  }
  return components;
}

type Fraction = { n: bigint; d: bigint };
function gcd(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a === 0n ? 1n : a;
}
function fraction(n: bigint, d = 1n): Fraction {
  if (d === 0n) throw new Error("zero denominator");
  if (d < 0n) { n = -n; d = -d; }
  const divisor = gcd(n, d);
  return { n: n / divisor, d: d / divisor };
}
function sub(left: Fraction, right: Fraction): Fraction {
  return fraction(left.n * right.d - right.n * left.d, left.d * right.d);
}
function mul(left: Fraction, right: Fraction): Fraction {
  return fraction(left.n * right.n, left.d * right.d);
}
function div(left: Fraction, right: Fraction): Fraction {
  return fraction(left.n * right.d, left.d * right.n);
}
function matrixRank(matrix: number[][]): number {
  if (matrix.length === 0) return 0;
  const columns = Math.max(0, ...matrix.map((row) => row.length));
  if (columns === 0) return 0;
  const value = matrix.map((row) => Array.from({ length: columns }, (_, index) => fraction(BigInt(row[index] ?? 0))));
  let rank = 0;
  for (let column = 0; column < value[0]!.length && rank < value.length; column += 1) {
    const pivot = value.findIndex((row, index) => index >= rank && row[column]!.n !== 0n);
    if (pivot < 0) continue;
    [value[rank], value[pivot]] = [value[pivot]!, value[rank]!];
    const pivotValue = value[rank]![column]!;
    for (let index = rank + 1; index < value.length; index += 1) {
      if (value[index]![column]!.n === 0n) continue;
      const factor = div(value[index]![column]!, pivotValue);
      for (let current = column; current < value[index]!.length; current += 1) {
        value[index]![current] = sub(value[index]![current]!, mul(factor, value[rank]![current]!));
      }
    }
    rank += 1;
  }
  return rank;
}

function multiply(left: number[][], right: number[][]): number[][] {
  if (left.length === 0 || right.length === 0) return [];
  return left.map((row) => Array.from({ length: right[0]!.length }, (_, column) =>
    row.reduce((sum, value, index) => sum + value * right[index]![column]!, 0)));
}

function linkKind(nodes: Set<string>, edges: Array<[string, string]>): "PATH" | "CYCLE" | "OTHER" {
  if (nodes.size === 0 || edges.length === 0) return "OTHER";
  const degrees = new Map([...nodes].map((node) => [node, 0]));
  const adjacent = new Map([...nodes].map((node) => [node, new Set<string>()]));
  for (const [left, right] of edges) {
    if (left === right) return "OTHER";
    degrees.set(left, (degrees.get(left) ?? 0) + 1);
    degrees.set(right, (degrees.get(right) ?? 0) + 1);
    adjacent.get(left)?.add(right);
    adjacent.get(right)?.add(left);
  }
  const start = nodes.values().next().value as string;
  const seen = new Set([start]);
  const pending = [start];
  while (pending.length > 0) {
    for (const next of adjacent.get(pending.pop()!) ?? []) {
      if (!seen.has(next)) { seen.add(next); pending.push(next); }
    }
  }
  if (seen.size !== nodes.size) return "OTHER";
  const values = [...degrees.values()];
  if (values.every((degree) => degree === 2)) return "CYCLE";
  if (values.filter((degree) => degree === 1).length === 2 && values.every((degree) => degree === 1 || degree === 2)) return "PATH";
  return "OTHER";
}

function analyzeFixture(fixture: AnyRecord): { report: TraceLabReport; issues: TraceLabIssue[] } {
  const issues: TraceLabIssue[] = [];
  const slices = Array.isArray(fixture.slices) ? fixture.slices : [];
  const vertices = Array.isArray(fixture.vertices) ? fixture.vertices : [];
  const edges = Array.isArray(fixture.edges) ? fixture.edges : [];
  const faces = Array.isArray(fixture.faces) ? fixture.faces : [];
  const walks = Array.isArray(fixture.walks) ? fixture.walks : [];
  const vertexIds = uniqueIds(vertices) ?? new Set<string>();
  const edgeIds = uniqueIds(edges) ?? new Set<string>();
  const faceIds = uniqueIds(faces) ?? new Set<string>();
  const sliceIds = uniqueIds(slices) ?? new Set<string>();
  const walkIds = uniqueIds(walks) ?? new Set<string>();
  const vertexMap = new Map(vertices.filter(object).map((entry) => [entry.id, entry]));
  const edgeMap = new Map(edges.filter(object).map((entry) => [entry.id, entry]));

  if (vertexIds.size !== vertices.length || edgeIds.size !== edges.length || faceIds.size !== faces.length ||
    sliceIds.size !== slices.length || walkIds.size !== walks.length) {
    add(issues, "$.fixture", "cell-reference-invalid");
  }

  const sliceOrders = new Set<number>();
  for (const [index, slice] of slices.entries()) {
    if (!exactKeys(slice, ["id", "order"]) || !id(slice?.id) || !Number.isSafeInteger(slice?.order) ||
      slice.order < 0 || slice.order > 15) {
      add(issues, `$.fixture.slices[${index}]`, "cell-reference-invalid");
      continue;
    }
    if (sliceOrders.has(slice.order) || slice.order !== index) {
      add(issues, `$.fixture.slices[${index}].order`, "slice-order-invalid");
    }
    sliceOrders.add(slice.order);
  }

  const occurrenceKeys = new Set<string>();
  for (const [index, vertex] of vertices.entries()) {
    if (!exactKeys(vertex, ["id", "slice_id", "occurrence", "route_label"]) || !id(vertex?.id) ||
      !sliceIds.has(vertex?.slice_id) || !Number.isSafeInteger(vertex?.occurrence) || vertex.occurrence < 0 ||
      !id(vertex?.route_label)) {
      add(issues, `$.fixture.vertices[${index}]`, "cell-reference-invalid");
      continue;
    }
    const occurrenceKey = `${vertex.slice_id}\0${vertex.occurrence}`;
    if (occurrenceKeys.has(occurrenceKey)) add(issues, `$.fixture.vertices[${index}]`, "duplicate-occurrence");
    occurrenceKeys.add(occurrenceKey);
  }

  const edgePairs: Array<[string, string]> = [];
  for (const [index, edge] of edges.entries()) {
    if (!exactKeys(edge, ["id", "source", "target", "kind"]) || !id(edge?.id) ||
      !vertexIds.has(edge?.source) || !vertexIds.has(edge?.target) || edge.source === edge.target ||
      !["PATH", "CORRESPONDENCE", "DIAGONAL"].includes(edge?.kind)) {
      add(issues, `$.fixture.edges[${index}]`, "cell-reference-invalid");
      continue;
    }
    edgePairs.push([edge.source, edge.target]);
  }

  let walkSteps = 0;
  for (const [index, walk] of walks.entries()) {
    if (!exactKeys(walk, ["id", "slice_id", "vertex_ids", "edge_ids"]) || !id(walk?.id) ||
      !sliceIds.has(walk?.slice_id) || !Array.isArray(walk?.vertex_ids) || !Array.isArray(walk?.edge_ids) ||
      walk.vertex_ids.length !== walk.edge_ids.length + 1 || walk.vertex_ids.length < 2) {
      add(issues, `$.fixture.walks[${index}]`, "walk-shape-invalid");
      continue;
    }
    walkSteps += walk.edge_ids.length;
    for (let step = 0; step < walk.edge_ids.length; step += 1) {
      const edge = edgeMap.get(walk.edge_ids[step]);
      const source = vertexMap.get(walk.vertex_ids[step]);
      const target = vertexMap.get(walk.vertex_ids[step + 1]);
      if (!edge || edge.kind !== "PATH" || edge.source !== source?.id || edge.target !== target?.id) {
        add(issues, `$.fixture.walks[${index}].edge_ids[${step}]`, "walk-edge-endpoint-mismatch");
      }
      if (source?.slice_id !== walk.slice_id || target?.slice_id !== walk.slice_id ||
        source?.occurrence + 1 !== target?.occurrence) {
        add(issues, `$.fixture.walks[${index}]`, "walk-occurrence-order-invalid");
      }
    }
  }

  const vertexOrder = [...vertexIds];
  const edgeOrder = [...edgeIds];
  const faceOrder = [...faceIds];
  const vertexIndex = new Map(vertexOrder.map((entry, index) => [entry, index]));
  const edgeIndex = new Map(edgeOrder.map((entry, index) => [entry, index]));
  const boundary1 = Array.from({ length: vertexOrder.length }, () => Array(edgeOrder.length).fill(0));
  for (const [column, edgeId] of edgeOrder.entries()) {
    const edge = edgeMap.get(edgeId);
    if (!edge || !vertexIndex.has(edge.source) || !vertexIndex.has(edge.target)) continue;
    boundary1[vertexIndex.get(edge.source)!]![column] = -1;
    boundary1[vertexIndex.get(edge.target)!]![column] = 1;
  }
  const boundary2 = Array.from({ length: edgeOrder.length }, () => Array(faceOrder.length).fill(0));
  const faceVertices = new Map<string, string[]>();
  const edgeFaceEntries = new Map(edgeOrder.map((edgeId) => [edgeId, [] as Array<{ face: string; sign: number }>]));
  for (const [faceColumn, face] of faces.entries()) {
    if (!exactKeys(face, ["id", "boundary"]) || !id(face?.id) || !Array.isArray(face?.boundary) || face.boundary.length !== 3) {
      add(issues, `$.fixture.faces[${faceColumn}]`, "attaching-map-invalid");
      continue;
    }
    const starts: string[] = [];
    const ends: string[] = [];
    const used = new Set<string>();
    for (const [entryIndex, entry] of face.boundary.entries()) {
      const edge = object(entry) ? edgeMap.get(entry.edge_id) : undefined;
      if (!exactKeys(entry, ["edge_id", "sign"]) || !edge || ![1, -1].includes(entry.sign) || used.has(entry.edge_id)) {
        add(issues, `$.fixture.faces[${faceColumn}].boundary[${entryIndex}]`, "attaching-map-invalid");
        continue;
      }
      used.add(entry.edge_id);
      const start = entry.sign === 1 ? edge.source : edge.target;
      const end = entry.sign === 1 ? edge.target : edge.source;
      const boundaryRow = edgeIndex.get(entry.edge_id);
      if (boundaryRow === undefined || !boundary2[boundaryRow]) {
        add(issues, `$.fixture.faces[${faceColumn}].boundary[${entryIndex}]`, "cell-reference-invalid");
        continue;
      }
      starts.push(start);
      ends.push(end);
      boundary2[boundaryRow]![faceColumn] = entry.sign;
      edgeFaceEntries.get(entry.edge_id)?.push({ face: face.id, sign: entry.sign });
    }
    const cyclic = starts.length === 3 && new Set(starts).size === 3 &&
      ends.every((end, index) => end === starts[(index + 1) % starts.length]);
    if (!cyclic) add(issues, `$.fixture.faces[${faceColumn}]`, "face-boundary-not-cyclic");
    else faceVertices.set(face.id, starts);
  }

  const chainSquare = multiply(boundary1, boundary2);
  const chainBoundaryDefects = chainSquare.flat().filter((entry) => entry !== 0).length;
  if (chainBoundaryDefects > 0) add(issues, "$.fixture.faces", "chain-square-nonzero");

  const incidence = new Map([...edgeFaceEntries].map(([edgeId, entries]) => [edgeId, entries.length]));
  const boundaryEdgeIds = [...incidence].filter(([, count]) => count === 1).map(([edgeId]) => edgeId).sort();
  const interiorEdgeIds = [...incidence].filter(([, count]) => count === 2).map(([edgeId]) => edgeId).sort();
  const branchEdgeIds = [...incidence].filter(([, count]) => count > 2).map(([edgeId]) => edgeId).sort();
  if (branchEdgeIds.length > 0) add(issues, "$.fixture.faces", "edge-face-incidence-over-two");
  if ([...incidence.values()].some((count) => count === 0)) add(issues, "$.fixture.edges", "non-pure-edge");

  const incidentVertices = new Set([...faceVertices.values()].flat());
  const pure2d = faceVertices.size === faces.length && incidence.size === edges.length &&
    [...incidence.values()].every((count) => count > 0) && incidentVertices.size === vertices.length;

  const boundaryVertexIds = new Set<string>();
  const boundaryPairs: Array<[string, string]> = [];
  for (const edgeId of boundaryEdgeIds) {
    const edge = edgeMap.get(edgeId);
    if (!edge) continue;
    boundaryVertexIds.add(edge.source);
    boundaryVertexIds.add(edge.target);
    boundaryPairs.push([edge.source, edge.target]);
  }
  const vertexLinks: Record<string, "PATH" | "CYCLE" | "OTHER"> = Object.create(null);
  for (const vertexId of [...vertexIds].sort()) {
    const nodes = new Set<string>();
    const linkEdges: Array<[string, string]> = [];
    for (const verticesForFace of faceVertices.values()) {
      if (!verticesForFace.includes(vertexId)) continue;
      const others = verticesForFace.filter((entry) => entry !== vertexId);
      if (others.length === 2) {
        nodes.add(others[0]!); nodes.add(others[1]!);
        linkEdges.push([others[0]!, others[1]!]);
      }
    }
    vertexLinks[vertexId] = linkKind(nodes, linkEdges);
  }
  const linksEligible = [...vertexIds].every((vertexId) =>
    vertexLinks[vertexId] === (boundaryVertexIds.has(vertexId) ? "PATH" : "CYCLE"));
  if (!linksEligible) add(issues, "$.fixture.vertices", "vertex-link-not-manifold");

  const components = connectedComponents(vertexOrder, edgePairs);
  const boundaryComponents = boundaryVertexIds.size === 0 ? 0 : connectedComponents([...boundaryVertexIds], boundaryPairs);
  const boundaryDegrees = new Map([...boundaryVertexIds].map((vertex) => [vertex, 0]));
  for (const [left, right] of boundaryPairs) {
    boundaryDegrees.set(left, (boundaryDegrees.get(left) ?? 0) + 1);
    boundaryDegrees.set(right, (boundaryDegrees.get(right) ?? 0) + 1);
  }
  const boundaryIsManifold = [...boundaryDegrees.values()].every((degree) => degree === 2);

  let orientationConsistent = true;
  const orientations = new Map<string, number>();
  const faceNeighbors = new Map(faceOrder.map((faceId) => [faceId, [] as Array<{ face: string; relation: number }>]));
  for (const entries of edgeFaceEntries.values()) {
    if (entries.length !== 2) continue;
    const [left, right] = entries;
    const relation = -left!.sign * right!.sign;
    faceNeighbors.get(left!.face)?.push({ face: right!.face, relation });
    faceNeighbors.get(right!.face)?.push({ face: left!.face, relation });
  }
  for (const faceId of faceOrder) {
    if (orientations.has(faceId)) continue;
    orientations.set(faceId, 1);
    const pending = [faceId];
    while (pending.length > 0) {
      const current = pending.pop()!;
      for (const neighbor of faceNeighbors.get(current) ?? []) {
        const expected = orientations.get(current)! * neighbor.relation;
        if (!orientations.has(neighbor.face)) { orientations.set(neighbor.face, expected); pending.push(neighbor.face); }
        else if (orientations.get(neighbor.face) !== expected) orientationConsistent = false;
      }
    }
  }

  const rankBoundary1 = matrixRank(boundary1);
  const rankBoundary2 = matrixRank(boundary2);
  const betti0 = vertices.length - rankBoundary1;
  const betti1 = edges.length - rankBoundary1 - rankBoundary2;
  const betti2 = faces.length - rankBoundary2;
  const euler = vertices.length - edges.length + faces.length;
  const eulerPoincare = chainBoundaryDefects === 0 && euler === betti0 - betti1 + betti2;
  const surfaceEligible = pure2d && branchEdgeIds.length === 0 &&
    [...incidence.values()].every((count) => count === 1 || count === 2) && linksEligible &&
    boundaryIsManifold && chainBoundaryDefects === 0;
  const orientable = surfaceEligible && orientationConsistent;
  const genusValue = components === 1 && surfaceEligible && orientable
    ? (2 - boundaryComponents - euler) / 2
    : null;
  const surfaceGenus = genusValue !== null && Number.isInteger(genusValue) && genusValue >= 0 ? genusValue : null;
  if (components === 1 && surfaceEligible && orientable && surfaceGenus === null) {
    add(issues, "$.fixture", "topology-classification-drift");
  }

  const classification: TraceLabReport["classification"] = surfaceEligible && surfaceGenus === 0 && boundaryComponents === 1 && euler === 1
    ? "TRIANGULATED_DISK"
    : surfaceEligible && boundaryComponents > 0
      ? "SURFACE_WITH_BOUNDARY"
      : surfaceEligible
        ? "CLOSED_SURFACE"
        : "FINITE_TWO_COMPLEX";

  return {
    report: {
      vertices: vertices.length,
      edges: edges.length,
      faces: faces.length,
      walks: walks.length,
      walk_steps: walkSteps,
      rank_boundary_1: rankBoundary1,
      rank_boundary_2: rankBoundary2,
      betti_0: betti0,
      betti_1: betti1,
      betti_2: betti2,
      connected_components: components,
      graph_cycle_rank: edges.length - vertices.length + components,
      surface_euler_characteristic: euler,
      boundary_edge_ids: boundaryEdgeIds,
      interior_edge_ids: interiorEdgeIds,
      branch_edge_ids: branchEdgeIds,
      boundary_components: boundaryComponents,
      vertex_links: vertexLinks,
      pure_2d: pure2d,
      surface_eligible: surfaceEligible,
      orientable,
      surface_genus: surfaceGenus,
      chain_boundary_defects: chainBoundaryDefects,
      euler_poincare_holds: eulerPoincare,
      classification,
    },
    issues,
  };
}

function shapeIssues(value: AnyRecord): TraceLabIssue[] {
  const issues: TraceLabIssue[] = [];
  if (!exactKeys(value, TOP_KEYS)) add(issues, "$", "closed-shape-drift");
  if (value.$schema !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_ID || value.protocol !== STRING_CRAWL_TRACE_SHEET_LAB_PROTOCOL ||
    value.lab_id !== STRING_CRAWL_TRACE_SHEET_LAB_ID || value.version !== "0.1.0" ||
    value.title !== "STRING / CRAWL: Finite Trace-Sheet Lab" || value.compiled_on !== "2026-08-16" ||
    value.mode !== "OFFLINE_SYNTHETIC_EXACT") add(issues, "$", "lab-identity-drift");
  if (!exactKeys(value.predecessor, ["protocol", "project_id", "url", "semantic_digest", "byte_sha256", "relation"]) ||
    value.predecessor?.protocol !== "kingdom.explore-phenomena-deep-project/0.1" ||
    value.predecessor?.project_id !== "string-crawl-trace-sheet-2026-08-15" ||
    value.predecessor?.url !== "https://thekingdom.dev/atlases/string-crawl-trace-sheet-2026-08-15.json" ||
    value.predecessor?.semantic_digest !== "sha256:bf7ae379612ab96d08742a0070cbea0ce971977f71fec22699c4b0307d321305" ||
    value.predecessor?.byte_sha256 !== STRING_CRAWL_TRACE_SHEET_PREDECESSOR_BYTE_SHA256 ||
    value.predecessor?.relation !== "ADDITIVE_EXECUTABLE_BASELINE") add(issues, "$.predecessor", "lab-identity-drift");
  if (!Array.isArray(value.sources) || value.sources.length !== 3 || value.sources.some((source: unknown) =>
    !exactKeys(source, ["id", "title", "url", "role"]) || !id((source as AnyRecord)?.id) ||
    !safeText((source as AnyRecord)?.title) || !SOURCE_ROLES.has((source as AnyRecord)?.role) ||
    !httpsUrl((source as AnyRecord)?.url)) ||
    uniqueIds(value.sources) === null) add(issues, "$.sources", "source-shape-invalid");
  if (!exactKeys(value.scope, ["fixture_kind", "coefficient_field", "local_file_read", "bounded_local_compute", "network_request", "crawler", "live_observation", "external_input", "credential_input", "personal_data", "telemetry", "filesystem_write", "external_effect"]) ||
    value.scope?.fixture_kind !== "SYNTHETIC_DECLARED_DATA" || value.scope?.coefficient_field !== "Q" ||
    value.scope?.local_file_read !== true || value.scope?.bounded_local_compute !== true ||
    Object.entries(value.scope ?? {}).some(([key, entry]) => !["fixture_kind", "coefficient_field", "local_file_read", "bounded_local_compute"].includes(key) && entry !== false)) {
    add(issues, "$.scope", "synthetic-boundary-drift");
  }
  if (!exactKeys(value.fixture, ["fixture_id", "statement", "slices", "vertices", "edges", "walks", "faces"]) ||
    value.fixture?.fixture_id !== "rectangle-strip-0-1" || !safeText(value.fixture?.statement) ||
    !Array.isArray(value.fixture?.slices) || !Array.isArray(value.fixture?.vertices) ||
    !Array.isArray(value.fixture?.edges) || !Array.isArray(value.fixture?.walks) || !Array.isArray(value.fixture?.faces)) {
    add(issues, "$.fixture", "fixture-shape-invalid");
  }
  if (!exactKeys(value.expected, REPORT_KEYS)) add(issues, "$.expected", "expected-shape-invalid");
  if (!Array.isArray(value.falsifiers) || value.falsifiers.length !== 5 || uniqueIds(value.falsifiers) === null || value.falsifiers.some((entry: unknown) =>
    !exactKeys(entry, ["id", "kind", "target", "mutation", "expected_outcome", "expected_issue_codes", "status"]) ||
    !["CONFORMANCE", "COUNTEREXAMPLE", "ROBUSTNESS"].includes((entry as AnyRecord)?.kind) ||
    !safeText((entry as AnyRecord)?.target) || !safeText((entry as AnyRecord)?.mutation) ||
    !["REJECT", "NON_SURFACE"].includes((entry as AnyRecord)?.expected_outcome) ||
    !Array.isArray((entry as AnyRecord)?.expected_issue_codes) || (entry as AnyRecord).expected_issue_codes.length < 1 ||
    (entry as AnyRecord).expected_issue_codes.length > 8 ||
    new Set((entry as AnyRecord).expected_issue_codes).size !== (entry as AnyRecord).expected_issue_codes.length ||
    (entry as AnyRecord).expected_issue_codes.some((code: unknown) => !id(code)) ||
    (entry as AnyRecord)?.status !== "RUN_REPORTED")) add(issues, "$.falsifiers", "falsifier-shape-invalid");
  if (!Array.isArray(value.nonclaims) || value.nonclaims.length !== 6 ||
    new Set(value.nonclaims).size !== value.nonclaims.length || value.nonclaims.some((entry: unknown) => !safeText(entry))) {
    add(issues, "$.nonclaims", "nonclaim-drift");
  }
  if (!exactKeys(value.rights, ["rest", "silence", "refusal", "privacy", "correction", "no_action", "departure", "reason_required", "penalty"]) ||
    Object.entries(value.rights ?? {}).some(([key, entry]) => ["reason_required", "penalty"].includes(key) ? entry !== false : entry !== "PRESERVED")) {
    add(issues, "$.rights", "rights-regression");
  }
  if (!exactKeys(value.karma, ["cosmic_events", "zerone_events", "kingdom_receipts", "adapter_exists", "conversion_allowed", "summation_allowed", "score", "authority_effect"]) ||
    !Array.isArray(value.karma?.cosmic_events) || value.karma.cosmic_events.length !== 0 ||
    !Array.isArray(value.karma?.zerone_events) || value.karma.zerone_events.length !== 0 ||
    !Array.isArray(value.karma?.kingdom_receipts) || value.karma.kingdom_receipts.length !== 0 ||
    value.karma?.adapter_exists !== false || value.karma?.conversion_allowed !== false ||
    value.karma?.summation_allowed !== false || value.karma?.score !== null || value.karma?.authority_effect !== "NONE") {
    add(issues, "$.karma", "karma-lanes-not-empty");
  }
  if (!exactKeys(value.authority, AUTHORITY_KEYS) || Object.values(value.authority ?? {}).some((entry) => entry !== false)) {
    add(issues, "$.authority", "authority-enabled");
  }
  if (!exactKeys(value.release, ["artifact_publication", "runtime_activation", "crawler_activation", "karma_adapter", "immutable", "supersede_not_mutate", "raw_sha256", "semantic_digest", "ledger_id"]) ||
    value.release?.artifact_publication !== "PUBLISHED" || value.release?.runtime_activation !== "INACTIVE" ||
    value.release?.crawler_activation !== "INACTIVE" || value.release?.karma_adapter !== "ABSENT" ||
    value.release?.immutable !== true || value.release?.supersede_not_mutate !== true || value.release?.raw_sha256 !== null ||
    value.release?.semantic_digest !== null || value.release?.ledger_id !== "string-crawl-trace-sheet-lab/0.1") {
    add(issues, "$.release", "publication-boundary-drift");
  }
  if (!exactKeys(value.integrity, ["algorithm", "digest", "digest_field_treated_as"]) ||
    value.integrity?.algorithm !== "sha256-recursive-sorted-json-keys-v1" || !SHA256.test(value.integrity?.digest ?? "") ||
    value.integrity?.digest_field_treated_as !== null) add(issues, "$.integrity", "integrity-shape-invalid");
  return issues;
}

function expectedIssue(value: AnyRecord, report: TraceLabReport): TraceLabIssue[] {
  return canonicalEqual(value.expected, report) ? [] : [{ path: "$.expected", code: "expected-output-mismatch" }];
}

export function evaluateStringCrawlTraceSheetLab(input: unknown): { report: TraceLabReport | null; issues: TraceLabIssue[] } {
  if (!strictTree(input) || !object(input)) return { report: null, issues: [{ path: "$", code: "unsafe-input" }] };
  const issues = shapeIssues(input);
  if (!object(input.fixture)) return { report: null, issues };
  const cellCount = [input.fixture.vertices, input.fixture.edges, input.fixture.faces]
    .reduce((sum, entries) => sum + (Array.isArray(entries) ? entries.length : 0), 0);
  if (cellCount > MAX_CELLS) {
    add(issues, "$.fixture", "resource-bound-drift");
    return { report: null, issues };
  }
  const evaluated = analyzeFixture(input.fixture);
  return { report: evaluated.report, issues: [...issues, ...evaluated.issues, ...expectedIssue(input, evaluated.report)] };
}

type FalsifierResult = { id: string; outcome: "PASS" | "FAIL"; observed_issue_codes: string[]; surface_eligible: boolean | null };

export function runStringCrawlTraceSheetLabFalsifiers(input: unknown): FalsifierResult[] {
  if (!strictTree(input) || !object(input)) return [];
  const declarations = new Map((Array.isArray(input.falsifiers) ? input.falsifiers : []).filter(object).map((entry) => [entry.id, entry]));
  const mutations: Record<string, (value: AnyRecord) => void> = {
    "face-sign-broken": (value) => { value.fixture.faces[0].boundary[2].sign = 1; },
    "walk-endpoint-broken": (value) => { value.fixture.walks[0].edge_ids[0] = "c0"; },
    "expected-chi-tamper": (value) => { value.expected.surface_euler_characteristic = 2; },
    "duplicate-occurrence": (value) => { value.fixture.vertices[1].occurrence = 0; },
    "branch-edge-over-two": (value) => {
      value.fixture.faces.push({ id: "f2", boundary: cloneJson(value.fixture.faces[0].boundary) });
      value.expected.faces = 3;
    },
  };
  return Object.entries(mutations).map(([falsifierId, mutate]) => {
    try {
      const value = cloneJson(input) as AnyRecord;
      mutate(value);
      if (object(value.integrity)) value.integrity.digest = stringCrawlTraceSheetLabDigest(value);
      const evaluated = evaluateStringCrawlTraceSheetLab(value);
      const observed = [...new Set(evaluated.issues.map((issue) => issue.code))].sort();
      const declaration = declarations.get(falsifierId);
      const expectedCodes = Array.isArray(declaration?.expected_issue_codes) ? declaration.expected_issue_codes : [];
      const requiredFound = expectedCodes.length > 0 && expectedCodes.every((code: string) => observed.includes(code));
      const surfaceExpected = declaration?.expected_outcome === "NON_SURFACE";
      const surfaceMatches = surfaceExpected ? evaluated.report?.surface_eligible === false : true;
      return {
        id: falsifierId,
        outcome: requiredFound && surfaceMatches ? "PASS" : "FAIL",
        observed_issue_codes: observed,
        surface_eligible: evaluated.report?.surface_eligible ?? null,
      };
    } catch {
      return {
        id: falsifierId,
        outcome: "FAIL",
        observed_issue_codes: ["unsafe-input"],
        surface_eligible: null,
      };
    }
  });
}

export function verifyStringCrawlTraceSheetLab(input: unknown, enforcePinnedDigest = true): TraceLabIssue[] {
  const evaluated = evaluateStringCrawlTraceSheetLab(input);
  const issues = [...evaluated.issues];
  if (!object(input)) return issues;
  try {
    const computed = stringCrawlTraceSheetLabDigest(input);
    if (computed !== input.integrity?.digest || (enforcePinnedDigest && computed !== STRING_CRAWL_TRACE_SHEET_LAB_DIGEST)) {
      add(issues, "$.integrity.digest", "semantic-digest-drift");
    }
  } catch {
    add(issues, "$.integrity.digest", "semantic-digest-drift");
  }
  const falsifiers = runStringCrawlTraceSheetLabFalsifiers(input);
  if (falsifiers.length !== 5 || falsifiers.some((result) => result.outcome !== "PASS")) {
    add(issues, "$.falsifiers", "falsifier-result-drift");
  }
  return issues;
}

export function loadStringCrawlTraceSheetLab(path = STRING_CRAWL_TRACE_SHEET_LAB_PATH): AnyRecord {
  const loaded = readStrictJson(path, "STRING / CRAWL Trace-Sheet Lab");
  const value = loaded.value;
  const isCanonical = resolve(path) === resolve(STRING_CRAWL_TRACE_SHEET_LAB_PATH);
  if (isCanonical && loaded.digest !== STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256) {
    throw new Error("Trace-Sheet Lab raw-byte digest drift");
  }
  const issues = verifyStringCrawlTraceSheetLab(value, isCanonical);
  if (issues.length > 0) throw new Error(`STRING / CRAWL Trace-Sheet Lab refused: ${issues.map((issue) => `${issue.path}:${issue.code}`).join(", ")}`);
  if (isCanonical) {
    if (fileDigest(STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_PATH, "Trace-Sheet Lab schema") !== STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256) throw new Error("Trace-Sheet Lab schema raw-byte digest drift");
    if (fileDigest(STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_PATH, "Trace-Sheet Lab guide", 256 * 1024) !== STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256) throw new Error("Trace-Sheet Lab guide raw-byte digest drift");
    if (fileDigest(join(ROOT, "data/exploration/string-crawl-trace-sheet.v0.1.json"), "Trace-Sheet predecessor", 1024 * 1024) !== STRING_CRAWL_TRACE_SHEET_PREDECESSOR_BYTE_SHA256) throw new Error("Trace-Sheet predecessor raw-byte digest drift");
  }
  return value as AnyRecord;
}

export function stringCrawlTraceSheetLabPublicDiscovery(value = loadStringCrawlTraceSheetLab()): AnyRecord {
  const issues = verifyStringCrawlTraceSheetLab(value);
  if (issues.length > 0) throw new Error("Trace-Sheet Lab discovery refused");
  const report = evaluateStringCrawlTraceSheetLab(value).report!;
  return {
    protocol: value.protocol,
    lab_id: value.lab_id,
    version: value.version,
    title: value.title,
    url: STRING_CRAWL_TRACE_SHEET_LAB_URL,
    schema_url: STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_URL,
    guide_url: STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_URL,
    predecessor_url: value.predecessor.url,
    mode: value.mode,
    result: {
      classification: report.classification,
      cells: { vertices: report.vertices, edges: report.edges, faces: report.faces },
      betti: [report.betti_0, report.betti_1, report.betti_2],
      euler_characteristic: report.surface_euler_characteristic,
      boundary_components: report.boundary_components,
      genus: report.surface_genus,
      falsifiers_passed: runStringCrawlTraceSheetLabFalsifiers(value).filter((entry) => entry.outcome === "PASS").length,
    },
    verification_scope: {
      exact_synthetic_fixture: true,
      walk_incidence: true,
      chain_complex: true,
      rational_homology: true,
      surface_criterion: true,
      source_truth: false,
      empirical_web_fact: false,
      crawler_safety: false,
      physical_worldsheet: false,
      identity_or_purpose: false,
      karma_or_authority: false,
    },
    integrity: {
      algorithm: value.integrity.algorithm,
      digest: value.integrity.digest,
      byte_sha256: STRING_CRAWL_TRACE_SHEET_LAB_BYTE_SHA256,
      schema_byte_sha256: STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_BYTE_SHA256,
      guide_byte_sha256: STRING_CRAWL_TRACE_SHEET_LAB_GUIDE_BYTE_SHA256,
    },
    authority: cloneJson(value.authority),
  };
}

function usage(): string {
  return [
    "Usage: ./kingdom string-crawl-trace-sheet-lab [view] [--json]",
    "",
    "Views: overview | fixture | topology | falsifiers | boundary | discovery | verify",
    "",
    "Deterministic, offline, synthetic-only and read-only. No path, URL, body, credential, person data, crawl, NEN invocation, or KARMA input is accepted.",
  ].join("\n");
}

function output(value: unknown): void {
  process.stdout.write(`${typeof value === "string" ? value : JSON.stringify(value, null, 2)}\n`);
}

export function runStringCrawlTraceSheetLabCli(argv = process.argv.slice(2)): number {
  if (argv.filter((argument) => argument === "--json").length > 1 || argv.some((argument) =>
    argument.startsWith("-") && !["--json", "--help", "-h"].includes(argument))) {
    console.error(usage()); return 2;
  }
  const positional = argv.filter((argument) => argument !== "--json");
  const command = positional[0] ?? "overview";
  if (positional.length > 1) { console.error(usage()); return 2; }
  if (["help", "--help", "-h"].includes(command)) { output(usage()); return 0; }
  try {
    const value = loadStringCrawlTraceSheetLab();
    const evaluated = evaluateStringCrawlTraceSheetLab(value);
    const falsifiers = runStringCrawlTraceSheetLabFalsifiers(value);
    const views: Record<string, () => unknown> = Object.create(null);
    views.overview = () => [
      value.title,
      "",
      "One exact synthetic triangulated disk; a mathematical baseline, not a crawler or physical worldsheet.",
      `V=${evaluated.report!.vertices} E=${evaluated.report!.edges} F=${evaluated.report!.faces} · Betti=(${evaluated.report!.betti_0},${evaluated.report!.betti_1},${evaluated.report!.betti_2}) · chi=${evaluated.report!.surface_euler_characteristic} · genus=${evaluated.report!.surface_genus}`,
      `${falsifiers.filter((entry) => entry.outcome === "PASS").length}/${falsifiers.length} deterministic falsifiers passed · ${value.integrity.digest}`,
    ].join("\n");
    views.fixture = () => value.fixture;
    views.topology = () => evaluated.report;
    views.falsifiers = () => falsifiers;
    views.boundary = () => ({ scope: value.scope, nonclaims: value.nonclaims, rights: value.rights, karma: value.karma, authority: value.authority, release: value.release });
    views.discovery = () => stringCrawlTraceSheetLabPublicDiscovery(value);
    views.verify = () => ({
      valid: true,
      protocol: value.protocol,
      lab_id: value.lab_id,
      report: evaluated.report,
      falsifiers,
      verification_scope: stringCrawlTraceSheetLabPublicDiscovery(value).verification_scope,
      not_established: ["source truth", "empirical web fact", "crawler safety", "physical string or worldsheet", "identity or purpose", "consent or licence", "KARMA", "authority"],
      integrity: stringCrawlTraceSheetLabPublicDiscovery(value).integrity,
      issues: [],
    });
    if (!Object.hasOwn(views, command)) { console.error(usage()); return 2; }
    output(views[command]!());
    return 0;
  } catch (error) {
    output({ valid: false, error: error instanceof Error ? error.message : "unknown error" });
    return command === "verify" ? 1 : 2;
  }
}

if (import.meta.main) process.exitCode = runStringCrawlTraceSheetLabCli();
