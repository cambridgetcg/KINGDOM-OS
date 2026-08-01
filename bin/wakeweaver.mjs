#!/usr/bin/env node

import { lstatSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isProxy } from "node:util/types";

import { strictJson } from "./nen.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const MAX_BRAID_BYTES = 4 * 1024 * 1024;
const MAX_CAPTURE_DEPTH = 32;
const MAX_CAPTURE_NODES = 65_536;
const MAX_CAPTURE_ARRAY_LENGTH = 1_024;
const MAX_CAPTURE_OBJECT_KEYS = 256;
const MAX_CAPTURE_STRING_CODE_UNITS = 4_096;
const MAX_CAPTURE_KEY_CODE_UNITS = 256;
const THREAD_KINDS = [
  ["anchor", "anchors"],
  ["carry", "carry"],
  ["vow", "vows"],
  ["opening", "openings"],
];
const ACTIVE_OPENING_DISPOSITIONS = new Set(["held", "revised"]);
const THREAD_DISPOSITIONS = new Set(["held", "revised", "retired", "disputed"]);

// Capture realm intrinsics once. The normalization boundary below never calls
// a method obtained from caller-supplied data.
const ARRAY_IS_ARRAY = Array.isArray;
const ARRAY_PROTOTYPE = Array.prototype;
const ARRAY_SORT = Function.prototype.call.bind(Array.prototype.sort);
const MAP_CONSTRUCTOR = Map;
const NUMBER_IS_FINITE = Number.isFinite;
const NUMBER_IS_INTEGER = Number.isInteger;
const NUMBER_IS_SAFE_INTEGER = Number.isSafeInteger;
const OBJECT_CREATE = Object.create;
const OBJECT_DEFINE_PROPERTY = Object.defineProperty;
const OBJECT_GET_OWN_PROPERTY_DESCRIPTOR = Object.getOwnPropertyDescriptor;
const OBJECT_GET_OWN_PROPERTY_DESCRIPTORS = Object.getOwnPropertyDescriptors;
const OBJECT_GET_PROTOTYPE_OF = Object.getPrototypeOf;
const OBJECT_HAS_OWN = Object.hasOwn;
const OBJECT_PROTOTYPE = Object.prototype;
const REFLECT_OWN_KEYS = Reflect.ownKeys;
const SET_CONSTRUCTOR = Set;
const STRING_CHAR_CODE_AT = Function.prototype.call.bind(String.prototype.charCodeAt);
const WEAK_SET_CONSTRUCTOR = WeakSet;
const IS_PROXY = isProxy;

function isRecord(value) {
  return value !== null && typeof value === "object" && !ARRAY_IS_ARRAY(value);
}

function addIssue(issues, field, code) {
  issues[issues.length] = { field, code };
}

