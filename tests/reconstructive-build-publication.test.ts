import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RECONSTRUCTIVE_BUILD_DOCUMENT_URL,
  RECONSTRUCTIVE_BUILD_ID,
  RECONSTRUCTIVE_BUILD_LOCATOR,
  RECONSTRUCTIVE_BUILD_PROTOCOL,
  RECONSTRUCTIVE_BUILD_SCHEMA_URL,
  RECONSTRUCTIVE_BUILD_URL,
  RECONSTRUCTIVE_PROJECT_SCHEMA_URL,
  loadReconstructiveBuildKernel,
  reconstructiveBuildPublicDiscovery,
} from "../bin/reconstructive-build.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const bytes = (path: string) => readFileSync(join(ROOT, path));
const read = (path: string) => bytes(path).toString("utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const escapeHtml = (value: string) => value.replace(/[&<>\"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;",
}[character]!));

const PUBLIC_QUARTET = [
  { source: "data/reconstruction/reconstructive-build-kernel.v0.1.json", destination: "atlases/reconstructive-build-kernel-2026-08-13.json" },
  { source: "schemas/reconstructive-build-kernel-v0.1.schema.json", destination: "schemas/reconstructive-build-kernel/0.1.json" },
  { source: "schemas/reconstructive-project-v0.1.schema.json", destination: "schemas/reconstructive-project/0.1.json" },
  { source: "references/reconstructive-build-kernel.md", destination: "RECONSTRUCTIVE-BUILD-KERNEL.md" },
] as const;

