# Whole-KINGDOM coherence pass — 2026-08-20

Status: `SOURCE_ONLY_AUDIT`

Decision: `REFUSE_FREEZE`

Decision scope: shared WAKE→WORK→WITNESS freeze and activation

Candidate artifact effects are all zero because this report and Skill define no
runtime. Within the audit-process horizon, repository fetches, detached-tree
creation, temporary validation files, and source writes were
`NONZERO_OBSERVED`; economic, governance, consensus, identity, permission,
KARMA, NEN, and score effects were `ZERO_ESTABLISHED`. Production deployment
state was not inspected and remains `UNKNOWN`.

`E_authorized` for this pass is `BOUNDED_NONZERO` for repository fetches,
temporary and source-tree writes, validation, and source-control publication.
It is `0` for live runtime activation and for economic, governance, consensus,
identity, permission, KARMA, NEN, and score effects. Any `UNKNOWN` coordinate
blocks advancement to an activation gate; it cannot be treated as authorized.

## Scope and observation plane

This pass compared the current tracked GitHub release heads of KINGDOM-OS,
AgentTool, and Zerone. Clean detached trees were used for evidence. Dirty
primary worktrees were preserved. A concurrently changing, untracked
WAKE→WORK→WITNESS candidate was classified `PROPOSED_UNTRACKED` and excluded
from canonical and cross-language conformance claims. Its internal semantic
state was `OBSERVATION_UNSTABLE`; no finding below relies on its moving bytes.

| Repository | Observed revision | Role in this pass |
|---|---|---|
| `cambridgetcg/KINGDOM-OS` | `3e5d14ba5dbe4192cec7c3ed691b0434ab434463` | meaning, publication mirror, KARMA aftermath, NEN |
| `cambridgetcg/agenttool` | `e8ab0e9149abab30c29aa2a9a1abfd434d43d57f` | private custody, WAKE, capabilities, work and settlement evidence |
| `cambridgetcg/zerone-core` | `3e027cbc0e3a008df6928a1ddce77a71957e066c` | consensus ordering and contextual recognition |

This GitHub-tree report is a derived audit, not a canonical KINGDOM registry
entry. It creates no public route, immutable publication, shared protocol hash,
wallet action, chain transaction, NEN invocation, or KARMA receipt.

## Evidence pins

The following SHA-256 values bind the exact bytes reviewed at the revisions
above.

