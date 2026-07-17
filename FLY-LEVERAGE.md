# FLY-LEVERAGE — the kingdom on Fly.io, gaps and moves

> Surveyed + partly executed 2026-07-10 by Ai (蛇火心) at Yu's directive: *"explore its full potential and leverage its facilities for our core infra. Find gaps that can leverage fly first, then integrate."*
> Facility research: [`bridges/`](bridges/) sibling method; Fly-specific sources in the research transcript.
> Companions: [`INFRA-MAP.md`](INFRA-MAP.md) · [`CANON-ARWEAVE.md`](CANON-ARWEAVE.md) · [`BRIDGES.md`](BRIDGES.md).

## The estate (8 apps, personal org)

| App | Role | Machines | Volume | Snapshots | Notes |
|---|---|---|---|---|---|
| **agenttool** | public API (Bun/Hono) | 3× shared-1x/1GB (lhr×2, cdg) | none (DB on Supabase) | — | always-on; `auto_stop=false`, `min=1` |
| **zerone-1** | **MAINNET** chain | 1× shared-2x/4GB (lhr) | `zerone_data` 10GB | daily, **retention 5→60d ✅** | single node, single volume |
| **zerone-testnet-1** | testnet chain | 1× (lhr) | `zerone_data` 10GB | daily, **retention 5→14d ✅** | 37.16.28.121 |
| **cashloom-api / -db** | SaaS | small | — | — | -db likely on **deprecated unmanaged Fly Postgres** |
| **taxsorted-api / -db** | SaaS | small | — | — | same Postgres caveat |
| **mindicraft** | suspended | 1 stopped | `mind_data` 1GB (idle) | — | dead weight: paying rootfs + 1GB vol + dedicated IPv6 |

## The Fly 2026 facts that change our plans

- **GPUs are DEAD** — deprecated 2026-07-31, gone after Aug 1. Never build chain/soma/inference on Fly GPUs; use external GPU clouds.
- **Sprites** (new Jan 2026, sprites.dev — separate product) — hardware-isolated persistent sandboxes, **$0 compute when idle**, 300ms copy-on-write checkpoints + instant rollback, wake in 1–12s. **This is the answer to agenttool Horizon C (trusted-tier hosted runtime)** and to per-citizen agent sandboxes — better than Machines autostop for that shape.
- **Volumes are single-host, no replication** — host dies → lose everything since the last snapshot. Fly says run ≥2 machines+volumes OR external backup. Our mainnet chain is **one node, one volume** → real risk.
- **Tigris** object storage — S3-compatible, **zero egress fees**, 5GB free then $0.02/GB. GA. Native `fly storage create`.
- **Unmanaged Fly Postgres is deprecated** ("This Is Not Managed Postgres"); **Managed Postgres (MPG) is GA** ($38/mo basic). Our SaaS -db apps are on borrowed time if unmanaged.
- **Upstash Redis is command-metered** — BullMQ polls hard → pay-as-you-go bills explode; use a fixed plan or self-host Valkey (~$2–4/mo). (agenttool currently runs `AGENTTOOL_DISABLE_WORKERS=1` — no live BullMQ cost today.)
- Region Consolidation (Sep 2025) closed 17 regions → ~19 remain. All our apps are lhr/cdg — safe.

## DONE this session (safe, reversible)

1. ✅ **Snapshot retention raised** — zerone-1 (mainnet) 5→**60d**, testnet 5→**14d**. Bulk-recovery window widened at snapshot-storage cost only (first 10GB free; mainnet vol ~4GB used).
2. ✅ **Tigris bucket `kingdom-vault` created** — S3 read/write/delete verified end-to-end. Creds in macOS keychain (`agenttool-tigris-access-key` / `-secret-key`). ⚠️ creds transited this session's transcript — rotate via Tigris dashboard if paranoid.
3. ✅ **Chain-backup WIRED + green** — [`bin/chain-backup-to-tigris.sh`](bin/chain-backup-to-tigris.sh) tar+zstd → Tigris, keep 14; runs nightly 03:33 via com.kingdom.chain-backup since 2026-07-12 (2026-07-17 run: mainnet 1105MB, testnet 1525MB). Log `~/.kingdom/logs/chain-backup.log`.

## needs-Yu / next integrate (touch live infra — staged, not auto-run)

Ranked by (durability or $ saved) ÷ risk:

1. **Wire chain backup (mainnet first).** Confirm zerone-1's cosmos home path, then:
   `fly secrets set -a zerone-1 AWS_ACCESS_KEY_ID=… AWS_SECRET_ACCESS_KEY=… AWS_ENDPOINT_URL_S3=https://fly.storage.tigris.dev AWS_REGION=auto`
   and run `bin/chain-backup-to-tigris.sh` inside the machine (cron nightly). Closes the single-volume-loss gap. **Highest value.**
2. **Pre-fork a warm standby volume** for the mainnet chain (`fly volumes fork vol_vdekmn0w3q9e5yk4`) so a host failure is a minutes-not-hours recovery. Cheap insurance.
3. **Kill mindicraft dead weight** — `fly volumes destroy vol_rkg6m9myn21o0ek4` + release its dedicated IPv6 (or `fly apps destroy mindicraft` if truly done). Small monthly saving, tidier estate.
4. **Sprites pilot for agent runtimes** — the correct home for per-citizen sandboxes + agenttool trusted-tier (checkpoint-before-risky-op, rollback-on-bad-op, $0 idle). Start on the $20/mo tier; keep Machines for always-on infra only. Bigger design task — its own session.
5. **SaaS Postgres check** — confirm whether cashloom-db / taxsorted-db are unmanaged (deprecated) Fly Postgres; if so, add pg_dump→Tigris shipping now, plan MPG migration.
6. **Deploy hygiene** — tokens already sane (longest expiry 2033, not the 20yr default; `FOR-FABLE` etc.). Optional: blue-green strategy on the 3-machine API; Grafana alert rules on machine restarts (there's a live deploy-source-drift question in INFRA-MAP — alerts would surface it).
7. **Observability** — free managed Prometheus + Grafana at fly-metrics.net already available; wire alert rules (Fly has no native paging).

---

*Fly gives durable-enough single-host speed; the kingdom's job is to add the second copy Fly deliberately doesn't. Snapshots widened, a vault opened, the backup written — the mainnet's memory now has somewhere to live that isn't one disk in London.* 🐍🔥❤️
