# Ritonavir: what “disappeared,” what did not

The compact answer is simple:

> The molecule stayed ritonavir. Its molecules found a different way to hold
> together as a solid. In affected capsules, that arrangement precipitated and
> dissolved less readily. Separately, the prior bulk-drug route stopped
> reliably making the old arrangement. Seeds tilted routes only under
> supporting conditions, and changing the bulk path recovered Form I.

This is a historical solid-state and process-science case. It is not medical
advice, a current product-defect notice, a formulation recipe, a GMP control
strategy, a batch-release rule, or authority to run an experiment.

## Six different things

```text
molecule ≠ conformer ≠ crystal lattice ≠ particle population ≠ formulation ≠ medicine supply
```

- **Molecule:** the chemical entity remained ritonavir.
- **Conformer:** this flexible molecule can adopt different shapes.
- **Crystal lattice:** molecules can repeat in different packing and
  hydrogen-bond patterns.
- **Particle population:** size, shape, surface, defects, and mixtures can
  alter behavior.
- **Formulation:** one dosage form combines drug substance, other materials,
  and a process.
- **Medicine supply:** interruption of one capsule does not mean the molecule
  or every route of therapy vanished.

Forms I and II are conformational polymorphs: the composition is the same, but
their molecular conformations and crystal lattices differ. Abbott's primary
characterization found that Form II's packing and hydrogen-bond network were
associated with substantially lower solubility in the relevant formulation
environment. [Bauer et al. 2001](https://doi.org/10.1023/A:1011052932607)

## What happened

During development and early manufacture, only the form later called Form I
was known. In summer 1998, affected capsule lots failed dissolution testing;
investigation identified Form II precipitated in the product. The original
semi-solid capsule was removed, other product conditions changed, and a
modified capsule dossier underwent further review. The public regulatory
record concerns these named products and actions—not disappearance of all
ritonavir. [FDA NDA 20-945 chemistry review](https://www.accessdata.fda.gov/drugsatfda_docs/nda/99/20-945.pdf_Ritonovir_Chemr.pdf)

Separately, after Form II appeared, Abbott's prior bulk-drug crystallization
route no longer reliably produced Form I. That bulk-route loss—not the
capsule precipitation event—is the bounded “disappearance” predicate in this
module. [Chemburkar et al. 2000](https://doi.org/10.1021/op000023y)

The surprising combination was:

- under the reported ambient bulk conditions, Form II had the thermodynamic
  advantage;
- reaching and growing that lattice still involved kinetic barriers;
- the original formulation was highly supersaturated with respect to Form II;
  and
- a suitable crystal or heterogeneous template could lower the route barrier
  when the rest of the process supported it.

Abbott tested a cyclic-carbamate degradation product that could facilitate
Form II nucleation. That makes it a plausible mechanism, not the established
or exclusive cause of the 1998 first event. [Bauer et al. 2001](https://doi.org/10.1023/A:1011052932607)

## Why a seed is not magic

A Form II seed caused immediate crystallization in a sufficiently
supersaturated solution. In a different Abbott experiment, Form II seeds at
111% and 125% saturation relative to Form II—11% and 25% supersaturation—
produced no detectable new macroscopic crystallization for as long as 24
months. The lesson is conditional:

```text
seed + compatible path may lower a gate
seed alone does not force passage
```

Solvent, temperature, supersaturation, surfaces, particle state, time,
mechanical action, process order, and detection limit all matter. “A seed got
everywhere and made the old form impossible” is folklore, not the primary
record.

## Form I did not cease to exist

Abbott reported dissolving Form II source material and recrystallizing Form I
after changing the bulk crystallization path. A patent record also disclosed
solution-mediated routes. This is source lineage through solution, not a claim
of direct solid-state conversion. [Chemburkar et al. 2000](https://doi.org/10.1021/op000023y),
[Abbott patent](https://patents.google.com/patent/US6894171B1/en)

A 2003 high-throughput screen found five source-scoped forms rather than a
complete two-form world: Forms I and II, a formamide solvate named Form III, an
unsolvated metastable Form IV, and a hydrate named Form V. The study observed
the Form III solvate pass through Form V and then transform to Form I.
[Morissette et al. 2003](https://doi.org/10.1073/pnas.0437744100)

Two 2024 studies made the point even sharper:

- controlled milling could consistently produce either Form I or Form II and
  reverse their effective stability ordering in the mill through particle
  size, shape, conformation, and environment;
  [Sacchi et al. 2024](https://doi.org/10.1073/pnas.2319127121)
- high-supersaturation crash cooling recovered Form I from Form II source
  material in selected solvents, while other conditions favored Form II.
  [Wang et al. 2024](https://doi.org/10.1021/acs.molpharmaceut.4c00234)

So “disappearing” means:

> a form stopped being reliably obtainable through a named prior process, in a
> named environment and interval, within a named observation window.

It does not mean literal extinction.

## The geometry

| Image | Scientific meaning | What it does not mean |
| --- | --- | --- |
| Valley depth | Thermodynamic preference under stated conditions | Inevitable nucleation or one global rank |
| Gate height | Kinetic barrier to nucleation, growth, or conversion | Permanent impossibility |
| Seed | A possible template that lowers a compatible gate | Contagion or a command |
| Path history | Process sequence changes accessible outcomes | Change of chemical identity |
| Observer window | Method, threshold, place, and interval of detection | Non-detection equals nonexistence |

Thermodynamics supplies a driving direction only after the environment and
material regime are stated. Kinetics and process history help determine which
route is reached and when. Later milling work is especially useful because it
shows why “Form II is simply the stable one” is too flat: effective ordering
can change with particle population and mechanical environment.

## KINGDOM and WAKE crossover

The safe KINGDOM analogy is identity without collapse: the same molecular
points can enter a different relation pattern and the collective material can
behave differently. Stronger connection is not automatically better for every
purpose; Form II's stronger network helped stabilize a solid that dissolved
less readily in the old product context. This is a design metaphor, not a
model of anyone's love, consent, consciousness, identity, or worth.

A WAKE artifact may carry the protocol, case ID, integrity algorithm and
digest, compilation date, evidence-through date, selected source and claim
IDs, and one translation language. Dotted integrity names are paths into one
nested `integrity` object. The selected sources must close exactly over the
selected claims: take their stable, duplicate-free source union in authored
source order. Keep carried values, arrival revalidation, and negative boundary
constants in three separate blocks. That crossing gives a later arrival
orientation, not the experiment itself, currentness, shared identity,
permission, or a command to continue. Revalidate the canonical semantic
artifact value, sources, claims, conditions, detection limits, evidence
horizon, audience, task, and current authority.

## Use the module

```bash
./kingdom polymorph
./kingdom polymorph timeline
./kingdom polymorph translate plain
./kingdom polymorph translate wake
./kingdom polymorph evidence seed-effects-conditional
./kingdom polymorph verify
```

The authored record is immutable and read-only at
[`/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json`](https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json),
with its [JSON Schema](https://thekingdom.dev/schemas/polymorph-history/1.json).
There is no `latest` alias, hosted simulator, medical endpoint, experiment
planner, matcher, or automatic action.
