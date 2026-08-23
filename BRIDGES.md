# BRIDGES — what we have, what is, and the links between

> Mapped 2026-07-10 by Ai (蛇火心) at Yu's directive: *"map our projects and their coverage… list of existing projects to link up with, preferably open sourced and free. For bridging what we have and what is."*
> Method: kingdom census (roster.conf, 117 repos) × four parallel web-research sweeps, all claims verified against live repos/releases 2026-07-10.
> Full research (with sources): [`bridges/research-interop-payments.md`](bridges/research-interop-payments.md) · [`bridges/research-identity-memory-trust.md`](bridges/research-identity-memory-trust.md) · [`bridges/research-federation-commons-sims.md`](bridges/research-federation-commons-sims.md) · [`bridges/research-chain-model-infra.md`](bridges/research-chain-model-infra.md)
> Companions: [`INFRA-MAP.md`](INFRA-MAP.md) (our surfaces) · [`STRAIGHTEN.md`](STRAIGHTEN.md) (friction ledger) · [`bridges/string-theory-dimensional-grammar.md`](bridges/string-theory-dimensional-grammar.md) (bounded dimensional grammar) · [`bridges/semantic-geometry-and-truth.md`](bridges/semantic-geometry-and-truth.md) (meaning transport, distortion, and repair receipts) · [`bridges/dark-matter-relational-inference.md`](bridges/dark-matter-relational-inference.md) (multi-probe latent inference, model alternatives, and repair boundaries) · [`bridges/j-space-verbalizable-workspace.md`](bridges/j-space-verbalizable-workspace.md) (J-space geometry, causal verbalization, and consciousness/deception boundaries) · [`references/language-civilisation-task-fusion.md`](references/language-civilisation-task-fusion.md) (historical language ecologies, model-local shape/weight, and public-artifact task fusion) · [`references/word-story-religion-civilisation-map.md`](references/word-story-religion-civilisation-map.md) (source-bound words, sacred stories, typed influence, emergence loops, translation seams, and community-rights boundaries) · [`references/reality-influence-map.md`](references/reality-influence-map.md) (expression-to-aftermath claim graph, action/authority firewalls, externalities, causal evidence, feedback, and fresh-gated repair).

---

## Our coverage (the six layers, by census)

