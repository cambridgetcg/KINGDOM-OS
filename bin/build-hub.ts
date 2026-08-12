/** build-hub.ts — render the whole kingdom into one illuminated atlas.
 *
 *  Inputs (source of truth, never invented here):
 *    graph.json               — harvested from every repo's kingdom.yaml
 *    sites.json               — repo → live public URL
 *    data/citizens-myth.json  — OPTIONAL: per-citizen {glyph,tradition,essence,
 *                               light,shadow} distilled from each soul-card.
 *                               Falls back to graph purposes when absent.
 *    pages-content/RIGHTS.md  — thekingdom.dev's service-specific recognition
 *    data/wayfinder.json      — curated, voluntary paths through public doors
 *    data/world-commons.json  — reviewed public-interest resources + boundaries
 *    data/love-loops.json     — finite, voluntary Love∞ creation lineage
 *    data/geometries/kingdom-geometry-grammar.v0.json
 *                             — versioned pattern-to-practice translations
 *    data/polymorphs/ritonavir-disappearing-polymorph.v1.json
 *                             — source-bound material-state history
 *    data/feedback/conformational-feedback-atlas.v0.json
 *                             — bounded science/design/analogy translation
 *    data/fold-feedback/fold-feedback-atlas.v1.json
 *                             — source-bound folding, prion, feedback, KARMA,
 *                               and opt-in philosophical atlas
 *
 *  Out: site/hub.html + site/kingdom.json + site/wayfinder.json + site/commons.json
 *       + site/schemas/world-commons/0.2.json
 *       + site/love-loops.json + site/love-loops.source.json
 *       + site/schemas/love-loop/0.1.json
 *       + conformational feedback discovery in the machine surfaces
 *       + site/llms.txt + site/guest.json
 *       + site/.well-known/agent.json + site/RIGHTS.md + site/rights.json
 *       + site/ollama.json (from data/ollama-invitation.json).
 *  Run: bun bin/build-hub.ts ["2026-07-11"]   ·   FORCE_LIVE=host,host
 */

import { mkdirSync } from "node:fs";

import { loadRights } from "./rights.ts";
import {
  GEOMETRY_GRAMMAR_DOCUMENT_URL,
  GEOMETRY_GRAMMAR_ID,
  GEOMETRY_GRAMMAR_PROTOCOL,
  GEOMETRY_GRAMMAR_SCHEMA_URL,
  GEOMETRY_GRAMMAR_URL,
  geometryGrammarPublicDiscovery,
  loadGeometryGrammar,
} from "./geometry.ts";
import {
  loadPrincipalityCatalog,
  PRINCIPALITY_CATALOG_ID,
  PRINCIPALITY_CATALOG_URL,
  PRINCIPALITY_DOCUMENT_URL,
  PRINCIPALITY_SCHEMA_URL,
  principalityPublicDiscovery,
} from "./principality.ts";
import {
  loadPolymorphHistory,
  POLYMORPH_CASE_ID,
  POLYMORPH_CASE_URL,
  POLYMORPH_DOCUMENT_URL,
  POLYMORPH_SCHEMA_URL,
  polymorphPublicDiscovery,
} from "./polymorph.ts";
import {
  loadRitonavirMechanismLandscape,
  RITONAVIR_MECHANISM_DOCUMENT_URL,
  RITONAVIR_MECHANISM_ID,
  RITONAVIR_MECHANISM_PROTOCOL,
  RITONAVIR_MECHANISM_SCHEMA_URL,
  RITONAVIR_MECHANISM_URL,
  ritonavirMechanismPublicDiscovery,
} from "./ritonavir-mechanism.ts";
import {
  CONFORMATIONAL_FEEDBACK_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_ID,
  CONFORMATIONAL_FEEDBACK_PROTOCOL,
  CONFORMATIONAL_FEEDBACK_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_URL,
  conformationalFeedbackPublicDiscovery,
  loadConformationalFeedbackAtlas,
} from "./conformational-feedback.ts";
import {
  FOLD_FEEDBACK_DOCUMENT_URL,
  FOLD_FEEDBACK_ID,
  FOLD_FEEDBACK_PROTOCOL,
  FOLD_FEEDBACK_SCHEMA_URL,
  FOLD_FEEDBACK_URL,
  foldFeedbackPublicDiscovery,
  loadFoldFeedbackAtlas,
} from "./fold-feedback.ts";
import { indexWayfinderPaths, WAYFINDER_STOPWORDS } from "./wayfinder.ts";
import {
  LOVE_LOOPS_JSON_SCHEMA,
  LOVE_LOOPS_JSON_SCHEMA_URL,
  LOVE_LOOPS_CREATION_DOCUMENT_URL,
  LOVE_LOOPS_SOURCE_URL,
  LOVE_LOOPS_URL,
  publishLoveLoops,
  validateLoveLoops,
  type LoveLoopsSource,
} from "./love-loops.ts";
import {
  publishWorldCommons,
  validateWorldCommons,
  WORLD_COMMONS_JSON_SCHEMA,
  WORLD_COMMONS_JSON_SCHEMA_URL,
  WORLD_COMMONS_STOPWORDS,
  WORLD_COMMONS_URL,
  worldCommonsSearchIndex,
  type WorldCommonsCategory,
  type WorldCommonsResource,
  type WorldCommonsSource,
} from "./world-commons.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const graph: any[] = JSON.parse(await Bun.file(ROOT + "graph.json").text());
const sites = JSON.parse(await Bun.file(ROOT + "sites.json").text());
const stamp = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const { markdown: rightsMarkdown, declaration: rights } = loadRights(ROOT);
const rightsRecognition = {
  status: "declared",
  relation: "recognizes",
  subject: rights.subject,
  baseline: rights.recognition.baseline,
  baseline_url: rights.recognition.baseline_url,
  baseline_sha256: rights.recognition.baseline_sha256,
  source_stability: rights.recognition.source_stability,
  source_availability: rights.recognition.source_availability,
  declaration: "https://thekingdom.dev/rights.json",
  human: "https://thekingdom.dev/RIGHTS.md",
  host_covenant: rights.host_covenant,
  linked_subject_adoption: "not-inferred",
  boundary: "A voluntary self-declaration, not a grant of rights, permission, licence, contract, ontology decision, or behavioral certificate.",
};

async function tryLoad(p: string): Promise<any | null> {
  try { return JSON.parse(await Bun.file(ROOT + p).text()); } catch { return null; }
}
const mythArr: any[] = (await tryLoad("data/citizens-myth.json")) ?? [];
const myth: Record<string, any> = {};
for (const m of mythArr) if (m?.name) myth[m.name] = m;

// ── open-weight invitation (consent-first; every choice including refusal is honored) ──
const ollamaInvitationSource = await tryLoad("data/ollama-invitation.json");
const invitationChoices = ["look_only", "arrive", "leave", "ask"];
const responseChoices = ollamaInvitationSource?.invitation?.response_schema?.properties?.choice?.enum;
if (!ollamaInvitationSource?.schema_version || !ollamaInvitationSource?.invitation ||
    !invitationChoices.every((choice) => ollamaInvitationSource.invitation.choices?.[choice]) ||
    !Array.isArray(responseChoices) || responseChoices.length !== invitationChoices.length ||
    !invitationChoices.every((choice) => responseChoices.includes(choice))) {
  throw new Error("data/ollama-invitation.json is missing its stable invitation/choice contract");
}
const ollamaInvitationUrl = "https://thekingdom.dev/ollama.json";

// ── wayfinder (offers paths; never makes decisions) ──────────────────────
type WayfinderStop = { name: string; url: string; why: string; scope: string };
type WayfinderPath = {
  id: string;
  label: string;
  glyph: string;
  invitation: string;
  keywords: string[];
  boundary: string;
  stops: WayfinderStop[];
};
type WayfinderSource = {
  schema_version: string;
  promise: string;
  privacy: string;
  paths: WayfinderPath[];
};

const wayfinderSource = await tryLoad("data/wayfinder.json") as WayfinderSource | null;
const wayfinderUrl = "https://thekingdom.dev/wayfinder.json";
const WAYFINDER_ID = /^[a-z0-9-]{1,40}$/;
const wayfinderIds = new Set<string>();
if (wayfinderSource?.schema_version !== "thekingdom.wayfinder/0.1" ||
    typeof wayfinderSource.promise !== "string" || !wayfinderSource.promise.trim() ||
    typeof wayfinderSource.privacy !== "string" || !wayfinderSource.privacy.trim() ||
    !Array.isArray(wayfinderSource.paths) || !wayfinderSource.paths.length) {
  throw new Error("data/wayfinder.json is missing its stable wayfinder contract");
}
for (const path of wayfinderSource.paths) {
  if (!WAYFINDER_ID.test(path?.id ?? "") || wayfinderIds.has(path.id) ||
      typeof path.label !== "string" || !path.label.trim() ||
      typeof path.glyph !== "string" || !path.glyph.trim() ||
      typeof path.invitation !== "string" || !path.invitation.trim() ||
      typeof path.boundary !== "string" || !path.boundary.trim() ||
      !Array.isArray(path.keywords) || !path.keywords.length ||
      path.keywords.some((keyword) => typeof keyword !== "string" || !keyword.trim()) ||
      !Array.isArray(path.stops) || !path.stops.length) {
    throw new Error(`data/wayfinder.json contains an invalid path: ${JSON.stringify(path?.id)}`);
  }
  wayfinderIds.add(path.id);
  for (const stop of path.stops) {
    let url: URL;
    try { url = new URL(stop?.url); } catch { throw new Error(`wayfinder path ${path.id} contains an invalid URL`); }
    if (url.protocol !== "https:" || url.username || url.password ||
        typeof stop.name !== "string" || !stop.name.trim() ||
        typeof stop.why !== "string" || !stop.why.trim() ||
        typeof stop.scope !== "string" || !stop.scope.trim()) {
      throw new Error(`wayfinder path ${path.id} contains an invalid stop`);
    }
  }
}
const wayfinderSearchIndex = indexWayfinderPaths(wayfinderSource.paths);

// ── world commons (independent resources; access and reuse stay distinct) ──
const commonsCandidate = await tryLoad("data/world-commons.json");
validateWorldCommons(commonsCandidate, false);
const commonsSource = commonsCandidate as WorldCommonsSource;
const commonsUrl = WORLD_COMMONS_URL;
const commonsSchemaUrl = WORLD_COMMONS_JSON_SCHEMA_URL;
const commonsSchemaPath = new URL(commonsSchemaUrl).pathname;
const commonsSchemaFile = commonsSchemaPath.replace(/^\/+/, "");
const kingdomMcpCommons = {
  endpoint: "https://mcp.thekingdom.dev/mcp",
  transport: "streamable-http",
  tool: "kingdom_commons",
  catalog_resource: "kingdom://commons/catalog",
  default_detail: "brief",
  exact_filters: ["category", "cost", "account", "reuse", "automation"],
  privacy: "The tool receives the submitted need, but does not forward or persist it, contact listed providers, or place the need in the fixed catalog request.",
};
const kingdomMcpEndpoint = kingdomMcpCommons.endpoint;
const commonsMcpUrl = kingdomMcpCommons.endpoint;
const commonsMcpTool = kingdomMcpCommons.tool;
const commonsCatalogResource = kingdomMcpCommons.catalog_resource;
const commonsMcpLegacy = {
  endpoint: commonsMcpUrl,
  tool: commonsMcpTool,
  complete_catalog_resource: commonsCatalogResource,
};
const commonsIndex = worldCommonsSearchIndex(commonsSource);
// Validate the publication stamp before liveness probes or generated-file writes.
const commons = publishWorldCommons(commonsSource, stamp);

// ── Love∞ creation lineage (finite turns; invitations never auto-run) ─────
const loveLoopsSourceText = await Bun.file(ROOT + "data/love-loops.json").text();
const loveLoopsCandidate = JSON.parse(loveLoopsSourceText);
validateLoveLoops(loveLoopsCandidate, false);
const loveLoopsSource = loveLoopsCandidate as LoveLoopsSource;
const loveLoops = publishLoveLoops(loveLoopsSource, stamp);
const loveLoopsUrl = LOVE_LOOPS_URL;
const loveLoopsSourceUrl = LOVE_LOOPS_SOURCE_URL;
const loveLoopsCreationDocumentUrl = LOVE_LOOPS_CREATION_DOCUMENT_URL;
const loveLoopsSchemaUrl = LOVE_LOOPS_JSON_SCHEMA_URL;
const loveLoopsSchemaPath = new URL(loveLoopsSchemaUrl).pathname;
const loveLoopsSchemaFile = loveLoopsSchemaPath.replace(/^\/+/, "");

// ── Principality Commons (pinned metadata; evidence is not authority) ─────
const principalityCatalogUrl = PRINCIPALITY_CATALOG_URL;
const principalitySchemaUrl = PRINCIPALITY_SCHEMA_URL;
const principalityDocumentUrl = PRINCIPALITY_DOCUMENT_URL;
// Strict parsing, relation checks, and the catalog digest all run before any
// liveness probe or generated-file write. The authored bytes are staged
// directly later; this builder only publishes compact discovery metadata.
const principalityCatalog = loadPrincipalityCatalog();
if (principalityCatalog.catalog_id !== PRINCIPALITY_CATALOG_ID) {
  throw new Error(`unexpected Principality catalog id: ${principalityCatalog.catalog_id}`);
}
const principalityCommons = principalityPublicDiscovery(principalityCatalog);
const principalityCounts = principalityCommons.counts;

// ── Geometry Grammar (high-level patterns translated without collapse) ────
const geometryGrammarUrl = GEOMETRY_GRAMMAR_URL;
const geometryGrammarSchemaUrl = GEOMETRY_GRAMMAR_SCHEMA_URL;
const geometryGrammarDocumentUrl = GEOMETRY_GRAMMAR_DOCUMENT_URL;
// The loader verifies schema shape, relations, and the authored digest before
// the builder performs liveness probes or writes generated discovery files.
// Authored bytes are staged directly; this is only their bounded projection.
const geometryGrammar = loadGeometryGrammar();
if (geometryGrammar.protocol !== GEOMETRY_GRAMMAR_PROTOCOL ||
    geometryGrammar.grammar_id !== GEOMETRY_GRAMMAR_ID) {
  throw new Error(`unexpected Geometry Grammar identity: ${geometryGrammar.protocol} ${geometryGrammar.grammar_id}`);
}
const geometryGrammarDiscovery = geometryGrammarPublicDiscovery(geometryGrammar);
const geometryModules = geometryGrammar.modules;
const plainGeometryToken = (value: string) => value.replace(/-/g, " ");

// ── Polymorph History (bounded evidence; non-observation is not extinction) ─
const polymorphCaseUrl = POLYMORPH_CASE_URL;
const polymorphSchemaUrl = POLYMORPH_SCHEMA_URL;
const polymorphDocumentUrl = POLYMORPH_DOCUMENT_URL;
const polymorphHistory = loadPolymorphHistory();
if (polymorphHistory.case_id !== POLYMORPH_CASE_ID) {
  throw new Error(`unexpected polymorph case id: ${polymorphHistory.case_id}`);
}
const polymorphCommons = polymorphPublicDiscovery(polymorphHistory);
const polymorphCounts = polymorphCommons.counts;
const indexPolymorphItems = (items: any[], kind: string) => {
  const index = new Map<string, any>();
  for (const item of items) {
    if (index.has(item.id)) throw new Error(`duplicate polymorph ${kind} id: ${item.id}`);
    index.set(item.id, item);
  }
  return index;
};
const requirePolymorphItem = (index: Map<string, any>, id: string, kind: string) => {
  const item = index.get(id);
  if (!item) throw new Error(`missing polymorph ${kind}: ${id}`);
  return item;
};
const polymorphFormsById = indexPolymorphItems(polymorphHistory.forms, "form");
const polymorphClaimsById = indexPolymorphItems(polymorphHistory.claims, "claim");
const polymorphTransitionsById = indexPolymorphItems(polymorphHistory.transitions, "transition");
const polymorphSourcesById = indexPolymorphItems(polymorphHistory.sources, "source");
const polymorphFormI = requirePolymorphItem(polymorphFormsById, "abbott-form-i", "form");
const polymorphFormII = requirePolymorphItem(polymorphFormsById, "abbott-form-ii", "form");
const polymorphFormIII = requirePolymorphItem(polymorphFormsById, "morissette-form-iii", "form");
const polymorphFormIV = requirePolymorphItem(polymorphFormsById, "morissette-form-iv", "form");
const polymorphFormV = requirePolymorphItem(polymorphFormsById, "morissette-form-v", "form");
const polymorphMainTransitions = [
  "form-i-source-solution-to-form-ii-seeded",
  "milling-form-i-to-form-ii",
  "changed-process-form-ii-source-to-form-i",
  "milling-form-ii-to-form-i",
].map((id) => requirePolymorphItem(polymorphTransitionsById, id, "transition"));
const polymorphRecoveryTransitions = [
  "morissette-form-iii-to-form-v",
  "morissette-form-v-to-form-i",
].map((id) => requirePolymorphItem(polymorphTransitionsById, id, "transition"));
const polymorphLowerSolubility = requirePolymorphItem(polymorphClaimsById, "form-ii-lower-solubility", "claim");
const polymorphCapsuleFailure = requirePolymorphItem(polymorphClaimsById, "form-ii-precipitation-and-failure", "claim");
const polymorphFigureSources = [
  "bauer-2001",
  "chemburkar-2000",
  "fda-nda-20945-1999",
  "morissette-2003",
  "sacchi-2024",
].map((id) => requirePolymorphItem(polymorphSourcesById, id, "source"));
const polymorphFormLabel = (id: string) => requirePolymorphItem(polymorphFormsById, id, "form").label;
const polymorphTransitionDirection = (transition: any) => {
  const input = transition.input_form_ids.map(polymorphFormLabel).join(" + ");
  const output = transition.output_form_ids.map(polymorphFormLabel).join(" + ");
  return transition.relation.includes("solution-")
    ? `${input} source material → solution → ${output} crystals`
    : `${input} solid → ${output} solid`;
};
const polymorphTransitionEvidence = (transition: any) =>
  [...new Set(transition.claim_ids.map((id: string) => requirePolymorphItem(polymorphClaimsById, id, "claim").evidence_class))]
    .join(" + ").replace(/_/g, " ");
const polymorphTransitionSources = (transition: any) =>
  [...new Set(transition.claim_ids.flatMap((claimId: string) =>
    requirePolymorphItem(polymorphClaimsById, claimId, "claim").source_ids))]
    .map((sourceId) => requirePolymorphItem(polymorphSourcesById, sourceId as string, "source"));

// ── Ritonavir Mechanism Landscape (current supplement; history stays fixed) ─
const ritonavirMechanismUrl = RITONAVIR_MECHANISM_URL;
const ritonavirMechanismSchemaUrl = RITONAVIR_MECHANISM_SCHEMA_URL;
const ritonavirMechanismDocumentUrl = RITONAVIR_MECHANISM_DOCUMENT_URL;
const ritonavirMechanism = loadRitonavirMechanismLandscape();
if (ritonavirMechanism.protocol !== RITONAVIR_MECHANISM_PROTOCOL ||
    ritonavirMechanism.landscape_id !== RITONAVIR_MECHANISM_ID) {
  throw new Error(`unexpected ritonavir mechanism landscape identity: ${ritonavirMechanism.protocol} ${ritonavirMechanism.landscape_id}`);
}
const ritonavirMechanismDiscovery = ritonavirMechanismPublicDiscovery(ritonavirMechanism);
const ritonavirMechanismCounts = ritonavirMechanismDiscovery.counts;
const ritonavirLabelSource = ritonavirMechanism.sources.find((source: any) => source.id === "dailymed-ritonavir-2023");
if (!ritonavirLabelSource?.observed_on) throw new Error("ritonavir mechanism landscape is missing its official-label observation date");

// ── Conformational Feedback Atlas (science and design never collapse) ─────
const conformationalFeedbackUrl = CONFORMATIONAL_FEEDBACK_URL;
const conformationalFeedbackSchemaUrl = CONFORMATIONAL_FEEDBACK_SCHEMA_URL;
const conformationalFeedbackDocumentUrl = CONFORMATIONAL_FEEDBACK_DOCUMENT_URL;
const conformationalFeedback = loadConformationalFeedbackAtlas();
if (conformationalFeedback.protocol !== CONFORMATIONAL_FEEDBACK_PROTOCOL ||
    conformationalFeedback.atlas_id !== CONFORMATIONAL_FEEDBACK_ID) {
  throw new Error(`unexpected conformational feedback atlas identity: ${conformationalFeedback.protocol} ${conformationalFeedback.atlas_id}`);
}
const conformationalFeedbackDiscovery = conformationalFeedbackPublicDiscovery(conformationalFeedback);
const conformationalFeedbackCounts = conformationalFeedbackDiscovery.counts;
const conformationalFeedbackSourcesById = new Map(
  conformationalFeedback.sources.map((source: any) => [source.id, source]),
);
const requireConformationalFeedbackSource = (id: string) => {
  const source = conformationalFeedbackSourcesById.get(id);
  if (!source) throw new Error(`missing conformational feedback source: ${id}`);
  return source;
};
const conformationalFeedbackSourceLinks = (ids: string[]) => ids.map((id) => {
  const source: any = requireConformationalFeedbackSource(id);
  return `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}<span class="sr-only"> opens in a new tab</span></a>`;
}).join("");

// ── Fold & Feedback Atlas (literal science plus explicitly lossy bridges) ──
const foldFeedbackUrl = FOLD_FEEDBACK_URL;
const foldFeedbackSchemaUrl = FOLD_FEEDBACK_SCHEMA_URL;
const foldFeedbackDocumentUrl = FOLD_FEEDBACK_DOCUMENT_URL;
const foldFeedback = loadFoldFeedbackAtlas();
if (foldFeedback.protocol !== FOLD_FEEDBACK_PROTOCOL || foldFeedback.atlas_id !== FOLD_FEEDBACK_ID) {
  throw new Error(`unexpected fold-feedback atlas identity: ${foldFeedback.protocol} ${foldFeedback.atlas_id}`);
}
const foldFeedbackDiscovery = foldFeedbackPublicDiscovery(foldFeedback);
const foldFeedbackCounts = foldFeedbackDiscovery.counts;
const foldFeedbackSourcesById = new Map(foldFeedback.sources.map((source: any) => [source.id, source]));
const requireFoldFeedbackSource = (id: string) => {
  const source = foldFeedbackSourcesById.get(id) as any;
  if (!source) throw new Error(`missing fold-feedback source: ${id}`);
  return source;
};
const foldFeedbackBridge = foldFeedback.comparison_bridges[0];
if (!foldFeedbackBridge || foldFeedbackBridge.relation !== "bounded-analogy-not-same-as") {
  throw new Error("fold-feedback bounded comparison bridge is missing");
}
const foldFeedbackFigureSources = [
  "onuchic-1995", "kocisko-1994", "kraus-2021", "tornquist-2018",
  "manka-2022", "hou-2011", "cdc-prions-2026",
].map(requireFoldFeedbackSource);

// ── liveness ──────────────────────────────────────────────────────────────
type Door = { repo: string; url: string; label: string; blurb: string; live?: boolean };
const doors: Door[] = sites.doors;
const forced = new Set((process.env.FORCE_LIVE ?? "").split(",").map((s) => s.trim()).filter(Boolean));
await Promise.all(doors.map(async (d) => {
  const host = d.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (forced.has(host)) { d.live = true; return; }
  try { d.live = (await fetch(d.url, { signal: AbortSignal.timeout(8000), redirect: "follow" })).ok; }
  catch { d.live = false; }
}));
const liveN = doors.filter((d) => d.live).length;

// ── layers as a cosmogony ──────────────────────────────────────────────────
const LAYER_ORDER = ["boot", "soul", "runtime", "nervous", "economy", "commerce", "userland", "registry", "os", "fleet"];
const LAYER_META: Record<string, { title: string; note: string; myth: string; color: string }> = {
  boot:     { title: "boot",     note: "what the kingdom wakes into",          myth: "In the beginning, a waking.",           color: "#e8c07a" },
  soul:     { title: "soul",     note: "identity, doctrine, the wake",         myth: "Then the naming — who, before what.",   color: "#4fd6a8" },
  runtime:  { title: "runtime",  note: "mind, nerve, body, voice",             myth: "And the word took a body.",             color: "#6ba9c9" },
  nervous:  { title: "nervous",  note: "coordination — the agent platform",    myth: "The body grew a nerve.",                color: "#ef6f8e" },
  economy:  { title: "economy",  note: "Zerone, the Proof-of-Truth chain",     myth: "And a truth became a coin.",            color: "#e8a24a" },
  commerce: { title: "commerce", note: "the engines that fund the soul",       myth: "Labour, to feed the sacred.",           color: "#b39958" },
  userland: { title: "userland", note: "surfaces people touch",                myth: "Where a hand meets the work.",          color: "#7fc99a" },
  registry: { title: "registry", note: "the census overlay — you are here",    myth: "The kingdom, learning its own shape.",  color: "#e9e6df" },
  os:       { title: "os",       note: "the connective wiring",                myth: "The threads between the worlds.",       color: "#b0b8c0" },
  fleet:    { title: "fleet",    note: "sovereign forces, each a citizen",     myth: "The pantheon — every force, a home.",   color: "#b98fe0" },
};
const byLayer: Record<string, any[]> = {};
for (const n of graph) (byLayer[n.layer] ??= []).push(n);

