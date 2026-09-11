import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { startPreview } from "./preview.mjs";
const require = createRequire(new URL("../civic/package.json", import.meta.url));
const { chromium } = require("playwright-core");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const output = process.env.POWER_ATLAS_BROWSER_DIR ?? await mkdtemp(join(tmpdir(), "kingdom-power-browser-"));
assert.ok(isAbsolute(output)); assert.equal((await readdir(output)).length, 0, "use a fresh empty browser output directory");
const stage = join(output, "stage"), screenshots = join(output, "screenshots");
await mkdir(stage); await mkdir(screenshots);
const staged = spawnSync("bun", [join(root, "bin/stage-hub.ts"), stage], { cwd: root, encoding: "utf8" });
await writeFile(join(output, "stage.log"), staged.stdout + staged.stderr);
assert.equal(staged.status, 0, "real full staging failed");
const preview = await startPreview({ stage });
const { base, mf, outbound } = preview;
const checks = [], errors = [], csp = [], external = [], resources = [];
let browser;
const record = (name) => { checks.push(name); console.log(`PASS ${name}`); };
async function settled(page, selector) { await page.locator(selector).waitFor({ state: "visible" }); }
async function shot(page, name) {
  await page.screenshot({ path: join(screenshots, `${name}.png`), fullPage: true, animations: "disabled" });
}
try {
  // Actual staged Worker: every direct body, including all 52 app files, is
  // fetched through the loopback socket and compared with the full stage.
  const contract = JSON.parse(await readFile(join(root, "publications/hub-staging.v1.json"), "utf8"));
  let exact = 0;
  for (const { destination } of contract.assets) {
    if (["_worker.js", "404.html"].includes(destination)) continue;
    const path = destination === "index.html" ? "/" : `/${destination.replace(/\/index\.html$/, "/")}`;
    const response = await fetch(new URL(path, base), { redirect: "error" });
    assert.equal(response.status, 200, path);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(join(stage, destination)), path);
    exact++;
  }
  assert.equal(exact, 254); record("254 direct bodies match full stage through real Worker socket (not live parity)");
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  for (const device of [
    { name: "desktop", viewport: { width: 1440, height: 1000 } },
    { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  ]) {
    const { name, ...options } = device;
    const context = await browser.newContext({ ...options, reducedMotion: "reduce" });
    await context.route("**/*", (route) => {
      if (new URL(route.request().url()).origin !== base.origin) { external.push(route.request().url()); return route.abort(); }
      return route.continue();
    });
    await context.addInitScript(() => {
      window.powerCsp = [];
      addEventListener("securitypolicyviolation", (event) => {
        const item = `${event.violatedDirective}: ${event.blockedURI} (${event.sourceFile}:${event.lineNumber})`;
        window.powerCsp.push(item); console.warn(`POWER_CSP_VIOLATION ${item}`);
      });
    });
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    // Keep audit reads free of in-page eval: use CDP and DOM/URL locators,
    // leaving any reported app CSP violation attributable to its sourceFile.
    const cdp = await context.newCDPSession(page);
    const inspect = async (expression) => {
      const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, allowUnsafeEvalBlockedByCSP: false });
      assert.equal(result.exceptionDetails, undefined); return result.result.value;
    };
    page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
    page.on("console", (message) => {
      if (message.text().startsWith("POWER_CSP_VIOLATION ")) csp.push(`${name}: ${message.text()}`);
      if (message.type() === "error" && /Content Security Policy|Refused to (?:load|execute|connect)/i.test(message.text())) csp.push(`${name}: ${message.text()}`);
    });
    const appRequests = [], appResponses = [];
    let inAtlas = false;
    page.on("request", (request) => { if (inAtlas) appRequests.push(new URL(request.url()).pathname); });
    page.on("response", (response) => { if (new URL(response.url()).pathname.startsWith("/power-atlas/")) appResponses.push(response); });
    await page.goto(base.href, { waitUntil: "networkidle" });
    await settled(page, ".hall-header");
    assert.equal(await page.locator('header a[href="/atlas.html"]').count(), 1);
    await shot(page, `${name}-kingdom-home`);
    const outboundBeforeAtlas = outbound.length;
    inAtlas = true;
    const navigation = page.waitForNavigation({ waitUntil: "networkidle" });
    await page.locator('header a[href="/power-atlas/"]').click();
    const response = await navigation; assert.equal(response.status(), 200);
    assert.equal(new URL(page.url()).pathname, "/power-atlas/");
    const h = response.headers();
    assert.equal(h["cache-control"], "no-store, no-transform");
    for (const directive of ["script-src 'self'", "style-src 'self'", "font-src 'self'", "connect-src 'self'", "frame-ancestors 'none'"])
      assert.ok(h["content-security-policy"].includes(directive));
    assert.ok(!/unsafe-inline|unsafe-eval|https:/.test(h["content-security-policy"]));
    assert.equal(h["referrer-policy"], "no-referrer"); assert.equal(h["set-cookie"], undefined);
    await settled(page, ".atlas-svg"); assert.equal(await page.locator(".graph-node").count(), 70);
    await shot(page, `${name}-atlas`); record(`${name}: Kingdom homepage navigation enters actual 70-entity Atlas`);

    await page.getByLabel("搵一個名字", { exact: true }).fill("ICBC");
    await page.waitForURL((url) => url.hash.includes("q=ICBC"));
    await page.getByRole("button", { name: /^Industrial and Commercial Bank of China Limited；.*開檔案$/ }).click();
    await settled(page, ".dossier-title");
    assert.equal(await page.locator(".dossier-title").textContent(), "Industrial and Commercial Bank of China Limited");
    await page.locator(".dossier-panel .evidence-summary").first().click();
    await page.locator(".dossier-panel .evidence-link").first().waitFor({ state: "visible" });
    const source = page.locator(".dossier-panel .evidence-link").first();
    assert.match(await source.getAttribute("href"), /^https:\/\/v\.icbc\.com\.cn\//);
    assert.match(await source.getAttribute("rel"), /noreferrer/);
    assert.match(await page.locator(".dossier-panel .evidence-locator").first().textContent(), /p\.|PDF|頁/);
    await shot(page, `${name}-icbc-source`);
    await page.getByRole("button", { name: "關閉檔案", exact: true }).click();
    record(`${name}: ICBC search, dossier, exact source locator (no external document fetched)`);
    await page.getByRole("link", { name: "資料目錄", exact: true }).click();
    await settled(page, ".atlas-table"); assert.ok(await page.locator(".atlas-table tbody tr").count() > 0);
    const tableHash = new URL(page.url()).hash;
    await page.reload({ waitUntil: "networkidle" }); await settled(page, ".atlas-table");
    assert.equal(await page.getByLabel("搵一個名字", { exact: true }).inputValue(), "ICBC");
    await shot(page, `${name}-table`);
    await page.getByRole("link", { name: "案例比較", exact: true }).click();
    for (const id of ["icbc", "exor", "aramco"]) {
      await page.getByLabel("揀一個主案例", { exact: true }).selectOption(id);
      await page.locator(".compare-add").click();
    }
    await settled(page, '.compare-table[data-count="3"]');
    assert.equal(await page.getByLabel("揀一個主案例", { exact: true }).isDisabled(), true);
    await shot(page, `${name}-compare`);
    await page.getByRole("button", { name: "複製閱讀位置" }).click();
    const shared = new URL(await page.locator("#share-location").inputValue());
    assert.equal(shared.pathname, "/power-atlas/"); assert.ok(shared.hash.includes("compare="));
    await page.getByRole("link", { name: "研究方法", exact: true }).click();
    await page.goBack(); await settled(page, ".compare-table");
    await page.goForward(); await page.waitForURL((url) => url.hash.startsWith("#/methodology"));
    record(`${name}: table/reload, three-case comparison, share pathname, browser Back/Forward`);
    for (const alias of ["/power-atlas", "/power-atlas/index.html"]) {
      await page.goto(new URL(`${alias}${tableHash}`, base).href, { waitUntil: "networkidle" });
      await settled(page, ".atlas-table");
      assert.equal(new URL(page.url()).pathname, "/power-atlas/");
      assert.equal(new URL(page.url()).hash, tableHash);
      assert.equal(await page.getByLabel("搵一個名字", { exact: true }).inputValue(), "ICBC");
    }
    record(`${name}: both real HTTP 308 aliases preserve table/search fragment`);
    await inspect("document.fonts.ready.then(() => true)");
    const fonts = await inspect("[...document.fonts].filter(font => font.status === 'loaded').map(font => font.family)");
    assert.ok(fonts.some((font) => font.includes("IBM Plex Sans"))); assert.ok(fonts.some((font) => font.includes("Fraunces")));
    const loaded = appResponses.filter((res) => /\.(js|css|woff2?|svg)$/.test(new URL(res.url()).pathname));
    for (const extension of ["js", "css", "woff2", "svg"]) assert.ok(loaded.some((res) => new URL(res.url()).pathname.endsWith(`.${extension}`)), extension);
    assert.ok(loaded.some((res) => /\/load-[^/]+\.js$/.test(new URL(res.url()).pathname)), "real lazy data chunk loaded");
    for (const res of loaded) { assert.equal(res.status(), 200, res.url()); assert.equal(res.headers()["cache-control"], "no-store, no-transform"); }
    assert.ok(appRequests.every((path) => path.startsWith("/power-atlas")), `prefix escape: ${appRequests}`);
    // All navigation violations are collected above; assert after both devices
    // so a failed CSP gate still leaves the complete UI screenshots for review.
    assert.ok(Array.isArray(await inspect("window.powerCsp")));
    assert.ok(await inspect("document.documentElement.scrollWidth <= innerWidth + 1"), "document overflow");
    assert.equal(outbound.length, outboundBeforeAtlas, "Atlas must not invoke the existing host census or any upstream");
    resources.push({ device: name, fonts, paths: [...new Set(loaded.map((res) => new URL(res.url()).pathname))] });
    record(`${name}: real fonts/lazy chunk/favicon, no prefix escape or external request (CSP gate below)`);
    inAtlas = false;
    await page.getByRole("link", { name: "← 返回王國", exact: true }).click();
    await settled(page, ".hall-header"); assert.equal(new URL(page.url()).pathname, "/");
    // Existing host navigation, not a stand-in fixture or Vite preview.
    await page.locator('header a[href="/meet/"]').click(); await settled(page, "#civic-messages-status");
    assert.equal(await page.locator("body").getAttribute("data-page"), "meet");
    await page.locator('header a[href="/join/"]').click(); await settled(page, "#civic-main");
    await page.locator('header a[href="/atlas.html"]').click(); await settled(page, "#wayfinder");
    assert.equal(await page.locator('[data-wayfinder-path="power-atlas"]').count(), 1);
    await page.locator("#wayfinder").scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(screenshots, `${name}-research-room.png`), animations: "disabled" });
    await page.goto(new URL("/workshop/", base).href, { waitUntil: "networkidle" }); await settled(page, "[data-workshop]");
    await page.goto(base.href, { waitUntil: "networkidle" }); await settled(page, ".hall-header");
    record(`${name}: returns to Kingdom; existing Meet/Join/research room/Workshop remain navigable`);
    await context.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(csp, []); assert.deepEqual(external, []);
  // Existing root dashboard reads /kingdom.json, whose census tries upstreams.
  // Miniflare blocks these; this is neither live service health nor Atlas traffic.
  await writeFile(join(output, "browser.json"), JSON.stringify({ checks, exactBodies: 254, resources, errors, csp, external, outbound, stage, screenshots, base: base.href, localOnly: true }, null, 2) + "\n");
  console.log(JSON.stringify({ passed: checks.length, output, stage, screenshots, localOnly: true }));
} catch (error) {
  await writeFile(join(output, "failure.json"), JSON.stringify({ error: String(error), checks, resources, stage, screenshots, errors, csp, external, outbound }, null, 2));
  throw error;
} finally { if (browser) await browser.close(); await mf.dispose(); }
