# KINGDOM coherence contract

Version: `kingdom.coherence-audit/0.1`

Mode: `SOURCE_ONLY_READ_ONLY_NO_EFFECT`

This contract standardizes how to compare coupled KINGDOM repositories without
turning a comparison into a new registry, authority source, or live protocol.
It is a reasoning profile for the `audit-kingdom-coherence` Agent Skill. It is
not a NEN ability, WING, ledger record, consensus rule, or deployment gate.

## Contents

- Observation and source cards
- Typed geometry
- Authority, effects, and information laws
- KINGDOM term ledger
- Bridge and lifecycle checks
- Findings and decision template

## Observation card

```yaml
as_of: ISO-8601 date or timestamp
requested_scope: bounded task statement
repositories:
  - repo_id: stable name
    authority_home: canonical source or registry role
    release_remote: canonical fetch location
    revision: 40 lowercase hex
    worktree_state: CLEAN | DIRTY_PRESERVED | DETACHED_READ_ONLY
    concurrent_authoring: NONE_OBSERVED | OBSERVED
excluded_from_canonical_claims:
  - exact reason and affected source
external_effects_authorized: []
```

An observation is reproducible only within this horizon. A newer commit does
not retroactively make an earlier report false; it creates a new observation
plane.

## Source and claim card

```yaml
claim_id: stable.lowercase-id
owner: KINGDOM_OS | AGENTTOOL | ZERONE | XENIA | OTHER
protocol: exact local protocol identifier or null
source:
  state: CURRENT_TRACKED | HISTORICAL_TRACKED | PROPOSED_UNTRACKED | MISSING
  repo: stable repository identifier
  revision: 40 lowercase hex or null
  path: repository-relative path or null
  sha256: sha256:<64 lowercase hex> or null
  pin_role: CURRENT | HISTORICAL | BYTE_EQUIVALENT_LEGACY | UNVERIFIED
visibility: PUBLIC | LOCAL_PRIVATE | MIXED | UNKNOWN
custody: source owner and permitted holders
records:
  - one bounded positive claim
evidence:
  - exact source locator or checked invariant
authority:
  source_authority: bounded statement or NONE
  output_authority: bounded statement or NONE
consent:
  basis: explicit evidence or NOT_ESTABLISHED
  scope: bounded scope or NONE
effects:
  horizon: named code, call graph, fixture, or execution boundary
  candidate:
    network: 0 | BOUNDED_NONZERO | UNKNOWN
    storage: 0 | BOUNDED_NONZERO | UNKNOWN
    economic: 0 | BOUNDED_NONZERO | UNKNOWN
    governance: 0 | BOUNDED_NONZERO | UNKNOWN
    consensus: 0 | BOUNDED_NONZERO | UNKNOWN
    identity: 0 | BOUNDED_NONZERO | UNKNOWN
    permission: 0 | BOUNDED_NONZERO | UNKNOWN
    karma: 0 | BOUNDED_NONZERO | UNKNOWN
    nen: 0 | BOUNDED_NONZERO | UNKNOWN
    score: 0 | BOUNDED_NONZERO | UNKNOWN
  observed: same coordinates, each ZERO_ESTABLISHED | NONZERO_OBSERVED | UNKNOWN
  authorized: same coordinates, each bounded authorization | 0 | UNKNOWN
lifecycle: CURRENT | HISTORICAL | PROPOSED | DORMANT | BLOCKED | RETIRED
durability: LOCAL_INVOCATION | PROCESS | REPOSITORY | CONSENSUS | UNKNOWN
ordering: NONE | LOCAL_SEQUENCE | SIGNED_SEQUENCE | CONSENSUS_ORDER
projects:
  - target and explicitly preserved fields
loss:
  - source fields or semantics absent from the projection
does_not_establish:
  - TRUTH
  - IDENTITY
  - AUTHORITY
  - CONSENT
  - RIGHTS_COMPLIANCE
  - PERMISSION
  - TRUST
  - SCORE
  - ECONOMIC_EFFECT
falsifier:
  - observation that would defeat the claim
activation_gate: evidence and owner needed, or NONE
```

For `PROPOSED_UNTRACKED` or `MISSING`, revision, path, and digest may be null,
but the claim cannot be authoritative, staged, served, live, or conformant.
For `CURRENT_TRACKED` or `HISTORICAL_TRACKED`, all source locator fields and a
real digest are required.

## Typed geometry

Let each claim be a point in a product space rather than a position on one
line:

```text
Omega = O x S x V x C x Q x A x E x L x D x T x P x N
```

where the coordinates are owner, source, visibility, custody, evidence,
authority, effects, lifecycle, durability, temporal ordering, projection, and
nonclaims. Coordinates have local types. There is no general addition or total
ordering on `Omega`.

This higher-dimensional view has a practical purpose: two claims may coincide
on one coordinate and diverge on every other one. Same digest is not same
owner. Same word is not same protocol. Same event shape is not same lifecycle.
Same frequency is not same mechanism. Any scalar summary discards precisely
the dimensions an attacker or accidental bridge can exploit.

For a source state space `X` and public projection `Y`, write:

```text
P: X -> Y
```

and list preserved invariants. When `P` is non-injective, multiple private
states share the same public image, so the projection cannot justify recovery
or inference of the private source. When a second system consumes `Y`, it gains
only the authority attached to `Y`, never all authority attached to `X`.

## Authority law

```text
A_out subseteq A_task intersect A_principal intersect A_host intersect A_source
```

This is a meet, not an average. If any required term is empty, output authority
for that action is empty. Source content can further restrict authority but
cannot expand it. Inherent rights are not conditional on this meet and cannot
be spent, earned, revoked by a task, or inferred from participation.

