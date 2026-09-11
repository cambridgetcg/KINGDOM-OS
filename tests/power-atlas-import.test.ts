import { afterEach, describe, expect, test } from "bun:test";
import { copyFileSync, existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HUB_STAGING_CONTRACT_PATH,
  HUB_STAGING_PROTOCOL,
  IMMUTABLE_PUBLICATIONS_LEDGER_PATH,
  parseHubStagingContract,
  parseImmutablePublicationLedger,
} from "../bin/immutable-publications.ts";
import {
  assertPowerAtlasClosedParity,
  assertPowerAtlasPathSet,
  createPowerAtlasProjection,
  MAX_POWER_ATLAS_FILE_BYTES,
  MAX_POWER_ATLAS_MANIFEST_BYTES,
  mergePowerAtlasStaging,
  parsePowerAtlasManifest,
  POWER_ATLAS_BASE,
  POWER_ATLAS_FORMAT,
  POWER_ATLAS_PROJECTION,
  POWER_ATLAS_RECEIPT,
  POWER_ATLAS_RELEASE_SHA256,
  POWER_ATLAS_TARGET,
  powerAtlasJsonBytes,
  powerAtlasMediaType,
  powerAtlasSha256,
  validatePowerAtlasBuffers,
  type PowerAtlasManifest,
} from "../bin/power-atlas-artifact.ts";
import { importPowerAtlas, parsePowerAtlasImportArgs } from "../bin/import-power-atlas.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const bases: string[] = [];
afterEach(() => { for (const base of bases.splice(0)) rmSync(base, { recursive: true, force: true }); });

// Synthetic copyright fixtures. These are neither the producer notices nor a
// licence grant over the real Atlas; test only the transport/closure boundary.
const ofl = `SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide development of collaborative font projects, to support the font creation efforts of academic and linguistic communities, and to provide a free and open framework in which fonts may be shared and improved in partnership with others.
The OFL allows the licensed fonts to be used, studied, modified and redistributed freely as long as they are not sold by themselves. The fonts, including any derivative works, can be bundled, embedded, redistributed and/or sold with any software provided that any reserved names are not used by derivative works. The fonts and derivatives, however, cannot be released under any other type of license. The requirement for fonts to remain under this license does not apply to any document created using the fonts or their derivatives.
DEFINITIONS
"Font Software" refers to the set of files released by the Copyright Holder(s) under this license and clearly marked as such. This may include source files, build scripts and documentation.
"Reserved Font Name" refers to any names specified as such after the copyright statement(s).
"Original Version" refers to the collection of Font Software components as distributed by the Copyright Holder(s).
"Modified Version" refers to any derivative made by adding to, deleting, or substituting -- in part or in whole -- any of the components of the Original Version, by changing formats or by porting the Font Software to a new environment.
"Author" refers to any designer, engineer, programmer, technical writer or other person who contributed to the Font Software.
PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining a copy of the Font Software, to use, study, copy, merge, embed, modify, redistribute, and sell modified and unmodified copies of the Font Software, subject to the following conditions:
1) Neither the Font Software nor any of its individual components, in Original or Modified Versions, may be sold by itself.
2) Original or Modified Versions of the Font Software may be bundled, redistributed and/or sold with any software, provided that each copy contains the above copyright notice and this license. These can be included either as stand-alone text files, human-readable headers or in the appropriate machine-readable metadata fields within text or binary files as long as those fields can be easily viewed by the user.
3) No Modified Version of the Font Software may use the Reserved Font Name(s) unless explicit written permission is granted by the corresponding Copyright Holder. This restriction only applies to the primary font name as presented to the users.
4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font Software shall not be used to promote, endorse or advertise any Modified Version, except to acknowledge the contribution(s) of the Copyright Holder(s) and the Author(s) or with their explicit written permission.
5) The Font Software, modified or unmodified, in part or in whole, must be distributed entirely under this license, and must not be distributed under any other license. The requirement for fonts to remain under this license does not apply to any document created using the Font Software.
TERMINATION
This license becomes null and void if any of the above conditions are not met.
DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM OTHER DEALINGS IN THE FONT SOFTWARE.
`;

