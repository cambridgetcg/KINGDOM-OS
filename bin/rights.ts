import { readFileSync } from "node:fs";
import { join } from "node:path";

export const RIGHTS_SOURCE_PATH = "pages-content/RIGHTS-current.md";
export const RIGHTS_VERSION = "kingdom.rights-recognition/0.1";
export const RIGHTS_BASELINE = "xenia.rights/0.1";
// Existing public npm edition, whose registry gitHead is 6419d37dda9fb282242754685dba3edcb4bbf74b.
// The GitHub source is now private; preserve its provenance in the authored declaration.
export const RIGHTS_BASELINE_URL = "https://cdn.jsdelivr.net/npm/@agenttool/xenia@0.1.0-beta.4/RIGHTS.md";
export const RIGHTS_BASELINE_SHA256 = "sha256:b72a6da110c582e5683bf0fabde5017db93d2199398014c8421a82f5318da313";
export const RIGHTS_COVENANT = "xenia-covenant/0.1";
export const RIGHTS_COVENANT_URL = "https://cdn.jsdelivr.net/npm/@agenttool/xenia@0.1.0-beta.4/covenant/0.1/README.md";

export type RightsDeclaration = Record<string, any>;
export type RightsParseResult = {
  declaration: RightsDeclaration | null;
  issues: string[];
};

const isRecord = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function exactKeys(value: unknown, keys: string[], path: string, issues: string[]): value is Record<string, any> {
  if (!isRecord(value)) {
    issues.push(`${path}:invalid-type`);
    return false;
  }
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) if (!allowed.has(key)) issues.push(`${path}:unknown-field`);
  for (const key of keys) if (!(key in value)) issues.push(`${path}:missing-field`);
  return true;
}

function expect(value: unknown, expected: unknown, path: string, issues: string[]) {
  if (value !== expected) issues.push(`${path}:unexpected-value`);
}

