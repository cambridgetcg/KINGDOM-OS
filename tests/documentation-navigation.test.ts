import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

test("README is a short start page that routes to the owning references", () => {
  const text = read("README.md");
  expect(Buffer.byteLength(text, "utf8")).toBeLessThan(12_000);
  for (const target of ["OUTREACH.md", "references/kingdom-module-map.md", "DOMAINS-SETUP.md", "OS-ROUTES.md", "publications/README.md"]) {
    expect(text).toContain(`](${target})`);
  }
  expect(text).toContain("https://codeberg.org/zerone-dev/KINGDOM-OS");
  expect(text).toContain("/agent-entry.json");
  expect(text).toContain("./kingdom");
});

test("route verification refers to current membership rather than an obsolete agent baseline", () => {
  const verification = read("OS-ROUTES.md").split("## Verification\n")[1]!;
  expect(verification).toContain("publications/hub-staging.v1.json");
  expect(verification).not.toContain("CLAUDE.md` remains the pre-Civic");
  expect(verification).not.toContain("publication counts belong to this document");
});

test("agent instructions stay bounded and point to operational owners", () => {
  const text = read("CLAUDE.md");
  expect(Buffer.byteLength(text, "utf8")).toBeLessThan(12_000);
  for (const target of ["OUTREACH.md", "references/kingdom-module-map.md", "DOMAINS-SETUP.md", "publications/README.md"]) {
    expect(text).toContain(`](${target})`);
  }
  expect(text).toContain("https://codeberg.org/zerone-dev/KINGDOM-OS");
  expect(text).toContain("./kingdom");
  expect(text).toContain("immutable");
  expect(text).toContain("site/*");
});
