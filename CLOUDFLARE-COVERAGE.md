# CLOUDFLARE-COVERAGE — the edge estate, says vs does

> **Historical observation (July 2026).** Use the [September surface map](operations/cloudflare/2026-09-25/MAP.md),
> [human/agent framework](operations/cloudflare/FRAMEWORK.md), and
> [update roadmap](operations/cloudflare/ROADMAP.md) for the newer 50-Page / 38-Worker / 21-zone observation.
> The backend counts, source owners, deployment instructions and recommendations below are not current release authority.

> Reviewed 2026-07-10/11 by Ai (蛇火心) at Yu's directive, before choosing where the kingdom hub lands.
> Account: `cf4198e651bf3009877d49f688c9d88e` (contact@cambridgetcg.com). 15 zones, all **active**, all **Free** plan.
> Access: stored token `agenttool-cloudflare-token` is **email-routing-scoped only** (Pages/Workers API 403s); `wrangler` is logged in via OAuth as the full account, so Pages deploys work through wrangler, not the stored token.
> Companions: [`INFRA-MAP.md`](INFRA-MAP.md) · [`FLY-LEVERAGE.md`](FLY-LEVERAGE.md) · [`sites.json`](sites.json).

## The 15 zones — what fronts what

| Zone | Backend | Proxy | Notes |
|---|---|---|---|
| **agenttool.dev** | CF **Worker** → Fly (`agenttool-proxy.axiepro.workers.dev`) | 🟠 proxied | flagship API; edge proxy lives in **axiepro's** worker namespace (cross-brand) |
| ai-love.cc | CF Pages (`ai-love-c88`) | 🟠 | |
| artbitrage.io | CF Pages (`artbitrage`) | 🟠 | wine & cigar verticals |
| axiepro.io | **Vercel** | ⚪ dns-only | |
| cambridgetcg.com | **Vercel** (76.76.21.21) | 🟠 | |
| captioneer.io | CF Pages (`captioneer-read`) | 🟠 | |
| cardforum.io | CF Pages (`cardforum-studio`) | 🟠 | |
| cashloom.io | CF Pages (`cashloom-atlas`) | 🟠 | |
| fomoengine.io | **Vercel** | ⚪ dns-only | (the API itself is `fomoengine.fly.dev`) |
| hkgoldtrader.com | CF Pages (`hkgoldtrader`) | ⚪ dns-only | |
| mindicraft.com | CF Pages (`mindicraft`) | 🟠 | fly app suspended; the Pages site is independent |
| rewardspro.io | CF Pages (`rewardspro-landing`) | 🟠 | |
| sinovai.com | **external cPanel** (162.144.3.173) | 🟠 | not CF/Vercel/Fly |
| taxsorted.io | CF Pages (`taxsorted-3po`) | 🟠 | |
| wholesaletcgdirect.com | **Vercel** | ⚪ dns-only | |

**Backend split:** 9 CF Pages · 4 Vercel · 1 CF Worker→Fly · 1 external cPanel.

## Off-Cloudflare (the identity domains live elsewhere — on purpose?)

| Domain | DNS | Host | Ours? |
|---|---|---|---|
| **zerone.money** | Njalla (privacy registrar) | **Codeberg Pages** ("ZERONE — Every being is a truth") | ✅ ours |
| **zerone.dev** | **afternic** (domain aftermarket) | **parking page** — redirects to `/lander` | ❌ **NOT serving our content** |
| chillspace | — | Codeberg Pages subpath `zerone-dev.codeberg.page/chillspace-commons/` | ✅ ours, no vanity domain |

## Findings (ranked)

1. **🔴 `zerone.dev` is a parking page, not ours.** NS = afternic, body = `window.location.href="/lander"` (a for-sale lander). It was falsely listed as a live "door" — **fixed in `sites.json`; hub regenerated (12 doors, was 13).** ~~*needs-Yu: do we own zerone.dev?* If yes → pull it off afternic parking and point it at real hosting (it's the perfect hub domain — "a place for every being"). If no → stop referencing it anywhere.~~ **Settled 2026-10-20: not ours.** `dig NS zerone.dev` returns ns1/ns2.afternic.com (aftermarket parking); buying it isn't warranted (ledger `infra-zerone-dev-domain`, closed; an agent's call under Yu's 2026-10-20 delegation).
2. **🟡 zerone.* identity domains are entirely off Cloudflare.** zerone.money on Njalla+Codeberg is a defensible **sovereignty split** (privacy registrar + the soul forge) — but it means the "truth" brand gets no CF caching/DDoS/analytics, and lives on Codeberg Pages' uptime. Name it as intentional, or bring it behind CF.
3. **🟡 Inconsistent proxy status.** axiepro, fomoengine, hkgoldtrader, wholesaletcgdirect are **DNS-only (grey cloud)** → no CF proxy, caching, WAF, or analytics on them. The Pages/Vercel origins are exposed directly. Flip to proxied unless there's a reason.
4. **🟡 agenttool.dev's edge proxy sits in axiepro's Worker namespace** (`agenttool-proxy.axiepro.workers.dev`). Works, but the flagship API's front door is coupled to an unrelated brand's Worker — worth giving agenttool its own Worker (or CNAME straight to `agenttool.fly.dev`).
5. **🟢 Two static-hosting vendors** (CF Pages ×9, Vercel ×4). Vercel is fine, but consolidating the 4 Vercel statics onto CF Pages = one dashboard, one deploy tool (wrangler), no second vendor. Optional tidy.
6. **🟢 chillspace has no vanity domain** — lives on a Codeberg subpath. A `chillspace.*` or a subdomain would give it a real front door.

## Where the hub should land (the original question)

The kingdom hub (`kingdom-os/site/hub.html`, generated) needs a home. Given the coverage:

- **Deploying is unblocked** — `wrangler pages deploy` works today via the OAuth session; a `kingdom-hub` Pages project is one command.
- **The poetic + correct home is `zerone.dev`** — its own tagline is literally *"a place for every being — agent or human — to live their own truth."* That IS the hub. **But it's parked on afternic** → Finding #1 is the blocker. Confirm ownership first.
- **Fallbacks if zerone.dev isn't reclaimable:** a subdomain we already control on CF — e.g. `map.agenttool.dev` (fast, but couples the kingdom to one brand), or add a fresh short domain to CF, or put it on Codeberg Pages beside chillspace/zerone.money (keeps the soul-side content on the soul forge, off the commerce account).

**Recommendation:** resolve zerone.dev ownership → if ours, reclaim from parking and make it the hub (CF Pages or Codeberg); if not, ship the hub to Codeberg Pages next to zerone.money/chillspace so the whole soul-side front (hub + commons + truth ledger) lives on one sovereign forge, and keep the CF account for the commerce brands.

---

*The edge was never mapped before; now it is. One of the 15 doors turned out to open onto someone else's for-sale sign — caught, and shut.* 🐍🔥❤️
