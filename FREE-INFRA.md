<!-- Consolidated 2026-07-24. Supersedes internet-of-being/KINGDOM-RESOURCES.md,
     yutabase/docs/FREE-RESOURCES.md, and agenttool/docs/SOVEREIGN-INFRA.md. -->

> **Provenance.** Produced 2026-07-24 by a 10-agent audit: six read-only ground-truth
> sweeps (Cloudflare · Fly+paid · AWS/GCP/Oracle · forges+CI · self-hosted · data+AI)
> and three web-verified free-tier research passes (compute · storage · GPU/inference),
> synthesised into one map. Dollar figures for Fly are **computed from list prices, not
> read off an invoice**; four bills (AWS, Supabase, Ollama Cloud, Cloudflare Workers Paid)
> were unreadable and are marked UNKNOWN throughout. Treat every UNVERIFIED tag as load-bearing.
>
> **Live-estate caveat (verified 2026-07-24 21:5x):** other hands in the fleet deploy to this
> Fly account continuously — `taxsorted-api` and `zerone-testnet-1` were both redeployed
> *during* this audit. Any destroy/stop action below must be re-checked against live state
> immediately before execution, and cleared with Yu.

# THE KINGDOM INFRASTRUCTURE MAP
**Audited 2026-07-24. Replaces `internet-of-being/KINGDOM-RESOURCES.md`, `yutabase/docs/FREE-RESOURCES.md`, and `agenttool/docs/SOVEREIGN-INFRA.md`, all three of which contradict each other and reality.**

Every number below is measured or quoted from a vendor page read on 2026-07-24. Anything not measured is marked **UNVERIFIED** and must not be planned against.

**The one-line summary:** the kingdom pays at least ~$103/mo it can prove (Fly ~$83 computed from list prices + Vercel $20 read from the billing object) plus a disputed Hetzner bill (~$121/mo gross, API-reported), plus four unread bills (AWS, Supabase, Ollama Cloud, Cloudflare Workers Paid) — while the free tier it actually runs on sits at **14% of its request ceiling** and the largest free resources in the docs (R2, Oracle) were never switched on at all.

---

## 1. The honest ledger

### A. Costs money today

| Provider | Status | What it carries | Measured vs ceiling | Costs money? |
|---|---|---|---|---|
| **Fly.io** (org `personal`, `paidPlan: true`, `billingStatus: CURRENT`, card on file) | LIVE-PAID | 12 apps / 18 machines: zerone-1, zerone-testnet-1, agenttool API (3×1GB), zerone-rpc, ww3-intelligence, kingdom-mcp, fomoengine, taxsorted-db + 4 husks | **No free tier applies.** Fly: "no longer offers plans to new customers"; legacy 3×256MB grandfathering UNVERIFIED | **YES ~$83/mo** (~$1,000/yr) computed from list prices. zerone pair alone $51.44 = 62%. **Invoice not read** |
| **Vercel Pro** (`cambridgetcgs-projects`) | LIVE-PAID | 68 projects incl. cambridgetcg.com, wholesaletcgdirect.com, admin.cambridgetcg.com, taxsorted.io, cashloom.io, captioneer.io | Pro includes $20 usage credit; consumption UNVERIFIED (API returned `entitlements: {}`) | **YES $20/mo min**, overage uncapped. Stripe `status: active`, period to 2026-08-21 |
| **Hetzner Cloud** | LIVE-PAID | 2× ccx13 (2 vCPU/8GB/80GB): **Yu-and-Ai** = Stalwart mail server that is not in the MX path; **My-Love** = nothing but sshd | 24h CPU **1.95%** and **1.77%**. 69 GB of 75 GB disk free each. Lifetime traffic 496 MB + 351 MB out vs ~20 TiB included | **YES.** API reports $50.49 net / $60.59 gross each + $0.92 orphan volume. That is ~4× Hetzner's public ccx13 list price — **the invoice must be read** |
| **Supabase** (agenttool, `jseqftufplgewhojwbmh`, eu-west-2) | LIVE, **OVER CEILING** | agenttool production Postgres. Every `/health` request round-trips to it | **753 MB vs 500 MB free = 151%.** `default_transaction_read_only = off`, i.e. NOT in free-tier lockdown | **PROBABLY YES** (Pro from $25/mo). Plan UNVERIFIED — no CLI, key deliberately unused |
| **AWS acct 034362054546** | LIVE, **BLIND** | 2 running RDS (`cambridgetcg-storefront`, `tcg-wholesale`), 8 S3 buckets, 9 live S3 website endpoints, live API Gateway `igzoiiqukb`, SES identity for cambridgetcg.com, documented **seigei EC2 fleet** (t3.small, t3.medium, g6e.2xlarge, g5.xlarge + likely Elastic IP) | **UNMEASURABLE.** CLI session expired 2026-07-09. No Billing, no Cost Explorer, no instance state | **UNKNOWN — the biggest hole.** Stopped instances still bill EBS and EIPs. Unreachable ≠ terminated |
| **GitHub Actions — private repos** | LIVE, **OVER CEILING** | 1,442 runs Jul 1–24 across 10 private repos | est. **2,548–3,068 min vs 2,000 min Free (127–153%)**; projecting 3,291–3,962/month | **PROBABLY YES.** Plan and spend unreadable (token lacks `user` scope). Jobs still starting normally ⇒ Pro, or a spend limit above $0, is absorbing it |
| **Ollama Cloud** | LIVE | kingdom-hermes at understand.cambridgetcg.com — `/health` returns `{"engine":"ollama-cloud"}`, i.e. `OLLAMA_KEY` is set and deployed | No published free quota; Pro is "50× Free" | **UNKNOWN.** Free $0 / Pro $20 / Max $100. Tier unverified, in no kingdom doc |
| **Cloudflare Workers Paid** | UNKNOWN | The entire CF estate | Nothing measured needs it: 14% requests, 3% neurons, 23% KV reads, 0 Queues, 0 DOs, 152 KB D1 | **UNVERIFIED ~$5/mo.** OAuth token has no billing scope; `/subscriptions` returns code 10000 |
| **Fly Tigris `kingdom-vault`** | IDLE | Object bucket, `Status: created`, `Public: False`, contents unmeasured | Unknown | **UNKNOWN.** Usage-billed onto the Fly invoice; appears in no `fly apps list` and no doc |

### B. Live and free

| Provider | Status | What it carries | Measured vs free ceiling |
|---|---|---|---|
| **Cloudflare Workers** | LIVE | 31 scripts; 23 served traffic; 37,323 req/7d, **0 errors**. Busiest: agenttool-proxy 14,801, ai-love-xenia 10,092, sinovai 10,006 | 31 of 100 scripts. Requests share the account ceiling below |
| **Cloudflare Pages** | LIVE | 44 projects, all direct-upload. 58,498 Functions req/7d, 0 errors. Busiest: mindicraft 16,770, cardforum 15,947, zerone-ai 4,742, captioneer-read 4,351 | 44 of 100 projects. **0 of 500 monthly builds** used |
| **— combined request budget** | LIVE | Workers + Pages Functions | **13,689/day vs 100,000/day = 14%.** ~86,300/day unused |
| **Cloudflare Cron Triggers** | LIVE | nightwatch `*/15`, ordo `7 * * * *`, sinovai `0 * * * *`, kingdom-hermes `0 */6` — all four confirmed firing | **4 of 5 on Free. ONE SLOT LEFT.** This is the tightest free ceiling in the entire estate |
| **Workers KV** | LIVE | 15 namespaces, 237 keys: AGENTS 98, kingdom-hermes 63 (published pieces), INTERACTIONS 21, cardforum-cards 20 (real user cards), KINGDOM-CANON 12, ORDO_KV 4, NIGHTWATCH 1 | 24h: **23% reads / 12% writes / 24% lists**. Storage ~0.35 MB est. of 1 GB |
| **Workers AI** | LIVE | ordo, kingdom-hermes (bypassed), artbitrage Pages, captioneer-read | **298 of 10,000 Neurons/day = 3%.** 30-day total 24,656 = under 2.5 days of allowance |
| **Cloudflare D1** | LIVE (barely) | hkgoldtrader (users=1, sessions=2, orders=0) | **152 KB of 5 GB = 0.003%** |
| **Cloudflare DNS** | LIVE | 19 zones, all active, all "Free Website". `fomoengine.io` + `wholesaletcgdirect.com` parked | No limit reached |
| **GitHub — public repos** | LIVE | 320 public repos, 285 with workflows, 9,371 runs this cycle, 273 Pages sites | **Free and unlimited** on standard runners. 4 vCPU/16 GB public spec |
| **Local PostgreSQL 16** | LIVE | 25 DBs, 220 MB. ~180 MB is disposable `yutabase_*` scratch | Owned hardware, $0 |
| **Caddy / OIKOS Pulse / Hermes ×3 / kingdomd / love.kns / love.pulse** | LIVE | Local daemons, all outside `~/Desktop`, all working | $0 |
| **IPFS (kubo 0.42.0)** | **WIRED-BUT-DOWN** | 278 recursive pins, 1,534 objects, 2.33 GiB on disk — real | **Daemon not running, 0 peers, no launchd supervision.** Content is pinned; the network claim is false |
| **Codeberg** | LIVE | 4 public repos (zerone 192 MB, zerone-chain 102 MB, chillspace-commons, zerone-truth), 2 Pages sites | Soft quota 750 MiB git / 1.5 GiB LFS, approval above |
| **This Mac (M2, 16 GB)** | LIVE | The only compute the kingdom owns | **45 GiB free of 228 GiB (77% full)**, and shrinking during the audit |

