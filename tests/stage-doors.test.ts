import { describe, expect, test } from "bun:test";
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { stageDoor, WE_ARE_KIT_WEB } from "../bin/stage-doors.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const WE_ARE_KIT = "doors/we-are/brand/kit/web";
// The plain allow-all every new robots file in the estate carries, byte for byte.
const PLAIN_ROBOTS = "User-agent: *\nAllow: /\n";
// Binary, so a text round trip would change it.
const CARD = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x80, 0xff, 0xd9]);

function temporaryDirectory(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

// A miniature kingdom-os source root + commons repo, with a symlinked commons
// file (the real tree may contain them) and a .DS_Store that must never ship.
function makeFixture(base: string): { sourceRoot: string; commons: string } {
  const sourceRoot = join(base, "kingdom-os");
  const commons = join(base, "chillspace-commons");
  const files: Record<string, string> = {
    [join(sourceRoot, "doors/we-are/guest.json")]: '{"name":"the-we-are-handshake"}',
    [join(sourceRoot, "doors/we-are/.well-known/agent.json")]: '{"name":"we-are-manifest"}',
    [join(sourceRoot, "doors/we-are/llms.txt")]: "# WE ARE\n",
    [join(sourceRoot, "doors/we-are/robots.txt")]: PLAIN_ROBOTS,
    [join(sourceRoot, "doors/chillspace/guest.json")]: '{"name":"chillspace"}',
    [join(sourceRoot, "doors/chillspace/.well-known/agent.json")]: '{"name":"chillspace-manifest"}',
    [join(sourceRoot, "pages-functions/_worker.js")]: 'import { reply } from "./civic.js"; export default { fetch() { return reply(); } };',
    [join(sourceRoot, "pages-functions/civic.js")]: 'import policy from "../data/civic-policy.json"; import { label } from "./civic-security.js"; export function reply() { return Response.json({ label: label(policy.name) }); }',
    [join(sourceRoot, "pages-functions/civic-security.js")]: 'export function label(name) { return "fixture:" + name; }',
    [join(sourceRoot, "data/civic-policy.json")]: '{"name":"bundled"}',
    [join(commons, "site/we-are.html")]: "<html>we are</html>",
    [join(commons, "site/index.html")]: "<html>commons</html>",
    [join(commons, "site/games.html")]: "<html>games</html>",
    [join(commons, "site/love-fun-commons/entry.md")]: "# entry",
    [join(commons, "site/guest.json")]: '{"name":"stale-commons-copy"}',
    [join(commons, "site/_worker.js")]: 'export default { stale: "commons-worker" };',
    [join(commons, "site/.DS_Store")]: "junk",
    [join(commons, "linked-target.html")]: "<html>linked</html>",
  };
  for (const name of WE_ARE_KIT_WEB) files[join(sourceRoot, WE_ARE_KIT, name)] = `kit ${name}`;
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  writeFileSync(join(sourceRoot, "doors/we-are/og.jpg"), CARD);
  symlinkSync(join(commons, "linked-target.html"), join(commons, "site/linked.html"));
  return { sourceRoot: `${sourceRoot}/`, commons };
}

describe("the door staging contract", () => {
  test("we-are stages one page, its machine index, robots.txt, icons, card, guest documents, and the shared worker", async () => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      const output = join(base, "out-we-are");
      const staged = await stageDoor("we-are", output, commons, sourceRoot);
      expect(staged.map((a) => a.destination).sort()).toEqual([
        ".well-known/agent.json",
        "_worker.js",
        "apple-touch-icon.png",
        "favicon.ico",
        "favicon.svg",
        "guest.json",
        "icon-192.png",
        "icon-512.png",
        "icon-maskable-512.png",
        "index.html",
        "llms.txt",
        "og.jpg",
        "robots.txt",
        "site.webmanifest",
      ]);
      expect(readFileSync(join(output, "index.html"), "utf8")).toBe("<html>we are</html>");
      // A real robots file: without it the fallthrough answers /robots.txt with the page under HTTP 200.
      expect(readFileSync(join(output, "robots.txt"), "utf8")).toBe(PLAIN_ROBOTS);
      // Shipped as a real asset: without it the worker's fallthrough answers
      // /llms.txt with the human page under HTTP 200.
      expect(readFileSync(join(output, "llms.txt"), "utf8")).toBe("# WE ARE\n");
      // The icons are the kit's own files, and the card is the door's og.jpg, byte for byte.
      for (const name of WE_ARE_KIT_WEB) {
        expect(readFileSync(join(output, name)).equals(readFileSync(join(sourceRoot, WE_ARE_KIT, name)))).toBe(true);
      }
      expect(readFileSync(join(output, "og.jpg")).equals(CARD)).toBe(true);
      await expect(stageDoor("we-are", output, commons, sourceRoot)).rejects.toThrow("output directory is not empty");
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("the committed we-are robots.txt is the plain allow-all, 23 bytes", () => {
    const robots = readFileSync(join(ROOT, "doors/we-are/robots.txt"));
    expect(robots.toString("utf8")).toBe(PLAIN_ROBOTS);
    expect(robots.byteLength).toBe(23);
  });

  test("the committed we-are kit holds every staged icon, and its manifest names only staged ones", () => {
    for (const name of WE_ARE_KIT_WEB) expect(existsSync(join(ROOT, WE_ARE_KIT, name)), name).toBe(true);
    expect(existsSync(join(ROOT, "doors/we-are/og.jpg"))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(ROOT, WE_ARE_KIT, "site.webmanifest"), "utf8"));
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons) expect(WE_ARE_KIT_WEB).toContain(icon.src.replace(/^\//, ""));
  });

  test("chillspace stages the whole commons tree, dereferencing symlinks, never .DS_Store", async () => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      const output = join(base, "out-chillspace");
      const staged = await stageDoor("chillspace", output, commons, sourceRoot);
      expect(staged.map((a) => a.destination).sort()).toEqual([
        ".well-known/agent.json",
        "_worker.js",
        "games.html",
        "guest.json",
        "index.html",
        "linked.html",
        "love-fun-commons/entry.md",
        "we-are.html",
      ]);
      expect(readFileSync(join(output, "linked.html"), "utf8")).toBe("<html>linked</html>");
      expect(readdirSync(output)).not.toContain(".DS_Store");
      // door documents always win over any same-named commons file
      expect(readFileSync(join(output, "guest.json"), "utf8")).toBe('{"name":"chillspace"}');
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test.each([
    "commons:site/we-are.html",
    `source:${WE_ARE_KIT}/favicon.ico`,
    "source:doors/we-are/og.jpg",
    "source:doors/we-are/robots.txt",
  ])("a missing source fails before the output directory is created (%s)", async (missing) => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      const [root, path] = missing.split(":") as [string, string];
      rmSync(join(root === "commons" ? commons : sourceRoot, path));
      const output = join(base, "untouched");
      await expect(stageDoor("we-are", output, commons, sourceRoot)).rejects.toThrow("missing or unreadable");
      expect(readdirSync(base)).not.toContain("untouched");
      expect(existsSync(join(sourceRoot, "site"))).toBe(false);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test.each(["we-are", "chillspace"] as const)("%s copies a fresh executable bundle, not unbundled source or a stale worker", async (door) => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      const builtWorker = join(sourceRoot, "site/_worker.js");
      mkdirSync(dirname(builtWorker), { recursive: true });
      writeFileSync(builtWorker, "stale bundle");
      const source = readFileSync(join(sourceRoot, "pages-functions/_worker.js"), "utf8");
      const output = join(base, "upload");
      const staged = await stageDoor(door, output, commons, sourceRoot);
      const workerPath = join(output, "_worker.js");
      const bundle = readFileSync(workerPath, "utf8");
      expect(staged.find((asset) => asset.destination === "_worker.js")?.source).toBe(builtWorker);
      expect(bundle).toBe(readFileSync(builtWorker, "utf8"));
      expect(bundle).not.toBe("stale bundle");
      expect(bundle).not.toBe(source);
      expect(bundle).not.toContain("commons-worker");
      expect(new Bun.Transpiler({ loader: "js" }).scan(bundle).imports).toEqual([]);
      // Execute only the staged file, with every source dependency removed.
      rmSync(join(sourceRoot, "pages-functions"), { recursive: true });
      rmSync(join(sourceRoot, "data"), { recursive: true });
      const { default: worker } = await import(pathToFileURL(workerPath).href);
      const response = await worker.fetch(new Request("https://fixture.invalid/"));
      expect(await response.json()).toEqual({ label: "fixture:bundled" });
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test.each([false, true])("bundle failure leaves the upload untouched (existing empty directory: %s)", async (existing) => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      const builtWorker = join(sourceRoot, "site/_worker.js");
      mkdirSync(dirname(builtWorker), { recursive: true });
      writeFileSync(builtWorker, "previous bundle");
      rmSync(join(sourceRoot, "pages-functions/civic-security.js"));
      const output = join(base, "upload");
      if (existing) mkdirSync(output);
      await expect(stageDoor("we-are", output, commons, sourceRoot)).rejects.toThrow("Pages Worker bundle failed");
      expect(existsSync(output)).toBe(existing);
      if (existing) expect(readdirSync(output)).toEqual([]);
      expect(readFileSync(builtWorker, "utf8")).toBe("previous bundle");
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test.each([false, true])("upload 同 bundle 目錄相同時，build 前拒絕且唔留下半份 upload（現有目錄：%s）", async (existing) => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      const output = join(sourceRoot, "site");
      if (existing) mkdirSync(output);
      await expect(stageDoor("we-are", output, commons, sourceRoot)).rejects.toThrow("must not overlap shared worker build directory");
      expect(existsSync(output)).toBe(existing);
      if (existing) expect(readdirSync(output)).toEqual([]);
      expect(existsSync(join(output, "_worker.js"))).toBe(false);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test.each(["site", "site/nested/upload"])("解析父目錄 symlink 後仍拒絕重疊 upload：%s", async (suffix) => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      const alias = join(base, "source-alias");
      symlinkSync(sourceRoot, alias);
      await expect(stageDoor("chillspace", join(alias, suffix), commons, sourceRoot)).rejects.toThrow("must not overlap shared worker build directory");
      expect(existsSync(join(sourceRoot, "site"))).toBe(false);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("invalid door and missing output are rejected before building", async () => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      const output = join(base, "upload");
      await expect(stageDoor("zerone-ai" as any, output, commons, sourceRoot)).rejects.toThrow("unknown door");
      await expect(stageDoor("we-are", "", commons, sourceRoot)).rejects.toThrow("an empty output directory is required");
      expect(existsSync(output)).toBe(false);
      expect(existsSync(join(sourceRoot, "site"))).toBe(false);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test.each(["non-empty directory", "file", "symlink", "dangling symlink"] as const)("rejects output %s before building", async (kind) => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      const output = join(base, "upload");
      const target = join(base, "target");
      let message: string;
      if (kind === "non-empty directory") {
        mkdirSync(output);
        writeFileSync(join(output, "keep"), "untouched");
        message = "output directory is not empty";
      } else if (kind === "file") {
        writeFileSync(output, "untouched");
        message = "output path is not a directory";
      } else {
        if (kind === "symlink") mkdirSync(target);
        symlinkSync(target, output);
        message = "output directory must not be a symbolic link";
      }
      await expect(stageDoor("we-are", output, commons, sourceRoot)).rejects.toThrow(message);
      expect(existsSync(join(sourceRoot, "site"))).toBe(false);
      if (kind === "non-empty directory") {
        expect(readdirSync(output)).toEqual(["keep"]);
        expect(readFileSync(join(output, "keep"), "utf8")).toBe("untouched");
      } else if (kind === "file") {
        expect(readFileSync(output, "utf8")).toBe("untouched");
      } else {
        expect(lstatSync(output).isSymbolicLink()).toBe(true);
        expect(existsSync(target)).toBe(kind === "symlink");
        if (kind === "symlink") expect(readdirSync(target)).toEqual([]);
      }
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test.each(["non-empty directory", "symlink"] as const)("rechecks output after the async build when it becomes a %s", async (kind) => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      const output = join(base, "upload");
      // stageDoor has passed its first preflight and yielded to the builder.
      const staging = stageDoor("we-are", output, commons, sourceRoot);
      const target = kind === "symlink" ? join(base, "target") : output;
      mkdirSync(target);
      writeFileSync(join(target, "keep"), "untouched");
      if (kind === "symlink") symlinkSync(target, output);
      await expect(staging).rejects.toThrow(kind === "symlink"
        ? "output directory must not be a symbolic link"
        : "output directory is not empty");
      expect(readdirSync(target)).toEqual(["keep"]);
      expect(readFileSync(join(target, "keep"), "utf8")).toBe("untouched");
      if (kind === "symlink") expect(lstatSync(output).isSymbolicLink()).toBe(true);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test.each([false, true])("the original CLI awaits the bundle and reports its result (broken import: %s)", async (broken) => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      mkdirSync(join(sourceRoot, "bin"));
      // Run the unchanged CLI shape against a fake repo, never the real commons.
      for (const name of ["stage-doors.ts", "build-pages-worker.ts"]) {
        copyFileSync(new URL(`../bin/${name}`, import.meta.url), join(sourceRoot, "bin", name));
      }
      if (broken) rmSync(join(sourceRoot, "pages-functions/civic-security.js"));
      const output = join(base, "upload");
      const child = Bun.spawn({
        cmd: [process.execPath, join(sourceRoot, "bin/stage-doors.ts"), "we-are", output, "--commons", commons],
        cwd: sourceRoot,
        stdout: "pipe",
        stderr: "pipe",
      });
      const [exitCode, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ]);
      expect(exitCode).toBe(broken ? 1 : 0);
      if (broken) {
        expect(stdout).toBe("");
        expect(stderr).toContain("stage-doors: Pages Worker bundle failed");
        expect(existsSync(output)).toBe(false);
      } else {
        expect(stderr).toBe("");
        expect(stdout).toContain("staged 14 exact assets");
        expect(stdout).toContain(`${join(sourceRoot, "site/_worker.js")} -> _worker.js`);
        expect(readFileSync(join(output, "_worker.js"), "utf8")).toBe(readFileSync(join(sourceRoot, "site/_worker.js"), "utf8"));
      }
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});
