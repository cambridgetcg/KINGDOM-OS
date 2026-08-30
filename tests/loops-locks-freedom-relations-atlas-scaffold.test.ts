import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_BYTE_SHA256,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_BYTE_SHA256,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_LOCATOR,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_LOCATOR,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_BYTE_SHA256,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_LOCATOR,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE,
  loadLoopsLocksFreedomRelationsAtlas,
  loopsLocksFreedomRelationsAtlasPublicDiscovery,
} from "../bin/loops-locks-freedom-relations-atlas.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import {
  PUBLICATION_FAMILIES,
  assertRetiredFamilyDiscoveryAbsent,
  checkLoopsLocksFreedomRelationsAtlasTriple,
  destinationForPublicPath,
  publicationFamilyStates,
} from "../bin/check-hub-live.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");
const json = (path: string): any => JSON.parse(read(path));
const SCHEMA_PYTHON = process.env.LOOPS_LOCKS_FREEDOM_SCHEMA_PYTHON || "python3";
const pinnedJsonschemaProbe = Bun.spawnSync({
  cmd: [SCHEMA_PYTHON, "-c",
    "import importlib.metadata,sys; sys.exit(0 if importlib.metadata.version('jsonschema') == '4.26.0' else 1)"],
  stdout: "pipe",
  stderr: "pipe",
});

const SCOPE_FALSE_KEYS = [
  "accessDecision", "alignmentScore", "authenticationAdapter",
  "authorizationAdapter", "automaticAction", "behavioralDiagnosis",
  "censorship", "communityScore", "consciousnessInference",
  "controlActuation", "credentials", "enforcementAdapter", "freedomScore",
  "humanTraining", "intentInference", "keyGeneration", "liveObservation",
  "liveOptimization", "lockStrengthScore", "mcp", "moralScore", "network",
  "personScore", "personalData", "policyDeployment", "privateKeys",
  "punishmentRecommendation", "realPeople", "recommendation",
  "reinforcementScore", "rewardRuntime", "runtimeAgent", "unconstrainedAction",
] as const;

function mutateAndReject(mutate: (value: Record<string, any>) => void): void {
  const value = structuredClone(loadLoopsLocksFreedomRelationsAtlas());
  mutate(value);
  expect(() => loopsLocksFreedomRelationsAtlasPublicDiscovery(value))
    .toThrow("identity or constitutional boundary drifted");
}

function responseForTriple(path: string, method: string, extraLink = ""): Response {
  if (method !== "HEAD") {
    return new Response(null, { status: 405, headers: {
      "access-control-allow-origin": "*", allow: "GET, HEAD",
      "cache-control": "no-store", "x-content-type-options": "nosniff",
    } });
  }
  const contentType = path === LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS[0]
    ? "application/json; charset=utf-8"
    : path === LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS[1]
      ? "application/schema+json; charset=utf-8"
      : "text/markdown; charset=utf-8";
  const headers: Record<string, string> = {
    "access-control-allow-origin": "*",
    "cache-control": "public, max-age=31536000, immutable, no-transform",
    "content-type": contentType,
    "x-content-type-options": "nosniff",
  };
  if (path === LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS[0]) {
    headers.link = [
      `<${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS[1]}>; rel="describedby"; type="application/schema+json"`,
      `<${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS[2]}>; rel="service-doc"; type="text/markdown"`,
      extraLink,
    ].filter(Boolean).join(", ");
  }
  return new Response(null, { headers });
}

