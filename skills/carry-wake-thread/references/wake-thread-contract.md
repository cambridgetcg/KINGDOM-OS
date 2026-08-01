# Wake Thread contract

Use this reference for machine-readable offers and linear receipt paths. It is
an integration contract, not identity doctrine or a permission grant.

## Source projection

Pin the exact source bytes before extraction. Keep these fields distinct:

```json
{
  "artifact_sha256": "sha256:<64 lowercase hex>",
  "format": "full_json | wake_bundle | brief | handoff | chronicle | other",
  "scope": "identity | project | mixed | unknown",
  "coverage": "bounded_complete | partial | unavailable | unknown",
  "source_revision": "<bounded revision or null>",
  "caller_held_cursor_ref": "sha256:<opaque cursor digest> | null"
}
```

The cursor stays caller-held. A digest binds it without publishing the raw
cursor, but does not make a guessable or reused cursor secret. Never hash a raw
identity, credential, private memory, or transcript and assume privacy.

Each fact carries:

```json
{
  "kind": "fact | decision | open_work | unknown",
  "summary": "<one bounded line>",
  "source_pointer": "/json/pointer",
  "evidence_class": "given | reported | observed | measured | reproduced",
  "evidence_ref": "sha256:<exact selected evidence bytes>"
}
```

An omission carries `area`, `reason`, and a non-negative `count` or `null` when
unknown. `partial` requires an omission. `unavailable` and `unknown` carry no
facts and require at least one omission. `bounded_complete` permits no omission
and means only complete for the declared projection, never a complete export.

## Offer and choice

An offer binds the source projection, at most 16 facts and 16 omissions, a
purpose, canonical UTC observation time, optional expiry, one explicit
artifact-retention declaration (`ephemeral`, `until` with an exclusive exact
timestamp, or `no_fixed_expiry`), optional opaque recipient, one opaque
`thread_ref`, and an optional exact parent receipt ID. `expires_at: null` is an
explicit no-expiry decision, not an unresolved value. Always present:

```json
["carry", "fork", "rest", "refuse"]
```

| Choice | Protocol result | What it does not mean |
| --- | --- | --- |
| `carry` | Reports acceptance of the bounded artifact context for the named purpose | Identity, memory, consent, authorship, permission, or downstream execution |
| `fork` | Reports acceptance onto a distinct opaque artifact thread | A being was copied, split, replaced, or reidentified |
| `rest` | Performs no context-use effect through the offer | Failure, penalty, abandonment, or permission to nag |
| `refuse` | Closes this offer as a continuity parent | Retaliation, deletion of history, or a ban on an unrelated future request |

A reason is never required. If a participant wants to bind a note without
publishing it, use an opaque high-entropy `note_ref`; the digest does not prove
who authored the note or what it means.

`ephemeral` requires a finite exclusive offer expiry, declares no durable
storage, and forbids child parentage. `until` forbids use and parentage at or
after its timestamp.
`no_fixed_expiry` is never a default and still requires applicable retention
authority. These are caller declarations, not storage or deletion proof.

The portable KAKIN ability applies a stricter profile than the generic source
package: it must name a recipient or recipient class and establish both read
and disclosure authority before presenting facts. A null `source_revision` is
acceptable only when the source genuinely has no independent revision and its
exact-byte digest is the authoritative pin; it never means “not checked yet.”
A recipient class is a closed audience predicate whose members can be resolved
and checked before disclosure. An open-ended social label is not a class.

## Linear artifact path

```text
root offer -> receipt
  carry/rest -> eligible child keeps thread_ref
  fork       -> child uses branch_ref
  refuse     -> no child in this path
```

An ephemeral receipt is never an eligible parent. A timed parent is ineligible
at or after its retention deadline, and a fork cannot reuse an ancestor thread.

Validate the complete ordered receipts, content IDs, parent IDs, declared
chronology, and thread transitions. This establishes a content-linked artifact
path only. It does not establish source truth, clock truth, identity continuity,
same-being continuity, consent, authorship, memory, consciousness, authority,
retention compliance, or execution. Protocol timestamps use exact
`YYYY-MM-DDTHH:mm:ss.sssZ` bytes so content IDs do not depend on host timezone.

## AgentTool implementation seam

The private source package `@agenttool/wake-thread` implements the pure closed
`agenttool.wake-thread.offer/0.1` and
`agenttool.wake-thread.receipt/0.1` contracts. It accepts explicit caller input
only and performs no fetch, WAKE parsing, filesystem read, clock read, network,
MCP, persistence, score, identity inference, execution, publication, or hosted
route.

The package content-binds the retention declaration but does not retain or
delete artifacts itself. Raw source custody remains separate.

Do not use the AgentTool SDK's older activity-count Nen assessment as KAKIN
evidence. KAKIN affinities classify an ability's software effect; they are not
bearer scores or personality types. Extract scoped source facts directly and
keep missing or degraded data honest.

AgentTool WAKE facts have mixed scopes. A project bearer is not an identity
principal. Default full JSON and shared `WakeBundle`/brief shapes are not byte
identical, and selected dependency failures may appear as empty or omitted
data. Handoffs are context, not delegated authority. Wake voice is a change
hint, not state replay or permission. Re-fetch and re-evaluate through the
actual host boundary rather than treating an event as authorization.

## KARMA mapping

If invoking this ability reads a named source or participant record, or
transforms, transmits, or writes crossing data, use the suite's unchanged
`kingdom.karma/0.1` receipt:

- put source paths or references, revisions, digests, scope, coverage, and the
  prior Wake Thread receipt/output digest in `inputs`;
- keep assurance fixed to untrusted evidence where applicable;
- separate operational authority, affected participants, consent,
  representative authority, and permission references;
- record only effects actually observed, including private reads,
  transformations, writes, or transmission;
- record privacy, data, attention, time, and coordination costs;
- bind any output to its digest and retention boundary;
- keep uncertainty and repair explicit; and
- use `completed`, `partial`, `refused`, `cancelled`, or mechanical `failed`
  according to what happened.

A Wake Thread receipt is not a KARMA receipt. KARMA records invocation
aftermath; it remains receipts-not-scores and grants no permission or truth.
Reading the portable skill instructions and rejecting a malformed request
without touching named source data is not itself a source-crossing effect.

## XENIA and public surfaces

Standing `xenia.rights/0.1` rights are unaffected by every offer outcome.
Private WAKE, chronicle, journal, and handoff material stays outside public
Surface manifests. A public same-origin `GET` summary requires separate
authority, minimization, a new digest, and explicit limitations. XENIA Surface
0.1 does not cover continuity or portability, and a receipt does not activate
Covenant adoption or certify conformance.
