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
- [`mcp-server.mjs`](mcp-server.mjs) exposes those functions over local stdio.
- [`mcp-manifest.json`](mcp-manifest.json) declares effects and non-authority.
- [`../skills/walk-ging-path/`](../skills/walk-ging-path/) is the Agent Skill.

## Run the MCP port

From the repository root:

```bash
node nen/mcp-server.mjs
```

Configure an MCP host to launch `node` with `nen/mcp-server.mjs` as its
argument and this repository as its working directory. Registration is a host
configuration action; this repository does not silently alter a live Codex,
Claude, or other MCP configuration.

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
