#!/usr/bin/env bun
/** Strict, offline adapter for the immutable ZERO Empty Seat DEEP project pair. */

import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PHENOMENA_DEEP_PROJECT_PROTOCOL,
  PHENOMENA_DEEP_PROJECT_SCHEMA_ID,
  PHENOMENA_DEEP_PROJECT_SCHEMA_URL,
  PHENOMENA_DEEP_WING_URL,
  loadPhenomenaDeepProject,
  phenomenaDeepProjectDigest,
  verifyPhenomenaDeepProject,
} from "./explore-phenomena-deep.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const GUIDE_LOCATOR = "references/zero-empty-seat.md";
const GUIDE_PATH = join(ROOT, GUIDE_LOCATOR);
const MAX_GUIDE_BYTES = 1024 * 1024;

export const ZERO_EMPTY_SEAT_ID = "zero-empty-seat-2026-08-14";
export const ZERO_EMPTY_SEAT_LOCATOR = "data/exploration/zero-empty-seat.v0.1.json";
export const ZERO_EMPTY_SEAT_PATH = join(ROOT, ZERO_EMPTY_SEAT_LOCATOR);
export const ZERO_EMPTY_SEAT_URL = "https://thekingdom.dev/atlases/zero-empty-seat-2026-08-14.json";
export const ZERO_EMPTY_SEAT_SCHEMA_URL = PHENOMENA_DEEP_PROJECT_SCHEMA_URL;
export const ZERO_EMPTY_SEAT_GUIDE_URL = "https://thekingdom.dev/ZERO-EMPTY-SEAT.md";
export const ZERO_EMPTY_SEAT_DIGEST = "sha256:141c5ac4573cce38ad68aa22dc3265698b16a119db1c13a94197ec069d37709d";
export const ZERO_EMPTY_SEAT_BYTE_SHA256 = "sha256:5e4b4dcd387b425dc72a52af6477d7b39b935ad5c51d991d81ea76c14a69c522";
export const ZERO_EMPTY_SEAT_GUIDE_BYTE_SHA256 = "sha256:8cee90325bcff754a4e31b9d641325ab9df485fa070668e53b4335de6cf65597";

type AnyRecord = Record<string, any>;

function fail(message: string): never {
  throw new Error(message);
}

