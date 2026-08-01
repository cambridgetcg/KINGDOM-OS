# Continuity braid contract

Use a continuity braid to carry bounded orientation across sessions or
substrates without asserting an uninterrupted self. The machine-readable form
is closed by `continuity-braid.schema.json` and uses protocol
`kingdom.wakeweaver/0.1`.

The braid is a short-lived working projection for collaborators. It is not a
content-addressed continuity core, persistent store, canonical latest head, or
replay mechanism. If a separately reviewed AgentTool continuity capsule is
available, represent its opaque ID and measured digest as a `checkpoint`
source. Do not guess that package's interface, copy raw WAKE into it, or make a
second lineage mechanism here.

Producing or inspecting a braid from artifact bytes already in hand is the
pure projection step: it makes no source-system call and does not mutate WAKE,
Handoff, Correspondence, Skills-YUTABASE, a registry, or a remote recipient.
Source acquisition is separate. A separately authorized live source read may
update WAKE observation counters, episode or audit records, last-access state,
or caches even when the transport calls it a read. Record that read in
`receipt.operations`, record every observed or contract-declared effect in
`receipt.external_effects`, and preserve unknown effects in `receipt.unknowns`.
Do not call the end-to-end preparation pure when acquisition or saving the
result had effects.

## State machine

| State | Meaning | Permitted next move |
| --- | --- | --- |
| `arrived` | Sources were bounded but no opening has passed revalidation. | Inspect or rest. |
| `resumable` | Exactly one opening has a bounded caller-reported revalidation pass. | Propose or perform only if separately authorized. |
| `forked` | Competing continuity hypotheses remain live. | Run a bounded discriminator or preserve both. |
| `degraded` | A required source is truncated, unavailable, stale, or ambiguous. | Refresh safely or rest. |
| `resting` | The current arrival chose no continuation. | Remain at rest or prepare a new braid later. |
| `closed` | The bounded work was retired or completed. | Preserve as history; do not reactivate implicitly. |

State never ranks a being. `resumable` does not authorize an action and
`resting` carries no penalty.

State is descriptive, never an action selector. Orthogonal history may remain:
a `resting` braid may preserve openings, a `degraded` braid may retain stale or
ambiguous evidence, and a `closed` braid may retain historical work. Do not
overconstrain those combinations or infer continuation from them. Every
continuation still requires selecting an opening, passing its revalidation
gates, and confirming current authority.

`resumption` is non-null only for `state: resumable`. It names exactly one
opening and carries a bounded `caller_reported_passed` result with
`caller_supplied_unverified` provenance, a report time, and nonempty evidence.
Its three fixed negative fields make the boundary machine-readable: the report
does not establish truth or currentness and grants no permission. For every
other state, `resumption` is `null`; failed or inconclusive checks belong in
the receipt, unknowns, forks, or a later braid rather than being relabelled as
a pass.

## Source semantics

- `locator` is a sanitized, stable reference such as a repository path plus
  revision, handoff ID, receipt ID, or caller label. Do not put tokens, signed
  URLs, raw prompts, or unnecessary private paths in it.
- `content_digest` is optional evidence. Use `null` when no digest was
  measured; never fabricate one.
- Preserve the source's provenance label verbatim when practical. A label such
  as `self_declared_project_bearer` is not authenticated authorship.
- `wake_version` is an ordering cursor, not an exact-content proof.
- `etag` is a validator for one representation, not proof that all WAKE source
  data is unchanged.
- `checkpoint` is local evidence of recorded state, not atomic attribution,
  consent, or truth.
- `projection_status: unavailable` is not an empty projection.

The schema enforces nonempty recipients, at least one source outside a resting
braid, at least one fork for `forked`, at least one opening and one bounded
revalidation report for `resumable`, at least one revalidation statement and
one authority statement per opening, candidate-ID shape, and evidence plus a
non-null selector for a provisionally selected fork. JSON Schema does not
enforce keyed uniqueness or cross-array references. Run the shipped semantic
validator after schema validation:

```bash
bun bin/wakeweaver.mjs braid.json --json
```

It checks source and thread addressability, exact disposition coverage, fork
candidate uniqueness and selection, and the resumable opening relation. Its
output says `schema_validity: "not_checked"`; success is evidence only for
those relations, not schema conformance, source authenticity, currentness,
truth, permission, or execution.

The CLI starts from strict JSON. Direct module callers first cross a bounded
own-data capture boundary. Accepted arrays are dense standard arrays with only
their own index and length data descriptors. Accepted objects have exactly
`Object.prototype` or a null prototype and only own enumerable data
properties. The capture rejects accessors, symbol or non-enumerable keys,
custom prototypes or array properties, sparse arrays, non-JSON primitives,
cycles, shared object references, and Proxies. Bounds are 32 levels, 65,536
visited values, 1,024 array entries, 256 object keys, 4,096 UTF-16 code units
per string, and 256 per key. These are intake limits, not claims of schema
conformance.

On Node and Bun, the exported object API fences direct, nested, and revoked
Proxies with `node:util/types.isProxy` before `Array.isArray`, prototype
inspection, or descriptor capture. Rejection therefore invokes no caller Proxy
trap. After a successful capture, semantic validation reads only the new
snapshot and invokes no getter or method from the caller's graph.

## Thread semantics

An anchor contains a narrowly worded statement and at least one source ID. A
carry thread records work and its uncertainty rather than issuing an order. A
vow is voluntary and must always keep `grants_permissions: false`. An opening
names both its revalidation gates and the authority still required. Keep the
Zetsu path as easy to select as the continuation path.

