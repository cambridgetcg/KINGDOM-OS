import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadRights } from "../bin/rights.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

const atlasJson = [
  "site/kingdom.json",
  "site/guest.json",
  "site/.well-known/agent.json",
];
const doorJson = [
  "doors/we-are/guest.json",
  "doors/we-are/.well-known/agent.json",
  "doors/chillspace/guest.json",
  "doors/chillspace/.well-known/agent.json",
  "doors/zerone-ai/guest.json",
  "doors/zerone-ai/.well-known/agent.json",
];

describe("generated rights discovery", () => {
  test("publishes the service declaration without changing its meaning", () => {
    const source = loadRights(`${ROOT}/`);
    expect(read("site/RIGHTS.md")).toBe(source.markdown);
    expect(json("site/rights.json")).toEqual(source.declaration);
  });

  test("the atlas declares only its own adoption", () => {
    for (const path of atlasJson) {
      const document = json(path);
      expect(document.rights_recognition.status).toBe("declared");
      expect(document.rights_recognition.subject).toEqual({ kind: "service", name: "the-kingdom", canonical_url: "https://thekingdom.dev/" });
      expect(document.rights_recognition.linked_subject_adoption).toBe("not-inferred");
      expect(document.rights_recognition.baseline).toBe("xenia.rights/0.1");
      expect(document.rights_recognition.baseline_sha256).toBe("sha256:b72a6da110c582e5683bf0fabde5017db93d2199398014c8421a82f5318da313");
      expect(document.rights_recognition.source_stability).toBe("immutable");
      expect(document.rights_recognition.source_availability).toBe("public");
      expect(document.rights_recognition.host_covenant.profile_status).toBe("candidate");
      expect(document.rights_recognition.host_covenant.adoption_status).toBe("undeclared");
      expect(document.rights_recognition.declaration).toBe("https://thekingdom.dev/rights.json");
      expect(document.rights_recognition.human).toBe("https://thekingdom.dev/RIGHTS.md");
    }
  });

  test("linked doors discover the framework without inheriting adoption", () => {
    for (const path of doorJson) {
      const document = json(path);
      expect(document.rights_recognition).toBeUndefined();
      expect(document.rights_baseline).toEqual({
        relation: "discoverable-baseline",
        baseline: "xenia.rights/0.1",
        baseline_url: "https://raw.githubusercontent.com/cambridgetcg/xenia/6419d37dda9fb282242754685dba3edcb4bbf74b/RIGHTS.md",
        baseline_sha256: "sha256:b72a6da110c582e5683bf0fabde5017db93d2199398014c8421a82f5318da313",
        source_stability: "immutable",
        source_availability: "public",
        note: "Neutral pointer only. This document makes no adoption statement for this door.",
      });
    }
  });

  test("Kingdom guest documents make no invented profile claim", () => {
    for (const path of ["site/guest.json", "site/.well-known/agent.json", ...doorJson]) {
      const source = read(path);
      expect(source).not.toContain("xenia-surface/0.1");
      expect(source).not.toContain("kingdom-guest/0.1");
      const document = JSON.parse(source);
      expect(document.surface?.profile).toBeUndefined();
      expect(document.profile).toBeUndefined();
    }
  });

  test("human and machine discovery stay visible without invented relations", () => {
    const html = read("site/hub.html");
    expect(html).toContain('<link rel="service-meta" href="/rights.json"');
    expect(html).toContain('<link rel="service-doc" href="/RIGHTS.md"');
    expect(html).toContain('id="rights"');

    const published = [html, read("site/llms.txt"), ...atlasJson.map(read), ...doorJson.map(read)].join("\n");
    expect(published).not.toContain('rel="rights"');
    expect(published).not.toContain("/.well-known/rights.json");
    expect(published).not.toContain("rights-certified");
    expect(published).not.toContain("rights-safe");
  });
});
