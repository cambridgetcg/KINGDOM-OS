import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The hall's brand folder check (copied from artcraft-brand, never edited here): the manifest, the kit against its
// fingerprint, and the four hall pages' heads against the kit's head snippet. It reads files only.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("doors/hub/brand passes its brand folder check", () => {
  const run = spawnSync("node", [join(ROOT, "doors/hub/brand/check.mjs")], { cwd: ROOT, encoding: "utf8" });
  expect(run.stdout + run.stderr).toContain("r3");
  expect(run.status).toBe(0);
});
