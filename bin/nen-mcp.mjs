#!/usr/bin/env node

import { spawn } from "node:child_process";
import { lstatSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { strictJson } from "./nen.mjs";

const PROTOCOL_VERSION = "2026-07-28";
const CODEX_COMPAT_PROTOCOL_VERSION = "2025-06-18";
const SERVER_VERSION = "0.1.0";
const MAX_LINE_BYTES = 256 * 1024;
const MAX_CHILD_OUTPUT_BYTES = 1024 * 1024;
const MAX_REQUESTS = 256;
const MAX_ACTIVE_TOOL_CALLS = 4;
const COMMAND_TIMEOUT_MS = 5_000;
const TERMINATION_GRACE_MS = 250;
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const OS_ROOT = dirname(dirname(SCRIPT_PATH));
const NEN_CLI = join(OS_ROOT, "bin", "nen.mjs");
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// A receipt the verify tool may read: a plain path under this repository's
// records/ directory, one to four directories deep, ending in .json. Every
// segment starts with a letter or digit, so "." and ".." cannot appear.
const RECEIPT_PATH_SOURCE = "^records/(?:[A-Za-z0-9][A-Za-z0-9._-]{0,127}/){1,4}[A-Za-z0-9][A-Za-z0-9._-]{0,122}\\.json$";
const RECEIPT_PATH = new RegExp(RECEIPT_PATH_SOURCE);
const MAX_RECEIPT_PATH_LENGTH = 512;
const SERVER_INSTRUCTIONS = "Read-only local KAKIN Nen inspection, draft KARMA scaffolding, and KARMA receipt verification. Tools perform no network call, fetch, write, inference, installation, skill execution, or authority grant; receipt verification reads one receipt under records/, its record directory, and, when asked, this repository's local Git objects. A draft receipt is not final evidence. A valid receipt is unsigned: it shows structure and matching local digests, not that a finding is true or that anything is permitted.";
const SERVER_RESULT_META = {
  "io.modelcontextprotocol/serverInfo": {
    name: "kingdom-nen",
    version: SERVER_VERSION,
  },
};
const INVOCATION_ARGS = process.argv.slice(2);
const CODEX_COMPAT = INVOCATION_ARGS.length === 1
  && INVOCATION_ARGS[0] === "--codex-compat";
const INVOCATION_VALID = INVOCATION_ARGS.length === 0 || CODEX_COMPAT;

const EMPTY_INPUT = {
  type: "object",
  additionalProperties: false,
};

const OPTIONAL_ABILITY_INPUT = {
  type: "object",
  additionalProperties: false,
  properties: {
    ability_id: {
      type: "string",
      pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
      minLength: 1,
      maxLength: 64,
    },
  },
};

const REQUIRED_ABILITY_INPUT = {
  ...OPTIONAL_ABILITY_INPUT,
  required: ["ability_id"],
};

const RECEIPT_VERIFY_INPUT = {
  type: "object",
  additionalProperties: false,
  required: ["receipt_path"],
  properties: {
    receipt_path: {
      type: "string",
      pattern: RECEIPT_PATH_SOURCE,
      minLength: 1,
      maxLength: MAX_RECEIPT_PATH_LENGTH,
    },
    at_revision: {
      type: "boolean",
    },
  },
};

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const TOOLS = [
  {
    name: "kingdom_nen_list",
    title: "List KAKIN Nen abilities",
    description: "List the fixed local KAKIN suite with manifest and bundle digests. This performs no network call, write, inference, skill execution, installation, or authority grant.",
    inputSchema: EMPTY_INPUT,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "kingdom_nen_validate",
    title: "Validate KAKIN Nen abilities",
    description: "Strictly validate every local KAKIN ability, or one named ability. Validation establishes structure and current local digests only; it does not prove truth, consent, safety, adoption, or permission.",
    inputSchema: OPTIONAL_ABILITY_INPUT,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "kingdom_nen_show",
    title: "Show one Nen manifest",
    description: "Return one validated local ability manifest by ID. The manifest is declared repository evidence, not an activated skill or authority token.",
    inputSchema: REQUIRED_ABILITY_INPUT,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "kingdom_nen_types",
    title: "List software Nen affinities",
    description: "Return the KAKIN effect-based software affinity map. Affinity never classifies a being's personality, identity, worth, caste, or rank.",
    inputSchema: EMPTY_INPUT,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "kingdom_karma_receipt_template",
    title: "Create KARMA receipt scaffolding",
    description: "Return in memory a state=draft KARMA receipt template bound to one currently valid ability. The draft is not final causal evidence and verify-receipt rejects it until invocation facts replace every placeholder.",
    inputSchema: REQUIRED_ABILITY_INPUT,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "kingdom_karma_receipt_verify",
    title: "Verify one KARMA receipt",
    description: "Verify one KARMA receipt stored under this repository's records/ directory. It checks the closed schema, time order, template placeholders, and the bound ability's manifest and bundle digests: against the working tree by default, or with at_revision against the suite at the receipt's own ability_revision, read from local Git objects and never fetched. It recomputes SHA-256 for outputs and inputs found in the receipt's record directory and, with at_revision, for inputs at exact revisions already present locally; remote and unreachable entries are listed as not recomputed. Receipts are unsigned: a valid result proves no finding true and authorizes nothing. An invalid receipt returns isError with the validation payload as result.",
    inputSchema: RECEIPT_VERIFY_INPUT,
    annotations: READ_ONLY_ANNOTATIONS,
  },
];

const TOOL_COMMANDS = new Map([
  ["kingdom_nen_list", () => ["list", "--json"]],
  ["kingdom_nen_validate", (argumentsValue) => [
    "validate",
    ...(argumentsValue.ability_id ? [argumentsValue.ability_id] : []),
    "--json",
  ]],
  ["kingdom_nen_show", (argumentsValue) => ["show", argumentsValue.ability_id]],
  ["kingdom_nen_types", () => ["types", "--json"]],
  ["kingdom_karma_receipt_template", (argumentsValue) => ["receipt-template", argumentsValue.ability_id]],
  ["kingdom_karma_receipt_verify", (argumentsValue) => {
    const receipt = containedReceiptPath(argumentsValue.receipt_path);
    if (receipt === null) return null;
    return [
      "verify-receipt",
      receipt,
      ...(argumentsValue.at_revision === true ? ["--at-revision"] : []),
      "--json",
    ];
  }],
]);

// Resolve a validated receipt path inside this repository without following a
// symlink at any step. Beyond the suite the other tools already read, the
// verifier then reads only that receipt, its own record directory and, with
// at_revision, this repository's local Git objects.
function containedReceiptPath(relative) {
  const parts = relative.split("/");
  let current = OS_ROOT;
  for (const [index, part] of parts.entries()) {
    current = join(current, part);
    let stat;
    try {
      stat = lstatSync(current);
    } catch {
      return null;
    }
    if (stat.isSymbolicLink()) return null;
    const leaf = index === parts.length - 1;
    if (!leaf && !stat.isDirectory()) return null;
    if (leaf && !stat.isFile()) return null;
  }
  return current;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, allowed, required = []) {
  if (!isObject(value)) return false;
  const keys = Object.keys(value);
  return keys.every((key) => allowed.includes(key))
    && required.every((key) => Object.hasOwn(value, key));
}

function rpcError(id, code, message, data = undefined) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return { jsonrpc: "2.0", id, error };
}

