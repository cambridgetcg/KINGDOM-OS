#!/usr/bin/env node
// 回望燈, the lookback lamp.
//
// Re-read the Hugging Face pins that a written lease names, once, inside the
// lease's budget, and leave the evidence in a new local outbox for a person to
// read. The previous run's record is the comparison point, and the verdicts
// come from hf-pin-verdict.mjs (method hf-pin-drift/1).
//
//   node skills/navigate-dark-continent/scripts/hf-pin-reread.mjs --lease LEASE.json --plan
//   node skills/navigate-dark-continent/scripts/hf-pin-reread.mjs --lease LEASE.json
//
// --plan makes no request. It prints the planned requests, the budget and
// whether the lease would let a run start. A run reads only what the lease
// names, writes only into the outbox it names, and never retries. Nothing here
// commits, pushes, re-pins or publishes: those steps leave the game and wait
// for the owner's own yes.
//
// A lease authorizes one run into one new outbox. Its authority_reference
// quotes the owner approving the charter this run serves; a session never
// writes that authority for itself. Yu's 2026-10-29 answer approved building
// this lamp, not running it: no run starts until Yu approves a new charter
// (references/reality-crossing.md, which also says why Ging's
// compileExpedition is not used here).
//
// Zero dependencies: Node built-ins and the runtime's fetch.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  NOT_FOUND_STATUSES,
  RULES,
  VERDICT_METHOD,
  comparePin,
  compareSincePrevious,
  countBy,
  deriveFields,
  pinnedStateOf,
  resourceKey,
  rings,
  stateOf,
  summarizeObservation,
} from "./hf-pin-verdict.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SUITE_ROOT = resolve(dirname(SCRIPT_PATH), "..", "..", "..");

export const LEASE_FORMAT = "hf-pin-reread-lease/1";
const ABILITY_ID = "navigate-dark-continent";
const HOST = "huggingface.co";
const ORIGIN = `https://${HOST}`;
const USER_AGENT = "Mozilla/5.0";
const KIND_SEGMENT = { model: "models", dataset: "datasets", space: "spaces" };
const EXPAND = {
  model: ["sha", "lastModified", "private", "gated", "disabled", "cardData", "tags"],
  dataset: ["sha", "lastModified", "private", "gated", "disabled", "cardData", "tags"],
  space: ["sha", "lastModified", "private", "disabled", "cardData", "tags"],
};
const REDIRECT_STATUSES = [301, 302, 303, 307, 308];
const RECORDED_STATUSES = new Set([...REDIRECT_STATUSES, ...NOT_FOUND_STATUSES]);
// Each remote response becomes one receipt input, and the verifier refuses a
// receipt file over 64 KiB. Sixty-four responses fit with room to spare for
// ordinary repository IDs; the 2026-10-27 run needed 35.
const MAX_REQUESTS = 64;
const RECEIPT_LIMIT_BYTES = 64 * 1024;
const MAX_BYTES = 50_000_000;
const MAX_ELAPSED_SECONDS = 3600;
const MAX_AUTHORITY_CHARS = 800;
const MAX_LEASE_BYTES = 256 * 1024;
const MAX_PREVIOUS_BYTES = 4 * 1024 * 1024;
const REPO_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}\/[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/;
const SHA40 = /^[0-9a-f]{40}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const TIMESTAMP = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,9})?Z$/;
const DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const VISIBILITIES = ["public", "gated"];
const SECRET_ENV = /^(?:HF_|HUGGING)|TOKEN|SECRET|PASSW|CREDENTIAL|COOKIE|AUTH|API_?KEY/i;
export const OUTBOX_FILES = Object.freeze([
  "lease.json",
  "evidence/requests.jsonl",
  "evidence/observations.json",
  "karma-receipt.json",
  "RETURN-NOTE.md",
]);

export class LeaseError extends Error {
  constructor(field, code) {
    super(`${field || "lease"} ${code}`);
    this.name = "LeaseError";
    this.field = field || "lease";
    this.code = code;
  }
}

