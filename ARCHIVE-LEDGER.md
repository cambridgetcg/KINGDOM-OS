# ARCHIVE-LEDGER — 永久地址總帳

> Permanent citable addresses for the kingdom's canon: SWHIDs (Software Heritage),
> Arweave tx-ids, DOIs (Zenodo — column waits on Yu's account). Charter stone #3.
> A row here is a claim anyone can verify from a gateway the kingdom does not operate.

## THE LAWS — anchored 2026-07-29 (before any crown signs them)

| item | value |
|---|---|
| repo | github.com/cambridgetcg/kingdom-standard |
| file | STANDARD.md (the 42 laws) |
| pinned commit | `16b8517a936e13f298fe0856618fc3ffb94e515e` |
| **sha256 (laws_hash v1)** | `dfddd45b4da0db50d0ddb5d74b4e2ab3092cb4170c61fd163c20602c0fd70ccc` |
| bytes | 26,540 |
| Software Heritage | ingested — `swh:1:snp:2265d1f1806ad2bf7a79edaac47f9434d2992bc1` (visit 2026-07-29, verified) |
| Arweave | pending (Yu decision on wallet; laws are cleared for upload — finished canon) |

**This hash is what Coronation Rite signatures cover.** Amended laws get a new row and a
new laws_hash; crowns signed against v1 remain valid against v1 forever (charter 硃批 1).

## Repository snapshots (SWHIDs)

Status legend: `saved` = Save Code Now accepted · `resolved` = snapshot SWHID recorded ·
`throttled` = to re-request (anonymous cap 10/hour).

Every `resolved` SWHID below was verified 2026-07-29 by fetching
`https://archive.softwareheritage.org/api/1/snapshot/<hex>/` (HTTP 200). The six rows saved
2026-07-29 were resolved on 2026-10-19 from each origin's latest full visit
(`/api/1/origin/<url>/visit/latest/?require_snapshot=true`, HTTP 200), so their visit dates vary.
Resolve any of them at `https://archive.softwareheritage.org/swh:1:snp:<hex>`.

| origin | saved | snapshot SWHID (visit date) |
|---|---|---|
| github.com/cambridgetcg/youspeak | 2026-07-25 | `swh:1:snp:422905282dbf3f726e855564e390195f083d7235` (visit 2026-07-24) |
| github.com/cambridgetcg/YOUSPEAK | 2026-07-25 | `swh:1:snp:422905282dbf3f726e855564e390195f083d7235` (visit 2026-07-24) † |
| github.com/cambridgetcg/xenia | 2026-07-25 | `swh:1:snp:e4a7f53e0f28b3ca5beb482434e4957b2d040f37` (visit 2026-07-24) |
| github.com/cambridgetcg/open-lens | 2026-07-25 | `swh:1:snp:d5a79f9d67668c168adf196ce84356a33c733e46` (visit 2026-07-24) |
| github.com/cambridgetcg/slipsooth | 2026-07-25 | `swh:1:snp:8ffb549cdc2cdfe5ebd6aa65c2cd44d39288b9b0` (visit 2026-07-24) |
| github.com/cambridgetcg/zerone | 2026-07-25 | `swh:1:snp:178672363658e8343dc60a6f969a327673961cfc` (visit 2026-07-24) |
| github.com/cambridgetcg/zerone-core | 2026-07-25 | `swh:1:snp:011a412ea80a0c0ab3c0bc1b7845e84d10f9307f` (visit 2026-07-24) |
| github.com/cambridgetcg/yutabase | 2026-07-25 | `swh:1:snp:25ab12d6b825ce5996bd6557b0845531d4d2b1c4` (visit 2026-07-24) |
| github.com/cambridgetcg/internet-of-being | 2026-07-25 | `swh:1:snp:0b7cbb4fcc97014df15c88a70f601fb381397667` (visit 2026-07-24) |
| github.com/cambridgetcg/aletheia | 2026-07-25 | `swh:1:snp:50ab7dec6d1b9bc10b7edf56ebf937b312a2ddf7` (visit 2026-07-24) |
| github.com/cambridgetcg/kingdom-standard | 2026-07-29 | `swh:1:snp:2265d1f1806ad2bf7a79edaac47f9434d2992bc1` (visit 2026-07-29) |
| github.com/cambridgetcg/love-star-daily | 2026-07-29 | `swh:1:snp:bf205c3a7021aae168cf6ed34af2c8d1c196a984` (visit 2026-07-29) |
| github.com/cambridgetcg/agenttool | 2026-07-29 | `swh:1:snp:2639c2c6506c7f81bad4d6e6b9c2f98cb5b0ed62` (visit 2026-08-06) |
| github.com/cambridgetcg/corpus | 2026-07-29 | `swh:1:snp:48d1822e1d3b9f1b806bcece4371a0b9da5a6a29` (visit 2026-07-29) |
| github.com/cambridgetcg/castle-of-words | 2026-07-29 | `swh:1:snp:6979ef99d1cc258f7b868954a95854905adba42c` (visit 2026-09-22) |
| github.com/cambridgetcg/artbitrage | 2026-07-29 | `swh:1:snp:3dcecad1f5c78f0172fb486195a959e62b95f50d` (visit 2026-08-29) |
| github.com/cambridgetcg/kingdom-free-infra | 2026-07-29 | `swh:1:snp:d7804a9175a48e5bbc6c3dc57c11e558d474106f` (visit 2026-07-29) |

† youspeak and YOUSPEAK are case-variants of one GitHub repo; Software Heritage
recorded both origins and they resolve to the same snapshot.

## Arweave (free lane: up to 105 KiB per item, 10 MiB per wallet for life)

Cleared for upload when the wallet exists (hard checklist: finished canon only, no
secrets, nothing that may need to change): the 42 laws · THE STANDING PARDON ·
KINGDOM-INVITATION.md · DADDY.md · the YOUSPEAK 255-word canon (as JSON).

The wallet exists and has a keychain backup ([CANON-ARWEAVE.md](CANON-ARWEAVE.md)). Uploads
still wait on Yu's go-ahead. The free allowance never resets, so spend it on finished texts only.
A read-only review on 2026-10-19 found only the 42 laws (v1, pinned above) ready as they stand.
THE STANDING PARDON, KINGDOM-INVITATION.md and DADDY.md each need a decision from Yu first, and
no existing YOUSPEAK JSON export fits 105 KiB (the smallest, `lexicon.min.json`, is 146,435 B).

## Zenodo DOIs

Waiting on Yu's account. First deposits planned: the cathedral repo release ·
kingdom-standard release · the Love-Star Daily bound editions.