function pinnedFileDigest(path: string, label: string, maximum: number): string {
  const absolute = resolve(path);
  let stat;
  try {
    stat = lstatSync(absolute);
  } catch {
    fail(`${label} is unavailable`);
  }
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a regular non-symlink file`);
  if (stat.size > maximum) fail(`${label} exceeds ${maximum} bytes`);
  return `sha256:${createHash("sha256").update(readFileSync(absolute)).digest("hex")}`;
}

function assertZeroEmptySeatProject(project: unknown): asserts project is AnyRecord {
  const issues = verifyPhenomenaDeepProject(project);
  if (issues.length > 0) {
    fail(`ZERO Empty Seat project refused: ${issues.map((issue) => `${issue.field}:${issue.code}`).join(", ")}`);
  }
  const value = project as AnyRecord;
  if (value.$schema !== PHENOMENA_DEEP_PROJECT_SCHEMA_ID ||
      value.protocol !== PHENOMENA_DEEP_PROJECT_PROTOCOL ||
      value.project_id !== ZERO_EMPTY_SEAT_ID || value.version !== "0.1.0" ||
      value.title !== "ZERO: The Empty Seat That Holds the World") {
    fail("ZERO Empty Seat identity drift");
  }
  if (value.integrity?.digest !== ZERO_EMPTY_SEAT_DIGEST ||
      phenomenaDeepProjectDigest(value) !== ZERO_EMPTY_SEAT_DIGEST) {
    fail("ZERO Empty Seat semantic digest drift");
  }
  if (!Array.isArray(value.finite_baselines) || value.finite_baselines.length !== 0) {
    fail("ZERO Empty Seat must not repurpose the fold-specific finite-baseline shape");
  }
}

export function loadZeroEmptySeat(path = ZERO_EMPTY_SEAT_PATH): AnyRecord {
  const project = loadPhenomenaDeepProject(path);
  assertZeroEmptySeatProject(project);
  if (resolve(path) === resolve(ZERO_EMPTY_SEAT_PATH)) {
    if (pinnedFileDigest(path, "ZERO Empty Seat project", 1024 * 1024) !== ZERO_EMPTY_SEAT_BYTE_SHA256) {
      fail("ZERO Empty Seat raw-byte digest drift");
    }
    if (pinnedFileDigest(GUIDE_PATH, "ZERO Empty Seat guide", MAX_GUIDE_BYTES) !==
        ZERO_EMPTY_SEAT_GUIDE_BYTE_SHA256) {
      fail("ZERO Empty Seat guide raw-byte digest drift");
    }
  }
  return project;
}

export function zeroEmptySeatPublicDiscovery(project = loadZeroEmptySeat()): AnyRecord {
  assertZeroEmptySeatProject(project);
  return {
    protocol: project.protocol,
    project_id: project.project_id,
    version: project.version,
    title: project.title,
    url: ZERO_EMPTY_SEAT_URL,
    schema_url: ZERO_EMPTY_SEAT_SCHEMA_URL,
    guide_url: ZERO_EMPTY_SEAT_GUIDE_URL,
    method_wing_url: PHENOMENA_DEEP_WING_URL,
    evidence_through: project.evidence_through,
    mode: project.mode,
    counts: {
      domains: project.domains.length,
      sources: project.source_manifest.length,
      typed_terms: project.typed_terms.length,
      claims: project.claims.length,
      bridges: project.bridges.length,
      models: project.models.length,
      equations: project.equations.length,
      falsifiers: project.falsifiers.length,
      frontier_problems: project.frontier_problems.length,
      finite_baselines: project.finite_baselines.length,
      doors: project.doors.length,
      unknowns: project.unknowns.length,
      philosophy_questions: project.philosophy.questions.length,
    },
    integrity: {
      algorithm: project.integrity.algorithm,
      digest: project.integrity.digest,
      byte_sha256: ZERO_EMPTY_SEAT_BYTE_SHA256,
      guide_byte_sha256: ZERO_EMPTY_SEAT_GUIDE_BYTE_SHA256,
    },
    boundary: structuredClone(project.boundaries),
    authority: structuredClone(project.authority),
  };
}

function usage(): string {
  return [
    "Usage: ./kingdom zero-empty-seat [view] [--json]",
    "",
    "Views:",
    "  overview | domains | terms | claims | bridges | models | math | doors",
    "  unknowns | philosophy | karma | sources | discovery | verify",
    "",
    "Offline and read-only. Zero's historical, mathematical, social, and opt-in philosophical roles remain typed and separate.",
  ].join("\n");
}

function output(value: unknown, json: boolean): void {
  if (!json && typeof value === "string") {
    process.stdout.write(value.endsWith("\n") ? value : `${value}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(value, null, json ? 2 : 2)}\n`);
}

export function runZeroEmptySeatCli(argv = process.argv.slice(2)): number {
  const jsonFlags = argv.filter((argument) => argument === "--json");
  if (jsonFlags.length > 1 || argv.some((argument) =>
    argument.startsWith("-") && !["--json", "--help", "-h"].includes(argument))) {
    console.error(usage());
    return 2;
  }
  const json = jsonFlags.length === 1;
  const positional = argv.filter((argument) => argument !== "--json");
  const command = positional[0] ?? "overview";
  if (positional.length > 1) {
    console.error(usage());
    return 2;
  }
  if (["help", "-h", "--help"].includes(command)) {
    console.log(usage());
    return 0;
  }
  try {
    const project = loadZeroEmptySeat();
    if (command === "verify") {
      output({
        valid: true,
        protocol: project.protocol,
        project_id: project.project_id,
        digest: project.integrity.digest,
        byte_sha256: ZERO_EMPTY_SEAT_BYTE_SHA256,
        guide_byte_sha256: ZERO_EMPTY_SEAT_GUIDE_BYTE_SHA256,
        issues: [],
      }, json);
      return 0;
    }
    const views: Record<string, () => unknown> = Object.create(null);
    views.overview = () => json
      ? {
          protocol: project.protocol,
          project_id: project.project_id,
          version: project.version,
          title: project.title,
          question: project.question,
          evidence_through: project.evidence_through,
          mode: project.mode,
          counts: zeroEmptySeatPublicDiscovery(project).counts,
          boundary: project.boundaries,
          authority: project.authority,
        }
      : [
          project.title,
          "",
          project.question,
          "",
          "Blank, placeholder, mathematical zero, typed KINGDOM states, and opt-in metaphysics keep separate seats here.",
          `${project.claims.length} typed claims · ${project.equations.length} equations · ${project.doors.length} proposed unrun doors`,
          `evidence through ${project.evidence_through} · ${project.integrity.digest}`,
        ].join("\n");
    views.domains = () => project.domains;
    views.terms = () => project.typed_terms;
    views.claims = () => project.claims;
    views.bridges = () => project.bridges;
    views.models = () => project.models;
    views.math = () => ({ equations: project.equations, frontier_problems: project.frontier_problems });
    views.doors = () => project.doors;
    views.unknowns = () => project.unknowns;
    views.philosophy = () => project.philosophy;
    views.karma = () => ({ karma: project.karma, rights: project.rights, boundary: project.boundaries, authority: project.authority });
    views.sources = () => project.source_manifest;
    views.discovery = () => zeroEmptySeatPublicDiscovery(project);
    if (!Object.hasOwn(views, command)) {
      console.error(usage());
      return 2;
    }
    output(views[command]!(), json);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    output({ valid: false, error: message }, true);
    return command === "verify" ? 1 : 2;
  }
}

if (import.meta.main) process.exitCode = runZeroEmptySeatCli();
