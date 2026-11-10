import catalog from "../data/public-modules.json";
import { types } from "node:util";

export type PublicModuleGroupId = "find" | "make" | "research" | "reference";
export type PublicModuleBehavior = "browser-local" | "runtime-gated" | "static-reference" | "snapshot" | "discovery" | "external-service";
export type PublicModuleLink = {
  audience: "human" | "agent";
  label: string;
  url: string;
  format: "text/html" | "application/json" | "text/markdown" | "text/plain" | "application/mcp";
};
export type PublicModuleGroup = { id: PublicModuleGroupId; label: string; purpose: string };
export type PublicModule = {
  id: string;
  label: string;
  purpose: string;
  group: PublicModuleGroupId;
  tags: string[];
  behavior: PublicModuleBehavior;
  status_note: string;
  links: PublicModuleLink[];
  /** Navigation companions only, never dependencies, equivalences, or authority. */
  related_ids: string[];
};
export type PublicModuleCatalog = {
  protocol: "kingdom.public-modules/0.1";
  purpose: string;
  scope: string;
  groups: PublicModuleGroup[];
  modules: PublicModule[];
};

export const PUBLIC_MODULE_CATALOG: PublicModuleCatalog = catalog as PublicModuleCatalog;
export const PUBLIC_MODULE_CATALOG_MAX_BYTES = 30_000;
export const PUBLIC_MODULE_DIRECTORY_MAX_BYTES = 100_000;

// Deliberately independent of authored data: new destinations require a source-route
// review here. Exact strings reject URL normalization, queries, credentials, private
// paths, arbitrary hosts, assets, and individual research-family payloads.
const PUBLIC_LINK_FORMATS = new Map<string, PublicModuleLink["format"]>([
  ...["/atlas.html", "/atlas.html#wayfinder", "/atlas.html#commons", "/atlas.html#rights",
    "/workshop/", "/meet/", "/citizens/", "/join/", "/contact/", "/observatory/",
    "/trial-chamber/", "/government-engine/", "/power-atlas/", "/shape-resonance/", "/os/",
  ].map((path): [string, "text/html"] => [`https://thekingdom.dev${path}`, "text/html"]),
  ...["/wayfinder.json", "/commons.json", "/contact.json", "/research.json", "/trials.json",
    "/government.json", "/shape-resonance.json", "/rights.json", "/agent-entry.json",
    "/guest.json", "/.well-known/agent.json",
  ].map((path): [string, "application/json"] => [`https://thekingdom.dev${path}`, "application/json"]),
  ["https://thekingdom.dev/CIVIC-v0.1.md", "text/markdown"],
  ["https://thekingdom.dev/RIGHTS.md", "text/markdown"],
  ["https://thekingdom.dev/llms.txt", "text/plain"],
  ["https://mcp.thekingdom.dev/mcp", "application/mcp"],
]);

