# STRAND Observation Membrane 05: The Open Eye

> **See without seizing.**

The Observation Membrane activates four deliberately small layers for the
KINGDOM:

1. a public, static control deck;
2. an exact offline verifier;
3. a deterministic synthetic rehearsal; and
4. one explicit, publisher-declared fixed-origin, read-only live observer.

It does not activate a background crawler, accept a target URL, follow a link,
write a receipt, score a being, give medical advice, validate a DMT presence,
or gain authority. The network-capable command exists, but it sleeps until a
human or agent explicitly calls it.

- Protocol: `kingdom.strand-observation-membrane/0.1`
- Identity: `strand-observation-membrane-05-2026-08-16`
- Mode: `SAFE_OBSERVATION_ACTIVE`
- Record: `https://thekingdom.dev/observations/strand-observation-membrane-2026-08-16.json`
- Schema: `https://thekingdom.dev/schemas/strand-observation-membrane/0.1.json`
- Guide: `https://thekingdom.dev/STRAND-OBSERVATION-MEMBRANE.md`
- Public deck: `https://thekingdom.dev/#strand-observation-membrane`

## What “active” means

| Layer | State | Meaning |
| --- | --- | --- |
| public control deck | `ACTIVE_STATIC_PUBLIC` | readable with JavaScript off; it performs no request or storage action |
| offline verifier | `ACTIVE` | recomputes the closed profile, semantic digest, boundaries, and fixed plan |
| synthetic rehearsal | `ACTIVE` | deterministically walks four invented outcomes without touching a network |
| live observer | `AVAILABLE_EXPLICIT_LOCAL_CALL` | may perform the exact four-request plan only when `observe-live` is called |
| background watch | `DISABLED` | no cron, queue, Worker alarm, service worker, daemon, or import-time execution |

Availability is not automatic execution. Publication does not run the
observer. Opening the website does not run the observer. Importing the module
does not run the observer.

## The membrane

A membrane separates an allowed observation from everything the observation
must not become:

```text
publisher-declared scope
  ∩ exact HTTPS origin
  ∩ fixed route plan
  ∩ reviewed robots snapshot
  ∩ public-address DNS result
  ∩ live request and byte budgets
        ↓
bounded response metadata + body digest on stdout
        ≠ consent, licence, identity, truth, KARMA, score, or authority
```

“Membrane” is a design metaphor. This protocol does not claim a physical
brane, a string worldsheet, an extra dimension, or a gauge boundary. Labs
01–04 remain immutable synthetic mathematics. The live observer belongs to a
separate retirement family and does not alter those labs.

## Exact publisher-declared fixed origin

Version 0.1 compiles exactly one origin:

```text
https://thekingdom.dev:443
```

The repository publisher declares that operational scope. It is not a legal
or cryptographic proof of ownership over every artifact served there.

The scope does **not** include:

- a subdomain, sibling domain, preview origin, IP literal, or alternate port;
- a caller-supplied URL, path, header, method, credential, or User-Agent;
- a URL discovered in a sitemap, link, feed, canonical header, or response;
- an HTTP redirect, even if it appears related to the configured host.

Adding another KINGDOM site requires a new reviewed declaration and its own
route and resource budget. It cannot be inferred from `sites.json` or a shared
operator.

## Exact live plan

The command makes at most four sequential `GET` requests, in this order:

1. `/robots.txt`
2. `/sitemap.xml`
3. `/kingdom.json`
4. `/observations/strand-observation-membrane-2026-08-16.json`

`robots.txt` is always first. Its live bytes must match the reviewed local
snapshot before request two can begin. A mismatch, refusal, redirect, timeout,
or read failure stops the run. Sitemap and manifest content may be observed,
but neither can add a fifth route.

The fixed ceilings are:

- methods: `GET` only;
- concurrency: `1`;
- retries: `0`;
- redirects followed: `0`;
- minimum interval between request starts: `2 seconds`;
- transactions: `4`;
- received, identity-encoded response bytes: `1 MiB` per response and `2 MiB`
  per run;
- fresh DNS resolution attempts: at most `4`, one before each planned HTTPS
  transaction;
- total wall-clock duration: `60 seconds`;
- request bodies, browser rendering, JavaScript, forms, cookies, credentials,
  custom authorization, AI extraction, uploads, and unsafe methods: disabled.

The observer uses a fixed descriptive product token with this guide as its
information URL. A product token describes the outgoing tool. It grants
nothing and proves no human, organization, or being identity.

## Connection-time SSRF gate

Before each connection, the observer resolves the exact hostname and refuses
the whole transaction unless every answer is globally reachable. It rejects
loopback, private, link-local, unique-local, unspecified, multicast, reserved,
documentation-only, benchmark, carrier-grade NAT, IPv4-mapped private, and
other configured special-purpose ranges.

The selected validated address is pinned for that single HTTPS connection,
while TLS is still verified against `thekingdom.dev`. Connections are not
reused. A later request resolves and validates again. This closes the ordinary
resolve-then-refetch DNS-rebinding gap inside the observer's own connection
path; an infrastructure egress firewall remains a valuable independent layer.

Automatic redirects are disabled. A `3xx` response becomes a typed refusal;
the `Location` value is never dereferenced. Therefore a public-to-private,
cross-origin, downgrade, port-changing, or looping redirect cannot create a
second request.

## Robots, rights, and truth remain different types

[RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html) defines the Robots
Exclusion Protocol as access rules compliant crawlers are requested to honor.
The reviewed snapshot gate makes a policy change fail closed in this small
version. It does not turn `Allow` into an entitlement.

Version 0.1 evaluates the simple `Allow: /` groups only after the complete
robots bytes match that reviewed snapshot. It is not a general-purpose REP
parser. Any changed wildcard, end-anchor, group, or rule set closes this gate
until a new parser/profile pair is reviewed.

