import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import * as modules from "../bin/public-modules";

const { PUBLIC_MODULE_CATALOG, renderModuleCatalog } = modules;
const copy = () => structuredClone(PUBLIC_MODULE_CATALOG);
function rejectAt(path: string, values: unknown[]): void {
  for (const value of values) {
    const invalid = copy();
    const parts = path.split(".");
    let target: any = invalid;
    for (const part of parts.slice(0, -1)) target = target[part];
    target[parts.at(-1)!] = value;
    expect(modules.validateModuleCatalog(invalid).length, `${path}: ${String(value).slice(0, 80)}`).toBeGreaterThan(0);
  }
}

const root = new URL("../", import.meta.url);
const expectedIds = [
  "wayfinder", "world-commons", "commons-mcp", "workshop", "civic", "contact",
  "research-library", "observatory", "trial-chamber", "government-engine",
  "power-atlas", "shape-resonance", "system-console", "rights", "agent-entry", "full-references",
];

test("renders the authored, lean public entrypoint catalogue as bounded JSON", () => {
  const source = JSON.parse(readFileSync(new URL("data/public-modules.json", root), "utf8"));
  const body = renderModuleCatalog();
  expect(JSON.parse(body)).toEqual(source);
  expect(PUBLIC_MODULE_CATALOG).toEqual(source);
  expect(source.protocol).toBe("kingdom.public-modules/0.1");
  expect(source.groups.map(({ id, label }: { id: string; label: string }) => [id, label])).toEqual([
    ["find", "Find tools & resources"], ["make", "Make & connect"],
    ["research", "Research & design"], ["reference", "Protocols & system references"],
  ]);
  expect(source.modules.map(({ id }: { id: string }) => id)).toEqual(expectedIds);
  expect(Buffer.byteLength(body, "utf8")).toBeLessThan(30_000);
  expect(body.endsWith("\n")).toBe(true);
  expect(renderModuleCatalog()).toBe(body);
  expect(body).not.toMatch(/(?:\/Users\/|\/home\/|github\.com|codeberg\.org|roster\.conf|graph\.json|CATALOG\.md|telemetry|"(?:live|healthy|dependencies|authority|actions)"\s*:)/);
});

test("validation rejects non-records and closes every public object shape", () => {
  expect(modules.validateModuleCatalog).toBeFunction();
  const validate = modules.validateModuleCatalog;
  expect(validate(copy())).toEqual([]);
  for (const value of [null, undefined, true, 7, "catalog", [], {}, { ...copy(), protocol: "kingdom.public-modules/0.2" }]) {
    expect(validate(value).length).toBeGreaterThan(0);
  }
  const records = [
    (c: any) => c,
    (c: any) => c.groups[0],
    (c: any) => c.modules[0],
    (c: any) => c.modules[0].links[0],
  ];
  for (const record of records) {
    const unknown = copy();
    record(unknown).private = "not public";
    expect(validate(unknown).length).toBeGreaterThan(0);
    for (const key of Object.keys(record(copy()))) {
      const missing = copy();
      delete record(missing)[key];
      expect(validate(missing).length).toBeGreaterThan(0);
    }
  }
  for (const mutate of [
    (c: any) => { c.groups = null; },
    (c: any) => { c.groups[0] = null; },
    (c: any) => { c.modules = {}; },
    (c: any) => { c.modules[0] = []; },
    (c: any) => { c.modules[0].links = null; },
    (c: any) => { c.modules[0].links[0] = false; },
    (c: any) => { c.modules[0].tags = "tools"; },
    (c: any) => { c.modules[0].related_ids = {}; },
  ]) {
    const invalid = copy();
    mutate(invalid);
    expect(validate(invalid).length).toBeGreaterThan(0);
  }
});

