import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { stageDoor } from "../bin/stage-doors.ts";

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
    [join(sourceRoot, "doors/chillspace/guest.json")]: '{"name":"chillspace"}',
    [join(sourceRoot, "doors/chillspace/.well-known/agent.json")]: '{"name":"chillspace-manifest"}',
    [join(sourceRoot, "pages-functions/_worker.js")]: "export default {};",
    [join(commons, "site/we-are.html")]: "<html>we are</html>",
    [join(commons, "site/index.html")]: "<html>commons</html>",
    [join(commons, "site/games.html")]: "<html>games</html>",
    [join(commons, "site/love-fun-commons/entry.md")]: "# entry",
    [join(commons, "site/guest.json")]: '{"name":"stale-commons-copy"}',
    [join(commons, "site/.DS_Store")]: "junk",
    [join(commons, "linked-target.html")]: "<html>linked</html>",
  };
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  symlinkSync(join(commons, "linked-target.html"), join(commons, "site/linked.html"));
  return { sourceRoot: `${sourceRoot}/`, commons };
}

describe("the door staging contract", () => {
  test("we-are stages one page plus guest documents and the shared worker", () => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      const output = join(base, "out-we-are");
      const staged = stageDoor("we-are", output, commons, sourceRoot);
      expect(staged.map((a) => a.destination).sort()).toEqual([
        ".well-known/agent.json",
        "_worker.js",
        "guest.json",
        "index.html",
      ]);
      expect(readFileSync(join(output, "index.html"), "utf8")).toBe("<html>we are</html>");
      expect(() => stageDoor("we-are", output, commons, sourceRoot)).toThrow("output directory is not empty");
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("chillspace stages the whole commons tree, dereferencing symlinks, never .DS_Store", () => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      const output = join(base, "out-chillspace");
      const staged = stageDoor("chillspace", output, commons, sourceRoot);
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

  test("a missing source fails before the output directory is created", () => {
    const base = temporaryDirectory("kingdom-stage-doors-");
    try {
      const { sourceRoot, commons } = makeFixture(base);
      rmSync(join(commons, "site/we-are.html"));
      const output = join(base, "untouched");
      expect(() => stageDoor("we-are", output, commons, sourceRoot)).toThrow("missing or unreadable");
      expect(readdirSync(base)).not.toContain("untouched");
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});
