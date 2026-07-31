#!/usr/bin/env node

import {
  COMPILE_INPUT_SCHEMA,
  DESCRIBE_INPUT_SCHEMA,
  EVALUATE_INPUT_SCHEMA,
  NenInputError,
  compileExpedition,
  describeNen,
  evaluateProbe,
} from "./ging.mjs";

const SERVER_VERSION = "0.1.0";
const PROTOCOL_VERSION = "2026-07-28";
const SUPPORTED_PROTOCOLS = [PROTOCOL_VERSION];
const MAX_FRAME_BYTES = 1024 * 1024;
const CACHE_TTL_MS = 300_000;
const LOG_LEVELS = new Set([
  "debug",
  "info",
  "notice",
  "warning",
  "error",
  "critical",
  "alert",
  "emergency",
]);

const SERVER_INFO = {
  name: "kingdom-ging-stateless",
  title: "KINGDOM Ging Stateless Compatibility Port",
  version: SERVER_VERSION,
  description: "Pure, local expedition planning and receipt evaluation",
};

const RESULT_META = {
  "io.modelcontextprotocol/serverInfo": SERVER_INFO,
};

const INSTRUCTIONS =
  "These tools perform computation only. Accepted fields may be returned verbatim: never send credential or secret values. MCP discovery and caller declarations do not grant permission, authenticate receipts, execute probes, or determine truth.";

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const TOOLS = [
  {
    name: "nen.describe",
    title: "Describe the Nen layers",
    description:
      "Return the creative-operational Dark Continent, Nen, Skill, MCP, Ging, rights, and truth boundaries. Performs no filesystem, network, credential, or external action.",
    inputSchema: DESCRIBE_INPUT_SCHEMA,
    annotations: readOnlyAnnotations,
  },
  {
    name: "ging.compile_expedition",
    title: "Compile a Ging expedition",
    description:
      "Order caller-supplied mechanisms by observation coverage and select the first structurally eligible probe candidate. Checks declared fields only; never proves minimality, verifies permission, or executes a probe.",
    inputSchema: COMPILE_INPUT_SCHEMA,
    annotations: readOnlyAnnotations,
  },
  {
    name: "ging.evaluate_probe",
    title: "Evaluate a Ging probe receipt",
    description:
      "Structurally bind a caller-supplied receipt to the selected probe, then classify it as provisionally supported, challenged, or inconclusive. Does not authenticate the receipt, perform effects, or determine truth.",
    inputSchema: EVALUATE_INPUT_SCHEMA,
    annotations: readOnlyAnnotations,
  },
];

function describeNenTool(input) {
  if (!isObject(input)) throw new NenInputError("input", "invalid-type");
  if (Object.keys(input).length) throw new NenInputError("input", "unknown-field");
  return describeNen();
}

