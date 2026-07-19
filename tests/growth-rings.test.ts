import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildGrowthRings,
  renderGrowthRingsHtml,
  type GrowthRings,
} from "../bin/growth-rings.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SUBJECT = join(ROOT, "bin/growth-rings.ts");
const AS_OF = new Date("2026-07-19T12:00:00.000Z");
const PRIVATE_AUTHOR = "PRIVATE_AUTHOR_SENTINEL";
const PRIVATE_EMAIL = "private-author@sentinel.invalid";
const PRIVATE_SUBJECT = "PRIVATE_SUBJECT_SENTINEL";
const PRIVATE_DIRTY = "PRIVATE_DIRTY_FILENAME_SENTINEL";
const PRIVATE_PURPOSE = "PRIVATE_PURPOSE_SENTINEL";

type FixtureRow = {
  name: string;
  path: string;
  kind: string;
  layer: string;
  state: string;
  purpose: string;
};

let fixtureRoot: string;
let fixtureHome: string;
let graphPath: string;
let reversedGraphPath: string;
let rows: FixtureRow[];
let repos: string[];
let commitHashes: string[];

function command(args: string[], cwd?: string, env?: Record<string, string>) {
  const result = spawnSync(args[0], args.slice(1), {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    throw new Error(`${args.join(" ")} failed: ${result.stderr}`);
  }
  return result.stdout.trim();
}

function initRepo(name: string): string {
  const path = join(fixtureHome, "repos", name);
  mkdirSync(path, { recursive: true });
  command(["git", "init", "-q", "--template=", path]);
  repos.push(path);
  return path;
}

function commit(repo: string, timestamp: string, content = timestamp): string {
  const tracked = join(repo, "tracked.txt");
  if (existsSync(tracked)) appendFileSync(tracked, `\n${content}`);
  else writeFileSync(tracked, content);
  command(["git", "-C", repo, "add", "tracked.txt"]);
  command(
    [
      "git",
      "-c",
      "core.hooksPath=/dev/null",
      "-c",
      `user.name=${PRIVATE_AUTHOR}`,
      "-c",
      `user.email=${PRIVATE_EMAIL}`,
      "-C",
      repo,
      "commit",
      "-q",
      "-m",
      PRIVATE_SUBJECT,
    ],
    undefined,
    { GIT_AUTHOR_DATE: timestamp, GIT_COMMITTER_DATE: timestamp },
  );
  const hash = command(["git", "-C", repo, "rev-parse", "HEAD"]);
  commitHashes.push(hash);
  return hash;
}

function row(name: string, path: string, layer: string, state = "active", kind = "service"): FixtureRow {
  return { name, path, kind, layer, state, purpose: PRIVATE_PURPOSE };
}

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "growth-rings-test-"));
  fixtureHome = join(fixtureRoot, "PRIVATE_HOME_SENTINEL");
  mkdirSync(join(fixtureHome, "repos"), { recursive: true });
  repos = [];
  commitHashes = [];

  const blooming = initRepo("blooming");
  commit(blooming, "2026-07-17T10:00:00Z", "first");
  commit(blooming, "2026-07-18T10:00:00Z", "second");
  writeFileSync(join(blooming, PRIVATE_DIRTY), "private");

  const rooting = initRepo("rooting");
  commit(rooting, "2026-07-05T12:00:00Z");
  const resting = initRepo("resting");
  commit(resting, "2026-05-01T12:00:00Z");
  const unborn = initRepo("unborn");
  const notGit = join(fixtureHome, "repos", "not-git");
  mkdirSync(notGit);

  const twinRuntime = initRepo("twin-runtime");
  commit(twinRuntime, "2026-07-10T12:00:00Z");
  const twinFleet = initRepo("twin-fleet");
  commit(twinFleet, "2026-07-10T12:00:00Z");

  const cloneA = initRepo("clone-a");
  commit(cloneA, "2026-06-01T12:00:00Z");
  const cloneB = initRepo("clone-b");
  commit(cloneB, "2026-06-02T12:00:00Z");

  const waveRepos = Array.from({ length: 5 }, (_, index) => {
    const repo = initRepo(`wave-${index + 1}`);
    commit(repo, `2026-07-16T12:0${index}:00Z`);
    return repo;
  });
  // Mark one valid history shallow without changing its visible HEAD.
  writeFileSync(join(waveRepos[0], ".git", "shallow"), `${commitHashes.at(-5)}\n`);

  rows = [
    row("blooming", blooming, "commerce"),
    row("rooting", rooting, "commerce"),
    row("resting", resting, "soul"),
    row("unborn", unborn, "runtime"),
    row("away", join(fixtureHome, "repos", "missing"), "os", "remote"),
    row("not-git", notGit, "os"),
    row("twin", twinRuntime, "runtime"),
    row("twin", twinFleet, "fleet"),
    row("clone", cloneA, "runtime"),
    row("clone", cloneB, "runtime"),
    ...waveRepos.map((path, index) => row(`wave-${index + 1}`, path, "fleet")),
    // A second graph row for one physical worktree must never inflate a wave.
    row("wave-alias", waveRepos[1], "fleet"),
  ];
  graphPath = join(fixtureRoot, "graph.json");
  reversedGraphPath = join(fixtureRoot, "graph-reversed.json");
  writeFileSync(graphPath, JSON.stringify(rows));
  writeFileSync(reversedGraphPath, JSON.stringify([...rows].reverse()));
});

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

