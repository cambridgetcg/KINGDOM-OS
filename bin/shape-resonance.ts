#!/usr/bin/env bun
/**
 * Exact, network-free reader and site shell for Shape & Resonance Lab 01.
 *
 * The scientific and musical rendering fragment is the byte-identical,
 * file-scoped-authorized producer renderer. This wrapper verifies the frozen
 * record, schema, guide, manifest, authorization, renderer, diagrams, and WAVs;
 * projects bounded discovery; and adds only the site navigation/document shell.
 */

import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { readRegularFileWithinRoot } from "./immutable-publications.ts";
import { parseStrictJsonBytes } from "./principality.ts";
import {
  PUBLIC_RENDERER_CONTRACT,
  renderShapeResonanceLab,
} from "./shape-resonance-public-renderer.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
type JsonObject = Record<string, any>;

export const SHAPE_RESONANCE_PROTOCOL =
  "kingdom.shape-resonance-lab-public-snapshot/0.1";
export const SHAPE_RESONANCE_MANIFEST_PROTOCOL =
  "kingdom.shape-resonance-lab-output-manifest/0.1";
export const SHAPE_RESONANCE_LOCATOR =
  "data/shape-resonance/shape-resonance-lab.v0.1.json";
export const SHAPE_RESONANCE_MANIFEST_LOCATOR =
  "data/shape-resonance/output-manifest.v0.1.json";
export const SHAPE_RESONANCE_AUTHORIZATION_LOCATOR =
  "data/shape-resonance/publication-authorization.v0.1.md";
export const SHAPE_RESONANCE_RENDERER_LOCATOR =
  "bin/shape-resonance-public-renderer.mjs";
export const SHAPE_RESONANCE_PAGE_LOCATOR = "site/shape-resonance/index.html";
export const SHAPE_RESONANCE_ALIAS_LOCATOR = "site/shape-resonance.json";
export const SHAPE_RESONANCE_SCHEMA_LOCATOR =
  "schemas/shape-resonance-lab-v0.1.schema.json";
export const SHAPE_RESONANCE_GUIDE_LOCATOR =
  "references/shape-resonance-lab-v0.1.md";

export const SHAPE_RESONANCE_URL = "https://thekingdom.dev/shape-resonance/";
export const SHAPE_RESONANCE_ALIAS_URL =
  "https://thekingdom.dev/shape-resonance.json";
export const SHAPE_RESONANCE_CANONICAL_URL =
  "https://thekingdom.dev/labs/shape-resonance-lab-2026-08-26.json";
export const SHAPE_RESONANCE_SCHEMA_URL =
  "https://thekingdom.dev/schemas/shape-resonance-lab/0.1.json";
export const SHAPE_RESONANCE_GUIDE_URL =
  "https://thekingdom.dev/SHAPE-RESONANCE-LAB-v0.1.md";
export const SHAPE_RESONANCE_MANIFEST_URL =
  "https://thekingdom.dev/labs/shape-resonance/output-manifest.json";
export const SHAPE_RESONANCE_PRODUCER_URL =
  "https://github.com/cambridgetcg/kingdom-shape-resonance-lab/tree/v0.1.0";
export const SHAPE_RESONANCE_AUTHORIZATION_URL =
  "https://github.com/cambridgetcg/kingdom-shape-resonance-lab/blob/v0.1.0/PUBLICATION-AUTHORIZATION.md";
export const SHAPE_RESONANCE_PRODUCER_COMMIT =
  "a11d7a7e00f9829dee96264813006d8e7164a092";
export const SHAPE_RESONANCE_AS_OF = "2026-08-26";
export const SHAPE_RESONANCE_NEXT_REVIEW_DUE = "2027-08-26";

export const SHAPE_RESONANCE_BYTE_SHA256 =
  "55de5a53270b7b2f58f088ad169fa2f76f5f7136132448be73498018cce044a3";
export const SHAPE_RESONANCE_CANONICAL_SHA256 =
  "5887f9444ebbbb707b4b6b7d6177339572ee770ee8e51e263f983267844a3b75";