/** Structural navigation validation only; never fetches a URL or proves availability. */
export function validateModuleCatalog(value: unknown): string[] {
  const issues: string[] = [];
  function record(value: unknown, keys: string[], path: string): value is Record<string, unknown> {
    if (!value || typeof value !== "object" || types.isProxy(value) || Array.isArray(value) ||
        (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) ||
        Reflect.ownKeys(value).length !== keys.length || keys.some((key) => {
          const property = Object.getOwnPropertyDescriptor(value, key);
          return !property?.enumerable || !("value" in property);
        })) {
      issues.push(`${path}: expected a closed record with keys ${keys.join(", ")}`);
      return false;
    }
    return true;
  }
  function list(value: unknown, path: string, min: number, max: number): unknown[] {
    if (types.isProxy(value) || !Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype ||
        value.length < min || value.length > max || Reflect.ownKeys(value).length !== value.length + 1 ||
        Array.from({ length: value.length }, (_, i) => Object.getOwnPropertyDescriptor(value, String(i)))
          .some((property) => !property?.enumerable || !("value" in property))) {
      issues.push(`${path}: expected a dense, own-data array of ${min}–${max} entries`);
      return [];
    }
    return value;
  }
  function text(value: unknown, path: string, max: number): value is string {
    if (typeof value !== "string" || !value.length || value.length > max || value.trim() !== value ||
        /[\u0000-\u001f\u007f-\u009f]/.test(value)) {
      issues.push(`${path}: expected 1–${max} characters without surrounding whitespace or controls`);
      return false;
    }
    return true;
  }
  function choice(value: unknown, allowed: readonly string[], path: string): void {
    if (typeof value !== "string" || !allowed.includes(value)) issues.push(`${path}: unsupported value`);
  }
  function id(value: unknown, path: string): value is string {
    if (!text(value, path, 64)) return false;
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value)) { issues.push(`${path}: expected a lowercase kebab-case identifier`); return false; }
    return true;
  }
  function unique(values: unknown[], path: string): void {
    if (new Set(values).size !== values.length) issues.push(`${path}: duplicate entries`);
  }
  if (!record(value, ["protocol", "purpose", "scope", "groups", "modules"], "catalog")) return issues;
  const groupIds = new Set<string>();
  const moduleIds = new Set<string>();
  const relations: Array<{ source: unknown; target: string; path: string }> = [];
  if (value.protocol !== "kingdom.public-modules/0.1") issues.push("catalog.protocol: unsupported protocol");
  text(value.purpose, "catalog.purpose", 320);
  text(value.scope, "catalog.scope", 512);
  list(value.groups, "catalog.groups", 4, 4).forEach((group, i) => {
    const path = `catalog.groups[${i}]`;
    if (!record(group, ["id", "label", "purpose"], path)) return;
    choice(group.id, ["find", "make", "research", "reference"], `${path}.id`);
    if (id(group.id, `${path}.id`)) {
      if (groupIds.has(group.id)) issues.push(`${path}.id: duplicate group`);
      groupIds.add(group.id);
    }
    text(group.label, `${path}.label`, 120);
    text(group.purpose, `${path}.purpose`, 320);
  });
  list(value.modules, "catalog.modules", 1, 20).forEach((module, i) => {
    const path = `catalog.modules[${i}]`;
    if (!record(module, ["id", "label", "purpose", "group", "tags", "behavior", "status_note", "links", "related_ids"], path)) return;
    if (id(module.id, `${path}.id`)) {
      if (moduleIds.has(module.id)) issues.push(`${path}.id: duplicate module`);
      moduleIds.add(module.id);
    }
    if (typeof module.group !== "string" || !groupIds.has(module.group)) issues.push(`${path}.group: unknown group`);
    text(module.label, `${path}.label`, 120);
    text(module.purpose, `${path}.purpose`, 320);
    text(module.status_note, `${path}.status_note`, 320);
    choice(module.behavior, ["browser-local", "runtime-gated", "static-reference", "snapshot", "discovery", "external-service"], `${path}.behavior`);
    const tags = list(module.tags, `${path}.tags`, 1, 8);
    unique(tags, `${path}.tags`);
    tags.forEach((tag, j) => text(tag, `${path}.tags[${j}]`, 48));
    const related = list(module.related_ids, `${path}.related_ids`, 0, 6);
    unique(related, `${path}.related_ids`);
    related.forEach((target, j) => {
      const relationPath = `${path}.related_ids[${j}]`;
      if (id(target, relationPath)) relations.push({ source: module.id, target, path: relationPath });
    });
    const linkIds: string[] = [];
    list(module.links, `${path}.links`, 1, 6).forEach((link, j) => {
      const linkPath = `${path}.links[${j}]`;
      if (!record(link, ["audience", "label", "url", "format"], linkPath)) return;
      text(link.label, `${linkPath}.label`, 120);
      if (text(link.url, `${linkPath}.url`, 256)) {
        const format = PUBLIC_LINK_FORMATS.get(link.url);
        if (!format) issues.push(`${linkPath}.url: not an exact allowed public entrypoint`);
        else if (link.format !== format) issues.push(`${linkPath}.format: does not match the public route`);
      }
      choice(link.audience, ["human", "agent"], `${linkPath}.audience`);
      choice(link.format, ["text/html", "application/json", "text/markdown", "text/plain", "application/mcp"], `${linkPath}.format`);
      if (typeof link.audience === "string" && typeof link.url === "string") linkIds.push(`${link.audience}\0${link.url}`);
    });
    unique(linkIds, `${path}.links`);
  });
  for (const { source, target, path } of relations) {
    if (target === source) issues.push(`${path}: self relation`);
    if (!moduleIds.has(target)) issues.push(`${path}: unknown module`);
  }
  if (!issues.length && Buffer.byteLength(catalogJson(value as PublicModuleCatalog), "utf8") >= PUBLIC_MODULE_CATALOG_MAX_BYTES) {
    issues.push("catalog: exceeds the public JSON byte budget (must be under 30000 bytes)");
  }
  return issues;
}

