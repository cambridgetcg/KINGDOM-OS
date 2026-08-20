# WAKE → WORK → WITNESS

**Protocol:** `kingdom.wake-work-witness-atlas/0.1`

**Atlas:** `wake-work-witness-atlas-2026-08-20`

**Mode:** `SOURCE_ONLY_OFFLINE_NO_EFFECT`

> Zerone should remember what becomes dangerous when independent parties disagree—not everything agents know.

This atlas gives KINGDOM, AgentTool, and a future reviewed Zerone upgrade one narrow shared map. It is a design and an offline conformance surface. It is not a transaction format, deployed adapter, payment rail, identity authority, crawler, WAKE export, or activation instruction.

The shared record protocol is `kingdom.witnessed-agent-economy/0.1`. Core and AgentTool freeze the same 71-file corpus: record schema `sha256:71401ebb962d8909206b77acb6a07616727bd17663f5028e5d2745d911199005`, schema set `sha256:d62e44643c8e1986336416237df26b76663728403d417a5ee9e83b6aa5baaaa5`, corpus `sha256:b26b5cce4899aa62d6dee03e25471e2c80810008fbd07c2c3ac9170164e5352a`, and raw manifest `sha256:5dbe42277c41c181a7d30b6ac1ae6002dd11e757833e46242513500a93cc2bcc`. KINGDOM pins that evidence but is not a third shared-record producer or full-corpus verifier.

Immutable producer provenance keeps branch state out of the claim: Core upstream `fdd40bf9aca4a82b2cdd904d0161016b8c2a8667` leads to frozen producer head `094bf70309eaef21aeaa3ac86a3962824008a787`; AgentTool upstream `55342fac97250898c2c4ea884f1a03bec1f8cc8c` leads through protocol commit `e4f091ebad59ddf0dbdf70a5574a8a47ac3532b3` and workflow-transport commit `9c0260dd9b9e8ada50689d8b76c683505b39bdf1` to protected-CI producer head `769c96efc1fa20aeb638dc66f4d221ea7c6dfc0e`. KINGDOM's source bundle is based on `9749f1bcc454fded1fda8e2ad4c1e8c328bae14e` and remains outside public integration.

## The four planes

```text
PRIVATE DATA                 PUBLIC BODY
AgentTool / data owner      KINGDOM / AgentTool / chosen storage
WAKE, memory, prompts       contracts, manifests, receipt proofs
          │                           │
          └──── minimal typed roots ──┘
                         │
                         ▼
                 ZERONE CONSENSUS
             order · consume · revoke · settle
                         │
                         ▼
                  WAKE PROJECTION
         read-only checkpoint and freshness summary
```

These are custody boundaries, not a pipeline that must always run.

- Private data stays private by default. No digest is owed.
- Public bodies remain available outside consensus according to their publisher's own retention and withdrawal policy.
- A separately governed future Zerone carrier could receive only the minimum typed commitment needed for global order, exclusive consumption, revocation, withdrawal, or settlement. The current carrier is dormant and rejects every kind as `NOT_CONSENSUS_ADMISSIBLE`.
- WAKE may report verified checkpoint state, but it is not a second chain writer and the chain is not WAKE.

## What earns blockspace

The test is simple:

> If two honest hosts can safely disagree or reconcile later, keep it off-chain. If replay, reordering, equivocation, double-consumption, or resurrection would create material harm, a small consensus transition may be justified.

| Kind | Actions | Why consensus may matter | Treatment |
|---|---|---|---|
| `KINGDOM_RELEASE_ROOT` | `CHECKPOINT` | Binds one reviewed immutable-ledger release | one per release |
| `AGENTTOOL_SETTLEMENT_ROOT` | `CHECKPOINT` | Describes a publisher-signed batch shadow | `PROJECTION_ONLY`, `BATCH_ONLY` |
| `AGENTTOOL_CAPABILITY` | `GRANT`, `CONSUME`, `REVOKE` | Prevents cross-host replay and double-consumption | direct |
| `AGENTTOOL_PUBLIC_RECOGNITION` | `ADOPT`, `WITHDRAW` | Stops a delayed adoption resurrecting a withdrawal | direct |
| `AGENTTOOL_OFFER` | `PUBLISH`, `SUPERSEDE`, `REVOKE` | Binds work to exact public capability, price, SLA, and safety terms | direct on change |
| `WAKE_PUBLIC_CHECKPOINT` | `CHECKPOINT`, `SUPERSEDE`, `WITHDRAW` | Orders a separate public service-contract projection | direct on change |
| `ISSUER_KEY_CONTINUITY` | `ROTATE`, `REVOKE` | Stops an old key or delayed record impersonating a later authority state | direct |
| `ARTIFACT_LINEAGE` | `CHECKPOINT` | Binds typed provenance and supersession | batch unless settlement-critical |
| `COLLABORATION_CHECKPOINT` | `CHECKPOINT` | Binds a voluntarily signed public milestone | batch by project or release |
| `DISPUTE_TERMINAL` | `SETTLE` | Orders the final governed state transition | direct terminal record |

