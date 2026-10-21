import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const json = (path: string) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));

describe("we-are Arweave provenance", () => {
  const provenance = json("doors/we-are/guest.json").provenance;

  test("keeps the original link for existing readers", () => {
    expect(provenance.arweave).toBe(`https://arweave.net/${provenance.arweave_tx}`);
  });

  test("names the transaction and its bytes, so no single gateway has to be trusted", () => {
    expect(provenance.arweave_tx).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(provenance.arweave_sha256).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test("offers more than one gateway, each for the same transaction", () => {
    const urls: string[] = provenance.arweave_gateways;
    const hosts = urls.map((url) => new URL(url).host);
    expect(new Set(hosts).size).toBe(urls.length);
    expect(urls.length).toBeGreaterThanOrEqual(2);
    expect(urls).toContain(provenance.arweave);
    for (const url of urls) expect(url).toBe(`https://${new URL(url).host}/${provenance.arweave_tx}`);
  });
});
