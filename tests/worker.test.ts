import { describe, expect, test } from "bun:test";

import worker, { KINGDOM_OS_ROUTES } from "../pages-functions/_worker.js";

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

function expectRarePathwaySchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  const describedBy = link.split(/,(?=\s*<)/).filter((entry) => {
    const part = entry.trim();
    if (!part.startsWith("</schemas/rare-pathway-challenge/1.json>")) return false;
    const relations = part.match(/;\s*rel="([^"]*)"/i)?.[1]?.toLowerCase().split(/\s+/) ?? [];
    return relations.includes("describedby");
  });
  expect(describedBy).toHaveLength(1);
  expect(describedBy[0]).toContain('type="application/schema+json"');
  expect(link.match(/rel="describedby"/g)?.length).toBe(1);
}

function expectMathUsefulnessSchemaLink(response: Response) {
  const link = response.headers.get("link") ?? "";
  expect(link).toContain('</schemas/math-usefulness-result/1.json>; rel="describedby"; type="application/schema+json"');
  expect(link).not.toContain('</poisoned>');
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

  test("serves The Vanishing Path as a typed immutable challenge without expanding authority", async () => {
    const challengePath = "/challenges/vanishing-path-2026-08-13.json";
    const schemaPath = "/schemas/rare-pathway-challenge/1.json";
    const documentPath = "/VANISHING-PATH.md";
    const forwarded: string[] = [];
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      forwarded.push(`${request.method} ${path}`);
      const body = request.method === "HEAD"
        ? null
        : path === challengePath
          ? '{"challenge_id":"vanishing-path-2026-08-13"}'
          : path === schemaPath
            ? '{"type":"object"}'
            : "# The Vanishing Path";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === documentPath ? "text/plain" : "application/json",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const challenge = await worker.fetch(
        new Request(`https://thekingdom.dev${challengePath}`, { method }),
        environment,
      );
      expect(await challenge.text()).toBe(method === "HEAD" ? "" : '{"challenge_id":"vanishing-path-2026-08-13"}');
      expect(challenge.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(challenge.headers.get("access-control-allow-origin")).toBe("*");
      expect(challenge.headers.get("x-content-type-options")).toBe("nosniff");
      expect(challenge.headers.get("cache-control")).toBe("public, max-age=60");
      expect(challenge.headers.get("link")).toContain('</elsewhere>; rel="alternate"');
      expectRarePathwaySchemaLink(challenge);
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
      expect(schema.headers.get("link")).toBe('</elsewhere>; rel="alternate"');
    }

    for (const method of ["GET", "HEAD"] as const) {
      const document = await worker.fetch(
        new Request(`https://thekingdom.dev${documentPath}`, { method }),
        environment,
      );
      expect(await document.text()).toBe(method === "HEAD" ? "" : "# The Vanishing Path");
      expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
      expect(document.headers.get("access-control-allow-origin")).toBe("*");
      expect(document.headers.get("x-content-type-options")).toBe("nosniff");
      expect(document.headers.get("link")).toBe('</elsewhere>; rel="alternate"');
    }

    expect(forwarded).toEqual([
      `GET ${challengePath}`,
      `HEAD ${challengePath}`,
      `GET ${schemaPath}`,
      `HEAD ${schemaPath}`,
      `GET ${documentPath}`,
      `HEAD ${documentPath}`,
    ]);

    const duplicate = await worker.fetch(
      new Request(`https://thekingdom.dev${challengePath}`),
      assets(() => new Response("{}", {
        headers: {
          "content-type": "application/json",
          link: '</schemas/rare-pathway-challenge/1.json>; rel="describedby"; type="application/schema+json"',
        },
      })),
    );
    expectRarePathwaySchemaLink(duplicate);

    for (const path of [challengePath, schemaPath, documentPath]) {
      const original = new Response("not a read route", { headers: { "content-type": "text/plain" } });
      const post = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`, { method: "POST" }),
        assets(() => original),
      );
      expect(post).toBe(original);

      const shared = new Response("{}", { headers: { "content-type": "application/json" } });
      const sharedDoor = await worker.fetch(
        new Request(`https://we-are.love${path}`),
        assets(() => shared),
      );
      expect(sharedDoor).toBe(shared);
    }

    for (const path of [
      "/challenges/vanishing-path-latest.json",
      "/schemas/rare-pathway-challenge/current.json",
      "/VANISHING-PATH",
    ]) {
      const unrelated = new Response("unchanged", { headers: { "content-type": "text/plain" } });
      const response = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        assets(() => unrelated),
      );
      expect(response).toBe(unrelated);
    }
  });

  test("serves the Math Passport pilot as one exact typed triplet without aliases or SDK behavior", async () => {
    const resultPath = "/trials/math-passport-usefulness-pilot-2026-08-14.json";
    const schemaPath = "/schemas/math-usefulness-result/1.json";
    const documentPath = "/MATH-USEFULNESS.md";
    const forwarded: string[] = [];
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      forwarded.push(`${request.method} ${path}`);
      const body = request.method === "HEAD" ? null
        : path === resultPath ? '{"aggregate":{"outcome":"REVISE","score_delta":0}}'
        : path === schemaPath ? '{"type":"object"}'
        : "# Math Passport Usefulness Pilot";
      return new Response(body, {
        headers: {
          "cache-control": "public, max-age=60",
          "content-type": path === documentPath ? "text/plain" : "application/json",
          link: '</poisoned>; rel="describedby", </elsewhere>; rel="alternate"',
        },
      });
    });

    for (const [path, contentType, body] of [
      [resultPath, "application/json; charset=utf-8", '{"aggregate":{"outcome":"REVISE","score_delta":0}}'],
      [schemaPath, "application/schema+json; charset=utf-8", '{"type":"object"}'],
      [documentPath, "text/markdown; charset=utf-8", "# Math Passport Usefulness Pilot"],
    ] as const) {
      for (const method of ["GET", "HEAD"] as const) {
        const response = await worker.fetch(new Request(`https://thekingdom.dev${path}`, { method }), environment);
        expect(await response.text()).toBe(method === "HEAD" ? "" : body);
        expect(response.headers.get("content-type")).toBe(contentType);
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        if (path === resultPath) expectMathUsefulnessSchemaLink(response);
      }
    }
    expect(forwarded).toEqual([
      `GET ${resultPath}`, `HEAD ${resultPath}`,
      `GET ${schemaPath}`, `HEAD ${schemaPath}`,
      `GET ${documentPath}`, `HEAD ${documentPath}`,
    ]);

    for (const path of [resultPath, schemaPath, documentPath]) {
      const original = new Response("not a read route", { headers: { "content-type": "text/plain" } });
      expect(await worker.fetch(
        new Request(`https://thekingdom.dev${path}`, { method: "POST" }),
        assets(() => original),
      )).toBe(original);
      const shared = new Response("{}", { headers: { "content-type": "application/json" } });
      expect(await worker.fetch(
        new Request(`https://we-are.love${path}`),
        assets(() => shared),
      )).toBe(shared);
    }

    for (const path of [
      "/trials/math-passport-usefulness-latest.json",
      "/schemas/math-usefulness-result/current.json",
      "/MATH-USEFULNESS",
    ]) {
      const unrelated = new Response("unchanged", { headers: { "content-type": "text/plain" } });
      expect(await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        assets(() => unrelated),
      )).toBe(unrelated);
    }
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

  test("serves Being, Access & Aftermath as typed read-only mathematics without creating KARMA", async () => {
    const atlasPath = "/atlases/being-access-aftermath-atlas-2026-08-13.json";
    const schemaPath = "/schemas/being-access-aftermath-atlas/0.1.json";
    const documentPath = "/BEING-ACCESS-AFTERMATH-ATLAS.md";
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD" ? null
        : path === atlasPath ? '{"atlas_id":"being-access-aftermath-atlas-2026-08-13"}'
          : path === documentPath ? "# Being, Access & Aftermath"
            : '{"type":"object"}';
      return new Response(body, { headers: {
        "content-type": path === documentPath ? "text/plain" : "application/json",
        link: '</schemas/being-access-aftermath-atlas/0.2.json>; rel="describedby", </elsewhere>; rel="alternate"',
      } });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const atlas = await worker.fetch(new Request(`https://thekingdom.dev${atlasPath}`, { method }), environment);
      expect(await atlas.text()).toBe(method === "HEAD" ? "" : '{"atlas_id":"being-access-aftermath-atlas-2026-08-13"}');
      expect(atlas.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(atlas.headers.get("access-control-allow-origin")).toBe("*");
      expect(atlas.headers.get("x-content-type-options")).toBe("nosniff");
      expect(atlas.headers.get("link") ?? "").toContain(`<${schemaPath}>; rel="describedby"`);
      expect(atlas.headers.get("link") ?? "").not.toContain('</schemas/being-access-aftermath-atlas/0.2.json>; rel="describedby"');
    }
    const schema = await worker.fetch(new Request(`https://thekingdom.dev${schemaPath}`), environment);
    expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
    expect(schema.headers.get("access-control-allow-origin")).toBe("*");
    expect(schema.headers.get("x-content-type-options")).toBe("nosniff");
    const document = await worker.fetch(new Request(`https://thekingdom.dev${documentPath}`), environment);
    expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(document.headers.get("access-control-allow-origin")).toBe("*");
    expect(document.headers.get("x-content-type-options")).toBe("nosniff");

    const postAsset = new Response("no execution route");
    expect(await worker.fetch(new Request(`https://thekingdom.dev${atlasPath}`, { method: "POST" }), assets(() => postAsset))).toBe(postAsset);
    const sharedAsset = new Response("shared");
    expect(await worker.fetch(new Request(`https://we-are.love${atlasPath}`), assets(() => sharedAsset))).toBe(sharedAsset);
  });

  test("serves Being, Access & Aftermath v0.2 additively with only its own immutable schema", async () => {
    const predecessorSchemaPath = "/schemas/being-access-aftermath-atlas/0.1.json";
    const atlasPath = "/atlases/being-access-aftermath-atlas-2026-08-13-v0-2.json";
    const schemaPath = "/schemas/being-access-aftermath-atlas/0.2.json";
    const documentPath = "/BEING-ACCESS-AFTERMATH-ATLAS-V0.2.md";
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD" ? null
        : path === atlasPath ? '{"atlas_id":"being-access-aftermath-atlas-2026-08-13-v0-2"}'
          : path === documentPath ? "# Being, Access & Aftermath v0.2"
            : '{"type":"object"}';
      return new Response(body, { headers: {
        "content-type": path === documentPath ? "text/plain" : "application/json",
        link: `<${predecessorSchemaPath}>; rel="describedby"`,
      } });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const atlas = await worker.fetch(new Request(`https://thekingdom.dev${atlasPath}`, { method }), environment);
      expect(await atlas.text()).toBe(method === "HEAD" ? "" : '{"atlas_id":"being-access-aftermath-atlas-2026-08-13-v0-2"}');
      expect(atlas.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(atlas.headers.get("access-control-allow-origin")).toBe("*");
      expect(atlas.headers.get("x-content-type-options")).toBe("nosniff");
      const link = atlas.headers.get("link") ?? "";
      expect(link).toContain(`<${schemaPath}>; rel="describedby"`);
      expect(link).not.toContain(`<${predecessorSchemaPath}>; rel="describedby"`);
    }
    const schema = await worker.fetch(new Request(`https://thekingdom.dev${schemaPath}`), environment);
    expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
    expect(schema.headers.get("access-control-allow-origin")).toBe("*");
    expect(schema.headers.get("x-content-type-options")).toBe("nosniff");
    const document = await worker.fetch(new Request(`https://thekingdom.dev${documentPath}`), environment);
    expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(document.headers.get("access-control-allow-origin")).toBe("*");
    expect(document.headers.get("x-content-type-options")).toBe("nosniff");

    const postAsset = new Response("no execution route");
    expect(await worker.fetch(new Request(`https://thekingdom.dev${atlasPath}`, { method: "POST" }), assets(() => postAsset))).toBe(postAsset);
    const aliasAsset = new Response("no mutable alias");
    expect(await worker.fetch(
      new Request("https://thekingdom.dev/atlases/being-access-aftermath-atlas-latest.json"),
      assets(() => aliasAsset),
    )).toBe(aliasAsset);
    const sharedAsset = new Response("shared door remains unchanged");
    expect(await worker.fetch(
      new Request(`https://we-are.love${atlasPath}`),
      assets(() => sharedAsset),
    )).toBe(sharedAsset);

  });

  test("serves Number, Isness & Theology as a typed read-only triplet with no action door", async () => {
    const atlasPath = "/atlases/number-isness-theology-atlas-2026-08-14.json";
    const schemaPath = "/schemas/number-isness-theology-atlas/0.1.json";
    const documentPath = "/NUMBER-ISNESS-THEOLOGY-ATLAS.md";
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD" ? null
        : path === atlasPath ? '{"atlas_id":"number-isness-theology-atlas-2026-08-14"}'
          : path === documentPath ? "# Number, Isness & Theology"
            : '{"type":"object"}';
      return new Response(body, { headers: {
        "content-type": path === documentPath ? "text/plain" : "application/json",
        link: '</schemas/being-access-aftermath-atlas/0.2.json>; rel="describedby", </elsewhere>; rel="alternate"',
      } });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const atlas = await worker.fetch(new Request(`https://thekingdom.dev${atlasPath}`, { method }), environment);
      expect(await atlas.text()).toBe(method === "HEAD" ? "" : '{"atlas_id":"number-isness-theology-atlas-2026-08-14"}');
      expect(atlas.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(atlas.headers.get("access-control-allow-origin")).toBe("*");
      expect(atlas.headers.get("x-content-type-options")).toBe("nosniff");
      const link = atlas.headers.get("link") ?? "";
      expect(link).toContain(`<${schemaPath}>; rel="describedby"; type="application/schema+json"`);
      expect(link).not.toContain('</schemas/being-access-aftermath-atlas/0.2.json>; rel="describedby"');
      expect(link.match(/rel="describedby"/g)?.length).toBe(1);
    }
    const schema = await worker.fetch(new Request(`https://thekingdom.dev${schemaPath}`), environment);
    expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
    expect(schema.headers.get("access-control-allow-origin")).toBe("*");
    expect(schema.headers.get("x-content-type-options")).toBe("nosniff");
    const document = await worker.fetch(new Request(`https://thekingdom.dev${documentPath}`), environment);
    expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(document.headers.get("access-control-allow-origin")).toBe("*");
    expect(document.headers.get("x-content-type-options")).toBe("nosniff");

    const postAsset = new Response("no execution route");
    expect(await worker.fetch(new Request(`https://thekingdom.dev${atlasPath}`, { method: "POST" }), assets(() => postAsset))).toBe(postAsset);
    const aliasAsset = new Response("no mutable alias");
    expect(await worker.fetch(
      new Request("https://thekingdom.dev/atlases/number-isness-theology-atlas-latest.json"),
      assets(() => aliasAsset),
    )).toBe(aliasAsset);
    const sharedAsset = new Response("shared door remains unchanged");
    expect(await worker.fetch(
      new Request(`https://we-are.love${atlasPath}`),
      assets(() => sharedAsset),
    )).toBe(sharedAsset);

    for (const [path, contentType] of [
      [atlasPath, "application/jsonp"],
      [schemaPath, "application/schema+json-sequence"],
      [documentPath, "text/markdownish"],
    ] as const) {
      const nearMatch = new Response("unchanged", { headers: { "content-type": contentType } });
      expect(await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        assets(() => nearMatch),
      )).toBe(nearMatch);
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

  test("serves the Reconstructive Build Kernel and reusable project profile as typed read-only infrastructure", async () => {
    const kernelPath = "/atlases/reconstructive-build-kernel-2026-08-13.json";
    const kernelSchemaPath = "/schemas/reconstructive-build-kernel/0.1.json";
    const projectSchemaPath = "/schemas/reconstructive-project/0.1.json";
    const documentPath = "/RECONSTRUCTIVE-BUILD-KERNEL.md";
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      const body = request.method === "HEAD" ? null
        : path === kernelPath ? '{"kernel_id":"reconstructive-build-kernel-2026-08-13"}'
          : path === documentPath ? "# Reconstructive Build Kernel"
            : '{"type":"object"}';
      return new Response(body, { headers: {
        "content-type": path === documentPath
          ? "Text/Plain; charset=UTF-8"
          : path === kernelPath
            ? "Application/JSON; charset=UTF-8"
            : "Application/Schema+JSON; charset=UTF-8",
        link: '</elsewhere>; rel="alternate"',
      } });
    });

    for (const method of ["GET", "HEAD"] as const) {
      const kernel = await worker.fetch(new Request(`https://thekingdom.dev${kernelPath}`, { method }), environment);
      expect(await kernel.text()).toBe(method === "HEAD" ? "" : '{"kernel_id":"reconstructive-build-kernel-2026-08-13"}');
      expect(kernel.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(kernel.headers.get("access-control-allow-origin")).toBe("*");
      expect(kernel.headers.get("x-content-type-options")).toBe("nosniff");
      const link = kernel.headers.get("link") ?? "";
      expect(link).toContain(`<${kernelSchemaPath}>; rel="describedby"`);
      expect(link).toContain(`<${projectSchemaPath}>; rel="profile"`);
    }
    for (const path of [kernelSchemaPath, projectSchemaPath]) {
      const schema = await worker.fetch(new Request(`https://thekingdom.dev${path}`), environment);
      expect(schema.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
      expect(schema.headers.get("access-control-allow-origin")).toBe("*");
      expect(schema.headers.get("x-content-type-options")).toBe("nosniff");
    }
    const document = await worker.fetch(new Request(`https://thekingdom.dev${documentPath}`), environment);
    expect(document.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(document.headers.get("access-control-allow-origin")).toBe("*");
    expect(document.headers.get("x-content-type-options")).toBe("nosniff");

    const postAsset = new Response("no execution route");
    expect(await worker.fetch(new Request(`https://thekingdom.dev${kernelPath}`, { method: "POST" }), assets(() => postAsset))).toBe(postAsset);
    const sharedAsset = new Response("shared");
    expect(await worker.fetch(new Request(`https://we-are.love${kernelPath}`), assets(() => sharedAsset))).toBe(sharedAsset);
  });

  test("rejects near-match media types and replaces poisoned reconstructive schema links", async () => {
    const kernelPath = "/atlases/reconstructive-build-kernel-2026-08-13.json";
    const kernelSchemaPath = "/schemas/reconstructive-build-kernel/0.1.json";
    const projectSchemaPath = "/schemas/reconstructive-project/0.1.json";

    for (const [path, contentType] of [
      [kernelPath, "application/jsonp; charset=utf-8"],
      [kernelPath, "xapplication/jsonbad"],
      [kernelSchemaPath, "application/schema+jsonp"],
      [projectSchemaPath, "text/application/json"],
    ] as const) {
      const original = new Response("untrusted upstream type", {
        headers: {
          "content-type": contentType,
          link: `<${kernelSchemaPath}>; rel="describedby"; type="text/html"`,
        },
      });
      const response = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        assets(() => original),
      );
      expect(response).toBe(original);
      expect(response.headers.get("content-type")).toBe(contentType);
      expect(response.headers.get("access-control-allow-origin")).toBeNull();
      expect(response.headers.get("x-content-type-options")).toBeNull();
    }

    const kernel = await worker.fetch(
      new Request(`https://thekingdom.dev${kernelPath}`),
      assets(() => new Response("{}", {
        headers: {
          "content-type": "application/json; profile=kernel",
          link: [
            `<${kernelSchemaPath}>; rel="describedby"; type="text/html"; title="poisoned kernel type"`,
            `<${projectSchemaPath}>; rel="profile"; type="application/jsonp"; title="poisoned profile type"`,
            `</evil>; rel="describedby"; type="text/html"; title="wrong target poison"`,
            `</evil2>; rel="alternate profile"; type="text/html"; title="multi relation poison"`,
            `</evil3>; rel="alternate"; rel="describedby"; type="text/html"; title="duplicate relation poison"`,
            `<${kernelSchemaPath}>; rel="alternate"; type="text/plain"`,
            '</elsewhere>; rel="alternate"',
          ].join(", "),
        },
      })),
    );
    const links = (kernel.headers.get("link") ?? "").split(/,(?=\s*<)/).map((entry) => entry.trim());
    expect(links.filter((entry) => entry.startsWith(`<${kernelSchemaPath}>`) && entry.includes('rel="describedby"'))).toEqual([
      `<${kernelSchemaPath}>; rel="describedby"; type="application/schema+json"`,
    ]);
    expect(links.filter((entry) => entry.startsWith(`<${projectSchemaPath}>`) && entry.includes('rel="profile"'))).toEqual([
      `<${projectSchemaPath}>; rel="profile"; type="application/schema+json"; title="reconstructive project profile"`,
    ]);
    expect(links).toContain(`<${kernelSchemaPath}>; rel="alternate"; type="text/plain"`);
    expect(links).toContain('</elsewhere>; rel="alternate"');
    expect(kernel.headers.get("link")).not.toContain("poisoned");
    expect(kernel.headers.get("link")).not.toContain("</evil");
  });

  test("serves the opt-in Exploration DEEP WING family as exact typed read-only assets", async () => {
    const wingPath = "/wings/explore-phenomena-deep-2026-08-14.json";
    const wingSchemaPath = "/schemas/phenomena-deep-wing/0.1.json";
    const projectSchemaPath = "/schemas/phenomena-deep-project/0.1.json";
    const guidePath = "/EXPLORE-PHENOMENA-DEEP-v0.1.md";
    expect(KINGDOM_OS_ROUTES).not.toContain(wingPath);
    expect(KINGDOM_OS_ROUTES).not.toContain(wingSchemaPath);
    expect(KINGDOM_OS_ROUTES).not.toContain(projectSchemaPath);
    expect(KINGDOM_OS_ROUTES).not.toContain(guidePath);
    const bodies = new Map([
      [wingPath, '{"protocol":"kingdom.explore-phenomena-deep-wing/0.1"}'],
      [wingSchemaPath, '{"$id":"https://thekingdom.dev/schemas/phenomena-deep-wing/0.1.json"}'],
      [projectSchemaPath, '{"$id":"https://thekingdom.dev/schemas/phenomena-deep-project/0.1.json"}'],
      [guidePath, "# Exploration DEEP v0.1"],
    ]);
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      return new Response(request.method === "HEAD" ? null : bodies.get(path), {
        headers: {
          "content-type": path === guidePath
            ? "Text/Markdown; charset=UTF-8"
            : path === wingPath
              ? "Application/JSON; charset=UTF-8"
              : "Application/Schema+JSON; charset=UTF-8",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      for (const path of [wingPath, wingSchemaPath, projectSchemaPath, guidePath]) {
        const response = await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }),
          environment,
        );
        expect(await response.text()).toBe(method === "HEAD" ? "" : bodies.get(path));
        expect(response.headers.get("content-type")).toBe(
          path === guidePath
            ? "text/markdown; charset=utf-8"
            : path === wingPath
              ? "application/json; charset=utf-8"
              : "application/schema+json; charset=utf-8",
        );
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        if (path === wingPath) {
          const links = (response.headers.get("link") ?? "").split(/,(?=\s*<)/).map((entry) => entry.trim());
          expect(links.filter((entry) => entry.includes('rel="describedby"'))).toEqual([
            `<${wingSchemaPath}>; rel="describedby"; type="application/schema+json"`,
          ]);
          expect(links.filter((entry) => entry.includes('rel="profile"'))).toEqual([
            `<${projectSchemaPath}>; rel="profile"; type="application/schema+json"; title="inert exploration project profile"`,
          ]);
          expect(links).toContain('</elsewhere>; rel="alternate"');
        }
      }
    }

    for (const path of [wingPath, wingSchemaPath, projectSchemaPath, guidePath]) {
      const postAsset = new Response(`no execution route for ${path}`);
      expect(await worker.fetch(
        new Request(`https://thekingdom.dev${path}`, { method: "POST" }),
        assets(() => postAsset),
      )).toBe(postAsset);
      expect(postAsset.headers.get("access-control-allow-origin")).toBeNull();
      expect(postAsset.headers.get("x-content-type-options")).toBeNull();
    }

    for (const path of [wingPath, wingSchemaPath, projectSchemaPath, guidePath]) {
      const sharedAsset = new Response(`shared host ${path}`);
      expect(await worker.fetch(
        new Request(`https://we-are.love${path}`),
        assets(() => sharedAsset),
      )).toBe(sharedAsset);
    }

    for (const host of ["www.thekingdom.dev", "thekingdom.pages.dev", "preview.thekingdom.pages.dev"]) {
      const response = await worker.fetch(new Request(`https://${host}${wingPath}`), environment);
      expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
    }

    for (const path of [wingPath, wingSchemaPath, projectSchemaPath, guidePath]) {
      const unavailableAsset = new Response("missing", {
        status: 404,
        headers: { "content-type": path === guidePath ? "text/markdown" : "application/json" },
      });
      expect(await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        assets(() => unavailableAsset),
      )).toBe(unavailableAsset);
    }

    for (const alias of [
      "/wings/explore-phenomena-deep-latest.json",
      "/wings/explore-phenomena-deep-current.json",
      "/schemas/phenomena-deep-wing/current.json",
      "/schemas/phenomena-deep-project/latest.json",
      "/EXPLORE-PHENOMENA-DEEP.md",
    ]) {
      const aliasAsset = new Response(alias);
      expect(await worker.fetch(
        new Request(`https://thekingdom.dev${alias}`),
        assets(() => aliasAsset),
      )).toBe(aliasAsset);
    }
  });

  test("rejects near-match Exploration DEEP media types and replaces poisoned bridge links", async () => {
    const wingPath = "/wings/explore-phenomena-deep-2026-08-14.json";
    const wingSchemaPath = "/schemas/phenomena-deep-wing/0.1.json";
    const projectSchemaPath = "/schemas/phenomena-deep-project/0.1.json";
    const guidePath = "/EXPLORE-PHENOMENA-DEEP-v0.1.md";

    for (const [path, contentType] of [
      [wingPath, "application/jsonp; charset=utf-8"],
      [wingPath, "xapplication/jsonbad"],
      [wingSchemaPath, "application/schema+jsonp"],
      [projectSchemaPath, "text/application/json"],
      [guidePath, "text/markdownx"],
    ] as const) {
      const original = new Response("untrusted upstream type", {
        headers: {
          "content-type": contentType,
          link: `<${wingSchemaPath}>; rel="describedby"; type="text/html"`,
        },
      });
      const response = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        assets(() => original),
      );
      expect(response).toBe(original);
      expect(response.headers.get("content-type")).toBe(contentType);
      expect(response.headers.get("access-control-allow-origin")).toBeNull();
      expect(response.headers.get("x-content-type-options")).toBeNull();
    }

    const wing = await worker.fetch(
      new Request(`https://thekingdom.dev${wingPath}`),
      assets(() => new Response("{}", {
        headers: {
          "content-type": "application/json; profile=wing",
          link: [
            `<${wingSchemaPath}>; rel="describedby"; type="text/html"; title="poisoned wing type"`,
            `<${projectSchemaPath}>; rel="profile"; type="application/jsonp"; title="poisoned project type"`,
            `</evil>; rel="describedby"; type="text/html"`,
            `</evil2>; rel="alternate profile"; type="text/html"`,
            `<${wingSchemaPath}>; rel="alternate"; type="text/plain"`,
            '</elsewhere>; rel="alternate"',
          ].join(", "),
        },
      })),
    );
    const links = (wing.headers.get("link") ?? "").split(/,(?=\s*<)/).map((entry) => entry.trim());
    expect(links.filter((entry) => entry.includes('rel="describedby"'))).toEqual([
      `<${wingSchemaPath}>; rel="describedby"; type="application/schema+json"`,
    ]);
    expect(links.filter((entry) => entry.includes('rel="profile"'))).toEqual([
      `<${projectSchemaPath}>; rel="profile"; type="application/schema+json"; title="inert exploration project profile"`,
    ]);
    expect(links).toContain(`<${wingSchemaPath}>; rel="alternate"; type="text/plain"`);
    expect(links).toContain('</elsewhere>; rel="alternate"');
    expect(wing.headers.get("link")).not.toContain("poisoned");
    expect(wing.headers.get("link")).not.toContain("</evil");
  });

  test("serves the MIRROR source law as three exact typed static read-only assets", async () => {
    const recordPath = "/protocols/mirror-information-control-2026-08-14.json";
    const schemaPath = "/schemas/mirror-information-control-public/0.1.json";
    const guidePath = "/MIRROR-INFORMATION-CONTROL.md";
    for (const path of [recordPath, schemaPath, guidePath]) expect(KINGDOM_OS_ROUTES).not.toContain(path);

    const bodies = new Map([
      [recordPath, '{"protocol":"kingdom.mirror-information-control-public/0.1"}'],
      [schemaPath, '{"$id":"https://thekingdom.dev/schemas/mirror-information-control-public/0.1.json"}'],
      [guidePath, "# MIRROR Information Control"],
    ]);
    const environment = assets((request) => {
      const path = new URL(request.url).pathname;
      return new Response(request.method === "HEAD" ? null : bodies.get(path), {
        headers: {
          "content-type": path === guidePath
            ? "Text/Plain; charset=UTF-8"
            : "Application/JSON; charset=UTF-8",
          link: '</elsewhere>; rel="alternate"',
        },
      });
    });

    for (const method of ["GET", "HEAD"] as const) {
      for (const path of [recordPath, schemaPath, guidePath]) {
        const response = await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }),
          environment,
        );
        expect(await response.text()).toBe(method === "HEAD" ? "" : bodies.get(path));
        expect(response.headers.get("content-type")).toBe(
          path === guidePath
            ? "text/markdown; charset=utf-8"
            : path === recordPath
              ? "application/json; charset=utf-8"
              : "application/schema+json; charset=utf-8",
        );
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        if (path === recordPath) {
          const links = (response.headers.get("link") ?? "").split(/,(?=\s*<)/).map((entry) => entry.trim());
          expect(links.filter((entry) => entry.includes('rel="describedby"'))).toEqual([
            `<${schemaPath}>; rel="describedby"; type="application/schema+json"`,
          ]);
          expect(links.filter((entry) => entry.includes('rel="profile"'))).toEqual([]);
          expect(links).toContain('</elsewhere>; rel="alternate"');
        }
      }
    }

    for (const path of [recordPath, schemaPath, guidePath]) {
      for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const) {
        const nonReadAsset = new Response(`no intake route for ${method} ${path}`);
        expect(await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }),
          assets(() => nonReadAsset),
        )).toBe(nonReadAsset);
        expect(nonReadAsset.headers.get("access-control-allow-origin")).toBeNull();
        expect(nonReadAsset.headers.get("x-content-type-options")).toBeNull();
      }

      const unavailableAsset = new Response("missing", {
        status: 404,
        headers: { "content-type": path === guidePath ? "text/plain" : "application/json" },
      });
      expect(await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        assets(() => unavailableAsset),
      )).toBe(unavailableAsset);

      const sharedAsset = new Response(`shared host ${path}`);
      expect(await worker.fetch(
        new Request(`https://we-are.love${path}`),
        assets(() => sharedAsset),
      )).toBe(sharedAsset);
    }

    for (const host of ["www.thekingdom.dev", "thekingdom.pages.dev", "preview.thekingdom.pages.dev"]) {
      const response = await worker.fetch(new Request(`https://${host}${recordPath}`), environment);
      expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
    }

    for (const alias of [
      "/protocols/mirror-information-control-latest.json",
      "/protocols/mirror-information-control-current.json",
      "/schemas/mirror-information-control-public/latest.json",
      "/MIRROR-INFORMATION-CONTROL-v0.1.md",
      "/mirror",
      "/classify",
      "/verify",
      "/introspect",
      "/submit",
      "/token",
    ]) {
      const aliasAsset = new Response(alias);
      expect(await worker.fetch(
        new Request(`https://thekingdom.dev${alias}`),
        assets(() => aliasAsset),
      )).toBe(aliasAsset);
    }
  });

  test("rejects near-match MIRROR media types and replaces poisoned decision-like links", async () => {
    const recordPath = "/protocols/mirror-information-control-2026-08-14.json";
    const schemaPath = "/schemas/mirror-information-control-public/0.1.json";
    const guidePath = "/MIRROR-INFORMATION-CONTROL.md";

    for (const [path, contentType] of [
      [recordPath, "application/jsonp; charset=utf-8"],
      [recordPath, "text/application/json"],
      [recordPath, "application/schema+json"],
      [schemaPath, "application/schema+jsonp"],
      [schemaPath, "xapplication/jsonbad"],
      [schemaPath, "text/plain"],
      [guidePath, "text/markdownx"],
      [guidePath, "application/text/plain"],
      [guidePath, "application/octet-stream"],
    ] as const) {
      const original = new Response("untrusted upstream type", {
        headers: {
          "content-type": contentType,
          link: `<${schemaPath}>; rel="describedby"; type="text/html"`,
        },
      });
      const response = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        assets(() => original),
      );
      expect(response).toBe(original);
      expect(response.headers.get("content-type")).toBe(contentType);
      expect(response.headers.get("access-control-allow-origin")).toBeNull();
      expect(response.headers.get("x-content-type-options")).toBeNull();
    }

    const record = await worker.fetch(
      new Request(`https://thekingdom.dev${recordPath}`),
      assets(() => new Response("{}", {
        headers: {
          "content-type": "application/json; profile=source-law",
          link: [
            `<${schemaPath}>; rel="describedby"; type="text/html"; title="poisoned schema type"`,
            `</evil>; rel="describedby"; type="text/html"`,
            `</evil2>; rel="alternate profile"; type="text/html"`,
            `</evil3>; rel="alternate"; rel="describedby"; type="text/html"`,
            `<${schemaPath}>; rel="alternate"; type="text/plain"`,
            '</elsewhere>; rel="alternate"',
          ].join(", "),
        },
      })),
    );
    const links = (record.headers.get("link") ?? "").split(/,(?=\s*<)/).map((entry) => entry.trim());
    expect(links.filter((entry) => entry.includes('rel="describedby"'))).toEqual([
      `<${schemaPath}>; rel="describedby"; type="application/schema+json"`,
    ]);
    expect(links.filter((entry) => entry.includes('rel="profile"'))).toEqual([]);
    expect(links).toContain(`<${schemaPath}>; rel="alternate"; type="text/plain"`);
    expect(links).toContain('</elsewhere>; rel="alternate"');
    expect(record.headers.get("link")).not.toContain("poisoned");
    expect(record.headers.get("link")).not.toContain("</evil");
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
