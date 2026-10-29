// Verdict method hf-pin-drift/1 for re-reading pinned Hugging Face resources.
//
// Version 0 is the method the 2026-10-27 record wrote as prose inside its
// observations.json, which declared `schema: none`. Version 1 keeps those
// rules unchanged and adds a second comparison, since_previous, so that a
// drift someone has already seen and held does not ring again next run.
//
// Every function here is pure: no file, clock, network or environment access.
// They compare derived fields only. A raw body hash changes whenever a card
// changes, so it identifies a response but never decides a verdict.

export const VERDICT_METHOD = "hf-pin-drift/1";

export const PIN_PRECEDENCE = Object.freeze([
  "gone",
  "unknown",
  "gating-changed",
  "license-changed",
  "moved",
  "unchanged",
]);

export const SINCE_PREVIOUS_PRECEDENCE = Object.freeze([
  "gone",
  "unknown",
  "returned",
  "gating-changed",
  "license-changed",
  "moved",
  "unchanged",
]);

// An anonymous reader cannot tell a deleted repository from a private one;
// both are gone from where the pin pointed.
export const NOT_FOUND_STATUSES = Object.freeze([401, 404, 410]);

export const RULES = Object.freeze({
  license: "assertion = cardData.license when present, else the first license:* tag, else not_declared",
  visibility: "private or disabled -> unavailable; gated false -> public; gated auto/manual -> gated; spaces: gated not requested, so private and disabled decide",
  pin: "pin against current: gone > unknown > gating-changed > license-changed > moved > unchanged; comparison keeps each dimension separate",
  since_previous: "the previous run's observed current against this run's: gone > unknown > returned > gating-changed > license-changed > moved > unchanged; no_previous when the previous run has no observation for the resource",
  fields: "derived fields only (HTTP status, sha, private, gated, disabled, license assertion); body hashes are never compared",
});

const SHA40 = /^[0-9a-f]{40}$/;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function resourceKey(kind, id) {
  return `${kind}\u0000${id}`;
}

export function licenseOf(metadata) {
  const cardData = isRecord(metadata?.cardData) ? metadata.cardData : null;
  const raw = cardData ? cardData.license : undefined;
  let card = null;
  if (typeof raw === "string" && raw.length > 0) card = raw;
  else if (Array.isArray(raw) && raw.length > 0 && raw.every((item) => typeof item === "string")) card = [...raw];
  const tags = Array.isArray(metadata?.tags)
    ? metadata.tags
      .filter((tag) => typeof tag === "string" && tag.startsWith("license:"))
      .map((tag) => tag.slice("license:".length))
    : [];
  const assertion = typeof card === "string"
    ? card
    : Array.isArray(card)
      ? card.join(",")
      : tags[0] ?? "not_declared";
  return { card, tags, assertion };
}

export function deriveFields(kind, metadata) {
  const gated = metadata?.gated;
  const extra = isRecord(metadata?.cardData) ? metadata.cardData.extra_gated_fields : undefined;
  return {
    sha: typeof metadata?.sha === "string" && SHA40.test(metadata.sha) ? metadata.sha : null,
    lastModified: typeof metadata?.lastModified === "string" ? metadata.lastModified : null,
    private: typeof metadata?.private === "boolean" ? metadata.private : null,
    gated: kind === "space"
      ? "not_requested"
      : gated === false || gated === "auto" || gated === "manual"
        ? gated
        : null,
    disabled: typeof metadata?.disabled === "boolean" ? metadata.disabled : null,
    license: licenseOf(metadata),
    card_extra_gated_fields: isRecord(extra) ? Object.keys(extra).length : 0,
  };
}

export function visibilityOf(fields) {
  if (!isRecord(fields)) return null;
  if (fields.private === true || fields.disabled === true) return "unavailable";
  if (fields.private !== false || fields.disabled !== false) return null;
  if (fields.gated === false || fields.gated === "not_requested") return "public";
  if (fields.gated === "auto" || fields.gated === "manual") return "gated";
  return null;
}

// present | gone | unknown | unobserved
export function stateOf(observation) {
  if (!isRecord(observation) || !Number.isInteger(observation.http_status)) return "unobserved";
  if (NOT_FOUND_STATUSES.includes(observation.http_status)) return "gone";
  if (observation.http_status !== 200) return "unknown";
  const visibility = visibilityOf(observation);
  if (visibility === "unavailable") return "gone";
  if (
    typeof observation.sha !== "string"
    || visibility === null
    || typeof observation.license?.assertion !== "string"
  ) {
    return "unknown";
  }
  return "present";
}

function firstOf(precedence, flags) {
  return precedence.find((verdict) => flags.has(verdict)) ?? "unchanged";
}