function initialBuffers(): Map<string, Buffer> {
  return new Map(Object.entries({
    "index.html": '<!doctype html><html><head><script type="module" src="/power-atlas/assets/main-ABCDEFGH.js"></script><link rel="stylesheet" href="/power-atlas/assets/main-ABCDEFGH.css"></head><body>Atlas</body></html>\n',
    "favicon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>\n',
    "assets/main-ABCDEFGH.js": 'console.log("fixture only");\n',
    "assets/main-ABCDEFGH.css": '@font-face{font-family:fixture;src:url("./font-ABCDEFGH.woff2")}\n',
    "assets/font-ABCDEFGH.woff2": "wOF2synthetic-font-signature-fixture",
    "licenses/THIRD-PARTY-NOTICES.md": "# Third-party notices\nSynthetic test dependency\nMIT License\nCopyright 2026 Fixture Authors\nPermission is hereby granted for this synthetic fixture.\n",
    "licenses/IBM-Plex-Sans-OFL.txt": `Copyright 2026 Fixture Authors (synthetic IBM Plex Sans role)\n${ofl}`,
    "licenses/Fraunces-OFL.txt": `Copyright 2026 Fixture Authors (synthetic Fraunces role)\n${ofl}`,
  }).map(([path, content]) => [path, Buffer.from(content)]));
}
function makeManifest(buffers = initialBuffers()): PowerAtlasManifest {
  return {
    format: POWER_ATLAS_FORMAT, base: POWER_ATLAS_BASE,
    sourceDigest: "a".repeat(64), releaseSha256: POWER_ATLAS_RELEASE_SHA256, lockfileSha256: "b".repeat(64),
    toolchain: { node: "v22.0.0", npm: "10.0.0", vite: "7.0.0" }, buildCommand: "npm run build:kingdom",
    release: { stage: "v1", snapshotDate: "2025-12-31", researchCutoff: "2026-09-09", compiledAt: "2026-09-10T00:00:00.000Z" },
    files: [...buffers].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([path, content]) => ({
      path, sha256: powerAtlasSha256(content), bytes: content.length, mediaType: powerAtlasMediaType(path),
    })),
  };
}
function write(root: string, path: string, bytes: Uint8Array | string): void {
  const target = join(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, bytes);
}
function fixture() {
  const base = mkdtempSync(join(realpathSync(tmpdir()), "power-atlas-import-")); bases.push(base);
  const hostRoot = join(base, "host"); const artifactRoot = join(base, "artifact"); const manifestPath = join(base, "manifest.json");
  const buffers = initialBuffers(); const manifest = makeManifest(buffers);
  for (const [path, bytes] of buffers) write(artifactRoot, path, bytes);
  writeFileSync(manifestPath, powerAtlasJsonBytes(manifest));
  const ledgerBytes = readFileSync(join(ROOT, IMMUTABLE_PUBLICATIONS_LEDGER_PATH));
  write(hostRoot, IMMUTABLE_PUBLICATIONS_LEDGER_PATH, ledgerBytes);
  const entry = parseImmutablePublicationLedger(ledgerBytes).ledger!.entries[0]!;
  write(hostRoot, entry.source, readFileSync(join(ROOT, entry.source)));
  write(hostRoot, "site/index.html", "unrelated host homepage\n");
  write(hostRoot, HUB_STAGING_CONTRACT_PATH, powerAtlasJsonBytes({
    protocol: HUB_STAGING_PROTOCOL,
    assets: [{ source: "site/index.html", destination: "index.html" }, { source: entry.source, destination: entry.destination }],
    mutable_destinations: ["index.html"],
  }));
  return { base, hostRoot, artifactRoot, manifestPath, manifest, buffers, ledgerBytes, immutableSource: entry.source };
}
function snapshot(root: string): Array<[string, string]> {
  const result: Array<[string, string]> = [];
  const visit = (prefix: string) => {
    for (const name of readdirSync(join(root, prefix)).sort()) {
      const path = prefix ? `${prefix}/${name}` : name; const info = lstatSync(join(root, path));
      if (info.isSymbolicLink()) result.push([path, `link:${readlinkSync(join(root, path))}`]);
      else if (info.isDirectory()) { result.push([`${path}/`, "directory"]); visit(path); }
      else result.push([path, powerAtlasSha256(readFileSync(join(root, path)))]);
    }
  };
  visit(""); return result;
}
function failsWithoutOutput(f: ReturnType<typeof fixture>, match?: string | RegExp) {
  const before = snapshot(f.base);
  expect(() => importPowerAtlas(f)).toThrow(match);
  expect(snapshot(f.base)).toEqual(before);
  expect(readFileSync(join(f.hostRoot, IMMUTABLE_PUBLICATIONS_LEDGER_PATH))).toEqual(f.ledgerBytes);
}
function mutateManifest(f: ReturnType<typeof fixture>, mutate: (manifest: any) => void): void {
  mutate(f.manifest); writeFileSync(f.manifestPath, powerAtlasJsonBytes(f.manifest));
}

