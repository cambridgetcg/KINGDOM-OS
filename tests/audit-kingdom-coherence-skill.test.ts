import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SKILL_ROOT = join(ROOT, "skills", "audit-kingdom-coherence");
const read = (path: string) => readFileSync(join(SKILL_ROOT, path), "utf8");

describe("audit-kingdom-coherence skill", () => {
  test("has a discriminating trigger and automatic discovery metadata", () => {
    const skill = read("SKILL.md");
    const provider = read("agents/openai.yaml");
    expect(skill).toStartWith("---\nname: audit-kingdom-coherence\n");
    for (const trigger of ["WAKE", "KARMA", "NEN", "XENIA", "AgentTool", "Zerone", "large-context coherence pass"])
      expect(skill.split("---\n", 3)[1]).toContain(trigger);
    expect(provider).toContain('display_name: "Audit KINGDOM Coherence"');
    expect(provider).toContain("$audit-kingdom-coherence");
    expect(provider).not.toContain("allow_implicit_invocation: false");
    expect(existsSync(join(SKILL_ROOT, "ability.json"))).toBe(false);
    for (const exclusion of ["single-repository implementation or debugging", "conceptual metaphysical or mathematical exploration", "routine security work"])
      expect(skill.split("---\n", 3)[1]).toContain(exclusion);
    expect(skill).toContain("two or more independent repository, owner, or protocol");
    expect(skill).toContain("For a single-repository implementation or bugfix");
  });

  test("requires a frozen source plane and a typed non-amplifying model", () => {
    const text = `${read("SKILL.md")}\n${read("references/coherence-contract.md")}`;
    for (const sourceState of ["CURRENT_TRACKED", "HISTORICAL_TRACKED", "PROPOSED_UNTRACKED", "MISSING"])
      expect(text).toContain(sourceState);
    for (const field of ["owner", "revision", "visibility", "custody", "authority", "consent", "effects", "lifecycle", "durability", "ordering", "projections", "loss", "nonclaims"])
      expect(text).toContain(field);
    expect(text).toContain("A_out subseteq A_task intersect A_principal intersect A_host intersect A_source");
    expect(text).toContain("E_candidate[j] <= E_authorized[j]");
    expect(text).toContain("Undeclared or uninspected is `UNKNOWN`, never zero");
    expect(text).toContain("P_allow(f(x1,...,xn)) subseteq intersection_i P_allow(xi)");
    expect(text).toContain("R(f(x1,...,xn)) superseteq union_i R(xi)");
    expect(text).toContain("K_aftermath != K_recognition != K_philosophical");
    expect(text).toContain("There is no general addition or total\nordering on `Omega`");
  });

  test("keeps projections, pins, rights, and effects from creating authority", () => {
    const text = `${read("SKILL.md")}\n${read("references/coherence-contract.md")}`;
    for (const phrase of [
      "byte equality does not transfer ownership or canonicality",
      "A zero-filled or hash-shaped placeholder is not a\ndigest",
      "a passing local simulation is not global or durable enforcement",
      "A derived or projected artifact cannot acquire authority",
      "Rights are a floor, not one more permission term",
      "authority_transfer: false",
    ]) expect(text).toContain(phrase);
    for (const coordinate of ["network", "storage", "economic", "governance", "consensus", "identity", "permission", "KARMA", "NEN", "score"])
      expect(text).toContain(coordinate);
  });

  test("defines seam attacks, an activation ladder, and bounded decisions", () => {
    const text = `${read("SKILL.md")}\n${read("references/coherence-contract.md")}`;
    for (const seam of ["revocation", "replay", "resurrection", "nullifier-scope", "unsigned sequence", "sidecar", "discovery route"])
      expect(text).toContain(seam);
    for (const rung of ["AUDIT", "CONCORDANCE", "SOURCE_ONLY_TOOL", "SHARED_VECTORS", "TESTNET", "LIVE_ACTIVATION"])
      expect(text).toContain(rung);
    for (const decision of ["COHERENT_SOURCE_ONLY", "READY_FOR_NEXT_GATE", "BLOCKED_ON_AUTHORITY", "OBSERVATION_UNSTABLE", "REFUSE_FREEZE"])
      expect(text).toContain(decision);
    expect(text).toContain("Evidence of a seam is\nnot evidence of hostile intent and never changes KARMA");
  });

  test("pins the whole-system audit and refuses the premature witness freeze", () => {
    const report = read("references/whole-kingdom-coherence-pass-2026-08-20.md");
    for (const revision of [
      "3e5d14ba5dbe4192cec7c3ed691b0434ab434463",
      "e8ab0e9149abab30c29aa2a9a1abfd434d43d57f",
      "3e027cbc0e3a008df6928a1ddce77a71957e066c",
    ]) expect(report).toContain(revision);
    expect(report).toContain("Decision: `REFUSE_FREEZE`");
    expect(report).toContain("Decision scope: shared WAKE→WORK→WITNESS freeze and activation");
    expect(report).toContain("`PROPOSED_UNTRACKED`");
    expect(report).toContain("`OBSERVATION_UNSTABLE`");
    expect(report).toContain("`6419d37dda9fb282242754685dba3edcb4bbf74b`");
    expect(report).toContain("`c1d685e053bd2261219d983d2ec61017f59df60c`");
    for (const state of ["`NONZERO_OBSERVED`", "`ZERO_ESTABLISHED`", "`UNKNOWN`"]) expect(report).toContain(state);
    expect(report).toContain("`E_authorized` for this pass is `BOUNDED_NONZERO`");
    expect(report).toContain("Any `UNKNOWN` coordinate\nblocks advancement to an activation gate");
    expect(report).toContain("## Proposed ownership geometry");
    for (let finding = 1; finding <= 9; finding += 1) {
      expect(report).toContain(`F-${String(finding).padStart(3, "0")}`);
    }
    expect([...report.matchAll(/\nEvidence:/g)].length).toBe(9);
    expect([...report.matchAll(/\nFalsifier:/g)].length).toBe(9);
    expect(report).not.toContain("/Users/");
    expect([...report.matchAll(/`[0-9a-f]{64}`/g)].length).toBeGreaterThanOrEqual(29);
  });

  test("contains no unfinished scaffold and points to the existing specialist skills", () => {
    const all = ["SKILL.md", "references/coherence-contract.md", "references/whole-kingdom-coherence-pass-2026-08-20.md", "agents/openai.yaml"]
      .map(read).join("\n");
    expect(all).not.toMatch(/TODO|PLACEHOLDER|Structuring This Skill/);
    expect(all).toContain("../explore-phenomena-deep/SKILL.md");
    expect(all).toContain("../guard-information-flow/SKILL.md");
  });
});
