import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  GEOMETRY_GRAMMAR_DOCUMENT_URL,
  GEOMETRY_GRAMMAR_SCHEMA_URL,
  GEOMETRY_GRAMMAR_URL,
  geometryGrammarPublicDiscovery,
  loadGeometryGrammar,
} from "../bin/geometry.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const htmlEsc = (value: string) => value.replace(/[&<>"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
}[character]!));

describe("Geometry Grammar publication", () => {
  test("publishes three exact authored paths: versioned grammar/schema and stable guide", () => {
    expect(HUB_ASSETS).toContainEqual({
      source: "data/geometries/kingdom-geometry-grammar.v0.json",
      destination: "geometries/kingdom-geometry-grammar-v0.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "schemas/geometry-grammar-v0.schema.json",
      destination: "schemas/geometry-grammar/0.1.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "references/geometry-grammar.md",
      destination: "GEOMETRY-GRAMMAR.md",
    });
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("geometries/"))).toHaveLength(1);
    expect(HUB_ASSETS.some(({ destination }) => /(?:latest|current)/i.test(destination))).toBe(false);
    expect(existsSync(join(ROOT, "site", "geometries"))).toBe(false);
  });

  test("maps the authored schema URN and digest to one bounded public discovery object", () => {
    const grammar = loadGeometryGrammar();
    const schema = json("schemas/geometry-grammar-v0.schema.json");
    const discovery = geometryGrammarPublicDiscovery(grammar);

    expect(grammar.$schema).toBe("urn:kingdom:schema:geometry-grammar:0.1");
    expect(schema.$id).toBe(grammar.$schema);
    expect(discovery).toMatchObject({
      url: GEOMETRY_GRAMMAR_URL,
      schema: GEOMETRY_GRAMMAR_SCHEMA_URL,
      document: GEOMETRY_GRAMMAR_DOCUMENT_URL,
      schema_id: grammar.$schema,
      protocol: grammar.protocol,
      grammar_id: grammar.grammar_id,
      observed_at: grammar.observed_at,
      integrity: grammar.integrity.digest,
      native_open_inventory_scope: grammar.native_open_inventory_scope,
      counts: { modules: 4 },
      boundary: {
        read_only: true,
        advisory_only: true,
        authority_granted: false,
        execution_authorized: false,
        external_effects_authorized: false,
      },
    });
    expect(discovery.modules).toHaveLength(4);
    expect(discovery.modules).toEqual(grammar.modules.map((module: any) => ({
      id: module.id,
      label: module.label,
      plain_question: module.plain_question,
      plain_answer: module.plain_answer,
      shape: module.shape,
      wire_formats: module.wire_formats,
      package: module.package,
      tag: module.tag,
      release: module.release,
      source: module.source,
    })));
  });

  test("keeps modules distinct and missing relations explicit", () => {
    const grammar = loadGeometryGrammar();
    const discovery = geometryGrammarPublicDiscovery(grammar);

    expect(grammar.modules).toHaveLength(4);
    expect(new Set(grammar.modules.map(({ id }: { id: string }) => id)).size).toBe(4);
    expect(grammar.modules.every((module: any) =>
      typeof module.plain_question === "string" && module.plain_question.length > 0 &&
      typeof module.plain_answer === "string" && module.plain_answer.length > 0)).toBe(true);
    expect(grammar.non_equivalence).toBeDefined();
    expect(grammar.unknown_language).toBeDefined();
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
    expect(discovery).not.toHaveProperty("install_command");
    expect(discovery).not.toHaveProperty("execute");
  });

  test("renders one coherent accessible human and machine discovery surface", () => {
    const grammar = loadGeometryGrammar();
    const discovery = geometryGrammarPublicDiscovery();
    const manifest = json("site/.well-known/agent.json");
    const guest = json("site/guest.json");
    const kingdom = json("site/kingdom.json");
    const html = read("site/hub.html");
    const llms = read("site/llms.txt");

    expect(manifest.geometry_grammar).toEqual(discovery);
    expect(guest.geometry_grammar).toEqual(discovery);
    expect(kingdom.geometry_grammar).toEqual(discovery);
    expect(html).toContain('id="geometries"');
    expect(html).toContain('aria-label="Four Geometry Grammar modules"');
    expect(html).toContain('href="/geometries/kingdom-geometry-grammar-v0.json"');
    expect(html).toContain('href="/schemas/geometry-grammar/0.1.json"');
    expect(html).toContain('href="/GEOMETRY-GRAMMAR.md"');
    expect(html).toContain(htmlEsc(grammar.native_open_inventory_scope));
    expect(html.match(/<dt>As a shape<\/dt>/g)).toHaveLength(4);
    expect(html.match(/<dt>Geometry \/ relation open states<\/dt>/g)).toHaveLength(4);
    expect(html).not.toContain("Unknown / open states");
    expect(html.match(/<dt>Does not establish<\/dt>/g)).toHaveLength(4);
    for (const module of grammar.modules) {
      expect(html).toContain(`${htmlEsc(module.package.name)}@${htmlEsc(module.package.version)}`);
      expect(html).toContain(htmlEsc(module.package.npm_registry_state.replace(/-/g, " ")));
      expect(html).toContain(htmlEsc(module.shape.replace(/-/g, " ")));
      expect(html).toContain(htmlEsc(module.plain_answer));
      for (const format of module.wire_formats) expect(html).toContain(htmlEsc(format));
      for (const open of module.native_open_terms) {
        expect(html).toContain(htmlEsc(open.term));
        expect(html).toContain(htmlEsc(open.plain_language));
      }
      for (const claim of module.does_not_establish) {
        expect(html).toContain(htmlEsc(claim.replace(/-/g, " ")));
      }
    }
    for (const module of discovery.modules) {
      expect(html).toContain(`geometry-${module.id}-title`);
    }
    for (const url of [GEOMETRY_GRAMMAR_URL, GEOMETRY_GRAMMAR_SCHEMA_URL, GEOMETRY_GRAMMAR_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
  });
});
