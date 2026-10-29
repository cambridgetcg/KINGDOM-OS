import { beforeAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PIN_PRECEDENCE,
  comparePin,
  compareSincePrevious,
  countBy,
  rings,
} from "../skills/navigate-dark-continent/scripts/hf-pin-verdict.mjs";
import {
  LeaseError,
  OUTBOX_FILES,
  defaultDeps,
  main,
  parseLease,
  runLookback,
} from "../skills/navigate-dark-continent/scripts/hf-pin-reread.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SKILL = join(ROOT, "skills", "navigate-dark-continent");
const RECORD = "records/2026-10-27-dark-continent-hf-pin-drift";
const EXAMPLE_LEASE = join(SKILL, "references", "hf-pin-lease.example.json");
const PREVIOUS = JSON.parse(readFileSync(join(ROOT, RECORD, "evidence", "observations.json"), "utf8"));
const MCP = "mcp-research-alliance/mcp-ecosystem-sample";
const HEAD = "1".repeat(40);
const START = Date.parse("2026-11-02T10:00:00.000Z");

type Row = any;
type Call = { url: string; init: any };

const digest = (bytes: Buffer | string) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const fileDigest = (path: string) => digest(readFileSync(path));
const clone = <T>(value: T): T => structuredClone(value);
const rowById = (id: string): Row => PREVIOUS.resources.find((row: Row) => row.id === id);

let TEMPLATE: any;
beforeAll(() => {
  TEMPLATE = defaultDeps().receiptTemplate(ROOT);
});

function snapshot(paths: string[]): string {
  const entries: string[] = [];
  const visit = (path: string) => {
    const stat = statSync(path);
    if (stat.isDirectory()) {
      for (const name of readdirSync(path).sort()) visit(join(path, name));
      return;
    }
    entries.push(`${relative(ROOT, path)}\t${stat.size}\t${stat.mtimeMs}\t${fileDigest(path)}`);
  };
  for (const path of paths) visit(path);
  return entries.join("\n");
}

function listTree(dir: string): string[] {
  const found: string[] = [];
  const visit = (path: string) => {
    for (const name of readdirSync(path).sort()) {
      const child = join(path, name);
      if (statSync(child).isDirectory()) visit(child);
      else found.push(relative(dir, child));
    }
  };
  visit(dir);
  return found;
}

// A stand-in Hub response rebuilt from the derived fields of the 10-27 record.
function metadataFor(row: Row, pinned: boolean) {
  const observed = pinned ? row.observed.pinned_revision : row.observed.current;
  const cardData: Record<string, unknown> = {};
  if (observed.license.card !== null) cardData.license = observed.license.card;
  const extra = row.observed.current.card_extra_gated_fields;
  if (extra) cardData.extra_gated_fields = Object.fromEntries(Array.from({ length: extra }, (_, i) => [`field${i}`, "text"]));
  const body: Record<string, unknown> = {
    _id: "fixture",
    id: row.id,
    sha: pinned ? row.pin.revision : row.observed.current.sha,
    lastModified: observed.lastModified,
    private: row.observed.current.private,
    disabled: row.observed.current.disabled,
    cardData,
    tags: observed.license.tags.map((tag: string) => `license:${tag}`),
  };
  if (row.kind !== "space") body.gated = row.observed.current.gated;
  return body;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

type Hub = (url: URL, row: Row, pinned: boolean, call: number) => Response | Promise<Response> | null;

function stubFetch(clock: { t: number }, override: Hub = () => null) {
  const calls: Call[] = [];
  const fetch = async (url: string, init: any) => {
    calls.push({ url, init });
    clock.t += 100;
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/api\/(models|datasets|spaces)\/([^/]+\/[^/]+?)(?:\/revision\/([0-9a-f]{40}))?$/);
    if (!match) throw new Error(`unplanned URL ${url}`);
    const row = rowById(match[2]);
    const response = await override(parsed, row, Boolean(match[3]), calls.length);
    return response ?? json(metadataFor(row, Boolean(match[3])));
  };
  return { fetch, calls };
}

