import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "bun:test";

import {
  STRAND_OBSERVATION_MEMBRANE_DIGEST,
  STRAND_OBSERVATION_MEMBRANE_PATH,
  STRAND_OBSERVATION_MEMBRANE_SCHEMA_PATH,
  STRAND_OBSERVATION_ROBOTS_BYTE_SHA256,
  evaluateStrandObservationMembrane,
  isPublicStrandObservationAddress,
  loadStrandObservationMembrane,
  observeStrandObservationMembraneLive,
  robotsAllowsPath,
  runStrandObservationMembraneFalsifiers,
  simulateStrandObservationMembrane,
  strandObservationMembraneDigest,
  strandObservationMembranePublicDiscovery,
  verifyStrandObservationMembrane,
  verifyStrandObservationMembraneArtifactPins,
  type StrandObservationLiveDependencies,
  type StrandObservationRawLiveResponse,
} from "../bin/strand-observation-membrane.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROBOTS = readFileSync(join(ROOT, "pages-content/robots.txt"));
const sha256 = (bytes: Uint8Array | string): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

function resign(value: any): any {
  value.integrity.digest = strandObservationMembraneDigest(value);
  return value;
}

function response(
  request: Parameters<NonNullable<StrandObservationLiveDependencies["transact"]>>[0],
  overrides: Partial<StrandObservationRawLiveResponse> = {},
): StrandObservationRawLiveResponse {
  const retained = request.retain_body;
  const source = retained ? ROBOTS : Buffer.from("ok");
  return {
    status: 200,
    headers: { "content-type": retained ? "text/plain" : "application/json", "content-encoding": "" },
    body: retained ? source : null,
    body_bytes: source.byteLength,
    body_sha256: sha256(source),
    elapsed_milliseconds: 10,
    ...overrides,
  };
}

