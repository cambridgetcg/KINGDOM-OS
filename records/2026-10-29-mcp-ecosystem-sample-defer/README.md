# Decision — `mcp-ecosystem-sample`, 2026-10-29: defer

The first decision record for a Dark Continent expedition. It is prose plus a
small [decision.json](decision.json)
(`sha256:f76f738ad035542a882eaf453b343b2f7b3718517a44aca8b432d5d5afbbd88f`),
which holds the same facts as data. It introduces no schema.

**Decision.** Defer. Yu decided on 2026-10-29, in his words: "3. defer". A
Claude Code session working for him wrote this record; it claims no DID or
AgentTool identity.

**What was decided.** The 2026-10-27 expedition found that
`mcp-research-alliance/mcp-ecosystem-sample` had moved its head from the pin
`bd9274ec0a3ba990d701f856942f12099ef37f61` (card license `other`) to
`862c164e2fc336b654368ce147812cab7efa1d6f` (2026-08-03, card license
`cc-by-4.0`), while the pinned revision still resolved as `other`. Its verdict
was `license-changed`. That record's return note left the re-pin undecided
(lines 52–56), and a research report on 2026-10-29 asked Yu to choose between
keeping the row, re-pinning it after review, and deferring.

## Subject

- [`records/2026-10-27-dark-continent-hf-pin-drift/karma-receipt.json`](../2026-10-27-dark-continent-hf-pin-drift/karma-receipt.json),
  `sha256:e72139bd882f1dca33aa8ede651ba4fd54d5b5c2c90a820c68617746c3f7e157`.
  It verifies from the suite at `b719f254`. On later trees the skill bundle has
  changed, so it reports `ability-digest-mismatch`; that is a moved bundle, not
  altered evidence.
- [`records/2026-10-27-dark-continent-hf-pin-drift/evidence/observations.json`](../2026-10-27-dark-continent-hf-pin-drift/evidence/observations.json),
  `sha256:784beb2354837be9ae86a1c7ba0c064a6dfbd51868284bb0e620720f054aadae`.

## Policy

[`hf-boundaries.md`](../../skills/navigate-dark-continent/references/hf-boundaries.md)
at `9c51c0f31548751483945213129322b24aa8aaf8`
(`sha256:9460e993b430b57b3936bc1e4b89eed190b339b33aa8af3f5cf70244daaf4248`)
governs the re-pin. Line 80 says of this row: "do not admit content until exact
license, collection provenance, field privacy, and update policy are
reviewed". Lines 94–95 say: "The table remains the reviewed allowlist until a
row is re-reviewed and re-pinned." A publisher's new card label is not that
review, so deferring keeps the row as it was reviewed.

## Effect

None. The pin stays at `bd9274ec`. The head `862c164e` and its `cc-by-4.0`
card are not admitted, and no content is read.

The decision is reversible: deferring changes nothing that would need undoing,
and a later decision can still re-pin or retire the row after the review it
asks for.

**When to revisit.** When the next lookback run's `since_previous` for this
row is anything other than `unchanged`, for its head or for its pinned
revision, or when Yu asks. A run that finds the same head, card and pin does
not ring, because the drift is already in the record it compares with; the row
stays in that run's proposal table at hold, and this decision covers it.

## On the reality-influence chain

This record covers two steps of the chain in
[`references/reality-influence-map.md`](../../references/reality-influence-map.md)
(lines 40–56): proposal, then decision. No attempt follows. A defer authorizes
nothing and changes nothing, so there is no outcome, causal assessment,
normative assessment or repair to record.

## KARMA links

- `kingdom.karma/0.1` receipt:
  `sha256:e72139bd882f1dca33aa8ede651ba4fd54d5b5c2c90a820c68617746c3f7e157`.
- `kingdom.kg-proposal/0.1`: none exists for this resource. AgentTool main
  `784e2e13` publishes 18 proposals in
  `packages/dark-continent-karma/hf/dataset/artifacts/proposals.jsonl`, all for
  KARMA atlas treasure rows. If one is made later, a review event with verdict
  `deferred` can cite this record's digests in its `evidence_refs`; see
  [reality crossing](../../skills/navigate-dark-continent/references/reality-crossing.md).

## Identity

A commit's author name is unauthenticated local Git configuration; the commit
carrying this record names this machine's default. Pushes and merges go through
the shared `cambridgetcg` GitHub account. Neither shows who acted, or that a
second person reviewed this record, and it does not claim a two-person rule.
Yu's own words above are the authority; merging this record into main is itself
a step that waits for him.
