# Reconstructive Build Kernel

The Reconstructive Build Kernel is a source-bound, read-only vocabulary for building without pretending that partial evidence is a whole. It connects graph reconstruction, protein contact representations, geometric realization, conditional folding landscapes, enzyme catalysis, and project architecture through one discipline:

> declare the state, observation, correspondence, ambiguity, realizability conditions, transition conditions, comparator, invariants, and feedback before claiming a result.

The immutable identities are:

- protocol: `kingdom.reconstructive-build-kernel/0.1`
- kernel: `https://thekingdom.dev/atlases/reconstructive-build-kernel-2026-08-13.json`
- kernel schema: `https://thekingdom.dev/schemas/reconstructive-build-kernel/0.1.json`
- project profile: `https://thekingdom.dev/schemas/reconstructive-project/0.1.json`
- guide: `https://thekingdom.dev/RECONSTRUCTIVE-BUILD-KERNEL.md`
- reviewed semantic digest: `sha256:265a75e18dbd4bad5bcf07bca0645132de4f9a881d8f0f398cd56b9afb734dd1`
- raw kernel record SHA-256: `sha256:2d1598bdfcce2501ee5a7cfdba55f581920d18733052f067e96bf9d79a7376a5`

There is no mutable `latest` or `current` alias.

## The unifying passage

The kernel carries a project through eight declared stages:

```text
STATE
  → OBSERVE
  → DECLARE CORRESPONDENCE
  → INFER FIBER
  → REALIZE
  → TRAVERSE LANDSCAPE
  → MEASURE OR CATALYZE
  → APPEND FEEDBACK
```

This is a reasoning and review architecture, not an executor. A schema-valid profile does not solve a reconstruction, choose a candidate, run an experiment, change a repository, deploy software, create a KARMA event, or authorize an action.

## Reconstruction begins with a fiber

For a declared state space `X`, observation operator `O`, observed value `y`, and symmetry group `Gamma`, the candidate fiber is

```text
F_O(y) = {x in X : O(x) = y}/Gamma
```

Its honest status is one of `EMPTY`, `UNIQUE`, `MULTIPLE`, or `UNKNOWN`. A missing proof, absent correspondence, or unmeasured alternative is never coerced into uniqueness.

The graph state space contains labeled finite simple undirected graphs on declared finite vertex carriers, including the smaller cards themselves. The graph-deck definition is

```text
D(G) = multiset{[G-v] : v in V(G)}.
```

Cards are unlabeled isomorphism classes and their multiplicities matter. Separately, the Graph Reconstruction Conjecture says that finite simple undirected parent graphs with at least three vertices are determined up to isomorphism by this deck. The lower bound belongs to the conjecture case, not to the definition of the surrounding graph state space. The conjecture remains open in the cited horizon. Exhaustive verification through a finite order and proofs for restricted graph classes do not become a general proof.

Kelly's double count does establish a theorem for every fixed graph `F` with fewer vertices than `G`:

```text
N(F,G) = [sum_v N(F,G-v)]/[n-|V(F)|], when |V(F)| < n.
```

That makes many invariants reconstructible. It does not show that any particular finite list of invariants determines the whole graph.

## Correspondence is infrastructure

An observation has limited meaning unless its carriers can be related. The kernel distinguishes:

- `EXACT_LABELED`
- `UNLABELED_UP_TO_ISOMORPHISM`
- `PARTIAL`
- `INFERRED`
- `ABSENT`
- `UNKNOWN`

Exact labeled correspondence requires a declared mapping or digest. Unlabeled and absent correspondence forbid one. Inference never silently upgrades itself to exact identity. Multiplicity and overlap maps are independent properties rather than assumptions hidden inside prose.

This distinction is why protein contact maps are not graph decks. A protein contact projection usually retains residue index and chain identity. A graph card intentionally erases vertex labels. Their common shape is only that a lossy observation may leave multiple candidate wholes.

Across a mutation, deletion, insertion, or condition change, even residue correspondence is only `PARTIAL`: a declared sequence alignment may retain some carrier identities while gaps, changed membership, ensemble weights, and every projected relation remain explicit. Cross-state alignment does not guarantee preserved contacts, geometry, landscape, or function.

## Contact projection is not folding

A declared binary contact representation can be written

```text
C^(tau,s)_ij(q) = 1[eligible(i,j) and ||r_i(q)-r_j(q)|| <= tau].
```

Here `r_i` is a declared representative-site position. The exclusion `s` applies within one chain; explicitly eligible interchain pairs are not rejected by a meaningless sequence-index difference. The representative-site selector, threshold `tau`, within-chain exclusion, interchain eligibility, chain identifiers, ensemble rule, temperature, solvent, pH, and other relevant conditions belong to the observation definition. Changing them changes the projection.

The projection discards exact distances, orientations, much chemistry, and often dynamics. Two coordinate ensembles can have the same binary contact graph. Conversely, a proposed contact graph can fail to lift to any stereochemically valid protein.

