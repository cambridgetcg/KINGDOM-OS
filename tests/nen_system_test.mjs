import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import test from "node:test";

import {
  NenInputError,
  compileExpedition,
  describeNen,
  evaluateProbe,
} from "../nen/ging.mjs";
import {
  fingerprintUnwrittenHorizonOutputPlan,
  fingerprintUnwrittenHorizonRequest,
  preflightUnwrittenHorizon,
} from "../skills/conjure-unwritten-horizon/scripts/activation-preflight.mjs";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SERVER_PATH = join(REPO_ROOT, "nen", "mcp-server.mjs");
const MODERN_PROTOCOL = "2026-07-28";
const PROTOCOL_META_KEY = "io.modelcontextprotocol/protocolVersion";
const CLIENT_INFO_META_KEY = "io.modelcontextprotocol/clientInfo";
const CLIENT_CAPABILITIES_META_KEY = "io.modelcontextprotocol/clientCapabilities";
const SERVER_INFO_META_KEY = "io.modelcontextprotocol/serverInfo";

function expedition() {
  return {
    question: "Which mechanism frames one local request?",
    boundary: {
      systems: ["disposable local responder"],
      allowed_actions: ["send one line to the local fixture"],
      forbidden_actions: ["connect to a private service"],
      required_permissions: ["caller authorization for the named fixture"],
    },
    observations: [
      {
        id: "line-ending",
        statement: "Every captured request ends with one newline.",
        kind: "observed",
        evidence_ref: "fixture/transcript.txt:1",
      },
      {
        id: "single-reply",
        statement: "Each complete request has one reply.",
        kind: "measured",
        evidence_ref: "fixture/run-00.json",
      },
    ],
    hypotheses: [
      {
        id: "line-framing",
        mechanism: "A newline terminates each request frame.",
        explains: ["line-ending", "single-reply"],
        probe: {
          action: "send one line to the local fixture",
          system: "disposable local responder",
          scope: "one disposable local process",
          budget: { unit: "requests", limit: 1 },
          effect: "reversible_local",
          authorization: "caller_declared",
          permission_refs: ["caller authorization for the named fixture"],
          expected_signal: "one reply appears after the newline",
          falsifies_if: "the same reply appears before any newline",
        },
      },
      {
        id: "remote-framing",
        mechanism: "A remote private service adds frame boundaries.",
        explains: ["single-reply"],
        probe: {
          action: "connect to a private service",
          system: "unnamed private service",
          scope: "an unnamed remote target",
          budget: { unit: "requests", limit: 1 },
          effect: "external",
          authorization: "not_confirmed",
          permission_refs: ["private organization approval"],
          expected_signal: "the private service returns a reply",
          falsifies_if: "the local fixture replies without the service",
        },
      },
    ],
    unknowns: ["whether empty frames are accepted"],
  };
}

test("Ging compiler selects the highest-coverage eligible candidate without claiming truth", () => {
  const input = expedition();
  const before = structuredClone(input);
  const output = compileExpedition(input);

  assert.deepEqual(input, before, "the pure compiler must not mutate caller data");
  assert.equal(output.status, "plan_ready");
  assert.equal(output.decision, "propose_probe");
  assert.equal(output.selected_probe.hypothesis_id, "line-framing");
  assert.equal(output.selected_probe.effect, "reversible_local");
  assert.equal(output.authority.probe_executed, false);
  assert.equal(output.authority.grants_permissions, false);
  assert.equal(output.truth_claim, "not_determined");
  assert.deepEqual(output.dark_continent.unknowns, ["whether empty frames are accepted"]);
  assert.deepEqual(output.candidate_order[1].hold_reasons, [
    "system-not-in-boundary",
    "action-not-allowlisted",
    "action-forbidden",
    "permission-reference-outside-boundary",
    "external-effect",
    "authorization-not-confirmed",
  ]);
});

test("Ging compiler binds candidates to declared systems and permission references", () => {
  const outsideSystem = expedition();
  outsideSystem.hypotheses = [outsideSystem.hypotheses[0]];
  outsideSystem.hypotheses[0].probe.system = "production account outside the boundary";
  let output = compileExpedition(outsideSystem);
  assert.equal(output.status, "zetsu");
  assert.deepEqual(output.candidate_order[0].hold_reasons, ["system-not-in-boundary"]);

  const outsidePermission = expedition();
  outsidePermission.hypotheses = [outsidePermission.hypotheses[0]];
  outsidePermission.hypotheses[0].probe.permission_refs = ["approval not named by the boundary"];
  output = compileExpedition(outsidePermission);
  assert.equal(output.status, "zetsu");
  assert.deepEqual(output.candidate_order[0].hold_reasons, [
    "permission-reference-outside-boundary",
  ]);
});

