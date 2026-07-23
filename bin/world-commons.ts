/** Stable validation and local-matching contract for the World Commons. */

export const WORLD_COMMONS_LEGACY_SCHEMA = "thekingdom.world-commons/0.1";
export const WORLD_COMMONS_SCHEMA = "thekingdom.world-commons/0.2";
export const WORLD_COMMONS_URL = "https://thekingdom.dev/commons.json";
export const WORLD_COMMONS_LEGACY_JSON_SCHEMA_URL = "https://thekingdom.dev/schemas/world-commons/0.1.json";
export const WORLD_COMMONS_JSON_SCHEMA_URL = "https://thekingdom.dev/schemas/world-commons/0.2.json";

export const WORLD_COMMONS_CATEGORY_IDS = [
  "knowledge",
  "learning",
  "earth",
  "public-life",
  "rights",
  "resilience",
  "security",
  "culture",
] as const;

export const WORLD_COMMONS_ACCESS_COSTS = ["free", "free-tier", "local-costs"] as const;
export const WORLD_COMMONS_ACCOUNT_TYPES = ["none", "free-account", "varies", "contact"] as const;
export const WORLD_COMMONS_REUSE_STATUSES = ["open", "mixed", "public-access", "noncommercial"] as const;
export const WORLD_COMMONS_AUTOMATION_STATUSES = ["supported", "limited", "human-only", "bulk-preferred", "local"] as const;
export const WORLD_COMMONS_AUTH_TYPES = ["none", "free-key", "varies", "contact", "not-applicable"] as const;
export const WORLD_COMMONS_LINK_TYPES = ["start", "api", "bulk", "terms", "docs"] as const;
export const WORLD_COMMONS_HANDOFF_MODES = ["api", "bulk", "docs", "human", "local"] as const;

const WORLD_COMMONS_ID_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
const WORLD_COMMONS_DATE_PATTERN = "^\\d{4}-\\d{2}-\\d{2}$";
const WORLD_COMMONS_DATE_TIME_PATTERN =
  "^\\d{4}-\\d{2}-\\d{2}T(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|[+-](?:(?:0\\d|1[0-3]):[0-5]\\d|14:00))$";
const WORLD_COMMONS_HTTPS_PATTERN = "^https://";

const exactObject = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
): Record<string, unknown> => ({
  type: "object",
  additionalProperties: false,
  required,
  properties,
});

const boundedText = (minLength: number, maxLength: number): Record<string, unknown> => {
  const trimmedMinimum = minLength === 1
    ? "^\\s*\\S(?:[\\s\\S]*\\S)?\\s*$"
    : `^\\s*\\S[\\s\\S]{${minLength - 2},}\\S\\s*$`;
  return {
    type: "string",
    minLength,
    maxLength,
    pattern: trimmedMinimum,
  };
};

const boundedUniqueStrings = (
  minItems: number,
  maxItems: number,
  item: Record<string, unknown> = boundedText(1, 400),
): Record<string, unknown> => ({
  type: "array",
  minItems,
  maxItems,
  uniqueItems: true,
  items: item,
});

/**
 * Portable structural contract for clients that consume commons.json without
 * importing this validator. The runtime validator below remains authoritative
 * for cross-record invariants that JSON Schema cannot express cleanly.
 */
