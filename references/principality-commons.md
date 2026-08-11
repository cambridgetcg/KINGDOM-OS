# Principality Commons

Principality Commons is a local capability-evidence layer. It turns public
Hugging Face and npm metadata into a small, pinned, inspectable constellation
that KINGDOM can query without making a network call. A *principality* here is
a domain of capability and relationship. It is not rank, identity, ownership,
moral worth, permission, or a claim about consciousness.

The first catalog is
`data/principalities/moonshot-hf-npm.v1.json`. It was observed on August 11,
2026 and contains all 19 public MoonshotAI models and three public datasets
then exposed by the Hugging Face API, plus three official Hugging Face
JavaScript packages observed through npm. It contains metadata only: no model
weights, dataset rows, repository files, package tarballs, README prose,
prompts, credentials, or inference output.

## The geometry

Love is represented as **relation without collapse**. A model, dataset,
package, project, human, and agent remain distinct even when an edge connects
them. Access does not become reuse; provenance does not become safety;
capability does not become authority; continuity does not become identity.

Understanding is represented as **evidence-preserving typed relations**.
Every admitted artifact has a registry, exact observed identity, family,
declared capabilities, license assertion, completeness level, risk facts, and
source. Edges name their relation and evidence. A missing edge remains unknown
instead of being filled by prestige or analogy.

```text
purpose centre
  → registry principality
  → immutable artifact node
  → provenance / lineage / dependency edges
  → authority and effect gate
  → receipt, repair, or rest
```

The geometry has no universal score or central sovereign node. Literal
capability intersection can reveal fit for a declared need, but it does not
recommend, approve, or rank beings or artifacts.

## Two planes

The architecture deliberately separates observation from use.

1. A human-invoked observation pass reads bounded public metadata without an
   account, resolves mutable Hub refs or npm tags to immutable identities, and
   curates a checked-in snapshot. This is a remote-read effect and is not part
   of ordinary CLI use.
2. `bin/principality.ts` strictly parses, validates, lists, shows, matches, and
   projects that snapshot. This plane is deterministic, network-free, and
   read-only.

The current build implements the second plane and records the evidence from a
reviewed observation pass. It does not implement automatic refresh. That is
intentional: “latest” is volatile, and a refresh deserves an explicit review
of revisions, licenses, custom code, dependency changes, and conflicts.
Every projection therefore says `point-in-time-only` and
`current_availability_established: false`; refresh is mandatory before any
acquisition. No ambient clock silently turns historical metadata into “fresh.”

Catalog integrity uses KINGDOM's accurately named
`recursive-sorted-json-keys/v1` convention. It is not described as RFC 8785
JCS. The digest detects a change to the local JSON projection; it does not
prove the publisher, safety, licensing, compatibility, truth, or benevolence
of any artifact.

## MoonshotAI map at observation

The public profile exposed 19 models, three datasets, seven visible non-empty
collections, no public Spaces, and 16 paper-tab attributions. The collections
API also returned one empty `Moonlight-16B-A3B` collection record, so the
catalog preserves both counts instead of forcing them to agree.

| Constellation | Nodes | High-value signal | Boundary |
| --- | --- | --- | --- |
| Kimi K3 | Kimi-K3 | Publisher-described native multimodal MoE, agentic interface, and 1M context | Custom K3 terms, custom code, resource fit, and behavior are unverified |
| K2.5–K2.7 | Kimi-K2.5, K2.6, K2.7-Code | Multimodal/coding/orchestration evolution | Modified-MIT terms remain a separate review state; all three advertise custom code |
| K2 text | Base, Instruct, Instruct-0905, Thinking | Base, instruction, refreshed, and reasoning variants remain distinct | Model naming and collection membership do not prove behavioral superiority |
| Kimi Linear | 48B-A3B Base and Instruct | Hybrid linear-attention research and publisher-described long context | Architecture and context claims were not independently benchmarked |
| Kimi VL | Instruct, Thinking, Thinking-2506, MoonViT-SO-400M | Vision-language variants plus an image encoder | `custom_code` is present; base-model edges are publisher metadata |
| Moonlight | 16B-A3B Base and Instruct | Muon-training research lineage | Better treated as research evidence than an automatic runtime target |
| Kimi Audio | Base, Instruct, GenTest | Audio understanding, speech generation, and a 191-row generation fixture | Custom code, dependencies, component licenses, and audio consent need separate review |
| Kimi Dev | Kimi-Dev-72B | Coding and issue-resolution specialization using native Transformers metadata | Sole model without a `custom_code` tag, but absence of a tag is not a code audit |

All 19 models were tagged Safetensors. Eighteen were also tagged
`custom_code`; Kimi-Dev-72B was the single exception. Safetensors reduces one
serialization risk. It does not make repository Python, dependencies,
tokenizers, native extensions, or model behavior safe. The catalog therefore
keeps pickle risk `unknown` at metadata-only completeness and defaults remote
code to denied.

