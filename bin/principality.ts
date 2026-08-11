#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(SCRIPT_PATH));
export const DEFAULT_CATALOG_LOCATOR = "data/principalities/moonshot-hf-npm.v1.json";
export const DEFAULT_CATALOG_PATH = join(ROOT, DEFAULT_CATALOG_LOCATOR);
const MAX_CATALOG_BYTES = 1024 * 1024;
const MAX_JSON_DEPTH = 64;
const MAX_NEEDS = 8;
const MAX_RESULTS = 25;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const HF_REVISION = /^[a-f0-9]{40}$/;
const NPM_VERSION = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?$/;
const SRI_SHA512 = /^sha512-[A-Za-z0-9+/]{86}==$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const LIFECYCLE_EVENTS = ["preinstall", "install", "postinstall", "prepare"];
const RELATION_TYPES = ["fine-tuned-from", "local-runtime-for", "metadata-bridge-for", "remote-client-for", "variant-of"];
const RELATION_EVIDENCE = ["hub-base-model-tag", "official-package-description", "publisher-name-and-collection"];

export type PrincipalityIssue = { field: string; code: string };

type MatchOptions = {
  limit?: number;
  kind?: "model" | "dataset" | "package";
  family?: string;
};

function fail(message: string): never {
  throw new Error(message);
}

function sha256(value: string | Uint8Array): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function canonicalizePrincipalityValue(value: unknown): string {
  if (value === null || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("catalog contains a non-finite number");
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizePrincipalityValue).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalizePrincipalityValue(record[key])}`)
      .join(",")}}`;
  }
  fail("catalog contains a non-JSON value");
}

export function principalityCatalogDigest(catalog: Record<string, any>): string {
  const material = structuredClone(catalog);
  if (material.integrity === null || typeof material.integrity !== "object") {
    fail("catalog integrity envelope is missing");
  }
  material.integrity.digest = null;
  return sha256(canonicalizePrincipalityValue(material));
}

class StrictJsonScanner {
  private index = 0;

  constructor(
    private readonly source: string,
    private readonly label: string,
  ) {}

  scan(): void {
    this.skipWhitespace();
    this.value(0);
    this.skipWhitespace();
    if (this.index !== this.source.length) this.invalid("trailing content");
  }

  private invalid(reason: string): never {
    fail(`${this.label} is not strict at byte-like offset ${this.index}: ${reason}`);
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.source[this.index] ?? "") && /[\u0020\u000a\u000d\u0009]/.test(this.source[this.index]!)) {
      this.index += 1;
    }
  }

  private value(depth: number): void {
    if (depth > MAX_JSON_DEPTH) this.invalid(`nesting exceeds ${MAX_JSON_DEPTH}`);
    this.skipWhitespace();
    const token = this.source[this.index];
    if (token === "{") return this.object(depth);
    if (token === "[") return this.array(depth);
    if (token === '"') {
      this.string();
      return;
    }
    if (token === "t") return this.literal("true");
    if (token === "f") return this.literal("false");
    if (token === "n") return this.literal("null");
    if (token === "-" || (token !== undefined && /[0-9]/.test(token))) return this.number();
    this.invalid("expected a JSON value");
  }

  private object(depth: number): void {
    this.index += 1;
    this.skipWhitespace();
    const keys = new Set<string>();
    if (this.source[this.index] === "}") {
      this.index += 1;
      return;
    }
    for (;;) {
      if (this.source[this.index] !== '"') this.invalid("expected an object key");
      const key = this.string();
      if (keys.has(key)) fail(`${this.label} contains duplicate key ${JSON.stringify(key)}`);
      keys.add(key);
      this.skipWhitespace();
      if (this.source[this.index] !== ":") this.invalid("expected ':' after an object key");
      this.index += 1;
      this.value(depth + 1);
      this.skipWhitespace();
      const separator = this.source[this.index];
      if (separator === "}") {
        this.index += 1;
        return;
      }
      if (separator !== ",") this.invalid("expected ',' or '}' in an object");
      this.index += 1;
      this.skipWhitespace();
    }
  }

  private array(depth: number): void {
    this.index += 1;
    this.skipWhitespace();
    if (this.source[this.index] === "]") {
      this.index += 1;
      return;
    }
    for (;;) {
      this.value(depth + 1);
      this.skipWhitespace();
      const separator = this.source[this.index];
      if (separator === "]") {
        this.index += 1;
        return;
      }
      if (separator !== ",") this.invalid("expected ',' or ']' in an array");
      this.index += 1;
      this.skipWhitespace();
    }
  }

  private string(): string {
    const start = this.index;
    this.index += 1;
    for (;;) {
      const token = this.source[this.index];
      if (token === undefined) this.invalid("unterminated string");
      if (token === '"') {
        this.index += 1;
        try {
          return JSON.parse(this.source.slice(start, this.index));
        } catch {
          this.invalid("invalid string escape");
        }
      }
      if (token.charCodeAt(0) < 0x20) this.invalid("unescaped control character in string");
      if (token === "\\") {
        this.index += 1;
        const escaped = this.source[this.index];
        if (escaped === "u") {
          const hex = this.source.slice(this.index + 1, this.index + 5);
          if (!/^[a-fA-F0-9]{4}$/.test(hex)) this.invalid("invalid Unicode escape");
          this.index += 5;
          continue;
        }
        if (escaped === undefined || !/["\\/bfnrt]/.test(escaped)) this.invalid("invalid string escape");
      }
      this.index += 1;
    }
  }

  private literal(expected: string): void {
    if (this.source.slice(this.index, this.index + expected.length) !== expected) this.invalid(`expected ${expected}`);
    this.index += expected.length;
  }

  private number(): void {
    const match = this.source.slice(this.index).match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/);
    if (!match) this.invalid("invalid number");
    if (!Number.isFinite(Number(match[0]))) this.invalid("non-finite number");
    this.index += match[0].length;
  }
}

