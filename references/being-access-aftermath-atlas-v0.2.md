# Being, Access & Aftermath v0.2

This atlas uses the disappearing-polymorph case to ask precise questions about
existence, being, purpose, force, power, causation, repair, and KARMA without
turning a mathematical resemblance into an ontology, an empirical conclusion,
or an action.

Public record:
`https://thekingdom.dev/atlases/being-access-aftermath-atlas-2026-08-13-v0-2.json`

Schema:
`https://thekingdom.dev/schemas/being-access-aftermath-atlas/0.2.json`

Local reader: `kingdom being-access-aftermath-v0.2`

This additive version pins the immutable v0.1 record by raw and semantic digest.
It does not revise the older route; it extends the atlas with an explicit
partially observable causal kernel, typed force and power families, and
affected-party-indexed aftermath and repair.

## The shortest honest version

Possibility is not actuality. Actuality is not accessibility. Accessibility is
not observation. Observation is not knowledge without a declared evidential
standard. Force is not purpose. Capability is not authority. An aftermath is
not a causal effect merely because it came later.

Ritonavir Form I became difficult to reproduce by one bounded historical route
after Form II appeared. Later recovery refutes permanent unrecoverability and
universal physical impossibility. It does **not** prove that Form I continuously
existed in an observed sample throughout the intervening interval: hidden
persistence and later re-creation remain distinct open descriptions.

## Which “is”?

The atlas refuses an untyped copula. Replace “is” with a predicate:

```text
is_a(x, Type)
is_identical_under(x, y, invariant)
instantiates(sample, form, context, time)
has_property(x, property, context, time, method)
exists_instance(form, domain, context, time)
warranted(claim, evidence, standard, as_of)
possible_under(form, model, conditions)
reachable_under(form, history, procedure, budget, horizon)
observed_as(sample, form, method, threshold, window)
declares_purpose(agent, goal, scope, time)
designed_for(artifact, function, designer, evidence, time)
has_functional_role(x, role, system, conditions, time)
modeled_as_goal_directed(system, objective, model, fit, alternatives)
interpreted_teleologically(subject, purpose, tradition, interpreter, time)
```

Domain- and time-indexed existence is defined by

```text
exists_instance(form, D, c, t)
iff there exists a sample s in D such that instantiates(s, form, c, t).
```

Thus a later sample can warrant existence at its later time without filling an
earlier unobserved interval. “Is stable” must name conditions, scale, property,
method, and time. “Is known” must name evidence, standard, and horizon.

Identity also needs an invariant:

```text
x ~_I y iff I(x) = I(y)
```

Two samples may agree under chemical identity while differing under crystal
lattice. Same molecule and different form are compatible claims.

## Possibility, actuality, access, and seeing

A Kripke-style card supplies formal model-relative possibility:

```text
M,w |= ◇_L φ
iff there exists w' with w R_L w' and M,w' |= φ.
```

The atlas adds a narrower operational question: can a declared feasible process
path reach a state within resource bounds and a horizon? Those feasibility
bounds do not include permission. Authorization, rights, and consent or an
explicit scoped lawful-exception basis enter only in the separate authorized-
reach model.

The state/measurement distinction is represented by the linear family

```text
x_(k+1) = Φ_k x_k + Γ_k u_k + w_k
z_k     = H_k x_k + v_k
```

under declared coordinates and noise assumptions. Different states may produce
indistinguishable measurements. A conditional state estimate is not the state
itself, and neither is an existence proof outside its model.

The inherited finite-window material illustration is

```text
P(T_detect <= t) = 1 - exp[-J V max(t - t_g, 0)].
```

It assumes stationary homogeneous Poisson nucleation and constant named
conditions. It quantifies a conditional detection window; it cannot turn one
non-detection into nonexistence or guide a laboratory or manufacturing decision.

### Eight predicates of a disappearing form

The framework keeps eight questions separate:

