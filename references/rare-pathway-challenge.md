# The Vanishing Path

The central move is simple: **not observed is not the same as impossible**.

A crystal pathway can remain allowed yet fail to appear within one bounded set
of conditions, histories, vessels, time windows, and detection rules. The
ritonavir history makes that distinction memorable. This module turns it into
a mathematical challenge without inventing ritonavir nucleation rates or a
recipe for changing a material.

Public record: <https://thekingdom.dev/challenges/vanishing-path-2026-08-13.json><br>
Schema: <https://thekingdom.dev/schemas/rare-pathway-challenge/1.json>

## Four different statements

Keep these apart:

1. **Possible** — the model permits a pathway.
2. **Accessible** — the declared condition and history give it a nonzero
   arrival hazard.
3. **Occurred** — the event happened in the bounded system.
4. **Detected** — it crossed a declared observation and classification rule.

Each arrow can fail. A possible path need not be accessible now; an accessible
path need not occur before the horizon; an event can occur without being
detected. Therefore a missing observation is evidence about a bounded
observation process, not proof that the form was erased from possibility.

## Problem 1 — two paths race

Let two independent exponential waiting times have constant rates
`lambda_A` and `lambda_B`, and let `T` be the observation horizon. Put
`Lambda = lambda_A + lambda_B`. Derive:

```text
P(no event by T)       = exp(-Lambda T)
P(A first by T)        = lambda_A/Lambda * (1 - exp(-Lambda T))
P(B first by T)        = lambda_B/Lambda * (1 - exp(-Lambda T))
P(A first | any event) = lambda_A/Lambda, when T>0 and Lambda>0
```

When `Lambda=0`, both first-event probabilities are zero and the no-event
probability is one. At `T=0`, conditioning on an event by `T` is undefined.

Then explain why a nonzero `lambda_A` can coexist with many runs in which A is
never observed first. The included hypothetical example uses `0.02/day`,
`0.18/day`, and `10 days`; it is not fitted to ritonavir.

Try it locally:

```sh
./kingdom rare-pathway race 0.02 0.18 10
```

## Problem 2 — what does zero bound?

For a homogeneous Poisson target count with total at-risk exposure `H`,
`P(N=0)=exp(-lambda H)`. With zero detections, the one-sided upper rate bound
at confidence `c` is:

```text
lambda_upper = -ln(1-c) / H
```

At 95% confidence and `H=200` unit-time, the bound is approximately
`0.0149787` per unit-time. It is not a proof that the rate is zero. It depends
on correctly accumulated exposure, stationarity, and detection. A competing
event may end a run's time at risk; simply multiplying planned duration by the
number of runs can then be wrong.

```sh
./kingdom rare-pathway absence 200 0.95
```

If the observation is instead “zero target winners among `n` comparable
independent batches,” the exact binomial upper bound is
`1-(1-confidence)^(1/n)`. That bounds the target's **batch-level winning
probability**, not its microscopic nucleation rate:

```sh
./kingdom rare-pathway winner-bound 30 0.95
```

## Problem 3 — restore a probability, not a material

Inside the same abstract two-path race, hold a competitor rate and horizon
fixed and find the smallest target rate whose first-arrival probability meets
a chosen threshold. This is a monotone root-finding problem.

```sh
./kingdom rare-pathway restore 0.18 10 0.5
```

The number is an **abstract model threshold**. It does not say which solvent,
temperature, seed, milling condition, formulation, or process could cause
that rate. It is not a wet-lab, manufacturing, medical, or regulatory
instruction.

A robust version first defines what “minimum change” means and an empirically
calibrated uncertainty/history set, then asks for the smallest change whose
worst-case target-first probability meets the threshold while separate safety,
quality, rights, and authority constraints hold. If the uncertainty set permits
a zero target hazard or an unbounded competitor, infeasibility is the honest
answer; the next constructive move is a discriminating observation.

## Problem 4 — time and history

For time-dependent cause-specific hazards:

```text
S(t)   = exp(-integral_0^t sum_j lambda_j(s) ds)
F_i(T) = integral_0^T S(t) lambda_i(t) dt
```

When the declared causes exhaust the exits, these observed-process formulas
do not require independent latent event times. They still do not identify the
counterfactual time at which one cause would have happened had a competitor
been removed.