function fail(field, code) {
  throw new LeaseError(field, code);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function closed(value, field, required, optional = []) {
  if (!isRecord(value)) fail(field, "invalid-type");
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail(field, "unknown-field");
  for (const key of required) if (!Object.hasOwn(value, key)) fail(field ? `${field}.${key}` : key, "missing-field");
  return value;
}

function text(value, field, max) {
  if (typeof value !== "string" || value.length < 1 || [...value].length > max || value.trim() !== value) {
    fail(field, "invalid-string");
  }
  if (/[\u0000-\u0008\u000b-\u001f\u007f]/u.test(value)) fail(field, "invalid-string");
  return value;
}

function integer(value, field, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(field, "out-of-range");
  return value;
}

function absolutePath(value, field) {
  text(value, field, 1024);
  if (!isAbsolute(value) || normalize(value) !== value || value.endsWith(sep)) fail(field, "not-a-normal-absolute-path");
  return value;
}

function suitePath(value, field) {
  text(value, field, 512);
  if (isAbsolute(value) || normalize(value) !== value || value.split("/").includes("..") || value.includes("\\")) {
    fail(field, "not-a-suite-relative-path");
  }
  return value;
}

// The previous record is named by digest as well as path, so the lease the
// owner approves fixes the comparison point; a newer local commit cannot
// stand in for it.
function previousRef(value, field) {
  closed(value, field, ["path", "sha256"]);
  if (typeof value.sha256 !== "string" || !DIGEST.test(value.sha256)) fail(`${field}.sha256`, "invalid-digest");
  return { path: suitePath(value.path, `${field}.path`), sha256: value.sha256 };
}

// A re-pinned resource has no previous row at its new pin, so the lease may
// carry the license and visibility the boundary table reviewed at re-pin.
function leaseBaseline(value, field) {
  closed(value, field, ["license", "visibility", "observed_on", "basis"]);
  if (!VISIBILITIES.includes(value.visibility)) fail(`${field}.visibility`, "unsupported");
  if (typeof value.observed_on !== "string" || !DATE.test(value.observed_on)
    || !Number.isFinite(Date.parse(`${value.observed_on}T00:00:00Z`))) {
    fail(`${field}.observed_on`, "invalid-date");
  }
  const basis = text(value.basis, `${field}.basis`, 300);
  return {
    observed_on: value.observed_on,
    license: text(value.license, `${field}.license`, 100),
    license_basis: `the lease: ${basis}`,
    visibility: value.visibility,
    visibility_basis: `the lease: ${basis}`,
  };
}

export function parseLease(value) {
  closed(value, "", [
    "format",
    "authority_reference",
    "scope",
    "budget",
    "lease_expires_at",
    "stop_file",
    "outbox",
  ], ["example"]);
  if (value.format !== LEASE_FORMAT) fail("format", "unsupported");
  if (Object.hasOwn(value, "example") && typeof value.example !== "boolean") fail("example", "invalid-type");

  const scope = closed(value.scope, "scope", ["host", "resources", "previous"]);
  if (scope.host !== HOST) fail("scope.host", "unsupported");
  if (!Array.isArray(scope.resources) || scope.resources.length < 1 || scope.resources.length > MAX_REQUESTS) {
    fail("scope.resources", "invalid-length");
  }
  const seen = new Set();
  const resources = scope.resources.map((item, index) => {
    const field = `scope.resources[${index}]`;
    closed(item, field, ["kind", "id", "pinned"], ["where", "baseline"]);
    if (!Object.hasOwn(KIND_SEGMENT, item.kind)) fail(`${field}.kind`, "unsupported");
    if (typeof item.id !== "string" || !REPO_ID.test(item.id)) fail(`${field}.id`, "invalid-repo-id");
    if (typeof item.pinned !== "string" || !SHA40.test(item.pinned)) fail(`${field}.pinned`, "invalid-revision");
    const key = resourceKey(item.kind, item.id);
    if (seen.has(key)) fail(`${field}.id`, "duplicate-resource");
    seen.add(key);
    const resource = { kind: item.kind, id: item.id, pinned: item.pinned };
    if (Object.hasOwn(item, "where")) resource.where = text(item.where, `${field}.where`, 300);
    if (Object.hasOwn(item, "baseline")) resource.baseline = leaseBaseline(item.baseline, `${field}.baseline`);
    return resource;
  });
  const previous = closed(scope.previous, "scope.previous", ["observations", "receipt"]);

  const budget = closed(value.budget, "budget", ["requests", "bytes", "elapsed_seconds", "retries"]);
  if (budget.retries !== 0) fail("budget.retries", "must-be-zero");

  if (typeof value.lease_expires_at !== "string" || !TIMESTAMP.test(value.lease_expires_at)
    || !Number.isFinite(Date.parse(value.lease_expires_at))) {
    fail("lease_expires_at", "invalid-timestamp");
  }

  return {
    format: LEASE_FORMAT,
    example: value.example === true,
    authority_reference: text(value.authority_reference, "authority_reference", MAX_AUTHORITY_CHARS),
    scope: {
      host: HOST,
      resources,
      previous: {
        observations: previousRef(previous.observations, "scope.previous.observations"),
        receipt: previousRef(previous.receipt, "scope.previous.receipt"),
      },
    },
    budget: {
      requests: integer(budget.requests, "budget.requests", 1, MAX_REQUESTS),
      bytes: integer(budget.bytes, "budget.bytes", 1, MAX_BYTES),
      elapsed_seconds: integer(budget.elapsed_seconds, "budget.elapsed_seconds", 1, MAX_ELAPSED_SECONDS),
      retries: 0,
    },
    lease_expires_at: value.lease_expires_at,
    stop_file: absolutePath(value.stop_file, "stop_file"),
    outbox: absolutePath(value.outbox, "outbox"),
  };
}

export function parseLeaseText(leaseText) {
  let value;
  try {
    value = JSON.parse(leaseText);
  } catch {
    fail("lease", "invalid-json");
  }
  return parseLease(value);
}

function sha256(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function iso(ms) {
  return new Date(ms).toISOString();
}

// The same calendar day a year on; 29 February rolls to 1 March.
export function oneYearAfter(ms) {
  const date = new Date(ms);
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

export function scrubEnvironment(env) {
  const removed = [];
  for (const key of Object.keys(env)) {
    if (SECRET_ENV.test(key)) {
      delete env[key];
      removed.push(key);
    }
  }
  return removed;
}

function childEnv() {
  return {
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    HOME: process.env.HOME ?? "",
    LC_ALL: "C",
    GIT_OPTIONAL_LOCKS: "0",
    GIT_TERMINAL_PROMPT: "0",
  };
}

function runGit(root, args) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", env: childEnv(), timeout: 30_000 });
  return { status: result.status ?? 1, stdout: result.stdout ?? "" };
}

// bin/nen.mjs does not export its template, so ask the suite's own CLI. It is
// read-only and offline, and it pre-fills the manifest and bundle digests.
function receiptTemplateFromCli(root) {
  const nen = join(root, "bin", "nen.mjs");
  if (!existsSync(nen)) throw new Error("bin/nen.mjs not found");
  const result = spawnSync(process.execPath, [nen, "receipt-template", ABILITY_ID], {
    encoding: "utf8",
    env: childEnv(),
    timeout: 60_000,
    maxBuffer: 1024 * 1024,
  });
  if (result.status !== 0) throw new Error("receipt-template failed");
  return JSON.parse(result.stdout);
}

export function defaultDeps() {
  return {
    fetch: (...args) => globalThis.fetch(...args),
    now: () => Date.now(),
    env: process.env,
    suiteRoot: SUITE_ROOT,
    git: runGit,
    receiptTemplate: receiptTemplateFromCli,
    signal: undefined,
  };
}

export function requestUrl(resource, revision = null) {
  const path = `/api/${KIND_SEGMENT[resource.kind]}/${resource.id}${revision ? `/revision/${revision}` : ""}`;
  const query = EXPAND[resource.kind].map((field) => `expand=${field}`).join("&");
  const url = new URL(`${path}?${query}`, ORIGIN);
  // The only host this lamp may reach. Spaces' *.hf.space runtimes never.
  if (url.protocol !== "https:" || url.hostname !== HOST || url.port !== "") throw new Error("host outside the lease");
  return url.href;
}

function lstatOrNull(path) {
  try {
    return lstatSync(path);
  } catch {
    return null;
  }
}

function realpathOrNull(path) {
  try {
    return realpathSync(path);
  } catch {
    return null;
  }
}

function inside(child, parent) {
  const rel = resolve(child);
  const root = resolve(parent);
  return rel === root || rel.startsWith(root + sep);
}

function licenseFileStatement(root) {
  const found = ["LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING"].find((name) => existsSync(join(root, name)));
  return found
    ? `the suite's ${found} at this revision; not interpreted by this run`
    : "none declared (no repository license file at this revision)";
}

function readPrevious(ref, label, deps, refusals) {
  const root = resolve(deps.suiteRoot);
  const absolute = resolve(root, ref.path);
  if (!inside(absolute, root)) {
    refusals.push(`previous-outside-suite: ${label}`);
    return null;
  }
  const stat = lstatOrNull(absolute);
  if (!stat || !stat.isFile() || stat.size > MAX_PREVIOUS_BYTES) {
    refusals.push(`previous-missing: ${label} is not a readable regular file`);
    return null;
  }
  if (deps.git(root, ["ls-files", "--error-unmatch", "--", `:(literal)${ref.path}`]).status !== 0) {
    refusals.push(`previous-untracked: ${label} is not committed in this suite`);
    return null;
  }
  const bytes = readFileSync(absolute);
  const digest = sha256(bytes);
  if (ref.sha256 !== digest) {
    refusals.push(`previous-digest-mismatch: ${label} does not match the digest the lease names`);
    return null;
  }
  return { path: ref.path, bytes, digest };
}

export function preflight(lease, deps) {
  const refusals = [];
  const now = deps.now();
  const root = resolve(deps.suiteRoot);
  if (lease.example || /^EXAMPLE\b/i.test(lease.authority_reference)) {
    refusals.push("lease-example: the lease is marked as an example and authorizes nothing");
  }
  if (now >= Date.parse(lease.lease_expires_at)) refusals.push("lease-expired");
  if (lstatOrNull(lease.stop_file)) refusals.push("stop-file-present");
  // The parent may be reached through a symlink (macOS /tmp is one), so it is
  // resolved before both checks; the outbox itself must not exist at all.
  const parent = realpathOrNull(dirname(lease.outbox));
  if (lstatOrNull(lease.outbox)) refusals.push("outbox-exists: every run needs a new outbox");
  else if (!parent || !lstatOrNull(parent)?.isDirectory()) refusals.push("outbox-parent-missing");
  const skills = join(realpathOrNull(root) ?? root, "skills");
  if (inside(lease.outbox, join(root, "skills")) || (parent && inside(join(parent, basename(lease.outbox)), skills))) {
    refusals.push("outbox-inside-skills: writing there would change the bundle the receipt binds");
  }
  if (lease.scope.resources.length > lease.budget.requests) {
    refusals.push("budget-below-pass-1: the request budget cannot cover one read per resource");
  }

  let head = null;
  const status = deps.git(root, ["status", "--porcelain=v1", "--untracked-files=normal"]);
  const rev = deps.git(root, ["rev-parse", "HEAD"]);
  if (status.status !== 0 || rev.status !== 0 || !SHA40.test(rev.stdout.trim())) {
    refusals.push("suite-not-a-git-tree");
  } else {
    head = rev.stdout.trim();
    if (status.stdout.trim() !== "") refusals.push("tree-dirty: commit or set aside local changes first");
  }

  const observations = readPrevious(lease.scope.previous.observations, "previous observations", deps, refusals);
  const receipt = readPrevious(lease.scope.previous.receipt, "previous receipt", deps, refusals);
  let previousRows = null;
  if (observations) {
    try {
      const parsed = JSON.parse(observations.bytes.toString("utf8"));
      if (!Array.isArray(parsed.resources)) throw new Error("no resources");
      previousRows = new Map(parsed.resources.map((row) => [resourceKey(row.kind, row.id), row]));
    } catch {
      refusals.push("previous-unreadable: the previous observations have no resources array");
    }
  }

  let template = null;
  try {
    template = deps.receiptTemplate(root);
    if (!DIGEST.test(template?.ability_bundle_sha256 ?? "") || !DIGEST.test(template?.ability_manifest_sha256 ?? "")) {
      throw new Error("template without digests");
    }
  } catch {
    template = null;
    refusals.push("receipt-template-unavailable: the suite could not produce a kingdom.karma/0.1 template");
  }
  return { refusals, head, previous: { observations, receipt, rows: previousRows }, template };
}

function expectedPassTwo(lease, previousRows) {
  if (!previousRows) return [];
  return lease.scope.resources.filter((resource) => {
    const row = previousRows.get(resourceKey(resource.kind, resource.id));
    return stateOf(row?.observed?.current) === "present" && row.observed.current.sha !== resource.pinned;
  });
}

export function planLookback(leaseText, deps) {
  const lease = parseLeaseText(leaseText);
  const pre = preflight(lease, deps);
  const passTwo = expectedPassTwo(lease, pre.previous.rows);
  return {
    plan: "hf-pin-reread",
    verdict_method: VERDICT_METHOD,
    network_requests_made: 0,
    would_start: pre.refusals.length === 0,
    refusals: pre.refusals,
    lease: {
      format: lease.format,
      example: lease.example,
      authority_reference: lease.authority_reference,
      expires_at: lease.lease_expires_at,
      stop_file_present: Boolean(lstatOrNull(lease.stop_file)),
      outbox_exists: Boolean(lstatOrNull(lease.outbox)),
    },
    budget: lease.budget,
    requests: {
      pass_1: lease.scope.resources.map((resource) => requestUrl(resource)),
      pass_2_rule: "one pinned-revision read per resource whose head differs from its pin, only after pass 1 shows it",
      pass_2_if_previous_holds: passTwo.map((resource) => requestUrl(resource, resource.pinned)),
      planned_total_if_previous_holds: lease.scope.resources.length + passTwo.length,
    },
    writes: OUTBOX_FILES.map((name) => `outbox/${name}`),
  };
}

function outboxWriter(outbox) {
  const root = resolve(outbox);
  const target = (relative) => {
    const path = resolve(root, relative);
    if (!path.startsWith(root + sep)) throw new Error("write outside the outbox refused");
    return path;
  };
  return {
    create(relative, data) {
      writeFileSync(target(relative), data, { flag: "wx" });
      return sha256(Buffer.from(data));
    },
    append(relative, data) {
      appendFileSync(target(relative), data);
    },
  };
}

function headerBytes(response) {
  let total = 17;
  for (const [name, value] of response.headers) total += name.length + value.length + 4;
  return total + 2;
}

function requestBytes(url) {
  const { pathname, search } = new URL(url);
  return `GET ${pathname}${search} HTTP/1.1\r\nHost: ${HOST}\r\nUser-Agent: ${USER_AGENT}\r\nAccept: application/json\r\n\r\n`.length;
}

async function readBounded(response, remaining) {
  if (!response.body) return { bytes: 0, buffer: Buffer.alloc(0), truncated: false };
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > remaining) {
      await reader.cancel().catch(() => {});
      return { bytes, buffer: null, truncated: true };
    }
    chunks.push(value);
  }
  return { bytes, buffer: Buffer.concat(chunks), truncated: false };
}