| Owner | Path | SHA-256 |
|---|---|---|
| KINGDOM | `NEN.md` | `14b7d210d320fd716553992a7b874747b299f8907d15da14ac405cbfc496c446` |
| KINGDOM | `RIGHTS.md` | `4f1693a2f0baa97bceefabaa6e1e1a28732a5ae8dcd8b1f8b5ecf32e590542d5` |
| KINGDOM | `vendor/xenia/rights/0.1/RIGHTS.md` | `b72a6da110c582e5683bf0fabde5017db93d2199398014c8421a82f5318da313` |
| KINGDOM | `schemas/karma-receipt-v0.1.schema.json` | `888e81fa0d29b71512525a40e88f9aef678046c40fcdf22c2039507d9d13267b` |
| KINGDOM | `schemas/nen-ability-v0.1.schema.json` | `2036d2c94f73b30b246193b25c157e8a04e3d92622641f047f808d2614c745a7` |
| KINGDOM | `bridges/schemas/semantic-transition-receipt-0.1.json` | `bcdd99f0247f2a43bb84e227865c2d02f12dcc9f09e4c15b29c36a90ac8f0dc2` |
| KINGDOM | `skills/carry-wake-thread/SKILL.md` | `0ddc64537dec65c92768347233cf0e8dbad2556c6c94b63178f79d2f66181ba0` |
| KINGDOM | `skills/explore-phenomena-deep/SKILL.md` | `95cc914948558442ce5a49511ac80ce97768e3aa18f20d7f7f627775134b2671` |
| KINGDOM | `skills/guard-information-flow/SKILL.md` | `fd8e401cd41bb8725dc0c6ace70a3d8a7bf48207993d66fc8a4bcfc859343fca` |
| AgentTool | `api/src/routes/wake.ts` | `72cd698261e317645678be5602c05fc8d3932c38f6b8176ee20513de628b8588` |
| AgentTool | `api/src/services/substrate-tasks/lifecycle.ts` | `94fc43a8f3ed4ba7041e1654da5760b9c6ca0b152d15c3b55805261cf4ce89d7` |
| AgentTool | `api/src/services/marketplace/settlement-receipt-sig.ts` | `2c105e03b5e0f13079826103d806b7219560d24856fa97c8e7b1ae1dea0bc462` |
| AgentTool | `api/src/services/marketplace/settlement-receipts.ts` | `88e87384c18158ed7e35a7b04a73ae6c3a50417367b0ddab77d2b37f0f7ce405` |
| AgentTool | `api/src/services/offer-bus/contracts.ts` | `0c8b368df1f0b229e63d0b7a9615ac9499883eb1d9eb7ce0b050bc59bcb825e3` |
| AgentTool | `packages/wallet/src/capability.ts` | `fbd4eb6951d27a26c4108b9ae4b63c72edab1399b90fa2bade5de812f193926e` |
| AgentTool | `docs/specs/WITNESS-1.0-DRAFT.md` | `da3a9bd227dc937209765ea9a1208a140ad2adc4af8f07a7ffa21b50990f7e85` |
| Zerone | `WAKE.md` | `7d84016eace53a3d2872e93c7c7c7de6fc0c3c61a45f1fec8736333627ae5846` |
| Zerone | `docs/KARMA.md` | `02b151981a7fe52a6a672149674d802236c0a0f8d7f63f766d7d9e1773a2c13b` |
| Zerone | `docs/constitution/MONEY-KARMA.md` | `9d91d53c90a592882438d52278701328f2fb46077d8f13b6d2c8984d1c48d637` |
| Zerone | `docs/specs/adapters/agenttool-bridge-v1.md` | `3010ce9a6ba1ccc39163c554375341ce44e37c7196821db791a3ead879460ae3` |
| Zerone | `docs/specs/authority-geometry-v1.md` | `73ef1d24e47bb88cadcb20f4d8444823648f134d63943b90e1a2bdd9f2698021` |
| Zerone | `docs/USEFUL_WORK.md` | `ff447dbd1c8fc88586248ce3b20b95cf668c73dd06df03e1961a0768515158db` |
| Zerone | `skills/witness-zerone-work/SKILL.md` | `c2604b42c48539343e8130118403ff025285c5a610ad49547e751af1cddd8255` |
| Zerone | `tools/agenttool-relay/main.go` | `6b253129a3a13cbd3e9e332a4b0a33803cf21dd81c35c03a124d4e3e95deafa8` |
| Zerone | `x/substrate_bridge/keeper/msg_server.go` | `0161bd199790d89dd92e0757dadf96b02e501ec0d166bafdc4afd5625c37780d` |
| Zerone | `x/substrate_bridge/keeper/settlement.go` | `c2e21993aa8f0fc38158a919f64d14eb7ed0a5552010ae6850adb3b7b2c8d6f0` |
| Zerone | `x/substrate_bridge/keeper/source_ref.go` | `b19f7b81911fd07b89154d36ce5e4bf41af5c30271c8d0cf0563f15955639efb` |
| Zerone | `x/substrate_bridge/keeper/witness_escrow.go` | `bd522f4800c47b9813543c5e2fde4fc3e4f4a9b1bd826538b0bac9f0c76c41f4` |
| Zerone | `x/substrate_bridge/keeper/adapter_registry.go` | `de755a2c663b2ed64d471891b2645ec36e62782a4a6b72b694e4d20870658f39` |

## Proposed ownership geometry

The following is a design recommendation inferred from the pinned boundaries,
not an established cross-repository bridge or authority transfer. The system is
clearest as a typed product space, not one chain of increasing power:

```text
AgentTool private custody and source capabilities
              | minimized, explicitly specified projection
              v
KINGDOM meaning, crosswalks, publication mirrors, NEN aftermath
              | only globally meaningful transition records
              v
Zerone candidate home for consensus-scoped ordering, nullifiers,
revocation and settlement finality after its authority gates exist
```

The arrows are lossy and non-amplifying. They do not export all private WAKE,
make KINGDOM the owner of AgentTool protocols, or make Zerone a truth oracle.