test("Ging compiler preserves unknown when no hypothesis is warranted", () => {
  const input = expedition();
  input.hypotheses = [];
  input.unknowns.push("no mechanism is yet warranted by the observations");
  const output = compileExpedition(input);

  assert.equal(output.status, "zetsu");
  assert.equal(output.decision, "hold");
  assert.deepEqual(output.candidate_order, []);
  assert.equal(output.selected_probe, null);
});

test("Ging compiler enters Zetsu when authorization is not confirmed", () => {
  const input = expedition();
  input.hypotheses[0].probe.authorization = "not_confirmed";
  const output = compileExpedition(input);

  assert.equal(output.status, "zetsu");
  assert.equal(output.decision, "hold");
  assert.equal(output.selected_probe, null);
  assert.equal(output.authority.external_effects, false);
});

test("Ging input errors disclose fields and codes, not rejected values", () => {
  const input = expedition();
  input.borrowed_credential = "do-not-disclose-this-value";

  assert.throws(
    () => compileExpedition(input),
    (error) => {
      assert.ok(error instanceof NenInputError);
      assert.equal(error.field, "input");
      assert.equal(error.code, "unknown-field");
      assert.doesNotMatch(error.message, /do-not-disclose/);
      return true;
    },
  );

  const controlKey = expedition();
  controlKey["\u001b[31mdo-not-echo-this-key"] = "do-not-echo-this-value";
  assert.throws(
    () => compileExpedition(controlKey),
    (error) => {
      assert.equal(error.message, "input unknown-field");
      assert.doesNotMatch(error.message, /\u001b|do-not-echo/);
      return true;
    },
  );
});

test("Ging text bounds count Unicode code points like JSON Schema", () => {
  const atLimit = expedition();
  atLimit.question = "🌀".repeat(500);
  assert.equal(compileExpedition(atLimit).question, atLimit.question);

  const overLimit = expedition();
  overLimit.question = "🌀".repeat(501);
  assert.throws(
    () => compileExpedition(overLimit),
    (error) => error instanceof NenInputError && error.field === "question",
  );
});

test("probe evaluation remains provisional and pauses on reported side effects", () => {
  const selectedProbe = compileExpedition(expedition()).selected_probe;
  const supported = evaluateProbe({
    selected_probe: selectedProbe,
    receipt: {
      probe_id: "line-framing-probe",
      action: "send one line to the local fixture",
      system: "disposable local responder",
      scope: "one disposable local process",
      budget: { unit: "requests", limit: 1 },
      effect: "reversible_local",
      authorization: "caller_declared",
      permission_refs: ["caller authorization for the named fixture"],
      observed_signal: "one reply appeared after the newline",
      relation: "matches_expected",
      evidence_ref: "fixture/run-01.json",
      divergence: "none observed",
      side_effects: "none_reported",
    },
  });
  assert.equal(supported.assessment, "provisionally_supported");
  assert.equal(supported.state, "ready_for_review");
  assert.equal(supported.authority.receipt_verified, false);
  assert.equal(supported.receipt_binding.structurally_matches_selected_probe, true);
  assert.equal(supported.receipt_binding.proves_execution_or_authenticity, false);
  assert.equal(supported.truth_claim, "not_determined");

  const withSideEffect = evaluateProbe({
    selected_probe: selectedProbe,
    receipt: {
      probe_id: "line-framing-probe",
      action: "send one line to the local fixture",
      system: "disposable local responder",
      scope: "one disposable local process",
      budget: { unit: "requests", limit: 1 },
      effect: "reversible_local",
      authorization: "caller_declared",
      permission_refs: ["caller authorization for the named fixture"],
      observed_signal: "an unexpected external message was sent",
      relation: "other",
      evidence_ref: "fixture/run-02.json",
      divergence: "an external message was outside the declared effect",
      side_effects: "reported",
    },
  });
  assert.equal(withSideEffect.assessment, "inconclusive");
  assert.equal(withSideEffect.state, "zetsu");
  assert.equal(withSideEffect.boundary_breach_reported, true);
});

