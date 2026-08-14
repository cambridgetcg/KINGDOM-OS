import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CULTURAL_ATTENTION_FEEDBACK_DIGEST,
  CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
  CULTURAL_ATTENTION_FEEDBACK_ID,
  CULTURAL_ATTENTION_FEEDBACK_LOCATOR,
  CULTURAL_ATTENTION_FEEDBACK_PATH,
  CULTURAL_ATTENTION_FEEDBACK_PROTOCOL,
  CULTURAL_ATTENTION_FEEDBACK_SCHEMA_ID,
  CULTURAL_ATTENTION_FEEDBACK_SCHEMA_LOCATOR,
  CULTURAL_ATTENTION_FEEDBACK_SCHEMA_PATH,
  CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
  CULTURAL_ATTENTION_FEEDBACK_URL,
  culturalAttentionFeedbackPublicDiscovery,
  loadCulturalAttentionFeedbackAtlas,
} from "../bin/cultural-attention-feedback.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

const RECORD_DESTINATION = new URL(CULTURAL_ATTENTION_FEEDBACK_URL).pathname.slice(1);
const SCHEMA_DESTINATION = new URL(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL).pathname.slice(1);
const DOCUMENT_DESTINATION = new URL(CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL).pathname.slice(1);

const PUBLIC_TRIPLET = [
  {
    source: "data/cultural-feedback/cultural-attention-feedback-atlas.v1.json",
    destination: "atlases/cultural-attention-feedback-atlas-2026-08-13.json",
  },
  {
    source: "schemas/cultural-attention-feedback-atlas-v1.schema.json",
    destination: "schemas/cultural-attention-feedback-atlas/1.json",
  },
  {
    source: "references/cultural-attention-feedback-atlas.md",
    destination: "CULTURAL-ATTENTION-FEEDBACK-ATLAS.md",
  },
] as const;