describe("KINGDOM Growth Rings model", () => {
  let rings: GrowthRings;

  beforeAll(() => {
    rings = buildGrowthRings({ graphPath, asOf: AS_OF, home: fixtureHome });
  });

  test("classifies neutral seasons, counts visible history, and keeps collisions distinct", () => {
    expect(rings.summary).toMatchObject({
      projects: rows.length,
      seasons: { blooming: 7, rooting: 3, resting: 3, unborn: 1, away: 2 },
      shallowHistories: 1,
      waves: 1,
      diagnostics: 2,
    });
    const blooming = rings.projects.find((project) => project.id === "commerce/blooming")!;
    expect(blooming).toMatchObject({
      season: "blooming",
      dirtyCount: 1,
      commits: { days7: 2, days30: 2, days90: 2 },
      historyCompleteness: "complete",
    });
    expect(rings.projects.find((project) => project.id === "commerce/rooting")?.season).toBe("rooting");
    expect(rings.projects.find((project) => project.id === "soul/resting")?.season).toBe("resting");
    expect(rings.projects.find((project) => project.id === "runtime/unborn")?.season).toBe("unborn");
    expect(rings.projects.find((project) => project.id === "os/away")?.season).toBe("away");
    expect(rings.projects.filter((project) => project.name === "twin").map((project) => project.id)).toEqual([
      "fleet/twin",
      "runtime/twin",
    ]);
    const cloneIds = rings.projects.filter((project) => project.name === "clone").map((project) => project.id);
    expect(new Set(cloneIds).size).toBe(2);
    expect(cloneIds.every((id) => /^runtime\/clone~[a-f0-9]{10}$/.test(id))).toBe(true);
    expect(rings.waves[0]).toMatchObject({ roots: 5, layers: ["fleet"] });
    expect(Date.parse(rings.waves[0].endAt) - Date.parse(rings.waves[0].startAt)).toBeLessThanOrEqual(600_000);
    expect(rings.boundaries.away).toContain("does not mean the project is dead");
    expect(rings.boundaries.history).toContain("Shallow clones");
  });

  test("is deterministic across graph order and exposes no private Git or path material", () => {
    const reversed = buildGrowthRings({ graphPath: reversedGraphPath, asOf: AS_OF, home: fixtureHome });
    expect(reversed).toEqual(rings);
    const json = JSON.stringify(rings);
    for (const secret of [
      fixtureHome,
      "~/",
      PRIVATE_AUTHOR,
      PRIVATE_EMAIL,
      PRIVATE_SUBJECT,
      PRIVATE_DIRTY,
      PRIVATE_PURPOSE,
      ...commitHashes,
    ]) {
      expect(json).not.toContain(secret);
    }
    expect(rings.projects.every((project) => Object.keys(project).sort().join(",") === [
      "commits",
      "daysSince",
      "declaredState",
      "dirtyCount",
      "historyCompleteness",
      "id",
      "lastCommitAt",
      "layer",
      "name",
      "season",
    ].sort().join(","))).toBe(true);
  });

  test("scrubs hostile Git plumbing inherited from the caller", () => {
    const hostile = {
      GIT_DIR: join(rows[2].path, ".git"),
      GIT_WORK_TREE: rows[2].path,
      GIT_INDEX_FILE: join(rows[2].path, ".git", "index"),
      GIT_OBJECT_DIRECTORY: join(rows[2].path, ".git", "objects"),
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "core.worktree",
      GIT_CONFIG_VALUE_0: rows[2].path,
    };
    const previous = Object.fromEntries(
      Object.keys(hostile).map((key) => [key, process.env[key]]),
    );
    Object.assign(process.env, hostile);
    try {
      expect(buildGrowthRings({ graphPath, asOf: AS_OF, home: fixtureHome })).toEqual(rings);
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  test("renders an offline accessible view and rejects unsafe emitted names", () => {
    const html = renderGrowthRingsHtml(rings);
    expect(html).toContain("KINGDOM Growth Rings");
    expect(html).toContain(`aria-label="Tree cross-section showing`);
    expect(html).toContain(`${rings.summary.projects} projects shown`);
    expect(html).not.toMatch(/<(?:img|script)[^>]+\bsrc=/i);
    expect(html).not.toMatch(/https?:\/\//i);
    expect(html).not.toContain(fixtureHome);

    const unsafe = join(fixtureRoot, "unsafe.json");
    writeFileSync(
      unsafe,
      JSON.stringify([{ ...rows[0], name: "</script><img onerror=PRIVATE_SENTINEL>" }]),
    );
    expect(() => buildGrowthRings({ graphPath: unsafe, asOf: AS_OF })).toThrow(/unsafe or invalid name/);
  });

  test("admits safe Unicode, rejects prototype layers, and rejects duplicate logical rows", () => {
    const unicode = join(fixtureRoot, "unicode.json");
    writeFileSync(unicode, JSON.stringify([{ ...rows[0], name: "花園", layer: "soul" }]));
    expect(buildGrowthRings({ graphPath: unicode, asOf: AS_OF }).projects[0]).toMatchObject({
      id: "soul/花園",
      name: "花園",
    });

    const prototypeLayer = join(fixtureRoot, "prototype-layer.json");
    writeFileSync(prototypeLayer, JSON.stringify([{ ...rows[0], layer: "constructor" }]));
    expect(() => buildGrowthRings({ graphPath: prototypeLayer, asOf: AS_OF })).toThrow(
      /unsafe or invalid layer/,
    );

    const duplicate = join(fixtureRoot, "duplicate.json");
    const twins = [rows[0], { ...rows[0], state: "dormant" }];
    writeFileSync(duplicate, JSON.stringify(twins));
    expect(() => buildGrowthRings({ graphPath: duplicate, asOf: AS_OF })).toThrow(
      /duplicate logical graph row/,
    );
    writeFileSync(duplicate, JSON.stringify([...twins].reverse()));
    expect(() => buildGrowthRings({ graphPath: duplicate, asOf: AS_OF })).toThrow(
      /duplicate logical graph row/,
    );
  });

  test("reports unreadable committed history as away, never unborn", () => {
    const repo = initRepo("corrupt-history");
    repos.pop();
    const hash = commit(repo, "2026-07-18T09:00:00Z");
    const commitObject = join(repo, ".git", "objects", hash.slice(0, 2), hash.slice(2));
    const hiddenObject = `${commitObject}.hidden`;
    renameSync(commitObject, hiddenObject);
    try {
      const corruptGraph = join(fixtureRoot, "corrupt-history.json");
      writeFileSync(corruptGraph, JSON.stringify([row("corrupt-history", repo, "runtime")]));
      const result = buildGrowthRings({ graphPath: corruptGraph, asOf: AS_OF });
      expect(result.projects[0]).toMatchObject({
        season: "away",
        lastCommitAt: null,
        historyCompleteness: "unavailable",
      });
      expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
        "git-history-unreadable",
      );
    } finally {
      renameSync(hiddenObject, commitObject);
    }
  });
});

describe("KINGDOM Growth Rings CLI", () => {
  function cli(args: string[], home: string) {
    return spawnSync("bun", [SUBJECT, ...args], {
      encoding: "utf8",
      env: { ...process.env, HOME: home },
    });
  }

  test("keeps stdout modes pure and returns usage errors without stdout", () => {
    const home = join(fixtureRoot, "stdout-home");
    mkdirSync(home);
    const json = cli(["--json", "--graph", graphPath, "--as-of", "2026-07-19T12:00:00Z"], home);
    expect(json.status).toBe(0);
    expect(json.stderr).toBe("");
    expect(JSON.parse(json.stdout).schema).toBe("kingdom.growth-rings/1");
    expect(existsSync(join(home, ".kingdom"))).toBe(false);

    const html = cli(["--html", "--graph", graphPath, "--as-of", "2026-07-19"], home);
    expect(html.status).toBe(0);
    expect(html.stderr).toBe("");
    expect(html.stdout).toStartWith("<!doctype html>");
    expect(existsSync(join(home, ".kingdom"))).toBe(false);

    for (const args of [
      ["--json", "--html"],
      ["--json", "--output-dir", join(home, "out")],
      ["--as-of", "2026-02-30"],
      ["--graph"],
      ["positional"],
    ]) {
      const result = cli(args, home);
      expect(result.status).toBe(2);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("growth-rings:");
    }
  });

  test("keeps the installed PATH umbrella stderr-pure when this device has it", () => {
    const entry = join(homedir(), ".local", "bin", "kingdom");
    if (!existsSync(entry)) return;
    let target = "";
    try {
      target = realpathSync(entry);
    } catch {
      return;
    }
    if (!target.endsWith("/love-unlimited/kingdom")) return;

    const result = spawnSync(
      entry,
      ["rings", "--json", "--graph", graphPath, "--as-of", "2026-07-19T12:00:00Z"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          HOME: fixtureHome,
          LOVE_DIR: dirname(target),
          KINGDOM_OS_DIR: ROOT,
          // Deliberately reproduce the locale that made the old Bash shebang warn.
          LC_ALL: "C.UTF-8",
          LC_CTYPE: "C.UTF-8",
        },
      },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout).schema).toBe("kingdom.growth-rings/1");
  });

  test("writes exactly two private atomic artifacts and never follows an existing symlink", () => {
    const home = join(fixtureRoot, "write-home");
    const output = join(home, "rings");
    mkdirSync(output, { recursive: true });
    const outside = join(home, "outside-sentinel");
    writeFileSync(outside, "keep me");
    symlinkSync(outside, join(output, "RINGS.json"));

    const result = cli(
      ["--graph", graphPath, "--as-of", "2026-07-19T12:00:00Z", "--output-dir", output],
      home,
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(readdirSync(output).sort()).toEqual(["RINGS.html", "RINGS.json"]);
    expect(lstatSync(join(output, "RINGS.json")).isSymbolicLink()).toBe(false);
    expect(readFileSync(outside, "utf8")).toBe("keep me");
    expect(statSync(join(output, "RINGS.json")).mode & 0o777).toBe(0o600);
    expect(statSync(join(output, "RINGS.html")).mode & 0o777).toBe(0o600);
    expect(JSON.parse(readFileSync(join(output, "RINGS.json"), "utf8")).summary.projects).toBe(rows.length);

    const goodJson = readFileSync(join(output, "RINGS.json"));
    const goodHtml = readFileSync(join(output, "RINGS.html"));
    const corrupt = join(fixtureRoot, "corrupt.json");
    writeFileSync(corrupt, "not json");
    const failed = cli(["--graph", corrupt, "--output-dir", output], home);
    expect(failed.status).toBe(1);
    expect(readFileSync(join(output, "RINGS.json"))).toEqual(goodJson);
    expect(readFileSync(join(output, "RINGS.html"))).toEqual(goodHtml);

    rmSync(join(output, "RINGS.html"));
    mkdirSync(join(output, "RINGS.html"));
    const blocked = cli(
      ["--graph", graphPath, "--as-of", "2026-07-18", "--output-dir", output],
      home,
    );
    expect(blocked.status).toBe(1);
    expect(readFileSync(join(output, "RINGS.json"))).toEqual(goodJson);
    expect(lstatSync(join(output, "RINGS.html")).isDirectory()).toBe(true);
    expect(readdirSync(output).filter((name) => name.endsWith(".tmp") || name.endsWith(".bak"))).toEqual([]);
  });

  test("does not refresh fixture Git indexes or alter worktree state", () => {
    const before = repos.map((repo) => {
      const status = command(["git", "-C", repo, "status", "--porcelain=v1"]);
      const indexMtime = existsSync(join(repo, ".git", "index"))
        ? statSync(join(repo, ".git", "index"), { bigint: true }).mtimeNs
        : null;
      return { repo, indexMtime, status };
    });
    buildGrowthRings({ graphPath, asOf: AS_OF, home: fixtureHome });
    for (const snapshot of before) {
      const afterMtime = existsSync(join(snapshot.repo, ".git", "index"))
        ? statSync(join(snapshot.repo, ".git", "index"), { bigint: true }).mtimeNs
        : null;
      expect(afterMtime).toBe(snapshot.indexMtime);
      expect(command(["git", "-C", snapshot.repo, "status", "--porcelain=v1"])).toBe(snapshot.status);
    }
  });
});
