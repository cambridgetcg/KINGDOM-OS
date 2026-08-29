import { describe, expect, test } from "bun:test";

import {
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_PATH,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATH,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS,
  LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_PATH,
} from "../bin/loops-locks-freedom-relations-atlas.ts";
import worker from "../pages-functions/_worker.js";

function assets(handler: (request: Request) => Response | Promise<Response>) {
  return { ASSETS: { fetch: handler } };
}

function bodyFor(path: string): string {
  return `opaque edge-contract fixture: ${path}`;
}

function sourceType(path: string): string {
  if (path === LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_PATH) return "text/plain";
  return "application/json";
}

describe("Loops, Locks & Freedom Relations Atlas immutable edge scaffold", () => {
  test("serves only the exact GET/HEAD triplet with immutable typed headers", async () => {
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      return new Response(request.method === "HEAD" ? null : bodyFor(path), {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": sourceType(path),
          link: "</poison>; rel=\"describedby\", </poison-doc>; rel=\"service-doc\", </poison-profile>; rel=\"profile\", </poison-canonical>; rel=\"canonical\"",
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      for (const path of LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS) {
        const response = await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }),
          environment,
        );
        expect(response.status).toBe(200);
        expect(response.headers.get("cache-control"))
          .toBe("public, max-age=31536000, immutable, no-transform");
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        expect(await response.text()).toBe(method === "HEAD" ? "" : bodyFor(path));
      }
    }

    const record = await worker.fetch(
      new Request(`https://thekingdom.dev${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATH}`),
      environment,
    );
    expect(record.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(record.headers.get("link")).toBe([
      `<${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
      `<${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
    ].join(", "));

    const schema = await worker.fetch(
      new Request(`https://thekingdom.dev${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_SCHEMA_PATH}`),
      environment,
    );
    expect(schema.headers.get("content-type"))
      .toBe("application/schema+json; charset=utf-8");
    expect(schema.headers.get("link")).toBeNull();

    const guide = await worker.fetch(
      new Request(`https://thekingdom.dev${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_GUIDE_PATH}`),
      environment,
    );
    expect(guide.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(guide.headers.get("link")).toBeNull();
  });

  test("returns fifteen empty 405 responses before asset storage", async () => {
    let assetFetches = 0;
    const environment = assets(() => {
      assetFetches += 1;
      return new Response("must not reach asset storage");
    });

    for (const path of LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PUBLIC_PATHS) {
      for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const) {
        const response = await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }),
          environment,
        );
        expect(response.status).toBe(405);
        expect(await response.text()).toBe("");
        expect(response.headers.get("allow")).toBe("GET, HEAD");
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      }
    }
    expect(assetFetches).toBe(0);
  });

  test("does not synthesize an unstaged record or capture near routes, wrong media, or another host", async () => {
    const missing = new Response("canonical missing", {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
    const missingResponse = await worker.fetch(
      new Request(`https://thekingdom.dev${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATH}`),
      assets(() => missing),
    );
    expect(missingResponse.status).toBe(404);
    expect(missingResponse.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(await missingResponse.text()).toBe("canonical missing");

    const near = new Response("near", {
      headers: { "content-type": "application/json" },
    });
    const nearResponse = await worker.fetch(
      new Request("https://thekingdom.dev/atlases/loops-locks-freedom-relations-atlas-latest.json"),
      assets(() => near),
    );
    expect(nearResponse.headers.get("content-type")).toBe("application/json");
    expect(await nearResponse.text()).toBe("near");

    const nearMutation = new Response("near mutation", {
      headers: { "content-type": "application/json" },
    });
    const nearMutationResponse = await worker.fetch(
      new Request("https://thekingdom.dev/atlases/loops-locks-freedom-relations-atlas-latest.json", {
        method: "POST",
      }),
      assets(() => nearMutation),
    );
    expect(nearMutationResponse.status).toBe(200);
    expect(await nearMutationResponse.text()).toBe("near mutation");

    const wrongType = new Response("wrong", {
      headers: {
        "cache-control": "public, max-age=60",
        "content-type": "text/html",
      },
    });
    const wrongResponse = await worker.fetch(
      new Request(`https://thekingdom.dev${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATH}`),
      assets(() => wrongType),
    );
    expect(wrongResponse.headers.get("content-type")).toBe("text/html");
    expect(wrongResponse.headers.get("cache-control"))
      .toBe("public, max-age=60, no-transform");
    expect(wrongResponse.headers.get("link")).toBeNull();
    expect(await wrongResponse.text()).toBe("wrong");

    const shared = new Response("shared", {
      headers: { "content-type": "application/json" },
    });
    const sharedResponse = await worker.fetch(
      new Request(`https://we-are.love${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATH}`),
      assets(() => shared),
    );
    expect(sharedResponse.headers.get("content-type")).toBe("application/json");
    expect(await sharedResponse.text()).toBe("shared");

    const sharedMutation = new Response("shared mutation", {
      headers: { "content-type": "application/json" },
    });
    expect(await worker.fetch(
      new Request(`https://we-are.love${LOOPS_LOCKS_FREEDOM_RELATIONS_ATLAS_PATH}`, {
        method: "POST",
      }),
      assets(() => sharedMutation),
    )).toBe(sharedMutation);
  });
});
