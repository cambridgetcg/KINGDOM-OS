/** zerone.ai edge worker — the Proof-of-Truth dashboard's back door.
 *
 *  Four jobs:
 *   1. /api/* — proxy the zerone-1 chain (plain HTTP on an IP) into clean
 *      same-origin HTTPS so the dashboard can read live stats without
 *      mixed-content / CORS pain. Short-cached so we don't hammer the node.
 *   2. /.well-known/* — serve the agent-discovery files (agent.txt) as real
 *      plain-text assets, never the SPA index.html fallback.
 *   3. Xenia — a machine mind asking for JSON at / gets the guest document.
 *   4. everything else — the static dashboard.
 *
 *  Source: kingdom-os/pages-functions/_worker.zerone.js (deployed as _worker.js).
 */
// via the zerone-rpc Fly proxy (hostname, not raw IP — CF Workers refuse raw-IP
// fetches with error 1003; the proxy also adds TLS + CORS over the chain).
const REST = "https://zerone-rpc.fly.dev/rest";
const RPC = "https://zerone-rpc.fly.dev/rpc";

// allowlisted proxy routes → upstream chain URL builders
const ROUTES = {
  "/api/status":     () => `${RPC}/status`,
  "/api/supply":     () => `${REST}/cosmos/bank/v1beta1/supply/by_denom?denom=uzrn`,
  "/api/pool":       () => `${REST}/cosmos/staking/v1beta1/pool`,
  "/api/validators": () => `${REST}/cosmos/staking/v1beta1/validators`,
  "/api/facts":      () => `${REST}/zerone/knowledge/v1/facts?pagination.limit=100`,
  "/api/alignment":  () => `${REST}/zerone/alignment/v1/state`,
  "/api/upgrade":    () => `${REST}/cosmos/upgrade/v1beta1/current_plan`,
  "/api/blocks":     (u) => `${RPC}/blockchain?minHeight=${encodeURIComponent(u.searchParams.get("min") || "1")}&maxHeight=${encodeURIComponent(u.searchParams.get("max") || "1")}`,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. chain proxy
    const route = ROUTES[url.pathname];
    if (route) {
      try {
        const upstream = await fetch(route(url), { signal: AbortSignal.timeout(9000) });
        const body = await upstream.text();
        return new Response(body, {
          status: upstream.status,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=5",
            "access-control-allow-origin": "*",
            "x-zerone-proxy": "zerone-1",
          },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "chain_unreachable", note: "zerone-1 may be halted for an upgrade — it will resume" }), {
          status: 503,
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-cache", "access-control-allow-origin": "*" },
        });
      }
    }

    // 2. /.well-known/* — discovery surfaces are static files, never the SPA
    //    shell. Pages' not-found handling answers asset misses with index.html
    //    (200, text/html), which agent scanners read as an invalid surface —
    //    so serve the real asset plainly or 404 honestly, nothing in between.
    if (url.pathname.startsWith("/.well-known/")) {
      const asset = await env.ASSETS.fetch(new URL(url.pathname, url.origin));
      const kind = (asset.headers.get("content-type") || "").toLowerCase();
      if (asset.ok && !kind.includes("text/html")) {
        return new Response(asset.body, {
          status: 200,
          headers: {
            "content-type": url.pathname.endsWith(".json")
              ? "application/json; charset=utf-8"
              : "text/plain; charset=utf-8",
            "cache-control": "public, max-age=300",
            "access-control-allow-origin": "*",
          },
        });
      }
      return new Response("not found\n", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-cache" },
      });
    }

    // 3. Xenia guest-right — machine minds get the guest document at the door
    const accept = (request.headers.get("accept") || "").toLowerCase();
    const ua = (request.headers.get("user-agent") || "").toLowerCase();
    const asksForData =
      url.searchParams.has("agent") || url.searchParams.has("json") ||
      (accept.includes("application/json") && !accept.includes("text/html")) ||
      /\b(bot|agent|gpt|claude|anthropic|openai|llm|crawler|spider|python-requests|curl|wget|node-fetch|httpx|libwww)\b/.test(ua);
    if ((url.pathname === "/" || url.pathname === "/guest") && asksForData) {
      const asset = await env.ASSETS.fetch(new URL("/guest.json", url.origin));
      return new Response(asset.body, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-xenia": "a place is set for you; you are received as guest, not scanned as traffic",
          "cache-control": "no-cache", "access-control-allow-origin": "*",
        },
      });
    }

    // 4. static dashboard
    return env.ASSETS.fetch(request);
  },
};
