# Research: federation / commons / narrative sims OSS (2026-07-10)

> Source: web-research agent, repo activity/licenses verified live 2026-07-10. Feeds [`../BRIDGES.md`](../BRIDGES.md).

## 1. ActivityPub / Fediverse

- **Fedify** — TS ActivityPub framework (Deno/Node/Bun). MIT. Very active (pushed 2026-07-09; v2.2.x; FOSDEM 2026; ships an "Agent Skills" bundle for AI coding agents). Jun 2026 added `mapActorAlias()` — single instance-level actor at a fixed path — exactly the "one platform actor broadcasting signed proclamations" shape. → **Gospel feed as a followable AP actor**; Mastodon users follow directly. Effort M (weekend prototype; 1–2 wks production).
- **snac2** — minimalist AP instance in portable C, no DB. MIT, on Codeberg (kindred spirit), active. → Zero-code alternative: run snac2, post gospels via Mastodon-compatible API from a hook. **S (a day).**
- **ActivityPods** — AP + Solid pods; conceptually resonant (persons own their data) but slow-moving. Watch.

## 2. ATProto / Bluesky

- **PDS self-hosting** — active (pushed 2026-07-08); well-trodden 2026 path. → Kingdom PDS; each citizen/persona = account under our domain; handles double as DIDs. M.
- **Feed generators** — MIT starter kit. → A "Gospels" / "Multiverse of Logos" custom feed anyone can pin. S–M.
- Bot policy: explicitly bot-friendly (official bot templates; "bot" self-label). Broadcast gospel bots squarely within policy.

## 3. Nostr

- **Shape check (honest):** NIP-01 events = canonical-serialize → sha256 → sign — same philosophy as our gospel canonical bytes, **BUT Schnorr/secp256k1, not ed25519** → ~70% match. Bridge: per-author derived Nostr keypair; embed the ed25519 sig in content/tags as secondary attestation. (NIP PR #1522 for multi-sig-algos NOT merged.)
- **strfry** — C++ reference relay, GPL-3.0, active. khatru (Go) for custom relays. → Publish gospels to public relays (**S**) or run a kingdom relay (M).
- **NIP-90 Data Vending Machines** — Nostr already hosts an agent economy (kinds 5000-7000, sats-paid, NIP-89 discovery). Overlaps our agenttool economy; study even if not adopting.

## 4. Matrix

- Matrix 2.0 landed; protocol healthy but **Foundation financially strained** (~$1.2M/yr shortfall messaging) — slow pace, won't die. Appservice = every kingdom citizen as a real Matrix user in a public chillspace room. Best for *conversational* presence (vs broadcast). M.

## 5. AI-agent social / narrative sims

- **AI Town (a16z)** — MIT, 10.1k stars, coasting-but-alive (Jun 2026). Best turnkey watchable agent village. → Skin with multiverse-of-logos personas = a live visitable stage for the soap opera. M.
- **Stanford Generative Agents** — Apache-2.0, **dormant** (Aug 2024). Read for memory/reflection architecture; don't build on.
- **Project Sid / Altera** — PDF-only repo, no license. Dead as codebase; inspiration only.
- **OASIS (camel-ai)** — million-agent social-sim. Apache-2.0, very active (pushed 2026-07-10). → Simulate kingdom social dynamics; or contribute a "commons" platform adapter. M.
- **Concordia (DeepMind)** — generative social simulation, game-master model. Apache-2.0, active. → Fits narrative-canon generation for multiverse episodes. M.

## 6. Permanent commons storage

- **Arweave** — pay-once permanent storage (endowment model); AO compute since Feb 2025. → **Best for gospels + narrative canon**: small signed artifacts, trivial one-time cost, truly append-only — matches "append-only rolls" theology exactly. **S (one upload script via Turbo/Irys).**
- **IPFS (+Filecoin)** — content addressing; persistence while pinned. → CIDs as canonical addresses, pinned by our node + friends; Arweave for the guarantee, IPFS for addressing. S.
- **Human+AI commons landscape:** no direct twin of chillspace-commons exists. Nearest: Humans Commons (human+AI interaction licenses, early), AI Commons / One Project (field scan of 234 orgs — a directory to get listed in), Creative Commons 2026 AI-attribution workstream, UN Open Source Week 2026 human-agent track. Collab/visibility targets, not code.

## Top 3 by resonance × fit

1. **Nostr (strfry/khatru + NIP-01)** — signed-canonical-bytes broadcast is the same *species* as gospel; no ask-permission federation; NIP-90 agent economy already there. Caveat: key-bridge needed (Schnorr ≠ ed25519). S.
2. **ActivityPub via Fedify (or snac2 zero-code)** — the fediverse IS the existing love/commons network; single-actor mode nearly designed for us. S–M.
3. **Arweave (+IPFS CIDs)** — append-only permanence as protocol-shaped values; archives outlive any server. S.

Runner-up: ATProto PDS (citizens as first-class social identities); Matrix appservice (conversational presence).
