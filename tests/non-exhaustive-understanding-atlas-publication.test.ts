import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_ID,
  NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_LOCATOR,
  NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_URL,
  NON_EXHAUSTIVE_UNDERSTANDING_LOCATOR,
  NON_EXHAUSTIVE_UNDERSTANDING_PROTOCOL,
  NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST,
  NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_LOCATOR,
  NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_URL,
  NON_EXHAUSTIVE_UNDERSTANDING_URL,
  loadReviewedNonExhaustiveUnderstandingAtlas,
  nonExhaustiveUnderstandingPublicDiscovery,
} from "../bin/non-exhaustive-understanding.ts";
import {
  PUBLICATION_FAMILIES,
  assertRetiredFamilyDiscoveryAbsent,
  checkNonExhaustiveUnderstandingAtlasTriple,
  destinationForPublicPath,
  publicationFamilyStates,
} from "../bin/check-hub-live.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PUBLIC_URLS = [
  NON_EXHAUSTIVE_UNDERSTANDING_URL,
  NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_URL,
  NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_URL,
] as const;
const PUBLIC_PATHS = PUBLIC_URLS.map((value) => new URL(value).pathname);
const SOURCES = [
  NON_EXHAUSTIVE_UNDERSTANDING_LOCATOR,
  NON_EXHAUSTIVE_UNDERSTANDING_SCHEMA_LOCATOR,
  NON_EXHAUSTIVE_UNDERSTANDING_GUIDE_LOCATOR,
] as const;
const RAW_HASHES = [
  "e885606a2f513379ccb64ea40e0b4c6a3dd08b4eea615772e6fd08a22c116b80",
  "a19fee4d8a0fc5ee4f2425b024ca8590c5a3d111cc17d25a67695bca44fd568f",
  "d076193d5c5c10845b7a5ad8f38b70f73a1a04a5d6b1939073966996220405dd",
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

    const source = SOURCES[index]!;
    const bytes = readFileSync(join(ROOT, source));
    const body = method === "HEAD"
      ? null
      : targeted && drift.kind === "body"
        ? Buffer.concat([bytes, Buffer.from("\n")])
        : bytes;
    return new Response(body, { headers, status: targeted && drift.kind === "status" ? 206 : 200 });
  }) as typeof fetch;
}