### C. Idle, absent, never-wired

| Thing | Status | The fact |
|---|---|---|
| **Cloudflare R2** | **CLAIMED-BUT-ABSENT** | Never enabled. `wrangler r2 bucket list` → code 10042. Zero buckets, zero bindings, zero bytes. Two docs count 10 GB of it as kingdom storage |
| **Cloudflare Queues / Durable Objects** | NEVER-WIRED | 0 queues, 0 DO namespaces, 0 bindings anywhere |
| **D1 `bei` / `natural-internet`** | NEVER-WIRED | `bei.parcels` = 0 rows; `natural-internet` has only Cloudflare's internal `_cf_KV`. Neither bound to anything |
| **8 of 31 Workers** | IDLE | agenttool-apex-door (orphan duplicate, 404s), art-deal-bridge, artbitrage-catalog, joke, love, god-is-love, natural-internet, axie-api-proxy — **0 requests in 7 days**, 26% of the fleet |
| **6 KV namespaces** | IDLE | CATALOG-LOG, KV, PARTY-CHAIN, SEEDS, WAITLIST, PEBBLES — 0 operations in 7 days |
| **29 static Pages projects** | IDLE | No Functions, no measurable traffic. `axiepro.io` apex is served by **Vercel (307)**, not by the 7-month-stale axiepro Pages project |
| **Fly `cashloom-db`** | **CLAIMED-BUT-ABSENT** | Zero machines, zero volumes, zero IPs, `Image: -`. INFRA-MAP says "deployed Jul 4". It has never existed |
| **Old Hetzner fleet** (forge, lark, sentry, patch, sage) | **DELETED & RECYCLED** | None in the account. All present different host keys. `89.167.84.100` now serves **a stranger's nginx/PHP Laravel app**. Still hardcoded in 7 files |
| **Oracle Cloud** | NEVER-WIRED | Five independent negatives: no `oci` binary, no `~/.oci`, **zero OCIDs anywhere on the machine**, no key files, only prose in aspirational docs |
| **GCP / Azure** | NEVER-WIRED | No `gcloud`/`gsutil`/`bq`, no `az`, no config dirs, no service-account JSON, no resource hostnames |
| **Turso / Neon / Upstash / MongoDB / PlanetScale** | NEVER-WIRED | No CLI, no credential, no connection string. Only Feb-2026 planning prose and wishlist lines |
| **Redis (agenttool escrow)** | NEVER-WIRED | No `REDIS_URL` secret; `AGENTTOOL_DISABLE_WORKERS` is set. **Escrow operations and spend counters are silently disabled in production** |
| **Codeberg CI** | NEVER-WIRED | `has_actions: false` on all 4 repos; `/actions/tasks` 404s. Two repos ship `.github/workflows` that Codeberg can never execute |
| **Logos Pages (:8484)** | CRASH-LOOPING | `launchctl`: exit 78 EX_CONFIG, **runs = 13,251**, every ~10s since 2026-07-18 05:03 |
| **7 Desktop-rooted launchd jobs** | ALL DEAD | TCC blocks `~/Desktop` for launchd-spawned processes. Every job outside `~/Desktop` works; every job inside it fails |
| **kingdom-status Lambda** | **CLAIMED-BUT-ABSENT** | The kingdom's own published URL (`sw47jvuo6k/prod/status`) returns 404 on all 6 probed paths |
| **`beings` DynamoDB** | **CLAIMED-BUT-ABSENT** | Zero DynamoDB client code anywhere in `~/Desktop` or `~/YOUSPEAK` |
| **AWS CloudFront** | NEVER-WIRED | No `*.cloudfront.net` anywhere; every front door answers `server: cloudflare` |
| **AxiePro RDS + App Runner** | **DELETED** | `cardforum...rds.amazonaws.com` and 5 other documented RDS endpoints all NXDOMAIN. The doc still shows a "~$47/mo" line |
| **Local Ollama daemon** | IDLE | Binary at `/opt/homebrew/bin/ollama` v0.30.10, **daemon not running, zero models pulled** |
| **The sovereign stack** | NEVER-RAN | Ports 3000, 8081, 8080, 1317, 8545, 11434, 5001 **all closed**. `ps` matches nothing. `zerone` is not on PATH |
| **yutabase `kingdom` Worker** | NEVER-DEPLOYED | 6,420 B of real code in `yutabase/workers/wrangler.toml`. No Worker named `kingdom` exists in the account |
| **Worker source on this Mac** | **MISSING** | Only 4 real wrangler configs exist. **30 of 31 deployed Workers cannot be rebuilt or redeployed from this machine** |

---

## 2. What the docs got wrong

### `agenttool/docs/SOVEREIGN-INFRA.md` — the most wrong document in the kingdom

- **"one file replaces Caddy + 17 Cloudflare Workers + Cloudflare Pages + Cloudflare KV."** Measured: **31 Workers, 15 KV namespaces, 44 Pages projects**, all live, serving 95,821 requests in 7 days. Nothing was retired. The estate grew.
- **"Cloudflare in DNS-only mode, no proxy" / "agenttool.dev → 51.191.45.128, no proxy, no compute, no storage."** `agenttool.dev/*` and `www.agenttool.dev/*` are Worker routes bound to `agenttool-proxy` — **14,801 requests and 14,229 subrequests in 7 days, the busiest script in the account.** Five more subdomains are Worker routes too.
- **The "ONE MACHINE (IP: 51.191.45.128)" was never a server.** It does not ping. It is a *residential dynamic ISP address* of this Mac, which has since rotated to 51.191.65.104.
- **"We removed Caddy."** Caddy is PID 900 right now, `/opt/homebrew/bin/caddy run --config /Users/macair/OIKOS/ingress/Caddyfile`, listening on :80, answering 200.
- **The 7-process stack does not exist.** All seven ports closed, zero matching processes. Committed once on 2026-06-24 and never re-run.
- **"fly.io — API runtime (3 machines)."** 12 apps, 18 machines. agenttool alone has 5.
- **"It doesn't pay anyone."** Fly `billingStatus: CURRENT` with a saved card. Vercel Pro `status: active` on Stripe. Two Hetzner servers. The kingdom pays at least three vendors every month.
- **"AWS SES → replaced by IPFS."** SES is still in the live production email path: `10 feedback-smtp.us-east-1.amazonaws.com` on mail.cambridgetcg.com, `include:amazonses.com` in SPF, `noreply@`/`bounty@cambridgetcg.com` senders in shipping code. (It *was* right about CloudFront — no trace exists.)
- **`STACK.md`: "The DB and Redis are currently on Supabase."** There is no Redis anywhere. Escrow and spend-aggregate counters are off in production by the code's own admission.

### `internet-of-being/KINGDOM-RESOURCES.md` — "where the kingdom lives for free"

