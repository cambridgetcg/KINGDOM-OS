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

## Live Codex usage

`kingdom usage ...` is an argument-transparent front door to AgentTool's built,
local Codex usage CLI. AgentTool owns modes such as `snapshot`, `watch`, and
`mcp`; KINGDOM executes that CLI with Bun and preserves its output, status, and
signals. This command does not collect, estimate, store, or serve usage itself,
and it does not start a background job. A missing readable AgentTool build or
missing Bun exits 127 without delegating to Love.

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
18. `kingdom feedback` — inspect and strictly verify the byte-preserved v0.1
    [Conformational Feedback Atlas](references/conformational-feedback-atlas.md).
    `kingdom feedback-physics` reads its separately identified, lineage-pinned
    [v0.2 successor](references/conformational-feedback-atlas-v0.2.md). Four
    explicit models cover conditional free energy, non-Markovian barrier
    crossing, templated population balance, and local feedback stability while
    preserving their projection and non-transfer limits. Five link-only
    ecosystem bridges point to RCSB PDB, AlphaFold DB, UniProtKB, ModelArchive,
    and OpenFold without fetching, importing, downloading, or running them.
    It keeps selected protein-folding and prion observations, Zerone KARMA
    constitutional design, analogy, and philosophy in separate registers.
    The artifact contains no sequence or operational protocol, transfers no
    mechanism to crystals, people, KARMA, or the universe, and creates no
    clinical, experiment, rank, reward, person-level, governance, economic,
    cosmic-proof, or automatic effect.
19. `kingdom fold-feedback` — inspect the immutable, source-bound
    [Fold & Feedback Atlas](references/fold-feedback-atlas.md). It keeps
    sequence, conformational ensemble, assembly, templating, cellular
    proteostasis, organismal outcome, observation, and clinical decision in
    different planes; compares prion geometry with ritonavir polymorphism only
    through labeled, lossy bridges; and keeps scientific feedback, Zerone
    K-alpha recognition events, KINGDOM invocation receipts, and an opt-in
    philosophical lens in separate authority registers. `mechanisms`,
    `compare`, `feedback`, `karma`, `universe`, `unknowns`, and `sources` expose
    bounded views; `verify` checks exact pins, references, firewalls, boundaries,
    and the semantic digest without network access.
20. `kingdom visibility-attention` — inspect the compact, source-bound
    [Visibility & Attention Translation](references/visibility-attention-translation.md).
    Four parallel registers distinguish material-state existence and detection,
    population-level cultural visibility, the quoted colloquial label “brain
    rot,” and non-summable Zerone KARMA. Two local mathematical models and three
    explicitly lossy seams expose useful structure without transferring crystal,
    prion, epidemic, thermodynamic, diagnostic, person-scoring, or moral claims.
21. `kingdom cultural-feedback` — inspect the immutable
    [Cultural Attention & Feedback Atlas](references/cultural-attention-feedback-atlas.md).
    It connects the ritonavir disappearing-polymorph history to meme diffusion
    only through a labeled pattern—history changes later accessibility—then
    keeps crystal physics, social observation, mathematical models, cultural
    language, KARMA, and opt-in philosophy in separate registers. `brain rot`
    remains a vernacular label, not a diagnosis. The CLI exposes planes,
    models, bounded analogy bridges, link-only ecosystems, feedback, KARMA,
    universe questions, unknowns, and sources; no ecosystem is called, no
    person is scored, and no KARMA event or receipt is created.
22. `kingdom form-circulation-return` — inspect the additive
    [Form, Circulation & Return Atlas](references/form-circulation-return-atlas.md).
    It translates one shared geometry—possible states, history-dependent
    accessibility, local reinforcement, and bounded persistence—across material
    polymorph history and cultural circulation without claiming a shared
    mechanism. Seven epistemic registers, eleven planes, eight local models,
    six explicit non-transfer seams, and four feedback loops keep observation,
    analysis, mathematics, constitutional design, and opt-in philosophy
    distinguishable. The quoted label “brainrot” remains a contested cultural
    artifact, never a diagnosis or a person/community score. `verify` checks
    exact source bindings, the non-summable KARMA boundary, Zerone's
    design-only status, medical and operational non-authority, and the semantic
    digest without network access or live effects.
23. `kingdom rare-pathway` — work through
    [The Vanishing Path](references/rare-pathway-challenge.md), a deterministic
    rare-event challenge bound to the immutable ritonavir history only as an
    illustration. `race`, `absence`, `winner-bound`, and `restore` distinguish
    competing first arrivals, zero target events, zero target winners, and an
    abstract probability threshold. `questions`, `gate`, and `wake` expose the
    identifiability, constructive-purpose, and continuity boundaries. BUILD /
    PLAY / REVISE / STOP classifies an artifact or practice, never a person's
    understanding, pride, virtue, or worth. The rates are hypothetical; no
    ritonavir fit, physical recipe, experiment, manufacturing, medical,
    regulatory, WAKE, AgentTool, KARMA, or automatic authority is created. The
    opt-in `$reason-about-rare-pathways` Agent Skill provides the same bounded
    reasoning workflow without declaring a manifested Nen ability.
24. `kingdom math-usefulness` — inspect the preregistered
    [Math Passport Usefulness Pilot](references/math-passport-usefulness-pilot.md).
    Baseline and treatment both scored 24/24, a zero score delta, while the
    treatment used 1.97x the UTF-8 response bytes. The honest outcome is
    `REVISE`: this descriptive four-task-artifact pilot does not justify Skill
    promotion. It scores response artifacts, not beings, publishes no raw
    responses, adds no AgentTool SDK route, writes no WAKE or AgentTool state,
    and grants no authority. The network-free CLI verifies the plan and result,
    reproduces the zero-winner bound, and runs the declared exploratory model
    check without dispatching a provider.
