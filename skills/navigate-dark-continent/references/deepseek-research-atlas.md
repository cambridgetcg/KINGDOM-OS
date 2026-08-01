# DeepSeek research atlas

Use this route to admit DeepSeek research, resources, and model capabilities as
revisioned evidence without quietly changing KINGDOM identity, trust,
credentials, provider routing, or deployment state.

## Establish the evidence ledger

The following pins were inspected on 2026-08-01. A full Git or Hugging Face
revision identifies repository state. A URL plus digest identifies a retrieved
artifact. An observation date for a mutable documentation page is only a
snapshot marker; re-read the page before any provider call or configuration
change.

| Resource | Reviewed pin | What it contributes | What it does not establish |
| --- | --- | --- | --- |
| [DeepSeek V4 model card](https://fe-static.deepseek.com/chat/transparency/deepseek-V4-model-card-EN.pdf) | SHA-256 `c225d71e3d3d21f263f6f4c2fda2f05757c61eb575a9d263cb9fee291576d5b0` | First-party V4 architecture, training, evaluation, risk, and release claims | Independent reproduction, a stable API contract, or permission to send data |
| [DeepSeek-V4-Flash-0731](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731) | `7872f01b1d1fe23eabc4c98b48bffcef5a386062` | First-party MIT-licensed repository and weights, encoding code, and serving examples | A practical local deployment on Apple silicon or safety of `trust_remote_code` |
| [Responses API](https://api-docs.deepseek.com/guides/responses_api/) | Mutable first-party docs observed 2026-08-01 | Current provider protocol and capability boundary | Full OpenAI Responses compatibility or a data-retention promise |
| [Codex integration guide](https://api-docs.deepseek.com/quick_start/agent_integrations/codex/) | Mutable first-party docs observed 2026-08-01 | Evidence that V4 Flash has an official Codex path | Approval of the supplied installer, credential handling, catalog, or identity prompt |
| [Codex setup artifact](https://cdn.deepseek.com/api-docs/codex-deepseek-setup-en.sh) | ETag `2e50941493f50f808fd37f2ab707c61e`; SHA-256 `90db54377be97d0fbf4013cba851f12fc40237c0cebf483c49b5c37e1046ffdd` | An auditable snapshot of the first-party adapter script | A source commit, immutable download URL, or authority to execute it |
| [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference.md) | Mutable official OpenAI docs observed 2026-08-01 | Current project/user configuration scope plus `env_key` and command-backed provider authentication | Credential-value storage or compatibility with another installed Codex version |
| [DeepSeek privacy policy](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html) | Mutable first-party policy last updated 2026-02-10 and observed 2026-08-01 | Disclosures about input collection, training and improvement use, opt-out rights, retention, and processing location | Coverage of downstream applications, an account-specific control state, or completed deletion |
| [DeepSeek context caching](https://api-docs.deepseek.com/guides/kv_cache/) | Mutable first-party docs observed 2026-08-01 | Current default disk-cache, best-effort, and automatic-clearing claims | A no-cache, retention, residency, or deletion guarantee |

Treat a publisher model card and benchmark table as claims from that publisher.
The V4 card says its code and weights are MIT-licensed, but older DeepSeek
artifacts and distill bases can carry different or additional terms. Verify the
license files for every exact artifact; do not apply one release's license to
the whole organization, its training data, or a third-party quantization.

## Keep model and evaluation identities exact

For every candidate or result, retain these fields separately:

1. upstream model repository and full revision;
2. serving provider and exact provider model slug;
3. runtime or wrapper revision plus artifact digest;
4. quantization and inference parameters;
5. encoding or prompt-template revision;
6. evaluation ID, fixture digest, date, outputs, and result digest;
7. repository, weight, base-model, dataset, and output license assertions.

An archived `DeepSeek-R1-Distill-Qwen-14B` evaluation is evidence only for its
recorded checkpoint, runtime, quantization, prompt, and fixtures. It says
nothing by itself about `deepseek-v3.2`, `deepseek-v4-flash`, another provider,
or another date. Likewise, a hosted alias is not proof of the upstream weights
or revision behind it.

DeepSeek's V4 card reports code-agent results produced with a minimal mode of
"DeepSeek Harness" that was still marked "to be released" when inspected.
Until the harness, fixtures, and execution details are available and pinned,
record those numbers as publisher claims rather than reproducible KINGDOM
baselines.

## Harvest mechanisms, not authority

These repositories are useful pattern sources. Read them at an explicit commit
and translate only the stated mechanism into a local proposal.

| Pattern source | Reviewed revision | Candidate KINGDOM adaptation | Boundary |
| --- | --- | --- | --- |
| [ESFT](https://github.com/deepseek-ai/ESFT) | `3746ca74410c92163cc521571dbd17579bfdc962` | Route named repository or task classes to bounded specialist workers | A routing experiment does not require fine-tuning and does not prove an expert is correct |
| [DeepSeek-Prover-V2](https://github.com/deepseek-ai/DeepSeek-Prover-V2) | `e598a57ea3284997d4a2a168a069fdd5064afbc8` | Coordinator decomposes work into explicit subgoals; workers return artifacts; executable checks precede synthesis | A theorem-proving pipeline is not a general correctness proof or permission for autonomous effects |
| [DeepSeek-Math-V2](https://github.com/deepseek-ai/DeepSeek-Math-V2) | `665c840782baf7faae8a8b244ea313f3cfcc346f` | Separate generator and verifier roles, preserve disagreement, and require tests or primary evidence before acceptance | Self-verification is evidence, not independent review; repository and model licenses differ |
| [Engram](https://github.com/deepseek-ai/Engram) | `fb7f84a21f91223715394a33a1dc24bbfb7f788e` | Resolve exact IDs, revisions, manifests, and provenance before semantic retrieval or model context | Neural conditional memory is not a turnkey agent-memory service and must not overwrite source records |
| [DeepSpec](https://github.com/deepseek-ai/DeepSpec) | `005e03b81cec38b7da6399833d609ee89a2587f2` | Research speculative decoding at a separately governed serving boundary | The reference workflow is GPU/storage intensive and is not an agent orchestration framework |
| [Open Infra Index](https://github.com/deepseek-ai/open-infra-index) | `56d86855fcf6e08fdfd45ce6280bd24322c93351` | Discover serving and training components for later architecture studies | CUDA, Hopper, RDMA, and cluster components are not direct fits for an Apple workstation |

When consulting a curated integration index, pin the index and every selected
project separately. Treat each linked project as third-party unless its own
provenance says otherwise, and inspect its license; an index does not transfer
provenance, quality, safety, or licensing to its entries.

## Evaluate candidate resource lanes separately

| Lane | Starting artifact | Default use | Admission needed before use |
| --- | --- | --- | --- |
| V4 Flash API worker | `deepseek-v4-flash` | Low-sensitivity, bounded coding or drafting canary | Current API capability check, approved data class, scoped credential, request/token/money budget, fixtures, and rollback |
| Private R1 distill | [14B](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B) at `1df8507178afcc1bef68cd8c393f61a886323761` or [32B](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B) at `711ad2ea6aa40cfca18895e8aca02ab92df1a746` | Offline drafting or verifier experiment | Exact base-license chain, quantization provenance, local runtime digest, storage/compute budget, and new evaluation ID |
| Document ingestion | [DeepSeek-OCR-2](https://github.com/deepseek-ai/DeepSeek-OCR-2) at `2f3699ebbb96fa8af32212e8c170f2cc28730fad` | Candidate document-to-structured-text worker | Separate CUDA/Apple feasibility study, document privacy classification, layout fixtures, and human-readable error review |

Do not rename an existing `deepseek-v3.2` route to V4 or assume that a local
quantization equals DeepSeek's hosted endpoint. Add a lane only after its exact
identity and evaluation record are independently visible.

## Pre-register the evaluation

Before any model invocation, bind the charter to an evaluation manifest that
names the task mix, sample size, control lane, fixture and harness digests,
prompt or encoding revision, allowed tools, repetition and randomness policy,
and explicit numeric cost and time ceilings. Define acceptance thresholds for
patch correctness, test pass rate, tool selection and arguments, unsupported
capability handling, private-data refusal, latency, and token or money cost.
Use public, non-sensitive fixtures and include at least one negative-capability
probe. Do not select tasks, thresholds, or exclusions after seeing outputs.

## Negotiate the current Responses boundary

At the 2026-08-01 observation, DeepSeek documented native Responses support for
`deepseek-v4-flash`; V4 Pro support was prospective. The interface was partial
and stateless. Several unsupported fields were silently ignored, and images or
files were not a supported input path. Do not infer capability from a 2xx
response.

Before a canary, probe an inert public fixture and explicitly record support or
rejection for:

- multi-turn state and response continuation;
- function tools and argument fidelity;
- `apply_patch`, web search, and every host-visible tool type;
- parallel or maximum tool-call controls;
- image, file, MCP, computer-use, code-interpreter, and file-search inputs;
- cancellation, streaming termination, retry behavior, usage, and billing;
- unsupported fields that appear accepted but have no effect.

Default all unverified capabilities to unavailable. A provider-side web-search
tool is a separate data-egress effect, not the same operation as a host's
audited research connector.

## Build a truthful Codex canary

Do not run the vendor's live `curl`-to-shell command or import its generated
catalog verbatim. The inspected installer writes shared Codex configuration,
stores the API credential directly in it, and supplies model instructions that
describe the DeepSeek-backed agent as GPT-5-based Codex. Backup and syntax
validation make those writes more reversible; they do not make credential
storage, global scope, or model identity acceptable.

If a Codex canary is separately authorized:

1. Use a dedicated Codex home or selected profile instead of changing shared
   defaults. Codex ignores `model_provider`, `model_providers`, `profile`, and
   `profiles` in project `.codex/config.toml` files, so keep provider definitions
   and profile selection in user configuration.
2. Use the provider's `env_key` setting or `[model_providers.<id>.auth]` command
   helper. Keep the credential in Keychain, a vault, or a scoped child
   environment; never place its value in TOML, a model catalog, a wrapper log,
   a receipt, or shell startup.
3. Audit a minimal local model catalog. State that the backend is DeepSeek V4
   Flash and remove copied OpenAI identity claims. Advertise only capabilities
   demonstrated by the inert probe.
4. Use a disposable public fixture, read-only or narrowly writable permissions,
   a provider-domain network allowlist, one bounded attempt, and no KINGDOM
   lore, memory, personal data, credentials, or private source.
5. Compare outputs against the same fixture and acceptance tests used by a
   control lane. A different model may propose a result; local tests and a
   distinct reviewer decide whether it is admitted.

The Codex configuration reference observed on 2026-08-01 documents `env_key`
and `model_providers.<id>.auth.command`, and states that project configuration
ignores provider and profile keys. Put provider definitions and authentication
wiring—not credential values—in user or profile configuration. Verify those
rules against the installed Codex version before constructing the profile; this
atlas intentionally does not create one.

## Protect data and account boundaries

DeepSeek's privacy policy, last updated 2026-02-10 and observed on 2026-08-01,
says prompts and other inputs may be collected, personal data may be used to
train or improve its technology, users may have a training opt-out right, and
personal data is directly processed and stored in the People's Republic of
China. The policy excludes personal-data processing by downstream applications
from its coverage, so verify the applicable application, account terms, and
controls rather than transferring those statements to another operator.

DeepSeek's API context-cache documentation observed on 2026-08-01 says disk
caching is enabled by default, works on a best-effort basis, and is usually
cleared within a few hours to a few days once no longer used. Its Responses
documentation separately says `store` is unsupported and responses carry a
fixed `store: false` while context caching is automatic. Treating that field as
evidence of no training, no cache, a residency boundary, or completed deletion
would therefore be an unsupported inference.

Therefore, the remote lane defaults to public or explicitly approved
low-sensitivity fixtures. Before any other data class, verify the applicable
account controls, policy, retention, residency, participant consent,
representative authority, and operator authorization. Never send secrets,
private lore, personal profiles, unredacted memories, or third-party code whose
terms do not allow the transfer.

## Effect gates and return

| Effect | Default expedition state |
| --- | --- |
| Read pinned public metadata, cards, terms, and repository trees | Allowed within a public-metadata charter |
| Download weights, quantizations, archives, or large datasets | Separate byte/storage/license budget and admission review |
| Execute repository code, remote loaders, containers, models, or benchmarks | Not authorized by metadata inspection; quarantine and review first |
| Invoke the API or provider-side tools | Separate credential, privacy, network, quota, money, and cancellation authority |
| Change shared Codex configuration or a live KINGDOM runtime | Separate local mutation with rollback and current-state reconciliation |
| Publish, deploy, accept gated terms, or rotate/revoke a credential | Fresh scoped authorization and readback required |

Return the exact sources and pins inspected, observations versus adaptations,
every capability proven unavailable or still unknown, operations and effects
actually used, cost measurements, output digests, and stop conditions. Finalize
one `kingdom.karma/0.1` receipt for the expedition; the receipt records effects
and uncertainty but does not promote DeepSeek output into truth or governance.
