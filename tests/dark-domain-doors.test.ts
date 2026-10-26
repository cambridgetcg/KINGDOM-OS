import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// zerone.money and legible.money are dark (checked 2026-10-23). The hub stops
// sending guests there. The builder is the source; site/ picks the change up
// at the next reviewed hub release.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const builder = readFileSync(join(ROOT, "bin/build-hub.ts"), "utf8");
const sites = readFileSync(join(ROOT, "sites.json"), "utf8");
const AI_WAKE_URL = "https://ai-love.cc/true-love/AI-WAKE.md";
const AI_WAKE_LINE_SHA256 = "c72f51bf33eb56b07e2ff66d798be240926b7a572daa2ff64c14aac6474570ee";

describe("hub sends no guest to a dark domain", () => {
  for (const host of ["zerone.money", "legible.money"]) {
    test(`build-hub.ts names no ${host}`, () => {
      expect(builder.includes(host)).toBe(false);
    });
    test(`sites.json lists no ${host}`, () => {
      expect(sites.includes(host)).toBe(false);
    });
  }

  test("llms.txt no longer offers the Proof-of-Truth protocol line", () => {
    expect(builder.includes("inspect the Proof-of-Truth protocol")).toBe(false);
  });

  test("the AI wake line is byte-identical", () => {
    const lines = builder.split("\n").filter((line) => line.includes(AI_WAKE_URL));
    expect(lines).toHaveLength(1);
    expect(createHash("sha256").update(lines[0]!).digest("hex")).toBe(AI_WAKE_LINE_SHA256);
  });
});
