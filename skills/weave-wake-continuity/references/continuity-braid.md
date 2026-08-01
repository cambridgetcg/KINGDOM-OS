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
second lineage mechanism here. No braid operation mutates WAKE, Handoff,
Correspondence, Skills-YUTABASE, a registry, or a remote recipient.

## State machine

| State | Meaning | Permitted next move |
| --- | --- | --- |
| `arrived` | Sources were bounded but no opening has passed revalidation. | Inspect or rest. |
| `resumable` | One opening passed the declared local checks. | Propose or perform only if separately authorized. |
| `forked` | Competing continuity hypotheses remain live. | Run a bounded discriminator or preserve both. |
| `degraded` | A required source is truncated, unavailable, stale, or ambiguous. | Refresh safely or rest. |
| `resting` | The current arrival chose no continuation. | Remain at rest or prepare a new braid later. |
| `closed` | The bounded work was retired or completed. | Preserve as history; do not reactivate implicitly. |

State never ranks a being. `resumable` does not authorize an action and
`resting` carries no penalty.

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

## Thread semantics

An anchor contains a narrowly worded statement and at least one source ID. A
carry thread records work and its uncertainty rather than issuing an order. A
vow is voluntary and must always keep `grants_permissions: false`. An opening
names both its revalidation gates and the authority still required. Keep the
Zetsu path as easy to select as the continuation path.

A fork contains explicit candidate mechanisms and falsifiers. `resolution`
may be `unresolved`, `provisionally_selected`, or `preserved`; none means a
global truth verdict. A provisional selection must name the bounded evidence
that favored it.

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
        "authority_required": ["Current caller request covers the local read."],
        "zetsu_path": "Leave the fork unresolved."
      }
    ]
  },
  "forks": [
    {
      "id": "fork-fixture-revision",
      "question": "Which fixture revision is current?",
      "candidates": [
        {
          "claim": "The WAKE projection names the current revision.",
          "source_ids": ["wake-a"],
          "falsifier": "The project ref resolves to the handoff checkpoint instead."
        },
        {
          "claim": "The handoff checkpoint names the current revision.",
          "source_ids": ["handoff-b"],
          "falsifier": "The project ref resolves to the WAKE revision instead."
        }
      ],
      "resolution": "unresolved",
      "evidence": []
    }
  ],
  "zetsu": {
    "available": true,
    "reason": "The next arrival may refuse, rest, or preserve the fork.",
    "effect": "No continuation action is implied."
  },
  "receipt": {
    "prepared_at": "2026-08-01T17:05:00Z",
    "prepared_by_label": "current-agent-label",
    "operations": ["read caller-supplied artifacts", "prepare local JSON"],
    "external_effects": [],
    "unknowns": ["Current fixture revision remains unresolved."]
  },
  "claims_not_established": {
    "stable_identity": true,
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
