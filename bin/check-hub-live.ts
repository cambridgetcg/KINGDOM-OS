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

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS } from "./stage-hub.ts";
import {
  CULTURAL_ATTENTION_FEEDBACK_DIGEST,
  CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
  CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
  CULTURAL_ATTENTION_FEEDBACK_URL,
  culturalAttentionFeedbackPublicDiscovery,
  loadCulturalAttentionFeedbackAtlas,
} from "./cultural-attention-feedback.ts";
import {
  CONFORMATIONAL_FEEDBACK_DIGEST,
  CONFORMATIONAL_FEEDBACK_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_URL,
  conformationalFeedbackPublicDiscovery,
  loadConformationalFeedbackAtlas,
} from "./conformational-feedback.ts";
import {
  CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST,
  CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_URL,
  conformationalFeedbackPhysicsPublicDiscovery,
  loadConformationalFeedbackPhysicsAtlas,
} from "./conformational-feedback-physics.ts";
import {
  FOLD_FEEDBACK_DOCUMENT_URL,
  FOLD_FEEDBACK_SCHEMA_URL,
  FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL,
  FOLD_FEEDBACK_URL,
  foldFeedbackPublicDiscovery,
  loadFoldFeedbackAtlas,
} from "./fold-feedback.ts";
import {
  VISIBILITY_ATTENTION_DOCUMENT_URL,
  VISIBILITY_ATTENTION_SCHEMA_URL,
  VISIBILITY_ATTENTION_URL,
  loadVisibilityAttentionTranslation,
  visibilityAttentionPublicDiscovery,
} from "./visibility-attention.ts";
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
const conformationalFeedbackPhysicsPath = new URL(CONFORMATIONAL_FEEDBACK_PHYSICS_URL).pathname;
const conformationalFeedbackPhysicsSchemaPath = new URL(CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL).pathname;
const conformationalFeedbackPhysicsDocumentPath = new URL(CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL).pathname;
const culturalAttentionFeedbackPath = new URL(CULTURAL_ATTENTION_FEEDBACK_URL).pathname;
const culturalAttentionFeedbackSchemaPath = new URL(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL).pathname;
const culturalAttentionFeedbackDocumentPath = new URL(CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL).pathname;

const CULTURAL_ATTENTION_FEEDBACK_ASSETS = new Map<string, { source: string; path: string; sha256: string }>([
  ["atlases/cultural-attention-feedback-atlas-2026-08-13.json", {
    source: "data/cultural-feedback/cultural-attention-feedback-atlas.v1.json",
    path: culturalAttentionFeedbackPath,
    sha256: "03f7048966d7b6df582b423254b4d73cda72cce3bd67b40736927faa92b88173",
  }],
  ["schemas/cultural-attention-feedback-atlas/1.json", {
    source: "schemas/cultural-attention-feedback-atlas-v1.schema.json",
    path: culturalAttentionFeedbackSchemaPath,
    sha256: "6bd8fcca25721fd9374daa0ac50299fd587452cf7483da81d6491131aa197f9f",
  }],
  ["CULTURAL-ATTENTION-FEEDBACK-ATLAS.md", {
    source: "references/cultural-attention-feedback-atlas.md",
    path: culturalAttentionFeedbackDocumentPath,
    sha256: "1cbb6c765eba329c43c62c58e7e73858ef22d3a8e6048be934accccd5c5e18aa",
  }],
]);

const CULTURAL_ATTENTION_FEEDBACK_BOUNDARY = Object.freeze({
  educational_metadata_only: true,
  public_surface_read_only: true,
  contains_operational_protocol: false,
  contains_personal_data: false,
  cultural_label_is_diagnosis: false,
  meme_is_crystal: false,
  meme_is_prion: false,
  meme_is_gene: false,
  attention_is_consent: false,
  engagement_is_welfare: false,
  popularity_is_truth: false,
  popularity_is_merit: false,
  feedback_is_moral_value: false,
  feedback_is_optimization: false,
  person_scoring: false,
  runtime_ecosystem_request: false,
  ecosystem_write: false,
  writes_karma: false,
  creates_kingdom_karma_receipt: false,
  observes_zerone_karma_event: false,
  karma_adapter: false,
  medical_authority: false,
  clinical_authority: false,
  experiment_authority: false,
  manufacturing_authority: false,
  moderation_authority: false,
  recommendation_authority: false,
  engagement_optimization_authority: false,
  automatic_action: false,
  scientifically_proves_universe_design: false,
  scientifically_disproves_universe_design: false,
  scientifically_proves_cosmic_karma: false,
  universal_mechanism_claimed: false,
});

