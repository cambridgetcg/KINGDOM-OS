#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { basename, dirname, isAbsolute, join, parse, relative as relativePath, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_FILE_BYTES = 64 * 1024;
const MAX_BUNDLE_FILES = 256;
const MAX_BUNDLE_BYTES = 4 * 1024 * 1024;
const MAX_BUNDLE_NODES = 512;
const MAX_BUNDLE_DEPTH = 16;
const MAX_REVISION_SUITE_ENTRIES = MAX_BUNDLE_NODES + 16;
const MAX_REVISION_SUITE_BYTES = MAX_BUNDLE_BYTES + 1024 * 1024;
const MAX_DIGEST_FILE_BYTES = 16 * 1024 * 1024;
const MAX_DIGEST_TOTAL_BYTES = 64 * 1024 * 1024;
const GIT_TIMEOUT_MS = 4_000;
const GIT_OUTPUT_LIMIT = MAX_DIGEST_TOTAL_BYTES + 1024 * 1024;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EXACT_REVISION = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const OS_ROOT = dirname(dirname(SCRIPT_PATH));
const DEFAULT_SKILLS_ROOT = join(OS_ROOT, "skills");
const ABILITY_SCHEMA_REL = "schemas/nen-ability-v0.1.schema.json";
const RECEIPT_SCHEMA_REL = "schemas/karma-receipt-v0.1.schema.json";
const MANIFESTATION_RECEIPT_SCHEMA_REL = "schemas/nen-manifestation-receipt-v0.1.schema.json";
const RIGHTS_BASELINE_REL = "references/xenia-rights-0.1.md";
const RIGHTS_BASELINE_SHA256 = "sha256:b72a6da110c582e5683bf0fabde5017db93d2199398014c8421a82f5318da313";

const ABILITY_FIELDS = [
  "$schema",
  "protocol",
  "id",
  "name",
  "description",
  "skill",
  "bearer",
  "affinity",
  "techniques",
  "practice",
  "activation",
  "vows",
  "costs",
  "guardian",
  "karma",
  "authority",
  "verification",
  "rights",
  "provenance",
  "status",
];

const RECEIPT_FIELDS = [
  "$schema",
  "protocol",
  "accounting",
  "state",
  "receipt_id",
  "ability_id",
  "ability_revision",
  "ability_manifest_sha256",
  "ability_bundle_sha256",
  "invocation_id",
  "started_at",
  "finished_at",
  "authority",
  "inputs",
  "predicted_effects",
  "observed_effects",
  "costs",
  "outputs",
  "uncertainty",
  "repair",
  "retention",
  "result",
];

const MANIFESTATION_RECEIPT_FIELDS = [
  "schema_version",
  "evidence_class",
  "receipt_recorded_at",
  "ability",
  "adoption",
  "authorization",
  "provider",
  "request",
  "result",
  "provider_calls_submitted",
  "external_effects",
  "unknowns",
  "retry",
  "suite_karma",
];

const MANIFESTATION_RECEIPT_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*-manifestation-[0-9]{8}\.json$/;
const PRE_CALL_REVISION_BINDING = "observed_before_call_not_proven_execution_revision";
const POST_TIMEOUT_REVISION_BINDING = "observed_after_timeout_not_proven_execution_revision";

const AFFINITIES = [
  ["enhancement", "strengthen an existing capability or check"],
  ["transmutation", "change representation while preserving declared invariants"],
  ["emission", "carry a bounded capability across a boundary"],
  ["conjuration", "create a maintained artifact, schema, or interface"],
  ["manipulation", "mutate explicitly authorized scoped state, never a being"],
  ["specialization", "perform one bounded operation not honestly described above"],
];

class JsonProblem extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

// Every suite read goes through one of two file views. LOCAL_FILES is the
// working tree. A revision view (revisionFiles) answers the same three calls
// from blobs already read into memory, so verifying at a revision writes
// nothing and never extracts a tree.
const LOCAL_FILES = Object.freeze({
  lstat: (path) => lstatSync(path),
  read: (path) => readFileSync(path),
  list: (path) => readdirSync(path, { withFileTypes: true }),
});

function binaryCompare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function issue(file, field, code) {
  return { file, field, code };
}

function sortIssues(issues) {
  issues.sort((a, b) =>
    binaryCompare(`${a.file}\u0000${a.field}\u0000${a.code}`, `${b.file}\u0000${b.field}\u0000${b.code}`),
  );
  for (let index = issues.length - 1; index > 0; index -= 1) {
    if (
      issues[index].file === issues[index - 1].file
      && issues[index].field === issues[index - 1].field
      && issues[index].code === issues[index - 1].code
    ) {
      issues.splice(index, 1);
    }
  }
  return issues;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    const output = Object.create(null);
    for (const key of Object.keys(value).sort(binaryCompare)) {
      output[key] = stableValue(value[key]);
    }
    return output;
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(stableValue(value));
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function decodeUtf8(bytes) {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function safeTerminal(value) {
  const scalar = typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
    || value === null
    ? String(value)
    : "[non-scalar]";
  return scalar
    .replace(/\\/g, "\\\\")
    .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]|\p{Cf}/gu, (character) => {
      const codePoint = character.codePointAt(0);
      return codePoint <= 0xffff
        ? `\\u${codePoint.toString(16).padStart(4, "0")}`
        : `\\u{${codePoint.toString(16)}}`;
    });
}

function strictJson(text) {
  let index = 0;

  function fail(code = "invalid-json") {
    throw new JsonProblem(code);
  }

  function whitespace() {
    while (index < text.length && /[\x20\t\r\n]/.test(text[index])) index += 1;
  }

  function stringValue() {
    if (text[index] !== '"') fail();
    const start = index;
    index += 1;
    let escaped = false;
    while (index < text.length) {
      const character = text[index];
      if (escaped) {
        escaped = false;
        index += 1;
        continue;
      }
      if (character === "\\") {
        escaped = true;
        index += 1;
        continue;
      }
      if (character === '"') {
        index += 1;
        try {
          return JSON.parse(text.slice(start, index));
        } catch {
          fail();
        }
      }
      if (character.charCodeAt(0) < 0x20) fail();
      index += 1;
    }
    fail();
  }

  function numberValue() {
    const match = text.slice(index).match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/);
    if (!match) fail();
    index += match[0].length;
    const number = Number(match[0]);
    if (!Number.isFinite(number)) fail();
    return number;
  }

  function value() {
    whitespace();
    if (index >= text.length) fail();
    const character = text[index];
    if (character === '"') return stringValue();
    if (character === "{") return objectValue();
    if (character === "[") return arrayValue();
    if (character === "-" || /[0-9]/.test(character)) return numberValue();
    for (const [literal, parsed] of [["true", true], ["false", false], ["null", null]]) {
      if (text.startsWith(literal, index)) {
        index += literal.length;
        return parsed;
      }
    }
    fail();
  }

  function objectValue() {
    const output = Object.create(null);
    const keys = new Set();
    index += 1;
    whitespace();
    if (text[index] === "}") {
      index += 1;
      return output;
    }
    while (index < text.length) {
      whitespace();
      const key = stringValue();
      if (keys.has(key)) fail("duplicate-key");
      keys.add(key);
      whitespace();
      if (text[index] !== ":") fail();
      index += 1;
      const parsed = value();
      Object.defineProperty(output, key, {
        value: parsed,
        enumerable: true,
        writable: true,
        configurable: true,
      });
      whitespace();
      if (text[index] === "}") {
        index += 1;
        return output;
      }
      if (text[index] !== ",") fail();
      index += 1;
    }
    fail();
  }

  function arrayValue() {
    const output = [];
    index += 1;
    whitespace();
    if (text[index] === "]") {
      index += 1;
      return output;
    }
    while (index < text.length) {
      output.push(value());
      whitespace();
      if (text[index] === "]") {
        index += 1;
        return output;
      }
      if (text[index] !== ",") fail();
      index += 1;
    }
    fail();
  }

  const parsed = value();
  whitespace();
  if (index !== text.length) fail();
  return parsed;
}

function safeRead(root, relative, label, issues, expected = "file", raw = false, files = LOCAL_FILES) {
  const parts = relative.split("/").filter(Boolean);
  let current = root;
  try {
    const rootStat = files.lstat(root);
    if (rootStat.isSymbolicLink()) {
      issues.push(issue(label, "$", "symlink"));
      return null;
    }
    if (!rootStat.isDirectory()) {
      issues.push(issue(label, "$", "invalid-root"));
      return null;
    }
  } catch {
    issues.push(issue(label, "$", "missing-root"));
    return null;
  }

  for (let offset = 0; offset < parts.length; offset += 1) {
    current = join(current, parts[offset]);
    let stat;
    try {
      stat = files.lstat(current);
    } catch {
      issues.push(issue(label, "$", "missing-file"));
      return null;
    }
    if (stat.isSymbolicLink()) {
      issues.push(issue(label, "$", "symlink"));
      return null;
    }
    const last = offset === parts.length - 1;
    if (!last && !stat.isDirectory()) {
      issues.push(issue(label, "$", "invalid-path"));
      return null;
    }
    if (last && expected === "file" && !stat.isFile()) {
      issues.push(issue(label, "$", "invalid-file"));
      return null;
    }
    if (last && expected === "directory" && !stat.isDirectory()) {
      issues.push(issue(label, "$", "invalid-directory"));
      return null;
    }
    if (last && expected === "file" && stat.size > MAX_FILE_BYTES) {
      issues.push(issue(label, "$", "oversized-file"));
      return null;
    }
  }

  if (expected === "directory") return current;
  try {
    const bytes = files.read(current);
    if (raw) return bytes;
    try {
      return decodeUtf8(bytes);
    } catch {
      issues.push(issue(label, "$", "invalid-utf8"));
      return null;
    }
  } catch {
    issues.push(issue(label, "$", "unreadable-file"));
    return null;
  }
}

function parseJsonFile(root, relative, label, issues, files = LOCAL_FILES) {
  const text = safeRead(root, relative, label, issues, "file", false, files);
  if (text === null) return null;
  try {
    return strictJson(text);
  } catch (error) {
    issues.push(issue(label, "$", error instanceof JsonProblem ? error.code : "invalid-json"));
    return null;
  }
}

function parseJsonValueFile(root, relative, label, issues, files = LOCAL_FILES) {
  const text = safeRead(root, relative, label, issues, "file", false, files);
  if (text === null) return { loaded: false, value: null };
  try {
    return { loaded: true, value: strictJson(text) };
  } catch (error) {
    issues.push(issue(label, "$", error instanceof JsonProblem ? error.code : "invalid-json"));
    return { loaded: false, value: null };
  }
}

function jsonType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value === "object" ? "object" : typeof value;
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function resolveRef(rootSchema, reference) {
  if (!reference.startsWith("#/")) return null;
  let current = rootSchema;
  for (const encoded of reference.slice(2).split("/")) {
    const key = encoded.replace(/~1/g, "/").replace(/~0/g, "~");
    if (current === null || typeof current !== "object" || !(key in current)) return null;
    current = current[key];
  }
  return current;
}