describe("Cultural Attention & Feedback Atlas publication", () => {
  test("stages one immutable authored record, schema, and guide without mutable aliases", () => {
    expect(CULTURAL_ATTENTION_FEEDBACK_LOCATOR).toBe(PUBLIC_TRIPLET[0].source);
    expect(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_LOCATOR).toBe(PUBLIC_TRIPLET[1].source);
    expect(CULTURAL_ATTENTION_FEEDBACK_PATH).toBe(join(ROOT, CULTURAL_ATTENTION_FEEDBACK_LOCATOR));
    expect(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_PATH).toBe(join(ROOT, CULTURAL_ATTENTION_FEEDBACK_SCHEMA_LOCATOR));
    expect([RECORD_DESTINATION, SCHEMA_DESTINATION, DOCUMENT_DESTINATION]).toEqual(
      PUBLIC_TRIPLET.map(({ destination }) => destination),
    );

    for (const asset of PUBLIC_TRIPLET) {
      expect(HUB_ASSETS.filter(({ destination }) => destination === asset.destination)).toEqual([asset]);
    }

    const atlasDestinations = HUB_ASSETS
      .map(({ destination }) => destination)
      .filter((destination) => destination.startsWith("atlases/"));
    expect(atlasDestinations.filter((destination) => destination === RECORD_DESTINATION)).toHaveLength(1);
    expect(atlasDestinations.some((destination) =>
      /(?:^|[-/])(?:latest|current)(?:\.json)?$/.test(destination))).toBe(false);
    expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/atlases/"))).toBe(false);
    expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/schemas/cultural-attention-feedback-atlas/"))).toBe(false);
  });

  test("binds the closed portable schema and reviewed semantic digest to one atlas identity", () => {
    const atlas = loadCulturalAttentionFeedbackAtlas();
    const schema = json(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_LOCATOR);

    expect(atlas.protocol).toBe(CULTURAL_ATTENTION_FEEDBACK_PROTOCOL);
    expect(atlas.atlas_id).toBe(CULTURAL_ATTENTION_FEEDBACK_ID);
    expect(atlas.$schema).toBe(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_ID);
    expect(atlas.integrity.digest).toBe(CULTURAL_ATTENTION_FEEDBACK_DIGEST);
    expect(schema.$id).toBe(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_ID);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.$schema.const).toBe(CULTURAL_ATTENTION_FEEDBACK_SCHEMA_ID);
    expect(schema.properties.protocol.const).toBe(CULTURAL_ATTENTION_FEEDBACK_PROTOCOL);
    expect(schema.properties.atlas_id.const).toBe(CULTURAL_ATTENTION_FEEDBACK_ID);
    expect(schema.properties.integrity.properties.digest.const).toBe(CULTURAL_ATTENTION_FEEDBACK_DIGEST);

    expect(atlas.source_bindings.every(({ mutated, authority_imported }: any) =>
      mutated === false && authority_imported === false)).toBe(true);
    expect(atlas.translations.every(({ relation, causal_transfer, universal, authority_effect }: any) =>
      relation === "bounded-analogy-not-same-as" &&
      causal_transfer === false &&
      universal === false &&
      authority_effect === "NONE")).toBe(true);
    expect(atlas.ecosystem_bridges.every((bridge: any) =>
      bridge.mode === "LINK_ONLY" &&
      bridge.runtime_request === false &&
      bridge.imported === false &&
      bridge.mutated === false &&
      bridge.authority_imported === false &&
      bridge.authority_effect === "NONE" &&
      bridge.write_authorized === false &&
      bridge.automatic_action === false)).toBe(true);
  });

  test("publishes one coherent authority-negative projection on every generated machine surface", () => {
    const atlas = loadCulturalAttentionFeedbackAtlas();
    const discovery = culturalAttentionFeedbackPublicDiscovery(atlas);
    const manifest = json("site/.well-known/agent.json");
    const guest = json("site/guest.json");
    const kingdom = json("site/kingdom.json");

    expect(manifest.cultural_attention_feedback_atlas).toEqual(discovery);
    expect(guest.cultural_attention_feedback_atlas).toEqual(discovery);
    expect(kingdom.cultural_attention_feedback_atlas).toEqual(discovery);
    expect(discovery).toMatchObject({
      protocol: CULTURAL_ATTENTION_FEEDBACK_PROTOCOL,
      atlas_id: CULTURAL_ATTENTION_FEEDBACK_ID,
      url: CULTURAL_ATTENTION_FEEDBACK_URL,
      schema: CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
      guide: CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
      integrity: { digest: CULTURAL_ATTENTION_FEEDBACK_DIGEST },
      karma: {
        zerone_event_status: "not_observed",
        zerone_event_refs: 0,
        kingdom_receipt_status: "not_created",
        kingdom_receipt_refs: 0,
        adapter_exists: false,
      },
      boundary: {
        educational_metadata_only: true,
        public_surface_read_only: true,
        contains_operational_protocol: false,
        contains_personal_data: false,
        cultural_label_is_diagnosis: false,
        meme_is_crystal: false,
        meme_is_prion: false,
        meme_is_gene: false,
        attention_is_consent: false,
        engagement_is_welfare: false,
        popularity_is_truth: false,
        popularity_is_merit: false,
        feedback_is_moral_value: false,
        feedback_is_optimization: false,
        person_scoring: false,
        runtime_ecosystem_request: false,
        ecosystem_write: false,
        writes_karma: false,
        creates_kingdom_karma_receipt: false,
        observes_zerone_karma_event: false,
        karma_adapter: false,
        medical_authority: false,
        clinical_authority: false,
        experiment_authority: false,
        manufacturing_authority: false,
        moderation_authority: false,
        recommendation_authority: false,
        engagement_optimization_authority: false,
        automatic_action: false,
        scientifically_proves_universe_design: false,
        scientifically_disproves_universe_design: false,
        scientifically_proves_cosmic_karma: false,
        universal_mechanism_claimed: false,
      },
    });

    expect(manifest.entry_points).toMatchObject({
      cultural_attention_feedback_atlas: CULTURAL_ATTENTION_FEEDBACK_URL,
      cultural_attention_feedback_atlas_schema: CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
      cultural_attention_feedback_atlas_guide: CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
    });
    for (const url of [
      CULTURAL_ATTENTION_FEEDBACK_URL,
      CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
      CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
    ]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
    }
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
    expect(discovery).not.toHaveProperty("write");
    expect(discovery).not.toHaveProperty("execute");
    expect(manifest.mcp).toEqual(kingdom.world_commons.mcp);
  });

  test("advertises the immutable triplet in root no-JavaScript HTML, sitemap, and llms", () => {
    const html = read("site/hub.html");
    const scriptStart = html.indexOf("<script>");
    const staticHtml = scriptStart < 0 ? html : html.slice(0, scriptStart);
    const sitemap = read("pages-content/sitemap.xml");
    const llms = read("site/llms.txt");

    expect(staticHtml).toContain('id="cultural-feedback"');
    expect(staticHtml).toContain('href="#cultural-feedback"');
    for (const publicUrl of [
      CULTURAL_ATTENTION_FEEDBACK_URL,
      CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
      CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
    ]) {
      expect(staticHtml).toContain(`href="${new URL(publicUrl).pathname}"`);
      expect(sitemap).toContain(`<loc>${publicUrl}</loc>`);
      expect(llms).toContain(publicUrl);
    }
    expect(sitemap.match(/<loc>/g)).toHaveLength(76);
  });
});
