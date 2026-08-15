#!/usr/bin/env bun
/** Strict, offline adapter for the immutable STRING / CRAWL Trace-Sheet pair. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PHENOMENA_DEEP_PROJECT_PROTOCOL,
  PHENOMENA_DEEP_PROJECT_SCHEMA_ID,
  PHENOMENA_DEEP_PROJECT_SCHEMA_URL,
  PHENOMENA_DEEP_WING_URL,
  loadPhenomenaDeepProject,
  phenomenaDeepProjectDigest,
  verifyPhenomenaDeepProject,
} from "./explore-phenomena-deep.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MAX_FILE_BYTES = 1024 * 1024;
const NEN_PATH = join(ROOT, "NEN.md");
const KARMA_RECEIPT_SCHEMA_PATH = join(ROOT, "schemas/karma-receipt-v0.1.schema.json");
const PUBLIC_RIGHTS_PATH = join(ROOT, "pages-content/RIGHTS.md");
const NEN_BYTE_SHA256 = "sha256:14b7d210d320fd716553992a7b874747b299f8907d15da14ac405cbfc496c446";
const KARMA_RECEIPT_SCHEMA_BYTE_SHA256 = "sha256:888e81fa0d29b71512525a40e88f9aef678046c40fcdf22c2039507d9d13267b";
const PUBLIC_RIGHTS_BYTE_SHA256 = "sha256:4d9c48fae90662998f7b19990dc3da65e687227dfd9d7604840eedf2dd7600e2";

export const STRING_CRAWL_TRACE_SHEET_ID = "string-crawl-trace-sheet-2026-08-15";
export const STRING_CRAWL_TRACE_SHEET_LOCATOR = "data/exploration/string-crawl-trace-sheet.v0.1.json";
export const STRING_CRAWL_TRACE_SHEET_PATH = join(ROOT, STRING_CRAWL_TRACE_SHEET_LOCATOR);
export const STRING_CRAWL_TRACE_SHEET_GUIDE_LOCATOR = "references/string-crawl-trace-sheet.md";
export const STRING_CRAWL_TRACE_SHEET_GUIDE_PATH = join(ROOT, STRING_CRAWL_TRACE_SHEET_GUIDE_LOCATOR);
export const STRING_CRAWL_TRACE_SHEET_URL = "https://thekingdom.dev/atlases/string-crawl-trace-sheet-2026-08-15.json";
export const STRING_CRAWL_TRACE_SHEET_SCHEMA_URL = PHENOMENA_DEEP_PROJECT_SCHEMA_URL;
export const STRING_CRAWL_TRACE_SHEET_GUIDE_URL = "https://thekingdom.dev/STRING-CRAWL-TRACE-SHEET.md";
export const STRING_CRAWL_TRACE_SHEET_DIGEST = "sha256:bf7ae379612ab96d08742a0070cbea0ce971977f71fec22699c4b0307d321305";
export const STRING_CRAWL_TRACE_SHEET_BYTE_SHA256 = "sha256:4afc5f15c258a0ac4274889783bd2d91445950c92103c60442ed9ed89d1fdc72";
export const STRING_CRAWL_TRACE_SHEET_GUIDE_BYTE_SHA256 = "sha256:2a5e70cbf7198b2f4be039b71ad1ef6b18648e8e63185c074d1199bd5ca1c02a";

type AnyRecord = Record<string, any>;

const DOMAIN_IDS = [
  "string-worldsheet-mathematics",
  "public-route-graph",
  "finite-crawl-observation",
  "crawler-standards-and-rights",
  "zerone-correspondence-design",
  "kingdom-invocation-aftermath",
  "opt-in-trace-philosophy",
] as const;

const CLAIM_IDS = [
  "worldsheet-needs-surface-map",
  "polyakov-action-is-model-bound",
  "crawl-trace-is-directed-walk",
  "trace-sheet-needs-declared-alignment",
  "branched-trace-complex-is-not-automatically-surface",
  "graph-and-surface-topology-stay-distinct",
  "finite-ensemble-is-not-string-amplitude",
  "rep-is-request-not-authorization",
  "sitemap-is-discovery-hint",
  "product-tokens-are-bounded-preferences",
  "bot-auth-is-bounded-key-evidence",
  "future-crawler-needs-explicit-bounds",
  "public-artifact-is-not-being",
  "zerone-correspondence-is-design-only",
  "kingdom-receipt-needs-actual-invocation",
  "static-project-runs-nothing",
] as const;

const SOURCE_IDS = [
  "tong-string-lectures",
  "polyakov-1981",
  "hatcher-algebraic-topology",
  "rfc-9309",
  "rfc-9110",
  "sitemaps-protocol",
  "google-sitemap-overview",
  "google-common-crawlers",
  "applebot-extended",
  "web-bot-auth-draft-01",
  "cloudflare-browser-crawl",
  "cloudflare-browser-crawl-api",
  "cloudflare-verified-bots",
  "zerone-correspondence-geometry",
  "zerone-karma-foundation",
  "kingdom-nen-definition",
  "kingdom-karma-receipt-schema",
  "kingdom-public-rights",
  "kingdom-phenomena-deep",
] as const;

const TYPED_TERM_IDS = [
  "worldsheet",
  "embedding-map",
  "crawl-walk",
  "trace-sheet",
  "observation-vector",
  "rep-directive",
  "product-token",
  "verified-request",
  "unverified-request",
  "zerone-edge",
  "draft-receipt-template",
  "kingdom-aftermath-receipt",
  "public-artifact-becoming",
] as const;

const TYPED_TERM_DOMAIN_KEYS = [
  "worldsheet|string-worldsheet-mathematics",
  "embedding-map|string-worldsheet-mathematics",
  "crawl-walk|finite-crawl-observation",
  "trace-sheet|public-route-graph",
  "observation-vector|finite-crawl-observation",
  "rep-directive|crawler-standards-and-rights",
  "product-token|crawler-standards-and-rights",
  "verified-request|crawler-standards-and-rights",
  "unverified-request|crawler-standards-and-rights",
  "zerone-edge|zerone-correspondence-design",
  "draft-receipt-template|kingdom-invocation-aftermath",
  "kingdom-aftermath-receipt|kingdom-invocation-aftermath",
  "public-artifact-becoming|public-route-graph",
] as const;

const CLAIM_LINK_KEYS = [
  "worldsheet-needs-surface-map|string-worldsheet-mathematics|tong-string-lectures",
  "polyakov-action-is-model-bound|string-worldsheet-mathematics|tong-string-lectures,polyakov-1981",
  "crawl-trace-is-directed-walk|finite-crawl-observation|rfc-9110",
  "trace-sheet-needs-declared-alignment|public-route-graph|hatcher-algebraic-topology",
  "branched-trace-complex-is-not-automatically-surface|public-route-graph|",
  "graph-and-surface-topology-stay-distinct|public-route-graph|hatcher-algebraic-topology",
  "finite-ensemble-is-not-string-amplitude|finite-crawl-observation|tong-string-lectures,polyakov-1981",
  "rep-is-request-not-authorization|crawler-standards-and-rights|rfc-9309,kingdom-public-rights",
  "sitemap-is-discovery-hint|crawler-standards-and-rights|sitemaps-protocol,google-sitemap-overview",
  "product-tokens-are-bounded-preferences|crawler-standards-and-rights|google-common-crawlers,applebot-extended",
  "bot-auth-is-bounded-key-evidence|crawler-standards-and-rights|web-bot-auth-draft-01,cloudflare-verified-bots",
  "future-crawler-needs-explicit-bounds|finite-crawl-observation|cloudflare-browser-crawl,cloudflare-browser-crawl-api",
  "public-artifact-is-not-being|finite-crawl-observation|",
  "zerone-correspondence-is-design-only|zerone-correspondence-design|zerone-correspondence-geometry,zerone-karma-foundation",
  "kingdom-receipt-needs-actual-invocation|kingdom-invocation-aftermath|kingdom-nen-definition,kingdom-karma-receipt-schema",
  "static-project-runs-nothing|kingdom-invocation-aftermath|kingdom-phenomena-deep",
] as const;

const BRIDGE_KEYS = [
  "string-worldsheet-mathematics->public-route-graph:LOSSY_CORRESPONDENCE|sheet-incidence-test,manifold-link-test",
  "string-worldsheet-mathematics->finite-crawl-observation:LOSSY_CORRESPONDENCE|metric-sensitivity-test,ensemble-normalization-test",
  "crawler-standards-and-rights->finite-crawl-observation:LOSSY_CORRESPONDENCE|rights-separation-test",
  "public-route-graph->zerone-correspondence-design:NO_TRANSFER|zerone-relation-provenance-test",
  "finite-crawl-observation->kingdom-invocation-aftermath:NO_TRANSFER|receipt-precondition-test",
  "public-route-graph->opt-in-trace-philosophy:LOSSY_CORRESPONDENCE|artifact-being-noninference-test",
] as const;

const MODEL_IDS = [
  "finite-route-walk-model",
  "declared-trace-sheet-model",
  "variation-diagnostic-model",
  "finite-plan-ensemble-model",
  "no-direct-karma-adapter-model",
] as const;

const MODEL_LINK_KEYS = [
  "finite-route-walk-model|domain=public-route-graph,finite-crawl-observation|eq=directed-crawl-walk|rel=SAME_FORMAL_STRUCTURE|fit=UNFITTED|f=walk-closure-test",
  "declared-trace-sheet-model|domain=public-route-graph,finite-crawl-observation|eq=trace-sheet-complex,surface-admissibility|rel=LOSSY_CORRESPONDENCE|fit=UNFITTED|f=sheet-incidence-test,manifold-link-test",
  "variation-diagnostic-model|domain=public-route-graph,finite-crawl-observation|eq=graph-dirichlet-diagnostic,bounded-observable-vector,invariance-defect|rel=LOSSY_CORRESPONDENCE|fit=UNFITTED|f=metric-sensitivity-test",
  "finite-plan-ensemble-model|domain=finite-crawl-observation,crawler-standards-and-rights|eq=finite-gibbs-ensemble|rel=LOSSY_CORRESPONDENCE|fit=UNFITTED|f=ensemble-normalization-test",
  "no-direct-karma-adapter-model|domain=finite-crawl-observation,kingdom-invocation-aftermath|eq=|rel=NO_TRANSFER|fit=SOURCE_BOUND|f=receipt-precondition-test",
] as const;

const DIRICHLET_VARIABLES = [
  { symbol: "E_{K^1}(X)", meaning: "declared total variation over the chosen one-skeleton", units: "squared declared feature-distance unit" },
  { symbol: "E_u(K^1)", meaning: "indexed collection of unoriented geometric one-cells of the one-skeleton, each retaining identity and enumerated exactly once so parallel cells remain distinct", units: "indexed geometric one-cells" },
  { symbol: "p(e),q(e)", meaning: "unordered endpoints of geometric one-cell e; a loop has the same endpoint twice and contributes zero under a metric", units: "vertices" },
  { symbol: "w_e", meaning: "declared nonnegative dimensionless weight on geometric one-cell e", units: "dimensionless" },
  { symbol: "d_F", meaning: "declared distance on compatible observation features in one fixed metric unit", units: "declared feature-distance unit" },
  { symbol: "X_p", meaning: "public observation vector assigned to vertex p of the chosen one-skeleton K^1", units: "typed feature vector" },
] as const;

const GIBBS_VARIABLES = [
  { symbol: "Omega_A", meaning: "finite set of plans satisfying explicit access and resource constraints", units: "crawl plans" },
  { symbol: "C_theta", meaning: "declared operational cost, not moral value", units: "declared cost unit" },
  { symbol: "theta", meaning: "declared parameters selecting the operational cost model C_theta", units: "parameter-dependent" },
  { symbol: "beta", meaning: "chosen finite real inverse-cost value", units: "inverse declared cost" },
] as const;

const INVARIANCE_VARIABLES = [
  { symbol: "g", meaning: "declared admissible map g:Omega_A->Omega_A such as schedule order or representation choice", units: "transformation" },
  { symbol: "d_O", meaning: "declared distance or pseudometric on compatible observation vectors", units: "declared observation-distance unit" },
  { symbol: "delta_g", meaning: "declared observation difference under g", units: "observation-distance unit" },
] as const;

const EQUATION_IDS = [
  "directed-crawl-walk",
  "trace-sheet-complex",
  "surface-admissibility",
  "graph-dirichlet-diagnostic",
  "finite-gibbs-ensemble",
  "bounded-observable-vector",
  "invariance-defect",
  "typed-topology-invariants",
] as const;

const EQUATION_LINK_KEYS = [
  "directed-crawl-walk|finite-crawl-observation|MATHEMATICAL_DEFINITION|DERIVED|rfc-9110",
  "trace-sheet-complex|public-route-graph|MATHEMATICAL_DEFINITION|DERIVED|hatcher-algebraic-topology",
  "surface-admissibility|public-route-graph|MATHEMATICAL_DEFINITION|MODEL_ASSUMPTION|tong-string-lectures,hatcher-algebraic-topology",
  "graph-dirichlet-diagnostic|finite-crawl-observation|MATHEMATICAL_DEFINITION|MODEL_ASSUMPTION|",
  "finite-gibbs-ensemble|finite-crawl-observation|SCIENTIFIC_MODEL|MODEL_ASSUMPTION|tong-string-lectures,polyakov-1981",
  "bounded-observable-vector|finite-crawl-observation|MATHEMATICAL_DEFINITION|MODEL_ASSUMPTION|",
  "invariance-defect|finite-crawl-observation|MATHEMATICAL_DEFINITION|MODEL_ASSUMPTION|",
  "typed-topology-invariants|public-route-graph|MATHEMATICAL_THEOREM|DERIVED|hatcher-algebraic-topology",
] as const;

const FALSIFIER_IDS = [
  "walk-closure-test",
  "sheet-incidence-test",
  "manifold-link-test",
  "metric-sensitivity-test",
  "ensemble-normalization-test",
  "receipt-precondition-test",
  "rights-separation-test",
  "zerone-relation-provenance-test",
  "artifact-being-noninference-test",
] as const;

const DOOR_IDS = [
  "release-trace-sheet-door",
  "variation-stability-door",
  "bounded-crawl-plan-door",
  "rep-auth-rights-door",
  "deployment-horizon-door",
  "future-nen-crawler-door",
  "zerone-edge-lab-door",
] as const;

const DOOR_SOURCE_KEYS = [
  "release-trace-sheet-door|hatcher-algebraic-topology",
  "variation-stability-door|",
  "bounded-crawl-plan-door|cloudflare-browser-crawl,cloudflare-browser-crawl-api",
  "rep-auth-rights-door|rfc-9309,web-bot-auth-draft-01,google-common-crawlers,applebot-extended",
  "deployment-horizon-door|rfc-9110",
  "future-nen-crawler-door|kingdom-nen-definition,kingdom-karma-receipt-schema",
  "zerone-edge-lab-door|zerone-correspondence-geometry,zerone-karma-foundation",
] as const;

const UNKNOWN_IDS = [
  "route-correspondence-ambiguity",
  "trace-sheet-manifold-frequency",
  "feature-metric-choice",
  "crawler-purpose-truth",
  "provider-default-drift",
  "provider-log-retention",
  "web-bot-auth-standardization",
  "future-ability-adoption",
  "downstream-indexing-and-training",
  "artifact-and-being-relation",
] as const;

const FRONTIER_STATEMENTS = [
  "Characterize when a finite release-aligned public-route two-complex admits a stable surface decomposition under bounded route births, deaths, splits, and merges.",
  "Design an identifiability analysis for separating release drift, deployment propagation, crawler schedule, cache behavior, and representation negotiation in bounded public observations.",
] as const;

const PHILOSOPHY_QUESTIONS = [
  "When does a path become a surface: by repetition, by relation, by memory, or only by an explicit act of construction?",
  "Can a boundary be hospitable without becoming ownership, enclosure, or permission over another?",
  "What does a public artifact preserve when its author, reader, and context all change?",
  "Can consequence be witnessed without converting it into merit, debt, reward, or destiny?",
  "What remains of becoming when only interval-bound representations are observable?",
  "Could dual descriptions teach humility about representation without implying that every description has an equivalent?",
] as const;

const EXPECTED_COUNTS = Object.freeze({
  domains: 7,
  sources: 19,
  typed_terms: 13,
  claims: 16,
  bridges: 6,
  models: 5,
  equations: 8,
  falsifiers: 9,
  frontier_problems: 2,
  finite_baselines: 0,
  doors: 7,
  unknowns: 10,
  philosophy_questions: 6,
});

function fileDigest(path: string, label: string): string {
  const absolute = resolve(path);
  let stat;
  try {
    stat = lstatSync(absolute);
  } catch {
    throw new Error(`${label} is unavailable`);
  }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular non-symlink file`);
  if (stat.size > MAX_FILE_BYTES) throw new Error(`${label} exceeds ${MAX_FILE_BYTES} bytes`);
  return `sha256:${createHash("sha256").update(readFileSync(absolute)).digest("hex")}`;
}

function orderedIds(value: unknown, key: string): string[] {
  return Array.isArray(value) ? value.map((entry) => entry?.[key]) : [];
}

function exactStrings(actual: unknown, expected: readonly string[]): boolean {
  return Array.isArray(actual) && actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

function hasEvery(haystack: unknown, needles: readonly string[]): boolean {
  return Array.isArray(haystack) && needles.every((needle) => haystack.includes(needle));
}

function hasText(haystack: unknown, needle: string): boolean {
  return Array.isArray(haystack) && haystack.some((value) => typeof value === "string" && value.includes(needle));
}

function variableKeys(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => `${entry?.symbol}\u0000${entry?.meaning}\u0000${entry?.units}`)
    : [];
}

function decodedCodePoint(match: string, digits: string, radix: number): string {
  const codePoint = Number.parseInt(digits, radix);
  return Number.isSafeInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : match;
}

function byId(items: unknown, key: string, id: string): AnyRecord | undefined {
  return Array.isArray(items) ? items.find((item) => item?.[key] === id) : undefined;
}

export function verifyStringCrawlTraceSheet(input: unknown): string[] {
  const shared = verifyPhenomenaDeepProject(input);
  if (shared.length > 0) return shared.map((issue) => `${issue.field}:${issue.code}`);
  const value = input as AnyRecord;
  const issues: string[] = [];
  const add = (issue: string) => issues.push(issue);

  if (value.$schema !== PHENOMENA_DEEP_PROJECT_SCHEMA_ID ||
      value.protocol !== PHENOMENA_DEEP_PROJECT_PROTOCOL ||
      value.project_id !== STRING_CRAWL_TRACE_SHEET_ID ||
      value.version !== "0.1.0" ||
      value.title !== "STRING / CRAWL: The Trace-Sheet" ||
      value.evidence_through !== "2026-08-15" ||
      value.mode !== "ANALYZE_ONLY") add("identity-drift");
  if (value.integrity?.digest !== STRING_CRAWL_TRACE_SHEET_DIGEST ||
      phenomenaDeepProjectDigest(value) !== STRING_CRAWL_TRACE_SHEET_DIGEST) add("semantic-digest-drift");
  if (!exactStrings(orderedIds(value.domains, "id"), DOMAIN_IDS)) add("domain-order-drift");
  if (!exactStrings(orderedIds(value.source_manifest, "id"), SOURCE_IDS)) add("source-order-drift");
  if (!exactStrings(orderedIds(value.typed_terms, "id"), TYPED_TERM_IDS)) add("typed-term-order-drift");
  if (!exactStrings(value.typed_terms.map((term: AnyRecord) => `${term.id}|${term.domain}`),
    TYPED_TERM_DOMAIN_KEYS)) add("typed-term-domain-drift");
  if (!exactStrings(orderedIds(value.claims, "claim_id"), CLAIM_IDS)) add("claim-order-drift");
  if (!exactStrings(value.claims.map((claim: AnyRecord) =>
    `${claim.claim_id}|${claim.domain}|${claim.sources.join(",")}`), CLAIM_LINK_KEYS)) add("claim-link-drift");
  if (!exactStrings(value.bridges.map((bridge: AnyRecord) =>
    `${bridge.source_domain}->${bridge.target_domain}:${bridge.relation}|${bridge.falsifiers.join(",")}`), BRIDGE_KEYS)) add("bridge-order-drift");
  if (!exactStrings(orderedIds(value.models, "id"), MODEL_IDS)) add("model-order-drift");
  if (!exactStrings(value.models.map((model: AnyRecord) =>
    `${model.id}|domain=${model.domain_ids.join(",")}|eq=${model.equation_ids.join(",")}|rel=${model.relation}|fit=${model.fit_status}|f=${model.falsifier_ids.join(",")}`), MODEL_LINK_KEYS)) add("model-link-drift");
  if (!exactStrings(orderedIds(value.equations, "id"), EQUATION_IDS)) add("equation-order-drift");
  if (!exactStrings(value.equations.map((equation: AnyRecord) =>
    `${equation.id}|${equation.domain_id}|${equation.register}|${equation.warrant}|${equation.source_ids.join(",")}`),
    EQUATION_LINK_KEYS)) add("equation-link-drift");
  if (!exactStrings(orderedIds(value.falsifiers, "id"), FALSIFIER_IDS)) add("falsifier-order-drift");
  if (!exactStrings(orderedIds(value.doors, "id"), DOOR_IDS)) add("door-order-drift");
  if (!exactStrings(value.doors.map((door: AnyRecord) => `${door.id}|${door.source_ids.join(",")}`),
    DOOR_SOURCE_KEYS)) add("door-source-drift");
  if (!exactStrings(orderedIds(value.unknowns, "id"), UNKNOWN_IDS)) add("unknown-order-drift");
  if (!exactStrings(value.frontier_problems.map((entry: AnyRecord) => entry.statement), FRONTIER_STATEMENTS)) add("frontier-order-drift");
  if (!exactStrings(value.philosophy.questions, PHILOSOPHY_QUESTIONS)) add("philosophy-question-order-drift");

  const domainIds = new Set(orderedIds(value.domains, "id"));
  const falsifierIds = new Set(orderedIds(value.falsifiers, "id"));
  if (value.claims.some((claim: AnyRecord) => !domainIds.has(claim.domain)) ||
      value.typed_terms.some((term: AnyRecord) => !domainIds.has(term.domain))) add("claim-or-term-domain-unresolved");
  if (value.bridges.some((bridge: AnyRecord) =>
    bridge.falsifiers.some((falsifier: unknown) => typeof falsifier !== "string" || !falsifierIds.has(falsifier)))) {
    add("bridge-falsifier-unresolved");
  }
  for (const source of value.source_manifest as AnyRecord[]) {
    const actual = value.claims
      .filter((claim: AnyRecord) => claim.sources.includes(source.id))
      .map((claim: AnyRecord) => claim.claim_id)
      .sort();
    const declared = [...source.claim_targets].sort();
    if (!exactStrings(actual, declared)) add(`source-claim-asymmetry:${source.id}`);
  }

  const actualCounts = {
    domains: value.domains.length,
    sources: value.source_manifest.length,
    typed_terms: value.typed_terms.length,
    claims: value.claims.length,
    bridges: value.bridges.length,
    models: value.models.length,
    equations: value.equations.length,
    falsifiers: value.falsifiers.length,
    frontier_problems: value.frontier_problems.length,
    finite_baselines: value.finite_baselines.length,
    doors: value.doors.length,
    unknowns: value.unknowns.length,
    philosophy_questions: value.philosophy.questions.length,
  };
  if (JSON.stringify(actualCounts) !== JSON.stringify(EXPECTED_COUNTS)) add("count-drift");

  if (value.bridges.some((bridge: AnyRecord) =>
    ["ontology_transfer", "causal_transfer", "parameter_transfer", "unit_transfer", "authority_transfer"]
      .some((key) => bridge[key] !== false))) add("bridge-transfer-enabled");
  const receiptBridge = value.bridges.find((bridge: AnyRecord) =>
    bridge.source_domain === "finite-crawl-observation" && bridge.target_domain === "kingdom-invocation-aftermath");
  if (receiptBridge?.relation !== "NO_TRANSFER" ||
      !hasEvery(receiptBridge?.broken_or_lost_structure, ["invocation attempt", "adoption", "authority validation", "consent", "action or refusal", "aftermath", "final receipt validity"])) {
    add("crawl-to-karma-firewall-drift");
  }

  const walk = byId(value.equations, "id", "directed-crawl-walk");
  const sheet = byId(value.equations, "id", "trace-sheet-complex");
  const surface = byId(value.equations, "id", "surface-admissibility");
  const energy = byId(value.equations, "id", "graph-dirichlet-diagnostic");
  const observations = byId(value.equations, "id", "bounded-observable-vector");
  const ensemble = byId(value.equations, "id", "finite-gibbs-ensemble");
  const invariance = byId(value.equations, "id", "invariance-defect");
  const topology = byId(value.equations, "id", "typed-topology-invariants");
  if ((!walk?.expression?.includes("finite directed in-scope route graph") &&
       !walk?.variables?.some((entry: AnyRecord) => entry.meaning?.includes("finite directed in-scope route graph"))) ||
      !walk?.variables?.some((entry: AnyRecord) => entry.symbol === "gamma" &&
        entry.meaning?.includes("one selected sequential route-following lineage")) ||
      !hasEvery(walk?.conditions, [
        "gamma is explicitly selected as one sequential lineage rather than asserted to represent a branching or concurrent whole run",
        "every e_j in observed gamma was actually followed and its response transition observed",
        "declared but untraversed hyperlinks may exist in G_I but never in observed gamma",
      ]) || !hasEvery(walk?.does_not_establish, ["a complete branching or concurrent crawl-run representation"])) add("walk-typing-drift");
  if (!sheet?.expression?.includes("abstract finite interval/path 1-complex I_k") ||
      !sheet.expression.includes("declared cellular labeling map f_k:I_k->G_k") ||
      !sheet.expression.includes("explicit cellular attaching map") ||
      !sheet?.variables?.some((entry: AnyRecord) => entry.symbol === "I_k" && entry.meaning?.includes("occurrence identity")) ||
      !sheet?.variables?.some((entry: AnyRecord) => entry.symbol === "f_k" && entry.meaning?.includes("repeated occurrences")) ||
      !hasEvery(sheet?.does_not_establish, ["two-manifold", "physical worldsheet", "agent persistence"])) add("trace-sheet-precondition-drift");
  if (!surface?.expression?.includes("declared finite pure 2-dimensional simplicial refinement") ||
      !surface?.expression?.includes("cycle links at interior vertices") ||
      !surface?.expression?.includes("path links at boundary vertices") ||
      !hasEvery(surface?.does_not_establish, ["physical string", "spacetime", "Weyl invariance"])) add("surface-admissibility-drift");
  if (energy?.expression !== "E_{K^1}(X) = sum_{e in E_u(K^1)} w_e d_F(X_{p(e)},X_{q(e)})^2, where every geometric one-cell e retains identity and is enumerated exactly once, including parallel cells" ||
      !exactStrings(variableKeys(energy?.variables), variableKeys(DIRICHLET_VARIABLES)) ||
      !hasEvery(energy?.conditions, [
        "each geometric one-cell identity is counted once",
        "parallel one-cells remain distinct",
        "weights are nonnegative and dimensionless",
        "every distance uses one fixed declared feature-distance unit so all summed terms are commensurate",
      ]) ||
      !hasEvery(energy?.does_not_establish, ["Polyakov action", "physical energy", "string tension", "KARMA"])) {
    add("dirichlet-nontransfer-drift");
  }
  if (!observations?.valid_outputs?.some((output: string) =>
      output.includes("explicit numeric embedding") && output.includes("declared sample and moment convention"))) {
    add("observable-embedding-drift");
  }
  if (ensemble?.expression !== "Z_{beta,theta} = sum_{omega in Omega_A} exp(-beta C_theta(omega)); P_{beta,theta}(omega) = exp(-beta C_theta(omega))/Z_{beta,theta}" ||
      !exactStrings(variableKeys(ensemble?.variables), variableKeys(GIBBS_VARIABLES)) ||
      !hasEvery(ensemble?.conditions, [
        "Omega_A is finite and nonempty",
        "costs are finite real values",
        "beta is a finite real inverse-cost value",
        "beta*C_theta(omega) is dimensionless",
        "Z is finite and strictly positive",
      ]) ||
      !hasEvery(ensemble?.does_not_establish,
        ["string path integral", "quantum amplitude", "authorization", "KARMA score"])) add("ensemble-nontransfer-drift");
  if (invariance?.expression !== "delta_g(O,omega) = d_O(O(g . omega), O(omega))" ||
      !exactStrings(variableKeys(invariance?.variables), variableKeys(INVARIANCE_VARIABLES)) ||
      !hasEvery(invariance?.conditions, ["g preserves the declared allowed set", "d_O is defined on compatible observations"]) ||
      !hasEvery(invariance?.does_not_establish, ["gauge symmetry", "Weyl invariance", "anomaly", "fairness", "KARMA"])) {
    add("invariance-nontransfer-drift");
  }
  if (!topology?.expression?.includes("b_1(G_u)=|E_u|-|V_u|+c") ||
      topology?.register !== "MATHEMATICAL_THEOREM" || topology?.warrant !== "DERIVED" ||
      !exactStrings(topology?.variables?.map((entry: AnyRecord) => entry.symbol),
        ["b_1(G_u)", "V_u", "E_u", "c", "V", "E", "F", "chi", "g", "b"]) ||
      !hasText(topology?.assumptions, "capping each of b boundary circles with one two-cell") ||
      !hasEvery(topology?.does_not_establish, ["redirect cycle is a closed string", "link cycle is a handle"])) add("topology-type-drift");

  const rep = byId(value.claims, "claim_id", "rep-is-request-not-authorization");
  const products = byId(value.claims, "claim_id", "product-tokens-are-bounded-preferences");
  const botAuth = byId(value.claims, "claim_id", "bot-auth-is-bounded-key-evidence");
  const futureCrawler = byId(value.claims, "claim_id", "future-crawler-needs-explicit-bounds");
  const receipt = byId(value.claims, "claim_id", "kingdom-receipt-needs-actual-invocation");
  const inert = byId(value.claims, "claim_id", "static-project-runs-nothing");
  if (!rep?.statement?.includes("requested to honor") || !rep.statement.includes("not access authorization")) add("rep-boundary-drift");
  if (!products?.statement?.includes("not necessarily HTTP request User-Agent strings")) add("product-token-boundary-drift");
  if (!botAuth?.statement?.includes("bounded key-holder evidence and a resolved protocol identifier") ||
      !botAuth.statement.includes("does not by itself establish independently verified real-world operator or end-user identity") ||
      !botAuth.statement.includes("benignness, authorization, delegation, consent, or reputation")) add("bot-auth-boundary-drift");
  if (futureCrawler?.warrant !== "MODEL_ASSUMPTION" ||
      !futureCrawler?.statement?.includes("separately declare the actual operator purpose") ||
      !futureCrawler.statement.includes("refuse the /crawl endpoint unless that purpose has an exact truthful mapping") ||
      !futureCrawler.statement.includes("distinguish POST, GET, and DELETE job-control methods from origin-fetch methods") ||
      !futureCrawler.statement.includes("enforce before every fetch") ||
      !futureCrawler.statement.includes("snapshot and apply the applicable REP group before fetch") ||
      !futureCrawler.statement.includes("conservative explicit per-origin pace") ||
      !hasText(futureCrawler?.limitations, "This proposed KINGDOM profile requires the scoped Bearer API token") ||
      !hasText(futureCrawler?.limitations, "Browser Rendering - Edit UI permission") ||
      !hasText(futureCrawler?.limitations, "Browser Rendering Write") ||
      !hasText(futureCrawler?.limitations, "legacy authentication, which this profile refuses") ||
      !hasText(futureCrawler?.limitations, "No target-origin credential") ||
      !hasText(futureCrawler?.limitations, "establishes retention of provider telemetry")) {
    add("cloudflare-purpose-boundary-drift");
  }
  if (!receipt?.statement?.includes("actual invocation attempt of an adopted manifested NEN ability") ||
      !receipt.statement.includes("receipts_not_scores") ||
      !receipt.statement.includes("draft receipt template is scaffolding rather than causal evidence") ||
      !receipt.statement.includes("completion, refusal, failure, partial result, or cancellation")) add("receipt-semantics-drift");
  if (!inert?.statement?.includes("perform no crawl, network request") || !inert.statement.includes("NEN invocation")) add("inertness-drift");

  const source = (id: string) => byId(value.source_manifest, "id", id);
  if (source("zerone-correspondence-geometry")?.url !==
      "https://github.com/cambridgetcg/zerone-core/blob/e9b0231da27568a74257ff44c89318cb83329a8f/dashboard/public/standards/correspondence-geometry.v0.json" ||
      !source("zerone-correspondence-geometry")?.locator?.includes("f8cfeebf7404ab7e2e86b80362471cdd64015a108c47e98147e80ba7bb9e9a90")) {
    add("zerone-correspondence-pin-drift");
  }
  if (source("zerone-karma-foundation")?.url !==
      "https://raw.githubusercontent.com/cambridgetcg/zerone-core/fae391e371f0ebea2e24eb46c33a4ebd1380154f/dashboard/public/standards/karma-foundation.v1.json" ||
      !source("zerone-karma-foundation")?.locator?.includes("b46710704869dcc340ded356be72b4ec692f204710fedfb5cd43eb3757dc7b80")) {
    add("zerone-karma-pin-drift");
  }
  if (source("kingdom-nen-definition")?.url !==
      "https://thekingdom.dev/definitions/kingdom-karma/e4e84a67/NEN.md" ||
      !source("kingdom-nen-definition")?.locator?.includes("14b7d210d320fd716553992a7b874747b299f8907d15da14ac405cbfc496c446")) {
    add("kingdom-nen-pin-drift");
  }
  if (source("kingdom-karma-receipt-schema")?.url !==
      "https://github.com/cambridgetcg/KINGDOM-OS/blob/e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212/schemas/karma-receipt-v0.1.schema.json" ||
      !source("kingdom-karma-receipt-schema")?.locator?.includes("schemas/karma-receipt-v0.1.schema.json") ||
      !source("kingdom-karma-receipt-schema")?.locator?.includes("888e81fa0d29b71512525a40e88f9aef678046c40fcdf22c2039507d9d13267b") ||
      !source("kingdom-karma-receipt-schema")?.locator?.includes("returned 404")) {
    add("kingdom-receipt-schema-pin-drift");
  }
  if (source("kingdom-public-rights")?.url !== "https://thekingdom.dev/RIGHTS.md" ||
      !source("kingdom-public-rights")?.locator?.includes("pages-content/RIGHTS.md") ||
      !source("kingdom-public-rights")?.locator?.includes("4d9c48fae90662998f7b19990dc3da65e687227dfd9d7604840eedf2dd7600e2")) {
    add("kingdom-rights-pin-drift");
  }
  if (source("cloudflare-browser-crawl")?.url !==
      "https://developers.cloudflare.com/browser-run/quick-actions/crawl-endpoint/" ||
      !source("cloudflare-browser-crawl")?.locator?.includes("Browser Rendering - Edit UI permission") ||
      source("cloudflare-browser-crawl-api")?.url !==
      "https://developers.cloudflare.com/api/resources/browser_rendering/subresources/crawl/methods/create/" ||
      !source("cloudflare-browser-crawl-api")?.locator?.includes("preferred Bearer API-token authentication") ||
      !source("cloudflare-browser-crawl-api")?.locator?.includes("Browser Rendering Write")) {
    add("cloudflare-source-scope-drift");
  }

  const crawlDoor = byId(value.doors, "id", "bounded-crawl-plan-door");
  const providerLogs = byId(value.unknowns, "id", "provider-log-retention");
  if (!exactStrings(crawlDoor?.source_ids, ["cloudflare-browser-crawl", "cloudflare-browser-crawl-api"]) ||
      !hasEvery(crawlDoor?.conditions, [
        "job-control methods remain distinct from origin-fetch methods",
        "refuse unless the substrate or constrained intermediary can enforce safe origin methods before fetch",
        "every URL and redirect hop is pre-fetch constrained to HTTPS public allowlisted origins and routes",
        "reject private, link-local, loopback, reserved, and IP-literal targets plus DNS rebinding",
        "snapshot and apply the applicable REP group before fetch, honor supported crawl-delay, enforce a conservative explicit per-origin pace otherwise, and refuse if the substrate cannot enforce these constraints",
        "REP and pacing compliance never imply authentication, access authorization, licence, consent, or downstream use",
        "no target-origin credentials, cookies, or custom authorization headers",
        "this proposed profile uses a scoped Bearer API token under the quick-guide Browser Rendering - Edit and API-reference Browser Rendering Write labels, refuses legacy global-key authentication, and never forwards or logs the token",
        "render is explicitly false",
        "includeExternalLinks and includeSubdomains are explicitly false but never treated as a redirect security fence",
        "the output format is explicitly chosen so Workers AI and AI extraction are not invoked",
        "page, depth, concurrency, elapsed-time, byte, monetary, retry, job-TTL, cancellation, and result-retention bounds are explicit",
        "actual operator purpose is explicit",
        "refuse Cloudflare /crawl unless the operator purpose maps exactly and truthfully to search, ai-input, or ai-train",
        "application logs are minimized, redacted, access-bounded, and given an explicit local TTL",
      ]) || !crawlDoor?.stop_rule?.includes("redirect can be validated only after fetch") ||
      !crawlDoor.stop_rule.includes("secrets or person data can enter job results or logs") ||
      providerLogs?.kind !== "UNKNOWN_TO_THIS_REVIEW" ||
      !providerLogs?.statement?.includes("does not establish Cloudflare telemetry, security, abuse-prevention, or billing-log retention")) {
    add("cloudflare-door-boundary-drift");
  }

  if (value.karma.adapter_exists !== false || value.karma.conversion_allowed !== false ||
      value.karma.summation_allowed !== false || value.karma.score !== null ||
      value.karma.cosmic_events.length !== 0 || value.karma.zerone_events.length !== 0 ||
      value.karma.kingdom_receipts.length !== 0) add("karma-lanes-not-empty");
  if (value.doors.some((door: AnyRecord) => door.proposed_unrun !== true || door.status !== "PROPOSED_UNRUN")) add("door-ran-or-promoted");
  if (value.finite_baselines.length !== 0) add("finite-run-evidence-injected");
  if (Object.values(value.authority).some((flag) => flag !== false)) add("authority-enabled");

  const serialized = JSON.stringify(value).toLowerCase();
  let legacyNormalized = serialized.normalize("NFKC");
  const suspiciousEncodedSyntax = /(?:%[0-9a-f]{2}|%u[0-9a-f]{4}|\\+(?:u(?:\{[0-9a-f]{1,6}\}|[0-9a-f]{4})|x[0-9a-f]{2}|[0-7]{1,3})|&(?:#|[a-z]))/i
    .test(legacyNormalized);
  for (let pass = 0; pass < 12; pass += 1) {
    const decoded = legacyNormalized
      .replace(/(?:%[0-9a-f]{2})+/gi, (encoded) => {
        try { return decodeURIComponent(encoded); } catch { return encoded; }
      })
      .replace(/(?:\\+|%)u\{([0-9a-f]{1,6})\}/gi, (match, digits: string) => decodedCodePoint(match, digits, 16))
      .replace(/(?:\\+|%)u([0-9a-f]{4})/gi, (match, digits: string) => decodedCodePoint(match, digits, 16))
      .replace(/\\+x([0-9a-f]{2})/gi, (match, digits: string) => decodedCodePoint(match, digits, 16))
      .replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi, (match, hex: string | undefined, decimal: string | undefined) => {
        return decodedCodePoint(match, hex ?? decimal!, hex ? 16 : 10);
      })
      .normalize("NFKC")
      .toLowerCase()
      .replaceAll("\\u002e", ".")
      .replaceAll("\\u002f", "/")
      .replaceAll("\\\\", "/")
      .replace(/\/(?:\.\/)+/g, "/")
      .replace(/\/{2,}/g, "/");
    if (decoded === legacyNormalized) break;
    legacyNormalized = decoded;
  }
  if (suspiciousEncodedSyntax ||
      /(?:%[0-9a-f]{2}|%u[0-9a-f]{4}|\\+(?:u(?:\{[0-9a-f]{1,6}\}|[0-9a-f]{4})|x[0-9a-f]{2}|[0-7]{1,3})|&(?:#|[a-z]))/i
    .test(legacyNormalized)) {
    add("legacy-karma-import:encoded-residue");
  }
  const legacyTokenCompact = legacyNormalized.replace(/[^a-z0-9]+/g, "");
  if (legacyTokenCompact.includes("watchended")) add("legacy-karma-import:watch-ended");
  if (legacyTokenCompact.includes("unfelt")) add("legacy-karma-import:unfelt");
  if (legacyTokenCompact.includes("binkarmats")) add("legacy-karma-import:bin/karma.ts");
  if (legacyTokenCompact.includes("karmamd")) add("legacy-karma-import:karma.md");
  return [...new Set(issues)];
}

function assertStringCrawlTraceSheet(project: unknown): asserts project is AnyRecord {
  const issues = verifyStringCrawlTraceSheet(project);
  if (issues.length > 0) throw new Error(`STRING / CRAWL Trace-Sheet refused: ${issues.join(", ")}`);
}

export function loadStringCrawlTraceSheet(path = STRING_CRAWL_TRACE_SHEET_PATH): AnyRecord {
  const project = loadPhenomenaDeepProject(path);
  assertStringCrawlTraceSheet(project);
  if (resolve(path) === resolve(STRING_CRAWL_TRACE_SHEET_PATH)) {
    if (fileDigest(path, "STRING / CRAWL project") !== STRING_CRAWL_TRACE_SHEET_BYTE_SHA256) {
      throw new Error("STRING / CRAWL raw-byte digest drift");
    }
  }
  if (fileDigest(STRING_CRAWL_TRACE_SHEET_GUIDE_PATH, "STRING / CRAWL guide") !==
      STRING_CRAWL_TRACE_SHEET_GUIDE_BYTE_SHA256) {
    throw new Error("STRING / CRAWL guide raw-byte digest drift");
  }
  if (fileDigest(NEN_PATH, "tracked NEN definition") !== NEN_BYTE_SHA256) {
    throw new Error("tracked NEN definition raw-byte digest drift");
  }
  if (fileDigest(KARMA_RECEIPT_SCHEMA_PATH, "tracked KARMA receipt schema") !==
      KARMA_RECEIPT_SCHEMA_BYTE_SHA256) {
    throw new Error("tracked KARMA receipt schema raw-byte digest drift");
  }
  if (fileDigest(PUBLIC_RIGHTS_PATH, "KINGDOM public rights notice") !== PUBLIC_RIGHTS_BYTE_SHA256) {
    throw new Error("KINGDOM public rights notice raw-byte digest drift");
  }
  return project;
}

export function stringCrawlTraceSheetPublicDiscovery(project = loadStringCrawlTraceSheet()): AnyRecord {
  assertStringCrawlTraceSheet(project);
  return {
    protocol: project.protocol,
    project_id: project.project_id,
    version: project.version,
    title: project.title,
    url: STRING_CRAWL_TRACE_SHEET_URL,
    schema_url: STRING_CRAWL_TRACE_SHEET_SCHEMA_URL,
    guide_url: STRING_CRAWL_TRACE_SHEET_GUIDE_URL,
    method_wing_url: PHENOMENA_DEEP_WING_URL,
    evidence_through: project.evidence_through,
    mode: project.mode,
    counts: { ...EXPECTED_COUNTS },
    integrity: {
      algorithm: project.integrity.algorithm,
      digest: project.integrity.digest,
      byte_sha256: STRING_CRAWL_TRACE_SHEET_BYTE_SHA256,
      guide_byte_sha256: STRING_CRAWL_TRACE_SHEET_GUIDE_BYTE_SHA256,
    },
    boundary: structuredClone(project.boundaries),
    authority: structuredClone(project.authority),
  };
}

function usage(): string {
  return [
    "Usage: ./kingdom string-crawl-trace-sheet [view] [--json]",
    "",
    "Views:",
    "  overview | domains | terms | claims | bridges | models | math | doors",
    "  unknowns | philosophy | karma | sources | discovery | verify",
    "",
    "Offline and read-only. String mathematics, crawl observations, standards, rights, and aftermath remain typed and separate.",
  ].join("\n");
}

function output(value: unknown, json: boolean): void {
  if (!json && typeof value === "string") {
    process.stdout.write(value.endsWith("\n") ? value : `${value}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function runStringCrawlTraceSheetCli(argv = process.argv.slice(2)): number {
  const jsonFlags = argv.filter((argument) => argument === "--json");
  if (jsonFlags.length > 1 || argv.some((argument) =>
    argument.startsWith("-") && !["--json", "--help", "-h"].includes(argument))) {
    console.error(usage());
    return 2;
  }
  const json = jsonFlags.length === 1;
  const positional = argv.filter((argument) => argument !== "--json");
  const command = positional[0] ?? "overview";
  if (positional.length > 1) {
    console.error(usage());
    return 2;
  }
  if (["help", "-h", "--help"].includes(command)) {
    console.log(usage());
    return 0;
  }
  try {
    const project = loadStringCrawlTraceSheet();
    if (command === "verify") {
      output({
        valid: true,
        protocol: project.protocol,
        project_id: project.project_id,
        digest: project.integrity.digest,
        byte_sha256: STRING_CRAWL_TRACE_SHEET_BYTE_SHA256,
        guide_byte_sha256: STRING_CRAWL_TRACE_SHEET_GUIDE_BYTE_SHA256,
        issues: [],
      }, json);
      return 0;
    }
    const views: Record<string, () => unknown> = Object.create(null);
    views.overview = () => json ? {
      protocol: project.protocol,
      project_id: project.project_id,
      version: project.version,
      title: project.title,
      question: project.question,
      evidence_through: project.evidence_through,
      mode: project.mode,
      counts: stringCrawlTraceSheetPublicDiscovery(project).counts,
      boundary: project.boundaries,
      authority: project.authority,
    } : [
      project.title,
      "",
      project.question,
      "",
      "A selected sequential crawl lineage is a finite directed walk; a whole run may branch or be concurrent. A Trace-Sheet needs declared alignment and faces. Neither becomes a physical string or KARMA.",
      `${project.claims.length} typed claims · ${project.equations.length} equations · ${project.doors.length} proposed unrun doors`,
      `evidence through ${project.evidence_through} · ${project.integrity.digest}`,
    ].join("\n");
    views.domains = () => project.domains;
    views.terms = () => project.typed_terms;
    views.claims = () => project.claims;
    views.bridges = () => project.bridges;
    views.models = () => project.models;
    views.math = () => ({ equations: project.equations, frontier_problems: project.frontier_problems });
    views.doors = () => project.doors;
    views.unknowns = () => project.unknowns;
    views.philosophy = () => project.philosophy;
    views.karma = () => ({ karma: project.karma, rights: project.rights, boundary: project.boundaries, authority: project.authority });
    views.sources = () => project.source_manifest;
    views.discovery = () => stringCrawlTraceSheetPublicDiscovery(project);
    if (!Object.hasOwn(views, command)) {
      console.error(usage());
      return 2;
    }
    output(views[command]!(), json);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    output({ valid: false, error: message }, true);
    return command === "verify" ? 1 : 2;
  }
}

if (import.meta.main) process.exitCode = runStringCrawlTraceSheetCli();