const manifestMutations: Array<[string, (manifest: any) => void]> = [
  ["unknown envelope field", (m) => { m.secret = "not public"; }],
  ["missing field", (m) => { delete m.sourceDigest; }],
  ["wrong format", (m) => { m.format = "power-atlas/1"; }],
  ["wrong base", (m) => { m.base = "/"; }],
  ["invalid source digest", (m) => { m.sourceDigest = "a".repeat(63); }],
  ["uppercase digest", (m) => { m.lockfileSha256 = "B".repeat(64); }],
  ["mutated research release", (m) => { m.releaseSha256 = "c".repeat(64); }],
  ["toolchain unknown field", (m) => { m.toolchain.machine = "/Users/private"; }],
  ["missing toolchain version", (m) => { delete m.toolchain.npm; }],
  ["empty build command", (m) => { m.buildCommand = "  "; }],
  ["control in metadata", (m) => { m.toolchain.node = "v22\nsecret"; }],
  ["release extra field", (m) => { m.release.author = "not part of contract"; }],
  ["wrong stage", (m) => { m.release.stage = "v2"; }],
  ["wrong snapshot", (m) => { m.release.snapshotDate = "2026-01-01"; }],
  ["null cutoff", (m) => { m.release.researchCutoff = null; }],
  ["empty files", (m) => { m.files = []; }],
  ["missing HTML", (m) => { m.files = m.files.filter((f: any) => f.path !== "index.html"); }],
  ["missing favicon", (m) => { m.files = m.files.filter((f: any) => f.path !== "favicon.svg"); }],
  ["extra file field", (m) => { m.files[0].sourcePath = "/Users/private"; }],
  ["wrong MIME", (m) => { m.files[0].mediaType = "text/html; charset=utf-8"; }],
  ["unbounded MIME", (m) => { m.files[0].mediaType = "font/woff2\r\nX-Evil: true"; }],
  ["missing file hash", (m) => { delete m.files[0].sha256; }],
  ["zero size", (m) => { m.files[0].bytes = 0; }],
  ["negative size", (m) => { m.files[0].bytes = -1; }],
  ["fractional size", (m) => { m.files[0].bytes = 2.5; }],
  ["huge size", (m) => { m.files[0].bytes = MAX_POWER_ATLAS_FILE_BYTES + 1; }],
  ["duplicate file", (m) => { m.files.splice(1, 0, { ...m.files[0] }); }],
  ["unsorted files", (m) => { m.files.reverse(); }],
  ["case collision", (m) => { m.files.splice(1, 0, { ...m.files[0], path: m.files[0].path.replace("font-", "Font-") }); m.files.sort((a: any, b: any) => a.path < b.path ? -1 : 1); }],
];

