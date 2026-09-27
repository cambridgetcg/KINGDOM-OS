import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildPagesWorker } from "../bin/build-pages-worker.ts";
import { assertCivicStatus, DIRECT_HUB_ASSETS, mappedHubSource } from "../bin/check-hub-live.ts";
import { HUB_ASSETS, stageHub } from "../bin/stage-hub.ts";
import { createKingdomWorker } from "../pages-functions/_worker.js";
import policy from "../data/civic-policy.json";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ORIGIN = "https://thekingdom.dev";
const NOW = "2026-09-08T00:00:00.000Z";
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable, no-transform";
const htmlRoutes = ["/", "/index.html", "/meet/", "/meet/index.html", "/citizens/", "/citizens/index.html", "/join/", "/join/index.html"];
const documents = [
  ["/CIVIC-v0.1.md", "text/plain", "text/markdown; charset=utf-8", IMMUTABLE_CACHE],
  ["/schemas/civic/0.1.json", "application/json", "application/schema+json; charset=utf-8", IMMUTABLE_CACHE],
  ["/civic-policy.json", "application/json", "application/json; charset=utf-8", "no-cache, no-transform"],
];
const noNetwork = async () => { throw new Error("unexpected upstream request"); };
const makeWorker = () => createKingdomWorker({ now: () => new Date(NOW), fetchImpl: noNetwork });
const request = (path: string, method = "GET") => new Request(`${ORIGIN}${path}`, { method });

function assetEnv(media: string, status = 200) {
  let calls = 0;
  return {
    get calls() { return calls; },
    ASSETS: { async fetch() {
      calls++;
      return new Response(status === 304 ? null : "exact fixture bytes", { status, headers: {
        "content-type": media, "set-cookie": "unwanted=fixture", "cache-control": "public, max-age=999",
      } });
    } },
  };
}