function validateWithSchema(value, schema, rootSchema, file, field, issues, referenceStack = new Set()) {
  if (schema === null || typeof schema !== "object" || Array.isArray(schema)) {
    issues.push(issue(file, field, "invalid-schema"));
    return;
  }
  if (typeof schema.$ref === "string") {
    const target = resolveRef(rootSchema, schema.$ref);
    if (target === null) {
      issues.push(issue(file, field, "invalid-schema-ref"));
      return;
    }
    if (referenceStack.has(target)) {
      issues.push(issue(file, field, "invalid-schema-ref-cycle"));
      return;
    }
    const nextStack = new Set(referenceStack);
    nextStack.add(target);
    validateWithSchema(value, target, rootSchema, file, field, issues, nextStack);
    return;
  }

  if (Array.isArray(schema.oneOf)) {
    let matches = 0;
    for (const branch of schema.oneOf) {
      const branchIssues = [];
      validateWithSchema(value, branch, rootSchema, file, field, branchIssues, referenceStack);
      if (branchIssues.length === 0) matches += 1;
    }
    if (matches !== 1) issues.push(issue(file, field, "invalid-one-of"));
  }

  if (Object.hasOwn(schema, "const") && canonicalJson(value) !== canonicalJson(schema.const)) {
    issues.push(issue(file, field, "invalid-const"));
    return;
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => canonicalJson(item) === canonicalJson(value))) {
    issues.push(issue(file, field, "invalid-enum"));
    return;
  }

  if (typeof schema.type === "string") {
    const actual = jsonType(value);
    const matches = schema.type === "number"
      ? actual === "number" || actual === "integer"
      : schema.type === actual;
    if (!matches) {
      issues.push(issue(file, field, "invalid-type"));
      return;
    }
  }

  if (typeof value === "string") {
    const codePoints = [...value].length;
    if (Number.isInteger(schema.minLength) && codePoints < schema.minLength) {
      issues.push(issue(file, field, "too-short"));
    }
    if (Number.isInteger(schema.maxLength) && codePoints > schema.maxLength) {
      issues.push(issue(file, field, "too-long"));
    }
    if (typeof schema.pattern === "string") {
      try {
        if (!(new RegExp(schema.pattern)).test(value)) issues.push(issue(file, field, "invalid-pattern"));
      } catch {
        issues.push(issue(file, field, "invalid-schema-pattern"));
      }
    }
  }

  if (typeof value === "number" && typeof schema.minimum === "number" && value < schema.minimum) {
    issues.push(issue(file, field, "below-minimum"));
  }

  if (Array.isArray(value)) {
    if (Number.isInteger(schema.minItems) && value.length < schema.minItems) {
      issues.push(issue(file, field, "too-few-items"));
    }
    if (Number.isInteger(schema.maxItems) && value.length > schema.maxItems) {
      issues.push(issue(file, field, "too-many-items"));
    }
    if (schema.uniqueItems === true) {
      const seen = new Set();
      for (const item of value) {
        const key = canonicalJson(item);
        if (seen.has(key)) {
          issues.push(issue(file, field, "duplicate-item"));
          break;
        }
        seen.add(key);
      }
    }
    if (schema.items && typeof schema.items === "object") {
      value.forEach((item, offset) =>
        validateWithSchema(item, schema.items, rootSchema, file, `${field}[${offset}]`, issues, referenceStack),
      );
    }
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const properties = schema.properties && typeof schema.properties === "object"
      ? schema.properties
      : Object.create(null);
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!Object.hasOwn(value, key)) issues.push(issue(file, `${field}.${key}`, "missing-field"));
      }
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(properties, key)) {
          issues.push(issue(file, field, "unknown-field"));
        }
      }
    }
    for (const key of Object.keys(properties).sort(binaryCompare)) {
      if (Object.hasOwn(value, key)) {
        validateWithSchema(value[key], properties[key], rootSchema, file, `${field}.${key}`, issues, referenceStack);
      }
    }
  }
}

function sameStrings(left, right) {
  if (
    !Array.isArray(left)
    || !Array.isArray(right)
    || left.some((entry) => typeof entry !== "string")
    || right.some((entry) => typeof entry !== "string")
  ) return false;
  return canonicalJson([...left].sort(binaryCompare)) === canonicalJson([...right].sort(binaryCompare));
}

const SUPPORTED_SCHEMA_KEYS = new Set([
  "$schema",
  "$id",
  "$ref",
  "$defs",
  "title",
  "type",
  "additionalProperties",
  "required",
  "properties",
  "const",
  "enum",
  "pattern",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "uniqueItems",
  "items",
  "minimum",
  "oneOf",
]);

function validateSchemaVocabulary(schema, label, field, issues, rootSchema = schema) {
  if (schema === null || typeof schema !== "object" || Array.isArray(schema)) {
    issues.push(issue(label, field, "invalid-schema"));
    return;
  }
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED_SCHEMA_KEYS.has(key)) issues.push(issue(label, field, "unsupported-schema-keyword"));
  }

  for (const key of ["$schema", "$id", "$ref", "title", "pattern"]) {
    if (Object.hasOwn(schema, key) && typeof schema[key] !== "string") {
      issues.push(issue(label, `${field}.${key}`, "invalid-schema-keyword-value"));
    }
  }
  for (const key of ["additionalProperties", "uniqueItems"]) {
    if (Object.hasOwn(schema, key) && typeof schema[key] !== "boolean") {
      issues.push(issue(label, `${field}.${key}`, "invalid-schema-keyword-value"));
    }
  }
  for (const key of ["minLength", "maxLength", "minItems", "maxItems"]) {
    if (Object.hasOwn(schema, key) && (!Number.isInteger(schema[key]) || schema[key] < 0)) {
      issues.push(issue(label, `${field}.${key}`, "invalid-schema-keyword-value"));
    }
  }
  if (Object.hasOwn(schema, "minimum") && (typeof schema.minimum !== "number" || !Number.isFinite(schema.minimum))) {
    issues.push(issue(label, `${field}.minimum`, "invalid-schema-keyword-value"));
  }
  if (
    Number.isInteger(schema.minLength)
    && Number.isInteger(schema.maxLength)
    && schema.minLength > schema.maxLength
  ) {
    issues.push(issue(label, field, "invalid-schema-range"));
  }
  if (
    Number.isInteger(schema.minItems)
    && Number.isInteger(schema.maxItems)
    && schema.minItems > schema.maxItems
  ) {
    issues.push(issue(label, field, "invalid-schema-range"));
  }

  if (Object.hasOwn(schema, "required")) {
    if (
      !Array.isArray(schema.required)
      || schema.required.some((entry) => typeof entry !== "string")
      || new Set(schema.required).size !== schema.required.length
    ) {
      issues.push(issue(label, `${field}.required`, "invalid-schema-keyword-value"));
    }
  }
  if (Object.hasOwn(schema, "enum")) {
    if (
      !Array.isArray(schema.enum)
      || schema.enum.length === 0
      || new Set(schema.enum.map(canonicalJson)).size !== schema.enum.length
    ) {
      issues.push(issue(label, `${field}.enum`, "invalid-schema-keyword-value"));
    }
  }
  if (Object.hasOwn(schema, "oneOf") && (!Array.isArray(schema.oneOf) || schema.oneOf.length === 0)) {
    issues.push(issue(label, `${field}.oneOf`, "invalid-schema-keyword-value"));
  }
  for (const key of ["properties", "$defs"]) {
    if (
      Object.hasOwn(schema, key)
      && (schema[key] === null || typeof schema[key] !== "object" || Array.isArray(schema[key]))
    ) {
      issues.push(issue(label, `${field}.${key}`, "invalid-schema-keyword-value"));
    }
  }
  if (
    Object.hasOwn(schema, "items")
    && (schema.items === null || typeof schema.items !== "object" || Array.isArray(schema.items))
  ) {
    issues.push(issue(label, `${field}.items`, "invalid-schema-keyword-value"));
  }

  if (typeof schema.$ref === "string" && Object.keys(schema).some((key) => key !== "$ref")) {
    issues.push(issue(label, field, "unsupported-ref-sibling"));
  }
  if (typeof schema.$ref === "string" && resolveRef(rootSchema, schema.$ref) === null) {
    issues.push(issue(label, field, "invalid-schema-ref"));
  }
  if (
    Object.hasOwn(schema, "type")
    && !["object", "array", "string", "integer", "number", "boolean", "null"].includes(schema.type)
  ) {
    issues.push(issue(label, field, "unsupported-schema-type"));
  }
  if (typeof schema.pattern === "string") {
    try {
      new RegExp(schema.pattern);
    } catch {
      issues.push(issue(label, field, "invalid-schema-pattern"));
    }
  }
  if (schema.properties && typeof schema.properties === "object" && !Array.isArray(schema.properties)) {
    for (const key of Object.keys(schema.properties).sort(binaryCompare)) {
      validateSchemaVocabulary(schema.properties[key], label, `${field}.properties`, issues, rootSchema);
    }
  }
  if (schema.$defs && typeof schema.$defs === "object" && !Array.isArray(schema.$defs)) {
    for (const key of Object.keys(schema.$defs).sort(binaryCompare)) {
      validateSchemaVocabulary(schema.$defs[key], label, `${field}.$defs`, issues, rootSchema);
    }
  }
  if (schema.items && typeof schema.items === "object") {
    validateSchemaVocabulary(schema.items, label, `${field}.items`, issues, rootSchema);
  }
  if (Array.isArray(schema.oneOf)) {
    schema.oneOf.forEach((branch) => validateSchemaVocabulary(branch, label, `${field}.oneOf`, issues, rootSchema));
  }
}

function validateSchemaReferenceGraph(schema, label, issues) {
  const schemaNodes = new Set();

  function collect(node) {
    if (node === null || typeof node !== "object" || Array.isArray(node) || schemaNodes.has(node)) return;
    schemaNodes.add(node);
    for (const key of ["properties", "$defs"]) {
      const collection = node[key];
      if (collection && typeof collection === "object" && !Array.isArray(collection)) {
        for (const child of Object.values(collection)) collect(child);
      }
    }
    if (node.items && typeof node.items === "object" && !Array.isArray(node.items)) collect(node.items);
    if (Array.isArray(node.oneOf)) for (const branch of node.oneOf) collect(branch);
  }

  function walk(node, ancestors, field) {
    if (node === null || typeof node !== "object" || Array.isArray(node)) return;
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(node);
    if (typeof node.$ref === "string") {
      const target = resolveRef(schema, node.$ref);
      if (target === null) return;
      if (!schemaNodes.has(target)) {
        issues.push(issue(label, field, "invalid-schema-ref-target"));
        return;
      }
      if (nextAncestors.has(target)) {
        issues.push(issue(label, field, "invalid-schema-ref-cycle"));
        return;
      }
      walk(target, nextAncestors, field);
      return;
    }
    for (const key of ["properties", "$defs"]) {
      const collection = node[key];
      if (collection && typeof collection === "object" && !Array.isArray(collection)) {
        for (const childKey of Object.keys(collection).sort(binaryCompare)) {
          walk(collection[childKey], nextAncestors, `${field}.${key}`);
        }
      }
    }
    if (node.items && typeof node.items === "object" && !Array.isArray(node.items)) {
      walk(node.items, nextAncestors, `${field}.items`);
    }
    if (Array.isArray(node.oneOf)) {
      for (const branch of node.oneOf) walk(branch, nextAncestors, `${field}.oneOf`);
    }
  }
  collect(schema);
  walk(schema, new Set(), "$");
}

function validateSchemaContract(schema, expectedId, expectedFields, label, issues) {
  if (schema === null || typeof schema !== "object" || Array.isArray(schema)) {
    issues.push(issue(label, "$", "invalid-schema"));
    return;
  }
  if (
    schema.$schema !== "https://json-schema.org/draft/2020-12/schema"
    || schema.$id !== expectedId
    || schema.type !== "object"
    || schema.additionalProperties !== false
    || !schema.properties
    || typeof schema.properties !== "object"
    || Array.isArray(schema.properties)
    || !sameStrings(schema.required, expectedFields)
    || !sameStrings(Object.keys(schema.properties), expectedFields)
  ) {
    issues.push(issue(label, "$", "schema-contract"));
  }
  validateSchemaVocabulary(schema, label, "$", issues);
  validateSchemaReferenceGraph(schema, label, issues);
}

function loadSchema(relative, expectedId, expectedFields, files = LOCAL_FILES) {
  const issues = [];
  const schema = parseJsonFile(OS_ROOT, relative, relative, issues, files);
  if (schema) validateSchemaContract(schema, expectedId, expectedFields, relative, issues);
  return {
    schema,
    sha256: schema && issues.length === 0 ? sha256(canonicalJson(schema)) : null,
    issues: sortIssues(issues),
  };
}

