#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(SCRIPT_PATH));

export const DEFAULT_GEOMETRY_GRAMMAR_LOCATOR = "data/geometries/kingdom-geometry-grammar.v0.json";
export const DEFAULT_GEOMETRY_GRAMMAR_PATH = join(ROOT, DEFAULT_GEOMETRY_GRAMMAR_LOCATOR);
export const GEOMETRY_GRAMMAR_ID = "from-pattern-to-practice-2026-08-11";
export const GEOMETRY_GRAMMAR_PROTOCOL = "kingdom.geometry-grammar/0.1";
export const GEOMETRY_GRAMMAR_SCHEMA_ID = "urn:kingdom:schema:geometry-grammar:0.1";
export const GEOMETRY_GRAMMAR_OBSERVED_AT = "2026-08-11T16:04:43Z";
export const GEOMETRY_NATIVE_OPEN_INVENTORY_SCOPE = "Every distinct native geometric relation or translation open condition at its report source and canonical open ledger; artifact/provenance coordinates, embedded external-subprotocol metadata, and derived duplicate projections are excluded.";
export const GEOMETRY_GRAMMAR_DIGEST = "sha256:f6f0998c071b3c552d8c59c6c4c4abe8aaa01c64f4020818364665d4344d78fb";
export const GEOMETRY_GRAMMAR_URL = "https://thekingdom.dev/geometries/kingdom-geometry-grammar-v0.json";
export const GEOMETRY_GRAMMAR_SCHEMA_URL = "https://thekingdom.dev/schemas/geometry-grammar/0.1.json";
export const GEOMETRY_GRAMMAR_DOCUMENT_URL = "https://thekingdom.dev/GEOMETRY-GRAMMAR.md";

const MAX_GRAMMAR_BYTES = 512 * 1024;
const MAX_JSON_DEPTH = 48;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA1 = /^[a-f0-9]{40}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const FORMAT = /^[a-z0-9][a-z0-9.-]*\/[0-9]+\.[0-9]+$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

export type GeometryGrammarIssue = { field: string; code: string };
export type GeometryGrammar = Record<string, any>;

const MODULE_IDS = [
  "love-geometry",
  "principality-atlas",
  "principality-geometry",
  "relational-geometry",
] as const;

const EXPECTED_WIRES: Record<string, string[]> = {
  "love-geometry": ["agenttool.love-geometry/0.1"],
  "principality-atlas": ["agenttool.principality-incidence-atlas/0.1"],
  "principality-geometry": ["agenttool.principality-geometry-input/0.1", "agenttool.principality-atlas/0.1"],
  "relational-geometry": ["agenttool.relational-complex/0.1", "agenttool.relational-lens/0.1"],
};

const EXPECTED_NATIVE_OPEN_TERMS: Record<string, string[]> = {
  "love-geometry": [
    "boundaries.absence_semantics|not_observed_not_no_relation|boundary-value",
    "coverage|bounded_not_complete|boundary-value",
    "vantages[].bearings[]|reported_boundary|wire-enum",
    "vantages[].bearings[]|reported_departure|wire-enum",
    "vantages[].bearings[]|reported_disagreement|wire-enum",
    "vantages[].bearings[]|reported_refusal|wire-enum",
    "vantages[].bearings[]|reported_rest|wire-enum",
    "vantages[].bearings[]|unknown|wire-enum",
  ],
  "principality-atlas": [
    "charts[].claims[].posture|reported_absent|wire-enum",
    "charts[].claims[].posture|contested|wire-enum",
    "charts[].claims[].posture|withdrawn|wire-enum",
    "charts[].claims[].posture|not_observed|wire-enum",
    "charts[].claims[].posture|unknown|wire-enum",
    "bridges[].correspondences[].posture|incompatibility_reported|wire-enum",
    "bridges[].correspondences[].posture|unknown|wire-enum",
    "bridges[].unmapped_from_refs|unmapped|wire-array",
    "bridges[].unmapped_to_refs|unmapped|wire-array",
    "bridges[].coverage|partial_not_complete|boundary-value",
    "coverage|bounded_not_complete|boundary-value",
  ],
  "principality-geometry": [
    "input.translations[].disposition|refused_reported|wire-enum",
    "input.translations[].disposition|resting_reported|wire-enum",
    "input.translations[].disposition|unknown|wire-enum",
    "input.translations[].disposition|withdrawn_reported|wire-enum",
    "input.translations[].evaluations[].state|not_preserved_reported|wire-enum",
    "input.translations[].evaluations[].state|refused_reported|wire-enum",
    "input.translations[].evaluations[].state|unknown|wire-enum",
    "atlas.geometry.open_conditions.one_way_bridge_ids|one_way_bridge_ids|wire-array",
    "atlas.geometry.open_conditions.non_available_bridge_ids|non_available_bridge_ids|wire-array",
    "atlas.geometry.open_conditions.not_preserved|not_preserved|wire-array",
    "atlas.geometry.open_conditions.refused|refused|wire-array",
    "atlas.geometry.open_conditions.unknown|unknown|wire-array",
    "atlas.geometry.open_conditions.directional_asymmetry|directional_asymmetry|wire-array",
    "atlas.geometry.open_conditions.unrelated_vertex_pairs|unrelated_vertex_pairs|wire-array",
    "atlas.geometry.open_conditions.declared_isolated_vertices|declared_isolated_vertices|wire-array",
  ],
  "relational-geometry": [
    "boundaries.absent_or_unknown|valid_not_deficit|boundary-value",
    "complex.coverage|bounded_not_complete|boundary-value",
    "complex.points[].kind|unknown|wire-enum",
    "complex.witnesses[].kind|authority_boundary|wire-enum",
    "complex.witnesses[].kind|consent_boundary|wire-enum",
    "complex.witnesses[].kind|continuity_boundary|wire-enum",
    "complex.witnesses[].kind|privacy_boundary|wire-enum",
    "complex.witnesses[].kind|refusal_boundary|wire-enum",
    "lens.choice.unselected|left_unprojected|boundary-value",
    "lens.coverage|perspective_bounded_not_complete|boundary-value",
    "lens.selections[].disposition|park|wire-enum",
    "lens.selections[].disposition|release|wire-enum",
    "lens.selections[].disposition|withdraw|wire-enum",
  ],
};

