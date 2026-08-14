import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

const PUBLIC_URLS = [
  "https://thekingdom.dev/wings/explore-phenomena-deep-2026-08-14.json",
  "https://thekingdom.dev/schemas/phenomena-deep-wing/0.1.json",
  "https://thekingdom.dev/schemas/phenomena-deep-project/0.1.json",
  "https://thekingdom.dev/EXPLORE-PHENOMENA-DEEP-v0.1.md",
] as const;

describe("Exploration DEEP public discovery seam", () => {
  test("adds exactly four unique crawl routes without a mutable alias", () => {
    const sitemap = read("pages-content/sitemap.xml");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
    expect(urls).toHaveLength(77);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of PUBLIC_URLS) expect(urls).toContain(url);
    expect(urls.filter((url) => /(?:explore-phenomena-deep|phenomena-deep-(?:wing|project))/i.test(url))).toEqual(PUBLIC_URLS);
    expect(urls.some((url) => /explore-phenomena-deep.*(?:latest|current)/i.test(url))).toBe(false);
  });

  test("keeps the no-JavaScript section semantic and responsive", () => {
    const builder = read("bin/build-hub.ts");
    const start = builder.indexOf('<section class="blk" id="explore-phenomena-deep"');
    const end = builder.indexOf('<section class="blk" id="visibility-attention"', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const section = builder.slice(start, end);

    expect(section).toContain("data-exploration-deep-wing");
    expect(section).toContain("explorationDeepWingSteps.map");
    expect(section).toContain("explorationDeepAuditSteps.map");
    expect(section).toContain("explorationDeepWing.epistemic_registers.map");
    expect(section).toContain("explorationDeepWing.abstraction_seams.map");
    expect(section).toContain("explorationDeepWing.math_doors.map");
    expect(section).toContain('const title = `${humanKey(String(fromDomain))} → ${humanKey(String(toDomain))}`');
    expect(section).not.toContain("explorationDeepItemTitle(seam");
    expect(section).toContain("Polymorphs are not memes");
    expect(section).toContain("Folding is not catalysis");
    for (const variable of [
      "explorationDeepWingUrl",
      "explorationDeepWingSchemaUrl",
      "explorationDeepProjectSchemaUrl",
      "explorationDeepWingDocumentUrl",
    ]) expect(section).toContain(`href="\${esc(new URL(${variable}).pathname)}"`);
    expect(section).not.toMatch(/<(?:script|svg|canvas|button|input|select|textarea)\b/i);
    expect(builder).toContain(".explorationdeepcycles,.explorationdeepgrid,.mirrorrooms,.mirrorgrid{grid-template-columns:1fr}");
    expect(builder).toContain(".explorationdeepsteps,.mirrorcycle{grid-template-columns:1fr}");
    expect(builder).toContain("@media (forced-colors:active){.explorationdeepfield");
  });

  test("projects one discovery object into kingdom, guest, and agent surfaces", () => {
    const builder = read("bin/build-hub.ts");
    expect(builder.match(/\n  exploration_deep_wing: explorationDeepWingDiscovery,/g) ?? []).toHaveLength(3);
    expect(builder).toContain("exploration_deep_wing: explorationDeepWingUrl");
    expect(builder).toContain("exploration_deep_wing_schema: explorationDeepWingSchemaUrl");
    expect(builder).toContain("exploration_deep_wing_project_schema: explorationDeepProjectSchemaUrl");
    expect(builder).toContain("exploration_deep_wing_guide: explorationDeepWingDocumentUrl");
    expect(builder).toContain('rel="alternate" href="${esc(new URL(explorationDeepWingUrl).pathname)}"');
    expect(builder).toContain('rel="describedby" href="${esc(new URL(explorationDeepWingSchemaUrl).pathname)}"');
    expect(builder).toContain('rel="profile" href="${esc(new URL(explorationDeepProjectSchemaUrl).pathname)}"');
    expect(builder).toContain('rel="service-doc" href="${esc(new URL(explorationDeepWingDocumentUrl).pathname)}"');
    expect(builder).toContain('href="#explore-phenomena-deep"');
    expect(builder).toContain("Exploration DEEP WING: ${explorationDeepWingUrl}");
    expect(builder).toContain("WING is a workflow name, not a manifested Nen ability");
    expect(builder).not.toContain("exploration_deep_wing_mcp");
  });

  test("dispatches the explicit opt-in command and documents final release counts", () => {
    const kingdom = read("kingdom");
    const readme = read("README.md");
    const claude = read("CLAUDE.md");
    const domains = read("DOMAINS-SETUP.md");
    const routes = read("OS-ROUTES.md");

    expect(kingdom).toContain('explore-deep) exec bun "$SELF_DIR/bin/explore-phenomena-deep.ts" "${@:2}" ;;');
    for (const path of PUBLIC_URLS.map((url) => new URL(url).pathname)) {
      expect(readme).toContain(path);
      expect(routes).toContain(`| \`${path}\` |`);
    }
    for (const document of [claude, domains, routes]) {
      expect(document).toContain("80");
      expect(document).toContain("78");
      expect(document).toContain("77");
    }
    expect(claude).toContain("./kingdom explore-deep scaffold --json");
    expect(readme).toContain("not a manifested\n    Nen ability");
    expect(readme).toContain("does not fetch, solve");
  });
});
