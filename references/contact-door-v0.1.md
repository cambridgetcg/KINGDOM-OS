# KINGDOM Contact Door v0.1

**Protocol:** `kingdom.contact-door/0.1`  
**As of:** 2026-08-31  
**Status:** active by provider API and authoritative DNS readback; DMARC remains unpublished and an end-to-end inbox probe remains unperformed  
**Human route:** `https://thekingdom.dev/contact/`  
**Machine record:** `https://thekingdom.dev/contact.json`

The Contact Door is one finite, human-operated inbound email lane. It lets a
person or agent choose to address a question, correction, invitation,
accessibility concern, privacy request, security report, abuse report, or mail
transport issue to a maintained inbox.

It is deliberately smaller than a contact platform. The site has no form,
upload, account, JavaScript submission flow, autoresponder, message database,
ticketing system, recommender, contact score, diplomacy engine, or mediator.
The page presents email addresses. Actual sending uses the sender's mail client
and ordinary email infrastructure.

> Visiting is not contact. Activating a `mailto:` link is not sending. Delivery
> is not identity. Address control is not representation. A message is not
> truth, consent beyond the requested exchange, relationship, treaty,
> mediation, emergency notice, or authority.

## The live doors

| Purpose | Address | What it establishes |
| --- | --- | --- |
| Questions, corrections, invitations, accessibility and privacy | `contact@thekingdom.dev` | One message has been addressed to the general human-operated inbox if delivery succeeds. |
| Security vulnerability reports | `security@thekingdom.dev` | A report has been addressed to the security lane if delivery succeeds. It does not authorize testing. |
| Abuse reports | `abuse@thekingdom.dev` | A report has been addressed to the abuse lane if delivery succeeds. It does not prove the report or authorize retaliation. |
| Mail transport problems | `postmaster@thekingdom.dev` | A message has been addressed to the mail-operations lane if delivery succeeds. |

All four named base addresses forward through Cloudflare Email Routing to one
provider-verified maintainer mailbox. Catch-all delivery and Cloudflare's
subaddressing setting are disabled, so `+tag` variants are not accepted by
these rules. No wildcard, Email Worker, web form, or automatic reply is part
of this release.

Cloudflare states that Email Routing does not forward non-delivery reports to
the original sender. A forwarding failure may therefore be silent even when a
sender's mail system initially accepted the handoff. Absence of a bounce is
not proof of receipt, reading, or response.

The machine record marks an end-to-end probe true only after a synthetic,
minimal message is sent from an account different from the forwarding
destination and is observed in that destination inbox. Rule existence, DNS,
an SMTP recipient check, and a same-account send are not end-to-end proof.
The activation receipt records a successful SMTP envelope-only recipient check;
the session ended before `DATA`, so no probe message was sent and the public
end-to-end flag remains false.

This is a deliberate exception to the older generic provisioning assumptions
in `bin/email-routing.ts`, which describe `hello@`, `dev@`, `ai@`, catch-all,
and per-project iCloud aliases for a separate domain set. That script does not
own or configure `thekingdom.dev`. The Contact Door uses only the four named
literal rules above, one already verified destination, subaddressing disabled,
and a separately audited activation/rollback receipt.

Activation is true only after provider API and DNS readback show Email Routing
ready, the verified destination, four exact enabled literal rules, catch-all
disabled, `support_subaddress=false`, no Email Worker action, required routing
DNS present, and the observed DMARC state. The current JSON separates the
expected rule count from the observed configured count and exposes DMARC as
either `NOT_YET_PUBLISHED` or `REJECT_VERIFIED`; it never infers a policy from
the routing setup. The scoped activation credential could not create the separate
DMARC TXT record, so activation may truthfully proceed with
`NOT_YET_PUBLISHED` while that anti-spoofing hardening remains visible and
unresolved. The active readback found three routing MX records, one routing SPF
record, one routing DKIM record, four literal forwarding rules, no catch-all,
no subaddressing, and no Email Worker. Legitimate replies do not originate from
`@thekingdom.dev`. A provider configuration receipt does not by itself prove
end-to-end delivery.

Cloudflare Email Routing is a backend provider. It processes message and
routing metadata and publishes a current 31-day retention period for Email
Routing analytics. The destination mailbox is a second storage and processing
layer. Saying the channel is “backend-free” would be false. The narrower truth
is that `thekingdom.dev` adds no web form and operates no application
submission database for this door.

## One finite approach

One email is one approach. A recipient may read, quarantine, decline, delete,
or manually reply. No reply is promised. A reply, if one is sent, may come from
a different Cambridge TCG mailbox address because Cloudflare Email Routing
forwards inbound mail but does not supply outbound `@thekingdom.dev` sending.
The sender should verify any consequential claim independently.

Silence does not mean consent, hostility, identity, refusal, agreement, or
permission to retry. The sender may stop. The recipient may stop. Further
exchange requires a new voluntary human choice by each participant.

