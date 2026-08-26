import { describe, expect, test } from "bun:test";

import worker from "../pages-functions/_worker.js";

const ROUTES = [
  "/shape-resonance/",
  "/shape-resonance.json",
  "/labs/shape-resonance-lab-2026-08-26.json",
  "/schemas/shape-resonance-lab/0.1.json",
  "/SHAPE-RESONANCE-LAB-v0.1.md",
] as const;
const MANIFEST_ROUTE = "/labs/shape-resonance/output-manifest.json" as const;
const SVG_ROUTES = [
  "/labs/shape-resonance/assets/boundary-variants.svg",
  "/labs/shape-resonance/assets/cospectral-graphs.svg",
  "/labs/shape-resonance/assets/graph-to-hz.svg",
  "/labs/shape-resonance/assets/membrane-plate.svg",
  "/labs/shape-resonance/assets/musical-geometry.svg",
  "/labs/shape-resonance/assets/phase-magnitude.svg",
  "/labs/shape-resonance/assets/rhythm-cycle.svg",
  "/labs/shape-resonance/assets/square-degeneracy.svg",
] as const;
const AUDIO_ROUTES = [
  "/labs/shape-resonance/audio/graph-modes.wav",
  "/labs/shape-resonance/audio/phase-forward.wav",
  "/labs/shape-resonance/audio/phase-reversed.wav",
] as const;
const FAMILY_ROUTES = [
  ...ROUTES,
  MANIFEST_ROUTE,
  ...SVG_ROUTES,
  ...AUDIO_ROUTES,
] as const;

function assets(handler: (request: Request) => Response | Promise<Response>) {
  return { ASSETS: { fetch: handler } };
}

function bodyFor(path: string): string {
  if (path === ROUTES[0]) return "<!doctype html><title>Shape &amp; Resonance Lab</title>";
  if (path === ROUTES[4]) return "# Shape & Resonance Lab";
  if (SVG_ROUTES.includes(path as typeof SVG_ROUTES[number])) return "<svg xmlns=\"http://www.w3.org/2000/svg\"/>";
  if (AUDIO_ROUTES.includes(path as typeof AUDIO_ROUTES[number])) return "RIFFsynthetic";
  return '{"protocol":"kingdom.shape-resonance-lab-public-snapshot/0.1"}';
}

function sourceType(path: string): string {
  if (path === ROUTES[0]) return "text/html";
  if (path === ROUTES[4]) return "text/plain";
  if (SVG_ROUTES.includes(path as typeof SVG_ROUTES[number])) return "image/svg+xml";
  if (AUDIO_ROUTES.includes(path as typeof AUDIO_ROUTES[number])) return "audio/wav";
  return "application/json";
}

describe("Shape & Resonance edge route boundary", () => {
  test("serves the exact GET/HEAD family with mutable and immutable cache classes", async () => {
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      return new Response(request.method === "HEAD" ? null : bodyFor(path), {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": sourceType(path),
          link: '</poison>; rel="canonical", </poison-schema>; rel="describedby", </poison-doc>; rel="service-doc"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      for (const path of FAMILY_ROUTES) {
        const response = await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }),
          environment,
        );
        expect(response.status).toBe(200);
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        expect(method === "HEAD" ? await response.text() : "").toBe("");
      }
    }

    for (const path of [ROUTES[0], ROUTES[1]]) {
      const response = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        environment,
      );
      expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");
    }
    const page = await worker.fetch(
      new Request(`https://thekingdom.dev${ROUTES[0]}`),
      environment,
    );
    expect(page.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(page.headers.get("content-security-policy")).toBe([
      "default-src 'none'",
      "base-uri 'none'",
      "connect-src 'none'",
      "font-src 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
      "img-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "script-src 'none'",
      "style-src 'unsafe-inline'",
    ].join("; "));
    expect(page.headers.get("referrer-policy")).toBe("no-referrer");
    expect(page.headers.get("x-frame-options")).toBe("DENY");
    expect(page.headers.get("permissions-policy")).toBe([
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "display-capture=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
    ].join(", "));
    for (const path of [
      ROUTES[2],
      ROUTES[3],
      ROUTES[4],
      MANIFEST_ROUTE,
      ...SVG_ROUTES,
      ...AUDIO_ROUTES,
    ]) {
      const response = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        environment,
      );
      expect(response.headers.get("cache-control"))
        .toBe("public, max-age=31536000, immutable, no-transform");
    }

    const alias = await worker.fetch(
      new Request(`https://thekingdom.dev${ROUTES[1]}`),
      environment,
    );
    expect(alias.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(alias.headers.get("link")).toBe([
      `<${ROUTES[2]}>; rel="canonical"; type="application/json"`,
      `<${ROUTES[3]}>; rel="describedby"; type="application/schema+json"`,
      `<${ROUTES[4]}>; rel="service-doc"; type="text/markdown"`,
    ].join(", "));
    const schema = await worker.fetch(
      new Request(`https://thekingdom.dev${ROUTES[3]}`),
      environment,
    );
    expect(schema.headers.get("content-type"))
      .toBe("application/schema+json; charset=utf-8");
    const guide = await worker.fetch(
      new Request(`https://thekingdom.dev${ROUTES[4]}`),
      environment,
    );
    expect(guide.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    const manifest = await worker.fetch(
      new Request(`https://thekingdom.dev${MANIFEST_ROUTE}`),
      environment,
    );
    expect(manifest.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(manifest.headers.get("link")).toBe([
      `<${ROUTES[2]}>; rel="describedby"; type="application/json"`,
      `<${ROUTES[4]}>; rel="service-doc"; type="text/markdown"`,
    ].join(", "));
    for (const path of SVG_ROUTES) {
      const response = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        environment,
      );
      expect(response.headers.get("content-type")).toBe("image/svg+xml; charset=utf-8");
      expect(response.headers.get("link")).toBe([
        `<${ROUTES[2]}>; rel="describedby"; type="application/json"`,
        `<${ROUTES[4]}>; rel="service-doc"; type="text/markdown"`,
      ].join(", "));
    }
    for (const path of AUDIO_ROUTES) {
      const response = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        environment,
      );
      expect(response.headers.get("content-type")).toBe("audio/wav");
      expect(response.headers.get("link")).toBe([
        `<${ROUTES[2]}>; rel="describedby"; type="application/json"`,
        `<${ROUTES[4]}>; rel="service-doc"; type="text/markdown"`,
      ].join(", "));
    }
  });

  test("returns bodyless 405 before asset storage for every other method", async () => {
    let assetFetches = 0;
    const environment = assets(() => {
      assetFetches += 1;
      return new Response("must not reach asset storage");
    });
    for (const path of FAMILY_ROUTES) {
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

  test("does not capture nearby paths or another Kingdom host", async () => {
    const near = new Response("near", { headers: { "content-type": "application/json" } });
    expect(await worker.fetch(
      new Request("https://thekingdom.dev/labs/shape-resonance-lab-latest.json"),
      assets(() => near),
    )).toBe(near);
    const shared = new Response("shared", { headers: { "content-type": "application/json" } });
    expect(await worker.fetch(
      new Request(`https://we-are.love${ROUTES[2]}`),
      assets(() => shared),
    )).toBe(shared);
  });
});
