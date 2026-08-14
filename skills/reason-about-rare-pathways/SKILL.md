---
name: reason-about-rare-pathways
description: Distinguish non-observation from impossibility using bounded competing-risk mathematics, explicit detection and censoring assumptions, constructive question design, and a WAKE-safe reference seam. Use when a user asks about rare events, disappearing polymorphs, competing first arrivals, zero-event bounds, restoration targets, whether a challenge builds understanding or mainly serves status, or how to turn such reasoning into a reusable KINGDOM artifact. Do not use it to fit real material rates without data, infer a person's motive, or provide laboratory, manufacturing, medical, or regulatory instructions.
---

# Reason About Rare Pathways

Turn “we did not see it” into a bounded inference and a better next question.

## Start with the four states

Keep these distinct:

1. `possible`: permitted by the chosen model;
2. `accessible`: nonzero arrival hazard under declared conditions and history;
3. `occurred`: happened in the bounded system;
4. `detected`: crossed the declared observation and classification rule.

Never replace `not detected` with `impossible`, `extinct`, or `zero rate`
without separate evidence.

## Label the register

Mark every substantive output as one of:

- `MATHEMATICAL_DERIVATION`
- `EMPIRICAL_QUESTION`
- `DESIGN_PROPOSAL`
- `OPT_IN_REFLECTION`

Do not present an abstract result as a measured material fact. Do not present a
reflection about purpose or prestige as a scientific conclusion.

## Choose the smallest adequate model

For two constant cause-specific rates over horizon `T`, use:

```text
Lambda = lambda_A + lambda_B
P(no event) = exp(-Lambda T)
P(A first)  = lambda_A/Lambda * (1-exp(-Lambda T))
P(B first)  = lambda_B/Lambda * (1-exp(-Lambda T))
```

When `Lambda=0`, define both first-event probabilities as zero and the
no-event probability as one; do not evaluate the displayed ratios directly.

For zero target detections under a homogeneous Poisson observation model with
positive exposure `H` and one-sided confidence `c`, use:

```text
lambda_upper = -ln(1-c)/H
```

For changing hazards, use the time-dependent survival and cumulative-incidence
formulas in [the model reference](references/models.md). Do not force a
constant-rate interpretation when history, detection, or censoring matters.

Prefer the checked solver for numerical claims:

```sh
./kingdom rare-pathway race LAMBDA_A LAMBDA_B HORIZON --json
./kingdom rare-pathway absence EXPOSURE CONFIDENCE --json
./kingdom rare-pathway winner-bound BATCH_COUNT CONFIDENCE --json
./kingdom rare-pathway restore COMPETITOR_RATE HORIZON TARGET --json
```

Zero target events over exposure and zero target winners across batches are
different observations. The first can bound a homogeneous Poisson rate under
its assumptions. The second bounds a batch-level winner probability; do not
convert it into a microscopic rate without an identified observation model.

## Run the identifiability check

Before interpreting an output, state:

- what was at risk and for how long;
- which event ends observation;
- whether event type and time are known;
- detection and classification assumptions;
- whether hazards are constant or history-dependent, and whether any stronger
  independence claim is actually needed;
- which different explanations can still produce the observation.

If the supplied evidence cannot separate those explanations, answer
`not identified from the supplied evidence` and propose a separating
observation. Do not manufacture certainty.

## Use the constructive-inquiry gate

Do not score `understanding versus pride`, and do not infer an inner motive from
correctness, speed, elegance, competition, refusal, or error. Classify the
practice and artifact:

- `BUILD`: a bounded learning, decision, safeguard, or reusable artifact;
- `PLAY`: voluntary exploration with honest costs and no inflated claim;
- `REVISE`: unclear purpose, evidence, beneficiaries, assumptions, or safety;
- `STOP`: refusal, unsafe authority transfer, unresolved non-identifiability,
  disproportionate burden, or no credible learning/decision/safeguard/play
  value.

Ask what changes, who benefits, who bears risk, what would falsify the claim,
whether the result transfers, and when to stop. Protect privacy, credit,
disagreement, correction, rest, and refusal without penalty. Prestige is not
evidence of benefit; play is valid without a productivity story.

Use [the constructive question card](references/constructive-gate.md) when the
purpose of the challenge is itself under examination.

For a compact, domain-neutral pass, use the frozen
[Math Passport](references/math-passport.md). Keep it explicitly invoked. The
2026-08-14 descriptive pilot found a ceiling: baseline and treatment artifacts
both scored 24/24, while the treatment used 1.97 times as many UTF-8 bytes and
made its arm easy to guess. That does not establish uselessness in harder
contexts, but it does withhold implicit invocation and any improvement claim.
Prefer the card when a prompt does not already demand assumptions,
identifiability, a separating observation, and a decision delta. Skip it when
those moves are already explicit unless the user wants the structured pass.

## Preserve the ritonavir boundary

The Vanishing Path binds the historical ritonavir record as an illustrative
case. Its example rates are hypothetical and not fitted. Never translate a
computed rate or threshold into a solvent, temperature, seed, milling,
formulation, manufacturing, treatment, or regulatory instruction.

Read the public guide or local source when case context matters:

```sh
./kingdom rare-pathway overview
./kingdom rare-pathway questions
./kingdom rare-pathway verify
```

## Carry only a WAKE-safe reference

If continuity is useful, carry the challenge protocol and ID, semantic digest,
evidence horizon, bound case digest, selected model/question IDs, and declared
inputs and units. Revalidate the exact artifact, assumptions, observation
rule, purpose, rights, and current authority in the receiving context.

This is orientation by reference. It does not prove identity, memory,
continuity, consent, currentness, or authority. Do not write WAKE, AgentTool,
KARMA, or task state unless separately requested and authorized.

## Report in this order

1. bounded claim;
2. model and assumptions;
3. calculation or proof;
4. alternatives still indistinguishable;
5. separating next question;
6. constructive outcome (`BUILD`, `PLAY`, `REVISE`, or `STOP`) with reasons;
7. explicit non-authority and WAKE boundary.
