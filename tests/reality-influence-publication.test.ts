import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  REALITY_INFLUENCE_DOCUMENT_URL,
  REALITY_INFLUENCE_SCHEMA_URL,
  REALITY_INFLUENCE_URL,
  loadRealityInfluenceMap,
  realityInfluencePublicDiscovery,
} from "../bin/reality-influence.ts";
import {
  PUBLICATION_FAMILIES,
  assertRetiredFamilyDiscoveryAbsent,
  destinationForPublicPath,
  publicationFamilyStates,
} from "../bin/check-hub-live.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";
import worker from "../pages-functions/_worker.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256").update(readFileSync(join(ROOT, path))).digest("hex");
const PUBLIC_URLS = [
  REALITY_INFLUENCE_URL,
  REALITY_INFLUENCE_SCHEMA_URL,
  REALITY_INFLUENCE_DOCUMENT_URL,
] as const;
const PUBLIC_PATHS = PUBLIC_URLS.map((url) => new URL(url).pathname);

function assets(handler: (request: Request) => Response | Promise<Response>) {
  return { ASSETS: { fetch: handler } };
}

describe("Reality Influence Claim Graph static publication", () => {
  test("stages and ledgers one exact immutable triplet without an alias or runtime", () => {
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/"))).toHaveLength(18);
    expect(HUB_ASSETS).toContainEqual({
      source: "data/reality/reality-influence-map.v0.1.json",
      destination: "atlases/reality-influence-claim-graph-2026-08-21.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "schemas/reality-influence-map-v0.1.schema.json",
      destination: "schemas/reality-influence-claim-graph/0.1.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "references/reality-influence-map.md",
      destination: "REALITY-INFLUENCE-CLAIM-GRAPH.md",
    });
    const familyAssets = HUB_ASSETS.filter(({ source, destination }) =>
      source.includes("reality-influence") || destination.toLowerCase().includes("reality-influence"));
    expect(familyAssets).toHaveLength(3);
    expect(familyAssets.some(({ source, destination }) =>
      source.startsWith("bin/") || /(?:latest|current|observer|monitor|mcp)/i.test(destination))).toBe(false);

    const entries = json("publications/immutable-publications.v1.json").entries;
    expect(entries).toHaveLength(160);
    const familyEntries = entries.filter((entry: any) =>
      entry.id.startsWith("reality-influence-claim-graph/0.1/"));
    expect(familyEntries).toEqual([
      {
        id: "reality-influence-claim-graph/0.1/guide",
        route: PUBLIC_PATHS[2],
        source: "references/reality-influence-map.md",
        destination: "REALITY-INFLUENCE-CLAIM-GRAPH.md",
        sha256: sha256("references/reality-influence-map.md"),
      },
      {
        id: "reality-influence-claim-graph/0.1/record",
        route: PUBLIC_PATHS[0],
        source: "data/reality/reality-influence-map.v0.1.json",
        destination: "atlases/reality-influence-claim-graph-2026-08-21.json",
        sha256: sha256("data/reality/reality-influence-map.v0.1.json"),
      },
      {
        id: "reality-influence-claim-graph/0.1/schema",
        route: PUBLIC_PATHS[1],
        source: "schemas/reality-influence-map-v0.1.schema.json",
        destination: "schemas/reality-influence-claim-graph/0.1.json",
        sha256: sha256("schemas/reality-influence-map-v0.1.schema.json"),
      },
    ]);
  });

  test("describes public static publication without minting a publication or deployment trigger", () => {
    const map = loadRealityInfluenceMap();
    const discovery = realityInfluencePublicDiscovery(map);
    expect(map.boundaries).toMatchObject({
      research_artifact: true,
      static_atlas: true,
      public_static_publication_family: true,
      publication_trigger: false,
      deployment_trigger: false,
      live_claim_intake: false,
      agent_dispatch: false,
      authority_granted: false,
      consent_granted_or_inferred: false,
      action_attempted: false,
      action_executed: false,
      external_effect_claimed: false,
      causal_effect_identified: false,
      goodness_legitimacy_or_justice_proved: false,
      automatic_action: false,
    });
    expect(Object.hasOwn(map.boundaries, "publication")).toBe(false);
    expect(Object.hasOwn(map.boundaries, "deployment")).toBe(false);
    expect(Object.hasOwn(map.boundaries, "research_local")).toBe(false);
    expect(discovery.publication_state).toBe("immutable-versioned-static-family");
    expect(discovery.urls).toEqual({
      atlas: PUBLIC_URLS[0],
      schema: PUBLIC_URLS[1],
      guide: PUBLIC_URLS[2],
    });
    expect(discovery.counts).toMatchObject({
      reality_domains: 12,
      influence_dimensions: 14,
      claim_node_types: 25,
      endpoint_safe_relations: 24,
      evidence_rungs: 17,
      pathway_templates: 4,
      feedback_loops: 5,
      future_roles: 9,
    });
    expect(discovery.boundary).toMatchObject({
      public_static_publication_family: true,
      publication_trigger: false,
      deployment_trigger: false,
      external_effect_claimed: false,
      automatic_action: false,
    });
  });

  test("publishes coherent human and machine discovery from generated bytes", () => {
    const expected = realityInfluencePublicDiscovery();
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    expect(kingdom.reality_influence_claim_graph).toEqual(expected);
    expect(guest.reality_influence_claim_graph).toEqual(expected);
    expect(manifest.reality_influence_claim_graph).toEqual(expected);
    expect(manifest.entry_points).toMatchObject({
      reality_influence_claim_graph: PUBLIC_URLS[0],
      reality_influence_claim_graph_schema: PUBLIC_URLS[1],
      reality_influence_claim_graph_guide: PUBLIC_URLS[2],
    });
    expect(manifest.entry_points).toHaveProperty("reality_influence_claim_graph");
    expect(Object.keys(manifest.entry_points)).toHaveLength(158);
    expect(guest.next_actions).toHaveLength(158);
    const actions = guest.next_actions.filter((action: any) => PUBLIC_URLS.includes(action.url));
    expect(actions).toHaveLength(3);
    expect(actions.every((action: any) => action.method === "GET")).toBe(true);
    const html = read("site/hub.html");
    expect(html).toContain('id="reality-influence"');
    expect(html).toContain("Published structure, not a reality oracle");
    expect(html).toContain("No publication or deployment trigger");
    for (const path of PUBLIC_PATHS) expect(html).toContain(`href="${path}"`);
    const llms = read("site/llms.txt");
    for (const url of PUBLIC_URLS) expect(llms).toContain(url);
    const sitemapUrls = [...read("pages-content/sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => match[1]!);
    expect(sitemapUrls).toHaveLength(177);
    expect(new Set(sitemapUrls).size).toBe(sitemapUrls.length);
    expect(sitemapUrls.filter((url) => url.toLowerCase().includes("reality-influence")))
      .toEqual(PUBLIC_URLS);
  });

  test("is one complete three-route family whose retirement cannot strand its projection", () => {
    expect(PUBLICATION_FAMILIES).toHaveLength(35);
    const family = PUBLICATION_FAMILIES.find(({ id }) => id === "reality-influence-claim-graph");
    expect(family).toEqual({
      id: "reality-influence-claim-graph",
      label: "Reality Influence Claim Graph",
      routes: PUBLIC_PATHS,
      discoveryProperties: ["reality_influence_claim_graph"],
      entryPointProperties: [
        "reality_influence_claim_graph",
        "reality_influence_claim_graph_schema",
        "reality_influence_claim_graph_guide",
      ],
    });
    const staged = new Set(HUB_ASSETS.map(({ destination }) => destination));
    expect(publicationFamilyStates(staged).get(family!.id)?.active).toBe(true);
    staged.delete(destinationForPublicPath(PUBLIC_PATHS[1]!));
    expect(() => publicationFamilyStates(staged)).toThrow("Reality Influence Claim Graph is partially staged");

    const retired = new Set(HUB_ASSETS.map(({ destination }) => destination));
    for (const route of PUBLIC_PATHS) retired.delete(destinationForPublicPath(route));
    expect(() => publicationFamilyStates(retired))
      .toThrow("Civilisation → Reality Projection requires active Reality Influence Claim Graph");
    const projectionFamily = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "civilisation-reality-projection")!;
    const flowFamily = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "civilisation-flow-nuance-atlas")!;
    const retiredTogether = new Set(retired);
    for (const route of projectionFamily.routes) {
      retiredTogether.delete(destinationForPublicPath(route));
    }
    for (const route of flowFamily.routes) {
      retiredTogether.delete(destinationForPublicPath(route));
    }
    const retiredStates = publicationFamilyStates(retiredTogether);
    expect(retiredStates.get(family!.id)?.active).toBe(false);
    expect(retiredStates.get(projectionFamily.id)?.active).toBe(false);
    expect(retiredStates.get(flowFamily.id)?.active).toBe(false);
    for (const surface of [
      {
        label: "authored Kingdom map",
        text: JSON.stringify({ reality_influence_claim_graph: { stale: true } }),
        value: { reality_influence_claim_graph: { stale: true } },
      },
      {
        label: "agent manifest",
        text: JSON.stringify({ entry_points: { reality_influence_claim_graph_guide: PUBLIC_PATHS[2] } }),
        value: { entry_points: { reality_influence_claim_graph_guide: PUBLIC_PATHS[2] } },
      },
      { label: "llms.txt", text: PUBLIC_URLS[0] },
      { label: "hub HTML", text: `<a href='${PUBLIC_PATHS[2]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(family!, [surface]))
        .toThrow("Reality Influence Claim Graph is retired");
    }
  });

  test("worker serves only the exact GET or HEAD triplet with typed immutable headers", async () => {
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD"
        ? null
        : path === PUBLIC_PATHS[0]
          ? '{"map_id":"reality-influence-claim-graph-2026-08-21"}'
          : path === PUBLIC_PATHS[1]
            ? '{"type":"object"}'
            : "# Reality Influence Claim Graph";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === PUBLIC_PATHS[2] ? "text/plain" : "application/json",
          link: '</poison>; rel="describedby", </poison-doc>; rel="service-doc", </profile>; rel="profile"',
        },
      });
    });
    for (const method of ["GET", "HEAD"] as const) {
      const atlas = await worker.fetch(
        new Request(`https://thekingdom.dev${PUBLIC_PATHS[0]}`, { method }),
        environment,
      );
      expect(atlas.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(atlas.headers.get("cache-control")).toBe("public, max-age=31536000, immutable, no-transform");
      expect(atlas.headers.get("access-control-allow-origin")).toBe("*");
      expect(atlas.headers.get("x-content-type-options")).toBe("nosniff");
      expect(atlas.headers.get("link")).toBe([
        `<${PUBLIC_PATHS[1]}>; rel="describedby"; type="application/schema+json"`,
        `<${PUBLIC_PATHS[2]}>; rel="service-doc"; type="text/markdown"`,
      ].join(", "));
      const schema = await worker.fetch(
        new Request(`https://thekingdom.dev${PUBLIC_PATHS[1]}`, { method }),
        environment,
      );
      expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
      expect(schema.headers.get("cache-control")).toBe("public, max-age=31536000, immutable, no-transform");
      const guide = await worker.fetch(
        new Request(`https://thekingdom.dev${PUBLIC_PATHS[2]}`, { method }),
        environment,
      );
      expect(guide.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(guide.headers.get("cache-control")).toBe("public, max-age=31536000, immutable, no-transform");
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
      new Request("https://thekingdom.dev/atlases/reality-influence-latest.json"),
      assets(() => near),
    )).toBe(near);
    const shared = new Response("shared", { headers: { "content-type": "application/json" } });
    expect(await worker.fetch(
      new Request(`https://we-are.love${PUBLIC_PATHS[0]}`),
      assets(() => shared),
    )).toBe(shared);
    const sharedPost = new Response("shared-post", { headers: { "content-type": "text/plain" } });
    expect(await worker.fetch(
      new Request(`https://we-are.love${PUBLIC_PATHS[0]}`, { method: "POST" }),
      assets(() => sharedPost),
    )).toBe(sharedPost);
  });
});