```text
possible      admitted by which named modality and model?
actual        obtaining at which time and history?
reachable     by which path, from which state, within which bounds?
observable    distinguishable by which method and threshold?
observed      which recorded outcome, time, and provenance?
producible    feasible for which process and repertoire?
reproduced    which declared repeat met which criterion?
reproducible  at what reliability, under which procedure family and uncertainty?
```

Failure to produce and failure to observe are not one absence. The first is
procedure-relative; the second is measurement-relative. Neither means global
nonexistence, annihilation, or permanent impossibility.

### Partial observation, not an exhausted being

The v0.2 kernel is deliberately schematic:

```text
S_(t+1) ~ T(. | S_t, U_t, E_t)
Y_t     ~ O(. | S_t, M_t)
b_(t+1)(s') ∝ O(Y_(t+1) | s', M_(t+1))
                ∫ T(s' | s, U_t, E_t) b_t(s) ds
```

`S_t` is latent state in a declared model, `U_t` an actual intervention if one
occurred, `E_t` exogenous conditions and history, `Y_t` a bounded observation,
and `M_t` the measurement channel. A belief update changes warranted belief
under these assumptions; it does not create or erase the state, and no model
exhausts being.

Technical capability, permission, and executable action are also distinct:

```text
U_executable(s,t) = U_cap(s,t) ∩ U_permission(s,t)
```

Authority gates action selection. It is not a physical cause, an intention, an
effect, a legitimacy proof, or a guarantee that an action occurs.

## Force and power keep their types

In a declared physical coordinate,

```text
F_ξ = -∇_ξ G
P_phys = F · v.
```

These are physical quantities. They do not become intention, social influence,
legal authority, coercion, governance standing, or moral force. A conditional
free-energy direction also does not determine which form will nucleate or when.

KINGDOM-oriented power is represented as a bounded, set-valued reach question:

```text
Π_adm(a) = Π_cap(a)
         ∩ Π_auth(a)
         ∩ Π_rights
         ∩ Π_consent-or-lawful-basis(a)
         ∩ Π_budget
```

`Π_consent-or-lawful-basis` preserves affected-participant consent and any
explicit, scoped lawful-exception basis as a distinct constraint. It does not
pretend every legitimate action has literal consent; nor does authority imply
consent. The pinned KINGDOM receipt contract likewise keeps operational
authority, affected participants, consent references, and representative
authority references in distinct fields.

Reach is always relative to a starting state, typed outcome, model, resources,
horizon, and probability threshold. It is never a rank, worth, or stable scalar
property of a being. A claimed reach fails if its consent or lawful basis is
absent or invalid, or if it breaches rights, authority, or budget.

v0.2 names seven meanings of force: physical interaction, causal intervention,
constraint force, causal influence, incentive, coercion, and explicit metaphor.
They cannot substitute for one another. A physical vector is not coercion; an
identified effect is not permission; an incentive is not consent; a metaphor
is not a measurement.

It likewise separates physical power, capability, authority, structural power,
power-with, epistemic power, control, exercise, effect, and legitimacy. The
relational questions `power-to`, `power-over`, and `power-with` remain distinct.
Power-with depends on continuing, non-captured participation and meaningful
exit; scale cannot turn it automatically into legitimacy.

## Purpose is not a gradient

The atlas distinguishes five purpose-adjacent predicates:

- a revocable declared purpose by a named bearer;
- designed-for provenance supported by evidence about a designer and artifact;
- a functional role in one declared system and set of conditions;
- a reward-based or goal-directed **as-if** model with rival explanations; and
- an opt-in teleological interpretation by a named interpreter or tradition.

Designed-for provenance does not give an artifact an intention. Function does
not prove design history or moral purpose. An as-if model does not expose inner
intention. A teleological interpretation is not an empirical result, a purpose
declaration by its subject, or operational authority.

