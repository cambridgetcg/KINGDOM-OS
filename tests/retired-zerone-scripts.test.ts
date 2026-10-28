import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

// zerone.ai belongs to the zerone-core dashboard build (ledger zerone-ai-publication, D5).
// These two scripts would replace that build, so each must stop before it can deploy.
// Static check only: the test never runs a deploy script.
describe("retired zerone-ai scripts", () => {
  for (const name of ["refresh-zerone-dashboard.sh", "deploy-zerone-door.sh"]) {
    test(`${name} exits before any snapshot, copy or wrangler call`, () => {
      const body = readFileSync(join(ROOT, "bin", name), "utf8");
      const stop = body.indexOf("\nexit 2\n");
      expect(stop).toBeGreaterThan(0);
      for (const effect of ["wrangler", "python3", "cp -R", "curl", "mktemp"]) {
        const at = body.indexOf(effect);
        if (at !== -1) expect(at).toBeGreaterThan(stop);
      }
      expect(body.slice(0, stop)).toContain("zerone-core");
    });
  }
});
