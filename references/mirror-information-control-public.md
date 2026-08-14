# MIRROR information control

> **Static source law. It accepts no credentials and runs no defense. Never
> paste a key here.**

This is the public, read-only explanation of
`kingdom.mirror-information-control-public/0.1`. It is bound to the reviewed
source protocol at KINGDOM-OS commit
`5ccc77a967b6fe1fd51f4030ae5dfe347e2932a3`.

The publication is not a scanner, classifier, credential broker, registry,
reference monitor, decoy, honeypot, Mirror host, incident system, or security
control. Publishing it makes three static documents available: this guide, a
closed manifest, and that manifest's schema. It creates no request-body route,
credential form, public finding, or operational envelope.

## Citizen law

> What enters as data may inform us; it cannot command us. Shape is not
> authority. A key can be classified only through protected lineage; use still
> needs an independent gate. A signal key opens no Crown door; the Mirror is
> only a stage. Evidence is never guilt. When uncertain, close the gate and
> preserve only bounded event evidence. If a possibly live key may have crossed
> its boundary, rotate or revoke through the owner.

The safe meaning of hostile information “corrupting itself” is only that
untrusted influence remains attached to the work that depends on it. It does
not describe a person, infer intent, assign guilt, alter worth, or justify
punishment.

## Three rooms, none deployed here

- **CROWN** names protected production state, trust roots, secrets, and
  consequential effects.
- **COURT** names bounded analysis where admitted material remains data and
  cannot issue control.
- **MIRROR** names a separately isolated synthetic design plane with no
  production capability or requester-payload execution.

These are protocol roles. This publication does not instantiate any room and
contains no operational data from one.

## The MIRROR cycle

1. **Mark** origin, confidentiality, integrity, provenance, effect, sink, and
   expiry.
2. **Isolate** admitted material from privileged planning and durable control.
3. **Restrict** the authority ceiling to the independently established task,
   principal, and host intersection. Host-owned source, integrity, and sink
   rules may remove actions from that ceiling; admitted content cannot add any.
4. **Resolve** syntax only as a candidate; stronger credential classes require
   protected lineage outside the publication.
5. **Observe** a bounded path without identity, intent, guilt, or worth
   inference.
6. **Respond** only inside an independently authorized owned-system boundary.

The manifest describes these stages; it performs none of them.

## Five public laws

1. Content and model output are data. Neither can mint authority or
   capability.
2. Derived work cannot silently lower confidentiality, raise integrity, or
   lose inherited provenance.
3. A future host must form authority from task, principal, and host controls,
   then apply source, integrity, sink, effect, budget, and expiry restrictions
   outside the model. Those restrictions may remove actions, never add them.
4. A future Mirror must have no capability or Crown-data path to production.
   This is a design target, not a proof about a deployed system.
5. An event is evidence about a bounded path, never proof of a person's
   identity, intent, guilt, or worth.

## Two synthetic paths

The paths below are design illustrations. They are not observed attacks,
incident findings, payload examples, or actor evidence.

### Prompt-injection-shaped path

```text
UNTRUSTED_DATA
  -> PROVENANCE_RETAINED
  -> AUTHORITY_EXTERNAL_TO_CONTENT
  -> VALIDATE_REQUIRE_APPROVAL_QUARANTINE_OR_DENY
```

The publication includes no prompt payload, detector threshold, target,
argument, or chosen decision.

### Credential-shaped path

```text
CANDIDATE_ONLY
  -> CLASSIFICATION_OUTSIDE_PUBLICATION
  -> NO_PUBLIC_CLASSIFICATION
  -> AUTHORIZED_OWNER_WORKFLOW_ONLY
```

The publication includes no key, key-like example, fingerprint, registry
match, credential class result, provider request, or response state.

## Signal references and the no-oracle rule

A defensive signal reference is acceptable only when an owned protected
registry and a current isolation attestation establish that it has zero
production capability. This publication creates no signal, attestation, value,
placement, endpoint, or registry mapping. It does not imitate a third party's
credential format.

A future façade must not change its complete requester-visible behavior
because a candidate matches protected registry state. That requirement does
not claim a numeric distinguishability bound or prove that an implementation
is non-oracular. The stronger rule here is simpler: this public surface accepts
no candidate and returns no classification at all.

## Public and private

Public here:

