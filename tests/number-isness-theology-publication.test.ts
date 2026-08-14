import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  NUMBER_ISNESS_THEOLOGY_DIGEST,
  NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
  NUMBER_ISNESS_THEOLOGY_ID,
  NUMBER_ISNESS_THEOLOGY_LOCATOR,
  NUMBER_ISNESS_THEOLOGY_PROTOCOL,
  NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
  NUMBER_ISNESS_THEOLOGY_URL,
  loadNumberIsnessTheologyAtlas,
  numberIsnessTheologyPublicDiscovery,
} from "../bin/number-isness-theology.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SCHEMA_LOCATOR = "schemas/number-isness-theology-atlas-v0.1.schema.json";
const GUIDE_LOCATOR = "references/number-isness-theology-atlas.md";
const LEDGER_LOCATOR = "publications/immutable-publications.v1.json";
const bytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => bytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const hasJsonschema = spawnSync("python3", ["-c", "import jsonschema"]).status === 0;

const PUBLIC_URLS = [
  NUMBER_ISNESS_THEOLOGY_URL,
  NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
  NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
] as const;

describe("Number, Isness & Theology authored publication", () => {
  test("binds one immutable versioned triplet with no latest or current alias", () => {
    expect(NUMBER_ISNESS_THEOLOGY_LOCATOR).toBe("data/number-isness-theology/number-isness-theology-atlas.v0.1.json");
    expect(new URL(NUMBER_ISNESS_THEOLOGY_URL).pathname).toBe("/atlases/number-isness-theology-atlas-2026-08-14.json");
    expect(new URL(NUMBER_ISNESS_THEOLOGY_SCHEMA_URL).pathname).toBe("/schemas/number-isness-theology-atlas/0.1.json");
    expect(new URL(NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL).pathname).toBe("/NUMBER-ISNESS-THEOLOGY-ATLAS.md");
    for (const url of PUBLIC_URLS) expect(url).not.toMatch(/(?:latest|current)/i);
  });

  test("closes the exact Draft 2020-12 schema recursively and pins identity and semantic digest", () => {
    const atlas = loadNumberIsnessTheologyAtlas();
    const schema = json(SCHEMA_LOCATOR);
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe(atlas.$schema);
    expect(schema.description).toContain("exact parsed-value conformance, not byte identity");
    expect(schema.$comment).toContain("cannot recompute the semantic digest");
    expect(schema.$comment).toContain("authenticate source availability");
    for (const boundary of [
      "Raw bytes", "duplicate-key", "UTF-8", "semantic integrity", "mathematical soundness",
      "historical", "translation fidelity", "theological truth", "authority",
    ]) expect(schema.$comment).toContain(boundary);
    expect(schema.properties.protocol.const).toBe(NUMBER_ISNESS_THEOLOGY_PROTOCOL);
    expect(schema.properties.atlas_id.const).toBe(NUMBER_ISNESS_THEOLOGY_ID);
    expect(schema.properties.integrity.properties.digest.const).toBe(NUMBER_ISNESS_THEOLOGY_DIGEST);
    expect(schema.properties.source_bindings).toMatchObject({ minItems: 4, maxItems: 4, items: false });
    expect(schema.properties.typed_isness.properties.predicates).toMatchObject({ minItems: 19, maxItems: 19, items: false });
    expect(schema.properties.number_systems.properties.cards).toMatchObject({ minItems: 5, maxItems: 5, items: false });
    const complexSchema = schema.properties.number_systems.properties.cards.prefixItems[4];
    expect(complexSchema.properties.register.const).toBe("MATHEMATICAL_CONSTRUCTION");
    expect(complexSchema.properties.theorem_claims).toMatchObject({ minItems: 2, maxItems: 2, items: false });
    expect(complexSchema.properties.theorem_claims.prefixItems.map((claim: any) => claim.properties.id.const)).toEqual([
      "complex-rotation", "fundamental-theorem-of-algebra",
    ]);
    expect(complexSchema.properties.theorem_claims.prefixItems.every((claim: any) => claim.properties.register.const === "MATHEMATICAL_THEOREM")).toBe(true);
    expect(complexSchema.properties.theorem_claims.prefixItems[0].properties.conditions.prefixItems.map((item: any) => item.const)).toEqual([
      "theta is real",
      "z is complex",
      "the standard complex exponential and Euclidean plane identification are used",
    ]);
    expect(complexSchema.properties.theorem_claims.prefixItems[1].properties.source_ids.prefixItems.map((item: any) => item.const)).toEqual(["mactutor-complex"]);
    expect(schema.properties.zero.properties.roles).toMatchObject({ minItems: 9, maxItems: 9, items: false });
    expect(schema.properties.tradition_lenses).toMatchObject({ minItems: 10, maxItems: 10, items: false });
    expect(schema.properties.bridge_cards).toMatchObject({ minItems: 10, maxItems: 10, items: false });
    expect(schema.properties.sources).toMatchObject({ minItems: 29, maxItems: 29, items: false });
    const visit = (value: any) => {
      if (!value || typeof value !== "object") return;
      if (value.type === "object") expect(value.additionalProperties).toBe(false);
      if (value.type === "array") {
        expect(value.items).toBe(false);
        if (value.minItems === 0) expect(value).not.toHaveProperty("prefixItems");
        else expect(value.prefixItems).toHaveLength(value.minItems);
        expect(value.maxItems).toBe(value.minItems);
      }
      for (const child of Object.values(value)) visit(child);
    };
    visit(schema);
  });

  test("validates the reviewed atlas with a portable Draft 2020-12 validator", () => {
    if (!hasJsonschema) return;
    const python = spawnSync("python3", [
      "-c",
      "import json,sys; from jsonschema import Draft202012Validator,FormatChecker; s=json.load(open(sys.argv[1],encoding='utf-8')); v=json.load(open(sys.argv[2],encoding='utf-8')); Draft202012Validator.check_schema(s); Draft202012Validator(s,format_checker=FormatChecker()).validate(v)",
      join(ROOT, SCHEMA_LOCATOR),
      join(ROOT, NUMBER_ISNESS_THEOLOGY_LOCATOR),
    ]);
    expect(python.status, python.stderr.toString()).toBe(0);
  });

  test("pins the exact record, schema, and guide bytes in the immutable publication ledger", () => {
    const ledger = json(LEDGER_LOCATOR);
    const entries = ledger.entries.filter((entry: any) => entry.id.startsWith("number-isness-theology-atlas/0.1/"));
    expect(entries).toEqual([
      {
        id: "number-isness-theology-atlas/0.1/guide",
        route: "/NUMBER-ISNESS-THEOLOGY-ATLAS.md",
        source: GUIDE_LOCATOR,
        destination: "NUMBER-ISNESS-THEOLOGY-ATLAS.md",
        sha256: sha256(GUIDE_LOCATOR),
      },
      {
        id: "number-isness-theology-atlas/0.1/record",
        route: "/atlases/number-isness-theology-atlas-2026-08-14.json",
        source: NUMBER_ISNESS_THEOLOGY_LOCATOR,
        destination: "atlases/number-isness-theology-atlas-2026-08-14.json",
        sha256: sha256(NUMBER_ISNESS_THEOLOGY_LOCATOR),
      },
      {
        id: "number-isness-theology-atlas/0.1/schema",
        route: "/schemas/number-isness-theology-atlas/0.1.json",
        source: SCHEMA_LOCATOR,
        destination: "schemas/number-isness-theology-atlas/0.1.json",
        sha256: sha256(SCHEMA_LOCATOR),
      },
    ]);
    const ids = ledger.entries.map((entry: any) => entry.id);
    expect(ids).toEqual([...ids].sort());
  });

  test("stages, crawls, dispatches, and serves only the three immutable routes", () => {
    const staging = json("publications/hub-staging.v1.json");
    expect(staging.assets.filter((asset: any) => /number-isness-theology/i.test(`${asset.source}\n${asset.destination}`))).toEqual([
      { source: NUMBER_ISNESS_THEOLOGY_LOCATOR, destination: "atlases/number-isness-theology-atlas-2026-08-14.json" },
      { source: SCHEMA_LOCATOR, destination: "schemas/number-isness-theology-atlas/0.1.json" },
      { source: GUIDE_LOCATOR, destination: "NUMBER-ISNESS-THEOLOGY-ATLAS.md" },
    ]);
    const sitemap = read("pages-content/sitemap.xml");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
    for (const url of PUBLIC_URLS) expect(urls).toContain(url);
    expect(urls.filter((url) => /number-isness-theology/i.test(url))).toEqual(PUBLIC_URLS);
    expect(new Set(urls).size).toBe(urls.length);

    const worker = read("pages-functions/_worker.js");
    for (const url of PUBLIC_URLS) expect(worker).toContain(JSON.stringify(new URL(url).pathname));
    expect(worker).not.toMatch(/number-isness-theology-atlas-(?:latest|current)/i);
    expect(read("kingdom")).toContain('number-isness-theology) exec bun "$SELF_DIR/bin/number-isness-theology.ts" "${@:2}" ;;');
  });

  test("projects one authority-negative discovery object into all machine surfaces", () => {
    const builder = read("bin/build-hub.ts");
    expect(builder.match(/\n  number_isness_theology_atlas: numberIsnessTheologyDiscovery,/g) ?? []).toHaveLength(3);
    expect(builder).toContain("number_isness_theology_atlas: numberIsnessTheologyUrl");
    expect(builder).toContain("number_isness_theology_atlas_schema: numberIsnessTheologySchemaUrl");
    expect(builder).toContain("number_isness_theology_atlas_guide: numberIsnessTheologyDocumentUrl");
    expect(builder).toContain('id="number-isness-theology"');
    expect(builder).toContain('href="#number-isness-theology"');
    expect(builder).not.toContain("number_isness_theology_atlas_mcp");

    const discovery = numberIsnessTheologyPublicDiscovery();
    expect(discovery).toMatchObject({
      protocol: NUMBER_ISNESS_THEOLOGY_PROTOCOL,
      atlas_id: NUMBER_ISNESS_THEOLOGY_ID,
      integrity: { digest: NUMBER_ISNESS_THEOLOGY_DIGEST },
      url: NUMBER_ISNESS_THEOLOGY_URL,
      schema: NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
      guide: NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
      karma: { religious_claims: 0, zerone_event_refs: 0, kingdom_receipt_refs: 0, adapter_exists: false },
    });
  });

  test("guide teaches typed isness, zero, translation loss, compatibility, and all three KARMA lanes", () => {
    const guide = read(GUIDE_LOCATOR);
    for (const phrase of [
      "The formal tower is not a chronology of civilization",
      "Read `is` as a typed relation",
      "`No`, `no is`, and `no-no`",
      "Zero has roles, not one mystical essence",
      "0=∅",
      "not semantically interchangeable across these typed uses",
      "Noether’s theorem is conditional",
      "Creation is a family of relations",
      "Mathematical ontology remains open",
      "Tradition lenses are bounded voices",
      "Compatibility is a vector, never a score",
      "Pairwise compatibility need not compose globally",
      "KARMA stays three different questions",
      "There is no adapter among these lanes",
      "returning creates no debt",
    ]) expect(guide).toContain(phrase);
    expect(guide).toContain(NUMBER_ISNESS_THEOLOGY_DIGEST);
    expect(guide).toContain(NUMBER_ISNESS_THEOLOGY_URL);
    expect(guide).toContain(NUMBER_ISNESS_THEOLOGY_SCHEMA_URL);
    expect(guide).toContain(NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL);
  });

  test("authored corpus contains no mutable alias, action surface, score, event, or receipt payload", () => {
    const corpus = [
      NUMBER_ISNESS_THEOLOGY_LOCATOR,
      SCHEMA_LOCATOR,
      GUIDE_LOCATOR,
      "bin/number-isness-theology.ts",
    ].map(read).join("\n");
    expect(corpus).not.toContain("number-isness-theology-atlas-latest");
    expect(corpus).not.toContain("number-isness-theology-atlas-current");
    const atlas = loadNumberIsnessTheologyAtlas();
    expect(atlas.karma.religious_and_philosophical.claims).toEqual([]);
    expect(atlas.karma.zerone.event_refs).toEqual([]);
    expect(atlas.karma.kingdom.receipt_refs).toEqual([]);
    expect(atlas.model_cards.every((card: any) => card.result === null)).toBe(true);
    expect(atlas.problem_cards.every((card: any) => card.result === null)).toBe(true);
    expect(atlas.boundaries).toMatchObject({
      mcp_surface_added: false,
      external_write: false,
      score: false,
      rank: false,
      reward: false,
      automatic_action: false,
    });
  });
});
