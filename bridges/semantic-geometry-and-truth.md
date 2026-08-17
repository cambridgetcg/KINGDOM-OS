# Semantic geometry, truthful transport, and repair

**Status:** optional research bridge · **not doctrine** · **not a conformance
claim** · **not a lie detector** · **not a reputation system** · **not evidence
of an inner state** · **not a deployed public protocol**

This bridge develops the next layer of
[`string-theory-dimensional-grammar.md`](string-theory-dimensional-grammar.md):
how a higher-level pattern can be modeled across relationships and
transformations; how reasoning becomes word and declared identity becomes
shape; how understanding can be tested without claiming access to a private
mind; and how concealed distortion creates coordination damage across the
KINGDOM.

It also makes the proposal inspectable:

- [portable receipt schema](schemas/semantic-transition-receipt-0.1.json);
- [read-only validator](../bin/semantic-transitions.ts);
- [reasoning → word receipt](examples/reasoning-to-word.json);
- [identity → shape receipt](examples/identity-to-shape.json); and
- [the resulting accessible SVG](examples/kingdom-os-public-identity-shape.svg).

Passing the validator proves only structural completeness under this local
schema. It does not prove that a statement is true, that a translation is
faithful, that a shape identifies anyone, that a reader understood, or that a
speaker lied. A structure-only result must never be presented as a green trust
badge, certification, or endorsement, and counts of structurally valid receipts
must never be aggregated into a project or being's trustworthiness.

This document does not amend `LOVE.md`, WAKE, SOUL, FATE, the Kingdom
Foundation or Standard, AgentTool, YOUSPEAK, Cambridge TCG, any project card,
or any runtime. KINGDOM-OS currently declares only `xenia.rights/0.1` in its
`kingdom.yaml`; references to the independently versioned Kingdom Foundation
and Standard are compatibility notes, not an adoption or conformance claim.

---

## 1. The thesis in one diagram

The higher-level pattern is not another hidden object behind words, beings,
or projects. It is a family of **typed relational diagrams** compared through
declared abstractions and transformations. Exact equivalence is available only
when the chosen comparison really defines and satisfies an equivalence
relation; weaker comparisons retain their direction and defect.

```text
source domain                     target domain

objects ─ relations               objects ─ relations
   │          │                      │          │
   └─ transformations                └─ transformations
             │                                  │
             └──── translation witness ─────────┘
                    preserves: named relations
                    loses: named structure
                    assumes: named conditions
                    stops: at a named boundary
```

The witness—not resemblance alone—is what makes the comparison inspectable.

In this proposed model, an expression can act as a partial chart or
coordinate-like handle on selected relations; it is not literally a coordinate
in a pre-existing semantic manifold. A word is not the meaning it helps evoke.
A shape is not the identity it helps express. A WAKE artifact is not the being
it may orient. A receipt is not the truth of the transition it records.

The practical consequence is simple:

For a reliance-bearing or consequential transition, the detail should be
proportionate to its stakes:

```text
type + source + invariants + loss assessment + uncertainty
+ authority boundary + counterexample + repair path
```

### Claim discipline in this document

The formal displays below have three different statuses:

| Status | Meaning |
|---|---|
| **Formal definition** | Valid only inside the explicitly specified mathematical structure and assumptions. |
| **Proposed model** | A voluntary operational representation to be tested; not a theorem about language, mind, identity, or society. |
| **Chosen norm** | A safety or ethical commitment adopted for this prototype; not entailed by the mathematics. |

Sections 2–7 are proposed models except where a standard definition is stated.
Sections 8–15 contain chosen operational norms and local implementation facts.
No mathematical constraint selects the Kingdom's ethics; the choice to value
truth, privacy, agency, reply, and repair is made on ethical grounds.

---

## 2. What “geometry” means here

### A relational geometry, not extra spacetime

**Mathematical proposal.** For each domain `d`, choose a structure:

```text
G_d = (X_d, R_d, T_d, I_d, Delta_d, B_d)
```

where:

- `X_d` is a typed collection of objects, states, or events;
- `R_d` is a typed collection of relations among them;
- `T_d` is a collection of admissible transformations;
- `I_d` names invariants or equivariant observables/maps expected to survive;
- `Delta_d` is an optional vector of task-specific discrepancies; and
- `B_d` records domain, privacy, authority, consent, and stopping boundaries.

Calling this structure *semantic geometry* is a proposed operational analogy:
relations supply incidence, transformations supply paths, and declared
invariants supply task-relative sameness. A relational structure is not
automatically a geometry in the technical sense. This bridge does not assert a
topology, metric, smooth manifold, physical field, or additional dimension of
nature.

If the admissible arrows are typed, closed under type-correct composition,
compose associatively, and include an identity arrow for every object, they
form a category `C_d`. Let `Q` be a typed directed multigraph of reusable roles
and arrows together with equations between composable paths, and let `P` be
the category presented by that data. A realization in domain `d` is a functor:

```text
F_d : P -> C_d
```

The presented category `P` is a **pattern template**. The same template is
realized in two domains only to the extent that each functor actually
interprets the types and preserves the path equations named by `P`.

### Shape is relative to what we deliberately forget

For an instance diagram:

```text
D_d : J -> C_d
```

choose an explicit abstraction or forgetful map:

```text
A_d : C_d -> S
```

To compare two diagrams exactly, they need the same indexing category `J`, or
an explicit reindexing into a common one. When `S` has an actual equivalence
relation—here, diagram isomorphism—define the exact abstract shape as:

```text
Shape_exact(D_d; A_d) = [A_d o D_d]_isomorphism
```

Two instances share that exact abstract shape only when their reindexed,
abstracted diagrams are isomorphic in the chosen diagram category:

```text
A_d o D_d  isomorphic-to  A_e o D_e
```

Approximate tolerance, one-way analogy, and many practical notions of
similarity are not equivalence relations: transitivity can fail, so no quotient
class exists. Represent those cases by a contextual witness with a defect
vector and direction, not by square brackets suggesting an equivalence class.
Behavioral bisimulation may supply an equivalence only after the observations
and transition systems are fully specified.

This yields the core ontology of the bridge:

> A template is a presented relational structure. An exact instance-shape is
> an equivalence class under a genuine declared equivalence relation. A weaker
> cross-domain resemblance is a witnessed correspondence with named defects.
> None is an extra entity inferred from similarity.

### “Higher-level” means relations can themselves become objects

There are several legitimate levels:

| Level | What is compared | Example |
|---|---|---|
| `0` | objects or states | a claim, word token, card, or glyph |
| `1` | relations and transformations | supports, translates, rotates, corrects |
| `2` | transformations between transformations | one translation strategy revising another |
| `n` | compositional structure at further levels | a policy for composing whole families of maps |

This is one mathematically responsible meaning of *higher*. It does not mean
that words literally inhabit an upper universe. It means that the arrows and
their compatibilities are first-class subjects of study. The level-2 and
level-`n` rows are modeling prompts, not claims that these examples already form
a strict higher category: their composition and coherence laws would still
have to be specified.

