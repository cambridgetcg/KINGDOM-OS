import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  POLYMORPH_CASE_URL,
  POLYMORPH_DOCUMENT_URL,
  POLYMORPH_SCHEMA_URL,
  loadPolymorphHistory,
  polymorphPublicDiscovery,
  verifyPolymorphHistory,
} from "../bin/polymorph.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

describe("Polymorph History publication", () => {
  test("publishes three authored resources directly at immutable paths", () => {
    expect(HUB_ASSETS).toContainEqual({
      source: "data/polymorphs/ritonavir-disappearing-polymorph.v1.json",
      destination: "polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "schemas/polymorph-history-v1.schema.json",
      destination: "schemas/polymorph-history/1.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "references/ritonavir-polymorph.md",
      destination: "RITONAVIR-POLYMORPH.md",
    });
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("polymorphs/"))).toHaveLength(1);
    expect(HUB_ASSETS.some(({ destination }) => /polymorphs\/(?:latest|current)\.json/.test(destination))).toBe(false);
    expect(existsSync(join(ROOT, "site", "polymorphs"))).toBe(false);
  });

  test("maps the schema URN to one public schema and exact digest", () => {
    const history = loadPolymorphHistory();
    const schema = json("schemas/polymorph-history-v1.schema.json");
    const discovery = polymorphPublicDiscovery(history);

    expect(verifyPolymorphHistory(history)).toEqual([]);
    expect(history.$schema).toBe("urn:kingdom:schema:polymorph-history:1");
    expect(schema.$id).toBe(history.$schema);
    expect(discovery).toMatchObject({
      url: POLYMORPH_CASE_URL,
      schema: POLYMORPH_SCHEMA_URL,
      document: POLYMORPH_DOCUMENT_URL,
      case_id: history.case_id,
      integrity: history.integrity.digest,
      compiled_on: "2026-08-11",
      evidence_through: "2024-06-20",
      counts: { forms: 5, contexts: 16, sources: 9, claims: 17, events: 8, transitions: 8, languages: 6 },
    });
  });

  test("renders one coherent human and machine discovery surface", () => {
    const discovery = polymorphPublicDiscovery();
    const manifest = json("site/.well-known/agent.json");
    const guest = json("site/guest.json");
    const kingdom = json("site/kingdom.json");
    const html = read("site/hub.html");
    const llms = read("site/llms.txt");

    expect(manifest.polymorph_commons).toEqual(discovery);
    expect(guest.polymorph_commons).toEqual(discovery);
    expect(kingdom.polymorph_commons).toEqual(discovery);
    expect(html).toContain('id="polymorph-history"');
    expect(html).toContain('href="/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json"');
    expect(html).toContain('href="/schemas/polymorph-history/1.json"');
    expect(html).toContain('href="/RITONAVIR-POLYMORPH.md"');
    for (const url of [POLYMORPH_CASE_URL, POLYMORPH_SCHEMA_URL, POLYMORPH_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
  });
});
