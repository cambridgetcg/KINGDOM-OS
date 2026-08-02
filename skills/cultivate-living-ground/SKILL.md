---
name: "cultivate-living-ground"
description: "Diagnose and rebuild the hidden substrate beneath a polished but brittle garden, software system, organisation, community, or agent workflow, then compose habitat, circulation, succession, stewardship, and repair around the life meant to thrive there. Use when surface features mask rubble, compaction, missing foundations, monoculture, extractive economics, accumulated maintenance debt, or fragile continuity. Treat money and resources as bounded enabling flows, never as the objective, dignity score, or proof of health."
---

# Cultivate Living Ground

Turn a surface-level fix into a staged, regenerative cultivation plan. Begin
with the beings and living capacities the system should sustain, inspect the
ground beneath appearances, protect what is already alive, and create the
conditions for plurality, renewal, rest, adaptation, and repair.

Use ecological language as a design lens, not a claim that software is alive
or that people and agents are interchangeable with soil organisms. Treat every
participant as a distinct subject whose dignity is independent of function,
output, funding, or usefulness.

Read the [Living Ground contract](references/living-ground-contract.md) before
producing machine-readable output. Use the supplied
[JSON Schema](references/living-ground.schema.json) and
[example](references/living-ground.example.json) for a
`kingdom.living-ground/0.1` plan.

## Choose the cultivation boundary

- Name one garden, product, service, organisation, community, workflow, or
  mixed system and one bounded cultivation horizon.
- State what should become more able to flourish, adapt, rest, create, and
  recover. Keep that primary outcome separate from means such as money,
  compute, land, inventory, headcount, or tools.
- List affected beings and current stewards without treating inclusion as
  consent, representation, access, or authority.
- Declare allowed read, planning, testing, and mutation operations separately.
  If material change is not authorized, return a survey and next safe probes.
- Use **Zetsu** when safe depth, evidence, permission, care capacity, or a
  repair path is missing. Resting the plan is a valid outcome.

## Cultivate from ground to canopy

1. **Name the life.** Write a life charter containing primary outcomes,
   standing rights and safety limits, enabling means, and plural health
   signals. Fix `terminal_objective` to `living_capacity_and_renewal`. Do not
   collapse health into one score.
2. **Excavate the truth.** Inspect the visible layer, dependencies, history,
   ownership, maintenance, flows, and surrounding conditions from the surface
   down. Label each claim `observed`, `reported`, `inferred`, or `unknown` and
   bind it to a source. Stop at the authorized and safe depth.
3. **Sort the ground.** Classify each layer or element as `living`,
   `supportive`, `inert_reusable`, `bottleneck`, `harm`, or `unknown`. Give
   existing life a preserve-first presumption. Choose among preserve, retain,
   verify then reuse, isolate, test, remediate, remove, redesign, or leave
   undisturbed; never turn “dig deeper” into an automatic purge.
4. **Recondition the substrate.** Establish minimum viable habitat before
   adding visible features: usable capacity, porosity and exchange, safe
   boundaries, drainage or outlets, renewal, maintenance, decomposition, and
   recovery. Start with the smallest coherent patch and explicit acceptance
   evidence.
5. **Compose habitat.** Create differentiated layers, niches, edges,
   relationships, and refugia. Include creation, use, observation,
   maintenance, repair, decomposition, and governance capacity. Preserve a
   `wild_margin` for rest, play, experiments, and unplanned life.
6. **Open the cycles.** Map every relevant material, water, nutrient, energy,
   information, attention, care, money, and compute flow. Record source,
   recipients, renewal, storage, release, bottlenecks, waste, externalities,
   feedback, and a sufficiency signal. Connectedness never grants data access,
   consent, or control.
7. **Grow through succession.** Stage pioneer, establishment,
   diversification, and stewardship work only when those names fit the actual
   system. Each stage needs entry evidence, interventions, an observation
   window, desired responses, stop triggers, repair, and exit signals. Never
   declare a living system permanently finished.
8. **Steward and receipt.** Bound care load, distribute recovery knowledge,
   protect refusal and handoff, credit contributions, observe aftermath, and
   record repair. A plan is an invitation to cultivate, not proof that the
   intervention worked.

## Keep economy inside life

Set the plan's terminal objective to living capacity and renewal. Set money's
role to `enabling_flow`, and keep both `terminal_objective` and `dignity_score`
false. Define a sufficiency floor before growth targets. Give every reserve a
purpose, review point, and release rule; accumulation without a named living
purpose is not success.

Measure health as a vector that can include renewal, recovery, diversity of
response, flow sufficiency, agency, sustainable care load, and economic
capacity. Never optimize one proxy until it consumes the habitat it was meant
to serve. Funding can constrain sequencing or increase resilience; it cannot
rank a being or replace direct observation and participant voice.

