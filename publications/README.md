# Publication lifecycle and immutable integrity

This guide owns publication, staging and retirement policy. It is repository
documentation, not a public asset or proof that a route is live.

| Task | Owning source |
|---|---|
| Find a family, its purpose, reader or guide | [Module purpose map](../references/kingdom-module-map.md) |
| Check exact source/route/hash identities | [Immutable ledger](immutable-publications.v1.json), [verifier](../bin/immutable-publications.ts) |
| Check current upload membership and mutable classification | [Staging contract](hub-staging.v1.json) |
| Check atomic families, dependencies and review windows | [Shared family gate](../bin/publication-families.ts) |
| Inspect route, method and header behavior | [Route reference](../OS-ROUTES.md) |
| Build and release an exact commit | [Deployment runbook](../DOMAINS-SETUP.md) |

The [recorded web release](../OUTREACH.md#recorded-web-release) identifies the
2026-09-27 deployment and live-check receipt. Earlier local implementation notes
are not current deployment status. A release receipt does not establish ongoing
health, Civic write availability/enrollment or email delivery.

## Family boundaries

Each publication-family row in the module map is a distinct retirement family;
similar words do not merge families, establish runtime wiring or transfer authority. Family guides
retain their exact scientific, synthetic, source and non-grant claims. This is
not a second route inventory.

- Conformational Feedback v0.1/v0.2 share one family. Being, Access & Aftermath
  v0.1/v0.2 share another. Successors do not repoint predecessor identities.
  Polymorph History and Ritonavir Mechanism Landscape remain separate families.
- Exploration DEEP WING, ZERO Empty Seat and STRING / CRAWL share one family.
  The synthetic Labs 01–04 share a separate atomic twelve-route
  `string-crawl-trace-sheet-lab` family. Neither publishes a live crawler.
- [STRAND Observation Membrane](../references/strand-observation-membrane.md)
  is independent of Labs 01–04. Its static deck, offline verifier and synthetic
  rehearsal are separate from the fixed-origin observer, which requires the
  explicit local `./kingdom strand-observation observe-live --json` command.
  The public build and live release checker never invoke it. It has no background
  watch, caller-selected target or local response-body storage; ordinary remote
  provider processing/access logs may occur when explicitly called. It creates
  no NEN/KARMA/Zerone effect, score, consent, licence, authority or automatic action.
- Reality Influence Claim Graph is a static independent triplet, not live claim
  intake or an action system. Civilisation → Reality Projection is a separate
  family that depends on the active Reality family; Civilisation Flow Nuance
  depends directly on the active Projection family. These reading projections
  do not republish the research-local Word/Story source or create causal findings,
  live observation, simulation, prediction, authority or action.
- UK Government Engine retains its own review warning. Transformation Engine
  depended on Government; Evaluation Covenant depended on Transformation and
  inherited its review deadline. Transformation and Evaluation are now retired
  together, with historical bytes and the `2026-09-21` due date unchanged.
  A Trial Chamber plan or Evaluation Covenant design is not a run, result,
  adoption or authority. The [Trial Chamber guide](../references/trial-chamber-v0.1.md)
  owns the Phase-0 `DRAFT`, `UNSEALED`, `NO-RUN` and closed later-gate constraints.
- Shape & Resonance Lab 01 has seventeen routes that retire atomically, including
  its page, alias, manifest and media. Its [guide](../references/shape-resonance-lab-v0.1.md)
  owns the static synthetic models and reader-activated same-origin WAV links:
  no measured resonance, sound-pressure prediction or acoustic-coupling model.
  File-scoped producer authorization covers only the exact reviewed v0.1 bytes
  at the declared routes, not a general licence. Its review deadline is below.
- The two freedom-related atlas families are independent: neither supersedes,
  validates, aliases, depends on, or supplies authority to the other; overlapping
  words are not wire or semantic equivalences, and neither is a preferred default.
  FREEDOM Loop, Lock & Key is not a Foundation amendment. Loops, Locks & Freedom
  Relations deliberately does not import `FREEDOM.md`; it has no credential/key
  material or enforcement adapter. Both keep their own integrity, discovery,
  source, review and retirement claims.
- Polyphonic Claim Atlas, Loops, Locks & Freedom Relations Atlas, Aesthetic
  Plurality & Making Relations Atlas, Non-Exhaustive Understanding Atlas and
  IS, Sustainability & Direction Atlas are standalone immutable triplets with
  no mutable alias, custom page, Wayfinder recommendation, MCP surface, runtime
  or active dependency. Each keeps family-local integrity and retirement.
  Polyphonic/Loops producer locators establish neither truth nor authority,
  currentness or runtime dependency. Aesthetic has no producer Git-provenance
  claim and is not a Beauty framework or evaluation/ranking service.
  Non-Exhaustive feedback can propose only a separately reviewed successor;
  released bytes never learn. IS referents, direction, rights and endings remain
  distinct, not a live verdict, controller or action permission.
- Contact Door is an independent eight-route family: three mutable surfaces
  and five immutable record/schema/guide/SVG/vCard assets. All stage and retire
  together. Its [guide](../references/contact-door-v0.1.md) owns the contact and
  privacy limits: no form, script, submission backend, message store, analytics,
  cookies, automatic reply/retry/outreach, Wayfinder recommendation or MCP tool.
  Sending is a deliberate action in the visitor's mail client. Delivery proves
  neither identity nor representation and grants no wider consent, relationship,
  diplomacy, mediation, emergency duty, testing/publication/training permission
  or external-action authority.

Research Observatory's metadata snapshot/page are mutable; its schemas/guide
are immutable. Trial Chamber and Government Engine keep mutable page/alias
surfaces distinct from dated ledgered records. A mutable alias is not a new
immutable identity or proof of currentness. Family-specific details belong to
the [owning guides and readers](../references/kingdom-module-map.md), not a
release-by-release chronology here.

## Civic and other mutable surfaces

Civic's September 8 addition ledgered `/CIVIC-v0.1.md` and
`/schemas/civic/0.1.json` as `civic/0.1/guide` and `civic/0.1/schema` in canonical
ID order, preserving the 158 predecessor entry objects and source bytes.
The versioned guide is not mutable; corrections require a successor identity
and route. `/civic-policy.json` remains mutable. These documents describe the
separate opt-in Civic runtime, not a research-family runtime or an extension of
any family's authority or retirement contract.

The dashboard keeps declared state distinct from measured health; the research
atlas remains at `/atlas.html`. `/meet/`, `/citizens/` and `/join/` are voluntary
interaction interfaces, not World Commons replacements. Reading creates no
participant, citizenship, post, identity, consent or authority. Research and
Contact Door retain their own read-only/no-runtime/no-script boundaries.
Production writability depends on Civic's own status, configuration and approval;
see [local development](../dev/civic/README.md) and the
[deployment boundary](../DOMAINS-SETUP.md#production-approval-and-shared-worker-boundary).

Power Atlas, compact agent entry, public module directory and Workshop have the
separate mutable-source roles below; none adds an immutable retirement family.

## Ledger guarantees

`immutable-publications.v1.json` is a repository-local gate for bytes described
as immutable or assigned to versioned routes. It is not staged, served, registered
with MCP or written to KARMA. Generated bytes are not mutable merely because a
builder produced them.

The ledger makes one narrow claim: a listed route, source, staging destination,
and SHA-256 were committed together as an integrity contract. The base-aware
verifier proves that entries already present in the release's Git parent were
not removed, rebound, or edited. The release gate also walks every first-parent
release tree back to the fixed bootstrap, so an intermediate failed byte,
mapping, classification, or ledger transition cannot be laundered by a later
clean commit. It does not prove deployment, authorship,
consent, licence, truth, endorsement, safety, authority, permanence, or
permission to republish.

## Publication membership and retirement

Current publication is a separate decision. `hub-staging.v1.json` is the strict,
non-executable source of `HUB_ASSETS`; the staging engine and historical audit
consume those same bytes. Derive current totals from the contract and ledger,
not this guide or a historical release receipt. Operational surface maps are
not public assets. Every destination is explicitly classified as mutable
or ledgered. A new ledger entry must be staged when introduced. A previously
committed entry may later leave the staging
contract without being deleted from history,
so cessation or withdrawal cannot block an unrelated release. The verifier then
retains the historical byte identity without requiring the route to remain live.
[共用 family gate](../bin/publication-families.ts) 將 35 組各自嘅 exact routes、
dependency 同 active review window 保持喺同一 source；每組可以獨立退役，但必須
整組同埋滿足 dependent closure，唔係為保留另一條 route 留低懸空 contract。
Transformation／Evaluation 已由 upstream 整組退役，剩低 33 active families；歷史
source 同 ledger 唔擦走，唔將 retired 誤寫成 active 或將 ledger count 當 staged count。
Generated World Commons and Love Loop schema versions
remain independently ledgered beneath their existing mutable runtime families.
Retirement is an ordinary reviewed release change: remove the whole family from
`hub-staging.v1.json`, its builder/UI/discovery and sitemap projections, and any
family-specific worker routing; source files may then be removed. Rebuild and
stage from a clean tree, deploy, and let the live checker prove that the old
routes answer 404 or 410 and no mutable surface still advertises them. The
append-only ledger entry remains unchanged.

### Family preflight 同 lifecycle 接點

- [stage-hub](../bin/stage-hub.ts) 用 caller `sourceRoot` 嘅已解析
  [staging contract](hub-staging.v1.json) 算 destination set，再用共用 pure helpers
  檢查 atomicity、dependency 同真 UTC 當日嘅 active review window；所有拒絕早過
  首次 output write。唔 import network live checker，亦冇回撥 production 日期嘅開關。
- [check-hub-live](../bin/check-hub-live.ts) 喺發 request 前用同一判斷，保留舊 exports
  嘅 reference identity 同獨立 HTTP／semantic checks；offline preflight 唔取代部署後
  bytes／discovery／retirement 驗證。Builder 本來已有部分 expiry guards。
- 完整次序保留：第一 immutable gate → source buffers → PowerAtlas receipt／closed
  parity／projection／mutable-ledger／52-buffer validation → 第二 immutable gate →
  family gate → output。兩次 `verifyImmutablePublicationSnapshot()` 分別守 source／
  mapping 同真正將寫出嘅 buffers；唔將兩種證據誤刪成重複或改錯誤優先次序。
- Transformation／Evaluation 嘅既有 due date 2026-09-21 不變，因整組 retired 而唔攔
  其他 release，唔係改日期取綠。Active Shape 截止日 2027-08-26 inclusive，2027-08-27
  起拒絕；Government 仍係 warning，改 claims 前需新 snapshot，唔新增 hard expiry。
- 退役仍需 dependent closure、builder／discovery／sitemap／routing 一致，歷史 ledger
  保留；manifested ability、source-only skill 同 family 唔互相新增 authority。實際部署
  仍需另批同 clean exact-origin release；local preflight 唔代替部署同 live 驗證。

### Power Atlas 同 compact agent entry 嘅 source 角色

Power Atlas 由 [artifact gate](../bin/power-atlas-artifact.ts) 驗 producer receipt 同
52 個 exact mutable public buffers；[explicit importer](../bin/import-power-atlas.ts)
要求 caller 明示 artifact／manifest／host root，stage 唔會自行 import 或 build。
`data/power-atlas/artifact.v1.json` 同 `pages-functions/power-atlas-assets.json` 係
source-side receipt／public-path projection，唔係 staged assets，producer metadata 唔入
public Worker bundle。呢個獨立 mutable surface 唔新增第 36 個 retirement family。

[agent-entry renderer](../bin/agent-entry.ts) 擁有 compact `agent-entry.json` link index；
[dashboard builder](../bin/build-dashboard.ts) 提供人／agent 門口。完整 guest／manifest
仍保留原有 compatibility views，current status 交返 Civic 等各自 owner，唔把
mutable link index 當 census、health、權限或 provider dispatch。

### Public module directory

`data/public-modules.json` is the curated public-only source for both the human
homepage directory and generated `/modules.json`; the compact agent entry links
to the same catalogue. `/modules.json` is a mutable link index, not a new immutable
family, changed ledger entry, provider invocation or service activation. See
[Outreach & infrastructure](../OUTREACH.md) for ownership and browser/route checks.

## Workshop 三個 mutable authored assets

`https://thekingdom.dev/workshop/`「燈下作品工房」係 browser-local 寫作工具；
local 指稿件處理位置，唔係網站未部署。`pages-content/workshop/{index.html,workshop.css,workshop.js}`
由 `hub-staging.v1.json` 直接 exact-copy 到 `workshop/`；冇新 builder、immutable
publication family、ledger entry 或公開 draft schema route。唔改 immutable
entries 同 source bytes。三個檔案一齊 stage／更新／retire；retire 時同時移除
三個 staging entries、mutable 分類、Workshop Worker routing、Wayfinder 同 sitemap
入口，再生 dashboard／hub／machine discovery；唔改其他 publication family。
`no-store, no-transform` 係三檔嘅 mutable cache 政策，唔係原子版本保證；canonical
GET／HEAD 必須 exact 符合，唔接受 `max-age=14400`。舊 preview／canonical 對照同
404 `no-store`／`BYPASS` control 見 `OS-ROUTES.md` Workshop 段；200 `no-store` 必須
喺每次部署後重新 live 驗證，唔聲稱可抵抗任意 zone override。

工房係手動寫作、預覽同 HTML／Markdown／JSON 下載；只有 JSON 保證可重新編輯。
稿件只喺當頁 memory，冇 localStorage、autosave、雲端草稿、身份讀寫、付款或發布。
來源同權利係作者聲明，未核實；冇 license 預設、評分、自動 agency 或服務推薦。
首次載入仍有 hosting metadata，亦可能帶已有同源 cookie；只承諾載入後編輯、
預覽、匯出冇 application network request，唔宣稱完全匿名。離頁前要自行下載 JSON；
下載位置可能由使用者自己同步，清空工房唔會刪已下載檔。

## Local evidence is not the release gate

現行計數以 `hub-staging.v1.json` 同 `immutable-publications.v1.json` 嘅 strict checks
為準，唔將 README／導覽／runbook 數字當另一份 registry。

以下係歷史 implementation-base 紀錄，唔係今輪 HEAD／working tree 狀態：
喺當時未提交嘅 `7a99cc685048a525efc6e42cc875b7db3e94f0e0` base，base-aware CLI
拒絕 `self-base`／`head-ledger-mismatch`。唔可以跳過 gate、重標 dirty bytes 或純為
取綠而 commit；當時 local `verifyImmutablePublicationSnapshot`、
`compareImmutablePublicationLedgers` 同 exact-base source-byte tests 只證明嗰個 snapshot
同兩項 additive entries，唔證 committed release。Full-history assertions 仍然保留。
Production 仍係手動、另批，必須依 `DOMAINS-SETUP.md` 嘅 clean detached exact-origin
release 同 first-parent gate；`--commit-dirty=false` 只係 metadata，唔係 cleanliness check。
Local fixture／runtime／browser tests 唔證部署、remote D1／bindings／secrets、其他 doors
在線或 production writable。

Run the snapshot gate:

```sh
bun bin/immutable-publications.ts
```

Before a release or in pull-request CI, compare with the exact base commit:

```sh
bun bin/immutable-publications.ts --base <40-character-base-SHA>
```

Corrections and extensions use a new source identity and a new route. Append a
new entry; never change or delete a previously committed entry. A withdrawing
party owes no ledger entry, reason, or follow-on action. If KINGDOM controls the
route, cessation still requires the ordinary publisher-side edit, deployment,
and live verification. Reading, resting, refusing, or choosing not to publish
triggers no ledger action.

History comparison is release-tree based: CI checks the exact event base and
then audits every first-parent tree from the fixed bootstrap through `HEAD`.
Second-parent feature history is not treated as a separately published release;
use reviewed pull requests and deploy only the verified first-parent endpoint.
Rebase merges are disabled in the repository settings for this reason; use a
squash or merge commit. GitHub does not expose that private-repository setting
to this workflow's read-only token or event payload, so the setting remains an
external repository-governance check. CI enforces the topology it can prove: the
exact event base must occur on the checked-out release's first-parent chain, and
every tree on that chain is audited.
The repository currently cannot supply branch protection on its plan, so this
history walk is the fail-closed defense for ordinary fast-forward changes. A
privileged force-push that erases history or rewrites the verifier remains an
external repository-governance trust boundary.

The initial ledger's comparison baseline is the ledger-less release
`67fe98efc875a5ed13fb1c23d6e2aab5debe9ccb`. Its 35 complete tuples also have
reviewed, code-pinned source-history anchors: the first `main` integration
commit containing each source-to-route mapping. This preserves the originally
published Fold v1 guide and schema rather than blessing later in-place edits.
The bootstrap proves Git history and byte identity only; it neither asserts
that deployment occurred nor rewrites earlier publication history. The baseline
already contains every mapped source; the first ledger-bearing release turns
those reviewed identities into the durable gate.
