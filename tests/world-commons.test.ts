import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS } from "../bin/stage-hub.ts";
import {
  publishWorldCommons,
  rankWorldCommonsResources,
  WORLD_COMMONS_STOPWORDS,
  worldCommonsSearchIndex,
  type WorldCommonsSource,
} from "../bin/world-commons.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const source = json("data/world-commons.json") as WorldCommonsSource;

const SCHEMA = "thekingdom.world-commons/0.1";
const CANONICAL_URL = "https://thekingdom.dev/commons.json";
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORY_IDS = [
  "knowledge", "learning", "earth", "public-life", "rights", "resilience", "security", "culture",
];
const ACCESS_COSTS = ["free", "free-tier", "local-costs"];
const ACCOUNT_TYPES = ["none", "free-account", "varies", "contact"];
const REUSE_STATUSES = ["open", "mixed", "public-access", "noncommercial"];
const AUTOMATION_STATUSES = ["supported", "limited", "human-only", "bulk-preferred", "local"];
const AUTH_TYPES = ["none", "free-key", "varies", "contact", "not-applicable"];
const LINK_TYPES = ["start", "api", "bulk", "terms", "docs"];

function exactKeys(value: Record<string, unknown>, keys: string[]): void {
  expect(Object.keys(value).sort()).toEqual([...keys].sort());
}

function nonempty(value: unknown, minimum = 1): void {
  expect(typeof value).toBe("string");
  expect((value as string).trim().length).toBeGreaterThanOrEqual(minimum);
}

function uniqueStrings(value: unknown[], minimum = 1): void {
  expect(Array.isArray(value)).toBe(true);
  expect(value.length).toBeGreaterThanOrEqual(minimum);
  expect(new Set(value).size).toBe(value.length);
  for (const item of value) nonempty(item);
}

function realIsoDate(value: unknown): void {
  expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  expect(Number.isNaN(parsed.getTime())).toBe(false);
  expect(parsed.toISOString().slice(0, 10)).toBe(value);
}

function generatedDate(value: unknown): void {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    realIsoDate(value);
    return;
  }
  expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
  expect(Number.isNaN(Date.parse(value as string))).toBe(false);
}

function credentialFreeHttps(value: string): void {
  const url = new URL(value);
  expect(url.protocol).toBe("https:");
  expect(url.username).toBe("");
  expect(url.password).toBe("");
  expect(url.hostname.length).toBeGreaterThan(0);
}

function htmlHref(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function isSafeExternalAnchor(tag: string): boolean {
  const rel = tag.match(/\brel="([^"]*)"/)?.[1]?.split(/\s+/) ?? [];
  return tag.includes('target="_blank"') && rel.includes("noopener");
}