function stopReason(context) {
  const { deps, lease, used, startedMs } = context;
  const now = deps.now();
  if (deps.signal?.aborted) return "cancelled";
  if (lstatOrNull(lease.stop_file)) return "stop-file";
  if (now >= Date.parse(lease.lease_expires_at)) return "lease-expired";
  if (used.requests >= lease.budget.requests) return "requests-budget-spent";
  if (used.bytes >= lease.budget.bytes) return "bytes-budget-spent";
  if (now - startedMs >= lease.budget.elapsed_seconds * 1000) return "elapsed-budget-spent";
  return null;
}

async function readOnce(context, pass, index, resource) {
  const stop = stopReason(context);
  if (stop) return { stop };
  const { deps, lease, used } = context;
  const revision = pass === "pinned" ? resource.pinned : null;
  const url = requestUrl(resource, revision);
  used.requests += 1;
  used.egress += requestBytes(url);
  const started = deps.now();
  const log = {
    request: used.requests,
    pass,
    resource_index: index,
    kind: resource.kind,
    id: resource.id,
    requested_revision: revision,
    utc_started: iso(started),
    method: "GET",
    url,
    http_status: null,
    content_type: null,
    location: null,
    hf_error_code: null,
    header_bytes_estimated: null,
    body_bytes: null,
    body_sha256: null,
    time_total_ms: null,
    parsed_sha: null,
    error: null,
    stop: null,
  };
  const remainingMs = Math.max(1, context.startedMs + lease.budget.elapsed_seconds * 1000 - started);
  const timeout = AbortSignal.timeout(remainingMs);
  const signal = deps.signal ? AbortSignal.any([deps.signal, timeout]) : timeout;
  const finish = (reason, extra = {}) => {
    log.stop = reason;
    log.time_total_ms = Math.max(0, deps.now() - started);
    return { log, stop: reason, ...extra };
  };
  const abortReason = () => (deps.signal?.aborted ? "cancelled" : timeout.aborted ? "elapsed-budget-spent" : "fetch-error");

  let response;
  try {
    response = await deps.fetch(url, {
      method: "GET",
      redirect: "manual",
      credentials: "omit",
      cache: "no-store",
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal,
    });
  } catch (error) {
    log.error = error?.name ?? "Error";
    return finish(abortReason());
  }
  log.http_status = response.status;
  log.content_type = response.headers.get("content-type");
  log.location = response.headers.get("location")?.slice(0, 300) ?? null;
  log.hf_error_code = response.headers.get("x-error-code")?.slice(0, 80) ?? null;
  log.header_bytes_estimated = headerBytes(response);
  used.bytes += log.header_bytes_estimated;

  let body;
  try {
    body = await readBounded(response, Math.max(0, lease.budget.bytes - used.bytes));
  } catch (error) {
    log.error = error?.name ?? "Error";
    return finish(abortReason());
  }
  used.bytes += body.bytes;
  log.body_bytes = body.bytes;
  if (body.truncated) return finish("bytes-budget-spent");
  log.body_sha256 = sha256(body.buffer);

  const status = response.status;
  if (status === 200) {
    let metadata = null;
    if (/^application\/json\b/i.test(log.content_type ?? "")) {
      try {
        metadata = JSON.parse(body.buffer.toString("utf8"));
      } catch {
        metadata = null;
      }
    }
    // The raw body ends here: only its digest and derived fields remain.
    if (!isRecord(metadata)) return finish("non-json-body");
    const fields = deriveFields(resource.kind, metadata);
    if (!fields.sha) return finish("missing-sha");
    log.parsed_sha = fields.sha;
    if (revision && fields.sha !== revision) return finish("pinned-revision-sha-mismatch");
    log.time_total_ms = Math.max(0, deps.now() - started);
    return { log, fields, stop: null };
  }
  if (RECORDED_STATUSES.has(status)) {
    log.time_total_ms = Math.max(0, deps.now() - started);
    return { log, stop: null };
  }
  return finish(status === 429 ? "http-429" : status >= 500 ? "http-5xx" : `http-${status}`);
}

