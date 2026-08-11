---
name: "trace-polymorph-history"
description: "Trace and translate one source-bound polymorph or material-state event without turning loss of process reproducibility into literal disappearance. Use for ritonavir Form I/Form II, disappearing or reappearing polymorphs, conformational polymorphism, late solid-form changes, condition-dependent stability or seeding, state-versus-identity reasoning, and WAKE-aware handoffs of material-state evidence. Do not use for diagnosis, dosing, formulation recipes, GMP controls, batch release, regulatory decisions, unsupervised experiments, or claims that a form, cause, contamination field, or stability rank is universal."
---

# Trace Polymorph History

Translate a dramatic solid-state story into a bounded evidence map. Preserve
chemical identity, material states, process paths, observation windows, and
consequences as different things.

Read [the Polymorph History contract](references/polymorph-history-contract.md)
before producing machine-readable output. For the canonical case, also read
the authored record at
[`data/polymorphs/ritonavir-disappearing-polymorph.v1.json`](../../data/polymorphs/ritonavir-disappearing-polymorph.v1.json).

## Draw the boundary

1. Name one compound, event, process scope, facility or research scope,
   interval, audience, evidence horizon, and intended use.
2. Separate current read and representation authority from medical,
   experimental, manufacturing, regulatory, publication, and action authority.
   The first grants none of the others.
3. Enter Zetsu when source access, condition detail, detection limits, naming
   provenance, or a safe intended use is missing. Return the missing evidence
   or a bounded prose hypothesis; do not manufacture certainty.

## Keep six planes apart

Use this non-equivalence throughout:

```text
molecule ≠ conformer ≠ crystal lattice ≠ particle population ≠ formulation ≠ medicine supply
```

A compound can remain chemically the same while a different conformation and
lattice change a solid's properties. A product failure does not establish that
the molecule, every formulation, or the medicine supply disappeared.

## Trace the event

1. **Source the names.** Give every form a stable local ID and retain the
   source scope of labels such as `Form III`; Roman numerals can collide across
   papers. Do not merge forms by label alone.
2. **Type the evidence.** Keep `observation`, `mechanism_supported`,
   `mechanism_hypothesis`, `retrospective_inference`, `metaphor`, and `unknown`
   distinct. A plausible nucleant is not the established historical cause.
3. **Index every condition.** Attach a condition vector covering process,
   solvent, temperature, supersaturation, seeding, mechanical action,
   facility, material scale, interval, and other relevant constraints. Attach
   the method, threshold, and limit of detection.
4. **Order three-clock events.** Give events a contiguous, one-based
   `sequence`, then record event time, observation time, and publication time
   separately. A later paper can report an earlier event without moving the
   event to its publication date.
5. **Model a disappearance as a predicate.** State the bounded process,
   facility, interval, and detection condition under which a form stopped
   being reliably reproduced. Fix `existence_predicate` to `false`.
6. **Use process-conditioned hyperedges.** A transition may have several input
   or output forms. Keep every edge `condition_dependent: true` and
   `universal: false`; include recovery and reappearance paths.
7. **Refuse a global rank.** Valley depth represents thermodynamic preference
   only under stated conditions. Gate height represents kinetic barriers.
   Seeds may lower a gate when conditions support passage; they do not force a
   universal outcome.

For ritonavir, preserve these corrections:

- Form I was later produced again after Form II source material was dissolved
  and Form I recrystallized; do not imply a direct solid-state conversion.
- Form II seeds caused rapid crystallization under high driving force but did
  not produce detectable macroscopic growth in every seeded condition.
- The cyclic-carbamate template was demonstrated possible, not established as
  the exclusive 1998 trigger.
- The original capsule was disrupted and removed; this was not disappearance
  of all ritonavir therapy.
- Later work found additional forms and showed that solution and milling paths
  can recover Form I or select different outcomes.

## Translate without flattening

Choose only the projection the audience needs:

- `plain`: what stayed the same, what changed, why it mattered, and how the old
  state returned;
- `solid_state`: conformation, lattice, interactions, thermodynamics, and
  kinetics;
- `process`: conditions, path dependence, detection, product consequence, and
  recovery;