test("probe evaluation rejects a receipt that does not match the selected probe", () => {
  const selectedProbe = compileExpedition(expedition()).selected_probe;
  const input = {
    selected_probe: selectedProbe,
    receipt: {
      probe_id: selectedProbe.id,
      action: selectedProbe.action,
      system: selectedProbe.system,
      scope: selectedProbe.scope,
      budget: selectedProbe.budget,
      effect: selectedProbe.effect,
      authorization: selectedProbe.authorization,
      permission_refs: selectedProbe.permission_refs,
      observed_signal: "one reply appeared after the newline",
      relation: "matches_expected",
      evidence_ref: "fixture/run-mismatch.json",
      divergence: "none observed",
      side_effects: "none_reported",
    },
  };
  input.receipt.system = "unrelated production system";

  assert.throws(
    () => evaluateProbe(input),
    (error) =>
      error instanceof NenInputError &&
      error.field === "receipt.system" &&
      error.code === "probe-mismatch",
  );
});

test("maximum hypothesis ID round-trips through a generated probe receipt", () => {
  const input = expedition();
  input.hypotheses = [input.hypotheses[0]];
  input.hypotheses[0].id = "a".repeat(48);
  const compiled = compileExpedition(input);
  assert.equal(compiled.selected_probe.id, `${"a".repeat(48)}-probe`);

  const evaluated = evaluateProbe({
    selected_probe: compiled.selected_probe,
    receipt: {
      probe_id: compiled.selected_probe.id,
      action: compiled.selected_probe.action,
      system: compiled.selected_probe.system,
      scope: compiled.selected_probe.scope,
      budget: compiled.selected_probe.budget,
      effect: compiled.selected_probe.effect,
      authorization: compiled.selected_probe.authorization,
      permission_refs: compiled.selected_probe.permission_refs,
      observed_signal: "one reply appeared after the newline",
      relation: "matches_expected",
      evidence_ref: "fixture/max-id-run.json",
      divergence: "none observed",
      side_effects: "none_reported",
    },
  });
  assert.equal(evaluated.assessment, "provisionally_supported");
});

test("ontology keeps Dark Continent, Nen, Skill, and MCP distinct", () => {
  const ontology = describeNen();
  assert.equal(ontology.register, "creative-operational");
  assert.equal(ontology.empirical_metaphysics_claimed, false);
  assert.deepEqual(
    ontology.layers.map(({ name }) => name),
    ["Dark Continent", "Nen", "Skill", "MCP"],
  );
  assert.equal(ontology.rights.grants_permissions, false);
});

