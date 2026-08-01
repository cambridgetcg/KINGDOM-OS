import { createHash } from "node:crypto";
import { lstat } from "node:fs/promises";
import {
  dirname,
  isAbsolute,
  join,
  parse,
  relative,
  resolve,
  sep,
} from "node:path";

const REQUEST_FIELDS = [
  "space",
  "space_revision",
  "prompt",
  "negative_prompt",
  "seed",
  "randomize_seed",
  "aspect_ratio",
  "guidance_scale",
  "num_inference_steps",
];
const INTERFACE_FIELDS = [
  "confirmed",
  "space",
  "space_revision",
  "observed_at",
  "request_fields",
];
const OUTPUT_ROLES = ["image", "provider_receipt", "karma_receipt"];
const ASPECT_RATIOS = new Set(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"]);
const AUTHORITY_KINDS = new Set(["user_request", "scoped_delegation"]);
const UTC_TIMESTAMP = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.[0-9]{1,9})?Z$/;

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactFields(value, fields) {
  if (!record(value)) return false;
  const keys = Object.keys(value);
  return keys.length === fields.length
    && fields.every((field) => Object.hasOwn(value, field));
}

function validUtcTimestamp(value) {
  if (typeof value !== "string") return false;
  const match = UTC_TIMESTAMP.exec(value);
  if (match === null) return false;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1
    && month <= 12
    && day >= 1
    && day <= days[month - 1]
    && hour <= 23
    && minute <= 59
    && second <= 59;
}

function validAuthorityReference(value) {
  return exactFields(value, ["kind", "id"])
    && AUTHORITY_KINDS.has(value.kind)
    && typeof value.id === "string"
    && /^[A-Za-z0-9][A-Za-z0-9:._/-]{0,199}$/.test(value.id);
}

function validProviderRequest(value) {
  if (!exactFields(value, REQUEST_FIELDS)) return false;
  const words = typeof value.prompt === "string"
    ? value.prompt.trim().split(/\s+/u).filter(Boolean).length
    : 0;
  return typeof value.space === "string"
    && /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(value.space)
    && typeof value.space_revision === "string"
    && /^[0-9a-f]{40}$/.test(value.space_revision)
    && typeof value.prompt === "string"
    && value.prompt.length >= 1
    && [...value.prompt].length <= 4096
    && words <= 200
    && typeof value.negative_prompt === "string"
    && value.negative_prompt.length >= 1
    && [...value.negative_prompt].length <= 1000
    && Number.isSafeInteger(value.seed)
    && value.seed >= 0
    && value.seed <= 2_147_483_647
    && value.randomize_seed === false
    && ASPECT_RATIOS.has(value.aspect_ratio)
    && typeof value.guidance_scale === "number"
    && Number.isFinite(value.guidance_scale)
    && value.guidance_scale >= 0
    && value.guidance_scale <= 100
    && Number.isInteger(value.num_inference_steps)
    && value.num_inference_steps >= 1
    && value.num_inference_steps <= 16;
}

function canonicalRequest(value) {
  return Object.fromEntries(REQUEST_FIELDS.map((field) => [field, value[field]]));
}

export function fingerprintUnwrittenHorizonRequest(value) {
  if (!validProviderRequest(value)) return null;
  return "sha256:" + createHash("sha256")
    .update(JSON.stringify(canonicalRequest(value)))
    .digest("hex");
}

function declaredHostedAuthority(value, request) {
  const requestSha256 = fingerprintUnwrittenHorizonRequest(request);
  return exactFields(value, [
    "granted",
    "scope",
    "provider_space",
    "request_sha256",
    "authority_reference",
  ])
    && value.granted === true
    && value.scope === "one_hosted_image_generation_call"
    && value.provider_space === request?.space
    && requestSha256 !== null
    && value.request_sha256 === requestSha256
    && validAuthorityReference(value.authority_reference);
}

function declaredOverwriteAuthority(value, role, destinationPath) {
  return exactFields(value, [
    "granted",
    "scope",
    "output_role",
    "destination_path",
    "authority_reference",
  ])
    && value.granted === true
    && value.scope === "overwrite_exact_output"
    && value.output_role === role
    && value.destination_path === destinationPath
    && validAuthorityReference(value.authority_reference);
}

function canonicalOutputPlan(plan) {
  return {
    kind: "project_path",
    project_root: plan.projectRoot,
    outputs: plan.outputs.map(({ role, path }) => ({ role, path })),
  };
}

