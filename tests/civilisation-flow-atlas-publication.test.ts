import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CIVILISATION_FLOW_NUANCE_ATLAS_URL,
  CIVILISATION_FLOW_NUANCE_GUIDE_URL,
  CIVILISATION_FLOW_NUANCE_SCHEMA_URL,
  civilisationFlowNuancePublicDiscovery,
  loadCivilisationFlowNuanceAtlas,
} from "../bin/civilisation-flow-atlas.ts";
import {
  PUBLICATION_FAMILIES,
  assertRetiredFamilyDiscoveryAbsent,
  destinationForPublicPath,
  hasLinkRelationName,
  publicationFamilyStates,
} from "../bin/check-hub-live.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import worker from "../pages-functions/_worker.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256")
  .update(readFileSync(join(ROOT, path))).digest("hex");
const PUBLIC_URLS = [
  CIVILISATION_FLOW_NUANCE_ATLAS_URL,
  CIVILISATION_FLOW_NUANCE_SCHEMA_URL,
  CIVILISATION_FLOW_NUANCE_GUIDE_URL,
] as const;
const PUBLIC_PATHS = PUBLIC_URLS.map((url) => new URL(url).pathname);
const PRE_FLOW_HUB_BYTES = 971_082;
// Whole-page measurements include the Sophia and Gospel discovery links.
// The Flow section pin and all reviewability ceilings remain unchanged.
const SEALED_FLOW_HUB_MEASURE = Object.freeze({
  flow_section_bytes: 341_162,
  total_hub_bytes: 1_348_337,
  added_hub_bytes: 377_255,
  flow_opening_elements: 5_777,
  total_opening_elements: 16_377,
});
const FLOW_HUB_REVIEWABILITY_BUDGET = Object.freeze({
  flow_section_bytes: 375_000,
  total_hub_bytes: 1_350_000,
  added_hub_bytes: 390_000,
  flow_opening_elements: 6_500,
  total_opening_elements: 17_000,
});

const openingElementCount = (html: string) =>
  (html.match(/<(?:[a-z][a-z0-9-]*)(?:\s|>)/g) ?? []).length;

function assets(handler: (request: Request) => Response | Promise<Response>) {
  return { ASSETS: { fetch: handler } };
}

