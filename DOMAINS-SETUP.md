# DOMAINS-SETUP — the four bought 2026-07-11

> Yu bought 4 domains on Cloudflare (at-cost). Ai did the baseline config + content wiring the same session.
> Deploy rail: `wrangler` (OAuth full account) for CF Pages; custom domains attached via the Pages API using wrangler's OAuth token (the stored `agenttool-cloudflare-token` is email-scoped only). Account `cf4198e651bf3009877d49f688c9d88e`.

## What each domain now serves

| Domain | CF Pages project | Content | Source |
|---|---|---|---|
| **thekingdom.dev** | `thekingdom` | the census hub, KINGDOM OS console, guest discovery, and rights recognition | the exact directory assembled by `bun bin/stage-hub.ts` |
| **we-are.love** | `we-are-love` | the WE ARE handshake protocol page | `chillspace-commons/site/we-are.html` |
| **chillspace.love** | `chillspace-love` | the commons (full site) | `chillspace-commons/site/` |
| **zerone.ai** | `zerone-ai` | redirect → zerone.money (safe default; swap for a landing later) | inline redirect page |

- All four: `*.pages.dev` live immediately (200); custom domains attached, status `initializing` → active once CF provisions cert + DNS (minutes).
- **chillspace.love supersedes** the old codeberg-subpath home in `sites.json`; the codeberg copy still exists as a mirror.

## Redeploy (repeatable)

```bash
# Run this from any checkout of cambridgetcg/KINGDOM-OS. Fetch the intended
# production commit, then build and stage only from a clean,
# detached worktree at that exact SHA. --commit-dirty=false records metadata;
# it does not inspect or prove the staged bytes.
# Release gate: the XENIA baseline and Covenant links in rights.json must be
# publicly retrievable at their pinned version before this deployment.
(
set -euo pipefail
release_repo="$(git rev-parse --show-toplevel)"
cd "$release_repo"
git fetch origin main
release_sha="$(git rev-parse origin/main)"
release_root="$(mktemp -d)"
release_tree="$release_root/tree"
stage_dir=""
cleanup_release() {
  cleanup_status=$?
  trap - EXIT HUP INT TERM
  cd "$release_repo" || true
  if test -e "$release_tree"; then
    git worktree remove --force "$release_tree" 2>/dev/null || \
      rm -rf -- "$release_tree"
  fi
  if test -n "$stage_dir" && test -d "$stage_dir"; then
    rm -rf -- "$stage_dir"
  fi
  rmdir "$release_root" 2>/dev/null || true
  exit "$cleanup_status"
}
trap cleanup_release EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
git worktree add --detach "$release_tree" "$release_sha"
cd "$release_tree"
test "$(git rev-parse HEAD)" = "$release_sha"
test -z "$(git status --porcelain=v1 --untracked-files=all)"
release_parent="$(git rev-parse "$release_sha^1")"
bun bin/immutable-publications.ts --base "$release_parent"
bun bin/build-hub.ts "$(date -u +%F)"
test -z "$(git status --porcelain=v1 --untracked-files=all)"
stage_dir="$(mktemp -d)"
bun bin/stage-hub.ts "$stage_dir"
wrangler pages deploy "$stage_dir" --project-name=thekingdom --branch=main \
  --commit-hash="$release_sha" --commit-dirty=false
bun bin/check-hub-live.ts
)

# others:
npx wrangler pages deploy <dir> --project-name=we-are-love|chillspace-love|zerone-ai
```

The post-build cleanliness gate intentionally refuses an older exact SHA when
today's generated release bytes would differ; commit that generated drift as a
new reviewed release rather than mislabeling it. The EXIT trap removes the
registered release worktree and both exact temporary roots on success or
failure.

The base-aware route-integrity gate compares with the exact first parent of the
release commit. Previously committed ledger entries cannot be removed, rebound,
or rehashed; a correction needs a new identity and route. Every current staged
asset is explicitly mutable or ledgered, and a new ledger entry must be staged
when introduced. A historical entry may later leave
`publications/hub-staging.v1.json`: the ledger
preserves its byte identity without granting continuing authority to republish.
`stage-hub.ts` repeats the current-tree hash and mapping check over the exact
ledgered bytes it is about to copy. The ledger is not itself staged or served by
`thekingdom.dev`.