A physical residue deletion or mutation is not the mathematical operation (G-v). It may alter every remaining contact and the entire ensemble. The kernel therefore requires a new state identity after physical perturbation and does not guarantee that remaining relations are unchanged.

## Realization is a separate gate

For a complete exact candidate squared-distance matrix `S`, with `S_ij = ||x_i-x_j||^2`, classical Euclidean distance geometry constructs

```text
J = I - 11^T/n
B = -1/2 J S J.
```

An exact realization in `R^3` requires `S` to be complete, exact, symmetric, hollow, and nonnegative, and requires `B` to be positive semidefinite with rank at most three. Complete squared distances determine coordinates only up to `O(3)`, which includes reflection. Molecular equivalence normally uses proper rigid motions `SE(3)`; chirality and stereochemistry must therefore be imposed separately.

Binary contacts provide inequalities, not a complete exact distance matrix. Satisfying those inequalities is not sufficient for molecular validity: covalent geometry, excluded volume, chirality, observation completeness, and independent physical validation remain separate constraints.

## Folding is a conditional landscape

One equilibrium projection of a molecular ensemble is

```text
A(z|c) = -beta^-1 ln integral_Omega delta(z-xi(q)) exp[-beta U(q;c)] dq + C,
beta = 1/(k_B T).
```

The condition bundle `c` is part of the identity of the model. It can include sequence, temperature, pH, solvent, ribosome, chaperone, ligand, crowding, force field, and sampling protocol. A landscape under one condition is not silently reused after condition drift.

A projected equilibrium free-energy surface need not determine kinetics. Hidden slow coordinates, barriers, intermediates, memory, and inadequate sampling can all break that inference. The project-landscape entry in the kernel is explicitly an analogy: organizational or software costs are not thermodynamic free energies.

## Catalysis lowers a barrier under a comparator

Within a declared transition-state model,

```text
k approximately kappa(k_B T/h) exp[-Delta G^dagger/(R T)].
```

Under the same reaction, temperature, standard states, and comparable transmission assumptions,

```text
Delta G^dagger_saved
  = Delta G^dagger_reference - Delta G^dagger_catalyzed
  approximately R T ln(k_catalyzed/k_reference).
```

For a rapidly equilibrating conformational ensemble,

```text
k_obs = sum_c p(c) k_c.
```

The final expression does not apply automatically when conformational exchange is slow relative to reaction. Enzymes can use conformation, preorganization, electrostatics, dynamics, and chemical steps in system-specific combinations; contact topology alone predicts neither mechanism nor rate.

A catalyst accelerates forward and reverse access to the same equilibrium in an uncoupled closed reaction; faster rate is not evidence of a changed equilibrium constant.

The barrier-saving relation compares rate constants for the same declared elementary step in a shared transition-state-theory regime with comparable transmission coefficient and prefactor. An overall enzyme turnover `kcat` is not automatically that elementary-step rate when conformational change, product release, or another step is limiting.

The kernel's `physical_parameter_transfer` field means transfer into another domain, so it remains false even on the source-scoped physical-enzyme card. The project profile permits a `DESIGN_TRANSITION_ACCELERATOR` only as a non-physical design pattern. It needs a comparator, local obstacle definition, endpoint invariant, conditions, reversible path, metric, evidence, and falsifier. It is always `empirical:false`, `physical_parameter_transfer:false`, and `authority_effect:NONE`. It imports no enzyme coefficient and predicts no productivity, adoption, persuasion, or delivery time.

## A fixed-state feedback theorem

For one fixed state, adding consistent nonperturbing constraints can only narrow its fiber:

```text
F_(O1,O2)(y1,y2)
  = F_O1(y1) intersection F_O2(y2)
  subseteq F_O1(y1).
```

This monotonicity does not cross a mutation, deletion, changed environment, rewritten artifact, or effectful probe. Those create a new state. Feedback is append-only, challengeable, correctable, and superseding rather than silently mutating history. A new fixed-state observation may narrow a fiber; an accepted correction that removes bad evidence may widen it; a physical or authored-state change receives a new state identity. A challenge alone records no automatic effect. `REST`, `SILENCE`, `REFUSAL`, `NO_ACTION`, and `DEPARTURE` remain valid exits.

## KARMA boundary

The Zerone binding is constitutional context only. Within this kernel, KARMA is challengeable, contextual, non-summable, and not a person score, truth oracle, reward, rank, wallet balance, governance weight, scientific fact, or automatic action.

The kernel observes no Zerone event, creates no KINGDOM receipt, and defines no adapter between them. A citation or validated project profile does not mint either one.

## Epistemic registers never collapse

The record keeps eight registers separately typed:

1. mathematical definition
2. mathematical theorem
3. open mathematical conjecture
4. empirical science
5. scientific model
6. analogy
7. design constraint
8. philosophy

A definition introduces formal language but proves no existence, uniqueness, reconstructibility, or physical fact. A theorem can constrain a matching formal object but cannot establish a physical mechanism. An empirical result does not transfer its causal parameters to software. A model is not an observation. An analogy preserves only its named pattern. A design constraint is chosen architecture, not discovered natural law. Philosophy is opt-in and is not empirical evidence for or against a creator, purpose, or cosmic moral KARMA.

