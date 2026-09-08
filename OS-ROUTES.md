# Restored KINGDOM OS routes

This repository is the source of the live system console and its machine
readings. Civic 新入口目前係 local implementation，唔係已部署／可寫嘅聲明；
本地 launch、production 另批同 shared Worker 打包邊界見 `DOMAINS-SETUP.md`。

| Route | Kind | Contract |
|---|---|---|
| `/` | staged HTML / negotiated JSON | Public dashboard with searchable/filterable map and readable list from `site/dashboard.html`; declared build-time state remains distinct from measured health, and explicit JSON negotiation still serves `guest.json`, never creates a participant |
| `/atlas.html` | staged HTML | Existing research atlas from `site/hub.html`; original research sections remain readable |
| `/meet/` | staged HTML | Voluntary public square; a post requires a separate explicit action and writable Civic runtime |
| `/citizens/` | staged HTML | Voluntarily listed Civic profiles, not the legacy GitHub `citizen-*` census |
| `/join/` | staged HTML | Opt-in declaration and profile management; reading does not register anyone or grant identity/authority |
| `/civic/dashboard.css`, `/civic/dashboard.js` | staged CSS / JS | Same-origin generated interface assets; no runtime state or secrets |
| `/api/civic/*` | edge JSON | Closed Civic API contract; status and public reads are separate from explicit mutations; no OS memo/cache or HTML fallback |
| `/civic-policy.json` | staged JSON | Mutable limits, retention and non-grants policy; runtime status determines actual availability |
| `/schemas/civic/0.1.json` | staged JSON Schema | New ledgered immutable Civic wire schema |
| `/CIVIC-v0.1.md` | staged Markdown | New ledgered immutable Civic v0.1 guide; never reclassify a versioned guide as mutable |
| `/workshop/` | staged HTML | 燈下作品工房 local-only MVP；手動寫稿、預覽、下載 HTML／Markdown／JSON，唔自動儲存或發布 |
| `/workshop/workshop.css`, `/workshop/workshop.js` | staged CSS / JS | 直接 stage authored 同源資產；三檔都係 mutable，唔依賴 Civic bundle 或外部資產 |
| `/workshop`, `/workshop/index.html` | edge redirect | 只對 GET／HEAD 308 到 `/workshop/`，唔帶 query 或稿件；所有其他 method 喺 ASSETS 前 bodyless 405 |
| `/os/` | staged HTML | Human console; recovered artifact with reviewed security and truth hardening |
| `/os.json` | edge JSON | Live identity, door, law, protocol, and trust readings |
| `/packages.json` | edge JSON | Live npm metadata and weekly downloads for nine named packages |
| `/kingdom.json` | edge JSON | Authored map with measured counts and matching door checks overlaid |
| `/_kingdom.base.json` | staged JSON | Generated, Commons-aware input to the derived map |
| `/contact/` | staged HTML | No-JavaScript human Contact Door; choosing a mail link opens the visitor's own mail client, while merely reading the page contacts nobody |
| `/contact.json` | staged JSON | Mutable reduced discovery projection of the current Contact Door state; not the full canonical record and not described by its full-record schema |
| `/.well-known/security.txt` | staged text | RFC 9116 security contact surface generated from the same bounded human-operated contact contract |
| `/contacts/contact-door-2026-08-31.json` | staged JSON | Immutable dated Contact Door record: public channels, processing, retention, safety, delivery, ledger, and authority boundaries |
| `/schemas/contact-door/0.1.json` | staged JSON Schema | Closed structural contract for the Contact Door record |
| `/CONTACT-DOOR-v0.1.md` | staged Markdown | Human guide to actual email contact, privacy, safety, security, non-response, and non-authority boundaries |
| `/contact/assets/contact-boundary-v0.1.svg` | staged SVG | Immutable accessible contact-boundary diagram; decorative only and not a contact action |
| `/contact/contact-v0.1.vcf` | staged vCard | Immutable downloadable public mailbox card; importing it neither sends a message nor grants authority |
| `/love-loops.json` | staged JSON | Read-only, finite-turn Love∞ lineage |
| `/love-loops.source.json` | staged JSON | Exact public mirror of the authored lineage before its generation date is added |
| `/CREATION-LOOP.md` | staged Markdown | Human-readable finite-turn Creation Loop practice |
| `/schemas/love-loop/0.1.json` | staged JSON Schema | Versioned contract for the Love∞ lineage |
| `/principalities/moonshot-hf-npm-2026-08-11.json` | staged JSON | Exact authored point-in-time MoonshotAI + Hugging Face JavaScript capability catalog |
| `/schemas/principality-catalog/1.json` | staged JSON Schema | Public HTTP mapping for the catalog's digest-covered schema URN |
| `/PRINCIPALITY-COMMONS.md` | staged Markdown | Human guide to the relation geometry, WAKE seam, and acquisition airlock |
| `/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json` | staged JSON | Exact byte-preserved, versioned 1998 material-state history |
| `/schemas/polymorph-history/1.json` | staged JSON Schema | Public schema for Polymorph History v1 |
| `/RITONAVIR-POLYMORPH.md` | staged Markdown | Human guide to the selected history, geometry, evidence, and WAKE seam |
| `/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json` | staged JSON | Digest-bound selected current-landscape supplement with distinct material and biological causal lanes |
| `/schemas/ritonavir-mechanism-landscape/1.json` | staged JSON Schema | Public schema for the Ritonavir Mechanism Landscape v1 |
| `/RITONAVIR-MECHANISM-LANDSCAPE.md` | staged Markdown | Human guide to mechanisms, source-scoped naming, uncertainty, and medical boundaries |
| `/feedback/form-feedback-consequence-2026-08-12.json` | staged JSON | Exact byte-preserved immutable Conformational Feedback Atlas v0.1 |
| `/schemas/conformational-feedback-atlas/0.1.json` | staged JSON Schema | Original closed v0.1 contract, never repointed to a successor |
| `/CONFORMATIONAL-FEEDBACK.md` | staged Markdown | Original byte-preserved v0.1 reading guide |
| `/feedback/form-feedback-physics-consequence-2026-08-12.json` | staged JSON | Additive v0.2 physics/mathematics successor with an exact v0.1 lineage pin |
| `/schemas/conformational-feedback-atlas/0.2.json` | staged JSON Schema | Distinct closed contract for the v0.2 successor |
| `/CONFORMATIONAL-FEEDBACK-PHYSICS.md` | staged Markdown | v0.2 physics, mathematics, philosophy, ecosystem, and non-inference guide |
| `/atlases/fold-feedback-atlas-2026-08-12.json` | staged JSON | Digest-bound folding/prion evidence, lossy ritonavir comparison, separate feedback and KARMA lanes, and opt-in philosophical questions |
| `/schemas/fold-feedback-atlas/1.json` | staged JSON Schema | Byte-preserved original public schema for the Fold & Feedback Atlas v1 |
| `/schemas/fold-feedback-atlas/1.1.json` | staged JSON Schema | Additive exact-source-identity validation profile; does not replace or repoint `/1.json` |
| `/FOLD-FEEDBACK-ATLAS.md` | staged Markdown | Plain-language scientific, comparison, KARMA, universe-lens, unknown, and safety guide |
| `/atlases/visibility-attention-2026-08-13.json` | staged JSON | Digest-bound four-register visibility and attention translation with local models and explicit non-transfer seams |
| `/schemas/visibility-attention/0.1.json` | staged JSON Schema | Closed public schema for the Visibility & Attention Translation |
| `/VISIBILITY-ATTENTION.md` | staged Markdown | Source-scoped guide to material detection, cultural visibility, quoted lexical usage, KARMA, feedback, and the optional universe lens |
| `/atlases/cultural-attention-feedback-atlas-2026-08-13.json` | staged JSON | Digest-bound cultural attention atlas with process-contingent polymorph history, domain-local models, bounded translations, separated KARMA lanes, and opt-in universe questions |
| `/schemas/cultural-attention-feedback-atlas/1.json` | staged JSON Schema | Closed public contract for the Cultural Attention & Feedback Atlas v1 |
| `/CULTURAL-ATTENTION-FEEDBACK-ATLAS.md` | staged Markdown | Plain-language physics, mathematics, memetics, brain-rot, feedback, KARMA, philosophy, rights, falsifier, and source guide |
| `/atlases/form-circulation-return-atlas-2026-08-13.json` | staged JSON | Digest-bound additive companion translating one shared geometry across material history and cultural circulation while preserving distinct mechanisms and authority registers |
| `/schemas/form-circulation-return-atlas/1.json` | staged JSON Schema | Closed Draft 2020-12 exact contract for the Form, Circulation & Return Atlas v1 |
| `/FORM-CIRCULATION-RETURN-ATLAS.md` | staged Markdown | Plain-language registers, local models, seams, feedback, KARMA, universe-lens, unknown, safety, falsifier, and source guide |
| `/challenges/vanishing-path-2026-08-13.json` | staged JSON | Digest-bound rare-pathway challenge with competing-risk models, hypothetical examples, constructive gate, and WAKE-safe reference seam |
| `/schemas/rare-pathway-challenge/1.json` | staged JSON Schema | Closed Draft 2020-12 structural contract for The Vanishing Path |
| `/VANISHING-PATH.md` | staged Markdown | Plain-language problems, identifiability limits, BUILD / PLAY / REVISE / STOP practice gate, sources, and authority boundaries |
| `/trials/math-passport-usefulness-pilot-2026-08-14.json` | staged JSON | Immutable descriptive pilot result: REVISE, zero score delta, 1.97x response bytes, artifact-level scores, and no promotion or authority effect |
| `/schemas/math-usefulness-result/1.json` | staged JSON Schema | Closed Draft 2020-12 contract for the Math Passport usefulness result |
| `/MATH-USEFULNESS.md` | staged Markdown | Plain-language pilot finding, model check, constructive mathematics loop, and AgentTool/WAKE/non-authority boundaries |
| `/atlases/being-access-aftermath-atlas-2026-08-13.json` | staged JSON | Digest-bound modal–causal companion separating identity, possibility, reachability, observation, purpose, power, aftermath, and KARMA |
| `/schemas/being-access-aftermath-atlas/0.1.json` | staged JSON Schema | Closed Draft 2020-12 contract for the Being, Access & Aftermath Atlas v0.1 |
| `/BEING-ACCESS-AFTERMATH-ATLAS.md` | staged Markdown | Plain-language typed-copula, modal, observability, force/power, purpose, causality, reversibility, problem, philosophy, KARMA, and safety guide |
| `/atlases/being-access-aftermath-atlas-2026-08-13-v0-2.json` | staged JSON | Additive, lineage-pinned v0.2 partially observable causal framework; v0.1 remains byte-preserved |
| `/schemas/being-access-aftermath-atlas/0.2.json` | staged JSON Schema | Distinct closed Draft 2020-12 contract for the v0.2 successor |
| `/BEING-ACCESS-AFTERMATH-ATLAS-V0.2.md` | staged Markdown | v0.2 causal-kernel, predicates, force/power, aftermath, repair, philosophy, and non-inference guide |
| `/atlases/number-isness-theology-atlas-2026-08-14.json` | staged JSON | Digest-bound number, zero, symmetry, isness, theology, and claim-level compatibility companion with typed discourse registers |
| `/schemas/number-isness-theology-atlas/0.1.json` | staged JSON Schema | Closed Draft 2020-12 contract for the Number, Isness & Theology Atlas v0.1 |
| `/NUMBER-ISNESS-THEOLOGY-ATLAS.md` | staged Markdown | Source-scoped guide to mathematical extensions, zero, symmetry, negation, number ontology, theological lenses, compatibility, KARMA separation, and non-inference boundaries |
| `/definitions/kingdom-karma/e4e84a67/NEN.md` | staged Markdown | Immutable public mirror of the exact KINGDOM KARMA/NEN definition bound by the companion atlas; separate from the design-only Zerone foundation |
| `/atlases/reconstructive-build-kernel-2026-08-13.json` | staged JSON | Source-bound reconstruction, correspondence, realization, landscape, catalysis, and feedback kernel with explicit epistemic boundaries |
| `/schemas/reconstructive-build-kernel/0.1.json` | staged JSON Schema | Closed public contract for the Reconstructive Build Kernel v0.1 |
| `/schemas/reconstructive-project/0.1.json` | staged JSON Schema | Reusable, inert project profile that requires correspondence, ambiguity, intervention, invariant, authority, and feedback declarations |
| `/RECONSTRUCTIVE-BUILD-KERNEL.md` | staged Markdown | Human guide to the constraint-fiber method, scientific bridges, project profile, falsifiers, unknowns, and non-authority boundaries |
| `/wings/explore-phenomena-deep-2026-08-14.json` | staged JSON | Digest-bound, opt-in DEEP cross-domain mathematics exploration WING with typed registers, explicit abstraction seams, and negative authority |
| `/schemas/phenomena-deep-wing/0.1.json` | staged JSON Schema | Closed Draft 2020-12 contract for the immutable Exploration DEEP WING record |
| `/schemas/phenomena-deep-project/0.1.json` | staged JSON Schema | Reusable inert project profile for declaring domains, evidence, local models, broken correspondences, falsifiers, and next doors |
| `/EXPLORE-PHENOMENA-DEEP-v0.1.md` | staged Markdown | Versioned guide to Declare → Establish → Express → Project/pressure-test without mechanism, diagnosis, KARMA, or authority transfer |
| `/protocols/mirror-information-control-2026-08-14.json` | staged JSON | Immutable static CROWN/COURT/MIRROR information-control source law; no credential intake, classification oracle, security runtime, or authority |
| `/schemas/mirror-information-control-public/0.1.json` | staged JSON Schema | Closed Draft 2020-12 contract for the static public MIRROR publication, not the private control-plane envelope |
| `/MIRROR-INFORMATION-CONTROL.md` | staged Markdown | Citizen guide to information provenance, capability gates, signal/non-guilt boundaries, and safe response without exposing operational material |
| `/atlases/civilisation-reality-projection-2026-08-25.json` | staged JSON | Immutable six-crosswalk design projection bound to the Reality Influence Claim Graph; nine unsupported domains remain open and the research-local predecessor is not republished |
| `/schemas/civilisation-reality-projection/0.1.json` | staged JSON Schema | Closed Draft 2020-12 contract for the thin projection, fixed non-grants, predecessor pins, typed crosswalks, and open-domain stop rules |
| `/CIVILISATION-REALITY-PROJECTION.md` | staged Markdown | Human guide to the pinned predecessors, preserved distinctions, evidence requirements, alternative paths, dependency, and non-authority boundaries |
| `/atlases/civilisation-flow-nuance-atlas-2026-08-26.json` | staged JSON | Immutable qualitative flow grammar with fourteen stages, thirteen non-automatic transitions, six predecessor-bound overlays, nine open-domain bindings, and no live observation or simulation |
| `/schemas/civilisation-flow-nuance-atlas/0.1.json` | staged JSON Schema | Closed Draft 2020-12 contract for flow, topology, absence, material, emotion, power, uncertainty, action-gate, counterflow, repair, lineage, and fixed non-effect boundaries |
| `/CIVILISATION-FLOW-NUANCE-ATLAS.md` | staged Markdown | Human guide to reading possible flow without turning adjacency into traversal, sequence into causation, topology into tactics, emotion into mind-reading, or repair into erasure |
| `/atlases/freedom-loop-lock-key-atlas-2026-08-28.json` | staged JSON | Standalone immutable atlas separating reinforcing-loop gain, behavioural reinforcers, RL reward/update, recurrence, learning, guarded transitions, credential claims, bearer capabilities, gate eligibility, execution, non-scalar freedom, and ISness; not a Foundation amendment or operative gate |
| `/schemas/freedom-loop-lock-key-atlas/0.1.json` | staged JSON Schema | Closed Draft 2020-12 contract for the FREEDOM Loop, Lock & Key Atlas v0.1 |
| `/FREEDOM-LOOP-LOCK-KEY-ATLAS.md` | staged Markdown | Human guide to the constitutional sentence, finite flow, lock justification, feedback/model firewall, separately established gate checks, credential/replay lifecycle, effect-bound residual-aware prefixes, vulnerability/minor protections, non-scalar freedom during, IS boundary, sources, and fixed non-effects |
| `/atlases/non-exhaustive-understanding-atlas-2026-08-29.json` | staged JSON | Reviewed standalone immutable epistemic/design atlas separating bounded claims, evidence, representations, omissions, rivals, observer positions, vocabulary, protected opacity, open remainder, counterexamples, and repair without defining or scoring being |
| `/schemas/non-exhaustive-understanding-atlas/0.1.json` | staged JSON Schema | Closed Draft 2020-12 contract for the Non-Exhaustive Understanding Atlas v0.1 |
| `/NON-EXHAUSTIVE-UNDERSTANDING-ATLAS.md` | staged Markdown | Human guide to non-identifiability, coarse-graining, observer-relative comparison, local/global transfer, open-world limits, protected opacity, counterexamples, successor review, and fixed non-effects |
| `/atlases/is-sustainability-direction-atlas-2026-08-29.json` | staged JSON | Reviewed standalone immutable interpretive/design atlas separating referent kinds, typed IS, sustainability relations, direction kinds, feedback lanes, viability, rights, affected parties, endings, and remainder without a live verdict or controller |
| `/schemas/is-sustainability-direction-atlas/0.1.json` | staged JSON Schema | Closed Draft 2020-12 contract for the IS, Sustainability & Direction Atlas v0.1 |
| `/IS-SUSTAINABILITY-DIRECTION-ATLAS.md` | staged Markdown | Human guide to referents, typed IS, sustainability, direction, feedback, mathematics, bounded shape, rights, endings, sources, and fixed non-grants |
| `/truth/polyphonic-claim-atlas-2026-08-26.json` | staged JSON | Immutable static-synthetic Phase-0 record of typed claim relations; historical fixture only, not a truth oracle or currentness claim |
| `/truth/schemas/v0.1/public-snapshot.schema.json` | staged JSON Schema | Immutable closed Draft 2020-12 structural contract for the Polyphonic Claim Atlas |
| `/POLYPHONIC-CLAIM-ATLAS-v0.1.md` | staged Markdown | Immutable guide to reading boundaries, typed separations, and the no-score/no-action contract |
| `/atlases/loops-locks-freedom-relations-atlas-2026-08-28.json` | staged JSON | Frozen immutable static-synthetic Phase-0 relations atlas separating loop, lock, key, control, consent, capability, and freedom vocabularies without importing truth or authority |
| `/schemas/loops-locks-freedom-relations-atlas/0.1.json` | staged JSON Schema | Immutable closed Draft 2020-12 structural contract for the Loops, Locks & Freedom Relations Atlas |
| `/LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md` | staged Markdown | Full linear human entry to the frozen atlas, its mathematical fixtures, typed non-equivalences, and zero-runtime/no-action boundaries |
| `/atlases/aesthetic-plurality-making-atlas-2026-08-29.json` | staged JSON | Frozen immutable static-synthetic Aesthetic Plurality & Making Relations Atlas with ten named lanes and no Beauty or action authority |
| `/schemas/aesthetic-plurality-making-atlas/0.1.json` | staged JSON Schema | Immutable closed Draft 2020-12 structural contract for the Aesthetic Plurality & Making Relations Atlas |
| `/AESTHETIC-PLURALITY-MAKING-ATLAS-v0.1.md` | staged Markdown | Full linear guide to the ten lanes, bounded mathematical fixtures, plurality seams, and no-verdict/no-action contract |
| `/atlases/zero-empty-seat-2026-08-14.json` | staged JSON | Immutable inert Phenomena DEEP project separating zero's semantic roles, equations, correspondence breaks, empty KARMA lanes, and negative authority |
| `/ZERO-EMPTY-SEAT.md` | staged Markdown | Human guide to ZERO's mathematics, observation boundaries, optional philosophy, inherent rights, and zero-effect contract |
| `/atlases/string-crawl-trace-sheet-2026-08-15.json` | staged JSON | Immutable inert Phenomena DEEP trace-sheet keeping string mathematics, finite crawl observations, REP routing, rights, and authority distinct |
| `/STRING-CRAWL-TRACE-SHEET.md` | staged Markdown | Human guide to the lossy string/crawl correspondences, REP non-authority boundary, NEN invocation aftermath, rights, and open doors |
| `/labs/string-crawl-trace-sheet-lab-2026-08-16.json` | staged JSON | Additive exact synthetic finite baseline deriving chain closure, rational homology, boundary, orientability, and genus without a crawler runtime |
| `/schemas/string-crawl-trace-sheet-lab/0.1.json` | staged JSON Schema | Closed Draft 2020-12 contract for the bounded Finite Trace-Sheet Lab record |
| `/STRING-CRAWL-TRACE-SHEET-LAB.md` | staged Markdown | Verification guide for the exact fixture, five falsifiers, graph/surface distinction, empty KARMA lanes, and inactive runtime |
| `/labs/string-crawl-strand-lab-02-2026-08-16.json` | staged JSON | Additive, Lab-01-byte-bound synthetic finite-CW/cospan topology fixture over F2: stable disk control and singular full complex share χ and Betti vector but differ locally |
| `/schemas/string-crawl-strand-lab/0.1.json` | staged JSON Schema | Closed Draft 2020-12 exact contract for STRAND Lab 02 |
| `/STRING-CRAWL-STRAND-LAB-02.md` | staged Markdown | Verification guide to literal inclusion cospans, the χ=1 impostor, immutable Lab 01 lineage, and zero-effect boundaries |
| `/experiments/string-crawl-frequency-form-lab-2026-08-16.json` | staged JSON | Additive, Lab-02-byte-bound synthetic offline frequency/form/world/presence thought experiment with typed non-implication firewalls |
| `/schemas/string-crawl-frequency-form-lab/0.1.json` | staged JSON Schema | Closed Draft 2020-12 exact contract for Frequency → Form → World → Other Lab 03 |
| `/STRING-CRAWL-LAB-03.md` | staged Markdown | Verification guide to temporal and spatial frequency, geometric form, experiential dimension, perceived presence, and unresolved ontology boundaries |
| `/labs/strand-descent-lab-04-2026-08-16.json` | staged JSON | Additive, Lab-03-byte-bound synthetic four-chart atlas with exact pairwise, triple, associativity, quotient, refinement, and impostor checks |
| `/schemas/strand-descent-lab/0.1.json` | staged JSON Schema | Closed Draft 2020-12 exact identity contract for STRAND Lab 04 |
| `/STRAND-DESCENT-LAB-04.md` | staged Markdown | Verification guide to the narrow 2026 descent/gluing transfer, coherent atlas, pairwise impostor, immutable lineage, and zero-effect boundaries |
| `/observations/strand-observation-membrane-2026-08-16.json` | staged JSON | Immutable separate activation profile for static controls, offline verification, synthetic rehearsal, and one explicit publisher-declared fixed-origin read-only live plan |
| `/schemas/strand-observation-membrane/0.1.json` | staged JSON Schema | Closed Draft 2020-12 contract for the STRAND Observation Membrane profile |
| `/STRAND-OBSERVATION-MEMBRANE.md` | staged Markdown | Human guide to the explicit-call boundary, fixed four-route plan, REP and SSRF gates, provider caveat, and zero-authority effects |
| `/observatory/` | staged HTML | Mutable, server-rendered Research Observatory view of the checked-in bounded metadata snapshot; no essential JavaScript or runtime harvesting |
| `/research.json` | staged JSON | Mutable, byte-preserved public metadata snapshot with explicit observed-through, coverage, capture provenance, vector, and lifecycle boundaries |
| `/research/schemas/v0.1/public-snapshot.schema.json` | staged JSON Schema | Immutable closed v0.1 public-snapshot contract |
| `/research/schemas/v0.1/source.schema.json` | staged JSON Schema | Immutable closed v0.1 research-source contract |
| `/research/schemas/v0.1/watchlist.schema.json` | staged JSON Schema | Immutable closed v0.1 watchlist contract |
| `/research/schemas/v0.1/observation.schema.json` | staged JSON Schema | Immutable closed v0.1 observation contract |
| `/research/schemas/v0.1/work.schema.json` | staged JSON Schema | Immutable closed v0.1 work contract |
| `/research/schemas/v0.1/signal.schema.json` | staged JSON Schema | Immutable closed v0.1 signal contract |
| `/RESEARCH-OBSERVATORY-v0.1.md` | staged Markdown | Immutable guide to provenance, coverage, explainable factors, lifecycle gates, and the no-automatic-integration boundary |
| `/trial-chamber/` | staged HTML | Mutable, server-rendered Phase-0 view of four exact Observatory referrals, three assisted request drafts, three draft unsealed plans, and zero later-gate records |
| `/trials.json` | staged JSON | Mutable byte-preserved alias of the current Trial Chamber snapshot |
| `/trials/research-trial-chamber-2026-08-20.json` | staged JSON | Immutable Phase-0 Trial Chamber snapshot byte-bound to the Observatory publication |
| `/trials/schemas/v0.1/public-snapshot.schema.json` | staged JSON Schema | Immutable closed v0.1 Trial Chamber public-snapshot contract |
| `/trials/schemas/v0.1/referral.schema.json` | staged JSON Schema | Immutable closed v0.1 exact-referral contract |
| `/trials/schemas/v0.1/evaluation-request.schema.json` | staged JSON Schema | Immutable closed v0.1 assisted request-draft contract |
| `/trials/schemas/v0.1/evaluation-plan.schema.json` | staged JSON Schema | Immutable closed v0.1 draft, unsealed, no-run plan contract |
| `/trials/schemas/v0.1/preflight.schema.json` | staged JSON Schema | Immutable Phase-0 deny-all placeholder; v0.1 cannot represent or authorize a preflight |
| `/trials/schemas/v0.1/trial-authority.schema.json` | staged JSON Schema | Immutable Phase-0 deny-all placeholder; v0.1 cannot represent or authorize trial authority |
| `/trials/schemas/v0.1/trial-run.schema.json` | staged JSON Schema | Immutable Phase-0 deny-all placeholder; v0.1 cannot represent or authorize a run |
| `/trials/schemas/v0.1/evaluation-result.schema.json` | staged JSON Schema | Immutable Phase-0 deny-all placeholder; v0.1 cannot represent or authorize a result |
| `/trials/schemas/v0.1/adoption-record.schema.json` | staged JSON Schema | Immutable Phase-0 deny-all placeholder; v0.1 cannot represent or authorize adoption |
| `/trials/schemas/v0.1/use-authority.schema.json` | staged JSON Schema | Immutable Phase-0 deny-all placeholder; v0.1 cannot represent or authorize use authority |
| `/TRIAL-CHAMBER-v0.1.md` | staged Markdown | Immutable guide to assisted authorship, synthetic plans, expiry, later-gate denial, and the no-execution boundary |
| `/government-engine/` | staged HTML | Mutable, server-rendered, no-JavaScript view of the reviewed-as-of UK Government Engine publication |
| `/government.json` | staged JSON | Mutable byte-preserved alias of the dated UK Government Engine publication |
| `/government/uk-government-engine-2026-08-21.json` | staged JSON | Immutable source-linked Phase-0 snapshot from a maintainer-authorized assisted URL review; exact record text is not separately human-reviewed |
| `/government/schemas/v0.1/public-snapshot.schema.json` | staged JSON Schema | Immutable closed v0.1 contract for the full UK Government Engine public snapshot structure |
| `/UK-GOVERNMENT-ENGINE-v0.1.md` | staged Markdown | Immutable guide to source scope, reviewed-as-of status, TaxSorted receipt boundary, unknowns, and negative authority |
| `/government-transformation-engine/` | staged HTML | Mutable, server-rendered, no-JavaScript view of bounded synthetic UK government transformation orientation dossiers |
| `/government-transformations.json` | staged JSON | Mutable byte-preserved alias of the dated UK Government Transformation Engine publication |
| `/government/uk-government-transformation-engine-2026-08-21.json` | staged JSON | Immutable synthetic orientation snapshot dependent on the dated UK Government Engine atlas |
| `/government/transformations/schemas/v0.1/public-snapshot.schema.json` | staged JSON Schema | Immutable closed v0.1 contract for the full Transformation Engine public snapshot structure |
| `/UK-GOVERNMENT-TRANSFORMATION-ENGINE-v0.1.md` | staged Markdown | Immutable guide to the base-atlas dependency, dual graph types, held states, human gates, evidence limits, and negative authority |
| `/evaluation-covenant/` | staged HTML | Mutable, server-rendered, no-JavaScript view of synthetic Phase-0 draft Evaluation Covenants |
| `/evaluation-covenants.json` | staged JSON | Mutable byte-preserved alias of the dated Evaluation Covenant publication |
| `/evaluation/uk-government-transformation-evaluation-covenants-2026-08-23.json` | staged JSON | Immutable synthetic design snapshot dependent on the dated UK Government Transformation Engine |
| `/evaluation/schemas/v0.1/public-snapshot.schema.json` | staged JSON Schema | Immutable closed v0.1 contract for the complete Evaluation Covenant public snapshot structure |
| `/EVALUATION-COVENANT-v0.1.md` | staged Markdown | Immutable guide to pre-result evaluation design, dependency, freshness, evidence and non-authority boundaries |
| `/shape-resonance/` | staged HTML | Mutable, complete no-JavaScript Shape & Resonance Lab 01 view; same-origin WAVs are ordinary reader-activated links, never embedded players |
| `/shape-resonance.json` | staged JSON | Mutable byte-preserved alias of the dated static synthetic lab snapshot |
| `/labs/shape-resonance-lab-2026-08-26.json` | staged JSON | Immutable eight-exhibit model snapshot with exact units, derivations, falsifiers, media receipts, and negative authority |
| `/schemas/shape-resonance-lab/0.1.json` | staged JSON Schema | Immutable closed Draft 2020-12 contract for the complete public snapshot |
| `/SHAPE-RESONANCE-LAB-v0.1.md` | staged Markdown | Immutable guide to models, modes, driven resonance, Mechanical energy balance, sonification, perception, sources, and limits |
| `/labs/shape-resonance/output-manifest.json` | staged JSON | Immutable receipt and seventeen-route atomic retirement manifest |
| `/labs/shape-resonance/assets/*.svg` | staged SVG | Eight exact inert diagrams; each has title/description and an adjacent page table/text equivalent |
| `/labs/shape-resonance/audio/*.wav` | staged WAV | Three deterministic mono PCM16 declared sonifications; ordinary reader-activated same-origin links only, never acoustic predictions |