describe("World Commons source contract", () => {
  test("keeps the stable document shape and all eight ordered categories", () => {
    exactKeys(source, [
      "schema_version", "verified", "canonical_url", "promise", "methodology", "privacy",
      "foundation", "categories", "kits", "resources",
    ]);
    expect(source.schema_version).toBe(SCHEMA);
    expect(source.canonical_url).toBe(CANONICAL_URL);
    nonempty(source.promise, 20);

    exactKeys(source.methodology, ["summary", "classification", "maintenance", "boundary"]);
    for (const statement of Object.values(source.methodology)) nonempty(statement, 20);
    exactKeys(source.privacy, ["human_surface", "machine_surface"]);
    nonempty(source.privacy.human_surface, 20);
    nonempty(source.privacy.machine_surface, 20);

    expect(source.categories.map(({ id }: { id: string }) => id)).toEqual(CATEGORY_IDS);
    for (const category of source.categories) {
      exactKeys(category, ["id", "label", "glyph", "description"]);
      expect(category.id).toMatch(ID);
      nonempty(category.label, 2);
      nonempty(category.glyph);
      nonempty(category.description, 12);
    }
  });

  test("keeps unique resources with complete category references and bounded descriptive fields", () => {
    expect(source.resources.length).toBeGreaterThanOrEqual(CATEGORY_IDS.length * 3);
    const resourceIds = source.resources.map(({ id }: { id: string }) => id);
    expect(new Set(resourceIds).size).toBe(resourceIds.length);
    const represented = new Set<string>();

    for (const resource of source.resources) {
      exactKeys(resource, [
        "id", "name", "provider", "category_ids", "description", "good_for", "coverage", "keywords",
        "audiences", "access", "reuse", "automation", "links", "caveat", "verified",
      ]);
      expect(resource.id).toMatch(ID);
      expect(resource.id.length).toBeLessThanOrEqual(64);
      nonempty(resource.name, 2);
      nonempty(resource.provider, 2);
      nonempty(resource.description, 20);
      nonempty(resource.coverage, 12);
      uniqueStrings(resource.category_ids);
      uniqueStrings(resource.good_for);
      uniqueStrings(resource.keywords, 2);
      uniqueStrings(resource.audiences);
      for (const categoryId of resource.category_ids) {
        expect(CATEGORY_IDS).toContain(categoryId);
        represented.add(categoryId);
      }
    }

    expect(represented).toEqual(new Set(CATEGORY_IDS));
  });

  test("states access, account, reuse, automation limits, privacy, and safety separately", () => {
    nonempty(source.privacy.human_surface, 20);
    nonempty(source.privacy.machine_surface, 20);

    for (const resource of source.resources) {
      exactKeys(resource.access, ["cost", "account", "note"]);
      expect(ACCESS_COSTS).toContain(resource.access.cost);
      expect(ACCOUNT_TYPES).toContain(resource.access.account);
      nonempty(resource.access.note, 12);

      exactKeys(resource.reuse, ["status", "license", "note"]);
      expect(REUSE_STATUSES).toContain(resource.reuse.status);
      nonempty(resource.reuse.license, 2);
      nonempty(resource.reuse.note, 12);

      exactKeys(resource.automation, ["status", "auth", "limits", "note"]);
      expect(AUTOMATION_STATUSES).toContain(resource.automation.status);
      expect(AUTH_TYPES).toContain(resource.automation.auth);
      nonempty(resource.automation.limits, 8);
      nonempty(resource.automation.note, 12);
      nonempty(resource.caveat, 20);
    }

    expect(new Set(source.resources.map(({ reuse }: any) => reuse.status))).toEqual(new Set(REUSE_STATUSES));
  });

  test("uses aligned real review dates and only credential-free HTTPS links", () => {
    realIsoDate(source.verified);
    credentialFreeHttps(source.canonical_url);

    for (const resource of source.resources) {
      realIsoDate(resource.verified);
      expect(resource.verified).toBe(source.verified);
      expect(resource.links.length).toBeGreaterThan(0);
      expect(resource.links.length).toBeLessThanOrEqual(8);
      const seen = new Set<string>();
      for (const link of resource.links) {
        exactKeys(link, ["label", "url", "type"]);
        nonempty(link.label, 2);
        expect(LINK_TYPES).toContain(link.type);
        credentialFreeHttps(link.url);
        const key = `${link.type}:${link.url}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  test("foundation and practical-kit references stay unique, valid, and broad", () => {
    const resources = new Map<string, any>(source.resources.map((resource: any) => [resource.id, resource]));
    exactKeys(source.foundation, ["meaning", "criteria", "resource_ids"]);
    nonempty(source.foundation.meaning, 30);
    uniqueStrings(source.foundation.criteria, 3);
    uniqueStrings(source.foundation.resource_ids, CATEGORY_IDS.length);
    expect(source.foundation.meaning.toLowerCase()).toContain("not an objective ranking");

    const foundationCategories = new Set<string>();
    for (const id of source.foundation.resource_ids) {
      expect(resources.has(id)).toBe(true);
      for (const categoryId of resources.get(id)!.category_ids) foundationCategories.add(categoryId);
    }
    expect(foundationCategories).toEqual(new Set(CATEGORY_IDS));

    expect(source.kits.length).toBeGreaterThanOrEqual(CATEGORY_IDS.length);
    const kitIds = source.kits.map(({ id }: { id: string }) => id);
    expect(new Set(kitIds).size).toBe(kitIds.length);
    for (const kit of source.kits) {
      exactKeys(kit, ["id", "label", "glyph", "invitation", "keywords", "resource_ids", "boundary", "steps"]);
      expect(kit.id).toMatch(ID);
      nonempty(kit.label, 2);
      nonempty(kit.glyph);
      nonempty(kit.invitation, 20);
      nonempty(kit.boundary, 20);
      uniqueStrings(kit.keywords, 2);
      uniqueStrings(kit.resource_ids);
      uniqueStrings(kit.steps);
      for (const id of kit.resource_ids) expect(resources.has(id)).toBe(true);
    }
  });
});

describe("World Commons publication and human surface", () => {
  test("keeps the generated inline runtime syntactically valid", () => {
    const html = read("site/hub.html");
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(([, script]) => script);

    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) expect(() => new Function(script)).not.toThrow();
  });

  test("publishes the source exactly and adds only a generated date", () => {
    const published = json("site/commons.json");
    const { generated, ...mirrored } = published;

    exactKeys(published, [...Object.keys(source), "generated"]);
    generatedDate(generated);
    expect(mirrored).toEqual(source);
    expect(() => publishWorldCommons(source, "not-a-date")).toThrow("generated");
    expect(() => publishWorldCommons(source, "2026-02-30T12:00:00Z")).toThrow("generated");
  });

  test("renders every resource and every outbound resource link with noopener", () => {
    const html = read("site/hub.html");
    const anchors = [...html.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag);

    expect(html.includes('id="commons"')).toBe(true);
    for (const resource of source.resources) {
      expect(html.includes(`id="commons-resource-${resource.id}"`)).toBe(true);
      expect(html.includes(`data-commons-resource="${resource.id}"`)).toBe(true);
      for (const link of resource.links) {
        const href = `href="${htmlHref(link.url)}"`;
        const matching = anchors.filter((tag) => tag.includes(href));
        expect(matching.length).toBeGreaterThan(0);
        expect(matching.every(isSafeExternalAnchor)).toBe(true);
      }
    }

    for (const kit of source.kits) {
      expect(html.includes(`data-commons-kit-card="${kit.id}"`)).toBe(true);
      for (const resourceId of kit.resource_ids) {
        expect(html.includes(`href="#commons-resource-${resourceId}"`)).toBe(true);
      }
    }
  });

  test("keeps search and filters local, ephemeral, legible, and non-profiling", () => {
    const html = read("site/hub.html");
    const script = html.slice(html.indexOf("<script>"), html.lastIndexOf("</script>"));
    const start = script.indexOf("// ── World Commons:");
    const end = script.indexOf("const cv=", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const commonsCode = script.slice(start, end);

    for (const forbidden of [
      "fetch(", "XMLHttpRequest", "sendBeacon", "localStorage", "sessionStorage", "indexedDB",
      "document.cookie", "location.", "history.",
    ]) {
      expect(commonsCode.includes(forbidden)).toBe(false);
    }
    expect(html.includes('<form class="commonsform" id="commonsform" action="#commons" method="get">')).toBe(true);
    const input = html.match(/<input\s+[^>]*id="commonsquery"[^>]*>/)?.[0] ?? "";
    expect(input).not.toMatch(/\sname\s*=/i);
    expect(input).toContain('autocomplete="off"');
    expect(html.includes('id="commonsstatus" role="status" aria-live="polite"')).toBe(true);
    expect(html.includes(htmlHref(source.privacy.human_surface))).toBe(true);
    expect(commonsCode).toContain("Nothing was guessed");
    expect(commonsCode).toContain("new URL(document.URL).hash");

    const dataStart = html.indexOf("const DATA=") + "const DATA=".length;
    const dataEnd = html.indexOf(";\n", dataStart);
    const pageData = JSON.parse(html.slice(dataStart, dataEnd));
    expect(pageData.commons).toEqual(worldCommonsSearchIndex(source));
    expect(pageData.commonsStopwords).toEqual(WORLD_COMMONS_STOPWORDS);
    expect(commonsCode).toContain("for(const [term,weight] of item.weights)");
    expect(commonsCode).toContain("normal===item.normalized_name");
    expect(commonsCode).toContain("card.style.order=rank.has(id)");
  });
});

describe("World Commons local matching", () => {
  test("shares one deterministic weighted index with the browser and refuses empty inference", () => {
    const ids = (query: string, category?: any) =>
      rankWorldCommonsResources(source.resources, query, category).map(({ resource }) => resource.id);
    expect(ids("knowledge graph")[0]).toBe("wikidata");
    expect(ids("earthquake emergency")[0]).toBe("usgs-earthquakes");
    expect(ids("textbook accounting", "learning")[0]).toBe("openstax");
    expect(ids("labour convention", "rights")).toContain("ilo-normlex");
    expect(ids("OSV")[0]).toBe("osv");
    expect(ids("textbook", "security")).toEqual([]);
    expect(ids("quasar upholstery")).toEqual([]);
    expect(ids("the and please")).toEqual([]);
  });
});

describe("World Commons machine discovery", () => {
  test("advertises and stages the canonical catalog everywhere agents arrive", () => {
    const html = read("site/hub.html");
    expect(html.includes('<link rel="alternate" href="/commons.json" type="application/json" title="World Commons">')).toBe(true);
    expect(html.includes('<a href="/commons.json">commons.json — reviewed public resources</a>')).toBe(true);
    expect(new Set(HUB_ASSETS.map(({ destination }) => destination))).toContain("commons.json");

    const kingdom = json("site/kingdom.json");
    expect(kingdom.world_commons).toMatchObject({
      url: CANONICAL_URL,
      resources: source.resources.length,
      foundation: source.foundation.resource_ids.length,
      categories: CATEGORY_IDS.length,
      kits: source.kits.length,
      verified: source.verified,
      verified_on: source.verified,
    });
    const guest = json("site/guest.json");
    expect(guest.next_actions.some(({ url }: { url?: string }) => url === CANONICAL_URL)).toBe(true);
    const manifest = json("site/.well-known/agent.json");
    expect(manifest.world_commons).toBe(CANONICAL_URL);
    expect(manifest.entry_points.public_resources).toBe(CANONICAL_URL);
    expect(read("site/llms.txt")).toContain(CANONICAL_URL);
  });
});
