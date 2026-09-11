import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, copyFile, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { buildDashboard, DASHBOARD_OUTPUTS, extractLegacyAnchors, projectDashboardData, renderDashboardPage, safePublicUrl, stablePlaceId } from "../bin/build-dashboard";
import { captureDraft, settleDraft, filterPlaces, legacyRedirect, mapLayout, measuredSnapshot } from "../pages-content/civic/dashboard.js";

// 純合成測試資料，唔係真工程／公民，唔寫入 repo site 或 production。
const machine = {
  generated: "2026-09-08", counts: { repos: null, citizens: 999 }, private: "NOT_PUBLIC",
  doors: [{ name: "synthetic door", url: "https://example.test/", live: true, blurb: "synthetic" }],
  citizens: [{ name: "synthetic curated work", essence: "a test", repo: "https://example.test/work", path: "/private/test" }],
  layers: [
    { layer: "alpha", myth: "synthetic", note: "a test", repos: [{ name: "test-a", state: "remote", domain: "maps", purpose: "find a test", dependsOn: ["test-b", "unknown", "test-b", "ambiguous"], door: "https://example.test/a", path: "/private/test" }] },
    { layer: "beta", repos: [{ name: "test-b", purpose: "test only", dependsOn: ["test-b"], door: "javascript:alert(1)" }, { name: "ambiguous", state: "unknown" }, { name: "ambiguous", state: "remote" }] },
    { layer: "empty", repos: [] },
  ],
};
const data = projectDashboardData(machine);
describe("public dashboard projection", () => {
  test("preserves every declared layer, remote/unknown nodes and curated library separately", () => {
    expect(data.layers.map((l) => l.id)).toEqual(["alpha", "beta", "empty"]);
    expect(data.layers.flatMap((l) => l.nodes)).toHaveLength(4);
    expect(data.layers[1].nodes[0].state).toBe("unknown");
    expect(data.library).toHaveLength(1);
    expect(JSON.stringify(data)).not.toContain("999");
    expect(data.doors[0].liveDeclared).toBe(true);
  });
  test("whitelists public fields without graph paths or counts dressed as civic population", () => {
    expect(JSON.stringify(data)).not.toContain("/private/test");
    expect(JSON.stringify(data)).not.toContain("NOT_PUBLIC");
    expect(JSON.stringify(data)).not.toContain('"path":');
  });
  test("Power Atlas reuses the public Wayfinder projection without changing the census or library", async () => {
    const authored = JSON.parse(await readFile(join(import.meta.dir, "../data/wayfinder.json"), "utf8"));
    const atlas = authored.paths.find(({ id }: { id: string }) => id === "power-atlas");
    expect(atlas).toBeDefined();
    const projected = projectDashboardData(machine, authored);
    const path = projected.paths.find(({ id }) => id === atlas.id)!;
    expect(path.stops).toEqual(atlas.stops);
    expect(path.boundary).toBe(atlas.boundary);
    expect(path.invitation).toBe(atlas.invitation);
    expect(projected.generated).toBe(data.generated);
    expect(projected.layers).toEqual(data.layers);
    expect(projected.library).toEqual(data.library);
    expect(projected.doors).toEqual(data.doors);
    const html = renderDashboardPage("explore", projected);
    const article = html.match(/<article><h3>Power Atlas[^]*?<\/article>/)?.[0];
    expect(article).toBeDefined();
    expect(article!).toContain('href="https://thekingdom.dev/power-atlas/"');
    expect(article!).toContain(atlas.boundary);
    expect(article!).toContain(atlas.stops[0].scope);
  });
  test("only exact unambiguous declared dependencies produce sourced edges", () => {
    expect(data.edges).toEqual([{ from: stablePlaceId("alpha", "test-a"), to: stablePlaceId("beta", "test-b"), source: "kingdom.yaml → machine.layers.repos.dependsOn" }]);
    expect(data.layers[0].nodes[0].dependsOn).toEqual(["test-b", "unknown", "ambiguous"]);
  });
  test.each(["javascript:alert(1)", "http://example.test", "//example.test", "https://name:secret@example.test", "https://example.test/\n", "file:///private/test", "/private/test"])("rejects unsafe public URL %s", (url) => expect(safePublicUrl(url)).toBeNull());
  test("accepts explicit https public URLs and encodes content safely", () => expect(safePublicUrl("https://example.test/a?b=1&c=2")).toBe("https://example.test/a?b=1&c=2"));
  test("search, layer and state filters scope the exact same nodes", () => {
    expect(filterPlaces(data, { q: "MAPS", layer: "alpha", state: "remote" })).toHaveLength(1);
    expect(filterPlaces(data, { q: "find a test" })).toHaveLength(1);
    expect(filterPlaces(data, { layer: "empty" })).toHaveLength(0);
    expect(filterPlaces(data, { q: "NOT_PUBLIC" })).toHaveLength(0);
  });
  test("share identifiers remain attached to names across ordering changes", () => {
    const reordered = projectDashboardData({ ...machine, layers: [...machine.layers].reverse() });
    expect(reordered.layers.find((l) => l.id === "alpha")!.nodes[0].id).toBe(data.layers[0].nodes[0].id);
    expect(stablePlaceId("alpha", "test-a")).not.toBe(stablePlaceId("beta", "test-a"));
  });
  test("layout contains every node without overlapping hit targets", () => {
    const layout = mapLayout(data), points = [...layout.points.values()];
    expect(points).toHaveLength(4);
    for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) expect(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)).toBeGreaterThanOrEqual(28);
    for (const p of points) { expect(p.x).toBeGreaterThan(0); expect(p.y).toBeLessThan(layout.height); }
  });
});
describe("legacy compatibility and safe rendering", () => {
  test("extracts known tag anchors, excludes script/style/comments and new namespace", () => {
    expect(extractLegacyAnchors('<section id="old-room"></section><a name="older"></a><div id="old-room"></div><div id="civic-new"></div><script>"<b id=\"fake\">"</script><style>x[id="fake2"]{}</style><!-- <div id="fake3"> -->')).toEqual(["old-room", "older"]);
  });
  test("redirects only recognized root fragments and never guesses a route", () => {
    expect(legacyRedirect("/", "#old-room", ["old-room"])).toBe("/atlas.html#old-room");
    expect(legacyRedirect("/", "#old%2Droom", ["old-room"])).toBe("/atlas.html#old-room");
    expect(legacyRedirect("/meet/", "#old-room", ["old-room"])).toBeNull();
    expect(legacyRedirect("/", "#civic-explore", ["old-room"])).toBeNull();
    expect(legacyRedirect("/", "#%invalid", ["old-room"])).toBeNull();
  });
  test("SSR includes all nodes, no-JS anchor fallback and no UGC seeds", () => {
    const html = renderDashboardPage("explore", projectDashboardData(machine, {}, '<section id="old-room">'));
    expect(html).toContain('href="/atlas.html#old-room"');
    expect(html).toContain(`id="${stablePlaceId("beta", "ambiguous", 1)}"`);
    expect(html).toContain("test-b"); expect(html).toContain("<noscript>");
    expect(html).not.toContain("NOT_PUBLIC"); expect(html).not.toContain("/private/test");
    expect(html).not.toContain("Welcome, synthetic");
  });
  test("escapes HTML and embedded JSON including script closure", () => {
    const hostile = '</script><img src=x onerror="alert(1)">';
    const html = renderDashboardPage("explore", projectDashboardData({ layers: [{ layer: hostile, repos: [{ name: hostile, purpose: hostile }] }] }));
    expect(html).not.toContain(hostile);
    expect(html).toContain("&lt;/script&gt;");
    const json = html.match(/<script id="civic-data" type="application\/json">([\s\S]*?)<\/script>/)![1];
    expect(JSON.parse(json).layers[0].id).toBe(hostile);
    expect(json).not.toContain("<");
  });
  test.each(["explore", "meet", "citizens", "join"] as const)("%s uses one same-origin asset pair and distinct navigation", (page) => {
    const html = renderDashboardPage(page, data);
    expect(html).toContain('src="/civic/dashboard.js"'); expect(html).toContain('href="/civic/dashboard.css"');
    expect(html).not.toMatch(/on(?:click|load|submit)=/); expect(html).not.toMatch(/fonts\.(googleapis|gstatic)/);
    expect(html).toContain('lang="zh-Hant"'); expect(html).toContain('id="civic-main"');
  });
  test.each(["explore", "meet", "citizens", "join"] as const)("%s primary navigation offers Power Atlas as an ordinary same-tab link", (page) => {
    const html = renderDashboardPage(page, data);
    const nav = html.match(/<nav aria-label="主要導航">([\s\S]*?)<\/nav>/)![1];
    expect(nav).toContain('<a href="/power-atlas/">Power Atlas</a>');
    expect([...nav.matchAll(/href="([^"]+)"/g)].map(([, href]) => href))
      .toEqual(["/", "/meet/", "/join/", "/power-atlas/", "/atlas.html"]);
    expect(nav).not.toContain("target=");
    expect(nav).not.toMatch(/<button|onclick=|javascript:/i);
  });
  test("listing and publication are separate unchecked explicit choices", () => {
    const joinHtml = renderDashboardPage("join", data), meetHtml = renderDashboardPage("meet", data);
    expect(joinHtml).toContain('name="listed"'); expect(joinHtml).toContain('name="declare" required'); expect(joinHtml).not.toContain('name="publish"');
    expect(meetHtml).toContain('name="publish" required'); expect(meetHtml).not.toContain('name="listed"');
    expect(joinHtml).not.toMatch(/<input[^>]*\schecked(?:\s|>)/);
    expect(meetHtml).not.toMatch(/<input[^>]*\schecked(?:\s|>)/);
    expect(joinHtml).toContain("遺失控制匙"); expect(meetHtml).toContain("唔需要入籍");
  });
});
describe("measurement provenance", () => {
  test("authored live=true is not a measured response", () => expect(() => measuredSnapshot(machine)).toThrow());
  test("unknowns are null rather than counterfeit zero", () => {
    const measured = measuredSnapshot({ derived: true, counts: { source: "synthetic source", as_of: "2026-09-08T00:00:00Z", repos: null, citizens: 0 }, doors: [{ url: "https://example.test", measured: false, live: true }] });
    expect(measured.repos).toBeNull(); expect(measured.citizenRepos).toBe(0); expect(measured.doors).toHaveLength(0);
  });
  test("door measurement requires explicit measured=true", () => {
    const measured = measuredSnapshot({ derived: true, counts: { source: "synthetic", as_of: "2026-09-08" }, doors: [{ url: "https://example.test", measured: true, http: null, checked_at: null }] });
    expect(measured.doors[0].http).toBeNull(); expect(measured.doors[0].live).toBeNull();
  });
});
describe("per-field draft settlement (DOM races also run in dev/civic/test-client-races.mjs)", () => {
  function draft() {
    const body = { name: "body", type: "textarea", tagName: "TEXTAREA", value: "submitted A", defaultValue: "" };
    const publish = { name: "publish", type: "checkbox", checked: true, defaultChecked: false };
    const form = Object.assign(new EventTarget(), { elements: [body, publish], dataset: {} as Record<string, string> });
    return { form, body, publish };
  }
  test("untouched fields reset, later draft fields do not", () => {
    const { form, body, publish } = draft(), snapshot = captureDraft(form);
    body.value = "unsent B";
    expect(settleDraft(form, snapshot)).toBe(true);
    expect(body.value).toBe("unsent B"); expect(publish.checked).toBe(false); expect(form.dataset.dirty).toBe("true");
  });
  test("input version protects even a field changed back to its submitted value", () => {
    const { form, body } = draft(), snapshot = captureDraft(form);
    const input = new Event("input"); Object.defineProperty(input, "target", { value: body }); form.dispatchEvent(input);
    expect(settleDraft(form, snapshot)).toBe(true); expect(body.value).toBe("submitted A");
  });
  test("server hydration only updates fields unchanged since submission", () => {
    const { form, body, publish } = draft(), snapshot = captureDraft(form);
    body.value = "unsent profile";
    expect(settleDraft(form, snapshot, { body: "saved profile", publish: false })).toBe(true);
    expect(body.value).toBe("unsent profile"); expect(publish.checked).toBe(false);
  });
  test("settled edit becomes clean and adopts the saved text", () => {
    const { form, body, publish } = draft(); form.dataset.dirty = "true";
    expect(settleDraft(form, captureDraft(form), { body: "saved edit", publish: false })).toBe(false);
    expect(body.value).toBe("saved edit"); expect(publish.checked).toBe(false); expect(form.dataset.dirty).toBeUndefined();
  });
});
test("isolated build writes exactly six new outputs, without touching hub or reading a graph", async () => {
  const root = await mkdtemp(join(tmpdir(), "kingdom-dashboard-synthetic-"));
  const repo = join(import.meta.dir, "..");
  try {
    for (const name of ["pages-content/civic/dashboard.css", "pages-content/civic/dashboard.js", "bin/wayfinder.ts"]) {
      await mkdir(dirname(join(root, name)), { recursive: true }); await copyFile(join(repo, name), join(root, name));
    }
    const outputs = await buildDashboard({ root, machine, wayfinder: {}, legacyHtml: '<section id="old-room">' });
    expect(outputs).toEqual(DASHBOARD_OUTPUTS.map((p) => join(root, p)));
    const files = await readdir(join(root, "site"), { recursive: true });
    expect(files.filter((p) => /\.(html|css|js)$/.test(p)).sort()).toEqual(DASHBOARD_OUTPUTS.map((p) => p.slice(5)).sort());
    expect(files).not.toContain("hub.html"); expect(files).not.toContain("kingdom.json");
    const js = await readFile(join(root, "site/civic/dashboard.js"), "utf8");
    expect(js).not.toContain('from "../../bin/wayfinder.ts"');
    expect(js).toContain("rankWayfinderPaths");
    expect(js).not.toContain("localStorage"); expect(js).not.toContain("setInterval("); expect(js).not.toContain("innerHTML");
  } finally { await rm(root, { recursive: true, force: true }); }
});