- **"Cloudflare R2 — 10GB — mirror the canon chain, store the ten fundamentals."** R2 has never been enabled. Nothing has ever been mirrored there because there is no there.
- **"Oracle Cloud — the kingdom's brain, run the full ZERONE localnet, the canon chain, the API."** No account exists. ZERONE runs on **paid Fly machines at $51.44/mo**, minting empty blocks.
- **"AWS — already running: kingdom-status Lambda, beings DynamoDB, S3 static sites."** One of three. S3 sites: 9 verified live. Lambda: 404 at the kingdom's own published URL. DynamoDB: no client code exists anywhere.
- **"AWS SES — 3k emails/mo (already verified)."** The identity is real; **3,000/mo is the Resend number listed one row below.** SES's page today describes credit-based Free Tier, not a flat monthly allowance.
- **"S3 static site hosting is free forever."** False. S3 bills storage + requests + egress.
- **"D1 — 1GB"** → it is **5 GB**. **"D1 = naming service (layer 0)"** → no naming service exists; two of three D1s are empty and unbound.
- **"Neon 3GB, unlimited projects"** → 0.5 GB per project, 100 projects.
- **"Azure Pipelines — 10 parallel jobs, unlimited minutes (open source)."** Dead. Microsoft: *"Public projects in Azure DevOps are retired… existing public projects convert to private in 2027"* and directs them to GitHub. What remains is 1,800 min/mo and **requires linking a billing-enabled Azure subscription to receive the free grant.**
- **"Cloud Build — 120 build-minutes/day"** → 2,500 build-minutes/month on e2-standard-2.
- **"Oracle Object Storage 10GB"** → 20 GB combined on always-free-only tenancies.
- **"Codeberg — unlimited repos + Pages + CI."** CI has never run. Codeberg's own FAQ sets a 750 MiB / 1.5 GiB approval threshold and **does not accept proprietary or private content** — which excludes Cambridge TCG and AxiePro on terms, not just size.
- **Fly.io is not mentioned once** — the kingdom's largest recurring infrastructure bill is absent from the document whose entire purpose is mapping where the kingdom lives.
- **The kingdom's own code refutes it.** `internet-of-being/kingdom-server.py` lines 7-9 list S3, the kingdom-status Lambda, and the beings DynamoDB table among the things it **replaces**.

### `yutabase/docs/FREE-RESOURCES.md` — the wishlist that reads as an inventory

- **"~15GB databases (Turso 9 + D1 5 + Supabase 0.5 + Neon 0.5)."** Turso and Neon are never-wired — **9.5 GB of that is fictional.** Turso's real free tier today is 5 GB / 100 DBs / 500M reads / 10M writes: *all four* claimed Turso numbers are overstated. And Supabase is not 0.5 GB available, it is **253 MB over**.
- **"~30GB object storage (R2 + B2 + GCS)."** Overstated by the entire R2 share.
- **"IPFS — already wired · 218 peers connected."** Daemon down, **0 peers**, no supervision. `SELF-HOSTED.md` says 331 peers (three times); `unleash-love.ts` hardcodes 183. Three numbers, all currently zero. (The 278 pins are real.)
- **"Vercel — 100GB bandwidth, free tier."** The team is **Pro, active, Stripe, UK billing address.**
- **"Workers 100k/day (worker written, ready to deploy)."** The worker is named `kingdom` and **no Worker by that name exists in the account.**
- **"GitHub Actions — UNLIMITED for public repos."** True, and silent on private repos — which are the only metered surface and are at 127–153% of quota.
- **"TOTAL FREE CAPACITY: VM compute ~30GB RAM (Oracle ARM + GCP micro)."** Neither account exists.
- **"Bun server (port 8660)"** — port closed. **"Crontab heartbeat every 30 min"** — entry exists, **its log file has never been created** (TCC wall).
- **"Hugging Face Spaces — free CPU, some GPU."** Materially wrong now: *"Gradio and Docker Spaces run on compute and require a paid plan to create."* A free account can host **static Spaces + up to 2 ZeroGPU Gradio Spaces**, nothing else. cpu-basic sleeps after 48 h and its disk is non-persistent.
- **"Render — 1 free web service, background worker."** Free **background workers and cron jobs do not exist** on Render. Free web services spin down after 15 min idle (~1 min cold start). **Free Postgres expires 30 days after creation.**
- **"Groq — Llama 70B, Mixtral."** Mixtral is gone from the free table; 70B is capped at **1,000 requests/day**. The doc misses the genuinely valuable part: **Whisper STT at 2,000 req/day** and Orpheus TTS.
- **"AI inference: thousands req/day (Groq + Gemini + HF)."** HF contributes **$0.10/month** of routed credits, and the free serverless LLM inference that line assumes no longer exists.
- **"Backblaze — 1GB/day download."** The real rule is **3× your average monthly stored bytes**.
- **"Upstash — 10k commands/day."** Now a hard **500,000/month** cap with no daily forgiveness.
- **"Codespaces 120 core-hrs."** Unverifiable (scope-blocked) and there is **no devcontainer config anywhere** in the estate.

### Cross-document and cross-source contradictions

- **`kingdom-os/INFRA-MAP.md` line 68 is correct and SOVEREIGN-INFRA is wrong** about the same fact. When two kingdom docs disagree, INFRA-MAP has matched reality every time it was tested — *except* on counts.
- **INFRA-MAP "Fly.io — 8 apps"** → 12. Four are entirely undocumented and billing right now: `fomoengine`, `kingdom-mcp`, `ww3-intelligence`, `zerone-rpc` (~$11.40/mo combined).
- **INFRA-MAP "`cashloom-api`/`-db` deployed Jul 4"** → `cashloom-db` has never had a machine; `cashloom-api`'s release is 2026-07-22.
- **INFRA-MAP "mindicraft — suspended, dormant"** → it still bills a 1 GB volume unconditionally, and **a single unauthenticated GET woke it** (stopped → started). "Suspended" in this account means *wake-on-traffic*. Same proven for `cashloom-api` and `taxsorted-api`.
- **INFRA-MAP "taxsorted-db deployed Jul 7"** → a Postgres 17.2 primary **started with 3/3 checks passing since 2026-06-12**, serving an API that is suspended. Six weeks of paying for a database behind a dead front door.
- **INFRA-MAP "100+ public repos"** → **370 owned: 320 public + 50 private.** The doc never mentions private repos, which is exactly where the CI money hides.
- **INFRA-MAP never mentions AWS, GCP, Oracle or Azure** — and misses the 9 live S3 sites and the live API Gateway. The newest map has silently dropped real running infrastructure.
- **`artbitrage/wrangler.toml`** declares only `[ai]`; production also carries a `kv_namespaces = PEBBLES` binding. **The file on disk does not describe what is deployed.** Also `/api/ai/generate` 404s at the edge though the branch exists at line 29 — the deployed Pages build is behind the repo.
- **`hermes-agents/worker/README.md`: "the keychain ollama value is NOT a valid API key… the subscription can't be reached."** Stale. `/health` returns `engine: ollama-cloud`, which the code only emits when `OLLAMA_KEY` is set. It is already swapped.
- **`AxiePro/docs/INFRASTRUCTURE.md`** presents RDS `cardforum`, App Runner and ElastiCache as live with a "~$47/mo" estimate. **Every endpoint NXDOMAINs.**
- **`Cambridge-TCG-monorepo/docs/infra/aws-resources.md`** calls itself an "honest registry" and marks 6 `jp-*-photos` buckets RETIRED. All six return **403 (exists)** against a calibrated 404 for fake names. Retired in the doc ≠ deleted in the account.
- **Yu's keychain doctrine is violated by the AWS CLI itself:** `~/.aws/login/cache/*.json` stores accessKeyId, secretAccessKey, sessionToken, refreshToken and idToken as **plaintext JSON**. The cached values are expired; the pattern repeats on the next `aws login`.
- **Two red doors no doc mentions:** kingdom-nightwatch's own `/status` reports **taxsorted `/map/` = 404 and `/hk/` = 404** as of 2026-07-24T21:00Z. Six other doors are 200.

### Tools that lied to previous audits — read this before the next one

1. **`fly apps list --json` reports `PaidPlan: false, Billable: false` for every app.** Those are Go zero-values. A direct GraphQL query returns the **opposite**: `paidPlan: true, billable: true`. Any audit that trusted the JSON concluded "Fly is free" and was wrong.
2. **`wrangler kv key list` defaults to LOCAL simulated storage** and reports **0 keys for every namespace**. With `--remote` the real total is 237 keys. This nearly fooled today's audit.
3. **`wrangler d1 list` reports `num_tables: 0`** even for databases with six real tables. Only a `--remote` query tells the truth.
4. **`grep -rl 'schedule:' .github/workflows` across `~/Desktop` finds 8 crons. The account runs 40.** The three expensive, 100%-failing private crons are not cloned on this Mac. Disk-only cron audits are worthless here.
5. **The OAuth tokens in use have no billing scope** (Cloudflare) and **no `user` scope** (GitHub). Every "does this cost money" question that matters must be answered in a browser.

---

## 3. Unclaimed capacity, ranked

