/** stage-hub.ts — assemble the exact Cloudflare Pages upload directory.
 *
 * The source files are all read before the output directory is touched. The
 * destination must be absent or completely empty; existing content is never
 * overwritten or deleted. This stages files only—it does not deploy them.
 *
 * Run: bun bin/stage-hub.ts <empty-output-dir>
 */

import { lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

export const HUB_ASSETS = [
  { source: "site/hub.html", destination: "index.html" },
  // The worker derives /kingdom.json from this authored/generated base.
  { source: "site/kingdom.json", destination: "_kingdom.base.json" },
  { source: "site/wayfinder.json", destination: "wayfinder.json" },
  { source: "site/commons.json", destination: "commons.json" },
  { source: "site/llms.txt", destination: "llms.txt" },
  { source: "site/guest.json", destination: "guest.json" },
  { source: "site/ollama.json", destination: "ollama.json" },
  { source: "site/rights.json", destination: "rights.json" },
  { source: "site/RIGHTS.md", destination: "RIGHTS.md" },
  { source: "site/.well-known/agent.json", destination: ".well-known/agent.json" },
  { source: "pages-content/os/index.html", destination: "os/index.html" },
  { source: "pages-functions/_worker.js", destination: "_worker.js" },
] as const;

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

function readSources(sourceRoot: string): Array<{ asset: typeof HUB_ASSETS[number]; content: Buffer }> {
  return HUB_ASSETS.map((asset) => {
    const source = join(sourceRoot, asset.source);
    try {
      if (!lstatSync(source).isFile()) throw new Error("not a regular file");
      return { asset, content: readFileSync(source) };
    } catch {
      throw new Error(`required hub asset is missing or unreadable: ${asset.source}`);
    }
  });
}

function assertEmptyOutput(output: string): boolean {
  try {
    const info = lstatSync(output);
    if (info.isSymbolicLink()) throw new Error(`output directory must not be a symbolic link: ${output}`);
    if (!info.isDirectory()) throw new Error(`output path is not a directory: ${output}`);
    if (readdirSync(output).length !== 0) throw new Error(`output directory is not empty: ${output}`);
    return true;
  } catch (error) {
    if (codeOf(error) === "ENOENT") return false;
    throw error;
  }
}

export function stageHub(outputDirectory: string, sourceRoot = ROOT): StagedHubAsset[] {
  if (!outputDirectory) throw new Error("an empty output directory is required");
  const output = resolve(outputDirectory);

  // Complete both read-only preflights before creating or changing anything.
  const outputExists = assertEmptyOutput(output);
  const sources = readSources(sourceRoot);
  if (!outputExists) mkdirSync(output, { recursive: true });

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
    "Usage: bun bin/stage-hub.ts <empty-output-dir>",
    "",
    "Copies the exact generated hub, discovery, rights, OS console, and worker assets.",
    "The destination must be absent or empty. Nothing is deleted or deployed.",
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