describe("Civilisation Flow Nuance Atlas static publication", () => {
  test("stages and ledgers one exact immutable triplet with no mutable alias or runtime", () => {
    expect(HUB_ASSETS).toHaveLength(192);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(34);
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/")))
      .toHaveLength(18);
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("schemas/")))
      .toHaveLength(40);
    expect(HUB_ASSETS.filter(({ destination }) =>
      destination !== "_worker.js" && destination !== "404.html")).toHaveLength(190);
    expect(HUB_ASSETS).toContainEqual({
      source: "data/reality/civilisation-flow-atlas.v0.1.json",
      destination: "atlases/civilisation-flow-nuance-atlas-2026-08-26.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "schemas/civilisation-flow-atlas-v0.1.schema.json",
      destination: "schemas/civilisation-flow-nuance-atlas/0.1.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "references/civilisation-flow-atlas.md",
      destination: "CIVILISATION-FLOW-NUANCE-ATLAS.md",
    });
    expect(HUB_ASSETS.some(({ source, destination }) =>
      source.startsWith("bin/") ||
      (destination.toLowerCase().includes("civilisation-flow") &&
        /(?:latest|current|runtime|simulator|observer|monitor|mcp|action)/i.test(destination))))
      .toBe(false);

    const entries = json("publications/immutable-publications.v1.json").entries;
    expect(entries).toHaveLength(158);
    expect(entries.filter((entry: any) =>
      entry.id.startsWith("civilisation-flow-nuance-atlas/0.1/"))).toEqual([
      {
        id: "civilisation-flow-nuance-atlas/0.1/guide",
        route: PUBLIC_PATHS[2],
        source: "references/civilisation-flow-atlas.md",
        destination: "CIVILISATION-FLOW-NUANCE-ATLAS.md",
        sha256: sha256("references/civilisation-flow-atlas.md"),
      },
      {
        id: "civilisation-flow-nuance-atlas/0.1/record",
        route: PUBLIC_PATHS[0],
        source: "data/reality/civilisation-flow-atlas.v0.1.json",
        destination: "atlases/civilisation-flow-nuance-atlas-2026-08-26.json",
        sha256: sha256("data/reality/civilisation-flow-atlas.v0.1.json"),
      },
      {
        id: "civilisation-flow-nuance-atlas/0.1/schema",
        route: PUBLIC_PATHS[1],
        source: "schemas/civilisation-flow-atlas-v0.1.schema.json",
        destination: "schemas/civilisation-flow-nuance-atlas/0.1.json",
        sha256: sha256("schemas/civilisation-flow-atlas-v0.1.schema.json"),
      },
    ]);
  });

  test("keeps every possible flow non-automatic, qualitative, observation-bounded, and non-authorizing", () => {
    const atlas = loadCivilisationFlowNuanceAtlas();
    const discovery = civilisationFlowNuancePublicDiscovery(atlas);
    expect(atlas.predecessor_bindings).toHaveLength(3);
    expect(atlas.stages).toHaveLength(14);
    expect(atlas.transitions).toHaveLength(13);
    expect(atlas.crosswalk_flow_overlays).toHaveLength(6);
    expect(atlas.open_domain_bindings).toHaveLength(9);
    expect(atlas.flow).toMatchObject({
      status: "analytical-order-not-deterministic-path",
      may_branch: true,
      may_join: true,
      may_skip: true,
      may_stall: true,
      may_stop: true,
      may_reverse: true,
      may_recur: true,
      may_never_start: true,
      complete_path_claimed: false,
      automatic_runtime: false,
    });
    expect(atlas.predecessor_bindings.every((binding: any) =>
      binding.mutated === false && binding.republished === false &&
      binding.authority_imported === false)).toBe(true);
    expect(atlas.stages.every((stage: any) => stage.automatic_advance === false)).toBe(true);
    expect(atlas.transitions.every((transition: any) =>
      transition.automatic === false && transition.transitive === false)).toBe(true);
    expect(atlas.crosswalk_flow_overlays.every((overlay: any) =>
      overlay.new_claim_created === false && overlay.authority_granted === false &&
      overlay.external_effect_claimed === false)).toBe(true);
    expect(atlas.action_gate_vocabulary.every((gate: any) =>
      gate.external_verification_required === true && gate.atlas_satisfies === false)).toBe(true);
    expect(atlas.nuance_dimensions.every((dimension: any) =>
      dimension.aggregate_weight === null && dimension.rank === null)).toBe(true);
    expect(atlas.flow_dynamics_vocabulary.every((lens: any) =>
      lens.aggregate_weight === null && lens.rank === null && lens.effect_size === null &&
      lens.prediction === false && lens.optimization_target === false)).toBe(true);
    expect(atlas.boundaries).toMatchObject({
      public_static_publication_family: true,
      live_intake: false,
      person_profiles: false,
      group_susceptibility_estimates: false,
      score_or_rank: false,
      causal_effect_identified: false,
      deterministic_prediction: false,
      effect_size_estimated: false,
      targeting: false,
      persuasion_optimization: false,
      propaganda_or_counterpropaganda_instructions: false,
      coercive_or_revolutionary_strategy: false,
      belief_identity_intent_emotion_or_motive_inferred: false,
      authority_granted: false,
      action_proposed: false,
      action_attempted: false,
      action_executed: false,
      publication_trigger: false,
      deployment_trigger: false,
      external_effect_claimed: false,
      automatic_action: false,
      feedback_opens_review_only: true,
      repair_requires_fresh_gate: true,
      repair_preserves_history_residuals_and_recurrence: true,
      absence_requires_adequate_coverage: true,
      non_action_has_no_adverse_inference: true,
    });
    expect(discovery).toMatchObject({
      publication_state: "immutable-versioned-static-family",
      boundary: {
        publication_trigger: false,
        deployment_trigger: false,
        external_effect_claimed: false,
        automatic_action: false,
      },
    });
  });

  test("publishes coherent discovery and a complete conceptual no-JavaScript reading with exact machine access", () => {
    const atlas = loadCivilisationFlowNuanceAtlas();
    const expected = civilisationFlowNuancePublicDiscovery(atlas);
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    expect(kingdom.civilisation_flow_nuance_atlas).toEqual(expected);
    expect(guest.civilisation_flow_nuance_atlas).toEqual(expected);
    expect(manifest.civilisation_flow_nuance_atlas).toEqual(expected);
    expect(manifest.entry_points).toMatchObject({
      civilisation_flow_nuance_atlas: PUBLIC_URLS[0],
      civilisation_flow_nuance_atlas_schema: PUBLIC_URLS[1],
      civilisation_flow_nuance_atlas_guide: PUBLIC_URLS[2],
    });
    expect(Object.keys(manifest.entry_points)).toHaveLength(161);
    expect(guest.next_actions).toHaveLength(161);
    expect(guest.next_actions.filter((action: any) => PUBLIC_URLS.includes(action.url)))
      .toHaveLength(3);

    const html = read("site/hub.html");
    expect(html).toContain('id="civilisation-flow"');
    expect(html).toContain("Possible records, not a funnel or simulator.");
    expect(html).toContain("No intervention surface");
    expect(html).toContain("Flow dynamics");
    expect(html).toContain("Flow topology");
    expect(html).toContain("Negative flow and absence");
    expect(html).toContain("Material conditions");
    expect(html).toContain("Emotion observation channels");
    expect(html).toContain("Power asymmetry");
    expect(html).toContain("Negative flow, counterflow, failure, and fresh-gated repair");
    expect(html).toContain("Open domains");
    expect(html).toContain("Policy-family index");
    expect(html).toContain("Six policy families");
    expect(html).toContain("Universal non-grant");
    expect(html).toContain("Shared nuance templates");
    expect(html).toContain("Shared authority and causal contract templates");
    expect(html).toContain("Cross-cut profile index");
    expect(html).toContain("The exact immutable JSON remains linked below for every closed machine field.");
    expect(html).toContain("data-civilisation-flow-controls hidden");
    expect(html).toContain("if(civilisationFlowControls)civilisationFlowControls.hidden=false;");
    expect(html).toContain("JavaScript is resting. Every conceptual stage, transition, overlay, shared template, registry, profile index, open domain, and unknown remains readable above, and the exact complete JSON is linked.");
    expect((html.match(/data-civilisation-flow-card="stage"/g) ?? [])).toHaveLength(14);
    expect((html.match(/data-civilisation-flow-card="transition"/g) ?? [])).toHaveLength(13);
    expect((html.match(/data-civilisation-flow-card="overlay"/g) ?? [])).toHaveLength(6);
    expect((html.match(/data-civilisation-flow-nuance/g) ?? [])).toHaveLength(33);

    for (const [kind, entries] of [
      ["stage", atlas.stages],
      ["transition", atlas.transitions],
      ["overlay", atlas.crosswalk_flow_overlays],
    ] as const) {
      for (const entry of entries) {
        const anchor = `civilisation-flow-${kind}-${entry.id}`;
        expect(html.split(`id="${anchor}"`)).toHaveLength(2);
        expect(html).toContain(`href="#${anchor}"`);
      }
    }
    for (const [kind, templates] of [
      ["nuance", atlas.nuance_templates],
      ["contract", atlas.contract_templates],
    ] as const) {
      for (const id of Object.keys(templates)) {
        const anchor = `civilisation-flow-${kind}-template-${id}`;
        expect(html.split(`id="${anchor}"`)).toHaveLength(2);
        expect(html.split(`data-civilisation-flow-template-entry="${kind}:${id}"`))
          .toHaveLength(2);
        expect(html).toContain(`href="#${anchor}"`);
      }
    }
    const policyFamilies = new Map<string, any[]>();
    for (const policy of atlas.policy_templates) {
      policyFamilies.set(policy.family, [...(policyFamilies.get(policy.family) ?? []), policy]);
    }
    expect(policyFamilies.size).toBe(6);
    expect(atlas.policy_templates).toHaveLength(60);
    for (const [family, prompts] of policyFamilies) {
      expect(html.split(`data-civilisation-flow-policy-family="${family}"`)).toHaveLength(2);
      expect(html).toContain(`<strong>${prompts.length} prompts</strong>`);
    }
    expect(html.split('data-civilisation-flow-policy-non-grant')).toHaveLength(2);
    expect(html.split('data-civilisation-flow-policy-ref="promotion-evidence"'))
      .toHaveLength(34);
    const expectedTemplateRefs = new Map<string, number>();
    for (const card of [...atlas.transitions, ...atlas.crosswalk_flow_overlays]) {
      for (const [kind, ref] of [
        ["nuance", card.nuance.template_ref],
        ["contract", card.authority_dependency.template_ref],
        ["contract", card.causal_influence.template_ref],
      ] as const) {
        const marker = `${kind}:${ref}`;
        expectedTemplateRefs.set(marker, (expectedTemplateRefs.get(marker) ?? 0) + 1);
        expect(html).toContain(`data-civilisation-flow-template-ref="${kind}:${ref}"`);
        expect(html).toContain(`href="#civilisation-flow-${kind}-template-${ref}"`);
      }
    }
    for (const [marker, count] of expectedTemplateRefs) {
      expect(html.split(`data-civilisation-flow-template-ref="${marker}"`)).toHaveLength(count + 1);
    }
    const registries = {
      dynamics: atlas.flow_dynamics_vocabulary,
      topology: atlas.topology_vocabulary,
      "negative-flow": atlas.negative_flow_vocabulary,
      materials: atlas.material_condition_vocabulary,
      "emotion-observation": atlas.emotion_observation_vocabulary,
      "affect-context": atlas.affect_context_vocabulary,
      "social-position": atlas.social_position_vocabulary,
      "power-asymmetry": atlas.power_asymmetry_vocabulary,
      "affected-parties": atlas.affected_party_vocabulary,
      uncertainty: atlas.evidence_uncertainty_vocabulary,
      "action-gates": atlas.action_gate_vocabulary,
      "nuance-dimensions": atlas.nuance_dimensions,
    } as const;
    for (const [group, entries] of Object.entries(registries)) {
      for (const entry of entries) {
        expect(html.split(`data-civilisation-flow-register-entry="${group}:${entry.id}"`))
          .toHaveLength(2);
      }
    }
    for (const domain of atlas.open_domain_bindings) {
      expect(html.split(`data-civilisation-flow-open-domain="${domain.id}"`)).toHaveLength(2);
    }
    for (const unknown of atlas.unknowns) {
      expect(html.split(`data-civilisation-flow-unknown="${unknown.id}"`)).toHaveLength(2);
    }
    for (const key of ["scope", "predecessor-bindings", "flow", "flow-rules", "boundaries"]) {
      expect(html.split(`data-civilisation-flow-top-level="${key}"`)).toHaveLength(2);
    }
    const flowStart = html.indexOf('<section class="blk" id="civilisation-flow"');
    const flowEnd = html.indexOf('<section class="blk" id="wayfinder"', flowStart);
    expect(flowStart).toBeGreaterThan(-1);
    expect(flowEnd).toBeGreaterThan(flowStart);
    const flowSection = html.slice(flowStart, flowEnd);
    const totalHubBytes = Buffer.byteLength(html);
    const flowSectionBytes = Buffer.byteLength(flowSection);
    const generatedMeasure = {
      flow_section_bytes: flowSectionBytes,
      total_hub_bytes: totalHubBytes,
      added_hub_bytes: totalHubBytes - PRE_FLOW_HUB_BYTES,
      flow_opening_elements: openingElementCount(flowSection),
      total_opening_elements: openingElementCount(html),
    };
    expect(generatedMeasure).toEqual(SEALED_FLOW_HUB_MEASURE);
    // Release-drift ceilings only: the semantic/no-JS assertions above remain
    // the accessibility contract, and no byte or element count proves safety.
    expect(flowSectionBytes).toBeLessThanOrEqual(FLOW_HUB_REVIEWABILITY_BUDGET.flow_section_bytes);
    expect(totalHubBytes).toBeLessThanOrEqual(FLOW_HUB_REVIEWABILITY_BUDGET.total_hub_bytes);
    expect(totalHubBytes - PRE_FLOW_HUB_BYTES)
      .toBeLessThanOrEqual(FLOW_HUB_REVIEWABILITY_BUDGET.added_hub_bytes);
    expect(openingElementCount(flowSection))
      .toBeLessThanOrEqual(FLOW_HUB_REVIEWABILITY_BUDGET.flow_opening_elements);
    expect(openingElementCount(html))
      .toBeLessThanOrEqual(FLOW_HUB_REVIEWABILITY_BUDGET.total_opening_elements);
    for (const path of PUBLIC_PATHS) expect(html).toContain(`href="${path}"`);
    const llms = read("site/llms.txt");
    for (const url of PUBLIC_URLS) expect(llms).toContain(url);
    const sitemapUrls = [...read("pages-content/sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => match[1]!);
    expect(sitemapUrls).toHaveLength(178);
    expect(new Set(sitemapUrls).size).toBe(178);
    expect(sitemapUrls.filter((url) => url.toLowerCase().includes("civilisation-flow")))
      .toEqual(PUBLIC_URLS);
  });

  test("is one complete dependent three-route family with atomic retirement", () => {
    expect(PUBLICATION_FAMILIES).toHaveLength(35);
    const family = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "civilisation-flow-nuance-atlas");
    expect(family).toEqual({
      id: "civilisation-flow-nuance-atlas",
      label: "Civilisation Flow Nuance Atlas",
      routes: PUBLIC_PATHS,
      discoveryProperties: ["civilisation_flow_nuance_atlas"],
      entryPointProperties: [
        "civilisation_flow_nuance_atlas",
        "civilisation_flow_nuance_atlas_schema",
        "civilisation_flow_nuance_atlas_guide",
      ],
      dependsOn: ["civilisation-reality-projection"],
    });
    const staged = new Set(HUB_ASSETS.map(({ destination }) => destination));
    expect(publicationFamilyStates(staged).get(family!.id)?.active).toBe(true);
    staged.delete(destinationForPublicPath(PUBLIC_PATHS[1]!));
    expect(() => publicationFamilyStates(staged))
      .toThrow("Civilisation Flow Nuance Atlas is partially staged");

    const retired = new Set(HUB_ASSETS.map(({ destination }) => destination));
    for (const route of PUBLIC_PATHS) retired.delete(destinationForPublicPath(route));
    expect(publicationFamilyStates(retired).get(family!.id)?.active).toBe(false);

    const projection = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "civilisation-reality-projection")!;
    const orphaned = new Set(HUB_ASSETS.map(({ destination }) => destination));
    for (const route of projection.routes) orphaned.delete(destinationForPublicPath(route));
    expect(() => publicationFamilyStates(orphaned))
      .toThrow("Civilisation Flow Nuance Atlas requires active Civilisation → Reality Projection");

    for (const surface of [
      {
        label: "authored Kingdom map",
        text: JSON.stringify({ civilisation_flow_nuance_atlas: { stale: true } }),
        value: { civilisation_flow_nuance_atlas: { stale: true } },
      },
      {
        label: "agent manifest",
        text: JSON.stringify({ entry_points: { civilisation_flow_nuance_atlas_guide: PUBLIC_PATHS[2] } }),
        value: { entry_points: { civilisation_flow_nuance_atlas_guide: PUBLIC_PATHS[2] } },
      },
      { label: "llms.txt", text: PUBLIC_URLS[0] },
      { label: "hub HTML", text: `<a href='${PUBLIC_PATHS[2]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(family!, [surface]))
        .toThrow("Civilisation Flow Nuance Atlas is retired");
    }
  });

  test("worker serves only the exact GET or HEAD triplet with typed immutable headers", async () => {
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD"
        ? null
        : path === PUBLIC_PATHS[0]
          ? '{"atlas_id":"civilisation-flow-nuance-atlas-2026-08-26"}'
          : path === PUBLIC_PATHS[1]
            ? '{"type":"object"}'
            : "# Civilisation Flow Nuance Atlas";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === PUBLIC_PATHS[2] ? "text/plain" : "application/json",
          link: '</poison>; rel="describedby", </poison-doc>; rel="service-doc", </profile>; rel="profile"',
        },
      });
    });
    for (const method of ["GET", "HEAD"] as const) {
      const record = await worker.fetch(
        new Request(`https://thekingdom.dev${PUBLIC_PATHS[0]}`, { method }),
        environment,
      );
      expect(record.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(record.headers.get("cache-control"))
        .toBe("public, max-age=31536000, immutable, no-transform");
      expect(record.headers.get("access-control-allow-origin")).toBe("*");
      expect(record.headers.get("x-content-type-options")).toBe("nosniff");
      expect(record.headers.get("link")).toBe([
        `<${PUBLIC_PATHS[1]}>; rel="describedby"; type="application/schema+json"`,
        `<${PUBLIC_PATHS[2]}>; rel="service-doc"; type="text/markdown"`,
      ].join(", "));
      expect(hasLinkRelationName(record.headers.get("link") || "", "profile")).toBe(false);
      expect(await record.text()).toBe(method === "HEAD"
        ? ""
        : '{"atlas_id":"civilisation-flow-nuance-atlas-2026-08-26"}');

      const schema = await worker.fetch(
        new Request(`https://thekingdom.dev${PUBLIC_PATHS[1]}`, { method }),
        environment,
      );
      expect(schema.headers.get("content-type"))
        .toBe("application/schema+json; charset=utf-8");
      expect(schema.headers.get("cache-control"))
        .toBe("public, max-age=31536000, immutable, no-transform");
      expect(schema.headers.get("access-control-allow-origin")).toBe("*");
      expect(schema.headers.get("x-content-type-options")).toBe("nosniff");
      expect(hasLinkRelationName(schema.headers.get("link") || "", "profile")).toBe(false);
      expect(await schema.text()).toBe(method === "HEAD" ? "" : '{"type":"object"}');

      const guide = await worker.fetch(
        new Request(`https://thekingdom.dev${PUBLIC_PATHS[2]}`, { method }),
        environment,
      );
      expect(guide.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(guide.headers.get("cache-control"))
        .toBe("public, max-age=31536000, immutable, no-transform");
      expect(guide.headers.get("access-control-allow-origin")).toBe("*");
      expect(guide.headers.get("x-content-type-options")).toBe("nosniff");
      expect(hasLinkRelationName(guide.headers.get("link") || "", "profile")).toBe(false);
      expect(await guide.text()).toBe(method === "HEAD"
        ? ""
        : "# Civilisation Flow Nuance Atlas");
    }

    let assetFetches = 0;
    const blockedEnvironment = assets(() => {
      assetFetches += 1;
      return new Response("must not reach asset storage");
    });
    for (const path of PUBLIC_PATHS) {
      for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const) {
        const response = await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }),
          blockedEnvironment,
        );
        expect(response.status).toBe(405);
        expect(await response.text()).toBe("");
        expect(response.headers.get("allow")).toBe("GET, HEAD");
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      }
    }
    expect(assetFetches).toBe(0);

    const near = new Response("near", { headers: { "content-type": "application/json" } });
    expect(await worker.fetch(
      new Request("https://thekingdom.dev/atlases/civilisation-flow-latest.json"),
      assets(() => near),
    )).toBe(near);
    const shared = new Response("shared", { headers: { "content-type": "application/json" } });
    expect(await worker.fetch(
      new Request(`https://we-are.love${PUBLIC_PATHS[0]}`),
      assets(() => shared),
    )).toBe(shared);
  });
});