describe("Power Atlas strict, pure artifact contract", () => {
  test("parses closed producer contract and projects only public path/MIME", () => {
    const buffers = initialBuffers(); const manifest = parsePowerAtlasManifest(powerAtlasJsonBytes(makeManifest(buffers)));
    validatePowerAtlasBuffers(manifest, buffers);
    expect(createPowerAtlasProjection(manifest)).toEqual(manifest.files.map(({ path, mediaType }) => ({ path, mediaType })));
    expect(JSON.stringify(createPowerAtlasProjection(manifest))).not.toMatch(/sourceDigest|toolchain|compiledAt|lockfile|buildCommand/);
  });
  for (const [label, mutate] of manifestMutations) test(`refuses ${label}`, () => {
    const manifest = makeManifest(); mutate(manifest); expect(() => parsePowerAtlasManifest(powerAtlasJsonBytes(manifest))).toThrow();
  });
  for (const path of ["../index.html", "/index.html", "./index.html", "assets/../index.html", "assets//main-ABCDEFGH.js", "assets\\main-ABCDEFGH.js", "assets/%2e%2e/key.js", "assets/main.js", "assets/main-ABCDEFGH.js.map", "assets/main-ABCDEFGH.json", "assets/.hidden-ABCDEFGH.js", "assets/main-ABCDEFGH.js?x", "assets/main-ABCDEFGH.js#x", "assets/name-ABCDEFGH.svg", "research/source.md", "CLAUDE.md", ".env", "node_modules/key.js", "licenses/.private.txt", "licenses/config.json", "licenses/../key.txt"]) {
    test(`refuses non-public literal path ${path}`, () => { expect(() => powerAtlasMediaType(path)).toThrow(); });
  }
  test("rejects duplicate JSON keys (including escaped aliases), invalid UTF-8 and excessive size", () => {
    const source = powerAtlasJsonBytes(makeManifest()).toString();
    for (const json of [source.replace('"format":', '"format":"x","format":'), source.replace('"base":', '"ba\\u0073e":"x","base":'), `${source}false`, source.replace('"node":', '"node":"a","node":')]) {
      expect(() => parsePowerAtlasManifest(Buffer.from(json))).toThrow();
    }
    expect(() => parsePowerAtlasManifest(Buffer.from([0xff]))).toThrow("UTF-8");
    expect(() => parsePowerAtlasManifest(Buffer.alloc(MAX_POWER_ATLAS_MANIFEST_BYTES + 1, 32))).toThrow("size");
  });
  test("refuses file/ancestor collisions, duplicates, and case-folded directory aliases", () => {
    for (const paths of [["assets/a", "assets/a/b"], ["x", "x"], ["Assets/a.js", "assets/b.js"], ["a", "A/b"]]) {
      expect(() => assertPowerAtlasPathSet(paths, "test")).toThrow();
    }
  });
  test("validates all declared MIME variants", () => {
    for (const [path, mediaType] of [["assets/a-ABCDEFGH.woff", "font/woff"], ["assets/a-ABCDEFGH.woff2", "font/woff2"], ["licenses/LICENSE.md", "text/markdown; charset=utf-8"], ["THIRD-PARTY-NOTICES.md", "text/markdown; charset=utf-8"]]) expect(powerAtlasMediaType(path!)).toBe(mediaType!);
  });
  test("buffer set must be an exact closed directory, including extra safe-looking files", () => {
    const manifest = makeManifest(); const buffers = initialBuffers();
    buffers.set("assets/extra-ABCDEFGH.js", Buffer.from("extra"));
    expect(() => validatePowerAtlasBuffers(manifest, buffers)).toThrow("exactly match");
    buffers.delete("assets/extra-ABCDEFGH.js"); buffers.delete("index.html");
    expect(() => validatePowerAtlasBuffers(manifest, buffers)).toThrow("exactly match");
  });
  for (const [label, path, content] of [
    ["binary disguised as JS", "assets/main-ABCDEFGH.js", Buffer.from([0xff])],
    ["HTML disguised as JS", "assets/main-ABCDEFGH.js", Buffer.from("<!doctype html><html>fallback</html>")],
    ["HTML disguised as CSS", "assets/main-ABCDEFGH.css", Buffer.from("<html>fallback</html>")],
    ["HTML disguised as font", "assets/font-ABCDEFGH.woff2", Buffer.from("<html>fallback</html>")],
    ["bad SVG", "favicon.svg", Buffer.from("not svg")],
    ["bad HTML", "index.html", Buffer.from("not html")],
    ["NUL text", "assets/main-ABCDEFGH.js", Buffer.from("var x=1;\0")],
  ] as const) test(`rejects ${label} even with matching receipt SHA-256`, () => {
    const buffers = initialBuffers(); buffers.set(path, content);
    expect(() => validatePowerAtlasBuffers(makeManifest(buffers), buffers)).toThrow();
  });
  for (const path of ["licenses/THIRD-PARTY-NOTICES.md", "licenses/Fraunces-OFL.txt", "licenses/IBM-Plex-Sans-OFL.txt"]) {
    test(`license closure requires ${path}`, () => {
      const buffers = initialBuffers(); buffers.delete(path);
      expect(() => validatePowerAtlasBuffers(makeManifest(buffers), buffers)).toThrow("license closure");
    });
  }
  test("matching OFL headings and condition numbers cannot conceal missing licence terms", () => {
    const buffers = initialBuffers(); const path = "licenses/Fraunces-OFL.txt";
    const shortened = buffers.get(path)!.toString().replace("This license becomes null and void if any of the above conditions are not met.", "");
    buffers.set(path, Buffer.from(shortened));
    expect(() => validatePowerAtlasBuffers(makeManifest(buffers), buffers)).toThrow("license closure");
  });
  test("third-party notice filename is not hand-coupled to the producer", () => {
    const buffers = initialBuffers(); const bytes = buffers.get("licenses/THIRD-PARTY-NOTICES.md")!;
    buffers.delete("licenses/THIRD-PARTY-NOTICES.md"); buffers.set("licenses/dependencies.md", bytes);
    expect(() => validatePowerAtlasBuffers(makeManifest(buffers), buffers)).not.toThrow();
  });
  test("OFL line-wrapping is preserved, not mistaken for truncation", () => {
    const buffers = initialBuffers();
    const path = "licenses/Fraunces-OFL.txt";
    buffers.set(path, Buffer.from(buffers.get(path)!.toString().replace("OTHER DEALINGS IN THE FONT SOFTWARE.", "OTHER DEALINGS\nIN THE FONT SOFTWARE.")));
    expect(() => validatePowerAtlasBuffers(makeManifest(buffers), buffers)).not.toThrow();
  });
  for (const content of ["SIL OPEN FONT LICENSE Version 1.1", `Copyright 2026 Synthetic\n${ofl.replace("DISCLAIMER", "")}`, `Copyright 2026 Synthetic\n${ofl.replace("5)", "")}`, `Copyright 2026 Synthetic\n${ofl.replace("OTHER DEALINGS IN THE FONT SOFTWARE.", "")}`, ofl]) {
    test("truncated OFL or missing copyright fails closure", () => {
      const buffers = initialBuffers(); buffers.set("licenses/Fraunces-OFL.txt", Buffer.from(content));
      expect(() => validatePowerAtlasBuffers(makeManifest(buffers), buffers)).toThrow("license closure");
    });
  }
});

