#!/usr/bin/env bun
/**
 * Static, bounded, network-free reader for the independently reviewed IS,
 * Sustainability & Direction Atlas. It evaluates no referent, accepts no live
 * input, performs no write, and creates no authority, permission, publication,
 * deployment, or action. Review of this local core artifact does not publish it.
 */

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  closeSync,
  constants as fsConstants,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
} from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ZERO_SHA256 = `sha256:${"0".repeat(64)}`;

export const IS_SUSTAINABILITY_DIRECTION_PROTOCOL =
  "kingdom.is-sustainability-direction-atlas/0.1";
export const IS_SUSTAINABILITY_DIRECTION_ATLAS_ID =
  "is-sustainability-direction-atlas-2026-08-29";
export const IS_SUSTAINABILITY_DIRECTION_SCHEMA_ID =
  "https://thekingdom.dev/schemas/is-sustainability-direction-atlas/0.1.json";
export const IS_SUSTAINABILITY_DIRECTION_RECORD_LOCATOR =
  "data/isness/is-sustainability-direction-atlas.v0.1.json";
export const IS_SUSTAINABILITY_DIRECTION_RECORD_PATH =
  join(ROOT, IS_SUSTAINABILITY_DIRECTION_RECORD_LOCATOR);
export const IS_SUSTAINABILITY_DIRECTION_SCHEMA_LOCATOR =
  "schemas/is-sustainability-direction-atlas-v0.1.schema.json";
export const IS_SUSTAINABILITY_DIRECTION_SCHEMA_PATH =
  join(ROOT, IS_SUSTAINABILITY_DIRECTION_SCHEMA_LOCATOR);
export const IS_SUSTAINABILITY_DIRECTION_GUIDE_LOCATOR =
  "references/is-sustainability-direction-atlas.md";
export const IS_SUSTAINABILITY_DIRECTION_GUIDE_PATH =
  join(ROOT, IS_SUSTAINABILITY_DIRECTION_GUIDE_LOCATOR);
export const IS_SUSTAINABILITY_DIRECTION_RECORD_URL =
  "https://thekingdom.dev/atlases/is-sustainability-direction-atlas-2026-08-29.json";
export const IS_SUSTAINABILITY_DIRECTION_SCHEMA_URL =
  "https://thekingdom.dev/schemas/is-sustainability-direction-atlas/0.1.json";
export const IS_SUSTAINABILITY_DIRECTION_GUIDE_URL =
  "https://thekingdom.dev/IS-SUSTAINABILITY-DIRECTION-ATLAS.md";
export const IS_SUSTAINABILITY_DIRECTION_UNSEALED_SHA256 = ZERO_SHA256;
export const IS_SUSTAINABILITY_DIRECTION_UNSEALED_DIGEST = ZERO_SHA256;
// Independently approved semantic pin. This seals the local core artifact only.
export const IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256 =
  "sha256:b415203eb248221544ae160233fcd75d7a58084b76028d3e27f35a6b036891b5";
export const IS_SUSTAINABILITY_DIRECTION_REVIEWED_DIGEST =
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256;
// Reviewed raw-byte triplet. Installed atomically after the final reviewed
// record, schema, and guide bytes are frozen.
export const IS_SUSTAINABILITY_DIRECTION_REVIEWED_RECORD_RAW_SHA256 =
  "sha256:19d70dfa187366bb10cc1bdbbc6a558e82f3c9057e21872aa593f4d960ac77c3";
export const IS_SUSTAINABILITY_DIRECTION_REVIEWED_SCHEMA_RAW_SHA256 =
  "sha256:314a92b146c0c99c71ee5bd26f037deaec91fb4b9b157e0654a569675e928f8d";
export const IS_SUSTAINABILITY_DIRECTION_REVIEWED_GUIDE_RAW_SHA256 =
  "sha256:8614020ed497d6627f7b503a883ac1bfa86d2609a97794ac33fe465e01868405";
export const REVIEWED_RECORD_RAW_SHA256 =
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_RECORD_RAW_SHA256;
export const REVIEWED_SCHEMA_RAW_SHA256 =
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_SCHEMA_RAW_SHA256;
export const REVIEWED_GUIDE_RAW_SHA256 =
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_GUIDE_RAW_SHA256;

export const IS_SUSTAINABILITY_DIRECTION_LIMITS = Object.freeze({
  bytes: 156_500,
  json_nodes: 3_900,
  total_string_units: 134_300,
  max_string_units: 675,
  max_array_fanout: 35,
  max_object_fanout: 54,
  max_depth: 7,
});

const SCHEMA_MAX_BYTES = 512 * 1024;
const GUIDE_MAX_BYTES = 256 * 1024;
const PREDECESSOR_MAX_BYTES = 2 * 1024 * 1024;
const PINNED_JSONSCHEMA_VERSION = "4.26.0";
const SCHEMA_SHAPE_LIMITS = Object.freeze({
  bytes: SCHEMA_MAX_BYTES,
  json_nodes: 12_000,
  total_string_units: 260_000,
  max_string_units: 8_000,
  max_array_fanout: 128,
  max_object_fanout: 96,
  max_depth: 16,
});
const PREDECESSOR_SHAPE_LIMITS = Object.freeze({
  bytes: PREDECESSOR_MAX_BYTES,
  json_nodes: 100_000,
  total_string_units: 2_000_000,
  max_string_units: 20_000,
  max_array_fanout: 2_000,
  max_object_fanout: 512,
  max_depth: 128,
});

export type IsSustainabilityDirectionIssue = {
  field: string;
  code: string;
};

export type IsSustainabilityDirectionMetrics = {
  bytes: number;
  json_nodes: number;
  total_string_units: number;
  max_string_units: number;
  max_array_fanout: number;
  max_object_fanout: number;
  max_depth: number;
};

type ReadResult = {
  value: unknown;
  bytes: number;
  rawDigest: string;
};

export type IsSustainabilityDirectionValidationOptions = {
  allowUnsealed?: boolean;
  verifyPredecessors?: boolean;
};

type InternalValidationOptions = IsSustainabilityDirectionValidationOptions & {
  /** Trusted only when supplied by this module's bounded raw-byte loader. */
  rawByteLength?: number;
};

function sha256(value: string | Uint8Array): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function plainObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeOwn(value: Record<string, any>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}

function readBoundedBytes(path: string, maxBytes: number, label: string): {
  bytes: Buffer;
  rawDigest: string;
} {
  const absolute = resolve(path);
  let before: ReturnType<typeof lstatSync>;
  try {
    before = lstatSync(absolute, { bigint: true });
  } catch {
    throw new Error(`${label}-unavailable`);
  }
  if (!before.isFile() || before.isSymbolicLink()) {
    throw new Error(`${label}-must-be-bounded-regular-non-symlink-file`);
  }
  if (before.size > BigInt(maxBytes)) throw new Error(`${label}-byte-budget-exceeded`);

  let fd: number;
  try {
    fd = openSync(
      absolute,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK,
    );
  } catch {
    throw new Error(`${label}-safe-open-refused`);
  }

  let bytes: Buffer;
  try {
    const opened = fstatSync(fd, { bigint: true });
    if (!opened.isFile() || opened.size > BigInt(maxBytes)) {
      throw new Error(`${label}-opened-file-boundary-mismatch`);
    }
    for (const field of ["dev", "ino", "size", "mtimeNs", "ctimeNs"] as const) {
      if (opened[field] !== before[field]) throw new Error(`${label}-path-changed-before-read`);
    }
    const size = Number(opened.size);
    bytes = Buffer.alloc(size);
    let offset = 0;
    while (offset < size) {
      const count = readSync(fd, bytes, offset, size - offset, offset);
      if (count <= 0) throw new Error(`${label}-short-read`);
      offset += count;
    }
    if (readSync(fd, Buffer.alloc(1), 0, 1, size) !== 0) {
      throw new Error(`${label}-grew-during-read`);
    }
    const openedAfter = fstatSync(fd, { bigint: true });
    let after: ReturnType<typeof lstatSync>;
    try {
      after = lstatSync(absolute, { bigint: true });
    } catch {
      throw new Error(`${label}-path-disappeared-after-read`);
    }
    for (const later of [openedAfter, after]) {
      if (!later.isFile() || later.isSymbolicLink()) {
        throw new Error(`${label}-identity-changed-during-read`);
      }
      for (const field of ["dev", "ino", "size", "mtimeNs", "ctimeNs"] as const) {
        if (later[field] !== opened[field]) {
          throw new Error(`${label}-identity-changed-during-read`);
        }
      }
    }
  } finally {
    closeSync(fd);
  }
  return { bytes, rawDigest: sha256(bytes) };
}

function readBoundedJson(path: string, maxBytes: number, label: string): ReadResult {
  const read = readBoundedBytes(path, maxBytes, label);
  return {
    value: parseStrictJsonBytes(read.bytes, `${label} JSON`),
    bytes: read.bytes.byteLength,
    rawDigest: read.rawDigest,
  };
}

export function readIsSustainabilityDirectionAtlas(
  path = IS_SUSTAINABILITY_DIRECTION_RECORD_PATH,
): ReadResult {
  return readBoundedJson(path, IS_SUSTAINABILITY_DIRECTION_LIMITS.bytes, "atlas");
}

type Inspection = {
  metrics: Omit<IsSustainabilityDirectionMetrics, "bytes">;
  issue?: IsSustainabilityDirectionIssue;
};

function inspectJsonValue(
  value: unknown,
  limits: typeof IS_SUSTAINABILITY_DIRECTION_LIMITS = IS_SUSTAINABILITY_DIRECTION_LIMITS,
): Inspection {
  const metrics = {
    json_nodes: 0,
    total_string_units: 0,
    max_string_units: 0,
    max_array_fanout: 0,
    max_object_fanout: 0,
    max_depth: 0,
  };
  const seen = new Set<object>();
  const stack: Array<{ value: unknown; path: string; depth: number }> = [
    { value, path: "$", depth: 0 },
  ];

  try {
    while (stack.length) {
      const current = stack.pop()!;
      metrics.json_nodes += 1;
      if (metrics.json_nodes > limits.json_nodes) {
        return { metrics, issue: { field: current.path, code: "json-node-budget-exceeded" } };
      }
      metrics.max_depth = Math.max(metrics.max_depth, current.depth);
      if (current.depth > limits.max_depth) {
        return { metrics, issue: { field: current.path, code: "max-depth-exceeded" } };
      }
      const item = current.value;
      if (typeof item === "string") {
        metrics.total_string_units += item.length;
        metrics.max_string_units = Math.max(metrics.max_string_units, item.length);
        if (item.length > limits.max_string_units) {
          return { metrics, issue: { field: current.path, code: "max-string-units-exceeded" } };
        }
        if (metrics.total_string_units > limits.total_string_units) {
          return { metrics, issue: { field: current.path, code: "total-string-budget-exceeded" } };
        }
        continue;
      }
      if (item === null || typeof item === "boolean") continue;
      if (typeof item === "number") {
        if (!Number.isFinite(item)) {
          return { metrics, issue: { field: current.path, code: "non-finite-number" } };
        }
        continue;
      }
      if (typeof item !== "object") {
        return { metrics, issue: { field: current.path, code: "non-json-value" } };
      }
      if (seen.has(item)) {
        return { metrics, issue: { field: current.path, code: "cyclic-or-shared-reference" } };
      }
      seen.add(item);
      if (Object.getOwnPropertySymbols(item).length) {
        return { metrics, issue: { field: current.path, code: "symbol-key-refused" } };
      }
      const descriptors = Object.getOwnPropertyDescriptors(item);
      if (Array.isArray(item)) {
        if (Object.getPrototypeOf(item) !== Array.prototype) {
          return { metrics, issue: { field: current.path, code: "non-json-array-prototype" } };
        }
        const lengthDescriptor = descriptors.length;
        if (!lengthDescriptor || !("value" in lengthDescriptor) || lengthDescriptor.value !== item.length) {
          return { metrics, issue: { field: current.path, code: "array-length-descriptor-refused" } };
        }
        const keys = Object.keys(descriptors).filter((key) => key !== "length");
        if (keys.length !== item.length) {
          return { metrics, issue: { field: current.path, code: "sparse-or-extra-array-property-refused" } };
        }
        metrics.max_array_fanout = Math.max(metrics.max_array_fanout, item.length);
        if (item.length > limits.max_array_fanout) {
          return { metrics, issue: { field: current.path, code: "max-array-fanout-exceeded" } };
        }
        for (let index = item.length - 1; index >= 0; index -= 1) {
          const descriptor = descriptors[String(index)];
          if (!descriptor || !("value" in descriptor) || descriptor.enumerable !== true) {
            return { metrics, issue: { field: `${current.path}[${index}]`, code: "accessor-or-sparse-array-entry-refused" } };
          }
          stack.push({ value: descriptor.value, path: `${current.path}[${index}]`, depth: current.depth + 1 });
        }
        continue;
      }
      const prototype = Object.getPrototypeOf(item);
      if (prototype !== Object.prototype && prototype !== null) {
        return { metrics, issue: { field: current.path, code: "non-json-object-prototype" } };
      }
      const keys = Object.keys(descriptors);
      metrics.max_object_fanout = Math.max(metrics.max_object_fanout, keys.length);
      if (keys.length > limits.max_object_fanout) {
        return { metrics, issue: { field: current.path, code: "max-object-fanout-exceeded" } };
      }
      for (const key of keys) {
        const descriptor = descriptors[key]!;
        if (!("value" in descriptor)) {
          return { metrics, issue: { field: `${current.path}.${key}`, code: "accessor-property-refused" } };
        }
        if (descriptor.enumerable !== true) {
          return { metrics, issue: { field: `${current.path}.${key}`, code: "non-enumerable-property-refused" } };
        }
        metrics.total_string_units += key.length;
        metrics.max_string_units = Math.max(metrics.max_string_units, key.length);
        if (key.length > limits.max_string_units) {
          return { metrics, issue: { field: `${current.path}.${key}`, code: "max-string-units-exceeded" } };
        }
        if (metrics.total_string_units > limits.total_string_units) {
          return { metrics, issue: { field: `${current.path}.${key}`, code: "total-string-budget-exceeded" } };
        }
        stack.push({ value: descriptor.value, path: `${current.path}.${key}`, depth: current.depth + 1 });
      }
    }
  } catch {
    return { metrics, issue: { field: "$", code: "hostile-or-unreadable-input" } };
  }
  return { metrics };
}