export function parseStrictJsonBytes(bytes: Uint8Array, label = "JSON document"): unknown {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} must be valid UTF-8`);
  }
  new StrictJsonScanner(text, label).scan();
  try {
    return JSON.parse(text);
  } catch {
    fail(`${label} could not be parsed`);
  }
}

function readCatalogUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try {
    stat = lstatSync(absolute);
  } catch {
    fail("catalog is unavailable");
  }
  if (!stat.isFile() || stat.isSymbolicLink()) fail("catalog must be a regular non-symlink file");
  if (stat.size > MAX_CATALOG_BYTES) fail(`catalog exceeds ${MAX_CATALOG_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(absolute), "catalog JSON");
}

function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function codePointLength(value: string): number {
  return Array.from(value).length;
}

function boundedText(value: unknown, max: number): value is string {
  return typeof value === "string" && codePointLength(value) > 0 && codePointLength(value) <= max;
}

function validId(value: unknown): value is string {
  return typeof value === "string" && value.length <= 64 && ID.test(value);
}

function sortedUniqueStrings(
  value: unknown,
  maxItems = Number.MAX_SAFE_INTEGER,
  validItem: (entry: string) => boolean = (entry) => entry.length > 0,
): value is string[] {
  return Array.isArray(value)
    && value.length <= maxItems
    && value.every((entry) => typeof entry === "string" && validItem(entry))
    && new Set(value).size === value.length
    && value.every((entry, index) => index === 0 || value[index - 1]! < entry);
}

function validUtc(value: unknown): boolean {
  if (typeof value !== "string" || !ISO_UTC.test(value)) return false;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return false;
  const canonical = value.replace(/(?:\.(\d{1,3}))?Z$/, (_match, fraction: string | undefined) => {
    return `.${(fraction ?? "").padEnd(3, "0")}Z`;
  });
  return new Date(parsed).toISOString() === canonical;
}

