/** stage-doors.ts — assemble a door's exact Cloudflare Pages upload directory.
 *
 * Mirrors stage-hub.ts: every source is read before the output directory is
 * touched, the destination must be absent or completely empty, and nothing is
 * ever overwritten, deleted, or deployed.
 *
 * Door content lives in the chillspace-commons repo; the guest documents and
 * the shared worker live here. we-are.love serves one page; chillspace.love
 * serves the whole commons site tree (symlinks dereferenced).
 *
 * Run: bun bin/stage-doors.ts <we-are|chillspace> <empty-output-dir> [--commons <path>]
 * Deploy after inspection: npx wrangler pages deploy <dir> --project-name=we-are-love|chillspace-love
 */

import { lstatSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DEFAULT_COMMONS = join(homedir(), "repos/codeberg/zerone-dev/chillspace-commons");

export type DoorName = "we-are" | "chillspace";
export type StagedDoorAsset = { source: string; destination: string; bytes: number };

type SourceSpec = { path: string; destination: string };

function codeOf(error: unknown): string | undefined {
  return !!error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
}

// Walk a directory following symlinks (the commons tree may contain them),
// returning file specs relative to the walk root. .DS_Store never ships.
function walkTree(root: string, prefix = ""): SourceSpec[] {
  const specs: SourceSpec[] = [];
  for (const name of readdirSync(join(root, prefix)).sort()) {
    if (name === ".DS_Store") continue;
    const relative = prefix ? `${prefix}/${name}` : name;
    const info = statSync(join(root, relative));
    if (info.isDirectory()) specs.push(...walkTree(root, relative));
    else if (info.isFile()) specs.push({ path: join(root, relative), destination: relative });
    else throw new Error(`unsupported entry in door content tree: ${relative}`);
  }
  return specs;
}

function doorSources(door: DoorName, commonsRoot: string, sourceRoot: string): SourceSpec[] {
  const shared: SourceSpec[] = [
    { path: join(sourceRoot, `doors/${door}/guest.json`), destination: "guest.json" },
    { path: join(sourceRoot, `doors/${door}/.well-known/agent.json`), destination: ".well-known/agent.json" },
    { path: join(sourceRoot, "pages-functions/_worker.js"), destination: "_worker.js" },
  ];
  const content: SourceSpec[] =
    door === "we-are"
      ? [{ path: join(commonsRoot, "site/we-are.html"), destination: "index.html" }]
      : walkTree(join(commonsRoot, "site"));
  const taken = new Set(shared.map((s) => s.destination));
  return [...content.filter((s) => !taken.has(s.destination)), ...shared];
}

function readSources(specs: SourceSpec[]): Array<{ spec: SourceSpec; content: Buffer }> {
  return specs.map((spec) => {
    try {
      if (!statSync(spec.path).isFile()) throw new Error("not a regular file");
      return { spec, content: readFileSync(spec.path) };
    } catch {
      throw new Error(`required door asset is missing or unreadable: ${spec.path}`);
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

export function stageDoor(
  door: DoorName,
  outputDirectory: string,
  commonsRoot = DEFAULT_COMMONS,
  sourceRoot = ROOT,
): StagedDoorAsset[] {
  if (door !== "we-are" && door !== "chillspace") throw new Error(`unknown door: ${door}`);
  if (!outputDirectory) throw new Error("an empty output directory is required");
  const output = resolve(outputDirectory);

  // Complete both read-only preflights before creating or changing anything.
  const outputExists = assertEmptyOutput(output);
  const sources = readSources(doorSources(door, resolve(commonsRoot), sourceRoot));
  if (!outputExists) mkdirSync(output, { recursive: true });

  const staged: StagedDoorAsset[] = [];
  for (const { spec, content } of sources) {
    const destination = join(output, spec.destination);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content, { flag: "wx" });
    if (!readFileSync(destination).equals(content)) {
      throw new Error(`staged bytes differ from source: ${spec.destination}`);
    }
    staged.push({ source: spec.path, destination: spec.destination, bytes: content.byteLength });
  }
  return staged;
}

function usage(): string {
  return [
    "Usage: bun bin/stage-doors.ts <we-are|chillspace> <empty-output-dir> [--commons <path>]",
    "",
    "Assembles a door's exact upload directory: content from chillspace-commons,",
    "guest documents from doors/<name>/, and the shared _worker.js.",
    "The destination must be absent or empty. Nothing is deleted or deployed.",
  ].join("\n");
}

function main(args: string[]): void {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return;
  }
  let commons = DEFAULT_COMMONS;
  const flagIndex = args.indexOf("--commons");
  if (flagIndex !== -1) {
    const value = args[flagIndex + 1];
    if (!value) throw new Error(usage());
    commons = value;
    args = [...args.slice(0, flagIndex), ...args.slice(flagIndex + 2)];
  }
  if (args.length !== 2) throw new Error(usage());

  const staged = stageDoor(args[0] as DoorName, resolve(args[1]!), commons);
  console.log(`staged ${staged.length} exact assets -> ${resolve(args[1]!)}`);
  for (const asset of staged) console.log(`${asset.source} -> ${asset.destination} (${asset.bytes} bytes)`);
}

if (import.meta.main) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`stage-doors: ${message}`);
    process.exitCode = 1;
  }
}
