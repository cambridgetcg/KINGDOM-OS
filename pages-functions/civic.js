import policy from '../data/civic-policy.json';
import {
  CivicError, fail, enabled, secure, clock, iso, id, token, digest, hmac, equalSecret,
  credentials, checkOrigin, cookie, networkKey, readJSON, rejectBody, fields, text, contactURL,
  publication, revision, operationKey, canonical, pagination, encodeCursor, decodeCursor, HOUR, DAY,
} from './civic-security.js';

export const CIVIC_API_PREFIX = '/api/civic';
export const isCivicRequest = (request) => {
  const path = typeof request === 'string' ? request : new URL(request.url).pathname;
  return path === CIVIC_API_PREFIX || path.startsWith(`${CIVIC_API_PREFIX}/`);
};
const KINDS = ['introduction', 'offer', 'seek'];
const LIMIT = policy.limits;
const RETAIN = policy.retention;
const unusedParticipantCondition = `used_at IS NULL AND created_at <= ?
  AND NOT EXISTS (SELECT 1 FROM citizenships c WHERE c.participant_id = participants.id)
  AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.owner_id = participants.id)`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const participantPublic = (p) => ({ id: p.id, display_name: p.display_name, created_at: iso(p.created_at) });
const citizenshipPublic = (c) => c ? ({
  id: c.participant_id, display_name: c.display_name, becoming: c.becoming, offer: c.offer,
  seek: c.seek, contact_url: c.contact_url, listed: !!c.listed, created_at: iso(c.created_at),
  updated_at: iso(c.updated_at), revision: c.revision,
}) : null;
const messagePublic = (m) => ({
  id: m.id, author_id: m.deleted ? null : m.author_id, author_name: m.deleted ? null : m.author_name,
  kind: m.kind, body: m.deleted ? null : m.body, parent_id: m.parent_id,
  created_at: iso(m.created_at), expires_at: iso(m.expires_at), revision: m.revision,
  deleted: !!m.deleted, reply_count: m.reply_count ?? 0,
});
function response(request, value, status = 200, headers = {}) {
  return new Response(request.method === 'HEAD' ? null : JSON.stringify(value), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...headers },
  });
}
function stmt(db, sql, values = []) { return db.prepare(sql).bind(...values); }
function boundedDelete(db, table, key, condition, values, max) {
  return stmt(db, `DELETE FROM ${table} WHERE ${key} IN (SELECT ${key} FROM ${table} WHERE ${condition} LIMIT ?)`, [...values, max]);
}
async function first(db, sql, values = []) { return stmt(db, sql, values).first(); }
async function rows(db, sql, values = []) {
  const result = await stmt(db, sql, values).all();
  if (!result.success) throw new Error('Civic storage unavailable');
  return result.results;
}
function storage(env) {
  const db = env.KINGDOM_CIVIC_DB;
  if (!db || typeof db.prepare !== 'function' || typeof db.batch !== 'function')
    fail(503, 'storage_unavailable', 'Civic 資料庫未接通。');
  // 有 read replication 都從 primary 開始，刪除／撤銷唔讀舊快照。
  return typeof db.withSession === 'function' ? db.withSession('first-primary') : db;
}
async function health(db) {
  const result = await first(db, `SELECT version,
    (SELECT count(*) FROM participants WHERE 0) AS p,
    (SELECT count(*) FROM citizenships WHERE 0) AS c,
    (SELECT count(*) FROM messages WHERE 0) AS m,
    (SELECT count(*) FROM operations WHERE 0) AS o,
    (SELECT count(*) FROM limits WHERE 0) AS l,
    (SELECT count(*) FROM moderation_events WHERE 0) AS e,
    (SELECT count(*) FROM civic_guards WHERE 0) AS g FROM civic_schema WHERE version = '0.1'`);
  if (!result) fail(503, 'storage_unavailable', 'Civic schema 未接通。');
}
function guard(db, list, column, expression, values = []) {
  const key = id();
  list.push(stmt(db, `INSERT INTO civic_guards(id, ${column}) VALUES (?, COALESCE((${expression}), 0))`, [key, ...values]));
  list.push(stmt(db, 'DELETE FROM civic_guards WHERE id = ?', [key]));
}
function quota(db, list, key, cap, now) {
  list.push(stmt(db, `INSERT INTO limits(key,value,expires_at) VALUES (?,1,?)
    ON CONFLICT(key) DO UPDATE SET value = CASE WHEN limits.expires_at <= ? THEN 1 ELSE limits.value + 1 END,
    expires_at = excluded.expires_at`, [key, now + RETAIN.limit_hours * HOUR, now]));
  guard(db, list, 'quota', 'SELECT value <= ? FROM limits WHERE key = ?', [cap, key]);
}
function publicQuota(db, list, now) { quota(db, list, `public:${Math.floor(now / DAY)}`, LIMIT.public_mutations_per_day, now); }
function manageQuota(db, list, actor, now) {
  quota(db, list, `manage:${actor}:${Math.floor(now / 60_000)}`, LIMIT.management_per_participant_minute, now);
}
function mapError(error) {
  if (error instanceof CivicError) return error;
  const message = String(error?.message || '');
  if (message.includes('civic_quota')) return new CivicError(429, 'quota_exceeded', '暫時到達流量或容量上限，請稍後再試。');
  if (message.includes('civic_auth')) return new CivicError(401, 'unauthorized', '控制匙已失效。');
  if (message.includes('civic_ownership')) return new CivicError(403, 'not_owner', '只可以管理自己內容。');
  if (message.includes('civic_revision')) return new CivicError(412, 'revision_conflict', '版本已改變，請重新讀取。');
  if (message.includes('civic_blocked')) return new CivicError(403, 'posting_blocked', '暫停公開寫入；仍可刪除同退出。');
  if (message.includes('civic_parent')) return new CivicError(409, 'invalid_parent', '只可以回覆未到期、可見嘅頂層留言。');
  if (message.includes('civic_found')) return new CivicError(404, 'not_found', '記錄不存在或已不可見。');
  return new CivicError(503, 'storage_unavailable', 'Civic 暫時無法安全讀寫，請稍後再試。');
}
async function batch(db, list) {
  const result = await db.batch(list);
  if (result.some((r) => !r.success)) throw new Error('Civic batch failed');
  return result;
}
async function authenticate(request, env, db, creds, now, mutation = false) {
  if (!creds.present || !/^kc_[A-Za-z0-9_-]{43}$/.test(creds.value)) fail(401, 'unauthorized', '需要有效控制匙。');
  const hash = await digest(creds.value);
  const actor = await first(db, `SELECT * FROM participants WHERE capability_hash = ?
    AND (used_at IS NOT NULL OR created_at > ?)`, [hash, now - RETAIN.unused_participant_hours * HOUR]);
  if (!actor) fail(401, 'unauthorized', '需要有效控制匙。');
  const csrf = creds.mode === 'cookie' ? await hmac(env.CIVIC_HMAC_SECRET, `csrf:${actor.id}:${hash}`) : null;
  if (mutation) {
    checkOrigin(request, creds.mode === 'cookie');
    if (creds.mode === 'cookie' && !await equalSecret(csrf, request.headers.get('X-Civic-CSRF') || ''))
      fail(403, 'csrf_rejected', '需要目前控制匙嘅 CSRF 確認。');
  }
  return { actor, hash, csrf };
}
function authGuard(db, list, auth, now, posting = false) {
  guard(db, list, 'auth', `EXISTS (SELECT 1 FROM participants WHERE id = ? AND capability_hash = ?
    AND (used_at IS NOT NULL OR created_at > ?))`, [auth.actor.id, auth.hash, now - RETAIN.unused_participant_hours * HOUR]);
  if (posting) guard(db, list, 'blocked', 'EXISTS (SELECT 1 FROM participants WHERE id = ? AND posting_blocked = 0)', [auth.actor.id]);
}
function touch(db, list, actor, now) { list.push(stmt(db, 'UPDATE participants SET used_at = ? WHERE id = ?', [now, actor])); }
async function readQuota(request, env, db, options, now, actor = null) {
  const list = [];
  if (actor) manageQuota(db, list, actor, now);
  else {
    const network = await networkKey(request, env, options, now);
    quota(db, list, `read:${network}:${Math.floor(now / 60_000)}`, LIMIT.reads_per_network_minute, now);
  }
  // 純 GET 都寫 quota；同一 transaction 有界回收過期 counters，唔碰內容／participants。
  list.push(boundedDelete(db, 'limits', 'key', 'expires_at <= ?', [now], LIMIT.cleanup_batch));
  await batch(db, list);
}
const visible = (alias = 'm') => `${alias}.hidden = 0 AND ${alias}.expires_at > ?
  AND (${alias}.parent_id IS NULL OR EXISTS (SELECT 1 FROM messages p WHERE p.id = ${alias}.parent_id
    AND p.parent_id IS NULL AND p.hidden = 0 AND p.expires_at > ?))
  AND (${alias}.deleted = 0 OR (${alias}.parent_id IS NULL AND EXISTS (SELECT 1 FROM messages r
    WHERE r.parent_id = ${alias}.id AND r.hidden = 0 AND r.deleted = 0 AND r.expires_at > ?)))`;