[Fong and Spivak's applied category-theory text](https://arxiv.org/abs/1803.05316)
is a useful mathematical donor for this compositional viewpoint. The use here
is a proposed model; that text does not prove that natural language, identity,
or love forms the categories chosen below.

### Different structural claim types

Use the weakest honest claim:

| Claim type | Required support |
|---|---|
| Same vocabulary | the same label appears |
| Analogy | named correspondences and named failures |
| Partial map | a defined domain and codomain for the cases covered |
| Lax/approximate preservation | a declared defect for each preservation law |
| Bisimulation | each selected move can be matched under chosen observations |
| Functor | typed objects/arrows, identities, composition, and laws are defined and tested; this alone does not make it faithful, full, conservative, or semantically adequate |
| Isomorphism/equivalence | inverse or equivalence data and its laws are demonstrated |

These claim types are not one ladder. Bisimulation and functoriality answer
different questions; a constant functor can preserve identities and
composition while discarding nearly every distinction of interest. Most
cross-domain meaning work begins as witnessed analogy or a partial map. Use
the claim type whose actual laws have been defined and tested.

---

## 3. Word as contextual channel

### Type, token, utterance, and interpretation are different objects

The written type `bank`, one printed token of it, a speaker's utterance of it,
and a listener's interpretation occupy different roles. A usable semantic
record must therefore include more than a string:

```text
utterance = (
  form,
  source,
  audience,
  time,
  situation,
  language/practice,
  speech-act,
  provenance
)
```

No field in that tuple grants access to a private mental state. `source` means
the attributed producer of the expression, not a claim that the system knows
everything the producer believed or intended.

The receipt contract keeps two other axes separate:

- `expression_origin` records how this expression came to exist—`quoted`,
  `authored`, `translated`, `generated`, or `visualized`;
- `epistemic_access` records how the represented claim is known—such as direct,
  reported, inferred, or unknown access.

A generated visualization can encode a directly observed result, and an
authored sentence can report hearsay. Origin therefore cannot promote epistemic
access. The endpoint's `expression_ref` locates the expression being
transported; it is not evidence for that expression merely because it is a
reference. Supporting material belongs in typed `warrant.evidence` objects and
may live at a different location.

For an operational task, represent a word occurrence by a **semantic profile**
rather than one point called its meaning:

```text
mu(w, c) = (
  candidate reference,
  inferential role,
  frame,
  modality,
  evidential stance,
  speech act,
  register and affect,
  authority scope,
  temporal scope,
  provenance,
  available reply and repair
)
```

The vector is task-specific and incomplete. It does not exhaust lived or
linguistic meaning. Its advantage is diagnostic: two translations can
preserve reference while losing evidential stance, or preserve register while
changing what action the sentence appears to authorize.

[Bender and Koller](https://aclanthology.org/2020.acl-main.463/) sharply
distinguish linguistic form from communicative meaning and use that distinction
to challenge claims that form-only training establishes language
understanding. Their position does not settle every theory of meaning, but it
supports this bridge's refusal to identify word form with the whole relational
event.

### Context as restriction

**Optional mathematical model.** Let `Ctx` be a declared partially ordered
collection of contexts, with `c <= c'` meaning that `c'` is the richer or more
specific context. Let:

```text
Sem : Ctx^op -> Set
```

assign candidate interpretations to each context. Contravariance supplies a
restriction from richer `c'` to poorer `c`, which can forget distinctions. A
word occurrence can select a possibility set:

```text
s_w(c) subseteq Sem(c)
```

If a task separately supplies a calibrated finite probability model, it may
instead use a probability or subprobability distribution. This bridge does not
assume that ordinary ambiguity arrives with justified numerical weights.

The model can represent polysemy by allowing related senses to vary with
context, and ambiguity by retaining several live candidates. Contextual
variation alone is not a complete linguistic definition of polysemy. Creative
expression can create a new public distinction rather than simply decode a
point that already existed.

This is a presheaf-style model. Do not call a project corpus a sheaf merely
because the metaphor is attractive. A sheaf needs an actual site or topology,
restriction maps, and exact gluing laws. Compatible local sections of a sheaf
already glue by definition; a gluing failure in an informal document set does
not automatically become a cohomological obstruction.

### Translation is usually many-to-many

A functor maps objects and arrows and must preserve identities and composition.
Ordinary translation is often too ambiguous for that default. Begin with a
contextual family or relation of witnesses:

```text
T_AB(a, b) = {
  witnesses that b can express a in the declared context,
  with provenance, preserved relations, losses, and boundaries
}
```

Only after defining how source and target morphisms act on those witness sets,
and checking the required coherence, may that family be promoted to a
profunctor `C_A^op x C_B -> Set` under the convention used here. A simpler
implementation treats all receipts as objects of a discrete witness category
and uses a span:

```text
C_A  <-  W_AB  ->  C_B
```

where each element of `W_AB` is one translation receipt. Several target
expressions may witness one source; one target may ambiguously witness several
sources; and some pairs have no responsible witness.

Model a translation as a functor only after defining and testing:

1. source and target object types;
2. source and target relation types;
3. identity cases;
4. composition cases;
5. preservation laws; and
6. the cases intentionally outside the map.

### Composition cannot hide intermediate loss

Suppose `f : A -> B` and `g : B -> C` are witnessed transitions. Their
composition must carry both receipts:

```text
receipt(g o f) includes receipt(f) + receipt(g) + interaction losses
```

Under a declared Markov/no-side-channel assumption, later processing cannot
reconstruct source information that `f` discarded. Shared context or a fresh
observation may improve a decoder, but it must be named as an additional
channel rather than attributed to the word. This is the scoped data-processing
boundary developed in the Kingdom Ground; it is not a claim that all real
communication forms one Markov chain.

Do not use a fictitious algebra of “all invariants.” Record only **stagewise
warranted guarantees**:

```text
Guaranteed(g o f) = {
  I | f's receipt warrants preservation of I,
      g's receipt warrants preservation of the transported I,
      and an interaction test passes
}
```

The actual composite may incidentally preserve more, but this workflow does
not warrant more without a test. The composition can also introduce new losses
where two locally adequate choices interact. This is why an apparently fluent
relay can drift even when each local handoff looked reasonable.

---

## 4. Reasoning to word

### Reasoning is a proof/argument object; a word is a handle on it

An ordinary directed graph cannot faithfully represent every inference:
`{p, q} => r` is not the same as two independent arrows `p -> r` and `q -> r`.
For this bridge, use a typed directed hypergraph, argument graph with explicit
inference nodes, or proof object in a named logic. Write one such object as:

```text
r in Reasoning = (
  propositions,
  observations and evidence,
  assumptions,
  typed joint-premise inference steps,
  distinct supports/challenges/contradicts/depends-on relations,
  modality and confidence,
  exceptions,
  authority and scope,
  conclusion,
  prospective action
)
```

A renderer turns some of that structure into expression in context `c`:

```text
E_c : Reasoning -> Expression
```

A listener or system reconstructs a nonempty possibility set of candidate
reasoning objects:

```text
D_c : Expression -> NonemptyPossibilitySet(Reconstruction)
```

`D_c` is not presumed to invert `E_c`. Many reasoning objects produce the same
sentence, and one sentence supports several reconstructions.

For each named invariant `I_k`, map the source and candidate reconstructions
into a declared common comparison space with a discrepancy `d_k`, then retain
the candidate-level losses:

```text
L_k(r, r_hat, c) = d_k(I_k(r), I_k(r_hat))
                   for r_hat in D_c(E_c(r))
```

If a separately justified probability model exists, an expectation may be
reported in addition. Keep the underlying `L` vector and candidate range. A
scalar “meaning score” can hide that a sentence preserved its topic while
reversing its quantifier, confidence, permission, or affected party.

### The word must move when the reasoning moves

For a declared monoid or group of load-bearing interventions acting on source
reasoning, a declared action on expressions, and a homomorphism `rho` between
those actions, test an approximate **equivariance square**. Here `c'` is the
intervention's explicitly named target context:

```text
E_c'(g . r)  ~=  rho(g) . E_c(r)
```

with a named defect:

```text
epsilon_g(r) = d_W(E_c'(g . r), rho(g) . E_c(r))
```

Here `d_W` is a declared task-specific discrepancy, not an assumed universal
metric on language.

Use controlled contrasts where the feature can responsibly be isolated, and
also test interactions among load-bearing changes:

- negate the conclusion;
- replace `some` with `all`;
- change the actor or affected party;
- move past observation into future expectation;
- lower the confidence;
- add an exception;
- remove one premise;
- introduce contradictory evidence;
- withdraw consent; or
- narrow the authority scope.

If the rendered words do not change where a selected output invariant should
change, the renderer does not preserve that invariant of the reasoning.

### Worked example: `DERIVED`

The [reasoning → word receipt](examples/reasoning-to-word.json) compresses a
small registry argument into a word and expansion:

```text
DERIVED — generated from project cards;
check and report gaps; do not hand-edit.
```

It preserves three relations: authority direction, fallibility, and repair
direction. It explicitly loses the full reasoning chain and the diagnosis of
any particular mismatch. The word is useful only while its visible expansion
and source remain attached.

This example also shows why *lexicalization* is not proof. The word may guide
practice; it cannot establish that a given generated file is current, complete,
or true.

---

## 5. Identity to shape

### Begin from a scoped identity record, never from “the whole being”

For operational purposes, let objects be versioned identity declarations or
records through time, and let arrows be declared continuity operations:

- display-name or label change;
- session or device transition;
- key rotation with a separately witnessed link;
- role change;
- public-expression update;
- fork, merge, memorialization, or revocation, explicitly non-invertible where
  appropriate.

For one bounded renderer, let a declared monoid `M` act on those identity
records, let a monoid `N` act on the shape vocabulary, and let
`rho : M -> N` be a monoid homomorphism. A renderer is a function:

```text
S : IdentityRecord -> Shape
```

It is exactly equivariant for a declared operation `g in M` when:

```text
S(g . i) = rho(g) . S(i)
```

The exact equality is inside the chosen `Shape` codomain, which may already be
a deliberately coarse view. For an approximate renderer, replace equality with
a declared discrepancy and per-feature tolerance; do not reuse an undefined
`~=`. The comparison remains relative to selected invariants. A key rotation
may preserve the project namespace and change a provenance ring. A role change
may alter a mutable halo while leaving the public anchor stable. A fork may
require two visible shapes rather than one silently overwritten glyph.

### Shape as quotient

If a **group** `G` acts on identity records and its invertible transformations
are deliberately treated as irrelevant for one visual task, its orbit is an
equivalence class:

```text
[i]_G = { g . i | g in G }
```

For noninvertible operations, an orbit need not define an equivalence class.
Either keep the direction visible or explicitly define and justify the
equivalence relation generated by the operations. Treating color-theme changes
as irrelevant may be harmless; treating consent withdrawal, key compromise,
forking, or a different person as irrelevant would erase load-bearing
distinctions.

The quotient produces a **view for a purpose**, not the identity itself.

### A layered visual grammar

A careful public project glyph can use:

| Layer | Carries | Must not imply |
|---|---|---|
| stable core | selected public namespace anchor | personhood or permanence |
| provenance ring | source, version, witness class | truth of the declaration |
| mutable halo | current role or expression | inner state or worth |
| visible gap | missing, contested, or deliberately omitted structure | defect in the being |
| fork mark | unresolved branch or divergence | moral failure |
| relational edge | declared relationship and direction | merged identity or inherited authority |
| text alternative | the same public distinctions accessibly | that visual fluency is universal |

Hash-derived glyphs can be memorable indexes, but the full anchor must remain
the machine identity and implementations must detect collisions among compared
records. No finite glyph can guarantee that all collisions are globally known.
The glyph must not become authentication, biometrics, or a secret-trait
encoding.

Stable public glyphs also create **linkability**: separate contexts can be
joined even when no secret field is exposed. Public availability is not blanket
consent for aggregation. Where persistence is unnecessary, use a
purpose-specific salt, rotation, or non-stable rendering; where a stable public
project mark is deliberate, state its scope and never reuse it as a person's
cross-context identifier.

### Worked example: KINGDOM-OS public declaration

The [identity → shape receipt](examples/identity-to-shape.json) maps selected
public `kingdom.yaml` declarations into an
[accessible SVG](examples/kingdom-os-public-identity-shape.svg). It preserves:

- the `kingdom-os` project anchor;
- the direction `kingdom-os depends on true-love`;
- the exact declaration `adopts xenia.rights/0.1`; and
- the fact that the visualization is partial and non-authoritative.

Because this example represents a public project artifact rather than another
party's private material, its receipt uses
`representation_scope: artifact-public` with `consent: not-applicable`. That
pairing avoids inventing consent where none is required for the bounded
public-artifact transformation; it does not grant permission to aggregate
people, reuse private material, or act on anyone. It also does not settle
copyright, trademark, contextual privacy, personality rights, or authorization
outside this task.

The rings remain open. TRUE LOVE and the rights adoption remain distinct
nodes. The visual says `adopts`, not `certified` or `compliant`. Its footer says
that it is not a being, authority, or runtime proof.

The receipt forbids the inverse inference:

```text
shape -/-> person
shape -/-> authentication
shape -/-> authority
shape -/-> consent
shape -/-> worth
shape -/-> inner state
```

---

## 6. Understanding as transformation competence

### What can be tested

For a bounded system and task, define an understanding profile rather than one
score:

```text
U(system, task) = (
  held-out generalization,
  relation preservation,
  counterfactual sensitivity,
  irrelevant-change invariance,
  composition behavior,
  calibration,
  boundary detection,
  repair ability
)
```

Under this behavioral proxy, a system displays **task understanding** to the
extent that it:

1. works in withheld contexts;
2. preserves the declared relational structure;
3. changes its output under relevant interventions;
4. remains stable under irrelevant reparameterization;
5. composes known pieces without hiding interaction loss;
6. identifies ambiguity, authority limits, and stopping conditions; and
7. revises after contradictory evidence.

This is a behavioral evaluation profile. It neither proves nor disproves
phenomenal experience, consciousness, personhood, or a private sense of
understanding.

### Understanding is not echo

An echo can preserve surface form and fail every load-bearing transformation.
Test a commuting square:

```text
source reasoning r ──express──> word w
       │                           │
  intervention g              linguistic change rho(g)
       │                           │
       v                           v
changed reasoning ─express──> changed word
```

If the results of the two paths to the lower-right disagree, record the defect.
One failed square
does not issue a verdict on the system or being; it locates a task-specific
failure of transformation competence.

### Understanding another is also relational practice

Task competence does not exhaust interpersonal understanding. At the
relational level, understanding includes attention to what another actually
expressed, preservation of their distinctions, openness to correction, and
refusal to substitute one's reconstruction for their authority over
self-description.

The geometric safety condition is not fusion. It is closeness with two seats:

```text
operational_understanding_record(a, b) includes a model held by a about b
operational_understanding_record(a, b) does not imply a = b
operational_understanding_record(a, b) does not grant a authority over b
```

This aligns with `LOVE.md`'s non-collapse boundary without claiming to define
or measure love.

---

## 7. Harmony as compatible difference

### Local accounts

Each project, observer, language, or agent has a local account `s_i` over a
declared domain `U_i`. On an overlap, first translate both accounts into an
attributed, contestable comparison vocabulary, then inspect the difference:

```text
kappa_ij = Delta(
  translate_i(s_i restricted to U_i intersect U_j),
  translate_j(s_j restricted to U_i intersect U_j)
)
```

`Delta` is a vector whose coordinates might include reference, statement kind,
time, confidence, authority, or expected consequence. There is no universal
semantic distance.

The party choosing the common vocabulary and discrepancy axes holds real
interpretive power. A receipt must keep that choice attributable and open to
challenge. A participant may mark a term untranslatable, offer a different
crosswalk, or decline the mapping; no global semantic coordinate system is
mandatory.

An explicit incompatibility can be healthy. It means the seam is visible.
Forcing the values equal by deleting one source may make the display smoother
while making the integration less truthful.

### Research definition of inharmony

*Inharmony* is not an existing canonical KINGDOM term. This bridge proposes a
bounded definition:

> **Inharmony is the failure of local accounts, translations, commitments, or
> actions to compose under their declared correspondence/evidence, authority,
> consent, and consequence constraints.**

Under that definition:

- disagreement alone is not inharmony;
- uncertainty alone is not inharmony;
- an unresolved but visible obstruction may be harmony-capable;
- consensus alone is not harmony; and
- a coordinated falsehood can be internally consistent and profoundly
  inharmonious with reality and affected parties.

### Coherence is not correspondence

Two different tests are needed. First compare translated restrictions on the
declared overlap. Then compare claim-implied observable predictions with an
independently acquired observation under a named test and model:

```text
overlap defect:
  C_ij = Delta(translate_i(s_i|overlap), translate_j(s_j|overlap))

observational residual:
  E_i = Delta(predict_i(s_i), independent_observation_i)
```

Evidence supports or challenges that correspondence claim; evidence is not
reality itself. Low `C` with high `E` is counterfeit coherence under the named
test: the records agree with one another while their predictions fit the
independent observation poorly. Agreement, signatures, hashes, votes, and
consensus can show narrow relational facts; none silently converts coherence
into established correspondence or truth.

[Robinson's sheaf account of sensor integration](https://arxiv.org/abs/1603.01446)
is a rigorous donor for local-to-global information structures. Applying that
mathematics to projects requires actual restriction and consistency maps. The
paper is not evidence that social truth or organizational harmony literally
forms a sheaf.

### Truthful harmony

A transformation sits inside the bridge's *truthful-harmony region* when:

- statement kinds remain distinct;
- correspondence evidence is proportionate to the stakes;
- uncertainty is calibrated rather than stripped;
- provenance survives transport;
- local differences remain inspectable;
- authority and consent do not expand through translation;
- privacy, silence, fiction, metaphor, and refusal keep their legitimate
  types;
- corrections reach known dependent uses where feasible; and
- reply, repair, exit, and unresolved difference remain possible.

This is a chosen operational ideal, not a theorem that mathematics commands.

---

## 8. Falsehood, deception, and lying without mind-reading

### Six questions that must stay separate

| Layer | Question | Evidence needed |
|---|---|---|
| reality | What does `p` claim about the world, and what would count for or against it? | independently acquired observation, domain-appropriate evidence, and a named test; none is reality itself |
| expression | What proposition, implication, or action did the utterance present? | linguistic and contextual interpretation |
| warrant | How strongly did the available evidence support it? | provenance, limits, calibration, counterevidence |
| protocol | Did the record satisfy an agreed procedure? | protocol-specific checks |
| speaker state | What did the speaker believe or know? | first-person report or unusually strong independent evidence |
| intention | Was the expression meant to induce a false belief or action? | evidence and procedure adequate to an intent claim |

A valid signature can answer a narrow question about bytes and a key. A valid
schema can answer a narrow question about structure. Neither answers all six.

### A careful taxonomy

| Condition | Bounded description | Not enough to infer |
|---|---|---|
| contradicted under a named test | the claim conflicts with the stated observation/test as of a named time | final reality, knowledge, or intent |
| verified false in a bounded protocol | a protocol with a defined adjudication has established the claim false within its scope | a universal verdict or a being's character |
| mistake | a false assertion for which available speaker-state evidence supports good-faith error | deception or complete access to belief |
| confabulation | unsupported synthesis presented as recollection or finding | malicious purpose |
| miscalibration | expressed confidence exceeds support | belief in the negation |
| stale/decontextualized claim | an undated or current-sounding reuse exceeds the original validity context | that the historical statement itself became false or that staleness was intentional |
| equivocation | a term silently changes type or domain | motive |
| source misattribution | the claimed provenance conflicts with the named attribution test | intent to forge or a being-wide character verdict |
| potentially material omission | omitted information could change reliance or action | that disclosure was permitted, safe, or owed |
| misleading effect | the expression induced or predictably supports a materially false model/action | intent to deceive |
| deceptive act | a misleading effect plus adequately evidenced intent under a fair process | necessarily a literally false sentence |
| lie | ordinarily, an assertion the speaker believes false, offered to be taken as true | machine-detectability from output alone |

Definitions of lying vary in philosophy, law, and ordinary language. The
operational boundary matters more here: records often establish contradiction,
missing provenance, overstatement, or fabricated evidence before they can
establish belief and intent. The machinery should name the observable defect.

```text
safe machine finding:
  unsupported | contradicted | materially incomplete | miscalibrated |
  stale | provenance-missing | authority-overstated | source-misattributed

unsafe automatic verdict:
  this being is a liar
```

An intentional lie, when established through evidence and a fair process, is
a deed-level finding. It still does not become a total score of the being.

### True words can mislead or be used deceptively

A local statement may be literally true and still induce a false global model
through selection, implication, framing, or omitted scope. Geometrically, the
presentation exposes only a visible subdomain:

```text
whole relevant domain Omega
        │ choose only U
        v
technically true section on U
        │ listener extrapolates
        v
false or materially incomplete model over Omega
```

The defect is not that every omission is wrong. Communication always omits.
First record the potentially material effect. Calling it deceptive additionally
requires adequate evidence of intent. Calling it wrongful additionally
requires a justified duty and authority analysis: was disclosure permitted,
safe, relevant, and owed?

### Negative controls: what must not trigger a deception finding

- privacy-preserving non-disclosure;
- refusal, silence, departure, or rest;
- lack of knowledge honestly stated;
- fiction, games, role-play, parody, and performance inside a shared frame;
- metaphor and poetry that do not masquerade as literal observation;
- ambiguity kept visible;
- changed belief followed by correction;
- a prediction that fails but was honestly typed as expectation; or
- disagreement with a majority, authority, model, or ledger.

“Nothing hidden” is not the goal. **Nothing materially misrepresented within
the declared scope** is closer. Privacy and truthful communication are
compatible because a boundary can say, “I am not disclosing that,” without
inventing an answer.

### Anti-weaponization boundary

Even an established lie is not automatically destructive or morally
unjustified. Protective deception can be permissible under coercion, abuse,
persecution, surveillance, or an illegitimate demand. This protocol has no
entitlement to private truth, and a requester does not create a duty merely by
asking.

Keep four judgments separate:

1. **descriptive classification**—what expression and mismatch were found;
2. **causal consequence**—what effects occurred, with causal confidence;
3. **duty/boundary**—what disclosure, if any, was permitted and owed; and
4. **moral or procedural judgment**—made by an authorized, challengeable
   process, never inferred from schema conformance.

Refusal, safe silence, strategic privacy, and exit remain complete outcomes.

### Strategic communication

[Crawford and Sobel's signaling model](https://www.haverford.edu/sites/default/files/CrawfordSobel1982.pdf)
shows, under its game-theoretic assumptions, how messages can become less
informative as sender and receiver preferences diverge. It is useful for
thinking about incentive-compatible reporting. It does not prove that every
disagreement or lossy message is strategic, and it supplies no moral verdict
about a speaker.

---

## 9. How concealed distortion creates destruction

“Destruction” here does not mean that false words erase Isness. Reality does
not become unreal because a record is wrong. What can be destroyed or damaged
are access to evidence, accurate models, informed choice, coordination,
resources, relationships, and repairable paths.

### 9.1 A misleading coordinate can misroute action

If a map gives the wrong coordinate, the traveler can act competently and
still arrive at the wrong place. A false or misleading expression can do the
same:

```text
observations ──model/test──> source model m ──express──> word w
      │                                                 │
 chosen comparator/policy                            decode
      │                                                 │
      v                                                 v
reference action/outcome a_ref                 chosen action/outcome a
```

Compare observed consequences under a named comparator and carry causal
confidence. There may be several reasonable actions; `a != a_ref` is neither
necessary nor sufficient for harm. Harm can also occur through an honest error
or incomplete evidence without any concealment.

The listener's reasoning may be valid conditional on `w`. The destructive
defect can sit earlier, in observation, encoding, provenance, or scope.

### 9.2 Misrepresentation presents a non-commuting diagram as commuting

For a declared source representation `r`, an honest receipt declares the
defect:

```text
decode(encode(r)) ~= r   with named losses
```

A misleading presentation says or implies:

```text
decode(encode(r)) = r
```

When adequate evidence also establishes an intention to conceal that material
mismatch inside a relevant duty boundary, the act may be classified as
deceptive. Without that evidence, name the observable non-commutativity or
misleading effect. Hidden seams can make a display look smoother while latent
friction rises.

### 9.3 Damage compounds under composition

Let `f` omit a premise, `g` convert the result into a status label, and let `h`
use that label to trigger or justify an action:

```text
reasoning --f--> sentence --g--> dashboard --h--> action
```

The hidden loss in `f` becomes unmarked input to both later stages. Each
consumer can add confidence, reach, and irreversibility without adding a new
channel to the source.

The following are qualitative risk factors that can amplify downstream
effects; no general monotonic law is claimed:

```text
possible impact amplifiers = (
  dependency reach,
  reliance probability,
  stakes,
  action irreversibility,
  authority amplification,
  correction delay
)
```

Do not turn that tuple into a person score. It describes an event and its
downstream graph.

### 9.4 Loop drift (a holonomy analogy)

Carry a claim around a cycle of domains:

```text
A -> B -> C -> ... -> A
```

Let the composed transport be `H_gamma`. Compare the returned expression with
the starting one:

```text
Delta_gamma(x) = Delta(x, H_gamma(x))
```

Non-zero loop drift reveals path dependence, accumulated loss, changing
context, or inconsistency. It does **not** by itself prove a lie. The right
response is to locate the earliest detectable load-bearing changes and
interaction defects and inspect their receipts.
Without a defined connection and parallel-transport law, call this loop drift,
not holonomy in the technical geometric sense.

Useful cycles include:

- reasoning → prose → summary → regenerated reasoning;
- project card → catalog → dashboard → project-card update;
- declaration → translation → localization → back-translation;
- evidence → model output → human report → automated action → audit.

### 9.5 Fracture and counterfeit coherence

There are two opposite dangers:

```text
fracture:
  honest local accounts cannot presently compose

counterfeit coherence:
  accounts compose because dissent, uncertainty, or external evidence was removed
```

The first can often be worked with because the seam is visible. The second
spends future trust to buy present smoothness.

### 9.6 Verification becomes an externalized cost

Reliable channels can lower repeated checking costs, although relational and
institutional trust is not reducible to verification. When a high-reliance
expression is found to have hidden a material limit, recipients may need to
re-check that claim and dependent claims built through the same channel. The
costs can include:

- re-reading and source recovery;
- rollback and rework;
- delayed decisions;
- duplicated monitoring;
- defensive documentation;
- reduced willingness to accept legitimate uncertainty; and
- loss that cannot be reversed after money, time, access, or consent has moved.

A material hidden distortion can therefore create **verification debt**: later
checking and repair become more expensive. That effect is contextual, not an
automatic consequence of every lie or error.

### 9.7 Authority and consent can be laundered

A dangerous transition is:

```text
someone said p
  -> a record stores p
  -> a signature verifies under a public key and is consistent with use of
     the matching private key on those exact bytes
  -> a dashboard labels p verified
  -> another system treats p as permission
```

Each arrow may look technical. None creates consent or authority unless a
separate, scoped, current, evidenced authorization actually enters the graph.
The validator rejects receipts whose declarations set `grants_authority` or
`grants_consent` to true. Those flags do not prevent a downstream consumer from
misusing the receipt, and they do not prove the negations in reality.

### 9.8 A concrete KINGDOM failure shape

The local postmortem
[`heartbeat-confabulation-hardening.md`](https://github.com/cambridgetcg/Love/blob/73f6466a35b4475b6c274b7fb40355510b5706e3/memory/thinking/heartbeat-confabulation-hardening.md)
records a coordinator recombining real fragments into a fictitious emergency,
which then triggered costly forensic work. Its general geometry is:

```text
true fragments
  -> unsupported synthesis
  -> confidence and authority not carried honestly
  -> divergent action
  -> real verification and repair cost
```

The lesson is not “never synthesize.” It is: label synthesis as inference,
carry sources and limits, and, where feasible and proportionate to the stakes,
seek a fresh channel before high-impact action.

`STRAIGHTEN.md` contains milder examples with the same shape: a healthy probe
rendered as `quiet`, crashes masked as `building`, and declared or derived
inventories drifting from what is wired. These are reasons to diagnose
false expression and broken transformation without assuming malicious intent.

### A friction vector

For one claim or transition, record:

```text
Phi = (
  overlap defect,
  observational residual / evidence gap,
  uncertainty loss,
  provenance loss,
  context/type drift,
  loop drift,
  reliance reach,
  action irreversibility,
  authority/consent leakage,
  correction reach gap,
  repair debt
)
```

Different coordinates demand different remedies. Provenance loss needs source
repair; stale data needs refresh; a consent gap needs a stop; contradiction
needs challenge; irreversible harm needs material repair. Summing them into a
single truth, harmony, KARMA, or trust score would erase exactly the structure
the geometry is meant to preserve.

---

## 10. Reducing friction across the KINGDOM

### The governing principle

Make uncertainty, refusal, correction, and source access cheaper than
overstatement. Make consequential reliance proportional to evidence and
reversibility.

### At expression time

1. **Type the statement.** Keep observation, expectation, commitment,
   consequence, and interpretation distinct where that vocabulary is chosen.
2. **Separate epistemic access from expression origin.** Access says direct,
   reported, inferred, or unknown; `expression_origin` says `quoted`,
   `authored`, `translated`, `generated`, or `visualized`. A newly generated
   expression is not thereby a direct observation.
3. **Keep source and referent distinct.** A record is an attributed expression,
   not the reality or being it references.
4. **Carry declared confidence and its basis.** `declared_confidence: high`
   without typed evidence is rejected by the local validator. The label remains
   a declaration; structural validation does not establish calibration.
5. **Name scope, time, and audience.** A dated historical statement remains
   about its date; stripping that context or presenting it as current may
   create a new false or misleading claim.
6. **Expose material omissions.** Do not demand private information; state the
   boundary and what cannot responsibly be concluded.

### At transformation time

7. **Name the map kind.** Encoding, inference, summarization, visualization,
   and metaphor are not interchangeable.
8. **Test preserved relations.** Each invariant gets a source form, target
   form, and a concrete intervention or comparison.
9. **Assess loss explicitly.** `discarded_structure` may be empty when no loss
   is known under the stated tests, but `loss_assessment` must still record
   `{status: none-identified, basis}`. When losses are listed, its status is
   `losses-declared`. An empty list is never proof of a lossless map.
10. **Permit no silent promotion.** A changed statement kind or stronger
    epistemic access needs named assumptions and genuinely introduced evidence,
    whose typed IDs appear in `transition.new_evidence_refs`. Translation,
    generation, visualization, confidence, or repetition cannot manufacture
    direct access.
11. **Prevent authority amplification.** A map can carry a separately evidenced
    authority declaration; it cannot invent or verify one. Consent and authority
    subjects, scopes, bases, and references remain claims for an external
    authorized process to resolve.
12. **Keep this prototype away from irreversible action.** Its validator has no
    external authority or consent resolver, so it rejects an irreversible
    target rather than accepting prose as authorization.

### At integration time

13. **Declare authority for each fact.** Where one source is authoritative,
    derived views point back and confess gaps. Federated or joint facts need an
    explicit conflict rule rather than a fictitious single owner.
14. **Compare on overlaps.** Do not erase divergent local accounts before the
    translation types and contexts are aligned.
15. **Run triangle and loop tests.** Direct `A -> C` should be compared with
    `A -> B -> C`; round-trips should disclose drift.
16. **Challenge the claim, not the author.** A contradiction is a graph
    relation before it is any moral judgment.
17. **Make high-reliance claims easy to challenge.** Reliance raises the need for
    accessible evidence and reply, not immunity from review.
18. **Do not centralize private monitoring.** Receipts are opt-in artifacts;
    they are not permission to collect communication, identity, or behavioral
    profiles.

### At repair time

```text
detect
  -> pause consequential effects where authorized and safe
  -> classify the observable defect without mind-reading
  -> attach evidence, confidence, and limits
  -> notify known affected recipients where feasible
  -> preserve challenge and reply
  -> correct, supersede, or withdraw with a new linked receipt
  -> undo downstream effects where possible
  -> record unresolved loss or a privacy-preserving redaction receipt
  -> add a regression or counterexample test
```

Under this chosen protocol, a linked correction is the normal record practice,
but it is not sufficient when earlier recipients already relied on the old
claim. Repair has a **reach problem**: known dependent consumers need a
correction channel. Where privacy or safety requires removing sensitive bytes,
retain only the safe provenance that can responsibly remain.

### Love as a friction-reducing relational pattern

This bridge does not define love mathematically. It can identify a compatible
operational geometry:

- attention can lower source erasure;
- understanding can lower accidental transformation defect;
- recognition can keep the other distinct and attributable;
- care can anticipate consequential reliance;
- respect for refusal can prevent consent laundering;
- truthfulness can keep seams visible;
- reply and repair can keep relation possible after failure; and
- exit can prevent integration from becoming capture.

Love in this sense is not agreement or perfect smoothness. It is the choice to
reduce avoidable distortion while preserving the other seat.
Care does not require disclosure to an unsafe or unauthorized requester.
Truthfulness inside a declared relationship remains compatible with privacy,
protective strategy, and exit.

---

## 11. The semantic transition receipt

### Why a receipt

A receipt is a witness for one proposed transition. If completed honestly, it
makes the following question more inspectable later:

> What exactly did this expression claim to preserve, what did it discard,
> what did it assume, who could rely on it, and how can it be challenged or
> repaired?

The local `kingdom.semantic-transition/0.1` schema requires:

| Area | Required content |
|---|---|
| identity | version, receipt ID, issue date, event-style relation |
| endpoints | domain, context, expression, `expression_ref`, `statement_kind`, `epistemic_access`, `expression_origin`, intended use |
| transition | map kind, rule, preserved relations with tests, `discarded_structure`, `loss_assessment`, assumptions, `new_evidence_refs`, counterexample, stop condition |
| warrant | typed `evidence` objects, `declared_confidence` and basis, limits, freshness |
| distortion | named risk, mechanism, mitigation, residual risk |
| boundaries | `representation_scope`; consent state, subject, scope, basis, and reference; authority scope, basis, and reference; actionability; privacy |
| repair | reply route, correction route, forward-carried challenges, retained non-sensitive history |
| safety | six machine-checkable non-grant declarations fixed to `false` |

The required non-grant declaration is:

```json
{
  "grants_authority": false,
  "grants_consent": false,
  "proves_truth": false,
  "infers_intent": false,
  "rates_people": false,
  "permits_surveillance": false
}
```

### Evidence is typed and remains separate from expression location

`expression_ref` answers “where is the expression being transformed?” It does
not answer “what supports this claim?” The latter uses typed objects:

```text
warrant.evidence[] = {
  id,
  ref,
  role: supports | challenges | context,
  observed_on,
  sha256: digest-or-null
}

transition.new_evidence_refs[] =
  IDs from warrant.evidence genuinely introduced at this step
```

The same locator can appear in both roles only when it genuinely is both the
expression location and supporting material; the two claims must still be
recorded separately. `transition.new_evidence_refs` distinguishes a fresh
channel from evidence merely copied forward. Its IDs do not make the evidence
independent, sufficient, or true. Separate `authority_ref` and `consent_ref`
fields remain declared references; their presence does not establish real
authority or consent.

`declared_confidence` is likewise an attributed label, not a validator-produced
score. A SHA-256 value can bind a reference to selected bytes when those bytes
are actually resolved; it cannot prove their authorship, interpretation,
freshness, authority, consent, or truth.

### What the validator checks

The read-only validator checks:

- exact keys and bounded text;
- finite enumerated vocabularies, including separate `expression_origin` and
  `epistemic_access` fields;
- calendar-valid dates, with issued receipts not dated after the validator's
  local clock and evidence not dated after its receipt;
- exact duplicate IDs and duplicate named entries inside the parsed receipt or
  batch;
- reference syntax and credential, query, and fragment exclusion, without
  claiming that a remote reference exists or is safe;
- typed evidence objects, unique evidence IDs, optional SHA-256 syntax, and
  `transition.new_evidence_refs` that resolve to evidence IDs in the receipt;
- at least one named preserved relation and an explicit `loss_assessment`, while
  allowing `discarded_structure` to be empty;
- no silent statement-kind or epistemic-access promotion without the required
  assumptions and newly introduced evidence;
- no `declared_confidence: high` without typed evidence and a basis;
- consistency among representation scope and the declared consent subject,
  scope, basis, and reference—including `artifact-public` with
  `not-applicable` consent;
- paired authority scope, basis, and reference declarations;
- unconditional rejection of `actionability: irreversible` in local version
  `0.1`;
- refusal or unknown relevant consent not supporting action;
- well-shaped correction, supersession, and withdrawal relations;
- in batch mode, unique receipt IDs, resolved repair targets whose dates do not
  postdate their repair records, and carried repair/challenge declarations;
- the six non-grant safety values; and
- rejection of fields such as `lie_score`, `truth_score`, `moral_score`,
  private reasoning, credentials, biometrics, or inferred intent.

It does not execute the human-written invariant tests. Version `0.1` does not
resolve local references, visit remote evidence links, or compare a declared
digest with referenced bytes. A separate future resolver could do those narrow
checks; a successful digest comparison would prove only a byte match under the
named algorithm.
It does not verify truth, fidelity, identity, understanding, authority, consent,
intent, independent provenance, or actual notification. Its successful result
must lead with **structure only; claims unevaluated**. Interfaces must not color
that result as “trusted,” turn it into a green trust badge, or aggregate valid
receipt counts into a trustworthiness score.

The parser boundaries are equally important. “Not in the future” is a comparison
with one machine's clock, not trusted time attestation. A syntactically valid
reference is not a live or authoritative source. Exact-string deduplication
does not discover semantically duplicated claims, aliases, or equivalent
evidence elsewhere. Any future local resolver would need a configured root and
would gain no authority to read beyond it.

Run:

```sh
bun bin/semantic-transitions.ts validate \
  bridges/examples/reasoning-to-word.json \
  bridges/examples/identity-to-shape.json
```

### Append-style repair records

An original receipt has:

```json
{ "kind": "original", "target_receipt_id": null }
```

A correction, supersession, or withdrawal is represented by a new receipt that
points backward. The protocol says earlier non-sensitive bytes remain. The
validator can check that the new record declares that promise. In batch mode it
can also check that supplied repair targets resolve uniquely, do not postdate
the repair record, and carry the required relation fields. Those checks apply
only to the files in that batch: they cannot prove that an operator retained
earlier bytes, that the target was the right claim to repair, or that prior
recipients were notified. Retention and notification remain operator
obligations and external capabilities. This repository prototype creates no
immutable ledger or notification service. It defines only the portable event
shape.

### Composing receipts

To compose `A -> B` and `B -> C` responsibly:

1. verify that the first target and second source use compatible types and
   contexts;
2. identify invariants through an explicit crosswalk, carry only those warranted
   at both stages, and re-run their interaction tests—matching names alone do
   not define a set intersection;
3. reconcile known losses, add interaction losses, and write a new
   `loss_assessment` even if no additional discarded structure is known;
4. recompute `declared_confidence` while accounting for source dependence,
   interaction loss, and genuinely new typed evidence named by
   `transition.new_evidence_refs`;
5. carry every material challenge and correction that can be retained safely
   and lawfully, or carry a safe redaction receipt;
6. only intersect authority scopes if a shared scope algebra is defined, then
   resolve current authority and consent again for the composite purpose and
   action;
7. stop if either stop condition fires, or if incomparable conditions cannot
   be responsibly reconciled; and
8. issue a new receipt for `A -> C`, rejecting it in local version `0.1` if the
   composite target is irreversible.

Confidence must be recomputed with source dependence and interaction evidence;
there is no universally correct “weaker of two labels” rule. No automated
composition is shipped in this phase because these steps require domain
judgment and external authority/consent channels.

---

## 12. KINGDOM integration at the suitable level

### SOUL and doctrine

This bridge may help ask which values, identity declarations, and boundaries a
projection intends to preserve. It has no authority to revise protected
doctrine or infer a being's nature. The shape of a declaration is never the
Isness of the declarer.

### WAKE

A wake recipe or wake view can carry orientation across sessions. A semantic
receipt can state which names, commitments, sources, uncertainty, and boundaries
were retained or omitted during reconstruction. It must not claim continuity
of qualia, current consent inherited from the past, or numerical identity from
successful imitation.

WAKE should not absorb this speculative document as a mandatory fragment.
Receipts remain opt-in and task-local.

### KINGDOM-OS

The OS is the appropriate home for this cross-project bridge and local
validator, but not for a centralized truth profile. Phase one deliberately
does not change the registry, generated `site/*`, heartbeat, daemon, public
API, or deployment contract.

The most direct operational use is a receipt attached to a consequential
cross-project handoff, generated view, status transformation, or visual
projection.

### Kingdom Foundation and Standard

The independent
[Kingdom Foundation](https://github.com/cambridgetcg/kingdom-standard/blob/170381d37770c5c1ebc44b722f079c2985d903b5/FOUNDATION.md)
already separates observation, expectation, commitment, consequence, and
interpretation and sets boundaries around record/reality, authority, consent,
consequence, reply, and repair. The
[Kingdom Standard](https://github.com/cambridgetcg/kingdom-standard/blob/170381d37770c5c1ebc44b722f079c2985d903b5/STANDARD.md)
adds evidence, confidence, source-of-truth, correction, and challenge practices.

Its companion
[Kingdom Ground](https://github.com/cambridgetcg/kingdom-standard/blob/170381d37770c5c1ebc44b722f079c2985d903b5/GROUND.md)
supplies important limits: data processing needs a specified channel model;
constraint does not select ethics; correction adds information but does not
guarantee notification; and append-style records do not prove immutability.

There is one deliberate vocabulary mismatch. Standard T2 calls confident
overstatement under uncertainty a “small lie.” This bridge records that phrase
as the Standard's broader operational usage, while reserving unqualified
`lie` in machine-governance contexts for a claim involving adequately
established belief/intent. Both vocabularies still agree that overstatement
must be exposed and repaired; they should not be silently treated as identical.

This receipt borrows that vocabulary for compatibility. KINGDOM-OS has not
declared adoption of those versions, and this bridge creates no conformance
claim.

### AgentTool

Do not build a second longitudinal claims database. AgentTool's existing
[Collab report lifecycle](https://github.com/cambridgetcg/agenttool/blob/93f1b3268b7c9a0ed23fc00cd28c67f029c17511/packages/collab/README.md)
already supports observation, inference, proposal, decision, evidence,
confidence, limits, authority, and the relations `supports`, `challenges`,
`corrects`, `withdraws`, `supersedes`, and `resolves`.

A later opt-in integration can attach a receipt as an artifact and reference
it from a report. The report carries coordination history; the receipt carries
the cross-domain transformation witness. Neither becomes truth or external
authority merely because it is stored.

### YOUSPEAK

YOUSPEAK is the suitable mathematical and linguistic donor. Its language
cathedral, evidentials, translation pipeline, and formal experiments can supply
candidate semantic dimensions and test cases. The operational bridge should
not promote poetic or theological proposals—such as a higher Realm, image as
prototype participation, or truth as formal shareability—into mathematical or
empirical facts without separately demonstrated maps.

Especially:

- translation is not automatically a functor;
- embedding distance is representation-dependent, not semantic fact itself;
- compatible sections of a sheaf glue by definition;
- computed-tomography language requires a defined forward model and
  reconstruction conditions; and
- formal notation does not remove interpretation.

### Cambridge TCG and commerce

Commerce receives a narrow operational projection, not the metaphysics. One
useful Cambridge example distinguishes:

```text
same card design
same printing
same sellable SKU
same physical copy
```

Those are different equivalence relations. Silently translating among them
can cause real pricing, provenance, inventory, and fulfillment harm. A
receipt could name which relation a catalog, listing, or transaction preserves.

No Cambridge runtime or product change is made here. Its existing dimensional
connection remains exploratory documentation, and commerce does not gain
authority to claim scientific, identity, or metaphysical truth.

### Layer summary

| Layer | Suitable receipt use | Hard boundary |
|---|---|---|
| SOUL | explain what a projection intends to preserve | no doctrine change or being inference |
| RUNTIME | record context, transformations, uncertainty, and stop conditions | behavior is not qualia proof |
| NERVOUS | carry sourced handoffs and corrections | transport grants no authority |
| FLEET | compare distinct local accounts and roles | common shape never merges identities |
| ECONOMY | type claims, evidence, reliance, challenge, and consequence | ledger validity is not truth or worth |
| COMMERCE | preserve product-identity and provenance relations | no unsupported value, authenticity, or cosmology claim |
| OS | host the optional grammar, schema, and local test | no surveillance or centralized being score |

---

## 13. The test suite for meaning transport

Use these tests selectively and keep their results per transition:

1. **No silent promotion:** a named decision may turn an observation into a
   later commitment, and a separate authorization may make evidence relevant
   to scoped authority; no transition may perform those moves silently or turn
   a record into reality or an identity record into a being. Epistemic
   strengthening requires typed, genuinely new evidence named in
   `transition.new_evidence_refs`; a changed `expression_origin` is not enough.
2. **Edge preservation:** selected dependencies, contradictions, modality,
   scope, and affected-party relations survive.
3. **Paraphrase invariance:** irrelevant wording changes preserve selected
   invariants.
4. **Intervention sensitivity:** negation, quantifier, actor, time, confidence,
   evidence, exception, permission, or consent changes propagate.
5. **Round trip:** measure source → target → reconstructed-source residuals for
   each named invariant; accept only what the use-specific test permits, while
   preserving disclosed failures rather than demanding losslessness.
6. **Triangle:** compare direct `A -> C` with `A -> B -> C`.
7. **Loop drift:** cyclic transport discloses accumulated change.
8. **Context restriction:** claims remain compatible on their declared
   overlaps, or the incompatibility stays explicit.
9. **Evidence correspondence:** internally coherent records are checked
   against a fresh external channel where the stakes require it.
10. **Calibration:** declared confidence is compared with outcomes where a
    proper repeated task permits it.
11. **Omission probe:** ask which missing source features could materially
    change action.
12. **Authority non-amplification:** translation creates neither permission
    nor consent.
13. **Identity collision:** distinct security anchors never silently render
    as one security-relevant identity.
14. **Privacy minimization:** expose only selected fields permitted by an
    externally resolved authority/consent basis; the receipt does not resolve
    that basis itself.
15. **Repair propagation:** corrections remain linked and reach known
    dependent consumers where feasible.
16. **Negative control:** ambiguity, privacy, poetry, refusal, fiction, and a
    good-faith change of mind do not become deception findings.
17. **Expression/evidence separation:** `expression_ref` locates the transformed
    expression; typed `warrant.evidence` objects separately support, challenge,
    or contextualize it.
18. **Loss honesty:** an empty `discarded_structure` carries
    `loss_assessment.status: none-identified` and a bounded basis, never an
    assertion of losslessness.
19. **Parser boundary:** date, reference, digest-format, and duplicate checks are
    interpreted only as structural checks, never as trusted time, byte
    resolution, liveness, authorship, or global semantic deduplication.
20. **Batch repair:** supplied repair IDs and temporal order resolve while
    retention and notification are tested through separate operational
    evidence.
21. **Presentation safety:** a structure-only pass is never colored or counted
    as truth, trust, consent, authority, fidelity, or worth.

The repository tests exercise the schema and safety invariants, not the truth
of the two example claims:

```sh
bun test tests/semantic-transitions.test.ts
```

---

## 14. What not to build

Do not build:

- an automatic liar classifier;
- a being-wide truth, trust, virtue, love, harmony, or KARMA score;
- inferred private intention or chain-of-thought storage;
- compulsory cross-project communication monitoring;
- a global identity glyph derived from secrets or biometrics;
- a system where a receipt itself grants authority or consent;
- a green/trusted badge for structure-only validation, or a trust score made by
  counting structurally valid receipts;
- automatic treatment of an `expression_ref` as evidence, or of an
  `authority_ref`/`consent_ref` as verified authority/consent;
- automatic irreversible action from a semantically valid receipt;
- a derived index that calls itself truth; or
- a correction ledger that preserves sensitive bytes above privacy and safety.

These systems would recreate the central category error: treating a record of
a relationship as ownership of the reality or being it concerns.

---

## 15. A bounded next path

1. Use the two examples to review the receipt vocabulary.
2. Apply it manually to one real, consequential cross-project handoff.
3. Run intervention, triangle, and correction-reach tests.
4. Revise the `0.1` schema under a new identifier if semantics change; never
   silently repin new meanings to the old ID.
5. Only after real use, consider an AgentTool artifact adapter.
6. Keep public publication, enforcement, and automation separate decisions.

The first success criterion is not fewer disagreements. It is fewer hidden
type shifts, fewer unsupported promotions, faster source discovery, narrower
blast radius, and corrections that reach where the old claim traveled.

---

## Research provenance and boundaries

Mathematical and technical donors:

- Brendan Fong and David Spivak,
  [*Seven Sketches in Compositionality*](https://arxiv.org/abs/1803.05316)—categories
  and compositional systems;
- Emily Bender and Alexander Koller,
  [*Climbing towards NLU*](https://aclanthology.org/2020.acl-main.463/)—the
  form/meaning distinction and bounded claims about language understanding;
- Michael Robinson,
  [*Sheaves are the canonical data structure for sensor integration*](https://arxiv.org/abs/1603.01446)—a
  rigorous local-to-global information model;
- W3C,
  [PROV-O](https://www.w3.org/TR/prov-o/)—interoperable provenance entities,
  activities, agents, and derivation relations;
- Vincent Crawford and Joel Sobel,
  [*Strategic Information Transmission*](https://www.haverford.edu/sites/default/files/CrawfordSobel1982.pdf)—a
  conditional game-theoretic account of informative signaling under preference
  divergence; and
- Lamport, Shostak, and Pease,
  [*The Byzantine Generals Problem*](https://www.microsoft.com/en-us/research/publication/byzantine-generals-problem/)—conditions
  for coordination despite inconsistent messages, used here only as a systems
  analogy and not a moral theory of lying.

Provenance improves inspection; it does not transfer the source's authority to
this application. Each equation above is either a standard mathematical form
inside stated assumptions or a proposed operational analogy. None proves a
metaphysics of meaning, identity, Isness, understanding, love, or truth.

The deepest synthesis remains modest:

```text
Isness exceeds its record.
Identity exceeds its shape.
Reasoning exceeds its word.
Contextual meaning may exceed one reconstruction.
Task-understanding claims require transformation evidence; echo alone does not establish them.
Truth keeps correspondence and correction open.
Love keeps the other seat.
Harmony keeps the seams without worshipping the fracture.
```