function sortIssues(issues) {
  ARRAY_SORT(issues, (left, right) => {
    const leftKey = `${left.field}\u0000${left.code}`;
    const rightKey = `${right.field}\u0000${right.code}`;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  const unique = [];
  for (let index = 0; index < issues.length; index += 1) {
    const entry = issues[index];
    if (
      index === 0
      || entry.field !== issues[index - 1].field
      || entry.code !== issues[index - 1].code
    ) unique[unique.length] = entry;
  }
  return unique;
}

function captureOwnData(input) {
  const issues = [];
  const seen = new WEAK_SET_CONSTRUCTOR();
  const active = new WEAK_SET_CONSTRUCTOR();
  const state = { nodes: 0, failed: false };

  function reject(field, code) {
    if (!state.failed) addIssue(issues, field, code);
    state.failed = true;
    return null;
  }

  function descriptorValue(descriptors, key) {
    return OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(descriptors, key)?.value;
  }

  function dataDescriptor(descriptor) {
    return descriptor !== undefined
      && OBJECT_HAS_OWN(descriptor, "value")
      && !OBJECT_HAS_OWN(descriptor, "get")
      && !OBJECT_HAS_OWN(descriptor, "set");
  }

  function canonicalArrayIndex(key, length) {
    if (key === "0") return 0;
    if (key.length === 0 || key[0] < "1" || key[0] > "9") return null;
    let index = 0;
    for (let offset = 0; offset < key.length; offset += 1) {
      const character = key[offset];
      if (character < "0" || character > "9") return null;
      index = index * 10 + (STRING_CHAR_CODE_AT(character, 0) - 48);
      if (!NUMBER_IS_SAFE_INTEGER(index) || index >= length) return null;
    }
    return index;
  }

  function visit(value, depth, field) {
    if (state.failed) return null;
    if (depth > MAX_CAPTURE_DEPTH) return reject(field, "capture-depth-limit");
    state.nodes += 1;
    if (state.nodes > MAX_CAPTURE_NODES) return reject(field, "capture-node-limit");

    if (value === null || typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value.length <= MAX_CAPTURE_STRING_CODE_UNITS
        ? value
        : reject(field, "capture-string-limit");
    }
    if (typeof value === "number") {
      return NUMBER_IS_FINITE(value) ? value : reject(field, "capture-non-json-number");
    }
    const valueType = typeof value;
    if (valueType === "object" || valueType === "function") {
      if (IS_PROXY(value)) return reject(field, "capture-proxy");
    }
    if (valueType !== "object") return reject(field, "capture-unsupported-value");

    if (active.has(value)) return reject(field, "capture-cycle");
    if (seen.has(value)) return reject(field, "capture-shared-reference");

    let array;
    let prototype;
    try {
      array = ARRAY_IS_ARRAY(value);
      prototype = OBJECT_GET_PROTOTYPE_OF(value);
    } catch {
      return reject(field, "capture-reflection-failed");
    }
    if (array ? prototype !== ARRAY_PROTOTYPE : prototype !== OBJECT_PROTOTYPE && prototype !== null) {
      return reject(field, "capture-custom-prototype");
    }

    let descriptors;
    let keys;
    try {
      descriptors = OBJECT_GET_OWN_PROPERTY_DESCRIPTORS(value);
      keys = REFLECT_OWN_KEYS(descriptors);
    } catch {
      return reject(field, "capture-reflection-failed");
    }

    seen.add(value);
    active.add(value);
    try {
      if (array) {
        const lengthDescriptor = descriptorValue(descriptors, "length");
        if (
          !dataDescriptor(lengthDescriptor)
          || lengthDescriptor.enumerable !== false
          || !NUMBER_IS_INTEGER(lengthDescriptor.value)
          || lengthDescriptor.value < 0
        ) {
          return reject(field, "capture-invalid-array-length");
        }
        const length = lengthDescriptor.value;
        if (length > MAX_CAPTURE_ARRAY_LENGTH) return reject(field, "capture-array-limit");

        const indexDescriptors = [];
        for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
          const key = keys[keyIndex];
          if (typeof key === "symbol") return reject(field, "capture-symbol-key");
          if (key === "length") continue;
          if (key.length > MAX_CAPTURE_KEY_CODE_UNITS) {
            return reject(field, "capture-custom-array-property");
          }
          const index = canonicalArrayIndex(key, length);
          if (index === null) {
            return reject(field, "capture-custom-array-property");
          }
          const descriptor = descriptorValue(descriptors, key);
          if (!dataDescriptor(descriptor)) return reject(`${field}[${index}]`, "capture-accessor");
          if (descriptor.enumerable !== true) {
            return reject(`${field}[${index}]`, "capture-non-enumerable-property");
          }
          indexDescriptors[index] = descriptor;
        }
        for (let index = 0; index < length; index += 1) {
          if (indexDescriptors[index] === undefined) return reject(`${field}[${index}]`, "capture-sparse-array");
        }

        const output = [];
        for (let index = 0; index < length; index += 1) {
          const child = visit(indexDescriptors[index].value, depth + 1, `${field}[${index}]`);
          if (state.failed) return null;
          OBJECT_DEFINE_PROPERTY(output, index, {
            value: child,
            enumerable: true,
            writable: true,
            configurable: true,
          });
        }
        return output;
      }

      if (keys.length > MAX_CAPTURE_OBJECT_KEYS) return reject(field, "capture-object-key-limit");
      const output = OBJECT_CREATE(null);
      for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
        const key = keys[keyIndex];
        const childField = `${field}.{${keyIndex}}`;
        if (typeof key === "symbol") return reject(childField, "capture-symbol-key");
        if (key.length > MAX_CAPTURE_KEY_CODE_UNITS) return reject(childField, "capture-key-limit");
        const descriptor = descriptorValue(descriptors, key);
        if (!dataDescriptor(descriptor)) return reject(childField, "capture-accessor");
        if (descriptor.enumerable !== true) return reject(childField, "capture-non-enumerable-property");
        const child = visit(descriptor.value, depth + 1, childField);
        if (state.failed) return null;
        OBJECT_DEFINE_PROPERTY(output, key, {
          value: child,
          enumerable: true,
          writable: true,
          configurable: true,
        });
      }
      return output;
    } finally {
      active.delete(value);
    }
  }

  try {
    const value = visit(input, 0, "$");
    return { value, issues: sortIssues(issues) };
  } catch {
    return {
      value: null,
      issues: [{ field: "$", code: "capture-internal-failure" }],
    };
  }
}