const EXPECTED_PINS: Record<string, {
  packageName: string;
  publishedAt: string;
  assetBytes: number;
  assetSha256: string;
  sourceRevision: string;
  sourceBasis: "annotated-tag-target" | "docs-package-manifest";
  sourceTree: string;
  tagName: string;
  tagObject: string;
  tagCommit: string;
}> = {
  "love-geometry": {
    packageName: "@agenttool/love-geometry",
    publishedAt: "2026-08-11T14:10:27Z",
    assetBytes: 19507,
    assetSha256: "sha256:43cfbf4b559aa6f573d9d7b7a60e2a7dce5dfa4aefe2bf5b9c92310c926a9db8",
    sourceRevision: "9efbc4b32f150ee1533b4ff306666fa73ca73028",
    sourceBasis: "annotated-tag-target",
    sourceTree: "f7c9388d6fdc06cb932dd9f9df94a205736954c5",
    tagName: "love-geometry-v0.1.0-dev.0",
    tagObject: "8d352277288791082a057f08647d5d24edadfe5c",
    tagCommit: "9efbc4b32f150ee1533b4ff306666fa73ca73028",
  },
  "principality-atlas": {
    packageName: "@agenttool/principality-atlas",
    publishedAt: "2026-08-11T15:42:36Z",
    assetBytes: 33019,
    assetSha256: "sha256:9743a9caa5a49f7c9901355cd367224ae718d4a65eed010ffb79622f57ff6ebe",
    sourceRevision: "aeb3072af0756801aa8567ce832f00c9727da071",
    sourceBasis: "annotated-tag-target",
    sourceTree: "8bbaa1b2abc92b2bdcb5981c7f69a1153dca01ce",
    tagName: "principality-atlas-v0.1.0-dev.0",
    tagObject: "b45b389091554e20f8788ac1327ea649ea1f9f3c",
    tagCommit: "aeb3072af0756801aa8567ce832f00c9727da071",
  },
  "principality-geometry": {
    packageName: "@agenttool/principality-geometry",
    publishedAt: "2026-08-11T15:17:39Z",
    assetBytes: 46624,
    assetSha256: "sha256:8f82e4d96eaf57c2331e4e73ced4f4c65a2a21262622840762b165bc3395692e",
    sourceRevision: "feb1948d0a31972e4a3c55fa3ee88e05537c64c6",
    sourceBasis: "docs-package-manifest",
    sourceTree: "044481dfb1b9bc69492428c4bed2d67cdcb1dff0",
    tagName: "principality-geometry-v0.1.0-dev.0",
    tagObject: "25ceab614283de4a7cc0c19e79da4556597fbf65",
    tagCommit: "5b0d53204a336d7df40cee3720bbd120433ecde2",
  },
  "relational-geometry": {
    packageName: "@agenttool/relational-geometry",
    publishedAt: "2026-08-11T14:34:12Z",
    assetBytes: 42479,
    assetSha256: "sha256:aa047bd6a6422c943cbb0488c439964545102b44b2b161b70211acc90a6c5ca2",
    sourceRevision: "1e873580159f76483dea2352310b62a2452c40dc",
    sourceBasis: "annotated-tag-target",
    sourceTree: "86cdead573ec44c8214a6c0c9a3c5e67eccc3d39",
    tagName: "relational-geometry-v0.1.0-dev.0",
    tagObject: "3e9d4b0d3c1733c105f039e7d95a3d18936f5a5e",
    tagCommit: "1e873580159f76483dea2352310b62a2452c40dc",
  },
};