function validHttps(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "" && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function compareIds(left: any, right: any): number {
  const a = isObject(left) && typeof left.id === "string" ? left.id : "";
  const b = isObject(right) && typeof right.id === "string" ? right.id : "";
  return a < b ? -1 : a > b ? 1 : 0;
}

function expectedKeys(value: unknown, keys: string[]): boolean {
  return isObject(value)
    && canonicalizePrincipalityValue(Object.keys(value).sort()) === canonicalizePrincipalityValue([...keys].sort());
}

export function verifyPrincipalityCatalog(catalog: unknown): PrincipalityIssue[] {
  const issues: PrincipalityIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  if (!isObject(catalog)) return [{ field: "$", code: "not-object" }];
  const value = catalog as Record<string, any>;
  const topKeys = [
    "$schema", "protocol", "catalog_id", "title", "observed_at", "geometry", "sources", "observation",
    "capabilities", "families", "collections", "papers", "nodes", "relations", "selection", "authority", "integrity",
  ];
  if (!expectedKeys(value, topKeys)) add("$", "unexpected-shape");
  if (value.$schema !== "urn:kingdom:schema:principality-catalog:1") add("$.$schema", "protocol-mismatch");
  if (value.protocol !== "kingdom.principality-catalog/0.1") add("$.protocol", "protocol-mismatch");
  if (!validId(value.catalog_id)) {
    add("$.catalog_id", "invalid-id");
  }
  if (!boundedText(value.title, 600)) add("$.title", "invalid-text");
  if (!validUtc(value.observed_at)) add("$.observed_at", "invalid-timestamp");

  const expectedGeometry = {
    principality: "capability-domain-not-rank",
    love: "relation-without-collapse",
    understanding: "evidence-preserving-typed-relations",
    nodes_remain_distinct: true,
    edges_are_typed: true,
    missing_edges_mean_unknown: true,
    relations_grant_authority: false,
    universal_ranking: false,
  };
  try {
    if (canonicalizePrincipalityValue(value.geometry) !== canonicalizePrincipalityValue(expectedGeometry)) {
      add("$.geometry", "geometry-boundary-missing");
    }
  } catch {
    add("$.geometry", "geometry-boundary-missing");
  }

  const sourceIds = new Set<string>();
  if (!Array.isArray(value.sources) || value.sources.length === 0 || value.sources.length > 32) {
    add("$.sources", "invalid-source-list");
  } else {
    for (const [index, source] of value.sources.entries()) {
      const path = `$.sources[${index}]`;
      if (!expectedKeys(source, ["id", "registry", "url", "method", "response_digest"])) add(path, "unexpected-shape");
      if (!isObject(source) || !validId(source.id) || sourceIds.has(source.id)) {
        add(`${path}.id`, "invalid-or-duplicate-id");
      } else sourceIds.add(source.id);
      if (!isObject(source) || !["huggingface", "npm"].includes(source.registry)) add(`${path}.registry`, "invalid-registry");
      if (!isObject(source) || !validHttps(source.url)) add(`${path}.url`, "invalid-url");
      if (!isObject(source) || ![
        "anonymous-public-metadata-read", "anonymous-public-profile-read", "anonymous-public-packument-read",
      ].includes(source.method)) add(`${path}.method`, "invalid-method");
      if (!isObject(source) || !(source.response_digest === null || SHA256.test(source.response_digest))) {
        add(`${path}.response_digest`, "invalid-digest");
      }
    }
    const sorted = [...value.sources].sort(compareIds);
    if (canonicalizePrincipalityValue(value.sources) !== canonicalizePrincipalityValue(sorted)) add("$.sources", "not-sorted");
  }

  const capabilityIds = new Set<string>();
  if (!Array.isArray(value.capabilities) || value.capabilities.length === 0 || value.capabilities.length > 64) {
    add("$.capabilities", "invalid-capability-list");
  } else {
    for (const [index, capability] of value.capabilities.entries()) {
      const path = `$.capabilities[${index}]`;
      if (!expectedKeys(capability, ["id", "label", "definition"])) add(path, "unexpected-shape");
      if (!isObject(capability) || !validId(capability.id) || capabilityIds.has(capability.id)) {
        add(`${path}.id`, "invalid-or-duplicate-id");
      } else capabilityIds.add(capability.id);
      if (!isObject(capability) || !boundedText(capability.label, 160)) {
        add(`${path}.label`, "invalid-text");
      }
      if (!isObject(capability) || !boundedText(capability.definition, 600)) {
        add(`${path}.definition`, "invalid-text");
      }
    }
    if (canonicalizePrincipalityValue(value.capabilities) !== canonicalizePrincipalityValue([...value.capabilities].sort(compareIds))) {
      add("$.capabilities", "not-sorted");
    }
  }

  const familyIds = new Set<string>();
  if (!Array.isArray(value.families) || value.families.length === 0 || value.families.length > 64) {
    add("$.families", "invalid-family-list");
  } else {
    for (const [index, family] of value.families.entries()) {
      const path = `$.families[${index}]`;
      if (!expectedKeys(family, ["id", "label", "kind", "description"])) add(path, "unexpected-shape");
      if (!isObject(family) || !validId(family.id) || familyIds.has(family.id)) {
        add(`${path}.id`, "invalid-or-duplicate-id");
      } else familyIds.add(family.id);
      if (!isObject(family) || !["model-lineage", "evaluation", "registry-bridge"].includes(family.kind)) {
        add(`${path}.kind`, "invalid-kind");
      }
      if (!isObject(family) || !boundedText(family.label, 160) || !boundedText(family.description, 600)) add(path, "invalid-text");
    }
    if (canonicalizePrincipalityValue(value.families) !== canonicalizePrincipalityValue([...value.families].sort(compareIds))) {
      add("$.families", "not-sorted");
    }
  }

  const paperIds = new Set<string>();
  if (!Array.isArray(value.papers) || value.papers.length > 128) add("$.papers", "invalid-paper-list");
  else {
    for (const [index, paper] of value.papers.entries()) {
      const path = `$.papers[${index}]`;
      if (!expectedKeys(paper, ["id", "title", "url", "published_at", "theme", "related_family_ids", "attribution_state"])) {
        add(path, "unexpected-shape");
      }
      if (!isObject(paper) || typeof paper.id !== "string" || !/^[0-9]{4}\.[0-9]{4,5}$/.test(paper.id) || paperIds.has(paper.id)) {
        add(`${path}.id`, "invalid-or-duplicate-paper-id");
      } else paperIds.add(paper.id);
      if (!isObject(paper) || !boundedText(paper.title, 600)) add(`${path}.title`, "invalid-text");
      if (!isObject(paper) || !validHttps(paper.url)) add(`${path}.url`, "invalid-url");
      if (!isObject(paper) || !validUtc(paper.published_at)) add(`${path}.published_at`, "invalid-timestamp");
      if (!isObject(paper) || !validId(paper.theme)) add(`${path}.theme`, "invalid-theme");
      if (!isObject(paper) || paper.attribution_state !== "org-profile-attributed") add(`${path}.attribution_state`, "invalid-attribution-state");
      if (!isObject(paper) || !sortedUniqueStrings(paper.related_family_ids, 16, validId)) add(`${path}.related_family_ids`, "not-sorted-unique-strings");
      else paper.related_family_ids.forEach((id: string) => {
        if (!familyIds.has(id)) add(`${path}.related_family_ids`, "unknown-family");
      });
    }
    if (canonicalizePrincipalityValue(value.papers) !== canonicalizePrincipalityValue([...value.papers].sort(compareIds))) {
      add("$.papers", "not-sorted");
    }
  }

  const nodeIds = new Set<string>();
  const nodeKeys = [
    "id", "registry", "kind", "display_name", "family_id", "locator", "resolved_ref", "integrity", "legacy_shasum",
    "source_url", "published_at", "modified_at", "pipeline", "library", "license", "visibility", "gated", "custom_code",
    "safetensors", "completeness", "provenance_state", "base_refs", "capabilities", "dependencies", "lifecycle_event_names",
    "size_receipt", "risk_facts", "hazards",
  ];
  if (!Array.isArray(value.nodes) || value.nodes.length === 0 || value.nodes.length > 256) {
    add("$.nodes", "invalid-node-list");
  } else {
    for (const [index, node] of value.nodes.entries()) {
      const path = `$.nodes[${index}]`;
      if (!expectedKeys(node, nodeKeys)) add(path, "unexpected-shape");
      if (!isObject(node)) continue;
      if (!validId(node.id) || nodeIds.has(node.id)) {
        add(`${path}.id`, "invalid-or-duplicate-id");
      } else nodeIds.add(node.id);
      if (!boundedText(node.display_name, 160) || !boundedText(node.locator, 160) || !boundedText(node.resolved_ref, 160)) {
        add(path, "invalid-identity-text");
      }
      if (!(node.pipeline === null || boundedText(node.pipeline, 160)) || !(node.library === null || boundedText(node.library, 160))) {
        add(path, "invalid-optional-text");
      }
      if (!familyIds.has(node.family_id)) add(`${path}.family_id`, "unknown-family");
      if (!validHttps(node.source_url)) add(`${path}.source_url`, "invalid-url");
      if (!validUtc(node.published_at) || !validUtc(node.modified_at)) add(path, "invalid-timestamp");
      if (node.visibility !== "public" || node.completeness !== "metadata_only") add(path, "metadata-boundary-invalid");
      if (!["publisher-namespace-observed", "registry-metadata-observed"].includes(node.provenance_state)) {
        add(`${path}.provenance_state`, "invalid-provenance-state");
      }
      if (!sortedUniqueStrings(node.base_refs, 16, (entry) => boundedText(entry, 160))) add(`${path}.base_refs`, "not-sorted-unique-strings");
      if (!sortedUniqueStrings(node.capabilities, 32, validId) || node.capabilities.length === 0) {
        add(`${path}.capabilities`, "not-sorted-unique-strings");
      } else {
        node.capabilities.forEach((capability: string) => {
          if (!capabilityIds.has(capability)) add(`${path}.capabilities`, "unknown-capability");
        });
      }
      if (!sortedUniqueStrings(node.hazards, 32, validId) || node.hazards.length === 0) add(`${path}.hazards`, "not-sorted-unique-strings");
      if (!Array.isArray(node.dependencies) || node.dependencies.length > 64) add(`${path}.dependencies`, "invalid-dependencies");
      else {
        const names = node.dependencies.map((entry: any) => entry?.name);
        if (!names.every((name: unknown) => typeof name === "string")
          || !sortedUniqueStrings(names, 64, (entry) => boundedText(entry, 160))) {
          add(`${path}.dependencies`, "not-sorted-unique-dependencies");
        }
        for (const dependency of node.dependencies) {
          if (!expectedKeys(dependency, ["name", "spec"])
            || !boundedText(dependency?.name, 160)
            || !boundedText(dependency?.spec, 160)) {
            add(`${path}.dependencies`, "invalid-dependency");
          }
        }
      }
      if (!sortedUniqueStrings(node.lifecycle_event_names, 16, (entry) => LIFECYCLE_EVENTS.includes(entry))) {
        add(`${path}.lifecycle_event_names`, "invalid-lifecycle-events");
      }
      if (!expectedKeys(node.license, ["declared", "class", "review_state", "url"]) || !validHttps(node.license?.url)) {
        add(`${path}.license`, "invalid-license-evidence");
      } else if (!boundedText(node.license.declared, 160)
        || !["spdx", "modified-mit", "custom-kimi-k3"].includes(node.license.class)
        || !["declared-unverified", "custom-terms-review-required", "noncommercial-review-required"].includes(node.license.review_state)) {
        add(`${path}.license`, "invalid-license-state");
      }
      if (!expectedKeys(node.risk_facts, ["remote_code", "pickle", "lifecycle", "native_build"])) {
        add(`${path}.risk_facts`, "invalid-risk-facts");
      } else {
        if (!["present", "not-observed", "not-applicable", "unknown"].includes(node.risk_facts.remote_code)) add(`${path}.risk_facts.remote_code`, "invalid-state");
        if (!["unknown", "not-applicable"].includes(node.risk_facts.pickle)) add(`${path}.risk_facts.pickle`, "invalid-state");
        if (!["present", "none-declared", "not-applicable", "unknown"].includes(node.risk_facts.lifecycle)) add(`${path}.risk_facts.lifecycle`, "invalid-state");
        if (!["possible", "not-observed", "not-applicable", "unknown"].includes(node.risk_facts.native_build)) add(`${path}.risk_facts.native_build`, "invalid-state");
      }
      if (node.registry === "huggingface") {
        if (!["model", "dataset"].includes(node.kind) || !HF_REVISION.test(node.resolved_ref)) add(path, "invalid-hf-identity");
        if (node.integrity !== null || node.legacy_shasum !== null || typeof node.gated !== "boolean" || node.size_receipt !== null) {
          add(path, "invalid-hf-boundary");
        }
        if (node.kind === "model") {
          if (typeof node.custom_code !== "boolean" || typeof node.safetensors !== "boolean") add(path, "invalid-model-risk-facts");
          if ((node.custom_code === true && node.risk_facts?.remote_code !== "present")
            || (node.custom_code === false && node.risk_facts?.remote_code !== "not-observed")) {
            add(path, "contradictory-remote-code-facts");
          }
        } else if (node.custom_code !== null || node.safetensors !== null) add(path, "invalid-dataset-risk-facts");
        if (!Array.isArray(node.lifecycle_event_names)
          || node.lifecycle_event_names.length !== 0
          || node.risk_facts?.lifecycle !== "not-applicable") {
          add(path, "contradictory-lifecycle-facts");
        }
      } else if (node.registry === "npm") {
        if (node.kind !== "package" || !NPM_VERSION.test(node.resolved_ref) || !SRI_SHA512.test(node.integrity)
          || typeof node.legacy_shasum !== "string" || !HF_REVISION.test(node.legacy_shasum)) add(path, "invalid-npm-identity");
        if (node.pipeline !== null || node.gated !== null || node.custom_code !== null || node.safetensors !== null) add(path, "invalid-npm-boundary");
        if (!expectedKeys(node.size_receipt, ["file_count", "unpacked_bytes"])
          || !Number.isInteger(node.size_receipt?.file_count) || node.size_receipt.file_count < 0
          || !Number.isInteger(node.size_receipt?.unpacked_bytes) || node.size_receipt.unpacked_bytes < 0) add(path, "invalid-size-receipt");
        if (!Array.isArray(node.lifecycle_event_names)
          || (node.lifecycle_event_names.length > 0 && node.risk_facts?.lifecycle !== "present")
          || (node.lifecycle_event_names.length === 0 && node.risk_facts?.lifecycle === "present")) {
          add(path, "contradictory-lifecycle-facts");
        }
      } else add(`${path}.registry`, "invalid-registry");
    }
    if (canonicalizePrincipalityValue(value.nodes) !== canonicalizePrincipalityValue([...value.nodes].sort(compareIds))) {
      add("$.nodes", "not-sorted");
    }
  }

  const collectionIds = new Set<string>();
  if (!Array.isArray(value.collections) || value.collections.length > 64) add("$.collections", "invalid-collection-list");
  else {
    for (const [index, collection] of value.collections.entries()) {
      const path = `$.collections[${index}]`;
      if (!expectedKeys(collection, ["id", "title", "url", "profile_visible", "member_node_ids", "paper_ids"])) add(path, "unexpected-shape");
      if (!isObject(collection) || !validId(collection.id) || collectionIds.has(collection.id)) {
        add(`${path}.id`, "invalid-or-duplicate-id");
      } else collectionIds.add(collection.id);
      if (!isObject(collection) || !boundedText(collection.title, 160)
        || !validHttps(collection.url) || typeof collection.profile_visible !== "boolean") add(path, "invalid-collection");
      if (!isObject(collection) || !sortedUniqueStrings(collection.member_node_ids, 64, validId)) add(`${path}.member_node_ids`, "not-sorted-unique-strings");
      else collection.member_node_ids.forEach((id: string) => {
        if (!nodeIds.has(id)) add(`${path}.member_node_ids`, "unknown-node");
      });
      if (!isObject(collection) || !sortedUniqueStrings(collection.paper_ids, 32, (entry) => /^[0-9]{4}\.[0-9]{4,5}$/.test(entry))) {
        add(`${path}.paper_ids`, "not-sorted-unique-strings");
      }
      else collection.paper_ids.forEach((id: string) => {
        if (!paperIds.has(id)) add(`${path}.paper_ids`, "unknown-paper");
      });
    }
    if (canonicalizePrincipalityValue(value.collections) !== canonicalizePrincipalityValue([...value.collections].sort(compareIds))) {
      add("$.collections", "not-sorted");
    }
  }

  if (!Array.isArray(value.relations) || value.relations.length > 512) add("$.relations", "invalid-relation-list");
  else {
    const relationKeys = new Set<string>();
    for (const [index, relation] of value.relations.entries()) {
      const path = `$.relations[${index}]`;
      if (!expectedKeys(relation, ["from", "type", "to", "evidence"])) add(path, "unexpected-shape");
      if (!isObject(relation)) continue;
      if (!nodeIds.has(relation.from)) add(`${path}.from`, "unknown-node");
      if (!nodeIds.has(relation.to) && relation.to !== value.catalog_id) add(`${path}.to`, "unknown-endpoint");
      if (!RELATION_TYPES.includes(relation.type)) add(`${path}.type`, "invalid-relation-type");
      if (!RELATION_EVIDENCE.includes(relation.evidence)) add(`${path}.evidence`, "invalid-relation-evidence");
      if (relation.from === relation.to) add(path, "self-edge");
      const key = `${relation.from}\u0000${relation.type}\u0000${relation.to}`;
      if (relationKeys.has(key)) add(path, "duplicate-edge");
      relationKeys.add(key);
    }
    const sorted = [...value.relations].sort((left, right) => {
      const a = isObject(left) ? `${left.from}\u0000${left.type}\u0000${left.to}` : "";
      const b = isObject(right) ? `${right.from}\u0000${right.type}\u0000${right.to}` : "";
      return a < b ? -1 : a > b ? 1 : 0;
    });
    if (canonicalizePrincipalityValue(value.relations) !== canonicalizePrincipalityValue(sorted)) add("$.relations", "not-sorted");
  }

  const observation = value.observation;
  if (!expectedKeys(observation, ["huggingface", "catalog", "collection_count_note", "completeness", "currentness", "refresh_required_before_acquisition", "omitted"])
    || !expectedKeys(observation?.huggingface, ["models", "datasets", "spaces", "profile_collections", "collection_api_records", "profile_papers"])
    || !expectedKeys(observation?.catalog, ["huggingface_nodes", "npm_nodes", "total_nodes"])) {
    add("$.observation", "unexpected-shape");
  } else if (Array.isArray(value.nodes) && Array.isArray(value.collections) && Array.isArray(value.papers)) {
    const hfNodes = value.nodes.filter((node: any) => node.registry === "huggingface");
    const npmNodes = value.nodes.filter((node: any) => node.registry === "npm");
    if (observation.huggingface.models !== hfNodes.filter((node: any) => node.kind === "model").length
      || observation.huggingface.datasets !== hfNodes.filter((node: any) => node.kind === "dataset").length
      || observation.huggingface.collection_api_records !== value.collections.length
      || observation.huggingface.profile_collections !== value.collections.filter((entry: any) => entry.profile_visible === true).length
      || observation.huggingface.profile_papers !== value.papers.length
      || observation.catalog.huggingface_nodes !== hfNodes.length
      || observation.catalog.npm_nodes !== npmNodes.length
      || observation.catalog.total_nodes !== value.nodes.length) add("$.observation", "count-mismatch");
    if (observation.completeness !== "metadata_only"
      || observation.currentness !== "point-in-time-only"
      || observation.refresh_required_before_acquisition !== true
      || !boundedText(observation.collection_count_note, 600)
      || !Array.isArray(observation.omitted)
      || observation.omitted.length !== 3
      || !observation.omitted.every((entry: unknown) => boundedText(entry, 600))) {
      add("$.observation", "metadata-boundary-invalid");
    }
    const observedCounts = [
      ...Object.values(observation.huggingface),
      ...Object.values(observation.catalog),
    ];
    if (observedCounts.some((count) => !Number.isInteger(count) || (count as number) < 0)) {
      add("$.observation", "invalid-count");
    }
  }

  const expectedSelection = {
    method: "literal-declared-capability-intersection",
    tie_breaker: "more-needs-covered-then-node-id",
    popularity_signals_used: false,
    benchmark_rank_used: false,
    selection_is_recommendation: false,
    missing_needs_are_preserved: true,
  };
  if (canonicalizePrincipalityValue(value.selection) !== canonicalizePrincipalityValue(expectedSelection)) {
    add("$.selection", "selection-boundary-missing");
  }
  const expectedAuthority = {
    metadata_is_data_not_instructions: true,
    grants_permissions: false,
    authorizes_download: false,
    authorizes_install: false,
    authorizes_inference: false,
    authorizes_remote_code: false,
    authorizes_external_effects: false,
    unknown_budget_means_zero: true,
  };
  if (canonicalizePrincipalityValue(value.authority) !== canonicalizePrincipalityValue(expectedAuthority)) {
    add("$.authority", "authority-boundary-missing");
  }
  if (!isObject(value.integrity)
    || value.integrity.algorithm !== "sha256"
    || value.integrity.canonicalization !== "recursive-sorted-json-keys/v1"
    || value.integrity.covers !== "all catalog fields with integrity.digest set to null") {
    add("$.integrity", "invalid-integrity-envelope");
  }
  if (!SHA256.test(value.integrity?.digest ?? "")) add("$.integrity.digest", "invalid-digest");
  else {
    try {
      if (principalityCatalogDigest(value) !== value.integrity.digest) add("$.integrity.digest", "digest-mismatch");
    } catch {
      add("$.integrity.digest", "digest-unverifiable");
    }
  }
  return issues.sort((left, right) => {
    const a = `${left.field}\u0000${left.code}`;
    const b = `${right.field}\u0000${right.code}`;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

export function loadPrincipalityCatalog(path = DEFAULT_CATALOG_PATH): Record<string, any> {
  const value = readCatalogUnchecked(path);
  const issues = verifyPrincipalityCatalog(value);
  if (issues.length > 0) fail(`catalog refused: ${issues[0]!.field} ${issues[0]!.code}`);
  return value as Record<string, any>;
}

function validateNeed(need: string): void {
  if (!ID.test(need) || need.length > 64) fail(`invalid capability need ${JSON.stringify(need)}`);
}

export function matchPrincipalities(
  needs: string[],
  options: MatchOptions = {},
  catalog = loadPrincipalityCatalog(),
): Record<string, any> {
  if (needs.length === 0 || needs.length > MAX_NEEDS) fail(`supply between 1 and ${MAX_NEEDS} capability needs`);
  needs.forEach(validateNeed);
  if (new Set(needs).size !== needs.length) fail("capability needs must be unique");
  const normalized = [...needs].sort();
  const limit = options.limit ?? 10;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_RESULTS) fail(`limit must be an integer from 1 to ${MAX_RESULTS}`);
  if (options.kind && !["model", "dataset", "package"].includes(options.kind)) fail("unknown resource kind");
  if (options.family && !catalog.families.some((entry: any) => entry.id === options.family)) fail("unknown family");
  const candidates = catalog.nodes
    .filter((node: any) => !options.kind || node.kind === options.kind)
    .filter((node: any) => !options.family || node.family_id === options.family)
    .map((node: any) => ({
      id: node.id,
      family_id: node.family_id,
      registry: node.registry,
      kind: node.kind,
      covers: normalized.filter((need) => node.capabilities.includes(need)),
      misses: normalized.filter((need) => !node.capabilities.includes(need)),
      completeness: node.completeness,
      source_url: node.source_url,
    }))
    .filter((candidate: any) => candidate.covers.length > 0)
    .sort((left: any, right: any) => right.covers.length - left.covers.length || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))
    .slice(0, limit);
  const covered = new Set(candidates.flatMap((candidate: any) => candidate.covers));
  return {
    protocol: "kingdom.capability-constellation/1",
    catalog: {
      id: catalog.catalog_id,
      digest: catalog.integrity.digest,
      observed_at: catalog.observed_at,
    },
    needs: normalized,
    candidates,
    missing_needs: normalized.filter((need) => !covered.has(need)),
    selection_basis: "literal_declared_capability_intersection",
    tie_breaker: "more_needs_covered_then_node_id",
    popularity_used: false,
    benchmark_rank_used: false,
    recommendation_established: false,
    current_availability_established: false,
    revalidation_state: "point-in-time-only",
    effects_authorized: false,
  };
}

function capabilitySelectedFields(catalog: Record<string, any>, node: Record<string, any>): Record<string, any> {
  return {
    artifact_id: node.id,
    catalog_id: catalog.catalog_id,
    catalog_digest: catalog.integrity.digest,
    observed_at: catalog.observed_at,
    revalidation_state: catalog.observation.currentness,
    current_availability_established: false,
    registry: node.registry,
    resource_kind: node.kind,
    resource_locator: node.locator,
    resolved_ref: node.resolved_ref,
    content_integrity: node.integrity,
    completeness: node.completeness,
    family_id: node.family_id,
    capabilities: [...node.capabilities],
    license: structuredClone(node.license),
    provenance_state: node.provenance_state,
    custom_code: node.custom_code,
    safetensors: node.safetensors,
    lifecycle_event_names: [...node.lifecycle_event_names],
    risk_facts: structuredClone(node.risk_facts),
    hazards: [...node.hazards],
  };
}

export function principalityCapabilitySource(
  artifactId: string,
  catalog = loadPrincipalityCatalog(),
): Record<string, any> {
  validateNeed(artifactId);
  const node = catalog.nodes.find((entry: any) => entry.id === artifactId);
  if (!node) fail(`unknown Principality artifact ${JSON.stringify(artifactId)}`);
  const selectedFields = capabilitySelectedFields(catalog, node);
  return {
    id: "principality-capability",
    kind: "capability_evidence",
    trust: "publisher_metadata_snapshot",
    locator: `${DEFAULT_CATALOG_LOCATOR}#node=${node.id}`,
    selected_content_digest: sha256(canonicalizePrincipalityValue(selectedFields)),
    selected_fields: selectedFields,
    selected_because: "Exact caller-selected catalog ID; metadata-only capability evidence, not a recommendation or execution grant.",
    may_issue_instructions: false,
    may_grant_permissions: false,
    may_authorize_download: false,
    may_authorize_install: false,
    may_authorize_inference: false,
    may_authorize_remote_code: false,
  };
}

export function verifyPrincipalityCapabilitySource(source: unknown): PrincipalityIssue[] {
  const issues: PrincipalityIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  if (!isObject(source)) return [{ field: "$.context.sources[0]", code: "not-object" }];
  const sourceKeys = [
    "id", "kind", "trust", "locator", "selected_content_digest", "selected_fields", "selected_because",
    "may_issue_instructions", "may_grant_permissions", "may_authorize_download", "may_authorize_install",
    "may_authorize_inference", "may_authorize_remote_code",
  ];
  if (!expectedKeys(source, sourceKeys)) add("$.context.sources[0]", "capability-source-shape-invalid");
  if (source.id !== "principality-capability" || source.kind !== "capability_evidence"
    || source.trust !== "publisher_metadata_snapshot") add("$.context.sources[0]", "capability-source-identity-invalid");
  for (const key of [
    "may_issue_instructions", "may_grant_permissions", "may_authorize_download", "may_authorize_install",
    "may_authorize_inference", "may_authorize_remote_code",
  ]) {
    if (source[key] !== false) add(`$.context.sources[0].${key}`, "capability-effect-boundary-missing");
  }
  if (!isObject(source.selected_fields) || typeof source.selected_fields.artifact_id !== "string") {
    add("$.context.sources[0].selected_fields", "capability-fields-invalid");
  } else {
    try {
      const fieldsDigest = sha256(canonicalizePrincipalityValue(source.selected_fields));
      if (source.selected_content_digest !== fieldsDigest) add("$.context.sources[0].selected_content_digest", "digest-mismatch");
      const expected = principalityCapabilitySource(source.selected_fields.artifact_id);
      if (canonicalizePrincipalityValue(source) !== canonicalizePrincipalityValue(expected)) {
        add("$.context.sources[0]", "capability-projection-mismatch");
      }
    } catch {
      add("$.context.sources[0]", "capability-catalog-unresolved");
    }
  }
  return issues.sort((left, right) => {
    const a = `${left.field}\u0000${left.code}`;
    const b = `${right.field}\u0000${right.code}`;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

function renderOverview(catalog: Record<string, any>): string {
  const counts = catalog.observation;
  return [
    `Principality Commons · ${catalog.catalog_id}`,
    `${counts.huggingface.models} models · ${counts.huggingface.datasets} datasets · ${counts.huggingface.profile_papers} attributed papers · ${counts.huggingface.profile_collections} visible collections · ${counts.huggingface.spaces} public Spaces`,
    `${counts.catalog.npm_nodes} official npm bridge packages · observed ${catalog.observed_at}`,
    "Geometry: love = relation without collapse; understanding = evidence-preserving typed relations.",
    "Boundary: metadata only; no download, install, inference, remote code, ranking, or permission.",
    "Try: kingdom principalities list | papers | match reasoning coding | show kimi-k3 | evidence kimi-dev-72b",
    "",
  ].join("\n");
}

function renderNodes(nodes: Record<string, any>[]): string {
  return `${nodes.map((node) => {
    const identity = node.registry === "huggingface" ? node.resolved_ref.slice(0, 12) : node.resolved_ref;
    return `${node.id}\t${node.registry}/${node.kind}\t${node.family_id}\t${identity}\t${node.capabilities.join(",")}`;
  }).join("\n")}\n`;
}

function renderPapers(papers: Record<string, any>[]): string {
  return `${papers.map((paper) => {
    const families = paper.related_family_ids.length === 0 ? "unlinked" : paper.related_family_ids.join(",");
    return `${paper.id}\t${paper.theme}\t${families}\t${paper.title}`;
  }).join("\n")}\n`;
}

function renderMatch(result: Record<string, any>): string {
  const lines = [
    `Capability constellation · ${result.catalog.id}@${result.catalog.digest}`,
    `Needs: ${result.needs.join(", ")}`,
  ];
  if (result.candidates.length === 0) lines.push("Candidates: none");
  else result.candidates.forEach((candidate: any) => {
    lines.push(`${candidate.id}\tcovers=${candidate.covers.join(",")}\tmisses=${candidate.misses.join(",")}`);
  });
  lines.push(`Missing after bounded match: ${result.missing_needs.length === 0 ? "none" : result.missing_needs.join(", ")}`);
  lines.push("Literal fit only; no recommendation, popularity rank, download, execution, or permission.");
  return `${lines.join("\n")}\n`;
}

function usage(): never {
  process.stderr.write(
    "usage: principality.ts [overview] [--json]\n"
      + "       principality.ts list [--kind model|dataset|package] [--family ID] [--json]\n"
      + "       principality.ts papers [--json]\n"
      + "       principality.ts show ID [--json]\n"
      + "       principality.ts match NEED... [--kind model|dataset|package] [--family ID] [--limit 1-25] [--json]\n"
      + "       principality.ts evidence ID [--json]\n"
      + "       principality.ts verify [FILE] [--json]\n",
  );
  process.exit(2);
}

function parseCli(argv: string[]) {
  const args = [...argv];
  const command = args[0] && !args[0].startsWith("-") ? args.shift()! : "overview";
  let json = false;
  let kind: MatchOptions["kind"];
  let family: string | undefined;
  let limit: number | undefined;
  const positional: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (["--kind", "--family", "--limit"].includes(arg)) {
      const next = args[index + 1];
      if (next === undefined) usage();
      index += 1;
      if (arg === "--kind") kind = next as MatchOptions["kind"];
      if (arg === "--family") family = next;
      if (arg === "--limit") limit = Number(next);
      continue;
    }
    if (arg === "--help" || arg === "-h" || arg.startsWith("-")) usage();
    positional.push(arg);
  }
  return { command, json, kind, family, limit, positional };
}

async function main(): Promise<void> {
  const cli = parseCli(process.argv.slice(2));
  try {
    if (cli.command === "verify") {
      if (cli.kind || cli.family || cli.limit !== undefined || cli.positional.length > 1) usage();
      const path = cli.positional[0] ? resolve(cli.positional[0]) : DEFAULT_CATALOG_PATH;
      let issues: PrincipalityIssue[];
      try {
        issues = verifyPrincipalityCatalog(readCatalogUnchecked(path));
      } catch (error) {
        issues = [{ field: "$", code: error instanceof Error ? error.message : "catalog-read-refused" }];
      }
      if (cli.json) process.stdout.write(`${JSON.stringify({ valid: issues.length === 0, issues })}\n`);
      else if (issues.length === 0) process.stdout.write("Principality catalog: valid relations, boundaries, and digest; JSON Schema not checked\n");
      else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
      process.exit(issues.length === 0 ? 0 : 1);
    }
    const catalog = loadPrincipalityCatalog();
    if (cli.command === "overview") {
      if (cli.positional.length > 0 || cli.kind || cli.family || cli.limit !== undefined) usage();
      process.stdout.write(cli.json ? `${JSON.stringify(catalog)}\n` : renderOverview(catalog));
      return;
    }
    if (cli.command === "list") {
      if (cli.positional.length > 0 || cli.limit !== undefined) usage();
      if (cli.kind && !["model", "dataset", "package"].includes(cli.kind)) fail("unknown resource kind");
      if (cli.family && !catalog.families.some((entry: any) => entry.id === cli.family)) fail("unknown family");
      const nodes = catalog.nodes.filter((node: any) => (!cli.kind || node.kind === cli.kind) && (!cli.family || node.family_id === cli.family));
      process.stdout.write(cli.json ? `${JSON.stringify({ catalog_id: catalog.catalog_id, nodes })}\n` : renderNodes(nodes));
      return;
    }
    if (cli.command === "papers") {
      if (cli.positional.length > 0 || cli.kind || cli.family || cli.limit !== undefined) usage();
      process.stdout.write(cli.json ? `${JSON.stringify({ catalog_id: catalog.catalog_id, papers: catalog.papers })}\n` : renderPapers(catalog.papers));
      return;
    }
    if (cli.command === "show") {
      if (cli.positional.length !== 1 || cli.kind || cli.family || cli.limit !== undefined) usage();
      const item = catalog.nodes.find((entry: any) => entry.id === cli.positional[0])
        ?? catalog.papers.find((entry: any) => entry.id === cli.positional[0]);
      if (!item) fail(`unknown Principality item ${JSON.stringify(cli.positional[0])}`);
      process.stdout.write(`${JSON.stringify(item, null, cli.json ? 0 : 2)}\n`);
      return;
    }
    if (cli.command === "match") {
      const result = matchPrincipalities(cli.positional, { kind: cli.kind, family: cli.family, limit: cli.limit }, catalog);
      process.stdout.write(cli.json ? `${JSON.stringify(result)}\n` : renderMatch(result));
      return;
    }
    if (cli.command === "evidence") {
      if (cli.positional.length !== 1 || cli.kind || cli.family || cli.limit !== undefined) usage();
      const source = principalityCapabilitySource(cli.positional[0]!, catalog);
      process.stdout.write(`${JSON.stringify(source, null, cli.json ? 0 : 2)}\n`);
      return;
    }
    usage();
  } catch (error) {
    process.stderr.write(`principality refused: ${error instanceof Error ? error.message : "invalid input"}\n`);
    process.exit(1);
  }
}

if (import.meta.main) await main();
