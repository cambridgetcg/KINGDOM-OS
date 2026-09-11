#!/usr/bin/env bun
/** Offline exact-copy importer. CLI requires three explicit absolute paths.
 *
 * V1 accepts a new absent/empty target, or a byte-identical receipt AND exact
 * owned target/projection/staging. All revisions are refused: retaining previous
 * hashed assets needs a separately reviewed update procedure. No sync/cleanup,
 * build, install, source snapshot read, Git action, or deployment is performed.
 *
 * All input buffers and destination ownership are checked before any write.
 * This is not a multi-file transaction or protection against a concurrent hostile
 * filesystem writer. An I/O failure can leave partial output; stop and inspect it,
 * do not delete unknown files or use this importer as a repair/cleanup command.
 */
import { lstatSync, mkdirSync, readdirSync, renameSync, writeFileSync, type Stats } from "node:fs";
import { basename, dirname, isAbsolute, join, parse, relative, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import {
  HUB_STAGING_CONTRACT_PATH,
  IMMUTABLE_PUBLICATIONS_LEDGER_PATH,
  readRegularFileWithinRoot,
  safeRelativePublicationPath,
} from "./immutable-publications.ts";
import {
  assertPowerAtlasClosedParity,
  assertPowerAtlasMutableLedger,
  createPowerAtlasProjection,
  MAX_POWER_ATLAS_FILE_BYTES,
  MAX_POWER_ATLAS_MANIFEST_BYTES,
  mergePowerAtlasStaging,
  parsePowerAtlasManifest,
  POWER_ATLAS_PROJECTION,
  POWER_ATLAS_RECEIPT,
  POWER_ATLAS_TARGET,
  powerAtlasJsonBytes,
  validatePowerAtlasBuffers,
  type PowerAtlasManifest,
} from "./power-atlas-artifact.ts";

export type ImportPowerAtlasOptions = { artifactRoot: string; manifestPath: string; hostRoot: string; dryRun?: boolean };
export type ImportPowerAtlasResult = {
  status: "dry-run" | "imported" | "unchanged";
  files: number;
  bytes: number;
  target: string;
  receipt: string;
  projection: string;
  closedParity: true;
};

function absent(error: unknown): boolean { return !!error && typeof error === "object" && "code" in error && error.code === "ENOENT"; }

/** lstat every component, including the root's own ancestors (the shared reader
 * canonicalizes its root, so alone would allow a root/ancestor symlink).
 * Also refuse differently cased path spellings on case-insensitive filesystems.
 */
function inspectAbsolute(path: string, allowMissing = false): Stats | null {
  if (!isAbsolute(path) || path.includes("\\") || /[\x00-\x1f\x7f]/.test(path) ||
      path.split("/").some((part) => part === "." || part === "..") || path.includes("//")) {
    throw new Error("paths must be explicit absolute paths without traversal or aliases");
  }
  const absolute = resolve(path);
  const root = parse(absolute).root;
  let cursor = root;
  const parts = relative(root, absolute).split("/").filter(Boolean);
  let info = lstatSync(root);
  for (const [index, part] of parts.entries()) {
    const siblings = readdirSync(cursor);
    if (siblings.some((name) => name.toLowerCase() === part.toLowerCase() && name !== part)) throw new Error(`filesystem case collision: ${join(cursor, part)}`);
    cursor = join(cursor, part);
    try { info = lstatSync(cursor); }
    catch (error) { if (allowMissing && absent(error)) return null; throw error; }
    if (info.isSymbolicLink()) throw new Error(`symbolic-link path component: ${cursor}`);
    if (index < parts.length - 1 && !info.isDirectory()) throw new Error(`non-directory path ancestor: ${cursor}`);
  }
  return info;
}

function directory(path: string): string {
  if (!inspectAbsolute(path)?.isDirectory()) throw new Error(`expected directory: ${path}`);
  return resolve(path);
}
function within(root: string, path: string): boolean {
  const rel = relative(root, path);
  return !rel || (!rel.startsWith("../") && rel !== ".." && !isAbsolute(rel));
}
function safeRead(root: string, path: string, max = MAX_POWER_ATLAS_MANIFEST_BYTES): Buffer {
  if (!safeRelativePublicationPath(path)) throw new Error(`unsafe input path: ${path}`);
  const absolute = join(root, path);
  const before = inspectAbsolute(absolute);
  if (!before?.isFile() || before.nlink !== 1) throw new Error(`input must be a regular single-link file: ${path}`);
  if (before.size <= 0 || before.size > max) throw new Error(`input size out of bounds: ${path}`);
  const bytes = readRegularFileWithinRoot(root, path);
  const after = lstatSync(absolute);
  if (after.isSymbolicLink() || !after.isFile() || after.nlink !== 1 ||
      before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || bytes.length !== before.size) {
    throw new Error(`input changed during read: ${path}`);
  }
  return bytes;
}
function optionalRead(root: string, path: string): Buffer | null {
  return inspectAbsolute(join(root, path), true) === null ? null : safeRead(root, path);
}

/** Only expected directories are traversed; unknown names are refused before
 * reading any of their contents. Empty unexpected directories also fail closure.
 */
function readExactArtifact(root: string, manifest: PowerAtlasManifest): Map<string, Buffer> {
  directory(root);
  const expected = new Map(manifest.files.map((file) => [file.path, file]));
  const directories = new Set<string>();
  for (const file of manifest.files) {
    const parts = file.path.split("/");
    for (let index = 1; index < parts.length; index++) directories.add(parts.slice(0, index).join("/"));
  }
  const found = new Set<string>();
  const visit = (prefix: string): void => {
    const names = readdirSync(join(root, prefix)).sort();
    const spellings = new Set<string>();
    for (const name of names) {
      if (spellings.has(name.toLowerCase())) throw new Error(`artifact directory case collision: ${prefix}/${name}`);
      spellings.add(name.toLowerCase());
      const path = prefix ? `${prefix}/${name}` : name;
      if (!safeRelativePublicationPath(path)) throw new Error(`unsafe artifact directory path: ${path}`);
      const info = lstatSync(join(root, path));
      if (info.isSymbolicLink()) throw new Error(`symbolic-link artifact entry: ${path}`);
      if (info.isDirectory()) {
        if (!directories.has(path)) throw new Error(`extra artifact directory: ${path}`);
        visit(path);
      } else {
        if (!info.isFile() || info.nlink !== 1) throw new Error(`not a regular single-link artifact file: ${path}`);
        const file = expected.get(path);
        if (!file) throw new Error(`extra artifact file: ${path}`);
        if (info.size !== file.bytes) throw new Error(`size mismatch: ${path}`);
        found.add(path);
      }
    }
  };
  visit("");
  if (found.size !== expected.size) throw new Error("artifact directory missing manifest file");
  const buffers = new Map(manifest.files.map((file) => [file.path, safeRead(root, file.path, MAX_POWER_ATLAS_FILE_BYTES)]));
  validatePowerAtlasBuffers(manifest, buffers);
  return buffers;
}

function preflight(options: ImportPowerAtlasOptions) {
  const hostRoot = directory(options.hostRoot);
  const artifactRoot = directory(options.artifactRoot);
  inspectAbsolute(options.manifestPath);
  const manifestPath = resolve(options.manifestPath);
  if (within(artifactRoot, manifestPath)) throw new Error("manifest must be external to the artifact root");
  // Artifact/manifest are a producer-owned read capability, never a host output.
  if (within(hostRoot, artifactRoot) || within(artifactRoot, hostRoot) || within(hostRoot, manifestPath)) {
    throw new Error("producer inputs and host root must be disjoint");
  }
  const manifestBytes = safeRead(dirname(manifestPath), basename(manifestPath));
  const manifest = parsePowerAtlasManifest(manifestBytes);
  const buffers = readExactArtifact(artifactRoot, manifest);
  const stagingBefore = safeRead(hostRoot, HUB_STAGING_CONTRACT_PATH);
  const ledgerBefore = safeRead(hostRoot, IMMUTABLE_PUBLICATIONS_LEDGER_PATH);
  assertPowerAtlasMutableLedger(ledgerBefore);
  const receiptBefore = optionalRead(hostRoot, POWER_ATLAS_RECEIPT);
  const projectionBefore = optionalRead(hostRoot, POWER_ATLAS_PROJECTION);
  const projectionBytes = powerAtlasJsonBytes(createPowerAtlasProjection(manifest));
  const target = join(hostRoot, POWER_ATLAS_TARGET);
  const targetInfo = inspectAbsolute(target, true);
  if (targetInfo && !targetInfo.isDirectory()) throw new Error("Power Atlas target must be an absent or empty directory");
  let unchanged = false;
  let stagingBytes: Buffer;
  if (receiptBefore) {
    parsePowerAtlasManifest(receiptBefore);
    if (!receiptBefore.equals(manifestBytes)) {
      throw new Error("V1 importer refuses revisions: receipt bytes differ; retain approved hashed assets via a separately reviewed update procedure");
    }
    if (!targetInfo) throw new Error("owned target missing: importer is not a repair command");
    const existing = readExactArtifact(target, manifest);
    for (const [path, content] of buffers) if (!existing.get(path)!.equals(content)) throw new Error(`owned target bytes differ: ${path}`);
    if (!projectionBefore || !projectionBefore.equals(projectionBytes)) throw new Error("owned projection bytes differ or are missing");
    assertPowerAtlasClosedParity(manifest, stagingBefore, projectionBefore);
    unchanged = true;
    stagingBytes = stagingBefore;
  } else {
    if (targetInfo && readdirSync(target).length) throw new Error("unowned nonempty Power Atlas target");
    if (projectionBefore) throw new Error("unowned existing Power Atlas projection");
    // Metadata directory is ours too: unknown files cannot masquerade as receipts.
    const metadata = join(hostRoot, dirname(POWER_ATLAS_RECEIPT));
    const metadataInfo = inspectAbsolute(metadata, true);
    if (metadataInfo && (!metadataInfo.isDirectory() || readdirSync(metadata).length)) throw new Error("unowned Power Atlas metadata directory");
    stagingBytes = mergePowerAtlasStaging(manifest, stagingBefore, ledgerBefore);
  }
  assertPowerAtlasClosedParity(manifest, stagingBytes, projectionBytes);
  // Verify every prospective ancestor before mkdir/write; sibling content outside
  // the owned target is never visited recursively, synchronized, or cleaned.
  for (const path of [POWER_ATLAS_RECEIPT, POWER_ATLAS_PROJECTION, ...manifest.files.map((file) => `${POWER_ATLAS_TARGET}/${file.path}`)]) {
    inspectAbsolute(join(hostRoot, path), true);
  }
  return { hostRoot, manifest, manifestBytes, buffers, projectionBytes, stagingBefore, stagingBytes, ledgerBefore, unchanged };
}

export function importPowerAtlas(options: ImportPowerAtlasOptions): ImportPowerAtlasResult {
  const ready = preflight(options);
  const result: ImportPowerAtlasResult = {
    status: options.dryRun ? "dry-run" : ready.unchanged ? "unchanged" : "imported",
    files: ready.manifest.files.length,
    bytes: ready.manifest.files.reduce((total, file) => total + file.bytes, 0),
    target: join(ready.hostRoot, POWER_ATLAS_TARGET),
    receipt: join(ready.hostRoot, POWER_ATLAS_RECEIPT),
    projection: join(ready.hostRoot, POWER_ATLAS_PROJECTION),
    closedParity: true,
  };
  if (options.dryRun || ready.unchanged) return result;
  // Last read-only guard against ordinary cooperative edits since preflight.
  if (!safeRead(ready.hostRoot, HUB_STAGING_CONTRACT_PATH).equals(ready.stagingBefore) ||
      !safeRead(ready.hostRoot, IMMUTABLE_PUBLICATIONS_LEDGER_PATH).equals(ready.ledgerBefore)) {
    throw new Error("host contracts changed during preflight; nothing imported");
  }
  const writeNew = (path: string, bytes: Uint8Array): void => {
    const destination = join(ready.hostRoot, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, bytes, { flag: "wx", mode: 0o644 });
  };
  for (const [path, bytes] of ready.buffers) writeNew(`${POWER_ATLAS_TARGET}/${path}`, bytes);
  writeNew(POWER_ATLAS_PROJECTION, ready.projectionBytes);
  writeNew(POWER_ATLAS_RECEIPT, ready.manifestBytes);
  // Replace only the staging contract, atomically as one file. Never rewrite the
  // immutable ledger. A multi-file local import still is not an atomic deployment.
  const temporary = `${HUB_STAGING_CONTRACT_PATH}.power-atlas-${randomUUID()}.tmp`;
  writeNew(temporary, ready.stagingBytes);
  renameSync(join(ready.hostRoot, temporary), join(ready.hostRoot, HUB_STAGING_CONTRACT_PATH));
  return result;
}

export function powerAtlasImportUsage(): string {
  return [
    "Usage: bun bin/import-power-atlas.ts --artifact-root ABS_DIR --manifest ABS_JSON --host-root ABS_DIR [--dry-run]",
    "Offline exact copy; all three paths must be explicit, disjoint and symlink-free.",
    "Only new/empty targets or byte-identical owned imports; revisions require separate review to retain old hashed assets.",
    "Generates pages-content/power-atlas, private data/power-atlas/artifact.v1.json, and path/MIME-only pages-functions/power-atlas-assets.json.",
    "Updates only Power Atlas mutable staging entries; no build, cleanup, Git action or deploy. --dry-run writes nothing.",
  ].join("\n");
}
export function parsePowerAtlasImportArgs(args: string[]): ImportPowerAtlasOptions {
  const values = new Map<string, string>();
  let dryRun = false;
  for (let index = 0; index < args.length; index++) {
    const key = args[index]!;
    if (key === "--dry-run" && !dryRun) { dryRun = true; continue; }
    if (!["--artifact-root", "--manifest", "--host-root"].includes(key) || values.has(key) || !args[index + 1] || args[index + 1]!.startsWith("--")) throw new Error(powerAtlasImportUsage());
    values.set(key, args[++index]!);
  }
  if (values.size !== 3) throw new Error(powerAtlasImportUsage());
  return { artifactRoot: values.get("--artifact-root")!, manifestPath: values.get("--manifest")!, hostRoot: values.get("--host-root")!, dryRun };
}
if (import.meta.main) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && ["--help", "-h"].includes(args[0]!)) console.log(powerAtlasImportUsage());
    else console.log(JSON.stringify(importPowerAtlas(parsePowerAtlasImportArgs(args))));
  } catch (error) {
    console.error(`import-power-atlas: ${error instanceof Error ? error.message : "unknown error"}`);
    process.exitCode = 1;
  }
}