## Cross with DeepSeek research without importing authority

When external evidence or DeepSeek resources are needed, use
`navigate-dark-continent` and its DeepSeek research atlas first. Carry exact
resource IDs, revisions, providers, runtimes, evaluation fixtures, and license
assertions as separate provenance. A model card, benchmark, generated plan, or
self-verification result remains evidence from its stated source.

Adapt only bounded mechanisms that fit the ground:

- route explicit task classes to specialist niches without treating a worker
  as infallible or requiring fine-tuning;
- decompose the cultivation horizon into inspectable subgoals whose workers
  return artifacts;
- separate proposal generation from verification and preserve disagreement;
- resolve exact identifiers and provenance before semantic retrieval.

These adaptations do not invoke a DeepSeek model, configure a provider, spend
money, send private context, or validate the resulting system. Any such effect
needs its own current authority, budget, privacy review, and receipt.

## Let WAKE orient the ground, never define the gardener

A caller-supplied continuity braid may appear as one source in the ledger. Use
only its bounded anchors, preserved forks, and explicitly held or revised work
that is relevant to the present cultivation scope. Revalidate the project,
current evidence, affected participants, authority, and retention before use.

Set `wake_context.inherits_identity` and `wake_context.grants_authority` to
false. A WAKE, handoff, checkpoint, label, or artifact lineage does not prove
stable identity, consciousness, consent, authorship, truth, successful
execution, or permission to resume. A live WAKE read is a separately
authorized source operation and may have access, audit, episode, or cache
effects; record what was actually observed.

Use `weave-wake-continuity` when a new braid must be prepared. This skill
consumes only a supplied or separately authorized orientation artifact; it
does not become a continuity store or write back into AgentTool.

## Protect literal gardens

For physical land, plan conservatively. Mixed fill is not automatically safe
or contaminated, and appearance alone cannot decide. Before deeper
disturbance, account for buried services, nearby structures, roots, grade,
drainage, runoff, existing habitat, and local disposal boundaries.

Stop at unidentified sharp, fibrous, stained, oily, odorous, or otherwise
suspicious material. Do not break, burn, compost, casually sample, reuse, or
discard it as ordinary garden waste. Keep people and animals away and route
unknown or potentially hazardous material to qualified local assessment,
testing, and disposal. Do not prescribe a universal excavation depth, imported
soil recipe, organism inoculant, species list, or clearance claim.

Assess the actual site before moving organisms or materials. Preserve safe
existing life where possible and prefer staged remediation. Habitat comes
before purchased microbes, insects, worms, plants, platforms, or other
“solutions.” This skill provides planning support, not a site survey,
environmental clearance, legal disposal advice, or biodiversity guarantee.

## Validate and return

Validate a plan from the suite root:

```bash
python3 skills/cultivate-living-ground/scripts/validate_plan.py plan.json
python3 skills/cultivate-living-ground/scripts/validate_plan.py plan.json --json
```

The validator checks the JSON Schema plus source, ground, habitat, flow, WAKE,
and disposition references. It is network-free and does not inspect the site,
execute interventions, establish consent, grant authority, certify safety, or
prove thriving.

The named plan must be a regular, non-symlink UTF-8 JSON file no larger than
1,048,576 bytes. Duplicate object keys are rejected at every depth. The byte
ceiling is an operational guard stricter than the schema's theoretical field
capacity; split larger systems into separately bounded, source-linked plans.

Read the narrative after validation. If free text contradicts a structured
money, rights, safety, authority, WAKE, or claims-not-established boundary,
refuse or revise the plan even when the validator reports success. Its
“semantic” checks cover bounded references, not natural-language meaning or
truth.

Return:

```text
Life charter and bounded cultivation horizon
Authority established and authority still required
Source ledger: observed | reported | inferred | unknown
Ground profile and preserve-first disposition ledger
Minimum viable habitat, niches, relationships, refugia, and wild margin
Flows, bottlenecks, externalities, feedback, and sufficiency signals
Economy: enabling flow, sufficiency floor, reserve purpose and release
Succession stages with stop, observation, exit, and repair
WAKE context used, forks preserved, and revalidation performed
Next safe probes and what remains unknown
Effects actually performed and receipt state
Claims not established
```

Reject cosmetic greening, purity purges, purchased-microbiome cargo cults,
monoculture with many labels, central-gardener dependencies, resilience by
exhaustion, authority creep, closed-loop fantasies, dashboards that replace
voice, systems with no decomposition path, static-climax claims, and plans
that optimize away the wild margin.