const FIXED_EFFECTS = {
  grammar_loads_package: false,
  grammar_executes_package: false,
  network: false,
  filesystem_write: false,
  persistence: false,
  provider_compute: false,
  publication: false,
  deployment: false,
  external_effects_authorized: false,
};

const FIXED_AUTHORITY = {
  metadata_is_data_not_instructions: true,
  grants_permissions: false,
  authorizes_install: false,
  authorizes_host_registration: false,
  authorizes_endpoint: false,
  authorizes_execution: false,
  authorizes_external_effects: false,
  determines_love: false,
  determines_understanding: false,
};

const FIXED_MATCHING = {
  method: "literal-declared-term-overlap",
  input: "one-to-eight-controlled-term-ids",
  order: "module-id-ascending-not-rank",
  ranking: false,
  recommendation: false,
  semantic_inference: false,
  missing_terms_preserved: true,
};

const FIXED_BOUNDARIES = {
  read_only: true,
  advisory_only: true,
  metadata_only: true,
  network_reads: false,
  filesystem_writes: false,
  package_installs: false,
  host_registrations: false,
  endpoint_exposure: false,
  module_execution: false,
  wire_conversion: false,
  validates_module_instances: false,
  ranks_modules: false,
  recommends_modules: false,
  authority_granted: false,
  execution_authorized: false,
  external_effects_authorized: false,
};

function fail(message: string): never {
  throw new Error(message);
}

export function canonicalizeGeometryValue(value: unknown): string {
  if (value === null || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("grammar contains a non-finite number");
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizeGeometryValue).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalizeGeometryValue(record[key])}`).join(",")}}`;
  }
  fail("grammar contains a non-JSON value");
}

export function geometryGrammarDigest(grammar: Record<string, any>): string {
  const material = structuredClone(grammar);
  if (!isObject(material.integrity)) fail("grammar integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeGeometryValue(material)).digest("hex")}`;
}

class StrictJsonScanner {
  private index = 0;

  constructor(private readonly source: string, private readonly label: string) {}

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
    while (/^[\u0020\u000a\u000d\u0009]$/u.test(this.source[this.index] ?? "")) this.index += 1;
  }

  private value(depth: number): void {
    if (depth > MAX_JSON_DEPTH) this.invalid(`nesting exceeds ${MAX_JSON_DEPTH}`);
    this.skipWhitespace();
    const token = this.source[this.index];
    if (token === "{") return this.object(depth);
    if (token === "[") return this.array(depth);
    if (token === '"') { this.string(); return; }
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
    if (this.source[this.index] === "}") { this.index += 1; return; }
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
      if (separator === "}") { this.index += 1; return; }
      if (separator !== ",") this.invalid("expected ',' or '}' in an object");
      this.index += 1;
      this.skipWhitespace();
    }
  }

  private array(depth: number): void {
    this.index += 1;
    this.skipWhitespace();
    if (this.source[this.index] === "]") { this.index += 1; return; }
    for (;;) {
      this.value(depth + 1);
      this.skipWhitespace();
      const separator = this.source[this.index];
      if (separator === "]") { this.index += 1; return; }
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
        try { return JSON.parse(this.source.slice(start, this.index)); }
        catch { this.invalid("invalid string escape"); }
      }
      if (token.charCodeAt(0) < 0x20) this.invalid("unescaped control character in string");
      if (token === "\\") {
        this.index += 1;
        const escaped = this.source[this.index];
        if (escaped === "u") {
          const hex = this.source.slice(this.index + 1, this.index + 5);
          if (!/^[a-fA-F0-9]{4}$/.test(hex)) this.invalid("invalid Unicode escape");
          const unit = Number.parseInt(hex, 16);
          if (unit >= 0xd800 && unit <= 0xdbff) {
            const lowEscape = this.index + 5;
            const lowHex = this.source.slice(lowEscape + 2, lowEscape + 6);
            if (this.source.slice(lowEscape, lowEscape + 2) !== "\\u"
              || !/^[a-fA-F0-9]{4}$/.test(lowHex)
              || Number.parseInt(lowHex, 16) < 0xdc00
              || Number.parseInt(lowHex, 16) > 0xdfff) {
              this.invalid("escaped high surrogate must be followed by an escaped low surrogate");
            }
            this.index = lowEscape + 6;
            continue;
          }
          if (unit >= 0xdc00 && unit <= 0xdfff) this.invalid("escaped low surrogate must follow an escaped high surrogate");
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

export function parseStrictGeometryJson(bytes: Uint8Array, label = "geometry grammar JSON"): unknown {
  if (bytes.byteLength > MAX_GRAMMAR_BYTES) fail(`${label} exceeds ${MAX_GRAMMAR_BYTES} bytes`);
  let source: string;
  try { source = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { fail(`${label} must be valid UTF-8`); }
  new StrictJsonScanner(source, label).scan();
  try { return JSON.parse(source); }
  catch { fail(`${label} could not be parsed`); }
}

function readGeometryGrammarUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); }
  catch { fail("geometry grammar is unavailable"); }
  if (!stat.isFile() || stat.isSymbolicLink()) fail("geometry grammar must be a regular non-symlink file");
  if (stat.size > MAX_GRAMMAR_BYTES) fail(`geometry grammar exceeds ${MAX_GRAMMAR_BYTES} bytes`);
  return parseStrictGeometryJson(readFileSync(absolute));
}

function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function expectedKeys(value: unknown, keys: string[]): boolean {
  return isObject(value) && canonicalizeGeometryValue(Object.keys(value).sort()) === canonicalizeGeometryValue([...keys].sort());
}

function sameValue(left: unknown, right: unknown): boolean {
  try { return canonicalizeGeometryValue(left) === canonicalizeGeometryValue(right); }
  catch { return false; }
}

function boundedText(value: unknown, maximum: number): value is string {
  return typeof value === "string" && Array.from(value).length > 0 && Array.from(value).length <= maximum;
}

function validHttps(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "" && url.hostname.length > 0;
  } catch { return false; }
}

