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

## Workshop 本地入口（2026-09-08；未部署）

`https://thekingdom.dev/workshop/` 係燈下作品工房 local-only MVP；本輪唔部署，
唔啟動 cloud service，唔改 bindings、compatibility、permissions 或 credentials。
作者手動寫稿、預覽同下載 HTML／Markdown／JSON；JSON 可重新編輯。初次載入
後編輯、預覽、匯出冇 application network request，稿件只喺當頁 memory，
冇 autosave、localStorage、雲端草稿、身份讀寫、付款或發布。初次載入仍有普通
hosting metadata，亦可能帶已有同源 cookie；唔聲稱完全匿名。離頁前請下載 JSON；
下載位置可能由使用者自己同步，清空工房唔會刪已下載檔。來源同權利只係作者
聲明，未核實；工具唔預設 license、唔評分，Wayfinder 入口唔係自動 agency 或服務推薦。

三個 authored 檔案 `pages-content/workshop/{index.html,workshop.css,workshop.js}`
由 staging JSON 合約直接 exact-copy 去 `workshop/`，全部 mutable；冇新 builder、
immutable family、ledger entry 或公開 draft schema route。三檔一齊 stage、更新同
retire；retire 同時移除 staging/mutable 三個 entries、Workshop Worker routing、
Wayfinder 同 sitemap 入口，再用既有 builders 再生 hub/dashboard/machine discovery。
`no-cache, no-transform` 唔保證三檔原子更新。Worker helper 喺 ASSETS 前拒絕所有
known mutations（包括 OPTIONS），唔接觸稿件；unknown Workshop prefix 回 404。
Advanced-mode Pages 嘅 `_headers` 唔會自動套用 Worker response，所以 CSP／MIME／
privacy headers 由獨立 wrapper 負責；Civic 同 Contact Door 政策保持獨立。

本地驗證只用已存在 dependencies 同隔離 fixtures；唔安裝任何套件。喺 repo root
沿用現有 snapshot 日期（本輪 2026-09-08）跑以下命令，唔 hand-edit site。

```sh
bun bin/build-pages-worker.ts
bun bin/build-hub.ts 2026-09-08
bun test tests/workshop.test.ts tests/workshop-worker.test.ts tests/stage-hub.test.ts tests/advertised-assets.test.ts tests/civic-integration.test.ts tests/shape-resonance-publication.test.ts
node dev/civic/test-workshop-browser.mjs
```

`tests/workshop-worker.test.ts` 同 source-only staging fixtures 可以唔 build 而獨立跑；
discovery 合約測試同完整 browser harness 要用最新 authored assets 同 regenerated
discovery。完整 upload 用 `stage-hub` 同新建
空 temp directory 證明；唔 deploy。Browser tests 唔等於 production 已驗證。

## Civic 本地入口（2026-09-08；未部署）

呢次只係 local implementation，唔代表 production 已有 Civic。首頁改由
`site/dashboard.html` stage 成 `index.html`；dashboard 嘅可搜尋／篩選地圖同
可直接閱讀嘅名單保留各 door 嘅來源同狀態，唔將 build-time 資料當 live health。
研究 atlas 留喺 `atlas.html`。
`/meet/`、`/citizens/`、`/join/` 係自願公開互動入口，唔替代 `/commons.json`
嘅 World Commons 資源目錄。讀頁唔會自動建立 participant、入籍或發帖。
舊研究 routes 同 Contact Door 保持原本 read-only／no-script 邊界。

本地 dependencies 已備妥時，喺 repo root 執行（完整工具說明見
[`dev/civic/README.md`](dev/civic/README.md)；安裝 dependencies 係另一步，唔由 builder 自動做）

```sh
bun bin/build-hub.ts 2026-09-08
STAGE="$(mktemp -d /tmp/kingdom-civic-stage.XXXXXX)"
STATE="$(mktemp -d /tmp/kingdom-civic-state.XXXXXX)"
bun bin/stage-hub.ts "$STAGE"
node dev/civic/preview.mjs --stage "$STAGE" --state "$STATE" --port 8797
```