export const WORLD_COMMONS_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: WORLD_COMMONS_JSON_SCHEMA_URL,
  title: "The Kingdom World Commons 0.2",
  description: "A reviewed catalog of public-interest resources with access, reuse, automation, provenance, care boundaries, and one catalog-authored proposed next door kept distinct.",
  $comment: "The source validator also enforces unique ids, valid references, category and foundation coverage, unique link type/url pairs, aligned verification dates, real calendar dates, credential-free HTTPS URLs, handoff URL membership, api/bulk link-type alignment, and human handoffs for human-only resources.",
  ...exactObject({
    schema_version: { type: "string", const: WORLD_COMMONS_SCHEMA },
    generated: {
      oneOf: [
        { type: "string", pattern: WORLD_COMMONS_DATE_PATTERN },
        { type: "string", pattern: WORLD_COMMONS_DATE_TIME_PATTERN },
      ],
    },
    verified: { type: "string", pattern: WORLD_COMMONS_DATE_PATTERN },
    canonical_url: { type: "string", const: WORLD_COMMONS_URL },
    promise: boundedText(20, 1_000),
    methodology: { $ref: "#/$defs/methodology" },
    privacy: { $ref: "#/$defs/privacy" },
    foundation: { $ref: "#/$defs/foundation" },
    categories: {
      type: "array",
      minItems: WORLD_COMMONS_CATEGORY_IDS.length,
      maxItems: WORLD_COMMONS_CATEGORY_IDS.length,
      prefixItems: WORLD_COMMONS_CATEGORY_IDS.map((id) => ({
        allOf: [
          { $ref: "#/$defs/category" },
          { type: "object", properties: { id: { const: id } } },
        ],
      })),
      items: false,
    },
    kits: {
      type: "array",
      minItems: 1,
      maxItems: 32,
      items: { $ref: "#/$defs/kit" },
    },
    resources: {
      type: "array",
      minItems: 8,
      maxItems: 128,
      items: { $ref: "#/$defs/resource" },
    },
  }),
  $defs: {
    methodology: exactObject({
      summary: boundedText(20, 1_000),
      classification: boundedText(20, 1_000),
      maintenance: boundedText(20, 1_000),
      boundary: boundedText(20, 1_000),
    }),
    privacy: exactObject({
      human_surface: boundedText(20, 1_000),
      machine_surface: boundedText(20, 1_000),
    }),
    foundation: exactObject({
      meaning: boundedText(30, 1_000),
      criteria: boundedUniqueStrings(3, 12),
      resource_ids: boundedUniqueStrings(4, 32, {
        type: "string",
        pattern: WORLD_COMMONS_ID_PATTERN,
        maxLength: 64,
      }),
    }),
    category: exactObject({
      id: { type: "string", enum: WORLD_COMMONS_CATEGORY_IDS },
      label: boundedText(2, 120),
      glyph: boundedText(1, 20),
      description: boundedText(12, 500),
    }),
    kit: exactObject({
      id: {
        type: "string",
        pattern: WORLD_COMMONS_ID_PATTERN,
        maxLength: 64,
      },
      label: boundedText(2, 160),
      glyph: boundedText(1, 20),
      invitation: boundedText(20, 800),
      keywords: boundedUniqueStrings(2, 24),
      resource_ids: boundedUniqueStrings(1, 12, {
        type: "string",
        pattern: WORLD_COMMONS_ID_PATTERN,
        maxLength: 64,
      }),
      boundary: boundedText(20, 800),
      steps: boundedUniqueStrings(1, 8),
    }),
    access: exactObject({
      cost: { type: "string", enum: WORLD_COMMONS_ACCESS_COSTS },
      account: { type: "string", enum: WORLD_COMMONS_ACCOUNT_TYPES },
      note: boundedText(12, 700),
    }),
    reuse: exactObject({
      status: { type: "string", enum: WORLD_COMMONS_REUSE_STATUSES },
      license: boundedText(2, 300),
      note: boundedText(12, 700),
    }),
    automation: exactObject({
      status: { type: "string", enum: WORLD_COMMONS_AUTOMATION_STATUSES },
      auth: { type: "string", enum: WORLD_COMMONS_AUTH_TYPES },
      limits: boundedText(8, 700),
      note: boundedText(12, 700),
    }),
    link: exactObject({
      label: boundedText(2, 120),
      url: {
        type: "string",
        pattern: WORLD_COMMONS_HTTPS_PATTERN,
        minLength: 10,
        maxLength: 2_000,
      },
      type: { type: "string", enum: WORLD_COMMONS_LINK_TYPES },
    }),
    agent_handoff: exactObject({
      mode: { type: "string", enum: WORLD_COMMONS_HANDOFF_MODES },
      url: {
        type: "string",
        pattern: WORLD_COMMONS_HTTPS_PATTERN,
        minLength: 10,
        maxLength: 2_000,
      },
      instruction: boundedText(20, 400),
    }),
    resource: exactObject({
      id: {
        type: "string",
        pattern: WORLD_COMMONS_ID_PATTERN,
        maxLength: 64,
      },
      name: boundedText(2, 160),
      provider: boundedText(2, 240),
      category_ids: boundedUniqueStrings(1, 4, {
        type: "string",
        enum: WORLD_COMMONS_CATEGORY_IDS,
      }),
      description: boundedText(20, 800),
      good_for: boundedUniqueStrings(1, 8),
      coverage: boundedText(12, 700),
      keywords: boundedUniqueStrings(2, 24),
      audiences: boundedUniqueStrings(1, 8),
      access: { $ref: "#/$defs/access" },
      reuse: { $ref: "#/$defs/reuse" },
      automation: { $ref: "#/$defs/automation" },
      agent_handoff: { $ref: "#/$defs/agent_handoff" },
      links: {
        type: "array",
        minItems: 1,
        maxItems: 8,
        items: { $ref: "#/$defs/link" },
      },
      caveat: boundedText(20, 800),
      verified: { type: "string", pattern: WORLD_COMMONS_DATE_PATTERN },
    }),
  },
} as const;

