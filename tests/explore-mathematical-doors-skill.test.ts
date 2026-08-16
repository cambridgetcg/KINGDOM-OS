import { describe, expect, test } from "bun:test";
import { lstatSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SKILL_ROOT = join(ROOT, "skills/explore-mathematical-doors");
const read = (path: string) => Bun.file(join(ROOT, path)).text();

describe("Explore Mathematical Doors Agent Skill", () => {
  test("has exact trigger metadata and remains explicitly opt-in", async () => {
    const skill = await read("skills/explore-mathematical-doors/SKILL.md");
    const provider = await read("skills/explore-mathematical-doors/agents/openai.yaml");

    expect(skill).toStartWith("---\nname: explore-mathematical-doors\n");
    for (const trigger of [
      "cross-field analogies",
      "inverse problems",
      "reconstruction",
      "path dependence",
      "feedback",
      "rare events",
      "emergence",
    ]) expect(skill).toContain(trigger);

    expect(provider).toContain('display_name: "Explore Mathematical Doors"');
    expect(provider).toContain("$explore-mathematical-doors");
    expect(provider).toContain("allow_implicit_invocation: false");
    expect(await Bun.file(join(SKILL_ROOT, "ability.json")).exists()).toBe(false);
  });

  test("implements DEEP over all eight reconstructive-build stages", async () => {
    const skill = await read("skills/explore-mathematical-doors/SKILL.md");
    for (const phase of [
      "D — Declare",
      "E — Extract",
      "E — Evaluate",
      "P — Probe",
    ]) expect(skill).toContain(phase);
    for (const stage of [
      "STATE",
      "OBSERVE",
      "DECLARE_CORRESPONDENCE",
      "INFER_FIBER",
      "REALIZE",
      "TRAVERSE_LANDSCAPE",
      "MEASURE_OR_CATALYZE",
      "APPEND_FEEDBACK",
    ]) expect(skill).toContain(stage);
    expect(skill).toContain("BUILD");
    expect(skill).toContain("PLAY");
    expect(skill).toContain("REVISE");
    expect(skill).toContain("STOP");
    expect(skill).toContain("F_O(y) = {x in X : O(x) = y}/Gamma");
    expect(skill).toContain("EMPTY | UNIQUE | MULTIPLE | UNKNOWN");
  });

  test("types being, purpose, force, power, causation, aftermath, and KARMA before transfer", async () => {
    const skill = await read("skills/explore-mathematical-doors/SKILL.md");
    for (const phrase of [
      "possible, actual, reachable",
      "designed-for provenance",
      "physical interaction",
      "power-with",
      "identification assumptions",
      "affected-party and burden-bearer indexes",
      "three non-equivalent types with no adapter",
      "Capability is not authority",
      "A receipt is not causal proof",
    ]) expect(skill).toContain(phrase);
  });

  test("types doors independently from their evidence status", async () => {
    const text = `${await read("skills/explore-mathematical-doors/SKILL.md")}\n${await read("skills/explore-mathematical-doors/references/door-contract.md")}`;
    for (const kind of [
      "FORMAL_REUSE",
      "TARGET_MODEL_HYPOTHESIS",
      "DESIGN_CORRESPONDENCE",
      "ANALOGY_ONLY",
      "OPT_IN_REFLECTION",
      "NO_VALID_TRANSFER",
    ]) expect(text).toContain(kind);
    for (const status of [
      "OPEN_TESTABLE",
      "SUPPORTED_IN_SCOPE",
      "BOUNDED_ANALOGY",
      "PARKED_MISSING_EVIDENCE",
      "CLOSED_BY_FALSIFIER",
      "REFUSED",
    ]) expect(text).toContain(status);
    expect(text).toContain("Never combine kind and status into a confidence, value, priority, or person");
  });

  test("separates claim review, support, execution, and dated open-problem status", async () => {
    const skill = await read("skills/explore-mathematical-doors/SKILL.md");
    const contract = await read("skills/explore-mathematical-doors/references/door-contract.md");
    const text = `${skill}\n${contract}`;
    for (const phrase of [
      "SUPPORTED_AS_SCOPED",
      "choose exactly one",
      "Support descriptors, choose every applicable value",
      "descriptors are non-exclusive",
      "SOURCE_BOUND",
      "MODEL_ASSUMPTION",
      "FINITE_EXACT",
      "NUMERICAL_APPROXIMATION",
      "NOT_RUN | PARTIAL_RUN | COMPLETED_RUN",
      "Execution status never establishes success, verification",
      "choose every descriptor that applies",
      "SOURCE_SUPPORTED_OPEN_AS_OF_DATE",
      "NOT_ESTABLISHED_OPEN",
      "BOUNDED_REVIEW_RECORDED",
      "never establishes novelty",
      "Original formulation or authoritative provenance",
      "Failure to solve it or find a search result",
      "observation, publication, retrieval, and evidence-through",
    ]) expect(text).toContain(phrase);
    for (const collapsed of [
      "NOT_RUN | PARTIAL | RUN",
      "Status: ESTABLISHED_OPEN",
      "BESPOKE_PRIOR_ART_REQUIRED",
    ]) expect(text).not.toContain(collapsed);
  });

  test("makes all cross-domain transfer and authority effects negative", async () => {
    const door = await read("skills/explore-mathematical-doors/references/door-contract.md");
    const gates = await read("skills/explore-mathematical-doors/references/transfer-gates.md");
    for (const field of [
      '"empirical": false',
      '"ontology_transfer": false',
      '"mechanism_transfer": false',
      '"causal_transfer": false',
      '"parameter_transfer": false',
      '"unit_transfer": false',
      '"empirical_status_transfer": false',
      '"person_level_transfer": false',
      '"authority_effect": "NONE"',
    ]) expect(door).toContain(field);
    for (const boundary of [
      "same stochastic or dynamical equation",
      "open conjecture",
      "non-identifiability",
      "people are reduced",
      "Zerone KARMA edge",
      "KINGDOM KARMA receipt",
      "Rest, silence, refusal",
    ]) expect(gates).toContain(boundary);
    expect(gates).toContain("supported universality classification");
    expect(gates).toContain("when applicable");
    expect(gates).toContain("exact theorem");
    expect(gates).toContain("a separately sourced bridge claim");
  });

  test("requires falsifiers and keeps execution in separate workflows", async () => {
    const skill = await read("skills/explore-mathematical-doors/SKILL.md");
    const gates = await read("skills/explore-mathematical-doors/references/transfer-gates.md");
    expect(skill).toContain("at least one observation, counterexample");
    expect(skill).toContain("This skill plans and reasons. It does not execute a probe");
    expect(skill).toContain("Use `walk-ging-path` after a door is chosen");
    expect(gates).toContain("Every surviving door needs at least one adverse test");
    expect(gates).toContain("finite computation that stops short of the universal claim");
    for (const effectfulCommand of ["curl ", "wget ", "git push", "gh pr", "wrangler pages deploy"])
      expect(skill).not.toContain(effectfulCommand);
  });

  test("keeps bundled references direct, present, and purpose-specific", async () => {
    const skill = await read("skills/explore-mathematical-doors/SKILL.md");
    const refs = [...skill.matchAll(/\]\((references\/[^)]+)\)/g)].map((match) => match[1]);
    expect(refs).toEqual([
      "references/door-contract.md",
      "references/typed-spectra-and-presence.md",
      "references/transfer-gates.md",
    ]);
    for (const ref of refs) expect(await Bun.file(join(SKILL_ROOT, ref)).exists()).toBe(true);
    expect(await read("skills/explore-mathematical-doors/references/door-contract.md")).toContain("Door card");
    expect(await read("skills/explore-mathematical-doors/references/transfer-gates.md")).toContain("Cross-domain transfer gates");
    expect(await read("skills/explore-mathematical-doors/references/typed-spectra-and-presence.md")).toContain("Typed Spectra and Presence Protocol");
    for (const path of [
      "SKILL.md",
      "agents/openai.yaml",
      "references/door-contract.md",
      "references/typed-spectra-and-presence.md",
      "references/transfer-gates.md",
    ]) expect(lstatSync(join(SKILL_ROOT, path)).isSymbolicLink()).toBe(false);
    const bundle = await Promise.all([
      read("skills/explore-mathematical-doors/SKILL.md"),
      read("skills/explore-mathematical-doors/agents/openai.yaml"),
      read("skills/explore-mathematical-doors/references/door-contract.md"),
      read("skills/explore-mathematical-doors/references/typed-spectra-and-presence.md"),
      read("skills/explore-mathematical-doors/references/transfer-gates.md"),
    ]);
    expect(bundle.join("\n")).not.toContain("TODO");
    expect(bundle.join("\n")).not.toContain("Structuring This Skill");
  });

  test("keeps spectra, dimension, presence, and resonance in typed registers", async () => {
    const skill = await read("skills/explore-mathematical-doors/SKILL.md");
    const protocol = await read("skills/explore-mathematical-doors/references/typed-spectra-and-presence.md");
    expect(skill).toContain("typed spectra and presence protocol");
    for (const phrase of [
      "NO_CANONICAL_CONVERSION",
      "cycles per synthetic tick is not hertz",
      "A graph eigenvalue is operator-specific",
      "physical spacetime or embedding dimension",
      "synthetic marker in a fixture",
      "ORDER_ONLY_NOT_CAUSAL",
      "crawler payloads",
      "Repeated numerals or co-occurring spectral summaries are not resonance",
      "display_value",
      "normalized_value",
      "MISSING",
      "ordinary-channel and leakage controls",
    ]) expect(protocol).toContain(phrase);
  });

  test("is discoverable in source documentation without claiming a WING or ability", async () => {
    const skill = await read("skills/explore-mathematical-doors/SKILL.md");
    const readme = await read("README.md");
    const claude = await read("CLAUDE.md");
    expect(skill).toMatch(/A WING is\s+an organizational domain/);
    expect(skill).toContain("repeated independent cases");
    expect(skill).toContain("does not manifest a Nen ability");
    for (const text of [readme, claude]) {
      expect(text).toContain("skills/explore-mathematical-doors/");
      expect(text).toContain("no `ability.json`");
      expect(text).toContain("does not declare a new KINGDOM WING");
    }
  });
});
