import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Miniflare, Log, LogLevel } from "miniflare";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const temporary = await mkdtemp(resolve(tmpdir(), "kingdom-civic-runtime-"));
const integrated = process.argv.includes("--integrated");
const checks = [];
const record = (name) => { checks.push(name); console.log(`✓ ${name}`); };
const schema = JSON.parse(await readFile(resolve(root, "schemas/civic-v0.1.schema.json"), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true, strictTypes: false });
addFormats(ajv);
ajv.addSchema(schema);
const validators = new Map();
let validatedResponses = 0;
function validateWire(data, route, definition = "response") {
  if (!validators.has(definition)) validators.set(definition, ajv.compile({ $ref: `${schema.$id}#/$defs/${definition}` }));
  const validate = validators.get(definition);
  // 只報 schema 路徑，唔將 token 或私有回應寫入測試日誌。
  assert.equal(validate(data), true, `${route} schema: ${ajv.errorsText(validate.errors)}`);
  validatedResponses++;
}
function responseDefinition(method, path, ok) {
  const pathname = path.split("?")[0];
  if (pathname === "/status") return "statusResponse";
  if (!ok) return "errorResponse";
  if (method === "DELETE") return pathname === "/me/citizenship" ? "withdrawnResponse" : "deletedResponse";
  if (pathname === "/participants") return "participantResponse";
  if (pathname === "/me") return "meResponse";
  if (pathname === "/me/citizenship" || pathname.startsWith("/citizens/")) return "citizenshipResponse";
  if (pathname === "/citizens") return "citizensResponse";
  if (pathname === "/messages" && method === "GET") return "messagesResponse";
  if (pathname === "/messages" || pathname.startsWith("/messages/")) return "messageResponse";
  if (pathname === "/moderation") return "moderationResponse";
  throw new Error(`未有列明 wire shape：${method} ${path}`);
}
let mf;
let unavailable;

