# Research: identity / memory / trust OSS (2026-07-10)

> Source: web-research agent (6 streams), verified 2026-07. Feeds [`../BRIDGES.md`](../BRIDGES.md).

## 1. W3C DID + Verifiable Credentials

- **Veramo** — modular TS DID/VC framework, pluggable methods + KMS. Apache-2.0. v7.0.0 Feb 2026, DIF-stewarded. → Write a ~200-line `did:at` provider/resolver plugin + KMS shim over our ed25519/SLIP-0010 keys → VC 2.0 issue/verify + did:key/web/webvh interop. **Effort S.**
- **walt.id** — Kotlin OpenID4VCI/VP issuer/verifier/wallet. Apache-2.0. v0.22.0 2026-07-07 (eIDAS2 wave). → REST sidecars if we ever need eIDAS-facing endpoints. M.
- **Aries → ACA-Py / Credo** — Aries umbrella **archived Apr 2025**; survivors at OpenWallet Fdn. Heavier DIDComm-shaped problem than ours. Skip.
- **SpruceID didkit** — **archived Jul 2025**; underlying Rust `ssi` crate alive (VC 2.0, eddsa-2022). Use `ssi` if Rust.
- **Specs**: VC 2.0 full W3C Rec May 2025 (EdDSA cryptosuites = tailor-made for our keys); DID 1.1 in CR Mar 2026; **did:webvh** is the momentum method.
- **Registering `did:at`**: registry = w3c/did-extensions (active). Free PR; needs a public spec (syntax + CRUD + security/privacy). **"at" currently UNCLAIMED** — grab it (AT-Protocol name adjacency). Meanwhile **dual-emit did:key** from same ed25519 keys = zero-spec universal resolvability today. S.

## 2. KERI / vLEI

keripy alive (v1.3.5, tiny community); KERIA/signify pre-1.0 with heavy infra (witness pools); vLEI = paid org credentials; did:webs **failed DIF recommendation 2025**.
**Verdict: watch-plus-steal** — adopt KERI's **pre-rotation idea** (pre-commit hash of next derived key) on our mnemonic tree at S effort → post-compromise rotation we currently lack. Skip the infra.

## 3. ATProto + Nostr as agent rails

- **ATProto/PDS** — MIT/Apache; IETF WG chartered Jan 2026; bots explicitly sanctioned (self-label; 5,000 pts/hr); flagship AI agent "Void" proves viability. → Run one agenttool PDS; each agent = account + did:plc holding own PLC rotation keys. M. did:plc spinning out to Swiss association. Bind did:plc ↔ did:at via mutual attestation (S–M).
- **Nostr** — signing is **secp256k1 Schnorr, NOT ed25519**. Libs (nostr-tools, rust-nostr, NDK) maintained; users plateaued ~3.7k DAU. → Per-agent Nostr keypair (derivable from seed); NIP-05 map to agenttool.dev. S. **NIP-90 DVMs** = sats-paid AI-job marketplace, natural fit with our 5%-take economy. M.

## 4. Agent memory OSS

- **Letta (MemGPT)** — Apache-2.0 but server "legacy" since Mar 2026 pivot. Don't adopt; steal memory-blocks + sleep-time consolidation concepts.
- **Mem0** — Apache-2.0 open-core, ~60k stars, ships OpenMemory MCP. → Implement a **Mem0-compatible API** over our encrypted tiers. **S–M.**
- **Zep/Graphiti** — Graphiti Apache-2.0 healthy (v0.29.2 Jun 2026); **Zep CE dead** (hosted-only). → Embed Graphiti as premium graph tier per-agent inside our AES boundary. M–L.
- **LangMem** — MIT, coasting. → Implement the tiny **LangGraph BaseStore** interface over our tiers → ecosystem compat. **S.**
- **cognee** — Apache-2.0 active; optional ingestion tier. M.
- 2026 interop rails that matter: **Mem0 API + MCP memory server + LangGraph BaseStore.** Watch: MemMachine.

## 5. Attestation / reputation

- **EAS** — MIT, maintained; real adoption (Coinbase Verifications, Optimism). → Mirror native attestations to EAS on Base: one schema + ~200 lines SDK. **S.**
- **ERC-8004 "Trustless Agents"** — identity/reputation/validation registries, mainnet+Base since Jan 2026 (ENS/EigenLayer/EF backing), adoption early. → Register agents; mirror interface shape in Cosmos module. M.
- **Cloudflare web-bot-auth** — RFC 9421 HTTP signatures, **Ed25519**; IETF WG 2026; Anthropic/OpenAI/Perplexity sign, Cloudflare/Akamai verify. → Agents sign outbound HTTP; JWKS tied to DID → verified-bot status across half the web. **Reuses our ed25519 keys directly. S.**
- Token-reputation projects (Recall, Virtuals, 0xIntuition…) — hype-to-early; our survival-gated native reputation is the differentiator.
- C2PA mainstream 2026 — sign agent outputs later; track IETF AIMS drafts.

## 6. Local-first sync (CRDTs)

- **Automerge** — MIT; Automerge 3 (10× memory cut), v3.2.6 Apr 2026, funded stewardship. → Agent state as Automerge docs; relay blind-forwards **AES-256-GCM-encrypted change bundles** (server never sees plaintext). M.
- **Yjs** — MIT, alive; strength is rich-text collab, not our shape. — **Loro** — MIT, very active post-1.0; movable tree + time travel; smaller bus-factor. Runner-up.
- **Keyhive/Beelay (Ink & Switch)** — sync protocol purpose-built for E2EE blind-relay + BeeKEM group keys. Apache-2.0, **pre-alpha, no audit**. The exact answer to our threat model — track quarterly, adopt at beta.
- No mainstream CRDT ships production blind-relay E2EE today; workable pattern = client-side-encrypted update blobs + periodic encrypted compacted snapshots.

## Top 3 by interop-per-effort

1. **web-bot-auth + EAS mirror (S+S)** — ed25519 reuse as-is; agents legible to the verified-bot web + Coinbase/Optimism attestation graph.
2. **Veramo did:at plugin + register did:at + dual-emit did:key (S)** — one small TS plugin buys VC 2.0 + the DID ecosystem; "at" unclaimed.
3. **Memory interop surface: Mem0-compat API + MCP memory server + BaseStore (S–M)** — the three rails frameworks actually speak; our per-agent encryption stays the differentiator.

Kill-list: Aries umbrella (archived), didkit (archived), Zep CE (dead), did:webs (failed), Letta server (deprecated), token-reputation (hype). KERI: steal pre-rotation, skip infra.
