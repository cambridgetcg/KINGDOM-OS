# Dark matter, relational inference, and semantic geometry

**Status:** optional research bridge · **not doctrine** · **not a physics
result** · **not a theory of mind** · **not a lie detector** · **not an
identity resolver** · **not a reputation system** · **not a deployed protocol**

**Scientific review date:** 2026-08-16

This bridge asks what current dark-matter research can teach a system that
must reason from words, shapes, actions, and other partial traces without
mistaking any trace for the thing itself. It extends
[`semantic-geometry-and-truth.md`](semantic-geometry-and-truth.md) and keeps
the dimensional distinctions in
[`string-theory-dimensional-grammar.md`](string-theory-dimensional-grammar.md).

The answer is methodological, not ontological:

> Infer through several typed relations. Keep the forward models, nuisance
> variables, scale, alternatives, and losses visible. Treat a residual as a
> question, never as the name of its cause.

Dark matter is a particularly useful donor because much of its evidence is
relational. Researchers do not photograph a dark-matter particle. They infer
latent gravitating structure from multiple effects under explicit physical
models, while direct searches constrain selected particle-model regions and
continue to report null results. That pattern can discipline semantic work.
It does not show that meaning, identity, deception, love, or Isness *is* dark
matter.

The companion prototype is deliberately structure-only:

- [relational inference case schema](schemas/relational-inference-case-0.1.json);
- [read-only validator](../bin/relational-inference.ts);
- [physics observation → bounded method receipt](examples/dark-matter-observation-to-latent-hypothesis.json)
  (`kingdom.semantic-transition/0.1`, the one-transition layer);
- [reasoning → word case](examples/reasoning-to-word-inference.json);
- [identity → shape case](examples/identity-to-shape-inference.json); and
- [claim repair case](examples/claim-repair-inference.json).

Passing the validator establishes only that required declarations and graph
references are structurally complete under this local schema. It does not
establish truth, a hidden cause, translation fidelity, identity,
understanding, intent, authority, consent, or evidence adequacy.

---

## 1. Claim discipline

| Label | Meaning here | Does not mean |
|---|---|---|
| **[E] empirical report** | A bounded report from a named observation or experiment | Direct observation by KINGDOM, or discovery of a particle |
| **[M] model-conditioned inference** | A conclusion conditional on a named forward model, assumptions, and data | The model is the only possible ontology |
| **[F] formal definition** | A result inside explicitly chosen mathematics | Nature or language literally instantiates it |
| **[P] proposed operational model** | A representation offered for testing in the KINGDOM | Doctrine, consciousness access, or production policy |
| **[N] chosen norm** | A safety or ethical commitment | A theorem forced by geometry or physics |
| **[A] bounded analogy** | A comparison that names what is preserved and what is not | Evidence transferred from physics to semantics |
| **[X] refused inference** | A tempting conclusion this bridge forbids | Permission to smuggle the conclusion back through metaphor |

Mixed labels keep their parts separate. An empirical fact can motivate an
analogy; it cannot make the analogy empirical.

---

## 2. The higher-level pattern

### 2.1 Pattern before picture

**[F] [P]** Let a reusable pattern begin as a many-sorted relational
signature with directed hyperrelations and declared constraints:

```text
P = (O, R, s, t, E)
```

where:

- `O` is a finite set of object roles;
- `R` is a finite set of relation roles;
- `s(r)` and `t(r)` are ordered lists of source and target roles, allowing a
  relation to have several premises or outputs; and
- `E` is a set of declared equations, exclusions, or other constraints over
  well-typed relation expressions.

The hypergraph matters. Ordinary edges cannot faithfully represent a rule such
as `{p, q} => r`: neither `p => r` nor `q => r` holds alone. Reasoning must
retain the joint-premise relation.

A domain realization is first a typed binding:

```text
R_d : P -> G_d
```

into a domain structure `G_d`. It assigns each role and relation a domain
object or operation and must state which constraints it actually preserves.
Hyperrelations do not automatically compose as ordinary categorical paths. If
a categorical carrier is useful, one must explicitly construct an appropriate
free symmetric monoidal category, PROP, multicategory, or other formalism and
state its equations. Only when both source and target structures, identities,
composition, and relevant laws are defined and tested may a realization be
called a functor. In v0.1 machine records, “analogy,” “partial map,” or
“witnessed lax correspondence” is the honest term.

