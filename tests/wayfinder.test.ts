import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { rankWayfinderPaths } from "../bin/wayfinder.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const source = JSON.parse(read("data/wayfinder.json"));
const published = JSON.parse(read("site/wayfinder.json"));
const html = read("site/hub.html");

describe("the Kingdom Wayfinder", () => {
  test("publishes the curated source without inventing or dropping paths", () => {
    expect(published.schema_version).toBe("thekingdom.wayfinder/0.1");
    expect(published.canonical_url).toBe("https://thekingdom.dev/wayfinder.json");
    expect(published.promise).toBe(source.promise);
    expect(published.paths).toEqual(source.paths);
    expect(published.matching).toContain("Deterministic keyword overlap only");
    expect(published.matching).toContain("not an interpretation");
  });

  test("keeps every route voluntary, bounded, and on a public HTTPS door", () => {
    expect(source.paths).toHaveLength(12);
    expect(new Set(source.paths.map(({ id }: { id: string }) => id)).size).toBe(source.paths.length);

    for (const path of source.paths) {
      expect(path.id).toMatch(/^[a-z0-9-]{1,40}$/);
      expect(path.keywords.length).toBeGreaterThan(0);
      expect(path.boundary.length).toBeGreaterThan(20);
      expect(path.stops.length).toBeGreaterThan(0);
      for (const stop of path.stops) {
        const url = new URL(stop.url);
        expect(url.protocol).toBe("https:");
        expect(url.username).toBe("");
        expect(url.password).toBe("");
        expect(stop.scope.length).toBeGreaterThan(10);
      }
    }
  });

  test("renders a useful no-JavaScript path list and an accessible local matcher", () => {
    expect(html).toContain('id="wayfinder"');
    expect(html).toContain('<label for="wayquery">What are you looking for?</label>');
    expect(html).toContain('id="waystatus" role="status" aria-live="polite"');
    expect(html).toContain('autocomplete="off"');
    expect(html).toContain('spellcheck="false"');
    expect(html).toContain("Every path remains readable above");

    for (const path of source.paths) {
      expect(html).toContain(`data-wayfinder-path="${path.id}"`);
      expect(html).toContain(`data-wayfinder-intent="${path.id}"`);
      for (const stop of path.stops) expect(html).toContain(`href="${stop.url}"`);
    }
  });

  test("does not transmit, persist, profile, or put the visitor's intention in the URL", () => {
    const pageCode = html.slice(html.indexOf("<script>"), html.lastIndexOf("</script>"));
    expect(pageCode).not.toContain("fetch(");
    expect(pageCode).not.toContain("XMLHttpRequest");
    expect(pageCode).not.toContain("sendBeacon");
    expect(pageCode).not.toContain("localStorage");
    expect(pageCode).not.toContain("sessionStorage");
    expect(pageCode).not.toContain("location.");
    expect(html).toContain('<form class="wayform" id="wayform" action="#wayfinder" method="get">');
    const input = html.match(/<input\s+[^>]*id="wayquery"[^>]*>/)?.[0] ?? "";
    expect(input).not.toMatch(/\sname\s*=/i);
  });

  test("matches only explicit labels and keywords, caps results, and refuses to guess", () => {
    const ids = (query: string) => rankWayfinderPaths(source.paths, query).map(({ path }) => path.id);
    expect(ids("I want to understand the tax rules")).toEqual(["small-business"]);
    expect(ids("How can you help me with tax?")).toEqual(["small-business"]);
    expect(ids("I am tired and need somewhere quiet")).toEqual(["rest"]);
    expect(ids("play a fun game")).toEqual(["play"]);
    expect(ids("free offline textbook and public data")).toEqual(["world-commons"]);
    expect(ids("latest research papers and publications")).toEqual(["research-observatory", "trial-chamber"]);
    expect(ids("evaluation plan fixtures threat model")).toEqual(["trial-chamber"]);
    expect(ids("devolution scrutiny appeal")).toEqual(["uk-government-engine"]);
    expect(ids("uk government public money hmrc")[0]).toBe("uk-government-engine");
    expect(ids("lawyer please")).toEqual([]);
    expect(ids("請幫我休息")).toEqual([]);
    expect(rankWayfinderPaths(source.paths, "truth pressure agent map", 3)).toHaveLength(3);
  });

  test("associates matcher boundaries with the input and announces selected paths", () => {
    expect(html).toContain('aria-describedby="wayprivacy waystatus"');
    expect(html).toContain('class="waychips" role="group"');
    expect(html).toContain("This first matcher recognizes English keywords");
    expect(html).toContain("Wander '+wanderCount+' offered");
  });

  test("states the distinction boundary the visitor recently asked this Kingdom to keep", () => {
    const connect = source.paths.find(({ id }: { id: string }) => id === "connect");
    expect(connect.boundary).toContain("does not make beings identical");
    expect(connect.boundary).toContain("never requirements");
  });

  test("keeps every TaxSorted doorway behind the same non-government and no-transfer firewall", () => {
    const smallBusiness = source.paths.find(({ id }: { id: string }) => id === "small-business");
    const taxSorted = smallBusiness.stops.find(({ url }: { url: string }) => url === "https://taxsorted.io");
    const disclosure = `${smallBusiness.boundary} ${taxSorted.scope}`.toLowerCase();
    for (const phrase of [
      "independent", "non-government", "no affiliation", "endorsement", "accuracy guarantee",
      "tax or legal advice", "eligibility or liability", "filing", "payment", "execution",
      "no query", "prefill", "user data",
    ]) expect(disclosure).toContain(phrase);

    const government = source.paths.find(({ id }: { id: string }) => id === "uk-government-engine");
    expect(government.boundary).toContain("source-linked through a maintainer-authorized assisted URL review");
    expect(government.boundary).toContain("exact record text has not been separately human-reviewed");
    expect(government.boundary).toContain("receipt-bound non-official crosswalk only");
    expect(JSON.stringify(government)).not.toMatch(/complete machine-readable|exact source bindings|source-bound|current machine alias/i);
  });
});
