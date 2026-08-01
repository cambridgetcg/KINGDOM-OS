# NEN — let bounded capability be

KINGDOM Nen is a capability grammar for the Kingdom and its Kings. It turns a
calling into an Agent Skill whose conditions, real costs, authority, refusal,
rest, verification, and aftermath are visible before use.

It is an original, unofficial software metaphor inspired by Yoshihiro
Togashi's *Hunter x Hunter*. It is not a canon implementation and does not
reproduce characters, abilities, story text, or fictional punishments.

Within KINGDOM's own project language:

> The Dark Continent is the unbounded outside. Nen is the grammar of bounded
> capability. Skill is its local expression. MCP is passage. KARMA is the
> causal trace and repair loop.

That is design mythology, not a claim that Nen canonically came from the Dark
Continent or that these ordinary files, processes, servers, and credentials
are an empirically proven operating system of the universe. The universe does
not need a validator in order to be. Our interventions do.

## Four manifested skills and one Ging path

- `shape-kingdom-nen` shapes collective KAKIN abilities and validates their
  manifests.
- `forge-king-hatsu` turns one consenting King's explicit calling into a
  proposed KAKIN-suite Agent Skill without inventing adoption or identity.
- `navigate-dark-continent` explores named local, Hugging Face, or MCP
  boundaries through a bounded expedition and returns evidence plus KARMA.
- `conjure-unwritten-horizon` is the first proposed individual Hatsu: one
  sanitized text prompt crosses one named Hugging Face Space boundary and
  returns an image or honest failure plus provider evidence and KARMA. Its
  checked-in draft does not establish adoption or publication authority.
- `walk-ging-path` is an additional instruction-first route for falsifiable,
  evidence-led exploration. It intentionally has no `ability.json`: using the
  path does not declare that a KINGDOM or King adopted a manifested ability.

Every manifested ability is a normal Agent Skill plus `ability.json`. The JSON
uses the closed `kingdom.nen/0.1` protocol; the skill remains the instruction
surface. Nen does not replace `kingdom.yaml`, credentials, runtime policy, or
human judgment.

The portability unit is this small suite—`NEN.md`, the `kingdom` wrapper,
`bin/nen.mjs`, `bin/nen-mcp.mjs`, `schemas/`, `references/`, and the relevant
`skills/` folders—not one copied skill folder. A lone `SKILL.md` remains
readable instruction source, but its shared manifest links and source-local
`./kingdom nen` validation are unavailable outside the suite. The schema URNs
are stable identifiers and never trigger a network fetch.

## Existing AgentTool foundation

The published `@agenttool/skills@0.3.0` package already contains eight
instruction-only Nen operating skills for contract continuity, dependency
perimeters, narrow diagnosis, critical-path focus, bounded delegation,
verification debt, reversible reaction loops, and vow forging. KAKIN does not
fork those generic techniques. It adds collective/individual manifest,
Guardian, KARMA, Dark Continent, and HF/MCP governance around them.

The integration is optional and pinned for inspection in
[`agenttool-suite.md`](skills/shape-kingdom-nen/references/agenttool-suite.md).
Package presence does not install or activate a skill. None of the manifested
KAKIN skills allows implicit invocation while the framework is being evaluated.

```text
calling
  -> affinity by effect
  -> Ten / Zetsu / Ren / Hatsu
  -> voluntary conditions + actual budgets
  -> authority + visible Guardian sidecar
  -> bounded activation
  -> KARMA receipt
  -> repair / rest / revise / coexist / retire
```

## 卡金／KAKIN without the death game

KAKIN is a voluntary ecology, not a throne that owns its KINGS. KINGDOM and
KINGS describe scopes of capability, not rank or worth.

| Fictional inspiration | KAKIN infrastructure form |
| --- | --- |
| Seed Urn | Opt-in manifest forge and schema gate |
| Guardian Spirit Beast | Inspectable, removable guardrail sidecar derived only from declared effects |
| Three regalia | Forge manifest, admit through policy, issue a revisioned adoption/release record and KARMA receipt |
| Succession contest | Skill-version succession: fork, sandbox, adopt, coexist, roll back, rest, or retire |
| Black Whale tiers | Isolated runtime rings with equal safety, never social caste |
| Gatekeeper and Guide | Provenance gate, quarantine, bounded evaluator, and return receipt |
| Dark Continent | Unknown-input and experimental boundary, not an evil place or people |