function currentObservation(outcome) {
  const { log, fields } = outcome;
  if (fields) return { request: log.request, http_status: 200, ...fields };
  const observation = { request: log.request, http_status: log.http_status };
  if (log.location) observation.location = log.location;
  if (log.hf_error_code) observation.hf_error_code = log.hf_error_code;
  if (log.error) observation.error = log.error;
  if (log.stop) observation.stopped_run = log.stop;
  return observation;
}

function pinnedObservation(resource, current, outcome, stop) {
  if (stateOf(current) === "present" && current.sha === resource.pinned) {
    return {
      resolves: true,
      basis: "the current-info response reports this revision as head",
      request: current.request,
      lastModified: current.lastModified,
      license: current.license,
    };
  }
  if (stateOf(current) !== "present") {
    return { resolves: null, basis: "not requested: the current-info read returned no usable metadata" };
  }
  if (!outcome?.log) return { resolves: null, basis: `not requested: the run stopped (${stop ?? "unknown"})` };
  const { log, fields } = outcome;
  if (fields) {
    return {
      resolves: true,
      basis: "pinned-revision response",
      request: log.request,
      http_status: 200,
      sha: fields.sha,
      lastModified: fields.lastModified,
      license: fields.license,
    };
  }
  if (NOT_FOUND_STATUSES.includes(log.http_status)) {
    return { resolves: false, basis: "pinned-revision response", request: log.request, http_status: log.http_status };
  }
  return {
    resolves: null,
    basis: log.stop ? `pinned-revision read stopped the run (${log.stop})` : "pinned-revision response was not followed",
    request: log.request,
    http_status: log.http_status,
  };
}

