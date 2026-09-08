import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const base = new URL(process.argv[2] ?? "http://localhost:8797");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Browser fixtures 只准本地 server，唔寫 production");
const output = resolve(root, ".civic-test-artifacts/browser");
await mkdir(output, { recursive: true });
const checks = [], errors = [], cspErrors = [];
const record = (name) => { checks.push(name); console.log(`✓ ${name}`); };
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const contexts = [];
async function context(options = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", ...options });
  contexts.push(ctx);
  // 真 Pages/D1 仍經 socket；只封鎖 browser 外站及與本次 UI 無關嘅外部 census。
  await ctx.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== base.origin) return route.abort();
    if (url.pathname === "/kingdom.json") return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "本地 browser fixture 未讀外部 census" }) });
    return route.continue();
  });
  ctx.on("page", (page) => {
    page.setDefaultTimeout(15000);
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error" && /Content Security Policy|Refused to (?:load|execute|connect)/i.test(message.text())) cspErrors.push(message.text()); });
  });
  return ctx;
}
async function visit(page, path) {
  const response = await page.goto(new URL(path, base).href, { waitUntil: "networkidle" });
  assert.ok(response?.ok(), `本地頁面 ${path} 未成功`);
  await page.locator("#civic-service-status").waitFor();
  await page.waitForFunction(() => /可讀寫/.test(document.querySelector("#civic-service-status")?.textContent ?? ""));
}
async function mutation(page, method, path, action) {
  const waiting = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/civic${path}` && response.request().method() === method);
  await action();
  const response = await waiting, data = await response.json();
  assert.ok(response.ok(), `${method} ${path} → ${response.status()} ${data?.error?.code ?? ""}`);
  return data;
}
async function createParticipant(page, name) {
  const form = page.locator("#civic-participant-form");
  await form.locator("button[type=submit]").waitFor();
  await page.waitForFunction(() => !document.querySelector("#civic-participant-form button[type=submit]").disabled);
  await form.locator('[name="display_name"]').fill(name);
  assert.equal(await form.locator('[name="acknowledge_control"]').isChecked(), false);
  await form.locator('[name="acknowledge_control"]').check();
  const data = await mutation(page, "POST", "/participants", () => form.locator("button[type=submit]").click());
  await page.waitForFunction(() => document.querySelector("#civic-self-actions")?.hidden === false);
  return data.participant;
}
async function confirm(page) { await page.locator('#civic-confirm button[value="confirm"]').click(); }
async function ownState(page) { return page.evaluate(async () => (await fetch("/api/civic/me", { cache: "no-store" })).json()); }
async function noOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(dimensions.document <= dimensions.viewport + 1, `${label} 水平 overflow: ${JSON.stringify(dimensions)}`);
}

try {
  const publicContext = await context();
  const publicPage = await publicContext.newPage();
  for (const width of [1440, 768, 390, 320]) {
    await publicPage.setViewportSize({ width, height: 1000 });
    for (const [path, name] of [["/", "explore"], ["/meet/", "meet"], ["/citizens/", "citizens"], ["/join/", "join"]]) {
      await visit(publicPage, path);
      await noOverflow(publicPage, `${name}/${width}`);
      await publicPage.screenshot({ path: resolve(output, `${name}-${width}.png`), fullPage: true });
      if (name === "explore") assert.equal(await publicPage.locator("#civic-place-list").isVisible(), width <= 600);
      if (name === "join") assert.equal(await publicPage.locator('#civic-citizenship-form [name="listed"]').isChecked(), false);
    }
  }
  assert.equal((await publicContext.cookies()).some((cookie) => cookie.name === "__Host-kingdom-civic"), false);
  record("四個頁面 × 1440/768/390/320 無水平 overflow；只瀏覽唔建立控制 cookie");

  await publicPage.setViewportSize({ width: 1440, height: 1000 });
  await visit(publicPage, "/");
  const first = publicPage.locator("#civic-map [data-node]").first();
  const selectedId = await first.getAttribute("data-node");
  await first.focus(); await publicPage.keyboard.press("Enter");
  assert.equal(new URL(publicPage.url()).hash, `#${selectedId}`);
  await publicPage.keyboard.press("ArrowRight");
  assert.notEqual(await publicPage.evaluate(() => document.activeElement?.getAttribute("data-node")), selectedId);
  await publicPage.locator('#civic-map-filter [name="q"]').fill("not-a-kingdom-fixture-987654321");
  assert.equal(await publicPage.locator("#civic-map-empty").isVisible(), true);
  await visit(publicPage, "/meet/");
  await visit(publicPage, `/#${selectedId}`);
  assert.equal(await publicPage.locator(`#civic-map [data-node="${selectedId}"]`).getAttribute("aria-pressed"), "true");
  const legacy = await publicPage.locator("#civic-data").evaluate((el) => JSON.parse(el.textContent).legacyAnchors[0]);
  assert.ok(legacy);
  await visit(publicPage, "/meet/");
  await publicPage.goto(new URL(`/#${encodeURIComponent(legacy)}`, base).href);
  await publicPage.waitForURL((url) => url.pathname === "/atlas.html" && decodeURIComponent(url.hash.slice(1)) === legacy);
  record("地圖 keyboard、搜尋空集合、分享選取同 legacy fragment 導向實際運作");

  const noJs = await context({ javaScriptEnabled: false });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(new URL("/", base).href);
  assert.ok(await noJsPage.locator('[data-select]').count() > 0);
  assert.equal(await noJsPage.locator('[data-select]').first().isVisible(), true);
  assert.ok(await noJsPage.locator('a[href^="/atlas.html"]').count() > 0);
  record("停用 JavaScript 仍有靜態項目清單同研究館入口");

  const aliceContext = await context(), bobContext = await context();
  const alice = await aliceContext.newPage(), bob = await bobContext.newPage();
  const name = `本地 Browser fixture ${Date.now()}`;
  await visit(alice, "/join/");
  const aliceParticipant = await createParticipant(alice, name);
  const cookies = await aliceContext.cookies();
  const control = cookies.find((cookie) => cookie.name === "__Host-kingdom-civic");
  assert.ok(control?.httpOnly && control.secure && control.sameSite === "Strict");
  assert.equal(await alice.evaluate(() => document.cookie.includes("__Host-kingdom-civic")), false);
  const profile = alice.locator("#civic-citizenship-form");
  await profile.locator('[name="becoming"]').fill("本地測試，唔係 production 公民");
  await profile.locator('[name="offer"]').fill("驗證真正頁面");
  await profile.locator('[name="seek"]').fill("確認退出有用");
  await profile.locator('[name="listed"]').check();
  await profile.locator('[name="declare"]').check();
  await profile.locator("[data-preview]").click();
  assert.match(await profile.locator(".preview").textContent(), /本地測試/);
  await mutation(alice, "PUT", "/me/citizenship", () => profile.locator("button[type=submit]").click());
  await visit(publicPage, "/citizens/");
  await publicPage.waitForFunction((name) => document.querySelector("#civic-citizens")?.textContent.includes(name), name);
  record("Browser 真 cookie 控制權、明確宣告、預覽同 opt-in 公開列名完成");

  await visit(alice, "/meet/");
  const postForm = alice.locator("#civic-message-form");
  const originalBody = '本地測試 <script>globalThis.injected=true</script> — 只係純文字';
  await postForm.locator('[name="body"]').fill(originalBody);
  await postForm.locator('[name="publish"]').check();
  let dropped = false, firstPostId = null, firstOperationKey = null;
  await alice.route("**/api/civic/messages", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const key = route.request().headers()["idempotency-key"];
    if (!dropped) {
      dropped = true; firstOperationKey = key;
      const saved = await route.fetch();
      assert.ok(saved.ok(), "故障 fixture 前嘅真正 D1 寫入要成功");
      firstPostId = (await saved.json()).message.id;
      return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "fixture_response_lost", message: "本地測試：寫入後回應遺失。" } }) });
    }
    assert.equal(key, firstOperationKey, "同一份草稿重試必須沿用操作匙");
    return route.fallback();
  });
  const lostResponse = alice.waitForResponse((response) => new URL(response.url()).pathname === "/api/civic/messages" && response.request().method() === "POST");
  await postForm.locator("button[type=submit]").click();
  assert.equal((await lostResponse).status(), 503);
  await alice.waitForFunction(() => document.querySelector("#civic-message-form .form-result")?.textContent.includes("fixture_response_lost"));
  assert.equal(await postForm.locator('[name="body"]').inputValue(), originalBody);
  const { message: post } = await mutation(alice, "POST", "/messages", () => postForm.locator("button[type=submit]").click());
  assert.equal(post.id, firstPostId);
  await alice.unroute("**/api/civic/messages");
  record("真正 D1 已寫入後模擬丟失回應：草稿保留、手動重試沿用 key、冇重複發帖");
  const postCard = alice.locator(`#civic-thread-${post.id}`);
  await postCard.waitFor();
  assert.equal(await postCard.locator(".message-body").first().textContent(), originalBody);
  assert.equal(await alice.evaluate(() => globalThis.injected), undefined);
  await visit(bob, "/meet/");
  const bobParticipant = await createParticipant(bob, name);
  assert.notEqual(aliceParticipant.id, bobParticipant.id);
  assert.equal((await ownState(bob)).citizenship, null);
  const bobPost = bob.locator(`#civic-thread-${post.id}`);
  assert.equal(await bobPost.getByRole("button", { name: "修改自己內容", exact: true }).isVisible(), false);
  await bobPost.getByRole("button", { name: "寫一層回覆", exact: true }).click();
  const replyForm = bobPost.locator("form");
  await replyForm.locator('[name="body"]').fill("第二個 browser：未入籍，一樣可以回覆。");
  await replyForm.locator('[name="publish"]').check();
  const { message: reply } = await mutation(bob, "POST", "/messages", () => replyForm.locator("button[type=submit]").click());
  await alice.reload({ waitUntil: "networkidle" });
  await postCard.getByRole("button", { name: /讀取 \/ 刷新回覆/ }).click();
  await alice.locator(`#civic-thread-${reply.id}`).waitFor();
  record("真帖文跨 browser／重載持久，純文字唔執行 HTML；同名訪客可以回覆而唔能改他人內容");

  await postCard.getByRole("button", { name: "修改自己內容", exact: true }).click();
  const editForm = postCard.locator("form");
  await editForm.locator('[name="body"]').fill("本地測試：已自行修改。");
  await editForm.locator('[name="publish"]').check();
  await mutation(alice, "PATCH", `/messages/${post.id}`, () => editForm.locator("button[type=submit]").click());
  await alice.waitForFunction((id) => document.querySelector(`#civic-thread-${id} > .message-body`)?.textContent === "本地測試：已自行修改。", post.id);
  await visit(alice, "/join/");
  await mutation(alice, "DELETE", "/me/citizenship", async () => { await alice.locator("#civic-withdraw").click(); await confirm(alice); });
  await alice.waitForFunction(() => document.querySelector("#civic-withdraw")?.hidden === true);
  assert.equal((await ownState(alice)).citizenship, null);
  await visit(publicPage, "/citizens/");
  assert.equal(await publicPage.locator("#civic-citizens").getByText(name, { exact: true }).count(), 0);
  const retained = await alice.evaluate(async (id) => (await fetch(`/api/civic/messages/${id}`)).json(), post.id);
  assert.equal(retained.message.deleted, false);
  record("自己修改成功；退出清 profile，但獨立留言保留");

  await mutation(alice, "DELETE", "/me", async () => { await alice.locator("#civic-delete-me").click(); await confirm(alice); });
  await visit(bob, "/meet/");
  await bobPost.waitFor();
  assert.match(await bobPost.locator(".message-body").first().textContent(), /正文已清除/);
  await bobPost.getByRole("button", { name: /讀取 \/ 刷新回覆/ }).click();
  const bobReply = bob.locator(`#civic-thread-${reply.id}`);
  await bobReply.waitFor();
  await bobReply.getByRole("button", { name: "修改自己內容", exact: true }).click();
  const survivingEdit = bobReply.locator("form");
  await survivingEdit.locator('[name="body"]').fill("父帖已刪；仍然可以改返自己嘅回覆。");
  await survivingEdit.locator('[name="publish"]').check();
  await mutation(bob, "PATCH", `/messages/${reply.id}`, () => survivingEdit.locator("button[type=submit]").click());
  await bob.waitForFunction((id) => document.querySelector(`#civic-thread-${id} > .message-body`)?.textContent.includes("仍然可以改返"), reply.id);
  await mutation(bob, "DELETE", `/messages/${reply.id}`, async () => { await bobReply.getByRole("button", { name: "刪除自己內容", exact: true }).click(); await confirm(bob); });
  await mutation(bob, "DELETE", "/me", async () => { await bob.locator("#civic-delete-me").click(); await confirm(bob); });
  assert.equal((await aliceContext.cookies()).some((cookie) => cookie.name === "__Host-kingdom-civic"), false);
  record("刪除全部自己內容撤銷 cookie、保留他人回覆；回覆作者亦可以自助刪除");

  assert.deepEqual(errors, [], "Browser 唔應有未處理 JS exception");
  assert.deepEqual(cspErrors, [], "新頁面唔應違反 CSP");
  record("Browser JS exception 0，CSP error 0，reduced-motion 已選用");
  await writeFile(resolve(output, "results.json"), JSON.stringify({ checked_at: new Date().toISOString(), base: base.origin, checks, production_tested: false, external_census: "blocked by browser fixture", screenshots: "16 full-page PNG files" }, null, 2));
  console.log(`完成 ${checks.length} 組實際 Browser 驗證；screenshots：${output}`);
} finally {
  for (const ctx of contexts) await ctx.close();
  await browser.close();
}