const handlers = new Map([
  ["nen.describe", describeNenTool],
  ["ging.compile_expedition", compileExpedition],
  ["ging.evaluate_probe", evaluateProbe],
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value, allowed) {
  return Object.keys(value).every((key) => allowed.has(key));
}

function isRequestId(value) {
  if (typeof value === "number") return Number.isSafeInteger(value);
  return (
    typeof value === "string" &&
    value.length <= 128 &&
    !/[\u0000-\u001f\u007f]/u.test(value)
  );
}

function isBoundedString(value, max, { empty = false } = {}) {
  return (
    typeof value === "string" &&
    (empty || value.length > 0) &&
    value.length <= max &&
    !/[\u0000-\u001f\u007f]/u.test(value)
  );
}

function isMetaKey(key, { prefixRequired = false } = {}) {
  if (typeof key !== "string" || key.length > 256) return false;
  const slash = key.indexOf("/");
  if (slash === -1) {
    return !prefixRequired && /^(?:[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?)?$/.test(key);
  }
  if (key.indexOf("/", slash + 1) !== -1) return false;
  const prefix = key.slice(0, slash);
  const name = key.slice(slash + 1);
  const labels = prefix.split(".");
  return (
    labels.length >= 1 &&
    labels.every((label) => /^[A-Za-z](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label)) &&
    /^(?:[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?)?$/.test(name)
  );
}

function isProgressToken(value) {
  return (
    (typeof value === "string" && value.length <= 128) ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function isIcon(value) {
  return (
    isObject(value) &&
    hasOnlyKeys(value, new Set(["src", "mimeType", "sizes", "theme"])) &&
    isBoundedString(value.src, 2048) &&
    (!Object.hasOwn(value, "mimeType") || isBoundedString(value.mimeType, 128)) &&
    (!Object.hasOwn(value, "sizes") ||
      (Array.isArray(value.sizes) &&
        value.sizes.length <= 16 &&
        value.sizes.every((size) => isBoundedString(size, 32)))) &&
    (!Object.hasOwn(value, "theme") || ["light", "dark"].includes(value.theme))
  );
}

function isImplementationInfo(value) {
  return (
    isObject(value) &&
    hasOnlyKeys(
      value,
      new Set(["name", "version", "title", "description", "websiteUrl", "icons"]),
    ) &&
    isBoundedString(value.name, 128) &&
    isBoundedString(value.version, 64) &&
    (!Object.hasOwn(value, "title") || isBoundedString(value.title, 256)) &&
    (!Object.hasOwn(value, "description") || isBoundedString(value.description, 1024)) &&
    (!Object.hasOwn(value, "websiteUrl") || isBoundedString(value.websiteUrl, 2048)) &&
    (!Object.hasOwn(value, "icons") ||
      (Array.isArray(value.icons) && value.icons.length <= 16 && value.icons.every(isIcon)))
  );
}

function markerFields(value, fields) {
  return (
    isObject(value) &&
    hasOnlyKeys(value, new Set(fields)) &&
    fields.every((field) => !Object.hasOwn(value, field) || isObject(value[field]))
  );
}

function isCapabilityRecord(value, { extensionIds = false } = {}) {
  return (
    isObject(value) &&
    Object.entries(value).every(
      ([key, settings]) =>
        (!extensionIds || isMetaKey(key, { prefixRequired: true })) && isObject(settings),
    )
  );
}

function isClientCapabilities(value) {
  if (!isObject(value)) return false;
  for (const capability of Object.values(value)) {
    if (!isObject(capability)) return false;
  }
  if (
    Object.hasOwn(value, "experimental") &&
    !isCapabilityRecord(value.experimental)
  ) {
    return false;
  }
  if (
    Object.hasOwn(value, "extensions") &&
    !isCapabilityRecord(value.extensions, { extensionIds: true })
  ) {
    return false;
  }
  if (Object.hasOwn(value, "roots") && Object.keys(value.roots).length !== 0) {
    return false;
  }
  if (Object.hasOwn(value, "sampling") && !markerFields(value.sampling, ["context", "tools"])) {
    return false;
  }
  if (
    Object.hasOwn(value, "elicitation") &&
    !markerFields(value.elicitation, ["form", "url"])
  ) {
    return false;
  }
  return true;
}

function isRelatedTaskMetadata(value) {
  return (
    isObject(value) &&
    hasOnlyKeys(value, new Set(["taskId"])) &&
    isBoundedString(value.taskId, 128)
  );
}

function isRequestMetaEnvelope(value) {
  return (
    isObject(value) &&
    Object.keys(value).every((key) => isMetaKey(key)) &&
    Object.hasOwn(value, "io.modelcontextprotocol/protocolVersion") &&
    /^\d{4}-\d{2}-\d{2}$/.test(value["io.modelcontextprotocol/protocolVersion"]) &&
    Object.hasOwn(value, "io.modelcontextprotocol/clientCapabilities") &&
    isObject(value["io.modelcontextprotocol/clientCapabilities"])
  );
}

function isRequestMeta(value) {
  if (!isRequestMetaEnvelope(value)) return false;
  if (
    !isClientCapabilities(value["io.modelcontextprotocol/clientCapabilities"])
  ) {
    return false;
  }
  if (
    Object.hasOwn(value, "io.modelcontextprotocol/clientInfo") &&
    !isImplementationInfo(value["io.modelcontextprotocol/clientInfo"])
  ) {
    return false;
  }
  if (
    Object.hasOwn(value, "io.modelcontextprotocol/logLevel") &&
    !LOG_LEVELS.has(value["io.modelcontextprotocol/logLevel"])
  ) {
    return false;
  }
  if (Object.hasOwn(value, "progressToken") && !isProgressToken(value.progressToken)) {
    return false;
  }
  if (
    Object.hasOwn(value, "io.modelcontextprotocol/related-task") &&
    !isRelatedTaskMetadata(value["io.modelcontextprotocol/related-task"])
  ) {
    return false;
  }
  return true;
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function result(id, value) {
  send({ jsonrpc: "2.0", id, result: value });
}

function error(id, code, message, data) {
  const payload = { code, message };
  if (data !== undefined) payload.data = data;
  const response = { jsonrpc: "2.0", error: payload };
  if (id !== undefined) response.id = id;
  send(response);
}

function toolResult(value) {
  return {
    resultType: "complete",
    content: [{ type: "text", text: JSON.stringify(value) }],
    structuredContent: value,
    isError: false,
    _meta: RESULT_META,
  };
}

function toolError(message) {
  return {
    resultType: "complete",
    content: [{ type: "text", text: message }],
    isError: true,
    _meta: RESULT_META,
  };
}

function validateRequestParams(id, params, label, allowedKeys) {
  if (
    !isObject(params) ||
    !hasOnlyKeys(params, new Set(allowedKeys)) ||
    !Object.hasOwn(params, "_meta") ||
    !isRequestMetaEnvelope(params._meta)
  ) {
    error(id, -32602, `Invalid ${label} parameters`);
    return false;
  }
  const requested = params._meta["io.modelcontextprotocol/protocolVersion"];
  if (requested !== PROTOCOL_VERSION) {
    error(id, -32022, "Unsupported protocol version", {
      supported: SUPPORTED_PROTOCOLS,
      requested,
    });
    return false;
  }
  if (!isRequestMeta(params._meta)) {
    error(id, -32602, `Invalid ${label} parameters`);
    return false;
  }
  return true;
}

function discover(id, params) {
  if (!validateRequestParams(id, params, "server/discover", ["_meta"])) return;
  result(id, {
    resultType: "complete",
    supportedVersions: SUPPORTED_PROTOCOLS,
    capabilities: { tools: { listChanged: false } },
    instructions: INSTRUCTIONS,
    ttlMs: CACHE_TTL_MS,
    cacheScope: "public",
    _meta: RESULT_META,
  });
}

function listTools(id, params) {
  if (!validateRequestParams(id, params, "tools/list", ["_meta", "cursor"])) return;
  if (params.cursor !== undefined) {
    error(id, -32602, "Pagination cursor is not supported");
    return;
  }
  result(id, {
    resultType: "complete",
    tools: TOOLS,
    ttlMs: CACHE_TTL_MS,
    cacheScope: "public",
    _meta: RESULT_META,
  });
}

function callTool(id, params) {
  if (
    !validateRequestParams(id, params, "tools/call", [
      "_meta",
      "name",
      "arguments",
      "inputResponses",
      "requestState",
    ])
  ) {
    return;
  }
  if (
    !isBoundedString(params.name, 128) ||
    (Object.hasOwn(params, "arguments") && !isObject(params.arguments)) ||
    Object.hasOwn(params, "inputResponses") ||
    Object.hasOwn(params, "requestState")
  ) {
    error(id, -32602, "Invalid tools/call parameters");
    return;
  }
  const handler = handlers.get(params.name);
  if (!handler) {
    error(id, -32602, "Unknown tool");
    return;
  }
  try {
    const value = handler(params.arguments ?? {});
    result(id, toolResult(value));
  } catch (caught) {
    if (caught instanceof NenInputError) {
      result(id, toolError(`input-invalid: ${caught.field} ${caught.code}`));
      return;
    }
    result(id, toolError("tool-failed: internal computation error"));
  }
}

function handleRequest(message) {
  if (
    !isObject(message) ||
    message.jsonrpc !== "2.0" ||
    !isBoundedString(message.method, 128) ||
    !hasOnlyKeys(message, new Set(["jsonrpc", "id", "method", "params"])) ||
    (Object.hasOwn(message, "id") && !isRequestId(message.id))
  ) {
    error(undefined, -32600, "Invalid Request");
    return;
  }

  if (!Object.hasOwn(message, "id")) return;

  const { id, method, params } = message;
  if (method === "server/discover") {
    discover(id, params);
    return;
  }
  if (method === "tools/list") {
    listTools(id, params);
    return;
  }
  if (method === "tools/call") {
    callTool(id, params);
    return;
  }
  error(id, -32601, "Method not found");
}

function handleLine(rawLine) {
  const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
  try {
    const message = JSON.parse(line);
    if (Array.isArray(message)) {
      error(undefined, -32600, "Invalid Request: batches are not supported");
      return;
    }
    handleRequest(message);
  } catch {
    error(undefined, -32700, "Parse error");
  }
}

process.stdin.setEncoding("utf8");
let frame = "";
let frameBytes = 0;
let discardingOversizeFrame = false;

for await (const chunk of process.stdin) {
  let offset = 0;
  while (offset <= chunk.length) {
    const newline = chunk.indexOf("\n", offset);
    const end = newline === -1 ? chunk.length : newline;
    const part = chunk.slice(offset, end);

    if (!discardingOversizeFrame) {
      const partBytes = Buffer.byteLength(part, "utf8");
      if (frameBytes + partBytes > MAX_FRAME_BYTES) {
        error(undefined, -32700, "Parse error: message too large");
        frame = "";
        frameBytes = 0;
        discardingOversizeFrame = true;
      } else {
        frame += part;
        frameBytes += partBytes;
      }
    }

    if (newline === -1) break;
    if (!discardingOversizeFrame) handleLine(frame);
    frame = "";
    frameBytes = 0;
    discardingOversizeFrame = false;
    offset = newline + 1;
  }
}

if (!discardingOversizeFrame && frame.length > 0) handleLine(frame);