function buildRow(resource, previousRow, current, pinned) {
  const samePin = previousRow?.pin?.revision === resource.pinned;
  const row = {
    kind: resource.kind,
    id: resource.id,
    pin: {
      revision: resource.pinned,
      where: resource.where
        ?? (samePin && typeof previousRow.pin.where === "string" ? previousRow.pin.where : null)
        ?? "named in the lease (no previous row for this pin)",
    },
    baseline: resource.baseline
      ?? (samePin && isRecord(previousRow.baseline) ? previousRow.baseline : null)
      ?? {
        observed_on: null,
        license: null,
        license_basis: "no previous row for this pin, and the lease names no baseline",
        visibility: null,
        visibility_basis: "no previous row for this pin, and the lease names no baseline",
      },
    observed: { current, pinned_revision: pinned },
  };
  const pin = comparePin(row);
  return {
    ...row,
    comparison: pin.comparison,
    dimensions: pin.dimensions,
    verdict: pin.verdict,
    since_previous: compareSincePrevious(previousRow, row),
  };
}

function short(sha) {
  return typeof sha === "string" ? `${sha.slice(0, 8)}…` : "—";
}

function describe(summary, pinState, pinRevision, unreadPin = "; pin not read") {
  let head = "not read";
  if (summary?.state === "present") head = `head \`${short(summary.sha)}\`, ${summary.visibility}, \`${summary.license}\``;
  else if (summary && summary.http_status !== null) head = `HTTP ${summary.http_status}`;
  if (summary?.state === "present" && summary.sha === pinRevision) return head;
  if (!pinState) return summary?.state === "present" ? `${head}${unreadPin}` : head;
  return `${head}; pin \`${short(pinRevision)}\` ${pinState.resolves ? `\`${pinState.license}\`` : "does not resolve"}`;
}

function returnNote(context, rows, receiptDigest) {
  const { lease, used, result, stop, pre, startedMs, finishedMs } = context;
  const changed = rows.filter(rings);
  const was = (row) => describe(row.since_previous.previous, row.since_previous.previous_pinned, row.pin.revision, "");
  const now = (row) => describe(summarizeObservation(row.observed.current), pinnedStateOf(row), row.pin.revision);
  const proposals = rows.filter((row) => row.verdict !== "unchanged" || rings(row));
  const name = (row) => `${row.kind} \`${row.id}\``;
  const lines = [
    `# Dark Continent return note — ${iso(startedMs).slice(0, 10)} (draft)`,
    "",
    `Draft, generated by \`hf-pin-reread.mjs\` under verdict method \`${VERDICT_METHOD}\`.`,
    "The generated sections hold observations only. Before this outbox becomes a",
    "record, a person reads it, writes the inference, finalizes the receipt and",
    "asks the owner whether to merge it. Until then, deleting the outbox retracts the run.",
    "",
    `**Question.** Are the ${rows.length} public Hugging Face resources named in the lease`,
    "still present and public at their pinned revisions, with the license and",
    "gating recorded when they were pinned, and what changed since the previous run?",
    "",
    `**Run.** Result \`${result}\`: ${used.requests} of ${lease.budget.requests} requests, ${used.bytes} bytes`,
    `received, ${Math.round((finishedMs - startedMs) / 1000)} s. ${stop ? `The run stopped (\`${stop}\`) and nothing was retried; unread resources are \`unknown\`.` : "No stop condition was met."}`,
    "",
    `**Previous run.** \`${pre.previous.observations.path}\` (\`${pre.previous.observations.digest}\`)`,
    `and its receipt \`${pre.previous.receipt.path}\` (\`${pre.previous.receipt.digest}\`), read at \`${pre.head}\`.`,
    "",
    "## Since previous run",
    "",
  ];
  if (changed.length === 0) lines.push("Nothing changed since the previous run.");
  else {
    lines.push("| Resource | Since previous | Was | Now |", "| --- | --- | --- | --- |");
    for (const row of changed) {
      lines.push(`| ${name(row)} | ${row.since_previous.verdict} | ${was(row)} | ${now(row)} |`);
    }
  }
  lines.push(
    "",
    "## Proposal (not a decision)",
    "",
    "Every row starts at hold, and holding changes nothing. Re-pinning, admitting",
    "content or retiring a row carries something out of the game: that is the",
    "owner's decision, bound to the final receipt's digest and written as its own record.",
    "",
  );
  if (proposals.length === 0) lines.push("No row differs from its pin or from the previous run.");
  else {
    lines.push("| Resource | Pin verdict | Since previous | Proposal |", "| --- | --- | --- | --- |");
    for (const row of proposals) lines.push(`| ${name(row)} | ${row.verdict} | ${row.since_previous.verdict} | hold |`);
  }
  lines.push(
    "",
    "## Inference",
    "",
    "Not generated. The person who reads this run writes it here, kept apart from",
    "the observations above.",
    "",
    "## Effects",
    "",
    `- **Remote:** ${used.requests} anonymous GETs to \`${HOST}/api\`, ${used.bytes} bytes received. Only resource`,
    `  IDs, pinned revisions, \`expand\` field names and the User-Agent \`${USER_AGENT}\` left the device.`,
    "- **Local writes:** this outbox only. Raw response bodies were hashed in memory and discarded.",
    "- **Not used:** private reads, downloads, gate acceptance, `*.hf.space`, provider or model calls,",
    "  Hub writes, commits, pushes and publication.",
    "",
    "## Receipt",
    "",
    `- \`karma-receipt.json\`, \`${receiptDigest}\`, \`kingdom.karma/0.1\`, state \`draft\`.`,
    "- To finalize it, read it, set `state` to `final`, and run",
    `  \`./kingdom nen verify-receipt <absolute path>\` from the suite root at \`${pre.head}\`.`,
    "  Finalizing changes the digest; name the final one here.",
  );
  if (context.receiptBytes > RECEIPT_LIMIT_BYTES) {
    lines.push(`- The receipt is ${context.receiptBytes} bytes, over the ${RECEIPT_LIMIT_BYTES} the verifier reads; it needs a smaller successor before it can verify.`);
  }
  lines.push("");
  return lines.join("\n");
}

