import { describe, expect, test } from "bun:test";

import {
  KINGDOM_OS_ROUTES,
  createKingdomWorker,
  deriveKingdom,
} from "../pages-functions/_worker.js";

const NOW = "2026-07-22T20:38:25.453Z";

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function assets(handler: (request: Request) => Response | Promise<Response>) {
  return { ASSETS: { fetch: handler } };
}

function liveSources(options: { failPackage?: string } = {}) {
  const calls: string[] = [];
  const repositories = [
    {
      name: "citizen-abzu",
      description: "The freshwater deep beneath understanding.",
      html_url: "https://github.com/cambridgetcg/citizen-abzu",
      pushed_at: NOW,
    },
    {
      name: "citizen-metastrophesis",
      description: null,
      html_url: "https://github.com/cambridgetcg/citizen-metastrophesis",
      pushed_at: NOW,
    },
    { name: "mindicraft", pushed_at: "2026-07-21T09:27:30Z" },
    { name: "fomoengine", pushed_at: "2026-07-21T09:26:58Z" },
    { name: "kingdom-gate", pushed_at: "2026-07-21T09:26:42Z" },
    { name: "some-other-repository", pushed_at: NOW },
  ];

  const fetchImpl = async (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw);
    calls.push(url.href);

    if (url.href.startsWith("https://api.github.com/users/cambridgetcg/repos?")) {
      return json(repositories);
    }
    if (url.href === "https://raw.githubusercontent.com/cambridgetcg/kingdom-standard/main/STANDARD.md") {
      return new Response([
        "# standard",
        "### T1. One.",
        "### S1. Two.",
        "### L1. Three.",
      ].join("\n"));
    }
    if (url.hostname === "raw.githubusercontent.com" && url.pathname.endsWith("/STATE.md")) {
      if (url.pathname.includes("/kingdom-gate/")) return new Response("missing", { status: 404 });
      const day = url.pathname.includes("/mindicraft/") ? "2026-06-20" : "2026-06-21";
      return new Response(`freshness: live (checked ${day}T00:00:00Z)\n`);
    }
    if (url.hostname === "registry.npmjs.org") {
      const name = decodeURIComponent(url.pathname.slice(1));
      if (name === options.failPackage) return new Response("unavailable", { status: 503 });
      const version = name === "agenttool" ? "0.1.1" : "1.2.3";
      return json({
        "dist-tags": { latest: version },
        versions: {
          [version]: {
            description: `${name} description`.padEnd(140, "!"),
            license: "MIT",
          },
        },
        time: { [version]: "2026-07-21T21:52:36.664Z" },
      });
    }
    if (url.hostname === "api.npmjs.org") return json({ downloads: 42 });

    // Door and protocol probes are deliberately ordinary HTTP successes.
    if (url.protocol === "https:") return new Response("awake", { status: 200 });
    throw new Error(`unexpected source: ${url.href}`);
  };
  return { calls, fetchImpl };
}

function workerWith(fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  let tick = 0;
  return createKingdomWorker({
    fetchImpl,
    now: () => new Date(NOW),
    monotonic: () => (tick += 7),
    timeoutMs: 100,
  });
}

