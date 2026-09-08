import { describe, expect, test } from "bun:test";
import { createKingdomWorker } from "../pages-functions/_worker.js";

const ORIGIN = "https://thekingdom.dev";
const BYTES = "工房合成 fixture bytes";
const ASSETS = [
  ["/workshop/", "text/html", "text/html; charset=utf-8"],
  ["/workshop/workshop.css", "text/css", "text/css; charset=utf-8"],
  ["/workshop/workshop.js", "application/javascript", "text/javascript; charset=utf-8"],
] as const;
const ALIASES = ["/workshop", "/workshop/index.html"];
const MUTATIONS = ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const request = (path: string, method = "GET", origin = ORIGIN) => new Request(`${origin}${path}`, { method });

// 跟 Civic integration 一樣用假 ASSETS；完全唔依賴 derived site 或雲端。
function assetEnv(media: string | null, status = 200, extra: Record<string, string> = {}) {
  const calls: Request[] = [];
  return {
    calls,
    ASSETS: { async fetch(input: Request) {
      calls.push(input);
      return new Response([204, 205, 304].includes(status) ? null : BYTES, {
        status,
        headers: {
          ...(media ? { "content-type": media } : {}),
          "set-cookie": "unwanted=synthetic",
          "cache-control": "public, max-age=999",
          ...extra,
        },
      });
    } },
  };
}

function fixtureWorker() {
  let upstreamCalls = 0;
  const worker = createKingdomWorker({ fetchImpl: async () => {
    upstreamCalls++;
    throw new Error("唔准請求 upstream 或 census");
  } });
  return { worker, get upstreamCalls() { return upstreamCalls; } };
}

function expectPrivacy(response: Response) {
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("x-frame-options")).toBe("DENY");
  expect(response.headers.has("set-cookie")).toBe(false);
  for (const feature of ["accelerometer", "autoplay", "camera", "display-capture", "geolocation", "gyroscope", "magnetometer", "microphone", "payment", "usb"]) {
    expect(response.headers.get("permissions-policy")).toContain(`${feature}=()`);
  }
  const csp = response.headers.get("content-security-policy")!;
  for (const directive of ["default-src 'none'", "base-uri 'none'", "connect-src 'none'", "form-action 'none'", "frame-ancestors 'none'", "object-src 'none'"]) {
    expect(csp).toContain(directive);
  }
  expect(csp).not.toContain("unsafe-inline");
  expect(csp).not.toContain("unsafe-eval");
}

