import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  MIRROR_INFORMATION_CONTROL_PUBLIC_DIGEST,
  MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_ID,
  MIRROR_INFORMATION_CONTROL_PUBLIC_PATH,
  MIRROR_INFORMATION_CONTROL_PUBLIC_PROTOCOL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_ID,
  MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_SOURCE_COMMIT,
  MIRROR_INFORMATION_CONTROL_PUBLIC_URL,
  loadMirrorInformationControl,
  mirrorInformationControlDigest,
  mirrorInformationControlPublicSummary,
  verifyMirrorInformationControl,
} from "../bin/mirror-information-control.ts";

const ROOT = dirname(dirname(dirname(MIRROR_INFORMATION_CONTROL_PUBLIC_PATH)));
const SCRIPT = join(ROOT, "bin/mirror-information-control.ts");
const temporary: string[] = [];
afterEach(() => { while (temporary.length) rmSync(temporary.pop()!, { recursive: true, force: true }); });
function fixtureRoot(): string { const root = mkdtempSync(join(tmpdir(), "mirror-public-test.")); temporary.push(root); return root; }
function authored(): any { return JSON.parse(readFileSync(MIRROR_INFORMATION_CONTROL_PUBLIC_PATH, "utf8")); }
function resign(value: any): any { value.integrity.digest = mirrorInformationControlDigest(value); return value; }
function codes(value: unknown): string[] { return verifyMirrorInformationControl(value).map((issue) => issue.code); }