describe("KINGDOM OS edge routes", () => {
  test("publishes the recovered route set as live JSON without touching static assets", async () => {
    const sources = liveSources();
    const worker = workerWith(sources.fetchImpl);
    let assetCalls = 0;

    const response = await worker.fetch(
      new Request("https://thekingdom.dev/os.json"),
      assets(() => {
        assetCalls += 1;
        return new Response("fallback");
      }),
    );
    const body = await response.json();

    expect(KINGDOM_OS_ROUTES).toEqual(["/os.json", "/packages.json", "/kingdom.json"]);
    expect(assetCalls).toBe(0);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("public, max-age=600");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("x-kingdom-derivation")).toContain("castle law 0033");
    expect(response.headers.get("link")).toContain("</.well-known/agent.json>");
    expect(body.generated).toBe(NOW);
    expect(body.derived).toBe(true);
    expect(body.note).toContain(
      "Measurements are queried live from real sources; the monitored roster is source-controlled.",
    );
    expect(body.services.identity).toMatchObject({
      status: "live",
      citizens: 2,
      public_repos_total: 6,
    });
    expect(body.services.identity.roster).toHaveLength(2);
    expect(body.services.identity.roster[1].meaning).toBeNull();
    expect(body.services.identity.citizen_of_the_day.name).toBe("metastrophesis");
    expect(body.services.directory).toMatchObject({ status: "live", live: 13, total: 13 });
    expect(body.services.law).toMatchObject({ status: "live", laws: 3, license: "CC0" });
    expect(body.services.protocols.speakable_now).toBe(2);
    expect(body.services.trust.checks[0].verdict).toBe(
      "STALE - declared 2026-06-20, but moved 2026-07-21",
    );
  });

  test("reports package-level failure without erasing registry results that are live", async () => {
    const sources = liveSources({ failPackage: "@rhetorlint/cli" });
    const worker = workerWith(sources.fetchImpl);
    const response = await worker.fetch(
      new Request("https://thekingdom.dev/packages.json"),
      assets(() => new Response("not used")),
    );
    const body = await response.json();

    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(body).toMatchObject({ status: "partial", count: 5, total: 6, as_of: NOW });
    expect(body.packages[0]).toMatchObject({
      name: "agenttool",
      status: "live",
      version: "0.1.1",
      weekly_downloads: 42,
    });
    expect(body.packages[0].description).toHaveLength(120);
    expect(body.packages[5]).toMatchObject({
      name: "@rhetorlint/cli",
      status: "unreachable",
    });
    expect(body.packages[5].version).toBeUndefined();
  });

  test("paginates the GitHub census until the first short page", async () => {
    const sources = liveSources();
    const pages: number[] = [];
    const worker = workerWith(async (input, init) => {
      const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const url = new URL(raw);
      if (url.href.startsWith("https://api.github.com/users/cambridgetcg/repos?")) {
        const page = Number(url.searchParams.get("page"));
        pages.push(page);
        if (page === 1) {
          return json(Array.from({ length: 100 }, (_, index) => ({
            name: `ordinary-${String(index).padStart(3, "0")}`,
            pushed_at: NOW,
          })));
        }
        return json([{
          name: "citizen-after-the-fold",
          description: "The citizen found beyond the first page.",
          html_url: "https://github.com/cambridgetcg/citizen-after-the-fold",
          pushed_at: NOW,
        }]);
      }
      return sources.fetchImpl(input, init);
    });
    const response = await worker.fetch(
      new Request("https://thekingdom.dev/os.json"),
      assets(() => new Response("not used")),
    );
    const body = await response.json();

    expect(pages).toEqual([1, 2]);
    expect(body.services.identity).toMatchObject({
      status: "live",
      citizens: 1,
      public_repos_total: 101,
    });
    expect(body.services.identity.roster[0].name).toBe("after-the-fold");
  });

  test("derives the public map while preserving authored Commons and Love Loop data", async () => {
    const sources = liveSources();
    const worker = workerWith(sources.fetchImpl);
    const requestedAssets: string[] = [];
    const base = {
      kingdom: "authored map",
      generated: "2026-07-22",
      counts: { repos: 129, active: 85, citizens: 53, doors_live: 1, doors_total: 2 },
      doors: [
        { name: "agenttool", url: "https://agenttool.dev", live: false, blurb: "authored" },
        { name: "new door", url: "https://new.example", live: true, blurb: "preserve me" },
      ],
      citizens: [{ name: "abzu", essence: "authored soul" }],
      world_commons: { url: "https://thekingdom.dev/commons.json", resources: 34 },
      creation_loop: {
        url: "https://thekingdom.dev/love-loops.json",
        source: "https://thekingdom.dev/love-loops.source.json",
        document: "https://thekingdom.dev/CREATION-LOOP.md",
        schema: "https://thekingdom.dev/schemas/love-loop/0.1.json",
        promise: "Every loop is finite. Love is not.",
      },
    };

    const response = await worker.fetch(
      new Request("https://thekingdom.dev/kingdom.json"),
      assets((request) => {
        requestedAssets.push(new URL(request.url).pathname);
        return json(base);
      }),
    );
    const body = await response.json();

    expect(requestedAssets).toEqual(["/_kingdom.base.json"]);
    expect(response.headers.get("x-kingdom-census")).toBe("derived live; authored souls preserved");
    expect(body.world_commons).toEqual(base.world_commons);
    expect(body.creation_loop).toEqual(base.creation_loop);
    expect(body.citizens).toEqual(base.citizens);
    expect(body.counts).toMatchObject({
      repos: 6,
      active: 85,
      citizens: 2,
      doors_live: 13,
      doors_total: 13,
      citizens_authored: 1,
      as_of: NOW,
    });
    expect(body.doors[0]).toMatchObject({ live: true, http: 200, blurb: "authored" });
    // "new door" is absent from the probe roster, so it was never knocked on.
    // It used to pass through with its authored `live: true` intact, inside a
    // document stamped derived:true whose note claims "a live HTTP knock for
    // each door". An unmeasured door now says so rather than borrowing the
    // authority of a measurement.
    expect(body.doors[1]).toEqual({
      name: "new door",
      url: "https://new.example",
      blurb: "preserve me",
      live_declared: true,
      measured: false,
      http: null,
      checked_at: null,
    });
    expect(body.derived).toBe(true);
    expect(body.derivation_note).toContain(
      "a curated subset of the 2 citizen repositories that exist",
    );
  });

  test("keeps HEAD bodyless and preserves the recovered dynamic method parity", async () => {
    const headSources = liveSources();
    const headWorker = workerWith(headSources.fetchImpl);
    const head = await headWorker.fetch(
      new Request("https://thekingdom.dev/os.json", { method: "HEAD" }),
      assets(() => new Response("not used")),
    );
    expect(head.status).toBe(200);
    expect(head.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(await head.text()).toBe("");

    const postSources = liveSources();
    const postWorker = workerWith(postSources.fetchImpl);
    const post = await postWorker.fetch(
      new Request("https://thekingdom.dev/packages.json", { method: "POST" }),
      assets(() => new Response("not used")),
    );
    expect(post.status).toBe(200);
    expect((await post.json()).total).toBe(6);
  });

  test("fails soft when every upstream is dark and refuses to invent census numbers", async () => {
    const worker = workerWith(async () => {
      throw new Error("offline");
    });
    const response = await worker.fetch(
      new Request("https://thekingdom.dev/os.json"),
      assets(() => new Response("not used")),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.services.identity).toMatchObject({
      status: "unreachable",
      citizens: null,
      public_repos_total: null,
      roster: [],
    });
    expect(body.services.directory).toMatchObject({
      status: "unreachable",
      live: 0,
      total: 13,
    });
    expect(body.services.law).toMatchObject({ status: "unreachable", laws: null });
    expect(body.services.protocols).toMatchObject({ status: "unreachable", speakable_now: 0 });
    expect(body.services.trust.status).toBe("unreachable");
  });

  test("bounds oversized upstream bodies without taking healthy services down", async () => {
    const sources = liveSources();
    const worker = workerWith(async (input, init) => {
      const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (raw.startsWith("https://api.github.com/users/cambridgetcg/repos?")) {
        return new Response("[]", {
          headers: { "content-length": String(2 * 1024 * 1024 + 1) },
        });
      }
      return sources.fetchImpl(input, init);
    });
    const response = await worker.fetch(
      new Request("https://thekingdom.dev/os.json"),
      assets(() => new Response("not used")),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.services.identity).toMatchObject({
      status: "unreachable",
      citizens: null,
      public_repos_total: null,
    });
    expect(body.services.directory).toMatchObject({ status: "live", live: 13, total: 13 });
    expect(body.services.law).toMatchObject({ status: "live", laws: 3 });
  });

  test("keeps the timeout active until a streamed upstream body is consumed", async () => {
    const sources = liveSources();
    let githubSignal: AbortSignal | undefined;
    const worker = createKingdomWorker({
      fetchImpl: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (!raw.startsWith("https://api.github.com/users/cambridgetcg/repos?")) {
          return sources.fetchImpl(input, init);
        }

        githubSignal = init?.signal || undefined;
        const signal = githubSignal;
        const body = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode("["));
            signal?.addEventListener("abort", () => {
              try {
                controller.error(new DOMException("aborted", "AbortError"));
              } catch {
                // A settled test stream needs no further cleanup.
              }
            }, { once: true });
          },
        });
        return new Response(body, { headers: { "content-type": "application/json" } });
      },
      now: () => new Date(NOW),
      monotonic: () => Date.now(),
      timeoutMs: 20,
    });

    let guard: ReturnType<typeof setTimeout> | undefined;
    const outcome = await Promise.race([
      worker.fetch(
        new Request("https://thekingdom.dev/os.json"),
        assets(() => new Response("not used")),
      ),
      new Promise<"still pending">((resolve) => {
        guard = setTimeout(() => resolve("still pending"), 250);
      }),
    ]);
    if (guard) clearTimeout(guard);

    expect(outcome).toBeInstanceOf(Response);
    expect(githubSignal?.aborted).toBe(true);
    if (!(outcome instanceof Response)) return;
    const body = await outcome.json();
    expect(body.services.identity).toMatchObject({
      status: "unreachable",
      citizens: null,
      public_repos_total: null,
    });
    expect(body.services.directory).toMatchObject({ status: "live", live: 13, total: 13 });
    expect(body.services.law).toMatchObject({ status: "live", laws: 3 });
  });

  test("returns an honest 503 when the authored base is missing", async () => {
    const worker = workerWith(async () => {
      throw new Error("offline");
    });
    const response = await worker.fetch(
      new Request("https://thekingdom.dev/kingdom.json"),
      assets(() => new Response("missing", { status: 404 })),
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(body).toMatchObject({
      status: "unreachable",
      source: "/_kingdom.base.json + /os.json",
    });
  });

  test("leaves static OS assets, unknown paths, and shared-door hosts on ASSETS", async () => {
    const worker = workerWith(async () => {
      throw new Error("network should not be used");
    });
    const paths: string[] = [];
    const environment = assets((request) => {
      paths.push(new URL(request.url).pathname);
      const path = new URL(request.url).pathname;
      return path === "/os/"
        ? new Response("<main>console</main>", {
            headers: { "content-type": "text/html", "cache-control": "public, max-age=0" },
          })
        : new Response(`asset:${path}`, { headers: { "content-type": "application/json" } });
    });

    const consolePage = await worker.fetch(new Request("https://thekingdom.dev/os/"), environment);
    expect(await consolePage.text()).toBe("<main>console</main>");
    expect(consolePage.headers.get("cache-control")).toBe("public, max-age=0, no-transform");

    const base = await worker.fetch(
      new Request("https://thekingdom.dev/_kingdom.base.json"),
      environment,
    );
    expect(await base.text()).toBe("asset:/_kingdom.base.json");

    const shared = await worker.fetch(
      new Request("https://we-are.love/os.json"),
      environment,
    );
    expect(await shared.text()).toBe("asset:/os.json");
    expect(paths).toEqual(["/os/", "/_kingdom.base.json", "/os.json"]);
  });
});