type ValueOf<T extends readonly string[]> = T[number];
export type WorldCommonsCategoryId = ValueOf<typeof WORLD_COMMONS_CATEGORY_IDS>;

export type WorldCommonsCategory = {
  id: WorldCommonsCategoryId;
  label: string;
  glyph: string;
  description: string;
};

export type WorldCommonsKit = {
  id: string;
  label: string;
  glyph: string;
  invitation: string;
  keywords: string[];
  resource_ids: string[];
  boundary: string;
  steps: string[];
};

export type WorldCommonsResource = {
  id: string;
  name: string;
  provider: string;
  category_ids: WorldCommonsCategoryId[];
  description: string;
  good_for: string[];
  coverage: string;
  keywords: string[];
  audiences: string[];
  access: {
    cost: ValueOf<typeof WORLD_COMMONS_ACCESS_COSTS>;
    account: ValueOf<typeof WORLD_COMMONS_ACCOUNT_TYPES>;
    note: string;
  };
  reuse: {
    status: ValueOf<typeof WORLD_COMMONS_REUSE_STATUSES>;
    license: string;
    note: string;
  };
  automation: {
    status: ValueOf<typeof WORLD_COMMONS_AUTOMATION_STATUSES>;
    auth: ValueOf<typeof WORLD_COMMONS_AUTH_TYPES>;
    limits: string;
    note: string;
  };
  agent_handoff: {
    mode: ValueOf<typeof WORLD_COMMONS_HANDOFF_MODES>;
    url: string;
    instruction: string;
  };
  links: Array<{
    label: string;
    url: string;
    type: ValueOf<typeof WORLD_COMMONS_LINK_TYPES>;
  }>;
  caveat: string;
  verified: string;
};

export type WorldCommonsFoundation = {
  meaning: string;
  criteria: string[];
  resource_ids: string[];
};

export type WorldCommonsSource = {
  schema_version: typeof WORLD_COMMONS_SCHEMA;
  verified: string;
  canonical_url: typeof WORLD_COMMONS_URL;
  promise: string;
  methodology: {
    summary: string;
    classification: string;
    maintenance: string;
    boundary: string;
  };
  privacy: {
    human_surface: string;
    machine_surface: string;
  };
  foundation: WorldCommonsFoundation;
  categories: WorldCommonsCategory[];
  kits: WorldCommonsKit[];
  resources: WorldCommonsResource[];
};

