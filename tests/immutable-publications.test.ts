import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import {
  compareImmutablePublicationLedgers,
  HUB_STAGING_CONTRACT_PATH,
  HUB_STAGING_PROTOCOL,
  IMMUTABLE_PUBLICATIONS_BOOTSTRAP_ENTRIES_SHA256,
  IMMUTABLE_PUBLICATIONS_BOOTSTRAP_ANCHORS,
  IMMUTABLE_PUBLICATIONS_BOOTSTRAP_IDS,
  IMMUTABLE_PUBLICATIONS_LEDGER_PATH,
  type ImmutablePublicationLedger,
  parseImmutablePublicationLedger,
  parseHubStagingContract,
  verifyImmutablePublicationsAgainstBase,
  verifyImmutablePublicationHistory,
  verifyImmutablePublicationSnapshot,
} from "../bin/immutable-publications.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = "67fe98efc875a5ed13fb1c23d6e2aab5debe9ccb";
const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));

function currentLedger(): ImmutablePublicationLedger {
  const parsed = parseImmutablePublicationLedger(readFileSync(join(ROOT, IMMUTABLE_PUBLICATIONS_LEDGER_PATH)));
  if (!parsed.ledger) throw new Error("authored ledger is invalid");
  return parsed.ledger;
}

function committedLedger(commit: string): ImmutablePublicationLedger {
  const bytes = execFileSync("git", ["show", `${commit}:${IMMUTABLE_PUBLICATIONS_LEDGER_PATH}`], { cwd: ROOT });
  const parsed = parseImmutablePublicationLedger(bytes);
  if (!parsed.ledger) throw new Error(`committed ledger is invalid at ${commit}`);
  return parsed.ledger;
}

function fixtureRoot(ledger: ImmutablePublicationLedger): string {
  const root = mkdtempSync(join(tmpdir(), "kingdom-immutable-publications-"));
  const manifest = join(root, IMMUTABLE_PUBLICATIONS_LEDGER_PATH);
  mkdirSync(dirname(manifest), { recursive: true });
  copyFileSync(join(ROOT, IMMUTABLE_PUBLICATIONS_LEDGER_PATH), manifest);
  for (const entry of ledger.entries) {
    const destination = join(root, entry.source);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(ROOT, entry.source), destination);
  }
  return root;
}

