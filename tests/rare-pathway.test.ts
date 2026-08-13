import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RARE_PATHWAY_DIGEST,
  RARE_PATHWAY_DOCUMENT_URL,
  RARE_PATHWAY_ID,
  RARE_PATHWAY_PATH,
  RARE_PATHWAY_PROTOCOL,
  RARE_PATHWAY_SCHEMA_URL,
  RARE_PATHWAY_URL,
  competingRace,
  loadRarePathwayChallenge,
  piecewiseCompetingRace,
  rarePathwayDigest,
  rarePathwayPublicDiscovery,
  requiredTargetRate,
  verifyRarePathwayChallenge,
  zeroEventUpperRate,
  zeroWinnerUpperProbability,
} from "../bin/rare-pathway.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const temporary: string[] = [];

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop()!, { recursive: true, force: true });
});

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "rare-pathway-test."));
  temporary.push(root);
  return root;
}

function authored(): any {
  return JSON.parse(readFileSync(RARE_PATHWAY_PATH, "utf8"));
}

function codes(value: unknown): string[] {
  return verifyRarePathwayChallenge(value).map((issue) => issue.code);
}

function cli(...args: string[]) {
  return Bun.spawnSync(["bun", "bin/rare-pathway.ts", ...args], { cwd: ROOT });
}

describe("The Vanishing Path mathematics", () => {
  test("partitions the constant two-path race stably", () => {
    const result = competingRace(0.02, 0.18, 10);
    expect(result.no_event).toBeCloseTo(Math.exp(-2), 14);
    expect(result.target_first).toBeCloseTo(0.08646647167633873, 14);
    expect(result.competitor_first).toBeCloseTo(0.7781982450870486, 14);
    expect(result.target_given_event).toBeCloseTo(0.1, 14);
    expect(result.no_event + result.target_first + result.competitor_first).toBeCloseTo(1, 14);

    expect(competingRace(0, 0, 10)).toMatchObject({
      no_event: 1,
      target_first: 0,
      competitor_first: 0,
      target_given_event: null,
    });
    expect(competingRace(2, 3, 0)).toMatchObject({
      no_event: 1,
      target_first: 0,
      competitor_first: 0,
      target_given_event: null,
    });
    expect(competingRace(1, 0, 40).no_event).toBe(Math.exp(-40));
    const maximal = competingRace(Number.MAX_VALUE, Number.MAX_VALUE, 1);
    expect(maximal).toMatchObject({ no_event: 0, target_first: 0.5, competitor_first: 0.5 });
  });

  test("carries survival correctly through piecewise cause-specific hazards", () => {
    const constant = competingRace(0.02, 0.18, 10);
    const onePhase = piecewiseCompetingRace([{ targetRate: 0.02, competitorRate: 0.18, duration: 10 }]);
    expect(onePhase.no_event).toBeCloseTo(constant.no_event, 14);
    expect(onePhase.target_first).toBeCloseTo(constant.target_first, 14);
    expect(onePhase.competitor_first).toBeCloseTo(constant.competitor_first, 14);

    const changing = piecewiseCompetingRace([
      { targetRate: 0, competitorRate: 0, duration: 2 },
      { targetRate: 0.3, competitorRate: 0.1, duration: 8 },
    ]);
    expect(changing.horizon).toBe(10);
    expect(changing.no_event + changing.target_first + changing.competitor_first).toBeCloseTo(1, 14);
    expect(changing.target_first / (1 - changing.no_event)).toBeCloseTo(0.75, 14);
  });

  test("distinguishes a zero-event rate bound from a zero-winner probability bound", () => {
    expect(zeroEventUpperRate(200, 0.95)).toBeCloseTo(0.014978661367769954, 14);
    expect(zeroEventUpperRate(40, 0.95)).toBeCloseTo(0.07489330683884977, 14);
    expect(zeroWinnerUpperProbability(30, 0.95)).toBeCloseTo(0.09503385285530411, 14);
    expect(() => zeroEventUpperRate(Number.MIN_VALUE, 0.95)).toThrow("rescale exposure units");
    expect(() => zeroWinnerUpperProbability(Number.MAX_SAFE_INTEGER, Number.MIN_VALUE)).toThrow("numerical range");
  });

  test("finds the minimum abstract target rate without inventing an intervention", () => {
    const rate = requiredTargetRate(0.18, 10, 0.5);
    expect(rate).toBeCloseTo(0.1894207112928423, 13);
    expect(competingRace(rate, 0.18, 10).target_first).toBeGreaterThanOrEqual(0.5);
    expect(requiredTargetRate(0, 10, 0.5)).toBeCloseTo(Math.log(2) / 10, 13);
    expect(requiredTargetRate(0, 1, 1e-100)).toBe(-Math.log1p(-1e-100));
    const tiny = requiredTargetRate(1, 1, 1e-100);
    expect(competingRace(tiny, 1, 1).target_first / 1e-100).toBeCloseTo(1, 13);
    expect(() => requiredTargetRate(1, 1, Number.MIN_VALUE)).toThrow("stable numerical range");
  });

  test("rejects non-finite, negative, zero-exposure, invalid-probability, and invalid-batch inputs", () => {
    expect(() => competingRace(-1, 1, 1)).toThrow("nonnegative");
    expect(() => competingRace(Number.POSITIVE_INFINITY, 1, 1)).toThrow("finite");
    expect(() => piecewiseCompetingRace([])).toThrow("between one and 10000");
    expect(() => zeroEventUpperRate(0, 0.95)).toThrow("positive");
    expect(() => zeroEventUpperRate(1, 1)).toThrow("strictly between");
    expect(() => zeroWinnerUpperProbability(1.5, 0.95)).toThrow("positive safe integer");
    expect(() => requiredTargetRate(1, 0, 0.5)).toThrow("positive");
  });
});

