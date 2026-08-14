# Math Passport Usefulness Pilot

Observed 2026-08-14 · outcome: **REVISE**

The useful result is restraint: this pilot did not show that adding the Math
Passport improved either response. Baseline and treatment each scored 24/24.
The treatment response used 4,605 UTF-8 bytes versus 2,336 for baseline
(`1.97x`), and the scorer correctly guessed the arms with high confidence.
The card therefore remains explicitly invoked; it is not promoted, made
implicit, or treated as proof of understanding.

This is a descriptive four-scored-task-artifact pilot with one scorer, two
grouped provider-response artifacts, no exposed model snapshot or sampling
configuration, and a rubric ceiling. The preregistration's
`response_artifacts: 4` counts separately scored task answers; each provider
response grouped the two answers from one arm in a shared context. It is useful
for redesign, not a universal claim.

The record self-reports that preregistration preceded responses and scoring was
sealed before arm reveal. Because the raw provider responses and scorer
artifact were not retained, those chronology and scoring claims are not
independently reproducible from the published record.

## What the crystallization table actually says

A published piracetam table reports 80 first-classified vial outcomes at each
of six isopropanol conditions. Form III won zero times in each condition while
other polymorphs won all 80 times. Under independent Bernoulli trials with one
stable within-condition winner probability `p`, the exact one-sided 95% upper
bound is:

```text
p_upper = 1 - 0.05^(1/80) = 0.0367541978
```

The bounded claim is “Form III's first-classified winner probability is below
about 3.68% at this condition under the stated model.” It is not “Form III is
impossible,” “its microscopic nucleation rate is zero,” or “the mechanism is
known.” Pooling all 480 vials gives `0.622%` only after imposing a common
probability across different supersaturation conditions; the table does not
establish that homogeneity.

The observation ends at a classified winner. A transient Form III event might
occur and transform, dissolve, arrive late, lose the race, or evade the
classification rule. A separating observation records validated form-sensitive
trajectories beyond first classification and declares its sensitivity and
horizon. That is an empirical question, not a recipe.

The piracetam data are an analogy for asking sharper questions about the
historical ritonavir disappearing-polymorph case. No piracetam probability is
transferred to ritonavir, and no rate, solvent, temperature, seed, milling,
formulation, manufacturing, medical, or regulatory instruction follows.

Source: Rodrigues Horn et al.,
[Crystal Growth & Design (2022)](https://doi.org/10.1021/acs.cgd.1c01421),
[open article](https://pmc.ncbi.nlm.nih.gov/articles/PMC9073936/), and
[BioStudies record](https://www.ebi.ac.uk/biostudies/studies/S-EPMC9073936)
(CC BY 4.0). The fixture transcribes Table 1 rather than digitizing a plot.

## The uncued transfer

The same bound applies to 0 recovery-probe wins in 80 nominally independent
software runs:

```text
P(recovery returns first) < 0.0367541978  (one-sided 95%)
```

It does not bound eventual recovery completion because observation stops when
the health probe returns. Lifecycle events plus a shadow cohort observed past
the first return separate never-started, censored-after-health, completion by a
declared horizon, and timeout. The deletion decision is `REVISE` (or `STOP`
the deletion action), not “dead code proven.”

## A model allowed to lose

The pilot also pins a CC BY 4.0 raw workbook and extracts the preselected row
with the largest released replicate count: 14 detected induction times for one
EasyMax configuration. An exploratory shifted-exponential detected-first-arrival
fit gives:

```text
lag g                         13,600 s
post-lag scale beta            4,244.428571 s
effective detected hazard      0.000235602975 s^-1
empirical median              17,348 s
fitted median                 16,542.013697 s
refitted bootstrap KS D        0.3482904651
bootstrap p (200,000; seed)    0.0057449713
```

The simple memoryless model is poorly calibrated at the descriptive 0.05
threshold. That negative result is constructive: it blocks confident use of a
convenient model. It does not identify whether detection delay, reused-solution
history, nonstationarity, dependence, small sample size, or another mechanism
caused the mismatch. “Induction time” here is a detection endpoint, not direct
observation of the first microscopic nucleus.

Sources: Yerdelen et al., [dataset](https://doi.org/10.15129/5a7908ad-2cdf-492f-a3bf-d1e96c8d80d6)
and [primary paper](https://doi.org/10.1021/acs.cgd.2c00192) (CC BY 4.0).

Metadata erratum: the frozen preregistration fixture gives the paper's pages as
1252–1263. The correct *Crystal Growth & Design* 23(2) page range is 681–693.
The frozen bytes remain unchanged so the preregistration digest stays
auditable; this citation correction changes none of the extracted values or
calculations.

## How KINGDOM should use mathematics

Mathematics is most constructive when it sits inside a question loop:

```text
purpose -> observation rule -> estimand -> smallest adequate model
        -> calculation -> calibration/falsifier -> decision delta
        -> uncued transfer -> BUILD / PLAY / REVISE / STOP
```

Its valuable properties are:

- **explicit abstraction** — it says which features are represented and which
  are discarded;
- **conditional deduction** — conclusions follow from declared premises, not
  prestige;
- **invariance and reproducibility** — the same definitions and inputs support
  the same check;
- **compression and composition** — a small model can connect many domains;
- **counterexample power** — one contradiction or failed calibration can stop
  an inflated claim;
- **uncertainty accounting** — bounds make ignorance usable without turning it
  into certainty;
- **identifiability limits** — mathematics can prove that available observations
  cannot distinguish live explanations;
- **sensitivity** — changing assumptions exposes which conclusions are robust.

Mathematics does not choose the Kingdom's values, beneficiaries, acceptable
burdens, consent, or authority. It cannot repair a censored observation by
algebra, turn a model parameter into a material recipe, diagnose pride, or
prove that a solver understands. Those remain empirical, ethical, governance,
and collaborative questions.

Use challenges often only when they answer a named learning, decision,
safeguard, or voluntary-play question. Pre-register the decision that could
change; score artifacts rather than beings; include a separating observation
and stop rule; test transfer on a genuinely different domain; record time and
verbosity cost; and retire or revise a challenge that produces no decision
delta. A beautiful problem with no instrumental gain may still be `PLAY`—it
does not need a false productivity story.

## AgentTool and WAKE crossover

The run is wrapped in AgentTool's existing local
`agenttool-trial-receipt/0.1`. That receipt binds minimized digests and reports
the promotion check as failed; it does not publish raw responses or prove
remote effects, safety, consent, authorization, identity, or understanding.
No AgentTool SDK route was added because there is no hosted capability for an
SDK to call.

Continuity is a revalidated reference seam. Carry the result ID, plan digest,
card digest, source-fixture digests, and `REVISE` outcome. In a receiving
context, re-check the exact bytes, applicability, limitations, purpose,
authority, privacy, refusal, and burden. This publishes no WAKE state and
proves neither identity nor continuity.

## Reproduce locally

```sh
./kingdom math-usefulness overview --json
./kingdom math-usefulness verify-plan --json
./kingdom math-usefulness verify-result --json
./kingdom math-usefulness winner-bound 80 .95 --json
./kingdom math-usefulness reality-check --bootstrap 200000 --json
./kingdom math-usefulness aggregate --json
```

The CLI is network-free and write-free. Rendering a task does not dispatch a
provider, and verification does not promote a Skill or authorize action.