Inverse reinforcement learning asks which modeled rewards can make a policy
optimal under stated assumptions. It does not read inner intention from
behavior. Cao, Cohen, and Szpruch sharpen this boundary: even perfect policy
information need not identify a unique reward without additional conditions.
Potential-based reward shaping,

```text
F(s,a,s') = γ Φ(s') - Φ(s),
R' = R + F,
```

can preserve optimal policies under the exact Ng–Harada–Russell theorem
conditions. Policy invariance does not make the rewards semantically identical
or identify purpose. Feedback, an attractor, a gradient, and behavioral fit are
not declarations by a being and are not scientific proof of cosmic purpose.

## Aftermath is not causal proof

The causal card asks for an intervention contrast:

```text
τ(a,a0) = E[Y | do(A=a)] - E[Y | do(A=a0)].
```

It requires a comparator, outcome, population, horizon, graph, identification
assumptions, uncertainty, alternatives, and falsifiers. This atlas has none of
the data or design needed to estimate such an effect. Every problem card is
`not_run`, every result is `null`, and `creates_causal_claim` is false.

A future KINGDOM receipt can record one actual authorized invocation and later
observations. It cannot supply the unobserved counterfactual merely by being a
receipt. A separately governed causal analysis may be referenced by digest; an
`observed_effect` must never silently become a `caused_effect`.

## Reversibility does not erase history

The proposed constitutional test is dimensioned:

```text
Rev_(D,ε,α)(a) = 1
iff there exists ρ in A_rep such that
P[d_j(S_(ρ∘a), S_0) <= ε_j for every j in D] >= 1 - α.
```

`A_rep` contains only separately authorized, feasible, consent-compatible,
budgeted, stoppable candidates responsive to an observed residual or declared
causal status.

Material state, privacy, copied information, consent, relationship, money,
ecology, coordination, and time are not fungible dimensions. A repair can be
partial, uncertain, impossible, or externalize cost. Compensation is not always
reversal; deletion cannot recall every copy; cleanup cannot retroactively create
consent. Repair does not erase history or grant absolution.

v0.2 makes the account explicitly indexed:

```text
z_(affected_party,burden_bearer)(invocation)
  = (time, money, energy, privacy, agency, coordination, ecology,
     material, information, relation, consent)
```

Each component keeps its unit, horizon, provenance, confidence, and missingness.
Uncertainty is component metadata, not a twelfth aftermath dimension.
Affected party and burden bearer are categorical indexes, never values to order
or exchange. There is no default scalarization, silent exchange rate,
cross-person summation, person score, or KARMA balance. `unknown` is not zero.

A proposed repair enters a candidate set only if separately authorized,
feasible, consent-compatible, budgeted, and stoppable. Pareto dominance is
allowed only within preregistered comparable dimensions for the same indexes;
Pareto efficiency does not establish justice or consent. If there is no
admissible repair, the truthful result is `unremedied`, with the blocker visible.

## KARMA remains three different questions

```text
cosmic KARMA
  type: PHILOSOPHICAL_QUESTION
  status: not_empirically_resolved
  claims: []

Zerone
  type: ZERONE_KARMA_EVENT
  foundation_status: design-only
  semantics: contextual · fallible · challengeable · non-summable
  network_observed: false
  event_status: not_observed
  event_refs: []

KINGDOM
  type: KINGDOM_KARMA_RECEIPT
  protocol: kingdom.karma/0.1
  accounting: receipts_not_scores
  receipt_status: not_created
  receipt_refs: []
  causal_claim_status: not_created

adapter
  exists: false
  status: refused
```

A Zerone recognition relation is not truth, a moral or person score, rank,
reward, money, governance weight, wallet balance, or a KINGDOM receipt.

