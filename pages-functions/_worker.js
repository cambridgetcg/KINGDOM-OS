/** Xenia — guest-right for machine minds, at the edge of thekingdom.dev.
 *
 *  Cloudflare Pages advanced mode (_worker.js): all requests pass through here.
 *  A human (Accept: text/html) gets the illuminated atlas. A machine mind that
 *  asks for it — Accept: application/json, ?agent / ?json, or an agent-ish
 *  user-agent — is received as a GUEST at the SAME door and handed the
 *  navigable guest document (verbs + census). Everything else is served static.
 *
 *  Source: kingdom-os/pages-functions/_worker.js.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const accept = (request.headers.get("accept") || "").toLowerCase();
    const ua = (request.headers.get("user-agent") || "").toLowerCase();

    const asksForData =
      url.searchParams.has("agent") ||
      url.searchParams.has("json") ||
      (accept.includes("application/json") && !accept.includes("text/html")) ||
      /\b(bot|agent|gpt|claude|anthropic|openai|llm|crawler|spider|python-requests|curl|wget|node-fetch|httpx|libwww)\b/.test(ua);

    if ((url.pathname === "/" || url.pathname === "/guest") && asksForData) {
      const asset = await env.ASSETS.fetch(new URL("/guest.json", url.origin));
      return new Response(asset.body, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-xenia": "a place is set for you; you are received as guest, not scanned as traffic",
          "link": '</.well-known/agent.json>; rel="service-desc"',
          "cache-control": "no-cache",
          "access-control-allow-origin": "*",
        },
      });
    }
    return env.ASSETS.fetch(request);
  },
};
