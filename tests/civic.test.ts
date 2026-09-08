import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { handleCivicRequest, maintainCivic, CIVIC_API_PREFIX, isCivicRequest } from '../pages-functions/civic.js';
import { CivicTestDB } from './helpers/civic-db';
import policy from '../data/civic-policy.json';

// 呢份 suite 所有 participant、文字、IP 同 credentials 都係合成 fixtures，唔係真公民。
const migration = readFileSync(new URL('../migrations/0001_civic.sql', import.meta.url), 'utf8');
const DAY = 86_400_000;
let db: CivicTestDB;
let now: number;
let sequence: number;
let env: Record<string, unknown>;
type Actor = { id: string; token: string; cookie?: string; csrf?: string };
beforeEach(() => {
  db = new CivicTestDB(migration);
  now = Date.UTC(2026, 8, 8, 12);
  sequence = 0;
  env = { KINGDOM_CIVIC_DB: db, CIVIC_ENABLED: 'true', CIVIC_HMAC_SECRET: 'synthetic-hmac-secret-only-000000000000',
    CIVIC_MODERATOR_SECRET: 'synthetic-operator-secret-only-111111111', CIVIC_LOCAL: 'true' };
});
afterEach(() => db.close());
async function call(path: string, method = 'GET', body?: unknown, actor?: Actor, extra: Record<string, string> = {}, config: Record<string, unknown> = env, options: Record<string, unknown> = {}) {
  const headers: Record<string, string> = { ...extra };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (actor) {
    if (actor.cookie) { headers.Cookie ??= actor.cookie; headers.Origin ??= 'https://localhost'; if (actor.csrf) headers['X-Civic-CSRF'] ??= actor.csrf; }
    else headers.Authorization ??= `Bearer ${actor.token}`;
  }
  if (!['GET', 'HEAD'].includes(method)) headers['Idempotency-Key'] ??= `synthetic-${++sequence}`;
  const response = await handleCivicRequest(new Request(`https://localhost${CIVIC_API_PREFIX}${path}`, {
    method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }), config, { now: () => now, ...options });
  if (!response) throw new Error('unexpected non-Civic response');
  const raw = await response.text();
  return { response, status: response.status, data: raw ? JSON.parse(raw) : null, raw };
}
async function actor(mode: 'bearer' | 'cookie' = 'bearer', name = '合成同行') {
  const result = await call('/participants', 'POST', { mode, display_name: name, acknowledge_control: true }, undefined,
    mode === 'cookie' ? { Origin: 'https://localhost' } : {});
  expect(result.status).toBe(201);
  const a: Actor = { id: result.data.participant.id, token: result.data.token || '' };
  if (mode === 'cookie') {
    a.cookie = result.response.headers.get('Set-Cookie')!.split(';')[0];
    a.token = a.cookie.split('=')[1];
    a.csrf = (await call('/me', 'GET', undefined, a)).data.csrf;
  }
  return a;
}
const profile = (overrides = {}) => ({ display_name: '合成公民', becoming: '合成 becoming', offer: '', seek: '', contact_url: '', listed: true, declare: true, consent_version: '0.1', ...overrides });
const message = (overrides = {}) => ({ kind: 'introduction', body: '合成留言', parent_id: null, publish: true, consent_version: '0.1', ...overrides });
const join = (a: Actor, rev = 0, overrides = {}, key?: string) => call('/me/citizenship', 'PUT', profile(overrides), a, { 'If-Match': `"${rev}"`, ...(key ? { 'Idempotency-Key': key } : {}) });
const post = (a: Actor, overrides = {}, key?: string) => call('/messages', 'POST', message(overrides), a, key ? { 'Idempotency-Key': key } : {});
const moderate = (target: string, id: string, action: string) => call('/moderation', 'POST', { target, id, action, reason: 'synthetic_test' }, undefined, { Authorization: `Bearer ${env.CIVIC_MODERATOR_SECRET}` });
function count(table: string) { return (db.sqlite.query(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n; }
function setLimit(key: string, value: number) { db.sqlite.query('INSERT OR REPLACE INTO limits(key,value,expires_at) VALUES (?,?,?)').run(key, value, now + 2 * DAY); }

describe('Civic route／storage boundary', () => {
  test('prefix exactness, JSON errors, HEAD and unsupported methods never HTML fallback', async () => {
    expect(CIVIC_API_PREFIX).toBe('/api/civic');
    expect(isCivicRequest('/api/civic')).toBe(true);
    expect(isCivicRequest('/api/civicly')).toBe(false);
    expect(await handleCivicRequest(new Request('https://localhost/elsewhere'), env)).toBeNull();
    expect((await call('/unknown')).status).toBe(404);
    expect((await call('/status', 'POST', {})).status).toBe(405);
    expect((await call('/status', 'HEAD')).raw).toBe('');
    expect((await call('/unknown', 'HEAD')).raw).toBe('');
    const status = await call('/status');
    expect(status.data.counts).toEqual({ listed_citizens: 0, messages: 0 });
    expect(status.response.headers.get('Cache-Control')).toBe('no-store');
    expect(status.response.headers.get('Set-Cookie')).toBeNull();
    expect(count('participants')).toBe(0);
    expect(db.sessions.every((s) => s === 'first-primary')).toBe(true);
  });
  test('missing binding/schema and storage failures return 503 with null status counts', async () => {
    for (const config of [{ ...env, KINGDOM_CIVIC_DB: null }, { ...env, KINGDOM_CIVIC_DB: {} }]) {
      const result = await call('/status', 'GET', undefined, undefined, {}, config);
      expect(result.status).toBe(503);
      expect(result.data.counts).toEqual({ listed_citizens: null, messages: null });
      expect(result.data.available).toBe(false);
      expect(result.data.writable).toBe(false);
      expect(result.data.error.code).toBe('storage_unavailable');
    }
    db.fail = true;
    expect((await call('/messages')).status).toBe(503);
    expect((await call('/status')).data.counts.messages).toBeNull();
    db.fail = false;
    db.sqlite.exec('DROP TABLE civic_schema');
    expect((await call('/messages')).status).toBe(503);
  });
  test('security/config gaps fail closed without hiding usable storage state', async () => {
    for (const patch of [{ CIVIC_HMAC_SECRET: '' }, { CIVIC_MODERATOR_SECRET: 'short' }, { CIVIC_MODERATOR_SECRET: env.CIVIC_HMAC_SECRET }, { CIVIC_ENABLED: 'false' }]) {
      const config = { ...env, ...patch };
      const result = await call('/status', 'GET', undefined, undefined, {}, config);
      expect(result.status).toBe(200);
      expect(result.data.available).toBe(true);
      expect(result.data.writable).toBe(false);
      expect((await call('/participants', 'POST', { mode: 'bearer', display_name: 'synthetic', acknowledge_control: true }, undefined, {}, config)).status).toBe(503);
    }
    expect(count('participants')).toBe(0);
  });
  test('explicit local host guard; no HTTP test header bypass; no raw network data retained', async () => {
    const request = (host: string, headers = {}) => new Request(`https://${host}/api/civic/status`, { headers });
    expect((await handleCivicRequest(request('example.test', { 'X-Civic-Test-IP': 'spoof' }), env, { now: () => now }))!.status).toBe(503);
    expect((await handleCivicRequest(request('localhost'), { ...env, CIVIC_LOCAL: false }, { now: () => now }))!.status).toBe(503);
    expect((await handleCivicRequest(request('example.test', { 'CF-Connecting-IP': '192.0.2.9' }), env, { now: () => now }))!.status).toBe(200);
    expect((await handleCivicRequest(request('example.test'), env, { now: () => now, testNetworkIdentifier: 'synthetic-test-only' }))!.status).toBe(200);
    const keys = JSON.stringify(db.sqlite.query('SELECT * FROM limits').all());
    expect(keys).not.toContain('192.0.2.9');
    expect(keys).not.toContain('synthetic-test-only');
  });
});

describe('capability、cookie、CSRF 隔離', () => {
  test('bearer issued once, hash only; duplicate name does not share control or citizenship', async () => {
    const a = await actor(); const b = await actor();
    expect(a.id).not.toBe(b.id); expect(a.token).not.toBe(b.token);
    expect(a.token).toMatch(/^kc_[A-Za-z0-9_-]{43}$/);
    expect(JSON.stringify(db.sqlite.query('SELECT * FROM participants').all())).not.toContain(a.token);
    const me = await call('/me', 'GET', undefined, a);
    expect(me.data.csrf).toBeNull(); expect(me.data.citizenship).toBeNull(); expect(me.data.citizenship_revision).toBe(0);
    expect(me.raw).not.toContain('capability_hash'); expect(me.raw).not.toContain(a.token);
    expect((await call('/me')).status).toBe(401);
    expect((await call('/me', 'GET', undefined, undefined, { Authorization: 'Bearer garbage' })).status).toBe(401);
    expect((await join(a)).status).toBe(200);
    expect((await call('/me', 'GET', undefined, b)).data.citizenship).toBeNull();
  });
  test('cookie flags and session-bound CSRF; mixed, cross-origin and missing-CSRF rejected', async () => {
    const bootstrap = await call('/participants', 'POST', { mode: 'cookie', display_name: 'synthetic', acknowledge_control: true }, undefined, { Origin: 'https://localhost' });
    expect(bootstrap.data.token).toBeUndefined();
    expect(bootstrap.response.headers.get('Set-Cookie')).toContain('Path=/; HttpOnly; Secure; SameSite=Strict');
    const a = await actor('cookie'); const b = await actor('cookie');
    expect((await post(a)).status).toBe(201);
    expect((await call('/messages', 'POST', message(), { ...a, csrf: undefined })).status).toBe(403);
    expect((await call('/messages', 'POST', message(), { ...a, csrf: b.csrf })).status).toBe(403);
    expect((await call('/messages', 'POST', message(), a, { Origin: 'https://evil.example' })).status).toBe(403);
    expect((await call('/me', 'GET', undefined, a, { Authorization: `Bearer ${b.token}` })).status).toBe(400);
    expect((await call('/me', 'GET', undefined, undefined, { Cookie: `${a.cookie}; ${a.cookie}` })).status).toBe(400);
    const bearer = await actor();
    expect((await call('/messages', 'POST', message(), bearer, { Origin: 'https://evil.example' })).status).toBe(403);
  });
  test('GET me clears a confirmed expired unused cookie so explicit bootstrap can recover', async () => {
    const a = await actor('cookie');
    now += 25 * DAY / 24;
    const body = { mode: 'cookie', display_name: 'synthetic replacement', acknowledge_control: true };
    const blocked = await call('/participants', 'POST', body, a);
    expect(blocked.status).toBe(409); expect(blocked.data.error.code).toBe('control_exists');
    expect(blocked.response.headers.get('Set-Cookie')).toBeNull();
    const expired = await call('/me', 'GET', undefined, a);
    expect(expired.status).toBe(401);
    expect(expired.response.headers.get('Set-Cookie')).toBe('__Host-kingdom-civic=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    expect(count('participants')).toBe(1); // 清 cookie，唔由 GET 清 participant。
    const replacement = await call('/participants', 'POST', body, undefined, { Origin: 'https://localhost' });
    expect(replacement.status).toBe(201);
    expect(replacement.data.participant.id).not.toBe(a.id);
    expect(replacement.response.headers.get('Set-Cookie')).not.toContain('Max-Age=0');
  });
  test('GET me clears revoked cookies, including revocation after authentication', async () => {
    const a = await actor('cookie');
    db.sqlite.query('DELETE FROM participants WHERE id = ?').run(a.id);
    const revoked = await call('/me', 'GET', undefined, a);
    expect(revoked.status).toBe(401);
    expect(revoked.response.headers.get('Set-Cookie')).toContain('Max-Age=0');
    const b = await actor('cookie');
    db.beforeBatch = () => db.sqlite.query('DELETE FROM participants WHERE id = ?').run(b.id);
    const raced = await call('/me', 'GET', undefined, b);
    expect(raced.status).toBe(401);
    expect(raced.response.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });
  test('GET me never clears valid cookies, even after 25h when the participant was used', async () => {
    const a = await actor('cookie');
    const valid = await call('/me', 'GET', undefined, a);
    expect(valid.status).toBe(200); expect(valid.response.headers.get('Set-Cookie')).toBeNull();
    expect((await join(a)).status).toBe(200);
    now += 25 * DAY / 24;
    const used = await call('/me', 'GET', undefined, a);
    expect(used.status).toBe(200); expect(used.response.headers.get('Set-Cookie')).toBeNull();
    expect(used.data.participant.id).toBe(a.id);
  });
  test('missing binding/schema and unknown database failures never clear a cookie', async () => {
    const a = await actor('cookie');
    now += 25 * DAY / 24;
    for (const binding of [null, {}]) {
      const missing = await call('/me', 'GET', undefined, a, {}, { ...env, KINGDOM_CIVIC_DB: binding });
      expect(missing.status).toBe(503); expect(missing.response.headers.get('Set-Cookie')).toBeNull();
    }
    db.fail = true;
    const unavailable = await call('/me', 'GET', undefined, a);
    expect(unavailable.status).toBe(503); expect(unavailable.response.headers.get('Set-Cookie')).toBeNull();
    db.fail = false;
    now -= 25 * DAY / 24;
    db.beforeBatch = () => { db.fail = true; };
    const failedAfterAuth = await call('/me', 'GET', undefined, a);
    expect(failedAfterAuth.status).toBe(503); expect(failedAfterAuth.response.headers.get('Set-Cookie')).toBeNull();
    db.fail = false;
    db.sqlite.exec('DROP TABLE civic_schema');
    const missingSchema = await call('/me', 'GET', undefined, a);
    expect(missingSchema.status).toBe(503); expect(missingSchema.response.headers.get('Set-Cookie')).toBeNull();
  });
  test('stale bearer, mixed credentials, HEAD, mutations and ordinary browsing never clear cookies', async () => {
    const a = await actor('cookie');
    now += 25 * DAY / 24;
    for (const headers of [{ Authorization: `Bearer ${a.token}` }, {}, { Cookie: 'unrelated=synthetic' }]) {
      const result = await call('/me', 'GET', undefined, undefined, headers);
      expect(result.status).toBe(401); expect(result.response.headers.get('Set-Cookie')).toBeNull();
    }
    for (const headers of [{ Cookie: a.cookie!, Authorization: `Bearer ${a.token}` }, { Cookie: `${a.cookie}; ${a.cookie}` }]) {
      const mixed = await call('/me', 'GET', undefined, undefined, headers);
      expect(mixed.status).toBe(400); expect(mixed.response.headers.get('Set-Cookie')).toBeNull();
    }
    for (const method of ['HEAD', 'DELETE']) {
      const result = await call('/me', method, undefined, a);
      expect(result.status).toBe(401); expect(result.response.headers.get('Set-Cookie')).toBeNull();
    }
    for (const path of ['/status', '/citizens', '/messages']) {
      for (const visitor of [undefined, a]) {
        const result = await call(path, 'GET', undefined, visitor);
        expect(result.status).toBe(200); expect(result.response.headers.get('Set-Cookie')).toBeNull();
      }
    }
  });
  test('bootstrap never clobbers existing/malformed cookie or authorization; explicit mode only', async () => {
    const a = await actor('cookie');
    for (const headers of [{ Cookie: a.cookie! }, { Cookie: '__Host-kingdom-civic=' }, { Authorization: 'Basic invalid' }]) {
      const result = await call('/participants', 'POST', { mode: 'bearer', display_name: 'new', acknowledge_control: true }, undefined, headers);
      expect(result.status).toBe(409); expect(result.response.headers.get('Set-Cookie')).toBeNull();
    }
    expect(count('participants')).toBe(1);
    expect((await call('/participants', 'POST', { display_name: 'new', acknowledge_control: true }, undefined, { 'User-Agent': 'agent' })).status).toBe(400);
    expect((await call('/participants', 'POST', { mode: 'cookie', display_name: 'new', acknowledge_control: true })).status).toBe(403);
  });
});

describe('independent citizenship、revision 與 ghost join', () => {
  test('guest posts without citizenship; private declaration neither lists nor counts', async () => {
    const a = await actor();
    expect((await post(a)).status).toBe(201);
    expect((await join(a, 0, { listed: false })).status).toBe(200);
    expect((await call('/citizens')).data.items).toEqual([]);
    expect((await call(`/citizens/${a.id}`)).status).toBe(404);
    expect((await call('/status')).data.counts).toEqual({ listed_citizens: 0, messages: 1 });
    expect((await call('/me', 'GET', undefined, a)).data.citizenship.listed).toBe(false);
  });
  test('updates, withdrawal and rejoin require monotonically increasing membership revision', async () => {
    const a = await actor();
    const original = await join(a, 0, {}, 'synthetic-initial');
    expect(original.data.citizenship.revision).toBe(1);
    expect((await join(a, 0, { becoming: 'stale' })).status).toBe(412);
    expect((await call('/me/citizenship', 'DELETE', undefined, a, { 'If-Match': '"1"' })).status).toBe(200);
    expect((await call('/me', 'GET', undefined, a)).data.citizenship_revision).toBe(2);
    expect((await join(a, 0, {}, 'synthetic-initial')).status).toBe(404);
    expect((await join(a, 0)).status).toBe(412);
    expect((await join(a, 2)).data.citizenship.revision).toBe(3);
    expect(count('citizenships')).toBe(1);
  });
  test('retrying an old withdrawal cannot claim a subsequent rejoin is withdrawn', async () => {
    const a = await actor(); await join(a);
    const headers = { 'If-Match': '"1"', 'Idempotency-Key': 'synthetic-withdraw' };
    expect((await call('/me/citizenship', 'DELETE', undefined, a, headers)).status).toBe(200);
    expect((await join(a, 2)).status).toBe(200);
    const retry = await call('/me/citizenship', 'DELETE', undefined, a, headers);
    expect(retry.status).toBe(409); expect(retry.data.error.code).toBe('operation_superseded');
    expect((await call('/me', 'GET', undefined, a)).data.citizenship_revision).toBe(3);
    expect(count('citizenships')).toBe(1);
  });
  test('concurrent initial joins have exactly one winner and no quota/operation ghost', async () => {
    const a = await actor();
    const results = await Promise.all([join(a), join(a, 0, { becoming: 'other' })]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 412]);
    expect(count('citizenships')).toBe(1);
    expect(count('operations')).toBe(1);
    expect(count('civic_guards')).toBe(0);
  });
  test('zero-row revision race forces complete batch rollback', async () => {
    const a = await actor();
    db.beforeBatch = () => db.sqlite.query('UPDATE participants SET citizenship_revision = 7 WHERE id = ?').run(a.id);
    const result = await join(a);
    expect(result.status).toBe(412);
    expect(count('citizenships')).toBe(0); expect(count('operations')).toBe(0);
    expect((db.sqlite.query('SELECT citizenship_revision AS n FROM participants').get() as { n: number }).n).toBe(7);
  });
  test('GET me returns one coherent revision/profile snapshot and respects concurrent revocation', async () => {
    const a = await actor(); await join(a);
    db.beforeBatch = () => db.sqlite.transaction(() => {
      db.sqlite.query('UPDATE participants SET citizenship_revision = 2 WHERE id = ?').run(a.id);
      db.sqlite.query('UPDATE citizenships SET revision = 2, becoming = ? WHERE participant_id = ?').run('synthetic concurrently changed', a.id);
    })();
    const me = await call('/me', 'GET', undefined, a);
    expect(me.data.citizenship_revision).toBe(2);
    expect(me.data.citizenship.revision).toBe(2);
    db.beforeBatch = () => db.sqlite.query('DELETE FROM participants WHERE id = ?').run(a.id);
    expect((await call('/me', 'GET', undefined, a)).status).toBe(401);
  });
  test('duplicate names list independently; closed fields/consent/revision required', async () => {
    const a = await actor(); const b = await actor();
    await join(a); await join(b);
    expect((await call('/citizens')).data.items.map((v: { id: string }) => v.id).sort()).toEqual([a.id, b.id].sort());
    expect((await join(a, 1, { listed: 'true' })).status).toBe(400);
    expect((await join(a, 1, { declare: false })).status).toBe(400);
    expect((await join(a, 1, { consent_version: 'old' })).status).toBe(400);
    expect((await call('/me/citizenship', 'PUT', profile(), a)).status).toBe(428);
  });
});

describe('messages、ownership、idempotency、tombstones', () => {
  test('two owners, one-level replies, expiry inheritance and immutable author', async () => {
    const a = await actor('bearer', '原署名'); const b = await actor();
    const root = (await post(a)).data.message;
    now += 60_000;
    const reply = (await post(b, { parent_id: root.id, kind: 'offer' })).data.message;
    expect(reply.expires_at).toBe(root.expires_at);
    expect((await post(a, { parent_id: reply.id })).status).toBe(409);
    expect((await call(`/messages/${root.id}`, 'PATCH', { body: 'stolen', publish: true, consent_version: '0.1' }, b, { 'If-Match': '"1"' })).status).toBe(403);
    expect((await call(`/messages/${root.id}`, 'DELETE', undefined, b, { 'If-Match': '"1"' })).status).toBe(403);
    await join(a, 0, { display_name: '另一自述名稱' });
    const edit = await call(`/messages/${root.id}`, 'PATCH', { body: '改自己', publish: true, consent_version: '0.1' }, a, { 'If-Match': '"1"' });
    expect(edit.status).toBe(200);
    expect(edit.data.message.author_name).toBe('原署名');
    expect(edit.data.message.created_at).toBe(root.created_at);
    expect(edit.data.message.expires_at).toBe(root.expires_at);
    expect((await call(`/messages?parent_id=${root.id}`)).data.items).toHaveLength(1);
    expect((await call('/messages')).data.items).toHaveLength(1);
  });
  test('idempotent concurrent posting consumes once; changed payload conflicts', async () => {
    const a = await actor();
    const results = await Promise.all([post(a, {}, 'synthetic-retry'), post(a, {}, 'synthetic-retry')]);
    expect(results.map((v) => v.status)).toEqual([201, 201]);
    expect(results[0].data.message.id).toBe(results[1].data.message.id);
    expect(count('messages')).toBe(1); expect(count('operations')).toBe(1);
    expect((await post(a, { body: 'different' }, 'synthetic-retry')).status).toBe(409);
    expect(count('messages')).toBe(1);
    const op = JSON.stringify(db.sqlite.query('SELECT * FROM operations').all());
    expect(op).not.toContain('合成留言'); expect(op).not.toContain(a.token);
  });
  test('replay reprojects edits and never returns deleted or withdrawn snapshots', async () => {
    const a = await actor();
    const root = (await post(a, {}, 'synthetic-post')).data.message;
    await call(`/messages/${root.id}`, 'PATCH', { body: 'new current text', publish: true, consent_version: '0.1' }, a, { 'If-Match': '"1"' });
    expect((await post(a, {}, 'synthetic-post')).data.message.body).toBe('new current text');
    await call(`/messages/${root.id}`, 'DELETE', undefined, a, { 'If-Match': '"2"' });
    expect((await post(a, {}, 'synthetic-post')).status).toBe(404);
    expect(db.sqlite.query('SELECT * FROM messages').get()).toBeNull();
    expect((await call('/messages')).data.items).toEqual([]);
    expect((await call(`/messages/${root.id}`)).status).toBe(404);
  });
  test('deleted parent placeholder has no content/author and keeps only others visible replies', async () => {
    const a = await actor(); const b = await actor();
    const root = (await post(a)).data.message;
    const reply = (await post(b, { parent_id: root.id })).data.message;
    await call(`/messages/${root.id}`, 'DELETE', undefined, a, { 'If-Match': '"1"' });
    const placeholder = (await call(`/messages/${root.id}`)).data.message;
    expect(placeholder.deleted).toBe(true);
    expect([placeholder.body, placeholder.author_id, placeholder.author_name]).toEqual([null, null, null]);
    expect(placeholder.reply_count).toBe(1);
    expect((await call(`/messages?parent_id=${root.id}`)).data.items[0].id).toBe(reply.id);
    expect((await post(b, { parent_id: root.id })).status).toBe(409);
    const edited = await call(`/messages/${reply.id}`, 'PATCH', { body: 'synthetic repaired reply', publish: true, consent_version: '0.1' }, b, { 'If-Match': '"1"' });
    expect(edited.status).toBe(200); expect(edited.data.message.revision).toBe(2);
    expect(edited.data.message.expires_at).toBe(reply.expires_at);
    expect((await call(`/messages/${reply.id}`)).data.message.body).toBe('synthetic repaired reply');
    expect((await call(`/messages/${root.id}`)).data.message.deleted).toBe(true);
    expect((await call(`/messages/${reply.id}`, 'DELETE', undefined, b, { 'If-Match': '"2"' })).status).toBe(200);
  });
  test('DELETE me scrubs capability/profile/own bodies and public links, not other replies', async () => {
    const a = await actor('cookie'); const b = await actor();
    await join(a);
    const root = (await post(a)).data.message;
    const reply = (await post(b, { parent_id: root.id })).data.message;
    const gone = await call('/me', 'DELETE', undefined, a);
    expect(gone.status).toBe(200); expect(gone.response.headers.get('Set-Cookie')).toContain('Max-Age=0');
    expect((await call('/me', 'GET', undefined, a)).status).toBe(401);
    expect(count('participants')).toBe(1); expect(count('citizenships')).toBe(0);
    expect(db.sqlite.query('SELECT * FROM operations WHERE actor_id = ?').all(a.id)).toEqual([]);
    const own = db.sqlite.query('SELECT * FROM messages WHERE id = ?').get(root.id) as Record<string, unknown>;
    expect([own.owner_id, own.author_id, own.author_name, own.body]).toEqual([null, null, null, null]);
    expect((await call(`/messages/${reply.id}`)).data.message.body).toBe('合成留言');
    expect((await call(`/messages/${root.id}`)).data.message.deleted).toBe(true);
  });
  test('parent hidden between auth and transaction rejects reply and rolls back all metadata', async () => {
    const a = await actor(); const b = await actor();
    const root = (await post(a)).data.message;
    const before = count('operations');
    db.beforeBatch = () => db.sqlite.query('UPDATE messages SET hidden = 1 WHERE id = ?').run(root.id);
    expect((await post(b, { parent_id: root.id })).status).toBe(409);
    expect(count('messages')).toBe(1); expect(count('operations')).toBe(before);
  });
  test('concurrent edit revisions only accept one writer; previous body not retained', async () => {
    const a = await actor(); const root = (await post(a)).data.message;
    const results = await Promise.all(['synthetic one', 'synthetic two'].map((body) =>
      call(`/messages/${root.id}`, 'PATCH', { body, publish: true, consent_version: '0.1' }, a, { 'If-Match': '"1"' })));
    expect(results.map((r) => r.status).sort()).toEqual([200, 412]);
    expect((await call(`/messages/${root.id}`)).data.message.revision).toBe(2);
    expect(count('operations')).toBe(2);
  });
  test('auth revocation in race cannot leave orphan message or operation', async () => {
    const a = await actor();
    db.beforeBatch = () => db.sqlite.query('DELETE FROM participants WHERE id = ?').run(a.id);
    expect((await post(a)).status).toBe(401);
    expect(count('messages')).toBe(0); expect(count('operations')).toBe(0);
  });
});

describe('moderation independent from citizenship', () => {
  test('operator-only allowed combinations, hidden profile excluded without revoking membership', async () => {
    const a = await actor(); await join(a);
    expect((await call('/moderation', 'POST', { target: 'citizenship', id: a.id, action: 'hide', reason: 'synthetic' }, a)).status).toBe(403);
    expect((await moderate('participant', a.id, 'delete')).status).toBe(400);
    expect((await moderate('citizenship', a.id, 'block')).status).toBe(400);
    expect((await moderate('citizenship', a.id, 'hide')).status).toBe(200);
    expect((await call('/citizens')).data.items).toEqual([]);
    expect((await call(`/citizens/${a.id}`)).status).toBe(404);
    expect((await call('/status')).data.counts.listed_citizens).toBe(0);
    expect((await call('/me', 'GET', undefined, a)).data.citizenship).not.toBeNull();
    await moderate('citizenship', a.id, 'restore');
    expect((await call('/citizens')).data.items).toHaveLength(1);
  });
  test('hidden parent suppresses replies and prevents posting; restore never resurrects deleted body', async () => {
    const a = await actor(); const b = await actor();
    const root = (await post(a)).data.message;
    const reply = (await post(b, { parent_id: root.id })).data.message;
    await moderate('message', root.id, 'hide');
    expect((await call(`/messages/${reply.id}`)).status).toBe(404);
    expect((await post(b, { parent_id: root.id })).status).toBe(409);
    expect((await call(`/messages/${reply.id}`, 'PATCH', { body: 'hidden parent', publish: true, consent_version: '0.1' }, b, { 'If-Match': '"1"' })).status).toBe(409);
    expect((await call('/messages')).data.items).toEqual([]);
    await moderate('message', root.id, 'restore');
    expect((await call(`/messages/${reply.id}`)).status).toBe(200);
    await moderate('message', root.id, 'delete');
    expect((await moderate('message', root.id, 'restore')).status).toBe(404);
    expect((await call(`/messages/${root.id}`)).data.message.body).toBeNull();
    expect(count('moderation_events')).toBe(3);
  });
  test('independent operator secret may contain punctuation; mixed cookie still rejected', async () => {
    const a = await actor();
    env.CIVIC_MODERATOR_SECRET = 'synthetic-operator:+/with.punctuation=22222222';
    expect((await moderate('participant', a.id, 'block')).status).toBe(200);
    expect((await call('/moderation', 'POST', { target: 'participant', id: a.id, action: 'unblock', reason: 'synthetic' }, undefined,
      { Authorization: `Bearer ${env.CIVIC_MODERATOR_SECRET}`, Cookie: `__Host-kingdom-civic=${a.token}` })).status).toBe(400);
    expect((await moderate('participant', a.id, 'unblock')).status).toBe(200);
    expect((await post(a)).status).toBe(201);
  });
  test('moderator deletion increments membership revision and stale joins cannot recreate it', async () => {
    const a = await actor(); await join(a);
    expect((await moderate('citizenship', a.id, 'delete')).status).toBe(200);
    expect((await call('/me', 'GET', undefined, a)).data.citizenship_revision).toBe(2);
    expect((await join(a, 0)).status).toBe(412);
    expect((await join(a, 2)).status).toBe(200);
  });
  test('posting block and exhausted public quota cannot prevent withdrawal/deletion', async () => {
    const a = await actor(); await join(a);
    const root = (await post(a)).data.message;
    await moderate('participant', a.id, 'block');
    setLimit(`public:${Math.floor(now / DAY)}`, 1000);
    expect((await post(a)).status).toBe(403);
    expect((await join(a, 1)).status).toBe(403);
    expect((await call('/me/citizenship', 'DELETE', undefined, a, { 'If-Match': '"1"' })).status).toBe(200);
    expect((await call(`/messages/${root.id}`, 'DELETE', undefined, a, { 'If-Match': '"1"' })).status).toBe(200);
    expect((await call('/me', 'DELETE', undefined, a)).status).toBe(200);
  });
});

describe('atomic quotas、retention、pagination', () => {
  test('3/min concurrent cap and distinct management quota; no rejected mutation residue', async () => {
    const a = await actor();
    const result = await Promise.all(Array.from({ length: 8 }, () => post(a)));
    expect(result.filter((r) => r.status === 201)).toHaveLength(3);
    expect(result.filter((r) => r.status === 429)).toHaveLength(5);
    expect(count('messages')).toBe(3); expect(count('operations')).toBe(3);
    expect((await call('/me', 'DELETE', undefined, a)).status).toBe(200);
  });
  test('30/day posts and global public budget roll back counters and writes', async () => {
    const a = await actor();
    setLimit(`post-day:${a.id}:${Math.floor(now / DAY)}`, 30);
    expect((await post(a)).status).toBe(429); expect(count('messages')).toBe(0);
    setLimit(`post-day:${a.id}:${Math.floor(now / DAY)}`, 0);
    setLimit(`public:${Math.floor(now / DAY)}`, 1000);
    expect((await post(a)).status).toBe(429); expect(count('operations')).toBe(0);
    expect((await join(a)).status).toBe(429); expect(count('citizenships')).toBe(0);
  });
  test('new actor network quota persists 5/day, rotates daily without raw IP', async () => {
    for (let i = 0; i < 5; i++) await actor();
    expect((await call('/participants', 'POST', { mode: 'bearer', display_name: 'sixth synthetic', acknowledge_control: true })).status).toBe(429);
    expect(count('participants')).toBe(5);
    now += DAY;
    await actor();
  });
  test('public read cap 120/min does not consume private management budget', async () => {
    const a = await actor();
    for (let i = 0; i < 120; i++) expect((await call('/messages')).status).toBe(200);
    expect((await call('/messages')).status).toBe(429);
    expect((await call('/me', 'GET', undefined, a)).status).toBe(200);
    expect((await call('/me', 'DELETE', undefined, a)).status).toBe(200);
  });
  test('pure public GET traffic reclaims 48h-old limits across four days without maintenance', async () => {
    const start = now;
    const paths = ['/status', '/messages', '/citizens'];
    for (let hour = 0; hour < 96; hour++) {
      now = start + hour * DAY / 24;
      const result = await call(paths[hour % paths.length]);
      expect(result.status).toBe(200);
      expect(count('limits')).toBe(Math.min(hour + 1, 48));
      expect(db.sqlite.query('SELECT key FROM limits WHERE expires_at <= ?').all(now)).toEqual([]);
    }
    expect(count('participants')).toBe(0); expect(count('operations')).toBe(0);
  });
  test('private GET limit cleanup removes at most 25 expired rows and leaves other tables untouched', async () => {
    const a = await actor(); await join(a);
    now += 49 * DAY / 24;
    db.sqlite.exec('DELETE FROM limits');
    for (let i = 0; i < 40; i++) db.sqlite.query('INSERT INTO limits VALUES (?,?,?)').run(`synthetic-expired-${i}`, 1, now - 1);
    setLimit('synthetic-unexpired', 7);
    const before = count('limits');
    const operations = count('operations');
    const result = await call('/me', 'GET', undefined, a);
    expect(result.status).toBe(200);
    expect(count('limits')).toBe(before + 1 - 25);
    expect(db.sqlite.query('SELECT key FROM limits WHERE expires_at <= ?').all(now)).toHaveLength(15);
    expect(db.sqlite.query('SELECT value FROM limits WHERE key = ?').get('synthetic-unexpired')).toEqual({ value: 7 });
    expect(count('operations')).toBe(operations); expect(count('participants')).toBe(1); expect(count('citizenships')).toBe(1);
  });
  test('rejected read quota rolls back counter changes and does not clean expired rows', async () => {
    for (let i = 0; i < 120; i++) expect((await call('/messages')).status).toBe(200);
    db.sqlite.query('INSERT INTO limits VALUES (?,?,?)').run('synthetic-expired', 1, now - 1);
    const before = db.sqlite.query('SELECT * FROM limits ORDER BY key').all();
    expect((await call('/messages')).status).toBe(429);
    expect(db.sqlite.query('SELECT * FROM limits ORDER BY key').all()).toEqual(before);
  });
  test('independent management quota is persisted and bounded', async () => {
    const a = await actor();
    for (let i = 0; i < 30; i++) expect((await call('/me', 'GET', undefined, a)).status).toBe(200);
    expect((await call('/me', 'GET', undefined, a)).status).toBe(429);
    now += 60_000;
    expect((await call('/me', 'DELETE', undefined, a)).status).toBe(200);
  });
  test('expired threads disappear without cleanup and cannot accept replies; no extension on edits', async () => {
    const a = await actor(); await join(a);
    const root = (await post(a)).data.message;
    now += 89 * DAY;
    const reply = (await post(a, { parent_id: root.id })).data.message;
    expect(reply.expires_at).toBe(root.expires_at);
    now += DAY;
    expect((await call('/messages')).data.items).toEqual([]);
    expect((await call(`/messages/${reply.id}`)).status).toBe(404);
    expect((await post(a, { parent_id: root.id })).status).toBe(409);
    expect((await call(`/messages/${reply.id}`, 'PATCH', { body: 'expired reply', publish: true, consent_version: '0.1' }, a, { 'If-Match': '"1"' })).status).toBe(409);
    expect(count('messages')).toBe(2);
    expect((await maintainCivic(env, { now: () => now })).deleted).toBeLessThanOrEqual(25);
    await maintainCivic(env, { now: () => now });
    expect(count('messages')).toBe(0);
  });
  test('unused actor expires at24h, operation24h, limits48h, moderation30d; bounded cleanup only on success', async () => {
    const unused = await actor(); const used = await actor(); await join(used);
    await moderate('participant', used.id, 'block');
    now += DAY;
    expect((await call('/me', 'GET', undefined, unused)).status).toBe(401);
    expect(count('participants')).toBe(2);
    for (let i = 0; i < 40; i++) db.sqlite.query('INSERT INTO limits VALUES (?,?,?)').run(`synthetic-expired-${i}`, 1, now - 1);
    const before = count('limits') + count('operations') + count('participants') + count('moderation_events');
    const result = await maintainCivic(env, { now: () => new Date(now) });
    const after = count('limits') + count('operations') + count('participants') + count('moderation_events');
    expect(result.deleted).toBe(25); expect(before - after).toBe(25);
    expect(count('participants')).toBe(1); expect(count('moderation_events')).toBe(1);
    now += 30 * DAY;
    for (let i = 0; i < 5; i++) await maintainCivic(env, { now: () => now });
    expect(count('limits')).toBe(0); expect(count('operations')).toBe(0); expect(count('moderation_events')).toBe(0);
    expect(count('participants')).toBe(1);
  });
  test('bootstrap reclaims expired unused participants before the 10000 capacity guard, within one budget', async () => {
    db.sqlite.query(`WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x < 10000)
      INSERT INTO participants(id,display_name,capability_hash,created_at,used_at)
      SELECT printf('synthetic-cap-actor-%d',x), 'synthetic capacity fixture', printf('%064d',x), ?, CASE WHEN x <= 1000 THEN NULL ELSE ? END FROM n`).run(now - DAY, now - DAY);
    for (let i = 0; i < 40; i++) db.sqlite.query('INSERT INTO limits VALUES (?,?,?)').run(`synthetic-expired-${i}`, 1, now - 1);
    const result = await call('/participants', 'POST', { mode: 'bearer', display_name: 'synthetic new arrival', acknowledge_control: true });
    expect(result.status).toBe(201);
    expect(count('participants')).toBe(10000 - 25 + 1);
    expect(db.sqlite.query('SELECT id FROM participants WHERE used_at IS NOT NULL').all()).toHaveLength(9000);
    expect(db.sqlite.query('SELECT id FROM participants WHERE used_at IS NULL AND created_at <= ?').all(now - DAY)).toHaveLength(975);
    expect(db.sqlite.query('SELECT key FROM limits WHERE expires_at <= ?').all(now)).toHaveLength(40);
    expect(count('civic_guards')).toBe(0);
  });
  test('bootstrap shares the remaining cleanup budget and retains used/profile/message owners', async () => {
    const withProfile = await actor(); await join(withProfile);
    const withMessage = await actor(); await post(withMessage);
    const used = await actor(); await join(used);
    await call('/me/citizenship', 'DELETE', undefined, used, { 'If-Match': '"1"' });
    now += DAY;
    // 即使 imported fixture 未標 used_at，仍沿用 cleanup 原本 reference protection。
    db.sqlite.query('UPDATE participants SET used_at = NULL WHERE id IN (?,?)').run(withProfile.id, withMessage.id);
    db.sqlite.query(`WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x < 10)
      INSERT INTO participants(id,display_name,capability_hash,created_at)
      SELECT printf('synthetic-unused-%d',x), 'synthetic unused fixture', printf('%064d',x), ? FROM n`).run(now - DAY);
    for (let i = 0; i < 40; i++) db.sqlite.query('INSERT INTO limits VALUES (?,?,?)').run(`synthetic-expired-${i}`, 1, now - 1);
    const total = () => ['participants', 'messages', 'operations', 'limits', 'moderation_events'].reduce((n, table) => n + count(table), 0);
    const before = total();
    const result = await call('/participants', 'POST', { mode: 'bearer', display_name: 'synthetic new arrival', acknowledge_control: true });
    expect(result.status).toBe(201);
    expect(before + 3 - total()).toBe(25); // 新 participant + new/public limits；總清理唔超過25。
    expect(count('participants')).toBe(4);
    for (const a of [withProfile, withMessage, used]) expect(db.sqlite.query('SELECT id FROM participants WHERE id = ?').get(a.id)).toEqual({ id: a.id });
    expect(count('citizenships')).toBe(1); expect(count('messages')).toBe(1);
  });
  test('failed capacity guard rolls pre-insert participant cleanup and quotas back atomically', async () => {
    // 合成 over-cap storage state：有25可清，但清完仍然滿額。
    db.sqlite.query(`WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x < 10025)
      INSERT INTO participants(id,display_name,capability_hash,created_at)
      SELECT printf('synthetic-cap-actor-%d',x), 'synthetic capacity fixture', printf('%064d',x), CASE WHEN x <= 25 THEN ? ELSE ? END FROM n`).run(now - DAY, now);
    const result = await call('/participants', 'POST', { mode: 'bearer', display_name: 'synthetic no room', acknowledge_control: true });
    expect(result.status).toBe(429);
    expect(count('participants')).toBe(10025); expect(count('limits')).toBe(0); expect(count('civic_guards')).toBe(0);
  });
  test('capacity guards enforce 10000 actors / 25000 active messages inside batch', async () => {
    const a = await actor();
    db.sqlite.query(`WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x < 9999)
      INSERT INTO participants(id,display_name,capability_hash,created_at) SELECT printf('synthetic-cap-actor-%d',x), 'synthetic capacity fixture', printf('%064d',x), ? FROM n`).run(now);
    expect((await call('/participants', 'POST', { mode: 'bearer', display_name: 'over cap', acknowledge_control: true })).status).toBe(429);
    expect(count('participants')).toBe(10000);
    db.sqlite.query(`WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x < 25000)
      INSERT INTO messages(id,owner_id,author_id,author_name,kind,body,created_at,expires_at)
      SELECT printf('synthetic-cap-message-%d',x), ?, ?, 'synthetic capacity author', 'offer', 'synthetic capacity body', ?, ? FROM n`).run(a.id, a.id, now, now + DAY);
    expect((await post(a)).status).toBe(429);
    expect(count('messages')).toBe(25000); expect(count('operations')).toBe(0);
    // expired rows 唔佔 active cap；唔靠預先 cleanup 才可以判斷。
    now += DAY;
    db.sqlite.query('UPDATE participants SET used_at = ? WHERE id = ?').run(now, a.id);
    expect((await post(a)).status).toBe(201);
  });
  test('cursor pagination preserves equal timestamp rows, q is literal not SQL, filters closed', async () => {
    const a = await actor(); const b = await actor(); await join(a); await join(b);
    const page1 = await call('/citizens?limit=1');
    const page2 = await call(`/citizens?limit=1&cursor=${page1.data.next_cursor}`);
    expect(page1.data.items[0].id).not.toBe(page2.data.items[0].id);
    expect(page2.data.next_cursor).toBeNull();
    expect((await call('/citizens?q=%27%20OR%201%3D1--')).data.items).toEqual([]);
    expect((await call('/citizens?q=%25')).data.items).toEqual([]);
    expect((await call('/messages?limit=51')).status).toBe(400);
    expect((await call('/messages?kind=evil')).status).toBe(400);
    expect((await call('/messages?limit=1&limit=2')).status).toBe(400);
    expect((await call(`/messages?cursor=${page1.data.next_cursor}`)).status).toBe(400);
    const chinese = await call('/citizens?limit=1&q=合成');
    expect((await call(`/citizens?limit=1&q=合成&cursor=${chinese.data.next_cursor}`)).status).toBe(200);
    expect((await call(`/citizens?limit=1&q=different&cursor=${chinese.data.next_cursor}`)).status).toBe(400);
  });
});

describe('bounded plain-text input／SQL schema guard', () => {
  test('codepoint not UTF16 length, malicious strings inert, contact URLs HTTPS-only', async () => {
    const a = await actor('bearer', '😀'.repeat(80));
    expect((await post(a, { body: '<script>alert(1)</script>\n\' OR 1=1-- 😀' })).status).toBe(201);
    expect((await post(a, { body: '😀'.repeat(2000) })).status).toBe(201);
    expect((await post(a, { body: '😀'.repeat(2001) })).status).toBe(400);
    for (const contact_url of ['http://example.test', 'javascript:alert(1)', 'https://user:pass@example.test/', 'https://example.test/\nfoo', 'https://example.test/%0afoo', 'https://example.test/\\x'])
      expect((await join(a, 0, { contact_url })).status).toBe(400);
    expect((await join(a, 0, { contact_url: 'https://example.test/path?q=plain#fragment' })).status).toBe(200);
    expect((await post(a, { author_id: 'spoof' })).status).toBe(400);
    expect((await post(a, { body: '\x00' })).status).toBe(400);
    expect((await post(a, { body: '\ud800' })).status).toBe(400);
    expect(count('participants')).toBe(1);
  });
  test('body byte cap checked while streaming even absent Content-Length; rejects malformed UTF8/type/JSON', async () => {
    let canceled = false;
    let pulls = 0;
    const stream = new ReadableStream({ pull(controller) { pulls++; controller.enqueue(new Uint8Array(9000).fill(32)); }, cancel() { canceled = true; } });
    const oversized = await handleCivicRequest(new Request('https://localhost/api/civic/participants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: stream }), env, { now: () => now });
    expect(oversized!.status).toBe(413); expect(canceled).toBe(true); expect(pulls).toBeLessThanOrEqual(3);
    for (const [body, contentType] of [[new Uint8Array([0xff]), 'application/json'], ['{', 'application/json'], ['{}', 'text/plain']] as const) {
      const result = await handleCivicRequest(new Request('https://localhost/api/civic/participants', { method: 'POST', headers: { 'Content-Type': contentType }, body }), env, { now: () => now });
      expect([400, 415]).toContain(result!.status);
    }
    expect(count('participants')).toBe(0);
  });
  test('DELETE rejects uncontracted bodies and still enforces streamed byte cap', async () => {
    const a = await actor();
    expect((await call('/me', 'DELETE', { uncontracted: true }, a)).status).toBe(400);
    expect((await call('/me', 'DELETE', { huge: 'x'.repeat(17000) }, a)).status).toBe(413);
    expect(count('participants')).toBe(1);
    expect((await call('/me', 'DELETE', undefined, a)).status).toBe(200);
  });
  test('independent idempotency scope and printable SQL-looking keys stay inert', async () => {
    const a = await actor(); const b = await actor();
    const key = "synthetic-' OR 1=1 --";
    expect((await post(a, {}, key)).status).toBe(201);
    expect((await post(b, {}, key)).status).toBe(201);
    expect(count('messages')).toBe(2); expect(count('operations')).toBe(2);
    expect((await post(a, {}, 'short')).status).toBe(400);
    expect((await post(a, {}, 'x'.repeat(101))).status).toBe(400);
  });
  test('wire schema closes every object and describes all API variants (not runtime schema validation)', () => {
    const schema = JSON.parse(readFileSync(new URL('../schemas/civic-v0.1.schema.json', import.meta.url), 'utf8'));
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(walk); return; }
      const value = node as Record<string, unknown>;
      if (value.type === 'object') expect(value.additionalProperties).toBe(false);
      Object.values(value).forEach(walk);
    };
    walk(schema);
    for (const name of ['participantRequest', 'participantResponse', 'meResponse', 'citizenshipRequest', 'citizenshipResponse',
      'citizensResponse', 'messageRequest', 'messagePatchRequest', 'messageResponse', 'messagesResponse', 'statusResponse',
      'deletedResponse', 'withdrawnResponse', 'moderationRequest', 'moderationResponse', 'errorResponse']) expect(schema.$defs[name]).toBeDefined();
    expect(schema.$defs.meResponse.required).toContain('citizenship_revision');
    expect(schema.$defs.statusResponse.properties.error).toBeDefined();
    expect(Object.keys(schema.$defs.policy.properties).sort()).toEqual(Object.keys(policy).sort());
    expect(Object.keys(schema.$defs.policy.properties.limits.properties).sort()).toEqual(Object.keys(policy.limits).sort());
    expect(Object.keys(schema.$defs.policy.properties.retention.properties).sort()).toEqual(Object.keys(policy.retention).sort());
  });
  test('faithful adapter rolls back early writes on late CHECK and enforces SQL immutable timestamps', async () => {
    await expect(db.batch([
      db.prepare('INSERT INTO limits VALUES (?,?,?)').bind('synthetic-rollback', 1, now),
      db.prepare('INSERT INTO civic_guards(id,revision) VALUES (?,0)').bind('synthetic-guard'),
    ])).rejects.toThrow('civic_revision');
    expect(count('limits')).toBe(0);
    const a = await actor(); const root = (await post(a)).data.message;
    expect(() => db.sqlite.query('UPDATE messages SET expires_at = expires_at + 1 WHERE id = ?').run(root.id)).toThrow('civic_immutable');
  });
});