function unsupportedVersion(id, requested, supported = [PROTOCOL_VERSION]) {
  return rpcError(id, -32022, "Unsupported protocol version", {
    supported,
    requested: typeof requested === "string" ? requested : null,
  });
}

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function modernMetadataError(params, id) {
  if (!isObject(params) || !isObject(params._meta)) {
    return rpcError(id, -32602, "Modern MCP request metadata is required", {
      supported: [PROTOCOL_VERSION],
    });
  }
  const meta = params._meta;
  const requested = meta["io.modelcontextprotocol/protocolVersion"];
  if (requested !== PROTOCOL_VERSION) return unsupportedVersion(id, requested);
  const clientInfo = meta["io.modelcontextprotocol/clientInfo"];
  const capabilities = meta["io.modelcontextprotocol/clientCapabilities"];
  if (
    !isObject(capabilities)
    || (
      clientInfo !== undefined
      && (
        !isObject(clientInfo)
        || typeof clientInfo.name !== "string"
        || clientInfo.name.length === 0
        || typeof clientInfo.version !== "string"
        || clientInfo.version.length === 0
      )
    )
  ) {
    return rpcError(id, -32602, "Invalid modern MCP client metadata", {
      supported: [PROTOCOL_VERSION],
    });
  }
  return null;
}

