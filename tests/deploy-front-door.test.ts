import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// bin/deploy.sh must build every target from freshly fetched, committed
// upstream bytes, never from a local checkout's working tree, and must not
// publish on --dry-run. Fixtures are local git repositories; `fly` and `curl`
// are PATH stubs, so nothing leaves the machine.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(ROOT, "bin/deploy.sh");

let base = "";
let stubs = "";
let flyLog = "";
let mcpSha = "";

function git(cwd: string, ...args: string[]): string {
  const r = Bun.spawnSync(["git", "-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", ...args], { cwd });
  if (r.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr.toString()}`);
  return r.stdout.toString().trim();
}

function repo(name: string, files: Record<string, string>): string {
  const dir = join(base, name);
  mkdirSync(dir, { recursive: true });
  git(dir, "init", "-q", "-b", "main");
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), body);
  }
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "fixture");
  return dir;
}

function run(args: string[], extraEnv: Record<string, string> = {}) {
  const r = Bun.spawnSync(["bash", SCRIPT, ...args], {
    cwd: base,
    env: {
      ...process.env,
      PATH: `${stubs}:${process.env.PATH}`,
      TMPDIR: base,
      KOS_URL: `file://${join(base, "kos")}`,
      MCP_URL: `file://${join(base, "mcp")}`,
      FLY_LOG: flyLog,
      ...extraEnv,
    },
  });
  return { code: r.exitCode, out: r.stdout.toString() + r.stderr.toString() };
}

beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), "deploy-front-door-"));
  stubs = join(base, "stubs");
  flyLog = join(base, "fly.log");
  mkdirSync(stubs);
  writeFileSync(join(stubs, "fly"), `#!/bin/bash\nprintf '%s|%s|%s\\n' "$PWD" "$*" "$(test -d .git && echo git || echo nogit)" >> "$FLY_LOG"\n`);
  writeFileSync(join(stubs, "curl"), `#!/bin/bash\nprintf '{"ok":true}'\n`);
  chmodSync(join(stubs, "fly"), 0o755);
  chmodSync(join(stubs, "curl"), 0o755);

  repo("kos", {
    "REGISTRY.yaml": "version: 1\nservices:\n  - id: one\n    status: live\n  - id: two\n    status: live\n",
  });
  const mcp = repo("mcp", {
    "fly.toml": 'app = "kingdom-mcp"\n',
    "src/server.ts": "export {};\n",
    "scripts/embed-registry.ts": [
      "const src = process.env.KINGDOM_REGISTRY!;",
      "const doc = Bun.YAML.parse(await Bun.file(src).text()) as any;",
      "await Bun.write(new URL('../src/registry.gen.json', import.meta.url).pathname, JSON.stringify({ count: doc.services.length, src }));",
      "",
    ].join("\n"),
  });
  mcpSha = git(mcp, "rev-parse", "HEAD");
  // uncommitted work in the upstream's own working tree must never ship
  writeFileSync(join(mcp, "src/uncommitted.ts"), "export const dirty = true;\n");
});

afterAll(() => {
  if (base) rmSync(base, { recursive: true, force: true });
});

describe("bin/deploy.sh", () => {
  test("refuses a missing target, an unknown argument, and two targets", () => {
    expect(run([]).code).toBe(2);
    expect(run(["thekingdom"]).code).toBe(2);
    expect(run(["zerone"]).code).toBe(2);
    expect(run(["kingdom-mcp", "sinovai"]).code).toBe(2);
  });

  test("--dry-run stages from the fetched commit and publishes nothing", () => {
    const r = run(["kingdom-mcp", "--dry-run"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain(`@ ${mcpSha}`);
    expect(r.out).toContain("dry run: would deploy kingdom-mcp to Fly");
    expect(existsSync(flyLog)).toBe(false);
    const work = r.out.match(/staged trees stay in (\S+)/)![1]!;
    const tree = join(work, "kingdom-mcp");
    expect(existsSync(join(tree, ".git"))).toBe(false);
    expect(existsSync(join(tree, "src/uncommitted.ts"))).toBe(false);
    const embedded = JSON.parse(readFileSync(join(tree, "src/registry.gen.json"), "utf8"));
    expect(embedded.count).toBe(2);
    expect(embedded.src).toBe(join(work, "kingdom-os", "REGISTRY.yaml"));
  });

  test("a real run deploys the archived tree, not a checkout, and cleans up", () => {
    const r = run(["kingdom-mcp"]);
    expect(r.code).toBe(0);
    const calls = readFileSync(flyLog, "utf8").trim().split("\n");
    expect(calls).toHaveLength(1);
    const [cwd, args, gitState] = calls[0]!.split("|");
    expect(args).toBe("deploy --ha=false");
    expect(gitState).toBe("nogit");
    expect(cwd!.endsWith("/kingdom-mcp")).toBe(true);
    expect(existsSync(cwd!)).toBe(false); // the temporary work tree is removed after a real run
    expect(r.out).toContain('contains "ok":true');
  });

  test("a missing upstream branch fails before anything is staged", () => {
    const r = run(["kingdom-mcp", "--dry-run"], { MCP_REF: "no-such-branch" });
    expect(r.code).not.toBe(0);
    expect(r.out).toContain("fetch failed");
  });
});