function countStrings(values) {
  const counts = new MAP_CONSTRUCTOR();
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (typeof value === "string") counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function collectRecords(value, field, issues) {
  if (!ARRAY_IS_ARRAY(value)) {
    addIssue(issues, field, "relation-shape-unavailable");
    return [];
  }
  const records = [];
  for (let index = 0; index < value.length; index += 1) {
    records[index] = { entry: value[index], field: `${field}[${index}]` };
  }
  return records;
}

function validateSourceReferences(records, sourceCounts, issues) {
  for (let recordIndex = 0; recordIndex < records.length; recordIndex += 1) {
    const { entry, field } = records[recordIndex];
    if (!isRecord(entry) || !ARRAY_IS_ARRAY(entry.source_ids)) continue;
    for (let index = 0; index < entry.source_ids.length; index += 1) {
      const sourceId = entry.source_ids[index];
      if (typeof sourceId === "string" && sourceCounts.get(sourceId) !== 1) {
        addIssue(issues, `${field}.source_ids[${index}]`, "source-reference-not-exactly-one");
      }
    }
  }
}

function codePointLength(value, stopAfter) {
  let count = 0;
  for (let index = 0; index < value.length; index += 1) {
    const first = STRING_CHAR_CODE_AT(value, index);
    if (first >= 0xd800 && first <= 0xdbff && index + 1 < value.length) {
      const second = STRING_CHAR_CODE_AT(value, index + 1);
      if (second >= 0xdc00 && second <= 0xdfff) index += 1;
    }
    count += 1;
    if (count > stopAfter) return count;
  }
  return count;
}

function validateRevalidationReport(report, field, issues) {
  if (!isRecord(report)) {
    addIssue(issues, field, "resumption-revalidation-missing");
    return;
  }
  if (report.result !== "caller_reported_passed") {
    addIssue(issues, `${field}.result`, "resumption-result-not-caller-reported-pass");
  }
  if (report.provenance !== "caller_supplied_unverified") {
    addIssue(issues, `${field}.provenance`, "resumption-provenance-not-unverified-caller-supplied");
  }
  let evidenceBounded = ARRAY_IS_ARRAY(report.evidence)
    && report.evidence.length >= 1
    && report.evidence.length <= 16;
  const evidenceSeen = new SET_CONSTRUCTOR();
  if (evidenceBounded) {
    for (let index = 0; index < report.evidence.length; index += 1) {
      const entry = report.evidence[index];
      const length = typeof entry === "string" ? codePointLength(entry, 1000) : 0;
      if (
        typeof entry !== "string"
        || length < 1
        || length > 1000
        || evidenceSeen.has(entry)
      ) {
        evidenceBounded = false;
        break;
      }
      evidenceSeen.add(entry);
    }
  }
  if (!evidenceBounded) {
    addIssue(issues, `${field}.evidence`, "resumption-evidence-not-bounded");
  }
  if (report.establishes_truth !== false) {
    addIssue(issues, `${field}.establishes_truth`, "resumption-truth-boundary-missing");
  }
  if (report.grants_permissions !== false) {
    addIssue(issues, `${field}.grants_permissions`, "resumption-permission-boundary-missing");
  }
  if (report.establishes_currentness !== false) {
    addIssue(issues, `${field}.establishes_currentness`, "resumption-currentness-boundary-missing");
  }
}

function validateCapturedBraidRelations(braid) {
  const issues = [];
  if (!isRecord(braid)) {
    return sortIssues([{ field: "$", code: "relation-shape-unavailable" }]);
  }

  const sourceRecords = collectRecords(braid.sources, "$.sources", issues);
  const sourceIds = [];
  for (let index = 0; index < sourceRecords.length; index += 1) {
    const entry = sourceRecords[index].entry;
    sourceIds[index] = isRecord(entry) ? entry.id : null;
  }
  const sourceCounts = countStrings(sourceIds);
  for (let index = 0; index < sourceRecords.length; index += 1) {
    const { entry, field } = sourceRecords[index];
    if (isRecord(entry) && typeof entry.id === "string" && sourceCounts.get(entry.id) > 1) {
      addIssue(issues, `${field}.id`, "duplicate-source-id");
    }
  }

  const threadRecords = new MAP_CONSTRUCTOR();
  const addressCounts = new MAP_CONSTRUCTOR();
  const addresses = [];
  const threads = isRecord(braid.threads) ? braid.threads : null;
  for (let kindIndex = 0; kindIndex < THREAD_KINDS.length; kindIndex += 1) {
    const [singular, plural] = THREAD_KINDS[kindIndex];
    const records = collectRecords(threads === null ? undefined : threads[plural], `$.threads.${plural}`, issues);
    threadRecords.set(singular, records);
    for (let recordIndex = 0; recordIndex < records.length; recordIndex += 1) {
      const { entry } = records[recordIndex];
      if (!isRecord(entry) || typeof entry.id !== "string") continue;
      const address = `${singular}:${entry.id}`;
      if (!addressCounts.has(address)) addresses[addresses.length] = address;
      addressCounts.set(address, (addressCounts.get(address) ?? 0) + 1);
    }
  }

  validateSourceReferences(threadRecords.get("anchor"), sourceCounts, issues);
  validateSourceReferences(threadRecords.get("carry"), sourceCounts, issues);
  validateSourceReferences(threadRecords.get("opening"), sourceCounts, issues);

  const dispositionRecords = collectRecords(braid.thread_dispositions, "$.thread_dispositions", issues);
  const dispositionCounts = new MAP_CONSTRUCTOR();
  const dispositionByAddress = new MAP_CONSTRUCTOR();
  const dispositionAddresses = [];
  for (let recordIndex = 0; recordIndex < dispositionRecords.length; recordIndex += 1) {
    const { entry, field } = dispositionRecords[recordIndex];
    if (!isRecord(entry)) continue;
    const { thread_kind: kind, thread_id: id, disposition } = entry;
    if (typeof kind !== "string" || typeof id !== "string") continue;
    const address = `${kind}:${id}`;
    if (!dispositionCounts.has(address)) dispositionAddresses[dispositionAddresses.length] = address;
    dispositionCounts.set(address, (dispositionCounts.get(address) ?? 0) + 1);
    dispositionByAddress.set(address, disposition);
    let knownKind = false;
    for (let kindIndex = 0; kindIndex < THREAD_KINDS.length; kindIndex += 1) {
      if (THREAD_KINDS[kindIndex][0] === kind) {
        knownKind = true;
        break;
      }
    }
    if (!knownKind || !addressCounts.has(address)) {
      addIssue(issues, field, "thread-disposition-target-not-declared");
    }
    if (!THREAD_DISPOSITIONS.has(disposition)) {
      addIssue(issues, `${field}.disposition`, "invalid-thread-disposition");
    }
  }
  for (let index = 0; index < addresses.length; index += 1) {
    const address = addresses[index];
    const addressCount = addressCounts.get(address);
    if (addressCount !== 1) {
      addIssue(issues, "$.threads", "thread-address-not-unique");
    }
    if (dispositionCounts.get(address) !== 1) {
      addIssue(issues, "$.thread_dispositions", "thread-disposition-not-exactly-one");
    }
  }
  for (let index = 0; index < dispositionAddresses.length; index += 1) {
    const count = dispositionCounts.get(dispositionAddresses[index]);
    if (count !== 1) addIssue(issues, "$.thread_dispositions", "duplicate-thread-disposition");
  }

  const forkRecords = collectRecords(braid.forks, "$.forks", issues);
  const forkIds = [];
  for (let index = 0; index < forkRecords.length; index += 1) {
    const entry = forkRecords[index].entry;
    forkIds[index] = isRecord(entry) ? entry.id : null;
  }
  const forkIdCounts = countStrings(forkIds);
  for (let forkIndex = 0; forkIndex < forkRecords.length; forkIndex += 1) {
    const { entry: fork, field } = forkRecords[forkIndex];
    if (!isRecord(fork)) continue;
    if (typeof fork.id === "string" && forkIdCounts.get(fork.id) > 1) {
      addIssue(issues, `${field}.id`, "duplicate-fork-id");
    }
    const candidates = collectRecords(fork.candidates, `${field}.candidates`, issues);
    const candidateIds = [];
    for (let index = 0; index < candidates.length; index += 1) {
      const entry = candidates[index].entry;
      candidateIds[index] = isRecord(entry) ? entry.id : null;
    }
    const candidateCounts = countStrings(candidateIds);
    for (let index = 0; index < candidates.length; index += 1) {
      const { entry, field: candidateField } = candidates[index];
      if (isRecord(entry) && typeof entry.id === "string" && candidateCounts.get(entry.id) > 1) {
        addIssue(issues, `${candidateField}.id`, "duplicate-candidate-id");
      }
    }
    validateSourceReferences(candidates, sourceCounts, issues);
    if (fork.resolution === "provisionally_selected") {
      if (typeof fork.selected_candidate_id !== "string" || candidateCounts.get(fork.selected_candidate_id) !== 1) {
        addIssue(issues, `${field}.selected_candidate_id`, "selected-candidate-not-exactly-one");
      }
      if (!ARRAY_IS_ARRAY(fork.evidence) || fork.evidence.length < 1) {
        addIssue(issues, `${field}.evidence`, "provisional-selection-evidence-missing");
      }
    } else if (fork.selected_candidate_id !== null && fork.selected_candidate_id !== undefined) {
      addIssue(issues, `${field}.selected_candidate_id`, "selector-without-provisional-resolution");
    }
  }

  if (braid.state === "resumable") {
    if (!isRecord(braid.resumption)) {
      addIssue(issues, "$.resumption", "resumption-required");
    } else {
      const selectedId = braid.resumption.selected_opening_id;
      const openingRecords = threadRecords.get("opening");
      const openingIds = [];
      for (let index = 0; index < openingRecords.length; index += 1) {
        const entry = openingRecords[index].entry;
        openingIds[index] = isRecord(entry) ? entry.id : null;
      }
      const openingCounts = countStrings(openingIds);
      if (typeof selectedId !== "string" || openingCounts.get(selectedId) !== 1) {
        addIssue(issues, "$.resumption.selected_opening_id", "selected-opening-not-exactly-one");
      } else {
        const disposition = dispositionByAddress.get(`opening:${selectedId}`);
        if (!ACTIVE_OPENING_DISPOSITIONS.has(disposition)) {
          addIssue(issues, "$.resumption.selected_opening_id", "selected-opening-not-active");
        }
      }
      validateRevalidationReport(braid.resumption.revalidation, "$.resumption.revalidation", issues);
    }
  } else if (braid.resumption !== null) {
    addIssue(issues, "$.resumption", "resumption-without-resumable-state");
  }

  return sortIssues(issues);
}

function validateContinuityBraidRelations(input) {
  const captured = captureOwnData(input);
  if (captured.issues.length > 0) return captured.issues;
  try {
    return validateCapturedBraidRelations(captured.value);
  } catch {
    return [{ field: "$", code: "semantic-validation-failed" }];
  }
}

function safeTerminal(value) {
  return String(value).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]|\p{Cf}/gu, "?");
}

