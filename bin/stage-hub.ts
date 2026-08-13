/** stage-hub.ts — assemble the exact Cloudflare Pages upload directory.
 *
 * The source files are all read before the output directory is touched. The
 * destination must already exist and be completely empty; its canonical path
 * is used, and existing content is never overwritten or deleted. This stages
 * files only—it does not deploy them.
 *
 * Run: bun bin/stage-hub.ts <existing-empty-output-dir>
 */

import { lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatImmutablePublicationIssues,
  HUB_STAGING_CONTRACT_PATH,
  parseHubStagingContract,
  readRegularFileWithinRoot,
  verifyImmutablePublicationSnapshot,
} from "./immutable-publications.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// This strict JSON file is the single staging state description. The engine,
// snapshot verifier, and historical audit all consume the same bytes.
function loadStagingContract(sourceRoot: string) {
  try {
    return parseHubStagingContract(
      readRegularFileWithinRoot(sourceRoot, HUB_STAGING_CONTRACT_PATH),
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    throw new Error(`hub staging contract is missing or invalid: ${detail}`);
  }
}

const STAGING_CONTRACT = loadStagingContract(ROOT);
export const HUB_ASSETS = Object.freeze(
  STAGING_CONTRACT.stagedAssets.map((asset) => Object.freeze(asset)),
);
export const MUTABLE_HUB_DESTINATIONS = Object.freeze(
  [...STAGING_CONTRACT.mutableDestinations],
);

export type StagedHubAsset = {
  source: string;
  destination: string;
  bytes: number;
};

function codeOf(error: unknown): string | undefined {
  return !!error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
}

function readSources(
  sourceRoot: string,
  assets: readonly Readonly<{ source: string; destination: string }>[],
): Array<{ asset: Readonly<{ source: string; destination: string }>; content: Buffer }> {
  return assets.map((asset) => {
    try {
      return { asset, content: readRegularFileWithinRoot(sourceRoot, asset.source) };
    } catch {
      throw new Error(`required hub asset is missing or unreadable: ${asset.source}`);
    }
  });
}

function canonicalEmptyOutput(output: string): string {
  try {
    const info = lstatSync(output);
    if (info.isSymbolicLink()) throw new Error(`output directory must not be a symbolic link: ${output}`);
    if (!info.isDirectory()) throw new Error(`output path is not a directory: ${output}`);
    if (readdirSync(output).length !== 0) throw new Error(`output directory is not empty: ${output}`);
    return realpathSync(output);
  } catch (error) {
    if (codeOf(error) === "ENOENT") {
      throw new Error(`output directory must already exist and be empty: ${output}`);
    }
    throw error;
  }
}

export function stageHub(outputDirectory: string, sourceRoot = ROOT): StagedHubAsset[] {
  if (!outputDirectory) throw new Error("an empty output directory is required");
  const requestedOutput = resolve(outputDirectory);

  // Canonicalize the caller-provided output capability, then complete both
  // read-only preflights before creating or changing anything inside it.
  const output = canonicalEmptyOutput(requestedOutput);
  const stagingContract = loadStagingContract(sourceRoot);
  const contractCheck = verifyImmutablePublicationSnapshot({
    root: sourceRoot,
    stagedAssets: stagingContract.stagedAssets,
    mutableDestinations: stagingContract.mutableDestinations,
  });
  if (contractCheck.issues.length > 0) {
    throw new Error(`immutable publication gate failed:\n${formatImmutablePublicationIssues(contractCheck.issues)}`);
  }
  const sources = readSources(sourceRoot, stagingContract.stagedAssets);
  const publicationCheck = verifyImmutablePublicationSnapshot({
    root: sourceRoot,
    stagedAssets: stagingContract.stagedAssets,
    mutableDestinations: stagingContract.mutableDestinations,
    sourceBytes: new Map(sources.map(({ asset, content }) => [asset.source, content])),
  });
  if (publicationCheck.issues.length > 0) {
    throw new Error(`immutable publication gate failed:\n${formatImmutablePublicationIssues(publicationCheck.issues)}`);
  }
  const staged: StagedHubAsset[] = [];
  for (const { asset, content } of sources) {
    const destination = join(output, asset.destination);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content, { flag: "wx" });
    if (!readFileSync(destination).equals(content)) {
      throw new Error(`staged bytes differ from source: ${asset.destination}`);
    }
    staged.push({ source: asset.source, destination: asset.destination, bytes: content.byteLength });
  }
  return staged;
}

function usage(): string {
  return [
    "Usage: bun bin/stage-hub.ts <existing-empty-output-dir>",
    "",
    "Copies the exact generated hub, discovery, rights, OS console, and worker assets.",
    "The destination must already exist and be empty. Nothing is deleted or deployed.",
  ].join("\n");
}

function main(args: string[]): void {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return;
  }
  if (args.length !== 1) throw new Error(usage());

  const output = resolve(args[0]!);
  const staged = stageHub(output);
  console.log(`staged ${staged.length} exact assets -> ${output}`);
  for (const asset of staged) console.log(`${asset.source} -> ${asset.destination} (${asset.bytes} bytes)`);
}

if (import.meta.main) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`stage-hub: ${message}`);
    process.exitCode = 1;
  }
}