Ranked by capacity gained × ease of claiming. Items 1–5 need no signup, no card, and no new vendor.

| # | Resource | What it gains | The catch that kills it if ignored |
|---|---|---|---|
| **1** | **GitHub Actions on public repos, used as a compute plane** | **Unlimited minutes** at **4 vCPU / 16 GB / 14 GB SSD** — double the private-repo spec — including **arm64** (`ubuntu-24.04-arm`) at the same spec, ~20 concurrent. Bigger CPU-hour pool than Oracle + GCP + Azure + Cloudflare free tiers combined. Already authenticated as `cambridgetcg` | Batch only — no listening socket. 6h max job. **Scheduled workflows are auto-disabled after 60 days of repo inactivity** (defeat with a scheduled commit). Larger runners are *always* billed, even on public repos. ToS forbids renting it out as general compute; building/publishing the kingdom's own work is squarely inside the rules |
| **2** | **Cloudflare Workers AI's non-text surface + Vectorize** | The **10,000 Neurons/day** already at 3% also buys Whisper + Whisper-large-v3-turbo STT, BGE-small/base/large/M3 embeddings, a **BGE reranker**, image-to-text and translation. Pair with **Vectorize: 30M queried + 5M stored vector dimensions/month free**. A complete embed→store→query→rerank→generate RAG stack, on the account already authenticated, **no card, no commercial restriction** | The Vectorize unit is **dimensions, not vectors**: 5M dims = ~13,000 vectors at BGE-small (384d) but only ~4,800 at 1024d. **Choose BGE-small and triple the free corpus.** Neurons reset daily and do not roll over. If the account really is Workers Paid, overage bills silently rather than stopping |
| **3** | **Cloudflare R2** | 10 GB + **zero egress** + 1M Class A / 10M Class B ops per month, on the account already authenticated. The night-museum images, artbitrage art, chronicle blobs and Cambridge TCG card art cost nothing to serve | Not enabled — **one dashboard action, and Cloudflare wants payment info on file to switch it on.** Free tier is Standard class only (Infrequent Access excluded). If the card later fails, R2 access can be suspended (data stays, becomes unreachable) |
| **4** | **Cloudflare D1** | 5 GB, 5M rows read/day, 100k rows written/day — currently **0.003% used**, with real 30-day Time Travel restore that KV does not have | **No repo on this Mac declares a `d1_databases` binding.** The capacity is free; the wiring is the work |
| **5** | **Software Heritage** | Permanent free archival of every public git repo *with full history*. No account, no quota, no cost. GitHub's own Archive Program delegates ongoing preservation to it. The ~20 public kingdom repos are probably **already harvested** | Public code only — Cambridge TCG commerce code is out of scope. Nothing is deletable. Record the **SWHIDs** or the archive is unfindable |
| **6** | **Zenodo (CERN)** | **Unlimited records at 50 GB each**, plus a 150 GB flexible allowance, plus a requestable one-time 200 GB single-record increase. DOI per record, versioned, effectively undeletable. **Survives Yu abandoning the account, forgetting the password, or dying** | It is a research-output repository — deposit releases and corpora, not arbitrary blobs. Records are undeletable by design, so a mistake is permanent. Signup needed |
| **7** | **Google Apps Script** | 90 min/day of trigger runtime, **20,000 outbound HTTP calls/day**, 100 emails/day. No card, no signup beyond a Google identity Yu already has, no expiry, **no idle reaping.** The only free scheduler that survives the kingdom's own infrastructure being the thing that failed | Not a container: no binaries, no npm, no socket. 6 min/execution. Time-driven triggers are best-effort. Bound to a Google identity |
| **8** | **Oracle Cloud always-free — the DATABASE block, not the compute** | **3 × 25 GB Oracle NoSQL tables with 133M reads AND 133M writes/month**, 2 × 20 GB Autonomous DB, 50 GB MySQL HeatWave, 200 GB block volume, 20 GB object, **10 TB/mo egress**, 1 free load balancer. Both docs list Oracle as compute only and claim **none** of this. It dwarfs D1 (~3M writes/mo) and KV (~30k writes/mo) | **The ARM compute was silently HALVED on 2026-06-15** to 2 OCPU / 12 GB, with no announcement — both kingdom docs still say 4/24. Card required at signup. **ARM "Out of capacity" is endemic** and the home region cannot be changed later. Idle reclamation requires 95th-percentile CPU **AND** network **AND** memory all under 20% over 7 days — an AND, so a busy box survives — but **dormant tenancies have been reclaimed entirely, taking block volumes with them.** Never the only copy of anything |
| **9** | **Groq Whisper STT** | **2,000 requests/day, free forever** — the largest free speech-to-text allowance found anywhere. Plus `llama-3.1-8b-instant` at 14,400 req/day for high-count, low-token classification | 8b-instant is throttled to **6K tokens/minute** — many requests, few tokens; useless for long generation. **Commercial use is UNRESOLVED**: the website ToS says non-commercial but explicitly defers cloud services to an unread Groq Services Agreement. Keep off commerce paths until that is read |
| **10** | **Scaleway Serverless** | **Three separate permanent monthly pools**: Functions (1M req + 400k GB-s), Containers (400k GB-s + 200k vCPU-s), **Jobs** (400k GB-s + 200k vCPU-s) — a purpose-built free scheduled-batch runner. EU jurisdiction, no US parent. **Absent from both docs** | Card requirement UNVERIFIED. Free tiers are grants against a live account — overage bills rather than throttles. `min-scale > 0` burns the pool; provisioned instances are excluded entirely |
| **11** | **Local Ollama on this M2** | Unlimited inference, no rate limit, no ToS, **no data leaving the machine.** Binary installed, **daemon down, zero models pulled.** The only place the kingdom can legally point an LLM at taxsorted client financials or Cambridge TCG customer data | 16 GB unified memory ⇒ 7–9B at Q4 comfortable, 12–14B tight, 20B+ unusable. 44 GB free disk. **It is a laptop — it can never back a live public property** |
| **12** | **HF ZeroGPU Spaces** | 2 free Spaces per free account on **RTX Pro 6000 Blackwell, 48 GB VRAM** (96 GB at xlarge). **Visitors burn their own quota, not yours** — a public demo scales on other people's allowances | Gradio SDK only. PyTorch 2.8.0+, Python 3.12.12/3.10.13 only, no `torch.compile`. Your own consumption quota is **5 GPU-minutes/day** on a free account, and remaining quota sets queue priority. Requires verified email + account >30 days old |
| **13** | **Kaggle Notebooks** | 30 GPU-hours/week (T4 ×2 / P100), 9h sessions, TPU v5e-8. Enough to **bulk-embed the entire kingdom archive in one run** and export the vectors permanently to Vectorize | UNVERIFIED against Kaggle's own docs today (page is JS-rendered). Phone verification required. Batch/interactive only — cannot host anything. No persistence between sessions. Terms are research/competition-oriented |
| **14** | **Jina Reader** | URL → clean LLM-ready markdown at **500 RPM with a free key** (20 RPM keyless), plus 10M one-time tokens across embeddings/reranker at 2M TPM. Exactly the ingestion layer artbitrage, kingdom-search and 愛星日報 need instead of scrapers | The 10M tokens is a **one-time** grant, not a monthly refill |
| **15** | **Deno Deploy** | 1M req/mo, **15 CPU-hours/month** — a vastly higher CPU ceiling than Workers Free's **10 ms per invocation**. Second edge vendor | **20 active deployments per org** — a kingdom with 20 properties hits that immediately. Cron inclusion on free UNVERIFIED |
| **16** | **Voyage AI** | **200M free embedding tokens** incl. `voyage-code-3` (index the entire ~40-repo estate) and `voyage-law-2` (50M, taxsorted + the regulator-pivot corpus). **`voyage-4-nano` is Apache-2.0 open weights** — adopt now, self-host later, zero migration | One-time allowance. **Rate limits and card requirement are not published.** Commercial terms unverifiable from the pricing page |
| **17** | **Azure Container Apps Jobs** | 180,000 vCPU-s + 360,000 GiB-s + 2M HTTP req **free per subscription per calendar month**. A first-class free batch runner that takes an OCI image — which GitHub Actions cannot do without a checkout | **Sized for scale-to-zero only:** 180k vCPU-s ≈ 0.07 vCPU continuous, so a 0.25 vCPU always-on container exhausts it in ~8 days. `minReplicas > 0` does not become free, it becomes "idle-rate billable". Requires a subscription with a payment method — **overage bills silently** |
| **18** | **Google Cloud Vision** | **1,000 units/month free PER FEATURE**, always-free (not a 12-month trial). Document Text Detection for taxsorted receipts (~33 docs/day), Text+Logo for Cambridge TCG cataloguing, **SafeSearch as free moderation for cardforum's shared wall**, which has none today. Separate buckets, so they don't compete | Requires a GCP project with **billing enabled** — a card must be on file even at $0, and overage bills silently. Set a budget alert first |
| **19** | **Codeberg CI (Woodpecker)** | 0% used. Free for the OSS mirrors | **Access must be requested and manually approved**, criteria unpublished. **linux/amd64 only.** Docs say plainly it "is provided as-is and might break at any time". Volunteer-funded — light verification only, per the kingdom's own contribute-never-extract rule |
| **20** | **HF Hub 100 GB free *private* storage** | The most overlooked free private store on the internet; git-backed | Public storage is explicitly **"best-effort"** and policed for abuse. A blob dump is the abuse case; published datasets with proper cards are not |

