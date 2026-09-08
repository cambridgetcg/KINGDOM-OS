import { describe, expect, test } from "bun:test";
import { CivicClient, CivicError, citizenshipPayload, messagePayload, safeHttps, unicodeLength, randomOperationKey } from "../pages-content/civic/dashboard.js";

// 合成 transport fixtures；唔係真 participant、credential 或 Civic 寫入。
const me = { participant: { id: "synthetic-owner", display_name: "Test only" }, citizenship: null, citizenship_revision: 4, csrf: "synthetic-csrf" };
function harness(responses: any[] = []) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = new CivicClient({ timeout: 50, fetchImpl: async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift() ?? {};
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify(next.body ?? next), { status: next.status ?? 200, headers: { "Content-Type": "application/json" } });
  } });
  return { client, calls };
}
describe("browser Civic protocol", () => {
  test("anonymous reads never bootstrap a participant or send authentication header", async () => {
    const { client, calls } = harness();
    await client.status(); await client.citizens(); await client.messages();
    expect(calls.map((c) => c.url.split("?")[0])).toEqual(["/api/civic/status", "/api/civic/citizens", "/api/civic/messages"]);
    for (const c of calls) {
      expect(c.init.method).toBe("GET"); expect(c.init.credentials).toBe("same-origin"); expect(c.init.cache).toBe("no-store");
      expect(new Headers(c.init.headers).has("Authorization")).toBe(false); expect(new Headers(c.init.headers).has("X-Civic-CSRF")).toBe(false);
    }
  });
  test("bootstrap requires explicit acknowledgement, cookie mode only, no cached credential retry", async () => {
    const { client, calls } = harness([{ status: 201, body: { participant: me.participant } }]);
    expect(() => client.createParticipant("Test only", false)).toThrow(); expect(calls).toHaveLength(0);
    await client.createParticipant("Test only", true);
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ mode: "cookie", display_name: "Test only", acknowledge_control: true });
    expect(new Headers(calls[0].init.headers).has("Idempotency-Key")).toBe(false);
    expect(calls).toHaveLength(1); expect(client.me).toBeNull();
  });
  test("bootstrap network failure never retries or creates a fallback participant", async () => {
    const { client, calls } = harness([new Error("lost response")]);
    await expect(client.createParticipant("Test only", true)).rejects.toThrow("未確認");
    expect(calls).toHaveLength(1); expect(client.operations.size).toBe(0);
  });
  test("GET/me restores cookie CSRF without assuming citizenship", async () => {
    const { client, calls } = harness([me]);
    await client.restore(); expect(client.me).toEqual(me); expect(calls[0].url).toBe("/api/civic/me");
  });
  test("missing auth and storage unavailable remain different errors", async () => {
    const { client } = harness([{ status: 401, body: { error: { code: "unauthorized", message: "not authenticated" } } }, { status: 503, body: { available: false, writable: false, counts: { listed_citizens: null, messages: null } } }]);
    try { await client.restore(); throw new Error("expected failure"); } catch (error) { expect((error as CivicError).status).toBe(401); }
    try { await client.status(); throw new Error("expected failure"); } catch (error) { expect((error as CivicError).status).toBe(503); expect((error as CivicError).payload.counts.messages).toBeNull(); }
    expect(client.me).toBeNull();
  });
  test("invalid /me does not enable mutation", async () => {
    const { client } = harness([{ participant: me.participant, citizenship_revision: 0, csrf: null }]);
    await expect(client.restore()).rejects.toThrow("格式不符"); expect(client.me).toBeNull();
    await expect(client.postMessage({})).rejects.toThrow("participant");
  });
  test("mutations include CSRF, crypto operation key and quoted revision, not forged Origin", async () => {
    const { client, calls } = harness([me, { citizenship: { revision: 5 } }]); await client.restore();
    await client.putCitizenship(citizenshipPayload({ display_name: "Test", declare: true, listed: false }));
    const headers = new Headers(calls[1].init.headers);
    expect(headers.get("If-Match")).toBe('"4"'); expect(headers.get("X-Civic-CSRF")).toBe("synthetic-csrf");
    expect(headers.get("Idempotency-Key")).toMatch(/^[a-f0-9]{48}$/);
    expect(headers.has("Authorization")).toBe(false); expect(headers.has("Origin")).toBe(false);
    expect(calls[1].init.credentials).toBe("same-origin");
  });
  test("manual same-payload retry preserves idempotency key after unknown result", async () => {
    const { client, calls } = harness([me, new Error("dropped"), { message: { id: "synthetic" } }]); await client.restore();
    const payload = messagePayload({ body: "Synthetic test", publish: true, kind: "offer" });
    await expect(client.postMessage(payload)).rejects.toThrow(); await client.postMessage(payload);
    expect(new Headers(calls[1].init.headers).get("Idempotency-Key")).toBe(new Headers(calls[2].init.headers).get("Idempotency-Key"));
    expect(client.operations.size).toBe(0); expect(calls).toHaveLength(3);
  });
  test("changed payload or revision gets a different operation key", async () => {
    const { client, calls } = harness([me, new Error("lost"), new Error("lost")]); await client.restore();
    await expect(client.editMessage("synthetic", { body: "one" }, 1)).rejects.toThrow();
    await expect(client.editMessage("synthetic", { body: "two" }, 2)).rejects.toThrow();
    expect(new Headers(calls[1].init.headers).get("Idempotency-Key")).not.toBe(new Headers(calls[2].init.headers).get("Idempotency-Key"));
  });
  test("withdrawal and redeclaration use retained monotonic revision rather than zero", async () => {
    const { client, calls } = harness([me, { withdrawn: true }, { ...me, citizenship_revision: 5 }, { citizenship: { revision: 6 } }]);
    await client.restore(); await client.withdrawCitizenship(); await client.restore(); await client.putCitizenship({ listed: false });
    expect(new Headers(calls[1].init.headers).get("If-Match")).toBe('"4"'); expect(new Headers(calls[3].init.headers).get("If-Match")).toBe('"5"');
  });
  test("top posts and one-level replies have explicit wire shapes", async () => {
    const { client, calls } = harness([me, {}, {}, {}, { deleted: true }]); await client.restore();
    await client.messages({ parentId: "synthetic parent", cursor: "opaque+/=", kind: "offer" });
    const url = new URL(calls[1].url, "https://example.test");
    expect(url.searchParams.get("parent_id")).toBe("synthetic parent"); expect(url.searchParams.get("cursor")).toBe("opaque+/="); expect(url.searchParams.get("kind")).toBe("offer");
    await client.postMessage(messagePayload({ kind: "offer", body: "Synthetic reply", publish: true }, "synthetic parent"));
    expect(JSON.parse(calls[2].init.body as string).parent_id).toBe("synthetic parent");
    await client.editMessage("synthetic", messagePayload({ body: "Synthetic edit", publish: true }, null, true), 7);
    expect(calls[3].init.method).toBe("PATCH"); expect(JSON.parse(calls[3].init.body as string)).toEqual({ body: "Synthetic edit", publish: true, consent_version: "0.1" });
    await client.deleteMessage("synthetic", 8); expect(calls[4].init.method).toBe("DELETE"); expect(new Headers(calls[4].init.headers).get("If-Match")).toBe('"8"');
  });
  test("DELETE me clears only local in-memory state after confirmed success", async () => {
    const { client, calls } = harness([me, { status: 503, body: { error: { code: "storage_unavailable", message: "DB absent" } } }, { deleted: true }]); await client.restore();
    await expect(client.deleteMe()).rejects.toThrow("DB absent"); expect(client.me).toEqual(me);
    await client.deleteMe(); expect(client.me).toBeNull(); expect(calls[2].url).toBe("/api/civic/me");
  });
  test("a 200 response without deleted=true never claims erasure", async () => {
    const { client } = harness([me, {}]); await client.restore();
    await expect(client.deleteMe()).rejects.toThrow("未獲明確確認"); expect(client.me).toEqual(me);
  });
  test("fetch timeout is bounded, emits no automatic retries", async () => {
    let calls = 0;
    const client = new CivicClient({ timeout: 5, fetchImpl: (_url: string, init: RequestInit) => new Promise((_resolve, reject) => { calls++; init.signal!.addEventListener("abort", () => reject(new Error("timeout"))); }) });
    await expect(client.status()).rejects.toThrow("逾時"); expect(calls).toBe(1);
  });
  test("a read crossing confirmed deletion is discarded and replaced, including replies", async () => {
    let release!: () => void;
    const delayed = new Promise<void>((resolve) => { release = resolve; });
    const calls: string[] = [];
    let reads = 0;
    const client = new CivicClient({ fetchImpl: async (url: string, init: RequestInit) => {
      calls.push(`${init.method} ${url}`);
      if (init.method === "DELETE") return Response.json({ deleted: true });
      if (++reads === 1) { await delayed; return Response.json({ items: [{ id: "deleted-reply", body: "old snapshot" }], next_cursor: "old" }); }
      return Response.json({ items: [{ id: "other-reply", body: "retained" }], next_cursor: null });
    } });
    client.me = structuredClone(me);
    const reading = client.messages({ parentId: "parent" });
    await client.deleteMessage("deleted-reply", 1); release();
    expect((await reading).items.map((m: any) => m.id)).toEqual(["other-reply"]);
    expect(calls).toHaveLength(3); expect(calls[0]).toBe(calls[2]);
  });
  test("stale GET/me cannot restore the participant after confirmed DELETE/me", async () => {
    let release!: () => void;
    const delayed = new Promise<void>((resolve) => { release = resolve; }); let reads = 0;
    const client = new CivicClient({ fetchImpl: async (_url: string, init: RequestInit) => {
      if (init.method === "DELETE") return Response.json({ deleted: true });
      if (++reads === 1) { await delayed; return Response.json(me); }
      return Response.json({ error: { code: "unauthorized", message: "revoked" } }, { status: 401 });
    } });
    client.me = structuredClone(me);
    const reading = client.restore();
    await client.deleteMe(); release();
    await expect(reading).rejects.toThrow("revoked"); expect(client.me).toBeNull(); expect(reads).toBe(2);
  });
  test("repeated read invalidation is bounded and never returned as an empty page", async () => {
    let reads = 0;
    const client = new CivicClient({ fetchImpl: async (_url: string, init: RequestInit) => {
      if (init.method === "GET") { reads++; await client.deleteMessage("synthetic", reads); }
      return Response.json(init.method === "GET" ? { items: [], next_cursor: null } : { deleted: true });
    } });
    client.me = structuredClone(me);
    await expect(client.messages()).rejects.toMatchObject({ code: "stale_read" }); expect(reads).toBe(2);
  });
  test("non-JSON fallback is not successful Civic service", async () => {
    const client = new CivicClient({ fetchImpl: async () => new Response("<html>fallback</html>") });
    await expect(client.status()).rejects.toThrow("JSON");
  });
});
describe("explicit publication and input boundaries", () => {
  test("unlisted membership is valid but consent is still required", () => {
    expect(citizenshipPayload({ display_name: "Test", listed: false, declare: true })).toEqual({ display_name: "Test", becoming: "", offer: "", seek: "", contact_url: "", listed: false, declare: true, consent_version: "0.1" });
    expect(() => citizenshipPayload({ display_name: "Test", listed: true })).toThrow("確認");
  });
  test("post/edit checkbox is separate and required", () => {
    expect(() => messagePayload({ body: "Test", kind: "offer" })).toThrow("確認");
    expect(() => messagePayload({ body: "Test" }, null, true)).toThrow("確認");
    expect(messagePayload({ body: "<script>plain text</script>", kind: "seek", publish: true }).body).toBe("<script>plain text</script>");
  });
  test("limits count Unicode codepoints, not UTF-16 length", () => {
    expect(unicodeLength("𝄞𠮷")).toBe(2);
    expect(citizenshipPayload({ display_name: "𠮷".repeat(80), declare: true }).display_name).toHaveLength(160);
    expect(() => citizenshipPayload({ display_name: "𠮷".repeat(81), declare: true })).toThrow("80");
    expect(() => messagePayload({ body: "a".repeat(2001), kind: "seek", publish: true })).toThrow("2,000".replace(",", ""));
  });
  test("contact links require https and never accept embedded credentials", () => {
    for (const url of ["javascript:alert(1)", "http://example.test", "https://u:p@example.test", "//example.test"]) {
      expect(safeHttps(url)).toBeNull(); expect(() => citizenshipPayload({ display_name: "Test", declare: true, contact_url: url })).toThrow();
    }
    expect(safeHttps("https://example.test/")).toBe("https://example.test/");
  });
  test("operation keys fail closed without secure randomness", () => { expect(() => randomOperationKey({})).toThrow("安全"); expect(randomOperationKey()).not.toBe(randomOperationKey()); });
});