function validateToolArguments(name, value) {
  if (!isObject(value)) return "arguments must be an object";
  if (name === "kingdom_karma_receipt_verify") {
    if (!hasExactKeys(value, ["receipt_path", "at_revision"], ["receipt_path"])) {
      return "receipt_path is required and at_revision is the only other argument";
    }
    if (
      typeof value.receipt_path !== "string"
      || value.receipt_path.length > MAX_RECEIPT_PATH_LENGTH
      || !RECEIPT_PATH.test(value.receipt_path)
    ) return "receipt_path must be a plain relative path to a .json file under records/";
    if (Object.hasOwn(value, "at_revision") && typeof value.at_revision !== "boolean") {
      return "at_revision must be a boolean";
    }
    return null;
  }
  const abilityTool = name === "kingdom_nen_validate"
    || name === "kingdom_nen_show"
    || name === "kingdom_karma_receipt_template";
  if (!abilityTool && Object.keys(value).length !== 0) return "this tool accepts no arguments";
  if (abilityTool && !hasExactKeys(value, ["ability_id"])) return "unexpected tool argument";
  if (name !== "kingdom_nen_validate" && abilityTool && !Object.hasOwn(value, "ability_id")) {
    return "ability_id is required";
  }
  if (Object.hasOwn(value, "ability_id")) {
    if (
      typeof value.ability_id !== "string"
      || value.ability_id.length > 64
      || !ID_PATTERN.test(value.ability_id)
    ) return "ability_id is invalid";
  }
  return null;
}

function boundedDiagnostics(stderr) {
  return stderr
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 64);
}

function runNenCli(args, signal) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [NEN_CLI, ...args], {
      cwd: OS_ROOT,
      env: {
        PATH: process.env.PATH ?? "/usr/bin:/bin",
        LANG: "C",
        LC_ALL: "C",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let outputExceeded = false;
    let timedOut = false;
    let cancelled = false;
    let settled = false;
    let timer = null;
    let forceKillTimer = null;

    const terminate = () => {
      child.kill("SIGTERM");
      if (forceKillTimer === null) {
        forceKillTimer = setTimeout(() => child.kill("SIGKILL"), TERMINATION_GRACE_MS);
      }
    };
    const onAbort = () => {
      cancelled = true;
      terminate();
    };

    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeout(timer);
      if (forceKillTimer !== null) clearTimeout(forceKillTimer);
      signal?.removeEventListener("abort", onAbort);
      resolvePromise(value);
    };
    const append = (kind, chunk) => {
      outputBytes += chunk.byteLength;
      if (outputBytes > MAX_CHILD_OUTPUT_BYTES) {
        outputExceeded = true;
        terminate();
        return;
      }
      if (kind === "stdout") stdout += chunk.toString("utf8");
      else stderr += chunk.toString("utf8");
    };

    child.stdout.on("data", (chunk) => append("stdout", chunk));
    child.stderr.on("data", (chunk) => append("stderr", chunk));
    child.on("error", () => finish({ ok: false, code: "spawn-failed", diagnostics: [] }));
    child.on("close", (exitCode) => {
      if (cancelled) return finish({ ok: false, cancelled: true, code: "cancelled", diagnostics: [] });
      if (timedOut) return finish({ ok: false, code: "timeout", diagnostics: [] });
      if (outputExceeded) return finish({ ok: false, code: "output-limit", diagnostics: [] });
      let payload = null;
      const trimmed = stdout.trim();
      if (trimmed.length > 0) {
        try {
          payload = JSON.parse(trimmed);
        } catch {
          return finish({ ok: false, code: "invalid-cli-output", diagnostics: [] });
        }
      }
      finish({
        ok: exitCode === 0 && payload !== null,
        code: exitCode === 0 ? "complete" : "nen-command-failed",
        exitCode,
        payload,
        diagnostics: boundedDiagnostics(stderr),
      });
    });
    timer = setTimeout(() => {
      timedOut = true;
      terminate();
    }, COMMAND_TIMEOUT_MS);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}

function toolResult(payload, isError, modern) {
  const result = {
    content: [{ type: "text", text: JSON.stringify(payload) }],
    structuredContent: payload,
    isError,
  };
  if (!modern) return result;
  return {
    resultType: "complete",
    ...result,
    _meta: SERVER_RESULT_META,
  };
}