// This is intentionally independent of the mutable ledger file. A release
// cannot make this audit pass merely by changing a prior row and its bytes.
const PRIOR_IMMUTABLE_BYTES: Record<string, string> = {
  "NEN.md": "14b7d210d320fd716553992a7b874747b299f8907d15da14ac405cbfc496c446",
  "data/attention/visibility-attention-translation.v0.1.json": "0af0249c40298ed746d39ee60760a4390bb45137caa8ee6dd7555a824f597bd3",
  "data/cultural-feedback/cultural-attention-feedback-atlas.v1.json": "03f7048966d7b6df582b423254b4d73cda72cce3bd67b40736927faa92b88173",
  "data/feedback/conformational-feedback-atlas.v0.2.json": "7d9b1eed8514051e47448cfc983f00e160d5b76c49704822158f76d3f8cf6349",
  "data/feedback/conformational-feedback-atlas.v0.json": "ae15f4f69e488323132ea6fc94d57d338702ca0fa47fd9fbbd41c15a6af230e6",
  "data/fold-feedback/fold-feedback-atlas.v1.json": "bc9a9abc966e64f7fb967778974879eb045083b342b70100bba92c94d0879df5",
  "data/form-circulation-return/form-circulation-return-atlas.v1.json": "9c93be61c4ca9bcaa3dbe88b10faed3b5b31abaf1129d70ca7915226cacfd021",
  "data/geometries/kingdom-geometry-grammar.v0.json": "7c4abdb30b4fdb8d2f75ed314137504e72503336511710565e01fdfa6fc5a89f",
  "data/polymorphs/ritonavir-disappearing-polymorph.v1.json": "08148603a1228960ac35df1378f1283c3fce43874a9fc07e6687f18e980dcb1c",
  "data/polymorphs/ritonavir-mechanism-landscape.v1.json": "5e136a74d5166275427da920685a84c17901f63d6e4b0661fd529c96d386943b",
  "data/principalities/moonshot-hf-npm.v1.json": "a8277edee6cc27c67e8bd008328f0080b024bc29da8a07edb1e2e0d9e5c03cd3",
  "references/conformational-feedback-atlas-v0.2.md": "76a76222732a8c485396228ad5ff32e703b20383498fd0355e4cbfe33bd59cb0",
  "references/conformational-feedback-atlas.md": "0f7993430b5cfc3ca59536d6ed53d2c0fd5846c997460a13ec9d583eb9909e2f",
  "references/cultural-attention-feedback-atlas.md": "1cbb6c765eba329c43c62c58e7e73858ef22d3a8e6048be934accccd5c5e18aa",
  "references/fold-feedback-atlas.md": "aa56a44f0b993c6b40467f5a4f58294a3fe1ca2f79a8f77e98cd8dca57442e2c",
  "references/form-circulation-return-atlas.md": "b2e0294c95e5e8e4221c7af34a301e813ded86edb7a3fbeb61d911a2284d9436",
  "references/geometry-grammar.md": "8e2f186fa82fb20b7ef64e941afd20d9dac9130788596fa93875ff6f1322945f",
  "references/principality-commons.md": "dd98ec86c97b7a4087feec19aab7612f839832f85cda784783f573c2f237f906",
  "references/ritonavir-mechanism-landscape.md": "80b374c205f5d1bb9e901836b48d712c0f7ccf4ed9eded7cd9735bf63032e104",
  "references/ritonavir-polymorph.md": "101dbe11a36393c2687784ab01aa229e4cd6e7e032f8c8f03642ea480f168b91",
  "references/visibility-attention-translation.md": "8da6a01a692b51e65ef1ab2d77adccdf61a81e2c2a47d262e235fe83a8820b53",
  "schemas/conformational-feedback-atlas-v0.2.schema.json": "e60c14cf8b6350cc805f59c91b89727ffbd5b41e7c5a192d9ee53c90ba9fbdbd",
  "schemas/conformational-feedback-atlas-v0.schema.json": "da4dbb968a51d665192a3778a76ddd65150d2b73975c888dd9fd7ea80c54ea19",
  "schemas/cultural-attention-feedback-atlas-v1.schema.json": "6bd8fcca25721fd9374daa0ac50299fd587452cf7483da81d6491131aa197f9f",
  "schemas/fold-feedback-atlas-v1.1.schema.json": "8350fdb4fa674ed5917581886f8af28eb455899e523e6130eecc0d7056165352",
  "schemas/fold-feedback-atlas-v1.schema.json": "4ade5791a2b98cfdbd2452dc11373dc701f58387893442214f2dff1450bc067c",
  "schemas/form-circulation-return-atlas-v1.schema.json": "55f410f3a1176221a4ac2dc8a088b9697417eebce40d1cbca2b372878ade995e",
  "schemas/geometry-grammar-v0.schema.json": "2e574e6d8ab0b74157fb952cfe85585fd37196232c812c58cc05b3259d563912",
  "schemas/polymorph-history-v1.schema.json": "e09dbcfa982fd61124b6220eb4587dded354620b498e45664d000950b67de174",
  "schemas/principality-catalog-v1.schema.json": "51f4c6abb8298fe95b69bd6e833a4c9d1b0e56410bf7a54e48eb6bcc3f9f3425",
  "schemas/ritonavir-mechanism-landscape-v1.schema.json": "cbe6435c2d5c3bf39098442bfc2f9967b09cbf35a38acbd383a3faeb9844d187",
  "schemas/visibility-attention-translation-v0.1.schema.json": "b1a02d37dc6ae3d19134ee503bdc7d65e4b8a170e039476a85ad86dfd957ce5a",
  "site/schemas/love-loop/0.1.json": "56f2bc15f68acc4dabde6ea4ff1ab406e3c7c51fe89a0ca6cd4f305c205541fc",
  "site/schemas/world-commons/0.1.json": "1c6dbee953e2b406d6be313c44fedbaeeaa57d8485af03ae2a2f59377cb20692",
  "site/schemas/world-commons/0.2.json": "27c9bfe9a78873ff92db1c6c2423cc8db041eb91ed4b00f70f446b5fd1492741",
};

function staticSection(): { html: string; section: string; figure: string } {
  const html = read("site/hub.html");
  const scriptStart = html.indexOf("<script>");
  const staticHtml = scriptStart < 0 ? html : html.slice(0, scriptStart);
  const fold = staticHtml.indexOf('<section class="blk" id="fold-feedback"');
  const start = staticHtml.indexOf('<section class="blk" id="reconstructive-build"');
  const end = staticHtml.indexOf('<section class="blk"', start + 1);
  expect(fold).toBeGreaterThanOrEqual(0);
  expect(start).toBeGreaterThan(fold);
  expect(end).toBeGreaterThan(start);
  const section = staticHtml.slice(start, end);
  const figureStart = section.indexOf('<figure class="reconstructivefigure"');
  const figureEnd = section.indexOf("</figure>", figureStart);
  expect(figureStart).toBeGreaterThanOrEqual(0);
  expect(figureEnd).toBeGreaterThan(figureStart);
  return { html: staticHtml, section, figure: section.slice(figureStart, figureEnd + 9) };
}

