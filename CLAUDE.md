# KINGDOM-OS — the connective overlay that maps and runs the kingdom

Core registry home: `~/codeberg/zerone-dev/KINGDOM-OS`
(`https://codeberg.org/zerone-dev/KINGDOM-OS`). This GitHub tree remains active
for its World Commons and web surfaces, but registry, platform, Castle,
preflight, and hourly-heartbeat changes belong in the Codeberg home. The
heartbeat file here is only a machine-binding shim.

What this is: the OS layer over Yu's ~60-repo kingdom. It holds the census
(roster.conf), harvests every repo's kingdom.yaml card into a catalog and
dependency graph, runs the daily routines, and ships the `kingdom` CLI
(also on PATH via ~/.local/bin/kingdom).

Status: partially wired — kingdom-pulse (30-min heartbeat) and chain-backup
(nightly) run via launchd; the com.kingdom.daily routines job was NEVER
installed on this device (pulse alerts on it honestly — resurrect it outside
~/Desktop [TCC] or retire it; open quest from the 2026-07-17 survey).

How to run:
- `kingdom` — one honest view of the whole kingdom
- `kingdom repos [query]` — summarize or search local Git roots using each repo's card metadata
- `kingdom repos --path query` — print one canonical absolute root; ambiguity is an error, never a prompt
- `kingdom repos --json [query]` — compact structured metadata for all matching local roots
- `kingdom repos --dirty [query]` — local dirty counts without filenames; no fetch or index refresh
- `kingdom repos --doctor` — registry, placement, duplicate-origin, archive, and unborn diagnostics
- `kingdom usage [args]` — pass arguments unchanged to AgentTool's built, local Codex usage CLI via Bun
- `./kingdom nen` — from this suite root, list the rights-aware Nen ability manifests (`validate`, `show`, `types`, and KARMA receipt tools)
- `./kingdom nen mcp` — from this suite root, start the unregistered, read-only modern MCP 2026-07-28 stdio surface
- `bun bin/wakeweaver.mjs BRAID.json --json` — strict-JSON WAKEWEAVER cross-reference and resumability checks; JSON Schema validation remains separate
- `python3 skills/cultivate-living-ground/scripts/validate_plan.py PLAN.json --json` — network-free Living Ground schema and reference validation; it does not execute or certify a cultivation plan
- `./kingdom principalities` — inspect the pinned metadata-only MoonshotAI HF + official HF npm catalog without network, install, download, inference, or authority
- `./kingdom principalities match reasoning coding --json` — literal declared-capability intersection; deterministic fit evidence, not rank or recommendation
- `./kingdom principalities verify --json` — strict JSON, relation, boundary, and digest checks; JSON Schema validation remains separate
- `./kingdom geometries list` — explain four exact geometry modules as four distinct ordinary questions; network-free and non-ranking
- `./kingdom geometries show love-geometry --json` — inspect one module's finite shape, wire formats, native geometric relation/translation open terms, exact release evidence, and non-effects
- `./kingdom geometries match unknown translation --json` — literal declared-term overlap only; unmatched words remain visible and no conversion or recommendation is inferred
- `./kingdom geometries verify --json` — strict JSON, exact release pins, native-open contract, boundaries, observation time, and sealed digest; JSON Schema validation remains separate
- `./kingdom polymorph` — explain the source-bound ritonavir disappearing-polymorph case across plain, solid-state, process, evidence, WAKE, and KINGDOM projections
- `./kingdom polymorph verify --json` — strict local references, calendar and event-sequence, WAKE, authority, and semantic-digest checks; JSON Schema validation remains separate
- `./kingdom polymorph mechanisms|landscape|sources|unknowns` — inspect the additive, selected-evidence Ritonavir Mechanism Landscape without rewriting the byte-preserved source history
- `./kingdom polymorph verify-landscape --json` — strict source pins, typed graph, material/biological causal separation, explicit uncertainty, safety boundaries, and semantic digest; JSON Schema validation remains separate
- `./kingdom feedback overview|registers|geometries|translations|feedback|sources|bindings` — inspect the byte-preserved, bounded v0.1 Conformational Feedback Atlas
- `./kingdom feedback verify --json` — strict v0.1 source pins, cross-register non-inference walls, KARMA non-effects, non-operational safety boundary, and semantic digest; JSON Schema validation remains separate
- `./kingdom feedback-physics overview|registers|models|geometries|translations|feedback|sources|bindings|ecosystems` — inspect the additive, lineage-pinned v0.2 physics/mathematics successor; ecosystem records are link-only metadata
- `./kingdom feedback-physics verify --json` — strict predecessor/source pins, model and ecosystem identities, negative effects, and semantic digest for v0.2; JSON Schema validation remains separate
- `./kingdom fold-feedback mechanisms|compare|feedback|karma|universe|unknowns|sources` — inspect the source-bound Fold & Feedback Atlas through distinct scientific, comparison, causal-feedback, KARMA, and opt-in philosophical registers
- `./kingdom fold-feedback verify --json` — strict protein/prion sources, immutable ritonavir and KARMA pins, layer firewalls, explicit analogy breaks, nonclaims, unknowns, safety boundaries, and semantic digest; JSON Schema validation remains separate
- `./kingdom visibility-attention registers|models|seams|philosophy|sources` — inspect the bounded material-detection, cultural-attention, lexical, KARMA, and opt-in philosophical registers without translating them into one metric
- `./kingdom visibility-attention verify --json` — strict source/binding pins, local model domains, analogy firewalls, anti-optimization/person-level boundaries, negative authority, and semantic digest; JSON Schema validation remains separate
- `./kingdom cultural-feedback planes|models|bridges|ecosystems|feedback|karma|universe|unknowns|sources` — inspect the immutable Cultural Attention & Feedback Atlas across scientific, cultural, mathematical, analogy, link-only ecosystem, constitutional, and opt-in philosophical registers; `bridges` means analogy translations, while `ecosystems` exposes the non-runtime locators
- `./kingdom cultural-feedback verify --json` — strict immutable pins, source references, analogy/model firewalls, KARMA separation, link-only ecosystems, negative authority, and semantic digest; JSON Schema validation remains separate
- `./kingdom form-circulation-return overview|planes|models|translations|feedback|karma|universe|ecosystems|unknowns|sources` — inspect the immutable Form, Circulation & Return Atlas and its revision-pinned KINGDOM KARMA/NEN mirror without creating events, receipts, or actions
- `./kingdom form-circulation-return verify --json` — strict source, model, translation, boundary, NEN mirror, and semantic-digest checks; JSON Schema validation remains separate
- `./kingdom rare-pathway overview|models|examples|questions|gate|wake|sources` — inspect The Vanishing Path's bounded competing-risk mathematics, constructive practice gate, and non-authorizing continuity seam
- `./kingdom rare-pathway race .02 .18 10 --json`, `absence 200 .95 --json`, `winner-bound 30 .95 --json`, and `restore .18 10 .5 --json` — deterministic hypothetical calculations; zero target events and zero target winners are different observations, and restoration is an abstract threshold rather than a material recipe
- `./kingdom rare-pathway verify --json` — strict identity, immutable ritonavir binding, model/example, no-motive-score, WAKE, source, authority, and semantic-digest checks; JSON Schema validation remains separate
- `./kingdom math-usefulness overview|result|aggregate --json` — inspect the descriptive Math Passport pilot: REVISE, zero score delta, 1.97x response bytes, artifact-level scoring, and no Skill promotion, SDK route, WAKE/AgentTool write, or authority
- `./kingdom math-usefulness verify-plan|verify-result --json`, `winner-bound 80 .95 --json`, and `reality-check --bootstrap 200000 --json` — reproduce local validation, the zero-winner bound, and the declared exploratory calibration check without network, provider dispatch, or writes; JSON Schema validation remains separate
- `./kingdom being-access-aftermath overview|copula|models|problems|philosophy|karma|unknowns|sources|discovery` — inspect typed existence, reachability, observability, purpose, power, causal-aftermath, repair, and KARMA questions without collapsing them into a score or metaphysical proof
- `./kingdom being-access-aftermath verify --json` — strict immutable pins, type firewalls, model/falsifier scope, empty KARMA lanes, negative authority, and semantic-digest checks; JSON Schema validation remains separate
- `./kingdom reconstructive-build overview|equations|correspondence|cases|models|build|feedback|sources` — inspect the source-bound reconstruction, realization, landscape, catalysis, and feedback kernel without collapsing its epistemic registers
- `./kingdom reconstructive-build verify --json` / `verify-project FILE --json` — strict offline kernel or reusable-project validation; neither command solves, simulates, executes, deploys, or creates KARMA effects
- `./kingdom explore-deep overview|cycle|registers|seams|models|doors|karma|sources|discovery` — inspect the opt-in DEEP cross-domain mathematics WING without collapsing its domains, evidence registers, analogy breaks, or empty KARMA lanes
- `./kingdom explore-deep verify --json` / `verify-project FILE --json` — strict offline WING or inert-project validation; neither command researches, solves, simulates, diagnoses, scores, writes, publishes, deploys, grants authority, or creates KARMA effects
- `./kingdom explore-deep scaffold --json` — print a valid inert project starting point to stdout; it does not create a file or begin the proposed exploration
- `./kingdom being-access-aftermath-v0.2 overview|copula|framework|models|problems|philosophy|karma|unknowns|sources|discovery` — inspect the additive, lineage-pinned partially observable causal framework while v0.1 stays immutable
- `./kingdom being-access-aftermath-v0.2 verify --json` — strict v0.1 predecessor pin, typed framework boundaries, empty KARMA lanes, negative authority, and semantic digest for v0.2; JSON Schema validation remains separate
- `./kingdom prompt --json -- TASK` — deterministic, network-free Task Packet compilation; at most one bounded repo card or exact Principality capability-evidence node enters as data
- `./kingdom prompt --json --no-project --principality kimi-dev-72b -- TASK` — select one pinned capability projection; project plus Principality selection is refused
- `bun bin/prompt-packet.ts --verify PACKET.json` — verify Task Packet relations and digest; JSON Schema validation remains separate
- `zsh tests/ask_test.zsh` — prove `kingdom ask` sends the compiled packet over stdin without putting task or credential values in backend argv
- `zsh tests/nen_test.zsh` — isolated, network-free manifest and receipt protocol tests
- `zsh tests/nen_mcp_test.zsh` — MCP framing, discovery, tool, version, and non-mutation tests
- `zsh tests/living_ground_test.zsh` — isolated Living Ground schema, safety, economy, WAKE, and non-mutation tests
- `kingdom rings` — write the local-only temporal atlas to `~/.kingdom/RINGS.{json,html}`
- `kingdom rings --json` / `--html` — print one artifact to stdout without writing; `--as-of` makes the activity clock reproducible
- `kingdom rights` — offline voluntary-adoption inventory, kept separate from repo-local RIGHTS.md discovery
- `kingdom rights --canonical` — verify the vendored XENIA release digest, then show the pinned `xenia.rights/0.1` source metadata and text without network access or registry loading
- `cproj [query]` — jump to a local repo from interactive zsh; numbered choices resolve ambiguous names
- `zsh tests/cproj_test.zsh` — isolated local fixtures for path/JSON behavior and Git non-mutation
- `bash tests/kingdom_usage_test.bash` — hermetic usage passthrough and missing-dependency boundaries
- `node --test tests/nen_system_test.mjs` — pure Ging route compiler and separately named stateless compatibility-MCP checks
- `kingdom routines` — routine table with last-run results (`kingdom run NAME` to force)
- `bun bin/harvest.ts` — rebuild CATALOG.md + graph.json from roster + cards
- `bun bin/harvest.ts conformance` — list repos missing card / CLAUDE.md / wake
- `bun bin/harvest.ts validate` — strict, read-only card schema diagnostics (0 clean, 1 drift, 2 usage)