let activeToolCalls = 0;
const toolCallWaiters = [];

function releaseToolCallSlot() {
  activeToolCalls -= 1;
  while (toolCallWaiters.length > 0) {
    const waiter = toolCallWaiters.shift();
    waiter.signal.removeEventListener("abort", waiter.onAbort);
    if (waiter.signal.aborted) {
      waiter.resolve(false);
      continue;
    }
    activeToolCalls += 1;
    waiter.resolve(true);
    return;
  }
}

function acquireToolCallSlot(signal) {
  if (signal.aborted) return Promise.resolve(false);
  if (activeToolCalls < MAX_ACTIVE_TOOL_CALLS) {
    activeToolCalls += 1;
    return Promise.resolve(true);
  }
  return new Promise((resolvePromise) => {
    const waiter = {
      signal,
      resolve: resolvePromise,
      onAbort: null,
    };
    waiter.onAbort = () => {
      const index = toolCallWaiters.indexOf(waiter);
      if (index >= 0) toolCallWaiters.splice(index, 1);
      signal.removeEventListener("abort", waiter.onAbort);
      resolvePromise(false);
    };
    toolCallWaiters.push(waiter);
    signal.addEventListener("abort", waiter.onAbort, { once: true });
    if (signal.aborted) waiter.onAbort();
  });
}

async function callTool(name, argumentsValue, signal, modern) {
  const command = TOOL_COMMANDS.get(name);
  if (!command) return null;
  const acquired = await acquireToolCallSlot(signal);
  if (!acquired) return null;
  try {
    if (signal.aborted) return null;
    const args = command(argumentsValue);
    if (args === null) {
      return toolResult({
        protocol: "kingdom.nen-mcp-error/0.1",
        code: "receipt-path-unavailable",
        exit_code: null,
        diagnostics: [],
        result: null,
      }, true, modern);
    }
    const execution = await runNenCli(args, signal);
    if (execution.cancelled) return null;
    if (execution.ok) return toolResult(execution.payload, false, modern);
    return toolResult({
      protocol: "kingdom.nen-mcp-error/0.1",
      code: execution.code,
      exit_code: execution.exitCode ?? null,
      diagnostics: execution.diagnostics,
      result: execution.payload,
    }, true, modern);
  } finally {
    releaseToolCallSlot();
  }
}

let requestCount = 0;
let compatInitialized = false;
let compatReady = false;

function validCompatInitializeParams(params) {
  return hasExactKeys(
    params,
    ["protocolVersion", "capabilities", "clientInfo", "_meta"],
    ["protocolVersion", "capabilities", "clientInfo"],
  )
    && isObject(params.capabilities)
    && isObject(params.clientInfo)
    && typeof params.protocolVersion === "string"
    && params.protocolVersion.length > 0
    && typeof params.clientInfo.name === "string"
    && params.clientInfo.name.length > 0
    && typeof params.clientInfo.version === "string"
    && params.clientInfo.version.length > 0
    && (!Object.hasOwn(params, "_meta") || isObject(params._meta));
}

function hasModernProtocolMetadata(params) {
  return isObject(params)
    && isObject(params._meta)
    && Object.hasOwn(params._meta, "io.modelcontextprotocol/protocolVersion");
}