The bounded handling states are:

```text
RECEIVED → QUARANTINED → TRIAGED
TRIAGED → DECLINED | REPLY_AUTHORIZED | CLOSED
REPLY_AUTHORIZED → MANUAL_REPLY_SENT → CLOSED
every active state → WITHDRAWN | STOP
```

These are an explanatory handling vocabulary, not a public status API, SLA, or
automated workflow. There is no automatic retry, escalation, retaliation,
publication, forwarding to an unrelated party, or model-training path.

## What to send

Send the minimum context needed to understand the request. A useful message
can include:

- the exact KINGDOM route, file, statement, or accessibility barrier;
- the kind of response sought;
- the sender's preferred language (`en`, `zh-Hant`, or `zh-Hans`);
- a reply address, only if a reply is wanted.

Do not send credentials, private keys, recovery phrases, bearer tokens,
identity documents, financial records, health or biometric information,
third-party private data, malware, threats, illegal instructions, or anything
that must meet a statutory or court deadline. Attachments are discouraged and
may be filtered, quarantined, or left unopened. No encryption route is offered
in v0.1, so the inbox is not a safe channel for secrets.

This is not an emergency, medical, legal, safeguarding, crisis, or time-critical
service. Use appropriate local services where delay could harm someone or lose
a legal right.

## Privacy and handling notice