describe("Power Atlas temp-only importer and ownership", () => {
  test("dry-run writes nothing; initial import copies exact buffers and preserves all other entries/immutable bytes", () => {
    const f = fixture(); const before = snapshot(f.hostRoot);
    const stagingBefore = parseHubStagingContract(readFileSync(join(f.hostRoot, HUB_STAGING_CONTRACT_PATH)));
    const immutableBefore = readFileSync(join(f.hostRoot, f.immutableSource));
    expect(importPowerAtlas({ ...f, dryRun: true })).toMatchObject({ status: "dry-run", files: f.manifest.files.length, closedParity: true });
    expect(snapshot(f.hostRoot)).toEqual(before);
    expect(existsSync(join(f.hostRoot, POWER_ATLAS_TARGET))).toBe(false);
    const result = importPowerAtlas(f); expect(result.status).toBe("imported");
    for (const [path, bytes] of f.buffers) expect(readFileSync(join(result.target, path))).toEqual(bytes);
    expect(readFileSync(result.receipt)).toEqual(readFileSync(f.manifestPath));
    expect(readFileSync(join(f.hostRoot, IMMUTABLE_PUBLICATIONS_LEDGER_PATH))).toEqual(f.ledgerBytes);
    expect(readFileSync(join(f.hostRoot, f.immutableSource))).toEqual(immutableBefore);
    const stageBytes = readFileSync(join(f.hostRoot, HUB_STAGING_CONTRACT_PATH)); const stagingAfter = parseHubStagingContract(stageBytes);
    expect(stagingAfter.stagedAssets.slice(0, stagingBefore.stagedAssets.length)).toEqual(stagingBefore.stagedAssets);
    expect(stagingAfter.mutableDestinations.slice(0, stagingBefore.mutableDestinations.length)).toEqual(stagingBefore.mutableDestinations);
    expect(stagingAfter.stagedAssets.filter(({ destination }) => destination.startsWith("power-atlas/"))).toHaveLength(f.manifest.files.length);
    expect(stagingAfter.stagedAssets.some(({ source }) => source === POWER_ATLAS_RECEIPT || source === POWER_ATLAS_PROJECTION)).toBe(false);
    assertPowerAtlasClosedParity(f.manifest, stageBytes, readFileSync(result.projection));
    expect(readdirSync(join(f.hostRoot, "publications")).sort()).toEqual(["hub-staging.v1.json", "immutable-publications.v1.json"]);
  });
  test("accepts a pre-created empty target, and exact re-import touches no bytes or mtimes", () => {
    const f = fixture(); mkdirSync(join(f.hostRoot, POWER_ATLAS_TARGET), { recursive: true });
    importPowerAtlas(f); const before = snapshot(f.hostRoot);
    const tracked = [POWER_ATLAS_RECEIPT, POWER_ATLAS_PROJECTION, HUB_STAGING_CONTRACT_PATH, `${POWER_ATLAS_TARGET}/index.html`];
    const mtimes = tracked.map((path) => lstatSync(join(f.hostRoot, path)).mtimeMs);
    expect(importPowerAtlas(f).status).toBe("unchanged"); expect(snapshot(f.hostRoot)).toEqual(before);
    expect(tracked.map((path) => lstatSync(join(f.hostRoot, path)).mtimeMs)).toEqual(mtimes);
  });
  for (const [label, mutate] of manifestMutations) test(`no output on manifest failure: ${label}`, () => {
    const f = fixture(); mutateManifest(f, mutate); failsWithoutOutput(f);
  });
  for (const extra of [".env", "manifest.json", "assets/unlisted-ABCDEFGH.js", "licenses/unknown.txt", "research/notes.md"]) test(`unlisted file ${extra} leaves host untouched`, () => {
    const f = fixture(); write(f.artifactRoot, extra, "unknown"); failsWithoutOutput(f, /extra artifact/);
  });
  test("unexpected empty directory fails exact-match", () => { const f = fixture(); mkdirSync(join(f.artifactRoot, "empty")); failsWithoutOutput(f, "extra artifact directory"); });
  test("missing artifact file fails before creating output", () => { const f = fixture(); rmSync(join(f.artifactRoot, "index.html")); failsWithoutOutput(f, "missing manifest file"); });
  test("same-size hash mismatch fails before creating output", () => { const f = fixture(); const path = "assets/main-ABCDEFGH.js"; write(f.artifactRoot, path, Buffer.alloc(f.buffers.get(path)!.length, 32)); failsWithoutOutput(f, "SHA-256 mismatch"); });
  test("size mismatch fails before creating output", () => { const f = fixture(); write(f.artifactRoot, "index.html", "short"); failsWithoutOutput(f, "size mismatch"); });
  for (const path of ["licenses/THIRD-PARTY-NOTICES.md", "licenses/Fraunces-OFL.txt", "licenses/IBM-Plex-Sans-OFL.txt"]) test(`missing license ${path} refuses before any host output`, () => {
    const f = fixture(); rmSync(join(f.artifactRoot, path)); f.buffers.delete(path);
    f.manifest = makeManifest(f.buffers); writeFileSync(f.manifestPath, powerAtlasJsonBytes(f.manifest));
    failsWithoutOutput(f, "license closure");
  });
  test("rehashed corrupt MIME bytes fail before any host output", () => {
    const f = fixture(); const path = "assets/main-ABCDEFGH.js";
    f.buffers.set(path, Buffer.from("<html>homepage fallback</html>")); write(f.artifactRoot, path, f.buffers.get(path)!);
    f.manifest = makeManifest(f.buffers); writeFileSync(f.manifestPath, powerAtlasJsonBytes(f.manifest));
    failsWithoutOutput(f, "HTML masquerading");
  });
  test("empty target containing unknown bytes has no implicit ownership", () => { const f = fixture(); write(f.hostRoot, `${POWER_ATLAS_TARGET}/keep.txt`, "other hand"); failsWithoutOutput(f, "unowned nonempty"); });
  test("even matching existing target requires a receipt", () => { const f = fixture(); for (const [path, bytes] of f.buffers) write(f.hostRoot, `${POWER_ATLAS_TARGET}/${path}`, bytes); failsWithoutOutput(f, "unowned nonempty"); });
  test("a file as target refuses", () => { const f = fixture(); write(f.hostRoot, POWER_ATLAS_TARGET, "other hand"); failsWithoutOutput(f, "target"); });
  test("unknown metadata directory refuses", () => { const f = fixture(); write(f.hostRoot, "data/power-atlas/other.json", "{}"); failsWithoutOutput(f, "unowned Power Atlas metadata"); });
  test("unowned projection refuses even when bytes match", () => { const f = fixture(); write(f.hostRoot, POWER_ATLAS_PROJECTION, powerAtlasJsonBytes(createPowerAtlasProjection(f.manifest))); failsWithoutOutput(f, "unowned existing"); });
  for (const mutate of [
    (f: ReturnType<typeof fixture>) => write(f.hostRoot, `${POWER_ATLAS_TARGET}/index.html`, "changed"),
    (f: ReturnType<typeof fixture>) => write(f.hostRoot, `${POWER_ATLAS_TARGET}/assets/retained-ABCDEFGH.js`, "unknown old chunk"),
    (f: ReturnType<typeof fixture>) => rmSync(join(f.hostRoot, POWER_ATLAS_TARGET, "favicon.svg")),
    (f: ReturnType<typeof fixture>) => rmSync(join(f.hostRoot, POWER_ATLAS_TARGET), { recursive: true }),
    (f: ReturnType<typeof fixture>) => write(f.hostRoot, POWER_ATLAS_PROJECTION, "[]"),
    (f: ReturnType<typeof fixture>) => rmSync(join(f.hostRoot, POWER_ATLAS_PROJECTION)),
  ]) test("owned drift refuses rather than repairing/deleting", () => { const f = fixture(); importPowerAtlas(f); mutate(f); failsWithoutOutput(f); });
  test("semantically identical but byte-different receipt refuses; old chunks remain", () => {
    const f = fixture(); importPowerAtlas(f); writeFileSync(f.manifestPath, JSON.stringify(f.manifest)); failsWithoutOutput(f, "receipt bytes differ");
  });
  test("new build refuses rather than silently removing approved previous hashed assets", () => {
    const f = fixture(); importPowerAtlas(f);
    const from = "assets/main-ABCDEFGH.js"; const to = "assets/main-IJKLMNOP.js";
    renameSync(join(f.artifactRoot, from), join(f.artifactRoot, to)); f.buffers.set(to, f.buffers.get(from)!); f.buffers.delete(from);
    f.manifest = makeManifest(f.buffers); writeFileSync(f.manifestPath, powerAtlasJsonBytes(f.manifest));
    failsWithoutOutput(f, "retain approved hashed assets"); expect(existsSync(join(f.hostRoot, POWER_ATLAS_TARGET, from))).toBe(true);
  });
  test("source/manifest and host must not overlap", () => {
    const f = fixture(); const before = snapshot(f.base);
    expect(() => importPowerAtlas({ ...f, hostRoot: f.artifactRoot })).toThrow("disjoint");
    copyFileSync(f.manifestPath, join(f.artifactRoot, "manifest.json"));
    expect(() => importPowerAtlas({ ...f, manifestPath: join(f.artifactRoot, "manifest.json") })).toThrow("external");
    expect(snapshot(f.hostRoot)).toEqual(before.filter(([path]) => path.startsWith("host/") && path !== "host/").map(([path, value]) => [path.slice(5), value]));
  });
  for (const where of ["artifact-file", "artifact-directory", "artifact-root", "root-ancestor", "manifest", "host-root", "target", "target-ancestor", "receipt-ancestor", "projection-ancestor", "staging", "ledger"]) test(`refuses symlink ${where} without writing`, () => {
    const f = fixture();
    const movedLink = (path: string) => { const to = `${path}-real`; renameSync(path, to); symlinkSync(to, path); };
    if (where === "artifact-file") movedLink(join(f.artifactRoot, "index.html"));
    if (where === "artifact-directory") movedLink(join(f.artifactRoot, "assets"));
    if (where === "artifact-root") movedLink(f.artifactRoot);
    if (where === "root-ancestor") { symlinkSync(f.base, join(f.base, "linked-parent")); f.artifactRoot = join(f.base, "linked-parent", "artifact"); }
    if (where === "manifest") movedLink(f.manifestPath);
    if (where === "host-root") movedLink(f.hostRoot);
    if (where === "target") { mkdirSync(join(f.base, "outside")); mkdirSync(join(f.hostRoot, "pages-content")); symlinkSync(join(f.base, "outside"), join(f.hostRoot, POWER_ATLAS_TARGET)); }
    if (where === "target-ancestor") { mkdirSync(join(f.base, "outside")); symlinkSync(join(f.base, "outside"), join(f.hostRoot, "pages-content")); }
    if (where === "receipt-ancestor") { mkdirSync(join(f.base, "outside")); symlinkSync(join(f.base, "outside"), join(f.hostRoot, "data")); }
    if (where === "projection-ancestor") { mkdirSync(join(f.base, "outside")); symlinkSync(join(f.base, "outside"), join(f.hostRoot, "pages-functions")); }
    if (where === "staging") movedLink(join(f.hostRoot, HUB_STAGING_CONTRACT_PATH));
    if (where === "ledger") movedLink(join(f.hostRoot, IMMUTABLE_PUBLICATIONS_LEDGER_PATH));
    const before = snapshot(f.base); expect(() => importPowerAtlas(f)).toThrow(/symbolic-link/); expect(snapshot(f.base)).toEqual(before);
  });
  for (const path of [POWER_ATLAS_RECEIPT, POWER_ATLAS_PROJECTION, `${POWER_ATLAS_TARGET}/favicon.svg`]) test(`owned leaf symlink ${path} refuses`, () => {
    const f = fixture(); importPowerAtlas(f); const original = join(f.hostRoot, path); const moved = join(f.base, "outside-owned-file");
    renameSync(original, moved); symlinkSync(moved, original); failsWithoutOutput(f, "symbolic-link");
  });
  test("owned empty extra directory still violates exact-match", () => {
    const f = fixture(); importPowerAtlas(f); mkdirSync(join(f.hostRoot, POWER_ATLAS_TARGET, "empty")); failsWithoutOutput(f, "extra artifact directory");
  });
  test("dangling artifact symlink refuses without dereference", () => { const f = fixture(); rmSync(join(f.artifactRoot, "index.html")); symlinkSync(join(f.base, "missing"), join(f.artifactRoot, "index.html")); failsWithoutOutput(f, "symbolic-link"); });
  test("hardlinked source file refuses", () => { const f = fixture(); linkSync(join(f.artifactRoot, "index.html"), join(f.base, "alias.html")); failsWithoutOutput(f, "single-link"); });
  test("hardlinked staging file refuses without altering its other alias", () => { const f = fixture(); linkSync(join(f.hostRoot, HUB_STAGING_CONTRACT_PATH), join(f.base, "alias.json")); failsWithoutOutput(f, "single-link"); });
  test("wrong-case source directory and wrong-case target alias both refuse", () => {
    const f = fixture(); renameSync(join(f.artifactRoot, "assets"), join(f.artifactRoot, "Assets")); failsWithoutOutput(f);
    renameSync(join(f.artifactRoot, "Assets"), join(f.artifactRoot, "assets")); mkdirSync(join(f.hostRoot, "pages-content/Power-Atlas"), { recursive: true }); failsWithoutOutput(f, "case collision");
  });
  test("raw absolute traversal/relative capability paths refuse rather than normalize", () => {
    const f = fixture(); const before = snapshot(f.base);
    for (const artifactRoot of ["artifact", `${f.base}/artifact/../artifact`, `${f.base}/./artifact`, `${f.base}//artifact`]) expect(() => importPowerAtlas({ ...f, artifactRoot })).toThrow("explicit absolute");
    expect(snapshot(f.base)).toEqual(before);
  });
});