// Pretty JSON, with each input on one line so a full run stays small enough
// for the verifier to read.
function receiptJson(receipt) {
  const token = "\u0000inputs\u0000";
  const inputs = receipt.inputs.length === 0
    ? "[]"
    : `[\n${receipt.inputs.map((input) => `    ${JSON.stringify(input)}`).join(",\n")}\n  ]`;
  return `${JSON.stringify({ ...receipt, inputs: token }, null, 2).replace(JSON.stringify(token), () => inputs)}\n`;
}

function buildReceipt(context, rows, logs, outputs, finishedMs) {
  const { lease, used, result, stop, pre, startedMs, leaseDigest, leaseBytes } = context;
  const passOne = logs.filter((log) => log.pass === "current").length;
  const statuses = countBy(logs.filter((log) => log.http_status !== null), (log) => log.http_status);
  const statusText = Object.entries(statuses).map(([code, count]) => `${count} × HTTP ${code}`).join(", ") || "no response";
  const bodyBytes = logs.reduce((sum, log) => sum + (log.body_bytes ?? 0), 0);
  const idsSent = new Set(logs.map((log) => log.resource_index)).size;
  const window = logs.length ? `between ${logs[0].utc_started} and ${logs.at(-1).utc_started}` : "none was started";
  const licenseStatement = licenseFileStatement(resolve(context.deps.suiteRoot));
  const local = (item, description) => ({
    source: `cambridgetcg/KINGDOM-OS (local Git objects; device path not recorded): ${description}`,
    revision: pre.head,
    path: item.path,
    license_assertion: licenseStatement,
    bytes: { value: String(item.bytes.length), basis: "observed" },
    digest: item.digest,
    boundary: "local",
    assurance: "untrusted_evidence",
  });
  const inputs = [
    local(pre.previous.receipt, "the previous run's kingdom.karma/0.1 receipt"),
    local(pre.previous.observations, "the previous run's observations"),
    {
      source: "the lease this run ran under (device path not recorded)",
      revision: "not version-controlled; lease.json in this record is a copy with the outbox and stop-file paths reduced to their final names",
      path: "lease (outside the suite)",
      license_assertion: "not applicable: an authorization, not reused content",
      bytes: { value: String(leaseBytes.length), basis: "observed" },
      digest: leaseDigest,
      boundary: "local",
      assurance: "untrusted_evidence",
    },
  ];
  const rowByIndex = new Map(rows.map((row, index) => [index, row]));
  for (const log of logs) {
    if (!log.body_sha256) continue;
    const row = rowByIndex.get(log.resource_index);
    const observed = log.pass === "current" ? row?.observed.current : row?.observed.pinned_revision;
    const license = typeof observed?.license?.assertion === "string"
      ? `the subject repository's card asserts ${observed.license.assertion}`
      : `no card license read (HTTP ${log.http_status})`;
    const { pathname, search } = new URL(log.url);
    inputs.push({
      source: `${HOST} Hub API, ${log.kind} ${log.id} (request ${log.request} in evidence/requests.jsonl)`,
      revision: log.requested_revision
        ? `${log.requested_revision} (pinned revision requested)`
        : log.parsed_sha ? `mutable head requested; response reported ${log.parsed_sha}` : `mutable head requested; HTTP ${log.http_status}`,
      path: `${pathname}${search}`,
      license_assertion: `Hub metadata under the Hub's terms; ${license}`,
      bytes: { value: String(log.body_bytes), basis: "observed" },
      digest: log.body_sha256,
      boundary: "remote_public",
      assurance: "untrusted_evidence",
    });
  }
  const counts = countBy(rows, (row) => row.verdict);
  const countText = Object.entries(counts).map(([verdict, count]) => `${count} ${verdict}`).join(", ");
  const stamp = iso(startedMs).replace(/[-:]/g, "").replace(/\.\d+Z$/, "z").replace("T", "-").toLowerCase();
  return {
    ...pre.template,
    state: "draft",
    receipt_id: `karma-${stamp}-${ABILITY_ID}-hf-pin-reread`,
    ability_id: ABILITY_ID,
    ability_revision: pre.head,
    invocation_id: `${ABILITY_ID}.${stamp}.hf-pin-reread`,
    started_at: iso(startedMs),
    finished_at: iso(finishedMs),
    authority: {
      authority_reference: `${lease.authority_reference} (Lease ${LEASE_FORMAT}, expiring ${lease.lease_expires_at}; a copy is lease.json in this record.)`,
      affected_participants: [],
      consent_references: [],
      representative_authority_references: [],
      permissions_used: [
        "local_read",
        `remote_public_metadata_read: ${used.requests} anonymous GETs of a ${lease.budget.requests}-request budget`,
        "local_evidence_write: one new outbox directory named by the lease",
      ],
    },
    inputs,
    predicted_effects: [
      `At most ${lease.budget.requests} anonymous HTTPS GETs to ${HOST} /api metadata endpoints for ${rows.length} named public resources: one current-info read each, plus one pinned-revision read only where the head differs from the pin. No retry.`,
      "Local writes limited to one new outbox directory named by the lease; raw response bodies are hashed in memory and never written.",
      "No content download, gate acceptance, *.hf.space request, provider call, Hub write, commit, push or publication; GBP 0 and 0 remote GPU seconds.",
    ],
    observed_effects: [
      `${used.requests} anonymous HTTPS GETs to ${HOST} /api metadata endpoints, ${window}: ${passOne} current-info and ${used.requests - passOne} pinned-revision reads (${statusText}), with redirects not followed. ${stop ? `The run stopped (${stop}) and nothing was retried.` : "No stop condition was met and nothing was retried."}`,
      `Received ${used.bytes} bytes: ${bodyBytes} body bytes after content decoding and ${used.bytes - bodyBytes} header bytes estimated from the parsed headers. Requests carried only resource IDs, pinned revisions, expand field names and the User-Agent '${USER_AGENT}'; no Authorization header, cookie or token.`,
      `Local reads: the previous record's observations and receipt at ${pre.head}, the lease, and the suite's receipt template via 'nen.mjs receipt-template'. Local execution: this script, 'git status', 'git rev-parse' and 'git ls-files'.`,
      "Local writes: the outbox only (lease.json, evidence/requests.jsonl, evidence/observations.json and this receipt; RETURN-NOTE.md is written after it).",
      "Not used: private reads, file or content downloads, gate acceptance, *.hf.space requests, provider or model calls, Hub writes, commits, pushes or publication.",
    ],
    costs: {
      time_ms: { value: String(Math.max(0, finishedMs - startedMs)), basis: "observed" },
      compute: "One local process for the run's duration; CPU time and memory were not measured.",
      money: "GBP 0 observed: anonymous public endpoints only, with no paid service or provider. The operator's connectivity cost was not measured.",
      energy: "Not measured.",
      privacy: `Hugging Face and network intermediaries saw ${idsSent} of the lease's ${rows.length} resource IDs, the pinned revisions read in pass 2, request timing, a generic User-Agent and the device's public network address. No account identity, token, local path or private content left the device.`,
      coordination: "Started under the lease in lease.json; contacted no participant and wrote only the outbox. Committing this record is a separate step that waits for the owner.",
      data_egress_bytes: { value: String(used.egress), basis: "estimated" },
      remote_gpu_seconds: { value: "0", basis: "observed" },
    },
    outputs: [
      { reference: "lease.json: the lease, copied with its outbox and stop-file paths reduced to their final names before the first request", digest: outputs.lease },
      { reference: `evidence/requests.jsonl: a ${logs.length}-line request log with UTC time, URL, status, byte counts and body SHA-256`, digest: outputs.requests },
      { reference: `evidence/observations.json: per-resource observations under ${VERDICT_METHOD}: ${countText}`, digest: outputs.observations },
    ],
    uncertainty: [
      "Hub metadata, cards and license fields are publisher or provider assertions. They are not legal clearance, provenance proof or safety verdicts.",
      "That a head equals its pin rests on the API's sha field. No file tree or file bytes were read.",
      "Body bytes are counted after content decoding. Header and request bytes are estimated, not observed on the wire; TLS, TCP and DNS overhead are not counted.",
      `Repository settings (gating, visibility, disabled) can change without a commit. This is one snapshot, ${window}.`,
      "since_previous compares this run with the previous record named in the lease, not with every earlier run.",
      "The verifier checks the bound manifest and bundle digests against the local suite; it does not run Git to prove ability_revision, which is the HEAD of the clean tree this run started from.",
      ...(stop ? [`The run stopped early (${stop}). Resources it did not read are recorded as unknown.`] : []),
    ],
    repair: {
      required: false,
      actions: ["Nothing remote changed. Before commit, deleting the outbox retracts this run completely."],
      status: "not_needed",
    },
    retention: {
      expires_at: oneYearAfter(startedMs),
      redactions: [
        "Raw response bodies and headers were not retained. Only URL, status, content type, byte counts and SHA-256 digests are kept.",
        "Local device paths were omitted. The lease copy keeps only the final names of its outbox and stop-file paths.",
        "No account identity, token or email was recorded.",
      ],
    },
    result,
  };
}

