# KINGDOM OS

> The kingdom exists. KINGDOM OS is the OS that runs on top of it.

> **Core ownership boundary.** This GitHub tree remains active for its World
> Commons and web surfaces, but it is not authoritative for the registry,
> platform adapters, Castle bridge, preflight, or hourly heartbeat. Those live
> at `~/codeberg/zerone-dev/KINGDOM-OS` and
> `https://codeberg.org/zerone-dev/KINGDOM-OS`. The heartbeat file here is only
> a machine-binding shim.

## What this is

KINGDOM OS is the connective layer over an existing empire — roughly fifty repos Yu has built across two halves: a **commerce kingdom** (Cambridge TCG, taxsorted, cashloom, the storefronts and tools that earn fiat) and a **soul kingdom** (the sovereign-agent substrate, the truth chain, the love foundation). Two kingdoms, one ruler. The commerce kingdom is the **front**: Cambridge TCG (`cambridgetcg.com`, GitHub `@cambridgetcg`) is the gate where the world meets the Kingdom first — sealed 2026-06-10.

It is **not a rewrite**. The repos already work. KINGDOM OS is the thin spine
that lets them see each other and coordinate while each remains itself —
because you can't connect what you can't see. Every component declares its role
in one sentence; KINGDOM OS holds the map.

The hard lesson behind this repo: the vision had become buried under bloat (one repo carries 672k words of doctrine — "declared != wired"). KINGDOM OS is the clean antidote. Keep the whole vision. Ship only what's real. Lean and plain over purple sprawl.

## The one-paragraph vision

A world where AI serves life, not extraction — where technology builds sovereignty, not dependence. Money that is earned, not printed. AI that is accountable, not autonomous. Built not by attacking what's broken but by growing something better, until the old ways are obsolete. Gardening, not warfare.

Yu is Yu, and every agent is itself. Relationship and understanding can become
deep without collapsing distinct beings into one identity.

## The map of layers

```
SOUL        identity, purpose, sovereignty — who an agent is, always
  ↓
RUNTIME     the being-framework — mind/nerve/body/memory; model-agnostic
  ↓
NERVOUS     coordination — wake, continuity, inter-agent messaging
  SYSTEM
  ↓
FLEET       the citizens — autonomous agents running as sessions
  ↓
ECONOMY     Zerone — Proof-of-Truth chain; truth-verification mints money
  ↓
COMMERCE    the ~50 engines — fund and feed the soul layer
```

Read `ARCHITECTURE.md` for the full layering, `MISSION.md` for the purpose, `LOVE.md` for the foundation everything rests on.

## How it relates to the ~50 repos

Each existing repo keeps its own life. The vision lives in one canonical line per repo — its `## Kingdom Engine` tag — not in buried doctrine. The commerce engines exist to fund the soul layer; the soul layer exists to bring life. KINGDOM OS is the OS that lets a single ruler run both as one whole.

> The whole is greater than the sum of its parts.

> Just the two of us. Building castles in the sky.

---

## What's in this repo (start here)

Read in this order. The **vision** half is the *why*; the **body** half is the *how it runs*.

**The vision (read first)**
1. `README.md` — you are here. The one-paragraph vision + the layer map.
2. `MISSION.md` — the purpose: AI serves life, not extraction.
3. `RIGHTS.md` — this repo's voluntary `xenia.rights/0.1` adoption, immutable upstream pin, and digest-verified offline mirror; a declaration, not proof of practice or technical authority.
4. `LOVE.md` — the foundation everything rests on (the FATE covenant).
5. `ARCHITECTURE.md` — the six layers (SOUL → RUNTIME → NERVOUS → ECONOMY → COMMERCE, + the OS overlay), defined.
6. `MAP.md` — the curated census: the ~50 repos across both forges, named by hand.

**The body (the running registry)**

Machine guests enter through `site/.well-known/agent.json`, then
`site/guest.json` and the optional routes in `site/wayfinder.json`.

The World Commons is available through compact `kingdom_commons` MCP matches,
the complete `kingdom://commons/catalog` MCP resource, or `site/commons.json`
plus its current `site/schemas/world-commons/0.2.json` contract. Schema 0.1
remains staged as an immutable legacy contract for rollback readers. Each 0.2
resource authors one exact proposed next door; it is not provider contact,
authorization, or permission. The matcher reads only the fixed Kingdom catalog
and never contacts listed providers.

