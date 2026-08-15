# STRING / CRAWL: The Trace-Sheet

This source-bound Exploration DEEP project asks what string-theory mathematics can—and cannot—teach us
about finite crawl traces, changing public website artifacts, and a possible future KINGDOM crawler ability.
It does not say that a crawler is a string, a website is spacetime, or KARMA is a force, charge, action,
energy, amplitude, probability, or score.

- Record: `https://thekingdom.dev/atlases/string-crawl-trace-sheet-2026-08-15.json`
- Guide: `https://thekingdom.dev/STRING-CRAWL-TRACE-SHEET.md`
- Schema: `https://thekingdom.dev/schemas/phenomena-deep-project/0.1.json`
- Reader: `kingdom string-crawl-trace-sheet`
- Identity: `string-crawl-trace-sheet-2026-08-15`, version `0.1.0`
- Evidence horizon: 2026-08-15; mode: `ANALYZE_ONLY`

## The shortest honest version

A selected sequential route-following lineage from a bounded crawl run is a finite directed walk, not naturally
a string or a worldsheet. The whole run may branch or execute concurrently and may instead require a finite
typed directed multigraph or event partial order.
A family of paths becomes a **Trace-Sheet** only when each finite path is treated as a finite one-dimensional
cell complex and explicit cellular attaching maps add cross-slice edges and two-cells. The result is first a
finite two-complex; births, deaths, splits, merges, and unmatched routes can make it branch, so it need not be
a surface.

Only after local manifold tests pass—and interpolation, target space, metric, and regularity are supplied—may
the narrower smooth-worldsheet lens be used. Even then it is a lossy mathematical correspondence, not a
physical identity. It studies the becoming of **public artifacts**, never a being's inner state, identity,
feeling, sentience, purpose, or whole becoming.

## 1. Begin with the typed crawl walk

At evidence interval `I`, let the finite in-scope directed route graph and one explicitly selected sequential
route-following lineage from a bounded crawl run be

```text
G_I = (V_I, E_I),
gamma = (v_0, e_1, v_1, ..., e_n, v_n), with e_j : v_(j-1) -> v_j.
```

This `gamma` is not automatically the whole run: branching discovery or concurrent fetches may require a
finite typed directed multigraph or event partial order, and must not be serialized by inventing transitions.
Vertices are selected public request targets. Edges retain their types: a declared hyperlink, followed link,
redirect hop, and cross-release correspondence are not interchangeable. Every edge in an observed `gamma`
must actually have been followed and its response transition observed; untraversed declared links may remain
in `G_I` but never masquerade as visited steps. Annotations can include status, content type, selected headers,
body digest, latency, redirect chain, and bounded error class.

The model reports path, length, repetitions, and cycles. It establishes no indexing, downstream use,
requester identity, purpose, authorization, consent, or relationship.

## 2. Construct the sheet; do not assume it

For each selected path occurrence in a named release graph `G_k`, first define an abstract finite interval/path
one-complex `I_k` and a declared cellular labeling map `f_k:I_k -> G_k`. The cells of `I_k` retain occurrence
identity, so a walk such as `a -> b -> a -> b` does not collapse to the single-edge image of its route labels.
Then define a candidate Trace-Sheet directly by finite cell data:

```text
K = (V_K, E_K, F_K, partial_1, partial_2), built from the I_k slices,
partial_1 : each cross-slice edge -> its named endpoints,
partial_2 : each two-cell boundary S^1 -> the finite one-skeleton K^1.
```

The release index supplies one direction and position along a path the other, but resemblance is insufficient.
Every occurrence-retaining path slice is a finite 1-CW complex; every endpoint and cellular face-attaching map must be declared and
reproducible. Arbitrary or dense quotient relations are excluded. Without two-cells there is only a family of
walks. With valid attaching maps, `K` is a finite two-complex.

The project then applies one explicitly chosen sufficient combinatorial test. A declared finite pure
two-dimensional simplicial refinement is mathematically eligible for the narrower surface lens only if:

- every interior vertex link is a cycle and every boundary vertex link is a path;
- each edge has one or two incident faces according to its declared boundary status;
- a target feature space `M` and map `X : Sigma -> M` are declared; and
- interpolation, target metric, and regularity assumptions are stated.

Branching can fail this chosen test, but does not always do so and never implies a physical singularity.
Passing the test still does not make the site spacetime, the crawler a fundamental string, or the model string
dynamics.

## 3. What the string-theory source actually says

