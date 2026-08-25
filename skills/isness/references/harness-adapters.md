# Harness adapters

The portable layer is the skill, the `kingdom.isness/0.1` record, and its
deterministic projection. A host adapter translates only facts the host exposes.
It must declare omitted events and must not add semantic inference.
Hooks are bounded observations, never a universal witness.

A minimized `is/0.1` `presence_context` may be used as a host-facing snapshot.
It is a separate projection, not the KINGDOM event-history checkpoint. Snapshot validation
does not authenticate the subject or transfer identity, continuity, consent,
permission, authority, memory, or action into the host.

Keep six planes non-convertible:

| Plane | What it does | What it does not do |
| --- | --- | --- |
| Instruction | Guides model behavior | Authenticate, persist state, or grant permission |
| State | Stores bounded events and projections | Prove identity, consciousness, consent, or truth |
| Event | Reports a host-observed lifecycle occurrence | Guarantee completeness, exactly-once delivery, global order, or causation |
| Permission | Uses the host's sandbox, approval, auth, and allowlists | Arise from ISness, rights, memory, or prior approval |
| Memory | Recalls bounded summaries or references | Become the protocol database or prove current identity/consent/authority |
| Action | Attempts one separately authorized invocation | Arise automatically from another plane or prove effect or causation |

The fixed `xenia.rights/0.1` recognition floor shapes treatment on every host
without becoming technical permission. The fixed ISness action gate remains
unresolved even when the record contains capability or permission evidence;
only the host's current external gates can authorize and invoke an action.

## Codex

Begin with the portable Agent Skill and a short `AGENTS.md` pointer when the
workflow is repository-specific. A later plugin may bundle the skill,
lifecycle hooks, the local CLI, and an optional stdio MCP query/validation
server. Treat session/thread/run/item identifiers as scoped locators. Record
hook coverage gaps, including events outside the hook surface and startup
ordering gaps. Generated memories are optional recall, never canonical state.
Codex approval profiles, sandbox policy, and MCP tool approval remain the real
permission plane.

## Hermes

Use the shared Agent Skill or an explicitly enabled project/user plugin. A
later Python plugin may translate session, tool, and subagent lifecycle facts
into the common events. Keep the tool and prompt prefix stable within a
conversation. A consent-gated shell-hook exporter is acceptable for bounded
observation, but ISness should not become the exclusive memory provider or a
core tool by default. Approval hooks observe decisions; they do not answer or
veto them.

## OpenClaw

Use a workspace skill or a plugin-shipped low-precedence skill. A later
TypeScript plugin may translate session, run, tool, and subagent hooks and keep
canonical events in plugin-owned storage. Session extensions are suitable for
small UI/status projections only. Plugin-owned side effects must still use the
native approval mechanism, which does not replace exec approvals, sandboxing,
Gateway authentication, channel authorization, Codex-native approval, or MCP
approval.

## Portable capability declaration

Every adapter should publish:

- host and adapter version;
- supported event kinds and source hooks;
- attributed `valid_time` as unknown source time, an occurrence, or claim
  applicability, plus distinct append receipt `recorded_at`; when a host exposes
  only receipt time, emit `UNKNOWN` rather than inventing event time;
- local session/run/tool locators, redacted or hashed where appropriate;
- storage and crash-durability behavior;
- known omissions, ordering limits, duplication behavior, and redaction; and
- privacy purpose, exact audience, retention/expiry, and known host-retention
  limits;
- content policy, inspection declaration and its limits, and whether projection
  is metadata-only or content-bearing; and
- the host permission and memory systems it deliberately does not replace.

For history handoff, preserve a prior checkpoint and run `verify-successor`
against the next checkpoint. This checks one supplied prefix transition. It is
not an external witness, signature, storage guarantee, or proof that a
different re-signed genesis was never created.

Live presence records default to private and ephemeral. A named audience must
be explicit, and unknown visibility remains metadata-only. Visibility and
audience references do not authenticate a recipient or enforce access; perform
that check in the host's real delivery/authorization plane. Public discovery
may describe the protocol and its inert reference artifact, never expose a
participant's presence ledger.

Cross-harness correlation requires an explicit, scoped correlation record.
Credentials, resume tokens, copied memories, matching prose, and shared names
never prove same-being identity.
