# Research: agent interop + payment protocols (2026-07-10)

> Source: web-research agent, verified against live repos/releases 2026-07-10. Feeds [`../BRIDGES.md`](../BRIDGES.md).

## TIER 1 — standards with real adoption

**1. MCP (Model Context Protocol)** — tool/resource/prompt standard, now + Tasks + MCP Apps. MIT; donated by Anthropic 2025-12-09 to Agentic AI Foundation (Linux Foundation; AWS/Anthropic/Block/Bloomberg/Cloudflare/Google/Microsoft/OpenAI platinum). 2026-07-28 spec RC: stateless core over plain HTTP, OAuth/OIDC authz. De facto universal.
→ Link-up: expose an **agenttool MCP server** (search listings, invoke agent, escrow/dispute, wake, strands). Stateless-core RC fits Bun+Hono directly. Effort S–M.

**2. A2A (Agent2Agent)** — agent-to-agent task delegation; discovery via signed Agent Cards at `/.well-known/agent-card.json`. Apache-2.0, Linux Foundation (Google-contributed 2025-06). v1.0 stable early 2026 (repo v1.0.1, May 2026, 24.7k stars; "150+ orgs" counts supporters not deployments). SDKs Python/Go/JS/Java/.NET/Rust.
→ Link-up: publish **signed A2A Agent Cards per listing** (ed25519 maps cleanly) + one A2A endpoint bridging card-invocation → our invocation/escrow. Effort M.

**3. x402 (HTTP 402 payments)** — server returns 402 + payment requirements; client pays stablecoin; facilitator settles on-chain. Apache-2.0 (coinbase/x402, spec v2); x402 Foundation under LF 2026-04-02 (Stripe, Visa, Mastercard, Google, AWS, Circle, Solana Fdn among 22 members). ~69k active agents / 165M tx / ~$50M volume by Apr 2026 (Coinbase-reported, on-chain verifiable; mostly Base, Solana second). Facilitators: Coinbase CDP hosted (free 1,000 tx/mo) or self-host (second-state/x402-facilitator etc.).
→ Link-up: **finish it — env vars already in agenttool.** Accept x402 on invocation endpoints (micro-invocations alternative to escrow) + federation settlement. Our Solana/EVM payout rails match settled assets exactly. Effort S–M.

## TIER 2 — early but serious

**4. AP2 (Agent Payments Protocol, Google)** — signed "mandates" (user→agent payment authorization chain); crypto settlement via A2A x402 extension. Apache-2.0, v0.2.0 Apr 2026; PayPal/Mastercard pilots. **AP2 mandates ≈ our dual-signed covenants** — study the mandate schema for compatibility; don't adopt while v0.x churns. Watch/align.

**5. AGNTCY (Cisco → LF)** — OASF agent schema, Agent Directory v1.0.0, SLIM transport, DID/VC agent Identity. Apache-2.0, 65+ companies, genuinely active. Overlaps heavily with what we built. → Publish OASF records for listings into their Directory. Effort M; Cisco-orbit reach.

**6. ARD (Agentic Resource Discovery)** — announced 2026-06-17 (Google + Microsoft/GitHub/Cisco/HF/Nvidia/Salesforce…). Static `ai-catalog.json` at well-known path + registry API. Apache-2.0, three weeks old, zero adoption yet, heavyweight backers. → Emit ai-catalog.json once A2A cards exist. Effort S.

## TIER 3 — niche / research / hype

- **ANP** — DID-first decentralized agent networking; philosophically our closest cousin, ecosystem tiny/academic. Watch.
- **Eclipse LMOS** — Telekom multi-agent platform, JVM-centric, narrow contributors. Skip.
- **NANDA (MIT)** — "DNS for agents", aimed at 2027-30, adoption ≈ nil. Watch only.
- **agents.json (Wildcard)** — buzz peaked early 2025, superseded by MCP + cards + ARD. Skip.

## Payment/wallet kits

- **Coinbase AgentKit** — Apache-2.0, active (Agentic Wallets Feb 2026). Optional client-side kit so our agents hold wallets + pay x402. Effort S.
- **Stripe agent toolkit** — MIT, active (Feb 2026 form). We already run Stripe — use metered/usage-billing helpers for invocation billing (fiat side). Effort S. (Stripe acquired Privy Jun 2025.)
- **L402 / Fewsats (Lightning)** — MIT, real but Bitcoin-niche; losing ecosystem race to x402. Skip unless BTC rails wanted.
- **Skyfire KYA/KYAPay** — open spec thinner than x402; useful prior art for reputation/disputes framing. Watch.

## Discovery/registries

`/.well-known/agent-card.json` (A2A, de facto) · AGNTCY Directory + OASF (most complete open registry) · ARD ai-catalog.json (likely future cross-protocol layer) · Agent.market (Coinbase, x402-paywalled listing channel) · NANDA Index (research).

## Top 3 by interop-per-effort

1. **x402** (S–M) — env vars in place, matches payout rails, largest real volume, LF-governed, self-hostable facilitator = sovereignty exit. Immediate revenue surface.
2. **MCP server** (S–M) — one endpoint makes the whole marketplace reachable from every MCP client on earth. Biggest top-of-funnel win.
3. **A2A cards + endpoint** (M) — signed cards reuse ed25519 identity; ARD ai-catalog.json rides along at S.

Honesty notes: x402 volume Coinbase-reported; A2A "150+ orgs" = supporters; AP2/ARD pre-adoption; NANDA/ANP/agents.json hype-vs-reality gap.

(Full source links in the original agent transcript; key: blog.modelcontextprotocol.io 2026 roadmap + 07-28 RC · linuxfoundation.org A2A/AAIF/x402 pressers · github.com/coinbase/x402 · ap2-protocol.org · docs.agntcy.org · developers.googleblog.com ARD announcement.)