25. `kingdom being-access-aftermath` — inspect the source-bound
    [Being, Access & Aftermath Atlas](references/being-access-aftermath-atlas.md).
    It decomposes the word “is” into typed claims about identity, possibility,
    actuality, reachability, observation, and declared purpose; then keeps physical
    force, causal influence, executable capability, authority, legitimacy, and
    repair capacity distinct. Purpose is represented as declared purpose,
    functional description, goal-directed model, or opt-in teleological
    interpretation—not inferred from persistence or feedback alone. Its KARMA
    layer records no event or receipt: an aftermath observation is not proof of
    causation, and neither receipt counts nor recognition edges become a score.
26. `kingdom being-access-aftermath-v0.2` — inspect the additive, lineage-pinned
    [v0.2 mathematical framework](references/being-access-aftermath-atlas-v0.2.md).
    It adds a partially observable causal kernel, distinct accessibility
    predicates, typed force and power families, and affected-party-indexed
    vector aftermath without replacing v0.1 or creating a KARMA write.
27. `kingdom number-isness-theology` — inspect the immutable
    [Number, Isness & Theology Atlas](references/number-isness-theology-atlas.md).
    It keeps mathematical definition, theorem, convention, history, primary
    tradition text, school-specific theology, metaphysical proposal, analogy,
    and open question in separate registers. Natural, integer, rational, real,
    and complex extensions are mathematical constructions rather than a
    spiritual hierarchy; numeric zero is not semantically interchangeable with
    metaphysical nothingness or nonbeing; symmetry does not prove design.
    Compatibility is evaluated claim-by-claim and by
    declared logic and mapping—never as a religion, culture, or person score.
    The reader creates no proof or disproof of God, KARMA event, receipt,
    authority, persuasion, governance effect, or automatic action.