function leaseFor(dir: string, change: (lease: any) => void = () => {}) {
  const lease = JSON.parse(readFileSync(EXAMPLE_LEASE, "utf8"));
  delete lease.example;
  lease.authority_reference = "Fixture authority for a stubbed test run; nothing leaves this process.";
  lease.lease_expires_at = "2026-11-30T00:00:00Z";
  lease.stop_file = join(dir, "STOP");
  lease.outbox = join(dir, "outbox");
  change(lease);
  return JSON.stringify(lease, null, 2);
}

function cleanGit(dirty = "") {
  return (_root: string, args: string[]) => {
    if (args[0] === "status") return { status: 0, stdout: dirty };
    if (args[0] === "rev-parse") return { status: 0, stdout: `${HEAD}\n` };
    if (args[0] === "ls-files") return { status: 0, stdout: `${args.at(-1)}\n` };
    return { status: 1, stdout: "" };
  };
}

function setup(override?: Hub, extra: Record<string, unknown> = {}) {
  const dir = mkdtempSync(join(tmpdir(), "kingdom-lookback-test."));
  const clock = { t: START };
  const stub = stubFetch(clock, override);
  const env: Record<string, string> = { PATH: process.env.PATH ?? "", HF_TOKEN: "hf_sentinel_must_not_escape" };
  const deps = {
    fetch: stub.fetch,
    now: () => clock.t,
    env,
    suiteRoot: ROOT,
    git: cleanGit(),
    receiptTemplate: () => clone(TEMPLATE),
    ...extra,
  };
  return { dir, clock, calls: stub.calls, env, deps, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function outbox(dir: string) {
  const root = join(dir, "outbox");
  return {
    root,
    observations: JSON.parse(readFileSync(join(root, "evidence", "observations.json"), "utf8")),
    requests: readFileSync(join(root, "evidence", "requests.jsonl"), "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)),
    receipt: JSON.parse(readFileSync(join(root, "karma-receipt.json"), "utf8")),
    note: readFileSync(join(root, "RETURN-NOTE.md"), "utf8"),
  };
}

describe("hf-pin-drift/1 verdicts", () => {
  test("reproduce the 2026-10-27 record from its derived fields alone", () => {
    for (const row of PREVIOUS.resources) {
      const result = comparePin(row);
      expect(result.verdict).toBe(row.verdict);
      for (const [key, value] of Object.entries(row.comparison)) expect(result.comparison[key]).toEqual(value);
    }
    expect(countBy(PREVIOUS.resources, (row: Row) => comparePin(row).verdict)).toEqual({
      unchanged: 33,
      "license-changed": 1,
    });
    expect(comparePin(rowById(MCP))).toMatchObject({ verdict: "license-changed", dimensions: ["license-changed", "moved"] });
  });

  test("keep the published precedence when several dimensions change at once", () => {
    const base = rowById(MCP);
    const variant = (change: (row: Row) => void) => {
      const row = clone(base);
      change(row);
      return comparePin(row);
    };
    expect(PIN_PRECEDENCE).toEqual(["gone", "unknown", "gating-changed", "license-changed", "moved", "unchanged"]);
    expect(variant((row) => { row.observed.current = { request: 1, http_status: 404 }; }).verdict).toBe("gone");
    expect(variant((row) => { row.observed.pinned_revision = { resolves: false }; }).verdict).toBe("gone");
    expect(variant((row) => { row.observed.current = { request: 1, http_status: 429 }; }).verdict).toBe("unknown");
    expect(variant((row) => { row.observed.pinned_revision = { resolves: null }; }).dimensions)
      .toEqual(["unknown", "license-changed", "moved"]);
    expect(variant((row) => { row.observed.current.gated = "manual"; }).verdict).toBe("gating-changed");
    expect(variant((row) => { row.observed.current.disabled = true; }).verdict).toBe("gone");
    expect(variant((row) => { row.observed.current.license.assertion = "other"; }).verdict).toBe("moved");
    expect(variant((row) => {
      row.baseline.license = null;
      row.observed.current.license.assertion = "mit";
    }).verdict).toBe("license-changed");
  });

  test("since_previous rings only for what changed after the previous run", () => {
    const same = PREVIOUS.resources.map((row: Row) => compareSincePrevious(row, clone(row)));
    expect(countBy(same, (result: any) => result.verdict)).toEqual({ unchanged: 34 });

    const held = clone(rowById(MCP));
    held.since_previous = compareSincePrevious(rowById(MCP), held);
    expect(comparePin(held).verdict).toBe("license-changed");
    expect(rings(held)).toBe(false);

    const after = (change: (row: Row) => void, before: Row = rowById(MCP)) => {
      const row = clone(before);
      change(row);
      return compareSincePrevious(before, row).verdict;
    };
    expect(after((row) => { row.observed.current.sha = "2".repeat(40); })).toBe("moved");
    expect(after((row) => { row.observed.current.license.assertion = "mit"; })).toBe("license-changed");
    expect(after((row) => { row.observed.current.gated = "auto"; })).toBe("gating-changed");
    expect(after((row) => { row.observed.current = { request: 1, http_status: 404 }; })).toBe("gone");
    expect(after((row) => { row.observed.current = { request: null, http_status: null }; })).toBe("unknown");
    const gone = clone(rowById(MCP));
    gone.observed.current = { request: 1, http_status: 404 };
    expect(after(() => {}, gone)).toBe("unchanged");
    expect(compareSincePrevious(gone, rowById(MCP)).verdict).toBe("returned");
    expect(compareSincePrevious(undefined, rowById(MCP)).verdict).toBe("no_previous");
  });
});

describe("hf-pin-reread lease", () => {
  test("the shipped example is refused, and --plan makes no request", async () => {
    let fetches = 0;
    const fetch = () => {
      fetches += 1;
      throw new Error("no request is planned");
    };
    const printed: string[] = [];
    const warned: string[] = [];
    const deps = {
      fetch,
      env: {},
      git: cleanGit(),
      receiptTemplate: () => clone(TEMPLATE),
      now: () => START,
      stdout: (value: string) => printed.push(value),
      stderr: (value: string) => warned.push(value),
    };
    expect(await main(["--lease", EXAMPLE_LEASE, "--plan"], deps)).toBe(0);
    const plan = JSON.parse(printed.join(""));
    expect(plan.network_requests_made).toBe(0);
    expect(plan.would_start).toBe(false);
    expect(plan.refusals[0]).toStartWith("lease-example");
    expect(plan.budget).toEqual({ requests: 64, bytes: 5000000, elapsed_seconds: 900, retries: 0 });
    expect(plan.requests.pass_1).toHaveLength(34);
    expect(plan.requests.pass_2_if_previous_holds).toEqual([
      `https://huggingface.co/api/datasets/${MCP}/revision/bd9274ec0a3ba990d701f856942f12099ef37f61?expand=sha&expand=lastModified&expand=private&expand=gated&expand=disabled&expand=cardData&expand=tags`,
    ]);
    expect(plan.requests.planned_total_if_previous_holds).toBe(35);
    for (const url of [...plan.requests.pass_1, ...plan.requests.pass_2_if_previous_holds]) {
      expect(new URL(url).hostname).toBe("huggingface.co");
    }

    expect(await main(["--lease", EXAMPLE_LEASE], deps)).toBe(1);
    expect(warned.join("")).toContain("refused: lease-example");
    expect(fetches).toBe(0);
    expect(existsSync(JSON.parse(readFileSync(EXAMPLE_LEASE, "utf8")).outbox)).toBe(false);
  });

  test("an expired lease, a used outbox, a stop file or a dirty tree stops the run before any request", async () => {
    const cases: [string, (run: ReturnType<typeof setup>) => [string, Record<string, unknown>?]][] = [
      ["lease-expired", (run) => [leaseFor(run.dir, (lease) => { lease.lease_expires_at = "2026-11-01T00:00:00Z"; })]],
      ["outbox-exists", (run) => {
        rmSync(join(run.dir, "outbox"), { force: true });
        writeFileSync(join(run.dir, "outbox"), "");
        return [leaseFor(run.dir)];
      }],
      ["stop-file-present", (run) => {
        writeFileSync(join(run.dir, "STOP"), "");
        return [leaseFor(run.dir)];
      }],
      ["tree-dirty", (run) => [leaseFor(run.dir), { git: cleanGit(" M NEN.md\n") }]],
      ["previous-digest-mismatch", (run) => [leaseFor(run.dir, (lease) => {
        lease.scope.previous.receipt.sha256 = `sha256:${"0".repeat(64)}`;
      })]],
    ];
    for (const [code, prepare] of cases) {
      const run = setup();
      try {
        const [lease, extra = {}] = prepare(run);
        const before = listTree(run.dir);
        const result = await runLookback(lease, { ...run.deps, ...extra });
        expect(result.result).toBe("refused");
        expect(result.refusals.some((reason: string) => reason.startsWith(code))).toBe(true);
        expect(run.calls).toHaveLength(0);
        expect(listTree(run.dir)).toEqual(before);
      } finally {
        run.cleanup();
      }
    }
  });

  test("a lease cannot allow retries, another host or fields it does not define", () => {
    const base = JSON.parse(leaseFor("/tmp/kingdom-lookback-unused"));
    const invalid = (change: (lease: any) => void) => {
      const lease = clone(base);
      change(lease);
      try {
        parseLease(lease);
      } catch (error) {
        expect(error).toBeInstanceOf(LeaseError);
        return `${(error as LeaseError).field} ${(error as LeaseError).code}`;
      }
      return "accepted";
    };
    expect(invalid(() => {})).toBe("accepted");
    expect(invalid((lease) => { lease.budget.retries = 1; })).toBe("budget.retries must-be-zero");
    expect(invalid((lease) => { lease.scope.host = "mcp-tools-z-image-turbo.hf.space"; })).toBe("scope.host unsupported");
    expect(invalid((lease) => { lease.scope.resources[0].id = "../etc"; })).toBe("scope.resources[0].id invalid-repo-id");
    expect(invalid((lease) => { lease.token = "x"; })).toBe("lease unknown-field");
    expect(invalid((lease) => { lease.outbox = "relative/outbox"; })).toBe("outbox not-a-normal-absolute-path");
    expect(invalid((lease) => { lease.budget.requests = 65; })).toBe("budget.requests out-of-range");
  });
});

describe("hf-pin-reread run", () => {
  test("a full run writes only its outbox, scrubs tokens and rings nothing already seen", async () => {
    const run = setup(undefined, { receiptTemplate: defaultDeps().receiptTemplate });
    const watched = [join(ROOT, "records"), SKILL, join(ROOT, "bin")];
    const before = snapshot(watched);
    try {
      const lease = leaseFor(run.dir);
      writeFileSync(join(run.dir, "lease.json"), lease);
      const printed: string[] = [];
      const code = await main(["--lease", join(run.dir, "lease.json")], { ...run.deps, stdout: (value: string) => printed.push(value) });
      expect(code).toBe(0);
      expect(JSON.parse(printed.join(""))).toMatchObject({ result: "completed", requests: 35, rang: [] });

      expect(run.calls).toHaveLength(35);
      for (const { url, init } of run.calls) {
        expect(new URL(url).hostname).toBe("huggingface.co");
        expect(init.redirect).toBe("manual");
        expect(init.headers).toEqual({ "User-Agent": "Mozilla/5.0", Accept: "application/json" });
      }
      expect(run.calls.filter(({ url }) => url.includes("/revision/")).map(({ url }) => new URL(url).pathname))
        .toEqual([`/api/datasets/${MCP}/revision/bd9274ec0a3ba990d701f856942f12099ef37f61`]);
      expect(run.env.HF_TOKEN).toBeUndefined();

      expect(listTree(run.dir)).toEqual(["lease.json", ...OUTBOX_FILES.map((name) => `outbox/${name}`)].sort());
      expect(snapshot(watched)).toBe(before);
      const result = outbox(run.dir);
      for (const name of OUTBOX_FILES) {
        const text = readFileSync(join(result.root, name), "utf8");
        expect(text).not.toContain("hf_sentinel_must_not_escape");
        expect(text).not.toContain(run.dir);
      }

      expect(result.observations.verdict_method).toBe("hf-pin-drift/1");
      expect(result.observations.counts).toEqual({ unchanged: 33, "license-changed": 1 });
      expect(result.observations.since_previous_counts).toEqual({ unchanged: 34 });
      expect(result.requests).toHaveLength(35);
      expect(result.note).toContain("Nothing changed since the previous run.");
      expect(result.note).toContain(`| dataset \`${MCP}\` | license-changed | unchanged | hold |`);

      const receipt = result.receipt;
      expect(receipt.state).toBe("draft");
      expect(receipt.ability_revision).toBe(HEAD);
      expect(receipt.result).toBe("completed");
      expect(receipt.inputs.slice(0, 2).map((input: any) => [input.path, input.digest])).toEqual([
        [`${RECORD}/karma-receipt.json`, fileDigest(join(ROOT, RECORD, "karma-receipt.json"))],
        [`${RECORD}/evidence/observations.json`, fileDigest(join(ROOT, RECORD, "evidence", "observations.json"))],
      ]);
      expect(receipt.inputs.every((input: any) => input.assurance === "untrusted_evidence")).toBe(true);
      expect(receipt.inputs.filter((input: any) => input.boundary === "remote_public")).toHaveLength(35);
      expect(receipt.outputs.map((output: any) => output.digest)).toEqual(
        ["lease.json", "evidence/requests.jsonl", "evidence/observations.json"].map((name) => fileDigest(join(result.root, name))),
      );
      expect(result.note).toContain(fileDigest(join(result.root, "karma-receipt.json")));
      expect(statSync(join(result.root, "karma-receipt.json")).size).toBeLessThan(64 * 1024);

      // A draft is scaffolding: the suite verifier refuses it until a person
      // finalizes it, and then accepts it unchanged otherwise.
      const verify = (path: string) => Bun.spawnSync({
        cmd: [process.execPath, join(ROOT, "bin", "nen.mjs"), "verify-receipt", path, "--json"],
        cwd: ROOT,
        stdout: "pipe",
        stderr: "pipe",
        env: { PATH: process.env.PATH ?? "" },
      });
      const draft = verify(join(result.root, "karma-receipt.json"));
      expect(JSON.parse(draft.stdout.toString()).issues.map((issue: any) => issue.code)).toEqual(["draft-receipt"]);
      const final = join(run.dir, "final-receipt.json");
      writeFileSync(final, `${JSON.stringify({ ...receipt, state: "final" }, null, 2)}\n`);
      const verified = verify(final);
      expect(JSON.parse(verified.stdout.toString())).toMatchObject({ valid: true, issues: [] });
      expect(verified.exitCode).toBe(0);
    } finally {
      run.cleanup();
    }
  });

  test("the request budget stops pass 2 without a retry", async () => {
    const run = setup();
    try {
      const summary = await runLookback(leaseFor(run.dir, (lease) => { lease.budget.requests = 34; }), run.deps);
      expect(summary).toMatchObject({ result: "partial", stop: "requests-budget-spent", requests: 34 });
      expect(run.calls).toHaveLength(34);
      const row = outbox(run.dir).observations.resources.find((item: Row) => item.id === MCP);
      expect(row.verdict).toBe("unknown");
      expect(row.dimensions).toEqual(["unknown", "license-changed", "moved"]);
    } finally {
      run.cleanup();
    }
  });

  test("the byte and elapsed budgets stop a run where they are spent", async () => {
    const bytes = setup();
    try {
      const summary = await runLookback(leaseFor(bytes.dir, (lease) => { lease.budget.bytes = 2500; }), bytes.deps);
      expect(summary.result).toBe("partial");
      expect(summary.stop).toBe("bytes-budget-spent");
      expect(bytes.calls.length).toBeLessThan(34);
      const result = outbox(bytes.dir);
      expect(result.observations.run.used.bytes).toBeLessThanOrEqual(2500 + 2000);
      expect(result.observations.counts.unknown).toBe(34 - result.requests.filter((log: any) => !log.stop).length);
      expect(result.receipt.uncertainty.at(-1)).toContain("bytes-budget-spent");
    } finally {
      bytes.cleanup();
    }

    const elapsed = setup(() => {
      elapsed.clock.t += 1000;
      return null;
    });
    try {
      const summary = await runLookback(leaseFor(elapsed.dir, (lease) => { lease.budget.elapsed_seconds = 3; }), elapsed.deps);
      expect(summary).toMatchObject({ result: "partial", stop: "elapsed-budget-spent", requests: 3 });
      expect(elapsed.calls).toHaveLength(3);
    } finally {
      elapsed.cleanup();
    }
  });

  test("HTTP 429 stops the run at once and nothing is retried", async () => {
    const run = setup((_url, _row, _pinned, call) => (call === 3 ? json({ error: "rate limited" }, 429) : null));
    try {
      const printed: string[] = [];
      writeFileSync(join(run.dir, "lease.json"), leaseFor(run.dir));
      expect(await main(["--lease", join(run.dir, "lease.json")], { ...run.deps, stdout: (value: string) => printed.push(value) })).toBe(3);
      expect(run.calls).toHaveLength(3);
      expect(JSON.parse(printed.join(""))).toMatchObject({ result: "partial", stop: "http-429", requests: 3 });
      const result = outbox(run.dir);
      expect(result.requests.map((log: any) => log.http_status)).toEqual([200, 200, 429]);
      expect(result.requests[2].stop).toBe("http-429");
      expect(result.observations.counts).toEqual({ unchanged: 2, unknown: 32 });
      expect(result.receipt.observed_effects[0]).toContain("The run stopped (http-429) and nothing was retried.");
    } finally {
      run.cleanup();
    }
  });

  test("a 5xx, a non-JSON body or a missing sha each stop the run", async () => {
    const answers: [string, () => Response][] = [
      ["http-5xx", () => json({ error: "unavailable" }, 503)],
      ["non-json-body", () => new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } })],
      ["missing-sha", () => json({ id: "x", private: false })],
    ];
    for (const [reason, answer] of answers) {
      const run = setup((_url, _row, _pinned, call) => (call === 2 ? answer() : null));
      try {
        const summary = await runLookback(leaseFor(run.dir), run.deps);
        expect(summary).toMatchObject({ result: "partial", stop: reason, requests: 2 });
        expect(run.calls).toHaveLength(2);
      } finally {
        run.cleanup();
      }
    }
  });

  test("a stop file that appears mid-run cancels before the next request", async () => {
    const run = setup((_url, _row, _pinned, call) => {
      if (call === 2) writeFileSync(join(run.dir, "STOP"), "");
      return null;
    });
    try {
      const summary = await runLookback(leaseFor(run.dir), run.deps);
      expect(summary).toMatchObject({ result: "cancelled", stop: "stop-file", requests: 2 });
      expect(run.calls).toHaveLength(2);
    } finally {
      run.cleanup();
    }
  });

  test("a resource that is gone is recorded, rings, and the run goes on", async () => {
    const run = setup((_url, row) => (row.id === "locuslab/TOFU" ? json({ error: "Repository not found" }, 404) : null));
    try {
      const summary = await runLookback(leaseFor(run.dir), run.deps);
      expect(summary).toMatchObject({ result: "completed", requests: 35, rang: ["dataset locuslab/TOFU: gone"] });
      const result = outbox(run.dir);
      expect(result.observations.counts).toEqual({ unchanged: 32, "license-changed": 1, gone: 1 });
      expect(result.note).toContain("| dataset `locuslab/TOFU` | gone | head `324592d8…`, public, `mit` | HTTP 404 |");
      expect(result.note).toContain("| dataset `locuslab/TOFU` | gone | gone | hold |");
    } finally {
      run.cleanup();
    }
  });
});