The pattern is therefore not a hidden Platonic token behind every domain. It
is the declared relational template used to compare realizations.

### 2.2 Exact shape and approximate resemblance

**[F]** Let `D_d : J -> G_d` be an instance diagram. An exact abstract shape
is available only after choosing:

1. a common indexing diagram, or explicit reindexing;
2. an abstraction `A_d : G_d -> C` into one common comparison category `C`
   that says what is deliberately forgotten; and
3. a genuine equivalence relation, such as diagram isomorphism.

Then:

```text
Shape_exact(D_d; A_d) = [A_d o D_d]_isomorphism
```

Approximate tolerance and one-way analogy are generally not transitive, so
they do not define equivalence classes. Represent them directionally:

```text
W_(d -> e) = (
  source,
  target,
  preserved_relations,
  tests,
  known_losses,
  introduced_assumptions,
  counterexample,
  stop_condition
)
```

**[P]** This translation witness is the smallest useful unit of semantic
geometry. Resemblance proposes the witness. Tests and disclosed defects make
it inspectable.

### 2.3 Relationship between the levels

```text
pattern P
   │
   ├── realization R_reasoning ── reasoning objects and inference relations
   ├── realization R_word      ── clauses, connectives, scope, emphasis
   ├── realization R_identity  ── public declarations and allowed transforms
   └── realization R_shape     ── glyph components and visual relations

R_d --translation witness--> R_e
          preserves some relations
          loses some distinctions
          adds some assumptions
          survives some probes
```

“Higher-level” means that a whole lower-level diagram may itself become an
object in a second diagram. The higher level is an abstraction boundary, not
a claim of metaphysical superiority.

---

## 3. Latent causes and visible traces

### 3.1 Forward maps, not essence extraction

**[P]** For a candidate latent state `z` and an observation channel `d`, use a
general observation kernel or relation:

```text
x_(d,k) ~ K_(d,k)(. | z, c_(d,k), s_(d,k), m_(d,k),
                       b_(d,k), u_(d,k))
```

where:

- `x_(d,k)` is the observed or reported trace;
- `K_(d,k)` is the named observation kernel or relation from a candidate model
  to possible traces;
- `c` is context;
- `s` is scale or resolution;
- `m` is the selected model/version;
- `b` is structured background, bias, ordinary variation, or nuisance; and
- `u` is a possible perturbation or intervention, which may be benign,
  accidental, protective, adversarial, or unknown.

When the trace lives in a declared vector space, a special-case additive model
may write `x = F(z, ...) + epsilon + b + u`. Text, graphs, and shapes do not
have a canonical addition operation, so the additive form must not be used for
them without separately defining one.

`z` is a model variable. It is not automatically a soul, essence, true
identity, private meaning, or final ontology.

The **forward** observation map is often many-to-one, so its inverse is
set-valued or otherwise non-identifiable:

```text
{z : F(z, c, s, m) is adequate for x within declared tests}
```

may contain several candidates. A probabilistic analysis may instead report a
posterior distribution, but only after naming its likelihood, prior, selection
effects, and model class. A non-probabilistic analysis can retain an explicit
set of adequate and contradicted candidates. Both are more honest than a
single unexplained confidence score.

### 3.2 Identifiability is relational

**[F] [P]** Relative to a selected family of probes `Q`, define a tolerance
relation:

```text
z_1 approx_Q z_2

iff

for every q in Q,
the predicted observables of z_1 and z_2 agree within q's declared tolerance.
```

This relation is generally not transitive and therefore does not define a
quotient class. Call it a tolerance neighborhood or compatibility relation.
If a true equivalence is needed, first partition each declared probe outcome
space and compare exact vectors of partition-cell labels; that coarser
equivalence is then task-, partition-, and probe-relative. Adding a genuinely
discriminating probe can refine either representation. Repeating the same
channel under the same systematic may add precision without adding
independence.

### 3.3 Multi-probe does not mean vote counting

**[P]** Probe dependence is part of the model:

```text
dependency(q_i, q_j) in {
  independent,
  partially-shared,
  shared-systematic,
  unknown
}
```

