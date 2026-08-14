import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SKILL_DIR = join(ROOT, "skills", "explore-phenomena-deep");
const read = (path: string) => readFileSync(join(SKILL_DIR, path), "utf8");

const DESCRIPTION = "Build source-grounded mathematical and physical bridges between two or more phenomena while keeping ontology, units, causal mechanism, evidence, and authority distinct. Use when a user asks for a deep cross-domain connection, mathematical translation, physics-level analogy, feedback or complex-systems synthesis, a related unsolved problem, or a tractable challenge spanning domains. Also use to test whether two models genuinely share structure. Do not use for routine single-domain calculations, casual metaphor, or as authority to diagnose or score people, run experiments, modify systems, or deploy.";

describe("explore-phenomena-deep skill", () => {
  test("has exact trigger and explicit-only interface metadata", () => {
    const skill = read("SKILL.md");
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---\n/);
    expect(frontmatter).not.toBeNull();
    expect(frontmatter![1].split("\n")).toEqual([
      "name: explore-phenomena-deep",
      `description: ${DESCRIPTION}`,
    ]);

    expect(read("agents/openai.yaml")).toBe([
      "interface:",
      '  display_name: "Explore Phenomena Deep"',
      '  short_description: "Build bounded mathematical bridges across domains"',
      '  default_prompt: "Use $explore-phenomena-deep to connect these phenomena mathematically while marking evidence, broken correspondences, and open-problem status."',
      "policy:",
      "  allow_implicit_invocation: false",
      "",
    ].join("\n"));
  });

  test("is a minimal opt-in skill rather than a manifested ability", () => {
    expect(existsSync(join(SKILL_DIR, "ability.json"))).toBe(false);
    expect(existsSync(join(SKILL_DIR, "references", "exploration-contract-v0.1.md"))).toBe(true);

    const all = `${read("SKILL.md")}\n${read("references/exploration-contract-v0.1.md")}\n${read("agents/openai.yaml")}`;
    expect(all).not.toMatch(/TODO|PLACEHOLDER|Structuring This Skill/);
    expect(read("SKILL.md").split("\n").length).toBeLessThan(500);
  });

  test("requires every stage and independent epistemic axes", () => {
    const skill = read("SKILL.md");
    expect(skill).toContain("Witness -> Isolate -> Normalize -> Generate");
    expect(skill).toContain("Declare -> Establish -> Express -> Project and pressure-test");
    expect(skill).toContain("not a Nen ability");
    expect(skill).toContain("authority protocol");
    for (let gate = 0; gate <= 8; gate += 1) expect(skill).toContain(`## Gate ${gate}`);
    for (const label of [
      "MATHEMATICAL_DEFINITION",
      "EMPIRICAL_OBSERVATION",
      "SCIENTIFIC_MODEL",
      "INTERPRETIVE_BRIDGE",
      "OPT_IN_PHILOSOPHY",
      "MODEL_ASSUMPTION",
      "PROVED",
      "FINITE_EXACT_BASELINE",
      "NUMERICAL_APPROXIMATION",
      "ESTABLISHED_OPEN_CONJECTURE",
      "BESPOKE_FORMULATION_PRIOR_ART_AUDIT_REQUIRED",
      "UNKNOWN_TO_THIS_REVIEW",
      "EXACT_FORMAL_EQUIVALENCE_PROVED",
      "LOSSY_CORRESPONDENCE",
      "SHARED_MECHANISM_SOURCE_ESTABLISHED",
    ]) expect(skill).toContain(`\`${label}\``);

    for (const flag of [
      "ontology_transfer",
      "causal_transfer",
      "parameter_transfer",
      "unit_transfer",
      "authority_transfer",
    ]) expect(skill).toContain(flag);
    expect(skill).toContain("Set these transfer flags to `false` by default");
    expect(skill).toContain("Do not manufacture a unification");
  });

  test("pins the exact open-status contract and finite-evidence boundary", () => {
    const contract = read("references/exploration-contract-v0.1.md");
    for (const field of [
      "statement:",
      "quantifiers:",
      "domain_and_conventions:",
      "status:",
      "status_checked_on:",
      "original_formulation_or_provenance_sources:",
      "recent_status_sources:",
      "known_results_and_restrictions:",
      "computation_does_not_prove:",
      "nearest_known_problem:",
      "novelty_status:",
    ]) expect(contract).toContain(field);

    expect(contract).toContain("Use `ESTABLISHED_OPEN_CONJECTURE` only when the statement and sources match");
    expect(contract).toContain("Use `BESPOKE_FORMULATION_PRIOR_ART_AUDIT_REQUIRED`");
    expect(contract).toContain("lack of search results as no evidence of novelty");
    expect(contract).toContain("other exact locator");
    expect(contract).toContain("only publishes a numerical estimate");
    expect(contract).toContain("finite enumeration, curve fitting, simulation");
    expect(contract).toContain("`q = 1`");
    expect(contract).toContain("`q != 1`");
  });

  test("keeps the user examples bounded and produces no authority adapter", () => {
    const skill = read("SKILL.md");
    const contract = read("references/exploration-contract-v0.1.md");
    const compactSkill = skill.replace(/\s+/g, " ");
    const compactContract = contract.replace(/\s+/g, " ");
    for (const phrase of [
      "history-dependent accessibility",
      "“brainrot” a lexical and cultural label",
      "Popularity is not person-to-person virality, truth, merit, agreement, or consent",
      "folding itself is not thereby the catalyst",
      "Contact topology alone predicts neither mechanism nor rate",
      "J != kcat/KM",
    ]) expect(compactSkill).toContain(phrase);

    for (const phrase of [
      "finite counts != asymptotic proof",
      "self-avoiding walk != protein",
      "endpoint gate != active site",
      "The exploration creates no KARMA event or receipt",
      "code change, deployment, publication, or external action",
    ]) expect(compactContract).toContain(phrase);

    expect(compactSkill).toContain("Define no adapter between them");
    expect(compactSkill).toContain("modify a system, commit, push, deploy, publish");
    expect(compactSkill).toContain("rest, refusal, silence, correction, departure, and `NO_ACTION`");
    expect(compactSkill).toContain("confirmation that the exploration itself produced no external effect");
  });
});