const linesOf = (path: string, from: number, to: number) =>
  readFileSync(path, "utf8").split("\n").slice(from - 1, to).join("\n");
const relativeLinks = (path: string) =>
  [...readFileSync(path, "utf8").matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)]
    .map((match) => match[1])
    .filter((target) => !/^[a-z]+:/i.test(target));

describe("reality crossing", () => {
  const CROSSING = join(SKILL, "references", "reality-crossing.md");

  test("quotes Yu and the documents it leans on exactly", () => {
    const crossing = readFileSync(CROSSING, "utf8");
    expect(crossing).toContain("\"1. go for b. 2. 用 digest 連住 3. defer 4. yes please 5. yes\"");
    expect(linesOf(join(SKILL, "references", "expedition-charter.md"), 7, 7))
      .toContain("The exact request, policy, or scoped authorization");
    const chain = linesOf(join(ROOT, "references", "reality-influence-map.md"), 40, 56);
    for (const step of ["expression", "-> proposal", "-> decision", "-> attempt / execution", "-> causal assessment", "-> normative assessment", "-> repair"]) {
      expect(chain).toContain(step);
    }
    expect(crossing).toContain("causal assessment,\nnormative assessment and repair");
    expect(readFileSync(join(SKILL, "SKILL.md"), "utf8")).toContain("](references/reality-crossing.md)");
    for (const path of [CROSSING, join(SKILL, "SKILL.md")]) {
      for (const target of relativeLinks(path)) expect(existsSync(join(dirname(path), target))).toBe(true);
    }
  });
});