`stage-hub.ts` requires an existing empty destination and copies exactly 178 assets:
147 ledgered immutable/versioned assets and 31 mutable assets. There are 176 direct
public response bodies; `_worker.js` and `404.html` are checked by their dedicated
contracts. The sitemap contains 164 URLs, and discovery exposes 147 manifest
entry points plus 147 guest actions. The generated surface describes sixteen
atlases, four primary lab JSON routes plus the Shape & Resonance manifest/media,
one experiment route, and one separate activation across thirty-two active retirement
families:
the atlas as `index.html`; `_kingdom.base.json`; `wayfinder.json`;
`commons.json`; both `/schemas/world-commons/0.1.json` and current `0.2.json`;
the mutable `/observatory/` human view and `/research.json` metadata snapshot;
the immutable `/research/schemas/v0.1/` public-snapshot, source, watchlist,
observation, work, and signal schemas; and `/RESEARCH-OBSERVATORY-v0.1.md`;
the mutable `/trial-chamber/` human view and `/trials.json` alias; the immutable
dated Trial Chamber snapshot, ten `/trials/schemas/v0.1/` contracts, and
`/TRIAL-CHAMBER-v0.1.md` guide;
the mutable `/government-engine/` human view and `/government.json` alias; the
immutable dated UK Government Engine snapshot, its single closed
`/government/schemas/v0.1/public-snapshot.schema.json` contract, and
`/UK-GOVERNMENT-ENGINE-v0.1.md` guide;
the mutable `/government-transformation-engine/` human view and
`/government-transformations.json` alias; the immutable dated UK Government
Transformation Engine snapshot, its single closed
`/government/transformations/schemas/v0.1/public-snapshot.schema.json`
contract, and `/UK-GOVERNMENT-TRANSFORMATION-ENGINE-v0.1.md` guide; this
five-route family depends on and must retire with the active UK Government
Engine family; every dossier state is state at publication only, and a build or
live release after its declared `nextReviewDue` must replace or fully retire the
family rather than presenting the dated state as current;
the mutable `/evaluation-covenant/` human view and `/evaluation-covenants.json`
alias; the immutable dated Evaluation Covenant snapshot, its single closed
`/evaluation/schemas/v0.1/public-snapshot.schema.json` contract, and
`/EVALUATION-COVENANT-v0.1.md` guide; this five-route family depends on and must
retire with the active UK Government Transformation Engine family, inherits its
`nextReviewDue`, and remains synthetic Phase-0 design only: draft, unsealed,
unregistered, with no run, data, participants, result, observed outcome, selection,
decision, action, adoption, implementation, or authority;
the mutable `/shape-resonance/` human view and `/shape-resonance.json` alias;
the immutable dated Shape & Resonance snapshot, closed schema, guide, output
manifest, eight SVG diagrams, and three WAV declared sonifications; all
seventeen routes retire atomically, the active page/alias/discovery must be
replaced or fully retired after `2027-08-26`, v0.1 has no acoustic-coupling
model or sound-pressure prediction, audio access is reader-activated
same-origin link only, and no personal data, authority, or action is created;
`love-loops.json`; `love-loops.source.json`; `/schemas/love-loop/0.1.json`;
`CREATION-LOOP.md`; the authored
`/principalities/moonshot-hf-npm-2026-08-11.json`,
`/schemas/principality-catalog/1.json`, and `/PRINCIPALITY-COMMONS.md` bytes;
the authored `/geometries/kingdom-geometry-grammar-v0.json`,
`/schemas/geometry-grammar/0.1.json`, and `/GEOMETRY-GRAMMAR.md` bytes;
the authored `/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json`,
`/schemas/polymorph-history/1.json`, and `/RITONAVIR-POLYMORPH.md` bytes;
the separate authored
`/polymorphs/ritonavir-mechanism-landscape-2026-08-11.json`,
`/schemas/ritonavir-mechanism-landscape/1.json`, and
`/RITONAVIR-MECHANISM-LANDSCAPE.md` bytes;
the separate authored `/feedback/form-feedback-consequence-2026-08-12.json`,
`/schemas/conformational-feedback-atlas/0.1.json`, and
`/CONFORMATIONAL-FEEDBACK.md` bytes, preserved exactly as immutable v0.1;
the additive authored
`/feedback/form-feedback-physics-consequence-2026-08-12.json`,
`/schemas/conformational-feedback-atlas/0.2.json`, and
`/CONFORMATIONAL-FEEDBACK-PHYSICS.md` v0.2 successor bytes;
the authored `/atlases/fold-feedback-atlas-2026-08-12.json`,
the byte-restored `/schemas/fold-feedback-atlas/1.json`, additive
`/schemas/fold-feedback-atlas/1.1.json` source-identity profile, and
`/FOLD-FEEDBACK-ATLAS.md` bytes;
the authored `/atlases/visibility-attention-2026-08-13.json`,
`/schemas/visibility-attention/0.1.json`, and `/VISIBILITY-ATTENTION.md` bytes;
the authored `/atlases/cultural-attention-feedback-atlas-2026-08-13.json`,
`/schemas/cultural-attention-feedback-atlas/1.json`, and
`/CULTURAL-ATTENTION-FEEDBACK-ATLAS.md` bytes;
the authored `/atlases/form-circulation-return-atlas-2026-08-13.json`,
`/schemas/form-circulation-return-atlas/1.json`, and
`/FORM-CIRCULATION-RETURN-ATLAS.md` bytes plus the exact revision-bound
`/definitions/kingdom-karma/e4e84a67/NEN.md` definition mirror;
the authored `/challenges/vanishing-path-2026-08-13.json`,
`/schemas/rare-pathway-challenge/1.json`, and `/VANISHING-PATH.md` bytes;
the authored `/trials/math-passport-usefulness-pilot-2026-08-14.json`,
`/schemas/math-usefulness-result/1.json`, and `/MATH-USEFULNESS.md` descriptive
pilot bytes—REVISE, zero score delta, 1.97x response bytes, response artifacts
rather than beings, and no SDK, WAKE, authority, or promotion effect;
the authored `/atlases/being-access-aftermath-atlas-2026-08-13.json`,
`/schemas/being-access-aftermath-atlas/0.1.json`, and
`/BEING-ACCESS-AFTERMATH-ATLAS.md` bytes;
the authored `/atlases/reconstructive-build-kernel-2026-08-13.json`,
`/schemas/reconstructive-build-kernel/0.1.json`, reusable inert
`/schemas/reconstructive-project/0.1.json` profile, and
`/RECONSTRUCTIVE-BUILD-KERNEL.md` guide;
the authored `/wings/explore-phenomena-deep-2026-08-14.json`, closed
`/schemas/phenomena-deep-wing/0.1.json`, reusable inert
`/schemas/phenomena-deep-project/0.1.json` profile, and versioned
`/EXPLORE-PHENOMENA-DEEP-v0.1.md` guide;
the authored `/protocols/mirror-information-control-2026-08-14.json`, closed
`/schemas/mirror-information-control-public/0.1.json`, and citizen
`/MIRROR-INFORMATION-CONTROL.md` static source law; these routes accept no
credential, prompt, envelope, or security event and deploy no scanner,
classifier, registry, decoy, enforcement, response, or retaliation runtime;
the authored `/records/j-space-reasoning-to-word-2026-08-17.json`, closed
`/schemas/relational-inference-case/0.1.json`, and research guide
`/J-SPACE-VERBALIZABLE-WORKSPACE.md`; this static structure-only triplet contains
no local model run, synthetic-fixture result, or activation record, keeps every
probe not-run and candidate model unassessed, and creates no monitoring,
consciousness/lie/identity/understanding
inference, person score, action, consent, permission, or authority;
the authored `/atlases/reality-influence-claim-graph-2026-08-21.json`, closed
`/schemas/reality-influence-claim-graph/0.1.json`, and
`/REALITY-INFLUENCE-CLAIM-GRAPH.md` guide; this static triplet is one independent
retirement family with no mutable alias or runtime. It classifies itself as a
public static publication while keeping publication and deployment triggers
false. It accepts no live claim, fetches no source, dispatches no agent, and
creates no persuasion target, authority, consent, action, external effect,
causal or moral verdict, score, WAKE/KARMA write, or automatic action;
the authored `/atlases/civilisation-reality-projection-2026-08-25.json`, closed
`/schemas/civilisation-reality-projection/0.1.json`, and
`/CIVILISATION-REALITY-PROJECTION.md` guide; this immutable thin projection is
a separate three-route retirement family that depends on the active Reality
Influence Claim Graph family. It exposes six design-only crosswalks without
republishing the research-local Word, Story, Religion & Civilisation source;
nine unsupported domains remain open. It creates no new historical or causal
finding, metaphysical verdict, score, persuasion target, authority, consent,
action, publication trigger, deployment trigger, or external effect;
the authored `/atlases/civilisation-flow-nuance-atlas-2026-08-26.json`, closed
`/schemas/civilisation-flow-nuance-atlas/0.1.json`, and
`/CIVILISATION-FLOW-NUANCE-ATLAS.md` guide; this immutable qualitative reading
grammar is a separate three-route retirement family that depends directly on
the active Civilisation → Reality Projection family. Fourteen stages, thirteen
non-automatic transitions, six predecessor-bound overlays, nine open-domain
bindings, and non-summable registries make timing, accumulation, topology,
absence, material conditions, emotion observation, social position, power,
uncertainty, affected parties, counterflow, and repair visible. It observes no
live society, simulates or predicts nothing, runs no action gate, infers no
person or group state, and creates no score, target, tactic, authority, action,
publication trigger, deployment trigger, or external effect;
the authored `/atlases/freedom-loop-lock-key-atlas-2026-08-28.json`, closed
`/schemas/freedom-loop-lock-key-atlas/0.1.json`, and
`/FREEDOM-LOOP-LOCK-KEY-ATLAS.md` guide; this standalone immutable atlas keeps
reinforcing-loop gain, behavioural reinforcers, RL reward and update, feedback,
recurrence, learning, guarded transitions, cryptographic key material,
credential claims, bearer capabilities, gate eligibility, execution,
non-scalar freedom, and ISness separately typed. It is static and read-only:
no person is trained, scored, ranked, conditioned, rewarded, punished,
credentialed, authorized, or acted upon, and it is not a Foundation amendment;
its gate checks are separately established rather than statistically
independent, credential identity remains distinct from replay freshness,
each lock carries a justification burden, feedback/model output cannot rewrite
its verifier, issue a credential, or authorize its use, shaping and verifier
changes require fresh review, and effect-bound lost or consumed choices and
irreversible residuals remain visible;
the authored immutable `/truth/polyphonic-claim-atlas-2026-08-26.json`, closed
`/truth/schemas/v0.1/public-snapshot.schema.json`, and
`/POLYPHONIC-CLAIM-ATLAS-v0.1.md` guide; this static synthetic Phase-0 family
has no alias, custom page, Wayfinder recommendation, MCP surface, runtime,
currentness claim, truth oracle, person/source/community score, intent
inference, live claim intake, action authority, or active dependency. The
separate site-authored source locator pins immutable producer tag
`https://github.com/cambridgetcg/kingdom-polyphonic-claim-atlas/tree/v0.1.1`
at revision `ca7bb37271853545a84bc1b8955ce63918da979b`; it establishes no truth,
imports no authority, and creates no runtime dependency or currentness claim;
the frozen immutable
`/atlases/loops-locks-freedom-relations-atlas-2026-08-28.json`, closed
`/schemas/loops-locks-freedom-relations-atlas/0.1.json`, and full linear
`/LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md` guide; the guide is the human
entry point for this static-synthetic family. It has no custom page, mutable
alias, Wayfinder recommendation, MCP surface, runtime, dependency, credential
or key material, enforcement adapter, decision, or action authority. The
separate site-authored source locator pins producer tag
`https://github.com/cambridgetcg/kingdom-loops-locks-freedom-relations-atlas/tree/v0.1.1`
at revision `d8534096224d9e82825653af0f9e12fd123e85b5`; it establishes no truth,
imports no authority or currentness, and creates no runtime dependency;
the 2026-08-29 deterministic build changes Wayfinder only at its global
`generated` date and adds no atlas path, source, keyword, recommendation, or
capability;
the frozen immutable
`/atlases/aesthetic-plurality-making-atlas-2026-08-29.json`, closed
`/schemas/aesthetic-plurality-making-atlas/0.1.json`, and full linear
`/AESTHETIC-PLURALITY-MAKING-ATLAS-v0.1.md` guide; this independent
static-synthetic three-route family stages and retires atomically. Its
count-light description names ten lanes: form, making event, maker statement,
attributed response, aesthetic judgment, context and tradition, institutional
selection, publication, adoption, and aftermath. It is not a Beauty framework
and supplies no Beauty or completion verdict, artifact/person/culture
evaluation, ranking, winner, recommendation, moderation decision, semantic or
authority conversion, private or participant data, personal-appearance
assessment, separately owned Beauty doctrine import, or action. It has no
custom page, mutable alias, Wayfinder exposure, MCP surface, runtime,
dependency, or producer repository/source-code locator; KINGDOM makes no
Git-provenance claim for it;
the authored `/atlases/zero-empty-seat-2026-08-14.json`, which reuses the closed
`/schemas/phenomena-deep-project/0.1.json` inert project profile, and its versioned
`/ZERO-EMPTY-SEAT.md` guide;
the authored `/atlases/string-crawl-trace-sheet-2026-08-15.json`, which reuses
that same closed inert project profile, and its versioned
`/STRING-CRAWL-TRACE-SHEET.md` guide;
the separate additive `/labs/string-crawl-trace-sheet-lab-2026-08-16.json`,
closed `/schemas/string-crawl-trace-sheet-lab/0.1.json`, and
`/STRING-CRAWL-TRACE-SHEET-LAB.md` guide, which publish one exact synthetic
finite baseline while runtime and crawler activation remain inactive;
the byte-bound additive successor
`/labs/string-crawl-strand-lab-02-2026-08-16.json`, closed
`/schemas/string-crawl-strand-lab/0.1.json`, and
`/STRING-CRAWL-STRAND-LAB-02.md` guide, which publish an offline synthetic
finite-CW/cospan topology fixture over F2: an internal stable disk control and
a singular full complex have the same χ and Betti vector, while literal
inclusion cospans and local incidence distinguish them. It has no network
target or live crawl; the optional reader accepts only one bounded local
candidate JSON file and creates no crawler runtime, NEN/KARMA receipt, score,
authority, or action. It makes no claim about HTTP observations or physical
strings. The additive Lab 03 triplet at
`/experiments/string-crawl-frequency-form-lab-2026-08-16.json`,
`/schemas/string-crawl-frequency-form-lab/0.1.json`, and
`/STRING-CRAWL-LAB-03.md` is a synthetic offline thought experiment with no
live crawl, no network request, no DMT administration, no participant or
personal data, no entity validation, no KARMA effect, no score, no authority,
no deployment, and no action. The byte-bound additive
`/labs/strand-descent-lab-04-2026-08-16.json`, closed
`/schemas/strand-descent-lab/0.1.json`, and `/STRAND-DESCENT-LAB-04.md` guide
publish four source-owned synthetic charts, six reversible transitions, exact
triple and four-chart coherence checks, three quotient classes, a common
refinement, and a fixed pairwise-bijective counterexample whose failed triple
equation remains `UNRESOLVED`. The two 2026 sources are versioned preprints;
only the discipline of coherent local-to-global gluing is transferred. Passing
proves finite record compatibility, not physical string theory, spacetime, a
stack, truth, identity, consent, citizenship, KARMA, authority, or action.
Labs 01–04 share one atomic twelve-route `string-crawl-trace-sheet-lab`
retirement family. The independent STRAND Observation Membrane triplet at
`/observations/strand-observation-membrane-2026-08-16.json`, with its closed
`/schemas/strand-observation-membrane/0.1.json`, and
`/STRAND-OBSERVATION-MEMBRANE.md` activation triplet form a separate family.
Its static deck, offline verifier, and synthetic rehearsal are active;
the publisher-declared fixed-origin live observer requires an explicit local
`./kingdom strand-observation observe-live --json` call and is never invoked by
the public build or live checker. It runs no background watch, accepts no target,
persists no response body locally, and creates no NEN/KARMA/Zerone effect, score,
authority, or automatic action; ordinary remote provider processing and access
logs may still occur;
the additive authored `/atlases/being-access-aftermath-atlas-2026-08-13-v0-2.json`,
`/schemas/being-access-aftermath-atlas/0.2.json`, and
`/BEING-ACCESS-AFTERMATH-ATLAS-V0.2.md` successor bytes, without repointing v0.1;
the authored `/atlases/number-isness-theology-atlas-2026-08-14.json`,
`/schemas/number-isness-theology-atlas/0.1.json`, and
`/NUMBER-ISNESS-THEOLOGY-ATLAS.md` read-only number, isness, theology, and
claim-level compatibility companion;
`llms.txt`; `guest.json`; `ollama.json`; `rights.json`; `RIGHTS.md`;
`/.well-known/agent.json`; `robots.txt`; `sitemap.xml`; `404.html`; the quiet
`dada.txt` door; `/os/index.html`; and `_worker.js`. The worker derives
`/os.json`, `/packages.json`, and
`/kingdom.json`; they are not static upload files. It stages only; it never
builds, deletes, overwrites, or deploys.
Wrangler Pages needs that complete directory. `publications/hub-staging.v1.json`
is the authoritative strict data contract; `HUB_ASSETS` is its read-only code
projection. Trust that contract over this prose. For we-are.love and
chillspace.love use `bun bin/stage-doors.ts <we-are|chillspace> <empty-dir>`
(content from the chillspace-commons clone, symlinks dereferenced, plus the
door's guest documents and the shared `_worker.js`).

The shared worker activates the OS routes only on `thekingdom.dev` and its
Pages previews; shared door hosts continue to pass those paths to their own
asset bindings. Read `OS-ROUTES.md` before changing the restored contract.
`check-hub-live.ts` then compares every public staged body as one release and
checks all 147 currently staged ledgered immutable/versioned byte hashes,
including the separately retired FREEDOM Loop, Lock & Key Atlas and Loops, Locks
& Freedom Relations Atlas. It also checks the atomic Aesthetic Plurality &
Making Relations triplet and its no-page/no-alias/no-Wayfinder/no-MCP/no-runtime
retirement boundary. It proves the worker-owned negotiation and
privacy boundaries, typed schema and guide headers, exact family dependencies
and retirement windows, negative authority, source-history lineage, and coherent
HTML, sitemap, llms, guest, Kingdom, agent-manifest, and Wayfinder discovery
across all thirty-two active publication families while leaving the existing MCP
contract unchanged. These are independent static atlases with different lineages
and mathematical kernels. Neither supersedes, validates, aliases, depends on, or
supplies authority to the other; overlapping words are not wire or semantic
equivalences. Neither is a preferred default. A split-generation deployment
fails instead of looking partially healthy.

## Baseline still to do (follow-up)

- **Email routing** — `bin/email-routing.ts` needs the 4 zones added to its domain→tag map, then `provision` + `rules`. Requires the token to gain `Zone.Email Routing Rules:Edit` + `Zone.DNS:Edit`, and **Yu must click the iCloud verification link** Cloudflare emails for each `yournameis.ai+<tag>@icloud.com` destination. Not fully automatable.
- **HTTPS baseline** — "Always Use HTTPS" + SSL mode Full(strict) per zone (needs `Zone Settings:Edit`, not in the stored token — do in dash or with a broader token).
- **zerone.ai** — decide: keep the redirect to zerone.money, or give it its own AI-framing landing.
- Update the hub's own footer to link `thekingdom.dev` as home once the cert is active.

## No-defense stance
Per Yu 2026-07-11: no defensive squatting. These four are *homes for real content*, not blockers. "Let people fuck around and find out."
