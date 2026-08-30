import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_GUIDE_RAW_SHA256,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_RECORD_RAW_SHA256,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_SCHEMA_RAW_SHA256,
  IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
} from "../bin/is-sustainability-direction.ts";
import { checkIsSustainabilityDirectionAtlasTriple } from "../bin/check-hub-live.ts";
import worker, {
  IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL,
} from "../pages-functions/_worker.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const RECORD_PATH = "/atlases/is-sustainability-direction-atlas-2026-08-29.json";
const SCHEMA_PATH = "/schemas/is-sustainability-direction-atlas/0.1.json";
const GUIDE_PATH = "/IS-SUSTAINABILITY-DIRECTION-ATLAS.md";
const PUBLIC_PATHS = [RECORD_PATH, SCHEMA_PATH, GUIDE_PATH] as const;
const SOURCES = [
  "data/isness/is-sustainability-direction-atlas.v0.1.json",
  "schemas/is-sustainability-direction-atlas-v0.1.schema.json",
  "references/is-sustainability-direction-atlas.md",
] as const;
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable, no-transform";

function assets(handler: (request: Request) => Response | Promise<Response>) {
  return { ASSETS: { fetch: handler } };
}

function sourceType(path: string): string {
  return path === GUIDE_PATH ? "text/plain" : "application/json";
}

