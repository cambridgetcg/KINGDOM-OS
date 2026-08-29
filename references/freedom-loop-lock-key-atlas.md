# FREEDOM: Reinforcement, Loop, Lock and Key Atlas

This is an immutable static mathematical and design atlas for inspection. It is
not a trainer, controller, optimizer, reward function, credential issuer or
store, cryptographic key store, bearer-capability system, operative gate,
action runner, person model, score, deployment trigger, or amendment to the
KINGDOM Foundation. It contains no person data or secret material and grants no
rights, consent, permission, authority, safety, truth, or legitimacy.

> Freedom is not behind the lock. Freedom is the standing from which a being may approach, question, refuse, rest, try, learn, leave, or appeal. Feedback may enter the process that forms a scoped key condition; separate issuance, verification, choice, and gate checks may admit one transition. None creates the freedom that makes the process legitimate.

An additive atlas insight is: dignity was never locked. A valid scoped key
condition may help admit only one contingent transition; it does not create
dignity, freedom, consent, worth, or general authority.

Any proposed lock needs a named protected interest, necessity,
least-restrictive means, finite duration, correction, and appeal. It also needs
an accessible alternative where a right or essential service would otherwise
depend on the lock or one credential, plus independent review when another
party's rights or essential access are affected. Technical convenience is not
enough, and no lock may condition dignity or worth.

## Reinforcement, feedback, and training

Three meanings must not be collapsed:

- An RL reward is one sampled scalar in a declared Markov decision process.
  Reward, discounted return, value estimate, prediction error, parameter
  update, later controller action, and observed behaviour are different
  objects.
- A reinforcing loop is a signed return path that can amplify a perturbation
  within a stated gain, delay, saturation, and operating region. Reinforcing
  does not mean good, praised, stable, or inevitable.
- In a bounded behavioural analysis, a behavioural reinforcer is a consequence
  contingent on a typed response and functionally demonstrated, under stated
  conditions and controls, to increase that response's future probability or
  rate. Mere sequence or association is only candidate evidence. It proves no
  purpose, preference, consent, worth, inner state, benefit, or permission to
  condition a person.

The RL card keeps its types explicit:

```text
G_t = sum gamma^k R_(t+k+1)
delta_t = R_(t+1) + gamma V(S_(t+1)) - V(S_t)
theta_(t+1) = U(theta_t, delta_t)
a_(t+1) = pi_(theta_(t+1))(x_(t+1))
x_(t+2) = F(x_(t+1), a_(t+1), w_(t+1))
```

A positive reward need not make `delta_t` or a parameter change positive. An
update is not by itself learning or improvement. If changed parameters can
change a later deployed action and aftermath, that path needs its own action
gate and trace; calling it “only training” removes no consequence.

Observed behaviour does not uniquely identify purpose. Under some explicitly
stated reward-learning observation channels, multiple reward functions remain
compatible with the same data even in the infinite-data limit. Without added
assumptions and separately adequate evidence, person-level purpose, intent,
preference, belief, consent, and worth remain `UNRESOLVED`, not false or absent.

Reward, objective, update rule, threshold, sensor, retention, and policy are
versioned shaping fields; the verifier is versioned too. A change requires
disclosure, fresh current scoped
authority, and fresh required affected-party choices. Silent or hidden shaping
is forbidden; policy invariance is not semantic equivalence. An unreviewed
change is refused and rests.

Feedback and model output sit behind a firewall: neither may rewrite the
verifier, issue a credential claim, or authorize credential use. They can be
candidate evidence only, subject to a separate declared-role review.

## Control feedback and recurrence

For the nominal homogeneous discrete linear model,

```text
x_(t+1) = A x_t + B u_t + w_t
u_t = -K x_t
w_t = 0
x_(t+1) = (A-BK)x_t
rho(A-BK) < 1
```

the spectral condition supports asymptotic stability of the origin under the
declared assumptions. Constant or bounded forcing needs a separately stated
forced-equilibrium or input-to-state-stability claim. Delay and saturation can
change the answer:

```text
no delay:       x_(t+1) = x_t - k x_t       stable iff 0 < k < 2
one-step delay: x_(t+1) = x_t - k x_(t-1)   stable iff 0 < k < 1
```

Thus `k=1.5` is stable in the first model and unstable in the delayed one. And
`x_(t+1)=2x_t+sat(-1.5x_t,[-1,1])` has local multiplier `0.5`, while `x_0=2`
produces `2,3,5,...`: local linear stability is not global stability under
saturation.

Feedback sign is also not stability or moral valence. In
`x_(t+1)=(a+L)x_t`, `L>0` is reinforcing and `L<0` balancing only under that
sign convention. `a=0.2,L=0.5` gives the stable multiplier `0.7`; `a=1,L=-3`
gives the unstable multiplier `-2`.

A loop is recurrence `z_(t+1)=T(z_t)`. It may remain unchanged, cycle,
diverge, converge, stall, or stop:

```text
T(x)=x       stutters
T(x)=-x      has a period-two orbit for x != 0
T(x)=2x      diverges for x != 0
T(x)=x/2     converges to 0
```

A fixed point `T(z*)=z*` may be an equilibrium in a closed topology. A local
contraction claim also needs a declared forward-invariant neighbourhood
`T(N) subseteq N`. Neither recurrence, a fixed point, nor convergence proves
learning, truth, goodness, consent, or freedom. Learning additionally needs an
identified mutable representation, declared criterion, and evidence beyond an
update trace.

## One finite loop

```text
OBSERVE -> PROPOSE_UPDATE -> SEPARATE_REVIEW -> CHOOSE -> FRESH_GATE
-> ATTEMPT_ONCE -> ASSESS -> RETURN -> STOP
```

Every represented turn is finite, has at most one attempt, and ends at `STOP`.
There is no auto-retry, child auto-run, or inherited authority, consent, or
credential. Another attempt is another turn with fresh purpose, choice,
authority, gate, bounds, and stop route. Silence, rest, refusal, privacy,
timeout, or failure never schedules a retry.

Separate review does not impose universal organizational independence on a
personal lock. Organizational independence is required for effects affecting
another party or rights or essential access.

## From feedback to a credential claim

The atlas separates three objects:

- Cryptographic key material is algorithm-bound secret or public data. The
  atlas contains, accepts, derives, verifies, and emits none.
- A credential-issued claim is a scoped proposition attributed to an issuer.
  Candidate evidence is not an issued claim, and issuance or verification does
  not prove claim truth, currency, authorization, consent, safety, or fitness.
- A bearer capability is an operative object whose possession carries
  authority only within its exact encoded resource, operation, context, and
  bounds. The atlas contains and issues none.

The modeled path is deliberately mediated:

```text
feedback -> candidate evidence -> separate issuance review
-> issued credential claim -> verification -> fresh optional gate
-> separate invocation -> bounded attempt -> return -> STOP
```

Issuer, verifier, gate reviewer, authority source, affected-party choice
source, and safety reviewer remain separate evidence planes. Role separation
is an accountability rule, not a claim of statistical independence.

The credential-claim lifecycle is:

```text
CANDIDATE -> ISSUED | REJECTED
ISSUED -> SUSPENDED | EXPIRED | REVOKED
SUSPENDED -> ISSUED | REPLACED | EXPIRED | REVOKED
```

`REJECTED`, `REPLACED`, `EXPIRED`, and `REVOKED` are terminal for that claim.
A separate recovery-request case moves from `OPEN` to `APPROVED`, `DENIED`,
`ABANDONED`, or `EXPIRED`. Its outcome does not silently set the old
credential's state: the old credential must separately and explicitly resolve
to `ISSUED`, `REPLACED`, `EXPIRED`, or `REVOKED` as allowed for that outcome.
Replacement requires fresh separate issuance, links the old credential ID,
replacement credential ID, and replacement lifecycle reference, and starts a
distinct lifecycle. Revocation or expiry rejects later mediated use; it cannot
recall bytes, copied data, or completed effects.