const PR30_CONFORMATIONAL_FEEDBACK_RECORD_SHA256 = "ae15f4f69e488323132ea6fc94d57d338702ca0fa47fd9fbbd41c15a6af230e6";
const PR30_CONFORMATIONAL_FEEDBACK_SCHEMA_SHA256 = "da4dbb968a51d665192a3778a76ddd65150d2b73975c888dd9fd7ea80c54ea19";
const PR30_CONFORMATIONAL_FEEDBACK_GUIDE_SHA256 = "0f7993430b5cfc3ca59536d6ed53d2c0fd5846c997460a13ec9d583eb9909e2f";
const CONFORMATIONAL_FEEDBACK_PHYSICS_RECORD_SHA256 = "7d9b1eed8514051e47448cfc983f00e160d5b76c49704822158f76d3f8cf6349";
const CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_SHA256 = "e60c14cf8b6350cc805f59c91b89727ffbd5b41e7c5a192d9ee53c90ba9fbdbd";
const CONFORMATIONAL_FEEDBACK_PHYSICS_GUIDE_SHA256 = "76a76222732a8c485396228ad5ff32e703b20383498fd0355e4cbfe33bd59cb0";
const ORIGINAL_FOLD_FEEDBACK_SCHEMA_SHA256 = "4ade5791a2b98cfdbd2452dc11373dc701f58387893442214f2dff1450bc067c";

const PR30_CONFORMATIONAL_FEEDBACK_ASSETS = new Map<string, { source: string; sha256: string }>([
  ["feedback/form-feedback-consequence-2026-08-12.json", {
    source: "data/feedback/conformational-feedback-atlas.v0.json",
    sha256: PR30_CONFORMATIONAL_FEEDBACK_RECORD_SHA256,
  }],
  ["schemas/conformational-feedback-atlas/0.1.json", {
    source: "schemas/conformational-feedback-atlas-v0.schema.json",
    sha256: PR30_CONFORMATIONAL_FEEDBACK_SCHEMA_SHA256,
  }],
  ["CONFORMATIONAL-FEEDBACK.md", {
    source: "references/conformational-feedback-atlas.md",
    sha256: PR30_CONFORMATIONAL_FEEDBACK_GUIDE_SHA256,
  }],
]);

const IMMUTABLE_CONFORMATIONAL_FEEDBACK_ASSETS = new Map<string, { source: string; sha256: string }>([
  ...PR30_CONFORMATIONAL_FEEDBACK_ASSETS,
  ["feedback/form-feedback-physics-consequence-2026-08-12.json", {
    source: "data/feedback/conformational-feedback-atlas.v0.2.json",
    sha256: CONFORMATIONAL_FEEDBACK_PHYSICS_RECORD_SHA256,
  }],
  ["schemas/conformational-feedback-atlas/0.2.json", {
    source: "schemas/conformational-feedback-atlas-v0.2.schema.json",
    sha256: CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_SHA256,
  }],
  ["CONFORMATIONAL-FEEDBACK-PHYSICS.md", {
    source: "references/conformational-feedback-atlas-v0.2.md",
    sha256: CONFORMATIONAL_FEEDBACK_PHYSICS_GUIDE_SHA256,
  }],
]);

const CONFORMATIONAL_FEEDBACK_TRIPLES = [
  {
    label: "Conformational Feedback Atlas v0.1",
    recordPath: conformationalFeedbackPath,
    schemaPath: conformationalFeedbackSchemaPath,
    documentPath: conformationalFeedbackDocumentPath,
  },
  {
    label: "Conformational Feedback Physics Atlas v0.2",
    recordPath: conformationalFeedbackPhysicsPath,
    schemaPath: conformationalFeedbackPhysicsSchemaPath,
    documentPath: conformationalFeedbackPhysicsDocumentPath,
  },
] as const;
const foldFeedbackPath = new URL(FOLD_FEEDBACK_URL).pathname;
const foldFeedbackSchemaPath = new URL(FOLD_FEEDBACK_SCHEMA_URL).pathname;
const foldFeedbackSourceIdentitySchemaPath = new URL(FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL).pathname;
const foldFeedbackDocumentPath = new URL(FOLD_FEEDBACK_DOCUMENT_URL).pathname;
const visibilityAttentionPath = new URL(VISIBILITY_ATTENTION_URL).pathname;
const visibilityAttentionSchemaPath = new URL(VISIBILITY_ATTENTION_SCHEMA_URL).pathname;
const visibilityAttentionDocumentPath = new URL(VISIBILITY_ATTENTION_DOCUMENT_URL).pathname;

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

