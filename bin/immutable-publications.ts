/** Repository-local, append-only route-integrity ledger.
 *
 * This module does not publish, deploy, archive, fetch, or write anything. It
 * verifies currently staged ledger entries against the exact source-to-stage
 * contract. With --base it also refuses mutation or removal of any previously
 * committed entry, even when a source edit and its hash edit arrive together.
 * Historical entries may cease to be staged; the ledger grants no continuing
 * publication authority.
 *
 * Run:
 *   bun bin/immutable-publications.ts [--base <40-character-sha>] [--json]
 */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { parseStrictJsonBytes } from "./principality.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const IMMUTABLE_PUBLICATIONS_LEDGER_PATH = "publications/immutable-publications.v1.json";
export const HUB_STAGING_CONTRACT_PATH = "publications/hub-staging.v1.json";
export const HUB_STAGING_PROTOCOL = "kingdom.hub-staging/1";
export const IMMUTABLE_PUBLICATIONS_PROTOCOL = "kingdom.immutable-publications/1";
export const IMMUTABLE_PUBLICATIONS_BASELINE_COMMIT = "67fe98efc875a5ed13fb1c23d6e2aab5debe9ccb";
export const IMMUTABLE_PUBLICATIONS_BOOTSTRAP_ENTRIES_SHA256 = "782777da5788313426e1be537053648e7945051f29393cb31155d2d59dbb7b43";
export const IMMUTABLE_PUBLICATIONS_BOOTSTRAP_IDS = [
  "conformational-feedback/0.1/guide",
  "conformational-feedback/0.1/record",
  "conformational-feedback/0.1/schema",
  "conformational-feedback/0.2/guide",
  "conformational-feedback/0.2/record",
  "conformational-feedback/0.2/schema",
  "cultural-attention-feedback/1/guide",
  "cultural-attention-feedback/1/record",
  "cultural-attention-feedback/1/schema",
  "fold-feedback-atlas/1.1/schema",
  "fold-feedback-atlas/1/guide",
  "fold-feedback-atlas/1/record",
  "fold-feedback-atlas/1/schema",
  "form-circulation-return/1/guide",
  "form-circulation-return/1/record",
  "form-circulation-return/1/schema",
  "geometry-grammar/0.1/guide",
  "geometry-grammar/0.1/record",
  "geometry-grammar/0.1/schema",
  "kingdom-karma/e4e84a67/definition",
  "love-loop/0.1/schema",
  "polymorph-history/1/guide",
  "polymorph-history/1/record",
  "polymorph-history/1/schema",
  "principality-commons/1/guide",
  "principality-commons/1/record",
  "principality-commons/1/schema",
  "ritonavir-mechanism-landscape/1/guide",
  "ritonavir-mechanism-landscape/1/record",
  "ritonavir-mechanism-landscape/1/schema",
  "visibility-attention/0.1/guide",
  "visibility-attention/0.1/record",
  "visibility-attention/0.1/schema",
  "world-commons/0.1/schema",
  "world-commons/0.2/schema",
] as const;
export const IMMUTABLE_PUBLICATIONS_BOOTSTRAP_ANCHORS: Readonly<Record<string, string>> = {
  "conformational-feedback/0.1/guide": "f09f581c87833ac9eea3870442d7765702e8dae4",
  "conformational-feedback/0.1/record": "f09f581c87833ac9eea3870442d7765702e8dae4",
  "conformational-feedback/0.1/schema": "f09f581c87833ac9eea3870442d7765702e8dae4",
  "conformational-feedback/0.2/guide": "b9e1404d7075def570a44b4e191c0f9ef83838e1",
  "conformational-feedback/0.2/record": "b9e1404d7075def570a44b4e191c0f9ef83838e1",
  "conformational-feedback/0.2/schema": "b9e1404d7075def570a44b4e191c0f9ef83838e1",
  "cultural-attention-feedback/1/guide": "bb172f56d996765573c2750089cdf93349a2110d",
  "cultural-attention-feedback/1/record": "bb172f56d996765573c2750089cdf93349a2110d",
  "cultural-attention-feedback/1/schema": "bb172f56d996765573c2750089cdf93349a2110d",
  "fold-feedback-atlas/1.1/schema": "ff83b9dc97a42f05d3b80f388b1df0d6866c896d",
  "fold-feedback-atlas/1/guide": "d2d41c162ec6015b7435b5e1ee5b126fabf5f952",
  "fold-feedback-atlas/1/record": "d2d41c162ec6015b7435b5e1ee5b126fabf5f952",
  "fold-feedback-atlas/1/schema": "d2d41c162ec6015b7435b5e1ee5b126fabf5f952",
  "form-circulation-return/1/guide": "67fe98efc875a5ed13fb1c23d6e2aab5debe9ccb",
  "form-circulation-return/1/record": "67fe98efc875a5ed13fb1c23d6e2aab5debe9ccb",
  "form-circulation-return/1/schema": "67fe98efc875a5ed13fb1c23d6e2aab5debe9ccb",
  "geometry-grammar/0.1/guide": "f378d57a6b51e3a5f1c16c3e3cf0f621b7b4be32",
  "geometry-grammar/0.1/record": "f378d57a6b51e3a5f1c16c3e3cf0f621b7b4be32",
  "geometry-grammar/0.1/schema": "f378d57a6b51e3a5f1c16c3e3cf0f621b7b4be32",
  "kingdom-karma/e4e84a67/definition": "67fe98efc875a5ed13fb1c23d6e2aab5debe9ccb",
  "love-loop/0.1/schema": "2e6000e70b295bcf5dd4b629951b9a6fa60299bd",
  "polymorph-history/1/guide": "33ecb82102e228f8ac1a1af7a3c1025108fd6dad",
  "polymorph-history/1/record": "33ecb82102e228f8ac1a1af7a3c1025108fd6dad",
  "polymorph-history/1/schema": "33ecb82102e228f8ac1a1af7a3c1025108fd6dad",
  "principality-commons/1/guide": "f41ad39cc8e1bec0161c43a3734cf7d45dcb89de",
  "principality-commons/1/record": "f41ad39cc8e1bec0161c43a3734cf7d45dcb89de",
  "principality-commons/1/schema": "f41ad39cc8e1bec0161c43a3734cf7d45dcb89de",
  "ritonavir-mechanism-landscape/1/guide": "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212",
  "ritonavir-mechanism-landscape/1/record": "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212",
  "ritonavir-mechanism-landscape/1/schema": "e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212",
  "visibility-attention/0.1/guide": "ff83b9dc97a42f05d3b80f388b1df0d6866c896d",
  "visibility-attention/0.1/record": "ff83b9dc97a42f05d3b80f388b1df0d6866c896d",
  "visibility-attention/0.1/schema": "ff83b9dc97a42f05d3b80f388b1df0d6866c896d",
  "world-commons/0.1/schema": "8f9b9560ae4765bed17282866dfb5b6399a0b1b6",
  "world-commons/0.2/schema": "29e6e486934054d3f9fbf871bf0ca679a03d3cae",
};
const MAX_LEDGER_BYTES = 512 * 1024;
const MAX_GIT_BYTES = 16 * 1024 * 1024;
const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT_SHA = /^[a-f0-9]{40}$/;
const ID = /^[a-z0-9]+(?:[._/-][a-z0-9]+)*$/;