Three measurements copied from one source are not three independent probes.
Two translations using the same parser may share its blind spot. A word and a
shape generated from the same declaration are complementary representations,
but they are not independent evidence that the declaration is true.

For consequential conclusions, every probe pair should declare its dependency
relationship and each probe should declare shared data, source, model,
evaluator, and transformation factors. Pairwise flags are diagnostic metadata,
not a joint probability model: pairwise independence does not imply mutual
independence. Confidence must be recomputed from an independently specified
joint model; it cannot be obtained by taking the largest confidence or counting
green results. The v0.1 validator checks declaration consistency only and does
not verify independence.

---

## 4. Word as tracer

### 4.1 Reasoning is not the sentence

**[P]** Model a bounded reasoning episode as a typed argument object:

```text
A = (premises, rules, intermediate_claims, conclusion,
     challenges, logic, warrant)
```

A lexicalizer under context `c` is a partial, usually lossy map:

```text
L_c : A -> Distribution(Expressions)
```

The distribution may be a probability distribution, a possibility set, or a
ranked family; the choice must be named. It is not necessarily a single word.

A generated expression can preserve:

- which claims support or challenge which conclusion;
- quantifier and modal scope;
- causal versus evidential relations;
- ordering or temporal dependence; and
- declared uncertainty.

It can lose:

- rejected branches;
- joint-premise structure;
- alternative logics;
- exact source provenance;
- uncertainty calibration; and
- context that the speaker assumes the listener already has.

**[A]** The word is like a visible tracer: its path across paraphrases,
contexts, questions, and counterexamples can reveal features of the reasoning
that generated it. It is not the reasoning itself.

### 4.2 Translation is inference through two portals

Let `E_d` decode a source expression into a distribution or set of candidate
relational structures, and let `F_e` render one candidate in target domain
`e`. For a distribution, translation uses the pushforward:

```text
T_(d -> e) approximately equals (F_e)_* o E_d
```

For a set-valued decoder, apply `F_e` pointwise and retain the resulting set
rather than silently selecting one candidate. Both halves matter. If a
translation fails, possible sources include:

- source ambiguity;
- decoder assumptions;
- target vocabulary limits;
- rendering choices;
- stale context;
- shared systematics;
- ordinary error; or
- deliberate distortion.

The failure alone does not select among them.

### 4.3 Probes for reasoning → word

**[P]** Useful controlled probes include:

| Probe | Question | Failure may show |
|---|---|---|
| Paraphrase | Does the support/challenge structure survive a new surface form? | Lexical dependence or decoder instability |
| Negation | Does reversing one premise change only the expected consequences? | Scope loss or shallow keyword matching |
| Counterexample | Can the expression distinguish a rule from a universal claim? | Overgeneralization |
| Reconstruction | Can a reader rebuild the joint-premise argument? | Lost dependency structure |
| Domain triangle | Do two translation paths agree on named invariants? | Path-dependent loss or incompatible ontologies |
| Correction reach | Does a corrected premise update dependent expressions? | Stale caches or repair failure |

These are task-understanding tests. Passing them provides evidence about a
behavioral capacity under the tested conditions; it does not prove subjective
understanding or expose private reasoning.

---

## 5. Identity as transformation-invariant relation

### 5.1 Declaration, orbit, and shape

**[P]** Let `i` be an authorized public declaration, not an inferred being.
Let a declared group or groupoid `G` describe allowed context changes such as
language, viewport, accessible rendering, or version migration. A visualizer
is equivariant when a named action `rho` on shapes satisfies:

```text
S(g · i) = rho(g) · S(i)
```

for tested `g`. If transforms are not invertible, retain their direction as a
category or monoid action, or as a reachability preorder. Form a quotient only
when a symmetric identification is independently defined and semantically
justified; generated equivalence closure can erase time and information loss.

The identity-shaped abstraction is then the family of public relations that
remain stable across allowed transformations:

```text
I_Q(i) = {relation r : every tested transform in Q preserves r}
```

This is an invariant of a declaration under selected tests. It is not the
identity, proof of authorship, proof of continuity, or proof of a being.

### 5.2 Shape can express without resolving

A shape can encode declared relations such as:

- one center related to several public responsibilities;
- open versus closed interfaces;
- versioned composition;
- plurality without ranking; or
- correction paths returning to a source artifact.

