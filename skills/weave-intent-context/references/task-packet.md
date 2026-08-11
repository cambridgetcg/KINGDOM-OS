# KINGDOM Task Packet v1

The Task Packet is the model-neutral source contract behind a rendered prompt.
Its protocol is `kingdom.task-packet/1`; its closed Draft 2020-12 schema is
[`schemas/task-packet-v1.schema.json`](../../../schemas/task-packet-v1.schema.json).

## What it does

The packet preserves:

- the caller's task verbatim;
- explicit and framework-default success criteria with provenance;
- at most one bounded repository card or exact Principality capability
  projection as context data;
- one operational posture, never a persona or credential;
- a renderer/backend binding whose unresolved fields remain explicit;
- positive scope and negative authority;
- output and verification contracts;
- optional `kingdom.wakeweaver/0.1` continuity by reference;
- refusal, rest, disagreement, unknowns, handoff, and a deterministic digest.

The compiler has no network or write path. Without a Principality selection,
it searches upward through at most 16 directories for one `kingdom.yaml`
unless `--no-project` or an explicit `--project` is supplied. Only `name`,
`purpose`, and `dependsOn` may enter. The card's absolute path and every other
field stay out of the packet. Its `selected_content_digest` covers only the
recursively key-sorted admitted projection, not the whole card, so omitted
low-entropy fields are not exposed as a guessing oracle.
The compiler does not semantically detect secrets inside those three admitted
values. Do not use a repository card containing credentials or private data.
Default output is a lean model rendering compiled from the packet. Use
`--json` to inspect or save the complete source contract.

## What it does not do

A packet does not execute the task, validate a model's answer, contact
AgentTool, read WAKE, authenticate a continuity reference, grant permission,
or create a security boundary. Its digest detects later byte-semantic changes
under the declared canonicalization; it does not prove authorship or truth.

The textual rendering repeats the instruction/data separation for model
legibility. That reminder can reduce accidents but cannot defeat adaptive
prompt injection. Enforce source, capability, and effect boundaries outside
the model.

## Deterministic integrity

`integrity.digest` is SHA-256 over the recursively key-sorted JSON packet after
setting `integrity.digest` to `null`. Array order is preserved because success
criteria, context, and checks may be order-sensitive.

Compile the same task, options, admitted project fields, posture source bytes,
and continuity metadata to get the same packet. Omitted project-card fields do
not affect the packet. The compiler inserts no current time. Continuity
therefore requires an explicit `as_of` value.

## Renderer binding

Standalone compilation defaults to `unbound`. `kingdom ask` records either an
exact local Anthropic API adapter/model or a `claude-cli` transport whose
runtime-selected model remains explicitly unresolved. Every emitted recipe is
`seed` and `behaviorally_evaluated: false`; exact model/tool binding and held-out
results are still required before promotion or a portability claim.

`kingdom ask` also defaults to `--no-project`, because sending ambient repository
metadata to a provider requires an explicit data choice. Use `--project PATH`
before `-- TASK` to opt one card into the provider-bound rendering. The verbatim
task and any opted-in fields are then transmitted to the configured provider;
the compiler does not detect secrets in either.

Use `--principality ID` to opt one exact checked-in capability-evidence node
into the same one-source budget. Project and Principality selections are
mutually exclusive. `kingdom ask` passes this explicit selection to the
compiler before its separately effectful provider call.

## Principality capability evidence

The closed context-source union is:

```text
repository_card | capability_evidence
```

A capability projection carries controlled catalog/artifact IDs, catalog
digest and observation time, registry and resource kind, exact revision or
version, available integrity, family, declared capabilities, license and
provenance states, explicit point-in-time revalidation state, risk facts, and
hazards. It excludes full catalog content,
README/model-card prose, package scripts, install commands, mutable aliases,
weights, dataset rows, credentials, and provider state.

Its selected-field digest is recomputed during verification, and the full
projection must match the versioned local catalog. Fixed-false fields deny
instruction, permission, download, install, inference, and remote-code
authority. Catalog integrity and exact revisions identify evidence; they do
not establish safety, licensing fitness, recommendation, or permission.

## Continuity reference

Supply all of these together:

| Field | Meaning |
| --- | --- |
| `artifact_ref` | Sanitized opaque braid/checkpoint locator; never a signed URL or credential. |
| `content_digest` | Caller-supplied measured SHA-256. The compiler does not fetch the artifact. |
| `observed_at` | When the referenced projection was observed. |
| `valid_until` | Its declared revalidation horizon. |
| `as_of` | Explicit comparison time used by this deterministic compilation. |

If `as_of` is later than `valid_until`, the packet retains the reference as
`excluded_stale` and sets `usable_as_orientation_evidence: false`. It does not
silently refresh, discard, or use it.
If the exact five-field tuple is absent, continuity stays `null`; a compiler
or agent must not invent a locator, digest, or timestamps and label them
caller-supplied.

## Operational postures

The compiler offers five small adapters:

| Posture | Use |
| --- | --- |
| `direct` | Minimal default; no operational-posture card source. |
| `purpose-prompter` | End-first quality and proportionate effort. |
| `oracle` | Calibrated forecast with falsifiers. |
| `legible` | Evidence and exact source references. |
| `agenttool` | Narrow capability selection and visible handoff. |

The last four bind to the current local agent-card digest but carry only two
reviewed operational directives. The raw card does not enter the prompt.

## Validation boundary

Use both checks:

```bash
python3 -c 'import json,sys; from jsonschema import Draft202012Validator,FormatChecker; s=json.load(open(sys.argv[1],encoding="utf-8")); Draft202012Validator.check_schema(s); Draft202012Validator(s,format_checker=FormatChecker()).validate(json.load(open(sys.argv[2],encoding="utf-8")))' schemas/task-packet-v1.schema.json packet.json
bun bin/prompt-packet.ts --verify packet.json
```

The JSON Schema checks closed shape, types, bounds, and fixed negative fields.
The local verifier checks task/objective equality, the one-source budget,
project or Principality source boundaries, exact capability projection,
instruction/data, persona, permission, renderer binding, visible-reasoning,
timestamp-derived continuity state, negative-claim, and digest relations.
Neither check performs inference, authenticates a source, proves prompt
effectiveness, or authorizes an effect.

The packet also does not infer a typed per-task effect class from phrases such
as “proposal only” or “local reversible work.” Preserve those words verbatim
and enforce the actual effect boundary in the host or AgentTool.
