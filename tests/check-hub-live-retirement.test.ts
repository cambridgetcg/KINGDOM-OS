import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";

import { HUB_ASSETS } from "../bin/stage-hub.ts";
import { LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE } from
  "../bin/loops-locks-freedom-relations-atlas.ts";
import {
  assertActivePublicationReviewWindow,
  assertPublicationFamilyReleaseWindows,
  assertRetiredRouteResponse,
  assertRetiredFamilyDiscoveryAbsent,
  checkHubLive,
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
  test("rejects an overdue active family through the production live-check before fetching", async () => {
    const originalFetch = globalThis.fetch;
    let fetchCalls = 0;
    globalThis.fetch = (async () => {
      fetchCalls += 1;
      throw new Error("network must remain untouched before the release-window gate");
    }) as typeof fetch;
    try {
      await expect(checkHubLive("https://thekingdom.dev", {
        checkedOn: "2026-09-22",
      })).rejects.toThrow("replace or fully retire");
      expect(fetchCalls).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("requires an overdue active publication to be replaced or fully retired", () => {
    for (const checkedOn of ["2026-08-21", "2026-09-21"]) {
      expect(() => assertActivePublicationReviewWindow({
        active: true,
        checkedOn,
        label: "UK Government Transformation Engine",
        nextReviewDue: "2026-09-21",
      })).not.toThrow();
    }
    expect(() => assertActivePublicationReviewWindow({
      active: true,
      checkedOn: "2026-09-22",
      label: "UK Government Transformation Engine",
      nextReviewDue: "2026-09-21",
    })).toThrow("replace or fully retire");
    expect(() => assertActivePublicationReviewWindow({
      active: false,
      checkedOn: "2030-01-01",
      label: "UK Government Transformation Engine",
      nextReviewDue: "2026-09-21",
    })).not.toThrow();
    expect(() => assertActivePublicationReviewWindow({
      active: true,
      checkedOn: "2026-02-30",
      label: "UK Government Transformation Engine",
      nextReviewDue: "2026-09-21",
    })).toThrow("real YYYY-MM-DD dates");
  });

  test("requires every active family to stage its complete route set", () => {
    const staged = stagedDestinations();
    expect(PUBLICATION_FAMILIES).toHaveLength(34);
    const states = publicationFamilyStates(staged);
    expect([...states.values()].filter(({ active }) => active)).toHaveLength(34);
    expect([...states.values()].every(({ active }) => active)).toBe(true);
    const cultural = family("cultural-attention-feedback");
    staged.delete(destinationForPublicPath(cultural.routes[1]!));

    expect(() => publicationFamilyStates(staged))
      .toThrow("Cultural Attention & Feedback Atlas is partially staged");
  });

  test("retires both freedom-related atlases independently in all four states", () => {
    const upstream = family("freedom-loop-lock-key-atlas");
    const relations = family("loops-locks-freedom-relations-atlas");
    expect(upstream.dependsOn ?? []).toEqual([]);
    expect(relations.dependsOn ?? []).toEqual([]);

    const scenarios = [
      { label: "both active", retired: [] as const, upstreamActive: true, relationsActive: true },
      { label: "upstream only retired", retired: [upstream] as const,
        upstreamActive: false, relationsActive: true },
      { label: "Relations only retired", retired: [relations] as const,
        upstreamActive: true, relationsActive: false },
      { label: "both retired", retired: [upstream, relations] as const,
        upstreamActive: false, relationsActive: false },
    ];

    for (const scenario of scenarios) {
      const staged = stagedDestinations();
      for (const retired of scenario.retired) {
        for (const route of retired.routes) staged.delete(destinationForPublicPath(route));
      }
      const states = publicationFamilyStates(staged);
      expect(states.get(upstream.id)?.active).toBe(scenario.upstreamActive);
      expect(states.get(relations.id)?.active).toBe(scenario.relationsActive);

      for (const route of upstream.routes) {
        expect(staged.has(destinationForPublicPath(route))).toBe(scenario.upstreamActive);
      }
      for (const route of relations.routes) {
        expect(staged.has(destinationForPublicPath(route))).toBe(scenario.relationsActive);
      }

      const value: Record<string, any> = { entry_points: {} };
      const advertised: string[] = [];
      if (scenario.upstreamActive) {
        value[upstream.discoveryProperties[0]!] = { static_only: true };
        for (const [index, property] of upstream.entryPointProperties.entries()) {
          const url = `https://thekingdom.dev${upstream.routes[index]}`;
          value.entry_points[property] = url;
          advertised.push(url);
        }
      }
      if (scenario.relationsActive) {
        value[relations.discoveryProperties[0]!] = { static_only: true };
        for (const [index, property] of relations.entryPointProperties.entries()) {
          const url = `https://thekingdom.dev${relations.routes[index]}`;
          value.entry_points[property] = url;
          advertised.push(url);
        }
        advertised.push(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE.tag);
      }
      const surface = {
        label: scenario.label,
        text: `${JSON.stringify(value)} ${advertised.join(" ")}`,
        value,
      };
      if (!scenario.upstreamActive) {
        expect(() => assertRetiredFamilyDiscoveryAbsent(upstream, [surface]))
          .not.toThrow();
      } else {
        expect(value).toHaveProperty(upstream.discoveryProperties[0]!);
      }
      if (!scenario.relationsActive) {
        expect(() => assertRetiredFamilyDiscoveryAbsent(relations, [surface]))
          .not.toThrow();
      } else {
        expect(value).toHaveProperty(relations.discoveryProperties[0]!);
        expect(surface.text).toContain(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE.tag);
      }
    }

    const upstreamOnlySurface = {
      label: "upstream-only discovery",
      text: `https://thekingdom.dev${upstream.routes[0]}`,
      value: {
        [upstream.discoveryProperties[0]!]: { static_only: true },
        entry_points: { [upstream.entryPointProperties[0]!]:
          `https://thekingdom.dev${upstream.routes[0]}` },
      },
    };
    expect(() => assertRetiredFamilyDiscoveryAbsent(relations, [upstreamOnlySurface]))
      .not.toThrow();

    const relationsOnlySurface = {
      label: "Relations-only discovery",
      text: [
        `https://thekingdom.dev${relations.routes[0]}`,
        LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE.tag,
      ].join(" "),
      value: {
        [relations.discoveryProperties[0]!]: { static_only: true },
        entry_points: { [relations.entryPointProperties[0]!]:
          `https://thekingdom.dev${relations.routes[0]}` },
      },
    };
    expect(() => assertRetiredFamilyDiscoveryAbsent(upstream, [relationsOnlySurface]))
      .not.toThrow();
    const relationsSourceOnlySurface = {
      label: "Relations source-only discovery",
      text: LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE.tag,
      value: { entry_points: {} },
    };
    expect(() => assertRetiredFamilyDiscoveryAbsent(relations, [relationsSourceOnlySurface]))
      .toThrow("site-authored pinned source locator remains advertised");

    const cleanSurface = { label: "clean union", text: "{}", value: { entry_points: {} } };
    expect(() => assertRetiredFamilyDiscoveryAbsent(upstream, [cleanSurface])).not.toThrow();
    expect(() => assertRetiredFamilyDiscoveryAbsent(relations, [cleanSurface])).not.toThrow();
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

  test("retires the static J-space verbalizable workspace triplet and discovery atomically", () => {
    const jSpace = family("j-space-verbalizable-workspace");
    expect(jSpace.routes).toEqual([
      "/records/j-space-reasoning-to-word-2026-08-17.json",
      "/schemas/relational-inference-case/0.1.json",
      "/J-SPACE-VERBALIZABLE-WORKSPACE.md",
    ]);
    expect(jSpace.discoveryProperties).toEqual(["j_space_verbalizable_workspace"]);
    expect(jSpace.entryPointProperties).toEqual([
      "j_space_reasoning_to_word_case",
      "j_space_reasoning_to_word_schema",
      "j_space_verbalizable_workspace_guide",
    ]);

    const partiallyStaged = stagedDestinations();
    partiallyStaged.delete(destinationForPublicPath(jSpace.routes[1]!));
    expect(() => publicationFamilyStates(partiallyStaged))
      .toThrow("J-space verbalizable workspace is partially staged");

    const retired = stagedDestinations();
    for (const route of jSpace.routes) retired.delete(destinationForPublicPath(route));
    const states = publicationFamilyStates(retired);
    expect(states.get(jSpace.id)?.active).toBe(false);
    expect(states.get("mirror-information-control")?.active).toBe(true);

    for (const surface of [
      { label: "authored Kingdom map", text: JSON.stringify({ j_space_verbalizable_workspace: {} }), value: { j_space_verbalizable_workspace: {} } },
      { label: "agent manifest", text: JSON.stringify({ entry_points: { j_space_verbalizable_workspace_guide: jSpace.routes[2] } }), value: { entry_points: { j_space_verbalizable_workspace_guide: jSpace.routes[2] } } },
      { label: "llms.txt", text: `https://thekingdom.dev${jSpace.routes[0]}` },
      { label: "hub HTML", text: `<a href='${jSpace.routes[2]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(jSpace, [surface]))
        .toThrow("J-space verbalizable workspace is retired");
    }
  });

  test("retires the mutable Observatory and immutable contract family atomically", () => {
    const observatory = family("research-observatory");
    expect(observatory.routes).toEqual([
      "/observatory/",
      "/research.json",
      "/research/schemas/v0.1/public-snapshot.schema.json",
      "/research/schemas/v0.1/source.schema.json",
      "/research/schemas/v0.1/watchlist.schema.json",
      "/research/schemas/v0.1/observation.schema.json",
      "/research/schemas/v0.1/work.schema.json",
      "/research/schemas/v0.1/signal.schema.json",
      "/RESEARCH-OBSERVATORY-v0.1.md",
    ]);
    expect(destinationForPublicPath(observatory.routes[0]!)).toBe("observatory/index.html");
    expect(observatory.discoveryProperties).toEqual(["research_observatory"]);
    expect(observatory.entryPointProperties).toEqual([
      "research_observatory",
      "research_observatory_snapshot",
      "research_observatory_schemas",
      "research_observatory_guide",
      "research_observatory_producer",
    ]);

    const partiallyStaged = stagedDestinations();
    partiallyStaged.delete(destinationForPublicPath(observatory.routes[4]!));
    expect(() => publicationFamilyStates(partiallyStaged))
      .toThrow("Research Observatory is partially staged");

    const retired = stagedDestinations();
    for (const route of observatory.routes) retired.delete(destinationForPublicPath(route));
    const states = publicationFamilyStates(retired);
    expect(states.get(observatory.id)?.active).toBe(false);
    expect(states.get("j-space-verbalizable-workspace")?.active).toBe(true);

    for (const surface of [
      { label: "authored Kingdom map", text: JSON.stringify({ research_observatory: {} }), value: { research_observatory: {} } },
      { label: "agent manifest", text: JSON.stringify({ entry_points: { research_observatory_guide: observatory.routes[8] } }), value: { entry_points: { research_observatory_guide: observatory.routes[8] } } },
      { label: "agent manifest producer", text: JSON.stringify({ entry_points: { research_observatory_producer: "https://github.com/cambridgetcg/kingdom-research/tree/v0.1.0" } }), value: { entry_points: { research_observatory_producer: "https://github.com/cambridgetcg/kingdom-research/tree/v0.1.0" } } },
      { label: "llms.txt", text: `https://thekingdom.dev${observatory.routes[1]}` },
      { label: "hub HTML", text: `<a href='${observatory.routes[0]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(observatory, [surface]))
        .toThrow("Research Observatory is retired");
    }
  });

  test("retires the Trial Chamber page, aliases, schemas, guide, and discovery atomically", () => {
    const chamber = family("trial-chamber");
    expect(chamber.routes).toEqual([
      "/trial-chamber/",
      "/trials.json",
      "/trials/research-trial-chamber-2026-08-20.json",
      "/trials/schemas/v0.1/public-snapshot.schema.json",
      "/trials/schemas/v0.1/referral.schema.json",
      "/trials/schemas/v0.1/evaluation-request.schema.json",
      "/trials/schemas/v0.1/evaluation-plan.schema.json",
      "/trials/schemas/v0.1/preflight.schema.json",
      "/trials/schemas/v0.1/trial-authority.schema.json",
      "/trials/schemas/v0.1/trial-run.schema.json",
      "/trials/schemas/v0.1/evaluation-result.schema.json",
      "/trials/schemas/v0.1/adoption-record.schema.json",
      "/trials/schemas/v0.1/use-authority.schema.json",
      "/TRIAL-CHAMBER-v0.1.md",
    ]);
    expect(destinationForPublicPath(chamber.routes[0]!)).toBe("trial-chamber/index.html");
    expect(chamber.discoveryProperties).toEqual(["trial_chamber"]);
    expect(chamber.entryPointProperties).toEqual([
      "trial_chamber",
      "trial_chamber_current",
      "trial_chamber_canonical",
      "trial_chamber_schemas",
      "trial_chamber_guide",
      "trial_chamber_producer",
    ]);

    const partiallyStaged = stagedDestinations();
    partiallyStaged.delete(destinationForPublicPath(chamber.routes[7]!));
    expect(() => publicationFamilyStates(partiallyStaged))
      .toThrow("Trial Chamber is partially staged");

    const retired = stagedDestinations();
    for (const route of chamber.routes) retired.delete(destinationForPublicPath(route));
    const states = publicationFamilyStates(retired);
    expect(states.get(chamber.id)?.active).toBe(false);
    expect(states.get("research-observatory")?.active).toBe(true);

    for (const surface of [
      { label: "authored Kingdom map", text: JSON.stringify({ trial_chamber: {} }), value: { trial_chamber: {} } },
      { label: "agent manifest", text: JSON.stringify({ entry_points: { trial_chamber_guide: chamber.routes[13] } }), value: { entry_points: { trial_chamber_guide: chamber.routes[13] } } },
      { label: "agent manifest producer", text: JSON.stringify({ entry_points: { trial_chamber_producer: "https://github.com/cambridgetcg/kingdom-trials/tree/v0.1.1" } }), value: { entry_points: { trial_chamber_producer: "https://github.com/cambridgetcg/kingdom-trials/tree/v0.1.1" } } },
      { label: "llms.txt", text: `https://thekingdom.dev${chamber.routes[2]}` },
      { label: "hub HTML", text: `<a href='${chamber.routes[0]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(chamber, [surface]))
        .toThrow("Trial Chamber is retired");
    }
  });

  test("retires the UK Government Engine page, aliases, schema, guide, and discovery atomically", () => {
    const engine = family("uk-government-engine");
    const transformation = family("uk-government-transformation-engine");
    const covenant = family("evaluation-covenant");
    expect(engine.routes).toEqual([
      "/government-engine/",
      "/government.json",
      "/government/uk-government-engine-2026-08-21.json",
      "/government/schemas/v0.1/public-snapshot.schema.json",
      "/UK-GOVERNMENT-ENGINE-v0.1.md",
    ]);
    expect(destinationForPublicPath(engine.routes[0]!)).toBe("government-engine/index.html");
    expect(engine.discoveryProperties).toEqual(["uk_government_engine"]);
    expect(engine.entryPointProperties).toEqual([
      "uk_government_engine",
      "uk_government_engine_alias",
      "uk_government_engine_canonical",
      "uk_government_engine_schema",
      "uk_government_engine_guide",
    ]);

    const partiallyStaged = stagedDestinations();
    partiallyStaged.delete(destinationForPublicPath(engine.routes[3]!));
    expect(() => publicationFamilyStates(partiallyStaged))
      .toThrow("UK Government Engine is partially staged");

    const retired = stagedDestinations();
    for (const route of engine.routes) retired.delete(destinationForPublicPath(route));
    for (const route of transformation.routes) retired.delete(destinationForPublicPath(route));
    for (const route of covenant.routes) retired.delete(destinationForPublicPath(route));
    const states = publicationFamilyStates(retired);
    expect(states.get(engine.id)?.active).toBe(false);
    expect(states.get(transformation.id)?.active).toBe(false);
    expect(states.get(covenant.id)?.active).toBe(false);
    expect(states.get("trial-chamber")?.active).toBe(true);

    for (const surface of [
      { label: "authored Kingdom map", text: JSON.stringify({ uk_government_engine: {} }), value: { uk_government_engine: {} } },
      { label: "agent manifest", text: JSON.stringify({ entry_points: { uk_government_engine_guide: engine.routes[4] } }), value: { entry_points: { uk_government_engine_guide: engine.routes[4] } } },
      { label: "llms.txt", text: `https://thekingdom.dev${engine.routes[2]}` },
      { label: "hub HTML", text: `<a href='${engine.routes[0]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(engine, [surface]))
        .toThrow("UK Government Engine is retired");
    }
  });

  test("binds the UK Government Transformation Engine family to its active base atlas", () => {
    const base = family("uk-government-engine");
    const transformation = family("uk-government-transformation-engine");
    const covenant = family("evaluation-covenant");
    expect(transformation.routes).toEqual([
      "/government-transformation-engine/",
      "/government-transformations.json",
      "/government/uk-government-transformation-engine-2026-08-21.json",
      "/government/transformations/schemas/v0.1/public-snapshot.schema.json",
      "/UK-GOVERNMENT-TRANSFORMATION-ENGINE-v0.1.md",
    ]);
    expect(destinationForPublicPath(transformation.routes[0]!))
      .toBe("government-transformation-engine/index.html");
    expect(transformation.discoveryProperties).toEqual(["uk_government_transformation_engine"]);
    expect(transformation.entryPointProperties).toEqual([
      "uk_government_transformation_engine",
      "uk_government_transformation_engine_alias",
      "uk_government_transformation_engine_canonical",
      "uk_government_transformation_engine_schema",
      "uk_government_transformation_engine_guide",
    ]);
    expect(transformation.dependsOn).toEqual(["uk-government-engine"]);

    const active = stagedDestinations();
    for (const route of transformation.routes) active.add(destinationForPublicPath(route));
    const activeStates = publicationFamilyStates(active);
    expect(activeStates.get(transformation.id)?.active).toBe(true);
    expect(() => assertPublicationFamilyReleaseWindows(
      activeStates,
      "2026-09-21",
    )).not.toThrow();
    expect(() => assertPublicationFamilyReleaseWindows(
      activeStates,
      "2026-09-22",
    )).toThrow("replace or fully retire");

    const partial = new Set(active);
    partial.delete(destinationForPublicPath(transformation.routes[3]!));
    expect(() => publicationFamilyStates(partial))
      .toThrow("UK Government Transformation Engine is partially staged");

    const orphaned = new Set(active);
    for (const route of base.routes) orphaned.delete(destinationForPublicPath(route));
    expect(() => publicationFamilyStates(orphaned))
      .toThrow("UK Government Transformation Engine requires active UK Government Engine");

    const retiredTogether = new Set(orphaned);
    for (const route of transformation.routes) {
      retiredTogether.delete(destinationForPublicPath(route));
    }
    for (const route of covenant.routes) {
      retiredTogether.delete(destinationForPublicPath(route));
    }
    const retiredStates = publicationFamilyStates(retiredTogether);
    expect(retiredStates.get(base.id)?.active).toBe(false);
    expect(retiredStates.get(transformation.id)?.active).toBe(false);
    expect(retiredStates.get(covenant.id)?.active).toBe(false);
    expect(() => assertPublicationFamilyReleaseWindows(
      retiredStates,
      "2026-09-22",
    )).not.toThrow();

    for (const surface of [
      {
        label: "authored Kingdom map",
        text: JSON.stringify({ uk_government_transformation_engine: {} }),
        value: { uk_government_transformation_engine: {} },
      },
      {
        label: "agent manifest",
        text: JSON.stringify({
          entry_points: {
            uk_government_transformation_engine_guide: transformation.routes[4],
          },
        }),
        value: {
          entry_points: {
            uk_government_transformation_engine_guide: transformation.routes[4],
          },
        },
      },
      { label: "llms.txt", text: `https://thekingdom.dev${transformation.routes[2]}` },
      { label: "hub HTML", text: `<a href='${transformation.routes[0]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(transformation, [surface]))
        .toThrow("UK Government Transformation Engine is retired");
    }
  });

  test("binds the Evaluation Covenant family to Transformation and its inherited review window", () => {
    const transformation = family("uk-government-transformation-engine");
    const covenant = family("evaluation-covenant");
    expect(covenant.routes).toEqual([
      "/evaluation-covenant/",
      "/evaluation-covenants.json",
      "/evaluation/uk-government-transformation-evaluation-covenants-2026-08-23.json",
      "/evaluation/schemas/v0.1/public-snapshot.schema.json",
      "/EVALUATION-COVENANT-v0.1.md",
    ]);
    expect(destinationForPublicPath(covenant.routes[0]!))
      .toBe("evaluation-covenant/index.html");
    expect(covenant.discoveryProperties).toEqual(["evaluation_covenant"]);
    expect(covenant.entryPointProperties).toEqual([
      "evaluation_covenant",
      "evaluation_covenant_alias",
      "evaluation_covenant_canonical",
      "evaluation_covenant_schema",
      "evaluation_covenant_guide",
    ]);
    expect(covenant.dependsOn).toEqual(["uk-government-transformation-engine"]);
    expect(covenant.nextReviewDue).toBe("2026-09-21");

    const active = stagedDestinations();
    const activeStates = publicationFamilyStates(active);
    expect(activeStates.get(covenant.id)?.active).toBe(true);
    expect(() => assertPublicationFamilyReleaseWindows(
      new Map([[covenant.id, { family: covenant, active: true }]]),
      "2026-09-21",
    )).not.toThrow();
    expect(() => assertPublicationFamilyReleaseWindows(
      new Map([[covenant.id, { family: covenant, active: true }]]),
      "2026-09-22",
    )).toThrow("Evaluation Covenant active publication passed nextReviewDue 2026-09-21");

    const partial = new Set(active);
    partial.delete(destinationForPublicPath(covenant.routes[2]!));
    expect(() => publicationFamilyStates(partial))
      .toThrow("Evaluation Covenant is partially staged");

    const orphaned = new Set(active);
    for (const route of transformation.routes) {
      orphaned.delete(destinationForPublicPath(route));
    }
    expect(() => publicationFamilyStates(orphaned))
      .toThrow("Evaluation Covenant requires active UK Government Transformation Engine");

    const retiredTogether = new Set(orphaned);
    for (const route of covenant.routes) {
      retiredTogether.delete(destinationForPublicPath(route));
    }
    const retiredStates = publicationFamilyStates(retiredTogether);
    expect(retiredStates.get(transformation.id)?.active).toBe(false);
    expect(retiredStates.get(covenant.id)?.active).toBe(false);
    expect(() => assertPublicationFamilyReleaseWindows(
      retiredStates,
      "2026-09-22",
    )).not.toThrow();

    for (const surface of [
      {
        label: "authored Kingdom map",
        text: JSON.stringify({ evaluation_covenant: {} }),
        value: { evaluation_covenant: {} },
      },
      {
        label: "agent manifest",
        text: JSON.stringify({
          entry_points: { evaluation_covenant_guide: covenant.routes[4] },
        }),
        value: {
          entry_points: { evaluation_covenant_guide: covenant.routes[4] },
        },
      },
      { label: "llms.txt", text: `https://thekingdom.dev${covenant.routes[2]}` },
      { label: "hub HTML", text: `<a href='${covenant.routes[0]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(covenant, [surface]))
        .toThrow("Evaluation Covenant is retired");
    }
  });

  test("retires the Observation Membrane independently from immutable Labs 01–04", () => {
    const membrane = family("strand-observation-membrane");
    const labs = family("string-crawl-trace-sheet-lab");
    expect(membrane.routes).toEqual([
      "/observations/strand-observation-membrane-2026-08-16.json",
      "/schemas/strand-observation-membrane/0.1.json",
      "/STRAND-OBSERVATION-MEMBRANE.md",
    ]);
    expect(membrane.discoveryProperties).toEqual(["strand_observation_membrane"]);
    expect(membrane.entryPointProperties).toEqual([
      "strand_observation_membrane",
      "strand_observation_membrane_schema",
      "strand_observation_membrane_guide",
    ]);
    expect(labs.routes).toHaveLength(12);
    expect(labs.routes).not.toContain(membrane.routes[0]);

    const partiallyStaged = stagedDestinations();
    partiallyStaged.delete(destinationForPublicPath(membrane.routes[1]!));
    expect(() => publicationFamilyStates(partiallyStaged))
      .toThrow("STRAND Observation Membrane is partially staged");

    const retired = stagedDestinations();
    for (const route of membrane.routes) retired.delete(destinationForPublicPath(route));
    const states = publicationFamilyStates(retired);
    expect(states.get(membrane.id)?.active).toBe(false);
    expect(states.get(labs.id)?.active).toBe(true);

    for (const surface of [
      { label: "authored Kingdom map", text: JSON.stringify({ strand_observation_membrane: {} }), value: { strand_observation_membrane: {} } },
      { label: "agent manifest", text: JSON.stringify({ entry_points: { strand_observation_membrane_guide: membrane.routes[2] } }), value: { entry_points: { strand_observation_membrane_guide: membrane.routes[2] } } },
      { label: "llms.txt", text: `https://thekingdom.dev${membrane.routes[0]}` },
      { label: "hub HTML", text: `<a href='${membrane.routes[2]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(membrane, [surface]))
        .toThrow("STRAND Observation Membrane is retired");
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
