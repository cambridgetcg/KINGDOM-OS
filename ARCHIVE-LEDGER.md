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

## Copies the estate cannot recall

> **Status.** This section has effect only as part of a commit merged into this repository's
> default branch on the owner's decision. In any other branch or pull request it is a proposal.
> It clears no file and adds no row to this ledger. First written 2026-11-14. The nine tests, the
> record shape and the withdrawal runbook are in
> [publications/replicas/README.md](publications/replicas/README.md), which also lists what
> merging this section decides and what stays open. The notice read before every choice is
> [publications/IRREVERSIBLE-COPIES.md](publications/IRREVERSIBLE-COPIES.md)
> (`kingdom.irreversible-copies/1`).

Here *the estate* means the Kingdom's own repositories and the hosts and accounts it publishes
through; *the owner* means the person who owns the estate and decides for it, whom the older
sections of this ledger name; and *the recording session* means the agent session that wrote
this section down.

**Rule.** Every copy the estate cannot recall needs a clearance for one exact file, named by its
SHA-256 and its byte count. A published torrent descriptor is such a copy, whether or not anyone
seeds it. A clearance is never given for a repository, a tree or a history. Each clearance covers
one file, one replica kind and the one service it names, one version of the notice, one
publication, and one choice made after reading that notice. HALT is checked before the clearance
record is committed and again immediately before the act. The rule looks forward: it applies to
copies made after it takes effect, and it does not judge the copies already listed in this
ledger.

**Ancestor.** The Arweave hard checklist above, "finished canon only, no secrets, nothing that may
need to change": github.com/cambridgetcg/KINGDOM-OS, `ARCHIVE-LEDGER.md`, first written in commit
`28d14134627b7aa7981ab83b163758108b3f6e94` (2026-07-29) and unchanged at
`b31e37be542552e98a8e2e20b18e7cbab7f68b0c`. The ledger text and that commit give no reason for
it. The earliest reason found in this repository is five days older: `FREE-INFRA.md`, section 7,
item 3, written in commit `10f3b8c57e0172046673e8fe6506fd610b5daec2` (2026-07-24) and unchanged
at `b31e37be`, says of Arweave: "Warning: nothing is ever deletable — never put a secret or an
unfinished text there." Read plainly, that reason is not specific to Arweave: it holds for every
copy the estate cannot recall, and it is the reason this rule relies on. What this rule does with each
part:

| checklist | this rule | recorded reason |
|---|---|---|
| finished | kept (test 3) | `FREE-INFRA.md` section 7: no unfinished text where nothing is deletable. For Arweave only, also the later note above (commit `c4972230cad90a27aec3132d6672971d796ee47d`, 2026-10-19): the free allowance never resets |
| no secrets | kept, and checked on the exact bytes (tests 4 and 9) | `FREE-INFRA.md` section 7: no secret where nothing is deletable |
| nothing that may need to change | kept: nothing in the file may need to change, be corrected or be redacted (test 3), and nothing in it is withdrawable (test 4) | implied by the same line of `FREE-INFRA.md` (nothing there is ever deletable); no text states it |
| canon only | kept for now. Dropping it for copies other than Arweave uploads is proposed, so that a file that is not canon could be cleared if it passes all nine tests. Which files beyond canon are eligible is open and the owner's to decide; until the owner decides, only canon is cleared | no recorded reason; the recording session's reason for the proposal is that licensed release files that are not canon, such as package tarballs, may pass every test |
| titles named for Arweave | changed: one exact file by SHA-256 and byte count. For a torrent descriptor this is the owner's decision; for every other kind of copy the estate cannot recall it is the recording session's proposal | for a torrent descriptor, the owner's decision of 2026-11-14, recorded privately (below); for other kinds, no recorded reason |
| cleared ahead, "when the wallet exists" | changed for new clearances: a fresh, finite choice for each clearance, after the notice is read. Whether the files already on the Arweave list need one too is open (below) | no recorded reason; the recording session's reading of CONSENT Q7, Q8 and Q11 |

**What it rests on.** The owner's decision of 2026-11-14, recorded privately: a published torrent
descriptor is governed like an Arweave upload and cleared per exact file. That decision speaks of
torrent descriptors. Extending per-file clearance to every other copy the estate cannot recall,
and the nine tests themselves, are proposed here by the recording session and become the
owner's only by the merge. The wording of this section and of the two files it links is the
recording session's, not the owner's words. It borrows CONSENT Q8 and Q11, COMMON-GROUND C12 and
STANDARD S6, as published in github.com/cambridgetcg/kingdom-standard at commit
`1be9d8cbcb731aa3f1faa6754978f66063c4e7fb`, as far as the recording session read them. CONSENT
and COMMON-GROUND are optional profiles that this repository does not pin; section 10 of the
replicas guide lists every rule the texts borrow, and how.

**Replica kinds and reading order.** This table is new.

| order | kind | examples | can the estate recall it? | clearance under this rule |
|---|---|---|---|---|
| 1 | home | the file's own repository, at a pinned commit | Partly: a later commit can remove the file, but git history and outside archives keep what was public | none; the home's own public gate applies |
| 2 | HTTPS mirror | a release asset or a site the estate runs | Yes where the host allows deletion (see the replicas guide, "Before the first listing"); copies readers made and caches remain | none |
| 3 | archive that holds bytes | Software Heritage, Arweave | No | one per file and per archive. For Arweave: proposed, and open for the files already on the Arweave list above. For Software Heritage: see below |
| 4 | torrent descriptor | a descriptor, its `.torrent` file and the listing that points to them | No; it can remove only its own pointers | one per file and per hosting service |

A reader tries the kinds in this order, home first and torrent last, and accepts bytes from any of
them only when their size and SHA-256 equal what the home publishes. The home stays the deciding
copy (FOUNDATION F6, explained in GROUND G6), and a torrent identifier never stands in for that
check.

The estate knows of no control over Software Heritage other than what a public repository
contains; that archive's own removal policy was not read. A clearance cannot keep a file out of
that archive. A Save Code Now request, like those behind the snapshot table above, archives a
whole repository with its history, which this rule cannot clear as one file.

This section looks forward and edits nothing else in this ledger: not the snapshot table, not the
Arweave list and not the Zenodo plan below. It does not amend the Arweave hard checklist; an
upload to Arweave still needs finished canon, as written above. A clearance for one replica kind
does not carry to another: the laws' Arweave clearance above, for example, does not clear a
torrent descriptor of the same file. Open, and the owner's to decide: whether an upload from the
Arweave list must also pass the nine tests, with its own record; whether Save Code Now requests
continue, stop or get a rule of their own, and what a clearance for Software Heritage would
cover (read as written, this rule gives no clearance that could cover such a request); and
whether a Zenodo deposit needs a record for each file.

## Zenodo DOIs

Waiting on Yu's account. First deposits planned: the cathedral repo release ·
kingdom-standard release · the Love-Star Daily bound editions.