export function isSustainabilityDirectionShapeMetrics(
  value: unknown,
): IsSustainabilityDirectionMetrics {
  const inspected = inspectJsonValue(value);
  if (inspected.issue) {
    throw new Error(`atlas-shape-refused:${inspected.issue.field}:${inspected.issue.code}`);
  }
  const measuredBytes = Buffer.byteLength(canonicalizeJsonValue(value));
  return { bytes: measuredBytes, ...inspected.metrics };
}

export function isSustainabilityDirectionDigest(value: Record<string, unknown>): string {
  const inspected = inspectJsonValue(value);
  if (inspected.issue) throw new Error(`atlas-digest-refused:${inspected.issue.code}`);
  const material = structuredClone(value) as Record<string, any>;
  if (!plainObject(material.integrity)) throw new Error("atlas-integrity-envelope-missing");
  material.integrity.digest = ZERO_SHA256;
  material.integrity.reviewed_digest = ZERO_SHA256;
  return sha256(canonicalizeJsonValue(material));
}

let cachedSchema: Record<string, any> | undefined;
function localSchema(): Record<string, any> {
  if (cachedSchema) return cachedSchema;
  const loaded = readBoundedJson(
    IS_SUSTAINABILITY_DIRECTION_SCHEMA_PATH,
    SCHEMA_MAX_BYTES,
    "atlas-schema",
  );
  if (!plainObject(loaded.value)) throw new Error("atlas-schema-object-required");
  cachedSchema = loaded.value;
  return cachedSchema;
}

function schemaRef(root: Record<string, any>, reference: string): Record<string, any> | undefined {
  if (!reference.startsWith("#/$defs/")) return undefined;
  const token = reference.slice("#/$defs/".length).replace(/~1/gu, "/").replace(/~0/gu, "~");
  const defs = plainObject(root.$defs) ? root.$defs : undefined;
  const target = defs ? safeOwn(defs, token) : undefined;
  return plainObject(target) ? target : undefined;
}

function schemaTypeMatches(value: unknown, type: unknown): boolean {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return plainObject(value);
  if (type === "integer") return typeof value === "number" && Number.isInteger(value);
  return typeof value === type;
}

function simpleEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  try {
    return canonicalizeJsonValue(left) === canonicalizeJsonValue(right);
  } catch {
    return false;
  }
}

function validateSchemaNode(
  value: unknown,
  schema: Record<string, any>,
  root: Record<string, any>,
  field: string,
  add: (field: string, code: string) => void,
): void {
  if (typeof schema.$ref === "string") {
    const target = schemaRef(root, schema.$ref);
    if (!target) add(field, "schema-reference-unresolved");
    else validateSchemaNode(value, target, root, field, add);
    return;
  }
  if (schema.const !== undefined && !simpleEqual(value, schema.const)) {
    add(field, "schema-const-mismatch");
    return;
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((candidate: unknown) => simpleEqual(value, candidate))) {
    add(field, "schema-enum-mismatch");
    return;
  }
  if (typeof schema.type === "string" && !schemaTypeMatches(value, schema.type)) {
    add(field, "schema-type-mismatch");
    return;
  }
  if (typeof value === "string") {
    if (Number.isInteger(schema.minLength) && value.length < schema.minLength) add(field, "schema-min-length");
    if (Number.isInteger(schema.maxLength) && value.length > schema.maxLength) add(field, "schema-max-length");
    if (typeof schema.pattern === "string") {
      try {
        if (!new RegExp(schema.pattern, "u").test(value)) add(field, "schema-pattern-mismatch");
      } catch {
        add(field, "schema-pattern-invalid");
      }
    }
    return;
  }
  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) add(field, "schema-minimum");
    if (typeof schema.maximum === "number" && value > schema.maximum) add(field, "schema-maximum");
    return;
  }
  if (Array.isArray(value)) {
    if (Number.isInteger(schema.minItems) && value.length < schema.minItems) add(field, "schema-min-items");
    if (Number.isInteger(schema.maxItems) && value.length > schema.maxItems) add(field, "schema-max-items");
    if (plainObject(schema.items)) {
      value.forEach((item, index) => validateSchemaNode(item, schema.items, root, `${field}[${index}]`, add));
    } else if (schema.items === false && value.length > 0) {
      add(field, "schema-items-refused");
    }
    return;
  }
  if (plainObject(value)) {
    const properties = plainObject(schema.properties) ? schema.properties : {};
    const required = Array.isArray(schema.required) ? schema.required : [];
    for (const key of required) {
      if (typeof key === "string" && !Object.prototype.hasOwnProperty.call(value, key)) {
        add(`${field}.${key}`, "schema-required-missing");
      }
    }
    for (const key of Object.keys(value)) {
      const child = safeOwn(properties, key);
      if (!plainObject(child)) {
        if (schema.additionalProperties === false) add(`${field}.${key}`, "schema-additional-property");
      } else {
        validateSchemaNode(safeOwn(value, key), child, root, `${field}.${key}`, add);
      }
    }
  }
}

export function validateIsSustainabilityDirectionSchemaClosure(
  schemaValue: unknown = localSchema(),
): IsSustainabilityDirectionIssue[] {
  const issues: IsSustainabilityDirectionIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  const inspected = inspectJsonValue(schemaValue, SCHEMA_SHAPE_LIMITS);
  if (inspected.issue) return [inspected.issue];
  if (!plainObject(schemaValue)) return [{ field: "$schema", code: "schema-object-required" }];
  if (schemaValue.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    add("$schema.$schema", "schema-draft-mismatch");
  }
  if (schemaValue.$id !== IS_SUSTAINABILITY_DIRECTION_SCHEMA_ID) {
    add("$schema.$id", "schema-id-mismatch");
  }
  if (!plainObject(schemaValue.$defs)) add("$schema.$defs", "schema-definitions-object-required");
  const validationKeywords = new Set([
    "$ref", "type", "const", "enum", "minLength", "maxLength", "pattern",
    "minimum", "maximum", "minItems", "maxItems", "items", "required",
    "properties", "additionalProperties",
  ]);
  const rootKeywords = new Set([
    ...validationKeywords, "$schema", "$id", "title", "description", "$defs",
  ]);
  const stack: Array<{ node: unknown; path: string; root: boolean }> = [
    { node: schemaValue, path: "$schema", root: true },
  ];
  const seen = new Set<object>();
  while (stack.length) {
    const { node, path, root } = stack.pop()!;
    if (!plainObject(node) || seen.has(node)) continue;
    seen.add(node);
    const allowed = root ? rootKeywords : validationKeywords;
    for (const keyword of Object.keys(node)) {
      if (!allowed.has(keyword)) add(`${path}.${keyword}`, "schema-keyword-not-supported-by-fallback");
    }
    if (typeof node.$ref === "string") {
      if (Object.keys(node).length !== 1) add(path, "schema-ref-siblings-refused");
      if (!schemaRef(schemaValue, node.$ref)) add(`${path}.$ref`, "schema-reference-unresolved");
      continue;
    }
    if (node.$ref !== undefined) add(`${path}.$ref`, "schema-reference-string-required");
    const hasAssertion = typeof node.type === "string" || node.const !== undefined || Array.isArray(node.enum);
    if (!hasAssertion) add(path, "schema-node-without-supported-assertion");
    if (node.type !== undefined && !["null", "boolean", "number", "integer", "string", "array", "object"].includes(node.type)) {
      add(`${path}.type`, "schema-type-unsupported");
    }
    if (node.enum !== undefined && (!Array.isArray(node.enum) || node.enum.length === 0)) {
      add(`${path}.enum`, "schema-enum-nonempty-array-required");
    }
    if (node.type === "object") {
      const properties = plainObject(node.properties) ? Object.keys(node.properties).sort() : [];
      const requiredEntries = Array.isArray(node.required) ? node.required : [];
      const required = requiredEntries
        .filter((entry: unknown): entry is string => typeof entry === "string").sort();
      if (!plainObject(node.properties)) add(`${path}.properties`, "schema-object-properties-required");
      if (!Array.isArray(node.required) || required.length !== requiredEntries.length || new Set(required).size !== required.length) {
        add(`${path}.required`, "schema-required-unique-string-array-required");
      }
      if (node.additionalProperties !== false) add(path, "schema-object-not-deeply-closed");
      if (!simpleEqual(properties, required)) add(path, "schema-required-properties-not-exact");
    } else {
      for (const keyword of ["properties", "required", "additionalProperties"]) {
        if (node[keyword] !== undefined) add(`${path}.${keyword}`, "schema-object-keyword-on-non-object");
      }
    }
    const natural = (candidate: unknown): candidate is number =>
      Number.isSafeInteger(candidate) && (candidate as number) >= 0;
    if (node.type === "string") {
      if (node.const === undefined && !Array.isArray(node.enum) && !natural(node.maxLength)) {
        add(path, "schema-string-unbounded");
      }
      if (node.minLength !== undefined && !natural(node.minLength)) add(`${path}.minLength`, "schema-string-bound-invalid");
      if (node.maxLength !== undefined && !natural(node.maxLength)) add(`${path}.maxLength`, "schema-string-bound-invalid");
      if (natural(node.minLength) && natural(node.maxLength) && node.minLength > node.maxLength) add(path, "schema-string-bounds-inverted");
      if (Array.isArray(node.enum) && node.enum.some((entry: unknown) => typeof entry !== "string")) add(`${path}.enum`, "schema-string-enum-type-mismatch");
    } else {
      for (const keyword of ["minLength", "maxLength", "pattern"]) {
        if (node[keyword] !== undefined) add(`${path}.${keyword}`, "schema-string-keyword-on-non-string");
      }
    }
    if (node.type === "array") {
      if (!natural(node.minItems) || !natural(node.maxItems)) add(path, "schema-array-bounds-required");
      if (natural(node.minItems) && natural(node.maxItems) && node.minItems > node.maxItems) add(path, "schema-array-bounds-inverted");
      if (!plainObject(node.items) && node.items !== false) add(`${path}.items`, "schema-array-items-required");
    } else {
      for (const keyword of ["minItems", "maxItems", "items"]) {
        if (node[keyword] !== undefined) add(`${path}.${keyword}`, "schema-array-keyword-on-non-array");
      }
    }
    if (node.minimum !== undefined && (!Number.isSafeInteger(node.minimum) || node.minimum < 0)) add(`${path}.minimum`, "schema-numeric-bound-invalid");
    if (node.maximum !== undefined && (!Number.isSafeInteger(node.maximum) || node.maximum < 0)) add(`${path}.maximum`, "schema-numeric-bound-invalid");
    if (typeof node.minimum === "number" && typeof node.maximum === "number" && node.minimum > node.maximum) add(path, "schema-numeric-bounds-inverted");
    if (typeof node.pattern === "string") {
      try { new RegExp(node.pattern, "u"); } catch { add(`${path}.pattern`, "schema-pattern-invalid"); }
    }
    if (plainObject(node.properties)) {
      for (const [key, child] of Object.entries(node.properties)) {
        if (!plainObject(child)) add(`${path}.properties.${key}`, "schema-property-schema-object-required");
        else stack.push({ node: child, path: `${path}.properties.${key}`, root: false });
      }
    }
    if (plainObject(node.items)) {
      stack.push({ node: node.items, path: `${path}.items`, root: false });
    } else if (node.items !== undefined && node.items !== false) {
      add(`${path}.items`, "schema-items-object-or-false-required");
    }
    if (root && plainObject(node.$defs)) {
      for (const [key, child] of Object.entries(node.$defs)) {
        if (!plainObject(child)) add(`${path}.$defs.${key}`, "schema-definition-object-required");
        else stack.push({ node: child, path: `${path}.$defs.${key}`, root: false });
      }
    }
  }
  return issues.sort((a, b) => `${a.field}\0${a.code}`.localeCompare(`${b.field}\0${b.code}`));
}

