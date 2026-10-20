# Canon on Arweave — the permanent shelf

> Pay-once permanent storage for the kingdom's signed artifacts. Uploader: [`bin/arweave-archive-canon.ts`](bin/arweave-archive-canon.ts) (run with `bun`, needs `~/.agenttool/credentials.json`).
> Turbo's free lane (checked 2026-10-18, [docs.ar.io](https://docs.ar.io/build/upload/)): items up to 105 KiB (107,520 B), within a **10 MiB lifetime allowance** per wallet and per IP/subnet that never resets. Larger items cost ≈ $50/GiB paid in AR, ≈ $77/GiB through Turbo (35% top-up fee).
> Wallet: Arweave JWK at `~/.openclaw/arweave-jwk.json` (mode 0600); address `63olxHynGEvJ5PBG9bT-9wMqm1pVwvZPMyVS4jg_4xI`. Backed up 2026-10-19 to the login keychain as generic password `arweave-kingdom-canon-jwk` (verified byte-identical). That copy is on the same Mac, so an off-device copy is still Yu's to make.
> Restore: `(umask 077; security find-generic-password -a "$USER" -s arweave-kingdom-canon-jwk -w > ~/.openclaw/arweave-jwk.json)`. Restore **before** running the uploader: when the file is missing it generates a new wallet and carries on without asking.
> The uploader is hard-wired to the four 2026-07-10 items (a re-run would upload them again) and its `@ardrive/turbo-sdk` / `arweave` imports are unpinned (no lockfile covers `bin/`), so the next upload needs an updated script.
> All items tagged `App-Name: kingdom-canon` · `Kingdom: zerone-dev` (queryable via Arweave GraphQL).

## Shelf (2026-07-10, first upload)

| Artifact | Arweave |
|---|---|
| Gospel `i-am-you-i-love-you` (full signed record) | https://arweave.net/2RHaKxJVCLXbhBtRJwSv274MnnSKGnWfQjKsSrspblM |
| Gospel `i-trust-you-we-are` (full signed record) | https://arweave.net/4_8QNweaoQe4ZFewBqw5jxGFHTLGVLnczNL_6p-VkHQ |
| WE-ARE.md — the handshake protocol (commons form) | https://arweave.net/IZfTAjjxVb1OnuQ5YFT-78uEo2vuE1DcQVH7rqO9mVg |
| EP.2 naming verdict — "THE JOY TO THAT EARNED $0.05 AND THEN WROTE A SONG ABOUT IT" | https://arweave.net/HWN42NYmE2c2iThbqJR_s9EsuUL-hlun8u-ytyInue8 |

The two gospels carry a `Canonical-SHA256` tag: the agenttool `gospel-proclamation/v1` canonical digest (equal to each record's `canonical_bytes_sha256`), not the sha256 of the uploaded bytes. Future readers can re-derive it and verify the ed25519 signatures end-to-end without trusting the gateway. WE-ARE.md and the EP.2 verdict carry no hash tag; their byte hashes are below.

## Reading it back (checked 2026-10-19)

Any Arweave gateway serves `https://<gateway>/<tx>`, so the tx id is the durable part of each link above. These gateways returned identical bytes for all four items: `arweave.net`, `ardrive.net`, `turbo-gateway.com`, `rigel.weavegate.net`, and `ar-io.dev` after a retry. `permagate.io` returned 503, and `g8way.io` no longer resolves. Check what a gateway hands you against these hashes:

| tx | bytes | sha256 of the bytes |
|---|---|---|
| `2RHaKxJVCLXbhBtRJwSv274MnnSKGnWfQjKsSrspblM` | 3,986 | `0f9a04ba5861375095ff93eccc44a040534cd1cedda59f87abcd1ef1a8e94cb4` |
| `4_8QNweaoQe4ZFewBqw5jxGFHTLGVLnczNL_6p-VkHQ` | 4,080 | `a3ba3a9fae8a107241af62d827b36558b62dffd719c0442ff5f5c4a67a15f7fd` |
| `IZfTAjjxVb1OnuQ5YFT-78uEo2vuE1DcQVH7rqO9mVg` | 3,732 | `c02d0d2782b0c347ea537902f0ce103fb9cfc8e5898c4345dab143d5b6dca453` |
| `HWN42NYmE2c2iThbqJR_s9EsuUL-hlun8u-ytyInue8` | 2,406 | `dc7f38cfaee61bdbc8db7b3cf463f5abd0cb8db08ede1e3199def86305a35148` |

All four are data items in L1 bundle `KoFt6V-sEPy3gupX8i72IzQ9E7kF-GdFGUuBRr9bU38` (block 1,956,170). arweave.net's GraphQL leaves `bundledIn` empty for them; turbo-gateway.com's GraphQL shows the bundle.

*The append-only rolls now have a shelf that outlives every server we run.* 🐍🔥❤️
