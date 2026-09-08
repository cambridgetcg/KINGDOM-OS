import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { lstat, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { Miniflare, Log, LogLevel } from "miniflare";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const temporary = await mkdtemp(join(tmpdir(), "kingdom-workshop-browser-"));
const stage = join(temporary, "stage");
const screenshots = process.env.WORKSHOP_SCREENSHOT_DIR;
const checks = [], errors = [], cspErrors = [], outbound = [], external = [];
const contexts = [];
let mf, browser;
const record = (name) => { checks.push(name); console.log(`✓ ${name}`); };

async function download(page, format) {
  const pending = page.waitForEvent("download");
  await page.locator(`[data-download="${format}"]`).click();
  const artifact = await pending;
  assert.equal(await artifact.failure(), null, `${format} 下載失敗`);
  const stream = await artifact.createReadStream();
  assert.ok(stream, "下載應提供可讀取 bytes");
  const buffers = [];
  for await (const buffer of stream) buffers.push(buffer);
  return { name: artifact.suggestedFilename(), bytes: Buffer.concat(buffers) };
}

async function fields(page) {
  return page.evaluate(() => {
    const value = (id) => document.getElementById(id).value;
    return {
      title: value("title"), byline: value("byline"), body: value("body"), rights: value("rights"),
      registers: Object.fromEntries(["observation", "interpretation", "unknown"].map((id) => [id, value(id)])),
      sources: [...document.querySelectorAll("[data-source]")].map((source) => Object.fromEntries(
        ["name", "url", "note", "rights"].map((key) => [key, source.querySelector(`[data-source-field="${key}"]`).value]),
      )),
    };
  });
}

async function openDetails(page) {
  for (const details of await page.locator("details").all()) {
    if (await details.getAttribute("open") === null) await details.locator(":scope > summary").click();
  }
}

async function noOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
  if (dimensions.width > dimensions.viewport + 1) {
    const offenders = await page.evaluate(() => [...document.querySelectorAll("body *")].map((element) => {
      const box = element.getBoundingClientRect();
      return { tag: element.tagName, id: element.id, className: String(element.className), left: box.left, right: box.right };
    }).filter((box) => box.right > innerWidth + 1 || box.left < -1).slice(0, 12));
    console.error("首 12 個越界元素：", JSON.stringify(offenders));
    if (screenshots) await page.screenshot({ path: join(screenshots, `overflow-${label.replace(/[^a-z0-9]/gi, "-")}.png`), fullPage: true });
  }
  assert.ok(dimensions.width <= dimensions.viewport + 1, `${label} 水平 overflow：${JSON.stringify(dimensions)}`);
}

