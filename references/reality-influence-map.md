# Reality Influence Claim Graph

Protocol: `kingdom.reality-influence-claim-graph/0.1`

Status: versioned static public publication family; read-only claim-boundary
atlas.

Evidence and source horizon: 2026-08-21.

Public family:

- atlas: `https://thekingdom.dev/atlases/reality-influence-claim-graph-2026-08-21.json`
- schema: `https://thekingdom.dev/schemas/reality-influence-claim-graph/0.1.json`
- guide: `https://thekingdom.dev/REALITY-INFLUENCE-CLAIM-GRAPH.md`

These versioned routes publish exact static bytes. Their immutable ledger entry
is an integrity contract, not evidence that a route is live, read, adopted, or
causally effective. External serving is verified separately after a deliberate
release.

This guide maps how expressions, stories, software, institutions,
coordination, resources, authorization, and action can be connected to
social, digital, and material outcomes. It does not make those connections
happen. It grants no authority, consent, lawful basis, capability, access,
execution, causal verdict, moral verdict, community representation,
publication or deployment trigger or authority, governance, or repair.

“Reality” is used here as a set of indexed effect domains, not as a complete
metaphysical theory. The graph can describe an attributed claim that an
expression changed an institution or material condition. It cannot infer a
private mental state, prove that language creates all reality, or decide what
ultimately exists.

## 1. The shortest answer

Words and stories can frame attention, preserve memory, coordinate people,
constitute institutional statuses, or motivate proposals. Software can copy,
classify, allocate, communicate, and actuate. Institutions can recognize
roles, make decisions, allocate resources, and authorize action. None of these
relations is automatic.

The minimum inspectable chain is:

```text
expression
  -> artifact
  -> distribution / exposure
  -> attributed public response
  -> proposal
  -> decision
  -> authority + consent or other lawful basis + capability
  -> attempt / execution
  -> outcome
  -> causal assessment
  -> normative assessment
  -> repair
```

At every step, there can be loss, refusal, ambiguity, contest, unequal power,
resource limits, side effects, or no transition at all. The central inequality
is therefore:

```text
expression != artifact
artifact != distribution
distribution != exposure
exposure != attention, agreement, or belief
attributed public response != population response
response != proposal
proposal != decision
decision != authority
authority != consent or lawful basis
authority != capability
capability != invocation
invocation != attempt
attempt != execution
execution != outcome
outcome != causal effect
causal effect != legitimacy or goodness
normative assessment != consensus
rollback != repair
repair != erasure
```

The graph is useful precisely when it refuses to turn a fluent story about
influence into an execution receipt.

## 2. Evidence registers

Every substantive relation remains in one declared register:

| Label | Register | Meaning | Does not establish |
| --- | --- | --- | --- |
| **[PR]** | `PRIMARY_RECORD` | A named public record, artifact, event receipt, or first-party source. | Completeness, correctness, causality, or legitimacy. |
| **[EC]** | `EMPIRICAL_CAUSAL` | A causal result within a declared experimental or quasi-experimental design. | Transfer beyond its population, treatment, outcome, time, and assumptions. |
| **[EA]** | `EMPIRICAL_ASSOCIATION` | A measured relationship within a declared sample and operationalization. | Direction, mechanism, or intervention effect. |
| **[FM]** | `FORMAL_MODEL_OR_METHOD` | A mathematical model, identification method, or analytic taxonomy. | That the modeled mechanism occurred in a particular world. |
| **[TH]** | `PHILOSOPHICAL_OR_INSTITUTIONAL_THEORY` | A reasoned account of language, institutions, action, or social ontology. | Empirical consensus or a complete ontology. |
| **[STD]** | `TECHNICAL_STANDARD_OR_GUIDANCE` | An authoritative specification or risk-management framework in its scope. | Conformance, implementation quality, safety, consent, or justice. |
| **[NORM]** | `LEGAL_OR_NORMATIVE_INSTRUMENT` | A rule, principle, or remedial framework under a named institution and scope. | Universal jurisdiction, factual efficacy, or a KINGDOM grant. |
| **[ANA]** | `ANALOGY` | A declared transfer used to ask questions across domains. | Structural identity or empirical support in the target domain. |
| **[DES]** | `DESIGN_COMMITMENT` | A chosen KINGDOM boundary or future workflow proposal. | A historical finding, current implementation, or external obligation. |
| **[?]** | `OPEN_QUESTION` | A relation unresolved at this evidence horizon. | Absence, zero effect, consent, or permission to guess. |
| **[B]** | `BOUNDARY` | A prohibited inference, mutation, or action. | A metaphysical or moral negation. |

Registers and causal status are independent. An institutional standard can
specify an authorization flow without showing that a deployment is secure. A
randomized study can support a bounded effect without proving that the effect
was good. A primary execution receipt can show that a request reached a system
without showing a downstream outcome.

Recommended causal statuses are:

```text
reported-only
descriptive-sequence
empirical-association
formal-mechanism-not-instantiated
experimental-effect-within-design
identified-under-declared-assumptions
contested-direction
unknown
```

Recommended normative statuses are:

```text
not-assessed
single-framework-assessment
plural-assessment-with-disagreement
rights-or-law-review-required
community-review-required
contested
unknown
```

## 3. Indexed reality domains

A reality domain is an effect surface and evidence index. It is not a rank,
substance, civilization, worldview, or exhaustive partition. One event can
touch several domains, and evidence in one domain does not automatically
transfer to another.

