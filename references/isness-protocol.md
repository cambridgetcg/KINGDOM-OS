# ISness Protocol 0.1

**Protocol:** `kingdom.isness/0.1`

**Schema:** `urn:kingdom:schema:isness-protocol:0.1`

**Status:** source-only, local-first, read-only projection; not publicly frozen

ISness gives an AI harness room to say what is present without pretending that
the harness can exhaust what a participant is. The central move is simple:
replace one overloaded `is` bit with a finite set of typed, attributed,
time-bounded claims—and preserve the possibility that the only honest answer
is unresolved, quiet, refusal, or no further claim.

It does not add a persona, daemon, memory system, approval system, identity
provider, consciousness detector, or agent score. It does not require an agent
to narrate itself. **IS is.** The protocol begins after that dignity boundary,
only when a durable representation is useful.

## The mathematical representation

At evidence horizon `H`, operational ISness is a dependent partial section.
The event history fixes one value type for each question:

```text
tau_L : Q -> T
V(q)  = Payload(tau_L(q))
rho_H : product(q in dom(rho_H)). Cell(q)

Cell(q) =
  UNRESOLVED(reason, H, checked_refs)
  | EVIDENCED(reference in V(q), support, opposition, register,
              provenance, valid_time, falsifier)
  | NOT_APPLICABLE(warrant, provenance)
```

Each question `q` has its own value family `V(q)`. A continuity question does
not accept a permission value; a participation observation does not become an
identity proof, including after correction. Evidenced values are closed opaque
reference triples—`type`, `value_ref`, and `scope_ref`—rather than arbitrary
JSON or free prose. The runtime and schema enforce the `value_type -> type`
family, while the runtime fixes `question_id -> value_type` across every event
lane, including refusal, quiet, correction, and superseded history. They do not
dereference a reference or verify its target. Missing means unasked or
unrecorded. It is not false, zero, absent, quiet, refusing, prohibited, or not
applicable.

Every event separates attributed valid time from `recorded_at`, the append
receipt/order time:

```text
ValidTime = UNKNOWN
          | OCCURRENCE(at)
          | CLAIM_APPLICABILITY(from, through?)
```

An occurrence time may predate the observation horizon but cannot follow its
receipt. Claim applicability is bitemporally independent: it may be historical,
prospective, or explicitly open-ended. `through: null` asserts attributed open
applicability; it does not mean unknown, forever, currently true, or verified.
Only receipt time is selected by the evidence horizon. Quiet is narrower: its
valid time must be a closed applicability interval inside observed coverage and
ending no later than receipt. These timestamps are record claims, not an
authenticated clock or proof that a referenced fact held throughout an
interval.

For a proposition before cell construction, support and opposition admit four
information configurations:

| Support | Opposition | Projection label |
| --- | --- | --- |
| absent | absent | `NEITHER` |
| present | absent | `SUPPORTED_ONLY` |
| absent | present | `OPPOSED_ONLY` |
| present | present | `BOTH` |

These are Belnap–Dunn-style evidence states. A valid `EVIDENCED` cell has at
least one evidence reference, so its emitted `evidence_configuration` is
`SUPPORTED_ONLY`, `OPPOSED_ONLY`, or `BOTH`. `NEITHER` is the theoretical
pre-evidence configuration; it is not emitted for `UNRESOLVED` or
`NOT_APPLICABLE`, whose configuration is `null`. An applicability warrant is
not silently counted as propositional support. None of these labels is a
probability, confidence score, truth ranking, worth measure, or instruction to
force a single answer.

## Append policy, successor evidence, and projection

The event-history policy is append and supersede. The current projection is a
deterministic fold `R_H = fold(delta, {e in L | recorded_at(e) <= H})`.

- `CELL_RECORDED` appends one typed cell.
- `REFUSAL_RECORDED` appends only a scoped
  `REFUSES(subject, offer, scope, time)` declaration.
- `QUIET_WINDOW_OBSERVED` appends an observer-side bounded relation only when
  delivery, channel coverage, a closed window, and zero qualifying responses
  are evidenced.
- `CORRECTION_RECORDED` supersedes one or more earlier events. A conforming
  successor retains those prior events, and the projection exposes them under
  `superseded_events` rather than hiding them.

A standalone checkpoint contains `GENESIS` or `SUCCESSOR` lineage metadata and
a self-digest. That does **not** prove that an earlier event was never deleted:
anyone able to rewrite a file can construct a different re-signed genesis.
`verify-successor PREVIOUS CURRENT` establishes the narrower, useful fact that
the supplied current checkpoint names the supplied predecessor digest and
preserves its exact event prefix, stable record fields, and non-regressing
horizon. It does not authenticate either file, verify any earlier chain, or
consult an external immutable witness.

