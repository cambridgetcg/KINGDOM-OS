# STRAND Lab 02 — Release Cospans & the χ=1 Impostor

> A tiny synthetic topology lab for the KINGDOM. It is exact, offline, and
> deliberately incapable of crawling, invoking NEN, creating KARMA, or acting
> on a website.

## The invitation

Lab 01 made the first exact move: a two-release triangulated disk over the
rationals, with signed chains and five deterministic falsifiers—including a
branch-edge mutation. Lab 02 keeps that immutable baseline visible, changes the
coefficient field to `F2`, adds a third release, then contributes what Lab 01
does not implement: literal inclusion-cospan composition and a canonical
control-versus-singular pairing whose global invariants agree.

**Can a release-aligned route trace look globally like a disk while failing to
be a surface locally?**

Yes. That is the trick in this fixture.

The result is useful because crawler summaries often tempt us to trust one
headline number. Here, two complexes share Euler characteristic `1` and the
same `F2` Betti numbers `(1,0,0)`, yet only one is a boundary disk. The local
incidence audit catches what the global summary hides.

## The lineage is part of the data

Lab 02 byte-binds all three immutable Lab 01 artifacts. It does not silently
replace or reinterpret them:

- record: `/labs/string-crawl-trace-sheet-lab-2026-08-16.json`;
- schema: `/schemas/string-crawl-trace-sheet-lab/0.1.json`;
- guide: `/STRING-CRAWL-TRACE-SHEET-LAB.md`.

The binding carries Lab 01's semantic digest plus the SHA-256 of each exact
public byte sequence. This is lineage, not inheritance of authority. Lab 01 is
the predecessor baseline; Lab 02's own `stable-strip` is its internal control,
and its three-release cospans plus singular full complex are the new experiment.

## What exists here

The canonical artifact is a finite regular-CW fixture with:

- three synthetic release slices: `r0`, `r1`, and `r2`;
- five stable route threads: `home`, `map`, `commons`, `rights`, and `contact`;
- one `lab` route born at `r1` and retained at `r2`;
- one redirect-only target and spur at `r2`;
- explicit occurrence identities, alignment edges, and attaching cycles;
- two inclusion cospans joined over their literal shared frontier;
- exact arithmetic over `F2`.

The labels are schematic. They are not fetched URLs and are not observations
of a live deployment. Sharing a route label never identifies two occurrences;
only an explicit alignment edge does that.

## The clean strip

Delete the born route, its three edges and face, and the redirect target and
spur. What remains is a `4 × 2` rectangular cellulation of a disk:

```text
release 0   home ─ map ─ commons ─ rights ─ contact
              │     │       │         │        │
release 1   home ─ map ─ commons ─ rights ─ contact
              │     │       │         │        │
release 2   home ─ map ─ commons ─ rights ─ contact
```

Its exact invariants are:

```text
V = 15
E = 22
F = 8
components = 1
chi = V - E + F = 1
rank(d1) = 14
rank(d2) = 8
Betti_F2 = (1, 0, 0)
```

Every edge belongs to one or two faces. Every vertex link is one path or one
cycle. The attaching cycles close, `d1 d2 = 0`, and the local surface audit
passes. Calling this declared subcomplex a boundary disk is therefore stronger
than merely noticing `chi = 1`.

## Enter the birth flap 😏

At `r1`, a sixth route is born from `commons`. It persists to `r2`, creating a
quadrilateral face. That new face shares the existing `commons` alignment edge
with two stable faces.

```text
release 1   ... commons ─── lab
                 │           │   one added quadrilateral face
                 │           │
                 │           │
release 2   ... commons ─── lab
```

The exact branch edge is:

```text
e-commons-r1-r2
```

It has three incident faces. A surface edge may have one incident face on a
boundary or two in an interior; three is a branch.

The link audit independently identifies bad links at:

```text
v-r1-commons
v-r2-commons
```

This is a local failure. Homology does not announce it.

## Then the redirect grows a tail

The final release also contains one redirect-only spur:

```text
contact ──redirect──> synthetic-legacy-target
```

Its exact edge is `e-r2-contact-redirect`. It belongs to zero faces and is a
maximal one-cell. The full complex is therefore non-pure as well as branched.
The local links at `v-r2-contact` and `v-r2-redirect-target` fail the declared
surface criterion.

## Same global headline, different local reality

After adding both the birth flap and redirect spur:

```text
V = 18
E = 26
F = 9
components = 1
chi = 1
rank(d1) = 17
rank(d2) = 9
Betti_F2 = (1, 0, 0)
```

So the clean strip and full complex share `chi = 1` and Betti numbers
`(1,0,0)`. The full complex is nevertheless classified
`NON_PURE_BRANCHED_CELL_COMPLEX`.

