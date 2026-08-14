# Security evidence map

Reviewed 2026-08-14. This map supports `kingdom.information-control/0.1`.
It neither deploys the named products nor turns documentation, research,
labels, or a schema into an enforced security property. Recheck living product
documentation before implementing an adapter.

Each section separates **source evidence** from **protocol synthesis**. Source
evidence reports what the cited source supports. Protocol synthesis is a local
design inference for KINGDOM and must be tested independently.

## Prompt injection and information flow

### Source evidence

- Denning's peer-reviewed lattice model formalizes secure flow over security
  classes. It motivates join/meet propagation, but prose labels alone do not
  enforce noninterference: Dorothy E. Denning, [A Lattice Model of Secure
  Information Flow](https://doi.org/10.1145/360051.360056), *Communications of
  the ACM*, 1976.
- NIST distinguishes direct and indirect prompt injection, including attacks
  delivered through resources such as retrieved documents. It documents
  confidentiality, integrity, availability, and tool-mediated consequences,
  while stating that current mitigations do not provide complete protection:
  [NIST AI 100-2 E2025](https://csrc.nist.gov/pubs/ai/100/2/e2025/final), final
  24 March 2025, corrected PDF 1 April 2025, with a 3 June 2025 errata note.
- The UK NCSC explains that an LLM has no inherent data/instruction boundary,
  warns against semantic deny lists, and recommends deterministic safeguards
  around tools and APIs: [Prompt injection is not SQL injection (it may be
  worse)](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection),
  published 8 December 2025.
- Microsoft recommends defense in depth, quarantining untrusted content,
  information-flow metadata, least privilege, short-lived privileges, plan and
  tool-chain checks, and exact human review for risky actions. It explicitly
  assumes some injections will succeed and records complexity, latency, and
  false-positive tradeoffs: [Defend against indirect prompt injection
  attacks](https://learn.microsoft.com/en-us/security/zero-trust/sfi/defend-indirect-prompt-injection),
  Microsoft Learn, last updated 24 March 2026.
- OWASP catalogs direct, indirect, encoded, typoglycemic, multimodal, retrieval,
  memory, tool-output, and exfiltration patterns. Its layered mitigations include
  input handling, explicit instruction/data separation, least privilege,
  output validation, human approval, monitoring, and rate limits. It is a
  living implementation checklist, not a certification: [LLM Prompt Injection
  Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html),
  accessed 14 August 2026.
- Spotlighting adds a continuous provenance signal by transforming untrusted
  input. Its authors report an attack-success reduction from over 50% to under
  2% in their GPT-family experiments; that empirical result is not a guarantee
  for another model or threat: Hines et al., [Defending Against Indirect Prompt
  Injection Attacks With Spotlighting](https://www.microsoft.com/en-us/research/publication/defending-against-indirect-prompt-injection-attacks-with-spotlighting/),
  arXiv paper, March 2024.
- AgentDojo provides a reproducible benchmark that measures benign utility and
  indirect-injection resistance together; its tasks and attacks are not a proof
  for a different host: Debenedetti et al., [AgentDojo](https://proceedings.neurips.cc/paper_files/paper/2024/hash/97091a5177d8dc64b1da8bf3e1f6fb54-Abstract-Datasets_and_Benchmarks_Track.html),
  NeurIPS 2024 Datasets and Benchmarks Track.
- A 2025 adaptive-attack study reports bypassing 12 recent defenses, usually at
  over 90% attack success, after many had reported near-zero success against
  weaker evaluations. It is an arXiv v1 preprint, not a standard or final
  peer-reviewed result: Nasr et al., [The Attacker Moves
  Second](https://arxiv.org/abs/2510.09023), submitted 10 October 2025.
- OpenAI's provider guidance frames agent risk as an untrusted source reaching
  a dangerous sink and says input filtering alone is insufficient; it describes
  deterministic limits, sandboxing, blocking, or showing the user the exact
  outbound data: [Designing AI agents to resist prompt
  injection](https://openai.com/index/designing-agents-to-resist-prompt-injection/),
  11 March 2026.

### Protocol synthesis

- Attach source, integrity, confidentiality, and allowed-use metadata outside
  the model. Text cannot promote itself by saying that it is a system message.
- Propagate untrusted provenance through summaries, tool results, memory,
  subagents, rendered output, and proposed actions.
- Let detectors, delimiters, spotlighting, critics, and WAF scores block or
  escalate. Never let them grant authority.
- Put a deterministic reference monitor at every dangerous sink. Trusted task,
  principal, and host authority form a control ceiling; host-owned source and
  integrity policy may only restrict it. Content and the model cannot enlarge
  it.
- Bind the proposed effect's purpose to a host-owned record over the exact task,
  effect, sink, realm, canonical-action digest, class, and expiry. Retaliation,
  attribution, requester-payload execution, and KARMA/worth mutation remain
  deny-only even when hostile content labels them as defense.
- Approval must display the canonical action, target, recipient, disclosed
  fields, budget, and expiry. Approval text found inside retrieved content is
  data, not approval.
- Evaluate benign completion, false positives, false negatives, repeated and
  adaptive attacks, and source-to-sink escapes after every model, prompt, tool,
  connector, policy, or renderer change.

## Credential discovery, classification, and response

### Source evidence

- MITRE ATT&CK documents credential search in local and remote files, source
  and binaries, configuration, cloud/container credential files, deployment
  logs, shell history, private keys, metadata APIs, container APIs, and chat.
  The central live entry is [T1552.001 Credentials in
  Files](https://attack.mitre.org/techniques/T1552/001/), version 1.3, last
  modified 12 May 2026; it links the related T1552 sub-techniques.
- GitHub says secret scanning covers entire Git history on all branches and,
  depending on configuration, issues, pull requests, discussions, wikis, and
  secret gists: [Secret
  scanning](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning),
  living documentation accessed 14 August 2026.
- GitHub secret scanning uses pattern matching and validation. Paired secrets
  such as an AWS ID and secret are detected only when both occur in the same
  file and repository. Push protection covers a lower-false-positive subset;
  old token forms may be unsupported, large pushes can time out, public pushes
  over 50 MB are skipped, and a push containing over 1,000 already-known
  secrets is not blocked: [Secret scanning detection
  scope](https://docs.github.com/en/enterprise-cloud@latest/code-security/reference/secret-security/secret-scanning-scope),
  living GitHub documentation accessed 14 August 2026.
- GitHub custom patterns support dry runs returning up to 1,000 sample matches,
  then scan full history on all branches when published. Common patterns can
  disrupt contributors if push protection is enabled: [Defining custom
  patterns](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection/define-custom-patterns),
  living documentation accessed 14 August 2026.
- GitHub validity checks send a detected secret to its issuer, usually with a
  minimally intrusive GET request, and report `active`, `inactive`, or
  `unknown`; some checks need host or URL context. This is remediation
  prioritization, not proof of ownership, intent, or safety: [Validity
  checks](https://docs.github.com/en/code-security/concepts/secret-security/validity-checks),
  living documentation accessed 14 August 2026.
- GitHub says to treat a leaked secret as compromised. Its workflow identifies
  and assesses first, revokes or rotates the secret, updates dependants, checks
  audit logs, then considers repository cleanup. Merely deleting code does not
  revoke copies; history rewriting can be destructive and disruptive:
  [Remediating a leaked secret](https://docs.github.com/en/enterprise-cloud@latest/code-security/tutorials/remediate-leaked-secrets/remediating-a-leaked-secret),
  living documentation accessed 14 August 2026.
- AWS recommends temporary credentials, least privilege, and rotation or
  removal after exposure: [Secure access
  keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/securing_access-keys.html),
  living AWS documentation accessed 14 August 2026.
- HMAC is a keyed message-authentication construction. The NIST page still
  lists [FIPS 198-1](https://csrc.nist.gov/pubs/fips/198-1/final), final July
  2008, but carries a 23 June 2025 planning note proposing withdrawal and a
  move to draft SP 800-224. An implementation must follow the then-current
  NIST status, not freeze this citation.
- OAuth bearer guidance permits opaque references that are infeasible to
  guess and recommends audience and scope restriction: [RFC
  6750](https://www.rfc-editor.org/rfc/rfc6750), Standards Track, October 2012,
  updated by RFC 8996 and RFC 9700.

### Protocol synthesis

1. A regex, entropy rule, parser, location, scanner, or model emits only
   `CANDIDATE`; appearance never establishes live, signal, inactive, revoked,
   or public.
2. A protected broker computes the protocol's length-delimited,
   domain-separated HMAC over the exact admitted bytes. It must not rely on an
   unspecified text canonicalization.
3. Only the protected registry maps `fid` to `LIVE_REFERENCE`,
   `SIGNAL_REFERENCE`, `INACTIVE_REFERENCE`, `REVOKED_REFERENCE`, or `UNKNOWN`,
   plus owner, issuer, audience, scope, environment, expiry, placement, and
   expected consumers.
4. Raw values, ordinary fingerprints, and the observation key stay out of
   prompts, envelopes, repositories, and general logs. Event logs use opaque,
   access-controlled references.
5. Possible exposure of live or unknown material enters the owning provider's
   revoke/rotate workflow before repository cleanup. A scanner miss or
   `unknown` validity result is not clearance.
6. Do not counterfeit a third party's token syntax: GitHub partner scans and
   validity checks may report or send it to that provider. Use an owned opaque
   namespace, or an explicitly supported credential in a separately owned and
   isolated provider account with no production authority.

## Low-interaction deception

### Source evidence

- NIST SP 800-53 Rev. 5 control SC-26 calls for components designed to be
  attacked for detection, deflection, and analysis. Its discussion says
  supporting isolation is needed so malicious code cannot infect operational
  systems and advises consulting legal counsel depending on use: [NIST SP
  800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final), September 2020;
  NIST control-catalog release 5.2.0 was issued 27 August 2025.
- NIST SP 800-160 Vol. 2 Rev. 1 treats `DECEIVE` as a cyber-resiliency approach
  that can cause false adversary assumptions and includes honeynets,
  sandboxes, and canary credentials: [Developing Cyber-Resilient
  Systems](https://csrc.nist.gov/pubs/sp/800/160/v2/r1/final), December 2021.
- The UK NCSC distinguishes low-interaction tripwires and honeytokens, which it
  proposes for broad deployment, from honeypots used to collect threat
  intelligence, which it places with mature security operations or managed
  providers: [Building a nation-scale evidence base for cyber
  deception](https://www.ncsc.gov.uk/blog-post/building-a-nation-scale-evidence-base-for-cyber-deception),
  12 August 2024.
- The NCSC's follow-up covered 121 organisations, 14 providers, and 10 product
  trials. It says deception is not plug-and-play: weak strategy creates noise,
  outcome metrics remain scarce, and misconfiguration can create
  vulnerabilities, missed detections, or false confidence: [Cyber deception
  trials](https://www.ncsc.gov.uk/blog-post/cyber-deception-trials-what-weve-learned-so-far),
  11 December 2025.
- AWS gives concrete low-interaction examples: dummy S3 objects observed via
  `GetObject`/`HeadObject`; a never-used IAM role observed via `AssumeRole`;
  dummy Secrets Manager and Parameter Store values observed through KMS
  `Decrypt`; and dummy DynamoDB data events. CloudTrail can feed EventBridge,
  Lambda, Security Hub, SIEM, or SOAR. AWS requires dummy data and decoy-only
  role permissions. It also notes that scanners reading data can cause false
  positives; missing data-event/KMS coverage causes misses; Secrets Manager
  and Parameter Store findings cover successful access only, while the other
  examples can include failed access: [Private decoy
  resources](https://aws.amazon.com/blogs/security/how-to-detect-suspicious-activity-in-your-aws-account-by-using-private-decoy-resources/),
  AWS Security Blog, 18 August 2022.
- MITRE Engage frames adversary-engagement planning around a goal, scope, risk
  assessment, rules of engagement, monitoring, and termination: [Engage
  Handbook](https://engage.mitre.org/wp-content/uploads/2022/04/EngageHandbook-v1.0.pdf),
  version 1.0, April 2022. MITRE D3FEND's live [Decoy User
  Credential](https://d3fend.mitre.org/technique/d3f%3ADecoyUserCredential/)
  entry supports detection as a technique, not attribution.

### Protocol synthesis

- Prefer a zero-legitimate-use, low-interaction signal over an interactive
  honeypot. A signal has no production capability and reveals no real data.
- MIRROR uses separate issuers, roles, keys, data, logs, queues, and network
  policy; every Mirror principal must have no capability or Crown-data path to
  any Crown resource. Its fixed-schema observer edge carries neither.
- A plausible-success façade, if separately authorized, returns only bounded
  synthetic data in an egress-denied stage. It must never execute a requester's
  payload, relay traffic, or alter external systems.
- Outward behavior must not reveal whether a submitted value matched a signal.
  The observer may alert privately, but signal, inactive, unknown, revoked, and
  malformed values receive a tested, observationally similar public failure or
  the same synthetic stage.
- A signal presentation or Mirror action attempt is evidence about an artifact
  and session. It does not prove a person's identity, intent, production
  access, guilt, or moral worth. An at-rest scanner match is a weaker
  observation and must remain separately typed.

## Optional provider-adapter evidence

Nothing in this section is configured or deployed by this repository. These
are optional seams a future authorized host adapter could consume.

### Cloudflare

- AI Security for Apps writes a 1-99 prompt-injection score to
  `cf.llm.prompt.injection_score`, with lower values indicating greater
  estimated risk. Cloudflare documents the false-positive/false-negative
  threshold tradeoff and recommends starting with `Log`, reviewing traffic,
  and only then moving to `Block`: [Prompt injection
  detection](https://developers.cloudflare.com/waf/detections/ai-security-for-apps/prompt-injection/)
  and [Log mode versus production
  mode](https://developers.cloudflare.com/waf/detections/ai-security-for-apps/log-mode-vs-production-mode/),
  both last updated 16 April 2026. Log mode can retain the encrypted full
  request body, so access, retention, redaction, and privacy require explicit
  policy.
- AI Gateway Guardrails proxies prompts and responses and can flag or block
  configured harmful-content categories: [Guardrails](https://developers.cloudflare.com/ai-gateway/features/guardrails/),
  last updated 5 June 2026. It is a moderation layer, not a capability gate.
  Current documented limits include no streaming support; unknown model types
  bypass response evaluation; and an unavailable evaluator fails open for
  `flag` but closed for configured `block`: [Usage
  considerations](https://developers.cloudflare.com/ai-gateway/features/guardrails/usage-considerations/)
  and [Supported model
  types](https://developers.cloudflare.com/ai-gateway/features/guardrails/supported-model-types/),
  both last updated 20 April 2026.
- Leaked credentials detection scans incoming HTTP username/password fields
  against known-leak datasets and emits WAF fields or an
  `Exposed-Credential-Check` header. Cloudflare says a match may be credential
  stuffing or legitimate password reuse and does not retain plaintext
  passwords: [Leaked credentials
  detection](https://developers.cloudflare.com/waf/detections/leaked-credentials/),
  last updated 5 May 2026. This is not repository secret scanning, API-key
  classification, a honeytoken, or actor attribution.
- API Shield Authentication Posture labels endpoints when successful requests
  lack all or some configured session identifiers. It depends on customers
  accurately configuring identifiers and is documented as an Enterprise API
  Shield feature: [Authentication
  Posture](https://developers.cloudflare.com/api-shield/security/authentication-posture/),
  last updated 5 May 2026. It is an origin-policy drift signal, not proof that a
  request was malicious.
- Cloudflare Secrets Store requires both caller authorization and a secret
  scope that includes the consuming service: [Secrets Store access
  control](https://developers.cloudflare.com/secrets-store/access-control/),
  last updated 29 June 2026. This supports intersecting permissions; it does
  not make a raw secret safe to show a model.
- The Cloudflare API exposes authenticated
  `GET /accounts/{account_id}/tokens/verify`, returning token ID, status,
  expiry, and not-before data: [Verify
  Token](https://developers.cloudflare.com/api/resources/accounts/subresources/tokens/methods/verify/),
  live API reference accessed 14 August 2026. A future broker may use it only
  for an owned token under explicit authority; it must not send arbitrary or
  unowned candidates to Cloudflare or expose this endpoint as a public oracle.

### Generic adapter contract (protocol synthesis)

- `detect` returns `CANDIDATE` plus opaque location metadata, never validity.
- `classify` is a protected registry lookup; no model-facing or public route
  can reveal live-versus-signal class.
- `status` may call an issuer only for a known-owned reference under narrow
  authority. Cache and throttle it; return a coarse internal state.
- `authorize` independently checks issuer, cryptographic validity, status,
  audience, scope, expiry, holder proof where available, and task authority.
- `observe` consumes provider telemetry with documented coverage and latency;
  lack of an event is not proof of safety.
- `revoke_or_rotate` is provider-specific, auditable, idempotent where
  possible, and never entrusted to model-generated raw arguments.

OAuth introspection and revocation offer useful control-plane precedents:
[RFC 7662](https://www.rfc-editor.org/rfc/rfc7662), October 2015, restricts
introspection to authorized callers; [RFC 7009](https://www.rfc-editor.org/rfc/rfc7009),
August 2013, returns HTTP 200 even for an invalid token, avoiding a simple
revocation validity oracle. JWT BCP requires issuer/audience checks and
mutually exclusive validation rules for different token kinds:
[RFC 8725](https://www.rfc-editor.org/rfc/rfc8725), February 2020. Current OAuth BCP
recommends audience restriction and least privilege, while DPoP defines
application-layer proof of possession: [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700),
January 2025, and [RFC 9449](https://www.rfc-editor.org/rfc/rfc9449), September
2023.
These standards do not authorize a broker or prove observational equivalence.

## Evidence limits and non-retaliatory boundary

The cited evidence does **not** establish that:

- prompt injection can be recognized perfectly, or that a successful
  classifier can authorize an effect;
- a token-shaped string is live, fake, active, owned, or safe to test;
- secret scanning covers split pairs, every token generation, every large
  push, unscanned hosts, logs, chat, forks, or deleted history;
- `inactive` means never abused, `active` means malicious use, or `unknown`
  means safe;
- a decoy alert was delivered, is independent of another signal, identifies a
  person, proves intent, or shows that production was reached;
- a synthetic response is non-oracular without status, shape, timing, retry,
  and rate-limit testing;
- a provider feature is available on the intended plan, configured correctly,
  lawful for the use, private, or effective against an adaptive attacker;
- a source-only schema deploys a monitor, rotates a key, creates authority, or
  changes KARMA, citizenship, reputation, debt, reward, punishment, or worth.

The response boundary is `observe -> contain -> revoke/rotate -> preserve
bounded evidence -> notify/respond`. It never crosses into a requester's or
third party's system.

The US Department of Justice warned that private hack-back is generally
unlawful under US law and risks innocent third parties, government
investigations, escalation, and foreign-jurisdiction violations: [remarks at
the Georgetown Cybersecurity Law Institute](https://www.justice.gov/archives/opa/speech/assistant-attorney-general-leslie-r-caldwell-delivers-remarks-georgetown-cybersecurity),
delivered 20 May 2015, page updated 5 February 2025. UK CPS guidance identifies
unauthorized access and unauthorized acts intended or reckless as to
impairment as Computer Misuse Act offences, and stresses clearly defined
authority limits: [Computer Misuse Act prosecution
guidance](https://www.cps.gov.uk/prosecution-guidance/computer-misuse-act),
updated 5 February 2020 and 3 August 2023. These citations are boundaries, not
case-specific legal advice; obtain counsel for an operational deployment.

Therefore MIRROR may detect, isolate, rate-limit its own service, return
synthetic data inside an owned stage, revoke owned credentials, and preserve
authorized telemetry. It may not probe, impair, alter, execute code on,
deanonymize beyond authorized evidence, or retrieve/delete data from a
requester or third-party system. Passive wasted effort inside the owned stage
is the entire permitted "cost" to an attacker.