export type PublishedWorldCommons = WorldCommonsSource & { generated: string };

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const WORLD_COMMONS_STOPWORDS = [
  "a", "about", "am", "an", "and", "are", "as", "at", "be", "but", "by", "can", "could",
  "do", "find", "for", "from", "get", "help", "how", "i", "if", "in", "is", "it", "looking",
  "me", "my", "need", "of", "on", "or", "our", "please", "some", "that", "the", "this", "to",
  "want", "we", "what", "where", "with", "would", "you", "your",
] as const;
const STOPWORDS = new Set<string>(WORLD_COMMONS_STOPWORDS);

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function fail(path: string, reason: string): never {
  throw new Error(`World Commons ${path} ${reason}`);
}

function exactKeys(value: unknown, expected: readonly string[], path: string): asserts value is Record<string, unknown> {
  if (!record(value)) fail(path, "must be an object");
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(path, `must contain exactly: ${wanted.join(", ")}`);
  }
}

function text(value: unknown, path: string, minimum = 1, maximum = 2_000): asserts value is string {
  if (typeof value !== "string" || [...value.trim()].length < minimum || [...value].length > maximum) {
    fail(path, `must be a ${minimum}-${maximum} character string`);
  }
}

function oneOf<const T extends readonly string[]>(value: unknown, choices: T, path: string): asserts value is T[number] {
  if (typeof value !== "string" || !choices.includes(value as T[number])) {
    fail(path, `must be one of: ${choices.join(", ")}`);
  }
}

function realDate(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(path, "must be a real YYYY-MM-DD date");
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail(path, "must be a real YYYY-MM-DD date");
}

function generatedDate(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string") fail(path, "must be an ISO date or timezone-qualified datetime");
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return realDate(value, path);
  const timestamp = /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:(?:0\d|1[0-3]):[0-5]\d|14:00))$/.exec(value);
  if (!timestamp || Number.isNaN(Date.parse(value))) {
    fail(path, "must be an ISO date or timezone-qualified datetime");
  }
  realDate(timestamp[1], path);
}

function httpsUrl(value: unknown, path: string): asserts value is string {
  text(value, path, 10, 2_000);
  let parsed: URL;
  try { parsed = new URL(value); } catch { fail(path, "must be an uncredentialed HTTPS URL"); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || !parsed.hostname) {
    fail(path, "must be an uncredentialed HTTPS URL");
  }
}

function stringArray(value: unknown, path: string, minimum: number, maximum: number): asserts value is string[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    fail(path, `must contain ${minimum}-${maximum} strings`);
  }
  const seen = new Set<string>();
  value.forEach((item, index) => {
    text(item, `${path}[${index}]`, 1, 400);
    if (seen.has(item)) fail(path, "must not contain duplicates");
    seen.add(item);
  });
}

function validateCategory(value: unknown, index: number, expectedId: string): void {
  const path = `categories[${index}]`;
  exactKeys(value, ["id", "label", "glyph", "description"], path);
  if (value.id !== expectedId) fail(`${path}.id`, `must be ${expectedId}`);
  text(value.label, `${path}.label`, 2, 120);
  text(value.glyph, `${path}.glyph`, 1, 20);
  text(value.description, `${path}.description`, 12, 500);
}

