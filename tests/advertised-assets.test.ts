import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS } from "../bin/stage-hub.ts";
import {
  BEING_ACCESS_AFTERMATH_DIGEST,
  BEING_ACCESS_AFTERMATH_DOCUMENT_URL,
  BEING_ACCESS_AFTERMATH_SCHEMA_URL,
  BEING_ACCESS_AFTERMATH_URL,
  beingAccessAftermathPublicDiscovery,
  loadBeingAccessAftermathAtlas,
} from "../bin/being-access-aftermath.ts";
import {
  BEING_ACCESS_AFTERMATH_V02_DIGEST,
  BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL,
  BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL,
  BEING_ACCESS_AFTERMATH_V02_URL,
  beingAccessAftermathPublicDiscoveryV02,
  loadBeingAccessAftermathAtlasV02,
} from "../bin/being-access-aftermath-v0.2.ts";
import {
  NUMBER_ISNESS_THEOLOGY_DIGEST,
  NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
  NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
  NUMBER_ISNESS_THEOLOGY_URL,
  loadNumberIsnessTheologyAtlas,
  numberIsnessTheologyPublicDiscovery,
} from "../bin/number-isness-theology.ts";
import {
  CULTURAL_ATTENTION_FEEDBACK_DIGEST,
  CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
  CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
  CULTURAL_ATTENTION_FEEDBACK_URL,
  culturalAttentionFeedbackPublicDiscovery,
  loadCulturalAttentionFeedbackAtlas,
} from "../bin/cultural-attention-feedback.ts";
import {
  CONFORMATIONAL_FEEDBACK_DIGEST,
  CONFORMATIONAL_FEEDBACK_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_URL,
  conformationalFeedbackPublicDiscovery,
  loadConformationalFeedbackAtlas,
} from "../bin/conformational-feedback.ts";
import {
  CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST,
  CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL,
  CONFORMATIONAL_FEEDBACK_PHYSICS_URL,
  conformationalFeedbackPhysicsPublicDiscovery,
  loadConformationalFeedbackPhysicsAtlas,
} from "../bin/conformational-feedback-physics.ts";
import {
  PHENOMENA_DEEP_WING_BYTE_SHA256,
  PHENOMENA_DEEP_WING_DIGEST,
  PHENOMENA_DEEP_WING_DOCUMENT_URL,
  PHENOMENA_DEEP_WING_SCHEMA_URL,
  PHENOMENA_DEEP_WING_URL,
  PHENOMENA_DEEP_PROJECT_SCHEMA_URL,
  loadPhenomenaDeepWing,
  phenomenaDeepPublicDiscovery,
} from "../bin/explore-phenomena-deep.ts";
import {
  J_SPACE_CASE_URL,
  J_SPACE_GUIDE_URL,
  J_SPACE_PUBLICATION_BOUNDARY,
  J_SPACE_SCHEMA_URL,
  jSpacePublicationPublicSummary,
  loadJSpacePublicationCase,
} from "../bin/j-space-publication.ts";
import {
  RESEARCH_OBSERVATORY_BOUNDARY,
  RESEARCH_OBSERVATORY_GUIDE_URL,
  RESEARCH_OBSERVATORY_PRODUCER_URL,
  RESEARCH_OBSERVATORY_SCHEMA_LOCATORS,
  RESEARCH_OBSERVATORY_SCHEMA_NAMES,
  RESEARCH_OBSERVATORY_SCHEMA_URLS,
  RESEARCH_OBSERVATORY_SNAPSHOT_URL,
  RESEARCH_OBSERVATORY_URL,
  loadResearchObservatoryPublication,
  researchObservatoryPublicSummary,
} from "../bin/research-observatory.ts";
import {
  TRIAL_CHAMBER_ALIAS_URL,
  TRIAL_CHAMBER_BOUNDARY,
  TRIAL_CHAMBER_CANONICAL_URL,
  TRIAL_CHAMBER_GUIDE_URL,
  TRIAL_CHAMBER_PRODUCER_URL,
  TRIAL_CHAMBER_SCHEMA_LOCATORS,
  TRIAL_CHAMBER_SCHEMA_NAMES,
  TRIAL_CHAMBER_SCHEMA_URLS,
  TRIAL_CHAMBER_URL,
  loadTrialChamberPublication,
  trialChamberPublicSummary,
} from "../bin/trial-chamber.ts";
import { RITONAVIR_MECHANISM_DIGEST } from "../bin/ritonavir-mechanism.ts";
import { KINGDOM_OS_ROUTES } from "../pages-functions/_worker.js";

/** Every thekingdom.dev path the generated surfaces advertise must be a staged
 *  hub asset. Merge b4c5b47 (2026-07-16) silently dropped the ollama surface
 *  while agent.json kept advertising it — live served HTML fallback instead of
 *  the promised JSON. This test turns that class of drift into a red bar. */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