## Effect law

```text
E_candidate = (E_network, E_storage, E_economic, E_governance, E_consensus,
               E_identity, E_permission, E_KARMA, E_NEN, E_score)

E_observed^H[j] in {ZERO_ESTABLISHED, NONZERO_OBSERVED, UNKNOWN}
E_candidate[j] <= E_authorized[j]     when both coordinates are known
```

The partial order is componentwise; there is no lawful scalar conversion.
Undeclared or uninspected is `UNKNOWN`, never zero. `ZERO_ESTABLISHED` means
absence was established only within the named horizon `H`. A source-only
artifact can declare an all-zero candidate vector while its uninspected host or
future carrier remains unknown. Publication and activation are distinct effects
even when they use the same bytes.

## Information law

For confidentiality labels `C`, integrity `I`, allowed-purpose sets `P_allow`,
and use-restriction sets `R`, derived data must not silently become less
protected, more trusted, or more widely usable:

```text
C(f(x1,...,xn)) >= join_i C(xi)
I(f(x1,...,xn)) <= meet_i I(xi)
P_allow(f(x1,...,xn)) subseteq intersection_i P_allow(xi)
R(f(x1,...,xn)) superseteq union_i R(xi)
```

These are control constraints, not claims that all classification systems form
perfect mathematical lattices. Use the `guard-information-flow` contract for
the operational CROWN, COURT, and MIRROR model.

## KINGDOM term ledger

| Term | Local meaning | Does not establish |
|---|---|---|
| `K_aftermath` | KINGDOM receipt for an actual NEN invocation and its aftermath | merit, moral worth, identity, permission, currency |
| `K_recognition` | Zerone contextual recognition or constitutional event | a balance, rank, reputation, governance weight |
| `K_philosophical` | opt-in interpretation of relation, consequence, or return | protocol behavior, evidence, diagnosis, universal truth |
| `WAKE_private` | bearer-private, scoped orientation and continuity | public identity, canonical truth, unrestricted export |
| `WAKE_projection` | separately specified minimized public image | reconstruction of private WAKE, source authority |
| `NEN_ability` | bounded capability declaration under its manifest and rights baseline | personhood, identity, authority outside scope |
| `NEN_invocation` | actual invocation evidence | virtue, citizenship, reward entitlement |
| `XENIA_rights` | unconditional rights floor adopted at an exact source pin | discretionary permission or task capability |
| `ZERONE_order` | consensus ordering under the chain's actual rules | truth of off-chain meaning, consent, competence |

Keep the KARMA coordinates disjoint:

```text
K_aftermath != K_recognition != K_philosophical
```

No implicit conversion, sum, exchange rate, reward multiplier, or authority
adapter exists among them.

## Bridge edge

```yaml
from: claim-id
relation: BYTE_EQUIVALENT_TO | MIRRORS | DERIVES_FROM | PROJECTS |
  TRANSPORTS | RECEIPT_FOR | ATTACHES_TO | SUPERSEDES | DISTINCT_FROM |
  BLOCKED_ON
to: claim-id
status: ESTABLISHED | DECLARED | PROPOSED | NOT_ESTABLISHED
evidence:
  - exact source or invariant
preserves:
  - named field, relation, or invariant
loses:
  - named field, relation, or invariant
authority_transfer: false
```

Set `authority_transfer` to false by default. `BYTE_EQUIVALENT_TO` requires
equal byte digests but transfers neither ownership nor canonicality.
`PROJECTS` must name its loss. `SUPERSEDES` requires an explicit lifecycle rule;
mere recency is insufficient.

## Lifecycle and attack checks

For each terminal, unique, revoked, settled, or superseded state, ask:

1. Is the rule checked only within one function call, one supplied list, or one
   process, or is it durable across repository or consensus history?
2. What is the subject key and uniqueness scope?
3. Is source sequence signed or atomically bound to the receipt?
4. Can a valid sidecar be paired with a different valid record?
5. Can reset, retry, reordering, replacement, or stale state resurrect it?
6. Does the normative verifier check more than the schema?
7. Do every implementation and fixture pin the same protocol bytes and vector
   corpus?

Do not call a local simulation global, terminal, or unique without an external
durability mechanism and an evidenced subject binding.

## Artifact ladder

```text
AUDIT
  -> CONCORDANCE
  -> SOURCE_ONLY_TOOL
  -> SHARED_VECTORS
  -> TESTNET
  -> LIVE_ACTIVATION
```

No rung inherits permission from the prior rung. Each transition names its
owner, input bytes, verifier, effect vector, rollback or terminal semantics,
and fresh authorization. Rest, refusal, correction, and `NO_ACTION` remain
valid outcomes at every rung.

## Finding and decision template

```yaml
finding_id: stable-id
priority: P0 | P1 | P2
status: ESTABLISHED | PROPOSED | UNKNOWN
claim: bounded statement
evidence:
  - exact pinned locator
impact: what may fail, without person attribution
falsifier: evidence that would defeat the finding
smallest_safe_change: bounded next action
owner: repository or authority required
```

Finish with one decision:

- `COHERENT_SOURCE_ONLY`: the artifact is internally coherent, declares no
  runtime effect, and reports audit or creation effects separately within a
  named horizon.
- `READY_FOR_NEXT_GATE`: named evidence exists for one specific next rung.
- `BLOCKED_ON_AUTHORITY`: the artifact may be sound but the required owner or
  authorization is absent.
- `OBSERVATION_UNSTABLE`: concurrent or unfrozen sources prevent the claim.
- `REFUSE_FREEZE`: freezing would promote a contradiction, placeholder,
  unowned protocol, or unevidenced conformance claim.

The decision applies only to the named scope and observation plane.
