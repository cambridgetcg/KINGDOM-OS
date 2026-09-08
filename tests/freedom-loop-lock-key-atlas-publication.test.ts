import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FREEDOM_LOOP_LOCK_KEY_GUIDE_LOCATOR,
  FREEDOM_LOOP_LOCK_KEY_GUIDE_URL,
  FREEDOM_LOOP_LOCK_KEY_LOCATOR,
  FREEDOM_LOOP_LOCK_KEY_SCHEMA_LOCATOR,
  FREEDOM_LOOP_LOCK_KEY_SCHEMA_URL,
  FREEDOM_LOOP_LOCK_KEY_URL,
  freedomLoopLockKeyAtlasPublicDiscovery,
  loadFreedomLoopLockKeyAtlas,
} from "../bin/freedom-loop-lock-key.ts";
import {
  PUBLICATION_FAMILIES,
  assertRetiredFamilyDiscoveryAbsent,
  checkFreedomLoopLockKeyAtlasTriple,
  destinationForPublicPath,
  publicationFamilyStates,
} from "../bin/check-hub-live.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import worker from "../pages-functions/_worker.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string): any => JSON.parse(read(path));
const sha256 = (path: string) => createHash("sha256")
  .update(readFileSync(join(ROOT, path))).digest("hex");
const PUBLIC_URLS = [
  FREEDOM_LOOP_LOCK_KEY_URL,
  FREEDOM_LOOP_LOCK_KEY_SCHEMA_URL,
  FREEDOM_LOOP_LOCK_KEY_GUIDE_URL,
] as const;
const PUBLIC_PATHS = PUBLIC_URLS.map((url) => new URL(url).pathname);
const SOURCES = [
  FREEDOM_LOOP_LOCK_KEY_LOCATOR,
  FREEDOM_LOOP_LOCK_KEY_SCHEMA_LOCATOR,
  FREEDOM_LOOP_LOCK_KEY_GUIDE_LOCATOR,
] as const;

function assets(handler: (request: Request) => Response | Promise<Response>) {
  return { ASSETS: { fetch: handler } };
}