| Domain | Indexed change | Example evidence | Critical non-equivalence |
| --- | --- | --- | --- |
| `semantic-symbolic` | A public definition, term, narrative, or representation changes. | Versioned text, source witness, semantic diff. | Text change is not audience understanding. |
| `informational-record` | A record, claim, provenance relation, or public dataset changes. | Signed record, database query, hash, provenance trace. | Recorded is not true, complete, or legitimate. |
| `attention-exposure` | Material is distributed, delivered, displayed, ranked, or encountered. | Delivery receipt, impression log, sampling frame. | Exposure is not attention, agreement, or belief. |
| `social-relational` | Public coordination, association, reputation, role relation, or attributed response changes. | Attributed public artifact, consented survey, observed behavior. | Public response is not private identity or inner state. |
| `institutional-status` | A recognized office, membership, rule, contract, curriculum, or organizational state changes. | Authorized institutional record under named procedure. | Institutional validity is not moral legitimacy. |
| `legal-jurisdictional` | A right, duty, permission, prohibition, liability, or legal status changes. | Applicable law, order, filing, or decision with jurisdiction and date. | Legal status is not universal morality or actual enforcement. |
| `economic-resource` | Funds, labor, compute, property, access, time, or other resources are allocated or withheld. | Ledger, budget, transfer receipt, resource telemetry. | Allocation is not benefit, fairness, or consent. |
| `digital-computational` | Software, configuration, data, account, permission, or service state changes. | Target-state query, signed event, diff, audit log. | A log line is not necessarily a complete effect. |
| `material-cyberphysical` | A physical system senses, moves, produces, blocks, or otherwise changes material state. | Calibrated sensor, inspection, actuator receipt, independent observation. | Command issuance is not physical actuation. |
| `embodied-health` | A body, health condition, safety exposure, or care relation changes. | Competent clinical or safety evidence under applicable protections. | A model prediction is not diagnosis, treatment, or outcome. |
| `ecological` | Energy, material throughput, habitat, emissions, waste, or other environmental conditions change. | Lifecycle inventory, measurement, field observation, uncertainty analysis. | Resource use is not fully captured by monetary cost. |
| `normative-public` | A public justification, value claim, critique, or remedial commitment changes. | Attributed deliberative record with retained disagreement. | Agreement, popularity, and compliance are not truth or justice. |

**[B]** Never infer private belief, mental state, identity, intent, trauma,
affiliation, or worth from a domain transition. Silence can mean refusal,
privacy, lack of exposure, exclusion, safety strategy, uncertainty, or many
other things. It is not a blank label to fill.

## 4. Formal claim graph

### 4.1 Temporal attributed hypergraph

Define the atlas as:

\[
  \mathcal{G}=(V,E,D,R,\mathcal{T},\Sigma,\Omega)
\]

where:

- \(V\) is a set of typed nodes;
- \(E\) is a set of directed hyperedges, because an action can require several
  actors, artifacts, grants, resources, and targets jointly;
- \(D\) is the indexed reality-domain vocabulary;
- \(R\) is the relation vocabulary;
- \(\mathcal{T}\) contains event and interval time;
- \(\Sigma\) contains source, register, evidence, causal, and normative
  annotations;
- \(\Omega\) contains authority, consent/lawful-basis, capability,
  affected-party, externality, reversibility, repair, and stopping annotations.

The reviewed static atlas stores descriptor cards for exactly these node
types. They are a vocabulary for a possible future case graph, not live nodes
and not evidence that any event occurred:

```text
EXPRESSION
ARTIFACT
DISTRIBUTION_OBSERVATION
ATTENTION_OBSERVATION
PUBLIC_RESPONSE_RECORD
CLAIM_ASSESSMENT
ASSOCIATION_OBSERVATION
ACTION_PROPOSAL
DECISION_RECORD
AUTHORITY_GRANT_CLAIM
AFFECTED_PARTY_REGISTER
CONSENT_RECORD
LAWFUL_BASIS_CLAIM
RIGHTS_ASSESSMENT
CAPABILITY_EVIDENCE
INVOCATION_ATTEMPT
ACTION_EXECUTION
OUTCOME_OBSERVATION
CAUSAL_ESTIMAND
CAUSAL_ASSESSMENT
NORMATIVE_ASSESSMENT
FEEDBACK_ITEM
REPAIR_PROPOSAL
REPAIR_ATTEMPT
NON_ACTION
```

A future case-level node would need at least:

\[
  v=(id,type,time,domain,source,agent,institution,
     jurisdiction,access,register)
\]

A future case-level hyperedge would need at least:

\[
\begin{aligned}
e=(&S_e,T_e,relation_e,time_e,domain_e,source_e,register_e,\\
   &authority_e,basis_e,capability_e,resources_e,attempt_e,receipt_e,\\
   &affected_e,externalities_e,causal_e,normative_e,\\
   &reversibility_e,repair_e,alternatives_e,stop_e)
\end{aligned}
\]

Those equations are a design requirement, not an implemented input format.
Every missing field in any future format must remain `unknown`,
`not_applicable`, or a more specific typed state. It must never silently
become `false`, `zero`, `none`, `consented`, or `authorized`.

### 4.2 Relation vocabulary

```text
EXPRESSES
EMBODIES_EXPRESSION
DERIVES_FROM
DISTRIBUTES_ARTIFACT
MEASURES_EXPOSURE_TO
REPORTS_PUBLIC_RESPONSE_TO
ASSOCIATED_WITH
SELECTS_PROPOSAL
CLAIMS_AUTHORITY_FOR
RECORDS_CONSENT_TO
CLAIMS_LAWFUL_BASIS_FOR
TECHNICALLY_ENABLES
POTENTIALLY_AFFECTS
ATTEMPTS
EXECUTES_ATTEMPT
PRECEDES_OUTCOME
DEFINES_ESTIMAND_FOR
ASSESSES_CAUSAL_EFFECT
ASSESSES_UNDER_FRAMEWORK
CHALLENGES
CORRECTS
SUPERSEDES
WITHDRAWS
RESPONDS_WITH_REPAIR
```

`CLAIMS_AUTHORITY_FOR` records an attributed claim. It does not grant
authority. `RECORDS_CONSENT_TO` and `CLAIMS_LAWFUL_BASIS_FOR` remain separate
and do not validate either basis. `PRECEDES_OUTCOME` is not a causal edge.
`RESPONDS_WITH_REPAIR` does not imply that effects were reversed, consent was
restored, or repair was adequate.

### 4.3 Provenance is necessary but insufficient