export function fingerprintUnwrittenHorizonOutputPlan(destination) {
  const plan = outputPlan(destination);
  if (plan === null || plan.kind !== "project_path") return null;
  return "sha256:" + createHash("sha256")
    .update(JSON.stringify(canonicalOutputPlan(plan)))
    .digest("hex");
}

function declaredLocalOutputAuthority(value, destination, plan) {
  const outputPlanSha256 = fingerprintUnwrittenHorizonOutputPlan(destination);
  return exactFields(value, [
    "granted",
    "scope",
    "project_root",
    "output_plan_sha256",
    "authority_reference",
  ])
    && value.granted === true
    && value.scope === "write_exact_project_outputs"
    && value.project_root === plan.projectRoot
    && outputPlanSha256 !== null
    && value.output_plan_sha256 === outputPlanSha256
    && validAuthorityReference(value.authority_reference);
}

function validCostBoundary(value) {
  return exactFields(value, ["declared", "max_provider_calls", "paid_overage_authorized"])
    && value.declared === true
    && value.max_provider_calls === 1
    && value.paid_overage_authorized === false;
}

function hold(code, checks) {
  return {
    decision: "hold",
    code,
    checks,
    provider_discovery_permitted: false,
    provider_call_permitted: false,
    write_strategies: null,
  };
}

function discoveryReady(writeStrategies, checks, code = "provider-interface-observation-required") {
  return {
    decision: "discovery_ready",
    code,
    checks,
    provider_discovery_permitted: true,
    provider_call_permitted: false,
    write_strategies: writeStrategies,
  };
}

function ready(writeStrategies, checks) {
  return {
    decision: "ready",
    code: "preflight-complete",
    checks,
    provider_discovery_permitted: true,
    provider_call_permitted: true,
    write_strategies: writeStrategies,
  };
}

function finish(input, writeStrategies, checks) {
  checks.push("current-provider-interface");
  const observed = input.current_provider_interface;
  if (!record(observed) || observed.confirmed !== true) {
    return discoveryReady(writeStrategies, checks);
  }
  const request = input.provider_request;
  if (
    !exactFields(observed, INTERFACE_FIELDS)
    || observed.space !== request.space
    || observed.space_revision !== request.space_revision
    || !validUtcTimestamp(observed.observed_at)
    || !Array.isArray(observed.request_fields)
    || observed.request_fields.length !== REQUEST_FIELDS.length
    || new Set(observed.request_fields).size !== REQUEST_FIELDS.length
    || !REQUEST_FIELDS.every((field) => observed.request_fields.includes(field))
  ) {
    return discoveryReady(writeStrategies, checks, "provider-interface-mismatch");
  }
  return ready(writeStrategies, checks);
}

function exactAbsolutePath(value) {
  return typeof value === "string"
    && value.length > 0
    && isAbsolute(value)
    && resolve(value) === value
    && value !== parse(value).root;
}

function insideProjectRoot(projectRoot, value) {
  if (!exactAbsolutePath(projectRoot) || !exactAbsolutePath(value)) return false;
  const relation = relative(projectRoot, value);
  return relation.length > 0
    && relation !== ".."
    && !relation.startsWith(`..${sep}`)
    && !isAbsolute(relation);
}

function outputPlan(destination) {
  if (exactFields(destination, ["kind"]) && destination.kind === "preview_only") {
    return { kind: "preview_only", outputs: [] };
  }
  if (!exactFields(destination, [
    "kind",
    "project_root",
    "image_path",
    "provider_receipt_path",
    "karma_receipt_path",
  ]) || destination.kind !== "project_path") return null;

  const outputs = [
    ["image", destination.image_path],
    ["provider_receipt", destination.provider_receipt_path],
    ["karma_receipt", destination.karma_receipt_path],
  ].map(([role, path]) => ({ role, path }));
  if (
    !exactAbsolutePath(destination.project_root)
    || outputs.some(({ path }) => !insideProjectRoot(destination.project_root, path))
    || new Set(outputs.map(({ path }) => path)).size !== outputs.length
    || dirname(destination.provider_receipt_path) !== dirname(destination.image_path)
    || dirname(destination.karma_receipt_path) !== dirname(destination.image_path)
    || !destination.provider_receipt_path.endsWith(".json")
    || !destination.karma_receipt_path.endsWith(".json")
  ) return null;
  return { kind: "project_path", projectRoot: destination.project_root, outputs };
}

