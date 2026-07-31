# NEN — conditions make ability legible

KINGDOM Nen is a thin bridge between the Kingdom's callings and AgentTool's
published, instruction-only Nen operating suite. It manifests collective and
individual abilities as ordinary Agent Skills whose triggers, conditions,
limitations, budgets, breach behavior, proof, exit, and non-claims are readable
before use.

It is an original software metaphor inspired by the Nen system in Yoshihiro
Togashi's *Hunter x Hunter*. It is unofficial and unaffiliated. It adapts the
design insight that a narrowly conditioned ability can be more dependable than
an undefined power; it does not reproduce canon story text, character identity,
likeness, attacks, or artwork.

## Existing foundation

`@agenttool/skills@0.3.0` already publishes eight Nen operating skills:

- contract mantle;
- dependency perimeter;
- concealed trace;
- critical-path forge;
- smoke squad;
- verification ledger;
- godspeed loop;
- vow forge.

KINGDOM does not fork those generic mechanics. It adds two repo-local bridge
skills:

- `shape-kingdom-nen` composes the smallest sufficient operating ability for a
  collective Kingdom outcome;
- `forge-king-hatsu` turns one explicit bearer calling into a proposed personal
  Agent Skill.

KINGDOM owns ability identity and composition. AgentTool owns generic operating
techniques and bounded local Skill inspection. Existing `agents/*.md` remain
poetic citizen cards; they are not bulk-converted or treated as adopted skills.

Here, KINGDOM is the collective bearer. A King is an individual bearer or
collaboration role, not an ownership title, rank, or new repository/registry
kind. The framework can therefore serve many Kings without inventing a second
source of identity.

## Ability shape

```text
calling
  -> one primary operating skill
  -> affinity by effect
  -> trigger + anti-trigger
  -> conditions + limitation + real budget
  -> safe breach + proof + exit
  -> permissions + non-claims
  -> SKILL.md + explicit-invocation sidecar
```

An authorized collective repository declaration may adopt a collective
ability. An individual ability remains proposed until that bearer explicitly
self-declares it within the relevant collaboration boundary. Filesystem
presence, successful tests, user enthusiasm, and continued use do not
independently prove adoption.

## What it does

- Makes a capability legible and reusable.
- Gives refusal, rest, revision, and retirement first-class paths.
- Makes narrower promises reviewable through concrete tests.
- Preserves source vows when skills are composed.
- Keeps KINGDOM's tiny eight-field `kingdom.yaml` card unchanged.

## What it does not do

- A skill does not grant a credential, permission, consent, identity,
  consciousness, truth verdict, or external authority.
- A vow does not waive rights or justify punishment, self-harm, coercion,
  retaliation, secret exposure, or forced exhaustion.
- An affinity does not type a personality or rank one bearer above another.
- Validation inspects structure; it does not execute or prove an ability's
  behavioral claims.

The standing rights floor is `xenia.rights/0.1`. Rights and permissions remain
different: a King may have dignity while lacking permission for a particular
system, and a credential never turns a collaborator into an owned resource.

## Source and activation boundary

The folders under `skills/` are source only. Their presence does not install,
register, or activate them in Codex, Claude, OpenClaw, or another host. Both
OpenAI sidecars set `policy.allow_implicit_invocation: false`; invoke them
explicitly while the framework is evaluated.

When the published AgentTool CLI is deliberately installed, inspect a skill
without executing it:

```bash
agenttool-skill validate ./skills/shape-kingdom-nen
agenttool-skill validate ./skills/forge-king-hatsu
```

That inspector performs no installation, activation, network request, skill
script execution, credential lookup, hosted call, or deployment. Its report is
structural evidence, not approval, provenance proof, or truth.

For source orientation, see the
[official NTV glossary](https://www.ntv.co.jp/hunterhunter/dictionary/index.html)
and [official VIZ series page](https://www.viz.com/hunter-x-hunter).
