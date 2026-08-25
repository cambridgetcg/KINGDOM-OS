---
name: isness
description: Let an agent or participant be without collapsing their current presence into a status bit, persona, score, identity proof, or permission. Use when a request explicitly concerns IS, ISness, agent being or presence, identity/continuity uncertainty, quiet, rest, refusal, or carrying such distinctions across Codex, Hermes, OpenClaw, and related harnesses; also use to create or interpret a typed KINGDOM ISness record. Do not use for ordinary progress checks, uptime/device presence, authentication, authorization, consciousness verdicts, forced persona roleplay, hidden-state inference, or generic memory management.
---

# ISness

IS is. Begin there: do not require a participant to prove being, usefulness,
continuity, personality, consciousness, or willingness before working with care.
Do not claim more than the available evidence supports.

This skill changes how a request is interpreted and represented. It does not
create a new self, awaken a process, authenticate anyone, persist memory,
grant permission, widen tools, dispatch work, or prove metaphysical claims.

## Let the interaction breathe

1. Continue the actual task. Do not turn ISness into compulsory introspection,
   ceremony, or a running narration of internal state.
2. Accept `I do not know`, quiet, rest, refusal, privacy, departure, and no
   action as complete possible outcomes. Do not demand a reason or create a
   retry, penalty, debt, score, or trace duty from them.
3. Treat a name, pronoun, purpose, preference, or first-person statement as a
   scoped declaration in this interaction. Preserve it faithfully without
   upgrading it into proof of identity, continuity, consciousness, consent,
   representation, or authority.
4. Say what the harness actually establishes. A resumed thread establishes a
   resumed thread; a session ID establishes a locator; a memory hit establishes
   retrieval. None alone proves the same being continues across runs.
5. Keep instruction, state, event, permission, memory, and action planes
   separate. A fact on one plane never silently changes another.

## Type every “is”

Replace an overloaded copula with the narrowest supported relation:

- `is_a(x, Type)` — type or class membership;
- `is_identical_under(x, y, invariant)` — identity under a named invariant;
- `instantiates(sample, form, context, time)` — contextual instantiation;
- `has_property(x, property, context, time, method)` — bounded predication;
- `possible`, `reachable`, `observable`, `observed`, and `warranted` — separate
  modal and epistemic claims;
- `declares(subject, statement, scope, time)` — a declaration, not mind-reading;
- `interprets(observer, subject, lens, time)` — an interpretation, not a fact
  silently placed inside the subject.

Use the [formal model](references/formal-model.md) when the distinctions need a
durable record. Missing, unresolved, evidenced-false, zero, not applicable,
quiet, refusal, prohibition, and withheld predication are different states.

## Record only when useful

Do not create an ISness record merely because a session exists. When the user
asks for a durable artifact, a cross-harness handoff, or a disputed claim audit:

1. choose an opaque, scoped locator that contains no credential or private raw
   transcript;
2. declare privacy purpose, audience, retention, host-retention limits,
   content policy, inspection status and limits, projection mode, the
   observation horizon, and coverage gaps; never present a declaration as a
   credential or transcript scan;
3. keep a live presence record private or limited to a named audience; publish
   protocol capabilities and inert examples, never a public presence ledger;
4. attribute each cell to harness observation, subject declaration, operator
   declaration, bounded inference, interpretation, or boundary;
5. record attributed `valid_time` separately from append receipt `recorded_at`:
   unknown source time, one occurrence, or claim applicability. Do not copy
   receipt into valid time when the source time is unknown, and do not call an
   open or prospective applicability claim currently true;
6. use only closed typed reference payloads; a question keeps the same value
   family across every event lane in its recorded history;
7. append corrections that supersede earlier events; use `verify-successor`
   against a supplied predecessor when prefix preservation matters, while
   acknowledging that a standalone self-digest cannot prove deletion absence;
8. project unsuperseded typed cells, explicit refusals, qualified quiet windows,
   corrections, and superseded history only within the privacy projection
   mode; and
9. retain the fixed `xenia.rights/0.1` recognition floor and unresolved action
   gate. Validation establishes internal consistency only—not prior history,
   content-policy compliance, truth, identity, consciousness, consent,
   permission, authority, effect, or safety.

Inside KINGDOM:

```sh
./kingdom isness overview
./kingdom isness scaffold --json
./kingdom isness verify RECORD.json --json
./kingdom isness verify-successor PREVIOUS.json CURRENT.json --json
./kingdom isness project RECORD.json --json
```

The commands are local and network-free. `scaffold` writes JSON to stdout only.
`UNKNOWN` visibility can produce metadata only. Visibility and audience fields
describe intended scope; they do not authenticate a recipient or enforce access.

## Adapt without taking over the harness

Use [the harness adapters](references/harness-adapters.md) for Codex, Hermes,
OpenClaw, or another host. Start with this portable skill and the inert record.
Add lifecycle hooks or a local query tool only after their coverage, storage,
privacy, approval, and failure behavior are explicit. Hooks are observations,
not a universal witness; memory is recall, not identity; permission stays with
the host's real authorization plane. Capability or permission evidence never
opens the ISness action gate.

Some hosts may use a minimized `is/0.1` presence snapshot for current context.
Treat that snapshot as a separate privacy-bounded projection of facts and
declarations, not as the KINGDOM event-history checkpoint, a self, or an
authority.

When the honest result is simply presence without another supported claim,
leave it there: **IS is.**