function loadAbilitySchema(files = LOCAL_FILES) {
  return loadSchema(ABILITY_SCHEMA_REL, "urn:kingdom:schema:nen-ability:0.1", ABILITY_FIELDS, files);
}

function loadReceiptSchema(files = LOCAL_FILES) {
  return loadSchema(RECEIPT_SCHEMA_REL, "urn:kingdom:schema:karma-receipt:0.1", RECEIPT_FIELDS, files);
}

function loadManifestationReceiptSchema(files = LOCAL_FILES) {
  return loadSchema(
    MANIFESTATION_RECEIPT_SCHEMA_REL,
    "urn:kingdom:schema:nen-manifestation-receipt:0.1",
    MANIFESTATION_RECEIPT_FIELDS,
    files,
  );
}

function loadRightsBaseline(files = LOCAL_FILES) {
  const issues = [];
  const bytes = safeRead(OS_ROOT, RIGHTS_BASELINE_REL, RIGHTS_BASELINE_REL, issues, "file", true, files);
  const digest = bytes === null ? null : sha256(bytes);
  if (digest !== null && digest !== RIGHTS_BASELINE_SHA256) {
    issues.push(issue(RIGHTS_BASELINE_REL, "$", "rights-baseline-digest-mismatch"));
  }
  return {
    sha256: digest === RIGHTS_BASELINE_SHA256 && issues.length === 0 ? digest : null,
    issues: sortIssues(issues),
  };
}

function parseConstrainedScalar(raw) {
  const value = raw.trim();
  if (value.length === 0) return null;
  if (value.startsWith('"')) {
    try {
      const parsed = strictJson(value);
      return typeof parsed === "string" ? parsed : null;
    } catch {
      return null;
    }
  }
  if (value.startsWith("'") || value.endsWith("'") || value.endsWith('"')) return null;
  if (/^[\-?:,\[\]{}#&*!|>'"%@`]/.test(value) || /\s+#/.test(value) || /:\s/.test(value)) return null;
  if (/^(?:~|null|true|false|yes|no|on|off)$/i.test(value)) return null;
  if (/^[-+]?(?:0|[1-9][0-9_]*|0[0-9_]+|0[xX][0-9a-fA-F_]+|0[oO][0-7_]+|0[bB][01_]+)$/.test(value)) return null;
  if (/^[-+]?(?:(?:[0-9][0-9_]*)?\.[0-9_]+|[0-9][0-9_]*(?:\.[0-9_]*)?[eE][-+]?[0-9]+)$/.test(value)) return null;
  if (/^[-+]?\.(?:inf|nan)$/i.test(value)) return null;
  if (/^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/.test(value)) return null;
  if (/^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}(?:[Tt ]|$)/.test(value)) return null;
  return value;
}

function parseSkillFrontmatter(text, label, issues) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (lines[0] !== "---") {
    issues.push(issue(label, "$", "missing-frontmatter"));
    return null;
  }
  const closing = lines.indexOf("---", 1);
  if (closing < 0) {
    issues.push(issue(label, "$", "invalid-frontmatter"));
    return null;
  }
  const fields = Object.create(null);
  for (const line of lines.slice(1, closing)) {
    const match = line.match(/^([a-z_]+):\s*(.+)$/);
    if (!match) {
      issues.push(issue(label, "$", "invalid-frontmatter"));
      continue;
    }
    if (Object.hasOwn(fields, match[1])) {
      issues.push(issue(label, "$", "duplicate-frontmatter-field"));
      continue;
    }
    const rawScalar = match[2].trim();
    const parsed = rawScalar.startsWith('"') ? parseConstrainedScalar(rawScalar) : null;
    if (parsed === null) {
      issues.push(issue(label, "$", "invalid-frontmatter-scalar"));
      continue;
    }
    fields[match[1]] = parsed;
  }
  if (!sameStrings(Object.keys(fields), ["name", "description"])) {
    issues.push(issue(label, "$", "frontmatter-contract"));
  }
  return fields;
}

function validateOpenAiYaml(text, id, label, issues) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  const expected = [
    ["interface:", null],
    ["  display_name: ", "string"],
    ["  short_description: ", "string"],
    ["  default_prompt: ", "string"],
    ["policy:", null],
    ["  allow_implicit_invocation: false", null],
  ];
  if (lines.length !== expected.length) {
    issues.push(issue(label, "$", "openai-interface-contract"));
    return;
  }
  const values = Object.create(null);
  for (let index = 0; index < expected.length; index += 1) {
    const [prefix, kind] = expected[index];
    if (kind === null) {
      if (lines[index] !== prefix) {
        if (index === 5 && /^  allow_implicit_invocation:\s*/.test(lines[index] ?? "")) {
          issues.push(issue(label, "policy.allow_implicit_invocation", "implicit-invocation-enabled"));
        } else {
          issues.push(issue(label, "$", "openai-interface-contract"));
        }
        return;
      }
      continue;
    }
    if (!lines[index].startsWith(prefix)) {
      issues.push(issue(label, "$", "openai-interface-contract"));
      return;
    }
    const parsed = parseConstrainedScalar(lines[index].slice(prefix.length));
    if (parsed === null || !lines[index].slice(prefix.length).trim().startsWith('"')) {
      issues.push(issue(label, "$", "openai-interface-contract"));
      return;
    }
    values[index] = parsed;
  }
  const shortLength = [...values[2]].length;
  if (shortLength < 25 || shortLength > 64) issues.push(issue(label, "interface.short_description", "invalid-length"));
  const skillTokens = values[3].match(/\$[A-Za-z0-9_-]+/g) ?? [];
  if (!skillTokens.includes(`$${id}`)) {
    issues.push(issue(label, "interface.default_prompt", "skill-name-mismatch"));
  }
}

function optionalDirectorySymlink(skillsRoot, id, name, issues, files = LOCAL_FILES) {
  const relative = `${id}/${name}`;
  const label = `skills/${relative}`;
  try {
    const stat = files.lstat(join(skillsRoot, relative));
    if (stat.isSymbolicLink()) issues.push(issue(label, "$", "symlink"));
    else if (!stat.isDirectory()) issues.push(issue(label, "$", "invalid-directory"));
  } catch {
    // Optional directories may be absent.
  }
}

function semanticAbility(manifest, id, label, issues) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return;
  if (manifest.id !== id) issues.push(issue(label, "$.id", "folder-id-mismatch"));
  if (manifest.skill !== id) issues.push(issue(label, "$.skill", "skill-id-mismatch"));

  const bearer = manifest.bearer;
  if (bearer && typeof bearer === "object") {
    if (bearer.kind === "kingdom" && bearer.adoption === "self_declared") {
      issues.push(issue(label, "$.bearer.adoption", "invalid-adoption"));
    }
    if (bearer.kind === "king" && bearer.adoption === "repository_declared") {
      issues.push(issue(label, "$.bearer.adoption", "invalid-adoption"));
    }
    if (manifest.status === "active") {
      const valid = (bearer.kind === "kingdom" && bearer.adoption === "repository_declared")
        || (bearer.kind === "king" && bearer.adoption === "self_declared");
      if (!valid) issues.push(issue(label, "$.status", "active-without-adoption"));
    }
    if (bearer.adoption === "proposed" && !["draft", "training"].includes(manifest.status)) {
      issues.push(issue(label, "$.status", "proposed-status"));
    }
    if (
      bearer.kind === "king"
      && Array.isArray(bearer.consent_references)
      && Array.isArray(bearer.representative_authority_references)
      && bearer.consent_references.length === 0
      && bearer.representative_authority_references.length === 0
    ) {
      issues.push(issue(label, "$.bearer", "identity-authority-missing"));
    }
    if (
      bearer.kind === "king"
      && bearer.adoption === "self_declared"
      && Array.isArray(bearer.consent_references)
      && bearer.consent_references.length === 0
    ) {
      issues.push(issue(label, "$.bearer.consent_references", "self-declaration-reference-missing"));
    }
  }

  if (manifest.affinity && Array.isArray(manifest.affinity.secondary)) {
    if (manifest.affinity.secondary.includes(manifest.affinity.primary)) {
      issues.push(issue(label, "$.affinity.secondary", "primary-repeated"));
    }
  }
  if (Array.isArray(manifest.vows)) {
    const ids = new Set();
    for (const vow of manifest.vows) {
      if (vow && typeof vow === "object" && typeof vow.id === "string") {
        if (ids.has(vow.id)) issues.push(issue(label, "$.vows", "duplicate-vow-id"));
        ids.add(vow.id);
      }
    }
  }
  if (Array.isArray(manifest.costs)) {
    const resources = new Set();
    for (const cost of manifest.costs) {
      if (cost && typeof cost === "object" && typeof cost.resource === "string") {
        if (resources.has(cost.resource)) issues.push(issue(label, "$.costs", "duplicate-cost-resource"));
        resources.add(cost.resource);
      }
    }
  }
}

function inventorySkillBundle(skillsRoot, id, issues, files = LOCAL_FILES) {
  const base = join(skillsRoot, id);
  const inventory = [];
  let fileCount = 0;
  let bytes = 0;
  let nodes = 0;
  let stopped = false;

  function walk(directory, relativeDirectory, depth) {
    if (stopped) return;
    if (depth > MAX_BUNDLE_DEPTH) {
      issues.push(issue(`skills/${id}`, "$", "bundle-too-deep"));
      stopped = true;
      return;
    }
    let entries;
    try {
      entries = files.list(directory);
    } catch {
      issues.push(issue(`skills/${id}`, "$", "unreadable-directory"));
      return;
    }
    for (const entry of entries.sort((left, right) => binaryCompare(left.name, right.name))) {
      if (stopped) break;
      nodes += 1;
      if (nodes > MAX_BUNDLE_NODES) {
        issues.push(issue(`skills/${id}`, "$", "too-many-nodes"));
        stopped = true;
        break;
      }
      const absolute = join(directory, entry.name);
      const relative = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
      const label = `skills/${id}/${relative}`;
      let stat;
      try {
        stat = files.lstat(absolute);
      } catch {
        issues.push(issue(label, "$", "unreadable-file"));
        continue;
      }
      if (stat.isSymbolicLink()) {
        issues.push(issue(label, "$", "symlink"));
        continue;
      }
      if (stat.isDirectory()) {
        walk(absolute, relative, depth + 1);
        continue;
      }
      if (!stat.isFile()) {
        issues.push(issue(label, "$", "invalid-file"));
        continue;
      }
      fileCount += 1;
      bytes += stat.size;
      if (fileCount > MAX_BUNDLE_FILES) {
        issues.push(issue(`skills/${id}`, "$", "too-many-files"));
        stopped = true;
        return;
      }
      if (stat.size > MAX_FILE_BYTES) {
        issues.push(issue(label, "$", "oversized-file"));
        continue;
      }
      if (bytes > MAX_BUNDLE_BYTES) {
        issues.push(issue(`skills/${id}`, "$", "oversized-bundle"));
        stopped = true;
        return;
      }
      try {
        const content = files.read(absolute);
        inventory.push({
          path: relative,
          mode: (stat.mode & 0o111) === 0 ? "100644" : "100755",
          bytes: content.byteLength,
          sha256: sha256(content),
        });
      } catch {
        issues.push(issue(label, "$", "unreadable-file"));
      }
    }
  }

  try {
    const stat = files.lstat(base);
    if (stat.isSymbolicLink()) issues.push(issue(`skills/${id}`, "$", "symlink"));
    else if (!stat.isDirectory()) issues.push(issue(`skills/${id}`, "$", "invalid-directory"));
    else walk(base, "", 0);
  } catch {
    issues.push(issue(`skills/${id}`, "$", "missing-root"));
  }
  return inventory;
}

function exactAbsolutePath(value) {
  return typeof value === "string"
    && value.length > 0
    && isAbsolute(value)
    && resolve(value) === value
    && value !== parse(value).root;
}

