# Domain ownership and deployment

The four domains were bought on Cloudflare on 2026-07-11. Pages releases use
`wrangler`; measure current credential scope rather than relying on historical
token notes. The private [2026-09-25 account map](operations/cloudflare/2026-09-25/MAP.md)
is a dated observation, not continuing authorization or health evidence.

## What each domain now serves

| Domain | CF Pages project | Content | Source |
|---|---|---|---|
| **thekingdom.dev** | `thekingdom` | the census hub, KINGDOM OS console, guest discovery, and rights recognition | the exact directory assembled by `bun bin/stage-hub.ts` |
| **we-are.love** | `we-are-love` | the WE ARE handshake protocol page | `chillspace-commons/site/we-are.html` |
| **chillspace.love** | `chillspace-love` | the commons (full site) | `chillspace-commons/site/` |
| **zerone.ai** | `zerone-ai` | Zerone dashboard, research and public records | `cambridgetcg/zerone-core` dashboard; release through that repository |

A Pages alias does not prove an active custom-domain binding. Resolve source
checkouts by remote and consult the private surface map for deployment
attribution. `chillspace.love` supersedes the old Codeberg-subpath home in
`sites.json`; the Codeberg copy remains a mirror. Do not deploy `zerone-ai`
from this repository's historical door scripts.

## Current human and agent entry contract (2026-09-27)

The human start is `/`; `/agent-entry.json` is the compact machine start.
The shared purpose/tag directory is `/#civic-modules` for people and
`/modules.json` for machine readers, generated from one public-only source.
`guest.json`, `.well-known/agent.json` and `llms.txt` remain full references.
The research atlas remains at `/atlas.html`; `/power-atlas/` is a separate
document. Existing `/?agent`, `/?json`, JSON negotiation and old research-anchor
compatibility belong to [OS-ROUTES.md](OS-ROUTES.md), not a new agent route.