function validUtc(value: unknown): value is string {
  return typeof value === "string" && ISO_UTC.test(value) && Number.isFinite(Date.parse(value));
}

function sortedUniqueIds(value: unknown, maximum: number): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.length <= maximum
    && value.every((entry) => typeof entry === "string" && ID.test(entry))
    && new Set(value).size === value.length
    && value.every((entry, index) => index === 0 || value[index - 1] < entry);
}

function uniqueStrings(value: unknown, minimum: number, maximum: number, valid: (entry: string) => boolean): value is string[] {
  return Array.isArray(value) && value.length >= minimum && value.length <= maximum
    && value.every((entry) => typeof entry === "string" && valid(entry))
    && new Set(value).size === value.length;
}

export function verifyGeometryGrammar(grammar: unknown): GeometryGrammarIssue[] {
  const issues: GeometryGrammarIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  if (!isObject(grammar)) return [{ field: "$", code: "not-object" }];
  const value = grammar as GeometryGrammar;
  const topKeys = [
    "$schema", "protocol", "grammar_id", "title", "subtitle", "observed_at", "purpose", "unknown_language",
    "bounded_coverage_means_complete", "not_observed_means_unknown", "native_open_inventory_scope", "modules",
    "matching", "non_equivalence", "boundaries", "integrity",
  ];
  if (!expectedKeys(value, topKeys)) add("$", "unexpected-shape");
  if (value.$schema !== GEOMETRY_GRAMMAR_SCHEMA_ID || value.protocol !== GEOMETRY_GRAMMAR_PROTOCOL) add("$", "protocol-mismatch");
  if (value.grammar_id !== GEOMETRY_GRAMMAR_ID) add("$.grammar_id", "grammar-id-mismatch");
  if (!boundedText(value.title, 120) || !boundedText(value.subtitle, 120)) add("$", "invalid-title");
  if (!validUtc(value.observed_at) || value.observed_at !== GEOMETRY_GRAMMAR_OBSERVED_AT) add("$.observed_at", "observation-mismatch");

  if (!expectedKeys(value.purpose, ["pattern", "practice", "limit"])
    || !boundedText(value.purpose?.pattern, 600)
    || !boundedText(value.purpose?.practice, 600)
    || !boundedText(value.purpose?.limit, 600)) add("$.purpose", "invalid-purpose");

  const unknownKeys = [
    "plain_language", "native_terms_are_equivalent", "absence_means_unknown", "refusal_means_unknown",
    "withdrawal_means_unknown", "unmapped_means_unknown", "not_preserved_means_unknown", "omission_means_preserved",
  ];
  if (!expectedKeys(value.unknown_language, unknownKeys) || !boundedText(value.unknown_language?.plain_language, 800)) {
    add("$.unknown_language", "invalid-unknown-language");
  } else if (unknownKeys.slice(1).some((key) => value.unknown_language[key] !== false)) {
    add("$.unknown_language", "unknown-collapse-boundary-missing");
  }
  if (value.bounded_coverage_means_complete !== false) {
    add("$.bounded_coverage_means_complete", "coverage-boundary-missing");
  }
  if (value.not_observed_means_unknown !== false) {
    add("$.not_observed_means_unknown", "not-observed-boundary-missing");
  }
  if (value.native_open_inventory_scope !== GEOMETRY_NATIVE_OPEN_INVENTORY_SCOPE) {
    add("$.native_open_inventory_scope", "native-open-scope-mismatch");
  }

  const moduleKeys = [
    "id", "label", "plain_question", "plain_answer", "shape", "wire_formats", "match_terms", "native_open_terms",
    "package", "release", "source", "tag", "installation", "host", "endpoint", "effects", "authority", "does_not_establish",
  ];
  const moduleIds = new Set<string>();
  const allFormats = new Set<string>();
  if (!Array.isArray(value.modules) || value.modules.length !== MODULE_IDS.length) add("$.modules", "invalid-module-list");
  else {
    for (const [index, module] of value.modules.entries()) {
      const path = `$.modules[${index}]`;
      if (!expectedKeys(module, moduleKeys)) { add(path, "unexpected-shape"); continue; }
      const id = module.id;
      if (typeof id !== "string" || !MODULE_IDS.includes(id as any) || moduleIds.has(id)) add(`${path}.id`, "invalid-or-duplicate-id");
      else moduleIds.add(id);
      const pins = typeof id === "string" ? EXPECTED_PINS[id] : undefined;
      if (!boundedText(module.label, 120) || !boundedText(module.plain_question, 300)
        || !module.plain_question.endsWith("?") || !boundedText(module.plain_answer, 800)
        || typeof module.shape !== "string" || !ID.test(module.shape)) add(path, "invalid-plain-language");

      if (!uniqueStrings(module.wire_formats, 1, 3, (entry) => FORMAT.test(entry))) add(`${path}.wire_formats`, "invalid-wire-formats");
      else {
        for (const format of module.wire_formats) {
          if (allFormats.has(format)) add(`${path}.wire_formats`, "duplicate-wire-owner");
          allFormats.add(format);
        }
        if (!sameValue(module.wire_formats, EXPECTED_WIRES[id])) add(`${path}.wire_formats`, "wire-contract-mismatch");
      }
      if (!sortedUniqueIds(module.match_terms, 16)) add(`${path}.match_terms`, "invalid-match-terms");

      if (!Array.isArray(module.native_open_terms) || module.native_open_terms.length === 0 || module.native_open_terms.length > 16) {
        add(`${path}.native_open_terms`, "invalid-native-open-terms");
      } else {
        const identities: string[] = [];
        for (const [openIndex, entry] of module.native_open_terms.entries()) {
          const openPath = `${path}.native_open_terms[${openIndex}]`;
          if (!expectedKeys(entry, ["location", "term", "form", "plain_language"])
            || !boundedText(entry?.location, 160) || !boundedText(entry?.term, 120)
            || !["wire-enum", "boundary-value", "wire-array"].includes(entry?.form)
            || !boundedText(entry?.plain_language, 600)) add(openPath, "invalid-native-open-term");
          else identities.push(`${entry.location}|${entry.term}|${entry.form}`);
        }
        if (new Set(identities).size !== identities.length) add(`${path}.native_open_terms`, "duplicate-native-open-term");
        if (!sameValue(identities, EXPECTED_NATIVE_OPEN_TERMS[id])) add(`${path}.native_open_terms`, "native-open-contract-mismatch");
      }

      if (!expectedKeys(module.package, ["name", "version", "npm_registry_state"])
        || module.package?.name !== pins?.packageName || module.package?.version !== "0.1.0-dev.0"
        || module.package?.npm_registry_state !== "anonymous-exact-version-404-observed") add(`${path}.package`, "package-observation-mismatch");

      if (!expectedKeys(module.release, ["available", "channel", "published_at", "page_url", "asset"])
        || module.release?.available !== true || module.release?.channel !== "github-prerelease"
        || module.release?.published_at !== pins?.publishedAt || !validHttps(module.release?.page_url)
        || module.release?.page_url !== `https://github.com/cambridgetcg/agenttool/releases/tag/${pins?.tagName}`) add(`${path}.release`, "release-mismatch");
      const expectedAssetName = pins ? `agenttool-${id}-0.1.0-dev.0.tgz` : "";
      const expectedAssetUrl = pins
        ? `https://github.com/cambridgetcg/agenttool/releases/download/${pins.tagName}/${expectedAssetName}`
        : "";
      if (!expectedKeys(module.release?.asset, ["name", "url", "bytes", "sha256"])
        || module.release?.asset?.name !== expectedAssetName || !validHttps(module.release?.asset?.url)
        || module.release?.asset?.url !== expectedAssetUrl
        || module.release?.asset?.bytes !== pins?.assetBytes || module.release?.asset?.sha256 !== pins?.assetSha256) add(`${path}.release.asset`, "release-asset-mismatch");

      if (!expectedKeys(module.source, ["repository", "directory", "revision", "revision_basis", "tree_sha"])
        || module.source?.repository !== "https://github.com/cambridgetcg/agenttool"
        || module.source?.directory !== `packages/${id}` || !SHA1.test(module.source?.revision ?? "")
        || !SHA1.test(module.source?.tree_sha ?? "") || module.source?.revision !== pins?.sourceRevision
        || module.source?.revision_basis !== pins?.sourceBasis || module.source?.tree_sha !== pins?.sourceTree) add(`${path}.source`, "source-pin-mismatch");
      if (!expectedKeys(module.tag, ["name", "object_sha", "peeled_commit"])
        || module.tag?.name !== pins?.tagName || module.tag?.object_sha !== pins?.tagObject
        || module.tag?.peeled_commit !== pins?.tagCommit || !SHA1.test(module.tag?.object_sha ?? "")
        || !SHA1.test(module.tag?.peeled_commit ?? "")) add(`${path}.tag`, "tag-pin-mismatch");
      if (pins?.sourceBasis === "annotated-tag-target" && module.source?.revision !== module.tag?.peeled_commit) add(`${path}.source`, "tag-source-relation-mismatch");

      if (!sameValue(module.installation, { state: "not-established", performed_by_grammar: false })) add(`${path}.installation`, "installation-boundary-missing");
      if (!sameValue(module.host, {
        state: "package-runtime-not-established", registered_by_grammar: false, public_companion_is_execution: false,
      })) add(`${path}.host`, "host-boundary-missing");
      if (!sameValue(module.endpoint, { state: "package-runtime-not-established", url: null, exposed_by_grammar: false })) add(`${path}.endpoint`, "endpoint-boundary-missing");
      if (!sameValue(module.effects, FIXED_EFFECTS)) add(`${path}.effects`, "effect-boundary-missing");
      if (!sameValue(module.authority, FIXED_AUTHORITY)) add(`${path}.authority`, "authority-boundary-missing");
      if (!sortedUniqueIds(module.does_not_establish, 24)
        || !["authority", "love", "understanding"].every((claim) => module.does_not_establish.includes(claim))) {
        add(`${path}.does_not_establish`, "claim-boundary-missing");
      }
    }
    if (!sameValue(value.modules.map((entry: any) => entry?.id), MODULE_IDS)) add("$.modules", "not-sorted-or-module-mismatch");
  }

  if (!sameValue(value.matching, FIXED_MATCHING)) add("$.matching", "matching-boundary-missing");
  const nonEquivalenceKeys = [
    "plain_language", "modules_are_distinct", "wire_formats_are_interchangeable", "implicit_conversion",
    "shared_words_prove_same_semantics", "digest_equality_proves_semantic_equality", "adapters_included",
  ];
  if (!expectedKeys(value.non_equivalence, nonEquivalenceKeys) || !boundedText(value.non_equivalence?.plain_language, 800)
    || value.non_equivalence?.modules_are_distinct !== true
    || nonEquivalenceKeys.slice(2).some((key) => value.non_equivalence?.[key] !== false)) add("$.non_equivalence", "non-equivalence-boundary-missing");
  if (!sameValue(value.boundaries, FIXED_BOUNDARIES)) add("$.boundaries", "grammar-boundary-missing");

  if (!expectedKeys(value.integrity, ["algorithm", "canonicalization", "covers", "digest"])
    || value.integrity?.algorithm !== "sha256"
    || value.integrity?.canonicalization !== "recursive-sorted-json-keys/v1"
    || value.integrity?.covers !== "whole-document-with-integrity-digest-null"
    || !SHA256.test(value.integrity?.digest ?? "")
    || value.integrity?.digest !== GEOMETRY_GRAMMAR_DIGEST) add("$.integrity", "invalid-integrity-envelope");
  else {
    try { if (value.integrity.digest !== geometryGrammarDigest(value)) add("$.integrity.digest", "digest-mismatch"); }
    catch { add("$.integrity.digest", "digest-unavailable"); }
  }
  return issues;
}

