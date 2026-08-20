import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  TRIAL_CHAMBER_ALIAS_URL,
  TRIAL_CHAMBER_BOUNDARY,
  TRIAL_CHAMBER_CANONICAL_URL,
  TRIAL_CHAMBER_GUIDE_URL,
  TRIAL_CHAMBER_PRODUCER_URL,
  TRIAL_CHAMBER_PROTOCOL,
  TRIAL_CHAMBER_SCHEMA_LOCATORS,
  TRIAL_CHAMBER_SCHEMA_NAMES,
  TRIAL_CHAMBER_SCHEMA_URLS,
  TRIAL_CHAMBER_URL,
  loadTrialChamberPublication,
  parseTrialChamberSnapshotBytes,
  renderTrialChamberHtml,
  trialChamberPublicSummary,
  trialChamberSchemaIssues,
  validateTrialChamberSnapshot,
} from "../bin/trial-chamber.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

describe("Trial Chamber Phase-0 publication boundary", () => {
  test("declares the human page, mutable alias, immutable snapshot, guide, and ten schemas", () => {
    expect(TRIAL_CHAMBER_PROTOCOL).toBe("kingdom.trial-chamber-publication/0.1");
    expect(TRIAL_CHAMBER_URL).toBe("https://thekingdom.dev/trial-chamber/");
    expect(TRIAL_CHAMBER_ALIAS_URL).toBe("https://thekingdom.dev/trials.json");
    expect(TRIAL_CHAMBER_CANONICAL_URL)
      .toBe("https://thekingdom.dev/trials/research-trial-chamber-2026-08-20.json");
    expect(TRIAL_CHAMBER_GUIDE_URL).toBe("https://thekingdom.dev/TRIAL-CHAMBER-v0.1.md");
    expect(TRIAL_CHAMBER_PRODUCER_URL).toBe("https://github.com/cambridgetcg/kingdom-trials/tree/v0.1.1");
    expect(TRIAL_CHAMBER_SCHEMA_NAMES).toEqual([
      "public-snapshot", "referral", "evaluation-request", "evaluation-plan", "preflight",
      "trial-authority", "trial-run", "evaluation-result", "adoption-record", "use-authority",
    ]);
    expect(Object.values(TRIAL_CHAMBER_SCHEMA_URLS)).toEqual(TRIAL_CHAMBER_SCHEMA_NAMES.map((name) =>
      `https://thekingdom.dev/trials/schemas/v0.1/${name}.schema.json`));
  });

  test("loads one exact Phase-0 projection and validates every schema identity", () => {
    const publication = loadTrialChamberPublication();
    expect(publication.snapshot.schema).toBe("kingdom.trial-public-snapshot/0.1");
    expect(publication.snapshot.counts).toEqual({
      referrals: 4,
      evaluationRequests: 3,
      evaluationPlans: 3,
      preflights: 0,
      trialAuthorities: 0,
      trialRuns: 0,
      evaluationResults: 0,
      adoptionRecords: 0,
      useAuthorities: 0,
    });
    expect(Buffer.from(publication.bytes)).toEqual(readFileSync(join(ROOT, "site/trials.json")));
    expect(Buffer.from(publication.bytes)).toEqual(
      readFileSync(join(ROOT, "data/trials/research-trial-chamber.v0.1.json")),
    );
    for (const name of TRIAL_CHAMBER_SCHEMA_NAMES) {
      expect(json(TRIAL_CHAMBER_SCHEMA_LOCATORS[name]).$id).toBe(TRIAL_CHAMBER_SCHEMA_URLS[name]);
    }
  });

  test("binds exact Observatory works, observation receipts, source records, and signals", () => {
    const snapshot = loadTrialChamberPublication().snapshot;

    const wrongTitle = structuredClone(snapshot);
    wrongTitle.referrals[0].sourceMetadataTitle = "A metadata title is not a claim <script>";
    expect(() => validateTrialChamberSnapshot(wrongTitle)).toThrow(/exactly bind its Observatory work/i);

    const wrongPayload = structuredClone(snapshot);
    wrongPayload.referrals[0].sourceBinding.observations[0].sourcePayloadReceipt = `sha256:${"0".repeat(64)}`;
    expect(() => validateTrialChamberSnapshot(wrongPayload)).toThrow(/observation details drifted/i);

    const wrongSignal = structuredClone(snapshot);
    wrongSignal.referrals[0].sourceBinding.signalIds[0] = "signal:watchlist-match:not-present";
    expect(() => validateTrialChamberSnapshot(wrongSignal)).toThrow(/signal/i);

    const droppedSignal = structuredClone(snapshot);
    droppedSignal.referrals[0].sourceBinding.signalIds.pop();
    expect(() => validateTrialChamberSnapshot(droppedSignal)).toThrow(/signal or related-work set is incomplete/i);
  });

  test("keeps assisted authorship explicit and every plan DRAFT, UNSEALED, synthetic-only, and no-run", () => {
    const snapshot = loadTrialChamberPublication().snapshot;
    expect(snapshot.evaluationRequests.every((request: any) =>
      request.requestState === "maintainer-authorized-assisted-draft" &&
      request.authorship.exactTextHumanReviewed === false &&
      request.authorship.humanDirectionRecorded === true)).toBe(true);
    expect(snapshot.evaluationPlans.every((plan: any) =>
      plan.planState === "DRAFT" && plan.sealState === "UNSEALED" && plan.noRunState === "NO-RUN" &&
      plan.inputClass === "SELF-AUTHORED-SYNTHETIC-ONLY" &&
      plan.fixtures.every((fixture: any) => fixture.synthetic === true) &&
      plan.passingEffect === "RETAIN_FOR_SEPARATE_REVIEW_ONLY" &&
      plan.authorship.exactTextHumanReviewed === false)).toBe(true);

    const reviewed = structuredClone(snapshot);
    reviewed.evaluationRequests[0].authorship.exactTextHumanReviewed = true;
    expect(() => validateTrialChamberSnapshot(reviewed)).toThrow(/assisted request draft/i);

    const runnable = structuredClone(snapshot);
    runnable.evaluationPlans[0].resourceEnvelope.network = true;
    expect(() => validateTrialChamberSnapshot(runnable)).toThrow(/resource envelope/i);

    const realFixture = structuredClone(snapshot);
    realFixture.evaluationPlans[0].fixtures[0].synthetic = false;
    expect(() => validateTrialChamberSnapshot(realFixture)).toThrow(/synthetic-only/i);

    const impossibleLimit = structuredClone(snapshot);
    impossibleLimit.evaluationPlans[0].resourceEnvelope.maxCases = 1;
    expect(() => validateTrialChamberSnapshot(impossibleLimit)).toThrow(/resource envelope/i);
  });

  test("requires reciprocal referral, request, and plan edges with one shared question, lens, and input class", () => {
    const snapshot = loadTrialChamberPublication().snapshot;
    expect(snapshot.referrals.filter(({ disposition }: any) => disposition === "advanced-to-human-scoping")).toHaveLength(3);
    expect(snapshot.referrals.filter(({ disposition }: any) => disposition === "held-for-source-resolution")).toHaveLength(1);

    const crossWired = structuredClone(snapshot);
    const advanced = crossWired.referrals.filter(({ disposition }: any) => disposition === "advanced-to-human-scoping");
    [advanced[0].evaluationRequestId, advanced[1].evaluationRequestId] =
      [advanced[1].evaluationRequestId, advanced[0].evaluationRequestId];
    expect(() => validateTrialChamberSnapshot(crossWired)).toThrow(/chain is not reciprocal/i);

    const changedQuestion = structuredClone(snapshot);
    changedQuestion.evaluationPlans[0].evaluationQuestion = changedQuestion.evaluationRequests[1].evaluationQuestion;
    expect(() => validateTrialChamberSnapshot(changedQuestion)).toThrow(/chain is not reciprocal/i);

    const changedLens = structuredClone(snapshot);
    changedLens.evaluationPlans[0].evaluationLens = changedLens.evaluationPlans[1].evaluationLens;
    expect(() => validateTrialChamberSnapshot(changedLens)).toThrow(/chain is not reciprocal/i);

    const changedInputClass = structuredClone(snapshot);
    changedInputClass.evaluationPlans[0].inputClass = "DIFFERENT-SYNTHETIC-CLASS";
    expect(() => validateTrialChamberSnapshot(changedInputClass)).toThrow(/chain is not reciprocal/i);
  });

  test("holds Role-Styled with all six reasons and cannot represent any later gate", () => {
    const snapshot = loadTrialChamberPublication().snapshot;
    const held = snapshot.referrals.find(({ disposition }: any) => disposition === "held-for-source-resolution");
    expect(held.sourceMetadataTitle).toStartWith("Role-Styled Prompt Injection");
    expect(held.evaluationRequestId).toBeNull();
    expect(held.holdReasons).toEqual([
      "self-version-relation-unresolved",
      "supplement-target-absent-from-pinned-snapshot",
      "model-pin-absent",
      "method-pin-absent",
      "dataset-pin-absent",
      "artifact-pin-absent",
    ]);
    for (const key of [
      "preflights", "trialAuthorities", "trialRuns", "evaluationResults", "adoptionRecords", "useAuthorities",
    ]) expect(snapshot[key]).toEqual([]);
    for (const name of [
      "preflight", "trial-authority", "trial-run", "evaluation-result", "adoption-record", "use-authority",
    ]) {
      expect(json(TRIAL_CHAMBER_SCHEMA_LOCATORS[name]).not).toEqual({});
      for (const specimen of [null, false, true, 0, 1, "", "still-forbidden", [], ["still-forbidden"], {}, {
        id: "still-forbidden",
      }]) expect(trialChamberSchemaIssues(name as any, specimen)).not.toEqual([]);
    }

    const laterRecord = structuredClone(snapshot);
    laterRecord.preflights.push({ id: "not-representable" });
    laterRecord.counts.preflights = 1;
    expect(() => validateTrialChamberSnapshot(laterRecord)).toThrow(/declared counts|Phase 0|schema/i);
  });

  test("rejects expiry, authority effects, scalar scores, duplicate keys, and extra fields", () => {
    const snapshot = loadTrialChamberPublication().snapshot;

    const expiredOrder = structuredClone(snapshot);
    expiredOrder.expiresAt = expiredOrder.asOf;
    expect(() => validateTrialChamberSnapshot(expiredOrder)).toThrow(/expiry/i);

    const authority = structuredClone(snapshot);
    authority.boundaries.trialAuthorityIssued = true;
    expect(() => validateTrialChamberSnapshot(authority)).toThrow(/negative-effect boundary/i);

    const scalar = structuredClone(snapshot);
    scalar.evaluationPlans[0].score = 1;
    expect(() => validateTrialChamberSnapshot(scalar)).toThrow(/scalar|schema/i);

    const extra = structuredClone(snapshot);
    extra.instructions = "execute";
    expect(() => validateTrialChamberSnapshot(extra)).toThrow(/additional propert/i);

    const duplicate = read("data/trials/research-trial-chamber.v0.1.json")
      .replace(/^\{\n/, '{\n  "schema": "kingdom.trial-public-snapshot/0.1",\n');
    expect(() => parseTrialChamberSnapshotBytes(Buffer.from(duplicate))).toThrow(/duplicate/i);

    const invalidCalendarDate = structuredClone(snapshot);
    invalidCalendarDate.evaluationRequests[0].authoredOn = "2026-02-30";
    expect(() => validateTrialChamberSnapshot(invalidCalendarDate)).toThrow(/date format/i);

    const malformedUriReferral = structuredClone(snapshot.referrals[0]);
    malformedUriReferral.sourceBinding.observations[0].canonicalUrl = "https://[invalid";
    expect(trialChamberSchemaIssues("referral", malformedUriReferral).join("\n")).toMatch(/uri format/i);
  });

  test("publishes an exact non-authorizing summary across mutable machine surfaces", () => {
    const snapshot = loadTrialChamberPublication().snapshot;
    const expected = trialChamberPublicSummary(snapshot);
    expect(expected.counts.referrals).toBe(4);
    expect(expected.lifecycle.snapshot_stops_after).toBe("draft-unsealed-plan");
    expect(expected.lifecycle.later_gate_contracts).toBe("deny-all-reserved-in-v0.1");
    expect(expected.boundary).toEqual(TRIAL_CHAMBER_BOUNDARY);
    expect(expected.boundary.scalar_score_used).toBe(false);
    for (const path of ["site/kingdom.json", "site/guest.json", "site/.well-known/agent.json"]) {
      expect(json(path).trial_chamber).toEqual(expected);
    }
  });

  test("renders an accessible no-script, no-control human page with all required evidence", () => {
    const html = renderTrialChamberHtml(loadTrialChamberPublication().snapshot);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('class="skip" href="#main"');
    expect(html).toContain('<main class="shell" id="main" tabindex="-1">');
    expect(html).toContain("maintainer-authorized assisted request drafts");
    expect(html).toContain("exact text has not been separately human-reviewed");
    expect(html.match(/Draft trial plan — evaluation not started/g)).toHaveLength(3);
    expect(html).toContain("Finite synthetic fixtures");
    expect(html).toContain("Retention-only criteria");
    expect(html).toContain("Resource envelope");
    expect(html).toContain("Rights, security, and reversibility");
    expect(html).toContain("Threat model");
    expect(html).toContain("Held at source resolution");
    expect(html).toContain("deny-all reserved contracts");
    expect(html).toContain(TRIAL_CHAMBER_PRODUCER_URL);
    expect(html).toContain("@media(prefers-reduced-motion:reduce)");
    expect(html).toContain("@media(forced-colors:active)");
    expect(html).not.toMatch(/<script\b|<iframe\b|<form\b|<input\b|<button\b|onclick\s*=|fetch\s*\(/i);
  });

  test("escapes hostile source, request, fixture, measure, and threat strings", () => {
    const snapshot = structuredClone(loadTrialChamberPublication().snapshot);
    snapshot.referrals[0].sourceMetadataTitle = '<img src=x onerror="evil()">';
    snapshot.evaluationRequests[0].evaluationQuestion = "</style><script>evil()</script>";
    snapshot.evaluationPlans[0].fixtures[0].description = '<iframe src="https://evil.invalid">';
    snapshot.evaluationPlans[0].measures[0].rule = '<button onclick="evil()">run</button>';
    snapshot.evaluationPlans[0].threatModel[0] = '<svg onload="evil()">';
    const html = renderTrialChamberHtml(snapshot);
    expect(html).toContain("&lt;img src=x onerror=&quot;evil()&quot;&gt;");
    expect(html).toContain("&lt;/style&gt;&lt;script&gt;evil()&lt;/script&gt;");
    expect(html).toContain("&lt;iframe src=&quot;https://evil.invalid&quot;&gt;");
    expect(html).toContain("&lt;button onclick=&quot;evil()&quot;&gt;run&lt;/button&gt;");
    expect(html).toContain("&lt;svg onload=&quot;evil()&quot;&gt;");
    expect(html).not.toMatch(/<script>evil|<iframe src="https:\/\/evil|<button onclick|<svg onload/i);
  });

  test("stages fourteen exact assets with only the page and current alias mutable", () => {
    const family = [
      { source: "site/trial-chamber/index.html", destination: "trial-chamber/index.html" },
      { source: "site/trials.json", destination: "trials.json" },
      { source: "data/trials/research-trial-chamber.v0.1.json", destination: "trials/research-trial-chamber-2026-08-20.json" },
      ...TRIAL_CHAMBER_SCHEMA_NAMES.map((name) => ({
        source: TRIAL_CHAMBER_SCHEMA_LOCATORS[name],
        destination: `trials/schemas/v0.1/${name}.schema.json`,
      })),
      { source: "references/trial-chamber-v0.1.md", destination: "TRIAL-CHAMBER-v0.1.md" },
    ];
    expect(family).toHaveLength(14);
    expect(HUB_ASSETS.filter(({ source }) => family.some((asset) => asset.source === source)))
      .toEqual(family);
    expect(MUTABLE_HUB_DESTINATIONS).toContain("trial-chamber/index.html");
    expect(MUTABLE_HUB_DESTINATIONS).toContain("trials.json");
    expect(MUTABLE_HUB_DESTINATIONS).not.toContain("trials/research-trial-chamber-2026-08-20.json");
  });
});
