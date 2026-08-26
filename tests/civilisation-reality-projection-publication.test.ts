import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CIVILISATION_REALITY_PROJECTION_DOCUMENT_URL,
  CIVILISATION_REALITY_PROJECTION_SCHEMA_URL,
  CIVILISATION_REALITY_PROJECTION_URL,
  civilisationRealityPublicDiscovery,
  loadCivilisationRealityProjection,
} from "../bin/civilisation-reality-projection.ts";
import {
  PUBLICATION_FAMILIES,
  assertRetiredFamilyDiscoveryAbsent,
  destinationForPublicPath,
  hasLinkRelationName,
  publicationFamilyStates,
} from "../bin/check-hub-live.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";
import worker from "../pages-functions/_worker.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const htmlEscape = (value: unknown) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const sha256 = (path: string) => createHash("sha256")
  .update(readFileSync(join(ROOT, path))).digest("hex");
const PUBLIC_URLS = [
  CIVILISATION_REALITY_PROJECTION_URL,
  CIVILISATION_REALITY_PROJECTION_SCHEMA_URL,
  CIVILISATION_REALITY_PROJECTION_DOCUMENT_URL,
] as const;
const PUBLIC_PATHS = PUBLIC_URLS.map((url) => new URL(url).pathname);

function assets(handler: (request: Request) => Response | Promise<Response>) {
  return { ASSETS: { fetch: handler } };
}

