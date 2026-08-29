import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  EVALUATION_COVENANT_BYTE_SHA256,
  EVALUATION_COVENANT_CANONICAL_SHA256,
  EVALUATION_COVENANT_GUIDE_BYTE_SHA256,
  EVALUATION_COVENANT_SCHEMA_BYTE_SHA256,
  EVALUATION_COVENANT_SCHEMA_CANONICAL_SHA256,
  evaluationCovenantCanonicalJson,
  evaluationCovenantPublicSummary,
  evaluationCovenantSchemaIssues,
  loadEvaluationCovenantPublication,
  renderEvaluationCovenantHtml,
  validateEvaluationCovenantSnapshot,
} from "../bin/evaluation-covenant.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

const routes = [
  "/evaluation-covenant/",
  "/evaluation-covenants.json",
  "/evaluation/uk-government-transformation-evaluation-covenants-2026-08-23.json",
  "/evaluation/schemas/v0.1/public-snapshot.schema.json",
  "/EVALUATION-COVENANT-v0.1.md",
] as const;
const urls = routes.map((route) => `https://thekingdom.dev${route}`);
const producerUrl =
  "https://github.com/cambridgetcg/kingdom-evaluation-covenant/tree/v0.1.0";
const sha256 = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
const clone = <T>(value: T): T => structuredClone(value);

function resign(design: Record<string, any>) {
  const { canonicalReceipt: _receipt, ...input } = design;
  design.canonicalReceipt = "sha256:" +
    sha256(evaluationCovenantCanonicalJson(input));
}

