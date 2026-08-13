import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RARE_PATHWAY_DIGEST,
  RARE_PATHWAY_DOCUMENT_URL,
  RARE_PATHWAY_ID,
  RARE_PATHWAY_PROTOCOL,
  RARE_PATHWAY_SCHEMA_URL,
  RARE_PATHWAY_URL,
  rarePathwayPublicDiscovery,
} from "../bin/rare-pathway.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const bytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => bytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");

describe("The Vanishing Path publication", () => {
  test("stages one immutable authored triplet without a mutable alias", () => {
    expect(HUB_ASSETS).toHaveLength(63);
    expect(HUB_ASSETS).toContainEqual({ source: "data/challenges/vanishing-path.v1.json", destination: "challenges/vanishing-path-2026-08-13.json" });
    expect(HUB_ASSETS).toContainEqual({ source: "schemas/rare-pathway-challenge-v1.schema.json", destination: "schemas/rare-pathway-challenge/1.json" });
    expect(HUB_ASSETS).toContainEqual({ source: "references/rare-pathway-challenge.md", destination: "VANISHING-PATH.md" });
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("challenges/"))).toHaveLength(1);
    expect(HUB_ASSETS.some(({ destination }) => /challenges\/(?:latest|current)\.json/.test(destination))).toBe(false);
    expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/challenges/"))).toBe(false);
  });

  test("pins the triplet in the append-only publication ledger", () => {
    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(44);
    const expected = [
      ["rare-pathway-challenge/1/guide", "/VANISHING-PATH.md", "references/rare-pathway-challenge.md", "VANISHING-PATH.md"],
      ["rare-pathway-challenge/1/record", "/challenges/vanishing-path-2026-08-13.json", "data/challenges/vanishing-path.v1.json", "challenges/vanishing-path-2026-08-13.json"],
      ["rare-pathway-challenge/1/schema", "/schemas/rare-pathway-challenge/1.json", "schemas/rare-pathway-challenge-v1.schema.json", "schemas/rare-pathway-challenge/1.json"],
    ];
    for (const [id, route, source, destination] of expected) {
      expect(ledger.entries.find((entry: any) => entry.id === id)).toEqual({
        id,
        route,
        source,
        destination,
        sha256: sha256(source),
      });
    }
  });

  test("binds schema identity, digest, cardinalities, and nested object closure", () => {
    const record = json("data/challenges/vanishing-path.v1.json");
    const schema = json("schemas/rare-pathway-challenge-v1.schema.json");
    expect(record).toMatchObject({
      protocol: RARE_PATHWAY_PROTOCOL,
      challenge_id: RARE_PATHWAY_ID,
      integrity: { digest: RARE_PATHWAY_DIGEST },
    });
    expect(schema.$id).toBe(record.$schema);
    expect(schema.properties.protocol.const).toBe(RARE_PATHWAY_PROTOCOL);
    expect(schema.properties.challenge_id.const).toBe(RARE_PATHWAY_ID);
    expect(schema.properties.integrity.const.digest).toBe(RARE_PATHWAY_DIGEST);
    expect(schema.properties.models).toMatchObject({ minItems: 7, maxItems: 7 });
    expect(schema.properties.sources).toMatchObject({ minItems: 11, maxItems: 11 });
    const visit = (value: any) => {
      if (!value || typeof value !== "object") return;
      if (value.type === "object") expect(value.additionalProperties).toBe(false);
      for (const child of Object.values(value)) visit(child);
    };
    visit(schema);
  });

  test("projects coherent read-only discovery across machine and human surfaces", () => {
    const discovery = rarePathwayPublicDiscovery();
    const manifest = json("site/.well-known/agent.json");
    const guest = json("site/guest.json");
    const kingdom = json("site/kingdom.json");
    const llms = read("site/llms.txt");
    const html = read("site/hub.html");
    const sitemap = read("pages-content/sitemap.xml");
    expect(manifest.rare_pathway_challenge).toEqual(discovery);
    expect(guest.rare_pathway_challenge).toEqual(discovery);
    expect(kingdom.rare_pathway_challenge).toEqual(discovery);
    expect(manifest.entry_points).toMatchObject({
      rare_pathway_challenge: RARE_PATHWAY_URL,
      rare_pathway_challenge_schema: RARE_PATHWAY_SCHEMA_URL,
      rare_pathway_challenge_guide: RARE_PATHWAY_DOCUMENT_URL,
    });
    for (const url of [RARE_PATHWAY_URL, RARE_PATHWAY_SCHEMA_URL, RARE_PATHWAY_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
      expect(html).toContain(`href="${new URL(url).pathname}"`);
      expect(sitemap).toContain(`<loc>${url}</loc>`);
    }
    expect(html).toContain('id="vanishing-path"');
    expect(html).toContain("BUILD / PLAY / REVISE / STOP evaluates the practice, never the person");
    expect(manifest.mcp).toEqual(kingdom.world_commons.mcp);
  });

  test("publishes an opt-in skill without silently manifesting a Nen ability", () => {
    const skill = read("skills/reason-about-rare-pathways/SKILL.md");
    const provider = read("skills/reason-about-rare-pathways/agents/openai.yaml");
    const nen = read("NEN.md");
    expect(skill).toContain("BUILD");
    expect(skill).toContain("PLAY");
    expect(skill).toContain("Do not score `understanding versus pride`");
    expect(skill).toContain("does not prove identity");
    expect(provider).toContain("allow_implicit_invocation: false");
    expect(Bun.file(join(ROOT, "skills/reason-about-rare-pathways/ability.json")).size).toBe(0);
    expect(nen).toContain("Ten manifested skills and one Ging path");
  });

  test("guide keeps mathematics, construction, play, rights, and physical authority separate", () => {
    const guide = read("references/rare-pathway-challenge.md");
    for (const phrase of [
      "not observed is not the same as impossible",
      "zero target winners",
      "batch-level winning",
      "BUILD",
      "PLAY",
      "REVISE",
      "STOP",
      "cannot infer a person's private motive",
      "Play needs no productivity costume",
      "orientation, not proof",
      "not fitted to ritonavir",
    ]) expect(guide).toContain(phrase);
  });
});