function exactResponse(request: Request): Response {
  const path = new URL(request.url).pathname;
  const index = PUBLIC_PATHS.indexOf(path as typeof PUBLIC_PATHS[number]);
  if (index < 0) return new Response("missing", { status: 404 });
  if (request.method !== "GET" && request.method !== "HEAD") {
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
    "cache-control": IMMUTABLE_CACHE,
    "content-type": index === 0
      ? "application/json; charset=utf-8"
      : index === 1
        ? "application/schema+json; charset=utf-8"
        : "text/markdown; charset=utf-8",
    "x-content-type-options": "nosniff",
  };
  if (index === 0) {
    headers.link = [
      `<${SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
      `<${GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
    ].join(", ");
  }
  return new Response(
    request.method === "HEAD" ? null : readFileSync(join(ROOT, SOURCES[index]!)),
    { status: 200, headers },
  );
}

describe("IS, Sustainability & Direction Atlas immutable edge contract", () => {
  test("activates only the exact independently reviewed semantic/raw seal", async () => {
    expect(IS_SUSTAINABILITY_DIRECTION_PUBLICATION_SEAL).toEqual({
      state: "REVIEWED",
      reviewedSemanticSha256: IS_SUSTAINABILITY_DIRECTION_REVIEWED_SEMANTIC_SHA256,
      recordRawSha256: IS_SUSTAINABILITY_DIRECTION_REVIEWED_RECORD_RAW_SHA256,
      schemaRawSha256: IS_SUSTAINABILITY_DIRECTION_REVIEWED_SCHEMA_RAW_SHA256,
      guideRawSha256: IS_SUSTAINABILITY_DIRECTION_REVIEWED_GUIDE_RAW_SHA256,
    });
    await expect(checkIsSustainabilityDirectionAtlasTriple((async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => exactResponse(input instanceof Request ? input : new Request(String(input), init))) as typeof fetch))
      .resolves.toBeUndefined();
  });

  test("serves the exact GET/HEAD triplet on every Kingdom host", async () => {
    for (const host of [
      "thekingdom.dev",
      "www.thekingdom.dev",
      "thekingdom.pages.dev",
      "release-42.thekingdom.pages.dev",
    ]) {
      for (const method of ["GET", "HEAD"] as const) {
        for (const path of PUBLIC_PATHS) {
          const body = `opaque edge fixture: ${path}`;
          const response = await worker.fetch(
            new Request(`https://${host}${path}`, { method }),
            assets((request) => new Response(request.method === "HEAD" ? null : body, {
              headers: {
                "cache-control": "public, max-age=60",
                "content-type": sourceType(path),
                link: "</poison>; rel=\"describedby\", </profile>; rel=\"profile\"",
              },
            })),
          );
          expect(response.status).toBe(200);
          expect(response.headers.get("cache-control")).toBe(IMMUTABLE_CACHE);
          expect(response.headers.get("access-control-allow-origin")).toBe("*");
          expect(response.headers.get("x-content-type-options")).toBe("nosniff");
          expect(await response.text()).toBe(method === "HEAD" ? "" : body);

          if (path === RECORD_PATH) {
            expect(response.headers.get("content-type"))
              .toBe("application/json; charset=utf-8");
            expect(response.headers.get("link")).toBe([
              `<${SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
              `<${GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
            ].join(", "));
          } else if (path === SCHEMA_PATH) {
            expect(response.headers.get("content-type"))
              .toBe("application/schema+json; charset=utf-8");
            expect(response.headers.get("link")).toBeNull();
          } else {
            expect(response.headers.get("content-type"))
              .toBe("text/markdown; charset=utf-8");
            expect(response.headers.get("link")).toBeNull();
          }
        }
      }
    }
  });

  test("refuses every other exact-route method before storage with an empty 405", async () => {
    let assetFetches = 0;
    const environment = assets(() => {
      assetFetches += 1;
      return new Response("must not reach storage");
    });
    for (const host of [
      "thekingdom.dev",
      "www.thekingdom.dev",
      "thekingdom.pages.dev",
      "release-42.thekingdom.pages.dev",
    ]) {
      for (const path of PUBLIC_PATHS) {
        for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const) {
          const response = await worker.fetch(
            new Request(`https://${host}${path}`, { method }),
            environment,
          );
          expect(response.status).toBe(405);
          expect(await response.text()).toBe("");
          expect(response.headers.get("allow")).toBe("GET, HEAD");
          expect(response.headers.get("cache-control")).toBe("no-store");
          expect(response.headers.get("access-control-allow-origin")).toBe("*");
          expect(response.headers.get("x-content-type-options")).toBe("nosniff");
          expect(response.headers.get("link")).toBeNull();
        }
      }
    }
    expect(assetFetches).toBe(0);
  });

  test("does not capture missing, wrong-media, near-route, or shared-host responses", async () => {
    const missing = await worker.fetch(
      new Request(`https://thekingdom.dev${RECORD_PATH}`),
      assets(() => new Response("missing", {
        status: 404,
        headers: { "cache-control": IMMUTABLE_CACHE, "content-type": "text/html", link: "</poison>" },
      })),
    );
    expect(missing.status).toBe(404);
    expect(missing.headers.get("cache-control")).toBe("no-store");
    expect(missing.headers.get("link")).toBeNull();
    expect(await missing.text()).toBe("missing");

    for (const path of [
      "/atlases/is-sustainability-direction-atlas-latest.json",
      "/schemas/is-sustainability-direction-atlas/0.2.json",
      "/IS-SUSTAINABILITY-DIRECTION-ATLAS-v0.1.md",
    ]) {
      const near = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`, { method: "POST" }),
        assets(() => new Response("near", { headers: { "content-type": "application/json" } })),
      );
      expect(near.status).toBe(200);
      expect(await near.text()).toBe("near");
    }

    for (const path of PUBLIC_PATHS) {
      const wrongType = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        assets(() => new Response("wrong", {
          headers: {
            "cache-control": "public, max-age=60",
            "content-type": "text/html",
            link: "</poison>; rel=\"profile\"",
          },
        })),
      );
      expect(wrongType.status).toBe(200);
      expect(wrongType.headers.get("content-type")).toBe("text/html");
      expect(wrongType.headers.get("cache-control"))
        .toBe("public, max-age=60, no-transform");
      expect(wrongType.headers.get("link")).toBeNull();
      expect(await wrongType.text()).toBe("wrong");
    }

    const shared = new Response("shared", { headers: { "content-type": "application/json" } });
    expect(await worker.fetch(
      new Request(`https://we-are.love${RECORD_PATH}`, { method: "POST" }),
      assets(() => shared),
    )).toBe(shared);
  });

  test("never wraps or caches an upstream partial body as the immutable artifact", async () => {
    for (const method of ["GET", "HEAD"] as const) {
      for (const path of PUBLIC_PATHS) {
        const response = await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }),
          assets(() => new Response(method === "HEAD" ? null : "partial", {
            status: 206,
            headers: {
              "cache-control": IMMUTABLE_CACHE,
              "content-type": sourceType(path),
              link: "</poison>; rel=\"profile\"",
            },
          })),
        );
        expect(response.status).toBe(206);
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(response.headers.get("link")).toBeNull();
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        expect(await response.text()).toBe(method === "HEAD" ? "" : "partial");
      }
    }
  });
});
