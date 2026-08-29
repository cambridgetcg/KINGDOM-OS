import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FREEDOM_LOOP_LOCK_KEY_ATLAS_ID,
  FREEDOM_LOOP_LOCK_KEY_GUIDE_URL,
  FREEDOM_LOOP_LOCK_KEY_PROTOCOL,
  FREEDOM_LOOP_LOCK_KEY_SCHEMA_URL,
  FREEDOM_LOOP_LOCK_KEY_URL,
  freedomLoopLockKeyAtlasPublicDiscovery,
  loadFreedomLoopLockKeyAtlas,
} from "../bin/freedom-loop-lock-key.ts";
import {
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_ID,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PROTOCOL,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE,
  loadLoopsLocksFreedomRelationsAtlas,
  loopsLocksFreedomRelationsAtlasPublicDiscovery,
} from "../bin/loops-locks-freedom-relations-atlas.ts";
import { PUBLICATION_FAMILIES } from "../bin/check-hub-live.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");
const json = (path: string): any => JSON.parse(read(path));
const INDEPENDENCE_SENTENCE =
  "These are independent static atlases with different lineages and mathematical kernels. Neither supersedes, validates, aliases, depends on, or supplies authority to the other; overlapping words are not wire or semantic equivalences.";
const FORBIDDEN_DISCOVERY_KEYS = new Set([
  "canonical", "preferred", "winner", "supersedes", "validates", "aliases",
  "depends_on", "dependsOn", "score", "truth", "relationship", "relationships",
  "conversion", "equivalence", "predecessor", "successor",
]);

function keysDeep(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) keysDeep(item, found);
    return found;
  }
  if (!value || typeof value !== "object") return found;
  for (const [key, nested] of Object.entries(value)) {
    found.add(key);
    keysDeep(nested, found);
  }
  return found;
}