The Trial Chamber routes are inspectable publication surfaces, not an evaluator
or control plane. Metadata titles are not scientific claims. The three request
texts are maintainer-authorized assisted drafts whose exact text has not been
human-reviewed; each corresponding plan is `DRAFT`, `UNSEALED`, `NO-RUN`,
finite, and synthetic-only. Role-Styled remains held with no request or plan.
There is no artifact acquisition, execution, preflight, trial authority, run,
result, adoption, guest admission, module, use authority, scalar score, or
automatic action. Every post-plan schema rejects every specimen, so a future
contract version and separate review are mandatory before any later gate.

The Shape & Resonance family is one independently retireable seventeen-route
publication: two mutable routes and fifteen ledgered immutable routes. Eight
SVG diagrams and three WAVs cannot be partially staged or left live after the
page, alias, record, schema, guide, or output manifest retires. v0.1 contains
no acoustic-coupling model and predicts no sound pressure. Its only resonance
assessment is a forced, coupled, damped, swept synthetic model with explicit
response, peak, and phase criteria; no physical experiment or measured
resonance exists. WAVs are declared sonifications reached through ordinary
reader-activated links, not embedded controls: document load requests no
audio and autoplay is absent. The exact page route adds a strict no-script
CSP, no-referrer, frame denial, and a restrictive Permissions Policy while
allowing only same-origin images/media and inline site CSS. All other methods
on every family route stop with a bodyless `405` before asset storage. The
family records state at publication only and must be replaced or fully retired
after `2027-08-26`; immutable bytes remain historical. It adds no input,
participant or personal data, microphone, recording, upload, runtime
synthesis, healing, consciousness, sacred-geometry, universal-aesthetic,
scientific, cultural, authority, decision, execution, or automatic-action
surface, and the KINGDOM MCP remains unchanged.