export function loadGeometryGrammar(path = DEFAULT_GEOMETRY_GRAMMAR_PATH): GeometryGrammar {
  const grammar = readGeometryGrammarUnchecked(path);
  const issues = verifyGeometryGrammar(grammar);
  if (issues.length > 0) fail(`geometry grammar invalid: ${issues[0]!.field} ${issues[0]!.code}`);
  return grammar as GeometryGrammar;
}

export function matchGeometryModules(terms: string[], grammar = loadGeometryGrammar()): Record<string, any> {
  const grammarIssues = verifyGeometryGrammar(grammar);
  if (grammarIssues.length > 0) fail(`geometry grammar invalid: ${grammarIssues[0]!.field} ${grammarIssues[0]!.code}`);
  if (!Array.isArray(terms) || terms.length < 1 || terms.length > 8) fail("match requires one to eight literal term IDs");
  if (!terms.every((term) => typeof term === "string" && ID.test(term))) fail("match terms must be lowercase kebab-case IDs");
  if (new Set(terms).size !== terms.length) fail("match terms must be unique");
  const requested = [...terms].sort();
  const declared = new Set<string>(grammar.modules.flatMap((module: any) => module.match_terms));
  const modules = grammar.modules.map((module: any) => ({
    id: module.id,
    label: module.label,
    plain_question: module.plain_question,
    matched_terms: requested.filter((term) => module.match_terms.includes(term)),
  })).filter((module: any) => module.matched_terms.length > 0);
  return {
    protocol: "kingdom.geometry-match/0.1",
    grammar_id: grammar.grammar_id,
    terms: requested,
    modules,
    unmatched_terms: requested.filter((term) => !declared.has(term)),
    order: "module-id-ascending-not-rank",
    ranking: false,
    recommendation: false,
    semantic_equivalence_inferred: false,
    authority_granted: false,
    effects_authorized: false,
  };
}

