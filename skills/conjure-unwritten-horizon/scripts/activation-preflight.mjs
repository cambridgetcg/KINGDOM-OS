import { lstat } from "node:fs/promises";
import { isAbsolute } from "node:path";

function declaredAuthority(value) {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && value.granted === true
    && typeof value.authority_reference === "string"
    && value.authority_reference.trim().length > 0;
}

function declaredOverwriteAuthority(value, destinationPath) {
  return declaredAuthority(value)
    && value.scope === "overwrite_exact_destination"
    && value.destination_path === destinationPath;
}

function hold(code, checks) {
  return {
    decision: "hold",
    code,
    checks,
    provider_discovery_permitted: false,
    provider_call_permitted: false,
    write_strategy: null,
  };
}

function discoveryReady(writeStrategy, checks) {
  return {
    decision: "discovery_ready",
    code: "provider-interface-observation-required",
    checks,
    provider_discovery_permitted: true,
    provider_call_permitted: false,
    write_strategy: writeStrategy,
  };
}

function ready(writeStrategy, checks) {
  return {
    decision: "ready",
    code: "preflight-complete",
    checks,
    provider_discovery_permitted: true,
    provider_call_permitted: true,
    write_strategy: writeStrategy,
  };
}

function finish(input, writeStrategy, checks) {
  checks.push("current-provider-interface");
  return input.current_provider_interface_confirmed === true
    ? ready(writeStrategy, checks)
    : discoveryReady(writeStrategy, checks);
}

export async function preflightUnwrittenHorizon(input, inspectDestination = lstat) {
  const checks = [];
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return hold("invalid-preflight-input", checks);
  }

  checks.push("hosted-inference-authority");
  if (!declaredAuthority(input.hosted_inference_authority)) {
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
  if (input.cost_boundary_declared !== true) {
    return hold("cost-boundary-not-declared", checks);
  }

  checks.push("destination-scope");
  const destination = input.destination;
  if (destination?.kind === "preview_only") {
    if (Object.hasOwn(destination, "path") && destination.path !== null) {
      return hold("preview-destination-must-not-name-path", checks);
    }
    return finish(input, "preview_only", checks);
  }
  if (
    destination === null
    || typeof destination !== "object"
    || Array.isArray(destination)
    || destination.kind !== "project_path"
    || typeof destination.path !== "string"
    || destination.path.length === 0
    || !isAbsolute(destination.path)
  ) {
    return hold("exact-absolute-project-path-required", checks);
  }

  checks.push("destination-lstat");
  let stat;
  try {
    stat = await inspectDestination(destination.path);
  } catch (error) {
    if (error !== null && typeof error === "object" && error.code === "ENOENT") {
      return finish(input, "create_new_exclusively", checks);
    }
    return hold("destination-inspection-failed", checks);
  }

  const overwriteAuthorized = declaredOverwriteAuthority(input.overwrite_authority, destination.path);
  checks.push("separate-overwrite-authority");
  if (stat.isSymbolicLink()) {
    return overwriteAuthorized
      ? finish(input, "replace_symlink_itself_atomically_without_following", checks)
      : hold("destination-symlink", checks);
  }
  if (!stat.isFile()) return hold("existing-destination-kind-unsupported", checks);
  return overwriteAuthorized
    ? finish(input, "replace_existing_file_atomically", checks)
    : hold("destination-exists", checks);
}