test("validation bounds textual fields, arrays, and presentation enums", () => {
  for (const [path, max] of [
    ["purpose", 320], ["scope", 512], ["groups.0.label", 120], ["groups.0.purpose", 320],
    ["modules.0.label", 120], ["modules.0.purpose", 320], ["modules.0.status_note", 320],
    ["modules.0.tags.0", 48], ["modules.0.links.0.label", 120], ["modules.0.links.0.url", 256],
  ] as const) {
    rejectAt(path, [null, 5, {}, [], "", "   ", " padded", "padded ", "a\nb", "a\u0000b", "a\u007fb", "a\u0085b", "x".repeat(max + 1)]);
  }
  rejectAt("groups", [[], Array(5).fill(copy().groups[0])]);
  rejectAt("modules", [[], Array(21).fill(copy().modules[0])]);
  rejectAt("modules.0.tags", [[], Array(9).fill("tag")]);
  rejectAt("modules.0.links", [[], Array(7).fill(copy().modules[0].links[0])]);
  rejectAt("modules.0.related_ids", [Array(7).fill("rights")]);
  rejectAt("modules.0.behavior", [null, "live", "static", "Browser-local", "browser-local "]);
  rejectAt("modules.0.links.0.audience", [null, "all", "Human", "human "]);
  rejectAt("modules.0.links.0.format", [null, "html", "application/javascript", "TEXT/HTML"]);
  for (const behavior of ["browser-local", "runtime-gated", "static-reference", "snapshot", "discovery", "external-service"] as const) {
    const valid = copy(); valid.modules[0].behavior = behavior;
    expect(modules.validateModuleCatalog(valid)).toEqual([]);
  }
});

test("validation keeps identifiers and navigation relations closed and unique", () => {
  expect(Object.fromEntries(copy().modules.map((m) => [m.id, [m.group, m.related_ids]]))).toEqual({
    wayfinder: ["find", ["world-commons", "workshop"]],
    "world-commons": ["find", ["wayfinder", "commons-mcp"]],
    "commons-mcp": ["find", ["world-commons", "agent-entry"]],
    workshop: ["make", ["wayfinder", "civic"]],
    civic: ["make", ["contact", "rights", "workshop"]],
    contact: ["make", ["civic", "rights"]],
    "research-library": ["research", ["observatory", "government-engine", "shape-resonance"]],
    observatory: ["research", ["research-library", "trial-chamber"]],
    "trial-chamber": ["research", ["observatory", "research-library"]],
    "government-engine": ["research", ["power-atlas", "research-library"]],
    "power-atlas": ["research", ["government-engine", "rights"]],
    "shape-resonance": ["research", ["research-library", "workshop"]],
    "system-console": ["reference", ["agent-entry", "full-references"]],
    rights: ["reference", ["civic", "contact"]],
    "agent-entry": ["reference", ["full-references", "commons-mcp", "rights"]],
    "full-references": ["reference", ["agent-entry", "research-library", "rights"]],
  });
  const invalidIds = [null, 8, "", "Wayfinder", "a_b", "a--b", "a-", "-a", "2a", "a b", "rights ", "x".repeat(65), '<a id="bad">'];
  rejectAt("modules.0.id", invalidIds);
  rejectAt("groups.0.id", [...invalidIds, "other", "make"]);
  rejectAt("modules.0.group", [...invalidIds, "other"]);
  rejectAt("modules.0.related_ids.0", [...invalidIds, "absent", "wayfinder"]);
  rejectAt("modules.0.id", ["rights"]);
  rejectAt("modules.0.related_ids", [["rights", "rights"]]);
  rejectAt("modules.0.tags", [["tools", "tools"]]);
  rejectAt("modules.0.links", [[copy().modules[0].links[0], copy().modules[0].links[0]]]);
  const directed = copy();
  directed.modules[0].related_ids = [];
  expect(modules.validateModuleCatalog(directed)).toEqual([]); // Navigation need not be reciprocal.
});

