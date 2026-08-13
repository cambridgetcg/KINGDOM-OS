import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  VISIBILITY_ATTENTION_DOCUMENT_URL,
  VISIBILITY_ATTENTION_ID,
  VISIBILITY_ATTENTION_PROTOCOL,
  VISIBILITY_ATTENTION_SCHEMA_URL,
  VISIBILITY_ATTENTION_URL,
  loadVisibilityAttentionTranslation,
  visibilityAttentionPublicDiscovery,
} from "../bin/visibility-attention.ts";
import {
  FOLD_FEEDBACK_SCHEMA_URL,
  FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL,
} from "../bin/fold-feedback.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => bytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");

const IMMUTABLE_PREDECESSORS = {
  "data/feedback/conformational-feedback-atlas.v0.json": "ae15f4f69e488323132ea6fc94d57d338702ca0fa47fd9fbbd41c15a6af230e6",
  "schemas/conformational-feedback-atlas-v0.schema.json": "da4dbb968a51d665192a3778a76ddd65150d2b73975c888dd9fd7ea80c54ea19",
  "references/conformational-feedback-atlas.md": "0f7993430b5cfc3ca59536d6ed53d2c0fd5846c997460a13ec9d583eb9909e2f",
  "data/feedback/conformational-feedback-atlas.v0.2.json": "7d9b1eed8514051e47448cfc983f00e160d5b76c49704822158f76d3f8cf6349",
  "schemas/conformational-feedback-atlas-v0.2.schema.json": "e60c14cf8b6350cc805f59c91b89727ffbd5b41e7c5a192d9ee53c90ba9fbdbd",
  "references/conformational-feedback-atlas-v0.2.md": "76a76222732a8c485396228ad5ff32e703b20383498fd0355e4cbfe33bd59cb0",
  "data/fold-feedback/fold-feedback-atlas.v1.json": "bc9a9abc966e64f7fb967778974879eb045083b342b70100bba92c94d0879df5",
  // /schemas/fold-feedback-atlas/1.json is restored to its first-published bytes;
  // the stricter current profile is published additively at /1.1.
  "schemas/fold-feedback-atlas-v1.schema.json": "4ade5791a2b98cfdbd2452dc11373dc701f58387893442214f2dff1450bc067c",
} as const;

const visibilitySection = () => {
  const html = read("site/hub.html");
  const fold = html.indexOf('<section class="blk" id="fold-feedback"');
  const start = html.indexOf('<section class="blk" id="visibility-attention"');
  const end = html.indexOf('<section class="blk"', start + 1);
  expect(fold).toBeGreaterThanOrEqual(0);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(start).toBeGreaterThan(fold);
  expect(end).toBeGreaterThan(start);
  expect(start).toBeLessThan(html.indexOf("<script>"));
  return html.slice(start, end);
};