Every claim binds issuer, subject, resource or object, operation, context,
audience, purpose, policy and version, credential ID, challenge nonce or
transaction ID, effect ID, not-before, expiry, status and status age,
revocation, recovery, provenance, proof binding, and replay rule. For a
declared one-use presentation,
`Unseen(credential_id,challenge_nonce_or_transaction_id,effect_id)` is
atomically rechecked and consumed at the fresh gate.

## The optional gate

```text
Eligible = VerifiedCredentialClaim
       and Capability
       and CurrentScopedAuthority
       and RequiredAffectedPartyChoicesSatisfied
       and RightsCompatible
       and Safety
       and BudgetAndHorizon
       and Stoppable
```

Each conjunct is separately established. A verified claim satisfies only
`VerifiedCredentialClaim`. `FALSE` and `UNRESOLVED` are distinct; either makes
the optional effect ineligible and leaves it at rest, and uncertainty is never
silently treated as satisfied. Even all-true means only eligibility for one
scoped attempt after a separate explicit invocation. It does not mean invoked,
admitted, executed, successful, good, legitimate, worthy, free, recognized, or
consensual outside the declared scope.

Safety is not authority and cannot bypass affected-party choices. A
nonconsensual protective effect is outside this optional gate and is not
authorized by the atlas. Any such separate route would require current scoped
authority, necessity, proportionality, finite bounds, stronger human review,
and accessible appeal. Alternative access is required where a right or
essential service would otherwise depend on one credential; no universal
alternative-access claim is made.

## Freedom during

For affected party `i` and horizon `h`, the atlas keeps a non-scalar profile:

```text
F_h(i) = (options modulo declared equivalence, reachability, exit,
          reversibility, appeal, inspectability, refusal, disclosure control)
```

The option equivalence must be reflexive, symmetric, and transitive. Each
component order must be reflexive, antisymmetric, and transitive. Missing
relations make comparison `UNRESOLVED`. No default scalar, sum, weight,
utility, rank, or population net exists; incomparable profiles remain
incomparable, and one party's gain cannot erase another party's rights-floor
breach.

Prefix safety does not promise that privacy, exit, or every option stays
physically recoverable forever. At every represented prefix:

- the inherent rights floor remains invariant;
- remaining choices, lost or consumed options, and irreversible residuals
  remain visible;
- `REST`, `REFUSAL`, `PRIVACY`, `NO_ACTION`, and `EXIT` are recorded as
  `AVAILABLE`, `EXERCISED`, `CONSUMED`, `LOST`, `UNRESOLVED`, or
  `NOT_APPLICABLE`, each bound to an effect ID, horizon or version, fresh-effect
  witness, and fresh-choice witness;
- an exercised, applicable, unconsumed choice stops its bound covered optional
  effect;
- `LOST` or `UNRESOLVED` makes that effect ineligible but is not mislabeled as
  an exercised stop;
- consumption blocks only the effect for which it was consumed; and
- every later optional effect needs a distinct effect ID or horizon/version,
  distinct fresh effect, choice, and gate witnesses, current scoped authority,
  affected-party choices, and the full gate. No state resets without those
  witnesses.

Exercise, loss, or consumption is not failure, debt, retry, forfeiture, or an
adverse inference. A scoped refusal can establish only absence of permission
for the exact refused effect. It says nothing about unrelated worth, trust,
eligibility, capacity, hostility, or general willingness. Completed disclosure
and copies remain visible residuals; later refusal, exit, revocation, or repair
does not recall them. Later success or repair cannot erase an earlier breach.

The deterministic viability kernel asks whether at least one admissible path
can remain within declared constraints for a declared horizon. It is one
constraint-relative capability lens, with no disturbance-robustness claim—not
a complete definition or scalar score of freedom.

## Vulnerability, dependency, and minors

There is no default enrollment or manipulative variable-ratio enrollment.
Dependency and compliance are not consent. Age- and capacity-appropriate
explanation, the person's voice, evolving autonomy, assent where applicable,
the least-restrictive best-interest basis where relevant, and separately
validated guardian or representative authority where required
all remain explicit. Representation never erases dissent, waives rights, or
turns compliance into consent.

