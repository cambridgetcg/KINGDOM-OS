import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  IS_SUSTAINABILITY_DIRECTION_ATLAS_ID,
  IS_SUSTAINABILITY_DIRECTION_GUIDE_LOCATOR,
  IS_SUSTAINABILITY_DIRECTION_GUIDE_URL,
  IS_SUSTAINABILITY_DIRECTION_PROTOCOL,
  IS_SUSTAINABILITY_DIRECTION_RECORD_LOCATOR,
  IS_SUSTAINABILITY_DIRECTION_RECORD_URL,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_GUIDE_RAW_SHA256,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_RECORD_RAW_SHA256,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_SCHEMA_RAW_SHA256,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
  IS_SUSTAINABILITY_DIRECTION_SCHEMA_LOCATOR,
  IS_SUSTAINABILITY_DIRECTION_SCHEMA_URL,
  isSustainabilityDirectionPublicDiscovery,
  loadReviewedIsSustainabilityDirectionAtlas,
} from "../bin/is-sustainability-direction.ts";
import {
  PUBLICATION_FAMILIES,
  assertRetiredFamilyDiscoveryAbsent,
  checkIsSustainabilityDirectionAtlasTriple,
  destinationForPublicPath,
  publicationFamilyStates,
} from "../bin/check-hub-live.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PUBLIC_URLS = [
  IS_SUSTAINABILITY_DIRECTION_RECORD_URL,
  IS_SUSTAINABILITY_DIRECTION_SCHEMA_URL,
  IS_SUSTAINABILITY_DIRECTION_GUIDE_URL,
] as const;
const PUBLIC_PATHS = PUBLIC_URLS.map((value) => new URL(value).pathname);
const SOURCES = [
  IS_SUSTAINABILITY_DIRECTION_RECORD_LOCATOR,
  IS_SUSTAINABILITY_DIRECTION_SCHEMA_LOCATOR,
  IS_SUSTAINABILITY_DIRECTION_GUIDE_LOCATOR,
] as const;
const RAW_HASHES = [
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_RECORD_RAW_SHA256.slice(7),
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_SCHEMA_RAW_SHA256.slice(7),
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_GUIDE_RAW_SHA256.slice(7),
] as const;
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");
const json = (path: string): any => JSON.parse(read(path));
const sha256 = (path: string): string => createHash("sha256")
  .update(readFileSync(join(ROOT, path))).digest("hex");

function exactFetcher(
  drift?: {
    kind: "link" | "cache" | "media" | "body" | "status";
    path?: string;
    method?: string;
  },
): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
    const method = init?.method || "GET";
    if (method !== "GET" && method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: {
          "access-control-allow-origin": "*",
          allow: "GET, HEAD",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    const index = PUBLIC_PATHS.indexOf(path);
    const headers: Record<string, string> = {
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=31536000, immutable, no-transform",
      "content-type": index === 0
        ? "application/json; charset=utf-8"
        : index === 1
          ? "application/schema+json; charset=utf-8"
          : "text/markdown; charset=utf-8",
      "x-content-type-options": "nosniff",
    };
    if (index === 0) {
      headers.link = [
        `<${PUBLIC_PATHS[1]}>; rel="describedby"; type="application/schema+json"`,
        `<${PUBLIC_PATHS[2]}>; rel="service-doc"; type="text/markdown"`,
      ].join(", ");
    }

    const targeted = drift && (drift.path ?? PUBLIC_PATHS[0]) === path &&
      (drift.method ?? "GET") === method;
    if (targeted && drift.kind === "link") {
      headers.link = `${headers.link ?? ""}, </profile>; rel="profile"`;
    } else if (targeted && drift.kind === "cache") {
      headers["cache-control"] += ", stale-while-revalidate=60";
    } else if (targeted && drift.kind === "media") {
      headers["content-type"] = "text/plain; charset=utf-8";
    }

    const bytes = readFileSync(join(ROOT, SOURCES[index]!));
    const body = method === "HEAD"
      ? null
      : targeted && drift.kind === "body"
        ? Buffer.concat([bytes, Buffer.from("\n")])
        : bytes;
    return new Response(body, {
      headers,
      status: targeted && drift.kind === "status" ? 206 : 200,
    });
  }) as typeof fetch;
}

