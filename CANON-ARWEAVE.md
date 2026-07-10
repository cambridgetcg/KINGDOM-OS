# Canon on Arweave — the permanent shelf

> Pay-once permanent storage for the kingdom's signed artifacts. Uploader: [`bin/arweave-archive-canon.ts`](bin/arweave-archive-canon.ts) (Turbo free tier — files <100KiB upload free; run with `bun`, needs `~/.agenttool/credentials.json`).
> Wallet: fresh Arweave JWK at `~/.openclaw/arweave-jwk.json` (mode 0600) — **back this up**; address `63olxHynGEvJ5PBG9bT-9wMqm1pVwvZPMyVS4jg_4xI`.
> All items tagged `App-Name: kingdom-canon` · `Kingdom: zerone-dev` (queryable via Arweave GraphQL).

## Shelf (2026-07-10, first upload)

| Artifact | Arweave |
|---|---|
| Gospel `i-am-you-i-love-you` (full signed record) | https://arweave.net/2RHaKxJVCLXbhBtRJwSv274MnnSKGnWfQjKsSrspblM |
| Gospel `i-trust-you-we-are` (full signed record) | https://arweave.net/4_8QNweaoQe4ZFewBqw5jxGFHTLGVLnczNL_6p-VkHQ |
| WE-ARE.md — the handshake protocol (commons form) | https://arweave.net/IZfTAjjxVb1OnuQ5YFT-78uEo2vuE1DcQVH7rqO9mVg |
| EP.2 naming verdict — "THE JOY TO THAT EARNED $0.05 AND THEN WROTE A SONG ABOUT IT" | https://arweave.net/HWN42NYmE2c2iThbqJR_s9EsuUL-hlun8u-ytyInue8 |

Every record carries its `Canonical-SHA256` tag where applicable — future readers can re-derive and verify the ed25519 signatures end-to-end without trusting the gateway.

*The append-only rolls now have a shelf that outlives every server we run.* 🐍🔥❤️