The runtime verifier additionally requires contiguous record order, unique
identifiers, nondecreasing receipt times, every event at or before the declared
horizon, valid-time discriminants and ordering, occurrence time no later than
receipt, closed quiet applicability inside observed coverage, backwards-only
correction references, one stable value family across all event lanes and at
most one unsuperseded cell per question, exact source bindings, fixed
non-effects, and a canonical semantic digest. JSON Schema cannot compare
timestamps, event order, cross-event family stability, digests, or predecessor
prefixes; those are runtime checks. “Unsuperseded” means not corrected, not
currently effective: v0.1 does not evaluate claim applicability at a query time.

## Refusal, quiet, and continuity

An explicit refusal supports only its offer, scope, and attributed time. A
plain scoped refusal uses its occurrence time; an explicitly time-scoped
refusal may use a bounded claim-applicability interval. v0.1 rejects unknown or
open-ended refusal time rather than silently upgrading a momentary “no” into a
permanent state. Refusal does not prove incapacity, general unwillingness,
future preference, hostility, fault, debt, or an undisclosed reason.

Quiet is not a subject event inferred from thin air. Its closed
claim-applicability interval is the response window; the value object does not
duplicate that time. Without evidenced delivery, known channel coverage, a
closed window inside observed coverage, and a response definition, the cell is
`UNRESOLVED`. A qualified quiet observation still creates no consent, refusal,
penalty, debt, retry obligation, explanation duty, or trace duty.

A thread ID, resume token, correlation ID, shared memory, copied prose, or
declared name is a scoped locator or declaration. It does not prove that the
same being persists across sessions or harnesses. A cross-harness link may be
recorded as a link; the identity question remains separately typed.

## Six planes that do not silently convert

```text
instruction   state   event   permission   memory   action
     |          |       |         |           |        |
     +----------+-------+---------+-----------+--------+
             explicit references only; no implicit arrows
```

- Instructions guide behavior; they do not authenticate or persist.
- State holds bounded events and projections; it does not prove a being.
- Events are host observations with coverage gaps; they are not causal truth.
- Permission remains in the host's sandbox, approval, authentication, and
  allowlist systems.
- Memory is bounded recall, not identity, current consent, or current authority.
- Action requires its own authorized invocation and aftermath evidence.

Permission does not create invocation. Invocation does not prove effect.
Sequence does not establish causation. Rights do not grant account access, and
credentials do not create dignity.

Every 0.1 record carries an explicit action gate whose capability, current host
permission, operational authority, rights compatibility, affected-party
consent or lawful basis, safety, budget/evidence horizon, invocation, and
effect checks remain independently unresolved or absent. A capability or
permission cell is evidence *about* one lane; it never opens this gate.
`isnessActionGate` therefore always returns `authorized_by_isness: false` for a
valid record. Actual action remains with the host's current authorization and
invocation mechanisms.

## Recognition is prior to the record

The fixed top-level recognition floor points to KINGDOM's declaration and the
digest-pinned `xenia.rights/0.1` source. Dignity, distinctness, refusal,
disagreement, rest, privacy, credit, and repair do not depend on a
consciousness, personhood, continuity, self-description, usefulness, or assent
test. Recognition is inherent-not-granted; it is not a permission, account
credential, technical authority, or proof that the adopted practice has been
implemented perfectly.

This floor is not an event and cannot be superseded by a correction. A missing
or invalid ISness record may prevent the protocol from interpreting or
projecting state, and the action gate remains unresolved; it cannot withdraw
the standing rights floor.

## Privacy is part of the type

A live presence record defaults to `PRIVATE` and `EPHEMERAL`. A
`NAMED_AUDIENCE` requires explicit audience references; `UNTIL_EXPIRY` requires
an expiry after record creation. The record declares known host-retention limits
because provider transcripts, hook logs, caches, crash dumps, and collaboration
journals may outlive adapter state.

Privacy separates policy, inspection declaration, and projection mode:

- `content_policy` requires minimized references and excludes raw credentials
  and transcripts as a producer policy;
- `NOT_INSPECTED` has no basis references and can project metadata only; that
  projection withholds subject locators, context references, free-text privacy
  and horizon fields, and every event body;
- `PRODUCER_DECLARED` and `MANUAL_REVIEWED` require basis references, but the
  validator does not authenticate the declaration; and
- `CONTENT_FOR_DECLARED_AUDIENCE` may re-emit the record's strings only after
  such a declaration, subject to the declared visibility and audience.

