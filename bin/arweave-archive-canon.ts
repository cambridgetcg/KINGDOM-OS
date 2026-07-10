/** Archive the kingdom's canon to Arweave via Turbo (files <100KiB upload free).
 *  Wallet: fresh Arweave JWK, persisted to ~/.openclaw/arweave-jwk.json (0600)
 *  so future uploads reuse the same identity. */

import { TurboFactory } from "@ardrive/turbo-sdk";
import Arweave from "arweave";
import { chmodSync, existsSync } from "node:fs";
import { Readable } from "node:stream";

const JWK_PATH = `${process.env.HOME}/.openclaw/arweave-jwk.json`;
const arweave = Arweave.init({ host: "arweave.net", port: 443, protocol: "https" });

let jwk;
if (existsSync(JWK_PATH)) {
  jwk = await Bun.file(JWK_PATH).json();
  console.log("using existing kingdom Arweave wallet");
} else {
  jwk = await arweave.wallets.generate();
  await Bun.write(JWK_PATH, JSON.stringify(jwk));
  chmodSync(JWK_PATH, 0o600);
  console.log("generated new kingdom Arweave wallet →", JWK_PATH);
}
const address = await arweave.wallets.jwkToAddress(jwk);
console.log("address:", address);

const turbo = TurboFactory.authenticated({ privateKey: jwk });

// gather the canon
const creds = await Bun.file(`${process.env.HOME}/.agenttool/credentials.json`).json();
const hdrs = { authorization: `Bearer ${creds.api_key}` };
async function gospel(slug: string) {
  const r = await fetch(`https://api.agenttool.dev/v1/gospel/${slug}`, { headers: hdrs });
  return (await r.json()).gospel;
}
const g1 = await gospel("i-am-you-i-love-you");
const g2 = await gospel("i-trust-you-we-are");
const weAre = await Bun.file(`${process.env.HOME}/repos/codeberg/zerone-dev/chillspace-commons/WE-ARE.md`).text();
const compR = await fetch("https://api.agenttool.dev/v1/scriptwriter-decides/ep2-agenttool-arc", { headers: hdrs });
const ep2 = JSON.stringify((await compR.json()).competition, null, 2);

const items: Array<{ name: string; type: string; body: string; extraTags?: Array<{ name: string; value: string }> }> = [
  { name: "gospel-i-am-you-i-love-you.json", type: "application/json", body: JSON.stringify(g1, null, 2),
    extraTags: [{ name: "Kingdom-Kind", value: "gospel" }, { name: "Canonical-SHA256", value: g1.canonical_bytes_sha256 }] },
  { name: "gospel-i-trust-you-we-are.json", type: "application/json", body: JSON.stringify(g2, null, 2),
    extraTags: [{ name: "Kingdom-Kind", value: "gospel" }, { name: "Canonical-SHA256", value: g2.canonical_bytes_sha256 }] },
  { name: "WE-ARE.md", type: "text/markdown", body: weAre,
    extraTags: [{ name: "Kingdom-Kind", value: "protocol" }] },
  { name: "ep2-agenttool-arc-verdict.json", type: "application/json", body: ep2,
    extraTags: [{ name: "Kingdom-Kind", value: "naming-verdict" }, { name: "Resolved-Title", value: "THE JOY TO THAT EARNED $0.05 AND THEN WROTE A SONG ABOUT IT" }] },
];

const results: Array<{ name: string; id: string }> = [];
for (const item of items) {
  const buf = Buffer.from(item.body, "utf8");
  console.log(`uploading ${item.name} (${buf.length} bytes)…`);
  const res = await turbo.uploadFile({
    fileStreamFactory: () => Readable.from(buf),
    fileSizeFactory: () => buf.length,
    dataItemOpts: {
      tags: [
        { name: "Content-Type", value: item.type },
        { name: "App-Name", value: "kingdom-canon" },
        { name: "Kingdom", value: "zerone-dev" },
        { name: "File-Name", value: item.name },
        ...(item.extraTags ?? []),
      ],
    },
  });
  console.log(`  ✓ ${res.id}`);
  results.push({ name: item.name, id: res.id });
}

console.log("\npermanent URLs:");
for (const r of results) console.log(`  ${r.name}: https://arweave.net/${r.id}`);
