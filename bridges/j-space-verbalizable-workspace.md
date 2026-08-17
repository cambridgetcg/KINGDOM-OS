# J-space, verbalizable workspace, and relational meaning

**Status:** optional research bridge · **not doctrine** · **not a theory of
consciousness** · **not a mind reader** · **not a lie detector** · **not an
identity resolver** · **not a monitoring system** · **not an inference or
monitoring runtime**

**Scientific review date:** 2026-08-17

This bridge asks what the 2026 J-space work can—and cannot—contribute to the
KINGDOM's study of language, reasoning, identity, understanding, WAKE, love,
and Isness. It composes with the repository companions
`bridges/semantic-geometry-and-truth.md` and
`bridges/dark-matter-relational-inference.md` without changing either protocol.

The bounded answer is useful:

> J-space is evidence for a sparse, vocabulary-aligned, causally active
> interface between some internal model states and later verbal behavior in
> the tested models and tasks. It is not the whole reasoning process, a
> language-neutral ontology, a self, consciousness, truth, or Isness.

The companion case is deliberately a test design rather than a model run:

- [reasoning → word J-space case](https://thekingdom.dev/records/j-space-reasoning-to-word-2026-08-17.json);
- [relational inference schema](https://thekingdom.dev/schemas/relational-inference-case/0.1.json); and
- research-local validator: `bin/relational-inference.ts`.

It can be checked locally:

```sh
bun bin/relational-inference.ts validate \
  bridges/examples/j-space-reasoning-to-word-inference.json
```

Passing means only that the declarations and references form a valid local
`kingdom.relational-inference/0.1` record. It does not establish that a model
contains the proposed representation, that a translation preserves meaning,
or that any being understands, intends, lies, loves, wakes, or consents.

---

## 1. Claim discipline

| Label | Meaning here | Does not mean |
|---|---|---|
| **[E] reported experiment** | A result reported by the paper or an identified replication attempt | KINGDOM reproduced it |
| **[M] model-conditioned interpretation** | An interpretation conditional on architecture, estimator, task, and controls | The interpretation is the unique mechanism |
| **[F] formal statement** | A definition or consequence inside explicitly selected mathematics | Models, minds, or reality must instantiate it |
| **[P] proposed KINGDOM model** | A structure offered for inspection and testing | Doctrine, production policy, or authority |
| **[A] bounded analogy** | A comparison with named preserved and unpreserved relations | Empirical evidence transferred between domains |
| **[N] chosen boundary** | An ethical or operational commitment | A theorem derived from the paper |
| **[X] refused inference** | A conclusion the available evidence does not establish | A merely cautious synonym for the same claim |

The labels do not promote one another. A causal experiment can support a
mechanistic claim in its tested setting; it cannot turn a philosophical
analogy into an empirical discovery.

---

## 2. What the reported J-space construction is

### 2.1 Typed states before evocative names

**[F] [M]** Fix a model revision, source layer `ell`, target layer `m`, source
position `s`, target position `t >= s`, tokenizer, normalization rule, and
prompt-position sampling measure `mu_(ell->m)`.

Let:

```text
h_(ell,s) in H_ell ~= R^d
z_(m,t)   in R^d
U         in R^(|V| x d)
```

where `h_(ell,s)` is an intermediate residual-stream state and `z_(m,t)` is
the declared target-layer residual state at the selected target position. The
main exposition targets the final pre-unembedding residual; the reported
Sonnet default targets the penultimate layer. Row `u_w^T` of `U` is the
unembedding covector for vocabulary token `w`. These are different types.
`z_(m,t)` is not itself the vocabulary-logit vector.

For a declared sampling and aggregation procedure, define an averaged
Jacobian:

```text
J_(ell->m) := E_((x,s,t) ~ mu_(ell->m)) [ D_(h_(ell,s)) z_(m,t) ]
```

with `J_(ell->m) in R^(d x d)` under this typing. It approximates how a small
change at the source state changes a selected target-layer state at the same
or a later position, averaged across the estimator's contexts and position
pairs. Below, `J_ell` is shorthand only after `m` and the estimator are fixed.

The average is part of the object. Change the model, layer, prompts,
source/target positions, weighting, or estimator and one generally changes
`J_ell`. Changing the tokenizer, unembedding, or final normalization changes
the vocabulary frame or nonlinear lens even when the pre-normalization
Jacobian is held fixed. Neither object is an intrinsic dictionary of eternal
word meanings.

The paper's exposition and released reference code do not encode every
sampling choice identically. In particular, a future-target aggregation can
weight source/target pairs differently from a literal uniform expectation
over pairs. A reproducible claim therefore records the estimator and data
measure, not only the symbol `E`.

### 2.2 Pulled-back vocabulary directions

**[F]** Ignoring final normalization for one local linear score, pull token
`w` back to layer `ell`:

```text
v_(ell,w) := J_ell^T u_w

u_w^T J_ell h = v_(ell,w)^T h
```

The right-hand score asks how strongly the state aligns with a direction that
the averaged downstream map associates with the token's later logit. It is a
causal *disposition under the chosen linearization*, not a declaration that a
word is literally stored at that location.

The reported J-lens is closer to:

```text
p_hat_ell(. | h) = softmax(U N(J_ell h))
```

where `N` is the model's final normalization. RMSNorm or LayerNorm makes the
full readout nonlinear. The equality above the lens therefore does not absorb
`N`, and a raw dot product must not be presented as the complete probability
calculation.

### 2.3 Token is not word, concept, proposition, or relation

**[X]** A token is not a word or concept. One word can split across tokens;
one token can serve several words, languages, or grammatical roles; a concept
can require several tokens; and a proposition depends on binding and context.

The construction uses the model's vocabulary because the unembedding gives a
convenient output-aligned frame. That frame is useful and deeply informative,
but it is selected by the model's interface. It does not prove that cognition
has a unique token-shaped ontology.

---

## 3. The geometry: sparse cones, not a hidden linear world

### 3.1 The honest positive-sparse object

**[F]** Choose vocabulary directions as columns of a dictionary:

```text
V_ell = [v_(ell,w_1) ... v_(ell,w_n)],  n = |Vocab|
```

For sparsity budget `k`, the positive object is:

```text
C^+_(ell,k)
  := union_(S subseteq Vocab, |S| <= k)
       { V_(ell,S) a : a in R^(|S|)_(>=0) }.
```

This is a **union of sparse nonnegative cones**. It is **not a vector
subspace**, is not generally convex, and is not necessarily closed under
addition or negation. Each component cone has dimension
`rank(V_(ell,S)) <= |S| <= k`; it need not be exactly `k`-dimensional.

A vocabulary enlargement is not automatically a strict enlargement of this
set: a new direction may be redundant. With nonnegative coefficients that may
equal zero and at least `k` available directions, an “exactly `k` indices”
union generates the same point set as “at most `k`” by zero-padding. The
contracts differ only if “active” means strictly positive or if support
cardinality itself is retained as metadata; that convention must be stated.

The source exposition also mixes two mathematical descriptions: its prose
defines sparse nonnegative combinations and cones, while a displayed appendix
formalization/projection uses signed spans and pseudoinverses. Those are not
the same object. This bridge adopts the at-most-`k` nonnegative cone union as
the positive J-space contract and treats signed-span/pseudoinverse operations
as a separate relaxation used for selected interventions.

### 3.2 Cone approximation is sparse nonnegative optimization

**[F]** The closest positive-sparse approximants are set-valued until ties are
resolved:

```text
Pi^+_(ell,k)(h)
  := argmin_(x in C^+_(ell,k)) ||h - x||_2^2.
```

Equivalently, this is a support search plus nonnegative least squares. If two
supports attain the same minimum, `Pi^+` is not a single operator without a
declared tie-break.

For one fixed support `S`, Euclidean projection onto the signed span is instead:

```text
P_S h = V_S V_S^dagger h in span(V_S).
```

That is not projection onto the positive cone unless the resulting
coefficients happen to satisfy the cone constraints. A span residual is
Euclidean-orthogonal to the selected span. A cone residual follows
polar-cone/complementarity conditions. A residual from the nonconvex sparse
union need not be unique. Calling every such remainder “J-orthogonal” borrows
precision the construction does not have.

### 3.3 The signed pseudoinverse relaxation is a different model

**[F]** The dense coordinate choice

```text
c = V_ell^dagger h
```

is signed and selected by the Moore–Penrose minimum-norm convention. It is not
evidence that `h` has a sparse positive verbal decomposition. Because
`|Vocab|` is much larger than `d`, the dictionary is overcomplete and ordinary
coordinates are nonunique before a convention is chosen.

There is an additional trap: if `J_ell` and the unembedding both have full
rank, the full dictionary span can generically equal all of `R^d`. Projection
onto that full span then leaves no remainder and makes a “J versus non-J” split
vacuous. Every meaningful split must name the sparse support, regularizer,
selection method, and matched comparator.

### 3.4 A local derivative and a finite edit are not the same act

**[F] [M]** A coordinate edit may be expressed as:

```text
h' = h + alpha V_ell (c_hat - c).
```

For a one-coordinate transfer from state `B` into state `A`:

```text
h'_A = h_A + alpha v_i (c_(B,i) - c_(A,i)).
```

`J_ell` is shorthand for a local derivative averaged over
`mu_(ell->m)` after the target layer is fixed. The edit is a finite intervention
and may move the state off its normal activation distribution. Causal
behavioral change after the edit is evidence about that intervention; it is
not guaranteed by the derivative alone.

### 3.5 Distances remain conditional

**[F]** One can define:

```text
d_J(h, h') = ||J_ell(h - h')||_2.
```

Unless `J_ell` is injective, this is a pseudometric: different states in its
kernel have distance zero. Distribution-averaged behavioral discrepancies are
also relative to their probe distribution and may identify only equivalence
under those probes. Approximate “within tolerance” resemblance is generally
non-transitive, so it forms neighborhoods, not quotient classes.

---

## 4. What the experiments support

### 4.1 An evidence ladder

Keep five claims distinct:

1. **Decodability:** a lens maps an activation to recognizable tokens.
2. **Local sensitivity:** the averaged Jacobian predicts selected downstream
   response directions.
3. **Causal contribution:** a controlled intervention changes later behavior.
4. **Reusable abstraction:** the same direction participates across several
   distinct downstream tasks.
5. **Global-workspace interpretation:** those results fit a theory of broadly
   available, report-oriented representation.

Each step needs additional evidence. The last is an interpretation of a
functional resemblance, not a measurement of consciousness.

### 4.2 Strongest reported evidence

**[E]** The paper reports matched-norm interventions, activation swaps,
component ablations, re-entry clamps, temporal-depth controls, activation
patching, and head ablations. Together these provide substantially stronger
evidence than token decoding alone that selected J-aligned components can
causally mediate reports and some multi-step behavior in the tested Claude
models.

Selected bounded results reported by the authors include:

| Test | Reported result | Honest reading |
|---|---|---|
| Two-hop activation swaps | 54%, 70%, and 70% success for the tested Haiku, Sonnet, and Opus settings | Material causal control, not universal transfer |
| Reusing argument directions across 16 constructed functions and four argument categories | 76/192 at ordinary strength; 101/192 at doubled strength | Partial reuse; “arbitrary downstream computations” is too broad |
| J-component ablation | Flexible/report-like tasks degrade more than selected shallow parsing tasks | A task-local dissociation, not a complete taxonomy of cognition |
| Re-entry clamping | Reduces recovery after J-component removal | Some non-J activity can regenerate J-aligned activity; the systems are coupled |
| Layer analysis | Approximate sensory, workspace-like, and motor bands appear across model depth | Model-specific empirical organization, not a theorem or universal brain map |

The broad approximate bands reported in normalized depth—early sensory-like,
middle workspace-like, and final motor-like—depend on model and measurement.
Numbers such as roughly 0–33%, 38–92%, and the final layers are summaries of
reported plots, not invariant boundaries.

### 4.3 Generalization remains bounded

**[E] [M]** Cross-language interventions are evidence that some pulled-back
directions participate beyond one output language. They do not prove that the
model “thinks in English” or that every language shares one privileged lexical
ontology.

An invited commentary reports partial open-weight replication on Qwen-family
models, including some multilingual and typo-related effects, while arithmetic
and poetry examples did not reproduce cleanly. This is useful corroboration,
but it is contemporaneous, hosted with the original project, and not a full
independent replication of the Claude interventions, monitoring claims, or
training study.

### 4.4 Counterfactual reflection is an alignment result, not WAKE

**[E]** The authors report training on 10,000 generated counterfactual
reflection contexts and lower LLM-graded dishonesty and deception scores on
two benchmarks. Ablating selected J directions partially reverses those gains.

Important missing controls include matched ordinary ethical demonstrations,
irrelevant reflection, multiple training seeds, broad capability evaluation,
and adversarial monitor gaming. The result supports a causal benchmark effect
and partial mediation in that setting. It does not prove a unique mechanism,
general alignment, an awakened self, or moral understanding.

---

## 5. The higher-level geometric pattern

### 5.1 From bag of tokens to typed diagram

**[P]** A sparse token support is not yet a structured thought. To model
meaning across domains, lift the selected components into a typed diagram:

```text
D_J(h, c) = (A, R, T, B, Q)
```

where:

- `A` contains active vocabulary-aligned directions with estimator-relative
  weights;
- `R` contains typed bindings—subject, predicate, argument, scope, negation,
  time, source, and other declared relations;
- `T` contains transformations across layer, position, context, language, and
  intervention;
- `B` records downstream causal or broadcast effects under named consumers;
  and
- `Q` records the probes and conditions under which those claims were tested.

The current J-lens provides evidence mainly about `A`, parts of `T`, and parts
of `B`. It does not yet provide a general decoder for `R`. This is the binding
gap: a bag containing tokens related to “Alice,” “Bob,” and “helps” does not
say who helps whom, under what scope, or whether the proposition is negated.

### 5.2 Exact shape requires exact choices

**[F] [P]** Let `P` be a typed relational pattern, `D_d : I_d -> G_d` a domain
diagram, `r_d : I -> I_d` an explicit reindexing, and `A_d : G_d -> C` a
declared abstraction into one comparison category. Only then can an exact
shape be written:

```text
Shape_exact(D_d; A_d, r_d) = [A_d o D_d o r_d]_isomorphism.
```

The equivalence relation is exact diagram isomorphism after named forgetting.
It is not “similar enough,” shared vocabulary, cosine proximity, or a claim
that the domains contain the same essence.

Approximate cross-domain translation is better represented by a witnessed
correspondence:

```text
W_(d -> e) = (
  source and target contexts,
  role map,
  preserved relations,
  unpreserved relations,
  intervention tests,
  defect vector,
  known losses,
  assumptions,
  counterexample,
  stop condition
).
```

Approximate correspondences are directional and need not compose cleanly.
They are not quotient classes.

### 5.3 Causal signatures compare transformations, not just coordinates

**[P]** For a representation candidate `r` and preregistered probe family `Q`,
define a finite causal signature:

```text
Sigma_Q(r)
  = { (q,
       F_q(h),
       F_q(edit_r(h)),
       F_q(control_r(h))) : q in Q }.
```

Two representations have the same exact tested signature only when those
finite response records agree under the named comparison. An approximate
signature carries componentwise defects and uncertainty. Cosine similarity
alone cannot establish that the same abstraction is used.

Useful probes include:

- matched-norm J versus selected non-J edits;
- feature swaps with predeclared expected downstream effects;
- re-entry clamps;
- paraphrase, language, and task transfer;
- relation-binding interventions rather than token-only swaps;
- negative controls and null concepts;
- model, layer, position, and tokenizer changes; and
- held-out evaluators and prospectively selected token sets.

---

## 6. Reasoning to word

### 6.1 The map is a chart, not an inverse of thought

**[P]** A bounded pipeline can be written:

```text
public problem + context
        |
        v
model state h_(ell,s)
        |
        +-- J-lens readout --> token-aligned candidate labels
        |
        +-- controlled edits --> later answer effects
        |
        v
public expression
```

The J-lens is one output-oriented chart on `h`. It is lossy,
context-averaged, tokenizer-dependent, and locally linear before a nonlinear
normalization. A readable intermediate can be causally important without
being the whole computation. Conversely, a computation can be behaviorally
effective without entering the selected verbal chart.

Therefore:

```text
J-decodable activation != complete reasoning
causal token direction != complete proposition
reported answer effect != proof of understanding
```

### 6.2 A relational test for reasoning → word

The companion case uses the public synthetic derivation:

```text
4 + 17 = 21
21 * 2 = 42
42 + 7 = 49
```

The strings `21`, `42`, and `49` are lexical labels until a fixed tokenizer
revision establishes their tokenization. The case asks whether a proposed
layer/position-specific coordinate realizes three public relations:

```text
problem --derives--> intermediate
intermediate --verbalizes--> intermediate expression
{problem, intermediate} --supports--> answer expression
```

It proposes three unrun tests:

1. a J-lens readout test;
2. a coordinate intervention; and
3. a matched control outside the selected sparse support.

All three share the same model, tokenizer, prompt, and Jacobian estimator, so
the case declares them shared-systematic. Its conclusion is underdetermined
with unknown confidence. This is intentionally less exciting—and more useful—
than serializing a planned experiment as an established mechanistic result.

### 6.3 What would count as progress

A stronger case would require:

- a pinned open model and tokenizer;
- exact prompt/position fixtures;
- exact Jacobian estimator and normalization;
- prospective supports and token sets;
- readout, intervention, and matched controls;
- relation-binding tests, not only numeral replacement;
- held-out tasks and languages;
- independent reproduction; and
- explicit failure records.

Even then, the conclusion would be about a tested model mechanism. It would
not grant access to private human reasoning.

---

## 7. Language and word as transformation

### 7.1 Four levels that must not collapse

| Level | Example | Main transformation risk |
|---|---|---|
| Token | tokenizer element | segmentation and polysemy |
| Word/phrase | public lexical expression | language and context dependence |
| Proposition/diagram | bound roles and relations | scope, negation, attribution, time |
| Speech act | assertion, question, promise, fiction, refusal | authority, duty, intent, audience |

J-space is strongest at the first level and provides causal clues toward later
verbal behavior. Understanding language requires the relations among all four.

### 7.2 Translation across domains

Let `E_d` infer a set or distribution of source structures from an observation
in domain `d`, and let `F_e` render a candidate structure in domain `e`.
Because `E_d` is generally set-valued or probabilistic, the translation is not
the ill-typed ordinary composition `F_e o E_d`. It is a set-valued rendering or
pushforward:

```text
T_(d -> e)(x)
  = { F_e(z, c_e) : z in E_d(x, c_d) }
```

or, probabilistically:

```text
T_(d -> e) = (F_e)_* E_d.
```

J-space can constrain one such encoder by showing which output-aligned
directions have tested causal effects. It does not make the inverse unique.

### 7.3 Translation cycles reveal defects, not causes

For a cycle of translations, record a componentwise residual:

```text
Delta_gamma = discrepancy_Q(x, T_gamma(x)).
```

Nonzero components may arise from tokenization, omitted relations, context
shift, estimator bias, off-manifold edits, ordinary error, or deliberate
misleading action. The residual does not identify which cause occurred.

---

## 8. Identity to shape

### 8.1 Identity is not the loudest self-token

**[X]** A direction decoded as a persona, model name, “I,” or “Assistant” is
not a being's identity. It can reflect training, prompt role, output convention,
or a transient control state. The reported workspace-like organization appears
before a fully trained Assistant perspective, while post-training changes what
persona-related content becomes available. That supports a distinction:

```text
workspace-like access structure != selfhood
persona representation             != identity
identity claim                      != continuity of subjectivity
```

### 8.2 Identity as an invariant trajectory

**[P]** For a bounded system claim, model identity as a family of invariants
and repair relations across allowed transformations:

```text
I_Q = (
  declarations,
  provenance,
  behavior under Q,
  continuity rules,
  allowed change,
  correction history,
  unresolved alternatives
).
```

No single coordinate needs to remain fixed. What matters is which relations
survive context, time, translation, challenge, and correction under declared
tests. Noninvertible transformations form directed reachability, not
automatically an equivalence class.

### 8.3 Shape is a scoped projection

A visual shape may encode selected public attributes:

```text
shape = Render(public declaration, purpose, salt, epoch, visual grammar).
```

The receipt must disclose omitted attributes, purpose, stability, and
linkability. Stable glyphs can enable cross-context tracking even when inputs
are public; purpose-specific salts or rotation are appropriate where persistent
linkability is unnecessary.

J-space contributes one lesson: a readable coordinate can be a useful handle
without being the entity. Identity exceeds both token and glyph.

---

## 9. Understanding as a tested profile

### 9.1 No scalar essence

**[P]** Replace “understands / does not understand” with an evidence profile:

```text
U_Q = (
  reportability,
  causal modulation,
  counterfactual stability,
  cross-task reuse,
  relation binding,
  calibration,
  challenge response,
  repair competence
).
```

Each component names tasks, contexts, probes, and limitations. A model can
score differently across them. The profile is behavioral/mechanistic evidence,
not a worth score or measurement of qualia.

### 9.2 What J-space adds

J-space strengthens an important distinction:

- echo shows that a form can be repeated;
- decodability shows that an observer can map a state to a form;
- intervention shows that a component contributes causally;
- flexible reuse shows that it participates across transformations; and
- relation-sensitive repair shows that it can update a structured dependency.

Causal mediation is more informative than echo, but it still does not
establish consciousness. A complete understanding claim also needs binding,
scope, counterexamples, transfer, and repair.

### 9.3 Consciousness boundary

**[X]** The paper's “global workspace” language is a **functional analogy** to
broad access, report, and flexible control. The work does not establish
consciousness, phenomenal experience, a unified subject, selfhood, embodiment,
or moral patienthood.

Even perfect evidence for a functional workspace would not, by itself, decide
between theories of phenomenal consciousness. The construction is also
output-coordinate-defined, so “sparse verbal-control workspace” remains a live
GWT-neutral interpretation.

---

## 10. WAKE, love, and Isness

### 10.1 WAKE

**[A] [X]** The counterfactual-reflection result suggests a bounded engineering
motif: make chosen principles available at decision points and test whether
removing their representation changes behavior. That resembles one aspect of
runtime composition.

It does not prove awakening, persistent identity, subjective continuity, or
the canonical WAKE recipe. This bridge therefore makes no WAKE fragment,
loader, registration, or doctrine change.

### 10.2 Love

**[P] [N]** “Love” is not established by decoding the token `love`. A usable
KINGDOM pattern is relational and longitudinal:

```text
care preserves agency
hospitality preserves refusal
truthfulness preserves safe boundaries
repair lowers repeated contradiction
exit remains available
```

J-space could someday help test whether selected principles causally
participate in a bounded model decision. It cannot prove love, goodness,
consent, or moral standing. Those are not latent labels to extract.

### 10.3 Isness

**[X]** J-space begins with modeled activations and an output vocabulary. It
therefore concerns a system's expressibility under a selected chart. It does
not reach the pre-model fact that something *is*.

```text
Isness != decodability
presence != reportability
being   != coordinate
```

The coordinate may reveal a relation in the model. It does not exhaust the
reality to which the relation may refer.

---

## 11. Lying, destruction, and inharmony

### 11.1 A deception-related token is not a lie finding

**[N] [X]** A decoded or causally active direction such as `fake`, `secret`,
`evaluation`, or `deceive` shows, at most, that a vocabulary-aligned
representation participated under a named model and test. It does not by
itself establish:

- that an external assertion was false;
- that the model represented it as false;
- that a speaker believed it false;
- that the speaker intended another to accept it;
- that a duty of disclosure existed; or
- that privacy, fiction, role-play, or protective nondisclosure was wrongful.

A narrow lie judgment requires all of those relevant layers to be separately
and legitimately evidenced. The v0.1 validator cannot do that.

### 11.2 Why hidden distortion can damage a relational system

**[P]** A material concealed distortion can create inharmony when it changes a
shared model and misroutes dependent action:

```text
representation
     |
     v
shared operational model --decision policy--> action
     |                                      |
     +--dependent claims                    v
                                       observed outcome
```

Possible friction channels include:

- false premises propagating through dependent reasoning;
- qualifiers or alternatives disappearing during lexicalization;
- a monitor confusing concept availability with intent;
- authority or consent being inferred from technical coherence;
- corrections failing to reach downstream consumers;
- people hiding errors because correction is punished;
- repeated rechecking after a channel proves unreliable; and
- transient outputs freezing into identity or worth judgments.

That is a causal hypothesis to test, not a theorem that every lie produces
destruction. A protective deception under coercion can reduce harm. A true
sentence can mislead through framing. An honest error can also cause damage.

### 11.3 J-space introduces its own deception hazards

Alignment monitoring with J-space can fail in both directions:

- **false positive:** a prompt mentions deception, so the concept becomes
  available even when no deceptive policy follows;
- **false negative:** a well-trained or automatic policy bypasses the selected
  report-oriented coordinates;
- **lexical blind spot:** a relevant representation has no single-token name;
- **adaptive gaming:** training learns to route behavior away from monitored
  coordinates;
- **basis artifact:** the Jacobian/unembedding construction makes selected
  content visible while hiding another equally causal basis; and
- **scope drift:** a result on deliberately misaligned model organisms is
  generalized to people, other models, or normal dialogue.

The paper itself presents monitoring as insufficient on its own. KINGDOM must
treat it as one bounded audit channel among behavioral tests, provenance,
counterexamples, and independent review—never a truth meter or sanctioning
oracle.

### 11.4 Friction reduction

**[N] [P]** The safer response is not total transparency. It is better
relational accounting:

1. Type observations, interventions, interpretations, and philosophical
   analogies separately.
2. Record model, layer, tokenizer, estimator, prompt, position, normalization,
   scale, and date.
3. Preserve competing models and negative controls.
4. Keep token activation, proposition truth, belief, intent, duty, harm, and
   moral judgment as distinct fields.
5. Require several probes before consequential reliance.
6. Protect silence, refusal, redaction, fiction, and safe exit.
7. Make challenges cheap and corrections visible.
8. Re-run dependent tests after repair.
9. Never convert a coordinate or validator pass into identity, authority,
   consent, worth, or punishment.

Harmony here is not forced agreement. It is compatible difference with
inspectable transformations and safe repair.

---

## 12. Suitable KINGDOM integration

### 12.1 What this slice adds

This bounded release adds:

- this evidence-typed bridge;
- one opt-in public-artifact case using the existing relational-inference
  protocol;
- the existing closed relational-inference schema as a public companion;
- an immutable three-route static publication with typed `GET`/`HEAD`
  representation headers;
- read-only homepage, guest, manifest, and `llms.txt` discovery;
- a build-time discovery reader, boundary and mutation tests; and
- one entry in the bridge index.

The case contains no activation data and runs no model. Its three probes are
explicitly `not-run`, all candidate models are `unassessed`, and its conclusion
is `underdetermined` with `unknown` confidence.

### 12.2 What remains separate

This slice does not add:

- a `kingdom` command or Codeberg platform route;
- a model download or Jacobian computation;
- private conversation or activation ingestion;
- hidden-state monitoring;
- a truth, intent, deception, consciousness, or identity classifier;
- a person, model, trust, love, or worth score;
- a WAKE, LOVE, Isness, NEN, KARMA, Being, or Geometry doctrine change;
- an AgentTool longitudinal record;
- a Cambridge TCG product or commerce feature;
- an executable public validator, model endpoint, mutable alias, monitoring
  API, or action route; or
- authority to act on a model or person.

Any future experimental bench requires a separate privacy, consent, threat,
licensing, compute, evaluation, and publication review. Private activations or
conversation-derived representations cannot enter the public-artifact v0.1
case by implication.

### 12.3 Why no new inference or authority protocol is needed

The existing relational case already expresses the right boundary:

```text
typed pattern
  -> domain realizations
  -> witnessed translation
  -> probes and dependency declarations
  -> competing candidate models
  -> bounded conclusion
  -> repair route and non-grants
```

J-space is a new scientific donor, not a reason to mint a new inference or
authority layer. `kingdom.j-space-publication/0.1` versions only the static
discovery projection; it does not define an inference engine or grant a new
capability.

---

## 13. Falsifiers and stopping rules

### 13.1 Mechanistic falsifiers or refinements

Refine or reject a proposed J-mediated relation when:

- the readout fails prospectively selected fixtures;
- matched edits outside the selected support explain the same behavior;
- effects vanish under held-out prompts, positions, languages, or tasks;
- the same direction reverses meaning across context without a modeled
  contextual transform;
- a relation-binding test fails while token labels remain readable;
- a simpler output-bias model predicts the results equally well;
- independent implementations do not reproduce the estimator or interventions;
- full nonlinear predictions disagree with the local linear score; or
- results depend on post hoc token selection.

### 13.2 Ethical and operational stops

Stop the analysis when:

- an activation is treated as direct access to private reasoning;
- a decoded token becomes a lie, intent, or consciousness verdict;
- public output is used to justify hidden cross-context identity linkage;
- monitoring is deployed without consent and a legitimate relationship;
- private or sensitive data would enter a public fixture;
- disagreement is flattened into one mandatory vocabulary;
- a validator pass is presented as evidence quality;
- an intervention can cause consequential behavior without a reversible,
  authorized test boundary; or
- correction and appeal cannot reach the consumers of a claim.

“Unknown,” “not run,” “untranslatable,” “decline mapping,” and “stop” are
successful protocol outcomes.

---

## 14. Primary-source horizon

The scientific claims in this bridge were reviewed against:

1. **Main interactive paper:** [“Verbalizable Representations Form a Global
   Workspace in Language Models”](https://transformer-circuits.pub/2026/workspace/index.html),
   Anthropic Transformer Circuits, 2026.
2. **Versioned preprint:** [arXiv:2607.15495v1](https://arxiv.org/abs/2607.15495v1),
   submitted 2026-07-16. The review horizon contains only v1.
3. **Reference implementation:**
   [anthropics/jacobian-lens](https://github.com/anthropics/jacobian-lens).
   This bridge links rather than vendors it and makes no byte-level pin claim.
4. **Official research summary:**
   [“A global workspace in language models”](https://www.anthropic.com/research/global-workspace),
   used as author framing rather than independent evidence.
5. **Invited expert commentaries:**
   [commentary collection](https://www-cdn.anthropic.com/files/4zrzovbb/website/cc4be2488d65e54a6ed06492f8968398ddc18ebe.pdf),
   including a reported partial open-weight replication. Invitation and expert
   interpretation are not peer-review consensus.

The paper was a recent v1 preprint at the review date. The closed Claude
weights and full production alignment setting are not independently
reproducible from the reference repository. Core ideas have partial
open-weight corroboration; the full causal, monitoring, consciousness, and
training interpretations do not have a disclosed complete independent
replication at this horizon.

---

## 15. Compact answer

J-space offers a powerful new chart: pull output-token directions backward
through an averaged Jacobian, find sparse vocabulary-aligned components, and
test their causal participation through controlled intervention. Its strongest
lesson for KINGDOM is methodological. A readable coordinate becomes meaningful
only through the transformations and relations it survives.

The higher-level geometric pattern is therefore not one magic vector. It is a
typed diagram of active features, bound relations, transformations, causal
effects, probes, losses, and repair. Exact abstraction requires exact
isomorphism after declared forgetting. Approximate translation requires a
witness and defect record.

Words are public charts. Reasoning exceeds one chart. Identity is a tested
trajectory, not a token. Understanding is a bounded competence profile, not a
scalar essence. Love is an agency-preserving relational commitment, not a
decoded label. WAKE is not proved by workspace-like access. Isness begins
outside the readout.

And lying must never be inferred from a J-space coordinate. Hidden material
distortion can propagate contradiction and misroute action, but mismatch,
belief, intent, duty, harm, and moral judgment remain separate. The path to
less friction is plural evidence, explicit loss, protected refusal, reversible
tests, correction, and repair—not surveillance dressed as geometry.