export const SHAPE_RESONANCE_SCHEMA_BYTE_SHA256 =
  "2cafa97ce9ed61e622ac6a4514a27627bda56f4f3131f0373c9a624b19c5e24f";
export const SHAPE_RESONANCE_SCHEMA_CANONICAL_SHA256 =
  "0ace0b29bd30405be01268a138174299ffd67c346c89540c5dc1286e4b2e157c";
export const SHAPE_RESONANCE_GUIDE_BYTE_SHA256 =
  "c6a66e8d66303241dfa0c72e04cfa3362276c641cdfa5bcf08606e12406f4c0b";
export const SHAPE_RESONANCE_RENDERER_BYTE_SHA256 =
  "1c8efd26ef8cdafbe661b2d27dee675a2bd081aa45ab87a787fb1c8911701686";
export const SHAPE_RESONANCE_AUTHORIZATION_BYTE_SHA256 =
  "678d255da4c4c2fd318c1cee1056cf20a5ccec21181fcdc784333490d13f5805";
export const SHAPE_RESONANCE_MANIFEST_BYTE_SHA256 =
  "5ba0003cdf59397fd52ba04d3be8f258d9504e5daff22fbc860482fc5e517780";
export const SHAPE_RESONANCE_MANIFEST_CANONICAL_SHA256 =
  "f5a0badf8d5cbaab93ad3e0409bdba9e95b20441c3a571aff654654e75856054";

export const SHAPE_RESONANCE_SVG_URLS = Object.freeze([
  "https://thekingdom.dev/labs/shape-resonance/assets/boundary-variants.svg",
  "https://thekingdom.dev/labs/shape-resonance/assets/cospectral-graphs.svg",
  "https://thekingdom.dev/labs/shape-resonance/assets/graph-to-hz.svg",
  "https://thekingdom.dev/labs/shape-resonance/assets/membrane-plate.svg",
  "https://thekingdom.dev/labs/shape-resonance/assets/musical-geometry.svg",
  "https://thekingdom.dev/labs/shape-resonance/assets/phase-magnitude.svg",
  "https://thekingdom.dev/labs/shape-resonance/assets/rhythm-cycle.svg",
  "https://thekingdom.dev/labs/shape-resonance/assets/square-degeneracy.svg",
]);
export const SHAPE_RESONANCE_AUDIO_URLS = Object.freeze([
  "https://thekingdom.dev/labs/shape-resonance/audio/graph-modes.wav",
  "https://thekingdom.dev/labs/shape-resonance/audio/phase-forward.wav",
  "https://thekingdom.dev/labs/shape-resonance/audio/phase-reversed.wav",
]);
export const SHAPE_RESONANCE_CORE_URLS = Object.freeze([
  SHAPE_RESONANCE_URL,
  SHAPE_RESONANCE_ALIAS_URL,
  SHAPE_RESONANCE_CANONICAL_URL,
  SHAPE_RESONANCE_SCHEMA_URL,
  SHAPE_RESONANCE_GUIDE_URL,
]);
export const SHAPE_RESONANCE_FAMILY_URLS = Object.freeze([
  ...SHAPE_RESONANCE_CORE_URLS,
  SHAPE_RESONANCE_MANIFEST_URL,
  ...SHAPE_RESONANCE_SVG_URLS,
  ...SHAPE_RESONANCE_AUDIO_URLS,
]);