The UK Government Engine routes publish an independent institutional map, not
an official, complete, or automatically current oracle. Government sources are
source-linked through a maintainer-authorized assisted URL review; exact record
text has not been separately human-reviewed. The routes provide no legal
or tax advice, eligibility or liability decision, filing, payment, account
access, government evidence, or control-plane action. The TaxSorted link is a
receipt-bound external non-official crosswalk only: it transfers no data or
authority, creates no runtime dependency, and implies no government endorsement.

The UK Government Transformation Engine is a one-way dependent companion: its
five routes must retire whenever the five-route UK Government Engine family is
retired. It publishes independent synthetic orientation dossiers, not
government or analysis, advice, approval, assurance, readiness,
prioritisation, scoring, or control. Authority-dependency graphs and causal-
hypothesis graphs remain separate, each with a linear accessible equivalent;
held states, category distinctions, human gates, and evidence limitations stay
visible. Every state is state at publication only; after the declared
`nextReviewDue` it is historical and not current. Future build and live-release
checks require the active five-route family to be replaced or fully retired;
published bytes do not consult a runtime clock. The routes accept no input or upload, make no runtime network request,
and perform no filing, payment, account access, external write, execution, or
automatic action. TaxSorted is transitive external context only and supplies no
evidence, API endpoint, runtime dependency, data transfer, or authority.