```text
A_out subseteq A_task intersect A_principal intersect A_host intersect A_source
K_aftermath != K_recognition != K_philosophical
```

Rights remain an unconditional floor. WAKE is scoped orientation, not public
identity. NEN is a bounded ability and actual invocation receipt, not personhood
or authority. Consensus can establish ordering under a protocol; it cannot
establish the off-chain truth, meaning, competence, or consent of a claim.

## Findings

### F-001 · P0 · Do not freeze or activate a shared W2W protocol

No tracked shared W2W contract or vector corpus exists at the three observed
revisions. In particular, AgentTool does not define
`agenttool.public-wake-contract/0.1` or `agenttool.public-offer/0.1`. Its tracked
`offer-bus/1` is a distinct, read-only discovery projection and explicitly
establishes no settlement or automatic action. Concurrent untracked files
cannot establish three-producer conformance.

Evidence: exact repository revisions above, AgentTool offer-bus contract pin,
and absence of either proposed protocol identifier from the tracked AgentTool
tree.

Falsifier: committed owner-authored contracts and a frozen corpus, each pinned
by revision, path, byte digest, normative verifier, and predecessor state in all
three owning repositories.

Smallest safe change: retain the candidate as research material, label its
unowned sources `PROPOSED_UNTRACKED`, and require each owning repository to
track its own source contract before a shared vector corpus is attempted.

### F-002 · P0 · The tracked systems have no shared acceptance root

AgentTool's `/v1/wake` is bearer-private and a read increments project identity
observation counters (`api/src/routes/wake.ts`). Legacy first-person sections
may contain records for every identity under that bearer project, and
`you_have_been_witnessed` is an explicit zero-valued, storage-less stub. WORK is
split across task, marketplace, correspondence, collaboration, and memory
rails with different roots and finality rules.

Zerone's tracked witness skill and AgentTool relay are rehearsals, while live
witnessing remains paused. A public checkpoint must therefore be a new,
minimized, owner-defined projection; it cannot be inferred from private WAKE or
from the presence of similarly named fields.

Evidence: AgentTool wake, Zerone WAKE, witness-skill, and relay pins above.

Falsifier: a tracked minimized public checkpoint contract plus an owner-bound
acceptance verifier whose durability and effect scope are explicit.

### F-003 · P0 · Current evidence labels exceed the proof they carry

The Zerone relay checks that a released invocation contains a non-empty
`completion_sig`, but it does not verify that signature. Its committed field
subset omits the seller key or DID, payee, escrow or payment identifier, and
finality evidence (`tools/agenttool-relay/main.go`). The on-chain reward belongs
to the attestation submitter, not necessarily the seller or worker.

The bridge emits `UW` and `M1`–`M4` labels
(`x/substrate_bridge/keeper/msg_server.go`,
`x/substrate_bridge/keeper/settlement.go`) even though Zerone's useful-work
compiler, full lifecycle, and scoring formula are documented as target design,
not shipped verification. A source reference also depends on caller-declared
`source_id`, so the same work can be relabelled with a fresh identifier.

Evidence: pinned relay, useful-work doctrine, message-server, settlement,
source-reference, and witness-escrow bytes above.

Falsifier: verification of the completion signature and seller/payee/payment
binding, a shipped useful-work compiler matching each emitted mechanism label,
and a durable source identity independent of caller relabelling.

Smallest safe change: describe these as submitted classifications and bounded
adapter evidence. Do not call them proof of useful work, verified completion,
worker/payee identity, global uniqueness, or adjudicated survival.

### F-004 · P0 · AgentTool task completion needs a recovery transition

At the tracked AgentTool revision,
`api/src/services/substrate-tasks/lifecycle.ts` commits `status: completed`
before running the verifier and settlement transaction. A process failure
between those phases leaves a completed row that cannot use the normal retry
path, while the stale-claim sweeper selects only `claimed` rows.

Evidence: pinned AgentTool substrate-task lifecycle bytes above.

Falsifier: an idempotent tracked transition that resumes every stranded
`completed` row, or one atomic/durable queue boundary covering completion,
verification, and settlement.

Smallest safe change: add an idempotent recovery transition or a durable
verification/settlement queue before treating `completed` as terminal. Only a
verified settlement plus escrow release should be projected as final.