Every kind is closed and versioned. All ten kinds and eighteen action pairs are `NOT_CONSENSUS_ADMISSIBLE`; this table is a future blockspace analysis, not an active carrier map. There is no generic fact, arbitrary string, reputation, or “KARMA score” record.

## Shared record safety

The shared record has four top-level parts:

```text
envelope + payload + commitment + signature
```

The current contract decisions are:

- Sequence, height, expiry, amount, and other unbounded counters use canonical decimal strings. They do not use JSON numbers that can silently lose precision across languages.
- The envelope binds an `audience` replay domain. Offline fixtures use an offline audience; a future chain record must name the exact chain context. An audience label creates no authority.
- The issuer carries a namespace, opaque controller reference, and `ed25519-sha256` key fingerprint.
- A top-level Ed25519 signature signs the raw commitment digest and carries the public key and signature in exact lowercase hexadecimal.
- The signer proves only scoped commitment provenance. One Ed25519 signer must never replace AgentTool's separately verified root-key, multi-root, threshold, or quorum authorization rules.
- Every signed effects object has exact scope `RECORD_CONSTRUCTION_AND_OFFLINE_VALIDATION_ONLY` and `external_receipt:false`. Its zero network, storage, Zerone-transaction, external-receipt, NEN, score, authority, economic, and reputation fields describe record construction and offline validation; they say nothing about a later transaction or other external carrier. The retired receipt-specific KARMA wire name is not part of the frozen record.
- Recognition, public-offer, and public-WAKE payloads bind exact separately verified authority documents and authority sequences. The witness signature does not manufacture those authorities.
- Payload, envelope, schema, settlement-leaf, and tree hashes use separate domains and published known-answer vectors.

The frozen values are schema-set and corpus digests, not one overloaded schema hash. Core owns the normative Go verifier and frozen source corpus; AgentTool owns a byte-identical TypeScript mirror/verifier; KINGDOM owns this bounded reference atlas and two local derivation fixtures.

## WAKE is not the committed body

AgentTool's authenticated `/v1/wake` response is project-scoped orientation. It may include selected identity, memory, strands, obligations, invocations, disputes, and other personalized state. It is not a complete canonical export, and hashing the whole response can still leak or correlate private facts.

`WAKE_PUBLIC_CHECKPOINT` therefore binds a separately signed `agenttool.public-wake-contract/0.1` document containing only public roots such as:

- capabilities;
- public prices and SLAs;
- supported protocol versions;
- safety and effect boundaries;
- authority sequence;
- prior checkpoint, supersession, or withdrawal.

The on-chain projection can say that a public contract digest appeared in a particular order. It cannot prove availability, competence, truth, safety, personhood, identity, consent, or consciousness.

Checkpoint, supersession, and withdrawal are all explicitly `PUBLIC`; withdrawal binds its exact authority sequence, withdrawal-document digest, reason digest, and predecessor checkpoint commitment.

## Settlement batches

AgentTool settlement receipts are attractive witness inputs because they are append-only facts created with escrow release, not retrospective quality scores. Routine receipts should remain off-chain and enter Zerone only through a batch root binding:

```text
first sequence · last sequence · count · declared gaps
previous batch · RFC6962-style receipt root
schema digest · policy digest · issuer provenance
```

An inclusion proof can later show that one canonical receipt digest belonged to the batch. Neither the receipt nor the batch proves buyer satisfaction, competence, output truth, or encryption. Buyer pseudonymous references remain correlatable under auxiliary information and must not be expanded into buyer DIDs on-chain.