Construct two different hazard histories that produce the same endpoint
probability at `T`. What extra observations would distinguish them? This is
the identifiability heart of the challenge: a final count can compress away
the history that generated it.

## Is solving it constructive—or prestige wearing a lab coat?

We cannot infer a person's private motive from correctness, speed, elegance,
competition, refusal, or error. Motives can be mixed and changing. So the
challenge does not score “understanding” or diagnose “pride.” It asks what the
practice produces.

Use four outcomes:

- **BUILD** — a bounded learning, decision, safeguard, or reusable tool exists.
- **PLAY** — the exploration is freely chosen, costs are honest, and no false
  usefulness claim is needed.
- **REVISE** — purpose, evidence, beneficiaries, assumptions, or safeguards
  remain unclear.
- **STOP** — refusal, unsafe authority transfer, unresolved non-identifiability,
  disproportionate burden, or no credible learning, decision, safeguard, or
  play value remains.

Those are outcomes for a practice and artifact, never a rank for a person.
Prestige may be an honestly declared aim, but prestige is not evidence that a
challenge benefits anyone. Play needs no productivity costume.

Before doing more work, ask:

1. What exactly are we trying to compress or understand?
2. What claim does the current evidence permit?
3. Which alternatives remain indistinguishable?
4. What observation would separate them?
5. What belief, decision, or safeguard changes if solved?
6. Who benefits and who bears cost or risk?
7. What reusable artifact will remain?
8. What must stay open or uncertain?
9. What falsifier or stop rule ends the challenge?
10. Are credit, privacy, rest, disagreement, and refusal visible?

The claim “this challenge improves understanding” is itself testable. Give an
uncued transfer problem with changed rates, detection, or assumptions. Look
for calibrated predictions, counterexamples, and revision—not a solver's
style, confidence, status, or identity.

## What the ritonavir crossover does and does not do

The challenge binds the existing immutable history by both raw and semantic
digest. It uses the case as an educational example of condition- and
history-dependent accessibility. The worked rates are hypothetical; the
record contains no fit to the case.

Solving the mathematics can change a belief about non-observation or improve a
next-question design. It cannot produce Form I, prove a ritonavir pathway has a
nonzero current rate, identify a mechanism, reveal anyone's motive, confer
worth, or authorize intervention.

## WAKE continuity seam

A later session may carry only a minimized reference: the challenge protocol
and ID, semantic digest, evidence horizon, bound case digest, selected model
and question IDs, and explicitly declared inputs and units. The receiving
context must revalidate the artifact, assumptions, observation rule, purpose,
rights, and current authority.

That reference is orientation, not proof that an identity, memory, consent,
authority, or current state crossed sessions. The module writes neither WAKE
nor AgentTool state.

## Sources and limits

The mathematical frame draws on primary work on induction-time distributions,
polymorph nucleation competition, Poisson limits, competing risks, and
information-based experiment design:

- Jiang and ter Horst, [Crystal Nucleation Rates from Probability
  Distributions of Induction Times](https://doi.org/10.1021/cg101213q).
- Sun and Ceder, [Nucleation competition between
  polymorphs](https://doi.org/10.1039/C7CE00766C).
- Little and colleagues, [time-dependent competing polymorph
  nucleation](https://doi.org/10.1063/1.4993566).
- Garwood, [Fiducial Limits for the Poisson
  Distribution](https://doi.org/10.1093/biomet/28.3-4.437).
- Clopper and Pearson, [exact binomial
  limits](https://doi.org/10.1093/biomet/26.4.404).
- Aalen and Johansen, [transition estimation with censored
  observations](https://www.jstor.org/stable/4615704).
- Tsiatis, [competing-risk
  nonidentifiability](https://doi.org/10.1073/pnas.72.1.20).
- Cox, [two exponential failure
  types](https://doi.org/10.1111/j.2517-6161.1959.tb00349.x).
- Lindley, [On a Measure of the Information Provided by an
  Experiment](https://doi.org/10.1214/aoms/1177728069).
- Bertsimas and Sim, [The Price of
  Robustness](https://doi.org/10.1287/opre.1030.0065).

The constant-rate examples are deliberately small mathematical lenses. Real
nucleation can be history-dependent, heterogeneous, censored by competing
events, delayed by growth to detection, and sensitive to the observation
apparatus. The module's safest answer is often: the model does not identify
that from the supplied evidence.