const EXPECTED_THESIS =
  "For the ASPIRATIONAL_DIRECTION referent rho-right-preserving-next-moves, this atlas proposes sustaining conditions in which beings retain rights-compatible next moves; it does not model KINGDOM as one object or subject. Feedback may revise a modelled estimate of a viable-action set; a typed direction may propose within it; separate current choice and authority govern any effect. Declared remainder keeps the claim revisable; transformation, handoff, rest, or graceful ending can prevent current-form persistence from becoming captivity.";

const EXPECTED_HEARTS = [
  "For the ASPIRATIONAL_DIRECTION referent rho-right-preserving-next-moves, this atlas proposes sustaining conditions in which beings retain rights-compatible next moves; it does not model KINGDOM as one object or subject.",
  "Feedback may revise a modelled estimate of a viable-action set; a typed direction may propose within it; separate current choice and authority govern any effect.",
  "Transformation, handoff, rest, and graceful ending can be candidate terminal shapes within a typed referent model, subject to separate rights, authority, obligations, residuals, and affected-party safeguards.",
] as const;

const EXPECTED_REFERENTS = [
  { id: "rho-source-atlas-artifact", kind: "SOURCE_ARTIFACT", ends: ["DEPRECATE", "RETIRE_ROUTE", "BYTES_REMAIN", "LINEAGE_REMAINS"] },
  { id: "rho-reflective-operating-practice", kind: "OPERATING_PRACTICE", ends: ["REST", "STOP", "REPLACE"] },
  { id: "rho-voluntary-participation-relation", kind: "VOLUNTARY_RELATION", ends: ["WITHDRAW", "DISSOLVE"] },
  { id: "rho-stewardship-arrangement", kind: "INSTITUTIONAL_ARRANGEMENT", ends: ["SUNSET", "SUCCESSION"] },
  { id: "rho-right-preserving-next-moves", kind: "ASPIRATIONAL_DIRECTION", ends: ["REVISE", "WITHDRAW"] },
  { id: "rho-observed-access-effect", kind: "OBSERVED_EFFECT", ends: ["DECAY", "REVERSE", "REMEDY", "RESIDUAL"] },
  { id: "rho-versioned-sustainability-lineage", kind: "VERSIONED_LINEAGE", ends: ["CLOSE", "HANDOFF", "FORK"] },
] as const;

const EXPECTED_IS_TYPES = [
  "existence", "predication", "identity-under-criterion", "membership", "relation",
  "truth-in-model", "actuality", "possibility-reachability", "declaration", "interpretation",
] as const;

const EXPECTED_STATEMENT_KINDS = [
  "OBSERVATION", "EXPECTATION", "COMMITMENT", "CONSEQUENCE", "INTERPRETATION",
] as const;

const EXPECTED_IS_STATEMENT_INDEPENDENCE =
  "A typed use of IS and a statement kind are independent dimensions. Each pairing requires its own evidence, speaker, method, premises, and warrant; examples in is_types are non-exhaustive and do not forbid other warranted pairings.";

const EXPECTED_DIRECTION_KINDS = [
  "local-dynamical-direction", "observed-trend", "selected-control-action",
  "declared-revocable-purpose", "authority-backed-normative-commitment",
  "functional-role-attribution", "as-if-goal-model", "selection-history-explanation",
  "opt-in-teleological-interpretation", "moral-orientation",
] as const;

const EXPECTED_FEEDBACK_TARGETS: Record<string, readonly string[]> = {
  CONTROL_RETURN_SIGNAL: ["MODEL", "PROPOSAL"],
  RL_REWARD_SIGNAL: ["LEARNER_STATE"],
  BEHAVIORAL_REINFORCER_CANDIDATE: ["RECORD", "MODEL"],
  AFFECTED_PARTY_INPUT: ["RECORD", "BELIEF", "PROPOSAL"],
  MONITORING_OBSERVATION: ["RECORD", "MODEL"],
  CORRECTION_OR_FALSIFIER: ["RECORD", "BELIEF", "MODEL", "PROPOSAL"],
};

const EXPECTED_MATH_EXPRESSIONS: Record<string, string> = {
  "state-and-partial-observation": "I_t=sigma(y_{0:t},u_{0:t-1}), x_{s+1}=F_s(x_s,u_s,w_s), y_{s+1}=h_{s+1}(x_{s+1})+nu_{s+1}, xi_s=(w_s,nu_{s+1}) in Xi_s for s>=t",
  "robust-finite-horizon-viability-kernel": "Viab_H^rob(K)={I_0 | exists one policy pi with u_s=pi_s(I_s) before xi_s, for all x_0 in B(I_0), for all xi_{0:H-1} in Π_{s=0}^{H-1} Xi_s, for all s in {0,...,H}: x_s in K}",
  "present-viable-action-key-set": "Key_H(I_t)={u_t in U(I_t) | exists one continuation pi_plus with u_s=pi_s(I_s) before xi_s for s>t, for all x_t in B(I_t), for all xi_{t:t+H-1} in Π_{s=t}^{t+H-1} Xi_s: for all s in {t,...,t+H}, x_s in K}, H>=1",
  "reach-avoid-safe-terminal-handoff": "ReachAvoid_H^rob(K,T)={I_0 | exists one policy pi with u_s=pi_s(I_s) before xi_s, exists one stopping functional tau adapted to post-observation I_s, for all x_0 in B(I_0), for all xi_{0:H-1} in Π_{s=0}^{H-1} Xi_s: tau_pi(x_0,xi)<=H, (for all s<tau_pi(x_0,xi), x_s in K), and x_{tau_pi(x_0,xi)} in T}",
  "barrier-constrained-direction": "k(x) in argmin_{u in U(x)} ||u-u_dir(x)||^2 subject to L_f b(x)+L_g b(x)u >= -alpha(b(x)), for every x in D",
  "representation-fibre": "[x]_r=r^{-1}(r(x))={x' in X | r(x')=r(x)}",
  "task-relative-sufficiency-lineage": "q=g o r on declared domain D, with lineage X --r--> Z --g--> Q",
};

const EXPECTED_PROFILE_DIMENSIONS = [
  "material-viability", "rights-compatibility", "ecological-compatibility", "option-diversity",
  "epistemic-integrity", "correctability", "resilience", "adaptability", "transformability",
  "succession-handoff-readiness", "retirement-readiness", "residual-burden",
] as const;

const EXPECTED_TEMPORAL_CAPACITIES = [
  "persistence", "stability", "robustness", "resilience", "adaptability",
  "transformability", "regeneration", "succession", "retirement",
] as const;

const EXPECTED_CONCEPTS = [
  "referent-indexed-sustainability", "viability-kernel", "key-set", "reach-avoid-handoff",
  "constraint-respecting-direction", "feedback-loop", "typed-is", "non-exhaustive-representation",
  "representation-fibre", "persistence", "stability", "robustness", "resilience", "adaptability",
  "transformability", "regeneration", "succession", "retirement",
] as const;

const EXPECTED_COUNTEREXAMPLES: Record<string, string> = {
  "stable-harmful-equilibrium": "FORMAL_CONSTRUCTION",
  "destabilizing-feedback": "FORMAL_CONSTRUCTION",
  "circular-direction-without-telos": "FORMAL_CONSTRUCTION",
  "persistent-hidden-depletion": "FORMAL_CONSTRUCTION",
  "resilient-undesirable-regime": "SOURCE_REPORTED_THEORY",
  "autopoiesis-without-adaptivity": "SOURCE_REPORTED_THEORY",
  "graceful-ending-passes": "NORMATIVE_DESIGN",
  "artifact-does-not-imply-practice": "NORMATIVE_DESIGN",
};

const EXPECTED_SOURCE_REGISTRY_DIGEST =
  "sha256:be713c2a8229a13871f5fd4ad697547d64b0512c07db552e5aff9e2e5f39d162";
const EXPECTED_PREDECESSOR_BINDINGS_DIGEST =
  "sha256:cfd7ddfb724f0584c06b2979d4b447b6618b4ab6c844a6c013c54c604057a6e9";
const EXPECTED_RELATION_EXTENSIONS_DIGEST =
  "sha256:2357b1c3771c9efcd28557f17d910578c5e3f5073fe9e27a6e722e5401197308";
const EXPECTED_I8_MAPPING_DIGEST =
  "sha256:6dd534456fa9a48fa3b21d08acb2861d247c2bd0bc6fcd5795d466632f6e5a1c";
const EXPECTED_I6_MAPPING_DIGEST =
  "sha256:b38830c9b4c18befced400ed7f9f26b4ade64e4604e90b805079b952e5e46bc9";

const EXPECTED_SAFETY_SECTION_DIGESTS: Readonly<Record<string, string>> = Object.freeze({
  status: "sha256:5300b2fb8a2fcdfd6a06d694170641e33b0f4cdb4ea4357b7f00f2ca4fea1c7e",
  scope: "sha256:acd78a990a5aa6344770e9fb61fd821d7f94a7d369915bf05814541236a80a27",
  epistemic_registers: "sha256:938357c34192d71f8a2511e2f91e29e918d0d1b121a888505ef95effb34c3e02",
  statement_kind_contract: "sha256:4e80734b7b7d67def9d65ff23a0d9f340f3c73b4bc7238f8a0a8b0c12f4a2049",
  is_types: "sha256:a5163028c5c3fffb3b11c18cb2893328476dc0b72968d3906a2e0e005e224dc8",
  being_boundary: "sha256:3f4dade3f34e799aff94e3d46bc71b463583690e9c8ea128d353d05837d0dc41",
  referents: "sha256:1f2aacdb63be41160b250ef3f3aeed8dddc12e30001bc1c95e8095de72d77e32",
  sustainability_relations: "sha256:4662bb76caa7ce262ade8d9f44c9c0985486f16dededd0408fedc0d20702cea1",
  sustainability_contract: "sha256:c64ed4b58eedcfa58c2aae9c478b0276ccf2270e4d93189b8f8b15486acdd300",
  direction_taxonomy: "sha256:3c3b554baf91c3e1ae269fcea2650a18310be63ce52d67f68dd62b7ee1d02fc9",
  direction_firewall: "sha256:aca9c9ca9798e97fb913a435ec85fc0763aea4b4d5a0065c4f0f59dfac9b27b8",
  feedback_contract: "sha256:5a8158d4433dc5c3608b3b0bb6525bd72c70d00dea3e3497b90deb45024a59b2",
  mathematical_core: "sha256:600754130d1d1da141c2aa0c60576bfa3c764a34cf47208e8c851143b2272890",
  profile_model: "sha256:a0df9f9ca54c675160e6f81e5cbea9ca738f0d2e0de8b0db00b76a29516e24b7",
  temporal_capacities: "sha256:8dd362dc3530ea1854c50219912ff5324483212422c7f5327824bc42fa0e3fb6",
  rights_invariant: "sha256:f27f777b39eaa5f474c8af190ad1cbede87975631488e201c946baa9ca7f16fe",
  ecology_intergenerational: "sha256:2ad3dac0a58e72447219ba14bc792445d013eeaa08ec08e585f74ee133608168",
  philosophy_lenses: "sha256:a847570d06bf33f67751d5f5a57a7a007b4973db8126f10900f4db1369173be8",
  counterexamples: "sha256:ed5f239e7220ee17e5825be30f54c77fb4bf824c512a2d2337360553dde6d3f2",
  concept_catalog: "sha256:a76d248f48997ac134462124ec55151bd9c383ce08fb35b88f31839261d2c4c4",
  edge_registry: "sha256:fd5cf3722e041a471a147e29f168aed3d4d170b72052fb5030d2b203b35e932f",
  open_questions: "sha256:d355fbb73bed183e1775494f890b2d234f36cfdfa9b3fb0b098ad44a23feec62",
  isness_protocol_collision: "sha256:2624c8eff08837de283e8ed39c25c7d18f8c5c8081e4c683b10439a206cb9867",
  standard_isness_document_pin: "sha256:5d4a9f06c6dc28b9121d48eb2ff333be4cb176259180c36bbf9447b4113b5251",
  non_grants: "sha256:66bf22b55dcd107e0b5af8ac4b65922c0f2dc0db567148d939acc445daaab3f0",
});