describe("Loops, Locks & Freedom Relations Atlas public family", () => {
  test("verifies the exact frozen triplet and exposes only the minimal projection", () => {
    const files: Array<[string, number, string]> = [
      [LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_LOCATOR, 200_064,
        LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_BYTE_SHA256],
      [LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_LOCATOR, 58_486,
        LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_BYTE_SHA256],
      [LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_LOCATOR, 16_519,
        LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_BYTE_SHA256],
    ];
    expect(files.map(([locator, bytes, digest]) => {
      const body = readFileSync(join(ROOT, locator));
      return [body.byteLength, createHash("sha256").update(body).digest("hex"), bytes, digest];
    })).toEqual(files.map(([, bytes, digest]) => [bytes, digest, bytes, digest]));

    const discovery = loopsLocksFreedomRelationsAtlasPublicDiscovery();
    expect(discovery).toEqual({
      title: "KINGDOM Loops, Locks & Freedom Relations Atlas — Phase 0",
      protocol: "kingdom.loops-locks-freedom-relations/0.1",
      artifact: {
        id: "kingdom-loops-locks-freedom-relations-atlas-2026-08-28",
        asOf: "2026-08-28",
        lifecyclePhase: "FROZEN_STATIC_FIXTURE",
        releaseState: "FROZEN_FOR_IMMUTABLE_HANDOFF",
        synthetic: true,
      },
      publicHandoff: {
        recordPath: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS[0],
        schemaPath: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS[1],
        guidePath: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS[2],
      },
      source: {
        tag: "https://github.com/cambridgetcg/kingdom-loops-locks-freedom-relations-atlas/tree/v0.1.1",
        revision: "d8534096224d9e82825653af0f9e12fd123e85b5",
        relation: "SITE_AUTHORED_PINNED_SOURCE_LOCATOR",
        establishesTruth: false,
        importsAuthority: false,
        runtimeDependency: false,
        currentnessClaim: false,
      },
      boundary: {
        real_people_or_personal_data: false,
        live_observation_or_human_training: false,
        live_optimization_or_reward_runtime: false,
        score_or_recommendation: false,
        credential_or_key_material: false,
        authentication_authorization_enforcement_adapter: false,
        policy_deployment_or_action_authority: false,
        network: false,
        runtime: false,
        mcp: false,
      },
    });
    expect(Object.keys(discovery)).not.toContain("counts");
    expect(JSON.stringify(discovery)).not.toMatch(
      /fixtureIds|nonEquivalences|scoreValue|winner|recommendationText|credentialMaterial|actionAuthority/i,
    );
  });

  test.skipIf(pinnedJsonschemaProbe.exitCode !== 0)(
    "the closed Draft 2020-12 schema validates the exact record with jsonschema 4.26.0",
    () => {
      const validation = Bun.spawnSync({
        cmd: [
          SCHEMA_PYTHON,
          "-c",
          [
            "import json,sys",
            "from jsonschema import Draft202012Validator,FormatChecker",
            "schema=json.load(open(sys.argv[1],encoding='utf-8'))",
            "record=json.load(open(sys.argv[2],encoding='utf-8'))",
            "Draft202012Validator.check_schema(schema)",
            "Draft202012Validator(schema,format_checker=FormatChecker()).validate(record)",
          ].join(";"),
          join(ROOT, LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_LOCATOR),
          join(ROOT, LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_LOCATOR),
        ],
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(validation.exitCode).toBe(0);
      expect(validation.stderr.toString()).toBe("");
    },
  );

  test("pins all seven site-authored source-locator fields as non-authority", () => {
    const mutations: Array<(value: Record<string, any>) => void> = [
      (value) => value.tag = value.tag.replace("v0.1.1", "main"),
      (value) => value.revision = "0".repeat(40),
      (value) => value.relation = "EVIDENCE",
      (value) => value.establishesTruth = true,
      (value) => value.importsAuthority = true,
      (value) => value.runtimeDependency = true,
      (value) => value.currentnessClaim = true,
    ];
    for (const mutate of mutations) {
      const source = structuredClone(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE);
      mutate(source);
      expect(() => loopsLocksFreedomRelationsAtlasPublicDiscovery(
        loadLoopsLocksFreedomRelationsAtlas(), source,
      )).toThrow("site-authored source locator drifted");
    }
  });

  test("rejects every forbidden scope capability before projecting aggregates", () => {
    for (const key of SCOPE_FALSE_KEYS) {
      mutateAndReject((value) => value.scope[key] = true);
    }
    mutateAndReject((value) => delete value.scope.realPeople);
    mutateAndReject((value) => value.scope.unreviewedExtra = false);
  });

  test("rejects hidden lock, key, source, orientation, fixture and rights drift", () => {
    const mutations: Array<(value: Record<string, any>) => void> = [
      (value) => value.vocabularies.lockKinds[0].containsMechanism = true,
      (value) => value.vocabularies.lockKinds[0].executable = true,
      (value) => value.vocabularies.keyAndAuthenticatorKinds[0].containsMaterial = true,
      (value) => value.vocabularies.keyAndAuthenticatorKinds[0].executable = true,
      (value) => value.sourceBindings[0].use = "EVIDENCE",
      ...["copiesContent", "importsAuthority", "establishesTruth",
        "establishesCurrentness", "establishesCompliance", "endorsementClaimed"]
        .map((key) => (value: Record<string, any>) => value.sourceBindings[0][key] = true),
      (value) => value.kingdomSemanticOrientations[0].baseCommit = "0".repeat(40),
      (value) => value.kingdomSemanticOrientations[0].baseTree = "0".repeat(40),
      ...["copiesContent", "importsAuthority", "establishesTruth", "runtimeDependency"]
        .map((key) => (value: Record<string, any>) =>
          value.kingdomSemanticOrientations[0][key] = true),
      (value) => value.kingdomSemanticOrientations[0].hasDirectPublicRoute =
        !value.kingdomSemanticOrientations[0].hasDirectPublicRoute,
      (value) => value.syntheticFixtures[0].synthetic = false,
      (value) => value.syntheticFixtures[0].humanSubjects = true,
      (value) => value.syntheticFixtures[0].executableAction = true,
      (value) => value.constitutionalBoundaries.lifecycle.activeRuntimeAllowed = true,
      (value) => value.constitutionalBoundaries.declaredRightsRegister[0].legalAuthority = true,
      (value) => value.constitutionalBoundaries.declaredRightsRegister[0]
        .applicabilityToRealCaseDetermined = true,
    ];
    for (const mutate of mutations) mutateAndReject(mutate);
  });

  test("rejects registry, count, state, handoff, authorship, receipt and shape drift", () => {
    const mutations: Array<(value: Record<string, any>) => void> = [
      (value) => value.protocol = "kingdom.loops-locks-freedom-relations/0.2",
      (value) => value.counts.nonEquivalences = 54,
      (value) => value.nonEquivalences[0].relation = "EQUIVALENT",
      (value) => value.nonEquivalences[0].declaredAssumptions = [],
      (value) => value.nonEquivalences[0].informationLost = [],
      (value) => value.nonEquivalences[0].fixtureIds = [],
      (value) => value.artifact.lifecyclePhase = "ACTIVE",
      (value) => value.artifact.releaseState = "CURRENT",
      (value) => value.artifact.authorship.humanReviewCompleted = true,
      (value) => value.artifact.authorship.independentModelReviewCompleted = false,
      (value) => value.artifact.authorship.releaseGateSatisfied = false,
      (value) => value.artifact.authorship.userPublicationPermissionRecorded = false,
      (value) => value.publicHandoff.mutableAlias = true,
      (value) => value.publicHandoff.page = true,
      (value) => value.publicHandoff.runtime = true,
      (value) => value.publicHandoff.publicationAuthorized = false,
      (value) => value.publicHandoff.routes[0].route = "/latest.json",
      (value) => value.buildReceipt.networkUsed = true,
      (value) => value.buildReceipt.externalInputUsed = true,
      (value) => value.buildReceipt.generatorInputReceipts[0].sha256 = "sha256:" + "0".repeat(64),
      (value) => value.buildReceipt.unreviewedExtra = false,
      (value) => delete value.buildReceipt.verifierState,
      (value) => value.unreviewedTopLevel = false,
      (value) => delete value.conversionRegister,
    ];
    for (const mutate of mutations) mutateAndReject(mutate);
  });

  test("rejects a symlinked source ancestor before reading frozen bytes", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "kingdom-loops-locks-freedom-atlas-"));
    try {
      symlinkSync(join(ROOT, "public"), join(fixtureRoot, "public"), "dir");
      expect(() => loadLoopsLocksFreedomRelationsAtlas(fixtureRoot))
        .toThrow(/symbolic(?:-| )link/i);
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  test("pins one immutable three-route family without alias, page, or dependency", () => {
    expect(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS).toEqual([
      "/atlases/loops-locks-freedom-relations-atlas-2026-08-28.json",
      "/schemas/loops-locks-freedom-relations-atlas/0.1.json",
      "/LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md",
    ]);
    expect(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS).toEqual(
      LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS.map((path) =>
        `https://thekingdom.dev${path}`),
    );
    expect(PUBLICATION_FAMILIES).toHaveLength(34);
    expect(PUBLICATION_FAMILIES.find(({ id }) =>
      id === "loops-locks-freedom-relations-atlas")).toEqual({
        id: "loops-locks-freedom-relations-atlas",
        label: "Loops, Locks & Freedom Relations Atlas",
        routes: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS,
        discoveryProperties: ["loops_locks_freedom_relations_atlas"],
        entryPointProperties: [
          "loops_locks_freedom_relations_atlas",
          "loops_locks_freedom_relations_atlas_schema",
          "loops_locks_freedom_relations_atlas_guide",
        ],
      });
    expect(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS.some((path) =>
      path.endsWith("/") || /(?:latest|current|alias|page|wayfinder|mcp)/i.test(path)))
      .toBe(false);
  });

  test("binds exact staging, ledger, discovery, sitemap, and no-Wayfinder-coupling contracts", () => {
    expect(HUB_ASSETS).toHaveLength(184);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(31);
    expect(HUB_ASSETS.filter(({ destination }) =>
      destination !== "_worker.js" && destination !== "404.html"))
      .toHaveLength(182);
    expect(HUB_ASSETS.filter(({ source }) => [
      LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_LOCATOR,
      LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_LOCATOR,
      LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_LOCATOR,
    ].includes(source as any))).toEqual([
      { source: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_LOCATOR,
        destination: "atlases/loops-locks-freedom-relations-atlas-2026-08-28.json" },
      { source: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_LOCATOR,
        destination: "schemas/loops-locks-freedom-relations-atlas/0.1.json" },
      { source: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_LOCATOR,
        destination: "LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md" },
    ]);

    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(153);
    expect(ledger.entries.filter((entry: any) =>
      entry.id.startsWith("loops-locks-freedom-relations-atlas/"))).toEqual([
        { id: "loops-locks-freedom-relations-atlas/0.1/guide",
          route: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS[2],
          source: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_LOCATOR,
          destination: "LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md",
          sha256: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_BYTE_SHA256 },
        { id: "loops-locks-freedom-relations-atlas/0.1/record",
          route: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS[0],
          source: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_LOCATOR,
          destination: "atlases/loops-locks-freedom-relations-atlas-2026-08-28.json",
          sha256: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_BYTE_SHA256 },
        { id: "loops-locks-freedom-relations-atlas/0.1/schema",
          route: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS[1],
          source: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_LOCATOR,
          destination: "schemas/loops-locks-freedom-relations-atlas/0.1.json",
          sha256: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_BYTE_SHA256 },
      ]);

    const expected = loopsLocksFreedomRelationsAtlasPublicDiscovery();
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    expect(kingdom.loops_locks_freedom_relations_atlas).toEqual(expected);
    expect(guest.loops_locks_freedom_relations_atlas).toEqual(expected);
    expect(manifest.loops_locks_freedom_relations_atlas).toEqual(expected);
    expect(Object.keys(manifest.entry_points)).toHaveLength(153);
    expect(Object.fromEntries(Object.entries(manifest.entry_points)
      .filter(([key]) => key.startsWith("loops_locks_freedom_relations_atlas"))))
      .toEqual({
        loops_locks_freedom_relations_atlas:
          LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS[0],
        loops_locks_freedom_relations_atlas_schema:
          LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS[1],
        loops_locks_freedom_relations_atlas_guide:
          LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS[2],
      });
    expect(guest.next_actions).toHaveLength(153);
    const actions = guest.next_actions.filter((action: any) =>
      LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS.includes(action.url));
    expect(actions).toHaveLength(3);
    expect(actions.every((action: any) => action.method === "GET" &&
      ["mcp", "tool", "write", "execute", "score", "rank", "recommendation",
        "moderation", "actionAuthority"].every((key) => !(key in action))))
      .toBe(true);

    const html = read("site/hub.html");
    const llms = read("site/llms.txt");
    const sitemap = read("pages-content/sitemap.xml");
    const wayfinderBytes = readFileSync(join(ROOT, "site/wayfinder.json"));
    for (const [index, kind] of ["record", "schema", "guide"].entries()) {
      expect(html.match(new RegExp(
        `data-loops-locks-freedom-relations-atlas-link="${kind}"`, "g")) ?? [])
        .toHaveLength(1);
      expect(llms).toContain(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS[index]);
      expect(sitemap).toContain(
        `<loc>${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS[index]}</loc>`,
      );
    }
    expect(html).toContain(
      `data-loops-locks-freedom-relations-atlas-source-link href="${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE.tag}" rel="external noreferrer"`,
    );
    expect(llms).toContain(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE.tag);
    expect(sitemap).not.toContain(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE.tag);
    expect(wayfinderBytes.toString("utf8"))
      .not.toMatch(/loops[_-]locks[_-]freedom[_-]relations[_-]atlas/i);
    expect(createHash("sha256").update(wayfinderBytes).digest("hex"))
      .toBe("7c499916f2f90d84c32f3c9ba6c961a24a4f004bb536fcefcf74277d9b2440d9");
    const wayfinderWithoutGenerated = JSON.parse(wayfinderBytes.toString("utf8"));
    expect(wayfinderWithoutGenerated.generated).toBe("2026-08-30");
    delete wayfinderWithoutGenerated.generated;
    expect(createHash("sha256").update(JSON.stringify(wayfinderWithoutGenerated)).digest("hex"))
      .toBe("aa525a09aaa21d1a2e8ececad329773f20ff004d32494988ec677cee914a16f8");
    expect(JSON.stringify(manifest.mcp ?? {}))
      .not.toMatch(/loops[_-]locks[_-]freedom[_-]relations[_-]atlas/i);
    expect(sitemap.match(/<loc>/g) ?? []).toHaveLength(170);
  });

  test("activates or retires all three routes atomically", () => {
    const family = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "loops-locks-freedom-relations-atlas")!;
    const active = new Set(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS.map(
      destinationForPublicPath,
    ));
    expect(publicationFamilyStates(active).get(family.id)?.active).toBe(true);
    active.delete(destinationForPublicPath(
      LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS[1],
    ));
    expect(() => publicationFamilyStates(active))
      .toThrow("Loops, Locks & Freedom Relations Atlas is partially staged");
    expect(publicationFamilyStates(new Set()).get(family.id))
      .toMatchObject({ active: false });
  });

  test("rejects every lingering route, projection and source after retirement", () => {
    const family = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "loops-locks-freedom-relations-atlas")!;
    for (const surface of [
      { label: "authored Kingdom map",
        text: JSON.stringify({ loops_locks_freedom_relations_atlas: { stale: true } }),
        value: { loops_locks_freedom_relations_atlas: { stale: true } } },
      { label: "agent manifest",
        text: JSON.stringify({ entry_points: {
          loops_locks_freedom_relations_atlas_guide:
            LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS[2] } }),
        value: { entry_points: {
          loops_locks_freedom_relations_atlas_guide:
            LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS[2] } } },
      { label: "llms.txt", text: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS[0] },
      { label: "hub HTML", text: `<a href="${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS[1]}">stale</a>` },
      { label: "pinned source link", text: `<a href="${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE.tag}">stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(family, [surface]))
        .toThrow("Loops, Locks & Freedom Relations Atlas is retired");
    }
  });

  test("live checker pins exact HEAD and fifteen bodyless mutation boundaries", async () => {
    const calls: Array<{ path: string; method: string }> = [];
    await checkLoopsLocksFreedomRelationsAtlasTriple(async (input, init) => {
      const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
      const method = init?.method || "GET";
      calls.push({ path, method });
      return responseForTriple(path, method);
    });
    expect(calls).toHaveLength(18);
    expect(calls.filter(({ method }) => method === "HEAD")).toHaveLength(3);
    expect(calls.filter(({ method }) => method !== "HEAD")).toHaveLength(15);
    expect(new Set(calls.map(({ path }) => path)))
      .toEqual(new Set(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS));
  });

  test("live checker rejects any extra record Link relation", async () => {
    await expect(checkLoopsLocksFreedomRelationsAtlasTriple(async (input, init) => {
      const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
      return responseForTriple(path, init?.method || "GET",
        "</not-part-of-the-contract>; rel=canonical");
    })).rejects.toThrow(
      "lost the immutable Loops, Locks & Freedom Relations Atlas HEAD contract",
    );
  });
});