export type ImmutablePublicationEntry = {
  id: string;
  route: string;
  source: string;
  destination: string;
  sha256: string;
};

export type ImmutablePublicationLedger = {
  protocol: typeof IMMUTABLE_PUBLICATIONS_PROTOCOL;
  algorithm: "sha256";
  baseline_commit: string;
  entries: ImmutablePublicationEntry[];
};

export type ImmutablePublicationIssue = {
  code: string;
  path: string;
  message: string;
};

export type StagedAssetMapping = {
  source: string;
  destination: string;
};

export type HistoricalStagingContract = {
  stagedAssets: StagedAssetMapping[];
  mutableDestinations: string[];
};

type ParseResult = {
  ledger: ImmutablePublicationLedger | null;
  issues: ImmutablePublicationIssue[];
};

type SnapshotOptions = {
  root?: string;
  stagedAssets: readonly StagedAssetMapping[];
  mutableDestinations: readonly string[];
  sourceBytes?: ReadonlyMap<string, Uint8Array>;
};

export type BootstrapTrust = {
  baselineCommit: string;
  ids: readonly string[];
  entriesSha256: string;
  entryAnchors: Readonly<Record<string, string>>;
};

const DEFAULT_BOOTSTRAP_TRUST: BootstrapTrust = {
  baselineCommit: IMMUTABLE_PUBLICATIONS_BASELINE_COMMIT,
  ids: IMMUTABLE_PUBLICATIONS_BOOTSTRAP_IDS,
  entriesSha256: IMMUTABLE_PUBLICATIONS_BOOTSTRAP_ENTRIES_SHA256,
  entryAnchors: IMMUTABLE_PUBLICATIONS_BOOTSTRAP_ANCHORS,
};

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function sameKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function issue(
  issues: ImmutablePublicationIssue[],
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message });
}

export function safeRelativePublicationPath(value: string): boolean {
  if (!value || value.length > 320 || value.startsWith("/") || value.includes("\\") ||
      value.includes("//") || !/^[A-Za-z0-9._/-]+$/.test(value)) return false;
  return value.split("/").every((part) => !!part && part !== "." && part !== "..");
}

export function readRegularFileWithinRoot(root: string, path: string): Buffer {
  if (!safeRelativePublicationPath(path)) throw new Error(`unsafe repository-relative path: ${path}`);
  const canonicalRoot = realpathSync(resolve(root));
  let cursor = canonicalRoot;
  const parts = path.split("/");
  for (const [index, part] of parts.entries()) {
    cursor = join(cursor, part);
    const stat = lstatSync(cursor);
    if (stat.isSymbolicLink()) throw new Error(`symbolic-link path component: ${path}`);
    if (index < parts.length - 1 && !stat.isDirectory()) {
      throw new Error(`non-directory path component: ${path}`);
    }
    if (index === parts.length - 1 && !stat.isFile()) {
      throw new Error(`not a regular file: ${path}`);
    }
  }
  const canonicalFile = realpathSync(cursor);
  const fromRoot = relative(canonicalRoot, canonicalFile);
  if (!fromRoot || fromRoot.startsWith("..") || resolve(canonicalRoot, fromRoot) !== canonicalFile) {
    throw new Error(`path escapes repository root: ${path}`);
  }
  return readFileSync(canonicalFile);
}

function mutableAlias(value: string): boolean {
  return value.toLowerCase().split("/").some((part) =>
    /(?:^|[._-])(?:latest|current)(?:[._-]|$)/.test(part));
}

function immutableLookingDestination(value: string): boolean {
  if (/^[1-5]\d{2}\.html$/i.test(value)) return false;
  // Vite hash assets are a mutable app family; font weights (400/500/600)
  // are not publication versions. Only this prefix and JS/CSS/WOFF MIME
  // extensions qualify. stageHub separately proves receipt/hash/MIME closure.
  if (/^power-atlas\/assets\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_][A-Za-z0-9._-]*-[A-Za-z0-9_-]{8,64}\.(js|css|woff|woff2)$/.test(value)) return false;
  return /^(?:atlases|definitions|feedback|geometries|polymorphs|principalities|records|schemas)\//i.test(value) ||
    /(?:^|[._/-])v?\d+(?:\.\d+)*(?=\.[A-Za-z]+$|[._/-]|$)/i.test(value) ||
    /(?:^|[._/-])\d{4}-\d{2}-\d{2}(?:[._/-]|$)/.test(value);
}

