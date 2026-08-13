import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FOLD_FEEDBACK_DOCUMENT_URL,
  FOLD_FEEDBACK_ID,
  FOLD_FEEDBACK_PROTOCOL,
  FOLD_FEEDBACK_SCHEMA_URL,
  FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL,
  FOLD_FEEDBACK_URL,
  foldFeedbackPublicDiscovery,
  loadFoldFeedbackAtlas,
} from "../bin/fold-feedback.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

describe("Fold & Feedback Atlas publication", () => {
  test("stages one immutable authored atlas, schema, and guide without a mutable alias", () => {
    expect(HUB_ASSETS).toContainEqual({
      source: "data/fold-feedback/fold-feedback-atlas.v1.json",
      destination: "atlases/fold-feedback-atlas-2026-08-12.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "schemas/fold-feedback-atlas-v1.schema.json",
      destination: "schemas/fold-feedback-atlas/1.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "schemas/fold-feedback-atlas-v1.1.schema.json",
      destination: "schemas/fold-feedback-atlas/1.1.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "references/fold-feedback-atlas.md",
      destination: "FOLD-FEEDBACK-ATLAS.md",
    });
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/"))).toHaveLength(7);
    expect(HUB_ASSETS.some(({ destination }) => /atlases\/(?:latest|current)\.json/.test(destination))).toBe(false);
    expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/atlases/"))).toBe(false);
  });

  test("binds the portable schema to the authored atlas identity", () => {
    const atlas = loadFoldFeedbackAtlas();
    const schema = json("schemas/fold-feedback-atlas-v1.schema.json");

    expect(atlas.protocol).toBe(FOLD_FEEDBACK_PROTOCOL);
    expect(atlas.atlas_id).toBe(FOLD_FEEDBACK_ID);
    expect(schema.$id).toBe(atlas.$schema);
    expect(schema.properties.protocol.const).toBe(FOLD_FEEDBACK_PROTOCOL);
    expect(schema.properties.atlas_id.const).toBe(FOLD_FEEDBACK_ID);
  });

  test("projects one coherent, read-only and consequence-edge-negative discovery contract", () => {
    const atlas = loadFoldFeedbackAtlas();
    const discovery = foldFeedbackPublicDiscovery(atlas);
    const manifest = json("site/.well-known/agent.json");
    const guest = json("site/guest.json");
    const kingdom = json("site/kingdom.json");
    const llms = read("site/llms.txt");

    expect(manifest.fold_feedback_atlas).toEqual(discovery);
    expect(guest.fold_feedback_atlas).toEqual(discovery);
    expect(kingdom.fold_feedback_atlas).toEqual(discovery);
    expect(discovery).toMatchObject({
      protocol: FOLD_FEEDBACK_PROTOCOL,
      atlas_id: FOLD_FEEDBACK_ID,
      url: FOLD_FEEDBACK_URL,
      schema: FOLD_FEEDBACK_SCHEMA_URL,
      source_identity_schema: FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL,
      guide: FOLD_FEEDBACK_DOCUMENT_URL,
      boundary: {
        public_surface_read_only: true,
        medical_advice: false,
        experiment_authority: false,
        automatic_action: false,
        writes_karma: false,
        creates_kingdom_karma_receipt: false,
        observes_zerone_karma_event: false,
      },
    });
    for (const url of [FOLD_FEEDBACK_URL, FOLD_FEEDBACK_SCHEMA_URL, FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL, FOLD_FEEDBACK_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      fold_feedback_atlas: FOLD_FEEDBACK_URL,
      fold_feedback_atlas_schema: FOLD_FEEDBACK_SCHEMA_URL,
      fold_feedback_atlas_source_identity_schema: FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL,
      fold_feedback_atlas_guide: FOLD_FEEDBACK_DOCUMENT_URL,
    });
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
    expect(discovery).not.toHaveProperty("write");
    expect(manifest.mcp).toEqual(kingdom.world_commons.mcp);
  });

  test("advertises all three public resources in no-JS HTML and the crawl surface", () => {
    const staticHtml = read("site/hub.html").split("<script>")[0]!;
    const copy = staticHtml.toLowerCase();
    const sitemap = read("pages-content/sitemap.xml");

    for (const publicUrl of [FOLD_FEEDBACK_URL, FOLD_FEEDBACK_SCHEMA_URL, FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL, FOLD_FEEDBACK_DOCUMENT_URL]) {
      const path = new URL(publicUrl).pathname;
      expect(staticHtml).toContain(`href="${path}"`);
      expect(sitemap).toContain(`<loc>${publicUrl}</loc>`);
    }
    expect(copy).toContain("protein folding");
    expect(copy).toContain("prion");
    expect(copy).toContain("karma");
    expect(copy).toContain("not medical advice");
    expect(staticHtml).toContain('<section class="blk" id="fold-feedback" aria-labelledby="fold-feedback-title">');
    expect(staticHtml).toContain('<h2 id="fold-feedback-title">Fold &amp; Feedback Atlas</h2>');
    expect(staticHtml).toContain('aria-labelledby="fold-map-title" aria-describedby="fold-map-note"');
    expect(staticHtml).toContain('<details class="universelens">');
    expect(staticHtml).toContain("Two systems, not one");
    expect(staticHtml).toContain("No adapter exists here");
  });
});
