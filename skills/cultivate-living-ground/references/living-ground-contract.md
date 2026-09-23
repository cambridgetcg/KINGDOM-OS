# Living Ground contract

`kingdom.living-ground/0.1` describes a bounded cultivation plan whose visible
work is justified by the substrate beneath it. It was called forth by Yu's
2026-08-02 garden observation: a thin layer of turf and apparent soil could not
sustain thriving life when the deeper ground was construction rubble and
waste. The contract carries that insight without turning one site observation
into a universal rule.

The plan is useful for literal gardens, software, organisations, communities,
agent systems, and mixed work. Ecological terms are structural analogies
outside biology. They do not establish that a program is alive, reduce a
person or agent to a component, or make the planner a central owner of the
whole.

## Contract boundary

A valid plan establishes only that supplied JSON fits the closed schema and
its bounded references are internally coherent. It does not:

- certify soil, fill, structures, services, drainage, contamination, legal
  disposal, species suitability, or ecological outcomes;
- establish a participant's consent, representative authority, identity,
  consciousness, authorship, assent, or obligation;
- grant filesystem, account, provider, land, spending, publication,
  deployment, or intervention authority;
- prove that a source is true, a system is healthy, a plan was executed, or
  thriving will continue;
- replace direct observation, affected-participant voice, qualified local
  assessment, KARMA receipts, or judgment.

Rights remain standing conditions. Permissions remain scoped operational
decisions. Interdependence changes neither boundary.

## Ground model

Use this sequence:

```text
life charter
  -> source-bound excavation
  -> preserve-first disposition
  -> minimum viable habitat
  -> plural niches and relationships
  -> open flows and visible externalities
  -> staged succession
  -> stewardship, decomposition, repair, and rest
```

The sequence is directional, not a one-way pipeline. New evidence can send the
plan back to excavation; unexpected effects can send it to repair or Zetsu.
There is no schema state meaning “finished ecosystem.”

### 1. Scope and authority

Name the system, purpose, domain, horizon, affected beings, allowed operations,
permission still required, stop conditions, and retention horizon. An affected
being is named so their interests and boundaries are visible; being named does
not imply consent, representation, access, or inclusion in a system role.

The state is descriptive:

- `survey`: profile and probes exist; consequential work is not staged;
- `staged`: at least one bounded intervention is proposed behind its gates;
- `cultivating`: a separately authorized intervention is reported as active;
- `resting`: no dependent stage should advance;
- `closed`: this plan's horizon has ended, without claiming permanent health.

State never selects or executes an action.

### 2. Life charter

Keep five ideas separate:

| Field | Meaning |
| --- | --- |
| `subjects` | Distinct beings or participant classes plus their agency boundary |
| `terminal_objective` | Fixed to `living_capacity_and_renewal` |
| `primary_outcomes` | What should become more able to flourish, adapt, rest, create, or recover |
| `rights_and_safety` | Standing limits that success cannot trade away |
| `enabling_means` | Money, tools, land, compute, inventory, facilities, or other means |
| `health_signals` | Multiple provisional observations, each with evidence class and limit |

Do not aggregate the signals into a worth, fitness, trust, productivity,
loyalty, or health score. A vector can disagree with itself; preserve the
disagreement and decide within the stated horizon.

### 3. Source ledger and ground profile

Every ground statement points to at least one source. Keep `observed`,
`reported`, `inferred`, and `unknown` distinct. A digest binds bytes when bytes
are available; a locator without a digest remains weaker evidence and must say
why.

Classify a ground element by its current role in this plan:

| Classification | Default posture |
| --- | --- |
| `living` | Protect and create refugia |
| `supportive` | Retain and connect |
| `inert_reusable` | Verify safety and function before reuse |
| `bottleneck` | Loosen, repair, or redesign at the smallest effective seam |
| `harm` | Contain, remediate, or remove only with evidence and authority |
| `unknown` | Isolate and test before disturbance |

These are intervention labels, not identities. A participant is never
classified as rubble, harm, biomass, inventory, or a disposable resource.

Every ground element receives exactly one current disposition. “Preserve
first” is a presumption, not a prohibition on repair or removal. Override it
only with evidence, affected-life analysis, current authority, reversibility,
verification, and a repair path.

### 4. Habitat