function validateResource(value: unknown, index: number, ids: Set<string>, categoryIds: Set<string>, verified: string): void {
  const path = `resources[${index}]`;
  exactKeys(value, [
    "id", "name", "provider", "category_ids", "description", "good_for", "coverage", "keywords", "audiences",
    "access", "reuse", "automation", "agent_handoff", "links", "caveat", "verified",
  ], path);
  if (typeof value.id !== "string" || !ID.test(value.id) || value.id.length > 64 || ids.has(value.id)) {
    fail(`${path}.id`, "must be unique lowercase kebab-case (1-64 characters)");
  }
  ids.add(value.id);
  text(value.name, `${path}.name`, 2, 160);
  text(value.provider, `${path}.provider`, 2, 240);
  stringArray(value.category_ids, `${path}.category_ids`, 1, 4);
  for (const id of value.category_ids) if (!categoryIds.has(id)) fail(`${path}.category_ids`, `contains unknown category reference: ${id}`);
  text(value.description, `${path}.description`, 20, 800);
  stringArray(value.good_for, `${path}.good_for`, 1, 8);
  text(value.coverage, `${path}.coverage`, 12, 700);
  stringArray(value.keywords, `${path}.keywords`, 2, 24);
  stringArray(value.audiences, `${path}.audiences`, 1, 8);

  exactKeys(value.access, ["cost", "account", "note"], `${path}.access`);
  oneOf(value.access.cost, WORLD_COMMONS_ACCESS_COSTS, `${path}.access.cost`);
  oneOf(value.access.account, WORLD_COMMONS_ACCOUNT_TYPES, `${path}.access.account`);
  text(value.access.note, `${path}.access.note`, 12, 700);

  exactKeys(value.reuse, ["status", "license", "note"], `${path}.reuse`);
  oneOf(value.reuse.status, WORLD_COMMONS_REUSE_STATUSES, `${path}.reuse.status`);
  text(value.reuse.license, `${path}.reuse.license`, 2, 300);
  text(value.reuse.note, `${path}.reuse.note`, 12, 700);

  exactKeys(value.automation, ["status", "auth", "limits", "note"], `${path}.automation`);
  oneOf(value.automation.status, WORLD_COMMONS_AUTOMATION_STATUSES, `${path}.automation.status`);
  oneOf(value.automation.auth, WORLD_COMMONS_AUTH_TYPES, `${path}.automation.auth`);
  text(value.automation.limits, `${path}.automation.limits`, 8, 700);
  text(value.automation.note, `${path}.automation.note`, 12, 700);

  exactKeys(value.agent_handoff, ["mode", "url", "instruction"], `${path}.agent_handoff`);
  oneOf(value.agent_handoff.mode, WORLD_COMMONS_HANDOFF_MODES, `${path}.agent_handoff.mode`);
  httpsUrl(value.agent_handoff.url, `${path}.agent_handoff.url`);
  text(value.agent_handoff.instruction, `${path}.agent_handoff.instruction`, 20, 400);
  if (value.automation.status === "human-only" && value.agent_handoff.mode !== "human") {
    fail(`${path}.agent_handoff.mode`, "must be human when automation.status is human-only");
  }

  if (!Array.isArray(value.links) || value.links.length < 1 || value.links.length > 8) fail(`${path}.links`, "must contain 1-8 links");
  const linkKeys = new Set<string>();
  value.links.forEach((link, linkIndex) => {
    const linkPath = `${path}.links[${linkIndex}]`;
    exactKeys(link, ["label", "url", "type"], linkPath);
    text(link.label, `${linkPath}.label`, 2, 120);
    httpsUrl(link.url, `${linkPath}.url`);
    oneOf(link.type, WORLD_COMMONS_LINK_TYPES, `${linkPath}.type`);
    const key = `${link.type}:${link.url}`;
    if (linkKeys.has(key)) fail(`${path}.links`, "must not repeat a type/url pair");
    linkKeys.add(key);
  });
  const handoffLink = value.links.find((link) => record(link) && link.url === value.agent_handoff.url);
  if (!handoffLink) {
    fail(`${path}.agent_handoff.url`, "must exactly reference one published resource link");
  }
  if (value.agent_handoff.mode === "api" && handoffLink.type !== "api") {
    fail(`${path}.agent_handoff.url`, "must reference an api link when mode is api");
  }
  if (value.agent_handoff.mode === "bulk" && handoffLink.type !== "bulk") {
    fail(`${path}.agent_handoff.url`, "must reference a bulk link when mode is bulk");
  }
  text(value.caveat, `${path}.caveat`, 20, 800);
  realDate(value.verified, `${path}.verified`);
  if (value.verified !== verified) fail(`${path}.verified`, "must match the catalog verified date");
}

