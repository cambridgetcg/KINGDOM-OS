import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AESTHETIC_PLURALITY_MAKING_ATLAS_AUTHORIZATION_BYTE_SHA256,
  AESTHETIC_PLURALITY_MAKING_ATLAS_BYTE_SHA256,
  AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_BYTE_SHA256,
  AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_LOCATOR,
  AESTHETIC_PLURALITY_MAKING_ATLAS_LANE_NAMES,
  AESTHETIC_PLURALITY_MAKING_ATLAS_LOCATOR,
  AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_BOUNDARY_KEYS,
  AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS,
  AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_URLS,
  AESTHETIC_PLURALITY_MAKING_ATLAS_REVIEW_CORE_SHA256,
  AESTHETIC_PLURALITY_MAKING_ATLAS_SITE_AUDIT_RECORDED_REVIEW_LOCK_BYTE_SHA256,
  AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_BYTE_SHA256,
  AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LOCATOR,
  aestheticPluralityMakingAtlasPublicDiscovery,
  loadAestheticPluralityMakingAtlas,
} from "../bin/aesthetic-plurality-making-atlas.ts";
import {
  PUBLICATION_FAMILIES,
  assertRetiredFamilyDiscoveryAbsent,
  checkAestheticPluralityMakingAtlasTriple,
  destinationForPublicPath,
  publicationFamilyStates,
} from "../bin/check-hub-live.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import { parseStrictJsonBytes } from "../bin/principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");
const json = (path: string): any => JSON.parse(read(path));
const SCHEMA_PYTHON = process.env.AESTHETIC_PLURALITY_SCHEMA_PYTHON || "python3";
const pinnedJsonschemaProbe = Bun.spawnSync({
  cmd: [SCHEMA_PYTHON, "-c",
    "import importlib.metadata,sys; sys.exit(0 if importlib.metadata.version('jsonschema') == '4.26.0' else 1)"],
  stdout: "pipe",
  stderr: "pipe",
});

const SCOPE_FALSE_KEYS = [
  "accessDecision", "account", "api", "artifactEvaluation",
  "authorityConversion", "automatedRanking", "automatedRecommendation",
  "automaticAction", "completionConversion", "cultureEvaluation",
  "enforcementDecision", "formInput", "goodnessConversion",
  "governanceDecision", "justiceConversion", "legalConclusion", "liveInput",
  "livingTraditionFixture", "mcp", "moderationDecision", "network",
  "ownershipConversion", "participantData", "permissionConversion",
  "personEvaluation", "personalAppearanceAssessment", "privateData",
  "protectedExpressionFixture", "publicationDecision", "realPeople",
  "recognizableThirdPartyWork", "runtime", "scalarAestheticEvaluation",
  "truthConversion", "wcagConformanceClaim",
] as const;

const SOURCE_FALSE_KEYS = [
  "authorityImported", "complianceImported", "currentnessImported",
  "downloadedAtBuild", "endorsementImported", "licenceImported",
  "permissionImported", "reuseRightImported", "sourceTextImported",
  "truthImported",
] as const;

function mutateAndReject(mutate: (value: Record<string, any>) => void): void {
  const value = structuredClone(loadAestheticPluralityMakingAtlas());
  mutate(value);
  expect(() => aestheticPluralityMakingAtlasPublicDiscovery(value))
    .toThrow("identity or non-authority boundary drifted");
}

function copyFrozenTriplet(targetRoot: string): void {
  for (const locator of [
    AESTHETIC_PLURALITY_MAKING_ATLAS_LOCATOR,
    AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LOCATOR,
    AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_LOCATOR,
  ]) {
    const target = join(targetRoot, locator);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(join(ROOT, locator)));
  }
}

