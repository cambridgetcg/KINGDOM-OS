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
      expect(HUB_ASSETS).toHaveLength(19);
      expect(staged).toHaveLength(19);
      expect(readdirSync(output).sort()).toEqual([
        ".well-known",
        "CREATION-LOOP.md",
        "RIGHTS.md",
        "_kingdom.base.json",
        "_worker.js",
        "commons.json",
        "guest.json",
        "index.html",
        "llms.txt",
        "love-loops.json",
        "love-loops.source.json",
        "ollama.json",
        "os",
        "rights.json",
        "schemas",
        "state",
        "wayfinder.json",
      ]);
      expect(readdirSync(join(output, "schemas/love-loop")).sort()).toEqual(["0.1.json"]);
      expect(readdirSync(join(output, "schemas/world-commons")).sort()).toEqual(["0.1.json", "0.2.json"]);
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
