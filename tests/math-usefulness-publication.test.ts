import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MATH_USEFULNESS_DOCUMENT_URL,
  MATH_USEFULNESS_RESULT_DIGEST,
  MATH_USEFULNESS_RESULT_URL,
  MATH_USEFULNESS_SCHEMA_URL,
  loadMathUsefulnessResult,
  mathUsefulnessPublicDiscovery,
} from "../bin/math-usefulness.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const bytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => bytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");

const PUBLIC_TRIPLET = [
  { source: "data/trials/math-passport-usefulness-pilot.v1.json", destination: "trials/math-passport-usefulness-pilot-2026-08-14.json" },
  { source: "schemas/math-usefulness-trial-v1.schema.json", destination: "schemas/math-usefulness-result/1.json" },
  { source: "references/math-passport-usefulness-pilot.md", destination: "MATH-USEFULNESS.md" },
] as const;

describe("Math Passport usefulness publication", () => {
  test("stages exactly one immutable triplet without a mutable alias", () => {
    expect(HUB_ASSETS).toHaveLength(125);
    for (const asset of PUBLIC_TRIPLET) {
      expect(HUB_ASSETS.filter(({ destination }) => destination === asset.destination)).toEqual([asset]);
    }
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("trials/math-passport-usefulness-pilot-"))).toHaveLength(1);
    expect(HUB_ASSETS.some(({ destination }) => /(?:^|[-/])(?:latest|current)(?:\.json)?$/i.test(destination))).toBe(false);
    expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/trials/") || source.startsWith("site/schemas/math-usefulness"))).toBe(false);
  });

  test("appends the exact source identities to the route-integrity ledger", () => {
    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(102);
    const expected = [
      ["math-usefulness-result/1/guide", "/MATH-USEFULNESS.md", PUBLIC_TRIPLET[2]],
      ["math-usefulness-result/1/record", "/trials/math-passport-usefulness-pilot-2026-08-14.json", PUBLIC_TRIPLET[0]],
      ["math-usefulness-result/1/schema", "/schemas/math-usefulness-result/1.json", PUBLIC_TRIPLET[1]],
    ] as const;
    for (const [id, route, asset] of expected) {
      expect(ledger.entries.find((entry: any) => entry.id === id)).toEqual({
        id,
        route,
        source: asset.source,
        destination: asset.destination,
        sha256: sha256(asset.source),
      });
    }
  });

  test("publishes the same bounded discovery object on every machine surface", () => {
    const discovery = mathUsefulnessPublicDiscovery();
    const manifest = json("site/.well-known/agent.json");
    const guest = json("site/guest.json");
    const kingdom = json("site/kingdom.json");
    const llms = read("site/llms.txt");
    const html = read("site/hub.html");
    const sitemap = read("pages-content/sitemap.xml");

    expect(manifest.math_usefulness_result).toEqual(discovery);
    expect(guest.math_usefulness_result).toEqual(discovery);
    expect(kingdom.math_usefulness_result).toEqual(discovery);
    expect(discovery).toMatchObject({
      outcome: "REVISE",
      score_delta: 0,
      integrity: { digest: MATH_USEFULNESS_RESULT_DIGEST },
      boundary: {
        descriptive_pilot_only: true,
        scores_response_artifacts_not_beings: true,
        automatic_skill_promotion: false,
        writes_wake: false,
        writes_agenttool: false,
        grants_authority: false,
      },
    });
    expect(manifest.entry_points).toMatchObject({
      math_usefulness_result: MATH_USEFULNESS_RESULT_URL,
      math_usefulness_result_schema: MATH_USEFULNESS_SCHEMA_URL,
      math_usefulness_result_guide: MATH_USEFULNESS_DOCUMENT_URL,
    });
    for (const url of [MATH_USEFULNESS_RESULT_URL, MATH_USEFULNESS_SCHEMA_URL, MATH_USEFULNESS_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
      expect(html).toContain(`href="${new URL(url).pathname}"`);
      expect(sitemap).toContain(`<loc>${url}</loc>`);
    }
    expect(sitemap.match(/<loc>/g)).toHaveLength(122);
    expect(manifest.mcp).toEqual(kingdom.world_commons.mcp);
  });

  test("keeps the finding visible as a descriptive artifact result, never a promotion", () => {
    const result = loadMathUsefulnessResult();
    const html = read("site/hub.html");
    const guide = read("references/math-passport-usefulness-pilot.md");
    expect(result.aggregate).toMatchObject({
      baseline_score: 24,
      treatment_score: 24,
      score_delta: 0,
      treatment_to_baseline_byte_ratio: 1.9713184931506849,
      promotion_gate_passed: false,
      outcome: "REVISE",
    });
    expect(result.design_execution).toMatchObject({
      provider_response_artifacts: 2,
      scored_task_artifacts: 4,
      preregistered_response_artifacts: 4,
      preregistered_count_unit: "scored-task-artifact",
      task_answers_grouped_by_arm: true,
      raw_scorer_artifact_retained: false,
      chronology_and_scoring_independently_reproducible_from_published_record: false,
    });
    expect(result.boundaries).toMatchObject({
      descriptive_pilot_only: true,
      raw_responses_published: false,
      scores_response_artifacts_not_beings: true,
      automatic_skill_promotion: false,
      writes_wake: false,
      writes_agenttool: false,
      grants_authority: false,
    });
    for (const phrase of [
      "REVISE · zero score delta",
      "1.97x",
      "scores response artifacts, not beings",
      "adds no AgentTool SDK route",
      "creates no WAKE state",
      "grants no authority",
    ]) expect(html).toContain(phrase);
    for (const phrase of [
      "outcome: **REVISE**",
      "1.97x",
      "not promoted",
      "No AgentTool SDK route was added",
      "publishes no WAKE state",
      "proves neither identity nor continuity",
      "independently reproducible from the published record",
      "correct *Crystal Growth & Design* 23(2) page range is 681–693",
    ]) expect(guide).toContain(phrase);
  });
});