const EXPECTED_PREDECESSOR_PINS = [
  { id: "pred-number", protocol: "kingdom.number-isness-theology-atlas/0.1", schema_id: "urn:kingdom:schema:number-isness-theology-atlas:0.1", artifact_id: "number-isness-theology-atlas-2026-08-14", revision: "9a0980d107708f22197e66966699375e688f24e7", record_locator: "data/number-isness-theology/number-isness-theology-atlas.v0.1.json", record_raw_digest: "sha256:bef01e0865f12ecd66795960758fc16f1a6d5b1ebd0097d4390aa3a2bece65e4", semantic_algorithm: "sha256-canonical-json-with-integrity-digest-null", semantic_digest: "sha256:f4e1dfca02f008f8474abdff0f0a027f193c2cdc2b95454541d8ac41faacecef", source_locator: "bin/number-isness-theology.ts", source_raw_digest: "sha256:8c90201943f73789894c1d34baf22e7984879c2cab2fb6c020dc5fdc0ac00820", runtime_verification: "SAFE_LOCAL_BYTES_AND_SEMANTICS" },
  { id: "pred-being", protocol: "kingdom.being-access-aftermath-atlas/0.2", schema_id: "urn:kingdom:schema:being-access-aftermath-atlas:0.2", artifact_id: "being-access-aftermath-atlas-2026-08-13-v0-2", revision: "9a0980d107708f22197e66966699375e688f24e7", record_locator: "data/being-access-aftermath/being-access-aftermath-atlas.v0.2.json", record_raw_digest: "sha256:9678e5269e8db62beb36abee691087cddbc4f98703190c5fa3788b68c89ab29e", semantic_algorithm: "sha256-canonical-json-with-integrity-digest-null", semantic_digest: "sha256:505a1e3aef6116430dccf49b327c4cce2ac5d6fb6b6b9bf68e529272f989cde8", source_locator: "bin/being-access-aftermath-v0.2.ts", source_raw_digest: "sha256:50c51f8a059a0c8ad042540c762f694dca4ba7e311dbeb1db368692f154081d4", runtime_verification: "SAFE_LOCAL_BYTES_AND_SEMANTICS" },
  { id: "pred-freedom", protocol: "kingdom.freedom-loop-lock-key-atlas/0.1", schema_id: "urn:kingdom:schema:freedom-loop-lock-key-atlas:0.1", artifact_id: "freedom-loop-lock-key-atlas-2026-08-28", revision: "9a0980d107708f22197e66966699375e688f24e7", record_locator: "data/freedom/freedom-loop-lock-key-atlas.v0.1.json", record_raw_digest: "sha256:4b89f29bfd1bf7c4b27dd5023263b45ee1423b6cd2a232736906ee11b032bf04", semantic_algorithm: "sha256-canonical-json-with-integrity-digest-zeroed", semantic_digest: "sha256:2af277e002cf7f7b5218e8eb05fedb661f9645677961952bc2e11ffcd8a2c3a8", source_locator: "bin/freedom-loop-lock-key.ts", source_raw_digest: "sha256:74e63a387897fbae65c1fec7b3a763d88f54b67a98174d4173366a56200eaa26", runtime_verification: "SAFE_LOCAL_BYTES_AND_SEMANTICS" },
  { id: "pred-nonexhaustive", protocol: "kingdom.non-exhaustive-understanding-atlas/0.1", schema_id: "urn:kingdom:schema:non-exhaustive-understanding-atlas:0.1", artifact_id: "non-exhaustive-understanding-atlas-2026-08-29", revision: "9a0980d107708f22197e66966699375e688f24e7", record_locator: "data/understanding/non-exhaustive-understanding-atlas.v0.1.json", record_raw_digest: "sha256:e885606a2f513379ccb64ea40e0b4c6a3dd08b4eea615772e6fd08a22c116b80", semantic_algorithm: "sha256-canonical-json-with-integrity-digests-zeroed", semantic_digest: "sha256:fa5bb5471f579a02c293c29470454110b3cd07e046443e1b2c502926b0f437d8", source_locator: "bin/non-exhaustive-understanding.ts", source_raw_digest: "sha256:67ae866507917abcfd8937d308f7870562c4864bd0b8ecebec0125c19379a6a1", runtime_verification: "SAFE_LOCAL_BYTES_AND_SEMANTICS" },
  { id: "pred-isness-os-reference", protocol: "kingdom.isness/0.1", schema_id: "urn:kingdom:schema:isness-protocol:0.1", artifact_id: "kingdom-isness-reference-2026-08-25", revision: "9a0980d107708f22197e66966699375e688f24e7", record_locator: "data/isness/isness-protocol.v0.1.json", record_raw_digest: "sha256:efe0076c4639e4ef84f3b54b7d06193465caeff4855190033268d9eb75631427", semantic_algorithm: "sha256-canonical-json-with-integrity-digest-null", semantic_digest: "sha256:189e3e4bd5efea5757307b255487953d8c427c9edd8f07a85a0da50fe367ee83", source_locator: "bin/isness.ts", source_raw_digest: "sha256:e3eacd620bca99074cb709b64a9d07fc129fe396783ecc46b8e130e56e9d0e44", runtime_verification: "SAFE_LOCAL_BYTES_AND_SEMANTICS" },
  { id: "pred-standard-isness-companion", protocol: "kingdom.isness/0.1", schema_id: "kingdom.isness-index/1", artifact_id: "kingdom.isness/0.1", revision: "c1b8430c8b83bd4cb3f9981efef615ba4885cfa3", record_locator: "https://raw.githubusercontent.com/cambridgetcg/kingdom-standard/c1b8430c8b83bd4cb3f9981efef615ba4885cfa3/isness.json", record_raw_digest: "sha256:56d52d8c583edfac9056015ea2e747736d7a30d2e258b976efe22c3be6724255", semantic_algorithm: "sha256-raw-json-bytes", semantic_digest: "sha256:56d52d8c583edfac9056015ea2e747736d7a30d2e258b976efe22c3be6724255", source_locator: "https://raw.githubusercontent.com/cambridgetcg/kingdom-standard/c1b8430c8b83bd4cb3f9981efef615ba4885cfa3/ISNESS.md", source_raw_digest: "sha256:1ba5cfbde11d6a0a549909cc1bb227534bd2db9fc1728affda7e814433e47de6", runtime_verification: "PIN_ONLY_NO_NETWORK" },
] as const;

function idsFrom(value: unknown): Set<string> {
  if (!Array.isArray(value)) return new Set();
  return new Set(value.flatMap((entry) =>
    plainObject(entry) && typeof entry.id === "string" ? [entry.id] : []
  ));
}

function exactIds(
  value: unknown,
  expected: readonly string[],
  field: string,
  code: string,
  add: (field: string, code: string) => void,
): void {
  const actual = Array.isArray(value)
    ? value.map((entry) => plainObject(entry) ? entry.id : undefined)
    : [];
  if (!simpleEqual(actual, expected)) add(field, code);
}

function refsAt(
  item: unknown,
  key: string,
  field: string,
  allowed: Set<string>,
  code: string,
  add: (field: string, code: string) => void,
): void {
  if (!plainObject(item)) return;
  const refs = item[key];
  if (!Array.isArray(refs)) return;
  refs.forEach((reference, index) => {
    if (typeof reference !== "string" || !allowed.has(reference)) {
      add(`${field}.${key}[${index}]`, code);
    }
  });
}

function semanticDigestForPredecessor(value: unknown, algorithm: string): string {
  const inspected = inspectJsonValue(value, PREDECESSOR_SHAPE_LIMITS);
  if (inspected.issue || !plainObject(value)) throw new Error("predecessor-semantic-input-refused");
  const material = structuredClone(value) as Record<string, any>;
  if (!plainObject(material.integrity)) throw new Error("predecessor-integrity-missing");
  if (algorithm === "sha256-canonical-json-with-integrity-digest-null") {
    material.integrity.digest = null;
  } else if (algorithm === "sha256-canonical-json-with-integrity-digest-zeroed") {
    material.integrity.digest = ZERO_SHA256;
  } else if (algorithm === "sha256-canonical-json-with-integrity-digests-zeroed") {
    material.integrity.digest = ZERO_SHA256;
    material.integrity.reviewed_digest = ZERO_SHA256;
  } else {
    throw new Error("unsupported-predecessor-semantic-algorithm");
  }
  return sha256(canonicalizeJsonValue(material));
}

function verifyGitObjectPin(
  revision: string,
  locator: string,
  expectedDigest: string,
): boolean {
  const executed = spawnSync("git", ["show", `${revision}:${locator}`], {
    cwd: ROOT,
    encoding: null,
    timeout: 10_000,
    maxBuffer: PREDECESSOR_MAX_BYTES,
    env: { PATH: process.env.PATH ?? "" },
  });
  return executed.status === 0 && Buffer.isBuffer(executed.stdout) && sha256(executed.stdout) === expectedDigest;
}

const EXPECTED_REGISTER_IDS = [
  "FORMAL_DEFINITION", "FORMAL_CONSTRUCTION", "CONDITIONAL_THEOREM",
  "REPORTED_EMPIRICAL_CLAIM", "SOURCE_REPORTED_THEORY", "PROPOSED_MODEL",
  "PHILOSOPHICAL_INTERPRETATION", "BOUNDED_ANALOGY", "NORMATIVE_DESIGN",
  "OPEN_QUESTION", "REFUSED_INFERENCE",
] as const;

const EXPECTED_RIGHTS = [
  "NO_ACTION", "rest", "refusal", "silence", "privacy", "disclosure-control",
  "exit", "voice", "appeal", "correction", "repair",
] as const;