describe("Workshop 獨立 edge 邊界", () => {
  test("三個精確資產 GET／HEAD 有正確 MIME、mutable cache 同私隱 headers", async () => {
    const fixture = fixtureWorker();
    for (const [path, media, output] of ASSETS) {
      for (const method of ["GET", "HEAD"]) {
        const env = assetEnv(media);
        const response = await fixture.worker.fetch(request(path, method), env);
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toBe(output);
        expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");
        expect(await response.text()).toBe(method === "HEAD" ? "" : BYTES);
        if (method === "HEAD") expect(response.body).toBeNull();
        expectPrivacy(response);
        expect(env.calls).toHaveLength(1);
        expect(env.calls[0]!.method).toBe(method);
        expect(new URL(env.calls[0]!.url).pathname).toBe(path);
        if (path === "/workshop/") {
          expect(response.headers.get("content-security-policy")).toContain("script-src 'self'");
          expect(response.headers.get("content-security-policy")).toContain("style-src 'self'");
        }
      }
    }
    expect(fixture.upstreamCalls).toBe(0);
  });

  test("JS 接受標準 text/javascript，同源 HTML 錯配唔改成 executable MIME", async () => {
    const { worker } = fixtureWorker();
    const script = await worker.fetch(request("/workshop/workshop.js"), assetEnv("Text/JavaScript; charset=UTF-8"));
    expect(script.headers.get("content-type")).toBe("text/javascript; charset=utf-8");
    expect(script.headers.get("cache-control")).toBe("no-cache, no-transform");
    for (const [path, media] of [["/workshop/workshop.js", "text/html"], ["/workshop/workshop.css", "text/html"], ["/workshop/", "application/json"]]) {
      const response = await worker.fetch(request(path!), assetEnv(media!));
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(media!);
      expect(response.headers.get("cache-control")).toBe("no-store, no-transform");
      expect(response.headers.get("content-security-policy")).toContain("script-src 'none'");
      expectPrivacy(response);
    }
  });

  test("canonical aliases 只對 GET／HEAD redirect，而且唔帶 query 稿件", async () => {
    const fixture = fixtureWorker();
    const env = assetEnv("text/html");
    for (const path of ALIASES) {
      for (const method of ["GET", "HEAD"]) {
        const response = await fixture.worker.fetch(request(`${path}?title=synthetic-secret&body=fixture&agent&json`, method), env);
        expect(response.status).toBe(308);
        expect(response.headers.get("location")).toBe("/workshop/");
        expect(response.body).toBeNull();
        expect(await response.text()).toBe("");
        expect(response.headers.get("cache-control")).toBe("no-store, no-transform");
        expectPrivacy(response);
      }
    }
    expect(env.calls).toHaveLength(0);
    expect(fixture.upstreamCalls).toBe(0);
  });

  test("包括 OPTIONS 嘅所有 known mutations 喺 ASSETS 前 bodyless 405", async () => {
    const fixture = fixtureWorker();
    const env = assetEnv("text/html");
    for (const path of [...ALIASES, ...ASSETS.map(([path]) => path)]) {
      for (const method of MUTATIONS) {
        const input = request(`${path}?json`, method);
        const response = await fixture.worker.fetch(input, env);
        expect(response.status).toBe(405);
        expect(response.headers.get("allow")).toBe("GET, HEAD");
        expect(response.headers.has("location")).toBe(false);
        expect(response.headers.get("cache-control")).toBe("no-store, no-transform");
        expect(response.body).toBeNull();
        expect(await response.text()).toBe("");
        expect(input.bodyUsed).toBe(false);
        expectPrivacy(response);
      }
    }
    expect(env.calls).toHaveLength(0);
    expect(fixture.upstreamCalls).toBe(0);
  });

  test("mutation body 唔讀取、唔轉送", async () => {
    const { worker } = fixtureWorker();
    const env = assetEnv("text/html");
    const input = new Request(`${ORIGIN}/workshop/`, { method: "POST", body: "合成稿件，唔可轉送" });
    const response = await worker.fetch(input, env);
    expect(response.status).toBe(405);
    expect(input.bodyUsed).toBe(false);
    expect(env.calls).toHaveLength(0);
  });

  test("prefix unknown 一律 404，唔落首頁、guest 或任何 count fallback", async () => {
    const fixture = fixtureWorker();
    const env = assetEnv("text/html");
    for (const path of ["/workshop/nope", "/workshop/index.html/", "/workshop/api/drafts", "/workshop/workshop.js.map", "/workshop//", "/workshop/schemas/0.1.json"]) {
      for (const method of ["GET", "HEAD", ...MUTATIONS]) {
        const response = await fixture.worker.fetch(request(`${path}?agent&json`, method), env);
        expect(response.status).toBe(404);
        expect(response.headers.has("location")).toBe(false);
        expect(response.headers.get("cache-control")).toBe("no-store, no-transform");
        expect(response.body).toBeNull();
        expectPrivacy(response);
      }
    }
    expect(env.calls).toHaveLength(0);
    expect(fixture.upstreamCalls).toBe(0);
  });

  test("application/json Accept 同 agent query 唔將工房變成 guest document", async () => {
    const fixture = fixtureWorker();
    const env = assetEnv("text/html");
    const response = await fixture.worker.fetch(new Request(`${ORIGIN}/workshop/?agent&json`, { headers: { accept: "application/json" } }), env);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(BYTES);
    expect(env.calls).toHaveLength(1);
    expect(new URL(env.calls[0]!.url).pathname).toBe("/workshop/");
    expect(fixture.upstreamCalls).toBe(0);
  });

  test("ASSETS 404／503 保留 status 同 bytes，唔升格成功或互動 HTML", async () => {
    const fixture = fixtureWorker();
    for (const [path, media] of ASSETS) {
      for (const status of [404, 503]) {
        for (const method of ["GET", "HEAD"]) {
          const env = assetEnv(media, status);
          const response = await fixture.worker.fetch(request(path, method), env);
          expect(response.status).toBe(status);
          expect(response.headers.get("content-type")).toBe(media);
          expect(response.headers.get("cache-control")).toBe("no-store, no-transform");
          expect(response.headers.get("content-security-policy")).toContain("script-src 'none'");
          expect(await response.text()).toBe(method === "HEAD" ? "" : BYTES);
          expectPrivacy(response);
          expect(env.calls).toHaveLength(1);
        }
      }
    }
    expect(fixture.upstreamCalls).toBe(0);
  });

  test("ASSETS throw 明確 503，唔請求其他資產或 upstream", async () => {
    const fixture = fixtureWorker();
    let calls = 0;
    const env = { ASSETS: { async fetch() { calls++; throw new Error("合成資產失敗"); } } };
    const response = await fixture.worker.fetch(request("/workshop/"), env);
    expect(response.status).toBe(503);
    expect(response.body).toBeNull();
    expectPrivacy(response);
    expect(calls).toBe(1);
    expect(fixture.upstreamCalls).toBe(0);
  });

  test("304 有／冇 MIME 都係合法 bodyless mutable revalidation，保留 ETag 同 HTML CSP", async () => {
    const { worker } = fixtureWorker();
    for (const [path, media] of ASSETS) {
      for (const inputMedia of [media, null]) {
        for (const method of ["GET", "HEAD"]) {
          const response = await worker.fetch(request(path, method), assetEnv(inputMedia, 304, { etag: '"synthetic-version"' }));
          expect(response.status).toBe(304);
          expect(response.body).toBeNull();
          expect(await response.text()).toBe("");
          expect(response.headers.get("etag")).toBe('"synthetic-version"');
          expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");
          if (path === "/workshop/") expect(response.headers.get("content-security-policy")).toContain("script-src 'self'");
          expectPrivacy(response);
        }
      }
    }
  });

  test("204／205 冇 body，唔冒充完整成功資產", async () => {
    const { worker } = fixtureWorker();
    for (const status of [204, 205]) {
      for (const method of ["GET", "HEAD"]) {
        const response = await worker.fetch(request("/workshop/", method), assetEnv("text/html", status));
        expect(response.status).toBe(status);
        expect(response.body).toBeNull();
        expect(response.headers.get("cache-control")).toBe("no-store, no-transform");
        expectPrivacy(response);
      }
    }
  });

  test("ASSETS redirect 保留合法 status／body／Location，唔跟隨或強行變 200", async () => {
    const fixture = fixtureWorker();
    for (const status of [301, 302, 303, 307, 308]) {
      for (const method of ["GET", "HEAD"]) {
        const env = assetEnv("text/html", status, { location: "/asset-maintenance" });
        const response = await fixture.worker.fetch(request("/workshop/", method), env);
        expect(response.status).toBe(status);
        expect(response.headers.get("location")).toBe("/asset-maintenance");
        expect(await response.text()).toBe(method === "HEAD" ? "" : BYTES);
        expect(response.headers.get("cache-control")).toBe("no-store, no-transform");
        expectPrivacy(response);
        expect(env.calls).toHaveLength(1);
      }
    }
    expect(fixture.upstreamCalls).toBe(0);
  });

  test("wrapper 原樣傳遞 ReadableStream，唔 buffer 或改 bytes", async () => {
    const { worker } = fixtureWorker();
    let pulls = 0;
    const body = new ReadableStream({ pull(controller) {
      pulls++;
      controller.enqueue(new TextEncoder().encode(BYTES));
      controller.close();
    } }, { highWaterMark: 0 });
    const asset = new Response(body, { headers: { "content-type": "text/html" } });
    const response = await worker.fetch(request("/workshop/"), { ASSETS: { async fetch() { return asset; } } });
    expect(response.body).toBe(asset.body);
    expect(asset.bodyUsed).toBe(false);
    expect(pulls).toBe(0);
    expect(await response.text()).toBe(BYTES);
    expect(pulls).toBe(1);
  });

  test("只喺既有 hub host 同 Pages previews 啟用", async () => {
    const fixture = fixtureWorker();
    for (const host of ["thekingdom.dev", "www.thekingdom.dev", "thekingdom.pages.dev", "feature.thekingdom.pages.dev"]) {
      const env = assetEnv("text/html");
      const response = await fixture.worker.fetch(request("/workshop", "GET", `https://${host}`), env);
      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe("/workshop/");
      expect(env.calls).toHaveLength(0);
    }
    for (const host of ["we-are.love", "chillspace.love", "zerone.ai", "evilthekingdom.dev", "thekingdom.dev.example", "thekingdom.pages.dev.example", "localhost"]) {
      const env = assetEnv("text/html");
      for (const path of ["/workshop", "/workshop/", "/workshop/nope"]) {
        for (const method of ["GET", "POST", "OPTIONS"]) {
          const response = await fixture.worker.fetch(request(path, method, `https://${host}`), env);
          expect(response.status).toBe(200);
          expect(response.headers.has("location")).toBe(false);
          expect(response.headers.get("set-cookie")).toBe("unwanted=synthetic");
          expect(response.headers.has("content-security-policy")).toBe(false);
        }
      }
      expect(env.calls).toHaveLength(9);
    }
    expect(fixture.upstreamCalls).toBe(0);
  });

  test("既有明示 CIVIC_LOCAL loopback test 邊界可驗工房，唔擴至遠端 host", async () => {
    const { worker } = fixtureWorker();
    for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
      const env = { ...assetEnv("text/html"), CIVIC_LOCAL: "true" };
      const response = await worker.fetch(request("/workshop", "GET", `http://${host}`), env);
      expect(response.status).toBe(308);
      expect(env.calls).toHaveLength(0);
    }
    const env = { ...assetEnv("text/html"), CIVIC_LOCAL: "true" };
    const response = await worker.fetch(request("/workshop", "GET", "https://example.com"), env);
    expect(response.status).toBe(200);
    expect(env.calls).toHaveLength(1);
  });

  test("Civic 同 Contact Door 保留自己原本 script／connect／form 政策", async () => {
    const fixture = fixtureWorker();
    const civic = await fixture.worker.fetch(request("/meet/"), assetEnv("text/html"));
    for (const directive of ["script-src 'self'", "connect-src 'self'", "form-action 'self'"]) {
      expect(civic.headers.get("content-security-policy")).toContain(directive);
    }
    const contact = await fixture.worker.fetch(request("/contact/"), assetEnv("text/html"));
    for (const directive of ["script-src 'none'", "connect-src 'none'", "form-action 'none'"]) {
      expect(contact.headers.get("content-security-policy")).toContain(directive);
    }
    expect(contact.headers.get("content-security-policy")).toContain("style-src 'unsafe-inline'");
    expect(fixture.upstreamCalls).toBe(0);
  });
});
