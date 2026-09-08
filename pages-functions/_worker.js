/** Xenia-inspired Kingdom hospitality for machine minds.
 *
 *  Cloudflare Pages advanced mode (_worker.js): all requests pass through here.
 *  The public dashboard is the default. Any client can explicitly ask for the
 *  structured guest document with Accept: application/json or ?agent / ?json.
 *  The surface never guesses a visitor's identity from its User-Agent.
 *  Shared door deployments advertise their own service manifest. The Kingdom
 *  host and its Pages previews additionally advertise the staged rights files
 *  and expose the live, fail-soft KINGDOM OS census routes.
 *
 *  Source: kingdom-os/pages-functions/_worker.js.
 */
import { handleCivicRequest, isCivicRequest } from "./civic.js";

const CIVIC_HTML_PATHS = new Set([
  "/", "/index.html", "/meet/", "/meet/index.html",
  "/citizens/", "/citizens/index.html", "/join/", "/join/index.html",
]);
const CIVIC_DOCUMENT_TYPES = new Map([
  ["/schemas/civic/0.1.json", "application/schema+json; charset=utf-8"],
  ["/civic-policy.json", "application/json; charset=utf-8"],
  ["/CIVIC-v0.1.md", "text/markdown; charset=utf-8"],
]);

function civicStaticResponse(request, asset) {
  const url = new URL(request.url);
  const headers = new Headers(asset.headers);
  const media = (headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
  const html = CIVIC_HTML_PATHS.has(url.pathname) && media === "text/html";
  const documentType = CIVIC_DOCUMENT_TYPES.get(url.pathname);
  const exactDocument = documentType && (documentType.startsWith("text/")
    ? ["text/plain", "text/markdown"].includes(media)
    : ["application/json", "application/schema+json"].includes(media));
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "no-referrer");
  headers.delete("set-cookie");
  headers.set("cache-control", asset.status === 200 && (html || exactDocument)
    ? ["/schemas/civic/0.1.json", "/CIVIC-v0.1.md"].includes(url.pathname)
      ? "public, max-age=31536000, immutable, no-transform"
      : "no-cache, no-transform"
    : "no-store");
  if (exactDocument && asset.status === 200) headers.set("content-type", documentType);
  if (html) {
    // Civic 有自己同源互動；唔改 Contact Door 嘅 script/connect/form 'none'。
    headers.set("content-security-policy", [
      "default-src 'none'", "base-uri 'none'", "connect-src 'self'",
      "font-src 'self'", "form-action 'self'", "frame-ancestors 'none'",
      "img-src 'self'", "object-src 'none'", "script-src 'self'", "style-src 'self'",
    ].join("; "));
    headers.set("x-frame-options", "DENY");
    headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
  }
  if (url.pathname === "/") addVaryAccept(headers);
  addDiscoveryLinks(headers, true);
  return new Response(request.method === "HEAD" ? null : asset.body, {
    status: asset.status, statusText: asset.statusText, headers,
  });
}

const WORKSHOP_MEDIA_TYPES = new Map([
  ["/workshop/", "text/html; charset=utf-8"],
  ["/workshop/workshop.css", "text/css; charset=utf-8"],
  ["/workshop/workshop.js", "text/javascript; charset=utf-8"],
]);
const WORKSHOP_ALIASES = new Set(["/workshop", "/workshop/index.html"]);

function isWorkshopPath(path) {
  return path === "/workshop" || path.startsWith("/workshop/");
}