try {
  const entry = resolve(temporary, "entry.js");
  const bundle = resolve(temporary, "worker.js");
  const source = integrated ? resolve(root, "pages-functions/_worker.js") : resolve(root, "pages-functions/civic.js");
  await writeFile(entry, integrated
    ? `import { createKingdomWorker } from ${JSON.stringify(source)}; export default createKingdomWorker();\n`
    : `import { handleCivicRequest } from ${JSON.stringify(source)}; export default { async fetch(request,env) { return await handleCivicRequest(request,env) ?? new Response("not found",{status:404}); } };\n`);
  const built = spawnSync("bun", ["build", entry, "--target=browser", "--format=esm", "--outfile", bundle], { cwd: root, encoding: "utf8" });
  assert.equal(built.status, 0, `本地 fixture bundle 失敗：${built.stderr}`);
  const moderator = randomBytes(48).toString("base64url");
  const common = {
    cf: false,
    log: new Log(LogLevel.ERROR),
    modules: true,
    modulesRoot: temporary,
    scriptPath: bundle,
    compatibilityDate: "2026-07-30",
    bindings: {
      CIVIC_ENABLED: "true", CIVIC_LOCAL: "true",
      CIVIC_HMAC_SECRET: randomBytes(48).toString("base64url"),
      CIVIC_MODERATOR_SECRET: moderator,
    },
    outboundService: () => new Response("本地 fixture 禁止外部網絡", { status: 503 }),
    serviceBindings: { ASSETS: () => new Response("asset fixture", { status: 404 }) },
  };
  unavailable = new Miniflare(common);
  const down = await unavailable.dispatchFetch("http://localhost/api/civic/status");
  assert.equal(down.status, 503);
  const downData = await down.json();
  validateWire(downData, "unavailable status", "statusResponse");
  assert.equal(downData.available, false);
  assert.equal(downData.writable, false);
  record("缺 D1 binding 明確不可用，唔回假數據");
  await unavailable.dispose();
  unavailable = undefined;

  mf = new Miniflare({ ...common, d1Databases: { KINGDOM_CIVIC_DB: randomUUID() } });
  const db = await mf.getD1Database("KINGDOM_CIVIC_DB");
  const migration = await readFile(resolve(root, "migrations/0001_civic.sql"), "utf8");
  // D1 exec 以換行分 command；呢份 migration 嘅 comments 獨佔一行，trigger 要保持一個 SQL command。
  await db.exec(migration.split("\n").filter((line) => !line.trimStart().startsWith("--")).join(" "));

  const api = async (method, path, { body, token, cookie, csrf, key, revision, origin, expected } = {}) => {
    const headers = new Headers();
    if (body !== undefined || !["GET", "HEAD"].includes(method)) headers.set("content-type", "application/json");
    if (token) headers.set("authorization", `Bearer ${token}`);
    if (cookie) headers.set("cookie", cookie);
    if (csrf) headers.set("x-civic-csrf", csrf);
    if (origin) headers.set("origin", origin);
    if (!["GET", "HEAD"].includes(method)) headers.set("idempotency-key", key ?? randomUUID());
    if (revision !== undefined) headers.set("if-match", `"${revision}"`);
    const response = await mf.dispatchFetch(`http://localhost/api/civic${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = method === "HEAD" ? null : await response.json();
    if (data !== null) validateWire(data, `${method} ${path}`, responseDefinition(method, path, response.ok));
    if (expected !== undefined) assert.equal(response.status, expected, `${method} ${path}: ${data?.error?.code ?? "unexpected response"}`);
    assert.equal(response.headers.get("cache-control"), "no-store", `${path} 必須 no-store`);
    return { response, data };
  };
  const { data: status } = await api("GET", "/status", { expected: 200 });
  assert.equal(status.available, true);
  assert.equal(status.writable, true);
  assert.equal(status.counts.listed_citizens, 0);
  record("真 Miniflare D1 migration 完成，空服務同未知狀態分開");

  const bootstrap = async (display_name, mode = "bearer") => api("POST", "/participants", {
    body: { display_name, mode, acknowledge_control: true }, origin: mode === "cookie" ? "http://localhost" : undefined, expected: 201,
  });
  const alice = (await bootstrap("Local fixture 同名")).data;
  const bob = (await bootstrap("Local fixture 同名")).data;
  assert.ok(typeof alice.token === "string" && alice.token.length >= 32, "一次性控制匙存在");
  assert.notEqual(alice.participant.id, bob.participant.id);
  record("同名 participant 可以並存，唔冒認同一身份");

  const me = async (token) => (await api("GET", "/me", { token, expected: 200 })).data;
  const profile = (listed) => ({ display_name: "本地測試同行", becoming: "認識一個地方", offer: "寫測試", seek: "同行", contact_url: "https://example.test/hello", listed, declare: true, consent_version: "0.1" });
  let aliceMe = await me(alice.token);
  await api("PUT", "/me/citizenship", { token: alice.token, revision: aliceMe.citizenship_revision, body: profile(true), expected: 200 });
  const aliceProfile = (await me(alice.token)).citizenship;
  let listed = (await api("GET", "/citizens", { expected: 200 })).data.items;
  assert.equal(listed.length, 1);
  assert.equal(listed[0].id, aliceProfile.id);
  record("自願入籍持久保存，公開同意先進目錄");

  const firstKey = randomUUID();
  const post = { kind: "introduction", body: '本地 fixture <script>alert("不是 HTML")</script>', parent_id: null, publish: true, consent_version: "0.1" };
  const first = (await api("POST", "/messages", { token: alice.token, key: firstKey, body: post, expected: 201 })).data.message;
  const repeated = await api("POST", "/messages", { token: alice.token, key: firstKey, body: post });
  assert.ok([200, 201].includes(repeated.response.status));
  assert.equal(repeated.data.message.id, first.id);
  assert.equal((await api("GET", "/messages", { expected: 200 })).data.items.length, 1);
  const conflicting = await api("POST", "/messages", { token: alice.token, key: firstKey, body: { ...post, body: "changed" } });
  assert.equal(conflicting.response.status, 409);
  record("真 D1 idempotency 唔重複發帖，衝突 payload 被拒絕");

  const reply = (await api("POST", "/messages", { token: bob.token, body: { ...post, body: "訪客亦可以回覆", parent_id: first.id }, expected: 201 })).data.message;
  assert.equal((await me(bob.token)).citizenship, null);
  const nested = await api("POST", "/messages", { token: bob.token, body: { ...post, parent_id: reply.id } });
  assert.ok(nested.response.status >= 400 && nested.response.status < 500);
  const wrongOwner = await api("PATCH", `/messages/${first.id}`, { token: bob.token, revision: first.revision, body: { body: "越權", publish: true, consent_version: "0.1" } });
  assert.equal(wrongOwner.response.status, 403);
  record("訪客可回覆；只容許一層，同時拒絕越權修改");

  aliceMe = await me(alice.token);
  const competing = await Promise.all([
    api("PUT", "/me/citizenship", { token: alice.token, revision: aliceMe.citizenship_revision, body: { ...profile(true), becoming: "方向 A" } }),
    api("PUT", "/me/citizenship", { token: alice.token, revision: aliceMe.citizenship_revision, body: { ...profile(true), becoming: "方向 B" } }),
  ]);
  assert.equal(competing.filter((result) => result.response.status === 200).length, 1);
  assert.equal(competing.filter((result) => [409, 412].includes(result.response.status)).length, 1);
  record("並發 revision 更新只有一份成功，唔靜默覆蓋");

  let bobMe = await me(bob.token);
  await api("PUT", "/me/citizenship", { token: bob.token, revision: bobMe.citizenship_revision, body: profile(false), expected: 200 });
  bobMe = await me(bob.token);
  await api("GET", `/citizens/${bobMe.citizenship.id}`, { expected: 404 });
  assert.equal((await api("GET", "/citizens", { expected: 200 })).data.items.length, 1);
  record("不公開列名嘅公民唔經 detail／list 洩漏");

  const browser = await bootstrap("Cookie 本地 fixture", "cookie");
  assert.equal(browser.data.token, undefined);
  const setCookie = browser.response.headers.get("set-cookie");
  assert.ok(setCookie && /HttpOnly/i.test(setCookie) && /Secure/i.test(setCookie) && /SameSite=Strict/i.test(setCookie));
  const cookie = setCookie.split(";")[0];
  const browserMe = (await api("GET", "/me", { cookie, expected: 200 })).data;
  assert.ok(typeof browserMe.csrf === "string");
  const missingCsrf = await api("PUT", "/me/citizenship", { cookie, origin: "http://localhost", revision: browserMe.citizenship_revision, body: profile(false) });
  assert.equal(missingCsrf.response.status, 403);
  const crossOrigin = await api("PUT", "/me/citizenship", { cookie, csrf: browserMe.csrf, origin: "https://example.test", revision: browserMe.citizenship_revision, body: profile(false) });
  assert.equal(crossOrigin.response.status, 403);
  await api("PUT", "/me/citizenship", { cookie, csrf: browserMe.csrf, origin: "http://localhost", revision: browserMe.citizenship_revision, body: profile(false), expected: 200 });
  const mixed = await api("GET", "/me", { cookie, token: alice.token });
  assert.ok(mixed.response.status >= 400 && mixed.response.status < 500);
  record("Cookie 真正 HttpOnly／Secure；同源 CSRF 同混合憑證界線生效");

  const expiring = await bootstrap("會過期嘅本地 cookie fixture", "cookie");
  const expiredCookie = expiring.response.headers.get("set-cookie").split(";")[0];
  await db.prepare("UPDATE participants SET created_at = ?, used_at = NULL WHERE id = ?")
    .bind(Date.now() - 25 * 60 * 60 * 1000, expiring.data.participant.id).run();
  const expiredMe = await api("GET", "/me", { cookie: expiredCookie, expected: 401 });
  assert.match(expiredMe.response.headers.get("set-cookie") ?? "", /Max-Age=0/i);
  const validCookieMe = await api("GET", "/me", { cookie, expected: 200 });
  assert.equal(validCookieMe.response.headers.get("set-cookie"), null);
  await bootstrap("清除失效 cookie 後明確另建", "cookie");
  record("過期 unused participant 清失效 cookie，唔清有效控制權，之後可以明確另建");

  const forbiddenModeration = await api("POST", "/moderation", { token: bob.token, body: { target: "participant", id: alice.participant.id, action: "block", reason: "fixture" } });
  assert.ok([401, 403].includes(forbiddenModeration.response.status));
  await api("POST", "/moderation", { token: moderator, body: { target: "participant", id: bob.participant.id, action: "block", reason: "fixture-block" }, expected: 200 });
  const blocked = await api("POST", "/messages", { token: bob.token, body: post });
  assert.ok([403, 429].includes(blocked.response.status));
  await api("DELETE", "/me/citizenship", { token: bob.token, revision: bobMe.citizenship_revision, expected: 200 });
  const afterWithdrawal = await me(bob.token);
  assert.equal(afterWithdrawal.citizenship, null);
  assert.ok(afterWithdrawal.citizenship_revision > bobMe.citizenship_revision);
  record("Moderator 同公民權限分離；被禁發帖仍可退出");

  await api("DELETE", "/me", { token: alice.token, expected: 200 });
  await api("GET", "/me", { token: alice.token, expected: 401 });
  assert.equal((await api("GET", "/citizens", { expected: 200 })).data.items.length, 0);
  const keptReplies = (await api("GET", `/messages?parent_id=${first.id}`, { expected: 200 })).data.items;
  assert.equal(keptReplies.length, 1);
  assert.equal(keptReplies[0].id, reply.id);
  const parentAfterDelete = (await api("GET", `/messages/${first.id}`, { expected: 200 })).data.message;
  assert.equal(parentAfterDelete.body, null);
  assert.equal(parentAfterDelete.author_id, null);
  assert.equal(parentAfterDelete.author_name, null);
  record("刪除自己清內容／作者／憑證，保留他人回覆");
  await api("POST", "/moderation", { token: moderator, body: { target: "participant", id: bob.participant.id, action: "unblock", reason: "fixture-restore" }, expected: 200 });
  const editedReply = (await api("PATCH", `/messages/${reply.id}`, { token: bob.token, revision: keptReplies[0].revision, body: { body: "父帖刪除後，仍可修正自己嘅公開回覆", publish: true, consent_version: "0.1" }, expected: 200 })).data.message;
  assert.equal(editedReply.body, "父帖刪除後，仍可修正自己嘅公開回覆");
  record("父帖清除後，回覆作者仍可修改自己內容");

  const heading = await api("HEAD", "/status", { expected: 200 });
  assert.equal(await heading.response.text(), "");
  const unknown = await api("GET", "/not-a-route");
  assert.equal(unknown.response.status, 404);
  record("Civic HEAD 無 body、unknown API 唔回 HTML");

  record(`Ajv Draft 2020-12 驗證 ${validatedResponses} 份真正 D1 API 回應`);
  const output = resolve(root, ".civic-test-artifacts");
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, `runtime${integrated ? "-integrated" : ""}.json`), JSON.stringify({ mode: integrated ? "integrated-worker" : "civic-module", engine: "Miniflare local D1", checked_at: new Date().toISOString(), checks, production_tested: false }, null, 2));
  console.log(`完成 ${checks.length} 組真正本地 D1/API 驗證；無 production 請求。`);
} finally {
  if (unavailable) await unavailable.dispose();
  if (mf) await mf.dispose();
  await rm(temporary, { recursive: true, force: true });
}