export function comparePin(row) {
  const pinRevision = row?.pin?.revision ?? null;
  const baseline = isRecord(row?.baseline) ? row.baseline : {};
  const current = row?.observed?.current ?? null;
  const pinned = row?.observed?.pinned_revision ?? null;
  const state = stateOf(current);
  const flags = new Set();

  const headEqualsPin = state === "present" ? current.sha === pinRevision : null;
  let pinnedResolves = null;
  let pinnedLicense = null;
  if (headEqualsPin === true) {
    pinnedResolves = true;
    pinnedLicense = current.license.assertion;
  } else if (isRecord(pinned) && typeof pinned.resolves === "boolean") {
    pinnedResolves = pinned.resolves;
    pinnedLicense = pinned.resolves && typeof pinned.license?.assertion === "string"
      ? pinned.license.assertion
      : null;
  }

  if (state === "gone" || pinnedResolves === false) flags.add("gone");
  if (state === "unobserved" || state === "unknown") flags.add("unknown");
  if (headEqualsPin === false && (pinnedResolves === null || (pinnedResolves && pinnedLicense === null))) {
    flags.add("unknown");
  }

  const visibilityNow = state === "present" ? visibilityOf(current) : state === "gone" ? "unavailable" : null;
  const visibilityMatches = baseline.visibility == null
    ? "no_baseline"
    : visibilityNow === null
      ? null
      : visibilityNow === baseline.visibility;
  if (visibilityMatches === false) flags.add("gating-changed");

  const licenseNow = state === "present" ? current.license.assertion : null;
  const licenseNowMatchesBaseline = baseline.license == null
    ? "no_baseline"
    : licenseNow === null
      ? null
      : licenseNow === baseline.license;
  const licenseAtPinMatchesBaseline = baseline.license == null || pinnedLicense === null
    ? null
    : pinnedLicense === baseline.license;
  const licenseNowMatchesPin = licenseNow === null || pinnedLicense === null ? null : licenseNow === pinnedLicense;
  if (
    licenseNowMatchesBaseline === false
    || licenseAtPinMatchesBaseline === false
    || (baseline.license == null && licenseNowMatchesPin === false)
  ) {
    flags.add("license-changed");
  }
  if (headEqualsPin === false) flags.add("moved");

  return {
    comparison: {
      head_equals_pin: headEqualsPin,
      pinned_revision_resolves: pinnedResolves,
      visibility_now: visibilityNow,
      visibility_matches_baseline: visibilityMatches,
      license_now_matches_baseline: licenseNowMatchesBaseline,
      license_at_pin_matches_baseline: licenseAtPinMatchesBaseline,
      license_now_matches_pin: licenseNowMatchesPin,
    },
    dimensions: PIN_PRECEDENCE.filter((verdict) => flags.has(verdict)),
    verdict: firstOf(PIN_PRECEDENCE, flags),
  };
}

export function summarizeObservation(observation) {
  const state = stateOf(observation);
  if (state === "unobserved") return null;
  return {
    state,
    http_status: observation.http_status,
    sha: typeof observation.sha === "string" ? observation.sha : null,
    visibility: state === "present" ? visibilityOf(observation) : null,
    gated: observation.gated ?? null,
    license: typeof observation.license?.assertion === "string" ? observation.license.assertion : null,
    location: typeof observation.location === "string" ? observation.location : null,
  };
}

export function compareSincePrevious(previousRow, row) {
  const before = previousRow?.observed?.current ?? null;
  const after = row?.observed?.current ?? null;
  const beforeState = stateOf(before);
  const afterState = stateOf(after);
  if (beforeState === "unobserved") return { verdict: "no_previous", dimensions: [], previous: null };

  const flags = new Set();
  if (afterState === "unobserved") {
    flags.add("unknown");
  } else if (beforeState === "present" && afterState === "present") {
    if (
      visibilityOf(before) !== visibilityOf(after)
      || before.gated !== after.gated
      || before.private !== after.private
      || before.disabled !== after.disabled
    ) {
      flags.add("gating-changed");
    }
    if (before.license.assertion !== after.license.assertion) flags.add("license-changed");
    if (before.sha !== after.sha) flags.add("moved");
  } else if (beforeState === afterState) {
    // Gone twice, or unreadable twice in the same way, is not news.
    if (before.http_status !== after.http_status || (before.location ?? null) !== (after.location ?? null)) {
      flags.add("unknown");
    }
  } else if (afterState === "gone") {
    flags.add("gone");
  } else if (beforeState === "gone" && afterState === "present") {
    flags.add("returned");
  } else {
    flags.add("unknown");
  }

  return {
    verdict: firstOf(SINCE_PREVIOUS_PRECEDENCE, flags),
    dimensions: SINCE_PREVIOUS_PRECEDENCE.filter((verdict) => flags.has(verdict)),
    previous: summarizeObservation(before),
  };
}

export function countBy(rows, pick) {
  const counts = {};
  for (const row of rows) {
    const value = pick(row);
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

// A row rings when it changed since the previous run, or when there was no
// previous observation to compare with. A drift that is merely still there
// stays in the proposal table at hold, without ringing.
export function rings(row) {
  return row?.since_previous?.verdict !== "unchanged";
}