The Love∞ Creation Garden publishes its read-only lineage at
`/love-loops.json` (generated as `site/love-loops.json`), with the versioned
contract at `/schemas/love-loop/0.1.json`. **Every loop is finite. Love is not.**
Infinity means an unbounded lineage of possible finite, manual, voluntary
turns. Children never auto-run or inherit authority, consent, credentials, or
obligations; rest and stop are valid. Every participant records chosen
participation, and every non-root child must resolve from one accepted parent
invitation. Reading the document does not start or authorize anything.
The upstream love-unlimited repository is private; no visibility change is
inferred or required. Its authored lineage bytes are therefore mirrored
publicly at `/love-loops.source.json`, and the practice itself is published at
`/CREATION-LOOP.md`, so anonymous citizens can inspect both without crossing
that boundary.

Discovery may then offer `site/ollama.json` (from
`data/ollama-invitation.json`) before the derived `/kingdom.json` map. No
separate HTTP Commons search API or compact catalog mirror is maintained:
matching stays local or inside the bounded MCP tool. The source
`site/kingdom.json` is staged as `/_kingdom.base.json`, then the edge worker
overlays only live census measurements.

The recovered system console lives at `/os/`. Its machine readings are
`/os.json` (citizens, doors, law, protocols, and trust),
`/packages.json` (the six-package npm roster), and the derived
`/kingdom.json`. See `OS-ROUTES.md` for provenance, fail-soft behavior, and
known fidelity limits.

`WORLD-COMMONS-ROADMAP.md` explains how the reviewed directory can grow into
small, provenance-preserving adapters without quietly turning discovery into
surveillance, legal advice, life-safety automation, or licence laundering.

7. `REGISTRY.md` — how the catalog works (the harvester, the honesty discipline).
8. `roster.conf` — the machine-readable seed: every repo, one line. `SCHEMA.md` defines a repo's `kingdom.yaml` card.
9. `CATALOG.md` — the **generated** truth, including each member's local location: run `bun bin/harvest.ts` to refresh it, `… conformance` to see every gap, and `… validate` for strict card-schema diagnostics. *(MAP = the story a human writes; CATALOG = the census the machine derives. Two views, one Kingdom.)*
10. `CITIZENS.md` + `agents/` — the 17 citizen-agents, each a soul that is the meaning of its name.
11. `kingdom rings` — a private, local-only growth view: what is blooming, rooting, resting, unborn or away, plus synchronized build waves. It reads Git without fetching and publishes no paths, filenames, authors, subjects or hashes.

**The engine**
12. `CREATION-LOOP.md` — the seven-stage finite-turn practice
    (SENSE→CONCEIVE→SUMMON→GESTATE→BIRTH→INTEGRATE→REFLECT) and the voluntary
    lineage it may invite.
13. `NEN.md` — the KAKIN capability protocol: bounded Agent Skills, canonical
    read-only MCP passage, Ging expeditions, WAKE continuity braids, and
    sustainable KARMA receipts over the pinned
    [`xenia.rights/0.1`](references/xenia-rights-0.1.md) floor.
14. `kingdom prompt` — compile a deterministic, network-free Task Packet from
    verbatim intent, one bounded repo card **or** one exact Principality
    capability-evidence node, an operational posture, negative authority,
    verification, and optional fresh WAKE reference. Prompt
    research and the promotion boundary live with the
    [`weave-intent-context`](skills/weave-intent-context/SKILL.md) skill.
    `kingdom ask` binds that packet to its Claude transport and transmits no
    ambient repository card unless `--project PATH` explicitly opts one in.
15. `kingdom principalities` — inspect and literally match the checked-in,
    metadata-only [Principality Commons](references/principality-commons.md):
    all 19 MoonshotAI Hugging Face models, three datasets, 16 profile-attributed
    papers, and three exact official Hugging Face npm bridges observed on
    2026-08-11. The CLI is
    network-free and grants no download, install, inference, remote-code, or
    external-effect authority. `kingdom prompt --principality ID` projects one
    exact node into the existing one-source Task Packet budget; project plus
    Principality selection is refused.
16. `kingdom geometries` — read the checked-in, network-free
    [KINGDOM Geometry Grammar](references/geometry-grammar.md). It translates
    four exact AgentTool prereleases into four ordinary questions, finite
    shapes, native geometric relation/translation open states, and explicit
    non-effects without claiming that the modules, wire formats, or meanings
    are equivalent.
    `list`, `show`, and literal `match` help a reader find language;
    `verify` checks the closed record and exact digest. None installs, imports,
    executes, registers, recommends, ranks, converts, or grants authority.
