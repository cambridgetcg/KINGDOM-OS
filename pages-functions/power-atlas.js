/** Static Power Atlas family. Only the public path/MIME projection enters the
 * Worker bundle; provenance and byte receipts stay in the build-time boundary.
 * Call only inside the existing Kingdom-host / explicit loopback-test gate.
 */
import assets from "./power-atlas-assets.json";

export const POWER_ATLAS_ROUTES = Object.freeze(assets.map(({ path, mediaType }) =>
  Object.freeze({ path: path === "index.html" ? "/power-atlas/" : `/power-atlas/${path}`, mediaType })));
const mediaTypes = new Map(POWER_ATLAS_ROUTES.map(({ path, mediaType }) => [path, mediaType]));
export const POWER_ATLAS_ALIASES = Object.freeze(["/power-atlas", "/power-atlas/index.html"]);
export const POWER_ATLAS_CSP = [
  "default-src 'none'", "base-uri 'none'", "object-src 'none'", "form-action 'none'",
  "frame-ancestors 'none'", "script-src 'self'", "style-src 'self'",
  "font-src 'self'", "img-src 'self'", "connect-src 'self'",
].join("; ");
export const POWER_ATLAS_PERMISSIONS = [
  "accelerometer=()", "autoplay=()", "camera=()", "display-capture=()",
  "geolocation=()", "gyroscope=()", "magnetometer=()", "microphone=()", "payment=()", "usb=()",
].join(", ");

export function isPowerAtlasPath(path) {
  return path === "/power-atlas" || path.startsWith("/power-atlas/");
}

function response(request, status, headers = new Headers(), body = null) {
  headers.set("cache-control", "no-store, no-transform");
  headers.set("content-security-policy", POWER_ATLAS_CSP);
  headers.set("permissions-policy", POWER_ATLAS_PERMISSIONS);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "no-referrer");
  headers.set("x-frame-options", "DENY");
  headers.delete("set-cookie");
  return new Response(request.method === "HEAD" || status === 304 ? null : body, { status, headers });
}

function matchesMedia(expected, observed) {
  const wanted = expected.split(";", 1)[0];
  return observed === wanted || (wanted === "text/javascript" && observed === "application/javascript") ||
    (wanted === "text/markdown" && observed === "text/plain");
}

export async function handlePowerAtlasRequest(request, env) {
  const path = new URL(request.url).pathname;
  const alias = POWER_ATLAS_ALIASES.includes(path);
  const expected = mediaTypes.get(path);
  if (!expected && !alias) return response(request, 404);
  if (request.method !== "GET" && request.method !== "HEAD") {
    return response(request, 405, new Headers({ allow: "GET, HEAD" }));
  }
  // No fragment in Location: browsers inherit the original fragment. Do not
  // interpret the hash or forward query data to guest/Civic/census handlers.
  if (alias) return response(request, 308, new Headers({ location: "/power-atlas/" }));
  try {
    const asset = await env.ASSETS.fetch(request);
    const media = (asset.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
    const valid = (asset.status === 200 && matchesMedia(expected, media) &&
      (request.method === "HEAD" || asset.body !== null)) ||
      (asset.status === 304 && (!media || matchesMedia(expected, media)));
    if (!valid) {
      // Never pass an upstream error/redirect or homepage fallback body through.
      if (asset.body) await asset.body.cancel();
      return response(request, asset.status === 404 ? 404 : asset.status >= 500 ? 503 : 502);
    }
    const headers = new Headers(asset.headers);
    if (asset.status === 200 || media) headers.set("content-type", expected);
    if (request.method === "HEAD" && asset.body) await asset.body.cancel();
    return response(request, asset.status, headers, asset.body);
  } catch {
    return response(request, 503);
  }
}
