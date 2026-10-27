# Dark Continent return note — 2026-10-27

The first recorded `navigate-dark-continent` expedition. It ran as one bounded
passage under [charter.yaml](charter.yaml), with the ability bound to
KINGDOM-OS `b719f2546c8765238a8f0ca0cfee9884669864c0`.

**Question.** Are the public Hugging Face resources that the Dark Continent
route pins still present and public, at their pinned revisions, with the
license and gating recorded on 2026-07-31? The route's pins are the 13 reviewed
rows in `hf-boundaries.md`, the 20 treasure rows of the KARMA atlas, and the
atlas's own Hub dataset.

**Answer.** Yes for 33 of 34. The exception is
`mcp-research-alliance/mcp-ecosystem-sample`, whose head has moved and whose
license assertion has changed. Its pinned revision is intact.

## Observations

- There were 35 anonymous GETs to `huggingface.co/api`, and every one returned
  HTTP/2 200 JSON. No redirects, cookies or retries occurred.
- 33 resources report their pinned revision as head. All 33 are public and not
  disabled. The two atlas rows recorded as gated are still `gated: auto`:
  `Salesforce/xlam-function-calling-60k` and `allenai/wildguardmix`. Every
  recorded license matches, and both `not_declared` rows still declare none.
- `mcp-research-alliance/mcp-ecosystem-sample` compares as follows:

  | Revision | Commit | lastModified | Card license |
  | --- | --- | --- | --- |
  | Pinned (still resolves) | `bd9274ec…` | 2026-07-31T04:16:10Z | `other`, as recorded on 07-31 |
  | Current head | `862c164e…` | 2026-08-03T16:20:23Z | `cc-by-4.0` |

- `Yu-and-Ai/kingdom-dark-continent-karma` has head `4ea10623…`, which is the
  revision the Space source manifest pins. It is public, with license
  `apache-2.0`.