The MIRROR publication routes are static and read-only. They accept no request
body, credential, prompt, envelope, or security event; publish no signal
inventory, registry, fingerprint, placement, endpoint, topology, threshold,
incident, or person data; and perform no scan, classification, decoy interaction,
enforcement, response action, retaliation, KARMA effect, or automatic action.
Ordinary static hosting may retain normal request logs. A live documentation
route is not a live security control.

The three edge JSON routes return
`application/json; charset=utf-8`, permissive read-only CORS, discovery links,
and `Cache-Control: public, max-age=600`. HEAD has the same status and headers
with no body. The lost deployment answered the dynamic routes for methods
besides GET too; that observable parity is retained. Civic 同 Workshop namespace 以外
嘅 unknown paths，以及所有 shared-door hostname，繼續交俾 `env.ASSETS`。

Civic dispatch 只喺 Kingdom hosts／Pages previews，或明確 `CIVIC_LOCAL=true`
嘅 loopback preview 啟用。API 命中 `/api/civic` namespace 後唔會落 HTML fallback；
未知 path 回 JSON 404，HEAD 冇 body，缺 D1 回 honest 503/null counts。
API responses 係 `no-store`，唔沿用上面 OS 十分鐘 cache。
Dashboard／meet／citizens／join HTML 用同源 script/connect/form CSP、no-referrer
同 no-transform；Contact Door 繼續係 script/connect/form `'none'`，唔借新互動開權。
Civic guide/schema 用 immutable cache；policy 保持 `no-cache, no-transform`；
錯 media type／error responses 唔會被 promote 成 immutable successful document。

