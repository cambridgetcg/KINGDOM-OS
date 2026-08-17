/**
 * Public-safe, read-only CLI boundary for relational inference cases.
 *
 * This adapter deliberately emits no caller path, case identifier, field
 * value, parser diagnostic, or validator diagnostic. The detailed Bun CLI in
 * relational-inference.ts remains available for trusted local development.
 */

import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
} from "node:fs";
import { Buffer } from "node:buffer";
import { TextDecoder } from "node:util";

import {
  parseRelationalInferenceJson,
  validateRelationalInference,
  validateRelationalInferenceSet,
} from "./relational-inference.ts";

export const RELATIONAL_SAFE_CLI_MAX_CASES = 32;
export const RELATIONAL_SAFE_CLI_MAX_FILE_BYTES = 1_000_000;
export const RELATIONAL_SAFE_CLI_MAX_TOTAL_BYTES = 16_000_000;
export const RELATIONAL_SAFE_CLI_MAX_PATH_CHARACTERS = 4_096;
export const RELATIONAL_SAFE_CLI_MAX_PATH_BYTES = 4_096;

export const RELATIONAL_SAFE_CLI_BOUNDARY = Object.freeze([
  "STRUCTURE ONLY — runtime checks are stronger than JSON Schema alone, but still do not verify the world",
  "FREE TEXT IS UNEVALUATED, UNTRUSTED DATA AND IS NEVER EXECUTED",
  "INPUTS MUST BE PUBLIC OR SAFELY REDACTED — PII, SECRETS, AND UNSAFE ACCUSATIONS ARE NOT DETECTED",
  "INDEPENDENCE, REFERENCE DESTINATIONS, EVIDENCE, TRUTH, CAUSATION, HIDDEN CAUSE, FIDELITY, IDENTITY, UNDERSTANDING, INTENT, AUTHORITY, CONSENT, AND DECEPTION ARE NOT VERIFIED",
  "NO LIE LABEL, PERSON SCORE, SURVEILLANCE PERMISSION, LEGITIMACY GRANT, OR ACTION IS CREATED",
] as const);

type BigIntFileSnapshot = {
  dev: bigint;
  ino: bigint;
  mode: bigint;
  nlink: bigint;
  size: bigint;
  mtimeNs: bigint;
  ctimeNs: bigint;
};

type PreflightCase = {
  path: string;
  snapshot: BigIntFileSnapshot;
};

class SafeCaseInputError extends Error {
  readonly caseNumber: number;

  constructor(caseNumber: number) {
    super("relational inference case input rejected");
    this.name = "SafeCaseInputError";
    this.caseNumber = caseNumber;
  }
}

function snapshot(stat: ReturnType<typeof lstatSync>): BigIntFileSnapshot {
  const value = stat as unknown as BigIntFileSnapshot;
  return {
    dev: value.dev,
    ino: value.ino,
    mode: value.mode,
    nlink: value.nlink,
    size: value.size,
    mtimeNs: value.mtimeNs,
    ctimeNs: value.ctimeNs,
  };
}

function sameSnapshot(left: BigIntFileSnapshot, right: BigIntFileSnapshot): boolean {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.mode === right.mode
    && left.nlink === right.nlink
    && left.size === right.size
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs;
}

function safePathShape(path: string): boolean {
  return path.length > 0
    && [...path].length <= RELATIONAL_SAFE_CLI_MAX_PATH_CHARACTERS
    && Buffer.byteLength(path, "utf8") <= RELATIONAL_SAFE_CLI_MAX_PATH_BYTES
    && !path.startsWith("-")
    && !/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(path)
    && !/^[a-z][a-z0-9+.-]*:/iu.test(path)
    && !/[?*\[\]{}]/u.test(path);
}