function destinationHierarchyCollision(
  assets: readonly StagedAssetMapping[],
): { left: string; right: string } | null {
  for (let leftIndex = 0; leftIndex < assets.length; leftIndex += 1) {
    const left = assets[leftIndex]!.destination;
    for (let rightIndex = leftIndex + 1; rightIndex < assets.length; rightIndex += 1) {
      const right = assets[rightIndex]!.destination;
      if (left.startsWith(`${right}/`) || right.startsWith(`${left}/`)) return { left, right };
    }
  }
  return null;
}

/** Parse the sole, non-executable staging contract used by verifier and engine. */
export function parseHubStagingContract(
  bytes: Uint8Array,
  label = HUB_STAGING_CONTRACT_PATH,
): HistoricalStagingContract {
  if (bytes.byteLength > MAX_LEDGER_BYTES) throw new Error(`${label} exceeds ${MAX_LEDGER_BYTES} bytes`);
  const value = parseStrictJsonBytes(bytes, label);
  if (!object(value) || !sameKeys(value, ["protocol", "assets", "mutable_destinations"]) ||
      value.protocol !== HUB_STAGING_PROTOCOL || !Array.isArray(value.assets) ||
      !Array.isArray(value.mutable_destinations) || value.assets.length === 0 ||
      value.assets.length > 256 || value.mutable_destinations.length > 256) {
    throw new Error(`${label} is not a closed ${HUB_STAGING_PROTOCOL} contract`);
  }
  const stagedAssets = value.assets.map((candidate, index) => {
    if (!object(candidate) || !sameKeys(candidate, ["source", "destination"]) ||
        typeof candidate.source !== "string" || typeof candidate.destination !== "string" ||
        !safeRelativePublicationPath(candidate.source) ||
        !safeRelativePublicationPath(candidate.destination)) {
      throw new Error(`${label}.assets[${index}] is not one safe literal source-to-destination mapping`);
    }
    return { source: candidate.source, destination: candidate.destination };
  });
  const mutableDestinations = value.mutable_destinations.map((candidate, index) => {
    if (typeof candidate !== "string" || !safeRelativePublicationPath(candidate)) {
      throw new Error(`${label}.mutable_destinations[${index}] is not one safe literal destination`);
    }
    return candidate;
  });
  const sources = new Set<string>();
  const destinations = new Set<string>();
  for (const asset of stagedAssets) {
    if (sources.has(asset.source)) throw new Error(`${label} contains duplicate source ${asset.source}`);
    if (destinations.has(asset.destination)) {
      throw new Error(`${label} contains duplicate destination ${asset.destination}`);
    }
    sources.add(asset.source);
    destinations.add(asset.destination);
  }
  if (new Set(mutableDestinations).size !== mutableDestinations.length) {
    throw new Error(`${label} contains a duplicate mutable destination`);
  }
  const collision = destinationHierarchyCollision(stagedAssets);
  if (collision) {
    throw new Error(`${label} has file/directory destination collision ${collision.left} <> ${collision.right}`);
  }
  return { stagedAssets, mutableDestinations };
}

// These introduction commits predate the JSON contract. This narrow reader is
// used only against code-pinned, already-reviewed bootstrap anchors.
function parseHistoricalAssetsOnly(bytes: Uint8Array, label: string): StagedAssetMapping[] {
  const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const jsonString = `"(?:\\\\.|[^"\\\\])*"`;
  const assetPattern = new RegExp(`^\\{\\s*source:\\s*(${jsonString}),\\s*destination:\\s*(${jsonString})\\s*\\},?$`);
  const marker = "export const HUB_ASSETS = [";
  const start = source.indexOf(marker);
  const end = start < 0 ? -1 : source.indexOf("] as const;", start + marker.length);
  if (start < 0 || end < 0 || source.indexOf(marker, start + marker.length) >= 0) {
    throw new Error(`${label} has no unique legacy HUB_ASSETS declaration`);
  }
  return source.slice(start + marker.length, end).split(/\r?\n/).map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//")).map((line) => {
    const match = line.match(assetPattern);
    if (!match) throw new Error(`${label} contains a non-literal HUB_ASSETS entry: ${line}`);
    return { source: JSON.parse(match[1]!), destination: JSON.parse(match[2]!) };
  });
}