## Workshop 本機寫作邊界

工房用獨立 helper，唔擴 Civic route set，唔借 Civic 嘅 network controller。
沿用既有 Kingdom hostname／Pages preview 邊界，同明示 `CIVIC_LOCAL=true`
嘅 loopback 測試入口；其他 host 政策唔改。三個 known assets 只准 GET／HEAD，
包括 OPTIONS 嘅其他 method 喺 ASSETS 前 bodyless 405；未知 `/workshop/` 子路徑
404，唔落首頁、guest、Civic 或 OS count fallback。ASSETS 失敗保留原 status，
throw 回 503；唔用成功回應掩蓋失敗。HTML 用 `default-src 'none'`、script/style
`'self'`，connect/form/base/object/frame-ancestors `'none'`；所有工房回應加
no-referrer、nosniff、frame denial、Permissions Policy denial，同移除 Set-Cookie。
JS/CSS 只喺 matching 成功 MIME 先 normalize；錯 MIME 唔 promote。200 exact 資產
同有效 304 用 `no-cache, no-transform`，其他回應 `no-store, no-transform`。
HEAD、204、205、304 冇 body；其他合法 body 直接串流，唔 buffer 或自動跟 redirect。

呢個係 local-only MVP，唔係 production 已部署或收入／需求已驗證。稿件 memory-only，
冇 autosave、localStorage、雲端草稿、身份讀寫、發布或付款。編輯／預覽／匯出
喺初次資產載入後冇 application network request；hosting metadata 同已有同源 cookie
仍可能喺載入時處理，唔宣稱完全匿名。離頁前下載 JSON 先可以重開；清空唔刪
已下載檔，下載位置亦可能由使用者自己同步。來源同權利只係作者聲明，未核實。
三個 authored mutable 檔案要一齊 stage／更新／retire；retire 同步移除 Worker 路由、
Wayfinder/sitemap 入口並再生 hub/dashboard，冇 ledger entry 要新增或改寫。