try {
  if (screenshots) {
    assert.ok(isAbsolute(screenshots), "screenshot 目錄必須係明示絕對路徑");
    const info = await lstat(screenshots);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(), "screenshot 目的地須係現有普通目錄");
    assert.equal((await readdir(screenshots)).length, 0, "唔覆寫既有 screenshots；請提供新空目錄");
  }
  await mkdir(stage);
  const staged = spawnSync("bun", [join(root, "bin/stage-hub.ts"), stage], { cwd: root, encoding: "utf8" });
  assert.equal(staged.status, 0, `exact staging 失敗：${staged.stderr}`);
  const assets = new Map([
    ["/workshop/", ["workshop/index.html", "text/html; charset=utf-8"]],
    ["/workshop/workshop.css", ["workshop/workshop.css", "text/css; charset=utf-8"]],
    ["/workshop/workshop.js", ["workshop/workshop.js", "text/javascript; charset=utf-8"]],
  ]);
  // 執行真正 staged Worker；ASSETS 只提供呢次測試嘅三份 exact bytes，無雲端 bindings。
  mf = new Miniflare({
    cf: false, host: "127.0.0.1", port: 0, log: new Log(LogLevel.ERROR),
    modules: true, modulesRoot: stage, scriptPath: join(stage, "_worker.js"),
    compatibilityDate: "2026-07-30", bindings: { CIVIC_LOCAL: "true" },
    outboundService: () => { outbound.push("被封鎖嘅 upstream request"); return new Response(null, { status: 503 }); },
    serviceBindings: { ASSETS: async (request) => {
      const asset = assets.get(new URL(request.url).pathname);
      if (!asset) return new Response(null, { status: 404 });
      return new Response(request.method === "HEAD" ? null : await readFile(join(stage, asset[0])), {
        headers: { "content-type": asset[1] },
      });
    } },
  });
  const base = await mf.ready;
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname), "只測本地 socket");
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });

  async function workbench({ delayModule = false } = {}) {
    let releaseModule, moduleRequested;
    const moduleGate = new Promise((resolve) => { releaseModule = resolve; });
    const requested = new Promise((resolve) => { moduleRequested = resolve; });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
    contexts.push(context);
    await context.route("**/*", async (route) => {
      if (new URL(route.request().url()).origin !== base.origin) {
        external.push("被封鎖嘅 browser 外站 request");
        return route.abort();
      }
      if (delayModule && new URL(route.request().url()).pathname === "/workshop/workshop.js") {
        moduleRequested();
        await moduleGate;
      }
      return route.continue();
    });
    await context.addInitScript(() => {
      globalThis.workshopStorageCalls = [];
      for (const method of ["getItem", "setItem", "removeItem", "clear"]) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (...args) {
          globalThis.workshopStorageCalls.push(method);
          return original.apply(this, args);
        };
      }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && /Content Security Policy|Refused to (?:load|execute|connect)/i.test(message.text())) cspErrors.push(message.text());
    });
    let tracked = false, nextDecision = true;
    const requests = [];
    page.on("request", (request) => { if (tracked) requests.push(`${request.method()} ${new URL(request.url()).pathname}`); });
    page.on("dialog", async (dialog) => {
      const accept = nextDecision;
      nextDecision = true;
      await (accept ? dialog.accept() : dialog.dismiss());
    });
    const visit = async () => {
      tracked = false;
      const navigation = page.goto(new URL("/workshop/", base).href, { waitUntil: "networkidle" });
      if (delayModule) {
        try {
          await Promise.race([requested, navigation.then(() => { throw new Error("頁面冇請求 Workshop module"); })]);
          await page.locator("#body").waitFor();
          for (const selector of ["#title", "#body", "#import-draft", "[data-add-source]", '[data-download="json"]']) {
            assert.equal(await page.locator(selector).isDisabled(), true, "module 未就緒時唔可以先輸入再被清空");
          }
          record("延遲 module 載入期間控制項停用，唔會接收再清空正文");
        } finally {
          releaseModule();
          delayModule = false;
        }
      }
      const response = await navigation;
      assert.equal(response.status(), 200);
      const headers = response.headers();
      for (const directive of ["script-src 'self'", "connect-src 'none'", "form-action 'none'"]) {
        assert.ok(headers["content-security-policy"]?.includes(directive), `實際頁面缺 ${directive}`);
      }
      assert.equal(headers["referrer-policy"], "no-referrer");
      assert.equal(headers["set-cookie"], undefined);
      await page.locator("[data-workshop]").waitFor();
      await page.waitForFunction(() => !document.querySelector("[data-add-source]").disabled);
      tracked = true;
    };
    await visit();
    return { page, context, requests, visit, decide: (accept) => { nextDecision = accept; } };
  }

  const first = await workbench({ delayModule: true });
  const { page } = first;
  assert.equal(await page.locator("#body").inputValue(), "");
  assert.equal(await page.locator("[data-source]").count(), 0);
  await openDetails(page);
  for (const id of ["title", "byline", "body", "observation", "interpretation", "unknown", "rights"]) {
    assert.ok((await page.locator(`label[for="${id}"]`).textContent()).trim(), `${id} 應有可讀 label`);
  }
  const body = '第一段：你好，世界 😏。\n\n<script>globalThis.workshopInjected = true</script>\n![外圖](https://outside.invalid/pixel)\n[跳轉](javascript:alert(1))';
  await page.locator("#title").fill('窗邊筆記 <img src=x onerror="globalThis.workshopInjected=true">');
  await page.locator("#byline").fill("一位本地測試作者");
  await page.locator("#body").fill(body);
  await page.locator("#observation").fill("紙上有一圈水印。\n呢個係虛構測試。 ");
  await page.locator("#interpretation").fill("水可能由紙杯流落嚟，未能確定。");
  await page.locator("#unknown").fill("未量溫度，亦未知杯底原本有冇水。");
  await page.locator("[data-add-source]").focus();
  await page.keyboard.press("Enter");
  await page.locator("[data-source]").first().waitFor();
  const source = page.locator("[data-source]").first();
  await source.locator('[data-source-field="name"]').fill("原創合成情境 <來源>");
  await source.locator('[data-source-field="url"]').fill("https://example.test/source?edition=1&lang=zh-HK");
  await source.locator('[data-source-field="note"]').fill("此網址只作格式測試，冇讀取內容。");
  await page.locator("[data-add-source]").click();
  const unsafe = page.locator("[data-source]").nth(1);
  await unsafe.locator('[data-source-field="name"]').fill("不安全網址保留為文字");
  await unsafe.locator('[data-source-field="url"]').fill("javascript:alert(1)");
  await page.waitForFunction(() => document.querySelector("#preview").textContent.includes("javascript:alert(1)"));
  assert.equal(await page.evaluate(() => globalThis.workshopInjected), undefined);
  assert.equal(await page.locator('#preview script, #preview img, #preview iframe, #preview a[href^="javascript:"]').count(), 0);
  assert.match(await page.locator("#preview").textContent(), /未知/);
  const expected = await fields(page);
  record("自由主文、可選附註、鍵盤加來源同惡意文字 preview 完成");

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(page, `${width}px`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await noOverflow(page, "200% zoom");
  await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true);
  record("四個螢幕闊度、200% zoom、reduced-motion 無水平溢出");

  const html = await download(page, "html");
  const markdown = await download(page, "markdown");
  const json = await download(page, "json");
  assert.match(html.name, /\.html$/);
  assert.match(markdown.name, /\.md$/);
  assert.match(json.name, /\.json$/);
  const draft = JSON.parse(json.bytes.toString("utf8"));
  assert.equal(draft.schema_version, "thekingdom.workshop-draft/0.1");
  const { schema_version, ...editable } = draft;
  assert.deepEqual(editable, expected, "JSON 應完整保留所有可編輯欄位");
  assert.ok(html.bytes.includes(Buffer.from("&lt;script&gt;")));
  assert.ok(!markdown.bytes.toString("utf8").includes("<script>"));
  record("三個真實下載具有正確副檔名、安全輸出同完整草稿 bytes");

  const second = await workbench();
  await second.page.locator("#import-draft").setInputFiles({ name: "roundtrip.json", mimeType: "application/json", buffer: json.bytes });
  await second.page.waitForFunction((title) => document.querySelector("#title").value === title, expected.title);
  assert.deepEqual(await fields(second.page), expected);
  await openDetails(second.page);
  await second.page.locator("#body").fill(`${body}\n重開後繼續寫。`);
  const revised = JSON.parse((await download(second.page, "json")).bytes.toString("utf8"));
  assert.match(revised.body, /重開後繼續寫。$/);
  record("新 browser context 匯入 JSON 後內容完整，並能繼續修改下載");

  const beforeInvalid = await fields(second.page);
  const invalidDrafts = [
    Buffer.from("{broken"),
    Buffer.from(JSON.stringify({ ...draft, schema_version: "unknown/9" })),
    Buffer.from(JSON.stringify({ ...draft, extra: "唔應被吞咗" })),
    Buffer.alloc(512 * 1024 + 1, 32),
  ];
  for (const buffer of invalidDrafts) {
    await second.page.locator("#import-draft").setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer });
    await second.page.locator("#error").waitFor({ state: "visible" });
    assert.deepEqual(await fields(second.page), beforeInvalid, "壞 JSON 唔可以部分覆蓋原稿");
  }
  second.decide(false);
  await second.page.locator("[data-example]").click();
  assert.deepEqual(await fields(second.page), beforeInvalid, "取消載入示例應保留原稿");
  second.decide(false);
  await second.page.locator("[data-clear]").click();
  assert.deepEqual(await fields(second.page), beforeInvalid, "取消清空應保留原稿");
  second.decide(false);
  await second.page.locator("#import-draft").setInputFiles({ name: "replace.json", mimeType: "application/json", buffer: json.bytes });
  // 等候本地檔案 read 與 confirm 完成，唔靠任何網絡訊號。
  await second.page.waitForTimeout(100);
  assert.deepEqual(await fields(second.page), beforeInvalid, "取消換稿應保留最新內容");
  record("錯版本、額外欄位、破損／超大 JSON 同取消取代均保留原稿");

  await second.context.setOffline(true);
  await second.page.locator("#title").fill("已載入工作台，斷網仍可寫");
  const offline = JSON.parse((await download(second.page, "json")).bytes.toString("utf8"));
  assert.equal(offline.title, "已載入工作台，斷網仍可寫");
  await second.context.setOffline(false);
  for (const work of [first, second]) {
    assert.deepEqual(work.requests, [], "載入後編輯／預覽／匯出唔應有 application request");
    assert.deepEqual(await work.page.evaluate(() => globalThis.workshopStorageCalls), [], "工房唔應讀寫 browser storage");
    assert.equal(await work.page.evaluate(() => localStorage.length), 0);
    assert.deepEqual(await work.context.cookies(), []);
  }
  await second.visit();
  assert.equal(await second.page.locator("#body").inputValue(), "");
  record("載入後零 application network／storage／cookie，斷網可用，reload 唔自動恢復");

  const exportedPath = join(temporary, "exported.html");
  await writeFile(exportedPath, html.bytes);
  const offlineContext = await browser.newContext();
  contexts.push(offlineContext);
  const exportRequests = [], exportErrors = [];
  await offlineContext.route(/^https?:\/\//, (route) => { exportRequests.push(route.request().url()); return route.abort(); });
  const exportedPage = await offlineContext.newPage();
  exportedPage.on("pageerror", (error) => exportErrors.push(error.message));
  await exportedPage.goto(pathToFileURL(exportedPath).href, { waitUntil: "load" });
  assert.ok((await exportedPage.locator("body").textContent()).includes("<script>globalThis.workshopInjected = true</script>"));
  assert.equal(await exportedPage.evaluate(() => globalThis.workshopInjected), undefined);
  assert.equal(await exportedPage.locator('script, iframe, form, object, embed, img, link[rel="stylesheet"], meta[http-equiv="refresh"]').count(), 0);
  assert.equal(await exportedPage.locator('a[href^="javascript:"]').count(), 0);
  assert.deepEqual(exportRequests, []);
  assert.deepEqual(exportErrors, []);
  record("下載 HTML 真正離線開啟：惡意內容只係文字，無 scripts／remote assets");

  if (screenshots) {
    await second.page.locator("[data-example]").click();
    await second.page.waitForFunction(() => document.querySelector("#body").value.length > 0);
    for (const width of [1440, 390]) {
      await second.page.setViewportSize({ width, height: 1000 });
      await second.page.evaluate(async () => {
        scrollTo(0, 0);
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      await second.page.screenshot({ path: join(screenshots, `workshop-${width}.png`), fullPage: true });
    }
  }
  assert.deepEqual(errors, [], "工房唔應有未處理 JS exception");
  assert.deepEqual(cspErrors, [], "工房唔應違反實際 Worker CSP");
  assert.deepEqual(external, [], "Browser 唔應嘗試外站請求");
  assert.deepEqual(outbound, [], "Worker 唔應嘗試 upstream 請求");
  console.log(`完成 ${checks.length} 組真 browser 驗證；只用本地 staged Worker，未部署。`);
  if (screenshots) console.log(`Screenshots：${screenshots}`);
} finally {
  for (const context of contexts) await context.close();
  if (browser) await browser.close();
  if (mf) await mf.dispose();
  await rm(temporary, { recursive: true, force: true });
}