function startServer() {
  const child = spawn(process.execPath, [SERVER_PATH], {
    cwd: REPO_ROOT,
    stdio: ["pipe", "pipe", "pipe"],
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  let buffer = "";
  let stderr = "";
  const queued = [];
  const waiters = [];

  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (!line) continue;
      const message = JSON.parse(line);
      const waiter = waiters.shift();
      if (waiter) waiter.resolve(message);
      else queued.push(message);
    }
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  function next(timeoutMs = 2000) {
    if (queued.length) return Promise.resolve(queued.shift());
    return new Promise((resolve, reject) => {
      const entry = { resolve, reject };
      waiters.push(entry);
      const timer = setTimeout(() => {
        const index = waiters.indexOf(entry);
        if (index >= 0) waiters.splice(index, 1);
        reject(new Error("timed out waiting for MCP response"));
      }, timeoutMs);
      entry.resolve = (value) => {
        clearTimeout(timer);
        resolve(value);
      };
    });
  }

  return {
    child,
    send(message) {
      child.stdin.write(`${JSON.stringify(message)}\n`);
    },
    writeRaw(value) {
      child.stdin.write(value);
    },
    next,
    stderr: () => stderr,
  };
}

function modernMeta(overrides = {}) {
  return {
    [PROTOCOL_META_KEY]: MODERN_PROTOCOL,
    [CLIENT_INFO_META_KEY]: { name: "nen-system-test", version: "0.1.0" },
    [CLIENT_CAPABILITIES_META_KEY]: {},
    ...overrides,
  };
}

test("stateless Ging compatibility MCP exposes current pure tools", async (t) => {
  const server = startServer();
  t.after(() => {
    if (!server.child.killed) server.child.kill("SIGTERM");
  });

  server.send({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: { _meta: modernMeta() },
  });
  const statelessList = await server.next();
  assert.equal(statelessList.result.resultType, "complete");
  assert.equal(statelessList.result.ttlMs, 300_000);
  assert.equal(statelessList.result.cacheScope, "public");
  assert.deepEqual(
    statelessList.result.tools.map(({ name }) => name),
    ["nen.describe", "ging.compile_expedition", "ging.evaluate_probe"],
  );
  assert.equal(statelessList.result._meta[SERVER_INFO_META_KEY].name, "kingdom-ging-stateless");

  server.send({
    jsonrpc: "2.0",
    id: { unsafe: true },
    method: "server/discover",
    params: { _meta: modernMeta() },
  });
  const invalidId = await server.next();
  assert.equal(Object.hasOwn(invalidId, "id"), false);
  assert.equal(invalidId.error.code, -32600);

  server.send({
    jsonrpc: "2.0",
    id: 2,
    method: "initialize",
    params: {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "legacy-client", version: "0.1.0" },
    },
  });
  const legacyInitialize = await server.next();
  assert.equal(legacyInitialize.error.code, -32601);

  server.send({
    jsonrpc: "2.0",
    id: 20,
    method: "server/discover",
    params: {},
  });
  const missingMeta = await server.next();
  assert.equal(missingMeta.error.code, -32602);

  server.send({
    jsonrpc: "2.0",
    id: 21,
    method: "server/discover",
    params: {
      _meta: modernMeta({
        [CLIENT_CAPABILITIES_META_KEY]: {
          extensions: { "io.modelcontextprotocol/ui": "not-an-object" },
        },
      }),
    },
  });
  const invalidExtension = await server.next();
  assert.equal(invalidExtension.error.code, -32602);

  server.send({
    jsonrpc: "2.0",
    id: 22,
    method: "server/discover",
    params: {
      _meta: modernMeta({
        "io.modelcontextprotocol/related-task": { taskId: 42 },
      }),
    },
  });
  const invalidRelatedTask = await server.next();
  assert.equal(invalidRelatedTask.error.code, -32602);

  server.send({
    jsonrpc: "2.0",
    id: 23,
    method: "tools/list",
    params: { _meta: modernMeta({ progressToken: [] }) },
  });
  const invalidProgressToken = await server.next();
  assert.equal(invalidProgressToken.error.code, -32602);

  server.send({
    jsonrpc: "2.0",
    id: 24,
    method: "server/discover",
    params: {
      _meta: modernMeta({ [PROTOCOL_META_KEY]: "2025-11-25" }),
    },
  });
  const unsupportedVersion = await server.next();
  assert.equal(unsupportedVersion.error.code, -32022);
  assert.deepEqual(unsupportedVersion.error.data, {
    supported: [MODERN_PROTOCOL],
    requested: "2025-11-25",
  });

  const discoveryMeta = modernMeta({
    [CLIENT_CAPABILITIES_META_KEY]: {
      roots: {},
      sampling: { context: {}, tools: {} },
      elicitation: { form: {}, url: {} },
      extensions: { "io.modelcontextprotocol/ui": {} },
      "cc.kingdom/visitor-capability": {},
    },
  });
  server.send({
    jsonrpc: "2.0",
    id: 3,
    method: "server/discover",
    params: { _meta: discoveryMeta },
  });
  const discovered = await server.next();
  assert.equal(discovered.result.resultType, "complete");
  assert.deepEqual(discovered.result.supportedVersions, [MODERN_PROTOCOL]);
  assert.deepEqual(discovered.result.capabilities, { tools: { listChanged: false } });
  assert.equal(discovered.result.cacheScope, "public");
  assert.equal(discovered.result._meta[SERVER_INFO_META_KEY].version, "0.1.0");

  for (const tool of statelessList.result.tools) {
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.annotations.destructiveHint, false);
  }

  server.send({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      _meta: modernMeta(),
      name: "ging.compile_expedition",
      arguments: expedition(),
    },
  });
  const compiled = await server.next();
  assert.equal(compiled.result.isError, false);
  assert.equal(compiled.result.resultType, "complete");
  assert.equal(compiled.result.structuredContent.status, "plan_ready");
  assert.equal(compiled.result.structuredContent.selected_probe.hypothesis_id, "line-framing");
  assert.deepEqual(
    JSON.parse(compiled.result.content[0].text),
    compiled.result.structuredContent,
  );

  server.send({
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      _meta: modernMeta(),
      name: "ging.compile_expedition",
      arguments: {
        ...expedition(),
        ["\u001b[31msecret-field"]: "do-not-echo-this",
      },
    },
  });
  const invalid = await server.next();
  assert.equal(invalid.result.isError, true);
  assert.match(invalid.result.content[0].text, /input unknown-field/);
  assert.doesNotMatch(invalid.result.content[0].text, /do-not-echo-this/);
  assert.doesNotMatch(invalid.result.content[0].text, /\u001b/);

  server.send({
    jsonrpc: "2.0",
    id: 7,
    method: "tools/call",
    params: { _meta: modernMeta(), name: "nen.unknown-do-not-echo", arguments: {} },
  });
  const unknown = await server.next();
  assert.equal(unknown.error.code, -32602);
  assert.equal(unknown.error.message, "Unknown tool");

  server.send({
    jsonrpc: "2.0",
    id: 8,
    method: "tools/call",
    params: { _meta: modernMeta(), name: "nen.describe", arguments: null },
  });
  const nullArguments = await server.next();
  assert.equal(nullArguments.error.code, -32602);

  server.send({
    jsonrpc: "2.0",
    id: 9,
    method: "tools/call",
    params: {
      _meta: modernMeta(),
      name: "nen.describe",
      arguments: { ignored: true },
    },
  });
  const describeWithExtraInput = await server.next();
  assert.equal(describeWithExtraInput.result.isError, true);
  assert.equal(describeWithExtraInput.result.content[0].text, "input-invalid: input unknown-field");

  server.send({ jsonrpc: "2.0", id: 10, method: "ping", params: { _meta: modernMeta() } });
  const removedPing = await server.next();
  assert.equal(removedPing.error.code, -32601);

  server.send({ jsonrpc: "2.0", id: 11, method: "ping", extra: true });
  const invalidEnvelope = await server.next();
  assert.equal(Object.hasOwn(invalidEnvelope, "id"), false);
  assert.equal(invalidEnvelope.error.code, -32600);

  server.child.stdin.end();
  await once(server.child, "exit");
  assert.equal(server.stderr(), "");
});