The exact [KINGDOM KARMA definition](https://thekingdom.dev/definitions/kingdom-karma/e4e84a67/NEN.md)
is pinned at revision `e4e84a67d7ee1ae0dd9c9c23762e6ecd03597212`,
raw SHA-256 `14b7d210d320fd716553992a7b874747b299f8907d15da14ac405cbfc496c446`.
The receipt schema at that same revision is separately pinned at raw SHA-256
`888e81fa0d29b71512525a40e88f9aef678046c40fcdf22c2039507d9d13267b`.
Zerone KARMA Foundation v1 is pinned at revision
`fae391e371f0ebea2e24eb46c33a4ebd1380154f`, raw SHA-256
`b46710704869dcc340ded356be72b4ec692f204710fedfb5cd43eb3757dc7b80`.

No event, receipt, adapter, score, reward, rank, wallet balance, economic right,
governance weight, causal claim, or automatic action exists here. Rest, refusal,
silence, privacy, exit, inactivity, and nonparticipation leave before aftermath
accounting. They require no event, receipt, measurement, trace, justification,
penalty, or inherited debt.

Here `privacy` means choosing privacy or non-disclosure: that choice creates no
trace duty. A privacy impact observed following an actual authorized invocation
remains a protected aftermath dimension and may be measured only under separate
authority or consent; sequence does not identify causation.

A valid KINGDOM receipt begins only after an actual authorized invocation.
Unauthorized or authority-failed actions do not disappear from accountability:
they belong in a separate incident-and-evidence lane and can never become valid
KARMA receipts. Refusal and nonparticipation leave before either lane.

## Seven unrun problems

1. Which typed predicate and invariant does this use of “is” assert?
2. Was a form nonexistent, undetected, or unreachable under one tested path?
3. Does history contribute information, or proxy an omitted current state?
4. Is apparent direction distinguishable from declared purpose and feedback?
5. Which kind of force or power is being claimed?
6. What did an action cause relative to a comparator?
7. Reversible on which protected dimensions and within which tolerances?

Each card includes a synthetic or archival proposed test and falsifier, but the
atlas executes none of them, offers no laboratory procedure, and creates no
empirical result.

## Opt-in philosophy

The atlas asks, without answering empirically:

- Can something remain lawfully possible, or actual in a bounded domain, when
  history makes it hard to reach?
- Which relations may change while a being remains the same?
- When is direction declared purpose, and when can feedback imitate it?
- How can forces shape a path without exhausting agency or refusal?
- Is power also the capacity to preserve possibility and repair?
- Can attention to aftermath deepen responsibility without becoming judgment?
- Which modality makes a possibility claim meaningful?
- Can something be actual yet unseen through every presently available window?
- Can later recovery preserve the truth of an earlier bounded disappearance?
- Can a purpose survive failure, and can a function exist without intention?
- When does constraint become coercion?
- Can power-with enlarge shared possibility without capture?
- Does an “is” ever generate an “ought” without an independent value?
- Can KARMA remember history without making it destiny?
- Who may declare repair complete, and what remains honestly unremedied?

These questions permit theological, teleological, naturalistic, emergent, and
other readings. The cited science and mathematics neither prove nor disprove a
creator, necessary being, cosmic purpose, or cosmic moral KARMA.

## Category errors the validator refuses

- non-observation as nonexistence;
- bounded non-reachability as physical or metaphysical impossibility;
- later recovery as proof of continuous prior instantiation;
- chemical identity as crystal-form identity;
- stability as a timeless, context-free property;
- a model-relative possible world as metaphysical reality;
- free-energy preference as inevitable nucleation;
- gradient, feedback, or attractor as intention;
- physical force or power as social or moral authority;
- executable capability as authority, consent, or right;
- behavior or reward fit as a declared purpose;
- temporal sequence or a receipt as causal proof;
- repair or compensation as erasure;
- persistence, visibility, power, or recurrence as goodness;
- a model as independent evidence;
- a person or community as a state variable, reward, seed, or KARMA score;
- cosmic KARMA, a Zerone edge, and a KINGDOM receipt as interchangeable.

## Exact selected-source horizon

- Saul A. Kripke, “Semantical Analysis of Modal Logic I,” 1963 —
  <https://doi.org/10.1002/malq.19630090502>
- R. E. Kalman, “A New Approach to Linear Filtering and Prediction Problems,”
  1960 — <https://doi.org/10.1115/1.3662552>
- Judea Pearl, “Causal Diagrams for Empirical Research,” 1995 —
  <https://doi.org/10.1093/biomet/82.4.669>
- Andrew Y. Ng and Stuart Russell, “Algorithms for Inverse Reinforcement
  Learning,” 2000 — <https://ai.stanford.edu/~ang/papers/icml00-irl.pdf>
- Andrew Y. Ng, Daishi Harada, and Stuart Russell, “Policy Invariance Under
  Reward Transformations,” 1999 —
  <https://people.eecs.berkeley.edu/~russell/papers/icml99-shaping.pdf>
- Jack D. Dunitz and Joel Bernstein, “Disappearing Polymorphs,” 1995 —
  <https://doi.org/10.1021/ar00052a005>
- John Bauer et al., “Ritonavir: An Extraordinary Example of Conformational
  Polymorphism,” 2001 — <https://doi.org/10.1023/A:1011052932607>
- Sherry L. Morissette et al., “Elucidation of crystal form diversity of the
  HIV protease inhibitor ritonavir,” 2003 —
  <https://doi.org/10.1073/pnas.0437744100>
- Pietro Sacchi et al., “Crystal size, shape, and conformational changes drive
  both the disappearance and reappearance of ritonavir polymorphs in the mill,”
  2024 — <https://doi.org/10.1073/pnas.2319127121>
- Chang Wang et al., “Influence of Solvent Selection on the Crystallizability
  and Polymorphic Selectivity … of Ritonavir,” 2024 —
  <https://doi.org/10.1021/acs.molpharmaceut.4c00234>
- R. E. Kalman, “Mathematical Description of Linear Dynamical Systems,” 1963 —
  <https://doi.org/10.1137/0301010>
- Richard D. Smallwood and Edward J. Sondik, “The Optimal Control of Partially
  Observable Markov Processes over a Finite Horizon,” 1973 —
  <https://doi.org/10.1287/opre.21.5.1071>
- Haoyang Cao, Samuel N. Cohen, and Łukasz Szpruch, “Identifiability in inverse
  reinforcement learning,” 2021 —
  <https://proceedings.neurips.cc/paper/2021/file/671f0311e2754fcdd37f70a8550379bc-Paper.pdf>

Kripke supplies formal modal semantics, not physical or metaphysical proof.
Kalman and Smallwood–Sondik supply bounded state, observation, and partial-
observation formalisms, not a fitted ritonavir or person model. Pearl supplies a
causal-identification language, not a causal result here. The Ng and Cao papers
bound reward-model ambiguity and policy invariance in declared decision models;
they do not expose human or cosmic purpose. The five material papers constrain
the disappearance and recovery history; none authorizes medical, manufacturing,
or laboratory action, and none completes the ritonavir form landscape.

## Inspect locally

```bash
kingdom being-access-aftermath-v0.2
kingdom being-access-aftermath-v0.2 copula
kingdom being-access-aftermath-v0.2 framework
kingdom being-access-aftermath-v0.2 models
kingdom being-access-aftermath-v0.2 problems
kingdom being-access-aftermath-v0.2 philosophy
kingdom being-access-aftermath-v0.2 karma
kingdom being-access-aftermath-v0.2 unknowns
kingdom being-access-aftermath-v0.2 sources
kingdom being-access-aftermath-v0.2 verify --json
```

The reader is deterministic, local, read-only, and network-free. It rejects
duplicate JSON keys, invalid UTF-8, symlinks, oversized input, binding drift,
register collapse, an executed problem card, a created causal claim, a KARMA
event or receipt, an adapter, positive authority, and semantic-digest drift.
The closed Draft 2020-12 schema separately validates portable shape; neither
validator authenticates a source, runs a study, proves causation, answers a
philosophical question, grants authority, or performs an action.