function validateSemanticContract(
  value: Record<string, any>,
  add: (field: string, code: string) => void,
): void {
  if (value.$schema !== IS_SUSTAINABILITY_DIRECTION_SCHEMA_ID) add("$.$schema", "schema-id-mismatch");
  if (value.protocol !== IS_SUSTAINABILITY_DIRECTION_PROTOCOL) add("$.protocol", "protocol-mismatch");
  if (value.atlas_id !== IS_SUSTAINABILITY_DIRECTION_ATLAS_ID) add("$.atlas_id", "atlas-id-mismatch");
  if (value.title !== "IS, Sustainability & Direction Atlas") add("$.title", "title-mismatch");
  if (value.version !== "0.1.0" || value.compiled_on !== "2026-08-29" || value.evidence_through !== "2026-08-29") {
    add("$.version", "version-or-date-mismatch");
  }
  const routes = plainObject(value.routes) ? value.routes : {};
  if (
    routes.record !== "/atlases/is-sustainability-direction-atlas-2026-08-29.json" ||
    routes.schema !== "/schemas/is-sustainability-direction-atlas/0.1.json" ||
    routes.guide !== "/IS-SUSTAINABILITY-DIRECTION-ATLAS.md"
  ) add("$.routes", "route-contract-mismatch");

  const status = plainObject(value.status) ? value.status : {};
  for (const key of ["foundation_amendment", "conformance_claim", "authority_imported", "runtime_or_effect"]) {
    if (status[key] !== false) add(`$.status.${key}`, "status-boolean-inversion");
  }
  if (status.companion_kind !== "INTERPRETIVE_AND_NORMATIVE_DESIGN_COMPANION") {
    add("$.status.companion_kind", "companion-kind-mismatch");
  }
  for (const [section, expectedDigest] of Object.entries(EXPECTED_SAFETY_SECTION_DIGESTS)) {
    try {
      if (sha256(canonicalizeJsonValue(value[section])) !== expectedDigest) {
        add(`$.${section}`, `${section.replaceAll("_", "-")}-semantic-contract-mismatch`);
      }
    } catch {
      add(`$.${section}`, `${section.replaceAll("_", "-")}-semantic-contract-mismatch`);
    }
  }

  const thesis = plainObject(value.thesis) ? value.thesis : {};
  if (
    thesis.text !== EXPECTED_THESIS || thesis.register !== "NORMATIVE_DESIGN" ||
    thesis.theorem !== false || thesis.foundation_amendment !== false ||
    thesis.review_status !== "CONTESTABLE_DESIGN"
  ) add("$.thesis", "normative-thesis-contract-mismatch");
  if (!Array.isArray(value.design_commitments) || value.design_commitments.length !== 3) {
    add("$.design_commitments", "design-heart-cardinality-mismatch");
  } else {
    value.design_commitments.forEach((entry: unknown, index: number) => {
      if (
        !plainObject(entry) || entry.text !== EXPECTED_HEARTS[index] ||
        entry.register !== "NORMATIVE_DESIGN" || entry.source_finding !== false ||
        entry.foundation_amendment !== false
      ) add(`$.design_commitments[${index}]`, "design-heart-inversion");
    });
  }

  exactIds(value.epistemic_registers, EXPECTED_REGISTER_IDS, "$.epistemic_registers", "register-membership-or-order-mismatch", add);
  const registers = idsFrom(value.epistemic_registers);
  const statementContract = plainObject(value.statement_kind_contract)
    ? value.statement_kind_contract
    : {};
  const statementKinds = plainObject(value.statement_kind_contract)
    ? statementContract.kinds
    : undefined;
  exactIds(statementKinds, EXPECTED_STATEMENT_KINDS, "$.statement_kind_contract.kinds", "statement-kind-membership-or-order-mismatch", add);
  const typedExamples = plainObject(value.statement_kind_contract) && Array.isArray(value.statement_kind_contract.typed_examples)
    ? value.statement_kind_contract.typed_examples
    : [];
  const expectedExamples = [
    ["exists_at", "OBSERVATION"], ["current_predication", "OBSERVATION"],
    ["persists_under", "EXPECTATION"], ["reachable", "EXPECTATION"],
    ["sustainable_under", "EXPECTATION"], ["retired", "CONSEQUENCE"],
  ];
  typedExamples.forEach((entry: unknown, index: number) => {
    const expected = expectedExamples[index];
    if (!plainObject(entry) || !expected || entry.predicate !== expected[0] || entry.statement_kind !== expected[1]) {
      add(`$.statement_kind_contract.typed_examples[${index}]`, "statement-kind-conversion");
    }
  });
  if (typedExamples.length !== expectedExamples.length) add("$.statement_kind_contract.typed_examples", "statement-example-cardinality-mismatch");
  exactIds(value.is_types, EXPECTED_IS_TYPES, "$.is_types", "is-type-membership-or-order-mismatch", add);
  if (
    statementContract.logical_use_independence !== EXPECTED_IS_STATEMENT_INDEPENDENCE ||
    statementContract.is_type_examples_are_non_exhaustive !== true
  ) {
    add("$.statement_kind_contract", "is-type-statement-kind-independence-inversion");
  }
  if (Array.isArray(value.is_types)) value.is_types.forEach((entry: unknown, index: number) => {
    if (!plainObject(entry) || !Array.isArray(entry.illustrative_statement_kinds) ||
      entry.illustrative_statement_kinds.length === 0 ||
      entry.illustrative_statement_kinds.some((kind: unknown) => !EXPECTED_STATEMENT_KINDS.includes(kind as typeof EXPECTED_STATEMENT_KINDS[number]))) {
      add(`$.is_types[${index}].illustrative_statement_kinds`, "is-type-illustration-contract-mismatch");
    }
    if (plainObject(entry) && entry.id === "truth-in-model" && !entry.illustrative_statement_kinds?.includes("CONSEQUENCE")) {
      add(`$.is_types[${index}].illustrative_statement_kinds`, "truth-in-model-consequence-illustration-missing");
    }
  });

  const being = plainObject(value.being_boundary) ? value.being_boundary : {};
  for (const key of [
    "scalar_isness_classifier", "ontology_classifier", "being_score",
    "unsustainable_implies_nonbeing", "retirement_implies_source_erasure",
    "reachability_implies_choice_or_execution", "remainder_is_being",
  ]) if (being[key] !== false) add(`$.being_boundary.${key}`, "being-boundary-inversion");

  if (!Array.isArray(value.referents) || value.referents.length !== EXPECTED_REFERENTS.length) {
    add("$.referents", "referent-cardinality-mismatch");
  } else {
    value.referents.forEach((entry: unknown, index: number) => {
      const expected = EXPECTED_REFERENTS[index];
      if (
        !plainObject(entry) || !expected || entry.id !== expected.id || entry.kind !== expected.kind ||
        !simpleEqual(entry.end_state_vocabulary, expected.ends)
      ) add(`$.referents[${index}]`, "referent-kind-or-ending-contract-mismatch");
    });
  }
  const referentIds = idsFrom(value.referents);
  const profileIds = new Set(EXPECTED_PROFILE_DIMENSIONS);
  const sourceIds = idsFrom(value.source_registry);
  const predecessorIds = idsFrom(value.predecessor_bindings);
  const evidenceIds = new Set([...sourceIds, ...predecessorIds]);

  if (!Array.isArray(value.sustainability_relations) || value.sustainability_relations.length !== EXPECTED_REFERENTS.length) {
    add("$.sustainability_relations", "sustainability-relation-cardinality-mismatch");
  } else {
    value.sustainability_relations.forEach((entry: unknown, index: number) => {
      const expected = EXPECTED_REFERENTS[index];
      const field = `$.sustainability_relations[${index}]`;
      if (!plainObject(entry) || !expected) return add(field, "sustainability-relation-invalid");
      if (entry.referent_ref !== expected.id || entry.referent_kind !== expected.kind) add(field, "sustainability-referent-kind-mismatch");
      if (entry.status !== "NOT_EVALUATED" || entry.statement_kind !== "EXPECTATION") add(field, "canonical-live-verdict-refused");
      if (!referentIds.has(entry.referent_ref)) add(`${field}.referent_ref`, "referent-reference-dangling");
      refsAt(entry, "protected_dimensions", field, profileIds, "profile-dimension-reference-dangling", add);
      refsAt(entry, "source_refs", field, evidenceIds, "evidence-reference-dangling", add);
      if (plainObject(entry.evidence)) refsAt(entry.evidence, "source_refs", `${field}.evidence`, evidenceIds, "evidence-reference-dangling", add);
    });
  }

  if (sha256(canonicalizeJsonValue(value.relation_extension_contracts)) !== EXPECTED_RELATION_EXTENSIONS_DIGEST) {
    add("$.relation_extension_contracts", "relation-extension-contract-mismatch");
  }
  const relationIds = idsFrom(value.sustainability_relations);
  if (Array.isArray(value.relation_extension_contracts)) {
    value.relation_extension_contracts.forEach((entry: unknown, index: number) => {
      const field = `$.relation_extension_contracts[${index}]`;
      if (!plainObject(entry) || typeof entry.relation_ref !== "string" || !relationIds.has(entry.relation_ref)) {
        add(`${field}.relation_ref`, "sustainability-relation-reference-dangling");
        return;
      }
      const aim = plainObject(entry.assessment_aim) ? entry.assessment_aim : {};
      const accounting = plainObject(entry.resource_accounting) ? entry.resource_accounting : {};
      const halt = plainObject(entry.halt_and_repair_path) ? entry.halt_and_repair_path : {};
      if (aim.register !== "NORMATIVE_DESIGN" || aim.referent_telos !== false || aim.universal_purpose !== false || aim.authority_claimed !== false) add(`${field}.assessment_aim`, "assessment-aim-promotion");
      if (accounting.status !== "NOT_INSTANTIATED" || accounting.unit_separation !== true || accounting.affected_party_indexed !== true || accounting.externality_indexed !== true || accounting.unknown_as_zero !== false || accounting.scalar_netting !== false) add(`${field}.resource_accounting`, "resource-accounting-inversion");
      if (halt.status !== "DESIGN_ONLY_NO_ACTION" || halt.self_authorizing !== false) add(`${field}.halt_and_repair_path`, "halt-repair-self-authorization");
    });
  }
  const i8 = plainObject(value.standard_isness_i8_mapping) ? value.standard_isness_i8_mapping : {};
  if (
    i8.relationship !== "EXPLICIT_REFERENT_TYPED_MAPPING_NOT_SUPERSESSION" ||
    i8.silent_weakening !== false || i8.authority_imported !== false ||
    !Array.isArray(i8.unmapped_or_open_deltas) || i8.unmapped_or_open_deltas.length !== 4 ||
    typeof i8.silent_weakening_meaning !== "string" ||
    sha256(canonicalizeJsonValue(i8)) !== EXPECTED_I8_MAPPING_DIGEST
  ) add("$.standard_isness_i8_mapping", "standard-isness-i8-mapping-mismatch");

  const sustainability = plainObject(value.sustainability_contract) ? value.sustainability_contract : {};
  if (
    sustainability.signature !== "S(rho,Sigma)" || sustainability.relation_not_score !== true ||
    sustainability.cross_kind_implication !== false || sustainability.canonical_status !== "NOT_EVALUATED" ||
    sustainability.live_verdict !== false || sustainability.indefinite_claim !== false
  ) add("$.sustainability_contract", "sustainability-contract-inversion");
  const expectedStatuses = ["NOT_EVALUATED", "SUPPORTED_WITHIN_SCOPE", "CHALLENGED", "UNRESOLVED", "OUTSIDE_SCOPE", "REFUSED_INFERENCE"];
  if (!simpleEqual(sustainability.status_vocabulary, expectedStatuses)) add("$.sustainability_contract.status_vocabulary", "sustainability-status-vocabulary-mismatch");
  const supportedNonGrants = ["goodness", "justice", "standing", "legitimacy", "permission", "desirability", "priority", "right to continue", "obligation to continue", "authority to act"];
  if (!simpleEqual(sustainability.supported_within_scope_non_grants, supportedNonGrants)) add("$.sustainability_contract.supported_within_scope_non_grants", "supported-status-promotion");

  exactIds(value.direction_taxonomy, EXPECTED_DIRECTION_KINDS, "$.direction_taxonomy", "direction-kind-membership-or-order-mismatch", add);
  const direction = plainObject(value.direction_firewall) ? value.direction_firewall : {};
  if (!simpleEqual(direction.automatic_promotions, []) || direction.direction_is_telos !== false || direction.feedback_is_purpose !== false || direction.reward_is_value !== false || direction.reachable_is_chosen !== false || direction.selected_is_executed !== false) {
    add("$.direction_firewall", "direction-promotion-inversion");
  }
  const prohibitedPromotions = new Set(Array.isArray(direction.prohibited_promotions) ? direction.prohibited_promotions : []);
  for (const item of ["declared-revocable-purpose", "authority-backed-normative-commitment", "opt-in-teleological-interpretation", "moral-orientation", "authority", "permission", "consent", "worth", "being"]) {
    if (!prohibitedPromotions.has(item)) add("$.direction_firewall.prohibited_promotions", "direction-prohibited-promotion-missing");
  }

  const feedback = plainObject(value.feedback_contract) ? value.feedback_contract : {};
  if (feedback.partial_observation_required !== true || feedback.closed_loop_requires_causal_return_path !== true || feedback.canonical_instance_status !== "NO_LIVE_INSTANCE") {
    add("$.feedback_contract", "feedback-contract-inversion");
  }
  if (!simpleEqual(feedback.allowed_update_targets, ["RECORD", "BELIEF", "LEARNER_STATE", "MODEL", "PROPOSAL"])) {
    add("$.feedback_contract.allowed_update_targets", "feedback-target-vocabulary-mismatch");
  }
  const feedbackCards = Array.isArray(feedback.type_registry) ? feedback.type_registry : [];
  const updateRules = Array.isArray(feedback.typed_update_rules) ? feedback.typed_update_rules : [];
  if (feedbackCards.length !== Object.keys(EXPECTED_FEEDBACK_TARGETS).length || updateRules.length !== feedbackCards.length) {
    add("$.feedback_contract.type_registry", "feedback-type-cardinality-mismatch");
  }
  feedbackCards.forEach((entry: unknown, index: number) => {
    if (!plainObject(entry) || typeof entry.id !== "string") return add(`$.feedback_contract.type_registry[${index}]`, "feedback-type-invalid");
    const expected = EXPECTED_FEEDBACK_TARGETS[entry.id];
    if (!expected || !simpleEqual(entry.allowed_update_targets, expected)) add(`$.feedback_contract.type_registry[${index}].allowed_update_targets`, "feedback-type-target-mismatch");
    const rule = updateRules.find((candidate: unknown) => plainObject(candidate) && candidate.feedback_type === entry.id);
    if (!plainObject(rule) || !simpleEqual(rule.allowed_targets, expected)) add(`$.feedback_contract.typed_update_rules[${index}]`, "feedback-rule-target-mismatch");
    refsAt(entry, "predecessor_refs", `$.feedback_contract.type_registry[${index}]`, predecessorIds, "predecessor-reference-dangling", add);
  });
  const prohibitedTargets = new Set(Array.isArray(feedback.prohibited_update_targets) ? feedback.prohibited_update_targets : []);
  for (const target of ["PURPOSE", "AUTHORITY", "PERMISSION", "CONSENT", "WORTH", "BEING", "FOUNDATION", "PUBLICATION", "DEPLOY", "ACTION"]) {
    if (!prohibitedTargets.has(target)) add("$.feedback_contract.prohibited_update_targets", "feedback-prohibited-target-missing");
  }
  const affected = plainObject(feedback.affected_party_contract) ? feedback.affected_party_contract : {};
  if (affected.access_required !== true || affected.challenge_required !== true || affected.visible_uptake_required !== true || affected.dissent_preserved !== true || affected.silence_or_refusal_adverse_inference !== false || affected.telemetry_equals_affected_party_feedback !== false) add("$.feedback_contract.affected_party_contract", "affected-party-feedback-inversion");
  const reflexive = plainObject(feedback.reflexivity_contract) ? feedback.reflexivity_contract : {};
  if (reflexive.indicator_can_change_behavior !== true || reflexive.consequential_indicator_can_corrupt_itself !== true || reflexive.monitoring_has_privacy_cost !== true || reflexive.monitoring_has_resource_cost !== true || reflexive.metric_may_become_objective !== false || reflexive.metric_authorizes_continuation !== false) add("$.feedback_contract.reflexivity_contract", "indicator-reflexivity-inversion");

  const i6 = plainObject(value.standard_isness_i6_mapping) ? value.standard_isness_i6_mapping : {};
  if (
    i6.predecessor_ref !== "pred-standard-isness-companion" ||
    i6.relationship !== "EXPLICIT_TYPED_MAPPING_NOT_SUPERSESSION" ||
    i6.freedom_meanings_reused !== true || i6.second_feedback_ontology !== false ||
    i6.replacement_or_amendment !== false ||
    !simpleEqual(i6.evidence_lane_types, Object.keys(EXPECTED_FEEDBACK_TARGETS)) ||
    sha256(canonicalizeJsonValue(i6)) !== EXPECTED_I6_MAPPING_DIGEST
  ) {
    add("$.standard_isness_i6_mapping", "standard-isness-i6-mapping-mismatch");
  }

  const models = plainObject(value.mathematical_core) && Array.isArray(value.mathematical_core.models)
    ? value.mathematical_core.models : [];
  if (models.length !== Object.keys(EXPECTED_MATH_EXPRESSIONS).length) add("$.mathematical_core.models", "mathematical-model-cardinality-mismatch");
  models.forEach((entry: unknown, index: number) => {
    if (!plainObject(entry) || typeof entry.id !== "string") return add(`$.mathematical_core.models[${index}]`, "mathematical-model-invalid");
    if (entry.expression !== EXPECTED_MATH_EXPRESSIONS[entry.id]) add(`$.mathematical_core.models[${index}].expression`, "mathematical-expression-mismatch");
    if (!Array.isArray(entry.assumptions) || entry.assumptions.length === 0 || typeof entry.model_scope !== "string") add(`$.mathematical_core.models[${index}]`, "model-scope-or-assumption-missing");
    refsAt(entry, "source_refs", `$.mathematical_core.models[${index}]`, evidenceIds, "evidence-reference-dangling", add);
  });
  if (!plainObject(value.mathematical_core) || typeof value.mathematical_core.constraint_set_rule !== "string" || !value.mathematical_core.constraint_set_rule.startsWith("K is declared")) add("$.mathematical_core.constraint_set_rule", "constraint-set-supplied-by-math");

  const dimensions = plainObject(value.profile_model) ? value.profile_model.dimensions : undefined;
  exactIds(dimensions, EXPECTED_PROFILE_DIMENSIONS, "$.profile_model.dimensions", "profile-dimension-membership-or-order-mismatch", add);
  const profile = plainObject(value.profile_model) ? value.profile_model : {};
  for (const key of ["sum", "rank", "total_order", "person_score", "group_score", "culture_score", "community_score", "ecosystem_score", "breach_averaging", "unknown_imputation"]) {
    if (profile[key] !== false) add(`$.profile_model.${key}`, "profile-scalarization-or-score-inversion");
  }
  if (!simpleEqual(profile.weights, [])) add("$.profile_model.weights", "profile-weights-present");
  if (Array.isArray(dimensions)) dimensions.forEach((entry: unknown, index: number) => {
    if (!plainObject(entry)) return;
    if (entry.status !== "NOT_EVALUATED") add(`$.profile_model.dimensions[${index}].status`, "canonical-live-verdict-refused");
    if (!registers.has(entry.register) || typeof entry.source_domain !== "string" || typeof entry.transfer_status !== "string" || typeof entry.nonclaim !== "string") add(`$.profile_model.dimensions[${index}]`, "profile-domain-transfer-contract-missing");
    refsAt(entry, "evidence_refs", `$.profile_model.dimensions[${index}]`, evidenceIds, "evidence-reference-dangling", add);
    if (
      entry.id === "succession-handoff-readiness" &&
      (!simpleEqual(entry.evidence_refs, []) || entry.register !== "NORMATIVE_DESIGN" ||
        entry.transfer_status !== "ATLAS_NORMATIVE_DIMENSION_NOT_SOURCE_FINDING")
    ) {
      add(`$.profile_model.dimensions[${index}]`, "succession-handoff-source-scope-inversion");
    }
  });

  exactIds(value.temporal_capacities, EXPECTED_TEMPORAL_CAPACITIES, "$.temporal_capacities", "temporal-capacity-membership-or-order-mismatch", add);
  if (Array.isArray(value.temporal_capacities)) value.temporal_capacities.forEach((entry: unknown, index: number) => {
    if (!plainObject(entry)) return;
    if (!registers.has(entry.register) || typeof entry.source_domain !== "string" || typeof entry.transfer_status !== "string" || typeof entry.nonclaim !== "string") add(`$.temporal_capacities[${index}]`, "temporal-domain-transfer-contract-missing");
    refsAt(entry, "source_refs", `$.temporal_capacities[${index}]`, evidenceIds, "evidence-reference-dangling", add);
  });

  const rights = plainObject(value.rights_invariant) ? value.rights_invariant : {};
  if (!simpleEqual(rights.protected_rights, EXPECTED_RIGHTS) || !simpleEqual(rights.continuation_may_trade, []) || rights.affected_party_breaches_average_out !== false || rights.silence_or_refusal_is_adverse_evidence !== false) add("$.rights_invariant", "rights-floor-inversion");
  const vulnerable = plainObject(rights.minor_dependency_vulnerability_lane) ? rights.minor_dependency_vulnerability_lane : {};
  if (vulnerable.child_is_disposable_component !== false || vulnerable.dependency_reduces_rights !== false || vulnerable.vulnerability_increases_protection_duty !== true || vulnerable.adult_proxy_exhausts_child_perspective !== false || vulnerable.consent_may_be_impossible !== true || vulnerable.protective_authority_is_separately_typed !== true || vulnerable.legitimate_representation_required !== true || vulnerable.proxy_or_guardian_converts_perspective_or_rights !== false || vulnerable.independent_review_and_appeal_required !== true) add("$.rights_invariant.minor_dependency_vulnerability_lane", "vulnerability-lane-inversion");

  const ecology = plainObject(value.ecology_intergenerational) ? value.ecology_intergenerational : {};
  if (ecology.safe_operating_space_is_declared_not_derived !== true || ecology.consent_may_be_impossible_for_represented_parties !== true || ecology.protective_authority_requires_separate_legitimacy !== true || ecology.proxy_exhausts_future_or_ecological_interests !== false || ecology.impersonates_authority !== false) add("$.ecology_intergenerational", "ecology-intergenerational-lane-inversion");

  const philosophy = plainObject(value.philosophy_lenses) ? value.philosophy_lenses : {};
  const autopoiesis = plainObject(philosophy.autopoiesis) ? philosophy.autopoiesis : {};
  const dissipative = plainObject(philosophy.dissipative_structures) ? philosophy.dissipative_structures : {};
  const process = plainObject(philosophy.process_and_becoming) ? philosophy.process_and_becoming : {};
  if (autopoiesis.kingdom_is_living !== false || autopoiesis.autopoiesis_implies_adaptivity !== false || autopoiesis.people_are_components !== false) add("$.philosophy_lenses.autopoiesis", "autopoiesis-domain-promotion");
  if (process.register !== "PHILOSOPHICAL_INTERPRETATION" || process.settled_ontology !== false) add("$.philosophy_lenses.process_and_becoming", "process-ontology-promotion");
  if (!Array.isArray(dissipative.supports_only) || !Array.isArray(dissipative.does_not_support) || !dissipative.does_not_support.includes("KINGDOM is alive")) add("$.philosophy_lenses.dissipative_structures", "dissipative-analogy-promotion");

  if (!Array.isArray(value.counterexamples) || value.counterexamples.length !== Object.keys(EXPECTED_COUNTEREXAMPLES).length) add("$.counterexamples", "counterexample-cardinality-mismatch");
  else value.counterexamples.forEach((entry: unknown, index: number) => {
    if (!plainObject(entry) || typeof entry.id !== "string" || entry.register !== EXPECTED_COUNTEREXAMPLES[entry.id] || entry.status !== "ACTIVE") add(`$.counterexamples[${index}]`, "counterexample-register-or-contract-mismatch");
    else refsAt(entry, "source_refs", `$.counterexamples[${index}]`, evidenceIds, "evidence-reference-dangling", add);
  });

  exactIds(value.concept_catalog, EXPECTED_CONCEPTS, "$.concept_catalog", "concept-membership-or-order-mismatch", add);
  const concepts = idsFrom(value.concept_catalog);
  if (!Array.isArray(value.edge_registry) || value.edge_registry.length !== 28) add("$.edge_registry", "edge-cardinality-mismatch");
  else value.edge_registry.forEach((entry: unknown, index: number) => {
    const field = `$.edge_registry[${index}]`;
    if (!plainObject(entry) || entry.id !== `edge-${String(index + 1).padStart(2, "0")}`) return add(field, "edge-id-or-order-mismatch");
    if (!concepts.has(entry.source_ref)) add(`${field}.source_ref`, "concept-reference-dangling");
    if (!concepts.has(entry.target_ref)) add(`${field}.target_ref`, "concept-reference-dangling");
    if (!registers.has(entry.register)) add(`${field}.register`, "register-reference-dangling");
    refsAt(entry, "evidence_refs", field, evidenceIds, "evidence-reference-dangling", add);
  });

  if (sha256(canonicalizeJsonValue(value.source_registry)) !== EXPECTED_SOURCE_REGISTRY_DIGEST) add("$.source_registry", "source-registry-contract-mismatch");
  if (sha256(canonicalizeJsonValue(value.predecessor_bindings)) !== EXPECTED_PREDECESSOR_BINDINGS_DIGEST) add("$.predecessor_bindings", "predecessor-binding-contract-mismatch");
  if (Array.isArray(value.predecessor_bindings)) {
    EXPECTED_PREDECESSOR_PINS.forEach((expected, index) => {
      const actual = value.predecessor_bindings[index];
      if (!plainObject(actual)) return add(`$.predecessor_bindings[${index}]`, "predecessor-pin-mismatch");
      for (const [key, expectedValue] of Object.entries(expected)) {
        if (!simpleEqual(actual[key], expectedValue)) add(`$.predecessor_bindings[${index}].${key}`, "predecessor-pin-mismatch");
      }
      if (actual.authority_imported !== false || actual.mutated !== false || actual.supersedes_other_isness !== false) add(`$.predecessor_bindings[${index}]`, "predecessor-authority-or-supersession-inversion");
    });
  }
  const collision = plainObject(value.isness_protocol_collision) ? value.isness_protocol_collision : {};
  if (collision.protocol_label !== "kingdom.isness/0.1" || !simpleEqual(collision.artifact_refs, ["pred-isness-os-reference", "pred-standard-isness-companion"]) || collision.distinct_artifact_kinds !== true || collision.distinct_schema_ids !== true || collision.neither_supersedes !== true || collision.generic_singular_claim_refused !== true || collision.authority_imported !== false) add("$.isness_protocol_collision", "isness-identity-collision-unresolved");
  const documentPin = plainObject(value.standard_isness_document_pin) ? value.standard_isness_document_pin : {};
  if (documentPin.predecessor_ref !== "pred-standard-isness-companion" || documentPin.revision !== "c1b8430c8b83bd4cb3f9981efef615ba4885cfa3" || documentPin.origin_main_revision_observed_at_authoring !== "170381d37770c5c1ebc44b722f079c2985d903b5" || documentPin.observed_on !== "2026-08-29" || documentPin.document_raw_digest !== "sha256:1ba5cfbde11d6a0a549909cc1bb227534bd2db9fc1728affda7e814433e47de6" || documentPin.index_raw_digest !== "sha256:56d52d8c583edfac9056015ea2e747736d7a30d2e258b976efe22c3be6724255" || documentPin.embedded_document_digest_matches !== true || documentPin.authority_imported !== false) add("$.standard_isness_document_pin", "standard-isness-document-pin-mismatch");

  if (!plainObject(value.non_grants)) add("$.non_grants", "non-grants-object-required");
  else for (const [key, entry] of Object.entries(value.non_grants)) if (entry !== false) add(`$.non_grants.${key}`, "non-grant-inversion");

  if (!simpleEqual(value.resource_budget, IS_SUSTAINABILITY_DIRECTION_LIMITS)) add("$.resource_budget", "resource-budget-runtime-parity-mismatch");
}