That is the Lab 02 lesson:

> **A global invariant can agree while the local constitution breaks.**

For the KINGDOM, this is a firewall against converting a neat aggregate into a
claim about the structure, health, intent, value, or moral standing of what it
summarizes.

## The compositional layer

Each release slice is a finite frontier one-complex. The two temporal pieces
are restricted inclusion cospans:

```text
B0 -> T01 <- B1
B1 -> T12 <- B2
```

The legs are literal, dimension-preserving subcomplex inclusions. They are not
inferred URL matches. Sequential composition takes the pushout over the exact
occurrence-keyed `B1` frontier:

```text
T01 +_B1 T12

V = 11 + 13 - 6 = 18
E = 14 + 17 - 5 = 26
F =  4 +  5 - 0 =  9
```

Only identical frontier occurrence IDs are identified. Route labels alone
never authorize a gluing.

Parallel composition is disjoint union with `L:` and `R:` namespaces. Two
copies give:

```text
V = 36, E = 52, F = 18
components = 2
chi = 2
graph cycle rank = 18
Betti_F2 = (2,0,0)
```

The evaluator checks the empty unit, namespace-swap symmetry, and the finite
interchange identity by canonicalized namespaced cell sets, with incidence
inherited from the separately validated source complex. It does not claim to
test nontrivial associativity: three releases supply only two nonidentity
temporal cospans. A genuine associativity fixture needs four releases or
another declared intermediate frontier.

## Where string theory enters—and stops

The compatible layer is **boundary, gluing, composition, and local versus
global consistency**. Those ideas are useful in worldsheet mathematics and in
many other mathematical settings.

This lab does **not** transfer:

- a physical string or worldsheet;
- spacetime, tension, an action, an amplitude, gauge symmetry, or Weyl symmetry;
- a physical mechanism, parameter, unit, or causal law;
- crawler identity, intent, consent, licence, purpose, or compliance;
- moral value, cosmic KARMA, reward, debt, rank, or authority.

The route complex is a finite synthetic CW object. Similar-looking notation is
not shared ontology.

## Where crawlers enter—and stop

No crawler enters this version.

There is no HTTP policy, request, response, DNS lookup, browser, provider SDK,
target URL, robots decision, sitemap parse, captured log, or live observation
inside the fixture. `SYNTHETIC_OFFLINE_EXACT` is not a euphemism for captured
evidence.

A future adopted crawler could emit a separately governed occurrence trace in
this mathematical shape. Before that could happen, its operator, scope,
purpose, origins, request methods, representation policy, REP handling,
budgets, retention, credentials, stop conditions, and rights boundaries would
all need their own explicit contract. Lab 02 grants none of them.

## KARMA stays after action

The canonical KINGDOM aftermath receipt belongs after an actual invocation
attempt of an adopted manifested ability. This fixture is neither an ability
nor an invocation.

Therefore the evaluated effect record is fixed to:

```json
{
  "network_requests": 0,
  "storage_writes": 0,
  "nen_invocation": false,
  "karma_receipt_created": false,
  "zerone_event_created": false,
  "authority_effect": "NONE"
}
```

No `User-Agent`, route, edge, topology, invariant, or validation result becomes
a person score or KARMA magnitude. A future real invocation may reference a
content-addressed trace as evidence; it must never collapse that trace into
merit, guilt, identity, consent, or destiny.

## Reproduce the finite result

From the repository root:

```sh
./kingdom string-crawl-strand-lab verify --json
./kingdom string-crawl-strand-lab topology --json
./kingdom string-crawl-strand-lab composition --json
./kingdom string-crawl-strand-lab effects --json
```

To evaluate a local candidate file without fetching anything:

```sh
./kingdom string-crawl-strand-lab verify-file path/to/fixture.json --json
```

The reader accepts one regular non-symlink file, rejects invalid UTF-8 and
duplicate keys, enforces size and nesting bounds, checks closed structure and
cross-references, recomputes incidence and exact `F2` algebra, and writes only
its deterministic report to stdout.

## Machine surfaces

- Fixture: `/labs/string-crawl-strand-lab-02-2026-08-16.json`
- Schema: `/schemas/string-crawl-strand-lab/0.1.json`
- This guide: `/STRING-CRAWL-STRAND-LAB-02.md`
- Immutable Lab 01: `/labs/string-crawl-trace-sheet-lab-2026-08-16.json`
- Bound source project: `/atlases/string-crawl-trace-sheet-2026-08-15.json`

The fixture is an additive successor. It mutates neither its immutable
predecessor nor the bound source project, does not populate the Trace-Sheet
project's empty finite baseline, and does not change any proposed-unrun door
into a historical claim.