function validateManifestationReceiptRecord(receipt, receiptLabel, schema, issues, actualPath = null) {
  validateWithSchema(receipt, schema, schema, receiptLabel, "$", issues);
  if (!record(receipt)) return;

  const recordedAt = normalizeTimestamp(receipt.receipt_recorded_at);
  const observedAt = normalizeTimestamp(receipt.provider?.interface_observed_at);
  if (typeof receipt.receipt_recorded_at === "string" && recordedAt === null) {
    issues.push(issue(receiptLabel, "$.receipt_recorded_at", "invalid-timestamp"));
  }
  if (typeof receipt.provider?.interface_observed_at === "string" && observedAt === null) {
    issues.push(issue(receiptLabel, "$.provider.interface_observed_at", "invalid-timestamp"));
  }
  if (recordedAt !== null && observedAt !== null && observedAt > recordedAt) {
    issues.push(issue(receiptLabel, "$.provider.interface_observed_at", "invalid-time-order"));
  }
  if (
    receipt.provider?.interface_observed_at_basis === "upper_bound_from_receipt_recorded_at"
    && recordedAt !== observedAt
  ) {
    issues.push(issue(receiptLabel, "$.provider.interface_observed_at", "invalid-observation-time-basis"));
  }

  const timedOut = receipt.result?.failure?.code === "mcp_tools_call_timeout";
  const revisionBinding = receipt.provider?.revision_binding;
  if (timedOut && ![PRE_CALL_REVISION_BINDING, POST_TIMEOUT_REVISION_BINDING].includes(revisionBinding)) {
    issues.push(issue(receiptLabel, "$.provider.revision_binding", "timeout-revision-disclaimer-missing"));
  }
  if (!timedOut && revisionBinding === POST_TIMEOUT_REVISION_BINDING) {
    issues.push(issue(receiptLabel, "$.provider.revision_binding", "post-timeout-binding-without-timeout"));
  }
  if (
    revisionBinding === PRE_CALL_REVISION_BINDING
    && receipt.provider?.interface_observed_at_basis !== "exact"
  ) {
    issues.push(issue(receiptLabel, "$.provider.interface_observed_at_basis", "pre-call-observation-must-be-exact"));
  }
  if (receipt.result?.status === "failed" && receipt.result?.failure === null) {
    issues.push(issue(receiptLabel, "$.result.failure", "failure-detail-missing"));
  }
  if (receipt.result?.status !== "failed" && receipt.result?.failure !== null) {
    issues.push(issue(receiptLabel, "$.result.failure", "unexpected-failure-detail"));
  }
  const promptWords = typeof receipt.request?.prompt === "string"
    ? receipt.request.prompt.trim().split(/\s+/u).filter(Boolean).length
    : 0;
  if (promptWords > 200) {
    issues.push(issue(receiptLabel, "$.request.prompt", "prompt-word-budget-exceeded"));
  }
  if (
    Number.isInteger(receipt.request?.seed)
    && receipt.request.seed > 2_147_483_647
  ) {
    issues.push(issue(receiptLabel, "$.request.seed", "provider-seed-out-of-range"));
  }
  if (
    typeof receipt.request?.guidance_scale === "number"
    && receipt.request.guidance_scale > 100
  ) {
    issues.push(issue(receiptLabel, "$.request.guidance_scale", "provider-guidance-out-of-range"));
  }

  const localDestination = receipt.authorization?.local_destination;
  const effects = Array.isArray(receipt.external_effects) ? receipt.external_effects : [];
  const suiteKarma = receipt.suite_karma;
  if (
    localDestination?.kind === "legacy_unbound_project_intent"
    && receipt.evidence_class !== "pre_manifestation_provider_evidence"
  ) {
    issues.push(issue(receiptLabel, "$.authorization.local_destination.kind", "legacy-destination-on-current-evidence"));
  }
  if (
    receipt.evidence_class === "manifestation_provider_evidence"
    && suiteKarma?.state !== "final"
  ) {
    issues.push(issue(receiptLabel, "$.suite_karma.state", "final-karma-receipt-required"));
  }
  if (localDestination?.kind === "preview_only") {
    if (
      receipt.result?.project_path !== null
      || effects.some((effect) => typeof effect === "string" && effect.startsWith("project_artifact_"))
    ) {
      issues.push(issue(receiptLabel, "$.authorization.local_destination", "preview-has-project-effect"));
    }
    if (
      receipt.evidence_class === "manifestation_provider_evidence"
      && (suiteKarma?.state !== "final" || suiteKarma?.storage !== "inline")
    ) {
      issues.push(issue(receiptLabel, "$.suite_karma", "preview-karma-must-be-inline-final"));
    }
  }
  if (localDestination?.kind === "project_path") {
    const projectRoot = localDestination.project_root;
    const paths = [
      localDestination.image_path,
      localDestination.provider_receipt_path,
      localDestination.karma_receipt_path,
    ];
    const insideRoot = paths.every((path) =>
      exactAbsolutePath(projectRoot)
      && exactAbsolutePath(path)
      && path.startsWith(`${projectRoot}${sep}`)
    );
    if (
      !insideRoot
      || new Set(paths).size !== paths.length
      || new Set(paths.map(dirname)).size !== 1
    ) {
      issues.push(issue(receiptLabel, "$.authorization.local_destination", "invalid-project-output-plan"));
    }
    if (actualPath !== null && resolve(actualPath) !== localDestination.provider_receipt_path) {
      issues.push(issue(receiptLabel, "$.authorization.local_destination.provider_receipt_path", "provider-receipt-path-mismatch"));
    }
    if (receipt.result?.status === "manifested") {
      if (receipt.result.project_path !== localDestination.image_path) {
        issues.push(issue(receiptLabel, "$.result.project_path", "project-artifact-path-mismatch"));
      }
      const projectEffects = effects.filter((effect) =>
        typeof effect === "string" && effect.startsWith("project_artifact_")
      );
      if (projectEffects.length !== 1) {
        issues.push(issue(receiptLabel, "$.external_effects", "project-artifact-effect-missing"));
      }
    } else if (receipt.result?.project_path !== null) {
      issues.push(issue(receiptLabel, "$.result.project_path", "project-path-without-manifestation"));
    }
    if (
      receipt.evidence_class === "manifestation_provider_evidence"
      && (
        suiteKarma?.state !== "final"
        || suiteKarma?.storage !== "project_path"
        || suiteKarma?.receipt_path !== localDestination.karma_receipt_path
      )
    ) {
      issues.push(issue(receiptLabel, "$.suite_karma", "project-karma-receipt-binding-mismatch"));
    }
  }
}

function validateManifestationReceipt(skillsRoot, id, filename, schema, issues, files = LOCAL_FILES) {
  const receiptRelative = `${id}/assets/${filename}`;
  const receiptLabel = `skills/${receiptRelative}`;
  const loadedReceipt = parseJsonValueFile(skillsRoot, receiptRelative, receiptLabel, issues, files);
  if (!loadedReceipt.loaded) return;
  const receipt = loadedReceipt.value;

  validateManifestationReceiptRecord(
    receipt,
    receiptLabel,
    schema,
    issues,
    join(skillsRoot, receiptRelative),
  );
  if (record(receipt) && receipt.ability !== id) {
    issues.push(issue(receiptLabel, "$.ability", "folder-id-mismatch"));
  }

  const stem = filename.slice(0, -".json".length);
  const observationFilename = `${stem}.provider.json`;
  const observationRelative = `${id}/references/${observationFilename}`;
  const observationLabel = `skills/${observationRelative}`;
  const loadedObservation = parseJsonValueFile(
    skillsRoot,
    observationRelative,
    observationLabel,
    issues,
    files,
  );
  if (loadedObservation.loaded && schema.$defs?.provider) {
    validateWithSchema(
      loadedObservation.value,
      schema.$defs.provider,
      schema,
      observationLabel,
      "$",
      issues,
    );
    if (record(receipt) && canonicalJson(loadedObservation.value) !== canonicalJson(receipt.provider)) {
      issues.push(issue(receiptLabel, "$.provider", "provider-observation-mismatch"));
    }
  }

  const contractRelative = `${id}/references/manifestation-contract.md`;
  const contractLabel = `skills/${contractRelative}`;
  const contract = safeRead(skillsRoot, contractRelative, contractLabel, issues, "file", false, files);
  if (contract !== null && record(receipt?.provider)) {
    if (!contract.includes(`(${observationFilename})`)) {
      issues.push(issue(contractLabel, "$", "provider-observation-reference-missing"));
    }
    if (typeof receipt.provider.space !== "string" || !contract.includes(`\`${receipt.provider.space}\``)) {
      issues.push(issue(contractLabel, "$", "provider-space-mismatch"));
    }
    if (
      typeof receipt.provider.space_revision !== "string"
      || !contract.includes(receipt.provider.space_revision)
    ) {
      issues.push(issue(contractLabel, "$", "provider-revision-mismatch"));
    }
    if (
      typeof receipt.provider.revision_binding !== "string"
      || !contract.includes(receipt.provider.revision_binding)
    ) {
      issues.push(issue(contractLabel, "$", "provider-binding-mismatch"));
    }
  }
}

function validateManifestationReceipts(skillsRoot, id, schema, issues, files = LOCAL_FILES) {
  let entries;
  try {
    entries = files.list(join(skillsRoot, id, "assets"));
  } catch {
    return;
  }
  for (const entry of entries.sort((left, right) => binaryCompare(left.name, right.name))) {
    if (MANIFESTATION_RECEIPT_NAME.test(entry.name)) {
      validateManifestationReceipt(skillsRoot, id, entry.name, schema, issues, files);
    }
  }
}

function validateAbility(skillsRoot, id, schema, manifestationReceiptSchema = null, files = LOCAL_FILES) {
  const issues = [];
  const manifestLabel = `skills/${id}/ability.json`;
  if (!ID_PATTERN.test(id)) {
    issues.push(issue(manifestLabel, "$.id", "invalid-id"));
    return { id, manifest: null, manifestSha256: null, bundleSha256: null, issues };
  }

  const manifest = parseJsonFile(skillsRoot, `${id}/ability.json`, manifestLabel, issues, files);
  const skillLabel = `skills/${id}/SKILL.md`;
  const skillText = safeRead(skillsRoot, `${id}/SKILL.md`, skillLabel, issues, "file", false, files);
  const yamlLabel = `skills/${id}/agents/openai.yaml`;
  const yamlText = safeRead(skillsRoot, `${id}/agents/openai.yaml`, yamlLabel, issues, "file", false, files);
  for (const optional of ["references", "scripts", "assets"]) {
    optionalDirectorySymlink(skillsRoot, id, optional, issues, files);
  }

  if (manifest && schema) {
    validateWithSchema(manifest, schema, schema, manifestLabel, "$", issues);
    semanticAbility(manifest, id, manifestLabel, issues);
  }
  if (manifestationReceiptSchema) {
    validateManifestationReceipts(skillsRoot, id, manifestationReceiptSchema, issues, files);
  }
  if (skillText !== null) {
    const frontmatter = parseSkillFrontmatter(skillText, skillLabel, issues);
    if (frontmatter && frontmatter.name !== id) {
      issues.push(issue(skillLabel, "frontmatter.name", "skill-name-mismatch"));
    }
  }
  if (yamlText !== null) validateOpenAiYaml(yamlText, id, yamlLabel, issues);
  const inventory = inventorySkillBundle(skillsRoot, id, issues, files);

  sortIssues(issues);
  return {
    id,
    manifest,
    manifestSha256: manifest && issues.length === 0 ? sha256(canonicalJson(manifest)) : null,
    bundleSha256: manifest && issues.length === 0 ? sha256(canonicalJson(inventory)) : null,
    issues,
  };
}

