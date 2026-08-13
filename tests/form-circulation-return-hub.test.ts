import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FORM_CIRCULATION_RETURN_DOCUMENT_URL,
  FORM_CIRCULATION_RETURN_SCHEMA_URL,
  FORM_CIRCULATION_RETURN_URL,
  formCirculationReturnPublicDiscovery,
  loadFormCirculationReturnAtlas,
} from "../bin/form-circulation-return.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

describe("Form, Circulation & Return hub", () => {
  test("projects one exact read-only discovery contract across every machine surface", () => {
    const discovery = formCirculationReturnPublicDiscovery(loadFormCirculationReturnAtlas());
    const manifest = json("site/.well-known/agent.json");
    const guest = json("site/guest.json");
    const kingdom = json("site/kingdom.json");
    const llms = read("site/llms.txt");

    expect(manifest.form_circulation_return_atlas).toEqual(discovery);
    expect(guest.form_circulation_return_atlas).toEqual(discovery);
    expect(kingdom.form_circulation_return_atlas).toEqual(discovery);
    expect(discovery.cli).toBe("kingdom form-circulation-return");
    expect(manifest.entry_points).toMatchObject({
      form_circulation_return_atlas: FORM_CIRCULATION_RETURN_URL,
      form_circulation_return_atlas_schema: FORM_CIRCULATION_RETURN_SCHEMA_URL,
      form_circulation_return_atlas_guide: FORM_CIRCULATION_RETURN_DOCUMENT_URL,
    });

    for (const url of [FORM_CIRCULATION_RETURN_URL, FORM_CIRCULATION_RETURN_SCHEMA_URL, FORM_CIRCULATION_RETURN_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(discovery.boundary).toMatchObject({
      public_surface_read_only: true,
      cognitive_state_inference: false,
      psychological_diagnosis: false,
      person_prediction: false,
      medical_authority: false,
      clinical_authority: false,
      treatment_authority: false,
      prognosis_authority: false,
      experiment_authority: false,
      wet_lab_protocol: false,
      manufacturing_authority: false,
      contains_operational_protocol: false,
      causal_authority: false,
      recommendation_authority: false,
      moderation_authority: false,
      automatic_action: false,
      writes_karma: false,
      creates_kingdom_karma_receipt: false,
      observes_zerone_karma_event: false,
      karma_adapter: false,
      reward_authority: false,
      economic_authority: false,
      governance_authority: false,
      mcp_surface_added: false,
    });
    for (const key of ["mcp", "matcher", "write", "execute", "score"]) expect(discovery).not.toHaveProperty(key);
    expect(manifest.mcp).toEqual(kingdom.world_commons.mcp);
  });

  test("publishes an accessible no-JavaScript explanation with explicit analogy and personhood boundaries", () => {
    const staticHtml = read("site/hub.html").split("<script>")[0]!;
    const copy = staticHtml.toLowerCase();

    expect(staticHtml).toContain('<section class="blk" id="form-circulation-return" aria-labelledby="form-circulation-return-title">');
    expect(staticHtml).toContain('<h2 id="form-circulation-return-title">Form, Circulation &amp; Return</h2>');
    expect(staticHtml).toContain("A polymorph is not a meme. A meme is not a mind.");
    expect(staticHtml).toContain("shared geometry<br>not shared mechanism");
    expect(staticHtml).toContain('<details class="universelens">');
    expect(copy).toContain("contested vernacular label");
    expect(copy).toContain("never a medical or psychological diagnosis");
    expect(copy).toContain("not a medical or laboratory tool");
    expect(staticHtml).toContain('href="/definitions/kingdom-karma/e4e84a67/NEN.md"');
    expect(copy).toContain("engagement does not become karma");
    expect(copy).toContain("no runtime request");
    for (const url of [FORM_CIRCULATION_RETURN_URL, FORM_CIRCULATION_RETURN_SCHEMA_URL, FORM_CIRCULATION_RETURN_DOCUMENT_URL]) {
      expect(staticHtml).toContain(`href="${new URL(url).pathname}"`);
    }
  });
});