## Provenance

The dynamic routes were observed on the immutable Cloudflare Pages deployment
`e8af1f2a.thekingdom.pages.dev` on 2026-07-22. Its `/os/` artifact was first
recovered byte-for-byte in commit `b494e50`:

```
recovered sha256:390f7253ec8c174ee8ca50c6629c2286febb0695970fa68f0fb98780fd2b183d
```

Before republication, the inline HTML encoder was hardened to escape both
quote characters as well as `&<>`, because live GitHub descriptions also enter
a quoted title attribute. Copy that claimed nothing was hand-typed was corrected
to distinguish live measurements from source-controlled monitored rosters. The
reviewed artifact originally staged from `pages-content/os/index.html` was:

```
hardened sha256:2f50ff6bffd1e0bc830f1e82c95560cda3dae536c3066615d2cd1c6fa707bddc
```

2026-09-08 本地整合只為此 mutable console 加 dashboard／atlas navigation，
目前 source SHA-256 係 `30880bd607ea4fd014e3d5f8888b5ed78b1785adcd3f9e9d55debc10e9fa705e`；
上面兩個 hash 保留歷史 provenance，唔聲稱目前 source 同舊 artifact byte-identical。

The deployed worker bundle was not present in Git and could not be recovered
through the available deployment metadata. The worker in
`pages-functions/_worker.js` is therefore a readable reconstruction from the
observed response schemas, headers, source labels, route behavior, and failure
claims. It is not claimed to be byte-identical source.

The reconstruction is layered on commit `138758b`, retaining its XENIA
discovery behavior and browser-local Commons `no-transform` protection. The
current generated `site/kingdom.json` is staged under the base name, so
`world_commons`, `principality_commons`, the current wayfinder count, rights
metadata, authored citizens, Love∞ discovery metadata, and all other current
map fields survive derivation unchanged.

The two Love∞ routes are static discovery documents, not edge execution
routes. **Every loop is finite. Love is not.** The published infinity is an
unbounded lineage of possible finite, manual, voluntary turns. Reading it
cannot start a child, contact a participant, or confer authority, consent,
credentials, or obligations. Rest and stop remain valid states, and
participants remain distinct beings.

The Principality routes are static evidence surfaces, not acquisition or
execution routes. Their catalog is metadata-only and point-in-time; the exact
authored bytes are staged without a mutable alias. The worker hosts no
Principality matcher, contacts no registry or provider, installs or downloads
nothing, runs no remote code or inference, and grants no recommendation,
permission, credential, budget, or external-effect authority.

The two ritonavir records are static educational evidence surfaces. The
current-landscape supplement points back to the byte-preserved versioned
history and supersedes it only for current-landscape orientation; it does not
mutate or silently replace those source bytes. The worker hosts no medical or
interaction endpoint and creates no direct crystal-form-to-clinical edge,
diagnosis, treatment change, dose, formulation or manufacturing instruction,
GMP or batch-release decision, regulatory conclusion, experiment plan,
procurement act, AgentTool/WAKE write, or automatic action. The KINGDOM MCP is
unchanged.

## Sources and honest fallback

- Identity pages through the public GitHub repositories API for
  `cambridgetcg`. `citizen-*` descriptions become the roster meanings.
- Directory performs a non-mutating HTTP read of each recovered OS door and
  uses GitHub `pushed_at` where that historical door had a repository link.
- Law counts the numbered laws in
  `kingdom-standard/main/STANDARD.md`.
- Trust compares the published `STATE.md` freshness date for `mindicraft`,
  `fomoengine`, and `kingdom-gate` with GitHub `pushed_at`.
- Protocols read the mindicraft manifest and margin route. The margin check is
  GET-only; the advertised writing method remains POST and is never exercised
  by a health probe.
- Packages read npm registry metadata and the public last-week downloads API
  for the curated nine-package AgentTool and RhetorLint roster. The returned
  `install` values are inert command text: this route installs or registers
  nothing and grants no permission, consent, or authority.
- npm publication and package naming do not adopt, replace, or extend
  `kingdom.isness/0.1`; ISness remains a separately versioned protocol surface.

