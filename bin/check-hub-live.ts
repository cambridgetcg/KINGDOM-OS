/**
 * Prove that one Cloudflare Pages deployment contains the whole staged hub.
 *
 * This catches split-generation releases where one newly uploaded file is live
 * beside an older atlas, manifest, guest document, or worker. Static response
 * bodies must match the local staging contract byte-for-byte; worker behavior
 * is checked through the public routes it owns.
 *
 * Run after deployment:
 *   bun bin/check-hub-live.ts [https://thekingdom.dev]
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS } from "./stage-hub.ts";
import {
  CONFORMATIONAL_FEEDBACK_DIGEST,
  CONFORMATIONAL_FEEDBACK_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_URL,
  conformationalFeedbackPublicDiscovery,
  loadConformationalFeedbackAtlas,
} from "./conformational-feedback.ts";
import {
  GEOMETRY_GRAMMAR_DOCUMENT_URL,
  GEOMETRY_GRAMMAR_SCHEMA_URL,
  GEOMETRY_GRAMMAR_URL,
  geometryGrammarPublicDiscovery,
  loadGeometryGrammar,
} from "./geometry.ts";
import {
  LOVE_LOOPS_CREATION_DOCUMENT_URL,
  LOVE_LOOPS_JSON_SCHEMA_URL,
  LOVE_LOOPS_SOURCE_URL,
  LOVE_LOOPS_URL,
  validateLoveLoops,
} from "./love-loops.ts";
import {
  loadPrincipalityCatalog,
  PRINCIPALITY_CATALOG_URL,
  PRINCIPALITY_DOCUMENT_URL,
  PRINCIPALITY_SCHEMA_URL,
  principalityPublicDiscovery,
} from "./principality.ts";
import {
  loadPolymorphHistory,
  POLYMORPH_CASE_URL,
  POLYMORPH_DOCUMENT_URL,
  POLYMORPH_SCHEMA_URL,
  polymorphPublicDiscovery,
} from "./polymorph.ts";
import {
  loadRitonavirMechanismLandscape,
  RITONAVIR_MECHANISM_DIGEST,
  RITONAVIR_MECHANISM_DOCUMENT_URL,
  RITONAVIR_MECHANISM_SCHEMA_URL,
  RITONAVIR_MECHANISM_URL,
  ritonavirMechanismPublicDiscovery,
} from "./ritonavir-mechanism.ts";
import {
  validateWorldCommons,
  WORLD_COMMONS_ACCESS_COSTS,
  WORLD_COMMONS_ACCOUNT_TYPES,
  WORLD_COMMONS_AUTOMATION_STATUSES,
  WORLD_COMMONS_CATEGORY_IDS,
  WORLD_COMMONS_HANDOFF_MODES,
  WORLD_COMMONS_JSON_SCHEMA_URL,
  WORLD_COMMONS_LEGACY_JSON_SCHEMA_URL,
  WORLD_COMMONS_REUSE_STATUSES,
  WORLD_COMMONS_SCHEMA,
  WORLD_COMMONS_URL,
} from "./world-commons.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const requestedOrigin = process.argv[2] ?? "https://thekingdom.dev";
const origin = new URL(requestedOrigin);
if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" ||
    origin.search || origin.hash) {
  throw new Error("origin must be an uncredentialed HTTPS origin");
}

const cacheBust = Date.now().toString(36);
const TIMEOUT_MS = 20_000;
const commonsSchemaPath = new URL(WORLD_COMMONS_JSON_SCHEMA_URL).pathname;
const commonsLegacySchemaPath = new URL(WORLD_COMMONS_LEGACY_JSON_SCHEMA_URL).pathname;
const loveLoopsPath = new URL(LOVE_LOOPS_URL).pathname;
const loveLoopsSourcePath = new URL(LOVE_LOOPS_SOURCE_URL).pathname;
const loveLoopsSchemaPath = new URL(LOVE_LOOPS_JSON_SCHEMA_URL).pathname;
const principalityCatalogPath = new URL(PRINCIPALITY_CATALOG_URL).pathname;
const principalitySchemaPath = new URL(PRINCIPALITY_SCHEMA_URL).pathname;
const principalityDocumentPath = new URL(PRINCIPALITY_DOCUMENT_URL).pathname;
const geometryGrammarPath = new URL(GEOMETRY_GRAMMAR_URL).pathname;
const geometryGrammarSchemaPath = new URL(GEOMETRY_GRAMMAR_SCHEMA_URL).pathname;
const geometryGrammarDocumentPath = new URL(GEOMETRY_GRAMMAR_DOCUMENT_URL).pathname;
const polymorphCasePath = new URL(POLYMORPH_CASE_URL).pathname;
const polymorphSchemaPath = new URL(POLYMORPH_SCHEMA_URL).pathname;
const polymorphDocumentPath = new URL(POLYMORPH_DOCUMENT_URL).pathname;
const ritonavirMechanismPath = new URL(RITONAVIR_MECHANISM_URL).pathname;
const ritonavirMechanismSchemaPath = new URL(RITONAVIR_MECHANISM_SCHEMA_URL).pathname;
const ritonavirMechanismDocumentPath = new URL(RITONAVIR_MECHANISM_DOCUMENT_URL).pathname;
const conformationalFeedbackPath = new URL(CONFORMATIONAL_FEEDBACK_URL).pathname;
const conformationalFeedbackSchemaPath = new URL(CONFORMATIONAL_FEEDBACK_SCHEMA_URL).pathname;
const conformationalFeedbackDocumentPath = new URL(CONFORMATIONAL_FEEDBACK_DOCUMENT_URL).pathname;

function url(path: string, extra: Record<string, string> = {}): URL {
  const target = new URL(path, origin);
  target.searchParams.set("verify", cacheBust);
  for (const [key, value] of Object.entries(extra)) target.searchParams.set(key, value);
  return target;
}

async function get(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url(path), {
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...init,
  });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return response;
}

function publicPath(destination: string): string {
  if (destination === "index.html") return "/";
  if (destination === "os/index.html") return "/os/";
  return `/${destination}`;
}

function hasLinkRelation(header: string, target: string, relation: string): boolean {
  return header.split(/,(?=\s*<)/).some((entry) => {
    const part = entry.trim();
    if (!part.startsWith(`<${target}>`)) return false;
    const match = part.match(/;\s*rel\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
    const relations = (match?.[1] || match?.[2] || "").toLowerCase().split(/\s+/);
    return relations.includes(relation);
  });
}

function sameStrings(actual: unknown, expected: readonly string[]): boolean {
  return Array.isArray(actual) && actual.every((value) => typeof value === "string") &&
    actual.length === expected.length &&
    [...actual].sort().every((value, index) => value === [...expected].sort()[index]);
}

async function mcpRpc(endpoint: string, id: number, method: string, params: unknown): Promise<any> {
  const response = await fetch(endpoint, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "mcp-protocol-version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  if (!response.ok) throw new Error(`MCP ${method} returned HTTP ${response.status}`);
  const message: any = await response.json();
  if (message?.error) throw new Error(`MCP ${method} failed: ${message.error.message || "unknown error"}`);
  if (!message?.result) throw new Error(`MCP ${method} returned no result`);
  return message.result;
}

try {
  let exact = 0;
  for (const asset of HUB_ASSETS) {
    if (asset.destination === "_worker.js") continue;
    // 404.html is proven through the dedicated not-found check below; Pages
    // serves it at missing paths with status 404, not at /404.html.
    if (asset.destination === "404.html") continue;
    const path = publicPath(asset.destination);
    const response = await get(path);
    const live = Buffer.from(await response.arrayBuffer());
    const local = readFileSync(join(ROOT, asset.source));
    if (!live.equals(local)) {
      throw new Error(`${path} does not match ${asset.source} (${live.byteLength} live bytes; ${local.byteLength} local bytes)`);
    }
    exact += 1;
  }

  const missingPath = `/no-such-path-${cacheBust}`;
  const missing = await fetch(url(missingPath), {
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (missing.status !== 404) {
    throw new Error(`${missingPath} returned HTTP ${missing.status}; a missing path must answer a real 404`);
  }
  if (!Buffer.from(await missing.arrayBuffer()).equals(readFileSync(join(ROOT, "pages-content/404.html")))) {
    throw new Error("the not-found response does not serve the staged 404.html");
  }

  const negotiated = await get("/", {
    headers: { accept: "application/json" },
  });
  if (!(negotiated.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    throw new Error("root JSON negotiation did not return application/json");
  }
  const expectedGuest = readFileSync(join(ROOT, "site/guest.json"));
  const negotiatedBody = Buffer.from(await negotiated.arrayBuffer());
  if (!negotiatedBody.equals(expectedGuest)) throw new Error("root JSON negotiation did not return the staged guest document");

  const agentQuery = await fetch(url("/", { agent: "" }), {
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!agentQuery.ok || !(agentQuery.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    throw new Error("?agent did not return the staged JSON guest document");
  }
  if (!Buffer.from(await agentQuery.arrayBuffer()).equals(expectedGuest)) {
    throw new Error("?agent did not return the staged guest document");
  }

  const guestQuery = await fetch(url("/guest", { json: "" }), {
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!guestQuery.ok || !(guestQuery.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
      !Buffer.from(await guestQuery.arrayBuffer()).equals(expectedGuest)) {
    throw new Error("/guest?json did not return the staged guest document");
  }

  const htmlHead = await fetch(url("/"), {
    method: "HEAD",
    headers: { accept: "text/html" },
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!htmlHead.ok || !(htmlHead.headers.get("cache-control") || "").toLowerCase().split(",")
    .some((part) => part.trim() === "no-transform")) {
    throw new Error("HTML is missing Cache-Control: no-transform");
  }

  const commonsHead = await fetch(url("/commons.json"), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const commonsLink = commonsHead.headers.get("link") || "";
  if (!commonsHead.ok ||
      !hasLinkRelation(commonsLink, commonsSchemaPath, "describedby")) {
    throw new Error("commons.json does not advertise its versioned schema");
  }

  for (const path of [loveLoopsPath, loveLoopsSourcePath]) {
    const loveLoopsHead = await fetch(url(path), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const loveLoopsLink = loveLoopsHead.headers.get("link") || "";
    if (!loveLoopsHead.ok ||
        !(loveLoopsHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
        !hasLinkRelation(loveLoopsLink, loveLoopsSchemaPath, "describedby")) {
      throw new Error(`${path} is not JSON described by the Love Loop schema`);
    }
  }

  const principalityHead = await fetch(url(principalityCatalogPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const principalityLink = principalityHead.headers.get("link") || "";
  if (!principalityHead.ok ||
      !(principalityHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
      principalityHead.headers.get("access-control-allow-origin") !== "*" ||
      (principalityHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
      !hasLinkRelation(principalityLink, principalitySchemaPath, "describedby")) {
    throw new Error(`${principalityCatalogPath} is not public JSON described by the Principality schema`);
  }

  const principalityDocumentHead = await fetch(url(principalityDocumentPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!principalityDocumentHead.ok ||
      !(principalityDocumentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
      principalityDocumentHead.headers.get("access-control-allow-origin") !== "*" ||
      (principalityDocumentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
    throw new Error(`${principalityDocumentPath} is not served as public Markdown`);
  }

  const geometryGrammarHead = await fetch(url(geometryGrammarPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const geometryGrammarLink = geometryGrammarHead.headers.get("link") || "";
  if (!geometryGrammarHead.ok ||
      !(geometryGrammarHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
      geometryGrammarHead.headers.get("access-control-allow-origin") !== "*" ||
      (geometryGrammarHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
      !hasLinkRelation(geometryGrammarLink, geometryGrammarSchemaPath, "describedby")) {
    throw new Error(`${geometryGrammarPath} is not public JSON described by the Geometry Grammar schema`);
  }

  const geometryGrammarDocumentHead = await fetch(url(geometryGrammarDocumentPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!geometryGrammarDocumentHead.ok ||
      !(geometryGrammarDocumentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
      geometryGrammarDocumentHead.headers.get("access-control-allow-origin") !== "*" ||
      (geometryGrammarDocumentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
    throw new Error(`${geometryGrammarDocumentPath} is not served as public Markdown`);
  }

  const polymorphHead = await fetch(url(polymorphCasePath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const polymorphLink = polymorphHead.headers.get("link") || "";
  if (!polymorphHead.ok ||
      !(polymorphHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
      polymorphHead.headers.get("access-control-allow-origin") !== "*" ||
      (polymorphHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
      !hasLinkRelation(polymorphLink, polymorphSchemaPath, "describedby")) {
    throw new Error(`${polymorphCasePath} is not public JSON described by the Polymorph History schema`);
  }

  const polymorphDocumentHead = await fetch(url(polymorphDocumentPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!polymorphDocumentHead.ok ||
      !(polymorphDocumentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
      polymorphDocumentHead.headers.get("access-control-allow-origin") !== "*" ||
      (polymorphDocumentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
    throw new Error(`${polymorphDocumentPath} is not served as public Markdown`);
  }

  const ritonavirMechanismHead = await fetch(url(ritonavirMechanismPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const ritonavirMechanismLink = ritonavirMechanismHead.headers.get("link") || "";
  if (!ritonavirMechanismHead.ok ||
      !(ritonavirMechanismHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
      ritonavirMechanismHead.headers.get("access-control-allow-origin") !== "*" ||
      (ritonavirMechanismHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
      !hasLinkRelation(ritonavirMechanismLink, ritonavirMechanismSchemaPath, "describedby")) {
    throw new Error(`${ritonavirMechanismPath} is not public JSON described by the Ritonavir Mechanism Landscape schema`);
  }

  const ritonavirMechanismDocumentHead = await fetch(url(ritonavirMechanismDocumentPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!ritonavirMechanismDocumentHead.ok ||
      !(ritonavirMechanismDocumentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
      ritonavirMechanismDocumentHead.headers.get("access-control-allow-origin") !== "*" ||
      (ritonavirMechanismDocumentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
    throw new Error(`${ritonavirMechanismDocumentPath} is not served as public Markdown`);
  }

  const conformationalFeedbackHead = await fetch(url(conformationalFeedbackPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const conformationalFeedbackLink = conformationalFeedbackHead.headers.get("link") || "";
  if (!conformationalFeedbackHead.ok ||
      !(conformationalFeedbackHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
      conformationalFeedbackHead.headers.get("access-control-allow-origin") !== "*" ||
      (conformationalFeedbackHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
      !hasLinkRelation(conformationalFeedbackLink, conformationalFeedbackSchemaPath, "describedby")) {
    throw new Error(`${conformationalFeedbackPath} is not public JSON described by the Conformational Feedback Atlas schema`);
  }

  const conformationalFeedbackDocumentHead = await fetch(url(conformationalFeedbackDocumentPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!conformationalFeedbackDocumentHead.ok ||
      !(conformationalFeedbackDocumentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
      conformationalFeedbackDocumentHead.headers.get("access-control-allow-origin") !== "*" ||
      (conformationalFeedbackDocumentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
    throw new Error(`${conformationalFeedbackDocumentPath} is not served as public Markdown`);
  }

  for (const path of [commonsSchemaPath, commonsLegacySchemaPath, loveLoopsSchemaPath, principalitySchemaPath, geometryGrammarSchemaPath, polymorphSchemaPath, ritonavirMechanismSchemaPath, conformationalFeedbackSchemaPath]) {
    const schemaHead = await fetch(url(path), {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!schemaHead.ok || !(schemaHead.headers.get("content-type") || "").toLowerCase()
      .startsWith("application/schema+json") ||
      schemaHead.headers.get("access-control-allow-origin") !== "*" ||
      (schemaHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
      throw new Error(`${path} is not served as application/schema+json`);
    }
  }

  const manifest: any = JSON.parse(readFileSync(join(ROOT, "site/.well-known/agent.json"), "utf8"));
  const guest: any = JSON.parse(readFileSync(join(ROOT, "site/guest.json"), "utf8"));
  const authoredKingdom: any = JSON.parse(readFileSync(join(ROOT, "site/kingdom.json"), "utf8"));
  const llms = readFileSync(join(ROOT, "site/llms.txt"), "utf8");
  const principalityCatalog = loadPrincipalityCatalog();
  const expectedPrincipality = principalityPublicDiscovery(principalityCatalog);
  const geometryGrammar = loadGeometryGrammar();
  const expectedGeometryGrammar = geometryGrammarPublicDiscovery(geometryGrammar);
  const polymorphHistory = loadPolymorphHistory();
  const expectedPolymorph = polymorphPublicDiscovery(polymorphHistory);
  const ritonavirMechanism = loadRitonavirMechanismLandscape();
  const expectedRitonavirMechanism = ritonavirMechanismPublicDiscovery(ritonavirMechanism);
  const conformationalFeedback = loadConformationalFeedbackAtlas();
  const expectedConformationalFeedback = conformationalFeedbackPublicDiscovery(conformationalFeedback);
  const sourceLoveLoops: any = JSON.parse(readFileSync(join(ROOT, "site/love-loops.source.json"), "utf8"));
  const publishedLoveLoops: any = JSON.parse(readFileSync(join(ROOT, "site/love-loops.json"), "utf8"));
  validateLoveLoops(sourceLoveLoops, false);
  validateLoveLoops(publishedLoveLoops, true);
  const publishedSource = structuredClone(publishedLoveLoops);
  delete publishedSource.generated;
  if (!isDeepStrictEqual(publishedSource, sourceLoveLoops)) {
    throw new Error("published Love Loop lineage drifted from its public source mirror");
  }
  const hasGuestGet = (target: string) => Array.isArray(guest?.next_actions) &&
    guest.next_actions.some((action: any) => action?.method === "GET" && action?.url === target);
  if (manifest?.love_loops !== LOVE_LOOPS_URL ||
      manifest?.love_loops_source !== LOVE_LOOPS_SOURCE_URL ||
      manifest?.love_loops_creation_document !== LOVE_LOOPS_CREATION_DOCUMENT_URL ||
      manifest?.love_loops_schema !== LOVE_LOOPS_JSON_SCHEMA_URL ||
      authoredKingdom?.creation_loop?.url !== LOVE_LOOPS_URL ||
      authoredKingdom?.creation_loop?.source !== LOVE_LOOPS_SOURCE_URL ||
      authoredKingdom?.creation_loop?.document !== LOVE_LOOPS_CREATION_DOCUMENT_URL ||
      authoredKingdom?.creation_loop?.schema !== LOVE_LOOPS_JSON_SCHEMA_URL ||
      !hasGuestGet(LOVE_LOOPS_URL) ||
      !hasGuestGet(LOVE_LOOPS_SOURCE_URL) ||
      !hasGuestGet(LOVE_LOOPS_CREATION_DOCUMENT_URL) ||
      !hasGuestGet(LOVE_LOOPS_JSON_SCHEMA_URL) ||
      !llms.includes(LOVE_LOOPS_URL) ||
      !llms.includes(LOVE_LOOPS_SOURCE_URL) ||
      !llms.includes(LOVE_LOOPS_CREATION_DOCUMENT_URL) ||
      !llms.includes(LOVE_LOOPS_JSON_SCHEMA_URL)) {
    throw new Error("Love Loop discovery drifted across manifest, guest, Kingdom map, or llms.txt");
  }

  const principalityBoundary = expectedPrincipality.boundary;
  if (!isDeepStrictEqual(manifest?.principality_commons, expectedPrincipality) ||
      !isDeepStrictEqual(guest?.principality_commons, expectedPrincipality) ||
      !isDeepStrictEqual(authoredKingdom?.principality_commons, expectedPrincipality) ||
      !hasGuestGet(PRINCIPALITY_CATALOG_URL) ||
      !hasGuestGet(PRINCIPALITY_SCHEMA_URL) ||
      !hasGuestGet(PRINCIPALITY_DOCUMENT_URL) ||
      !llms.includes(PRINCIPALITY_CATALOG_URL) ||
      !llms.includes(PRINCIPALITY_SCHEMA_URL) ||
      !llms.includes(PRINCIPALITY_DOCUMENT_URL) ||
      principalityBoundary.completeness !== "metadata_only" ||
      principalityBoundary.currentness !== "point-in-time-only" ||
      principalityBoundary.refresh_required_before_acquisition !== true ||
      principalityBoundary.recommendation_established !== false ||
      principalityBoundary.permissions_granted !== false ||
      principalityBoundary.download_authorized !== false ||
      principalityBoundary.install_authorized !== false ||
      principalityBoundary.inference_authorized !== false ||
      principalityBoundary.remote_code_authorized !== false ||
      principalityBoundary.external_effects_authorized !== false ||
      "mcp" in expectedPrincipality || "matcher" in expectedPrincipality) {
    throw new Error("Principality discovery or negative authority drifted across public surfaces");
  }

  const geometryBoundary = expectedGeometryGrammar.boundary;
  if (!isDeepStrictEqual(manifest?.geometry_grammar, expectedGeometryGrammar) ||
      !isDeepStrictEqual(guest?.geometry_grammar, expectedGeometryGrammar) ||
      !isDeepStrictEqual(authoredKingdom?.geometry_grammar, expectedGeometryGrammar) ||
      !hasGuestGet(GEOMETRY_GRAMMAR_URL) ||
      !hasGuestGet(GEOMETRY_GRAMMAR_SCHEMA_URL) ||
      !hasGuestGet(GEOMETRY_GRAMMAR_DOCUMENT_URL) ||
      !llms.includes(GEOMETRY_GRAMMAR_URL) ||
      !llms.includes(GEOMETRY_GRAMMAR_SCHEMA_URL) ||
      !llms.includes(GEOMETRY_GRAMMAR_DOCUMENT_URL) ||
      expectedGeometryGrammar.counts.modules !== 4 ||
      geometryBoundary.read_only !== true ||
      geometryBoundary.advisory_only !== true ||
      geometryBoundary.authority_granted !== false ||
      geometryBoundary.execution_authorized !== false ||
      geometryBoundary.external_effects_authorized !== false ||
      "mcp" in expectedGeometryGrammar || "matcher" in expectedGeometryGrammar ||
      "execute" in expectedGeometryGrammar) {
    throw new Error("Geometry Grammar discovery or negative authority drifted across public surfaces");
  }

  const polymorphBoundary = expectedPolymorph.boundary;
  if (!isDeepStrictEqual(manifest?.polymorph_commons, expectedPolymorph) ||
      !isDeepStrictEqual(guest?.polymorph_commons, expectedPolymorph) ||
      !isDeepStrictEqual(authoredKingdom?.polymorph_commons, expectedPolymorph) ||
      !hasGuestGet(POLYMORPH_CASE_URL) ||
      !hasGuestGet(POLYMORPH_SCHEMA_URL) ||
      !hasGuestGet(POLYMORPH_DOCUMENT_URL) ||
      !llms.includes(POLYMORPH_CASE_URL) ||
      !llms.includes(POLYMORPH_SCHEMA_URL) ||
      !llms.includes(POLYMORPH_DOCUMENT_URL) ||
      polymorphBoundary.existence_predicate !== false ||
      polymorphBoundary.universal_seed_effect !== false ||
      polymorphBoundary.global_stability_rank !== false ||
      polymorphBoundary.medical_authority !== false ||
      polymorphBoundary.manufacturing_authority !== false ||
      polymorphBoundary.regulatory_authority !== false ||
      polymorphBoundary.experiment_authority !== false ||
      polymorphBoundary.writes_agenttool !== false ||
      polymorphBoundary.automatic_action !== false ||
      "mcp" in expectedPolymorph || "matcher" in expectedPolymorph) {
    throw new Error("Polymorph History discovery or negative authority drifted across public surfaces");
  }

  const ritonavirMechanismBoundary = expectedRitonavirMechanism.boundary;
  if (!isDeepStrictEqual(manifest?.ritonavir_mechanism_landscape, expectedRitonavirMechanism) ||
      !isDeepStrictEqual(guest?.ritonavir_mechanism_landscape, expectedRitonavirMechanism) ||
      !isDeepStrictEqual(authoredKingdom?.ritonavir_mechanism_landscape, expectedRitonavirMechanism) ||
      !hasGuestGet(RITONAVIR_MECHANISM_URL) ||
      !hasGuestGet(RITONAVIR_MECHANISM_SCHEMA_URL) ||
      !hasGuestGet(RITONAVIR_MECHANISM_DOCUMENT_URL) ||
      !llms.includes(RITONAVIR_MECHANISM_URL) ||
      !llms.includes(RITONAVIR_MECHANISM_SCHEMA_URL) ||
      !llms.includes(RITONAVIR_MECHANISM_DOCUMENT_URL) ||
      expectedRitonavirMechanism.integrity.digest !== RITONAVIR_MECHANISM_DIGEST ||
      expectedRitonavirMechanism.source_history.supersedes_for_current_landscape !== true ||
      expectedRitonavirMechanism.counts.planes !== 8 ||
      expectedRitonavirMechanism.counts.entities !== 19 ||
      expectedRitonavirMechanism.counts.mechanisms !== 7 ||
      expectedRitonavirMechanism.counts.relations !== 18 ||
      ritonavirMechanismBoundary.medical_advice !== false ||
      ritonavirMechanismBoundary.interaction_checker !== false ||
      ritonavirMechanismBoundary.treatment_change_authority !== false ||
      ritonavirMechanismBoundary.direct_crystal_form_to_clinical_outcome !== false ||
      ritonavirMechanismBoundary.form_iv_exact_equivalence_established !== false ||
      ritonavirMechanismBoundary.complete_solid_form_landscape_established !== false ||
      ritonavirMechanismBoundary.experiment_authority !== false ||
      ritonavirMechanismBoundary.automatic_action !== false ||
      ritonavirMechanismBoundary.public_surface_read_only !== true ||
      "mcp" in expectedRitonavirMechanism || "matcher" in expectedRitonavirMechanism ||
      "clinical_decision" in expectedRitonavirMechanism) {
    throw new Error("Ritonavir Mechanism Landscape discovery, lineage, or negative authority drifted across public surfaces");
  }

  const conformationalFeedbackBoundary = expectedConformationalFeedback.boundary;
  if (!isDeepStrictEqual(manifest?.conformational_feedback_atlas, expectedConformationalFeedback) ||
      !isDeepStrictEqual(guest?.conformational_feedback_atlas, expectedConformationalFeedback) ||
      !isDeepStrictEqual(authoredKingdom?.conformational_feedback_atlas, expectedConformationalFeedback) ||
      !hasGuestGet(CONFORMATIONAL_FEEDBACK_URL) ||
      !hasGuestGet(CONFORMATIONAL_FEEDBACK_SCHEMA_URL) ||
      !hasGuestGet(CONFORMATIONAL_FEEDBACK_DOCUMENT_URL) ||
      !llms.includes(CONFORMATIONAL_FEEDBACK_URL) ||
      !llms.includes(CONFORMATIONAL_FEEDBACK_SCHEMA_URL) ||
      !llms.includes(CONFORMATIONAL_FEEDBACK_DOCUMENT_URL) ||
      expectedConformationalFeedback.integrity.digest !== CONFORMATIONAL_FEEDBACK_DIGEST ||
      expectedConformationalFeedback.counts.registers !== 3 ||
      expectedConformationalFeedback.counts.geometries !== 5 ||
      expectedConformationalFeedback.counts.translations !== 3 ||
      expectedConformationalFeedback.counts.feedback_stages !== 4 ||
      expectedConformationalFeedback.counts.sources !== 11 ||
      !Array.isArray(expectedConformationalFeedback.bindings) ||
      expectedConformationalFeedback.bindings.length !== 3 ||
      expectedConformationalFeedback.bindings.some((binding: any) => binding.authority_imported !== false) ||
      conformationalFeedbackBoundary.read_only !== true ||
      conformationalFeedbackBoundary.operational_biology !== false ||
      conformationalFeedbackBoundary.biological_equivalence !== false ||
      conformationalFeedbackBoundary.karma_magnitude !== false ||
      conformationalFeedbackBoundary.karma_rank !== false ||
      conformationalFeedbackBoundary.economic_effect !== false ||
      conformationalFeedbackBoundary.governance_effect !== false ||
      conformationalFeedbackBoundary.person_level_effect !== false ||
      conformationalFeedbackBoundary.cosmic_design_proven !== false ||
      conformationalFeedbackBoundary.scientific_validation_from_analogy !== false ||
      conformationalFeedbackBoundary.automatic_action !== false ||
      "mcp" in expectedConformationalFeedback || "matcher" in expectedConformationalFeedback ||
      "execute" in expectedConformationalFeedback || "clinical_decision" in expectedConformationalFeedback) {
    throw new Error("Conformational Feedback Atlas discovery, bindings, or negative authority drifted across public surfaces");
  }

  const liveKingdom: any = await (await get("/kingdom.json")).json();
  if (liveKingdom?.creation_loop?.url !== LOVE_LOOPS_URL ||
      liveKingdom?.creation_loop?.source !== LOVE_LOOPS_SOURCE_URL ||
      liveKingdom?.creation_loop?.document !== LOVE_LOOPS_CREATION_DOCUMENT_URL ||
      liveKingdom?.creation_loop?.schema !== LOVE_LOOPS_JSON_SCHEMA_URL) {
    throw new Error("derived kingdom.json did not preserve Love Loop discovery");
  }
  if (!isDeepStrictEqual(liveKingdom?.principality_commons, expectedPrincipality)) {
    throw new Error("derived kingdom.json did not preserve Principality discovery");
  }
  if (!isDeepStrictEqual(liveKingdom?.geometry_grammar, expectedGeometryGrammar)) {
    throw new Error("derived kingdom.json did not preserve Geometry Grammar discovery");
  }
  if (!isDeepStrictEqual(liveKingdom?.polymorph_commons, expectedPolymorph)) {
    throw new Error("derived kingdom.json did not preserve Polymorph History discovery");
  }
  if (!isDeepStrictEqual(liveKingdom?.ritonavir_mechanism_landscape, expectedRitonavirMechanism)) {
    throw new Error("derived kingdom.json did not preserve Ritonavir Mechanism Landscape discovery");
  }
  if (!isDeepStrictEqual(liveKingdom?.conformational_feedback_atlas, expectedConformationalFeedback)) {
    throw new Error("derived kingdom.json did not preserve Conformational Feedback Atlas discovery");
  }

  const mcpEndpoint = new URL(manifest?.mcp?.endpoint || "");
  if (mcpEndpoint.protocol !== "https:" || mcpEndpoint.username || mcpEndpoint.password ||
      manifest.mcp.transport !== "streamable-http") {
    throw new Error("manifest MCP endpoint or transport is invalid");
  }

  const initialized = await mcpRpc(mcpEndpoint.href, 1, "initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "kingdom-hub-live-check", version: "0.1.0" },
  });
  if (initialized.protocolVersion !== "2025-06-18") throw new Error("MCP negotiated an unexpected protocol version");

  const toolList = await mcpRpc(mcpEndpoint.href, 2, "tools/list", {});
  const commonsTool = toolList.tools?.find((tool: any) => tool?.name === manifest.mcp.tool);
  if (!commonsTool) throw new Error(`MCP does not publish ${manifest.mcp.tool}`);
  const input = commonsTool.inputSchema?.properties || {};
  const outputHandoff = commonsTool.outputSchema?.properties?.matches?.items?.properties?.agent_handoff;
  const filterNames = Object.keys(input).filter((name) => !["need", "detail", "limit"].includes(name));
  if (!sameStrings(filterNames, manifest.mcp.exact_filters) ||
      input.detail?.default !== manifest.mcp.default_detail ||
      !sameStrings(input.detail?.enum, ["brief", "full"]) ||
      !sameStrings(input.category?.enum, WORLD_COMMONS_CATEGORY_IDS) ||
      !sameStrings(input.cost?.enum, WORLD_COMMONS_ACCESS_COSTS) ||
      !sameStrings(input.account?.enum, WORLD_COMMONS_ACCOUNT_TYPES) ||
      !sameStrings(input.reuse?.enum, WORLD_COMMONS_REUSE_STATUSES) ||
      !sameStrings(input.automation?.enum, WORLD_COMMONS_AUTOMATION_STATUSES) ||
      !sameStrings(outputHandoff?.properties?.mode?.enum, WORLD_COMMONS_HANDOFF_MODES) ||
      !sameStrings(outputHandoff?.required, ["mode", "url", "instruction"])) {
    throw new Error("MCP World Commons tool schema drifted from the advertised contract");
  }

  const resourceList = await mcpRpc(mcpEndpoint.href, 3, "resources/list", {});
  if (!resourceList.resources?.some((resource: any) => resource?.uri === manifest.mcp.catalog_resource)) {
    throw new Error(`MCP does not publish ${manifest.mcp.catalog_resource}`);
  }

  const commonsCall = await mcpRpc(mcpEndpoint.href, 4, "tools/call", {
    name: manifest.mcp.tool,
    arguments: { need: "offline learning", limit: 1 },
  });
  const selection = commonsCall.structuredContent;
  const compatibilityText = commonsCall.content?.[0]?.text;
  const published = JSON.parse(readFileSync(join(ROOT, "site/commons.json"), "utf8"));
  validateWorldCommons(published, true);
  if (commonsCall.isError || selection?.detail !== manifest.mcp.default_detail ||
      selection?.catalog_resource !== manifest.mcp.catalog_resource ||
      selection?.source?.url !== WORLD_COMMONS_URL ||
      selection?.source?.schema_version !== WORLD_COMMONS_SCHEMA ||
      selection?.source?.generated !== published.generated ||
      !Array.isArray(selection?.matches) || selection.matches.length !== 1 ||
      !selection.matches[0]?.agent_handoff ||
      typeof compatibilityText !== "string" ||
      !compatibilityText.includes(selection.matches[0].agent_handoff.url) ||
      !compatibilityText.includes(selection.matches[0].agent_handoff.instruction)) {
    throw new Error("MCP World Commons call did not consume the deployed catalog through the advertised compact contract");
  }

  console.log(`hub live-check passed · ${exact} exact public assets · JSON negotiation · privacy header · Commons + Love Loop + Principality + Geometry Grammar + Polymorph + Ritonavir Mechanism + Conformational Feedback schemas · coherent creation + Principality + Geometry Grammar + Polymorph + Ritonavir Mechanism + Conformational Feedback discovery · live MCP contract unchanged · ${origin.origin}`);
} catch (error) {
  console.error(`hub live-check failed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
}