## Falsification before amplification

The executable negative cases matter as much as the happy path:

- downgrade a correspondence when labels or overlap maps are lost;
- represent physical mutation as a new state rather than static node deletion;
- reject contact restraints that are unrealizable or stereochemically invalid;
- distinguish `O(3)` mirror ambiguity from `SE(3)` molecular equivalence;
- create a new model after condition drift;
- refuse to infer equilibrium from rate alone;
- reject any analogy whose empirical, causal, ontological, parameter, or authority flags turn positive;
- reject any hidden execute, deploy, scoring, reward, governance, KARMA-write, or automatic-action authority;
- reject a fixed-state claim in which consistent nonperturbing evidence enlarges the candidate fiber.

## Reconstructive project profile

The generic project schema is a closed Draft 2020-12 profile with these top-level fields:

```text
$schema, protocol, project_id, version, title, kernel_binding,
state_spaces, states, objectives, correspondences, observations,
reconstruction_requirements, realizability_constraints, transitions,
transition_accelerators, invariants, uncertainty_policy, authority,
risks, feedback, tests, claims, sources, provenance, release,
boundaries, integrity
```

The kernel binding is exact and non-importing: URL, raw byte SHA-256, semantic digest, `PROFILE_OF`, `mutated:false`, and `authority_imported:false`. Empty `claims` and `sources` arrays are valid when the project has none; absence must not be filled with invented evidence.

`state_spaces` define kinds of possible state; `states` identify concrete versioned members. Every state declares its state-space identity, version, conditions, optional value digest, and optional predecessor. An observation refers to one state ID, not merely its state space. Observations are limited to `PROJECTION` or `MODEL_DELETE`; a physical perturbation is never serialized as observation. A `STATE_CHANGE` transition joins two distinct state IDs, and a physical perturbation must create a new successor state. Every reconstruction requirement names one concrete `target_state_id`; its selected observations must all be projections of that same state, never merely different versions in the same state space. Feedback events also refer to declared state IDs, and any observation evidence they cite must observe that same state, so correction cannot float free of the state it concerns.

An observation declares an output state space, and its correspondence must join the observed source state's state space to that output state space. Observations distinguish only a nonperturbing projection from mathematical deletion. Physical perturbation belongs exclusively to a `STATE_CHANGE` and a distinct successor state; a later projection may observe that successor. Reconstruction requirements always describe a `FIBER`, then state identifiability and one explicit fiber status. Realizability constraints can be satisfied, violated, or unknown. Transitions declare state identities and separate authority. Accelerators remain analogy-only. Feedback is append-only with no KARMA adapter or automatic effect. Release metadata cannot turn profile validation into deployment authority.

## Offline verification

```bash
bun bin/reconstructive-build.ts verify --json
bun bin/reconstructive-build.ts verify-project tests/fixtures/reconstructive-project.valid.json --json
bun test tests/reconstructive-build.test.ts tests/reconstructive-build-schema.test.ts
```

The loader rejects symlinks, oversized files, invalid UTF-8, duplicate JSON keys, malformed shapes, cross-source identity drift, boundary flips, and reviewed-digest substitution. `verify-project` recomputes the digest declared by each project profile; the reusable project schema constrains its form rather than pinning one fixture digest. JSON Schema closes the portable shape and pins the reviewed kernel binding; it cannot recompute a recursive digest or authenticate a cited source.

## Selected source horizon

- Graph reconstruction and its open status: `https://doi.org/10.1016/j.disc.2026.115058`
- Finite exhaustive graph checks: `https://arxiv.org/abs/2102.01942`
- Restricted triangle-free reconstruction results: `https://doi.org/10.1016/j.disc.2023.113753`
- Exact Euclidean distance-matrix characterization: `https://doi.org/10.1016/0024-3795(85)90187-9`
- Contact-map-driven folding paths and back-mapping limits: `https://doi.org/10.1021/acs.jctc.4c00878`
- Structure-based folding models: `https://doi.org/10.1038/s41467-023-41664-1`
- Ribosome-conditioned folding thermodynamics: `https://doi.org/10.1038/s41586-024-07784-4`
- Foundational activated-complex rate theory: `https://doi.org/10.1063/1.1749604`
- Transition-state theory limits for enzyme kinetics: `https://doi.org/10.1016/j.abb.2015.05.004`
- IUPAC chemical-kinetics terminology and catalyst boundary: `https://doi.org/10.1351/pac199668010149`
- Conformational ensembles in serine-protease catalysis: `https://doi.org/10.1126/science.ado5068`
- Active-site electric fields and a system-specific rate acceleration: `https://doi.org/10.1038/s41557-023-01287-x`
- Broad transition-state ensembles with review caveats: `https://doi.org/10.7554/eLife.93099.4`

These sources support their declared local claims and limits. They do not prove the unification layer itself as a law of nature, solve the graph conjecture, determine a protein fold, transfer biology into project management, authorize wet-lab work, or establish cosmic design.