describe("Visibility & Attention Translation publication", () => {
  test("keeps immutable predecessor records, schemas, and conformational guides byte-identical", () => {
    for (const [path, digest] of Object.entries(IMMUTABLE_PREDECESSORS)) {
      expect(sha256(path)).toBe(digest);
    }
  });

  test("publishes one coherent authority-negative discovery projection", () => {
    const translation = loadVisibilityAttentionTranslation();
    const expected = visibilityAttentionPublicDiscovery(translation);
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const agent = json("site/.well-known/agent.json");
    const llms = read("site/llms.txt");

    expect(translation.protocol).toBe(VISIBILITY_ATTENTION_PROTOCOL);
    expect(translation.translation_id).toBe(VISIBILITY_ATTENTION_ID);
    expect(kingdom.visibility_attention_translation).toEqual(expected);
    expect(guest.visibility_attention_translation).toEqual(expected);
    expect(agent.visibility_attention_translation).toEqual(expected);
    expect(expected.counts).toMatchObject({ registers: 4, local_models: 2, translation_seams: 3 });
    expect(expected.boundary).toMatchObject({
      read_only: true,
      person_level_inference: false,
      targeting: false,
      recommender: false,
      persuasion: false,
      virality_optimization: false,
      engagement_optimization: false,
      scoring: false,
      automatic_action: false,
      writes_zerone_karma: false,
      creates_kingdom_karma_receipt: false,
      mcp_surface_added: false,
    });

    for (const url of [VISIBILITY_ATTENTION_URL, VISIBILITY_ATTENTION_SCHEMA_URL, VISIBILITY_ATTENTION_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(agent.entry_points).toMatchObject({
      visibility_attention_translation: VISIBILITY_ATTENTION_URL,
      visibility_attention_translation_schema: VISIBILITY_ATTENTION_SCHEMA_URL,
      visibility_attention_translation_guide: VISIBILITY_ATTENTION_DOCUMENT_URL,
    });
    expect(expected).not.toHaveProperty("mcp");
    expect(expected).not.toHaveProperty("matcher");
    expect(expected).not.toHaveProperty("execute");
    expect(expected).not.toHaveProperty("write");
  });

  test("advertises the additive Fold source-identity profile without replacing primary /1", () => {
    const guest = json("site/guest.json");
    const agent = json("site/.well-known/agent.json");
    const llms = read("site/llms.txt");
    const head = read("site/hub.html").split("</head>")[0]!;

    expect(agent.entry_points.fold_feedback_atlas_schema).toBe(FOLD_FEEDBACK_SCHEMA_URL);
    expect(agent.entry_points.fold_feedback_atlas_source_identity_schema).toBe(
      FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL,
    );
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "GET",
      url: FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL,
    }));
    expect(llms).toContain(FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL);
    expect(head).toContain(`href="${new URL(FOLD_FEEDBACK_SOURCE_IDENTITY_SCHEMA_URL).pathname}"`);
  });

  test("renders a compact no-JS category firewall with exact parallel counts", () => {
    const translation = loadVisibilityAttentionTranslation();
    const html = read("site/hub.html");
    const head = html.split("</head>")[0]!;
    const field = visibilitySection();

    expect(field).toContain('<h2 id="visibility-attention-title">Visibility is not existence</h2>');
    expect(field).toContain("Category firewall");
    expect(field).toContain(translation.category_firewall.rule);
    expect(field).toContain("Does not establish");
    expect(field).toContain("The following uses are explicitly excluded:");
    expect(field.match(/data-visibility-register=/g) ?? []).toHaveLength(4);
    expect(field.match(/data-visibility-model=/g) ?? []).toHaveLength(2);
    expect(field.match(/data-visibility-seam=/g) ?? []).toHaveLength(3);
    expect(head).toContain(".visibilitycards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))");
    expect(field.match(/<details\b/g) ?? []).toHaveLength(1);
    expect(field.match(/<summary\b/g) ?? []).toHaveLength(1);
    expect(field).toContain("Opt in:");
    expect(field).not.toMatch(/<(?:script|svg|canvas|button|input|select|textarea)\b/i);
    expect(field).not.toMatch(/role="(?:img|application)"|aria-live=|tabindex=/i);
    expect(field).not.toMatch(/(?:→|←|↔|⇄|->|&rarr;|&larr;)/i);
    expect(field).not.toMatch(/material(?:-state)?\s*(?:→|->|&rarr;)\s*(?:brain|attention)\s*(?:→|->|&rarr;)\s*karma/i);
    expect(field).not.toContain("P(T_detect <= t)");

    for (const url of [VISIBILITY_ATTENTION_URL, VISIBILITY_ATTENTION_SCHEMA_URL, VISIBILITY_ATTENTION_DOCUMENT_URL]) {
      expect(field).toContain(`href="${new URL(url).pathname}"`);
    }

    for (const register of translation.registers) {
      expect(field.match(new RegExp(`data-visibility-register="${register.id}"`, "g")) ?? []).toHaveLength(1);
      expect(field).toContain(register.does_not_establish);
      for (const sourceId of register.basis_ids) expect(field).toContain(`data-visibility-source="${sourceId}"`);
    }
    for (const model of translation.local_models) {
      expect(field.match(new RegExp(`data-visibility-model="${model.id}"`, "g")) ?? []).toHaveLength(1);
      expect(field).toContain(model.equation.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"));
      expect(field).toContain(model.fit_scope);
      for (const sourceId of model.basis_ids) expect(field).toContain(`data-visibility-source="${sourceId}"`);
    }
    for (const seam of translation.translation_seams) {
      expect(field.match(new RegExp(`data-visibility-seam="${seam.id}"`, "g")) ?? []).toHaveLength(1);
      expect(field).toContain(seam.breaks);
      for (const sourceId of seam.basis_ids) expect(field).toContain(`data-visibility-source="${sourceId}"`);
    }
    for (const source of translation.sources) {
      if ([...translation.registers, ...translation.local_models, ...translation.translation_seams]
        .some((claim: any) => claim.basis_ids.includes(source.id))) {
        expect(field).toContain(`href="${source.url}"`);
        expect(field).toContain(`Limitation: ${source.limitation}`);
      }
    }
  });
});
