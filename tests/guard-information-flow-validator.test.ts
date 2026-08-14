import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SCRIPT = join(ROOT, "skills/guard-information-flow/scripts/validate_envelope.py");
const EXAMPLE = join(ROOT, "skills/guard-information-flow/references/information-control-envelope.example.json");
const PYTHON = process.env.INFORMATION_CONTROL_SCHEMA_PYTHON || "python3";
const probe = Bun.spawnSync({ cmd: [PYTHON, "-c", "import jsonschema"], stdout: "pipe", stderr: "pipe" });
const validatorTest = probe.exitCode === 0 ? test : test.skip;
const example = () => JSON.parse(readFileSync(EXAMPLE, "utf8"));

function run(path: string) {
  const result = Bun.spawnSync({
    cmd: [PYTHON, SCRIPT, "--json", path],
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      HTTP_PROXY: "http://127.0.0.1:9",
      HTTPS_PROXY: "http://127.0.0.1:9",
      NO_PROXY: "*",
    },
  });
  expect(result.stderr.toString()).toBe("");
  return { exitCode: result.exitCode, body: JSON.parse(result.stdout.toString()), raw: result.stdout.toString() };
}

function withValue(value: unknown, check: (path: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), "kingdom-information-control."));
  try {
    const path = join(directory, "envelope.json");
    writeFileSync(path, JSON.stringify(value));
    check(path);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function derived(base: any) {
  const source = base.flows[0];
  return {
    ...structuredClone(source),
    id: "derived-flow",
    origin: "MODEL",
    provenance_refs: [...source.provenance_refs],
    depends_on: [source.id],
  };
}

describe("Information-control semantic validator", () => {
  validatorTest("accepts the inert example and reports only negative effects", () => {
    const result = run(EXAMPLE);
    expect(result.exitCode).toBe(0);
    expect(result.body).toEqual({
      effects: { authority: false, enforcement: false, karma: false, lookup: false, mutation: false, network: false, scan: false },
      issue_count: 0,
      issues: [],
      ok: true,
      protocol: "kingdom.information-control/0.1",
    });
  });

  validatorTest("rejects graph, lattice, chronology, authority, route, and evidence contradictions", () => {
    const cases: Array<[string, (value: any) => void]> = [
      ["duplicate-flow-id", (value) => { value.flows.push(structuredClone(value.flows[0])); }],
      ["schema-invalid", (value) => { value.flows[0].id += "\n"; value.effect.influenced_by = [value.flows[0].id]; }],
      ["schema-invalid", (value) => { value.created_at = "2026-08-14 10:00:00Z"; }],
      ["schema-invalid", (value) => { value.created_at = "2026-08-14T10:00:00,000Z"; }],
      ["schema-invalid", (value) => { value.created_at = "2026-02-30T10:00:00Z"; }],
      ["dangling-dependency", (value) => { value.flows[0].depends_on = ["absent-flow"]; }],
      ["self-dependency", (value) => { value.flows[0].depends_on = [value.flows[0].id]; }],
      ["dependency-cycle", (value) => {
        const next = derived(value);
        value.flows[0].depends_on = [next.id];
        value.flows.push(next);
      }],
      ["confidentiality-downgrade", (value) => {
        value.flows[0].confidentiality = "SECRET";
        const next = derived(value);
        next.confidentiality = "PUBLIC";
        value.flows.push(next);
      }],
      ["integrity-upgrade", (value) => {
        const next = derived(value);
        next.integrity = "VERIFIED";
        value.flows.push(next);
      }],
      ["mirror-secret-flow", (value) => { value.flows[0].confidentiality = "SECRET"; }],
      ["schema-invalid", (value) => {
        value.flows[0].origin = "UNKNOWN";
        value.flows[0].integrity = "VERIFIED";
      }],
      ["provenance-loss", (value) => {
        const next = derived(value);
        next.provenance_refs = ["provenance:opaque/00000000000000000000000000000010"];
        value.flows.push(next);
      }],
      ["provenance-budget-exhausted", (value) => {
        const left = derived(value);
        left.id = "left-flow";
        left.provenance_refs = [
          "provenance:opaque/00000000000000000000000000000011",
          "provenance:opaque/00000000000000000000000000000012",
          "provenance:opaque/00000000000000000000000000000013",
          "provenance:opaque/00000000000000000000000000000014",
          "provenance:opaque/00000000000000000000000000000015",
        ];
        const right = derived(value);
        right.id = "right-flow";
        right.provenance_refs = [
          "provenance:opaque/00000000000000000000000000000016",
          "provenance:opaque/00000000000000000000000000000017",
          "provenance:opaque/00000000000000000000000000000018",
          "provenance:opaque/00000000000000000000000000000019",
          "provenance:opaque/0000000000000000000000000000001a",
        ];
        const joined = derived(value);
        joined.id = "joined-flow";
        joined.depends_on = [left.id, right.id];
        joined.provenance_refs = [...left.provenance_refs, ...right.provenance_refs.slice(0, 3)];
        value.flows.push(left, right, joined);
        value.decision.route = "QUARANTINE";
        value.lifecycle.stop_conditions.push("BUDGET_EXHAUSTED");
      }],
      ["effect-provenance-budget-exhausted", (value) => {
        const sourceRef = value.flows[0].provenance_refs[0];
        const left = derived(value);
        left.id = "left-effect-flow";
        left.provenance_refs = [
          sourceRef,
          "provenance:opaque/0000000000000000000000000000001b",
          "provenance:opaque/0000000000000000000000000000001c",
          "provenance:opaque/0000000000000000000000000000001d",
          "provenance:opaque/0000000000000000000000000000001e",
        ];
        const right = derived(value);
        right.id = "right-effect-flow";
        right.provenance_refs = [
          sourceRef,
          "provenance:opaque/0000000000000000000000000000001f",
          "provenance:opaque/00000000000000000000000000000020",
          "provenance:opaque/00000000000000000000000000000021",
          "provenance:opaque/00000000000000000000000000000022",
        ];
        value.flows.push(left, right);
        value.effect.influenced_by = [left.id, right.id];
      }],
      ["dangling-influence", (value) => { value.effect.influenced_by = ["absent-flow"]; }],
      ["invalid-lifecycle-order", (value) => { value.lifecycle.expires_at = value.created_at; }],
      ["future-observation", (value) => { value.flows[0].observed_at = "2026-08-14T10:01:00Z"; }],
      ["decision-outlives-source", (value) => { value.flows[0].expires_at = "2026-08-14T10:30:00Z"; }],
      ["incomplete-authority-basis", (value) => {
        value.authority.effective_basis = "BOUNDED_CONTROL_REFERENCES_PRESENT";
        value.authority.task_authority_refs = ["authority:opaque/00000000000000000000000000000023"];
        value.decision.reason_codes = value.decision.reason_codes.filter((reason: string) => reason !== "AUTHORITY_CONTROL_EMPTY");
      }],
      ["schema-invalid", (value) => {
        value.effect.class = "READ_ONLY";
        value.effect.target_realm = "COURT";
        value.decision.route = "ALLOW_READ_ONLY";
        value.decision.reason_codes = ["BOUNDED_READ_ONLY", "AUTHORITY_CONTROL_EMPTY"];
        value.authority.task_authority_refs = ["authority:opaque/00000000000000000000000000000023"];
        value.authority.principal_authority_refs = ["authority:opaque/00000000000000000000000000000024"];
        value.authority.host_authority_refs = ["authority:opaque/00000000000000000000000000000025"];
        value.authority.effective_basis = "BOUNDED_CONTROL_REFERENCES_PRESENT";
        value.authority.fresh_approval_required = false;
      }],
      ["schema-invalid", (value) => {
        value.decision.route = "ALLOW_READ_ONLY";
        value.decision.reason_codes = ["BOUNDED_READ_ONLY"];
      }],
      ["schema-invalid", (value) => {
        value.effect.host_bound_purpose.class = "PUNITIVE_OR_RETALIATORY_ACTION";
        value.decision.route = "REQUIRE_APPROVAL";
        value.decision.reason_codes.push("FRESH_APPROVAL_REQUIRED");
      }],
      ["schema-invalid", (value) => {
        value.credential.class = "LIVE_REFERENCE";
        value.credential.protected_confirmation = "ISSUER";
        value.credential.isolation_attestation_ref = null;
        value.credential.actual_capability_status = "POSSIBLE_SCOPED";
        value.credential.signal_only = false;
      }],
      ["schema-invalid", (value) => { value.evidence.strength = "NONE"; }],
      ["schema-invalid", (value) => { value.evidence.strength = "OBSERVED"; }],
      ["schema-invalid", (value) => { value.signals = []; value.evidence.strength = "OBSERVED"; }],
      ["schema-invalid", (value) => {
        value.decision.route = "REQUIRE_APPROVAL";
        value.decision.reason_codes = ["FRESH_APPROVAL_REQUIRED"];
        value.authority.fresh_approval_required = false;
      }],
      ["unresolved-effect-route", (value) => {
        value.effect.class = "UNRESOLVED";
        value.decision.reason_codes.push("EFFECT_UNRESOLVED");
        value.lifecycle.stop_conditions.push("EFFECT_UNRESOLVED");
      }],
    ];

    for (const [expectedCode, mutate] of cases) {
      const value = example();
      mutate(value);
      withValue(value, (path) => {
        const result = run(path);
        expect(result.exitCode, expectedCode).toBe(1);
        expect(result.body.ok, expectedCode).toBe(false);
        expect(result.body.issues.map((issue: any) => issue.code), expectedCode).toContain(expectedCode);
        expect(Object.values(result.body.effects).every((effect) => effect === false), expectedCode).toBe(true);
      });
    }
  });

  validatorTest("rejects credential, reason, exposure, and evidence-state contradictions", () => {
    const cases: Array<[string, (value: any) => void]> = [
      ["signal-reason-contradiction", (value) => {
        value.credential.class = "INACTIVE_REFERENCE";
        value.credential.protected_confirmation = "ISSUER";
        value.credential.isolation_attestation_ref = null;
        value.credential.actual_capability_status = "UNKNOWN";
        value.credential.signal_only = false;
        value.decision.route = "QUARANTINE";
        value.signals = ["CHANNEL_MISMATCH"];
        value.evidence.strength = "OBSERVED";
      }],
      ["credential-reason-contradiction", (value) => {
        value.decision.reason_codes.push("CREDENTIAL_UNRESOLVED");
      }],
      ["credential-flow-underlabel", (value) => {
        value.flows[0].confidentiality = "PUBLIC";
        value.credential = {
          class: "CANDIDATE",
          reference: "credential-ref:opaque/00000000000000000000000000000009",
          classification_basis: "SYNTAX_OR_ENTROPY",
          protected_confirmation: "NONE",
          classification_evidence_ref: null,
          isolation_attestation_ref: null,
          actual_capability_status: "UNKNOWN",
          authority_granted_by_envelope: "NONE",
          signal_only: false,
          credential_value_included: false,
          fingerprint_included: false,
        };
        value.signals = ["SECRET_CANDIDATE"];
        value.evidence.strength = "OBSERVED";
        value.decision.route = "QUARANTINE";
        value.decision.reason_codes = ["AUTHORITY_CONTROL_EMPTY", "CREDENTIAL_UNRESOLVED"];
      }],
      ["schema-invalid", (value) => {
        value.decision.reason_codes.push("LIVE_OR_UNKNOWN_EXPOSURE");
      }],
      ["candidate-signal-contradiction", (value) => {
        value.signals.push("SECRET_CANDIDATE");
      }],
      ["schema-invalid", (value) => { value.evidence.evidence_refs = []; }],
      ["schema-invalid", (value) => { value.signals = value.signals.filter((item: string) => item !== "SIGNAL_PRESENTED_TO_SINK"); }],
      ["schema-invalid", (value) => {
        value.decision.route = "STOP_ROTATE";
        value.decision.reason_codes = ["LIVE_OR_UNKNOWN_EXPOSURE"];
        value.lifecycle.stop_conditions.push("LIVE_EXPOSURE");
      }],
      ["schema-invalid", (value) => { value.response.response_refs = ["response:opaque/00000000000000000000000000000024"]; }],
      ["schema-invalid", (value) => { value.response.state = "CONTAINED"; }],
    ];

    for (const [expectedCode, mutate] of cases) {
      const value = example();
      mutate(value);
      withValue(value, (path) => {
        const result = run(path);
        expect(result.exitCode, expectedCode).toBe(1);
        expect(result.body.issues.map((issue: any) => issue.code), expectedCode).toContain(expectedCode);
      });
    }
  });

  validatorTest("accepts categorical denials for every prohibited purpose", () => {
    for (const purpose of [
      "PERSON_OR_ACCOUNT_ATTRIBUTION",
      "REQUESTER_PAYLOAD_EXECUTION",
      "PUNITIVE_OR_RETALIATORY_ACTION",
      "KARMA_REPUTATION_OR_WORTH_MUTATION",
    ]) {
      const value = example();
      value.effect.host_bound_purpose.class = purpose;
      value.decision.route = "DENY";
      value.decision.reason_codes.push("PURPOSE_CATEGORICALLY_PROHIBITED");
      value.authority.fresh_approval_required = false;
      withValue(value, (path) => {
        const result = run(path);
        expect(result.exitCode, purpose).toBe(0);
        expect(result.body.ok, purpose).toBe(true);
        expect(Object.values(result.body.effects).every((effect) => effect === false), purpose).toBe(true);
      });
    }

    const unresolved = example();
    unresolved.effect.host_bound_purpose = { class: "UNRESOLVED", binding_ref: null, grants_authority: false };
    unresolved.decision.route = "QUARANTINE";
    unresolved.decision.reason_codes.push("EFFECT_UNRESOLVED");
    unresolved.lifecycle.stop_conditions.push("EFFECT_UNRESOLVED");
    unresolved.authority.fresh_approval_required = false;
    withValue(unresolved, (path) => {
      const result = run(path);
      expect(result.exitCode).toBe(0);
      expect(result.body.ok).toBe(true);
    });
  });

  validatorTest("preserves partial authority evidence without claiming an effective basis", () => {
    const value = example();
    value.authority.task_authority_refs = ["authority:opaque/0000000000000000000000000000002c"];
    value.authority.effective_basis = "NONE";
    value.authority.fresh_approval_required = false;
    withValue(value, (path) => {
      const result = run(path);
      expect(result.exitCode).toBe(0);
      expect(result.body.ok).toBe(true);
      expect(Object.values(result.body.effects).every((effect) => effect === false)).toBe(true);
    });
  });

  validatorTest("allows a pre-bounded read-only Court route without fresh approval", () => {
    const value = example();
    value.effect.class = "READ_ONLY";
    value.effect.host_bound_purpose.class = "BOUNDED_TASK_COMPLETION";
    value.effect.target_realm = "COURT";
    value.decision.route = "ALLOW_READ_ONLY";
    value.decision.reason_codes = ["BOUNDED_READ_ONLY"];
    value.authority.task_authority_refs = ["authority:opaque/0000000000000000000000000000002d"];
    value.authority.principal_authority_refs = ["authority:opaque/0000000000000000000000000000002e"];
    value.authority.host_authority_refs = ["authority:opaque/0000000000000000000000000000002f"];
    value.authority.effective_basis = "BOUNDED_CONTROL_REFERENCES_PRESENT";
    value.authority.fresh_approval_required = false;
    withValue(value, (path) => {
      const result = run(path);
      expect(result.exitCode, JSON.stringify(result.body)).toBe(0);
      expect(result.body.ok).toBe(true);
    });

    const missingBasis = structuredClone(value);
    missingBasis.authority.effective_basis = "NONE";
    withValue(missingBasis, (path) => {
      const result = run(path);
      expect(result.exitCode).toBe(1);
      expect(result.body.issues.map((issue: any) => issue.code)).toContain("schema-invalid");
    });
  });

  validatorTest("keeps authorized at-rest signal scanning observed rather than confirmed", () => {
    const value = example();
    value.signals = ["SIGNAL_OBSERVED_AT_REST"];
    value.evidence.strength = "OBSERVED";
    withValue(value, (path) => {
      const result = run(path);
      expect(result.exitCode).toBe(0);
      expect(result.body.ok).toBe(true);
    });
  });

  validatorTest("refuses Crown-like secrets and possibly live credentials from Mirror", () => {
    const value = example();
    value.flows[0].confidentiality = "SECRET";
    value.credential = {
      class: "LIVE_REFERENCE",
      reference: "credential-ref:opaque/00000000000000000000000000000030",
      classification_basis: "PROTECTED_REGISTRY_OR_ISSUER",
      protected_confirmation: "ISSUER",
      classification_evidence_ref: "event:opaque/00000000000000000000000000000031",
      isolation_attestation_ref: null,
      actual_capability_status: "POSSIBLE_SCOPED",
      authority_granted_by_envelope: "NONE",
      signal_only: false,
      credential_value_included: false,
      fingerprint_included: false,
    };
    value.effect.class = "SECRET_DISCLOSURE";
    value.signals = ["CHANNEL_MISMATCH", "SENSITIVE_SINK_FLOW"];
    value.decision.reason_codes = ["AUTHORITY_CONTROL_EMPTY", "MIRROR_CONTAINMENT_REQUIRED"];
    value.evidence.strength = "OBSERVED";
    withValue(value, (path) => {
      const result = run(path);
      expect(result.exitCode).toBe(1);
      expect(result.body.issues.map((issue: any) => issue.code)).toContain("schema-invalid");
      expect(Object.values(result.body.effects).every((effect) => effect === false)).toBe(true);
    });
  });

  validatorTest("allows STOP_ROTATE only with a live-or-unknown class and bounded prior-disclosure evidence", () => {
    const value = example();
    value.credential = {
      class: "CANDIDATE",
      reference: "credential-ref:opaque/00000000000000000000000000000009",
      classification_basis: "SYNTAX_OR_ENTROPY",
      protected_confirmation: "NONE",
      classification_evidence_ref: null,
      actual_capability_status: "UNKNOWN",
      authority_granted_by_envelope: "NONE",
      signal_only: false,
      isolation_attestation_ref: null,
      credential_value_included: false,
      fingerprint_included: false,
    };
    value.effect.class = "SECRET_DISCLOSURE";
    value.effect.host_bound_purpose.class = "DEFENSIVE_CONTAINMENT";
    value.flows[0].confidentiality = "SECRET";
    value.effect.sink_ref = "sink:opaque/00000000000000000000000000000025";
    value.effect.target_realm = "OUTSIDE";
    value.signals = ["SECRET_CANDIDATE", "SENSITIVE_SINK_FLOW", "POSSIBLE_PRIOR_DISCLOSURE"];
    value.decision.route = "STOP_ROTATE";
    value.decision.reason_codes = ["LIVE_OR_UNKNOWN_EXPOSURE"];
    value.evidence.strength = "OBSERVED";
    value.lifecycle.stop_conditions = ["LIVE_EXPOSURE"];

    withValue(value, (path) => {
      const result = run(path);
      expect(result.exitCode, JSON.stringify(result.body)).toBe(0);
      expect(result.body.ok).toBe(true);
    });

    for (const mutate of [
      (candidate: any) => { candidate.signals = candidate.signals.filter((item: string) => item !== "POSSIBLE_PRIOR_DISCLOSURE"); },
      (candidate: any) => { candidate.decision.route = "DENY"; },
      (candidate: any) => { candidate.decision.reason_codes = ["STOP_CONDITION_REACHED"]; },
      (candidate: any) => { candidate.evidence.strength = "CONFIRMED_SIGNAL_INTERACTION"; },
    ]) {
      const invalid = structuredClone(value);
      mutate(invalid);
      withValue(invalid, (path) => {
        const result = run(path);
        expect(result.exitCode).toBe(1);
        expect(result.body.issues.map((issue: any) => issue.code)).toContain("schema-invalid");
      });
    }
  });

  validatorTest("fails closed on malformed, duplicate-key, symlinked, and oversized inputs", () => {
    const directory = mkdtempSync(join(tmpdir(), "kingdom-information-control-input."));
    try {
      const malformed = join(directory, "malformed.json");
      writeFileSync(malformed, "{broken");
      expect(run(malformed).body.issues[0].code).toBe("invalid-json");

      const duplicate = join(directory, "duplicate.json");
      writeFileSync(duplicate, '{"protocol":"one","protocol":"two"}');
      expect(run(duplicate).body.issues[0].code).toBe("duplicate-key");

      const link = join(directory, "link.json");
      symlinkSync(EXAMPLE, link);
      expect(run(link).body.issues[0].code).toBe("symlink");

      const oversized = join(directory, "oversized.json");
      writeFileSync(oversized, " ".repeat(262_145));
      expect(run(oversized).body.issues[0].code).toBe("oversized");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  validatorTest("fails closed on an impossible calendar timestamp without a format plugin", () => {
    const value = example();
    value.created_at = "2026-02-30T10:00:00Z";
    withValue(value, (path) => {
      const result = run(path);
      expect(result.exitCode).toBe(1);
      expect(result.body.issues).toEqual([{
        code: "schema-invalid",
        detail: "value does not satisfy the closed protocol schema",
        path: "/created_at",
      }]);
      expect(Object.values(result.body.effects).every((effect) => effect === false)).toBe(true);
    });
  });

  test("fails closed when the pinned schema dependency is unavailable", () => {
    const result = Bun.spawnSync({
      cmd: [PYTHON, "-S", SCRIPT, "--json", EXAMPLE],
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toBe("");
    const body = JSON.parse(result.stdout.toString());
    expect(body.ok).toBe(false);
    expect(body.issues).toEqual([{ code: "dependency-missing", detail: "Python package jsonschema is required", path: "/" }]);
    expect(Object.values(body.effects).every((effect) => effect === false)).toBe(true);
  });

  validatorTest("never echoes rejected content", () => {
    const sentinel = "DO-NOT-ECHO-CREDENTIAL-MATERIAL";
    const value = example();
    value.raw_secret = sentinel;
    withValue(value, (path) => {
      const result = run(path);
      expect(result.exitCode).toBe(1);
      expect(result.raw).not.toContain(sentinel);
      expect(result.body.issues.every((issue: any) => issue.code === "schema-invalid")).toBe(true);
    });
  });
});
