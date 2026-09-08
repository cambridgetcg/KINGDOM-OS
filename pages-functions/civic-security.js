import policy from '../data/civic-policy.json';

export const COOKIE = '__Host-kingdom-civic';
export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
const encoder = new TextEncoder();
export class CivicError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export function fail(status, code, message) { throw new CivicError(status, code, message); }
export function enabled(value) { return value === true || value === 'true'; }
export function secure(env) {
  return typeof env.CIVIC_HMAC_SECRET === 'string' && env.CIVIC_HMAC_SECRET.length >= 32 &&
    typeof env.CIVIC_MODERATOR_SECRET === 'string' && env.CIVIC_MODERATOR_SECRET.length >= 32 &&
    env.CIVIC_HMAC_SECRET !== env.CIVIC_MODERATOR_SECRET;
}
export function clock(options) {
  const value = options.now ? options.now() : Date.now();
  const now = value instanceof Date ? value.getTime() : value;
  if (!Number.isSafeInteger(now) || now < 0) throw new Error('Invalid civic clock');
  return now;
}
export const iso = (time) => new Date(time).toISOString();
export const id = () => crypto.randomUUID();
export function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
export const token = () => `kc_${base64url(crypto.getRandomValues(new Uint8Array(32)))}`;
export async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(bytes)].map((n) => n.toString(16).padStart(2, '0')).join('');
}
export async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}
export async function equalSecret(expected, candidate) {
  const [a, b] = await Promise.all([expected, candidate].map((s) => crypto.subtle.digest('SHA-256', encoder.encode(s))));
  if (typeof crypto.subtle.timingSafeEqual === 'function') return crypto.subtle.timingSafeEqual(a, b);
  // 非 Workers 測試 runtime 都交畀 native Web Crypto 做比較，唔用字串／JS early return。
  const ka = await crypto.subtle.importKey('raw', a, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const kb = await crypto.subtle.importKey('raw', b, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const message = encoder.encode('kingdom.civic.constant-comparison/0.1');
  return crypto.subtle.verify('HMAC', ka, await crypto.subtle.sign('HMAC', kb, message), message);
}
export function credentials(request) {
  const cookies = (request.headers.get('Cookie') || '').split(';').map((v) => v.trim())
    .filter((v) => v === COOKIE || v.startsWith(`${COOKIE}=`));
  const authorization = request.headers.get('Authorization');
  if (cookies.length > 1 || (cookies.length && authorization !== null))
    fail(400, 'mixed_credentials', '唔可以混用或重複控制匙。');
  if (authorization !== null) {
    const match = /^Bearer ([^\s,]+)$/.exec(authorization);
    return { present: true, mode: 'bearer', value: match?.[1] || '' };
  }
  if (cookies.length) return { present: true, mode: 'cookie', value: cookies[0].slice(COOKIE.length + 1) };
  return { present: false, mode: null, value: '' };
}
export function checkOrigin(request, required = false) {
  const origin = request.headers.get('Origin');
  if ((required && origin === null) || (origin !== null && origin !== new URL(request.url).origin))
    fail(403, 'origin_rejected', '寫入只接受完全相同來源。');
}
export function cookie(value, remove = false) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict${remove ? '; Max-Age=0' : ''}`;
}
export async function networkKey(request, env, options, now) {
  // 測試只可透過函數 options 明確注入；任何 HTTP test header 都唔係開關。
  let network = options.testNetworkIdentifier;
  if (network !== undefined && (typeof network !== 'string' || !network || network.length > 256))
    throw new Error('Invalid explicit test network identifier');
  if (network === undefined) {
    const host = new URL(request.url).hostname;
    const local = enabled(env.CIVIC_LOCAL) && ['localhost', '127.0.0.1', '[::1]'].includes(host);
    network = local ? 'local-loopback' : request.headers.get('CF-Connecting-IP');
    if (!network || network.length > 64 || !/^[0-9a-fA-F:.]+$/.test(network)) {
      if (!local) fail(503, 'network_unavailable', '暫時無法安全執行流量限制。');
    }
  }
  return hmac(env.CIVIC_HMAC_SECRET, `network:${Math.floor(now / DAY)}:${network}`);
}
async function readBytes(request) {
  const announced = request.headers.get('Content-Length');
  if (announced !== null && (!/^\d+$/.test(announced) || Number(announced) > policy.limits.body_bytes))
    fail(413, 'body_too_large', '請求超過 byte 上限。');
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array(0);
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > policy.limits.body_bytes) {
        await reader.cancel();
        fail(413, 'body_too_large', '請求超過 byte 上限。');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
export async function rejectBody(request) {
  if ((await readBytes(request)).byteLength) fail(400, 'unexpected_body', '呢個操作唔接受 body。');
}
export async function readJSON(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
    fail(415, 'content_type', '請使用 application/json。');
  const bytes = await readBytes(request);
  try {
    const result = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error();
    return result;
  } catch { fail(400, 'invalid_json', 'JSON 或 UTF-8 格式無效。'); }
}
export function fields(body, keys) {
  if (Object.keys(body).length !== keys.length || keys.some((key) => !Object.hasOwn(body, key)))
    fail(400, 'invalid_fields', 'JSON 欄位唔符合合約。');
}
export function text(value, max, required = false) {
  if (typeof value !== 'string' || [...value].length > max || (required && !value.trim()) ||
      /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(value) || /[\uD800-\uDFFF]/u.test(value))
    fail(400, 'invalid_text', '文字長度或字元無效。');
  return value;
}
export function contactURL(value) {
  text(value, policy.limits.url_chars);
  if (value === '') return value;
  if (/[\s\p{Cc}\p{Cf}\\]/u.test(value) || /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value) || /^https:\/\/[^/?#]*@/i.test(value))
    fail(400, 'invalid_url', '只接受無控制字元及登入資料嘅 HTTPS URL。');
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || !/^https:\/\//i.test(value)) throw new Error();
  } catch { fail(400, 'invalid_url', '只接受無登入資料嘅 HTTPS URL。'); }
  return value;
}
export function publication(body) {
  if (body.publish !== true || body.consent_version !== policy.version)
    fail(400, 'publication_required', '請明確確認公開發表同現行政策。');
}
export function revision(request) {
  const match = /^"(0|[1-9]\d*)"$/.exec(request.headers.get('If-Match') || '');
  if (!match || !Number.isSafeInteger(Number(match[1]))) fail(428, 'revision_required', '需要 If-Match 版本。');
  return Number(match[1]);
}
export function operationKey(request) {
  const key = request.headers.get('Idempotency-Key') || '';
  if ([...key].length < 8 || [...key].length > 100 || /[\x00-\x1f\x7f]/u.test(key)) fail(400, 'idempotency_required', '需要 8–100 字元 Idempotency-Key。');
  return key;
}
export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
}
export function pagination(url, allowed) {
  for (const key of url.searchParams.keys()) {
    if (!allowed.includes(key) || url.searchParams.getAll(key).length !== 1) fail(400, 'invalid_query', '查詢欄位無效。');
  }
  const raw = url.searchParams.get('limit');
  const limit = raw === null ? policy.limits.page_default : Number(raw);
  if ((raw !== null && !/^[1-9]\d*$/.test(raw)) || !Number.isInteger(limit) || limit > policy.limits.page_max)
    fail(400, 'invalid_query', '分頁上限無效。');
  return limit;
}
export function encodeCursor(row, scope) {
  return base64url(encoder.encode(JSON.stringify([row.created_at, row.id ?? row.participant_id, scope])));
}
export function decodeCursor(raw, scope) {
  if (!raw) return null;
  try {
    if (raw.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(raw)) throw new Error();
    const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(
      Uint8Array.from(atob(raw.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0))));
    if (!Array.isArray(data) || data.length !== 3 || !Number.isSafeInteger(data[0]) || data[0] < 0 ||
        typeof data[1] !== 'string' || !/^[a-f0-9-]{36}$/.test(data[1]) || data[2] !== scope) throw new Error();
    return data;
  } catch { fail(400, 'invalid_cursor', '分頁 cursor 無效。'); }
}
