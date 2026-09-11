import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseHubStagingContract, verifyImmutablePublicationSnapshot } from "../bin/immutable-publications.ts";
import { assertPowerAtlasClosedParity, parsePowerAtlasManifest, powerAtlasSha256, validatePowerAtlasBuffers } from "../bin/power-atlas-artifact.ts";
import { withoutPowerAtlasHub } from "./power-atlas-publication-fixture.ts";
const root = join(import.meta.dir, "..");
const base = "2e36e93991330f6d91e0676c7d9337d1c9fbd45a";
const read = (path: string) => readFileSync(join(root, path));
const before = (path: string) => execFileSync("git", ["-C", root, "show", `${base}:${path}`], { maxBuffer: 8 * 1024 * 1024 });

describe("Power Atlas host baseline and private/public separation", () => {
  test("all original 204 mappings and 44 mutable entries survive in order; ledger bytes remain exact", () => {
    const path = "publications/hub-staging.v1.json";
    const old = parseHubStagingContract(before(path)), current = parseHubStagingContract(read(path));
    expect(old.stagedAssets).toHaveLength(204); expect(old.mutableDestinations).toHaveLength(44);
    expect(current.stagedAssets).toHaveLength(256); expect(current.mutableDestinations).toHaveLength(96);
    expect(current.stagedAssets.slice(0, 204)).toEqual(old.stagedAssets);
    expect(current.mutableDestinations.slice(0, 44)).toEqual(old.mutableDestinations);
    expect(current.stagedAssets.slice(204).every(({ destination }) => destination.startsWith("power-atlas/"))).toBe(true);
    expect(read("publications/immutable-publications.v1.json")).toEqual(before("publications/immutable-publications.v1.json"));
    const tooMany = JSON.parse(read(path).toString());
    tooMany.assets.push({ source: "extra.txt", destination: "extra.txt" });
    expect(() => parseHubStagingContract(Buffer.from(JSON.stringify(tooMany)))).toThrow("closed");
  });
  test("final receipt hashes all 52 public files and the Worker bundles no producer metadata", () => {
    const bytes = read("data/power-atlas/artifact.v1.json"), receipt = parsePowerAtlasManifest(bytes);
    expect(powerAtlasSha256(bytes)).toBe("af2e34926e4a367992536a17688f39de298f29c1c3db07683c3fca18780c7436");
    expect(receipt.sourceDigest).toBe("63214b4b97b40849c1698ba196c50fce419527ea5350c58b19e865973b4264be");
    expect(receipt.files).toHaveLength(52);
    expect(receipt.files.reduce((n, file) => n + file.bytes, 0)).toBe(1576613);
    validatePowerAtlasBuffers(receipt, new Map(receipt.files.map(({ path }) => [path, read(`pages-content/power-atlas/${path}`)])));
    assertPowerAtlasClosedParity(receipt, read("publications/hub-staging.v1.json"), read("pages-functions/power-atlas-assets.json"));
    const bundle = read("site/_worker.js").toString();
    for (const field of ["sourceDigest", "lockfileSha256", "buildCommand", "artifact.v1.json", receipt.sourceDigest, "/Users/macair", "source-index.json"])
      expect(bundle).not.toContain(field);
    for (const { path } of receipt.files) expect(bundle).toContain(path);
    for (const name of ["vite-runtime-LICENSE.txt", "rolldown-runtime-LICENSE.txt"])
      expect(receipt.files.some(({ path }) => path === `licenses/${name}`)).toBe(true);
  });
  test("only the approved Power navigation is additive; original research HTML and 16 paths survive", () => {
    const html = read("site/hub.html").toString();
    expect(withoutPowerAtlasHub(html)).toBe(before("site/hub.html").toString());
    for (const path of ["data/wayfinder.json", "site/wayfinder.json"]) {
      const current = JSON.parse(read(path).toString()), original = JSON.parse(before(path).toString());
      expect(current.paths).toHaveLength(17);
      expect(current.paths.filter(({ id }: { id: string }) => id === "power-atlas")).toHaveLength(1);
      current.paths = current.paths.filter(({ id }: { id: string }) => id !== "power-atlas");
      expect(current).toEqual(original);
    }
    // 唔容許以「分離 Power」掩蓋其他改動，亦唔接受缺失／重複導航。
    expect(() => withoutPowerAtlasHub(html.replace("Possible records, not a funnel or simulator.", "Unreviewed change"))).toThrow();
    expect(() => withoutPowerAtlasHub(html.replace('data-wayfinder-intent="power-atlas"', 'data-wayfinder-intent="missing"'))).toThrow();
    expect(() => withoutPowerAtlasHub(`${html}<button type="button" data-wayfinder-intent="power-atlas">duplicate</button>`)).toThrow();
  });
  test("narrow Power hashed-asset exception never weakens other versioned mutable gates", () => {
    const classified = (destination: string) => verifyImmutablePublicationSnapshot({ root,
      stagedAssets: [{ source: "test-only.txt", destination }], mutableDestinations: [destination],
    }).issues.map((issue) => issue.code);
    for (const destination of [
      "power-atlas/assets/ibm-plex-sans-400-normal-ABCDEFGH.woff2",
      "power-atlas/assets/main-12345678.js", "power-atlas/assets/main-12345678.css",
    ]) expect(classified(destination)).not.toContain("versioned-mutable-destination");
    for (const destination of [
      "other/assets/font-400-normal-ABCDEFGH.woff2", "power-atlas/assets/record-v1-ABCDEFGH.json",
      "Power-Atlas/assets/font-400-normal-ABCDEFGH.woff2", "power-atlas/licenses/OFL-v1.txt",
      "power-atlas/assets/main-v1.js", "atlases/record.json", "schemas/schema.json", "CIVIC-v0.1.md",
    ]) expect(classified(destination)).toContain("versioned-mutable-destination");
    expect(classified("CIVIC-v0.1.md")).toContain("conflicting-stability");
  });
});