// Fixed field order; authored array order remains meaningful navigation order.
function catalogJson(value: PublicModuleCatalog): string {
  return JSON.stringify({
    protocol: value.protocol, purpose: value.purpose, scope: value.scope,
    groups: value.groups.map(({ id, label, purpose }) => ({ id, label, purpose })),
    modules: value.modules.map(({ id, label, purpose, group, tags, behavior, status_note, links, related_ids }) => ({
      id, label, purpose, group, tags, behavior, status_note,
      links: links.map(({ audience, label, url, format }) => ({ audience, label, url, format })),
      related_ids,
    })),
  }, null, 2) + "\n";
}

function assertCatalog(value: unknown): asserts value is PublicModuleCatalog {
  const issues = validateModuleCatalog(value);
  if (issues.length) throw new Error(`Invalid public module catalog:\n${issues.join("\n")}`);
}

export function renderModuleCatalog(value: PublicModuleCatalog = PUBLIC_MODULE_CATALOG): string {
  assertCatalog(value);
  return catalogJson(value);
}

const BEHAVIOR_LABELS: Record<PublicModuleBehavior, string> = {
  "browser-local": "In your browser",
  "runtime-gated": "Requires service",
  "static-reference": "Static reference",
  snapshot: "Snapshot",
  discovery: "Discovery",
  "external-service": "External service",
};
const LINK_FORMAT_LABELS: Record<PublicModuleLink["format"], string> = {
  "text/html": "", "application/json": "JSON", "text/markdown": "Markdown",
  "text/plain": "Text", "application/mcp": "MCP",
};
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g,
  (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

/** Complete static markup: no client payload, request, storage, or service invocation. */
export function renderModuleDirectory(value: PublicModuleCatalog = PUBLIC_MODULE_CATALOG): string {
  assertCatalog(value);
  const esc = escapeHtml;
  const byId = new Map(value.modules.map((module) => [module.id, module]));
  // The colon separates heading IDs from the hyphen-only module-ID namespace.
  const card = (module: PublicModule): string => `<article id="civic-module-${esc(module.id)}" class="module-card" aria-labelledby="civic-module-label:${esc(module.id)}">
  <h4 id="civic-module-label:${esc(module.id)}">${esc(module.label)}</h4>
  <p>${esc(module.purpose)}</p>
  <ul class="module-links" aria-label="Entry links">${module.links.filter((link, index, links) => links.findIndex((other) => other.url === link.url) === index).map((link) => {
    const format = LINK_FORMAT_LABELS[link.format];
    const label = link.label + (format && !link.label.endsWith(format) ? ` (${format})` : "");
    return `<li><a href="${esc(link.url)}" type="${esc(link.format)}">${esc(label)}</a></li>`;
  }).join("")}</ul>
  <p class="module-status"><strong>${esc(BEHAVIOR_LABELS[module.behavior])}</strong> · ${esc(module.status_note)}</p>
  ${module.related_ids.length ? `<details class="module-related"><summary>Related reading</summary><nav class="module-links" aria-label="Related entries"><ul>${module.related_ids.map((id) => `<li><a href="#civic-module-${esc(id)}">${esc(byId.get(id)!.label)}</a></li>`).join("")}</ul></nav></details>` : ""}
</article>`;
  const html = `<section id="civic-modules" class="module-directory" aria-labelledby="civic-modules-title">
  <h2 id="civic-modules-title">Modules</h2>
  <p>${esc(value.purpose)}</p>
  <p class="module-links"><a href="/modules.json" type="application/json">Module catalogue (JSON)</a></p>
  <p class="module-status">Links do not grant permission or verify availability. Related reading does not imply integration.</p>
  ${value.groups.map((group) => `<details class="module-group" open>
    <summary><h3 id="civic-modules-group-${esc(group.id)}">${esc(group.label)}</h3></summary>
    <p>${esc(group.purpose)}</p>
    <div class="module-grid">${value.modules.filter((module) => module.group === group.id).map(card).join("\n")}</div>
  </details>`).join("\n")}
</section>`;
  if (Buffer.byteLength(html, "utf8") >= PUBLIC_MODULE_DIRECTORY_MAX_BYTES) {
    throw new Error("Public module directory exceeds its HTML byte budget (must be under 100000 bytes)");
  }
  return html;
}
