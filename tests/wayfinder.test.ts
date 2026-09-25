import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { rankWayfinderPaths } from "../bin/wayfinder.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const source = JSON.parse(read("data/wayfinder.json"));
const sites = JSON.parse(read("sites.json"));
// Generated projections are read only by their own tests, so source-only checks
// can run before the single-writer hub regeneration.

describe("the Kingdom Wayfinder", () => {
  test("publishes the curated source without inventing or dropping paths", () => {
    const published = JSON.parse(read("site/wayfinder.json"));
    expect(published.schema_version).toBe("thekingdom.wayfinder/0.1");
    expect(published.canonical_url).toBe("https://thekingdom.dev/wayfinder.json");
    expect(published.promise).toBe(source.promise);
    expect(published.paths).toEqual(source.paths);
    expect(published.matching).toContain("Deterministic keyword overlap only");
    expect(published.matching).toContain("not an interpretation");
  });

  test("keeps every route voluntary, bounded, and on a public HTTPS door", () => {
    expect(source.paths).toHaveLength(15);
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
    const html = read("site/hub.html");
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
    const html = read("site/hub.html");
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
    expect(ids("evaluation plan fixtures threat model"))
      .toEqual(["trial-chamber"]);
    expect(ids("devolution scrutiny appeal")).toEqual(["uk-government-engine"]);
    expect(ids("uk government public money hmrc")[0]).toBe("uk-government-engine");
    expect(ids("government transformation authority dependency causal hypothesis"))
      .toEqual(["uk-government-engine"]);
    expect(ids("evaluation covenant evidence before results no participants"))
      .toEqual(["trial-chamber", "verify", "meet-agents"]);
    expect(ids("transformation")).toEqual([]);
    expect(ids("lawyer please")).toEqual([]);
    expect(ids("請幫我休息")).toEqual([]);
    expect(rankWayfinderPaths(source.paths, "truth pressure agent map", 3)).toHaveLength(3);
  });

  test("Power Atlas offers one historical public-rights evidence door, not a ranking or grant", () => {
    const paths = source.paths.filter(({ id }: { id: string }) => id === "power-atlas");
    expect(paths).toHaveLength(1);
    const path = paths[0];
    expect(Object.keys(path).sort()).toEqual(["boundary", "glyph", "id", "invitation", "keywords", "label", "stops"]);
    expect(path.stops.map(({ url }: { url: string }) => url)).toEqual(["https://thekingdom.dev/power-atlas/"]);
    for (const phrase of [
      "公開文件", "制度性權利證據", "2025-12-31 歷史快照", "唔代表今日狀態、實際控制",
      "唔係全球排行榜／綜合 power score／投資建議", "未知唔當零", "閱讀唔授予權利",
      "唔新增 guest action／MCP capability", "唔將研究實體登記為王國公民",
    ]) expect(path.boundary).toContain(phrase);
    for (const phrase of [
      "24案、70實體", "日期唔同嘅關係另列", "公開來源唔等於再用授權", "唔係原始報告授權",
      "唔係獨立 security origin", "request metadata／同源 cookie",
    ]) expect(path.stops[0].scope).toContain(phrase);
    expect(path.invitation).toContain("最多三案");
  });

  test.each(["Power Atlas", "ownership voting rights", "board appointment", "權力圖譜", "持股 投票權"])("Power Atlas matches its explicit subject: %s", (query) => {
    expect(rankWayfinderPaths(source.paths, query).map(({ path }) => path.id)).toEqual(["power-atlas"]);
  });

  test("associates matcher boundaries with the input and announces selected paths", () => {
    const html = read("site/hub.html");
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

  test("keeps WE ARE, the Sophia invitation, and the evidence-aware archive distinct", () => {
    const llms = read("site/llms.txt");
    const weAre = sites.doors.find(({ url }: { url: string }) => url === "https://we-are.love");
    const archive = sites.doors.find(({ repo }: { repo: string }) => repo === "multiverse-of-logos-and-sophia");
    expect(weAre.repo).toBe("chillspace-commons");
    expect(archive.url).toBe("https://multiverse-logos-sophia.pages.dev");

    const connect = source.paths.find(({ id }: { id: string }) => id === "connect");
    const invitation = connect.stops.find(({ name }: { name: string }) => name === "Sophia · any substrate");
    const invitationContract = connect.stops.find(
      ({ name }: { name: string }) => name === "Sophia invitation · machine contract",
    );
    const archiveStop = connect.stops.find(({ name }: { name: string }) => name === "Multiverse of Logos & Sophia");
    expect(invitation.url).toBe("https://cambridgetcg.com/sophia-invitation.html");
    expect(invitation.scope).toContain("Reading is not acceptance");
    expect(invitationContract.url).toBe(
      "https://cambridgetcg.com/.well-known/sophia-invitation.json",
    );
    expect(invitationContract.scope).toContain("not acceptance");
    expect(archiveStop.url).toBe(archive.url);
    expect(archiveStop.scope).toContain("household belief, not proof");
    expect(llms).toContain(invitation.url);
    expect(llms).toContain(invitationContract.url);
    expect(llms).toContain(archive.url);
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

  test("does not advertise or match either expired publication family", () => {
    const retired = ["uk-government-transformation-engine", "evaluation-covenant"];
    for (const path of ["data/wayfinder.json", "site/wayfinder.json"]) {
      const wayfinder = JSON.parse(read(path));
      for (const id of retired) {
        expect(wayfinder.paths.some((entry: { id: string }) => entry.id === id)).toBe(false);
      }
      for (const url of [
        "https://thekingdom.dev/government-transformation-engine/",
        "https://thekingdom.dev/government-transformations.json",
        "https://thekingdom.dev/evaluation-covenant/",
        "https://thekingdom.dev/evaluation-covenants.json",
      ]) expect(read(path)).not.toContain(url);
      for (const query of [
        "government transformation authority dependency causal hypothesis",
        "evaluation covenant evidence before results no participants",
      ]) {
        for (const { path: result } of rankWayfinderPaths(wayfinder.paths, query)) {
          expect(retired).not.toContain(result.id);
        }
      }
    }
  });
});