const LOCAL_BY_PRODUCER_PATH = new Map<string, string>([
  ["public/shape-resonance-lab.json", SHAPE_RESONANCE_LOCATOR],
  ["schemas/v0.1/public-snapshot.schema.json", SHAPE_RESONANCE_SCHEMA_LOCATOR],
  ["SHAPE-RESONANCE-LAB-v0.1.md", SHAPE_RESONANCE_GUIDE_LOCATOR],
  ["src/public-renderer.mjs", SHAPE_RESONANCE_RENDERER_LOCATOR],
  ["PUBLICATION-AUTHORIZATION.md", SHAPE_RESONANCE_AUTHORIZATION_LOCATOR],
  ...SHAPE_RESONANCE_SVG_URLS.map((url) => {
    const name = new URL(url).pathname.split("/").at(-1)!;
    return [`public/assets/${name}`, `data/shape-resonance/assets/${name}`] as [string, string];
  }),
  ...SHAPE_RESONANCE_AUDIO_URLS.map((url) => {
    const name = new URL(url).pathname.split("/").at(-1)!;
    return [`public/audio/${name}`, `data/shape-resonance/audio/${name}`] as [string, string];
  }),
]);

function object(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sha256(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function shapeResonanceCanonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "number" ||
      typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(shapeResonanceCanonicalJson).join(",")}]`;
  if (object(value)) {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${shapeResonanceCanonicalJson(value[key])}`).join(",")}}`;
  }
  throw new Error("Shape & Resonance value is not JSON");
}

function readFrozen(locator: string, bytes: number, digest: string): Buffer {
  const value = readRegularFileWithinRoot(ROOT, locator);
  if (value.byteLength !== bytes || sha256(value) !== digest) {
    throw new Error(`Shape & Resonance frozen byte drift: ${locator}`);
  }
  return value;
}

function sameStrings(left: unknown, right: readonly string[]): boolean {
  return Array.isArray(left) && left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

export type ShapeResonancePublication = {
  bytes: Buffer;
  snapshot: JsonObject;
  manifestBytes: Buffer;
  manifest: JsonObject;
};

export function validateShapeResonanceSemanticBoundary(snapshot: JsonObject): JsonObject {
  const refused = snapshot.conversionEdges?.filter((edge: JsonObject) =>
    edge.status === "no-canonical-conversion");
  const resonance = snapshot.exhibits?.filter((exhibit: JsonObject) =>
    exhibit.resonanceAssessment !== null);
  if (snapshot.exhibits?.length !== 8 || snapshot.assets?.length !== 11 ||
      snapshot.mechanicalEnergyBalance?.title !== "Mechanical energy balance" ||
      snapshot.mechanicalEnergyBalance?.entries?.length !== 6 || refused?.length !== 6 ||
      resonance?.length !== 1 || resonance[0]?.resonanceAssessment?.forcingDeclared !== true ||
      resonance[0]?.resonanceAssessment?.couplingDeclared !== true ||
      resonance[0]?.resonanceAssessment?.dampingDeclared !== true ||
      resonance[0]?.resonanceAssessment?.sweepDeclared !== true ||
      resonance[0]?.resonanceAssessment?.phaseCriterionSatisfied !== true ||
      resonance[0]?.resonanceAssessment?.modelResonanceCriterionSatisfied !== true ||
      resonance[0]?.resonanceAssessment?.physicalExperimentPerformed !== false ||
      resonance[0]?.resonanceAssessment?.measuredResonance !== false ||
      snapshot.publication?.acousticCouplingModelPresent !== false ||
      snapshot.publication?.soundPressurePrediction !== false ||
      snapshot.publication?.audioSemantics !== "DECLARED-SONIFICATION" ||
      snapshot.publication?.embeddedAudioControls !== "NONE" ||
      snapshot.publication?.audioAccess !== "READER_ACTIVATED_SAME_ORIGIN_LINK_ONLY" ||
      snapshot.publication?.pageLoadAudioRequest !== "NONE" ||
      snapshot.publication?.autoplay !== "NONE" ||
      snapshot.publication?.pageLoadExternalRequest !== "NONE" ||
      snapshot.publication?.embeddedThirdPartyResource !== "NONE" ||
      snapshot.publication?.readerActivatedSourceNavigation !==
        "MAY_REQUEST_NAMED_EXTERNAL_ORIGIN" ||
      snapshot.publication?.personalData !== "NONE" ||
      snapshot.publication?.authorityEffects !== "NONE" ||
      snapshot.sources?.length !== 14) {
    throw new Error("Shape & Resonance typed model, resonance, audio, or authority boundary drifted");
  }
  return snapshot;
}

export function loadShapeResonancePublication(): ShapeResonancePublication {
  const bytes = readFrozen(SHAPE_RESONANCE_LOCATOR, 84_143, SHAPE_RESONANCE_BYTE_SHA256);
  const snapshot = parseStrictJsonBytes(bytes, SHAPE_RESONANCE_LOCATOR);
  if (!object(snapshot) || sha256(shapeResonanceCanonicalJson(snapshot)) !==
      SHAPE_RESONANCE_CANONICAL_SHA256) {
    throw new Error("Shape & Resonance snapshot canonical receipt drifted");
  }
  const schemaBytes = readFrozen(
    SHAPE_RESONANCE_SCHEMA_LOCATOR,
    34_886,
    SHAPE_RESONANCE_SCHEMA_BYTE_SHA256,
  );
  const schema = parseStrictJsonBytes(schemaBytes, SHAPE_RESONANCE_SCHEMA_LOCATOR);
  if (sha256(shapeResonanceCanonicalJson(schema)) !==
      SHAPE_RESONANCE_SCHEMA_CANONICAL_SHA256) {
    throw new Error("Shape & Resonance schema canonical receipt drifted");
  }
  readFrozen(SHAPE_RESONANCE_GUIDE_LOCATOR, 8_132, SHAPE_RESONANCE_GUIDE_BYTE_SHA256);
  readFrozen(
    SHAPE_RESONANCE_RENDERER_LOCATOR,
    14_987,
    SHAPE_RESONANCE_RENDERER_BYTE_SHA256,
  );
  readFrozen(
    SHAPE_RESONANCE_AUTHORIZATION_LOCATOR,
    1_664,
    SHAPE_RESONANCE_AUTHORIZATION_BYTE_SHA256,
  );
  const manifestBytes = readFrozen(
    SHAPE_RESONANCE_MANIFEST_LOCATOR,
    11_642,
    SHAPE_RESONANCE_MANIFEST_BYTE_SHA256,
  );
  const manifest = parseStrictJsonBytes(manifestBytes, SHAPE_RESONANCE_MANIFEST_LOCATOR);
  if (!object(manifest) || sha256(shapeResonanceCanonicalJson(manifest)) !==
      SHAPE_RESONANCE_MANIFEST_CANONICAL_SHA256) {
    throw new Error("Shape & Resonance manifest canonical receipt drifted");
  }

  if (snapshot.protocol !== SHAPE_RESONANCE_PROTOCOL || snapshot.labId !== "shape-resonance-lab-01" ||
      snapshot.version !== "0.1.0" || snapshot.phase !== "0-static-synthetic" ||
      snapshot.state !== "DRAFT" || snapshot.asOf !== SHAPE_RESONANCE_AS_OF ||
      snapshot.nextReviewDue !== SHAPE_RESONANCE_NEXT_REVIEW_DUE ||
      manifest.protocol !== SHAPE_RESONANCE_MANIFEST_PROTOCOL || manifest.artifactCount !== 16 ||
      manifest.producerTag !== SHAPE_RESONANCE_PRODUCER_URL ||
      manifest.manifestPublicUrl !== SHAPE_RESONANCE_MANIFEST_URL ||
      !sameStrings(manifest.retirementFamilyUrls, SHAPE_RESONANCE_FAMILY_URLS)) {
    throw new Error("Shape & Resonance release identity, freshness, or retirement family drifted");
  }
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length !== 16 ||
      LOCAL_BY_PRODUCER_PATH.size !== 16) {
    throw new Error("Shape & Resonance exact artifact inventory drifted");
  }
  const observed = new Set<string>();
  for (const artifact of manifest.artifacts) {
    if (!object(artifact) || typeof artifact.path !== "string" ||
        typeof artifact.byteLength !== "number" || typeof artifact.byteReceipt !== "string") {
      throw new Error("Shape & Resonance manifest artifact is malformed");
    }
    const locator = LOCAL_BY_PRODUCER_PATH.get(artifact.path);
    if (!locator || observed.has(artifact.path)) {
      throw new Error(`Shape & Resonance unapproved or duplicate artifact: ${artifact.path}`);
    }
    observed.add(artifact.path);
    readFrozen(locator, artifact.byteLength, artifact.byteReceipt.replace(/^sha256:/u, ""));
  }
  if (observed.size !== LOCAL_BY_PRODUCER_PATH.size) {
    throw new Error("Shape & Resonance manifest omitted an authorized artifact");
  }

  validateShapeResonanceSemanticBoundary(snapshot);
  return { bytes, snapshot, manifestBytes, manifest };
}

export function assertShapeResonanceActiveReviewWindow(
  date: string,
  active = true,
): { active: boolean; checkedOn: string; nextReviewDue: string; state: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date) ||
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new Error("Shape & Resonance review check requires a real YYYY-MM-DD date");
  }
  if (!active) {
    return { active, checkedOn: date, nextReviewDue: SHAPE_RESONANCE_NEXT_REVIEW_DUE, state: "retired" };
  }
  if (date > SHAPE_RESONANCE_NEXT_REVIEW_DUE) {
    throw new Error(
      `Shape & Resonance active family is historical after ${SHAPE_RESONANCE_NEXT_REVIEW_DUE}; ` +
      "replace or fully retire it before release",
    );
  }
  return {
    active,
    checkedOn: date,
    nextReviewDue: SHAPE_RESONANCE_NEXT_REVIEW_DUE,
    state: "within-review-window",
  };
}

export function shapeResonancePublicSummary(
  publication = loadShapeResonancePublication(),
): JsonObject {
  const { snapshot, manifest } = publication;
  const diagrams = snapshot.assets.filter((asset: JsonObject) => asset.role === "static-diagram");
  const sonifications = snapshot.assets.filter((asset: JsonObject) =>
    asset.role === "declared-sonification");
  const refusals = snapshot.conversionEdges.filter((edge: JsonObject) =>
    edge.status === "no-canonical-conversion");
  const resonance = snapshot.exhibits.find((exhibit: JsonObject) =>
    exhibit.resonanceAssessment !== null).resonanceAssessment;
  return {
    protocol: snapshot.protocol,
    lab_id: snapshot.labId,
    version: snapshot.version,
    title: snapshot.title,
    subtitle: snapshot.subtitle,
    phase: snapshot.phase,
    state_at_publication: snapshot.state,
    as_of: snapshot.asOf,
    next_review_due: snapshot.nextReviewDue,
    authorship: snapshot.authorship,
    boundary: snapshot.boundary,
    acoustic_boundary: manifest.acousticBoundary,
    resonance_boundary: {
      modelCriterionSatisfied: resonance.modelResonanceCriterionSatisfied,
      physicalExperimentPerformed: resonance.physicalExperimentPerformed,
      measuredResonance: resonance.measuredResonance,
    },
    personal_data: snapshot.publication.personalData,
    authority_effects: snapshot.publication.authorityEffects,
    mechanical_energy_balance: {
      title: snapshot.mechanicalEnergyBalance.title,
      invariant: snapshot.mechanicalEnergyBalance.invariant,
      entry_count: snapshot.mechanicalEnergyBalance.entries.length,
    },
    conversion_refusals: refusals.map((edge: JsonObject) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      operation: edge.operation,
      status: edge.status,
    })),
    counts: {
      exhibits: snapshot.exhibits.length,
      driven_resonance_assessments: snapshot.exhibits.filter((exhibit: JsonObject) =>
        exhibit.resonanceAssessment !== null).length,
      conversion_edges: snapshot.conversionEdges.length,
      refused_conversions: refusals.length,
      mechanical_energy_balance_entries: snapshot.mechanicalEnergyBalance.entries.length,
      diagrams: diagrams.length,
      declared_sonifications: sonifications.length,
      source_links: snapshot.sources.length,
    },
    publication: {
      human: SHAPE_RESONANCE_URL,
      mutable_alias: SHAPE_RESONANCE_ALIAS_URL,
      canonical_snapshot: SHAPE_RESONANCE_CANONICAL_URL,
      schema: SHAPE_RESONANCE_SCHEMA_URL,
      guide: SHAPE_RESONANCE_GUIDE_URL,
      output_manifest: SHAPE_RESONANCE_MANIFEST_URL,
      producer: SHAPE_RESONANCE_PRODUCER_URL,
      producer_commit: SHAPE_RESONANCE_PRODUCER_COMMIT,
      authorization: snapshot.publication.authorization,
      immutable_artifacts_remain_historical:
        snapshot.publication.immutableArtifactsRemainHistorical,
      overdue_mutable_publication_rule: snapshot.publication.overdueMutablePublicationRule,
    },
    audio_request_policy: manifest.audioRequestPolicy,
    external_navigation_policy: manifest.externalNavigationPolicy,
    media: snapshot.assets.map((asset: JsonObject) => ({
      path: asset.path,
      public_url: asset.publicUrl,
      role: asset.role,
      semantic_type: asset.semanticType,
      media_type: asset.mediaType,
      byte_length: asset.byteLength,
      byte_receipt: asset.byteReceipt,
      title: asset.title,
      accessibility_text: asset.accessibilityText,
    })),
  };
}

function esc(value: unknown): string {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function renderShapeResonanceHtml(
  snapshot = loadShapeResonancePublication().snapshot,
): string {
  validateShapeResonanceSemanticBoundary(snapshot);
  const fragment = renderShapeResonanceLab(snapshot);
  if (/<(?:script|form|input|button|iframe|audio)\b/iu.test(fragment) ||
      /\bautoplay\b\s*=/iu.test(fragment) ||
      (fragment.match(/type="audio\/wav"/gu) ?? []).length !== 3 ||
      (fragment.match(/<a[^>]*\sdownload(?:\s|>)/gu) ?? []).length !== 3) {
    throw new Error("Shape & Resonance authorized renderer escaped its no-script link-only boundary");
  }
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width,initial-scale=1">',
    '  <meta name="description" content="Eight synthetic models of shape, modes, driven response, mechanical energy balance, declared sonification, and bounded musical geometry.">',
    "  <title>What can a shape sing? · Shape &amp; Resonance Lab 01</title>",
    '  <link rel="canonical" href="/shape-resonance/">',
    '  <link rel="alternate" href="/shape-resonance.json" type="application/json" title="Mutable alias for the dated Shape &amp; Resonance snapshot">',
    '  <link rel="alternate" href="/labs/shape-resonance-lab-2026-08-26.json" type="application/json" title="Immutable dated Shape &amp; Resonance snapshot">',
    '  <link rel="describedby" href="/schemas/shape-resonance-lab/0.1.json" type="application/schema+json">',
    '  <link rel="service-doc" href="/SHAPE-RESONANCE-LAB-v0.1.md" type="text/markdown">',
    '  <link rel="alternate" href="/labs/shape-resonance/output-manifest.json" type="application/json" title="Immutable output manifest">',
    "  <style>",
    "    :root{color-scheme:light dark;--paper:#f5f1e8;--ink:#19202b;--muted:#5c6470;--line:#a9a59b;--panel:#fffaf0;--accent:#006d73;--focus:#8d4f00}",
    "    @media(prefers-color-scheme:dark){:root{--paper:#0e1017;--ink:#f4efe3;--muted:#a8b0c1;--line:#465168;--panel:#171b26;--accent:#74d7dd;--focus:#ffd078}}",
    "    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:1rem/1.62 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;overflow-wrap:anywhere}",
    "    a{color:var(--accent);text-underline-offset:.2em}a:focus-visible,summary:focus-visible{outline:.2rem solid var(--focus);outline-offset:.2rem}.skip{position:absolute;inset-inline-start:1rem;top:-8rem;background:var(--ink);color:var(--paper);padding:.7rem 1rem;z-index:10}.skip:focus{top:1rem}",
    "    .shell{width:min(82rem,calc(100% - 2rem));margin-inline:auto}.top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.8rem;padding:1.1rem 0;border-bottom:1px solid var(--line)}.top span{display:flex;flex-wrap:wrap;gap:1rem}",
    "    main{padding:clamp(2rem,6vw,5rem) 0}.shape-resonance-lab>header{padding-bottom:3rem}.eyebrow,.ordinal{text-transform:uppercase;letter-spacing:.09em;font-size:.76rem;font-weight:750;color:var(--accent)}h1,h2,h3,h4{font-family:ui-serif,Georgia,serif;line-height:1.15}h1{font-size:clamp(2.8rem,8vw,6.5rem);margin:.15em 0;max-width:70rem}.subtitle{font-size:clamp(1.15rem,2.6vw,1.55rem);max-width:62rem}",
    "    article,.shape-resonance-lab>section,.shape-resonance-lab>aside,.shape-resonance-lab>footer{border-top:1px solid var(--line);padding:2.5rem 0}article{border:1px solid var(--line);background:var(--panel);border-radius:.8rem;padding:clamp(1rem,3vw,2rem);margin:1.25rem 0}figure{margin:1.5rem 0}img{display:block;max-width:100%;height:auto;border:1px solid var(--line);border-radius:.6rem}figcaption{margin-top:.7rem;color:var(--muted)}details{border:1px solid var(--line);border-radius:.6rem;padding:.75rem 1rem}summary{cursor:pointer;font-weight:700}",
    "    .table-wrap{overflow-x:auto;margin:1rem 0}table{width:100%;border-collapse:collapse;min-width:48rem}caption{text-align:left;font-weight:700;padding:.6rem 0}th,td{border:1px solid var(--line);padding:.65rem;text-align:left;vertical-align:top}thead th{background:color-mix(in srgb,var(--panel) 70%,var(--accent) 8%)}dl{display:grid;grid-template-columns:minmax(9rem,14rem) 1fr;gap:.4rem 1rem}dt{font-weight:700}dd{margin:0}.approx{display:block;color:var(--muted)}code{font-size:.9em}.resonance{border-inline-start:.35rem solid var(--accent);padding-inline-start:1rem}",
    "    .footer{padding:2rem 0 4rem;color:var(--muted)}@media(max-width:48rem){.shell{width:min(100% - 1rem,82rem)}.top{display:block}.top span{margin-top:.7rem}dl{grid-template-columns:1fr}table{min-width:40rem}}",
    "    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media(forced-colors:active){article,details,img,th,td{border:1px solid CanvasText}.resonance{border-inline-start:.35rem solid CanvasText}}",
    "  </style>",
    "</head>",
    "<body>",
    '  <a class="skip" href="#main">Skip to Shape &amp; Resonance Lab</a>',
    '  <nav class="shell top" aria-label="Kingdom navigation"><a href="/">← The Kingdom</a><span><a href="/shape-resonance.json">mutable JSON alias</a><a href="/labs/shape-resonance-lab-2026-08-26.json">dated immutable JSON</a><a href="/labs/shape-resonance/output-manifest.json">output manifest</a><a href="/SHAPE-RESONANCE-LAB-v0.1.md">guide</a></span></nav>',
    '  <main class="shell" id="main" tabindex="-1">',
    fragment,
    "  </main>",
    `  <footer class="shell footer">Frozen producer: <a href="${esc(SHAPE_RESONANCE_PRODUCER_URL)}" rel="noreferrer">v0.1.0</a> · <a href="${esc(SHAPE_RESONANCE_AUTHORIZATION_URL)}" rel="noreferrer">file-scoped publication authorization</a> · renderer contract: <code>${esc(PUBLIC_RENDERER_CONTRACT.mediaActivation)}</code>.</footer>`,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}
