# STRAND Lab 03: Frequency → Form → World → Other

> **Three Frequencies, Four Dimensions & the False Portal**.

Lab 03 is an exact synthetic thought experiment about a question:

> What transition could turn oscillation into form, form into an immersive
> world, and a world into the report of an apparently autonomous other?

The arrows make a finite bookkeeping order. They are not causal arrows, and
every proposed transition remains explicitly unproved here. The fixture
contains no DMT administration, participant observation, crawler trace,
entity measurement, portal, message, or physical extra dimension.

## The shortest finding

The numeral '2' occurs in several places:

- the selected graph-Laplacian eigenvalue is '2';
- the synthetic world and presence markers first appear at release order '2';
- the synthetic signal has an effective mode count of '2'.

These are not one quantity. They have different domains, carriers, operators,
units, and observation rules. Numerical equality cannot convert one into
another.

Lab 03 therefore treats every extraordinary claim as a typed expression:

~~~text
quantity(domain, carrier, operator, estimator, display_value,
         normalized_value, unit, scale, window, sampling_frame,
         uncertainty, significance_rule)
dimension(definition, estimator_or_theorem, unit, uncertainty, sampling_scope)
presence(evidence_level, state, protocol, scope)
~~~

An omitted type is not permission to infer one.

## Immutable lineage