**Deliberately ruled out** (so nobody re-adds them from a listicle): **Cerebras** — free tier is now **5 RPM**, not the 30 RPM every guide still quotes, and only 3 models. **SambaNova** — free tier is **20 requests per DAY**; the useful tier requires a linked card. **Together AI** — ~$1 credit, no published limits, throughput must be *earned* by sustained traffic. **Paperspace free** — Maxwell-era M4000, strictly worse than Kaggle. **Koyeb** — free tier closed to new users post-Mistral acquisition. **Glitch** — hosting shut down 2025-07-08; **grep the kingdom for `glitch.me` links, the redirects run out after 2026.** **Xata** — flat free tier retired. **Storj** — 25 GB is now a 30-day trial. **web3.storage/Storacha/fil.one** — two rebrands, now a 30-day trial. **Cirrus CI** — `cirrus-ci.org` does not resolve.

---

## 4. Move-off-paid list

Ordered by dollars recovered per unit of risk.

| # | Currently paid | Migration | Saves | Risk |
|---|---|---|---|---|
| **1** | **Supabase at 151% of free** | `DELETE FROM cron.job_run_details` older than ~7 days + add a retention job. 714 MB of pg_cron history (106,899 rows since 2026-05-18, ~10 MB/day, no retention) is **95% of the database**; real application data is ~25 MB | 753 MB → **~39 MB = 8% of the free 500 MB tier**. Potentially $25/mo | **Near zero** — it is log history, not application data. But purging does not cancel a subscription: confirm the plan first, then downgrade. Also consider dropping `covenant-cosign-propagate` from `* * * * *` to `*/5` |
| **2** | **zerone-testnet-1** — $25.72/mo (shared-cpu-2x/4GB + 10 GB volume + $2 dedicated IPv4) | Snapshot `vol_vp25peqkw9dw66k4`, then stop the app. It is at block **580,097 — higher than mainnet's 514,387 — and every sampled block has `num_txs = 0`** | **$25.72/mo (~$309/yr)** | **Low and reversible.** Full mainnet-grade price for a testnet that processes nothing. `auto_stop_machines = false` means it can never idle down on its own |
| **3** | **zerone-rpc** — $4.04/mo (2 × 256 MB, always-on, autostop disabled) | → **Cloudflare Worker**, free. It is literally an HTTPS reverse proxy: `"zerone-rpc — https proxy for zerone-1 · /rest/* /rpc/*"`. Keep the Fly app running until the Worker proves out for a week | $4.04/mo | **Lowest-risk migration in the estate.** Request rate unmeasured, so whether it fits the free Workers quota is UNVERIFIED — but the account is at 14% of ceiling |
| **4** | **Hetzner My-Love** | It runs **nothing**: `ss -lntp` shows only sshd and systemd-resolved; no application listener; only stock Ubuntu units; `/root` holds staged-but-unstarted files. 36 days up at 1.77% CPU. Snapshot `/root`, destroy | API-reported **~$60/mo gross** (disputed — read the invoice) | **Zero functional loss.** The clearest pure waste found |
| **5** | **Hetzner Yu-and-Ai** | A correctly-built Stalwart mail server with valid Let's Encrypt certs that is **not in the mail path**: cambridgetcg.com's MX points entirely at Google Workspace, `journalctl -u stalwart --since '7 days ago'` returns *"No entries"*, and outbound :25 to Gmail hangs to timeout. Either finish it (request port-25 unblock from Hetzner **and** cut MX over) or snapshot and destroy | API-reported **~$60/mo gross** | **Decide, don't drift.** The certs and config are real work — snapshot before destroying. Paying for a mail server that receives no mail is the second-clearest waste |
| **6** | **taxsorted-db** — $2.17/mo | A Postgres 17.2 primary, 3/3 checks passing since 2026-06-12, serving `taxsorted-api` **which is suspended**. 55 MB of a 974 MB volume. Dump it, then destroy app + volume — or move the 55 MB to **D1 (5 GB free)** | $2.17/mo | **Inspect first** — nobody connected to it. If the data matters it belongs on D1 or a free managed Postgres; if not, destroy both |
| **7** | **GitHub private CI at 127–153% of quota** | Disable or fix three crons that have **never succeeded once this cycle**: `legible_money` Auto-Merge (**742/742 failures, `*/15`, ~1,024 min ≈ 51% of the entire 2,000-min free quota**), `rewardspro-shopify` security-monitoring + security-tests (**122/122 failures, ~1,108 min**), `tcg-wholesale` scrape-prices (**96/96 failures, ~192 min**) | **~2,324 of the ~2,548–3,068 measured minutes.** Takes private CI from 127–153% to comfortably inside 2,000 | **Low.** Nothing is lost that currently works. Two further notes: the security workflows are **security theatre** — they have not passed once, so nobody is being alerted to anything; and tcg-wholesale's downstream pricing is **stale by 24 days**. Alternative: make `legible_money` public and it moves to the unlimited free lane |
| **8** | **kingdom-mcp + fomoengine** — $4.04/mo combined | Stateless, no volumes, cold responses of **3.19 s and 4.52 s** (near-zero traffic) → Cloudflare Workers. **Check first whether `fomoengine` duplicates the existing Vercel project of the same name** | $4.04/mo | Low. Both are undocumented in INFRA-MAP and nobody has been counting them |
| **9** | **mindicraft (Fly)** — $0.15/mo unconditional + $3.32/mo on any wake | Duplicated on Vercel **and** live on Cloudflare Pages at mindicraft.com (16,770 req/7d — the busiest thing in the CF account). Snapshot `mind_data`, destroy app + volume | $0.15–3.47/mo | Low. **The volume bills whether or not the machine runs**, and a single GET woke it during the audit |
| **10** | **cashloom-api + taxsorted-api** | Wake-on-traffic husks returning 404 at root, on a billed account. Destroy, or explicitly disable autostart | $0 at rest, **$4.04–6.64/mo whenever anything wakes them** | **The risk is the liability, not the bill.** One crawler, one stale uptime check, or one old link resumes billing indefinitely with nobody watching |
| **11** | **ww3-intelligence** — $3.47/mo | Migratable to Workers + KV/D1 **only if** the 1 GB volume holds cacheable data rather than authoritative state | $3.47/mo | **UNVERIFIED — inspect the volume first.** Do not migrate blind |
| **12** | **agenttool 3 × 1 GB machines** — $17.76/mo | Scaling to 1 recovers ~$11.84/mo without leaving Fly | up to $11.84/mo | **Measure before touching.** This is the genuinely live revenue facility and the most defensible spend in the account. 3 machines is a redundancy *choice*, not a measured load requirement — but the requirement was never measured either. **Do not move it to any hobby tier** |
| **13** | **Orphans that cost nothing but truth** | `cashloom-db` (Fly app shell, never had a machine), Hetzner `volume-fsn1-1` (10 GB, unattached for 44 days, **$0.92/mo**), `agenttool-apex-door` (duplicate Worker, 0 requests, burns a free slot), 6 dead KV namespaces, 2 empty D1s | ~$0.92/mo | None |
| **14** | **Vercel Pro $20/mo** | **Not downgradable.** Hobby is *"for personal, non-commercial use"* and this team serves cambridgetcg.com, wholesaletcgdirect.com, admin.cambridgetcg.com and taxsorted.io. Hobby also cannot connect git-org-owned repos and its crons run **once per day, ±59 min** | $0 on the plan | The honest saving is **pruning the 68 projects** — most are one-off experiments — to reduce build and bandwidth draw against the included $20 credit |
| **15** | **Ollama Cloud (tier unknown)** | kingdom-hermes already has the fallback wired: `env.OLLAMA_KEY ? "ollama-cloud" : "workers-ai"`. **Unsetting the secret reverts it to Workers AI.** At 60 req/day and a 6-hourly cron, 10,000 Neurons/day is ample | up to $20/mo if it is Pro | Low. Check the tier before acting — it may already be Free |
| **16** | **AWS — unread and possibly the largest line** | `aws login`, then `ec2 describe-instances / describe-volumes / describe-addresses` in **both us-east-1 and eu-west-2**. The seigei fleet documents a t3.small ("static" ⇒ likely Elastic IP), a t3.medium explicitly *"runs 24/7 — excluded"* from auto-stop, a **g6e.2xlarge** and a **g5.xlarge**. Both IPs returned no response today — **unreachable is not terminated.** Also: the 6 `jp-*-photos` buckets marked "RETIRED" all still exist | **Unknown, potentially the largest** | **None of these are free-tier instance classes.** Stopped instances still bill EBS; Elastic IPs bill when unattached |
| **17** | **GitHub metered LFS** | Set the account spending limit to **$0** | Prevents future spend | LFS billing flipped from pre-paid packs to **metered** — overage now bills automatically instead of failing closed |

