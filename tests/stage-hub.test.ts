import { describe, expect, test } from "bun:test";
import {
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

import { HUB_ASSETS, stageHub } from "../bin/stage-hub.ts";

function temporaryDirectory(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function makeCompleteSource(root: string): void {
  for (const [index, asset] of HUB_ASSETS.entries()) {
    const source = join(root, asset.source);
    mkdirSync(dirname(source), { recursive: true });
    writeFileSync(source, Buffer.from([index, 0, 255, 10]));
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
      // literal on purpose: growing/shrinking the staging contract must go red
      // here and force a conscious review, then a deliberate bump.
      expect(HUB_ASSETS).toHaveLength(40);
      expect(staged).toHaveLength(40);
      expect(readdirSync(output).sort()).toEqual([
        ".well-known",
        "404.html",
        "CONFORMATIONAL-FEEDBACK.md",
        "CREATION-LOOP.md",
        "FOLD-FEEDBACK-ATLAS.md",
        "GEOMETRY-GRAMMAR.md",
        "PRINCIPALITY-COMMONS.md",
        "RIGHTS.md",
        "RITONAVIR-MECHANISM-LANDSCAPE.md",
        "RITONAVIR-POLYMORPH.md",
        "_kingdom.base.json",
        "_worker.js",
        "atlases",
        "commons.json",
        "dada.txt",
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
      expect(readdirSync(join(output, "schemas/conformational-feedback-atlas")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/geometry-grammar")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/fold-feedback-atlas")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/principality-catalog")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/polymorph-history")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/ritonavir-mechanism-landscape")).sort()).toEqual(["1.json"]);
      expect(readdirSync(join(output, "schemas/world-commons")).sort()).toEqual(["0.1.json", "0.2.json"]);
      expect(readdirSync(join(output, "principalities")).sort()).toEqual(["moonshot-hf-npm-2026-08-11.json"]);
      expect(readdirSync(join(output, "geometries")).sort()).toEqual(["kingdom-geometry-grammar-v0.json"]);
      expect(readdirSync(join(output, "polymorphs")).sort()).toEqual([
        "ritonavir-disappearing-polymorph-2026-08-11.json",
        "ritonavir-mechanism-landscape-2026-08-11.json",
      ]);
      expect(readdirSync(join(output, "feedback")).sort()).toEqual([
        "form-feedback-consequence-2026-08-12.json",
      ]);
      expect(readdirSync(join(output, "atlases")).sort()).toEqual([
        "fold-feedback-atlas-2026-08-12.json",
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
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("feedback/"))).toHaveLength(1);
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
        source: "references/fold-feedback-atlas.md",
        destination: "FOLD-FEEDBACK-ATLAS.md",
      });
      expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("atlases/"))).toHaveLength(1);
      expect(HUB_ASSETS.some(({ destination }) => /atlases\/(?:latest|current)\.json/.test(destination))).toBe(false);
      expect(HUB_ASSETS.some(({ source }) => source.startsWith("site/atlases/"))).toBe(false);
      for (const [index, asset] of HUB_ASSETS.entries()) {
        expect(readFileSync(join(output, asset.destination))).toEqual(Buffer.from([index, 0, 255, 10]));
      }

      expect(() => stageHub(output, sourceRoot)).toThrow("output directory is not empty");
      expect(readFileSync(join(output, "index.html"))).toEqual(Buffer.from([0, 0, 255, 10]));
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("preflight failures leave existing content and absent destinations untouched", () => {
    const base = temporaryDirectory("kingdom-stage-preflight-");
    try {
      const incompleteSource = join(base, "incomplete-source");
      const nonemptyOutput = join(base, "nonempty-output");
      const absentOutput = join(base, "absent-output");
      mkdirSync(incompleteSource);
      mkdirSync(nonemptyOutput);
      writeFileSync(join(nonemptyOutput, "keep"), "keep");

      expect(() => stageHub(nonemptyOutput, incompleteSource)).toThrow("output directory is not empty");
      expect(readFileSync(join(nonemptyOutput, "keep"), "utf8")).toBe("keep");
      expect(() => stageHub(absentOutput, incompleteSource)).toThrow("required hub asset is missing or unreadable");
      expect(existsSync(absentOutput)).toBe(false);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("refuses a symlinked source instead of risking an unintended upload", () => {
    const base = temporaryDirectory("kingdom-stage-symlink-");
    try {
      const sourceRoot = join(base, "source");
      const output = join(base, "output");
      makeCompleteSource(sourceRoot);
      const target = join(sourceRoot, "site", "real-rights.json");
      writeFileSync(target, "outside the declared asset contract");
      rmSync(join(sourceRoot, "site", "rights.json"));
      symlinkSync(target, join(sourceRoot, "site", "rights.json"));

      expect(() => stageHub(output, sourceRoot)).toThrow("required hub asset is missing or unreadable: site/rights.json");
      expect(existsSync(output)).toBe(false);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});