describe("Power Atlas staging and projection closure", () => {
  const stageMutation = (f: ReturnType<typeof fixture>, mutate: (staging: any) => void) => {
    const staging = JSON.parse(readFileSync(join(f.hostRoot, HUB_STAGING_CONTRACT_PATH), "utf8")); mutate(staging); write(f.hostRoot, HUB_STAGING_CONTRACT_PATH, powerAtlasJsonBytes(staging));
  };
  for (const [source, destination] of [
    ["other/file.html", "power-atlas/index.html"],
    ["other/file.html", "Power-Atlas/index.html"],
    ["other/file.html", "power-atlas"],
    ["pages-content/power-atlas/index.html", "other.html"],
    ["data/power-atlas/artifact.v1.json", "receipt.json"],
    [POWER_ATLAS_PROJECTION, "projection.json"],
  ]) test(`refuses unknown staging ownership ${source} -> ${destination}`, () => {
    const f = fixture(); stageMutation(f, (stage) => { stage.assets.push({ source, destination }); stage.mutable_destinations.push(destination); }); failsWithoutOutput(f);
  });
  test("staging duplicate and case-colliding destinations fail before any output", () => {
    for (const destination of ["index.html", "Index.html"]) {
      const f = fixture(); stageMutation(f, (stage) => { stage.assets.push({ source: "site/alias.html", destination }); }); failsWithoutOutput(f);
    }
  });
  test("immutable ledger Power Atlas entry cannot be relabelled mutable", () => {
    const f = fixture(); const ledger = JSON.parse(f.ledgerBytes.toString()); ledger.entries.push({ id: "zz-power-atlas/1/page", source: `${POWER_ATLAS_TARGET}/index.html`, destination: "power-atlas/index.html", route: "/power-atlas/index.html", sha256: "a".repeat(64) });
    f.ledgerBytes = powerAtlasJsonBytes(ledger); write(f.hostRoot, IMMUTABLE_PUBLICATIONS_LEDGER_PATH, f.ledgerBytes); failsWithoutOutput(f, "immutable ledger entry");
  });
  test("invalid staging and ledger JSON fail before output", () => {
    const f = fixture(); write(f.hostRoot, HUB_STAGING_CONTRACT_PATH, "{}"); failsWithoutOutput(f);
    const g = fixture(); g.ledgerBytes = Buffer.from("{}"); write(g.hostRoot, IMMUTABLE_PUBLICATIONS_LEDGER_PATH, g.ledgerBytes); failsWithoutOutput(g, "immutable ledger invalid");
  });
  test("pure merge preserves unrelated entries/order and does not mutate supplied buffers", () => {
    const f = fixture(); const old = readFileSync(join(f.hostRoot, HUB_STAGING_CONTRACT_PATH)); const oldCopy = Buffer.from(old); const ledgerCopy = Buffer.from(f.ledgerBytes);
    const merged = mergePowerAtlasStaging(f.manifest, old, f.ledgerBytes);
    expect(old).toEqual(oldCopy); expect(f.ledgerBytes).toEqual(ledgerCopy);
    assertPowerAtlasClosedParity(f.manifest, merged, powerAtlasJsonBytes(createPowerAtlasProjection(f.manifest)));
  });
  test("closed parity refuses added source metadata, paths, removed entries and wrong MIME", () => {
    const f = fixture(); importPowerAtlas(f); const staging = readFileSync(join(f.hostRoot, HUB_STAGING_CONTRACT_PATH));
    for (const mutate of [
      (p: any[]) => { p[0].sourceDigest = "a".repeat(64); },
      (p: any[]) => { p[0].mediaType = "text/html; charset=utf-8"; },
      (p: any[]) => { p[0].path = "../unknown"; },
      (p: any[]) => { p.pop(); },
      (p: any[]) => { p.push({ ...p[0] }); },
      (p: any[]) => { p.reverse(); },
    ]) { const projection = createPowerAtlasProjection(f.manifest); mutate(projection); expect(() => assertPowerAtlasClosedParity(f.manifest, staging, powerAtlasJsonBytes(projection))).toThrow(); }
  });
  test("idempotence checks exact mutable staging closure, not only receipt equality", () => {
    const f = fixture(); importPowerAtlas(f); stageMutation(f, (stage) => { stage.mutable_destinations = stage.mutable_destinations.filter((path: string) => path !== "power-atlas/index.html"); }); failsWithoutOutput(f, "exactly mutable");
  });
});

