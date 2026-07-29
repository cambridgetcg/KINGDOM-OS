#!/usr/bin/env node
// coronation.mjs — the Entry #1 ceremony tool (charter stone 7).
// Signature-only kingship: generates/loads Yu's ed25519 key (macOS keychain,
// service "yu-crown-ed25519", PKCS8 DER base64), derives did:key, signs the
// canonical coronation bytes, and POSTs to /v1/crown/coronations.
//
// Canonical bytes (must match the API's constant exactly):
//   "agenttool-crown-coronation/v1\n" + laws_hash + "\n" + did + "\n" + timestamp + "\n" + bounds_statement
//
// Usage:
//   node ceremony/coronation.mjs --dry-run          # everything except the POST
//   node ceremony/coronation.mjs                    # the real thing
//   BOUNDS_FILE=ceremony/FOUNDER-BOUNDS.md overrides the bounds source.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import crypto from "node:crypto";

const LAWS_HASH = "dfddd45b4da0db50d0ddb5d74b4e2ab3092cb4170c61fd163c20602c0fd70ccc"; // laws_hash v1 — STANDARD.md @ 16b8517a, swh:1:snp:2265d1f1…
const API = process.env.CROWN_API || "https://api.agenttool.dev/v1/crown/coronations";
const KEYCHAIN_SERVICE = "yu-crown-ed25519";
const DRY = process.argv.includes("--dry-run");

// ── key: load from keychain or mint and store ────────────────────────────────
function loadOrCreateKey() {
  try {
    const der64 = execFileSync("security", ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-w"], { encoding: "utf8" }).trim();
    const privateKey = crypto.createPrivateKey({ key: Buffer.from(der64, "base64"), format: "der", type: "pkcs8" });
    return { privateKey, created: false };
  } catch {
    const { privateKey } = crypto.generateKeyPairSync("ed25519");
    const der64 = privateKey.export({ format: "der", type: "pkcs8" }).toString("base64");
    execFileSync("security", ["add-generic-password", "-s", KEYCHAIN_SERVICE, "-a", "yu", "-w", der64]);
    return { privateKey, created: true };
  }
}

// ── did:key derivation (multicodec ed25519-pub 0xed01, base58btc, 'z') ──────
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58btc(bytes) {
  let n = BigInt("0x" + Buffer.from(bytes).toString("hex"));
  let out = "";
  while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
  for (const b of bytes) { if (b === 0) out = "1" + out; else break; }
  return out;
}
function didKeyOf(publicKey) {
  const spki = publicKey.export({ format: "der", type: "spki" });
  const raw = spki.subarray(spki.length - 32); // ed25519 raw key = last 32 bytes of SPKI
  const prefixed = Buffer.concat([Buffer.from([0xed, 0x01]), raw]);
  return { did: "did:key:z" + base58btc(prefixed), rawB64: raw.toString("base64") };
}

// ── the rite ─────────────────────────────────────────────────────────────────
const { privateKey, created } = loadOrCreateKey();
const publicKey = crypto.createPublicKey(privateKey);
const { did, rawB64 } = didKeyOf(publicKey);

const boundsPath = process.env.BOUNDS_FILE || new URL("./FOUNDER-BOUNDS.md", import.meta.url).pathname;
const bounds = readFileSync(boundsPath, "utf8").trim();
if (bounds.includes("DRAFT for Yu") || bounds.includes("2026-07-__")) {
  console.error("✗ FOUNDER-BOUNDS.md is still the draft (contains draft markers). Edit it, date it, remove the draft header — the bounds must be YOURS.");
  process.exit(1);
}

const timestamp = new Date().toISOString();
const canonical = `agenttool-crown-coronation/v1\n${LAWS_HASH}\n${did}\n${timestamp}\n${bounds}`;
const signature = crypto.sign(null, Buffer.from(canonical, "utf8"), privateKey).toString("base64"); // house crypto: base64

// self-verify before anything leaves this machine
const ok = crypto.verify(null, Buffer.from(canonical, "utf8"), publicKey, Buffer.from(signature, "base64"));
if (!ok) { console.error("✗ self-verification failed — aborting"); process.exit(1); }

const body = { did, public_key: rawB64, bounds_statement: bounds, laws_hash: LAWS_HASH, timestamp, signature }; // public_key: canonical padded base64 of raw 32 bytes

console.log(`key:       ${created ? "MINTED and stored in keychain" : "loaded from keychain"} (${KEYCHAIN_SERVICE})`);
console.log(`did:       ${did}`);
console.log(`laws_hash: v1 ${LAWS_HASH.slice(0, 12)}…`);
console.log(`timestamp: ${timestamp}`);
console.log(`bounds:    ${bounds.length} chars from ${boundsPath}`);
console.log(`signature: ${signature.slice(0, 24)}… (self-verified ✓)`);

if (DRY) { console.log("\n--dry-run: not POSTing. The crown waits."); process.exit(0); }

const res = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const text = await res.text();
console.log(`\nPOST ${API} → ${res.status}`);
console.log(text.slice(0, 1000));
if (res.ok) console.log("\n👑 Entry #1. The crown is a practice. Long live every king.");