function discoverAbilityIds(skillsRoot) {
  const issues = [];
  const ids = [];
  let entries;
  try {
    const stat = lstatSync(skillsRoot);
    if (stat.isSymbolicLink()) return { ids, issues: [issue("skills", "$", "symlink")] };
    if (!stat.isDirectory()) return { ids, issues: [issue("skills", "$", "invalid-root")] };
    entries = readdirSync(skillsRoot, { withFileTypes: true });
  } catch {
    return { ids, issues: [issue("skills", "$", "missing-root")] };
  }

  for (const entry of entries.sort((a, b) => binaryCompare(a.name, b.name))) {
    if (entry.isSymbolicLink()) {
      issues.push(issue(`skills/${entry.name}`, "$", "symlink"));
      continue;
    }
    if (!entry.isDirectory()) continue;
    try {
      lstatSync(join(skillsRoot, entry.name, "ability.json"));
      ids.push(entry.name);
    } catch {
      // A non-Nen Agent Skill may omit ability.json.
    }
  }
  return { ids: ids.sort(binaryCompare), issues: sortIssues(issues) };
}

function validateSet(skillsRoot, requestedId = null) {
  const schemaInfo = loadAbilitySchema();
  const manifestationSchemaInfo = loadManifestationReceiptSchema();
  const rightsInfo = loadRightsBaseline();
  const discovery = requestedId
    ? { ids: [requestedId], issues: [] }
    : discoverAbilityIds(skillsRoot);
  const schemaUsable = schemaInfo.schema !== null && schemaInfo.issues.length === 0;
  const manifestationSchemaUsable = manifestationSchemaInfo.schema !== null
    && manifestationSchemaInfo.issues.length === 0;
  const results = discovery.ids.map((id) => {
    const result = validateAbility(
      skillsRoot,
      id,
      schemaUsable ? schemaInfo.schema : null,
      manifestationSchemaUsable ? manifestationSchemaInfo.schema : null,
    );
    const dependencyIssues = [];
    if (!schemaUsable) {
      dependencyIssues.push(issue(`skills/${id}/ability.json`, "$", "ability-schema-invalid"));
    }
    if (!manifestationSchemaUsable) {
      dependencyIssues.push(issue(`skills/${id}/ability.json`, "$", "manifestation-receipt-schema-invalid"));
    }
    if (rightsInfo.issues.length > 0) {
      dependencyIssues.push(issue(`skills/${id}/ability.json`, "$.rights", "rights-baseline-invalid"));
    }
    if (dependencyIssues.length === 0) return result;
    return {
      ...result,
      manifestSha256: null,
      bundleSha256: null,
      issues: sortIssues([
        ...result.issues,
        ...dependencyIssues,
      ]),
    };
  });
  const issues = sortIssues([
    ...schemaInfo.issues,
    ...manifestationSchemaInfo.issues,
    ...rightsInfo.issues,
    ...discovery.issues,
    ...results.flatMap((result) => result.issues),
  ]);
  return {
    schemas: {
      ability: schemaInfo.schema,
      abilitySha256: schemaInfo.sha256,
      manifestationReceipt: manifestationSchemaInfo.schema,
      manifestationReceiptSha256: manifestationSchemaInfo.sha256,
      rightsSha256: rightsInfo.sha256,
    },
    results,
    issues,
  };
}

function printIssues(issues) {
  for (const item of sortIssues([...issues])) {
    process.stderr.write(`${safeTerminal(item.file)} ${safeTerminal(item.field)} ${item.code}\n`);
  }
}

function validationPayload(validation) {
  return {
    protocol: "kingdom.nen-validation/0.1",
    checked: validation.results.length,
    invalid: validation.results.filter((result) => result.issues.length > 0).length,
    schema_sha256: validation.schemas.abilitySha256,
    manifestation_receipt_schema_sha256: validation.schemas.manifestationReceiptSha256,
    rights_sha256: validation.schemas.rightsSha256,
    issues: validation.issues,
  };
}

function listCommand(skillsRoot, json) {
  const validation = validateSet(skillsRoot);
  const abilities = validation.results.map((result) => ({
    id: result.id,
    name: typeof result.manifest?.name === "string" ? result.manifest.name : null,
    bearer: typeof result.manifest?.bearer?.kind === "string" ? result.manifest.bearer.kind : null,
    status: typeof result.manifest?.status === "string" ? result.manifest.status : null,
    manifest_sha256: result.manifestSha256,
    bundle_sha256: result.bundleSha256,
    valid: result.issues.length === 0,
  }));
  if (json) {
    process.stdout.write(`${JSON.stringify({
      protocol: "kingdom.nen-list/0.1",
      manifestation_receipt_schema_sha256: validation.schemas.manifestationReceiptSha256,
      rights_sha256: validation.schemas.rightsSha256,
      abilities,
      issues: validation.issues,
    }, null, 2)}\n`);
  } else {
    for (const ability of abilities) {
      process.stdout.write(
        `${safeTerminal(ability.id)}\t${safeTerminal(ability.status ?? "invalid")}\t${ability.manifest_sha256 ?? "invalid"}\t${ability.bundle_sha256 ?? "invalid"}\n`,
      );
    }
    if (abilities.length === 0) process.stdout.write("No Nen abilities found.\n");
    printIssues(validation.issues);
  }
  return validation.issues.length === 0 ? 0 : 1;
}

function validateCommand(skillsRoot, id, json) {
  const validation = validateSet(skillsRoot, id);
  const payload = validationPayload(validation);
  if (json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    process.stdout.write(`Nen schema: ${payload.checked} checked · ${payload.invalid} invalid · ${payload.issues.length} issues · ${payload.schema_sha256 ?? "unavailable"}\n`);
    printIssues(payload.issues);
  }
  return payload.issues.length === 0 ? 0 : 1;
}

function showCommand(skillsRoot, id) {
  const validation = validateSet(skillsRoot, id);
  if (validation.issues.length > 0 || validation.results.length !== 1 || !validation.results[0].manifest) {
    printIssues(validation.issues);
    return 1;
  }
  process.stdout.write(`${JSON.stringify(validation.results[0].manifest, null, 2)}\n`);
  return 0;
}

function typesCommand(json) {
  const payload = AFFINITIES.map(([id, effect]) => ({ id, effect }));
  if (json) process.stdout.write(`${JSON.stringify({ protocol: "kingdom.nen-types/0.1", affinities: payload }, null, 2)}\n`);
  else for (const entry of payload) process.stdout.write(`${entry.id}\t${entry.effect}\n`);
  return 0;
}

function digestCommand(skillsRoot, id) {
  const validation = validateSet(skillsRoot, id);
  if (validation.issues.length > 0 || validation.results.length !== 1 || !validation.results[0].bundleSha256) {
    printIssues(validation.issues);
    return 1;
  }
  process.stdout.write(`${validation.results[0].bundleSha256}\n`);
  return 0;
}

function receiptTemplate(ability) {
  return {
    $schema: "urn:kingdom:schema:karma-receipt:0.1",
    protocol: "kingdom.karma/0.1",
    accounting: "receipts_not_scores",
    state: "draft",
    receipt_id: "draft-replace-me",
    ability_id: ability.id,
    ability_revision: "template: replace with the exact repository revision before invocation",
    ability_manifest_sha256: ability.manifestSha256,
    ability_bundle_sha256: ability.bundleSha256,
    invocation_id: "draft-replace-me",
    started_at: "1970-01-01T00:00:00.000Z",
    finished_at: "1970-01-01T00:00:00.000Z",
    authority: {
      authority_reference: "Replace with the scoped authority or no-action basis.",
      affected_participants: [],
      consent_references: [],
      representative_authority_references: [],
      permissions_used: [],
    },
    inputs: [],
    predicted_effects: ["Replace with the predicted bounded effect."],
    observed_effects: ["No action recorded; this is a draft template."],
    costs: {
      time_ms: { value: "0", basis: "observed" },
      compute: "No action recorded.",
      money: "GBP 0",
      energy: "Not measured; no action recorded.",
      privacy: "No data egress recorded.",
      coordination: "No participant effect recorded.",
      data_egress_bytes: { value: "0", basis: "observed" },
      remote_gpu_seconds: { value: "0", basis: "observed" },
    },
    outputs: [],
    uncertainty: ["Replace draft fields after a real invocation or refusal."],
    repair: { required: false, actions: [], status: "not_needed" },
    retention: { expires_at: "not-applicable", redactions: [] },
    result: "refused",
  };
}

function receiptTemplateCommand(skillsRoot, id) {
  if (!ID_PATTERN.test(id)) return usage();
  const validation = validateSet(skillsRoot, id);
  const receiptSchema = loadReceiptSchema();
  const issues = sortIssues([...validation.issues, ...receiptSchema.issues]);
  if (issues.length > 0 || validation.results.length !== 1) {
    printIssues(issues);
    return 1;
  }
  process.stdout.write(`${JSON.stringify(receiptTemplate(validation.results[0]), null, 2)}\n`);
  return 0;
}

function normalizeTimestamp(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.([0-9]{1,9}))?Z$/);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1] || hour > 23 || minute > 59 || second > 59) {
    return null;
  }
  const fraction = (match[7] ?? "").padEnd(9, "0");
  return `${match[1]}${match[2]}${match[3]}${match[4]}${match[5]}${match[6]}${fraction}`;
}

function readAbsoluteJson(path, label, issues, returnBytes = false) {
  const absolute = resolve(path);
  const root = parse(absolute).root;
  const parts = absolute.slice(root.length).split(sep).filter(Boolean);
  let current = root;
  for (const [index, part] of parts.entries()) {
    current = join(current, part);
    let stat;
    try {
      stat = lstatSync(current);
    } catch {
      issues.push(issue(label, "$", "missing-file"));
      return null;
    }
    if (stat.isSymbolicLink()) {
      issues.push(issue(label, "$", "symlink"));
      return null;
    }
    const leaf = index === parts.length - 1;
    if (!leaf && !stat.isDirectory()) {
      issues.push(issue(label, "$", "invalid-path"));
      return null;
    }
    if (leaf && !stat.isFile()) {
      issues.push(issue(label, "$", "invalid-file"));
      return null;
    }
    if (leaf && stat.size > MAX_FILE_BYTES) {
      issues.push(issue(label, "$", "oversized-file"));
      return null;
    }
  }
  try {
    const bytes = readFileSync(absolute);
    const value = strictJson(decodeUtf8(bytes));
    return returnBytes ? { value, bytes } : { value };
  } catch (error) {
    const code = error instanceof JsonProblem
      ? error.code
      : error instanceof TypeError
        ? "invalid-utf8"
        : "invalid-json";
    issues.push(issue(label, "$", code));
    return null;
  }
}

