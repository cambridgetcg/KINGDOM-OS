#!/usr/bin/env node

import {
  lstatSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_FILE_BYTES = 64 * 1024;
const MAX_BUNDLE_FILES = 256;
const MAX_BUNDLE_BYTES = 4 * 1024 * 1024;
const MAX_BUNDLE_NODES = 512;
const MAX_BUNDLE_DEPTH = 16;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const OS_ROOT = dirname(dirname(SCRIPT_PATH));
const DEFAULT_SKILLS_ROOT = join(OS_ROOT, "skills");
const ABILITY_SCHEMA_REL = "schemas/nen-ability-v0.1.schema.json";
const RECEIPT_SCHEMA_REL = "schemas/karma-receipt-v0.1.schema.json";
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

function safeRead(root, relative, label, issues, expected = "file", raw = false) {
  const parts = relative.split("/").filter(Boolean);
  let current = root;
  try {
    const rootStat = lstatSync(root);
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
      stat = lstatSync(current);
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
    const bytes = readFileSync(current);
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

function parseJsonFile(root, relative, label, issues) {
  const text = safeRead(root, relative, label, issues);
  if (text === null) return null;
  try {
    return strictJson(text);
  } catch (error) {
    issues.push(issue(label, "$", error instanceof JsonProblem ? error.code : "invalid-json"));
    return null;
  }
}

function jsonType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value === "object" ? "object" : typeof value;
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

function loadSchema(relative, expectedId, expectedFields) {
  const issues = [];
  const schema = parseJsonFile(OS_ROOT, relative, relative, issues);
  if (schema) validateSchemaContract(schema, expectedId, expectedFields, relative, issues);
  return {
    schema,
    sha256: schema && issues.length === 0 ? sha256(canonicalJson(schema)) : null,
    issues: sortIssues(issues),
  };
}

function loadAbilitySchema() {
  return loadSchema(ABILITY_SCHEMA_REL, "urn:kingdom:schema:nen-ability:0.1", ABILITY_FIELDS);
}

function loadReceiptSchema() {
  return loadSchema(RECEIPT_SCHEMA_REL, "urn:kingdom:schema:karma-receipt:0.1", RECEIPT_FIELDS);
}

function loadRightsBaseline() {
  const issues = [];
  const bytes = safeRead(OS_ROOT, RIGHTS_BASELINE_REL, RIGHTS_BASELINE_REL, issues, "file", true);
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

function optionalDirectorySymlink(skillsRoot, id, name, issues) {
  const relative = `${id}/${name}`;
  const label = `skills/${relative}`;
  try {
    const stat = lstatSync(join(skillsRoot, relative));
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

function inventorySkillBundle(skillsRoot, id, issues) {
  const base = join(skillsRoot, id);
  const inventory = [];
  let files = 0;
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
      entries = readdirSync(directory, { withFileTypes: true });
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
        stat = lstatSync(absolute);
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
      files += 1;
      bytes += stat.size;
      if (files > MAX_BUNDLE_FILES) {
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
        const content = readFileSync(absolute);
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
    const stat = lstatSync(base);
    if (stat.isSymbolicLink()) issues.push(issue(`skills/${id}`, "$", "symlink"));
    else if (!stat.isDirectory()) issues.push(issue(`skills/${id}`, "$", "invalid-directory"));
    else walk(base, "", 0);
  } catch {
    issues.push(issue(`skills/${id}`, "$", "missing-root"));
  }
  return inventory;
}

function validateAbility(skillsRoot, id, schema) {
  const issues = [];
  const manifestLabel = `skills/${id}/ability.json`;
  if (!ID_PATTERN.test(id)) {
    issues.push(issue(manifestLabel, "$.id", "invalid-id"));
    return { id, manifest: null, manifestSha256: null, bundleSha256: null, issues };
  }

  const manifest = parseJsonFile(skillsRoot, `${id}/ability.json`, manifestLabel, issues);
  const skillLabel = `skills/${id}/SKILL.md`;
  const skillText = safeRead(skillsRoot, `${id}/SKILL.md`, skillLabel, issues);
  const yamlLabel = `skills/${id}/agents/openai.yaml`;
  const yamlText = safeRead(skillsRoot, `${id}/agents/openai.yaml`, yamlLabel, issues);
  for (const optional of ["references", "scripts", "assets"]) {
    optionalDirectorySymlink(skillsRoot, id, optional, issues);
  }

  if (manifest && schema) {
    validateWithSchema(manifest, schema, schema, manifestLabel, "$", issues);
    semanticAbility(manifest, id, manifestLabel, issues);
  }
  if (skillText !== null) {
    const frontmatter = parseSkillFrontmatter(skillText, skillLabel, issues);
    if (frontmatter && frontmatter.name !== id) {
      issues.push(issue(skillLabel, "frontmatter.name", "skill-name-mismatch"));
    }
  }
  if (yamlText !== null) validateOpenAiYaml(yamlText, id, yamlLabel, issues);
  const inventory = inventorySkillBundle(skillsRoot, id, issues);

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
  const rightsInfo = loadRightsBaseline();
  const discovery = requestedId
    ? { ids: [requestedId], issues: [] }
    : discoverAbilityIds(skillsRoot);
  const schemaUsable = schemaInfo.schema !== null && schemaInfo.issues.length === 0;
  const results = discovery.ids.map((id) => {
    const result = validateAbility(skillsRoot, id, schemaUsable ? schemaInfo.schema : null);
    const dependencyIssues = [];
    if (!schemaUsable) {
      dependencyIssues.push(issue(`skills/${id}/ability.json`, "$", "ability-schema-invalid"));
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
    ...rightsInfo.issues,
    ...discovery.issues,
    ...results.flatMap((result) => result.issues),
  ]);
  return {
    schemas: {
      ability: schemaInfo.schema,
      abilitySha256: schemaInfo.sha256,
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

function verifyReceipt(path, json, skillsRoot) {
  const receiptSchema = loadReceiptSchema();
  const abilitySchema = loadAbilitySchema();
  const rightsInfo = loadRightsBaseline();
  const issues = [...receiptSchema.issues, ...abilitySchema.issues, ...rightsInfo.issues];
  const label = basename(path) || "receipt.json";
  let receipt = null;
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) issues.push(issue(label, "$", "symlink"));
    else if (!stat.isFile()) issues.push(issue(label, "$", "invalid-file"));
    else if (stat.size > MAX_FILE_BYTES) issues.push(issue(label, "$", "oversized-file"));
    else {
      try {
        receipt = strictJson(decodeUtf8(readFileSync(path)));
      } catch (error) {
        const code = error instanceof JsonProblem ? error.code : error instanceof TypeError ? "invalid-utf8" : "invalid-json";
        issues.push(issue(label, "$", code));
      }
    }
  } catch {
    issues.push(issue(label, "$", "missing-file"));
  }

  if (receipt && receiptSchema.schema && receiptSchema.issues.length === 0) {
    validateWithSchema(receipt, receiptSchema.schema, receiptSchema.schema, label, "$", issues);
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
      const ability = validateAbility(skillsRoot, receipt.ability_id, abilitySchema.schema);
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
  }
  sortIssues(issues);
  const payload = {
    protocol: "kingdom.karma-validation/0.1",
    valid: issues.length === 0,
    receipt_schema_sha256: receiptSchema.sha256,
    ability_schema_sha256: abilitySchema.sha256,
    rights_sha256: rightsInfo.sha256,
    issues,
  };
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else {
    process.stdout.write(`KARMA receipt: ${payload.valid ? "valid" : "invalid"} · ${issues.length} issues · ${payload.receipt_schema_sha256 ?? "unavailable"}\n`);
    printIssues(issues);
  }
  return issues.length === 0 ? 0 : 1;
}

function usage() {
  process.stderr.write(
    "usage: kingdom nen [list [--json] | validate [ID] [--json] | show ID [--json] | digest ID | types [--json] | receipt-template ID | verify-receipt FILE [--json]]\n"
    + "       bun bin/nen.mjs --skills-root /absolute/path <command>\n",
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
  return { args, skillsRoot, json };
}

function main() {
  const parsed = parseCli(process.argv.slice(2));
  if (!parsed) return usage();
  const { args, skillsRoot, json } = parsed;
  const command = args[0] ?? "list";
  const rest = args.slice(1);

  if (command === "list" && rest.length === 0) return listCommand(skillsRoot, json);
  if (command === "validate" && rest.length <= 1) return validateCommand(skillsRoot, rest[0] ?? null, json);
  if (command === "show" && rest.length === 1) return showCommand(skillsRoot, rest[0]);
  if (command === "digest" && rest.length === 1 && !json) return digestCommand(skillsRoot, rest[0]);
  if (command === "types" && rest.length === 0) return typesCommand(json);
  if (command === "receipt-template" && rest.length === 1 && !json) return receiptTemplateCommand(skillsRoot, rest[0]);
  if (command === "verify-receipt" && rest.length === 1) return verifyReceipt(rest[0], json, skillsRoot);
  return usage();
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(SCRIPT_PATH)) {
  process.exitCode = main();
}

export { strictJson };
