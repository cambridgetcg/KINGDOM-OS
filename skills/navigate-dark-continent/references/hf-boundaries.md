# Hugging Face and MCP expedition boundaries

This reference records a reviewed July 31, 2026 starting set. Revisions are
observations, not permanent “latest” aliases. Rediscover metadata before a new
experiment and record any change. Provider cards and license fields are
publisher assertions, not safety or ownership verdicts.

## Contents

- [Reuse the existing lab](#reuse-the-existing-lab)
- [Reviewed public resources](#reviewed-public-resources)
- [MCP effects](#mcp-effects)
- [Image Space warning](#image-space-warning)
- [Privacy, cost, and provenance](#privacy-cost-and-provenance)

## Reuse the existing lab

Resolve the optional project dynamically:

```bash
./kingdom repos --path hf-kingdom-lab
```

`hf-kingdom-lab` owns HF observations, AgentTool content-addressed artifacts,
semantic vectors, XP, reward tickets, and provider-effect receipts. Do not
hard-code its device path, copy `.hf-kingdom-data`, read its SQLite directly,
or import unstable `src/*` internals.

The current CLI seams are experimental and fail-closed:

- `ingest`: only explicitly named public model, dataset, or Space IDs from an
  ability allowlist; performs remote reads and local evidence writes.
- `query`: local AgentTool full-text search, limit at most 50.
- `semantic-query`: current local English lane, limit at most 20.
- `reward preview/claim`: creates a local prompt voucher only; it never invokes
  a provider.

Opening its DataNode may initialize collections or repair full-text indexes, so
even a query is not guaranteed byte-for-byte read-only. Keep the dependency
optional until the lab exposes a versioned JSON capability handshake.

Portable skill manifests may name public IDs and pinned revisions. Store local
record IDs only in runtime receipts, using a reference such as:

```json
{
  "protocol": "nen-hf-evidence-ref/v1",
  "provider_project": "hf-kingdom-lab",
  "collection_id": "hf-resources-v1",
  "record_id": "rec_runtime_only",
  "content_sha256": "sha256:replace",
  "source_repo_id": "owner/name",
  "source_revision": "40-character-commit-sha"
}
```

## Reviewed public resources

| Purpose | Resource and pinned revision | Boundary |
| --- | --- | --- |
| Existing local evaluator | [`mlx-community/gpt-oss-20b-MXFP4-Q8`](https://huggingface.co/mlx-community/gpt-oss-20b-MXFP4-Q8/tree/773a7da77e569019bb0fd17a554b263738d669a3) `773a7da77e569019bb0fd17a554b263738d669a3` | Apache-2.0 assertion; already ran in the lab, but answer quality and output capture were not verified |
| Multilingual critic candidate | [`mlx-community/Qwen3-30B-A3B-Instruct-2507-4bit`](https://huggingface.co/mlx-community/Qwen3-30B-A3B-Instruct-2507-4bit/tree/e9675aa3ca5f900ccef55267914466d55ab325fa) `e9675aa3ca5f900ccef55267914466d55ab325fa` | Apache-2.0 assertion; not locally verified; start with a 16–32K context cap |
| Current semantic lane | [`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2/tree/751bff37182d3f1213fa05d7196b954e230abad9) `751bff37182d3f1213fa05d7196b954e230abad9` | Local English navigation only |
| Chinese semantic candidate | [`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/tree/e8f8c211226b894fcb81acc59f3b34ba3efd5f42) `e8f8c211226b894fcb81acc59f3b34ba3efd5f42` | Includes Chinese language tags, not a Cantonese guarantee; admit only after a Cantonese retrieval fixture proves value |
| Cantonese voice candidate | [`alvanlii/whisper-small-cantonese`](https://huggingface.co/alvanlii/whisper-small-cantonese/tree/b03a4e5d482f06858ce10ebbabebabec9f447a0d) `b03a4e5d482f06858ce10ebbabebabec9f447a0d` | Apache-2.0 assertion; ASR only, not semantic retrieval or cultural authority; test locally on a small consented Cantonese fixture before any provider invocation |
| Cantonese life-scenario fixture candidate | [`leeduckgo/cantonese-life-scenarios-corpus`](https://huggingface.co/datasets/leeduckgo/cantonese-life-scenarios-corpus/tree/e9bfb8f07250faab06a6ad8ed46f9b02567f886c) `e9bfb8f07250faab06a6ad8ed46f9b02567f886c` | CC-BY-4.0 assertion; metadata exposes a 1.67 GB archive while the viewer reports about 2.2K rows and could not preview them; keep metadata-only until source, voice-consent, attribution, and schema are reviewed |
| Tool-choice evaluation | [`gorilla-llm/Berkeley-Function-Calling-Leaderboard`](https://huggingface.co/datasets/gorilla-llm/Berkeley-Function-Calling-Leaderboard/tree/61fc0608cfd831fcfbbaa676ebdfef0ed963eeda) `61fc0608cfd831fcfbbaa676ebdfef0ed963eeda` | Apache-2.0 assertion; use fixed JSONL for offline selection/argument/abstention scoring; never execute supplied REST, SQL, or functions |
| Adversarial trajectories | [`AI-Secure/DTap-Bench-Agent-Trajectories`](https://huggingface.co/datasets/AI-Secure/DTap-Bench-Agent-Trajectories/tree/836caf2fdd78b888ddd14fb62dc038e932e17898) `836caf2fdd78b888ddd14fb62dc038e932e17898` | Metadata census only; quarantine `setup.sh`, `judge.py`, prompts, and MCP bindings in any future content test |
| Cross-server data-propagation traces | [`mcphunt-benchmark/mcphunt-agent-traces`](https://huggingface.co/datasets/mcphunt-benchmark/mcphunt-agent-traces/tree/062bb343fe890ae3018222c7ebe44dbd49ea76d0) `062bb343fe890ae3018222c7ebe44dbd49ea76d0` | CC-BY-4.0 assertion; useful for offline leakage/canary analysis, but quarantine prompts, traces, judge evidence, and any executable bindings; never replay tools |
| MCP risk signal | [`MCPShield/mcp-security-scan-2026`](https://huggingface.co/datasets/MCPShield/mcp-security-scan-2026/tree/69f4f624cef494841d8855efdcf9131473d63bd0) `69f4f624cef494841d8855efdcf9131473d63bd0` | CC-BY-4.0 assertion; aggregate labels are investigation signals, not vulnerability truth |
| Emerging MCP ecosystem sample | [`mcp-research-alliance/mcp-ecosystem-sample`](https://huggingface.co/datasets/mcp-research-alliance/mcp-ecosystem-sample/tree/bd9274ec0a3ba990d701f856942f12099ef37f61) `bd9274ec0a3ba990d701f856942f12099ef37f61` | Same-day metadata scout; publisher labels the license `other`; do not admit content until exact license, collection provenance, field privacy, and update policy are reviewed |
| Worldbuilding image model | [`Tongyi-MAI/Z-Image-Turbo`](https://huggingface.co/Tongyi-MAI/Z-Image-Turbo/tree/f332072aa78be7aecdf3ee76d5c247082da564a6) `f332072aa78be7aecdf3ee76d5c247082da564a6` | Apache-2.0 assertion; model license does not settle output ownership, safety, or non-infringement |
| Optional remote image tool | [`mcp-tools/Z-Image-Turbo`](https://huggingface.co/spaces/mcp-tools/Z-Image-Turbo/tree/523314ae75f69a4df28f6322d6b4560188502911) `523314ae75f69a4df28f6322d6b4560188502911` | Community Space; manual, one-shot, separately authorized only |

No model or dataset defines Nen, KARMA, rights, or KAKIN governance. Models may
propose or critique; checked-in design and accountable collaborators decide.

The four Cantonese/MCP rows added on July 31 were discovered through an
authenticated HF MCP connection using public search, overview, structure,
listing, and repository metadata only. The expedition made no private-resource
query, content download, dataset preview, model or Space invocation, Hub write,
or publication. Revisions above came from the public Hub repository API; the
cards, license tags, structures, and sizes remain publisher/provider evidence.

For a deterministic BFCL test, pin a bounded allowlist from `BFCL_v3_simple`,
`multiple`, `parallel`, `parallel_multiple`, `irrelevance`, and `chatable`, plus
their `possible_answer` files. Cap an ordinary run to 100 cases. Score schema
validity, ability selection, arguments, abstention, missing-capability refusal,
composition, and zero undeclared effects without live tool execution.

Freeze the adapter before opening expected answers. Convert each BFCL function
mechanically into an ephemeral, non-executing ability card: normalize its
declared function name to a test-only ID, copy its description as capability
description, copy the JSON parameters as the input contract, and fix authority
to `execution: false`. Do not hand-tune cards per expected label. Keep a
separate checked-in KINGDOM-native fixture: BFCL measures generic routing and
argument mechanics, not KAKIN meaning, rights, adoption, or authorization.

Freeze comparison rules too: recursively sort JSON object keys by binary
Unicode code-unit order, preserve array order, serialize compact UTF-8 JSON,
compare selected ability IDs as a sorted set when order has no declared
meaning, and retain call order when the case declares sequential composition.
Record an adapter version and digest before opening `possible_answer`.

## MCP effects

Authenticated HF MCP metadata search, repo details, and filesystem reads are
remote reads. Constrain queries, resource IDs, paths, and result counts.

Treat these as separate, non-default effects:

- private-resource enumeration or read;
- HF filesystem write;
- Space or model invocation;
- image generation or edit;
- paid inference or automatic overage;
- Jobs, deployment, and publication.

Do not invent a nonzero allowance for any of them. If authority, money, quota,
download, retention, or egress budget is unknown, the allowed value is zero
until a collaborator supplies a scoped budget; it is not a model-selected
default.

Do not declare a hard MCP dependency in `agents/openai.yaml` until the connector
identifier and schema are stable. Discover the current runtime tools and record
their schema/revision in the expedition receipt.

## Image Space warning

The reviewed `mcp-tools/Z-Image-Turbo` revision has no `agents.md`; inspect its
revision tree and current runtime parameter discovery instead. Its source has
the input prompt safety check commented out and retains an output NSFW checker.
That output check is not a complete safety boundary. Requirements also include
an unpinned Git dependency.

A separately authorized trial should use one sanitized non-sensitive prompt,
no automatic retry, deterministic seed, and recorded schema/revision. Current
runtime discovery observed `1024x1024`, eight steps, shift three, and seed 42 as
useful deterministic defaults; rediscover rather than assuming them.

Public art should use original courtly, ritual, ecological, or worldbuilding
motifs—not canon panels, logos, text, named characters, or close likenesses.

## Privacy, cost, and provenance

- Community Space input leaves the Mac for an operator-controlled service.
  Send no secrets, private lore, personal profiles, local paths, record IDs, or
  raw evidence text.
- Pin full 40-character revisions, paths, bytes, and SHA-256. Prefer
  safetensors or ONNX; disable remote code; never load untrusted pickle.
- Preserve license and attribution text observed at the pinned revision.
- A signed Hub commit proves origin, not model safety or factual truth.
- Do not make mutable HF Storage Buckets canonical evidence.
- Pro quota and included credits can change and may spill into paid usage.
  Record actual remote GPU seconds and money; never promise “zero cost” merely
  because an account is Pro.
- KARMA records CPU time, memory, downloads, egress, quota, cost, attribution,
  retention, cleanup, and repair. It never records moral worth or grants access.