function git(root: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function writeStagingContract(
  root: string,
  assets: readonly { source: string; destination: string }[],
  mutableDestinations: readonly string[] = [],
): void {
  const path = join(root, HUB_STAGING_CONTRACT_PATH);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({
    protocol: HUB_STAGING_PROTOCOL,
    assets,
    mutable_destinations: mutableDestinations,
  }, null, 2)}\n`);
}

function descendantBootstrapFixture(): {
  root: string;
  anchor: string;
  base: string;
  head: string;
  ledger: ImmutablePublicationLedger;
  staged: Array<{ source: string; destination: string }>;
  trust: {
    baselineCommit: string;
    ids: readonly string[];
    entriesSha256: string;
    entryAnchors: Readonly<Record<string, string>>;
  };
} {
  const root = mkdtempSync(join(tmpdir(), "kingdom-immutable-git-"));
  git(root, "init", "-q");
  git(root, "config", "user.email", "integrity-test@example.invalid");
  git(root, "config", "user.name", "Integrity Test");
  const source = "data/fixture.v1.json";
  const destination = "records/fixture-1.json";
  mkdirSync(join(root, "bin"), { recursive: true });
  mkdirSync(join(root, "data"), { recursive: true });
  writeFileSync(join(root, source), "anchor bytes\n");
  writeFileSync(
    join(root, "bin/stage-hub.ts"),
    [
      "export const HUB_ASSETS = [",
      `  { source: ${JSON.stringify(source)}, destination: ${JSON.stringify(destination)} },`,
      "] as const;",
      "export const MUTABLE_HUB_DESTINATIONS = [",
      "] as const;",
      "",
    ].join("\n"),
  );
  git(root, "add", ".");
  git(root, "commit", "-qm", "anchor");
  const anchor = git(root, "rev-parse", "HEAD");

  writeFileSync(join(root, "unrelated.txt"), "main moved without a ledger\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "unrelated main advance");
  const base = git(root, "rev-parse", "HEAD");

  const ledger: ImmutablePublicationLedger = {
    protocol: "kingdom.immutable-publications/1",
    algorithm: "sha256",
    baseline_commit: anchor,
    entries: [{
      id: "fixture/1/record",
      route: `/${destination}`,
      source,
      destination,
      sha256: createHash("sha256").update("anchor bytes\n").digest("hex"),
    }],
  };
  mkdirSync(join(root, "publications"), { recursive: true });
  writeFileSync(join(root, IMMUTABLE_PUBLICATIONS_LEDGER_PATH), `${JSON.stringify(ledger, null, 2)}\n`);
  writeStagingContract(root, [{ source, destination }]);
  git(root, "add", ".");
  git(root, "commit", "-qm", "add ledger");
  return {
    root,
    anchor,
    base,
    head: git(root, "rev-parse", "HEAD"),
    ledger,
    staged: [{ source, destination }],
    trust: {
      baselineCommit: anchor,
      ids: ["fixture/1/record"],
      entriesSha256: createHash("sha256").update(JSON.stringify(ledger.entries)).digest("hex"),
      entryAnchors: { "fixture/1/record": anchor },
    },
  };
}

describe("immutable route-integrity ledger", () => {
  test("Civic adds only its frozen guide and schema, preserving all 158 base entries and source bytes", () => {
    const baseCommit = "7a99cc685048a525efc6e42cc875b7db3e94f0e0";
    const base = committedLedger(baseCommit);
    const current = currentLedger();
    const addedIds = new Set(["civic/0.1/guide", "civic/0.1/schema"]);
    expect(base.entries).toHaveLength(158);
    expect(current.entries).toHaveLength(160);
    expect(current.entries.filter((entry) => !addedIds.has(entry.id))).toEqual(base.entries);
    expect(compareImmutablePublicationLedgers(current, base)).toEqual([]);
    expect(current.entries.map(({ id }) => id)).toEqual(current.entries.map(({ id }) => id).sort());
    for (const entry of base.entries) {
      const bytes = execFileSync("git", ["show", `${baseCommit}:${entry.source}`], { cwd: ROOT });
      expect(readFileSync(join(ROOT, entry.source)).equals(bytes)).toBe(true);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(entry.sha256);
    }
    for (const [id, source, destination] of [
      ["civic/0.1/guide", "references/civic-v0.1.md", "CIVIC-v0.1.md"],
      ["civic/0.1/schema", "schemas/civic-v0.1.schema.json", "schemas/civic/0.1.json"],
    ]) {
      expect(current.entries.find((entry) => entry.id === id)).toEqual({
        id, source, destination, route: `/${destination}`,
        sha256: createHash("sha256").update(readFileSync(join(ROOT, source))).digest("hex"),
      });
      expect(MUTABLE_HUB_DESTINATIONS).not.toContain(destination);
    }
    expect(HUB_ASSETS).toHaveLength(248);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(94);
    expect(MUTABLE_HUB_DESTINATIONS).toContain("civic-policy.json");
    expect(verifyImmutablePublicationSnapshot({
      root: ROOT, stagedAssets: HUB_ASSETS, mutableDestinations: MUTABLE_HUB_DESTINATIONS,
    }).issues).toEqual([]);
  }, 30_000);
  test("pins every initial versioned or explicitly immutable publication asset", () => {
    const snapshot = verifyImmutablePublicationSnapshot({
      root: ROOT,
      stagedAssets: HUB_ASSETS,
      mutableDestinations: MUTABLE_HUB_DESTINATIONS,
    });
    expect(snapshot.issues).toEqual([]);
    expect(snapshot.ledger?.baseline_commit).toBe(BASELINE);
    expect(IMMUTABLE_PUBLICATIONS_BOOTSTRAP_ENTRIES_SHA256)
      .toBe("782777da5788313426e1be537053648e7945051f29393cb31155d2d59dbb7b43");
    const ids = snapshot.ledger?.entries.map((entry) => entry.id) ?? [];
    const bootstrapIds = new Set<string>(IMMUTABLE_PUBLICATIONS_BOOTSTRAP_IDS);
    expect(ids.filter((id) => bootstrapIds.has(id))).toEqual([...IMMUTABLE_PUBLICATIONS_BOOTSTRAP_IDS]);
    expect(Object.keys(IMMUTABLE_PUBLICATIONS_BOOTSTRAP_ANCHORS).sort())
      .toEqual([...IMMUTABLE_PUBLICATIONS_BOOTSTRAP_IDS]);
    expect(new Set([
      ...MUTABLE_HUB_DESTINATIONS,
      ...(snapshot.ledger?.entries
        .filter((entry) => HUB_ASSETS.some((asset) => asset.destination === entry.destination))
        .map((entry) => entry.destination) ?? []),
    ])).toEqual(new Set(HUB_ASSETS.map((asset) => asset.destination)));
    expect(HUB_ASSETS.some(({ destination }) => destination === IMMUTABLE_PUBLICATIONS_LEDGER_PATH)).toBe(false);
  });

  test("rejects byte drift, source rebinding, and unsafe aliases", () => {
    const ledger = currentLedger();
    const root = fixtureRoot(ledger);
    try {
      expect(verifyImmutablePublicationSnapshot({
        root,
        stagedAssets: HUB_ASSETS,
        mutableDestinations: MUTABLE_HUB_DESTINATIONS,
      }).issues).toEqual([]);

      const target = ledger.entries.find((entry) => entry.id === "geometry-grammar/0.1/guide")!;
      writeFileSync(join(root, target.source), "same route, different bytes");
      expect(verifyImmutablePublicationSnapshot({
        root,
        stagedAssets: HUB_ASSETS,
        mutableDestinations: MUTABLE_HUB_DESTINATIONS,
      }).issues)
        .toContainEqual(expect.objectContaining({ code: "sha256-mismatch", path: target.id }));

      copyFileSync(join(ROOT, target.source), join(root, target.source));
      const rebound = HUB_ASSETS.map((asset) => asset.destination === target.destination
        ? { source: "references/another-guide.md", destination: asset.destination }
        : asset);
      expect(verifyImmutablePublicationSnapshot({
        root,
        stagedAssets: rebound,
        mutableDestinations: MUTABLE_HUB_DESTINATIONS,
      }).issues)
        .toContainEqual(expect.objectContaining({ code: "staged-source-mismatch", path: target.id }));

      const value = JSON.parse(readFileSync(join(ROOT, IMMUTABLE_PUBLICATIONS_LEDGER_PATH), "utf8"));
      value.entries[0].route = "/feedback/latest.json";
      value.entries[0].destination = "feedback/latest.json";
      const parsed = parseImmutablePublicationLedger(encode(value));
      expect(parsed.ledger).toBeNull();
      expect(parsed.issues).toContainEqual(expect.objectContaining({ code: "mutable-alias" }));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("rejects malformed, duplicate, noncanonical, and path-traversing entries", () => {
    const value = JSON.parse(readFileSync(join(ROOT, IMMUTABLE_PUBLICATIONS_LEDGER_PATH), "utf8"));
    value.entries[0].source = "../outside";
    value.entries.push(structuredClone(value.entries[1]));
    value.entries.reverse();
    const parsed = parseImmutablePublicationLedger(encode(value));
    expect(parsed.ledger).toBeNull();
    const codes = parsed.issues.map(({ code }) => code);
    expect(codes).toContain("unsafe-source");
    expect(codes).toContain("duplicate-id");
    expect(codes).toContain("noncanonical-order");

    const authored = readFileSync(join(ROOT, IMMUTABLE_PUBLICATIONS_LEDGER_PATH), "utf8");
    const duplicateKey = authored.replace(
      '  "protocol": "kingdom.immutable-publications/1",',
      '  "protocol": "kingdom.immutable-publications/1",\n  "protocol": "kingdom.immutable-publications/1",',
    );
    expect(parseImmutablePublicationLedger(new TextEncoder().encode(duplicateKey)).issues)
      .toContainEqual(expect.objectContaining({ code: "duplicate-key" }));
  });

  test("parses the strict non-executable staging contract shared by engine and history", () => {
    const contract = parseHubStagingContract(readFileSync(join(ROOT, HUB_STAGING_CONTRACT_PATH)));
    expect(contract.stagedAssets).toEqual([...HUB_ASSETS]);
    expect(contract.mutableDestinations).toEqual([...MUTABLE_HUB_DESTINATIONS]);
    const commentedDecoy = new TextEncoder().encode(`/* parser-only decoy */\n${JSON.stringify({
      protocol: HUB_STAGING_PROTOCOL,
      assets: [{ source: "data/real.json", destination: "records/real.json" }],
      mutable_destinations: [],
    })}`);
    expect(() => parseHubStagingContract(commentedDecoy)).toThrow();
    const duplicateKey = new TextEncoder().encode(
      '{"protocol":"kingdom.hub-staging/1","protocol":"kingdom.hub-staging/1","assets":[],"mutable_destinations":[]}',
    );
    expect(() => parseHubStagingContract(duplicateKey)).toThrow("duplicate key");
    const hierarchyCollision = encode({
      protocol: HUB_STAGING_PROTOCOL,
      assets: [
        { source: "data/parent.txt", destination: "collision" },
        { source: "data/child.txt", destination: "collision/child.txt" },
      ],
      mutable_destinations: ["collision", "collision/child.txt"],
    });
    expect(() => parseHubStagingContract(hierarchyCollision)).toThrow("file/directory destination collision");
  });

  test("requires an explicit stability class without compelling future republication", () => {
    const ledger = currentLedger();
    const retired = ledger.entries[0]!;
    const withoutRetiredRoute = HUB_ASSETS.filter((asset) => asset.destination !== retired.destination);
    const root = fixtureRoot(ledger);
    try {
      rmSync(join(root, retired.source));
      expect(verifyImmutablePublicationSnapshot({
        root,
        stagedAssets: withoutRetiredRoute,
        mutableDestinations: MUTABLE_HUB_DESTINATIONS,
      }).issues).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }

    const unclassified = [...HUB_ASSETS, {
      source: "schemas/future-contract-v1.schema.json",
      destination: "schemas/future-contract/1.json",
    }];
    expect(verifyImmutablePublicationSnapshot({
      root: ROOT,
      stagedAssets: unclassified,
      mutableDestinations: MUTABLE_HUB_DESTINATIONS,
    }).issues).toContainEqual(expect.objectContaining({
      code: "unclassified-staged-asset",
      path: "schemas/future-contract/1.json",
    }));

    for (const destination of [
      "Schemas/future/1.json",
      "definitions/future/1.json",
      "records/future/1.json",
      "documents/future-v1.json",
    ]) {
      expect(verifyImmutablePublicationSnapshot({
        root: ROOT,
        stagedAssets: [{ source: "site/guest.json", destination }],
        mutableDestinations: [destination],
      }).issues).toContainEqual(expect.objectContaining({
        code: "versioned-mutable-destination",
        path: destination,
      }));
    }

    expect(verifyImmutablePublicationSnapshot({
      root: ROOT,
      stagedAssets: [
        { source: "site/guest.json", destination: "collision" },
        { source: "site/rights.json", destination: "collision/child.json" },
      ],
      mutableDestinations: ["collision", "collision/child.json"],
    }).issues).toContainEqual(expect.objectContaining({
      code: "staged-destination-hierarchy-collision",
      path: "collision",
    }));
  });

  test("rejects unsafe staging paths and symlinked source ancestors", () => {
    const unsafe = verifyImmutablePublicationSnapshot({
      root: ROOT,
      stagedAssets: [{ source: "../outside", destination: "../escape" }],
      mutableDestinations: ["../escape"],
    });
    expect(unsafe.issues).toContainEqual(expect.objectContaining({ code: "unsafe-staged-source" }));
    expect(unsafe.issues).toContainEqual(expect.objectContaining({ code: "unsafe-staged-destination" }));
    expect(unsafe.issues).toContainEqual(expect.objectContaining({ code: "unsafe-mutable-destination" }));

    const ledger = currentLedger();
    const target = ledger.entries.find((entry) => entry.id === "geometry-grammar/0.1/guide")!;
    const root = fixtureRoot(ledger);
    const outside = mkdtempSync(join(tmpdir(), "kingdom-immutable-outside-"));
    try {
      rmSync(join(root, "references"), { recursive: true });
      mkdirSync(join(outside, "references"));
      copyFileSync(join(ROOT, target.source), join(outside, target.source));
      symlinkSync(join(outside, "references"), join(root, "references"));
      expect(verifyImmutablePublicationSnapshot({
        root,
        stagedAssets: HUB_ASSETS,
        mutableDestinations: MUTABLE_HUB_DESTINATIONS,
      }).issues).toContainEqual(expect.objectContaining({
        code: "source-unreadable",
        path: target.id,
      }));
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  test("base comparison permits additions but refuses deletion or coordinated mutation", () => {
    const base = currentLedger();
    expect(compareImmutablePublicationLedgers(structuredClone(base), base)).toEqual([]);

    const extended = structuredClone(base);
    extended.entries.push({
      id: "zz-successor/1/record",
      route: "/records/zz-successor-1.json",
      source: "data/zz-successor.v1.json",
      destination: "records/zz-successor-1.json",
      sha256: "0".repeat(64),
    });
    expect(compareImmutablePublicationLedgers(extended, base)).toEqual([]);

    const removed = structuredClone(base);
    removed.entries.shift();
    expect(compareImmutablePublicationLedgers(removed, base))
      .toContainEqual(expect.objectContaining({ code: "entry-removed" }));

    const coordinatedRewrite = structuredClone(base);
    coordinatedRewrite.entries[0]!.sha256 = "f".repeat(64);
    coordinatedRewrite.entries[0]!.source = "references/rewritten.md";
    const codes = compareImmutablePublicationLedgers(coordinatedRewrite, base).map(({ code }) => code);
    expect(codes.filter((code) => code === "entry-mutated")).toHaveLength(2);
  });

  test("pins the initial set to its declared ancestor without freezing future additions into that anchor", () => {
    const bootstrapIds = new Set<string>(IMMUTABLE_PUBLICATIONS_BOOTSTRAP_IDS);
    const initial = structuredClone(currentLedger());
    initial.entries = initial.entries.filter((entry) => bootstrapIds.has(entry.id));
    const issues = verifyImmutablePublicationsAgainstBase(initial, BASELINE, ROOT, HUB_ASSETS);
    expect(issues).toEqual([]);
    const rewrittenBootstrap = structuredClone(initial);
    rewrittenBootstrap.entries[0]!.sha256 = "f".repeat(64);
    expect(verifyImmutablePublicationsAgainstBase(rewrittenBootstrap, BASELINE, ROOT, HUB_ASSETS))
      .toContainEqual(expect.objectContaining({ code: "bootstrap-identity-mismatch" }));
    const reboundBootstrap = structuredClone(initial);
    reboundBootstrap.entries[0]!.route = reboundBootstrap.entries[1]!.route;
    reboundBootstrap.entries[0]!.source = reboundBootstrap.entries[1]!.source;
    reboundBootstrap.entries[0]!.destination = reboundBootstrap.entries[1]!.destination;
    reboundBootstrap.entries[0]!.sha256 = reboundBootstrap.entries[1]!.sha256;
    expect(verifyImmutablePublicationsAgainstBase(reboundBootstrap, BASELINE, ROOT, HUB_ASSETS))
      .toContainEqual(expect.objectContaining({ code: "bootstrap-identity-mismatch" }));
    expect(verifyImmutablePublicationsAgainstBase(initial, "0".repeat(40), ROOT, HUB_ASSETS))
      .toContainEqual(expect.objectContaining({ code: "unknown-base" }));
    const missingAnchorTrust = {
      baselineCommit: BASELINE,
      ids: IMMUTABLE_PUBLICATIONS_BOOTSTRAP_IDS,
      entriesSha256: IMMUTABLE_PUBLICATIONS_BOOTSTRAP_ENTRIES_SHA256,
      entryAnchors: { ...IMMUTABLE_PUBLICATIONS_BOOTSTRAP_ANCHORS },
    };
    delete (missingAnchorTrust.entryAnchors as Record<string, string>)[IMMUTABLE_PUBLICATIONS_BOOTSTRAP_IDS[0]];
    expect(verifyImmutablePublicationsAgainstBase(initial, BASELINE, ROOT, HUB_ASSETS, missingAnchorTrust))
      .toContainEqual(expect.objectContaining({ code: "bootstrap-trust-invalid" }));
  });

  test("audits every committed first-parent release tree from the fixed bootstrap", () => {
    expect(verifyImmutablePublicationHistory(committedLedger("HEAD"), ROOT)).toEqual([]);
  }, 300_000);

  test("accepts a declared anchor behind an unrelated ledger-less base and rejects a non-ancestor", () => {
    const fixture = descendantBootstrapFixture();
    try {
      expect(verifyImmutablePublicationsAgainstBase(
        fixture.ledger,
        fixture.base,
        fixture.root,
        fixture.staged,
        fixture.trust,
      )).toEqual([]);

      const successor = structuredClone(fixture.ledger);
      successor.entries.push({
        id: "zz-successor/1/record",
        route: "/records/zz-successor-1.json",
        source: "data/zz-successor.v1.json",
        destination: "records/zz-successor-1.json",
        sha256: "0".repeat(64),
      });
      expect(verifyImmutablePublicationsAgainstBase(
        successor,
        fixture.base,
        fixture.root,
        fixture.staged,
        fixture.trust,
      )).toContainEqual(expect.objectContaining({ code: "bootstrap-unexpected-entry" }));
      expect(verifyImmutablePublicationsAgainstBase(
        successor,
        fixture.base,
        fixture.root,
        [...fixture.staged, {
          source: "data/zz-successor.v1.json",
          destination: "records/zz-successor-1.json",
        }],
        fixture.trust,
      )).toContainEqual(expect.objectContaining({ code: "bootstrap-unexpected-entry" }));

      expect(verifyImmutablePublicationsAgainstBase(
        fixture.ledger,
        fixture.head,
        fixture.root,
        fixture.staged,
        fixture.trust,
      )).toContainEqual(expect.objectContaining({ code: "self-base" }));

      writeFileSync(join(fixture.root, "after-ledger.txt"), "advance past the ledger commit\n");
      git(fixture.root, "add", ".");
      git(fixture.root, "commit", "-qm", "advance after ledger");
      expect(verifyImmutablePublicationsAgainstBase(
        successor,
        fixture.head,
        fixture.root,
        fixture.staged,
        fixture.trust,
      )).toContainEqual(expect.objectContaining({ code: "new-entry-unstaged" }));
      expect(verifyImmutablePublicationsAgainstBase(
        successor,
        fixture.head,
        fixture.root,
        [...fixture.staged, {
          source: "data/zz-successor.v1.json",
          destination: "records/zz-successor-1.json",
        }],
        fixture.trust,
      )).toEqual([]);

      const futureAnchor = structuredClone(fixture.ledger);
      futureAnchor.baseline_commit = fixture.head;
      const futureTrust = { ...fixture.trust, baselineCommit: fixture.head };
      expect(verifyImmutablePublicationsAgainstBase(
        futureAnchor,
        fixture.base,
        fixture.root,
        fixture.staged,
        futureTrust,
      )).toContainEqual(expect.objectContaining({ code: "baseline-not-ancestor" }));
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test("first-parent audit remembers failed intermediate snapshots and permits honest successors", () => {
    const fixture = descendantBootstrapFixture();
    try {
      expect(verifyImmutablePublicationHistory(fixture.ledger, fixture.root, fixture.trust)).toEqual([]);
      const badAnchorTrust = {
        ...fixture.trust,
        entryAnchors: { "fixture/1/record": fixture.head },
      };
      expect(verifyImmutablePublicationHistory(fixture.ledger, fixture.root, badAnchorTrust))
        .toContainEqual(expect.objectContaining({ code: "bootstrap-anchor-not-ancestor" }));

      writeFileSync(join(fixture.root, "data/fixture.v1.json"), "temporarily drifted bytes\n");
      git(fixture.root, "add", ".");
      git(fixture.root, "commit", "-qm", "bad immutable byte drift");
      writeFileSync(join(fixture.root, "data/fixture.v1.json"), "anchor bytes\n");
      git(fixture.root, "add", ".");
      git(fixture.root, "commit", "-qm", "restore bytes");

      writeStagingContract(fixture.root, [{
        source: "data/rebound.v1.json",
        destination: fixture.staged[0]!.destination,
      }]);
      git(fixture.root, "add", ".");
      git(fixture.root, "commit", "-qm", "bad immutable source rebind");
      writeStagingContract(fixture.root, fixture.staged);
      git(fixture.root, "add", ".");
      git(fixture.root, "commit", "-qm", "restore mapping");

      writeFileSync(join(fixture.root, "collision-parent.txt"), "parent\n");
      writeFileSync(join(fixture.root, "collision-child.txt"), "child\n");
      writeStagingContract(fixture.root, [
        ...fixture.staged,
        { source: "collision-parent.txt", destination: "collision" },
        { source: "collision-child.txt", destination: "collision/child.txt" },
      ], ["collision", "collision/child.txt"]);
      git(fixture.root, "add", ".");
      git(fixture.root, "commit", "-qm", "bad file directory destination collision");
      writeStagingContract(fixture.root, fixture.staged);
      git(fixture.root, "add", ".");
      git(fixture.root, "commit", "-qm", "restore destination tree");

      const ledgerPath = join(fixture.root, IMMUTABLE_PUBLICATIONS_LEDGER_PATH);
      const cleanLedger = readFileSync(ledgerPath);
      rmSync(ledgerPath);
      git(fixture.root, "add", "-A");
      git(fixture.root, "commit", "-qm", "bad ledger disappearance");
      writeFileSync(ledgerPath, cleanLedger);
      git(fixture.root, "add", ".");
      git(fixture.root, "commit", "-qm", "restore ledger");

      const codes = verifyImmutablePublicationHistory(fixture.ledger, fixture.root, fixture.trust)
        .map(({ code }) => code);
      expect(codes).toContain("history-sha256-mismatch");
      expect(codes).toContain("history-staged-source-mismatch");
      expect(codes).toContain("history-stage-invalid");
      expect(codes).toContain("history-ledger-disappeared");
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }

    const successorFixture = descendantBootstrapFixture();
    try {
      const successor = structuredClone(successorFixture.ledger);
      const successorSource = "data/zz-successor.v1.json";
      const successorDestination = "records/zz-successor-1.json";
      writeFileSync(join(successorFixture.root, successorSource), "successor bytes\n");
      successor.entries.push({
        id: "zz-successor/1/record",
        route: `/${successorDestination}`,
        source: successorSource,
        destination: successorDestination,
        sha256: createHash("sha256").update("successor bytes\n").digest("hex"),
      });
      writeStagingContract(successorFixture.root, [
        ...successorFixture.staged,
        { source: successorSource, destination: successorDestination },
      ]);
      writeFileSync(
        join(successorFixture.root, IMMUTABLE_PUBLICATIONS_LEDGER_PATH),
        `${JSON.stringify(successor, null, 2)}\n`,
      );
      git(successorFixture.root, "add", ".");
      git(successorFixture.root, "commit", "-qm", "add immutable successor");
      expect(verifyImmutablePublicationHistory(successor, successorFixture.root, successorFixture.trust)).toEqual([]);
    } finally {
      rmSync(successorFixture.root, { recursive: true, force: true });
    }
  });

  test("does not mistake a TypeScript comment decoy for committed staging state", () => {
    const fixture = descendantBootstrapFixture();
    try {
      const successor = structuredClone(fixture.ledger);
      const future = {
        id: "zz-future/1/record",
        route: "/records/future.json",
        source: "data/future.json",
        destination: "records/future.json",
        sha256: createHash("sha256").update("future bytes\n").digest("hex"),
      };
      successor.entries.push(future);
      writeFileSync(join(fixture.root, future.source), "future bytes\n");
      writeFileSync(
        join(fixture.root, IMMUTABLE_PUBLICATIONS_LEDGER_PATH),
        `${JSON.stringify(successor, null, 2)}\n`,
      );
      writeFileSync(join(fixture.root, "bin/stage-hub.ts"), [
        "/* parser-only decoy",
        "export const HUB_ASSETS = [",
        '  { source: "data/fixture.v1.json", destination: "records/fixture-1.json" },',
        '  { source: "data/future.json", destination: "records/future.json" },',
        "] as const;",
        "export const MUTABLE_HUB_DESTINATIONS = [",
        "] as const;",
        "*/",
        'export const HUB_ASSETS=[{ source: "data/fixture.v1.json", destination: "records/fixture-1.json" }] as const;',
        "export const MUTABLE_HUB_DESTINATIONS=[] as const;",
        "",
      ].join("\n"));
      git(fixture.root, "add", ".");
      git(fixture.root, "commit", "-qm", "attempt staging contract decoy");
      writeFileSync(join(fixture.root, "no-op.txt"), "descendant\n");
      git(fixture.root, "add", ".");
      git(fixture.root, "commit", "-qm", "later descendant");

      expect(verifyImmutablePublicationHistory(successor, fixture.root, fixture.trust))
        .toContainEqual(expect.objectContaining({ code: "history-new-entry-unstaged" }));
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test("rejects a bootstrap reachable only through a second parent", () => {
    const fixture = descendantBootstrapFixture();
    try {
      const sideHead = git(fixture.root, "rev-parse", "HEAD");
      const tree = git(fixture.root, "rev-parse", `${sideHead}^{tree}`);
      const otherRoot = git(fixture.root, "commit-tree", tree, "-m", "unrelated first parent");
      const merge = git(fixture.root, "commit-tree", tree, "-p", otherRoot, "-p", sideHead, "-m", "second-parent-only bootstrap");
      git(fixture.root, "checkout", "-q", "--detach", merge);
      expect(verifyImmutablePublicationHistory(fixture.ledger, fixture.root, fixture.trust))
        .toContainEqual(expect.objectContaining({ code: "baseline-not-first-parent" }));
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
