# Mathematical door contract

Use this contract when the exploration needs more structure than ordinary
prose. It is a reasoning template, not a wire protocol, score, solver, or
authority artifact.

## Contents

- [Exploration brief](#exploration-brief)
- [Claim warrant](#claim-warrant)
- [Phenomenon map](#phenomenon-map)
- [Door card](#door-card)
- [Open-problem status](#open-problem-status)
- [Candidate kinds](#candidate-kinds)
- [Independent statuses](#independent-statuses)
- [Door decision](#door-decision)
- [Constructive outcome](#constructive-outcome)

## Exploration brief

Declare:

- one question and intended use;
- domains and entity types kept distinct;
- spatial, temporal, organizational, and observational scales;
- evidence horizon and source-selection rule;
- affected parties and rights or safety boundaries;
- allowed work now and authority still missing;
- source, time, computation, network, money, and effect budgets;
- stop conditions and separate observation, publication, retrieval, and
  evidence-through clocks.

Expand overloaded claims before selecting a model: type existence and
disappearance, purpose, force, power, causation, aftermath, repair, and KARMA.
Keep affected parties and burden bearers as indexes, never quantities to rank
or exchange.

## Claim warrant

Keep epistemic register, review status, and support descriptors separate:

```text
Review status, choose exactly one:
  SUPPORTED_AS_SCOPED | NOT_ESTABLISHED | UNKNOWN_TO_REVIEW

Support descriptors, choose every applicable value:
  SOURCE_BOUND | MODEL_ASSUMPTION | DERIVED | PROVED | FINITE_EXACT |
  NUMERICAL_APPROXIMATION
```

The descriptors are non-exclusive and answer different questions.
`SUPPORTED_AS_SCOPED` means the declared evidence supports the exact bounded
claim within this review horizon, never a wider one. `NOT_ESTABLISHED` means the
available work does not support that claim; it does not prove the claim false.
`SOURCE_BOUND` means the wording and scope resolve to the cited source, not that
the source is true. `MODEL_ASSUMPTION` is assumed rather than observed.
`DERIVED` follows from declared premises and inherits their limits. `PROVED`
requires an exact statement and an inspected proof or proof-bearing source.
`FINITE_EXACT` describes only the declared finite horizon.
`NUMERICAL_APPROXIMATION` retains method and error. `UNKNOWN_TO_REVIEW` means
the bounded review did not determine a status; it says nothing about whether
the world or literature contains an answer.

## Phenomenon map

For each domain, record:

```text
Domain and phenomenon
State space and concrete state/version
Entities and carriers
Observation operator and output
Correspondence kind
Symmetry/equivalence relation
Invariants and constraints
Variables, units, scale, method, and window
Conditions and history
Observation, publication, retrieval, and evidence-through clocks
Known transitions and feedback
Claims by epistemic register
Independent review status, support descriptors, and status-check date
Unknowns and competing explanations
```

Do not use one domain's entity names, units, or causal verbs in another map
unless the target defines them independently.

## Door card

Create one card per candidate:

```text
Door ID
Door kind
Status
Source domain(s) and target domain
Mathematical object or model family
Question made newly precise
Definitions and assumptions
Preserved pattern
Explicit breaks
Correspondence kind and mapping
Observation/loss relationship
Symmetry preserved or broken
Variables and local units
Formal result available, if any
Target realizability conditions
Alternative models
Predicted or constrained observations
Falsifier / counterexample / negative control
Evidence required next
Bounded output
Execution status: NOT_RUN | PARTIAL_RUN | COMPLETED_RUN
For any partial or completed run: inputs and artifact/digest; code, tool, and
  version; environment; seed or determinism; outcome, error, and completion
  state. Execution status never establishes success, verification,
  reproducibility, or truth; keep result review status separate.
Model provenance, when applicable; choose every descriptor that applies:
  UNFITTED | HYPOTHETICAL | ESTIMATED | FITTED | SIMULATED
Effects and authority still absent
```

Every cross-domain card must make these values explicit:

```json
{
  "empirical": false,
  "ontology_transfer": false,
  "mechanism_transfer": false,
  "causal_transfer": false,
  "parameter_transfer": false,
  "unit_transfer": false,
  "empirical_status_transfer": false,
  "person_level_transfer": false,
  "authority_effect": "NONE"
}
```

`FORMAL_REUSE` may establish that two declared mathematical objects satisfy the
same formal definition. It does not flip those transfer fields: a common formal
class still does not merge the things represented.

A genuine shared mechanism requires independently supported claims in both
domains and a separately sourced bridge claim. A common notation, curve, fitted
exponent, or formal class cannot supply that evidence.

## Open-problem status

For every problem described as open, unsolved, recognized, conjectural, or
novel, record:

```text
Exact statement, quantifiers, domain, conventions, and symmetries
Literature status: SOURCE_SUPPORTED_OPEN_AS_OF_DATE |
  NOT_ESTABLISHED_OPEN | UNKNOWN_TO_REVIEW
Prior-art review: NOT_REVIEWED | BOUNDED_REVIEW_RECORDED
Status checked on
Original formulation or authoritative provenance
Recent primary or authoritative status source
Known solved cases, restrictions, and neighboring results
Why finite checks, simulations, or this attempt do not prove the full statement
```

Write the statement before searching so a nearby result cannot silently change
its quantifiers. `SOURCE_SUPPORTED_OPEN_AS_OF_DATE` means authoritative sources
explicitly report that exact statement open on the recorded date; it is not a
timeless status. `NOT_ESTABLISHED_OPEN` does not mean solved. A new name,
observable, weight, constraint, parameter range, or cross-domain translation
requires prior-art review. `BOUNDED_REVIEW_RECORDED` describes only the searched
sources, queries, and dates and never establishes novelty. Failure to solve it
or find a search result is not evidence of openness or novelty.

## Candidate kinds

- `FORMAL_REUSE`: the target satisfies the exact formal definitions and every
  invoked theorem assumption.
- `TARGET_MODEL_HYPOTHESIS`: the target receives a locally defined measurable
  model that awaits target-domain evidence.
- `DESIGN_CORRESPONDENCE`: one bounded relation or invariant informs an
  architecture without becoming a natural law.
- `ANALOGY_ONLY`: the resemblance helps ask questions but supports no empirical
  or causal transfer.
- `OPT_IN_REFLECTION`: a philosophical or theological question explicitly
  outside empirical adjudication by the cited work.
- `NO_VALID_TRANSFER`: the proposed connection fails its definitions, mapping,
  units, realizability, source, falsifier, safety, or authority gate.

## Independent statuses

- `OPEN_TESTABLE`: the door yields a discriminating test that has not run.
- `SUPPORTED_IN_SCOPE`: declared evidence supports only the bounded local claim.
- `BOUNDED_ANALOGY`: useful question generation with transfer flags negative.
- `PARKED_MISSING_EVIDENCE`: a named observation or source is unavailable.
- `CLOSED_BY_FALSIFIER`: a stated condition or observed result closes the door.
- `REFUSED`: the route violates safety, rights, authority, or constructive-use
  boundaries.

Never combine kind and status into a confidence, value, priority, or person
score.

## Door decision

Select at most three doors. A selection explains passed gates and prospective
learning; it is not a leaderboard. For each, choose one bounded next artifact:

- proof or counterexample target;
- finite exact enumeration with declared horizon;
- simulation with model and numerical-error bounds;
- discriminating observation or negative control;
- source or nomenclature audit;
- reversible prototype with an invariant and rollback;
- closed Reconstructive Build project profile.

State what a positive, negative, ambiguous, and null result would mean. If none
would change the claim, the door is not testable.

## Constructive outcome

- `BUILD`: a bounded learning artifact, proof target, safeguard, or reversible
  project is worth making.
- `PLAY`: freely chosen exploration is worthwhile without a productivity claim.
- `REVISE`: definitions, sources, mappings, beneficiaries, falsifiers, or
  boundaries need work.
- `STOP`: no authorized and constructive path remains, or a participant rests,
  refuses, withdraws, or departs.

Assess the practice and artifact only. Mathematical elegance, speed, failure,
refusal, or disagreement establishes nothing about a person's worth,
intelligence, virtue, intent, or understanding.