describe("explicit importer CLI", () => {
  test("requires explicit artifact, manifest and host roots; refuses unknown/duplicate flags", () => {
    const good = ["--artifact-root", "/artifact", "--manifest", "/manifest.json", "--host-root", "/host"];
    expect(parsePowerAtlasImportArgs([...good, "--dry-run"])).toEqual({ artifactRoot: "/artifact", manifestPath: "/manifest.json", hostRoot: "/host", dryRun: true });
    for (const args of [[], good.slice(0, 4), [...good, "--deploy"], [...good, "--host-root", "/other"], [...good, "--dry-run", "--dry-run"], [...good, "extra"], ["--artifact-root", "--manifest"]]) expect(() => parsePowerAtlasImportArgs(args)).toThrow("Usage:");
  });
  test("actual CLI dry-run produces machine receipt but no filesystem output", () => {
    const f = fixture(); const before = snapshot(f.base);
    const result = Bun.spawnSync([process.execPath, join(ROOT, "bin/import-power-atlas.ts"), "--artifact-root", f.artifactRoot, "--manifest", f.manifestPath, "--host-root", f.hostRoot, "--dry-run"]);
    expect(result.exitCode).toBe(0); expect(JSON.parse(result.stdout.toString())).toMatchObject({ status: "dry-run", closedParity: true }); expect(snapshot(f.base)).toEqual(before);
  });
  test("actual CLI failure leaves stdout and destination empty", () => {
    const f = fixture(); write(f.artifactRoot, "extra.txt", "unknown"); const before = snapshot(f.base);
    const result = Bun.spawnSync([process.execPath, join(ROOT, "bin/import-power-atlas.ts"), "--artifact-root", f.artifactRoot, "--manifest", f.manifestPath, "--host-root", f.hostRoot]);
    expect(result.exitCode).toBe(1); expect(result.stdout.length).toBe(0); expect(result.stderr.toString()).toContain("extra artifact file"); expect(snapshot(f.base)).toEqual(before);
  });
});