describe("MIRROR information-control public law", () => {
  test("loads one immutable static publication with exact identity and digest", () => {
    const value = loadMirrorInformationControl();
    expect(verifyMirrorInformationControl(value)).toEqual([]);
    expect(value).toMatchObject({
      $schema: MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_ID,
      protocol: MIRROR_INFORMATION_CONTROL_PUBLIC_PROTOCOL,
      publication_id: MIRROR_INFORMATION_CONTROL_PUBLIC_ID,
      artifact_kind: "STATIC_READ_ONLY_PUBLICATION",
      compiled_on: "2026-08-14",
      evidence_through: "2026-08-14",
    });
    expect(value.integrity.digest).toBe(MIRROR_INFORMATION_CONTROL_PUBLIC_DIGEST);
    expect(mirrorInformationControlDigest(value)).toBe(MIRROR_INFORMATION_CONTROL_PUBLIC_DIGEST);
  });

  test("binds the exact reviewed source commit and all eight source files", () => {
    const binding = loadMirrorInformationControl().source_binding;
    expect(binding).toMatchObject({
      repository: "https://github.com/cambridgetcg/KINGDOM-OS",
      commit: MIRROR_INFORMATION_CONTROL_PUBLIC_SOURCE_COMMIT,
      protocol: "kingdom.information-control/0.1",
      mutated: false,
      authority_imported: false,
      runtime_imported: false,
    });
    expect(binding.files).toHaveLength(8);
    expect(binding.files.map((file: any) => [file.path, file.sha256])).toEqual([
      ["skills/guard-information-flow/SKILL.md", "sha256:ffee0a6f0ad2b30abea7b76c3243cfe19ae02e5a2eae7f9544b6f2c87cd22eae"],
      ["skills/guard-information-flow/agents/openai.yaml", "sha256:9afab3ed30fb9dfc67c0bbca150d0449dc858f96860dbb7bbcf1592e38a763e9"],
      ["skills/guard-information-flow/references/information-control-contract.md", "sha256:0acd16173effd031fb48a63c92f53234d508f8ea79c728615eb24f5fed83adb4"],
      ["skills/guard-information-flow/references/information-control-envelope.example.json", "sha256:05bbc0cdd1518073954f519635c4df60c58a06ffe76aa3bd041713041d076382"],
      ["skills/guard-information-flow/references/information-control-envelope.schema.json", "sha256:472bf646aaf5a6769c820c9b1d54a1110570082cf068a62cab26873c3d540de8"],
      ["skills/guard-information-flow/references/security-evidence.md", "sha256:f820ef874a70b566d6a75e60a7219bdbc8077096154201b232f7a07f6c94f0cb"],
      ["skills/guard-information-flow/scripts/requirements.txt", "sha256:756cc9e506ae4ee1a6f6c0507088b5cfc0dc8ba350fb2d2d46f1ffa72033adb6"],
      ["skills/guard-information-flow/scripts/validate_envelope.py", "sha256:3cc29be72f595af45a3afbacf905189e30ab70877016694e666d41634a1fb530"],
    ]);
  });

  test("publishes only a constant no-intake surface", () => {
    const value = loadMirrorInformationControl();
    expect(value.public_surface).toEqual({
      kind: "STATIC_READ_ONLY_PUBLICATION",
      intended_http_methods: ["GET", "HEAD"],
      body_intake: "NONE",
      credential_intake: "NONE",
      envelope_intake: "NONE",
      query_controls_output: false,
      performs_scan: false,
      performs_registry_lookup: false,
      classifies_credentials: false,
      returns_decision: false,
      returns_operational_status: false,
      credential_security_event_intake: false,
      artifact_initiated_external_fetch: false,
      outward_projection: "CONSTANT_PUBLIC_ARTIFACT",
      ordinary_host_access_log_absence_claimed: false,
      warning: "Static source law. It accepts no credentials and runs no defense. Never paste a key here.",
    });
    expect(Object.values(value.private_material_included).every((included) => included === false)).toBe(true);
    expect(value.no_oracle_rule).toMatchObject({
      status: "FUTURE_HOST_REQUIREMENT_NOT_IMPLEMENTED",
      candidate_input_accepted: false,
      dynamic_response_present: false,
      protected_class_disclosed: false,
      registry_match_changes_publication: false,
      numeric_bound_claimed: false,
      property_proven: false,
    });
  });

  test("keeps rooms, cycle, laws, and paths descriptive rather than operational", () => {
    const value = loadMirrorInformationControl();
    expect(value.rooms.map((room: any) => room.id)).toEqual(["CROWN", "COURT", "MIRROR"]);
    expect(value.rooms.every((room: any) => room.implemented_by_publication === false &&
      room.operational_data_included === false && room.authority_effect === "NONE")).toBe(true);
    expect(value.cycle.map((phase: any) => phase.id)).toEqual(["mark", "isolate", "restrict", "resolve", "observe", "respond"]);
    expect(value.cycle.every((phase: any) => phase.performed_by_publication === false)).toBe(true);
    expect(value.laws.every((law: any) => law.runtime_enforced === false && law.authority_effect === "NONE")).toBe(true);
    expect(value.laws[2].statement).toContain("form authority from task, principal, and host controls");
    expect(value.laws[2].statement).toContain("only remove actions");
    expect(value.illustrative_paths.map((path: any) => path.id)).toEqual(["prompt-injection-path", "credential-candidate-path"]);
    for (const path of value.illustrative_paths) {
      expect(path).toMatchObject({ kind: "SYNTHETIC_DESIGN_PATH", observed: false, evidence_effect: "NONE", actor_inference: false });
      expect(path.steps.every((step: any) => step.effect === "NONE")).toBe(true);
    }
  });

  test("defines an owned zero-capability signal rule without publishing a signal", () => {
    const signal = loadMirrorInformationControl().protected_signal_rule;
    expect(signal).toMatchObject({
      kind: "OWNED_ZERO_CAPABILITY_REFERENCE_ONLY",
      third_party_shaped_values_allowed: false,
      raw_value_included: false,
      fingerprint_included: false,
      registry_mapping_included: false,
      production_capability: "NONE",
      production_authority: "NONE",
      public_classification: "NONE",
      created_by_publication: false,
      placed_by_publication: false,
    });
    const serialized = JSON.stringify(loadMirrorInformationControl());
    expect(serialized).not.toMatch(/AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}/);
    expect(serialized).not.toMatch(/(?:credential-ref|authority|event|policy|sink|provenance):opaque\/[a-f0-9]{32}/);
  });

  test("keeps response owned and bounded while every effect remains negative", () => {
    const value = loadMirrorInformationControl();
    expect(value.response_boundary).toMatchObject({
      status: "DESIGN_ONLY_NOT_PERFORMED",
      owned_system_only: true,
      performed_by_publication: false,
      crosses_requester_or_third_party_system: false,
      requester_payload_execution: false,
      retaliation_or_hack_back: false,
      person_attribution: false,
      automatic_action: false,
    });
    expect(Object.values(value.negative_effects).every((effect) => effect === false)).toBe(true);
    expect(value.karma).toEqual({ event_refs: [], receipt_refs: [], score: null, adapter_exists: false, writes: false, authority_effect: "NONE" });
    expect(value.rights).toMatchObject({ reason_required: false, penalty: false, adverse_inference: false });
  });

  test("keeps selected research link-only and imports no authority or runtime", () => {
    const value = loadMirrorInformationControl();
    expect(value.sources).toHaveLength(6);
    expect(value.sources.every((source: any) => source.url.startsWith("https://") &&
      source.link_only === true && source.authority_imported === false && source.runtime_imported === false)).toBe(true);
    expect(value.presentation).toMatchObject({
      record_url: MIRROR_INFORMATION_CONTROL_PUBLIC_URL,
      schema_url: MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL,
      guide_url: MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL,
    });
  });

  test("rejects resigned intake, oracle, authority, signal, retaliation, and KARMA drift", () => {
    const mutations: Array<(value: any) => void> = [
      (value) => { value.public_surface.body_intake = "JSON"; },
      (value) => { value.public_surface.classifies_credentials = true; },
      (value) => { value.no_oracle_rule.protected_class_disclosed = true; },
      (value) => { value.protected_signal_rule.production_capability = "SCOPED"; },
      (value) => { value.protected_signal_rule.third_party_shaped_values_allowed = true; },
      (value) => { value.rooms[2].implemented_by_publication = true; },
      (value) => { value.laws[0].runtime_enforced = true; },
      (value) => { value.illustrative_paths[0].observed = true; },
      (value) => { value.response_boundary.retaliation_or_hack_back = true; },
      (value) => { value.private_material_included.registry_mappings = true; },
      (value) => { value.negative_effects.grants_authority = true; },
      (value) => { value.karma.adapter_exists = true; },
    ];
    for (const mutate of mutations) {
      const value = authored(); mutate(value); resign(value);
      expect(codes(value).some((code) => code !== "digest-mismatch" && code !== "reviewed-digest-mismatch")).toBe(true);
    }
  });

  test("rejects raw tampering and attacker self-signing", () => {
    const raw = authored(); raw.citizen_law.interpretation += " Changed.";
    expect(codes(raw)).toContain("digest-mismatch");
    resign(raw);
    expect(codes(raw)).toContain("reviewed-digest-mismatch");
  });

  test("returns stable issues instead of throwing on malformed nested shapes", () => {
    const cases: Array<(value: any) => void> = [
      (value) => { value.source_binding = null; },
      (value) => { value.rooms = [null]; },
      (value) => { value.cycle = [null]; },
      (value) => { value.laws = [null]; },
      (value) => { value.illustrative_paths = [null]; },
      (value) => { value.protected_signal_rule = []; },
      (value) => { value.no_oracle_rule = null; },
      (value) => { value.response_boundary = null; },
      (value) => { value.sources = [null]; },
    ];
    for (const mutate of cases) {
      const value = authored(); mutate(value);
      expect(() => verifyMirrorInformationControl(value)).not.toThrow();
      expect(verifyMirrorInformationControl(value).length).toBeGreaterThan(0);
    }
    expect(verifyMirrorInformationControl(null)).toEqual([{ field: "$", code: "must-be-object" }]);
    const nonJson = authored(); nonJson.non_json = undefined;
    expect(() => verifyMirrorInformationControl(nonJson)).not.toThrow();
    expect(codes(nonJson)).toContain("non-json-value");
  });

  test("strict loading rejects duplicate keys, invalid UTF-8, symlinks, and oversized input", () => {
    const root = fixtureRoot();
    const duplicate = join(root, "duplicate.json"); writeFileSync(duplicate, '{"a":1,"\\u0061":2}');
    expect(() => loadMirrorInformationControl(duplicate)).toThrow("duplicate key");
    const utf8 = join(root, "utf8.json"); writeFileSync(utf8, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]));
    expect(() => loadMirrorInformationControl(utf8)).toThrow("valid UTF-8");
    const link = join(root, "link.json"); symlinkSync(MIRROR_INFORMATION_CONTROL_PUBLIC_PATH, link);
    expect(() => loadMirrorInformationControl(link)).toThrow("unavailable or not a regular non-symlink");
    const oversized = join(root, "oversized.json"); writeFileSync(oversized, Buffer.alloc(256 * 1024 + 1, 0x20));
    expect(() => loadMirrorInformationControl(oversized)).toThrow("exceeds 262144 bytes");
  });

  test("projects only compact public law and negative authority", () => {
    const summary = mirrorInformationControlPublicSummary();
    expect(summary).toMatchObject({
      protocol: MIRROR_INFORMATION_CONTROL_PUBLIC_PROTOCOL,
      publication_id: MIRROR_INFORMATION_CONTROL_PUBLIC_ID,
      artifact_kind: "STATIC_READ_ONLY_PUBLICATION",
      source_commit: MIRROR_INFORMATION_CONTROL_PUBLIC_SOURCE_COMMIT,
      source_file_count: 8,
      rooms: ["CROWN", "COURT", "MIRROR"],
      cycle: ["mark", "isolate", "restrict", "resolve", "observe", "respond"],
      urls: { record: MIRROR_INFORMATION_CONTROL_PUBLIC_URL, schema: MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL, guide: MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL },
    });
    for (const key of ["credential", "credential_class", "route", "reason_codes", "signals", "evidence", "response_refs", "authority_refs"]) {
      expect(summary).not.toHaveProperty(key);
    }
  });

  test("CLI is offline, inherited-command safe, key-argument free, and leaves cwd unchanged", () => {
    const directory = fixtureRoot();
    const before = readdirSync(directory);
    const env = { ...process.env, HTTPS_PROXY: "http://127.0.0.1:1", HTTP_PROXY: "http://127.0.0.1:1", ALL_PROXY: "http://127.0.0.1:1", NO_PROXY: "" };
    for (const command of ["verify", "overview", "digest", "laws", "paths", "boundary", "sources", "source"]) {
      const result = Bun.spawnSync({ cmd: ["bun", SCRIPT, command, "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
      expect(result.exitCode, `${command}: ${result.stderr.toString()}`).toBe(0);
      expect(() => JSON.parse(result.stdout.toString())).not.toThrow();
    }
    for (const args of [["constructor"], ["__proto__"], ["classify"], ["introspect"], ["submit"], ["--key", "synthetic"], ["verify", "one", "two"], ["verify", "--json", "--json"]]) {
      const result = Bun.spawnSync({ cmd: ["bun", SCRIPT, ...args], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
      expect(result.exitCode, args.join(" ")).toBe(2);
      expect(result.stdout.toString()).toBe("");
    }
    const sentinel = "MIRROR_TEST_ONLY_DO_NOT_ECHO";
    const malformed = join(directory, "malformed.json"); writeFileSync(malformed, JSON.stringify({ unexpected: sentinel }));
    const rejected = Bun.spawnSync({ cmd: ["bun", SCRIPT, "verify", malformed, "--json"], cwd: directory, env, stdout: "pipe", stderr: "pipe" });
    expect(rejected.exitCode).toBe(1);
    expect(rejected.stdout.toString()).not.toContain(sentinel);
    expect(readdirSync(directory).sort()).toEqual([...before, "malformed.json"].sort());
  });

  test("reader source contains no networking, writes, subprocesses, or credential operation", () => {
    const source = readFileSync(SCRIPT, "utf8");
    expect(source).not.toMatch(/from ["']node:(?:http|https|net|tls|dns|child_process)["']/);
    expect(source).not.toMatch(/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bsendBeacon\s*\(/);
    expect(source).not.toMatch(/\b(?:writeFile|appendFile|mkdir|rename|unlink|rm|rmdir)Sync\b/);
    expect(source).not.toMatch(/\b(?:spawn|exec|fork)Sync\b/);
    expect(source).not.toContain("classifyCredential");
    expect(source).not.toContain("lookupCredential");
  });
});