- Four `hf-boundaries.md` rows recorded no license on 07-31. Their first
  recorded assertions are all `apache-2.0`:
  - `Xenova/all-MiniLM-L6-v2`
  - `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
  - `AI-Secure/DTap-Bench-Agent-Trajectories`
  - the `mcp-tools/Z-Image-Turbo` Space (card only)
- The atlas treasure index is the same Git blob at AgentTool `3841a5fc` (the
  07-31 route pin) and at `8947c8fd` (origin/main, reviewed for this run).
- The local `cambridgetcg/hf-kingdom-lab` clone at `d8e48068` has no
  `handshake` anywhere in its committed tree. It also contains no reference to
  the Dark Continent, `kingdom.karma` or `nen-hf-evidence-ref`.

The per-resource detail is in [evidence/observations.json](evidence/observations.json),
and every request is logged in [evidence/requests.jsonl](evidence/requests.jsonl).

## Inference

- The `hf-boundaries.md` row for the MCP ecosystem sample is accurate about its
  pin and stale about the head. The new `cc-by-4.0` card is a publisher
  assertion. It does not satisfy the row's own condition: review of the exact
  license, collection provenance, field privacy and update policy. Whether to
  re-pin is a documentation decision and was not made here.
- The 32 unchanged rows with a 2026-07-31 baseline (12 from `hf-boundaries.md`,
  20 from the atlas) report `lastModified` on or before 2026-07-30. That is
  consistent with no commit since the review. The atlas's own Hub dataset has
  no 07-31 baseline. Its head `4ea10623…` is dated 2026-08-01, and it is the
  revision the Space source manifest pins as the initial dataset publish, so
  "no commit since" holds against that pin, not against a 07-31 review. Gating
  and visibility can still change without a commit, and this is one snapshot.
- hf-kingdom-lab still lacks the versioned capability handshake that
  `hf-boundaries.md` requires. Under that boundary the lab stays optional, so
  this expedition did not use it.

## Effects and permissions

- **Remote:** 35 GETs out of a budget of 70. 86,820 bytes were received. Only
  resource IDs, one pinned revision, `expand` field names and the User-Agent
  `Mozilla/5.0` left the device. No token, Authorization header, cookie,
  `.netrc` or curl config was used.
- **Local reads:**
  - the suite extract at `b719f254`;
  - AgentTool Git objects at `8947c8fd` and `3841a5fc`;
  - the lab's committed tree, through `git grep`, plus its LICENSE.
- **Local execution:** `python3 -I` helpers, `curl`, and the read-only
  `./kingdom nen` commands (`list`, `validate`, `receipt-template`,
  `verify-receipt`).
- **Local writes:** this directory and session scratch.
- **Unchanged:** no working tree was modified. The lab's DataNode was never
  opened, so no cache or index was initialized or repaired.
- **Not used:** private reads, downloads, gate acceptance, `*.hf.space`
  requests, provider or model calls, Jobs, Hub writes, the `hf` CLI or
  `huggingface_hub`, commits, pushes and publication.

## Not inspected

- **File trees, file bytes, README bodies and the atlas's per-file digests.**
  Downloading them was outside the charter.
- **Byte identity of the Hub dataset's treasure index with AgentTool main.**
  This rests on a same-day audit, not on this run.
- **Gating terms, gate acceptance and Space runtimes.** Accepting a gate is
  forbidden, and reaching a runtime would mean contacting `*.hf.space`, which
  wakes Spaces. Gating was not requested for the one Space.
- **A second GET for the 33 unchanged resources.** Each head already is its
  pin, so the second request was dropped as a duplicate.
- **Scout's `research-leads` and the KARMA viewer Space.** Neither is part of
  this question.

## Costs

| Cost | Value | Basis |
| --- | --- | --- |
| Bytes received | 86,820 | Observed |
| Wall clock, charter to receipt | 381,834 ms | Observed |
| Summed transfer time | 18,873 ms | Observed |
| Money | GBP 0 | Observed |
| Remote GPU | 0 s | Observed |
| Request bytes | about 7,938 | Estimated from uncompressed request text; curl reports 0 for HTTP/2 |
| CPU, memory and energy | — | Not measured |

## Cleanup, retention and repair

- All 35 raw bodies, 35 header files and 35 derived-field files were deleted
  at 2026-10-27T18:16:42Z, after their digests were recorded. The helper
  scripts in session scratch are deleted at return.
- This record keeps the charter, the request log, the observations, the
  receipt and this note. Review or retire it by 2027-10-27.
- Nothing remote changed, so there is nothing to roll back. Before commit,
  deleting this directory retracts the record completely.
- Publishers or maintainers may challenge any reading here. The repair is a new
  bounded expedition with its own charter and a successor record. The receipt's
  digests bind this record's evidence, so do not edit it in place. The license
  values are the publishers' assertions, attributed to them.

## Receipt

- **File:** [karma-receipt.json](karma-receipt.json),
  `sha256:e72139bd882f1dca33aa8ede651ba4fd54d5b5c2c90a820c68617746c3f7e157`.
  It is `kingdom.karma/0.1`, `state: final`, `result: completed`.
- **Contents:** 40 inputs (5 local, 35 remote public) and 3 bound outputs. The
  outputs are the charter, the request log and the observations.
- **Verification:** run `./kingdom nen verify-receipt <absolute path>` from the
  `b719f254` suite root. It reports
  `KARMA receipt: valid · 0 issues · sha256:992c5551…`.
- **Why this note is not in the receipt:** it was written after the receipt so
  that it could bind the receipt's digest. An analysis cannot precompute its
  own digest, so the receipt does not list this note.

## Erratum — 2026-10-27, after review

The bound [evidence/observations.json](evidence/observations.json) overstates
one inference. At `.inference[3]` it says: "Every unchanged resource reports a
lastModified at or before 2026-07-30, consistent with no commit since the 07-31
review." The same file shows otherwise: the
`Yu-and-Ai/kingdom-dark-continent-karma` row is `unchanged`, has
`baseline.observed_on: null` and reports `lastModified`
2026-08-01T07:16:55Z. The Inference bullet above gives the corrected reading.
The per-resource fields are unaffected.

The observations file and the receipt were not re-finalized. The receipt's
digests, `finished_at` and costs describe the run as it ended at 18:17:51Z, and
this record does not edit bound evidence in place. Read `.inference[3]` with
this correction.