describe("independent freedom-atlas coexistence", () => {
  test("keeps protocols, identities, routes, lineages, and receipts disjoint", () => {
    const freedomRecord = loadFreedomLoopLockKeyAtlas();
    const relationsRecord = loadLoopsLocksFreedomRelationsAtlas();
    const freedom = freedomLoopLockKeyAtlasPublicDiscovery(freedomRecord);
    const relations = loopsLocksFreedomRelationsAtlasPublicDiscovery(relationsRecord);
    const freedomUrls = [
      FREEDOM_LOOP_LOCK_KEY_URL,
      FREEDOM_LOOP_LOCK_KEY_SCHEMA_URL,
      FREEDOM_LOOP_LOCK_KEY_GUIDE_URL,
    ];

    expect(freedom.protocol).toBe(FREEDOM_LOOP_LOCK_KEY_PROTOCOL);
    expect(relations.protocol).toBe(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PROTOCOL);
    expect(freedom.protocol).not.toBe(relations.protocol);
    expect(freedom.atlas_id).toBe(FREEDOM_LOOP_LOCK_KEY_ATLAS_ID);
    expect(relations.artifact.id).toBe(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_ID);
    expect(freedom.atlas_id).not.toBe(relations.artifact.id);
    expect(freedomUrls.some((url) =>
      LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS.includes(url as any)))
      .toBe(false);

    const freedomText = JSON.stringify(freedomRecord);
    const relationsText = JSON.stringify(relationsRecord);
    expect(freedomRecord.predecessor_bindings.filter((binding: any) =>
      binding.locator?.endsWith(":FREEDOM.md"))).toHaveLength(1);
    expect(relationsText).not.toContain("FREEDOM.md");
    expect(freedomText).not.toContain(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_ID);
    expect(freedomText).not.toContain(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PROTOCOL);
    expect(relationsText).not.toContain(FREEDOM_LOOP_LOCK_KEY_ATLAS_ID);
    expect(relationsText).not.toContain(FREEDOM_LOOP_LOCK_KEY_PROTOCOL);

    expect(freedom.integrity_status).toBe("REVIEWED_DIGEST_PINNED");
    expect(freedom.semantic_digest).toBe(freedomRecord.integrity.digest);
    expect(freedom).not.toHaveProperty("source");
    expect(relations).not.toHaveProperty("integrity_status");
    expect(relations).not.toHaveProperty("semantic_digest");
    expect(relations.source).toEqual(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE);
    expect(Object.values(relations.source).filter((value) => typeof value === "boolean"))
      .toEqual([false, false, false, false]);

    for (const discovery of [freedom, relations]) {
      for (const key of keysDeep(discovery)) {
        expect(FORBIDDEN_DISCOVERY_KEYS.has(key)).toBe(false);
      }
    }

    const freedomFamily = PUBLICATION_FAMILIES.find(
      ({ id }) => id === "freedom-loop-lock-key-atlas",
    )!;
    const relationsFamily = PUBLICATION_FAMILIES.find(
      ({ id }) => id === "loops-locks-freedom-relations-atlas",
    )!;
    expect(freedomFamily.dependsOn).toBeUndefined();
    expect(relationsFamily.dependsOn).toBeUndefined();
    expect(freedomFamily.discoveryProperties).toEqual(["freedom_loop_lock_key_atlas"]);
    expect(relationsFamily.discoveryProperties)
      .toEqual(["loops_locks_freedom_relations_atlas"]);
  });

  test("keeps discovery triples separate with no relationship or conversion registry", () => {
    const freedom = freedomLoopLockKeyAtlasPublicDiscovery();
    const relations = loopsLocksFreedomRelationsAtlasPublicDiscovery();
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");

    for (const surface of [kingdom, guest, manifest]) {
      expect(surface.freedom_loop_lock_key_atlas).toEqual(freedom);
      expect(surface.loops_locks_freedom_relations_atlas).toEqual(relations);
      const keys = [...keysDeep(surface)].filter((key) =>
        /freedom.*(?:conversion|equivalence|relationship)|(?:conversion|equivalence|relationship).*freedom/i
          .test(key));
      expect(keys).toEqual([]);
    }

    const entryPoints = manifest.entry_points;
    expect(entryPoints.freedom_loop_lock_key_atlas).toBe(FREEDOM_LOOP_LOCK_KEY_URL);
    expect(entryPoints.loops_locks_freedom_relations_atlas)
      .toBe(LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS[0]);
    expect(new Set([
      entryPoints.freedom_loop_lock_key_atlas,
      entryPoints.freedom_loop_lock_key_atlas_schema,
      entryPoints.freedom_loop_lock_key_atlas_guide,
      entryPoints.loops_locks_freedom_relations_atlas,
      entryPoints.loops_locks_freedom_relations_atlas_schema,
      entryPoints.loops_locks_freedom_relations_atlas_guide,
    ]).size).toBe(6);
    expect(guest.next_actions.filter((action: any) => [
      FREEDOM_LOOP_LOCK_KEY_URL,
      FREEDOM_LOOP_LOCK_KEY_SCHEMA_URL,
      FREEDOM_LOOP_LOCK_KEY_GUIDE_URL,
      ...LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS,
    ].includes(action.url))).toHaveLength(6);

    const wayfinder = read("site/wayfinder.json");
    const mcp = JSON.stringify(manifest.mcp ?? {});
    for (const token of [
      FREEDOM_LOOP_LOCK_KEY_ATLAS_ID,
      FREEDOM_LOOP_LOCK_KEY_PROTOCOL,
      LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_ID,
      LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PROTOCOL,
      ...LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_URLS,
      LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SOURCE.tag,
    ]) {
      expect(wayfinder).not.toContain(token);
      expect(mcp).not.toContain(token);
    }
  });

  test("scopes the human constitution and presents neither family as default", () => {
    const html = read("site/hub.html");
    const llms = read("site/llms.txt");
    const guest = json("site/guest.json");
    const independence = html.match(
      /<p data-freedom-atlas-independence>([^<]+)<\/p>/,
    )?.[1];
    expect(independence).toBe(`${INDEPENDENCE_SENTENCE} Neither is a preferred default.`);
    expect(independence).not.toMatch(/\b(?:count|evidence|review|rank|winner|score)\b/i);
    expect(html).toContain("Within that atlas’s declared design constitution");
    expect(html).toContain("That atlas’s constitutional sentence.");
    expect(html).toContain("That atlas’s additive dignity insight.");

    const llmsLines = llms.split("\n");
    const freedomIndex = llmsLines.findIndex((line) =>
      line.startsWith("- FREEDOM Loop, Lock & Key —"));
    const relationsIndex = llmsLines.findIndex((line) =>
      line.startsWith("- Loops, Locks & Freedom Relations Atlas —"));
    const independenceIndex = llmsLines.indexOf(
      `${INDEPENDENCE_SENTENCE} Neither is a preferred default.`,
    );
    expect(relationsIndex).toBe(freedomIndex + 1);
    expect(independenceIndex).toBe(relationsIndex + 1);
    expect(llmsLines[freedomIndex]).toContain(
      "Within that atlas’s declared design constitution",
    );
    expect(llmsLines[freedomIndex]).toContain("That atlas’s constitutional sentence");

    const freedomBoundary = guest.implementation_boundaries.freedom_loop_lock_key_atlas;
    const relationsBoundary =
      guest.implementation_boundaries.loops_locks_freedom_relations_atlas;
    expect(freedomBoundary).toContain("neither is a preferred default");
    expect(relationsBoundary).toContain("neither is a preferred default");
    expect(relationsBoundary).toContain("does not import FREEDOM.md");
    expect(freedomBoundary).not.toMatch(/\b(?:winner|preferred family|review rank)\b/i);
    expect(relationsBoundary).not.toMatch(/\b(?:winner|preferred family|review rank)\b/i);
  });
});