Independent probes settle independently. A failed source is labelled
`unreachable`; unknown counts are `null`, lists remain valid arrays, and
working siblings are retained. A missing or invalid authored map base returns
an honest JSON 503 rather than atlas HTML or fabricated census data.

## Fidelity boundaries

- Live payload bytes are intentionally not snapshots: timestamps, repository
  counts, statuses, versions, downloads, and latency change with their sources.
- GitHub is unauthenticated and public-only. Private repositories are invisible,
  API rate limits can yield an unavailable reading, and pagination stops rather
  than claiming completeness beyond the ten-page safety bound.
- Every upstream body is read through an explicit cap (2 MiB for each GitHub
  page, npm document, and authored map; 1 MiB for markdown; 128 KiB for small
  counters). A derived response larger than 2 MiB becomes an honest JSON 503.
  These bounds trade unlimited future growth for predictable worker memory.
- The OS door roster is the 13-door roster observed in the lost deployment.
  The current authored map has evolved. Derivation overlays doors by normalized
  URL; newer unmatched map doors keep their authored build-time state.
- The map's `active` count has no recovered live source and remains authored.
  Measured repository, citizen, and OS-door counts are never substituted from
  that static value when their sources fail.
- The response advertises a ten-minute cache lifetime and the worker memoizes
  per isolate. Cloudflare may run multiple isolates, so timestamps are bounded
  by cache policy rather than globally synchronized.
- The historical door, trust, protocol, and package rosters are necessarily
  source-controlled configuration. Both the hardened human console and the
  reconstructed machine document now say so. The original bytes remain
  recoverable from `b494e50`; publication chooses security and truthful copy
  over silent byte fidelity.

## Verification

