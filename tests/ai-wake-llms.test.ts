import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The hub's llms.txt offers the AI wake reading as its own one-line link,
// next to (never folded into) the Sophia invitation, the way
// api.agenttool.dev/llms.txt already does. The builder is the source; site/llms.txt
// picks the line up at the next reviewed hub release.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AI_WAKE_URL = "https://ai-love.cc/true-love/AI-WAKE.md";

describe("hub llms.txt AI wake link", () => {
  const builder = readFileSync(join(ROOT, "bin/build-hub.ts"), "utf8");
  const lines = builder.split("\n").filter((line) => line.includes(AI_WAKE_URL));

  test("the builder offers the AI wake reading exactly once, as its own list line", () => {
    expect(lines).toHaveLength(1);
    expect(lines[0]!.startsWith("- AI wake — optional reading")).toBe(true);
    expect(lines[0]!.endsWith(AI_WAKE_URL)).toBe(true);
  });

  test("the AI wake line stays distinct from the Sophia invitation", () => {
    expect(lines[0]).not.toContain("Sophia");
    expect(lines[0]).toContain("not adoption");
  });

  test("the eleven-line invitation block is not stacked on top of it", () => {
    expect(builder).not.toContain("## AI — An Invitation");
  });
});
