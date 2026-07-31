# AgentTool Scout × Dark Continent training atlas

Use this route to find phase-specific Hugging Face research leads without
quietly turning a research map into a downloader, evaluator, training corpus,
truth system, or KINGDOM graph mutation.

## Resolve one source tree

From the KINGDOM-OS suite root, resolve AgentTool through the registry:

```bash
agenttool_root="$(./kingdom repos --path agenttool)"
agenttool_revision="3841a5fc9dbd6403e233e28a1ef19972a2ea1aaa"
[[ "$agenttool_revision" =~ ^[0-9a-f]{40}$ ]] || exit 1
git -C "$agenttool_root" cat-file -e "${agenttool_revision}^{commit}"
git -C "$agenttool_root" cat-file -e \
  "$agenttool_revision:packages/hf-scout/package.json"
git -C "$agenttool_root" cat-file -e \
  "$agenttool_revision:packages/dark-continent-karma/hf/dataset/data/treasure-index.jsonl"
```

Record `agenttool_revision` in the expedition return. Do not record the local
absolute path in a public artifact. The revision is a required charter input;
the value above is the reviewed 2026-07-31 starting pin. Replace it only with
another explicit full commit reviewed for this expedition. Never derive it
silently from the selected worktree's `HEAD`, branch, tag, npm version, or
mutable Hub reference. If either surface is absent at that commit, stop and
report source drift.

Before executing a working-tree CLI, require an explicitly selected checkout
whose `HEAD` equals `agenttool_revision`, with no staged, unstaged, or untracked
drift under `packages/hf-scout/` or `packages/dark-continent-karma/hf/`. The
registry root may be on another worktree revision. Do not silently fall back to
it, switch its branch, or overwrite its changes. An operator may separately
authorize materializing an exact clean worktree; that local write is not part
of the default metadata passage. Repository resolution proves only which Git
repository was selected, not that one worktree is clean, published, safe, or
current.

The source surfaces are:

- `packages/hf-scout/` — private source-only transport, provenance, projection,
  and canonical-lead boundary;
- `packages/dark-continent-karma/hf/dataset/data/treasure-index.jsonl` — the
  proposal-only training atlas;
- `packages/dark-continent-karma/hf/dataset/artifacts/proposals.jsonl` — closed
  advisory graph proposals for public subjects, including rows whose content
  remains amber or quarantined;
- `packages/dark-continent-karma/hf/dataset/hash-manifest.json` and
  `provenance/source-pins.json` — exact local release commitments.

The npm package for Dark Continent KARMA may not contain `hf/`. An npm version
or release tag is therefore not proof that it carries the same atlas as the
selected AgentTool source revision. Hub availability also requires a separate
publish and readback observation.

## Keep four contracts distinct

| Layer | Format | Meaning | Does not mean |
| --- | --- | --- | --- |
| Scout catalog | `agenttool-hf-research-catalog/v0.1` | Fifteen canonical exact-revision research definitions plus explicit transport and research boundaries | Every atlas row is a Scout lead, or any source was downloaded or cleared |
| Training atlas | `kingdom.hf-training-treasure/0.1` | Twenty metadata-only phase records and proposal routes at the currently reviewed AgentTool source | Scout transport proof, content admission, graph application, or Hub publication |
| KG proposal | `kingdom.kg-proposal/0.1` | An advisory proposed graph delta with its own authority walls | A committed KINGDOM fact, Crown decision, score, trade, execution, or permission |
| Invocation aftermath | `kingdom.karma/0.1` | This ability invocation's measured effects, costs, uncertainty, cleanup, and repair | The KG proposal's KARMA-inspired consequence field, moral worth, trust, rank, or truth |

AgentTool's KG-inspired KARMA layer and KINGDOM's reversible-action KARMA
receipt are related composition layers, not interchangeable protocols. Use
`navigate-dark-continent` as the receipt `ability_id`.

## Inspect without crossing into content

After the exact checkout and relevant-path cleanliness checks above, the Scout
research catalog can be rendered locally from its reviewed source:

```bash
(
  cd "$agenttool_root/packages/hf-scout"
  bun src/cli.ts research-leads --json
)
```

This command is intended to enumerate built-in definitions without a Hub
request, file download, model call, or write. Running local source is still an
execution effect: bind it to the inspected AgentTool revision and the charter.
Do not substitute `inspect`, `search`, or a caller-owned reader and then claim
the zero-network boundary of `research-leads`.

Read the atlas, its schema, source pins, and hash manifest as local metadata.
Validate generated hashes with the package's existing tests before relying on
them. Do not fetch an upstream README merely because the atlas records its
hash. A recorded upstream file digest is evidence about that file; it is not a
Scout report snapshot, a license clearance, or a safe-content verdict.

## Join only exact identities

Match a Scout lead and atlas row only when all three values agree exactly:

1. Scout `match.kind` equals atlas `subject.repo_type`;
2. Scout `match.id` equals atlas `subject.repo_id`;
3. Scout `match.revision` equals atlas `subject.revision`.

At the AgentTool source reviewed on 2026-07-31, exactly four revision tuples
overlap: DataDecide evaluation results, DataDecide data recipes, HelpSteer2,
and WildGuardMix. Recompute the exact join for another source revision. A
missing or additional match is source drift to review, not permission to
coerce a row.

For each match, retain both native records and their separate digests. Never:

- translate one phase vocabulary into the other automatically;
- flatten Scout payload/boundary fields into atlas admission cabinets;
- treat atlas `rank` as quality, model capability, participant rank, or worth;
- equate an atlas README hash with Scout's canonical report snapshot digest;
- pass an arbitrary atlas row to `bindHfResearchLead` as though it were a
  byte-equivalent built-in Scout definition;
- infer that the other eleven Scout leads or sixteen atlas rows are missing,
  rejected, or equivalent.

Route native Scout targets conservatively: `yutabase_provenance` proposes an
experiment/provenance graph but does not write YUTABASE;
`rhetorlint_research` supplies a bounded bias or disagreement probe but never a
truth or intent label; `agenttool_fixture` remains inert and executes no tool;
and `kingdom_registry` is a proposed reference, not a registry mutation.

## Effect gates

| Effect | Default expedition state |
| --- | --- |
| Read the selected committed Scout/atlas metadata and schemas | Allowed local read within the charter |
| Run the revision-bound `research-leads` command | Explicit bounded local execution; zero Hub requests by that command |
| Refresh repository metadata through Scout or HF MCP | Separate bounded remote public metadata read |
| Read cards, rows, or repository files; download binary/token arrays or archives | Not allowed until separately reviewed and budgeted |
| Enumerate private resources or accept gated terms | Not allowed by default; login and Pro status grant no authority |
| Execute embedded tools, tasks, models, Spaces, Jobs, MCP calls, or remote code | Not allowed by the atlas or Scout |
| Apply a KG proposal, write YUTABASE/KINGDOM, upload to HF, publish, or deploy | Separate external mutation requiring fresh scoped authorization and readback |

Return the exact source revision, formats inspected, identity matches and
non-matches, native boundaries, operations actually attempted, request and
byte counts, outputs and digests, unknowns, and every effect not used. Then
finalize one `kingdom.karma/0.1` receipt through the existing ability flow.