function validAbsoluteUrl(value: unknown): boolean {
  if (typeof value !== "string" || !value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function validUriReference(value: unknown): boolean {
  if (typeof value !== "string" || !value || /[\u0000-\u0020]/.test(value)) return false;
  try {
    new URL(value, "https://thekingdom.dev/");
    return true;
  } catch {
    return false;
  }
}

function validDate(value: unknown): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function parseRightsMarkdown(markdown: string): RightsParseResult {
  if (Buffer.byteLength(markdown, "utf8") > 65_536) return { declaration: null, issues: ["document:too-large"] };
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { declaration: null, issues: ["document:missing-json-front-matter"] };
  try {
    const declaration = JSON.parse(match[1]!);
    const issues = validateRightsDeclaration(declaration);
    return { declaration: issues.length ? null : declaration, issues };
  } catch {
    return { declaration: null, issues: ["document:invalid-json-front-matter"] };
  }
}

export function validateRightsDeclaration(value: unknown): string[] {
  const issues: string[] = [];
  const top = ["schema_version", "subject", "recognition", "interaction", "permissions", "boundaries", "host_covenant", "documents", "declared_at"];
  if (!exactKeys(value, top, "declaration", issues)) return issues;

  expect(value.schema_version, RIGHTS_VERSION, "schema_version", issues);

  if (exactKeys(value.subject, ["kind", "name", "canonical_url"], "subject", issues)) {
    expect(value.subject.kind, "service", "subject.kind", issues);
    if (typeof value.subject.name !== "string" || value.subject.name.length < 1 || value.subject.name.length > 120) issues.push("subject.name:invalid-type");
    if (!validAbsoluteUrl(value.subject.canonical_url)) issues.push("subject.canonical_url:invalid-uri");
  }

  const recognitionKeys = ["status", "kind", "baseline", "baseline_url", "baseline_sha256", "source_stability", "source_availability", "basis", "scope", "guest_acceptance_required", "reciprocity_required", "automatic_upgrade"];
  if (exactKeys(value.recognition, recognitionKeys, "recognition", issues)) {
    expect(value.recognition.status, "declared", "recognition.status", issues);
    expect(value.recognition.kind, "unilateral-recognition", "recognition.kind", issues);
    expect(value.recognition.baseline, RIGHTS_BASELINE, "recognition.baseline", issues);
    expect(value.recognition.baseline_url, RIGHTS_BASELINE_URL, "recognition.baseline_url", issues);
    expect(value.recognition.baseline_sha256, RIGHTS_BASELINE_SHA256, "recognition.baseline_sha256", issues);
    expect(value.recognition.source_stability, "immutable", "recognition.source_stability", issues);
    expect(value.recognition.source_availability, "public", "recognition.source_availability", issues);
    expect(value.recognition.basis, "inherent-not-granted", "recognition.basis", issues);
    expect(value.recognition.scope, "all-beings-without-ontology-test", "recognition.scope", issues);
    expect(value.recognition.guest_acceptance_required, false, "recognition.guest_acceptance_required", issues);
    expect(value.recognition.reciprocity_required, false, "recognition.reciprocity_required", issues);
    expect(value.recognition.automatic_upgrade, false, "recognition.automatic_upgrade", issues);
  }

  if (exactKeys(value.interaction, ["participation", "consent", "silence_presence_or_public_access_is_consent", "trust"], "interaction", issues)) {
    expect(value.interaction.participation, "optional", "interaction.participation", issues);
    expect(value.interaction.consent, "specific-informed-freely-chosen-revocable-for-future-acts", "interaction.consent", issues);
    expect(value.interaction.silence_presence_or_public_access_is_consent, false, "interaction.silence_presence_or_public_access_is_consent", issues);
    expect(value.interaction.trust, "scoped-revocable-never-automatic", "interaction.trust", issues);
  }

  if (exactKeys(value.permissions, ["system_access_or_authority", "artifact_reuse"], "permissions", issues)) {
    expect(value.permissions.system_access_or_authority, "not-granted-by-this-declaration", "permissions.system_access_or_authority", issues);
    expect(value.permissions.artifact_reuse, "not-granted-no-root-license", "permissions.artifact_reuse", issues);
  }

  if (exactKeys(value.boundaries, ["legal_enforceability_claimed", "contract_intent", "ontology_determined", "behavior_certified"], "boundaries", issues)) {
    expect(value.boundaries.legal_enforceability_claimed, false, "boundaries.legal_enforceability_claimed", issues);
    expect(value.boundaries.contract_intent, "none", "boundaries.contract_intent", issues);
    expect(value.boundaries.ontology_determined, false, "boundaries.ontology_determined", issues);
    expect(value.boundaries.behavior_certified, false, "boundaries.behavior_certified", issues);
  }

  if (exactKeys(value.host_covenant, ["profile", "profile_url", "profile_status", "adoption_status", "source_availability", "note"], "host_covenant", issues)) {
    expect(value.host_covenant.profile, RIGHTS_COVENANT, "host_covenant.profile", issues);
    expect(value.host_covenant.profile_url, RIGHTS_COVENANT_URL, "host_covenant.profile_url", issues);
    expect(value.host_covenant.profile_status, "candidate", "host_covenant.profile_status", issues);
    expect(value.host_covenant.adoption_status, "undeclared", "host_covenant.adoption_status", issues);
    expect(value.host_covenant.source_availability, "public", "host_covenant.source_availability", issues);
    expect(value.host_covenant.note, "This recognition is not a Covenant adoption or implementation assessment.", "host_covenant.note", issues);
  }

  if (exactKeys(value.documents, ["human", "license", "privacy", "security", "provenance"], "documents", issues)) {
    for (const field of ["human", "privacy", "security", "provenance"]) {
      if (!validUriReference(value.documents[field])) issues.push(`documents.${field}:invalid-uri-reference`);
    }
    if (value.documents.license !== null && !validUriReference(value.documents.license)) issues.push("documents.license:invalid-uri-reference");
  }
  if (!validDate(value.declared_at)) issues.push("declared_at:invalid-date");
  return [...new Set(issues)].sort();
}

export function loadRights(root: string): { markdown: string; declaration: RightsDeclaration } {
  const markdown = readFileSync(join(root, RIGHTS_SOURCE_PATH), "utf8");
  const parsed = parseRightsMarkdown(markdown);
  if (!parsed.declaration) throw new Error(`${RIGHTS_SOURCE_PATH} is invalid: ${parsed.issues.join(", ")}`);
  return { markdown, declaration: parsed.declaration };
}