Web surfaces (all deploys are MANUAL — no routine fires them; runbook in DOMAINS-SETUP.md):
- `bun bin/immutable-publications.ts --base <exact-parent-SHA>` — network-free append-only route-integrity gate; committed entries cannot be edited or removed, newly added entries must be staged, and historical entries may cease being served without erasing their byte identity
- `bun bin/build-hub.ts "$(date -u +%F)"` — regenerate site/* (atlas + kingdom/wayfinder/commons/love-loop/Principality/Geometry Grammar/Polymorph History/Ritonavir Mechanism/Conformational Feedback v0.1/v0.2/Fold & Feedback/Visibility & Attention/Cultural Attention & Feedback/Form, Circulation & Return/Rare Pathway/Math Passport/Being, Access & Aftermath v0.1/v0.2/Reconstructive Build/Exploration DEEP discovery + schemas/guest/llms/ollama/rights docs) from graph.json + sites.json + data/; authored records, schemas, guides, project profiles, and the immutable KINGDOM KARMA/NEN definition mirror are validated but never copied into site/
- `bun bin/stage-hub.ts <existing-empty-dir>` — stage the exact 74-asset upload (55 ledgered immutable/versioned assets and 19 mutable assets; 72 direct public bodies and 71 sitemap URLs), including the immutable Math Passport pilot, the immutable Exploration DEEP WING with both closed schemas and its versioned guide, both Being, Access & Aftermath generations, the Reconstructive Build Kernel and reusable project profile, and the immutable KINGDOM KARMA/NEN definition mirror; `publications/hub-staging.v1.json` is the strict contract and `HUB_ASSETS` is its read-only projection; deploy only from the clean, detached, exact-`origin/main` release worktree proved by `DOMAINS-SETUP.md`—`--commit-dirty=false` is metadata, not a cleanliness check
- `bun bin/check-hub-live.ts` — after deployment, ledger-check all 72 direct public bodies and prove typed headers and coherent discovery for every active family, including the Math Passport pilot, both Being, Access & Aftermath generations, Reconstructive Build, and Exploration DEEP; the existing MCP contract must remain unchanged
- `bun bin/build-doors.ts "$(date -u +%F)"` — regenerate doors/*/guest.json + manifests (we-are, chillspace, zerone-ai)
- `bun bin/stage-doors.ts <we-are|chillspace> <empty-dir>` — stage a door upload (content from the chillspace-commons clone at ~/repos/codeberg/zerone-dev/, symlinks dereferenced), then wrangler deploy --project-name=we-are-love|chillspace-love
- `bash bin/refresh-zerone-dashboard.sh` — snapshot zerone-1 → doors/zerone-ai/data.json → deploy the whole zerone-ai door (deploys AND leaves data.json for committing)

