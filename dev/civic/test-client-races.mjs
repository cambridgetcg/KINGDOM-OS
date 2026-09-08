// Run with Bun. Real Chrome DOM + synthetic, deferred transport only.
// No repo site output, production request, persisted identity or credential log.
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { projectDashboardData, renderDashboardPage } from "../../bin/build-dashboard.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const data = projectDashboardData({ generated: "synthetic-local-races", layers: [] });
const bundle = await Bun.build({ entrypoints: [`${root}pages-content/civic/dashboard.js`], target: "browser", format: "esm", write: false });
assert.equal(bundle.success, true, "client must bundle");
const js = await bundle.outputs[0].text();
const css = await Bun.file(`${root}pages-content/civic/dashboard.css`).text();
const assets = new Map([
  ["/meet/", [renderDashboardPage("meet", data), "text/html"]],
  ["/join/", [renderDashboardPage("join", data), "text/html"]],
  ["/civic/dashboard.js", [js, "text/javascript"]],
  ["/civic/dashboard.css", [css, "text/css"]],
]);
let browser;
const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch(request) {
  const asset = assets.get(new URL(request.url).pathname);
  return asset ? new Response(asset[0], { headers: { "Content-Type": asset[1], "Cache-Control": "no-store" } }) : new Response("Synthetic fixture only", { status: 404 });
} });
const origin = `http://127.0.0.1:${server.port}`;
let cleaning = false;
async function cleanup() {
  if (cleaning) return; cleaning = true;
  try { await browser?.close(); } finally { await server.stop(true); }
}
const stop = () => { void cleanup().finally(() => process.exit(130)); };
process.once("SIGINT", stop); process.once("SIGTERM", stop);
const watchdog = setTimeout(() => { console.error("FAIL client races exceeded local time bound"); void cleanup().finally(() => process.exit(1)); }, 120000);