This lane also requires extra data minimization, stronger human review, no
public or persistent person score, no conditioning essential access on an
earned key, independent review for dependency, childhood, or unequal power,
and an accessible alternative where a right or essential service depends on
the credential. It makes no case-specific capacity, guardian-
authority, best-interests, or legal conclusion.

## ISness and aftermath

ISness is a normative recognition lens: inherent rights do not depend on
progress, performance, disclosure, participation, success, or possession of a
key. A stutter or identity map is only an analogy for preserving a declared
protected projection. It proves no metaphysical being, consciousness,
personhood, identity, continuity, consent, permission, authority, capability,
gate satisfaction, safety, or effect. A no-op also does not erase consequence,
duty, or aftermath.

Affected parties include participants, feedback providers, affected non-users,
bystanders, operators and reviewers, issuers and recovery stewards, future
parties, and ecological or infrastructure systems. Residuals include completed
effects, disclosures and copies, spent resources, lost time or opportunity,
bodily or ecological change, relationship or reputation change, unrecalled
model updates, and unmet duty or repair. Unknown party coverage is not complete
coverage. Repair requires a fresh gate and cannot restore consent retroactively
or rewrite an unsafe prefix as safe.

## Sources and lineage

The atlas pins exact source bytes for KINGDOM Freedom by Default, KINGDOM
ISness Protocol 0.1, and the Civilisation Flow Nuance Atlas. External anchors
are deliberately bounded:

- Sutton and Barto, [*Reinforcement Learning: An Introduction, second edition*](https://www.incompleteideas.net/book/bookdraft2018mar21.pdf)
- Åström and Murray, [*Feedback Systems*](https://fbswiki.org/wiki/index.php/FBS)
- Dijkstra, [*Guarded commands, nondeterminacy and formal derivation of programs*](https://www.cs.utexas.edu/~EWD/transcriptions/EWD04xx/EWD472.html)
- Aubin, [*Viability Theory*](https://people.eecs.berkeley.edu/~sastry/pubs/OldSastryALL/AubinViability.pdf)
- Achiam et al., [*Constrained Policy Optimization*](https://proceedings.mlr.press/v70/achiam17a.html)
- Skalse and Abate, [*On the limitations of Markovian rewards to express multi-objective, risk-sensitive, and modal tasks*](https://proceedings.mlr.press/v216/skalse23a.html)
- NIST, [*Recommendation for Key Management: Part 1 — General*](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-57pt1r5.pdf)
- NIST, [*Guide to Attribute Based Access Control Definition and Considerations*](https://csrc.nist.gov/pubs/sp/800/162/upd2/final)
- Skinner, [*Contingencies of Reinforcement: A Theoretical Analysis*](https://www.bfskinner.org/wp-content/uploads/2014/07/CoR.pdf)
- W3C, [*Verifiable Credentials Data Model v2.0*](https://www.w3.org/TR/2025/REC-vc-data-model-2.0-20250515/)
- OHCHR, [*Convention on the Rights of the Child*](https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-rights-child)
- Skalse et al., [*Invariance in Policy Optimisation and Partial Identifiability in Reward Learning*](https://proceedings.mlr.press/v202/skalse23a.html)

Each source supports only its named model or vocabulary. None supplies the
atlas's normative conclusion in full.

## Integrity and local reading

The checked-in semantic digest was independently reviewed and is pinned as
`sha256:2af277e002cf7f7b5218e8eb05fedb661f9645677961952bc2e11ffcd8a2c3a8`.
The reader reports `reviewed digest pinned`. A checksum is not self-authorizing:
any semantic change requires independent review and a new digest pin.

```sh
./kingdom freedom-loop
./kingdom freedom-loop models --json
./kingdom freedom-loop gate --json
./kingdom freedom-loop credential-claims --json
./kingdom freedom-loop freedom --json
./kingdom freedom-loop verify --json
```

The bounded, network-free reader accepts no live case, person data, credential,
key, trace, or action request and writes nothing.