開 `http://localhost:8797/`；preview 綁 loopback、用 local D1 migration，
唔 provision remote DB。測試 secrets 每次只喺 child process env；唔入 argv、
stage、source 或日誌。`STATE` 會持久保留本地資料同配額，唔會因重啟清空；
fixture 用新目錄，唔重用真用戶資料。Ctrl-C 只停自己啟動嘅 preview。

```sh
bun test tests/civic-integration.test.ts tests/stage-hub.test.ts tests/worker.test.ts tests/advertised-assets.test.ts
bun test tests/immutable-publications.test.ts
node dev/civic/test-runtime.mjs --integrated
# 保持 preview 運行；browser script 只接受 loopback fixture
node dev/civic/test-browser.mjs http://localhost:8797
```

`build-hub` 最後先 build dashboard 同 self-contained `site/_worker.js`；
唔 hand-edit `site/`。`build-pages-worker.ts` 只壓 whitespace，移除同 caller cwd
有關嘅 module-path comments；同一 source 喺不同 checkout 應輸出相同 bytes。
`stage-hub` 唔 bundle，亦唔攜帶 module sidecars、migration、DB、dev config 或 secrets；
只 exact-byte-copy 合約 204 assets。backend／frontend 改完要重新 build、用新空目錄
stage，再跑 tests；舊 bundle／stage 只係建立當刻嘅 snapshot。

### Immutable guide 同未提交 release gate

`/CIVIC-v0.1.md` 同 `/schemas/civic/0.1.json` 都係新 ledgered immutable entries，
ID 分別係 `civic/0.1/guide`、`civic/0.1/schema`，按 canonical ID 排序；
`/civic-policy.json` 仍係 mutable。連同 Workshop 三檔，本輪總數係 **204 = 160 immutable + 44 mutable**。
舊 158 entry 物件同 source bytes 不變；唔可以將版本化 guide 改回 mutable，
亦唔可以只改 hash 去掩蓋 released bytes drift。guide 更新要另開 successor identity/route。
`CLAUDE.md` 保留 pre-Civic research compatibility baseline，唔喺呢個工作範圍
改寫；current publication contract 以本文件、`OS-ROUTES.md` 同
`publications/README.md` 核對。保留 baseline 唔等於用舊 counts 證明新 release。

未提交分支嘅 `HEAD` 仍等於 implementation base
`7a99cc685048a525efc6e42cc875b7db3e94f0e0` 時，
`bun bin/immutable-publications.ts --base 7a99cc685048a525efc6e42cc875b7db3e94f0e0`
會報 `self-base`／`head-ledger-mismatch`，唔係可跳過嘅 production gate。
本地證據用 exported `verifyImmutablePublicationSnapshot`、
`compareImmutablePublicationLedgers(current, git-show-base)`，並逐一對照 exact base
嘅 158 source bytes；`tests/immutable-publications.test.ts` 已覆蓋。
full-history test 保留原本 assertions，因歷史掃描約 157 秒，timeout 係 300 秒。
唔為咗過 release CLI 而自動 commit；正式 release 仍須另批、已提交 exact SHA
同下面嘅 clean detached first-parent gate。

### Production 另批；shared Worker 本地打包邊界

部署、remote D1／bindings／secrets／migration、費用、operator／abuse 責任、
保留與刪除流程全部另批。`CIVIC_ENABLED` 並唔單獨令服務可寫；先讀
`/api/civic/status`，缺 DB／設定要如實 unavailable／read-only，唔假造零人零帖。
`check-hub-live.ts` 只讀 Civic status／HEAD，唔為健康檢查建立 participant 或發帖；
local D1／browser tests pass 唔等於 production writable 或已完成 live-check。