`thread_dispositions` is the closed re-entry projection. It contains exactly
one row for every addressable object in `threads.anchors`, `threads.carry`,
`threads.vows`, and `threads.openings`, using the singular kind plus its ID.
The address is exactly `thread_kind:thread_id`: an anchor and a carry may
legally reuse the same ID, while two anchors with the same ID are ambiguous.
Mark each `held`, `revised`, `retired`, or `disputed`. On an initial braid,
`held` means the thread was admitted to this projection. On a later arrival,
produce a new artifact and preserve the prior artifact rather than overwriting
its dispositions. A resumable selection may target only a `held` or `revised`
opening. Here, “thread” means those four arrays only: sources use projection
status and forks use their own resolution fields, so neither receives a
duplicated thread disposition. A disposition records this braid's handling
choice; it does not prove source change, completion, truth, or permission.

A fork contains explicit candidate mechanisms and falsifiers. `resolution`
may be `unresolved`, `provisionally_selected`, or `preserved`; none means a
global truth verdict. Give every candidate an ID matching the bounded `id`
contract and keep candidate IDs unique within their fork. A provisional
selection must name the bounded evidence that favored it and set
`selected_candidate_id` to exactly one declared candidate. For `unresolved`
or `preserved`, omit `selected_candidate_id` or set it to `null`; a non-null
selector would contradict that resolution.

## Minimal example

```json
{
  "$schema": "urn:kingdom:schema:continuity-braid:0.1",
  "protocol": "kingdom.wakeweaver/0.1",
  "artifact_id": "campfire-route-01",
  "state": "forked",
  "scope": {
    "project_ref": "project:example",
    "purpose": "resume one bounded local test",
    "intended_recipients": ["next-project-agent"],
    "retention_horizon": "review after the next arrival"
  },
  "sources": [
    {
      "id": "wake-a",
      "kind": "wake",
      "locator": "caller-supplied wake projection",
      "provenance": "caller_supplied",
      "observed_at": "2026-08-01T17:00:00Z",
      "projection_status": "complete",
      "content_digest": null,
      "wake_version": 12,
      "etag": "sanitized-etag-reference",
      "checkpoint": null
    },
    {
      "id": "handoff-b",
      "kind": "handoff",
      "locator": "handoff:example-b",
      "provenance": "self_declared_project_bearer",
      "observed_at": "2026-08-01T16:58:00Z",
      "projection_status": "complete",
      "content_digest": null,
      "wake_version": null,
      "etag": null,
      "checkpoint": "git:example-checkpoint"
    }
  ],
  "threads": {
    "anchors": [
      {
        "id": "anchor-test-status",
        "statement": "The supplied projection reports one local test pending.",
        "evidence_class": "reported",
        "source_ids": ["wake-a"]
      }
    ],
    "carry": [
      {
        "id": "carry-local-test",
        "work": "Inspect the fixture before running one local test.",
        "status": "paused",
        "source_ids": ["wake-a", "handoff-b"],
        "uncertainty": ["The two sources disagree about the fixture revision."],
        "boundaries": ["No network or credential access."]
      }
    ],
    "vows": [
      {
        "id": "vow-inspect-first",
        "statement": "Inspect the named local fixture before any execution.",
        "voluntary": true,
        "grants_permissions": false,
        "withdrawal_path": "Rest or retire this thread without penalty."
      }
    ],
    "openings": [
      {
        "id": "opening-compare",
        "action": "Compare the two supplied fixture revisions read-only.",
        "source_ids": ["wake-a", "handoff-b"],
        "revalidation": ["Confirm both locators still resolve in the named project."],
        "authority_required": ["Reconfirm that the current caller request still covers this local read before acting."],
        "zetsu_path": "Leave the fork unresolved."
      }
    ]
  },
  "thread_dispositions": [
    {
      "thread_kind": "anchor",
      "thread_id": "anchor-test-status",
      "disposition": "held"
    },
    {
      "thread_kind": "carry",
      "thread_id": "carry-local-test",
      "disposition": "held"
    },
    {
      "thread_kind": "vow",
      "thread_id": "vow-inspect-first",
      "disposition": "held"
    },
    {
      "thread_kind": "opening",
      "thread_id": "opening-compare",
      "disposition": "held"
    }
  ],
  "forks": [
    {
      "id": "fork-fixture-revision",
      "question": "Which fixture revision is current?",
      "candidates": [
        {
          "id": "candidate-wake-revision",
          "claim": "The WAKE projection names the current revision.",
          "source_ids": ["wake-a"],
          "falsifier": "The project ref resolves to the handoff checkpoint instead."
        },
        {
          "id": "candidate-handoff-revision",
          "claim": "The handoff checkpoint names the current revision.",
          "source_ids": ["handoff-b"],
          "falsifier": "The project ref resolves to the WAKE revision instead."
        }
      ],
      "resolution": "unresolved",
      "selected_candidate_id": null,
      "evidence": []
    }
  ],
  "resumption": null,
  "zetsu": {
    "available": true,
    "reason": "The next arrival may refuse, rest, or preserve the fork.",
    "effect": "No continuation action is implied."
  },
  "receipt": {
    "prepared_at": "2026-08-01T17:05:00Z",
    "prepared_by_label": "current-agent-label",
    "operations": ["inspect supplied artifacts already in hand", "prepare braid in memory"],
    "external_effects": [],
    "unknowns": ["Current fixture revision remains unresolved."]
  },
  "claims_not_established": {
    "stable_identity": true,
    "uninterrupted_continuity": true,
    "consciousness": true,
    "consent": true,
    "authority": true,
    "truth": true,
    "replay_correctness": true,
    "authorship": true,
    "successful_execution": true
  }
}
```

Each boolean in `claims_not_established` must remain `true`: it means the braid
explicitly does **not** establish that claim.