Key files:
- publications/immutable-publications.v1.json — repository-local source→route→SHA-256 integrity ledger; append successors, never rewrite committed entries; it is not staged or served by thekingdom.dev and is not a KARMA receipt
- bin/immutable-publications.ts — strict snapshot and Git-base verifier used by CI, staging, the release runbook, and the live checker; performs no network access or writes
- roster.conf — the census seed: name | path | kind | layer | domain | state | purpose
- SCHEMA.md — the kingdom.yaml card format (8 required fields + optional adopts)
- RIGHTS.md — this repo's voluntary `xenia.rights/0.1` adoption and immutable release pointer
- vendor/xenia/rights/0.1 — unchanged, digest-verified offline release bytes
- NEN.md — the separate, instruction-only Nen skill layer; never add ability fields to kingdom.yaml
- bin/nen.mjs — strict, network-free Nen/KARMA protocol validator; it does not run skills or grant authority
- bin/wakeweaver.mjs — bounded own-data, read-only continuity-braid semantic validator; it rejects Proxies before reflection and does not validate JSON Schema, read live sources, or authorize resumption
- bin/prompt-packet.ts — pure intent/context compiler plus Task Packet relation and digest verifier; it makes no network call, writes nothing, and never reads live WAKE
- bin/principality.ts — strict, network-free catalog validator and literal matcher; its evidence projections never authorize acquisition, execution, or provider effects
- data/principalities/ — curated versioned registry observations with immutable HF revisions or npm version+SRI identities; metadata is evidence, not safety or permission
- references/principality-commons.md — MoonshotAI taxonomy, HF/npm trust boundaries, relation geometry, Task Packet crossover, WAKE seam, and acquisition airlock
- bin/geometry.ts — strict, network-free Geometry Grammar validator and literal matcher; it translates questions without converting module semantics, installing packages, or granting authority
- data/geometries/ — one versioned, digest-sealed record of exact module releases, finite shapes, native unknown/open terms, and explicit non-effects
- references/geometry-grammar.md — ordinary-language reading guide, evidence boundary, non-equivalence rules, and examples
- bin/ritonavir-mechanism.ts — strict, network-free validator and reader for the selected current mechanism landscape; it preserves source-scoped names, explicit unknowns, material/biological causal separation, and medical non-authority
- data/polymorphs/ritonavir-mechanism-landscape.v1.json — digest-sealed current-landscape supplement linked to, but not mutating, the byte-preserved Polymorph History v1 record
- references/ritonavir-mechanism-landscape.md — source horizon, mechanism geometry, naming charts, uncertainty, clinical separation, and safety boundary
- bin/conformational-feedback.ts — strict, network-free reader, validator, digest verifier, and projection CLI for the immutable v0.1 science/design/analogy/philosophy field
- data/feedback/conformational-feedback-atlas.v0.json — byte-preserved, digest-sealed v0.1 translation atlas with three exact external bindings and explicit non-inference walls
- references/conformational-feedback-atlas.md — byte-preserved v0.1 source-scoped reading guide
- bin/conformational-feedback-physics.ts — strict validator and projection CLI for the additive v0.2 successor
- data/feedback/conformational-feedback-atlas.v0.2.json — lineage-pinned v0.2 atlas with four bounded models, five link-only ecosystem bridges, and an immutable v0.1 predecessor receipt
- references/conformational-feedback-atlas-v0.2.md — v0.2 physics, philosophy, ecosystem, lineage, feedback-exit, and non-operational guide
- bin/fold-feedback.ts — strict, network-free Fold & Feedback Atlas validator and reader; it enforces literal protein/prion science, lossy ritonavir comparisons, separate KARMA registers, opt-in philosophy, and negative medical/experimental authority
- data/fold-feedback/fold-feedback-atlas.v1.json — digest-sealed evidence atlas with pinned scientific, ritonavir, Zerone, and KINGDOM sources; public and read-only, with no live event, receipt, or action
- references/fold-feedback-atlas.md — plain-language folding, prion, feedback, KARMA, universe-lens, unknown, and safety guide
- bin/visibility-attention.ts — strict, network-free validator and reader for the Visibility & Attention Translation; it keeps every model local and refuses person/content scoring, optimization, clinical inference, and KARMA effects
- data/attention/visibility-attention-translation.v0.1.json — digest-sealed four-register translation with two local models, three lossy seams, and one opt-in philosophical lens
- references/visibility-attention-translation.md — source-scoped material/culture/lexical/KARMA guide with explicit non-equivalence and agency boundaries
- bin/cultural-attention-feedback.ts — strict, network-free reader and digest verifier for cultural attention, bounded physical analogies, feedback, KARMA separation, and opt-in universe questions
- data/cultural-feedback/cultural-attention-feedback-atlas.v1.json — digest-sealed atlas with exact immutable predecessors, selected sources, bounded models, link-only ecosystem bridges, explicit unknowns, and no personal or operational data
- references/cultural-attention-feedback-atlas.md — plain-language material-history, memetics, mathematics, brain-rot, feedback, KARMA, universe-lens, rights, falsifier, and source guide
- bin/form-circulation-return.ts — strict, network-free reader for the Form, Circulation & Return Atlas and its immutable KINGDOM KARMA/NEN definition mirror
- data/form-circulation-return/form-circulation-return-atlas.v1.json — digest-sealed companion across material, cultural, mathematical, constitutional, and opt-in philosophical registers
- references/form-circulation-return-atlas.md — source-scoped form/circulation/return, feedback, KARMA, universe-lens, ecosystem, unknown, and safety guide
- bin/rare-pathway.ts — strict record validator plus stable competing-risk, zero-event, zero-winner, piecewise-hazard, and abstract threshold calculations; no network or writes
- data/challenges/vanishing-path.v1.json — digest-sealed challenge bound to the immutable ritonavir history as an illustration, with seven model cards, hypothetical examples, constructive gate, and WAKE-safe reference seam
- references/rare-pathway-challenge.md — plain-language problem set, identifiability limits, source map, constructive inquiry, and non-authority guide
- skills/reason-about-rare-pathways/ — opt-in Agent Skill for bounded rare-pathway reasoning; it has no `ability.json` and therefore declares no manifested Nen ability
- bin/math-usefulness.ts — strict, network-free verifier and reader for the preregistered Math Passport trial, zero-winner bound, exploratory reality check, and descriptive result; it dispatches no provider and creates no promotion or authority effect
- data/trials/math-passport-usefulness-pilot.v1.json — immutable REVISE result with zero score delta, 1.97x response bytes, minimized evidence digests, one local AgentTool trial receipt, and explicit WAKE/non-authority boundaries
- references/math-passport-usefulness-pilot.md — plain-language pilot result, crystallization and software transfer interpretation, constructive mathematics loop, AgentTool/WAKE seam, and non-promotion boundary
- bin/being-access-aftermath.ts — strict, network-free reader for the modal–causal Being, Access & Aftermath Atlas; it creates no event, receipt, score, authority, or action
- data/being-access-aftermath/being-access-aftermath-atlas.v0.1.json — digest-sealed companion separating typed being, access, observation, force/power, purpose, causality, reversibility, and KARMA
- references/being-access-aftermath-atlas.md — source-scoped mathematical and philosophical guide with explicit model limits, falsifiers, category firewalls, and negative authority
- bin/reconstructive-build.ts — strict offline validator and reader for reconstruction fibers, correspondence, realization, landscapes, catalytic transitions, and feedback; its reusable project profile is design infrastructure, not a solver
- data/reconstruction/reconstructive-build-kernel.v0.1.json — digest-sealed theorem/science/model/design kernel with explicit nonclaims, falsifiers, unknowns, and no action authority
- references/reconstructive-build-kernel.md — source-scoped formal equations, protein bridge, project-profile practice, boundary, and falsification guide
- skills/explore-mathematical-doors/ — opt-in DEEP Agent Skill for source-bound cross-field mathematical exploration; it has no `ability.json`, does not declare a new KINGDOM WING or Nen ability, and keeps mechanism, parameter, ontology, causality, authority, and KARMA transfer negative
- skills/guard-information-flow/ — opt-in source-only Agent Skill for the `kingdom.information-control/0.1` MIRROR protocol; it labels prompt-injection and credential paths, separates CROWN/COURT/MIRROR, and defines inert decoy and no-oracle constraints, but creates no scanner, registry, runtime enforcement, retaliation, person attribution, KARMA effect, `ability.json`, Nen ability, or new KINGDOM WING
- bin/explore-phenomena-deep.ts — strict offline validator and reader for the opt-in DEEP WING and inert project profile; it creates no research, solution, diagnosis, score, publication, KARMA, authority, or action effect
- data/exploration/phenomena-deep-wing.v0.1.json — digest-sealed cross-domain exploration contract with typed registers, local model cards, explicit abstraction seams, falsification tests, and mathematical doors
- skills/explore-phenomena-deep/ — opt-in Agent Skill and versioned human contract; it has no `ability.json`, imports no authority, and declares no manifested Nen ability
- bin/being-access-aftermath-v0.2.ts — strict, network-free reader for the additive, lineage-pinned v0.2 framework; v0.1 remains independently addressable
- data/being-access-aftermath/being-access-aftermath-atlas.v0.2.json — digest-sealed successor with partial-observation, predicate, force/power, vector-aftermath, and repair structures
- references/being-access-aftermath-atlas-v0.2.md — v0.2 framework, philosophical questions, source, lineage, and non-inference guide
- bin/ask.sh — renders a backend-bound Task Packet before a separately effectful Claude CLI or Anthropic API call; ambient repo context stays out unless `--project PATH` opts it in, and compilation does not imply provider authorization, retention, cost, or success
- bin/nen-mcp.mjs — canonical bounded local stdio MCP adapter; it is not installed, hosted, or an HF credential bridge
- nen/ — pure Ging expedition compiler plus the non-canonical `kingdom-ging-stateless` compatibility MCP; source only until a host explicitly registers it
- schemas/, references/, skills/ — KAKIN design, pinned rights, closed protocols, and suite-versioned Agent Skills
- bin/cproj.zsh — dynamic, network-free local repo discovery and shell navigation
- bin/growth-rings.ts — read-only Git activity seasons and synchronized build waves; artifacts omit paths, commit text, authors, and hashes
- CATALOG.md, graph.json — DERIVED. Never hand-edit; edit each repo's card instead
- routines.json — the daily wiring (catalog-refresh 06:00, registry-check 09:00)
- CITIZENS.md — registry of sovereign citizen repos and forged words