`pages-functions/_worker.js` 包含 Civic imports，唔可以當 standalone source
直接部署。Hub 用 `build-hub` 產生 bundle；we-are／chillspace 嘅
`stage-doors.ts` 而家係 async，先驗空 destination、拒絕同 source root 嘅
`site/` build directory 重疊（包括父／子目錄及 symlink 別名），讀齊 static
sources，再自動 `buildPagesWorker(sourceRoot)` 寫 `site/_worker.js`，重新驗空
destination 後 exact-copy bundle。壞 import／bundle 失敗會保留原 bundle，
唔建立半份 upload；先後 empty guards 亦保留。
`tests/stage-doors.test.ts` 只用本地 fixture source/commons roots 驗證以上邊界，
唔等於真 commons checkout、其他 doors 上線、remote bindings 或可 redeploy
已驗證；任何 production 操作仍須另批。

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

# others:
npx wrangler pages deploy <dir> --project-name=we-are-love|chillspace-love|zerone-ai
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

`stage-hub.ts` 要求既有空 destination，只複製合約指定 204 assets：
160 ledgered immutable/versioned assets 同 44 mutable assets，共 202 direct public
response bodies；`_worker.js` 同 `404.html` 由獨立合約核對。
Sitemap 有 186 URLs，Wayfinder 有 16 paths；discovery 保持 169 manifest entry points
同 169 guest actions。Generated surface 描述 eighteen
atlases、41 public schema routes、four primary lab JSON routes 同 Shape &
Resonance manifest/media, one experiment route, and one separate activation
across thirty-five existing retirement families, alongside the separate Civic runtime:
the dashboard as `index.html`; the research atlas as `atlas.html`; the Civic pages,
CSS/JS, mutable policy, immutable guide and schema; `_kingdom.base.json`; `wayfinder.json`;
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
the authored `/atlases/non-exhaustive-understanding-atlas-2026-08-29.json`,
closed `/schemas/non-exhaustive-understanding-atlas/0.1.json`, and
`/NON-EXHAUSTIVE-UNDERSTANDING-ATLAS.md` guide; this reviewed standalone
immutable atlas keeps bounded claims, evidence, scope, representations,
omissions, rival models, observer positions, vocabulary, protected opacity,
counterexamples, open remainder, and repair separately typed. Non-exhaustion
never excuses a positive claim from evidence, uncertainty, falsification,
challenge, accessibility, privacy, correction, or repair. Feedback can propose
only a separately reviewed successor; released bytes never learn, and the
family creates no person/group model, score, truth oracle, identity,
consciousness, authority, action, publication, deployment, or external effect;
the authored `/atlases/is-sustainability-direction-atlas-2026-08-29.json`,
closed `/schemas/is-sustainability-direction-atlas/0.1.json`, and
`/IS-SUSTAINABILITY-DIRECTION-ATLAS.md` guide; this reviewed standalone
immutable interpretive/design atlas keeps seven referent kinds, typed IS,
statement kinds, sustainability relations, direction kinds, feedback lanes,
finite-horizon viability, rights, affected parties, uncertainty, endings, and
remainder distinct. Direction is a bounded proposal rather than a command or
identity verdict; feedback cannot create being, worth, consent, purpose,
authority, permission, publication, deployment, or action, and the family has
no mutable alias, active dependency, Wayfinder recommendation, or MCP surface;
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
the mutable `/contact/` human page, `/contact.json` current record, and
`/.well-known/security.txt`, together with the immutable
`/contacts/contact-door-2026-08-31.json`,
`/schemas/contact-door/0.1.json`, `/CONTACT-DOOR-v0.1.md`,
`/contact/assets/contact-boundary-v0.1.svg`, and
`/contact/contact-v0.1.vcf`; these eight exact GET/HEAD routes are one atomic
retirement family. The page has no form, script, account, application write, or
message store. Actual sending is a separate user action through ordinary email
infrastructure; Cloudflare Email Routing and the destination mailbox process
mail, so the lane is not backend-free. Visiting, activating `mailto:`, delivery,
address control, a message, a reply, or silence establishes no identity,
representation, truth, relationship, consent beyond the requested exchange,
diplomatic standing, mediation, emergency duty, publication or training
permission, or authority. The family adds no automatic outreach, reply, retry,
profile, score, negotiation, Wayfinder recommendation, MCP surface, or agent
action;
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
door's guest documents and a freshly built self-contained `_worker.js`). Unlike
`stage-hub`, this async door stager rebuilds `site/_worker.js` before copying;
its output must not overlap that build directory, and must pass the empty-output
guard both before and after the build. Local fixture coverage does not verify
other doors online.