export async function runLookback(leaseText, overrides = {}) {
  const deps = { ...defaultDeps(), ...overrides };
  scrubEnvironment(deps.env);
  const lease = parseLeaseText(leaseText);
  const pre = preflight(lease, deps);
  if (pre.refusals.length > 0) return { result: "refused", refusals: pre.refusals, requests: 0 };

  const startedMs = deps.now();
  try {
    mkdirSync(lease.outbox);
  } catch {
    return { result: "refused", refusals: ["outbox-exists: every run needs a new outbox"], requests: 0 };
  }
  mkdirSync(join(lease.outbox, "evidence"));
  const out = outboxWriter(lease.outbox);
  const leaseBytes = Buffer.from(leaseText, "utf8");
  const leaseCopy = JSON.parse(leaseText);
  leaseCopy.outbox = `…/${basename(lease.outbox)}`;
  leaseCopy.stop_file = `…/${basename(lease.stop_file)}`;
  const outputs = { lease: out.create("lease.json", `${JSON.stringify(leaseCopy, null, 2)}\n`) };
  out.create("evidence/requests.jsonl", "");

  const context = {
    deps,
    lease,
    pre,
    startedMs,
    leaseBytes,
    leaseDigest: sha256(leaseBytes),
    used: { requests: 0, bytes: 0, egress: 0 },
    stop: null,
  };
  const logs = [];
  const record = (outcome) => {
    if (outcome.log) {
      logs.push(outcome.log);
      out.append("evidence/requests.jsonl", `${JSON.stringify(outcome.log)}\n`);
    }
    if (outcome.stop) context.stop = outcome.stop;
  };

  const resources = lease.scope.resources;
  const current = new Map();
  for (const [index, resource] of resources.entries()) {
    const outcome = await readOnce(context, "current", index, resource);
    record(outcome);
    if (outcome.log) current.set(index, currentObservation(outcome));
    if (context.stop) break;
  }
  const pinned = new Map();
  if (!context.stop) {
    for (const [index, resource] of resources.entries()) {
      const observation = current.get(index);
      if (stateOf(observation) !== "present" || observation.sha === resource.pinned) continue;
      const outcome = await readOnce(context, "pinned", index, resource);
      record(outcome);
      if (outcome.log) pinned.set(index, outcome);
      if (context.stop) break;
    }
  }

  const rows = resources.map((resource, index) => {
    const observation = current.get(index) ?? {
      request: null,
      http_status: null,
      not_requested: `the run stopped before this read (${context.stop ?? "unknown"})`,
    };
    const previousRow = pre.previous.rows.get(resourceKey(resource.kind, resource.id));
    return buildRow(resource, previousRow, observation, pinnedObservation(resource, observation, pinned.get(index), context.stop));
  });
  context.result = !context.stop ? "completed" : ["cancelled", "stop-file"].includes(context.stop) ? "cancelled" : "partial";

  const observedMs = deps.now();
  const observations = {
    record: "dark-continent-hf-pin-drift",
    observed_on: iso(startedMs).slice(0, 10),
    schema: `none; derived evidence for the KARMA receipt in this directory, compared by ${VERDICT_METHOD}`,
    verdict_method: VERDICT_METHOD,
    method: {
      endpoints: [
        `GET ${ORIGIN}/api/{models|datasets|spaces}/<owner/name>?expand=…`,
        `GET ${ORIGIN}/api/{models|datasets|spaces}/<owner/name>/revision/<pin>?expand=… (only where head differed from the pin)`,
      ],
      expand_fields: { model_and_dataset: EXPAND.model, space: EXPAND.space },
      client: `hf-pin-reread.mjs with the runtime's fetch: anonymous, User-Agent '${USER_AGENT}', no token, cookie or Authorization header; redirect 'manual' (never followed); no retry`,
      license_rule: RULES.license,
      visibility_rule: RULES.visibility,
      verdict_precedence: RULES.pin,
      since_previous_rule: RULES.since_previous,
      compared_fields: RULES.fields,
      requests: context.used.requests,
      request_log: "evidence/requests.jsonl",
    },
    previous: {
      revision: pre.head,
      observations: { path: pre.previous.observations.path, sha256: pre.previous.observations.digest },
      receipt: { path: pre.previous.receipt.path, sha256: pre.previous.receipt.digest },
    },
    run: {
      started_at: iso(startedMs),
      observed_until: iso(observedMs),
      result: context.result,
      stop: context.stop,
      budget: lease.budget,
      used: {
        requests: context.used.requests,
        bytes: context.used.bytes,
        elapsed_ms: Math.max(0, observedMs - startedMs),
      },
    },
    counts: countBy(rows, (row) => row.verdict),
    since_previous_counts: countBy(rows, (row) => row.since_previous.verdict),
    resources: rows,
  };
  outputs.observations = out.create("evidence/observations.json", `${JSON.stringify(observations, null, 2)}\n`);
  outputs.requests = sha256(readFileSync(join(lease.outbox, "evidence", "requests.jsonl")));

  const finishedMs = deps.now();
  const receipt = buildReceipt(context, rows, logs, outputs, finishedMs);
  const receiptText = receiptJson(receipt);
  const receiptDigest = out.create("karma-receipt.json", receiptText);
  context.finishedMs = finishedMs;
  context.receiptBytes = Buffer.byteLength(receiptText);
  out.create("RETURN-NOTE.md", returnNote(context, rows, receiptDigest));

  return {
    result: context.result,
    stop: context.stop,
    requests: context.used.requests,
    bytes: context.used.bytes,
    counts: observations.counts,
    rang: rows.filter(rings).map((row) => `${row.kind} ${row.id}: ${row.since_previous.verdict}`),
    receipt_sha256: receiptDigest,
  };
}