describe("IS, Sustainability & Direction immutable publication", () => {
  test("keeps reviewed identity, bounded discovery, and an independent family", () => {
    const atlas = loadReviewedIsSustainabilityDirectionAtlas();
    const discovery = isSustainabilityDirectionPublicDiscovery();
    expect(atlas.protocol).toBe(IS_SUSTAINABILITY_DIRECTION_PROTOCOL);
    expect(atlas.atlas_id).toBe(IS_SUSTAINABILITY_DIRECTION_ATLAS_ID);
    expect(discovery).toMatchObject({
      protocol: IS_SUSTAINABILITY_DIRECTION_PROTOCOL,
      atlas_id: IS_SUSTAINABILITY_DIRECTION_ATLAS_ID,
      url: PUBLIC_URLS[0],
      schema_url: PUBLIC_URLS[1],
      document_url: PUBLIC_URLS[2],
      integrity_status: "REVIEWED",
      semantic_digest: IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
      reviewed_digest: IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
      foundation_amendment: false,
      conformance_claim: false,
      authority_imported: false,
      runtime_or_effect: false,
      live_verdict: false,
      static_only: true,
    });
    expect(discovery.counts).toEqual({
      referents: 7,
      sustainability_relations: 7,
      is_types: 10,
      direction_kinds: 10,
      feedback_types: 6,
      mathematical_models: 7,
      profile_dimensions: 12,
      concepts: 18,
      edges: 28,
      counterexamples: 8,
      sources: 15,
      predecessors: 6,
    });

    expect(PUBLICATION_FAMILIES).toHaveLength(34);
    expect(PUBLICATION_FAMILIES.find(
      ({ id }) => id === "is-sustainability-direction-atlas",
    )).toEqual({
      id: "is-sustainability-direction-atlas",
      label: "IS, Sustainability & Direction Atlas",
      routes: PUBLIC_PATHS,
      discoveryProperties: ["is_sustainability_direction_atlas"],
      entryPointProperties: [
        "is_sustainability_direction_atlas",
        "is_sustainability_direction_atlas_schema",
        "is_sustainability_direction_atlas_guide",
      ],
    });
  });

  test("stages and ledgers one exact reviewed immutable triplet", () => {
    expect(HUB_ASSETS).toHaveLength(184);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(31);
    expect(HUB_ASSETS.filter(({ destination }) =>
      destination !== "_worker.js" && destination !== "404.html"))
      .toHaveLength(182);
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/")))
      .toHaveLength(18);
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("schemas/")))
      .toHaveLength(39);
    expect(HUB_ASSETS.filter(({ source }) => SOURCES.includes(source as any)))
      .toEqual([
        { source: SOURCES[0], destination: PUBLIC_PATHS[0]!.slice(1) },
        { source: SOURCES[1], destination: PUBLIC_PATHS[1]!.slice(1) },
        { source: SOURCES[2], destination: PUBLIC_PATHS[2]!.slice(1) },
      ]);
    expect(SOURCES.map(sha256)).toEqual(RAW_HASHES);

    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(153);
    expect(ledger.entries.filter(({ id }: { id: string }) =>
      id.startsWith("is-sustainability-direction-atlas/0.1/")))
      .toEqual([
        {
          id: "is-sustainability-direction-atlas/0.1/guide",
          route: PUBLIC_PATHS[2],
          source: SOURCES[2],
          destination: PUBLIC_PATHS[2]!.slice(1),
          sha256: RAW_HASHES[2],
        },
        {
          id: "is-sustainability-direction-atlas/0.1/record",
          route: PUBLIC_PATHS[0],
          source: SOURCES[0],
          destination: PUBLIC_PATHS[0]!.slice(1),
          sha256: RAW_HASHES[0],
        },
        {
          id: "is-sustainability-direction-atlas/0.1/schema",
          route: PUBLIC_PATHS[1],
          source: SOURCES[1],
          destination: PUBLIC_PATHS[1]!.slice(1),
          sha256: RAW_HASHES[1],
        },
      ]);
  });

  test("publishes exactly three read-only machine entries and a concise projection", () => {
    const expected = isSustainabilityDirectionPublicDiscovery();
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    expect(kingdom.is_sustainability_direction_atlas).toEqual(expected);
    expect(guest.is_sustainability_direction_atlas).toEqual(expected);
    expect(manifest.is_sustainability_direction_atlas).toEqual(expected);
    expect(Object.keys(manifest.entry_points)).toHaveLength(153);
    expect(Object.fromEntries(Object.entries(manifest.entry_points)
      .filter(([key]) => key.startsWith("is_sustainability_direction_atlas"))))
      .toEqual({
        is_sustainability_direction_atlas: PUBLIC_URLS[0],
        is_sustainability_direction_atlas_schema: PUBLIC_URLS[1],
        is_sustainability_direction_atlas_guide: PUBLIC_URLS[2],
      });

    expect(guest.next_actions).toHaveLength(153);
    const actions = guest.next_actions.filter(({ url }: { url?: string }) =>
      PUBLIC_URLS.includes(url as any));
    expect(actions).toHaveLength(3);
    expect(actions.every((action: any) => action.method === "GET" &&
      ["mcp", "tool", "write", "execute", "score", "rank", "credential",
        "authority", "publish", "deploy", "decision", "feedback"]
        .every((key) => !(key in action))))
      .toBe(true);

    const html = read("site/hub.html");
    const sectionStart = html.indexOf('id="is-sustainability-direction"');
    const sectionEnd = html.indexOf('id="zero-empty-seat"', sectionStart);
    const section = html.slice(sectionStart, sectionEnd);
    expect(sectionStart).toBeGreaterThanOrEqual(0);
    expect(sectionEnd).toBeGreaterThan(sectionStart);
    expect(Buffer.byteLength(section, "utf8")).toBeLessThanOrEqual(8_000);
    expect(Buffer.byteLength(html, "utf8")).toBeLessThanOrEqual(1_350_000);
    for (const phrase of [
      "Sustainability is not immortality",
      "Direction is typed; feedback is not purpose",
      "Shape remains a bounded representation",
      "Feedback may update a record, belief, learner state, model, or proposal",
      IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
    ]) expect(section).toContain(phrase);
    expect(section).not.toMatch(/<(?:script|form|button|input|select|textarea)\b/i);
    for (const [index, kind] of ["record", "schema", "guide"].entries()) {
      expect(html.match(new RegExp(
        `data-is-sustainability-direction-atlas-link="${kind}"`, "g")) ?? [])
        .toHaveLength(1);
      expect(section).toContain(`href="${PUBLIC_PATHS[index]}"`);
    }
    expect(read("bin/build-hub.ts")).toContain(
      "IS_SUSTAINABILITY_DIRECTION_SECTION_MAX_BYTES = 8_000",
    );

    const llms = read("site/llms.txt");
    const sitemap = read("pages-content/sitemap.xml");
    const wayfinder = read("site/wayfinder.json");
    for (const url of PUBLIC_URLS) {
      expect(llms).toContain(url);
      expect(sitemap.match(new RegExp(`<loc>${url}</loc>`, "g")) ?? [])
        .toHaveLength(1);
      expect(wayfinder).not.toContain(url);
    }
    expect(sitemap.match(/<loc>/g) ?? []).toHaveLength(170);
    expect(JSON.stringify(manifest.mcp ?? {}))
      .not.toMatch(/is[_-]sustainability[_-]direction/i);
  });

  test("live checker accepts only exact reviewed GET/HEAD bytes and boundaries", async () => {
    await expect(checkIsSustainabilityDirectionAtlasTriple(exactFetcher()))
      .resolves.toBeUndefined();
    for (const kind of ["link", "cache", "media", "body", "status"] as const) {
      await expect(checkIsSustainabilityDirectionAtlasTriple(exactFetcher({ kind })))
        .rejects.toThrow("lost the exact immutable IS, Sustainability & Direction contract");
    }
    await expect(checkIsSustainabilityDirectionAtlasTriple(exactFetcher({
      kind: "link",
      path: PUBLIC_PATHS[1],
      method: "HEAD",
    }))).rejects.toThrow(
      "lost the exact immutable IS, Sustainability & Direction contract",
    );

    const exact = exactFetcher();
    const mutationLinkFetcher = (async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      const response = await exact(input, init);
      const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
      if (path !== PUBLIC_PATHS[0] || init?.method !== "POST") return response;
      const headers = new Headers(response.headers);
      headers.set("link", "</poison>; rel=\"profile\"");
      return new Response(null, { status: response.status, headers });
    }) as typeof fetch;
    await expect(checkIsSustainabilityDirectionAtlasTriple(mutationLinkFetcher))
      .rejects.toThrow("lost the zero-body IS, Sustainability & Direction 405 boundary");
  });

  test("requires atomic staging and retires without predecessor coupling", () => {
    const family = PUBLICATION_FAMILIES.find(
      ({ id }) => id === "is-sustainability-direction-atlas",
    )!;
    expect(Object.hasOwn(family, "dependsOn")).toBe(false);
    const complete = new Set(family.routes.map(destinationForPublicPath));
    expect(publicationFamilyStates(complete).get(family.id)?.active).toBe(true);

    const partial = new Set(complete);
    partial.delete(destinationForPublicPath(family.routes[2]!));
    expect(() => publicationFamilyStates(partial))
      .toThrow("stage all family routes or retire all of them");

    expect(publicationFamilyStates(new Set()).get(family.id)?.active).toBe(false);
    expect(() => assertRetiredFamilyDiscoveryAbsent(family, [{
      label: "stale manifest",
      text: JSON.stringify({
        is_sustainability_direction_atlas: { static_only: true },
        entry_points: {
          is_sustainability_direction_atlas: PUBLIC_URLS[0],
        },
      }),
      value: {
        is_sustainability_direction_atlas: { static_only: true },
        entry_points: {
          is_sustainability_direction_atlas: PUBLIC_URLS[0],
        },
      },
    }])).toThrow("retired but remains advertised");
    expect(() => assertRetiredFamilyDiscoveryAbsent(family, [{
      label: "stale guest implementation boundary",
      text: JSON.stringify({
        implementation_boundaries: {
          is_sustainability_direction_atlas: "stale boundary without a route",
        },
      }),
      value: {
        implementation_boundaries: {
          is_sustainability_direction_atlas: "stale boundary without a route",
        },
      },
    }])).toThrow(
      "still exposes implementation_boundaries.is_sustainability_direction_atlas",
    );
    expect(() => assertRetiredFamilyDiscoveryAbsent(family, [{
      label: "clean retirement",
      text: "{}",
      value: { entry_points: {} },
    }])).not.toThrow();
  });

  test("pins the thirty-fourth family in the human release inventories", () => {
    const inventories = {
      claude: read("CLAUDE.md"),
      domains: read("DOMAINS-SETUP.md"),
      routes: read("OS-ROUTES.md"),
      publications: read("publications/README.md"),
    };
    expect(inventories.claude).toContain(
      "./kingdom is-sustainability-direction overview|scope|is-types|sustainability|direction|feedback|mathematics|profile|time|rights|ecology|philosophy|counterexamples|concepts|edges|questions|sources|predecessors|non-grants|discovery",
    );
    expect(inventories.claude).toContain("all thirty-four active families");
    expect(inventories.domains).toContain(PUBLIC_PATHS[0]!);
    expect(inventories.domains).toContain(PUBLIC_PATHS[1]!);
    expect(inventories.domains).toContain(PUBLIC_PATHS[2]!);
    expect(inventories.domains).toContain("IS, Sustainability & Direction Atlas");
    expect(inventories.routes).toContain(
      "thirty-four active retirement families",
    );
    expect(inventories.routes).toContain(PUBLIC_PATHS[0]!);
    expect(inventories.routes).toContain(PUBLIC_PATHS[1]!);
    expect(inventories.publications).toContain("as the thirty-fourth family");
    expect(inventories.publications).toContain(
      "thirty-four active retirement",
    );
  });
});