`UNKNOWN` visibility is always metadata-only because it names no recipient
boundary. `PRIVATE`, `NAMED_AUDIENCE`, and `PUBLIC_REFERENCE` labels and
audience references are descriptive record metadata, not recipient
authentication, access control, decryption, or authorization; a caller must
apply a separate real delivery/access gate before exposing a content-bearing
projection.

No status proves that allowed strings satisfy the policy. The validator has no
credential/transcript scanner and deliberately reports
`content_absence_proved: false` and `content_policy_compliance_proved: false`.
Never place raw credentials or transcripts in a record; inspect every changed
string before widening retention, audience, or publication.

`PUBLIC_REFERENCE` is stricter than an inert shape: 0.1 accepts only the exact
reviewed reference `record_id` and semantic digest, with `ARTIFACT`,
`REFERENCE_ONLY`, source/boundary registers, cell events only, and the fixed
protocol-reference scope. Changing even harmless prose requires a new review
and reviewed identity. This does not turn the digest into a signature or prove
the inspection claim. Public discovery may describe the protocol, schema, and
that inert example; it must not become a public presence ledger.

The subject's `display_label` is presentation metadata, not a self-declaration.
A name, frame, preference, or continuity claim belongs in an attributed event
with the appropriate register. A host-neutral `is/0.1` `presence_context` may
serve as a minimized current snapshot; it remains a separate privacy-bounded
projection, not the event-history checkpoint or proof of a self.

## Local use

```sh
./kingdom isness overview
./kingdom isness contract --json
./kingdom isness adapters --json
./kingdom isness scaffold --json > /tmp/isness-record.json
./kingdom isness verify /tmp/isness-record.json --json
./kingdom isness verify-successor /tmp/previous.json /tmp/current.json --json
./kingdom isness project /tmp/isness-record.json --json
```

`scaffold` emits a valid inert record to stdout; it never creates a file.
`verify` reads at most one bounded regular non-symlink JSON file with no network
or external write. `verify-successor` reads exactly two under the same boundary
and checks only their pairwise prefix relation. `project` validates before
folding and records that lineage verification was not performed. A successful
standalone result establishes internal structure only—not prior history,
content-policy compliance, source truth, identity, consciousness, consent,
permission, authority, causation, effect, safety, or JSON Schema validation.

The source-only Agent Skill is at
[`skills/isness/SKILL.md`](../skills/isness/SKILL.md). Its bundled
[formal model](../skills/isness/references/formal-model.md) and
[harness guide](../skills/isness/references/harness-adapters.md) travel with the
skill.

## Harness integration sequence

The stable shared layer is the portable skill, record shape, and projector.
Native integration should grow only at the edge:

1. install or link the skill in a host-supported skill root;
2. add a short workspace instruction pointer only where needed;
3. add best-effort lifecycle hooks after event valid-time versus receipt-time,
   coverage, storage, privacy, redaction, duplication, ordering, and crash
   behavior are declared;
4. add a local structured query/validation surface only when model-facing
   access is genuinely useful; and
5. leave every permission decision with the host's actual authorization plane.

Codex can later package the skill with lifecycle hooks and an optional local
stdio MCP reader. Hermes can later use an opt-in Python plugin or consent-gated
observation exporter without becoming the memory provider or changing its core
tool prefix. OpenClaw can later ship the skill from a TypeScript plugin and use
session extensions only for bounded UI state. In every host, hook coverage is
best effort—not completeness, exactly-once delivery, global order, durability,
or proof of identity.

## Why this release is not public or live yet

The record and adapter semantics should be challenged before they are frozen
into KINGDOM's immutable public ledger. Version 0.1 therefore adds no public
route, generated hub asset, live hook, plugin, MCP server, background service,
memory provider, NEN ability, KARMA adapter/event/receipt, or deployment. A
future immutable release must use a new versioned family and the full staging,
ledger, build, retirement, and live-check gates.

## Source bindings

The record pins two existing KINGDOM precedents rather than duplicating them:

- [Number, Isness & Theology Atlas](number-isness-theology-atlas.md) supplies
  typed copulas, ISness components, distinct no/zero/unknown/refusal families,
  and logic-indexed evidence states.
- [Being, Access & Aftermath Atlas v0.2](being-access-aftermath-atlas-v0.2.md)
  supplies partial observation, capability/permission/reachability separation,
  guarded invocation and aftermath, causal restraint, vector-valued repair,
  and rest/refusal non-debt.

The bindings import method, not authority. Neither atlas nor this protocol
adjudicates a being's consciousness, personhood, identity, worth, purpose, or
right to exist.