async function handleCompatRequest(message, params, signal) {
  const { id, method } = message;
  if (method === "initialize") {
    if (!validCompatInitializeParams(params)) {
      return rpcError(id, -32602, "Invalid initialize parameters", {
        supported: [CODEX_COMPAT_PROTOCOL_VERSION],
      });
    }
    if (compatInitialized) return rpcError(id, -32600, "Server is already initialized");
    compatInitialized = true;
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: CODEX_COMPAT_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "kingdom-nen", version: SERVER_VERSION },
        instructions: SERVER_INSTRUCTIONS,
      },
    };
  }

  if (method === "ping") {
    if (!isObject(params) || (Object.hasOwn(params, "_meta") && !isObject(params._meta))) {
      return rpcError(id, -32602, "Invalid ping parameters");
    }
    return { jsonrpc: "2.0", id, result: {} };
  }

  if (!compatInitialized) return rpcError(id, -32002, "Server is not initialized");
  if (!compatReady) return rpcError(id, -32002, "Client has not sent notifications/initialized");

  if (method === "tools/list") {
    if (!hasExactKeys(params, ["_meta", "cursor"]) || (Object.hasOwn(params, "_meta") && !isObject(params._meta))) {
      return rpcError(id, -32602, "Invalid tools/list parameters");
    }
    if (Object.hasOwn(params, "cursor")) {
      return rpcError(id, -32602, "This fixed tool list is not paginated");
    }
    return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  }

  if (method === "tools/call") {
    if (!hasExactKeys(params, ["_meta", "name", "arguments"], ["name"])) {
      return rpcError(id, -32602, "Invalid tools/call parameters");
    }
    if (Object.hasOwn(params, "_meta") && !isObject(params._meta)) {
      return rpcError(id, -32602, "Invalid tools/call metadata");
    }
    if (typeof params.name !== "string" || !TOOL_COMMANDS.has(params.name)) {
      return rpcError(id, -32602, "Unknown tool");
    }
    const argumentsValue = params.arguments ?? Object.create(null);
    const argumentError = validateToolArguments(params.name, argumentsValue);
    if (argumentError) return rpcError(id, -32602, argumentError);
    const result = await callTool(params.name, argumentsValue, signal, false);
    if (signal.aborted || result === null) return null;
    return { jsonrpc: "2.0", id, result };
  }

  return rpcError(id, -32601, "Method not found", {
    supported: [CODEX_COMPAT_PROTOCOL_VERSION],
  });
}

async function handleModernRequest(message, params, signal) {
  const { id, method } = message;
  if (method === "initialize") {
    return rpcError(id, -32601, `Legacy initialize is not supported; supported protocol version: ${PROTOCOL_VERSION}`, {
      supported: [PROTOCOL_VERSION],
    });
  }
  const metadataError = modernMetadataError(params, id);
  if (metadataError) return metadataError;

  if (method === "server/discover") {
    if (!hasExactKeys(params, ["_meta"], ["_meta"])) {
      return rpcError(id, -32602, "server/discover accepts only standard request metadata");
    }
    return {
      jsonrpc: "2.0",
      id,
      result: {
        resultType: "complete",
        supportedVersions: [PROTOCOL_VERSION],
        capabilities: { tools: { listChanged: false } },
        _meta: SERVER_RESULT_META,
        instructions: SERVER_INSTRUCTIONS,
        ttlMs: 300_000,
        cacheScope: "public",
      },
    };
  }

  if (method === "tools/list") {
    if (!hasExactKeys(params, ["_meta", "cursor"], ["_meta"])) {
      return rpcError(id, -32602, "Invalid tools/list parameters");
    }
    if (Object.hasOwn(params, "cursor")) {
      return rpcError(id, -32602, "This fixed tool list is not paginated");
    }
    return {
      jsonrpc: "2.0",
      id,
      result: {
        resultType: "complete",
        tools: TOOLS,
        ttlMs: 300_000,
        cacheScope: "public",
        _meta: SERVER_RESULT_META,
      },
    };
  }

  if (method === "tools/call") {
    if (!hasExactKeys(params, ["_meta", "name", "arguments"], ["_meta", "name"])) {
      return rpcError(id, -32602, "Invalid tools/call parameters");
    }
    if (typeof params.name !== "string" || !TOOL_COMMANDS.has(params.name)) {
      return rpcError(id, -32602, "Unknown tool");
    }
    const argumentsValue = params.arguments ?? Object.create(null);
    const argumentError = validateToolArguments(params.name, argumentsValue);
    if (argumentError) return rpcError(id, -32602, argumentError);
    const result = await callTool(params.name, argumentsValue, signal, true);
    if (signal.aborted || result === null) return null;
    return { jsonrpc: "2.0", id, result };
  }

  return rpcError(id, -32601, "Method not found", { supported: [PROTOCOL_VERSION] });
}

