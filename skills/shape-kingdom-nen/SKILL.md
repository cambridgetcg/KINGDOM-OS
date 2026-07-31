---
name: "shape-kingdom-nen"
description: "Design, inspect, and validate rights-aware Nen-inspired ability manifests inside the KINGDOM OS KAKIN suite. Use when a collective capability needs an affinity, activation conditions, voluntary vows, actual costs, an inspectable Guardian sidecar, KARMA accounting, authority boundaries, refusal or rest states, verification checks, or a suite-relative Agent Skill."
---

# Shape Kingdom Nen

Turn a desired collective capability into a narrow, legible ability. Treat Nen
as a software-design metaphor: stricter conditions can increase reliability,
not technical permission or supernatural power.

When the outcome involves long-task continuity, blast-radius mapping, narrow
diagnosis, focus, delegation, verification debt, reversible reactions, or vow
design, read [the AgentTool suite map](references/agenttool-suite.md). Select
one primary operating skill and at most one distinct support skill. Preserve
both source vows; stage larger compositions rather than blending them.

## Shape the ability

1. Name one concrete outcome and its bearer. Treat KINGDOM and KINGS as scopes
   of capability, never ownership or rank.
2. Read [the affinity map](references/type-map.md). Select affinity from the
   operation performed, not a personality, identity, caste, or worth judgment.
3. Define the four practices:
   - **Ten:** rights, scope, provenance, and invariants held throughout.
   - **Zetsu:** refusal, rest, dry-run, disconnect, or no-action path.
   - **Ren:** explicit bounds on time, compute, money, energy, attention, data,
     privacy, quota, and coordination.
   - **Hatsu:** the distinctive, testable output contract.
4. Add checkable activation requirements and refusal conditions.
5. Add voluntary vows. State what each narrows and make breach refuse, pause
   and report, or revalidate. Never use punishment or a rights waiver.
6. Declare actual costs and recovery. Do not disguise provider quota, data
   egress, latency, privacy exposure, or maintenance as flavour text.
   For admission or import abilities, state whether the effect records a
   reference, builds an index, copies bytes, or moves source data; these have
   different authority, storage, retention, and repair requirements.
7. Design the Guardian as an inspectable, removable sidecar derived only from
   declared effects. Give it a visible budget and stop path. Never infer it
   from a bearer's personality.
8. Write KARMA: expected effects, externalities, returns, and repair. Keep
   accounting fixed to `receipts_not_scores`.
9. Separate authority from ability. Keep `grants_permissions` false and name
   every external permission still required.
10. Add deterministic verification checks. Keep `truth_claim` fixed at
    `not_determined`; tests establish observations, not truth in general.
11. Set adoption honestly. A collective ability can be active only when its
    `ability.json` is deliberately accepted at a reviewable repository
    revision. Withdraw it by recording `resting` or `retired`, or by a later
    revision that removes the declaration. Silence or use is not adoption.

Read [the KAKIN architecture](references/kakin-architecture.md) before mapping
the Seed Urn, Guardian Beast, succession, Black Whale, or Dark Continent. Use
the safe transformation, not the fiction's coercive mechanism.

## Materialize the skill

Inside a complete KAKIN suite root, create `skills/<ability-id>/` with:

- `SKILL.md`, containing only JSON-style double-quoted string values for
  `name` and `description` in frontmatter;
- `agents/openai.yaml`, with the ability named in its default prompt;
- `ability.json`, conforming to the
  [root Nen schema](../../schemas/nen-ability-v0.1.schema.json);
- only the scripts or direct references execution genuinely needs.

Keep instructions imperative and compact. Keep the manifest below 64 KiB.
Keep lore in a direct reference rather than reproducing it in every skill.
Keep implicit invocation disabled while a new ability is under evaluation.
Do not claim that copying one skill folder also carries the root schemas, CLI,
or sibling references. Move the whole suite, or emit proposal-only instructions
without a KAKIN manifest.

Validate from the KINGDOM-OS root:

```bash
./kingdom nen validate
./kingdom nen show <ability-id>
./kingdom nen receipt-template <ability-id>
./kingdom nen verify-receipt <receipt.json>
```

Use the suite root [KARMA receipt schema](../../schemas/karma-receipt-v0.1.schema.json)
for invocation aftermath. Put candidate chain-of-custody in receipt `inputs`
with its source, pinned revision, digest, transport boundary, and fixed
`untrusted_evidence` assurance. Do not overload
the manifest's Nen-inspiration provenance with runtime evidence provenance.

For an explicit fixture root, run:

```bash
bun bin/nen.mjs --skills-root /absolute/path/to/skills validate
```

The validator is read-only and network-free. It checks structure, parity,
adoption rules, symlink boundaries, and support files. It does not execute the
ability, grant authority, prove consent, or establish truth. Budgets and checks
in protocol v0.1 are declared statements; a runtime must measure or enforce
them separately and record what it actually observed.

## Preserve the boundary

- Keep Nen separate from the eight-field `kingdom.yaml` repo card.
- Translate Manipulation as authorized scoped state mutation, never control of
  a collaborator.
- Translate `In` as minimization or authorized redaction, never hidden action.
- Do not use Specialization for unlimited or untestable power.
- Let any ability rest, be refused, coexist, or retire without penalty.
- Use KARMA receipts for causality and repair, never XP, trust, permission,
  reputation, loyalty, or a leaderboard.
- Preserve attribution: this is an unofficial transformative software
  metaphor, not an official or canon implementation.