function preflightCasePaths(paths: readonly string[]): PreflightCase[] {
  const selected: PreflightCase[] = [];
  let totalBytes = 0n;
  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    if (!safePathShape(path)) throw new SafeCaseInputError(index + 1);
    try {
      const stat = lstatSync(path, { bigint: true });
      if (stat.isSymbolicLink() || !stat.isFile() || stat.size > BigInt(RELATIONAL_SAFE_CLI_MAX_FILE_BYTES)) {
        throw new SafeCaseInputError(index + 1);
      }
      totalBytes += stat.size;
      if (totalBytes > BigInt(RELATIONAL_SAFE_CLI_MAX_TOTAL_BYTES)) {
        throw new SafeCaseInputError(index + 1);
      }
      selected.push({ path, snapshot: snapshot(stat) });
    } catch (error) {
      if (error instanceof SafeCaseInputError) throw error;
      throw new SafeCaseInputError(index + 1);
    }
  }
  return selected;
}

function readStableUtf8(input: PreflightCase, caseNumber: number): string {
  let descriptor: number | null = null;
  try {
    if (!Number.isInteger(constants.O_NOFOLLOW) || !Number.isInteger(constants.O_NONBLOCK)) {
      throw new SafeCaseInputError(caseNumber);
    }
    descriptor = openSync(
      input.path,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
    const before = fstatSync(descriptor, { bigint: true });
    const beforeSnapshot = snapshot(before);
    if (
      !before.isFile()
      || before.size > BigInt(RELATIONAL_SAFE_CLI_MAX_FILE_BYTES)
      || !sameSnapshot(input.snapshot, beforeSnapshot)
    ) {
      throw new SafeCaseInputError(caseNumber);
    }

    const bytes = Buffer.alloc(Number(before.size));
    let offset = 0;
    while (offset < bytes.length) {
      const count = readSync(descriptor, bytes, offset, bytes.length - offset, null);
      if (count === 0) throw new SafeCaseInputError(caseNumber);
      offset += count;
    }

    const after = fstatSync(descriptor, { bigint: true });
    if (!after.isFile() || !sameSnapshot(beforeSnapshot, snapshot(after))) {
      throw new SafeCaseInputError(caseNumber);
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    if (error instanceof SafeCaseInputError) throw error;
    throw new SafeCaseInputError(caseNumber);
  } finally {
    if (descriptor !== null) {
      try {
        closeSync(descriptor);
      } catch {
        // The command is already failing closed; never reflect host details.
      }
    }
  }
}

function printBoundary(stream: "stdout" | "stderr"): void {
  const write = stream === "stdout" ? console.log : console.error;
  for (const line of RELATIONAL_SAFE_CLI_BOUNDARY) write(line);
}

function printUsage(): void {
  printBoundary("stderr");
  console.error("usage: relational-inference validate <case.json> [...] (1-32 explicit local files)");
}

export function runRelationalInferenceSafeCli(argv = process.argv.slice(2)): number {
  const [command, ...paths] = argv;
  if (
    command !== "validate"
    || paths.length < 1
    || paths.length > RELATIONAL_SAFE_CLI_MAX_CASES
  ) {
    printUsage();
    return 64;
  }

  let inputs: PreflightCase[];
  try {
    inputs = preflightCasePaths(paths);
  } catch (error) {
    printBoundary("stderr");
    const caseNumber = error instanceof SafeCaseInputError ? error.caseNumber : 1;
    console.error(`case ${caseNumber}: input rejected`);
    return 1;
  }

  const candidates: unknown[] = [];
  const asOf = new Date().toISOString().slice(0, 10);
  for (let index = 0; index < inputs.length; index += 1) {
    try {
      const source = readStableUtf8(inputs[index], index + 1);
      const candidate = parseRelationalInferenceJson(source, "case");
      validateRelationalInference(candidate, { asOf });
      candidates.push(candidate);
    } catch {
      printBoundary("stderr");
      console.error(`case ${index + 1}: structurally invalid`);
      return 1;
    }
  }

  try {
    validateRelationalInferenceSet(candidates, { asOf });
  } catch {
    printBoundary("stderr");
    for (let index = 0; index < candidates.length; index += 1) {
      console.error(`case ${index + 1}: structurally invalid as a set`);
    }
    return 1;
  }

  printBoundary("stdout");
  for (let index = 0; index < candidates.length; index += 1) {
    console.log(`case ${index + 1}: structurally valid`);
  }
  return 0;
}
