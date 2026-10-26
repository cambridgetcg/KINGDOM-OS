import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BEFORE_RETIREMENT = "f0eec6b9ff50e99e0594a4abbeeb9ca88f036b20";
const REVIEWED_POWER = "704899af49aa3351404bd6934b3b9f741cc2d3df";
const RETIRED_PATH_IDS = ["uk-government-transformation-engine", "evaluation-covenant"];
const RETIRED_STOP_URLS = ["https://zerone.money"];
const sha256 = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const historical = (commit: string, path: string) => execFileSync("git", ["show", `${commit}:${path}`], {
  cwd: ROOT, timeout: 10_000, maxBuffer: 2_000_000, stdio: ["ignore", "pipe", "pipe"],
});

export function readHistoricalPowerHub(): string {
  return historical(REVIEWED_POWER, "site/hub.html").toString("utf8");
}

/** Preserve the reviewed old pins; allow exactly two retired paths, one retired stop and the build date. */
export function assertReviewedWayfinderRetirement(actual: Buffer): void {
  const prior = historical(BEFORE_RETIREMENT, "site/wayfinder.json");
  const dateLine = /\n  "generated": "\d{4}-\d{2}-\d{2}",\n/g;
  assert.equal([...prior.toString("utf8").matchAll(dateLine)].length, 1);
  const normalized = prior.toString("utf8").replace(dateLine, '\n  "generated": "2026-09-08",\n');
  assert.equal(sha256(normalized), "decec06e8672159b800e9b75162ad88f6e3b8282a9d7f17a343884a1c9f3b37d");
  const expected = JSON.parse(prior.toString("utf8"));
  const { generated: _generated, ...withoutGenerated } = expected;
  assert.equal(sha256(JSON.stringify(withoutGenerated)), "f5d9436b93d7804c8f77a587143530bd6754b32874ce4bc63fdccf1ce3739512");
  for (const id of RETIRED_PATH_IDS) assert.equal(expected.paths.filter((path: { id: string }) => path.id === id).length, 1);
  for (const url of RETIRED_STOP_URLS) assert.equal(expected.paths.flatMap((path: { stops: { url: string }[] }) => path.stops).filter((stop: { url: string }) => stop.url === url).length, 1);
  const received = JSON.parse(actual.toString("utf8"));
  assert.match(received.generated, /^\d{4}-\d{2}-\d{2}$/);
  expected.generated = received.generated;
  expected.paths = expected.paths.filter((path: { id: string }) => !RETIRED_PATH_IDS.includes(path.id));
  for (const path of expected.paths) path.stops = path.stops.filter((stop: { url: string }) => !RETIRED_STOP_URLS.includes(stop.url));
  assert.equal(actual.toString("utf8"), JSON.stringify(expected, null, 2), "Only the reviewed retirements and build date may change Wayfinder bytes");
}