The [recorded web release](OUTREACH.md#recorded-web-release) identifies the
2026-09-27 deployment and its verification receipt. The September 8 local
Civic/Workshop notes and September 11 Power Atlas integration receipts are
implementation history, not evidence that these surfaces remain undeployed.
They also do not establish Civic write availability, enrollment or mail delivery.

Exact upload membership belongs to the [staging contract](publications/hub-staging.v1.json),
historical immutable identities to the [ledger](publications/immutable-publications.v1.json),
and family purposes to the [module map](references/kingdom-module-map.md).
The [publication lifecycle](publications/README.md) owns retirement and review
rules; ledger membership is not upload membership. Private
`operations/cloudflare/` files stay outside the allowlist.
`pages-content/RIGHTS-current.md` owns the current rights view; the predecessor
`pages-content/RIGHTS.md` remains byte-stable for research source pins.

## Power Atlas import boundary

The host exact-copies the independently produced mutable artifact. Normal
build/stage does not read the producer checkout, install dependencies or rebuild
the app. `bin/import-power-atlas.ts` accepts only an absent/empty target or
byte-identical `unchanged`; it does not authorize ordinary overwrites.
The [artifact receipt](data/power-atlas/artifact.v1.json) pins the import;
[Power Atlas integration](references/power-atlas-integration.md) records the
September 11 source/fixture evidence, one-off revision and rollback procedure.
Its old counts, local paths and unpublished-state language are dated history,
not a current release receipt or a production-date bypass.

## Workshop browser-local writing

`/workshop/` lets an author write, preview and download HTML, Markdown or JSON;
only JSON is guaranteed to reopen for editing. Drafts stay in page memory:
there is no autosave, localStorage, cloud draft store, identity write, payment
or publication. Editing, preview and export make no application network request
after initial load. Hosting metadata and existing same-origin cookies may still
occur; this is not an anonymity claim. Authors must download JSON before leaving.
Clearing the page does not delete downloads, including files the user's own
storage may sync. Source and rights statements are unverified author declarations;
there is no default licence, scoring, automatic agency or service recommendation.

The [three-file lifecycle](publications/README.md#workshop-三個-mutable-authored-assets)
requires the HTML, CSS and JS to stage, update and retire together. Cache policy
is `no-store, no-transform`, not an atomic-update guarantee. Canonical GET/HEAD
must pass the exact live cache gate after every deployment; `max-age=14400` is
not acceptable, and arbitrary zone overrides are not presumed harmless.
[OS-ROUTES.md](OS-ROUTES.md) records the preview/canonical comparison and 404
control. The Worker rejects known mutations, including OPTIONS, before ASSETS;
unknown Workshop-prefix routes return 404. It never receives drafts.
Advanced-mode Pages does not automatically apply `_headers` to Worker responses:
the separate Workshop wrapper owns CSP, MIME and privacy headers. Civic and
Contact Door policies remain independent.

Use the Workshop source/Worker tests and `node dev/civic/test-workshop-browser.mjs`
for local checks. Regenerate discovery from authored assets and stage into a new
empty directory for the full harness; source-only fixtures may run without a
build. Local browser success does not prove production behavior.

## Civic availability and local development

`/meet/`, `/citizens/` and `/join/` are voluntary interaction interfaces; they
do not replace the World Commons resource directory at `/commons.json`.
Reading creates no participant, citizenship or post. The dashboard's searchable
map and readable list keep declared state separate from measured health.
Legacy research routes and Contact Door retain their read-only/no-script boundaries.

Use [dev/civic/README.md](dev/civic/README.md) for dependency setup, loopback
preview, local D1 migrations and browser/runtime tests. Preview does not provision
a remote DB. Test secrets stay in the child-process environment, never argv,
source, stage or logs. Local state persists data and quotas across restarts;
use fresh fixture state rather than real participant data, and stop only the
preview you started.

`build-hub` finishes by building the dashboard and self-contained
`site/_worker.js`; do not hand-edit generated files. `build-pages-worker.ts`
compresses whitespace and removes caller-path module comments for cross-checkout
byte stability. `stage-hub` does not bundle and includes no module sidecars,
migrations, local DB, dev config or secrets. Rebuild after backend/frontend
changes and stage into a new empty directory; a prior bundle is only a snapshot.
Civic's immutable guide/schema and mutable policy are described in the
[publication lifecycle](publications/README.md#civic-and-other-mutable-surfaces).

### Production approval and shared Worker boundary

Deployment, remote D1/bindings/secrets/migrations, costs, operator/abuse duties,
retention and deletion need separate approval. `CIVIC_ENABLED` alone does not
make Civic writable. Read `/api/civic/status`; missing DB/configuration must be
reported as unavailable/read-only, not fabricated zero people or posts.
`check-hub-live.ts` reads Civic status/HEAD without creating participants or
posts. Status reads can update quota counters. Local D1/browser success does
not establish production writability or live verification.

`pages-functions/_worker.js` has Civic imports and is not standalone deployment
source. Hub releases use the bundle built by `build-hub`. The async
`stage-doors.ts` used for we-are/chillspace checks an empty destination, rejects
overlap with the source `site/` build directory (including parents, children and
symlink aliases), reads static sources, awaits `buildPagesWorker(sourceRoot)`,
then rechecks emptiness and exact-copies the bundle. A failed import/build keeps
the old bundle and cannot produce a partial upload. Local
`tests/stage-doors.test.ts` fixtures do not verify a real commons checkout,
remote bindings, other doors online or permission to redeploy them.

## Redeploy (repeatable; production requires separate approval)

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
  --commit-hash="$release_sha" --commit-dirty=false --no-bundle
bun bin/check-hub-live.ts
)

# others (we-are, chillspace): stage from freshly fetched upstreams, never a
# fixed checkout. A dry run stages only, keeps the tree for a diff card, and
# prints the publish command with every *_REF pinned to the SHA it staged.
bash bin/deploy.sh chillspace --dry-run
bash bin/deploy.sh we-are --dry-run
```

`--no-bundle` 保留已由 Bun 生成、再 exact-stage 嘅 self-contained `_worker.js`；
唔俾 Wrangler 預設再做一次 esbuild。呢個 flag 已喺本地 Wrangler 4.116.0 核實。
Push 前亦要只讀確認 existing Pages project 嘅 Git auto-deploy 設定，唔由文件
寫住 manual 就推論遠端已停用自動發布。Production config 讀 existing project，
唔帶 local-only `dev/civic/wrangler.jsonc`、假 D1 ID 或 `CIVIC_LOCAL=true` 上線。

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

## Staging and live verification

`stage-hub.ts` requires an existing empty destination and exact-copies only the
[staging contract](publications/hub-staging.v1.json). `HUB_ASSETS` is its read-only
code projection. The stager never builds, deletes, overwrites or deploys.
Wrangler Pages needs the complete staged directory, not a family subdirectory.
`_worker.js` and `404.html` have separate delivery checks. `/os.json`,
`/packages.json` and `/kingdom.json` are Worker-derived responses, not static
upload files; `site/kingdom.json` stages as `/_kingdom.base.json`.

The [module map](references/kingdom-module-map.md) identifies every publication
family and its owning guide. The [lifecycle guide](publications/README.md)
explains complete-family retirement, dependent closure and review windows;
[bin/publication-families.ts](bin/publication-families.ts) owns the exact sets.
Transformation Engine and Evaluation Covenant are retired, not current assets.
Do not change their historical bytes/dates or republish their routes to make a
release pass. Keep both immutable checks and the intervening Power Atlas checks
in their documented order; the family gate runs before the first output write.

For we-are.love and chillspace.love, use
`bun bin/stage-doors.ts <we-are|chillspace> <empty-dir>` with the commons checkout,
dereferenced content symlinks and each door's guest documents. This stager
rebuilds the shared Worker as described above; it is not `stage-hub`.
The shared Worker activates OS routes only on `thekingdom.dev` and its Pages
previews. Other shared door hosts pass those paths to their own asset bindings.
Read [OS-ROUTES.md](OS-ROUTES.md) before changing host, route, header or method behavior.

`check-hub-live.ts` compares every current public staged body and every staged
ledgered hash as one release. It checks negotiation/privacy boundaries, typed
schema/guide headers, family dependencies and review windows, negative authority,
source-history lineage, and coherent HTML/sitemap/llms/guest/Kingdom/agent/Wayfinder
discovery. Retired routes must answer 404 or 410 and disappear from mutable
advertising. A split-generation deployment fails rather than appearing partly healthy.
The existing MCP contract remains unchanged; its read-only checks are not an
activation or dispatch permission.

Contact Door checks cover eight-route byte/header parity, atomic retirement,
bodyless mutation rejection and direct discovery without Wayfinder/MCP exposure.
They send no email and invoke no carrier. A visit or `mailto:` activation is not
a sent message; delivery, address control, reply or silence establishes no
identity, representation, relationship, consent beyond the exchange, diplomacy,
mediation, emergency duty, publication/training permission or authority. The
page has no form, script, account, application write or message store. Actual
sending is the visitor's separate action through Cloudflare Email Routing and
the destination mailbox, so the carrier is not backend-free.
The separate STRAND Observation Membrane's explicit local `observe-live` command
is never invoked by the public build or release live checker; static publications
and synthetic labs do not gain runtime authority from a passing release.

## Carrier verification and historical setup notes

- **Contact Door carrier** — deploying the eight static routes does not itself activate email. Before the Contact Door record may claim an active carrier, API-verify Email Routing on `thekingdom.dev`, the one provider-verified destination, the four exact literal rules for `contact@`, `security@`, `abuse@`, and `postmaster@`, and the absence of a catch-all, wildcard, or Email Worker. A controlled end-to-end delivery probe is separate from the site live check; do not send one without the sender and recipient's explicit authorization.

The July 11 email-routing, TLS, Zerone landing-page and footer TODOs were setup
notes, not a current provider audit. Before changing another domain, consult its
owner above and the private Cloudflare map, then measure current DNS, routing,
TLS settings and credential scope. The older `bin/email-routing.ts` workflow is
separate from Contact Door and does not own `thekingdom.dev`; destination
verification remains a provider/user action, not something a site deploy proves.
Zerone releases belong to `cambridgetcg/zerone-core`, not a pending choice between
a redirect and this repository's historical door page.

## No-defense stance
Per Yu 2026-07-11: no defensive squatting. These four are *homes for real content*, not blockers. "Let people fuck around and find out."