describe("Civilisation → Reality Projection static publication", () => {
  test("recognizes and forbids profile relations on the live projection record", () => {
    expect(hasLinkRelationName('</profile>; rel="profile"', "profile")).toBe(true);
    expect(hasLinkRelationName('</mixed>; rel="alternate profile"; type="text/html"', "profile"))
      .toBe(true);
    expect(hasLinkRelationName('</schema>; rel="describedby"; type="application/schema+json"', "profile"))
      .toBe(false);
  });

  test("stages and ledgers one exact immutable triplet without publishing its research predecessor", () => {
    expect(HUB_ASSETS).toHaveLength(166);
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/")))
      .toHaveLength(13);
    expect(HUB_ASSETS).toContainEqual({
      source: "data/reality/civilisation-reality-projection.v0.1.json",
      destination: "atlases/civilisation-reality-projection-2026-08-25.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "schemas/civilisation-reality-projection-v0.1.schema.json",
      destination: "schemas/civilisation-reality-projection/0.1.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "references/civilisation-reality-projection.md",
      destination: "CIVILISATION-REALITY-PROJECTION.md",
    });
    expect(HUB_ASSETS.some(({ source }) =>
      source === "data/language/word-story-religion-civilisation-map.v0.1.json"))
      .toBe(false);
    expect(HUB_ASSETS.some(({ source, destination }) =>
      source.startsWith("bin/") ||
      (destination.toLowerCase().includes("civilisation-reality") &&
        /(?:latest|current|runtime|observer|monitor|mcp)/i.test(destination))))
      .toBe(false);

    const entries = json("publications/immutable-publications.v1.json").entries;
    expect(entries).toHaveLength(135);
    expect(entries.filter((entry: any) =>
      entry.id.startsWith("civilisation-reality-projection/0.1/"))).toEqual([
      {
        id: "civilisation-reality-projection/0.1/guide",
        route: PUBLIC_PATHS[2],
        source: "references/civilisation-reality-projection.md",
        destination: "CIVILISATION-REALITY-PROJECTION.md",
        sha256: sha256("references/civilisation-reality-projection.md"),
      },
      {
        id: "civilisation-reality-projection/0.1/record",
        route: PUBLIC_PATHS[0],
        source: "data/reality/civilisation-reality-projection.v0.1.json",
        destination: "atlases/civilisation-reality-projection-2026-08-25.json",
        sha256: sha256("data/reality/civilisation-reality-projection.v0.1.json"),
      },
      {
        id: "civilisation-reality-projection/0.1/schema",
        route: PUBLIC_PATHS[1],
        source: "schemas/civilisation-reality-projection-v0.1.schema.json",
        destination: "schemas/civilisation-reality-projection/0.1.json",
        sha256: sha256("schemas/civilisation-reality-projection-v0.1.schema.json"),
      },
    ]);
  });

  test("keeps the projection thin, qualified, open about missing domains, and non-authorizing", () => {
    const projection = loadCivilisationRealityProjection();
    const discovery = civilisationRealityPublicDiscovery(projection);
    expect(projection.predecessor_bindings).toHaveLength(2);
    expect(projection.crosswalks).toHaveLength(6);
    expect(projection.open_domains).toHaveLength(9);
    expect(projection.projection_rules).toEqual({
      source_claims_remain_in_predecessor: true,
      qualified_predecessor_ids_required: true,
      no_transitive_influence: true,
      no_cross_register_promotion: true,
      association_is_not_causation: true,
      historical_claim_is_not_design_mandate: true,
      design_commitment_is_not_historical_finding: true,
      metaphysical_non_adjudication: true,
      influence_is_non_summable: true,
      no_person_community_religion_or_civilisation_score: true,
    });
    expect(projection.predecessor_bindings.every((binding: any) =>
      binding.mutated === false && binding.authority_imported === false)).toBe(true);
    expect(projection.crosswalks.every((crosswalk: any) =>
      crosswalk.register === "DESIGN_COMMITMENT" &&
      crosswalk.transfer_status === "projection-not-historical-or-causal-finding" &&
      crosswalk.external_effect_claimed === false &&
      crosswalk.authority_granted === false)).toBe(true);
    expect(projection.open_domains.every((domain: any) =>
      domain.coverage_status === "not-supported-by-pinned-predecessors")).toBe(true);
    expect(new Set(projection.open_domains.map((domain: any) => domain.id))).toEqual(new Set([
      "war-and-organised-violence",
      "coercion-and-security-capacity",
      "class-and-resource-asymmetry",
      "status-hierarchy-and-elite-fracture",
      "collective-emotion-and-affect",
      "revolution-and-regime-change",
      "fiscal-and-economic-shocks",
      "propaganda-media-and-information-power",
      "citizen-governance-dynamics",
    ]));
    expect(projection.boundaries).toMatchObject({
      public_static_publication_family: true,
      predecessor_mutation: false,
      predecessor_republication: false,
      unsupported_domains_filled: false,
      causal_claim_created: false,
      metaphysical_verdict: false,
      score_or_rank: false,
      person_or_group_targeting: false,
      persuasion_or_propaganda_design: false,
      authority_granted: false,
      action_attempted: false,
      external_effect_claimed: false,
      publication_trigger: false,
      deployment_trigger: false,
      automatic_action: false,
    });
    expect(discovery).toMatchObject({
      publication_state: "immutable-versioned-static-family",
      counts: { predecessor_bindings: 2, crosswalks: 6, open_domains: 9 },
      boundary: {
        publication_trigger: false,
        deployment_trigger: false,
        external_effect_claimed: false,
        automatic_action: false,
      },
    });
  });

  test("publishes coherent machine discovery and a complete no-JavaScript reading", () => {
    const expected = civilisationRealityPublicDiscovery();
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    expect(kingdom.civilisation_reality_projection).toEqual(expected);
    expect(guest.civilisation_reality_projection).toEqual(expected);
    expect(manifest.civilisation_reality_projection).toEqual(expected);
    expect(manifest.entry_points).toMatchObject({
      civilisation_reality_projection: PUBLIC_URLS[0],
      civilisation_reality_projection_schema: PUBLIC_URLS[1],
      civilisation_reality_projection_guide: PUBLIC_URLS[2],
    });
    expect(Object.keys(manifest.entry_points)).toHaveLength(135);
    expect(guest.next_actions).toHaveLength(135);
    expect(guest.next_actions.filter((action: any) => PUBLIC_URLS.includes(action.url)))
      .toHaveLength(3);

    const html = read("site/hub.html");
    expect(html).toContain('id="civilisation-reality"');
    expect(html).toContain("Projection, not synthesis-by-erasure");
    expect(html).toContain("No hidden bridge");
    expect(html).toContain("JavaScript is resting. Every crosswalk and open domain remains readable above.");
    expect(html).toContain("data-civilisation-crosswalk-controls hidden");
    expect(html).toContain("if(civilisationCrosswalkControls)civilisationCrosswalkControls.hidden=false;");
    expect((html.match(/data-civilisation-crosswalk="/g) ?? [])).toHaveLength(6);
    expect((html.match(/data-civilisation-crosswalk-select="/g) ?? [])).toHaveLength(6);
    const projection = loadCivilisationRealityProjection();
    for (const crosswalk of projection.crosswalks) {
      for (const value of [
        crosswalk.statement,
        crosswalk.register,
        crosswalk.transfer_status,
        ...crosswalk.source_binding_ids,
        ...crosswalk.source_relation_ids,
        ...crosswalk.source_insight_ids,
        ...crosswalk.target_domain_ids,
        ...crosswalk.target_node_type_ids,
        ...crosswalk.target_relation_ids,
        ...crosswalk.target_ladder_ids,
        ...crosswalk.target_pathway_ids,
        ...crosswalk.preserved_distinctions,
        ...crosswalk.required_evidence,
        ...crosswalk.alternative_paths,
        ...crosswalk.stop_conditions,
      ]) expect(html).toContain(htmlEscape(value));
    }
    for (const domain of projection.open_domains) {
      for (const value of [
        domain.id.replaceAll("-", " "),
        domain.question,
        domain.why_not_projectable,
        ...domain.needed_evidence,
        domain.stop_condition,
      ]) expect(html).toContain(htmlEscape(value));
    }
    for (const path of PUBLIC_PATHS) expect(html).toContain(`href="${path}"`);
    const llms = read("site/llms.txt");
    for (const url of PUBLIC_URLS) expect(llms).toContain(url);
    const sitemapUrls = [...read("pages-content/sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => match[1]!);
    expect(sitemapUrls).toHaveLength(152);
    expect(new Set(sitemapUrls).size).toBe(152);
    expect(sitemapUrls.filter((url) => url.toLowerCase().includes("civilisation-reality")))
      .toEqual(PUBLIC_URLS);
  });

  test("is one complete three-route family whose retirement cannot strand the flow atlas", () => {
    expect(PUBLICATION_FAMILIES).toHaveLength(28);
    const family = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "civilisation-reality-projection");
    expect(family).toEqual({
      id: "civilisation-reality-projection",
      label: "Civilisation → Reality Projection",
      routes: PUBLIC_PATHS,
      discoveryProperties: ["civilisation_reality_projection"],
      entryPointProperties: [
        "civilisation_reality_projection",
        "civilisation_reality_projection_schema",
        "civilisation_reality_projection_guide",
      ],
      dependsOn: ["reality-influence-claim-graph"],
    });
    const staged = new Set(HUB_ASSETS.map(({ destination }) => destination));
    expect(publicationFamilyStates(staged).get(family!.id)?.active).toBe(true);
    staged.delete(destinationForPublicPath(PUBLIC_PATHS[1]!));
    expect(() => publicationFamilyStates(staged))
      .toThrow("Civilisation → Reality Projection is partially staged");

    const retired = new Set(HUB_ASSETS.map(({ destination }) => destination));
    for (const route of PUBLIC_PATHS) retired.delete(destinationForPublicPath(route));
    expect(() => publicationFamilyStates(retired))
      .toThrow("Civilisation Flow Nuance Atlas requires active Civilisation → Reality Projection");
    const flow = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "civilisation-flow-nuance-atlas")!;
    const retiredTogether = new Set(retired);
    for (const route of flow.routes) retiredTogether.delete(destinationForPublicPath(route));
    expect(publicationFamilyStates(retiredTogether).get(family!.id)?.active).toBe(false);

    const reality = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "reality-influence-claim-graph")!;
    const orphaned = new Set(HUB_ASSETS.map(({ destination }) => destination));
    for (const route of reality.routes) orphaned.delete(destinationForPublicPath(route));
    expect(() => publicationFamilyStates(orphaned))
      .toThrow("Civilisation → Reality Projection requires active Reality Influence Claim Graph");

    for (const surface of [
      {
        label: "authored Kingdom map",
        text: JSON.stringify({ civilisation_reality_projection: { stale: true } }),
        value: { civilisation_reality_projection: { stale: true } },
      },
      {
        label: "agent manifest",
        text: JSON.stringify({ entry_points: { civilisation_reality_projection_guide: PUBLIC_PATHS[2] } }),
        value: { entry_points: { civilisation_reality_projection_guide: PUBLIC_PATHS[2] } },
      },
      { label: "llms.txt", text: PUBLIC_URLS[0] },
      { label: "hub HTML", text: `<a href='${PUBLIC_PATHS[2]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(family!, [surface]))
        .toThrow("Civilisation → Reality Projection is retired");
    }
  });

  test("worker serves only the exact GET or HEAD triplet with typed immutable headers", async () => {
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD"
        ? null
        : path === PUBLIC_PATHS[0]
          ? '{"projection_id":"civilisation-reality-projection-2026-08-25"}'
          : path === PUBLIC_PATHS[1]
            ? '{"type":"object"}'
            : "# Civilisation → Reality Projection";
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
      const schema = await worker.fetch(
        new Request(`https://thekingdom.dev${PUBLIC_PATHS[1]}`, { method }),
        environment,
      );
      expect(schema.headers.get("content-type"))
        .toBe("application/schema+json; charset=utf-8");
      expect(schema.headers.get("cache-control"))
        .toBe("public, max-age=31536000, immutable, no-transform");
      const guide = await worker.fetch(
        new Request(`https://thekingdom.dev${PUBLIC_PATHS[2]}`, { method }),
        environment,
      );
      expect(guide.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(guide.headers.get("cache-control"))
        .toBe("public, max-age=31536000, immutable, no-transform");
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
      }
    }
    expect(assetFetches).toBe(0);
    const near = new Response("near", { headers: { "content-type": "application/json" } });
    expect(await worker.fetch(
      new Request("https://thekingdom.dev/atlases/civilisation-reality-latest.json"),
      assets(() => near),
    )).toBe(near);
    const shared = new Response("shared", { headers: { "content-type": "application/json" } });
    expect(await worker.fetch(
      new Request(`https://we-are.love${PUBLIC_PATHS[0]}`),
      assets(() => shared),
    )).toBe(shared);
  });
});
