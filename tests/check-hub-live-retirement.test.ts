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

  test("retires the Being, Access & Aftermath triplet and all of its discovery together", () => {
    const being = family("being-access-aftermath");
    expect(being.routes).toEqual([
      "/atlases/being-access-aftermath-atlas-2026-08-13.json",
      "/schemas/being-access-aftermath-atlas/0.1.json",
      "/BEING-ACCESS-AFTERMATH-ATLAS.md",
    ]);
    expect(being.discoveryProperties).toEqual(["being_access_aftermath_atlas"]);
    expect(being.entryPointProperties).toEqual([
      "being_access_aftermath_atlas",
      "being_access_aftermath_atlas_schema",
      "being_access_aftermath_atlas_guide",
    ]);

    const partiallyStaged = stagedDestinations();
    partiallyStaged.delete(destinationForPublicPath(being.routes[1]!));
    expect(() => publicationFamilyStates(partiallyStaged))
      .toThrow("Being, Access & Aftermath is partially staged");

    const retired = stagedDestinations();
    for (const route of being.routes) retired.delete(destinationForPublicPath(route));
    expect(publicationFamilyStates(retired).get(being.id)?.active).toBe(false);

    const staleDiscovery = { being_access_aftermath_atlas: { stale: true } };
    const staleEntryPoints = {
      entry_points: { being_access_aftermath_atlas_guide: being.routes[2] },
    };
    for (const surface of [
      { label: "authored Kingdom map", text: JSON.stringify(staleDiscovery), value: staleDiscovery },
      { label: "agent manifest", text: JSON.stringify(staleEntryPoints), value: staleEntryPoints },
      { label: "llms.txt", text: `https://thekingdom.dev${being.routes[0]}` },
      { label: "hub HTML", text: `<a href='${being.routes[2]}'>stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(being, [surface]))
        .toThrow("Being, Access & Aftermath is retired");
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