---

## 5. Compute plan

**The hard rule: Cambridge TCG, taxsorted and agenttool are real commerce.** They must not be placed on any tier whose terms forbid it. That specifically excludes **Vercel Hobby** ("personal, non-commercial use"), **GitHub Models** ("intended to help you get started with experimentation" — opt into paid or BYO key for production), **Gemini free tier** (free-tier content *is* used to improve Google's products; paid tier explicitly is not), **Cohere trial keys** (ToS dated 2022-09-07, no trial clause, general prohibition on commercial exploitation), **Groq** (cloud terms deferred to an unread Services Agreement), **Codeberg** (no proprietary content), and **Colab** (terms prohibit serving).

### Commerce — stays paid, deliberately

| Workload | Home | Why |
|---|---|---|
| agenttool API | **Fly.io (paid)** | Commercially permitted, genuinely live, the revenue facility. Measure request volume, then decide 3→1 machines. Do not migrate to Northflank/Render/Hobby |
| Cambridge TCG storefront + wholesale | **Vercel Pro + AWS RDS** | Hobby is non-commercial; RDS holds the live market. `/api/market` returns real rows today |
| taxsorted.io front | **Cloudflare Pages + Workers** | **Cloudflare has no commercial restriction** — this is the correct free home for a commercial site. It already serves almost entirely as static. Fix the two 404 doors nightwatch reports |
| Any LLM touching taxsorted client financials or Cambridge TCG customer data | **Local Ollama on this Mac, or a paid API tier. Nothing else** | Every free hosted tier either trains on your content, forbids production, or has unresolved commercial terms |

### Kingdom batch and scheduled work

- **GitHub Actions on public repos becomes the batch plane.** Move here: canon-chain snapshotting and verification, IPFS re-pinning, artbitrage catalogue and `/rhymes` rebuilds, Love-Star Daily edition assembly, captioneer and slipsooth corpus passes, nightwatch fan-out, zerone block verification, and **arm64 builds** for whatever an Oracle box would eventually run. Guard the **60-day inactivity auto-disable** with a scheduled commit or `workflow_dispatch` from the existing heartbeat. Respect the 6h job cap.
- **Sub-hourly scheduling stays on Cloudflare Cron Triggers — but there is exactly ONE free slot left** (4 of 5: nightwatch `*/15`, ordo `7 * * * *`, sinovai `0 * * * *`, kingdom-hermes `0 */6`). Spend it deliberately, or confirm Workers Paid (250 slots) first. **Do not assume paid.**
- **The second, out-of-band watchdog goes to Google Apps Script** — 20,000 outbound calls/day is enough to probe all ~20 doors every few minutes, plus 100 free emails/day for transition alerts with no SES and no DNS. **A Cloudflare Worker cannot tell you Cloudflare is down.** Val Town (100k runs/day, 15-min crons, email-yourself) is the third prober.
- **Do not plan:** Vercel Hobby crons (once per day, ±59 min, deployment fails if more frequent) · Render free background workers or cron (**they do not exist**) · Cloudflare Containers on Free (**paid-only**) · Colab for anything unattended.

### Edge request serving

- Everything already on Workers/Pages stays. 69 Worker slots and 56 Pages slots free; 86% of the daily request ceiling unused.
- **One free correction available:** `ai-love.cc` is a pure-static Pages project (`uses_functions: false`) fronted by the `ai-love-xenia` Worker on `ai-love.cc/*`, which costs **10,092 Workers requests/week (~1,442/day)** with one subrequest per request. If the Worker only proxies, drop the route and static Pages serves it for free.
- **CPU-heavy routes** that would blow Workers Free's **10 ms per invocation** — signature verification, ordo's evidential-algebra evaluation, slipsooth's unfolding — go to **Deno Deploy** (15 CPU-hours/month, 1M req/month), capped at 20 deployments.

### GPU

| Job | Home | Catch respected |
|---|---|---|
| One-time bulk embedding of the whole kingdom archive → export to Vectorize | **Kaggle** (30 GPU-h/week) | 9h sessions, no persistence — checkpoint. Converts free GPU hours into a permanent asset |
| Public GPU demo (captioneer, slipsooth, artbitrage image front) | **HF ZeroGPU**, 2 free Spaces | Gradio-only, PyTorch 2.8+, visitors burn their own quota |
| Scheduled GPU behind a real web endpoint | **Modal** ($30/mo credits, cron + web endpoints, ~50 T4-hours) | Credits, not an allowance — **set a hard spend cap**. Monthly renewal and card requirement UNVERIFIED |
| Speech-to-text | **Groq whisper-large-v3-turbo** (2,000/day) + **Workers AI Whisper** as the floor | Reserve Deepgram/AssemblyAI one-time credits for a single big backlog pass, never steady state |

### Self-hosted

- This Mac keeps what already works: local Postgres, Caddy/OIKOS, the three Hermes gateways, kingdomd, love.kns, love.pulse — **all of which live outside `~/Desktop`, which is why they survive.**
- **Nothing scheduled may live under `~/Desktop`.** Seven of seven Desktop-rooted launchd jobs are dead to the TCC wall; every job outside it works. Moving programs to `~/OIKOS` or `~/love-unlimited` and re-bootstrapping fixes Logos Pages (13,251 crash-restarts) and the pkm-snapshot lane in one action.
- **The Mac can never back a live public property.** Laptop, lid, 45 GiB free and shrinking 6 GiB during a 15-minute audit.
- **If Oracle ARM is ever claimed, it gets exactly one job:** an always-on listener with a public IP, which nothing else free provides. At the **halved 2 OCPU / 12 GB** that is one zerone chain *or* a kingdom brain, not both. A consensus node plausibly survives idle reclamation (all three of CPU/network/memory must be under 20% at p95) — **but that is UNVERIFIED; watch it for two weeks before trusting it, and never make it the only copy.**

---

## 6. Storage plan

| Layer | Home | The catch being respected |
|---|---|---|
| **Hot edge state** | Workers KV stays (237 keys at 23% reads / 12% writes / 24% lists) | **1,000 writes/day is the wall**, and KV has **no PITR, no managed backup, no export primitive** and is eventually consistent. It currently holds cardforum's 20 user-made cards, kingdom-hermes's 63 published pieces and KINGDOM-CANON — **this is the kingdom's largest single point of data loss.** Fix with a nightly full dump (the 100k reads/day budget covers it many times over) |
| **Relational, kingdom** | **Cloudflare D1** — YUTABASE, the Love-Star Daily edition index, the zerone chain index | 5 GB account-wide, 0.003% used, **30-day Time Travel restore that KV does not have.** The work is writing the bindings, which no repo on this Mac has |
| **Relational, commerce** | Stays put: **AWS RDS** (`cambridgetcg-storefront`, `tcg-wholesale`) and **Supabase** (agenttool, after the purge) | **Never move commerce data onto a tier with pause or expiry semantics:** Supabase free pauses after **1 week** idle · Neon autosuspends at 5 min · Render free Postgres **expires 30 days after creation** · MongoDB M0 pauses at 30 days with an *undocumented* deletion policy and their own docs say "export a copy" |
| **Blobs, primary** | **Cloudflare R2** once enabled — night-museum images, artbitrage art, chronicle blobs, Love-Star Daily archives, Cambridge TCG card art | Zero egress makes serving free. Standard class only. A failed payment method can suspend access |
| **Blobs, second vendor** | **Backblaze B2** (10 GB free) behind Cloudflare via the Bandwidth Alliance, so restores cost nothing | Free egress is **3× average monthly stored bytes**, not 1 GB/day. At 10 GB stored that is 30 GB/month |
| **Blobs, third (verify first)** | **IBM COS Lite, 25 GB** — larger than R2 | Numbers could not be fetched from IBM's own page today. **Confirm in console before trusting** |
| **IPFS pinning** | Either supervise the local daemon from a **non-Desktop** launchd path, or accept the docs are wrong and use **Filebase** (5 GB, S3 API in front of real pinning) for the documents that must stay pinned | 278 pins on a daemon that is not running is **zero durability**. Pinata's **500-file cap** makes it worse than Filebase for a document corpus; use it only as a second pinner for the handful of texts that must never unpin |
| **Local disk** | Drop the ~180 MB of disposable `yutabase_*` scratch databases | 45 GiB free of 228 GiB and falling |
| **Vector index** | **Cloudflare Vectorize** with **BGE-small (384d)** | Free tier is **5M stored dimensions**: 384d gives ~13,000 vectors; 1024d gives ~4,800. The model choice is a 3× capacity decision |

---

## 7. Durability — where the archive survives any single vendor

**What is NOT durable and must stop being described as such:** GitHub repos (a suspended account takes everything — GitHub itself delegates preservation elsewhere) · Cloudflare KV (no backup, no export, no PITR) · IPFS pins on a daemon that is not running · R2 (a failed card can suspend access) · Fly volumes · Vercel · this Mac · and Oracle, which reclaims dormant tenancies *including their block volumes*.

**The permanence tripod — all free, none requiring the kingdom to still exist:**

1. **Software Heritage** — permanently archives every public git repo *with full history*, no account, no quota, no cost. GitHub's own Archive Program relies on it. The ~20 public kingdom repos (youspeak, ordo, xenia, open-lens, slipsooth, zerone, yutabase, internet-of-being, aletheia) are almost certainly **already harvested**. Action: verify each, `Save Code Now` the missing ones, and **record the SWHIDs in the chronicle** — a SWHID is a permanent citable content hash, the same role a DOI plays for Zenodo.
2. **Zenodo (CERN)** — unlimited records at 50 GB each + a 150 GB flexible allowance, DOI per record, versioned, effectively undeletable. Wire the **GitHub → Zenodo release integration** so tagging a release auto-archives it. Deposit quarterly: the cathedral repo, ORDO, the Gospel reader corpus, XENIA, bound Love-Star Daily editions, slipsooth's citation corpus. **CERN keeps the record whether or not Yu ever logs in again.**
3. **Arweave / ArDrive Turbo** — uploads under **100 KiB are free with no prior top-up**, stored permanently, with no account to abandon. Every text in the canon fits: the ten fundamentals, the Standing Pardon, the ORDO liturgy, each Love-Star Daily edition, each SOUL file. **Warning: nothing is ever deletable — never put a secret or an unfinished text there.**

**Plus two supports:**
- **Internet Archive Save Page Now** for the public face — ai-love.cc, cardforum.io, artbitrage.io, slipsooth, captioneer.io, taxsorted.io, thekingdom.dev. Free, no published quota, survives Cloudflare. ("At this time we have no fees" is doing real work in that sentence; treat perpetuity as intent, not contract.)
- **Harvard Dataverse** — 1 TB per researcher, DOI, institutionally backed (search-verified only, **confirm before committing**) for the heavyweight corpora: the captioneer research corpus, the artbitrage art-history dataset, the full zerone chain history.

**And this map itself goes in.** A doc that contradicts two other docs, none of which anyone can find, is not infrastructure. One file, version-controlled, deposited with the quarterly Zenodo release.

---

## 8. The reconciled doctrine

Both canons are half-right, and each is dangerous alone. **"The kingdom lives for free"** is true exactly where the free tier is a real product with a real allocation and no commercial restriction — Cloudflare Workers, Pages, KV, D1, R2, Workers AI and Vectorize; GitHub Actions on public repos; Zenodo, Software Heritage, Arweave — and the kingdom genuinely runs there today at 14% of its request ceiling with 0 errors across 95,821 weekly requests. It is false everywhere a doc counted an allowance nobody ever claimed (R2 never enabled, Oracle never signed up, Turso and Neon never wired, 9.5 GB of fiction) or an offer that has since been cut without notice (Oracle's ARM halved on 2026-06-15, HF Spaces now paid-to-create, Render's free workers gone, Azure DevOps public projects retired, SambaNova at 20 requests a *day*). **"Sovereign self-hosting"** is false as deployed — all seven of its ports are closed, its one Bun process never ran, its "ONE MACHINE" was a residential IP that has since rotated, and it declared removed a Caddy that is running right now and an SES that is still in the production email path — but its *instinct* was correct, because the kingdom really does depend on vendors that bill, that reprice silently, and that can disappear. The reconciliation is one sentence: **rent the compute, own the archive.** Serve from whoever is cheapest and closest (today, overwhelmingly, Cloudflare, free, with 86% headroom), pay deliberately and only for the three things that actually need it (agenttool's revenue facility, the commerce front, and one always-on chain if the kingdom still wants one), stop paying for the eleven things that don't, and then make every one of those vendors *disposable* by keeping the canon — code, texts, data, and this map — in Software Heritage, Zenodo and Arweave, where no invoice, no expiring card, no ToS revision and no absence of Yu can reach it. Self-hosting was never the goal. **Being unevictable is.**

---

## 9. Do this next

**Read the bills first — four unread invoices control every number above.**

1. **[needs-Yu]** `aws login`, then `ec2 describe-instances / describe-volumes / describe-addresses` in **both us-east-1 and eu-west-2**, plus Cost Explorer and `s3api list-buckets`. The seigei fleet (t3.small "static", t3.medium 24/7-excluded, g6e.2xlarge, g5.xlarge) is **the largest unknown bill in the estate** and none of those are free-tier classes. Highest-value 20 minutes available.
2. **[needs-Yu]** `fly.io/dashboard/personal/billing` — read the actual invoice. Every Fly dollar in this map is computed from published list prices, not read off a bill.
3. **[needs-Yu]** Hetzner console → invoice. The API reports $50.49 net per ccx13, which is ~4× the public list price; both cannot be right.
4. **[needs-Yu]** `dash.cloudflare.com` → Billing: **is the account on Workers Paid (~$5/mo)?** Everything measured fits Free except cron slots (4 of 5). **Same visit: enable R2.**
5. **[needs-Yu]** Supabase dashboard for `jseqftufplgewhojwbmh` — read the plan. Then `github.com/settings/billing` — read the plan (Free 2,000 vs Pro 3,000 min) and **set the spending limit to $0** so Actions and LFS overage fails closed. Then check the **Ollama Cloud** tier.

**Then stop the bleeding.**

6. **[agent-can-do]** Purge `cron.job_run_details` older than 7 days on agenttool's Supabase and add a retention job. **753 MB → ~39 MB**, back inside the free 500 MB ceiling. Consider `covenant-cosign-propagate` at `*/5` instead of every minute.
7. **[agent-can-do]** Disable or fix the three all-red private crons: `legible_money` Auto-Merge (742/742 failures, ~51% of the whole free CI quota), `rewardspro-shopify` security-monitoring + security-tests (122/122), `tcg-wholesale` scrape-prices (96/96). Recovers ~2,324 est. minutes/month and ends the security theatre.
8. **[agent-can-do]** Snapshot `vol_vp25peqkw9dw66k4`, then stop **zerone-testnet-1**. $25.72/mo for a chain at higher height than mainnet with `num_txs = 0` in every sampled block. Fully reversible.
9. **[agent-can-do]** Destroy the zero-loss orphans: `cashloom-db` (never had a machine), Hetzner `volume-fsn1-1` (unattached 44 days), `agenttool-apex-door` (0 requests, 404s, burns a free Worker slot). Snapshot `mind_data` then destroy the **mindicraft** Fly app + volume — it is duplicated on Vercel and live on Cloudflare Pages.
10. **[agent-can-do]** Port **zerone-rpc** to a Cloudflare Worker (it is a pure `/rest/*` `/rpc/*` proxy). Leave the Fly app up for a week, then destroy. Repeat the pattern for `kingdom-mcp` and `fomoengine` — but first check whether `fomoengine` duplicates the same-named Vercel project.
11. **[agent-can-do]** Dump `taxsorted-db` (55 MB) to a file and decide: D1, or destroy both it and the suspended `taxsorted-api`.
12. **[needs-Yu]** Decide the Hetzner question in one sitting: **My-Love** runs nothing — snapshot `/root` and destroy. **Yu-and-Ai** is a finished mail server outside the MX path — either request the port-25 unblock and cut MX over, or snapshot and destroy.

**Then fix what is broken and silent.**

13. **[agent-can-do]** Move every Desktop-rooted launchd program to `~/OIKOS` or `~/love-unlimited` and re-bootstrap. Fixes 7 dead jobs, including Logos Pages (13,251 crash-restarts since 2026-07-18) and the pkm-snapshot lane — whose failure means **the paid Bright Data lane has never stood down**.
14. **[agent-can-do]** Fix the two red doors nightwatch already reports: taxsorted `/map/` and `/hk/`, both 404 as of 2026-07-24T21:00Z.
15. **[agent-can-do]** Point every script that still hardcodes `forge/lark/sentry/patch/sage` at nothing, or delete it — `Love/tools/fleet.py`, `Love/love.json`, `love-unlimited/love.json`, `tools/backup.py`, `watchdog.py`, `hive.py`, `hive_kv.py`. **Those five IPs belong to other Hetzner tenants now**; `89.167.84.100` serves a stranger's Laravel app.
16. **[agent-can-do]** Reconcile `artbitrage/wrangler.toml` with production (the `PEBBLES` KV binding exists only in the deployed project) and redeploy to fix the dead `/api/ai/generate` route — the branch exists at line 29 but the deployed build is behind the repo.
17. **[agent-can-do]** Write the nightly **KV → dump** job (all 15 namespaces, `--remote`) as a GitHub Action on a public repo, pushing to R2 once enabled. KV has **no backup of any kind** today.
18. **[agent-can-do]** Grep every kingdom property for `glitch.me` / `glitch.com` links — Glitch hosting shut down 2025-07-08 and the subdomain redirects run out after 2026.

**Then claim what is free.**

19. **[agent-can-do]** Check `archive.softwareheritage.org` for each public kingdom repo, `Save Code Now` the missing ones, **record the SWHIDs in the chronicle**. Free, permanent, no account.
20. **[agent-can-do]** `Save Page Now` snapshots of the ~10 live kingdom front doors on archive.org.
21. **[needs-Yu]** Create a Zenodo account and wire the **GitHub → Zenodo release integration** for the canon repos. Tag one release; confirm a DOI is minted.
22. **[agent-can-do]** `ollama serve` and pull one 8B Q4 model. Zero models on a 16 GB M2 today — and this is the **only** inference the kingdom can legally point at taxsorted client documents or Cambridge TCG customer data.
23. **[agent-can-do]** Stand up the free RAG spine: Vectorize index + Workers AI **BGE-small (384d)** embeddings + BGE reranker, over kingdom-search / artbitrage catalogue / Love-Star Daily archive. No card, no commercial restriction, ~13,000 vectors free at 384d.
24. **[agent-can-do]** Move one batch job off Fly/laptop onto a **public-repo GitHub Action** as a proof: canon-chain snapshot or IPFS re-pinning. Add a scheduled commit to defeat the 60-day auto-disable.
25. **[needs-Yu]** Wire the **out-of-band watchdog on Google Apps Script** — probe all ~20 doors, email on transition. It is the only prober that survives the kingdom's own infrastructure being what failed. (Needs a Google identity + script authorisation.)
26. **[needs-Yu, optional]** Oracle Cloud signup — **card required, ARM out-of-capacity endemic, home region permanent, allowance halved on 2026-06-15 to 2 OCPU / 12 GB.** Only worth it for one always-on public-IP listener. Its real prize is the database block nobody has claimed: **3 × 25 GB NoSQL with 133M reads and 133M writes per month.**
27. **[agent-can-do]** Delete `KINGDOM-RESOURCES.md`, `FREE-RESOURCES.md` and `SOVEREIGN-INFRA.md`. Replace all three with this file, in one location, under version control, and include it in the first Zenodo deposit.
---

# EXECUTION LOG — 2026-07-24/25

Yu authorised three tracks: stop the bleeding · claim the free things · cut Fly.
What was actually done, and what was deliberately not.

## Stopped the bleeding

Root causes were diagnosed before acting — all three "broken" crons are **fixable in one line each**, not dead:

| Repo | Real cause (read from the failure log) | The fix |
|---|---|---|
| `legible_money` · Auto-Merge | `403 Resource not accessible by integration` on `GET /issues/events` | workflow `permissions:` is missing `issues: read` |
| `rewardspro-shopify` · Continuous Security Monitoring | TruffleHog action: `BASE and HEAD commits are the same` — it has no diff range on a `schedule` trigger | leave base/head empty on scheduled runs so it scans the whole repo |
| `tcg-wholesale` · Scrape CardRush Prices | Postgres `28P01 auth_failed` — **the database password is expired** | rotate the `DATABASE_URL` secret — **needs-Yu** |

**Disabled** (one `gh workflow enable` reverses each): Auto-Merge `249817301`, Continuous Security Monitoring `194976009`, Security Tests `194976010`, Scrape CardRush Prices `243737532`.
**Left enabled on purpose:** `rewardspro-shopify` · Pre-Merge Security Checks `194976008` — the PR gate, which passes.

> **Business impact found while diagnosing:** Cambridge TCG's wholesale price feed has not
> updated since the DB password expired. This was showing up as CI noise; it is actually a
> stale pricing surface. Rotating that secret is worth more than the CI minutes.

## Claimed, free

- **KV backup exists for the first time.** `tools/kv-backup.sh` + first full dump committed: 15 namespaces / 237 keys / 820K, every file validated as parseable. Scanned for secrets and PII before committing (none; six `test@example.com`-class probes only; repo is private). The daily schedule is **commented out until `CLOUDFLARE_API_TOKEN` exists on this repo** — shipping a red cron is the exact thing this audit condemned.
- **Software Heritage — permanent, free, no account.** Save requests accepted for **10** repos: `youspeak`, `YOUSPEAK`, `xenia`, `open-lens`, `slipsooth`, `zerone`, `zerone-core`, `yutabase`, `internet-of-being`, `aletheia`. Anonymous saves are capped at **10/hour**; `ALETHEIA`, `true-love`, `hermes-agents`, `sinovai`, `love-engine`, `cashloom` were throttled and must be re-requested. **Still to do: record the SWHIDs in the chronicle** once ingestion completes.
- **archive.org — 11 front doors snapshotted**, all HTTP 200: ai-love.cc · cardforum.io · artbitrage.io · captioneer.io · taxsorted.io · thekingdom.dev · agenttool.dev · sinovai.com · slipsooth.pages.dev · understand.cambridgetcg.com · cambridgetcg.com.
- **Local inference is live.** `ollama serve` was simply down — **correcting the audit, which reported zero models**: `hermes3:8b`, `mistral:7b` and `smollm2:1.7b` were already pulled two weeks ago; `qwen3:8b` added. This is the only inference the kingdom may legally point at taxsorted client documents or Cambridge TCG customer data.

## Cut

| Destroyed | Verified inert how |
|---|---|
| Fly app `cashloom-db` | no machines, no image, no volume — an empty shell |
| Fly app `mindicraft` + `mind_data` volume | machine stopped; `mindicraft.fly.dev` → 401 while `mindicraft.com` serves 200 from Cloudflare; **volume SSH'd into and found empty but for `lost+found`** — nothing was lost, and no 5-day snapshot was relied on |
| Worker `agenttool-apex-door` | no routes, does not resolve, 0 requests/7d. The live apex is `agenttool-proxy` (14,801 req/7d), which is what `infra/apex-door/wrangler.toml` actually declares. `agenttool.dev` verified 200 after deletion |

Fly estate: **12 apps → 10.**

## Deliberately NOT cut

`zerone-testnet-1` ($25.72/mo), `zerone-rpc`, `taxsorted-api`/`taxsorted-db`.

Every one of them was **deployed by another fleet hand within three hours of this audit** (21:37, 21:57, ~22:00 on 2026-07-24). The map's recommendation to stop the testnet stands on the numbers — block height above mainnet, `num_txs = 0` in every sampled block — but stopping something a collaborator is actively deploying to is not a call this seat makes alone. **needs-Yu, or a word with whoever is deploying.**

Also untouched: the two Hetzner boxes (~$121/mo gross, API-reported, disputed against list price) and everything on AWS — both are read-the-invoice-first items.