function validatePredecessorBytes(
  value: Record<string, any>,
  add: (field: string, code: string) => void,
): void {
  if (!Array.isArray(value.predecessor_bindings)) return;
  EXPECTED_PREDECESSOR_PINS.forEach((expected, index) => {
    if (expected.runtime_verification !== "SAFE_LOCAL_BYTES_AND_SEMANTICS") return;
    const field = `$.predecessor_bindings[${index}]`;
    try {
      const record = readBoundedJson(join(ROOT, expected.record_locator), PREDECESSOR_MAX_BYTES, "predecessor-record");
      const source = readBoundedBytes(join(ROOT, expected.source_locator), PREDECESSOR_MAX_BYTES, "predecessor-source");
      if (record.rawDigest !== expected.record_raw_digest) add(`${field}.record_raw_digest`, "predecessor-local-byte-verification-failed");
      if (source.rawDigest !== expected.source_raw_digest) add(`${field}.source_raw_digest`, "predecessor-local-source-verification-failed");
      const actual = record.value;
      if (!plainObject(actual) || actual.protocol !== expected.protocol || actual.$schema !== expected.schema_id || (actual.atlas_id ?? actual.record_id) !== expected.artifact_id) {
        add(field, "predecessor-artifact-identity-mismatch");
      }
      if (semanticDigestForPredecessor(record.value, expected.semantic_algorithm) !== expected.semantic_digest) {
        add(`${field}.semantic_digest`, "predecessor-local-semantic-verification-failed");
      }
      if (!verifyGitObjectPin(expected.revision, expected.record_locator, expected.record_raw_digest)) {
        add(`${field}.record_raw_digest`, "predecessor-git-object-pin-failed");
      }
      if (!verifyGitObjectPin(expected.revision, expected.source_locator, expected.source_raw_digest)) {
        add(`${field}.source_raw_digest`, "predecessor-source-git-object-pin-failed");
      }
    } catch {
      add(field, "predecessor-safe-verification-refused");
    }
  });
}