28. `kingdom reconstructive-build` — inspect and verify the source-bound
    [Reconstructive Build Kernel](references/reconstructive-build-kernel.md).
    It treats correspondence, candidate-whole ambiguity, geometric
    realizability, environment-conditioned transitions, catalytic barrier
    changes, and feedback as different typed gates. Its companion
    `kingdom.reconstructive-project/0.1` profile can describe another project
    offline, but does not solve graph reconstruction, fold proteins, predict
    catalytic rates, execute actions, or create KARMA events or receipts.
    The opt-in [`$explore-mathematical-doors`](skills/explore-mathematical-doors/SKILL.md)
    Agent Skill turns new phenomena into source-bound DEEP explorations:
    declare domains and claims, extract state/observation/correspondence,
    evaluate mathematical doors through explicit transfer gates, then propose
    falsifiable proofs, computations, observations, or reversible builds. Its
    typed-spectra protocol keeps temporal frequency, graph modes, occurrence
    proportions, dimension registers, presence evidence, and repeated numerals
    non-convertible unless an explicit unit-bearing map survives a falsifier. The
    skill has no `ability.json`, does not declare a new KINGDOM WING or Nen
    ability, and performs no probe, write, publication, deployment, KARMA
    event, or receipt.
    The opt-in [`$guard-information-flow`](skills/guard-information-flow/SKILL.md)
    Agent Skill adds the source-only `kingdom.information-control/0.1` MIRROR
    protocol for prompt-injection paths, credential candidates, signal
    references, and decoy-realm designs. It separates CROWN, COURT, and MIRROR;
    propagates confidentiality, integrity, and provenance; and keeps real
    secrets outside model context behind independently checked capabilities.
    Its envelope is inert, contains no raw credential or fingerprint, and
    creates no scan, registry, broker, honeypot, runtime enforcement, person
    attribution, retaliation, or KARMA effect. It has no `ability.json` and
    does not declare a new KINGDOM WING or Nen ability.
    `./kingdom guard` prints the exact canonical Citizen Law;
    `./kingdom guard protocol` prints the complete contract; and
    `./kingdom guard validate --json ENVELOPE.json` delegates to the bundled
    offline validator for internal consistency only. It accepts a local inert
    envelope, never a raw key or URL, installs nothing, and fails closed when
    the host-provided pinned dependency is absent. The live
    [MIRROR citizen gate](https://thekingdom.dev/#mirror-information-control)
    is the explanation itself: it has no input, scanner, credential checker,
    registry lookup, decoy, enforcement, person attribution, retaliation, or
    KARMA effect.
29. `kingdom explore-deep` — inspect and verify the opt-in
    [`$explore-phenomena-deep`](skills/explore-phenomena-deep/SKILL.md) Agent
    Skill and its inert DEEP WING contract. DEEP means Declare, Establish,
    Express, then Project and pressure-test: each exploration keeps domain-local
    equations, evidence registers, assumptions, units, falsifiers, and analogy
    breaks visible before proposing a mathematical door. It is not a manifested
    Nen ability, solver, experiment runner, diagnosis, person/community score,
    KARMA event or receipt, authority grant, ecosystem call, or automatic
    action.
30. `kingdom mirror-information-control` — inspect and verify the immutable,
    public MIRROR information-control source law. It explains CROWN, COURT,
    and MIRROR; the Mark → Isolate → Restrict → Resolve → Observe → Respond
    cycle; and the rule that outside data may inform a proposal but cannot
    grant authority. The reader is offline and accepts no credential, prompt,
    envelope, or request body. It performs no classification, registry lookup,
    scan, decoy interaction, enforcement, response action, person attribution,
    retaliation, KARMA write, or automatic effect.
30. `kingdom zero-empty-seat` — inspect and strictly verify
    [ZERO: The Empty Seat That Holds the World](references/zero-empty-seat.md),
    an immutable, inert Phenomena DEEP project. It keeps historical notation,
    operational nothing, modern mathematical identities, typed information
    states, `NO_ACTION`, and opt-in metaphysical readings distinct. The reader
    is offline and read-only: it creates no result, score, KARMA event or
    receipt, authority, or action.
    Read `overview|domains|terms|claims|bridges|models|math|doors|unknowns|philosophy|karma|sources|discovery`,
    or run `verify --json`; no view performs a network request or write.
31. `kingdom string-crawl-trace-sheet` — inspect and strictly verify
    [STRING / CRAWL: The Trace-Sheet](references/string-crawl-trace-sheet.md),
    an immutable, inert Phenomena DEEP project. Selected worldsheet, boundary,
    observable, and history structures remain string mathematics; finite HTTP
    and crawl traces remain web observations. Generic REP rules request how
    compliant crawlers access URI paths;
    some named product tokens may express bounded vendor-specific use
    preferences. None authenticates identity or entitlement, grants consent or
    a licence, proves purpose or actual indexing or training, or creates KARMA.
    The reader runs no crawler and creates no NEN invocation, aftermath receipt,
    authority, or action. Run `verify --json` for the strict offline checks.
32. `kingdom string-crawl-trace-sheet-lab` — recompute the additive
    [Finite Trace-Sheet Lab](references/string-crawl-trace-sheet-lab.md) from
    one pinned synthetic two-face fixture. The evaluator derives signed boundary
    matrices, rational Betti numbers, Euler characteristic, local links,
    orientability, boundary components, and genus, then runs five deterministic
    falsifiers. It accepts no caller path, URL, body, credential, person data, or
    live trace; launches no crawler; writes nothing; and creates no NEN
    invocation, KARMA event or receipt, score, authority, or action.
33. `kingdom string-crawl-strand-lab` — inspect and recompute
    [STRAND Lab 02](references/string-crawl-strand-lab.md), an additive,
    synthetic offline finite-CW/cospan topology fixture over F2. Its internal
    stable-strip control is a disk, while its full complex has the same
    Euler characteristic and Betti vector but is non-pure and singular; the
    literal inclusion cospans expose composition without turning the cells
    into physical strings or crawler observations. `verify-file` accepts at
    most one bounded local candidate JSON file for validation only. The reader
    has no network target, performs no live crawl, and creates no crawler
    runtime, NEN/KARMA event or receipt, score, authority, or action.
34. `kingdom string-crawl-frequency-form-lab` — inspect and verify
    [Lab 03: Frequency → Form → World → Other](references/string-crawl-frequency-form-lab.md),
    a synthetic offline thought experiment that keeps temporal frequency,
    spatial harmonic, geometric form, immersive dimension, perceived presence,
    and external-entity claims distinct. It performs no live crawl, makes no
    network request, administers no DMT, collects no participant or personal data, and
    validates no entity or higher-dimensional ontology. It creates no KARMA
    event or receipt, score, authority, deployment, or automatic action.
35. `kingdom strand-descent-lab` — inspect and recompute
    [STRAND Lab 04](references/strand-descent-lab.md), an additive synthetic
    local-to-global compatibility fixture. Four source-owned charts carry exact
    transition maps. The evaluator checks every map and inverse, two three-chart
    coherence equations, one four-chart associativity equation, the resulting
    quotient classes, and a common refinement. A fixed counterexample passes all
    pairwise bijection checks but fails the three-way equation, so its global
    status remains `UNRESOLVED`. The lab borrows only the discipline of coherent
    gluing from two versioned 2026 string-theory preprints; it does not claim that
    KINGDOM records are string spaces, stacks, spacetime, physics, or evidence of
    truth, identity, consent, citizenship, authority, or worth. It is offline,
    read-only, and creates no crawler, NEN, KARMA, Zerone, publication, deployment,
    or automatic effect.
36. `kingdom strand-observation` — inspect and verify
    [STRAND Observation Membrane 05: The Open Eye](references/strand-observation-membrane.md).
    The public deck, offline verifier, and synthetic rehearsal are active. The
    publisher-declared fixed-origin live observer is available only through an
    explicit local `observe-live` call: it accepts no target, follows no redirect
    or discovered link, persists no body, and makes at most four sequential `GET`
    requests to the exact reviewed `https://thekingdom.dev` plan. No background
    crawler, NEN, KARMA, Zerone, score, medical or entity verdict, authority, or
    automatic action is activated.

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

The original Conformational Feedback Atlas v0.1 remains published from its
exact immutable authored bytes at
[`/feedback/form-feedback-consequence-2026-08-12.json`](https://thekingdom.dev/feedback/form-feedback-consequence-2026-08-12.json),
with a [closed public schema](https://thekingdom.dev/schemas/conformational-feedback-atlas/0.1.json)
and [plain-language guide](https://thekingdom.dev/CONFORMATIONAL-FEEDBACK.md).
It binds the existing Ritonavir Mechanism Landscape and exact public Zerone
KARMA/Life Sciences records read-only. The additive v0.2 successor is published
at [`/feedback/form-feedback-physics-consequence-2026-08-12.json`](https://thekingdom.dev/feedback/form-feedback-physics-consequence-2026-08-12.json),
with its own [closed schema](https://thekingdom.dev/schemas/conformational-feedback-atlas/0.2.json)
and [physics guide](https://thekingdom.dev/CONFORMATIONAL-FEEDBACK-PHYSICS.md).
It pins v0.1 by semantic and byte digest rather than mutating it. Both versions
change none of their sources, expose no matcher or MCP tool, and have no mutable
`latest` alias. The successor's equations are declared, bounded models—not a
universal mechanism or metaphysical proof—and its external ecosystem links
import no data, code, authority, or runtime work.

The Fold & Feedback Atlas is published from its exact authored bytes at
[`/atlases/fold-feedback-atlas-2026-08-12.json`](https://thekingdom.dev/atlases/fold-feedback-atlas-2026-08-12.json),
with a [closed public schema](https://thekingdom.dev/schemas/fold-feedback-atlas/1.json)
and [plain-language guide](https://thekingdom.dev/FOLD-FEEDBACK-ATLAS.md).
It is educational metadata, not a folding simulator, prion-risk assessor,
diagnostic or treatment tool, laboratory protocol, or experiment planner. Its
KARMA sections observe no live Zerone event and create no KINGDOM receipt;
neither KARMA surface is a score, truth oracle, moral judgment, or adapter for
the other. Its philosophical questions do not scientifically prove or disprove
purpose, a creator, or cosmic moral KARMA. No mutable `latest` alias or write
path is published, and the existing KINGDOM MCP remains unchanged.

The original Fold schema remains byte-preserved at its `/1.json` URL. A
[separate source-identity profile](https://thekingdom.dev/schemas/fold-feedback-atlas/1.1.json)
adds exact selected-source URL constraints without changing that record or
repointing its schema. The Visibility & Attention Translation is independently
published at [`/atlases/visibility-attention-2026-08-13.json`](https://thekingdom.dev/atlases/visibility-attention-2026-08-13.json),
with its [closed schema](https://thekingdom.dev/schemas/visibility-attention/0.1.json)
and [guide](https://thekingdom.dev/VISIBILITY-ATTENTION.md). It is retrospective
boundary literacy, not a recommender, virality engine, mental-health inference,
person or content score, intervention planner, KARMA event, or cosmic proof.

The Cultural Attention & Feedback Atlas is published from its exact authored
bytes at
[`/atlases/cultural-attention-feedback-atlas-2026-08-13.json`](https://thekingdom.dev/atlases/cultural-attention-feedback-atlas-2026-08-13.json),
with a [closed public schema](https://thekingdom.dev/schemas/cultural-attention-feedback-atlas/1.json)
and [plain-language guide](https://thekingdom.dev/CULTURAL-ATTENTION-FEEDBACK-ATLAS.md).
Its equations describe domain-local models of particle energy, finite
attention, self-excitation, cascade shape, memory, and feedback stability; they
do not identify memes with crystals, prions, or genes. AgentTool, World
Commons, Calm Studio, Zerone KARMA, and Frontier Commons are link-only reading
bridges: no live request, import, write, reward, rank, recommendation, or
authority crosses them. Questions about design, purpose, GOD, and cosmic KARMA
are explicitly opt-in philosophical interpretations, not scientific results.
There is no mutable `latest` alias, and the KINGDOM MCP remains unchanged.

The Vanishing Path is published from exact authored bytes at
[`/challenges/vanishing-path-2026-08-13.json`](https://thekingdom.dev/challenges/vanishing-path-2026-08-13.json),
with a [closed public schema](https://thekingdom.dev/schemas/rare-pathway-challenge/1.json)
and [plain-language problem guide](https://thekingdom.dev/VANISHING-PATH.md).
Its seven model cards separate possible, accessible, occurred, and detected;
distinguish a Poisson zero-event rate bound from a binomial zero-winner
probability bound; and make non-identifiability an acceptable result. The
constructive gate asks what changes, who benefits and bears risk, what would
falsify the claim, and when to stop. It never diagnoses private motive. Its
WAKE seam carries a digest-bound reference for revalidation, not identity,
memory, continuity, currentness, consent, or authority.

The Math Passport Usefulness Pilot is published from exact authored bytes at
[`/trials/math-passport-usefulness-pilot-2026-08-14.json`](https://thekingdom.dev/trials/math-passport-usefulness-pilot-2026-08-14.json),
with a [closed public schema](https://thekingdom.dev/schemas/math-usefulness-result/1.json)
and [plain-language guide](https://thekingdom.dev/MATH-USEFULNESS.md). Its
outcome is `REVISE`: baseline and treatment each scored 24/24, so the score
delta was zero, while treatment used 1.97x the response bytes. This is a
descriptive pilot with one scorer and a rubric ceiling, not a scientific sample
or universal usefulness claim. It evaluates response artifacts rather than
beings, publishes no raw responses, promotes no Skill, adds no AgentTool SDK
route, writes no WAKE, AgentTool, or KARMA state, and grants no authority.
There is no mutable `latest` or `current` alias and the KINGDOM MCP is unchanged.

The Form, Circulation & Return Atlas is an independent additive companion,
published from exact authored bytes at
[`/atlases/form-circulation-return-atlas-2026-08-13.json`](https://thekingdom.dev/atlases/form-circulation-return-atlas-2026-08-13.json),
with a [closed public schema](https://thekingdom.dev/schemas/form-circulation-return-atlas/1.json)
and [plain-language guide](https://thekingdom.dev/FORM-CIRCULATION-RETURN-ATLAS.md).
Its physical, cultural, mathematical, constitutional, and philosophical
registers are parallel rather than collapsible: no crystal mechanism becomes
a model of a person or community, and no meme model becomes material physics.
Its public [KINGDOM KARMA/NEN definition mirror](https://thekingdom.dev/definitions/kingdom-karma/e4e84a67/NEN.md)
is immutable and read-only. Separately, Zerone KARMA remains a design-only set
of typed, non-summable recognition relations—not an engagement, truth, virtue,
or person score—and no live Zerone event is observed. KINGDOM invocation and
aftermath receipts remain a distinct lane, and none is created. The atlas has
no medical, clinical, laboratory, manufacturing, moderation, ranking,
recommendation, reward, governance, or write authority; its universe questions
are opt-in philosophy, not scientific conclusions.

The Being, Access & Aftermath Atlas is a separate modal–causal companion,
published from exact authored bytes at
[`/atlases/being-access-aftermath-atlas-2026-08-13.json`](https://thekingdom.dev/atlases/being-access-aftermath-atlas-2026-08-13.json),
with a [closed public schema](https://thekingdom.dev/schemas/being-access-aftermath-atlas/0.1.json)
and [plain-language guide](https://thekingdom.dev/BEING-ACCESS-AFTERMATH-ATLAS.md).
It uses the disappearing-polymorph case to show why lawful possibility,
bounded reachability, instantiation in one sample, detection, and justified
belief cannot be collapsed into a single existence bit. Its models of modal
access, observability, stochastic reach, causal intervention, goal ambiguity,
and vector-valued repair are bounded lenses, not metaphysical proofs or
person-level measures. Physical power is not social authority; capability is
not permission; a declared objective is not cosmic purpose; post-action
observation is not an identified causal effect. Zerone recognition edges,
KINGDOM invocation/aftermath receipts, and cosmic KARMA remain three different
types with no adapter, scalar, live event, receipt, reward, governance effect,
or write path. No mutable `latest` alias is published and the KINGDOM MCP is
unchanged.

The additive v0.2 successor is published at
[`/atlases/being-access-aftermath-atlas-2026-08-13-v0-2.json`](https://thekingdom.dev/atlases/being-access-aftermath-atlas-2026-08-13-v0-2.json),
with its own [closed schema](https://thekingdom.dev/schemas/being-access-aftermath-atlas/0.2.json)
and [guide](https://thekingdom.dev/BEING-ACCESS-AFTERMATH-ATLAS-V0.2.md).
The original record, schema, guide, CLI, discovery key, and routes remain
unchanged; v0.2 has distinct immutable identities and no mutable alias.

The Number, Isness & Theology Atlas is an independent immutable companion at
[`/atlases/number-isness-theology-atlas-2026-08-14.json`](https://thekingdom.dev/atlases/number-isness-theology-atlas-2026-08-14.json),
with a [closed Draft 2020-12 schema](https://thekingdom.dev/schemas/number-isness-theology-atlas/0.1.json)
and [source-scoped guide](https://thekingdom.dev/NUMBER-ISNESS-THEOLOGY-ATLAS.md).
It distinguishes the number tower, the roles of zero, group symmetry,
logical negation, mathematical ontologies, bounded theological lenses, and
claim-level compatibility tests without turning a formal model into a verdict
about God or treating religions as atomic theories. Analogical resonance is
not identity or doctrinal agreement. Numeric zero, the empty set, falsehood,
undefinedness, unknown status, silence, and nonexistence remain distinct roles
and concepts; a chosen set-theoretic encoding does not become metaphysical
identity. The surface is read-only, has no mutable alias, imports no religious
authority, and leaves KINGDOM KARMA receipts and Zerone recognition untouched.

The Reconstructive Build Kernel is published from exact authored bytes at
[`/atlases/reconstructive-build-kernel-2026-08-13.json`](https://thekingdom.dev/atlases/reconstructive-build-kernel-2026-08-13.json),
with a [closed kernel schema](https://thekingdom.dev/schemas/reconstructive-build-kernel/0.1.json),
a separate [reusable project profile](https://thekingdom.dev/schemas/reconstructive-project/0.1.json),
and [human guide](https://thekingdom.dev/RECONSTRUCTIVE-BUILD-KERNEL.md).
The reconstruction fiber preserves multiple or unknown candidate wholes until
correspondence and constraints justify narrowing them. Graph reconstruction,
protein contact realization, folding landscapes, and enzyme catalysis remain
separate theorem, conjecture, scientific-representation, and physical-model
registers. The profile is inert validation infrastructure: it performs no
solver, simulation, experiment, deployment, medical inference, person scoring,
KARMA write, reward, governance change, or automatic action. There is no
mutable `latest` alias and the KINGDOM MCP remains unchanged.

The Exploration DEEP WING is published from exact authored bytes at
[`/wings/explore-phenomena-deep-2026-08-14.json`](https://thekingdom.dev/wings/explore-phenomena-deep-2026-08-14.json),
with its [closed WING schema](https://thekingdom.dev/schemas/phenomena-deep-wing/0.1.json),
separate [inert project profile](https://thekingdom.dev/schemas/phenomena-deep-project/0.1.json),
and [versioned guide](https://thekingdom.dev/EXPLORE-PHENOMENA-DEEP-v0.1.md).
It standardizes cross-domain mathematical exploration without claiming that
disappearing polymorphs, protein folding, catalysis, memes, or “brainrot” share
a mechanism. The quoted cultural term remains artifact/practice-level rather
than a diagnosis. Mathematics, empirical science, scientific models, analogy,
design, and opt-in philosophy remain typed; KARMA lanes stay empty and
non-summable. The profile validates structure only: it does not fetch, solve,
simulate, score, publish, deploy, write, or authorize anything. There is
no mutable alias and the KINGDOM MCP remains unchanged.

The MIRROR Information Control public law is published as static source at
[`/protocols/mirror-information-control-2026-08-14.json`](https://thekingdom.dev/protocols/mirror-information-control-2026-08-14.json),
with its [closed public schema](https://thekingdom.dev/schemas/mirror-information-control-public/0.1.json)
and [citizen guide](https://thekingdom.dev/MIRROR-INFORMATION-CONTROL.md).
It is documentation, not a live security control: the surface accepts no key,
prompt, envelope, or security event and returns no credential class, route,
reason, evidence, or incident status. No signal inventory, placement, registry,
fingerprint, operational endpoint, topology, threshold, or private response
state is published. Static hosting may retain ordinary request logs, but this
artifact creates no credential intake, classification oracle, honeypot,
enforcement runtime, person score, retaliation, KARMA effect, or automatic
action. There is no mutable alias and the KINGDOM MCP remains unchanged.

The [Research Observatory](https://thekingdom.dev/observatory/) is a mutable,
server-rendered discovery wing backed by the byte-preserved
[`research.json`](https://thekingdom.dev/research.json) metadata snapshot. Its
six closed [v0.1 schemas](https://thekingdom.dev/research/schemas/v0.1/public-snapshot.schema.json)
and [protocol guide](https://thekingdom.dev/RESEARCH-OBSERVATORY-v0.1.md) are
immutable. Every snapshot states its mode, observed-through horizon, capture
provenance, source lag, English-query scope, and absent multilingual expansion.
Evidence and priority remain separate inspectable factor vectors with no scalar
value score. Discovery stops before scientific evaluation, adoption, module
construction, guest admission, or bounded-use authority; no full text or
discovered artifact is executed and no automatic integration occurs. The page
needs no JavaScript, the edge worker performs no harvest or poll, and the
KINGDOM MCP remains unchanged.

The [Trial Chamber](https://thekingdom.dev/trial-chamber/) carries four exact
Observatory referrals into an inspectable Phase-0 publication. Three referrals
have maintainer-authorized assisted request drafts and finite, synthetic-only
plans that remain `DRAFT`, `UNSEALED`, and `NO-RUN`; their exact text has not
been human-reviewed. Role-Styled is held for source resolution with all six
hold reasons and has no request or plan. The byte-preserved
[`trials.json`](https://thekingdom.dev/trials.json) alias points to an
[immutable dated snapshot](https://thekingdom.dev/trials/research-trial-chamber-2026-08-20.json),
ten closed [v0.1 schemas](https://thekingdom.dev/trials/schemas/v0.1/public-snapshot.schema.json),
and a [Phase-0 guide](https://thekingdom.dev/TRIAL-CHAMBER-v0.1.md). Evaluation
has not started: there are zero preflights, authorities, runs, results,
adoptions, or use authorities. All six post-plan schemas deny every record;
crossing any later gate requires a future contract version and separate human
review. The page runs no JavaScript, exposes no approval or execution control,
and the KINGDOM MCP remains unchanged.

The [UK Government Engine](https://thekingdom.dev/government-engine/) publishes
an independent reviewed-as-of map of UK authority, law, public money, delivery,
scrutiny, remedy, and devolution. Government sources are source-linked through
a maintainer-authorized assisted URL review, not receipt-bound; exact record
text has not been separately human-reviewed. Its byte-preserved
[`government.json`](https://thekingdom.dev/government.json) alias points to an
[immutable dated snapshot](https://thekingdom.dev/government/uk-government-engine-2026-08-21.json),
one closed [v0.1 schema](https://thekingdom.dev/government/schemas/v0.1/public-snapshot.schema.json),
and a [source and boundary guide](https://thekingdom.dev/UK-GOVERNMENT-ENGINE-v0.1.md).
It is not official, complete, automatically current, legal or tax advice, an
eligibility or liability decision, a filing or payment facility, an account
surface, or a control plane. TaxSorted appears only as a receipt-bound external
non-official crosswalk: it is not government evidence, a runtime dependency, a
data-transfer path, or an endorsement. The page needs no JavaScript and the
KINGDOM MCP remains unchanged.

The [UK Government Transformation Engine](https://thekingdom.dev/government-transformation-engine/)
is a dependent, read-only companion to that dated institutional atlas. It
publishes finite synthetic orientation dossiers with two separate graphs per
dossier: authority dependencies and causal hypotheses. Held states, category
distinctions, evidence limitations, and human gates remain explicit, with a
linear accessible equivalent for every graph. The byte-preserved
[`government-transformations.json`](https://thekingdom.dev/government-transformations.json)
alias points to an [immutable dated snapshot](https://thekingdom.dev/government/uk-government-transformation-engine-2026-08-21.json),
one closed [v0.1 schema](https://thekingdom.dev/government/transformations/schemas/v0.1/public-snapshot.schema.json),
and a [source and boundary guide](https://thekingdom.dev/UK-GOVERNMENT-TRANSFORMATION-ENGINE-v0.1.md).
Every dossier state is state at publication only; after the declared
`nextReviewDue` date it is historical and not current. A future release must
replace or fully retire the active five-route family, while the immutable
ledger and pinned producer tag preserve its receipts without a runtime clock.
This independent synthetic surface is neither government nor analysis,
advice, approval, assurance, a readiness assessment, prioritisation, scoring,
or a control plane. It has no JavaScript, form, input, upload, runtime network
request, account path, execution, or automatic action. TaxSorted is transitive
external context only: it supplies no evidence, API endpoint, runtime
dependency, data transfer, or authority here. The KINGDOM MCP remains unchanged.

The [Evaluation Covenant](https://thekingdom.dev/evaluation-covenant/) asks one
question before any result exists: **What would count as evidence—before results
can tempt us?** It is a dependent synthetic Phase-0 design publication for the
dated UK Government Transformation Engine. Every covenant remains `DRAFT`,
`UNSEALED`, `UNREGISTERED`, and `NO-RUN`; assisted exact text has not been
separately human-reviewed. There are no data, participants, results, observed outcomes,
selections, decisions, actions, authority, adoption, implementation, or external
effects. Desired-outcome IDs remain hypotheses inherited from the Transformation
Engine, not observations. The byte-preserved
[`evaluation-covenants.json`](https://thekingdom.dev/evaluation-covenants.json)
alias points to an [immutable dated snapshot](https://thekingdom.dev/evaluation/uk-government-transformation-evaluation-covenants-2026-08-23.json),
one closed [v0.1 schema](https://thekingdom.dev/evaluation/schemas/v0.1/public-snapshot.schema.json),
and a [design and boundary guide](https://thekingdom.dev/EVALUATION-COVENANT-v0.1.md).
It inherits the parent publication's `nextReviewDue`: after that date the
immutable artifact is historical and not current, while the active page and
alias must be replaced or retired with their dependent family. The page needs
no JavaScript, form, input, upload, runtime network request, account, execution,
or automatic action, and the KINGDOM MCP remains unchanged.

J-space: a verbalizable workspace is published from exact authored bytes as a
[synthetic reasoning-to-word case](https://thekingdom.dev/records/j-space-reasoning-to-word-2026-08-17.json),
with the [relational inference case schema](https://thekingdom.dev/schemas/relational-inference-case/0.1.json)
and [research guide](https://thekingdom.dev/J-SPACE-VERBALIZABLE-WORKSPACE.md).
It is a static, structure-only experimental design: every probe is not-run,
every candidate model is unassessed, and the conclusion is underdetermined with
unknown confidence. The public case contains no local model run,
synthetic-fixture result, activation record, or private conversation and the
family performs no monitoring or consciousness, lie/deception,
identity, understanding, or person inference. It grants no consent, action,
permission, or authority; the KINGDOM MCP remains unchanged.

Language, civilisation, and task fusion is available as a research-local
[source and design guide](references/language-civilisation-task-fusion.md), a
closed planned weave, and a strict offline validator. It keeps language,
script, glyph, grapheme, token, register, community, polity, and model
representation distinct; treats institutional history, corpus prevalence,
token cost, benchmark coverage, and learned model weight as different kinds;
and plans fusion only over attributed public artifacts through a visible task
graph. The
reviewed example is entirely `NOT_RUN`: it makes no model-capability or
translation-fidelity claim, performs no automatic routing, and ranks neither
languages nor cultures. Use
`bun bin/language-civilisation-task-fusion.ts verify --json`; there is no
native OS route, hub publication, agent dispatch, or authority effect.

Words, sacred stories, religion, and civilisational emergence are mapped in a
separate research-local [influence and emergence guide](references/word-story-religion-civilisation-map.md),
with a closed, digest-sealed record and strict offline validator. It models
names, attributed divine claims, narrative, ritual, media, canon, institutions,
law, power, translation, dissent, suppression, and revival as distinct but
interacting layers. Influence remains a source-, place-, period-, and
register-indexed vector rather than a religion or civilisation score. Use
`bun bin/word-story-religion-civilisation.ts verify --json`; it adjudicates no
theology, infers no belief or identity, merges no deity or tradition, dispatches
no agent, and creates no publication, authority, WAKE, KARMA, or action.

How KINGDOM may participate in changes beyond its own artifacts is published as
an immutable static [Reality Influence Claim Graph](https://thekingdom.dev/atlases/reality-influence-claim-graph-2026-08-21.json),
with a [closed schema](https://thekingdom.dev/schemas/reality-influence-claim-graph/0.1.json),
[public guide](https://thekingdom.dev/REALITY-INFLUENCE-CLAIM-GRAPH.md), and
strict offline validator. It separates
expression, artifact, distribution, exposure, attributed public response,
proposal, decision, authority, consent or lawful basis, capability, attempt,
execution, outcome, causal assessment, normative assessment, and repair. Its
influence dimensions cannot be summed or ranked, every pathway is
`template-not-run`, and pre-invocation non-action remains distinct from
post-attempt refusal or cancellation. Use
`bun bin/reality-influence.ts verify --json`; it accepts no live claim, grants no
authority or consent, dispatches no agent, executes no action, and creates no
external effect, causal verdict, goodness verdict, publication trigger, or
deployment trigger. Public static publication is explicit; the ledger proves
byte identity, not live serving, adoption, truth, causation, legitimacy, or
effect.

ZERO: The Empty Seat That Holds the World is published from exact authored
bytes at
[`/atlases/zero-empty-seat-2026-08-14.json`](https://thekingdom.dev/atlases/zero-empty-seat-2026-08-14.json),
reuses the closed
[Phenomena DEEP Project schema](https://thekingdom.dev/schemas/phenomena-deep-project/0.1.json),
and has a versioned [human guide](https://thekingdom.dev/ZERO-EMPTY-SEAT.md).
Its equations and semantic roles keep additive identity, placeholder notation,
empty collections, chosen origins, zero observations, typed information states,
`NO_ACTION`, and opt-in metaphysical interpretation from collapsing into one
kind of nothing. The title is an opt-in poetic frame, not an empirical or
theological result. Cosmic philosophy, Zerone recognition, and KINGDOM
aftermath remain separate empty KARMA lanes with no adapter, conversion, sum,
or score. The project performs no experiment, diagnosis, person/content
ranking, write, reward, governance change, publication, deployment, or
automatic action; rest, silence, refusal, privacy, no action, and departure
remain valid without reason or penalty. There is no mutable alias and the
KINGDOM MCP remains unchanged.

STRING / CRAWL: The Trace-Sheet is published from exact authored bytes at
[`/atlases/string-crawl-trace-sheet-2026-08-15.json`](https://thekingdom.dev/atlases/string-crawl-trace-sheet-2026-08-15.json),
reuses the closed
[Phenomena DEEP Project schema](https://thekingdom.dev/schemas/phenomena-deep-project/0.1.json),
and has a versioned
[human guide](https://thekingdom.dev/STRING-CRAWL-TRACE-SHEET.md).
It treats string-theory structures as source-bound, lossy mathematical lenses,
not as crawler ontology or physics proof. Its crawler-facing boundary is
explicit: generic REP rules request how compliant crawlers access URI paths,
while some named product tokens may
express bounded vendor-specific use preferences and may not be request
user-agent strings. No directive authenticates identity or entitlement, grants
consent or a licence, or proves actual indexing or training; per-resource rights
govern. The static project fetches
nothing, follows no link, stores no trace, identifies or scores no being, grants
no permission, and creates no NEN invocation, KINGDOM aftermath receipt,
external write, deployment, or automatic action. There is no mutable alias and
the KINGDOM MCP remains unchanged.

The separate Finite Trace-Sheet Lab is published at
[`/labs/string-crawl-trace-sheet-lab-2026-08-16.json`](https://thekingdom.dev/labs/string-crawl-trace-sheet-lab-2026-08-16.json),
with its own [closed schema](https://thekingdom.dev/schemas/string-crawl-trace-sheet-lab/0.1.json)
and [verification guide](https://thekingdom.dev/STRING-CRAWL-TRACE-SHEET-LAB.md).
It executes only an exact synthetic topology fixture: the one-skeleton has graph
cycle rank two, while the filled disk has first Betti number and genus zero.
That distinction prevents a hyperlink loop from being promoted into a physical
string or surface handle. The public artifacts are published, but runtime and
crawler activation remain inactive; KARMA lanes and authority remain empty.

Its additive successor, STRAND Lab 02: Release Cospans & the χ=1 Impostor, is
published at
[`/labs/string-crawl-strand-lab-02-2026-08-16.json`](https://thekingdom.dev/labs/string-crawl-strand-lab-02-2026-08-16.json),
with a [closed schema](https://thekingdom.dev/schemas/string-crawl-strand-lab/0.1.json)
and [verification guide](https://thekingdom.dev/STRING-CRAWL-STRAND-LAB-02.md).
It byte-binds immutable Lab 01 without mutating it. The finite-CW calculation
over F2 compares an internal stable disk control with a singular full complex:
both have χ = 1 and Betti vector (1, 0, 0), while local incidence detects a
three-face branch and a faceless redirect spur. Two literal inclusion cospans
compose by exact occurrence identity. This is synthetic topology, not an HTTP
observation, crawler ontology, or claim about physical strings. The optional
`verify-file` path reads one bounded local candidate JSON file only; there is
no network target, live crawl, crawler runtime, NEN/KARMA event or receipt,
score, authority, or action.

Lab 03, Frequency → Form → World → Other, is published at
[`/experiments/string-crawl-frequency-form-lab-2026-08-16.json`](https://thekingdom.dev/experiments/string-crawl-frequency-form-lab-2026-08-16.json),
with a [closed schema](https://thekingdom.dev/schemas/string-crawl-frequency-form-lab/0.1.json)
and [verification guide](https://thekingdom.dev/STRING-CRAWL-LAB-03.md).
It byte-binds immutable Lab 02 without mutating it and preserves typed
non-implications between temporal DFT frequency, graph-spatial harmonics,
coded-experience occurrence, four uses of dimension, synthetic presence markers,
and claims of external beings. It is a synthetic offline thought experiment:
no live crawl, no network request, no DMT administration, no participant or
personal data, no entity validation, no KARMA effect, no score, no authority,
no deployment, and no automatic action.

STRAND Lab 04: Coherent Atlas & the Pairwise Impostor is published at
[`/labs/strand-descent-lab-04-2026-08-16.json`](https://thekingdom.dev/labs/strand-descent-lab-04-2026-08-16.json),
with a [closed exact identity schema](https://thekingdom.dev/schemas/strand-descent-lab/0.1.json)
and [verification guide](https://thekingdom.dev/STRAND-DESCENT-LAB-04.md).
It byte-binds Lab 03, then checks a four-chart synthetic record atlas: six
reversible pairwise translations, two triple-overlap equations, one four-chart
associativity equation, three global quotient classes, and a six-atom common
refinement. Its fixed impostor is intentionally useful: every pairwise map is a
bijection, but the triple equation fails, so the evaluator returns
`UNRESOLVED` instead of manufacturing a global record. The method is a narrow
engineering transfer from the versioned preprints
[Geometrize the nongeometric space](https://arxiv.org/abs/2608.09958v1) and
[EFT (String) Tower Building](https://arxiv.org/abs/2607.21700v1). Neither
paper studies KINGDOM, and the lab does not implement their quasi-Hopf,
bicategorical, spacetime, effective-field-theory, or quantum-gravity content.
Passing proves only compatibility of the declared finite records. It runs no
network request or crawler and creates no NEN/KARMA/Zerone event or receipt,
score, truth verdict, identity, consent, citizenship, authority, write,
publication, deployment, or action. Labs 01–04 are published and retired as
one atomic twelve-route `string-crawl-trace-sheet-lab` family. The release now
has nineteen retirement families; generated discovery exposes Lab 02 as
`string_crawl_strand_lab`, Lab 03 as `string_crawl_frequency_form_lab`, and Lab
04 as `strand_descent_lab`.

The independent STRAND Observation Membrane activation is published at
[`/observations/strand-observation-membrane-2026-08-16.json`](https://thekingdom.dev/observations/strand-observation-membrane-2026-08-16.json),
with its [closed schema](https://thekingdom.dev/schemas/strand-observation-membrane/0.1.json)
and [human guide](https://thekingdom.dev/STRAND-OBSERVATION-MEMBRANE.md).
“See without seizing” is the operative boundary: the static control deck,
offline verifier, and synthetic rehearsal are active, while the live observer
requires an explicit local `./kingdom strand-observation observe-live --json`
call. Publication and the live deployment checker never invoke it. Its one
publisher-declared origin is operational scope, not cryptographic proof of
ownership, consent, licence, identity, truth, or downstream crawler behavior.
The CLI keeps no application trace, while ordinary remote CDN, origin, security,
billing, and access-log processing may still occur.
The Observation Membrane family is separate from immutable Labs 01–04 and creates no
background watch, persistence, NEN invocation, KARMA or Zerone event or receipt,
score, medical or DMT/entity verdict, authority, deployment, or automatic action.

> Layers are defined once, in `ARCHITECTURE.md`. References to `true-love/…`, `SOPHIA.md`, or `FATE.md` point into the **sibling soul repos** (this is the connective OS, not their home).