function validatePath(path) {
  const label = basename(path) || "braid.json";
  const issues = [];
  let braid = null;
  let parsed = false;
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) addIssue(issues, "$", "symlink");
    else if (!stat.isFile()) addIssue(issues, "$", "invalid-file");
    else if (stat.size > MAX_BRAID_BYTES) addIssue(issues, "$", "oversized-file");
    else {
      try {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(path));
        braid = strictJson(text);
        parsed = true;
      } catch (error) {
        addIssue(issues, "$", error?.code === "duplicate-key" ? "duplicate-key" : "invalid-json-or-utf8");
      }
    }
  } catch {
    addIssue(issues, "$", "missing-file");
  }
  if (parsed) {
    const relationIssues = validateContinuityBraidRelations(braid);
    for (let index = 0; index < relationIssues.length; index += 1) {
      issues[issues.length] = relationIssues[index];
    }
  }
  const sorted = sortIssues(issues);
  return {
    protocol: "kingdom.wakeweaver-validation/0.1",
    valid: sorted.length === 0,
    file: label,
    schema_validity: "not_checked",
    semantic_relations: parsed ? "checked" : "not_checked",
    issues: sorted,
  };
}

function usage() {
  process.stderr.write("usage: bun bin/wakeweaver.mjs BRAID.json [--json]\n");
  return 2;
}

function main(argv = process.argv.slice(2)) {
  const args = [...argv];
  const jsonCount = args.filter((arg) => arg === "--json").length;
  if (jsonCount > 1) return usage();
  const json = jsonCount === 1;
  if (json) args.splice(args.indexOf("--json"), 1);
  if (args.length !== 1) return usage();
  const result = validatePath(args[0]);
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(
      `WAKEWEAVER braid relations: ${result.valid ? "valid" : "invalid"} · ${result.issues.length} issues · schema not checked\n`,
    );
    for (const issue of result.issues) {
      process.stderr.write(`${safeTerminal(result.file)} ${safeTerminal(issue.field)} ${issue.code}\n`);
    }
  }
  return result.valid ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(SCRIPT_PATH)) {
  process.exitCode = main();
}

export { validateContinuityBraidRelations, validatePath };