const messageSelect = `SELECT m.*, (SELECT count(*) FROM messages r WHERE r.parent_id = m.id
  AND r.hidden = 0 AND r.deleted = 0 AND r.expires_at > ?) AS reply_count FROM messages m`;
async function getMessage(db, target, now, owner = null) {
  const row = owner ? await first(db, `${messageSelect} WHERE m.id = ? AND m.owner_id = ? AND m.expires_at > ?`, [now, target, owner, now])
    : await first(db, `${messageSelect} WHERE m.id = ? AND ${visible()}`, [now, target, now, now, now]);
  if (!row || (owner && row.deleted)) fail(404, 'not_found', '留言不存在或已不可見。');
  return messagePublic(row);
}
async function getCitizenship(db, target, privateView = false) {
  const row = await first(db, `SELECT * FROM citizenships WHERE participant_id = ?${privateView ? '' : ' AND listed = 1 AND hidden = 0'}`, [target]);
  return citizenshipPublic(row);
}
async function replay(db, op, hash, now, actor) {
  if (op.request_hash !== hash) fail(409, 'idempotency_conflict', '同一 key 唔可以用於唔同請求。');
  if (op.action === 'citizenship.put') {
    const citizenship = await getCitizenship(db, op.target_id, true);
    if (!citizenship) fail(404, 'not_found', '公民資料已撤回。');
    return { body: { citizenship }, status: 200 };
  }
  if (op.action === 'message.post' || op.action === 'message.patch')
    return { body: { message: await getMessage(db, op.target_id, now, actor) }, status: op.action === 'message.post' ? 201 : 200 };
  if (op.action === 'citizenship.delete') {
    if (await getCitizenship(db, op.target_id, true)) fail(409, 'operation_superseded', '退出後已有新宣告，請重新讀取目前狀態。');
    return { body: { withdrawn: true }, status: 200 };
  }
  if (op.action === 'moderation') return { body: { moderated: true }, status: 200 };
  return { body: { deleted: true }, status: 200 };
}
async function operation(db, request, actor, action, target, body, now, build) {
  const key = operationKey(request);
  const hash = await digest(canonical({ method: request.method, path: new URL(request.url).pathname,
    revision: request.headers.get('If-Match'), body }));
  const prior = await first(db, 'SELECT * FROM operations WHERE actor_id = ? AND key = ? AND expires_at > ?', [actor, key, now]);
  if (prior) return replay(db, prior, hash, now, actor);
  const list = [stmt(db, 'DELETE FROM operations WHERE actor_id = ? AND key = ? AND expires_at <= ?', [actor, key, now]),
    stmt(db, `INSERT INTO operations(actor_id,key,request_hash,action,target_id,created_at,expires_at) VALUES (?,?,?,?,?,?,?)`,
      [actor, key, hash, action, target, now, now + RETAIN.operation_hours * HOUR])];
  build(list);
  try { await batch(db, list); }
  catch (error) {
    // UNIQUE collision 可以係同時到達嘅 retry；只投影贏咗嗰份現有記錄。
    const winner = await first(db, 'SELECT * FROM operations WHERE actor_id = ? AND key = ? AND expires_at > ?', [actor, key, now]);
    if (winner) return replay(db, winner, hash, now, actor);
    throw error;
  }
  await cleanupAfterMutation(db, now);
  return null;
}
async function cleanupAfterMutation(db, now, max = LIMIT.cleanup_batch) {
  // 額度已用盡或前段 cleanup 缺 changes 證據，就唔再清，避免超過每 request budget。
  if (!Number.isInteger(max) || max < 1 || max > LIMIT.cleanup_batch) return;
  // 寫入已成功，cleanup 失敗唔假報寫入失敗；查詢到期牆仍然生效。
  try { await cleanup(db, now, max); } catch { /* 明確 maintenance 可以重試。 */ }
}
async function cleanup(db, now, max) {
  let remaining = max;
  let deleted = 0;
  const tasks = [
    ['messages', 'id', '(deleted = 1 OR expires_at <= ?) AND NOT EXISTS (SELECT 1 FROM messages r WHERE r.parent_id = messages.id)', [now]],
    ['participants', 'id', unusedParticipantCondition, [now - RETAIN.unused_participant_hours * HOUR]],
    ['operations', 'rowid', 'expires_at <= ?', [now]],
    ['limits', 'key', 'expires_at <= ?', [now]],
    ['moderation_events', 'id', 'expires_at <= ?', [now]],
  ];
  for (const [table, key, condition, values] of tasks) {
    if (!remaining) break;
    const result = await boundedDelete(db, table, key, condition, values, remaining).run();
    if (!result.success) throw new Error('Civic cleanup failed');
    const count = result.meta.changes;
    if (!Number.isInteger(count) || count < 0 || count > remaining) throw new Error('Civic cleanup missing changes');
    remaining -= count; deleted += count;
  }
  return { deleted };
}
/** 明確呼叫先維護，冇 cron／loop。options.now 回 Date 或 Unix milliseconds；limit 最多 policy.cleanup_batch。 */
export async function maintainCivic(env, options = {}) {
  if (!enabled(env.CIVIC_ENABLED) || !secure(env)) fail(503, 'not_writable', 'Civic 未啟用安全寫入。');
  const db = storage(env);
  await health(db);
  const limit = options.limit ?? LIMIT.cleanup_batch;
  if (!Number.isInteger(limit) || limit < 1 || limit > LIMIT.cleanup_batch) throw new Error('Invalid cleanup limit');
  return cleanup(db, clock(options), limit);
}
async function bootstrap(request, env, db, options, now, creds) {
  if (creds.present) fail(409, 'control_exists', '請保留目前控制匙；唔會暗中建立或覆蓋另一個 participant。');
  const body = await readJSON(request);
  fields(body, ['mode', 'display_name', 'acknowledge_control']);
  if (!['cookie', 'bearer'].includes(body.mode) || body.acknowledge_control !== true)
    fail(400, 'control_acknowledgement', '請明確選擇控制匙模式並確認保管責任。');
  text(body.display_name, LIMIT.display_name_chars, true);
  checkOrigin(request, body.mode === 'cookie');
  const network = await networkKey(request, env, options, now);
  const control = token();
  const participant = { id: id(), display_name: body.display_name, created_at: now };
  const list = [];
  quota(db, list, `new:${network}:${Math.floor(now / DAY)}`, LIMIT.participants_per_network_day, now);
  publicQuota(db, list, now);
  const cleanupIndex = list.length;
  list.push(boundedDelete(db, 'participants', 'id', unusedParticipantCondition,
    [now - RETAIN.unused_participant_hours * HOUR], LIMIT.cleanup_batch));
  guard(db, list, 'quota', 'SELECT count(*) < ? FROM participants', [LIMIT.participants_total]);
  list.push(stmt(db, 'INSERT INTO participants(id,display_name,capability_hash,created_at) VALUES (?,?,?,?)',
    [participant.id, participant.display_name, await digest(control), now]));
  const result = await batch(db, list);
  const reclaimed = result[cleanupIndex].meta?.changes;
  if (Number.isInteger(reclaimed)) await cleanupAfterMutation(db, now, LIMIT.cleanup_batch - reclaimed);
  return response(request, { participant: participantPublic(participant), ...(body.mode === 'bearer' ? { token: control } : {}) },
    201, body.mode === 'cookie' ? { 'Set-Cookie': cookie(control) } : {});
}
async function citizenshipMutation(request, db, auth, now) {
  const actor = auth.actor.id;
  const rev = revision(request);
  const put = request.method === 'PUT';
  const body = put ? await readJSON(request) : null;
  if (put) {
    fields(body, ['display_name', 'becoming', 'offer', 'seek', 'contact_url', 'listed', 'declare', 'consent_version']);
    text(body.display_name, LIMIT.display_name_chars, true);
    for (const field of ['becoming', 'offer', 'seek']) text(body[field], LIMIT.profile_field_chars);
    contactURL(body.contact_url);
    if (typeof body.listed !== 'boolean' || body.declare !== true || body.consent_version !== policy.version)
      fail(400, 'declaration_required', '需要自願宣告、公開選擇同现行 policy version。');
  }
  const result = await operation(db, request, actor, `citizenship.${put ? 'put' : 'delete'}`, actor, body, now, (list) => {
    authGuard(db, list, auth, now, put);
    manageQuota(db, list, actor, now);
    if (put) publicQuota(db, list, now);
    guard(db, list, 'revision', 'EXISTS (SELECT 1 FROM participants WHERE id = ? AND citizenship_revision = ?)', [actor, rev]);
    if (!put) guard(db, list, 'found', 'EXISTS (SELECT 1 FROM citizenships WHERE participant_id = ?)', [actor]);
    list.push(stmt(db, 'UPDATE participants SET citizenship_revision = citizenship_revision + 1, used_at = ? WHERE id = ? AND citizenship_revision = ?', [now, actor, rev]));
    // 後續 INSERT 同樣鎖定新 revision；guard 零行已令整個 batch rollback。
    if (put) list.push(stmt(db, `INSERT INTO citizenships(participant_id,display_name,becoming,offer,seek,contact_url,listed,consent_version,created_at,updated_at,revision)
      SELECT id,?,?,?,?,? ,?,'0.1',?,?,citizenship_revision FROM participants WHERE id = ? AND citizenship_revision = ?
      ON CONFLICT(participant_id) DO UPDATE SET display_name = excluded.display_name, becoming = excluded.becoming,
      offer = excluded.offer, seek = excluded.seek, contact_url = excluded.contact_url, listed = excluded.listed,
      consent_version = excluded.consent_version, updated_at = excluded.updated_at, revision = excluded.revision`,
      [body.display_name, body.becoming, body.offer, body.seek, body.contact_url, Number(body.listed), now, now, actor, rev + 1]));
    else list.push(stmt(db, 'DELETE FROM citizenships WHERE participant_id = ?', [actor]));
  });
  if (result) return response(request, result.body, result.status);
  if (!put) return response(request, { withdrawn: true });
  const citizenship = await getCitizenship(db, actor, true);
  if (!citizenship) fail(404, 'not_found', '公民資料已撤回。');
  return response(request, { citizenship });
}
async function postMessage(request, db, auth, now) {
  const body = await readJSON(request);
  fields(body, ['kind', 'body', 'parent_id', 'publish', 'consent_version']);
  publication(body);
  text(body.body, LIMIT.message_chars, true);
  if (!KINDS.includes(body.kind) || !(body.parent_id === null || (typeof body.parent_id === 'string' && UUID.test(body.parent_id))))
    fail(400, 'invalid_message', '留言種類或 parent_id 無效。');
  const target = id();
  const actor = auth.actor.id;
  const result = await operation(db, request, actor, 'message.post', target, body, now, (list) => {
    authGuard(db, list, auth, now, true);
    quota(db, list, `post-minute:${actor}:${Math.floor(now / 60_000)}`, LIMIT.posts_per_minute, now);
    quota(db, list, `post-day:${actor}:${Math.floor(now / DAY)}`, LIMIT.posts_per_day, now);
    publicQuota(db, list, now);
    guard(db, list, 'quota', 'SELECT count(*) < ? FROM messages WHERE deleted = 0 AND expires_at > ?', [LIMIT.active_messages_total, now]);
    if (body.parent_id !== null) guard(db, list, 'parent', `EXISTS (SELECT 1 FROM messages WHERE id = ? AND parent_id IS NULL AND deleted = 0 AND hidden = 0 AND expires_at > ?)`, [body.parent_id, now]);
    list.push(stmt(db, `INSERT INTO messages(id,owner_id,author_id,author_name,kind,body,parent_id,created_at,expires_at)
      SELECT ?,id,id,display_name,?,?,?,?,CASE WHEN ? IS NULL THEN ? ELSE (SELECT expires_at FROM messages WHERE id = ?) END
      FROM participants WHERE id = ? AND capability_hash = ?`,
      [target, body.kind, body.body, body.parent_id, now, body.parent_id, now + RETAIN.message_days * DAY, body.parent_id, actor, auth.hash]));
    touch(db, list, actor, now);
  });
  return response(request, result?.body ?? { message: await getMessage(db, target, now, actor) }, result?.status ?? 201);
}
const scrubMessage = 'body = NULL, author_id = NULL, author_name = NULL, deleted = 1, revision = revision + 1';
async function editMessage(request, db, auth, now, target) {
  const patch = request.method === 'PATCH';
  const rev = revision(request);
  const body = patch ? await readJSON(request) : null;
  if (patch) { fields(body, ['body', 'publish', 'consent_version']); publication(body); text(body.body, LIMIT.message_chars, true); }
  const actor = auth.actor.id;
  const result = await operation(db, request, actor, `message.${patch ? 'patch' : 'delete'}`, target, body, now, (list) => {
    authGuard(db, list, auth, now, patch);
    manageQuota(db, list, actor, now);
    if (patch) publicQuota(db, list, now);
    guard(db, list, 'found', 'EXISTS (SELECT 1 FROM messages WHERE id = ? AND deleted = 0)', [target]);
    guard(db, list, 'ownership', 'EXISTS (SELECT 1 FROM messages WHERE id = ? AND owner_id = ?)', [target, actor]);
    guard(db, list, 'revision', 'EXISTS (SELECT 1 FROM messages WHERE id = ? AND revision = ?)', [target, rev]);
    if (patch) guard(db, list, 'parent', `EXISTS (SELECT 1 FROM messages m WHERE m.id = ? AND m.expires_at > ? AND
      (m.parent_id IS NULL OR EXISTS (SELECT 1 FROM messages p WHERE p.id = m.parent_id AND p.parent_id IS NULL AND p.hidden = 0 AND p.expires_at > ?)))`, [target, now, now]);
    list.push(stmt(db, `UPDATE messages SET ${patch ? 'body = ?, revision = revision + 1' : scrubMessage}
      WHERE id = ? AND owner_id = ? AND revision = ? AND deleted = 0`, patch ? [body.body, target, actor, rev] : [target, actor, rev]));
    touch(db, list, actor, now);
  });
  return response(request, result?.body ?? (patch ? { message: await getMessage(db, target, now, actor) } : { deleted: true }), result?.status ?? 200);
}
async function deleteMe(request, db, auth, now, creds) {
  const actor = auth.actor.id;
  const result = await operation(db, request, actor, 'participant.delete', actor, null, now, (list) => {
    authGuard(db, list, auth, now);
    manageQuota(db, list, actor, now);
    list.push(stmt(db, `UPDATE messages SET ${scrubMessage}, owner_id = NULL WHERE owner_id = ?`, [actor]));
    list.push(stmt(db, 'DELETE FROM citizenships WHERE participant_id = ?', [actor]));
    list.push(stmt(db, 'DELETE FROM operations WHERE actor_id = ?', [actor]));
    for (const prefix of ['manage', 'post-minute', 'post-day'])
      list.push(stmt(db, 'DELETE FROM limits WHERE key LIKE ?', [`${prefix}:${actor}:%`]));
    list.push(stmt(db, 'DELETE FROM participants WHERE id = ? AND capability_hash = ?', [actor, auth.hash]));
  });
  return response(request, result?.body ?? { deleted: true }, 200, creds.mode === 'cookie' ? { 'Set-Cookie': cookie('', true) } : {});
}
async function moderate(request, env, db, now, creds) {
  checkOrigin(request);
  if (creds.mode !== 'bearer' || !await equalSecret(env.CIVIC_MODERATOR_SECRET, creds.value))
    fail(403, 'operator_required', '需要獨立 operator credential。');
  const body = await readJSON(request);
  fields(body, ['target', 'id', 'action', 'reason']);
  const allowed = { participant: ['block', 'unblock'], message: ['hide', 'restore', 'delete'], citizenship: ['hide', 'restore', 'delete'] };
  if (!Object.hasOwn(allowed, body.target) || !allowed[body.target].includes(body.action) || typeof body.id !== 'string' || !UUID.test(body.id))
    fail(400, 'invalid_moderation', 'target/action 組合無效。');
  // 理由只留 metadata code，唔收另一份正文／個人資料。
  if (typeof body.reason !== 'string' || !/^[a-z][a-z0-9_-]{0,79}$/.test(body.reason)) fail(400, 'invalid_reason', 'reason 必須係短理由碼。');
  const operator = `operator:${await digest(env.CIVIC_MODERATOR_SECRET)}`;
  const result = await operation(db, request, operator, 'moderation', body.id, body, now, (list) => {
    manageQuota(db, list, operator, now);
    const table = { participant: 'participants', message: 'messages', citizenship: 'citizenships' }[body.target];
    const key = body.target === 'citizenship' ? 'participant_id' : 'id';
    guard(db, list, 'found', `EXISTS (SELECT 1 FROM ${table} WHERE ${key} = ?)`, [body.id]);
    if (body.target === 'participant') list.push(stmt(db, 'UPDATE participants SET posting_blocked = ? WHERE id = ?', [Number(body.action === 'block'), body.id]));
    else if (body.action === 'delete' && body.target === 'citizenship') {
      list.push(stmt(db, 'UPDATE participants SET citizenship_revision = citizenship_revision + 1 WHERE id = ?', [body.id]));
      list.push(stmt(db, 'DELETE FROM citizenships WHERE participant_id = ?', [body.id]));
    } else if (body.action === 'delete') list.push(stmt(db, `UPDATE messages SET ${scrubMessage} WHERE id = ?`, [body.id]));
    else {
      if (body.target === 'message') guard(db, list, 'found', 'EXISTS (SELECT 1 FROM messages WHERE id = ? AND deleted = 0 AND expires_at > ?)', [body.id, now]);
      list.push(stmt(db, `UPDATE ${table} SET hidden = ? WHERE ${key} = ?`, [Number(body.action === 'hide'), body.id]));
    }
    list.push(stmt(db, 'INSERT INTO moderation_events(id,target,target_id,action,reason,created_at,expires_at) VALUES (?,?,?,?,?,?,?)',
      [id(), body.target, body.id, body.action, body.reason, now, now + RETAIN.moderation_days * DAY]));
  });
  return response(request, result?.body ?? { moderated: true });
}
async function publicRead(request, db, now, path, url) {
  if (path === '/citizens') {
    const limit = pagination(url, ['cursor', 'q', 'limit']);
    const q = url.searchParams.get('q') || '';
    text(q, LIMIT.profile_field_chars);
    const scope = `citizens:${await digest(q)}`;
    const cursor = decodeCursor(url.searchParams.get('cursor'), scope);
    const values = [];
    let filter = 'listed = 1 AND hidden = 0';
    if (q) { filter += ' AND (instr(lower(display_name), lower(?)) > 0 OR instr(lower(becoming), lower(?)) > 0 OR instr(lower(offer), lower(?)) > 0 OR instr(lower(seek), lower(?)) > 0)'; values.push(q, q, q, q); }
    if (cursor) { filter += ' AND (created_at < ? OR (created_at = ? AND participant_id < ?))'; values.push(cursor[0], cursor[0], cursor[1]); }
    const found = await rows(db, `SELECT * FROM citizenships WHERE ${filter} ORDER BY created_at DESC, participant_id DESC LIMIT ?`, [...values, limit + 1]);
    const page = found.slice(0, limit);
    return { items: page.map(citizenshipPublic), next_cursor: found.length > limit ? encodeCursor(page.at(-1), scope) : null, as_of: iso(now) };
  }
  if (path.startsWith('/citizens/')) {
    pagination(url, []);
    const citizenship = await getCitizenship(db, path.slice('/citizens/'.length));
    if (!citizenship) fail(404, 'not_found', '公民資料不存在或未公開。');
    return { citizenship };
  }
  if (path.startsWith('/messages/')) { pagination(url, []); return { message: await getMessage(db, path.slice('/messages/'.length), now) }; }
  const limit = pagination(url, ['parent_id', 'kind', 'cursor', 'limit']);
  const parent = url.searchParams.get('parent_id');
  const kind = url.searchParams.get('kind');
  if ((parent !== null && !UUID.test(parent)) || (kind !== null && !KINDS.includes(kind))) fail(400, 'invalid_query', 'parent_id 或 kind 無效。');
  if (parent) {
    const p = await getMessage(db, parent, now);
    if (p.parent_id !== null) fail(409, 'invalid_parent', '只接受頂層留言。');
  }
  const scope = `messages:${parent || ''}:${kind || ''}`;
  const cursor = decodeCursor(url.searchParams.get('cursor'), scope);
  let filter = `${visible()} AND m.parent_id ${parent ? '= ?' : 'IS NULL'}`;
  const values = [now, now, now, now, ...(parent ? [parent] : [])];
  if (kind) { filter += ' AND m.kind = ?'; values.push(kind); }
  if (cursor) { filter += ' AND (m.created_at < ? OR (m.created_at = ? AND m.id < ?))'; values.push(cursor[0], cursor[0], cursor[1]); }
  const found = await rows(db, `${messageSelect} WHERE ${filter} ORDER BY m.created_at DESC, m.id DESC LIMIT ?`, [...values, limit + 1]);
  const page = found.slice(0, limit);
  return { items: page.map(messagePublic), next_cursor: found.length > limit ? encodeCursor(page.at(-1), scope) : null, as_of: iso(now) };
}
/** options.now: () => Date | Unix milliseconds. options.testNetworkIdentifier: 明確測試注入，唔讀 HTTP test headers。 */
export async function handleCivicRequest(request, env = {}, options = {}) {
  if (!isCivicRequest(request)) return null;
  const url = new URL(request.url);
  const path = url.pathname.slice(CIVIC_API_PREFIX.length);
  const method = request.method === 'HEAD' ? 'GET' : request.method;
  let now;
  try { now = clock(options); } catch { return response(request, { error: { code: 'unavailable', message: 'Civic clock unavailable。' } }, 503); }
  const statusBody = { protocol: policy.protocol, available: false, writable: false, policy,
    counts: { listed_citizens: null, messages: null }, as_of: iso(now) };
  let creds;
  try {
    let methods;
    if (path === '/status') methods = ['GET', 'HEAD'];
    else if (path === '/participants' || path === '/moderation') methods = ['POST'];
    else if (path === '/me') methods = ['GET', 'HEAD', 'DELETE'];
    else if (path === '/me/citizenship') methods = ['PUT', 'DELETE'];
    else if (path === '/citizens' || /^\/citizens\/[0-9a-f-]{36}$/.test(path)) methods = ['GET', 'HEAD'];
    else if (path === '/messages') methods = ['GET', 'HEAD', 'POST'];
    else if (/^\/messages\/[0-9a-f-]{36}$/.test(path)) methods = ['GET', 'HEAD', 'PATCH', 'DELETE'];
    else fail(404, 'not_found', '未知 Civic 路由。');
    if (!methods.includes(request.method)) return response(request, { error: { code: 'method_not_allowed', message: '呢條路由唔接受此方法。' } }, 405, { Allow: methods.join(', ') });
    const db = storage(env);
    await health(db);
    creds = credentials(request);
    if (path === '/status') {
      pagination(url, []);
      if (secure(env)) await readQuota(request, env, db, options, now);
      const counts = await first(db, `SELECT (SELECT count(*) FROM citizenships WHERE listed = 1 AND hidden = 0) AS listed_citizens,
        (SELECT count(*) FROM messages m WHERE ${visible()}) AS messages`, [now, now, now]);
      return response(request, { ...statusBody, available: true, writable: enabled(env.CIVIC_ENABLED) && secure(env), counts });
    }
    if (!secure(env)) fail(503, 'not_writable', 'Civic 必要安全設定未齊。');
    if (method !== 'GET' && !enabled(env.CIVIC_ENABLED)) fail(503, 'not_writable', 'Civic 寫入未啟用。');
    if (method === 'GET') {
      if (path === '/me') {
        pagination(url, []);
        const auth = await authenticate(request, env, db, creds, now);
        await readQuota(request, env, db, options, now, auth.actor.id);
        // Profile 同單調 revision 用同一 read transaction，唔拼埋兩個時刻嘅自己。
        const [participants, citizenships] = await batch(db, [
          stmt(db, 'SELECT * FROM participants WHERE id = ? AND capability_hash = ?', [auth.actor.id, auth.hash]),
          stmt(db, 'SELECT * FROM citizenships WHERE participant_id = ?', [auth.actor.id]),
        ]);
        const current = participants.results[0];
        if (!current) fail(401, 'unauthorized', '控制匙已失效。');
        return response(request, { participant: { ...participantPublic(current), posting_blocked: !!current.posting_blocked },
          citizenship: citizenshipPublic(citizenships.results[0]), citizenship_revision: current.citizenship_revision, csrf: auth.csrf });
      }
      await readQuota(request, env, db, options, now);
      return response(request, await publicRead(request, db, now, path, url));
    }
    pagination(url, []);
    checkOrigin(request);
    if (path === '/participants') return await bootstrap(request, env, db, options, now, creds);
    if (path === '/moderation') return await moderate(request, env, db, now, creds);
    const auth = await authenticate(request, env, db, creds, now, true);
    if (method === 'DELETE') await rejectBody(request);
    if (path === '/me/citizenship') return await citizenshipMutation(request, db, auth, now);
    if (path === '/me') return await deleteMe(request, db, auth, now, creds);
    if (path === '/messages') return await postMessage(request, db, auth, now);
    return await editMessage(request, db, auth, now, path.slice('/messages/'.length));
  } catch (error) {
    const e = mapError(error);
    const body = { error: { code: e.code, message: e.message } };
    const headers = e.status === 429 ? { 'Retry-After': '60' } : {};
    // 只由 GET /me 確认單一 cookie 無效／已撤銷先清；唔將未知 DB 錯誤當撤銷。
    if (request.method === 'GET' && path === '/me' && creds?.mode === 'cookie' &&
        error instanceof CivicError && e.code === 'unauthorized') headers['Set-Cookie'] = cookie('', true);
    return response(request, path === '/status' && e.status === 503 ? { ...statusBody, ...body } : body, e.status, headers);
  }
}
