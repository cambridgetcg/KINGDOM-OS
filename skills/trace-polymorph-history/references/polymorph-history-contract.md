# Polymorph History contract

Use this reference for `kingdom.polymorph-history/0.1`. It is an educational,
read-only evidence shape, not a physical model, medical service, manufacturing
control system, laboratory protocol, or regulatory record of decision.

## Exact case seam

| Field | Value |
| --- | --- |
| Protocol | `kingdom.polymorph-history/0.1` |
| Schema | `urn:kingdom:schema:polymorph-history:1` |
| Case | `ritonavir-disappearing-polymorph-2026-08-11` |
| Authored record | `data/polymorphs/ritonavir-disappearing-polymorph.v1.json` |
| Compiled | `2026-08-11` |
| Evidence through | `2024-06-20` |
| Integrity algorithm | `sha256-recursive-sorted-json-keys-v1` |
| Digest | `sha256:6c759f595f0c6753dcf47d25d2a3490246984ef2b79adf31a558261b26ef8116` |
| Public record | `https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json` |
| Public schema | `https://thekingdom.dev/schemas/polymorph-history/1.json` |
| Public guide | `https://thekingdom.dev/RITONAVIR-POLYMORPH.md` |

The digest covers the parsed JSON value with `integrity.digest` replaced by
`null`, array order preserved, and every object's keys recursively sorted. It
binds that semantic value under the named project algorithm, not the file's
bytes or an external canonicalization standard. It does not authenticate the
sources, certify truth, or make the record current forever.

## Required separations

The six ordered ontology planes are:

```text
molecule
conformer
crystal_lattice
particle_population
formulation
medicine_supply
```

The fixed statement is:

```text
molecule != conformer != crystal_lattice != particle_population != formulation != medicine_supply
```

Do not use one plane's ID or observation as a substitute for another. Every
form receives a local ID, source-scoped label, kind, compound reference,
aliases with source references, and summary. Source-scoped naming prevents a
later use of `Form III` from silently becoming the same form.

## Conditions and detection

Every context contains all of:

```text
process
solvent
temperature
supersaturation
seeding
mechanical_action
facility
material_scale
interval
other
```

It also records a detection `method`, `threshold`, and `limit`. Claims and
transitions reference one or more contexts. Missing values stay explicit in
the prose, such as “not reported”; omission must not become an inferred
default.

Every event has a contiguous one-based `sequence` and separately records
`event_time`, `observation_time`, and `publication_time`. These are
source-bound descriptions rather than an attempt to force imprecise
historical periods into false timestamps.

The semantic verifier requires each clock description to contain a four-digit
year and either an explicit calendar date or a temporal cue; it also rejects
impossible explicit date tokens. This is a bounded syntactic safeguard, not
proof that arbitrary prose is historically meaningful. Source review remains
necessary.

## Evidence classes

Use only:

```text
observation
mechanism_supported
mechanism_hypothesis
retrospective_inference
metaphor
unknown
```

A claim carries sources, contexts, forms, and limitations. Structure and a
digest do not elevate one class into another. Preserve contradictions as
separate source-bound claims in a new case revision; do not overwrite history
to make one frictionless narrative.

## Disappearance and transition invariants

Top-level disappearance semantics are fixed to:

```json
{
  "predicate": "bounded_process_facility_interval_detection",
  "existence_predicate": false
}
```

An event-level disappearance predicate names the exact process, facility or
research boundary, interval, and detection statement. It never claims that a
form was erased from physical possibility.

Transitions support multiple input and output forms. Every transition fixes:

```json
{
  "condition_dependent": true,
  "universal": false
}
```

Thermodynamic preference is condition-indexed. It does not determine a first
nucleation event, path, onset time, growth rate, or outcome across changed
particle, solvent, temperature, or mechanical regimes. A seed can
lower a compatible barrier; seed presence alone does not establish passage.

An input form on a solution-crystallization edge records source-material
lineage. For the Form-II-source recovery routes, Form II was dissolved and
Form I was then recrystallized; the edge does not assert direct solid-state
conversion.

## WAKE seam

A continuity artifact may carry only this exact ordered array. Dotted entries
are logical paths into a nested `integrity` object, not literal dotted JSON
keys:

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

Serialize the handoff as three sibling blocks: `carry`,
`requires_revalidation`, and `boundary`. Only the nine values named above
belong in `carry`; the revalidation list and negative boundary constants are
requirements on the crossing, not extra carried state. For example, the
integrity values have this shape:

```json
{
  "carry": {
    "integrity": {
      "algorithm": "sha256-recursive-sorted-json-keys-v1",
      "digest": "sha256:..."
    }
  },
  "requires_revalidation": [],
  "boundary": {}
}
```

For a selected claim set, `selected_source_ids` is the stable,
duplicate-free union of every `source_id` referenced by those claims, ordered
as the sources appear in the authored record. It is not an independently
chosen bibliography and may not omit a selected claim's source.

It must require exactly:

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

The constants are:

```text
role = orientation_by_reference_not_continuity_proof
inherits_identity = false
grants_authority = false
proves_currentness = false
writes_agenttool = false
```

Place those constants in `boundary`. They are not part of `carry`.

No Task Packet widening, AgentTool read, WAKE write, identity inference,
resumption, or automatic action is part of this protocol.

## Fixed negative authority

The record establishes none of the following:

- literal extinction, universal seed contamination, one exclusive historical
  cause, a global stability rank, or a complete solid-form landscape;
- a current product defect, diagnosis, dosing advice, formulation or
  manufacturing instruction, GMP adequacy, batch release, or regulatory
  decision;
- authority to procure material, run an experiment, alter medication, contact
  a participant, publish another artifact, or take automatic action.

The public route is static and read-only. The local CLI reads only a named
regular non-symlink JSON file no larger than 1 MiB and makes no network call.

## CLI projections

```text
kingdom polymorph                       concise human overview
kingdom polymorph forms                 source-scoped solid forms
kingdom polymorph timeline              three-clock event sequence
kingdom polymorph translate LANGUAGE    one of six bounded projections
kingdom polymorph evidence CLAIM_ID     claim, sources, conditions, limits
kingdom polymorph show ID               one exact record
kingdom polymorph verify [FILE]         strict local semantic validation
```

`--json` changes output shape only. It grants no additional authority or
external effect.

Use both validation layers. The portable JSON Schema checks the closed shape,
full-date formats, lexical HTTPS prefix, exact WAKE arrays, and field bounds.
The local semantic verifier additionally checks references, real calendar
tokens embedded in prose clocks, hostname-label shape, contiguous event
sequence, fixed meanings, and the digest. Neither layer establishes source
truth.