const owner = "synthetic-owner", other = "synthetic-other";
function message(id, author = owner, parent = null, body = id) {
  return { id, author_id: author, author_name: author, parent_id: parent, body, kind: "offer", revision: 1, deleted: false, reply_count: 2, created_at: "2026-09-08T00:00:00Z", expires_at: "2026-12-07T00:00:00Z" };
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
function transport(initial = []) {
  let participant = { id: owner, display_name: "Synthetic owner" }, profile = null, citizenshipRevision = 0, serial = 0;
  const messages = structuredClone(initial), operations = new Map(), keys = [], calls = [], gates = [];
  function pause(match, drop = false, response = null) {
    const started = deferred(), release = deferred();
    const gate = { match, drop, response, started: started.promise, release: release.resolve, wait: release.promise, signal: started.resolve, used: false };
    gates.push(gate); return gate;
  }
  function respond(request, call) {
    const { method, path, parent, body } = call;
    if (path === "/status") return { protocol: "kingdom.civic/0.1", available: true, writable: true, policy: { version: "0.1" }, counts: { messages: messages.length, listed_citizens: profile?.listed ? 1 : 0 }, as_of: "synthetic-status" };
    if (path === "/me" && method === "GET") return participant ? { participant, citizenship: profile, citizenship_revision: citizenshipRevision, csrf: "synthetic-not-a-credential" } : { failure: 401 };
    if (path === "/me" && method === "DELETE") {
      participant = null; profile = null;
      messages.forEach((m) => { if (m.author_id === owner) Object.assign(m, { deleted: true, body: null, author_id: null, author_name: null }); });
      return { deleted: true };
    }
    if (path === "/me/citizenship" && method === "PUT") {
      profile = { ...body, revision: ++citizenshipRevision, updated_at: "synthetic-update" }; return { citizenship: profile };
    }
    if (path === "/messages" && method === "GET") {
      const items = messages.filter((m) => m.parent_id === parent);
      // Deliberately overlapping pages and duplicates exercise id-based merging.
      return { items: call.cursor ? [...items, ...items] : items, next_cursor: call.cursor ? null : "synthetic-next", as_of: "synthetic-page" };
    }
    if (path === "/messages" && method === "POST") {
      const key = request.headers()["idempotency-key"]; assert.ok(key, "write carries an operation key"); keys.push(key);
      if (operations.has(key)) return operations.get(key);
      const saved = message(`synthetic-saved-${++serial}`, owner, body.parent_id, body.body); saved.kind = body.kind;
      messages.unshift(saved); const result = { message: saved }; operations.set(key, structuredClone(result)); return result;
    }
    const id = path.replace(/^\/messages\//, ""), found = messages.find((m) => m.id === id);
    if (found && method === "GET") return { message: found };
    if (found && method === "PATCH") { Object.assign(found, { body: body.body, revision: found.revision + 1 }); return { message: found }; }
    if (found && method === "DELETE") { Object.assign(found, { deleted: true, body: null, author_id: null, author_name: null }); return { deleted: true }; }
    return { failure: 404 };
  }
  return {
    calls, pause, messages,
    sameRetryKey: () => keys.length === 2 && keys[0] === keys[1],
    releaseAll: () => gates.forEach((gate) => gate.release()),
    async handle(route) {
      const request = route.request(), url = new URL(request.url());
      const call = { method: request.method(), path: url.pathname.slice("/api/civic".length), parent: url.searchParams.get("parent_id"), cursor: url.searchParams.get("cursor"), body: request.postData() ? request.postDataJSON() : null };
      calls.push(call);
      // Capture/commit BEFORE waiting: this is a delayed old snapshot, not a later read.
      const result = structuredClone(respond(request, call));
      const gate = gates.find((g) => !g.used && g.match(call));
      if (gate) { gate.used = true; gate.signal(); await gate.wait; }
      if (gate?.drop) return route.abort("failed");
      if (gate?.response) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(gate.response) });
      return route.fulfill({ status: result.failure ?? 200, contentType: "application/json", body: JSON.stringify(result.failure ? { error: { code: "synthetic_unavailable", message: "synthetic read failed" } } : result) });
    },
  };
}
const topRead = (c) => c.method === "GET" && c.path === "/messages" && c.parent === null;
const replyRead = (c) => c.method === "GET" && c.path === "/messages" && c.parent !== null;
const post = (c) => c.method === "POST" && c.path === "/messages";
const card = (page, id) => page.locator(`[data-message-id="${id}"]`);
const action = (scope, name) => scope.getByRole("button", { name, exact: true });
async function idle(form) { await form.page().waitForFunction((node) => node.dataset.busy !== "true", await form.elementHandle()); }
async function compose(form, body) { await form.locator('[name="body"]').fill(body); await form.locator('[name="publish"]').check(); }
async function submit(form) { await form.locator('button[type="submit"]').click(); }
async function confirmDelete(page, control) { await control.click(); await page.locator('#civic-confirm button[value="confirm"]').click(); }
async function refresh(page) { await page.locator("#civic-refresh-messages").click(); await page.waitForFunction(() => !document.getElementById("civic-refresh-messages").disabled); }
async function replyRefresh(scope) { await scope.getByRole("button", { name: /^讀取 \/ 刷新回覆/ }).click(); await scope.page().waitForFunction((node) => !node.disabled, await scope.getByRole("button", { name: /^讀取 \/ 刷新回覆/ }).elementHandle()); }
async function sameNode(locator, name) { await locator.evaluate((node, key) => { window[key] = node; }, name); }
async function checkNode(locator, name) { assert.equal(await locator.evaluate((node, key) => window[key] === node, name), true, "inline DOM node retained"); }
async function watchErasure(page, erased) {
  await page.evaluate((texts) => {
    window.resurrections = 0;
    new MutationObserver(() => { if ([...document.querySelectorAll(".message-body")].some((node) => texts.some((text) => node.textContent.includes(text)))) window.resurrections++; }).observe(document.getElementById("civic-messages"), { subtree: true, childList: true, characterData: true });
  }, erased);
}
async function scenario(name, initial, run, path = "/meet/") {
  const context = await browser.newContext(), mock = transport(initial), errors = [];
  context.setDefaultTimeout(5000);
  await context.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort("blockedbyclient"));
  await context.route(`${origin}/api/civic/**`, (route) => mock.handle(route));
  const page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(`${origin}${path}`);
    await page.waitForFunction(() => document.getElementById("civic-account-status").textContent.includes("已恢復"));
    if (path === "/meet/") await page.waitForFunction(() => document.getElementById("civic-messages-status").textContent.includes("as-of"));
    await run(page, mock);
    assert.deepEqual(errors, [], "no browser script errors");
    console.log(`PASS ${name}`);
  } finally { mock.releaseAll(); await context.close(); }
}