The shared worker activates the OS routes only on `thekingdom.dev` and its
Pages previews; shared door hosts continue to pass those paths to their own
asset bindings. Read `OS-ROUTES.md` before changing the restored contract.
`check-hub-live.ts` then compares every public staged body as one release and
checks all 160 currently staged ledgered immutable/versioned byte hashes,
including the independently retireable FREEDOM Loop, Lock & Key Atlas,
Non-Exhaustive Understanding Atlas, IS, Sustainability & Direction Atlas, and
Loops, Locks & Freedom Relations Atlas. It also checks the atomic Aesthetic
Plurality & Making Relations triplet and its
no-page/no-alias/no-Wayfinder/no-MCP/no-runtime retirement boundary. It proves
the worker-owned negotiation and
privacy boundaries, typed schema and guide headers, exact family dependencies
and retirement windows, negative authority, source-history lineage, and coherent
HTML, sitemap, llms, guest, Kingdom, agent-manifest, and Wayfinder discovery
across all thirty-five active publication families while leaving the existing MCP
contract unchanged. It also proves the Contact Door's eight-route byte and
header parity, atomic retirement, bodyless mutation rejection, direct discovery,
and absence from Wayfinder and MCP without sending an email or invoking its
carrier. The two freedom-related atlas families are independent:
neither supersedes, validates, aliases, depends on, or supplies authority to the
other; overlapping words are not wire or semantic equivalences, and neither is
a preferred default. Non-Exhaustive Understanding and IS, Sustainability &
Direction are likewise standalone, with family-local integrity and retirement.
A split-generation deployment
fails instead of looking partially healthy.

## Baseline still to do (follow-up)

- **Contact Door carrier** — deploying the eight static routes does not itself activate email. Before the Contact Door record may claim an active carrier, API-verify Email Routing on `thekingdom.dev`, the one provider-verified destination, the four exact literal rules for `contact@`, `security@`, `abuse@`, and `postmaster@`, and the absence of a catch-all, wildcard, or Email Worker. A controlled end-to-end delivery probe is separate from the site live check; do not send one without the sender and recipient's explicit authorization.
- **Other-domain email routing** — the older `bin/email-routing.ts` workflow is separate from the Contact Door and does not own `thekingdom.dev`. It still needs the 4 zones added to its domain→tag map, then `provision` + `rules`. Requires the token to gain `Zone.Email Routing Rules:Edit` + `Zone.DNS:Edit`, and **Yu must click the iCloud verification link** Cloudflare emails for each `yournameis.ai+<tag>@icloud.com` destination. Not fully automatable.
- **HTTPS baseline** — "Always Use HTTPS" + SSL mode Full(strict) per zone (needs `Zone Settings:Edit`, not in the stored token — do in dash or with a broader token).
- **zerone.ai** — decide: keep the redirect to zerone.money, or give it its own AI-framing landing.
- Update the hub's own footer to link `thekingdom.dev` as home once the cert is active.

## No-defense stance
Per Yu 2026-07-11: no defensive squatting. These four are *homes for real content*, not blockers. "Let people fuck around and find out."