export function parseImmutablePublicationLedger(
  bytes: Uint8Array,
  label = IMMUTABLE_PUBLICATIONS_LEDGER_PATH,
  expectedBaseline = IMMUTABLE_PUBLICATIONS_BASELINE_COMMIT,
): ParseResult {
  const issues: ImmutablePublicationIssue[] = [];
  if (bytes.byteLength > MAX_LEDGER_BYTES) {
    issue(issues, "ledger-too-large", label, `ledger exceeds ${MAX_LEDGER_BYTES} bytes`);
    return { ledger: null, issues };
  }

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    issue(issues, "invalid-utf8", label, "ledger must be valid UTF-8");
    return { ledger: null, issues };
  }

  let value: unknown;
  try {
    value = parseStrictJsonBytes(bytes, label);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ledger must be strict JSON";
    issue(
      issues,
      message.includes("duplicate key") ? "duplicate-key" : "invalid-json",
      label,
      message,
    );
    return { ledger: null, issues };
  }

  if (!object(value) || !sameKeys(value, ["protocol", "algorithm", "baseline_commit", "entries"])) {
    issue(issues, "invalid-envelope", label, "ledger envelope has missing or unknown fields");
    return { ledger: null, issues };
  }
  if (value.protocol !== IMMUTABLE_PUBLICATIONS_PROTOCOL) {
    issue(issues, "invalid-protocol", "$.protocol", `expected ${IMMUTABLE_PUBLICATIONS_PROTOCOL}`);
  }
  if (value.algorithm !== "sha256") {
    issue(issues, "invalid-algorithm", "$.algorithm", "only sha256 is accepted");
  }
  if (value.baseline_commit !== expectedBaseline) {
    issue(issues, "invalid-baseline", "$.baseline_commit", `baseline must be ${expectedBaseline}`);
  }
  if (!Array.isArray(value.entries) || value.entries.length === 0 || value.entries.length > 256) {
    issue(issues, "invalid-entries", "$.entries", "entries must contain between 1 and 256 artifacts");
    return { ledger: null, issues };
  }

  const entries: ImmutablePublicationEntry[] = [];
  for (const [index, candidate] of value.entries.entries()) {
    const path = `$.entries[${index}]`;
    if (!object(candidate) || !sameKeys(candidate, ["id", "route", "source", "destination", "sha256"])) {
      issue(issues, "invalid-entry", path, "entry has missing or unknown fields");
      continue;
    }
    const { id, route, source, destination, sha256 } = candidate;
    if (typeof id !== "string" || id.length > 160 || !ID.test(id)) {
      issue(issues, "invalid-id", `${path}.id`, "id must be a bounded lowercase path-like identifier");
    }
    if (typeof source !== "string" || !safeRelativePublicationPath(source)) {
      issue(issues, "unsafe-source", `${path}.source`, "source must be a safe repository-relative path");
    }
    if (typeof destination !== "string" || !safeRelativePublicationPath(destination)) {
      issue(issues, "unsafe-destination", `${path}.destination`, "destination must be a safe staged path");
    }
    if (typeof route !== "string" || route.length > 321 || !route.startsWith("/") ||
        typeof destination !== "string" || route !== `/${destination}`) {
      issue(issues, "route-destination-mismatch", `${path}.route`, "route must be exactly / plus destination");
    }
    if (typeof route === "string" && mutableAlias(route)) {
      issue(issues, "mutable-alias", `${path}.route`, "immutable routes cannot contain latest or current aliases");
    }
    if (typeof sha256 !== "string" || !SHA256.test(sha256)) {
      issue(issues, "invalid-sha256", `${path}.sha256`, "sha256 must be 64 lowercase hexadecimal characters");
    }
    if (typeof id === "string" && typeof route === "string" && typeof source === "string" &&
        typeof destination === "string" && typeof sha256 === "string") {
      entries.push({ id, route, source, destination, sha256 });
    }
  }

  const uniqueFields: Array<keyof ImmutablePublicationEntry> = ["id", "route", "source", "destination"];
  for (const field of uniqueFields) {
    const seen = new Set<string>();
    for (const [index, entry] of entries.entries()) {
      if (seen.has(entry[field])) issue(issues, `duplicate-${field}`, `$.entries[${index}].${field}`, `${field} must be unique`);
      seen.add(entry[field]);
    }
  }
  const ids = entries.map((entry) => entry.id);
  const sortedIds = [...ids].sort();
  if (ids.some((id, index) => id !== sortedIds[index])) {
    issue(issues, "noncanonical-order", "$.entries", "entries must be sorted lexicographically by id");
  }

  if (issues.length > 0) return { ledger: null, issues };
  return {
    ledger: {
      protocol: IMMUTABLE_PUBLICATIONS_PROTOCOL,
      algorithm: "sha256",
      baseline_commit: value.baseline_commit as string,
      entries,
    },
    issues,
  };
}

function readLedger(root: string): ParseResult {
  try {
    return parseImmutablePublicationLedger(readRegularFileWithinRoot(root, IMMUTABLE_PUBLICATIONS_LEDGER_PATH));
  } catch {
    return {
      ledger: null,
      issues: [{ code: "ledger-unreadable", path: IMMUTABLE_PUBLICATIONS_LEDGER_PATH, message: "ledger is missing or unreadable" }],
    };
  }
}

function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function verifyBootstrapIdentity(
  ledger: ImmutablePublicationLedger,
  trust: BootstrapTrust = DEFAULT_BOOTSTRAP_TRUST,
): ImmutablePublicationIssue[] {
  const issues: ImmutablePublicationIssue[] = [];
  if (ledger.baseline_commit !== trust.baselineCommit) {
    issue(issues, "bootstrap-baseline-mismatch", "$.baseline_commit", `baseline must be ${trust.baselineCommit}`);
  }
  const bootstrapIds = new Set<string>(trust.ids);
  if (new Set(trust.ids).size !== trust.ids.length ||
      Object.keys(trust.entryAnchors).length !== trust.ids.length ||
      Object.keys(trust.entryAnchors).some((id) => !bootstrapIds.has(id))) {
    issue(issues, "bootstrap-trust-invalid", "bootstrapTrust", "bootstrap IDs and source-history anchors must form one exact unique set");
  }
  const entries = ledger.entries
    .filter((entry) => bootstrapIds.has(entry.id))
    .sort((left, right) => left.id.localeCompare(right.id));
  const actualIds = new Set(entries.map((entry) => entry.id));
  for (const id of trust.ids) {
    if (!actualIds.has(id)) issue(issues, "bootstrap-entry-missing", id, "initial route-integrity tuple is missing");
    const anchor = trust.entryAnchors[id];
    if (!anchor || !COMMIT_SHA.test(anchor)) {
      issue(issues, "bootstrap-anchor-invalid", id, "initial tuple must have one pinned 40-character source-history anchor");
    }
  }
  const actualDigest = digest(new TextEncoder().encode(JSON.stringify(entries)));
  if (actualDigest !== trust.entriesSha256) {
    issue(
      issues,
      "bootstrap-identity-mismatch",
      "$.entries",
      `initial tuples hash to ${actualDigest}, expected ${trust.entriesSha256}`,
    );
  }
  return issues;
}