function responseForTriple(path: string, method: string, extraLink = ""): Response {
  if (method !== "HEAD") {
    return new Response(null, { status: 405, headers: {
      "access-control-allow-origin": "*", allow: "GET, HEAD",
      "cache-control": "no-store", "x-content-type-options": "nosniff",
    } });
  }
  const contentType = path === AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[0]
    ? "application/json; charset=utf-8"
    : path === AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[1]
      ? "application/json; charset=utf-8"
      : "text/markdown; charset=utf-8";
  const headers: Record<string, string> = {
    "access-control-allow-origin": "*",
    "cache-control": "public, max-age=31536000, immutable, no-transform",
    "content-type": contentType,
    "x-content-type-options": "nosniff",
  };
  if (path === AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[0]) {
    headers.link = [
      `<${AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[1]}>; rel="describedby"; type="application/json"`,
      `<${AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[2]}>; rel="service-doc"; type="text/markdown"`,
      extraLink,
    ].filter(Boolean).join(", ");
  }
  return new Response(null, { headers });
}

describe("Aesthetic Plurality & Making Relations Atlas public family", () => {
  test("verifies the exact frozen triplet and exposes only the count-light projection", () => {
    const files: Array<[string, number, string]> = [
      [AESTHETIC_PLURALITY_MAKING_ATLAS_LOCATOR, 62_188,
        AESTHETIC_PLURALITY_MAKING_ATLAS_BYTE_SHA256],
      [AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LOCATOR, 225_293,
        AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_BYTE_SHA256],
      [AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_LOCATOR, 14_497,
        AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_BYTE_SHA256],
    ];
    for (const [locator, bytes, digest] of files) {
      const body = readFileSync(join(ROOT, locator));
      expect(body.byteLength).toBe(bytes);
      expect(createHash("sha256").update(body).digest("hex")).toBe(digest);
    }
    // The nonpublic review-lock hash is retained only as a site-audit note;
    // loadAestheticPluralityMakingAtlas never claims to verify that absent file.
    expect(AESTHETIC_PLURALITY_MAKING_ATLAS_SITE_AUDIT_RECORDED_REVIEW_LOCK_BYTE_SHA256)
      .toBe("b54d86af400207110fd90a70ea4623d976d29b0c2f57450da9777f6200f19c79");
    expect(AESTHETIC_PLURALITY_MAKING_ATLAS_AUTHORIZATION_BYTE_SHA256)
      .toBe("5a9de5fa37ebe5d64577a14017f2a089423b750675f95b2dc621ff400768fe6e");
    expect(AESTHETIC_PLURALITY_MAKING_ATLAS_REVIEW_CORE_SHA256)
      .toBe("3989011350fdd512e8fa61759548457c97c4a064feeb266a4507c3dbe3c0e32f");

    const discovery = aestheticPluralityMakingAtlasPublicDiscovery();
    expect(discovery.title)
      .toBe("KINGDOM Aesthetic Plurality & Making Relations Atlas — Phase 0");
    expect(discovery.protocol).toBe("kingdom.aesthetic-plurality-making/0.1");
    expect(discovery.artifact).toEqual({
      id: "kingdom-aesthetic-plurality-making-atlas-phase-0-2026-08-29",
      asOf: "2026-08-29",
      kind: "STATIC_SYNTHETIC_RELATION_ATLAS",
      phase: "FROZEN_STATIC_FIXTURE",
      reviewState: "INDEPENDENT_REVIEW_GREEN_EXACT_BYTE_HANDOFF",
      staticArtifact: true,
      syntheticOnly: true,
      immutable: true,
    });
    expect(discovery.lanes).toEqual(AESTHETIC_PLURALITY_MAKING_ATLAS_LANE_NAMES);
    expect(discovery.publicHandoff).toEqual({
      recordPath: AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[0],
      schemaPath: AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[1],
      guidePath: AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[2],
    });
    expect(Object.keys(discovery.boundary))
      .toEqual(AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_BOUNDARY_KEYS);
    expect(Object.values(discovery.boundary).every((value) => value === false)).toBe(true);
    expect(Object.keys(discovery)).not.toContain("counts");
    expect(Object.keys(discovery)).not.toContain("source");
    expect(JSON.stringify(discovery)).not.toMatch(
      /fixtureIds|nonEquivalences|equationCards|sourceBindings|scoreValue|rankValue|winner|confidence/i,
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
          join(ROOT, AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LOCATOR),
          join(ROOT, AESTHETIC_PLURALITY_MAKING_ATLAS_LOCATOR),
        ],
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(validation.exitCode).toBe(0);
      expect(validation.stderr.toString()).toBe("");
    },
  );

  test("rejects every forbidden scope and source import before projecting false boundaries", () => {
    for (const key of SCOPE_FALSE_KEYS) {
      mutateAndReject((value) => value.scope[key] = true);
    }
    for (const key of SOURCE_FALSE_KEYS) {
      mutateAndReject((value) => value.sourceBindingInvariants[key] = true);
    }
    mutateAndReject((value) => delete value.scope.realPeople);
    mutateAndReject((value) => value.scope.unreviewedExtra = false);
  });

  test("rejects state, handoff, Beauty, register, fixture, receipt and shape drift", () => {
    const mutations: Array<(value: Record<string, any>) => void> = [
      (value) => value.protocol = "kingdom.aesthetic-plurality-making/0.2",
      (value) => value.artifact.lifecycle.humanReviewCompleted = true,
      (value) => value.artifact.lifecycle.externalPublicationPerformed = true,
      (value) => value.artifact.lifecycle.independentReviewGreen = false,
      (value) => value.artifact.lifecycle.publicationAuthorized = false,
      (value) => value.publicHandoff.mutableAlias = true,
      (value) => value.publicHandoff.htmlPage = true,
      (value) => value.publicHandoff.runtime = true,
      (value) => value.publicHandoff.routes[0].route = "/latest.json",
      (value) => value.publicHandoff.routes[1].mimeType = "text/html",
      (value) => value.constitutionalBoundaries.notBeautyFramework = false,
      (value) => value.constitutionalBoundaries.separatelyOwnedBeautyDoctrineImported = true,
      (value) => value.constitutionalBoundaries.forbiddenFieldNames = [],
      (value) => value.constitutionalBoundaries.forbiddenConversions = [],
      (value) => value.constitutionalBoundaries.fixtureSafety = [],
      (value) => value.vocabularies.lanes.reverse(),
      (value) => value.vocabularies.mathematicalRegisters[0].artifactRelation = true,
      (value) => value.vocabularies.mathematicalRegisters[0].aestheticJudgmentRelation = true,
      (value) => value.vocabularies.mathematicalRegisters[0].selectionRelation = true,
      (value) => value.vocabularies.mathematicalRegisters[0].choiceRule = true,
      (value) => value.syntheticFixtures[0].synthetic = false,
      (value) => value.syntheticFixtures[0].winner = "FORM_ALPHA",
      (value) => value.counts.syntheticFixtures = 17,
      (value) => value.kingdomOrientations.push({ importsAuthority: false }),
      (value) => value.buildReceipt.networkUsed = true,
      (value) => value.buildReceipt.randomnessUsed = true,
      (value) => value.buildReceipt.generatorInputReceipts[0].byteSha256 =
        "sha256:" + "0".repeat(64),
      (value) => value.unreviewedTopLevel = false,
      (value) => delete value.nonEquivalences,
    ];
    for (const mutate of mutations) mutateAndReject(mutate);
  });

  test("rejects a symlinked source ancestor before reading frozen bytes", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "kingdom-aesthetic-plurality-atlas-"));
    try {
      symlinkSync(join(ROOT, "public"), join(fixtureRoot, "public"), "dir");
      expect(() => loadAestheticPluralityMakingAtlas(fixtureRoot))
        .toThrow(/symbolic(?:-| )link/i);
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  test("rejects raw record, schema, and guide drift before semantic projection", () => {
    const mutations: Array<[string, (bytes: Buffer) => Buffer]> = [
      [AESTHETIC_PLURALITY_MAKING_ATLAS_LOCATOR, (bytes) => {
        const changed = Buffer.from(bytes);
        const newline = changed.indexOf(0x0a);
        expect(newline).toBeGreaterThan(-1);
        changed[newline] = 0x20;
        return changed;
      }],
      [AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LOCATOR, (bytes) => {
        const changed = Buffer.from(bytes);
        const newline = changed.indexOf(0x0a);
        expect(newline).toBeGreaterThan(-1);
        changed[newline] = 0x20;
        return changed;
      }],
      [AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_LOCATOR, (bytes) => {
        const changed = Buffer.from(bytes);
        changed[changed.length - 1] = changed[changed.length - 1] === 0x0a ? 0x20 : 0x0a;
        return changed;
      }],
    ];
    for (const [locator, mutate] of mutations) {
      const fixtureRoot = mkdtempSync(join(tmpdir(), "kingdom-aesthetic-byte-drift-"));
      try {
        copyFrozenTriplet(fixtureRoot);
        const target = join(fixtureRoot, locator);
        writeFileSync(target, mutate(readFileSync(target)));
        expect(() => loadAestheticPluralityMakingAtlas(fixtureRoot))
          .toThrow(/byte receipt/);
      } finally {
        rmSync(fixtureRoot, { recursive: true, force: true });
      }
    }
  });

  test("the strict JSON reader refuses duplicate record and schema keys", () => {
    for (const bytes of [
      Buffer.from('{"protocol":"a","protocol":"b"}'),
      Buffer.from('{"$schema":"a","$schema":"b"}'),
    ]) {
      expect(() => parseStrictJsonBytes(bytes, "Aesthetic frozen JSON"))
        .toThrow(/duplicate/i);
    }
  });

  test("pins one active immutable three-route family without alias, page, or dependency", () => {
    expect(AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_URLS).toEqual(
      AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS.map((path) =>
        `https://thekingdom.dev${path}`),
    );
    expect(PUBLICATION_FAMILIES).toHaveLength(35);
    expect(PUBLICATION_FAMILIES.find(({ id }) =>
      id === "aesthetic-plurality-making-atlas")).toEqual({
        id: "aesthetic-plurality-making-atlas",
        label: "Aesthetic Plurality & Making Relations Atlas",
        routes: AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS,
        discoveryProperties: ["aesthetic_plurality_making_atlas"],
        entryPointProperties: [
          "aesthetic_plurality_making_atlas",
          "aesthetic_plurality_making_atlas_schema",
          "aesthetic_plurality_making_atlas_guide",
        ],
      });
    expect(AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS.some((path) =>
      path.endsWith("/") || /(?:latest|current|alias|page|wayfinder|mcp)/i.test(path)))
      .toBe(false);
  });

  test("binds exact staging, ledger, discovery, sitemap, and no-coupling contracts", () => {
    expect(HUB_ASSETS).toHaveLength(201);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(41);
    expect(HUB_ASSETS.filter(({ destination }) =>
      destination !== "_worker.js" && destination !== "404.html"))
      .toHaveLength(199);
    expect(HUB_ASSETS.filter(({ source }) => [
      AESTHETIC_PLURALITY_MAKING_ATLAS_LOCATOR,
      AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LOCATOR,
      AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_LOCATOR,
    ].includes(source as any))).toEqual([
      { source: AESTHETIC_PLURALITY_MAKING_ATLAS_LOCATOR,
        destination: "atlases/aesthetic-plurality-making-atlas-2026-08-29.json" },
      { source: AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LOCATOR,
        destination: "schemas/aesthetic-plurality-making-atlas/0.1.json" },
      { source: AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_LOCATOR,
        destination: "AESTHETIC-PLURALITY-MAKING-ATLAS-v0.1.md" },
    ]);

    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(160);
    expect(ledger.entries.filter((entry: any) =>
      entry.id.startsWith("aesthetic-plurality-making-atlas/"))).toEqual([
        { id: "aesthetic-plurality-making-atlas/0.1/guide",
          route: AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[2],
          source: AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_LOCATOR,
          destination: "AESTHETIC-PLURALITY-MAKING-ATLAS-v0.1.md",
          sha256: AESTHETIC_PLURALITY_MAKING_ATLAS_GUIDE_BYTE_SHA256 },
        { id: "aesthetic-plurality-making-atlas/0.1/record",
          route: AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[0],
          source: AESTHETIC_PLURALITY_MAKING_ATLAS_LOCATOR,
          destination: "atlases/aesthetic-plurality-making-atlas-2026-08-29.json",
          sha256: AESTHETIC_PLURALITY_MAKING_ATLAS_BYTE_SHA256 },
        { id: "aesthetic-plurality-making-atlas/0.1/schema",
          route: AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[1],
          source: AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_LOCATOR,
          destination: "schemas/aesthetic-plurality-making-atlas/0.1.json",
          sha256: AESTHETIC_PLURALITY_MAKING_ATLAS_SCHEMA_BYTE_SHA256 },
      ]);

    const expected = aestheticPluralityMakingAtlasPublicDiscovery();
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    expect(kingdom.aesthetic_plurality_making_atlas).toEqual(expected);
    expect(guest.aesthetic_plurality_making_atlas).toEqual(expected);
    expect(manifest.aesthetic_plurality_making_atlas).toEqual(expected);
    expect(Object.keys(manifest.entry_points)).toHaveLength(169);
    expect(Object.fromEntries(Object.entries(manifest.entry_points)
      .filter(([key]) => key.startsWith("aesthetic_plurality_making_atlas"))))
      .toEqual({
        aesthetic_plurality_making_atlas:
          AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_URLS[0],
        aesthetic_plurality_making_atlas_schema:
          AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_URLS[1],
        aesthetic_plurality_making_atlas_guide:
          AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_URLS[2],
      });
    expect(guest.next_actions).toHaveLength(169);
    const actions = guest.next_actions.filter((action: any) =>
      AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_URLS.includes(action.url));
    expect(actions).toHaveLength(3);
    expect(actions.every((action: any) => action.method === "GET" &&
      ["mcp", "tool", "write", "execute", "score", "rank", "winner",
        "recommendation", "moderation", "actionAuthority"]
        .every((key) => !(key in action)))).toBe(true);

    const html = read("site/hub.html");
    const llms = read("site/llms.txt");
    const sitemap = read("pages-content/sitemap.xml");
    const wayfinderBytes = readFileSync(join(ROOT, "site/wayfinder.json"));
    for (const [index, kind] of ["record", "schema", "guide"].entries()) {
      expect(html.match(new RegExp(
        `data-aesthetic-plurality-making-atlas-link="${kind}"`, "g")) ?? [])
        .toHaveLength(1);
      expect(llms).toContain(AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_URLS[index]);
      expect(sitemap.match(new RegExp(
        `<loc>${AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_URLS[index]}</loc>`, "g")) ?? [])
        .toHaveLength(1);
    }
    expect(html.match(new RegExp(
      `<link rel="describedby" href="${AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[1]}" type="application/json"`,
      "g",
    )) ?? []).toHaveLength(1);
    expect(html).not.toContain('id="aesthetic-plurality-making-atlas"');
    expect(wayfinderBytes.toString("utf8"))
      .not.toMatch(/aesthetic[_-]plurality[_-]making[_-]atlas/i);
    const wayfinderGenerated = JSON.parse(wayfinderBytes.toString("utf8")).generated;
    expect(wayfinderGenerated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(wayfinderGenerated).toBe(kingdom.generated);
    const generatedLine = Buffer.from(`\n  "generated": "${wayfinderGenerated}",\n`);
    const generatedOffset = wayfinderBytes.indexOf(generatedLine);
    expect(generatedOffset).toBeGreaterThan(-1);
    // 只還原頂層 build 日期嗰行；其餘 raw bytes 繼續由原 SHA 鎖定。
    const wayfinderBaselineBytes = Buffer.concat([
      wayfinderBytes.subarray(0, generatedOffset),
      Buffer.from('\n  "generated": "2026-09-04",\n'),
      wayfinderBytes.subarray(generatedOffset + generatedLine.length),
    ]);
    expect(createHash("sha256").update(wayfinderBaselineBytes).digest("hex"))
      .toBe("5fac75e7b9037654016ee8a4a0b59732a0858466464702e2581ba7a90bf7b5ce");
    expect(JSON.stringify(manifest.mcp ?? {}))
      .not.toMatch(/aesthetic[_-]plurality[_-]making[_-]atlas/i);
    expect(sitemap.match(/<loc>/g) ?? []).toHaveLength(185);
    expect(read("publications/hub-staging.v1.json")).not.toMatch(
      /aesthetic-plurality-making-atlas-(?:latest|current)|aesthetic-plurality-making-atlas\/index/i,
    );
  });

  test("activates or retires all three routes atomically", () => {
    const family = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "aesthetic-plurality-making-atlas")!;
    const staged = new Set(HUB_ASSETS.map(({ destination }) => destination));
    expect(publicationFamilyStates(staged).get(family.id)?.active).toBe(true);
    staged.delete(destinationForPublicPath(AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[1]));
    expect(() => publicationFamilyStates(staged))
      .toThrow("Aesthetic Plurality & Making Relations Atlas is partially staged");
    for (const path of AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS) {
      staged.delete(destinationForPublicPath(path));
    }
    expect(publicationFamilyStates(staged).get(family.id)).toMatchObject({ active: false });
  });

  test("rejects every lingering route and projection after retirement", () => {
    const family = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "aesthetic-plurality-making-atlas")!;
    for (const surface of [
      { label: "authored Kingdom map",
        text: JSON.stringify({ aesthetic_plurality_making_atlas: { stale: true } }),
        value: { aesthetic_plurality_making_atlas: { stale: true } } },
      { label: "agent manifest", text: JSON.stringify({ entry_points: {
        aesthetic_plurality_making_atlas_guide:
          AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_URLS[2] } }), value: {
        entry_points: { aesthetic_plurality_making_atlas_guide:
          AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_URLS[2] } } },
      { label: "llms.txt", text: AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_URLS[0] },
      { label: "hub HTML",
        text: `<a href="${AESTHETIC_PLURALITY_MAKING_ATLAS_PUBLIC_PATHS[1]}">stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(family, [surface]))
        .toThrow("Aesthetic Plurality & Making Relations Atlas is retired");
    }
  });

  test("live checker pins exact HEAD and fifteen bodyless mutation boundaries", async () => {
    const calls: Array<{ path: string; method: string }> = [];
    await checkAestheticPluralityMakingAtlasTriple(async (input, init) => {
      const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
      const method = init?.method || "GET";
      calls.push({ path, method });
      return responseForTriple(path, method);
    });
    expect(calls).toHaveLength(18);
    expect(calls.filter(({ method }) => method === "HEAD")).toHaveLength(3);
    expect(calls.filter(({ method }) => method !== "HEAD")).toHaveLength(15);
  });

  test("live checker rejects any extra record Link relation", async () => {
    await expect(checkAestheticPluralityMakingAtlasTriple(async (input, init) => {
      const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
      return responseForTriple(path, init?.method || "GET",
        "</not-part-of-the-contract>; rel=canonical");
    })).rejects.toThrow(
      "lost the immutable Aesthetic Plurality & Making Relations Atlas HEAD contract",
    );
  });
});
