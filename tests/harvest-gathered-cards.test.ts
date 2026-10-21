import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Gathered cards (cards/<roster-name>.yaml) stand in for roster members whose
// checkout carries no kingdom.yaml; a member's own card always wins, and
// cards/unlisted/ is never read. The subject is copied under a temporary
// KINGDOM root, so production graph.json/CATALOG.md stay untouched.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let base = "";
let kos = "";
let home = "";

const card = (name: string, purpose: string, state = "active") =>
  `name: ${name}\nkind: service\nlayer: commerce\nowner_sister: none\ndomain: commerce\nstate: ${state}\npurpose: ${purpose}\ndependsOn: []\n`;

function harvest(...args: string[]) {
  const r = Bun.spawnSync(["bun", "--no-env-file", join(kos, "bin/harvest.ts"), ...args], {
    cwd: kos,
    env: { ...process.env, HOME: home },
  });
  return { code: r.exitCode, out: r.stdout.toString() + r.stderr.toString() };
}

beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), "harvest-gathered-"));
  kos = join(base, "kos");
  home = join(base, "home");
  mkdirSync(join(kos, "bin"), { recursive: true });
  copyFileSync(join(ROOT, "bin/harvest.ts"), join(kos, "bin/harvest.ts"));
  for (const repo of ["own", "gathered", "bare", "unlisted-only"]) mkdirSync(join(home, "repos", repo), { recursive: true });
  writeFileSync(
    join(kos, "roster.conf"),
    [
      "own           | ~/repos/own           | service | commerce | commerce | active | seed purpose own",
      "gathered      | ~/repos/gathered      | service | commerce | commerce | active | seed purpose gathered",
      "bare          | ~/repos/bare          | service | commerce | commerce | active | seed purpose bare",
      "unlisted-only | ~/repos/unlisted-only | service | commerce | commerce | active | seed purpose unlisted",
      "absent        | ~/repos/absent        | service | commerce | commerce | remote | seed purpose absent",
      "",
    ].join("\n"),
  );
  writeFileSync(join(home, "repos/own/kingdom.yaml"), card("own", "from its own repo"));
  mkdirSync(join(kos, "cards/unlisted"), { recursive: true });
  writeFileSync(join(kos, "cards/own.yaml"), card("own", "gathered copy that must lose", "dormant"));
  writeFileSync(join(kos, "cards/gathered.yaml"), card("gathered", "from the gathered card", "dormant"));
  writeFileSync(join(kos, "cards/unlisted/unlisted-only.yaml"), card("unlisted-only", "never read"));
  // no checkout at ~/repos/absent: the gathered card must still count and be validated
  writeFileSync(join(kos, "cards/absent.yaml"), card("absent", "gathered for an absent checkout", "remote"));
});

afterAll(() => {
  if (base) rmSync(base, { recursive: true, force: true });
});

describe("harvest reads gathered cards", () => {
  test("own card wins, gathered card stands in, unlisted is ignored", () => {
    const r = harvest();
    expect(r.code).toBe(0);
    const graph = JSON.parse(readFileSync(join(kos, "graph.json"), "utf8")) as any[];
    const byName = Object.fromEntries(graph.map((repo) => [repo.name, repo]));
    expect(byName.own.purpose).toBe("from its own repo");
    expect(byName.own.state).toBe("active");
    expect(byName.gathered.purpose).toBe("from the gathered card");
    expect(byName.gathered.state).toBe("dormant");
    expect(byName.gathered.conformance.card).toBe(true);
    expect(byName.bare.purpose).toBe("seed purpose bare");
    expect(byName.bare.conformance.card).toBe(false);
    expect(byName["unlisted-only"].purpose).toBe("seed purpose unlisted");
    expect(byName["unlisted-only"].conformance.card).toBe(false);
    expect(byName.absent.purpose).toBe("gathered for an absent checkout");
    expect(byName.absent.conformance.card).toBe(true);
    expect(byName.absent.hasCard).toBe(true);
    expect(byName.absent.conformance.claudeMd).toBe(false);
  });

  test("validate checks the gathered card and reports clean cards as clean", () => {
    const r = harvest("validate");
    expect(r.code).toBe(0);
    expect(r.out).toContain("Card schema: 3 checked · 0 invalid · 0 issues");
  });

  test("a gathered card with drift is reported against its gathered path", () => {
    writeFileSync(join(kos, "cards/gathered.yaml"), card("not-gathered", "renamed"));
    const r = harvest("validate");
    expect(r.code).toBe(1);
    expect(r.out).toContain("name-mismatch");
    expect(r.out).toContain("cards/gathered.yaml");
    writeFileSync(join(kos, "cards/gathered.yaml"), card("gathered", "from the gathered card", "dormant"));
  });
});

describe("the gathered cards in this repository", () => {
  const listed = readdirSync(join(ROOT, "cards")).filter((f) => f.endsWith(".yaml"));
  const roster = readFileSync(join(ROOT, "roster.conf"), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("|")[0]!.trim());

  test("every top-level card is named for a roster member", () => {
    expect(listed.length).toBeGreaterThan(0);
    for (const file of listed) expect(roster).toContain(file.replace(/\.yaml$/, ""));
  });

  test("every card file is listed in cards/README.md with its source", () => {
    const readme = readFileSync(join(ROOT, "cards/README.md"), "utf8");
    const unlisted = readdirSync(join(ROOT, "cards/unlisted")).map((f) => `unlisted/${f}`);
    for (const file of [...listed, ...unlisted]) expect(readme).toContain(`| \`${file}\` |`);
  });
});