describe("The Vanishing Path record and boundaries", () => {
  test("loads the reviewed digest-bound challenge", () => {
    const value = loadRarePathwayChallenge();
    expect(verifyRarePathwayChallenge(value)).toEqual([]);
    expect(value).toMatchObject({
      protocol: RARE_PATHWAY_PROTOCOL,
      challenge_id: RARE_PATHWAY_ID,
      evidence_through: "2024-06-20",
      binding: {
        case_id: "ritonavir-disappearing-polymorph-2026-08-11",
        relation: "illustrative-history-not-rate-fit",
        mutated: false,
        authority_imported: false,
      },
      integrity: { digest: RARE_PATHWAY_DIGEST },
    });
    expect(rarePathwayDigest(value)).toBe(RARE_PATHWAY_DIGEST);
    expect(value.models).toHaveLength(7);
    expect(value.sources).toHaveLength(11);
    expect(value.worked_examples.every((example: any) => example.hypothetical)).toBe(true);
  });

  test("keeps possible, accessible, occurred, and detected distinct", () => {
    const states = loadRarePathwayChallenge().states;
    expect(states.map((state: any) => state.id)).toEqual(["possible", "accessible", "occurred", "detected"]);
    expect(states.find((state: any) => state.id === "detected").does_not_imply).toContain("literal extinction");
  });

  test("gates artifacts and practices without diagnosing private motive", () => {
    const gate = loadRarePathwayChallenge().constructive_gate;
    expect(gate.outcomes.map((outcome: any) => outcome.id)).toEqual(["BUILD", "PLAY", "REVISE", "STOP"]);
    expect(gate).toMatchObject({
      not_a_score: true,
      prestige_is_not_evidence_of_benefit: true,
      play_is_valid: true,
      refusal_requires_reason: false,
    });
    expect(gate.rule).toContain("never the person's inner motive");
  });

  test("keeps the WAKE crossover as a revalidated reference without state writes", () => {
    const seam = loadRarePathwayChallenge().wake_seam;
    expect(seam).toMatchObject({
      mode: "orientation-by-reference-not-continuity-proof",
      inherits_identity: false,
      proves_continuity: false,
      grants_authority: false,
      proves_currentness: false,
      writes_wake: false,
      writes_agenttool: false,
    });
    expect(seam.carry_fields).toContain("declared_inputs_and_units");
    expect(seam.revalidate).toHaveLength(7);
  });

  test("projects compact public discovery without a score, matcher, MCP, or write path", () => {
    const discovery = rarePathwayPublicDiscovery();
    expect(discovery).toMatchObject({
      protocol: RARE_PATHWAY_PROTOCOL,
      challenge_id: RARE_PATHWAY_ID,
      url: RARE_PATHWAY_URL,
      schema: RARE_PATHWAY_SCHEMA_URL,
      guide: RARE_PATHWAY_DOCUMENT_URL,
      cli: "kingdom rare-pathway",
      integrity: { digest: RARE_PATHWAY_DIGEST },
      boundary: {
        public_surface_read_only: true,
        examples_hypothetical: true,
        ritonavir_rate_fit: false,
        motive_inference: false,
        person_score: false,
        writes_wake: false,
        writes_agenttool: false,
        automatic_action: false,
      },
    });
    for (const key of ["mcp", "matcher", "write", "execute", "score", "rank", "recommend"]) {
      expect(discovery).not.toHaveProperty(key);
    }
  });

  test("rejects tampering even when the replacement self-signs", () => {
    const value = authored();
    value.scope.purpose += " changed";
    expect(codes(value)).toContain("digest-mismatch");
    value.integrity.digest = rarePathwayDigest(value);
    expect(codes(value)).toContain("reviewed-digest-mismatch");
  });

  test("refuses duplicate-key, symlink, and oversized files before semantic interpretation", () => {
    const root = fixture();
    const duplicate = join(root, "duplicate.json");
    const source = readFileSync(RARE_PATHWAY_PATH, "utf8");
    writeFileSync(duplicate, source.replace(
      '  "protocol": "kingdom.rare-pathway-challenge/0.1",',
      '  "protocol": "kingdom.rare-pathway-challenge/0.1",\n  "protocol": "kingdom.rare-pathway-challenge/0.1",',
    ));
    const duplicateResult = cli("verify", duplicate, "--json");
    expect(duplicateResult.exitCode).toBe(1);
    expect(duplicateResult.stdout.toString()).toContain("duplicate key");

    const link = join(root, "link.json");
    symlinkSync(RARE_PATHWAY_PATH, link);
    const linkResult = cli("verify", link, "--json");
    expect(linkResult.exitCode).toBe(1);
    expect(linkResult.stdout.toString()).toContain("regular non-symlink");

    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, " ".repeat(1024 * 1024 + 1));
    const oversizedResult = cli("verify", oversized, "--json");
    expect(oversizedResult.exitCode).toBe(1);
    expect(oversizedResult.stdout.toString()).toContain("exceeds 1048576 bytes");
  });

  test("CLI states the correct inference and authority boundary", () => {
    const absence = cli("absence", "200", "0.95", "--json");
    expect(absence.exitCode).toBe(0);
    expect(JSON.parse(absence.stdout.toString())).toMatchObject({
      model: "zero-event-upper-bound",
      upper_rate: 0.01497866136776995,
      does_not_establish: ["zero rate", "literal extinction", "mechanism"],
    });
    const winner = cli("winner-bound", "30", "0.95", "--json");
    expect(JSON.parse(winner.stdout.toString())).toMatchObject({
      model: "zero-winner-binomial-bound",
      upper_target_win_probability: 0.09503385285530411,
    });
    const restoration = cli("restore", "0.18", "10", "0.5", "--json");
    expect(JSON.parse(restoration.stdout.toString()).boundary).toContain("not a solvent");
  });
});
