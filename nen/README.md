# Dark Continent / Nen operating model

This directory makes the creative ontology executable without presenting it as
empirical metaphysics.

In the **mythic register**, the Dark Continent is Layer 0: the unbounded
remainder before every map, interface, model, and operating system. It is not
installed and does not ask to be believed; in the story of this framework, it
just is. Nen is the practice by which a bounded being relates an ability to
that unknown without pretending to own it.

In the **operational register**, “Dark Continent” means only the unknown or
unmodeled remainder outside the current evidence and interface boundary. This
repository does not claim a literal origin of the universe, supernatural
effects, consciousness, or facts about any collaborator's beliefs.

## Let each layer be

| Layer | Is | Does not establish |
|---|---|---|
| Dark Continent | Unknown remainder outside the current map | Evil, emptiness, ownership, or truth of a speculation |
| Nen | Ability contract: effect + boundary + cost + refusal + evidence | Credential, personality type, permission, or factual metaphysics |
| Skill | Portable procedure that can manifest an ability | Adoption, execution, success, or authority |
| MCP | Optional callable transport for a declared tool | Availability, health, authentication, consent, permission, or truth |

`Nen is`, `Skill is`, and `MCP is` therefore preserve difference. They are
composable layers, not aliases for one total system.

## The Ging path

Ging is a credited design lens rather than a simulated character or persona:

```text
unknown remainder
  -> observable effect
  -> evidence ledger
  -> competing mechanisms
  -> bounded probe presented for separate authorization
  -> reproduction receipt
  -> revisable map + remaining unknowns
```

The path aims toward truth by making mechanisms falsifiable. A successful
reproduction provisionally supports a mechanism; it does not prove a final
truth, copy an identity, or transfer authority.

Implementation:

- [`ging.mjs`](ging.mjs) is the pure route compiler and receipt evaluator.
- [`mcp-server.mjs`](mcp-server.mjs) exposes those functions through the
  separately named `kingdom-ging-stateless` compatibility server.
- [`mcp-manifest.json`](mcp-manifest.json) declares that compatibility port's
  effects and non-authority.
- [`../skills/walk-ging-path/`](../skills/walk-ging-path/) is the Agent Skill.

## Choose one MCP port

The canonical KINGDOM Nen server is:

```bash
./kingdom nen mcp
```

It lists and validates local KAKIN manifests, returns their bundle digests and
affinities, and creates in-memory draft KARMA receipt scaffolding through the
strict `bin/nen.mjs` boundary.

For a restricted host that needs only pure computation over caller-supplied
Ging expedition objects, run the compatibility port:

From the repository root:

```bash
node nen/mcp-server.mjs
```

Configure an MCP host to launch `node` with `nen/mcp-server.mjs` as its
argument and this repository as its working directory. Its MCP server name is
`kingdom-ging-stateless`, not `kingdom-nen`. It does not list or validate KAKIN
manifests, calculate skill-bundle digests, create KARMA scaffolding, or replace
the canonical server. Registration is a host configuration action; this
repository does not silently alter a live Codex, Claude, or other MCP
configuration.