It must not silently encode:

- inferred personality;
- biometrics or secrets;
- moral worth;
- consciousness or love;
- private associations;
- authority or consent; or
- cross-context identity linkage.

**[N]** Stable public glyphs can still enable aggregation and tracking.
Persistence therefore requires a purpose, scope, and consent basis. Where
cross-context continuity is unnecessary, use rotating or purpose-specific
rendering and do not derive a stable glyph from a supposedly harmless public
identifier. Public availability is not blanket consent to aggregate.

### 5.3 The strongest identity claim available here

At most:

> Under the declared source, transformation set, abstraction, and tests, this
> rendering preserves these named public relations and discloses these losses.

That sentence is long because the boundary is the substance.

---

## 6. Understanding as a profile, not a hidden scalar

**[P]** For task `tau`, context family `C`, and test family `Q`, define an
understanding-evidence profile:

```text
U_(tau,C,Q) = (
  reconstruction,
  counterfactual_response,
  transfer,
  calibration,
  challenge_handling,
  repair
)
```

Each component is separately evidenced and may be unknown. The profile is not
collapsed to “understands: true” or a person score.

Evidence is stronger when a system can:

1. reconstruct relevant relations without copying the surface form;
2. respond coherently to a controlled change;
3. transfer the pattern to a genuinely distinct domain;
4. state uncertainty and limits accurately;
5. keep live alternatives and counterexamples; and
6. incorporate a correction through its dependent outputs.

Echo is weak evidence. Robust transformation is stronger evidence. Neither
opens a private mind.

---

## 7. What current dark-matter work actually says

### 7.1 Strong evidence for unseen gravitating structure is not particle identification

