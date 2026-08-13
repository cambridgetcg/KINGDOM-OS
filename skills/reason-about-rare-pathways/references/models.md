# Rare-pathway model card

## Time-dependent competing hazards

For cause-specific hazards `lambda_i(t)` while the system remains at risk:

```text
S(t)   = exp(-integral_0^t sum_j lambda_j(s) ds)
F_i(T) = integral_0^T S(t) lambda_i(t) dt
```

`S(T)` is the no-first-event mass. The `F_i(T)` values and `S(T)` sum to one
when the declared causes exhaust all exits from the at-risk state.

These cause-specific-hazard formulas describe the observed first-event
process without requiring independent latent event times. Counterfactual
latent times—such as when one cause would have occurred after removing its
competitor—remain unidentified without additional assumptions.

For piecewise-constant phases, carry survival from each phase into the next.
Within a phase of length `delta`, total rate `Lambda`, and incoming survival
`S0`, the phase contributes:

```text
S0 * lambda_i/Lambda * (1-exp(-Lambda*delta))
```

to cause `i`, with the zero-total-rate contribution defined as zero. Outgoing
survival is `S0*exp(-Lambda*delta)`.

## Zero-event bound

With a homogeneous Poisson target process, perfect detection, and positive
at-risk exposure `H`:

```text
P(N=0 | lambda,H) = exp(-lambda H)
lambda_upper       = -ln(alpha)/H
```

where `alpha=1-confidence`. Under competing-event censoring, accumulate only
time during which a target event remains observable and at risk. For
time-varying hazards, zero events directly constrain cumulative hazard under
the observation model, not a unique constant rate.

## Numerical discipline

- Require finite nonnegative rates and horizons.
- Require positive exposure for a rate bound.
- Require confidence and target probabilities strictly between zero and one.
- Refuse subnormal target-probability thresholds rather than pretending binary64
  rounding can certify a conservative minimum; rescale the probability model.
- Use `expm1` and `log1p` near zero.
- Return probabilities that form a finite normalized partition.
- State units; never silently mix rates and horizons.

## What the equations do not identify

The same endpoint distribution can arise from different hazard histories.
Unlabeled events cannot identify cause-specific hazards. Missed detections can
imitate a lower rate. A first competing event can censor a target pathway.
Pooling heterogeneous histories can make a constant rate meaningless. The
right result may be a set of compatible explanations, not one estimated cause.