try {
  const chrome = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  await access(chrome);
  browser = await chromium.launch({ executablePath: chrome, headless: true });
  await scenario("top POST preserves newer fields and does not call unsent B published", [], async (page, mock) => {
    const form = page.locator("#civic-message-form"), gate = mock.pause(post);
    await compose(form, "submitted A"); await submit(form); await gate.started;
    await form.locator('[name="body"]').fill("unsent B"); await form.locator('[name="kind"]').selectOption("seek"); gate.release(); await idle(form);
    assert.equal(await form.locator('[name="body"]').inputValue(), "unsent B");
    assert.equal(await form.locator('[name="kind"]').inputValue(), "seek");
    assert.equal(await form.locator('[name="publish"]').isChecked(), false);
    assert.match(await form.locator(".form-result").innerText(), /未送出草稿/);
    assert.equal(await card(page, "synthetic-saved-1").locator(":scope > .message-body").innerText(), "submitted A");
    assert.equal(mock.calls.find(post).body.body, "submitted A");
  });
  await scenario("changing back to A is still a newer DOM draft version", [], async (page, mock) => {
    const form = page.locator("#civic-message-form"), gate = mock.pause(post);
    await compose(form, "submitted A"); await submit(form); await gate.started;
    await form.locator('[name="body"]').fill("temporary B"); await form.locator('[name="body"]').fill("submitted A"); gate.release(); await idle(form);
    assert.equal(await form.locator('[name="body"]').inputValue(), "submitted A"); assert.equal(await form.getAttribute("data-dirty"), "true");
  });
  await scenario("membership PUT and later restore preserve pending profile fields", [], async (page, mock) => {
    const form = page.locator("#civic-citizenship-form"), gate = mock.pause((c) => c.method === "PUT");
    await form.locator('[name="display_name"]').fill(" saved A "); await form.locator('[name="becoming"]').fill("profile A"); await form.locator('[name="declare"]').check();
    await submit(form); await gate.started;
    await form.locator('[name="becoming"]').fill("profile B unsent"); await form.locator('[name="listed"]').check(); gate.release(); await idle(form);
    assert.equal(await form.locator('[name="display_name"]').inputValue(), "saved A");
    assert.equal(await form.locator('[name="becoming"]').inputValue(), "profile B unsent"); assert.equal(await form.locator('[name="listed"]').isChecked(), true);
    assert.equal(await form.locator('[name="declare"]').isChecked(), false); assert.match(await form.locator(".form-result").innerText(), /未送出草稿/);
    await page.locator("#civic-restore").click(); await page.waitForFunction(() => !document.getElementById("civic-restore").disabled);
    assert.equal(await form.locator('[name="becoming"]').inputValue(), "profile B unsent"); assert.match(await page.locator("#civic-own-profile").innerText(), /profile A/);
  }, "/join/");
  await scenario("inline replies and edits preserve B through save and keyed refresh", [message("own-top")], async (page, mock) => {
    const thread = card(page, "own-top"); await action(thread, "寫一層回覆").click();
    const reply = thread.locator(".message-replies > form"), replyGate = mock.pause(post);
    await compose(reply, "reply A"); await submit(reply); await replyGate.started; await reply.locator("textarea").fill("reply B unsent"); replyGate.release(); await idle(reply);
    assert.equal(await reply.locator("textarea").inputValue(), "reply B unsent"); assert.match(await reply.locator(".form-result").innerText(), /未送出草稿/);
    await action(thread, "修改自己內容").first().click(); const edit = thread.locator(":scope > form"), editGate = mock.pause((c) => c.method === "PATCH");
    await compose(edit, "edit A"); await submit(edit); await editGate.started; await edit.locator("textarea").fill("edit B unsent"); editGate.release(); await idle(edit);
    await sameNode(edit.locator("textarea"), "editDraft"); await refresh(page);
    assert.equal(await edit.locator("textarea").inputValue(), "edit B unsent"); await checkNode(edit.locator("textarea"), "editDraft");
    assert.equal(await reply.locator("textarea").inputValue(), "reply B unsent"); assert.equal(await thread.locator(":scope > .message-body").innerText(), "edit A");
    assert.equal(await edit.locator('[name="publish"]').isChecked(), false);
  });
  await scenario("DELETE message invalidates delayed top GET and preserves another thread draft", [message("own-top", owner, null, "ERASE TOP"), message("other-top", other)], async (page, mock) => {
    const otherThread = card(page, "other-top"); await action(otherThread, "寫一層回覆").click(); const draft = otherThread.locator("textarea"); await draft.fill("keep other thread draft"); await sameNode(draft, "otherDraft");
    const gate = mock.pause(topRead); await page.locator("#civic-refresh-messages").click(); await gate.started;
    await confirmDelete(page, action(card(page, "own-top"), "刪除自己內容")); await page.waitForFunction(() => ![...document.querySelectorAll(".message-body")].some((n) => n.textContent.includes("ERASE TOP")));
    await watchErasure(page, ["ERASE TOP"]); gate.release(); await page.waitForFunction(() => !document.getElementById("civic-refresh-messages").disabled);
    assert.equal(await page.evaluate(() => window.resurrections), 0); assert.equal(mock.calls.filter(topRead).length, 3);
    assert.equal(await draft.inputValue(), "keep other thread draft"); await checkNode(draft, "otherDraft");
  });
  await scenario("invalid replacement read keeps redaction and drafts, then allows manual recovery", [message("own-top", owner, null, "ERASE TOP"), message("other-top", other)], async (page, mock) => {
    const thread = card(page, "other-top"); await action(thread, "寫一層回覆").click(); const draft = thread.locator("textarea"); await draft.fill("keep despite read failure");
    const old = mock.pause(topRead), invalid = mock.pause(topRead, false, { items: "not a page", next_cursor: null });
    await page.locator("#civic-refresh-messages").click(); await old.started;
    await confirmDelete(page, action(card(page, "own-top"), "刪除自己內容")); await page.waitForFunction(() => ![...document.querySelectorAll(".message-body")].some((n) => n.textContent.includes("ERASE TOP")));
    await watchErasure(page, ["ERASE TOP"]); old.release(); await invalid.started; invalid.release();
    await page.waitForFunction(() => !document.getElementById("civic-refresh-messages").disabled);
    assert.match(await page.locator("#civic-messages-status").innerText(), /未能讀取留言/); assert.equal(await page.locator("#civic-messages-status").getAttribute("data-error"), "true");
    assert.equal(await draft.inputValue(), "keep despite read failure"); assert.equal(await page.evaluate(() => window.resurrections), 0);
    await refresh(page); assert.equal(await page.locator("#civic-messages-status").getAttribute("data-error"), "false"); assert.equal(await draft.inputValue(), "keep despite read failure");
  });
  await scenario("DELETE reply invalidates delayed reply refresh without losing siblings", [message("own-top"), message("own-reply", owner, "own-top", "ERASE REPLY"), message("other-reply", other, "own-top", "KEEP REPLY")], async (page, mock) => {
    const thread = card(page, "own-top"); await replyRefresh(thread);
    const gate = mock.pause(replyRead); await thread.getByRole("button", { name: /^讀取 \/ 刷新回覆/ }).click(); await gate.started;
    await confirmDelete(page, action(card(page, "own-reply"), "刪除自己內容")); await page.waitForFunction(() => ![...document.querySelectorAll(".message-body")].some((n) => n.textContent.includes("ERASE REPLY")));
    await watchErasure(page, ["ERASE REPLY"]); gate.release();
    await page.waitForFunction(() => ![...document.querySelectorAll("button")].find((n) => n.textContent.startsWith("讀取 / 刷新回覆")).disabled);
    assert.equal(await page.evaluate(() => window.resurrections), 0); assert.equal(mock.calls.filter(replyRead).length, 3); assert.match(await thread.innerText(), /KEEP REPLY/);
  });
  await scenario("DELETE me invalidates simultaneous top and reply snapshots and preserves other draft", [message("own-top", owner, null, "ERASE OWNER TOP"), message("other-top", other), message("own-reply", owner, "other-top", "ERASE OWNER REPLY"), message("other-reply", other, "other-top", "KEEP OTHER REPLY")], async (page, mock) => {
    const thread = card(page, "other-top"); await replyRefresh(thread); await action(thread, "寫一層回覆").click(); const draft = thread.locator(".message-replies > form textarea"); await draft.fill("keep after account deletion"); await sameNode(draft, "accountDraft");
    const topGate = mock.pause(topRead), replyGate = mock.pause(replyRead);
    await page.locator("#civic-refresh-messages").click(); await topGate.started;
    await thread.getByRole("button", { name: /^讀取 \/ 刷新回覆/ }).click(); await replyGate.started;
    await confirmDelete(page, page.locator("#civic-delete-me")); await page.waitForFunction(() => document.getElementById("civic-account-status").textContent.includes("已刪除自己內容"));
    await watchErasure(page, ["ERASE OWNER TOP", "ERASE OWNER REPLY"]); topGate.release(); replyGate.release();
    await page.waitForFunction(() => !document.getElementById("civic-refresh-messages").disabled && ![...document.querySelectorAll("button")].some((n) => n.textContent.startsWith("讀取 / 刷新回覆") && n.disabled));
    assert.equal(await page.evaluate(() => window.resurrections), 0); assert.equal(mock.calls.filter(topRead).length, 3); assert.equal(mock.calls.filter(replyRead).length, 3);
    assert.equal(await draft.inputValue(), "keep after account deletion"); await checkNode(draft, "accountDraft"); assert.match(await thread.innerText(), /KEEP OTHER REPLY/);
    assert.equal(await draft.isDisabled(), true);
  });
  await scenario("lost top POST + refresh + same-key retry upserts id and retains inline draft", [], async (page, mock) => {
    const form = page.locator("#civic-message-form"), gate = mock.pause(post, true);
    await compose(form, "uncertain top"); await submit(form); await gate.started; gate.release(); await idle(form); assert.match(await form.locator(".form-result").innerText(), /未確認/);
    await refresh(page); const saved = card(page, "synthetic-saved-1"); await action(saved, "修改自己內容").click(); const draft = saved.locator(":scope > form textarea"); await draft.fill("keep inline edit"); await sameNode(draft, "retryTopDraft");
    await submit(form); await idle(form); assert.equal(mock.sameRetryKey(), true); assert.equal(await saved.count(), 1); assert.equal(await draft.inputValue(), "keep inline edit"); await checkNode(draft, "retryTopDraft");
    await page.locator("#civic-more-messages").click(); await page.waitForFunction(() => !document.getElementById("civic-more-messages").disabled); assert.equal(await saved.count(), 1); await checkNode(draft, "retryTopDraft");
    await refresh(page); assert.equal(await saved.count(), 1); await checkNode(draft, "retryTopDraft");
  });
  await scenario("lost reply POST + reply refresh + retry and overlapping pagination preserve one card", [message("other-top", other)], async (page, mock) => {
    const thread = card(page, "other-top"); await action(thread, "寫一層回覆").click(); const form = thread.locator(".message-replies > form"), gate = mock.pause(post, true);
    await compose(form, "uncertain reply"); await submit(form); await gate.started; gate.release(); await idle(form);
    await replyRefresh(thread); const saved = card(page, "synthetic-saved-1"); await action(saved, "修改自己內容").click(); const draft = saved.locator("textarea"); await draft.fill("keep reply edit"); await sameNode(draft, "retryReplyDraft");
    await submit(form); await idle(form); assert.equal(mock.sameRetryKey(), true); assert.equal(await saved.count(), 1); await checkNode(draft, "retryReplyDraft");
    await action(thread, "讀取更多回覆").click(); await page.waitForFunction(() => ![...document.querySelectorAll("button")].find((n) => n.textContent === "讀取更多回覆").disabled);
    assert.equal(await saved.count(), 1); assert.equal(await draft.inputValue(), "keep reply edit"); await checkNode(draft, "retryReplyDraft");
    await replyRefresh(thread); assert.equal(await saved.count(), 1); await checkNode(draft, "retryReplyDraft");
  });
  console.log("PASS 10 isolated real-DOM deferred-response scenarios; no production requests or site output");
} finally {
  clearTimeout(watchdog); process.removeListener("SIGINT", stop); process.removeListener("SIGTERM", stop); await cleanup();
}