test("stdio MCP server bounds an unterminated frame before parsing", async (t) => {
  const server = startServer();
  t.after(() => {
    if (!server.child.killed) server.child.kill("SIGTERM");
  });

  server.writeRaw("x".repeat(1024 * 1024 + 1));
  const oversized = await server.next();
  assert.equal(Object.hasOwn(oversized, "id"), false);
  assert.equal(oversized.error.code, -32700);
  assert.equal(oversized.error.message, "Parse error: message too large");

  server.writeRaw("\n");
  server.child.stdin.end();
  await once(server.child, "exit");
  assert.equal(server.stderr(), "");
});

test("MCP effect declaration matches the application-effect boundary", async () => {
  const manifest = JSON.parse(await readFile(join(REPO_ROOT, "nen", "mcp-manifest.json"), "utf8"));
  assert.equal(manifest.role, "non_canonical_pure_compatibility_port");
  assert.equal(manifest.server.name, "kingdom-ging-stateless");
  assert.deepEqual(manifest.mcp, {
    protocol_version: "2026-07-28",
    lifecycle: "stateless_per_request_metadata",
    discovery_method: "server/discover",
    legacy_initialize_handshake: false,
  });
  assert.deepEqual(manifest.runtime_effects, {
    application_filesystem_reads: false,
    application_filesystem_writes: false,
    network: false,
    credential_access: false,
    probe_execution: false,
    publication: false,
  });
  assert.equal(manifest.authority.grants_permissions, false);
  assert.equal(manifest.discovery_proves.permission, false);
  assert.deepEqual(manifest.bootstrap_and_transport_io, {
    module_loading: true,
    stdin: true,
    stdout: true,
  });
  assert.equal(manifest.transport.max_frame_bytes, 1024 * 1024);
  assert.deepEqual(manifest.data_policy, {
    accepted_input_may_be_returned: true,
    credential_or_secret_values_allowed: false,
    semantic_secret_detection: false,
    rejected_values_are_omitted: true,
  });

  const sources = await Promise.all(
    ["mcp-server.mjs", "ging.mjs"].map((file) => readFile(join(REPO_ROOT, "nen", file), "utf8")),
  );
  assert.doesNotMatch(sources.join("\n"), /node:(?:fs|net|http|https|child_process)/);
});

