/** stage-doors.ts — assemble a door's exact Cloudflare Pages upload directory.
 *
 * Mirrors stage-hub.ts: every source is read before the output directory is
 * touched, the destination must be absent or completely empty, and nothing is
 * ever overwritten, deleted, or deployed in that destination. The shared worker
 * is rebuilt at <source-root>/site/_worker.js before its bundled bytes are copied.
 *
 * Door content lives in the chillspace-commons repo; the guest documents and
 * the shared worker live here. we-are.love serves one page plus its icons,
 * manifest and social card from doors/we-are/; chillspace.love serves the
 * whole commons site tree (symlinks dereferenced).
 *
 * Run: bun bin/stage-doors.ts <we-are|chillspace> <empty-output-dir> [--commons <path>]
 * Deploy after inspection: npx wrangler pages deploy <dir> --project-name=we-are-love|chillspace-love
 */

import { lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { buildPagesWorker } from "./build-pages-worker.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DEFAULT_COMMONS = join(homedir(), "repos/codeberg/zerone-dev/chillspace-commons");

export type DoorName = "we-are" | "chillspace";
export type StagedDoorAsset = { source: string; destination: string; bytes: number };

// we-are.love's icons and web manifest, served at the root exactly as the
// brand kit built them (doors/we-are/brand/kit/web, from brand.json by
// artcraft-brand; rebuild it rather than editing a file).
export const WE_ARE_KIT_WEB = [
  "favicon.ico",
  "favicon.svg",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "site.webmanifest",
] as const;

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
  ];
  // we-are.love ships one authored page plus its own machine index. Without a
  // real llms.txt the worker's asset fallthrough answers /llms.txt with the
  // human page under HTTP 200, which tells a machine reader the file exists and
  // then hands it markup. chillspace has no llms.txt of its own, so this stays
  // door-specific rather than shared. The same fallthrough answered
  // /favicon.ico with the page, so the icons ship as real files too, and the
  // social card is the live painted og.jpg, not the kit's generated one.
  const content: SourceSpec[] =
    door === "we-are"
      ? [
          { path: join(commonsRoot, "site/we-are.html"), destination: "index.html" },
          { path: join(sourceRoot, "doors/we-are/llms.txt"), destination: "llms.txt" },
          ...WE_ARE_KIT_WEB.map((name) => ({ path: join(sourceRoot, "doors/we-are/brand/kit/web", name), destination: name })),
          { path: join(sourceRoot, "doors/we-are/og.jpg"), destination: "og.jpg" },
        ]
      : walkTree(join(commonsRoot, "site"));
  // Reserve _worker.js for the shared bundle, never a commons-tree copy.
  const taken = new Set(["_worker.js", ...shared.map((s) => s.destination)]);
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

// 未建立嘅路徑亦要解析現有父目錄，避免 symlink 別名繞過重疊檢查。
function canonicalPath(path: string): string {
  try {
    return realpathSync(path);
  } catch (error) {
    const parent = dirname(path);
    if (codeOf(error) !== "ENOENT" || parent === path) throw error;
    return join(canonicalPath(parent), basename(path));
  }
}

function assertSeparateBuildOutput(output: string, sourceRoot: string): void {
  const destination = canonicalPath(output);
  const build = canonicalPath(resolve(sourceRoot, "site"));
  if (destination === build || destination.startsWith(`${build}${sep}`) || build.startsWith(`${destination}${sep}`)) {
    throw new Error(`output directory must not overlap shared worker build directory: ${output}`);
  }
}

export async function stageDoor(
  door: DoorName,
  outputDirectory: string,
  commonsRoot = DEFAULT_COMMONS,
  sourceRoot = ROOT,
): Promise<StagedDoorAsset[]> {
  if (door !== "we-are" && door !== "chillspace") throw new Error(`unknown door: ${door}`);
  if (!outputDirectory) throw new Error("an empty output directory is required");
  const output = resolve(outputDirectory);

  // Validate the destination and read every static asset before building.
  assertEmptyOutput(output);
  assertSeparateBuildOutput(output, sourceRoot);
  const sources = readSources(doorSources(door, resolve(commonsRoot), sourceRoot));
  const worker = await buildPagesWorker(sourceRoot);
  sources.push(...readSources([{ path: worker, destination: "_worker.js" }]));
  // The async build must not leave a partial upload or bypass the output guards.
  const outputExists = assertEmptyOutput(output);
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
    "guest documents from doors/<name>/, and the shared _worker.js bundle.",
    "we-are also gets its kit icons and manifest (doors/we-are/brand/kit/web)",
    "and its social card (doors/we-are/og.jpg) at the root.",
    "Rebuilds site/_worker.js in the source root before copying the bundle.",
    "The destination must be absent or empty. Nothing is deleted or deployed.",
  ].join("\n");
}

async function main(args: string[]): Promise<void> {
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

  const staged = await stageDoor(args[0] as DoorName, resolve(args[1]!), commons);
  console.log(`staged ${staged.length} exact assets -> ${resolve(args[1]!)}`);
  for (const asset of staged) console.log(`${asset.source} -> ${asset.destination} (${asset.bytes} bytes)`);
}

if (import.meta.main) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`stage-doors: ${message}`);
    process.exitCode = 1;
  }
}