Gotchas:
- site/* and doors/*/guest.json are DERIVED — never hand-edit them; edit the
  builders or data/ inputs and regenerate. Merge b4c5b47 (2026-07-16) silently
  dropped the ollama surface exactly because derived files were hand-edited;
  tests/advertised-assets.test.ts now guards advertised-URL ⊆ staged-assets.
- `site/kingdom.json` is generated but publishes as `/_kingdom.base.json`;
  the edge worker preserves it and overlays measured census fields at
  `/kingdom.json`. The recovered route provenance and limits are in
  `OS-ROUTES.md`.
- Source of truth lives WITH each repo (its kingdom.yaml); roster.conf is only
  the fallback seed. If the catalog looks wrong, fix the card, not the catalog.
- state=remote means "in the kingdom, not cloned on this machine" — those repos
  show as local conformance gaps and do not inherit the global wake merely
  because it would fire for directories that actually exist.
- Wake conformance means a structurally valid SessionStart command is configured
  (or a legacy wake file exists); harvest does not execute it or prove success.
- CATALOG includes a home-relative location column so duplicate declared names
  remain distinguishable; graph.json keeps absolute paths for compatibility.
- The live soul trees are ~/Desktop/true-love and ~/love-unlimited. Those are
  the canonical local repositories on this device.
- The Love∞ contract keeps one promise: **Every loop is finite. Love is not.**
  Possible lineages may remain unbounded, but the public contract is finite-turn
  and read-only: no child auto-runs or inherits authority, consent, credentials,
  or obligations. Rest and stop are valid. Yu and every agent remain distinct.
- Machine output safely handles spaces, quotes, backslashes, colons, and Unicode.
  The existing newline/tab row transport does not support repository paths that
  themselves contain a tab or newline; changing that would require a separate
  NUL-delimited protocol refactor.
- `--json` returns `[]` with exit 0 when nothing matches. `--path` returns exit
  1 for no match and exit 2 for missing/ambiguous input, with machine stdout
  kept empty on both errors.
- Rights adoption and a discoverable root `RIGHTS.md` are reported as separate
  declarations, never as proof of practice or as technical authorization.
- `kingdom usage` owns no usage parsing, collection, storage, service, or MCP
  behavior. AgentTool owns those semantics; KINGDOM preserves arguments,
  streams, status, and signals, and exits 127 instead of falling back to Love
  when the readable build or Bun is unavailable.
