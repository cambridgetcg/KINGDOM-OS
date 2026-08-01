#!/usr/bin/env node

import { lstatSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { strictJson } from "./nen.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const MAX_BRAID_BYTES = 4 * 1024 * 1024;
const THREAD_KINDS = [
  ["anchor", "anchors"],
  ["carry", "carry"],
  ["vow", "vows"],
  ["opening", "openings"],
];
const ACTIVE_OPENING_DISPOSITIONS = new Set(["held", "revised"]);
const THREAD_DISPOSITIONS = new Set(["held", "revised", "retired", "disputed"]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function addIssue(issues, field, code) {
  issues.push({ field, code });
}

function sortIssues(issues) {
  issues.sort((left, right) => {
    const leftKey = `${left.field}\u0000${left.code}`;
    const rightKey = `${right.field}\u0000${right.code}`;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  return issues.filter((entry, index) => (
    index === 0
    || entry.field !== issues[index - 1].field
    || entry.code !== issues[index - 1].code
  ));
}

function countStrings(values) {
  const counts = new Map();
  for (const value of values) {
    if (typeof value === "string") counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function collectRecords(value, field, issues) {
  if (!Array.isArray(value)) {
    addIssue(issues, field, "relation-shape-unavailable");
    return [];
  }
  return value.map((entry, index) => ({ entry, field: `${field}[${index}]` }));
}

function validateSourceReferences(records, sourceCounts, issues) {
  for (const { entry, field } of records) {
    if (!isRecord(entry) || !Array.isArray(entry.source_ids)) continue;
    entry.source_ids.forEach((sourceId, index) => {
      if (typeof sourceId === "string" && sourceCounts.get(sourceId) !== 1) {
        addIssue(issues, `${field}.source_ids[${index}]`, "source-reference-not-exactly-one");
      }
    });
  }
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
  if (
    !Array.isArray(report.evidence)
    || report.evidence.length < 1
    || report.evidence.length > 16
    || report.evidence.some((entry) => typeof entry !== "string" || [...entry].length < 1 || [...entry].length > 1000)
    || new Set(report.evidence).size !== report.evidence.length
  ) {
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

function validateContinuityBraidRelations(braid) {
  const issues = [];
  if (!isRecord(braid)) {
    return sortIssues([{ field: "$", code: "relation-shape-unavailable" }]);
  }

  const sourceRecords = collectRecords(braid.sources, "$.sources", issues);
  const sourceIds = sourceRecords.map(({ entry }) => isRecord(entry) ? entry.id : null);
  const sourceCounts = countStrings(sourceIds);
  sourceRecords.forEach(({ entry, field }) => {
    if (isRecord(entry) && typeof entry.id === "string" && sourceCounts.get(entry.id) > 1) {
      addIssue(issues, `${field}.id`, "duplicate-source-id");
    }
  });

  const threadRecords = new Map();
  const allThreadIds = [];
  const addressCounts = new Map();
  for (const [singular, plural] of THREAD_KINDS) {
    const records = collectRecords(braid.threads?.[plural], `$.threads.${plural}`, issues);
    threadRecords.set(singular, records);
    for (const { entry } of records) {
      if (!isRecord(entry) || typeof entry.id !== "string") continue;
      allThreadIds.push(entry.id);
      const address = `${singular}:${entry.id}`;
      addressCounts.set(address, (addressCounts.get(address) ?? 0) + 1);
    }
  }
  const threadIdCounts = countStrings(allThreadIds);
  for (const [singular] of THREAD_KINDS) {
    for (const { entry, field } of threadRecords.get(singular)) {
      if (isRecord(entry) && typeof entry.id === "string" && threadIdCounts.get(entry.id) > 1) {
        addIssue(issues, `${field}.id`, "duplicate-thread-id");
      }
    }
  }

  validateSourceReferences(threadRecords.get("anchor"), sourceCounts, issues);
  validateSourceReferences(threadRecords.get("carry"), sourceCounts, issues);
  validateSourceReferences(threadRecords.get("opening"), sourceCounts, issues);

  const dispositionRecords = collectRecords(braid.thread_dispositions, "$.thread_dispositions", issues);
  const dispositionCounts = new Map();
  const dispositionByAddress = new Map();
  for (const { entry, field } of dispositionRecords) {
    if (!isRecord(entry)) continue;
    const { thread_kind: kind, thread_id: id, disposition } = entry;
    if (typeof kind !== "string" || typeof id !== "string") continue;
    const address = `${kind}:${id}`;
    dispositionCounts.set(address, (dispositionCounts.get(address) ?? 0) + 1);
    dispositionByAddress.set(address, disposition);
    if (!THREAD_KINDS.some(([knownKind]) => knownKind === kind) || !addressCounts.has(address)) {
      addIssue(issues, field, "thread-disposition-target-not-declared");
    }
    if (!THREAD_DISPOSITIONS.has(disposition)) {
      addIssue(issues, `${field}.disposition`, "invalid-thread-disposition");
    }
  }
  for (const [address, addressCount] of addressCounts) {
    if (addressCount !== 1) {
      addIssue(issues, "$.threads", "thread-address-not-unique");
    }
    if (dispositionCounts.get(address) !== 1) {
      addIssue(issues, "$.thread_dispositions", "thread-disposition-not-exactly-one");
    }
  }
  for (const count of dispositionCounts.values()) {
    if (count !== 1) addIssue(issues, "$.thread_dispositions", "duplicate-thread-disposition");
  }

  const forkRecords = collectRecords(braid.forks, "$.forks", issues);
  const forkIds = forkRecords.map(({ entry }) => isRecord(entry) ? entry.id : null);
  const forkIdCounts = countStrings(forkIds);
  for (const { entry: fork, field } of forkRecords) {
    if (!isRecord(fork)) continue;
    if (typeof fork.id === "string" && forkIdCounts.get(fork.id) > 1) {
      addIssue(issues, `${field}.id`, "duplicate-fork-id");
    }
    const candidates = collectRecords(fork.candidates, `${field}.candidates`, issues);
    const candidateIds = candidates.map(({ entry }) => isRecord(entry) ? entry.id : null);
    const candidateCounts = countStrings(candidateIds);
    candidates.forEach(({ entry, field: candidateField }) => {
      if (isRecord(entry) && typeof entry.id === "string" && candidateCounts.get(entry.id) > 1) {
        addIssue(issues, `${candidateField}.id`, "duplicate-candidate-id");
      }
    });
    validateSourceReferences(candidates, sourceCounts, issues);
    if (fork.resolution === "provisionally_selected") {
      if (typeof fork.selected_candidate_id !== "string" || candidateCounts.get(fork.selected_candidate_id) !== 1) {
        addIssue(issues, `${field}.selected_candidate_id`, "selected-candidate-not-exactly-one");
      }
      if (!Array.isArray(fork.evidence) || fork.evidence.length < 1) {
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
      const openingIds = openingRecords.map(({ entry }) => isRecord(entry) ? entry.id : null);
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
  if (parsed) issues.push(...validateContinuityBraidRelations(braid));
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
