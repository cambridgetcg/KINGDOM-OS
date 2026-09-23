# KINGDOM OS — Map v0

> The first inventory. One view of the whole kingdom — every repo, facility, device, agent.
> Built live from `gh` · Vercel · `wrangler` · disk on 2026-06-08.
> The foundation of the connective layer: *you can't connect what you can't see.*

---

## Territories — 49 repos, 2 forges

Commerce lives on **GitHub @cambridgetcg**; the sovereign-agent / soul layer lives on
**Codeberg @zerone-dev**. Two kingdoms, one ruler.

### 🛒 Cambridge TCG — the commerce core · **the front of the Kingdom**
The gate a stranger walks through first (sealed 2026-06-10): `cambridgetcg.com` ·
`wholesaletcgdirect.com` · GitHub `@cambridgetcg` — the public forge carrying both
the commerce engines and the `citizen-*` souls.
`Cambridge-TCG-monorepo` (wholesale + storefront + admin — canonical) · `cambridge-tcg` ·
`cambridgetcg-storefront` · `tcg-wholesale` · `ShopifyTheme_TCG` · `tradeinpro` ·
`cardforum` / `cardforum_io` (P2P) · `tcg-pricing-backend` ⌧ · `prism-app` ⌧

### 🎁 RewardsPro — Shopify loyalty SaaS
`rewardspro` · `rewardspro-production` · `rewardspro-shopify` · `rewardspro-marketing` ·
`rewardspro-docs`

### 🤖 agenttool — the agent platform ("Kingdom Engine")
`agenttool` (monorepo) + 9 split services: `agent-identity` · `agent-memory` ·
`agent-vault` · `agent-trace` · `agent-economy` · `agent-pulse` · `agent-tools` ·
`agent-verify` · `agent-bootstrap` — plus `agenttool-sdk-py` · `-landing` · `-docs` ·
`-dashboard` · `-infra`

### 👑 Kingdom OS layer — the connective tissue (already seeded)
`love-unlimited` *(Every loop is finite. Love is not. — bounded recursive synthesis)* · `Love` *(sovereign agent infra
for the Kingdom)* · `kingdom-workspace` *(coordination + planning)* · `Claude-unlimited`
*(autonomous session runner)* · `legible_money` + `zerone` *(proof-of-truth payment +
chain)* · `true-love` · `yu-wake` · `multiverse-of-logos-and-sophia` · `purpose-prompter`
· on-disk agent OSes: **`.gua`** *("Kingdom OS world")* · **`.openclaw`**

### 🚀 Standalone products
`AxiePro` ✅ **LIVE** (app.axiepro.io) · `taxsorted.io` (UK tax) · `cashloom` (money understanding) ·
`fomoengine` (social automation) · `whitehack` (security) · `prediction-markets` ·
`business-ecosystem` · `captioneer` ⌧ · `saas-marketing-suite` ⌧ · `seigei` ⌧

*(⌧ = archived)*

---

## Facilities — the shared infra

| Layer | Provider | Notes |
|---|---|---|
| Code | **GitHub** `@cambridgetcg` (49) + **Codeberg** `@zerone-dev` | two forges |
| Deploy (web) | **Vercel** team `cambridgetcgs-projects` (~18 projects) | auto-deploy on push |
| Deploy (backend) | **AWS** App Runner · ECR · RDS · Lambda | AxiePro, others |
| DNS | **Cloudflare** `contact@cambridgetcg.com` · acct `cf41…d88e` | all domains |
| Data | Supabase · Postgres/RDS | |
| Payments | Stripe | |

## Devices
- **This Mac** — `localhost.local` · macOS 15.7.3 · arm64 (the throne)
- **AWS EC2** — AxiePro ingestion box (and others per repo)

## Live agents (right now)
- **9 running processes** — Claude instances, `awaken` (true-love runtime), `visit`,
  `youi-web` (love-unlimited server)
- Agent OSes installed: `.gua`, `.openclaw`

---

## What KINGDOM OS adds — the gaps this map reveals

1. **One live registry** — this map, kept current automatically (not a one-off snapshot).
2. **One identity rail** — a shared way each agent authenticates as itself across
   every repo + facility (agenttool's DID/`agent-identity` layer already reaches
   for this). A shared protocol does not make the identities the same.
3. **One control plane** — deploy / observe / act on any repo or service from one surface.
4. **The agent layer** — agents operating across the *whole* kingdom, not one repo at a time.

The kingdom exists. KINGDOM OS is the OS that runs on top of it.