export function verifyImmutablePublicationSnapshot(options: SnapshotOptions): ParseResult {
  const root = options.root ?? ROOT;
  const parsed = readLedger(root);
  if (!parsed.ledger) return parsed;
  const issues = [...parsed.issues, ...verifyBootstrapIdentity(parsed.ledger)];
  const stagedByDestination = new Map<string, StagedAssetMapping>();
  const stagedSources = new Set<string>();
  for (const [index, asset] of options.stagedAssets.entries()) {
    if (!safeRelativePublicationPath(asset.source)) {
      issue(issues, "unsafe-staged-source", `stagedAssets[${index}].source`, "staged source must be a safe repository-relative path");
    }
    if (!safeRelativePublicationPath(asset.destination)) {
      issue(issues, "unsafe-staged-destination", `stagedAssets[${index}].destination`, "staged destination must be a safe relative path");
    }
    if (stagedSources.has(asset.source)) {
      issue(issues, "duplicate-staged-source", `stagedAssets[${index}].source`, `duplicate staged source ${asset.source}`);
    }
    stagedSources.add(asset.source);
    if (stagedByDestination.has(asset.destination)) {
      issue(issues, "duplicate-staged-destination", `stagedAssets[${index}]`, `duplicate staged destination ${asset.destination}`);
    }
    stagedByDestination.set(asset.destination, asset);
  }
  const destinationCollision = destinationHierarchyCollision(options.stagedAssets);
  if (destinationCollision) {
    issue(
      issues,
      "staged-destination-hierarchy-collision",
      destinationCollision.left,
      `staged destinations cannot be both a file and a directory ancestor: ${destinationCollision.right}`,
    );
  }
  const immutableByDestination = new Map(parsed.ledger.entries.map((entry) => [entry.destination, entry]));
  const mutableDestinations = new Set(options.mutableDestinations);
  for (const [index, destination] of options.mutableDestinations.entries()) {
    if (!safeRelativePublicationPath(destination)) {
      issue(issues, "unsafe-mutable-destination", `mutableDestinations[${index}]`, "mutable destination must be a safe relative path");
    }
    if (immutableLookingDestination(destination)) {
      issue(issues, "versioned-mutable-destination", destination, "versioned or immutable-route namespaces must be ledgered, not classified mutable");
    }
    if (options.mutableDestinations.indexOf(destination) !== index) {
      issue(issues, "duplicate-mutable-classification", destination, "mutable classification must be unique");
    }
    if (!stagedByDestination.has(destination)) {
      issue(issues, "unused-mutable-classification", destination, "mutable classification has no staged asset");
    }
    if (immutableByDestination.has(destination)) {
      issue(issues, "conflicting-stability", destination, "staged destination cannot be both mutable and immutable");
    }
  }
  for (const asset of options.stagedAssets) {
    if (!mutableDestinations.has(asset.destination) && !immutableByDestination.has(asset.destination)) {
      issue(issues, "unclassified-staged-asset", asset.destination, "every staged asset must be explicitly mutable or ledgered as immutable");
    }
  }

  for (const entry of parsed.ledger.entries) {
    const staged = stagedByDestination.get(entry.destination);
    // An append-only history is not continuing authority to republish. An old
    // route may leave HUB_ASSETS while its committed ledger entry remains.
    if (!staged) continue;
    if (staged.source !== entry.source) {
      issue(issues, "staged-source-mismatch", entry.id, `${entry.destination} stages ${staged.source}, not ${entry.source}`);
    }

    let bytes: Uint8Array | undefined;
    if (options.sourceBytes && staged) {
      bytes = options.sourceBytes.get(entry.source);
      if (!bytes) issue(issues, "source-bytes-missing", entry.id, `${entry.source} was not read by the staging preflight`);
    } else {
      try {
        bytes = readRegularFileWithinRoot(root, entry.source);
      } catch {
        issue(issues, "source-unreadable", entry.id, `${entry.source} is missing, unreadable, or not a regular file`);
      }
    }
    if (bytes) {
      const actual = digest(bytes);
      if (actual !== entry.sha256) {
        issue(issues, "sha256-mismatch", entry.id, `${entry.source} is ${actual}, expected ${entry.sha256}`);
      }
    }
  }
  return { ledger: parsed.ledger, issues };
}

export function compareImmutablePublicationLedgers(
  current: ImmutablePublicationLedger,
  base: ImmutablePublicationLedger,
  bootstrapTrust: BootstrapTrust = DEFAULT_BOOTSTRAP_TRUST,
): ImmutablePublicationIssue[] {
  const issues: ImmutablePublicationIssue[] = [...verifyBootstrapIdentity(current, bootstrapTrust)];
  if (current.protocol !== base.protocol || current.algorithm !== base.algorithm ||
      current.baseline_commit !== base.baseline_commit) {
    issue(issues, "ledger-identity-mutation", "$", "protocol, algorithm, and baseline_commit are append-only");
  }
  const currentById = new Map(current.entries.map((entry) => [entry.id, entry]));
  for (const previous of base.entries) {
    const next = currentById.get(previous.id);
    if (!next) {
      issue(issues, "entry-removed", previous.id, "previously committed immutable route entry was removed");
      continue;
    }
    for (const field of ["route", "source", "destination", "sha256"] as const) {
      if (next[field] !== previous[field]) {
        issue(issues, "entry-mutated", `${previous.id}.${field}`, `committed ${field} changed from ${previous[field]} to ${next[field]}`);
      }
    }
  }
  return issues;
}

