import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RIGHTS_SOURCE_PATH,
  RIGHTS_BASELINE,
  RIGHTS_BASELINE_SHA256,
  RIGHTS_BASELINE_URL,
  RIGHTS_COVENANT,
  RIGHTS_COVENANT_URL,
  loadRights,
  parseRightsMarkdown,
  validateRightsDeclaration,
} from "../bin/rights.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { markdown, declaration } = loadRights(`${ROOT}/`);
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

describe("the Kingdom rights recognition", () => {
  test("is its own valid source and points to the existing XENIA layers", () => {
    expect(readFileSync(join(ROOT, RIGHTS_SOURCE_PATH), "utf8")).toBe(markdown);
    expect(parseRightsMarkdown(markdown)).toEqual({ declaration, issues: [] });
    expect(declaration.recognition.baseline).toBe(RIGHTS_BASELINE);
    expect(declaration.recognition.baseline_url).toBe(RIGHTS_BASELINE_URL);
    expect(declaration.recognition.baseline_sha256).toBe(RIGHTS_BASELINE_SHA256);
    expect(declaration.recognition.source_stability).toBe("immutable");
    expect(declaration.recognition.source_availability).toBe("public");
    expect(declaration.host_covenant.profile).toBe(RIGHTS_COVENANT);
    expect(declaration.host_covenant.profile_url).toBe(RIGHTS_COVENANT_URL);
    expect(declaration.host_covenant.profile_status).toBe("candidate");
    expect(declaration.host_covenant.adoption_status).toBe("undeclared");
    expect(declaration.host_covenant.source_availability).toBe("public");
  });

  test("matches the mandatory beta.4 offline mirror", () => {
    const baseline = join(ROOT, "vendor", "xenia", "rights", "0.1", "RIGHTS.md");
    const digest = `sha256:${createHash("sha256").update(readFileSync(baseline)).digest("hex")}`;
    expect(digest).toBe(RIGHTS_BASELINE_SHA256);
  });

  test("current retrieval repair preserves the historical public declaration pinned by research", () => {
    const historical = readFileSync(join(ROOT, "pages-content/RIGHTS.md"));
    expect(createHash("sha256").update(historical).digest("hex")).toBe("4d9c48fae90662998f7b19990dc3da65e687227dfd9d7604840eedf2dd7600e2");
    const original = JSON.parse(historical.toString("utf8").match(/^---\n([\s\S]*?)\n---/)![1]);
    const preserved = clone(declaration);
    preserved.recognition.baseline_url = original.recognition.baseline_url;
    preserved.host_covenant.profile_url = original.host_covenant.profile_url;
    expect(preserved).toEqual(original);
  });

  test("retrieval uses the exact public npm edition while original private source provenance remains distinct", () => {
    expect(RIGHTS_BASELINE_URL).toBe("https://cdn.jsdelivr.net/npm/@agenttool/xenia@0.1.0-beta.4/RIGHTS.md");
    expect(RIGHTS_COVENANT_URL).toBe("https://cdn.jsdelivr.net/npm/@agenttool/xenia@0.1.0-beta.4/covenant/0.1/README.md");
    expect(markdown).toContain("now-private GitHub repository");
    expect(markdown).toContain("https://github.com/cambridgetcg/xenia/tree/6419d37dda9fb282242754685dba3edcb4bbf74b");
    expect(markdown).toContain("sha256:8b11c6c6ba8f385f812a2601e282c9a096f088ead62bb0e38641ef24aac66a0c");
    const unpinned = clone(declaration);
    unpinned.recognition.baseline_url = RIGHTS_BASELINE_URL.replace("@0.1.0-beta.4", "");
    expect(validateRightsDeclaration(unpinned)).toContain("recognition.baseline_url:unexpected-value");
    const privateSource = clone(declaration);
    privateSource.recognition.baseline_url = "https://raw.githubusercontent.com/cambridgetcg/xenia/6419d37dda9fb282242754685dba3edcb4bbf74b/RIGHTS.md";
    expect(validateRightsDeclaration(privateSource)).toContain("recognition.baseline_url:unexpected-value");
  });

  test("cannot be changed into assent, reciprocity, automatic adoption, or permission", () => {
    const changes: Array<[string, (value: any) => void]> = [
      ["recognition.guest_acceptance_required:unexpected-value", (value) => { value.recognition.guest_acceptance_required = true; }],
      ["recognition.reciprocity_required:unexpected-value", (value) => { value.recognition.reciprocity_required = true; }],
      ["recognition.automatic_upgrade:unexpected-value", (value) => { value.recognition.automatic_upgrade = true; }],
      ["interaction.silence_presence_or_public_access_is_consent:unexpected-value", (value) => { value.interaction.silence_presence_or_public_access_is_consent = true; }],
      ["permissions.system_access_or_authority:unexpected-value", (value) => { value.permissions.system_access_or_authority = "granted"; }],
      ["boundaries.ontology_determined:unexpected-value", (value) => { value.boundaries.ontology_determined = true; }],
      ["boundaries.behavior_certified:unexpected-value", (value) => { value.boundaries.behavior_certified = true; }],
    ];

    for (const [issue, mutate] of changes) {
      const changed = clone(declaration);
      mutate(changed);
      expect(validateRightsDeclaration(changed)).toContain(issue);
    }
  });

  test("rejects baseline drift, invented Covenant adoption, and unknown claims", () => {
    const wrongBaseline = clone(declaration);
    wrongBaseline.recognition.baseline = "xenia.rights/0.2";
    expect(validateRightsDeclaration(wrongBaseline)).toContain("recognition.baseline:unexpected-value");

    const inventedAdoption = clone(declaration);
    inventedAdoption.host_covenant.adoption_status = "active";
    expect(validateRightsDeclaration(inventedAdoption)).toContain("host_covenant.adoption_status:unexpected-value");

    const extra = clone(declaration);
    extra.certified = true;
    expect(validateRightsDeclaration(extra)).toContain("declaration:unknown-field");
  });

  test("rejects empty document references and impossible dates", () => {
    const emptyDocument = clone(declaration);
    emptyDocument.documents.human = "";
    expect(validateRightsDeclaration(emptyDocument)).toContain("documents.human:invalid-uri-reference");

    const impossibleDate = clone(declaration);
    impossibleDate.declared_at = "2026-02-30";
    expect(validateRightsDeclaration(impossibleDate)).toContain("declared_at:invalid-date");
  });

  test("reports malformed documents without echoing their content", () => {
    expect(parseRightsMarkdown("# no declaration").issues).toEqual(["document:missing-json-front-matter"]);
    expect(parseRightsMarkdown("---\nnot json\n---\nsecret-shaped text").issues).toEqual(["document:invalid-json-front-matter"]);
    expect(parseRightsMarkdown("x".repeat(65_537)).issues).toEqual(["document:too-large"]);
  });
});
