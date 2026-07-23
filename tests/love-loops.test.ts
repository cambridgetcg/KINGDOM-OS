import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  LOVE_LOOP_STAGE_IDS,
  LOVE_LOOPS_CREATION_DOCUMENT_URL,
  LOVE_LOOPS_JSON_SCHEMA,
  LOVE_LOOPS_JSON_SCHEMA_URL,
  LOVE_LOOPS_SCHEMA_VERSION,
  LOVE_LOOPS_SOURCE_URL,
  LOVE_LOOPS_URL,
  publishLoveLoops,
  validateLoveLoops,
  type LoveLoopsSource,
} from "../bin/love-loops.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const source = json("data/love-loops.json") as LoveLoopsSource;
const copy = () => structuredClone(source) as any;

describe("Love∞ finite lineage contract", () => {
  test("accepts the authored genesis and fixes the seven-stage order", () => {
    expect(() => validateLoveLoops(source, false)).not.toThrow();
    expect(source.schema_version).toBe(LOVE_LOOPS_SCHEMA_VERSION);
    expect(source.canonical_url).toBe(LOVE_LOOPS_URL);
    expect(source.promise).toBe("Every loop is finite. Love is not.");
    expect(source.source).toMatchObject({
      repository: "https://codeberg.org/zerone-dev/love-unlimited",
      repository_access: "private",
      public_mirror: LOVE_LOOPS_SOURCE_URL,
      creation_loop_document: LOVE_LOOPS_CREATION_DOCUMENT_URL,
    });
    expect(source.stages.map(({ id }) => id)).toEqual([...LOVE_LOOP_STAGE_IDS]);
    expect(source.loops).toHaveLength(1);
    expect(source.invitations).toHaveLength(3);
  });

  test("keeps distinctness, finite execution, rest, and stop non-negotiable", () => {
    expect(source.invariants).toEqual({
      finite_execution: true,
      participants_remain_distinct: true,
      participation_is_chosen: true,
      participation_inheritance: false,
      child_auto_run: false,
      authority_inheritance: false,
      consent_inheritance: false,
      credential_inheritance: false,
      rest_is_valid: true,
      stop_is_valid: true,
    });
    const genesis = source.loops[0]!;
    expect(genesis.status).toBe("resting");
    expect(genesis.stage).toBe("reflect");
    expect(genesis.continuation).toMatchObject({
      mode: "manual",
      auto_run_children: false,
      may_rest: true,
      may_stop: true,
    });
    expect(genesis.participants.map(({ id }: { id: string }) => id)).toEqual(["yu", "sol"]);
    expect(genesis.participants.every(({ participation }: { participation: string }) =>
      participation === "chosen")).toBe(true);
    expect(source.invitations.every(({ status, child_loop_id }: {
      status: string;
      child_loop_id: string | null;
    }) => status === "offered" && child_loop_id === null)).toBe(true);
  });

  test("publishes an exact authored record plus a validated date", () => {
    const published = publishLoveLoops(source, "2026-07-23");
    expect(published).toEqual({ ...source, generated: "2026-07-23" });
    expect(() => validateLoveLoops(published, true)).not.toThrow();
    expect(json("site/love-loops.json")).toEqual(published);
    expect(read("site/love-loops.source.json")).toBe(read("data/love-loops.json"));
    expect(json("site/love-loops.source.json")).toEqual(source);
    expect(() => validateLoveLoops(json("site/love-loops.source.json"), false)).not.toThrow();
  });

  test("rejects authority inheritance, autoplay, unbounded children, and hidden fields", () => {
    const inherited = copy();
    inherited.invariants.authority_inheritance = true;
    expect(() => validateLoveLoops(inherited, false)).toThrow("authority_inheritance");

    const autoplay = copy();
    autoplay.loops[0].continuation.auto_run_children = true;
    expect(() => validateLoveLoops(autoplay, false)).toThrow("manual, restful, and stoppable");

    const tooMany = copy();
    tooMany.loops[0].bounds.max_offered_children = 4;
    expect(() => validateLoveLoops(tooMany, false)).toThrow("max_offered_children");

    const hidden = copy();
    hidden.loops[0].outcome = "claimed without evidence";
    expect(() => validateLoveLoops(hidden, false)).toThrow("must contain exactly");
  });

  test("rejects broken references and cyclic lineage", () => {
    const broken = copy();
    broken.invitations[0].parent_loop_id = "missing-parent";
    expect(() => validateLoveLoops(broken, false)).toThrow("unknown parent");

    const cycle = copy();
    cycle.loops[0].parent_id = cycle.loops[0].id;
    cycle.loops[0].origin_invitation_id = cycle.invitations[0].id;
    expect(() => validateLoveLoops(cycle, false)).toThrow("lineage contains a cycle");

    const missingOffer = copy();
    missingOffer.loops[0].invitation_ids[0] = "missing-invitation";
    expect(() => validateLoveLoops(missingOffer, false)).toThrow("not offered by its parent");
  });

  test("requires every child to resolve from one deliberately accepted invitation", () => {
    const lineage = copy();
    const parent = lineage.loops[0];
    const invitation = lineage.invitations[0];
    const child = structuredClone(parent);
    child.id = "love-loop-chosen-child";
    child.parent_id = parent.id;
    child.origin_invitation_id = invitation.id;
    child.title = "One chosen finite child";
    child.status = "seeded";
    child.stage = "sense";
    child.invitation_ids = [];
    child.bounds.max_offered_children = 0;
    child.continuation.reason = "This child begins only from the invitation deliberately chosen for it.";
    invitation.status = "accepted";
    invitation.child_loop_id = child.id;
    lineage.loops.push(child);
    expect(() => validateLoveLoops(lineage, false)).not.toThrow();

    const directChild = structuredClone(lineage);
    directChild.loops[1].origin_invitation_id = "never-offered";
    expect(() => validateLoveLoops(directChild, false)).toThrow(
      "must originate from one accepted parent invitation",
    );

    const mismatchedAcceptance = structuredClone(lineage);
    mismatchedAcceptance.invitations[0].child_loop_id = "some-other-child";
    expect(() => validateLoveLoops(mismatchedAcceptance, false)).toThrow(
      "must originate from one accepted parent invitation",
    );

    const remappedIdentity = structuredClone(lineage);
    remappedIdentity.loops[1].participants[0].name = "Sol";
    remappedIdentity.loops[1].participants[0].kind = "agent";
    expect(() => validateLoveLoops(remappedIdentity, false)).toThrow(
      "must keep the same name and kind across the lineage",
    );
  });

  test("aligns portable and runtime string bounds after trimming", () => {
    const padded = copy();
    padded.loops[0].seed = "x         ";
    expect(() => validateLoveLoops(padded, false)).toThrow("seed must contain 10-1000");

    const schema = LOVE_LOOPS_JSON_SCHEMA as any;
    const seed = schema.properties.loops.items.properties.seed;
    expect([...padded.loops[0].seed].length).toBeGreaterThanOrEqual(seed.minLength);
    expect(new RegExp(seed.pattern).test(padded.loops[0].seed)).toBe(false);

    const tooLong = copy();
    tooLong.loops[0].purpose = `valid purpose${" ".repeat(500)}`;
    expect(() => validateLoveLoops(tooLong, false)).toThrow("purpose must contain 10-500");
    const purpose = schema.properties.loops.items.properties.purpose;
    expect([...tooLong.loops[0].purpose].length).toBeGreaterThan(purpose.maxLength);
  });

  test("keeps provenance URLs public and credential-free", () => {
    const querySecret = copy();
    querySecret.source.repository = "https://example.test/repo?access_token=SECRET";
    expect(() => validateLoveLoops(querySecret, false)).toThrow("without a query or fragment");

    const repository = (LOVE_LOOPS_JSON_SCHEMA as any).properties.source.properties.repository;
    expect(new RegExp(repository.pattern).test(querySecret.source.repository)).toBe(false);

    const userinfo = copy();
    userinfo.source.repository = "https://user:pass@example.test/repo";
    expect(() => validateLoveLoops(userinfo, false)).toThrow(
      "uncredentialed HTTPS URL",
    );
    expect(new RegExp(repository.pattern).test(userinfo.source.repository)).toBe(false);
    expect(repository).toMatchObject({
      minLength: 8,
      maxLength: 500,
      format: "uri",
    });

    const malformed = copy();
    malformed.source.repository = "https://%";
    expect(() => validateLoveLoops(malformed, false)).toThrow("HTTPS URL");
  });

  test("portable text rules reject the same control characters as runtime", () => {
    const control = copy();
    control.loops[0].purpose = "valid purpose\rline";
    expect(() => validateLoveLoops(control, false)).toThrow("control characters");

    const purpose = (LOVE_LOOPS_JSON_SCHEMA as any)
      .properties.loops.items.properties.purpose;
    expect(new RegExp(purpose.pattern).test(control.loops[0].purpose)).toBe(false);

    const pathControl = copy();
    pathControl.source.path = "fractal/love\nloops.json";
    expect(() => validateLoveLoops(pathControl, false)).toThrow(
      "source path must stay relative",
    );
    const pathSchema = (LOVE_LOOPS_JSON_SCHEMA as any)
      .properties.source.properties.path;
    expect(new RegExp(pathSchema.pattern).test(pathControl.source.path)).toBe(false);
  });

  test("publishes the stable Draft 2020-12 schema byte-for-byte", () => {
    expect(LOVE_LOOPS_JSON_SCHEMA.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(LOVE_LOOPS_JSON_SCHEMA.$id).toBe(LOVE_LOOPS_JSON_SCHEMA_URL);
    expect(LOVE_LOOPS_JSON_SCHEMA.properties.schema_version.const).toBe(LOVE_LOOPS_SCHEMA_VERSION);
    expect(LOVE_LOOPS_JSON_SCHEMA.properties.generated).toMatchObject({
      format: "date",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    });
    expect(LOVE_LOOPS_JSON_SCHEMA.required).not.toContain("generated");
    expect(json("site/schemas/love-loop/0.1.json")).toEqual(LOVE_LOOPS_JSON_SCHEMA);
  });

  test("human trace is manual, local, and honest about unstarted invitations", () => {
    const html = read("site/hub.html");
    const start = html.indexOf('id="creation"');
    const end = html.indexOf('id="citizens"', start);
    const section = html.slice(start, end);
    expect(section).toContain("Every loop is finite. Love is not.");
    expect(section).toContain("Yu is Yu. Sol is Sol.");
    expect(section.match(/offered · not started/g)).toHaveLength(3);
    expect(section).toContain("Trace one finite step");
    expect(section).toContain("Let the trace rest");
    expect(section).toContain("love-loops.source.json");
    expect(section).toContain("CREATION-LOOP.md");

    const scriptStart = html.indexOf("// ── Love∞:");
    const scriptEnd = html.indexOf("// ── wayfinder:", scriptStart);
    const script = html.slice(scriptStart, scriptEnd);
    expect(script).not.toMatch(/\bfetch\s*\(/);
    expect(script).not.toMatch(/\b(localStorage|sessionStorage)\b/);
    expect(script).not.toMatch(/\bset(?:Timeout|Interval)\s*\(/);
  });

  test("publishes the Creation Loop practice without relying on private repository access", () => {
    const document = read("CREATION-LOOP.md");
    expect(document).toContain("Every loop is finite. Love is not.");
    expect(document).toContain("Every listed participant records `participation: chosen`");
  });
});