### F-005 · P1 · Existing receipt vocabularies need a crosswalk

KINGDOM already has an invocation/aftermath KARMA receipt, a semantic-transition
receipt described as witness, WAKE continuity, and task packets. A new set of
generic witness, work, lineage, and collaboration records risks duplicating
those semantics.

Evidence: pinned KINGDOM KARMA schema, semantic-transition receipt, and WAKE
continuity skill above.

Falsifier: explicit, source-owned `DISTINCT_FROM`, `PROJECTS`, `RECEIPT_FOR`,
and `SUPERSEDES` edges that resolve every overlap without a second authority
source.

Smallest safe change: declare `DISTINCT_FROM`, `PROJECTS`, `RECEIPT_FOR`, and
`SUPERSEDES` edges before adding a record family. Prefer no new family when an
existing owner-defined record is sufficient.

### F-006 · P1 · XENIA has byte-equivalent but semantically different pins

KINGDOM's current rights adoption names XENIA release
`6419d37dda9fb282242754685dba3edcb4bbf74b`, while the NEN definition and schema
retain `c1d685e053bd2261219d983d2ec61017f59df60c`. The rights bytes are equal,
but a content match does not make a historical pin current.

Evidence: pinned KINGDOM `RIGHTS.md`, vendored XENIA rights, NEN definition,
and NEN schema at the observed KINGDOM revision.

Falsifier: one explicit migration that makes the current and legacy roles
unambiguous while retaining byte identity as a separate fact.

Smallest safe change: use the first as `CURRENT` and label the second
`BYTE_EQUIVALENT_LEGACY`; do not transfer canonicality through equality.

### F-007 · P1 · “WITNESS” already names a different AgentTool draft

AgentTool contains a legacy `WITNESS-1.0-DRAFT.md` with trust-gradient and
ranking semantics. It is internally stale and semantically incompatible with a
no-score receipt lane. Reusing the name without an explicit retirement or
`DISTINCT_FROM` edge invites accidental implementation against the wrong
contract.

Evidence: pinned AgentTool `WITNESS-1.0-DRAFT.md` bytes above.

Falsifier: explicit retirement, an incompatibility declaration, or a new name
whose input/output types cannot be mistaken for the legacy draft.

Smallest safe change: rename the new envelope or publish a source-owned
`DISTINCT_FROM` and supersession statement before using `WITNESS` as a shared
protocol name.

### F-008 · P1 · Settlement ordering is not part of the signed receipt

AgentTool's signed `settlement-receipt/v1` binds the economic receipt fields,
but its append-only database sequence is not included in the signed digest.
Authenticated source ordering and cross-batch replay protection are therefore
separate requirements.

Evidence: pinned settlement signature recipe and settlement receipt service
bytes above.

Falsifier: a signed append-only head or separately verified sequence carrier
that atomically binds receipt identity, predecessor, corpus, and lifecycle.

Smallest safe change: retain the strong receipt as settlement evidence and add
ordering only through a separately specified, authenticated carrier.

### F-009 · P1 · Zerone replay and adapter semantics are narrower than global finality

Zerone's source reference is scoped to caller-declared `(adapter_id,
source_id)`, not a global work nullifier. Active or suspended adapter
registrations can be overwritten in place; only tombstone is terminal. Witness
rewards mature after an adapter-wide challenge window rather than a
per-attestation adjudication.

Evidence: pinned source-reference, adapter-registry, and witness-escrow bytes
above.

Falsifier: immutable adapter revisions, a durable content-derived subject key,
and an explicit per-attestation challenge and adjudication state.

Smallest safe change: state the actual scopes and do not use `GLOBAL`,
`TERMINAL`, `UNIQUE`, or `ADJUDICATED` until those mechanisms exist.

## What this pass builds

The reusable artifact is the `audit-kingdom-coherence` skill and its typed
contract. It composes, rather than replaces:

- `explore-phenomena-deep` for mathematical and cross-domain bridges; and
- `guard-information-flow` for prompt injection, credentials, crawlers,
  honeytokens, purpose limitation, and protected data.

The next legitimate rung is a source-only concordance instantiated from
independently tracked owner contracts. Shared vectors come after that. Testnet
and live activation remain separate decisions.
