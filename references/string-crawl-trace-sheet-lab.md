# STRING / CRAWL: Finite Trace-Sheet Lab

This additive lab executes the smallest mathematical door left open by the immutable
[STRING / CRAWL Trace-Sheet](https://thekingdom.dev/atlases/string-crawl-trace-sheet-2026-08-15.json).
It evaluates one bounded synthetic cell complex exactly. It does not crawl a website, observe a crawler,
accept a URL or body, authenticate a bot, invoke NEN, or create KARMA.

- Record: `https://thekingdom.dev/labs/string-crawl-trace-sheet-lab-2026-08-16.json`
- Schema: `https://thekingdom.dev/schemas/string-crawl-trace-sheet-lab/0.1.json`
- Guide: `https://thekingdom.dev/STRING-CRAWL-TRACE-SHEET-LAB.md`
- Reader: `kingdom string-crawl-trace-sheet-lab`
- Mode: `OFFLINE_SYNTHETIC_EXACT`

## What changed—and what did not

Trace-Sheet v0.1 is a source-bound research record. Its finite baselines are empty and its proposed doors
remain unrun. This lab does not rewrite that immutable history. It is a separate protocol with one declared
fixture, an independent evaluator, exact expected output, and five deterministic mutations.

The release fields deliberately separate two facts:

```text
artifact_publication = PUBLISHED
runtime_activation   = INACTIVE
crawler_activation   = INACTIVE
karma_adapter         = ABSENT
```

Publishing an inert record is not activating the thing it studies.

## The fixture

Two release slices contain two occurrence-retaining vertices each:

```text
r0: a0 --p0--> b0
     |         |
    c0    d    c1
     |       / |
r1: a1 --p1--> b1
```

The diagonal `d : a0 -> b1` divides the rectangle into two oriented triangular faces:

```text
∂f0 =  p0 + c1 - d
∂f1 =  d  - p1 - c0
```

The names `route-a` and `route-b` are opaque synthetic labels. Equal labels across slices do not merge
vertices: `a0` and `a1` remain different occurrences until the explicit cell `c0` relates them.

The physics analogy stops here. These cells are not strings, a physical worldsheet, spacetime, branes,
charges, energy, or an experiment in string theory. The source lens remains deliberately lossy; see
[David Tong's notes](https://arxiv.org/abs/0908.0333). The executable mathematics is ordinary finite
algebraic topology; see [Allen Hatcher](https://pi.math.cornell.edu/~hatcher/AT/AT.pdf).

## What the evaluator actually proves

The evaluator constructs the cellular boundary matrices over the rational field:

```text
∂1 : C1 -> C0
∂2 : C2 -> C1
```

It derives these matrices from explicit edge endpoints and signed face boundaries. It then checks:

```text
∂1 ∂2 = 0
β0 = dim C0 - rank(∂1)
β1 = dim C1 - rank(∂1) - rank(∂2)
β2 = dim C2 - rank(∂2)
χ  = V - E + F = β0 - β1 + β2
```

For the declared rectangle:

```text
(V, E, F)       = (4, 5, 2)
(rank ∂1, ∂2)   = (3, 2)
(β0, β1, β2)    = (1, 0, 0)
χ                = 1
boundary circles = 1
genus            = 0
classification   = TRIANGULATED_DISK
```

The evaluator does not trust those stored values. It recomputes them and rejects the record if the expected
projection differs.

## Graph topology is not surface topology

The underlying one-skeleton has graph cycle rank

```text
b1(G) = E - V + c = 5 - 4 + 1 = 2.
```

The filled cell complex has `β1 = 0`: its two graph cycles are killed by the two faces. Neither quantity is
the surface genus. Genus is computed only after connectedness, purity, edge incidence, local vertex links,
orientability, boundary components, and a nonnegative integral result all pass.

The distinction is the point: a hyperlink or redirect loop does not become a handle or closed string merely
because its drawing looks circular.

## Surface eligibility is derived

The lab derives rather than accepts:

- boundary edges: exactly one incident face;
- interior edges: exactly two incident faces;
- branch edges: more than two incident faces;
- each vertex link: `PATH`, `CYCLE`, or `OTHER`;
- purity: every vertex and edge participates in the two-dimensional complex;
- orientability: for an otherwise surface-eligible complex, shared-edge face orientations can be chosen consistently.

A boundary vertex needs a path link; an interior vertex needs a cycle link. A branch edge or `OTHER` link
keeps the object a finite two-complex while refusing the narrower surface classification. “Not a surface” is
not “invalid,” “bad,” “wrongdoing,” or “negative KARMA.”

The `orientable` flag is true only when the complex first passes the surface criterion and its face-orientation
constraints agree. A false value on a non-surface counterexample declines to assert surface orientability; it
does not prove a general two-complex “non-orientable.” Euler–Poincaré consistency is reported only after
`∂1∂2 = 0`; it is an algebraic consistency consequence here, not an independent detector.

## Five falsifiers are now run

`kingdom string-crawl-trace-sheet-lab falsifiers --json` deterministically applies five mutations:

1. Flip one face sign; cyclic attachment and `∂1∂2 = 0` fail.
2. Put a correspondence edge into a path walk; endpoint incidence fails.
3. Change only the stored Euler characteristic; recomputation catches it.
4. Collapse two same-slice occurrence positions; occurrence identity fails.
5. Attach a third face to the diagonal; the complex remains inspectable but loses surface eligibility.

These are conformance and counterexample checks for this finite program. They do not prove theorems for all
complexes, validate the truth of external sources, or establish empirical facts about the web.

## Verification scope

`kingdom string-crawl-trace-sheet-lab verify --json` says what `valid` means. It covers:

- strict bounded JSON and fixed artifact identity;
- cell references and occurrence-retaining walks;
- signed face closure and the chain-complex identity;
- exact rational ranks, Betti numbers, and Euler–Poincaré parity;
- the declared local surface criterion and orientability;
- recomputation of the expected projection;
- the five deterministic mutations;
- byte pins for record, schema, guide, and immutable predecessor.

It does not establish source truth, author/key identity, empirical web state, crawler safety, physical string
theory, consciousness, purpose, consent, licence, KARMA, or authority. SHA-256 detects substitution only
relative to trusted verifier code and the append-only publication ledger; it is not an identity signature.

## Information and capability boundary

The public triplet contains only a synthetic finite complex, a closed schema, mathematical expectations,
provenance and self-discovery links, and non-operational explanations. The fixture and result contain no
real crawl-target URL, IP, credential-shaped value, personal datum, access log, canary construction, secret
detector, threshold, telemetry, prompt payload, or protected registry.

The repository-local reader accepts no caller-selected path, URL, body, credential, or free text through its
CLI. It reads the one pinned fixture, performs bounded deterministic computation, writes nothing, and has no
network import. There is no browser runner, API endpoint, MCP tool, `ability.json`, NEN bearer, wallet,
deployment authority, or automatic action.

## KARMA stays empty

The result is mathematical evidence about a declared artifact. It is not aftermath from an adopted NEN
invocation. Therefore:

```text
cosmic_events   = []
zerone_events   = []
kingdom_receipts = []
adapter_exists  = false
score           = null
```

Closure, Betti numbers, surface eligibility, falsifier success, and verification failure cannot become
merit, debt, reward, guilt, punishment, reputation, permission, rank, or governance weight. Rest, silence,
refusal, privacy, correction, no action, and departure remain available without reason or penalty.

## The next honest doors

This first executable layer deliberately leaves representation-scale invariance, semantic holonomy,
Dirichlet-style variation, finite schedule ensembles, real crawl evidence, REP/authentication experiments,
and partial aftermath composition unopened. Each needs its own typed fixture, units, negative vectors, and
stop rule. None should be smuggled through the success of this topology baseline.