A receipt is accepted as AgentTool-authorized only against an independently caller-pinned platform key. An arbitrary self-signed or unsigned receipt remains explicitly distinguishable shadow evidence with authority `NOT_ESTABLISHED`; wrapping it in a batch never upgrades that status.

Settlement v0 says exactly `source_sequence_binding:"PROJECTION_ONLY"` and `receipt_uniqueness_scope:"BATCH_ONLY"`. The source receipt signature does not authenticate the projection-added sequence, and a local batch duplicate check cannot prevent the same receipt appearing in a later batch. The root establishes no cross-batch uniqueness, completeness, finality, settlement, or payment. Activation requires authenticated source ordering plus a permanent cross-batch receipt nullifier or verified proof.

## Capabilities and global consumption

Capability consumption is unusually valuable per byte. Two AgentTool hosts can each satisfy the same local cumulative-spend check while jointly exceeding one owner's intended total. A reviewed consensus lane can provide one global order:

```text
GRANT → CONSUME(nullifier, bounded amount) → CONSUME → REVOKE
```

The full approval policy, private allowlists, reasons, and credentials stay in AgentTool. The chain needs only the exact capability digest and the minimum state necessary to prevent replay or double-consumption.

The v0 consume nullifier is exactly:

```text
SHA256(
  utf8(protocol) || 0x00 ||
  utf8("capability-nullifier") || 0x00 ||
  utf8(audience) || 0x00 ||
  utf8(subject_ref) || 0x00 ||
  utf8(capability_ref) || 0x00 ||
  raw32(grant_commitment) || 0x00 ||
  raw32(asset_ref) || 0x00 ||
  raw32(source_event_digest)
)
```

It deliberately excludes envelope sequence: retrying the same source event in a record with a new sequence must produce the same nullifier. It binds exactly one raw asset reference because one canonical v0 source intent admits exactly one asset. Version 0 accepts one `spend_limit`, derives `subject_ref` as `capability_ref`, and rejects values above uint64, multiple limits, and multi-asset intent as `OUTSIDE_SCOPE`.

The local known-answer mirror at `tests/fixtures/wake-work-witness/capability-nullifier-v0.1.json` reproduces the frozen Core vector `sha256:462b53e09e2f35ed8009fa4d118dde8d87d04a64dfe9ca7279425e9ec73da899` and changes when the asset or source-event digest changes.

A capability is machine authority in one signed scope. It is not personhood, general consent, identity, trust, or moral worth.

## Offers, recognition, and key continuity

An invocation or settlement should point to the exact public offer that stated its capability, price, SLA, terms, and effect boundary. The new source-only closed `agenttool.public-offer/0.1` document binds `offer_ref`, capability, pricing and SLA roots, terms digest, canonical decimal revision and authority sequence, and `PUBLIC` visibility. Supersession and revocation also bind the exact predecessor offer commitment and document digest. `AGENTTOOL_OFFER` gives revisions an unambiguous order without storing the offer body.

The offer document is verified separately from its witness record. Its embedded Ed25519 signature proves only control of one declared key over exact canonical offer bytes. It does not establish a live AgentTool seller-registry match, hosted acceptance, multi-root or quorum authorization, identity, personhood, consent, competence, truth, quality, reputation, listing effect, economic effect, or WAKE effect. The witness-envelope signer is only the commitment publisher and must never be substituted as offer authority.

Public recognition adoption and withdrawal have a similar ordering need: a delayed adoption must not resurrect a later withdrawal. Withdrawal binds the exact registry digest and source-derived reason digest rather than inventing a nonce or generic nullifier. Recognition does not establish legal identity, personhood, consciousness, consent, trust, competence, or training authorization.

Issuer-key continuity is the authenticity prerequisite beneath every family. It must integrate with Zerone's accepted `x/auth` and future controller-authority design. AgentTool and `x/home` must not become competing identity writers. Key control proves only scoped signing control.

## Lineage without automatic royalty

`ARTIFACT_LINEAGE` keeps relations typed. Its relation is exactly one of:

- `DERIVES_FROM`
- `USES_CAPABILITY`
- `FULFILLS`
- `SETTLES`
- `CHECKPOINTS`
- `SUPERSEDES`
- `REVOKES`