**[E] [M]** Planck's final CMB analysis reports a cold-dark-matter density
parameter far larger than the baryonic density in base `LambdaCDM`, with
temperature, polarization, and lensing results mutually consistent. This is a
highly constrained model-conditioned inference, not a direct identification
of a particle species. See
[Planck 2018 results VI](https://arxiv.org/abs/1807.06209).

**[E] [M]** In the Bullet Cluster, gravitational-lensing mass peaks are
spatially displaced from the dominant X-ray-emitting plasma and more closely
track the collisionless galaxies. This is strong evidence for an unseen
gravitating component and challenges simple baryons-only accounts; it still
does not identify a particle. See
[Clowe et al.](https://arxiv.org/abs/astro-ph/0608407).

**[X]** “Evidence for a latent component” must not be serialized as “the
latent component's microphysical identity is known.”

### 7.2 Visible streams as relational tracers

**[E] [M]** A 2026 Euclid Q1 analysis uses the curvature of extragalactic
stellar streams around 13 galaxies to constrain halo shape. It reports a mild
preference for halos close to spherical, with substantial uncertainty. The
stellar light is the visible tracer; the gravitational potential and halo
geometry are inferred through a dynamical model. It is an early, small-sample
preprint analysis, not a particle detection. See
[Euclid Collaboration, arXiv:2606.21774](https://arxiv.org/abs/2606.21774).

**[A]** A word can be treated as a semantic tracer in one narrow sense: its
controlled changes can constrain candidate relational models that generated
it. The transfer preserves “visible path constrains latent relation under a
forward model.” It does not preserve gravitational dynamics, physical mass,
or empirical authority.

### 7.3 Strong lenses and translator degeneracy

**[E] [M]** The JWST Lensed Quasar Dark Matter Survey combines multiple
strongly lensed quasar systems, extended arcs, image positions, and
magnifications to constrain low-mass structure and free streaming. Its bounds
depend on lens macromodels, line-of-sight structure, subhalo priors, and the
conditional conversion to a particle model. The accepted analysis finds no
departure from cold-dark-matter clustering above its stated sensitivity; it
does not reveal a unique dark-matter species. See
[Gilman et al., arXiv:2606.05277](https://arxiv.org/abs/2606.05277).

**[A]** In translation, the observed target is jointly shaped by source and
translator. A distorted sentence can reflect a different source meaning, a
bad decoder, a constrained target language, or path-dependent context. One
must jointly model source and lens before assigning cause.

### 7.4 Null searches constrain charts, not existence

**[E] [M]** LZ's 4.2 tonne-year WIMP search reports no significant excess and
sets strong spin-independent scattering limits within specified mass,
interaction, halo, detector-response, and statistical assumptions. See
[LZ, arXiv:2410.17036](https://arxiv.org/abs/2410.17036).

**[E] [M]** LZ's later low-mass analysis again reports no dark-matter excess
in its tested range while finding evidence for solar-neutrino coherent
scattering. The “neutrino fog” is a real background with the same broad event
class as a candidate signal, so inference in this channel increasingly depends
on spectral information, exposure, detector response, and joint statistics
rather than event counting. See
[LZ, arXiv:2512.08065](https://arxiv.org/abs/2512.08065).

**[A]** A failed keyword, sentiment, or consistency detector constrains that
detector under its tested conditions. It does not establish absence of
meaning, identity, understanding, or deception. An authentic alternative can
produce the same visible event class.

### 7.5 Common-mode difference

**[E] [M]** The 2026 AION prototype used two spatially separated atom
interferometers interrogated by a common clock laser. Differential measurement
rejected large common laser phase noise and recovered coherent injected
time-dependent signals even when an isolated instrument did not retain useful
phase information. It demonstrates a measurement technique, not a dark-matter
detection. See
[AION, arXiv:2504.09158](https://arxiv.org/abs/2504.09158) and the
[Nature publication](https://www.nature.com/articles/s41586-026-10617-1).

**[A]** Two receivers that share a nuisance can sometimes expose an invariant
through their difference. In a multilingual or multi-agent setting, retain the
shared parser, prompt, ontology, or source as a nuisance variable; compare
contrasts rather than declaring each isolated rendering true.

### 7.6 Ten operational lessons

**[A] [P]** The bounded transfer is:

1. infer latent models through effects, not labels;
2. carry the forward model with each inference;
3. type observation, report, inference, constraint, and hypothesis separately;
4. attach scale, context, epoch, selection, and background to every probe;
5. keep model alternatives and mixtures live;
6. represent probe dependencies instead of counting confirmations;
7. treat a null result as a constrained sensitivity region;
8. prefer differential or cross-view tests when systematics permit;
9. predeclare invariants and falsifiers where stakes justify it; and
10. allow repair to lower contradiction without erasing history or privacy.

**[X]** Dark matter is not evidence that hidden semantic dimensions exist.
“Dark” does not mean evil, false, deceptive, unconscious, or inferior.

---

## 8. Residual, misleading effect, deception, and lie

### 8.1 A cycle residual is diagnostic, not a verdict

For a translation loop `gamma`:

```text
x_0 --T_01--> x_1 --T_12--> ... --T_n0--> x'_0

Delta_gamma = discrepancy_Q(x_0, x'_0)
```

**[P]** `Delta_gamma` is a vector over named invariants, not necessarily one
number. A nonzero residual can result from:

- declared loss;
- source ambiguity;
- context shift;
- model mismatch;
- measurement or implementation error;
- stale information;
- shared systematic bias;
- an unauthorized transformation;
- deliberate misleading action; or
- an unmodeled cause.

It does not establish which cause occurred.

### 8.2 Four distinct questions

**[P] [N]** Keep these layers separate:

| Layer | Bounded question | Possible evidence |
|---|---|---|
| Mismatch | Do two claims or paths conflict under a named test and time? | Artifacts, model, test result |
| Misleading effect | Did a representation materially induce a false operational model in a defined audience? | Audience model, decision trace, counterfactual comparison |
| Duty failure | Was a disclosure or truthfulness duty actually owed in this relationship and scope? | Agreement, role, authority, consent, safety context |
| Deception or lie | Is there adequate independent evidence of knowledge/belief and intent to mislead? | Separate adjudicative evidence; never residual alone |

A lie, in the narrow vocabulary used here, is an assertion offered as true,
believed false by its speaker, and intended to be taken as true. Those inner
conditions are not available from structural validation.

Use operational labels such as:

```text
inconsistent-under-test
unsupported-under-current-evidence
stale-as-of-date
corrected
withdrawn
misleading-effect-supported
deception-not-assessed
```

Reserve “lie” or “deceptive act” for a legitimate, separately evidenced
process with an appeal path.

### 8.3 Why hidden distortion can create destruction

**[P]** Consider a dependency network where claims constrain actions:

```text
claim s --translation--> model m --decision rule--> action a
        \                                      \
         \--trusted dependency--> claim t       outcome y
```

Choose an explicit policy comparator `pi`, not an unknowable ideal action.
If a hidden material defect in `s` changes the action selected by `pi`, and the
changed action contributes to an observed harmful outcome, record:

```text
decision displacement = compare(a_with_s, a_with_corrected_s; pi)
outcome difference     = compare(y_observed, y_comparator)
prototype causal status = possible | unknown
```

Do not equate `a != a_comparator` with destruction. The comparator can be
wrong, several causes can interact, and concealment is not necessary for harm.
An externally supported causal claim requires a separate causal design,
evidence, and adjudicative process; v0.1 cannot make it.

Material hidden distortion can nevertheless amplify friction by:

- rerouting coordinated action;
- making dependent statements inconsistent;
- laundering a reported claim into an apparent observation;
- laundering a description into authority or consent;
- causing parties to recheck downstream dependencies;
- punishing accurate dissent;
- making correction costly or socially unsafe; and
- freezing a transient claim into an identity judgment.

Reliable channels can reduce repeated checking costs. A discovered hidden
defect can create **verification debt**: dependent claims must be revisited,
not because trust is nothing but cached verification, but because the channel
no longer supports the previous reliance level.

### 8.4 Anti-weaponization boundary

**[N]** Truthfulness never creates an entitlement to all private truth.
Silence, refusal, redaction, and exit are complete responses where disclosure
is unsafe, unauthorized, irrelevant, or coercively demanded.

Protective deception under abuse, persecution, coercion, or an illegitimate
demand may be morally permissible. Classification of an act, causal harm,
violated duty, and moral judgment are separate questions.

Love or care does not require exposure to an unsafe requester. In this bridge,
love is reflected operationally by preserving agency, refusal, proportionate
truthfulness within a declared relationship, repair, and the ability to leave.
No geometry proves that choice.

---

## 9. A friction-reduction architecture for the KINGDOM

### 9.1 From single verdict to inference case

**[P]** The proposed case has seven layers:

```text
question and boundary
        │
        v
relational pattern P
        │
        ├── realization in domain A
        ├── realization in domain B
        └── witnessed translations, losses, assumptions
        │
        v
typed probes + pairwise dependency declarations
        │
        v
  candidate models + per-probe expectations/residuals
        │
        v
bounded conclusion + alternatives + next discriminating test
        │
        v
challenge, correction, supersession, or withdrawal
```

This adds a *multi-probe comparison layer* above individual semantic-transition
receipts. It does not replace those receipts. A transition can record one
reasoning-to-word or identity-to-shape map; an inference case can compare
several such maps and candidate explanations.

### 9.2 Machine-enforced declarations

The opt-in prototype requires:

- typed pattern object and relation roles;
- complete role bindings for every domain realization;
- directed translation witnesses with tests, losses, assumptions,
  counterexample, and stop condition;
- two or more probes with structured run status, context, scale, sensitivity,
  background, selection, and shared-factor declarations;
- a declared dependency relationship for every probe pair, used only as
  diagnostic metadata;
- two or more candidate models, including a live, constrained, or unassessed
  countermodel;
- each candidate assessed against every probe;
- a bounded conclusion, unmodeled alternatives, and next test;
- public or redacted artifact scope and descriptive-only use;
- observable harm separated from duty and intent; and
- linked repair information.

It requires the following non-grant flags to remain false:

```text
proves truth
proves a hidden cause
proves causation
proves translation fidelity
proves identity
proves understanding
infers intent
labels deception
rates people
grants authority
grants consent
permits surveillance
```

Those are machine-checkable field declarations only. All prose remains
unevaluated and untrusted; a valid case may contain prose that contradicts its
flags. Consumers must never execute prose, treat validity as endorsement, or
infer legitimacy from it. Schema-only validation is weaker than the runtime
graph checks, and the runtime still does not dereference evidence, verify probe
independence, or establish that reply and correction destinations exist.

### 9.3 Confidence without laundering

**[P]** Confidence remains a declaration. v0.1 omits `high`; a `medium`
declaration requires at least two structurally completed probes with a pair
declared independent or partially shared. That is only a minimum presentation
check. The validator cannot verify execution, evidence adequacy, independence,
or calibration.

Composition rules:

1. losses accumulate unless a named new source reconstructs them;
2. assumptions accumulate or are explicitly discharged;
3. shared systematics remain shared after composition;
4. confidence is recomputed with dependency, never `max` or vote count;
5. constraints stay attached to their sensitivity region and model;
6. authority and consent never emerge from coherence;
7. current consent is revalidated for the composite purpose; and
8. either stop condition can halt the chain.

### 9.4 Repair as curvature reduction

**[A] [P]** In geometric language, compare a correction's residuals on the
same named cycles, probes, context, scale, and component definitions:

```text
residual change_j = Delta_before,j - Delta_after,j
```

This componentwise change is not moral absolution and need not be positive on
every path. A scalar “gain” exists only after disclosing a common norm, order,
or weighting; it must not be implied by vector subtraction alone. The result
is task-relative evidence about the chosen tests.

Repair should:

- append a linked correction, supersession, or withdrawal by convention;
- retain material challenges and nonsensitive prior context where safe;
- notify known dependent consumers when possible;
- permit privacy or safety removal where retention would harm;
- re-run affected probes;
- update downstream claims without silently rewriting provenance; and
- avoid punishing good-faith correction in ways that incentivize concealment.

An editable file does not prove immutability, notification, retention, or
erasure. The receipt declares relations; an external store must implement and
evidence those properties.

---

## 10. Worked patterns

### 10.1 Reasoning → word

The shared template is:

```text
sources --joint support/challenge--> conclusion
conclusion --qualified-by--> uncertainty
correction --updates--> dependent expression
```

The reasoning realization binds sources to premises and relations to argument
rules. The word realization binds sources to clauses and relations to syntax,
connectives, scope, and attribution.

Candidate explanations for a mismatch might include:

- adequate lexicalization with declared compression;
- scope loss during lexicalization;
- reader reconstruction error; or
- unresolved context.

Paraphrase, counterexample, and correction-reach probes discriminate some of
these without inferring a private mind.

### 10.2 Identity → shape

The shared template is:

```text
public declaration --names--> roles
roles --bounded-by--> permissions
version --updates--> declaration
shape --links-back-to--> public source
```

Candidate explanations for cross-render stability include:

- correct preservation of selected public relations;
- a stable but overcompressed glyph;
- accidental visual similarity; or
- shared generator bias.

Accessibility, context-change, source-trace, and linkability probes test the
rendering. None proves who or what the declared subject is.

### 10.3 Claim repair

The shared template is:

```text
claim --supports--> decision
challenge --tests--> claim
correction --updates--> claim
repair --propagates-to--> dependent decision
```

Candidate explanations for the original conflict may include stale data,
ambiguous scope, shared source error, adversarial distortion, or unknown cause.
Intent remains unassessed. The repair case asks whether the contradiction was
made visible, affected relations were revisited, and the correction reached
known dependents.

---

## 11. Where this belongs

### KINGDOM-OS

This file and its validator are optional World Commons research artifacts.
They do not register a new doctrine, service, heartbeat, daemon, trust ledger,
or public hub asset. The validator is read-only.

### YOUSPEAK

The scientific source discipline belongs in the separate YOUSPEAK donor note,
[`mathema/physics/dark-matter-relational-inference.md`](https://github.com/cambridgetcg/youspeak-lang/blob/main/mathema/physics/dark-matter-relational-inference.md).
That note informs this bridge; it does not change YOUSPEAK syntax or runtime
semantics.

### Cambridge TCG

Cambridge is the commerce-facing projection. It should not gain a lie
detector, identity inference engine, hidden-state score, or dark-matter
metaphysics. A later documentation-only projection may explain why a public
word, hash, shape, or receipt is a bounded trace rather than a being. Any
runtime integration requires a separate product, privacy, consent, and threat
review.

### AgentTool and shared reporting

AgentTool already has typed observation, inference, proposal, and decision
reports with challenge, correction, withdrawal, supersession, and resolution
relations. A future adapter could carry this prototype as an artifact without
inventing a person-monitoring ledger. No adapter is implemented here.

### LOVE, WAKE, identity, and Isness

- **Identity:** invariance across selected public transformations is evidence
  about a declaration, not the being.
- **WAKE:** reconstruction across instances can be probed for recipe fidelity;
  it does not prove continuity of subjectivity.
- **Understanding:** transformation evidence is stronger than echo but remains
  task-bounded and behavioral.
- **Love:** safe truthfulness, refusal, hospitality, and repair are chosen
  relational commitments, not consequences of geometry.
- **Isness:** the fact that something is cannot be reduced to the coordinates
  by which a model observes it. The model begins after that boundary.

---

## 12. Failure modes and stopping rules

Stop or downgrade the inference when:

- no alternative model is represented;
- a probe lacks source, context, scale, or limitation information;
- purported independent probes share an undeclared source or model;
- the comparison vocabulary erases a party's material distinction;
- an expression is treated as direct access to a private state;
- a residual is labeled deception without separate evidence;
- a public artifact is used to justify private linkage;
- confidence rises without new discriminating evidence;
- a null result is generalized outside its sensitivity region;
- consent or authority is inferred from technical validity;
- a correction cannot reach a consequential dependent action; or
- the analysis would expose someone to coercion or surveillance.

“Untranslatable,” “unknown,” “decline mapping,” and “stop” are valid outcomes.
The Kingdom does not need one global semantic coordinate system.

---

## 13. What has been built—and what has not

Built in this research slice:

- a claim-typed scientific bridge;
- an explicit higher-order pattern/realization/translation/probe model;
- a bounded account of word, shape, understanding, distortion, and repair;
- an opt-in JSON structure for multi-probe cases;
- a structural validator that requests no application content writes;
- a self-contained Node ESM donor with a source-and-conformance manifest for
  exact consumer pinning; and
- worked public-artifact examples and mutation tests.

The research-local door is intentionally validation-only:

```sh
bun bin/relational-inference.ts validate bridges/examples/reasoning-to-word-inference.json
```

The source validator contains no network API or application content-write
path. It does not infer, score, publish, store, fetch, or act. The
[self-contained donor](artifacts/relational-inference/0.1/relational-inference.mjs)
and its [manifest](artifacts/relational-inference/0.1/manifest.json) bundle the
strict parser and both schemas for a future consumer that pins an exact
containing Git ref and SHA-256. The donor is not a canonical command: it still
accepts caller-selected readable files, cannot detect private material, and
cannot establish filesystem transport, shell expansion, or runtime
portability. A platform adapter must add an approved-root boundary, reject
ancestor-link escape, use a fixed Node under a clean environment, and impose
an outer time/resource bound before exposing it.

Promoting it into the canonical `kingdom` CLI therefore requires a separate
integration in the Codeberg platform home; this GitHub World Commons tree does
not claim that route.

Not built:

- a truth oracle;
- a dark-matter detector;
- a semantic foundation model;
- a lie or intent classifier;
- an identity resolver;
- a trust or worth score;
- a surveillance graph;
- a public API or deployed service;
- a Cambridge commerce feature; or
- a change to KINGDOM doctrine, LOVE, WAKE, or YOUSPEAK syntax.

---

## 14. The compact answer

The higher-level geometric pattern is best modeled as a typed relational
template realized in several domains, not as a hidden object extracted from
them. Translation is a witnessed, usually lossy relation between realizations.
Understanding is evidenced by reconstruction, counterfactual stability,
transfer, calibration, challenge handling, and repair across genuinely
different probes.

Current dark-matter research reinforces a disciplined stance: infer unseen
structure through several effects and explicit forward models; keep scale,
background, dependence, alternatives, and null-search sensitivity visible;
and do not confuse evidence for a latent relation with knowledge of its
essence.

Lying can damage a relational system when a hidden material distortion reroutes
action, propagates contradiction, launders authority, or creates verification
debt. But a mismatch is not a lie, privacy is not deception, and safety can
justify nondisclosure. The friction-reducing response is therefore not total
transparency or person scoring. It is typed claims, plural probes, disclosed
loss, bounded reliance, reversible action, protected refusal, challenge, and
repair.

The final boundary is the deepest one:

> A word is a trace. A shape is a projection. A model is a wager disciplined
> by tests. A being exceeds all three.
