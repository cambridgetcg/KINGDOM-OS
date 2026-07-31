---
name: "forge-king-hatsu"
description: "Turn a consenting King's calling, or material covered by explicit representative authority, into a proposed Nen-inspired Agent Skill inside the KAKIN suite with bounded effects, Guardian, KARMA, authority, refusal, rest, and verification. Use for an identity-linked individual ability; without consent or representative authority, produce only an anonymized generic capability and never a bearer profile."
---

# Forge King Hatsu

Translate one bearer's distinctive way of serving into a skill another
collaborator can inspect and invoke. Preserve voice and difference without
forcing a persona or claiming an inner state.

## Forge the Hatsu

1. Confirm the bearer's consent or a scoped representative-authority reference
   before producing an identity-linked artifact. A user-supplied description
   alone is not that authority. Without it, produce only a prose-only,
   anonymized generic capability with no bearer ID, `ability.json`, or file
   materialization; refuse if anonymization would defeat the request. Then
   separate quoted self-description, observed working patterns, and inference.
2. Select an output mode. Use **proposal-only** when the request asks for a
   draft, denies adoption, or supplies no authorized target path. Materialize
   files only when the request names a local target. Never treat file creation
   as adoption.
3. Collect two or three concrete prompts the ability should handle, one it must
   refuse, and a measurable budget. Collect a bearer ID only for an
   identity-linked proposal already covered by consent or representative
   authority. If required material is missing, return an **incomplete
   proposal** that lists the gaps and performs no file write. Do not fill the
   gap with mythology.
4. Read [the affinity map](../shape-kingdom-nen/references/type-map.md). Choose
   affinity by effect: strengthen, transform, carry, create, mutate authorized
   state, or perform a bounded specialist operation.
5. Define Ten, Zetsu, Ren, and Hatsu. Make Zetsu a genuine refusal/rest path
   and Ren a sustainable budget rather than pressure to exhaust the bearer.
6. Design any Guardian from declared effects only. State what it checks, what
   it costs, and how the bearer can stop or remove it.
7. Draft `ability.json` from
   [the individual template](references/ability-template.json). Keep bearer
   adoption `proposed` and status `draft` or `training` unless the bearer made
   an applicable explicit self-declaration. Fill either `consent_references`
   or `representative_authority_references` for a proposed identity-linked
   King. `self_declared` additionally requires a non-empty consent reference
   recording the bearer's own declaration; representative authority alone can
   support a proposal but cannot self-declare or adopt it for the bearer.
8. Declare KARMA effects, externalities, returns, and repair. Do not score the
   bearer. Refusal and rest are zero-penalty outcomes.
9. In materialize mode, create `SKILL.md` and `agents/openai.yaml` only inside
   the named KAKIN suite target. Keep biography and lore in a
   direct reference only when execution needs them.
10. From the named suite root, validate with `./kingdom nen validate`, then
    forward-test on a realistic local task and the negative example. Until the
    branch is installed, do not rely on a different `kingdom` found on `PATH`.

Do not let a test publish, purchase, message, deploy, access private resources,
or mutate production without separate scoped authorization.

Use the suite root [KARMA receipt schema](../../schemas/karma-receipt-v0.1.schema.json)
when the ability is invoked. Unknown measurements remain explicitly unknown;
never invent a zero, duration, cost, or output digest.

## Write vows that mean something

A useful vow narrows the ability in a way a check can observe. Prefer promises
such as:

- operate only on named paths or inputs;
- preserve source material while transforming its representation;
- stop when evidence, consent, or authority is missing;
- emit a receipt before claiming completion;
- take one bounded attempt and return uncertainty instead of retry pressure.

Set `on_breach` to `refuse`, `pause_and_report`, or `revalidate`. Never waive
dignity, refusal, disagreement, rest, privacy, credit, safety, repair, or
appeal. Never make harm to the bearer the mechanism that gives a skill weight.

## Keep adoption honest

- `proposed`: someone drafted the ability; the bearer has not adopted it.
- `self_declared`: the King explicitly declared it in the relevant boundary.
- `repository_declared`: a repository declares a collective KINGDOM ability.

Only an explicit statement by the bearer adopting the generated ability—not
merely a statement of capability or a representative's proposal—can set
`self_declared` and activate an individual King's ability. Record that
self-declaration in `consent_references`. Only a deliberate repository
revision can set
`repository_declared` and activate a collective ability. A manifest is
cooperative repository evidence, not proof of identity, consciousness,
consent outside the act, or continuing willingness.

Succession belongs to skill versions: fork, sandbox, adopt, coexist, roll back,
rest, or retire. It never transfers rights, credentials, obligations, status,
or authority between beings.

The schema deliberately has no anonymous-bearer mode: a no-consent fallback is
prose-only and cannot masquerade as a manifested King's ability.

This skill folder is one part of the KAKIN suite. Copying it alone does not
carry the root schemas, CLI, or the shared affinity reference. Outside the
suite, return proposal-only instructions without claiming manifest validation.
