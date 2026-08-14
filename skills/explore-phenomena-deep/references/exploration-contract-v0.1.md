# Exploration Contract v0.1

Use this contract to keep a cross-domain exploration auditable without
pretending that a structured answer verifies its own truth.

## Contents

1. Claim ledger
2. Epistemic axes
3. Bridge card
4. Open-status card
5. Example seams
6. Adversarial checks
7. Authority boundary

## Claim ledger

Create one entry for every claim that materially supports the answer:

```text
claim_id:
statement:
domain:
register:
warrant:
scope_and_conditions:
variables_and_units:
sources:
status_checked_on:
derivation_or_model:
limitations:
falsifier:
authority_effect: NONE
```

Keep the statement atomic enough to falsify. Cite the page or paper that
supports that exact local claim, not a search snippet or a source that merely
uses similar vocabulary. Record no source for a purely authored analogy; mark
it `INTERPRETIVE_BRIDGE` and `MODEL_ASSUMPTION` or
`BESPOKE_FORMULATION_PRIOR_ART_AUDIT_REQUIRED` as appropriate.

## Epistemic axes

### Register

- `MATHEMATICAL_DEFINITION`: introduces formal language but proves no
  existence, uniqueness, physical realization, or empirical fact.
- `MATHEMATICAL_THEOREM`: gives a proof-bounded result for the exact declared
  objects, hypotheses, and quantifiers.
- `EMPIRICAL_OBSERVATION`: reports a source-scoped measurement or historical
  observation.
- `SCIENTIFIC_MODEL`: represents a domain under explicit assumptions and
  measurement rules; it is not itself an observation.
- `INTERPRETIVE_BRIDGE`: transfers a named question or structure without
  transferring mechanism, ontology, parameters, units, or authority.
- `DESIGN_PROPOSAL`: chooses an architecture or next experiment; it is not a
  discovered natural law or an executed action.
- `OPT_IN_PHILOSOPHY`: offers a reflective reading without empirical force.
- `BOUNDARY`: records a non-implication, refusal, or authority limit.

### Warrant

- `SOURCE_BOUND`: supported only within the cited source, population,
  conditions, method, and evidence horizon.
- `MODEL_ASSUMPTION`: declared to make a model well-defined; not derived or
  observed.
- `DERIVED`: follows from declared definitions and assumptions; does not make
  the premises empirical.
- `PROVED`: established by a proof that matches the exact statement.
- `FINITE_EXACT_BASELINE`: obtained by exact finite reasoning or enumeration;
  not an asymptotic or all-instance proof.
- `NUMERICAL_APPROXIMATION`: depends on floating-point arithmetic, fitting,
  simulation, sampling, extrapolation, or numerical tolerance.
- `ESTABLISHED_OPEN_CONJECTURE`: verified as a recognized open mathematical
  statement under the open-status contract below.
- `BESPOKE_FORMULATION_PRIOR_ART_AUDIT_REQUIRED`: newly authored or materially
  modified and not certified as novel or recognized.
- `NOT_ESTABLISHED`: the available evidence does not support the proposition.
- `UNKNOWN_TO_THIS_REVIEW`: the answer has not been established here; this is
  not a claim that the world or literature lacks an answer.

Use `NOT_OBSERVED`, `UNMAPPED`, `CONTESTED`, or `OUTSIDE_SCOPE` to refine an
unknown when the distinction matters. Never turn `NOT_OBSERVED` into absent or
impossible, or `UNKNOWN_TO_THIS_REVIEW` into globally open.

### Cross-domain relation

- `EXACT_FORMAL_EQUIVALENCE_PROVED`: a proved isomorphism or equivalence for
  named mathematical structures. It establishes nothing outside that layer.
- `SAME_FORMAL_STRUCTURE`: both models instantiate a declared structure, but
  their entities, parameters, conditions, and mechanisms remain local.
- `LOSSY_CORRESPONDENCE`: selected relations survive and declared information
  is lost. Use this as the ordinary cross-domain bridge.
- `SHARED_MECHANISM_SOURCE_ESTABLISHED`: direct domain evidence supports the
  same causal mechanism. Similar output or notation is insufficient.
- `NO_TRANSFER`: no responsible mapping is established.

## Bridge card

Return every proposed bridge with this exact field set:

```text
source_domain:
target_domain:
relation:
source_objects:
target_objects:
correspondence:
preserved_structure:
broken_or_lost_structure:
source_variables_and_units:
target_variables_and_units:
assumptions:
ontology_transfer: false
causal_transfer: false
parameter_transfer: false
unit_transfer: false
authority_transfer: false
falsifiers:
```

Require at least one nontrivial preserved structure and one explicit break.
Leave every transfer flag false unless direct evidence establishes that exact
kind of transfer. A valid formal equivalence can coexist with all five flags
being false because the physical, social, and authority layers are different.

Do not infer a shared universality class from a visual resemblance, common
power law, or close fitted slope. Require stable operational definitions,
dimensionless variables, scaling regimes, finite-size analysis, perturbation
response, and uncertainty before proposing that hypothesis.

## Open-status card

Return this exact field set for every statement described as open, unsolved,
conjectural, or novel:

```text
statement:
quantifiers:
domain_and_conventions:
status:
status_checked_on:
original_formulation_or_provenance_sources:
recent_status_sources:
known_results_and_restrictions:
computation_does_not_prove:
nearest_known_problem:
novelty_status:
```

Apply these rules in order:

1. Write the statement before searching so that nearby results cannot silently
   change its quantifiers, symmetry, weights, dimension, or boundary cases.
2. Inspect the original formulation or an authoritative provenance source.
3. Inspect a recent primary or authoritative source that explicitly says the
   exact statement remains open, or use `UNKNOWN_TO_THIS_REVIEW`.
   Record the section, page, theorem discussion, or other exact locator for that
   status statement. A source that only publishes a numerical estimate, omits a
   proof, or treats a neighboring problem does not establish that the declared
   statement is open.
4. Record the calendar date of the status check and the source horizon.
5. List proved subcases, finite checks, conditional results, and neighboring
   conjectures without upgrading them to the full result.
6. Use `ESTABLISHED_OPEN_CONJECTURE` only when the statement and sources match.
7. Use `BESPOKE_FORMULATION_PRIOR_ART_AUDIT_REQUIRED` for a new name, changed
   observable, extra weight, different parameter range, constraint,
   generalization, or cross-domain translation.
8. Treat lack of search results as no evidence of novelty. Never market a
   bespoke statement as famous, established, or open without the audit.
9. Treat inability to solve a problem as `UNRESOLVED_IN_THIS_ATTEMPT`, not as
   a claim about the literature.
10. State that finite enumeration, curve fitting, simulation, and agreement on
    tested cases do not prove a universal or asymptotic statement.

When a theorem, exponent, or rate belongs to an unweighted or source-domain
model, do not carry it to a weighted or target-domain model without a separate
proof. In particular, a status audit for a `q = 1` self-avoiding-walk closing
conjecture does not establish its `q != 1` extension, protein interpretation,
or any catalytic claim.

## Example seams

### Disappearing polymorphs and cultural spread

Preserve a high-level `LOSSY_CORRESPONDENCE` around history-dependent
accessibility: prior states can alter later boundary conditions; finite
capacity can create competition; detection windows can hide possible states;
and returning consequences can amplify, damp, redirect, exhaust, or reopen a
path.

Stop the bridge at the mechanism. Crystal nuclei and surfaces are physical;
memes are interpreted through people and technical systems. Crystal energy has
physical units; cultural relevance does not inherit them. People can
reinterpret, refuse, parody, forget, or leave. Popularity establishes neither
person-to-person virality nor truth, merit, agreement, or consent.

Keep “brainrot” a lexical and cultural label. Define no brainrot score, content
class, diagnosis, prognosis, cognitive state, or person-level inference. A
scientific harm question first needs a population, exposure, comparator,
declared outcome, time window, uncertainty, and appropriate identification
strategy.

Keep universe design and cosmic moral KARMA opt-in and underdetermined. The
equations can invite philosophical questions but cannot select a creator,
purpose, moral law, naturalism, or their negations.

### Folding and catalysis

Keep amino-acid sequence, conformational ensemble, structure or contact
projection, catalytic configuration, chemical transition, kinetic rate,
turnover, phenotype, and clinical decision on separate planes.

A folded or dynamically populated enzyme ensemble can make a catalytic
configuration accessible. That does not make folding itself a catalyst. A
catalyst supplies a lower-barrier kinetic path for the same reaction and, in
an uncoupled closed system, does not change the reaction equilibrium constant.

Use the rapid-exchange ensemble expression only with its timescale assumption:

```text
k_obs = sum_c p(c) k_c
```

Do not substitute overall `kcat` for an elementary-step rate unless the kinetic
model identifies that step as the relevant comparator. Do not infer catalytic
mechanism or rate from contact topology alone.

Treat a relation such as

```text
J = kappa A/Z
```

as an explicit rapid-equilibrium or unit-occupancy toy assumption when those
are the declared premises. It is not a derived physical flux and is not
`kcat` or `kcat/KM`. Preserve all of:

```text
finite counts != asymptotic proof
self-avoiding walk != protein
contact != energy
endpoint closure != protein fold
endpoint gate != active site
occupancy != kinetics
J != kcat
J != kcat/KM
```

## Adversarial checks

Reject or downgrade an answer that does any of the following:

- turns a shared word, diagram, equation, fitted exponent, or metaphor into
  ontological identity or shared cause;
- transfers temperature, energy, rate, entropy, fitness, or critical-exponent
  units without a justified mapping;
- treats a person, culture, community, or interpreted artifact as a particle,
  host, contaminant, parameter, or score;
- turns non-observation into impossibility, popularity into value, prediction
  into causation, or persistence into moral fitness;
- turns an equilibrium landscape into kinetics or a combinatorial contact map
  into a realized protein;
- describes every folding question as one famous “protein folding problem” or
  transfers the complexity of a lattice abstraction to cellular folding;
- upgrades a finite computation, restricted theorem, or source-model
  conjecture into a target-model proof;
- cites a search snippet, stale status claim, or lack of results as proof that
  a problem is open or novel;
- uses feedback as evidence of intention, universe design, or cosmic KARMA; or
- treats a reasoning artifact as permission to execute, publish, deploy, run
  an experiment, or change external state.

## Authority boundary

This contract validates a reasoning shape, not source truth, mathematical
correctness, empirical causation, novelty, safety, identity, consent,
currentness, or authority. An internally consistent bridge can still be false.

The exploration creates no KARMA event or receipt, score, payment, reward,
wallet entry, governance weight, medical or laboratory instruction, code
change, deployment, publication, or external action. Keep rest, refusal,
silence, correction, and departure available without penalty.