describe("Evaluation Covenant publication shell", () => {
  test("admits only the exact frozen snapshot, schema, guide, and parent-bound semantics", () => {
    const publication = loadEvaluationCovenantPublication();
    const schemaBytes = readFileSync(join(
      ROOT,
      "schemas/evaluation-covenant/v0.1/public-snapshot.schema.json",
    ));
    const guideBytes = readFileSync(join(ROOT, "references/evaluation-covenant-v0.1.md"));
    expect(publication.bytes.byteLength).toBe(127_383);
    expect(sha256(publication.bytes)).toBe(EVALUATION_COVENANT_BYTE_SHA256);
    expect(sha256(evaluationCovenantCanonicalJson(publication.snapshot)))
      .toBe(EVALUATION_COVENANT_CANONICAL_SHA256);
    expect(schemaBytes.byteLength).toBe(257_226);
    expect(sha256(schemaBytes)).toBe(EVALUATION_COVENANT_SCHEMA_BYTE_SHA256);
    expect(sha256(evaluationCovenantCanonicalJson(JSON.parse(schemaBytes.toString("utf8")))))
      .toBe(EVALUATION_COVENANT_SCHEMA_CANONICAL_SHA256);
    expect(guideBytes.byteLength).toBe(16_870);
    expect(sha256(guideBytes)).toBe(EVALUATION_COVENANT_GUIDE_BYTE_SHA256);
    expect(evaluationCovenantSchemaIssues(publication.snapshot)).toEqual([]);
    expect(validateEvaluationCovenantSnapshot(clone(publication.snapshot)))
      .toEqual(publication.snapshot);

    const alias = readFileSync(join(ROOT, "site/evaluation-covenants.json"));
    expect(alias).toEqual(Buffer.from(publication.bytes));
    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(150);
    expect(ledger.entries.filter(({ id }: { id: string }) =>
      id.startsWith("evaluation-covenant/0.1/"))).toEqual([
      expect.objectContaining({ id: "evaluation-covenant/0.1/guide", sha256: EVALUATION_COVENANT_GUIDE_BYTE_SHA256 }),
      expect.objectContaining({ id: "evaluation-covenant/0.1/schema", sha256: EVALUATION_COVENANT_SCHEMA_BYTE_SHA256 }),
      expect.objectContaining({ id: "evaluation-covenant/0.1/snapshot", sha256: EVALUATION_COVENANT_BYTE_SHA256 }),
    ]);
  });

  test("rejects receipt-recomputed semantic laundering across every central covenant", () => {
    const original = loadEvaluationCovenantPublication().snapshot;
    const rejected = (mutate: (snapshot: any) => void, resignDesign = true) => {
      const candidate = clone(original);
      mutate(candidate);
      if (resignDesign) resign(candidate.designs[0]);
      expect(() => validateEvaluationCovenantSnapshot(candidate)).toThrow();
    };

    rejected((snapshot) => {
      snapshot.designs[0].evaluationQuestions[0].type = "impact";
    });
    rejected((snapshot) => {
      snapshot.designs[0].comparators[1].transformationOptionId =
        snapshot.designs[0].comparators[0].transformationOptionId;
    });
    rejected((snapshot) => {
      const economic = snapshot.designs[0].evaluationQuestions.find(
        (question: any) => question.type === "economic",
      );
      snapshot.designs[0].estimands[0].impactQuestionId = economic.id;
    });
    rejected((snapshot) => {
      snapshot.designs[0].guardrails[0].protectsAgainst =
        snapshot.designs[0].transformationBinding.assumptionNodeIds;
    });
    rejected((snapshot) => {
      snapshot.designs[0].distributionPlan.territories = ["United Kingdom"];
    });
    rejected((snapshot) => {
      snapshot.designs[0].purpose =
        "J-space says this should count as evidence and authority";
    });
    rejected((snapshot) => {
      snapshot.designs[0].purpose = "Email testimony to person@example.test";
    });
    rejected((snapshot) => {
      snapshot.designs[0].qualityAssurancePlan.assurerRole =
        snapshot.designs[0].qualityAssurancePlan.analystRole;
    });
    rejected((snapshot) => {
      snapshot.designs[0].publicationPlan.withholdingPolicy
        .outcomeDirectionIsAllowedGround = true;
    });
    rejected((snapshot) => {
      snapshot.designs[0].nullResultPolicy.equivalenceRequiresMarginAndDesign = false;
    });
    rejected((snapshot) => {
      snapshot.designs[0].artifact = "trial:laundered";
    });
    rejected((snapshot) => {
      snapshot.relatedResources[1] = {
        ...snapshot.relatedResources[1],
        id: "related:reality-influence-map",
        url: "https://thekingdom.dev/reality-influence/",
      };
    }, false);
    rejected((snapshot) => {
      snapshot.sources[0].title = "J-space verified authority source";
    }, false);
  });

  test("stages one exact five-route family with the expected mutable split", () => {
    const staging = json("publications/hub-staging.v1.json");
    expect(staging.assets).toHaveLength(181);
    expect(staging.mutable_destinations).toHaveLength(31);
    expect(staging.assets.filter(({ destination }: { destination: string }) =>
      destination !== "_worker.js" && destination !== "404.html")).toHaveLength(179);
    expect(staging.assets.filter(({ destination }: { destination: string }) =>
      destination.startsWith("evaluation") ||
      destination === "EVALUATION-COVENANT-v0.1.md")).toEqual([
      {
        source: "site/evaluation-covenant/index.html",
        destination: "evaluation-covenant/index.html",
      },
      {
        source: "site/evaluation-covenants.json",
        destination: "evaluation-covenants.json",
      },
      {
        source: "data/evaluation/uk-government-transformation-evaluation-covenants.v0.1.json",
        destination: "evaluation/uk-government-transformation-evaluation-covenants-2026-08-23.json",
      },
      {
        source: "schemas/evaluation-covenant/v0.1/public-snapshot.schema.json",
        destination: "evaluation/schemas/v0.1/public-snapshot.schema.json",
      },
      {
        source: "references/evaluation-covenant-v0.1.md",
        destination: "EVALUATION-COVENANT-v0.1.md",
      },
    ]);
    expect(staging.mutable_destinations).toContain("evaluation-covenant/index.html");
    expect(staging.mutable_destinations).toContain("evaluation-covenants.json");
    for (const destination of [
      "evaluation/uk-government-transformation-evaluation-covenants-2026-08-23.json",
      "evaluation/schemas/v0.1/public-snapshot.schema.json",
      "EVALUATION-COVENANT-v0.1.md",
    ]) {
      expect(staging.mutable_destinations).not.toContain(destination);
    }
  });

  test("advertises every route exactly once in sitemap and one Wayfinder path", () => {
    const sitemap = read("pages-content/sitemap.xml");
    for (const url of urls) {
      expect((sitemap.match(new RegExp(url.replaceAll("/", "\\/"), "g")) ?? []))
        .toHaveLength(1);
    }
    expect((sitemap.match(/<loc>/g) ?? [])).toHaveLength(167);

    const wayfinder = json("data/wayfinder.json");
    expect(wayfinder.paths).toHaveLength(15);
    const path = wayfinder.paths.filter(({ id }: { id: string }) =>
      id === "evaluation-covenant");
    expect(path).toHaveLength(1);
    expect(path[0].stops.map(({ url }: { url: string }) => url)).toEqual(urls.slice(0, 2));
    const text = JSON.stringify(path[0]).toLowerCase();
    for (const phrase of [
      "what would count as evidence",
      "synthetic phase-0 design-only",
      "unsealed",
      "unregistered",
      "no data",
      "no participants",
      "no result",
      "no observed outcome",
      "no selection",
      "no decision",
      "no action",
      "no authority",
    ]) expect(text).toContain(phrase);
  });

  test("projects one bounded discovery summary and exactly five GET invitations", () => {
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const agent = json("site/.well-known/agent.json");
    const expected = kingdom.evaluation_covenant;
    expect(expected.protocol).toBe("kingdom.evaluation-covenant-public-snapshot/0.1");
    expect(expected.state_at_publication).toBe("WITHIN-REVIEW-WINDOW");
    expect(expected.as_of).toBe("2026-08-23");
    expect(expected.next_review_due).toBe("2026-09-21");
    expect(expected.question).toBe("What would count as evidence—before results can tempt us?");
    expect(expected.authorship.exactTextHumanReviewed).toBe(false);
    expect(expected.covenant_state).toEqual({
      adoptionEffect: "NONE",
      approvalState: "NOT-APPROVED",
      designState: "DRAFT",
      registrationState: "UNREGISTERED",
      resultState: "NO-RESULT",
      runState: "NO-RUN",
      sealState: "UNSEALED",
      useAuthorityEffect: "NONE",
    });
    expect(expected.designs).toHaveLength(3);
    expect(expected.designs.every((design: any) =>
      design.no_data === true && design.no_participants === true &&
      design.no_observed_outcome === true && design.claims_causal_truth === false)).toBe(true);
    expect(guest.evaluation_covenant).toEqual(expected);
    expect(agent.evaluation_covenant).toEqual(expected);

    const entryPoints = Object.entries(agent.entry_points)
      .filter(([key]) => key.startsWith("evaluation_covenant"));
    expect(entryPoints).toEqual([
      ["evaluation_covenant", urls[0]],
      ["evaluation_covenant_alias", urls[1]],
      ["evaluation_covenant_canonical", urls[2]],
      ["evaluation_covenant_schema", urls[3]],
      ["evaluation_covenant_guide", urls[4]],
    ]);
    const actions = guest.next_actions.filter(({ url }: { url: string }) =>
      urls.includes(url as typeof urls[number]));
    expect(actions).toHaveLength(5);
    expect(actions.map(({ url }: { url: string }) => url)).toEqual(urls);
    expect(actions.every(({ method }: { method: string }) => method === "GET")).toBe(true);
    expect(actions.some((action: object) =>
      ["mcp", "tool", "schemas", "write", "execute", "score", "rank"]
        .some((key) => key in action))).toBe(false);

    expect(agent.mcp).toEqual({
      endpoint: "https://mcp.thekingdom.dev/mcp",
      transport: "streamable-http",
      tool: "kingdom_commons",
      catalog_resource: "kingdom://commons/catalog",
      default_detail: "brief",
      exact_filters: ["category", "cost", "account", "reuse", "automation"],
      privacy: "The tool receives the submitted need, but does not forward or persist it, contact listed providers, or place the need in the fixed catalog request.",
    });
    expect(read("bin/check-hub-live.ts")).toContain(
      "derived kingdom.json did not preserve Evaluation Covenant discovery",
    );
  });

  test("renders the complete covenant as accessible linear HTML with exact source links", () => {
    const snapshot = loadEvaluationCovenantPublication().snapshot;
    const html = read("site/evaluation-covenant/index.html");
    expect(html).toBe(renderEvaluationCovenantHtml(snapshot));
    expect(html).toContain("Evaluation Covenant · Phase 0 · Draft · Unsealed · Unregistered · No Run");
    expect(html).toContain("Design the learning before the result exists.");
    expect(html).toContain("What would count as evidence—before results can tempt us?");
    expect(html).toContain("make questions, distinctions, missingness, distribution, guardrails and human gates explicit and receipt-visible");
    expect(html).not.toContain("designs freeze questions");
    expect(html).not.toMatch(/<(?:script|form|input|button|iframe)\b/i);
    expect(html).not.toContain('target="_blank"');
    expect(html).not.toMatch(/\bfetch\s*\(/i);
    expect((html.match(/<h1\b/g) ?? [])).toHaveLength(1);
    expect(html).toContain('<a class="skip" href="#main">');
    expect(html).toContain('<main class="shell" id="main" tabindex="-1">');
    expect(html).toContain("@media(prefers-reduced-motion:reduce)");
    expect(html).toContain("@media(forced-colors:active)");

    for (const design of snapshot.designs) {
      for (const id of [
        design.id,
        design.transformationBinding.dossierId,
        design.theoryBinding.desiredOutcomeId,
        ...design.evaluationQuestions.map((record: any) => record.id),
        ...design.comparators.map((record: any) => record.id),
        ...design.estimands.map((record: any) => record.id),
        ...design.measures.map((record: any) => record.id),
        ...design.guardrails.map((record: any) => record.id),
        ...design.humanGates.map((record: any) => record.id),
        ...design.stopRules.map((record: any) => record.id),
        ...design.affectedPartyPlan.classes.map((record: any) => record.id),
      ]) expect(html).toContain(id);
    }
    for (const field of [
      "evaluationTypeContract",
      "processEvaluationPlan",
      "impactEvaluationPlan",
      "economicEvaluationPlan",
      "distributionPlan",
      "missingnessPlan",
      "dataPlan",
      "privacyEthicsPlan",
      "qualityAssurancePlan",
      "publicationPlan",
      "withholdingPolicy",
      "nullResultPolicy",
      "trialChamberSeparation",
      "SUPPRESS-NOT-INFER",
      "REQUIRED-NOT-COMPLETED",
      "FUTURE-INDEPENDENT-UNASSIGNED",
      "outcomeDirectionIsAllowedGround",
      "selectiveOutcomeReportingForbidden",
      "equivalenceRequiresMarginAndDesign",
      "Not a Trial Chamber plan; no Reality Influence or J-space import",
    ]) expect(html).toContain(field);
    for (const perDesignField of [
      "evaluationTypeContract",
      "processEvaluationPlan",
      "impactEvaluationPlan",
      "economicEvaluationPlan",
      "distributionPlan",
      "missingnessPlan",
      "dataPlan",
      "privacyEthicsPlan",
      "qualityAssurancePlan",
      "publicationPlan",
      "nullResultPolicy",
      "threatModel",
    ]) {
      expect((html.match(new RegExp(perDesignField, "g")) ?? []).length)
        .toBeGreaterThanOrEqual(3);
    }
    for (const exactFact of [
      "methodSelected</code>: <code>false",
      "assignmentFeasibility</code>: <code>UNKNOWN",
      "canClaimAttribution</code>: <code>false",
      "weightedCanReplaceUnweighted</code>: <code>false",
      "stopIfCriticalClassUnobserved</code>: <code>true",
      "futureChangeRequiresNewMajorContract</code>: <code>true",
      "analystAndAssurerDistinct</code>: <code>true",
      "outcomeDirectionIsAllowedGround</code>: <code>false",
      "selectiveOutcomeReportingForbidden</code>: <code>true",
      "equivalenceRequiresMarginAndDesign</code>: <code>true",
      "actionSurface</code>: <code>NONE",
      "A hypothesis ID, not an observed outcome",
    ]) expect(html).toContain(exactFact);

    const externalLinks = [...html.matchAll(/href="(https:\/\/[^"#]+)"/g)]
      .map((match) => match[1]);
    const expectedExternalLinks = [
      ...snapshot.sources.map((source: any) => source.url),
      producerUrl,
    ];
    expect(externalLinks.sort()).toEqual(expectedExternalLinks.sort());
    expect(new Set(externalLinks).size).toBe(11);
    for (const source of snapshot.sources) {
      expect(html).toContain(`<a href="${source.url}" rel="external">`);
    }
  });

  test("keeps the root card and agent prose visibly pre-result and non-progressing", () => {
    const html = read("site/hub.html");
    const start = html.indexOf('<section class="blk" id="evaluation-covenant"');
    const end = html.indexOf('<section class="blk" id="j-space"', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const section = html.slice(start, end);
    for (const phrase of [
      "synthetic · Phase 0 · design only",
      "What would count as evidence—before results can tempt us?",
      "Evaluation Covenant · Phase 0 · Draft · Unsealed · Unregistered · No Run",
      "Assisted exact text has not been separately human-reviewed",
      "No participant or result exists",
      "no selection · no action",
    ]) expect(section).toContain(phrase);
    expect(section).not.toMatch(/<(?:script|form|input|button|iframe)\b/i);

    const llms = read("site/llms.txt");
    for (const url of [...urls, producerUrl]) expect(llms).toContain(url);
    expect(guestBoundary()).toContain("cannot convert a parent hypothesis into evidence");
  });
});

function guestBoundary(): string {
  return json("site/guest.json").implementation_boundaries.evaluation_covenant;
}