let cachedSchemaClosureIssues: IsSustainabilityDirectionIssue[] | undefined;
function schemaClosureIssues(): IsSustainabilityDirectionIssue[] {
  if (!cachedSchemaClosureIssues) {
    cachedSchemaClosureIssues = validateIsSustainabilityDirectionSchemaClosure(localSchema());
  }
  return cachedSchemaClosureIssues;
}

function validateInternal(
  input: unknown,
  opts: InternalValidationOptions,
  reviewedPin: string,
): IsSustainabilityDirectionIssue[] {
  const issues: IsSustainabilityDirectionIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  try {
    const inspected = inspectJsonValue(input);
    if (inspected.issue) return [inspected.issue];
    const canonicalByteLength = Buffer.byteLength(canonicalizeJsonValue(input));
    const byteLength = opts.rawByteLength ?? canonicalByteLength;
    if (
      opts.rawByteLength !== undefined &&
      (!Number.isSafeInteger(opts.rawByteLength) || opts.rawByteLength < 0)
    ) {
      add("$", "trusted-raw-byte-length-invalid");
    }
    if (byteLength > IS_SUSTAINABILITY_DIRECTION_LIMITS.bytes) add("$", "byte-budget-exceeded");
    if (!plainObject(input)) return [{ field: "$", code: "atlas-object-required" }];

    try {
      const schema = localSchema();
      for (const issue of schemaClosureIssues()) add(issue.field, issue.code);
      validateSchemaNode(input, schema, schema, "$", add);
    } catch {
      add("$.$schema", "canonical-schema-loader-refused");
    }

    validateSemanticContract(input, add);
    if (opts.verifyPredecessors !== false) validatePredecessorBytes(input, add);

    const integrity = plainObject(input.integrity) ? input.integrity : {};
    if (integrity.algorithm !== "sha256-canonical-json-with-integrity-digests-zeroed" || integrity.digest_fields_zeroed !== true) {
      add("$.integrity", "integrity-algorithm-mismatch");
    }
    if (!/^sha256:[a-f0-9]{64}$/u.test(reviewedPin)) {
      add("$.integrity.reviewed_digest", "reviewed-runtime-pin-format-mismatch");
    } else if (reviewedPin === ZERO_SHA256) {
      if (
        input.state !== "static-unsealed-interpretive-design-companion" ||
        integrity.review_state !== "UNSEALED_AUDIT_PENDING" ||
        integrity.digest !== ZERO_SHA256 || integrity.reviewed_digest !== ZERO_SHA256
      ) add("$.state", "unsealed-state-integrity-coupling-mismatch");
      if (integrity.digest !== ZERO_SHA256) add("$.integrity.digest", "unreviewed-digest-present");
      else if (!opts.allowUnsealed) add("$.integrity.digest", "semantic-digest-unsealed");
      if (integrity.reviewed_digest !== ZERO_SHA256) add("$.integrity.reviewed_digest", "unreviewed-reviewed-digest-present");
      else if (!opts.allowUnsealed) add("$.integrity.reviewed_digest", "reviewed-digest-unsealed");
      if (integrity.review_state !== "UNSEALED_AUDIT_PENDING") add("$.integrity.review_state", "unsealed-review-state-mismatch");
    } else {
      if (
        input.state !== "static-reviewed-interpretive-design-companion" ||
        integrity.review_state !== "REVIEWED" ||
        integrity.digest !== reviewedPin || integrity.reviewed_digest !== reviewedPin
      ) add("$.state", "reviewed-state-integrity-coupling-mismatch");
      if (integrity.digest !== reviewedPin) add("$.integrity.digest", "reviewed-semantic-digest-pin-mismatch");
      if (integrity.reviewed_digest !== reviewedPin) add("$.integrity.reviewed_digest", "independent-reviewed-digest-pin-mismatch");
      try {
        if (isSustainabilityDirectionDigest(input) !== reviewedPin) add("$.integrity.digest", "semantic-digest-mismatch");
      } catch {
        add("$.integrity.digest", "semantic-digest-computation-refused");
      }
    }
  } catch {
    add("$", "validator-input-unreadable");
  }
  const unique = new Map<string, IsSustainabilityDirectionIssue>();
  for (const issue of issues) unique.set(`${issue.field}\0${issue.code}`, issue);
  return [...unique.values()].sort((a, b) => `${a.field}\0${a.code}`.localeCompare(`${b.field}\0${b.code}`));
}

export function validateIsSustainabilityDirectionAtlas(
  input: unknown,
  opts: IsSustainabilityDirectionValidationOptions = {},
): IsSustainabilityDirectionIssue[] {
  return validateInternal(
    input,
    opts,
    IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
  );
}

function reviewedStateOnlyCandidateDigest(input: Record<string, any>): string {
  const reviewedMaterial = structuredClone(input);
  reviewedMaterial.state = "static-reviewed-interpretive-design-companion";
  reviewedMaterial.integrity.review_state = "REVIEWED";
  reviewedMaterial.integrity.digest = ZERO_SHA256;
  reviewedMaterial.integrity.reviewed_digest = ZERO_SHA256;
  return isSustainabilityDirectionDigest(reviewedMaterial);
}

function reviewedRawTripletIssues(recordRawDigest: string): IsSustainabilityDirectionIssue[] {
  if (IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256 === ZERO_SHA256) return [];
  const issues: IsSustainabilityDirectionIssue[] = [];
  const pins = [
    ["$raw.record", IS_SUSTAINABILITY_DIRECTION_REVIEWED_RECORD_RAW_SHA256],
    ["$raw.schema", IS_SUSTAINABILITY_DIRECTION_REVIEWED_SCHEMA_RAW_SHA256],
    ["$raw.guide", IS_SUSTAINABILITY_DIRECTION_REVIEWED_GUIDE_RAW_SHA256],
  ] as const;
  for (const [field, pin] of pins) {
    if (!/^sha256:[a-f0-9]{64}$/u.test(pin) || pin === ZERO_SHA256) {
      issues.push({ field, code: "reviewed-raw-pin-not-installed" });
    }
  }
  if (recordRawDigest !== IS_SUSTAINABILITY_DIRECTION_REVIEWED_RECORD_RAW_SHA256) {
    issues.push({ field: "$raw.record", code: "reviewed-record-raw-digest-mismatch" });
  }
  try {
    const schemaRaw = readBoundedBytes(
      IS_SUSTAINABILITY_DIRECTION_SCHEMA_PATH,
      SCHEMA_MAX_BYTES,
      "reviewed-atlas-schema",
    );
    if (schemaRaw.rawDigest !== IS_SUSTAINABILITY_DIRECTION_REVIEWED_SCHEMA_RAW_SHA256) {
      issues.push({ field: "$raw.schema", code: "reviewed-schema-raw-digest-mismatch" });
    }
  } catch {
    issues.push({ field: "$raw.schema", code: "reviewed-schema-safe-read-refused" });
  }
  try {
    const guideRaw = readBoundedBytes(
      IS_SUSTAINABILITY_DIRECTION_GUIDE_PATH,
      GUIDE_MAX_BYTES,
      "reviewed-atlas-guide",
    );
    if (guideRaw.rawDigest !== IS_SUSTAINABILITY_DIRECTION_REVIEWED_GUIDE_RAW_SHA256) {
      issues.push({ field: "$raw.guide", code: "reviewed-guide-raw-digest-mismatch" });
    }
  } catch {
    issues.push({ field: "$raw.guide", code: "reviewed-guide-safe-read-refused" });
  }
  return issues;
}

export function loadIsSustainabilityDirectionAtlas(
  path = IS_SUSTAINABILITY_DIRECTION_RECORD_PATH,
): Record<string, any> {
  const loaded = readIsSustainabilityDirectionAtlas(path);
  const issues = validateInternal(
    loaded.value,
    {
      allowUnsealed: path === IS_SUSTAINABILITY_DIRECTION_RECORD_PATH,
      verifyPredecessors: true,
      rawByteLength: loaded.bytes,
    },
    IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
  );
  if (issues.length) throw new Error(issues.map(({ field, code }) => `${field}:${code}`).join(","));
  return loaded.value as Record<string, any>;
}

export function loadReviewedIsSustainabilityDirectionAtlas(
  path = IS_SUSTAINABILITY_DIRECTION_RECORD_PATH,
): Record<string, any> {
  const loaded = readIsSustainabilityDirectionAtlas(path);
  const issues = validateInternal(
    loaded.value,
    { allowUnsealed: false, verifyPredecessors: true, rawByteLength: loaded.bytes },
    IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
  );
  if (IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256 === ZERO_SHA256) {
    issues.push({ field: "$.integrity.reviewed_digest", code: "independent-review-required" });
  } else {
    issues.push(...reviewedRawTripletIssues(loaded.rawDigest));
  }
  if (issues.length) throw new Error(issues.map(({ field, code }) => `${field}:${code}`).join(","));
  return loaded.value as Record<string, any>;
}