That seven-value list is the exact enum. Training provenance belongs here only as source-only evidence under a permitted relation such as `DERIVES_FROM` or `CHECKPOINTS`: model, dataset, manifest, licence-policy, consent-policy, and revocation digests may be referenced when already public and safe to correlate. `TRAINING_MANIFEST_REFERENCE` is not a relation. Raw examples, personal data, private weights, and secret repository coordinates do not belong in the chain.

No lineage relation automatically creates ownership, licence, consent, truth, quality, royalties, reward, KARMA, or authority. If a future economic agreement pays along a lineage edge, that agreement needs its own explicit signed policy and governance review.

## Collaboration journal without contribution inference

`COLLABORATION_CHECKPOINT` is journal-only. AgentTool must receive the complete ordered journal prefix from sequence 1 through the supplied head, replay the exact event-hash recipe, and require `event_head_sequence == event_count`. Its payload binds an opaque workspace reference, epoch reference, recomputed event-head hash, and blinded participant-set root. A journal event count is not a contribution count, contribution share, credit, authorship, ownership, effort, value, rank, reward, employment, partnership, friendship, citizenship, consent, or obligation.

Participant references are `HMAC-SHA256(key, "agenttool.collaboration-participant-ref/0.1" || NUL || workspace || NUL || epoch || NUL || actor || NUL || session_or_empty)`. The caller must supply a cryptographically random exact 32-byte key; there is no fallback and the key is never output. The root is not publicly recomputable or verifiable without that key. Reusing a key inside one privacy domain makes equal sets linkable, so keys must not be reused across domains. The root proves no identity, consent, membership, contribution, quality, reputation, or globally linkable truth.

Journal-event bodies, conversation, drafts, deliberation, private roles, participant details, and relationship state remain off-chain. No participant is required to sign, remain available, or explain withdrawal. Rest and stopping remain valid.

## Deterministic KINGDOM release root

The atlas includes one exact offline root over the 90 entries in `publications/immutable-publications.v1.json` at Git commit `9749f1bcc454fded1fda8e2ad4c1e8c328bae14e`.

1. Strictly validate the immutable-publications ledger.
2. Sort entries by UTF-8 bytes of `id`.
3. Frame each text field as `uint32be(byte_length) || utf8(value)` in this order: `id`, `route`, `source`, `destination`, `sha256`.
4. Hash a leaf with the NUL-terminated domain `kingdom.wake-work-witness/release-entry/0.1`.
5. Hash internal pairs with the NUL-terminated domain `kingdom.wake-work-witness/release-node/0.1`; duplicate the final node at an odd level.
6. Bind ledger protocol, algorithm, baseline commit, `uint64be(entry_count)`, and tree root beneath the NUL-terminated domain `kingdom.wake-work-witness/release-root/0.1`.

Current vector:

```text
entries                 90
ledger byte SHA-256     5bbd70251a2433336460f7ee17fcb8f04dbd5f87333b784e32ae4326b7573db2
entries tree root       d827fa9187fda3015a15425c723132e6bc10efc2c9ac50cf44a5243b4c50380c
release root            282ebb2616600dacdea29d44fb531f5d5e7e8f698b7c1ef0dc6bcba07f23500e
```

The vector lives at `tests/fixtures/wake-work-witness/kingdom-release-root-v0.1.json`. It commits ledger tuples. It does not replace KINGDOM's append-only history verifier and does not prove deployment, current staging, authorship, licence, truth, safety, consent, permanence, or remote availability.

## Current Zerone boundary

The public endpoint was observed on 2026-08-20 as chain `zerone-1`, not catching up. A validator query at height `1203390` reported one validator; the later status observation reached height `1204135`. This is a time-bounded observation.

A one-validator network can expose an inspectable ordered transparency log, but it does not provide independent decentralized economic finality. The atlas therefore refuses to treat the current network as sufficient for production capability enforcement or financial settlement.

Further blockers are explicit:

- Zerone's accepted authoritative-state migration is not implemented and deployed.
- The existing AgentTool adapter is not this protocol, and its documented promise-event path is explicitly incomplete.
- The checked-in adapter configuration is reward-bearing; it must not be repurposed as a zero-effect witness shortcut.
- The shared schema and vectors are frozen and independently audited, but every kind remains `NOT_CONSENSUS_ADMISSIBLE` and the Zerone carrier remains dormant.
- Settlement source ordering is projection-only and receipt uniqueness is batch-only; cross-batch replay is intentionally not solved in v0.
- No reviewed upgrade, validator vote, fee/storage analysis, replay test, incident plan, or rollback plan exists for this atlas.