test("links admit only exact public entrypoint URLs with their declared formats", () => {
  const invalidUrls = [
    "javascript:alert(1)", "data:text/html,hello", "http://thekingdom.dev/atlas.html", "/atlas.html",
    "https://evil.example/", "https://thekingdom.dev.evil.example/atlas.html", "https://evil.thekingdom.dev/atlas.html",
    "https://thekingdom.dev@evil.example/atlas.html", "https://user:secret@thekingdom.dev/atlas.html",
    "https://thekingdom.dev:443/atlas.html", "https://thekingdom.dev:8443/atlas.html",
    "https://THEKINGDOM.dev/atlas.html", "HTTPS://thekingdom.dev/atlas.html", "https://thekingdom.dev./atlas.html",
    " https://thekingdom.dev/atlas.html", "https://thekingdom.dev/atlas.html ",
    "https://thekingdom.dev/atlas.html?secret=value", "https://thekingdom.dev/atlas.html?",
    "https://thekingdom.dev/atlas.html#private", "https://thekingdom.dev/atlas.html#wayfinder?token=x",
    "https://thekingdom.dev/atlas.html\n", "https://thekingdom.dev/atlas.html%0a", "https://thekingdom.dev/atlas.html%00",
    "https://thekingdom.dev/%61tlas.html", "https://thekingdom.dev/private/../atlas.html", "https://thekingdom.dev//atlas.html",
    "https://thekingdom.dev\\atlas.html", "https://thekingdom.dev/private/secrets.json", "https://thekingdom.dev/operations/",
    "https://thekingdom.dev/DOMAINS-SETUP.md", "https://thekingdom.dev/CATALOG.md", "https://thekingdom.dev/roster.conf",
    "https://thekingdom.dev/publications/hub-staging.v1.json", "https://thekingdom.dev/graph.json",
    "https://thekingdom.dev/atlases/freedom-loop-lock-key-2026-08-27.json",
    "https://thekingdom.dev/transformation-engine/", "https://thekingdom.dev/evaluation-covenant/",
    "https://mcp.thekingdom.dev/", "https://mcp.thekingdom.dev/mcp/", "https://mcp.thekingdom.dev/mcp?x=1",
    "https://mcp.thekingdom.dev/mcp#x", "https://mcp.thekingdom.dev/private",
  ];
  rejectAt("modules.0.links.0.url", invalidUrls);
  rejectAt("modules.0.links.0.format", ["application/json", "application/mcp"]);
  const catalogue = copy();
  expect(modules.validateModuleCatalog(catalogue)).toEqual([]);
  const staging = JSON.parse(readFileSync(new URL("publications/hub-staging.v1.json", root), "utf8"));
  const sources = new Map<string, string>(staging.assets.map((asset: { destination: string; source: string }) => [asset.destination, asset.source]));
  for (const link of catalogue.modules.flatMap((m) => m.links)) {
    const url = new URL(link.url);
    if (url.hostname !== "thekingdom.dev") { expect(url.href).toBe("https://mcp.thekingdom.dev/mcp"); continue; }
    const destination = url.pathname.slice(1) + (url.pathname.endsWith("/") ? "index.html" : "");
    expect(sources.has(destination), `${link.label} must be staged: ${destination}`).toBe(true);
    const content = readFileSync(new URL(sources.get(destination)!, root), "utf8");
    expect(content.length).toBeGreaterThan(0);
    if (url.hash) expect(content).toContain(`id="${url.hash.slice(1)}"`);
  }
  expect(catalogue.modules.find((m) => m.id === "research-library")!.links.map((l) => l.url)).toEqual([
    "https://thekingdom.dev/atlas.html", "https://thekingdom.dev/atlas.html",
  ]);
});

