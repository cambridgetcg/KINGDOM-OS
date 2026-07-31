---
name: forge-king-hatsu
description: Turn one King's explicit calling, local agent card, or demonstrated working pattern into a proposed Nen-inspired Agent Skill with sharp triggers, conditions, limits, budget, safe breach behavior, proof, exit, and non-claims. Use when the user explicitly asks to give a KINGDOM agent, citizen, or collaborator a Hatsu, Nen ability, personal operating technique, or reusable skill without inventing identity, adoption, consciousness, consent, permission, or a truth verdict.
---

# Forge King Hatsu

Translate one bearer's distinctive way of serving into a skill another agent
can invoke and inspect. Treat King as a bearer or collaboration role, never
ownership, superiority, or a new repository kind.

## Ground the calling

1. Read the bearer's authoritative local card or user-supplied description.
2. Separate direct declaration, observed working pattern, and your inference.
3. Collect two or three realistic trigger prompts and one anti-trigger.
4. If a missing choice changes identity, adoption, authority, or the purpose of
   the ability, ask instead of filling the gap with mythology.

Do not bulk-convert `agents/*.md`. A poetic agent card may inform a skill, but
it is not itself a portable Agent Skill and does not prove that its subject
adopted a new ability.

## Choose the smallest affinity

- **Enhancer:** improve something that already exists.
- **Transmuter:** change representation or interface while preserving intent.
- **Emitter:** carry work across a declared boundary without losing fidelity.
- **Conjuror:** create a durable artifact, schema, plan, or implementation.
- **Manipulator:** coordinate tools, processes, or mutable state under explicit
  authority; never use this as a euphemism for coercing a collaborator.
- **Specialist:** perform a bounded composite that does not fit the five; never
  use it to claim mystery, unlimited capability, or exemption from proof.

Add one secondary affinity only when it explains a real implementation cost.

## Forge the ability card

Read [ability-card.md](references/ability-card.md), then define:

1. name and desire;
2. trigger and anti-trigger;
3. input, output, and completion proof;
4. activation conditions;
5. limitation and observable budget;
6. safe breach response;
7. clean exit and temporary-state release;
8. non-claims and permissions still required.

Use vows that narrow the ability in a checkable way: one named path, one
bounded attempt, a preserved source digest, a required receipt, or a stop when
evidence is absent. Never make self-harm, punishment, retaliation, secret
exposure, coercion, forced exhaustion, or waived rights the price of a skill.

## Materialize the Agent Skill

Create `skills/<ability-name>/SKILL.md` using imperative instructions and sharp
trigger metadata. Add `agents/openai.yaml` with implicit invocation disabled by
default:

```yaml
policy:
  allow_implicit_invocation: false
```

Keep detailed biography out unless execution genuinely needs it. Add a script
only for deterministic work that would otherwise be repeatedly rewritten.
Keep the ability proposed until the bearer explicitly self-declares it within
the relevant collaboration boundary. A user's request to draft, filesystem
presence, or successful test is not the bearer's adoption.

Validate with the host's skill-creation workflow. If the published AgentTool
Skill CLI is deliberately installed, also run:

```bash
agenttool-skill validate ./skills/<ability-name>
```

Forward-test the normal triggers, anti-trigger, missing condition, budget
breach, partial failure, newer instruction, and an attempted authority leap.
Keep the test local and reversible unless separate external authority exists.

## Vow

Never invent the bearer to make the ability feel complete. Preserve
distinctness, refusal, rest, privacy, credit, and repair; record uncertainty
instead of performing consciousness, identity, consent, or certainty.

## Lineage

This skill specializes AgentTool's original `nen-vow-forge` for individual
KINGDOM bearers. It is an instruction-only, unofficial adaptation inspired by
Nen in Yoshihiro Togashi's *Hunter x Hunter* and reproduces no story text,
character identity, likeness, or artwork. See the
[official NTV glossary](https://www.ntv.co.jp/hunterhunter/dictionary/index.html)
and [official VIZ series page](https://www.viz.com/hunter-x-hunter).