describe("the first decision record", () => {
  const DECISION = join(ROOT, "records", "2026-10-29-mcp-ecosystem-sample-defer");

  test("binds the real digests of the evidence the defer rests on", () => {
    const decision = JSON.parse(readFileSync(join(DECISION, "decision.json"), "utf8"));
    expect(decision).toMatchObject({
      decision: "defer",
      decided_on: "2026-10-29",
      words: "3. defer",
      effect_class: "none",
      reversible: true,
      chain: { covers: ["proposal", "decision"] },
      karma: { kg_proposal: null },
      target: { resource: { kind: "dataset", id: MCP }, pinned_revision: "bd9274ec0a3ba990d701f856942f12099ef37f61" },
    });
    for (const subject of decision.subject) expect(fileDigest(join(ROOT, subject.path))).toBe(subject.sha256);
    expect(decision.karma.kingdom_karma_receipts).toEqual([fileDigest(join(ROOT, RECORD, "karma-receipt.json"))]);
    expect(decision.recorded_by).toContain("no DID");
    expect(decision.identity).toContain("does not claim a two-person rule");

    const readme = readFileSync(join(DECISION, "README.md"), "utf8");
    expect(readme).toContain(fileDigest(join(DECISION, "decision.json")));
    expect(readme).toContain("\"3. defer\"");
    for (const subject of decision.subject) expect(readme).toContain(subject.sha256);
    expect(linesOf(join(ROOT, RECORD, "RETURN-NOTE.md"), 52, 56))
      .toContain("Whether to\n  re-pin is a documentation decision and was not made here.");
    for (const target of relativeLinks(join(DECISION, "README.md"))) expect(existsSync(join(DECISION, target))).toBe(true);
  });
});
