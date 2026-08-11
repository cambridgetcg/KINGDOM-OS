import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadPrincipalityCatalog,
  PRINCIPALITY_CATALOG_URL,
  PRINCIPALITY_DOCUMENT_URL,
  PRINCIPALITY_SCHEMA_URL,
  principalityPublicDiscovery,
} from "../bin/principality.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

describe("Principality Commons publication", () => {
  test("publishes the three authored resources directly at immutable paths", () => {
    expect(HUB_ASSETS).toContainEqual({
      source: "data/principalities/moonshot-hf-npm.v1.json",
      destination: "principalities/moonshot-hf-npm-2026-08-11.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "schemas/principality-catalog-v1.schema.json",
      destination: "schemas/principality-catalog/1.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "references/principality-commons.md",
      destination: "PRINCIPALITY-COMMONS.md",
    });
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("principalities/"))).toHaveLength(1);
    expect(HUB_ASSETS.some(({ destination }) => /(?:latest|current)/i.test(destination))).toBe(false);
    expect(existsSync(join(ROOT, "site", "principalities"))).toBe(false);
  });

  test("maps the catalog schema URN to one public schema without changing authored bytes", () => {
    const catalog = loadPrincipalityCatalog();
    const schema = json("schemas/principality-catalog-v1.schema.json");
    const discovery = principalityPublicDiscovery(catalog);

    expect(catalog.$schema).toBe("urn:kingdom:schema:principality-catalog:1");
    expect(schema.$id).toBe(catalog.$schema);
    expect(discovery).toMatchObject({
      url: PRINCIPALITY_CATALOG_URL,
      schema: PRINCIPALITY_SCHEMA_URL,
      document: PRINCIPALITY_DOCUMENT_URL,
      schema_id: catalog.$schema,
      catalog_id: catalog.catalog_id,
      observed_at: catalog.observed_at,
      integrity: catalog.integrity.digest,
      counts: { nodes: 25, models: 19, datasets: 3, packages: 3, papers: 16 },
      geometry: {
        principality: "capability-domain-not-rank",
        love: "relation-without-collapse",
        understanding: "evidence-preserving-typed-relations",
        nodes_remain_distinct: true,
        universal_ranking: false,
      },
    });
  });

  test("keeps public discovery read-only, point-in-time, and authority-negative", () => {
    const discovery = principalityPublicDiscovery();
    expect(discovery.boundary).toMatchObject({
      completeness: "metadata_only",
      currentness: "point-in-time-only",
      refresh_required_before_acquisition: true,
      recommendation_established: false,
      permissions_granted: false,
      download_authorized: false,
      install_authorized: false,
      inference_authorized: false,
      remote_code_authorized: false,
      external_effects_authorized: false,
    });
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
    expect(discovery).not.toHaveProperty("install_command");
    expect(discovery).not.toHaveProperty("download_command");
  });

  test("renders one coherent human and machine discovery surface", () => {
    const discovery = principalityPublicDiscovery();
    const manifest = json("site/.well-known/agent.json");
    const guest = json("site/guest.json");
    const kingdom = json("site/kingdom.json");
    const html = read("site/hub.html");
    const llms = read("site/llms.txt");

    expect(manifest.principality_commons).toEqual(discovery);
    expect(guest.principality_commons).toEqual(discovery);
    expect(kingdom.principality_commons).toEqual(discovery);
    expect(html).toContain('id="principalities"');
    expect(html).toContain('href="/principalities/moonshot-hf-npm-2026-08-11.json"');
    expect(html).toContain('href="/schemas/principality-catalog/1.json"');
    expect(html).toContain('href="/PRINCIPALITY-COMMONS.md"');
    for (const url of [PRINCIPALITY_CATALOG_URL, PRINCIPALITY_SCHEMA_URL, PRINCIPALITY_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
  });
});