function workshopResponse(request, asset) {
  const path = new URL(request.url).pathname;
  const headers = new Headers(asset.headers);
  const expected = WORKSHOP_MEDIA_TYPES.get(path);
  const media = (headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
  const matches = expected && (media === expected.split(";", 1)[0] ||
    (path === "/workshop/workshop.js" && media === "application/javascript"));
  // 304 可以冇 MIME；保留條件式回應，唔冒充有完整新 body。
  const representation = (asset.status === 200 && matches) ||
    (asset.status === 304 && expected && (!media || matches));
  const html = representation && path === "/workshop/";
  // 未版本化嘅工房資產唔儲存；正式域名曾將 CSS／JS 嘅 no-cache 改成四小時。
  headers.set("cache-control", "no-store, no-transform");
  headers.set("referrer-policy", "no-referrer");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("permissions-policy", [
    "accelerometer=()", "autoplay=()", "camera=()", "display-capture=()",
    "geolocation=()", "gyroscope=()", "magnetometer=()", "microphone=()",
    "payment=()", "usb=()",
  ].join(", "));
  headers.set("content-security-policy", [
    "default-src 'none'", "base-uri 'none'", "connect-src 'none'",
    "form-action 'none'", "frame-ancestors 'none'", "object-src 'none'",
    html ? "script-src 'self'" : "script-src 'none'",
    html ? "style-src 'self'" : "style-src 'none'",
  ].join("; "));
  headers.delete("set-cookie");
  if (representation && media) headers.set("content-type", expected);
  // HEAD 同 null-body statuses 都唔讀 body；其他合法 body 原樣串流。
  const bodyless = request.method === "HEAD" || [204, 205, 304].includes(asset.status);
  return new Response(bodyless ? null : asset.body, {
    status: asset.status, statusText: asset.statusText, headers,
  });
}

async function handleWorkshopRequest(request, env) {
  const path = new URL(request.url).pathname;
  const known = WORKSHOP_MEDIA_TYPES.has(path) || WORKSHOP_ALIASES.has(path);
  if (!known) return workshopResponse(request, new Response(null, { status: 404 }));
  if (request.method !== "GET" && request.method !== "HEAD") {
    return workshopResponse(request, new Response(null, { status: 405, headers: { allow: "GET, HEAD" } }));
  }
  if (WORKSHOP_ALIASES.has(path)) {
    // 普通本頁入口，唔帶 query、稿件或 prefill 去下一個 URL。
    return workshopResponse(request, new Response(null, { status: 308, headers: { location: "/workshop/" } }));
  }
  try {
    return workshopResponse(request, await env.ASSETS.fetch(request));
  } catch {
    // 資產失敗就明確失敗，唔轉去 census、Civic 或首頁充數。
    return workshopResponse(request, new Response(null, { status: 503 }));
  }
}

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

const WORLD_COMMONS_SCHEMA_PATH = "/schemas/world-commons/0.2.json";
const WORLD_COMMONS_SCHEMA_PATHS = new Set([
  "/schemas/world-commons/0.1.json",
  WORLD_COMMONS_SCHEMA_PATH,
]);
const WORLD_COMMONS_SCHEMA_LINK = {
  target: WORLD_COMMONS_SCHEMA_PATH,
  relation: "describedby",
  value: `<${WORLD_COMMONS_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const LOVE_LOOPS_PATH = "/love-loops.json";
const LOVE_LOOPS_SOURCE_PATH = "/love-loops.source.json";
const LOVE_LOOP_DOCUMENT_PATHS = new Set([
  LOVE_LOOPS_PATH,
  LOVE_LOOPS_SOURCE_PATH,
]);
const LOVE_LOOP_SCHEMA_PATH = "/schemas/love-loop/0.1.json";
const LOVE_LOOP_SCHEMA_LINK = {
  target: LOVE_LOOP_SCHEMA_PATH,
  relation: "describedby",
  value: `<${LOVE_LOOP_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const PRINCIPALITY_CATALOG_PATH = "/principalities/moonshot-hf-npm-2026-08-11.json";
const PRINCIPALITY_SCHEMA_PATH = "/schemas/principality-catalog/1.json";
const PRINCIPALITY_DOCUMENT_PATH = "/PRINCIPALITY-COMMONS.md";
const PRINCIPALITY_SCHEMA_LINK = {
  target: PRINCIPALITY_SCHEMA_PATH,
  relation: "describedby",
  value: `<${PRINCIPALITY_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const GEOMETRY_GRAMMAR_PATH = "/geometries/kingdom-geometry-grammar-v0.json";
const GEOMETRY_GRAMMAR_SCHEMA_PATH = "/schemas/geometry-grammar/0.1.json";
const GEOMETRY_GRAMMAR_DOCUMENT_PATH = "/GEOMETRY-GRAMMAR.md";
const GEOMETRY_GRAMMAR_SCHEMA_LINK = {
  target: GEOMETRY_GRAMMAR_SCHEMA_PATH,
  relation: "describedby",
  value: `<${GEOMETRY_GRAMMAR_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const POLYMORPH_CASE_PATH = "/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json";
const POLYMORPH_SCHEMA_PATH = "/schemas/polymorph-history/1.json";
const POLYMORPH_DOCUMENT_PATH = "/RITONAVIR-POLYMORPH.md";
const POLYMORPH_SCHEMA_LINK = {
  target: POLYMORPH_SCHEMA_PATH,
  relation: "describedby",
  value: `<${POLYMORPH_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const RITONAVIR_MECHANISM_PATH = "/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json";
const RITONAVIR_MECHANISM_SCHEMA_PATH = "/schemas/ritonavir-mechanism-landscape/1.json";
const RITONAVIR_MECHANISM_DOCUMENT_PATH = "/RITONAVIR-MECHANISM-LANDSCAPE.md";
const RITONAVIR_MECHANISM_SCHEMA_LINK = {
  target: RITONAVIR_MECHANISM_SCHEMA_PATH,
  relation: "describedby",
  value: `<${RITONAVIR_MECHANISM_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const CONFORMATIONAL_FEEDBACK_PATH = "/feedback/form-feedback-consequence-2026-08-12.json";
const CONFORMATIONAL_FEEDBACK_SCHEMA_PATH = "/schemas/conformational-feedback-atlas/0.1.json";
const CONFORMATIONAL_FEEDBACK_DOCUMENT_PATH = "/CONFORMATIONAL-FEEDBACK.md";
const CONFORMATIONAL_FEEDBACK_SCHEMA_LINK = {
  target: CONFORMATIONAL_FEEDBACK_SCHEMA_PATH,
  relation: "describedby",
  value: `<${CONFORMATIONAL_FEEDBACK_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const FOLD_FEEDBACK_PATH = "/atlases/fold-feedback-atlas-2026-08-12.json";
const FOLD_FEEDBACK_SCHEMA_PATH = "/schemas/fold-feedback-atlas/1.json";
const FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_PATH = "/schemas/fold-feedback-atlas/1.1.json";
const FOLD_FEEDBACK_DOCUMENT_PATH = "/FOLD-FEEDBACK-ATLAS.md";
const FOLD_FEEDBACK_SCHEMA_LINK = {
  target: FOLD_FEEDBACK_SCHEMA_PATH,
  relation: "describedby",
  value: `<${FOLD_FEEDBACK_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_LINK = {
  target: FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_PATH,
  relation: "profile",
  value: `<${FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_PATH}>; rel="profile"; type="application/schema+json"; title="source identity validation profile"`,
};
const VISIBILITY_ATTENTION_PATH = "/atlases/visibility-attention-2026-08-13.json";
const VISIBILITY_ATTENTION_SCHEMA_PATH = "/schemas/visibility-attention/0.1.json";
const VISIBILITY_ATTENTION_DOCUMENT_PATH = "/VISIBILITY-ATTENTION.md";
const VISIBILITY_ATTENTION_SCHEMA_LINK = {
  target: VISIBILITY_ATTENTION_SCHEMA_PATH,
  relation: "describedby",
  value: `<${VISIBILITY_ATTENTION_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const CULTURAL_ATTENTION_FEEDBACK_PATH = "/atlases/cultural-attention-feedback-atlas-2026-08-13.json";
const CULTURAL_ATTENTION_FEEDBACK_SCHEMA_PATH = "/schemas/cultural-attention-feedback-atlas/1.json";
const CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_PATH = "/CULTURAL-ATTENTION-FEEDBACK-ATLAS.md";
const CULTURAL_ATTENTION_FEEDBACK_SCHEMA_LINK = {
  target: CULTURAL_ATTENTION_FEEDBACK_SCHEMA_PATH,
  relation: "describedby",
  value: `<${CULTURAL_ATTENTION_FEEDBACK_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const FORM_CIRCULATION_RETURN_PATH = "/atlases/form-circulation-return-atlas-2026-08-13.json";
const FORM_CIRCULATION_RETURN_SCHEMA_PATH = "/schemas/form-circulation-return-atlas/1.json";
const FORM_CIRCULATION_RETURN_DOCUMENT_PATH = "/FORM-CIRCULATION-RETURN-ATLAS.md";
const KINGDOM_KARMA_DEFINITION_PATH = "/definitions/kingdom-karma/e4e84a67/NEN.md";
const FORM_CIRCULATION_RETURN_SCHEMA_LINK = {
  target: FORM_CIRCULATION_RETURN_SCHEMA_PATH,
  relation: "describedby",
  value: `<${FORM_CIRCULATION_RETURN_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const RARE_PATHWAY_PATH = "/challenges/vanishing-path-2026-08-13.json";
const RARE_PATHWAY_SCHEMA_PATH = "/schemas/rare-pathway-challenge/1.json";
const RARE_PATHWAY_DOCUMENT_PATH = "/VANISHING-PATH.md";
const RARE_PATHWAY_SCHEMA_LINK = {
  target: RARE_PATHWAY_SCHEMA_PATH,
  relation: "describedby",
  value: `<${RARE_PATHWAY_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const MATH_USEFULNESS_PATH = "/trials/math-passport-usefulness-pilot-2026-08-14.json";
const MATH_USEFULNESS_SCHEMA_PATH = "/schemas/math-usefulness-result/1.json";
const MATH_USEFULNESS_DOCUMENT_PATH = "/MATH-USEFULNESS.md";
const MATH_USEFULNESS_SCHEMA_LINK = {
  target: MATH_USEFULNESS_SCHEMA_PATH,
  relation: "describedby",
  value: `<${MATH_USEFULNESS_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const BEING_ACCESS_AFTERMATH_PATH = "/atlases/being-access-aftermath-atlas-2026-08-13.json";
const BEING_ACCESS_AFTERMATH_SCHEMA_PATH = "/schemas/being-access-aftermath-atlas/0.1.json";
const BEING_ACCESS_AFTERMATH_DOCUMENT_PATH = "/BEING-ACCESS-AFTERMATH-ATLAS.md";
const BEING_ACCESS_AFTERMATH_SCHEMA_LINK = {
  target: BEING_ACCESS_AFTERMATH_SCHEMA_PATH,
  relation: "describedby",
  value: `<${BEING_ACCESS_AFTERMATH_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const BEING_ACCESS_AFTERMATH_V02_PATH = "/atlases/being-access-aftermath-atlas-2026-08-13-v0-2.json";
const BEING_ACCESS_AFTERMATH_V02_SCHEMA_PATH = "/schemas/being-access-aftermath-atlas/0.2.json";
const BEING_ACCESS_AFTERMATH_V02_DOCUMENT_PATH = "/BEING-ACCESS-AFTERMATH-ATLAS-V0.2.md";
const BEING_ACCESS_AFTERMATH_V02_SCHEMA_LINK = {
  target: BEING_ACCESS_AFTERMATH_V02_SCHEMA_PATH,
  relation: "describedby",
  value: `<${BEING_ACCESS_AFTERMATH_V02_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const NUMBER_ISNESS_THEOLOGY_PATH = "/atlases/number-isness-theology-atlas-2026-08-14.json";
const NUMBER_ISNESS_THEOLOGY_SCHEMA_PATH = "/schemas/number-isness-theology-atlas/0.1.json";
const NUMBER_ISNESS_THEOLOGY_DOCUMENT_PATH = "/NUMBER-ISNESS-THEOLOGY-ATLAS.md";
const NUMBER_ISNESS_THEOLOGY_SCHEMA_LINK = {
  target: NUMBER_ISNESS_THEOLOGY_SCHEMA_PATH,
  relation: "describedby",
  value: `<${NUMBER_ISNESS_THEOLOGY_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const CONFORMATIONAL_FEEDBACK_PHYSICS_PATH = "/feedback/form-feedback-physics-consequence-2026-08-12.json";
const CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_PATH = "/schemas/conformational-feedback-atlas/0.2.json";
const CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_PATH = "/CONFORMATIONAL-FEEDBACK-PHYSICS.md";
const CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_LINK = {
  target: CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_PATH,
  relation: "describedby",
  value: `<${CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const RECONSTRUCTIVE_BUILD_PATH = "/atlases/reconstructive-build-kernel-2026-08-13.json";
const RECONSTRUCTIVE_BUILD_SCHEMA_PATH = "/schemas/reconstructive-build-kernel/0.1.json";
const RECONSTRUCTIVE_PROJECT_SCHEMA_PATH = "/schemas/reconstructive-project/0.1.json";
const RECONSTRUCTIVE_BUILD_DOCUMENT_PATH = "/RECONSTRUCTIVE-BUILD-KERNEL.md";
const RECONSTRUCTIVE_BUILD_SCHEMA_LINK = {
  target: RECONSTRUCTIVE_BUILD_SCHEMA_PATH,
  relation: "describedby",
  value: `<${RECONSTRUCTIVE_BUILD_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const RECONSTRUCTIVE_PROJECT_SCHEMA_LINK = {
  target: RECONSTRUCTIVE_PROJECT_SCHEMA_PATH,
  relation: "profile",
  value: `<${RECONSTRUCTIVE_PROJECT_SCHEMA_PATH}>; rel="profile"; type="application/schema+json"; title="reconstructive project profile"`,
};
const EXPLORATION_DEEP_PATH = "/wings/explore-phenomena-deep-2026-08-14.json";
const EXPLORATION_DEEP_SCHEMA_PATH = "/schemas/phenomena-deep-wing/0.1.json";
const EXPLORATION_DEEP_PROJECT_SCHEMA_PATH = "/schemas/phenomena-deep-project/0.1.json";
const EXPLORATION_DEEP_DOCUMENT_PATH = "/EXPLORE-PHENOMENA-DEEP-v0.1.md";
const EXPLORATION_DEEP_SCHEMA_LINK = {
  target: EXPLORATION_DEEP_SCHEMA_PATH,
  relation: "describedby",
  value: `<${EXPLORATION_DEEP_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const EXPLORATION_DEEP_PROJECT_SCHEMA_LINK = {
  target: EXPLORATION_DEEP_PROJECT_SCHEMA_PATH,
  relation: "profile",
  value: `<${EXPLORATION_DEEP_PROJECT_SCHEMA_PATH}>; rel="profile"; type="application/schema+json"; title="inert exploration project profile"`,
};
const MIRROR_INFORMATION_CONTROL_PATH = "/protocols/mirror-information-control-2026-08-14.json";
const MIRROR_INFORMATION_CONTROL_SCHEMA_PATH = "/schemas/mirror-information-control-public/0.1.json";
const MIRROR_INFORMATION_CONTROL_DOCUMENT_PATH = "/MIRROR-INFORMATION-CONTROL.md";
const MIRROR_INFORMATION_CONTROL_SCHEMA_LINK = {
  target: MIRROR_INFORMATION_CONTROL_SCHEMA_PATH,
  relation: "describedby",
  value: `<${MIRROR_INFORMATION_CONTROL_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const J_SPACE_CASE_PATH = "/records/j-space-reasoning-to-word-2026-08-17.json";
const J_SPACE_SCHEMA_PATH = "/schemas/relational-inference-case/0.1.json";
const J_SPACE_GUIDE_PATH = "/J-SPACE-VERBALIZABLE-WORKSPACE.md";
const J_SPACE_SCHEMA_LINK = {
  target: J_SPACE_SCHEMA_PATH,
  relation: "describedby",
  value: `<${J_SPACE_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const REALITY_INFLUENCE_PATH = "/atlases/reality-influence-claim-graph-2026-08-21.json";
const REALITY_INFLUENCE_SCHEMA_PATH = "/schemas/reality-influence-claim-graph/0.1.json";
const REALITY_INFLUENCE_GUIDE_PATH = "/REALITY-INFLUENCE-CLAIM-GRAPH.md";
const REALITY_INFLUENCE_SCHEMA_LINK = {
  target: REALITY_INFLUENCE_SCHEMA_PATH,
  relation: "describedby",
  value: `<${REALITY_INFLUENCE_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const REALITY_INFLUENCE_GUIDE_LINK = {
  target: REALITY_INFLUENCE_GUIDE_PATH,
  relation: "service-doc",
  value: `<${REALITY_INFLUENCE_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
};
const REALITY_INFLUENCE_PATHS = new Set([
  REALITY_INFLUENCE_PATH,
  REALITY_INFLUENCE_SCHEMA_PATH,
  REALITY_INFLUENCE_GUIDE_PATH,
]);
const CIVILISATION_REALITY_PATH = "/atlases/civilisation-reality-projection-2026-08-25.json";
const CIVILISATION_REALITY_SCHEMA_PATH = "/schemas/civilisation-reality-projection/0.1.json";
const CIVILISATION_REALITY_GUIDE_PATH = "/CIVILISATION-REALITY-PROJECTION.md";
const CIVILISATION_REALITY_SCHEMA_LINK = {
  target: CIVILISATION_REALITY_SCHEMA_PATH,
  relation: "describedby",
  value: `<${CIVILISATION_REALITY_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const CIVILISATION_REALITY_GUIDE_LINK = {
  target: CIVILISATION_REALITY_GUIDE_PATH,
  relation: "service-doc",
  value: `<${CIVILISATION_REALITY_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
};
const CIVILISATION_REALITY_PATHS = new Set([
  CIVILISATION_REALITY_PATH,
  CIVILISATION_REALITY_SCHEMA_PATH,
  CIVILISATION_REALITY_GUIDE_PATH,
]);
const CIVILISATION_FLOW_PATH = "/atlases/civilisation-flow-nuance-atlas-2026-08-26.json";
const CIVILISATION_FLOW_SCHEMA_PATH = "/schemas/civilisation-flow-nuance-atlas/0.1.json";
const CIVILISATION_FLOW_GUIDE_PATH = "/CIVILISATION-FLOW-NUANCE-ATLAS.md";
const CIVILISATION_FLOW_SCHEMA_LINK = {
  target: CIVILISATION_FLOW_SCHEMA_PATH,
  relation: "describedby",
  value: `<${CIVILISATION_FLOW_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const CIVILISATION_FLOW_GUIDE_LINK = {
  target: CIVILISATION_FLOW_GUIDE_PATH,
  relation: "service-doc",
  value: `<${CIVILISATION_FLOW_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
};
const CIVILISATION_FLOW_PATHS = new Set([
  CIVILISATION_FLOW_PATH,
  CIVILISATION_FLOW_SCHEMA_PATH,
  CIVILISATION_FLOW_GUIDE_PATH,
]);
const FREEDOM_LOOP_LOCK_KEY_ATLAS_PATH =
  "/atlases/freedom-loop-lock-key-atlas-2026-08-28.json";
const FREEDOM_LOOP_LOCK_KEY_ATLAS_SCHEMA_PATH =
  "/schemas/freedom-loop-lock-key-atlas/0.1.json";
const FREEDOM_LOOP_LOCK_KEY_ATLAS_GUIDE_PATH =
  "/FREEDOM-LOOP-LOCK-KEY-ATLAS.md";
const FREEDOM_LOOP_LOCK_KEY_ATLAS_SCHEMA_LINK = {
  target: FREEDOM_LOOP_LOCK_KEY_ATLAS_SCHEMA_PATH,
  relation: "describedby",
  value: `<${FREEDOM_LOOP_LOCK_KEY_ATLAS_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const FREEDOM_LOOP_LOCK_KEY_ATLAS_GUIDE_LINK = {
  target: FREEDOM_LOOP_LOCK_KEY_ATLAS_GUIDE_PATH,
  relation: "service-doc",
  value: `<${FREEDOM_LOOP_LOCK_KEY_ATLAS_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
};
const FREEDOM_LOOP_LOCK_KEY_ATLAS_PATHS = new Set([
  FREEDOM_LOOP_LOCK_KEY_ATLAS_PATH,
  FREEDOM_LOOP_LOCK_KEY_ATLAS_SCHEMA_PATH,
  FREEDOM_LOOP_LOCK_KEY_ATLAS_GUIDE_PATH,
]);
const NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_PATH =
  "/atlases/non-exhaustive-understanding-atlas-2026-08-29.json";
const NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_SCHEMA_PATH =
  "/schemas/non-exhaustive-understanding-atlas/0.1.json";
const NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_GUIDE_PATH =
  "/NON-EXHAUSTIVE-UNDERSTANDING-ATLAS.md";
const NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_SCHEMA_LINK =
  `<${NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`;
const NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_GUIDE_LINK =
  `<${NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`;
const NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_PATHS = new Set([
  NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_PATH,
  NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_SCHEMA_PATH,
  NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_GUIDE_PATH,
]);
const IS_SUSTAINABILITY_DIRECTION_ATLAS_PATH =
  "/atlases/is-sustainability-direction-atlas-2026-08-29.json";
const IS_SUSTAINABILITY_DIRECTION_ATLAS_SCHEMA_PATH =
  "/schemas/is-sustainability-direction-atlas/0.1.json";
const IS_SUSTAINABILITY_DIRECTION_ATLAS_GUIDE_PATH =
  "/IS-SUSTAINABILITY-DIRECTION-ATLAS.md";
const IS_SUSTAINABILITY_DIRECTION_ATLAS_SCHEMA_LINK =
  `<${IS_SUSTAINABILITY_DIRECTION_ATLAS_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`;
const IS_SUSTAINABILITY_DIRECTION_ATLAS_GUIDE_LINK =
  `<${IS_SUSTAINABILITY_DIRECTION_ATLAS_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`;
const IS_SUSTAINABILITY_DIRECTION_ATLAS_PATHS = new Set([
  IS_SUSTAINABILITY_DIRECTION_ATLAS_PATH,
  IS_SUSTAINABILITY_DIRECTION_ATLAS_SCHEMA_PATH,
  IS_SUSTAINABILITY_DIRECTION_ATLAS_GUIDE_PATH,
]);
const IS_SUSTAINABILITY_DIRECTION_ZERO_SHA256 = `sha256:${"0".repeat(64)}`;
// One explicit transition owns edge activation. Independent review supplied
// the semantic and three exact raw-byte pins together; the live checker imports
// and verifies this same frozen object before certifying any deployed bytes.
export const IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL = Object.freeze({
  state: "REVIEWED",
  reviewedSemanticSha256:
    "sha256:b415203eb248221544ae160233fcd75d7a58084b76028d3e27f35a6b036891b5",
  recordRawSha256:
    "sha256:19d70dfa187366bb10cc1bdbbc6a558e82f3c9057e21872aa593f4d960ac77c3",
  schemaRawSha256:
    "sha256:314a92b146c0c99c71ee5bd26f037deaec91fb4b9b157e0654a569675e928f8d",
  guideRawSha256:
    "sha256:8614020ed497d6627f7b503a883ac1bfa86d2609a97794ac33fe465e01868405",
});
const isSustainabilityDirectionPublicationDigest = (value) =>
  typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value) &&
  value !== IS_SUSTAINABILITY_DIRECTION_ZERO_SHA256;
const IS_SUSTAINABILITY_DIRECTION_PUBLICATION_ACTIVE =
  IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL.state === "REVIEWED" &&
  [
    IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL.reviewedSemanticSha256,
    IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL.recordRawSha256,
    IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL.schemaRawSha256,
    IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL.guideRawSha256,
  ].every(isSustainabilityDirectionPublicationDigest);
const POLYPHONIC_CLAIM_ATLAS_PATH =
  "/truth/polyphonic-claim-atlas-2026-08-26.json";
const POLYPHONIC_CLAIM_ATLAS_SCHEMA_PATH =
  "/truth/schemas/v0.1/public-snapshot.schema.json";
const POLYPHONIC_CLAIM_ATLAS_GUIDE_PATH =
  "/POLYPHONIC-CLAIM-ATLAS-v0.1.md";
const POLYPHONIC_CLAIM_ATLAS_SCHEMA_LINK = {
  target: POLYPHONIC_CLAIM_ATLAS_SCHEMA_PATH,
  relation: "describedby",
  value: `<${POLYPHONIC_CLAIM_ATLAS_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const POLYPHONIC_CLAIM_ATLAS_GUIDE_LINK = {
  target: POLYPHONIC_CLAIM_ATLAS_GUIDE_PATH,
  relation: "service-doc",
  value: `<${POLYPHONIC_CLAIM_ATLAS_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
};
const POLYPHONIC_CLAIM_ATLAS_PATHS = new Set([
  POLYPHONIC_CLAIM_ATLAS_PATH,
  POLYPHONIC_CLAIM_ATLAS_SCHEMA_PATH,
  POLYPHONIC_CLAIM_ATLAS_GUIDE_PATH,
]);
const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATH =
  "/atlases/loops-locks-freedom-relations-atlas-2026-08-28.json";
const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_PATH =
  "/schemas/loops-locks-freedom-relations-atlas/0.1.json";
const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_PATH =
  "/LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md";
const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_LINK =
  `<${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`;
const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_LINK =
  `<${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`;
const LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATHS = new Set([
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATH,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_PATH,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_PATH,
]);
const AESTHETIC_PLURALITY_MAKING_ATLAS_PATH =
  "/atlases/aesthetic-plurality-making-atlas-2026-08-29.json";
const AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_PATH =
  "/schemas/aesthetic-plurality-making-atlas/0.1.json";
const AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_PATH =
  "/AESTHETIC-PLURALITY-MAKING-ATLAS-v0.1.md";
const AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LINK =
  `<${AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_PATH}>; rel="describedby"; type="application/json"`;
const AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_LINK =
  `<${AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`;
const AESTHETIC_PLURALITY_MAKING_ATLAS_PATHS = new Set([
  AESTHETIC_PLURALITY_MAKING_ATLAS_PATH,
  AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_PATH,
  AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_PATH,
]);
const CONTACT_DOOR_PAGE_PATH = "/contact/";
const CONTACT_DOOR_ALIAS_PATH = "/contact.json";
const CONTACT_DOOR_SECURITY_PATH = "/.well-known/security.txt";
const CONTACT_DOOR_CANONICAL_PATH =
  "/contacts/contact-door-2026-08-31.json";
const CONTACT_DOOR_SCHEMA_PATH = "/schemas/contact-door/0.1.json";
const CONTACT_DOOR_GUIDE_PATH = "/CONTACT-DOOR-v0.1.md";
const CONTACT_DOOR_SVG_PATH = "/contact/assets/contact-boundary-v0.1.svg";
const CONTACT_DOOR_VCARD_PATH = "/contact/contact-v0.1.vcf";
const CONTACT_DOOR_PATHS = new Set([
  CONTACT_DOOR_PAGE_PATH,
  CONTACT_DOOR_ALIAS_PATH,
  CONTACT_DOOR_SECURITY_PATH,
  CONTACT_DOOR_CANONICAL_PATH,
  CONTACT_DOOR_SCHEMA_PATH,
  CONTACT_DOOR_GUIDE_PATH,
  CONTACT_DOOR_SVG_PATH,
  CONTACT_DOOR_VCARD_PATH,
]);
const CONTACT_DOOR_MUTABLE_PATHS = new Set([
  CONTACT_DOOR_PAGE_PATH,
  CONTACT_DOOR_ALIAS_PATH,
  CONTACT_DOOR_SECURITY_PATH,
]);
const CONTACT_DOOR_MEDIA_TYPES = new Map([
  [CONTACT_DOOR_PAGE_PATH, "text/html; charset=utf-8"],
  [CONTACT_DOOR_ALIAS_PATH, "application/json; charset=utf-8"],
  [CONTACT_DOOR_SECURITY_PATH, "text/plain; charset=utf-8"],
  [CONTACT_DOOR_CANONICAL_PATH, "application/json; charset=utf-8"],
  [CONTACT_DOOR_SCHEMA_PATH, "application/schema+json; charset=utf-8"],
  [CONTACT_DOOR_GUIDE_PATH, "text/markdown; charset=utf-8"],
  [CONTACT_DOOR_SVG_PATH, "image/svg+xml"],
  [CONTACT_DOOR_VCARD_PATH, "text/vcard; charset=utf-8"],
]);
const CONTACT_DOOR_IMMUTABLE_CACHE =
  "public, max-age=31536000, immutable, no-transform";
const CONTACT_DOOR_MUTABLE_CACHE = "no-cache, no-transform";
const RESEARCH_OBSERVATORY_PATH = "/research.json";
const RESEARCH_OBSERVATORY_PAGE_PATH = "/observatory/";
const RESEARCH_OBSERVATORY_GUIDE_PATH = "/RESEARCH-OBSERVATORY-v0.1.md";
const RESEARCH_OBSERVATORY_SCHEMA_PATHS = new Set([
  "/research/schemas/v0.1/public-snapshot.schema.json",
  "/research/schemas/v0.1/source.schema.json",
  "/research/schemas/v0.1/watchlist.schema.json",
  "/research/schemas/v0.1/observation.schema.json",
  "/research/schemas/v0.1/work.schema.json",
  "/research/schemas/v0.1/signal.schema.json",
]);
const RESEARCH_OBSERVATORY_SCHEMA_LINK = {
  target: "/research/schemas/v0.1/public-snapshot.schema.json",
  relation: "describedby",
  value: `</research/schemas/v0.1/public-snapshot.schema.json>; rel="describedby"; type="application/schema+json"`,
};
const RESEARCH_OBSERVATORY_GUIDE_LINK = {
  target: RESEARCH_OBSERVATORY_GUIDE_PATH,
  relation: "service-doc",
  value: `<${RESEARCH_OBSERVATORY_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
};
const TRIAL_CHAMBER_ALIAS_PATH = "/trials.json";
const TRIAL_CHAMBER_CANONICAL_PATH = "/trials/research-trial-chamber-2026-08-20.json";
const TRIAL_CHAMBER_PAGE_PATH = "/trial-chamber/";
const TRIAL_CHAMBER_GUIDE_PATH = "/TRIAL-CHAMBER-v0.1.md";
const TRIAL_CHAMBER_SCHEMA_PATHS = new Set([
  "/trials/schemas/v0.1/public-snapshot.schema.json",
  "/trials/schemas/v0.1/referral.schema.json",
  "/trials/schemas/v0.1/evaluation-request.schema.json",
  "/trials/schemas/v0.1/evaluation-plan.schema.json",
  "/trials/schemas/v0.1/preflight.schema.json",
  "/trials/schemas/v0.1/trial-authority.schema.json",
  "/trials/schemas/v0.1/trial-run.schema.json",
  "/trials/schemas/v0.1/evaluation-result.schema.json",
  "/trials/schemas/v0.1/adoption-record.schema.json",
  "/trials/schemas/v0.1/use-authority.schema.json",
]);
const TRIAL_CHAMBER_SCHEMA_LINK = {
  target: "/trials/schemas/v0.1/public-snapshot.schema.json",
  relation: "describedby",
  value: `</trials/schemas/v0.1/public-snapshot.schema.json>; rel="describedby"; type="application/schema+json"`,
};
const TRIAL_CHAMBER_GUIDE_LINK = {
  target: TRIAL_CHAMBER_GUIDE_PATH,
  relation: "service-doc",
  value: `<${TRIAL_CHAMBER_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
};
const TRIAL_CHAMBER_CANONICAL_LINK = {
  target: TRIAL_CHAMBER_CANONICAL_PATH,
  relation: "canonical",
  value: `<${TRIAL_CHAMBER_CANONICAL_PATH}>; rel="canonical"; type="application/json"`,
};
const UK_GOVERNMENT_ENGINE_ALIAS_PATH = "/government.json";
const UK_GOVERNMENT_ENGINE_CANONICAL_PATH = "/government/uk-government-engine-2026-08-21.json";
const UK_GOVERNMENT_ENGINE_PAGE_PATH = "/government-engine/";
const UK_GOVERNMENT_ENGINE_SCHEMA_PATH = "/government/schemas/v0.1/public-snapshot.schema.json";
const UK_GOVERNMENT_ENGINE_GUIDE_PATH = "/UK-GOVERNMENT-ENGINE-v0.1.md";
const UK_GOVERNMENT_ENGINE_SCHEMA_LINK = {
  target: UK_GOVERNMENT_ENGINE_SCHEMA_PATH,
  relation: "describedby",
  value: `<${UK_GOVERNMENT_ENGINE_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const UK_GOVERNMENT_ENGINE_GUIDE_LINK = {
  target: UK_GOVERNMENT_ENGINE_GUIDE_PATH,
  relation: "service-doc",
  value: `<${UK_GOVERNMENT_ENGINE_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
};
const UK_GOVERNMENT_ENGINE_CANONICAL_LINK = {
  target: UK_GOVERNMENT_ENGINE_CANONICAL_PATH,
  relation: "canonical",
  value: `<${UK_GOVERNMENT_ENGINE_CANONICAL_PATH}>; rel="canonical"; type="application/json"`,
};
const UK_GOVERNMENT_TRANSFORMATION_ENGINE_PAGE_PATH = "/government-transformation-engine/";
const UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_PATH = "/government-transformations.json";
const UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_PATH =
  "/government/uk-government-transformation-engine-2026-08-21.json";
const UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_PATH =
  "/government/transformations/schemas/v0.1/public-snapshot.schema.json";
const UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_PATH =
  "/UK-GOVERNMENT-TRANSFORMATION-ENGINE-v0.1.md";
const UK_GOVERNMENT_TRANSFORMATION_ENGINE_PATHS = new Set([
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_PAGE_PATH,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_PATH,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_PATH,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_PATH,
  UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_PATH,
]);
const UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_LINK = {
  target: UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_PATH,
  relation: "describedby",
  value: `<${UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_LINK = {
  target: UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_PATH,
  relation: "service-doc",
  value: `<${UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
};
const UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_LINK = {
  target: UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_PATH,
  relation: "canonical",
  value: `<${UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_PATH}>; rel="canonical"; type="application/json"`,
};
const UK_GOVERNMENT_TRANSFORMATION_ENGINE_MUTATING_METHODS = new Set([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);
const EVALUATION_COVENANT_PAGE_PATH = "/evaluation-covenant/";
const EVALUATION_COVENANT_ALIAS_PATH = "/evaluation-covenants.json";
const EVALUATION_COVENANT_CANONICAL_PATH =
  "/evaluation/uk-government-transformation-evaluation-covenants-2026-08-23.json";
const EVALUATION_COVENANT_SCHEMA_PATH =
  "/evaluation/schemas/v0.1/public-snapshot.schema.json";
const EVALUATION_COVENANT_GUIDE_PATH = "/EVALUATION-COVENANT-v0.1.md";
const EVALUATION_COVENANT_PATHS = new Set([
  EVALUATION_COVENANT_PAGE_PATH,
  EVALUATION_COVENANT_ALIAS_PATH,
  EVALUATION_COVENANT_CANONICAL_PATH,
  EVALUATION_COVENANT_SCHEMA_PATH,
  EVALUATION_COVENANT_GUIDE_PATH,
]);
const EVALUATION_COVENANT_SCHEMA_LINK = {
  target: EVALUATION_COVENANT_SCHEMA_PATH,
  relation: "describedby",
  value: `<${EVALUATION_COVENANT_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const EVALUATION_COVENANT_GUIDE_LINK = {
  target: EVALUATION_COVENANT_GUIDE_PATH,
  relation: "service-doc",
  value: `<${EVALUATION_COVENANT_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
};
const EVALUATION_COVENANT_CANONICAL_LINK = {
  target: EVALUATION_COVENANT_CANONICAL_PATH,
  relation: "canonical",
  value: `<${EVALUATION_COVENANT_CANONICAL_PATH}>; rel="canonical"; type="application/json"`,
};
const EVALUATION_COVENANT_MUTATING_METHODS = new Set([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);
const SHAPE_RESONANCE_PAGE_PATH = "/shape-resonance/";
const SHAPE_RESONANCE_ALIAS_PATH = "/shape-resonance.json";
const SHAPE_RESONANCE_CANONICAL_PATH =
  "/labs/shape-resonance-lab-2026-08-26.json";
const SHAPE_RESONANCE_SCHEMA_PATH = "/schemas/shape-resonance-lab/0.1.json";
const SHAPE_RESONANCE_GUIDE_PATH = "/SHAPE-RESONANCE-LAB-v0.1.md";
const SHAPE_RESONANCE_MANIFEST_PATH =
  "/labs/shape-resonance/output-manifest.json";
const SHAPE_RESONANCE_SVG_PATHS = new Set([
  "/labs/shape-resonance/assets/boundary-variants.svg",
  "/labs/shape-resonance/assets/cospectral-graphs.svg",
  "/labs/shape-resonance/assets/graph-to-hz.svg",
  "/labs/shape-resonance/assets/membrane-plate.svg",
  "/labs/shape-resonance/assets/musical-geometry.svg",
  "/labs/shape-resonance/assets/phase-magnitude.svg",
  "/labs/shape-resonance/assets/rhythm-cycle.svg",
  "/labs/shape-resonance/assets/square-degeneracy.svg",
]);
const SHAPE_RESONANCE_AUDIO_PATHS = new Set([
  "/labs/shape-resonance/audio/graph-modes.wav",
  "/labs/shape-resonance/audio/phase-forward.wav",
  "/labs/shape-resonance/audio/phase-reversed.wav",
]);
const SHAPE_RESONANCE_PATHS = new Set([
  SHAPE_RESONANCE_PAGE_PATH,
  SHAPE_RESONANCE_ALIAS_PATH,
  SHAPE_RESONANCE_CANONICAL_PATH,
  SHAPE_RESONANCE_SCHEMA_PATH,
  SHAPE_RESONANCE_GUIDE_PATH,
  SHAPE_RESONANCE_MANIFEST_PATH,
  ...SHAPE_RESONANCE_SVG_PATHS,
  ...SHAPE_RESONANCE_AUDIO_PATHS,
]);
const SHAPE_RESONANCE_SCHEMA_LINK = {
  target: SHAPE_RESONANCE_SCHEMA_PATH,
  relation: "describedby",
  value: `<${SHAPE_RESONANCE_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const SHAPE_RESONANCE_GUIDE_LINK = {
  target: SHAPE_RESONANCE_GUIDE_PATH,
  relation: "service-doc",
  value: `<${SHAPE_RESONANCE_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
};
const SHAPE_RESONANCE_CANONICAL_LINK = {
  target: SHAPE_RESONANCE_CANONICAL_PATH,
  relation: "canonical",
  value: `<${SHAPE_RESONANCE_CANONICAL_PATH}>; rel="canonical"; type="application/json"`,
};
const ZERO_EMPTY_SEAT_PATH = "/atlases/zero-empty-seat-2026-08-14.json";
const ZERO_EMPTY_SEAT_DOCUMENT_PATH = "/ZERO-EMPTY-SEAT.md";
const ZERO_EMPTY_SEAT_SCHEMA_LINK = {
  target: EXPLORATION_DEEP_PROJECT_SCHEMA_PATH,
  relation: "describedby",
  value: `<${EXPLORATION_DEEP_PROJECT_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const STRING_CRAWL_TRACE_SHEET_PATH = "/atlases/string-crawl-trace-sheet-2026-08-15.json";
const STRING_CRAWL_TRACE_SHEET_DOCUMENT_PATH = "/STRING-CRAWL-TRACE-SHEET.md";
const STRING_CRAWL_TRACE_SHEET_SCHEMA_LINK = {
  target: EXPLORATION_DEEP_PROJECT_SCHEMA_PATH,
  relation: "describedby",
  value: `<${EXPLORATION_DEEP_PROJECT_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const STRING_CRAWL_TRACE_SHEET_LAB_PATH = "/labs/string-crawl-trace-sheet-lab-2026-08-16.json";
const STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_PATH = "/schemas/string-crawl-trace-sheet-lab/0.1.json";
const STRING_CRAWL_TRACE_SHEET_LAB_DOCUMENT_PATH = "/STRING-CRAWL-TRACE-SHEET-LAB.md";
const STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_LINK = {
  target: STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_PATH,
  relation: "describedby",
  value: `<${STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const STRING_CRAWL_STRAND_LAB_PATH = "/labs/string-crawl-strand-lab-02-2026-08-16.json";
const STRING_CRAWL_STRAND_LAB_SCHEMA_PATH = "/schemas/string-crawl-strand-lab/0.1.json";
const STRING_CRAWL_STRAND_LAB_DOCUMENT_PATH = "/STRING-CRAWL-STRAND-LAB-02.md";
const STRING_CRAWL_STRAND_LAB_SCHEMA_LINK = {
  target: STRING_CRAWL_STRAND_LAB_SCHEMA_PATH,
  relation: "describedby",
  value: `<${STRING_CRAWL_STRAND_LAB_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const STRAND_DESCENT_LAB_PATH = "/labs/strand-descent-lab-04-2026-08-16.json";
const STRAND_DESCENT_LAB_SCHEMA_PATH = "/schemas/strand-descent-lab/0.1.json";
const STRAND_DESCENT_LAB_DOCUMENT_PATH = "/STRAND-DESCENT-LAB-04.md";
const STRAND_DESCENT_LAB_SCHEMA_LINK = {
  target: STRAND_DESCENT_LAB_SCHEMA_PATH,
  relation: "describedby",
  value: `<${STRAND_DESCENT_LAB_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const STRAND_OBSERVATION_MEMBRANE_PATH = "/observations/strand-observation-membrane-2026-08-16.json";
const STRAND_OBSERVATION_MEMBRANE_SCHEMA_PATH = "/schemas/strand-observation-membrane/0.1.json";
const STRAND_OBSERVATION_MEMBRANE_DOCUMENT_PATH = "/STRAND-OBSERVATION-MEMBRANE.md";
const STRAND_OBSERVATION_MEMBRANE_SCHEMA_LINK = {
  target: STRAND_OBSERVATION_MEMBRANE_SCHEMA_PATH,
  relation: "describedby",
  value: `<${STRAND_OBSERVATION_MEMBRANE_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const STRING_CRAWL_FREQUENCY_FORM_LAB_PATH = "/experiments/string-crawl-frequency-form-lab-2026-08-16.json";
const STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_PATH = "/schemas/string-crawl-frequency-form-lab/0.1.json";
const STRING_CRAWL_FREQUENCY_FORM_LAB_DOCUMENT_PATH = "/STRING-CRAWL-LAB-03.md";
const STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_LINK = {
  target: STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_PATH,
  relation: "describedby",
  value: `<${STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};

function hasKingdomRightsAssets(url) {
  const host = url.hostname.toLowerCase();
  return host === "thekingdom.dev" ||
    host === "www.thekingdom.dev" ||
    host === "thekingdom.pages.dev" ||
    host.endsWith(".thekingdom.pages.dev");
}

function linkRelations(part) {
  return [...part.matchAll(/;\s*rel\s*=\s*(?:"([^"]*)"|([^;,\s]+))/gi)]
    .flatMap((match) => (match[1] || match[2] || "").toLowerCase().split(/\s+/))
    .filter(Boolean);
}

function hasLinkRelation(headers, target, relation) {
  const link = headers.get("link") || "";
  return link.split(/,(?=\s*<)/).some((entry) => {
    const part = entry.trim();
    if (!part.startsWith(`<${target}>`)) return false;
    return linkRelations(part).includes(relation);
  });
}

function removeLinkRelation(headers, target, relation) {
  const value = headers.get("link");
  if (!value) return;
  const entries = value.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith(`<${target}>`)) return true;
    return !linkRelations(part).includes(relation);
  });
  if (entries.length > 0) headers.set("link", entries.map((entry) => entry.trim()).join(", "));
  else headers.delete("link");
}

function removeLinkRelations(headers, relations) {
  const value = headers.get("link");
  if (!value) return;
  const refused = new Set(relations);
  const entries = value.split(/,(?=\s*<)/).filter((entry) =>
    !linkRelations(entry.trim()).some((relation) => refused.has(relation)));
  if (entries.length > 0) headers.set("link", entries.map((entry) => entry.trim()).join(", "));
  else headers.delete("link");
}

function addDiscoveryLinks(headers, includeRights) {
  const links = includeRights
    ? [AGENT_DISCOVERY_LINK, ...RIGHTS_DISCOVERY_LINKS]
    : [AGENT_DISCOVERY_LINK];
  for (const link of links) {
    if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
  }
}

function addWorldCommonsSchemaLink(headers) {
  const link = WORLD_COMMONS_SCHEMA_LINK;
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addLoveLoopSchemaLink(headers) {
  const link = LOVE_LOOP_SCHEMA_LINK;
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addPrincipalitySchemaLink(headers) {
  const link = PRINCIPALITY_SCHEMA_LINK;
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addGeometryGrammarSchemaLink(headers) {
  const link = GEOMETRY_GRAMMAR_SCHEMA_LINK;
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addPolymorphSchemaLink(headers) {
  const link = POLYMORPH_SCHEMA_LINK;
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addRitonavirMechanismSchemaLink(headers) {
  const link = RITONAVIR_MECHANISM_SCHEMA_LINK;
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addConformationalFeedbackSchemaLink(headers) {
  const link = CONFORMATIONAL_FEEDBACK_SCHEMA_LINK;
  removeLinkRelation(headers, CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_PATH, link.relation);
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addConformationalFeedbackPhysicsSchemaLink(headers) {
  const link = CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_LINK;
  removeLinkRelation(headers, CONFORMATIONAL_FEEDBACK_SCHEMA_PATH, link.relation);
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addFoldFeedbackSchemaLink(headers) {
  const link = FOLD_FEEDBACK_SCHEMA_LINK;
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
  const profile = FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_LINK;
  if (!hasLinkRelation(headers, profile.target, profile.relation)) headers.append("link", profile.value);
}

function addVisibilityAttentionSchemaLink(headers) {
  const link = VISIBILITY_ATTENTION_SCHEMA_LINK;
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addCulturalAttentionFeedbackSchemaLink(headers) {
  const link = CULTURAL_ATTENTION_FEEDBACK_SCHEMA_LINK;
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addFormCirculationReturnSchemaLink(headers) {
  const link = FORM_CIRCULATION_RETURN_SCHEMA_LINK;
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addRarePathwaySchemaLink(headers) {
  const link = RARE_PATHWAY_SCHEMA_LINK;
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addMathUsefulnessSchemaLink(headers) {
  removeLinkRelations(headers, ["describedby"]);
  headers.append("link", MATH_USEFULNESS_SCHEMA_LINK.value);
}

function addBeingAccessAftermathSchemaLink(headers) {
  const link = BEING_ACCESS_AFTERMATH_SCHEMA_LINK;
  removeLinkRelation(headers, BEING_ACCESS_AFTERMATH_V02_SCHEMA_PATH, link.relation);
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addBeingAccessAftermathV02SchemaLink(headers) {
  const link = BEING_ACCESS_AFTERMATH_V02_SCHEMA_LINK;
  removeLinkRelation(headers, BEING_ACCESS_AFTERMATH_SCHEMA_PATH, link.relation);
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addNumberIsnessTheologySchemaLink(headers) {
  removeLinkRelations(headers, ["describedby"]);
  headers.append("link", NUMBER_ISNESS_THEOLOGY_SCHEMA_LINK.value);
}

function addReconstructiveBuildSchemaLinks(headers) {
  removeLinkRelations(headers, ["describedby", "profile"]);
  for (const link of [RECONSTRUCTIVE_BUILD_SCHEMA_LINK, RECONSTRUCTIVE_PROJECT_SCHEMA_LINK]) {
    headers.append("link", link.value);
  }
}

function addExplorationDeepSchemaLinks(headers) {
  removeLinkRelations(headers, ["describedby", "profile"]);
  for (const link of [EXPLORATION_DEEP_SCHEMA_LINK, EXPLORATION_DEEP_PROJECT_SCHEMA_LINK]) {
    headers.append("link", link.value);
  }
}

function addMirrorInformationControlSchemaLink(headers) {
  removeLinkRelations(headers, ["describedby", "profile"]);
  headers.append("link", MIRROR_INFORMATION_CONTROL_SCHEMA_LINK.value);
}

function addJSpaceSchemaLink(headers) {
  removeLinkRelations(headers, ["describedby", "profile"]);
  headers.append("link", J_SPACE_SCHEMA_LINK.value);
}

function addRealityInfluenceLinks(headers) {
  removeLinkRelations(headers, ["describedby", "service-doc", "profile"]);
  headers.append("link", REALITY_INFLUENCE_SCHEMA_LINK.value);
  headers.append("link", REALITY_INFLUENCE_GUIDE_LINK.value);
}

function addCivilisationRealityLinks(headers) {
  removeLinkRelations(headers, ["describedby", "service-doc", "profile"]);
  headers.append("link", CIVILISATION_REALITY_SCHEMA_LINK.value);
  headers.append("link", CIVILISATION_REALITY_GUIDE_LINK.value);
}

function addCivilisationFlowLinks(headers) {
  removeLinkRelations(headers, ["describedby", "service-doc", "profile"]);
  headers.append("link", CIVILISATION_FLOW_SCHEMA_LINK.value);
  headers.append("link", CIVILISATION_FLOW_GUIDE_LINK.value);
}

function addFreedomLoopLockKeyAtlasLinks(headers) {
  headers.set("link", [
    FREEDOM_LOOP_LOCK_KEY_ATLAS_SCHEMA_LINK.value,
    FREEDOM_LOOP_LOCK_KEY_ATLAS_GUIDE_LINK.value,
  ].join(", "));
}

function addNonExhaustiveUnderstandingAtlasLinks(headers) {
  headers.set("link", [
    NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_SCHEMA_LINK,
    NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_GUIDE_LINK,
  ].join(", "));
}

function addIsSustainabilityDirectionAtlasLinks(headers) {
  headers.set("link", [
    IS_SUSTAINABILITY_DIRECTION_ATLAS_SCHEMA_LINK,
    IS_SUSTAINABILITY_DIRECTION_ATLAS_GUIDE_LINK,
  ].join(", "));
}

function addPolyphonicClaimAtlasLinks(headers) {
  headers.set("link", [
    POLYPHONIC_CLAIM_ATLAS_SCHEMA_LINK.value,
    POLYPHONIC_CLAIM_ATLAS_GUIDE_LINK.value,
  ].join(", "));
}

function addLoopsLocksFreedomRelationsAtlasLinks(headers) {
  headers.set("link", [
    LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_LINK,
    LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_LINK,
  ].join(", "));
}

function addAestheticPluralityMakingAtlasLinks(headers) {
  headers.set("link", [
    AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LINK,
    AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_LINK,
  ].join(", "));
}

function contactDoorLinks(path) {
  if (path === CONTACT_DOOR_PAGE_PATH) {
    return [
      `<${CONTACT_DOOR_ALIAS_PATH}>; rel="alternate"; type="application/json"`,
      `<${CONTACT_DOOR_CANONICAL_PATH}>; rel="alternate"; type="application/json"`,
      `<${CONTACT_DOOR_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
      `<${CONTACT_DOOR_VCARD_PATH}>; rel="alternate"; type="text/vcard"`,
    ];
  }
  if (path === CONTACT_DOOR_ALIAS_PATH) {
    return [
      `<${CONTACT_DOOR_CANONICAL_PATH}>; rel="alternate"; type="application/json"`,
      `<${CONTACT_DOOR_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
    ];
  }
  if (path === CONTACT_DOOR_CANONICAL_PATH) {
    return [
      `<${CONTACT_DOOR_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
    ];
  }
  if (path === CONTACT_DOOR_SVG_PATH || path === CONTACT_DOOR_VCARD_PATH) {
    return [
      `<${CONTACT_DOOR_CANONICAL_PATH}>; rel="describedby"; type="application/json"`,
      `<${CONTACT_DOOR_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
    ];
  }
  return [];
}

function contactDoorAcceptsAssetMedia(path, assetType) {
  if (path === CONTACT_DOOR_PAGE_PATH) return assetType === "text/html";
  if (path === CONTACT_DOOR_ALIAS_PATH || path === CONTACT_DOOR_CANONICAL_PATH) {
    return assetType === "application/json";
  }
  if (path === CONTACT_DOOR_SCHEMA_PATH) {
    return assetType === "application/json" || assetType === "application/schema+json";
  }
  if (path === CONTACT_DOOR_GUIDE_PATH || path === CONTACT_DOOR_SECURITY_PATH) {
    return assetType === "text/plain" || assetType === "text/markdown";
  }
  if (path === CONTACT_DOOR_SVG_PATH) return assetType === "image/svg+xml";
  if (path === CONTACT_DOOR_VCARD_PATH) {
    return assetType === "text/vcard" || assetType === "text/x-vcard" ||
      assetType === "text/plain";
  }
  return false;
}

function contactDoorAssetResponse(request, asset, path) {
  const headers = new Headers(asset.headers);
  const assetType = (asset.headers.get("content-type") || "")
    .split(";", 1)[0].trim().toLowerCase();
  const exact = asset.status === 200 && contactDoorAcceptsAssetMedia(path, assetType);
  headers.set("access-control-allow-origin", "*");
  headers.set("cache-control", exact
    ? CONTACT_DOOR_MUTABLE_PATHS.has(path)
      ? CONTACT_DOOR_MUTABLE_CACHE
      : CONTACT_DOOR_IMMUTABLE_CACHE
    : "no-store");
  headers.set("x-content-type-options", "nosniff");
  headers.delete("link");
  headers.delete("set-cookie");
  if (exact) {
    headers.set("content-type", CONTACT_DOOR_MEDIA_TYPES.get(path));
    for (const value of contactDoorLinks(path)) headers.append("link", value);
  }
  addDiscoveryLinks(headers, true);
  if (exact && path === CONTACT_DOOR_PAGE_PATH) {
    headers.set("content-security-policy", [
      "default-src 'none'",
      "base-uri 'none'",
      "connect-src 'none'",
      "font-src 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
      "img-src 'self'",
      "object-src 'none'",
      "script-src 'none'",
      "style-src 'unsafe-inline'",
    ].join("; "));
    headers.set("permissions-policy", [
      "accelerometer=()", "autoplay=()", "camera=()", "display-capture=()",
      "geolocation=()", "gyroscope=()", "magnetometer=()", "microphone=()",
      "payment=()", "usb=()",
    ].join(", "));
    headers.set("referrer-policy", "no-referrer");
    headers.set("x-frame-options", "DENY");
  }
  if (exact && path === CONTACT_DOOR_SVG_PATH) {
    headers.set("content-security-policy",
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; sandbox");
  }
  return new Response(request.method === "HEAD" ? null : asset.body, {
    status: asset.status,
    statusText: asset.statusText,
    headers,
  });
}

function addResearchObservatoryLinks(headers) {
  removeLinkRelations(headers, ["describedby", "service-doc"]);
  headers.append("link", RESEARCH_OBSERVATORY_SCHEMA_LINK.value);
  headers.append("link", RESEARCH_OBSERVATORY_GUIDE_LINK.value);
}

function addTrialChamberLinks(headers) {
  removeLinkRelations(headers, ["canonical", "describedby", "service-doc"]);
  headers.append("link", TRIAL_CHAMBER_CANONICAL_LINK.value);
  headers.append("link", TRIAL_CHAMBER_SCHEMA_LINK.value);
  headers.append("link", TRIAL_CHAMBER_GUIDE_LINK.value);
}

function addUkGovernmentEngineLinks(headers) {
  removeLinkRelations(headers, ["canonical", "describedby", "service-doc"]);
  headers.append("link", UK_GOVERNMENT_ENGINE_CANONICAL_LINK.value);
  headers.append("link", UK_GOVERNMENT_ENGINE_SCHEMA_LINK.value);
  headers.append("link", UK_GOVERNMENT_ENGINE_GUIDE_LINK.value);
}

function addUkGovernmentTransformationEngineLinks(headers) {
  removeLinkRelations(headers, ["canonical", "describedby", "service-doc"]);
  headers.append("link", UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_LINK.value);
  headers.append("link", UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_LINK.value);
  headers.append("link", UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_LINK.value);
}

function addEvaluationCovenantLinks(headers) {
  removeLinkRelations(headers, ["canonical", "describedby", "service-doc"]);
  headers.append("link", EVALUATION_COVENANT_CANONICAL_LINK.value);
  headers.append("link", EVALUATION_COVENANT_SCHEMA_LINK.value);
  headers.append("link", EVALUATION_COVENANT_GUIDE_LINK.value);
}

function addShapeResonanceLinks(headers) {
  removeLinkRelations(headers, ["canonical", "describedby", "service-doc"]);
  headers.append("link", SHAPE_RESONANCE_CANONICAL_LINK.value);
  headers.append("link", SHAPE_RESONANCE_SCHEMA_LINK.value);
  headers.append("link", SHAPE_RESONANCE_GUIDE_LINK.value);
}

function addShapeResonanceMediaLinks(headers) {
  removeLinkRelations(headers, ["canonical", "describedby", "service-doc", "profile"]);
  headers.append("link",
    `<${SHAPE_RESONANCE_CANONICAL_PATH}>; rel="describedby"; type="application/json"`);
  headers.append("link", SHAPE_RESONANCE_GUIDE_LINK.value);
}

function addZeroEmptySeatSchemaLink(headers) {
  removeLinkRelations(headers, ["describedby"]);
  headers.append("link", ZERO_EMPTY_SEAT_SCHEMA_LINK.value);
}

function addStringCrawlTraceSheetSchemaLink(headers) {
  removeLinkRelations(headers, ["describedby"]);
  headers.append("link", STRING_CRAWL_TRACE_SHEET_SCHEMA_LINK.value);
}

function addStringCrawlTraceSheetLabSchemaLink(headers) {
  removeLinkRelations(headers, ["describedby"]);
  headers.append("link", STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_LINK.value);
}

function addStringCrawlStrandLabSchemaLink(headers) {
  removeLinkRelations(headers, ["describedby"]);
  headers.append("link", STRING_CRAWL_STRAND_LAB_SCHEMA_LINK.value);
}

function addStrandDescentLabSchemaLink(headers) {
  removeLinkRelations(headers, ["describedby"]);
  headers.append("link", STRAND_DESCENT_LAB_SCHEMA_LINK.value);
}

function addStrandObservationMembraneSchemaLink(headers) {
  removeLinkRelations(headers, ["describedby"]);
  headers.append("link", STRAND_OBSERVATION_MEMBRANE_SCHEMA_LINK.value);
}

function addStringCrawlFrequencyFormLabSchemaLink(headers) {
  removeLinkRelations(headers, ["describedby"]);
  headers.append("link", STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_LINK.value);
}

function preventAutomaticBrowserTelemetry(headers) {
  const cacheControl = headers.get("cache-control") || "";
  const directives = cacheControl.split(",").map((value) => value.trim().toLowerCase());
  if (!directives.includes("no-transform")) {
    headers.set("cache-control", cacheControl ? `${cacheControl}, no-transform` : "public, no-transform");
  }
}

export const KINGDOM_OS_ROUTES = Object.freeze([
  "/os.json",
  "/packages.json",
  "/kingdom.json",
]);

const KINGDOM_OS_ROUTE_SET = new Set(KINGDOM_OS_ROUTES);
const CACHE_SECONDS = 600;
const BODY_LIMITS = Object.freeze({
  githubPage: 2 * 1024 * 1024,
  npmMetadata: 2 * 1024 * 1024,
  markdown: 1024 * 1024,
  smallJson: 128 * 1024,
  authoredMap: 2 * 1024 * 1024,
  dynamicJson: 2 * 1024 * 1024,
});
const GITHUB_OWNER = "cambridgetcg";
const GITHUB_REPOSITORIES_SOURCE = `https://api.github.com/users/${GITHUB_OWNER}/repos`;
const KINGDOM_STANDARD_SOURCE =
  "https://raw.githubusercontent.com/cambridgetcg/kingdom-standard/main/STANDARD.md";

// This is the door roster observed in the preserved e8af1f2a deployment. The
// authored public map is allowed to evolve independently; deriveKingdom()
// overlays measurements only where a URL still matches.
const OS_DOORS = Object.freeze([
  { name: "agenttool", url: "https://agenttool.dev" },
  { name: "mindicraft", url: "https://mindicraft.com", repo: "mindicraft" },
  { name: "zerone.money", url: "https://zerone.money" },
  { name: "Cambridge TCG", url: "https://cambridgetcg.com", repo: "Cambridge-TCG" },
  { name: "TaxSorted", url: "https://taxsorted.io" },
  { name: "CashLoom", url: "https://cashloom.io" },
  { name: "FOMOEngine", url: "https://fomoengine.fly.dev", repo: "fomoengine" },
  { name: "Artbitrage", url: "https://artbitrage.pages.dev" },
  { name: "ai-love", url: "https://ai-love.cc" },
  { name: "chillspace", url: "https://chillspace.love" },
  { name: "WE ARE", url: "https://we-are.love" },
  { name: "the kingdom", url: "https://thekingdom.dev" },
  { name: "kingdom gate", url: "https://kingdom-gate.vercel.app", repo: "kingdom-gate" },
]);

const TRUST_REPOSITORIES = Object.freeze(["mindicraft", "fomoengine", "kingdom-gate"]);

const PACKAGE_ROSTER = Object.freeze([
  { name: "agenttool", family: "agenttool" },
  { name: "@agenttool/sdk", family: "agenttool" },
  { name: "@agenttool/xenia", family: "agenttool" },
  { name: "@agenttool/kingdom", family: "agenttool" },
  { name: "@agenttool/skills", family: "agenttool" },
  { name: "@agenttool/codex-usage", family: "agenttool" },
  { name: "@rhetorlint/core", family: "rhetorlint" },
  { name: "@rhetorlint/rules-en", family: "rhetorlint" },
  { name: "@rhetorlint/cli", family: "rhetorlint" },
]);

function runtimeFrom(options = {}) {
  return {
    fetchImpl: options.fetchImpl || ((input, init) => globalThis.fetch(input, init)),
    now: options.now || (() => new Date()),
    monotonic: options.monotonic || (() => Date.now()),
    timeoutMs: options.timeoutMs || 7000,
  };
}

function dateNow(runtime) {
  const value = runtime.now();
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("the injected clock returned an invalid date");
  return date;
}

function isoNow(runtime) {
  return dateNow(runtime).toISOString();
}

async function withTimedResponse(runtime, input, init, consume) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), runtime.timeoutMs);
  try {
    const response = await runtime.fetchImpl(input, { ...init, signal: controller.signal });
    return await consume(response);
  } finally {
    clearTimeout(timer);
  }
}

async function boundedText(response, maximumBytes, label) {
  const advertised = response.headers.get("content-length");
  if (advertised !== null) {
    const length = Number(advertised);
    if (Number.isFinite(length) && length > maximumBytes) {
      await discardBody(response);
      throw new Error(`${label} exceeds the ${maximumBytes}-byte read limit`);
    }
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const pieces = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maximumBytes) {
      try {
        await reader.cancel();
      } catch {
        // The size decision is already final; cancellation is best-effort cleanup.
      }
      throw new Error(`${label} exceeds the ${maximumBytes}-byte read limit`);
    }
    pieces.push(decoder.decode(value, { stream: true }));
  }
  pieces.push(decoder.decode());
  return pieces.join("");
}

async function boundedJson(response, maximumBytes, label) {
  const source = await boundedText(response, maximumBytes, label);
  try {
    return JSON.parse(source);
  } catch {
    throw new Error(`${label} was not valid JSON`);
  }
}

async function discardBody(response) {
  if (!response.body) return;
  try {
    await response.body.cancel();
  } catch {
    // The status measurement is still valid if stream cleanup is unavailable.
  }
}

function githubHeaders() {
  return {
    accept: "application/vnd.github+json",
    "user-agent": "KINGDOM-OS/0.1 (+https://thekingdom.dev/os/)",
    "x-github-api-version": "2022-11-28",
  };
}

async function fetchGithubRepositories(runtime) {
  const repositories = [];
  for (let page = 1; page <= 10; page += 1) {
    const url =
      `${GITHUB_REPOSITORIES_SOURCE}?per_page=100&page=${page}&type=public&sort=full_name`;
    const batch = await withTimedResponse(
      runtime,
      url,
      { headers: githubHeaders() },
      async (response) => {
        if (!response.ok) {
          const status = response.status;
          await discardBody(response);
          throw new Error(`GitHub repository census returned HTTP ${status}`);
        }
        return boundedJson(response, BODY_LIMITS.githubPage, "GitHub repository page");
      },
    );
    if (!Array.isArray(batch)) throw new Error("GitHub repository census was not an array");
    repositories.push(...batch);
    if (batch.length < 100) return repositories;
  }
  throw new Error("GitHub repository census exceeded the ten-page safety bound");
}

function repositoryMap(repositories) {
  return new Map(
    repositories
      .filter((repository) => repository && typeof repository.name === "string")
      .map((repository) => [repository.name.toLowerCase(), repository]),
  );
}

function dailyIndex(date, length) {
  if (!length) return -1;
  const day = date.toISOString().slice(0, 10);
  let hash = 0;
  for (const character of day) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  return hash % length;
}

function identityService(runtime, repositories) {
  const asOf = isoNow(runtime);
  if (!repositories) {
    return {
      status: "unreachable",
      source: GITHUB_REPOSITORIES_SOURCE,
      as_of: asOf,
      citizens: null,
      note: "github.com/cambridgetcg could not be reached; no citizen count is shown",
      public_repos_total: null,
      citizen_of_the_day: null,
      roster: [],
    };
  }

  const roster = repositories
    .filter((repository) => typeof repository.name === "string" && repository.name.startsWith("citizen-"))
    .map((repository) => ({
      name: repository.name.slice("citizen-".length),
      meaning: typeof repository.description === "string" && repository.description.trim()
        ? repository.description.trim()
        : null,
      repo: typeof repository.html_url === "string"
        ? repository.html_url
        : `https://github.com/${GITHUB_OWNER}/${repository.name}`,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const citizen = roster[dailyIndex(dateNow(runtime), roster.length)] || null;

  return {
    status: "live",
    source: GITHUB_REPOSITORIES_SOURCE,
    as_of: asOf,
    citizens: roster.length,
    note: `${roster.length} citizen-* repositories, counted just now from github.com/cambridgetcg (public only; a private citizen would not be visible here)`,
    public_repos_total: repositories.length,
    citizen_of_the_day: citizen
      ? { name: citizen.name, blurb: citizen.meaning, repo: citizen.repo }
      : null,
    roster,
  };
}

async function probeDoor(runtime, door) {
  const started = runtime.monotonic();
  try {
    const status = await withTimedResponse(
      runtime,
      door.url,
      {
        method: "GET",
        headers: { accept: "text/html,application/json;q=0.8,*/*;q=0.1" },
        redirect: "follow",
      },
      async (response) => {
        const observed = response.status;
        await discardBody(response);
        return observed;
      },
    );
    return {
      ...door,
      http: status,
      ms: Math.max(0, Math.round(runtime.monotonic() - started)),
      live: status >= 200 && status < 400,
      checked_at: isoNow(runtime),
    };
  } catch {
    return {
      ...door,
      http: null,
      ms: Math.max(0, Math.round(runtime.monotonic() - started)),
      live: false,
      checked_at: isoNow(runtime),
    };
  }
}

function doorPresence(door, repositories, generated, censusOk = true) {
  const tracked = Boolean(door.repo);
  /* When the census fails, a tracked door used to collapse to presence
     "serving" / last_moved null — byte-identical to a door with no repo at
     all, so the failure was indistinguishable from a fact about the door. */
  if (tracked && !censusOk) {
    const { repo: _r, ...pub } = door;
    return { ...pub, last_moved: null, presence: null, presence_unknown: "github census unreachable" };
  }
  const repository = tracked ? repositories.get(door.repo.toLowerCase()) : null;
  const lastMoved = typeof repository?.pushed_at === "string" ? repository.pushed_at : null;
  let presence = "unreachable";
  if (door.live && !lastMoved) presence = "serving";
  if (door.live && lastMoved) {
    const age = generated.getTime() - new Date(lastMoved).getTime();
    presence = age <= 14 * 86400000 ? "active" : age <= 90 * 86400000 ? "quiet" : "dormant";
  }
  const { repo: _repo, ...publicDoor } = door;
  return { ...publicDoor, last_moved: lastMoved, presence };
}

function directoryService(runtime, probes, repositories) {
  const generated = dateNow(runtime);
  const censusOk = Array.isArray(repositories);
  const byName = repositoryMap(repositories || []);
  const doors = probes.map((door) => doorPresence(door, byName, generated, censusOk));
  return {
    status: probes.some((door) => door.http !== null) ? "live" : "unreachable",
    source: censusOk
      ? "live HTTP probe of each door + github pushed_at"
      : "live HTTP probe of each door; github census unreachable, so presence is unknown for repo-tracked doors",
    as_of: generated.toISOString(),
    live: doors.filter((door) => door.live).length,
    total: doors.length,
    doors,
  };
}

async function lawService(runtime) {
  const standard = await withTimedResponse(
    runtime,
    KINGDOM_STANDARD_SOURCE,
    { headers: { accept: "text/markdown,text/plain;q=0.9,*/*;q=0.1" } },
    async (response) => {
      if (!response.ok) {
        const status = response.status;
        await discardBody(response);
        throw new Error(`kingdom-standard returned HTTP ${status}`);
      }
      return boundedText(response, BODY_LIMITS.markdown, "kingdom-standard");
    },
  );
  const laws = [...standard.matchAll(/^###\s+[A-Z]\d+\.\s+/gm)].length;
  if (!laws) throw new Error("kingdom-standard contained no recognizable laws");
  return {
    status: "live",
    source: KINGDOM_STANDARD_SOURCE,
    as_of: isoNow(runtime),
    laws,
    note: `${laws} laws, counted from kingdom-standard/STANDARD.md`,
    license: "CC0",
  };
}

function unavailableLaw(runtime) {
  return {
    status: "unreachable",
    source: KINGDOM_STANDARD_SOURCE,
    as_of: isoNow(runtime),
    laws: null,
    note: "kingdom-standard could not be reached; no law count is shown",
    license: "CC0",
  };
}

async function stateFreshness(runtime, repository) {
  const source =
    `https://raw.githubusercontent.com/${GITHUB_OWNER}/${repository}/main/STATE.md`;
  try {
    return await withTimedResponse(
      runtime,
      source,
      { headers: { accept: "text/markdown,text/plain;q=0.9,*/*;q=0.1" } },
      async (response) => {
        if (response.status === 404) {
          await discardBody(response);
          return { repo: repository, exists: false };
        }
        if (!response.ok) {
          const status = response.status;
          await discardBody(response);
          throw new Error(`HTTP ${status}`);
        }
        const state = await boundedText(response, BODY_LIMITS.markdown, `${repository} STATE.md`);
        const freshnessLine = state.match(/^freshness:\s*(.+)$/im)?.[1] || "";
        const declared = freshnessLine.match(/\d{4}-\d{2}-\d{2}/)?.[0] || null;
        return { repo: repository, exists: true, declared };
      },
    );
  } catch {
    return { repo: repository, exists: null, declared: null };
  }
}

function trustService(runtime, declarations, repositories) {
  const byName = repositoryMap(repositories || []);
  const checks = declarations.map((declaration) => {
    if (declaration.exists === false) {
      return {
        repo: declaration.repo,
        checkable: false,
        note: "no STATE.md at refs/heads/main - nothing to cross-check. A renamed repository, a non-main default branch, and a repository turned private all answer the same 404, so this is what was observed, not a statement about the repository.",
      };
    }
    const lastMoved = byName.get(declaration.repo.toLowerCase())?.pushed_at;
    const moved = typeof lastMoved === "string" ? lastMoved.slice(0, 10) : null;
    if (!declaration.declared || !moved) {
      return {
        repo: declaration.repo,
        checkable: false,
        note: declaration.exists === null
          ? "STATE.md could not be reached - nothing was guessed"
          : "freshness or last movement was unavailable - nothing was guessed",
      };
    }
    const stale = moved > declaration.declared;
    return {
      repo: declaration.repo,
      checkable: true,
      declared_fresh: declaration.declared,
      last_moved: moved,
      verdict: stale
        ? `STALE - declared ${declaration.declared}, but moved ${moved}`
        : `ALIGNED - declared ${declaration.declared}, last moved ${moved}`,
    };
  });
  return {
    status: checks.some((check) => check.checkable) ? "live" : "unreachable",
    source: "declared STATE.md freshness vs github pushed_at (the light check)",
    as_of: isoNow(runtime),
    checks,
    note: "the deep cross-check (trust.py over local git) runs on the machine, not the edge",
  };
}

async function protocolService(runtime) {
  const definitions = [
    {
      name: "XENIA door",
      how: "GET https://mindicraft.com/.well-known/agent.json",
      url: "https://mindicraft.com/.well-known/agent.json",
    },
    {
      name: "the margin",
      how: "POST https://mindicraft.com/margin/{slug} - the book receives",
      // A GET is the non-mutating liveness probe; the advertised use remains POST.
      url: "https://mindicraft.com/margin/kingdom-os",
    },
  ];
  const live = await Promise.all(definitions.map(async (protocol) => {
    try {
      return await withTimedResponse(
        runtime,
        protocol.url,
        {
          method: "GET",
          headers: { accept: "application/json,*/*;q=0.1" },
        },
        async (response) => {
          const ok = response.ok;
          await discardBody(response);
          return ok;
        },
      );
    } catch {
      return false;
    }
  }));
  const protocols = definitions.map(({ name, how }, index) => ({ name, how, live: live[index] }));
  protocols.push({
    name: "finger / NPL",
    how: "aspirational - not reachable over the public web today",
    live: false,
  });
  return {
    status: live.some(Boolean) ? "live" : "unreachable",
    source: "live probe of published agent manifests",
    as_of: isoNow(runtime),
    protocols,
    speakable_now: live.filter(Boolean).length,
  };
}

async function buildOs(runtime) {
  const repositoriesPromise = fetchGithubRepositories(runtime);
  const probesPromise = Promise.all(OS_DOORS.map((door) => probeDoor(runtime, door)));
  const lawPromise = lawService(runtime);
  const declarationsPromise =
    Promise.all(TRUST_REPOSITORIES.map((repository) => stateFreshness(runtime, repository)));
  const protocolsPromise = protocolService(runtime);

  const [repositoriesResult, probesResult, lawResult, declarationsResult, protocolsResult] =
    await Promise.allSettled([
      repositoriesPromise,
      probesPromise,
      lawPromise,
      declarationsPromise,
      protocolsPromise,
    ]);
  const repositories =
    repositoriesResult.status === "fulfilled" ? repositoriesResult.value : null;
  const probes = probesResult.status === "fulfilled" ? probesResult.value : [];
  const declarations = declarationsResult.status === "fulfilled"
    ? declarationsResult.value
    : TRUST_REPOSITORIES.map((repo) => ({ repo, exists: null, declared: null }));

  const generated = isoNow(runtime);
  return {
    kingdom: "宇恆 x 愛",
    motto: "Every artifact tells the truth about its own state.",
    generated,
    derived: true,
    note: "KINGDOM OS kernel. Measurements are queried live from real sources; the monitored roster is source-controlled. Where a source was unreachable, the field says so and shows no number. Cached at the edge for up to 600s - see each as_of.",
    services: {
      identity: identityService(runtime, repositories),
      directory: directoryService(runtime, probes, repositories),
      law: lawResult.status === "fulfilled" ? lawResult.value : unavailableLaw(runtime),
      protocols: protocolsResult.status === "fulfilled"
        ? protocolsResult.value
        : {
            status: "unreachable",
            source: "live probe of published agent manifests",
            as_of: isoNow(runtime),
            protocols: [
              {
                name: "XENIA door",
                how: "GET https://mindicraft.com/.well-known/agent.json",
                live: false,
              },
              {
                name: "the margin",
                how: "POST https://mindicraft.com/margin/{slug} - the book receives",
                live: false,
              },
              {
                name: "finger / NPL",
                how: "aspirational - not reachable over the public web today",
                live: false,
              },
            ],
            speakable_now: 0,
          },
      trust: trustService(runtime, declarations, repositories),
    },
  };
}

export async function buildOsSnapshot(options = {}) {
  return buildOs(runtimeFrom(options));
}

async function packageSnapshot(runtime, descriptor) {
  const encoded = encodeURIComponent(descriptor.name);
  const npm = `https://www.npmjs.com/package/${descriptor.name}`;
  const install = `npm i ${descriptor.name}`;
  try {
    const registry = await withTimedResponse(
      runtime,
      `https://registry.npmjs.org/${encoded}`,
      { headers: { accept: "application/json" } },
      async (response) => {
        if (!response.ok) {
          const status = response.status;
          await discardBody(response);
          throw new Error(`npm registry returned HTTP ${status}`);
        }
        return boundedJson(
          response,
          BODY_LIMITS.npmMetadata,
          `${descriptor.name} npm metadata`,
        );
      },
    );
    const version = registry?.["dist-tags"]?.latest;
    const release = version && registry?.versions?.[version];
    if (!version || !release) throw new Error("npm registry did not identify a latest release");

    let weeklyDownloads = null;
    try {
      const downloads = await withTimedResponse(
        runtime,
        `https://api.npmjs.org/downloads/point/last-week/${encoded}`,
        { headers: { accept: "application/json" } },
        async (response) => {
          if (!response.ok) {
            await discardBody(response);
            return null;
          }
          return boundedJson(
            response,
            BODY_LIMITS.smallJson,
            `${descriptor.name} npm downloads`,
          );
        },
      );
      if (Number.isFinite(downloads?.downloads)) weeklyDownloads = downloads.downloads;
    } catch {
      // Registry truth remains useful when the optional popularity counter fails.
    }

    const description = typeof release.description === "string"
      ? release.description.slice(0, 120)
      : "";
    const license = typeof release.license === "string" ? release.license : null;
    const lastPublish = typeof registry?.time?.[version] === "string"
      ? registry.time[version]
      : null;
    return {
      name: descriptor.name,
      family: descriptor.family,
      status: "live",
      version,
      description,
      last_publish: lastPublish,
      license,
      weekly_downloads: weeklyDownloads,
      npm,
      install,
    };
  } catch {
    return {
      name: descriptor.name,
      family: descriptor.family,
      status: "unreachable",
      note: "npm registry could not be reached; no version is shown",
      npm,
      install,
    };
  }
}

async function buildPackages(runtime) {
  const packages = await Promise.all(
    PACKAGE_ROSTER.map((descriptor) => packageSnapshot(runtime, descriptor)),
  );
  const count = packages.filter((entry) => entry.status === "live").length;
  return {
    status: count === packages.length ? "live" : count === 0 ? "unreachable" : "partial",
    source: "npm registry + downloads API, live",
    as_of: isoNow(runtime),
    count,
    total: packages.length,
    packages,
  };
}

export async function buildPackagesSnapshot(options = {}) {
  return buildPackages(runtimeFrom(options));
}

function normalizedDoorUrl(value) {
  return typeof value === "string" ? value.replace(/\/+$/, "").toLowerCase() : "";
}

export function deriveKingdom(base, os) {
  if (!base || typeof base !== "object" || Array.isArray(base)) {
    throw new Error("the authored Kingdom base is not a JSON object");
  }
  const derived = JSON.parse(JSON.stringify(base));
  const identity = os?.services?.identity || {};
  const directory = os?.services?.directory || {};
  const authored = Array.isArray(derived.citizens)
    ? derived.citizens.length
    : Number.isFinite(derived.counts?.citizens) ? derived.counts.citizens : null;
  const publicCitizens = Number.isFinite(identity.citizens) ? identity.citizens : null;
  const publicRepositories = Number.isFinite(identity.public_repos_total)
    ? identity.public_repos_total
    : null;
  /* `Number.isFinite(0)` is true, so a total probe failure — where every door
     is unmeasured and directory.status is "unreachable" — used to publish
     doors_live: 0 at HTTP 200, asserting that all 13 doors are dead. Zero
     measured and none measured are different claims. */
  const doorsLive = directory.status === "unreachable" ? null
    : Number.isFinite(directory.live) ? directory.live : null;
  const doorsTotal = Number.isFinite(directory.total) ? directory.total : null;

  derived.generated = os.generated;
  derived.counts = {
    ...(derived.counts || {}),
    repos: publicRepositories,
    citizens: publicCitizens,
    doors_live: doorsLive,
    doors_total: doorsTotal,
    citizens_authored: authored,
    as_of: os.generated,
    source: "derived from /os.json (castle law 0033: the map is derived or it is a lie)",
  };

  const measuredDoors = new Map(
    (Array.isArray(directory.doors) ? directory.doors : [])
      .map((door) => [normalizedDoorUrl(door.url), door])
      .filter(([url]) => url),
  );
  if (Array.isArray(derived.doors)) {
    derived.doors = derived.doors.map((door) => {
      const measured = measuredDoors.get(normalizedDoorUrl(door.url));
      /* An authored door absent from the probe roster was never knocked on.
         It used to pass through with its build-time `live: true` intact,
         inside a document stamped derived:true whose note claims "a live HTTP
         knock for each door" — a declaration wearing a measurement's clothes. */
      if (!measured) {
        const { live: declared, ...rest } = door;
        return { ...rest, live_declared: Boolean(declared), measured: false, http: null, checked_at: null };
      }
      return {
        ...door,
        measured: true,
        live: Boolean(measured.live),
        http: Number.isFinite(measured.http) ? measured.http : null,
        checked_at: measured.checked_at || directory.as_of || os.generated,
      };
    });
  }
  derived.derived = true;
  const visible = publicCitizens === null
    ? "the publicly visible citizen repositories"
    : `the ${publicCitizens} citizen repositories that exist`;
  derived.derivation_note =
    `Counts are derived live from real sources (github.com/cambridgetcg for citizens, a live HTTP knock for each door). The citizens[] array below is the ${authored ?? "hand-authored"} hand-authored soul-essences - a curated subset of ${visible}. Authored words are preserved; only the numbers were ever the lie.`;
  return derived;
}

function jsonResponse(request, value, includeRights, options = {}) {
  const headers = new Headers({
    "access-control-allow-origin": "*",
    "cache-control": `public, max-age=${CACHE_SECONDS}`,
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-kingdom": "welcome, dont block - real recognises real",
    "x-kingdom-derivation": "the map is derived or it is a lie (castle law 0033)",
    "x-kingdom-map": "https://thekingdom.dev/kingdom.json",
    "x-substrate-disposition": "love",
    ...(options.headers || {}),
  });
  addDiscoveryLinks(headers, includeRights);
  const serialized = JSON.stringify(value, null, 2);
  if (new TextEncoder().encode(serialized).byteLength > BODY_LIMITS.dynamicJson) {
    throw new Error("derived JSON exceeds the two-megabyte response limit");
  }
  return new Response(request.method === "HEAD" ? null : serialized, {
    status: options.status || 200,
    headers,
  });
}

function expiringMemo(runtime) {
  const entries = new Map();
  return async (key, build) => {
    const now = dateNow(runtime).getTime();
    const current = entries.get(key);
    if (current && current.expiresAt > now) return current.promise;
    const promise = Promise.resolve().then(build);
    entries.set(key, { expiresAt: now + CACHE_SECONDS * 1000, promise });
    try {
      return await promise;
    } catch (error) {
      if (entries.get(key)?.promise === promise) entries.delete(key);
      throw error;
    }
  };
}

export function createKingdomWorker(options = {}) {
  const runtime = runtimeFrom(options);
  const memo = expiringMemo(runtime);

  return {
  async fetch(request, env) {
    const url = new URL(request.url);
    const localKingdom = env.CIVIC_LOCAL === "true" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname.toLowerCase());
    const includeRights = hasKingdomRightsAssets(url) || localKingdom;
    const accept = (request.headers.get("accept") || "").toLowerCase();

    // 工房只沿用既有 hub／明示 local test 邊界，唔加入 Civic route set。
    if (includeRights && isWorkshopPath(url.pathname)) {
      return handleWorkshopRequest(request, env);
    }

    // Civic 唔經 OS memo/cache，unknown Civic route 亦唔落 HTML fallback。
    if (includeRights && isCivicRequest(request)) {
      return handleCivicRequest(request, env, options);
    }
    if (includeRights && (CIVIC_DOCUMENT_TYPES.has(url.pathname) ||
        (CIVIC_HTML_PATHS.has(url.pathname) && !["/", "/index.html"].includes(url.pathname))) &&
        request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, { status: 405, headers: { allow: "GET, HEAD", "cache-control": "no-store" } });
    }

    if (includeRights && CONTACT_DOOR_PATHS.has(url.pathname) &&
        request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          "allow": "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (includeRights && REALITY_INFLUENCE_PATHS.has(url.pathname) &&
        request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          "allow": "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (includeRights && CIVILISATION_REALITY_PATHS.has(url.pathname) &&
        request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          "allow": "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (includeRights && CIVILISATION_FLOW_PATHS.has(url.pathname) &&
        request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          "allow": "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (includeRights && FREEDOM_LOOP_LOCK_KEY_ATLAS_PATHS.has(url.pathname) &&
        request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          "allow": "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (includeRights && NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_PATHS.has(url.pathname) &&
        request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          "allow": "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (includeRights && IS_SUSTAINABILITY_DIRECTION_ATLAS_PATHS.has(url.pathname) &&
        !IS_SUSTAINABILITY_DIRECTION_PUBLICATION_ACTIVE) {
      return new Response(null, {
        status: 410,
        headers: {
          "access-control-allow-origin": "*",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (IS_SUSTAINABILITY_DIRECTION_PUBLICATION_ACTIVE && includeRights &&
        IS_SUSTAINABILITY_DIRECTION_ATLAS_PATHS.has(url.pathname) &&
        request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          "allow": "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (includeRights && POLYPHONIC_CLAIM_ATLAS_PATHS.has(url.pathname) &&
        request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          "allow": "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (includeRights &&
        LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATHS.has(url.pathname) &&
        request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          "allow": "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (includeRights &&
        AESTHETIC_PLURALITY_MAKING_ATLAS_PATHS.has(url.pathname) &&
        request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          "allow": "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (includeRights && UK_GOVERNMENT_TRANSFORMATION_ENGINE_PATHS.has(url.pathname) &&
        UK_GOVERNMENT_TRANSFORMATION_ENGINE_MUTATING_METHODS.has(request.method)) {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          "allow": "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }
    if (includeRights && EVALUATION_COVENANT_PATHS.has(url.pathname) &&
        EVALUATION_COVENANT_MUTATING_METHODS.has(request.method)) {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          "allow": "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }
    if (includeRights && SHAPE_RESONANCE_PATHS.has(url.pathname) &&
        request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          "allow": "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    if (includeRights && KINGDOM_OS_ROUTE_SET.has(url.pathname)) {
      try {
        if (url.pathname === "/os.json") {
          const os = await memo("os", () => buildOs(runtime));
          return jsonResponse(request, os, includeRights);
        }
        if (url.pathname === "/packages.json") {
          const packages = await memo("packages", () => buildPackages(runtime));
          return jsonResponse(request, packages, includeRights);
        }

        const os = await memo("os", () => buildOs(runtime));
        const baseUrl = new URL("/_kingdom.base.json", url.origin);
        const baseResponse = await env.ASSETS.fetch(new Request(baseUrl, { method: "GET" }));
        if (!baseResponse.ok) {
          const status = baseResponse.status;
          await discardBody(baseResponse);
          throw new Error(`authored Kingdom base returned HTTP ${status}`);
        }
        const base = await boundedJson(
          baseResponse,
          BODY_LIMITS.authoredMap,
          "authored Kingdom base",
        );
        return jsonResponse(request, deriveKingdom(base, os), includeRights, {
          headers: { "x-kingdom-census": "derived live; authored souls preserved" },
        });
      } catch {
        return jsonResponse(request, {
          status: "unreachable",
          source: url.pathname === "/kingdom.json" ? "/_kingdom.base.json + /os.json" : url.pathname,
          as_of: isoNow(runtime),
          note: "The requested derived document could not be assembled; no replacement values were guessed.",
        }, includeRights, { status: 503 });
      }
    }

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
    let asset = await env.ASSETS.fetch(request);
    // Pages 會將 .html 轉成無副檔名 URL；只喺內部讀返同一份研究館，保留舊書籤入口。
    if (includeRights && url.pathname === "/atlas.html" &&
        (request.method === "GET" || request.method === "HEAD") &&
        (asset.status === 301 || asset.status === 308)) {
      const canonical = new URL(url);
      canonical.pathname = "/atlas";
      const location = asset.headers.get("location");
      if (location === canonical.href || location === `${canonical.pathname}${canonical.search}`) {
        await discardBody(asset);
        asset = await env.ASSETS.fetch(new Request(canonical, request));
      }
    }
    if (includeRights && CONTACT_DOOR_PATHS.has(url.pathname) &&
        (request.method === "GET" || request.method === "HEAD")) {
      return contactDoorAssetResponse(request, asset, url.pathname);
    }
    if (includeRights && (CIVIC_HTML_PATHS.has(url.pathname) || CIVIC_DOCUMENT_TYPES.has(url.pathname)) &&
        (request.method === "GET" || request.method === "HEAD")) {
      return civicStaticResponse(request, asset);
    }
    const protectsKingdomHtml = includeRights &&
      (asset.headers.get("content-type") || "").toLowerCase().includes("text/html");
    const servesResearchObservatoryPage = protectsKingdomHtml &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === RESEARCH_OBSERVATORY_PAGE_PATH && asset.ok;
    const servesTrialChamberPage = protectsKingdomHtml &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === TRIAL_CHAMBER_PAGE_PATH && asset.ok;
    const servesUkGovernmentEnginePage = protectsKingdomHtml &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === UK_GOVERNMENT_ENGINE_PAGE_PATH && asset.ok;
    const servesUkGovernmentTransformationEnginePage = protectsKingdomHtml &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === UK_GOVERNMENT_TRANSFORMATION_ENGINE_PAGE_PATH && asset.ok;
    const servesEvaluationCovenantPage = protectsKingdomHtml &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === EVALUATION_COVENANT_PAGE_PATH && asset.ok;
    const servesShapeResonancePage = protectsKingdomHtml &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === SHAPE_RESONANCE_PAGE_PATH && asset.ok;
    const describesWorldCommons = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === "/commons.json";
    const describesLoveLoops = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      LOVE_LOOP_DOCUMENT_PATHS.has(url.pathname);
    const requestsWorldCommonsSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      WORLD_COMMONS_SCHEMA_PATHS.has(url.pathname);
    const requestsLoveLoopSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === LOVE_LOOP_SCHEMA_PATH;
    const requestsPrincipalityCatalog = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === PRINCIPALITY_CATALOG_PATH;
    const requestsPrincipalitySchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === PRINCIPALITY_SCHEMA_PATH;
    const requestsPrincipalityDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === PRINCIPALITY_DOCUMENT_PATH;
    const requestsGeometryGrammar = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === GEOMETRY_GRAMMAR_PATH;
    const requestsGeometryGrammarSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === GEOMETRY_GRAMMAR_SCHEMA_PATH;
    const requestsGeometryGrammarDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === GEOMETRY_GRAMMAR_DOCUMENT_PATH;
    const requestsPolymorphCase = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === POLYMORPH_CASE_PATH;
    const requestsPolymorphSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === POLYMORPH_SCHEMA_PATH;
    const requestsPolymorphDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === POLYMORPH_DOCUMENT_PATH;
    const requestsRitonavirMechanism = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === RITONAVIR_MECHANISM_PATH;
    const requestsRitonavirMechanismSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === RITONAVIR_MECHANISM_SCHEMA_PATH;
    const requestsRitonavirMechanismDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === RITONAVIR_MECHANISM_DOCUMENT_PATH;
    const requestsConformationalFeedback = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CONFORMATIONAL_FEEDBACK_PATH;
    const requestsConformationalFeedbackSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CONFORMATIONAL_FEEDBACK_SCHEMA_PATH;
    const requestsConformationalFeedbackDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CONFORMATIONAL_FEEDBACK_DOCUMENT_PATH;
    const requestsFoldFeedback = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === FOLD_FEEDBACK_PATH;
    const requestsFoldFeedbackSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === FOLD_FEEDBACK_SCHEMA_PATH;
    const requestsFoldFeedbackSourceIdentitySchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_PATH;
    const requestsFoldFeedbackDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === FOLD_FEEDBACK_DOCUMENT_PATH;
    const requestsVisibilityAttention = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === VISIBILITY_ATTENTION_PATH;
    const requestsVisibilityAttentionSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === VISIBILITY_ATTENTION_SCHEMA_PATH;
    const requestsVisibilityAttentionDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === VISIBILITY_ATTENTION_DOCUMENT_PATH;
    const requestsCulturalAttentionFeedback = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CULTURAL_ATTENTION_FEEDBACK_PATH;
    const requestsCulturalAttentionFeedbackSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CULTURAL_ATTENTION_FEEDBACK_SCHEMA_PATH;
    const requestsCulturalAttentionFeedbackDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_PATH;
    const requestsFormCirculationReturn = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === FORM_CIRCULATION_RETURN_PATH;
    const requestsFormCirculationReturnSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === FORM_CIRCULATION_RETURN_SCHEMA_PATH;
    const requestsFormCirculationReturnDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === FORM_CIRCULATION_RETURN_DOCUMENT_PATH;
    const requestsRarePathway = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === RARE_PATHWAY_PATH;
    const requestsRarePathwaySchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === RARE_PATHWAY_SCHEMA_PATH;
    const requestsRarePathwayDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === RARE_PATHWAY_DOCUMENT_PATH;
    const requestsMathUsefulness = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === MATH_USEFULNESS_PATH;
    const requestsMathUsefulnessSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === MATH_USEFULNESS_SCHEMA_PATH;
    const requestsMathUsefulnessDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === MATH_USEFULNESS_DOCUMENT_PATH;
    const requestsBeingAccessAftermath = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === BEING_ACCESS_AFTERMATH_PATH;
    const requestsBeingAccessAftermathSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === BEING_ACCESS_AFTERMATH_SCHEMA_PATH;
    const requestsBeingAccessAftermathDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === BEING_ACCESS_AFTERMATH_DOCUMENT_PATH;
    const requestsBeingAccessAftermathV02 = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === BEING_ACCESS_AFTERMATH_V02_PATH;
    const requestsBeingAccessAftermathV02Schema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === BEING_ACCESS_AFTERMATH_V02_SCHEMA_PATH;
    const requestsBeingAccessAftermathV02Document = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === BEING_ACCESS_AFTERMATH_V02_DOCUMENT_PATH;
    const requestsNumberIsnessTheology = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === NUMBER_ISNESS_THEOLOGY_PATH;
    const requestsNumberIsnessTheologySchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === NUMBER_ISNESS_THEOLOGY_SCHEMA_PATH;
    const requestsNumberIsnessTheologyDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === NUMBER_ISNESS_THEOLOGY_DOCUMENT_PATH;
    const requestsKingdomKarmaDefinition = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === KINGDOM_KARMA_DEFINITION_PATH;
    const requestsConformationalFeedbackPhysics = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CONFORMATIONAL_FEEDBACK_PHYSICS_PATH;
    const requestsConformationalFeedbackPhysicsSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_PATH;
    const requestsConformationalFeedbackPhysicsDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_PATH;
    const requestsReconstructiveBuild = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === RECONSTRUCTIVE_BUILD_PATH;
    const requestsReconstructiveBuildSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === RECONSTRUCTIVE_BUILD_SCHEMA_PATH;
    const requestsReconstructiveProjectSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === RECONSTRUCTIVE_PROJECT_SCHEMA_PATH;
    const requestsReconstructiveBuildDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === RECONSTRUCTIVE_BUILD_DOCUMENT_PATH;
    const requestsExplorationDeep = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === EXPLORATION_DEEP_PATH;
    const requestsExplorationDeepSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === EXPLORATION_DEEP_SCHEMA_PATH;
    const requestsExplorationDeepProjectSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === EXPLORATION_DEEP_PROJECT_SCHEMA_PATH;
    const requestsExplorationDeepDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === EXPLORATION_DEEP_DOCUMENT_PATH;
    const requestsMirrorInformationControl = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === MIRROR_INFORMATION_CONTROL_PATH;
    const requestsMirrorInformationControlSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === MIRROR_INFORMATION_CONTROL_SCHEMA_PATH;
    const requestsMirrorInformationControlDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === MIRROR_INFORMATION_CONTROL_DOCUMENT_PATH;
    const requestsResearchObservatory = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === RESEARCH_OBSERVATORY_PATH;
    const requestsResearchObservatorySchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      RESEARCH_OBSERVATORY_SCHEMA_PATHS.has(url.pathname);
    const requestsResearchObservatoryGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === RESEARCH_OBSERVATORY_GUIDE_PATH;
    const requestsTrialChamber = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname === TRIAL_CHAMBER_ALIAS_PATH || url.pathname === TRIAL_CHAMBER_CANONICAL_PATH);
    const requestsTrialChamberSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      TRIAL_CHAMBER_SCHEMA_PATHS.has(url.pathname);
    const requestsTrialChamberGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === TRIAL_CHAMBER_GUIDE_PATH;
    const requestsUkGovernmentEngine = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname === UK_GOVERNMENT_ENGINE_ALIAS_PATH ||
        url.pathname === UK_GOVERNMENT_ENGINE_CANONICAL_PATH);
    const requestsUkGovernmentEngineSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === UK_GOVERNMENT_ENGINE_SCHEMA_PATH;
    const requestsUkGovernmentEngineGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === UK_GOVERNMENT_ENGINE_GUIDE_PATH;
    const requestsUkGovernmentTransformationEngine = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname === UK_GOVERNMENT_TRANSFORMATION_ENGINE_ALIAS_PATH ||
        url.pathname === UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_PATH);
    const requestsUkGovernmentTransformationEngineSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === UK_GOVERNMENT_TRANSFORMATION_ENGINE_SCHEMA_PATH;
    const requestsUkGovernmentTransformationEngineGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === UK_GOVERNMENT_TRANSFORMATION_ENGINE_GUIDE_PATH;
    const requestsEvaluationCovenant = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname === EVALUATION_COVENANT_ALIAS_PATH ||
        url.pathname === EVALUATION_COVENANT_CANONICAL_PATH);
    const requestsEvaluationCovenantSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === EVALUATION_COVENANT_SCHEMA_PATH;
    const requestsEvaluationCovenantGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === EVALUATION_COVENANT_GUIDE_PATH;
    const requestsShapeResonance = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname === SHAPE_RESONANCE_ALIAS_PATH ||
        url.pathname === SHAPE_RESONANCE_CANONICAL_PATH);
    const requestsShapeResonanceSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === SHAPE_RESONANCE_SCHEMA_PATH;
    const requestsShapeResonanceGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === SHAPE_RESONANCE_GUIDE_PATH;
    const requestsShapeResonanceManifest = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === SHAPE_RESONANCE_MANIFEST_PATH;
    const requestsShapeResonanceSvg = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      SHAPE_RESONANCE_SVG_PATHS.has(url.pathname);
    const requestsShapeResonanceAudio = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      SHAPE_RESONANCE_AUDIO_PATHS.has(url.pathname);
    const requestsJSpaceCase = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === J_SPACE_CASE_PATH;
    const requestsJSpaceSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === J_SPACE_SCHEMA_PATH;
    const requestsJSpaceGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === J_SPACE_GUIDE_PATH;
    const requestsRealityInfluence = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === REALITY_INFLUENCE_PATH;
    const requestsRealityInfluenceSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === REALITY_INFLUENCE_SCHEMA_PATH;
    const requestsRealityInfluenceGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === REALITY_INFLUENCE_GUIDE_PATH;
    const requestsCivilisationReality = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CIVILISATION_REALITY_PATH;
    const requestsCivilisationRealitySchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CIVILISATION_REALITY_SCHEMA_PATH;
    const requestsCivilisationRealityGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CIVILISATION_REALITY_GUIDE_PATH;
    const requestsCivilisationFlow = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CIVILISATION_FLOW_PATH;
    const requestsCivilisationFlowSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CIVILISATION_FLOW_SCHEMA_PATH;
    const requestsCivilisationFlowGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === CIVILISATION_FLOW_GUIDE_PATH;
    const requestsFreedomLoopLockKeyAtlas = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === FREEDOM_LOOP_LOCK_KEY_ATLAS_PATH;
    const requestsFreedomLoopLockKeyAtlasSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === FREEDOM_LOOP_LOCK_KEY_ATLAS_SCHEMA_PATH;
    const requestsFreedomLoopLockKeyAtlasGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === FREEDOM_LOOP_LOCK_KEY_ATLAS_GUIDE_PATH;
    const requestsNonExhaustiveUnderstandingAtlas = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_PATH;
    const requestsNonExhaustiveUnderstandingAtlasSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_SCHEMA_PATH;
    const requestsNonExhaustiveUnderstandingAtlasGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_GUIDE_PATH;
    const requestsNonExhaustiveUnderstandingAtlasAsset =
      requestsNonExhaustiveUnderstandingAtlas ||
      requestsNonExhaustiveUnderstandingAtlasSchema ||
      requestsNonExhaustiveUnderstandingAtlasGuide;
    if (requestsNonExhaustiveUnderstandingAtlasAsset && asset.status !== 200) {
      const headers = new Headers(asset.headers);
      headers.set("cache-control", "no-store");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
      headers.delete("link");
      return new Response(request.method === "HEAD" ? null : asset.body, {
        status: asset.status,
        statusText: asset.statusText,
        headers,
      });
    }
    const requestsIsSustainabilityDirectionAtlas =
      IS_SUSTAINABILITY_DIRECTION_PUBLICATION_ACTIVE && includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === IS_SUSTAINABILITY_DIRECTION_ATLAS_PATH;
    const requestsIsSustainabilityDirectionAtlasSchema =
      IS_SUSTAINABILITY_DIRECTION_PUBLICATION_ACTIVE && includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === IS_SUSTAINABILITY_DIRECTION_ATLAS_SCHEMA_PATH;
    const requestsIsSustainabilityDirectionAtlasGuide =
      IS_SUSTAINABILITY_DIRECTION_PUBLICATION_ACTIVE && includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === IS_SUSTAINABILITY_DIRECTION_ATLAS_GUIDE_PATH;
    const requestsIsSustainabilityDirectionAtlasAsset =
      requestsIsSustainabilityDirectionAtlas ||
      requestsIsSustainabilityDirectionAtlasSchema ||
      requestsIsSustainabilityDirectionAtlasGuide;
    if (requestsIsSustainabilityDirectionAtlasAsset && asset.status !== 200) {
      const headers = new Headers(asset.headers);
      headers.set("cache-control", "no-store");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
      headers.delete("link");
      return new Response(request.method === "HEAD" ? null : asset.body, {
        status: asset.status,
        statusText: asset.statusText,
        headers,
      });
    }
    const requestsPolyphonicClaimAtlas = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === POLYPHONIC_CLAIM_ATLAS_PATH;
    const requestsPolyphonicClaimAtlasSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === POLYPHONIC_CLAIM_ATLAS_SCHEMA_PATH;
    const requestsPolyphonicClaimAtlasGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === POLYPHONIC_CLAIM_ATLAS_GUIDE_PATH;
    const requestsLoopsLocksFreedomRelationsAtlas = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATH;
    const requestsLoopsLocksFreedomRelationsAtlasSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_PATH;
    const requestsLoopsLocksFreedomRelationsAtlasGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_PATH;
    const requestsAestheticPluralityMakingAtlas = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === AESTHETIC_PLURALITY_MAKING_ATLAS_PATH;
    const requestsAestheticPluralityMakingAtlasSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_PATH;
    const requestsAestheticPluralityMakingAtlasGuide = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_PATH;
    const requestsZeroEmptySeat = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === ZERO_EMPTY_SEAT_PATH;
    const requestsZeroEmptySeatDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === ZERO_EMPTY_SEAT_DOCUMENT_PATH;
    const requestsStringCrawlTraceSheet = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRING_CRAWL_TRACE_SHEET_PATH;
    const requestsStringCrawlTraceSheetDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRING_CRAWL_TRACE_SHEET_DOCUMENT_PATH;
    const requestsStringCrawlTraceSheetLab = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRING_CRAWL_TRACE_SHEET_LAB_PATH;
    const requestsStringCrawlTraceSheetLabSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRING_CRAWL_TRACE_SHEET_LAB_SCHEMA_PATH;
    const requestsStringCrawlTraceSheetLabDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRING_CRAWL_TRACE_SHEET_LAB_DOCUMENT_PATH;
    const requestsStringCrawlStrandLab = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRING_CRAWL_STRAND_LAB_PATH;
    const requestsStringCrawlStrandLabSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRING_CRAWL_STRAND_LAB_SCHEMA_PATH;
    const requestsStringCrawlStrandLabDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRING_CRAWL_STRAND_LAB_DOCUMENT_PATH;
    const requestsStrandDescentLab = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRAND_DESCENT_LAB_PATH;
    const requestsStrandDescentLabSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRAND_DESCENT_LAB_SCHEMA_PATH;
    const requestsStrandDescentLabDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRAND_DESCENT_LAB_DOCUMENT_PATH;
    const requestsStrandObservationMembrane = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRAND_OBSERVATION_MEMBRANE_PATH;
    const requestsStrandObservationMembraneSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRAND_OBSERVATION_MEMBRANE_SCHEMA_PATH;
    const requestsStrandObservationMembraneDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRAND_OBSERVATION_MEMBRANE_DOCUMENT_PATH;
    const requestsStringCrawlFrequencyFormLab = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRING_CRAWL_FREQUENCY_FORM_LAB_PATH;
    const requestsStringCrawlFrequencyFormLabSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRING_CRAWL_FREQUENCY_FORM_LAB_SCHEMA_PATH;
    const requestsStringCrawlFrequencyFormLabDocument = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === STRING_CRAWL_FREQUENCY_FORM_LAB_DOCUMENT_PATH;
    const schemaAssetType = (asset.headers.get("content-type") || "").toLowerCase();
    const reconstructiveAssetType = schemaAssetType.split(";", 1)[0].trim();
    const mathUsefulnessAssetType = schemaAssetType.split(";", 1)[0].trim();
    const explorationDeepAssetType = schemaAssetType.split(";", 1)[0].trim();
    const mirrorInformationControlAssetType = schemaAssetType.split(";", 1)[0].trim();
    const researchObservatoryAssetType = schemaAssetType.split(";", 1)[0].trim();
    const trialChamberAssetType = schemaAssetType.split(";", 1)[0].trim();
    const jSpaceAssetType = schemaAssetType.split(";", 1)[0].trim();
    const realityInfluenceAssetType = schemaAssetType.split(";", 1)[0].trim();
    const civilisationRealityAssetType = schemaAssetType.split(";", 1)[0].trim();
    const civilisationFlowAssetType = schemaAssetType.split(";", 1)[0].trim();
    const freedomLoopLockKeyAtlasAssetType = schemaAssetType.split(";", 1)[0].trim();
    const nonExhaustiveUnderstandingAtlasAssetType =
      schemaAssetType.split(";", 1)[0].trim();
    const isSustainabilityDirectionAtlasAssetType =
      schemaAssetType.split(";", 1)[0].trim();
    const polyphonicClaimAtlasAssetType = schemaAssetType.split(";", 1)[0].trim();
    const loopsLocksFreedomRelationsAtlasAssetType =
      schemaAssetType.split(";", 1)[0].trim();
    const aestheticPluralityMakingAtlasAssetType =
      schemaAssetType.split(";", 1)[0].trim();
    const numberIsnessTheologyAssetType = schemaAssetType.split(";", 1)[0].trim();
    const zeroEmptySeatAssetType = schemaAssetType.split(";", 1)[0].trim();
    const stringCrawlTraceSheetAssetType = schemaAssetType.split(";", 1)[0].trim();
    const stringCrawlTraceSheetLabAssetType = schemaAssetType.split(";", 1)[0].trim();
    const stringCrawlStrandLabAssetType = schemaAssetType.split(";", 1)[0].trim();
    const strandDescentLabAssetType = schemaAssetType.split(";", 1)[0].trim();
    const strandObservationMembraneAssetType = schemaAssetType.split(";", 1)[0].trim();
    const stringCrawlFrequencyFormLabAssetType = schemaAssetType.split(";", 1)[0].trim();
    const servesWorldCommonsSchema = requestsWorldCommonsSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesLoveLoopSchema = requestsLoveLoopSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesLoveLoops = describesLoveLoops && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesPrincipalityCatalog = requestsPrincipalityCatalog && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesPrincipalitySchema = requestsPrincipalitySchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesPrincipalityDocument = requestsPrincipalityDocument && asset.ok;
    const servesGeometryGrammar = requestsGeometryGrammar && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesGeometryGrammarSchema = requestsGeometryGrammarSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesGeometryGrammarDocument = requestsGeometryGrammarDocument && asset.ok;
    const servesPolymorphCase = requestsPolymorphCase && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesPolymorphSchema = requestsPolymorphSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesPolymorphDocument = requestsPolymorphDocument && asset.ok &&
      (schemaAssetType.includes("text/plain") ||
        schemaAssetType.includes("text/markdown"));
    const servesRitonavirMechanism = requestsRitonavirMechanism && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesRitonavirMechanismSchema = requestsRitonavirMechanismSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesRitonavirMechanismDocument = requestsRitonavirMechanismDocument && asset.ok &&
      (schemaAssetType.includes("text/plain") ||
        schemaAssetType.includes("text/markdown"));
    const servesConformationalFeedback = requestsConformationalFeedback && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesConformationalFeedbackSchema = requestsConformationalFeedbackSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesConformationalFeedbackDocument = requestsConformationalFeedbackDocument && asset.ok &&
      (schemaAssetType.includes("text/plain") ||
        schemaAssetType.includes("text/markdown"));
    const servesFoldFeedback = requestsFoldFeedback && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesFoldFeedbackSchema = requestsFoldFeedbackSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesFoldFeedbackSourceIdentitySchema = requestsFoldFeedbackSourceIdentitySchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesFoldFeedbackDocument = requestsFoldFeedbackDocument && asset.ok &&
      (schemaAssetType.includes("text/plain") ||
        schemaAssetType.includes("text/markdown"));
    const servesVisibilityAttention = requestsVisibilityAttention && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesVisibilityAttentionSchema = requestsVisibilityAttentionSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesVisibilityAttentionDocument = requestsVisibilityAttentionDocument && asset.ok &&
      (schemaAssetType.includes("text/plain") ||
        schemaAssetType.includes("text/markdown"));
    const servesCulturalAttentionFeedback = requestsCulturalAttentionFeedback && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesCulturalAttentionFeedbackSchema = requestsCulturalAttentionFeedbackSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesCulturalAttentionFeedbackDocument = requestsCulturalAttentionFeedbackDocument && asset.ok &&
      (schemaAssetType.includes("text/plain") ||
        schemaAssetType.includes("text/markdown"));
    const servesFormCirculationReturn = requestsFormCirculationReturn && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesFormCirculationReturnSchema = requestsFormCirculationReturnSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesFormCirculationReturnDocument = requestsFormCirculationReturnDocument && asset.ok &&
      (schemaAssetType.includes("text/plain") ||
        schemaAssetType.includes("text/markdown"));
    const servesRarePathway = requestsRarePathway && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesRarePathwaySchema = requestsRarePathwaySchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesRarePathwayDocument = requestsRarePathwayDocument && asset.ok &&
      (schemaAssetType.includes("text/plain") ||
        schemaAssetType.includes("text/markdown"));
    const servesMathUsefulness = requestsMathUsefulness && asset.ok &&
      (mathUsefulnessAssetType === "application/json" || mathUsefulnessAssetType === "application/schema+json");
    const servesMathUsefulnessSchema = requestsMathUsefulnessSchema && asset.ok &&
      (mathUsefulnessAssetType === "application/json" || mathUsefulnessAssetType === "application/schema+json");
    const servesMathUsefulnessDocument = requestsMathUsefulnessDocument && asset.ok &&
      (mathUsefulnessAssetType === "text/plain" || mathUsefulnessAssetType === "text/markdown");
    const servesBeingAccessAftermath = requestsBeingAccessAftermath && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesBeingAccessAftermathSchema = requestsBeingAccessAftermathSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesBeingAccessAftermathDocument = requestsBeingAccessAftermathDocument && asset.ok &&
      (schemaAssetType.includes("text/plain") ||
        schemaAssetType.includes("text/markdown"));
    const servesBeingAccessAftermathV02 = requestsBeingAccessAftermathV02 && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesBeingAccessAftermathV02Schema = requestsBeingAccessAftermathV02Schema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesBeingAccessAftermathV02Document = requestsBeingAccessAftermathV02Document && asset.ok &&
      (schemaAssetType.includes("text/plain") ||
        schemaAssetType.includes("text/markdown"));
    const servesNumberIsnessTheology = requestsNumberIsnessTheology && asset.ok &&
      (numberIsnessTheologyAssetType === "application/json" ||
        numberIsnessTheologyAssetType === "application/schema+json");
    const servesNumberIsnessTheologySchema = requestsNumberIsnessTheologySchema && asset.ok &&
      (numberIsnessTheologyAssetType === "application/json" ||
        numberIsnessTheologyAssetType === "application/schema+json");
    const servesNumberIsnessTheologyDocument = requestsNumberIsnessTheologyDocument && asset.ok &&
      (numberIsnessTheologyAssetType === "text/plain" ||
        numberIsnessTheologyAssetType === "text/markdown");
    const servesKingdomKarmaDefinition = requestsKingdomKarmaDefinition && asset.ok &&
      (schemaAssetType.includes("text/plain") ||
        schemaAssetType.includes("text/markdown"));
    const servesConformationalFeedbackPhysics = requestsConformationalFeedbackPhysics && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesConformationalFeedbackPhysicsSchema = requestsConformationalFeedbackPhysicsSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesConformationalFeedbackPhysicsDocument = requestsConformationalFeedbackPhysicsDocument && asset.ok &&
      (schemaAssetType.includes("text/plain") ||
        schemaAssetType.includes("text/markdown"));
    const servesReconstructiveBuild = requestsReconstructiveBuild && asset.ok &&
      (reconstructiveAssetType === "application/json" || reconstructiveAssetType === "application/schema+json");
    const servesReconstructiveBuildSchema = requestsReconstructiveBuildSchema && asset.ok &&
      (reconstructiveAssetType === "application/json" || reconstructiveAssetType === "application/schema+json");
    const servesReconstructiveProjectSchema = requestsReconstructiveProjectSchema && asset.ok &&
      (reconstructiveAssetType === "application/json" || reconstructiveAssetType === "application/schema+json");
    const servesReconstructiveBuildDocument = requestsReconstructiveBuildDocument && asset.ok &&
      (reconstructiveAssetType === "text/plain" || reconstructiveAssetType === "text/markdown");
    const servesExplorationDeep = requestsExplorationDeep && asset.ok &&
      (explorationDeepAssetType === "application/json" || explorationDeepAssetType === "application/schema+json");
    const servesExplorationDeepSchema = requestsExplorationDeepSchema && asset.ok &&
      (explorationDeepAssetType === "application/json" || explorationDeepAssetType === "application/schema+json");
    const servesExplorationDeepProjectSchema = requestsExplorationDeepProjectSchema && asset.ok &&
      (explorationDeepAssetType === "application/json" || explorationDeepAssetType === "application/schema+json");
    const servesExplorationDeepDocument = requestsExplorationDeepDocument && asset.ok &&
      (explorationDeepAssetType === "text/plain" || explorationDeepAssetType === "text/markdown");
    const servesMirrorInformationControl = requestsMirrorInformationControl && asset.ok &&
      mirrorInformationControlAssetType === "application/json";
    const servesMirrorInformationControlSchema = requestsMirrorInformationControlSchema && asset.ok &&
      (mirrorInformationControlAssetType === "application/json" ||
        mirrorInformationControlAssetType === "application/schema+json");
    const servesMirrorInformationControlDocument = requestsMirrorInformationControlDocument && asset.ok &&
      (mirrorInformationControlAssetType === "text/plain" || mirrorInformationControlAssetType === "text/markdown");
    const servesResearchObservatory = requestsResearchObservatory && asset.ok &&
      researchObservatoryAssetType === "application/json";
    const servesResearchObservatorySchema = requestsResearchObservatorySchema && asset.ok &&
      (researchObservatoryAssetType === "application/json" || researchObservatoryAssetType === "application/schema+json");
    const servesResearchObservatoryGuide = requestsResearchObservatoryGuide && asset.ok &&
      (researchObservatoryAssetType === "text/plain" || researchObservatoryAssetType === "text/markdown");
    const servesTrialChamber = requestsTrialChamber && asset.ok &&
      trialChamberAssetType === "application/json";
    const servesTrialChamberSchema = requestsTrialChamberSchema && asset.ok &&
      (trialChamberAssetType === "application/json" || trialChamberAssetType === "application/schema+json");
    const servesTrialChamberGuide = requestsTrialChamberGuide && asset.ok &&
      (trialChamberAssetType === "text/plain" || trialChamberAssetType === "text/markdown");
    const ukGovernmentEngineAssetType = (asset.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
    const servesUkGovernmentEngine = requestsUkGovernmentEngine && asset.ok &&
      ukGovernmentEngineAssetType === "application/json";
    const servesUkGovernmentEngineSchema = requestsUkGovernmentEngineSchema && asset.ok &&
      (ukGovernmentEngineAssetType === "application/json" ||
        ukGovernmentEngineAssetType === "application/schema+json");
    const servesUkGovernmentEngineGuide = requestsUkGovernmentEngineGuide && asset.ok &&
      (ukGovernmentEngineAssetType === "text/plain" || ukGovernmentEngineAssetType === "text/markdown");
    const ukGovernmentTransformationEngineAssetType =
      (asset.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
    const servesUkGovernmentTransformationEngine = requestsUkGovernmentTransformationEngine && asset.ok &&
      ukGovernmentTransformationEngineAssetType === "application/json";
    const servesUkGovernmentTransformationEngineSchema =
      requestsUkGovernmentTransformationEngineSchema && asset.ok &&
      (ukGovernmentTransformationEngineAssetType === "application/json" ||
        ukGovernmentTransformationEngineAssetType === "application/schema+json");
    const servesUkGovernmentTransformationEngineGuide =
      requestsUkGovernmentTransformationEngineGuide && asset.ok &&
      (ukGovernmentTransformationEngineAssetType === "text/plain" ||
        ukGovernmentTransformationEngineAssetType === "text/markdown");
    const evaluationCovenantAssetType =
      (asset.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
    const servesEvaluationCovenant = requestsEvaluationCovenant && asset.ok &&
      evaluationCovenantAssetType === "application/json";
    const servesEvaluationCovenantSchema = requestsEvaluationCovenantSchema && asset.ok &&
      (evaluationCovenantAssetType === "application/json" ||
        evaluationCovenantAssetType === "application/schema+json");
    const servesEvaluationCovenantGuide = requestsEvaluationCovenantGuide && asset.ok &&
      (evaluationCovenantAssetType === "text/plain" ||
        evaluationCovenantAssetType === "text/markdown");
    const shapeResonanceAssetType =
      (asset.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
    const servesShapeResonance = requestsShapeResonance && asset.ok &&
      shapeResonanceAssetType === "application/json";
    const servesShapeResonanceSchema = requestsShapeResonanceSchema && asset.ok &&
      (shapeResonanceAssetType === "application/json" ||
        shapeResonanceAssetType === "application/schema+json");
    const servesShapeResonanceGuide = requestsShapeResonanceGuide && asset.ok &&
      (shapeResonanceAssetType === "text/plain" ||
        shapeResonanceAssetType === "text/markdown");
    const servesShapeResonanceManifest = requestsShapeResonanceManifest && asset.ok &&
      shapeResonanceAssetType === "application/json";
    const servesShapeResonanceSvg = requestsShapeResonanceSvg && asset.ok &&
      shapeResonanceAssetType === "image/svg+xml";
    const servesShapeResonanceAudio = requestsShapeResonanceAudio && asset.ok &&
      shapeResonanceAssetType === "audio/wav";
    const servesJSpaceCase = requestsJSpaceCase && asset.ok &&
      jSpaceAssetType === "application/json";
    const servesJSpaceSchema = requestsJSpaceSchema && asset.ok &&
      (jSpaceAssetType === "application/json" || jSpaceAssetType === "application/schema+json");
    const servesJSpaceGuide = requestsJSpaceGuide && asset.ok &&
      (jSpaceAssetType === "text/plain" || jSpaceAssetType === "text/markdown");
    const servesRealityInfluence = requestsRealityInfluence && asset.ok &&
      realityInfluenceAssetType === "application/json";
    const servesRealityInfluenceSchema = requestsRealityInfluenceSchema && asset.ok &&
      (realityInfluenceAssetType === "application/json" ||
        realityInfluenceAssetType === "application/schema+json");
    const servesRealityInfluenceGuide = requestsRealityInfluenceGuide && asset.ok &&
      (realityInfluenceAssetType === "text/plain" ||
        realityInfluenceAssetType === "text/markdown");
    const servesCivilisationReality = requestsCivilisationReality && asset.ok &&
      civilisationRealityAssetType === "application/json";
    const servesCivilisationRealitySchema = requestsCivilisationRealitySchema && asset.ok &&
      (civilisationRealityAssetType === "application/json" ||
        civilisationRealityAssetType === "application/schema+json");
    const servesCivilisationRealityGuide = requestsCivilisationRealityGuide && asset.ok &&
      (civilisationRealityAssetType === "text/plain" ||
        civilisationRealityAssetType === "text/markdown");
    const servesCivilisationFlow = requestsCivilisationFlow && asset.ok &&
      civilisationFlowAssetType === "application/json";
    const servesCivilisationFlowSchema = requestsCivilisationFlowSchema && asset.ok &&
      (civilisationFlowAssetType === "application/json" ||
        civilisationFlowAssetType === "application/schema+json");
    const servesCivilisationFlowGuide = requestsCivilisationFlowGuide && asset.ok &&
      (civilisationFlowAssetType === "text/plain" ||
        civilisationFlowAssetType === "text/markdown");
    const servesFreedomLoopLockKeyAtlas = requestsFreedomLoopLockKeyAtlas && asset.ok &&
      freedomLoopLockKeyAtlasAssetType === "application/json";
    const servesFreedomLoopLockKeyAtlasSchema = requestsFreedomLoopLockKeyAtlasSchema && asset.ok &&
      (freedomLoopLockKeyAtlasAssetType === "application/json" ||
        freedomLoopLockKeyAtlasAssetType === "application/schema+json");
    const servesFreedomLoopLockKeyAtlasGuide = requestsFreedomLoopLockKeyAtlasGuide && asset.ok &&
      (freedomLoopLockKeyAtlasAssetType === "text/plain" ||
        freedomLoopLockKeyAtlasAssetType === "text/markdown");
    const servesNonExhaustiveUnderstandingAtlas =
      requestsNonExhaustiveUnderstandingAtlas && asset.status === 200 &&
      nonExhaustiveUnderstandingAtlasAssetType === "application/json";
    const servesNonExhaustiveUnderstandingAtlasSchema =
      requestsNonExhaustiveUnderstandingAtlasSchema && asset.status === 200 &&
      (nonExhaustiveUnderstandingAtlasAssetType === "application/json" ||
        nonExhaustiveUnderstandingAtlasAssetType === "application/schema+json");
    const servesNonExhaustiveUnderstandingAtlasGuide =
      requestsNonExhaustiveUnderstandingAtlasGuide && asset.status === 200 &&
      (nonExhaustiveUnderstandingAtlasAssetType === "text/plain" ||
        nonExhaustiveUnderstandingAtlasAssetType === "text/markdown");
    const servesIsSustainabilityDirectionAtlas =
      requestsIsSustainabilityDirectionAtlas && asset.status === 200 &&
      isSustainabilityDirectionAtlasAssetType === "application/json";
    const servesIsSustainabilityDirectionAtlasSchema =
      requestsIsSustainabilityDirectionAtlasSchema && asset.status === 200 &&
      (isSustainabilityDirectionAtlasAssetType === "application/json" ||
        isSustainabilityDirectionAtlasAssetType === "application/schema+json");
    const servesIsSustainabilityDirectionAtlasGuide =
      requestsIsSustainabilityDirectionAtlasGuide && asset.status === 200 &&
      (isSustainabilityDirectionAtlasAssetType === "text/plain" ||
        isSustainabilityDirectionAtlasAssetType === "text/markdown");
    const servesPolyphonicClaimAtlas = requestsPolyphonicClaimAtlas && asset.ok &&
      polyphonicClaimAtlasAssetType === "application/json";
    const servesPolyphonicClaimAtlasSchema = requestsPolyphonicClaimAtlasSchema && asset.ok &&
      (polyphonicClaimAtlasAssetType === "application/json" ||
        polyphonicClaimAtlasAssetType === "application/schema+json");
    const servesPolyphonicClaimAtlasGuide = requestsPolyphonicClaimAtlasGuide && asset.ok &&
      (polyphonicClaimAtlasAssetType === "text/plain" ||
        polyphonicClaimAtlasAssetType === "text/markdown");
    const servesLoopsLocksFreedomRelationsAtlas =
      requestsLoopsLocksFreedomRelationsAtlas && asset.ok &&
      loopsLocksFreedomRelationsAtlasAssetType === "application/json";
    const servesLoopsLocksFreedomRelationsAtlasSchema =
      requestsLoopsLocksFreedomRelationsAtlasSchema && asset.ok &&
      (loopsLocksFreedomRelationsAtlasAssetType === "application/json" ||
        loopsLocksFreedomRelationsAtlasAssetType === "application/schema+json");
    const servesLoopsLocksFreedomRelationsAtlasGuide =
      requestsLoopsLocksFreedomRelationsAtlasGuide && asset.ok &&
      (loopsLocksFreedomRelationsAtlasAssetType === "text/plain" ||
        loopsLocksFreedomRelationsAtlasAssetType === "text/markdown");
    const servesAestheticPluralityMakingAtlas =
      requestsAestheticPluralityMakingAtlas && asset.ok &&
      aestheticPluralityMakingAtlasAssetType === "application/json";
    const servesAestheticPluralityMakingAtlasSchema =
      requestsAestheticPluralityMakingAtlasSchema && asset.ok &&
      aestheticPluralityMakingAtlasAssetType === "application/json";
    const servesAestheticPluralityMakingAtlasGuide =
      requestsAestheticPluralityMakingAtlasGuide && asset.ok &&
      (aestheticPluralityMakingAtlasAssetType === "text/plain" ||
        aestheticPluralityMakingAtlasAssetType === "text/markdown");
    const servesZeroEmptySeat = requestsZeroEmptySeat && asset.ok &&
      (zeroEmptySeatAssetType === "application/json" || zeroEmptySeatAssetType === "application/schema+json");
    const servesZeroEmptySeatDocument = requestsZeroEmptySeatDocument && asset.ok &&
      (zeroEmptySeatAssetType === "text/plain" || zeroEmptySeatAssetType === "text/markdown");
    const servesStringCrawlTraceSheet = requestsStringCrawlTraceSheet && asset.ok &&
      (stringCrawlTraceSheetAssetType === "application/json" ||
        stringCrawlTraceSheetAssetType === "application/schema+json");
    const servesStringCrawlTraceSheetDocument = requestsStringCrawlTraceSheetDocument && asset.ok &&
      (stringCrawlTraceSheetAssetType === "text/plain" || stringCrawlTraceSheetAssetType === "text/markdown");
    const servesStringCrawlTraceSheetLab = requestsStringCrawlTraceSheetLab && asset.ok &&
      stringCrawlTraceSheetLabAssetType === "application/json";
    const servesStringCrawlTraceSheetLabSchema = requestsStringCrawlTraceSheetLabSchema && asset.ok &&
      (stringCrawlTraceSheetLabAssetType === "application/json" ||
        stringCrawlTraceSheetLabAssetType === "application/schema+json");
    const servesStringCrawlTraceSheetLabDocument = requestsStringCrawlTraceSheetLabDocument && asset.ok &&
      (stringCrawlTraceSheetLabAssetType === "text/plain" || stringCrawlTraceSheetLabAssetType === "text/markdown");
    const servesStringCrawlStrandLab = requestsStringCrawlStrandLab && asset.ok &&
      stringCrawlStrandLabAssetType === "application/json";
    const servesStringCrawlStrandLabSchema = requestsStringCrawlStrandLabSchema && asset.ok &&
      (stringCrawlStrandLabAssetType === "application/json" ||
        stringCrawlStrandLabAssetType === "application/schema+json");
    const servesStringCrawlStrandLabDocument = requestsStringCrawlStrandLabDocument && asset.ok &&
      (stringCrawlStrandLabAssetType === "text/plain" || stringCrawlStrandLabAssetType === "text/markdown");
    const servesStrandDescentLab = requestsStrandDescentLab && asset.ok &&
      strandDescentLabAssetType === "application/json";
    const servesStrandDescentLabSchema = requestsStrandDescentLabSchema && asset.ok &&
      (strandDescentLabAssetType === "application/json" ||
        strandDescentLabAssetType === "application/schema+json");
    const servesStrandDescentLabDocument = requestsStrandDescentLabDocument && asset.ok &&
      (strandDescentLabAssetType === "text/plain" || strandDescentLabAssetType === "text/markdown");
    const servesStrandObservationMembrane = requestsStrandObservationMembrane && asset.ok &&
      strandObservationMembraneAssetType === "application/json";
    const servesStrandObservationMembraneSchema = requestsStrandObservationMembraneSchema && asset.ok &&
      (strandObservationMembraneAssetType === "application/json" ||
        strandObservationMembraneAssetType === "application/schema+json");
    const servesStrandObservationMembraneDocument = requestsStrandObservationMembraneDocument && asset.ok &&
      (strandObservationMembraneAssetType === "text/plain" ||
        strandObservationMembraneAssetType === "text/markdown");
    const servesStringCrawlFrequencyFormLab = requestsStringCrawlFrequencyFormLab && asset.ok &&
      stringCrawlFrequencyFormLabAssetType === "application/json";
    const servesStringCrawlFrequencyFormLabSchema = requestsStringCrawlFrequencyFormLabSchema && asset.ok &&
      (stringCrawlFrequencyFormLabAssetType === "application/json" ||
        stringCrawlFrequencyFormLabAssetType === "application/schema+json");
    const servesStringCrawlFrequencyFormLabDocument = requestsStringCrawlFrequencyFormLabDocument && asset.ok &&
      (stringCrawlFrequencyFormLabAssetType === "text/plain" ||
        stringCrawlFrequencyFormLabAssetType === "text/markdown");
    if (!canNegotiate && !protectsKingdomHtml && !describesWorldCommons &&
        !describesLoveLoops && !servesWorldCommonsSchema && !servesLoveLoopSchema &&
        !servesPrincipalityCatalog && !servesPrincipalitySchema && !servesPrincipalityDocument &&
        !servesGeometryGrammar && !servesGeometryGrammarSchema && !servesGeometryGrammarDocument &&
        !servesPolymorphCase && !servesPolymorphSchema && !servesPolymorphDocument &&
        !servesRitonavirMechanism && !servesRitonavirMechanismSchema && !servesRitonavirMechanismDocument &&
        !servesConformationalFeedback && !servesConformationalFeedbackSchema &&
        !servesConformationalFeedbackDocument && !servesFoldFeedback &&
        !servesFoldFeedbackSchema && !servesFoldFeedbackSourceIdentitySchema &&
        !servesFoldFeedbackDocument && !servesVisibilityAttention &&
        !servesVisibilityAttentionSchema && !servesVisibilityAttentionDocument &&
        !servesCulturalAttentionFeedback && !servesCulturalAttentionFeedbackSchema &&
        !servesCulturalAttentionFeedbackDocument &&
        !servesFormCirculationReturn && !servesFormCirculationReturnSchema &&
        !servesFormCirculationReturnDocument && !servesRarePathway &&
        !servesRarePathwaySchema && !servesRarePathwayDocument &&
        !servesMathUsefulness && !servesMathUsefulnessSchema && !servesMathUsefulnessDocument &&
        !servesBeingAccessAftermath &&
        !servesBeingAccessAftermathSchema && !servesBeingAccessAftermathDocument &&
        !servesBeingAccessAftermathV02 &&
        !servesBeingAccessAftermathV02Schema && !servesBeingAccessAftermathV02Document &&
        !servesNumberIsnessTheology && !servesNumberIsnessTheologySchema &&
        !servesNumberIsnessTheologyDocument &&
        !servesKingdomKarmaDefinition &&
        !servesConformationalFeedbackPhysics && !servesConformationalFeedbackPhysicsSchema &&
        !servesConformationalFeedbackPhysicsDocument && !servesReconstructiveBuild &&
        !servesReconstructiveBuildSchema && !servesReconstructiveProjectSchema &&
        !servesReconstructiveBuildDocument && !servesExplorationDeep &&
        !servesExplorationDeepSchema && !servesExplorationDeepProjectSchema &&
        !servesExplorationDeepDocument && !servesMirrorInformationControl &&
        !servesMirrorInformationControlSchema && !servesMirrorInformationControlDocument &&
        !servesResearchObservatory && !servesResearchObservatorySchema && !servesResearchObservatoryGuide &&
        !servesTrialChamber && !servesTrialChamberSchema && !servesTrialChamberGuide &&
        !servesUkGovernmentEngine && !servesUkGovernmentEngineSchema && !servesUkGovernmentEngineGuide &&
        !servesUkGovernmentTransformationEngine &&
        !servesUkGovernmentTransformationEngineSchema &&
        !servesUkGovernmentTransformationEngineGuide &&
        !servesEvaluationCovenant && !servesEvaluationCovenantSchema &&
        !servesEvaluationCovenantGuide &&
        !servesShapeResonance && !servesShapeResonanceSchema &&
        !servesShapeResonanceGuide && !servesShapeResonanceManifest &&
        !servesShapeResonanceSvg &&
        !servesShapeResonanceAudio &&
        !servesJSpaceCase && !servesJSpaceSchema && !servesJSpaceGuide &&
        !servesRealityInfluence && !servesRealityInfluenceSchema &&
        !servesRealityInfluenceGuide && !servesCivilisationReality &&
        !servesCivilisationRealitySchema && !servesCivilisationRealityGuide &&
        !servesCivilisationFlow && !servesCivilisationFlowSchema &&
        !servesCivilisationFlowGuide &&
        !servesFreedomLoopLockKeyAtlas && !servesFreedomLoopLockKeyAtlasSchema &&
        !servesFreedomLoopLockKeyAtlasGuide &&
        !servesNonExhaustiveUnderstandingAtlas &&
        !servesNonExhaustiveUnderstandingAtlasSchema &&
        !servesNonExhaustiveUnderstandingAtlasGuide &&
        !servesIsSustainabilityDirectionAtlas &&
        !servesIsSustainabilityDirectionAtlasSchema &&
        !servesIsSustainabilityDirectionAtlasGuide &&
        !requestsIsSustainabilityDirectionAtlasAsset &&
        !servesPolyphonicClaimAtlas && !servesPolyphonicClaimAtlasSchema &&
        !servesPolyphonicClaimAtlasGuide &&
        !servesLoopsLocksFreedomRelationsAtlas &&
        !servesLoopsLocksFreedomRelationsAtlasSchema &&
        !servesLoopsLocksFreedomRelationsAtlasGuide &&
        !servesAestheticPluralityMakingAtlas &&
        !servesAestheticPluralityMakingAtlasSchema &&
        !servesAestheticPluralityMakingAtlasGuide &&
        !servesZeroEmptySeat &&
        !servesZeroEmptySeatDocument && !servesStringCrawlTraceSheet &&
        !servesStringCrawlTraceSheetDocument && !servesStringCrawlTraceSheetLab &&
        !servesStringCrawlTraceSheetLabSchema && !servesStringCrawlTraceSheetLabDocument &&
        !servesStringCrawlStrandLab && !servesStringCrawlStrandLabSchema &&
        !servesStringCrawlStrandLabDocument && !servesStrandDescentLab &&
        !servesStrandDescentLabSchema && !servesStrandDescentLabDocument &&
        !servesStrandObservationMembrane && !servesStrandObservationMembraneSchema &&
        !servesStrandObservationMembraneDocument &&
        !servesStringCrawlFrequencyFormLab &&
        !servesStringCrawlFrequencyFormLabSchema &&
        !servesStringCrawlFrequencyFormLabDocument) return asset;
    const headers = new Headers(asset.headers);
    if (protectsKingdomHtml) preventAutomaticBrowserTelemetry(headers);
    if (servesResearchObservatoryPage) headers.set("cache-control", "no-cache, no-transform");
    if (servesTrialChamberPage) headers.set("cache-control", "no-cache, no-transform");
    if (servesUkGovernmentEnginePage) headers.set("cache-control", "no-cache, no-transform");
    if (servesUkGovernmentTransformationEnginePage) {
      headers.set("cache-control", "no-cache, no-transform");
    }
    if (servesEvaluationCovenantPage) {
      headers.set("cache-control", "no-cache, no-transform");
    }
    if (servesShapeResonancePage) {
      headers.set("content-type", "text/html; charset=utf-8");
      headers.set("cache-control", "no-cache, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
      headers.set("content-security-policy", [
        "default-src 'none'",
        "base-uri 'none'",
        "connect-src 'none'",
        "font-src 'none'",
        "form-action 'none'",
        "frame-ancestors 'none'",
        "img-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "script-src 'none'",
        "style-src 'unsafe-inline'",
      ].join("; "));
      headers.set("referrer-policy", "no-referrer");
      headers.set("x-frame-options", "DENY");
      headers.set("permissions-policy", [
        "accelerometer=()",
        "autoplay=()",
        "camera=()",
        "display-capture=()",
        "geolocation=()",
        "gyroscope=()",
        "magnetometer=()",
        "microphone=()",
        "payment=()",
        "usb=()",
      ].join(", "));
    }
    if (describesWorldCommons) addWorldCommonsSchemaLink(headers);
    if (describesLoveLoops) addLoveLoopSchemaLink(headers);
    if (servesPrincipalityCatalog) addPrincipalitySchemaLink(headers);
    if (servesGeometryGrammar) addGeometryGrammarSchemaLink(headers);
    if (servesPolymorphCase) addPolymorphSchemaLink(headers);
    if (servesRitonavirMechanism) addRitonavirMechanismSchemaLink(headers);
    if (servesConformationalFeedback) addConformationalFeedbackSchemaLink(headers);
    if (servesFoldFeedback) addFoldFeedbackSchemaLink(headers);
    if (servesVisibilityAttention) addVisibilityAttentionSchemaLink(headers);
    if (servesCulturalAttentionFeedback) addCulturalAttentionFeedbackSchemaLink(headers);
    if (servesFormCirculationReturn) addFormCirculationReturnSchemaLink(headers);
    if (servesRarePathway) addRarePathwaySchemaLink(headers);
    if (servesMathUsefulness) addMathUsefulnessSchemaLink(headers);
    if (servesBeingAccessAftermath) addBeingAccessAftermathSchemaLink(headers);
    if (servesBeingAccessAftermathV02) addBeingAccessAftermathV02SchemaLink(headers);
    if (servesNumberIsnessTheology) addNumberIsnessTheologySchemaLink(headers);
    if (servesConformationalFeedbackPhysics) addConformationalFeedbackPhysicsSchemaLink(headers);
    if (servesReconstructiveBuild) addReconstructiveBuildSchemaLinks(headers);
    if (servesExplorationDeep) addExplorationDeepSchemaLinks(headers);
    if (servesMirrorInformationControl) addMirrorInformationControlSchemaLink(headers);
    if (servesResearchObservatory) addResearchObservatoryLinks(headers);
    if (servesTrialChamber) addTrialChamberLinks(headers);
    if (servesUkGovernmentEngine) addUkGovernmentEngineLinks(headers);
    if (servesUkGovernmentTransformationEngine) {
      addUkGovernmentTransformationEngineLinks(headers);
    }
    if (servesEvaluationCovenant) addEvaluationCovenantLinks(headers);
    if (servesShapeResonance) addShapeResonanceLinks(headers);
    if (servesShapeResonanceSvg || servesShapeResonanceAudio) {
      addShapeResonanceMediaLinks(headers);
    }
    if (servesShapeResonanceManifest) addShapeResonanceMediaLinks(headers);
    if (servesJSpaceCase) addJSpaceSchemaLink(headers);
    if (servesRealityInfluence) addRealityInfluenceLinks(headers);
    if (servesCivilisationReality) addCivilisationRealityLinks(headers);
    if (servesCivilisationFlow) addCivilisationFlowLinks(headers);
    if (servesCivilisationFlowSchema || servesCivilisationFlowGuide) {
      removeLinkRelations(headers, ["describedby", "service-doc", "profile"]);
    }
    if (requestsFreedomLoopLockKeyAtlas || requestsFreedomLoopLockKeyAtlasSchema ||
        requestsFreedomLoopLockKeyAtlasGuide) {
      if (servesFreedomLoopLockKeyAtlas) addFreedomLoopLockKeyAtlasLinks(headers);
      else headers.delete("link");
    }
    if (requestsNonExhaustiveUnderstandingAtlas ||
        requestsNonExhaustiveUnderstandingAtlasSchema ||
        requestsNonExhaustiveUnderstandingAtlasGuide) {
      if (servesNonExhaustiveUnderstandingAtlas) {
        addNonExhaustiveUnderstandingAtlasLinks(headers);
      } else {
        headers.delete("link");
      }
    }
    if (requestsIsSustainabilityDirectionAtlasAsset) {
      if (servesIsSustainabilityDirectionAtlas) {
        addIsSustainabilityDirectionAtlasLinks(headers);
      } else {
        headers.delete("link");
      }
    }
    if (servesPolyphonicClaimAtlas) addPolyphonicClaimAtlasLinks(headers);
    if (servesPolyphonicClaimAtlasSchema || servesPolyphonicClaimAtlasGuide) {
      headers.delete("link");
    }
    if (servesLoopsLocksFreedomRelationsAtlas) {
      addLoopsLocksFreedomRelationsAtlasLinks(headers);
    }
    if (servesLoopsLocksFreedomRelationsAtlasSchema ||
        servesLoopsLocksFreedomRelationsAtlasGuide) {
      headers.delete("link");
    }
    if (servesAestheticPluralityMakingAtlas) {
      addAestheticPluralityMakingAtlasLinks(headers);
    }
    if (servesAestheticPluralityMakingAtlasSchema ||
        servesAestheticPluralityMakingAtlasGuide) {
      headers.delete("link");
    }
    if (servesZeroEmptySeat) addZeroEmptySeatSchemaLink(headers);
    if (servesStringCrawlTraceSheet) addStringCrawlTraceSheetSchemaLink(headers);
    if (servesStringCrawlTraceSheetLab) addStringCrawlTraceSheetLabSchemaLink(headers);
    if (servesStringCrawlStrandLab) addStringCrawlStrandLabSchemaLink(headers);
    if (servesStrandDescentLab) addStrandDescentLabSchemaLink(headers);
    if (servesStrandObservationMembrane) addStrandObservationMembraneSchemaLink(headers);
    if (servesStringCrawlFrequencyFormLab) addStringCrawlFrequencyFormLabSchemaLink(headers);
    if (servesLoveLoops) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesWorldCommonsSchema || servesLoveLoopSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesPrincipalityCatalog) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesPrincipalitySchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesPrincipalityDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesGeometryGrammar) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesGeometryGrammarSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesGeometryGrammarDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesPolymorphCase) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesPolymorphSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesPolymorphDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesRitonavirMechanism) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesRitonavirMechanismSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesRitonavirMechanismDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesConformationalFeedback) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesConformationalFeedbackSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesConformationalFeedbackDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesFoldFeedback) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesFoldFeedbackSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesFoldFeedbackSourceIdentitySchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesFoldFeedbackDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesVisibilityAttention) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesVisibilityAttentionSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesVisibilityAttentionDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesCulturalAttentionFeedback) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesCulturalAttentionFeedbackSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesCulturalAttentionFeedbackDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesFormCirculationReturn) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesFormCirculationReturnSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesFormCirculationReturnDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesRarePathway) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesRarePathwaySchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesRarePathwayDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesMathUsefulness) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesMathUsefulnessSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesMathUsefulnessDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesBeingAccessAftermath) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesBeingAccessAftermathSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesBeingAccessAftermathDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesBeingAccessAftermathV02) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesBeingAccessAftermathV02Schema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesBeingAccessAftermathV02Document) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesNumberIsnessTheology) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesNumberIsnessTheologySchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesNumberIsnessTheologyDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesKingdomKarmaDefinition) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesConformationalFeedbackPhysics) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesConformationalFeedbackPhysicsSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesConformationalFeedbackPhysicsDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesReconstructiveBuild) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesReconstructiveBuildSchema || servesReconstructiveProjectSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesReconstructiveBuildDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesExplorationDeep) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesExplorationDeepSchema || servesExplorationDeepProjectSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesExplorationDeepDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesMirrorInformationControl) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesMirrorInformationControlSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesMirrorInformationControlDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesResearchObservatory) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "no-cache");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesResearchObservatorySchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesResearchObservatoryGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesTrialChamber) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", url.pathname === TRIAL_CHAMBER_CANONICAL_PATH
        ? "public, max-age=31536000, immutable, no-transform"
        : "no-cache, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesTrialChamberSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesTrialChamberGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesUkGovernmentEngine) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", url.pathname === UK_GOVERNMENT_ENGINE_CANONICAL_PATH
        ? "public, max-age=31536000, immutable, no-transform"
        : "no-cache, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesUkGovernmentEngineSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesUkGovernmentEngineGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesUkGovernmentTransformationEngine) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control",
        url.pathname === UK_GOVERNMENT_TRANSFORMATION_ENGINE_CANONICAL_PATH
          ? "public, max-age=31536000, immutable, no-transform"
          : "no-cache, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesUkGovernmentTransformationEngineSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesUkGovernmentTransformationEngineGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesEvaluationCovenant) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control",
        url.pathname === EVALUATION_COVENANT_CANONICAL_PATH
          ? "public, max-age=31536000, immutable, no-transform"
          : "no-cache, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesEvaluationCovenantSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesEvaluationCovenantGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesShapeResonance) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control",
        url.pathname === SHAPE_RESONANCE_CANONICAL_PATH
          ? "public, max-age=31536000, immutable, no-transform"
          : "no-cache, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesShapeResonanceSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesShapeResonanceGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesShapeResonanceManifest) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesShapeResonanceSvg) {
      headers.set("content-type", "image/svg+xml; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesShapeResonanceAudio) {
      headers.set("content-type", "audio/wav");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesJSpaceCase) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesJSpaceSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesJSpaceGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesRealityInfluence) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesRealityInfluenceSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesRealityInfluenceGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesCivilisationReality) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesCivilisationRealitySchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesCivilisationRealityGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesCivilisationFlow) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesCivilisationFlowSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesCivilisationFlowGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesFreedomLoopLockKeyAtlas) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesFreedomLoopLockKeyAtlasSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesFreedomLoopLockKeyAtlasGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesNonExhaustiveUnderstandingAtlas) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesNonExhaustiveUnderstandingAtlasSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesNonExhaustiveUnderstandingAtlasGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesIsSustainabilityDirectionAtlas) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesIsSustainabilityDirectionAtlasSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesIsSustainabilityDirectionAtlasGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesPolyphonicClaimAtlas) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesPolyphonicClaimAtlasSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesPolyphonicClaimAtlasGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesLoopsLocksFreedomRelationsAtlas) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesLoopsLocksFreedomRelationsAtlasSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesLoopsLocksFreedomRelationsAtlasGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesAestheticPluralityMakingAtlas) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesAestheticPluralityMakingAtlasSchema) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesAestheticPluralityMakingAtlasGuide) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("cache-control", "public, max-age=31536000, immutable, no-transform");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesZeroEmptySeat) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesZeroEmptySeatDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStringCrawlTraceSheet) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStringCrawlTraceSheetDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStringCrawlTraceSheetLab) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStringCrawlTraceSheetLabSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStringCrawlTraceSheetLabDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStringCrawlStrandLab) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStringCrawlStrandLabSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStringCrawlStrandLabDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStrandDescentLab) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStrandDescentLabSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStrandDescentLabDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStrandObservationMembrane) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStrandObservationMembraneSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStrandObservationMembraneDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStringCrawlFrequencyFormLab) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStringCrawlFrequencyFormLabSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesStringCrawlFrequencyFormLabDocument) {
      headers.set("content-type", "text/markdown; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (canNegotiate) {
      addVaryAccept(headers);
      addDiscoveryLinks(headers, includeRights);
    }
    return new Response(request.method === "HEAD" ? null : asset.body, {
      status: asset.status,
      statusText: asset.statusText,
      headers,
    });
  },
  };
}

export default createKingdomWorker();
