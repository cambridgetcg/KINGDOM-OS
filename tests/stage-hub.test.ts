import { describe, expect, test } from "bun:test";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS, stageHub } from "../bin/stage-hub.ts";
import {
  HUB_STAGING_CONTRACT_PATH,
  IMMUTABLE_PUBLICATIONS_LEDGER_PATH,
  parseImmutablePublicationLedger,
} from "../bin/immutable-publications.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function temporaryDirectory(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function makeCompleteSource(root: string): void {
  const stagingContractDestination = join(root, HUB_STAGING_CONTRACT_PATH);
  mkdirSync(dirname(stagingContractDestination), { recursive: true });
  copyFileSync(join(ROOT, HUB_STAGING_CONTRACT_PATH), stagingContractDestination);
  const ledgerSource = join(ROOT, IMMUTABLE_PUBLICATIONS_LEDGER_PATH);
  const ledgerDestination = join(root, IMMUTABLE_PUBLICATIONS_LEDGER_PATH);
  mkdirSync(dirname(ledgerDestination), { recursive: true });
  copyFileSync(ledgerSource, ledgerDestination);
  const parsed = parseImmutablePublicationLedger(readFileSync(ledgerSource));
  if (!parsed.ledger) throw new Error("test fixture ledger is invalid");
  const immutableSources = new Set(parsed.ledger.entries.map((entry) => entry.source));
  for (const path of ["data/power-atlas/artifact.v1.json", "pages-functions/power-atlas-assets.json"]) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    copyFileSync(join(ROOT, path), join(root, path));
  }
  for (const [index, asset] of HUB_ASSETS.entries()) {
    const source = join(root, asset.source);
    mkdirSync(dirname(source), { recursive: true });
    if (immutableSources.has(asset.source) || asset.source.startsWith("pages-content/power-atlas/")) copyFileSync(join(ROOT, asset.source), source);
    else writeFileSync(source, Buffer.from([index, 0, 255, 10]));
  }
}

