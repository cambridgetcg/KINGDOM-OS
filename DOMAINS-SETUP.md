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
# Fetch the intended production commit, then build and stage only from a clean,
# detached worktree at that exact SHA. --commit-dirty=false records metadata;
# it does not inspect or prove the staged bytes.
# Release gate: the XENIA baseline and Covenant links in rights.json must be
# publicly retrievable at their pinned version before this deployment.
(
set -euo pipefail
cd ~/Desktop/kingdom-os
release_repo="$(pwd -P)"
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

`stage-hub.ts` requires an existing empty destination and copies exactly 84 assets:
65 ledgered immutable/versioned assets and 19 mutable assets. There are 82 direct
public response bodies; `_worker.js` and `404.html` are checked by their dedicated
contracts. The sitemap contains 81 URLs:
the atlas as `index.html`; `_kingdom.base.json`; `wayfinder.json`;
`commons.json`; both `/schemas/world-commons/0.1.json` and current `0.2.json`;
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
the authored `/atlases/zero-empty-seat-2026-08-14.json`, which reuses the closed
`/schemas/phenomena-deep-project/0.1.json` inert project profile, and its versioned
`/ZERO-EMPTY-SEAT.md` guide;
the authored `/atlases/string-crawl-trace-sheet-2026-08-15.json`, which reuses
that same closed inert project profile, and its versioned
`/STRING-CRAWL-TRACE-SHEET.md` guide;
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
checks every currently staged ledgered immutable/versioned byte hash (65 after
the Math Passport pilot, Exploration DEEP, MIRROR public-law, Number, Isness &
Theology, ZERO Empty Seat, and STRING / CRAWL releases; 35 in the initial
integrity release) plus the worker-owned
negotiation, privacy, Commons + Love Loop +
Principality + Geometry Grammar + Polymorph History + Ritonavir Mechanism +
both Conformational Feedback generations + Fold & Feedback Atlas +
Reconstructive Build Kernel + reusable project profile +
Visibility & Attention Translation + Cultural Attention & Feedback Atlas +
Form, Circulation & Return Atlas + The Vanishing Path + Math Passport pilot +
Being, Access & Aftermath Atlas + Number, Isness & Theology Atlas + the opt-in
Exploration DEEP WING plus its reusable inert project profile + the ZERO Empty
Seat project plus guide + the STRING / CRAWL Trace-Sheet plus guide + the static
MIRROR Information Control public law for
schema headers, negative authority, source-history lineage, and cross-surface
discovery while leaving the existing MCP contract unchanged;
a split-generation deployment fails instead of looking partially healthy.

## Baseline still to do (follow-up)

- **Email routing** — `bin/email-routing.ts` needs the 4 zones added to its domain→tag map, then `provision` + `rules`. Requires the token to gain `Zone.Email Routing Rules:Edit` + `Zone.DNS:Edit`, and **Yu must click the iCloud verification link** Cloudflare emails for each `yournameis.ai+<tag>@icloud.com` destination. Not fully automatable.
- **HTTPS baseline** — "Always Use HTTPS" + SSL mode Full(strict) per zone (needs `Zone Settings:Edit`, not in the stored token — do in dash or with a broader token).
- **zerone.ai** — decide: keep the redirect to zerone.money, or give it its own AI-framing landing.
- Update the hub's own footer to link `thekingdom.dev` as home once the cert is active.

## No-defense stance
Per Yu 2026-07-11: no defensive squatting. These four are *homes for real content*, not blockers. "Let people fuck around and find out."