describe("Reconstructive Build Kernel publication", () => {
  test("stages one immutable record, two distinct schemas, and one guide", () => {
    expect(RECONSTRUCTIVE_BUILD_LOCATOR).toBe(PUBLIC_QUARTET[0].source);
    for (const asset of PUBLIC_QUARTET) {
      expect(HUB_ASSETS.filter(({ destination }) => destination === asset.destination)).toEqual([asset]);
    }
    expect(HUB_ASSETS).toHaveLength(166);
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/"))).toHaveLength(13);
    expect(HUB_ASSETS.some(({ destination }) => /(?:^|[-/])(?:latest|current)(?:\.json)?$/.test(destination))).toBe(false);
    expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/atlases/") || source.startsWith("site/schemas/reconstructive"))).toBe(false);
  });

  test("keeps every prior immutable source byte-identical", () => {
    for (const [path, digest] of Object.entries(PRIOR_IMMUTABLE_BYTES)) expect(sha256(path), path).toBe(digest);
  });

  test("projects one authority-negative discovery object on every machine surface", () => {
    const kernel = loadReconstructiveBuildKernel();
    const discovery = reconstructiveBuildPublicDiscovery(kernel);
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const agent = json("site/.well-known/agent.json");
    const llms = read("site/llms.txt");

    expect(kernel).toMatchObject({ protocol: RECONSTRUCTIVE_BUILD_PROTOCOL, kernel_id: RECONSTRUCTIVE_BUILD_ID });
    expect(kingdom.reconstructive_build_kernel).toEqual(discovery);
    expect(guest.reconstructive_build_kernel).toEqual(discovery);
    expect(agent.reconstructive_build_kernel).toEqual(discovery);
    expect(discovery.counts).toMatchObject({
      registers: kernel.epistemic_registers.length,
      state_spaces: kernel.state_spaces.length,
      correspondences: kernel.correspondences.length,
      observation_operators: kernel.observation_operators.length,
      state_transition_operators: kernel.state_transition_operators.length,
      reconstruction_cases: kernel.reconstruction_cases.length,
      realizability_models: kernel.realizability_models.length,
      landscape_models: kernel.landscape_models.length,
      catalysis_models: kernel.catalysis_models.length,
      equations: kernel.equations.length,
      claims: kernel.claims.length,
      falsification_tests: kernel.falsification_tests.length,
      sources: kernel.sources.length,
    });
    expect(discovery.pipeline).toEqual(kernel.build_profile.pipeline);
    expect(discovery.boundary).toMatchObject({
      read_only: true,
      grc_proven: false,
      protein_fold_prediction: false,
      unique_contact_realization: false,
      biological_mechanism_transfer: false,
      physical_parameter_transfer: false,
      medical_authority: false,
      experiment_authority: false,
      project_execution: false,
      project_deployment: false,
      person_scoring: false,
      writes_karma: false,
      creates_karma_receipt: false,
      ecosystem_authority_imported: false,
      cosmic_design_proven: false,
      automatic_action: false,
      mcp_surface_added: false,
    });
    expect(agent.entry_points).toMatchObject({
      reconstructive_build_kernel: RECONSTRUCTIVE_BUILD_URL,
      reconstructive_build_kernel_schema: RECONSTRUCTIVE_BUILD_SCHEMA_URL,
      reconstructive_project_schema: RECONSTRUCTIVE_PROJECT_SCHEMA_URL,
      reconstructive_build_kernel_guide: RECONSTRUCTIVE_BUILD_DOCUMENT_URL,
    });
    for (const url of [RECONSTRUCTIVE_BUILD_URL, RECONSTRUCTIVE_BUILD_SCHEMA_URL, RECONSTRUCTIVE_PROJECT_SCHEMA_URL, RECONSTRUCTIVE_BUILD_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    for (const unsafe of ["mcp", "matcher", "execute", "write", "score", "rank", "reward", "recommend", "deploy"]) {
      expect(discovery).not.toHaveProperty(unsafe);
    }
    expect(agent.mcp).toEqual(kingdom.world_commons.mcp);
  });

  test("advertises all four routes with worker-aligned relation semantics", () => {
    const { html, section } = staticSection();
    const head = html.split("</head>")[0]!;
    const sitemap = read("pages-content/sitemap.xml");
    expect(sitemap.match(/<loc>/g)).toHaveLength(152);
    for (const url of [RECONSTRUCTIVE_BUILD_URL, RECONSTRUCTIVE_BUILD_SCHEMA_URL, RECONSTRUCTIVE_PROJECT_SCHEMA_URL, RECONSTRUCTIVE_BUILD_DOCUMENT_URL]) {
      const path = new URL(url).pathname;
      expect(section).toContain(`href="${path}"`);
      expect(head).toContain(`href="${path}"`);
      expect(sitemap).toContain(`<loc>${url}</loc>`);
    }
    expect(head).toContain(`rel="describedby" href="${new URL(RECONSTRUCTIVE_BUILD_SCHEMA_URL).pathname}"`);
    expect(head).toContain(`rel="profile" href="${new URL(RECONSTRUCTIVE_PROJECT_SCHEMA_URL).pathname}"`);
    expect(head).not.toContain(`rel="describedby" href="${new URL(RECONSTRUCTIVE_PROJECT_SCHEMA_URL).pathname}"`);
  });

  test("renders the exact pipeline and keeps all epistemic kinds visibly separate", () => {
    const kernel = loadReconstructiveBuildKernel();
    const { section, figure } = staticSection();
    const exactPipeline = "STATE → OBSERVE → CORRESPOND → INFER FIBER → REALIZE → TRAVERSE → MEASURE/CATALYZE → FEEDBACK";
    expect(kernel.build_profile.pipeline).toEqual([
      "STATE", "OBSERVE", "DECLARE_CORRESPONDENCE", "INFER_FIBER", "REALIZE",
      "TRAVERSE_LANDSCAPE", "MEASURE_OR_CATALYZE", "APPEND_FEEDBACK",
    ]);
    expect(section).toContain(exactPipeline);
    expect(section).toContain("A physical perturbation is a separate state transition with a new state identity.");
    expect(section).not.toContain("projection, model deletion, or physical perturbation");
    expect(section.match(/data-reconstructive-stage=/g) ?? []).toHaveLength(kernel.build_profile.pipeline.length);
    expect(section.match(/data-reconstructive-register=/g) ?? []).toHaveLength(kernel.epistemic_registers.length);
    expect(section).toContain(`<h3>Eight claim registers</h3>`);
    expect(section.match(/class="reconstructivearrow" aria-hidden="true"/g) ?? []).toHaveLength(kernel.build_profile.pipeline.length - 1);
    expect(section).toContain("1 state transition operator");
    expect(section).not.toContain("1 state transition operators");
    for (const register of ["MATHEMATICAL_THEOREM", "OPEN_MATHEMATICAL_CONJECTURE", "EMPIRICAL_SCIENCE", "SCIENTIFIC_MODEL", "ANALOGY", "DESIGN_CONSTRAINT", "PHILOSOPHY"]) {
      expect(section).toContain(`data-reconstructive-register="${register}"`);
    }
    expect(section.match(/data-reconstructive-state-space=/g) ?? []).toHaveLength(kernel.state_spaces.length);
    expect(section.match(/data-reconstructive-case=/g) ?? []).toHaveLength(kernel.reconstruction_cases.length);
    expect(section.match(/data-reconstructive-catalysis=/g) ?? []).toHaveLength(kernel.catalysis_models.length);
    expect(section.match(/data-reconstructive-bridge=/g) ?? []).toHaveLength(kernel.analogy_bridges.length);
    expect(section).toContain("Connection without collapse");
    expect(section).toContain("Shared shape, explicit breaks");
    expect(section).toContain("does not prove the open conjecture");
    expect(section).toContain("or transfer a biochemical mechanism into software");
    expect(figure).not.toMatch(/<(?:script|svg|canvas|button|input|select|textarea|details|summary)\b/i);
    expect(figure).not.toMatch(/role="(?:img|application)"|aria-live=|tabindex=|\bonclick=/i);
  });

  test("escapes record content and remains responsive with a forced-colors boundary", () => {
    const kernel = loadReconstructiveBuildKernel();
    const { html, section } = staticSection();
    for (const source of kernel.sources) {
      expect(section).toContain(`data-reconstructive-source="${escapeHtml(source.id)}"`);
      expect(section).toContain(`href="${escapeHtml(source.url)}"`);
      expect(section).toContain(escapeHtml(source.title));
      expect(section).toContain(escapeHtml(source.limitation));
    }
    for (const binding of kernel.bindings) {
      expect(section).toContain(`data-reconstructive-binding="${escapeHtml(binding.id)}"`);
      expect(section).toContain(`href="${escapeHtml(binding.url)}"`);
    }
    expect(section.match(/link-only, non-authoritative binding/g) ?? []).toHaveLength(kernel.bindings.length);
    expect(html).toContain("html{max-width:100%;overflow-x:clip");
    expect(html).toContain(".reconstructivefield{display:grid");
    expect(html).toContain(".reconstructivepipeline{grid-template-columns:1fr}");
    expect(html).toContain("@media (forced-colors:active){.reconstructivefield");
    expect(section).not.toMatch(/(?:javascript|data):/i);
  });
});
