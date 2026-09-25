import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertReviewedWayfinderRetirement, readHistoricalPowerHub } from "./publication-retirement-fixture";
import { withoutPowerAtlasHub } from "./power-atlas-publication-fixture";

test("historical Power measurement remains behind its original exact-byte guard", () => {
  expect(() => withoutPowerAtlasHub(readHistoricalPowerHub())).not.toThrow();
  expect(() => withoutPowerAtlasHub(readHistoricalPowerHub().replace("KINGDOM", "CHANGED"))).toThrow();
});

test("Wayfinder retirement proof refuses unrelated edits, reordering and reactivation", () => {
  const bytes = readFileSync(join(import.meta.dir, "../site/wayfinder.json"));
  expect(() => assertReviewedWayfinderRetirement(bytes)).not.toThrow();
  for (const mutate of [
    (value: any) => { value.paths[0].label += " changed"; },
    (value: any) => { value.paths.reverse(); },
    (value: any) => { value.paths.push({ id: "evaluation-covenant" }); },
    (value: any) => { value.generated = "unverified"; },
  ]) {
    const value = JSON.parse(bytes.toString("utf8"));
    mutate(value);
    expect(() => assertReviewedWayfinderRetirement(Buffer.from(JSON.stringify(value, null, 2)))).toThrow();
  }
});
