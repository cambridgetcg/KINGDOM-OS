import { describe, expect, test } from "bun:test";

import worker from "../pages-functions/_worker.js";

const RECORD_PATH = "/atlases/non-exhaustive-understanding-atlas-2026-08-29.json";
const SCHEMA_PATH = "/schemas/non-exhaustive-understanding-atlas/0.1.json";
const GUIDE_PATH = "/NON-EXHAUSTIVE-UNDERSTANDING-ATLAS.md";
const PUBLIC_PATHS = [RECORD_PATH, SCHEMA_PATH, GUIDE_PATH] as const;
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable, no-transform";

function assets(handler: (request: Request) => Response | Promise<Response>) {
  return { ASSETS: { fetch: handler } };
}

function sourceType(path: string): string {
  return path === GUIDE_PATH ? "text/plain" : "application/json";
}

describe("Non-Exhaustive Understanding Atlas immutable edge contract", () => {
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

  test("refuses all other exact-route methods before storage with an empty 405", async () => {
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

  test("does not synthesize missing bytes or capture near routes, wrong media, or shared hosts", async () => {
    const missing = await worker.fetch(
      new Request(`https://thekingdom.dev${RECORD_PATH}`),
      assets(() => new Response("missing", {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      })),
    );
    expect(missing.status).toBe(404);
    expect(missing.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(await missing.text()).toBe("missing");

    for (const path of [
      "/atlases/non-exhaustive-understanding-atlas-latest.json",
      "/schemas/non-exhaustive-understanding-atlas/0.2.json",
      "/NON-EXHAUSTIVE-UNDERSTANDING-ATLAS-v0.1.md",
    ]) {
      const near = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`, { method: "POST" }),
        assets(() => new Response("near", {
          headers: { "content-type": "application/json" },
        })),
      );
      expect(near.status).toBe(200);
      expect(await near.text()).toBe("near");
    }

    const wrongType = await worker.fetch(
      new Request(`https://thekingdom.dev${RECORD_PATH}`),
      assets(() => new Response("wrong", {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": "text/html",
          link: "</poison>; rel=\"profile\"",
        },
      })),
    );
    expect(wrongType.headers.get("content-type")).toBe("text/html");
    expect(wrongType.headers.get("cache-control")).toBe("public, max-age=60, no-transform");
    expect(wrongType.headers.get("link")).toBeNull();
    expect(await wrongType.text()).toBe("wrong");

    const shared = new Response("shared", {
      headers: { "content-type": "application/json" },
    });
    expect(await worker.fetch(
      new Request(`https://we-are.love${RECORD_PATH}`, { method: "POST" }),
      assets(() => shared),
    )).toBe(shared);
  });

  test("never wraps or caches a partial upstream body as the immutable artifact", async () => {
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