describe("STRAND Observation Membrane core", () => {
  test("recomputes the closed canonical profile, simulation, and negative effects", () => {
    const record = loadStrandObservationMembrane();
    const evaluation = evaluateStrandObservationMembrane(record);
    expect(evaluation.valid).toBe(true);
    expect(evaluation.issues).toEqual([]);
    expect(evaluation.checks).toHaveLength(9);
    expect(evaluation.checks.every(({ status }) => status === "PASS")).toBe(true);
    expect(evaluation.effects).toEqual({
      network_requests: 0,
      storage_writes: 0,
      subprocesses: 0,
      mcp_invocation: false,
      ability_invocation: false,
      nen_invocation: false,
      kingdom_karma_receipt_created: false,
      zerone_event_created: false,
      person_or_content_score_created: false,
      medical_or_dmt_action: false,
      entity_truth_claim: false,
      authority_effect: "NONE",
      deployment_or_publication_trigger: false,
    });
    expect(simulateStrandObservationMembrane(record)).toEqual({
      protocol: "kingdom.strand-observation-simulation/0.1",
      fixture_id: record.synthetic_fixture.fixture_id,
      valid: true,
      ...record.synthetic_fixture.expected,
    });
    expect(strandObservationMembraneDigest(record)).toBe(evaluation.input_digest);
    expect(strandObservationMembranePublicDiscovery(record)).toMatchObject({
      protocol: record.protocol,
      membrane_id: record.membrane_id,
      mode: "SAFE_OBSERVATION_ACTIVE",
      activations: { background_watch: false, invocation: "EXPLICIT_LOCAL_CALL_ONLY" },
      effects: {
        remote_server_or_provider_logging_may_occur: true,
        requested_remote_application_state_change: false,
        authority_change: false,
      },
    });
    expect(runStrandObservationMembraneFalsifiers(record).every(({ invalid }) => invalid)).toBe(true);
    expect(record.integrity.audit_state).toBe("FROZEN");
    expect(strandObservationMembraneDigest(record)).toBe(STRAND_OBSERVATION_MEMBRANE_DIGEST);
    expect(verifyStrandObservationMembraneArtifactPins()).toMatchObject({
      audit_state: "FROZEN",
      valid: true,
      issues: [],
    });
  });

  test("rejects resigned contract widening and hostile non-JSON containers without throwing", () => {
    const canonical = JSON.parse(readFileSync(STRAND_OBSERVATION_MEMBRANE_PATH, "utf8"));
    const mutations: Array<(value: any) => void> = [
      (value) => { value.fixed_origin.caller_supplied_url = true; },
      (value) => { value.live_limits.maximum_transactions = 5; },
      (value) => { value.live_limits.redirect_mode = "FOLLOW"; },
      (value) => { value.route_plan[1].path = "https://elsewhere.invalid/"; },
      (value) => { value.effect_boundary.karma_or_karma_receipt_write = true; },
      (value) => { value.effect_boundary.medical_or_dmt_action = true; },
      (value) => { value.effect_boundary.external_entity_truth_claim = true; },
      (value) => { value.effect_boundary.authority_change = true; },
      (value) => { value.integrity.algorithm = "md5"; },
      (value) => { value.integrity.digest_field_treated_as = 123; },
    ];
    for (const mutate of mutations) {
      const candidate = structuredClone(canonical);
      mutate(candidate);
      resign(candidate);
      expect(verifyStrandObservationMembrane(candidate).length).toBeGreaterThan(0);
      expect(evaluateStrandObservationMembrane(candidate).valid).toBe(false);
      expect(() => strandObservationMembranePublicDiscovery(candidate)).toThrow();
    }
    const hostile: unknown[] = [
      null,
      1,
      Object.create(null),
      new Proxy({}, { ownKeys() { throw new Error("trap"); } }),
      new Proxy(structuredClone(canonical), {
        get(target, property, receiver) {
          if (property === "integrity") throw new Error("stateful integrity trap");
          return Reflect.get(target, property, receiver);
        },
      }),
      (() => { const value: any = {}; value.self = value; return value; })(),
      (() => { const value: any = {}; Object.defineProperty(value, "x", { get() { throw new Error("getter"); }, enumerable: true }); return value; })(),
    ];
    for (const candidate of hostile) {
      expect(() => evaluateStrandObservationMembrane(candidate)).not.toThrow();
      const evaluation = evaluateStrandObservationMembrane(candidate);
      expect(evaluation.valid).toBe(false);
      expect(evaluation.checks.every(({ status }) => status === "FAIL")).toBe(true);
      expect(evaluation.effects.network_requests).toBe(0);
    }
  });

  test("uses strict local-file handling and validates under Draft 2020-12 when available", () => {
    const directory = mkdtempSync(join(tmpdir(), "strand-observation-test."));
    try {
      const duplicate = join(directory, "duplicate.json");
      writeFileSync(duplicate, '{"a":1,"a":2}');
      expect(() => loadStrandObservationMembrane(duplicate)).toThrow();
      const symlink = join(directory, "record-link.json");
      symlinkSync(STRAND_OBSERVATION_MEMBRANE_PATH, symlink);
      expect(lstatSync(symlink).isSymbolicLink()).toBe(true);
      expect(() => loadStrandObservationMembrane(symlink)).toThrow(/non-symlink/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }

    const python = process.env.PHENOMENA_DEEP_SCHEMA_PYTHON;
    if (python) {
      const run = Bun.spawnSync({
        cmd: [python, "-c", [
          "import json,sys",
          "from jsonschema import Draft202012Validator,FormatChecker",
          "s=json.load(open(sys.argv[1],encoding='utf-8'))",
          "v=json.load(open(sys.argv[2],encoding='utf-8'))",
          "Draft202012Validator.check_schema(s)",
          "e=list(Draft202012Validator(s,format_checker=FormatChecker()).iter_errors(v))",
          "print(len(e))",
        ].join(";"), STRAND_OBSERVATION_MEMBRANE_SCHEMA_PATH, STRAND_OBSERVATION_MEMBRANE_PATH],
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(run.exitCode).toBe(0);
      expect(run.stdout.toString().trim()).toBe("0");
    }
  });

  test("fails closed on special-purpose IP space and accepts ordinary public examples", () => {
    for (const address of [
      "0.0.0.0", "10.0.0.1", "100.64.0.1", "127.0.0.1", "169.254.1.1",
      "172.16.0.1", "192.0.0.1", "192.0.2.1", "192.168.1.1", "198.18.0.1",
      "198.51.100.1", "203.0.113.1", "224.0.0.1", "255.255.255.255", "::",
      "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1", "2001:2::1",
      "2001:db8::1", "2002::1", "3fff::1", "ff00::1", "not-an-ip",
    ]) expect(isPublicStrandObservationAddress(address)).toBe(false);
    for (const address of ["1.1.1.1", "8.8.8.8", "93.184.216.34", "2606:4700:4700::1111"])
      expect(isPublicStrandObservationAddress(address)).toBe(true);
  });

  test("applies the exact reviewed robots gate without turning it into authority", () => {
    expect(sha256(ROBOTS)).toBe(STRAND_OBSERVATION_ROBOTS_BYTE_SHA256);
    for (const path of ["/sitemap.xml", "/kingdom.json", "/observations/strand-observation-membrane-2026-08-16.json"])
      expect(robotsAllowsPath(ROBOTS, path)).toBe(true);
    expect(robotsAllowsPath("User-agent: *\nDisallow: /\n", "/kingdom.json")).toBe(false);
    expect(robotsAllowsPath("User-agent: KingdomStrandObservation\nDisallow: /private\nAllow: /private/open\n", "/private/open/item")).toBe(true);
  });

  test("completes only the four fixed routes, preserves HTTP-start spacing, and emits no bodies", async () => {
    let clock = 0;
    let resolutions = 0;
    const starts: number[] = [];
    const requests: any[] = [];
    const report = await observeStrandObservationMembraneLive({
      now: () => clock,
      sleep: async (milliseconds) => { clock += milliseconds; },
      resolve: async () => {
        clock += resolutions++ === 0 ? 9_000 : 10;
        return [{ address: "93.184.216.34", family: 4 }];
      },
      transact: async (request) => {
        starts.push(clock);
        requests.push(request);
        clock += 10;
        return response(request);
      },
    });
    expect(report.outcome).toBe("COMPLETE");
    expect(report.stop_code).toBeNull();
    expect(report.totals).toMatchObject({ http_requests: 4, dns_resolution_attempts: 4, transactions_reported: 4, redirects_followed: 0, retries: 0 });
    expect(starts.slice(1).map((start, index) => start - starts[index]!)).toEqual([2_000, 2_000, 2_000]);
    expect(requests.map(({ hostname, port, path, method, retain_body }) => ({ hostname, port, path, method, retain_body }))).toEqual([
      { hostname: "thekingdom.dev", port: 443, path: "/robots.txt", method: "GET", retain_body: true },
      { hostname: "thekingdom.dev", port: 443, path: "/sitemap.xml", method: "GET", retain_body: false },
      { hostname: "thekingdom.dev", port: 443, path: "/kingdom.json", method: "GET", retain_body: false },
      { hostname: "thekingdom.dev", port: 443, path: "/observations/strand-observation-membrane-2026-08-16.json", method: "GET", retain_body: false },
    ]);
    expect(JSON.stringify(report)).not.toContain(ROBOTS.toString("utf8"));
    expect(report.effects).toMatchObject({
      response_bodies_emitted: false,
      local_storage_writes: 0,
      remote_server_or_provider_logging_may_occur: true,
      karma_or_nen_or_zerone_write: false,
      authority_effect: "NONE",
    });
  });

  test("stops on mixed DNS, robots drift, redirects, non-success, encoding, and byte lies", async () => {
    const run = async (options: {
      resolve?: StrandObservationLiveDependencies["resolve"];
      alter?: (request: any, raw: StrandObservationRawLiveResponse, index: number) => StrandObservationRawLiveResponse;
    }) => {
      let clock = 0;
      let index = 0;
      let calls = 0;
      const report = await observeStrandObservationMembraneLive({
        now: () => clock,
        sleep: async (milliseconds) => { clock += milliseconds; },
        resolve: options.resolve ?? (async () => [{ address: "93.184.216.34", family: 4 }]),
        transact: async (request) => {
          calls += 1;
          clock += 10;
          const raw = response(request);
          return options.alter?.(request, raw, index++) ?? raw;
        },
      });
      return { report, calls };
    };

    const mixed = await run({ resolve: async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ] });
    expect(mixed).toMatchObject({ calls: 0, report: { outcome: "REFUSED_OR_INCOMPLETE", stop_code: "DNS_NOT_ALL_PUBLIC" } });

    const robotsDrift = await run({ alter: (request, raw, index) => index === 0 ? {
      ...raw, body: Buffer.from("User-agent: *\nAllow: /\n"), body_bytes: 23,
      body_sha256: sha256("User-agent: *\nAllow: /\n"),
    } : raw });
    expect(robotsDrift).toMatchObject({ calls: 1, report: { stop_code: "ROBOTS_GATE_CLOSED" } });

    const redirect = await run({ alter: (_request, raw, index) => index === 1 ? { ...raw, status: 302 } : raw });
    expect(redirect).toMatchObject({ calls: 2, report: { stop_code: "REDIRECT_REFUSED" } });
    expect(redirect.report.totals.redirects_followed).toBe(0);

    const nonSuccess = await run({ alter: (_request, raw, index) => index === 1 ? { ...raw, status: 503 } : raw });
    expect(nonSuccess).toMatchObject({ calls: 2, report: { stop_code: "HTTP_NON_SUCCESS" } });

    const encoding = await run({ alter: (_request, raw) => ({ ...raw, headers: { ...raw.headers, "content-encoding": "gzip" } }) });
    expect(encoding).toMatchObject({ calls: 1, report: { stop_code: "INVALID_OR_OVERSIZED_RESPONSE" } });

    const overflow = await run({ alter: (_request, raw) => ({ ...raw, body_bytes: 1_048_577 }) });
    expect(overflow).toMatchObject({ calls: 1, report: { stop_code: "INVALID_OR_OVERSIZED_RESPONSE" } });
  });

  test("hard-bounds a stalled DNS operation and exposes no automatic runtime hook", async () => {
    let nowCalls = 0;
    let transactCalls = 0;
    const report = await observeStrandObservationMembraneLive({
      now: () => nowCalls++ === 0 ? 0 : 59_999,
      sleep: async () => {},
      resolve: async () => await new Promise(() => {}),
      transact: async (request) => { transactCalls += 1; return response(request); },
    });
    expect(report).toMatchObject({ outcome: "REFUSED_OR_INCOMPLETE", stop_code: "DNS_LOOKUP_FAILED" });
    expect(transactCalls).toBe(0);
    expect(report.totals).toMatchObject({ http_requests: 0, dns_resolution_attempts: 1 });

    const source = readFileSync(join(ROOT, "bin/strand-observation-membrane.ts"), "utf8");
    for (const forbidden of ["setInterval(", "writeFileSync", "appendFile", "Bun.write", "spawn(", "cron", "serviceWorker", "ability.json"])
      expect(source).not.toContain(forbidden);
    expect(source).toContain("response.socket.remoteAddress");
    expect(source).toContain('if (import.meta.main)');

    const extraTarget = Bun.spawnSync({
      cmd: ["bun", "bin/strand-observation-membrane.ts", "observe-live", "https://example.com", "--json"],
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(extraTarget.exitCode).toBe(1);
    expect(JSON.parse(extraTarget.stdout.toString())).toMatchObject({ valid: false, error: "unexpected positional argument" });
  });
});