function verifyManifestationReceipt(path, json, skillsRoot) {
  const schemaInfo = loadManifestationReceiptSchema();
  const abilitySchema = loadAbilitySchema();
  const rightsInfo = loadRightsBaseline();
  const receiptSchema = loadReceiptSchema();
  const issues = [
    ...schemaInfo.issues,
    ...abilitySchema.issues,
    ...rightsInfo.issues,
    ...receiptSchema.issues,
  ];
  const absolute = resolve(path);
  const label = basename(absolute) || "manifestation-receipt.json";
  const loaded = readAbsoluteJson(absolute, label, issues);
  const receipt = loaded?.value;
  let ability = null;

  if (loaded !== null && schemaInfo.schema && schemaInfo.issues.length === 0) {
    validateManifestationReceiptRecord(receipt, label, schemaInfo.schema, issues, absolute);
    if (record(receipt) && typeof receipt.ability === "string" && ID_PATTERN.test(receipt.ability)) {
      ability = validateAbility(
        skillsRoot,
        receipt.ability,
        abilitySchema.schema,
        schemaInfo.schema,
      );
      if (ability.issues.length > 0 || !ability.manifestSha256 || !ability.bundleSha256) {
        issues.push(issue(label, "$.ability", "ability-not-valid"));
      }
    }

    if (
      record(receipt)
      && receipt.evidence_class === "manifestation_provider_evidence"
      && receipt.suite_karma?.state === "final"
      && receipt.suite_karma.storage === "project_path"
      && typeof receipt.suite_karma.receipt_path === "string"
    ) {
      const karmaLabel = basename(receipt.suite_karma.receipt_path) || "karma-receipt.json";
      const karmaLoaded = readAbsoluteJson(
        receipt.suite_karma.receipt_path,
        karmaLabel,
        issues,
        true,
      );
      if (karmaLoaded !== null) {
        const karma = karmaLoaded.value;
        if (sha256(karmaLoaded.bytes) !== receipt.suite_karma.sha256) {
          issues.push(issue(label, "$.suite_karma.sha256", "karma-receipt-digest-mismatch"));
        }
        if (receiptSchema.schema && receiptSchema.issues.length === 0) {
          validateWithSchema(karma, receiptSchema.schema, receiptSchema.schema, karmaLabel, "$", issues);
        }
        if (!record(karma) || karma.state !== "final") {
          issues.push(issue(karmaLabel, "$.state", "draft-receipt"));
        }
        if (!record(karma) || karma.ability_id !== receipt.ability) {
          issues.push(issue(karmaLabel, "$.ability_id", "manifestation-ability-mismatch"));
        }
        if (ability?.manifestSha256 && karma?.ability_manifest_sha256 !== ability.manifestSha256) {
          issues.push(issue(karmaLabel, "$.ability_manifest_sha256", "ability-digest-mismatch"));
        }
        if (ability?.bundleSha256 && karma?.ability_bundle_sha256 !== ability.bundleSha256) {
          issues.push(issue(karmaLabel, "$.ability_bundle_sha256", "ability-digest-mismatch"));
        }
      }
    }
  }

  sortIssues(issues);
  const payload = {
    protocol: "kingdom.nen-manifestation-validation/0.1",
    valid: issues.length === 0,
    manifestation_receipt_schema_sha256: schemaInfo.sha256,
    karma_receipt_schema_sha256: receiptSchema.sha256,
    ability_schema_sha256: abilitySchema.sha256,
    rights_sha256: rightsInfo.sha256,
    issues,
  };
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else {
    process.stdout.write(`Manifestation receipt: ${payload.valid ? "valid" : "invalid"} · ${issues.length} issues · ${payload.manifestation_receipt_schema_sha256 ?? "unavailable"}\n`);
    printIssues(issues);
  }
  return issues.length === 0 ? 0 : 1;
}

// Local Git objects, read-only.
//
// A receipt binds an exact revision. Verifying it at that revision means
// reading this repository's own object store: no fetch, no checkout, no
// extracted tree. The environment is built from nothing so an inherited
// GIT_DIR, replace ref, promisor remote or global config cannot redirect what
// is read; lazy fetching and every transport protocol are switched off, so a
// missing object stays missing. Only PATH is inherited, to find `git` itself:
// whoever launches the verifier already chooses which programs it runs.

function gitEnvironment() {
  return {
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    LANG: "C",
    LC_ALL: "C",
    GIT_ALLOW_PROTOCOL: "",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_LITERAL_PATHSPECS: "1",
    GIT_NO_LAZY_FETCH: "1",
    GIT_NO_REPLACE_OBJECTS: "1",
    GIT_OPTIONAL_LOCKS: "0",
    GIT_TERMINAL_PROMPT: "0",
  };
}

// A Git call reports how it ended, not only its output. A lookup that timed
// out, was killed, could not start or overflowed its buffer has failed; it has
// not shown that an object is absent, and is never reported as if it had.
function runGit(args, input = "") {
  const result = spawnSync("git", ["-c", "protocol.allow=never", "-C", OS_ROOT, ...args], {
    cwd: OS_ROOT,
    env: gitEnvironment(),
    input,
    maxBuffer: GIT_OUTPUT_LIMIT,
    timeout: GIT_TIMEOUT_MS,
    killSignal: "SIGKILL",
    windowsHide: true,
  });
  const exited = !result.error && result.signal === null ? result.status : null;
  return {
    ok: exited === 0 && Buffer.isBuffer(result.stdout),
    exited,
    stdout: Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.alloc(0),
  };
}

let suiteRepositoryAnswer = null;

// The suite root must itself be a repository's top level. A copied suite
// inside some unrelated checkout must not borrow that checkout's history.
// rev-parse exits 128 outside any repository; any other failure is a lookup
// that did not finish.
function suiteRepository() {
  if (suiteRepositoryAnswer !== null) return suiteRepositoryAnswer;
  const result = runGit(["rev-parse", "--show-toplevel"]);
  let answer = "lookup-failed";
  if (result.ok) {
    try {
      answer = realpathSync(result.stdout.toString("utf8").replace(/\n$/, "")) === realpathSync(OS_ROOT)
        ? "available"
        : "unavailable";
    } catch {
      answer = "unavailable";
    }
  } else if (result.exited === 128) {
    answer = "unavailable";
  }
  suiteRepositoryAnswer = answer;
  return answer;
}

// `cat-file -e` exits 1, silently, for a well-formed ID that is not in local
// objects. That exit, and only that exit, means missing.
function localCommit(revision) {
  const exists = runGit(["cat-file", "-e", revision]);
  if (exists.exited === 1) return "missing";
  if (!exists.ok) return "lookup-failed";
  const type = runGit(["cat-file", "-t", revision]);
  if (!type.ok) return "lookup-failed";
  return type.stdout.toString("utf8").trim() === "commit" ? "present" : "not-commit";
}

// A suite revision must be held by a line someone keeps: an ancestor of HEAD,
// or of a local branch, tag or remote-tracking ref. A commit object no ref
// reaches leaves no trace in any branch listing, so a receipt bound to one
// would be judged by an ability nobody adopted. The ref that holds it is
// reported so a reader can judge that line for themselves.
function revisionReachability(revision) {
  const head = runGit(["merge-base", "--is-ancestor", revision, "HEAD"]);
  if (head.ok) return { status: "reachable", from: "HEAD" };
  if (head.exited !== 1) return { status: "lookup-failed", from: null };
  const refs = runGit([
    "for-each-ref",
    "--count=1",
    "--contains",
    revision,
    "--format=%(refname)",
    "refs/heads",
    "refs/tags",
    "refs/remotes",
  ]);
  if (!refs.ok) return { status: "lookup-failed", from: null };
  const name = refs.stdout.toString("utf8").trim();
  return name === "" ? { status: "not-reachable", from: null } : { status: "reachable", from: name };
}

function revisionEntries(revision, paths, recursive) {
  const args = ["ls-tree", "-z", "-l", "--full-tree"];
  if (recursive) args.push("-r", "-t");
  const result = runGit([...args, revision, "--", ...paths]);
  if (!result.ok) return null;
  const entries = [];
  for (const line of result.stdout.toString("utf8").split("\0")) {
    if (line === "") continue;
    const match = line.match(/^([0-7]{6}) (blob|tree|commit) ([0-9a-f]{40,64}) +(-|[0-9]+)\t([\s\S]+)$/);
    if (!match) return null;
    entries.push({
      mode: match[1],
      type: match[2],
      oid: match[3],
      size: match[4] === "-" ? 0 : Number(match[4]),
      path: match[5],
    });
  }
  return entries;
}

function readGitBlobs(oids) {
  const unique = [...new Set(oids)];
  const blobs = new Map();
  if (unique.length === 0) return blobs;
  const result = runGit(["cat-file", "--batch"], `${unique.join("\n")}\n`);
  if (!result.ok) return null;
  const output = result.stdout;
  let offset = 0;
  for (const oid of unique) {
    const newline = output.indexOf(0x0a, offset);
    if (newline < 0) return null;
    const header = output.subarray(offset, newline).toString("utf8").match(/^([0-9a-f]{40,64}) blob ([0-9]+)$/);
    if (!header || header[1] !== oid) return null;
    const start = newline + 1;
    const end = start + Number(header[2]);
    if (end >= output.length || output[end] !== 0x0a) return null;
    blobs.set(oid, output.subarray(start, end));
    offset = end + 1;
  }
  return blobs;
}

// The same lstat/read/list surface as LOCAL_FILES, answered from one
// revision's tree listing and blobs held in memory. Git modes keep their
// meaning: 120000 is a symlink, 100755 is executable, a gitlink is neither a
// file nor a directory.
function revisionFiles(root, entries, blobs) {
  const nodes = new Map([[root, { kind: "directory", mode: 0o040000, size: 0, oid: null }]]);
  const children = new Map();
  for (const entry of entries) {
    const parts = entry.path.split("/");
    let parent = root;
    parts.forEach((part, index) => {
      const current = join(parent, part);
      if (!children.has(parent)) children.set(parent, new Set());
      children.get(parent).add(part);
      if (index < parts.length - 1) {
        if (!nodes.has(current)) nodes.set(current, { kind: "directory", mode: 0o040000, size: 0, oid: null });
      } else {
        const kind = entry.type === "tree"
          ? "directory"
          : entry.type === "blob"
            ? (entry.mode === "120000" ? "symlink" : "file")
            : "other";
        nodes.set(current, { kind, mode: Number.parseInt(entry.mode, 8), size: entry.size, oid: entry.oid });
      }
      parent = current;
    });
  }
  const absent = () => Object.assign(new Error("not present in this revision"), { code: "ENOENT" });
  const stat = (node) => ({
    isSymbolicLink: () => node.kind === "symlink",
    isDirectory: () => node.kind === "directory",
    isFile: () => node.kind === "file",
    size: node.size,
    mode: node.mode,
  });
  return Object.freeze({
    lstat(path) {
      const node = nodes.get(path);
      if (!node) throw absent();
      return stat(node);
    },
    read(path) {
      const node = nodes.get(path);
      if (!node || node.kind !== "file" || !blobs.has(node.oid)) throw absent();
      return blobs.get(node.oid);
    },
    list(path) {
      const node = nodes.get(path);
      if (!node || node.kind !== "directory") throw absent();
      return [...(children.get(path) ?? [])].map((name) => ({ name, ...stat(nodes.get(join(path, name))) }));
    },
  });
}

// Load the ability a receipt names, as committed at that revision: its folder,
// the ability and manifestation-receipt schemas it was validated against, and
// the rights baseline. The receipt schema is not taken from the revision.
// kingdom.karma/0.1 is a fixed protocol, and a revision that could supply its
// own receipt schema could loosen a nested rule (inputs[].assurance, say) and
// so choose its own judge.
function loadRevisionSuite(revision, abilityId, label, issues) {
  const repository = suiteRepository();
  if (repository !== "available") {
    const failed = repository === "lookup-failed";
    issues.push(issue(label, "$.ability_revision", failed ? "revision-lookup-failed" : "suite-repository-unavailable"));
    return { status: failed ? "lookup_failed" : "repository_unavailable", files: null, reachableFrom: null };
  }
  const presence = localCommit(revision);
  if (presence !== "present") {
    const [code, status] = {
      missing: ["revision-not-present-locally", "revision_not_present_locally"],
      "not-commit": ["revision-not-a-commit", "revision_not_a_commit"],
      "lookup-failed": ["revision-lookup-failed", "lookup_failed"],
    }[presence];
    issues.push(issue(label, "$.ability_revision", code));
    return { status, files: null, reachableFrom: null };
  }
  const reachability = revisionReachability(revision);
  if (reachability.status !== "reachable") {
    const failed = reachability.status === "lookup-failed";
    issues.push(issue(label, "$.ability_revision", failed ? "revision-lookup-failed" : "revision-not-reachable"));
    return { status: failed ? "lookup_failed" : "revision_not_reachable", files: null, reachableFrom: null };
  }
  const reachableFrom = reachability.from;
  const entries = revisionEntries(revision, [
    ABILITY_SCHEMA_REL,
    MANIFESTATION_RECEIPT_SCHEMA_REL,
    RIGHTS_BASELINE_REL,
    `skills/${abilityId}`,
  ], true);
  if (entries === null) {
    issues.push(issue(label, "$.ability_revision", "revision-suite-unreadable"));
    return { status: "unreadable", files: null, reachableFrom };
  }
  // Blobs the validator would reject as oversized are never read.
  const wanted = entries.filter((entry) =>
    entry.type === "blob" && entry.mode !== "120000" && entry.size <= MAX_FILE_BYTES
  );
  if (
    entries.length > MAX_REVISION_SUITE_ENTRIES
    || wanted.reduce((total, entry) => total + entry.size, 0) > MAX_REVISION_SUITE_BYTES
  ) {
    issues.push(issue(label, "$.ability_revision", "revision-suite-too-large"));
    return { status: "too_large", files: null, reachableFrom };
  }
  const blobs = readGitBlobs(wanted.map((entry) => entry.oid));
  if (blobs === null) {
    issues.push(issue(label, "$.ability_revision", "revision-suite-unreadable"));
    return { status: "unreadable", files: null, reachableFrom };
  }
  return { status: "read", files: revisionFiles(OS_ROOT, entries, blobs), reachableFrom };
}

