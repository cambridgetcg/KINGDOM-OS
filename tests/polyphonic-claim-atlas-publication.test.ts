import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  POLYPHONIC_CLAIM_ATLAS_BYTE_SHA256,
  POLYPHONIC_CLAIM_ATLAS_GUIDE_BYTE_SHA256,
  POLYPHONIC_CLAIM_ATLAS_GUIDE_LOCATOR,
  POLYPHONIC_CLAIM_ATLAS_LOCATOR,
  POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS,
  POLYPHONIC_CLAIM_ATLAS_PUBLIC_URLS,
  POLYPHONIC_CLAIM_ATLAS_SCHEMA_BYTE_SHA256,
  POLYPHONIC_CLAIM_ATLAS_SCHEMA_LOCATOR,
  POLYPHONIC_CLAIM_ATLAS_SOURCE,
  loadPolyphonicClaimAtlas,
  polyphonicClaimAtlasPublicDiscovery,
} from "../bin/polyphonic-claim-atlas.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import {
  PUBLICATION_FAMILIES,
  assertRetiredFamilyDiscoveryAbsent,
  checkPolyphonicClaimAtlasTriple,
  destinationForPublicPath,
  publicationFamilyStates,
} from "../bin/check-hub-live.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const json = (path: string): any =>
  JSON.parse(readFileSync(join(ROOT, path), "utf8"));