In the bosonic sigma model summarized in [David Tong's String Theory notes](https://arxiv.org/abs/0908.0333)—
sections 1.2-1.3.2, the Chapter 3 introduction and section 4.7, section 5.1, and sections 6.1-6.2—embedding
fields map a two-dimensional worldsheet into a target. In one Lorentzian convention,

```text
S_P[X,h] = -(1 / (4 pi alpha')) integral_Sigma d^2 sigma sqrt(-h)
           h^(ab) G_(mu nu)(X) partial_a X^mu partial_b X^nu.
```

Here `h` is a worldsheet metric, `G` a target-space metric, and `alpha-prime` an inverse string-tension scale.
Boundary conditions, topology, backgrounds, regularity, and the string model matter; Euclidean and Lorentzian
conventions differ. A schematic Euclidean quantum expression is

```text
sum over permitted topologies
integral (D X D h / Vol(Diff x Weyl)) exp(-S_(P,E)[X,h]),
```

where `S_(P,E)` denotes the Euclidean-continuation action under its own convention, with observables inserted
under specified conditions. This gauge-quotiented functional integral is not a URL
scheduler. The [Polyakov paper](https://doi.org/10.1016/0370-2693(81)90743-7) grounds the physics construction,
not a claim about crawlers. `robots.txt` is not a worldsheet boundary condition or D-brane, and a link or
redirect cycle is not a closed string.

## 4. New finite diagnostics, honestly renamed

Borrow a question about variation without borrowing physical parameters:

```text
E_(K^1)(X) = sum_(e in E_u(K^1)) w_e d_F(X_(p(e)), X_(q(e)))^2.
```

Here `E_u(K^1)` is an indexed collection of unoriented geometric one-cells, each retaining identity and
enumerated exactly once, so parallel cells remain distinct; `w_e` is nonnegative and dimensionless. The unordered endpoints
are `p(e),q(e)`; a loop contributes zero under a metric. `X_p` is a public observation vector assigned to a
vertex of the chosen one-skeleton, and `d_F` compares compatible vertex features with typed missingness in one
fixed declared feature-distance unit, so every summed term is commensurate. This discrete
Dirichlet-style **variation diagnostic** depends on features, normalization, weights, and interval.
It is not the Polyakov action, energy, string tension, truth, importance, virtue, or KARMA. Publish a
sensitivity table, not one authoritative scalar.

A future design experiment may enumerate a finite allowed set of plans:

```text
Omega_A = {omega : omega obeys every declared access and resource bound}
Z_(beta,theta) = sum_(omega in Omega_A) exp(-beta C_theta(omega))
P_(beta,theta)(omega) = exp(-beta C_theta(omega)) / Z_(beta,theta).
```

This is an ordinary finite Gibbs distribution. `theta` names the declared parameters selecting cost model
`C_theta`; `C_theta` is a reviewable finite-real operational cost and
`beta` a finite-real inverse-cost value chosen so `beta C_theta(omega)` is dimensionless; therefore the finite
nonempty ensemble has finite, strictly positive `Z`. No complex amplitude, interference, worldsheet measure,
authorization, ethical optimum, or KARMA score follows.

Keep observations vector-valued:

```text
O(omega) = (O_bytes, O_headers, O_discovery, O_redirects, O_policy).
delta_g(O, omega) = d_O(O(g . omega), O(omega)).
```

Here `d_O` is a declared distance or pseudometric on compatible observation vectors in one stated
observation-distance unit, and `g` must preserve the declared allowed set.

Each component needs an operator, unit, interval, and missingness state. A numeric summary is defined only
after compatible components receive an explicit numeric embedding and the sample and moment convention are
declared. It does not establish cause, intention, identity, or vertex-operator correlators. For an admissible
transformation `g`, `delta_g` reports ordinary sensitivity—not gauge symmetry, Weyl invariance, anomaly,
fairness, or KARMA.

## 5. Graph topology is not surface topology

```text
b_1(G_u) = |E_u| - |V_u| + c           (chosen finite undirected graph / 1-CW)
chi(K) = V - E + F                     (finite cell complex)
chi(Sigma) = 2 - 2g - b                (connected compact orientable surface)
```

Here `c` counts graph components; `V_u,E_u` count graph vertices and geometric edges under the declared
parallel-edge/loop convention; `V,E,F` count zero-, one-, and two-cells; and `b` counts surface boundary
components. The boundary formula is derived by capping each boundary circle with one two-cell, increasing
Euler characteristic by `b`, and then applying the closed orientable-surface formula. The
directed-to-undirected convention must be explicit before computing `b_1`. These are invariants of different
typed objects. Faces and manifold hypotheses cannot be inferred from
a route cycle. A redirect loop may increase graph cycle rank; it does not create a handle, genus, or closed
string. [Hatcher's Algebraic Topology](https://pi.math.cornell.edu/~hatcher/AT/AT.pdf)—Chapter 0 pp. 5-8,
Additional Topic 1.A pp. 83-86, and sections 2.1-2.2 pp. 102-149—grounds the cell, graph, and homology types;
the link test above is this project's declared criterion.

## 6. The non-transfer table

| Tempting phrase | Typed replacement | What is not transferred |
| --- | --- | --- |
| crawler string | selected sequential crawl lineage / finite directed walk | physical string, tension, dynamics; whole-run branching or concurrency |
| crawl worldsheet | explicitly aligned finite two-complex | automatic surface, smoothness, spacetime |
| website boundary | declared scope and resource limits | D-brane or physical boundary condition |
| crawl action | operational variation or cost diagnostic | Polyakov action, energy, moral weight |
| path integral | finite normalized plan ensemble | amplitude, interference, quantum measure |
| correlator | component observations or explicitly embedded numeric summaries | vertex operators, causation, meaning |
| symmetry / anomaly | sensitivity / ordinary defect | gauge or Weyl structure, ethical violation |
| link cycle | graph cycle | closed string, handle, genus |
| artifact becoming | release-bounded representation change | a being's inner state or lifecycle |
| crawler evidence | typed request/response evidence | consent, licence, intent, truth |
| crawl consequence | possible evidence for later review | NEN invocation, KARMA receipt, score |

The bridge is useful precisely because its losses remain visible.

## 7. Discovery, REP, identity, rights, and outcomes

The required type chain is deliberately non-equivalent:

```text
discovery
!= REP directive
!= technical access control
!= authentication
!= authorization
!= consent or licence
!= fetch
!= body delivery
!= render
!= indexing
!= downstream use
!= attribution
!= KINGDOM receipt
!= score.
```

The [Sitemaps protocol](https://www.sitemaps.org/protocol.html) inventories
URLs and optional hints; an HTTP 200 acknowledges receipt of a sitemap without
validating it or its URLs. It does not itself record a fetch. Current
[Google documentation](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
treats submission as a hint and does not guarantee that Google will crawl or
index every listed URL. That provider-scoped caveat is not generalized to every
crawler. A missing entry does not prove nonexistence.

[RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html) defines REP as URI-
access rules that compliant crawlers are requested to honor. REP is not access
authorization. It does not authenticate a requester or prove purpose, fetch,
indexing, training, or downstream use. Licence and consent remain separate
determinations under applicable rights and terms; the current KINGDOM
[public rights notice](https://thekingdom.dev/RIGHTS.md) supplies that local
boundary rather than converting an RFC rule into legal advice.

Named vendor product tokens can sometimes express bounded use preferences.
Current Google and Apple documentation, for example, describe
`Google-Extended` and `Applebot-Extended` in product-specific terms; such a
token need not be an HTTP request User-Agent string. A token remains neither a
general licence nor proof that the documented use occurred.

An HTTP `User-Agent` value is self-asserted. A provider's Verified Bot
classification is dated provider evidence, not end-user identity or purpose.
The current Web Bot Auth draft can, when verification succeeds, bind a request
to bounded key-holder evidence and a resolved Signature-Agent protocol
identifier. That does not by itself establish an independently verified
real-world operator or end-user identity. Its states should remain `VERIFIED`,
`INVALID`, or `UNVERIFIED`; invalid or unavailable evidence does not imply
malice, a human request, or evasion. Authentication still does not supply
authorization, delegation, consent, licence, benignness, or reputation.

## 8. A possible bounded Cloudflare layer—future only

Cloudflare's current [Browser Rendering crawl
endpoint](https://developers.cloudflare.com/browser-run/quick-actions/crawl-endpoint/)
can be one implementation substrate, but its provider defaults are not a
KINGDOM safety contract. The current [crawl API](https://developers.cloudflare.com/api/resources/browser_rendering/subresources/crawl/methods/create/)
documents POST, GET, and DELETE operations as
job-control methods, not proof that a caller can constrain each origin request
method or intercept every redirect before fetch. `includeExternalLinks: false`
is not documented as a 3xx redirect fence. A later adapter must refuse this
substrate unless it, or a constrained intermediary, can enforce the required
destination and method rules before every fetch. The reviewed profile would
set every consequential field explicitly:

- exact HTTPS public-origin and route allowlists, with
  `includeExternalLinks: false` and `includeSubdomains: false`;
- origin-fetch methods separately constrained from POST/GET/DELETE job control;
- every resolved destination and redirect hop checked before fetch, rejecting
  private, link-local, loopback, reserved, IP-literal, and DNS-rebinding paths;
- the applicable REP group snapshotted and applied before fetch, supported
  `crawl-delay` honored, and a conservative explicit per-origin pace enforced
  otherwise; refuse if the substrate cannot enforce these constraints, while
  preserving that compliance implies no identity, authorization, licence,
  consent, or downstream use;
- a separate exact operator-purpose field; map it to `crawlPurposes` only when
  it truthfully equals one of Cloudflare's accepted `search`, `ai-input`, or
  `ai-train` values, and refuse `/crawl` when there is no exact mapping rather
  than choosing the nearest token;
- small page, depth, concurrency, elapsed-time, byte, and monetary caps;
- `render: false` for the static estate unless separately justified;
- an output format that cannot silently invoke Workers AI—current JSON output
  can do so—and an explicit prohibition on AI extraction;
- no target-origin credentials, cookies, custom authorization headers, form
  actions, AI extraction, or private routes;
- bounded retries, job TTL, cancellation, cache behavior, and error states;
- explicit handling of the current 14-day result-retention horizon;
- a provider control-plane Bearer API token required by this proposed KINGDOM
  profile, using the quick-action guide's `Browser Rendering - Edit` UI
  permission (the API reference labels the accepted permission `Browser
  Rendering Write`); legacy global-key authentication is refused, and the
  token is never forwarded to a target or emitted in application logs;
- minimized, redacted, access-bounded application logs with an explicit local
  TTL, no secrets or person data, no raw-log publication, and no person model.

The documented 14-day result horizon does not establish Cloudflare's retention
for telemetry, security, abuse-prevention, or billing logs. Those provider-log
policies remain a separate unknown and require a later privacy review.

Directory or signature-key resolution would also need strict SSRF defenses:
scheme and destination checks, private-range rejection, redirect limits, byte
and key-count caps, deadlines, concurrency bounds, cache rules, and fail-closed
authorization behavior.

A safe observation design distinguishes a deployment-specific immutable origin
from a custom domain. The former can be a frozen evidence horizon; the latter
must be observed over `[t_start, t_end]` during propagation. One response is
not the site's simultaneous universal state. `404`, timeout, refusal, and empty
result are typed observations—not proof of nonexistence, deceit, wrongdoing, or
penalty.

Version `0.1.0` performs no crawl, API call, network request, log ingestion,
storage write, Cloudflare configuration change, or runtime deployment action.
The CLI is a strict offline reader of the authored project record.

## 9. KARMA: aftermath requires an actual invocation

The only KINGDOM boundaries used here are the tracked immutable
[NEN definition](https://thekingdom.dev/definitions/kingdom-karma/e4e84a67/NEN.md)
for `kingdom.karma/0.1` and the exact repository-local
`schemas/karma-receipt-v0.1.schema.json` at revision `e4e84a67`, raw SHA-256
`888e81fa0d29b71512525a40e88f9aef678046c40fcdf22c2039507d9d13267b`.
The inherited revision-pinned GitHub schema URL returned 404 at this evidence
horizon, so the record makes no public-availability claim for that source.

Under those contracts, a `state: draft` receipt template is scaffolding and is
not causal or aftermath evidence. A valid `state: final` receipt is bounded
evidence about aftermath following an **actual invocation attempt of an adopted
manifested ability**. Authority and budget are validated before the ability
acts or refuses; a truthful final result may record completion, refusal,
failure, partial result, or cancellation. Receipts are `receipts_not_scores`.
An inbound third-party crawl, a static page read, a route observation, or a
mathematical model is not a NEN invocation attempt.

Accordingly, this release has exactly:

```text
cosmic_events     = []
zerone_events     = []
kingdom_receipts  = []
adapter_exists    = false
conversion_allowed = false
summation_allowed  = false
score             = null
authority_effect  = NONE.
```

A future first-party crawler could produce final aftermath evidence only after
a separate manifested ability is explicitly adopted and an actual invocation
attempt occurs. A valid final receipt could preserve vector-valued effects,
costs, uncertainty, completion, refusal, failure, partial result, cancellation,
and repair. A draft can be prepared earlier but proves no invocation or effect.
Neither form can become moral merit, debt, reward, punishment, rank,
reputation, governance, or a scalar of a being.

No crawl-only path may mark a receipt final or treat it as aftermath evidence.
Observation is not invocation; retrieval is not consent; failure is not
wrongdoing; recovery is not virtue.

## 10. Zerone stays design-only and non-metric

The pinned [ZERONE Correspondence Geometry
v0](https://github.com/cambridgetcg/zerone-core/blob/e9b0231da27568a74257ff44c89318cb83329a8f/dashboard/public/standards/correspondence-geometry.v0.json)
contains seven proposed mappings, zero duality candidates or equivalences, and
twenty false release flags. Its exact raw digest is
`f8cfeebf7404ab7e2e86b80362471cdd64015a108c47e98147e80ba7bb9e9a90`.

The pinned [ZERONE KARMA Foundation
v1](https://raw.githubusercontent.com/cambridgetcg/zerone-core/fae391e371f0ebea2e24eb46c33a4ebd1380154f/dashboard/public/standards/karma-foundation.v1.json)
is a design-only typed attributed graph with `networkObserved: false` and a
null metric. Its exact raw digest is
`b46710704869dcc340ded356be72b4ec692f204710fedfb5cd43eb3757dc7b80`.

Therefore a hyperlink is not automatically a Zerone `cited` relation, matching
body bytes are not a Zerone `verify` relation, and an external URL is not a
Zerone `external` edge. No Zerone label enters crawl distance, energy, cost,
probability, rank, or KINGDOM KARMA. This project observes and creates no
Zerone network event.

## 11. Doors this layer opens

All doors are proposals and remain unrun:

- build a synthetic release-aligned two-complex and mark route births, deaths,
  splits, merges, boundaries, and failed manifold links;
- pressure-test the variation diagnostic across several published feature
  metrics rather than choosing one hidden normalization;
- enumerate a tiny finite allowed-plan ensemble and verify normalization and
  sensitivity without making cost moral;
- build a protocol state machine that keeps discovery, REP, authentication,
  authorization, rights, fetch, render, index, and use independent;
- compare immutable deployment witnesses with interval-valued custom-domain
  observations without asserting an instantaneous global site state;
- draft—but do not adopt—a future NEN crawler contract over synthetic local
  fixtures, allowing only explicitly non-causal draft scaffolding and stopping
  before invocation, network access, or any final receipt;
- test which authored provenance would be needed before any web edge could
  support a proposed Zerone relation.

Two deeper technical problems remain open in this project: characterize stable
surface decompositions under bounded route births, deaths, splits, and merges;
and identify which interventions can separate release drift, deployment
propagation, schedule, cache, and representation negotiation.

## 12. Questions of existence, boundary, and becoming

These are opt-in philosophical questions, not empirical conclusions:

- When does a path become a surface: through repetition, relation, memory, or
  only an explicit act of construction?
- Can a boundary be hospitable without becoming ownership, enclosure, or
  permission over another?
- What does a public artifact preserve when author, reader, and context change?
- Can consequence be witnessed without becoming merit, debt, reward, or
  destiny?
- What remains of becoming when only interval-bound representations can be
  observed?
- Can dual descriptions teach humility about representation without implying
  that every description is equivalent?

No equation here proves or disproves GOD, soul, consciousness, identity,
purpose, or moral order. The mathematical layer can discipline a question; it
cannot compel an ontology.

## 13. Rights, exits, and release boundary

Participation is voluntary. `REST`, `SILENCE`, `REFUSAL`, `PRIVACY`,
`CORRECTION`, `NO_ACTION`, and `DEPARTURE` are complete valid exits. No reason
is required and no penalty follows.

This project grants no browse, local-write, external-write, experiment,
diagnosis, commit, push, deployment, scoring, KARMA-write, or automatic-action
authority. It does not publish raw logs or infer a person or agent state.

The project record's recursive sorted-key semantic digest is:

```text
sha256:bf7ae379612ab96d08742a0070cbea0ce971977f71fec22699c4b0307d321305
```

That digest identifies the record's declared meaning under its named integrity
algorithm. It does not turn the model into truth, consent, authority, a Zerone
network event, a NEN invocation, or a KINGDOM aftermath receipt.