// Digest recomputation.
//
// Outputs and inputs are recomputed only where the receipt itself says where
// their bytes are and those bytes are on this machine without a request:
//
// - A path that names the receipt's own record directory from the repository
//   root, as in "records/<record>/evidence/x.json", is read from that
//   directory, never through a symlink.
// - With --at-revision, an input bound to an exact commit ID is read from that
//   commit's root tree, as Git's own <commit>:<path> reads it, when the commit
//   is already in this repository's local objects. Only this repository's
//   objects are consulted and `source` is not interpreted, so an input from
//   another repository comes back as not present here. A commit ID names one
//   tree, so the bytes are the same whether or not a ref reaches the commit.
//
// A bare relative path ("evidence/x.json") could be relative to a predecessor
// record, another repository or anything else. It is not guessed at, because
// hashing whichever file happens to share its name would report a correct
// receipt as tampered. Everything not recomputed is listed with a reason and is
// never counted as a pass.

function plainPathParts(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 1000) return null;
  // Whitespace marks a description rather than a path, as it does in an output
  // reference.
  if (
    value.startsWith("/")
    || value.includes("\\")
    || value.includes(":")
    || /[\s\u0000-\u001f\u007f]/u.test(value)
  ) {
    return null;
  }
  const parts = value.split("/");
  return parts.some((part) => part === "" || part === "." || part === "..") ? null : parts;
}

// An output reference starts with its path, optionally followed by ": " and a
// description, as in "records/<record>/charter.yaml: the expedition charter".
function outputReferenceParts(reference) {
  const match = typeof reference === "string" ? reference.match(/^([^\s:]+)(?::\s|$)/u) : null;
  return match ? plainPathParts(match[1]) : null;
}

// The record directory as path components from the repository root, or null
// when the receipt does not live inside this repository, in which case no path
// can name it.
function recordAnchor(recordDirectory) {
  let fromRoot;
  try {
    fromRoot = relativePath(realpathSync(OS_ROOT), recordDirectory);
  } catch {
    return null;
  }
  if (fromRoot === "" || isAbsolute(fromRoot) || fromRoot === ".." || fromRoot.startsWith(`..${sep}`)) return null;
  return fromRoot.split(sep);
}

function recordRelativeParts(anchor, parts) {
  if (anchor === null || parts.length <= anchor.length) return null;
  return anchor.every((part, index) => parts[index] === part) ? parts.slice(anchor.length) : null;
}

function readRecordFile(recordDirectory, relative, budget) {
  let current = recordDirectory;
  for (const [index, part] of relative.entries()) {
    current = join(current, part);
    let stat;
    try {
      stat = lstatSync(current);
    } catch {
      return { reason: "missing_file" };
    }
    if (stat.isSymbolicLink()) return { reason: "not_a_regular_file" };
    const leaf = index === relative.length - 1;
    if (!leaf && !stat.isDirectory()) return { reason: "missing_file" };
    if (leaf && !stat.isFile()) return { reason: "not_a_regular_file" };
    if (leaf && (stat.size > MAX_DIGEST_FILE_BYTES || stat.size > budget.remaining)) return { reason: "too_large" };
  }
  try {
    const bytes = readFileSync(current);
    if (bytes.byteLength > MAX_DIGEST_FILE_BYTES || bytes.byteLength > budget.remaining) return { reason: "too_large" };
    budget.remaining -= bytes.byteLength;
    return { bytes };
  } catch {
    return { reason: "unreadable" };
  }
}

const PRESENCE_REASONS = Object.freeze({
  missing: "revision_not_present_locally",
  "not-commit": "revision_not_a_commit",
  "lookup-failed": "revision_lookup_failed",
});

function readRevisionFiles(requests, budget) {
  // requests: [{ revision, path, settle(result) }]
  const byRevision = new Map();
  for (const request of requests) {
    if (!byRevision.has(request.revision)) byRevision.set(request.revision, []);
    byRevision.get(request.revision).push(request);
  }
  for (const [revision, group] of [...byRevision.entries()].sort(([left], [right]) => binaryCompare(left, right))) {
    const repository = suiteRepository();
    if (repository !== "available") {
      const reason = repository === "lookup-failed" ? "revision_lookup_failed" : "repository_unavailable";
      for (const request of group) request.settle({ reason });
      continue;
    }
    const presence = localCommit(revision);
    if (presence !== "present") {
      for (const request of group) request.settle({ reason: PRESENCE_REASONS[presence] });
      continue;
    }
    const entries = revisionEntries(revision, [...new Set(group.map((request) => request.path))], false);
    if (entries === null) {
      for (const request of group) request.settle({ reason: "unreadable" });
      continue;
    }
    const byPath = new Map(entries.map((entry) => [entry.path, entry]));
    const readable = [];
    for (const request of group) {
      const entry = byPath.get(request.path);
      if (!entry) request.settle({ reason: "path_not_in_revision" });
      else if (entry.type !== "blob" || !["100644", "100755"].includes(entry.mode)) {
        request.settle({ reason: "not_a_regular_file" });
      } else if (entry.size > MAX_DIGEST_FILE_BYTES || entry.size > budget.remaining) {
        request.settle({ reason: "too_large" });
      } else {
        budget.remaining -= entry.size;
        readable.push({ request, entry });
      }
    }
    const blobs = readGitBlobs(readable.map(({ entry }) => entry.oid));
    for (const { request, entry } of readable) {
      if (blobs === null || !blobs.has(entry.oid)) request.settle({ reason: "unreadable" });
      else request.settle({ bytes: blobs.get(entry.oid) });
    }
  }
}

function recomputeReceiptDigests(receipt, receiptPath, atRevision, label, issues) {
  let recordDirectory = null;
  try {
    recordDirectory = realpathSync(dirname(resolve(receiptPath)));
  } catch {
    recordDirectory = null;
  }
  const anchor = recordDirectory === null ? null : recordAnchor(recordDirectory);
  const budget = { remaining: MAX_DIGEST_TOTAL_BYTES };
  const entries = [];
  const revisionRequests = [];

  function fromRecord(parts) {
    const inside = recordRelativeParts(anchor, parts);
    if (inside === null) return { reason: "location_ambiguous" };
    return { basis: "record_directory", ...readRecordFile(recordDirectory, inside, budget) };
  }

  // A recomputed entry is a mismatch when its digest differs, and a
  // bytes_mismatch when its digest matches but the observed byte count it
  // declares does not. Both count as mismatched, so the summary line always
  // agrees with the issues.
  function settle(entry, expected, result, onMismatch, declaredBytes = null) {
    if (!result.bytes) {
      entry.status = "not_recomputed";
      entry.basis = null;
      entry.reason = result.reason;
      return;
    }
    entry.basis = result.basis;
    entry.status = "match";
    if (sha256(result.bytes) !== expected) {
      entry.status = "mismatch";
      onMismatch("digest");
    }
    if (declaredBytes !== null && declaredBytes !== BigInt(result.bytes.byteLength)) {
      if (entry.status === "match") entry.status = "bytes_mismatch";
      onMismatch("bytes");
    }
  }

  receipt.outputs.forEach((output, index) => {
    const entry = { field: `$.outputs[${index}]`, status: "not_recomputed", basis: null, reason: null };
    entries.push(entry);
    const parts = outputReferenceParts(output.reference);
    if (!parts) {
      entry.reason = "not_a_path";
      return;
    }
    settle(
      entry,
      output.digest,
      fromRecord(parts),
      () => issues.push(issue(label, `${entry.field}.digest`, "output-digest-mismatch")),
    );
  });

  receipt.inputs.forEach((input, index) => {
    const entry = { field: `$.inputs[${index}]`, status: "not_recomputed", basis: null, reason: null };
    entries.push(entry);
    const declaredBytes = input.bytes?.basis === "observed" && /^[0-9]+$/.test(input.bytes.value)
      ? BigInt(input.bytes.value)
      : null;
    const onMismatch = (kind) => issues.push(issue(
      label,
      `${entry.field}.${kind}`,
      kind === "bytes" ? "input-bytes-mismatch" : "input-digest-mismatch",
    ));
    if (input.boundary === "remote_public" || input.boundary === "remote_private") {
      entry.reason = "remote_boundary";
      return;
    }
    const parts = plainPathParts(input.path);
    if (!parts) {
      entry.reason = "not_a_path";
      return;
    }
    if (EXACT_REVISION.test(input.revision)) {
      if (!atRevision) {
        entry.reason = "revision_not_read";
        return;
      }
      revisionRequests.push({
        revision: input.revision,
        path: parts.join("/"),
        settle: (result) => settle(entry, input.digest, { basis: "git_revision", ...result }, onMismatch, declaredBytes),
      });
      return;
    }
    settle(entry, input.digest, fromRecord(parts), onMismatch, declaredBytes);
  });

  readRevisionFiles(revisionRequests, budget);
  const recomputed = entries.filter((entry) => entry.status !== "not_recomputed").length;
  return {
    recomputed,
    mismatched: entries.filter((entry) => entry.status === "mismatch" || entry.status === "bytes_mismatch").length,
    not_recomputed: entries.length - recomputed,
    entries,
  };
}

