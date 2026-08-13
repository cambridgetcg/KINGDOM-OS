import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FORM_CIRCULATION_RETURN_DIGEST,
  FORM_CIRCULATION_RETURN_DOCUMENT_URL,
  FORM_CIRCULATION_RETURN_ID,
  FORM_CIRCULATION_RETURN_PROTOCOL,
  FORM_CIRCULATION_RETURN_SCHEMA_URL,
  FORM_CIRCULATION_RETURN_URL,
  formCirculationReturnPublicDiscovery,
  loadFormCirculationReturnAtlas,
} from "../bin/form-circulation-return.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const bytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => bytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");

describe("Form, Circulation & Return publication", () => {
  test("stages one immutable authored triplet without latest or current aliases", () => {
    expect(HUB_ASSETS).toContainEqual({ source: "data/form-circulation-return/form-circulation-return-atlas.v1.json", destination: "atlases/form-circulation-return-atlas-2026-08-13.json" });
    expect(HUB_ASSETS).toContainEqual({ source: "schemas/form-circulation-return-atlas-v1.schema.json", destination: "schemas/form-circulation-return-atlas/1.json" });
    expect(HUB_ASSETS).toContainEqual({ source: "references/form-circulation-return-atlas.md", destination: "FORM-CIRCULATION-RETURN-ATLAS.md" });
    expect(HUB_ASSETS).toContainEqual({ source: "NEN.md", destination: "definitions/kingdom-karma/e4e84a67/NEN.md" });
    expect(sha256("NEN.md")).toBe("14b7d210d320fd716553992a7b874747b299f8907d15da14ac405cbfc496c446");
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/"))).toHaveLength(7);
    expect(HUB_ASSETS.some(({ destination }) => /atlases\/(?:latest|current)\.json/.test(destination))).toBe(false);
    expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/atlases/"))).toBe(false);
  });

  test("binds schema identity, reviewed digest, counts, and all nested object closure", () => {
    const atlas = loadFormCirculationReturnAtlas();
    const schema = json("schemas/form-circulation-return-atlas-v1.schema.json");
    expect(atlas).toMatchObject({ protocol: FORM_CIRCULATION_RETURN_PROTOCOL, atlas_id: FORM_CIRCULATION_RETURN_ID, integrity: { digest: FORM_CIRCULATION_RETURN_DIGEST } });
    expect(schema.$id).toBe(atlas.$schema);
    expect(schema.properties.protocol.const).toBe(FORM_CIRCULATION_RETURN_PROTOCOL);
    expect(schema.properties.atlas_id.const).toBe(FORM_CIRCULATION_RETURN_ID);
    expect(schema.properties.integrity.properties.digest.const).toBe(FORM_CIRCULATION_RETURN_DIGEST);
    expect(schema.properties.model_cards).toMatchObject({ minItems: 8, maxItems: 8, items: false });
    const visit = (value: any) => {
      if (!value || typeof value !== "object") return;
      if (value.type === "object") expect(value.additionalProperties).toBe(false);
      for (const child of Object.values(value)) visit(child);
    };
    visit(schema);
  });

  test("projects one exact read-only discovery contract and unchanged Commons MCP", () => {
    const discovery = formCirculationReturnPublicDiscovery();
    const manifest = json("site/.well-known/agent.json");
    const guest = json("site/guest.json");
    const kingdom = json("site/kingdom.json");
    const llms = read("site/llms.txt");
    expect(manifest.form_circulation_return_atlas).toEqual(discovery);
    expect(guest.form_circulation_return_atlas).toEqual(discovery);
    expect(kingdom.form_circulation_return_atlas).toEqual(discovery);
    expect(discovery).toMatchObject({
      url: FORM_CIRCULATION_RETURN_URL,
      schema: FORM_CIRCULATION_RETURN_SCHEMA_URL,
      guide: FORM_CIRCULATION_RETURN_DOCUMENT_URL,
      cli: "kingdom form-circulation-return",
      boundary: { public_surface_read_only: true, cognitive_state_inference: false, psychological_diagnosis: false, medical_authority: false, clinical_authority: false, treatment_authority: false, prognosis_authority: false, experiment_authority: false, wet_lab_protocol: false, manufacturing_authority: false, contains_operational_protocol: false, causal_authority: false, recommendation_authority: false, moderation_authority: false, automatic_action: false, writes_karma: false, reward_authority: false, economic_authority: false, governance_authority: false, mcp_surface_added: false },
    });
    for (const url of [FORM_CIRCULATION_RETURN_URL, FORM_CIRCULATION_RETURN_SCHEMA_URL, FORM_CIRCULATION_RETURN_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    for (const key of ["mcp", "matcher", "write", "execute", "score", "reward"]) expect(discovery).not.toHaveProperty(key);
    expect(manifest.mcp).toEqual(kingdom.world_commons.mcp);
  });

  test("advertises all resources and a static human explanation", () => {
    const staticHtml = read("site/hub.html").split("<script>")[0]!;
    const sitemap = read("pages-content/sitemap.xml");
    for (const publicUrl of [FORM_CIRCULATION_RETURN_URL, FORM_CIRCULATION_RETURN_SCHEMA_URL, FORM_CIRCULATION_RETURN_DOCUMENT_URL]) {
      expect(staticHtml).toContain(`href="${new URL(publicUrl).pathname}"`);
      expect(sitemap).toContain(`<loc>${publicUrl}</loc>`);
    }
    expect(staticHtml).toContain('<section class="blk" id="form-circulation-return" aria-labelledby="form-circulation-return-title">');
    expect(staticHtml).toContain("A polymorph is not a meme. A meme is not a mind.");
    expect(staticHtml).toContain("shared geometry<br>not shared mechanism");
    expect(staticHtml).toContain('<details class="universelens">');
    expect(staticHtml.toLowerCase()).toContain("contested vernacular label");
    expect(staticHtml.toLowerCase()).toContain("engagement does not become karma");
  });

  test("guide teaches the boundary, equations, empty KARMA lanes, and link-only bridges", () => {
    const guide = read("references/form-circulation-return-atlas.md");
    for (const phrase of [
      "A polymorph is not a meme. A meme is not a mind.",
      "What “disappearing” means",
      "“Brainrot” is a label, not a diagnosis",
      "Eight mathematical lenses",
      "KARMA: relation without a person-score",
      "event_status: not_observed",
      "foundation_status: design-only",
      "receipt_status: not_created",
      "public NEN mirror",
      "High-value ecosystem bridges",
      "Opt-in universe lens",
      "Unknown stays typed",
    ]) expect(guide).toContain(phrase);
    expect(guide).toContain("No MCP surface, tracker, matcher, write path");
  });

  test("does not rewrite any prior immutable scientific triplet", () => {
    const expected: Record<string, string> = {
      "data/polymorphs/ritonavir-disappearing-polymorph.v1.json": "08148603a1228960ac35df1378f1283c3fce43874a9fc07e6687f18e980dcb1c",
      "schemas/polymorph-history-v1.schema.json": "e09dbcfa982fd61124b6220eb4587dded354620b498e45664d000950b67de174",
      "references/ritonavir-polymorph.md": "101dbe11a36393c2687784ab01aa229e4cd6e7e032f8c8f03642ea480f168b91",
      "data/polymorphs/ritonavir-mechanism-landscape.v1.json": "5e136a74d5166275427da920685a84c17901f63d6e4b0661fd529c96d386943b",
      "schemas/ritonavir-mechanism-landscape-v1.schema.json": "cbe6435c2d5c3bf39098442bfc2f9967b09cbf35a38acbd383a3faeb9844d187",
      "references/ritonavir-mechanism-landscape.md": "80b374c205f5d1bb9e901836b48d712c0f7ccf4ed9eded7cd9735bf63032e104",
      "data/feedback/conformational-feedback-atlas.v0.json": "ae15f4f69e488323132ea6fc94d57d338702ca0fa47fd9fbbd41c15a6af230e6",
      "schemas/conformational-feedback-atlas-v0.schema.json": "da4dbb968a51d665192a3778a76ddd65150d2b73975c888dd9fd7ea80c54ea19",
      "references/conformational-feedback-atlas.md": "0f7993430b5cfc3ca59536d6ed53d2c0fd5846c997460a13ec9d583eb9909e2f",
      "data/feedback/conformational-feedback-atlas.v0.2.json": "7d9b1eed8514051e47448cfc983f00e160d5b76c49704822158f76d3f8cf6349",
      "schemas/conformational-feedback-atlas-v0.2.schema.json": "e60c14cf8b6350cc805f59c91b89727ffbd5b41e7c5a192d9ee53c90ba9fbdbd",
      "references/conformational-feedback-atlas-v0.2.md": "76a76222732a8c485396228ad5ff32e703b20383498fd0355e4cbfe33bd59cb0",
      "data/fold-feedback/fold-feedback-atlas.v1.json": "bc9a9abc966e64f7fb967778974879eb045083b342b70100bba92c94d0879df5",
      "schemas/fold-feedback-atlas-v1.schema.json": "4ade5791a2b98cfdbd2452dc11373dc701f58387893442214f2dff1450bc067c",
      "schemas/fold-feedback-atlas-v1.1.schema.json": "8350fdb4fa674ed5917581886f8af28eb455899e523e6130eecc0d7056165352",
      "references/fold-feedback-atlas.md": "aa56a44f0b993c6b40467f5a4f58294a3fe1ca2f79a8f77e98cd8dca57442e2c",
      "data/attention/visibility-attention-translation.v0.1.json": "0af0249c40298ed746d39ee60760a4390bb45137caa8ee6dd7555a824f597bd3",
      "schemas/visibility-attention-translation-v0.1.schema.json": "b1a02d37dc6ae3d19134ee503bdc7d65e4b8a170e039476a85ad86dfd957ce5a",
      "references/visibility-attention-translation.md": "8da6a01a692b51e65ef1ab2d77adccdf61a81e2c2a47d262e235fe83a8820b53",
      "data/cultural-feedback/cultural-attention-feedback-atlas.v1.json": "03f7048966d7b6df582b423254b4d73cda72cce3bd67b40736927faa92b88173",
      "schemas/cultural-attention-feedback-atlas-v1.schema.json": "6bd8fcca25721fd9374daa0ac50299fd587452cf7483da81d6491131aa197f9f",
      "references/cultural-attention-feedback-atlas.md": "1cbb6c765eba329c43c62c58e7e73858ef22d3a8e6048be934accccd5c5e18aa",
    };
    for (const [path, digest] of Object.entries(expected)) expect(sha256(path), path).toBe(digest);
  });
});
