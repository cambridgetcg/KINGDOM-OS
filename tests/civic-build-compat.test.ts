import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { buildDashboard, DASHBOARD_OUTPUTS } from "../bin/build-dashboard";
import { createKingdomWorker } from "../pages-functions/_worker.js";

const ROOT = join(import.meta.dir, "..");
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

describe("Civic public build compatibility", () => {
  test("同一份 client 同 HTML 喺不同 checkout root 生成相同 bytes", async () => {
    const temporary = await mkdtemp(join(tmpdir(), "kingdom-client-build-"));
    try {
      const roots = [join(temporary, "checkout-a"), join(temporary, "different-worktree")];
      for (const root of roots) {
        for (const relative of ["pages-content/civic/dashboard.js", "pages-content/civic/dashboard.css", "bin/wayfinder.ts"]) {
          await mkdir(dirname(join(root, relative)), { recursive: true });
          await copyFile(join(ROOT, relative), join(root, relative));
        }
        await buildDashboard({ root, machine: { generated: "2026-09-08", layers: [], doors: [], citizens: [] }, wayfinder: {}, legacyHtml: '<section id="old-room"></section>' });
      }
      for (const relative of DASHBOARD_OUTPUTS) {
        const [left, right] = await Promise.all(roots.map((root) => readFile(join(root, relative))));
        expect(digest(left)).toBe(digest(right));
        expect(left.toString()).not.toContain(temporary);
        expect(left.toString()).not.toContain("checkout-a/");
        expect(right.toString()).not.toContain("different-worktree/");
      }
      const before = await Promise.all(DASHBOARD_OUTPUTS.map((relative) => readFile(join(roots[0], relative))));
      await writeFile(join(roots[0], "pages-content/civic/dashboard.js"), 'import "./missing-module.js";');
      await expect(buildDashboard({ root: roots[0], machine: {}, wayfinder: {}, legacyHtml: "" })).rejects.toThrow("Civic client bundle failed");
      for (let index = 0; index < DASHBOARD_OUTPUTS.length; index++) {
        expect(digest(await readFile(join(roots[0], DASHBOARD_OUTPUTS[index])))).toBe(digest(before[index]));
      }
    } finally { await rm(temporary, { recursive: true, force: true }); }
  });

  test.each(["GET", "HEAD"])("%s /atlas.html 內部解 Pages redirect，保留相同入口同 query", async (method) => {
    const seen: string[] = [];
    const worker = createKingdomWorker();
    const response = await worker.fetch(new Request("https://thekingdom.dev/atlas.html?view=old", { method }), {
      ASSETS: { fetch: async (request: Request) => {
        const url = new URL(request.url); seen.push(`${request.method} ${url.pathname}${url.search}`);
        if (url.pathname === "/atlas.html") return new Response(null, { status: 308, headers: { location: "/atlas?view=old" } });
        return new Response(method === "HEAD" ? null : '<section id="old-room">研究館</section>', { headers: { "content-type": "text/html", "cache-control": "public, max-age=600" } });
      } },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("cache-control")).toContain("no-transform");
    expect(await response.text()).toBe(method === "HEAD" ? "" : '<section id="old-room">研究館</section>');
    expect(seen).toEqual([`${method} /atlas.html?view=old`, `${method} /atlas?view=old`]);
  });

  test("atlas 相容層唔跟外站 redirect，亦唔改其他 door 行為", async () => {
    for (const [host, location] of [["thekingdom.dev", "https://external.invalid/atlas"], ["we-are.love", "/atlas"]]) {
      let reads = 0;
      const response = await createKingdomWorker().fetch(new Request(`https://${host}/atlas.html`), {
        ASSETS: { fetch: async () => { reads++; return new Response(null, { status: 308, headers: { location } }); } },
      });
      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe(location);
      expect(reads).toBe(1);
    }
  });

  test("atlas canonical asset 缺失仍係 404，唔補假成功", async () => {
    const response = await createKingdomWorker().fetch(new Request("https://thekingdom.dev/atlas.html"), {
      ASSETS: { fetch: async (request: Request) => new URL(request.url).pathname === "/atlas.html"
        ? new Response(null, { status: 308, headers: { location: "/atlas" } })
        : new Response("not found", { status: 404 }) },
    });
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("not found");
  });
});