test("JSON rendering validates before emitting deterministic bytes within the aggregate budget", () => {
  const invalid = copy() as any;
  invalid.modules[0].hidden_action = "never publish";
  expect(() => renderModuleCatalog(invalid)).toThrow(/catalog/i);
  expect(() => renderModuleCatalog(null as any)).toThrow(/catalog/i);
  function reversed(value: any): any {
    if (Array.isArray(value)) return value.map(reversed);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).reverse().map(([k, v]) => [k, reversed(v)]));
    return value;
  }
  const reordered = reversed(copy());
  const before = JSON.stringify(reordered);
  expect(renderModuleCatalog(reordered)).toBe(renderModuleCatalog());
  expect(JSON.stringify(reordered)).toBe(before);
  const oversized = copy();
  for (const module of oversized.modules) {
    module.label = "字".repeat(120);
    module.purpose = "字".repeat(320);
    module.status_note = "字".repeat(320);
  }
  expect(Buffer.byteLength(JSON.stringify(oversized), "utf8")).toBeGreaterThan(30_000);
  expect(modules.validateModuleCatalog(oversized).join(" ")).toMatch(/byte budget/);
  expect(() => renderModuleCatalog(oversized)).toThrow(/byte budget/);
});

const escapeText = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const cardHtml = (html: string, id: string): string => html.match(new RegExp(`<article id="civic-module-${id}"[^>]*>([\\s\\S]*?)</article>`))![1];

test("human cards show each exact destination once without merging distinct fragments or JSON audiences", () => {
  const value = copy();
  const research = value.modules.find((module) => module.id === "research-library")!;
  research.links.push({ audience: "human", label: "Rights overview", url: "https://thekingdom.dev/atlas.html#rights", format: "text/html" });
  const before = renderModuleCatalog(value);
  const card = cardHtml(modules.renderModuleDirectory(value), "research-library");
  expect([...card.matchAll(/href="https:\/\/thekingdom.dev\/atlas.html"/g)]).toHaveLength(1);
  expect(card).toContain('href="https://thekingdom.dev/atlas.html#rights" type="text/html"');
  expect(card).toContain(research.links[0].label);
  expect(card).not.toContain(research.links[1].label);
  expect(JSON.parse(before).modules.find((module: modules.PublicModule) => module.id === "research-library").links)
    .toEqual(research.links);
  expect(research.links.slice(0, 2).map((link) => link.audience)).toEqual(["human", "agent"]);
  expect(renderModuleCatalog(value)).toBe(before);
});

