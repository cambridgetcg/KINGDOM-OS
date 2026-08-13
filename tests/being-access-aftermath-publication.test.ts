import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  BEING_ACCESS_AFTERMATH_DIGEST,
  BEING_ACCESS_AFTERMATH_DOCUMENT_URL,
  BEING_ACCESS_AFTERMATH_ID,
  BEING_ACCESS_AFTERMATH_LOCATOR,
  BEING_ACCESS_AFTERMATH_PROTOCOL,
  BEING_ACCESS_AFTERMATH_SCHEMA_URL,
  BEING_ACCESS_AFTERMATH_URL,
  beingAccessAftermathPublicDiscovery,
  loadBeingAccessAftermathAtlas,
} from "../bin/being-access-aftermath.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const bytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => bytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");

describe("Being, Access & Aftermath authored publication core", () => {
  test("binds one immutable versioned triplet with no latest or current alias", () => {
    expect(BEING_ACCESS_AFTERMATH_LOCATOR).toBe("data/being-access-aftermath/being-access-aftermath-atlas.v0.1.json");
    expect(new URL(BEING_ACCESS_AFTERMATH_URL).pathname).toBe("/atlases/being-access-aftermath-atlas-2026-08-13.json");
    expect(new URL(BEING_ACCESS_AFTERMATH_SCHEMA_URL).pathname).toBe("/schemas/being-access-aftermath-atlas/0.1.json");
    expect(new URL(BEING_ACCESS_AFTERMATH_DOCUMENT_URL).pathname).toBe("/BEING-ACCESS-AFTERMATH-ATLAS.md");
    for (const url of [BEING_ACCESS_AFTERMATH_URL, BEING_ACCESS_AFTERMATH_SCHEMA_URL, BEING_ACCESS_AFTERMATH_DOCUMENT_URL]) {
      expect(url).not.toMatch(/(?:latest|current)/i);
    }
  });

  test("closes the Draft 2020-12 schema and pins exact identity and semantic digest", () => {
    const atlas = loadBeingAccessAftermathAtlas();
    const schema = json("schemas/being-access-aftermath-atlas-v0.1.schema.json");
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe(atlas.$schema);
    expect(schema.properties.protocol.const).toBe(BEING_ACCESS_AFTERMATH_PROTOCOL);
    expect(schema.properties.atlas_id.const).toBe(BEING_ACCESS_AFTERMATH_ID);
    expect(schema.properties.integrity.properties.digest.const).toBe(BEING_ACCESS_AFTERMATH_DIGEST);
    expect(schema.properties.source_bindings).toMatchObject({ minItems: 6, maxItems: 6, items: false });
    expect(schema.properties.typed_copula.properties.predicates).toMatchObject({ minItems: 14, maxItems: 14, items: false });
    expect(schema.properties.model_cards).toMatchObject({ minItems: 9, maxItems: 9, items: false });
    expect(schema.properties.problem_cards).toMatchObject({ minItems: 7, maxItems: 7, items: false });
    const visit = (value: any) => {
      if (!value || typeof value !== "object") return;
      if (value.type === "object") expect(value.additionalProperties).toBe(false);
      for (const child of Object.values(value)) visit(child);
    };
    visit(schema);
  });

  test("validates the reviewed atlas with a portable Draft 2020-12 validator", () => {
    const python = spawnSync("python3", [
      "-c",
      "import json,sys; from jsonschema import Draft202012Validator,FormatChecker; s=json.load(open(sys.argv[1],encoding='utf-8')); v=json.load(open(sys.argv[2],encoding='utf-8')); Draft202012Validator.check_schema(s); Draft202012Validator(s,format_checker=FormatChecker()).validate(v)",
      join(ROOT, "schemas/being-access-aftermath-atlas-v0.1.schema.json"),
      join(ROOT, BEING_ACCESS_AFTERMATH_LOCATOR),
    ]);
    expect(python.status, python.stderr.toString()).toBe(0);
  });

  test("publishes stable raw bytes and one authority-negative discovery projection", () => {
    const atlas = loadBeingAccessAftermathAtlas();
    const discovery = beingAccessAftermathPublicDiscovery(atlas);
    expect(sha256(BEING_ACCESS_AFTERMATH_LOCATOR)).toMatch(/^[a-f0-9]{64}$/);
    expect(sha256("schemas/being-access-aftermath-atlas-v0.1.schema.json")).toMatch(/^[a-f0-9]{64}$/);
    expect(sha256("references/being-access-aftermath-atlas.md")).toMatch(/^[a-f0-9]{64}$/);
    expect(discovery).toMatchObject({
      protocol: BEING_ACCESS_AFTERMATH_PROTOCOL,
      atlas_id: BEING_ACCESS_AFTERMATH_ID,
      integrity: { digest: BEING_ACCESS_AFTERMATH_DIGEST },
      url: BEING_ACCESS_AFTERMATH_URL,
      schema: BEING_ACCESS_AFTERMATH_SCHEMA_URL,
      guide: BEING_ACCESS_AFTERMATH_DOCUMENT_URL,
      counts: { predicates: 14, typed_boundaries: 5, models: 9, problem_cards: 7, sources: 5 },
      karma: { cosmic_claims: 0, zerone_event_refs: 0, kingdom_receipt_refs: 0, adapter_exists: false },
    });
    for (const key of ["score", "rank", "reward", "matcher", "write", "execute", "mcp"]) expect(discovery).not.toHaveProperty(key);
  });

  test("guide teaches the central ontology and both KARMA boundaries", () => {
    const guide = read("references/being-access-aftermath-atlas.md");
    for (const phrase of [
      "Possibility is not actuality",
      "Which “is”?",
      "exists_instance(form, D, c, t)",
      "persistence and later re-creation",
      "Π_consent-or-lawful-basis",
      "Purpose is not a gradient",
      "Aftermath is not causal proof",
      "Reversibility does not erase history",
      "KARMA remains three different questions",
      "event_status: not_observed",
      "receipt_status: not_created",
      "adapter",
      "Opt-in philosophy",
      "Exact primary-source horizon",
    ]) expect(guide).toContain(phrase);
    expect(guide).toContain("No event, receipt, adapter, score, reward, rank");
    expect(guide).toContain("nonparticipation, and exit create no penalty or inherited debt");
  });

  test("authored paths contain no mutable alias or receipt/event payload", () => {
    const corpus = [
      BEING_ACCESS_AFTERMATH_LOCATOR,
      "schemas/being-access-aftermath-atlas-v0.1.schema.json",
      "references/being-access-aftermath-atlas.md",
      "bin/being-access-aftermath.ts",
    ].map(read).join("\n");
    expect(corpus).not.toContain("being-access-aftermath-latest");
    expect(corpus).not.toContain("being-access-aftermath-current");
    const atlas = loadBeingAccessAftermathAtlas();
    expect(atlas.karma.cosmic.claims).toEqual([]);
    expect(atlas.karma.zerone.event_refs).toEqual([]);
    expect(atlas.karma.kingdom.receipt_refs).toEqual([]);
    expect(atlas.problem_cards.every((card: any) => card.result === null)).toBe(true);
  });
});