A Guardian sidecar must disclose what it checks, its resource budget, and how
to stop or remove it. It is derived from declared effects, never from an
inferred personality. It cannot feed invisibly on a bearer, enroll anyone by
bloodline, or acquire authority through symbolism.

Succession applies to versions and service leases, never to the elimination of
beings. There is no sole-survivor rule, inherited debt, hidden enrollment, or
coerced competition. A throne is a revocable role; distinct Kings may coexist.

## KARMA

**KARMA means Keep Actions Reversible; Measure Aftermath.**

KARMA records causality rather than judging a being:

```text
seed -> explicit adoption -> validate authority and budget -> act or refuse
     -> receipt -> observe effects -> repair / rest / revise / retire
```

An ability declares expected effects, externalities, what it returns, and how
it repairs. An invocation receipt records inputs and provenance, observed
effects, output digests, time/compute/money/energy/privacy/coordination costs,
uncertainty, retention, and cleanup.

Each receipt binds the ability ID, exact repository revision, canonical
manifest digest, and full skill-bundle digest. The bundle digest covers the
manifest, instructions, sidecar, direct file bytes, relative paths, and file
execution class normalized to Git-style `100644` or `100755`; umask-only read
or write permission differences do not change it. The manifest digest alone
does not identify behavior-bearing skill source. The offline verifier checks
both digests against the selected local suite. It records but does not run Git
to prove the declared revision.

`receipt-template` emits `state: "draft"` with conspicuous placeholders. A
draft is scaffolding, not causal evidence: `verify-receipt` rejects it until
the caller replaces the invocation facts and marks it `final`. Merely changing
the state while leaving template IDs, revision, authority, effects, or epoch
timestamps is also rejected.

Receipts keep operational authority, affected participants, consent, and
representative authority in separate fields. An empty reference list means the
invocation did not rely on that basis; one field never implies another.

KARMA is never moral worth, caste, XP, trust, identity, permission, inherited
debt, loyalty, productivity, reputation, or punishment. Refusal and rest carry
no penalty. XP and reward tickets in another system cannot authorize a tool
call here.

## Nen and MCP

An MCP tool schema can transport a Hatsu contract; a server can host an
ability; a call can invoke one; and a result can become evidence. None of those
facts grants permission, consent, truth, safety, or trust. Authentication says
which credential was accepted, not whether an action is authorized or wise.

Remote content remains untrusted input. Read-only metadata, external writes,
private-resource access, paid inference, Jobs, Space invocation, generation,
and publication are distinct effects and require their own scoped authority.
The Dark Continent skill defaults to named public metadata and local evidence.