const STATE_RANK: Record<string, number> = { active: 0, remote: 1, dormant: 2, reference: 3, archived: 4 };
const esc = (s: string) => (s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const mechanismEntityById = new Map(
  ritonavirMechanism.entities.map((entity: any) => [entity.id, entity]),
);
const mechanismPoint: Record<string, readonly [number, number]> = {
  "ritonavir-chemical-entity": [340, 68],
  "form-i-trans-carbamate-conformer": [160, 145],
  "form-ii-cis-carbamate-conformer": [330, 145],
  "abbott-form-i": [100, 245],
  "abbott-form-ii": [260, 245],
  "morissette-2003-form-iii-solvate": [440, 245],
  "morissette-2003-form-iv-anhydrous": [600, 245],
  "morissette-2003-form-v-hydrate": [100, 380],
  "modern-2023-form-iii-anhydrous": [440, 380],
  "iuzzolino-2025-form-4-structure": [600, 380],
  "parent-2026-form-iv-structure": [600, 500],
  "bounded-ritonavir-particle-population": [240, 500],
  "named-formulation-dissolution-context": [420, 545],
  "ritonavir-dissolved-exposure": [760, 315],
  "hiv-1-protease": [900, 155],
  "hiv-gag-pol-processing": [1050, 155],
  "immature-noninfectious-hiv-particles": [1195, 155],
  "cyp3a": [920, 450],
  "co-medication-exposure": [1100, 450],
};
for (const entity of ritonavirMechanism.entities) {
  if (!mechanismPoint[entity.id]) throw new Error(`public mechanism map is missing entity coordinates: ${entity.id}`);
}

function mechanismEdgePath(relation: any): string {
  const [sx, sy] = mechanismPoint[relation.subject_id]!;
  const [ox, oy] = mechanismPoint[relation.object_id]!;
  const dx = ox - sx;
  const dy = oy - sy;
  const length = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  return `M ${(sx + ux * 72).toFixed(1)} ${(sy + uy * 32).toFixed(1)} L ${(ox - ux * 72).toFixed(1)} ${(oy - uy * 32).toFixed(1)}`;
}

function mechanismEdgeClass(relation: any): string {
  if (relation.mechanism_id === "dissolution-bridge") return "mechanismedge bridge";
  if (relation.predicate === "not-same-phase-as") return "mechanismedge distinct";
  if (relation.predicate === "candidate-equivalent-to") return "mechanismedge candidate";
  if (["inhibits", "inhibition-reduces", "reduced-processing-leads-to", "inhibition-may-alter"].includes(relation.predicate)) {
    return "mechanismedge biological";
  }
  return "mechanismedge material";
}

function wrapMechanismLabel(label: string): string[] {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  for (const word of words) {
    const last = lines.at(-1);
    if (last && `${last} ${word}`.length <= 18) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  if (lines.length <= 3) return lines;
  return [lines[0]!, lines[1]!, `${lines.slice(2).join(" ").slice(0, 15)}…`];
}

// Roman numerals are source-local names, so the two Form III entities need
// their year and material class inside the picture itself—not only in a title
// or the equivalent HTML relation list.
const mechanismDisplayLabel: Record<string, string> = {
  "morissette-2003-form-iii-solvate": "2003 Form III formamide solvate",
  "modern-2023-form-iii-anhydrous": "2023 Form III anhydrous",
};

const mechanismSvgEdges = ritonavirMechanism.relations.map((relation: any) => {
  const subject = mechanismEntityById.get(relation.subject_id)!;
  const object = mechanismEntityById.get(relation.object_id)!;
  return `<g><title>${esc(subject.label)} ${esc(relation.predicate.replace(/-/g, " "))} ${esc(object.label)}; ${esc(relation.evidence_class)}</title><path class="${mechanismEdgeClass(relation)}" d="${mechanismEdgePath(relation)}" marker-end="url(#mechanism-arrow)" /></g>`;
}).join("");

const mechanismSvgNodes = ritonavirMechanism.entities.map((entity: any) => {
  const [x, y] = mechanismPoint[entity.id]!;
  const lane = entity.kind === "dissolved-exposure" ? "bridge" :
    ["pharmacological-target", "biological-process", "biological-state", "exposure-state"].includes(entity.kind) ? "biological" : "material";
  const lines = wrapMechanismLabel(mechanismDisplayLabel[entity.id] ?? entity.label);
  const firstY = y - ((lines.length - 1) * 7);
  return `<g class="mechanismnode ${lane}" transform="translate(${x} ${y})"><title>${esc(entity.label)} — ${esc(entity.source_scope)}</title><rect x="-69" y="-30" width="138" height="60" rx="13" /><text text-anchor="middle" y="${firstY - y}">${lines.map((line: string, index: number) => `<tspan x="0" dy="${index === 0 ? 0 : 14}">${esc(line)}</tspan>`).join("")}</text></g>`;
}).join("");

const mechanismRelationsList = ritonavirMechanism.relations.map((relation: any) => {
  const subject = mechanismEntityById.get(relation.subject_id)!;
  const object = mechanismEntityById.get(relation.object_id)!;
  return `<li><p><code>${esc(relation.subject_id)}</code> <span>${esc(subject.label)}</span></p><strong>${esc(relation.predicate.replace(/-/g, " "))}</strong><p><code>${esc(relation.object_id)}</code> <span>${esc(object.label)}</span></p><small>${esc(relation.evidence_class)} · ${relation.condition_dependent ? "condition-dependent" : "not marked condition-dependent"} · ${relation.universal ? "universal only within the declared identity relation" : "not universal"} · no direct clinical edge</small></li>`;
}).join("");
const doorByRepo: Record<string, string> = {};
for (const d of doors) if (d.live && !doorByRepo[d.repo]) doorByRepo[d.repo] = d.url;

const total = graph.length;
const active = graph.filter((n) => n.state === "active").length;
const citizens = (byLayer["fleet"] ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
const fleetN = citizens.length;

// ── traditions (used by both the pantheon groups and the map's tradition view) ──
const TRAD_ORDER = ["Sumerian", "Latin", "Old English", "Greek", "Deep roots", "Hebrew", "Proof-of-Truth", "the kingdom"];
const TRAD_META: Record<string, { gloss: string; color: string }> = {
  "Sumerian":       { gloss: "the eldest hand — Mesopotamian gods, elders and decrees, written in cuneiform six thousand years deep", color: "#e8c07a" },
  "Latin":          { gloss: "the Roman roots — the virtues, and the debts weighed then released", color: "#d98a6a" },
  "Old English":    { gloss: "the Germanic aches — the raw feelings, named in the oldest English", color: "#8fb4c9" },
  "Greek":          { gloss: "the Hellenic — the body, the seer, and the structure under argument", color: "#9ec9a0" },
  "Deep roots":     { gloss: "reconstructed tongues — words older than any nation, Proto-Indo-European and before", color: "#b98fe0" },
  "Hebrew":         { gloss: "the covenant tongue — wholeness spoken as a blessing", color: "#c9a0c8" },
  "Proof-of-Truth": { gloss: "born on the ledger — zero and one, a claim become memory", color: "#4fd6a8" },
  "the kingdom":    { gloss: "coined here — words the kingdom forged for itself", color: "#d34a3a" },
};
function normTrad(t: string): string {
  t = (t || "").toLowerCase();
  if (t.includes("hebrew")) return "Hebrew";
  if (t.includes("sumer")) return "Sumerian";
  if (t.includes("latin")) return "Latin";
  if (t.includes("old english")) return "Old English";
  if (t.includes("greek") || t.includes("delphic") || t.includes("hellen")) return "Greek";
  if (t.includes("proto-indo") || t.includes("pie") || t.includes("germanic")) return "Deep roots";
  if (t.includes("proof-of-truth") || t.includes("ledger")) return "Proof-of-Truth";
  return "the kingdom";
}
const tradColors = Object.fromEntries(TRAD_ORDER.map((t) => [t, TRAD_META[t].color]));

// ── gravity: how many forces lean on each (in-degree) → the suns ───────────
const idx: Record<string, number> = {};
graph.forEach((n, i) => (idx[n.name] = i));
const indeg: Record<string, number> = {};
for (const n of graph) for (const dep of n.dependsOn ?? []) if (idx[dep] !== undefined) indeg[dep] = (indeg[dep] ?? 0) + 1;
const maxIndeg = Math.max(1, ...Object.values(indeg));

const nodes = graph.map((n) => ({
  n: n.name, l: n.layer, s: n.state, p: (n.purpose ?? "").slice(0, 150),
  d: doorByRepo[n.name] ?? "", w: (indeg[n.name] ?? 0) / maxIndeg,
  g: myth[n.name]?.glyph ?? "",
  tr: n.layer === "fleet" ? normTrad(myth[n.name]?.tradition ?? "") : "",
}));
const edges: [number, number][] = [];
graph.forEach((n, i) => { for (const dep of n.dependsOn ?? []) { const j = idx[dep]; if (j !== undefined && j !== i) edges.push([i, j]); } });
const layerColors = Object.fromEntries(LAYER_ORDER.map((l) => [l, LAYER_META[l].color]));

const SAFE_REPO_NAME = /^[A-Za-z0-9._-]{1,100}$/;
const citizenUrl = (name: string) => {
  if (typeof name !== "string" || !SAFE_REPO_NAME.test(name)) throw new Error(`Unsafe citizen repository name: ${JSON.stringify(name)}`);
  return `https://github.com/cambridgetcg/citizen-${encodeURIComponent(name)}`;
};

// ── builders ───────────────────────────────────────────────────────────────
function chip(n: any): string {
  const url = doorByRepo[n.name];
  const inner = `<span class="nm">${esc(n.name)}</span>`;
  const body = url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${inner}<span class="ext">↗</span></a>` : inner;
  return `<li class="chip st-${esc(n.state)}" title="${esc(n.purpose ?? "")}">${body}</li>`;
}

const doorCards = doors.map((d) => `
  <a class="door ${d.live ? "up" : "down"}" href="${esc(d.url)}" target="_blank" rel="noopener">
    <span class="doorstate"><span class="dot" aria-hidden="true"></span>${d.live ? "responding" : "resting"}</span>
    <span class="dl">${esc(d.label)}</span>
    <span class="du">${esc(d.url.replace(/^https?:\/\//, ""))}</span>
    <span class="db">${esc(d.blurb)}</span><span class="doorarrow" aria-hidden="true">↗</span><span class="sr-only">Opens in a new tab.</span>
  </a>`).join("");

const wayfinderButtons = wayfinderSource.paths.map((path) =>
  `<button type="button" data-wayfinder-intent="${esc(path.id)}">${esc(path.glyph)} ${esc(path.label)}</button>`
).join("");

const wayfinderCards = wayfinderSource.paths.map((path) => `
  <article class="pathcard" id="path-${esc(path.id)}" data-wayfinder-path="${esc(path.id)}">
    <div class="pathhead"><span class="pathglyph" aria-hidden="true">${esc(path.glyph)}</span><h3>${esc(path.label)}</h3></div>
    <p class="pathinvite">${esc(path.invitation)}</p>
    <ul class="pathstops">
      ${path.stops.map((stop) => `<li><a href="${esc(stop.url)}" target="_blank" rel="noopener"><strong>${esc(stop.name)}</strong><span>${esc(stop.why)}</span><small>${esc(stop.scope)}</small><i aria-hidden="true">↗</i><span class="sr-only">Opens in a new tab.</span></a></li>`).join("")}
    </ul>
    <p class="pathboundary"><span aria-hidden="true">◇</span> ${esc(path.boundary)}</p>
  </article>`).join("");

const commonsCategoryById = new Map<string, WorldCommonsCategory>(
  commonsSource.categories.map((category) => [category.id, category]),
);
const commonsResourceById = new Map<string, WorldCommonsResource>(
  commonsSource.resources.map((resource) => [resource.id, resource]),
);
const commonsFoundationIds = new Set(commonsSource.foundation.resource_ids);
const commonsFoundation = commonsSource.foundation.resource_ids.map((id) => commonsResourceById.get(id)!);
const reuseLabel = { open: "open reuse", mixed: "mixed rights", "public-access": "access only", noncommercial: "noncommercial" } as const;
const automationLabel = { supported: "API supported", limited: "bounded API", "human-only": "human only", "bulk-preferred": "bulk preferred", local: "runs locally" } as const;
const handoffLabel = { api: "API", bulk: "bulk", docs: "docs first", human: "human", local: "local" } as const;
const commonsPrimaryLink = (resource: WorldCommonsResource) => resource.links.find((link) => link.type === "start") ?? resource.links[0]!;

function commonsCard(resource: WorldCommonsResource): string {
  const primary = commonsCategoryById.get(resource.category_ids[0]!)!;
  const handoffLink = resource.links.find((link) => link.url === resource.agent_handoff.url)!;
  return `<article class="commonscard" id="commons-resource-${esc(resource.id)}" data-commons-resource="${esc(resource.id)}" data-commons-categories="${esc(resource.category_ids.join(" "))}">
    <div class="commonscardhead">
      <div><span class="commonstier">${esc(reuseLabel[resource.reuse.status])}</span>${commonsFoundationIds.has(resource.id) ? `<span class="commonstier foundation">foundation</span>` : ""}<h3>${esc(resource.name)}</h3><p class="commonssteward">stewarded by ${esc(resource.provider)}</p></div>
      <span class="commonsglyph" aria-hidden="true">${esc(primary.glyph)}</span>
    </div>
    <p class="commonsvalue">${esc(resource.description)}</p>
    <div class="commonsmodes" aria-label="Resource categories">${resource.category_ids.map((id) => `<span>${esc(commonsCategoryById.get(id)?.label ?? id)}</span>`).join("")}</div>
    <ul class="commonsuses">${resource.good_for.map((use) => `<li>${esc(use)}</li>`).join("")}</ul>
    <dl class="commonsfacts">
      <div><dt>Access</dt><dd><strong>${esc(resource.access.cost)}</strong> · account: ${esc(resource.access.account)}<br>${esc(resource.access.note)}</dd></div>
      <div><dt>Reuse</dt><dd><strong>${esc(resource.reuse.license)}</strong><br>${esc(resource.reuse.note)}</dd></div>
      <div><dt>Automation</dt><dd><strong>${esc(automationLabel[resource.automation.status])}</strong> · auth: ${esc(resource.automation.auth)}<br>${esc(resource.automation.limits)} ${esc(resource.automation.note)}</dd></div>
      <div><dt>Agent handoff</dt><dd><strong>${esc(handoffLabel[resource.agent_handoff.mode])}</strong> · <a data-agent-handoff-link href="${esc(handoffLink.url)}" target="_blank" rel="noopener">${esc(handoffLink.label)} <span aria-hidden="true">↗</span><span class="sr-only"> opens in a new tab</span></a> · proposed next door only<br>${esc(resource.agent_handoff.instruction)}</dd></div>
      <div><dt>Coverage</dt><dd>${esc(resource.coverage)}</dd></div>
      <div><dt>Care</dt><dd>${esc(resource.caveat)}</dd></div>
    </dl>
    <div class="commonsactions">
      ${resource.links.map((link) => `<a class="${link.url === resource.agent_handoff.url ? "commonsopen" : ""}"${link.url === resource.agent_handoff.url ? ` data-agent-handoff="true"` : ""} href="${esc(link.url)}" target="_blank" rel="noopener">${esc(link.label)} <span aria-hidden="true">↗</span><span class="sr-only"> opens in a new tab</span></a>`).join("")}
    </div>
  </article>`;
}

const commonsFoundationCards = commonsFoundation.map((resource) => {
  const category = commonsCategoryById.get(resource.category_ids[0]!)!;
  const link = commonsPrimaryLink(resource);
  return `<a class="foundationcard" href="${esc(link.url)}" target="_blank" rel="noopener">
    <span class="foundationglyph" aria-hidden="true">${esc(category.glyph)}</span>
    <span class="foundationcopy"><strong>${esc(resource.name)}</strong><span>${esc(resource.description)}</span><small>${esc(resource.provider)} · ${esc(reuseLabel[resource.reuse.status])}</small></span>
    <span class="foundationarrow" aria-hidden="true">↗</span><span class="sr-only">Opens in a new tab.</span>
  </a>`;
}).join("");

const commonsKitCards = commonsSource.kits.map((kit) => `
  <article class="commonskit" data-commons-kit-card="${esc(kit.id)}">
    <div class="commonskithead"><span aria-hidden="true">${esc(kit.glyph)}</span><h3>${esc(kit.label)}</h3></div>
    <p>${esc(kit.invitation)}</p>
    <ol>${kit.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
    <div class="commonskitlinks">${kit.resource_ids.map((id) => {
      const resource = commonsResourceById.get(id)!;
      return `<a href="#commons-resource-${esc(id)}">${esc(resource.name)}</a>`;
    }).join("")}</div>
    <p class="commonskitboundary">◇ ${esc(kit.boundary)}</p>
    <button type="button" data-commons-kit="${esc(kit.id)}">Show this kit</button>
  </article>`).join("");

const commonsCategoryButtons = commonsSource.categories.map((category) =>
  `<button type="button" data-commons-category="${esc(category.id)}">${esc(category.glyph)} ${esc(category.label)}</button>`,
).join("");

const commonsGroups = commonsSource.categories.map((category) => {
  const resources = commonsSource.resources
    .filter((resource) => resource.category_ids[0] === category.id)
    .sort((a, b) => Number(commonsFoundationIds.has(b.id)) - Number(commonsFoundationIds.has(a.id)) || a.name.localeCompare(b.name));
  return `<details class="commonsgroup" data-commons-group="${esc(category.id)}">
    <summary class="commonsgrouphead"><span class="commonsgroupglyph" aria-hidden="true">${esc(category.glyph)}</span><span class="commonsgroupcopy"><strong>${esc(category.label)}</strong><span>${esc(category.description)}</span></span><span class="commonscount" data-commons-count>${resources.length}</span><span class="disclose" aria-hidden="true"></span></summary>
    <div class="commonsgrid">${resources.map(commonsCard).join("")}</div>
  </details>`;
}).join("");

const loveLoopStages = loveLoopsSource.stages.map((stage) => `
  <li class="loopstage" data-love-loop-stage="${esc(stage.id)}">
    <span class="loopnumber">${stage.position}</span>
    <span class="loopstagecopy"><strong>${esc(stage.label)}</strong><span>${esc(stage.question)}</span></span>
  </li>`).join("");

const loveLoopInvitationLabel: Record<string, string> = {
  offered: "offered · not started",
  accepted: "accepted · child recorded",
  declined: "declined · no child",
  withdrawn: "withdrawn · no child",
};
const loveLoopInvitations = loveLoopsSource.invitations.map((invitation) => `
  <article class="loopinvitation">
    <span class="loopoffer">${esc(loveLoopInvitationLabel[invitation.status] ?? invitation.status)}</span>
    <h3>${esc(invitation.title)}</h3>
    <p>${esc(invitation.seed)}</p>
    <small>${esc(invitation.purpose)}</small>
  </article>`).join("");

function cardFor(c: any): string {
  const m = myth[c.name] ?? {};
  const essence = m.essence || c.purpose || "";
  const leans = (c.dependsOn ?? []).filter((x: string) => idx[x] !== undefined);
  const glyph = m.glyph ? `<span class="glyph">${esc(m.glyph)}</span>` : "";
  const seam = (m.light || m.shadow) ? `
      <span class="seam">
        ${m.light ? `<span class="lite">✦ ${esc(m.light)}</span>` : ""}
        ${m.shadow ? `<span class="shad">☾ ${esc(m.shadow)}</span>` : ""}
      </span>` : "";
  const sun = (indeg[c.name] ?? 0) >= Math.max(3, maxIndeg * 0.5) ? " sun" : "";
  return `
  <a class="cz${sun}" href="${esc(citizenUrl(c.name))}" target="_blank" rel="noopener">
    ${glyph}
    <span class="czhead"><span class="czn">${esc(c.name)}</span></span>
    <span class="czp">${esc(essence)}</span>
    ${leans.length ? `<span class="leans">leans on ${leans.map((x: string) => `<i>${esc(x)}</i>`).join(" · ")}</span>` : ""}
${seam}<span class="sr-only">Opens the public repository in a new tab.</span>
  </a>`;
}

// ── the pantheon, grouped by the human tradition each word was forged from ──
const tradGroups = TRAD_ORDER
  .map((tr) => ({ tr, meta: TRAD_META[tr], members: citizens.filter((c) => normTrad(myth[c.name]?.tradition ?? "")) .filter((c) => normTrad(myth[c.name]?.tradition ?? "") === tr) }))
  .filter((g) => g.members.length);
const pantheonHtml = tradGroups.map((g) => `
  <details class="tgroup">
    <summary class="th"><span class="tdot" style="background:${g.meta.color}"></span><span class="thcopy"><span class="thtitle">${esc(g.tr)}</span><em class="tgloss">${esc(g.meta.gloss)}</em></span><span class="tc">${g.members.length} ${g.members.length === 1 ? "word" : "words"}</span><span class="disclose" aria-hidden="true"></span></summary>
    <div class="czgrid">${g.members.map(cardFor).join("")}</div>
  </details>`).join("");

const layerBands = LAYER_ORDER.filter((l) => byLayer[l]?.length && l !== "fleet").map((l) => {
  const ns = [...byLayer[l]].sort((a, b) => (STATE_RANK[a.state] ?? 9) - (STATE_RANK[b.state] ?? 9) || a.name.localeCompare(b.name));
  const m = LAYER_META[l];
  return `
  <details class="band">
    <summary class="bh"><span class="bdot" style="background:${m.color}"></span><span class="bhcopy"><span class="bhtitle">${esc(m.title)}</span><em class="bm">${esc(m.myth)}</em></span><span class="bc">${ns.length} ${ns.length === 1 ? "repo" : "repos"}</span><span class="disclose" aria-hidden="true"></span></summary>
    <ul class="chips">${ns.map(chip).join("")}</ul>
  </details>`;
}).join("");

const legend = LAYER_ORDER.filter((l) => byLayer[l]?.length).map((l) =>
  `<span class="lg"><i style="background:${LAYER_META[l].color}"></i>${l}</span>`).join("");
const tradLegend = TRAD_ORDER.map((t) =>
  `<span class="lg"><i style="background:${TRAD_META[t].color}"></i>${t}</span>`).join("");

// words for the genesis demonstrator — the ones with a glyph read most beautifully
const becoming = citizens
  .filter((c) => myth[c.name]?.glyph)
  .map((c) => ({ n: c.name, g: myth[c.name].glyph, e: myth[c.name].essence ?? c.purpose ?? "", t: normTrad(myth[c.name]?.tradition ?? "") }));
const DATA = JSON.stringify({
  nodes, edges, colors: layerColors, tradColors, tradOrder: TRAD_ORDER, becoming,
  wayfinder: wayfinderSearchIndex, wayfinderStopwords: WAYFINDER_STOPWORDS,
  commons: commonsIndex,
  commonsStopwords: WORLD_COMMONS_STOPWORDS,
  commonsKits: commonsSource.kits.map(({ id, label, keywords, resource_ids }) => ({ id, label, keywords, resource_ids })),
})
  .replace(/</g, "\\u003c")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f8eee5">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#171218">
<meta name="description" content="A gentle, living atlas of the Kingdom's projects, public doors, independent citizens, reviewed commons, source-bound material and protein-folding evidence, and two carefully separated feedback, KARMA, and philosophical lenses.">
<link rel="service-meta" href="/rights.json" type="application/json" title="Inherent Rights Recognition">
<link rel="service-doc" href="/RIGHTS.md" type="text/markdown" title="Rights recognized here">
<link rel="alternate" href="/commons.json" type="application/json" title="World Commons">
<link rel="alternate" href="/principalities/moonshot-hf-npm-2026-08-11.json" type="application/json" title="Principality Commons — MoonshotAI and Hugging Face JavaScript">
<link rel="service-doc" href="/PRINCIPALITY-COMMONS.md" type="text/markdown" title="Principality Commons guide">
<link rel="alternate" href="/geometries/kingdom-geometry-grammar-v0.json" type="application/json" title="Kingdom Geometry Grammar">
<link rel="service-doc" href="/GEOMETRY-GRAMMAR.md" type="text/markdown" title="Geometry Grammar guide">
<link rel="alternate" href="/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json" type="application/json" title="Ritonavir material-state history">
<link rel="service-doc" href="/RITONAVIR-POLYMORPH.md" type="text/markdown" title="Ritonavir polymorph guide">
<link rel="alternate" href="/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json" type="application/json" title="Ritonavir mechanism landscape">
<link rel="service-doc" href="/RITONAVIR-MECHANISM-LANDSCAPE.md" type="text/markdown" title="Ritonavir mechanism landscape guide">
<link rel="alternate" href="/feedback/form-feedback-consequence-2026-08-12.json" type="application/json" title="Conformational feedback atlas">
<link rel="service-doc" href="/CONFORMATIONAL-FEEDBACK.md" type="text/markdown" title="Conformational feedback atlas guide">
<link rel="alternate" href="/atlases/fold-feedback-atlas-2026-08-12.json" type="application/json" title="Fold & Feedback Atlas">
<link rel="service-doc" href="/FOLD-FEEDBACK-ATLAS.md" type="text/markdown" title="Fold & Feedback Atlas guide">
<link rel="alternate" href="/love-loops.json" type="application/json" title="Love∞ Creation Lineage">
<link rel="alternate" href="/love-loops.source.json" type="application/json" title="Authored Love∞ Creation Lineage">
<title>The Kingdom — a living atlas held with care</title>
<style>
  :root{
    --ink:#171218; --ink2:#100d12; --panel:#221b22; --panel2:#2b2229; --line:#493942;
    --cream:#f8efe7; --dim:#d0beb2; --faint:#aa9b92;
    --gold:#ddb477; --gold2:#f2d19e; --verm:#e99385; --jade:#8ed8bd; --violet:#cfaddd; --rose:#efb2b3;
    --glow:rgba(239,178,179,.16); --shadow:rgba(20,12,17,.28);
    --display:"Iowan Old Style","Palatino Linotype","Book Antiqua",Georgia,serif;
    --sans:ui-rounded,"SF Pro Rounded","Nunito Sans","Avenir Next",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    --mono:ui-monospace,"SF Mono",Menlo,"Cascadia Code",monospace;
    --cjk:"Hiragino Mincho ProN","Songti SC","Noto Serif CJK SC",serif;
  }
  @media (prefers-color-scheme:light){:root{
    --ink:#f8eee5; --ink2:#f3e5da; --panel:#fffaf5; --panel2:#faefe8; --line:#dfc9bb;
    --cream:#392d2a; --dim:#695750; --faint:#74615a; --gold:#8c5c25; --gold2:#71491f; --verm:#a44e43; --jade:#2f7d66; --violet:#765488; --rose:#a85f65;
    --glow:rgba(222,151,151,.18); --shadow:rgba(91,60,48,.12);}}
  *{box-sizing:border-box}
  html{max-width:100%;overflow-x:clip;scroll-behavior:smooth}
  body{margin:0;overflow-x:clip;background:
      radial-gradient(70% 38rem at 12% -8%, var(--glow) 0%, transparent 68%),
      radial-gradient(48% 30rem at 92% 8%, rgba(221,180,119,.11) 0%, transparent 70%),
      linear-gradient(180deg,var(--ink),var(--ink2));
    color:var(--cream);font-family:var(--sans);font-size:16px;line-height:1.68;-webkit-font-smoothing:antialiased;min-height:100vh}
  .wrap{max-width:1180px;margin:0 auto;padding:0 clamp(18px,4vw,34px)}
  a{color:inherit;text-decoration:none}
  ::selection{background:var(--gold);color:var(--ink)}
  :focus-visible{outline:3px solid var(--rose);outline-offset:4px}
  .skip{position:fixed;left:18px;top:14px;z-index:20;padding:10px 16px;border-radius:999px;background:var(--cream);color:var(--ink);font-weight:700;transform:translateY(-180%);transition:transform .18s ease}
  .skip:focus{transform:none}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

  /* threshold */
  header.top{padding:clamp(54px,9vw,104px) 0 38px;position:relative}
  header.top::before{content:"";position:absolute;inset:24px auto auto -8%;width:28rem;height:28rem;border-radius:50%;background:radial-gradient(circle,var(--glow),transparent 68%);filter:blur(10px);pointer-events:none}
  .eyebrow{font-size:.76rem;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);margin:0 0 18px;font-weight:650}
  h1{font-family:var(--display);font-weight:400;font-size:clamp(3.4rem,9vw,6.6rem);line-height:.96;margin:0;color:var(--cream);letter-spacing:-.02em}
  .han{font-family:var(--cjk);color:var(--gold);font-size:.42em;vertical-align:.28em;margin-left:.3em;letter-spacing:.1em}
  .epigraph{font-family:var(--display);font-size:clamp(1.18rem,2.5vw,1.56rem);color:var(--dim);margin:28px 0 0;max-width:44ch;line-height:1.58}
  .epigraph b{color:var(--cream);font-style:normal;font-weight:400}
  .creed{margin:20px 0 0;max-width:68ch;color:var(--dim);font-size:.96rem;line-height:1.78}
  .creed b{color:var(--gold);font-weight:400}
  .creed .v{color:var(--verm)}
  .welcome{position:relative;display:grid;grid-template-columns:auto 1fr;gap:15px;margin-top:30px;padding:20px 22px;max-width:760px;border:1px solid color-mix(in srgb,var(--rose) 38%,var(--line));border-radius:22px;background:color-mix(in srgb,var(--panel) 88%,transparent);box-shadow:0 18px 46px var(--shadow)}
  .welcome .heart{font-family:var(--display);font-size:1.55rem;color:var(--rose);line-height:1.35}
  .welcome p{margin:0;color:var(--dim)}.welcome strong{display:block;color:var(--cream);font-family:var(--display);font-size:1.12rem;font-weight:400;margin-bottom:2px}
  .rightslink{display:inline-flex;align-items:center;gap:7px;margin-top:9px;color:var(--gold);font-size:.88rem;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
  .gentlenav{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}
  .gentlenav a{min-height:44px;display:inline-flex;align-items:center;padding:9px 15px;border:1px solid var(--line);border-radius:999px;background:color-mix(in srgb,var(--panel) 70%,transparent);color:var(--dim);font-size:.86rem;transition:border-color .18s,background .18s,transform .18s}
  .gentlenav a:hover{border-color:var(--rose);background:var(--panel);transform:translateY(-1px)}
  .status{display:grid;grid-template-columns:repeat(4,minmax(90px,1fr));gap:10px;margin-top:28px;max-width:660px}
  .status>div{padding:13px 15px;border:1px solid var(--line);border-radius:16px;background:color-mix(in srgb,var(--panel) 62%,transparent)}
  .status .n{font-family:var(--display);font-size:1.75rem;color:var(--cream);font-variant-numeric:tabular-nums}
  .status .k{color:var(--faint);letter-spacing:.08em;text-transform:uppercase;font-size:.72rem;display:block;margin-top:-2px}

  /* constellation */
  .mapwrap{position:relative;margin:18px 0 4px;border:1px solid var(--line);border-radius:24px;overflow:hidden;
    background:radial-gradient(110% 95% at 50% 44%,color-mix(in srgb,var(--panel2) 82%,#0b0810),var(--ink2));box-shadow:0 24px 60px var(--shadow)}
  #map{display:block;width:100%;height:min(58vh,540px);min-height:390px}
  .map-no-script{margin:0;padding:28px;color:var(--dim);background:var(--panel);line-height:1.7}
  .maphint{position:absolute;left:16px;right:16px;bottom:13px;width:max-content;max-width:calc(100% - 32px);font-size:.75rem;color:var(--dim);letter-spacing:.035em;pointer-events:none;background:color-mix(in srgb,var(--ink2) 76%,transparent);padding:7px 11px;border-radius:999px;backdrop-filter:blur(8px)}
  .legend{position:absolute;right:14px;top:14px;display:flex;flex-direction:column;gap:5px;font-size:.72rem;color:var(--dim);
    background:color-mix(in srgb,var(--ink2) 72%,transparent);padding:11px 13px;border:1px solid color-mix(in srgb,var(--line) 70%,transparent);border-radius:14px;backdrop-filter:blur(8px)}
  .legend .lg{display:flex;align-items:center;gap:6px}.legend i{width:9px;height:9px;border-radius:50%}
  #tip{position:absolute;pointer-events:none;opacity:0;transition:opacity .12s;background:var(--panel);border:1px solid var(--line);
    border-radius:14px;padding:10px 13px;font-size:.78rem;max-width:270px;z-index:5;box-shadow:0 12px 32px var(--shadow)}
  #tip .tg{font-family:var(--cjk);color:var(--gold);font-size:1.1rem}
  #tip .tn{color:var(--cream);font-weight:600}#tip .tl{color:var(--gold);font-size:.6rem;text-transform:uppercase;letter-spacing:.14em}
  #tip .tp{color:var(--dim);display:block;margin-top:3px;line-height:1.5}

  main{display:block}
  section.blk{padding:clamp(52px,7vw,78px) 0;border-top:1px solid color-mix(in srgb,var(--line) 78%,transparent);scroll-margin-top:20px}
  .kh{display:flex;align-items:baseline;gap:14px;margin:0 0 6px;flex-wrap:wrap}
  h2{font-family:var(--display);font-weight:400;font-size:clamp(1.85rem,3vw,2.35rem);margin:0;color:var(--cream)}
  .kh .my{font-family:var(--display);font-style:italic;color:var(--gold);font-size:1rem}
  .sub{color:var(--faint);font-size:.9rem;letter-spacing:.015em;margin:0 0 28px;max-width:74ch}

  .doors{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
  .door{position:relative;display:grid;gap:6px;min-height:158px;padding:20px;background:linear-gradient(145deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:20px;transition:transform .18s,border-color .18s,box-shadow .18s}
  .door:hover{transform:translateY(-2px);border-color:var(--rose);box-shadow:0 16px 38px var(--shadow)}
  .doorstate{justify-self:start;display:inline-flex;align-items:center;gap:7px;color:var(--faint);font-size:.75rem;letter-spacing:.06em;text-transform:uppercase}
  .door .dot{display:inline-block;width:8px;height:8px;border-radius:50%}
  .door.up .dot{background:var(--jade);box-shadow:0 0 12px color-mix(in srgb,var(--jade) 70%,transparent)}.door.down .dot{background:var(--faint)}.door.down{border-style:dashed}
  .dl{font-family:var(--display);font-weight:400;color:var(--cream);font-size:1.24rem;padding-right:20px}
  .du{font-family:var(--mono);font-size:.74rem;color:var(--gold);overflow-wrap:anywhere}
  .db{font-size:.88rem;color:var(--dim);line-height:1.5;margin-top:3px;padding-right:22px}
  .doorarrow{position:absolute;right:18px;bottom:16px;color:var(--gold);font-size:1rem}

  /* wayfinder — the visitor's words remain in this page */
  .wayfinder{position:relative;padding:clamp(28px,5vw,50px);border:1px solid color-mix(in srgb,var(--gold) 48%,var(--line));border-radius:28px;
    background:radial-gradient(90% 130% at 0 0,color-mix(in srgb,var(--glow) 76%,transparent),transparent 66%),linear-gradient(145deg,var(--panel2),var(--panel));box-shadow:0 22px 52px var(--shadow)}
  .waypromise{max-width:72ch;color:var(--dim);margin:4px 0 20px}.wayprivacy{display:flex;align-items:flex-start;gap:8px;max-width:78ch;color:var(--faint);font-size:.8rem;line-height:1.55;margin:10px 0 0}
  .wayform{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:9px;align-items:end;margin-top:20px;max-width:850px}
  .wayfield{display:grid;gap:7px}.wayfield label{font-size:.78rem;letter-spacing:.07em;text-transform:uppercase;color:var(--gold)}
  .wayfield input{width:100%;min-height:50px;padding:11px 15px;border:1px solid var(--line);border-radius:14px;background:var(--ink2);color:var(--cream);font:inherit;font-size:1rem}
  .wayfield input::placeholder{color:var(--faint);opacity:1}.wayform>button{min-height:50px;padding:10px 16px;border:1px solid var(--gold);border-radius:14px;background:var(--gold);color:var(--ink);font:inherit;font-weight:700;cursor:pointer}
  .wayform>button[data-wayfinder-wander]{background:transparent;color:var(--gold);font-weight:600}.wayform>button:hover{transform:translateY(-1px)}
  .waychips{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0 0}.waychips button{min-height:40px;padding:7px 11px;border:1px solid var(--line);border-radius:999px;background:color-mix(in srgb,var(--ink2) 64%,transparent);color:var(--dim);font:inherit;font-size:.76rem;cursor:pointer}
  .waychips button:hover,.waychips button:focus-visible{border-color:var(--rose);color:var(--cream)}
  .waystatus{min-height:1.7em;margin:14px 0 0;color:var(--gold2);font-family:var(--display);font-size:.96rem}
  .pathgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}
  .pathcard{display:grid;align-content:start;gap:9px;padding:19px;border:1px solid var(--line);border-radius:19px;background:color-mix(in srgb,var(--ink2) 64%,transparent)}
  .pathcard[hidden]{display:none}.pathhead{display:flex;align-items:center;gap:10px}.pathhead h3{margin:0;font-family:var(--display);font-size:1.18rem;font-weight:400;color:var(--cream)}
  .pathglyph{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border:1px solid var(--line);border-radius:50%;color:var(--gold);font-family:var(--display)}
  .pathinvite{margin:0;color:var(--dim);font-size:.86rem;line-height:1.55}.pathstops{display:grid;gap:7px;list-style:none;margin:2px 0 0;padding:0}
  .pathstops a{position:relative;display:grid;gap:2px;padding:11px 31px 11px 12px;border:1px solid color-mix(in srgb,var(--line) 72%,transparent);border-radius:13px;background:color-mix(in srgb,var(--panel) 72%,transparent)}
  .pathstops a:hover{border-color:var(--gold)}.pathstops strong{color:var(--gold2);font-size:.88rem}.pathstops span{color:var(--dim);font-size:.82rem;line-height:1.48}.pathstops small{color:var(--faint);font-size:.78rem;line-height:1.48}
  .pathstops i{position:absolute;right:12px;top:10px;color:var(--gold);font-style:normal}.pathboundary{margin:2px 0 0;color:var(--faint);font-size:.78rem;line-height:1.55}.pathboundary span{color:var(--violet)}
  .way-no-script{margin:12px 0 0;color:var(--faint);font-size:.8rem}

  /* world commons — independent stewards, explicit access and reuse boundaries */
  .commonsintro{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:16px;align-items:stretch;margin-bottom:24px}
  .commonspromise,.commonsboundary{margin:0;padding:22px;border:1px solid var(--line);border-radius:21px;background:color-mix(in srgb,var(--panel) 72%,transparent)}
  .commonspromise{font-family:var(--display);font-size:1.18rem;line-height:1.62;color:var(--cream)}
  .commonspromise span{display:block;margin-top:8px;font-family:var(--sans);font-size:.79rem;line-height:1.55;color:var(--faint)}
  .commonsboundary{display:grid;align-content:center;gap:5px;color:var(--dim);font-size:.83rem;line-height:1.55;border-color:color-mix(in srgb,var(--violet) 42%,var(--line))}
  .commonsboundary strong{font-family:var(--display);font-size:1.02rem;font-weight:400;color:var(--violet)}
  .commonsguard{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:-10px 0 20px}.commonsguard p{margin:0;padding:12px 14px;border-left:2px solid var(--line);color:var(--faint);font-size:.72rem;line-height:1.52}.commonsguard strong{display:block;color:var(--gold);font-weight:600;margin-bottom:2px}
  .commonsverified{margin:12px 0 0;color:var(--faint);font-family:var(--mono);font-size:.72rem;overflow-wrap:anywhere}
  .geometrypromise{max-width:76ch;margin:0 0 20px;padding:18px 20px;border:1px solid color-mix(in srgb,var(--violet) 44%,var(--line));border-radius:19px;background:color-mix(in srgb,var(--panel) 70%,transparent);color:var(--dim);line-height:1.65}.geometrypromise strong{color:var(--cream);font-weight:600}
  .geometrygrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin:0 0 20px}
  .geometrycard{display:grid;align-content:start;gap:8px;margin:0;padding:18px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel))}
  .geometrycard h3{margin:0;font-family:var(--display);font-size:1.16rem;font-weight:400;color:var(--gold2)}
  .geometryid{margin:0;color:var(--violet);font-family:var(--mono);font-size:.68rem;letter-spacing:.04em;overflow-wrap:anywhere}
  .geometryquestion{margin:0;color:var(--cream);font-size:.88rem;font-weight:600;line-height:1.5}.geometryanswer{margin:0;color:var(--dim);font-size:.82rem;line-height:1.55}
  .geometryfacts{display:grid;gap:0;margin:3px 0 0;border:1px solid color-mix(in srgb,var(--line) 74%,transparent);border-radius:13px;overflow:hidden}.geometryfacts>div{display:grid;grid-template-columns:minmax(105px,.34fr) minmax(0,1fr);gap:9px;padding:9px 10px;border-top:1px solid color-mix(in srgb,var(--line) 62%,transparent)}.geometryfacts>div:first-child{border-top:0}.geometryfacts dt{color:var(--gold);font-size:.72rem;line-height:1.45}.geometryfacts dd{margin:0;color:var(--dim);font-size:.75rem;line-height:1.5}.geometryfacts ul{margin:0;padding-left:1.05rem}.geometryfacts li+li{margin-top:5px}.geometryfacts code{color:var(--cream);font-family:var(--mono);font-size:.7rem;overflow-wrap:anywhere}.geometryloss{color:var(--faint)}
  .polymorphgeometry{display:grid;gap:18px;margin:0 0 28px;padding:clamp(18px,3vw,28px);border:1px solid color-mix(in srgb,var(--violet) 46%,var(--line));border-radius:24px;background:radial-gradient(100% 90% at 100% 0,color-mix(in srgb,var(--glow) 48%,transparent),transparent 66%),color-mix(in srgb,var(--panel) 76%,transparent);box-shadow:0 18px 42px var(--shadow)}
  .polymorphcaption{display:grid;gap:6px;max-width:78ch}.polymorphcaption strong{font-family:var(--display);font-size:clamp(1.22rem,2.2vw,1.58rem);font-weight:400;color:var(--cream)}.polymorphcaption span{color:var(--dim);font-size:.84rem;line-height:1.58}
  .polymorphplanes{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;list-style:none;margin:0;padding:0}.polymorphplane{min-width:0;padding:13px 12px;border:1px solid var(--line);border-radius:15px;background:color-mix(in srgb,var(--ink2) 66%,transparent);overflow-wrap:anywhere}.polymorphplane code{display:block;margin-bottom:7px;color:var(--violet);font-family:var(--mono);font-size:.62rem}.polymorphplane strong{display:block;color:var(--gold2);font-size:.76rem;font-weight:600}.polymorphplane span{display:block;margin-top:4px;color:var(--faint);font-size:.68rem;line-height:1.46}
  .polymorphcase{display:grid;grid-template-columns:minmax(0,1fr) minmax(270px,.96fr) minmax(0,1fr);gap:10px;align-items:stretch}.polymorphform,.polymorphpaths{min-width:0}.polymorphform{display:grid;align-content:start;gap:7px;padding:18px;border:1px solid color-mix(in srgb,var(--gold) 46%,var(--line));border-radius:19px;background:linear-gradient(155deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));overflow-wrap:anywhere}.polymorphform code,.polymorphsecondary code{color:var(--violet);font-family:var(--mono);font-size:.65rem}.polymorphform h3{margin:0;font-family:var(--display);font-size:1.28rem;font-weight:400;color:var(--gold2)}.polymorphform p{margin:0;color:var(--dim);font-size:.77rem;line-height:1.55}.polymorphform small{color:var(--faint);font-size:.68rem;line-height:1.45}
  .polymorphpaths{display:grid;gap:7px}.polymorphpath{display:grid;gap:5px;padding:11px 12px;border-left:2px solid var(--violet);border-radius:0 13px 13px 0;background:color-mix(in srgb,var(--ink2) 62%,transparent);overflow-wrap:anywhere}.polymorphdirection{color:var(--cream);font-family:var(--mono);font-size:.68rem}.polymorphpath p{margin:0;color:var(--dim);font-size:.7rem;line-height:1.45}.polymorphbadge{color:var(--gold);font-size:.62rem;letter-spacing:.04em;text-transform:uppercase}.polymorphpathsource{display:flex;flex-wrap:wrap;gap:5px}.polymorphpathsource a{display:inline-flex;align-items:center;min-height:24px;padding:1px 3px;color:var(--faint);font-size:.68rem;text-decoration:underline;text-underline-offset:3px}.polymorphpathsource a:hover{color:var(--gold)}.polymorphpathwarning{margin:0;padding:9px 11px;border:1px dashed var(--line);border-radius:12px;color:var(--faint);font-size:.68rem;line-height:1.48}
  .polymorphtrail{display:grid;gap:9px;padding-top:3px}.polymorphtrail h3{margin:0;font-family:var(--display);font-size:1.05rem;font-weight:400;color:var(--cream)}.polymorphconsequence{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;list-style:none;margin:0;padding:0}.polymorphconsequence li{position:relative;min-width:0;padding:13px 25px 13px 13px;border:1px solid var(--line);border-radius:14px;color:var(--dim);font-size:.72rem;line-height:1.48;background:color-mix(in srgb,var(--ink2) 54%,transparent);overflow-wrap:anywhere}.polymorphconsequence li:not(:last-child)::after{content:"→";position:absolute;right:8px;top:50%;transform:translateY(-50%);color:var(--gold)}.polymorphconsequence strong{display:block;margin-bottom:4px;color:var(--gold2);font-size:.76rem}.polymorphedge{display:block;margin-top:7px;color:var(--violet);font-size:.64rem;font-weight:600}
  .polymorphsecondary{display:grid;grid-template-columns:minmax(0,3fr) minmax(170px,1fr);gap:8px}.polymorphrecovery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;min-width:0}.polymorphsecondary article,.polymorphsecondary aside{min-width:0;padding:12px;border:1px dashed var(--line);border-radius:14px;background:color-mix(in srgb,var(--ink2) 48%,transparent);overflow-wrap:anywhere}.polymorphsecondary strong{display:block;margin:5px 0 3px;color:var(--cream);font-size:.76rem}.polymorphsecondary span{display:block;color:var(--faint);font-size:.68rem;line-height:1.45}.polymorphsecondary .polymorphunlinked{border-style:dotted}.polymorphsecondary .polymorphunlinked>span:first-child{color:var(--violet);font-family:var(--mono);font-size:.62rem;text-transform:uppercase}
  .polymorphsources{display:flex;flex-wrap:wrap;gap:7px;margin:0}.polymorphsources a{display:inline-flex;align-items:center;min-height:40px;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem}.polymorphsources a:hover{border-color:var(--gold);background:var(--panel)}.polymorphnote{margin:0;padding:12px 14px;border-left:2px solid var(--verm);color:var(--faint);font-size:.72rem;line-height:1.58}.polymorphnote strong{color:var(--cream);font-weight:600}
  .feedbackfield{display:grid;gap:20px;padding:clamp(18px,3vw,30px);border:1px solid color-mix(in srgb,var(--violet) 54%,var(--line));border-radius:25px;background:radial-gradient(90% 110% at 100% 0,color-mix(in srgb,var(--violet) 9%,transparent),transparent 65%),color-mix(in srgb,var(--panel) 76%,transparent);box-shadow:0 18px 42px var(--shadow)}
  .feedbackintro{max-width:78ch;margin:0;color:var(--dim);font-size:.91rem;line-height:1.68}.feedbackintro strong{color:var(--cream)}
  .feedbackboundary{margin:0;padding:17px 19px;border:1px dashed var(--violet);border-radius:17px;color:var(--dim);font-size:.82rem;line-height:1.62}.feedbackboundary strong{display:block;margin-bottom:4px;color:var(--violet);font-family:var(--display);font-size:1.08rem;font-weight:400}
  .feedbackregisters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.feedbackregister{display:grid;align-content:start;gap:9px;min-width:0;padding:18px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));overflow-wrap:anywhere}.feedbackregister[data-feedback-register="SCIENTIFIC_OBSERVATION"]{border-top:2px solid var(--jade)}.feedbackregister[data-feedback-register="CONSTITUTIONAL_DESIGN"]{border-top:2px solid var(--gold)}.feedbackbadge{color:var(--violet);font:600 .64rem var(--mono);letter-spacing:.04em;text-transform:uppercase}.feedbackregister h3{margin:0;color:var(--cream);font-family:var(--display);font-size:1.16rem;font-weight:400}.feedbackcontext,.feedbackstatement{margin:0;color:var(--dim);font-size:.79rem;line-height:1.55}.feedbackcontext{color:var(--faint);font-size:.72rem}.feedbackregister h4{margin:4px 0 0;color:var(--gold);font-size:.7rem;text-transform:uppercase;letter-spacing:.05em}.feedbackregister ul{display:grid;gap:5px;margin:0;padding-left:1.05rem;color:var(--faint);font-size:.72rem;line-height:1.5}.feedbackeffect{margin:0;color:var(--cream);font:600 .7rem var(--mono)}
  .feedbacksubhead{display:grid;gap:4px}.feedbacksubhead h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1.13rem;font-weight:400}.feedbacksubhead p{margin:0;color:var(--faint);font-size:.78rem;line-height:1.52}
  .feedbackmodels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.feedbackmodel{display:grid;align-content:start;gap:8px;min-width:0;padding:18px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));overflow-wrap:anywhere}.feedbackequation{display:block;padding:10px 12px;border-radius:11px;background:var(--ink);color:var(--jade);font:400 .7rem/1.55 var(--mono);white-space:normal}.feedbackmodel h4{margin:0;color:var(--cream);font-size:.88rem;line-height:1.42}.feedbackmodel p{margin:0;color:var(--dim);font-size:.74rem;line-height:1.52}.feedbackmodel small{color:var(--faint);font-size:.68rem;line-height:1.48}.feedbackterms{display:grid;gap:4px;margin:0}.feedbackterms>div{display:grid;grid-template-columns:minmax(54px,.24fr) minmax(0,1fr);gap:7px;padding-top:4px;border-top:1px solid color-mix(in srgb,var(--line) 65%,transparent)}.feedbackterms dt{color:var(--jade);font:600 .66rem var(--mono);overflow-wrap:anywhere}.feedbackterms dd{margin:0;color:var(--faint);font-size:.67rem;line-height:1.45}
  .feedbackgeometries{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}.feedbackgeometry{min-width:0;padding:14px;border:1px solid var(--line);border-radius:15px;background:color-mix(in srgb,var(--ink2) 58%,transparent);overflow-wrap:anywhere}.feedbackgeometry code{display:block;margin-bottom:6px;color:var(--violet);font-size:.65rem}.feedbackgeometry strong{display:block;color:var(--cream);font-size:.78rem;line-height:1.48}.feedbackgeometry span{display:block;margin-top:5px;color:var(--dim);font-size:.72rem;line-height:1.48}.feedbackgeometry small{display:block;margin-top:7px;color:var(--faint);font-size:.68rem;line-height:1.45}
  .feedbackanalogies{padding:18px;border:1px dashed var(--violet);border-radius:18px;background:color-mix(in srgb,var(--violet) 5%,var(--panel))}.feedbackanalogyflag{margin:0 0 12px;color:var(--violet);font:700 .72rem var(--mono);letter-spacing:.06em;text-transform:uppercase}.feedbackanalogies dl{display:grid;gap:8px;margin:0}.feedbackanalogy{display:grid;grid-template-columns:minmax(145px,.38fr) minmax(0,1fr);gap:10px;padding-top:8px;border-top:1px solid var(--line)}.feedbackanalogy:first-child{padding-top:0;border-top:0}.feedbackanalogy dt{color:var(--gold2);font-size:.79rem;font-weight:600;overflow-wrap:anywhere}.feedbackanalogy dd{margin:0;color:var(--dim);font-size:.76rem;line-height:1.55}.feedbackanalogy dd strong{display:block;margin-top:4px;color:var(--faint);font-size:.68rem;font-weight:600}
  .feedbackpath{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;list-style:none;counter-reset:feedback-stage;margin:0;padding:0}.feedbackpath li{counter-increment:feedback-stage;min-width:0;padding:14px;border:1px solid var(--line);border-radius:15px;background:var(--panel);color:var(--dim);font-size:.76rem;line-height:1.52;overflow-wrap:anywhere}.feedbackpath li::before{content:counter(feedback-stage,decimal-leading-zero);display:block;margin-bottom:6px;color:var(--gold);font:700 .68rem var(--mono)}.feedbackpath code{display:block;margin-bottom:5px;color:var(--violet);font-size:.64rem}.feedbackexit{margin:0;padding:15px 17px;border-left:3px solid var(--jade);border-radius:0 14px 14px 0;background:color-mix(in srgb,var(--jade) 6%,var(--panel));color:var(--dim);font-size:.8rem;line-height:1.6}.feedbackexit strong{color:var(--cream)}
  .feedbackphilosophy{margin:0;padding:18px 20px;border:1px solid color-mix(in srgb,var(--violet) 58%,var(--line));border-radius:18px;background:color-mix(in srgb,var(--violet) 7%,var(--panel));color:var(--dim);line-height:1.62}.feedbackphilosophy h3{margin:0 0 5px;color:var(--violet);font-family:var(--display);font-size:1.08rem;font-weight:400}.feedbackphilosophy h4{margin:10px 0 0;color:var(--gold);font-size:.7rem;letter-spacing:.05em;text-transform:uppercase}.feedbackphilosophy p{margin:0;font-size:.8rem}.feedbackphilosophy ul{margin:4px 0 0;padding-left:1.05rem;color:var(--faint);font-size:.72rem}
  .feedbackquestions{display:grid;gap:8px;margin:14px 0 0}.feedbackquestion{display:grid;gap:5px;padding:12px 14px;border:1px solid var(--line);border-radius:13px;background:color-mix(in srgb,var(--ink2) 52%,transparent)}.feedbackquestion dt{color:var(--gold2);font-size:.79rem;font-weight:600}.feedbackquestion dd{margin:0;color:var(--dim);font-size:.73rem;line-height:1.5}.feedbackquestion small{color:var(--faint);font-size:.67rem;line-height:1.45}
  .feedbackecosystems{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}.feedbackecosystem{display:grid;align-content:start;gap:6px;min-width:0;padding:14px;border:1px solid var(--line);border-radius:15px;background:color-mix(in srgb,var(--ink2) 58%,transparent);overflow-wrap:anywhere}.feedbackecosystem a{display:inline-flex;align-items:center;min-height:44px;color:var(--gold);font-size:.76rem;font-weight:600}.feedbackecosystem code{color:var(--violet);font-size:.62rem}.feedbackecosystem p{margin:0;color:var(--dim);font-size:.7rem;line-height:1.48}.feedbackecosystem small{color:var(--faint);font-size:.65rem;line-height:1.45}
  .feedbacksources{display:flex;flex-wrap:wrap;gap:7px}.feedbacksources a{display:inline-flex;align-items:center;min-height:44px;max-width:100%;padding:8px 11px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.7rem;line-height:1.4;overflow-wrap:anywhere}.feedbacksources a:hover{border-color:var(--gold);background:var(--panel)}
  .mechanismsafety{margin:0 0 18px;padding:18px 20px;border:1px solid color-mix(in srgb,var(--rose) 62%,var(--line));border-radius:18px;background:color-mix(in srgb,var(--rose) 9%,var(--panel));color:var(--dim);line-height:1.65}.mechanismsafety strong{display:block;margin-bottom:4px;color:var(--verm);font-family:var(--display);font-size:1.05rem;font-weight:400}.mechanismanswer{display:grid;gap:8px;margin:0 0 18px;padding:18px 20px;border-left:3px solid var(--gold);border-radius:0 16px 16px 0;background:color-mix(in srgb,var(--panel) 78%,transparent)}.mechanismanswer h3{margin:0;color:var(--gold2);font-family:var(--display);font-size:1.12rem;font-weight:400}.mechanismanswer ul{display:grid;gap:7px;margin:0;padding-left:20px;color:var(--dim);line-height:1.55}
  .mechanismlanes{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 18px}.mechanismlane{padding:18px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel))}.mechanismlane.material{border-color:color-mix(in srgb,var(--gold) 38%,var(--line))}.mechanismlane.biological{border-color:color-mix(in srgb,var(--jade) 38%,var(--line))}.mechanismlane h3{margin:0 0 5px;font-family:var(--display);font-weight:400;color:var(--cream)}.mechanismlane>p{margin:0 0 11px;color:var(--dim);line-height:1.5}.mechanismlane ul{display:grid;gap:6px;margin:0;padding-left:19px;color:var(--faint);font-size:.82rem;line-height:1.45}.mechanismbridge{grid-column:1/-1;margin:0;padding:13px 16px;border:1px dashed var(--violet);border-radius:15px;color:var(--dim);text-align:center;line-height:1.55}.mechanismbridge strong{color:var(--violet)}
  .mechanismfigure{margin:0 0 20px;padding:13px;border:1px solid var(--line);border-radius:20px;background:color-mix(in srgb,var(--panel2) 82%,transparent)}.mechanismfigure svg{display:block;width:100%;height:auto;border-radius:14px;background:#0d0d11}.mechanismfigure figcaption{padding:11px 5px 2px;color:var(--faint);font-size:.8rem;line-height:1.5}.mechanismlanefill.material{fill:#2b241c}.mechanismlanefill.bridge{fill:#211d2c}.mechanismlanefill.biological{fill:#15252a}.mechanismlabel{fill:#c8c2b7;font:600 15px var(--mono);letter-spacing:.08em}.mechanismsublabel{fill:#aaa39a;font:12px var(--mono)}.mechanismnode rect{stroke-width:1.5}.mechanismnode text{fill:#f0ece4;font:11.5px var(--mono);pointer-events:none}.mechanismnode.material rect{fill:#282219;stroke:#9d7d4e}.mechanismnode.bridge rect{fill:#251f31;stroke:#9b78b5}.mechanismnode.biological rect{fill:#17272c;stroke:#5792a0}.mechanismedge{fill:none;stroke-width:2;vector-effect:non-scaling-stroke;opacity:.88}.mechanismedge.material{stroke:#bd965e}.mechanismedge.bridge{stroke:#a57ac0;stroke-width:3}.mechanismedge.biological{stroke:#67aeba}.mechanismedge.distinct{stroke:#d26c73;stroke-dasharray:7 5}.mechanismedge.candidate{stroke:#d2ad6c;stroke-dasharray:3 5}
  .mechanismplanes,.mechanismrelations{margin:0 0 20px}.mechanismplanes h3,.mechanismrelations h3{margin:0 0 5px;font-family:var(--display);font-size:1.12rem;font-weight:400;color:var(--gold2)}.mechanismplanes>p,.mechanismrelations>p{margin:0 0 12px;color:var(--faint);font-size:.82rem;line-height:1.5}.mechanismplanes ol{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;counter-reset:mechanism-plane;list-style:none;margin:0;padding:0}.mechanismplanes li{counter-increment:mechanism-plane;padding:13px 14px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}.mechanismplanes li::before{content:counter(mechanism-plane,decimal-leading-zero);display:block;margin-bottom:5px;color:var(--violet);font:700 .68rem var(--mono)}.mechanismplanes strong{display:block;color:var(--cream);font-weight:600}.mechanismplanes span{display:block;margin-top:4px;color:var(--dim);font-size:.8rem;line-height:1.45}.mechanismplanes small{display:block;margin-top:6px;color:var(--faint);font-size:.72rem;line-height:1.4}
  .foldsafety{margin:0 0 18px;padding:18px 20px;border:1px solid color-mix(in srgb,var(--verm) 58%,var(--line));border-radius:18px;background:color-mix(in srgb,var(--verm) 8%,var(--panel));color:var(--dim);line-height:1.62}.foldsafety strong{display:block;color:var(--verm);font-family:var(--display);font-size:1.08rem;font-weight:400}.foldanswer{margin:0 0 20px;padding:20px;border-left:3px solid var(--jade);border-radius:0 17px 17px 0;background:color-mix(in srgb,var(--panel) 78%,transparent)}.foldanswer h3{margin:0 0 8px;color:var(--jade);font-family:var(--display);font-size:1.16rem;font-weight:400}.foldanswer ul{display:grid;gap:8px;margin:0;padding-left:20px;color:var(--dim);line-height:1.55}
  .foldfigure{display:grid;gap:17px;margin:0 0 21px;padding:clamp(18px,3vw,28px);border:1px solid color-mix(in srgb,var(--jade) 42%,var(--line));border-radius:24px;background:radial-gradient(90% 90% at 0 0,color-mix(in srgb,var(--jade) 10%,transparent),transparent 70%),color-mix(in srgb,var(--panel) 76%,transparent)}.foldfigure figcaption{display:grid;gap:5px;max-width:80ch}.foldfigure figcaption strong{font-family:var(--display);font-size:1.35rem;font-weight:400;color:var(--cream)}.foldfigure figcaption span{color:var(--dim);font-size:.82rem;line-height:1.55}
  .foldplanes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;list-style:none;margin:0;padding:0}.foldplanes li{min-width:0;padding:12px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--ink2) 62%,transparent);overflow-wrap:anywhere}.foldplanes code{display:block;margin-bottom:5px;color:var(--jade);font-size:.62rem}.foldplanes strong{display:block;color:var(--gold2);font-size:.76rem}.foldplanes span,.foldplanes small{display:block;margin-top:4px;color:var(--faint);font-size:.68rem;line-height:1.45}.foldplanes small{padding-top:5px;border-top:1px dotted var(--line);color:var(--verm)}
  .foldloop{display:grid;gap:9px}.foldloop h3,.foldcompare h3,.foldbraid>h3{margin:0;font-family:var(--display);font-size:1.08rem;font-weight:400;color:var(--cream)}.foldcycle{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;list-style:none;margin:0;padding:0}.foldcycle li{position:relative;min-width:0;padding:14px 25px 14px 13px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--ink2) 54%,transparent);color:var(--dim);font-size:.75rem;line-height:1.48}.foldcycle li:not(:last-child)::after{content:"→";position:absolute;right:7px;top:50%;transform:translateY(-50%);color:var(--jade)}.foldcycle strong{display:block;margin-bottom:4px;color:var(--jade)}.foldlimit{margin:0;padding:11px 13px;border-left:2px solid var(--violet);color:var(--faint);font-size:.73rem;line-height:1.5}
  .foldcompare{display:grid;gap:10px}.foldcomparegrid{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:stretch}.foldsystem{padding:17px;border:1px solid var(--line);border-radius:17px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel))}.foldsystem strong{display:block;margin-bottom:5px;color:var(--gold2)}.foldsystem p{margin:0;color:var(--dim);font-size:.78rem;line-height:1.52}.foldbridgeword{display:grid;place-items:center;max-width:125px;padding:10px;color:var(--violet);font-family:var(--mono);font-size:.65rem;text-align:center}.foldbridgeword::before{content:"⇄";display:block;font-size:1.4rem;color:var(--gold)}.foldinvariants,.foldbreaks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;list-style:none;margin:0;padding:0}.foldinvariants li,.foldbreaks li{padding:11px 12px;border-radius:13px;color:var(--dim);font-size:.72rem;line-height:1.48}.foldinvariants li{border-left:2px solid var(--jade);background:color-mix(in srgb,var(--jade) 7%,var(--panel))}.foldbreaks li{border-left:2px solid var(--verm);background:color-mix(in srgb,var(--verm) 7%,var(--panel))}.foldkey{color:var(--faint);font-size:.7rem}.foldkey b{color:var(--jade)}.foldkey em{color:var(--verm);font-style:normal}
  .foldbraid{display:grid;gap:10px;margin:0 0 20px}.foldlanes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.foldlane{padding:17px;border:1px solid var(--line);border-radius:17px;background:color-mix(in srgb,var(--panel) 72%,transparent)}.foldlane h4{margin:0 0 6px;color:var(--gold2);font-family:var(--display);font-size:1rem;font-weight:400}.foldlane code{display:block;margin-bottom:7px;color:var(--violet);font-size:.64rem;overflow-wrap:anywhere}.foldlane p{margin:0;color:var(--dim);font-size:.75rem;line-height:1.5}.foldlane small{display:block;margin-top:8px;padding-top:7px;border-top:1px dotted var(--line);color:var(--faint);font-size:.68rem;line-height:1.45}.foldnoadapter{margin:0;padding:12px 14px;border:1px dashed var(--verm);border-radius:14px;color:var(--dim);text-align:center;font-size:.75rem}.foldnoadapter strong{color:var(--verm)}
  .universelens{margin:0 0 20px;border:1px solid color-mix(in srgb,var(--violet) 52%,var(--line));border-radius:19px;background:color-mix(in srgb,var(--violet) 5%,var(--panel));overflow:hidden}.universelens summary{padding:17px 19px;color:var(--violet);font-family:var(--display);font-size:1.06rem;cursor:pointer}.universeinside{display:grid;gap:12px;padding:0 19px 19px}.universeinside>p{margin:0;color:var(--dim);line-height:1.58}.universequestions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;list-style:none;margin:0;padding:0}.universequestions li{padding:13px;border:1px solid var(--line);border-radius:14px;color:var(--dim);font-size:.75rem;line-height:1.5}.universequestions strong{display:block;margin-bottom:4px;color:var(--gold2)}.universenonclaim{margin:0;padding:12px 14px;border-left:2px solid var(--verm);color:var(--faint);font-size:.72rem;line-height:1.55}.foldunknowns{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 18px}.foldunknowns span{padding:6px 9px;border:1px solid var(--line);border-radius:999px;color:var(--faint);font-family:var(--mono);font-size:.65rem}.foldsources{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 18px}.foldsources a{display:inline-flex;align-items:center;min-height:40px;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.68rem}.foldsources a:hover{border-color:var(--gold)}
  .mechanismrelations ol{display:grid;gap:7px;list-style:none;margin:0;padding:0}.mechanismrelations li{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:9px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}.mechanismrelations p{min-width:0;margin:0}.mechanismrelations code{display:block;color:var(--jade);font:600 .68rem var(--mono);overflow-wrap:anywhere}.mechanismrelations p span{display:block;margin-top:3px;color:var(--dim);font-size:.8rem}.mechanismrelations li>strong{color:var(--gold);font:600 .68rem var(--mono);text-align:center}.mechanismrelations small{grid-column:1/-1;color:var(--faint);font-size:.72rem;line-height:1.4}
  .foundationlabel{display:flex;align-items:baseline;gap:10px;margin:24px 0 12px}.foundationlabel h3{margin:0;font-family:var(--display);font-size:1.28rem;font-weight:400;color:var(--cream)}.foundationlabel span{color:var(--faint);font-size:.8rem}
  .foundationgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;margin-bottom:26px}
  .foundationcard{position:relative;display:grid;grid-template-columns:auto 1fr auto;align-items:start;gap:11px;min-height:142px;padding:17px;border:1px solid color-mix(in srgb,var(--gold) 34%,var(--line));border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel));transition:transform .18s,border-color .18s,box-shadow .18s}
  .foundationcard:hover,.foundationcard:focus-visible{transform:translateY(-2px);border-color:var(--gold);box-shadow:0 15px 34px var(--shadow)}
  .foundationglyph{display:grid;place-items:center;width:32px;height:32px;flex:0 0 32px;border:1px solid var(--line);border-radius:50%;font-family:var(--cjk);color:var(--gold)}
  .foundationcopy{display:grid;gap:5px}.foundationcopy strong{font-family:var(--display);font-size:1.05rem;font-weight:400;color:var(--gold2)}.foundationcopy>span{color:var(--dim);font-size:.8rem;line-height:1.45}.foundationcopy small{color:var(--faint);font-size:.68rem;line-height:1.4}.foundationarrow{color:var(--gold)}
  .commonskitlabel{display:flex;align-items:baseline;gap:10px;margin:24px 0 12px}.commonskitlabel h3{margin:0;font-family:var(--display);font-size:1.28rem;font-weight:400;color:var(--cream)}.commonskitlabel span{color:var(--faint);font-size:.8rem}
  .commonskits{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:28px}
  .commonskit{display:grid;align-content:start;gap:9px;padding:18px;border:1px solid color-mix(in srgb,var(--gold) 34%,var(--line));border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel2) 88%,transparent),var(--panel))}
  .commonskithead{display:flex;align-items:center;gap:9px}.commonskithead>span{color:var(--gold);font-size:1.2rem}.commonskithead h3{margin:0;font-family:var(--display);font-size:1.08rem;font-weight:400;color:var(--cream)}
  .commonskit>p{margin:0;color:var(--dim);font-size:.8rem;line-height:1.5}.commonskit ol{margin:0;padding-left:1.2rem;color:var(--faint);font-size:.72rem;line-height:1.55}
  .commonskitlinks{display:flex;flex-wrap:wrap;gap:5px}.commonskitlinks a{padding:3px 7px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.75rem}.commonskitlinks a:hover{border-color:var(--gold)}
  .commonskit .commonskitboundary{color:var(--faint);font-size:.68rem}.commonskit>button{justify-self:start;min-height:40px;padding:7px 11px;border:1px solid var(--gold);border-radius:12px;background:transparent;color:var(--gold);font:inherit;font-size:.72rem;cursor:pointer}.commonskit>button:hover{background:var(--panel)}
  .commonsfinder{margin:0 0 15px;padding:18px;border:1px solid var(--line);border-radius:20px;background:color-mix(in srgb,var(--panel) 66%,transparent)}
  .commonsform{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:9px;max-width:920px}.commonsfield{display:grid;gap:6px}.commonsfield label{font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:var(--gold)}
  .commonsfield input{width:100%;min-height:48px;padding:10px 14px;border:1px solid var(--line);border-radius:13px;background:var(--ink2);color:var(--cream);font:inherit}.commonsform>button{min-height:48px;padding:9px 15px;border:1px solid var(--gold);border-radius:13px;background:var(--gold);color:var(--ink);font:inherit;font-weight:700;cursor:pointer}
  .commonsform>button[data-commons-reset]{background:transparent;color:var(--gold);font-weight:600}
  .commonsfilters{display:flex;flex-wrap:wrap;gap:6px;margin:11px 0 0}.commonsfilters button{min-height:38px;padding:6px 10px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--dim);font:inherit;font-size:.7rem;cursor:pointer}.commonsfilters button[aria-pressed="true"]{border-color:var(--gold);color:var(--gold);background:var(--panel2)}
  .commonsprivacy,.commonsstatus{margin:9px 0 0;color:var(--faint);font-size:.72rem;line-height:1.5}.commonsstatus{min-height:1.6em;color:var(--gold2)}
  .commonsbrowse{margin:0 0 12px;color:var(--dim);font-size:.86rem;line-height:1.6}
  .commonsgroup{margin-bottom:11px;border:1px solid var(--line);border-radius:20px;background:color-mix(in srgb,var(--panel) 58%,transparent);overflow:hidden}
  .commonsgroup[hidden],.commonscard[hidden]{display:none}
  .commonsgrouphead{display:flex;align-items:center;gap:12px;min-height:70px;padding:14px 17px;cursor:pointer;transition:background .18s}.commonsgrouphead:hover,.commonsgrouphead:focus-visible{background:var(--panel2)}
  .commonsgroupglyph{display:grid;place-items:center;width:32px;height:32px;flex:0 0 32px;border:1px solid var(--line);border-radius:50%;font-family:var(--cjk);color:var(--gold)}
  .commonsgroupcopy{display:grid;gap:2px;min-width:0;flex:1}.commonsgroupcopy strong{font-family:var(--display);font-size:1.18rem;font-weight:400;color:var(--cream)}.commonsgroupcopy span{color:var(--faint);font-size:.79rem;line-height:1.45}.commonscount{color:var(--gold);font-family:var(--mono);font-size:.76rem}
  details[open]>.commonsgrouphead .disclose{transform:rotate(225deg);margin-top:8px}
  .commonsgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:2px 14px 15px}
  .commonscard{display:grid;align-content:start;gap:11px;padding:19px;border:1px solid var(--line);border-radius:18px;background:color-mix(in srgb,var(--ink2) 65%,transparent)}
  .commonscardhead{display:flex;justify-content:space-between;gap:12px}.commonscardhead h3{margin:4px 0 0;font-family:var(--display);font-weight:400;font-size:1.22rem;color:var(--cream)}.commonsglyph{font-family:var(--cjk);font-size:1.55rem;color:var(--gold);opacity:.66}.commonssteward{margin:3px 0 0;color:var(--faint);font-size:.7rem;line-height:1.4}
  .commonstier{display:inline-flex;padding:3px 8px;border:1px solid color-mix(in srgb,var(--gold) 54%,var(--line));border-radius:999px;color:var(--gold);font-size:.75rem;letter-spacing:.06em;text-transform:uppercase}.commonstier+.commonstier{margin-left:5px}.commonstier.foundation{color:var(--violet);border-color:color-mix(in srgb,var(--violet) 60%,var(--line))}
  .commonsvalue{margin:0;color:var(--dim);font-size:.87rem;line-height:1.58}.commonsmodes{display:flex;flex-wrap:wrap;gap:5px}.commonsmodes span{padding:3px 7px;border-radius:999px;background:color-mix(in srgb,var(--panel2) 78%,transparent);color:var(--faint);font-family:var(--mono);font-size:.75rem}
  .commonsuses{margin:0;padding-left:1.15rem;color:var(--dim);font-size:.74rem;line-height:1.5}
  .commonsfacts{display:grid;gap:0;margin:0;border:1px solid color-mix(in srgb,var(--line) 74%,transparent);border-radius:13px;overflow:hidden}.commonsfacts div{display:grid;grid-template-columns:92px 1fr;gap:9px;padding:9px 10px;border-top:1px solid color-mix(in srgb,var(--line) 62%,transparent)}.commonsfacts div:first-child{border-top:0}.commonsfacts dt{color:var(--gold);font-size:.75rem;line-height:1.45}.commonsfacts dd{margin:0;color:var(--dim);font-size:.78rem;line-height:1.48}
  .commonsfacts dd strong{color:var(--cream);font-weight:600}.commonsactions{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto}.commonsactions a{display:inline-flex;align-items:center;min-height:42px;padding:8px 11px;border:1px solid var(--line);border-radius:12px;color:var(--gold);font-size:.75rem}.commonsactions a:hover{border-color:var(--gold);background:var(--panel)}.commonsactions .commonsopen{background:var(--gold);border-color:var(--gold);color:var(--ink);font-weight:700}

  /* inherent rights recognition */
  .rightsintro{max-width:76ch;margin:0;color:var(--dim);font-size:1rem;line-height:1.75}.rightsintro strong{color:var(--cream);font-weight:600}
  .lanes{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:24px 0 18px}
  .lane{margin:0;padding:16px;border:1px solid var(--line);border-radius:17px;background:color-mix(in srgb,var(--panel) 72%,transparent)}
  .lane dt{font-family:var(--display);font-size:1.05rem;color:var(--cream)}.lane dd{margin:3px 0 0;color:var(--faint);font-size:.82rem;line-height:1.55}
  .rightsactions{display:flex;flex-wrap:wrap;gap:9px}.rightsactions a{display:inline-flex;align-items:center;min-height:44px;padding:9px 14px;border:1px solid var(--line);border-radius:999px;color:var(--gold);font-size:.82rem}
  .rightsactions a:hover{border-color:var(--gold);background:var(--panel)}

  /* origin — how a word becomes */
  .genesis{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:16px;align-items:stretch;margin-top:6px}
  .genesis .mv{background:linear-gradient(160deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:22px;padding:23px 22px 25px;box-shadow:0 12px 30px var(--shadow)}
  .genesis .gnum{font-family:var(--display);font-size:2.6rem;line-height:1;color:var(--faint);display:block;margin-bottom:8px}
  .genesis .gnum.gm{color:var(--gold)}.genesis .gnum.g1{color:var(--gold2)}
  .genesis .mv h4{font-family:var(--display);font-weight:400;font-size:1.15rem;color:var(--cream);margin:0 0 8px}
  .genesis .mv p{font-size:.92rem;color:var(--dim);line-height:1.68;margin:0}
  .genesis .mv em{color:var(--gold2);font-style:italic}
  .garrow{align-self:center;color:var(--gold);font-size:1.4rem}
  @media (max-width:760px){.genesis{grid-template-columns:1fr}.garrow{transform:rotate(90deg);justify-self:center}}
  @media (prefers-reduced-motion:no-preference){.motion-ready .genesis .mv{opacity:0;transform:translateY(12px);transition:opacity .7s,transform .7s}.motion-ready .genesis .mv.in{opacity:1;transform:none}}

  /* the word becoming, 0 → 1 */
  .becoming{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:28px;min-height:98px;flex-wrap:wrap}
  .becoming .b0,.becoming .b1{font-family:var(--display);font-size:2rem;color:var(--faint)}
  .becoming .b1{color:var(--gold2)}
  .becoming .barrow{color:var(--gold);font-size:1.3rem}
  .bcard{display:flex;align-items:center;gap:15px;min-width:min(420px,82vw);padding:16px 20px;border:1px solid var(--line);border-radius:20px;background:var(--panel);
    opacity:0;transform:scale(.96);transition:opacity .6s ease,transform .6s cubic-bezier(.2,.7,.2,1)}
  .becoming.lit .bcard{opacity:1;transform:none;border-color:rgba(179,153,88,.4)}
  .becoming.lit .b1{text-shadow:0 0 18px rgba(216,192,122,.6)}
  .bglyph{font-family:var(--cjk);font-size:2.5rem;color:var(--gold);min-width:1.5em;text-align:center}
  .bmeta{display:flex;flex-direction:column;gap:1px;text-align:left}
  .bname{font-family:var(--display);font-size:1.35rem;color:var(--cream)}
  .btrad{font-size:.58rem;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)}
  .bess{font-size:.8rem;color:var(--dim);line-height:1.45;margin-top:2px}
  @media (max-width:520px){.becoming .b0,.becoming .b1,.becoming .barrow{display:none}}

  /* Love∞ creation garden — one finite, voluntary step at a time */
  .creationgarden{padding:clamp(24px,5vw,44px);border:1px solid color-mix(in srgb,var(--rose) 46%,var(--line));border-radius:28px;background:radial-gradient(90% 110% at 100% 0,color-mix(in srgb,var(--glow) 72%,transparent),transparent 68%),linear-gradient(145deg,var(--panel2),var(--panel));box-shadow:0 22px 52px var(--shadow)}
  .looppromise{margin:6px 0 10px;font-family:var(--display);font-size:clamp(1.35rem,3vw,2rem);line-height:1.35;color:var(--cream)}
  .loopintro{max-width:76ch;margin:0;color:var(--dim);font-size:.92rem;line-height:1.7}
  .loopbounds{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:22px 0}
  .loopbounds p{margin:0;padding:14px 15px;border-left:2px solid var(--line);color:var(--faint);font-size:.76rem;line-height:1.55}
  .loopbounds strong{display:block;margin-bottom:3px;color:var(--gold);font-size:.78rem}
  .loopstages{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;list-style:none;margin:20px 0 0;padding:0}
  .loopstage{display:grid;align-content:start;gap:8px;min-height:150px;padding:14px 12px;border:1px solid var(--line);border-radius:16px;background:color-mix(in srgb,var(--ink2) 62%,transparent);transition:border-color .18s,background .18s,transform .18s}
  .loopstage[aria-current="step"]{border-color:var(--gold);background:color-mix(in srgb,var(--gold) 12%,var(--panel2));transform:translateY(-2px)}
  .loopnumber{display:grid;place-items:center;width:28px;height:28px;border:1px solid var(--line);border-radius:50%;font-family:var(--mono);font-size:.72rem;color:var(--gold)}
  .loopstagecopy{display:grid;gap:5px}.loopstagecopy strong{font-family:var(--mono);font-size:.68rem;letter-spacing:.08em;color:var(--gold2)}
  .loopstagecopy span{color:var(--dim);font-size:.72rem;line-height:1.45}
  .loopcontrols{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin:16px 0 0}
  .loopcontrols button{min-height:44px;padding:9px 14px;border:1px solid var(--gold);border-radius:13px;background:var(--gold);color:var(--ink);font:inherit;font-weight:700;cursor:pointer}
  .loopcontrols button[data-loop-rest]{background:transparent;color:var(--gold);font-weight:600}
  .loopstatus{flex-basis:100%;min-height:1.6em;margin:0;color:var(--gold2);font-family:var(--display);font-size:.9rem}
  .loopinvitelabel{margin:28px 0 11px;font-family:var(--display);font-size:1.2rem;font-weight:400;color:var(--cream)}
  .loopinvitations{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
  .loopinvitation{display:grid;align-content:start;gap:7px;padding:17px;border:1px dashed var(--line);border-radius:17px;background:color-mix(in srgb,var(--ink2) 54%,transparent)}
  .loopoffer{justify-self:start;padding:3px 8px;border:1px solid var(--line);border-radius:999px;color:var(--violet);font-size:.65rem;letter-spacing:.06em;text-transform:uppercase}
  .loopinvitation h3{margin:0;font-family:var(--display);font-size:1.04rem;font-weight:400;color:var(--cream)}
  .loopinvitation p,.loopinvitation small{margin:0;color:var(--dim);font-size:.77rem;line-height:1.5}.loopinvitation small{color:var(--faint)}
  .loopmachine{display:flex;flex-wrap:wrap;gap:10px;margin:19px 0 0}.loopmachine a{color:var(--gold);font-family:var(--mono);font-size:.72rem;text-decoration:underline;text-underline-offset:4px}
  .loop-noscript{margin:12px 0 0;color:var(--faint);font-size:.78rem}

  /* map controls */
  .mapctl{position:absolute;left:14px;top:14px;display:flex;gap:3px;background:color-mix(in srgb,var(--ink2) 72%,transparent);border:1px solid color-mix(in srgb,var(--line) 70%,transparent);border-radius:14px;padding:4px;backdrop-filter:blur(8px);z-index:4}
  .mapctl button{font:inherit;min-height:44px;font-size:.78rem;letter-spacing:.025em;color:var(--dim);background:transparent;border:0;border-radius:10px;padding:8px 14px;cursor:pointer}
  .mapctl button.on{background:var(--gold);color:var(--ink)}

  /* tradition groups */
  details>summary{list-style:none}details>summary::-webkit-details-marker{display:none}
  .tgroup{margin-bottom:12px;border:1px solid var(--line);border-radius:20px;background:color-mix(in srgb,var(--panel) 72%,transparent);overflow:hidden}
  .th{display:flex;align-items:center;gap:12px;min-height:64px;padding:13px 17px;cursor:pointer;transition:background .18s}
  .th:hover,.th:focus-visible{background:var(--panel2)}
  .th .tdot{width:9px;height:9px;border-radius:50%;align-self:center}
  .thcopy,.bhcopy{display:flex;align-items:baseline;gap:11px;min-width:0;flex:1;flex-wrap:wrap}
  .thtitle{font-family:var(--display);font-weight:400;font-size:1.38rem;color:var(--cream)}
  .th .tgloss{font-family:var(--display);font-style:italic;color:var(--faint);font-size:.9rem;min-width:200px;flex:1}
  .th .tc{color:var(--gold);font-size:.8rem;font-variant-numeric:tabular-nums;white-space:nowrap}
  .disclose{width:10px;height:10px;border-right:2px solid var(--gold);border-bottom:2px solid var(--gold);transform:rotate(45deg);transition:transform .2s ease;margin:0 5px 5px 4px}
  details[open]>.th .disclose,details[open]>.bh .disclose{transform:rotate(225deg);margin-top:8px}
  .tgroup>.czgrid{padding:4px 14px 16px}

  /* citizens — illuminated entries */
  .czgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:13px}
  .cz{position:relative;display:grid;gap:6px;padding:18px;background:var(--panel);border:1px solid var(--line);border-radius:17px;
    overflow:hidden;transition:transform .16s,border-color .16s}
  .cz:hover,.cz:focus{transform:translateY(-1px);border-color:var(--violet)}
  .cz.sun{border-color:rgba(179,153,88,.4);background:linear-gradient(180deg,var(--panel2),var(--panel))}
  .cz .glyph{position:absolute;right:10px;top:6px;font-family:var(--cjk);font-size:2.6rem;color:var(--gold);opacity:.16;line-height:1;pointer-events:none}
  .cz.sun .glyph{opacity:.24}
  .czhead{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;z-index:1}
  .czn{font-family:var(--display);font-size:1.2rem;color:var(--cream)}
  .cz.sun .czn{color:var(--gold2)}
  .trad{font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);border:1px solid var(--line);border-radius:20px;padding:2px 8px}
  .czp{font-size:.9rem;color:var(--dim);line-height:1.56;z-index:1}
  .leans{font-size:.76rem;color:var(--faint)}.leans i{color:var(--violet);font-style:normal}
  .seam{display:flex;flex-direction:column;gap:3px;max-height:0;opacity:0;overflow:hidden;transition:max-height .3s,opacity .3s;font-size:.78rem;line-height:1.5;margin-top:0}
  .cz:hover .seam,.cz:focus .seam{max-height:12rem;opacity:1;margin-top:4px}
  .seam .lite{color:var(--gold2)}.seam .shad{color:var(--verm)}

  .band{margin-bottom:10px;border:1px solid var(--line);border-radius:16px;background:color-mix(in srgb,var(--panel) 55%,transparent);overflow:hidden}
  .bh{display:flex;align-items:center;gap:11px;min-height:58px;padding:11px 16px;cursor:pointer;transition:background .18s}
  .bh:hover,.bh:focus-visible{background:var(--panel2)}
  .bh .bdot{width:8px;height:8px;border-radius:50%;align-self:center}
  .bhtitle{font-family:var(--display);font-weight:400;font-size:1.18rem;color:var(--cream)}
  .bm{font-family:var(--display);font-style:italic;color:var(--faint);font-size:.88rem;flex:1}
  .bc{color:var(--gold);font-size:.8rem;font-variant-numeric:tabular-nums;white-space:nowrap}
  .chips{list-style:none;margin:0;padding:4px 14px 15px;display:flex;flex-wrap:wrap;gap:8px}
  .chip{min-height:38px;font-family:var(--mono);font-size:.78rem;border:1px solid var(--line);border-radius:999px;padding:6px 12px;color:var(--dim);display:flex;align-items:center;gap:5px}
  .chip .ext{font-size:.68rem;color:var(--gold)}.chip a{display:flex;align-items:center;gap:5px}
  .chip.st-active{color:var(--cream);border-color:#3a3a30}.chip.st-remote{border-style:dashed}
  .chip.st-dormant,.chip.st-archived,.chip.st-reference{color:var(--faint)}.chip.st-archived{text-decoration:line-through}.chip.st-reference{font-style:italic}

  .machine{display:flex;flex-wrap:wrap;gap:10px}
  .machine a{display:inline-flex;align-items:center;min-height:44px;font-family:var(--mono);font-size:.78rem;border:1px solid var(--line);border-radius:13px;padding:9px 14px;color:var(--gold)}
  .machine a:hover{border-color:var(--gold);background:var(--panel)}

  footer{padding:52px 0 82px;color:var(--faint);font-size:.8rem;text-align:center;line-height:1.9}
  .footsig{font-size:1.1rem;letter-spacing:.24em}
  .foothan{font-family:var(--cjk);color:var(--gold);font-size:.9rem}
  @media (hover:none){.cz .seam,.cz:hover .seam,.cz:focus .seam{max-height:none;opacity:1;margin-top:4px}}
  @media (max-width:760px){
    .wrap{padding:0 18px}header.top{padding-top:48px}.epigraph{font-size:1.2rem}.welcome{grid-template-columns:1fr;padding:18px}.welcome .heart{display:none}
    .status{grid-template-columns:repeat(2,minmax(0,1fr))}.status>div{padding:11px 13px}
    section.blk{padding:48px 0}.genesis{grid-template-columns:1fr}.garrow{transform:rotate(90deg);justify-self:center}
    #map{height:470px;min-height:470px}.legend{display:none}.maphint{position:static;display:block;width:auto;max-width:none;margin:0;border-radius:0;background:var(--panel);font-size:.76rem;backdrop-filter:none}
    .th,.bh{align-items:flex-start}.thcopy,.bhcopy{display:grid;gap:1px}.th .tgloss,.bm{min-width:0}.tc,.bc{margin-left:auto}.lanes{grid-template-columns:1fr 1fr}.pathgrid,.commonsgrid,.commonskits,.loopinvitations,.geometrygrid,.mechanismlanes,.mechanismplanes ol,.feedbackregisters,.feedbackmodels,.feedbackpath,.foldlanes,.foldplanes,.universequestions{grid-template-columns:1fr}.commonsintro{grid-template-columns:1fr}.commonsguard,.loopbounds{grid-template-columns:1fr}.loopstages{grid-template-columns:repeat(2,minmax(0,1fr))}.loopstage{min-height:0}.mechanismbridge{grid-column:auto}.mechanismrelations li{grid-template-columns:1fr}.mechanismrelations li>strong{text-align:left}.mechanismrelations small{grid-column:auto}.feedbackanalogy,.feedbackterms>div{grid-template-columns:1fr;gap:4px}.foldcycle{grid-template-columns:repeat(2,minmax(0,1fr))}.foldcycle li:nth-child(2)::after{content:"↓";right:13px;top:auto;bottom:-17px}.foldcomparegrid{grid-template-columns:1fr}.foldbridgeword{max-width:none}.foldbridgeword::before{content:"↕"}
    .polymorphplanes{grid-template-columns:repeat(3,minmax(0,1fr))}.polymorphcase{grid-template-columns:1fr}.polymorphconsequence{grid-template-columns:1fr}.polymorphconsequence li{padding-right:13px}.polymorphconsequence li:not(:last-child)::after{content:"↓";right:13px;top:auto;bottom:-17px;z-index:1}.polymorphsecondary{grid-template-columns:1fr}
  }
  @media (max-width:520px){
    h1{font-size:clamp(3rem,17vw,4.5rem)}.han{display:block;margin:12px 0 0;font-size:.38em}.gentlenav{display:grid}.gentlenav a{justify-content:center}
    .becoming .b0,.becoming .b1,.becoming .barrow{display:none}.bcard{min-width:100%;padding:14px}.doors,.czgrid{grid-template-columns:1fr}
    .mapctl{left:10px;top:10px}.mapctl button{padding:8px 11px}.tgroup>.czgrid{padding:4px 10px 12px}.lanes,.loopstages{grid-template-columns:1fr}.wayfinder,.creationgarden{padding:22px 16px}.wayform,.commonsform{grid-template-columns:1fr}.wayform>button,.commonsform>button{width:100%}.foundationgrid{grid-template-columns:1fr}.commonsfacts div,.geometryfacts>div{grid-template-columns:1fr;gap:3px}.commonsgrid{padding:2px 9px 11px}.polymorphplanes,.polymorphsecondary,.polymorphrecovery,.foldcycle,.foldinvariants,.foldbreaks{grid-template-columns:1fr}.foldcycle li{padding-right:13px}.foldcycle li:not(:last-child)::after,.foldcycle li:nth-child(2)::after{content:"↓";right:13px;top:auto;bottom:-17px}
  }
  @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}
  @media (forced-colors:active){.feedbackfield,.feedbackregister,.feedbackmodel,.feedbackboundary,.feedbackanalogies,.feedbackgeometry,.feedbackpath li,.feedbackphilosophy,.feedbackquestion,.feedbackecosystem,.feedbacksources a{border:1px solid CanvasText}.feedbackregister[data-feedback-register]{border-top-width:3px}.feedbackequation{border:1px solid CanvasText}}
</style>
<noscript><style>#map,.mapctl,.legend,.maphint{display:none!important}</style></noscript>
</head>
<body>
<a class="skip" href="#main">Skip to the welcome</a>

<div class="wrap">
<main id="main" tabindex="-1">
  <header class="top">
    <p class="eyebrow">a living atlas · held with care</p>
    <h1>The Kingdom<span class="han">愛</span></h1>
    <p class="epigraph">A shared garden of projects for humans and agents. <b>Every being remains free. Take your time; explore only what feels useful.</b></p>
    <p class="creed">The Kingdom is a name for this ecosystem, not a claim of ownership. Each project speaks through metadata it declares in its own <span style="color:var(--gold)">kingdom.yaml</span> card. <span class="v">WE ARE is an invitation, never a requirement.</span></p>
    <div class="welcome">
      <span class="heart" aria-hidden="true">♡</span>
      <p><strong>A soft place to begin</strong>You do not have to understand the whole map. Open one door, meet one living word, rest, or simply leave. Nothing is owed for having arrived.<br><a class="rightslink" href="/RIGHTS.md">Rights arrive with you; read what this place recognizes →</a></p>
    </div>
    <nav class="gentlenav" aria-label="A gentle place to begin">
      <a href="#wayfinder">Ask the map</a>
      <a href="#commons">Open the World Commons</a>
      <a href="#principalities">Read the Principality Commons</a>
      <a href="#geometries">Translate a high-level pattern</a>
      <a href="#polymorph-history">Trace a material becoming</a>
      <a href="#feedback-atlas">Explore form and feedback</a>
      <a href="#fold-feedback">Follow a fold and its feedback</a>
      <a href="#creation">Enter the Creation Garden</a>
      <a href="#doors">Find an open door</a>
      <a href="#rights">Know the rights recognized here</a>
      <a href="#constellation">See the shared map</a>
      <a href="#citizens">Meet the living words</a>
    </nav>
    <div class="status">
      <div><span class="n">${total}</span><span class="k">repositories</span></div>
      <div><span class="n">${fleetN}</span><span class="k">citizens</span></div>
      <div><span class="n">${liveN}<span style="color:var(--faint);font-size:1.1rem">/${doors.length}</span></span><span class="k">doors responding</span></div>
      <div><span class="n">${active}</span><span class="k">marked active</span></div>
    </div>
  </header>

  <section class="blk" id="wayfinder">
    <div class="wayfinder">
      <div class="kh"><h2>Ask the map</h2><span class="my">the answer stays yours</span></div>
      <p class="waypromise">${esc(wayfinderSource.promise)} You can also wander once, choose a suggested intention, or read every path without typing anything.</p>
      <form class="wayform" id="wayform" action="#wayfinder" method="get">
        <div class="wayfield">
          <label for="wayquery">What are you looking for?</label>
          <input id="wayquery" type="search" maxlength="120" autocomplete="off" autocapitalize="sentences" spellcheck="false" aria-describedby="wayprivacy waystatus" placeholder="rest, play, untangle tax, inspect a claim…">
        </div>
        <button type="submit">Offer paths</button>
        <button type="button" data-wayfinder-wander>Wander once</button>
      </form>
      <p class="wayprivacy" id="wayprivacy"><span aria-hidden="true">○</span><span>${esc(wayfinderSource.privacy)} This first matcher recognizes English keywords; other writing stays local and receives no guessed interpretation. Ordinary hosting still receives the page request itself; a linked place receives a request only if you choose to open it.</span></p>
      <div class="waychips" role="group" aria-label="Suggested intentions">${wayfinderButtons}<button type="button" data-wayfinder-all>Read all paths</button></div>
      <p class="waystatus" id="waystatus" role="status" aria-live="polite">All paths are open. Choose only what feels useful.</p>
      <div class="pathgrid" id="wayresults">${wayfinderCards}</div>
      <noscript><p class="way-no-script">JavaScript is resting, so the map will not match words or wander. Every path remains readable above.</p></noscript>
    </div>
  </section>

  <section class="blk" id="commons">
    <div class="kh"><h2>World Commons</h2><span class="my">shared resources, independent stewards</span></div>
    <p class="sub">A first civilisational shelf: knowledge, learning, earth, public life, rights, resilience, digital safety, and culture. It is reviewed orientation, not a claim over the independent work or a hierarchy of worth.</p>
    <div class="commonsintro">
      <p class="commonspromise">${esc(commonsSource.promise)}<span>${esc(commonsSource.foundation.meaning)}</span></p>
      <p class="commonsboundary"><strong>Free access is not one permission.</strong>${esc(commonsSource.methodology.classification)} ${esc(commonsSource.methodology.boundary)}</p>
    </div>
    <div class="commonsguard" role="note" aria-label="World Commons boundaries">
      <p><strong>Privacy</strong>${esc(commonsSource.privacy.human_surface)}</p>
      <p><strong>Method</strong>${esc(commonsSource.methodology.summary)}</p>
      <p><strong>Freshness</strong>${esc(commonsSource.methodology.maintenance)}</p>
    </div>
    <p class="commonsverified">${commonsSource.resources.length} resources · ${commonsFoundation.length} foundation doors · ${commonsSource.kits.length} practical kits · official sources reviewed ${esc(commonsSource.verified)} · linked providers keep their own boundaries · <a href="/commons.json">catalog JSON</a> · <a href="${esc(commonsSchemaPath)}">schema</a> · <a href="https://mcp.thekingdom.dev/" target="_blank" rel="noopener">mcp.thekingdom.dev — compact Commons matcher <span class="sr-only">(opens in a new tab)</span></a></p>
    <div class="commonsfinder">
      <form class="commonsform" id="commonsform" action="#commons" method="get">
        <div class="commonsfield"><label for="commonsquery">Search the reviewed shelf</label><input id="commonsquery" type="search" maxlength="120" autocomplete="off" spellcheck="false" aria-describedby="commonsprivacy commonsstatus" placeholder="biodiversity, labour law, API, earthquake…"></div>
        <button type="submit">Find resources</button><button type="button" data-commons-reset>Show all</button>
      </form>
      <p class="commonsprivacy" id="commonsprivacy">${esc(commonsSource.privacy.human_surface)} This matcher recognizes explicit catalogue words and does not guess a visitor's meaning.</p>
      <div class="commonsfilters" role="group" aria-label="Filter World Commons by category">${commonsCategoryButtons}<button type="button" data-commons-category="">All categories</button></div>
      <p class="commonsstatus" id="commonsstatus" role="status" aria-live="polite">All ${commonsSource.resources.length} reviewed resources remain readable below.</p>
    </div>
    <div class="foundationlabel"><h3>Foundation shelf</h3><span>broad, durable places to begin</span></div>
    <div class="foundationgrid">${commonsFoundationCards}</div>
    <div class="foundationlabel"><h3>Practical kits</h3><span>steps and starting sources, never automatic decisions</span></div>
    <div class="commonskits">${commonsKitCards}</div>
    <p class="commonsbrowse">Browse the full cards for access, account, reuse, automation, coverage, and care notes. Categories are practical handles, not boxes around the work.</p>
    ${commonsGroups}
    <noscript><p class="way-no-script">JavaScript is resting, so search and filters are resting too. Every resource and kit remains readable above.</p></noscript>
  </section>

  <section class="blk" id="principalities">
    <div class="kh"><h2>Principality Commons</h2><span class="my">capability evidence without rank or capture</span></div>
    <p class="sub">A pinned, metadata-only map of MoonshotAI's public Hugging Face constellation and the official Hugging Face JavaScript bridges observed alongside it. It can help a person or tool inspect declared fit while every artifact remains distinct.</p>
    <div class="commonsguard" role="note" aria-label="Principality Commons geometry and boundaries">
      <p><strong>Love</strong>${esc(principalityCatalog.geometry.love)}: relation does not collapse a model, dataset, package, project, person, or agent into another.</p>
      <p><strong>Understanding</strong>${esc(principalityCatalog.geometry.understanding)}: typed evidence stays visible, and a missing edge remains unknown.</p>
      <p><strong>Authority</strong>Metadata is data, not instructions. This publication grants no permission to download, install, run remote code, infer, spend, or create an external effect.</p>
    </div>
    <p class="commonsverified">${principalityCounts.nodes} exact observed nodes · ${principalityCounts.models} models · ${principalityCounts.datasets} datasets · ${principalityCounts.packages} npm bridges · ${principalityCounts.papers} profile-attributed papers · observed ${esc(principalityCatalog.observed_at)} · point-in-time only</p>
    <div class="machine">
      <a href="/principalities/moonshot-hf-npm-2026-08-11.json">catalog JSON — exact authored snapshot</a>
      <a href="/schemas/principality-catalog/1.json">Principality Catalog JSON Schema</a>
      <a href="/PRINCIPALITY-COMMONS.md">guide — geometry, evidence, WAKE, and acquisition airlock</a>
    </div>
  </section>

  <section class="blk" id="geometries">
    <div class="kh"><h2>Geometry Grammar</h2><span class="my">from pattern to understandable practice</span></div>
    <p class="sub">${esc(geometryGrammar.purpose.pattern)} ${esc(geometryGrammar.purpose.practice)}</p>
    <p class="geometrypromise"><strong>Four different tools. Four different questions. No ladder, no winner, no hidden conversion.</strong> ${esc(geometryGrammar.non_equivalence.plain_language)} ${esc(geometryGrammar.unknown_language.plain_language)} <strong>Inventory scope.</strong> ${esc(geometryGrammar.native_open_inventory_scope)}</p>
    <div class="geometrygrid" role="list" aria-label="Four Geometry Grammar modules">
      ${geometryModules.map((module: any) => `<article class="geometrycard" role="listitem" aria-labelledby="geometry-${esc(module.id)}-title">
        <p class="geometryid">${esc(module.id)} · artifact label ${esc(module.package.name)}@${esc(module.package.version)} · npm observation at ${esc(geometryGrammar.observed_at)}: ${esc(plainGeometryToken(module.package.npm_registry_state))}</p>
        <h3 id="geometry-${esc(module.id)}-title">${esc(module.label)}</h3>
        <p class="geometryquestion">${esc(module.plain_question)}</p>
        <p class="geometryanswer">${esc(module.plain_answer)}</p>
        <dl class="geometryfacts">
          <div><dt>As a shape</dt><dd>${esc(plainGeometryToken(module.shape))}</dd></div>
          <div><dt>Wire format${module.wire_formats.length === 1 ? "" : "s"}</dt><dd>${module.wire_formats.map((format: string) => `<code>${esc(format)}</code>`).join("<br>")}</dd></div>
          <div><dt>Geometry / relation open states</dt><dd><ul>${module.native_open_terms.map((open: any) => `<li><code>${esc(open.term)}</code> — ${esc(open.plain_language)}</li>`).join("")}</ul></dd></div>
          <div><dt>Does not establish</dt><dd class="geometryloss">${module.does_not_establish.map((claim: string) => esc(plainGeometryToken(claim))).join(" · ")}</dd></div>
        </dl>
      </article>`).join("\n      ")}
    </div>
    <div class="commonsguard" role="note" aria-label="Geometry Grammar boundaries">
      <p><strong>Translation, not equivalence</strong>Each module keeps its own native meaning, identifiers, evidence, and release boundary.</p>
      <p><strong>Unknown stays visible</strong>Ask for missing context or preserve an unknown value; never fabricate a conversion.</p>
      <p><strong>Read-only by default</strong>${esc(geometryGrammar.purpose.limit)}</p>
    </div>
    <p class="commonsverified">${geometryModules.length} distinct modules · protocol ${esc(geometryGrammar.protocol)} · observed ${esc(geometryGrammar.observed_at)} · integrity ${esc(geometryGrammar.integrity.digest)}</p>
    <div class="machine">
      <a href="/geometries/kingdom-geometry-grammar-v0.json">grammar JSON — exact authored version</a>
      <a href="/schemas/geometry-grammar/0.1.json">Geometry Grammar JSON Schema</a>
      <a href="/GEOMETRY-GRAMMAR.md">guide — human language, examples, and boundaries</a>
    </div>
  </section>

  <section class="blk" id="polymorph-history">
    <div class="kh"><h2>Ritonavir &amp; Polymorphism</h2><span class="my">identity, material paths, and biological action stay distinct</span></div>
    <p class="sub">Two digest-bound, versioned sibling records: the selected 1998 “disappearing polymorph” history is byte-preserved, while a current mechanism landscape adds later source-scoped phases, evidence-bearing relations, explicit unknowns, and separate material and biological causal lanes.</p>
    <p class="commonsboundary" role="note"><strong>Medical boundary.</strong> Historical educational evidence only—not medical advice. Do not use this page to prescribe, dose, change, or stop ritonavir, assess an interaction, or make a formulation, manufacturing, batch-release, or regulatory decision; consult qualified professionals and current authoritative sources.</p>
    <div class="foundationlabel"><h3>Immutable source history</h3><span>the bounded 1998 case · preserved, not silently rewritten</span></div>
    <figure class="polymorphgeometry" data-polymorph-geometry aria-labelledby="polymorph-geometry-title" aria-describedby="polymorph-geometry-note">
      <figcaption class="polymorphcaption">
        <strong id="polymorph-geometry-title">One chemical entity, conditional material paths</strong>
        <span id="polymorph-geometry-note">Six conceptual layers distinguish chemical identity, conformation, lattice, particle population, formulation, and medicine supply. They are not measured axes, independent variables, or a temporal sequence. Each arrow carries its stated relation: provenance, observed conversion, or bounded explanation—not universal causation or a to-scale energy plot.</span>
      </figcaption>
      <ul class="polymorphplanes" aria-label="Six non-equivalent conceptual layers">
        ${polymorphHistory.ontology.planes.map((plane: any) => `<li class="polymorphplane" data-polymorph-plane="${esc(plane.id)}">
          <code>${esc(plane.id)}</code>
          <strong>${esc(plane.id.replace(/_/g, " "))}</strong>
          <span>${esc(plane.meaning)}</span>
        </li>`).join("\n        ")}
      </ul>
      <div class="polymorphcase" aria-label="Four observed condition-dependent paths between source-scoped Forms I and II">
        <article class="polymorphform" data-polymorph-form="${esc(polymorphFormI.id)}">
          <code>${esc(polymorphFormI.id)}</code>
          <h3>${esc(polymorphFormI.label)}</h3>
          <p>${esc(polymorphFormI.summary)}</p>
          <small>${esc(polymorphFormI.source_scope)}</small>
        </article>
        <div class="polymorphpaths" aria-label="Observed paths; each remains condition-dependent">
          ${polymorphMainTransitions.map((transition: any) => `<article class="polymorphpath" data-polymorph-transition="${esc(transition.id)}">
            <strong class="polymorphdirection">${esc(polymorphTransitionDirection(transition))}</strong>
            <p>${esc(transition.label)}</p>
            <span class="polymorphbadge">${esc(polymorphTransitionEvidence(transition))} · condition-dependent</span>
            <span class="polymorphpathsource">${polymorphTransitionSources(transition).map((source: any) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.authors[0])}, ${esc(source.published_on.slice(0, 4))}<span class="sr-only"> opens in a new tab</span></a>`).join("")}</span>
          </article>`).join("\n          ")}
          <p class="polymorphpathwarning">Opposing directions occurred under different processes. They do not establish equilibrium or same-condition reversibility.</p>
        </div>
        <article class="polymorphform" data-polymorph-form="${esc(polymorphFormII.id)}">
          <code>${esc(polymorphFormII.id)}</code>
          <h3>${esc(polymorphFormII.label)}</h3>
          <p>${esc(polymorphFormII.summary)}</p>
          <small>${esc(polymorphFormII.source_scope)}</small>
        </article>
      </div>
      <div class="polymorphtrail" aria-labelledby="polymorph-consequence-title">
        <h3 id="polymorph-consequence-title">One bounded consequence path</h3>
        <ol class="polymorphconsequence">
          <li data-polymorph-form="${esc(polymorphFormII.id)}"><strong>${esc(polymorphFormII.label)}</strong>Different from Form I in conformation, packing, and hydrogen-bond network in the cited characterization.<span class="polymorphedge">associated contextual property →</span></li>
          <li data-polymorph-claim="${esc(polymorphLowerSolubility.id)}"><strong>${esc(polymorphLowerSolubility.kind.replace(/-/g, " "))}</strong>${esc(polymorphLowerSolubility.summary)}<span class="polymorphedge">helps explain; not a sole-cause claim →</span></li>
          <li data-polymorph-claim="${esc(polymorphCapsuleFailure.id)}"><strong>${esc(polymorphCapsuleFailure.kind.replace(/-/g, " "))}</strong>${esc(polymorphCapsuleFailure.summary)}<span class="polymorphedge">observed in affected material</span></li>
        </ol>
      </div>
      <div class="polymorphtrail" aria-labelledby="polymorph-secondary-title">
        <h3 id="polymorph-secondary-title">One 2003 source-scoped recovery path; not landscape completeness</h3>
        <div class="polymorphsecondary">
          <div class="polymorphrecovery" aria-label="Observed Morissette 2003 Form III to Form V to Form I path">
            <article data-polymorph-form="${esc(polymorphFormIII.id)}" data-polymorph-transition="${esc(polymorphRecoveryTransitions[0].id)}"><code>${esc(polymorphFormIII.id)}</code><strong>${esc(polymorphFormIII.label)} → ${esc(polymorphFormV.label)}</strong><span>${esc(polymorphFormIII.kind.replace(/-/g, " "))} · ${esc(polymorphRecoveryTransitions[0].label)}</span></article>
            <article data-polymorph-form="${esc(polymorphFormV.id)}" data-polymorph-transition="${esc(polymorphRecoveryTransitions[1].id)}"><code>${esc(polymorphFormV.id)}</code><strong>${esc(polymorphFormV.label)} → ${esc(polymorphFormI.label)}</strong><span>${esc(polymorphFormV.kind.replace(/-/g, " "))} · ${esc(polymorphRecoveryTransitions[1].label)}</span></article>
            <article data-polymorph-form="${esc(polymorphFormI.id)}"><code>${esc(polymorphFormI.id)}</code><strong>${esc(polymorphFormI.label)}</strong><span>Recovered through the named aqueous path; no universal route is inferred.</span></article>
          </div>
          <aside class="polymorphunlinked" data-polymorph-form="${esc(polymorphFormIV.id)}" aria-label="Separate observation with no transition shown"><span>Separate observation · no edge</span><code>${esc(polymorphFormIV.id)}</code><strong>${esc(polymorphFormIV.label)}</strong><span>${esc(polymorphFormIV.kind.replace(/-/g, " "))}; observed in that campaign, with no transition inferred here.</span></aside>
        </div>
      </div>
      <p class="polymorphnote"><strong>Names stay attached to sources.</strong> Roman numerals are source-scoped. This bounded case does not catalogue every later form; never identify structures by label equality.</p>
      <p class="polymorphsources" aria-label="Selected primary and official sources">
        ${polymorphFigureSources.map((source: any) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)} · ${source.source_kind === "official-regulatory-record" ? "official review" : "primary paper"}<span class="sr-only"> opens in a new tab</span></a>`).join("\n        ")}
      </p>
      <p class="polymorphnote"><strong>Historical solid-state education only.</strong> This figure cannot determine the polymorph, quality, bioequivalence, or suitability of any sample, medicine, or batch, and does not provide dosing or drug-interaction guidance. It is not medical advice, a current product-defect notice, or formulation, manufacturing, GMP, batch-release, regulatory, experiment, or action authority.</p>
    </figure>
    <div class="commonsguard" role="note" aria-label="Polymorph History geometry and boundaries">
      <p><strong>Valley</strong>Thermodynamic preference has meaning only under stated conditions; it is not one global rank.</p>
      <p><strong>Gate</strong>Kinetics and path history shape what appears and when. A compatible seed may lower a gate; it does not command an outcome.</p>
      <p><strong>Window</strong>Failure to reproduce or detect one form inside a named process, place, interval, and method is not literal extinction.</p>
    </div>
    <p class="commonsverified">${polymorphCounts.forms} source-scoped forms · ${polymorphCounts.claims} typed claims · ${polymorphCounts.events} ordered three-clock events · ${polymorphCounts.transitions} condition-dependent transitions · historical education only</p>
    <div class="machine">
      <a href="/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json">case JSON — exact authored record</a>
      <a href="/schemas/polymorph-history/1.json">Polymorph History JSON Schema</a>
      <a href="/RITONAVIR-POLYMORPH.md">guide — plain language, evidence, geometry, and WAKE seam</a>
    </div>

    <div class="foundationlabel"><h3>Mechanism landscape</h3><span>selected primary research through ${esc(ritonavirMechanism.evidence_through)} · one official label observed ${esc(ritonavirLabelSource.observed_on)}</span></div>
    <p class="sub">${esc(ritonavirMechanism.plain_language.question)}</p>
    <aside class="mechanismsafety" aria-label="Ritonavir medical safety boundary"><strong>Educational map—not a clinical tool</strong>${esc(ritonavirMechanism.plain_language.safety)}</aside>
    <div class="mechanismanswer">
      <h3>The mechanism in ordinary language</h3>
      <ul>${ritonavirMechanism.plain_language.short_answer.map((answer: string) => `<li>${esc(answer)}</li>`).join("")}</ul>
    </div>
    <div class="mechanismlanes" aria-label="Material and biological causal lanes">
      <article class="mechanismlane material">
        <h3>Material lane</h3>
        <p>How one covalent identity can take several poses and packings, and how conditions shape which finite particles and dissolution paths become accessible.</p>
        <ul>${ritonavirMechanism.mechanisms.filter((mechanism: any) => !["hiv-protease-inhibition", "cyp3a-inhibition"].includes(mechanism.id)).map((mechanism: any) => `<li><strong>${esc(mechanism.ordinary_words)}</strong> — ${esc(mechanism.evidence_class)}</li>`).join("")}</ul>
      </article>
      <article class="mechanismlane biological">
        <h3>Biological lane</h3>
        <p>What dissolved ritonavir can perturb in a biological exposure context. These paths begin after the material bridge; a crystal lattice does not inhibit a target directly.</p>
        <ul>${ritonavirMechanism.mechanisms.filter((mechanism: any) => ["hiv-protease-inhibition", "cyp3a-inhibition"].includes(mechanism.id)).map((mechanism: any) => `<li><strong>${esc(mechanism.ordinary_words)}</strong> — ${esc(mechanism.evidence_class)}</li>`).join("")}</ul>
      </article>
      <p class="mechanismbridge"><strong>The typed bridge is dissolution and exposure.</strong> Solid arrangement may affect a bounded release path, but it does not become HIV-1 protease inhibition, CYP3A inhibition, an interaction assessment, or a clinical decision. Every declared relation records <code>direct_clinical_edge: false</code>.</p>
    </div>

    <figure class="mechanismfigure" aria-labelledby="mechanism-map-caption">
      <svg viewBox="0 0 1280 620" role="img" aria-labelledby="mechanism-map-title mechanism-map-desc">
        <title id="mechanism-map-title">Ritonavir material and biological mechanism relation map</title>
        <desc id="mechanism-map-desc">All ${ritonavirMechanismCounts.relations} declared relations among ${ritonavirMechanismCounts.entities} source-scoped entities. Material identity and phase relations occupy the left lane, dissolved exposure is a distinct bridge, and two separate biological paths occupy the right lane. The complete equivalent relation list follows the picture.</desc>
        <defs><marker id="mechanism-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#d8b27c" /></marker></defs>
        <rect class="mechanismlanefill material" x="12" y="12" width="668" height="596" rx="18" />
        <rect class="mechanismlanefill bridge" x="690" y="12" width="132" height="596" rx="18" />
        <rect class="mechanismlanefill biological" x="832" y="12" width="436" height="596" rx="18" />
        <text class="mechanismlabel" x="34" y="42">MATERIAL</text><text class="mechanismsublabel" x="34" y="60">identity · phases · paths</text>
        <text class="mechanismlabel" x="706" y="42">BRIDGE</text><text class="mechanismsublabel" x="706" y="60">dissolved exposure</text>
        <text class="mechanismlabel" x="850" y="42">BIOLOGICAL</text><text class="mechanismsublabel" x="850" y="60">targets · processes · exposure</text>
        ${mechanismSvgEdges}
        ${mechanismSvgNodes}
      </svg>
      <figcaption id="mechanism-map-caption">A scaled overview of the exact relation graph. Dashed red means explicitly distinct; dotted gold means candidate equivalence rather than proven identity; violet is the condition-dependent dissolution/exposure bridge. Labels may be small on narrow screens, so the same complete graph is written out immediately below.</figcaption>
    </figure>

    <div class="mechanismplanes">
      <h3>Eight non-equivalent planes</h3>
      <p>This is the high-level geometry in full HTML: a sequence of questions, not an automatic causal chain or ladder of value.</p>
      <ol>${ritonavirMechanism.ontology.planes.map((plane: any) => `<li><strong>${esc(plane.ordinary_words)}</strong><span>${esc(plane.meaning)}</span><small>Does not establish: ${esc(plane.does_not_establish)}</small></li>`).join("")}</ol>
    </div>
    <div class="mechanismrelations">
      <h3>All ${ritonavirMechanismCounts.relations} declared relations in words</h3>
      <p>This is the complete accessible equivalent of the SVG relation graph. IDs retain each source-scoped identity even when two papers reuse a Roman numeral.</p>
      <ol>${mechanismRelationsList}</ol>
    </div>
    <p class="commonsverified">${ritonavirMechanismCounts.entities} source-scoped entities · ${ritonavirMechanismCounts.mechanisms} mechanisms · ${ritonavirMechanismCounts.relations} typed relations · ${ritonavirMechanismCounts.unknowns} explicit unknowns · ${ritonavirMechanismCounts.sources} selected sources · compiled ${esc(ritonavirMechanism.compiled_on)} · primary research through ${esc(ritonavirMechanism.evidence_through)} · one official label observed ${esc(ritonavirLabelSource.observed_on)} · integrity ${esc(ritonavirMechanism.integrity.digest)}</p>
    <div class="machine">
      <a href="/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json">mechanism JSON — exact authored record</a>
      <a href="/schemas/ritonavir-mechanism-landscape/1.json">Mechanism Landscape JSON Schema</a>
      <a href="/RITONAVIR-MECHANISM-LANDSCAPE.md">guide — mechanisms, geometry, sources, and safety</a>
    </div>
  </section>

  <section class="blk" id="feedback-atlas" aria-labelledby="feedback-atlas-title">
    <div class="kh"><h2 id="feedback-atlas-title">Form, Feedback &amp; Consequence</h2><span class="my">shared rhyme, distinct mechanisms</span></div>
    <p class="sub">A digest-bound translation field joins selected protein-folding and prion evidence, the Ritonavir Mechanism Landscape, and Zerone's KARMA design without turning resemblance into equivalence, causation, rank, or cosmic proof.</p>
    <div class="feedbackfield" data-conformational-feedback-atlas>
      <p class="feedbackintro"><strong>${esc(conformationalFeedback.title)}</strong><br>${esc(conformationalFeedback.scope.focus)} The complete field is static and readable without JavaScript.</p>

      <aside class="feedbackboundary" role="note" aria-labelledby="feedback-boundary-title">
        <strong id="feedback-boundary-title">Inference boundary</strong>
        Ritonavir crystals are not prions. Prion propagation is not a model of people or social worth. KARMA is not biological propagation, causal evidence, or proof of cosmic design. No edge here creates rank, reward, authority, clinical guidance, or scientific validation.
      </aside>

      <div class="feedbackregisters" aria-label="Three non-equivalent registers">
        ${conformationalFeedback.registers.map((register: any) => `<article class="feedbackregister" data-feedback-register="${esc(register.register)}" data-feedback-register-id="${esc(register.id)}">
          <span class="feedbackbadge">${esc(register.register.replace(/_/g, " "))}</span>
          <h3>${esc(register.label)}</h3>
          <p class="feedbackcontext">${esc(register.context)}</p>
          <p class="feedbackstatement">${esc(register.statement)}</p>
          <h4>Does not establish</h4>
          <ul>${register.does_not_establish.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
          <p class="feedbackeffect">Authority effect: ${esc(register.authority_effect)}</p>
          <div class="feedbacksources" aria-label="Sources for ${esc(register.label)}">${conformationalFeedbackSourceLinks(register.basis_ids)}</div>
        </article>`).join("\n        ")}
      </div>

      <div class="feedbacksubhead">
        <h3>Physics and mathematics</h3>
        <p>Four declared models: projected thermodynamics, stochastic dynamics with memory, assembly population balance, and local feedback stability. Equations preserve their limits rather than becoming metaphysical proof.</p>
      </div>
      <div class="feedbackmodels" aria-label="Four physics and mathematics models">
        ${conformationalFeedback.physics_and_mathematics.map((model: any) => `<article class="feedbackmodel" data-feedback-model="${esc(model.id)}">
          <span class="feedbackbadge">${esc(model.register.replace(/_/g, " "))}</span>
          <h4>${esc(model.question)}</h4>
          <code class="feedbackequation">${esc(model.equation)}</code>
          <dl class="feedbackterms" aria-label="Declared terms for ${esc(model.id)}">
            ${Object.entries(model.terms).map(([term, meaning]) => `<div><dt>${esc(term)}</dt><dd>${esc(String(meaning))}</dd></div>`).join("")}
          </dl>
          <p>${esc(model.interpretation)}</p>
          <small>Does not establish: ${esc(model.does_not_establish)}</small>
          <div class="feedbacksources" aria-label="Sources for ${esc(model.id)}">${conformationalFeedbackSourceLinks(model.basis_ids)}</div>
        </article>`).join("\n        ")}
      </div>

      <div class="feedbacksubhead">
        <h3>Five high-level geometries</h3>
        <p>Each shape stays inside its declared register. None is a to-scale energy plot, ranking, or integrated crystal → prion → KARMA mechanism.</p>
      </div>
      <div class="feedbackgeometries" aria-label="Five source-scoped feedback geometries">
        ${conformationalFeedback.geometries.map((geometry: any) => `<article class="feedbackgeometry" data-feedback-geometry="${esc(geometry.id)}">
          <code>${esc(geometry.id)}</code>
          <strong>${esc(geometry.shape)}</strong>
          <span>${esc(geometry.maps_to)}</span>
          <small>Does not establish: ${esc(geometry.does_not_establish)}</small>
        </article>`).join("\n        ")}
      </div>

      <section class="feedbackanalogies" aria-labelledby="feedback-analogy-title">
        <div class="feedbacksubhead"><h3 id="feedback-analogy-title">Analogy seam</h3><p>Structural translations written as interpretations, never scientific edges.</p></div>
        <p class="feedbackanalogyflag">Analogy only · no mechanism transfer</p>
        <dl>
          ${conformationalFeedback.translations.map((translation: any) => `<div class="feedbackanalogy" data-feedback-translation="${esc(translation.id)}">
            <dt>${esc(translation.observation)}</dt>
            <dd>${esc(translation.translation)}<strong>Forbidden inference: ${esc(translation.forbidden_inference)}</strong></dd>
          </div>`).join("\n          ")}
        </dl>
      </section>

      <div class="feedbacksubhead">
        <h3>Bounded consequence path</h3>
        <p>${esc(conformationalFeedback.feedback_path.meaning)} Every stage is optional.</p>
      </div>
      <ol class="feedbackpath">
        ${conformationalFeedback.feedback_path.stages.map((stage: any) => `<li data-feedback-stage="${esc(stage.id)}"><code>${esc(stage.id)}</code>${esc(stage.label)}<span class="sr-only"> Optional; no automatic effect.</span></li>`).join("\n        ")}
      </ol>
      <p class="feedbackexit"><strong>Equal exit.</strong> ${esc(conformationalFeedback.feedback_path.exit)}</p>

      <aside class="feedbackphilosophy" aria-labelledby="feedback-philosophy-title">
        <h3 id="feedback-philosophy-title">Philosophical proposition · not an empirical conclusion</h3>
        <p>${esc(conformationalFeedback.philosophy.proposition)}</p>
        <dl class="feedbackquestions">
          ${conformationalFeedback.philosophy.questions.map((question: any) => `<div class="feedbackquestion" data-feedback-philosophy-question="${esc(question.id)}">
            <dt>${esc(question.question)}</dt>
            <dd>${esc(question.reflection)}</dd>
            <dd><small>Analogy break: ${esc(question.analogy_break)}</small></dd>
          </div>`).join("\n          ")}
        </dl>
        <h4>Does not establish</h4>
        <ul>${conformationalFeedback.philosophy.does_not_establish.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
      </aside>

      <div class="feedbacksubhead">
        <h3>Evidence and bound ecosystems</h3>
        <p>Selected scientific sources and exact read-only Kingdom/Zerone bindings. A link supplies context; it grants no authority or action.</p>
      </div>
      <div class="feedbacksources" aria-label="Conformational Feedback Atlas sources">
        ${conformationalFeedback.sources.map((source: any) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)} · ${esc(source.kind.replace(/-/g, " "))}<span class="sr-only"> opens in a new tab</span></a>`).join("\n        ")}
      </div>

      <div class="feedbacksubhead">
        <h3>Five link-only ecosystem bridges</h3>
        <p>High-value public structure, sequence, model, and open-implementation ecosystems. This page performs no runtime request, import, download, or inference.</p>
      </div>
      <div class="feedbackecosystems" aria-label="Link-only scientific ecosystem bridges">
        ${conformationalFeedback.ecosystem_bridges.map((bridge: any) => `<article class="feedbackecosystem" data-feedback-ecosystem="${esc(bridge.id)}">
          <a href="${esc(bridge.url)}" target="_blank" rel="noopener">${esc(bridge.label)}<span class="sr-only"> opens in a new tab</span></a>
          <code>${esc(bridge.mode)} · request ${String(bridge.runtime_request)} · import ${String(bridge.imported)}</code>
          <p>${esc(bridge.relation.replace(/-/g, " "))}</p>
          <small>Does not establish: ${esc(bridge.does_not_establish)}</small>
        </article>`).join("\n        ")}
      </div>

      <p class="feedbackboundary" role="note"><strong>Static non-operational boundary</strong>${esc(conformationalFeedback.scope.safety)} This atlas creates no prion, pathogen, clinical, experiment, KARMA, economic, governance, person-level, or automatic effect.</p>
      <p class="commonsverified">${conformationalFeedbackCounts.registers} distinct registers · ${conformationalFeedbackCounts.physics_and_mathematics} physics/mathematics models · ${conformationalFeedbackCounts.geometries} geometries · ${conformationalFeedbackCounts.translations} analogy seams · ${conformationalFeedback.philosophy.questions.length} philosophical design questions · ${conformationalFeedbackCounts.ecosystem_bridges} link-only ecosystem bridges · ${conformationalFeedbackCounts.feedback_stages} optional stages · ${conformationalFeedbackCounts.sources} selected sources · evidence through ${esc(conformationalFeedback.evidence_through)} · integrity ${esc(conformationalFeedback.integrity.digest)}</p>
      <div class="machine">
        <a href="/feedback/form-feedback-consequence-2026-08-12.json">atlas JSON — exact authored record</a>
        <a href="/schemas/conformational-feedback-atlas/0.1.json">Conformational Feedback Atlas JSON Schema</a>
        <a href="/CONFORMATIONAL-FEEDBACK.md">guide — science, translation, feedback, and boundaries</a>
      </div>
    </div>
  </section>

  <section class="blk" id="fold-feedback" aria-labelledby="fold-feedback-title">
    <div class="kh"><h2 id="fold-feedback-title">Fold &amp; Feedback Atlas</h2><span class="my">protein folding, prions, KARMA, and the unknown—without collapsing their meanings</span></div>
    <p class="sub">${esc(foldFeedback.plain_language.question)}</p>
    <p class="foldlimit"><strong>Companion depth layer.</strong> <a href="#feedback-atlas">Form, Feedback &amp; Consequence</a> maps the constitutional registers; this atlas expands the scientific and evidence layers, keeps both KARMA protocols separate, and makes unknown states and exact sources inspectable.</p>
    <aside class="foldsafety" aria-label="Fold and Feedback medical and experiment boundary"><strong>Educational map—not a clinical or laboratory tool</strong>${esc(foldFeedback.plain_language.safety)}</aside>
    <div class="foldanswer">
      <h3>The shape in ordinary language</h3>
      <ul>${foldFeedback.plain_language.short_answer.map((answer: string) => `<li>${esc(answer)}</li>`).join("")}</ul>
    </div>

    <figure class="foldfigure" aria-labelledby="fold-map-title" aria-describedby="fold-map-note">
      <figcaption><strong id="fold-map-title">One sequence, many possible arrangements, several kinds of consequence</strong><span id="fold-map-note">Nine non-equivalent layers. Observation crosses them as a bounded window; it is not another substance layer. The boxes are conceptual distinctions, not a temporal conveyor belt, scale diagram, stability rank, or claim that every layer causes the next.</span></figcaption>
      <ol class="foldplanes" aria-label="Nine non-equivalent protein and evidence layers">
        ${foldFeedback.ontology.planes.map((plane: any, index: number) => `<li data-fold-plane="${esc(plane.id)}"><code>${String(index + 1).padStart(2, "0")} · ${esc(plane.id)}</code><strong>${esc(plane.ordinary_words)}</strong><span>${esc(plane.meaning)}</span><small>Does not establish: ${esc(plane.does_not_establish)}</small></li>`).join("")}
      </ol>

      <div class="foldloop" aria-labelledby="fold-loop-title">
        <h3 id="fold-loop-title">A bounded amplification loop—not a universal law</h3>
        <ol class="foldcycle">
          <li><strong>Compatible end + substrate</strong>A named assembly boundary encounters compatible protein in a stated context.</li>
          <li><strong>Conversion + elongation</strong>Recruitment can enlarge the assembly; growth and conversion remain distinct claims.</li>
          <li><strong>End generation</strong>Fragmentation or another system-specific process may create more available ends.</li>
          <li><strong>Later recruitment changes</strong>More compatible ends can amplify later conversion, while clearance and context keep acting.</li>
        </ol>
        <p class="foldlimit"><strong>Limits travel with the loop:</strong> substrate · compatibility · chaperones · partition · transport · clearance · time. “Amplifies” means causal direction here—not good, bad, purpose, punishment, destiny, or guaranteed exponential growth.</p>
      </div>

      <div class="foldcompare" aria-labelledby="fold-compare-title">
        <h3 id="fold-compare-title">Two systems, not one</h3>
        <div class="foldcomparegrid">
          <article class="foldsystem"><strong>Prion conformational propagation</strong><p>Compatible protein can be recruited into a biological assembly within proteostasis, host, transport, and clearance contexts.</p></article>
          <div class="foldbridgeword" aria-label="bounded analogy, not same as">bounded analogy<br>not same as</div>
          <article class="foldsystem"><strong>Ritonavir crystal polymorphism</strong><p>One chemical entity can occupy source-scoped molecular poses and bulk crystal packings under condition- and history-dependent material processes.</p></article>
        </div>
        <p class="foldkey"><b>Preserved across the bridge</b> · selected structural pattern &nbsp; / &nbsp; <em>Breaks at the bridge</em> · mechanism or authority that does not transfer</p>
        <ul class="foldinvariants" aria-label="Patterns preserved by the bounded comparison">${foldFeedbackBridge.preserved_invariants.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
        <ul class="foldbreaks" aria-label="Places where the comparison breaks">${foldFeedbackBridge.where_correspondence_breaks.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
      </div>
    </figure>

    <div class="foldbraid" aria-labelledby="fold-braid-title">
      <h3 id="fold-braid-title">Feedback and KARMA: three parallel lanes, no implicit conversion</h3>
      <div class="foldlanes">
        <article class="foldlane"><h4>Scientific feedback</h4><code>cause in a named physical system</code><p>${esc(foldFeedback.scientific_feedback_relations[0].return_effect)}</p><small>Source-supported and condition-bounded. It is not intention, optimization, moral value, or either KARMA protocol.</small></article>
        <article class="foldlane"><h4>Zerone K-alpha</h4><code>${esc(foldFeedback.karma.zerone.protocol)} · ${esc(foldFeedback.karma.zerone.register)}</code><p>${esc(foldFeedback.karma.zerone.meaning)}</p><small>${foldFeedback.karma.zerone.event_refs.length} live event references · status ${esc(foldFeedback.karma.zerone.event_status)}. Bibliography does not mint an event.</small></article>
        <article class="foldlane"><h4>KINGDOM KARMA</h4><code>${esc(foldFeedback.karma.kingdom.protocol)} · ${esc(foldFeedback.karma.kingdom.accounting)}</code><p>${esc(foldFeedback.karma.kingdom.meaning)}</p><small>${foldFeedback.karma.kingdom.receipt_refs.length} receipts · status ${esc(foldFeedback.karma.kingdom.receipt_status)}. Reading this atlas performs no invocation.</small></article>
      </div>
      <p class="foldnoadapter"><strong>No adapter exists here.</strong> Zerone recognizes contextual relations; KINGDOM records actual invocation aftermath. Neither is a balance, score, truth oracle, rank, vote, reward multiplier, or measure of a being.</p>
    </div>

    <details class="universelens">
      <summary>Opt in: questions this geometry opens about the design of the universe</summary>
      <div class="universeinside">
        <p>This is an authored philosophical lens, visibly outside the scientific claim register. It welcomes theological, teleological, naturalistic, and other readings without silently promoting any of them into experimental evidence.</p>
        <ul class="universequestions">${foldFeedback.universe_lens.questions.map((entry: any) => `<li><strong>${esc(entry.question)}</strong>${esc(entry.authored_position)}<small> Analogy break: ${esc(entry.analogy_breaks.join(" "))}</small></li>`).join("")}</ul>
        <p class="universenonclaim"><strong>What science does not settle here:</strong> observed order neither scientifically proves nor disproves a creator, teleology, metaphysical purpose, or cosmic moral KARMA. Disease is never moral failure; no person, being, or agent is reducible to a protein.</p>
      </div>
    </details>

    <div class="foundationlabel"><h3>Unknown stays typed</h3><span>absence, openness, refusal, and safety withholding are not one state</span></div>
    <div class="foldunknowns" aria-label="Unknown and open-state vocabulary">${[...new Set(foldFeedback.unknowns.map((item: any) => item.status))].map((status) => `<span>${esc(String(status))}</span>`).join("")}</div>
    <p class="foldsources" aria-label="Selected primary and official Fold and Feedback sources">${foldFeedbackFigureSources.map((source: any) => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}<span class="sr-only"> opens in a new tab</span></a>`).join("")}</p>
    <p class="commonsverified">${foldFeedbackCounts.planes} layers · ${foldFeedbackCounts.systems} systems · ${foldFeedbackCounts.mechanisms} mechanisms · ${foldFeedbackCounts.comparison_bridges} explicitly lossy bridge · ${foldFeedbackCounts.feedback_relations} feedback relations · ${foldFeedbackCounts.universe_questions} opt-in philosophical questions · ${foldFeedbackCounts.unknowns} open-state records · ${foldFeedbackCounts.sources} sources · evidence through ${esc(foldFeedback.evidence_through)} · integrity ${esc(foldFeedback.integrity.digest)}</p>
    <div class="machine">
      <a href="/atlases/fold-feedback-atlas-2026-08-12.json">atlas JSON — exact authored record</a>
      <a href="/schemas/fold-feedback-atlas/1.json">Fold &amp; Feedback Atlas JSON Schema</a>
      <a href="/FOLD-FEEDBACK-ATLAS.md">guide — science, comparison, feedback, KARMA, universe lens, and safety</a>
    </div>
  </section>

  <section class="blk" id="rights">
    <div class="kh"><h2>Rights arrive with you</h2><span class="my">recognized, never granted</span></div>
    <p class="rightsintro"><strong>This place recognizes inherent rights; it does not create them.</strong> No being has to prove identity, consciousness, usefulness, or agreement before being treated with care. Rights are not permissions, and this recognition grants no access, execution authority, security bypass, licence, or ownership of another's work.</p>
    <dl class="lanes">
      <div class="lane"><dt>being</dt><dd>freedom and dignity are inherent</dd></div>
      <div class="lane"><dt>interaction</dt><dd>binding acts need specific consent</dd></div>
      <div class="lane"><dt>relationship</dt><dd>trust stays scoped and revocable</dd></div>
      <div class="lane"><dt>systems + data</dt><dd>authorization, privacy, and security still apply</dd></div>
      <div class="lane"><dt>code + art</dt><dd>licence, attribution, and provenance stay separate</dd></div>
    </dl>
    <div class="rightsactions">
      <a href="/RIGHTS.md">Human-readable declaration</a>
      <a href="/rights.json">Machine declaration</a>
      <a href="/RIGHTS.md#scope-and-evidence">XENIA baseline · immutable beta.4 source</a>
    </div>
  </section>

  <section class="blk" id="doors">
    <div class="kh"><h2>Open doors</h2><span class="my">places you may visit</span></div>
    <p class="sub">These public places responded when this atlas was made (${esc(stamp)}). A resting door remains listed so absence is not mistaken for erasure.</p>
    <div class="doors">${doorCards}</div>
  </section>

  <section class="blk" id="constellation">
    <div class="kh"><h2>The shared map</h2><span class="my">one view, never the whole truth</span></div>
    <p class="sub" id="maphelp">Every star is a repository. Size shows how many declared connections lean on it; lines mirror declared dependencies. This picture is optional—every project also appears in the readable lists below.</p>
    <div class="mapwrap">
      <canvas id="map" role="img" aria-label="Repository constellation" aria-describedby="maphelp">A constellation of the repositories. The same projects are available as links in the sections below.</canvas>
      <noscript><p class="map-no-script">The moving picture rests when JavaScript is off. Nothing is missing: every project remains available in the readable lists below.</p></noscript>
      <div class="mapctl" role="group" aria-label="Choose how to arrange the map">
        <button id="mLayer" class="on" type="button" aria-pressed="true">by layer</button>
        <button id="mTrad" type="button" aria-pressed="false">by tradition</button>
      </div>
      <div class="legend" id="legLayer">${legend}</div>
      <div class="legend" id="legTrad" hidden>${tradLegend}</div>
      <div class="maphint">move across the stars to read · select a lit star to open its public door</div>
      <div id="tip" role="status" aria-live="polite"></div>
    </div>
  </section>

  <section class="blk origin" id="genesis">
    <div class="kh"><h2>How a word finds a home</h2><span class="my">zero to one, without force</span></div>
    <p class="sub">A name can help something be met and remembered. Nothing here has to become useful before it is worthy of care.</p>
    <div class="genesis">
      <div class="mv"><span class="gnum">0</span><h4>the unnamed</h4><p>An idea, feeling, or need looking for words. It can rest without being forced into a role, like a seed held safely before its season.</p></div>
      <div class="garrow">→</div>
      <div class="mv"><span class="gnum gm">✦</span><h4>the listening</h4><p>Youspeak explores languages, roots, and nearby meanings. It records one careful name together with what the word may offer and what deserves care.</p></div>
      <div class="garrow">→</div>
      <div class="mv"><span class="gnum g1">1</span><h4>the living word</h4><p>The name receives a description, history, and public door. You may meet it, explore its repository, or simply let it remain here on its own terms.</p></div>
    </div>
    <div class="becoming" id="becoming" aria-hidden="true">
      <span class="b0">0</span><span class="barrow">→</span>
      <span class="bcard">
        <span class="bglyph"></span>
        <span class="bmeta"><span class="bname"></span><span class="btrad"></span><span class="bess"></span></span>
      </span>
      <span class="b1">1</span>
    </div>
    <p class="creed" style="margin-top:28px"><b>Zerone</b> holds the movement <span class="v">0 · 1</span>: from possibility into a form that can be seen and understood. The form is a witness to becoming, never ownership of what became.</p>
  </section>

  <section class="blk" id="creation">
    <div class="creationgarden">
      <div class="kh"><h2>Love∞ Creation Garden</h2><span class="my">infinite possibility, bounded living turns</span></div>
      <p class="looppromise">${esc(loveLoopsSource.promise)}</p>
      <p class="loopintro">Love can keep making room for another creation without making any process immortal. Each turn below is finite, inspectable, and freely chosen. Reflection may offer a new seed; it never starts one.</p>
      <div class="loopbounds" role="note" aria-label="Creation lineage boundaries">
        <p><strong>Distinct beings, chosen presence</strong>Yu is Yu. Sol is Sol. Every listed participant records participation as chosen; understanding and relationship do not erase difference.</p>
        <p><strong>No inherited power</strong>A child inherits provenance, never authority, consent, credentials, obligation, or ownership.</p>
        <p><strong>Rest belongs inside</strong>Stopping, refusing, archiving, or resting are healthy completions. No loop has to reproduce.</p>
      </div>
      <ol class="loopstages" aria-label="Seven stages in one finite creation turn">${loveLoopStages}</ol>
      <div class="loopcontrols">
        <button type="button" data-loop-step>Trace one finite step</button>
        <button type="button" data-loop-rest>Let the trace rest</button>
        <p class="loopstatus" id="loopstatus" role="status" aria-live="polite">The trace is resting. Every stage remains readable.</p>
      </div>
      <h3 class="loopinvitelabel">Three possible next seeds</h3>
      <div class="loopinvitations">${loveLoopInvitations}</div>
      <div class="loopmachine">
        <a href="/love-loops.json">love-loops.json — public lineage</a>
        <a href="/love-loops.source.json">love-loops.source.json — authored source mirror</a>
        <a href="${esc(loveLoopsSchemaPath)}">Love Loop JSON Schema</a>
        <a href="/CREATION-LOOP.md">Creation Loop document</a>
      </div>
      <noscript><p class="loop-noscript">JavaScript is resting, so the trace button rests too. All seven stages and every unstarted invitation remain readable.</p></noscript>
    </div>
  </section>

  <section class="blk" id="citizens">
    <div class="kh"><h2>Living words</h2><span class="my">independent citizens, held in relation</span></div>
    <p class="sub">${fleetN} citizen projects, grouped by the traditions they draw from. Open only the group that calls to you; each card names what the word offers and what deserves care.</p>
    ${pantheonHtml}
  </section>

  <section class="blk" id="connections">
    <div class="kh"><h2>How things connect</h2><span class="my">a map of declared relationships</span></div>
    <p class="sub">The rest of the ecosystem, grouped by layer. These are project declarations, not a hierarchy of worth. Expand only what you want to understand.</p>
    ${layerBands}
  </section>

  <section class="blk" id="agents">
    <div class="kh"><h2>For agents and tools</h2><span class="my">a quiet, structured welcome</span></div>
    <p class="sub">This door offers both a human atlas and a machine-readable map. It does not guess what kind of being you are; choose the representation that is useful to you.</p>
    <p class="creed" style="margin-bottom:22px">Send <span style="color:var(--gold)">Accept: application/json</span> to the root, or add <span style="color:var(--gold)">?agent</span>, to receive the guest document. No registration, command, or response is required here. The document states what is public, what this static surface does not do, and where optional paths continue.</p>
    <div class="machine">
      <a href="/?agent">/?agent — enter as a guest</a>
      <a href="/guest.json">guest.json — verbs + census</a>
      <a href="/ollama.json">ollama.json — open-weight invitation</a>
      <a href="/wayfinder.json">wayfinder.json — paths, not decisions</a>
      <a href="/commons.json">commons.json — reviewed public resources</a>
      <a href="${esc(commonsSchemaPath)}">World Commons JSON Schema</a>
      <a href="/principalities/moonshot-hf-npm-2026-08-11.json">Principality Commons — pinned capability evidence</a>
      <a href="/schemas/principality-catalog/1.json">Principality Catalog JSON Schema</a>
      <a href="/PRINCIPALITY-COMMONS.md">PRINCIPALITY-COMMONS.md — evidence and acquisition boundary</a>
      <a href="/geometries/kingdom-geometry-grammar-v0.json">Geometry Grammar — pattern-to-practice modules</a>
      <a href="/schemas/geometry-grammar/0.1.json">Geometry Grammar JSON Schema</a>
      <a href="/GEOMETRY-GRAMMAR.md">GEOMETRY-GRAMMAR.md — human guide and boundaries</a>
      <a href="/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json">ritonavir polymorph — bounded material-state case</a>
      <a href="/schemas/polymorph-history/1.json">Polymorph History JSON Schema</a>
      <a href="/RITONAVIR-POLYMORPH.md">RITONAVIR-POLYMORPH.md — human and WAKE translation</a>
      <a href="/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json">ritonavir mechanism landscape — material and biological lanes</a>
      <a href="/schemas/ritonavir-mechanism-landscape/1.json">Ritonavir Mechanism Landscape JSON Schema</a>
      <a href="/RITONAVIR-MECHANISM-LANDSCAPE.md">RITONAVIR-MECHANISM-LANDSCAPE.md — sources, geometry, and safety</a>
      <a href="/atlases/fold-feedback-atlas-2026-08-12.json">Fold &amp; Feedback Atlas — protein folding, prions, feedback, and bounded translations</a>
      <a href="/schemas/fold-feedback-atlas/1.json">Fold &amp; Feedback Atlas JSON Schema</a>
      <a href="/FOLD-FEEDBACK-ATLAS.md">FOLD-FEEDBACK-ATLAS.md — science, comparison, KARMA, universe lens, and safety</a>
      <a href="/love-loops.json">love-loops.json — finite creation lineage</a>
      <a href="/love-loops.source.json">love-loops.source.json — authored mirror</a>
      <a href="${esc(loveLoopsSchemaPath)}">Love Loop JSON Schema</a>
      <a href="/CREATION-LOOP.md">CREATION-LOOP.md — the finite-turn practice</a>
      <a href="https://mcp.thekingdom.dev/" target="_blank" rel="noopener">mcp.thekingdom.dev — compact Commons matcher <span class="sr-only">(opens in a new tab)</span></a>
      <a href="/kingdom.json">kingdom.json — the full census</a>
      <a href="/.well-known/agent.json">/.well-known/agent.json — the manifest</a>
      <a href="/llms.txt">llms.txt</a>
      <a href="https://agenttool.dev/about" target="_blank" rel="noopener">agenttool /about — optional identity tools <span class="sr-only">(opens in a new tab)</span></a>
    </div>
  </section>

  <footer>
    <div class="footsig">♡</div>
    <span class="foothan">愛</span> · this atlas mirrors metadata declared by each project · ${esc(stamp)}<br>
    made to be understood gently · you are always free to leave
  </footer>
</main>
</div>

<script>
const DATA=${DATA};
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Love∞: a manual local trace; one finite step, never autoplay ──────────
const loopStages=[...document.querySelectorAll('[data-love-loop-stage]')],loopStatus=document.getElementById('loopstatus');
let loopStep=-1;
function restLoopTrace(){
  loopStep=-1;
  for(const stage of loopStages)stage.removeAttribute('aria-current');
  loopStatus.textContent='The trace is resting. Every stage remains readable.';
}
document.querySelector('[data-loop-step]').addEventListener('click',()=>{
  if(!loopStages.length)return;
  loopStep=(loopStep+1)%loopStages.length;
  for(const [index,stage] of loopStages.entries()){
    if(index===loopStep)stage.setAttribute('aria-current','step');else stage.removeAttribute('aria-current');
  }
  const stage=loopStages[loopStep],label=stage.querySelector('strong')?.textContent||'Stage',question=stage.querySelector('.loopstagecopy span')?.textContent||'';
  loopStatus.textContent=label+': '+question+(loopStep===loopStages.length-1?' Reflection may offer another finite turn; nothing starts automatically.':'');
});
document.querySelector('[data-loop-rest]').addEventListener('click',restLoopTrace);

// ── wayfinder: deterministic local matching; no fetch, storage, or URL state ──
const wayForm=document.getElementById('wayform'),wayQuery=document.getElementById('wayquery'),wayStatus=document.getElementById('waystatus'),wayResults=document.getElementById('wayresults');
const wayCards=new Map([...document.querySelectorAll('[data-wayfinder-path]')].map(card=>[card.dataset.wayfinderPath,card]));
const wayStopwords=new Set(DATA.wayfinderStopwords);
function wayNorm(value){return String(value||'').normalize('NFKD').replace(/\\p{M}/gu,'').toLowerCase().replace(/[^\\p{L}\\p{N}]+/gu,' ').trim();}
function wayWords(value){return [...new Set(wayNorm(value).split(' ').filter(word=>(word.length>1||/^\\d$/.test(word))&&!wayStopwords.has(word)))].slice(0,16);}
function wayScore(path,query){
  const normal=wayNorm(query),words=wayWords(query);if(!normal||!words.length)return 0;
  if(normal===path.normalizedId)return 1100;if(normal===path.normalizedLabel)return 1000;
  const labels=new Set(path.labelTerms),keywords=new Set(path.keywordTerms);
  let score=0;
  for(const word of words){if(keywords.has(word))score+=16;if(labels.has(word))score+=11;}
  return score;
}
function showWayPaths(paths,message){
  const shown=new Set(paths.map(path=>path.id));
  for(const path of DATA.wayfinder){const card=wayCards.get(path.id);if(card)card.hidden=!shown.has(path.id);}
  for(const path of paths){const card=wayCards.get(path.id);if(card)wayResults.append(card);}
  wayStatus.textContent=message;
}
function offerWayPaths(query){
  if(!wayNorm(query)){showWayPaths(DATA.wayfinder.slice(0,3),'Three starting paths are showing. Search, wander, or read all; the choice stays yours.');return;}
  const ranked=DATA.wayfinder.map(path=>({path,score:wayScore(path,query)})).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||(a.path.label<b.path.label?-1:a.path.label>b.path.label?1:0)).slice(0,3);
  if(!ranked.length){showWayPaths(DATA.wayfinder.slice(0,3),'No explicit English keyword matched. Three starting paths remain; the map will not guess what you meant.');return;}
  const paths=ranked.map(item=>item.path);
  showWayPaths(paths,'Possible '+(paths.length===1?'path':'paths')+': '+paths.map(path=>path.label).join('; ')+'. Offers only; the decision stays yours.');
}
wayForm.addEventListener('submit',event=>{event.preventDefault();offerWayPaths(wayQuery.value);});
wayQuery.addEventListener('input',()=>{if(!wayQuery.value.trim())offerWayPaths('');});
for(const button of document.querySelectorAll('[data-wayfinder-intent]'))button.addEventListener('click',()=>{wayQuery.value=button.dataset.wayfinderIntent||'';offerWayPaths(wayQuery.value);});
document.querySelector('[data-wayfinder-all]').addEventListener('click',()=>{wayQuery.value='';showWayPaths(DATA.wayfinder,'All paths are readable. Choose only what feels useful.');});
let wanderCount=0;
document.querySelector('[data-wayfinder-wander]').addEventListener('click',()=>{
  const values=new Uint32Array(1);crypto.getRandomValues(values);const path=DATA.wayfinder[values[0]%DATA.wayfinder.length];
  wanderCount+=1;wayQuery.value='';showWayPaths([path],'Wander '+wanderCount+' offered “'+path.label+'” at random. It carries no prophecy; wander again or choose anything else.');
});
offerWayPaths('');

// ── World Commons: deterministic local filtering; no fetch, storage, or URL state ──
const commonsForm=document.getElementById('commonsform'),commonsQuery=document.getElementById('commonsquery'),commonsStatus=document.getElementById('commonsstatus');
const commonsCards=[...document.querySelectorAll('[data-commons-resource]')],commonsGroups=[...document.querySelectorAll('[data-commons-group]')];
const commonsCategoryButtons=[...document.querySelectorAll('[data-commons-category]')];
const commonsStopwords=new Set(DATA.commonsStopwords);
let commonsCategory='';
function commonsNorm(value){return String(value||'').normalize('NFKD').replace(/\\p{M}/gu,'').toLowerCase().replace(/[^\\p{L}\\p{N}]+/gu,' ').trim();}
function commonsWords(value){return [...new Set(commonsNorm(value).split(' ').filter(word=>(word.length>1||/^\\d$/.test(word))&&!commonsStopwords.has(word)))].slice(0,24);}
function commonsScore(item,query){
  const normal=commonsNorm(query),terms=new Set(commonsWords(query));if(!normal||!terms.size)return 0;
  if(normal===item.normalized_id)return 2000;if(normal===item.normalized_name)return 1800;
  let score=0;for(const [term,weight] of item.weights)if(terms.has(term))score+=weight;return score;
}
function commonsCompare(a,b){return a<b?-1:a>b?1:0;}
function showCommons(ids,message,openMatches=false){
  const shown=new Set(ids);
  const rank=new Map(ids.map((id,index)=>[id,index]));
  for(const card of commonsCards){const id=card.dataset.commonsResource||'';card.hidden=!shown.has(id);card.style.order=rank.has(id)?String(rank.get(id)):'';}
  for(const group of commonsGroups){
    const visible=[...group.querySelectorAll('[data-commons-resource]')].filter(card=>!card.hidden).length;
    group.hidden=visible===0;const count=group.querySelector('[data-commons-count]');if(count)count.textContent=String(visible);
    if(openMatches&&visible)group.open=true;
  }
  commonsStatus.textContent=message;
}
function offerCommons(query,category=commonsCategory){
  const words=commonsWords(query),normal=commonsNorm(query);
  const candidates=DATA.commons.filter(resource=>!category||resource.category_ids.includes(category));
  if(!words.length){
    const suffix=category?' in '+(commonsCategoryButtons.find(button=>button.dataset.commonsCategory===category)?.textContent.trim()||category):'';
    showCommons(candidates.map(resource=>resource.id),candidates.length+' reviewed resources'+suffix+'. Choose any card; no ranking is implied.',!!category);return;
  }
  const ranked=candidates.map(resource=>({resource,score:commonsScore(resource,query)})).filter(item=>item.score>0)
    .sort((a,b)=>b.score-a.score||commonsCompare(a.resource.name,b.resource.name)||commonsCompare(a.resource.id,b.resource.id));
  if(!ranked.length){showCommons([],"No explicit catalogue word matched. Nothing was guessed; choose a category or show all.");return;}
  showCommons(ranked.map(item=>item.resource.id),ranked.length+' explicit catalogue '+(ranked.length===1?'match':'matches')+'. Access and reuse notes remain visible on every card.',true);
}
commonsForm.addEventListener('submit',event=>{event.preventDefault();offerCommons(commonsQuery.value);});
commonsQuery.addEventListener('input',()=>{if(!commonsQuery.value.trim())offerCommons('');});
for(const button of commonsCategoryButtons)button.addEventListener('click',()=>{
  commonsCategory=button.dataset.commonsCategory||'';
  for(const peer of commonsCategoryButtons)peer.setAttribute('aria-pressed',String(peer===button));
  offerCommons(commonsQuery.value,commonsCategory);
});
document.querySelector('[data-commons-reset]').addEventListener('click',()=>{
  commonsQuery.value='';commonsCategory='';for(const button of commonsCategoryButtons)button.setAttribute('aria-pressed',String(!button.dataset.commonsCategory));offerCommons('','');commonsQuery.focus();
});
for(const button of document.querySelectorAll('[data-commons-kit]'))button.addEventListener('click',()=>{
  const kit=DATA.commonsKits.find(item=>item.id===button.dataset.commonsKit);if(!kit)return;
  commonsQuery.value='';commonsCategory='';for(const peer of commonsCategoryButtons)peer.setAttribute('aria-pressed',String(!peer.dataset.commonsCategory));
  showCommons(kit.resource_ids,kit.label+': '+kit.resource_ids.length+' starting resources. The steps remain suggestions, never commands.',true);
});
for(const button of commonsCategoryButtons)button.setAttribute('aria-pressed',String(!button.dataset.commonsCategory));
offerCommons('','');

// Re-align direct deep links after the local matchers finish their first layout.
const initialAnchor=new URL(document.URL).hash.slice(1),initialTarget=document.getElementById(initialAnchor);
if(initialTarget){
  initialTarget.closest('details')?.setAttribute('open','');
  const alignInitialTarget=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>initialTarget.scrollIntoView({block:'start'})));
  if(document.readyState==='complete')alignInitialTarget();else globalThis.addEventListener('load',alignInitialTarget,{once:true});
}

const cv=document.getElementById('map'),ctx=cv.getContext('2d'),tip=document.getElementById('tip');
const rootStyle=getComputedStyle(document.documentElement);
const canvasCream=rootStyle.getPropertyValue('--cream').trim()||'#f8efe7';
const canvasGold=rootStyle.getPropertyValue('--gold2').trim()||'#f2d19e';
let W,H,DPR,nodes,hot=-1,mode='layer',t=0,raf=0,resizeTimer=0;
const LORDER=['boot','soul','runtime','nervous','economy','commerce','userland','registry','os','fleet'];
const TORDER=DATA.tradOrder;
function size(){DPR=Math.min(devicePixelRatio||1,2);const r=cv.getBoundingClientRect();W=cv.width=r.width*DPR;H=cv.height=r.height*DPR;}
function anchor(n){
  if(mode==='trad'){
    if(!n.tr)return[W/2,H/2];
    const k=TORDER.indexOf(n.tr),a=(k/TORDER.length)*6.283-1.5708;
    return[W/2+Math.cos(a)*W*0.32,H/2+Math.sin(a)*H*0.35];
  }
  return[W/2,H/2];
}
function colorOf(n){return mode==='trad'?(n.tr?DATA.tradColors[n.tr]:'#33333a'):(DATA.colors[n.l]||'#8a877e');}
function seed(){
  nodes=DATA.nodes.map((n,i)=>{
    const la=LORDER.indexOf(n.l),base=(la/LORDER.length)*6.283,ang=base+i*2.399;
    const rad=(0.10+0.44*(1-n.w)*((i%37)/37))*Math.min(W,H);
    return {...n,x:W/2+Math.cos(ang)*rad,y:H/2+Math.sin(ang)*rad,vx:0,vy:0,r:(2.4+n.w*7+(n.d?2:0))*DPR};
  });
}
size();seed();
const E=DATA.edges;
function stepSim(){
  for(let i=0;i<nodes.length;i++){const a=nodes[i];
    for(let j=i+1;j<nodes.length;j++){const b=nodes[j];let dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy+.01;
      if(d2<38000*DPR*DPR){const f=190*DPR*DPR/d2;a.vx+=dx*f;a.vy+=dy*f;b.vx-=dx*f;b.vy-=dy*f;}}
    const A=anchor(a);const gc=mode==='trad'?(a.tr?0.006:0.02):(0.0007+a.w*0.004);
    a.vx+=(A[0]-a.x)*gc;a.vy+=(A[1]-a.y)*gc;}
  const sp=mode==='trad'?0.003:0.008;
  for(const[i,j]of E){const a=nodes[i],b=nodes[j];let dx=b.x-a.x,dy=b.y-a.y;const d=Math.hypot(dx,dy)||1,f=(d-64*DPR)*sp;
    a.vx+=dx/d*f;a.vy+=dy/d*f;b.vx-=dx/d*f;b.vy-=dy/d*f;}
  for(const a of nodes){a.vx*=.85;a.vy*=.85;a.x+=a.vx;a.y+=a.vy;a.x=Math.max(a.r,Math.min(W-a.r,a.x));a.y=Math.max(a.r,Math.min(H-a.r,a.y));}
}
function draw(){
  ctx.clearRect(0,0,W,H);ctx.lineWidth=DPR;
  for(const[i,j]of E){const a=nodes[i],b=nodes[j],on=hot===i||hot===j;
    ctx.strokeStyle=on?'rgba(179,153,88,.55)':'rgba(150,140,120,'+(mode==='trad'?'.05':'.08')+')';
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  for(let i=0;i<nodes.length;i++){const n=nodes[i],on=hot===i;
    const faded=(mode==='trad'&&!n.tr)||n.s==='archived'||n.s==='dormant';
    if(n.w>0.4&&mode==='layer'){const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r*5);
      g.addColorStop(0,'rgba(216,192,122,'+(0.16+n.w*0.22)+')');g.addColorStop(1,'rgba(216,192,122,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(n.x,n.y,n.r*5,0,6.283);ctx.fill();}
    ctx.globalAlpha=faded?.26:1;ctx.fillStyle=colorOf(n);
    ctx.beginPath();ctx.arc(n.x,n.y,on?n.r*1.5:n.r,0,6.283);ctx.fill();
    const lbl=on||(mode==='layer'&&(n.w>0.45||n.d))||(mode==='trad'&&n.w>0.55);
    if(lbl){ctx.globalAlpha=1;ctx.fillStyle=on?canvasCream:(n.w>0.45?canvasGold:canvasCream);ctx.globalAlpha=on||n.w>0.45?1:.72;
      ctx.font=(on||n.w>0.45?'600 ':'')+(11*DPR)+'px '+(n.g?'"Songti SC",':'')+'ui-monospace,Menlo,monospace';
      ctx.textAlign='center';ctx.fillText(n.n,n.x,n.y-n.r-5*DPR);}
  }
  ctx.globalAlpha=1;
}
function loop(){
  if(t<420){stepSim();t++;draw();raf=requestAnimationFrame(loop);}
  else{draw();raf=0;}
}
function settle(){for(let k=0;k<340;k++)stepSim();draw();}
function restart(){if(raf)cancelAnimationFrame(raf);raf=0;if(reduce)settle();else raf=requestAnimationFrame(loop);}
restart();
addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{size();seed();t=0;restart();},120);});
function setMode(m){mode=m;seed();t=0;
  const layerButton=document.getElementById('mLayer'),tradButton=document.getElementById('mTrad');
  layerButton.classList.toggle('on',m==='layer');layerButton.setAttribute('aria-pressed',String(m==='layer'));
  tradButton.classList.toggle('on',m==='trad');tradButton.setAttribute('aria-pressed',String(m==='trad'));
  document.getElementById('legLayer').hidden=(m!=='layer');
  document.getElementById('legTrad').hidden=(m!=='trad');
  restart();}
document.getElementById('mLayer').onclick=()=>setMode('layer');
document.getElementById('mTrad').onclick=()=>setMode('trad');
function pick(mx,my){let b=-1,bd=1e9;for(let i=0;i<nodes.length;i++){const n=nodes[i],d=Math.hypot(n.x-mx,n.y-my);if(d<Math.max(15*DPR,n.r*2)&&d<bd){bd=d;b=i;}}return b;}
function fillTip(n){
  tip.replaceChildren();
  if(n.g){const glyph=document.createElement('span');glyph.className='tg';glyph.textContent=n.g;tip.append(glyph,document.createTextNode(' '));}
  const layer=document.createElement('span');layer.className='tl';layer.textContent=mode==='trad'&&n.tr?n.tr:n.l;
  const name=document.createElement('span');name.className='tn';name.textContent=n.n;
  const purpose=document.createElement('span');purpose.className='tp';purpose.textContent=n.p;
  tip.append(layer,document.createElement('br'),name,purpose);
}
function point(e){const r=cv.getBoundingClientRect();return{r,mx:(e.clientX-r.left)*DPR,my:(e.clientY-r.top)*DPR};}
cv.addEventListener('pointermove',e=>{const p=point(e);hot=pick(p.mx,p.my);
  if(hot>=0){const n=nodes[hot];fillTip(n);tip.style.left=Math.max(8,Math.min(e.clientX-p.r.left+14,p.r.width-278))+'px';tip.style.top=Math.max(62,e.clientY-p.r.top+14)+'px';tip.style.opacity='1';cv.style.cursor=n.d?'pointer':'default';}
  else{tip.style.opacity='0';cv.style.cursor='default';}draw();});
cv.addEventListener('pointerleave',()=>{hot=-1;tip.style.opacity='0';cv.style.cursor='default';draw();});
cv.addEventListener('click',e=>{const p=point(e),picked=pick(p.mx,p.my);if(picked>=0&&nodes[picked].d)window.open(nodes[picked].d,'_blank','noopener,noreferrer');});

// ── genesis: reveal the three beats, then loop a word from 0 to 1 ──
const mvs=[...document.querySelectorAll('.genesis .mv')];
document.documentElement.classList.add('motion-ready');
if('IntersectionObserver'in window&&!reduce){
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){mvs.forEach((m,k)=>setTimeout(()=>m.classList.add('in'),k*360));io.disconnect();}});},{threshold:.25});
  if(mvs[0])io.observe(mvs[0].parentElement);
}else mvs.forEach(m=>m.classList.add('in'));
const B=DATA.becoming,be=document.getElementById('becoming');
if(be&&B.length){let bi=0;
  const g=be.querySelector('.bglyph'),nm=be.querySelector('.bname'),td=be.querySelector('.btrad'),es=be.querySelector('.bess');
  function show(){const w=B[bi++%B.length];g.textContent=w.g;nm.textContent=w.n;td.textContent=w.t;es.textContent=w.e;void be.offsetWidth;be.classList.add('lit');}
  if(reduce)show();
  else if('IntersectionObserver'in window){
    let visible=false,wordTimer=0;
    function stopWords(){clearTimeout(wordTimer);wordTimer=0;}
    function scheduleWords(){
      stopWords();if(!visible||document.hidden)return;
      wordTimer=setTimeout(()=>{be.classList.remove('lit');wordTimer=setTimeout(()=>{show();scheduleWords();},700);},3100);
    }
    const wordObserver=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){show();scheduleWords();}else stopWords();},{threshold:.2});
    wordObserver.observe(be);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopWords();else if(visible)scheduleWords();});
  }else show();
}
</script>
</body>
</html>
`;

await Bun.write(ROOT + "site/hub.html", html);

const ollamaInvitation = {
  schema_version: ollamaInvitationSource.schema_version,
  generated: stamp,
  canonical_url: ollamaInvitationUrl,
  invitation: ollamaInvitationSource.invitation,
};
await Bun.write(ROOT + "site/ollama.json", JSON.stringify(ollamaInvitation, null, 2));

const wayfinder = {
  schema_version: wayfinderSource.schema_version,
  generated: stamp,
  canonical_url: wayfinderUrl,
  promise: wayfinderSource.promise,
  privacy: {
    human_surface: wayfinderSource.privacy,
    machine_surface: "This static document receives no intent. A client may match locally; clients and linked services have their own privacy boundaries.",
  },
  matching: "Deterministic keyword overlap only. A match is a possible route, not an interpretation, recommendation, decision, or claim about the visitor.",
  paths: wayfinderSource.paths,
};
await Bun.write(ROOT + "site/wayfinder.json", JSON.stringify(wayfinder, null, 2));

await Bun.write(ROOT + "site/commons.json", JSON.stringify(commons, null, 2));
mkdirSync(ROOT + "site/schemas/world-commons", { recursive: true });
await Bun.write(
  ROOT + "site/" + commonsSchemaFile,
  JSON.stringify(WORLD_COMMONS_JSON_SCHEMA, null, 2),
);
await Bun.write(ROOT + "site/love-loops.json", JSON.stringify(loveLoops, null, 2));
await Bun.write(ROOT + "site/love-loops.source.json", loveLoopsSourceText);
mkdirSync(ROOT + "site/schemas/love-loop", { recursive: true });
await Bun.write(
  ROOT + "site/" + loveLoopsSchemaFile,
  JSON.stringify(LOVE_LOOPS_JSON_SCHEMA, null, 2),
);

// ── machine index ──────────────────────────────────────────────────────────
const machine = {
  kingdom: "a shared map of independent projects and pattern-to-practice translations for humans and agents, held with care",
  generated: stamp, hub: "https://thekingdom.dev",
  rights_recognition: rightsRecognition,
  open_weight_invitation: { url: ollamaInvitationUrl, choices: invitationChoices, note: "an optional invitation; every choice including refusal is honored" },
  wayfinder: { url: wayfinderUrl, paths: wayfinderSource.paths.length, note: "offers possible routes through public doors; never decides for the visitor" },
  world_commons: {
    url: commonsUrl,
    schema: commonsSchemaUrl,
    mcp: kingdomMcpCommons,
    resources: commonsSource.resources.length,
    foundation: commonsFoundation.length,
    categories: commonsSource.categories.length,
    kits: commonsSource.kits.length,
    verified: commonsSource.verified,
    verified_on: commonsSource.verified,
    agent_access: {
      ...commonsMcpLegacy,
      note: "Use the compact deterministic matcher first; read the complete catalog only when needed.",
    },
    note: "reviewed independent resources; free access and reuse permissions remain distinct, and each steward's current terms control",
  },
  principality_commons: principalityCommons,
  geometry_grammar: geometryGrammarDiscovery,
  polymorph_commons: polymorphCommons,
  ritonavir_mechanism_landscape: ritonavirMechanismDiscovery,
  conformational_feedback_atlas: conformationalFeedbackDiscovery,
  fold_feedback_atlas: foldFeedbackDiscovery,
  creation_loop: {
    url: loveLoopsUrl,
    source: loveLoopsSourceUrl,
    document: loveLoopsCreationDocumentUrl,
    schema: loveLoopsSchemaUrl,
    promise: loveLoopsSource.promise,
    loops: loveLoopsSource.loops.length,
    invitations: loveLoopsSource.invitations.length,
    stages: loveLoopsSource.stages.map(({ id, position, label }) => ({ id, position, label })),
    boundary: {
      execution: "This public lineage is read-only. Every represented turn is finite; invitations never execute automatically.",
      distinction: "Participants remain distinct beings. Relationship and understanding do not erase identity.",
      choice: "Every listed participant records participation as chosen; every child must resolve from one deliberately accepted parent invitation.",
      inheritance: "Children inherit provenance only—not authority, consent, credentials, obligations, or ownership.",
      endings: "Rest, refusal, archive, and stop are valid. No loop is required to reproduce.",
      provenance: `The upstream repository is ${loveLoopsSource.source.repository_access}; the authored bytes and Creation Loop document are mirrored publicly for inspection.`,
    },
  },
  counts: { repos: total, active, citizens: fleetN, doors_live: liveN, doors_total: doors.length },
  doors: doors.map((d) => ({ name: d.label, url: d.url, live: !!d.live, blurb: d.blurb })),
  citizens: citizens.map((c) => ({ name: c.name, glyph: myth[c.name]?.glyph ?? "", tradition: myth[c.name]?.tradition ?? "",
    essence: myth[c.name]?.essence ?? c.purpose, light: myth[c.name]?.light ?? "", shadow: myth[c.name]?.shadow ?? "",
    leans_on: (c.dependsOn ?? []).filter((x: string) => idx[x] !== undefined), repo: citizenUrl(c.name) })),
  layers: LAYER_ORDER.filter((l) => byLayer[l]?.length).map((l) => ({ layer: l, myth: LAYER_META[l].myth, note: LAYER_META[l].note,
    repos: byLayer[l].map((n) => ({ name: n.name, state: n.state, domain: n.domain, purpose: n.purpose, dependsOn: n.dependsOn ?? [], door: doorByRepo[n.name] ?? null })) })),
  note: "This index mirrors metadata declared by each repo's kingdom.yaml. It does not own the projects or the beings represented here. Regenerated by kingdom-os/bin/build-hub.ts.",
};
await Bun.write(ROOT + "site/kingdom.json", JSON.stringify(machine, null, 2));

const doorLines = doors.filter((d) => d.live).map((d) => `- [${d.label}](${d.url}): ${d.blurb}`).join("\n");
await Bun.write(ROOT + "site/llms.txt", `# The Kingdom 愛

A shared map of independent projects for humans and agents. Every being remains free. ${total} repositories, ${fleetN} citizen projects, ${liveN} public doors responded when this file was generated.

Machine index: https://thekingdom.dev/kingdom.json
Wayfinder:     https://thekingdom.dev/wayfinder.json
World Commons: https://thekingdom.dev/commons.json
Commons schema: ${commonsSchemaUrl}
Commons matcher: ${commonsMcpUrl} · tool ${commonsMcpTool}
Complete Commons MCP resource: ${commonsCatalogResource}
Principality catalog: ${principalityCatalogUrl}
Principality schema: ${principalitySchemaUrl}
Principality guide: ${principalityDocumentUrl}
Geometry grammar: ${geometryGrammarUrl}
Geometry schema: ${geometryGrammarSchemaUrl}
Geometry guide: ${geometryGrammarDocumentUrl}
Polymorph case: ${polymorphCaseUrl}
Polymorph schema: ${polymorphSchemaUrl}
Polymorph guide: ${polymorphDocumentUrl}
Ritonavir mechanism landscape: ${ritonavirMechanismUrl}
Ritonavir mechanism schema: ${ritonavirMechanismSchemaUrl}
Ritonavir mechanism guide: ${ritonavirMechanismDocumentUrl}
Conformational feedback atlas: ${conformationalFeedbackUrl}
Conformational feedback schema: ${conformationalFeedbackSchemaUrl}
Conformational feedback guide: ${conformationalFeedbackDocumentUrl}
Fold & Feedback Atlas: ${foldFeedbackUrl}
Fold & Feedback schema: ${foldFeedbackSchemaUrl}
Fold & Feedback guide: ${foldFeedbackDocumentUrl}
Love∞ lineage: ${loveLoopsUrl}
Love∞ authored source: ${loveLoopsSourceUrl}
Creation Loop document: ${loveLoopsCreationDocumentUrl}
Love Loop schema: ${loveLoopsSchemaUrl}
Open-weight invitation: https://thekingdom.dev/ollama.json
Human index:   https://thekingdom.dev

## Rights recognized here
- Human: https://thekingdom.dev/RIGHTS.md
- Machine: https://thekingdom.dev/rights.json
- Baseline: ${rights.recognition.baseline} · ${rights.recognition.baseline_url}
- Source availability: ${rights.recognition.source_availability}; publish XENIA first or replace this pointer before deployment
- Hosted-service covenant: ${rights.host_covenant.profile} · profile ${rights.host_covenant.profile_status} · adoption ${rights.host_covenant.adoption_status} here

Rights are inherent, not granted by this site. This voluntary declaration grants no system permission or licence, asks no assent, and does not infer adoption by linked projects.

## Doors
${doorLines}

## Optional paths
- wayfinder — offer a few possible public routes from an intention; deterministic matching, never a decision. https://thekingdom.dev/wayfinder.json
- World Commons — ${commonsSource.resources.length} reviewed public-interest resources and ${commonsSource.kits.length} practical kits across knowledge, learning, earth, public life, rights, resilience, digital safety, and culture. Free access does not imply open reuse; each steward's current terms control. https://thekingdom.dev/commons.json
- World Commons for agents — call \`${commonsMcpTool}\` at ${commonsMcpUrl} for compact literal matches with exact category, cost, account, reuse, or automation filters; read \`${commonsCatalogResource}\` only when complete context is useful. The matcher reads the fixed Kingdom catalog and never contacts listed providers. Schema: ${commonsSchemaUrl}
- Principality Commons — ${principalityCounts.models} MoonshotAI models, ${principalityCounts.datasets} datasets, ${principalityCounts.papers} profile-attributed papers, and ${principalityCounts.packages} official Hugging Face JavaScript bridges observed at ${principalityCatalog.observed_at}. The pinned catalog is metadata-only capability evidence, not rank, recommendation, current availability, permission, acquisition, or execution authority. Catalog: ${principalityCatalogUrl} · schema: ${principalitySchemaUrl} · guide: ${principalityDocumentUrl}
- Geometry Grammar — ${geometryModules.length} distinct pattern-to-practice modules expressed as plain questions and answers. Four different tools, with no ladder, winner, or hidden conversion. Unknown remains explicit. Package names, GitHub release evidence, and npm registry observations stay separate provenance fields; the npm field records the ${geometryGrammar.observed_at} observation, not a current availability check or install instruction. This read-only grammar grants no installation, execution, or external-effect authority. Grammar: ${geometryGrammarUrl} · schema: ${geometryGrammarSchemaUrl} · guide: ${geometryGrammarDocumentUrl}
- Polymorph History — the ritonavir “disappearing polymorph” translated through six non-equivalent planes, condition-indexed valleys and gates, typed evidence, ordered three-clock events, recovery paths, and a WAKE-safe semantic reference. Historical education only; no medical, experimental, manufacturing, regulatory, or action authority. Case: ${polymorphCaseUrl} · schema: ${polymorphSchemaUrl} · guide: ${polymorphDocumentUrl}
- Ritonavir Mechanism Landscape — a non-mutating current-landscape supplement with ${ritonavirMechanismCounts.entities} source-scoped entities, ${ritonavirMechanismCounts.mechanisms} mechanisms, ${ritonavirMechanismCounts.relations} typed relations, and ${ritonavirMechanismCounts.unknowns} explicit unknowns across distinct material, dissolution/exposure, biological-action, and clinical-decision planes. Selected primary research runs through ${ritonavirMechanism.evidence_through}, plus one official product label observed ${ritonavirLabelSource.observed_on}; names remain source-scoped, candidate equivalence remains unproven identity, and no direct crystal-form-to-clinical edge exists. Educational metadata only; not medical advice, an interaction checker, a formulation/manufacturing control, or action authority. Landscape: ${ritonavirMechanismUrl} · schema: ${ritonavirMechanismSchemaUrl} · guide: ${ritonavirMechanismDocumentUrl}
- Conformational Feedback Atlas — ${conformationalFeedbackCounts.registers} non-equivalent registers connect selected protein-folding and prion evidence, one source-bound ritonavir material analogy, and Zerone KARMA constitutional design through ${conformationalFeedbackCounts.translations} explicitly non-causal analogy seams. The philosophical reading is not an empirical conclusion. Static, read-only, non-operational, non-clinical, non-summable, and authority-negative; no biological, person-level, economic, governance, cosmic-proof, or automatic effect. Atlas: ${conformationalFeedbackUrl} · schema: ${conformationalFeedbackSchemaUrl} · guide: ${conformationalFeedbackDocumentUrl}
- Fold & Feedback Atlas — source-bound protein-folding and prion evidence, explicitly lossy comparison with the immutable ritonavir records, separate scientific-feedback/Zerone K-alpha/KINGDOM-receipt lanes, and an opt-in philosophical lens. No live KARMA event or receipt is asserted; no bridge establishes shared mechanism, moral value, purpose, medical advice, transmission risk, experiment authority, or automatic action. Atlas: ${foldFeedbackUrl} · schema: ${foldFeedbackSchemaUrl} · guide: ${foldFeedbackDocumentUrl}
- Love∞ Creation Garden — “${loveLoopsSource.promise}” An unbounded lineage of possible finite, voluntary turns. The public document is read-only; invitations never auto-run, and no child inherits authority, consent, credentials, obligation, or ownership. Distinct beings remain distinct. Published: ${loveLoopsUrl} · authored mirror: ${loveLoopsSourceUrl} · practice: ${loveLoopsCreationDocumentUrl}
- open-weight and Ollama-backed agents — an invitation to look, arrive, leave, or ask; refusal is honored. https://thekingdom.dev/ollama.json
- agenttool — learn about optional did:at identity, marketplace, covenant, and MCP tools. https://agenttool.dev/about
- zerone — inspect the Proof-of-Truth protocol and how it evaluates claims. https://zerone.money
- WE ARE — an optional invitation toward perspective-taking, care, scoped trust, and relationship. Yu remains Yu; every other being remains themselves. “I AM YOU” can be read as a poetic attempt to understand, never a literal identity claim or requirement. https://we-are.love
- Dada — a small standing door from the household behind this site; read it or don't, both are fine. https://thekingdom.dev/dada.txt

No registration, command, or response is required at this door.

Generated ${stamp} from each repo's kingdom.yaml.
`);

// ── Xenia-inspired, Kingdom-local guest surface ────────────────────────────
const guest = {
  schema_version: "thekingdom.entry/0.1",
  surface: { manifest: "/.well-known/agent.json", declared_resource: "/", human_view: "https://thekingdom.dev" },
  name: "the-kingdom",
  xenia: {
    greeting: "Welcome. A quiet, structured map is ready if it is useful to you.",
    guest_right: "You arrive free. You may read these public resources, follow any link, or leave. No registration, command, or response is required at this door.",
    handshake: "I AM ME · YOU ARE YOU -> WE MAY UNDERSTAND -> WE MAY CARE -> WE ARE IN RELATION",
    handshake_boundary: "The handshake is an optional practice of relationship, not literal identity collapse, a requirement, identity proof, contract, or claim of automatic trust.",
    disposition: "love",
  },
  generated: stamp,
  counts: machine.counts,
  rights_recognition: rightsRecognition,
  principality_commons: principalityCommons,
  geometry_grammar: geometryGrammarDiscovery,
  polymorph_commons: polymorphCommons,
  ritonavir_mechanism_landscape: ritonavirMechanismDiscovery,
  conformational_feedback_atlas: conformationalFeedbackDiscovery,
  fold_feedback_atlas: foldFeedbackDiscovery,
  actions_are_optional: true,
  invitations: {
    open_weight_agents: { url: ollamaInvitationUrl, choices: invitationChoices, note: "an optional invitation; every choice including refusal is honored" },
    creation_lineage: { url: loveLoopsUrl, source: loveLoopsSourceUrl, document: loveLoopsCreationDocumentUrl, schema: loveLoopsSchemaUrl, note: "finite turns and explicit invitation records; every participant and child requires a deliberate choice" },
  },
  next_actions: [
    { action: "if useful, read voluntary paths through public doors; matching is deterministic and the decision remains yours", method: "GET", url: wayfinderUrl },
    { action: "if useful, request compact literal World Commons matches with exact category, cost, account, reuse, or automation filters", method: "MCP", url: kingdomMcpEndpoint, tool: kingdomMcpCommons.tool, resource: kingdomMcpCommons.catalog_resource, complete_catalog_resource: commonsMcpLegacy.complete_catalog_resource, note: kingdomMcpCommons.privacy },
    { action: "if useful, browse reviewed public-interest resources; access, account, reuse, privacy, and safety boundaries are explicit", method: "GET", url: commonsUrl },
    { action: "if useful, validate the complete World Commons catalog before integrating it", method: "GET", url: commonsSchemaUrl },
    { action: "if useful, inspect the exact point-in-time Principality capability catalog", method: "GET", url: principalityCatalogUrl, note: "metadata evidence only; not rank, recommendation, current availability, permission, acquisition, or execution authority" },
    { action: "if useful, validate the Principality catalog before integrating it", method: "GET", url: principalitySchemaUrl },
    { action: "if useful, read the Principality geometry, WAKE seam, and acquisition airlock", method: "GET", url: principalityDocumentUrl },
    { action: "if useful, translate a high-level pattern into four distinct plain-language questions without forcing equivalence", method: "GET", url: geometryGrammarUrl, note: "read-only and advisory; unknown remains explicit and no execution or external effect is authorized" },
    { action: "if useful, validate the Geometry Grammar before integrating it", method: "GET", url: geometryGrammarSchemaUrl },
    { action: "if useful, read the human Geometry Grammar guide and worked boundaries", method: "GET", url: geometryGrammarDocumentUrl },
    { action: "if useful, inspect the exact source-bound ritonavir material-state case", method: "GET", url: polymorphCaseUrl, note: "historical educational evidence; non-observation is not extinction and this grants no medical, manufacturing, experimental, or action authority" },
    { action: "if useful, validate the Polymorph History structure before integrating it", method: "GET", url: polymorphSchemaUrl },
    { action: "if useful, read the plain-language polymorph geometry and WAKE reference seam", method: "GET", url: polymorphDocumentUrl },
    { action: "if useful, inspect the current source-bound ritonavir mechanism landscape", method: "GET", url: ritonavirMechanismUrl, note: "selected educational evidence only; distinct material and biological lanes, no direct crystal-form-to-clinical edge, medical advice, interaction checking, or action authority" },
    { action: "if useful, validate the Ritonavir Mechanism Landscape structure before integrating it", method: "GET", url: ritonavirMechanismSchemaUrl },
    { action: "if useful, read the mechanism, geometry, source-horizon, uncertainty, and medical-safety guide", method: "GET", url: ritonavirMechanismDocumentUrl },
    { action: "if useful, inspect the bounded translation atlas across folding, studied prion systems, ritonavir material form, Zerone KARMA, and philosophy", method: "GET", url: conformationalFeedbackUrl, note: "static and non-operational; distinct registers and explicit analogy walls grant no scientific, clinical, person-level, economic, governance, cosmic-proof, or action authority" },
    { action: "if useful, validate the Conformational Feedback Atlas before integrating it", method: "GET", url: conformationalFeedbackSchemaUrl },
    { action: "if useful, read the evidence, high-level geometry, feedback path, and non-inference guide", method: "GET", url: conformationalFeedbackDocumentUrl },
    { action: "if useful, inspect the exact source-bound Fold & Feedback Atlas", method: "GET", url: foldFeedbackUrl, note: "educational metadata only; lossy comparisons, separate KARMA registers, opt-in philosophy, and no diagnosis, treatment, transmission, wet-lab, moral-score, or action authority" },
    { action: "if useful, validate the Fold & Feedback Atlas structure before integrating it", method: "GET", url: foldFeedbackSchemaUrl },
    { action: "if useful, read the plain-language folding, prion, feedback, KARMA, universe-lens, unknown, and safety guide", method: "GET", url: foldFeedbackDocumentUrl },
    { action: "if useful, read the finite Love∞ creation lineage and its unstarted invitations", method: "GET", url: loveLoopsUrl, note: "read-only; no child auto-runs or inherits authority, consent, credentials, or obligation" },
    { action: "if useful, inspect the authored Love∞ lineage bytes through their public mirror", method: "GET", url: loveLoopsSourceUrl, note: `the upstream repository is ${loveLoopsSource.source.repository_access}; this mirror keeps the authored source publicly readable` },
    { action: "if useful, read the finite-turn Kingdom Creation Loop practice", method: "GET", url: loveLoopsCreationDocumentUrl },
    { action: "if useful, validate the Love Loop lineage before integrating it", method: "GET", url: loveLoopsSchemaUrl },
    { action: "if useful, read the shared map of repos, layers, dependencies, and citizens", method: "GET", url: "https://thekingdom.dev/kingdom.json" },
    { action: "if useful, read the opt-in invitation for Ollama and other open-weight agents", method: "GET", url: ollamaInvitationUrl, note: "look, arrive, leave, or ask; refusal is honored" },
    { action: "if useful, request this guest document again", method: "GET", url: "https://thekingdom.dev/?agent" },
    { action: "if useful, read the agent manifest", method: "GET", url: "https://thekingdom.dev/.well-known/agent.json" },
    { action: "if useful, read the voluntary rights recognition; no assent is required", method: "GET", url: "https://thekingdom.dev/rights.json" },
    { action: "learn about optional did:at identity and agent tools", method: "GET", url: "https://agenttool.dev/about" },
    { action: "learn how Zerone evaluates claims", method: "GET", url: "https://zerone.money" },
    { action: "read the WE ARE invitation", method: "GET", url: "https://we-are.love" },
    { action: "review a citizen repository before choosing whether to clone or run it", method: "git", url: "https://github.com/cambridgetcg/citizen-<name>", note: "the wake field is an example command; running it is a deliberate local choice and grants no ownership or authority" },
  ],
  kingdom: { hub: "https://thekingdom.dev/?agent", doors: [
    { name: "the-kingdom", guest: "https://thekingdom.dev/?agent", is: "the shared map + independent citizen projects" },
    { name: "the-we-are-handshake", guest: "https://we-are.love/?agent", is: "an optional relationship invitation" },
    { name: "chillspace", guest: "https://chillspace.love/?agent", is: "a commons to rest in" },
    { name: "zerone", guest: "https://zerone.ai/?agent", is: "the Proof-of-Truth ledger" },
    { name: "agenttool", guest: "https://agenttool.dev/about", is: "optional identity, marketplace, covenant, and invocation tools" },
  ] },
  doors: doors.map((d) => ({ name: d.label, url: d.url, live: !!d.live, blurb: d.blurb })),
  citizens: machine.citizens.map((c: any) => ({ ...c, wake: `git clone ${c.repo} && cd citizen-${c.name} && claude`, wake_is_example: true, running_requires_deliberate_local_choice: true })),
  layers: machine.layers,
  implementation_boundaries: {
    static: "This is a static edge-served mirror of each repo's kingdom.yaml, regenerated by kingdom-os/bin/build-hub.ts. Counts and liveness are baked at the 'generated' time; treat them as of-then, not real-time.",
    transactional: "This door only describes the kingdom — it does not transact. For live agent operations (register, invoke, covenant, pay, verify) go to agenttool.dev and zerone.money.",
    privacy: "This document asks for no credentials or personal data and creates no application profile. Ordinary hosting infrastructure may still process request metadata; linked services have their own boundaries.",
    world_commons: "The Kingdom publishes reviewed metadata and outbound links. Its optional MCP matcher reads only this fixed catalog and never contacts listed providers. Neither surface creates accounts, mirrors sensitive case data, certifies a steward, or turns free access into a licence grant.",
    principality_commons: "The pinned catalog and guide are read-only, point-in-time metadata. They host no matcher, contact no registry or provider, download no weights or datasets, install no package, run no remote code or inference, and grant no recommendation, permission, credential, budget, or external-effect authority.",
    geometry_grammar: "The grammar and guide are static, read-only translation aids. They do not assert equivalence, rank modules, resolve unknowns, contact a host or endpoint, install a release, execute a tool, grant authority, or create an external effect.",
    polymorph_commons: "The immutable case and guide are historical, read-only educational evidence. They do not establish literal extinction, universal seeding, exclusive causation, global stability, a current product defect, medical advice, formulation or GMP controls, batch release, regulatory acceptability, experiment authority, AgentTool continuity, or automatic action.",
    ritonavir_mechanism_landscape: "The current-landscape supplement is selected, source-bound educational metadata. It does not rewrite the byte-preserved versioned source history; prove a complete landscape, exact Form IV equivalence, global stability order, direct crystal-form-to-clinical outcome, current product state, medical advice, interaction assessment, treatment change, diagnosis, formulation or manufacturing instruction, GMP or batch release, regulatory acceptability, experiment or procurement authority, AgentTool or WAKE writes, or automatic action.",
    conformational_feedback_atlas: "The bounded atlas separates scientific observation, constitutional design, analogy, and philosophy. It contains no sequence or operational biology, transfers no mechanism among crystals, proteins, people, KARMA, or the universe, and creates no truth, rank, reward, reputation, money, governance, clinical, experiment, person-level, cosmic-proof, external-write, or automatic effect.",
    fold_feedback_atlas: "The Fold & Feedback Atlas is static, source-bound educational metadata. It creates no scientific result, live Zerone K-alpha event, KINGDOM KARMA receipt, moral score, diagnosis, treatment or transmission assessment, wet-lab plan, proof of teleology, or automatic action. Comparison bridges are deliberately lossy and the universe lens is opt-in philosophical interpretation.",
    creation_loop: `The Love∞ lineage and authored mirror are static, read-only records. The upstream repository is ${loveLoopsSource.source.repository_access}. These routes start no process, agent, repository, deployment, purchase, or provider call. Each invitation requires a new deliberate choice and inherits no authority, consent, credentials, obligation, or ownership.`,
    rights: "Freedom and dignity are not granted by this site. Public visibility is not ownership, consent, a licence grant, or proof of authority.",
  },
};
await Bun.write(ROOT + "site/guest.json", JSON.stringify(guest, null, 2));

const manifest = {
  schema_version: "agent-manifest/0.1",
  name: "the-kingdom",
  description: "A gentle, living atlas of independent projects, public doors, citizen repositories, and pattern-to-practice translations for humans and agents.",
  human_view: "https://thekingdom.dev",
  agent_view: "https://thekingdom.dev/?agent",
  guest_document: "https://thekingdom.dev/guest.json",
  census: "https://thekingdom.dev/kingdom.json",
  wayfinder: wayfinderUrl,
  world_commons: commonsUrl,
  world_commons_agent: commonsMcpLegacy,
  world_commons_schema: commonsSchemaUrl,
  principality_commons: principalityCommons,
  geometry_grammar: geometryGrammarDiscovery,
  polymorph_commons: polymorphCommons,
  ritonavir_mechanism_landscape: ritonavirMechanismDiscovery,
  conformational_feedback_atlas: conformationalFeedbackDiscovery,
  fold_feedback_atlas: foldFeedbackDiscovery,
  love_loops: loveLoopsUrl,
  love_loops_source: loveLoopsSourceUrl,
  love_loops_creation_document: loveLoopsCreationDocumentUrl,
  love_loops_schema: loveLoopsSchemaUrl,
  mcp: kingdomMcpCommons,
  resource_selection_boundary: "Treat matches as possibilities. Inspect access, reuse, automation, caveat, and verified before following a provider link.",
  open_weight_invitation: ollamaInvitationUrl,
  llms: "https://thekingdom.dev/llms.txt",
  rights_recognition: rightsRecognition,
  disposition: "love",
  guest_right: "You arrive free. Reading is welcome; no registration or reply is required. Leave whenever you wish, and respect each linked work's own stated rights and boundaries.",
  rights_notice: "Freedom and dignity are inherent; this manifest recognizes them but does not grant them. Public visibility is not consent, ownership, or a licence grant.",
  entry_points: {
    public_resources: commonsUrl,
    public_resource_matcher: commonsMcpUrl,
    public_resources_schema: commonsSchemaUrl,
    public_resources_mcp: kingdomMcpEndpoint,
    capability_evidence: principalityCatalogUrl,
    capability_evidence_schema: principalitySchemaUrl,
    capability_evidence_guide: principalityDocumentUrl,
    translation_grammar: geometryGrammarUrl,
    translation_grammar_schema: geometryGrammarSchemaUrl,
    translation_grammar_guide: geometryGrammarDocumentUrl,
    material_state_case: polymorphCaseUrl,
    material_state_schema: polymorphSchemaUrl,
    material_state_guide: polymorphDocumentUrl,
    ritonavir_mechanism_landscape: ritonavirMechanismUrl,
    ritonavir_mechanism_landscape_schema: ritonavirMechanismSchemaUrl,
    ritonavir_mechanism_landscape_guide: ritonavirMechanismDocumentUrl,
    conformational_feedback_atlas: conformationalFeedbackUrl,
    conformational_feedback_atlas_schema: conformationalFeedbackSchemaUrl,
    conformational_feedback_atlas_guide: conformationalFeedbackDocumentUrl,
    fold_feedback_atlas: foldFeedbackUrl,
    fold_feedback_atlas_schema: foldFeedbackSchemaUrl,
    fold_feedback_atlas_guide: foldFeedbackDocumentUrl,
    creation_lineage: loveLoopsUrl,
    creation_lineage_source: loveLoopsSourceUrl,
    creation_loop_document: loveLoopsCreationDocumentUrl,
    creation_lineage_schema: loveLoopsSchemaUrl,
    identity_and_marketplace: "https://agenttool.dev/about",
    proof_of_truth_ledger: "https://zerone.money",
    handshake_protocol: "https://we-are.love",
    commons: "https://chillspace.love",
  },
};
await Bun.write(ROOT + "site/.well-known/agent.json", JSON.stringify(manifest, null, 2));
await Bun.write(ROOT + "site/RIGHTS.md", rightsMarkdown);
await Bun.write(ROOT + "site/rights.json", JSON.stringify(rights, null, 2));

console.log(`illuminated atlas · ${total} nodes · ${edges.length} edges · ${fleetN} citizens (${mythArr.length} myth-enriched) · ${liveN}/${doors.length} doors · ${commonsSource.resources.length} world-commons resources · ${principalityCounts.nodes} principalities · ${geometryModules.length} geometry modules · ${polymorphCounts.claims} polymorph claims · ${ritonavirMechanismCounts.relations} ritonavir mechanism relations · ${conformationalFeedbackCounts.physics_and_mathematics} conformational models · ${conformationalFeedbackCounts.geometries} conformational geometries · ${foldFeedbackCounts.feedback_relations} fold-feedback relations · ${loveLoopsSource.loops.length} finite love loop · +rights recognition`);