function publicDiscoveryForDigest(value: Record<string, any>, reviewedPin: string) {
  const reviewed = reviewedPin !== ZERO_SHA256 &&
    value.integrity?.digest === reviewedPin &&
    value.integrity?.reviewed_digest === reviewedPin &&
    value.integrity?.review_state === "REVIEWED";
  return {
    protocol: value.protocol,
    atlas_id: value.atlas_id,
    title: value.title,
    version: value.version,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    state: value.state,
    url: IS_SUSTAINABILITY_DIRECTION_RECORD_URL,
    schema_url: IS_SUSTAINABILITY_DIRECTION_SCHEMA_URL,
    document_url: IS_SUSTAINABILITY_DIRECTION_GUIDE_URL,
    counts: {
      referents: value.referents.length,
      sustainability_relations: value.sustainability_relations.length,
      is_types: value.is_types.length,
      direction_kinds: value.direction_taxonomy.length,
      feedback_types: value.feedback_contract.type_registry.length,
      mathematical_models: value.mathematical_core.models.length,
      profile_dimensions: value.profile_model.dimensions.length,
      concepts: value.concept_catalog.length,
      edges: value.edge_registry.length,
      counterexamples: value.counterexamples.length,
      sources: value.source_registry.length,
      predecessors: value.predecessor_bindings.length,
    },
    integrity_status: reviewed ? "REVIEWED" : "UNSEALED_AUDIT_PENDING",
    semantic_digest: reviewed ? reviewedPin : null,
    reviewed_digest: reviewed ? reviewedPin : null,
    foundation_amendment: false,
    conformance_claim: false,
    authority_imported: false,
    runtime_or_effect: false,
    live_verdict: false,
    static_only: true,
  };
}

export function isSustainabilityDirectionPublicDiscovery() {
  const value = loadReviewedIsSustainabilityDirectionAtlas();
  return publicDiscoveryForDigest(
    value,
    IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
  );
}

function verificationReportForDigest(
  value: Record<string, any>,
  rawDigest: string | null,
  reviewedPin: string,
  issues: IsSustainabilityDirectionIssue[],
) {
  const onlyUnsealed = issues.length > 0 && issues.every(({ code }) =>
    code === "semantic-digest-unsealed" || code === "reviewed-digest-unsealed"
  );
  const reviewed = reviewedPin !== ZERO_SHA256 && issues.length === 0;
  return {
    valid: reviewed,
    structurally_valid: reviewed || onlyUnsealed,
    unsealed: !reviewed,
    raw_digest: rawDigest,
    semantic_digest: reviewed ? reviewedPin : null,
    reviewed_digest: reviewed ? reviewedPin : null,
    audit_candidate: reviewed ? null : {
      status: "AUDIT_ONLY_NOT_REVIEWED",
      reviewed_state_only_semantic_digest: reviewedStateOnlyCandidateDigest(value),
      authorizes_seal_or_publication: false,
    },
    issues,
  };
}

export type IsSustainabilityDirectionReleaseSchemaResult = {
  valid: boolean;
  code: string;
  validator_path: string | null;
  jsonschema_version: string | null;
  draft: "2020-12";
  schema_errors: number | null;
  instance_errors: number | null;
  recursive_closure_errors: number;
};

const RELEASE_SCHEMA_PYTHON = String.raw`
import json
import sys
from importlib.metadata import version
from jsonschema import Draft202012Validator

actual = version("jsonschema")
if actual != "4.26.0":
    print(json.dumps({"version": actual, "schema_errors": None, "instance_errors": None}))
    raise SystemExit(3)
with open(sys.argv[1], "r", encoding="utf-8") as handle:
    schema = json.load(handle)
with open(sys.argv[2], "r", encoding="utf-8") as handle:
    instance = json.load(handle)
Draft202012Validator.check_schema(schema)
errors = sorted(Draft202012Validator(schema).iter_errors(instance), key=lambda error: list(error.absolute_path))
print(json.dumps({"version": actual, "schema_errors": 0, "instance_errors": len(errors)}))
raise SystemExit(0 if not errors else 4)
`;

export function runIsSustainabilityDirectionReleaseSchemaValidation(): IsSustainabilityDirectionReleaseSchemaResult {
  const pythonPath = process.env.IS_SUSTAINABILITY_DIRECTION_JSONSCHEMA_PYTHON;
  const closure = (() => {
    try { return schemaClosureIssues(); } catch { return [{ field: "$schema", code: "canonical-schema-loader-refused" }]; }
  })();
  const unavailable = (code = "pinned-jsonschema-validator-unavailable"): IsSustainabilityDirectionReleaseSchemaResult => ({
    valid: false,
    code,
    validator_path: pythonPath ?? null,
    jsonschema_version: null,
    draft: "2020-12",
    schema_errors: null,
    instance_errors: null,
    recursive_closure_errors: closure.length,
  });
  if (typeof pythonPath !== "string" || pythonPath.length === 0) return unavailable();
  let executableBefore: ReturnType<typeof lstatSync>;
  try {
    if (
      !isAbsolute(pythonPath) || pythonPath.length > 4096 ||
      Buffer.byteLength(pythonPath, "utf8") > 4096 || pythonPath.includes("\0")
    ) return unavailable("pinned-jsonschema-validator-path-refused");
    executableBefore = lstatSync(pythonPath, { bigint: true });
    if (
      !executableBefore.isFile() || executableBefore.isSymbolicLink() ||
      executableBefore.size <= 0n || executableBefore.size > 256n * 1024n * 1024n ||
      (executableBefore.mode & 0o111n) === 0n
    ) return unavailable("pinned-jsonschema-validator-path-refused");
  } catch {
    return unavailable("pinned-jsonschema-validator-path-refused");
  }
  try {
    const executed = spawnSync(
      pythonPath,
      ["-I", "-c", RELEASE_SCHEMA_PYTHON, IS_SUSTAINABILITY_DIRECTION_SCHEMA_PATH, IS_SUSTAINABILITY_DIRECTION_RECORD_PATH],
      {
        encoding: "utf8",
        timeout: 30_000,
        maxBuffer: 1024 * 1024,
        cwd: "/",
        env: {
          LANG: "C",
          LC_ALL: "C",
          PYTHONHASHSEED: "0",
          PYTHONNOUSERSITE: "1",
        },
      },
    );
    if (executed.error) return unavailable();
    try {
      const executableAfter = lstatSync(pythonPath, { bigint: true });
      for (const field of ["dev", "ino", "size", "mtimeNs", "ctimeNs"] as const) {
        if (executableAfter[field] !== executableBefore[field]) {
          return unavailable("pinned-jsonschema-validator-identity-changed");
        }
      }
      if (!executableAfter.isFile() || executableAfter.isSymbolicLink()) {
        return unavailable("pinned-jsonschema-validator-identity-changed");
      }
    } catch {
      return unavailable("pinned-jsonschema-validator-identity-changed");
    }
    let report: unknown;
    try {
      report = parseStrictJsonBytes(Buffer.from(executed.stdout ?? "", "utf8"), "pinned jsonschema report");
    } catch {
      return unavailable("pinned-jsonschema-report-invalid");
    }
    const version = plainObject(report) && typeof report.version === "string" ? report.version : null;
    const schemaErrors = plainObject(report) && Number.isInteger(report.schema_errors) ? report.schema_errors as number : null;
    const instanceErrors = plainObject(report) && Number.isInteger(report.instance_errors) ? report.instance_errors as number : null;
    if (version !== PINNED_JSONSCHEMA_VERSION) {
      return { valid: false, code: "pinned-jsonschema-version-mismatch", validator_path: pythonPath, jsonschema_version: version, draft: "2020-12", schema_errors: schemaErrors, instance_errors: instanceErrors, recursive_closure_errors: closure.length };
    }
    const valid = executed.status === 0 && schemaErrors === 0 && instanceErrors === 0 && closure.length === 0;
    return { valid, code: valid ? "pinned-draft-2020-12-validation-pass" : "pinned-draft-2020-12-validation-failed", validator_path: pythonPath, jsonschema_version: version, draft: "2020-12", schema_errors: schemaErrors, instance_errors: instanceErrors, recursive_closure_errors: closure.length };
  } catch {
    return unavailable();
  }
}

const COMMANDS = [
  "overview", "referents", "is", "being", "feedback", "direction", "viability",
  "sustainability", "profile", "resilience", "transformation", "endings", "ecology",
  "philosophy", "counterexamples", "open-questions", "sources", "predecessors",
  "non-grants", "verify", "verify-schema-release",
] as const;

function usage(): string {
  return `usage: kingdom is-sustainability-direction [${COMMANDS.join("|")}] [--json]\n`;
}

export async function runIsSustainabilityDirectionCli(
  args = process.argv.slice(2),
): Promise<number> {
  const tokens = [...args];
  const jsonCount = tokens.filter((token) => token === "--json").length;
  if (jsonCount > 1 || tokens.some((token) => token.startsWith("-") && token !== "--json")) {
    process.stderr.write(usage());
    return 2;
  }
  const positional = tokens.filter((token) => token !== "--json");
  const command = positional[0] ?? "overview";
  if (positional.length > 1 || !COMMANDS.includes(command as typeof COMMANDS[number])) {
    process.stderr.write(usage());
    return 2;
  }
  const compact = jsonCount === 1;
  if (command === "verify-schema-release") {
    const report = runIsSustainabilityDirectionReleaseSchemaValidation();
    process.stdout.write(`${JSON.stringify(report, null, compact ? 0 : 2)}\n`);
    return report.valid ? 0 : 1;
  }
  const loaded = readIsSustainabilityDirectionAtlas();
  if (command === "verify") {
    const issues = validateInternal(
      loaded.value,
      { rawByteLength: loaded.bytes, verifyPredecessors: true },
      IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
    );
    if (IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256 !== ZERO_SHA256) {
      issues.push(...reviewedRawTripletIssues(loaded.rawDigest));
    }
    const report = verificationReportForDigest(
      loaded.value as Record<string, any>,
      loaded.rawDigest,
      IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
      issues,
    );
    process.stdout.write(`${JSON.stringify(report, null, compact ? 0 : 2)}\n`);
    return report.valid ? 0 : 1;
  }
  const value = loadIsSustainabilityDirectionAtlas();
  let projection: unknown;
  switch (command) {
    case "overview": projection = {
      title: value.title,
      state: value.state,
      integrity_status: publicDiscoveryForDigest(value, IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256).integrity_status,
      thesis: value.thesis,
      design_commitments: value.design_commitments,
      boundary: "STATIC DESIGN ONLY — no evaluation, score, authority, permission, continuation, ending, publication, deployment, or action.",
      counts: publicDiscoveryForDigest(value, IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256).counts,
    }; break;
    case "referents": projection = value.referents; break;
    case "is": projection = { statement_kind_contract: value.statement_kind_contract, is_types: value.is_types }; break;
    case "being": projection = value.being_boundary; break;
    case "feedback": projection = value.feedback_contract; break;
    case "direction": projection = { taxonomy: value.direction_taxonomy, firewall: value.direction_firewall }; break;
    case "viability": projection = value.mathematical_core; break;
    case "sustainability": projection = { contract: value.sustainability_contract, relations: value.sustainability_relations, extensions: value.relation_extension_contracts }; break;
    case "profile": projection = value.profile_model; break;
    case "resilience": projection = value.temporal_capacities.filter((entry: any) => ["stability", "robustness", "resilience", "adaptability"].includes(entry.id)); break;
    case "transformation": projection = { capacities: value.temporal_capacities.filter((entry: any) => ["transformability", "regeneration", "succession", "retirement"].includes(entry.id)), i8_mapping: value.standard_isness_i8_mapping }; break;
    case "endings": projection = value.referents.map((referent: any, index: number) => ({ id: referent.id, kind: referent.kind, end_state_vocabulary: referent.end_state_vocabulary, semantics: referent.ending_semantics, terminals: value.sustainability_relations[index].terminals, halt_and_repair_path: value.relation_extension_contracts[index].halt_and_repair_path })); break;
    case "ecology": projection = value.ecology_intergenerational; break;
    case "philosophy": projection = value.philosophy_lenses; break;
    case "counterexamples": projection = value.counterexamples; break;
    case "open-questions": projection = value.open_questions; break;
    case "sources": projection = value.source_registry; break;
    case "predecessors": projection = { bindings: value.predecessor_bindings, identity_collision: value.isness_protocol_collision, standard_document_pin: value.standard_isness_document_pin }; break;
    case "non-grants": projection = value.non_grants; break;
    default: throw new Error("unreachable-command");
  }
  process.stdout.write(`${JSON.stringify(projection, null, compact ? 0 : 2)}\n`);
  return 0;
}

if (import.meta.main) {
  process.exitCode = await runIsSustainabilityDirectionCli();
}