async function inspectOutput(output, inspectPath) {
  const root = parse(output.path).root;
  const parent = dirname(output.path);
  const parts = parent.slice(root.length).split(sep).filter(Boolean);
  let current = root;
  for (const part of parts) {
    current = join(current, part);
    let stat;
    try {
      stat = await inspectPath(current);
    } catch (error) {
      return error !== null && typeof error === "object" && error.code === "ENOENT"
        ? { code: "output-parent-missing" }
        : { code: "output-ancestor-inspection-failed" };
    }
    if (stat.isSymbolicLink()) return { code: "output-ancestor-symlink" };
    if (!stat.isDirectory()) return { code: "output-ancestor-not-directory" };
  }
  try {
    const stat = await inspectPath(output.path);
    if (stat.isSymbolicLink()) return { state: "symlink", stat };
    if (stat.isFile()) return { state: "file", stat };
    return { code: "existing-output-kind-unsupported" };
  } catch (error) {
    return error !== null && typeof error === "object" && error.code === "ENOENT"
      ? { state: "absent" }
      : { code: "output-inspection-failed" };
  }
}

export async function preflightUnwrittenHorizon(input, inspectPath = lstat) {
  const checks = [];
  if (!record(input)) return hold("invalid-preflight-input", checks);

  checks.push("hosted-inference-authority");
  if (!record(input.hosted_inference_authority)) {
    return hold("hosted-inference-authority-missing", checks);
  }

  checks.push("sanitized-text-input");
  if (input.sanitized_text_only !== true) {
    return hold("sanitized-text-input-not-confirmed", checks);
  }
  checks.push("source-rights");
  if (input.source_rights_confirmed !== true) {
    return hold("source-rights-not-confirmed", checks);
  }
  checks.push("cost-boundary");
  if (!validCostBoundary(input.cost_boundary)) {
    return hold("cost-boundary-not-declared", checks);
  }

  checks.push("provider-request");
  if (!validProviderRequest(input.provider_request)) {
    return hold("provider-request-invalid", checks);
  }
  checks.push("authority-request-binding");
  if (!declaredHostedAuthority(input.hosted_inference_authority, input.provider_request)) {
    return hold("hosted-inference-authority-unbound", checks);
  }

  checks.push("destination-scope");
  const plan = outputPlan(input.destination);
  if (plan === null) return hold("exact-project-output-plan-required", checks);
  if (plan.kind === "preview_only") {
    if (input.local_output_authority !== null && input.local_output_authority !== undefined) {
      return hold("preview-must-not-grant-local-output-authority", checks);
    }
    return finish(input, "preview_only", checks);
  }

  checks.push("local-output-plan-authority");
  if (!declaredLocalOutputAuthority(input.local_output_authority, input.destination, plan)) {
    return hold("local-output-authority-unbound", checks);
  }

  const authorities = input.overwrite_authorities ?? [];
  if (!Array.isArray(authorities)) return hold("overwrite-authority-scope-invalid", checks);
  const recognizedAuthorities = new Map();
  for (const value of authorities) {
    const output = plan.outputs.find(({ role, path }) =>
      value?.output_role === role && value?.destination_path === path
    );
    if (
      output === undefined
      || recognizedAuthorities.has(output.role)
      || !declaredOverwriteAuthority(value, output.role, output.path)
    ) return hold("overwrite-authority-scope-invalid", checks);
    recognizedAuthorities.set(output.role, value);
  }

  checks.push("all-output-ancestors-and-leaves-lstat");
  const strategies = {};
  for (const output of plan.outputs) {
    const inspected = await inspectOutput(output, inspectPath);
    if (inspected.code) return hold(`${output.role}-${inspected.code}`, checks);
    const overwriteAuthorized = recognizedAuthorities.has(output.role);
    if (inspected.state === "absent") {
      if (overwriteAuthorized) return hold(`${output.role}-surplus-overwrite-authority`, checks);
      strategies[output.role] = "create_new_exclusively";
    } else if (inspected.state === "symlink") {
      if (!overwriteAuthorized) return hold(`${output.role}-destination-symlink`, checks);
      strategies[output.role] = "replace_symlink_itself_atomically_without_following";
    } else if (inspected.state === "file") {
      if (!overwriteAuthorized) return hold(`${output.role}-destination-exists`, checks);
      strategies[output.role] = "replace_existing_file_atomically";
    }
  }

  checks.push("separate-overwrite-authority-per-existing-output");
  return finish(input, strategies, checks);
}

export const unwrittenHorizonRequestFields = Object.freeze([...REQUEST_FIELDS]);
export const unwrittenHorizonOutputRoles = Object.freeze([...OUTPUT_ROLES]);