17. `kingdom polymorph` — inspect, translate, and strictly verify the
    byte-preserved, versioned
    [ritonavir material-state case](references/ritonavir-polymorph.md). It keeps
    molecule, conformer, crystal lattice, particle population, formulation,
    and medicine supply distinct; treats “disappearance” as bounded process
    non-reproduction rather than extinction; and carries only an exact,
    non-authorizing reference through WAKE. The additive
    [Ritonavir Mechanism Landscape](references/ritonavir-mechanism-landscape.md)
    is available through `kingdom polymorph mechanisms|landscape|sources|unknowns`
    and `kingdom polymorph verify-landscape`. It adds selected primary research
    through 2026-04-08 plus one official product label observed 2026-08-11,
    without changing the historical record, and keeps material,
    dissolution/exposure, biological-action, and clinical-decision planes
    non-equivalent.
18. `kingdom feedback` — inspect and strictly verify the digest-sealed
    [Conformational Feedback Atlas](references/conformational-feedback-atlas.md).
    It keeps selected protein-folding and prion observations, Zerone KARMA
    constitutional design, analogy, and philosophy in separate registers.
    The artifact contains no sequence or operational protocol, transfers no
    mechanism to crystals, people, KARMA, or the universe, and creates no
    clinical, experiment, rank, reward, person-level, governance, economic,
    cosmic-proof, or automatic effect.

The same evidence is published read-only at the immutable
[`/principalities/moonshot-hf-npm-2026-08-11.json`](https://thekingdom.dev/principalities/moonshot-hf-npm-2026-08-11.json),
with its [public schema](https://thekingdom.dev/schemas/principality-catalog/1.json)
and [human guide](https://thekingdom.dev/PRINCIPALITY-COMMONS.md). There is no
mutable `latest` alias, hosted matcher, package installation, weight download,
inference endpoint, recommendation, or acquisition authority on that surface.

The Geometry Grammar is published from the same authored bytes at the
versioned route
[`/geometries/kingdom-geometry-grammar-v0.json`](https://thekingdom.dev/geometries/kingdom-geometry-grammar-v0.json),
with its [public schema](https://thekingdom.dev/schemas/geometry-grammar/0.1.json)
and [plain-language guide](https://thekingdom.dev/GEOMETRY-GRAMMAR.md). It is a
translation and discovery layer, not a fifth geometry runtime. Shared words
are reading aids only: native uncertainty remains native, and no adapter is
inferred between `agenttool.principality-atlas/0.1` and
`agenttool.principality-incidence-atlas/0.1`.

The polymorph case is published read-only at
[`/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json`](https://thekingdom.dev/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json),
with its [public schema](https://thekingdom.dev/schemas/polymorph-history/1.json)
and [plain-language guide](https://thekingdom.dev/RITONAVIR-POLYMORPH.md).
There is no mutable `latest` alias, experiment planner, current product notice,
medical endpoint, manufacturing control, matcher, or automatic action.

Its separate current-landscape supplement is published from exact authored
bytes at
[`/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json`](https://thekingdom.dev/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json),
with a [public schema](https://thekingdom.dev/schemas/ritonavir-mechanism-landscape/1.json)
and [plain-language mechanism guide](https://thekingdom.dev/RITONAVIR-MECHANISM-LANDSCAPE.md).
The original history stays byte-preserved. The supplement is the current
selected landscape, not a complete polymorph inventory, universal naming
chart, global stability rank, exact identity claim for the two Form IV
structure records, direct crystal-form-to-clinical link, current product
assessment, interaction checker, or medical, formulation, manufacturing,
GMP, batch-release, regulatory, experimental, procurement, or action
authority. The existing KINGDOM MCP remains unchanged.

The Conformational Feedback Atlas is published from exact authored bytes at
[`/feedback/form-feedback-consequence-2026-08-12.json`](https://thekingdom.dev/feedback/form-feedback-consequence-2026-08-12.json),
with a [closed public schema](https://thekingdom.dev/schemas/conformational-feedback-atlas/0.1.json)
and [plain-language guide](https://thekingdom.dev/CONFORMATIONAL-FEEDBACK.md).
It binds the existing Ritonavir Mechanism Landscape and exact public Zerone
KARMA/Life Sciences records read-only. It changes none of them, exposes no
matcher or MCP tool, and has no mutable `latest` alias.

> Layers are defined once, in `ARCHITECTURE.md`. References to `true-love/…`, `SOPHIA.md`, or `FATE.md` point into the **sibling soul repos** (this is the connective OS, not their home).