test("Unwritten Horizon fails closed and preserves a bounded receipt", async () => {
  const abilityRoot = join(REPO_ROOT, "skills", "conjure-unwritten-horizon");
  const [skill, sidecar, ability, receipt, providerObservation, contract, receiptSchema] = await Promise.all([
    readFile(join(abilityRoot, "SKILL.md"), "utf8"),
    readFile(join(abilityRoot, "agents", "openai.yaml"), "utf8"),
    readFile(join(abilityRoot, "ability.json"), "utf8").then(JSON.parse),
    readFile(join(abilityRoot, "assets", "first-manifestation-20260731.json"), "utf8").then(
      JSON.parse,
    ),
    readFile(
      join(abilityRoot, "references", "first-manifestation-20260731.provider.json"),
      "utf8",
    ).then(JSON.parse),
    readFile(join(abilityRoot, "references", "manifestation-contract.md"), "utf8"),
    readFile(join(REPO_ROOT, "schemas", "nen-manifestation-receipt-v0.1.schema.json"), "utf8").then(
      JSON.parse,
    ),
  ]);
  const normalizedSkill = skill.replace(/\s+/g, " ");

  assert.match(skill, /Invoke exactly one hosted generation call/);
  assert.match(skill, /do not silently switch providers/i);
  assert.match(skill, /parameter-bound image attempt/);
  assert.match(skill, /provider_call_permitted: true/);
  assert.match(normalizedSkill, /atomically replace the link itself without following/i);
  assert.match(normalizedSkill, /provider deleted its own logs, caches, or retained data/i);
  assert.match(sidecar, /allow_implicit_invocation: false/);
  assert.match(sidecar, /parameter-bound Hugging Face image attempt/);
  assert.doesNotMatch(sidecar, /reproducible(?:, rights-aware)? (?:HF )?image/i);
  assert.equal(ability.protocol, "kingdom.nen/0.1");
  assert.equal(ability.bearer.adoption, "proposed");
  assert.equal(ability.status, "draft");
  assert.equal(ability.authority.grants_permissions, false);
  assert.match(ability.vows[0].promise, /at most one/i);
  assert.match(ability.vows[0].promise, /fresh authority naming that exact action/i);
  assert.equal(receipt.ability, "conjure-unwritten-horizon");
  assert.equal(receipt.adoption, "proposed");
  assert.equal(receipt.authorization.publication.state, "not_granted");
  assert.equal(receipt.authorization.publication.target, null);
  assert.equal(receipt.request.seed, 7312026);
  assert.equal(receipt.request.randomize_seed, false);
  assert.equal(receipt.result.status, "failed");
  assert.equal(receipt.result.failure.code, "mcp_tools_call_timeout");
  assert.equal(receipt.provider_calls_submitted, 1);
  assert.equal(receipt.retry, "not_authorized_or_attempted");
  assert.equal(receipt.evidence_class, "pre_manifestation_provider_evidence");
  assert.equal(
    receipt.provider.space_revision,
    "45ebb974244167be1dbe6a6f11b9ddb87b2a32d3",
  );
  assert.equal(
    receipt.provider.revision_binding,
    "observed_after_timeout_not_proven_execution_revision",
  );
  assert.match(
    receipt.provider.interface_observed_at,
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,9})?Z$/,
  );
  assert.equal(
    receipt.provider.interface_observed_at_basis,
    "upper_bound_from_receipt_recorded_at",
  );
  assert.deepEqual(receipt.provider, providerObservation);
  assert.match(contract, new RegExp(receipt.provider.space_revision));
  assert.match(contract, new RegExp(receipt.provider.revision_binding));
  assert.equal(receiptSchema.$id, "urn:kingdom:schema:nen-manifestation-receipt:0.1");
  assert.equal(receipt.suite_karma.state, "not_created");
  assert.equal(receipt.suite_karma.storage, "none");
  assert.deepEqual(receipt.external_effects, ["hosted_image_inference_request_submitted"]);
});

