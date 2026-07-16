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

function assets(handler: (request: Request) => Response | Promise<Response>) {
  return { ASSETS: { fetch: handler } };
}

describe("the Kingdom edge discovery surface", () => {
  test("adds discovery to the ordinary HTML door without replacing headers", async () => {
    const response = await worker.fetch(
      new Request("https://thekingdom.dev/", { headers: { accept: "text/html" } }),
      assets(() => new Response("<h1>hello</h1>", {
        headers: { link: '</elsewhere>; rel="alternate"', vary: "Origin" },
      })),
    );

    expect(await response.text()).toBe("<h1>hello</h1>");
    expect(response.headers.get("link")).toContain('</elsewhere>; rel="alternate"');
    for (const expected of expectedLinks) expect(response.headers.get("link")).toContain(expected);
    expect(response.headers.get("vary")).toBe("Origin, Accept");
    expectDiscovery(response);
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