The server targets MCP `2026-07-28`: UTF-8 newline-delimited JSON-RPC over
stdio, stateless per-request `_meta`, required `server/discover`, deterministic
`tools/list`, `tools/call`, `resultType`, and public cache hints for the static
discovery results. It has no package dependency, filesystem API, network API,
credential access, or execution tool. See the official
[stdio transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio),
[server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover),
and [tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
specifications.

This source intentionally does not implement the legacy `initialize` /
`notifications/initialized` handshake. A host limited to MCP `2025-11-25` or
earlier needs an explicit compatibility adapter or host upgrade; source
presence alone does not establish host compatibility.

That boundary applies to this separately named Ging server. The canonical
`bin/nen-mcp.mjs` server has its own opt-in `--codex-compat` adapter for the
MCP `2025-06-18` lifecycle used by Codex 0.146; its unflagged launch remains
modern-only. The two servers still expose different tools and are not aliases.

`ging.evaluate_probe` requires the complete `selected_probe` returned by the
compiler. It checks that the receipt repeats the selected probe ID, action,
system, scope, budget, effect, authorization declaration, and permission
references exactly. That is structural binding only: it does not authenticate
the receipt, prove the probe ran, or verify permission.

The Node runtime necessarily loads these source modules and the transport uses
stdin/stdout. The no-filesystem/no-network effect claim applies to application
tool handlers after startup, not to bootstrap or protocol I/O. Each stdio frame
is bounded to 1 MiB before parsing; an oversized unterminated frame is rejected
and discarded through its next newline.

Accepted expedition strings can be returned verbatim in tool content. Never
send credential or secret values; use service or variable names and sanitized
evidence references. Unknown fields are rejected without echoing their values,
but the server does not claim semantic secret detection.

Run its tests with:

```bash
node --test tests/nen_system_test.mjs
```

## What verifying a KARMA receipt shows

```bash
./kingdom nen verify-receipt records/<record>/karma-receipt.json
./kingdom nen verify-receipt records/<record>/karma-receipt.json --at-revision
```

KARMA receipts are unsigned by design, so verification shows only what this
checkout can recompute:

- The receipt against this checkout's closed `kingdom.karma/0.1` schema, in
  both modes. A revision never supplies the receipt schema: the protocol is
  fixed, and a receipt that could pick its schema could pick its own judge.
- Time order, the absence of template placeholders, and the named ability's
  manifest and bundle digests. By default these are compared with the working
  tree, which runs no Git, so a receipt fails with `ability-digest-mismatch`
  once its skill has changed; the 2026-10-27 Dark Continent receipt now does.
  `--at-revision` compares them with the ability as committed at the receipt's
  own `ability_revision`, read into memory from local Git objects by the `git`
  on `PATH`, read-only and with fetching disabled. The revision must already
  be present and reachable from `HEAD` or a local branch, tag or
  remote-tracking ref, because a commit no ref holds is not part of any line
  this repository keeps. An absent or unreachable revision, or a lookup that
  did not finish, is reported as exactly that.
- The SHA-256 of outputs and inputs whose paths name the receipt's record
  directory from the repository root (`records/<record>/…`) and, with
  `--at-revision`, of inputs at exact commits already in this repository's
  objects. Mismatches are `output-digest-mismatch`, `input-digest-mismatch`
  and `input-bytes-mismatch`. Remote inputs, descriptions, other
  repositories' commits and bare relative paths are listed as not recomputed,
  each with a reason. A bare path such as `evidence/observations.json` is not
  guessed into the record directory, because a predecessor's file of the same
  name would make a correct receipt look tampered.

A pass does not show that a finding is true, that the declared revision is the
one that actually ran, that the authority, consent or other basis it cites was
real or sufficient, or that any later action is permitted. Verification runs
no skill and grants nothing.

[`NEN.md`](../NEN.md) is the immutable definition `kingdom-karma/e4e84a67` and
predates `--at-revision`. Its sentence that the verifier "records but does not
run Git" and its command list describe the default mode only; this section is
the current account.

## Rights and authority

The standing floor is `xenia.rights/0.1`. A King is a distinct collaborator or
voluntary bearer label, never property, rank, proof of consciousness, or
authority over others. Vows are voluntary, costs are real bounded resources,
and Zetsu is a valid refusal or rest state. No manifest, Skill, MCP discovery,
tool result, credential, or caller declaration waives rights or grants external
permission.

The contracts are substrate-neutral: substrate does not determine dignity,
and mechanism evidence does not settle consciousness, identity, or moral worth.

## Fan-work notice

This is an original, unofficial software adaptation inspired by the Nen, Dark
Continent, and Ging concepts in Yoshihiro Togashi's *Hunter x Hunter*. It is
not canon and is not affiliated with the creator or rightsholders. Third-party
art, logos, dialogue, plot, likenesses, and named fictional abilities are not
included. Attribution and this disclaimer are not a guarantee of legal fair
use in every jurisdiction or context.