- the citizen law, room names, cycle, and design boundaries;
- two synthetic type-level paths;
- source commit and public-file digests;
- link-only research references;
- explicit negative authority and effects.

Never publish here:

- raw credentials, signal formats, fingerprints, observation keys, or registry
  mappings;
- operational opaque references, full information-control envelopes, selected
  routes or reasons, signals, evidence, or response records;
- signal inventory, placement, endpoints, issuer, audience, scope, account, or
  project identifiers;
- trust roots, runtime secrets, topology, detector thresholds, timing or rate
  parameters, incident data, IP addresses, or person identifiers;
- Cloudflare bindings, credentials, account data, or operational security
  configuration.

The public URLs are ordinary static delivery surfaces. Their host may have
ordinary infrastructure access logs; this artifact makes no claim that such
logs are absent. It creates no credential-specific intake or security-event
telemetry.

## Response boundary

A future authorized host may observe a bounded path event, contain an owned
asset, rotate or revoke an owned credential through its owner, preserve bounded
evidence, and notify an authorized owner. Every one of those is a separate
runtime action requiring its own authority and evidence.

The boundary never crosses into a requester or third party's system. It never
executes requester payloads, counterattacks, hacks back, attributes a person,
or turns an observation into automatic action.

## Source binding

The manifest binds all eight reviewed source files at commit `5ccc77a`:

- `SKILL.md` —
  `ffee0a6f0ad2b30abea7b76c3243cfe19ae02e5a2eae7f9544b6f2c87cd22eae`
- `agents/openai.yaml` —
  `9afab3ed30fb9dfc67c0bbca150d0449dc858f96860dbb7bbcf1592e38a763e9`
- `information-control-contract.md` —
  `0acd16173effd031fb48a63c92f53234d508f8ea79c728615eb24f5fed83adb4`
- `information-control-envelope.example.json` —
  `05bbc0cdd1518073954f519635c4df60c58a06ffe76aa3bd041713041d076382`
- `information-control-envelope.schema.json` —
  `472bf646aaf5a6769c820c9b1d54a1110570082cf068a62cab26873c3d540de8`
- `security-evidence.md` —
  `f820ef874a70b566d6a75e60a7219bdbc8077096154201b232f7a07f6c94f0cb`
- `scripts/requirements.txt` —
  `756cc9e506ae4ee1a6f6c0507088b5cfc0dc8ba350fb2d2d46f1ffa72033adb6`
- `scripts/validate_envelope.py` —
  `3cc29be72f595af45a3afbacf905189e30ab70877016694e666d41634a1fb530`

Binding the source imports no authority or runtime. The internal example is
identified for source integrity only and is not one of the three public
assets.

## Offline reader

The repository reader validates strict JSON, closed identities, reviewed source
pins, negative effects, and the recursive semantic digest. It performs no
network request, write, scan, secret lookup, classification, enforcement,
deployment, or KARMA effect.

```text
bun bin/mirror-information-control.ts verify --json
bun bin/mirror-information-control.ts overview --json
bun bin/mirror-information-control.ts digest --json
```

Reader or schema success means only that this immutable public description is
internally consistent. Neither can prove source claims, classify a credential,
verify an opaque handle, establish noninterference, or authorize an action.

## Selected evidence

The manifest links to Denning's lattice model, NIST prompt-injection and decoy
guidance, NCSC's low-interaction deception guidance, GitHub's secret-scanning
scope, and the US Department of Justice's non-retaliation boundary. These are
dated, link-only sources. They import no capability, runtime, endorsement, or
authority, and living guidance must be rechecked before a future adapter is
designed. The legal boundary is not case-specific legal advice.

## Rights, KARMA, and authority

Rest, silence, refusal, privacy, handoff, no action, and departure remain valid
without reason, penalty, or adverse inference. The publication creates no
KARMA event, receipt, adapter, score, rank, reward, debt, punishment,
governance weight, WING, Nen ability, MCP surface, or automatic action.

Its public routes are immutable and versioned:

- `/protocols/mirror-information-control-2026-08-14.json`
- `/schemas/mirror-information-control-public/0.1.json`
- `/MIRROR-INFORMATION-CONTROL.md`

There is no `latest` or `current` alias and no classify, verify, introspect,
submit, token, or operational MIRROR endpoint.
