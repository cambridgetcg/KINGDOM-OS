#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalizePrincipalityValue as canonicalizeJsonValue,
  parseStrictJsonBytes,
} from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const RARE_PATHWAY_PROTOCOL = "kingdom.rare-pathway-challenge/0.1";
export const RARE_PATHWAY_ID = "vanishing-path-2026-08-13";
export const RARE_PATHWAY_LOCATOR = "data/challenges/vanishing-path.v1.json";
export const RARE_PATHWAY_PATH = join(ROOT, RARE_PATHWAY_LOCATOR);
export const RARE_PATHWAY_URL = `https://thekingdom.dev/challenges/${RARE_PATHWAY_ID}.json`;
export const RARE_PATHWAY_SCHEMA_URL = "https://thekingdom.dev/schemas/rare-pathway-challenge/1.json";
export const RARE_PATHWAY_DOCUMENT_URL = "https://thekingdom.dev/VANISHING-PATH.md";
export const RARE_PATHWAY_DIGEST = "sha256:82eeaf4757fb75be77b1e878d41c784111bbf5b261500123d89daccbcea0ff91";

const MAX_BYTES = 1024 * 1024;
const MIN_NORMAL_NUMBER = 2.2250738585072014e-308;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INTEGRITY_ALGORITHM = "sha256-recursive-sorted-json-keys-v1";
const TOP_KEYS = [
  "$schema", "protocol", "challenge_id", "title", "compiled_on", "evidence_through",
  "origin", "binding", "scope", "states", "models", "worked_examples",
  "question_ladder", "constructive_gate", "wake_seam", "sources", "boundaries",
  "integrity",
] as const;
const STATE_IDS = ["possible", "accessible", "occurred", "detected"] as const;
const MODEL_IDS = [
  "time-dependent-competing-hazards", "constant-two-path-race",
  "zero-winner-binomial-bound", "zero-event-upper-bound", "robust-restoration-design",
  "minimum-target-rate", "expected-information-design",
] as const;
const EXAMPLE_IDS = [
  "slow-path-against-fast-path", "zero-events-do-not-mean-zero-rate",
  "abstract-restoration-threshold",
] as const;
const QUESTION_IDS = [
  "bounded-phenomenon", "permitted-claim", "competing-first-arrival", "absence-bound",
  "identifiability", "separating-observation", "decision-delta", "benefit-burden",
  "transfer-test", "status-capture",
] as const;
const OUTCOME_IDS = ["BUILD", "PLAY", "REVISE", "STOP"] as const;
const SOURCE_IDS = [
  "jiang-terhorst-2011", "sun-ceder-2017", "little-2017", "garwood-1936",
  "clopper-pearson-1934", "aalen-johansen-1978", "tsiatis-1975", "cox-1959",
  "lindley-1956", "bertsimas-sim-2004", "kingdom-ritonavir-history",
] as const;
const SOURCE_URLS = [
  "https://doi.org/10.1021/cg101213q",
  "https://doi.org/10.1039/C7CE00766C",
  "https://doi.org/10.1063/1.4993566",
  "https://doi.org/10.1093/biomet/28.3-4.437",
  "https://doi.org/10.1093/biomet/26.4.404",
  "https://www.jstor.org/stable/4615704",
  "https://doi.org/10.1073/pnas.72.1.20",
  "https://doi.org/10.1111/j.2517-6161.1959.tb00349.x",
  "https://doi.org/10.1214/aoms/1177728069",
  "https://doi.org/10.1287/opre.1030.0065",
  "https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json",
] as const;
const EXPECTED_BOUNDARIES: Record<string, boolean> = {
  educational_only: true,
  public_surface_read_only: true,
  worked_examples_hypothetical: true,
  ritonavir_rate_fit: false,
  literal_extinction_established: false,
  stationarity_established: false,
  independence_established: false,
  perfect_detection_established: false,
  mechanism_identified: false,
  causal_authority: false,
  experiment_authority: false,
  wet_lab_protocol: false,
  formulation_authority: false,
  manufacturing_authority: false,
  medical_authority: false,
  regulatory_authority: false,
  motive_inference: false,
  person_score: false,
  prestige_diagnosis: false,
  automatic_action: false,
  writes_wake: false,
  writes_agenttool: false,
  writes_karma: false,
  grants_authority: false,
};