describe("the hub staging contract", () => {
  test("copies exactly the declared assets into an empty directory and never overwrites", () => {
    const base = temporaryDirectory("kingdom-stage-hub-");
    try {
      const sourceRoot = join(base, "source");
      const output = join(base, "output");
      mkdirSync(output);
      makeCompleteSource(sourceRoot);
      // A private portfolio or stray site file is never inferred into the public upload.
      mkdirSync(join(sourceRoot, "operations/cloudflare/private"), { recursive: true });
      writeFileSync(join(sourceRoot, "operations/cloudflare/private/portfolio.json"), "PRIVATE_PORTFOLIO_CANARY");
      writeFileSync(join(sourceRoot, "site/private-portfolio.json"), "PRIVATE_PORTFOLIO_CANARY");

      const staged = stageHub(output, sourceRoot);
      // Exact count 刻意鎖住；staging 合約增減要逐項核對，唔接受任意數量。
      expect(HUB_ASSETS).toHaveLength(248);
      expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(94);
      // Global counts live here; individual publication tests pin their own family.
      expect(new Set(HUB_ASSETS.map(({ source }) => source)).size).toBe(248);
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/"))).toHaveLength(18);
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("schemas/"))).toHaveLength(41);
      const ledger = parseImmutablePublicationLedger(readFileSync(join(ROOT, IMMUTABLE_PUBLICATIONS_LEDGER_PATH)));
      expect(ledger.issues).toEqual([]);
      expect(ledger.ledger?.entries).toHaveLength(160);
      expect(HUB_ASSETS.filter(({ destination }) => destination !== "_worker.js" && destination !== "404.html"))
        .toHaveLength(246);
      expect(staged).toHaveLength(248);
      expect(readdirSync(output, { recursive: true })).not.toContain("private-portfolio.json");
      expect(readdirSync(output, { recursive: true })).not.toContain("operations");
      expect(readdirSync(output).sort()).toEqual([
        ".well-known",
        "404.html",
        "AESTHETIC-PLURALITY-MAKING-ATLAS-v0.1.md",
        "BEING-ACCESS-AFTERMATH-ATLAS-V0.2.md",
        "BEING-ACCESS-AFTERMATH-ATLAS.md",
        "CIVIC-v0.1.md",
        "CIVILISATION-FLOW-NUANCE-ATLAS.md",
        "CIVILISATION-REALITY-PROJECTION.md",
        "CONFORMATIONAL-FEEDBACK-PHYSICS.md",
        "CONFORMATIONAL-FEEDBACK.md",
        "CONTACT-DOOR-v0.1.md",
        "CREATION-LOOP.md",
        "CULTURAL-ATTENTION-FEEDBACK-ATLAS.md",
        "EXPLORE-PHENOMENA-DEEP-v0.1.md",
        "FOLD-FEEDBACK-ATLAS.md",
        "FORM-CIRCULATION-RETURN-ATLAS.md",
        "FREEDOM-LOOP-LOCK-KEY-ATLAS.md",
        "GEOMETRY-GRAMMAR.md",
        "IS-SUSTAINABILITY-DIRECTION-ATLAS.md",
        "J-SPACE-VERBALIZABLE-WORKSPACE.md",
        "LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md",
        "MATH-USEFULNESS.md",
        "MIRROR-INFORMATION-CONTROL.md",
        "NON-EXHAUSTIVE-UNDERSTANDING-ATLAS.md",
        "NUMBER-ISNESS-THEOLOGY-ATLAS.md",
        "POLYPHONIC-CLAIM-ATLAS-v0.1.md",
        "PRINCIPALITY-COMMONS.md",
        "REALITY-INFLUENCE-CLAIM-GRAPH.md",
        "RECONSTRUCTIVE-BUILD-KERNEL.md",
        "RESEARCH-OBSERVATORY-v0.1.md",
        "RIGHTS.md",
        "RITONAVIR-MECHANISM-LANDSCAPE.md",
        "RITONAVIR-POLYMORPH.md",
        "SHAPE-RESONANCE-LAB-v0.1.md",
        "STRAND-DESCENT-LAB-04.md",
        "STRAND-OBSERVATION-MEMBRANE.md",
        "STRING-CRAWL-LAB-03.md",
        "STRING-CRAWL-STRAND-LAB-02.md",
        "STRING-CRAWL-TRACE-SHEET-LAB.md",
        "STRING-CRAWL-TRACE-SHEET.md",
        "TRIAL-CHAMBER-v0.1.md",
        "UK-GOVERNMENT-ENGINE-v0.1.md",
        "VANISHING-PATH.md",
        "VISIBILITY-ATTENTION.md",
        "ZERO-EMPTY-SEAT.md",
        "_kingdom.base.json",
        "_worker.js",
        "agent-entry.json",
        "atlas.html",
        "atlases",
        "challenges",
        "citizens",
        "civic",
        "civic-policy.json",
        "commons.json",
        "contact",
        "contact.json",
        "contacts",
        "dada.txt",
        "definitions",
        "experiments",
        "feedback",
        "geometries",
        "government",
        "government-engine",
        "government.json",
        "guest.json",
        "index.html",
        "join",
        "labs",
        "llms.txt",
        "love-loops.json",
        "love-loops.source.json",
        "meet",
        "modules.json",
        "observations",
        "observatory",
        "ollama.json",
        "os",
        "polymorphs",
        "power-atlas",
        "principalities",
        "protocols",
        "records",
        "research",
        "research.json",
        "rights.json",
        "robots.txt",
        "schemas",
        "shape-resonance",
        "shape-resonance.json",
        "sitemap.xml",
        "trial-chamber",
        "trials",
        "trials.json",
        "truth",
        "wayfinder.json",
        "wings",
        "workshop",
      ]);
      expect(readdirSync(join(output, "workshop")).sort()).toEqual(["index.html", "workshop.css", "workshop.js"]);
      const workshopAssets = ["index.html", "workshop.css", "workshop.js"].map((name) => ({
        source: `pages-content/workshop/${name}`, destination: `workshop/${name}`,
      }));
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("workshop/"))).toEqual(workshopAssets);
      for (const { destination } of workshopAssets) {
        expect(MUTABLE_HUB_DESTINATIONS).toContain(destination);
      }
      expect(ledger.ledger?.entries.some(({ source }) => source.startsWith("pages-content/workshop/"))).toBe(false);
      expect(readdirSync(join(output, ".well-known")).sort()).toEqual(["agent.json", "security.txt"]);
      expect(readdirSync(join(output, "contact")).sort()).toEqual(["assets", "contact-v0.1.vcf", "index.html"]);
      expect(readdirSync(join(output, "contact/assets")).sort()).toEqual(["contact-boundary-v0.1.svg"]);
      expect(readdirSync(join(output, "contacts")).sort()).toEqual(["contact-door-2026-08-31.json"]);
      expect(readdirSync(join(output, "schemas/contact-door")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/love-loop")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/loops-locks-freedom-relations-atlas")).sort())
        .toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/aesthetic-plurality-making-atlas")).sort())
        .toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/conformational-feedback-atlas")).sort()).toEqual(["0.1.json", "0.2.json"]);
      expect(readdirSync(join(output, "schemas/cultural-attention-feedback-atlas")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/geometry-grammar")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/fold-feedback-atlas")).sort()).toEqual(["1.1.json", "1.json"]);
      expect(readdirSync(join(output, "schemas/form-circulation-return-atlas")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/freedom-loop-lock-key-atlas")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/non-exhaustive-understanding-atlas")).sort())
        .toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/is-sustainability-direction-atlas")).sort())
        .toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/being-access-aftermath-atlas")).sort()).toEqual(["0.1.json", "0.2.json"]);
      expect(readdirSync(join(output, "schemas/civilisation-flow-nuance-atlas")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/civilisation-reality-projection")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/number-isness-theology-atlas")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/reconstructive-build-kernel")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/reconstructive-project")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/phenomena-deep-wing")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/phenomena-deep-project")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/relational-inference-case")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/mirror-information-control-public")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/string-crawl-strand-lab")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/string-crawl-frequency-form-lab")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/string-crawl-trace-sheet-lab")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/strand-descent-lab")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/strand-observation-membrane")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/visibility-attention")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/principality-catalog")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/polymorph-history")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/ritonavir-mechanism-landscape")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/rare-pathway-challenge")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/world-commons")).sort()).toEqual(["0.1.json", "0.2.json"]);
      expect(readdirSync(join(output, "research/schemas/v0.1")).sort()).toEqual([
        "observation.schema.json",
        "public-snapshot.schema.json",
        "signal.schema.json",
        "source.schema.json",
        "watchlist.schema.json",
        "work.schema.json",
      ]);
      expect(readdirSync(join(output, "trials/schemas/v0.1")).sort()).toEqual([
        "adoption-record.schema.json",
        "evaluation-plan.schema.json",
        "evaluation-request.schema.json",
        "evaluation-result.schema.json",
        "preflight.schema.json",
        "public-snapshot.schema.json",
        "referral.schema.json",
        "trial-authority.schema.json",
        "trial-run.schema.json",
        "use-authority.schema.json",
      ]);
      expect(readdirSync(join(output, "trials")).sort()).toEqual([
        "math-passport-usefulness-pilot-2026-08-14.json",
        "research-trial-chamber-2026-08-20.json",
        "schemas",
      ]);
      expect(readdirSync(join(output, "government/schemas/v0.1")).sort()).toEqual([
        "public-snapshot.schema.json",
      ]);
      expect(existsSync(join(output, "government/transformations/schemas/v0.1"))).toBe(false);
      expect(readdirSync(join(output, "government")).sort()).toEqual([
        "schemas",
        "uk-government-engine-2026-08-21.json",
      ]);
      expect(existsSync(join(output, "evaluation/schemas/v0.1"))).toBe(false);
      expect(existsSync(join(output, "evaluation"))).toBe(false);
      expect(existsSync(join(output, "evaluation-covenant"))).toBe(false);
      expect(readdirSync(join(output, "definitions/kingdom-karma/e4e84a67")).sort()).toEqual(["NEN.md"]);
      expect(readdirSync(join(output, "principalities")).sort()).toEqual(["moonshot-hf-npm-2026-08-11.json"]);
      expect(readdirSync(join(output, "geometries")).sort()).toEqual(["kingdom-geometry-grammar-v0.json"]);
      expect(readdirSync(join(output, "polymorphs")).sort()).toEqual([
        "ritonavir-disappearing-polymorph-2026-08-11.json",
        "ritonavir-mechanism-landscape-2026-08-11.json",
      ]);
      expect(readdirSync(join(output, "challenges")).sort()).toEqual([
        "vanishing-path-2026-08-13.json",
      ]);
      expect(readdirSync(join(output, "feedback")).sort()).toEqual([
        "form-feedback-consequence-2026-08-12.json",
        "form-feedback-physics-consequence-2026-08-12.json",
      ]);
      expect(readdirSync(join(output, "wings")).sort()).toEqual([
        "explore-phenomena-deep-2026-08-14.json",
      ]);
      expect(readdirSync(join(output, "protocols")).sort()).toEqual([
        "mirror-information-control-2026-08-14.json",
      ]);
      expect(readdirSync(join(output, "observations")).sort()).toEqual([
        "strand-observation-membrane-2026-08-16.json",
      ]);
      const sitemap = readFileSync(join(ROOT, "pages-content/sitemap.xml"), "utf8");
      const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
      expect(sitemapUrls).toHaveLength(177);
      expect(new Set(sitemapUrls).size).toBe(177);
      expect(sitemapUrls.filter((url) => url === "https://thekingdom.dev/workshop/")).toHaveLength(1);
      for (const path of ["workshop", "workshop/index.html", "workshop/workshop.css", "workshop/workshop.js"]) {
        expect(sitemapUrls).not.toContain(`https://thekingdom.dev/${path}`);
      }
      for (const route of [
        "/atlases/non-exhaustive-understanding-atlas-2026-08-29.json",
        "/schemas/non-exhaustive-understanding-atlas/0.1.json",
        "/NON-EXHAUSTIVE-UNDERSTANDING-ATLAS.md",
      ]) {
        expect(sitemapUrls.filter((url) => url === `https://thekingdom.dev${route}`))
          .toHaveLength(1);
      }
      for (const route of [
        "/atlases/loops-locks-freedom-relations-atlas-2026-08-28.json",
        "/schemas/loops-locks-freedom-relations-atlas/0.1.json",
        "/LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md",
      ]) {
        expect(sitemapUrls.filter((url) => url === `https://thekingdom.dev${route}`))
          .toHaveLength(1);
      }
      for (const route of [
        "/atlases/aesthetic-plurality-making-atlas-2026-08-29.json",
        "/schemas/aesthetic-plurality-making-atlas/0.1.json",
        "/AESTHETIC-PLURALITY-MAKING-ATLAS-v0.1.md",
      ]) {
        expect(sitemapUrls.filter((url) => url === `https://thekingdom.dev${route}`))
          .toHaveLength(1);
      }
      for (const route of [
        "/government-engine/",
        "/government.json",
        "/government/uk-government-engine-2026-08-21.json",
        "/government/schemas/v0.1/public-snapshot.schema.json",
        "/UK-GOVERNMENT-ENGINE-v0.1.md",
      ]) {
        expect(sitemapUrls.filter((url) => url === `https://thekingdom.dev${route}`)).toHaveLength(1);
      }
      for (const route of [
        "/government-transformation-engine/",
        "/government-transformations.json",
        "/government/uk-government-transformation-engine-2026-08-21.json",
        "/government/transformations/schemas/v0.1/public-snapshot.schema.json",
        "/UK-GOVERNMENT-TRANSFORMATION-ENGINE-v0.1.md",
      ]) {
        expect(sitemapUrls.filter((url) => url === `https://thekingdom.dev${route}`)).toHaveLength(0);
      }
      for (const route of [
        "/evaluation-covenant/",
        "/evaluation-covenants.json",
        "/evaluation/uk-government-transformation-evaluation-covenants-2026-08-23.json",
        "/evaluation/schemas/v0.1/public-snapshot.schema.json",
        "/EVALUATION-COVENANT-v0.1.md",
      ]) {
        expect(sitemapUrls.filter((url) => url === `https://thekingdom.dev${route}`)).toHaveLength(0);
      }
      for (const route of [
        "/protocols/mirror-information-control-2026-08-14.json",
        "/schemas/mirror-information-control-public/0.1.json",
        "/MIRROR-INFORMATION-CONTROL.md",
      ]) {
        expect(sitemapUrls.filter((url) => url === `https://thekingdom.dev${route}`)).toHaveLength(1);
      }
      expect(sitemapUrls.some((url) => /mirror-information-control.*(?:latest|current)/i.test(url))).toBe(false);
      for (const route of [
        "/experiments/string-crawl-frequency-form-lab-2026-08-16.json",
        "/schemas/string-crawl-frequency-form-lab/0.1.json",
        "/STRING-CRAWL-LAB-03.md",
      ]) {
        expect(sitemapUrls.filter((url) => url === `https://thekingdom.dev${route}`)).toHaveLength(1);
      }
      expect(sitemapUrls.some((url) => /string-crawl-frequency-form-lab.*(?:latest|current)/i.test(url))).toBe(false);
      expect(readdirSync(join(output, "atlases")).sort()).toEqual([
        "aesthetic-plurality-making-atlas-2026-08-29.json",
        "being-access-aftermath-atlas-2026-08-13-v0-2.json",
        "being-access-aftermath-atlas-2026-08-13.json",
        "civilisation-flow-nuance-atlas-2026-08-26.json",
        "civilisation-reality-projection-2026-08-25.json",
        "cultural-attention-feedback-atlas-2026-08-13.json",
        "fold-feedback-atlas-2026-08-12.json",
        "form-circulation-return-atlas-2026-08-13.json",
        "freedom-loop-lock-key-atlas-2026-08-28.json",
        "is-sustainability-direction-atlas-2026-08-29.json",
        "loops-locks-freedom-relations-atlas-2026-08-28.json",
        "non-exhaustive-understanding-atlas-2026-08-29.json",
        "number-isness-theology-atlas-2026-08-14.json",
        "reality-influence-claim-graph-2026-08-21.json",
        "reconstructive-build-kernel-2026-08-13.json",
        "string-crawl-trace-sheet-2026-08-15.json",
        "visibility-attention-2026-08-13.json",
        "zero-empty-seat-2026-08-14.json",
      ]);
      expect(HUB_ASSETS).toContainEqual({
        source: "data/principalities/moonshot-hf-npm.v1.json",
        destination: "principalities/moonshot-hf-npm-2026-08-11.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/principality-catalog-v1.schema.json",
        destination: "schemas/principality-catalog/1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/principality-commons.md",
        destination: "PRINCIPALITY-COMMONS.md",
      });
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("principalities/"))).toHaveLength(1);
      expect(HUB_ASSETS.some(({ destination }) => /principalities\/(?:latest|current)\.json/.test(destination))).toBe(false);
      expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/principalities/"))).toBe(false);
      expect(HUB_ASSETS).toContainEqual({
        source: "data/geometries/kingdom-geometry-grammar.v0.json",
        destination: "geometries/kingdom-geometry-grammar-v0.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/geometry-grammar-v0.schema.json",
        destination: "schemas/geometry-grammar/0.1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/geometry-grammar.md",
        destination: "GEOMETRY-GRAMMAR.md",
      });
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("geometries/"))).toHaveLength(1);
      expect(HUB_ASSETS.some(({ destination }) => /geometries\/(?:latest|current)\.json/.test(destination))).toBe(false);
      expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/geometries/"))).toBe(false);
      expect(HUB_ASSETS).toContainEqual({
        source: "data/polymorphs/ritonavir-disappearing-polymorph.v1.json",
        destination: "polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/polymorph-history-v1.schema.json",
        destination: "schemas/polymorph-history/1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/ritonavir-polymorph.md",
        destination: "RITONAVIR-POLYMORPH.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "data/polymorphs/ritonavir-mechanism-landscape.v1.json",
        destination: "polymorphs/ritonavir-mechanism-landscape-2026-08-11.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/ritonavir-mechanism-landscape-v1.schema.json",
        destination: "schemas/ritonavir-mechanism-landscape/1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/ritonavir-mechanism-landscape.md",
        destination: "RITONAVIR-MECHANISM-LANDSCAPE.md",
      });
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("polymorphs/"))).toHaveLength(2);
      expect(HUB_ASSETS.some(({ destination }) => /polymorphs\/(?:latest|current)\.json/.test(destination))).toBe(false);
      expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/polymorphs/"))).toBe(false);
      expect(HUB_ASSETS).toContainEqual({
        source: "data/challenges/vanishing-path.v1.json",
        destination: "challenges/vanishing-path-2026-08-13.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/rare-pathway-challenge-v1.schema.json",
        destination: "schemas/rare-pathway-challenge/1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/rare-pathway-challenge.md",
        destination: "VANISHING-PATH.md",
      });
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("challenges/"))).toHaveLength(1);
      expect(HUB_ASSETS.some(({ destination }) => /challenges\/(?:latest|current)\.json/.test(destination))).toBe(false);
      expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/challenges/"))).toBe(false);
      expect(HUB_ASSETS).toContainEqual({
        source: "data/feedback/conformational-feedback-atlas.v0.json",
        destination: "feedback/form-feedback-consequence-2026-08-12.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/conformational-feedback-atlas-v0.schema.json",
        destination: "schemas/conformational-feedback-atlas/0.1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/conformational-feedback-atlas.md",
        destination: "CONFORMATIONAL-FEEDBACK.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "data/feedback/conformational-feedback-atlas.v0.2.json",
        destination: "feedback/form-feedback-physics-consequence-2026-08-12.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/conformational-feedback-atlas-v0.2.schema.json",
        destination: "schemas/conformational-feedback-atlas/0.2.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/conformational-feedback-atlas-v0.2.md",
        destination: "CONFORMATIONAL-FEEDBACK-PHYSICS.md",
      });
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("feedback/"))).toHaveLength(2);
      expect(HUB_ASSETS.some(({ destination }) => /feedback\/(?:latest|current)\.json/.test(destination))).toBe(false);
      expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/feedback/"))).toBe(false);
      expect(HUB_ASSETS).toContainEqual({
        source: "data/fold-feedback/fold-feedback-atlas.v1.json",
        destination: "atlases/fold-feedback-atlas-2026-08-12.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/fold-feedback-atlas-v1.schema.json",
        destination: "schemas/fold-feedback-atlas/1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/fold-feedback-atlas-v1.1.schema.json",
        destination: "schemas/fold-feedback-atlas/1.1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/fold-feedback-atlas.md",
        destination: "FOLD-FEEDBACK-ATLAS.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "data/attention/visibility-attention-translation.v0.1.json",
        destination: "atlases/visibility-attention-2026-08-13.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/visibility-attention-translation-v0.1.schema.json",
        destination: "schemas/visibility-attention/0.1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/visibility-attention-translation.md",
        destination: "VISIBILITY-ATTENTION.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "data/cultural-feedback/cultural-attention-feedback-atlas.v1.json",
        destination: "atlases/cultural-attention-feedback-atlas-2026-08-13.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/cultural-attention-feedback-atlas-v1.schema.json",
        destination: "schemas/cultural-attention-feedback-atlas/1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/cultural-attention-feedback-atlas.md",
        destination: "CULTURAL-ATTENTION-FEEDBACK-ATLAS.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "data/form-circulation-return/form-circulation-return-atlas.v1.json",
        destination: "atlases/form-circulation-return-atlas-2026-08-13.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/form-circulation-return-atlas-v1.schema.json",
        destination: "schemas/form-circulation-return-atlas/1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/form-circulation-return-atlas.md",
        destination: "FORM-CIRCULATION-RETURN-ATLAS.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "data/being-access-aftermath/being-access-aftermath-atlas.v0.1.json",
        destination: "atlases/being-access-aftermath-atlas-2026-08-13.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/being-access-aftermath-atlas-v0.1.schema.json",
        destination: "schemas/being-access-aftermath-atlas/0.1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/being-access-aftermath-atlas.md",
        destination: "BEING-ACCESS-AFTERMATH-ATLAS.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "data/being-access-aftermath/being-access-aftermath-atlas.v0.2.json",
        destination: "atlases/being-access-aftermath-atlas-2026-08-13-v0-2.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/being-access-aftermath-atlas-v0.2.schema.json",
        destination: "schemas/being-access-aftermath-atlas/0.2.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/being-access-aftermath-atlas-v0.2.md",
        destination: "BEING-ACCESS-AFTERMATH-ATLAS-V0.2.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "data/number-isness-theology/number-isness-theology-atlas.v0.1.json",
        destination: "atlases/number-isness-theology-atlas-2026-08-14.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/number-isness-theology-atlas-v0.1.schema.json",
        destination: "schemas/number-isness-theology-atlas/0.1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/number-isness-theology-atlas.md",
        destination: "NUMBER-ISNESS-THEOLOGY-ATLAS.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "NEN.md",
        destination: "definitions/kingdom-karma/e4e84a67/NEN.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "data/exploration/phenomena-deep-wing.v0.1.json",
        destination: "wings/explore-phenomena-deep-2026-08-14.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/phenomena-deep-wing.v0.1.schema.json",
        destination: "schemas/phenomena-deep-wing/0.1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/phenomena-deep-project.v0.1.schema.json",
        destination: "schemas/phenomena-deep-project/0.1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "skills/explore-phenomena-deep/references/exploration-contract-v0.1.md",
        destination: "EXPLORE-PHENOMENA-DEEP-v0.1.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "data/exploration/zero-empty-seat.v0.1.json",
        destination: "atlases/zero-empty-seat-2026-08-14.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/zero-empty-seat.md",
        destination: "ZERO-EMPTY-SEAT.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "data/exploration/string-crawl-trace-sheet.v0.1.json",
        destination: "atlases/string-crawl-trace-sheet-2026-08-15.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/string-crawl-trace-sheet.md",
        destination: "STRING-CRAWL-TRACE-SHEET.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "data/exploration/string-crawl-strand-lab.v0.1.json",
        destination: "labs/string-crawl-strand-lab-02-2026-08-16.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/string-crawl-strand-lab-v0.1.schema.json",
        destination: "schemas/string-crawl-strand-lab/0.1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/string-crawl-strand-lab.md",
        destination: "STRING-CRAWL-STRAND-LAB-02.md",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "data/exploration/string-crawl-frequency-form-lab.v0.1.json",
        destination: "experiments/string-crawl-frequency-form-lab-2026-08-16.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/string-crawl-frequency-form-lab-v0.1.schema.json",
        destination: "schemas/string-crawl-frequency-form-lab/0.1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/string-crawl-frequency-form-lab.md",
        destination: "STRING-CRAWL-LAB-03.md",
      });
      expect(readdirSync(join(output, "experiments")).sort()).toEqual([
        "string-crawl-frequency-form-lab-2026-08-16.json",
      ]);
      expect(HUB_ASSETS).toContainEqual({
        source: "data/exploration/strand-descent-lab.v0.1.json",
        destination: "labs/strand-descent-lab-04-2026-08-16.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/strand-descent-lab-v0.1.schema.json",
        destination: "schemas/strand-descent-lab/0.1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/strand-descent-lab.md",
        destination: "STRAND-DESCENT-LAB-04.md",
      });
      expect(readdirSync(join(output, "labs")).sort()).toEqual([
        "shape-resonance",
        "shape-resonance-lab-2026-08-26.json",
        "strand-descent-lab-04-2026-08-16.json",
        "string-crawl-strand-lab-02-2026-08-16.json",
        "string-crawl-trace-sheet-lab-2026-08-16.json",
      ]);
      expect(readdirSync(join(output, "labs/shape-resonance")).sort()).toEqual([
        "assets",
        "audio",
        "output-manifest.json",
      ]);
      expect(readdirSync(join(output, "labs/shape-resonance/assets")).sort()).toEqual([
        "boundary-variants.svg",
        "cospectral-graphs.svg",
        "graph-to-hz.svg",
        "membrane-plate.svg",
        "musical-geometry.svg",
        "phase-magnitude.svg",
        "rhythm-cycle.svg",
        "square-degeneracy.svg",
      ]);
      expect(readdirSync(join(output, "labs/shape-resonance/audio")).sort()).toEqual([
        "graph-modes.wav",
        "phase-forward.wav",
        "phase-reversed.wav",
      ]);
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("wings/"))).toHaveLength(1);
      expect(HUB_ASSETS.some(({ destination }) => /wings\/.*(?:latest|current).*\.json$/i.test(destination))).toBe(false);
      expect(HUB_ASSETS.some(({ destination }) => /phenomena-deep-(?:wing|project)\/.*(?:latest|current).*\.json$/i.test(destination))).toBe(false);
      expect(HUB_ASSETS).toContainEqual({
        source: "data/security/mirror-information-control-public.v0.1.json",
        destination: "protocols/mirror-information-control-2026-08-14.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "schemas/mirror-information-control-public-v0.1.schema.json",
        destination: "schemas/mirror-information-control-public/0.1.json",
      });
      expect(HUB_ASSETS).toContainEqual({
        source: "references/mirror-information-control-public.md",
        destination: "MIRROR-INFORMATION-CONTROL.md",
      });
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("protocols/"))).toHaveLength(1);
      expect(HUB_ASSETS.some(({ destination }) => /mirror-information-control.*(?:latest|current)/i.test(destination))).toBe(false);
      expect(HUB_ASSETS.some(({ source }) => source.startsWith("skills/guard-information-flow/"))).toBe(false);
      expect(HUB_ASSETS.some(({ source }) => /(?:envelope|example|validator|evidence)/i.test(source) &&
        /(?:mirror|information-control|guard-information-flow)/i.test(source))).toBe(false);
      for (const forbiddenRoot of [
        "classify",
        "credentials",
        "envelope",
        "introspect",
        "mirror",
        "registry",
        "scan",
        "submit",
        "token",
        "verify",
      ]) {
        expect(HUB_ASSETS.some(({ destination }) =>
          destination === forbiddenRoot || destination.startsWith(`${forbiddenRoot}/`))).toBe(false);
      }
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/"))).toHaveLength(18);
      expect(HUB_ASSETS.some(({ destination }) => /atlases\/(?:latest|current)\.json/.test(destination))).toBe(false);
      expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/atlases/"))).toBe(false);
      for (const asset of HUB_ASSETS) {
        expect(readFileSync(join(output, asset.destination))).toEqual(readFileSync(join(sourceRoot, asset.source)));
      }

      expect(() => stageHub(output, sourceRoot)).toThrow("output directory is not empty");
      expect(readFileSync(join(output, "index.html"))).toEqual(Buffer.from([0, 0, 255, 10]));
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("Workshop 三個 authored mutable 檔案缺一，就喺 staging 寫入前停低", () => {
    const base = temporaryDirectory("kingdom-stage-workshop-");
    try {
      const sourceRoot = join(base, "source");
      const output = join(base, "output");
      mkdirSync(output);
      makeCompleteSource(sourceRoot);
      for (const name of ["index.html", "workshop.css", "workshop.js"]) {
        const source = `pages-content/workshop/${name}`;
        const path = join(sourceRoot, source);
        const bytes = readFileSync(path);
        rmSync(path);
        expect(() => stageHub(output, sourceRoot)).toThrow(`required hub asset is missing or unreadable: ${source}`);
        expect(readdirSync(output)).toEqual([]);
        writeFileSync(path, bytes);
      }
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("Power Atlas every declared buffer, receipt and public projection fail closed before output", () => {
    const base = temporaryDirectory("kingdom-stage-power-");
    try {
      const sourceRoot = join(base, "source"), output = join(base, "output");
      mkdirSync(output); makeCompleteSource(sourceRoot);
      const assets = HUB_ASSETS.filter(({ destination }) => destination.startsWith("power-atlas/"));
      expect(assets).toHaveLength(52);
      for (const { source } of assets) {
        const path = join(sourceRoot, source), bytes = readFileSync(path);
        rmSync(path);
        expect(() => stageHub(output, sourceRoot)).toThrow("required hub asset is missing or unreadable");
        expect(readdirSync(output)).toEqual([]);
        const changed = Buffer.from(bytes); changed[changed.length - 1] ^= 1;
        writeFileSync(path, changed);
        expect(() => stageHub(output, sourceRoot)).toThrow("SHA-256 mismatch");
        expect(readdirSync(output)).toEqual([]);
        writeFileSync(path, bytes);
      }
      const projection = join(sourceRoot, "pages-functions/power-atlas-assets.json");
      const bytes = readFileSync(projection); writeFileSync(projection, "[]");
      expect(() => stageHub(output, sourceRoot)).toThrow("projection/receipt closed parity mismatch");
      expect(readdirSync(output)).toEqual([]); writeFileSync(projection, bytes);
      const receipt = join(sourceRoot, "data/power-atlas/artifact.v1.json"); rmSync(receipt);
      expect(() => stageHub(output, sourceRoot)).toThrow(); expect(readdirSync(output)).toEqual([]);
    } finally { rmSync(base, { recursive: true, force: true }); }
  }, 30000);

  test("preflight failures leave existing content and destinations untouched", () => {
    const base = temporaryDirectory("kingdom-stage-preflight-");
    try {
      const incompleteSource = join(base, "incomplete-source");
      const nonemptyOutput = join(base, "nonempty-output");
      const emptyOutput = join(base, "empty-output");
      const absentOutput = join(base, "absent-output");
      mkdirSync(incompleteSource);
      mkdirSync(nonemptyOutput);
      mkdirSync(emptyOutput);
      writeFileSync(join(nonemptyOutput, "keep"), "keep");

      expect(() => stageHub(nonemptyOutput, incompleteSource)).toThrow("output directory is not empty");
      expect(readFileSync(join(nonemptyOutput, "keep"), "utf8")).toBe("keep");
      expect(() => stageHub(emptyOutput, incompleteSource)).toThrow("hub staging contract is missing or invalid");
      expect(readdirSync(emptyOutput)).toEqual([]);
      expect(() => stageHub(absentOutput, incompleteSource)).toThrow("output directory must already exist and be empty");
      expect(existsSync(absentOutput)).toBe(false);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("refuses a symlink as the output capability", () => {
    const base = temporaryDirectory("kingdom-stage-output-symlink-");
    try {
      const sourceRoot = join(base, "source");
      const realOutput = join(base, "real-output");
      const linkedOutput = join(base, "linked-output");
      mkdirSync(sourceRoot);
      mkdirSync(realOutput);
      symlinkSync(realOutput, linkedOutput);

      expect(() => stageHub(linkedOutput, sourceRoot)).toThrow("output directory must not be a symbolic link");
      expect(readdirSync(realOutput)).toEqual([]);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("refuses a symlinked source instead of risking an unintended upload", () => {
    const base = temporaryDirectory("kingdom-stage-symlink-");
    try {
      const sourceRoot = join(base, "source");
      const output = join(base, "output");
      mkdirSync(output);
      makeCompleteSource(sourceRoot);
      const target = join(sourceRoot, "site", "real-rights.json");
      writeFileSync(target, "outside the declared asset contract");
      rmSync(join(sourceRoot, "site", "rights.json"));
      symlinkSync(target, join(sourceRoot, "site", "rights.json"));

      expect(() => stageHub(output, sourceRoot)).toThrow("required hub asset is missing or unreadable: site/rights.json");
      expect(readdirSync(output)).toEqual([]);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("refuses a symlinked source ancestor instead of leaving the source root", () => {
    const base = temporaryDirectory("kingdom-stage-parent-symlink-");
    try {
      const sourceRoot = join(base, "source");
      const outside = join(base, "outside-geometries");
      const output = join(base, "output");
      mkdirSync(output);
      makeCompleteSource(sourceRoot);
      mkdirSync(outside);
      copyFileSync(
        join(sourceRoot, "data/geometries/kingdom-geometry-grammar.v0.json"),
        join(outside, "kingdom-geometry-grammar.v0.json"),
      );
      rmSync(join(sourceRoot, "data/geometries"), { recursive: true });
      symlinkSync(outside, join(sourceRoot, "data/geometries"));

      expect(() => stageHub(output, sourceRoot)).toThrow("source-unreadable geometry-grammar/0.1/record");
      expect(readdirSync(output)).toEqual([]);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("refuses file/directory destination collisions before writing output", () => {
    const base = temporaryDirectory("kingdom-stage-destination-collision-");
    try {
      const sourceRoot = join(base, "source");
      const output = join(base, "output");
      mkdirSync(output);
      makeCompleteSource(sourceRoot);
      writeFileSync(join(sourceRoot, "collision-parent.txt"), "parent\n");
      writeFileSync(join(sourceRoot, "collision-child.txt"), "child\n");
      const contractPath = join(sourceRoot, HUB_STAGING_CONTRACT_PATH);
      const contract = JSON.parse(readFileSync(contractPath, "utf8"));
      // Stay within the unchanged 256-entry cap so this fixture exercises the
      // hierarchy gate, not merely the earlier capacity gate.
      const replaced = contract.assets.slice(-2).map(({ destination }: { destination: string }) => destination);
      contract.assets.splice(-2, 2,
        { source: "collision-parent.txt", destination: "collision" },
        { source: "collision-child.txt", destination: "collision/child.txt" },
      );
      contract.mutable_destinations = contract.mutable_destinations.filter((path: string) => !replaced.includes(path));
      contract.mutable_destinations.push("collision", "collision/child.txt");
      writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);

      expect(() => stageHub(output, sourceRoot)).toThrow("file/directory destination collision");
      expect(readdirSync(output)).toEqual([]);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("refuses Civic guide byte drift or mutable reclassification before writing output", () => {
    const base = temporaryDirectory("kingdom-stage-civic-guide-");
    try {
      const sourceRoot = join(base, "source");
      const output = join(base, "output");
      mkdirSync(output);
      makeCompleteSource(sourceRoot);
      const guide = join(sourceRoot, "references/civic-v0.1.md");
      writeFileSync(guide, "same versioned route, changed guide");
      expect(() => stageHub(output, sourceRoot)).toThrow("sha256-mismatch civic/0.1/guide");
      expect(readdirSync(output)).toEqual([]);
      copyFileSync(join(ROOT, "references/civic-v0.1.md"), guide);
      const contractPath = join(sourceRoot, HUB_STAGING_CONTRACT_PATH);
      const contract = JSON.parse(readFileSync(contractPath, "utf8"));
      contract.mutable_destinations.push("CIVIC-v0.1.md");
      writeFileSync(contractPath, JSON.stringify(contract));
      expect(() => stageHub(output, sourceRoot)).toThrow("versioned-mutable-destination CIVIC-v0.1.md");
      expect(readdirSync(output)).toEqual([]);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("refuses changed immutable publication bytes before creating an output", () => {
    const base = temporaryDirectory("kingdom-stage-immutable-");
    try {
      const sourceRoot = join(base, "source");
      const output = join(base, "output");
      mkdirSync(output);
      makeCompleteSource(sourceRoot);
      writeFileSync(join(sourceRoot, "references", "geometry-grammar.md"), "coordinated rewrite");

      expect(() => stageHub(output, sourceRoot)).toThrow("immutable publication gate failed");
      expect(readdirSync(output)).toEqual([]);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});