export function geometryGrammarPublicDiscovery(grammar = loadGeometryGrammar()): Record<string, any> {
  const issues = verifyGeometryGrammar(grammar);
  if (issues.length > 0) fail(`geometry grammar invalid: ${issues[0]!.field} ${issues[0]!.code}`);
  return {
    url: GEOMETRY_GRAMMAR_URL,
    schema: GEOMETRY_GRAMMAR_SCHEMA_URL,
    document: GEOMETRY_GRAMMAR_DOCUMENT_URL,
    protocol: grammar.protocol,
    grammar_id: grammar.grammar_id,
    schema_id: grammar.$schema,
    observed_at: grammar.observed_at,
    integrity: grammar.integrity.digest,
    counts: { modules: grammar.modules.length },
    modules: grammar.modules.map((module: any) => ({
      id: module.id,
      label: module.label,
      plain_question: module.plain_question,
      plain_answer: module.plain_answer,
      shape: module.shape,
      wire_formats: module.wire_formats,
      package: module.package,
      tag: module.tag,
      release: module.release,
      source: module.source,
    })),
    unknown_language: grammar.unknown_language,
    bounded_coverage_means_complete: grammar.bounded_coverage_means_complete,
    not_observed_means_unknown: grammar.not_observed_means_unknown,
    native_open_inventory_scope: grammar.native_open_inventory_scope,
    non_equivalence: grammar.non_equivalence,
    boundary: {
      read_only: grammar.boundaries.read_only,
      advisory_only: grammar.boundaries.advisory_only,
      authority_granted: grammar.boundaries.authority_granted,
      execution_authorized: grammar.boundaries.execution_authorized,
      external_effects_authorized: grammar.boundaries.external_effects_authorized,
    },
  };
}