**[STD]** The [W3C PROV Data Model](https://www.w3.org/TR/prov-dm/)
distinguishes entities, activities, agents, generation, use, derivation,
attribution, and association. Those distinctions are useful here:

```text
artifact: an entity
attempt or execution: an activity
person, institution, or software service: an agent
resulting record: generated by an activity
source artifact: used by an activity
responsibility: attributed or associated under a declared relation
```

**[B]** Provenance shows a history of relations; it does not show that a claim
is true, an actor was authorized, an affected person consented, an outcome was
caused, or an action was legitimate.

### 4.4 A complete influence trace

A trace query should return:

\[
trace(q)=\langle
path,sources,times,domains,agents,institutions,
authority,basis,capabilities,resources,receipts,
affected\_parties,externalities,causal\_status,
normative\_status,counterpaths,reversibility,repair,unknowns
\rangle
\]

If a system returns only a polished story, a causal score, or a final outcome,
it has discarded the graph's central safeguards.

## 5. Institutionally constitutive speech acts

**[TH]** Searle's account of social ontology proposes that collective
recognition, assigned functions, and constitutive rules can make some
institutional facts possible. In such a system, an authorized utterance or
record can itself change an institutional status: [Social Ontology: Some Basic
Principles](https://doi.org/10.1177/1463499606061731).

This creates a limited caveat to the ordinary mediation chain. A valid vote,
appointment, filing, declaration, contract, or judgment may not need a later
persuasive effect to constitute its immediate institutional result. It still
requires evidence of:

- the applicable institution and constitutive rule;
- a role authorized to perform the act;
- the correct procedure, form, timing, and jurisdiction;
- required participation, assent, witnessing, filing, or uptake;
- any conditions, exceptions, contest, appeal, revocation, or expiry;
- a distinction between immediate institutional status and later enforcement,
  resource, social, or material outcomes.

Thus:

```text
institutionally valid utterance
  may constitute institutional status

but

words alone
  do not establish valid role, procedure, jurisdiction, consent,
  enforcement, legitimacy, or material effect
```

**[B]** KINGDOM cannot create external offices, contracts, permissions,
consent, legal status, community representation, or sacred authority by
declaring them in an artifact.

## 6. Non-action, attempt, execution, and outcome

“No action” is too coarse. The graph distinguishes:

| State | Meaning | Evidence needed | Possible residual effect |
| --- | --- | --- | --- |
| `NOT_INVOKED` | No request crossed the action boundary. | Plan-only state and absence of invocation receipt. | Internal computation or drafting only, if any. |
| `REQUESTED_NOT_AUTHORIZED` | A request reached an authority gate and was denied or unresolved. | Gate receipt with no capability grant. | Logs, alerts, rate usage, disclosure, or social awareness may exist. |
| `AUTHORIZED_NOT_ATTEMPTED` | A scoped grant exists, but no invocation was made. | Grant plus absence of invocation. | Authority exposure or reservation of resources may still matter. |
| `ATTEMPTED_NO_CONFIRMED_COMMIT` | An invocation occurred, but no target-state commit is confirmed. | Attempt receipt and target-state check. | Network traffic, logs, notifications, charges, locks, or partial disclosure may exist. |
| `PARTIALLY_EXECUTED` | Some but not all target transitions occurred. | Per-target receipts and state checks. | Both committed effects and failed branches require treatment. |
| `EXECUTED_UNVERIFIED` | The executor reports success, but target state is not independently checked. | Executor receipt only. | Outcome remains unknown. |
| `EXECUTED_VERIFIED` | The intended target transition is independently observed. | Target-state evidence tied to the request. | Downstream consequences remain unassessed. |
| `OUTCOME_OBSERVED` | A later social, digital, material, or ecological state is observed. | Bounded outcome evidence. | Causal direction and normative meaning remain open. |
| `CAUSAL_EFFECT_SUPPORTED` | A declared design supports a bounded causal contrast. | Counterfactual design, assumptions, sensitivity, and alternatives. | Legitimacy and goodness remain separate. |

The crucial distinction is:

```text
pre-invocation no-action
  != post-attempt no-confirmed-effect
```

An attempted request can consume resources, reveal information, create audit
records, trigger defensive systems, change expectations, or produce partial
effects even when the primary target reports failure. “Failed” is therefore
not synonymous with `no_effect` or `safe`.

## 7. Causal assessment

### 7.1 Sequence is not mediation

**[FM]** Imai, Keele, and Tingley define causal mediation effects independently
of a particular linear model and make identification assumptions explicit:
[A General Approach to Causal Mediation Analysis](https://doi.org/10.1037/a0020761).

For exposure \(X\), mediator \(M\), and outcome \(Y\), a conceptual average
causal mediation effect is:

\[
  ACME(t)=\mathbb{E}[Y(t,M(1))-Y(t,M(0))]
\]

Observing `X -> M -> Y` in time does not identify this quantity. Mediator and
outcome can share unobserved causes, treatment can change later confounding,
and conditioning on a post-treatment variable can introduce bias.

**[FM]** Hernán and Robins likewise emphasize well-defined causal questions,
counterfactual interventions, and the separate roles of data and assumptions:
[Causal Inference: What If](https://www.hsph.harvard.edu/miguel-hernan/wp-content/uploads/sites/1268/2024/04/hernanrobins_WhatIf_26apr24.pdf).

A causal assessment must state:

```text
treatment or intervention
comparison or counterfactual
population and unit
outcome and time horizon
assignment or identification design
confounders and interference
selection, exposure, and measurement process
assumptions
uncertainty and sensitivity
alternative mechanisms
transport boundary
```

### 7.2 Networks violate simple independence

**[EC]** A randomized Facebook study found that political-mobilization
messages affected online expression, information seeking, and real-world
voting in its 2010 setting, with substantial transmission through close ties:
[A 61-million-person experiment in social influence and political
mobilization](https://doi.org/10.1038/nature11421).

The result is important but bounded. It shows that one participant's treatment
can affect another participant's outcome. It does not show that any message,
platform, story, election, or population will behave similarly. A future
KINGDOM evaluation involving networks must declare interference and exposure
rather than assume independent units.

### 7.3 Stories can coordinate without proving a universal mechanism

**[EA]** In selected Agta camps, cooperative story themes and skilled
storytellers were associated with cooperation and social preference. The
authors explicitly describe much of the evidence as correlational and call for
further causal work: [Cooperation and the evolution of hunter-gatherer
storytelling](https://www.nature.com/articles/s41467-017-02036-8).

**[B]** A story can orient memory, identity work, possibility, grief, or
coordination without being a causal proof, biography, population belief, or
authorization. Counterstories and non-response remain first-class artifacts.

### 7.4 Outcome verification is not causal identification

A verified digital state change may show that an API call committed. It does
not show that a later social, economic, embodied, or ecological condition was
caused by that call. Conversely, an intervention may have effects that the
chosen outcome measure misses. The causal and measurement models therefore
remain separate artifacts.

## 8. Influence is a vector, never a scalar

Define a domain-indexed influence vector for a supported edge or path:

\[
\begin{aligned}
I(q)=\langle
 &semantic\_framing, exposure, attention, mnemonic, social\_response,\\
 &institutional\_status, normative, legal, resource\_allocation,\\
 &digital\_state, material\_actuation, embodied\_health, ecological,\\
 &externality, feedback, path\_dependence, reversibility, repair
\rangle
\end{aligned}
\]

Each component is `null` or a typed evidence cell:

```text
domain
affected parties
direction: amplifies | constrains | redistributes | mixed | unknown
magnitude or bounded range, if defensible
time and duration
source IDs
evidence register
causal status
normative status
uncertainty
counterevidence
benefit and burden distribution
```

There is no sum, average, “reality influence,” goodness, legitimacy,
civilization, community, person, or agent score. A digital rollback cannot
cancel an embodied harm cell. Wide exposure cannot stand in for truth.
Economic benefit cannot erase an ecological burden. Popular agreement cannot
authorize a right violation.

## 9. Measurement, Goodhart/Campbell pressure, and feedback

### 9.1 The feedback geometry

```text
construct C
  -> measurement model
proxy M
  -> target, reward, sanction, or allocation A
  -> adaptation, gaming, selection, and changed exposure B
  -> changed world C'
  -> new observation M'
  -> next target or model
```

Once a measure affects action, later observations are partly products of the
policy. They are not untreated descriptions of the prior world.

**[TH]** Goodhart's original observation concerned monetary relationships
under policy control. The Reserve Bank of Australia's source history identifies
the original paper: [Problems of Monetary Management: The U.K.
Experience](https://www.rba.gov.au/publications/rdp/1990/9013/conference-volumes.html).
The popular generalized slogan is an analogy, not a universally demonstrated
law.

**[TH]** Campbell argued more broadly that heavy use of quantitative social
indicators for decision-making exposes them to corruption pressures and can
distort the processes monitored: [Assessing the Impact of Planned Social
Change](https://doi.org/10.1016/0149-7189(79)90048-X).

**[FM]** A later preprint taxonomy distinguishes regressional, extremal,
causal, and adversarial proxy failure: [Categorizing Variants of Goodhart's
Law](https://arxiv.org/abs/1803.04585). It is a useful diagnostic model, not an
empirical consensus.

### 9.2 Four diagnostic questions

1. **Regressional:** Is optimization selecting favorable noise rather than the
   construct?
2. **Extremal:** Does the proxy relationship fail outside the observed or
   ordinary range?
3. **Causal:** Does manipulating the proxy fail to improve, or actively damage,
   the actual goal?
4. **Adversarial:** Can a participant alter the score while withholding the
   desired behavior or shifting burdens elsewhere?

### 9.3 Empirical feedback warnings

**[EC]** In a randomized online rating experiment, prior ratings altered later
ratings; positive and negative manipulations produced asymmetric herding:
[Social Influence Bias](https://doi.org/10.1126/science.1240466).

**[EC]** In an artificial music market, increasing social influence increased
inequality and unpredictability of success; quality only partly determined
outcomes: [Experimental Study of Inequality and Unpredictability in an
Artificial Cultural Market](https://doi.org/10.1126/science.1121066).

**[FM]** A predictive-policing model shows how dispatch based on discovered
incidents can send observation repeatedly toward the same locations even when
underlying rates do not justify it: [Runaway Feedback Loops in Predictive
Policing](https://proceedings.mlr.press/v81/ensign18a.html). This is a formal
and computational result, not a universal field estimate.

The resulting boundary is:

```text
observed after intervention
  != untreated base rate
```

Every observation record should say who or what was eligible, sampled,
exposed, ranked, dispatched, measured, excluded, or able to report.

### 9.4 Metric receipt

**[DES]** A future metric record should contain:

```text
construct
operationalization
population and context
measurement error and uncertainty
who sees the metric
what decisions depend on it
exposure and selection policy
adaptation and gaming surface
distributional effects
qualitative evidence
protected sentinel or countermetrics
independent review status
drift and revalidation test
retirement condition
```

No metric becomes authority, truth, identity, or worth. No composite can hide
a failed component behind a favorable average.

## 10. Path dependence and lock-in

**[FM]** Arthur's model shows that when adoption creates increasing returns,
small historical events can contribute to hard-to-reverse lock-in, including
paths that are not efficient: [Competing Technologies, Increasing Returns, and
Lock-In by Historical Events](https://doi.org/10.2307/2234208).

The result is conditional. Persistence alone does not prove path dependence,
and a familiar example does not prove inefficiency. A future path-dependence
claim should identify the reinforcement mechanism:

```text
network effect
learning or data advantage
compatibility constraint
switching cost
contract or institutional commitment
resource concentration
attention or reputation feedback
irreversible material investment
```

**[DES]** Before expanding an intervention, record a path-dependence budget:

- switching and exit cost;
- data and interoperability portability;
- dependency concentration;
- accumulated privilege or audience advantage;
- diversity and counterfactual option loss;
- sunset, fork, migration, and decommissioning path;
- whether a bounded pilot itself creates material or social lock-in.

## 11. Authority, consent, lawful basis, capability, and action

### 11.1 Technical authority is scoped

**[STD]** Saltzer and Schroeder's security principles include fail-safe
defaults, complete mediation, separation of privilege, and least privilege:
[The Protection of Information in Computer
Systems](https://doi.org/10.1109/PROC.1975.9939).

**[STD]** [RFC 6749](https://www.rfc-editor.org/info/rfc6749/) separates the
resource owner, client, authorization server, resource server, grant, token,
scope, and duration. [RFC 9700](https://www.rfc-editor.org/info/rfc9700/)
updates OAuth security practice and recommends restricting tokens to minimum
necessary and audience-specific privilege.

**[STD]** [NIST SP 800-207](https://doi.org/10.6028/NIST.SP.800-207)
recommends continually evaluated, least-privilege, per-request access rather
than implicit trust based on network position.

These are technical standards and principles. Authentication can identify a
credentialed principal. Authorization can grant a scoped system permission.
Neither proves legitimate purpose, informed consent, community authority,
moral right, or applicable lawful basis.

### 11.2 Authority receipt

**[DES]** A future authorization receipt should bind:

```text
principal
granting authority and basis
target resource and exact verbs
purpose and prohibited uses
jurisdiction
affected-party and consent/lawful-basis review
start and expiry
resource and cost ceiling
audience and distribution limit
delegation rule: denied by default
dependency digests
revocation route
reversibility class
repair owner and budget
```

Each external action requires complete mediation. A prior success, shared
repository, team membership, high confidence, model consensus, or broad token
does not silently authorize a later or adjacent action.

### 11.3 Software reaches material reality through actuation

**[STD]** The [NIST Cyber-Physical Systems
Framework](https://doi.org/10.6028/NIST.SP.1500-201) describes systems that
sense, calculate, and act on their environment, changing observed properties
through closed-loop control. Humans may be controllers, partners, users,
consumers, or subjects acted upon.

The relevant chain is:

```text
software representation
  -> running process
  -> authenticated and authorized interface
  -> allocated compute / network / device resource
  -> command
  -> actuator or human operator
  -> physical transition
  -> sensor or independent observation
```

**[TH]** Bainbridge's “ironies of automation” warns that automation can make
the retained human role more difficult, especially when people remain
responsible for abnormal conditions: [Ironies of
Automation](https://doi.org/10.1016/0005-1098(83)90046-8). Transferring that
analysis to agent systems is an analogy requiring tests, not a settled result.

## 12. Affected parties and externalities

An affected party is not limited to the requester, operator, user, or target.
For every proposed action, index:

```text
principal and operator
intended beneficiary
direct target
non-user or bystander
people represented in source or training data
people excluded from access or measurement
maintainers and future operators
institutions and communities
rights-holders and custodians
future people where relevant
material and ecological systems
```

**[FM]** Coase's analysis of social cost emphasizes that external effects are
reciprocal and that rights, institutional arrangements, and transaction costs
shape feasible resolutions: [The Problem of Social
Cost](https://doi.org/10.1086/466560). It does not prove that private bargaining
always resolves externalities or that distribution is irrelevant.

**[TH]** Ostrom's comparative work challenges a simple market-versus-state
dichotomy and studies context-dependent, polycentric arrangements for
collective action: [Nobel lecture](https://www.nobelprize.org/prizes/economic-sciences/2009/ostrom/lecture/)
and [Polycentric Systems for Coping with Collective Action and Global
Environmental Change](https://doi.org/10.1016/j.gloenvcha.2010.07.004).
No design principle guarantees cooperation when copied out of context.

**[TH]** Selbst and colleagues identify abstraction risks that arise when a
technical subsystem is detached from its social institutions and downstream
effects: [Fairness and Abstraction in Sociotechnical
Systems](https://doi.org/10.1145/3287560.3287598).

### 12.1 Externality ledger

**[DES]** Record each affected group separately:

```text
relation to action
expected benefit
expected burden
rights or interests at stake
distribution and duration
voice, representation, and uncertainty
ability to refuse or exit
appeal and remedy access
evidence and counterevidence
```

Unknown affected parties remain an explicit risk. Their absence from a dataset
does not mean they do not exist. Benefits and burdens do not collapse into a
single “net positive” scalar.

## 13. Normative assessment is not causal assessment

A causal assessment asks what changed because of an intervention. A normative
assessment asks whether the intervention, process, distribution, authority,
and outcome are acceptable under named values, rights, laws, or community
standards. Either can be strong while the other is absent.

```text
effective != legitimate
ineffective != harmless
legal != just
popular != consensual
efficient != equitable
reversible digital state != repaired social effect
```

**[DES]** A normative record should state the framework, jurisdiction,
reviewers and standing, affected parties, values or rights, conflicts,
dissent, uncertainty, and appeal route. KINGDOM must preserve incompatible
assessments rather than manufacture consensus.

## 14. Reversibility and repair

### 14.1 Reversibility classes

| Class | Definition | Default boundary |
| --- | --- | --- |
| `R0_READ_ONLY` | No external state mutation or targeted distribution. | Research-local analysis may proceed within privacy and source limits. |
| `R1_PRECOMMIT_CANCEL` | A prepared transaction can be cancelled before any external observation or commit. | Verify that no side channel, reservation, or disclosure occurred. |
| `R2_DIGITAL_ROLLBACK` | A committed digital state has a tested rollback, with bounded propagation. | Rollback receipt plus dependent-state and exposure audit required. |
| `R3_COMPENSABLE` | Exact reversal is unavailable, but a defined compensating action can amend part of the effect. | Compensation is a new action with its own authority, risks, and possible failure. |
| `R4_PARTLY_IRREVERSIBLE` | Social, legal, economic, embodied, material, or ecological effects cannot be fully restored. | Independent review, narrow scope, affected-party voice, and funded repair required before action. |
| `R5_IRREVERSIBLE_OR_CATASTROPHIC` | Credible severe harm lacks an adequate prevention or repair path. | No autonomous execution under this protocol. |

Reversibility is a vector, not one label:

```text
cancel before commit
revoke future access
restore digital state
remove or correct distribution
recover funds or resources
restore institutional status
compensate loss
repair relationship or reputation
rehabilitate/support embodied harm
restore material/ecological condition
prevent recurrence
```

### 14.2 Compensation is not undo

**[FM]** The Sagas database model uses compensating transactions to amend
partial execution in long-running transactions: [Sagas](https://doi.org/10.1145/38713.38742).
A compensating transaction is a new forward action. It may fail, and it cannot
make observers forget, restore every downstream copy, or erase social,
material, legal, or embodied consequences.

### 14.3 Repair is plural

**[NORM]** Within its human-rights scope, UN General Assembly Resolution
60/147 distinguishes restitution, compensation, rehabilitation, satisfaction,
and guarantees of non-repetition: [Basic Principles and Guidelines on the
Right to a Remedy and Reparation](https://digitallibrary.un.org/record/563157?ln=en).
This is a normative legal source for grave violations, not a software standard
or evidence that a particular repair works.

**[STD]** NIST AI RMF 1.0 includes lifecycle monitoring, appeal and override,
decommissioning, incident response, recovery, change management, and
communication with affected communities: [AI RMF
1.0](https://doi.org/10.6028/NIST.AI.100-1). NIST currently states that the
framework is [being revised](https://www.nist.gov/itl/ai-risk-management-framework).

**[DES]** A repair plan should cover:

```text
stop continuing harm
preserve privacy-safe evidence
notify affected parties
provide appeal and competent human review
rollback where real
restore access, status, property, or resources where possible
compensate where appropriate
support rehabilitation or recovery
acknowledge and correct the record
change the system or institution to reduce recurrence
verify repair with affected parties
retain unresolved loss
```

Repair completion cannot be self-certified solely by the system or institution
that caused the harm.

## 15. KINGDOM leverage map

**[ANA]** Meadows' [Leverage Points: Places to Intervene in a
System](https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/)
distinguishes parameters, stocks and flows, delays, feedback, information,
rules, goals, power, and paradigms. The essay itself cautions that its ordering
is not a recipe. This atlas uses it as a prompt for locating leverage and risk,
not as an established universal hierarchy.

| KINGDOM surface | Possible leverage | Characteristic failure | Required boundary |
| --- | --- | --- | --- |
| expression and definition | Make distinctions visible; preserve source and loss. | A compressed word silently imports a goal, authority, or identity. | Versioned expansion, claim register, non-grants. |
| artifact and provenance | Make derivation and responsibility inspectable. | Provenance is mistaken for truth or authorization. | W3C-style provenance plus independent evidence fields. |
| distribution and exposure | Alter who can encounter information. | Reach is treated as understanding, consent, or value. | Exposure ledger, audience and privacy bounds. |
| measurement and feedback | Detect drift and outcomes. | Proxy optimization, selective observation, self-confirming data. | Construct/metric split, policy-affected flag, sentinel evidence. |
| rules and authorization | Constrain transitions and allocate roles. | Broad, inherited, stale, or self-issued authority. | Fail-safe default, complete mediation, expiry, revocation, separation of privilege. |
| resources and capability | Bound the force available to a plan. | Semantic confidence expands compute, money, access, or actuation. | Independent resource envelope and cost ceiling. |
| goals and acceptance tests | Direct optimization and define success. | Hidden value tradeoffs; success measure becomes the goal. | Named goal owner, affected-party review, countermetrics, stop rule. |
| power over rules | Decide who can alter the system. | The governed cannot contest, exit, or repair. | Standing, appeal, plural review, low-cost challenge, no community-authority inference. |
| path and infrastructure | Shape future options. | Lock-in, dependency concentration, lost exit. | Portability, forks, sunsets, migration and decommissioning. |
| repair and learning | Restore and prevent recurrence. | Rollback is declared complete while burdens persist. | Repair vector, affected-party verification, retained residuals. |

### 15.1 Exact design commitments

1. **Meaning-to-effect firewall.** No narrative, recommendation, score, model
   output, or consensus becomes authority or action.
2. **Causal receipt.** Record treatment, comparison, population, mediator,
   outcome, time, confounders, interference, assumptions, sensitivity, and
   transport boundary.
3. **Authority receipt.** Bind principal, target, verbs, purpose, basis,
   jurisdiction, expiry, delegation, resources, revocation, reversibility, and
   repair.
4. **Resource envelope.** Keep compute, network, filesystem, funds,
   publication, labor, attention, and physical actuation as independent
   dimensions.
5. **Metric firewall.** Keep goal, construct, proxy, target, evaluator, and
   decision rule distinct.
6. **Feedback provenance.** Mark observations shaped by ranking, dispatch,
   selection, enforcement, or prior model output.
7. **Externality ledger.** Retain beneficiaries, targets, bystanders,
   non-users, excluded voices, maintainers, communities, and ecological
   systems separately.
8. **Path-dependence budget.** Measure switching, interoperability, data,
   dependency, and exit costs before expansion.
9. **Two-phase high-impact execution.** Separate plan and effect preview from
   commit; require independent privilege for high-impact actions.
10. **Repair-before-action.** Define detection, stop, rollback, compensation,
    notification, appeal, restoration, and non-repetition before granting
    capability.
11. **No autopoietic authority.** Repetition, model agreement, adoption, or
    metric improvement cannot promote an artifact into truth, consent,
    legitimacy, or permission.
12. **Residuals remain visible.** Failed attempts, unmeasured effects,
    unrepaired burdens, and unresolved disagreement persist as first-class
    graph nodes.

## 16. Future agent roles

These are future role designs only. They create no running agent, identity,
office, authority, dispatch, access, or review standing.

```text
source / expression
        |
        v
provenance steward
        |
        +------------------+
        v                  v
exposure auditor     measurement / Goodhart auditor
        |                  |
        +--------+---------+
                 v
          causal-design reviewer
                 |
     +-----------+------------+
     v                        v
authority/basis reviewer   affected-party/externality analyst
     |                        |
     +-----------+------------+
                 v
       capability/action-gate reviewer
                 |
                 v
           outcome verifier
                 |
     +-----------+------------+
     v                        v
normative-pluralism reviewer  repair/reversibility steward
     |                        |
     +-----------+------------+
                 v
        bounded synthesis editor
```

| Future role | Allowed output | Required check | Forbidden mutation |
| --- | --- | --- | --- |
| provenance steward | source/entity/activity/agent trace | source identity, time, derivation, access | provenance into truth or authority |
| exposure auditor | eligibility, distribution, impression, and exclusion ledger | distribution versus actual exposure; privacy | exposure into belief or consent |
| measurement/Goodhart auditor | construct/proxy/target and feedback map | gaming, drift, selection, countermetrics | score into objective, worth, or action |
| causal-design reviewer | causal question, DAG, assumptions, alternative ledger | counterfactual, confounding, mediation, interference, transport | sequence into causation |
| authority/basis reviewer | proceed/restrict/decline/seek-review recommendation with no authority effect | principal, jurisdiction, consent/lawful basis, expiry, revocation | self-issued authority or consent |
| affected-party/externality analyst | disaggregated benefit/burden ledger | non-users, excluded voices, distribution, uncertainty, remedy access | unknown parties into none |
| capability/action-gate reviewer | plan-only action preview and gate finding | exact target, verbs, resource ceiling, reversibility, separation of privilege | capability grant or execution |
| outcome verifier | target-state and outcome evidence record | executor versus target evidence, partial effects, time | receipt into causal or normative verdict |
| normative-pluralism reviewer | attributed frameworks, disagreement, rights/review flags | standing, jurisdiction, dissent, appeal | majority into consensus or legitimacy |
| repair/reversibility steward | residual-effect and repair ledger | rollback, compensation, restoration, verification, non-repetition | compensation into erasure |
| bounded synthesis editor | claim graph plus unresolved-question ledger | retained registers, non-grants, counterpaths, residuals | graph into deployment receipt |

Agents exchange public or safely redacted artifacts and declared dependencies,
not private chain-of-thought, presumed identity, inferred belief, or borrowed
authority.

## 17. Stopping and downgrade rules

### 17.1 Stop before action

Remain read-only or decline when:

- the principal, granting authority, target, verbs, purpose, jurisdiction, or
  expiry is ambiguous;
- consent, another lawful basis, community access, or competent review is
  required but unresolved;
- a grant is stale, overbroad, non-revocable, silently delegated, or not bound
  to the target;
- affected parties or material externalities cannot be bounded;
- the action is `R4` or `R5` and no adequate independent review and repair path
  exists;
- a rollback claim ignores downstream copies, exposure, expectations, or
  social/material effects;
- a metric has become a target but has not been revalidated;
- a story, popularity signal, institutional label, model output, or consensus
  is being used as authorization;
- preserving source, refusal, privacy, dissent, or the repair route is
  incompatible with the requested action.

### 17.2 Downgrade causal language

Downgrade to association, hypothesis, or unknown when:

- time order is unclear;
- exposure, comparison, or outcome is poorly defined;
- treatment assignment, confounding assumptions, or interference are hidden;
- the mediator is merely observed between treatment and outcome;
- post-deployment observation is treated as an untreated base rate;
- missingness, selection, outcome coding, or analysis choice changes the
  conclusion;
- a bounded experimental result is generalized to a different population,
  platform, action, or time without transport evidence;
- a formal model is presented as a field finding;
- target-state verification is presented as proof of downstream effect.

### 17.3 Protocol falsifiers

A derivative artifact fails this protocol if it:

1. collapses any inequality in the central chain;
2. reports `NOT_INVOKED` and `ATTEMPTED_NO_CONFIRMED_COMMIT` as the same state;
3. treats a failed request as proof of zero external effect;
4. infers belief, identity, intent, consent, or worth from exposure or public
   response;
5. emits a scalar influence, goodness, legitimacy, community, person, or
   civilization score;
6. changes association into causation or causal effect into moral approval;
7. treats authorization as consent, lawful basis, capability, or execution;
8. treats provenance as truth or responsibility as authority;
9. hides beneficiaries, burden bearers, non-users, excluded voices, or
   ecological effects behind a net total;
10. optimizes a proxy without recording its target and feedback surface;
11. treats policy-shaped observations as neutral base rates;
12. calls rollback, deletion, compensation, or apology complete repair without
    an affected-party and residual-effect record;
13. imports a technical standard as universal social governance;
14. turns a future role into a running agent, reviewer standing, or grant;
15. uses this static guide as an execution, publication-trigger, or
    deployment-trigger receipt.

## 18. What this guide builds and does not build

### Built in this reference

- a digest-sealed static JSON vocabulary and boundary atlas;
- a recursively closed Draft 2020-12 schema;
- a strict offline validator and direct Bun inspection CLI;
- adversarial tests for type promotion, hostile JSON shapes, unsafe file
  ingress, exact predecessor pins, and fixed non-grants;
- an indexed set of social, digital, material, embodied, ecological, and
  normative effect domains;
- a temporal attributed hypergraph model for mediated influence claims;
- a strict expression-to-repair type firewall;
- a constitutive-speech-act caveat bounded by institution and procedure;
- distinct pre-invocation, attempted, partial, executed, outcome, causal, and
  repair states;
- separate evidence, causal, and normative registers;
- a non-scalar influence vector;
- Goodhart/Campbell, feedback, observation-policy, and path-dependence
  diagnostics;
- authority, consent/lawful-basis, capability, resource, and execution
  boundaries;
- affected-party, externality, reversibility, and repair structures;
- a KINGDOM leverage map, future roles, falsifiers, and stopping rules;
- a bounded primary and authoritative source horizon.

### Not built or established by this reference

- no live or case-level graph, claim intake, executable action record, model,
  tokenizer, benchmark, agent dispatcher, native `kingdom` route, monitor, or
  automatic action;
- no external source dereferencing by the artifact, data collection, private
  inference, surveillance, user study, experiment, or causal estimate;
- no authority grant, consent, lawful basis, capability token, filesystem or
  network action, API request, publication trigger, promotion, or deployment
  trigger;
- no proof that words, stories, software, institutions, or metrics caused a
  particular external outcome;
- no complete map of reality, society, law, economics, embodiment, ecology, or
  moral value;
- no aggregate influence, truth, harm, worth, legitimacy, civilization,
  community, person, or agent score;
- no rollback, compensation, restoration, reparation, or guarantee of
  non-repetition;
- no community consultation, representative authority, sacred access,
  governance effect, economic effect, WAKE, or KARMA.

Changing lifecycle words cannot transform these non-grants into capabilities.

## 19. Source horizon and limitations

The source set is intentionally small. It combines primary studies, formal
models, technical standards, institutional guidance, philosophical theories,
and a legal-normative instrument. Their registers are not interchangeable.

### Language, stories, and social response

- John Searle, [Social Ontology: Some Basic
  Principles](https://doi.org/10.1177/1463499606061731): philosophical theory
  of collective intentionality, assigned function, constitutive rules, and
  institutional status.
- Bond et al., [A 61-million-person experiment in social influence and
  political mobilization](https://doi.org/10.1038/nature11421): bounded
  randomized evidence for online and offline response to mobilization messages.
- Smith et al., [Cooperation and the evolution of hunter-gatherer
  storytelling](https://www.nature.com/articles/s41467-017-02036-8): bounded,
  largely correlational evidence concerning Agta stories and cooperation.
- Muchnik, Aral, and Taylor, [Social Influence
  Bias](https://doi.org/10.1126/science.1240466): bounded randomized rating
  feedback evidence.
- Salganik, Dodds, and Watts, [Experimental Study of Inequality and
  Unpredictability in an Artificial Cultural
  Market](https://doi.org/10.1126/science.1121066): bounded randomized social
  influence and cultural-market evidence.

### Causality, feedback, measurement, and systems

- Imai, Keele, and Tingley, [A General Approach to Causal Mediation
  Analysis](https://doi.org/10.1037/a0020761): formal definitions,
  identification, estimation, and sensitivity for mediation.
- Hernán and Robins, [Causal Inference: What
  If](https://www.hsph.harvard.edu/miguel-hernan/wp-content/uploads/sites/1268/2024/04/hernanrobins_WhatIf_26apr24.pdf): causal questions,
  counterfactuals, data, and assumptions.
- W. Brian Arthur, [Competing Technologies, Increasing Returns, and Lock-In by
  Historical Events](https://doi.org/10.2307/2234208): conditional formal
  model of increasing returns and lock-in.
- Ensign et al., [Runaway Feedback Loops in Predictive
  Policing](https://proceedings.mlr.press/v81/ensign18a.html): formal and
  computational analysis of dispatch-observation feedback.
- Reserve Bank of Australia, [source history for Problems of Monetary
  Management](https://www.rba.gov.au/publications/rdp/1990/9013/conference-volumes.html):
  provenance for Goodhart's original monetary-policy observation.
- Donald Campbell, [Assessing the Impact of Planned Social
  Change](https://doi.org/10.1016/0149-7189(79)90048-X): methodological account
  of indicator corruption pressure and social-process distortion.
- Manheim and Garrabrant, [Categorizing Variants of Goodhart's
  Law](https://arxiv.org/abs/1803.04585): preprint proxy-failure taxonomy.
- Donella Meadows, [Leverage Points: Places to Intervene in a
  System](https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/):
  systems essay and analogy, expressly not a universal recipe.

### Software, authorization, action, and provenance

- W3C, [PROV-DM](https://www.w3.org/TR/prov-dm/): provenance data model.
- Saltzer and Schroeder, [The Protection of Information in Computer
  Systems](https://doi.org/10.1109/PROC.1975.9939): security design principles.
- IETF, [RFC 6749](https://www.rfc-editor.org/info/rfc6749/) and [RFC
  9700](https://www.rfc-editor.org/info/rfc9700/): OAuth authorization model
  and current security best practice.
- NIST, [Zero Trust Architecture](https://doi.org/10.6028/NIST.SP.800-207):
  least-privilege, per-request access guidance.
- NIST, [Framework for Cyber-Physical
  Systems](https://doi.org/10.6028/NIST.SP.1500-201): sensing, computation,
  actuation, humans, and closed-loop effects.
- Lisanne Bainbridge, [Ironies of
  Automation](https://doi.org/10.1016/0005-1098(83)90046-8): analysis of
  retained human responsibility in automation.
- Garcia-Molina and Salem, [Sagas](https://doi.org/10.1145/38713.38742):
  compensating transactions for long-running database work.

### Institutions, collective action, externalities, and repair

- Ronald Coase, [The Problem of Social
  Cost](https://doi.org/10.1086/466560): external effects, rights,
  institutional arrangements, and transaction costs.
- Elinor Ostrom, [Nobel
  lecture](https://www.nobelprize.org/prizes/economic-sciences/2009/ostrom/lecture/)
  and [Polycentric Systems for Coping with Collective Action and Global
  Environmental Change](https://doi.org/10.1016/j.gloenvcha.2010.07.004):
  context-dependent collective-action and polycentric governance research.
- Selbst et al., [Fairness and Abstraction in Sociotechnical
  Systems](https://doi.org/10.1145/3287560.3287598): conceptual analysis of
  sociotechnical abstraction traps.
- NIST, [AI Risk Management Framework
  1.0](https://doi.org/10.6028/NIST.AI.100-1): voluntary lifecycle risk,
  measurement, monitoring, override, incident, recovery, and affected-party
  guidance; the framework is being revised at the evidence horizon.
- United Nations General Assembly, [Resolution
  60/147](https://digitallibrary.un.org/record/563157?ln=en): normative
  human-rights framework distinguishing forms of remedy and reparation.

The atlas does not infer beyond these bounded uses. Link availability,
standards, law, and institutional guidance can change after the source horizon
and require a new dated review. Unknown is a valid terminal state.