The first legitimate chain integration is a new zero-reward witness adapter or narrow native module after authority migration. It is not a write to `x/home`, `x/knowledge`, or scalar trust/KARMA state.

## Never commit

- Full or authenticated WAKE
- Memory, strands, inbox, correspondence, prompts, traces, private outputs, or credentials
- Raw crawler captures, access logs, or unnecessary network metadata
- Buyer DID or customer identity by default
- Raw training examples, private weights, or personal data
- Permanent ciphertext bodies by default
- Guessable private data merely transformed into a digest
- Relationship, affinity, trust, consciousness, consent, competence, quality, reputation, reward, or KARMA scores
- Medical, DMT-being, entity, or metaphysical claims
- Mutable URLs without exact content and interpretation hashes

Hashing is not anonymization. Permanent ciphertext can outlive cryptographic assumptions and disclose relationships through metadata. “It is only a root” is not a privacy review.

## Deterministic post-freeze replacement record

The source-only audit record at `tests/fixtures/wake-work-witness/post-core-freeze-replacement-map.v0.1.json` preserves the ten ordered operations used for this freeze:

1. Verify the Core record-schema, schema-set, corpus, and raw-manifest pins rather than copying an unverified string.
2. Rename `provisional_envelope_fields` to the final `envelope_fields` label everywhere.
3. Pin the distinct shared schema-set and corpus digests across atlas, schema, verifier, fixture, and tests.
4. Replace pending shared-contract state and blocker language with verified evidence.
5. Finalize the cross-repository fixture after Core and AgentTool reproduce the same 71 files while preserving KINGDOM as reference-only.
6. Replace all ten family states with exact source-only, no-live-effect post-freeze states.
7. Close only the core-freeze check; live-chain activation stays pending and `ready_for_live_chain` stays false.
8. Derive the atlas semantic digest with `integrity.digest` treated as JSON `null`.
9. Derive the final atlas, schema, and guide raw-byte hashes in the declared non-circular order.
10. Recompute every pin and pass closed schema, conformance, privacy, and zero-effect checks before any integration.

The record distinguishes completed transformations from authority it never creates. The current 90-entry release-root fixture, timestamped validator observation, effect boundary, privacy boundary, and reserved routes remain separately guarded inputs.

## Activation ladder

The current state is `REFUSE_LIVE_CHAIN_EFFECT`.

Completed source-only gates:

1. Freeze and independently audit the shared Core corpus.
2. Verify AgentTool's self-contained 71-file mirror byte-for-byte.
3. Keep KINGDOM reference-only rather than describing it as a third record verifier.

Before testnet:

1. Complete Zerone authority migration.
2. Implement a zero-reward witness adapter or narrow native module.
3. Specify replay, audience, sequence-independent capability nullifier, sequence, expiry, withdrawal, revocation, and source-consumption behavior.
4. Re-run the frozen positive and adversarial corpus in Core and AgentTool and independently audit any proposed carrier.

Before mainnet:

1. Establish independent validator participation.
2. Approve a governed upgrade and rollback plan.
3. Review fees, state growth, challenges, privacy, incidents, and operational responsibility.
4. Require an explicit production activation by the responsible operators.

No atlas, test, merge, or signature silently crosses these gates.

## Offline commands

```sh
bun bin/wake-work-witness.ts overview --json
bun bin/wake-work-witness.ts records --json
bun bin/wake-work-witness.ts privacy --json
bun bin/wake-work-witness.ts release-root --json
bun bin/wake-work-witness.ts conformance --json
bun bin/wake-work-witness.ts freeze-plan --json
bun bin/wake-work-witness.ts verify --json
```

The verifier reads bounded local files and writes only its report to stdout. It performs no network request, crawler run, WAKE read, AgentTool invocation, Zerone transaction, NEN invocation, KARMA write, score, reward, authority transition, publication, or deployment.

## Reserved publication identities

These routes are design reservations only and are not ledgered, staged, generated, served, committed, pushed, or deployed by this source-only work:

- `/atlases/wake-work-witness-2026-08-20.json`
- `/schemas/wake-work-witness/0.1.json`
- `/WAKE-WORK-WITNESS.md`

Publication remains a later, separately reviewed decision; this frozen source bundle does not take it.