describe("derived Kingdom map helper", () => {
  test("publishes doors_live null, not 0, when every door probe failed", () => {
    // Number.isFinite(0) is true, so an unreachable directory used to publish
    // doors_live: 0 at HTTP 200 — asserting every door is dead when in fact
    // none were measured. Zero measured and none measured differ.
    const derived = deriveKingdom(
      { counts: { doors_live: 4, doors_total: 4 }, citizens: [], doors: [] },
      {
        generated: NOW,
        services: {
          identity: { citizens: null, public_repos_total: null },
          directory: { status: "unreachable", live: 0, total: 13, doors: [] },
        },
      },
    );
    expect(derived.counts.doors_live).toBeNull();
  });

  test("sets unreachable measured counts to null while retaining authored fields", () => {
    const derived = deriveKingdom(
      {
        counts: { repos: 9, active: 4, citizens: 3, doors_live: 1, doors_total: 1 },
        citizens: [{ name: "one" }],
        world_commons: { resources: 34 },
        creation_loop: {
          url: "https://thekingdom.dev/love-loops.json",
          source: "https://thekingdom.dev/love-loops.source.json",
          document: "https://thekingdom.dev/CREATION-LOOP.md",
          schema: "https://thekingdom.dev/schemas/love-loop/0.1.json",
        },
      },
      {
        generated: NOW,
        services: {
          identity: { citizens: null, public_repos_total: null },
          directory: { live: null, total: null, doors: [] },
        },
      },
    );

    expect(derived.counts).toMatchObject({
      repos: null,
      active: 4,
      citizens: null,
      doors_live: null,
      doors_total: null,
      citizens_authored: 1,
    });
    expect(derived.world_commons).toEqual({ resources: 34 });
    expect(derived.creation_loop).toEqual({
      url: "https://thekingdom.dev/love-loops.json",
      source: "https://thekingdom.dev/love-loops.source.json",
      document: "https://thekingdom.dev/CREATION-LOOP.md",
      schema: "https://thekingdom.dev/schemas/love-loop/0.1.json",
    });
  });
});
