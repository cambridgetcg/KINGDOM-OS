import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { Miniflare, Log, LogLevel } from "miniflare";

// Local, credential-free acceptance of exact staged bytes. No real Civic data,
// provider connections, contact, enrolment, or production write probes.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const temporary = await mkdtemp(join(tmpdir(), "kingdom-outreach-browser-"));
const stage = join(temporary, "stage");
const catalogue = JSON.parse(await readFile(join(root, "site/modules.json"), "utf8"));
const contract = JSON.parse(await readFile(join(root, "publications/hub-staging.v1.json"), "utf8"));
const allowed = new Set(contract.assets.map(({ destination }) => destination));
const types = { ".html": "text/html", ".json": "application/json", ".css": "text/css", ".js": "text/javascript", ".md": "text/markdown", ".txt": "text/plain" };
const errors = [], external = [], checks = [];
let mf, browser;
try {
  assert.deepEqual(catalogue, JSON.parse(await readFile(join(root, "data/public-modules.json"), "utf8")), "Rebuild site/modules.json before browser acceptance");
  await mkdir(stage);
  const staged = spawnSync("bun", ["--no-env-file", "bin/stage-hub.ts", stage], { cwd: root, encoding: "utf8" });
  assert.equal(staged.status, 0, staged.stderr);
  mf = new Miniflare({
    cf: false, host: "127.0.0.1", port: 0, log: new Log(LogLevel.ERROR),
    modules: true, modulesRoot: stage, scriptPath: join(stage, "_worker.js"),
    compatibilityDate: "2026-07-30", bindings: { CIVIC_LOCAL: "true" },
    outboundService: () => new Response(null, { status: 503 }),
    serviceBindings: { ASSETS: async (request) => {
      const url = new URL(request.url);
      let name = url.pathname.slice(1);
      if (!name || name.endsWith("/")) name += "index.html";
      if (name === "atlas") name = "atlas.html";
      if (!allowed.has(name)) return new Response(null, { status: 404 });
      return new Response(request.method === "HEAD" ? null : await readFile(join(stage, name)), {
        headers: { "content-type": `${types[extname(name)] ?? "application/octet-stream"}; charset=utf-8` },
      });
    } },
  });
  const base = await mf.ready;
  assert.equal(base.hostname, "127.0.0.1");
  const response = await fetch(new URL("/modules.json", base));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^application\/json/);
  assert.equal(await response.text(), await readFile(join(stage, "modules.json"), "utf8"));
  assert.match(response.headers.get("link"), /#civic-modules/);
  const head = await fetch(new URL("/modules.json", base), { method: "HEAD" });
  assert.equal(head.status, 200); assert.equal(await head.text(), "");
  const rejected = await fetch(new URL("/modules.json", base), { method: "POST" });
  assert.equal(rejected.status, 405);
  checks.push("staged Worker: exact JSON, typed GET/HEAD, rejected POST");
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  for (const javaScriptEnabled of [true, false]) {
    for (const width of [1440, 768, 390, 320]) {
      const context = await browser.newContext({ javaScriptEnabled, viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      await context.route("**/*", (route) => {
        if (new URL(route.request().url()).origin !== base.origin) { external.push(route.request().url()); return route.abort(); }
        return route.continue();
      });
      const page = await context.newPage();
      const requests = [];
      page.on("request", (request) => requests.push({ path: new URL(request.url()).pathname, method: request.method() }));
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error" && /Content Security Policy|Refused to (?:load|execute|connect)/i.test(message.text())) errors.push(message.text()); });
      await page.goto(new URL("/#civic-modules", base).href, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".module-card").count(), catalogue.modules.length);
      assert.equal(await page.locator(".module-group").count(), catalogue.groups.length);
      assert.equal(await page.locator(".module-tags").count(), 0);
      assert.equal(await page.locator("#civic-modules-title").textContent(), "Modules");
      assert.deepEqual(await page.locator('nav[aria-label="Human and agent entries"] a').allTextContents(), ["Modules", "Agent entry (JSON)", "Full agent reference"]);
      assert.equal(await page.locator("#civic-service-status").count(), 1);
      assert.equal(await page.locator(".square-window #civic-service-status").count(), 1);
      assert.equal(await page.locator(".square-window #civic-refresh-status").count(), 1);
      assert.ok(await page.locator("#civic-modules").evaluate((directory) => Boolean(directory.compareDocumentPosition(document.getElementById("civic-service-status")) & Node.DOCUMENT_POSITION_FOLLOWING)));
      for (const module of catalogue.modules) {
        const card = page.locator(`#civic-module-${module.id}`);
        assert.equal(await card.isVisible(), true, `${width}/${javaScriptEnabled}: ${module.id}`);
        assert.ok((await card.textContent()).includes(module.purpose));
        const links = card.locator(":scope > ul.module-links");
        assert.equal(await links.evaluate((list) => list.previousElementSibling.textContent), module.purpose);
        const entries = await links.locator("a").evaluateAll((anchors) => anchors.map((a) => ({ url: a.href, format: a.type })));
        const uniqueLinks = module.links.filter((link, index, all) => all.findIndex((other) => other.url === link.url) === index);
        assert.deepEqual(entries, uniqueLinks.map(({ url, format }) => ({ url, format })));
        assert.doesNotMatch(await links.textContent(), /\b(?:Human|Agent)\b|text\/|application\//);
        const related = card.locator(":scope > details.module-related");
        assert.equal(await related.count(), module.related_ids.length ? 1 : 0);
        if (module.related_ids.length) {
          assert.equal(await related.getAttribute("open"), null);
          assert.equal(await related.locator("summary").textContent(), "Related reading");
          assert.deepEqual(await related.locator("a").evaluateAll((anchors) => anchors.map((a) => a.hash)), module.related_ids.map((id) => `#civic-module-${id}`));
          assert.equal(await related.locator("a").first().isVisible(), false);
        }
      }
      if (width >= 1000) {
        const first = await page.locator("#civic-module-wayfinder").boundingBox();
        const second = await page.locator("#civic-module-world-commons").boundingBox();
        assert.ok(Math.abs(first.y - second.y) < 2 && second.x > first.x, "desktop directory must use two readable columns");
      }
      const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
      assert.ok(dimensions.width <= dimensions.viewport + 1, `horizontal overflow: ${JSON.stringify(dimensions)}`);
      const summary = page.locator(".module-group > summary").first();
      await summary.focus(); await page.keyboard.press("Enter");
      assert.equal(await page.locator(".module-group").first().getAttribute("open"), null);
      await page.keyboard.press("Enter");
      assert.notEqual(await page.locator(".module-group").first().getAttribute("open"), null);
      const related = page.locator("#civic-module-wayfinder > .module-related");
      await related.locator("summary").focus(); await page.keyboard.press("Enter");
      assert.notEqual(await related.getAttribute("open"), null);
      const target = page.locator("#civic-module-workshop");
      const targetGroup = page.locator(".module-group").filter({ has: target });
      await targetGroup.locator(":scope > summary").click();
      assert.equal(await target.isVisible(), false);
      await related.locator('a[href="#civic-module-workshop"]').click();
      await target.waitFor({ state: "visible" });
      assert.notEqual(await targetGroup.getAttribute("open"), null, "related anchors must reveal a closed destination group");
      await related.locator("summary").focus(); await page.keyboard.press("Enter");
      assert.equal(await related.getAttribute("open"), null);
      if (javaScriptEnabled) {
        const before = requests.filter(({ path }) => path === "/api/civic/status").length;
        await Promise.all([
          page.waitForResponse((response) => new URL(response.url()).pathname === "/api/civic/status"),
          page.locator("#civic-refresh-status").click(),
        ]);
        await page.waitForFunction(() => !document.getElementById("civic-refresh-status").disabled);
        assert.equal(requests.filter(({ path }) => path === "/api/civic/status").length, before + 1);
      } else {
        assert.equal(requests.filter(({ path }) => path === "/api/civic/status").length, 0);
      }
      assert.ok(requests.every(({ method }) => method === "GET"), "navigation and refresh must not submit writes");
      await page.locator("#civic-modules-title").scrollIntoViewIfNeeded();
      if (process.env.OUTREACH_SCREENSHOTS) {
        await page.screenshot({ path: join(process.env.OUTREACH_SCREENSHOTS, `modules-${width}-${javaScriptEnabled ? "js" : "nojs"}.png`) });
      }
      checks.push(`${width}px ${javaScriptEnabled ? "JS" : "no-JS"}: unique typed links, optional related reading, cross-group anchors, scoped Civic status, no overflow or writes`);
      await context.close();
    }
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(JSON.stringify({ status: "pass", checks, modules: catalogue.modules.length, consoleErrors: errors, externalRequests: external }, null, 2));
} finally {
  await browser?.close();
  await mf?.dispose();
  await rm(temporary, { recursive: true, force: true });
}