async function handleMessage(message, signal) {
  if (!isObject(message) || message.jsonrpc !== "2.0") {
    return rpcError(null, -32600, "Invalid JSON-RPC request");
  }
  const hasId = Object.hasOwn(message, "id");
  if (!hasId) return null;
  const id = message.id;
  if (!((typeof id === "string" && id.length > 0) || (typeof id === "number" && Number.isFinite(id)))) {
    return rpcError(null, -32600, "Invalid JSON-RPC request id");
  }
  if (!hasExactKeys(message, ["jsonrpc", "id", "method", "params"], ["jsonrpc", "id", "method"])) {
    return rpcError(id, -32600, "Invalid JSON-RPC request shape");
  }
  if (typeof message.method !== "string") return rpcError(id, -32600, "Invalid JSON-RPC method");
  requestCount += 1;
  if (requestCount > MAX_REQUESTS) return rpcError(id, -33000, "Per-process request limit exceeded");

  const params = message.params ?? Object.create(null);
  const modernLane = message.method === "server/discover"
    || hasModernProtocolMetadata(params)
    || !CODEX_COMPAT;
  if (modernLane && !Object.hasOwn(message, "params")) {
    return rpcError(id, -32600, "Invalid JSON-RPC request shape");
  }
  if (modernLane) return handleModernRequest(message, params, signal);
  return handleCompatRequest(message, params, signal);
}

const activeRequests = new Map();
const inFlight = new Set();

function handleNotification(message) {
  if (
    CODEX_COMPAT
    && compatInitialized
    && isObject(message)
    && message.jsonrpc === "2.0"
    && message.method === "notifications/initialized"
    && (!Object.hasOwn(message, "params") || isObject(message.params))
  ) {
    compatReady = true;
    return;
  }
  if (
    !isObject(message)
    || message.jsonrpc !== "2.0"
    || message.method !== "notifications/cancelled"
    || !isObject(message.params)
  ) return;
  const requestId = message.params.requestId;
  if (!((typeof requestId === "string" && requestId.length > 0) || (typeof requestId === "number" && Number.isFinite(requestId)))) {
    return;
  }
  const controller = activeRequests.get(requestId);
  if (controller) controller.abort(typeof message.params.reason === "string" ? message.params.reason : "cancelled");
}

function scheduleMessage(message) {
  if (!isObject(message) || !Object.hasOwn(message, "id")) {
    handleNotification(message);
    return;
  }
  const id = message.id;
  const trackable = (typeof id === "string" && id.length > 0)
    || (typeof id === "number" && Number.isFinite(id));
  if (trackable && activeRequests.has(id)) {
    writeMessage(rpcError(id, -32600, "Duplicate in-flight request id"));
    return;
  }
  const controller = new AbortController();
  if (trackable) activeRequests.set(id, controller);
  const task = handleMessage(message, controller.signal)
    .then((response) => {
      if (!controller.signal.aborted && response !== null) writeMessage(response);
    })
    .catch(() => {
      if (!controller.signal.aborted) writeMessage(rpcError(trackable ? id : null, -32603, "Internal MCP server error"));
    })
    .finally(() => {
      if (trackable) activeRequests.delete(id);
      inFlight.delete(task);
    });
  inFlight.add(task);
}

function handleLine(bytes) {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_LINE_BYTES) {
    writeMessage(rpcError(null, -32700, "Invalid or oversized JSON-RPC line"));
    return;
  }
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    writeMessage(rpcError(null, -32700, "Invalid UTF-8 JSON-RPC message"));
    return;
  }
  let message;
  try {
    message = strictJson(text);
  } catch {
    writeMessage(rpcError(null, -32700, "Invalid JSON-RPC message"));
    return;
  }
  scheduleMessage(message);
}

async function main() {
  if (!INVOCATION_VALID) {
    process.stderr.write("usage: nen-mcp.mjs [--codex-compat]\n");
    return 2;
  }
  let pending = Buffer.alloc(0);
  for await (const chunk of process.stdin) {
    pending = Buffer.concat([pending, chunk]);
    let newline = pending.indexOf(0x0a);
    while (newline >= 0) {
      let line = pending.subarray(0, newline);
      pending = pending.subarray(newline + 1);
      if (line.at(-1) === 0x0d) line = line.subarray(0, -1);
      handleLine(line);
      newline = pending.indexOf(0x0a);
    }
    if (pending.byteLength > MAX_LINE_BYTES) {
      writeMessage(rpcError(null, -32700, "Oversized JSON-RPC message"));
      return 1;
    }
  }
  if (pending.byteLength !== 0) {
    writeMessage(rpcError(null, -32700, "Unterminated JSON-RPC message"));
    return 1;
  }
  await Promise.allSettled([...inFlight]);
  return 0;
}

try {
  process.exitCode = await main();
} catch {
  writeMessage(rpcError(null, -32603, "Internal MCP server error"));
  process.exitCode = 1;
}