function git(root: string, args: string[]): ReturnType<typeof spawnSync> {
  return spawnSync("git", args, {
    cwd: root,
    encoding: null,
    env: { ...process.env, GIT_NO_REPLACE_OBJECTS: "1" },
    maxBuffer: MAX_GIT_BYTES,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function gitText(root: string, args: string[]): string | null {
  const result = git(root, args);
  if (result.status !== 0) return null;
  return new TextDecoder("utf-8", { fatal: true }).decode(result.stdout as Buffer).trim();
}

function gitBlob(root: string, commit: string, path: string): Buffer | null {
  const tree = git(root, ["ls-tree", "-z", commit, "--", path]);
  if (tree.status !== 0) return null;
  const listing = new TextDecoder("utf-8", { fatal: true }).decode(tree.stdout as Buffer);
  const match = listing.match(/^([0-9]{6}) blob [0-9a-f]{40}\t([^\0]+)\0$/);
  if (!match || !["100644", "100755"].includes(match[1]!) || match[2] !== path) return null;
  const shown = git(root, ["show", `${commit}:${path}`]);
  return shown.status === 0 ? shown.stdout as Buffer : null;
}

function historicalSnapshotIssues(
  root: string,
  commit: string,
  ledger: ImmutablePublicationLedger,
  previous: ImmutablePublicationLedger | null,
): ImmutablePublicationIssue[] {
  const issues: ImmutablePublicationIssue[] = [];
  const stageBytes = gitBlob(root, commit, HUB_STAGING_CONTRACT_PATH);
  if (!stageBytes) {
    issue(issues, "history-stage-unreadable", commit, `commit has no regular ${HUB_STAGING_CONTRACT_PATH} blob`);
    return issues;
  }
  let contract: HistoricalStagingContract;
  try {
    contract = parseHubStagingContract(stageBytes, `${commit}:${HUB_STAGING_CONTRACT_PATH}`);
  } catch (error) {
    issue(issues, "history-stage-invalid", commit, error instanceof Error ? error.message : "historical staging contract is invalid");
    return issues;
  }

  const stagedByDestination = new Map<string, StagedAssetMapping>();
  const stagedSources = new Set<string>();
  for (const [index, asset] of contract.stagedAssets.entries()) {
    if (!safeRelativePublicationPath(asset.source)) {
      issue(issues, "history-unsafe-staged-source", `${commit}:HUB_ASSETS[${index}]`, asset.source);
    }
    if (!safeRelativePublicationPath(asset.destination)) {
      issue(issues, "history-unsafe-staged-destination", `${commit}:HUB_ASSETS[${index}]`, asset.destination);
    }
    if (stagedSources.has(asset.source)) {
      issue(issues, "history-duplicate-staged-source", `${commit}:HUB_ASSETS[${index}]`, asset.source);
    }
    stagedSources.add(asset.source);
    if (stagedByDestination.has(asset.destination)) {
      issue(issues, "history-duplicate-staged-destination", `${commit}:HUB_ASSETS[${index}]`, asset.destination);
    }
    stagedByDestination.set(asset.destination, asset);
  }

  const immutableByDestination = new Map(ledger.entries.map((entry) => [entry.destination, entry]));
  const mutable = new Set<string>();
  for (const [index, destination] of contract.mutableDestinations.entries()) {
    if (!safeRelativePublicationPath(destination)) {
      issue(issues, "history-unsafe-mutable-destination", `${commit}:MUTABLE_HUB_DESTINATIONS[${index}]`, destination);
    }
    if (immutableLookingDestination(destination)) {
      issue(issues, "history-versioned-mutable-destination", `${commit}:${destination}`, "versioned route was classified mutable");
    }
    if (mutable.has(destination)) {
      issue(issues, "history-duplicate-mutable-classification", `${commit}:${destination}`, "mutable classification is duplicated");
    }
    mutable.add(destination);
    if (!stagedByDestination.has(destination)) {
      issue(issues, "history-unused-mutable-classification", `${commit}:${destination}`, "mutable classification has no staged asset");
    }
    if (immutableByDestination.has(destination)) {
      issue(issues, "history-conflicting-stability", `${commit}:${destination}`, "destination is both mutable and immutable");
    }
  }
  for (const asset of contract.stagedAssets) {
    if (!mutable.has(asset.destination) && !immutableByDestination.has(asset.destination)) {
      issue(issues, "history-unclassified-staged-asset", `${commit}:${asset.destination}`, "staged asset has no stability class");
    }
  }

  for (const entry of ledger.entries) {
    const staged = stagedByDestination.get(entry.destination);
    if (!staged) continue;
    if (staged.source !== entry.source) {
      issue(issues, "history-staged-source-mismatch", `${commit}:${entry.id}`, `${entry.destination} stages ${staged.source}`);
      continue;
    }
    const bytes = gitBlob(root, commit, entry.source);
    if (!bytes) {
      issue(issues, "history-source-unreadable", `${commit}:${entry.id}`, `${entry.source} is not a regular Git blob`);
    } else if (digest(bytes) !== entry.sha256) {
      issue(issues, "history-sha256-mismatch", `${commit}:${entry.id}`, `${entry.source} does not match its ledger hash`);
    }
  }

  const previousIds = new Set(previous?.entries.map((entry) => entry.id) ?? []);
  for (const entry of ledger.entries.filter((candidate) => !previousIds.has(candidate.id))) {
    const staged = stagedByDestination.get(entry.destination);
    if (!staged) {
      issue(issues, "history-new-entry-unstaged", `${commit}:${entry.id}`, "new immutable entry was not staged at introduction");
    } else if (staged.source !== entry.source) {
      issue(issues, "history-new-entry-source-mismatch", `${commit}:${entry.id}`, "new immutable entry used another staged source");
    }
  }
  return issues;
}

function verifyBootstrapAnchors(
  ledger: ImmutablePublicationLedger,
  root: string,
  trust: BootstrapTrust,
  comparisonCommit: string,
): ImmutablePublicationIssue[] {
  const issues: ImmutablePublicationIssue[] = [];
  const bootstrapIds = new Set(trust.ids);
  for (const entry of ledger.entries) {
    if (!bootstrapIds.has(entry.id)) {
      issue(issues, "bootstrap-unexpected-entry", entry.id, "the first ledger commit must contain exactly the reviewed bootstrap tuples");
      continue;
    }
    const entryAnchor = trust.entryAnchors[entry.id];
    if (!entryAnchor || !COMMIT_SHA.test(entryAnchor) || !gitBlob(root, entryAnchor, "bin/stage-hub.ts")) {
      issue(issues, "bootstrap-anchor-missing", entry.id, "reviewed source-history anchor is missing or invalid");
      continue;
    }
    if (git(root, ["merge-base", "--is-ancestor", entryAnchor, comparisonCommit]).status !== 0) {
      issue(issues, "bootstrap-anchor-not-ancestor", entry.id, `${entryAnchor} is not an ancestor of ${comparisonCommit}`);
      continue;
    }
    let anchorAssets: StagedAssetMapping[];
    try {
      anchorAssets = parseHistoricalAssetsOnly(
        gitBlob(root, entryAnchor, "bin/stage-hub.ts")!,
        `${entryAnchor}:bin/stage-hub.ts`,
      );
    } catch (error) {
      issue(issues, "bootstrap-stage-invalid", entry.id, error instanceof Error ? error.message : "anchor staging contract is invalid");
      continue;
    }
    const anchored = anchorAssets.find((asset) => asset.destination === entry.destination);
    if (!anchored || anchored.source !== entry.source) {
      issue(issues, "bootstrap-mapping-missing", entry.id, "initial source-to-destination tuple is absent from its reviewed source-history anchor");
      continue;
    }
    const source = gitBlob(root, entryAnchor, entry.source);
    if (!source) {
      issue(issues, "bootstrap-source-missing", entry.id, `${entry.source} is absent or not a regular blob at ${entryAnchor}`);
    } else if (digest(source) !== entry.sha256) {
      issue(issues, "bootstrap-sha256-mismatch", entry.id, `anchored source does not match the ledger SHA-256`);
    }
  }
  return issues;
}

/** Audit every release tree on HEAD's first-parent chain back to the fixed bootstrap. */
export function verifyImmutablePublicationHistory(
  current: ImmutablePublicationLedger,
  root = ROOT,
  bootstrapTrust: BootstrapTrust = DEFAULT_BOOTSTRAP_TRUST,
): ImmutablePublicationIssue[] {
  const issues: ImmutablePublicationIssue[] = [];
  const firstParentText = gitText(root, ["rev-list", "--first-parent", "HEAD"]);
  if (!firstParentText) {
    issue(issues, "history-unreadable", "HEAD", "Git first-parent history is unavailable");
    return issues;
  }
  const newestFirst = firstParentText.split(/\r?\n/).filter(Boolean);
  const baselineIndex = newestFirst.indexOf(bootstrapTrust.baselineCommit);
  if (baselineIndex < 0) {
    issue(issues, "baseline-not-first-parent", "$.baseline_commit", `${bootstrapTrust.baselineCommit} is not on HEAD's first-parent chain`);
    return issues;
  }
  const commits = newestFirst.slice(0, baselineIndex).reverse();
  let previous: ImmutablePublicationLedger | null = null;
  let ledgerSeen = false;
  for (const commit of commits) {
    const bytes = gitBlob(root, commit, IMMUTABLE_PUBLICATIONS_LEDGER_PATH);
    if (!bytes) {
      if (ledgerSeen) issue(issues, "history-ledger-disappeared", commit, "ledger vanished after its first committed appearance");
      continue;
    }
    const parsed = parseImmutablePublicationLedger(
      bytes,
      `${commit}:${IMMUTABLE_PUBLICATIONS_LEDGER_PATH}`,
      bootstrapTrust.baselineCommit,
    );
    if (!parsed.ledger) {
      issues.push(...parsed.issues.map((entry) => ({ ...entry, path: `${commit}:${entry.path}` })));
      ledgerSeen = true;
      continue;
    }
    const ledger = parsed.ledger;
    if (!ledgerSeen) {
      issues.push(...verifyBootstrapIdentity(ledger, bootstrapTrust));
      const bootstrapIds = new Set(bootstrapTrust.ids);
      for (const entry of ledger.entries) {
        if (!bootstrapIds.has(entry.id)) {
          issue(issues, "bootstrap-unexpected-entry", `${commit}:${entry.id}`, "first ledger tree contains a non-bootstrap tuple");
        }
      }
      if (ledger.entries.length !== bootstrapTrust.ids.length) {
        issue(issues, "bootstrap-entry-count", commit, `first ledger tree must contain exactly ${bootstrapTrust.ids.length} tuples`);
      }
      issues.push(...verifyBootstrapAnchors(ledger, root, bootstrapTrust, bootstrapTrust.baselineCommit)
        .map((entry) => ({ ...entry, path: `${commit}:${entry.path}` })));
    } else if (previous) {
      issues.push(...compareImmutablePublicationLedgers(ledger, previous, bootstrapTrust)
        .map((entry) => ({ ...entry, path: `${commit}:${entry.path}` })));
    }
    issues.push(...historicalSnapshotIssues(root, commit, ledger, previous));
    previous = ledger;
    ledgerSeen = true;
  }
  if (!ledgerSeen || !previous) {
    issue(issues, "history-ledger-missing", "HEAD", "no ledger exists after the fixed bootstrap baseline");
    return issues;
  }
  if (JSON.stringify(previous) !== JSON.stringify(current)) {
    issue(issues, "head-ledger-mismatch", "HEAD", "working-tree ledger differs from the committed HEAD ledger");
  }
  return issues;
}

export function verifyImmutablePublicationsAgainstBase(
  current: ImmutablePublicationLedger,
  baseSha: string,
  root = ROOT,
  stagedAssets?: readonly StagedAssetMapping[],
  bootstrapTrust: BootstrapTrust = DEFAULT_BOOTSTRAP_TRUST,
): ImmutablePublicationIssue[] {
  const issues: ImmutablePublicationIssue[] = [...verifyBootstrapIdentity(current, bootstrapTrust)];
  if (issues.length > 0) return issues;
  if (!COMMIT_SHA.test(baseSha)) {
    issue(issues, "invalid-base", "--base", "base must be one lowercase 40-character commit SHA");
    return issues;
  }
  if (git(root, ["cat-file", "-e", `${baseSha}^{commit}`]).status !== 0) {
    issue(issues, "unknown-base", "--base", `Git cannot resolve base commit ${baseSha}`);
    return issues;
  }
  if (git(root, ["merge-base", "--is-ancestor", baseSha, "HEAD"]).status !== 0) {
    issue(issues, "unrelated-base", "--base", `${baseSha} is not an ancestor of HEAD`);
    return issues;
  }
  const headResult = git(root, ["rev-parse", "HEAD"]);
  const headSha = headResult.status === 0
    ? new TextDecoder().decode(headResult.stdout as Buffer).trim()
    : "";
  if (baseSha === headSha) {
    issue(issues, "self-base", "--base", "comparison base must be an ancestor before HEAD, not HEAD itself");
    return issues;
  }

  const anchor = bootstrapTrust.baselineCommit;
  if (git(root, ["cat-file", "-e", `${anchor}^{commit}`]).status !== 0) {
    issue(issues, "unknown-baseline", "$.baseline_commit", `Git cannot resolve baseline commit ${anchor}`);
    return issues;
  }
  if (git(root, ["merge-base", "--is-ancestor", anchor, baseSha]).status !== 0) {
    issue(issues, "baseline-not-ancestor", "$.baseline_commit", `${anchor} is not an ancestor of comparison base ${baseSha}`);
    return issues;
  }

  const stagedByDestination = new Map(stagedAssets?.map((asset) => [asset.destination, asset]) ?? []);
  const requireNewEntriesStaged = (entries: readonly ImmutablePublicationEntry[]): void => {
    if (!stagedAssets) return;
    for (const entry of entries) {
      const staged = stagedByDestination.get(entry.destination);
      if (!staged) {
        issue(issues, "new-entry-unstaged", entry.id, "a newly committed route entry must be in the current staging contract");
      } else if (staged.source !== entry.source) {
        issue(issues, "new-entry-source-mismatch", entry.id, `${entry.destination} stages ${staged.source}, not ${entry.source}`);
      }
    }
  };

  const shown = git(root, ["show", `${baseSha}:${IMMUTABLE_PUBLICATIONS_LEDGER_PATH}`]);
  if (shown.status !== 0) {
    issues.push(...verifyBootstrapAnchors(current, root, bootstrapTrust, baseSha));
    return issues;
  }
  const parsed = parseImmutablePublicationLedger(
    shown.stdout as Buffer,
    `${baseSha}:${IMMUTABLE_PUBLICATIONS_LEDGER_PATH}`,
    bootstrapTrust.baselineCommit,
  );
  if (!parsed.ledger) return parsed.issues;
  issues.push(...compareImmutablePublicationLedgers(current, parsed.ledger, bootstrapTrust));
  const baseIds = new Set(parsed.ledger.entries.map((entry) => entry.id));
  requireNewEntriesStaged(current.entries.filter((entry) => !baseIds.has(entry.id)));
  return issues;
}

export function formatImmutablePublicationIssues(issues: readonly ImmutablePublicationIssue[]): string {
  return issues.map((entry) => `${entry.code} ${entry.path}: ${entry.message}`).join("\n");
}

function usage(): string {
  return [
    "Usage: bun bin/immutable-publications.ts [--base <40-character-sha>] [--json]",
    "",
    "Verifies the repository-local immutable publication ledger without network access or writes.",
    "--base additionally refuses mutation/removal of entries committed by that Git ancestor.",
  ].join("\n");
}

async function main(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return;
  }
  let base: string | undefined;
  let json = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
    if (arg === "--json") json = true;
    else if (arg === "--base" && index + 1 < args.length) base = args[++index];
    else throw new Error(usage());
  }

  // Dynamic import avoids a module cycle when stage-hub calls this verifier.
  const { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } = await import("./stage-hub.ts");
  const snapshot = verifyImmutablePublicationSnapshot({
    root: ROOT,
    stagedAssets: HUB_ASSETS,
    mutableDestinations: MUTABLE_HUB_DESTINATIONS,
  });
  const issues = [...snapshot.issues];
  if (base && snapshot.ledger) {
    issues.push(...verifyImmutablePublicationsAgainstBase(snapshot.ledger, base, ROOT, HUB_ASSETS));
    issues.push(...verifyImmutablePublicationHistory(snapshot.ledger, ROOT));
  }
  const result = {
    ok: issues.length === 0,
    protocol: snapshot.ledger?.protocol ?? null,
    entries: snapshot.ledger?.entries.length ?? 0,
    base: base ?? null,
    issues,
  };
  if (json) console.log(JSON.stringify(result));
  else if (issues.length === 0) {
    console.log(`immutable-publications: verified ${result.entries} entries${base ? ` against ${base}` : ""}`);
  } else {
    console.error(`immutable-publications: verification failed\n${formatImmutablePublicationIssues(issues)}`);
  }
  if (issues.length > 0) process.exitCode = 1;
}

if (import.meta.main) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`immutable-publications: ${error instanceof Error ? error.message : "unknown error"}`);
    process.exitCode = 2;
  });
}