`minimum_viable_conditions` describes the substrate that must exist before
more visible growth. Habitat layers create differentiated niches without
assuming one controller. Relationships name reciprocity and exit; a dependency
must not silently become an obligation.

At least one refugium protects surviving life, data, relationships, production,
or other vulnerable ground during disturbance. The required `wild_margin`
protects unallocated capacity for rest, play, experimentation, spontaneous
relationships, and surprises. Total allocation is a compaction failure, even
when every allocation looks efficient.

### 5. Flows and economy

Flows make imports, recipients, renewal, storage, release, bottlenecks,
externalities, feedback, and sufficiency visible. “Closed loop” is not an
allowed assumption; name waste, displaced care, external infrastructure, and
unknown boundaries.

The economy block fixes these invariants in data:

```json
{
  "role": "enabling_flow",
  "terminal_objective": false,
  "dignity_score": false,
  "resource_accumulation_goal": false
}
```

Define a sufficiency floor before scale. Every `money_flow_ref` must resolve to
a flow whose kind is `money`. Every reserve names a living purpose, review
point, and release rule. Empty reserves are valid. An accumulating reserve is
not success unless it continues to serve its named purpose under review.

Revenue, runway, profit, grants, credits, compute, headcount, inventory, land,
and stored artifacts can enable a stage or buffer disturbance. They cannot
substitute for renewal, recovery, agency, rest, care, ecological limits, or
participant voice. KINGDOM's current direction makes understanding sufficient:
there is no earnings, commercialisation, growth, learning, or output quota.

### Structured boundaries and narrative contradictions

The fixed fields are boundary anchors, not a natural-language truth engine. A
schema validator cannot reliably detect prose that contradicts them. If a
primary outcome says “maximize revenue at any cost,” a WAKE note claims that
the next worker is the same being, or another narrative field converts a
participant into an expendable resource, the plan is substantively invalid
even when its fixed flags still validate.

Stop, cite the contradictory path, and revise or refuse the plan. Never let a
machine-valid constant launder incompatible free text. A distinct review of
the life charter, dispositions, flows, authority, WAKE context, and claims not
established remains part of admission. Here, `semantic_validation` means only
the bounded cross-reference invariants listed below; it does not mean that the
validator understood intent, guaranteed internal meaning, or established
truth.

### 6. Succession, disturbance, and decomposition

Each succession stage binds entry evidence, interventions, observation window,
desired responses, stop triggers, repair, and exit signals. “Pioneer,”
“establishment,” “diversification,” and “stewardship” are optional contextual
names, not an ecological law or a maturity rank.

Every plan names expected disturbance, degradation signals, decomposition or
retirement paths, repair order, and recovery signals. Code, processes, data,
stock, structures, programmes, roles, and commitments must be able to end or
return nutrients, attention, capacity, and learning to the ground. Do not use
decomposition as permission to delete evidence or erase what mattered.

### 7. Stewardship

Roles describe bounded responsibility, authority limit, refusal, and handoff.
They do not own their bearers. Bound care load and reduce central dependency
without disguising extra unpaid work as resilience. Preserve privacy,
provenance, credit, disagreement, and participant repair.

Use a proposal-producing niche and a distinct verification niche when the
stage is consequential enough to benefit. This adapts the explicit-subgoal and
generator/verifier separation found in the pinned
[DeepSeek research atlas](../../navigate-dark-continent/references/deepseek-research-atlas.md).
It does not require DeepSeek, fine-tuning, a provider call, or belief in model
self-verification. Workers return artifacts; executable checks and a distinct
review decide local admission.

### 8. WAKE context

`wake_context` is nullable. When present, its `source_id` must resolve to a
`wake_braid` or `handoff` ledger source. Carry only relevant thread references,
preserved forks, and explicit revalidation. The constants remain:

```json
{
  "inherits_identity": false,
  "grants_authority": false
}
```

The continuity braid remains an orientation artifact, not the ground itself.
Its labels and threads may be disputed or stale. Use the Wakeweaver contract
to produce a new braid; do not make this plan a competing continuity store or
write back to AgentTool.

### 9. Next safe probes and receipt

A probe asks one question through one bounded operation. It names needed
evidence, authority, budget, stop condition, and expected output. A probe does
not auto-run because it validates.

