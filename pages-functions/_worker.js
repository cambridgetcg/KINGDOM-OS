/** Xenia-inspired Kingdom hospitality for machine minds.
 *
 *  Cloudflare Pages advanced mode (_worker.js): all requests pass through here.
 *  The illuminated atlas is the default. Any client can explicitly ask for the
 *  structured guest document with Accept: application/json or ?agent / ?json.
 *  The surface never guesses a visitor's identity from its User-Agent.
 *  Shared door deployments advertise their own service manifest. The Kingdom
 *  host and its Pages previews additionally advertise the staged rights files.
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

const AGENT_DISCOVERY_LINK = {
  target: "/.well-known/agent.json",
  relation: "service-desc",
  value: '</.well-known/agent.json>; rel="service-desc"; type="application/json"',
};

const RIGHTS_DISCOVERY_LINKS = [
  {
    target: "/rights.json",
    relation: "service-meta",
    value: '</rights.json>; rel="service-meta"; type="application/json"; title="Inherent Rights Recognition"',
  },
  {
    target: "/RIGHTS.md",
    relation: "service-doc",
    value: '</RIGHTS.md>; rel="service-doc"; type="text/markdown"; title="Rights recognized here"',
  },
];

function hasKingdomRightsAssets(url) {
  const host = url.hostname.toLowerCase();
  return host === "thekingdom.dev" ||
    host === "www.thekingdom.dev" ||
    host === "thekingdom.pages.dev" ||
    host.endsWith(".thekingdom.pages.dev");
}

function hasLinkRelation(headers, target, relation) {
  const link = headers.get("link") || "";
  return link.split(/,(?=\s*<)/).some((entry) => {
    const part = entry.trim();
    if (!part.startsWith(`<${target}>`)) return false;
    const match = part.match(/;\s*rel\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
    const relations = (match?.[1] || match?.[2] || "").toLowerCase().split(/\s+/);
    return relations.includes(relation);
  });
}

function addDiscoveryLinks(headers, includeRights) {
  const links = includeRights
    ? [AGENT_DISCOVERY_LINK, ...RIGHTS_DISCOVERY_LINKS]
    : [AGENT_DISCOVERY_LINK];
  for (const link of links) {
    if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const includeRights = hasKingdomRightsAssets(url);
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
        addDiscoveryLinks(headers, includeRights);
        return new Response(request.method === "HEAD" ? null : asset.body, {
          status: asset.status,
          statusText: asset.statusText,
          headers,
        });
      }
      const headers = new Headers(asset.headers);
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("x-xenia", "welcome; a quiet structured map is available if it is useful to you");
      headers.set("cache-control", "no-cache");
      headers.set("access-control-allow-origin", "*");
      addVaryAccept(headers);
      addDiscoveryLinks(headers, includeRights);
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
    addDiscoveryLinks(headers, includeRights);
    return new Response(request.method === "HEAD" ? null : asset.body, {
      status: asset.status,
      statusText: asset.statusText,
      headers,
    });
  },
};