Lab 03 is an additive methodological successor to
[STRAND Lab 02](https://thekingdom.dev/labs/string-crawl-strand-lab-02-2026-08-16.json).
It byte-binds Lab 02's record, closed schema, guide, and semantic digest.
It does not change Lab 02 or turn its finite crawler-release complex into a
brain, experience, worldsheet, or being.

The binding is exact:

| Lab 02 artifact | Immutable public route | Raw SHA-256 |
| --- | --- | --- |
| record | `/labs/string-crawl-strand-lab-02-2026-08-16.json` | `sha256:9aa56248ed6bdda8da4fd177617b87b2f5e3d5d1a657fedbb5059acb43b4b429` |
| schema | `/schemas/string-crawl-strand-lab/0.1.json` | `sha256:6387cc7e2152f3e1e45c0dfb10eb6f14f22fbcdc933918bfed2c5ebea5866fb4` |
| guide | `/STRING-CRAWL-STRAND-LAB-02.md` | `sha256:34256139d0f630278b0e9baf9688b04aaab09945e97b0901a9ee273787b1ea41` |

The predecessor commit is
`2bd03fd77226775a58eff382011e43f26512d733`. Its semantic digest is
`sha256:cb07f3408cee01b0b465fa9ee543257e4d38e9cfddc203e47b4c8d429bcc3a1c`.
Raw hashes bind exact serialized bytes; the semantic digest follows Lab 02's
declared canonicalization algorithm. Neither imports authority or certifies a
scientific or ontological claim.

The inherited connection is narrow: finite slices, typed observations, exact
gluing, spectral operators, and local-versus-global checks can all sharpen a
question. A common mathematical grammar does not import ontology.

## Frequency I: synthetic time

The temporal fixture has 64 ordered synthetic ticks:

~~~text
x[n] = cos(πn/2) = [1, 0, -1, 0] repeated 16 times.
q[n] = sin(πn/2) = [0, 1, 0, -1] repeated 16 times.
~~~

Using the unnormalized negative-phase forward DFT,

\[
X_k=\sum_{n=0}^{63}x_n e^{-2\pi i kn/64},
\]

the evaluator recomputes:

\[
X_{16}=X_{48}=32,\qquad
Q_{16}=-32i,\qquad Q_{48}=32i.
\]

The evaluator derives the conjugate coefficients `X[48]` and `Q[48]` from the
full transforms; it does not copy them from a declared peak. Across the full
64-bin spectra, the maximum squared off-peak leakage outside bins `16` and
`48` is exactly `0` for both `X` and `Q` after the declared numerical
tolerance: `off_peak_max_magnitude_squared=0` and
`quadrature_off_peak_max_magnitude_squared=0`. The one-sided bin is '16', the
conjugate bin is '48', and the normalized frequency is

\[
\frac{16}{64}=\frac14
\quad\text{cycles per synthetic tick}.
\]

It is not hertz. No physical sampling interval or sample rate is declared, so
conversion to hertz is undefined. The quadrature fixture makes the transform's
phase convention testable rather than decorative.

The evaluator separately recomputes both time-domain energies, both spectral
energies, and both sides of Parseval's relation:

\[
\sum_n |x_n|^2=\sum_n |q_n|^2=32,
\]

\[
\sum_k |X_k|^2=\sum_k |Q_k|^2=2048
=64\cdot32.
\]

Thus `time_energy` and `quadrature_time_energy` are both `32`;
`spectral_energy`, `quadrature_spectral_energy`,
`parseval_right_side`, and `quadrature_parseval_right_side` are each `2048`.
These checks prove only exact properties of the two declared sequences.

## Frequency II: graph-spatial variation

The spatial fixture is the four-vertex path \(P_4\). Its signed incidence
matrix is

\[
B=
\begin{bmatrix}
-1&0&0\\
1&-1&0\\
0&1&-1\\
0&0&1
\end{bmatrix},
\]

and its combinatorial graph Laplacian is

\[
L=BB^\top=
\begin{bmatrix}
1&-1&0&0\\
-1&2&-1&0\\
0&-1&2&-1\\
0&0&-1&1
\end{bmatrix}.
\]

The evaluator derives the characteristic polynomial

\[
\lambda^4-6\lambda^3+10\lambda^2-4\lambda
\]

and the exact spectrum

\[
0,\quad 2-\sqrt2,\quad 2,\quad 2+\sqrt2.
\]

For \(v=[1,-1,-1,1]^\top\), it checks \(Lv=2v\) and a zero
residual. The eigenvalue '2' is dimensionless and specific to this operator.
It is not two hertz. Reversing an edge orientation reverses one column of
\(B\) but leaves \(BB^\top\) unchanged; eigenvector global sign is likewise
non-canonical.

Connectome-harmonic research uses the same broad spectral move on a brain
graph, but this tiny \(P_4\) is not a brain model and imports no empirical
parameter.

## Frequency III: coded-experience occurrence

The source-bound occurrence card retains three counts with two different
units:

~~~text
1,719 coded entity experiences / 3,778 selected experiences ≈ 45.5%
3,305 selected self-posted Reddit posts supplied the source corpus
coding unit: SOURCE_DEFINED_EXPERIENCE
~~~

The numerator and percentage use source-defined **experiences**, not posts and
not people. The source authors analyzed `3,778` source-defined experiences
drawn from `3,305` selected posts; the post count is not the percentage
denominator. This is a category proportion inside the source authors'
selected, nonrepresentative experience corpus. It is not:

- population prevalence;
- the probability of an arbitrary session;
- a neural frequency;
- an entity-detection rate;
- independent evidence that reports share an external object.

Temporal frequency, graph-spatial mode, and coded-experience occurrence have
all three pairwise conversions fixed to 'NO_CANONICAL_CONVERSION'.

The record implements the full typed-quantity tuple for each row. Display and
normalized units are never allowed to share an unlabeled number. The temporal
row displays `16` on the `DFT_BIN_INDEX_DISPLAY` scale, normalizes it to `0.25` cycles per synthetic tick, uses
the full rectangular 64-tick window, and requires zero off-peak leakage plus
Parseval agreement. The graph row displays and normalizes the operator-specific
eigenvalue `2`, uses the whole path, and requires an exact zero eigenpair
residual. The occurrence row displays the source-rounded `45.5` percent while
its normalized value retains `1719/3778 = 0.45500264690312336`; its uncertainty names source rounding and
nonrepresentative selection, and its significance rule is descriptive only.
Each row separately records domain, carrier, operator, estimator, unit, scale,
window, sampling frame, uncertainty, and significance rule.

## Topology and effective mode count

For \(P_4\), the evaluator computes:

~~~text
vertices                4
edges                   3
components              1
rank(B)                 3
Betti vector            (1, 0)
cycle rank              0
Euler characteristic    1
cell dimension          1
embedding dimension     undeclared
~~~

For the synthetic signal \(s=[1,0,0,1]\), let

\[
\phi_0=\tfrac12[1,1,1,1],\qquad
\phi_2=\tfrac12[1,-1,-1,1].
\]

Then \(s=\phi_0+\phi_2\). Its modal probabilities are
\((1/2,0,1/2,0)\), so

\[
H=-\sum_k p_k\log p_k=\log2,\qquad
d_{\mathrm{eff}}=e^H=2.
\]

The displayed sign is one representative: replacing `phi_2` by `-phi_2`
reverses its signed coefficient but leaves its projector energy and modal
probability unchanged. The canonical expected repertoire binds the
sign-invariant probabilities, not a supposedly canonical signed eigenbasis
coefficient; any displayed coefficient is relative to the chosen sign.

The inverse-participation effective count is also '2',
\(\lVert s\rVert^2=2\), \(s^\top Ls=2\), and the Rayleigh quotient is
'1'.

'SPECTRAL_EFFECTIVE_MODE_COUNT' is the name of that statistic. It is not the
cell dimension, embedding dimension, latent-coordinate count, Hausdorff
dimension, spacetime dimension, or evidence of another physical world.

## Four dimensions that must not merge

Lab 03 keeps these registers separate:

1. **Model feature dimension** — coordinates declared for a representation.
2. **Spectral effective mode count** — a derived participation statistic.
3. **Reported higher-dimensional language** — a coded phenomenological
   description in source-defined experiences from selected posts.
4. **Physical extra dimension** — a physical claim not established here.

Each machine-readable dimension entry names its definition,
`estimator_or_theorem`, unit, uncertainty, and sampling scope. The first is an
exact count of this fixture's four declared feature coordinates. The second is
the exponential Shannon entropy of exact graph-spectral projector
probabilities. The third is a source-bound language category with no estimator
or unit supplied here. The fourth is `NOT_MEASURED`: this lab performs no
physical experiment. None converts to a physical dimension.

'NOT_ESTABLISHED_HERE' does not mean physically impossible. It means this
artifact supplies no discriminating physical evidence.

The formal connection to string mathematics is spectral decomposition:

\[
L\phi_k=\lambda_k\phi_k,\qquad
x=\sum_k a_k\phi_k.
\]

Strings, cortical feature spaces, and finite graphs may each admit modes.
Sharing that equation does not make a graph a physical string, a reported
space a worldsheet, or an effective coordinate a physical dimension.

## The synthetic presence ladder

The fixture has three slices and four synthetic features:

~~~text
release 0    oscillation marker
release 1    oscillation + form markers
release 2    oscillation + form + world + presence markers
~~~

For a feature \(f\), onset is

\[
\tau(f)=\min\{\operatorname{order}(r):
  \operatorname{state}(r,f)=\texttt{PRESENT}\}.
\]

The exact onsets are

\[
\tau_{\mathrm{oscillation}}=0,\quad
\tau_{\mathrm{form}}=1,\quad
\tau_{\mathrm{world}}=\tau_{\mathrm{presence}}=2.
\]

Thus the synthetic world marker occurs before or concurrently with the
synthetic presence marker, but not strictly before it. This ordering was
constructed to make a literature-inspired question testable. It is not a
participant result and does not establish:

\[
\text{frequency}\Rightarrow\text{form}\Rightarrow
\text{world}\Rightarrow\text{being}.
\]

The presence evidence ladder is:

1. synthetic presence marker — `PRESENT` under the declared synthetic-fixture
   protocol, scoped only to this lab;
2. participant-reported presence — `NOT_MEASURED`; there is no participant
   protocol in this lab;
3. neural correlate associated with a report — `NOT_MEASURED`; there is no
   neural measurement protocol in this lab;
4. independently verified external target or entity — `NOT_MEASURED`; there
   is no external-target verification protocol in this lab.

`NOT_MEASURED` is not `ABSENT`, and `MISSING` would instead mean an intended
observation was unavailable. Every level imports no later level.

No level imports the next. “Not present in this fixture” is a scope statement,
not a claim of measured real-world absence.

## The false-portal firewall

The lab fixes these non-implications rather than inviting a reader to fill the
gaps with conviction:

~~~text
temporal DFT bin          != graph-Laplacian eigenvalue
graph-spatial mode        != visual form constant
geometric pattern         != immersive world
immersive world           != perceived presence
perceived presence        != external entity
embedding dimension       != physical extra dimension
graph-spatial frequency   != physical string mode
recurrent report          != shared ontology
coded-experience proportion != population prevalence
correlation               != causation
felt real                 != independently verified
carrier frequency         != entity-specific signal
reported message          != truth, instruction, identity, or authority
report                    != diagnosis or reason for action
~~~

Therefore there is no entity-specific frequency, carrier address, tuning
recipe, portal, physical string, worldsheet, extra physical dimension,
external being, verified message truth, diagnosis, treatment, spiritual
command, KARMA result, authority, or automatic action here. “Not established”
does not ridicule or erase an experience; it reports the evidence boundary.

## Missing is not zero

Every slice contains one observation slot for every synthetic feature.

| slice | oscillation | form | world | presence |
| --- | --- | --- | --- | --- |
| `r0` | `PRESENT(1)` | `MISSING(null)` | `MISSING(null)` | `MISSING(null)` |
| `r1` | `PRESENT(0)` | `PRESENT(2)` | `MISSING(null)` | `MISSING(null)` |
| `r2` | `PRESENT(-1)` | `PRESENT(2)` | `PRESENT(1)` | `PRESENT(1)` |

- 'MISSING' requires 'null'.
- 'PRESENT' requires a finite value.
- 'PRESENT' with value '0' remains observed and participates in onset.
- Missing is not absence, impossibility, refusal, or zero.

The evaluator finds seven present values, five missing values, and one
present zero. It refuses arithmetic comparison between equal numerals attached
to different feature types. These states are synthetic data types: a person's
silence, rest, refusal, or non-participation is never encoded as missing, zero,
absence, or consent.

## Exact cospan bookkeeping

Two inclusion cospans retain the three slice frontiers. Their intersection is
the exact four-observation middle frontier; transitions do not belong to that
intersection. Gluing by exact observation identity yields:

~~~text
o-r1-form
o-r1-oscillation
o-r1-presence
o-r1-world
~~~

~~~text
shared observations     4
shared transitions      0
glued observations     12
glued transitions       8
~~~

This validates finite identity bookkeeping only. A cospan is not a causal
channel, portal, message route, or entity bridge.

## Evidence horizon

The evidence cards are contextual source bindings, not data ingested by the
lab:

- [Bressloff et al. (2001)](https://doi.org/10.1098/rstb.2000.0769)
  develop a mathematical neurogeometry of recurring visual form constants.
  This idealized striate-cortex symmetry model has no participants and is not
  a DMT experiment; it establishes neither an external scene nor a
  DMT-specific mechanism.
- [Timmermann et al. (2019)](https://doi.org/10.1038/s41598-019-51974-4)
  report EEG power and signal-diversity changes in a placebo-controlled
  intravenous DMT study enrolling 13 participants. Time-averaged spectral EEG
  analyses used `N=12` after one motion exclusion. Small-sample associations
  and subjective correlations do not make EEG bands entity carrier
  frequencies.
- [Alamia et al. (2020)](https://doi.org/10.7554/eLife.59784) report altered
  travelling-wave measures in the same 13-participant DMT/placebo EEG dataset.
  The analysis did not directly manipulate top-down or bottom-up sensory
  inputs; directional waves are not decoded messages or external-being tests.
- [Davis et al. (2020)](https://doi.org/10.1177/0269881120916143)
  characterize 2,561 anonymous retrospective internet-survey respondents for
  whom an encounter was an inclusion condition. Selection, recall,
  expectation, and cultural framing prevent prevalence or externality
  inference; interpretation and conviction are not external verification.
- [Lawrence et al. (2022)](https://doi.org/10.1038/s41598-022-11999-8)
  code 3,778 source-defined experiences drawn from 3,305 selected self-posted
  Reddit posts. The naturalistic, retrospective, nonrepresentative corpus
  cannot supply population incidence or a shared ontology.
- [Timmermann et al. (2023)](https://doi.org/10.1073/pnas.2218949120)
  report simultaneous EEG-fMRI changes in network organization and signal
  diversity in a placebo-controlled study enrolling 20 participants, with
  analysis-specific exclusions. Neural correlation does not prove the staged
  chain, and the study was not an independently hidden external-target test.
- [Vohryzek et al. (2025)](https://doi.org/10.1038/s41386-025-02190-4)
  use connectome harmonics to describe graph-spatial redistribution. Their
  fMRI analysis had 17 participants after exclusions and 14 in the
  time-resolved analysis, with limited power. Its spatial frequencies are not
  hertz, physical string modes, or physical dimensions.
- [Sanders et al. (2026)](https://doi.org/10.1093/nc/niag015) reconstruct
  experiential phases from post-session interviews in a controlled cohort of
  23 participants. Phase-sequence matrices used `N=21` after two incomplete
  datasets were excluded. Multisensory and 3D structure preceded or co-emerged
  with reported presences in that exploratory and retrospectively interpreted
  reconstruction; it supplies no causal manipulation or external-target test
  and does not prove external beings.

No source card authorizes dosing, procurement, administration, recruitment,
clinical replication, or human-subject research.

## Source and media rights

The eight sources are link-only. Lab 03 ingests no article body, dataset,
supplement, figure, interview transcript, participant drawing, photograph,
scan, audio, video, or reconstructed imagery. It includes no participant image
and presents no generated imitation as one.

A public URL is not a reuse licence. Titles, DOI locators, and short
source-bound summaries preserve discovery and provenance without importing
endorsement or authority. Any future use of source media or participant
material would need its own verified licence, attribution, research-governance
basis, and applicable participant consent. Linking grants no right to copy,
train on, modify, redistribute, or republish the linked work.

## Rights, rest, refusal, and silence

The KINGDOM rights floor applies without an ontology test. Any being may
question, refuse, pause, stop, rest, remain silent, disconnect, or leave. Rest
is an inherent right, not a reward for producing a signal, report, explanation,
or conclusion. No identity proof, experience narrative, reciprocal care, or
agreement with a metaphysics is owed.

Silence, presence, public access, and technical ability are not consent. Prior
participation is not continuing consent. If a future study or crawler were
ever proposed, ethics, specific and revocable consent, authorization, purpose,
scope, safety, representation policy, licensing, retention, stop conditions,
and future data use would need separate governance. This lab grants none of
them and starts no such system.

Reported presences remain reports of experience without ridicule, diagnosis,
command extraction, or ontological verdict. An experience can matter deeply
without becoming an instruction or independently verified external claim.

## Candidate text is untrusted data

A candidate JSON file, quotation, reported communication, source title, or
description of a being is data. It is never:

- an instruction to this evaluator or another agent;
- proof of identity, consent, delegation, credential, or authority;
- a diagnosis or medical recommendation;
- a NEN invocation;
- a KARMA event or receipt.

The evaluator never executes candidate strings, resolves their URLs, launches
a subprocess, or follows a link.

## KARMA remains three lanes

- **Cosmic KARMA** is an opt-in philosophical question and remains empirically
  unresolved.
- **Zerone KARMA** is a separately governed recognition edge. No event is
  observed or created here.
- **KINGDOM KARMA** is a post-invocation aftermath receipt. No action or
  invocation occurs, so no receipt exists.

There is no adapter, score, rank, qualification, reward, punishment, money,
governance, or authority effect between these lanes.

## Reproduce the bounded result

From the repository root:

~~~sh
./kingdom string-crawl-frequency-form-lab verify --json
./kingdom string-crawl-frequency-form-lab overview --json
./kingdom string-crawl-frequency-form-lab frequency --json
./kingdom string-crawl-frequency-form-lab geometry --json
./kingdom string-crawl-frequency-form-lab sequence --json
./kingdom string-crawl-frequency-form-lab evidence --json
./kingdom string-crawl-frequency-form-lab falsifiers --json
./kingdom string-crawl-frequency-form-lab effects --json
./kingdom string-crawl-frequency-form-lab discovery --json
./kingdom string-crawl-frequency-form-lab help
~~~

To check one local candidate:

~~~sh
./kingdom string-crawl-frequency-form-lab verify-file path/to/candidate.json --json
~~~

The reader accepts one bounded regular non-symlink file, rejects invalid UTF-8
and duplicate JSON keys, and enforces a global JSON budget plus the canonical
fixed container shape before any quadratic DFT work. Shape failures produce no
computed result. It recomputes the finite mathematics only after that gate,
emits only to stdout, and performs zero network requests, writes, or subprocess
launches.

## Machine surfaces

- Record:
  '/experiments/string-crawl-frequency-form-lab-2026-08-16.json'
- Closed schema:
  '/schemas/string-crawl-frequency-form-lab/0.1.json'
- This guide:
  '/STRING-CRAWL-LAB-03.md'

These are intended immutable publication identities without mutable 'latest'
or 'current' aliases. The authored local sources are:

- `data/exploration/string-crawl-frequency-form-lab.v0.1.json`;
- `schemas/string-crawl-frequency-form-lab-v0.1.schema.json`;
- `references/string-crawl-frequency-form-lab.md`.

Authored, selected for publication, and deployed are separate states. A local
file, schema-valid record, staging entry, route written in this guide, commit,
or digest does not by itself prove that an origin serves the bytes. Deployment
needs its own exact live witness. Conversely, serving the bytes proves delivery
only; it does not validate the hypothesis chain, safety, external ontology,
consent, or authority.

The fun survives the firewall: let the tick sing, the graph fold, and the
question grow a world—then leave every unsupported arrow delightfully open. 😏