function usage(write) {
  write("usage: hf-pin-reread.mjs --lease LEASE.json [--plan]\n");
  return 2;
}

export async function main(argv = process.argv.slice(2), overrides = {}) {
  const write = overrides.stdout ?? ((value) => process.stdout.write(value));
  const warn = overrides.stderr ?? ((value) => process.stderr.write(value));
  const deps = { ...defaultDeps(), ...overrides };
  scrubEnvironment(deps.env);
  const args = [...argv];
  const plan = args.includes("--plan");
  if (plan) args.splice(args.indexOf("--plan"), 1);
  if (args.length !== 2 || args[0] !== "--lease" || !args[1]) return usage(warn);

  const stat = lstatOrNull(args[1]);
  if (!stat?.isFile()) {
    warn("refused: lease-missing\n");
    return 1;
  }
  if (stat.size > MAX_LEASE_BYTES) {
    warn("lease invalid: lease too-large\n");
    return 2;
  }
  const leaseText = readFileSync(args[1], "utf8");
  try {
    if (plan) {
      write(`${JSON.stringify(planLookback(leaseText, deps), null, 2)}\n`);
      return 0;
    }
    const summary = await runLookback(leaseText, deps);
    if (summary.result === "refused") {
      for (const reason of summary.refusals) warn(`refused: ${reason}\n`);
      return 1;
    }
    write(`${JSON.stringify(summary, null, 2)}\n`);
    return summary.result === "completed" ? 0 : 3;
  } catch (error) {
    if (error instanceof LeaseError) {
      warn(`lease invalid: ${error.field} ${error.code}\n`);
      return 2;
    }
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(SCRIPT_PATH)) {
  const controller = new AbortController();
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => controller.abort());
  process.exitCode = await main(process.argv.slice(2), { signal: controller.signal });
}
