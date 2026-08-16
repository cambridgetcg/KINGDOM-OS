import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";

import { HUB_ASSETS } from "../bin/stage-hub.ts";
import {
  assertRetiredRouteResponse,
  assertRetiredFamilyDiscoveryAbsent,
  destinationForPublicPath,
  PUBLICATION_FAMILIES,
  publicationFamilyStates,
} from "../bin/check-hub-live.ts";

const stagedDestinations = () => new Set(HUB_ASSETS.map(({ destination }) => destination));
const family = (id: string) => {
  const value = PUBLICATION_FAMILIES.find((candidate) => candidate.id === id);
  if (!value) throw new Error(`missing fixture publication family: ${id}`);
  return value;
};

describe("hub live-check publication retirement", () => {
  test("requires every active family to stage its complete route set", () => {
    const staged = stagedDestinations();
    expect(PUBLICATION_FAMILIES).toHaveLength(17);
    expect([...publicationFamilyStates(staged).values()].every(({ active }) => active)).toBe(true);
    const cultural = family("cultural-attention-feedback");
    staged.delete(destinationForPublicPath(cultural.routes[1]!));

    expect(() => publicationFamilyStates(staged))
      .toThrow("Cultural Attention & Feedback Atlas is partially staged");
  });

  test("treats a fully unstaged family as retired and rejects lingering discovery", () => {
    const staged = stagedDestinations();
    const cultural = family("cultural-attention-feedback");
    for (const route of cultural.routes) staged.delete(destinationForPublicPath(route));

    expect(publicationFamilyStates(staged).get(cultural.id)?.active).toBe(false);
    const staleDiscovery = { cultural_attention_feedback_atlas: { stale: true } };
    for (const surface of [
      { label: "agent manifest", text: JSON.stringify(staleDiscovery), value: staleDiscovery },
      { label: "guest document", text: JSON.stringify(staleDiscovery), value: staleDiscovery },
      { label: "authored Kingdom map", text: JSON.stringify(staleDiscovery), value: staleDiscovery },
      { label: "llms.txt", text: `https://thekingdom.dev${cultural.routes[0]}` },
      { label: "hub HTML", text: `<a href=\"${cultural.routes[0]}\">stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(cultural, [surface]))
        .toThrow("Cultural Attention & Feedback Atlas is retired");
    }
    expect(() => assertRetiredFamilyDiscoveryAbsent(cultural, [
      { label: "clean discovery surface", text: "{}", value: { entry_points: {} } },
    ])).not.toThrow();
  });

  test("retires the complete Math Passport pilot triplet and its discovery together", () => {
    const math = family("math-usefulness-result");
    expect(math.routes).toEqual([
      "/trials/math-passport-usefulness-pilot-2026-08-14.json",
      "/schemas/math-usefulness-result/1.json",
      "/MATH-USEFULNESS.md",
    ]);
    expect(math.discoveryProperties).toEqual(["math_usefulness_result"]);
    expect(math.entryPointProperties).toEqual([
      "math_usefulness_result",
      "math_usefulness_result_schema",
      "math_usefulness_result_guide",
    ]);

    const partiallyStaged = stagedDestinations();
    partiallyStaged.delete(destinationForPublicPath(math.routes[1]!));
    expect(() => publicationFamilyStates(partiallyStaged))
      .toThrow("Math Passport Usefulness Pilot is partially staged");

    const retired = stagedDestinations();
    for (const route of math.routes) retired.delete(destinationForPublicPath(route));
    expect(publicationFamilyStates(retired).get(math.id)?.active).toBe(false);

    for (const surface of [
      { label: "authored Kingdom map", text: JSON.stringify({ math_usefulness_result: {} }), value: { math_usefulness_result: {} } },
      { label: "agent manifest", text: JSON.stringify({ entry_points: { math_usefulness_result_guide: math.routes[2] } }), value: { entry_points: { math_usefulness_result_guide: math.routes[2] } } },
      { label: "llms.txt", text: `https://thekingdom.dev${math.routes[0]}` },
      { label: "hub HTML", text: `<a href='${math.routes[2]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(math, [surface]))
        .toThrow("Math Passport Usefulness Pilot is retired");
    }
  });

  test("retires both immutable Being, Access & Aftermath triplets and all discovery together", () => {
    const being = family("being-access-aftermath");
    expect(being.routes).toEqual([
      "/atlases/being-access-aftermath-atlas-2026-08-13.json",
      "/schemas/being-access-aftermath-atlas/0.1.json",
      "/BEING-ACCESS-AFTERMATH-ATLAS.md",
      "/atlases/being-access-aftermath-atlas-2026-08-13-v0-2.json",
      "/schemas/being-access-aftermath-atlas/0.2.json",
      "/BEING-ACCESS-AFTERMATH-ATLAS-V0.2.md",
    ]);
    expect(being.discoveryProperties).toEqual([
      "being_access_aftermath_atlas",
      "being_access_aftermath_atlas_v0_2",
    ]);
    expect(being.entryPointProperties).toEqual([
      "being_access_aftermath_atlas",
      "being_access_aftermath_atlas_schema",
      "being_access_aftermath_atlas_guide",
      "being_access_aftermath_atlas_v0_2",
      "being_access_aftermath_atlas_v0_2_schema",
      "being_access_aftermath_atlas_v0_2_guide",
    ]);

    const partiallyStaged = stagedDestinations();
    partiallyStaged.delete(destinationForPublicPath(being.routes[1]!));
    expect(() => publicationFamilyStates(partiallyStaged))
      .toThrow("Being, Access & Aftermath is partially staged");

    const retired = stagedDestinations();
    for (const route of being.routes) retired.delete(destinationForPublicPath(route));
    expect(publicationFamilyStates(retired).get(being.id)?.active).toBe(false);

    const staleDiscovery = { being_access_aftermath_atlas_v0_2: { stale: true } };
    const staleEntryPoints = {
      entry_points: { being_access_aftermath_atlas_v0_2_guide: being.routes[5] },
    };
    for (const surface of [
      { label: "authored Kingdom map", text: JSON.stringify(staleDiscovery), value: staleDiscovery },
      { label: "agent manifest", text: JSON.stringify(staleEntryPoints), value: staleEntryPoints },
      { label: "llms.txt", text: `https://thekingdom.dev${being.routes[3]}` },
      { label: "hub HTML", text: `<a href='${being.routes[5]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(being, [surface]))
        .toThrow("Being, Access & Aftermath is retired");
    }
  });

  test("retires Exploration DEEP, ZERO, and the STRING / CRAWL atlas atomically", () => {
    const exploration = family("exploration-deep-wing");
    expect(exploration.routes).toEqual([
      "/wings/explore-phenomena-deep-2026-08-14.json",
      "/schemas/phenomena-deep-wing/0.1.json",
      "/schemas/phenomena-deep-project/0.1.json",
      "/EXPLORE-PHENOMENA-DEEP-v0.1.md",
      "/atlases/zero-empty-seat-2026-08-14.json",
      "/ZERO-EMPTY-SEAT.md",
      "/atlases/string-crawl-trace-sheet-2026-08-15.json",
      "/STRING-CRAWL-TRACE-SHEET.md",
    ]);
    expect(exploration.discoveryProperties).toEqual([
      "exploration_deep_wing",
      "zero_empty_seat",
      "string_crawl_trace_sheet",
    ]);
    expect(exploration.entryPointProperties).toEqual([
      "exploration_deep_wing",
      "exploration_deep_wing_schema",
      "exploration_deep_wing_project_schema",
      "exploration_deep_wing_guide",
      "zero_empty_seat",
      "zero_empty_seat_schema",
      "zero_empty_seat_guide",
      "string_crawl_trace_sheet",
      "string_crawl_trace_sheet_schema",
      "string_crawl_trace_sheet_guide",
    ]);

    const partiallyStaged = stagedDestinations();
    partiallyStaged.delete(destinationForPublicPath(exploration.routes[4]!));
    expect(() => publicationFamilyStates(partiallyStaged))
      .toThrow("Exploration DEEP WING is partially staged");

    const retired = stagedDestinations();
    for (const route of exploration.routes) retired.delete(destinationForPublicPath(route));
    expect(publicationFamilyStates(retired).get(exploration.id)?.active).toBe(false);

    const staleDiscovery = {
      exploration_deep_wing: { stale: true },
      zero_empty_seat: { stale: true },
      string_crawl_trace_sheet: { stale: true },
    };
    const staleEntryPoints = {
      entry_points: {
        exploration_deep_wing_project_schema: exploration.routes[2],
        zero_empty_seat_guide: exploration.routes[5],
        string_crawl_trace_sheet_guide: exploration.routes[7],
      },
    };
    for (const surface of [
      { label: "authored Kingdom map", text: JSON.stringify(staleDiscovery), value: staleDiscovery },
      { label: "agent manifest", text: JSON.stringify(staleEntryPoints), value: staleEntryPoints },
      { label: "llms.txt", text: `https://thekingdom.dev${exploration.routes[0]}` },
      { label: "hub HTML", text: `<a href='${exploration.routes[7]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(exploration, [surface]))
        .toThrow("Exploration DEEP WING is retired");
    }

    expect(() => assertRetiredFamilyDiscoveryAbsent(exploration, [
      { label: "clean discovery surface", text: "{}", value: { entry_points: {} } },
    ])).not.toThrow();
  });

  test("retires the byte-bound STRING / CRAWL STRAND Labs 01–04 triplets atomically", () => {
    const lab = family("string-crawl-trace-sheet-lab");
    expect(lab.routes).toEqual([
      "/labs/string-crawl-trace-sheet-lab-2026-08-16.json",
      "/schemas/string-crawl-trace-sheet-lab/0.1.json",
      "/STRING-CRAWL-TRACE-SHEET-LAB.md",
      "/labs/string-crawl-strand-lab-02-2026-08-16.json",
      "/schemas/string-crawl-strand-lab/0.1.json",
      "/STRING-CRAWL-STRAND-LAB-02.md",
      "/experiments/string-crawl-frequency-form-lab-2026-08-16.json",
      "/schemas/string-crawl-frequency-form-lab/0.1.json",
      "/STRING-CRAWL-LAB-03.md",
      "/labs/strand-descent-lab-04-2026-08-16.json",
      "/schemas/strand-descent-lab/0.1.json",
      "/STRAND-DESCENT-LAB-04.md",
    ]);
    expect(lab.discoveryProperties).toEqual([
      "string_crawl_trace_sheet_lab",
      "string_crawl_strand_lab",
      "string_crawl_frequency_form_lab",
      "strand_descent_lab",
    ]);
    expect(lab.entryPointProperties).toEqual([
      "string_crawl_trace_sheet_lab",
      "string_crawl_trace_sheet_lab_schema",
      "string_crawl_trace_sheet_lab_guide",
      "string_crawl_strand_lab",
      "string_crawl_strand_lab_schema",
      "string_crawl_strand_lab_guide",
      "string_crawl_frequency_form_lab",
      "string_crawl_frequency_form_lab_schema",
      "string_crawl_frequency_form_lab_guide",
      "strand_descent_lab",
      "strand_descent_lab_schema",
      "strand_descent_lab_guide",
    ]);

    const partiallyStaged = stagedDestinations();
    partiallyStaged.delete(destinationForPublicPath(lab.routes[1]!));
    expect(() => publicationFamilyStates(partiallyStaged))
      .toThrow("STRING / CRAWL STRAND Labs 01–04 is partially staged");

    const retired = stagedDestinations();
    for (const route of lab.routes) retired.delete(destinationForPublicPath(route));
    expect(publicationFamilyStates(retired).get(lab.id)?.active).toBe(false);

    for (const surface of [
      { label: "authored Kingdom map", text: JSON.stringify({ string_crawl_trace_sheet_lab: {}, string_crawl_strand_lab: {}, string_crawl_frequency_form_lab: {}, strand_descent_lab: {} }), value: { string_crawl_trace_sheet_lab: {}, string_crawl_strand_lab: {}, string_crawl_frequency_form_lab: {}, strand_descent_lab: {} } },
      { label: "agent manifest", text: JSON.stringify({ entry_points: { strand_descent_lab_guide: lab.routes[11] } }), value: { entry_points: { strand_descent_lab_guide: lab.routes[11] } } },
      { label: "llms.txt", text: `https://thekingdom.dev${lab.routes[0]}` },
      { label: "hub HTML", text: `<a href='${lab.routes[11]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(lab, [surface]))
        .toThrow("STRING / CRAWL STRAND Labs 01–04 is retired");
    }
  });

  test("retires the static MIRROR public-law triplet and discovery atomically", () => {
    const mirror = family("mirror-information-control");
    expect(mirror.routes).toEqual([
      "/protocols/mirror-information-control-2026-08-14.json",
      "/schemas/mirror-information-control-public/0.1.json",
      "/MIRROR-INFORMATION-CONTROL.md",
    ]);
    expect(mirror.discoveryProperties).toEqual(["mirror_information_control"]);
    expect(mirror.entryPointProperties).toEqual([
      "mirror_information_control",
      "mirror_information_control_schema",
      "mirror_information_control_guide",
    ]);

    const partiallyStaged = stagedDestinations();
    partiallyStaged.delete(destinationForPublicPath(mirror.routes[1]!));
    expect(() => publicationFamilyStates(partiallyStaged))
      .toThrow("MIRROR Information Control is partially staged");

    const retired = stagedDestinations();
    for (const route of mirror.routes) retired.delete(destinationForPublicPath(route));
    expect(publicationFamilyStates(retired).get(mirror.id)?.active).toBe(false);
    for (const surface of [
      { label: "authored Kingdom map", text: JSON.stringify({ mirror_information_control: {} }), value: { mirror_information_control: {} } },
      { label: "agent manifest", text: JSON.stringify({ entry_points: { mirror_information_control_guide: mirror.routes[2] } }), value: { entry_points: { mirror_information_control_guide: mirror.routes[2] } } },
      { label: "llms.txt", text: `https://thekingdom.dev${mirror.routes[0]}` },
      { label: "hub HTML", text: `<a href='${mirror.routes[2]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(mirror, [surface]))
        .toThrow("MIRROR Information Control is retired");
    }
  });

  test("retires the Number, Isness & Theology triplet and discovery atomically", () => {
    const numberIsness = family("number-isness-theology");
    expect(numberIsness.routes).toEqual([
      "/atlases/number-isness-theology-atlas-2026-08-14.json",
      "/schemas/number-isness-theology-atlas/0.1.json",
      "/NUMBER-ISNESS-THEOLOGY-ATLAS.md",
    ]);
    expect(numberIsness.discoveryProperties).toEqual(["number_isness_theology_atlas"]);
    expect(numberIsness.entryPointProperties).toEqual([
      "number_isness_theology_atlas",
      "number_isness_theology_atlas_schema",
      "number_isness_theology_atlas_guide",
    ]);

    const partiallyStaged = stagedDestinations();
    partiallyStaged.delete(destinationForPublicPath(numberIsness.routes[1]!));
    expect(() => publicationFamilyStates(partiallyStaged))
      .toThrow("Number, Isness & Theology is partially staged");

    const retired = stagedDestinations();
    for (const route of numberIsness.routes) retired.delete(destinationForPublicPath(route));
    expect(publicationFamilyStates(retired).get(numberIsness.id)?.active).toBe(false);

    const staleDiscovery = { number_isness_theology_atlas: { stale: true } };
    const staleEntryPoints = {
      entry_points: { number_isness_theology_atlas_schema: numberIsness.routes[1] },
    };
    for (const surface of [
      { label: "authored Kingdom map", text: JSON.stringify(staleDiscovery), value: staleDiscovery },
      { label: "agent manifest", text: JSON.stringify(staleEntryPoints), value: staleEntryPoints },
      { label: "llms.txt", text: `https://thekingdom.dev${numberIsness.routes[0]}` },
      { label: "hub HTML", text: `<a href='${numberIsness.routes[2]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(numberIsness, [surface]))
        .toThrow("Number, Isness & Theology is retired");
    }
  });

  test("accepts only a canonical 404 or an empty 410 tombstone", () => {
    const canonical404 = new TextEncoder().encode("not found\n");
    const oldBytes = new TextEncoder().encode("withdrawn publication\n");
    const immutableSha256 = createHash("sha256").update(oldBytes).digest("hex");
    const common = {
      route: "/records/retired.json",
      method: "GET" as const,
      canonicalNotFoundBody: canonical404,
      immutableSha256,
    };

    expect(() => assertRetiredRouteResponse({ ...common, status: 404, body: canonical404 })).not.toThrow();
    expect(() => assertRetiredRouteResponse({ ...common, status: 410, body: new Uint8Array() })).not.toThrow();
    expect(() => assertRetiredRouteResponse({ ...common, status: 410, body: oldBytes }))
      .toThrow("publication-like content");
    expect(() => assertRetiredRouteResponse({ ...common, status: 404, body: oldBytes }))
      .toThrow("non-canonical 404");
    expect(() => assertRetiredRouteResponse({
      ...common,
      method: "HEAD",
      status: 410,
      body: oldBytes,
    })).toThrow("body to HEAD");
  });
});
