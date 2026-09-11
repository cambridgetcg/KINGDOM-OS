/** Pure Power Atlas artifact boundary; no filesystem, network, build, or writes.
 * Digests bind supplied bytes, not source authorship or independent research truth.
 * sourceDigest/lockfileSha256 are producer receipts; the importer does not rebuild
 * or read the producer's source snapshot. Worker code must use only the projection.
 */
import { createHash } from "node:crypto";
import { parseStrictJsonBytes } from "./principality.ts";
import {
  HUB_STAGING_PROTOCOL,
  parseHubStagingContract,
  parseImmutablePublicationLedger,
  safeRelativePublicationPath,
  type HistoricalStagingContract,
} from "./immutable-publications.ts";

export const POWER_ATLAS_FORMAT = "power-atlas-artifact/1";
export const POWER_ATLAS_BASE = "/power-atlas/";
export const POWER_ATLAS_TARGET = "pages-content/power-atlas";
export const POWER_ATLAS_RECEIPT = "data/power-atlas/artifact.v1.json";
export const POWER_ATLAS_PROJECTION = "pages-functions/power-atlas-assets.json";
export const POWER_ATLAS_RELEASE_SHA256 = "9ce11b9d27d8e42ddba25dfbdc7859d715b7d52a6a5a9781a0ed306771f70aea";
export const MAX_POWER_ATLAS_MANIFEST_BYTES = 1024 * 1024;
export const MAX_POWER_ATLAS_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_POWER_ATLAS_TOTAL_BYTES = 128 * 1024 * 1024;
export const MAX_POWER_ATLAS_FILES = 512;

export type PowerAtlasFile = { path: string; sha256: string; bytes: number; mediaType: string };
export type PowerAtlasManifest = {
  format: typeof POWER_ATLAS_FORMAT;
  base: typeof POWER_ATLAS_BASE;
  sourceDigest: string;
  releaseSha256: string;
  lockfileSha256: string;
  toolchain: { node: string; npm: string; vite: string };
  buildCommand: string;
  release: { stage: "v1"; snapshotDate: "2025-12-31"; researchCutoff: string; compiledAt: string };
  files: PowerAtlasFile[];
};
export type PowerAtlasProjection = Array<{ path: string; mediaType: string }>;

export function powerAtlasSha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function keys(value: unknown, expected: string[], label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).sort().join("\0") !== [...expected].sort().join("\0")) {
    throw new Error(`${label}: missing or unknown fields`);
  }
}
function text(value: unknown, max = 256): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max && !/[\x00-\x1f\x7f]/.test(value);
}

/** No URL decoding/normalization: only literal artifact-relative POSIX names. */
export function powerAtlasMediaType(path: string): string {
  if (!safeRelativePublicationPath(path) || path.split("/").some((part) => part.startsWith("."))) {
    throw new Error(`unsafe artifact path: ${path}`);
  }
  if (path === "index.html") return "text/html; charset=utf-8";
  if (path === "favicon.svg") return "image/svg+xml";
  if (path === "THIRD-PARTY-NOTICES.md") return "text/markdown; charset=utf-8";
  if (/^licenses\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9][A-Za-z0-9._-]*\.(txt|md)$/.test(path)) {
    return path.endsWith(".md") ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8";
  }
  const match = path.match(/^assets\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_][A-Za-z0-9._-]*-[A-Za-z0-9_-]{8,64}\.(js|css|woff|woff2)$/);
  if (!match) throw new Error(`non-public or non-hashed artifact path: ${path}`);
  return ({ js: "text/javascript; charset=utf-8", css: "text/css; charset=utf-8", woff: "font/woff", woff2: "font/woff2" })[match[1]!]!;
}

/** Reject aliases even on case-sensitive hosts, including directory aliases. */
export function assertPowerAtlasPathSet(paths: readonly string[], label: string): void {
  const files = new Set<string>();
  const spelling = new Map<string, string>();
  const directories = new Set<string>();
  for (const path of paths) {
    if (!safeRelativePublicationPath(path)) throw new Error(`${label}: unsafe path ${path}`);
    const parts = path.split("/");
    for (let index = 1; index <= parts.length; index++) {
      const component = parts.slice(0, index).join("/");
      const folded = component.toLowerCase();
      const previous = spelling.get(folded);
      if (previous !== undefined && previous !== component) throw new Error(`${label}: case collision ${previous} <> ${component}`);
      spelling.set(folded, component);
      if (index < parts.length) directories.add(folded);
    }
    const folded = path.toLowerCase();
    if (files.has(folded)) throw new Error(`${label}: duplicate path ${path}`);
    files.add(folded);
  }
  for (const path of files) if (directories.has(path)) throw new Error(`${label}: file/ancestor collision ${path}`);
}

