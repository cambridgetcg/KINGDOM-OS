export const AGENT_ENTRY_PATH = "/agent-entry.json";
export const PUBLIC_MODULES_PATH = "/modules.json";
export const AGENT_ENTRY_LINK = '</agent-entry.json>; rel="alternate"; type="application/json"; title="Compact agent entry"';

// Static, mutable hub discovery. Reject Pages' HTML fallback for these JSON routes.
export async function handleAgentEntry(request, env, path = AGENT_ENTRY_PATH) {
  const unavailable = path === PUBLIC_MODULES_PATH ? "public_modules_unavailable" : "agent_entry_unavailable";
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    link: path === PUBLIC_MODULES_PATH
      ? '</#civic-modules>; rel="alternate"; type="text/html"; title="Human module directory"'
      : '</>; rel="alternate"; type="text/html"; title="Human entry"',
  });
  const failure = (status, error) => new Response(request.method === "HEAD" ? null : JSON.stringify({ error }), { status, headers });
  if (request.method !== "GET" && request.method !== "HEAD") {
    headers.set("allow", "GET, HEAD");
    return failure(405, "method_not_allowed");
  }
  let asset;
  try {
    const validators = new Headers();
    for (const name of ["if-none-match", "if-modified-since"]) {
      if (request.headers.has(name)) validators.set(name, request.headers.get(name));
    }
    asset = await env.ASSETS.fetch(new Request(new URL(path, request.url), { method: request.method, headers: validators }));
  } catch {
    return failure(503, unavailable);
  }
  const media = (asset.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
  const valid = asset.status === 200 && media === "application/json" || asset.status === 304 && (!media || media === "application/json");
  if (!valid) {
    await asset.body?.cancel().catch(() => {});
    return failure(asset.status === 404 ? 404 : 503, unavailable);
  }
  headers.set("cache-control", "no-cache, no-transform");
  for (const name of ["etag", "last-modified"]) if (asset.headers.has(name)) headers.set(name, asset.headers.get(name));
  return new Response(request.method === "HEAD" || asset.status === 304 ? null : asset.body, { status: asset.status, headers });
}