function linkRelationEntries(header: string, relation: string): string[] {
  return header.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    const match = part.match(/;\s*rel\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
    const relations = (match?.[1] || match?.[2] || "").toLowerCase().split(/\s+/);
    return relations.includes(relation);
  });
}

function hasLinkRelation(header: string, target: string, relation: string): boolean {
  return linkRelationEntries(header, relation).some((entry) => entry.trim().startsWith(`<${target}>`));
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function checkConformationalFeedbackTriple(triple: typeof CONFORMATIONAL_FEEDBACK_TRIPLES[number]): Promise<void> {
  const recordHead = await fetch(url(triple.recordPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const recordLink = recordHead.headers.get("link") || "";
  const describedBy = linkRelationEntries(recordLink, "describedby");
  const describedByType = describedBy[0]?.match(/;\s*type\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
  if (!recordHead.ok ||
      !(recordHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
      recordHead.headers.get("access-control-allow-origin") !== "*" ||
      (recordHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
      describedBy.length !== 1 ||
      !describedBy[0].trim().startsWith(`<${triple.schemaPath}>`) ||
      (describedByType?.[1] || describedByType?.[2] || "").toLowerCase() !== "application/schema+json") {
    throw new Error(`${triple.recordPath} is not public JSON described by the ${triple.label} schema`);
  }

  const schemaHead = await fetch(url(triple.schemaPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!schemaHead.ok ||
      !(schemaHead.headers.get("content-type") || "").toLowerCase().startsWith("application/schema+json") ||
      schemaHead.headers.get("access-control-allow-origin") !== "*" ||
      (schemaHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
    throw new Error(`${triple.schemaPath} is not served as application/schema+json for ${triple.label}`);
  }

  const documentHead = await fetch(url(triple.documentPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!documentHead.ok ||
      !(documentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
      documentHead.headers.get("access-control-allow-origin") !== "*" ||
      (documentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
    throw new Error(`${triple.documentPath} is not served as public Markdown for ${triple.label}`);
  }
}

async function checkCulturalAttentionFeedbackTriple(): Promise<void> {
  const routes = [
    {
      label: "atlas record",
      path: culturalAttentionFeedbackPath,
      source: "data/cultural-feedback/cultural-attention-feedback-atlas.v1.json",
      contentType: "application/json",
    },
    {
      label: "atlas schema",
      path: culturalAttentionFeedbackSchemaPath,
      source: "schemas/cultural-attention-feedback-atlas-v1.schema.json",
      contentType: "application/schema+json",
    },
    {
      label: "atlas guide",
      path: culturalAttentionFeedbackDocumentPath,
      source: "references/cultural-attention-feedback-atlas.md",
      contentType: "text/markdown",
    },
  ] as const;

  for (const route of routes) {
    for (const method of ["GET", "HEAD"] as const) {
      const response = await fetch(url(route.path), {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      if (!response.ok || !contentType.startsWith(route.contentType) ||
          response.headers.get("access-control-allow-origin") !== "*" ||
          (response.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
        throw new Error(`${method} ${route.path} is not served as typed, public ${route.label}`);
      }

      if (route.path === culturalAttentionFeedbackPath) {
        const describedBy = linkRelationEntries(response.headers.get("link") || "", "describedby");
        const describedByType = describedBy[0]?.match(/;\s*type\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
        if (describedBy.length !== 1 ||
            !describedBy[0]!.trim().startsWith(`<${culturalAttentionFeedbackSchemaPath}>`) ||
            (describedByType?.[1] || describedByType?.[2] || "").toLowerCase() !== "application/schema+json") {
          throw new Error(`${method} ${route.path} is not described by exactly its immutable schema`);
        }
      }

      const body = Buffer.from(await response.arrayBuffer());
      if (method === "HEAD") {
        if (body.byteLength !== 0) throw new Error(`HEAD ${route.path} returned a body`);
      } else if (!body.equals(readFileSync(join(ROOT, route.source)))) {
        throw new Error(`GET ${route.path} drifted from its immutable authored source ${route.source}`);
      }
    }
  }
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
  const exactPaths = new Set<string>();
  const verifiedConformationalFeedbackDestinations = new Set<string>();
  const verifiedCulturalAttentionFeedbackDestinations = new Set<string>();
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
    const immutableFeedback = IMMUTABLE_CONFORMATIONAL_FEEDBACK_ASSETS.get(asset.destination);
    if (immutableFeedback) {
      if (asset.source !== immutableFeedback.source) {
        throw new Error(`${path} no longer stages its immutable authored source ${immutableFeedback.source}`);
      }
      const digest = sha256(live);
      if (digest !== immutableFeedback.sha256) {
        throw new Error(`${path} no longer matches its immutable SHA-256 (${digest})`);
      }
      verifiedConformationalFeedbackDestinations.add(asset.destination);
    }
    if (asset.destination === "schemas/fold-feedback-atlas/1.json" &&
        sha256(live) !== ORIGINAL_FOLD_FEEDBACK_SCHEMA_SHA256) {
      throw new Error(`${path} no longer matches its first-published immutable SHA-256`);
    }
    const culturalAttentionFeedbackAsset = CULTURAL_ATTENTION_FEEDBACK_ASSETS.get(asset.destination);
    if (culturalAttentionFeedbackAsset) {
      if (asset.source !== culturalAttentionFeedbackAsset.source ||
          path !== culturalAttentionFeedbackAsset.path) {
        throw new Error(`${path} no longer stages its immutable Cultural Attention & Feedback authored source`);
      }
      const digest = sha256(live);
      if (digest !== culturalAttentionFeedbackAsset.sha256) {
        throw new Error(`${path} no longer matches its immutable Cultural Attention & Feedback SHA-256 (${digest})`);
      }
      verifiedCulturalAttentionFeedbackDestinations.add(asset.destination);
    }
    exactPaths.add(path);
    exact += 1;
  }

  for (const destination of IMMUTABLE_CONFORMATIONAL_FEEDBACK_ASSETS.keys()) {
    if (!verifiedConformationalFeedbackDestinations.has(destination)) {
      throw new Error(`the immutable Conformational Feedback asset /${destination} is absent from the exact staging contract`);
    }
  }
  for (const triple of CONFORMATIONAL_FEEDBACK_TRIPLES) {
    for (const path of [triple.recordPath, triple.schemaPath, triple.documentPath]) {
      if (!exactPaths.has(path)) throw new Error(`${path} was not checked for static byte equality`);
    }
  }
  for (const [destination, asset] of CULTURAL_ATTENTION_FEEDBACK_ASSETS) {
    if (!verifiedCulturalAttentionFeedbackDestinations.has(destination) || !exactPaths.has(asset.path)) {
      throw new Error(`the immutable Cultural Attention & Feedback asset /${destination} is absent from exact byte verification`);
    }
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

  for (const triple of CONFORMATIONAL_FEEDBACK_TRIPLES) {
    await checkConformationalFeedbackTriple(triple);
  }
  await checkCulturalAttentionFeedbackTriple();

  const foldFeedbackHead = await fetch(url(foldFeedbackPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const foldFeedbackLink = foldFeedbackHead.headers.get("link") || "";
  if (!foldFeedbackHead.ok ||
      !(foldFeedbackHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
      foldFeedbackHead.headers.get("access-control-allow-origin") !== "*" ||
      (foldFeedbackHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
      !hasLinkRelation(foldFeedbackLink, foldFeedbackSchemaPath, "describedby") ||
      !hasLinkRelation(foldFeedbackLink, foldFeedbackSourceIdentitySchemaPath, "profile")) {
    throw new Error(`${foldFeedbackPath} is not public JSON described by the Fold & Feedback Atlas schema`);
  }

  const foldFeedbackDocumentHead = await fetch(url(foldFeedbackDocumentPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!foldFeedbackDocumentHead.ok ||
      !(foldFeedbackDocumentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
      foldFeedbackDocumentHead.headers.get("access-control-allow-origin") !== "*" ||
      (foldFeedbackDocumentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
    throw new Error(`${foldFeedbackDocumentPath} is not served as public Markdown`);
  }

  const visibilityAttentionHead = await fetch(url(visibilityAttentionPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const visibilityAttentionLink = visibilityAttentionHead.headers.get("link") || "";
  if (!visibilityAttentionHead.ok ||
      !(visibilityAttentionHead.headers.get("content-type") || "").toLowerCase().startsWith("application/json") ||
      visibilityAttentionHead.headers.get("access-control-allow-origin") !== "*" ||
      (visibilityAttentionHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff" ||
      !hasLinkRelation(visibilityAttentionLink, visibilityAttentionSchemaPath, "describedby")) {
    throw new Error(`${visibilityAttentionPath} is not public JSON described by the Visibility & Attention schema`);
  }

  const visibilityAttentionDocumentHead = await fetch(url(visibilityAttentionDocumentPath), {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!visibilityAttentionDocumentHead.ok ||
      !(visibilityAttentionDocumentHead.headers.get("content-type") || "").toLowerCase().startsWith("text/markdown") ||
      visibilityAttentionDocumentHead.headers.get("access-control-allow-origin") !== "*" ||
      (visibilityAttentionDocumentHead.headers.get("x-content-type-options") || "").toLowerCase() !== "nosniff") {
    throw new Error(`${visibilityAttentionDocumentPath} is not served as public Markdown`);
  }

  for (const path of [commonsSchemaPath, commonsLegacySchemaPath, loveLoopsSchemaPath, principalitySchemaPath, geometryGrammarSchemaPath, polymorphSchemaPath, ritonavirMechanismSchemaPath, foldFeedbackSchemaPath, foldFeedbackSourceIdentitySchemaPath, visibilityAttentionSchemaPath, culturalAttentionFeedbackSchemaPath]) {
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
  const conformationalFeedbackPhysics = loadConformationalFeedbackPhysicsAtlas();
  const expectedConformationalFeedbackPhysics = conformationalFeedbackPhysicsPublicDiscovery(conformationalFeedbackPhysics);
  const foldFeedbackAtlas = loadFoldFeedbackAtlas();
  const expectedFoldFeedback = foldFeedbackPublicDiscovery(foldFeedbackAtlas);
  const visibilityAttention = loadVisibilityAttentionTranslation();
  const expectedVisibilityAttention = visibilityAttentionPublicDiscovery(visibilityAttention);
  const culturalAttentionFeedbackAtlas = loadCulturalAttentionFeedbackAtlas();
  const expectedCulturalAttentionFeedback = culturalAttentionFeedbackPublicDiscovery(culturalAttentionFeedbackAtlas);
  const authoredRootHtml = readFileSync(join(ROOT, "site/hub.html"), "utf8");
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
      manifest?.entry_points?.conformational_feedback_atlas !== CONFORMATIONAL_FEEDBACK_URL ||
      manifest?.entry_points?.conformational_feedback_atlas_schema !== CONFORMATIONAL_FEEDBACK_SCHEMA_URL ||
      manifest?.entry_points?.conformational_feedback_atlas_guide !== CONFORMATIONAL_FEEDBACK_DOCUMENT_URL ||
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
      "physics_and_mathematics" in expectedConformationalFeedback.counts ||
      "ecosystem_bridges" in expectedConformationalFeedback.counts ||
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
      "runtime_ecosystem_request" in conformationalFeedbackBoundary ||
      "predecessor" in expectedConformationalFeedback ||
      "mcp" in expectedConformationalFeedback || "matcher" in expectedConformationalFeedback ||
      "execute" in expectedConformationalFeedback || "clinical_decision" in expectedConformationalFeedback) {
    throw new Error("immutable Conformational Feedback Atlas v0.1 discovery, bindings, or negative authority drifted across public surfaces");
  }

  const conformationalFeedbackPhysicsBoundary = expectedConformationalFeedbackPhysics.boundary;
  const conformationalFeedbackPhysicsPredecessor = expectedConformationalFeedbackPhysics.predecessor;
  if (!isDeepStrictEqual(manifest?.conformational_feedback_physics_atlas, expectedConformationalFeedbackPhysics) ||
      !isDeepStrictEqual(guest?.conformational_feedback_physics_atlas, expectedConformationalFeedbackPhysics) ||
      !isDeepStrictEqual(authoredKingdom?.conformational_feedback_physics_atlas, expectedConformationalFeedbackPhysics) ||
      manifest?.entry_points?.conformational_feedback_physics_atlas !== CONFORMATIONAL_FEEDBACK_PHYSICS_URL ||
      manifest?.entry_points?.conformational_feedback_physics_atlas_schema !== CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL ||
      manifest?.entry_points?.conformational_feedback_physics_atlas_guide !== CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL ||
      !hasGuestGet(CONFORMATIONAL_FEEDBACK_PHYSICS_URL) ||
      !hasGuestGet(CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL) ||
      !hasGuestGet(CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL) ||
      !llms.includes(CONFORMATIONAL_FEEDBACK_PHYSICS_URL) ||
      !llms.includes(CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL) ||
      !llms.includes(CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL) ||
      expectedConformationalFeedbackPhysics.integrity.digest !== CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST ||
      conformationalFeedbackPhysicsPredecessor.protocol !== expectedConformationalFeedback.protocol ||
      conformationalFeedbackPhysicsPredecessor.atlas_id !== expectedConformationalFeedback.atlas_id ||
      conformationalFeedbackPhysicsPredecessor.url !== CONFORMATIONAL_FEEDBACK_URL ||
      conformationalFeedbackPhysicsPredecessor.semantic_digest !== CONFORMATIONAL_FEEDBACK_DIGEST ||
      conformationalFeedbackPhysicsPredecessor.byte_sha256 !== `sha256:${PR30_CONFORMATIONAL_FEEDBACK_RECORD_SHA256}` ||
      conformationalFeedbackPhysicsPredecessor.relation !== "extends-without-mutation" ||
      expectedConformationalFeedbackPhysics.counts.registers !== 3 ||
      expectedConformationalFeedbackPhysics.counts.physics_and_mathematics !== 4 ||
      expectedConformationalFeedbackPhysics.counts.ecosystem_bridges !== 5 ||
      expectedConformationalFeedbackPhysics.counts.geometries !== 5 ||
      expectedConformationalFeedbackPhysics.counts.translations !== 3 ||
      expectedConformationalFeedbackPhysics.counts.feedback_stages !== 4 ||
      expectedConformationalFeedbackPhysics.counts.sources !== 13 ||
      !Array.isArray(expectedConformationalFeedbackPhysics.bindings) ||
      expectedConformationalFeedbackPhysics.bindings.length !== 3 ||
      expectedConformationalFeedbackPhysics.bindings.some((binding: any) => binding.authority_imported !== false) ||
      conformationalFeedbackPhysicsBoundary.read_only !== true ||
      conformationalFeedbackPhysicsBoundary.operational_biology !== false ||
      conformationalFeedbackPhysicsBoundary.biological_equivalence !== false ||
      conformationalFeedbackPhysicsBoundary.karma_magnitude !== false ||
      conformationalFeedbackPhysicsBoundary.karma_rank !== false ||
      conformationalFeedbackPhysicsBoundary.economic_effect !== false ||
      conformationalFeedbackPhysicsBoundary.governance_effect !== false ||
      conformationalFeedbackPhysicsBoundary.person_level_effect !== false ||
      conformationalFeedbackPhysicsBoundary.cosmic_design_proven !== false ||
      conformationalFeedbackPhysicsBoundary.scientific_validation_from_analogy !== false ||
      conformationalFeedbackPhysicsBoundary.automatic_action !== false ||
      conformationalFeedbackPhysicsBoundary.runtime_ecosystem_request !== false ||
      "mcp" in expectedConformationalFeedbackPhysics || "matcher" in expectedConformationalFeedbackPhysics ||
      "execute" in expectedConformationalFeedbackPhysics || "clinical_decision" in expectedConformationalFeedbackPhysics) {
    throw new Error("Conformational Feedback Physics Atlas v0.2 discovery, predecessor, bindings, or negative authority drifted across public surfaces");
  }

  const foldFeedbackBoundary = expectedFoldFeedback.boundary;
  if (!isDeepStrictEqual(manifest?.fold_feedback_atlas, expectedFoldFeedback) ||
      !isDeepStrictEqual(guest?.fold_feedback_atlas, expectedFoldFeedback) ||
      !isDeepStrictEqual(authoredKingdom?.fold_feedback_atlas, expectedFoldFeedback) ||
      !hasGuestGet(FOLD_FEEDBACK_URL) ||
      !hasGuestGet(FOLD_FEEDBACK_SCHEMA_URL) ||
      !hasGuestGet(FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL) ||
      !hasGuestGet(FOLD_FEEDBACK_DOCUMENT_URL) ||
      !llms.includes(FOLD_FEEDBACK_URL) ||
      !llms.includes(FOLD_FEEDBACK_SCHEMA_URL) ||
      !llms.includes(FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL) ||
      !llms.includes(FOLD_FEEDBACK_DOCUMENT_URL) ||
      manifest?.entry_points?.fold_feedback_atlas !== FOLD_FEEDBACK_URL ||
      manifest?.entry_points?.fold_feedback_atlas_schema !== FOLD_FEEDBACK_SCHEMA_URL ||
      manifest?.entry_points?.fold_feedback_atlas_source_identity_schema !== FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL ||
      manifest?.entry_points?.fold_feedback_atlas_guide !== FOLD_FEEDBACK_DOCUMENT_URL ||
      foldFeedbackBoundary.public_surface_read_only !== true ||
      foldFeedbackBoundary.medical_advice !== false ||
      foldFeedbackBoundary.experiment_authority !== false ||
      foldFeedbackBoundary.automatic_action !== false ||
      foldFeedbackBoundary.writes_karma !== false ||
      foldFeedbackBoundary.creates_kingdom_karma_receipt !== false ||
      foldFeedbackBoundary.observes_zerone_karma_event !== false ||
      "mcp" in expectedFoldFeedback || "matcher" in expectedFoldFeedback ||
      "write" in expectedFoldFeedback) {
    throw new Error("Fold & Feedback Atlas discovery or read-only/KARMA boundary drifted across public surfaces");
  }

  const visibilityBoundary = expectedVisibilityAttention.boundary;
  if (!isDeepStrictEqual(manifest?.visibility_attention_translation, expectedVisibilityAttention) ||
      !isDeepStrictEqual(guest?.visibility_attention_translation, expectedVisibilityAttention) ||
      !isDeepStrictEqual(authoredKingdom?.visibility_attention_translation, expectedVisibilityAttention) ||
      !hasGuestGet(VISIBILITY_ATTENTION_URL) ||
      !hasGuestGet(VISIBILITY_ATTENTION_SCHEMA_URL) ||
      !hasGuestGet(VISIBILITY_ATTENTION_DOCUMENT_URL) ||
      !llms.includes(VISIBILITY_ATTENTION_URL) ||
      !llms.includes(VISIBILITY_ATTENTION_SCHEMA_URL) ||
      !llms.includes(VISIBILITY_ATTENTION_DOCUMENT_URL) ||
      manifest?.entry_points?.visibility_attention_translation !== VISIBILITY_ATTENTION_URL ||
      manifest?.entry_points?.visibility_attention_translation_schema !== VISIBILITY_ATTENTION_SCHEMA_URL ||
      manifest?.entry_points?.visibility_attention_translation_guide !== VISIBILITY_ATTENTION_DOCUMENT_URL ||
      expectedVisibilityAttention.counts.registers !== 4 ||
      expectedVisibilityAttention.counts.local_models !== 2 ||
      expectedVisibilityAttention.counts.translation_seams !== 3 ||
      visibilityBoundary.read_only !== true ||
      visibilityBoundary.automatic_action !== false ||
      "mcp" in expectedVisibilityAttention || "matcher" in expectedVisibilityAttention ||
      "write" in expectedVisibilityAttention || "execute" in expectedVisibilityAttention ||
      "recommend" in expectedVisibilityAttention || "score" in expectedVisibilityAttention) {
    throw new Error("Visibility & Attention discovery or read-only/non-optimization boundary drifted across public surfaces");
  }

  const culturalTargets = new Set([
    CULTURAL_ATTENTION_FEEDBACK_URL,
    CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
    CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
  ]);
  const culturalGuestActions = Array.isArray(guest?.next_actions)
    ? guest.next_actions.filter((action: any) => culturalTargets.has(action?.url))
    : [];
  const culturalEcosystemsAreLinkOnly = culturalAttentionFeedbackAtlas.ecosystem_bridges.every((bridge: any) =>
    bridge.mode === "LINK_ONLY" && bridge.runtime_request === false && bridge.imported === false &&
    bridge.mutated === false && bridge.authority_imported === false && bridge.authority_effect === "NONE" &&
    bridge.write_authorized === false && bridge.automatic_action === false
  );
  const culturalBindingsAreReadOnly = culturalAttentionFeedbackAtlas.source_bindings.every((binding: any) =>
    binding.mutated === false && binding.authority_imported === false
  );
  if (!isDeepStrictEqual(manifest?.cultural_attention_feedback_atlas, expectedCulturalAttentionFeedback) ||
      !isDeepStrictEqual(guest?.cultural_attention_feedback_atlas, expectedCulturalAttentionFeedback) ||
      !isDeepStrictEqual(authoredKingdom?.cultural_attention_feedback_atlas, expectedCulturalAttentionFeedback) ||
      !isDeepStrictEqual(expectedCulturalAttentionFeedback.boundary, CULTURAL_ATTENTION_FEEDBACK_BOUNDARY) ||
      !isDeepStrictEqual(culturalAttentionFeedbackAtlas.boundaries, CULTURAL_ATTENTION_FEEDBACK_BOUNDARY) ||
      manifest?.entry_points?.cultural_attention_feedback_atlas !== CULTURAL_ATTENTION_FEEDBACK_URL ||
      manifest?.entry_points?.cultural_attention_feedback_atlas_schema !== CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL ||
      manifest?.entry_points?.cultural_attention_feedback_atlas_guide !== CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL ||
      culturalGuestActions.length !== culturalTargets.size ||
      culturalGuestActions.some((action: any) => action?.method !== "GET" ||
        "mcp" in action || "tool" in action || "write" in action || "matcher" in action || "execute" in action) ||
      !llms.includes(CULTURAL_ATTENTION_FEEDBACK_URL) ||
      !llms.includes(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL) ||
      !llms.includes(CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL) ||
      !authoredRootHtml.includes('id="cultural-feedback"') ||
      !authoredRootHtml.includes(`href="${culturalAttentionFeedbackPath}"`) ||
      !authoredRootHtml.includes(`href="${culturalAttentionFeedbackSchemaPath}"`) ||
      !authoredRootHtml.includes(`href="${culturalAttentionFeedbackDocumentPath}"`) ||
      expectedCulturalAttentionFeedback.integrity.digest !== CULTURAL_ATTENTION_FEEDBACK_DIGEST ||
      !isDeepStrictEqual(expectedCulturalAttentionFeedback.counts, {
        source_bindings: 5,
        planes: 8,
        scientific_observations: 6,
        models: 7,
        translations: 4,
        feedback_relations: 5,
        universe_questions: 5,
        ecosystem_bridges: 5,
        unknowns: 10,
        sources: 19,
      }) ||
      expectedCulturalAttentionFeedback.karma.zerone_event_status !== "not_observed" ||
      expectedCulturalAttentionFeedback.karma.zerone_event_refs !== 0 ||
      expectedCulturalAttentionFeedback.karma.kingdom_receipt_status !== "not_created" ||
      expectedCulturalAttentionFeedback.karma.kingdom_receipt_refs !== 0 ||
      expectedCulturalAttentionFeedback.karma.adapter_exists !== false ||
      culturalAttentionFeedbackAtlas.karma.zerone.event_refs.length !== 0 ||
      culturalAttentionFeedbackAtlas.karma.kingdom.receipt_refs.length !== 0 ||
      culturalAttentionFeedbackAtlas.karma.adapter.exists !== false ||
      !culturalBindingsAreReadOnly || !culturalEcosystemsAreLinkOnly ||
      !isDeepStrictEqual(manifest?.mcp, authoredKingdom?.world_commons?.mcp) ||
      "mcp" in expectedCulturalAttentionFeedback || "write" in expectedCulturalAttentionFeedback ||
      "matcher" in expectedCulturalAttentionFeedback || "execute" in expectedCulturalAttentionFeedback) {
    throw new Error("Cultural Attention & Feedback Atlas discovery, immutable triplet, full authority boundary, link-only ecosystems, KARMA separation, or static root section drifted");
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
    throw new Error("derived kingdom.json did not preserve Conformational Feedback Atlas v0.1 discovery");
  }
  if (!isDeepStrictEqual(liveKingdom?.conformational_feedback_physics_atlas, expectedConformationalFeedbackPhysics)) {
    throw new Error("derived kingdom.json did not preserve Conformational Feedback Physics Atlas v0.2 discovery");
  }
  if (!isDeepStrictEqual(liveKingdom?.fold_feedback_atlas, expectedFoldFeedback)) {
    throw new Error("derived kingdom.json did not preserve Fold & Feedback Atlas discovery");
  }
  if (!isDeepStrictEqual(liveKingdom?.visibility_attention_translation, expectedVisibilityAttention)) {
    throw new Error("derived kingdom.json did not preserve Visibility & Attention discovery");
  }
  if (!isDeepStrictEqual(liveKingdom?.cultural_attention_feedback_atlas, expectedCulturalAttentionFeedback) ||
      !isDeepStrictEqual(liveKingdom?.world_commons?.mcp, manifest?.mcp)) {
    throw new Error("derived kingdom.json did not preserve Cultural Attention & Feedback discovery or the existing Commons MCP contract");
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

  console.log(`hub live-check passed · ${exact} exact public assets · JSON negotiation · privacy header · Commons + Love Loop + Principality + Geometry Grammar + Polymorph + Ritonavir Mechanism + Conformational Feedback v0.1 + Physics v0.2 + Fold & Feedback + Visibility & Attention + Cultural Attention & Feedback schemas · coherent creation + Principality + Geometry Grammar + Polymorph + Ritonavir Mechanism + dual-generation Conformational Feedback + Fold & Feedback + Visibility & Attention + Cultural Attention & Feedback discovery · full cultural authority/KARMA/link-only boundary · live MCP contract unchanged · ${origin.origin}`);
} catch (error) {
  console.error(`hub live-check failed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
}