export function parsePowerAtlasManifest(bytes: Uint8Array): PowerAtlasManifest {
  if (!bytes.byteLength || bytes.byteLength > MAX_POWER_ATLAS_MANIFEST_BYTES) throw new Error("artifact manifest size out of bounds");
  const value = parseStrictJsonBytes(bytes, "Power Atlas manifest");
  keys(value, ["format", "base", "sourceDigest", "releaseSha256", "lockfileSha256", "toolchain", "buildCommand", "release", "files"], "manifest");
  if (value.format !== POWER_ATLAS_FORMAT || value.base !== POWER_ATLAS_BASE) throw new Error("artifact format/base mismatch");
  for (const key of ["sourceDigest", "releaseSha256", "lockfileSha256"]) {
    if (typeof value[key] !== "string" || !/^[a-f0-9]{64}$/.test(value[key])) throw new Error(`invalid ${key}`);
  }
  if (value.releaseSha256 !== POWER_ATLAS_RELEASE_SHA256) throw new Error("original V1 release SHA-256 changed");
  keys(value.toolchain, ["node", "npm", "vite"], "toolchain");
  for (const [name, version] of Object.entries(value.toolchain)) if (!text(version, 128)) throw new Error(`invalid toolchain.${name}`);
  if (!text(value.buildCommand, 1024)) throw new Error("invalid buildCommand (receipt only, never executed)");
  keys(value.release, ["stage", "snapshotDate", "researchCutoff", "compiledAt"], "release");
  if (value.release.stage !== "v1" || value.release.snapshotDate !== "2025-12-31" ||
      !text(value.release.researchCutoff, 128) || !text(value.release.compiledAt, 128)) throw new Error("invalid V1 release metadata");
  if (!Array.isArray(value.files) || !value.files.length || value.files.length > MAX_POWER_ATLAS_FILES) throw new Error("invalid artifact file count");
  let total = 0;
  const files = value.files.map((file, index): PowerAtlasFile => {
    keys(file, ["path", "sha256", "bytes", "mediaType"], `files[${index}]`);
    if (typeof file.path !== "string") throw new Error("invalid file path");
    if (powerAtlasMediaType(file.path) !== file.mediaType) throw new Error(`MIME mismatch: ${file.path}`);
    if (typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error(`invalid file SHA-256: ${file.path}`);
    if (typeof file.bytes !== "number" || !Number.isSafeInteger(file.bytes) || file.bytes <= 0 || file.bytes > MAX_POWER_ATLAS_FILE_BYTES) throw new Error(`invalid file size: ${file.path}`);
    total += file.bytes;
    return file as PowerAtlasFile;
  });
  if (total > MAX_POWER_ATLAS_TOTAL_BYTES) throw new Error("artifact total size exceeds bound");
  assertPowerAtlasPathSet(files.map((file) => file.path), "manifest");
  if (files.some((file, index) => index > 0 && files[index - 1]!.path >= file.path)) throw new Error("artifact files must be path-sorted");
  for (const required of ["index.html", "favicon.svg"]) if (!files.some((file) => file.path === required)) throw new Error(`missing ${required}`);
  for (const extension of ["js", "css"]) if (!files.some((file) => file.path.endsWith(`.${extension}`))) throw new Error(`missing hashed ${extension}`);
  return { ...value, files } as PowerAtlasManifest;
}

function decode(bytes: Uint8Array, path: string): string {
  let content: string;
  try { content = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw new Error(`invalid UTF-8: ${path}`); }
  if (content.includes("\0")) throw new Error(`NUL in text asset: ${path}`);
  return content;
}

// Full OFL 1.1 terms, PREAMBLE through final disclaimer. Hash only ASCII
// letters/digits so upstream line wrapping, quotation marks and rule lines do
// not change the comparison; removing even one sentence still fails. Copyright
// attribution is required separately and is not established by this fingerprint.
const OFL_TERMS_SHA256 = "34c1733fea6ab21201493ee83acdb34a204bd04657ac660f04a771a796b9bad7";
function completeOflTerms(content: string): boolean {
  const start = content.indexOf("PREAMBLE");
  const end = /OTHER\s+DEALINGS\s+IN\s+THE\s+FONT\s+SOFTWARE\./.exec(content);
  if (start < 0 || !end || end.index < start) return false;
  const terms = content.slice(start, end.index + end[0].length).toLowerCase().replace(/[^a-z0-9]/g, "");
  return powerAtlasSha256(Buffer.from(terms)) === OFL_TERMS_SHA256;
}

function validateLicenses(manifest: PowerAtlasManifest, buffers: ReadonlyMap<string, Uint8Array>): void {
  const notices = manifest.files.filter((file) => file.path.startsWith("licenses/") || file.path === "THIRD-PARTY-NOTICES.md")
    .map((file) => ({ path: file.path, text: decode(buffers.get(file.path)!, file.path) }));
  if (!notices.some((notice) => /third[- _]?party|dependencies/i.test(`${notice.path}\n${notice.text}`) &&
      /copyright/i.test(notice.text) && /permission|license/i.test(notice.text))) {
    throw new Error("license closure: readable third-party notices required");
  }
  // Terms completeness, not a legal/provenance verdict. Require each font's own
  // copyright and complete OFL body, rather than accepting headings alone.
  for (const family of [/(?:ibm[- _]?plex(?:[- _]?sans)?)/i, /fraunces/i]) {
    if (!notices.some((notice) => family.test(`${notice.path}\n${notice.text}`) &&
        /copyright[^\r\n]*\d{4}/i.test(notice.text) &&
        /SIL OPEN FONT LICENSE[\s\S]*Version 1\.1/i.test(notice.text) && completeOflTerms(notice.text))) {
      throw new Error(`license closure: complete copyright/OFL required for ${family.source}`);
    }
  }
}

/** Validate all supplied bytes before the importer is allowed to create output. */
export function validatePowerAtlasBuffers(manifest: PowerAtlasManifest, buffers: ReadonlyMap<string, Uint8Array>): void {
  const actual = [...buffers.keys()].sort();
  const expected = manifest.files.map((file) => file.path);
  assertPowerAtlasPathSet(actual, "artifact directory");
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("artifact directory must exactly match manifest files");
  for (const file of manifest.files) {
    const bytes = buffers.get(file.path)!;
    if (bytes.byteLength !== file.bytes) throw new Error(`size mismatch: ${file.path}`);
    if (powerAtlasSha256(bytes) !== file.sha256) throw new Error(`SHA-256 mismatch: ${file.path}`);
    if (file.mediaType.startsWith("font/")) {
      const signature = Buffer.from(bytes).subarray(0, 4).toString("ascii");
      if (signature !== (file.mediaType === "font/woff2" ? "wOF2" : "wOFF")) throw new Error(`font MIME signature mismatch: ${file.path}`);
    } else {
      const content = decode(bytes, file.path);
      if (file.path === "index.html" && (!/<html(?:\s|>)/i.test(content) || !/<\/html\s*>/i.test(content))) throw new Error("HTML MIME signature mismatch: index.html");
      if (file.path === "favicon.svg" && !/<svg(?:\s|>)/i.test(content)) throw new Error("SVG MIME signature mismatch: favicon.svg");
      if (/\.(js|css)$/.test(file.path) && /^\s*(?:<!doctype\s+html|<html(?:\s|>))/i.test(content)) throw new Error(`HTML masquerading as ${file.path}`);
    }
  }
  validateLicenses(manifest, buffers);
}

export function createPowerAtlasProjection(manifest: PowerAtlasManifest): PowerAtlasProjection {
  return manifest.files.map(({ path, mediaType }) => ({ path, mediaType }));
}
export function powerAtlasJsonBytes(value: unknown): Buffer {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function overlaps(path: string, root: string): boolean {
  const folded = path.toLowerCase();
  const parent = root.toLowerCase();
  return folded === parent || folded.startsWith(`${parent}/`) || parent.startsWith(`${folded}/`);
}
function ownsDestination(path: string): boolean { return overlaps(path, "power-atlas"); }
function touchesPrivateSource(path: string): boolean {
  return overlaps(path, "data/power-atlas") || overlaps(path, POWER_ATLAS_PROJECTION);
}

/** Check the three closed sets: receipt files = mutable staging = Worker projection. */
export function assertPowerAtlasClosedParity(manifest: PowerAtlasManifest, stagingBytes: Uint8Array, projectionBytes: Uint8Array): void {
  const staging = parseHubStagingContract(stagingBytes);
  assertPowerAtlasPathSet(staging.stagedAssets.map(({ source }) => source), "staging sources");
  assertPowerAtlasPathSet(staging.stagedAssets.map(({ destination }) => destination), "staging destinations");
  const expected = manifest.files.map(({ path }) => ({ source: `${POWER_ATLAS_TARGET}/${path}`, destination: `power-atlas/${path}` }));
  const owned = staging.stagedAssets.filter((asset) => ownsDestination(asset.destination) || overlaps(asset.source, POWER_ATLAS_TARGET));
  if (JSON.stringify([...owned].sort((a, b) => a.destination < b.destination ? -1 : a.destination > b.destination ? 1 : 0)) !== JSON.stringify(expected)) {
    throw new Error("Power Atlas staging/receipt closed parity mismatch");
  }
  const mutable = staging.mutableDestinations.filter(ownsDestination).sort();
  if (JSON.stringify(mutable) !== JSON.stringify(expected.map(({ destination }) => destination))) throw new Error("Power Atlas family must be exactly mutable");
  if (staging.stagedAssets.some(({ source, destination }) => touchesPrivateSource(source) || touchesPrivateSource(destination))) {
    throw new Error("private receipt/projection must not be staged");
  }
  const projection = parseStrictJsonBytes(projectionBytes, "Power Atlas public projection");
  if (!Array.isArray(projection) || projection.length !== manifest.files.length) throw new Error("projection/receipt closed parity mismatch");
  projection.forEach((item, index) => {
    keys(item, ["path", "mediaType"], `projection[${index}]`);
    if (item.path !== manifest.files[index]!.path || item.mediaType !== manifest.files[index]!.mediaType) throw new Error("projection/receipt closed parity mismatch");
  });
}

/** The app family is mutable, never a replacement for an immutable publication. */
export function assertPowerAtlasMutableLedger(ledgerBytes: Uint8Array): void {
  const parsed = parseImmutablePublicationLedger(ledgerBytes);
  if (!parsed.ledger || parsed.issues.length) throw new Error("immutable ledger invalid");
  for (const entry of parsed.ledger.entries) {
    if (ownsDestination(entry.destination) || overlaps(entry.source, POWER_ATLAS_TARGET) || touchesPrivateSource(entry.source)) {
      throw new Error("Power Atlas cannot replace an immutable ledger entry");
    }
  }
}

/** Initial-import merge only. Existing owned mappings need an exact receipt first;
 * revisions are refused by the importer, never silently deleting old chunks.
 * Other entries and their order survive, and the immutable ledger is read-only.
 */
export function mergePowerAtlasStaging(manifest: PowerAtlasManifest, stagingBytes: Uint8Array, ledgerBytes: Uint8Array): Buffer {
  const staging: HistoricalStagingContract = parseHubStagingContract(stagingBytes);
  assertPowerAtlasPathSet(staging.stagedAssets.map(({ source }) => source), "staging sources");
  assertPowerAtlasPathSet(staging.stagedAssets.map(({ destination }) => destination), "staging destinations");
  assertPowerAtlasMutableLedger(ledgerBytes);
  if (staging.stagedAssets.some(({ source, destination }) => ownsDestination(destination) || overlaps(source, POWER_ATLAS_TARGET)) ||
      staging.mutableDestinations.some(ownsDestination)) throw new Error("unowned existing Power Atlas staging entry");
  if (staging.stagedAssets.some(({ source, destination }) => touchesPrivateSource(source) || touchesPrivateSource(destination))) throw new Error("private receipt/projection must not be staged");
  const additions = manifest.files.map(({ path }) => ({ source: `${POWER_ATLAS_TARGET}/${path}`, destination: `power-atlas/${path}` }));
  const result = powerAtlasJsonBytes({
    protocol: HUB_STAGING_PROTOCOL,
    assets: [...staging.stagedAssets, ...additions],
    mutable_destinations: [...staging.mutableDestinations, ...additions.map(({ destination }) => destination)],
  });
  // Reuse the host contract, including its capacity limit; never bypass its gate.
  parseHubStagingContract(result);
  assertPowerAtlasClosedParity(manifest, result, powerAtlasJsonBytes(createPowerAtlasProjection(manifest)));
  return result;
}
