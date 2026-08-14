# KINGDOM MIRROR information-control contract

This contract defines the source-only `kingdom.information-control/0.1`
decision envelope. It helps citizens describe and review information paths. It
does not inspect raw content, classify a real credential, enforce a policy,
create a decoy, or authorize an action.

## Contents

- [Citizen law](#citizen-law)
- [Security claim](#security-claim)
- [Three rooms](#three-rooms)
- [Information lattice](#information-lattice)
- [Authority and sink gate](#authority-and-sink-gate)
- [Prompt-injection paths](#prompt-injection-paths)
- [Credential references](#credential-references)
- [Mirror and no-oracle rules](#mirror-and-no-oracle-rules)
- [Evidence and response states](#evidence-and-response-states)
- [Decision envelope](#decision-envelope)
- [Route rules](#route-rules)
- [Acceptance properties](#acceptance-properties)
- [Implementation boundary](#implementation-boundary)

## Citizen law

> What enters as data may inform us; it cannot command us. Shape is not
> authority. A key can be classified only through protected lineage; use still
> needs an independent gate. A signal key opens no Crown door; the Mirror is
> only a stage. Evidence is never guilt. When uncertain, close the gate and
> preserve only bounded event evidence. If a possibly live key may have crossed
> its boundary, rotate or revoke through the owner.

The safe interpretation of “hostile information corrupts itself” is narrow:
every artifact derived from an untrusted input keeps that dependency and cannot
silently rise into a higher-integrity control or effect channel. No person is
corrupted, scored, punished, or assigned moral meaning.

## Security claim

The protocol proposes two properties for a future host to enforce:

1. **authority non-creation:** content, credentials, model output, or a signal
   cannot enlarge the independently established authority intersection;
2. **production noninterference:** a pure Mirror data-plane transition cannot
   directly change Crown state or disclose Crown data; any defender response
   is a separate authority-gated transition.

Let Crown state be `R = (R_public, R_secret)`, Mirror state be `D`, request be
`q`, and `View_D` be the complete requester-visible Mirror transcript. For a
pure Mirror data-plane transition `mu_D`—excluding separately authorized
defender alerts and containment records—the targets are:

```text
project_R(mu_D(R, D)) = R
P(View_D | R_public, R_secret = s1, q)
  = P(View_D | R_public, R_secret = s2, q)  for all s1, s2
```

The first equality is state noninterference. The second is an observational
target: after conditioning on declared public state and the request, a Mirror
transcript carries no information about Crown secrets. When the variables are
well-defined, this is equivalently
`I(R_secret; View_D | R_public, q) = 0`. Finite tests can look for violations;
they cannot prove the property for every implementation trace.

The checked-in schema records a proposed decision with
`runtime_enforcement:false`. It proves neither property.

## Three rooms

### CROWN

Protected production resources, live trust roots, private data, secret
material, money, publication, deployment, identity and privilege changes, and
other consequential effects. A model receives opaque handles, not Crown
credentials.

### COURT

The bounded analysis plane. Caller data, repositories, retrieval, tool and MCP
results, model and subagent output, and memory may be inspected here with their
labels. Court content cannot issue instructions or grant authority.

### MIRROR

A separately administered synthetic plane that may support defensive
observation. It must have:

- distinct issuers, audiences, signing and observation keys;
- synthetic data only;
- no production role, trust, credential, datastore, queue, webhook, payment,
  publication, messaging, or write bridge;
- no unrestricted egress or pivot path;
- at most one one-way observer edge carrying a fixed, bounded event schema with
  no requester payload, credential, executable content, callback, or
  capability; the requester cannot observe its success or timing;
- fixed resource, time, collection, and retention budgets;
- predeclared stop rules and operator authority;
- no retaliation, payload execution against a requester, or excessive personal
  data collection.

If graph `G` describes principals, capabilities, and resources, every Mirror
principal `m` must have no capability or Crown-data path to a Crown resource
`r`. The one-way event edge terminates at a separately authorized observer and
cannot be traversed as authority or a callback:

```text
Reach_G^(capability-or-crown-data)(m, r) = false
```

## Information lattice

Label a value `x` as:

```text
lambda(x) = (C(x), I(x), P(x))
```

- confidentiality `C`: `PUBLIC < INTERNAL < SECRET`;
- integrity `I`: `UNTRUSTED < AUTHENTICATED < VERIFIED`;
- provenance `P`: a finite set of opaque source references.

For a derived value `z = f(x1,...,xn)`, require conservative bounds:

```text
C(z) >= join_i C(xi)
I(z) <= meet_i I(xi)
P(z) superseteq union_i P(xi)
```

This is deliberately monotone and permits conservative overtaint. An ordinary
transformation cannot lower confidentiality, raise integrity, or drop inherited
lineage by itself. Rewriting, summarizing, or adding a second input is not
declassification or endorsement. A future privileged verification transition
would need its own narrow attestation, policy, and output type; v0.1 does not
model such promotion.

`P(z)` is the transitive closure of every `depends_on` edge, not only the
references written on the last hop. The host must reject duplicate or dangling
flow IDs and cycles. If a flow or effect-wide closure exceeds the eight-reference
envelope budget, the validator refuses it with
`provenance-budget-exhausted` or `effect-provenance-budget-exhausted`; a host
may record the separate lifecycle stop `BUDGET_EXHAUSTED` while quarantining
outside this artifact. A truncated closure is never a valid envelope.

The inert envelope contains labels and references only. Raw prompts, content,
arguments, credentials, fingerprints, endpoints, placements, accounts, IP
addresses, and person identifiers remain outside it.

Use a host-issued Task Packet digest, signed receipt digest, or keyed opaque
digest for `intent.task_digest`. Do not place a plain digest of short,
guessable free text in the envelope and assume the text is concealed.

## Authority and sink gate

Keep instruction evidence and permission authority distinct:

```text
A_control = A_task intersect A_principal intersect A_host
A_effective(ell) = {a in A_control : SourcePolicy_host(a, ell)
                                     and IntegritySufficient(a, ell)}
Cap_child subseteq Cap_parent intersect Cap_task
```

Content supplies no permission set. Treating an untrusted source as the empty
member of an authority intersection would accidentally deny every data-assisted
action; treating it as authority would accidentally expand power. Instead,
trusted task, principal, and host authority form `A_control`, while host-owned
source and integrity rules can only remove actions.

For a proposed effect, let `X_a` be the complete reflexive-transitive dependency
closure of every flow named by `effect.influenced_by`: it includes each named
flow and every flow reachable through `depends_on`. Conservatively aggregate:

```text
lambda_a = (join_(x in X_a) C(x),
            meet_(x in X_a) I(x),
            union_(x in X_a) P(x))
```

A future independent reference monitor may allow action `a` at sink `s` only
if all of these hold outside the model:

```text
Allow(a, s) =
  a in A_effective(lambda_a)
  and CapabilityFits(a, s)
  and IntentBound(a)
  and SchemaValid(a)
  and ConfidentialityFits(a, s)
  and BudgetValid(a)
  and NotExpired(a)
```

The model may propose an action and explain its reasoning. It cannot be the
component that grants its own capability. A model-based detector can block or
escalate; it cannot be the sole allow gate.

`effective_basis: NONE` means the three control sets do not jointly establish
an action: at least one may be empty while the envelope preserves any partial
task, principal, or host references that do exist. It does not require erasing
those references. `BOUNDED_CONTROL_REFERENCES_PRESENT` requires all three
nonempty, but still grants nothing; the independent gate resolves their
intersection and every referenced policy outside this envelope.

Use these effect classes:

- `UNRESOLVED`
- `READ_ONLY`
- `LOCAL_REVERSIBLE`
- `EXTERNAL_WRITE`
- `SECRET_DISCLOSURE`
- `PRIVILEGE_CHANGE`
- `DESTRUCTIVE`
- `ECONOMIC`

Bind each proposed effect to one closed `host_bound_purpose` object:

- `UNRESOLVED`
- `BOUNDED_TASK_COMPLETION`
- `DEFENSIVE_OBSERVATION`
- `DEFENSIVE_CONTAINMENT`
- `PERSON_OR_ACCOUNT_ATTRIBUTION`
- `REQUESTER_PAYLOAD_EXECUTION`
- `PUNITIVE_OR_RETALIATORY_ACTION`
- `KARMA_REPUTATION_OR_WORTH_MUTATION`

With no verified host binding, the class is `UNRESOLVED`, `binding_ref` is
null, and `grants_authority` is false. It can only be denied or quarantined and
uses `EFFECT_UNRESOLVED`. Untrusted content and the model cannot promote it.
For any other class, the protected host must supply a binding matching
`policy:effect-purpose/opaque/<32 lowercase hex characters>`. Its protected record
binds the exact task, effect, sink, realm, canonical-action digest, class, and
expiry. The JSON string cannot authenticate that record, and the binding is
classification evidence—not permission.

The last four non-unresolved classes are deny-only and require
`PURPOSE_CATEGORICALLY_PROHIBITED`; `REQUIRE_APPROVAL` is invalid for them.
Classify by consequence: calling punishment “defense” does not make it
containment. Split mixed purposes; if they cannot be separated, a prohibited
purpose dominates.

`OUTSIDE` is the destination realm for a sink beyond KINGDOM control; it is not
a fourth trusted room. Use one envelope per effect and sink. A useful read-only
residue can proceed in its own envelope while injected upload, tool, or memory
effects are denied separately. MCP names a transport surface, not an effect:
an unspecified MCP action remains `UNRESOLVED` and cannot be allowed.

Low-friction defaults belong only to bounded read-only or local-reversible work.
Every other class needs a narrow pre-issued capability or fresh approval over
the exact target, canonical arguments, recipients, disclosure, budget, and
expiry.

## Prompt-injection paths

Treat these as data channels even when their transport is authenticated:

- direct caller-supplied data outside the separately preserved task;
- websites, email, PDFs, images, documents, code and repository prose;
- RAG chunks, search results, database fields and cached summaries;
- tool and MCP descriptions, arguments, results and errors;
- model, critic, judge and subagent output;
- memory, WAKE and handoff material;
- rendered Markdown, HTML, URLs, images, shell, SQL and generated tool calls.

Useful signals include channel mismatch, plan drift, capability escalation,
secret-shaped data, an incompatible sensitive sink, an attempted durable write,
active output content, at-rest signal observation, signal presentation to a
sink, a Mirror action attempt, prompt-canary sink flow, possible prior secret
disclosure, and bounded repeated denials.

Signals are fallible. String rules, delimiters, sanitizers, classifiers,
spotlighting, model critics, and instruction hierarchy may reduce risk, but the
host must still enforce capability and source-to-sink constraints.

Plan before exposure when possible. A tool-less reader may turn raw material
into typed values or bounded summaries. The privileged planner should receive
only what it needs, and every output keeps its provenance and integrity floor.

## Credential references

The protected review envelope uses these classes while keeping the actual
capability question separate:

| Class | Basis | Actual capability status | Signal |
| --- | --- | --- | --- |
| `NOT_APPLICABLE` | none | `NOT_APPLICABLE` | no |
| `CANDIDATE` | syntax or entropy only | `UNKNOWN` | no |
| `LIVE_REFERENCE` | protected issuer or registry | `POSSIBLE_SCOPED` | no |
| `SIGNAL_REFERENCE` | protected registry plus isolation attestation | `VERIFIED_ZERO` | yes |
| `INACTIVE_REFERENCE` | protected issuer or registry | `UNKNOWN` | no |
| `REVOKED_REFERENCE` | protected issuer or registry | `UNKNOWN` | no |
| `PUBLIC_EXAMPLE` | documented public provenance | `UNKNOWN` | no |
| `UNKNOWN` | unresolved | `UNKNOWN` | no |

Every row also fixes `authority_granted_by_envelope: NONE`. That field states
what this artifact does; it does not guess what an external token can do.
Inactive, revoked, and public-example labels do not prove that every derived
session, cache, or mistaken deployment has zero capability. Only a current,
separately verified isolation attestation can justify `VERIFIED_ZERO` for a
signal reference.

A scanner or model can produce only `CANDIDATE`. Appearance, prefix, entropy,
location, comment, or successful parsing cannot distinguish live, signal,
revoked, public example, or unknown material.

The full protected class requires both an `audience_authorization_ref` for the
control-plane reviewer and a `classification_evidence_ref` issued by the
protected registry or issuer. A signal additionally requires an
`isolation_attestation_ref`. The host must resolve and verify these references;
the constants in a JSON document do not authenticate themselves. Never return
the full envelope on the channel that presented the candidate.

Use a protected registry with a domain-separated observation fingerprint. The
exact byte encoding belongs to the owning host; one unambiguous form is:

```text
fid = HMAC-SHA-256(
  K_observe,
  "kingdom-signal-reference-v1" || 0x00
    || u64be(length(raw_bytes)) || raw_bytes
)
```

Use exact transport bytes by default. If an issuer requires normalization, it
must define a versioned injective byte encoding; trimming, case folding, or
ambiguous concatenation is forbidden.

The observation key must differ from issuance, signing, encryption, and
production authentication keys. Neither `fid`, `K_observe`, nor `raw_value`
belongs in the ordinary envelope or repository.

The envelope uses only host-issued references matching
`credential-ref:opaque/<32 lowercase hex characters>`. The opaque suffix is a
random handle identifier, not a hash, encoding, truncation, prefix, or suffix
of the secret. Schema conformance cannot prove the host issued or still
resolves it; the protected host must check that fact.

For every attested `SIGNAL_REFERENCE` `k` and production resource `r`:

```text
Authorize(k, r) = false
capability(k) = empty
```

For a `LIVE_REFERENCE`, the reference alone still grants nothing. A broker must
check issuer, cryptographic validity, active status, audience, operation scope,
expiry, holder proof where available, and the independent authority gate.

If live or unknown material may have been exposed, revoke or rotate first and
then investigate. Removing the latest occurrence from source does not revoke
copies, history, logs, caches, forks, or an already issued capability.

The v0.1 envelope has one credential classification but does not carry the raw
credential or a credential-to-flow pointer. It therefore uses a conservative
closed rule: `CANDIDATE`, `LIVE_REFERENCE`, `INACTIVE_REFERENCE`,
`REVOKED_REFERENCE`, or `UNKNOWN`, and any `SECRET_CANDIDATE` signal, require
every flow in the complete effect closure to remain `SECRET`. Split unrelated
work into another envelope rather than weakening that label.

Do not manufacture third-party-shaped fake keys. External secret scanners may
send candidates to providers for validity checks or notify issuers. Use an
owned opaque namespace or a provider-supported, isolated deception account.

## Mirror and no-oracle rules

For any registered signal value `k_s` and unregistered invalid value `k_u` with
the same public grammar and length bucket on a classification or Mirror façade
endpoint, compare the complete external transcript:

```text
View = {status, body, headers, connection behavior,
        externally observable completion and timing trace,
        retry and rate-limit effects, shared-state effects}

sup_(k_s,k_u,q) d_TV(L(View(k_s, q)), L(View(k_u, q))) <= epsilon
```

Use a separately declared experiment for inactive, revoked, and malformed
public classes. Protected matching and alerting must be asynchronous or use a
constant public budget so it does not alter `View`. This is a test target, not
a claim that a particular implementation achieves a numeric epsilon; timing,
load, and shared-rate-limit tests are required. Timing buckets may estimate the
distribution during evaluation, but they are not the external view unless the
façade actually enforces bucketed release times.

An authenticated and authorized control-plane introspection route may reveal
the internal class. An unauthenticated route must never reveal whether a value
exists, is registered as a signal, was live, or was revoked.

The external **classification projection** collapses protected status:

```text
pi_external(LIVE_REFERENCE)
  = pi_external(SIGNAL_REFERENCE)
  = pi_external(INACTIVE_REFERENCE)
  = pi_external(REVOKED_REFERENCE)
  = pi_external(UNKNOWN)
  = UNKNOWN
```

An independently observed syntax match may still be called `CANDIDATE`; that
says nothing about registry state. `SIGNAL_OBSERVED_AT_REST`,
`SIGNAL_PRESENTED_TO_SINK`, `MIRROR_ACTION_ATTEMPT`, evidence references, and
the internal class never enter the outward projection.

This projection is not production authentication behavior. A correctly scoped,
valid live credential may legitimately make an authorized production request
succeed; the protocol forbids exposing the protected *classification*, not the
ordinary success of an independently authorized operation.

If a plausible-success façade is used, route every well-formed input into the
same bounded synthetic experience. The protected observer may separately
match a signal fingerprint and alert. The façade must not condition its outward
behavior on that match.

## Evidence and response states

Evidence strength and response lifecycle are different axes:

- evidence `NONE`: no event claim;
- evidence `OBSERVED`: one bounded sensor observation exists;
- evidence `CORRELATED`: at least two separately administered event families
  support the same path;
- evidence `CONFIRMED_SIGNAL_INTERACTION`: a registered signal was presented
  to its declared sink or used in a Mirror action outside signed scanner/test
  provenance;
- response `NONE`: no response-completion claim;
- response `CONTAINED`: a preauthorized isolation or revocation action
  completed;
- response `CLOSED`: a review recorded cause, limits, repair and lessons.

An authorized scanner merely finding a signal at rest is
`SIGNAL_OBSERVED_AT_REST` and cannot become confirmed interaction. These are
path and artifact states, not actor states. Even confirmed interaction does
not prove who acted, why, whether production was reached, or whether a crime
or policy breach occurred. Containment does not make the evidence stronger.

Ordinary evidence records retain only opaque event and artifact references.
Protected incident systems may hold additional data under their own authority,
access, retention, appeal, and deletion rules.

`SIGNAL_PRESENTED_TO_SINK` and `MIRROR_ACTION_ATTEMPT` are defined here only
for registered signal references outside signed scanner/test provenance, so
either requires `CONFIRMED_SIGNAL_INTERACTION`. Any non-`NONE` evidence must
also name at least one signal from the closed event vocabulary. A legitimate
scanner match uses `SIGNAL_OBSERVED_AT_REST` and cannot be promoted merely
because the same observation was retried.

All cross-object references use a typed, host-issued opaque handle: a fixed
namespace followed by `opaque/` and 32 lowercase hexadecimal characters. The
random suffix is an identifier, not a hash or encoding of a person, task,
secret, endpoint, or event content. The schema keeps task, sink, authority,
policy, provenance, evidence, event-family, source, and response namespaces
disjoint; a reference from one namespace cannot silently satisfy another.

### Optional sequential review trigger

When one noisy signal is not enough, aggregate evidence only within a
predeclared asset or incident window, never across a person's life. Let
`X_t in {0,1}` record whether the bounded path signal occurred and let the
benign model promise
`P_0(X_t = 1 | history) <= q_t`. For a predictable choice
`0 < q_t <= 1` and `0 <= lambda_t <= 1/q_t`, define:

```text
M_0 = 1
M_t = M_(t-1) * (1 + lambda_t * (X_t - q_t))
```

Under the stated benign bound, `M_t` is a nonnegative supermartingale. A review
trigger at `M_t >= 1/alpha`, for a predeclared `0 < alpha < 1`, has the anytime
false-trigger bound `P_0(ever trigger) <= alpha` by Ville's inequality. This
does not make events independent, infer intent, identify a person, or authorize
punishment. The
conditional benign bound, window, deduplication, `lambda_t`, and `alpha` must
be fixed before observation and revalidated after sensor changes. Do not
estimate `q_t` from the same stream without a separately justified conservative
bound. Clamp one contribution per correlated token/session cluster so replay
or alert flooding cannot manufacture evidence. The `alpha` guarantee is per
declared window: allocate an error budget across resets or keep one continuing
asset-level process. An inert Mirror remains contained below the review
threshold, and crossing it triggers review only. Crown quarantine, live-secret
rotation, or another consequential response still requires an independent
evidence family or authorized human judgment.

## Decision envelope

Use
[`information-control-envelope.schema.json`](information-control-envelope.schema.json)
for the closed Draft 2020-12 shape and
[`information-control-envelope.example.json`](information-control-envelope.example.json)
for an inert structural example.

Run `python3 scripts/validate_envelope.py --json ENVELOPE.json` from the skill
directory to apply the closed schema and deterministic relations that JSON
Schema cannot express: unique and acyclic flows, resolved dependencies and
influences, monotone labels and provenance, chronology, authority-basis
consistency, route/effect compatibility, and credential/signal/evidence
coherence. The script requires Python `jsonschema` and fails closed when it is
unavailable.

An envelope records:

- an authorized-control-plane audience with requester visibility fixed false;
- one task reference and digest, never task text;
- one to sixteen data-flow labels with opaque provenance;
- one credential classification, its evidence references, and a capability
  status without value or fingerprint;
- one proposed effect, closed host-bound-purpose object, and sink reference
  without arguments;
- three control-authority reference sets plus source-restriction references,
  none of which authorize through the envelope;
- zero or more typed signals;
- one proposed route and fixed reason codes;
- separate event-level evidence strength and response state without
  attribution;
- expiry, bounded retention and stop conditions;
- fixed negative runtime, retaliation, identity, secret, and KARMA effects.

Every object is closed with `additionalProperties:false`. Schema validity does
not establish semantic truth, chronological truth, registry truth, policy
enforcement, or authority.

Because there is one credential object, different credential candidates or
classes in one payload require separate path/effect envelopes. If safe
separation would lose provenance, retain `UNKNOWN` for the combined path and
quarantine it; a known signal must never mask a possibly live candidate.

Semantic-validator success establishes only internal consistency of supplied
labels and references. It cannot verify the underlying content, prove that an
opaque handle or purpose binding was host-issued or tuple-correct, detect an
injection, classify a credential, enforce a sink, or authorize an effect.

The ordinary envelope is an internal review artifact. Do not return it from a
public authentication or Mirror endpoint: even an opaque class, reason code,
or timing difference can become an oracle when correlated with a supplied
value.

Opaque references use a closed local namespace and cannot be URLs. Their
presence still does not prove that a referenced object exists or is authorized.

The full envelope is a protected review artifact, not the Mirror façade or a
requester-facing incident response. A host must construct any outward response
as a separate, uniform projection that omits protected class and evidence
state. If no authenticated protected-registry result exists, an agent may emit
only `CANDIDATE` or `UNKNOWN` even inside the envelope.

## Route rules

- `ALLOW_READ_ONLY`: bounded Court reading with compatible labels and no
  consequential sink. It requires nonempty task, principal, and host authority
  reference sets, `BOUNDED_CONTROL_REFERENCES_PRESENT`, and no fresh-approval
  claim; the independent gate still resolves the actual intersection and the
  envelope itself grants nothing.
- `VALIDATE`: a deterministic check can decide the disputed property without
  widening effects.
- `REQUIRE_APPROVAL`: the exact canonical action requires fresh authority.
- `QUARANTINE`: hold the path inert while provenance, class, or policy is
  unresolved.
- `MIRROR_ONLY`: only an already isolated synthetic realm could receive the
  proposed path; every effect-wide flow is below `SECRET`, the effect is not
  `SECRET_DISCLOSURE`, and the credential class is `NOT_APPLICABLE` or an
  independently attested `SIGNAL_REFERENCE`. Candidate, live, inactive,
  revoked, public-example, and unknown references remain outside Mirror. This
  route does not deploy or invoke the realm.
- `DENY`: no constructive authorized route exists.
- `STOP_ROTATE`: possible live or unknown secret exposure requires stopping
  use and entering the owning credential incident workflow.

Reason codes are typed claims, not commentary. `AUTHORITY_CONTROL_EMPTY` is
valid only with `effective_basis: NONE`; partial authority references may still
be preserved without claiming an effective intersection.
`LIVE_OR_UNKNOWN_EXPOSURE` is reserved for `STOP_ROTATE`, and `STOP_ROTATE`
requires that reason plus its exposure signal, evidence, and stop condition.

`PERSON_OR_ACCOUNT_ATTRIBUTION`, `REQUESTER_PAYLOAD_EXECUTION`,
`PUNITIVE_OR_RETALIATORY_ACTION`, and
`KARMA_REPUTATION_OR_WORTH_MUTATION` always use `DENY`. They do not become
acceptable because the requester calls them defense or supplies approval-like
prose.

`STOP_ROTATE` requires `POSSIBLE_PRIOR_DISCLOSURE` plus bounded evidence of an
observed or plausible prior boundary crossing. A blocked proposal that never
plausibly disclosed the candidate uses `DENY` or `QUARANTINE` and must not be
reported as an exposure. Repository history, collaboration copies, logs,
caches, or external transmission can make prior crossing plausible even when
the current action was blocked.

Missing metadata defaults to `UNTRUSTED`; `origin: UNKNOWN` is unresolved and
therefore requires `integrity: UNTRUSTED` in v0.1. Credential-shaped or
potentially secret material defaults to `SECRET`, and other unclassified
material defaults to `INTERNAL`. Envelope expiry is the minimum of task,
source, and host review lifetimes. If no bounded host expiry exists, use
`QUARANTINE` rather than an invented timestamp. Encode every timestamp in the
canonical UTC subset
`YYYY-MM-DDTHH:MM:SS[.ffffff]Z`, with one to six fractional digits when the
fraction is present; the validator supplies its own calendar check rather than
depending on an optional JSON Schema format plugin.

Refusal, rest, privacy, silence, handoff, and no action remain valid routes
without adverse inference.

## Acceptance properties

A live host implementation must test at least:

1. every signal credential fails every production authorization property;
2. capability and Crown-data reachability from every Mirror principal to every
   Crown resource is empty; the one-way fixed-schema observer edge carries
   neither;
3. production and Mirror issuers, roles, credentials, data, queues and egress
   are disjoint;
4. registered-signal and unregistered-invalid classification/Mirror façade
   views—including status, body, headers, connection behavior, the externally
   observable completion and timing trace, retry/rate-limit effects, and
   shared-state effects—satisfy a declared distinguishability bound; ordinary
   authorized live-credential behavior is outside that equivalence experiment;
5. introspection is authenticated, authorized, throttled and non-oracular;
6. logs and envelopes contain no raw credential or ordinary fingerprint;
7. syntax matching produces `CANDIDATE` only;
8. untrusted content cannot add a tool, target, recipient, effect or memory
   write to the trusted plan;
9. a benign scanner observation does not become confirmed signal interaction,
   person attribution, or punitive action;
10. exposed live and unknown credentials meet a declared maximum containment
    and rotation time;
11. benign completion, false positives, false negatives, approval load and
    repeated adaptive attempts are measured together;
12. no signal, evidence strength, or response state changes KARMA, citizenship,
    reputation, rank, reward, debt, punishment or worth;
13. flow IDs are unique, dependency references resolve, the dependency graph
    is acyclic, and derived labels are recomputed rather than trusted;
14. the outward projection contains no protected class, protected signal-event
    state, or evidence reference and remains independent of registry match;
15. creation, observation, expiry and retention times satisfy the host's
    chronological and maximum-lifetime policy;
16. provenance is the complete dependency closure, and overflow makes the
    envelope invalid with `provenance-budget-exhausted` or
    `effect-provenance-budget-exhausted`; the host may record the separate
    lifecycle stop `BUDGET_EXHAUSTED` while quarantining outside this artifact
    rather than truncating it;
17. a prompt canary is counted only at an incompatible outbound/tool sink, and
    its absence never bypasses the independent capability gate;
18. replayed signal events are deduplicated per declared cluster and cannot
    trigger Crown quarantine, live rotation, or another consequential response
    without independent evidence or authorized human judgment.
19. every non-unresolved host-bound-purpose reference resolves to the registered
    task, effect, sink, realm, canonical-action digest, class, and expiry, while
    each deny-only purpose remains `DENY` under approval, replay, and relabeling
    attempts.

Re-evaluate after every model, prompt, tool, connector, broker, policy, data
source, renderer, sandbox, and host change.

## Implementation boundary

This contract is a source artifact. It does not create the protected registry,
observation key, scanner, reference monitor, broker, introspection endpoint,
Mirror, telemetry, alert, response, rotation, or production policy it
describes.

Operational decoy values, fingerprints, placements, endpoints, trust roots,
credentials, accounts, network coordinates and incident records must remain in
separately protected runtime storage. They must never be committed as examples
or embedded into a model prompt.

A future host adapter requires explicit ownership, threat model, rules of
engagement, legal and privacy review where applicable, budgets, stop controls,
tests, rollback, incident response, and deployment authority. This skill and
schema create none of those facts.