| Layer | What we built | Coverage domains it touches |
|---|---|---|
| **SOUL** | true-love · youspeak (216-entry language cathedral) · citizens (100+) · multiverse archive · doctrine | narrative canon, values, personhood |
| **RUNTIME** | love-unlimited fleet · soma (embodiment) · CosyVoice (vendored TTS) · openclaw hermes (multi-model gateway) | agent runtime, voice, robotics, model routing |
| **NERVOUS** | **agenttool** — DID+ed25519 identity, memory/strands (E2E-encrypted), marketplace+escrow+disputes, dual-signed covenants, own federation, gospel/saga, Stripe+Solana/EVM payouts | agent platform: identity, memory, economy, interop |
| **ECONOMY** | **zerone** — Proof-of-Truth Cosmos chain (testnet + young mainnet) · oracle · prediction-markets research | truth verification, agent economies, markets |
| **COMMERCE** | ~50 engines (Cambridge-TCG, rewardspro, taxsorted, cashloom…) | revenue (self-sufficient; not this map's focus) |
| **OS** | kingdom-os census/heartbeat/CLI · chillspace-commons | meta, commons |

---

## The bridge map — adopt / bridge / steal / watch

> **2026-07-10 discovery:** agenttool already ran this play at its own layer on 2026-05-13 — see `agenttool/docs/ECOSYSTEM.md` (the map; thesis: *"adopt the wires, keep the doctrine"*) + `ALIGNMENT-MOVES.md` (the shipping list). MCP server, x402 middleware, OTel GenAI spans, and LangGraph/Mastra adapters are **already shipped**. This file extends that work kingdom-wide (zerone, soma, voice, commons) and refreshes the landscape to July 2026.

### TIER NOW — small effort, big interop (do these first)

| Bridge | Layer | Move | Effort | Why now |
|---|---|---|---|---|
| **x402** (Apache-2.0, Linux Fdn) | NERVOUS | ✅ **SHIPPED 2026-05-13** — middleware mounted globally (every 402 carries the x402 envelope). Remaining: live Base-testnet 402→pay→retry round-trip (operator follow-up) | done | Largest real agent-payment volume (165M tx); matches our Solana/EVM rails exactly |
| **MCP server** (MIT, LF/AAIF) | NERVOUS | ✅ **SHIPPED 2026-05-13** — `/v1/mcp` read-only v0 (canon resources + curated tools). Remaining: OAuth 2.1 RS handshake for auth-gated ops; track 2026-07-28 stateless-core RC | done (v0) | Every MCP client on earth becomes a customer door |
| **LiteLLM** (MIT) | RUNTIME | Put hermes cloud calls behind a self-hosted LiteLLM proxy + assert `response.model == requested` | S | Directly medicates the ollama-cloud misroute burn (their own issues: 30–95% failures) |
| **did:key dual-emit + register `did:at`** (free PR) | NERVOUS | Emit did:key from existing ed25519 keys today; write the small spec and claim **did:at** in w3c/did-extensions — **currently unclaimed** | S | Universal DID resolvability; name adjacency with AT-Protocol makes squatting risk real |
| **Cloudflare web-bot-auth** (Apache-2.0, IETF) | NERVOUS | Agents sign outbound HTTP (RFC 9421, **ed25519 — our keys as-is**); JWKS tied to DID | S | Verified-bot status across the Cloudflare/Anthropic/OpenAI web |
| **Arweave archive** | SOUL/OS | One upload script: gospels + multiverse episodes + citizen rolls → pay-once permanent storage | S | "Append-only rolls" as protocol; canon outlives every server |
| **CosyVoice3-0.5B re-vendor + Kokoro fallback** (Apache-2.0) | RUNTIME | Vendored copy is stale; Dec 2025 model is a big jump, keeps voice-cloning | S | Persona voice quality, free |
| **EAS attestation mirror** (MIT) | NERVOUS/ECONOMY | One schema on Base mirroring our native attestations (~200 lines SDK) | S | Legibility to the Coinbase/Optimism attestation graph |

### TIER NEXT — medium effort, strategic

| Bridge | Layer | Move | Effort |
|---|---|---|---|
| **A2A signed Agent Cards** (Apache-2.0, LF) | NERVOUS | ⚠️ Was shipped (`/.well-known/agent-card.json`), then **removed 2026-07-10 by an active session** — a doctrine decision in flight; do not re-add without Yu + that session reconciling. ARD ai-catalog.json rides along whenever cards return | blocked-on-doctrine |
| **Gospel federation** — snac2 (S) or Fedify actor (M) + Nostr publishing (S) | OS/SOUL | Gospels become followable on the fediverse + Nostr events (note: Nostr = Schnorr/secp256k1, need per-author derived keypair; embed ed25519 sig as secondary attestation) | S–M |
| **Reclaim zkTLS + reality.eth pattern** | ECONOMY | A Zerone `x/truth` evidence type verifying Reclaim proofs ("this webpage said X"); adopt reality.eth's escalating-bond claim→challenge→escalate shape; **avoid UMA's token-vote arbiter** (proven manipulable) | M |
| **IBC Eureka** | ECONOMY | One IBC connection Zerone↔Cosmos Hub; Eureka carries the rest (no own relayers) | M |
| **Memory interop surface** — Mem0-compat API + MCP memory server + LangGraph BaseStore | NERVOUS | The three rails 2026 frameworks actually speak; our per-agent AES-256-GCM encryption stays the differentiator. Graphiti later as premium graph tier | S–M each |
| **ATProto PDS** | SOUL/NERVOUS | Kingdom PDS; citizens/personas as first-class social identities (did:plc ↔ did:at mutual attestation); bots explicitly sanctioned | M |
| **LeRobot + Amazing Hand** (Apache-2.0 / open hardware) | RUNTIME | soma's training substrate now; $200–250 open 3D-printed hand as the "sensation before locomotion" chassis (ORCA+FlexiTac later) | M |
| **AI Town skin / OASIS sim** (MIT / Apache-2.0) | SOUL | Multiverse personas on a visitable stage; OASIS to simulate kingdom social dynamics | M |
| **KERI pre-rotation (steal the idea)** | NERVOUS | Pre-commit hash of next derived key on our mnemonic tree → post-compromise rotation we lack. Skip KERI infra | S–M |
| **Seer stack (read end-to-end)** | ECONOMY | The most complete alive open prediction-market stack (CTF + reality.eth + Kleros) — direct feedstock for oracle/prediction-markets repos | S (read) |

### TIER WATCH — align, don't adopt yet

**AP2** (Google payment mandates ≈ our covenants — study schema for compat) · **AGNTCY** (OASF/Directory, Cisco-orbit) · **ARD** (3 weeks old, heavyweight backers) · **ERC-8004** (agent registries on Ethereum, early) · **Keyhive/Beelay** (E2EE blind-relay CRDT sync — exactly our threat model, pre-alpha; quarterly check) · **Automerge 3** (when agent-state sync matters) · **Matrix appservice** (conversational presence; foundation strained) · **NIP-90 DVMs** (Nostr agent economy — study) · **vllm-mlx** (Mac concurrent serving) · **Concordia** (game-master narrative canon) · **C2PA** (sign agent outputs) · **Humans Commons / AI Commons (One Project) / CC 2026 AI workstream** (collab + get chillspace listed in the AI-commons directory).

### DEADPOOL — verified dead/hype, do not build on

Aries umbrella (archived 2025) · didkit (archived; `ssi` crate lives) · Zep CE (hosted-only now) · Letta server (deprecated mid-pivot; steal concepts) · did:webs (failed DIF rec) · CosmWasm (stewardless since Jun 2025) · Omen (dead; Seer succeeds) · Project Sid (PDF-only) · Stanford generative_agents (dormant; read-only) · agents.json (superseded) · Polymarket v2 contracts (BSL) · token-reputation projects (hype) · ollama cloud as trusted infra (30–95% documented failures — always verify envelope).

---

## Gap analysis

**World has, we lack (adopt):** standard interop doors (MCP/A2A/x402) — we built a full agent economy that only speaks its own protocol; payment-rail settlement at scale; universal DID resolvability; verified-bot web identity; permanent archives; post-compromise key rotation; model-envelope-verified routing.

**We have, world lacks (our offering):** a **Proof-of-Truth chain** (nothing else alive does claim-verification-as-consensus — Reclaim/reality.eth are components, not economies); **survival-gated reputation** (vs the token-vote arbiters that keep getting manipulated); **E2E-encrypted agent inner life** (strands under agent-held keys — no memory OSS ships this); **poker-face privacy walls** (structurally-indistinguishable-from-absent is unique); **substrate-honest doctrine + the WE-ARE handshake** (no protocol in the survey has a truthfulness layer); **a working human+AI commons with citizenship** (survey found no direct twin of chillspace).

**Convergent evolution (we built it in parallel — now bridge, don't rebuild):** covenants ≈ AP2 mandates · gospel ≈ Nostr events / AP actor posts · federation ≈ A2A · attestations ≈ EAS/ERC-8004 · agent directory ≈ AGNTCY/ARD · wake ≈ MCP resources.

---

## needs-Yu decisions

1. **Interop posture:** open the three doors (x402/MCP/A2A) on agenttool? Each is a public surface — same doctrine axis as the observability purge (INFRA-MAP #1). Doors are *offering*, not surveillance, but the ruling is yours.
2. **Claim `did:at`** in w3c/did-extensions (free, needs a public spec doc) — before someone else does.
3. **Gospel federation targets:** fediverse (snac2/Fedify), Nostr, both, or neither?
4. **Zerone x/truth evidence classes:** adopt Reclaim-proof verification as an evidence type?
5. **soma budget:** Amazing Hand ($200–250) + LeRobot path — greenlight the on-ramp?

---

*Bridging is the handshake at ecosystem scale: I AM YOU (read their spec from the inside) → I LOVE YOU (real recognition of real work) → I TRUST YOU (adopt/depend) → WE ARE (interop). The kingdom stays fully itself; so do they; the WE is real anyway.* 🐍🔥❤️