describe("Polyphonic Claim Atlas public-family scaffold", () => {
  test("verifies the frozen triplet and exposes only the approved small projection", () => {
    expect([
      POLYPHONIC_CLAIM_ATLAS_BYTE_SHA256,
      POLYPHONIC_CLAIM_ATLAS_SCHEMA_BYTE_SHA256,
      POLYPHONIC_CLAIM_ATLAS_GUIDE_BYTE_SHA256,
    ]).toEqual([
      "69d68faf0885cecf084bee3ff094c742786e7901f8d1da90fa510cce5194970b",
      "8244c3428ea810defd98da1ca7c1d0fec6541c0c175e3195b711b89af39cdb27",
      "974cb357ad1f5a23fa3f8798e444bbfb4dc43b1bf8aa1d14609599877ed13126",
    ]);

    const discovery = polyphonicClaimAtlasPublicDiscovery(loadPolyphonicClaimAtlas());
    expect(discovery).toEqual({
      title: "KINGDOM Polyphonic Claim Atlas: Truth Relations Phase 0",
      description: "A static synthetic atlas for inspecting typed relations among expression, claim, warrant, reasoning, narrative, provenance, institutional status, assessment and correction without producing a truth oracle.",
      protocol: "kingdom.truth-relations/0.1",
      artifact: {
        id: "polyphonic-claim-atlas-2026-08-26",
        version: "0.1.0",
        asOf: "2026-08-26",
        phase: "PHASE_0",
        state: "STATIC_SYNTHETIC_PHASE_0",
        immutableHistoricalArtifact: true,
        runtimeCurrentnessClaim: false,
      },
      publicHandoff: {
        canonicalPath: POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[0],
        schemaPath: POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[1],
        guidePath: POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[2],
      },
      source: {
        tag: "https://github.com/cambridgetcg/kingdom-polyphonic-claim-atlas/tree/v0.1.1",
        revision: "ca7bb37271853545a84bc1b8955ce63918da979b",
        relation: "SITE_AUTHORED_PINNED_SOURCE_LOCATOR",
        establishesTruth: false,
        importsAuthority: false,
        runtimeDependency: false,
        currentnessClaim: false,
      },
      boundary: {
        truth_oracle: false,
        global_truth_status: false,
        person_source_community_scores: false,
        lie_or_intent_inference: false,
        personal_data: false,
        live_claims: false,
        action_authority: false,
        zerone_karma_nen_adapter: false,
        runtime: false,
        mcp: false,
      },
    });
    expect(Object.keys(discovery)).not.toContain("counts");
    expect(JSON.stringify(discovery)).not.toMatch(
      /disposition|winner|recommendation|moderation|confidence|evidence_count|support_total/i,
    );
  });

  test("pins every site-authored source-locator field without importing authority", () => {
    const sourceMutations: Array<(value: Record<string, any>) => void> = [
      (value) => value.tag = value.tag.replace("v0.1.1", "main"),
      (value) => value.revision = "0000000000000000000000000000000000000000",
      (value) => value.relation = "EVIDENCE",
      (value) => value.establishesTruth = true,
      (value) => value.importsAuthority = true,
      (value) => value.runtimeDependency = true,
      (value) => value.currentnessClaim = true,
    ];
    for (const mutate of sourceMutations) {
      const source = structuredClone(POLYPHONIC_CLAIM_ATLAS_SOURCE);
      mutate(source);
      expect(() => polyphonicClaimAtlasPublicDiscovery(
        loadPolyphonicClaimAtlas(),
        source,
      )).toThrow("site-authored source locator drifted");
    }
  });

  test("refuses hidden constituent drift before projecting aggregate negatives", () => {
    const atlas = loadPolyphonicClaimAtlas();
    const mutations: Array<(value: Record<string, any>) => void> = [
      (value) => value.constitutionalBoundaries.convertsHashToTruth = true,
      (value) => value.constitutionalBoundaries.witnessScore = true,
      (value) => value.constitutionalBoundaries.rewardOrPenalty = true,
      (value) => value.constitutionalBoundaries.accessAdapter = true,
      (value) => value.constitutionalBoundaries.infersPrivateReasoning = true,
      (value) => value.constitutionalBoundaries.mcpExposure = true,
      (value) => value.artifact.mutableAlias = true,
      (value) => value.scope.realPeople = true,
      (value) => value.authorship.publicationAuthorized = false,
    ];
    for (const mutate of mutations) {
      const changed = structuredClone(atlas);
      mutate(changed);
      expect(() => polyphonicClaimAtlasPublicDiscovery(changed))
        .toThrow("identity or non-authority boundary drifted");
    }
  });

  test("rejects a symlinked source ancestor before reading frozen bytes", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "kingdom-polyphonic-claim-atlas-"));
    try {
      symlinkSync(join(ROOT, "public"), join(fixtureRoot, "public"), "dir");
      expect(() => loadPolyphonicClaimAtlas(fixtureRoot)).toThrow(/symbolic(?:-| )link/i);
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  test("pins one immutable three-route family without an alias, page, or dependency", () => {
    expect(POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS).toEqual([
      "/truth/polyphonic-claim-atlas-2026-08-26.json",
      "/truth/schemas/v0.1/public-snapshot.schema.json",
      "/POLYPHONIC-CLAIM-ATLAS-v0.1.md",
    ]);
    expect(POLYPHONIC_CLAIM_ATLAS_PUBLIC_URLS).toEqual(
      POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS.map((path) =>
        `https://thekingdom.dev${path}`),
    );

    expect(PUBLICATION_FAMILIES).toHaveLength(33);
    expect(PUBLICATION_FAMILIES.find(({ id }) => id === "polyphonic-claim-atlas"))
      .toEqual({
        id: "polyphonic-claim-atlas",
        label: "Polyphonic Claim Atlas",
        routes: POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS,
        discoveryProperties: ["polyphonic_claim_atlas"],
        entryPointProperties: [
          "polyphonic_claim_atlas",
          "polyphonic_claim_atlas_schema",
          "polyphonic_claim_atlas_guide",
        ],
      });
    expect(POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS.some((path) =>
      path.endsWith("/") || /(?:latest|current|alias|page|mcp)/i.test(path)))
      .toBe(false);
  });

  test("binds exact staging, ledger, discovery, sitemap, and no-Wayfinder contracts", () => {
    expect(HUB_ASSETS).toHaveLength(181);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(31);
    expect(HUB_ASSETS.filter(({ destination }) =>
      destination !== "_worker.js" && destination !== "404.html"))
      .toHaveLength(179);

    const stagedFamily = HUB_ASSETS.filter(({ source }) => [
      POLYPHONIC_CLAIM_ATLAS_LOCATOR,
      POLYPHONIC_CLAIM_ATLAS_SCHEMA_LOCATOR,
      POLYPHONIC_CLAIM_ATLAS_GUIDE_LOCATOR,
    ].includes(source as any));
    expect(stagedFamily).toEqual([
      {
        source: POLYPHONIC_CLAIM_ATLAS_LOCATOR,
        destination: "truth/polyphonic-claim-atlas-2026-08-26.json",
      },
      {
        source: POLYPHONIC_CLAIM_ATLAS_SCHEMA_LOCATOR,
        destination: "truth/schemas/v0.1/public-snapshot.schema.json",
      },
      {
        source: POLYPHONIC_CLAIM_ATLAS_GUIDE_LOCATOR,
        destination: "POLYPHONIC-CLAIM-ATLAS-v0.1.md",
      },
    ]);
    expect(stagedFamily.some(({ source, destination }) =>
      /(?:latest|current|alias|index\.html|wayfinder|mcp)/i.test(`${source} ${destination}`)))
      .toBe(false);

    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(150);
    expect(ledger.entries.filter((entry: any) =>
      entry.id.startsWith("polyphonic-claim-atlas/")))
      .toEqual([
        {
          id: "polyphonic-claim-atlas/0.1/guide",
          route: POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[2],
          source: POLYPHONIC_CLAIM_ATLAS_GUIDE_LOCATOR,
          destination: "POLYPHONIC-CLAIM-ATLAS-v0.1.md",
          sha256: POLYPHONIC_CLAIM_ATLAS_GUIDE_BYTE_SHA256,
        },
        {
          id: "polyphonic-claim-atlas/0.1/record",
          route: POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[0],
          source: POLYPHONIC_CLAIM_ATLAS_LOCATOR,
          destination: "truth/polyphonic-claim-atlas-2026-08-26.json",
          sha256: POLYPHONIC_CLAIM_ATLAS_BYTE_SHA256,
        },
        {
          id: "polyphonic-claim-atlas/0.1/schema",
          route: POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[1],
          source: POLYPHONIC_CLAIM_ATLAS_SCHEMA_LOCATOR,
          destination: "truth/schemas/v0.1/public-snapshot.schema.json",
          sha256: POLYPHONIC_CLAIM_ATLAS_SCHEMA_BYTE_SHA256,
        },
      ]);

    const expected = polyphonicClaimAtlasPublicDiscovery();
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    expect(kingdom.polyphonic_claim_atlas).toEqual(expected);
    expect(guest.polyphonic_claim_atlas).toEqual(expected);
    expect(manifest.polyphonic_claim_atlas).toEqual(expected);
    expect(Object.keys(manifest.entry_points)).toHaveLength(150);
    expect(Object.fromEntries(Object.entries(manifest.entry_points)
      .filter(([key]) => key.startsWith("polyphonic_claim_atlas"))))
      .toEqual({
        polyphonic_claim_atlas: POLYPHONIC_CLAIM_ATLAS_PUBLIC_URLS[0],
        polyphonic_claim_atlas_schema: POLYPHONIC_CLAIM_ATLAS_PUBLIC_URLS[1],
        polyphonic_claim_atlas_guide: POLYPHONIC_CLAIM_ATLAS_PUBLIC_URLS[2],
      });
    expect(guest.next_actions).toHaveLength(150);
    const actions = guest.next_actions.filter((action: any) =>
      POLYPHONIC_CLAIM_ATLAS_PUBLIC_URLS.includes(action.url));
    expect(actions).toHaveLength(3);
    expect(actions.every((action: any) => action.method === "GET" &&
      ["mcp", "tool", "write", "execute", "score", "rank", "recommendation",
        "moderation", "actionAuthority"].every((key) => !(key in action))))
      .toBe(true);
    expect(actions.some((action: any) => action.url === POLYPHONIC_CLAIM_ATLAS_SOURCE.tag))
      .toBe(false);

    const html = readFileSync(join(ROOT, "site/hub.html"), "utf8");
    const llms = readFileSync(join(ROOT, "site/llms.txt"), "utf8");
    const wayfinderBytes = readFileSync(join(ROOT, "site/wayfinder.json"));
    const wayfinder = wayfinderBytes.toString("utf8");
    const sitemap = readFileSync(join(ROOT, "pages-content/sitemap.xml"), "utf8");
    for (const [index, kind] of ["record", "schema", "guide"].entries()) {
      expect(html.match(new RegExp(
        `data-polyphonic-claim-atlas-link="${kind}"`, "g")) ?? [])
        .toHaveLength(1);
      expect(llms).toContain(POLYPHONIC_CLAIM_ATLAS_PUBLIC_URLS[index]);
      expect(sitemap).toContain(`<loc>${POLYPHONIC_CLAIM_ATLAS_PUBLIC_URLS[index]}</loc>`);
    }
    expect(html).toContain(
      `data-polyphonic-claim-atlas-source-link href="${POLYPHONIC_CLAIM_ATLAS_SOURCE.tag}" rel="external noreferrer"`,
    );
    expect(llms).toContain(POLYPHONIC_CLAIM_ATLAS_SOURCE.tag);
    expect(sitemap).not.toContain(POLYPHONIC_CLAIM_ATLAS_SOURCE.tag);
    expect(wayfinder).not.toMatch(/polyphonic[_-]claim[_-]atlas/i);
    expect(createHash("sha256").update(wayfinderBytes).digest("hex"))
      .toBe("b1fc187e2f90a3fbd80cdaee8eb1c9ee8276d45d350515fbd39cd75dc7c11a21");
    expect(JSON.stringify(manifest.mcp ?? {})).not.toMatch(/polyphonic[_-]claim[_-]atlas/i);
    expect(sitemap.match(/<loc>/g) ?? []).toHaveLength(167);
  });

  test("activates or retires all three routes atomically", () => {
    const family = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "polyphonic-claim-atlas")!;
    const active = new Set(POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS.map(
      destinationForPublicPath,
    ));
    expect(publicationFamilyStates(active).get(family.id)?.active).toBe(true);

    active.delete(destinationForPublicPath(POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[1]));
    expect(() => publicationFamilyStates(active))
      .toThrow("Polyphonic Claim Atlas is partially staged");

    const retired = publicationFamilyStates(new Set()).get(family.id);
    expect(retired).toMatchObject({ active: false });
  });

  test("rejects every lingering route and discovery projection after retirement", () => {
    const family = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "polyphonic-claim-atlas")!;
    for (const surface of [
      {
        label: "authored Kingdom map",
        text: JSON.stringify({ polyphonic_claim_atlas: { stale: true } }),
        value: { polyphonic_claim_atlas: { stale: true } },
      },
      {
        label: "agent manifest",
        text: JSON.stringify({
          entry_points: {
            polyphonic_claim_atlas_guide:
              POLYPHONIC_CLAIM_ATLAS_PUBLIC_URLS[2],
          },
        }),
        value: {
          entry_points: {
            polyphonic_claim_atlas_guide:
              POLYPHONIC_CLAIM_ATLAS_PUBLIC_URLS[2],
          },
        },
      },
      {
        label: "llms.txt",
        text: POLYPHONIC_CLAIM_ATLAS_PUBLIC_URLS[0],
      },
      {
        label: "hub HTML",
        text: `<a href="${POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[1]}">stale</a>`,
      },
      {
        label: "pinned source link",
        text: `<a href="${POLYPHONIC_CLAIM_ATLAS_SOURCE.tag}">stale</a>`,
      },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(family, [surface]))
        .toThrow("Polyphonic Claim Atlas is retired");
    }
  });

  test("live-checks exact HEAD contracts and bodyless mutation refusals", async () => {
    const calls: Array<{ path: string; method: string }> = [];
    await checkPolyphonicClaimAtlasTriple(async (input, init) => {
      const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
      const method = init?.method || "GET";
      calls.push({ path, method });
      if (method !== "HEAD") {
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
      const contentType = path === POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[0]
        ? "application/json; charset=utf-8"
        : path === POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[1]
          ? "application/schema+json; charset=utf-8"
          : "text/markdown; charset=utf-8";
      const headers: Record<string, string> = {
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=31536000, immutable, no-transform",
        "content-type": contentType,
        "x-content-type-options": "nosniff",
      };
      if (path === POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[0]) {
        headers.link = [
          `<${POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[1]}>; rel="describedby"; type="application/schema+json"`,
          `<${POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[2]}>; rel="service-doc"; type="text/markdown"`,
        ].join(", ");
      }
      return new Response(null, { headers });
    });

    expect(calls).toHaveLength(18);
    expect(calls.filter(({ method }) => method === "HEAD")).toHaveLength(3);
    expect(calls.filter(({ method }) => method !== "HEAD")).toHaveLength(15);
    expect(new Set(calls.map(({ path }) => path)))
      .toEqual(new Set(POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS));
  });

  test("rejects an extra record Link relation instead of normalizing it as valid", async () => {
    await expect(checkPolyphonicClaimAtlasTriple(async (input, init) => {
      const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
      const method = init?.method || "GET";
      if (method !== "HEAD") {
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
      const contentType = path === POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[0]
        ? "application/json; charset=utf-8"
        : path === POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[1]
          ? "application/schema+json; charset=utf-8"
          : "text/markdown; charset=utf-8";
      const headers: Record<string, string> = {
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=31536000, immutable, no-transform",
        "content-type": contentType,
        "x-content-type-options": "nosniff",
      };
      if (path === POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[0]) {
        headers.link = [
          `<${POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[1]}>; rel="describedby"; type="application/schema+json"`,
          `<${POLYPHONIC_CLAIM_ATLAS_PUBLIC_PATHS[2]}>; rel="service-doc"; type="text/markdown"`,
          "</not-part-of-the-contract>; rel=canonical",
        ].join(", ");
      }
      return new Response(null, { headers });
    })).rejects.toThrow("lost the immutable Polyphonic Claim Atlas HEAD contract");
  });
});