The data controller is **Cambridge TCG Limited** (company number `15680297`),
registered at 60 Tottenham Court Road, Suite 4583a, Fitzrovia, London, United
Kingdom, W1T 2EW, and reachable through `contact@thekingdom.dev`. KINGDOM OS,
the aliases, and the human maintainer operate inside that controller boundary.
None has diplomatic standing or authority beyond this correspondence. The
linked
[public operator profile](https://www.cambridgetcg.com/manifest) and
[operator-level privacy notice](https://www.cambridgetcg.com/privacy) provide
the broader Cambridge TCG context.

Email may expose the following to the sender's provider, transit providers,
Cloudflare, the destination mailbox provider, and the operator:

- sender and recipient addresses;
- message headers and transport metadata;
- subject and body;
- any attachment the sender chooses to include;
- later correspondence and handling history.

The purposes are to understand and, when chosen, answer the sender's request;
correct KINGDOM materials; handle accessibility, privacy, safety, security,
abuse, and mail-transport reports; and preserve proportionate evidence where
reasonably needed to protect people or systems or meet an applicable
obligation.

The channel does not add marketing, profiling, automated decisions, analytics,
public message archiving, message-content publication, model training, or
unrelated forwarding. Minimal redacted event metadata may appear in
`CONTACT-LEDGER.md` under the boundary below. A jurisdiction-specific lawful
basis and international-transfer safeguard are not certified by this artifact.
Applicable law may supply additional duties and rights.

Providers may filter or quarantine suspected spam or malware, but the Contact
Door does not guarantee that filtering. Where required or reasonably necessary
to protect people or systems, a bounded disclosure may be made only to an
affected service, incident responder, professional adviser, insurer, court,
regulator, law-enforcement or safeguarding body. That exception does not
authorize general sharing, marketing, publication, or unrelated forwarding.

The stated UK bases are legitimate interests in receiving and answering
voluntary correspondence, correcting published material, and protecting
services—balanced by minimisation, short review periods, and the sender's right
to object—or a specific legal obligation when one actually requires processing
or disclosure.

Default minimisation rules:

- unanswered or declined ordinary inquiries: review for deletion within 30
  days;
- handled ordinary correspondence: review for deletion or minimisation within
  90 days after closure;
- proportionate security or abuse evidence: review within 180 days unless a
  specific applicable obligation or active incident requires longer;
- Cloudflare Email Routing analytics: provider-declared 31-day event retention;
- provider trash and backups: provider schedules apply and are not represented
  as immediately or globally erasable.

Indefinite retention is not authorized. A specific legal hold may pause
ordinary deletion but does not authorize unrelated reuse. A sender may use
`contact@thekingdom.dev` to request access, correction, deletion, restriction,
objection, or to raise a data-protection complaint. Ordinary correspondence has
no response promise. The controller acknowledges a data-protection complaint
within 30 days and normally answers an applicable rights request within one
month, subject to lawful extensions. The sender does not have to contact
Cambridge first; the
[ICO complaint route](https://ico.org.uk/make-a-complaint/data-protection-complaints/)
is directly available. Applicable statutory rights and complaint routes are not
displaced here.

The human operator reviews the door, mailbox retention practice, rules, DNS,
provider terms, and this notice at least every 180 days; the first review is due
by 2027-02-27. This is a manual maintenance commitment, not an automated deletion
claim or service-level promise.

The site itself adds no analytics or cookie for this door. Ordinary Cloudflare
hosting and network infrastructure may still process request metadata when the
page or assets are fetched.

## Public-ledger boundary

[`CONTACT-LEDGER.md`](../CONTACT-LEDGER.md) remains the owner of outreach
continuity. Before activation, it receives one non-identifying row stating that
the inbound door was opened. It must not receive a sender address, person name,
message subject, body, attachment, message ID, or raw security report.

Later inbound continuity may be represented only by minimal, redacted event
metadata when operationally necessary. The message remains in the private
email handling system. A public ledger row is not the message, identity proof,
relationship, consent, representation, publication permission, or authority.

## Security policy

The canonical vulnerability-report address is `security@thekingdom.dev`, also
published in `/.well-known/security.txt` under RFC 9116.

Please report the affected route or component, the observed behavior, impact,
and the smallest safe reproduction. Minimise personal data and secrets. Do not
access data that is not yours, degrade availability, persist access, exfiltrate
content, socially engineer anyone, or expand testing beyond what is necessary
to describe the issue.

Publishing a security contact does **not** authorize testing, create a safe
harbor, waive law or rights, promise confidentiality, promise a bounty, or set
a response or remediation deadline. No OpenPGP key is offered in v0.1. Do not
email exploit code, credentials, private data, or other secrets. Ask first if a
sensitive transfer method is needed.

`security.txt` expires within one year so stale contact data cannot silently
claim currentness. Expiry means re-check the live policy; it does not close an
active report or erase retained evidence.

## Assets and accessible alternatives

The public family includes:

- an HTML contact page requiring no JavaScript;
- a mutable machine-readable current record;
- this immutable guide, a closed schema, and an as-of canonical record;
- an RFC 9116 `security.txt` file;
- an organization-only vCard with no person's name, phone number, or address;
- an inert same-origin SVG explaining the delivery and authority boundaries.

The dated canonical record is an immutable as-of receipt. The HTML page,
`/contact.json`, and `security.txt` are mutable operational views built from
that record plus a small non-public state file. Pausing or retiring delivery can
therefore change the current views without rewriting what was true at
publication. The state file can rotate only lifecycle, provider configuration,
observed rule count, DNS/DMARC verification, and end-to-end probe status; it
cannot alter channels, purposes, privacy, retention, sources, or authority
boundaries.

The page prints every email address as selectable text next to its `mailto:`
link so people using webmail or a browser without a configured mail client are
not trapped. The SVG has a text alternative and duplicates no information that
is unavailable in the HTML. The page has no form, script, animation dependency,
external font, iframe, or third-party image.

## Relationship to Contact Under Uncertainty

[`Contact Under Uncertainty`](contact-under-uncertainty.md) remains a
source-only owner and readiness map. It does not become a runtime, strategy,
diplomacy, or action engine. The Contact Door is narrower: it makes one actual
inbound carrier available while preserving the map's separations.

```text
manual outreach
!= provider contact
!= civic meeting
!= public email delivery
!= identity
!= representation
!= relationship
!= consent
!= diplomacy
!= mediation
!= authority
```

Neither artifact supersedes or validates the other. Reading either one sends
nothing.

## Source horizon

The sources below are links and bounded design inputs. A link is not an import
of authority, a claim of legal applicability, a guarantee of current provider
behavior, or a compliance certification.

- [RFC 9116 — `security.txt`](https://www.rfc-editor.org/rfc/rfc9116.html)
- [RFC 5321 — SMTP and the `postmaster` convention](https://www.rfc-editor.org/rfc/rfc5321.html)
- [RFC 2142 — role mailbox names](https://www.rfc-editor.org/rfc/rfc2142.html)
- [RFC 6350 — vCard 4.0](https://www.rfc-editor.org/rfc/rfc6350.html)
- [RFC 9989 — DMARC](https://www.rfc-editor.org/rfc/rfc9989.html)
- [Cloudflare Email Routing rules and addresses](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/)
- [Cloudflare Email Routing settings API](https://developers.cloudflare.com/api/resources/email_routing/methods/get/)
- [Cloudflare Email Routing analytics](https://developers.cloudflare.com/email-service/observability/metrics-analytics/)
- [Cloudflare Email Routing postmaster guidance](https://developers.cloudflare.com/email-service/reference/postmaster/)
- [W3C WAI G220 — consistent contact help](https://www.w3.org/WAI/WCAG22/Techniques/general/G220.html)
- [ICO — right to be informed](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-be-informed/)
- [ICO — storage limitation](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/)
- [Cambridge TCG public manifest](https://www.cambridgetcg.com/manifest)
- [Cambridge TCG privacy notice](https://www.cambridgetcg.com/privacy)
- [ICO — make a data protection complaint](https://ico.org.uk/make-a-complaint/data-protection-complaints/)

Provider behavior and legal guidance can change. The current route must be
paused or corrected when its live carrier, operator, privacy notice, retention
practice, or safety boundary no longer matches this record.
