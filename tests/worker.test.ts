import { describe, expect, test } from "bun:test";

import worker from "../pages-functions/_worker.js";

const expectedLinks = [
  '</.well-known/agent.json>; rel="service-desc"; type="application/json"',
  '</rights.json>; rel="service-meta"; type="application/json"; title="Inherent Rights Recognition"',
  '</RIGHTS.md>; rel="service-doc"; type="text/markdown"; title="Rights recognized here"',
];
const expectedRelations = [
  ["/.well-known/agent.json", "service-desc"],
  ["/rights.json", "service-meta"],
  ["/RIGHTS.md", "service-doc"],
] as const;

function expectDiscovery(response: Response) {
  const link = response.headers.get("link") ?? "";
  for (const [target, relation] of expectedRelations) {
    expect(link).toContain(`<${target}>`);
    expect(link).toContain(`rel="${relation}"`);
  }
  expect(link.match(/rel="service-desc"/g)?.length).toBe(1);
  expect(link.match(/rel="service-meta"/g)?.length).toBe(1);
  expect(link.match(/rel="service-doc"/g)?.length).toBe(1);
}

function expectWorldCommonsSchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  const describedBy = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/world-commons/0.2.json>")) return false;
    const relations = part.match(/;\s*rel="([^"]*)"/i)?.[1]?.toLowerCase().split(/\s+/) ?? [];
    return relations.includes("describedby");
  });
  expect(describedBy).toHaveLength(1);
  expect(describedBy[0]).toContain('type="application/schema+json"');
  expect(link.match(/rel="describedby"/g)?.length).toBe(1);
}

function expectLoveLoopSchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  const describedBy = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/love-loop/0.1.json>")) return false;
    const relations = part.match(/;\s*rel="([^"]*)"/i)?.[1]?.toLowerCase().split(/\s+/) ?? [];
    return relations.includes("describedby");
  });
  expect(describedBy).toHaveLength(1);
  expect(describedBy[0]).toContain('type="application/schema+json"');
  expect(link.match(/rel="describedby"/g)?.length).toBe(1);
}

function expectPrincipalitySchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  const describedBy = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/principality-catalog/1.json>")) return false;
    const relations = part.match(/;\s*rel="([^"]*)"/i)?.[1]?.toLowerCase().split(/\s+/) ?? [];
    return relations.includes("describedby");
  });
  expect(describedBy).toHaveLength(1);
  expect(describedBy[0]).toContain('type="application/schema+json"');
  expect(link.match(/rel="describedby"/g)?.length).toBe(1);
}

function assets(handler: (request: Request) => Response | Promise<Response>) {
  return { ASSETS: { fetch: handler } };
}