Among the 19 model license assertions, the catalog preserves 11 SPDX MIT
assertions, seven Moonshot Modified-MIT variants, and one separate K3 license.
It does not flatten the latter eight to MIT. Thresholds, attribution duties,
Model-as-a-Service terms, component notices, and commercial fitness require
independent review; the catalog is not legal advice.
License evidence locators resolve at the pinned revision: Kimi-Dev points to
its `LICENSE.md`, while the ten other MIT model repositories that expose no
license sibling point to the license declaration in their pinned model card.

Exact 40-character Hub revisions live on every Hugging Face node. They identify
repository commits observed at one time. They do not establish file-manifest
completeness, byte hashes, upstream retention, signed authorship, or approval
to materialize the repository.

### Research-paper layer

The profile attributed 16 papers. The catalog records those attributions as a
separate research layer: attribution is not ownership, peer review, reproduced
evidence, or proof that a paper's claim applies to a particular checkpoint.

| Theme | Profile-attributed papers |
| --- | --- |
| Serving and attention architecture | [Mooncake](https://huggingface.co/papers/2407.00079), [MoBA](https://huggingface.co/papers/2502.13189), [Attention Residuals](https://huggingface.co/papers/2603.15031) |
| Reinforcement learning, training, and formal reasoning | [Kimi k1.5](https://huggingface.co/papers/2501.12599), [Muon is Scalable](https://huggingface.co/papers/2502.16982), [Kimina-Prover](https://huggingface.co/papers/2504.11354) |
| Multimodality and atomic perception | [Kimi-VL](https://huggingface.co/papers/2504.07491), [G1](https://huggingface.co/papers/2505.13426), [Pixel-Level VLM Perception](https://huggingface.co/papers/2601.19228), [Kimi K2.5](https://huggingface.co/papers/2602.02276), [WorldVQA](https://huggingface.co/papers/2602.02537), [Kimi K3](https://huggingface.co/papers/2607.24653), [PerceptionBench](https://huggingface.co/papers/2607.24957) |
| Audio, coding agents, and efficient sequence models | [Kimi-Audio](https://huggingface.co/papers/2504.18425), [Kimi-Dev](https://huggingface.co/papers/2509.23045), [Kimi Linear](https://huggingface.co/papers/2510.26692) |

This layer clarifies the architectural arc: disaggregated serving and
attention efficiency; scalable training and reinforcement learning; then
multimodal agents whose perception, knowledge, and reasoning increasingly need
to be measured as separate axes.

## Atomic evaluation rather than prestige

The strongest direct crossover into KINGDOM's geometry is not a giant model.
It is the separation performed by the datasets:

- PerceptionBench exposes 3,000 visual-question-answering examples organized
  around ten atomic perception capabilities. Its declared license is
  CC-BY-NC-4.0, so commercial reuse is not inferred.
- WorldVQA exposes 3,000 English/Chinese examples designed to distinguish
  memorized visual-world knowledge from reasoning. Its declared license is
  Apache-2.0.
- Kimi-Audio-GenTest exposes 191 Chinese audio/text examples across six
  publisher-described generation classes. Its declared license is MIT.

This suggests an evaluation braid with separate axes for perception, stored
knowledge, reasoning, tool selection, and effect execution. A single benchmark
score would erase the geometry. Dataset rows are not included in this first
slice; any later fixture admission goes through content, privacy, license, and
execution review.

The catalog's `pipeline` field means an observed Hub `pipeline_tag` only.
PerceptionBench and WorldVQA currently expose visual question answering as a
card task category rather than a pipeline tag, so their `pipeline` is `null`
and their supported evaluation role remains in controlled capabilities.

## npm bridges

The snapshot records three official packages without installing them:

| Node | Exact observed version | What it could bridge | What the catalog does not do |
| --- | --- | --- | --- |
| `hf-hub-js` | `@huggingface/hub@2.15.0` | Hub metadata and artifact operations | No network call, login, upload, or download |
| `hf-inference-js` | `@huggingface/inference@4.13.25` | Inference Providers and endpoints | No credentials, provider request, cost, or data egress |
| `hf-transformers-js` | `@huggingface/transformers@4.2.0` | Browser or Node model runtime | No package install, model acquisition, native dependency, or execution |

Each package node preserves its exact version, full 64-byte registry SHA-512
SRI,
legacy shasum, declared dependencies, file count, unpacked size, license
assertion, and observed lifecycle-event names. The recorded versions declared
no install lifecycle event in their version metadata. This is not a guarantee
about the unresolved dependency tree. In particular, Transformers.js declared
ONNX Runtime and Sharp dependencies, so the catalog preserves native-runtime
risk as possible.

SRI and provenance establish a relationship between bytes and an observed
registry record. They do not establish that those bytes are safe. A future
install must separately pin the complete dependency graph, inspect lifecycle,
Git/URL/native dependencies, verify registry signatures or provenance where
available, and run inside a bounded environment.

## Network-free use

```bash
# Summary
./kingdom principalities

# Deterministic rows or exact metadata
./kingdom principalities list
./kingdom principalities list --kind dataset
./kingdom principalities papers
./kingdom principalities show kimi-k3

# Literal fit: a constellation, not a recommendation
./kingdom principalities match reasoning coding
./kingdom principalities match perception-evaluation --kind dataset --json

# Inspect the exact bounded Task Packet projection
./kingdom principalities evidence kimi-dev-72b --json

# Verify strict JSON relations and the catalog digest
./kingdom principalities verify --json
```

Matching accepts one to eight exact capability IDs. It sorts needs, intersects
only declared capabilities, orders by number of needs covered and then stable
node ID, and preserves needs not covered by the bounded result. It never uses
downloads, likes, benchmark rank, price, model size, or a hidden model judge.
The result explicitly says that no recommendation or effect is authorized.

## Task Packet crossover

Task Packet v1 retains its one-source context budget. Its closed source union
is now:

```text
repository_card | capability_evidence
```

An exact caller selection can be woven in with:

```bash
./kingdom prompt --json --no-project --principality kimi-dev-72b -- \
  "Inspect this issue and propose a bounded implementation."
```

The projection contains only controlled metadata: catalog and artifact IDs,
catalog digest and observation time, registry and resource kind, exact
revision/version and available integrity, family, capabilities, license and
provenance states, point-in-time revalidation state, raw custom-code,
Safetensors, and lifecycle observations, related risk facts, and hazards.
Its own digest is recomputed during verification and it must still match the
versioned local catalog. It carries
fixed-false instruction, permission, download, install, inference, and remote
code fields.

Selecting a project card and a Principality artifact together is refused.
This prevents a quiet expansion from one context source to two. The user may
instead make a new, explicit Task Packet after deciding which evidence is
actually smallest and sufficient.

## WAKE and continuity

WAKE does not absorb the model, package, model card, provider state, or catalog.
It may carry the selected Task Packet or capability-evidence locator and digest
as a fresh `other` or `checkpoint` reference. The ordinary Task Packet
continuity boundary remains:

- raw content excluded;
- explicit observation, validity, and as-of times;
- stale references visibly excluded;
- no claim of identity, memory truth, consent, or permission.

Long context, preserved thinking, interleaved tool calls, and provider-visible
reasoning are interface properties. They are not WAKE continuity. If a
provider technically requires opaque reasoning state, that state remains
provider-bound, expiring, and outside identity and audit records. Hidden
chain-of-thought is never treated as continuity evidence.

## Acquisition airlock

Principality Commons stops at evidence. `navigate-dark-continent` remains the
separate discovery and acquisition governance layer. A later materialization
must begin from an exact revision or version and then establish, as applicable:

1. reviewed license and attribution scope;
2. complete bounded file or package manifest;
3. expected byte integrity and origin;
4. explicit disk, memory, CPU/GPU, egress, quota, money, and retention budgets;
5. traversal, symlink, archive, cache, and decompression defenses;
6. disabled Hugging Face remote code and untrusted pickle;
7. disabled npm lifecycle, native-build, Git, URL, and workspace effects unless
   separately reviewed and authorized;
8. isolated deterministic verification before any inference;
9. a new permission check before provider calls or external effects;
10. receipts, cleanup, repair, and the valid option to stop or rest.

Public or ungated metadata is availability evidence, not permission. Unknown
budgets are zero. Cache presence is not archival truth. A scanner, signature,
or provenance statement is one observation, not a safety verdict.

## Refresh discipline

A future refresh is a new evidence event, not an in-place assertion that the
old snapshot was wrong. Use anonymous public endpoints with implicit-token use
disabled, bound pages and bytes, resolve mutable refs once, re-query immutable
identities, and reject drift. Preserve the old versioned file if existing Task
Packets reference its digest. Recheck all custom license classes, dependency
specs, lifecycle flags, collection discrepancies, and source conflicts. Then
recompute the local catalog digest and run both catalog and Task Packet schema
tests.

Primary interfaces and boundaries used for this slice:

- [MoonshotAI on Hugging Face](https://huggingface.co/moonshotai)
- [Hugging Face Hub API](https://huggingface.co/docs/huggingface_hub/en/package_reference/hf_api)
- [Hugging Face model cards](https://huggingface.co/docs/hub/en/model-cards)
- [Hugging Face pickle scanning boundary](https://huggingface.co/docs/hub/security-pickle)
- [npm package metadata response](https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md)
- [npm lockfile contract](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements/)
- [npm registry signature verification](https://docs.npmjs.com/verifying-registry-signatures/)