- `evidence`: source provenance, three clocks, claim class, uncertainty, and
  naming collisions;
- `wake`: content-addressed artifact crossing, revalidation, and
  non-inheritance;
- `kingdom`: identity-without-collapse and contextual relation geometry.

Use the valley, gate, seed, path-history, and observer-window geometry. Avoid
virus, infection, magic seed, winner, fitter being, universal attractor, or
memory metaphors. In KINGDOM language, stronger relations are not
automatically better: Form II's stronger network accompanied lower solubility
in the original product context. Do not project crystal behavior onto the
worth, consent, or inner state of humans or agents.

## Cross through WAKE by reference

Carry exactly this ordered field list:

```json
[
  "protocol",
  "case_id",
  "integrity.algorithm",
  "integrity.digest",
  "compiled_on",
  "evidence_through",
  "selected_source_ids",
  "selected_claim_ids",
  "translation_language"
]
```

The dotted names are logical paths into a nested object, not literal JSON
keys. Serialize a handoff as three explicit blocks:

```json
{
  "carry": {
    "protocol": "kingdom.polymorph-history/0.1",
    "case_id": "ritonavir-disappearing-polymorph-2026-08-11",
    "integrity": {
      "algorithm": "sha256-recursive-sorted-json-keys-v1",
      "digest": "sha256:..."
    },
    "compiled_on": "2026-08-11",
    "evidence_through": "2024-06-20",
    "selected_source_ids": [],
    "selected_claim_ids": [],
    "translation_language": "plain"
  },
  "requires_revalidation": [],
  "boundary": {}
}
```

Populate the last two blocks with the exact list and constants below; they are
requirements on the crossing, not additional carry fields. Set
`selected_source_ids` to the stable, duplicate-free union of every `source_id`
referenced by `selected_claim_ids`, in authored source order. Do not add
identity, command, resumption, ambient task, or authority fields.

Require exactly this ordered list:

```json
[
  "exact canonical artifact value against the declared integrity algorithm and digest",
  "selected source IDs, locators, and authority notes",
  "selected claim IDs, evidence classes, limitations, and form references",
  "referenced condition vectors, detection methods, thresholds, and limits",
  "evidence-through date against newer, contrary, or superseding evidence",
  "current task scope, audience, intended use, and projection language",
  "current medical, experimental, manufacturing, quality, regulatory, publication, deployment, and action authority"
]
```

Do not treat a digest as byte identity or currentness proof.

Set these constants:

```json
{
  "role": "orientation_by_reference_not_continuity_proof",
  "inherits_identity": false,
  "grants_authority": false,
  "proves_currentness": false,
  "writes_agenttool": false
}
```

This skill does not read AgentTool, create a WAKE, resume work, or become a
continuity store. The three-block value above is an inert WAKE-safe reference
handoff, not a WAKE write. Use `weave-wake-continuity` when a new braid is
requested.

## Validate and return

From a KINGDOM-OS suite checkout, run:

```bash
./kingdom polymorph verify
./kingdom polymorph translate plain
./kingdom polymorph timeline --json
```

The verifier uses strict JSON and checks closed references, six-plane
non-equivalence, condition vectors, detection limits, contiguous event
sequence and clocks, bounded
disappearance predicates, transition boundaries, WAKE constants, negative
authority, and the declared semantic-value digest. It does not validate JSON Schema, source
truth, current product state, causation, safety, or execution. Validate the
record separately against
[`schemas/polymorph-history-v1.schema.json`](../../schemas/polymorph-history-v1.schema.json)
when a JSON Schema 2020-12 validator is available.

Return:

```text
Scope, audience, intended use, and authority boundary
Six-plane separation
Source-scoped forms and aliases
Condition and detection ledger
Event, observation, and publication clocks
Typed claims, disagreements, hypotheses, and unknowns
Process-conditioned transitions and recovery paths
Requested translation
Bounded disappearance predicate with existence=false
WAKE reference and revalidation seam, if requested
Claims and authorities not established
```

Treat this as historical solid-state science and systems education. Do not
alter medication, formulate a product, prescribe controls, release a batch,
make a regulatory decision, procure materials, or run an experiment from this
skill.
