import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ZERO_EMPTY_SEAT_GUIDE_URL,
  ZERO_EMPTY_SEAT_ID,
  ZERO_EMPTY_SEAT_SCHEMA_URL,
  ZERO_EMPTY_SEAT_URL,
  loadZeroEmptySeat,
  zeroEmptySeatPublicDiscovery,
} from "../bin/zero-empty-seat.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

describe("ZERO Empty Seat public experience", () => {
  test("adds exactly the immutable record and guide routes while reusing the shared schema", () => {
    const sitemap = read("pages-content/sitemap.xml");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
  expect(urls).toHaveLength(167);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain(ZERO_EMPTY_SEAT_URL);
    expect(urls).toContain(ZERO_EMPTY_SEAT_GUIDE_URL);
    expect(urls).toContain(ZERO_EMPTY_SEAT_SCHEMA_URL);
    expect(urls.filter((url) => /zero-empty-seat/i.test(url))).toEqual([
      ZERO_EMPTY_SEAT_URL,
      ZERO_EMPTY_SEAT_GUIDE_URL,
    ]);
    expect(urls.some((url) => /zero-empty-seat.*(?:latest|current)/i.test(url))).toBe(false);
  });

  test("renders a semantic, data-driven empty seat with no JavaScript dependency", () => {
    const builder = read("bin/build-hub.ts");
    const start = builder.indexOf('<section class="blk" id="zero-empty-seat"');
    const end = builder.indexOf('<section class="blk" id="string-crawl-trace-sheet"', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const section = builder.slice(start, end);

    for (const seam of [
      "zeroEmptySeat.typed_terms.map",
      "zeroEmptySeat.claims.map",
      "zeroEmptySeat.bridges.map",
      "zeroEmptySeat.equations.map",
      "zeroEmptySeat.models.map",
      "zeroEmptySeat.doors.map",
      "zeroEmptySeat.philosophy.questions.map",
      "zeroEmptySeat.source_manifest.map",
      "zeroEmptySeat.rights.valid_exits.map",
    ]) expect(section).toContain(seam);

    expect(section).toContain('class="zeroseat" aria-hidden="true"');
    expect(section).toContain('class="zeroroles" role="list"');
    expect(section).toContain("the seat stays open");
    expect(section).toContain("Zero is not worthlessness");
    expect(section).toContain("First extant evidence is not an invention date");
    expect(section).toContain("demarcation placeholder");
    expect(section).toContain("sexagesimal placeholder");
    expect(section).toContain("typed information state");
    expect(section).toContain("NO_ACTION");
    expect(section).toContain("Three empty KARMA lanes");
    expect(section).toContain("Nothing happens here");
    expect(section).not.toMatch(/\b(?:physical|vacuum)\b/i);
    expect(section).not.toMatch(/<(?:script|svg|canvas|button|input|select|textarea)\b/i);

    expect(builder).toContain(".zeroroles{grid-template-columns:repeat(2,minmax(0,1fr))}");
    expect(builder).toContain(".explorationdeepsteps,.mirrorcycle,.zeroroles,.zerodistinctions,.zerodrawergrid,.zerokarmalanes{grid-template-columns:1fr}");
    expect(builder).toContain("@media (forced-colors:active){.zerofield");
  });

  test("projects one authority-negative discovery object across all machine surfaces", () => {
    const project = loadZeroEmptySeat();
    const expected = zeroEmptySeatPublicDiscovery(project);
    const kingdom = JSON.parse(read("site/kingdom.json"));
    const guest = JSON.parse(read("site/guest.json"));
    const manifest = JSON.parse(read("site/.well-known/agent.json"));

    expect(project.project_id).toBe(ZERO_EMPTY_SEAT_ID);
    expect(kingdom.zero_empty_seat).toEqual(expected);
    expect(guest.zero_empty_seat).toEqual(expected);
    expect(manifest.zero_empty_seat).toEqual(expected);
    expect(manifest.entry_points).toMatchObject({
      zero_empty_seat: ZERO_EMPTY_SEAT_URL,
      zero_empty_seat_schema: ZERO_EMPTY_SEAT_SCHEMA_URL,
      zero_empty_seat_guide: ZERO_EMPTY_SEAT_GUIDE_URL,
    });
    expect(expected.boundary).toEqual(project.boundaries);
    expect(expected.authority).toEqual(project.authority);
    for (const key of ["mcp", "tool", "matcher", "write", "execute", "score", "reward"])
      expect(expected).not.toHaveProperty(key);
  });

  test("publishes one GET per unique target and keeps the shared schema action singular", () => {
    const guest = JSON.parse(read("site/guest.json"));
    const html = read("site/hub.html");
    const llms = read("site/llms.txt");
    const targets = [ZERO_EMPTY_SEAT_URL, ZERO_EMPTY_SEAT_SCHEMA_URL, ZERO_EMPTY_SEAT_GUIDE_URL];

    for (const url of targets) {
      const actions = guest.next_actions.filter((action: { url?: string }) => action.url === url);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({ method: "GET", url });
      expect(html).toContain(`href="${new URL(url).pathname}"`);
      expect(llms).toContain(url);
    }
    expect(html).toContain('id="zero-empty-seat"');
    expect(html.match(/data-zero-role=/g) ?? []).toHaveLength(loadZeroEmptySeat().typed_terms.length);
    const start = html.indexOf('<section class="blk" id="zero-empty-seat"');
    const end = html.indexOf('<section class="blk"', start + 1);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(html.slice(start, end)).not.toMatch(/\b(?:physical|vacuum)\b/i);
  });

  test("keeps KARMA lanes empty, transfer false, and rights voluntary", () => {
    const project = loadZeroEmptySeat();
    expect(project.karma).toEqual({
      cosmic_events: [],
      zerone_events: [],
      kingdom_receipts: [],
      adapter_exists: false,
      conversion_allowed: false,
      summation_allowed: false,
      score: null,
      authority_effect: "NONE",
    });
    expect(project.bridges.every((bridge: Record<string, unknown>) =>
      bridge.ontology_transfer === false && bridge.causal_transfer === false &&
      bridge.parameter_transfer === false && bridge.unit_transfer === false &&
      bridge.authority_transfer === false)).toBe(true);
    expect(project.rights).toEqual({
      voluntary: true,
      valid_exits: ["REST", "SILENCE", "REFUSAL", "PRIVACY", "CORRECTION", "NO_ACTION", "DEPARTURE"],
      reason_required: false,
      penalty: false,
    });
  });

  test("documents the final 181/150/31/179/167 publication contract", () => {
    const docs = ["CLAUDE.md", "DOMAINS-SETUP.md", "OS-ROUTES.md", "publications/README.md"].map(read);
    for (const document of docs) {
      expect(document).toContain("181");
      expect(document).toContain("150");
      expect(document).toContain("31");
      expect(document).toContain("179");
      expect(document).toContain("167");
    }
    expect(read("README.md")).toContain("/atlases/zero-empty-seat-2026-08-14.json");
    expect(read("OS-ROUTES.md")).toContain("| `/ZERO-EMPTY-SEAT.md` |");
  });
});