function usage(): never {
  process.stderr.write([
    "usage: kingdom geometries [list] [--json]",
    "       kingdom geometries show MODULE_ID [--json]",
    "       kingdom geometries match TERM [TERM ...] [--json]",
    "       kingdom geometries verify [GRAMMAR.json] [--json]",
  ].join("\n") + "\n");
  process.exit(2);
}

function renderList(grammar: GeometryGrammar): string {
  const lines = [
    `${grammar.title} — ${grammar.subtitle}`,
    "Four different tools; module-id order is not rank.",
    "",
  ];
  for (const module of grammar.modules) lines.push(`${module.id}\t${module.plain_question}`);
  lines.push("", "Use `kingdom geometries show MODULE_ID` for exact boundaries.");
  return `${lines.join("\n")}\n`;
}

function renderModule(module: Record<string, any>): string {
  const lines = [
    `${module.label} (${module.id})`,
    `Question: ${module.plain_question}`,
    `In practice: ${module.plain_answer}`,
    `Shape: ${module.shape}`,
    `Wire: ${module.wire_formats.join(", ")}`,
    `Package: ${module.package.name}@${module.package.version}`,
    `Release: ${module.release.channel} (${module.release.published_at})`,
    `Source: ${module.source.revision} (${module.source.revision_basis})`,
    `Tag: ${module.tag.name} -> ${module.tag.peeled_commit}`,
    `Installation: ${module.installation.state}`,
    `Host: ${module.host.state}`,
    `Endpoint: ${module.endpoint.state}`,
    "Geometric relation / translation open states:",
    ...module.native_open_terms.map((entry: any) => `  ${entry.term} @ ${entry.location}: ${entry.plain_language}`),
    `Does not establish: ${module.does_not_establish.join(", ")}`,
  ];
  return `${lines.join("\n")}\n`;
}