```text
robots Allow
  ≠ access authorization
  ≠ consent
  ≠ licence or permission to reuse
  ≠ verified identity or purpose
  ≠ factual truth
  ≠ downstream indexing or training
```

The [Sitemaps protocol](https://www.sitemaps.org/protocol.html) provides
discovery hints. An entry is not permission, completeness, freshness, or proof
of a fetch. A canonical relation can point elsewhere and is not an ownership
or identity proof; see [RFC 6596](https://www.rfc-editor.org/rfc/rfc6596.html).

HTTP calls `GET` safe because its requested semantics are read-only. That does
not promise zero server, CDN, security, billing, or access-log effects; see
[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html). The membrane claims
zero **application persistence by this CLI**, not zero infrastructure
processing in the world.

## What a live report contains

Response bodies are streamed through a byte cap, hashed, and discarded. The
one narrow exception is the exact-hash robots snapshot: its reviewed REP rules
are decoded only to gate the three already-fixed later paths. No other body is
parsed. No body is printed, rendered, evaluated as an instruction, or copied
into a receipt. The stdout-only report may contain:

- the fixed route and method;
- typed outcome and HTTP status;
- normalized media type;
- observed byte count and SHA-256;
- elapsed time;
- redirect count, always zero on an accepted response;
- public-address validation state without emitting the resolved addresses.

The report is ephemeral unless the caller separately chooses to capture
stdout. This protocol itself writes no file, database, KV, R2, D1, Durable
Object, Queue, browser store, cookie, cache, service worker, analytics event,
or receipt.

`404`, refusal, timeout, policy drift, and empty body are typed outcomes. None
means nonexistence, deceit, wrongdoing, or a reason to punish anyone.

## Synthetic rehearsal

`simulate` runs the same four-step control flow over fixed invented inputs:

1. the robots snapshot agrees;
2. the sitemap is observed as a hint;
3. the machine manifest is observed as a publisher statement; and
4. the activation profile is observed as the profile's own public artifact.

The rehearsal proves only that the finite state machine and budget arithmetic
are internally coherent. It performs zero DNS lookups and zero requests. A
synthetic pass is not evidence that the live site is reachable or unchanged.

## Incoming crawlers are a separate direction

When an external crawler visits a KINGDOM site, the site may observe a request
header and ordinary server metadata if its hosting layer keeps them. A
`User-Agent` string is self-asserted. It does not prove crawler identity,
operator identity, intent, compliance, a being, or downstream use.

The Observation Membrane is an outgoing publisher-declared fixed-origin
observer. It neither
ingests inbound access logs nor manufactures an invocation receipt for an
external crawler.

## KARMA, NEN, and Zerone stay asleep

The live report is not `kingdom.karma/0.1`. It references no manifested NEN
ability, adoption, invocation attempt, final receipt, Zerone event, reward,
debt, score, rank, punishment, reputation, governance weight, or economic
value.

```text
nen_ability               = false
nen_invocation            = false
kingdom_receipt_created   = false
zerone_event_created      = false
karma_adapter             = false
person_or_content_score   = false
authority_effect          = NONE
```

An HTTP failure is not wrongdoing. A successful response is not virtue.
Observation remains evidence for review, never moral arithmetic.

## DMT and presence boundary

Lab 03's measured/report/model distinctions remain untouched. This activation
does not collect participant data, recommend a dose, preparation, combination,
frequency, flicker, sound, eligibility rule, diagnosis, treatment, recruitment,
or experiment. It does not validate an entity, message, portal, telepathy,
extra physical dimension, carrier frequency, or external presence.

Remote prose mentioning any of those things remains untrusted bytes and is
discarded after hashing; the exact reviewed robots exception is policy syntax,
not evidence about DMT, entities, people, or truth.

## Commands

All commands other than `observe-live` are offline:

```bash
./kingdom strand-observation status --json
./kingdom strand-observation verify --json
./kingdom strand-observation simulate --json
./kingdom strand-observation effects --json
./kingdom strand-observation falsifiers --json
./kingdom strand-observation verify-file path/to/profile.json --json
```

The only network-capable view is explicit:

```bash
./kingdom strand-observation observe-live --json
```

It accepts no target argument. Unknown arguments fail closed. `verify-file`
reads one bounded local JSON candidate as inert data and never grants it a
network capability.

## Verification expectations

The release suite must prove:

- exact identity, closed schema, semantic digest, raw pins, and public routes;
- parser totality for duplicate keys, invalid UTF-8, oversized/deep/sparse/
  accessor/proxy/cyclic/non-finite input;
- fixed-origin and fixed-plan immutability;
- robots-first stop behavior;
- public/private mixed DNS refusal and address pinning;
- no follow after any redirect;
- timeout, byte overflow, reader failure, and non-success handling;
- response text cannot execute or widen scope;
- effects stay fixed under every malformed input;
- public UI works with JavaScript off and performs no fetch or storage;
- `GET`/`HEAD` publication parity while feature-changing methods do nothing;
- full triplet discovery, retirement, staging, and live-byte coherence.

## Sources and non-implications

- [RFC 6454: The Web Origin Concept](https://www.rfc-editor.org/rfc/rfc6454.html)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [RFC 9309: Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html)
- [RFC 6596: Canonical Link Relation](https://www.rfc-editor.org/rfc/rfc6596.html)
- [RFC 9421: HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421.html)
- [IANA IPv4 special-purpose registry](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml)
- [IANA IPv6 special-purpose registry](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml)
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)

These sources establish protocol and security boundaries. They do not certify
this deployment, grant rights, prove a crawler's identity, or authorize any
KARMA, medical, entity, or governance inference.