function validateKit(value: unknown, index: number, ids: Set<string>, resourceIds: Set<string>): void {
  const path = `kits[${index}]`;
  exactKeys(value, ["id", "label", "glyph", "invitation", "keywords", "resource_ids", "boundary", "steps"], path);
  if (typeof value.id !== "string" || !ID.test(value.id) || value.id.length > 64 || ids.has(value.id)) {
    fail(`${path}.id`, "must be unique lowercase kebab-case (1-64 characters)");
  }
  ids.add(value.id);
  text(value.label, `${path}.label`, 2, 160);
  text(value.glyph, `${path}.glyph`, 1, 20);
  text(value.invitation, `${path}.invitation`, 20, 800);
  stringArray(value.keywords, `${path}.keywords`, 2, 24);
  stringArray(value.resource_ids, `${path}.resource_ids`, 1, 12);
  for (const id of value.resource_ids) if (!resourceIds.has(id)) fail(`${path}.resource_ids`, `contains unknown resource reference: ${id}`);
  text(value.boundary, `${path}.boundary`, 20, 800);
  stringArray(value.steps, `${path}.steps`, 1, 8);
}

function validateFoundation(value: unknown, resourceIds: Set<string>, categoryIds: Set<string>, resources: unknown[]): void {
  exactKeys(value, ["meaning", "criteria", "resource_ids"], "foundation");
  text(value.meaning, "foundation.meaning", 30, 1_000);
  stringArray(value.criteria, "foundation.criteria", 3, 12);
  stringArray(value.resource_ids, "foundation.resource_ids", 4, 32);
  for (const id of value.resource_ids) {
    if (!resourceIds.has(id)) fail("foundation.resource_ids", `contains unknown resource reference: ${id}`);
  }
  for (const categoryId of categoryIds) {
    const represented = resources.some((resource) => record(resource) &&
      typeof resource.id === "string" && value.resource_ids.includes(resource.id) &&
      Array.isArray(resource.category_ids) && resource.category_ids.includes(categoryId));
    if (!represented) fail("foundation.resource_ids", `must represent category: ${categoryId}`);
  }
}

export function validateWorldCommons(value: unknown, published = false): asserts value is WorldCommonsSource | PublishedWorldCommons {
  const sourceKeys = ["schema_version", "verified", "canonical_url", "promise", "methodology", "privacy", "foundation", "categories", "kits", "resources"];
  exactKeys(value, published ? [...sourceKeys, "generated"] : sourceKeys, "document");
  if (value.schema_version !== WORLD_COMMONS_SCHEMA) fail("schema_version", `must be ${WORLD_COMMONS_SCHEMA}`);
  if (value.canonical_url !== WORLD_COMMONS_URL) fail("canonical_url", `must be ${WORLD_COMMONS_URL}`);
  realDate(value.verified, "verified");
  text(value.promise, "promise", 20, 1_000);

  exactKeys(value.methodology, ["summary", "classification", "maintenance", "boundary"], "methodology");
  for (const key of ["summary", "classification", "maintenance", "boundary"] as const) {
    text(value.methodology[key], `methodology.${key}`, 20, 1_000);
  }
  exactKeys(value.privacy, ["human_surface", "machine_surface"], "privacy");
  text(value.privacy.human_surface, "privacy.human_surface", 20, 1_000);
  text(value.privacy.machine_surface, "privacy.machine_surface", 20, 1_000);

  if (!Array.isArray(value.categories) || value.categories.length !== WORLD_COMMONS_CATEGORY_IDS.length) {
    fail("categories", `must contain exactly ${WORLD_COMMONS_CATEGORY_IDS.length} categories`);
  }
  value.categories.forEach((category, index) => validateCategory(category, index, WORLD_COMMONS_CATEGORY_IDS[index]!));
  const categoryIds = new Set(WORLD_COMMONS_CATEGORY_IDS);

  if (!Array.isArray(value.resources) || value.resources.length < 8 || value.resources.length > 128) {
    fail("resources", "must contain 8-128 curated resources");
  }
  const resourceIds = new Set<string>();
  value.resources.forEach((resource, index) => validateResource(resource, index, resourceIds, categoryIds, value.verified));
  for (const categoryId of WORLD_COMMONS_CATEGORY_IDS) {
    if (!value.resources.some((resource) => record(resource) && Array.isArray(resource.category_ids) && resource.category_ids.includes(categoryId))) {
      fail("resources", `must represent category: ${categoryId}`);
    }
  }
  validateFoundation(value.foundation, resourceIds, categoryIds, value.resources);

  if (!Array.isArray(value.kits) || value.kits.length < 1 || value.kits.length > 32) fail("kits", "must contain 1-32 practical kits");
  const kitIds = new Set<string>();
  value.kits.forEach((kit, index) => validateKit(kit, index, kitIds, resourceIds));
  if (published) generatedDate(value.generated, "generated");
}