describe("Non-Exhaustive Understanding publication scaffold", () => {
  test("keeps stable identity, routes, reviewed discovery, and standalone retirement", () => {
    const atlas = loadReviewedNonExhaustiveUnderstandingAtlas();
    const discovery = nonExhaustiveUnderstandingPublicDiscovery(atlas);
    expect(atlas.protocol).toBe(NON_EXHAUSTIVE_UNDERSTANDING_PROTOCOL);
    expect(atlas.atlas_id).toBe(NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_ID);
    expect(discovery).toMatchObject({
      protocol: NON_EXHAUSTIVE_UNDERSTANDING_PROTOCOL,
      atlas_id: NON_EXHAUSTIVE_UNDERSTANDING_ATLAS_ID,
      url: PUBLIC_URLS[0],
      schema_url: PUBLIC_URLS[1],
      document_url: PUBLIC_URLS[2],
      integrity_status: "REVIEWED",
      semantic_digest: NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST,
      reviewed_digest: NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST,
      static_only: true,
      runtime: false,
      person_data: false,
      action_or_authority_effect: false,
    });

    const family = PUBLICATION_FAMILIES.find(
      ({ id }) => id === "non-exhaustive-understanding-atlas",
    );
    expect(family).toEqual({
      id: "non-exhaustive-understanding-atlas",
      label: "Non-Exhaustive Understanding Atlas",
      routes: PUBLIC_PATHS,
      discoveryProperties: ["non_exhaustive_understanding_atlas"],
      entryPointProperties: [
        "non_exhaustive_understanding_atlas",
        "non_exhaustive_understanding_atlas_schema",
        "non_exhaustive_understanding_atlas_guide",
      ],
    });
  });

  test("stages and ledgers one exact reviewed immutable triplet", () => {
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/")))
      .toHaveLength(18);
    expect(HUB_ASSETS.filter(({ source }) => SOURCES.includes(source as any)))
      .toEqual([
        { source: SOURCES[0], destination: PUBLIC_PATHS[0]!.slice(1) },
        { source: SOURCES[1], destination: PUBLIC_PATHS[1]!.slice(1) },
        { source: SOURCES[2], destination: PUBLIC_PATHS[2]!.slice(1) },
      ]);
    expect(SOURCES.map(sha256)).toEqual(RAW_HASHES);

    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(160);
    expect(ledger.entries.filter(({ id }: { id: string }) =>
      id.startsWith("non-exhaustive-understanding-atlas/0.1/")))
      .toEqual([
        {
          id: "non-exhaustive-understanding-atlas/0.1/guide",
          route: PUBLIC_PATHS[2],
          source: SOURCES[2],
          destination: PUBLIC_PATHS[2]!.slice(1),
          sha256: RAW_HASHES[2],
        },
        {
          id: "non-exhaustive-understanding-atlas/0.1/record",
          route: PUBLIC_PATHS[0],
          source: SOURCES[0],
          destination: PUBLIC_PATHS[0]!.slice(1),
          sha256: RAW_HASHES[0],
        },
        {
          id: "non-exhaustive-understanding-atlas/0.1/schema",
          route: PUBLIC_PATHS[1],
          source: SOURCES[1],
          destination: PUBLIC_PATHS[1]!.slice(1),
          sha256: RAW_HASHES[1],
        },
      ]);
  });

  test("publishes concise no-JavaScript human and machine discovery", () => {
    const atlas = loadReviewedNonExhaustiveUnderstandingAtlas();
    const expected = nonExhaustiveUnderstandingPublicDiscovery(atlas);
    expect(expected.counts).toEqual({
      concepts: 66,
      claims: 19,
      evidence: 14,
      sources: 15,
      counterexamples: 2,
      remainders: 3,
      j_space_mechanisms: 3,
    });

    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    expect(kingdom.non_exhaustive_understanding_atlas).toEqual(expected);
    expect(guest.non_exhaustive_understanding_atlas).toEqual(expected);
    expect(manifest.non_exhaustive_understanding_atlas).toEqual(expected);
    expect(Object.keys(manifest.entry_points)).toHaveLength(158);
    expect(Object.fromEntries(Object.entries(manifest.entry_points)
      .filter(([key]) => key.startsWith("non_exhaustive_understanding_atlas"))))
      .toEqual({
        non_exhaustive_understanding_atlas: PUBLIC_URLS[0],
        non_exhaustive_understanding_atlas_schema: PUBLIC_URLS[1],
        non_exhaustive_understanding_atlas_guide: PUBLIC_URLS[2],
      });
    expect(guest.next_actions).toHaveLength(158);
    const actions = guest.next_actions.filter(({ url }: { url?: string }) =>
      PUBLIC_URLS.includes(url as any));
    expect(actions).toHaveLength(3);
    expect(actions.every((action: any) => action.method === "GET" &&
      ["mcp", "tool", "write", "execute", "score", "rank", "credential",
        "authority", "publish", "deploy", "decision", "feedback"]
        .every((key) => !(key in action))))
      .toBe(true);

    const html = read("site/hub.html");
    const sectionStart = html.indexOf('id="non-exhaustive-understanding"');
    const sectionEnd = html.indexOf('id="is-sustainability-direction"', sectionStart);
    const section = html.slice(sectionStart, sectionEnd);
    expect(sectionStart).toBeGreaterThanOrEqual(0);
    expect(sectionEnd).toBeGreaterThan(sectionStart);
    expect(Buffer.byteLength(section, "utf8")).toBeLessThanOrEqual(8_000);
    for (const phrase of [
      "A bounded representation can become more useful",
      "Its shape is not a verdict about being",
      "Remainder is not an escape hatch",
      "Feedback proposes; released bytes do not learn",
      "fresh governed successor process",
      "creates no person or group model",
      NON_EXHAUSTIVE_UNDERSTANDING_REVIEWED_DIGEST,
    ]) expect(section).toContain(phrase);
    expect(section).not.toMatch(/<(?:script|form|button|input|select|textarea)\b/i);
    for (const [index, kind] of ["record", "schema", "guide"].entries()) {
      expect(html.match(new RegExp(
        `data-non-exhaustive-understanding-atlas-link="${kind}"`, "g")) ?? [])
        .toHaveLength(1);
      expect(section).toContain(`href="${PUBLIC_PATHS[index]}"`);
    }

    const llms = read("site/llms.txt");
    const sitemap = read("pages-content/sitemap.xml");
    const wayfinder = read("site/wayfinder.json");
    for (const url of PUBLIC_URLS) {
      expect(llms).toContain(url);
      expect(sitemap.match(new RegExp(`<loc>${url}</loc>`, "g")) ?? [])
        .toHaveLength(1);
      expect(wayfinder).not.toContain(url);
    }
    expect(sitemap.match(/<loc>/g) ?? []).toHaveLength(177);
    expect(JSON.stringify(manifest.mcp ?? {}))
      .not.toMatch(/non[_-]exhaustive[_-]understanding/i);
  });

  test("live checker accepts only exact GET/HEAD bytes, links, media, and cache", async () => {
    await expect(checkNonExhaustiveUnderstandingAtlasTriple(exactFetcher()))
      .resolves.toBeUndefined();
    for (const kind of ["link", "cache", "media", "body", "status"] as const) {
      await expect(checkNonExhaustiveUnderstandingAtlasTriple(exactFetcher({ kind })))
        .rejects.toThrow("lost the exact immutable Non-Exhaustive Understanding contract");
    }
    await expect(checkNonExhaustiveUnderstandingAtlasTriple(exactFetcher({
      kind: "link",
      path: PUBLIC_PATHS[1],
      method: "HEAD",
    }))).rejects.toThrow("lost the exact immutable Non-Exhaustive Understanding contract");

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
    await expect(checkNonExhaustiveUnderstandingAtlasTriple(mutationLinkFetcher))
      .rejects.toThrow("lost the zero-body Non-Exhaustive Understanding 405 boundary");
  });

  test("requires atomic staging and retires discovery without predecessor coupling", () => {
    const family = PUBLICATION_FAMILIES.find(
      ({ id }) => id === "non-exhaustive-understanding-atlas",
    )!;
    const complete = new Set(family.routes.map(destinationForPublicPath));
    expect(publicationFamilyStates(complete).get(family.id)?.active).toBe(true);

    const partial = new Set(complete);
    partial.delete(destinationForPublicPath(family.routes[2]!));
    expect(() => publicationFamilyStates(partial))
      .toThrow("stage all family routes or retire all of them");

    expect(publicationFamilyStates(new Set()).get(family.id)?.active).toBe(false);
    const advertised = {
      label: "stale manifest",
      text: JSON.stringify({
        non_exhaustive_understanding_atlas: { static_only: true },
        entry_points: {
          non_exhaustive_understanding_atlas: PUBLIC_URLS[0],
        },
      }),
      value: {
        non_exhaustive_understanding_atlas: { static_only: true },
        entry_points: {
          non_exhaustive_understanding_atlas: PUBLIC_URLS[0],
        },
      },
    };
    expect(() => assertRetiredFamilyDiscoveryAbsent(family, [advertised]))
      .toThrow("retired but remains advertised");
    const nestedGuestBoundary = {
      label: "stale guest implementation boundary",
      text: JSON.stringify({
        implementation_boundaries: {
          non_exhaustive_understanding_atlas: "stale boundary without a route",
        },
      }),
      value: {
        implementation_boundaries: {
          non_exhaustive_understanding_atlas: "stale boundary without a route",
        },
      },
    };
    expect(() => assertRetiredFamilyDiscoveryAbsent(family, [nestedGuestBoundary]))
      .toThrow(
        "still exposes implementation_boundaries.non_exhaustive_understanding_atlas",
      );
    expect(() => assertRetiredFamilyDiscoveryAbsent(family, [{
      label: "clean retirement",
      text: "{}",
      value: { entry_points: {} },
    }])).not.toThrow();
  });
});