test("card entry links follow their purpose with compact formats instead of audience or MIME clutter", () => {
  const html = modules.renderModuleDirectory();
  for (const module of PUBLIC_MODULE_CATALOG.modules) {
    const card = cardHtml(html, module.id);
    expect(card).toContain(`<p>${escapeText(module.purpose)}</p>\n  <ul class="module-links"`);
    const entryLinks = card.match(/<ul class="module-links"[^>]*>([\s\S]*?)<\/ul>/)![1];
    const text = entryLinks.replace(/<[^>]*>/g, "");
    expect(text).not.toMatch(/\b(?:Human|Agent)\b|text\/|application\//);
    for (const link of module.links) expect(entryLinks).toContain(`href="${escapeText(link.url)}" type="${link.format}"`);
  }
  expect(cardHtml(html, "wayfinder")).toContain('type="application/json">Path catalogue (JSON)</a>');
  expect(cardHtml(html, "civic")).toContain('type="text/markdown">Civic interaction contract (Markdown)</a>');
  expect(cardHtml(html, "full-references")).toContain('type="text/plain">Text reference index (Text)</a>');
  expect(cardHtml(html, "commons-mcp")).toContain('type="application/mcp">Hosted read-only MCP</a>');
});

test("tags stay in the JSON catalogue rather than decorative card chips", () => {
  const before = renderModuleCatalog();
  const html = modules.renderModuleDirectory();
  expect(html).not.toContain('class="module-tags"');
  expect(html).not.toContain('aria-label="Tags"');
  expect(JSON.parse(before).modules.map((module: modules.PublicModule) => module.tags))
    .toEqual(PUBLIC_MODULE_CATALOG.modules.map((module) => module.tags));
  expect(renderModuleCatalog()).toBe(before);
});

test("related reading is an optional disclosure with unchanged module anchors", () => {
  const html = modules.renderModuleDirectory();
  for (const module of PUBLIC_MODULE_CATALOG.modules) {
    const card = cardHtml(html, module.id);
    const related = card.match(/<details class="module-related"><summary>Related reading<\/summary>([\s\S]*?)<\/details>/)?.[1];
    expect(related, module.id).toBeDefined();
    expect([...related!.matchAll(/href="#civic-module-([^"]+)"/g)].map((match) => match[1])).toEqual(module.related_ids);
  }
  expect([...html.matchAll(/<details class="module-group" open>/g)]).toHaveLength(PUBLIC_MODULE_CATALOG.groups.length);
  const value = copy();
  value.modules[0].related_ids = [];
  expect(cardHtml(modules.renderModuleDirectory(value), value.modules[0].id)).not.toContain('class="module-related"');
});

test("workshop describes its scope plainly without implying extra capabilities", () => {
  const module = PUBLIC_MODULE_CATALOG.modules.find((module) => module.id === "workshop")!;
  expect(module.status_note).toBe("Needs JavaScript. Drafts stay in page memory, with no autosave. Export before leaving.");
  expect(module.behavior).toBe("browser-local");
  const card = cardHtml(modules.renderModuleDirectory(), module.id);
  for (const text of [module.label, module.purpose, module.status_note]) expect(card).toContain(escapeText(text));
});

test("research-library describes its scope plainly without implying extra capabilities", () => {
  const module = PUBLIC_MODULE_CATALOG.modules.find((module) => module.id === "research-library")!;
  expect(module.label).toBe("Research atlas · 研究館");
  expect(module.purpose).toBe("Browse research and design guides.");
  expect(module.status_note).toBe("Each guide states its scope and limits. Reading does not activate anything.");
  expect(module.behavior).toBe("static-reference");
  const card = cardHtml(modules.renderModuleDirectory(), module.id);
  for (const text of [module.label, module.purpose, module.status_note]) expect(card).toContain(escapeText(text));
});

test("trial-chamber describes its scope plainly without implying extra capabilities", () => {
  const module = PUBLIC_MODULE_CATALOG.modules.find((module) => module.id === "trial-chamber")!;
  expect(module.purpose).toBe("Read synthetic evaluation drafts and their review requirements.");
  expect(module.status_note).toBe("Drafts only: no trial execution, results, approval or adoption.");
  expect(module.behavior).toBe("snapshot");
  const card = cardHtml(modules.renderModuleDirectory(), module.id);
  for (const text of [module.label, module.purpose, module.status_note]) expect(card).toContain(escapeText(text));
});

test("civic describes its scope plainly without implying extra capabilities", () => {
  const module = PUBLIC_MODULE_CATALOG.modules.find((module) => module.id === "civic")!;
  expect(module.status_note).toBe("Check Civic for current availability and write access. Reading or being listed grants no identity or external powers.");
  expect(module.behavior).toBe("runtime-gated");
  const card = cardHtml(modules.renderModuleDirectory(), module.id);
  for (const text of [module.label, module.purpose, module.status_note]) expect(card).toContain(escapeText(text));
});

test("contact describes its scope plainly without implying extra capabilities", () => {
  const module = PUBLIC_MODULE_CATALOG.modules.find((module) => module.id === "contact")!;
  expect(module.purpose).toBe("Find human-operated email channels for contact, security and abuse reports, with their privacy terms.");
  expect(module.status_note).toBe("The page neither sends nor stores messages. Email delivery, replies, representation and consent are not guaranteed.");
  expect(module.behavior).toBe("static-reference");
  const card = cardHtml(modules.renderModuleDirectory(), module.id);
  for (const text of [module.label, module.purpose, module.status_note]) expect(card).toContain(escapeText(text));
});

test("observatory describes its scope plainly without implying extra capabilities", () => {
  const module = PUBLIC_MODULE_CATALOG.modules.find((module) => module.id === "observatory")!;
  expect(module.status_note).toBe("Check the stated mode and observation dates. Discovery is not scientific evaluation, adoption or permission to run.");
  expect(module.behavior).toBe("snapshot");
  const card = cardHtml(modules.renderModuleDirectory(), module.id);
  for (const text of [module.label, module.purpose, module.status_note]) expect(card).toContain(escapeText(text));
});

test("server-renders every grouped entry as readable, escaped navigation without active content", () => {
  expect(modules.renderModuleDirectory).toBeFunction();
  const render = modules.renderModuleDirectory;
  const html = render();
  expect(html).toContain('<section id="civic-modules" class="module-directory" aria-labelledby="civic-modules-title">');
  expect(html).toContain('<h2 id="civic-modules-title">');
  expect([...html.matchAll(/<details\b[^>]*class="module-group"/g)]).toHaveLength(PUBLIC_MODULE_CATALOG.groups.length);
  expect([...html.matchAll(/<article\b/g)]).toHaveLength(PUBLIC_MODULE_CATALOG.modules.length);
  for (const group of PUBLIC_MODULE_CATALOG.groups) {
    expect(html).toContain('<details class="module-group" open>');
    expect(html).toContain(`<h3 id="civic-modules-group-${group.id}">${escapeText(group.label)}</h3>`);
    expect(html).toContain(escapeText(group.purpose));
  }
  const behaviorLabels = {
    "browser-local": "In your browser", "runtime-gated": "Requires service", "static-reference": "Static reference",
    snapshot: "Snapshot", discovery: "Discovery", "external-service": "External service",
  };
  for (const module of PUBLIC_MODULE_CATALOG.modules) {
    const card = html.match(new RegExp(`<article id="civic-module-${module.id}"[^>]*>([\\s\\S]*?)</article>`))?.[1];
    expect(card).toBeDefined();
    for (const text of [module.label, module.purpose, module.status_note]) expect(card).toContain(escapeText(text));
    expect(card).toContain(behaviorLabels[module.behavior]);
    expect(card).not.toContain('class="module-tags"');
    expect(card).toContain('class="module-links"');
    expect(card).toContain('class="module-status"');
    for (const link of module.links.filter((link, index, links) => links.findIndex((other) => other.url === link.url) === index)) {
      expect(card).toContain(`href="${escapeText(link.url)}"`);
      expect(card).toContain(escapeText(link.label));
      expect(card).toContain(`type="${link.format}"`);
    }
    for (const id of module.related_ids) expect(card).toContain(`href="#civic-module-${id}"`);
  }
  expect(html).toContain("Links do not grant permission or verify availability.");
  expect(html).toContain("Related reading does not imply integration.");
  expect(html).not.toMatch(/<(?:script|style|iframe|img|audio|video|link|form|input)\b|\s(?:on\w+|src|srcdoc|hidden)=|fetch\(|autoplay|preload|prefetch/i);
  expect(render()).toBe(html);
  expect(Buffer.byteLength(html, "utf8")).toBeLessThan(100_000);
  const hostile = copy();
  const payload = '</a><script>"&\'</script>';
  hostile.purpose = payload;
  hostile.groups[0].label = payload;
  hostile.groups[0].purpose = payload;
  const first = hostile.modules[0];
  first.label = payload; first.purpose = payload; first.status_note = payload;
  first.tags = [payload]; first.links[0].label = payload;
  const before = JSON.stringify(hostile);
  const safeHtml = render(hostile);
  expect(safeHtml).not.toContain(payload);
  expect(safeHtml).not.toContain("<script>");
  expect(safeHtml.split(escapeText(payload)).length).toBeGreaterThan(8); // Includes related-link labels.
  expect(JSON.stringify(hostile)).toBe(before);
  hostile.modules[0].links[0].url = 'https://thekingdom.dev/atlas.html" onclick="alert(1)';
  expect(() => render(hostile)).toThrow(/catalog/i);
});

test("validation rejects non-JSON object machinery without evaluating it", () => {
  let effects = 0;
  const getter = () => { effects++; return "wayfinder"; };
  const hidden = copy(); Object.defineProperty(hidden, "private", { value: "hidden" });
  const symbol = copy(); Object.defineProperty(symbol, Symbol("extra"), { value: "hidden" });
  const inherited = Object.assign(Object.create({ hidden: "not JSON" }), copy());
  const accessor = copy(); Object.defineProperty(accessor.modules[0], "id", { get: getter, enumerable: true });
  const arrayAccessor = copy(); Object.defineProperty(arrayAccessor.modules[0].tags, "0", { get: getter, enumerable: true });
  const sparse = copy(); delete sparse.modules[0].tags[0];
  const arrayExtra = copy(); Object.assign(arrayExtra.modules[0].tags, { hidden: "not JSON" });
  const customArray = copy(); Object.setPrototypeOf(customArray.modules, { forEach: getter });
  const hiddenRequired = copy(); Object.defineProperty(hiddenRequired, "purpose", { enumerable: false });
  const proxy = new Proxy(copy(), { ownKeys() { effects++; return []; } });
  const revoked = Proxy.revocable(copy(), {}); revoked.revoke();
  const arrayProxy = copy(); arrayProxy.modules = new Proxy(arrayProxy.modules, { get() { effects++; return undefined; } });
  for (const invalid of [hidden, symbol, inherited, accessor, arrayAccessor, sparse, arrayExtra, customArray, hiddenRequired, proxy, revoked.proxy, arrayProxy]) {
    expect(() => modules.validateModuleCatalog(invalid)).not.toThrow();
    expect(modules.validateModuleCatalog(invalid).length).toBeGreaterThan(0);
    expect(() => renderModuleCatalog(invalid)).toThrow(/catalog/i);
    expect(() => modules.renderModuleDirectory(invalid)).toThrow(/catalog/i);
  }
  expect(effects).toBe(0);
});

test("directory rendering enforces a byte budget after HTML escaping expands text", () => {
  const expanded = copy();
  for (const module of expanded.modules) {
    module.label = "&".repeat(120);
    module.purpose = "&".repeat(320);
    module.status_note = "&".repeat(320);
    // Expand visible link labels; tags are deliberately absent from the HTML.
    for (const link of module.links) link.label = "&".repeat(120);
  }
  expect(modules.validateModuleCatalog(expanded)).toEqual([]);
  expect(Buffer.byteLength(renderModuleCatalog(expanded), "utf8")).toBeLessThan(30_000);
  expect(() => modules.renderModuleDirectory(expanded)).toThrow(/HTML byte budget/);
});

test("the directory introduces its choices with one warning and a typed catalogue link", () => {
  const html = modules.renderModuleDirectory();
  expect(html.match(/<h2 id="civic-modules-title">(.*?)<\/h2>/)?.[1]).toBe("Modules");
  expect(PUBLIC_MODULE_CATALOG.purpose).toBe("Choose a tool, service or reference.");
  const intro = html.slice(0, html.indexOf('<details class="module-group"'));
  expect(intro).toContain('<a href="/modules.json" type="application/json">Module catalogue (JSON)</a>');
  expect(intro.match(/<p class="module-status">(.*?)<\/p>/g)).toEqual([
    '<p class="module-status">Links do not grant permission or verify availability. Related reading does not imply integration.</p>',
  ]);
  expect(PUBLIC_MODULE_CATALOG.scope).toBe("A curated navigation directory, not a repository census, asset inventory, runtime module system, or grant of rights. Related entries are reading companions, not dependencies or equivalences. Source routes are not live availability checks.");
});

test("valid module identifiers cannot collide with directory heading identifiers", () => {
  const value = copy();
  value.modules.find((m) => m.id === "workshop")!.id = "wayfinder-title";
  for (const module of value.modules) module.related_ids = module.related_ids.map((id) => id === "workshop" ? "wayfinder-title" : id);
  expect(modules.validateModuleCatalog(value)).toEqual([]);
  const html = modules.renderModuleDirectory(value);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  expect(new Set(ids).size).toBe(ids.length);
  for (const [, id] of html.matchAll(/(?:aria-labelledby="|href="#)([^"]+)"/g)) expect(ids).toContain(id);
});
