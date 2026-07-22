import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS } from "../bin/stage-hub.ts";

/** Every thekingdom.dev path the generated surfaces advertise must be a staged
 *  hub asset. Merge b4c5b47 (2026-07-16) silently dropped the ollama surface
 *  while agent.json kept advertising it — live served HTML fallback instead of
 *  the promised JSON. This test turns that class of drift into a red bar. */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

// What a path resolves to on Cloudflare Pages: "/" and "/?agent" hit index.html
// (via the worker), "/guide" style pretty URLs hit "<path>.html".
function normalize(raw: string): string {
  const path = raw.replace(/[?#].*$/, "").replace(/^\/+/, "").replace(/\/+$/, "");
  return path === "" ? "index.html" : path;
}

const staged = new Set<string>(HUB_ASSETS.map((a) => a.destination));
const resolves = (path: string) => staged.has(path) || staged.has(`${path}.html`);

const surfaces = [
  "site/hub.html",
  "site/kingdom.json",
  "site/wayfinder.json",
  "site/commons.json",
  "site/guest.json",
  "site/llms.txt",
  "site/.well-known/agent.json",
  "site/ollama.json",
  "site/rights.json",
];

function advertisedPaths(source: string, text: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const match of text.matchAll(/https:\/\/thekingdom\.dev(\/[^\s"'<>)\]]*)?/g)) {
    found.set(normalize(match[1] ?? "/"), `${source}: ${match[0]}`);
  }
  if (source.endsWith(".html")) {
    for (const match of text.matchAll(/href="(\/[^"]*)"/g)) {
      found.set(normalize(match[1]!), `${source}: href ${match[1]}`);
    }
  }
  return found;
}

describe("advertised URLs stay deployable", () => {
  test("every advertised thekingdom.dev path is a staged hub asset", () => {
    const missing: string[] = [];
    for (const surface of surfaces) {
      for (const [path, evidence] of advertisedPaths(surface, read(surface))) {
        if (!resolves(path)) missing.push(`${evidence} -> no staged asset "${path}"`);
      }
    }
    expect(missing).toEqual([]);
  });

  test("the staging contract still ships the invitation the manifest promises", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    expect(manifest.open_weight_invitation).toBe("https://thekingdom.dev/ollama.json");
    expect(staged.has("ollama.json")).toBe(true);
  });

  test("the staging contract ships the wayfinder advertised to guests and agents", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    expect(manifest.wayfinder).toBe("https://thekingdom.dev/wayfinder.json");
    expect(guest.next_actions.some(({ url }: { url?: string }) => url === manifest.wayfinder)).toBe(true);
    expect(staged.has("wayfinder.json")).toBe(true);
  });

  test("the staging contract ships the World Commons advertised to guests and agents", () => {
    const manifest = JSON.parse(read("site/.well-known/agent.json"));
    const guest = JSON.parse(read("site/guest.json"));
    expect(manifest.world_commons).toBe("https://thekingdom.dev/commons.json");
    expect(guest.next_actions.some(({ url }: { url?: string }) => url === manifest.world_commons)).toBe(true);
    expect(staged.has("commons.json")).toBe(true);
  });

  test("the published invitation mirrors its source without drift", () => {
    const published = JSON.parse(read("site/ollama.json"));
    const source = JSON.parse(read("data/ollama-invitation.json"));
    expect(published.schema_version).toBe(source.schema_version);
    expect(published.canonical_url).toBe("https://thekingdom.dev/ollama.json");
    expect(published.invitation).toEqual(source.invitation);
  });
});