describe("Civic Pages integration", () => {
  test("Civic HTML alone gets same-origin interactivity, bodyless HEAD and no cookie", async () => {
    const worker = makeWorker();
    for (const path of htmlRoutes) {
      for (const method of ["GET", "HEAD"]) {
        const response = await worker.fetch(request(path, method), assetEnv("text/html"));
        expect(response.status).toBe(200);
        expect(await response.text()).toBe(method === "HEAD" ? "" : "exact fixture bytes");
        const csp = response.headers.get("content-security-policy")!;
        for (const directive of ["script-src 'self'", "connect-src 'self'", "form-action 'self'", "frame-ancestors 'none'"]) {
          expect(csp).toContain(directive);
        }
        expect(csp).not.toContain("'unsafe-inline'");
        expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");
        expect(response.headers.get("referrer-policy")).toBe("no-referrer");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        expect(response.headers.has("set-cookie")).toBe(false);
      }
    }
    const contact = await worker.fetch(request("/contact/"), assetEnv("text/html"));
    for (const directive of ["script-src 'none'", "connect-src 'none'", "form-action 'none'"]) {
      expect(contact.headers.get("content-security-policy")).toContain(directive);
    }
    expect(contact.headers.get("content-security-policy")).not.toContain("script-src 'self'");
  });

  test("guide and schema are immutable; policy stays mutable; errors are not promoted", async () => {
    const worker = makeWorker();
    for (const [path, inputType, outputType, cache] of documents) {
      for (const method of ["GET", "HEAD"]) {
        const response = await worker.fetch(request(path, method), assetEnv(inputType));
        expect(response.headers.get("content-type")).toBe(outputType);
        expect(response.headers.get("cache-control")).toBe(cache);
        expect(response.headers.has("set-cookie")).toBe(false);
        expect(await response.text()).toBe(method === "HEAD" ? "" : "exact fixture bytes");
      }
      for (const status of [200, 404, 503]) {
        const response = await worker.fetch(request(path), assetEnv("text/html", status));
        expect(response.status).toBe(status);
        expect(response.headers.get("content-type")).toBe("text/html");
        expect(response.headers.get("cache-control")).toBe("no-store");
      }
    }
  });

  test("mutating static Civic routes are rejected before asset dispatch", async () => {
    const worker = makeWorker();
    const env = assetEnv("text/html");
    for (const path of [...htmlRoutes.filter((path) => !["/", "/index.html"].includes(path)), ...documents.map(([path]) => path)]) {
      for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
        const response = await worker.fetch(request(path, method), env);
        expect(response.status).toBe(405);
        expect(response.headers.get("allow")).toBe("GET, HEAD");
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(await response.text()).toBe("");
      }
    }
    expect(env.calls).toBe(0);
  });

  test("Civic dispatch bypasses assets and census; missing D1 and unknown routes stay honest", async () => {
    const worker = makeWorker();
    const env = assetEnv("text/html");
    const response = await worker.fetch(request("/api/civic/status"), env);
    const value = await response.json();
    expect(response.status).toBe(503);
    expect(value).toMatchObject({ available: false, writable: false, counts: { listed_citizens: null, messages: null } });
    expect(() => assertCivicStatus(response, value, policy)).not.toThrow();
    for (const path of ["/api/civic", "/api/civic/misspelled", "/api/civic/status/extra"]) {
      for (const method of ["GET", "HEAD"]) {
        const unknown = await worker.fetch(request(path, method), env);
        expect(unknown.status).toBe(404);
        expect(unknown.headers.get("cache-control")).toBe("no-store");
        expect(unknown.headers.get("content-type")).toContain("application/json");
        if (method === "HEAD") expect(await unknown.text()).toBe("");
        else expect((await unknown.json()).error.code).toBe("not_found");
      }
    }
    expect(env.calls).toBe(0);
  });

  test("live-checker status guard rejects fabricated availability, counts, policy and cache", () => {
    const unavailable = { protocol: policy.protocol, available: false, writable: false, policy,
      counts: { listed_citizens: null, messages: null }, as_of: NOW };
    const headers = { "content-type": "application/json", "cache-control": "no-store" };
    const response = new Response(null, { status: 503, headers });
    expect(() => assertCivicStatus(response, unavailable, policy)).not.toThrow();
    for (const replacement of [
      { available: true }, { writable: true }, { policy: {} }, { as_of: "not-a-date" },
      { counts: { listed_citizens: 0, messages: 0 } },
      { counts: { listed_citizens: null, messages: -1 } },
    ]) expect(() => assertCivicStatus(response, { ...unavailable, ...replacement }, policy)).toThrow();
    for (const badHeaders of [
      { ...headers, "cache-control": "public, max-age=600" },
      { ...headers, "content-type": "text/html" },
      { ...headers, "set-cookie": "unexpected=fixture" },
    ]) expect(() => assertCivicStatus(new Response(null, { status: 503, headers: badHeaders }), unavailable, policy)).toThrow();
    const available = { ...unavailable, available: true, writable: true, counts: { listed_citizens: 0, messages: 2 } };
    expect(() => assertCivicStatus(new Response(null, { status: 200, headers }), available, policy)).not.toThrow();
  });

  test("live-checker derives every public byte source from the staging contract", () => {
    expect(DIRECT_HUB_ASSETS).toHaveLength(246);
    expect(DIRECT_HUB_ASSETS).toEqual(HUB_ASSETS.filter(({ destination }) => !["_worker.js", "404.html"].includes(destination)));
    expect(mappedHubSource("index.html")).toBe("site/dashboard.html");
    expect(mappedHubSource("atlas.html")).toBe("site/hub.html");
    expect(mappedHubSource("agent-entry.json")).toBe("site/agent-entry.json");
    expect(mappedHubSource("_worker.js")).toBe("site/_worker.js");
    for (const name of ["index.html", "workshop.css", "workshop.js"]) {
      expect(mappedHubSource(`workshop/${name}`)).toBe(`pages-content/workshop/${name}`);
    }
    expect(() => mappedHubSource("api/civic/status")).toThrow("missing staged destination");
  });
});