describe("the Kingdom edge discovery surface", () => {
  test("adds discovery to the ordinary HTML door without replacing headers", async () => {
    const response = await worker.fetch(
      new Request("https://thekingdom.dev/", { headers: { accept: "text/html" } }),
      assets(() => new Response("<h1>hello</h1>", {
        headers: { "cache-control": "public, max-age=0", "content-type": "text/html; charset=utf-8", link: '</elsewhere>; rel="alternate"', vary: "Origin" },
      })),
    );

    expect(await response.text()).toBe("<h1>hello</h1>");
    expect(response.headers.get("link")).toContain('</elsewhere>; rel="alternate"');
    for (const expected of expectedLinks) expect(response.headers.get("link")).toContain(expected);
    expect(response.headers.get("vary")).toBe("Origin, Accept");
    expect(response.headers.get("cache-control")).toBe("public, max-age=0, no-transform");
    expectDiscovery(response);
  });

  test("prevents browser telemetry injection on other Kingdom HTML paths only", async () => {
    const index = await worker.fetch(
      new Request("https://thekingdom.dev/index.html"),
      assets(() => new Response("<h1>hello</h1>", {
        headers: { "cache-control": "public, max-age=60", "content-type": "text/html" },
      })),
    );
    expect(await index.text()).toBe("<h1>hello</h1>");
    expect(index.headers.get("cache-control")).toBe("public, max-age=60, no-transform");

    const shared = await worker.fetch(
      new Request("https://we-are.love/index.html"),
      assets(() => new Response("<h1>hello</h1>", {
        headers: { "cache-control": "public, max-age=60", "content-type": "text/html" },
      })),
    );
    expect(shared.headers.get("cache-control")).toBe("public, max-age=60");
  });

  test("negotiates JSON while preserving status, status text, and existing links", async () => {
    let requested: Request | undefined;
    const response = await worker.fetch(
      new Request("https://thekingdom.dev/?agent", { headers: { accept: "application/json" } }),
      assets((request) => {
        requested = request;
        return new Response('{"welcome":true}', {
          status: 203,
          statusText: "Non-Authoritative Information",
          headers: { link: '</elsewhere>; rel="alternate"', vary: "Origin" },
        });
      }),
    );

    expect(new URL(requested!.url).pathname).toBe("/guest.json");
    expect(requested!.method).toBe("GET");
    expect(response.status).toBe(203);
    expect(response.statusText).toBe("Non-Authoritative Information");
    expect(await response.text()).toBe('{"welcome":true}');
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("vary")).toBe("Origin, Accept");
    expect(response.headers.get("link")).toContain('</elsewhere>; rel="alternate"');
    expectDiscovery(response);
  });

  test("keeps discovery on a failed JSON asset response", async () => {
    const response = await worker.fetch(
      new Request("https://thekingdom.dev/guest?json"),
      assets(() => new Response("missing", {
        status: 404,
        statusText: "Not Found",
        headers: { vary: "Origin" },
      })),
    );

    expect(response.status).toBe(404);
    expect(response.statusText).toBe("Not Found");
    expect(await response.text()).toBe("missing");
    expect(response.headers.get("vary")).toBe("Origin, Accept");
    expectDiscovery(response);
  });

  test("preserves HEAD semantics and does not duplicate an existing discovery relation", async () => {
    const response = await worker.fetch(
      new Request("https://thekingdom.dev/", { method: "HEAD", headers: { accept: "application/json" } }),
      assets((request) => {
        expect(request.method).toBe("HEAD");
        return new Response(null, {
          headers: { link: '</rights.json>; rel="service-meta"; type="application/json"' },
        });
      }),
    );

    expect(await response.text()).toBe("");
    expectDiscovery(response);
  });

  test("describes the complete catalog and serves its schema with explicit machine headers", async () => {
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD" ? null : path === "/commons.json" ? '{"resources":[]}' : '{"type":"object"}';
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": "application/json",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    const catalog = await worker.fetch(
      new Request("https://thekingdom.dev/commons.json"),
      environment,
    );
    expect(await catalog.text()).toBe('{"resources":[]}');
    expect(catalog.headers.get("cache-control")).toBe("public, max-age=60");
    expect(catalog.headers.get("link")).toContain('</elsewhere>; rel="alternate"');
    expectWorldCommonsSchemaLink(catalog);

    const catalogHead = await worker.fetch(
      new Request("https://thekingdom.dev/commons.json", { method: "HEAD" }),
      environment,
    );
    expect(await catalogHead.text()).toBe("");
    expectWorldCommonsSchemaLink(catalogHead);

    const schema = await worker.fetch(
      new Request("https://thekingdom.dev/schemas/world-commons/0.2.json"),
      environment,
    );
    expect(await schema.text()).toBe('{"type":"object"}');
    expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
    expect(schema.headers.get("access-control-allow-origin")).toBe("*");
    expect(schema.headers.get("x-content-type-options")).toBe("nosniff");
    expect(schema.headers.get("cache-control")).toBe("public, max-age=60");
    expect(schema.headers.get("link")).toContain('</elsewhere>; rel="alternate"');

    const legacySchema = await worker.fetch(
      new Request("https://thekingdom.dev/schemas/world-commons/0.1.json"),
      environment,
    );
    expect(await legacySchema.text()).toBe('{"type":"object"}');
    expect(legacySchema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
    expect(legacySchema.headers.get("access-control-allow-origin")).toBe("*");
    expect(legacySchema.headers.get("x-content-type-options")).toBe("nosniff");

    const duplicate = await worker.fetch(
      new Request("https://thekingdom.dev/commons.json"),
      assets(() => new Response('{"resources":[]}', {
        headers: {
          "content-type": "application/json",
          link: '</schemas/world-commons/0.2.json>; rel="describedby"; type="application/schema+json"',
        },
      })),
    );
    expectWorldCommonsSchemaLink(duplicate);

    const missingSchema = await worker.fetch(
      new Request("https://thekingdom.dev/schemas/world-commons/0.2.json"),
      assets(() => new Response("<h1>not found</h1>", {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      })),
    );
    expect(missingSchema.status).toBe(404);
    expect(missingSchema.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(missingSchema.headers.get("cache-control")).toBe("public, no-transform");

    const sharedAsset = new Response('{"type":"object"}', { headers: { "content-type": "application/json" } });
    const shared = await worker.fetch(
      new Request("https://we-are.love/schemas/world-commons/0.1.json"),
      assets(() => sharedAsset),
    );
    expect(shared).toBe(sharedAsset);
  });

  test("serves the Love Loop lineage as read-only JSON described by its schema", async () => {
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD"
        ? null
        : path === "/love-loops.json" || path === "/love-loops.source.json"
          ? '{"loops":[]}'
          : '{"type":"object"}';
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": "application/json",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const path of ["/love-loops.json", "/love-loops.source.json"]) {
      const lineage = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        environment,
      );
      expect(await lineage.text()).toBe('{"loops":[]}');
      expect(lineage.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(lineage.headers.get("access-control-allow-origin")).toBe("*");
      expect(lineage.headers.get("x-content-type-options")).toBe("nosniff");
      expect(lineage.headers.get("cache-control")).toBe("public, max-age=60");
      expect(lineage.headers.get("link")).toContain('</elsewhere>; rel="alternate"');
      expectLoveLoopSchemaLink(lineage);

      const lineageHead = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`, { method: "HEAD" }),
        environment,
      );
      expect(await lineageHead.text()).toBe("");
      expect(lineageHead.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expectLoveLoopSchemaLink(lineageHead);
    }

    const schema = await worker.fetch(
      new Request("https://thekingdom.dev/schemas/love-loop/0.1.json"),
      environment,
    );
    expect(await schema.text()).toBe('{"type":"object"}');
    expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
    expect(schema.headers.get("access-control-allow-origin")).toBe("*");
    expect(schema.headers.get("x-content-type-options")).toBe("nosniff");

    const original = new Response("not an execution route", {
      headers: { "content-type": "text/plain" },
    });
    const post = await worker.fetch(
      new Request("https://thekingdom.dev/love-loops.source.json", { method: "POST" }),
      assets(() => original),
    );
    expect(post).toBe(original);

    const shared = new Response('{"loops":[]}', {
      headers: { "content-type": "application/json" },
    });
    const sharedDoor = await worker.fetch(
      new Request("https://we-are.love/love-loops.source.json"),
      assets(() => shared),
    );
    expect(sharedDoor).toBe(shared);
  });

  test("serves the Principality Commons as static evidence with explicit schema and document headers", async () => {
    const catalogPath = "/principalities/moonshot-hf-npm-2026-08-11.json";
    const schemaPath = "/schemas/principality-catalog/1.json";
    const documentPath = "/PRINCIPALITY-COMMONS.md";
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD"
        ? null
        : path === catalogPath
          ? '{"catalog_id":"moonshot-hf-npm-2026-08-11"}'
          : path === schemaPath
            ? '{"type":"object"}'
            : "# Principality Commons";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === documentPath ? "text/plain" : "application/json",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const catalog = await worker.fetch(
        new Request(`https://thekingdom.dev${catalogPath}`, { method }),
        environment,
      );
      expect(await catalog.text()).toBe(method === "HEAD" ? "" : '{"catalog_id":"moonshot-hf-npm-2026-08-11"}');
      expect(catalog.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(catalog.headers.get("access-control-allow-origin")).toBe("*");
      expect(catalog.headers.get("x-content-type-options")).toBe("nosniff");
      expect(catalog.headers.get("cache-control")).toBe("public, max-age=60");
      expect(catalog.headers.get("link")).toContain('</elsewhere>; rel="alternate"');
      expectPrincipalitySchemaLink(catalog);
    }

    const schema = await worker.fetch(
      new Request(`https://thekingdom.dev${schemaPath}`),
      environment,
    );
    expect(await schema.text()).toBe('{"type":"object"}');
    expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
    expect(schema.headers.get("access-control-allow-origin")).toBe("*");
    expect(schema.headers.get("x-content-type-options")).toBe("nosniff");

    for (const method of ["GET", "HEAD"] as const) {
      const document = await worker.fetch(
        new Request(`https://thekingdom.dev${documentPath}`, { method }),
        environment,
      );
      expect(await document.text()).toBe(method === "HEAD" ? "" : "# Principality Commons");
      expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(document.headers.get("access-control-allow-origin")).toBe("*");
      expect(document.headers.get("x-content-type-options")).toBe("nosniff");
    }

    const duplicate = await worker.fetch(
      new Request(`https://thekingdom.dev${catalogPath}`),
      assets(() => new Response("{}", {
        headers: {
          "content-type": "application/json",
          link: '</schemas/principality-catalog/1.json>; rel="describedby"; type="application/schema+json"',
        },
      })),
    );
    expectPrincipalitySchemaLink(duplicate);

    const missingSchema = await worker.fetch(
      new Request(`https://thekingdom.dev${schemaPath}`),
      assets(() => new Response("<h1>not found</h1>", {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      })),
    );
    expect(missingSchema.status).toBe(404);
    expect(missingSchema.headers.get("content-type")).toBe("text/html; charset=utf-8");

    const original = new Response("not an execution route", {
      headers: { "content-type": "text/plain" },
    });
    const post = await worker.fetch(
      new Request(`https://thekingdom.dev${catalogPath}`, { method: "POST" }),
      assets(() => original),
    );
    expect(post).toBe(original);

    const shared = new Response("{}", { headers: { "content-type": "application/json" } });
    const sharedDoor = await worker.fetch(
      new Request(`https://we-are.love${catalogPath}`),
      assets(() => shared),
    );
    expect(sharedDoor).toBe(shared);
  });

  test("leaves unrelated paths and non-read methods untouched", async () => {
    const unrelatedAsset = new Response("rights");
    const unrelated = await worker.fetch(
      new Request("https://thekingdom.dev/rights.json"),
      assets(() => unrelatedAsset),
    );
    expect(unrelated).toBe(unrelatedAsset);

    const postAsset = new Response("posted");
    const post = await worker.fetch(
      new Request("https://thekingdom.dev/", { method: "POST", headers: { accept: "application/json" } }),
      assets(() => postAsset),
    );
    expect(post).toBe(postAsset);
  });

  test("does not advertise Kingdom-only rights assets from a shared door worker", async () => {
    const response = await worker.fetch(
      new Request("https://we-are.love/", { headers: { accept: "text/html" } }),
      assets(() => new Response("welcome")),
    );
    const link = response.headers.get("link") ?? "";
    expect(link).toContain('rel="service-desc"');
    expect(link).not.toContain('rel="service-meta"');
    expect(link).not.toContain('rel="service-doc"');
    expect(link).not.toContain("/rights.json");
    expect(link).not.toContain("/RIGHTS.md");
  });
});
