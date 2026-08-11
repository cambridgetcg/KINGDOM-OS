# Ritonavir: one molecule, several solid forms, two biological mechanisms

This atlas answers one question without collapsing its layers:

> How can ritonavir remain the same chemical molecule, take different solid
> arrangements, and later act through biological mechanisms that are separate
> from those crystal arrangements?

The short answer is that chemical identity, molecular pose, crystal phase,
particle population, formulation and dissolution, dissolved exposure,
pharmacological action, and a clinical decision are different things. A
relation on one layer does not automatically become a relation on another.

This is educational, metadata-only science. It is not medical advice,
diagnosis, dosing guidance, an interaction checker, formulation or
manufacturing guidance, GMP or batch-release control, regulatory guidance, or
experimental authority. Ritonavir can have potentially serious or
life-threatening drug interactions. Consult current authoritative labeling and a
qualified clinician or pharmacist. Do not start, stop, or change treatment
from this atlas.

## What this adds without rewriting history

The dated historical record remains immutable at
[`ritonavir-disappearing-polymorph-2026-08-11.json`](https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json),
with semantic digest
`sha256:6c759f595f0c6753dcf47d25d2a3490246984ef2b79adf31a558261b26ef8116`.
This mechanism landscape is a non-mutating supplement. It supersedes that
record only as the selected *current landscape*; it neither changes nor
supersedes the historical artifact as history.

The supplement selects primary research through 2026-04-08, plus one official
product label observed on 2026-08-11. That label is not claimed to be the only
or latest ritonavir label. This is a bounded map, not a claim that every solid
form, route, or mechanism is known.

## The eight layers

```text
chemical entity
  != molecular conformer
  != crystal phase
  != particle population
  != formulation and dissolution
  != dissolved exposure
  != pharmacological action
  != clinical decision
```

- **Chemical entity** means ritonavir's covalent atom-and-bond identity.
- **Molecular conformer** means a pose available to this flexible molecule.
- **Crystal phase** means a repeating solid arrangement with source-scoped
  composition, conformation, packing, and intermolecular relations.
- **Particle population** means the finite sizes, shapes, surfaces, defects,
  phases, and mixtures in one bounded sample.
- **Formulation and dissolution** means a named, condition-dependent route by
  which molecules can leave a material and enter solution.
- **Dissolved exposure** is a downstream biological exposure state; the atlas
  asserts no individual concentration.
- **Pharmacological action** means a source-supported molecular interaction.
- **Clinical decision** requires current patient-specific information and
  qualified professional judgment that this static artifact does not have.