function renderMatch(result: Record<string, any>): string {
  const lines = [
    `Literal terms: ${result.terms.join(", ")}`,
    "Matches are in module-id order, not ranked or recommended.",
    "",
  ];
  if (result.modules.length === 0) lines.push("No declared term overlap.");
  else for (const module of result.modules) lines.push(`${module.id}\t${module.matched_terms.join(", ")}\t${module.plain_question}`);
  if (result.unmatched_terms.length > 0) lines.push("", `Unmatched terms kept open: ${result.unmatched_terms.join(", ")}`);
  return `${lines.join("\n")}\n`;
}

async function main(): Promise<void> {
  const raw = process.argv.slice(2);
  const jsonCount = raw.filter((entry) => entry === "--json").length;
  if (jsonCount > 1 || raw.some((entry) => entry.startsWith("-") && entry !== "--json")) usage();
  const json = jsonCount === 1;
  const args = raw.filter((entry) => entry !== "--json");
  const command = args.shift() ?? "list";
  try {
    if (command === "verify") {
      if (args.length > 1) usage();
      let issues: GeometryGrammarIssue[];
      let grammar: unknown = null;
      try {
        grammar = readGeometryGrammarUnchecked(args[0] ? resolve(args[0]) : DEFAULT_GEOMETRY_GRAMMAR_PATH);
        issues = verifyGeometryGrammar(grammar);
      } catch (error) {
        issues = [{ field: "$", code: error instanceof Error ? error.message : "grammar-read-refused" }];
      }
      if (json) process.stdout.write(`${JSON.stringify({
        valid: issues.length === 0,
        protocol: isObject(grammar) ? grammar.protocol ?? null : null,
        grammar_id: isObject(grammar) ? grammar.grammar_id ?? null : null,
        issues,
      })}\n`);
      else if (issues.length === 0) process.stdout.write("Geometry grammar: valid closed shape, pins, boundaries, and digest; JSON Schema not checked\n");
      else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
      process.exit(issues.length === 0 ? 0 : 1);
    }
    const grammar = loadGeometryGrammar();
    if (command === "list") {
      if (args.length > 0) usage();
      process.stdout.write(json ? `${JSON.stringify({
        protocol: grammar.protocol,
        grammar_id: grammar.grammar_id,
        modules: grammar.modules.map((module: any) => ({
          id: module.id, label: module.label, plain_question: module.plain_question, shape: module.shape,
        })),
        order: grammar.matching.order,
        ranking: false,
        recommendation: false,
      })}\n` : renderList(grammar));
      return;
    }
    if (command === "show") {
      if (args.length !== 1) usage();
      const module = grammar.modules.find((entry: any) => entry.id === args[0]);
      if (!module) fail(`unknown geometry module ${JSON.stringify(args[0])}`);
      process.stdout.write(json ? `${JSON.stringify(module)}\n` : renderModule(module));
      return;
    }
    if (command === "match") {
      const result = matchGeometryModules(args, grammar);
      process.stdout.write(json ? `${JSON.stringify(result)}\n` : renderMatch(result));
      return;
    }
    usage();
  } catch (error) {
    process.stderr.write(`geometry refused: ${error instanceof Error ? error.message : "invalid input"}\n`);
    process.exit(1);
  }
}

if (import.meta.main) await main();