export type RarePathwayIssue = { field: string; code: string };
export type RaceResult = {
  target_rate: number;
  competitor_rate: number;
  horizon: number;
  no_event: number;
  target_first: number;
  competitor_first: number;
  target_given_event: number | null;
};
export type RacePhase = { targetRate: number; competitorRate: number; duration: number };

function fail(message: string): never { throw new Error(message); }
function object(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown, max = 6000): value is string {
  return typeof value === "string" && value.length > 0 && Array.from(value).length <= max;
}
function sameKeys(value: unknown, keys: readonly string[]): boolean {
  return object(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}
function exactIds(value: unknown, ids: readonly string[]): boolean {
  return Array.isArray(value) && value.length === ids.length &&
    value.every((item, index) => object(item) && item.id === ids[index]);
}
function finite(value: number, name: string): number {
  if (!Number.isFinite(value)) fail(`${name} must be finite`);
  return value;
}
function nonnegative(value: number, name: string): number {
  finite(value, name);
  if (value < 0) fail(`${name} must be nonnegative`);
  return value;
}
function positive(value: number, name: string): number {
  finite(value, name);
  if (value <= 0) fail(`${name} must be positive`);
  return value;
}
function openProbability(value: number, name: string): number {
  finite(value, name);
  if (value <= 0 || value >= 1) fail(`${name} must be strictly between zero and one`);
  return value;
}
function parseNumber(input: string | undefined, name: string): number {
  if (input === undefined || input.trim() === "") fail(`${name} is required`);
  return finite(Number(input), name);
}

function rateShares(targetRate: number, competitorRate: number): [number, number] {
  if (targetRate === 0) return [0, 1];
  if (competitorRate === 0) return [1, 0];
  if (targetRate >= competitorRate) {
    const ratio = competitorRate / targetRate;
    const denominator = 1 + ratio;
    return [1 / denominator, ratio / denominator];
  }
  const ratio = targetRate / competitorRate;
  const denominator = 1 + ratio;
  return [ratio / denominator, 1 / denominator];
}

/** Constant two-cause first-arrival distribution. */
export function competingRace(targetRate: number, competitorRate: number, horizon: number): RaceResult {
  nonnegative(targetRate, "target rate");
  nonnegative(competitorRate, "competitor rate");
  nonnegative(horizon, "horizon");
  if ((targetRate === 0 && competitorRate === 0) || horizon === 0) {
    return {
      target_rate: targetRate,
      competitor_rate: competitorRate,
      horizon,
      no_event: 1,
      target_first: 0,
      competitor_first: 0,
      target_given_event: null,
    };
  }
  const cumulativeHazard = targetRate * horizon + competitorRate * horizon;
  const noEvent = Math.exp(-cumulativeHazard);
  const event = -Math.expm1(-cumulativeHazard);
  const [targetShare, competitorShare] = rateShares(targetRate, competitorRate);
  const targetFirst = event * targetShare;
  const competitorFirst = event * competitorShare;
  return {
    target_rate: targetRate,
    competitor_rate: competitorRate,
    horizon,
    no_event: noEvent,
    target_first: targetFirst,
    competitor_first: competitorFirst,
    target_given_event: targetShare,
  };
}

/** Piecewise-constant cause-specific hazards; no latent-time independence claim is needed. */
export function piecewiseCompetingRace(phases: readonly RacePhase[]): {
  no_event: number;
  target_first: number;
  competitor_first: number;
  horizon: number;
} {
  if (!Array.isArray(phases) || phases.length === 0 || phases.length > 10_000) {
    fail("phases must contain between one and 10000 entries");
  }
  let survival = 1;
  let targetFirst = 0;
  let competitorFirst = 0;
  let horizon = 0;
  phases.forEach((phase, index) => {
    const target = nonnegative(phase.targetRate, `phase ${index} target rate`);
    const competitor = nonnegative(phase.competitorRate, `phase ${index} competitor rate`);
    const duration = nonnegative(phase.duration, `phase ${index} duration`);
    if ((target > 0 || competitor > 0) && duration > 0) {
      const cumulativeHazard = target * duration + competitor * duration;
      const exits = survival * -Math.expm1(-cumulativeHazard);
      const [targetShare, competitorShare] = rateShares(target, competitor);
      const targetExit = exits * targetShare;
      targetFirst += targetExit;
      competitorFirst += exits * competitorShare;
      survival *= Math.exp(-cumulativeHazard);
    }
    horizon += duration;
    if (!Number.isFinite(horizon)) fail("combined phase duration must be finite");
  });
  return { no_event: survival, target_first: targetFirst, competitor_first: competitorFirst, horizon };
}

/** Exact zero-count upper bound under the homogeneous Poisson observation model. */
export function zeroEventUpperRate(exposure: number, confidence: number): number {
  positive(exposure, "exposure");
  openProbability(confidence, "confidence");
  const result = -Math.log1p(-confidence) / exposure;
  if (!Number.isFinite(result) || result <= 0) {
    fail("upper rate is outside the finite positive numerical range; rescale exposure units");
  }
  return result;
}

/** Exact zero-success upper bound on a batch-level winner probability. */
export function zeroWinnerUpperProbability(batchCount: number, confidence: number): number {
  if (!Number.isSafeInteger(batchCount) || batchCount <= 0) fail("batch count must be a positive safe integer");
  openProbability(confidence, "confidence");
  const result = -Math.expm1(Math.log1p(-confidence) / batchCount);
  if (!Number.isFinite(result) || result <= 0) {
    fail("upper winner probability is outside the finite positive numerical range");
  }
  return result;
}

/** Smallest abstract target rate satisfying the constant-race finite-horizon target. */
export function requiredTargetRate(competitorRate: number, horizon: number, targetProbability: number): number {
  nonnegative(competitorRate, "competitor rate");
  positive(horizon, "horizon");
  openProbability(targetProbability, "target probability");
  if (targetProbability < MIN_NORMAL_NUMBER) {
    fail("target probability is outside the stable numerical range; rescale the probability model");
  }
  const probability = (rate: number) => competingRace(rate, competitorRate, horizon).target_first;
  const unopposed = -Math.log1p(-targetProbability) / horizon;
  const numericalRangeError = () => fail("minimum target rate is outside the finite positive numerical range; rescale time units");
  if (!Number.isFinite(unopposed) || unopposed <= 0) numericalRangeError();
  if (competitorRate === 0) return unopposed;

  const shareFloor = competitorRate * (targetProbability / (1 - targetProbability));
  if (!Number.isFinite(shareFloor)) numericalRangeError();
  let low = 0;
  let high = Math.max(unopposed, shareFloor, Number.MIN_VALUE);
  while (probability(high) < targetProbability) {
    if (high >= Number.MAX_VALUE / 2) {
      high = Number.MAX_VALUE;
      if (probability(high) < targetProbability) numericalRangeError();
      break;
    }
    high *= 2;
  }
  for (let index = 0; index < 2048; index += 1) {
    const middle = low + (high - low) / 2;
    if (middle === low || middle === high) break;
    if (probability(middle) >= targetProbability) high = middle;
    else low = middle;
  }
  if (!Number.isFinite(high) || high <= 0 || probability(high) < targetProbability) numericalRangeError();
  return high;
}

export function rarePathwayDigest(value: Record<string, any>): string {
  const material = structuredClone(value);
  if (!object(material.integrity)) fail("rare-pathway integrity envelope is missing");
  material.integrity.digest = null;
  return `sha256:${createHash("sha256").update(canonicalizeJsonValue(material)).digest("hex")}`;
}

function readUnchecked(path: string): unknown {
  const absolute = resolve(path);
  let stat;
  try { stat = lstatSync(absolute); } catch { fail("rare-pathway challenge is unavailable"); }
  if (!stat.isFile() || stat.isSymbolicLink()) fail("rare-pathway challenge must be a regular non-symlink file");
  if (stat.size > MAX_BYTES) fail(`rare-pathway challenge exceeds ${MAX_BYTES} bytes`);
  return parseStrictJsonBytes(readFileSync(absolute), "rare-pathway challenge JSON");
}

export function verifyRarePathwayChallenge(value: unknown): RarePathwayIssue[] {
  const issues: RarePathwayIssue[] = [];
  const add = (field: string, code: string) => issues.push({ field, code });
  try {
    if (!object(value)) return [{ field: "$", code: "must-be-object" }];
    if (!sameKeys(value, TOP_KEYS)) add("$", "unexpected-or-missing-field");
    if (value.$schema !== "urn:kingdom:schema:rare-pathway-challenge:1") add("$.$schema", "schema-mismatch");
    if (value.protocol !== RARE_PATHWAY_PROTOCOL) add("$.protocol", "protocol-mismatch");
    if (value.challenge_id !== RARE_PATHWAY_ID) add("$.challenge_id", "identity-mismatch");
    if (value.title !== "The Vanishing Path" || value.compiled_on !== "2026-08-13" || value.evidence_through !== "2024-06-20") add("$.title", "reviewed-metadata-mismatch");

    if (!sameKeys(value.origin, ["kind", "credit", "personal_identifiers_recorded", "participation"]) ||
        value.origin?.kind !== "conversation-challenge" || !text(value.origin?.credit) ||
        value.origin?.personal_identifiers_recorded !== false || value.origin?.participation !== "voluntary") add("$.origin", "origin-boundary-mismatch");
    if (!sameKeys(value.binding, ["case_id", "url", "raw_digest", "semantic_digest", "relation", "mutated", "authority_imported"]) ||
        value.binding?.case_id !== "ritonavir-disappearing-polymorph-2026-08-11" ||
        value.binding?.url !== "https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json" ||
        value.binding?.raw_digest !== "sha256:08148603a1228960ac35df1378f1283c3fce43874a9fc07e6687f18e980dcb1c" ||
        value.binding?.semantic_digest !== "sha256:6c759f595f0c6753dcf47d25d2a3490246984ef2b79adf31a558261b26ef8116" ||
        value.binding?.relation !== "illustrative-history-not-rate-fit" || value.binding?.mutated !== false ||
        value.binding?.authority_imported !== false) add("$.binding", "binding-mismatch");
    if (!sameKeys(value.scope, ["phenomenon", "purpose", "intended_use", "excluded_use", "registers"]) ||
        !text(value.scope?.phenomenon) || !text(value.scope?.purpose) || !text(value.scope?.intended_use) ||
        !text(value.scope?.excluded_use) || JSON.stringify(value.scope?.registers) !== JSON.stringify([
          "MATHEMATICAL_DERIVATION", "EMPIRICAL_QUESTION", "DESIGN_PROPOSAL", "OPT_IN_REFLECTION",
        ])) add("$.scope", "scope-mismatch");

    if (!exactIds(value.states, STATE_IDS)) add("$.states", "state-order-or-membership-mismatch");
    for (const [index, state] of (Array.isArray(value.states) ? value.states : []).entries()) {
      if (!sameKeys(state, ["id", "plain_language", "does_not_imply"]) || !text(state.plain_language) || !text(state.does_not_imply)) add(`$.states[${index}]`, "invalid-state");
    }
    if (!exactIds(value.models, MODEL_IDS)) add("$.models", "model-order-or-membership-mismatch");
    for (const [index, model] of (Array.isArray(value.models) ? value.models : []).entries()) {
      if (!sameKeys(model, ["id", "register", "equations", "inputs", "valid_outputs", "assumptions", "identifiability_limit", "ritonavir_status"]) ||
          !["MATHEMATICAL_DERIVATION", "DESIGN_PROPOSAL"].includes(model.register) ||
          !Array.isArray(model.equations) || model.equations.length < 1 || !model.equations.every((entry: unknown) => text(entry)) ||
          !Array.isArray(model.inputs) || !model.inputs.every((entry: unknown) => text(entry)) ||
          !Array.isArray(model.valid_outputs) || !model.valid_outputs.every((entry: unknown) => text(entry)) ||
          !Array.isArray(model.assumptions) || !model.assumptions.every((entry: unknown) => text(entry)) ||
          !text(model.identifiability_limit) || model.ritonavir_status !== "illustrative-only-not-fitted") add(`$.models[${index}]`, "invalid-model-card");
    }
    if (!exactIds(value.worked_examples, EXAMPLE_IDS)) add("$.worked_examples", "example-order-or-membership-mismatch");
    for (const [index, example] of (Array.isArray(value.worked_examples) ? value.worked_examples : []).entries()) {
      if (!sameKeys(example, ["id", "model_id", "hypothetical", "inputs", "outputs", "lesson"]) ||
          !MODEL_IDS.includes(example.model_id) || example.hypothetical !== true || !object(example.inputs) ||
          !object(example.outputs) || !text(example.lesson)) add(`$.worked_examples[${index}]`, "invalid-worked-example");
    }
    const race = competingRace(0.02, 0.18, 10);
    const raceOutput = value.worked_examples?.[0]?.outputs;
    if (!object(raceOutput) || Math.abs(raceOutput.no_event - race.no_event) > 1e-14 ||
        Math.abs(raceOutput.A_first - race.target_first) > 1e-14 ||
        Math.abs(raceOutput.B_first - race.competitor_first) > 1e-14 ||
        Math.abs(raceOutput.A_given_event - (race.target_given_event ?? 0)) > 1e-14) add("$.worked_examples[0].outputs", "calculation-mismatch");
    if (Math.abs(value.worked_examples?.[1]?.outputs?.upper_rate - zeroEventUpperRate(200, 0.95)) > 1e-14) add("$.worked_examples[1].outputs", "calculation-mismatch");
    if (Math.abs(value.worked_examples?.[2]?.outputs?.minimum_target_rate - requiredTargetRate(0.18, 10, 0.5)) > 1e-13) add("$.worked_examples[2].outputs", "calculation-mismatch");

    if (!exactIds(value.question_ladder, QUESTION_IDS)) add("$.question_ladder", "question-order-or-membership-mismatch");
    for (const [index, question] of (Array.isArray(value.question_ladder) ? value.question_ladder : []).entries()) {
      if (!sameKeys(question, ["id", "question", "register"]) || !text(question.question) || !value.scope?.registers?.includes(question.register)) add(`$.question_ladder[${index}]`, "invalid-question");
    }
    if (!sameKeys(value.constructive_gate, ["rule", "checks", "outcomes", "not_a_score", "prestige_is_not_evidence_of_benefit", "play_is_valid", "refusal_requires_reason"]) ||
        !text(value.constructive_gate?.rule) || !Array.isArray(value.constructive_gate?.checks) || value.constructive_gate.checks.length !== 7 ||
        !value.constructive_gate.checks.every((entry: unknown) => text(entry)) || !exactIds(value.constructive_gate?.outcomes, OUTCOME_IDS) ||
        value.constructive_gate?.not_a_score !== true || value.constructive_gate?.prestige_is_not_evidence_of_benefit !== true ||
        value.constructive_gate?.play_is_valid !== true || value.constructive_gate?.refusal_requires_reason !== false) add("$.constructive_gate", "constructive-gate-mismatch");
    for (const [index, outcome] of (Array.isArray(value.constructive_gate?.outcomes) ? value.constructive_gate.outcomes : []).entries()) {
      if (!sameKeys(outcome, ["id", "meaning"]) || !text(outcome.meaning)) add(`$.constructive_gate.outcomes[${index}]`, "invalid-outcome");
    }
    if (!sameKeys(value.wake_seam, ["protocol", "mode", "carry_fields", "revalidate", "inherits_identity", "proves_continuity", "grants_authority", "proves_currentness", "writes_wake", "writes_agenttool"]) ||
        value.wake_seam?.protocol !== "kingdom.wake-reference-seam/0.1" || value.wake_seam?.mode !== "orientation-by-reference-not-continuity-proof" ||
        !Array.isArray(value.wake_seam?.carry_fields) || value.wake_seam.carry_fields.length !== 11 ||
        !Array.isArray(value.wake_seam?.revalidate) || value.wake_seam.revalidate.length !== 7 ||
        ["inherits_identity", "proves_continuity", "grants_authority", "proves_currentness", "writes_wake", "writes_agenttool"].some((key) => value.wake_seam?.[key] !== false)) add("$.wake_seam", "wake-boundary-mismatch");

    if (!exactIds(value.sources, SOURCE_IDS)) add("$.sources", "source-order-or-membership-mismatch");
    for (const [index, source] of (Array.isArray(value.sources) ? value.sources : []).entries()) {
      if (!sameKeys(source, ["id", "title", "source_kind", "published_on", "observed_on", "url", "doi", "authority_note"]) ||
          !ID.test(source.id) || !text(source.title) || !ID.test(source.source_kind) || typeof source.published_on !== "string" ||
          source.observed_on !== "2026-08-13" || source.url !== SOURCE_URLS[index] || !(source.doi === null || text(source.doi)) ||
          !text(source.authority_note)) add(`$.sources[${index}]`, "invalid-source");
    }
    if (!sameKeys(value.boundaries, Object.keys(EXPECTED_BOUNDARIES))) add("$.boundaries", "boundary-set-mismatch");
    for (const [key, expected] of Object.entries(EXPECTED_BOUNDARIES)) if (value.boundaries?.[key] !== expected) add(`$.boundaries.${key}`, "boundary-mismatch");

    if (!sameKeys(value.integrity, ["algorithm", "digest"]) || value.integrity?.algorithm !== INTEGRITY_ALGORITHM ||
        typeof value.integrity?.digest !== "string" || !DIGEST.test(value.integrity.digest)) add("$.integrity", "invalid-integrity-envelope");
    else if (value.integrity.digest !== RARE_PATHWAY_DIGEST) add("$.integrity.digest", "reviewed-digest-mismatch");
    else if (!issues.length && value.integrity.digest !== rarePathwayDigest(value)) add("$.integrity.digest", "digest-mismatch");
  } catch {
    add("$", "verifier-unavailable-for-value");
  }
  return issues;
}

export function loadRarePathwayChallenge(path = RARE_PATHWAY_PATH): Record<string, any> {
  const value = readUnchecked(path);
  const issues = verifyRarePathwayChallenge(value);
  if (issues.length) fail(`rare-pathway challenge refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  return value as Record<string, any>;
}

export function rarePathwayPublicDiscovery(value = loadRarePathwayChallenge()): Record<string, any> {
  return {
    protocol: value.protocol,
    challenge_id: value.challenge_id,
    title: value.title,
    compiled_on: value.compiled_on,
    evidence_through: value.evidence_through,
    url: RARE_PATHWAY_URL,
    schema: RARE_PATHWAY_SCHEMA_URL,
    guide: RARE_PATHWAY_DOCUMENT_URL,
    cli: "kingdom rare-pathway",
    binding: {
      case_id: value.binding.case_id,
      semantic_digest: value.binding.semantic_digest,
      relation: value.binding.relation,
    },
    models: value.models.map((model: any) => model.id),
    constructive_outcomes: value.constructive_gate.outcomes.map((outcome: any) => outcome.id),
    integrity: value.integrity,
    boundary: {
      public_surface_read_only: true,
      examples_hypothetical: true,
      ritonavir_rate_fit: false,
      literal_extinction_established: false,
      experiment_authority: false,
      wet_lab_protocol: false,
      manufacturing_authority: false,
      medical_authority: false,
      motive_inference: false,
      person_score: false,
      writes_wake: false,
      writes_agenttool: false,
      automatic_action: false,
    },
  };
}

function renderNumber(value: number): string { return Number(value.toPrecision(15)).toString(); }
function printJson(value: unknown): void {
  const encoded = JSON.stringify(value, (_key, item) => {
    if (typeof item === "number" && !Number.isFinite(item)) fail("JSON output contains a non-finite number");
    return item;
  }, 2);
  process.stdout.write(`${encoded}\n`);
}
function overview(value: Record<string, any>): string {
  return `${value.title}\n\nNot observed is not impossible. Separate possible, accessible, occurred, and detected.\n\n${value.models.length} model cards · ${value.question_ladder.length} questions · BUILD / PLAY / REVISE / STOP (artifacts, never people)\nBound ritonavir history: ${value.binding.semantic_digest}\nEvidence through ${value.evidence_through} · ${value.integrity.digest}\n\nNo fitted ritonavir rates, lab recipe, manufacturing or medical authority, motive inference, person score, WAKE write, or AgentTool write.\n`;
}
function usage(): never {
  process.stderr.write(
    "usage: rare-pathway.ts [overview|models|examples|questions|gate|wake|sources] [--json]\n" +
    "       rare-pathway.ts race TARGET_RATE COMPETITOR_RATE HORIZON [--json]\n" +
    "       rare-pathway.ts absence EXPOSURE CONFIDENCE [--json]\n" +
    "       rare-pathway.ts winner-bound BATCH_COUNT CONFIDENCE [--json]\n" +
    "       rare-pathway.ts restore COMPETITOR_RATE HORIZON TARGET_PROBABILITY [--json]\n" +
    "       rare-pathway.ts verify [FILE] [--json]\n",
  );
  process.exit(2);
}

export async function runRarePathwayCli(args = process.argv.slice(2)): Promise<void> {
  const copy = [...args];
  const jsonIndex = copy.indexOf("--json");
  const json = jsonIndex >= 0;
  if (json) copy.splice(jsonIndex, 1);
  if (copy.some((arg) => arg.startsWith("-"))) usage();
  const command = copy.shift() ?? "overview";

  if (command === "verify") {
    if (copy.length > 1) usage();
    let issues: RarePathwayIssue[];
    try { issues = verifyRarePathwayChallenge(readUnchecked(copy[0] ? resolve(copy[0]) : RARE_PATHWAY_PATH)); }
    catch (error) { issues = [{ field: "$", code: error instanceof Error ? error.message : "read-refused" }]; }
    if (json) printJson({ valid: issues.length === 0, issues });
    else if (!issues.length) process.stdout.write("The Vanishing Path: valid identity, bindings, models, examples, constructive gate, WAKE seam, sources, boundaries, and semantic digest; JSON Schema not checked\n");
    else issues.forEach((issue) => process.stderr.write(`${issue.field} ${issue.code}\n`));
    process.exit(issues.length ? 1 : 0);
  }

  if (command === "race") {
    if (copy.length !== 3) usage();
    const result = competingRace(parseNumber(copy[0], "target rate"), parseNumber(copy[1], "competitor rate"), parseNumber(copy[2], "horizon"));
    if (json) printJson({ model: "constant-two-path-race", ...result, assumptions: ["constant cause-specific rates", "first classified event", "declared matching time units"], authority: "abstract calculation only" });
    else process.stdout.write(`no event: ${renderNumber(result.no_event)}\ntarget first: ${renderNumber(result.target_first)}\ncompetitor first: ${renderNumber(result.competitor_first)}\ntarget | event: ${result.target_given_event === null ? "undefined (both rates zero)" : renderNumber(result.target_given_event)}\nabstract calculation only; not a ritonavir fit or intervention\n`);
    return;
  }
  if (command === "absence") {
    if (copy.length !== 2) usage();
    const exposure = parseNumber(copy[0], "exposure");
    const confidence = parseNumber(copy[1], "confidence");
    const upperRate = zeroEventUpperRate(exposure, confidence);
    const result = { model: "zero-event-upper-bound", zero_events: true, exposure, confidence, upper_rate: upperRate, assumptions: ["homogeneous Poisson target process", "fixed or target-independent at-risk exposure", "complete detection and classification"], does_not_establish: ["zero rate", "literal extinction", "mechanism"] };
    if (json) printJson(result);
    else process.stdout.write(`upper rate: ${renderNumber(upperRate)} per exposure unit\nzero detections do not prove a zero rate; the Poisson, exposure, censoring, and detection assumptions carry the result\n`);
    return;
  }
  if (command === "winner-bound") {
    if (copy.length !== 2) usage();
    const batches = parseNumber(copy[0], "batch count");
    const confidence = parseNumber(copy[1], "confidence");
    const upperProbability = zeroWinnerUpperProbability(batches, confidence);
    const result = { model: "zero-winner-binomial-bound", zero_target_winners: true, independent_batches: batches, confidence, upper_target_win_probability: upperProbability, does_not_establish: ["a microscopic target nucleation rate", "literal extinction", "latent-time independence"] };
    if (json) printJson(result);
    else process.stdout.write(`upper target-win probability: ${renderNumber(upperProbability)}\nthis bounds a batch-level winner probability, not a microscopic nucleation rate\n`);
    return;
  }
  if (command === "restore") {
    if (copy.length !== 3) usage();
    const competitorRate = parseNumber(copy[0], "competitor rate");
    const horizon = parseNumber(copy[1], "horizon");
    const targetProbability = parseNumber(copy[2], "target probability");
    const rate = requiredTargetRate(competitorRate, horizon, targetProbability);
    const result = { model: "minimum-target-rate", competitor_rate: competitorRate, horizon, target_probability: targetProbability, minimum_target_rate: rate, achieved_probability: competingRace(rate, competitorRate, horizon).target_first, boundary: "abstract threshold only; not a solvent, temperature, seed, process, formulation, manufacturing, medical, or regulatory instruction" };
    if (json) printJson(result);
    else process.stdout.write(`minimum abstract target rate: ${renderNumber(rate)}\nachieved target-first probability: ${renderNumber(result.achieved_probability)}\n${result.boundary}\n`);
    return;
  }

  if (copy.length) usage();
  const value = loadRarePathwayChallenge();
  const selections: Record<string, unknown> = {
    models: value.models,
    examples: value.worked_examples,
    questions: value.question_ladder,
    gate: value.constructive_gate,
    wake: value.wake_seam,
    sources: value.sources,
  };
  if (command === "overview") process.stdout.write(json ? `${JSON.stringify(value)}\n` : overview(value));
  else if (Object.hasOwn(selections, command)) printJson({ challenge_id: value.challenge_id, [command]: selections[command] });
  else usage();
}

if (import.meta.main) {
  try { await runRarePathwayCli(); }
  catch (error) {
    process.stderr.write(`rare-pathway refused: ${error instanceof Error ? error.message : "invalid input"}\n`);
    process.exit(1);
  }
}
