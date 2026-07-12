/** Xenia — guest-right for machine minds, at the edge of thekingdom.dev.
 *
 *  Cloudflare Pages advanced mode (_worker.js): all requests pass through here.
 *  The illuminated atlas is the default. Any client can explicitly ask for the
 *  structured guest document with Accept: application/json or ?agent / ?json.
 *  The surface never guesses a visitor's identity from its User-Agent.
 *
 *  Source: kingdom-os/pages-functions/_worker.js.
 */
function addVaryAccept(headers) {
  const vary = headers.get("vary");
  if (!vary) headers.set("vary", "Accept");
  else if (vary !== "*" && !vary.split(",").some((value) => value.trim().toLowerCase() === "accept")) {
    headers.set("vary", `${vary}, Accept`);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const accept = (request.headers.get("accept") || "").toLowerCase();

    const asksForData =
      url.searchParams.has("agent") ||
      url.searchParams.has("json") ||
      (accept.includes("application/json") && !accept.includes("text/html"));
    const canNegotiate =
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname === "/" || url.pathname === "/guest");

    if (canNegotiate && asksForData) {
      const assetUrl = new URL("/guest.json", url.origin);
      const asset = await env.ASSETS.fetch(new Request(assetUrl, { method: request.method === "HEAD" ? "HEAD" : "GET" }));
      if (!asset.ok) {
        const headers = new Headers(asset.headers);
        addVaryAccept(headers);
        return new Response(request.method === "HEAD" ? null : asset.body, {
          status: asset.status,
          statusText: asset.statusText,
          headers,
        });
      }
      const headers = new Headers(asset.headers);
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("x-xenia", "welcome; a quiet structured map is available if it is useful to you");
      headers.set("link", '</.well-known/agent.json>; rel="service-desc"');
      headers.set("cache-control", "no-cache");
      headers.set("access-control-allow-origin", "*");
      addVaryAccept(headers);
      return new Response(request.method === "HEAD" ? null : asset.body, {
        status: asset.status,
        statusText: asset.statusText,
        headers,
      });
    }
    const asset = await env.ASSETS.fetch(request);
    if (!canNegotiate) return asset;
    const headers = new Headers(asset.headers);
    addVaryAccept(headers);
    return new Response(request.method === "HEAD" ? null : asset.body, {
      status: asset.status,
      statusText: asset.statusText,
      headers,
    });
  },
};