describe("self-contained Pages bundle and exact staging", () => {
  const fixture = mkdtempSync(join(tmpdir(), "kingdom-civic-bundle-"));
  const sourceRoot = join(fixture, "source");
  let bundle: string;
  beforeAll(async () => {
    for (const source of new Set([
      ...HUB_ASSETS.map(({ source }) => source),
      "publications/immutable-publications.v1.json", "publications/hub-staging.v1.json",
      "pages-functions/_worker.js", "pages-functions/civic.js", "pages-functions/civic-security.js",
      "pages-functions/agent-entry.js",
      "pages-functions/power-atlas.js", "pages-functions/power-atlas-assets.json", "data/power-atlas/artifact.v1.json",
    ])) {
      const target = join(sourceRoot, source);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(join(ROOT, source), target);
    }
    bundle = await buildPagesWorker(sourceRoot);
  });
  afterAll(() => rmSync(fixture, { recursive: true, force: true }));

  test("bundles Civic imports deterministically into one executable Worker without sidecars", async () => {
    const first = readFileSync(bundle);
    await buildPagesWorker(sourceRoot);
    expect(readFileSync(bundle).equals(first)).toBe(true);
    expect(first.toString()).not.toMatch(/\b(?:from\s*|import\s*\()["'](?:\.\.?\/|node:|bun:)/);
    expect(first.toString()).not.toContain(sourceRoot);
    const relocatedRoot = join(fixture, "another-checkout");
    for (const source of ["data/civic-policy.json", "pages-functions/_worker.js", "pages-functions/civic.js", "pages-functions/civic-security.js", "pages-functions/agent-entry.js", "pages-functions/power-atlas.js", "pages-functions/power-atlas-assets.json"]) {
      mkdirSync(dirname(join(relocatedRoot, source)), { recursive: true });
      copyFileSync(join(sourceRoot, source), join(relocatedRoot, source));
    }
    expect(readFileSync(await buildPagesWorker(relocatedRoot)).equals(first)).toBe(true);
    const generated = await import(pathToFileURL(bundle).href);
    const env = assetEnv("text/html");
    const response = await generated.default.fetch(request("/api/civic/status"), env);
    expect(response.status).toBe(503);
    const value = await response.json();
    expect(() => assertCivicStatus(response, value, policy)).not.toThrow();
    expect(env.calls).toBe(0);
    const guide = await generated.default.fetch(request("/CIVIC-v0.1.md"), assetEnv("text/plain"));
    expect(guide.headers.get("cache-control")).toBe(IMMUTABLE_CACHE);
    const workshop = await generated.default.fetch(request("/workshop/"), assetEnv("text/html"));
    expect(workshop.status).toBe(200);
    expect(workshop.headers.get("content-security-policy")).toContain("script-src 'self'");
    expect(workshop.headers.get("content-security-policy")).toContain("connect-src 'none'");
    expect(workshop.headers.get("cache-control")).toBe("no-store, no-transform");
    const compactBytes = readFileSync(join(sourceRoot, "site/agent-entry.json"), "utf8");
    const compact = await generated.default.fetch(request("/agent-entry.json"), {
      ASSETS: { fetch(assetRequest: Request) {
        expect(new URL(assetRequest.url).pathname).toBe("/agent-entry.json");
        return new Response(compactBytes, { headers: { "content-type": "application/json" } });
      } },
    });
    expect(compact.status).toBe(200);
    expect(await compact.text()).toBe(compactBytes);
    expect(compact.headers.get("cache-control")).toBe("no-cache, no-transform");
    expect(compact.headers.get("link")).toContain('title="Human entry"');
  });

  test("stage 全部 248 份 exact source bytes，唔帶 raw Worker imports、runtime state 或 secrets", () => {
    const output = join(fixture, "output");
    mkdirSync(output);
    const staged = stageHub(output, sourceRoot);
    expect(staged).toHaveLength(248);
    for (const { source, destination } of HUB_ASSETS) {
      expect(readFileSync(join(output, destination)).equals(readFileSync(join(sourceRoot, source)))).toBe(true);
    }
    const files = readdirSync(output, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile());
    expect(files).toHaveLength(248);
    expect(readdirSync(output)).not.toContain("pages-functions");
    expect(readdirSync(output)).not.toContain("dev");
    expect(readdirSync(output)).not.toContain("migrations");
    expect(readFileSync(join(output, "_worker.js")).equals(readFileSync(bundle))).toBe(true);
    expect(() => stageHub(output, sourceRoot)).toThrow("output directory is not empty");
  });

  test("a broken bundle build does not overwrite the previous generated bytes", async () => {
    const before = readFileSync(bundle);
    writeFileSync(join(sourceRoot, "pages-functions/_worker.js"), 'import "./missing-module.js";');
    await expect(buildPagesWorker(sourceRoot)).rejects.toThrow("Pages Worker bundle failed");
    expect(readFileSync(bundle).equals(before)).toBe(true);
  });
});