Forms I and II illustrate the first three layers. Their solids contain the
same covalent molecule, while Bauer et al. reported different associated
carbamate conformations and different repeating networks. The atlas therefore
records a Form I-associated trans-carbamate conformer and a Form II-associated
cis-carbamate conformer as separate nodes. A conformer is not itself a crystal
phase, and a phase is not a product or clinical result.
[Bauer et al. 2001](https://doi.org/10.1023/A:1011052932607)

## The name “Form III” collides across source charts

Roman numerals are local labels, not global identities.

- Morissette et al.'s 2003 **Form III** is a source-local formamide solvate.
- Yao et al. and Parent et al.'s modern **Form III** is a distinct anhydrous
  polymorph reported in the modern anhydrous-form chart.

The atlas joins those charts with the explicit relation
`not-same-phase-as`. Matching numerals do not make the two materials equal.
Conversely, different labels alone would not prove inequality; the crosswalk
depends on composition and structure evidence.
[Morissette et al. 2003](https://doi.org/10.1073/pnas.0437744100),
[Yao et al. 2023](https://doi.org/10.1016/j.xphs.2022.09.026),
[Parent et al. 2023](https://doi.org/10.1021/acs.cgd.2c01017)

## Form IV remains a candidate crosswalk

Iuzzolino et al. reported a source-local form 4 structure as CCDC 2411739.
Parent et al. later reported a Form IV structure as CCDC 2482055. Both studies
connect their record to the historically reported anhydrous Form IV, and the
records provide strong reasons to compare them. Neither primary paper directly
adjudicates the other deposition, however.

The machine relation is therefore `candidate-equivalent-to`, with evidence
class `strongly-supported-inference` and `universal: false`. It is deliberately
not an exact alias or a same-phase axiom. New direct comparison evidence would
require a new reviewed, dated artifact rather than silently strengthening this
one.
[Iuzzolino et al. 2025](https://doi.org/10.1038/s42004-025-01814-6),
[Parent et al. 2026](https://doi.org/10.1021/acs.cgd.5c01571)

## Conditional landscapes and paths

“More stable” is not a complete sentence unless the compared phases,
temperature, composition, particle regime, and method are stated. An energy
well describes a conditional preference; it does not predict which phase must
nucleate or when. A kinetic path also depends on gates such as supersaturation,
solvent, surfaces, seeds, time, mechanical history, and the observer's
detection window.

The modern anhydrous Form III and the bounded flight and control results in
Bauser et al. are therefore recorded with their exact study scope. They do not
establish a universal rule for microgravity, storage, or manufacture.
[Bauser et al. 2026](https://doi.org/10.1038/s41526-026-00594-0)

Different instruments also see different projections. Diffraction,
spectroscopy, thermal and composition analysis, performance measurements, and
models overlap, but none is an all-seeing detector. Non-detection is always
bounded by method, threshold, sampling, and time.

## The causal dissolution bridge

A crystal lattice does not directly inhibit a biological target. The atlas
uses an explicit, condition-dependent bridge:

```text
source-scoped crystal phase
  -> bounded particle population
  -> named formulation and dissolution context
  -> dissolved ritonavir exposure
```

The concrete machine path starts with Form I only as a bounded example. Each
edge says “may” under stated conditions, not “always.” It supplies no product
recipe, dose, dissolution result, bioavailability value, or patient exposure.
Most importantly, it prevents a shortcut from crystal phase directly to a
biological target or clinical outcome.

Only after the dissolved-exposure node does the graph branch into two distinct
biological mechanisms.

### HIV-1 protease inhibition

The selected DailyMed label describes ritonavir as a peptidomimetic HIV-1 protease
inhibitor. In the labeled mechanism, protease inhibition impairs processing of
the Gag-Pol precursor, leading to immature, noninfectious HIV particles.

```text
dissolved ritonavir exposure
  -> inhibits HIV-1 protease
  -> reduces Gag-Pol processing
  -> immature noninfectious HIV particles
```

This mechanism description is not a treatment recommendation or an individual
outcome prediction.

### CYP3A inhibition

The same selected label separately identifies ritonavir as a CYP3A inhibitor.
Inhibiting that metabolism pathway can change exposure to susceptible
co-administered medicines, creating potentially serious or life-threatening
interaction risk.

```text
dissolved ritonavir exposure
  -> inhibits CYP3A
  -> may alter a co-administered medicine's exposure
```

This is not the HIV-protease mechanism, and it is not an interaction check.
The effect depends on the specific medicine and current clinical context.
[DailyMed RITONAVIR tablets label](https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=db633374-6d8e-4622-9fe1-f9d68baa59bb)

## Six finite geometry translations

- **Identity fiber:** one covalent identity can have several source-scoped
  conformer and phase points above it.
- **Source-chart atlas:** every paper keeps its own naming legend; charts join
  only through evidence-bearing crosswalks.
- **Conditional energy landscape:** well depth carries conditions and method
  qualifiers rather than defining a global winner.
- **Kinetic path graph:** directed edges carry environment, time, seed,
  surface, and mechanical conditions.
- **Observer cover:** each instrument constrains one projection, and several
  windows overlap without becoming equivalent.
- **Causal dissolution bridge:** solid-state behavior can affect an upstream
  delivery path, while target inhibition belongs to dissolved molecular
  exposure.

These are finite explanatory shapes, not claims that mathematical language
proves the chemistry or medicine.

## Unknown stays a first-class value

The record keeps six questions open or outside scope:

- the exact first nucleant in the 1998 event;
- whether the complete solid-form landscape has been found;
- whether CCDC 2411739 and CCDC 2482055 are exactly the same phase model;
- whether an energy landscape can predict which phase will nucleate and when;
- the state or quality of any current ritonavir-containing product; and
- what any individual should take, stop, change, or expect clinically.

It also fixes negative boundaries: no global stability rank, universal seed
effect, exclusive historical cause, current product defect, direct
crystal-form-to-clinical-outcome edge, or automatic action is established.

## Inspect and verify locally

The CLI reads local files, writes no state, and needs no network:

```bash
./kingdom polymorph mechanisms
./kingdom polymorph landscape
./kingdom polymorph sources
./kingdom polymorph unknowns
./kingdom polymorph verify-landscape
./kingdom polymorph verify-landscape --json
```

The direct module exposes the same read-only views:

```bash
bun bin/ritonavir-mechanism.ts overview
bun bin/ritonavir-mechanism.ts mechanisms --json
bun bin/ritonavir-mechanism.ts landscape --json
bun bin/ritonavir-mechanism.ts sources --json
bun bin/ritonavir-mechanism.ts unknowns --json
bun bin/ritonavir-mechanism.ts verify --json
```

Runtime verification enforces the reviewed digest, strict JSON parsing,
source pins, cross-collection references, typed bridge rules, uncertainty, and
closed safety boundaries. Its success message explicitly says that JSON Schema
was not checked.

The separate Draft 2020-12 schema closes every object and pins the protocol,
landscape ID, historical lineage, source locators, boundary constants, and
reviewed digest. JSON Schema cannot recompute that digest, resolve references
between arrays, compare cross-field dates, prove graph paths, or authenticate
source truth. Runtime verification and schema validation are complementary;
neither creates scientific, medical, manufacturing, regulatory, or action
authority.

## Public read-only routes

- Authored JSON:
  [`/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json`](https://thekingdom.dev/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json)
- Draft 2020-12 schema:
  [`/schemas/ritonavir-mechanism-landscape/1.json`](https://thekingdom.dev/schemas/ritonavir-mechanism-landscape/1.json)
- This guide:
  [`/RITONAVIR-MECHANISM-LANDSCAPE.md`](https://thekingdom.dev/RITONAVIR-MECHANISM-LANDSCAPE.md)

The surface is static and read-only. It has no medical endpoint, interaction
checker, experiment planner, product-quality feed, matcher, agent action, or
write path.