// verify-receipt checks one kingdom.karma/0.1 receipt. Receipts are unsigned
// by design, so a pass establishes only what can be recomputed here:
//
// - the receipt against this checkout's closed receipt schema, in both modes;
// - time order, absence of template placeholders, and the bound ability's
//   manifest and bundle digests, against the working tree by default or, with
//   --at-revision, against the ability as committed at the receipt's own
//   ability_revision, which must be in local objects and reachable from HEAD
//   or a local branch, tag or remote-tracking ref;
// - the SHA-256 of outputs and inputs whose paths name the receipt's record
//   directory and, with --at-revision, of inputs at exact commits already in
//   this repository's local objects. Everything else is listed as not
//   recomputed, with a reason.
//
// It does not show that a finding is true, that the authority cited was real
// or sufficient, that the revision was the one actually run, or that any later
// action is permitted.
function verifyReceipt(path, json, skillsRoot, atRevision = false) {
  const issues = [];
  const label = basename(path) || "receipt.json";
  // Whether the file parsed is tracked apart from its value: null, false, 0
  // and "" are JSON values too, and each must reach the schema.
  let loaded = false;
  let receipt = null;
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) issues.push(issue(label, "$", "symlink"));
    else if (!stat.isFile()) issues.push(issue(label, "$", "invalid-file"));
    else if (stat.size > MAX_FILE_BYTES) issues.push(issue(label, "$", "oversized-file"));
    else {
      try {
        receipt = strictJson(decodeUtf8(readFileSync(path)));
        loaded = true;
      } catch (error) {
        const code = error instanceof JsonProblem ? error.code : error instanceof TypeError ? "invalid-utf8" : "invalid-json";
        issues.push(issue(label, "$", code));
      }
    }
  } catch {
    issues.push(issue(label, "$", "missing-file"));
  }

  // The receipt schema always comes from this checkout (see loadRevisionSuite).
  // The ability it names is checked against the working tree by default.
  // --at-revision reads that ability from the receipt's own ability_revision in
  // local Git objects and never falls back to the working tree when that fails.
  const receiptSchema = loadReceiptSchema();
  const suite = atRevision
    ? {
      source: "git_revision",
      revision: null,
      status: "not_read",
      reachableFrom: null,
      files: null,
      skillsRoot: DEFAULT_SKILLS_ROOT,
    }
    : { source: "working_tree", files: LOCAL_FILES, skillsRoot };
  if (atRevision && record(receipt)) {
    if (typeof receipt.ability_revision !== "string" || !EXACT_REVISION.test(receipt.ability_revision)) {
      issues.push(issue(label, "$.ability_revision", "revision-not-exact"));
      suite.status = "revision_not_exact";
    } else if (typeof receipt.ability_id !== "string" || !ID_PATTERN.test(receipt.ability_id)) {
      suite.revision = receipt.ability_revision;
      issues.push(issue(label, "$.ability_id", "ability-not-valid"));
    } else {
      suite.revision = receipt.ability_revision;
      const revisionSuite = loadRevisionSuite(suite.revision, receipt.ability_id, label, issues);
      suite.status = revisionSuite.status;
      suite.reachableFrom = revisionSuite.reachableFrom;
      suite.files = revisionSuite.files;
    }
  }
  const unavailable = { schema: null, sha256: null, issues: [] };
  const abilitySchema = suite.files ? loadAbilitySchema(suite.files) : unavailable;
  const manifestationReceiptSchema = suite.files ? loadManifestationReceiptSchema(suite.files) : unavailable;
  const rightsInfo = suite.files ? loadRightsBaseline(suite.files) : unavailable;
  issues.push(
    ...receiptSchema.issues,
    ...abilitySchema.issues,
    ...manifestationReceiptSchema.issues,
    ...rightsInfo.issues,
  );
  let digests = null;
  let checked = false;

  if (loaded && receiptSchema.schema && receiptSchema.issues.length === 0) {
    const issuesBeforeSchema = issues.length;
    validateWithSchema(receipt, receiptSchema.schema, receiptSchema.schema, label, "$", issues);
    checked = true;
    const schemaValid = issues.length === issuesBeforeSchema;
    // The rest reads fields, so it needs an object; the schema has already
    // reported anything else.
    if (record(receipt)) {
      if (receipt.state === "draft") {
        issues.push(issue(label, "$.state", "draft-receipt"));
      }
      if (receipt.state === "final") {
        const hasTemplatePlaceholder = receipt.receipt_id === "draft-replace-me"
          || receipt.invocation_id === "draft-replace-me"
          || (
            typeof receipt.ability_revision === "string"
            && receipt.ability_revision.startsWith("template:")
          )
          || (
            typeof receipt.authority?.authority_reference === "string"
            && receipt.authority.authority_reference.startsWith("Replace with")
          )
          || (
            Array.isArray(receipt.predicted_effects)
            && receipt.predicted_effects.includes("Replace with the predicted bounded effect.")
          )
          || (
            Array.isArray(receipt.observed_effects)
            && receipt.observed_effects.includes("No action recorded; this is a draft template.")
          )
          || (
            Array.isArray(receipt.uncertainty)
            && receipt.uncertainty.includes("Replace draft fields after a real invocation or refusal.")
          )
          || (
            receipt.started_at === "1970-01-01T00:00:00.000Z"
            && receipt.finished_at === "1970-01-01T00:00:00.000Z"
          );
        if (hasTemplatePlaceholder) issues.push(issue(label, "$", "receipt-placeholder"));
      }
      if (typeof receipt.started_at === "string" && typeof receipt.finished_at === "string") {
        const start = normalizeTimestamp(receipt.started_at);
        const finish = normalizeTimestamp(receipt.finished_at);
        if (start === null) issues.push(issue(label, "$.started_at", "invalid-timestamp"));
        if (finish === null) issues.push(issue(label, "$.finished_at", "invalid-timestamp"));
        if (start !== null && finish !== null && finish < start) {
          issues.push(issue(label, "$.finished_at", "invalid-time-order"));
        }
      }
      if (receipt.repair && receipt.repair.required === false && !["not_needed", "complete"].includes(receipt.repair.status)) {
        issues.push(issue(label, "$.repair.status", "invalid-repair-status"));
      }
      if (receipt.repair && receipt.repair.required === true && receipt.repair.status === "not_needed") {
        issues.push(issue(label, "$.repair.status", "invalid-repair-status"));
      }
      for (const field of ["time_ms", "data_egress_bytes", "remote_gpu_seconds"]) {
        const measurement = receipt.costs?.[field];
        if (measurement && typeof measurement === "object") {
          const unknown = measurement.value === "unknown";
          if ((unknown && measurement.basis !== "not_measured") || (!unknown && measurement.basis === "not_measured")) {
            issues.push(issue(label, `$.costs.${field}`, "invalid-measurement-basis"));
          }
        }
      }
      if (
        typeof receipt.ability_id === "string"
        && ID_PATTERN.test(receipt.ability_id)
        && abilitySchema.schema
        && abilitySchema.issues.length === 0
        && rightsInfo.issues.length === 0
      ) {
        const ability = validateAbility(
          suite.skillsRoot,
          receipt.ability_id,
          abilitySchema.schema,
          manifestationReceiptSchema.schema,
          suite.files,
        );
        if (ability.issues.length > 0 || !ability.manifestSha256 || !ability.bundleSha256) {
          issues.push(issue(label, "$.ability_id", "ability-not-valid"));
        } else {
          if (receipt.ability_manifest_sha256 !== ability.manifestSha256) {
            issues.push(issue(label, "$.ability_manifest_sha256", "ability-digest-mismatch"));
          }
          if (receipt.ability_bundle_sha256 !== ability.bundleSha256) {
            issues.push(issue(label, "$.ability_bundle_sha256", "ability-digest-mismatch"));
          }
        }
      }
      // Paths in a receipt that failed its schema are not followed.
      if (schemaValid) digests = recomputeReceiptDigests(receipt, path, atRevision, label, issues);
    }
  }
  // A pass needs a receipt that was actually checked. Every path that skips
  // the schema reports why, so this is only a floor under later edits.
  if (!checked && issues.length === 0) issues.push(issue(label, "$", "receipt-not-checked"));
  sortIssues(issues);
  const payload = {
    protocol: "kingdom.karma-validation/0.1",
    valid: checked && issues.length === 0,
    receipt_schema_sha256: receiptSchema.sha256,
    ability_schema_sha256: abilitySchema.sha256,
    manifestation_receipt_schema_sha256: manifestationReceiptSchema.sha256,
    rights_sha256: rightsInfo.sha256,
    suite: atRevision
      ? {
        source: "git_revision",
        revision: suite.revision,
        status: suite.status,
        reachable_from: suite.reachableFrom,
      }
      : { source: "working_tree" },
    digests,
    issues,
  };
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else {
    process.stdout.write(`KARMA receipt: ${payload.valid ? "valid" : "invalid"} · ${issues.length} issues · ${payload.receipt_schema_sha256 ?? "unavailable"}\n`);
    if (atRevision) process.stdout.write(`${suiteSummary(suite)}\n`);
    if (digests) process.stdout.write(`${digestSummary(digests)}\n`);
    printIssues(issues);
  }
  return payload.valid ? 0 : 1;
}

function suiteSummary(suite) {
  const revision = suite.revision ?? "unknown";
  switch (suite.status) {
    case "read":
      return `Suite: ability at Git revision ${revision}, reachable from ${safeTerminal(suite.reachableFrom)}, read from local objects; receipt schema from this checkout`;
    case "revision_not_present_locally":
      return `Suite: Git revision ${revision} is not in this repository's local objects; nothing was fetched`;
    case "revision_not_a_commit":
      return `Suite: Git object ${revision} is not a commit`;
    case "revision_not_reachable":
      return `Suite: Git revision ${revision} is in local objects but no local branch, tag, remote-tracking ref or HEAD reaches it; it was not read`;
    case "lookup_failed":
      return `Suite: a Git lookup for revision ${revision} did not finish (timeout, signal or Git error), so it was not read; this says nothing about whether it is present, and nothing was fetched`;
    case "revision_not_exact":
      return "Suite: ability_revision is not an exact commit ID; no revision was read";
    case "repository_unavailable":
      return "Suite: the suite root is not the top level of a Git repository; no history was read";
    case "too_large":
    case "unreadable":
      return `Suite: Git revision ${revision} could not be read within bounds`;
    default:
      return "Suite: no revision was read";
  }
}

function digestSummary(digests) {
  const reasons = new Map();
  for (const entry of digests.entries) {
    if (entry.reason) reasons.set(entry.reason, (reasons.get(entry.reason) ?? 0) + 1);
  }
  const detail = [...reasons.entries()]
    .sort(([left], [right]) => binaryCompare(left, right))
    .map(([reason, count]) => `${count} ${reason}`)
    .join(", ");
  return `Digests: ${digests.recomputed} recomputed · ${digests.mismatched} mismatched · ${digests.not_recomputed} not recomputed${detail ? ` (${detail})` : ""}`;
}

function usage() {
  process.stderr.write(
    "usage: kingdom nen [list [--json] | validate [ID] [--json] | show ID [--json] | digest ID | types [--json] | receipt-template ID | verify-receipt FILE [--at-revision] [--json] | verify-manifestation-receipt FILE [--json]]\n"
    + "       bun bin/nen.mjs --skills-root /absolute/path <command>\n"
    + "       --at-revision reads the named ability at the receipt's ability_revision, which a local ref must reach, from local Git objects; it never fetches and does not combine with --skills-root\n",
  );
  return 2;
}

function parseCli(argv) {
  const args = [...argv];
  let skillsRoot = DEFAULT_SKILLS_ROOT;
  const rootIndex = args.indexOf("--skills-root");
  if (rootIndex >= 0) {
    if (rootIndex + 1 >= args.length || args.filter((arg) => arg === "--skills-root").length !== 1) return null;
    const candidate = args[rootIndex + 1];
    if (!isAbsolute(candidate)) return null;
    skillsRoot = resolve(candidate);
    args.splice(rootIndex, 2);
  }
  const jsonCount = args.filter((arg) => arg === "--json").length;
  if (jsonCount > 1) return null;
  const json = jsonCount === 1;
  if (json) args.splice(args.indexOf("--json"), 1);
  const atRevisionCount = args.filter((arg) => arg === "--at-revision").length;
  if (atRevisionCount > 1) return null;
  const atRevision = atRevisionCount === 1;
  if (atRevision) {
    // The revision supplies the skills; a second skills root would be ambiguous.
    if (rootIndex >= 0) return null;
    args.splice(args.indexOf("--at-revision"), 1);
  }
  return { args, skillsRoot, json, atRevision };
}

function main() {
  const parsed = parseCli(process.argv.slice(2));
  if (!parsed) return usage();
  const { args, skillsRoot, json, atRevision } = parsed;
  const command = args[0] ?? "list";
  const rest = args.slice(1);
  if (atRevision && command !== "verify-receipt") return usage();

  if (command === "list" && rest.length === 0) return listCommand(skillsRoot, json);
  if (command === "validate" && rest.length <= 1) return validateCommand(skillsRoot, rest[0] ?? null, json);
  if (command === "show" && rest.length === 1) return showCommand(skillsRoot, rest[0]);
  if (command === "digest" && rest.length === 1 && !json) return digestCommand(skillsRoot, rest[0]);
  if (command === "types" && rest.length === 0) return typesCommand(json);
  if (command === "receipt-template" && rest.length === 1 && !json) return receiptTemplateCommand(skillsRoot, rest[0]);
  if (command === "verify-receipt" && rest.length === 1) return verifyReceipt(rest[0], json, skillsRoot, atRevision);
  if (command === "verify-manifestation-receipt" && rest.length === 1) {
    return verifyManifestationReceipt(rest[0], json, skillsRoot);
  }
  return usage();
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(SCRIPT_PATH)) {
  process.exitCode = main();
}

export { strictJson };