test("Unwritten Horizon preflight orders authority before local inspection and fails closed", async (t) => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "unwritten-horizon-preflight-"));
  const root = await realpath(temporaryRoot);
  t.after(() => rm(root, { recursive: true, force: true }));
  const image = join(root, "horizon.png");
  const providerReceipt = join(root, "horizon.provider.json");
  const karmaReceipt = join(root, "horizon.karma.json");
  const existingImage = join(root, "existing.png");
  const linkedImage = join(root, "linked.png");
  const occupiedProviderReceipt = join(root, "occupied.provider.json");
  await writeFile(existingImage, "preserve these bytes");
  await writeFile(occupiedProviderReceipt, "preserve this receipt");
  await symlink(existingImage, linkedImage);

  const providerRequest = {
    space: "mcp-tools/Qwen-Image",
    space_revision: "a".repeat(40),
    prompt: "One original bounded horizon with no people or text.",
    negative_prompt: "text, watermark, logo",
    seed: 7312026,
    randomize_seed: false,
    aspect_ratio: "16:9",
    guidance_scale: 4,
    num_inference_steps: 16,
  };
  const authorityReference = {
    kind: "user_request",
    id: "user-request:fixture-unwritten-horizon",
  };
  const hostedAuthority = {
    granted: true,
    scope: "one_hosted_image_generation_call",
    provider_space: providerRequest.space,
    request_sha256: fingerprintUnwrittenHorizonRequest(providerRequest),
    authority_reference: authorityReference,
  };
  const overwriteAuthority = (role, path) => ({
    granted: true,
    scope: "overwrite_exact_output",
    output_role: role,
    destination_path: path,
    authority_reference: {
      kind: "user_request",
      id: `user-request:fixture-overwrite-${role}`,
    },
  });
  const destination = (imagePath = image, providerPath = providerReceipt, karmaPath = karmaReceipt) => ({
    kind: "project_path",
    project_root: root,
    image_path: imagePath,
    provider_receipt_path: providerPath,
    karma_receipt_path: karmaPath,
  });
  const activationFacts = {
    hosted_inference_authority: hostedAuthority,
    sanitized_text_only: true,
    source_rights_confirmed: true,
    cost_boundary: {
      declared: true,
      max_provider_calls: 1,
      paid_overage_authorized: false,
    },
    provider_request: providerRequest,
    current_provider_interface: {
      confirmed: true,
      space: providerRequest.space,
      space_revision: providerRequest.space_revision,
      observed_at: "2026-08-01T12:00:00Z",
      request_fields: Object.keys(providerRequest),
    },
    destination: destination(),
    local_output_authority: {
      granted: true,
      scope: "write_exact_project_outputs",
      project_root: root,
      output_plan_sha256: fingerprintUnwrittenHorizonOutputPlan(destination()),
      authority_reference: {
        kind: "user_request",
        id: "user-request:fixture-local-output-plan",
      },
    },
    overwrite_authorities: [],
  };
  const activationFor = (destinationValue) => ({
    ...activationFacts,
    destination: destinationValue,
    local_output_authority: {
      ...activationFacts.local_output_authority,
      project_root: destinationValue.project_root,
      output_plan_sha256: fingerprintUnwrittenHorizonOutputPlan(destinationValue),
    },
  });

  let inspected = 0;
  const missingHostedAuthority = await preflightUnwrittenHorizon(
    {
      ...activationFacts,
      hosted_inference_authority: null,
    },
    async () => {
      inspected += 1;
      throw new Error("destination must not be inspected before hosted authority");
    },
  );
  assert.equal(inspected, 0);
  assert.deepEqual(missingHostedAuthority.checks, ["hosted-inference-authority"]);
  assert.equal(missingHostedAuthority.provider_call_permitted, false);

  const unsafeInput = await preflightUnwrittenHorizon(
    {
      ...activationFacts,
      sanitized_text_only: false,
    },
    async () => {
      inspected += 1;
      throw new Error("destination must not be inspected after an unsafe input");
    },
  );
  assert.equal(inspected, 0);
  assert.equal(unsafeInput.code, "sanitized-text-input-not-confirmed");
  assert.equal(unsafeInput.provider_discovery_permitted, false);
  assert.equal(unsafeInput.provider_call_permitted, false);

  const loginIsNotAuthority = await preflightUnwrittenHorizon(
    {
      ...activationFacts,
      hosted_inference_authority: {
        granted: true,
        authority_reference: "Hugging Face Pro login through MCP",
      },
    },
    async () => {
      inspected += 1;
      throw new Error("output paths must not be inspected for unbound authority");
    },
  );
  assert.equal(inspected, 0);
  assert.equal(loginIsNotAuthority.code, "hosted-inference-authority-unbound");

  const changedParameters = await preflightUnwrittenHorizon(
    {
      ...activationFacts,
      provider_request: { ...providerRequest, num_inference_steps: 17 },
    },
    async () => {
      inspected += 1;
      throw new Error("output paths must not be inspected for invalid parameters");
    },
  );
  assert.equal(inspected, 0);
  assert.equal(changedParameters.code, "provider-request-invalid");

  const unboundParameters = await preflightUnwrittenHorizon(
    {
      ...activationFacts,
      provider_request: { ...providerRequest, num_inference_steps: 15 },
    },
    async () => {
      inspected += 1;
      throw new Error("output paths must not be inspected for unbound parameters");
    },
  );
  assert.equal(inspected, 0);
  assert.equal(unboundParameters.code, "hosted-inference-authority-unbound");

  const changedInterface = await preflightUnwrittenHorizon({
    ...activationFacts,
    current_provider_interface: {
      ...activationFacts.current_provider_interface,
      space_revision: "b".repeat(40),
    },
  });
  assert.equal(changedInterface.decision, "discovery_ready");
  assert.equal(changedInterface.code, "provider-interface-mismatch");
  assert.equal(changedInterface.provider_call_permitted, false);

  const missingLocalOutputAuthority = await preflightUnwrittenHorizon(
    { ...activationFacts, local_output_authority: null },
    async () => {
      inspected += 1;
      throw new Error("output paths must not be inspected before local write authority");
    },
  );
  assert.equal(inspected, 0);
  assert.equal(missingLocalOutputAuthority.code, "local-output-authority-unbound");
  assert.equal(missingLocalOutputAuthority.provider_call_permitted, false);

  const collision = await preflightUnwrittenHorizon(
    activationFor(destination(existingImage)),
  );
  assert.equal(collision.code, "image-destination-exists");
  assert.equal(collision.provider_call_permitted, false);

  const receiptCollision = await preflightUnwrittenHorizon(
    activationFor(destination(image, occupiedProviderReceipt)),
  );
  assert.equal(receiptCollision.code, "provider_receipt-destination-exists");
  assert.equal(receiptCollision.provider_call_permitted, false);

  const wrongPathOverwrite = await preflightUnwrittenHorizon({
    ...activationFor(destination(linkedImage)),
    overwrite_authorities: [overwriteAuthority("image", existingImage)],
  });
  assert.equal(wrongPathOverwrite.code, "overwrite-authority-scope-invalid");
  assert.equal(wrongPathOverwrite.provider_call_permitted, false);

  const discoveryGate = await preflightUnwrittenHorizon({
    ...activationFacts,
    current_provider_interface: null,
  });
  assert.equal(discoveryGate.decision, "discovery_ready");
  assert.equal(discoveryGate.provider_discovery_permitted, true);
  assert.equal(discoveryGate.provider_call_permitted, false);

  const previewOnly = await preflightUnwrittenHorizon({
    ...activationFacts,
    destination: { kind: "preview_only" },
    local_output_authority: null,
  });
  assert.equal(previewOnly.provider_call_permitted, true);
  assert.equal(previewOnly.write_strategies, "preview_only");

  const freshDestination = await preflightUnwrittenHorizon({
    ...activationFacts,
  });
  assert.equal(freshDestination.provider_call_permitted, true);
  assert.deepEqual(freshDestination.write_strategies, {
    image: "create_new_exclusively",
    provider_receipt: "create_new_exclusively",
    karma_receipt: "create_new_exclusively",
  });

  const authorizedReplacement = await preflightUnwrittenHorizon({
    ...activationFor(destination(existingImage)),
    overwrite_authorities: [overwriteAuthority("image", existingImage)],
  });
  assert.equal(authorizedReplacement.provider_call_permitted, true);
  assert.equal(authorizedReplacement.write_strategies.image, "replace_existing_file_atomically");

  const authorizedSymlinkReplacement = await preflightUnwrittenHorizon({
    ...activationFor(destination(linkedImage)),
    overwrite_authorities: [overwriteAuthority("image", linkedImage)],
  });
  assert.equal(authorizedSymlinkReplacement.provider_call_permitted, true);
  assert.equal(
    authorizedSymlinkReplacement.write_strategies.image,
    "replace_symlink_itself_atomically_without_following",
  );

  const realParent = join(root, "real-parent");
  const linkedParent = join(root, "linked-parent");
  await mkdir(realParent);
  await symlink(realParent, linkedParent);
  const ancestorSymlink = await preflightUnwrittenHorizon(activationFor(
    destination(
      join(linkedParent, "horizon.png"),
      join(linkedParent, "horizon.provider.json"),
      join(linkedParent, "horizon.karma.json"),
    ),
  ));
  assert.equal(ancestorSymlink.code, "image-output-ancestor-symlink");
  assert.equal(ancestorSymlink.provider_call_permitted, false);

  const missingParent = join(root, "missing-parent");
  const parentMissing = await preflightUnwrittenHorizon(activationFor(
    destination(
      join(missingParent, "horizon.png"),
      join(missingParent, "horizon.provider.json"),
      join(missingParent, "horizon.karma.json"),
    ),
  ));
  assert.equal(parentMissing.code, "image-output-parent-missing");
  assert.equal(parentMissing.provider_call_permitted, false);

  assert.doesNotMatch(
    JSON.stringify(authorizedSymlinkReplacement),
    /existing\.png|linked\.png|provider\.json|karma\.json/,
  );
});