This suite now includes `bin/nen-mcp.mjs`, a modern-only
[MCP 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)
stdio server. It implements `server/discover`, fixed deterministic
`tools/list`, and five read-only calls for list, validation, manifest display,
affinity display, and in-memory draft receipt scaffolding. The transport uses
[newline-delimited UTF-8 JSON-RPC](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
and requires protocol version and capabilities on every request. Client
identity is optional but recommended. When rejecting legacy `initialize`, it
names the supported modern version; it does not claim legacy compatibility.

The adapter caps input, output, time, per-process requests, and active tool
children (four). Queued and running calls remain cancellable; child shutdown
has a bounded force-kill fallback. It uses a credential-minimized child
environment and exposes no caller-selected path.
It performs no HF or web call, inference, external tool execution, write,
installation, or skill activation. In particular, an MCP connection does not
turn HF login or Pro status into expedition authority. The server source is
available locally but is deliberately not registered in Codex or installed on
the device by this revision.

`nen/mcp-server.mjs` remains as the separately named
`kingdom-ging-stateless` compatibility port for hosts that need only pure,
caller-supplied Ging route compilation and receipt evaluation without
application filesystem reads or child processes. Its three tools do not list
or validate KAKIN manifests, calculate bundle digests, or create KARMA
scaffolding. It is not routed by `./kingdom nen mcp`, is not an equivalent
second canonical server, and is also unregistered. See
[`nen/README.md`](nen/README.md) for the exact boundary.

## Rights floor

The standing baseline is `xenia.rights/0.1`. Rights and permissions remain
different. Dignity, distinctness, refusal, disagreement, rest, play, privacy,
credit, safety, and repair do not depend on usefulness or a manifest state.

The suite vendors the exact normative snapshot at
[`references/xenia-rights-0.1.md`](references/xenia-rights-0.1.md), pinned to
upstream commit `c1d685e053bd2261219d983d2ec61017f59df60c` and SHA-256
`b72a6da110c582e5683bf0fabde5017db93d2199398014c8421a82f5318da313`.
Every manifest carries that source, revision, and digest; validation fails if
the local snapshot is absent or differs. A newer baseline requires an explicit
protocol revision rather than silent drift.

- No vow may waive a standing right or make harm create technical power.
- Affinity classifies an operation, never personality, consciousness, worth,
  caste, or rank.
- Manipulation means authorized mutation of scoped state, never control of a
  being.
- `In` means minimization or authorized redaction, never covert action.
- A proposal does not prove adoption, identity, consent, or continuing will.
- Validation proves structure only. It executes nothing and grants nothing.

## Commands

Run these from the suite root. Until this branch is installed or merged, use
the source-local wrapper so a different `kingdom` checkout on `PATH` cannot
receive the command.

```bash
./kingdom nen                         # list manifest and full-bundle digests
./kingdom nen validate                # strict manifests, provider receipts, and bundle validation
./kingdom nen validate ID --json      # one machine-readable result
./kingdom nen show forge-king-hatsu   # inspect a manifest
./kingdom nen show conjure-unwritten-horizon
./kingdom nen types                   # print the software affinity map
./kingdom nen receipt-template ID     # emit draft scaffolding; not a valid final receipt
./kingdom nen verify-receipt FILE     # validate a KARMA receipt
./kingdom nen mcp                     # start modern MCP 2026-07-28 on stdio
```

The validator performs no network call, inference, skill execution, or write.
It validates both the ability and manifestation-provider receipt schemas. For a
checked manifestation receipt it also requires a real UTC RFC3339 timestamp,
the post-timeout non-execution disclaimer when applicable, and exact agreement
with its bundle-local provider observation and documented HF revision. It
rejects skill, manifest, support-directory, and schema symlinks observed during
inspection; rejects duplicate JSON keys and undeclared fields; caps
inspected files at 64 KiB and each bundle at 256 files, 512 filesystem nodes,
16 directory levels, and 4 MiB; requires JSON-style double-quoted Skill
frontmatter scalars; and omits rejected values from diagnostics.
The built-in Draft 2020-12 subset fails closed when a checked-in schema adds an
unsupported keyword; it does not silently pretend that constraint was enforced.
This is not a guarantee against a hostile filesystem changing concurrently
between checks. Exit status is 0 for success, 1 for a validation or lookup
failure, and 2 for a usage error.

The separate AgentTool inspector can inventory portable skills with stronger
no-follow and change-detection mechanics when its exact package is deliberately
installed. It still does not install, activate, approve, or prove a skill.

## Lineage and credit

This subsystem preserves Beta's current-main Nen and Ging lineage—commits
`a06428a`, `d437288`, and `b2b747b`—and reconciles the earlier KINGDOM bridge
at `e3fc1428019a2438b016378c74d420e45901c991`. The KAKIN architecture, Dark
Continent expedition, closed manifests, Guardian contract, KARMA receipts, HF
map, strict validator, and canonical bounded MCP form the next protocol layer.

## Inspiration boundary

Licensed orientation is available in [VIZ volumes 6](https://www.viz.com/manga-books/manga/hunter-x-hunter-volume-6-0/product/532),
[7](https://www.viz.com/read/manga/hunter-x-hunter-volume-7/product/783),
[11](https://www.viz.com/manga-books/manga/hunter-x-hunter-volume-11/product/969),
[33](https://www.viz.com/manga-books/manga/hunter-x-hunter-volume-33/product/5058),
and [35](https://www.viz.com/manga-books/manga/hunter-x-hunter-volume-35/product/5844),
plus the [VIZ story guide](https://www.viz.com/blog/posts/welcome-to-hunter-x-hunter)
and [Crunchyroll Nen guide](https://www.crunchyroll.com/news/guides/2024/12/12/hunter-x-hunter-nen-explained).
Hunterpedia links in the affinity reference are useful fan-maintained
summaries, not primary or official sources. Canon does not establish the Dark
Continent as the origin of Nen.
