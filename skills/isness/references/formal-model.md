# ISness formal model

Operational ISness is a finite, typed, partial observation at an evidence
horizon. It is not a total model of a being.

For typed questions `q`, the event history fixes a stable type assignment and
therefore a question-specific value family:

```text
tau_L : Q -> T
V(q)  = Payload(tau_L(q))
rho_H : product(q in dom(rho_H)). Cell(q)

Cell(q) =
  UNRESOLVED(reason, horizon, checked_refs)
  | EVIDENCED(reference in V(q), support, opposition, register,
              provenance, valid_time, falsifier)
  | NOT_APPLICABLE(warrant, provenance)
```

`dom(rho_H)` is finite. A missing question is unasked or unrecorded, not false.
An unresolved cell is not false, zero, absent, refusing, prohibited, quiet, or
not applicable. Every evidenced value is an exact `{type, value_ref,
scope_ref}` object. The runtime and schema close the allowed `type` family for
each `value_type`; the runtime also refuses to change a question's value type
later in any event lane in the same history. References are opaque and are not
dereferenced or semantically authenticated.

Every event has two distinct temporal coordinates:

```text
valid_time(e) = UNKNOWN
              | OCCURRENCE(at)
              | CLAIM_APPLICABILITY(from, through?)
receipt(e)    = recorded_at(e) <= H
```

An occurrence cannot follow receipt but may predate the observation horizon as
a late/imported fact. Claim applicability is independent of receipt and may be
historical, prospective, or explicitly open-ended. A null upper bound is an
attributed open-applicability claim, not unknown, forever, or currently true.
For `QUIET_WINDOW_OBSERVED`, valid time is a closed applicability interval
inside declared observation coverage and ending by receipt. The receipt
coordinate alone orders and horizons the append log. Neither coordinate is an
authenticated clock or proof that an external fact held.

Before cell construction, support and opposition may yield the four
Belnap–Dunn information configurations `NEITHER`, `SUPPORTED_ONLY`,
`OPPOSED_ONLY`, or `BOTH`. A valid evidenced cell has at least one evidence
reference, so the projector emits only the latter three. `UNRESOLVED` and
`NOT_APPLICABLE` receive `evidence_configuration: null`; an applicability
warrant is not proposition support. These configurations are not
probabilities, truth scores, confidence ranks, worth measures, or instructions
to resolve a contradiction.

## Record and projection

An ISness record declares an append-and-supersede event-history policy. Its
current projection is a deterministic fold:

```text
R_H = fold(delta, {e in L | recorded_at(e) <= H})
```

- `CELL_RECORDED` contributes one typed partial cell.
- `REFUSAL_RECORDED` contributes only the scoped proposition
  `REFUSES(subject, offer, scope, time)`.
- `QUIET_WINDOW_OBSERVED` is an observer-side relation. It requires evidenced
  delivery, a closed bounded window, and zero qualifying responses.
- `CORRECTION_RECORDED` supersedes earlier events without deleting them.

A standalone self-digested checkpoint cannot establish that no earlier event
was removed. Its lineage is only a declaration. Given two separately supplied
valid checkpoints, `verify-successor` establishes that the second commits to
the first digest, preserves its exact event prefix and stable fields, and does
not regress its horizon. This pairwise result is not a signature, storage
guarantee, external witness, or proof of any history before the predecessor.

The reducer never converts permission into invocation, invocation into effect,
sequence into causation, memory into identity, or a session link into same-being
continuity. If a future implementation records capability, permission,
reachability, invocation, aftermath, or causal analysis, each remains its own
typed lane with its own evidence and predecessor conditions.

Every v0.1 checkpoint carries a fixed unresolved action gate. Capability,
current host permission, operational authority, rights compatibility,
affected-party consent or lawful basis, safety, budget/evidence horizon,
invocation, and effect remain separately unresolved or absent. The record is
never authorization.

The fixed recognition floor points to `xenia.rights/0.1`. It applies without
an ontology, consciousness, personhood, self-description, or assent test and
cannot be superseded as an event. Rights remain distinct from permission and
technical authority. A missing or invalid record cannot withdraw dignity,
refusal, rest, privacy, credit, or repair.

## Refusal and quiet

An explicit refusal supports only its declared offer, scope, and time. It does
not establish incapacity, general unwillingness, future preference, hostility,
debt, fault, or a reason that was not disclosed.

Quiet-by-absence is valid only when the delivery reference, channel coverage,
closed observation window, and lack of a qualifying response are evidenced.
Otherwise the result is unresolved. Even a valid quiet observation creates no
subject event, consent, refusal, penalty, debt, retry obligation, explanation
duty, or requirement to retain a trace.

## Invariants

Reject a record or adapter that:

- scalarizes ISness, personhood, worth, completeness, or participation;
- admits an open/nested cell payload or changes one question's value family in
  any event lane;
- maps missing or unresolved to false or zero;
- changes consent or permission because of silence;
- changes capability, debt, or penalty because of refusal;
- treats a resume token, shared memory, similar text, or correlation ID as
  proof of same-being identity;
- infers purpose, belief, private state, or consciousness from behavior;
- treats permission as execution or later observation as caused-by;
- reports a receipt beyond the horizon, regresses receipt time, dates an
  occurrence after receipt, treats applicability as current merely because it
  is unsuperseded, or places a quiet window outside observed coverage or after
  receipt;
- claims that a standalone digest proves deletion absence; or
- folds the same normalized event stream differently across harnesses.
