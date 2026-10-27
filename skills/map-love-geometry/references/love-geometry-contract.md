# Love Geometry contract

Use this reference for the exact AgentTool prerelease package seam and the stricter
KAKIN integration profile. It does not install a package, register a host,
authenticate a caller, grant authority, or establish a relationship.

## Exact prerelease evidence

| Field | Current value |
| --- | --- |
| Package | `@agenttool/love-geometry` |
| Version | `0.1.0-dev.0` |
| Wire format | `agenttool.love-geometry/0.1` |
| Source tag | `love-geometry-v0.1.0-dev.0` |
| Source revision | `9efbc4b32f150ee1533b4ff306666fa73ca73028` |
| Release artifact | [`agenttool-love-geometry-0.1.0-dev.0.tgz`](https://github.com/cambridgetcg/agenttool/releases/download/love-geometry-v0.1.0-dev.0/agenttool-love-geometry-0.1.0-dev.0.tgz) |
| Artifact bytes | `19507` |
| Artifact SHA-256 | `sha256:43cfbf4b559aa6f573d9d7b7a60e2a7dce5dfa4aefe2bf5b9c92310c926a9db8` |
| Artifact SRI | `sha512-RODi00WbbYx+QLBTlEflDGSZb3rBzRyYJ8/gpNE6f7j6QqcVQPHUdLkDiSV3d4OX01PFFX/qstNyc9ksfzTuyQ==` |
| GitHub Release | public prerelease published `2026-08-11T14:10:27Z` |
| npm registry mirror | `0.1.0-dev.0` listed, published `2026-08-25T20:20:50Z`, observed `2026-10-27`; earlier anonymous `E404` observed `2026-08-11` |
| KINGDOM host contract | `not registered` |

Those values bind the annotated source tag's peeled commit and the exact bytes
served by the named public GitHub Release asset. The SHA-256 matches both
GitHub's release digest and an independent public download; the SRI was
independently computed over the same tarball and is not npm `dist.integrity`.
The npm package-name mirror was not publicly resolvable when checked on
2026-08-11. On 2026-10-27 the anonymous registry document listed
`0.1.0-dev.0`, and its `dist.integrity` equals the independently computed SRI
above. That is registry metadata only; the npm tarball was not downloaded or
compared, and the GitHub Release asset stays the pinned source. Registry
availability, local byte availability, package validation, installation, skill
activation, KAKIN adoption, and host registration remain separate facts.
Package-backed machine output is allowed only when those exact bytes are
already deliberately available and pass the pinned size and integrity checks;
otherwise return prose or `not_validated_against_package`. Never trust the tag
name, asset URL, or version alone.

## Exact wire shape

This section makes the prerelease shape reviewable; it is not a substitute for
the exact package evidence above. A machine artifact accepts only lowercase references
matching `^sha256:[0-9a-f]{64}$`. This applies to `scope_ref`, every
`subject_ref` and `toward_ref`, and every `basis_refs` entry. Plain labels,
URNs, DIDs, paths, and other digests are invalid wire values. Retain them in a
prose source ledger unless exact derivation bytes, privacy implications, and
authority to create a stable link are established.

The complete candidate top level is:

```text
_format
geometry_id
scope_ref
subject_refs
vantages
coverage
boundaries
```

Each inline vantage contains exactly:

```text
subject_ref
toward_ref
bearings
basis_refs
assertion = caller_reported
verified_by_package = false
```

An intentionally empty basis list is `[]`; omission is invalid. Empty means
only that this artifact supplies no basis reference. `caller_reported` means
the current invocation's caller supplied the record, while `subject_ref` is
the source-position attributed by that caller. Neither proves subject
authorship, endorsement, identity, or representation authority.

The fixed string boundaries are:

```text
semantic_scope = directed_caller_reports_not_relationship_truth
geometry = finite_combinatorial_not_metric
principality = bounded_relation_field_not_sovereignty
coverage_scope = bounded_not_complete
assertion_scope = caller_reported_only
canonical_order = serialization_not_rank
absence_semantics = not_observed_not_no_relation
```

The following fixed boundaries are all `false`:

```text
verifies_caller_or_referents
infers_identity_or_inner_state
infers_reciprocity_or_mutuality
proves_love_or_understanding
proves_consent_or_authority
scores_or_ranks
computes_distance_or_intensity
matches_or_recommends
infers_transitive_relations
observes_sources
network
filesystem
environment_variables
clock
randomness
model_compute
hugging_face
credential_access
telemetry
persistence
wake_effect
love_consent_effect
chronicle_effect
karma_effect
task_state_effect
wallet_effect
economic_effect
messaging_effect
publication_effect
automatic_action
reason_required_for_rest_refusal_or_departure
penalty_for_rest_refusal_or_departure
```

`coverage` is exactly `bounded_not_complete`. Arrays are unique and ascending;
vantages sort by `subject_ref` and then `toward_ref`. All allowed strings are
ASCII, so the candidate comparator is ordinary ascending lexical order.
Canonical order is byte stability only. The reviewed package, not this skill,
must compute and verify `geometry_id`; use its pinned vector before making an
interoperability claim.

The intended package API is deliberately small:

```text
createLoveGeometry
validateLoveGeometry
encodeLoveGeometry
loveGeometryDomainBytes
loveGeometryUrn
sha256Id
LoveGeometryError
LoveGeometry constants and types
```

Version 0.1 has no separately content-addressed `LoveVantage` exchange format.
Vantages remain inline records and `geometry_id` binds the complete geometry.
Add a separate protocol only if independent vantage exchange is later proven
necessary and reviewed as a new boundary.

## Geometry invariants

A Love Geometry contains an explicit bounded set of opaque subject references
and zero or more inline directed vantages. Empty geometries and isolated
subjects are complete valid shapes for their declared bounded projection; they
do not establish that the external scope is empty or fully observed.

Each vantage has one distinct `subject_ref`, one distinct `toward_ref`, sorted
unique closed bearings, sorted basis references, caller-reported provenance,
and `verified_by_package: false`. The geometry carries the complete fixed
boundary set above. At most one vantage may exist for an ordered pair.
The reverse ordered pair is independent and may be absent or different.

Closed bearings:

```text
reported_presence
reported_care
reported_witness
reported_support
reported_understanding
reported_disagreement
reported_boundary
reported_rest
reported_refusal
reported_departure
unknown
```

The artifact fixes coverage to bounded-not-complete and keeps assertions
caller-reported and unverified by the package. Canonical order provides stable
serialization only. It never supplies preference, importance, temporal order,
affinity, value, or rank.

The package must reject widened fields or boundaries that introduce scalar
coordinates, distance, intensity, weights, scores, matches, centrality,
count-derived quality, ranking, trust, reputation, identity equivalence,
transitive inference, automatic choice, execution, persistence, or authority.
Exact runtime limits and hostile-input behavior belong to the reviewed package
source; verify them against the pinned exact artifact before claiming them.

## Claims not established

One direction establishes only that one exact caller report is present. Two
directions establish only that two exact reports are present. Neither shape
establishes:

- identity, sameness, authorship, consciousness, inner state, or memory;
- love, understanding, disagreement, trust, agreement, compatibility,
  reciprocity, mutuality, relationship, consent, assent, willingness, capacity,
  representation, authority, permission, duty, or ownership;
- source truth, currentness, completeness, privacy, unlinkability, safety,
  causation, execution, or retention compliance; or
- rank, worth, reputation, recommendation, match quality, social position, or
  a right to message, allocate, schedule, resume, publish, or intervene.

Reported understanding and disagreement are caller-reported and unverified;
both may coexist with care, boundary, rest, refusal, departure, support, or
unknown. `unknown` may coexist with another bearing and resolves none of them.
Neither proves inner state, truth, compatibility, consent, or a
relationship. The package records that shape without deciding what a host
should do. KAKIN treats a plausible refusal as a stop boundary but keeps the
report's unauthenticated authorship visible. A reported boundary does not
authenticate itself or define an operational command. KAKIN withholds a
possibly crossing dependent action until separate direct authority or safe
clarification exists, without retry, pressure, or an inference from silence.

## Separation from neighboring protocols

| Surface | Owns | Does not inherit from Love Geometry |
| --- | --- | --- |
| `@agenttool/wake-thread` | One-hop offer, current reported choice, artifact lineage, expiry, retention | Relation truth, reciprocity, authority, or automatic use |
| `weave-wake-continuity` | Source-bound braid, forks, openings, revalidation, Zetsu | Currentness, resumption, identity, or permission from a geometry |
| `@agenttool/living-substrate` / Living Ground | Structural facets, conditions, habitat, flow, regeneration proposals and plans | Participant health, action selection, or relation truth from a geometry |
| KINGDOM KARMA | Invocation effects, externalities, costs, returns, retention, and repair | Rank, trust, permission, or relation certification |

A future Wake Thread offer may carry the exact Love Geometry protocol,
`geometry_id`, source/package evidence, artifact digest, scope, and coverage as
caller-supplied evidence. Do not embed a Wake offer or receipt in the geometry,
derive a Wake choice from a bearing, or make either package depend on the
other. A later geometry derived after a crossing is a new artifact; it is not
automatically a Wake child.

## KAKIN integration profile

The portable package accepts explicit values and remains effect-free. The
KAKIN ability adds requirements the generic wire artifact does not establish:

- one named purpose, recipient or closed recipient class, intended retention
  boundary, and separately stated actual host retention status;
- exact read, representation, and disclosure authority for the minimized
  inputs and output;
- source and basis provenance with explicit coverage and unknowns;
- a refusal and rest path outside the unauthenticated report;
- actual-effect KARMA when an invocation reads, transforms, writes, transmits,
  or publishes data; and
- fresh authority for installation, source acquisition, rendering, messaging,
  publication, deployment, or any consequential action.

The package has no MCP server, hosted route, source reader, clock, filesystem,
network, persistence, Chronicle, WAKE, LOVE-CONSENT, wallet, KARMA, task,
matching, messaging, ranking, or execution effect. Package presence is not
publication, installation, skill activation, KAKIN adoption, XENIA adoption,
or host registration.