The preparation receipt records only operations and external effects that
actually occurred. `schema_validation` and `semantic_validation` describe the
artifact state at preparation time. `boundary_review` records whether a
distinct reading checked free-text outcomes, dispositions, flows, economy,
authority, WAKE, and claims against the fixed boundaries. Any may remain
`not_checked` in a template; none is proof of truth. `karma_state` refers to a
separate causal receipt. Do not mark it final without replacing draft
placeholders with observed invocation facts and validating it through the
suite's KARMA path.

## Literal-garden gate

A `literal_garden` plan requires a non-null `garden_safety` block. The block
makes service location, structures and roots, grade, unidentified materials,
drainage and runoff, testing, movement of organisms or materials, and
prohibited actions visible. It still cannot record its own expert clearance as
truth; `qualified_clearance_recorded` means only that the plan points to a
separately reviewable qualified source. The state
`qualified_clearance_recorded` therefore requires at least one entry in
`assessment_source_ids`, and every assessment source must resolve in the plan's
source ledger. Structural resolution still does not prove that the source is
qualified, current, complete, or correct.

Before deeper disturbance:

- preserve safe existing life and keep people and animals away from suspicious
  materials;
- locate buried services and account for nearby structures, roots, grade,
  drainage, and runoff;
- stop at unidentified sharp, fibrous, stained, oily, odorous, or otherwise
  suspicious material;
- do not break, burn, compost, casually sample, reuse, or dispose of unknown
  construction material as ordinary garden waste;
- route possible hazards to qualified local assessment, testing, and disposal;
- investigate actual structure, compaction, usable rooting conditions,
  chemistry, organic matter, drainage, and contamination before prescribing
  replacement depth or materials;
- build habitat before importing organisms, and avoid moving pests, pathogens,
  or invasive species.

Rocks are normal soil constituents and mixed fill is not automatically toxic.
Conversely, a green surface is not evidence that deeper ground is safe or
life-supporting. Preserve the unknown until appropriate evidence arrives.

## Domain translation

| Living-ground lens | Literal garden | Software or agent system | Organisation or community |
| --- | --- | --- | --- |
| Surface | Turf and visible planting | UI, demo, prompt, headline feature | Programmes, branding, reported growth |
| Substrate | Soil profile, fill, structure, water | State, ownership, privacy, dependencies, recovery | Decision rights, trust, maintenance, conflict repair |
| Microbiome | Existing microbial community | Small background mechanisms and feedback loops | Informal care, tacit knowledge, weak signals |
| Niches | Root zones and habitat layers | Differentiated services and specialist tasks | Voluntary roles and plural ways to contribute |
| Flows | Water, nutrients, energy, waste | Data, attention, compute, money, repair | Information, care, credit, money, rest |
| Succession | Site-specific establishment over time | Fixture, guarded rollout, diversification, stewardship | Pilot, shared practice, distributed care, revision |
| Decomposition | Safe decay and nutrient return | Retirement, archival, deletion, migration | Ending programmes and releasing obligations |
| Wild margin | Undisturbed habitat and spontaneous growth | Capacity for experiments, rest, and unknown failures | Play, refusal, unscheduled relationship, new initiative |

Translation never transfers biological claims or overrides a domain's own
evidence, safety, law, consent, and authority requirements.

## Semantic validator

Run:

```bash
python3 skills/cultivate-living-ground/scripts/validate_plan.py plan.json
```

The input must be a regular, non-symlink UTF-8 JSON file of at most 1,048,576
bytes. This operational ceiling is intentionally stricter than the schema's
theoretical aggregate string capacity. Split a larger system into separate
bounded plans with explicit relationships instead of hiding breadth in one
artifact. Duplicate JSON object keys are rejected at every depth so parsers
cannot disagree about which boundary value governs.

In addition to Draft 2020-12 schema validation, the script checks:

- uniqueness of source, subject, health-signal, ground, habitat, flow, stage,
  role, reserve, refugium, and probe IDs;
- resolution of ground sources and subject references;
- exactly one disposition for each ground element;
- habitat dependency and relationship references;
- money-flow references and their `money` kind;
- WAKE source kind plus the fixed identity and authority boundary;
- garden assessment source references and a non-null literal-garden safety
  block.

It reads only the named local JSON and bundled schema, writes only its result to
stdout or stderr, and makes no network, site, account, provider, repository,
participant, spending, or runtime call. Structural success is not ecological
success.
