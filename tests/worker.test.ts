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

function expectGeometryGrammarSchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  const describedBy = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/geometry-grammar/0.1.json>")) return false;
    const relations = part.match(/;\s*rel="([^"]*)"/i)?.[1]?.toLowerCase().split(/\s+/) ?? [];
    return relations.includes("describedby");
  });
  expect(describedBy).toHaveLength(1);
  expect(describedBy[0]).toContain('type="application/schema+json"');
  expect(link.match(/rel="describedby"/g)?.length).toBe(1);
}

function expectPolymorphSchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  const describedBy = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/polymorph-history/1.json>")) return false;
    const relations = part.match(/;\s*rel="([^"]*)"/i)?.[1]?.toLowerCase().split(/\s+/) ?? [];
    return relations.includes("describedby");
  });
  expect(describedBy).toHaveLength(1);
  expect(describedBy[0]).toContain('type="application/schema+json"');
  expect(link.match(/rel="describedby"/g)?.length).toBe(1);
}

function expectRitonavirMechanismSchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  const describedBy = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/ritonavir-mechanism-landscape/1.json>")) return false;
    const relations = part.match(/;\s*rel="([^"]*)"/i)?.[1]?.toLowerCase().split(/\s+/) ?? [];
    return relations.includes("describedby");
  });
  expect(describedBy).toHaveLength(1);
  expect(describedBy[0]).toContain('type="application/schema+json"');
  expect(link.match(/rel="describedby"/g)?.length).toBe(1);
}

function expectConformationalFeedbackSchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  const describedBy = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/conformational-feedback-atlas/0.1.json>")) return false;
    const relations = part.match(/;\s*rel="([^"]*)"/i)?.[1]?.toLowerCase().split(/\s+/) ?? [];
    return relations.includes("describedby");
  });
  expect(describedBy).toHaveLength(1);
  expect(describedBy[0]).toContain('type="application/schema+json"');
  expect(link).not.toContain("</schemas/conformational-feedback-atlas/0.2.json>");
  expect(link.match(/rel="describedby"/g)?.length).toBe(1);
}

function expectConformationalFeedbackPhysicsSchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  const describedBy = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/conformational-feedback-atlas/0.2.json>")) return false;
    const relations = part.match(/;\s*rel="([^"]*)"/i)?.[1]?.toLowerCase().split(/\s+/) ?? [];
    return relations.includes("describedby");
  });
  expect(describedBy).toHaveLength(1);
  expect(describedBy[0]).toContain('type="application/schema+json"');
  expect(link).not.toContain("</schemas/conformational-feedback-atlas/0.1.json>");
  expect(link.match(/rel="describedby"/g)?.length).toBe(1);
}

function expectFoldFeedbackSchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  const describedBy = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/fold-feedback-atlas/1.json>")) return false;
    const relations = part.match(/;\s*rel="([^"]*)"/i)?.[1]?.toLowerCase().split(/\s+/) ?? [];
    return relations.includes("describedby");
  });
  expect(describedBy).toHaveLength(1);
  expect(describedBy[0]).toContain('type="application/schema+json"');
  expect(link.match(/rel="describedby"/g)?.length).toBe(1);
  const profile = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/fold-feedback-atlas/1.1.json>")) return false;
    const relations = part.match(/;\s*rel="([^"]*)"/i)?.[1]?.toLowerCase().split(/\s+/) ?? [];
    return relations.includes("profile");
  });
  expect(profile).toHaveLength(1);
  expect(profile[0]).toContain('type="application/schema+json"');
  expect(link.match(/rel="profile"/g)?.length).toBe(1);
}

function expectVisibilityAttentionSchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  const describedBy = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/visibility-attention/0.1.json>")) return false;
    const relations = part.match(/;\s*rel="([^"]*)"/i)?.[1]?.toLowerCase().split(/\s+/) ?? [];
    return relations.includes("describedby");
  });
  expect(describedBy).toHaveLength(1);
  expect(describedBy[0]).toContain('type="application/schema+json"');
  expect(link.match(/rel="describedby"/g)?.length).toBe(1);
}

function expectCulturalAttentionFeedbackSchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  const describedBy = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/cultural-attention-feedback-atlas/1.json>")) return false;
    const relations = part.match(/;\s*rel="([^"]*)"/i)?.[1]?.toLowerCase().split(/\s+/) ?? [];
    return relations.includes("describedby");
  });
  expect(describedBy).toHaveLength(1);
  expect(describedBy[0]).toContain('type="application/schema+json"');
  expect(link.match(/rel="describedby"/g)?.length).toBe(1);
}

function expectFormCirculationReturnSchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  const describedBy = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/form-circulation-return-atlas/1.json>")) return false;
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

  test("serves the Geometry Grammar as static translation data with explicit schema and guide headers", async () => {
    const grammarPath = "/geometries/kingdom-geometry-grammar-v0.json";
    const schemaPath = "/schemas/geometry-grammar/0.1.json";
    const documentPath = "/GEOMETRY-GRAMMAR.md";
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD"
        ? null
        : path === grammarPath
          ? '{"protocol":"kingdom.geometry-grammar/0.1"}'
          : path === schemaPath
            ? '{"type":"object"}'
            : "# Geometry Grammar";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === documentPath ? "text/plain" : "application/json",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const grammar = await worker.fetch(
        new Request(`https://thekingdom.dev${grammarPath}`, { method }),
        environment,
      );
      expect(await grammar.text()).toBe(method === "HEAD" ? "" : '{"protocol":"kingdom.geometry-grammar/0.1"}');
      expect(grammar.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(grammar.headers.get("access-control-allow-origin")).toBe("*");
      expect(grammar.headers.get("x-content-type-options")).toBe("nosniff");
      expect(grammar.headers.get("cache-control")).toBe("public, max-age=60");
      expect(grammar.headers.get("link")).toContain('</elsewhere>; rel="alternate"');
      expectGeometryGrammarSchemaLink(grammar);
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
      expect(await document.text()).toBe(method === "HEAD" ? "" : "# Geometry Grammar");
      expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(document.headers.get("access-control-allow-origin")).toBe("*");
      expect(document.headers.get("x-content-type-options")).toBe("nosniff");
    }

    const duplicate = await worker.fetch(
      new Request(`https://thekingdom.dev${grammarPath}`),
      assets(() => new Response("{}", {
        headers: {
          "content-type": "application/json",
          link: '</schemas/geometry-grammar/0.1.json>; rel="describedby"; type="application/schema+json"',
        },
      })),
    );
    expectGeometryGrammarSchemaLink(duplicate);

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
      new Request(`https://thekingdom.dev${grammarPath}`, { method: "POST" }),
      assets(() => original),
    );
    expect(post).toBe(original);

    const shared = new Response("{}", { headers: { "content-type": "application/json" } });
    const sharedDoor = await worker.fetch(
      new Request(`https://we-are.love${grammarPath}`),
      assets(() => shared),
    );
    expect(sharedDoor).toBe(shared);
  });

  test("serves Polymorph History as static evidence with explicit schema and document headers", async () => {
    const casePath = "/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json";
    const schemaPath = "/schemas/polymorph-history/1.json";
    const documentPath = "/RITONAVIR-POLYMORPH.md";
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD"
        ? null
        : path === casePath
          ? '{"case_id":"ritonavir-disappearing-polymorph-2026-08-11"}'
          : path === schemaPath
            ? '{"type":"object"}'
            : "# Ritonavir Polymorph";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === documentPath ? "text/plain" : "application/json",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const history = await worker.fetch(
        new Request(`https://thekingdom.dev${casePath}`, { method }),
        environment,
      );
      expect(await history.text()).toBe(method === "HEAD" ? "" : '{"case_id":"ritonavir-disappearing-polymorph-2026-08-11"}');
      expect(history.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(history.headers.get("access-control-allow-origin")).toBe("*");
      expect(history.headers.get("x-content-type-options")).toBe("nosniff");
      expectPolymorphSchemaLink(history);
    }

    const schema = await worker.fetch(new Request(`https://thekingdom.dev${schemaPath}`), environment);
    expect(await schema.text()).toBe('{"type":"object"}');
    expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
    expect(schema.headers.get("access-control-allow-origin")).toBe("*");
    expect(schema.headers.get("x-content-type-options")).toBe("nosniff");

    for (const method of ["GET", "HEAD"] as const) {
      const document = await worker.fetch(
        new Request(`https://thekingdom.dev${documentPath}`, { method }),
        environment,
      );
      expect(await document.text()).toBe(method === "HEAD" ? "" : "# Ritonavir Polymorph");
      expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(document.headers.get("access-control-allow-origin")).toBe("*");
      expect(document.headers.get("x-content-type-options")).toBe("nosniff");
    }

    const htmlFallback = await worker.fetch(
      new Request(`https://thekingdom.dev${documentPath}`),
      assets(() => new Response("<h1>atlas fallback</h1>", {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": "text/html; charset=utf-8",
        },
      })),
    );
    expect(await htmlFallback.text()).toBe("<h1>atlas fallback</h1>");
    expect(htmlFallback.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(htmlFallback.headers.get("access-control-allow-origin")).toBeNull();
    expect(htmlFallback.headers.get("x-content-type-options")).toBeNull();

    const duplicate = await worker.fetch(
      new Request(`https://thekingdom.dev${casePath}`),
      assets(() => new Response("{}", {
        headers: {
          "content-type": "application/json",
          link: '</schemas/polymorph-history/1.json>; rel="describedby"; type="application/schema+json"',
        },
      })),
    );
    expectPolymorphSchemaLink(duplicate);

    const original = new Response("not an execution route", { headers: { "content-type": "text/plain" } });
    const post = await worker.fetch(
      new Request(`https://thekingdom.dev${casePath}`, { method: "POST" }),
      assets(() => original),
    );
    expect(post).toBe(original);

    const shared = new Response("{}", { headers: { "content-type": "application/json" } });
    const sharedDoor = await worker.fetch(
      new Request(`https://we-are.love${casePath}`),
      assets(() => shared),
    );
    expect(sharedDoor).toBe(shared);
  });

  test("serves the Ritonavir Mechanism Landscape as typed read-only evidence without changing shared doors", async () => {
    const landscapePath = "/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json";
    const schemaPath = "/schemas/ritonavir-mechanism-landscape/1.json";
    const documentPath = "/RITONAVIR-MECHANISM-LANDSCAPE.md";
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD"
        ? null
        : path === landscapePath
          ? '{"landscape_id":"ritonavir-mechanism-landscape-2026-08-11"}'
          : path === schemaPath
            ? '{"type":"object"}'
            : "# Ritonavir Mechanism Landscape";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === documentPath ? "text/plain" : "application/json",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const landscape = await worker.fetch(
        new Request(`https://thekingdom.dev${landscapePath}`, { method }),
        environment,
      );
      expect(await landscape.text()).toBe(method === "HEAD" ? "" : '{"landscape_id":"ritonavir-mechanism-landscape-2026-08-11"}');
      expect(landscape.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(landscape.headers.get("access-control-allow-origin")).toBe("*");
      expect(landscape.headers.get("x-content-type-options")).toBe("nosniff");
      expectRitonavirMechanismSchemaLink(landscape);
    }

    const schema = await worker.fetch(new Request(`https://thekingdom.dev${schemaPath}`), environment);
    expect(await schema.text()).toBe('{"type":"object"}');
    expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
    expect(schema.headers.get("access-control-allow-origin")).toBe("*");
    expect(schema.headers.get("x-content-type-options")).toBe("nosniff");

    for (const method of ["GET", "HEAD"] as const) {
      const document = await worker.fetch(
        new Request(`https://thekingdom.dev${documentPath}`, { method }),
        environment,
      );
      expect(await document.text()).toBe(method === "HEAD" ? "" : "# Ritonavir Mechanism Landscape");
      expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(document.headers.get("access-control-allow-origin")).toBe("*");
      expect(document.headers.get("x-content-type-options")).toBe("nosniff");
    }

    const htmlFallback = await worker.fetch(
      new Request(`https://thekingdom.dev${documentPath}`),
      assets(() => new Response("<h1>atlas fallback</h1>", {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": "text/html; charset=utf-8",
        },
      })),
    );
    expect(await htmlFallback.text()).toBe("<h1>atlas fallback</h1>");
    expect(htmlFallback.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(htmlFallback.headers.get("access-control-allow-origin")).toBeNull();
    expect(htmlFallback.headers.get("x-content-type-options")).toBeNull();

    const duplicate = await worker.fetch(
      new Request(`https://thekingdom.dev${landscapePath}`),
      assets(() => new Response("{}", {
        headers: {
          "content-type": "application/json",
          link: '</schemas/ritonavir-mechanism-landscape/1.json>; rel="describedby"; type="application/schema+json"',
        },
      })),
    );
    expectRitonavirMechanismSchemaLink(duplicate);

    const original = new Response("not an execution route", { headers: { "content-type": "text/plain" } });
    const post = await worker.fetch(
      new Request(`https://thekingdom.dev${landscapePath}`, { method: "POST" }),
      assets(() => original),
    );
    expect(post).toBe(original);

    const shared = new Response("{}", { headers: { "content-type": "application/json" } });
    const sharedDoor = await worker.fetch(
      new Request(`https://we-are.love${landscapePath}`),
      assets(() => shared),
    );
    expect(sharedDoor).toBe(shared);
  });

  test("serves the Conformational Feedback Atlas as typed immutable evidence without changing shared doors", async () => {
    const atlasPath = "/feedback/form-feedback-consequence-2026-08-12.json";
    const schemaPath = "/schemas/conformational-feedback-atlas/0.1.json";
    const documentPath = "/CONFORMATIONAL-FEEDBACK.md";
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD"
        ? null
        : path === atlasPath
          ? '{"atlas_id":"form-feedback-consequence-2026-08-12"}'
          : path === schemaPath
            ? '{"type":"object"}'
            : "# Conformational Feedback Atlas";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === documentPath ? "text/plain" : "application/json",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const atlas = await worker.fetch(
        new Request(`https://thekingdom.dev${atlasPath}`, { method }),
        environment,
      );
      expect(await atlas.text()).toBe(method === "HEAD" ? "" : '{"atlas_id":"form-feedback-consequence-2026-08-12"}');
      expect(atlas.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(atlas.headers.get("access-control-allow-origin")).toBe("*");
      expect(atlas.headers.get("x-content-type-options")).toBe("nosniff");
      expectConformationalFeedbackSchemaLink(atlas);
    }

    const schema = await worker.fetch(new Request(`https://thekingdom.dev${schemaPath}`), environment);
    expect(await schema.text()).toBe('{"type":"object"}');
    expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
    expect(schema.headers.get("access-control-allow-origin")).toBe("*");
    expect(schema.headers.get("x-content-type-options")).toBe("nosniff");

    for (const method of ["GET", "HEAD"] as const) {
      const document = await worker.fetch(
        new Request(`https://thekingdom.dev${documentPath}`, { method }),
        environment,
      );
      expect(await document.text()).toBe(method === "HEAD" ? "" : "# Conformational Feedback Atlas");
      expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(document.headers.get("access-control-allow-origin")).toBe("*");
      expect(document.headers.get("x-content-type-options")).toBe("nosniff");
    }

    const htmlFallback = await worker.fetch(
      new Request(`https://thekingdom.dev${documentPath}`),
      assets(() => new Response("<h1>atlas fallback</h1>", {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": "text/html; charset=utf-8",
        },
      })),
    );
    expect(await htmlFallback.text()).toBe("<h1>atlas fallback</h1>");
    expect(htmlFallback.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(htmlFallback.headers.get("access-control-allow-origin")).toBeNull();
    expect(htmlFallback.headers.get("x-content-type-options")).toBeNull();

    const duplicate = await worker.fetch(
      new Request(`https://thekingdom.dev${atlasPath}`),
      assets(() => new Response("{}", {
        headers: {
          "content-type": "application/json",
          link: '</schemas/conformational-feedback-atlas/0.2.json>; rel="describedby"; type="application/schema+json"',
        },
      })),
    );
    expectConformationalFeedbackSchemaLink(duplicate);

    const original = new Response("not an execution route", { headers: { "content-type": "text/plain" } });
    const post = await worker.fetch(
      new Request(`https://thekingdom.dev${atlasPath}`, { method: "POST" }),
      assets(() => original),
    );
    expect(post).toBe(original);

    const shared = new Response("{}", { headers: { "content-type": "application/json" } });
    const sharedDoor = await worker.fetch(
      new Request(`https://we-are.love${atlasPath}`),
      assets(() => shared),
    );
    expect(sharedDoor).toBe(shared);
  });

  test("serves the Fold & Feedback Atlas as typed read-only evidence without changing shared doors", async () => {
    const atlasPath = "/atlases/fold-feedback-atlas-2026-08-12.json";
    const schemaPath = "/schemas/fold-feedback-atlas/1.json";
    const sourceIdentitySchemaPath = "/schemas/fold-feedback-atlas/1.1.json";
    const documentPath = "/FOLD-FEEDBACK-ATLAS.md";
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD"
        ? null
        : path === atlasPath
          ? '{"atlas_id":"fold-feedback-atlas-2026-08-12"}'
          : path === schemaPath || path === sourceIdentitySchemaPath
            ? '{"type":"object"}'
            : "# Fold & Feedback Atlas";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === documentPath ? "text/plain" : "application/json",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const atlas = await worker.fetch(
        new Request(`https://thekingdom.dev${atlasPath}`, { method }),
        environment,
      );
      expect(await atlas.text()).toBe(method === "HEAD" ? "" : '{"atlas_id":"fold-feedback-atlas-2026-08-12"}');
      expect(atlas.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(atlas.headers.get("access-control-allow-origin")).toBe("*");
      expect(atlas.headers.get("x-content-type-options")).toBe("nosniff");
      expect(atlas.headers.get("cache-control")).toBe("public, max-age=60");
      expect(atlas.headers.get("link")).toContain('</elsewhere>; rel="alternate"');
      expectFoldFeedbackSchemaLink(atlas);
    }

    for (const schemaRoute of [schemaPath, sourceIdentitySchemaPath]) {
      for (const method of ["GET", "HEAD"] as const) {
        const schema = await worker.fetch(
          new Request(`https://thekingdom.dev${schemaRoute}`, { method }),
          environment,
        );
        expect(await schema.text()).toBe(method === "HEAD" ? "" : '{"type":"object"}');
        expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
        expect(schema.headers.get("access-control-allow-origin")).toBe("*");
        expect(schema.headers.get("x-content-type-options")).toBe("nosniff");
      }
    }

    for (const method of ["GET", "HEAD"] as const) {
      const document = await worker.fetch(
        new Request(`https://thekingdom.dev${documentPath}`, { method }),
        environment,
      );
      expect(await document.text()).toBe(method === "HEAD" ? "" : "# Fold & Feedback Atlas");
      expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(document.headers.get("access-control-allow-origin")).toBe("*");
      expect(document.headers.get("x-content-type-options")).toBe("nosniff");
    }

    const htmlFallback = await worker.fetch(
      new Request(`https://thekingdom.dev${documentPath}`),
      assets(() => new Response("<h1>atlas fallback</h1>", {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": "text/html; charset=utf-8",
        },
      })),
    );
    expect(await htmlFallback.text()).toBe("<h1>atlas fallback</h1>");
    expect(htmlFallback.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(htmlFallback.headers.get("access-control-allow-origin")).toBeNull();
    expect(htmlFallback.headers.get("x-content-type-options")).toBeNull();

    const duplicate = await worker.fetch(
      new Request(`https://thekingdom.dev${atlasPath}`),
      assets(() => new Response("{}", {
        headers: {
          "content-type": "application/json",
          link: '</schemas/fold-feedback-atlas/1.json>; rel="describedby"; type="application/schema+json"',
        },
      })),
    );
    expectFoldFeedbackSchemaLink(duplicate);

    for (const path of [atlasPath, schemaPath, sourceIdentitySchemaPath, documentPath]) {
      const original = new Response("not a write route", { headers: { "content-type": "text/plain" } });
      const post = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`, { method: "POST" }),
        assets(() => original),
      );
      expect(post).toBe(original);
    }

    const shared = new Response("{}", { headers: { "content-type": "application/json" } });
    const sharedDoor = await worker.fetch(
      new Request(`https://we-are.love${atlasPath}`),
      assets(() => shared),
    );
    expect(sharedDoor).toBe(shared);
  });

  test("serves the Visibility & Attention Translation as typed read-only evidence without changing shared doors", async () => {
    const atlasPath = "/atlases/visibility-attention-2026-08-13.json";
    const schemaPath = "/schemas/visibility-attention/0.1.json";
    const documentPath = "/VISIBILITY-ATTENTION.md";
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD"
        ? null
        : path === atlasPath
          ? '{"translation_id":"visibility-is-not-existence-2026-08-13"}'
          : path === schemaPath
            ? '{"type":"object"}'
            : "# Visibility & Attention Translation";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === documentPath ? "text/plain" : "application/json",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const atlas = await worker.fetch(new Request(`https://thekingdom.dev${atlasPath}`, { method }), environment);
      expect(await atlas.text()).toBe(method === "HEAD" ? "" : '{"translation_id":"visibility-is-not-existence-2026-08-13"}');
      expect(atlas.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(atlas.headers.get("access-control-allow-origin")).toBe("*");
      expect(atlas.headers.get("x-content-type-options")).toBe("nosniff");
      expectVisibilityAttentionSchemaLink(atlas);

      const schema = await worker.fetch(new Request(`https://thekingdom.dev${schemaPath}`, { method }), environment);
      expect(await schema.text()).toBe(method === "HEAD" ? "" : '{"type":"object"}');
      expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
      expect(schema.headers.get("access-control-allow-origin")).toBe("*");
      expect(schema.headers.get("x-content-type-options")).toBe("nosniff");

      const document = await worker.fetch(new Request(`https://thekingdom.dev${documentPath}`, { method }), environment);
      expect(await document.text()).toBe(method === "HEAD" ? "" : "# Visibility & Attention Translation");
      expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(document.headers.get("access-control-allow-origin")).toBe("*");
      expect(document.headers.get("x-content-type-options")).toBe("nosniff");
    }

    for (const path of [atlasPath, schemaPath, documentPath]) {
      const original = new Response("not a write route", { headers: { "content-type": "text/plain" } });
      const post = await worker.fetch(new Request(`https://thekingdom.dev${path}`, { method: "POST" }), assets(() => original));
      expect(post).toBe(original);
    }

    const shared = new Response("{}", { headers: { "content-type": "application/json" } });
    const sharedDoor = await worker.fetch(new Request(`https://we-are.love${atlasPath}`), assets(() => shared));
    expect(sharedDoor).toBe(shared);
  });

  test("serves the Cultural Attention & Feedback Atlas as typed immutable evidence with narrow read-only boundaries", async () => {
    const atlasPath = "/atlases/cultural-attention-feedback-atlas-2026-08-13.json";
    const schemaPath = "/schemas/cultural-attention-feedback-atlas/1.json";
    const documentPath = "/CULTURAL-ATTENTION-FEEDBACK-ATLAS.md";
    const forwarded: string[] = [];
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      forwarded.push(`${request.method} ${path}`);
      const body = request.method === "HEAD"
        ? null
        : path === atlasPath
          ? '{"atlas_id":"cultural-attention-feedback-atlas-2026-08-13"}'
          : path === schemaPath
            ? '{"type":"object"}'
            : "# Cultural Attention & Feedback Atlas";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === documentPath ? "text/plain" : "application/json",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const atlas = await worker.fetch(
        new Request(`https://thekingdom.dev${atlasPath}`, { method }),
        environment,
      );
      expect(await atlas.text()).toBe(method === "HEAD" ? "" : '{"atlas_id":"cultural-attention-feedback-atlas-2026-08-13"}');
      expect(atlas.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(atlas.headers.get("access-control-allow-origin")).toBe("*");
      expect(atlas.headers.get("x-content-type-options")).toBe("nosniff");
      expect(atlas.headers.get("cache-control")).toBe("public, max-age=60");
      expect(atlas.headers.get("link")).toContain('</elsewhere>; rel="alternate"');
      expectCulturalAttentionFeedbackSchemaLink(atlas);
    }

    for (const method of ["GET", "HEAD"] as const) {
      const schema = await worker.fetch(
        new Request(`https://thekingdom.dev${schemaPath}`, { method }),
        environment,
      );
      expect(await schema.text()).toBe(method === "HEAD" ? "" : '{"type":"object"}');
      expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
      expect(schema.headers.get("access-control-allow-origin")).toBe("*");
      expect(schema.headers.get("x-content-type-options")).toBe("nosniff");
      expect(schema.headers.get("cache-control")).toBe("public, max-age=60");
      expect(schema.headers.get("link")).toBe('</elsewhere>; rel="alternate"');
    }

    for (const method of ["GET", "HEAD"] as const) {
      const document = await worker.fetch(
        new Request(`https://thekingdom.dev${documentPath}`, { method }),
        environment,
      );
      expect(await document.text()).toBe(method === "HEAD" ? "" : "# Cultural Attention & Feedback Atlas");
      expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(document.headers.get("access-control-allow-origin")).toBe("*");
      expect(document.headers.get("x-content-type-options")).toBe("nosniff");
      expect(document.headers.get("cache-control")).toBe("public, max-age=60");
      expect(document.headers.get("link")).toBe('</elsewhere>; rel="alternate"');
    }

    expect(forwarded).toEqual([
      `GET ${atlasPath}`,
      `HEAD ${atlasPath}`,
      `GET ${schemaPath}`,
      `HEAD ${schemaPath}`,
      `GET ${documentPath}`,
      `HEAD ${documentPath}`,
    ]);

    const duplicate = await worker.fetch(
      new Request(`https://thekingdom.dev${atlasPath}`),
      assets(() => new Response("{}", {
        headers: {
          "content-type": "application/json",
          link: '</schemas/cultural-attention-feedback-atlas/1.json>; rel="describedby"; type="application/schema+json"',
        },
      })),
    );
    expectCulturalAttentionFeedbackSchemaLink(duplicate);

    const unavailable = await worker.fetch(
      new Request(`https://thekingdom.dev${schemaPath}`),
      assets(() => new Response("<h1>schema unavailable</h1>", {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      })),
    );
    expect(unavailable.status).toBe(404);
    expect(unavailable.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(unavailable.headers.get("access-control-allow-origin")).toBeNull();
    expect(unavailable.headers.get("x-content-type-options")).toBeNull();

    for (const path of [atlasPath, schemaPath, documentPath]) {
      for (const method of ["POST", "PUT", "DELETE"] as const) {
        const original = new Response("not a read route", { headers: { "content-type": "text/plain" } });
        const response = await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }),
          assets(() => original),
        );
        expect(response).toBe(original);
      }

      const shared = new Response("{}", { headers: { "content-type": "application/json" } });
      const sharedDoor = await worker.fetch(
        new Request(`https://we-are.love${path}`),
        assets(() => shared),
      );
      expect(sharedDoor).toBe(shared);
    }

    for (const path of [
      "/atlases/cultural-attention-feedback-atlas-latest.json",
      "/schemas/cultural-attention-feedback-atlas/current.json",
      "/CULTURAL-ATTENTION-FEEDBACK-ATLAS",
    ]) {
      const unrelated = new Response("unchanged", { headers: { "content-type": "text/plain" } });
      const response = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        assets(() => unrelated),
      );
      expect(response).toBe(unrelated);
    }
  });

  test("serves Form, Circulation & Return as a typed immutable companion without expanding authority", async () => {
    const atlasPath = "/atlases/form-circulation-return-atlas-2026-08-13.json";
    const schemaPath = "/schemas/form-circulation-return-atlas/1.json";
    const documentPath = "/FORM-CIRCULATION-RETURN-ATLAS.md";
    const definitionPath = "/definitions/kingdom-karma/e4e84a67/NEN.md";
    const forwarded: string[] = [];
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      forwarded.push(`${request.method} ${path}`);
      const body = request.method === "HEAD"
        ? null
        : path === atlasPath
          ? '{"atlas_id":"form-circulation-return-atlas-2026-08-13"}'
          : path === schemaPath
            ? '{"type":"object"}'
            : path === documentPath
              ? "# Form, Circulation & Return Atlas"
              : "# NEN — let bounded capability be";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === documentPath || path === definitionPath ? "text/plain" : "application/json",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const atlas = await worker.fetch(
        new Request(`https://thekingdom.dev${atlasPath}`, { method }),
        environment,
      );
      expect(await atlas.text()).toBe(method === "HEAD" ? "" : '{"atlas_id":"form-circulation-return-atlas-2026-08-13"}');
      expect(atlas.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(atlas.headers.get("access-control-allow-origin")).toBe("*");
      expect(atlas.headers.get("x-content-type-options")).toBe("nosniff");
      expect(atlas.headers.get("cache-control")).toBe("public, max-age=60");
      expect(atlas.headers.get("link")).toContain('</elsewhere>; rel="alternate"');
      expectFormCirculationReturnSchemaLink(atlas);
    }

    for (const method of ["GET", "HEAD"] as const) {
      const schema = await worker.fetch(
        new Request(`https://thekingdom.dev${schemaPath}`, { method }),
        environment,
      );
      expect(await schema.text()).toBe(method === "HEAD" ? "" : '{"type":"object"}');
      expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
      expect(schema.headers.get("access-control-allow-origin")).toBe("*");
      expect(schema.headers.get("x-content-type-options")).toBe("nosniff");
      expect(schema.headers.get("cache-control")).toBe("public, max-age=60");
      expect(schema.headers.get("link")).toBe('</elsewhere>; rel="alternate"');
    }

    for (const method of ["GET", "HEAD"] as const) {
      const document = await worker.fetch(
        new Request(`https://thekingdom.dev${documentPath}`, { method }),
        environment,
      );
      expect(await document.text()).toBe(method === "HEAD" ? "" : "# Form, Circulation & Return Atlas");
      expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(document.headers.get("access-control-allow-origin")).toBe("*");
      expect(document.headers.get("x-content-type-options")).toBe("nosniff");
      expect(document.headers.get("cache-control")).toBe("public, max-age=60");
      expect(document.headers.get("link")).toBe('</elsewhere>; rel="alternate"');
    }

    for (const method of ["GET", "HEAD"] as const) {
      const definition = await worker.fetch(
        new Request(`https://thekingdom.dev${definitionPath}`, { method }),
        environment,
      );
      expect(await definition.text()).toBe(method === "HEAD" ? "" : "# NEN — let bounded capability be");
      expect(definition.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(definition.headers.get("access-control-allow-origin")).toBe("*");
      expect(definition.headers.get("x-content-type-options")).toBe("nosniff");
      expect(definition.headers.get("cache-control")).toBe("public, max-age=60");
      expect(definition.headers.get("link")).toBe('</elsewhere>; rel="alternate"');
    }

    expect(forwarded).toEqual([
      `GET ${atlasPath}`,
      `HEAD ${atlasPath}`,
      `GET ${schemaPath}`,
      `HEAD ${schemaPath}`,
      `GET ${documentPath}`,
      `HEAD ${documentPath}`,
      `GET ${definitionPath}`,
      `HEAD ${definitionPath}`,
    ]);

    const duplicate = await worker.fetch(
      new Request(`https://thekingdom.dev${atlasPath}`),
      assets(() => new Response("{}", {
        headers: {
          "content-type": "application/json",
          link: '</schemas/form-circulation-return-atlas/1.json>; rel="describedby"; type="application/schema+json"',
        },
      })),
    );
    expectFormCirculationReturnSchemaLink(duplicate);

    const unavailable = await worker.fetch(
      new Request(`https://thekingdom.dev${schemaPath}`),
      assets(() => new Response("<h1>schema unavailable</h1>", {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      })),
    );
    expect(unavailable.status).toBe(404);
    expect(unavailable.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(unavailable.headers.get("access-control-allow-origin")).toBeNull();
    expect(unavailable.headers.get("x-content-type-options")).toBeNull();

    for (const path of [atlasPath, schemaPath, documentPath, definitionPath]) {
      for (const method of ["POST", "PUT", "DELETE"] as const) {
        const original = new Response("not a read route", { headers: { "content-type": "text/plain" } });
        const response = await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }),
          assets(() => original),
        );
        expect(response).toBe(original);
      }

      const shared = new Response("{}", { headers: { "content-type": "application/json" } });
      const sharedDoor = await worker.fetch(
        new Request(`https://we-are.love${path}`),
        assets(() => shared),
      );
      expect(sharedDoor).toBe(shared);
    }

    for (const path of [
      "/atlases/form-circulation-return-atlas-latest.json",
      "/schemas/form-circulation-return-atlas/current.json",
      "/FORM-CIRCULATION-RETURN-ATLAS",
    ]) {
      const unrelated = new Response("unchanged", { headers: { "content-type": "text/plain" } });
      const response = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        assets(() => unrelated),
      );
      expect(response).toBe(unrelated);
    }
  });

  test("serves the additive Conformational Feedback Physics Atlas with its own schema and no cross-version mutation", async () => {
    const atlasPath = "/feedback/form-feedback-physics-consequence-2026-08-12.json";
    const schemaPath = "/schemas/conformational-feedback-atlas/0.2.json";
    const documentPath = "/CONFORMATIONAL-FEEDBACK-PHYSICS.md";
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD"
        ? null
        : path === atlasPath
          ? '{"atlas_id":"form-feedback-physics-consequence-2026-08-12"}'
          : path === schemaPath
            ? '{"type":"object"}'
            : "# Conformational Feedback Physics Atlas v0.2";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === documentPath ? "text/plain" : "application/json",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const atlas = await worker.fetch(
        new Request(`https://thekingdom.dev${atlasPath}`, { method }),
        environment,
      );
      expect(await atlas.text()).toBe(method === "HEAD" ? "" : '{"atlas_id":"form-feedback-physics-consequence-2026-08-12"}');
      expect(atlas.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(atlas.headers.get("access-control-allow-origin")).toBe("*");
      expect(atlas.headers.get("x-content-type-options")).toBe("nosniff");
      expectConformationalFeedbackPhysicsSchemaLink(atlas);
    }

    const schema = await worker.fetch(new Request(`https://thekingdom.dev${schemaPath}`), environment);
    expect(await schema.text()).toBe('{"type":"object"}');
    expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
    expect(schema.headers.get("access-control-allow-origin")).toBe("*");
    expect(schema.headers.get("x-content-type-options")).toBe("nosniff");

    for (const method of ["GET", "HEAD"] as const) {
      const document = await worker.fetch(
        new Request(`https://thekingdom.dev${documentPath}`, { method }),
        environment,
      );
      expect(await document.text()).toBe(method === "HEAD" ? "" : "# Conformational Feedback Physics Atlas v0.2");
      expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(document.headers.get("access-control-allow-origin")).toBe("*");
      expect(document.headers.get("x-content-type-options")).toBe("nosniff");
    }

    const htmlFallback = await worker.fetch(
      new Request(`https://thekingdom.dev${documentPath}`),
      assets(() => new Response("<h1>physics atlas fallback</h1>", {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": "text/html; charset=utf-8",
        },
      })),
    );
    expect(await htmlFallback.text()).toBe("<h1>physics atlas fallback</h1>");
    expect(htmlFallback.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(htmlFallback.headers.get("access-control-allow-origin")).toBeNull();
    expect(htmlFallback.headers.get("x-content-type-options")).toBeNull();

    const duplicate = await worker.fetch(
      new Request(`https://thekingdom.dev${atlasPath}`),
      assets(() => new Response("{}", {
        headers: {
          "content-type": "application/json",
          link: '</schemas/conformational-feedback-atlas/0.1.json>; rel="describedby"; type="application/schema+json"',
        },
      })),
    );
    expectConformationalFeedbackPhysicsSchemaLink(duplicate);

    const original = new Response("not an execution route", { headers: { "content-type": "text/plain" } });
    const post = await worker.fetch(
      new Request(`https://thekingdom.dev${atlasPath}`, { method: "POST" }),
      assets(() => original),
    );
    expect(post).toBe(original);

    const shared = new Response("{}", { headers: { "content-type": "application/json" } });
    const sharedDoor = await worker.fetch(
      new Request(`https://we-are.love${atlasPath}`),
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