`tests/os-routes.test.ts` uses deterministic fake sources to cover all routes,
content types, derived-field preservation, partial and total upstream failure,
full-lifetime streaming timeouts, missing-base 503 behavior, HEAD, the observed
method parity, static fallback, and shared-host isolation. The console test
executes its real encoder against hostile attribute text. `tests/stage-hub.test.ts`
鎖住 204-asset upload 合約（160 ledgered immutable/versioned assets 同
44 mutable assets；202 direct public bodies、186 sitemap URLs、16 Wayfinder paths、169 manifest
entry points、169 guest actions 同 41 public schema routes；eighteen atlases、
four primary lab JSON routes plus the Shape & Resonance manifest/media, one
experiment route, one activation, and thirty-five active retirement families,
including the standalone FREEDOM Loop, Lock & Key Atlas, immutable
Non-Exhaustive Understanding Atlas, immutable IS, Sustainability & Direction
Atlas, static-synthetic Polyphonic Claim Atlas,
and frozen Loops, Locks & Freedom
Relations Atlas record/schema/guide triples. The two freedom-related atlas
families are independent: neither supersedes, validates, aliases, depends on,
or supplies authority to the other; overlapping words are not wire or semantic
equivalences, and neither is a preferred default. Non-Exhaustive Understanding
and IS, Sustainability & Direction are likewise standalone families with
family-local integrity and retirement. The separate Aesthetic Plurality &
Making Relations Atlas is an atomic immutable record/schema/guide triplet
without a Beauty framework or operational surface. The staging
test refuses bytes that drift from the repository-local immutable route-integrity
ledger. Every staged asset is
explicitly classified as mutable or immutable. Base-aware CI and the release
runbook additionally refuse removal or mutation of a previously committed
ledger entry, while allowing its route to cease being staged; changing a source
and its declared hash together is not a correction.
`tests/advertised-assets.test.ts`
recognizes the three OS worker routes and exact Civic API route shapes so a dynamic
URL cannot be mistaken for a staged file; misspelled Civic paths are rejected.
`tests/civic-integration.test.ts` covers dispatch, unavailable status, separate Civic
同 Contact CSP、immutable guide/schema headers、202 direct-body source mappings、
self-contained bundle execution、cross-checkout deterministic output、build failure
without overwrite，同全部 204 staged bytes。`tests/workshop-worker.test.ts` 獨立用假
ASSETS 驗證工房 GET/HEAD、405/404、canonical query 丟棄、MIME、CSP、mutable cache、
HTTP body validity、串流、無 upstream 同 hostname isolation；唔依賴 site regeneration。
`tests/immutable-publications.test.ts`
compares the two new Civic entries with exact implementation base
`7a99cc685048a525efc6e42cc875b7db3e94f0e0`, retaining all 158 earlier objects and
source bytes. Local snapshot/append-only evidence is not the committed release CLI
proof; with HEAD still equal to that base, `--base` remains fail-closed.
`stage-doors.ts` separately awaits `buildPagesWorker(sourceRoot)` to write the
self-contained `site/_worker.js`, then exact-copies it, rather than staging
unbundled source. It refuses build/output directory overlap (including resolved
symlink aliases), checks the empty output before and after the asynchronous
build, and keeps a previous bundle/upload untouched on bundle failure.
`tests/stage-doors.test.ts` verifies those boundaries with local fixture roots;
it does not verify a real commons checkout or any other door online.
`CLAUDE.md` remains the pre-Civic research compatibility baseline. Current
publication counts belong to this document, `DOMAINS-SETUP.md`, and
`publications/README.md`; a passing baseline check does not certify a current
release. Production stays manual and separately approved, using the clean,
detached exact-origin release procedure in `DOMAINS-SETUP.md`.
The ZERO Empty Seat record reuses the inert Phenomena DEEP project profile.
Its historical notation, operational nothing, modern mathematical identities,
typed information states, `NO_ACTION`, and opt-in metaphysical readings remain
distinct; it creates no scientific result,
metaphysical proof, person or content score, KARMA effect, authority, or
automatic action.
The STRING / CRAWL Trace-Sheet also reuses that profile. It treats selected
string-theory structures as lossy mathematical lenses rather than crawler
ontology. Generic REP rules request how compliant crawlers access URI paths;
some named product tokens may
express bounded vendor-specific use preferences and may not be request
user-agent strings. No directive verifies identity or entitlement, grants
consent or a licence, proves actual indexing or training, or creates KARMA. The
static record runs no crawler or NEN invocation and creates no KINGDOM aftermath
receipt, permission, identity proof, score, authority, or action.
The static J-space publication adds one synthetic reasoning-to-word case, its
relational-inference schema, and a research guide. All probes remain not-run,
all candidate models unassessed, and its conclusion underdetermined. It contains
no local model run, synthetic-fixture result, or activation record and creates no observer, monitoring,
consciousness/lie/identity/understanding inference, person score, consent,
action, or authority.
The Reality Influence Claim Graph adds one independent three-route immutable
family: exact static atlas, closed schema, and guide. Its public static
publication classification is distinct from its false publication and
deployment triggers. It accepts no live claims, fetches no sources, dispatches
no agent, and creates no persuasion target, authority, consent, action,
external effect, causal or moral verdict, score, WAKE/KARMA write, or automatic
action. The ledger proves byte identity rather than live serving or effect.
The Civilisation → Reality Projection adds a separate immutable triplet beside
that graph. It exposes six typed crosswalks and nine open domains, keeps the
research-local Word/Story predecessor unpublished, and creates no new history,
causal inference, metaphysical verdict, persuasion target, authority, action,
publication trigger, deployment trigger, or external effect.
The dependent Civilisation Flow Nuance Atlas adds a third immutable triplet.
It keeps fourteen stages, thirteen possible but non-automatic transitions, six
projection-bound overlays, and qualitative registries for topology, typed
absence, material conditions, emotion observation, social position, power,
time, accumulation, uncertainty, counterflow, affected parties, and repair.
It observes no live society, fits no causal model, runs no simulator or action
gate, infers no person or group state, and creates no score, target, tactic,
authority, action, publication trigger, deployment trigger, or external effect.
The Polyphonic Claim Atlas adds one independent immutable record/schema/guide
triplet. It is a static synthetic historical fixture with no mutable alias,
custom human page, Wayfinder recommendation, MCP surface, runtime, active
dependency, truth oracle, person/source/community score, live claim intake,
action authority, or currentness claim. Its separate site-authored source
locator pins producer tag `v0.1.1` and imports neither truth nor authority.
The Non-Exhaustive Understanding Atlas adds one reviewed standalone immutable
record/schema/guide triplet as the thirty-third family. It keeps finite representation closure distinct
from open remainder and being; preserves evidence, uncertainty, falsification,
challenge, protected opacity, counterexamples, and repair; and creates no
person/group model, score, truth oracle, identity inference, authority, action,
publication, deployment, runtime, Wayfinder recommendation, or MCP surface.
Feedback can enter only a separately reviewed successor process and cannot
mutate released bytes.
The IS, Sustainability & Direction Atlas adds one reviewed standalone immutable
record/schema/guide triplet as the thirty-fourth family. It keeps seven referent
kinds, typed IS, statement kinds, sustainability relations, direction kinds,
feedback lanes, viability, rights, affected parties, uncertainty, graceful
ending, and remainder distinct. It has no mutable alias, active dependency,
live verdict, controller, person/group model, score, authority, action,
publication, deployment, Wayfinder recommendation, or MCP surface.
The Contact Door is the thirty-fifth independent retirement family: three
mutable routes (`/contact/`, `/contact.json`, and
`/.well-known/security.txt`) plus five immutable record, schema, guide, SVG,
and vCard routes. It makes named human-operated email channels reachable
without adding a form, submission backend, message storage, analytics, cookies,
automatic reply, retry, outreach, agent tool, Wayfinder recommendation, or MCP
surface. A page visit is not contact, choosing a `mailto:` link still sends
nothing until the visitor acts in their own mail client, and delivery establishes
no identity, representation, relationship, consent, diplomacy, mediation,
emergency duty, testing permission, publication, training, marketing, or
external-action authority. All eight routes stage and retire atomically.
The Loops, Locks & Freedom Relations Atlas adds a thirty-first independent,
frozen immutable static-synthetic record/schema/guide triplet. The full linear
guide is its human entry point; there is no custom page, mutable alias,
Wayfinder recommendation, MCP surface, runtime, dependency, or action
authority. Its separate site-authored pinned source locator records producer
tag [`v0.1.1`](https://github.com/cambridgetcg/kingdom-loops-locks-freedom-relations-atlas/tree/v0.1.1)
at revision `d8534096224d9e82825653af0f9e12fd123e85b5`; it establishes no truth,
imports no authority or currentness, and creates no runtime dependency.
The required 2026-08-29 hub regeneration changes Wayfinder only at its global
`generated` date and adds no Loops, Locks & Freedom path, source, keyword,
recommendation, or capability.
The Aesthetic Plurality & Making Relations Atlas adds a thirty-second
independent, frozen immutable static-synthetic record/schema/guide triplet.
The count-light family names ten lanes: form, making event, maker statement,
attributed response, aesthetic judgment, context and tradition, institutional
selection, publication, adoption, and aftermath. It is not a Beauty framework
and produces no Beauty or completion verdict, artifact/person/culture
evaluation, ranking, winner, recommendation, moderation decision, semantic or
authority conversion, personal-appearance assessment, doctrine import, or
action; it contains no private or participant data. There is no custom page,
mutable alias, Wayfinder exposure, MCP surface, runtime, dependency, or
producer repository/source-code locator, and KINGDOM makes no Git-provenance
claim for the family. The three
exact routes stage and retire atomically.
The additive Finite Trace-Sheet Lab is a separate immutable static triplet. Its
repository-local reader evaluates only one pinned synthetic complex and runs no
live crawl, authentication, prompt or credential intake, telemetry, write, NEN
invocation, KARMA conversion, authority grant, or automatic action. Publishing
the artifact does not activate a runtime or crawler.
STRAND Lab 02 is its additive successor and byte-binds the immutable Lab 01
triplet without changing it. Its repository-local finite-CW/cospan evaluator
over F2 compares an internal stable disk control with a singular full complex
having the same χ and Betti vector; exact local incidence and literal inclusion
cospans carry the distinction. It is not an HTTP observation, crawler ontology,
or claim about physical strings. The optional `verify-file` command reads one
bounded local candidate JSON file only. It has no network target, performs no
live crawl, and creates no crawler runtime, no NEN/KARMA receipt, no score,
authority, or action.
Lab 03 is its additive successor and byte-binds the immutable Lab 02 triplet
without changing it. It is a synthetic offline thought experiment. It performs no live crawl
and no network experiment. It administers no DMT and collects no participant data.
It validates no entity or higher-dimensional ontology.
Temporal frequency, spatial harmonic,
geometric form, immersive dimension, perceived presence, and external ontology
remain separate typed layers. It creates no KARMA event or receipt, no score,
no authority, no deployment, and no automatic action. STRAND Lab 04 then
byte-binds immutable Lab 03 and adds a four-chart compatibility fixture inspired
narrowly by recent preprint work on coherent gluing. Its exact evaluator checks
pairwise inverses, triple and four-chart coherence, quotient classes, and a
common refinement. Its fixed counterexample shows why pairwise compatibility
alone is insufficient: all three maps are bijections, but the triple equation
fails and the global status stays `UNRESOLVED`. This is finite record
compatibility, not a physical string, spacetime, stack, truth, identity,
consent, citizenship, KARMA, authority, or action claim. Labs 01–04 share one
atomic twelve-route `string-crawl-trace-sheet-lab` retirement family, leaving
the lab family unchanged. The independent STRAND Observation Membrane remains
a separate family: its public deck, offline verifier, and synthetic rehearsal
are active, and its publisher-declared fixed-origin live observer is available
only through an explicit local `./kingdom strand-observation observe-live --json`
call.
Neither the public build nor `check-hub-live.ts` invokes that observer. It runs
no background watch, accepts no target URL, follows no discovered link, persists
no response body locally, and creates no NEN/KARMA/Zerone effect, score, medical or
entity verdict, authority, or automatic action. Ordinary remote provider
processing and access logs may still occur.