export function publishWorldCommons(source: unknown, generated: string): PublishedWorldCommons {
  validateWorldCommons(source, false);
  generatedDate(generated, "generated");
  return { ...(source as WorldCommonsSource), generated };
}

export function normalizeWorldCommonsText(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function words(value: string, limit = 24): string[] {
  return [...new Set(normalizeWorldCommonsText(value).split(" ")
    .filter((word) => (word.length > 1 || /^\d$/.test(word)) && !STOPWORDS.has(word)))].slice(0, limit);
}

export type WorldCommonsSearchEntry = {
  id: string;
  name: string;
  category_ids: string[];
  normalized_id: string;
  normalized_name: string;
  weights: Array<[term: string, weight: number]>;
};

export function worldCommonsSearchEntry(resource: WorldCommonsResource): WorldCommonsSearchEntry {
  const weights = new Map<string, number>();
  const add = (terms: string[], weight: number) => {
    for (const term of terms) weights.set(term, (weights.get(term) ?? 0) + weight);
  };
  add(words(resource.keywords.join(" "), 96), 16);
  add(words(`${resource.id} ${resource.name} ${resource.provider}`, 96), 11);
  add(words(`${resource.description} ${resource.coverage} ${resource.good_for.join(" ")} ${resource.category_ids.join(" ")}`, 128), 4);
  return {
    id: resource.id,
    name: resource.name,
    category_ids: resource.category_ids,
    normalized_id: normalizeWorldCommonsText(resource.id),
    normalized_name: normalizeWorldCommonsText(resource.name),
    weights: [...weights].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0),
  };
}

export function worldCommonsSearchIndex(source: WorldCommonsSource): WorldCommonsSearchEntry[] {
  return source.resources.map(worldCommonsSearchEntry);
}

export function scoreWorldCommonsSearchEntry(entry: WorldCommonsSearchEntry, query: string): number {
  const normalized = normalizeWorldCommonsText(query);
  const queryWords = new Set(words(query));
  if (!normalized || !queryWords.size) return 0;
  if (normalized === entry.normalized_id) return 2_000;
  if (normalized === entry.normalized_name) return 1_800;
  let score = 0;
  for (const [term, weight] of entry.weights) if (queryWords.has(term)) score += weight;
  return score;
}

export function rankWorldCommonsResources(
  resources: WorldCommonsResource[],
  query: string,
  category?: WorldCommonsCategoryId,
): Array<{ resource: WorldCommonsResource; score: number }> {
  if (!normalizeWorldCommonsText(query) || !words(query).length) return [];
  return resources
    .filter((resource) => !category || resource.category_ids.includes(category))
    .map((resource) => ({ resource, score: scoreWorldCommonsSearchEntry(worldCommonsSearchEntry(resource), query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score ||
      (a.resource.name < b.resource.name ? -1 : a.resource.name > b.resource.name ? 1 :
        a.resource.id < b.resource.id ? -1 : a.resource.id > b.resource.id ? 1 : 0));
}