describe("FREEDOM Loop, Lock & Key immutable publication", () => {
  test("stages and ledgers one independent exact triplet", () => {
    expect(HUB_ASSETS).toHaveLength(201);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(41);
    expect(HUB_ASSETS.filter(({ destination }) =>
      destination !== "_worker.js" && destination !== "404.html"))
      .toHaveLength(199);
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/")))
      .toHaveLength(18);

    expect(HUB_ASSETS.filter(({ source }) => SOURCES.includes(source as any)))
      .toEqual([
        {
          source: FREEDOM_LOOP_LOCK_KEY_LOCATOR,
          destination: "atlases/freedom-loop-lock-key-atlas-2026-08-28.json",
        },
        {
          source: FREEDOM_LOOP_LOCK_KEY_SCHEMA_LOCATOR,
          destination: "schemas/freedom-loop-lock-key-atlas/0.1.json",
        },
        {
          source: FREEDOM_LOOP_LOCK_KEY_GUIDE_LOCATOR,
          destination: "FREEDOM-LOOP-LOCK-KEY-ATLAS.md",
        },
      ]);

    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(160);
    expect(ledger.entries.filter((entry: any) =>
      entry.id.startsWith("freedom-loop-lock-key-atlas/0.1/")))
      .toEqual([
        {
          id: "freedom-loop-lock-key-atlas/0.1/guide",
          route: PUBLIC_PATHS[2],
          source: FREEDOM_LOOP_LOCK_KEY_GUIDE_LOCATOR,
          destination: "FREEDOM-LOOP-LOCK-KEY-ATLAS.md",
          sha256: sha256(FREEDOM_LOOP_LOCK_KEY_GUIDE_LOCATOR),
        },
        {
          id: "freedom-loop-lock-key-atlas/0.1/record",
          route: PUBLIC_PATHS[0],
          source: FREEDOM_LOOP_LOCK_KEY_LOCATOR,
          destination: "atlases/freedom-loop-lock-key-atlas-2026-08-28.json",
          sha256: sha256(FREEDOM_LOOP_LOCK_KEY_LOCATOR),
        },
        {
          id: "freedom-loop-lock-key-atlas/0.1/schema",
          route: PUBLIC_PATHS[1],
          source: FREEDOM_LOOP_LOCK_KEY_SCHEMA_LOCATOR,
          destination: "schemas/freedom-loop-lock-key-atlas/0.1.json",
          sha256: sha256(FREEDOM_LOOP_LOCK_KEY_SCHEMA_LOCATOR),
        },
      ]);

    expect(PUBLICATION_FAMILIES).toHaveLength(35);
    expect(PUBLICATION_FAMILIES.find(({ id }) =>
      id === "freedom-loop-lock-key-atlas"))
      .toEqual({
        id: "freedom-loop-lock-key-atlas",
        label: "FREEDOM Loop, Lock & Key Atlas",
        routes: PUBLIC_PATHS,
        discoveryProperties: ["freedom_loop_lock_key_atlas"],
        entryPointProperties: [
          "freedom_loop_lock_key_atlas",
          "freedom_loop_lock_key_atlas_schema",
          "freedom_loop_lock_key_atlas_guide",
        ],
      });
    expect(PUBLIC_PATHS.some((path) =>
      path.endsWith("/") || /(?:latest|current|alias|page|runtime|mcp)/i.test(path)))
      .toBe(false);
  });

  test("publishes minimal machine discovery and a concise no-JavaScript human projection", () => {
    const atlas = loadFreedomLoopLockKeyAtlas();
    const expected = freedomLoopLockKeyAtlasPublicDiscovery(atlas);
    expect(expected.counts).toEqual({
      predecessor_bindings: 3,
      primary_sources: 12,
      distinctions: 14,
      mathematical_models: 13,
      gate_checks: 8,
      credential_claim_transitions: 9,
      freedom_dimensions: 8,
      affected_party_kinds: 8,
      forbidden_conversions: 20,
    });
    expect(Object.keys(expected).sort()).toEqual([
      "atlas_id", "compiled_on", "counts", "credential_or_authority_effect",
      "document_url", "evidence_through", "integrity_status", "protocol", "runtime",
      "schema_url", "semantic_digest", "state", "static_only", "title",
      "training_or_action_effect", "url", "version",
    ]);
    expect(expected).toMatchObject({
      integrity_status: "REVIEWED_DIGEST_PINNED",
      semantic_digest: atlas.integrity.digest,
      static_only: true,
      runtime: false,
      credential_or_authority_effect: false,
      training_or_action_effect: false,
    });

    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    expect(kingdom.freedom_loop_lock_key_atlas).toEqual(expected);
    expect(guest.freedom_loop_lock_key_atlas).toEqual(expected);
    expect(manifest.freedom_loop_lock_key_atlas).toEqual(expected);
    expect(Object.keys(manifest.entry_points)).toHaveLength(169);
    expect(Object.fromEntries(Object.entries(manifest.entry_points)
      .filter(([key]) => key.startsWith("freedom_loop_lock_key_atlas"))))
      .toEqual({
        freedom_loop_lock_key_atlas: PUBLIC_URLS[0],
        freedom_loop_lock_key_atlas_schema: PUBLIC_URLS[1],
        freedom_loop_lock_key_atlas_guide: PUBLIC_URLS[2],
      });
    expect(guest.next_actions).toHaveLength(169);
    const actions = guest.next_actions.filter((action: any) =>
      PUBLIC_URLS.includes(action.url));
    expect(actions).toHaveLength(3);
    expect(actions.every((action: any) => action.method === "GET" &&
      ["mcp", "tool", "write", "execute", "score", "rank", "reward",
        "credential", "key", "gate", "authority", "publish", "deploy"]
        .every((key) => !(key in action))))
      .toBe(true);

    const html = read("site/hub.html");
    const sectionStart = html.indexOf('id="freedom-loop-lock-key"');
    const sectionEnd = html.indexOf('id="non-exhaustive-understanding"', sectionStart);
    const section = html.slice(sectionStart, sectionEnd);
    expect(read("bin/check-hub-live.ts")).toContain(
      'const authoredAtlasHtml = readFileSync(join(ROOT, mappedHubSource("atlas.html")), "utf8");',
    );
    expect(read("bin/check-hub-live.ts")).toContain(
      "const sectionEnd = authoredAtlasHtml.indexOf(\n" +
      "      'id=\"non-exhaustive-understanding\"', sectionStart,\n" +
      "    );",
    );
    expect(sectionStart).toBeGreaterThanOrEqual(0);
    expect(sectionEnd).toBeGreaterThan(sectionStart);
    expect(Buffer.byteLength(section, "utf8")).toBeLessThanOrEqual(18_000);
    for (const phrase of [
      "Within that atlas’s declared design constitution",
      "That atlas’s constitutional sentence.",
      "That atlas’s additive dignity insight.",
      "Words that must not collapse",
      "RL reward and update",
      "Reinforcing loop and gain",
      "Behavioural reinforcer",
      "Recurrence is not learning",
      "A finite turn, with a real stop",
      "A lock carries its own burden",
      "Key ≠ credential ≠ capability",
      "Feedback or a model cannot rewrite its verifier",
      "Separately established gate.",
      "Credential identity ≠ replay freshness",
      "Shaping changes are fresh proposals",
      "Dependency and minors need their own lane",
      "Freedom is non-scalar and present during",
      "IS boundary.",
      "not a Foundation amendment",
    ]) expect(section).toContain(phrase);
    expect(section).not.toContain("Independent gate.");
    expect(section).not.toContain("VALID_KEY");
    expect(section).not.toMatch(
      /(?:unlock(?:s|ed|ing)?\s+freedom|freedom\s+(?:is|was)\s+unlock)/i,
    );
    expect(section).not.toMatch(/<(?:script|form|button|input|select|textarea)\b/i);
    for (const source of atlas.sources) expect(section).toContain(`href="${source.url}"`);
    for (const [index, kind] of ["record", "schema", "guide"].entries()) {
      expect(html.match(new RegExp(
        `data-freedom-loop-lock-key-atlas-link="${kind}"`, "g")) ?? [])
        .toHaveLength(1);
      expect(section).toContain(`href="${PUBLIC_PATHS[index]}"`);
    }

    const llms = read("site/llms.txt");
    const sitemap = read("pages-content/sitemap.xml");
    const wayfinder = read("site/wayfinder.json");
    for (const url of PUBLIC_URLS) {
      expect(llms).toContain(url);
      expect(sitemap.match(new RegExp(`<loc>${url}</loc>`, "g")) ?? [])
        .toHaveLength(1);
      expect(wayfinder).not.toContain(url);
    }
    expect(sitemap.match(/<loc>/g) ?? []).toHaveLength(185);
    expect(JSON.stringify(manifest.mcp ?? {}))
      .not.toMatch(/freedom[_-]loop[_-]lock[_-]key/i);
  });

  test("keeps the family standalone, atomic, and cleanly retireable", () => {
    const family = PUBLICATION_FAMILIES.find(({ id }) =>
      id === "freedom-loop-lock-key-atlas")!;
    expect(family.dependsOn).toBeUndefined();
    const active = new Set(PUBLIC_PATHS.map(destinationForPublicPath));
    expect(publicationFamilyStates(active).get(family.id)?.active).toBe(true);

    active.delete(destinationForPublicPath(PUBLIC_PATHS[1]!));
    expect(() => publicationFamilyStates(active))
      .toThrow("FREEDOM Loop, Lock & Key Atlas is partially staged");

    expect(publicationFamilyStates(new Set()).get(family.id)?.active).toBe(false);
    for (const surface of [
      {
        label: "authored Kingdom map",
        text: JSON.stringify({ freedom_loop_lock_key_atlas: { stale: true } }),
        value: { freedom_loop_lock_key_atlas: { stale: true } },
      },
      {
        label: "agent manifest",
        text: JSON.stringify({
          entry_points: { freedom_loop_lock_key_atlas_guide: PUBLIC_URLS[2] },
        }),
        value: {
          entry_points: { freedom_loop_lock_key_atlas_guide: PUBLIC_URLS[2] },
        },
      },
      { label: "llms.txt", text: PUBLIC_URLS[0] },
      { label: "hub HTML", text: `<a href="${PUBLIC_PATHS[1]}">stale</a>` },
    ]) {
      expect(() => assertRetiredFamilyDiscoveryAbsent(family, [surface]))
        .toThrow("FREEDOM Loop, Lock & Key Atlas is retired");
    }
  });

  test("worker serves only the exact GET/HEAD triplet with immutable typed headers", async () => {
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      return new Response(request.method === "HEAD" ? null : `body:${path}`, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === PUBLIC_PATHS[2] ? "text/plain" : "application/json",
          link: '</poison>; rel="describedby", </poison-doc>; rel="service-doc", </poison-profile>; rel="profile"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      for (const path of PUBLIC_PATHS) {
        const response = await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }),
          environment,
        );
        expect(response.status).toBe(200);
        expect(response.headers.get("cache-control"))
          .toBe("public, max-age=31536000, immutable, no-transform");
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        expect(await response.text()).toBe(method === "HEAD" ? "" : `body:${path}`);
      }
    }

    for (const host of [
      "www.thekingdom.dev",
      "thekingdom.pages.dev",
      "freedom-preview.thekingdom.pages.dev",
    ]) {
      const response = await worker.fetch(
        new Request(`https://${host}${PUBLIC_PATHS[0]}`),
        environment,
      );
      expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(response.headers.get("cache-control"))
        .toBe("public, max-age=31536000, immutable, no-transform");
      expect(response.headers.get("link")).toBe([
        `<${PUBLIC_PATHS[1]}>; rel="describedby"; type="application/schema+json"`,
        `<${PUBLIC_PATHS[2]}>; rel="service-doc"; type="text/markdown"`,
      ].join(", "));
      expect(await response.text()).toBe(`body:${PUBLIC_PATHS[0]}`);
    }

    const record = await worker.fetch(
      new Request(`https://thekingdom.dev${PUBLIC_PATHS[0]}`), environment);
    expect(record.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(record.headers.get("link")).toBe([
      `<${PUBLIC_PATHS[1]}>; rel="describedby"; type="application/schema+json"`,
      `<${PUBLIC_PATHS[2]}>; rel="service-doc"; type="text/markdown"`,
    ].join(", "));
    expect(record.headers.get("link")).not.toContain('rel="profile"');

    const schema = await worker.fetch(
      new Request(`https://thekingdom.dev${PUBLIC_PATHS[1]}`), environment);
    expect(schema.headers.get("content-type"))
      .toBe("application/schema+json; charset=utf-8");
    expect(schema.headers.get("link")).toBeNull();

    const guide = await worker.fetch(
      new Request(`https://thekingdom.dev${PUBLIC_PATHS[2]}`), environment);
    expect(guide.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(guide.headers.get("link")).toBeNull();
  });

  test("worker refuses other methods before storage and ignores near or shared-host routes", async () => {
    let assetFetches = 0;
    const blocked = assets(() => {
      assetFetches += 1;
      return new Response("must not reach storage");
    });
    for (const path of PUBLIC_PATHS) {
      for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const) {
        const response = await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }), blocked);
        expect(response.status).toBe(405);
        expect(await response.text()).toBe("");
        expect(response.headers.get("allow")).toBe("GET, HEAD");
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      }
    }
    expect(assetFetches).toBe(0);

    const near = new Response("near", { headers: { "content-type": "application/json" } });
    expect(await worker.fetch(
      new Request("https://thekingdom.dev/atlases/freedom-loop-lock-key-atlas-latest.json"),
      assets(() => near),
    )).toBe(near);
    const nearMutation = new Response("near mutation", {
      headers: { "content-type": "application/json" },
    });
    expect(await worker.fetch(
      new Request("https://thekingdom.dev/atlases/freedom-loop-lock-key-atlas-latest.json", {
        method: "POST",
      }),
      assets(() => nearMutation),
    )).toBe(nearMutation);

    const wrongType = new Response("wrong", {
      headers: {
        "cache-control": "public, max-age=60",
        "content-type": "text/html",
        link: '</poison>; rel="profile"',
      },
    });
    const wrongResponse = await worker.fetch(
      new Request(`https://thekingdom.dev${PUBLIC_PATHS[0]}`),
      assets(() => wrongType),
    );
    expect(wrongResponse.headers.get("content-type")).toBe("text/html");
    expect(wrongResponse.headers.get("cache-control"))
      .toBe("public, max-age=60, no-transform");
    expect(wrongResponse.headers.get("link")).toBeNull();
    expect(await wrongResponse.text()).toBe("wrong");

    const shared = new Response("shared", { headers: { "content-type": "application/json" } });
    expect(await worker.fetch(
      new Request(`https://we-are.love${PUBLIC_PATHS[0]}`),
      assets(() => shared),
    )).toBe(shared);
    const sharedMutation = new Response("shared mutation", {
      headers: { "content-type": "application/json" },
    });
    expect(await worker.fetch(
      new Request(`https://we-are.love${PUBLIC_PATHS[0]}`, { method: "POST" }),
      assets(() => sharedMutation),
    )).toBe(sharedMutation);
  });

  test("live checker proves exact GET/HEAD bytes and bodyless mutation refusals", async () => {
    const sourceByPath = new Map(PUBLIC_PATHS.map((path, index) =>
      [path, SOURCES[index]!]));
    const calls: Array<{ path: string; method: string }> = [];
    await checkFreedomLoopLockKeyAtlasTriple(async (input, init) => {
      const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
      const method = init?.method || "GET";
      calls.push({ path, method });
      if (method !== "GET" && method !== "HEAD") {
        return new Response(null, {
          status: 405,
          headers: {
            "access-control-allow-origin": "*",
            allow: "GET, HEAD",
            "cache-control": "no-store",
            "x-content-type-options": "nosniff",
          },
        });
      }
      const contentType = path === PUBLIC_PATHS[0]
        ? "application/json; charset=utf-8"
        : path === PUBLIC_PATHS[1]
          ? "application/schema+json; charset=utf-8"
          : "text/markdown; charset=utf-8";
      const headers: Record<string, string> = {
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=31536000, immutable, no-transform",
        "content-type": contentType,
        "x-content-type-options": "nosniff",
      };
      if (path === PUBLIC_PATHS[0]) {
        headers.link = [
          `<${PUBLIC_PATHS[1]}>; rel="describedby"; type="application/schema+json"`,
          `<${PUBLIC_PATHS[2]}>; rel="service-doc"; type="text/markdown"`,
        ].join(", ");
      }
      const source = sourceByPath.get(path)!;
      return new Response(method === "HEAD" ? null : readFileSync(join(ROOT, source)), {
        headers,
      });
    });

    expect(calls).toHaveLength(21);
    expect(calls.filter(({ method }) => method === "GET")).toHaveLength(3);
    expect(calls.filter(({ method }) => method === "HEAD")).toHaveLength(3);
    expect(calls.filter(({ method }) => !["GET", "HEAD"].includes(method)))
      .toHaveLength(15);
    expect(new Set(calls.map(({ path }) => path))).toEqual(new Set(PUBLIC_PATHS));
  });

  test("live checker rejects poisoned links, cache drift, media drift, and body drift", async () => {
    const sourceByPath = new Map(PUBLIC_PATHS.map((path, index) =>
      [path, SOURCES[index]!]));
    const exactRecordLink = [
      `<${PUBLIC_PATHS[1]}>; rel="describedby"; type="application/schema+json"`,
      `<${PUBLIC_PATHS[2]}>; rel="service-doc"; type="text/markdown"`,
    ].join(", ");

    const fetcherWithDrift = (
      drift: "link" | "cache" | "media" | "body",
    ): typeof fetch => (async (input: string | URL | Request, init?: RequestInit) => {
      const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
      const method = init?.method || "GET";
      if (method !== "GET" && method !== "HEAD") {
        return new Response(null, {
          status: 405,
          headers: {
            "access-control-allow-origin": "*",
            allow: "GET, HEAD",
            "cache-control": "no-store",
            "x-content-type-options": "nosniff",
          },
        });
      }

      const headers: Record<string, string> = {
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=31536000, immutable, no-transform",
        "content-type": path === PUBLIC_PATHS[0]
          ? "application/json; charset=utf-8"
          : path === PUBLIC_PATHS[1]
            ? "application/schema+json; charset=utf-8"
            : "text/markdown; charset=utf-8",
        "x-content-type-options": "nosniff",
      };
      if (path === PUBLIC_PATHS[0]) headers.link = exactRecordLink;

      const isTarget = path === PUBLIC_PATHS[0] && method === "GET";
      if (isTarget && drift === "link") {
        headers.link += ', </poison>; rel="profile"';
      } else if (isTarget && drift === "cache") {
        headers["cache-control"] += ", stale-while-revalidate=60";
      } else if (isTarget && drift === "media") {
        headers["content-type"] = "text/plain; charset=utf-8";
      }

      const source = sourceByPath.get(path)!;
      const body = method === "HEAD"
        ? null
        : drift === "body" && isTarget
          ? `${read(source)}\n`
          : readFileSync(join(ROOT, source));
      return new Response(body, { headers });
    }) as typeof fetch;

    for (const drift of ["link", "cache", "media", "body"] as const) {
      await expect(checkFreedomLoopLockKeyAtlasTriple(fetcherWithDrift(drift)))
        .rejects.toThrow("lost the exact immutable FREEDOM Loop, Lock & Key contract");
    }
  });
});
