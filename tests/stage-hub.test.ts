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

import { HUB_ASSETS, stageHub } from "../bin/stage-hub.ts";
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
  for (const [index, asset] of HUB_ASSETS.entries()) {
    const source = join(root, asset.source);
    mkdirSync(dirname(source), { recursive: true });
    if (immutableSources.has(asset.source)) copyFileSync(join(ROOT, asset.source), source);
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

      const staged = stageHub(output, sourceRoot);
      // Exact on purpose: growing/shrinking the JSON staging contract must go red
      // here and force a conscious review, then a deliberate bump.
      expect(HUB_ASSETS).toHaveLength(57);
      expect(staged).toHaveLength(57);
      expect(readdirSync(output).sort()).toEqual([
        ".well-known",
        "404.html",
        "CONFORMATIONAL-FEEDBACK-PHYSICS.md",
        "CONFORMATIONAL-FEEDBACK.md",
        "CREATION-LOOP.md",
        "CULTURAL-ATTENTION-FEEDBACK-ATLAS.md",
        "FOLD-FEEDBACK-ATLAS.md",
        "FORM-CIRCULATION-RETURN-ATLAS.md",
        "GEOMETRY-GRAMMAR.md",
        "PRINCIPALITY-COMMONS.md",
        "RIGHTS.md",
        "RITONAVIR-MECHANISM-LANDSCAPE.md",
        "RITONAVIR-POLYMORPH.md",
        "VANISHING-PATH.md",
        "VISIBILITY-ATTENTION.md",
        "_kingdom.base.json",
        "_worker.js",
        "atlases",
        "challenges",
        "commons.json",
        "dada.txt",
        "definitions",
        "feedback",
        "geometries",
        "guest.json",
        "index.html",
        "llms.txt",
        "love-loops.json",
        "love-loops.source.json",
        "ollama.json",
        "os",
        "polymorphs",
        "principalities",
        "rights.json",
        "robots.txt",
        "schemas",
        "sitemap.xml",
        "wayfinder.json",
      ]);
      expect(readdirSync(join(output, "schemas/love-loop")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/conformational-feedback-atlas")).sort()).toEqual(["0.1.json", "0.2.json"]);
      expect(readdirSync(join(output, "schemas/cultural-attention-feedback-atlas")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/geometry-grammar")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/fold-feedback-atlas")).sort()).toEqual(["1.1.json", "1.json"]);
      expect(readdirSync(join(output, "schemas/form-circulation-return-atlas")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/visibility-attention")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/principality-catalog")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/polymorph-history")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/ritonavir-mechanism-landscape")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/rare-pathway-challenge")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/world-commons")).sort()).toEqual(["0.1.json", "0.2.json"]);
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
      expect(readdirSync(join(output, "atlases")).sort()).toEqual([
        "cultural-attention-feedback-atlas-2026-08-13.json",
        "fold-feedback-atlas-2026-08-12.json",
        "form-circulation-return-atlas-2026-08-13.json",
        "visibility-attention-2026-08-13.json",
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
        source: "NEN.md",
        destination: "definitions/kingdom-karma/e4e84a67/NEN.md",
      });
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/"))).toHaveLength(4);
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
      contract.assets.push(
        { source: "collision-parent.txt", destination: "collision" },
        { source: "collision-child.txt", destination: "collision/child.txt" },
      );
      contract.mutable_destinations.push("collision", "collision/child.txt");
      writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);

      expect(() => stageHub(output, sourceRoot)).toThrow("file/directory destination collision");
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