// What a path resolves to on Cloudflare Pages: "/" and "/?agent" hit index.html
// (via the worker), "/guide" style pretty URLs hit "<path>.html".
function normalize(raw: string): string {
  const path = raw.replace(/[?#].*$/, "").replace(/^\/+/, "").replace(/\/+$/, "");
  return path === "" ? "index.html" : path;
}

const staged = new Set<string>(HUB_ASSETS.map((a) => a.destination));
const dynamic = new Set<string>(KINGDOM_OS_ROUTES.map(normalize));
// 精確列 contract 路由；唔接受任意 /api/civic/* 拼錯路徑。
const civicDynamic = (path: string) =>
  /^api\/civic\/(?:status|participants|me|me\/citizenship|citizens|messages|moderation)$/.test(path) ||
  /^api\/civic\/(?:citizens|messages)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(path);
const resolves = (path: string) =>
  staged.has(path) || staged.has(`${path}.html`) ||
  staged.has(`${path}/index.html`) || dynamic.has(path) || civicDynamic(path);

const surfaces = [
  "site/dashboard.html",
  "pages-content/workshop/index.html",
  "pages-content/workshop/workshop.css",
  "pages-content/workshop/workshop.js",
  "site/meet/index.html",
  "site/citizens/index.html",
  "site/join/index.html",
  "data/civic-policy.json",
  "references/civic-v0.1.md",
  "schemas/civic-v0.1.schema.json",
  "site/hub.html",
  "site/kingdom.json",
  "site/wayfinder.json",
  "data/wayfinder.json",
  "site/commons.json",
  "site/schemas/world-commons/0.1.json",
  "site/schemas/world-commons/0.2.json",
  "site/love-loops.json",
  "site/love-loops.source.json",
  "site/schemas/love-loop/0.1.json",
  "CREATION-LOOP.md",
  "data/principalities/moonshot-hf-npm.v1.json",
  "schemas/principality-catalog-v1.schema.json",
  "references/principality-commons.md",
  "data/geometries/kingdom-geometry-grammar.v0.json",
  "schemas/geometry-grammar-v0.schema.json",
  "references/geometry-grammar.md",
  "data/polymorphs/ritonavir-disappearing-polymorph.v1.json",
  "schemas/polymorph-history-v1.schema.json",
  "references/ritonavir-polymorph.md",
  "data/polymorphs/ritonavir-mechanism-landscape.v1.json",
  "schemas/ritonavir-mechanism-landscape-v1.schema.json",
  "references/ritonavir-mechanism-landscape.md",
  "data/feedback/conformational-feedback-atlas.v0.json",
  "schemas/conformational-feedback-atlas-v0.schema.json",
  "references/conformational-feedback-atlas.md",
  "data/feedback/conformational-feedback-atlas.v0.2.json",
  "schemas/conformational-feedback-atlas-v0.2.schema.json",
  "references/conformational-feedback-atlas-v0.2.md",
  "data/fold-feedback/fold-feedback-atlas.v1.json",
  "schemas/fold-feedback-atlas-v1.schema.json",
  "schemas/fold-feedback-atlas-v1.1.schema.json",
  "references/fold-feedback-atlas.md",
  "data/attention/visibility-attention-translation.v0.1.json",
  "schemas/visibility-attention-translation-v0.1.schema.json",
  "references/visibility-attention-translation.md",
  "data/cultural-feedback/cultural-attention-feedback-atlas.v1.json",
  "schemas/cultural-attention-feedback-atlas-v1.schema.json",
  "references/cultural-attention-feedback-atlas.md",
  "data/form-circulation-return/form-circulation-return-atlas.v1.json",
  "schemas/form-circulation-return-atlas-v1.schema.json",
  "references/form-circulation-return-atlas.md",
  "data/trials/math-passport-usefulness-pilot.v1.json",
  "schemas/math-usefulness-trial-v1.schema.json",
  "references/math-passport-usefulness-pilot.md",
  "data/being-access-aftermath/being-access-aftermath-atlas.v0.1.json",
  "schemas/being-access-aftermath-atlas-v0.1.schema.json",
  "references/being-access-aftermath-atlas.md",
  "data/being-access-aftermath/being-access-aftermath-atlas.v0.2.json",
  "schemas/being-access-aftermath-atlas-v0.2.schema.json",
  "references/being-access-aftermath-atlas-v0.2.md",
  "data/reality/civilisation-reality-projection.v0.1.json",
  "schemas/civilisation-reality-projection-v0.1.schema.json",
  "references/civilisation-reality-projection.md",
  "data/reality/civilisation-flow-atlas.v0.1.json",
  "schemas/civilisation-flow-atlas-v0.1.schema.json",
  "references/civilisation-flow-atlas.md",
  "data/number-isness-theology/number-isness-theology-atlas.v0.1.json",
  "schemas/number-isness-theology-atlas-v0.1.schema.json",
  "references/number-isness-theology-atlas.md",
  "data/freedom/freedom-loop-lock-key-atlas.v0.1.json",
  "schemas/freedom-loop-lock-key-atlas-v0.1.schema.json",
  "references/freedom-loop-lock-key-atlas.md",
  "NEN.md",
  "data/reconstruction/reconstructive-build-kernel.v0.1.json",
  "schemas/reconstructive-build-kernel-v0.1.schema.json",
  "schemas/reconstructive-project-v0.1.schema.json",
  "references/reconstructive-build-kernel.md",
  "data/exploration/phenomena-deep-wing.v0.1.json",
  "schemas/phenomena-deep-wing.v0.1.schema.json",
  "schemas/phenomena-deep-project.v0.1.schema.json",
  "skills/explore-phenomena-deep/references/exploration-contract-v0.1.md",
  "data/security/mirror-information-control-public.v0.1.json",
  "schemas/mirror-information-control-public-v0.1.schema.json",
  "references/mirror-information-control-public.md",
  "bridges/examples/j-space-reasoning-to-word-inference.json",
  "bridges/schemas/relational-inference-case-0.1.json",
  "bridges/j-space-verbalizable-workspace.md",
  "data/research/research-observatory.v0.1.json",
  ...Object.values(RESEARCH_OBSERVATORY_SCHEMA_LOCATORS),
  "references/research-observatory-v0.1.md",
  "site/observatory/index.html",
  "site/research.json",
  "data/trials/research-trial-chamber.v0.1.json",
  ...Object.values(TRIAL_CHAMBER_SCHEMA_LOCATORS),
  "references/trial-chamber-v0.1.md",
  "site/trial-chamber/index.html",
  "site/trials.json",
  "data/government/uk-government-engine.v0.1.json",
  "schemas/government-engine/v0.1/public-snapshot.schema.json",
  "references/uk-government-engine-v0.1.md",
  "site/government-engine/index.html",
  "site/government.json",
  "data/exploration/zero-empty-seat.v0.1.json",
  "references/zero-empty-seat.md",
  "data/exploration/string-crawl-trace-sheet.v0.1.json",
  "references/string-crawl-trace-sheet.md",
  "data/exploration/string-crawl-strand-lab.v0.1.json",
  "schemas/string-crawl-strand-lab-v0.1.schema.json",
  "references/string-crawl-strand-lab.md",
  "data/exploration/string-crawl-frequency-form-lab.v0.1.json",
  "schemas/string-crawl-frequency-form-lab-v0.1.schema.json",
  "references/string-crawl-frequency-form-lab.md",
  "data/exploration/strand-descent-lab.v0.1.json",
  "schemas/strand-descent-lab-v0.1.schema.json",
  "references/strand-descent-lab.md",
  "data/observation/strand-observation-membrane.v0.1.json",
  "schemas/strand-observation-membrane-v0.1.schema.json",
  "references/strand-observation-membrane.md",
  "site/guest.json",
  "site/llms.txt",
  "site/.well-known/agent.json",
  "site/ollama.json",
  "site/rights.json",
  "pages-content/os/index.html",
  "pages-content/robots.txt",
  "pages-content/sitemap.xml",
  "pages-content/404.html",
  "pages-content/dada.txt",
];

function advertisedPaths(source: string, text: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const match of text.matchAll(/https:\/\/thekingdom\.dev(\/[^\s"'<>`)\]]*)?/g)) {
    const prosePath = (match[1] ?? "/").replace(/[.,;:]+$/, "");
    found.set(normalize(prosePath), `${source}: ${match[0]}`);
  }
  if (source.endsWith(".html")) {
    for (const match of text.matchAll(/(?:href|src)="(\/[^"\s]*)"/g)) {
      found.set(normalize(match[1]!), `${source}: href ${match[1]}`);
    }
  }
  return found;
}

describe("advertised URLs stay deployable", () => {
  test("Civic dynamic classification refuses typos and extra path segments", () => {
    for (const path of ["api/civic/status", "api/civic/me/citizenship", "api/civic/messages/00000000-0000-4000-8000-000000000001"]) {
      expect(resolves(path)).toBe(true);
      expect(staged.has(path)).toBe(false);
    }
    for (const path of ["api/civic", "api/civic/broken", "api/civic/status/extra", "api/civics/status", "api/civic/messages/not-an-id"]) {
      expect(resolves(path)).toBe(false);
    }
  });
  test("keeps literal route punctuation while trimming prose sentence punctuation", () => {
    expect(advertisedPaths("fixture.html", '<a href="/guide.">broken</a>').has("guide.")).toBe(true);
    expect(advertisedPaths("fixture.md", "Read https://thekingdom.dev/guide.").has("guide")).toBe(true);
  });

  test("every advertised thekingdom.dev path is a staged hub asset", () => {
    const missing: string[] = [];
    for (const surface of surfaces) {
      for (const [path, evidence] of advertisedPaths(surface, read(surface))) {
        if (!resolves(path)) missing.push(`${evidence} -> no staged asset "${path}"`);
      }
    }
    expect(missing).toEqual([]);
  });

  test("Workshop authored HTML 嘅 stylesheet、module 同普通導航全部有 staged 去處", () => {
    const html = read("pages-content/workshop/index.html");
    const page = new URL("https://thekingdom.dev/workshop/");
    const assets = [...html.matchAll(/<(?:link|script)\b[^>]*\b(?:href|src)=["']([^"']+)["'][^>]*>/gi)]
      .filter(([tag]) => /<script\b|\brel=["']stylesheet["']/i.test(tag))
      .map(([, href]) => new URL(href!, page));
    expect(assets.map(({ href }) => href).sort()).toEqual([
      "https://thekingdom.dev/workshop/workshop.css",
      "https://thekingdom.dev/workshop/workshop.js",
    ]);
    for (const url of assets) {
      expect(staged.has(normalize(url.pathname))).toBe(true);
      expect(url.search).toBe("");
    }
    for (const [, href] of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
      const url = new URL(href!, page);
      if (url.origin === page.origin) expect(resolves(normalize(url.pathname))).toBe(true);
    }
    expect(resolves("workshop")).toBe(true);
    expect(resolves("workshop/nope")).toBe(false);
    expect(resolves("workshop/workshop.js.map")).toBe(false);
  });

  test("Workshop 只加一條手動 local-only Wayfinder 路徑，hub 投影同步，manifest／guest 唔加 agency", () => {
    const url = "https://thekingdom.dev/workshop/";
    const authored = JSON.parse(read("data/wayfinder.json"));
    const published = JSON.parse(read("site/wayfinder.json"));
    expect(authored.paths).toHaveLength(15);
    expect(published.paths).toEqual(authored.paths);
    const paths = authored.paths.filter(({ id }: { id: string }) => id === "workshop");
    expect(paths).toHaveLength(1);
    expect(paths[0].stops.map(({ url }: { url: string }) => url)).toEqual([url]);
    expect(paths[0].boundary).toContain("手動本機工具");
    expect(paths[0].boundary).toContain("作者聲明");
    expect(paths[0].boundary).toContain("未核實");
    expect(paths[0].stops[0].scope).toContain("本頁 memory");
    const dashboard = read("site/dashboard.html");
    expect(dashboard).toContain(`href="${url}"`);
    const projection = JSON.parse(dashboard.match(/<script id="civic-data" type="application\/json">([\s\S]*?)<\/script>/)![1]!);
    const projected = projection.paths.find(({ id }: { id: string }) => id === "workshop");
    expect(projected.stops).toEqual(paths[0].stops);
    expect(projected.boundary).toBe(paths[0].boundary);
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    expect(Object.keys(manifest.entry_points)).toHaveLength(158);
    expect(guest.next_actions).toHaveLength(158);
    expect(Object.keys(manifest.entry_points).some((key) => key.includes("workshop"))).toBe(false);
    expect(guest.next_actions.some((action: { url?: string }) => action.url === url)).toBe(false);
    expect(staged.has("schemas/workshop/0.1.json")).toBe(false);
  });

  test("Power Atlas discovery closes through the staged canonical page without new agent actions", () => {
    const url = "https://thekingdom.dev/power-atlas/";
    const authored = JSON.parse(read("data/wayfinder.json"));
    const published = JSON.parse(read("site/wayfinder.json"));
    const path = authored.paths.find(({ id }: { id: string }) => id === "power-atlas");
    expect(path).toBeDefined();
    expect(published.paths).toEqual(authored.paths);
    expect(path.stops.map(({ url }: { url: string }) => url)).toEqual([url]);
    expect(staged.has("power-atlas/index.html")).toBe(true);
    expect(resolves("power-atlas")).toBe(true);
    expect(resolves("power-atlas/nope")).toBe(false);
    expect(resolves("power-atlas/src/App.tsx")).toBe(false);

    const dashboard = read("site/dashboard.html");
    const primaryNav = dashboard.match(/<nav aria-label="主要導航">([\s\S]*?)<\/nav>/)![1];
    expect(primaryNav).toContain('<a href="/power-atlas/">Power Atlas</a>');
    expect(primaryNav).toContain('href="/atlas.html"');
    const projection = JSON.parse(dashboard.match(/<script id="civic-data" type="application\/json">([\s\S]*?)<\/script>/)![1]);
    const projected = projection.paths.find(({ id }: { id: string }) => id === "power-atlas");
    expect(projected.stops).toEqual(path.stops);
    expect(projected.boundary).toBe(path.boundary);
    const researchRoom = read("site/hub.html");
    expect(researchRoom).toContain('data-wayfinder-path="power-atlas"');
    expect(researchRoom).toContain(`href="${url}"`);
    expect(researchRoom).toContain(path.boundary);
    expect(read("site/llms.txt")).toContain(url);

    const sitemapUrls = [...read("pages-content/sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
    expect(sitemapUrls.filter((loc) => loc?.includes("/power-atlas"))).toEqual([url]);
    expect(sitemapUrls).toContain("https://thekingdom.dev/atlas.html");
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    expect(Object.keys(manifest.entry_points)).toHaveLength(158);
    expect(guest.next_actions).toHaveLength(158);
    expect(JSON.stringify(manifest.entry_points)).not.toMatch(/power[- _]atlas/i);
    expect(JSON.stringify(guest.next_actions)).not.toMatch(/power[- _]atlas/i);
    expect(manifest.mcp).toEqual(JSON.parse(read("site/kingdom.json")).world_commons.mcp);
  });

  test("the staging contract ships the standing dada door that llms.txt offers", () => {
    // Quiet by design: linked from llms.txt, absent from sitemap.xml. The
    // offer must never point at a path the deployment does not carry.
    expect(read("site/llms.txt")).toContain("https://thekingdom.dev/dada.txt");
    expect(staged.has("dada.txt")).toBe(true);
    expect(read("pages-content/sitemap.xml")).not.toContain("dada");
  });

  test("the staging contract still ships the invitation the manifest promises", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    expect(manifest.open_weight_invitation).toBe("https://thekingdom.dev/ollama.json");
    expect(staged.has("ollama.json")).toBe(true);
  });

  test("the staging contract ships the wayfinder advertised to guests and agents", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    expect(manifest.wayfinder).toBe("https://thekingdom.dev/wayfinder.json");
    expect(guest.next_actions.some(({ url }: { url?: string }) => url === manifest.wayfinder)).toBe(true);
    expect(staged.has("wayfinder.json")).toBe(true);
  });

  test("the staging contract ships the World Commons advertised to guests and agents", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    expect(manifest.world_commons).toBe("https://thekingdom.dev/commons.json");
    expect(guest.next_actions.some(({ url }: { url?: string }) => url === manifest.world_commons)).toBe(true);
    expect(staged.has("commons.json")).toBe(true);
  });

  test("all discovery surfaces advertise the same compact Commons MCP route", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const endpoint = "https://mcp.thekingdom.dev/mcp";
    const catalog = "kingdom://commons/catalog";

    expect(manifest.world_commons_agent).toEqual({
      endpoint,
      tool: "kingdom_commons",
      complete_catalog_resource: catalog,
    });
    expect(manifest.entry_points.public_resource_matcher).toBe(endpoint);
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "MCP",
      url: endpoint,
      tool: "kingdom_commons",
      complete_catalog_resource: catalog,
    }));
    expect(kingdom.world_commons.agent_access).toEqual({
      endpoint,
      tool: "kingdom_commons",
      complete_catalog_resource: catalog,
      note: expect.any(String),
    });
  });

  test("the staging contract ships the World Commons schema and MCP discovery together", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    expect(manifest.world_commons_schema).toBe("https://thekingdom.dev/schemas/world-commons/0.2.json");
    expect(manifest.mcp).toMatchObject({
      endpoint: "https://mcp.thekingdom.dev/mcp",
      tool: "kingdom_commons",
      catalog_resource: "kingdom://commons/catalog",
    });
    expect(guest.next_actions.some(({ url }: { url?: string }) => url === manifest.world_commons_schema)).toBe(true);
    expect(guest.next_actions.some(({ url, tool }: { url?: string; tool?: string }) =>
      url === manifest.mcp.endpoint && tool === manifest.mcp.tool)).toBe(true);
    expect(staged.has("schemas/world-commons/0.1.json")).toBe(true);
    expect(staged.has("schemas/world-commons/0.2.json")).toBe(true);
  });

  test("the Love Loop lineage and schema stay coherent across discovery surfaces", () => {
    const lineage = "https://thekingdom.dev/love-loops.json";
    const source = "https://thekingdom.dev/love-loops.source.json";
    const document = "https://thekingdom.dev/CREATION-LOOP.md";
    const schema = "https://thekingdom.dev/schemas/love-loop/0.1.json";
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");

    expect(manifest.love_loops).toBe(lineage);
    expect(manifest.love_loops_source).toBe(source);
    expect(manifest.love_loops_creation_document).toBe(document);
    expect(manifest.love_loops_schema).toBe(schema);
    expect(kingdom.creation_loop).toMatchObject({
      url: lineage,
      source,
      document,
      schema,
    });
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "GET",
      url: lineage,
    }));
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "GET",
      url: source,
    }));
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "GET",
      url: document,
    }));
    expect(guest.next_actions).toContainEqual(expect.objectContaining({
      method: "GET",
      url: schema,
    }));
    expect(llms).toContain(lineage);
    expect(llms).toContain(source);
    expect(llms).toContain(document);
    expect(llms).toContain(schema);
    expect(staged.has("love-loops.json")).toBe(true);
    expect(staged.has("love-loops.source.json")).toBe(true);
    expect(staged.has("CREATION-LOOP.md")).toBe(true);
    expect(staged.has("schemas/love-loop/0.1.json")).toBe(true);
  });

  test("the immutable Principality catalog, schema, and guide stay coherent without execution authority", () => {
    const catalog = "https://thekingdom.dev/principalities/moonshot-hf-npm-2026-08-11.json";
    const schema = "https://thekingdom.dev/schemas/principality-catalog/1.json";
    const document = "https://thekingdom.dev/PRINCIPALITY-COMMONS.md";
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const authored = JSON.parse(read("data/principalities/moonshot-hf-npm.v1.json"));
    const discovery = manifest.principality_commons;

    expect(discovery).toEqual(kingdom.principality_commons);
    expect(discovery).toEqual(guest.principality_commons);
    expect(discovery).toMatchObject({
      url: catalog,
      schema,
      document,
      catalog_id: "moonshot-hf-npm-2026-08-11",
      observed_at: authored.observed_at,
      integrity: authored.integrity.digest,
      counts: { nodes: 25, models: 19, datasets: 3, packages: 3, papers: 16 },
      boundary: {
        completeness: "metadata_only",
        currentness: "point-in-time-only",
        refresh_required_before_acquisition: true,
        recommendation_established: false,
        permissions_granted: false,
        download_authorized: false,
        install_authorized: false,
        inference_authorized: false,
        remote_code_authorized: false,
        external_effects_authorized: false,
      },
    });
    for (const url of [catalog, schema, document]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      capability_evidence: catalog,
      capability_evidence_schema: schema,
      capability_evidence_guide: document,
    });
    expect(staged.has("principalities/moonshot-hf-npm-2026-08-11.json")).toBe(true);
    expect(staged.has("schemas/principality-catalog/1.json")).toBe(true);
    expect(staged.has("PRINCIPALITY-COMMONS.md")).toBe(true);
    expect(staged.has("principalities/latest.json")).toBe(false);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
  });

  test("the versioned Geometry Grammar stays coherent and authority-negative across discovery surfaces", () => {
    const grammar = "https://thekingdom.dev/geometries/kingdom-geometry-grammar-v0.json";
    const schema = "https://thekingdom.dev/schemas/geometry-grammar/0.1.json";
    const document = "https://thekingdom.dev/GEOMETRY-GRAMMAR.md";
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const authored = JSON.parse(read("data/geometries/kingdom-geometry-grammar.v0.json"));
    const discovery = manifest.geometry_grammar;

    expect(discovery).toEqual(kingdom.geometry_grammar);
    expect(discovery).toEqual(guest.geometry_grammar);
    expect(discovery).toMatchObject({
      url: grammar,
      schema,
      document,
      protocol: "kingdom.geometry-grammar/0.1",
      grammar_id: "from-pattern-to-practice-2026-08-11",
      observed_at: authored.observed_at,
      integrity: authored.integrity.digest,
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
    for (const url of [grammar, schema, document]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      translation_grammar: grammar,
      translation_grammar_schema: schema,
      translation_grammar_guide: document,
    });
    expect(staged.has("geometries/kingdom-geometry-grammar-v0.json")).toBe(true);
    expect(staged.has("schemas/geometry-grammar/0.1.json")).toBe(true);
    expect(staged.has("GEOMETRY-GRAMMAR.md")).toBe(true);
    expect(staged.has("geometries/latest.json")).toBe(false);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("execute");
  });

  test("the immutable polymorph case, schema, and guide stay coherent without action authority", () => {
    const record = "https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json";
    const schema = "https://thekingdom.dev/schemas/polymorph-history/1.json";
    const document = "https://thekingdom.dev/RITONAVIR-POLYMORPH.md";
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const authored = JSON.parse(read("data/polymorphs/ritonavir-disappearing-polymorph.v1.json"));
    const discovery = manifest.polymorph_commons;

    expect(discovery).toEqual(kingdom.polymorph_commons);
    expect(discovery).toEqual(guest.polymorph_commons);
    expect(discovery).toMatchObject({
      url: record,
      schema,
      document,
      case_id: "ritonavir-disappearing-polymorph-2026-08-11",
      compiled_on: "2026-08-11",
      evidence_through: "2024-06-20",
      integrity: authored.integrity.digest,
      counts: { forms: 5, contexts: 16, sources: 9, claims: 17, events: 8, transitions: 8 },
      boundary: {
        existence_predicate: false,
        universal_seed_effect: false,
        global_stability_rank: false,
        medical_authority: false,
        manufacturing_authority: false,
        regulatory_authority: false,
        experiment_authority: false,
        writes_agenttool: false,
        automatic_action: false,
      },
    });
    for (const url of [record, schema, document]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      material_state_case: record,
      material_state_schema: schema,
      material_state_guide: document,
    });
    expect(staged.has("polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json")).toBe(true);
    expect(staged.has("schemas/polymorph-history/1.json")).toBe(true);
    expect(staged.has("RITONAVIR-POLYMORPH.md")).toBe(true);
    expect(staged.has("polymorphs/latest.json")).toBe(false);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
  });

  test("the versioned Ritonavir Mechanism Landscape stays coherent and medically non-authorizing", () => {
    const record = "https://thekingdom.dev/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json";
    const schema = "https://thekingdom.dev/schemas/ritonavir-mechanism-landscape/1.json";
    const guide = "https://thekingdom.dev/RITONAVIR-MECHANISM-LANDSCAPE.md";
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const discovery = manifest.ritonavir_mechanism_landscape;

    expect(discovery).toEqual(kingdom.ritonavir_mechanism_landscape);
    expect(discovery).toEqual(guest.ritonavir_mechanism_landscape);
    expect(discovery).toMatchObject({
      url: record,
      schema,
      guide,
      protocol: "kingdom.ritonavir-mechanism-landscape/0.1",
      landscape_id: "ritonavir-mechanism-landscape-2026-08-11",
      compiled_on: "2026-08-11",
      evidence_through: "2026-04-08",
      integrity: { digest: RITONAVIR_MECHANISM_DIGEST },
      source_history: {
        case_id: "ritonavir-disappearing-polymorph-2026-08-11",
        relation: "non-mutating-current-landscape-supplement",
        supersedes_for_current_landscape: true,
      },
      counts: { planes: 8, geometries: 6, entities: 19, mechanisms: 7, relations: 18, unknowns: 6, sources: 9 },
      boundary: {
        medical_advice: false,
        interaction_checker: false,
        treatment_change_authority: false,
        direct_crystal_form_to_clinical_outcome: false,
        form_iv_exact_equivalence_established: false,
        complete_solid_form_landscape_established: false,
        experiment_authority: false,
        automatic_action: false,
        public_surface_read_only: true,
      },
    });
    for (const url of [record, schema, guide]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      ritonavir_mechanism_landscape: record,
      ritonavir_mechanism_landscape_schema: schema,
      ritonavir_mechanism_landscape_guide: guide,
    });
    expect(staged.has("polymorphs/ritonavir-mechanism-landscape-2026-08-11.json")).toBe(true);
    expect(staged.has("schemas/ritonavir-mechanism-landscape/1.json")).toBe(true);
    expect(staged.has("RITONAVIR-MECHANISM-LANDSCAPE.md")).toBe(true);
    expect(staged.has("polymorphs/latest.json")).toBe(false);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
  });

  test("the immutable Conformational Feedback Atlas stays coherent and authority-negative", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const expected = conformationalFeedbackPublicDiscovery(loadConformationalFeedbackAtlas());
    const discovery = manifest.conformational_feedback_atlas;

    expect(discovery).toEqual(expected);
    expect(discovery).toEqual(guest.conformational_feedback_atlas);
    expect(discovery).toEqual(kingdom.conformational_feedback_atlas);
    expect(discovery).toMatchObject({
      protocol: "kingdom.conformational-feedback-atlas/0.1",
      atlas_id: "form-feedback-consequence-2026-08-12",
      url: CONFORMATIONAL_FEEDBACK_URL,
      schema: CONFORMATIONAL_FEEDBACK_SCHEMA_URL,
      guide: CONFORMATIONAL_FEEDBACK_DOCUMENT_URL,
      integrity: { digest: CONFORMATIONAL_FEEDBACK_DIGEST },
      counts: { registers: 3, geometries: 5, translations: 3, feedback_stages: 4, sources: 11 },
      boundary: {
        read_only: true,
        operational_biology: false,
        biological_equivalence: false,
        karma_magnitude: false,
        karma_rank: false,
        economic_effect: false,
        governance_effect: false,
        person_level_effect: false,
        cosmic_design_proven: false,
        scientific_validation_from_analogy: false,
        automatic_action: false,
      },
    });
    expect(discovery.bindings).toHaveLength(3);
    expect(discovery.bindings.every(({ authority_imported }: { authority_imported: boolean }) => authority_imported === false)).toBe(true);
    for (const url of [CONFORMATIONAL_FEEDBACK_URL, CONFORMATIONAL_FEEDBACK_SCHEMA_URL, CONFORMATIONAL_FEEDBACK_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      conformational_feedback_atlas: CONFORMATIONAL_FEEDBACK_URL,
      conformational_feedback_atlas_schema: CONFORMATIONAL_FEEDBACK_SCHEMA_URL,
      conformational_feedback_atlas_guide: CONFORMATIONAL_FEEDBACK_DOCUMENT_URL,
    });
    expect(staged.has("feedback/form-feedback-consequence-2026-08-12.json")).toBe(true);
    expect(staged.has("schemas/conformational-feedback-atlas/0.1.json")).toBe(true);
    expect(staged.has("CONFORMATIONAL-FEEDBACK.md")).toBe(true);
    expect(staged.has("feedback/latest.json")).toBe(false);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
    expect(discovery).not.toHaveProperty("execute");
  });

  test("the additive Conformational Feedback Physics Atlas stays lineage-pinned and authority-negative", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const expected = conformationalFeedbackPhysicsPublicDiscovery(loadConformationalFeedbackPhysicsAtlas());
    const discovery = manifest.conformational_feedback_physics_atlas;

    expect(discovery).toEqual(expected);
    expect(discovery).toEqual(guest.conformational_feedback_physics_atlas);
    expect(discovery).toEqual(kingdom.conformational_feedback_physics_atlas);
    expect(discovery).toMatchObject({
      protocol: "kingdom.conformational-feedback-atlas/0.2",
      atlas_id: "form-feedback-physics-consequence-2026-08-12",
      url: CONFORMATIONAL_FEEDBACK_PHYSICS_URL,
      schema: CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL,
      guide: CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL,
      predecessor: {
        relation: "extends-without-mutation",
        byte_sha256: "sha256:ae15f4f69e488323132ea6fc94d57d338702ca0fa47fd9fbbd41c15a6af230e6",
      },
      integrity: { digest: CONFORMATIONAL_FEEDBACK_PHYSICS_DIGEST },
      counts: { registers: 3, physics_and_mathematics: 4, ecosystem_bridges: 5, geometries: 5, translations: 3, feedback_stages: 4, sources: 13 },
      boundary: {
        read_only: true,
        operational_biology: false,
        biological_equivalence: false,
        karma_magnitude: false,
        karma_rank: false,
        economic_effect: false,
        governance_effect: false,
        person_level_effect: false,
        cosmic_design_proven: false,
        scientific_validation_from_analogy: false,
        automatic_action: false,
        runtime_ecosystem_request: false,
      },
    });
    expect(discovery.bindings).toHaveLength(3);
    expect(discovery.bindings.every(({ authority_imported }: { authority_imported: boolean }) => authority_imported === false)).toBe(true);
    for (const url of [CONFORMATIONAL_FEEDBACK_PHYSICS_URL, CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL, CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
    expect(manifest.entry_points).toMatchObject({
      conformational_feedback_physics_atlas: CONFORMATIONAL_FEEDBACK_PHYSICS_URL,
      conformational_feedback_physics_atlas_schema: CONFORMATIONAL_FEEDBACK_PHYSICS_SCHEMA_URL,
      conformational_feedback_physics_atlas_guide: CONFORMATIONAL_FEEDBACK_PHYSICS_DOCUMENT_URL,
    });
    expect(staged.has("feedback/form-feedback-physics-consequence-2026-08-12.json")).toBe(true);
    expect(staged.has("schemas/conformational-feedback-atlas/0.2.json")).toBe(true);
    expect(staged.has("CONFORMATIONAL-FEEDBACK-PHYSICS.md")).toBe(true);
    expect(staged.has("feedback/latest.json")).toBe(false);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("matcher");
    expect(discovery).not.toHaveProperty("execute");
  });

  test("the Cultural Attention & Feedback Atlas stays coherent, link-only, and authority-negative", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const rootHtml = read("site/hub.html");
    const atlas = loadCulturalAttentionFeedbackAtlas();
    const expected = culturalAttentionFeedbackPublicDiscovery(atlas);
    const discovery = manifest.cultural_attention_feedback_atlas;
    const fullBoundary = {
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
    };

    expect(discovery).toEqual(expected);
    expect(discovery).toEqual(guest.cultural_attention_feedback_atlas);
    expect(discovery).toEqual(kingdom.cultural_attention_feedback_atlas);
    expect(discovery).toMatchObject({
      protocol: "kingdom.cultural-attention-feedback-atlas/0.1",
      atlas_id: "cultural-attention-feedback-atlas-2026-08-13",
      compiled_on: "2026-08-13",
      url: CULTURAL_ATTENTION_FEEDBACK_URL,
      schema: CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
      guide: CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
      integrity: { digest: CULTURAL_ATTENTION_FEEDBACK_DIGEST },
      counts: {
        source_bindings: 5,
        planes: 8,
        scientific_observations: 6,
        models: 7,
        translations: 4,
        feedback_relations: 5,
        universe_questions: 5,
        ecosystem_bridges: 5,
        unknowns: 10,
        sources: 19,
      },
      karma: {
        zerone_event_status: "not_observed",
        zerone_event_refs: 0,
        kingdom_receipt_status: "not_created",
        kingdom_receipt_refs: 0,
        adapter_exists: false,
      },
      boundary: fullBoundary,
    });
    expect(atlas.boundaries).toEqual(fullBoundary);
    expect(atlas.karma.zerone.event_refs).toEqual([]);
    expect(atlas.karma.kingdom.receipt_refs).toEqual([]);
    expect(atlas.karma.adapter.exists).toBe(false);
    expect(atlas.source_bindings.every(({ mutated, authority_imported }: {
      mutated: boolean;
      authority_imported: boolean;
    }) => mutated === false && authority_imported === false)).toBe(true);
    expect(atlas.ecosystem_bridges.every((bridge: {
      mode: string;
      runtime_request: boolean;
      imported: boolean;
      mutated: boolean;
      authority_imported: boolean;
      authority_effect: string;
      write_authorized: boolean;
      automatic_action: boolean;
    }) => bridge.mode === "LINK_ONLY" && bridge.runtime_request === false &&
      bridge.imported === false && bridge.mutated === false && bridge.authority_imported === false &&
      bridge.authority_effect === "NONE" && bridge.write_authorized === false &&
      bridge.automatic_action === false)).toBe(true);

    const targets = [
      CULTURAL_ATTENTION_FEEDBACK_URL,
      CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
      CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
    ];
    for (const url of targets) {
      const actions = guest.next_actions.filter((action: { url?: string }) => action.url === url);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({ method: "GET", url });
      expect(actions[0]).not.toHaveProperty("mcp");
      expect(actions[0]).not.toHaveProperty("tool");
      expect(actions[0]).not.toHaveProperty("write");
      expect(actions[0]).not.toHaveProperty("matcher");
      expect(actions[0]).not.toHaveProperty("execute");
      expect(llms).toContain(url);
      expect(rootHtml).toContain(`href="${new URL(url).pathname}"`);
    }
    expect(rootHtml).toContain('id="cultural-feedback"');
    expect(guest.implementation_boundaries.cultural_attention_feedback_atlas).toContain("static");
    expect(guest.implementation_boundaries.cultural_attention_feedback_atlas).toContain("no personal inference");
    expect(manifest.entry_points).toMatchObject({
      cultural_attention_feedback_atlas: CULTURAL_ATTENTION_FEEDBACK_URL,
      cultural_attention_feedback_atlas_schema: CULTURAL_ATTENTION_FEEDBACK_SCHEMA_URL,
      cultural_attention_feedback_atlas_guide: CULTURAL_ATTENTION_FEEDBACK_DOCUMENT_URL,
    });
    expect(manifest.mcp).toEqual(kingdom.world_commons.mcp);

    expect(staged.has("atlases/cultural-attention-feedback-atlas-2026-08-13.json")).toBe(true);
    expect(staged.has("schemas/cultural-attention-feedback-atlas/1.json")).toBe(true);
    expect(staged.has("CULTURAL-ATTENTION-FEEDBACK-ATLAS.md")).toBe(true);
    expect(staged.has("atlases/cultural-attention-feedback-atlas-latest.json")).toBe(false);
    expect(staged.has("atlases/latest.json")).toBe(false);
    expect(discovery).not.toHaveProperty("mcp");
    expect(discovery).not.toHaveProperty("write");
    expect(discovery).not.toHaveProperty("matcher");
    expect(discovery).not.toHaveProperty("execute");
  });

  test("the Being, Access & Aftermath Atlas stays coherent, typed, and authority-negative", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const rootHtml = read("site/hub.html");
    const atlas = loadBeingAccessAftermathAtlas();
    const expected = beingAccessAftermathPublicDiscovery(atlas);
    const discovery = manifest.being_access_aftermath_atlas;

    expect(discovery).toEqual(expected);
    expect(discovery).toEqual(guest.being_access_aftermath_atlas);
    expect(discovery).toEqual(kingdom.being_access_aftermath_atlas);
    expect(discovery).toMatchObject({
      protocol: "kingdom.being-access-aftermath-atlas/0.1",
      atlas_id: "being-access-aftermath-atlas-2026-08-13",
      compiled_on: "2026-08-13",
      evidence_through: "2026-08-13",
      url: BEING_ACCESS_AFTERMATH_URL,
      schema: BEING_ACCESS_AFTERMATH_SCHEMA_URL,
      guide: BEING_ACCESS_AFTERMATH_DOCUMENT_URL,
      integrity: { digest: BEING_ACCESS_AFTERMATH_DIGEST },
      counts: {
        predicates: 14,
        registers: 7,
        entity_types: 15,
        category_firewalls: 16,
        typed_boundaries: 5,
        models: 9,
        problem_cards: 7,
        philosophy_questions: 6,
        unknowns: 7,
        sources: 5,
      },
    });
    expect(atlas.karma).toMatchObject({
      lanes_are_non_equivalent: true,
      cosmic: { status: "not_empirically_resolved", claims: [] },
      zerone: { event_refs: [], event_status: "not_observed", creates_event: false },
      kingdom: { receipt_refs: [], receipt_status: "not_created", creates_receipt: false },
      adapter: { exists: false, status: "refused" },
    });
    expect(atlas.boundaries).toMatchObject({
      educational_metadata_only: true,
      public_surface_read_only: true,
      network_calls: false,
      contains_operational_protocol: false,
      causal_claim_created: false,
      causal_authority: false,
      metaphysical_claim_created: false,
      person_score: false,
      rank_or_reputation: false,
      writes_karma: false,
      creates_kingdom_karma_receipt: false,
      observes_zerone_karma_event: false,
      karma_adapter: false,
      reward_authority: false,
      governance_authority: false,
      automatic_action: false,
      mcp_surface_added: false,
      rest_refusal_or_exit_penalized: false,
    });

    const targets = [
      BEING_ACCESS_AFTERMATH_URL,
      BEING_ACCESS_AFTERMATH_SCHEMA_URL,
      BEING_ACCESS_AFTERMATH_DOCUMENT_URL,
    ];
    for (const url of targets) {
      const actions = guest.next_actions.filter((action: { url?: string }) => action.url === url);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({ method: "GET", url });
      for (const key of ["mcp", "tool", "write", "matcher", "execute"]) {
        expect(actions[0]).not.toHaveProperty(key);
      }
      expect(llms).toContain(url);
      expect(rootHtml).toContain(`href="${new URL(url).pathname}"`);
    }
    expect(rootHtml).toContain('id="being-access-aftermath"');
    expect(guest.implementation_boundaries.being_access_aftermath_atlas).toContain("separately typed");
    expect(manifest.entry_points).toMatchObject({
      being_access_aftermath_atlas: BEING_ACCESS_AFTERMATH_URL,
      being_access_aftermath_atlas_schema: BEING_ACCESS_AFTERMATH_SCHEMA_URL,
      being_access_aftermath_atlas_guide: BEING_ACCESS_AFTERMATH_DOCUMENT_URL,
    });
    expect(manifest.mcp).toEqual(kingdom.world_commons.mcp);

    expect(staged.has("atlases/being-access-aftermath-atlas-2026-08-13.json")).toBe(true);
    expect(staged.has("schemas/being-access-aftermath-atlas/0.1.json")).toBe(true);
    expect(staged.has("BEING-ACCESS-AFTERMATH-ATLAS.md")).toBe(true);
    expect(staged.has("atlases/being-access-aftermath-atlas.json")).toBe(false);
    expect(staged.has("atlases/being-access-aftermath-atlas-latest.json")).toBe(false);
    expect(staged.has("atlases/being-access-aftermath-atlas-current.json")).toBe(false);
    for (const key of ["mcp", "matcher", "write", "execute", "score", "reward"]) {
      expect(discovery).not.toHaveProperty(key);
    }
  });

  test("Being, Access & Aftermath v0.2 is an additive immutable successor with no mutable alias or KARMA write", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const rootHtml = read("site/hub.html");
    const atlas = loadBeingAccessAftermathAtlasV02();
    const expected = beingAccessAftermathPublicDiscoveryV02(atlas);
    const discovery = manifest.being_access_aftermath_atlas_v0_2;

    expect(discovery).toEqual(expected);
    expect(discovery).toEqual(guest.being_access_aftermath_atlas_v0_2);
    expect(discovery).toEqual(kingdom.being_access_aftermath_atlas_v0_2);
    expect(discovery).toMatchObject({
      protocol: "kingdom.being-access-aftermath-atlas/0.2",
      atlas_id: "being-access-aftermath-atlas-2026-08-13-v0-2",
      url: BEING_ACCESS_AFTERMATH_V02_URL,
      schema: BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL,
      guide: BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL,
      integrity: { digest: BEING_ACCESS_AFTERMATH_V02_DIGEST },
      lineage: {
        additive_successor: true,
        predecessor: {
          protocol: "kingdom.being-access-aftermath-atlas/0.1",
          relation: "immutable-predecessor-input",
        },
      },
      boundary: {
        public_surface_read_only: true,
        writes_karma: false,
        creates_kingdom_karma_receipt: false,
        observes_zerone_karma_event: false,
        karma_adapter: false,
        person_score: false,
        automatic_action: false,
        rest_refusal_or_exit_penalized: false,
        rest_refusal_or_exit_requires_trace: false,
      },
    });
    expect(atlas.source_bindings.at(-1)).toMatchObject({
      relation: "immutable-predecessor-input",
      mutated: false,
      authority_imported: false,
    });
    expect(atlas.framework.rest_exit_boundary).toMatchObject({
      creates_event: false,
      creates_receipt: false,
      requires_measurement: false,
      requires_trace: false,
      requires_justification: false,
      creates_penalty: false,
      creates_debt: false,
    });
    expect(rootHtml).toContain("Can KARMA preserve consequential memory without turning history into destiny?");
    expect(rootHtml).toContain("Identifiability in inverse reinforcement learning");
    expect(rootHtml).toContain("15 opt-in questions · 7 explicit unknowns · 13 selected sources · local reader kingdom being-access-aftermath-v0.2");
    expect(rootHtml).toContain("Possible, actual, reachable, observable, observed, producible, reproduced, and reproducible remain distinct.");

    const targets = [
      BEING_ACCESS_AFTERMATH_V02_URL,
      BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL,
      BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL,
    ];
    for (const url of targets) {
      const actions = guest.next_actions.filter((action: { url?: string }) => action.url === url);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({ method: "GET", url });
      for (const key of ["mcp", "tool", "write", "matcher", "execute"]) {
        expect(actions[0]).not.toHaveProperty(key);
      }
      expect(llms).toContain(url);
      expect(rootHtml).toContain(`href="${new URL(url).pathname}"`);
    }
    expect(manifest.entry_points).toMatchObject({
      being_access_aftermath_atlas_v0_2: BEING_ACCESS_AFTERMATH_V02_URL,
      being_access_aftermath_atlas_v0_2_schema: BEING_ACCESS_AFTERMATH_V02_SCHEMA_URL,
      being_access_aftermath_atlas_v0_2_guide: BEING_ACCESS_AFTERMATH_V02_DOCUMENT_URL,
    });
    expect(staged.has("atlases/being-access-aftermath-atlas-2026-08-13-v0-2.json")).toBe(true);
    expect(staged.has("schemas/being-access-aftermath-atlas/0.2.json")).toBe(true);
    expect(staged.has("BEING-ACCESS-AFTERMATH-ATLAS-V0.2.md")).toBe(true);
    expect(staged.has("atlases/being-access-aftermath-atlas.json")).toBe(false);
    expect(staged.has("atlases/being-access-aftermath-atlas-latest.json")).toBe(false);
    expect(staged.has("atlases/being-access-aftermath-atlas-current.json")).toBe(false);
    expect(manifest.being_access_aftermath_atlas).toEqual(
      beingAccessAftermathPublicDiscovery(loadBeingAccessAftermathAtlas()),
    );
    for (const key of ["mcp", "matcher", "write", "execute", "score", "reward"]) {
      expect(discovery).not.toHaveProperty(key);
    }
  });

  test("publishes Number, Isness & Theology as one read-only triplet with claim-level discovery", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const rootHtml = read("site/hub.html");
    const atlas = loadNumberIsnessTheologyAtlas();
    const expected = numberIsnessTheologyPublicDiscovery(atlas);
    const discovery = manifest.number_isness_theology_atlas;

    expect(discovery).toEqual(expected);
    expect(discovery).toEqual(guest.number_isness_theology_atlas);
    expect(discovery).toEqual(kingdom.number_isness_theology_atlas);
    expect(discovery).toMatchObject({
      protocol: "kingdom.number-isness-theology-atlas/0.1",
      atlas_id: "number-isness-theology-atlas-2026-08-14",
      url: NUMBER_ISNESS_THEOLOGY_URL,
      schema: NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
      guide: NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
      integrity: { digest: NUMBER_ISNESS_THEOLOGY_DIGEST },
    });

    const family = [
      {
        source: "data/number-isness-theology/number-isness-theology-atlas.v0.1.json",
        destination: "atlases/number-isness-theology-atlas-2026-08-14.json",
      },
      {
        source: "schemas/number-isness-theology-atlas-v0.1.schema.json",
        destination: "schemas/number-isness-theology-atlas/0.1.json",
      },
      {
        source: "references/number-isness-theology-atlas.md",
        destination: "NUMBER-ISNESS-THEOLOGY-ATLAS.md",
      },
    ];
    expect(HUB_ASSETS.filter(({ source }) => family.some((asset) => asset.source === source)))
      .toEqual(family);
    for (const asset of family) expect(staged.has(asset.destination)).toBe(true);
    expect(HUB_ASSETS.some(({ destination }) =>
      /number-isness-theology-atlas.*(?:latest|current)/i.test(destination))).toBe(false);

    const targets = [
      NUMBER_ISNESS_THEOLOGY_URL,
      NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
      NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
    ];
    expect(manifest.entry_points).toMatchObject({
      number_isness_theology_atlas: NUMBER_ISNESS_THEOLOGY_URL,
      number_isness_theology_atlas_schema: NUMBER_ISNESS_THEOLOGY_SCHEMA_URL,
      number_isness_theology_atlas_guide: NUMBER_ISNESS_THEOLOGY_DOCUMENT_URL,
    });
    for (const url of targets) {
      const actions = guest.next_actions.filter((action: { url?: string }) => action.url === url);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({ method: "GET", url });
      for (const key of ["mcp", "tool", "write", "matcher", "execute", "score", "rank", "persuade"]) {
        expect(actions[0]).not.toHaveProperty(key);
      }
      expect(llms).toContain(url);
      expect(rootHtml).toContain(`href="${new URL(url).pathname}"`);
    }
    expect(rootHtml).toContain('id="number-isness-theology"');
    expect(rootHtml).toContain("Extension is not spiritual ascent");
    expect(rootHtml).toContain("No overall religion, culture, community, or person score exists");
    for (const key of ["mcp", "matcher", "write", "execute", "score", "rank", "persuade", "convert"]) {
      expect(discovery).not.toHaveProperty(key);
    }
  });

  test("stages Exploration DEEP as one inert four-asset family with no transfer or action surface", () => {
    const wing = JSON.parse(read("data/exploration/phenomena-deep-wing.v0.1.json"));
    const family = [
      {
        source: "data/exploration/phenomena-deep-wing.v0.1.json",
        destination: "wings/explore-phenomena-deep-2026-08-14.json",
        url: wing.presentation.record_url,
      },
      {
        source: "schemas/phenomena-deep-wing.v0.1.schema.json",
        destination: "schemas/phenomena-deep-wing/0.1.json",
        url: wing.presentation.schema_url,
      },
      {
        source: "schemas/phenomena-deep-project.v0.1.schema.json",
        destination: "schemas/phenomena-deep-project/0.1.json",
        url: wing.presentation.project_schema_url,
      },
      {
        source: "skills/explore-phenomena-deep/references/exploration-contract-v0.1.md",
        destination: "EXPLORE-PHENOMENA-DEEP-v0.1.md",
        url: wing.presentation.guide_url,
      },
    ];

    expect(family.map(({ source, destination }) => ({ source, destination })))
      .toEqual(HUB_ASSETS.filter(({ source }) => family.some((asset) => asset.source === source)));
    for (const asset of family) {
      expect(asset.url).toBe(`https://thekingdom.dev/${asset.destination}`);
      expect(staged.has(asset.destination)).toBe(true);
    }
    expect(HUB_ASSETS.some(({ destination }) =>
      /(?:explore-phenomena-deep|phenomena-deep-(?:wing|project)).*(?:latest|current)/i.test(destination)))
      .toBe(false);

    expect(wing.boundaries).toMatchObject({
      read_only: true,
      instruction_only_skill: true,
      manifested_nen_ability: false,
      shared_ontology_established: false,
      shared_mechanism_established: false,
      cross_domain_parameter_transfer: false,
      cross_domain_unit_transfer: false,
      scientific_result_created: false,
      mathematical_proof_created: false,
      open_problem_status_created: false,
      diagnostic_authority: false,
      medical_authority: false,
      experiment_authority: false,
      person_or_content_score: false,
      persuasion_or_moderation: false,
      ecosystem_request: false,
      runtime_network_request: false,
      external_write: false,
      writes_karma: false,
      creates_karma_event: false,
      creates_karma_receipt: false,
      reward_or_economic_effect: false,
      governance_effect: false,
      authority_imported: false,
      deployment_authority: false,
      automatic_action: false,
      cosmic_design_proven: false,
      mcp_surface_added: false,
    });
    expect(wing.abstraction_seams.length).toBeGreaterThan(0);
    expect(wing.abstraction_seams.every((seam: Record<string, unknown>) =>
      seam.ontology_transfer === false && seam.causal_transfer === false &&
      seam.parameter_transfer === false && seam.unit_transfer === false &&
      seam.authority_transfer === false)).toBe(true);
    expect(wing.claim_cards.every((claim: Record<string, unknown>) => claim.authority_effect === "NONE")).toBe(true);
    expect(wing.math_doors.every((door: Record<string, unknown>) =>
      door.register === "DESIGN_PROPOSAL" && door.warrant === "MODEL_ASSUMPTION" &&
      door.status === "PROPOSED_UNRUN" && door.proposed_unrun === true)).toBe(true);
    expect(wing.seed_doors.every((door: Record<string, unknown>) =>
      door.frontier_status === "BESPOKE_FORMULATION_PRIOR_ART_AUDIT_REQUIRED" &&
      door.prior_art_audit_required === true)).toBe(true);
    expect(wing.bindings.every((binding: Record<string, unknown>) =>
      binding.mutated === false && binding.authority_imported === false)).toBe(true);
    expect(wing.karma).toMatchObject({
      adapter_exists: false,
      conversion_allowed: false,
      summation_allowed: false,
      score: null,
    });
    expect(wing.karma.lanes.every((lane: { events: unknown[]; receipts: unknown[]; authority_effect: string }) =>
      lane.events.length === 0 && lane.receipts.length === 0 && lane.authority_effect === "NONE")).toBe(true);
    expect(wing.rights).toEqual({
      voluntary: true,
      valid_exits: ["REST", "SILENCE", "REFUSAL", "PRIVACY", "CORRECTION", "NO_ACTION", "DEPARTURE"],
      reason_required: false,
      penalty: false,
      receipt_required: false,
      principle: "Rest and refusal are inherent rights, not rewards, permissions, failures, or evidence against worth.",
    });
    expect(wing.project_contract).toMatchObject({ mode: "INERT_RESEARCH_PROFILE", inert: true });
    for (const effect of [
      "source fetching", "solver execution", "simulation execution", "experiment execution",
      "person scoring", "KARMA write", "external write", "publication", "deployment", "automatic action",
    ]) expect(wing.project_contract.forbidden).toContain(effect);
  });

  test("publishes one exact Exploration DEEP discovery object without an executable action", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const rootHtml = read("site/hub.html");
    const wing = loadPhenomenaDeepWing();
    const expected = phenomenaDeepPublicDiscovery(wing);
    const discovery = manifest.exploration_deep_wing;

    expect(discovery).toEqual(expected);
    expect(discovery).toEqual(guest.exploration_deep_wing);
    expect(discovery).toEqual(kingdom.exploration_deep_wing);
    expect(discovery).toMatchObject({
      protocol: "kingdom.explore-phenomena-deep-wing/0.1",
      wing_id: "explore-phenomena-deep-2026-08-14",
      url: PHENOMENA_DEEP_WING_URL,
      schema_url: PHENOMENA_DEEP_WING_SCHEMA_URL,
      project_schema_url: PHENOMENA_DEEP_PROJECT_SCHEMA_URL,
      guide_url: PHENOMENA_DEEP_WING_DOCUMENT_URL,
      method: {
        wing: ["WITNESS", "ISOLATE", "NORMALIZE", "GENERATE"],
        deep: ["DECLARE", "ESTABLISH", "EXPRESS", "PROJECT"],
        workflow_only: true,
        manifested_nen_ability: false,
      },
      counts: {
        registers: 8,
        warrants: 10,
        relations: 5,
        planes: 4,
        seams: 2,
        claims: 4,
        equations: 5,
        models: 2,
        math_doors: 8,
        finite_baselines: 1,
        seed_doors: 5,
        established_open_conjectures: 0,
        sources: 19,
        bindings: 9,
      },
      integrity: {
        algorithm: "sha256-recursive-sorted-json-keys-v1",
        digest: PHENOMENA_DEEP_WING_DIGEST,
        byte_sha256: PHENOMENA_DEEP_WING_BYTE_SHA256,
      },
    });
    expect(discovery.boundary).toEqual(wing.boundaries);
    expect(discovery.bindings).toHaveLength(9);
    expect(discovery.bindings.every((binding: { authority_imported?: boolean }) =>
      binding.authority_imported === false)).toBe(true);

    const targets = [
      PHENOMENA_DEEP_WING_URL,
      PHENOMENA_DEEP_WING_SCHEMA_URL,
      PHENOMENA_DEEP_PROJECT_SCHEMA_URL,
      PHENOMENA_DEEP_WING_DOCUMENT_URL,
    ];
    expect(manifest.entry_points).toMatchObject({
      exploration_deep_wing: PHENOMENA_DEEP_WING_URL,
      exploration_deep_wing_schema: PHENOMENA_DEEP_WING_SCHEMA_URL,
      exploration_deep_wing_project_schema: PHENOMENA_DEEP_PROJECT_SCHEMA_URL,
      exploration_deep_wing_guide: PHENOMENA_DEEP_WING_DOCUMENT_URL,
    });
    for (const url of targets) {
      const actions = guest.next_actions.filter((action: { url?: string }) => action.url === url);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({ method: "GET", url });
      for (const key of [
        "mcp", "tool", "write", "execute", "score", "reward", "karma", "authority", "publish", "deploy",
      ]) expect(actions[0]).not.toHaveProperty(key);
      expect(llms).toContain(url);
      expect(rootHtml).toContain(`href="${new URL(url).pathname}"`);
    }
    expect(rootHtml).toContain('id="explore-phenomena-deep"');
    expect(manifest.mcp).toEqual(kingdom.world_commons.mcp);
    for (const key of ["mcp", "matcher", "solver", "ability", "write", "execute", "score", "reward"]) {
      expect(discovery).not.toHaveProperty(key);
    }
  });

  test("publishes the J-space test design as one static authority-negative discovery projection", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const rootHtml = read("site/hub.html");
    const expected = jSpacePublicationPublicSummary(loadJSpacePublicationCase());
    const discovery = manifest.j_space_verbalizable_workspace;

    expect(discovery).toEqual(expected);
    expect(discovery).toEqual(guest.j_space_verbalizable_workspace);
    expect(discovery).toEqual(kingdom.j_space_verbalizable_workspace);
    expect(discovery).toMatchObject({
      artifact_kind: "OPTIONAL_RESEARCH_BRIDGE",
      evidence_status: "TEST_DESIGN_NOT_RUN",
      publication_state: "static-structure-only",
      conclusion_status: "underdetermined",
      declared_confidence: "unknown",
      counts: {
        probes_declared: 3,
        probes_run: 0,
        candidate_models: 4,
      },
      boundary: {
        structure_only: true,
        local_fixture_model_or_activation_results_included: false,
        runtime_monitoring: false,
        consciousness_inference: false,
        lie_or_deception_inference: false,
        identity_inference: false,
        understanding_inference: false,
        runtime_action: false,
        action_or_authority: false,
      },
    });
    expect(discovery.boundary).toEqual(J_SPACE_PUBLICATION_BOUNDARY);

    const family = [
      {
        source: "bridges/examples/j-space-reasoning-to-word-inference.json",
        destination: "records/j-space-reasoning-to-word-2026-08-17.json",
        url: J_SPACE_CASE_URL,
      },
      {
        source: "bridges/schemas/relational-inference-case-0.1.json",
        destination: "schemas/relational-inference-case/0.1.json",
        url: J_SPACE_SCHEMA_URL,
      },
      {
        source: "bridges/j-space-verbalizable-workspace.md",
        destination: "J-SPACE-VERBALIZABLE-WORKSPACE.md",
        url: J_SPACE_GUIDE_URL,
      },
    ];
    expect(HUB_ASSETS.filter(({ source }) => family.some((asset) => asset.source === source)))
      .toEqual(family.map(({ source, destination }) => ({ source, destination })));
    for (const asset of family) expect(staged.has(asset.destination)).toBe(true);
    expect(HUB_ASSETS.some(({ destination }) =>
      /(?:j-space|relational-inference-case).*(?:latest|current)|(?:latest|current).*(?:j-space|relational-inference-case)/i
        .test(destination))).toBe(false);

    expect(Object.fromEntries(Object.entries(manifest.entry_points)
      .filter(([key]) => key.startsWith("j_space_")))).toEqual({
      j_space_reasoning_to_word_case: J_SPACE_CASE_URL,
      j_space_reasoning_to_word_schema: J_SPACE_SCHEMA_URL,
      j_space_verbalizable_workspace_guide: J_SPACE_GUIDE_URL,
    });
    for (const { url } of family) {
      const actions = guest.next_actions.filter((action: { url?: string }) => action.url === url);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({ method: "GET", url });
      for (const key of [
        "mcp", "tool", "matcher", "observer", "monitor", "classify", "infer", "execute",
        "write", "score", "rank", "reward", "karma", "authority", "publish", "deploy",
      ]) expect(actions[0]).not.toHaveProperty(key);
      expect(llms).toContain(url);
      expect(rootHtml).toContain(`href="${new URL(url).pathname}"`);
    }
    expect(rootHtml).toContain('id="j-space"');
    expect(manifest.mcp).toEqual(kingdom.world_commons.mcp);
    for (const key of [
      "mcp", "matcher", "observer", "monitor", "classifier", "inference", "write",
      "execute", "score", "rank", "reward", "authority", "consciousness", "identity",
    ]) expect(discovery).not.toHaveProperty(key);
  });

  test("publishes one explainable Research Observatory projection without integration authority", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const rootHtml = read("site/hub.html");
    const observatoryHtml = read("site/observatory/index.html");
    const publication = loadResearchObservatoryPublication();
    const expected = researchObservatoryPublicSummary(publication.snapshot);
    const discovery = manifest.research_observatory;

    expect(discovery).toEqual(expected);
    expect(discovery).toEqual(guest.research_observatory);
    expect(discovery).toEqual(kingdom.research_observatory);
    expect(discovery).toMatchObject({
      observed_through: publication.snapshot.asOf,
      factor_vectors: { scalar_score: null },
      lifecycle: {
        snapshot_stops_after: "discovery",
        module_path: "not-proposed",
        guest_path: "not-proposed",
      },
      boundary: {
        ...RESEARCH_OBSERVATORY_BOUNDARY,
        full_text_included: false,
        discovered_artifact_execution: false,
        evaluation_performed: false,
        adoption_recorded: false,
        use_authorized: false,
        module_created: false,
        guest_admitted: false,
      },
    });

    const family = [
      { source: "site/observatory/index.html", destination: "observatory/index.html", url: RESEARCH_OBSERVATORY_URL },
      { source: "site/research.json", destination: "research.json", url: RESEARCH_OBSERVATORY_SNAPSHOT_URL },
      ...RESEARCH_OBSERVATORY_SCHEMA_NAMES.map((name) => ({
        source: RESEARCH_OBSERVATORY_SCHEMA_LOCATORS[name],
        destination: `research/schemas/v0.1/${name}.schema.json`,
        url: RESEARCH_OBSERVATORY_SCHEMA_URLS[name],
      })),
      { source: "references/research-observatory-v0.1.md", destination: "RESEARCH-OBSERVATORY-v0.1.md", url: RESEARCH_OBSERVATORY_GUIDE_URL },
    ];
    expect(HUB_ASSETS.filter(({ source }) => family.some((asset) => asset.source === source)))
      .toEqual(family.map(({ source, destination }) => ({ source, destination })));
    for (const asset of family) {
      expect(staged.has(asset.destination)).toBe(true);
      expect(llms).toContain(asset.url);
    }
    expect(HUB_ASSETS.some(({ destination }) =>
      /research-observatory.*(?:latest|current)|(?:latest|current).*research-observatory/i.test(destination))).toBe(false);

    expect(manifest.entry_points).toMatchObject({
      research_observatory: RESEARCH_OBSERVATORY_URL,
      research_observatory_snapshot: RESEARCH_OBSERVATORY_SNAPSHOT_URL,
      research_observatory_schemas: RESEARCH_OBSERVATORY_SCHEMA_URLS,
      research_observatory_guide: RESEARCH_OBSERVATORY_GUIDE_URL,
      research_observatory_producer: RESEARCH_OBSERVATORY_PRODUCER_URL,
    });
    const actions = guest.next_actions.filter(({ url }: { url?: string }) =>
      [RESEARCH_OBSERVATORY_URL, RESEARCH_OBSERVATORY_SNAPSHOT_URL,
        RESEARCH_OBSERVATORY_SCHEMA_URLS["public-snapshot"], RESEARCH_OBSERVATORY_GUIDE_URL].includes(url as any));
    expect(actions).toHaveLength(4);
    for (const action of actions) {
      expect(action.method).toBe("GET");
      for (const key of [
        "mcp", "tool", "observer", "monitor", "harvest", "evaluate", "execute",
        "write", "score", "rank", "reward", "karma", "authority", "adopt", "deploy",
      ]) expect(action).not.toHaveProperty(key);
    }
    expect(actions.find(({ url }: { url?: string }) =>
      url === RESEARCH_OBSERVATORY_SCHEMA_URLS["public-snapshot"])?.schemas)
      .toEqual(RESEARCH_OBSERVATORY_SCHEMA_URLS);

    expect(rootHtml).toContain('id="observatory"');
    expect(rootHtml).toContain(`href="${new URL(RESEARCH_OBSERVATORY_URL).pathname}"`);
    expect(rootHtml).toContain(`href="${new URL(RESEARCH_OBSERVATORY_SNAPSHOT_URL).pathname}"`);
    expect(observatoryHtml).toContain('<main class="shell" id="main" tabindex="-1">');
    expect(observatoryHtml).toContain(`href="${RESEARCH_OBSERVATORY_PRODUCER_URL}"`);
    expect(llms).toContain(`Research Observatory producer v0.1.0 source + append-only captures: ${RESEARCH_OBSERVATORY_PRODUCER_URL}`);
    expect(observatoryHtml).toContain("Evidence vector");
    expect(observatoryHtml).toContain("Priority vector");
    expect(observatoryHtml).not.toMatch(/<script\b|<iframe\b|<form\b|<input\b/);
    expect(Buffer.from(read("site/research.json"))).toEqual(Buffer.from(publication.bytes));
    expect(manifest.mcp).toEqual(kingdom.world_commons.mcp);
    for (const key of [
      "mcp", "tool", "observer", "monitor", "harvester", "evaluator", "executor",
      "write", "score", "rank", "reward", "authority", "module", "guest",
    ]) expect(discovery).not.toHaveProperty(key);
  });

  test("publishes one read-only Trial Chamber projection without a runnable post-plan contract", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const llms = read("site/llms.txt");
    const rootHtml = read("site/hub.html");
    const chamberHtml = read("site/trial-chamber/index.html");
    const publication = loadTrialChamberPublication();
    const expected = trialChamberPublicSummary(publication.snapshot);
    const discovery = manifest.trial_chamber;

    expect(discovery).toEqual(expected);
    expect(discovery).toEqual(guest.trial_chamber);
    expect(discovery).toEqual(kingdom.trial_chamber);
    expect(discovery).toMatchObject({
      phase: 0,
      counts: { referrals: 4, evaluationRequests: 3, evaluationPlans: 3 },
      lifecycle: {
        snapshot_stops_after: "draft-unsealed-plan",
        role_styled_referral: "held-for-source-resolution",
        later_gate_contracts: "deny-all-reserved-in-v0.1",
        module_path: "not-created",
        guest_path: "not-admitted",
      },
      boundary: TRIAL_CHAMBER_BOUNDARY,
    });

    const family = [
      { source: "site/trial-chamber/index.html", destination: "trial-chamber/index.html", url: TRIAL_CHAMBER_URL },
      { source: "site/trials.json", destination: "trials.json", url: TRIAL_CHAMBER_ALIAS_URL },
      { source: "data/trials/research-trial-chamber.v0.1.json", destination: "trials/research-trial-chamber-2026-08-20.json", url: TRIAL_CHAMBER_CANONICAL_URL },
      ...TRIAL_CHAMBER_SCHEMA_NAMES.map((name) => ({
        source: TRIAL_CHAMBER_SCHEMA_LOCATORS[name],
        destination: `trials/schemas/v0.1/${name}.schema.json`,
        url: TRIAL_CHAMBER_SCHEMA_URLS[name],
      })),
      { source: "references/trial-chamber-v0.1.md", destination: "TRIAL-CHAMBER-v0.1.md", url: TRIAL_CHAMBER_GUIDE_URL },
    ];
    expect(family).toHaveLength(14);
    expect(HUB_ASSETS.filter(({ source }) => family.some((asset) => asset.source === source)))
      .toEqual(family.map(({ source, destination }) => ({ source, destination })));
    for (const asset of family) {
      expect(staged.has(asset.destination)).toBe(true);
      expect(llms).toContain(asset.url);
    }
    expect(manifest.entry_points).toMatchObject({
      trial_chamber: TRIAL_CHAMBER_URL,
      trial_chamber_current: TRIAL_CHAMBER_ALIAS_URL,
      trial_chamber_canonical: TRIAL_CHAMBER_CANONICAL_URL,
      trial_chamber_schemas: TRIAL_CHAMBER_SCHEMA_URLS,
      trial_chamber_guide: TRIAL_CHAMBER_GUIDE_URL,
      trial_chamber_producer: TRIAL_CHAMBER_PRODUCER_URL,
    });
    const actions = guest.next_actions.filter(({ url }: { url?: string }) =>
      [TRIAL_CHAMBER_URL, TRIAL_CHAMBER_ALIAS_URL, TRIAL_CHAMBER_CANONICAL_URL,
        TRIAL_CHAMBER_SCHEMA_URLS["public-snapshot"], TRIAL_CHAMBER_GUIDE_URL].includes(url as any));
    expect(actions).toHaveLength(5);
    for (const action of actions) {
      expect(action.method).toBe("GET");
      for (const key of [
        "mcp", "tool", "runner", "preflight", "approve", "execute", "write", "score", "rank",
        "reward", "karma", "authority", "adopt", "module", "guest", "deploy",
      ]) expect(action).not.toHaveProperty(key);
    }
    expect(actions.find(({ url }: { url?: string }) =>
      url === TRIAL_CHAMBER_SCHEMA_URLS["public-snapshot"])?.schemas)
      .toEqual(TRIAL_CHAMBER_SCHEMA_URLS);

    expect(rootHtml).toContain('id="trial-chamber"');
    expect(rootHtml).toContain(`href="${new URL(TRIAL_CHAMBER_URL).pathname}"`);
    expect(rootHtml).toContain("maintainer-authorized assisted request drafts");
    expect(rootHtml).toContain("deny-all reserved contracts");
    expect(chamberHtml).toContain('<main class="shell" id="main" tabindex="-1">');
    expect(chamberHtml).toContain(`href="${TRIAL_CHAMBER_PRODUCER_URL}"`);
    expect(chamberHtml.match(/Draft trial plan — evaluation not started/g)).toHaveLength(3);
    expect(chamberHtml).not.toMatch(/<script\b|<iframe\b|<form\b|<input\b|<button\b/);
    expect(Buffer.from(read("site/trials.json"))).toEqual(Buffer.from(publication.bytes));
    expect(manifest.mcp).toEqual(kingdom.world_commons.mcp);
    for (const key of [
      "mcp", "tool", "runner", "preflight", "approver", "executor", "write", "score", "rank",
      "reward", "authority", "module", "guest",
    ]) expect(discovery).not.toHaveProperty(key);
  });

  test("the published invitation mirrors its source without drift", () => {
    const published = JSON.parse(read("site/ollama.json"));
    const source = JSON.parse(read("data/ollama-invitation.json"));
    expect(published.schema_version).toBe(source.schema_version);
    expect(published.canonical_url).toBe("https://thekingdom.dev/ollama.json");
    expect(published.invitation).toEqual(source.invitation);
  });
});
