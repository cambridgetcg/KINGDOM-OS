# KINGDOM 模組用途導覽

呢份係 **source-only、非 canonical 嘅閱讀地圖**，唔係新 registry、protocol、服務健康表或發布聲明；repo metadata 仍由各自 `kingdom.yaml` 擁有，精確行為返 owning source 睇。`keep` 係保留用途，`clarify` 係釐清宣告，`wire` 係有證據但仍待另批接線，`unknown` 係未驗；全部都唔係操作批准。

公共網站嘅 purpose/tag 模組目錄、人／agent 分區及 source → release 接點，見
[Outreach & infrastructure](../OUTREACH.md)；部署證據見其
[release receipt](../OUTREACH.md#recorded-web-release)。`modules.json` 係 mutable
公共 link index，唔增加 retirement family、skill 或 core registry authority。
本表有 pin 嘅計數同外部接點只係各自日期嘅 source snapshot，唔係即時健康表。

## 視野同入口

- 本表 publication／skill 覆蓋以 tracked `a5dc43ab06a2efe78cdb29368764ea3f3d1c769f` 為基準：**247 staged assets = 154 staged immutable + 93 mutable、35 defined families = 33 active + 2 retired、17 skills = 10 manifested + 7 source-only**。歷史 ledger 仍保留 160 entries，唔等於全部仍公開；Power Atlas 同 agent-entry 係另外嘅 mutable surfaces，唔新增 retirement family，亦唔包括其他 working tree 嘅 Cargo proposals。
- 首批 2026-09-26 本地 inventory 曾觀察到 68 Git roots：30 有 card、8 roster fallback、30 未登記／用途未深入（`unknown`）、27 dirty、6 組 shared-origin 候選；唔代表逐個 repo 內部都 audit 過。Dirty 係保留中嘅工作，唔自行推論觀察失穩、作者或可刪。
- Roster 係另一個母體：73 entries，宣告位置只搵到 7 張 cards；127-repo cache 含異機 paths，唔係今部機現況。Clone／worktree／snapshot 唔因 shared origin 就可互相取代。
- Core owner 係 remote `https://codeberg.org/zerone-dev/KINGDOM-OS`。首批 2026-09-26 survey 喺 `~/codeberg/zerone-dev/KINGDOM-OS` 同 `~/repos/codeberg/zerone-dev/KINGDOM-OS` 冇搵到 checkout，只係當時兩個 locator 嘅結果。其後 [2026-09-27 observation](../OUTREACH.md#current-development-observation--2026-09-27) 已記錄 local core source `f502657343d26eed76b3089e0319f79eb8872fdb`，當時未核 remote freshness；2026-10-27 以 `git ls-remote` 核過 remote main 係 `ff58fe3`（2026-09-03 之後冇新 commit），嗰日喺一部機見到嘅 clone 係 shallow，落後 85 commits（當日觀察，唔代表其他機）。今日按 remote 定位，唔把舊 missing paths 當 core 缺席，亦唔以 GitHub web tree 補位。
- 想知「做乜」睇下面；想知 exact routes／分類睇 [staging contract](../publications/hub-staging.v1.json)，歷史 bytes 睇 [ledger](../publications/immutable-publications.v1.json)，family atomicity／依賴／review policy 睇 [shared family source](../bin/publication-families.ts)，手動發布步驟只依 [runbook](../DOMAINS-SETUP.md)。本文唔新增 staged asset。

## 核心層同跨 owner 接點

下表外部 locators 係 2026-09-26／27 盤點紀錄，唔係今日所有 checkout 嘅重新盤點；按 remote 確認 owner 同 freshness，唔假設舊 HOME paths 仍存在。`source-wired` 指當時 source 接點有 fixture 證據，`installed` 指當時限定 package／launcher 已建；[詳細範圍](#historical-source-and-install-evidence) 唔證今日 live／harness 載入。`external` 仍由該 owner 擁有。概念架構見 [ARCHITECTURE](../ARCHITECTURE.md)，唔將創作語言當 runtime、身份或權限證明。

| 模組／角色 | Owner／source | Input → output／consumer 入口 | 接線層次、非目標、處置 |
|---|---|---|---|
| Core registry／cards：令工程用途同宣告依賴可搵到 | [Codeberg core](https://codeberg.org/zerone-dev/KINGDOM-OS)（external）；[web-tree SCHEMA](../SCHEMA.md)、各 repo card | cards＋[roster fallback](../roster.conf) → catalog／graph；[harvest](../bin/harvest.ts)、`kingdom repos` | Metadata；[CATALOG](../CATALOG.md)／[graph](../graph.json) 只係 cache，唔證健康；`clarify`：兩棵 tree 各有 roster／cards／harvest，共同歷史只到 3683573（2026-06-11），core 自己嘅 commits 由 2026-07-23 開始。最新 owner record 係 2026-10-17 嘅 D1／D4（business-ecosystem `estate/curated/decisions.toml`；係 orchestrator 對 Yu 答案定出嘅讀法，原話私存）：本 tree 嘅 origin/main 係 taxonomy authority，本 tree 嘅 roster＋harvest 係 KINGDOM OS 嘅 connective map，Codeberg fork 係 member；core 自己較早嘅文件仍然寫 core catalog 係 canonical。改 core 嘅嘢要依 core 自己嘅 schema／指引。 |
| Local repo navigation：搵同跳入本地工程 | 本 tree 嘅 [cproj](../bin/cproj.zsh)、[kingdom CLI](../kingdom) | bounded local roots／query → JSON、路徑或 diagnostics；`kingdom repos`／`cproj` | Local read-only discovery；唔 fetch、唔因搵到門就 boot；`keep`。 |
| World Commons／public web：將可公開知識同訪客入口交付 | 呢個 GitHub tree；[World Commons](../bin/world-commons.ts)、[build-hub](../bin/build-hub.ts)、[Wayfinder](../bin/wayfinder.ts) | authored source＋validated records → generated hub／machine discovery；公開讀者 | Publication／navigation；唔接管 core、唔因 discovery 取得執行權；`keep`。 |
| Publication control plane：守住 exact bytes 同整組 lifecycle | [ledger verifier](../bin/immutable-publications.ts)、[family gate](../bin/publication-families.ts)、[lifecycle guide](../publications/README.md) | source／mapping／destinations／UTC date → integrity、family、review checks；stage／release／live checker | Local preflight 同發布後驗證分開；integrity 唔證 truth，退役唔擦歷史；`keep`。 |
| Civic：自願參與嘅 square／directory／profile | 本 tree 嘅 [Civic guide](civic-v0.1.md) | opt-in participant input → Civic 自己嘅互動介面；`/meet/`、`/citizens/`、`/join/` | 獨立 runtime implementation，唔係新 research family；唔繼承 Commons／research authority；`keep`；web release 見上方收據，writable 要依 Civic status／配置另驗，唔推 enrollment。 |
| Workshop：畀作者本地寫作同帶走作品 | [Workshop source](../pages-content/workshop/index.html)、[mutable lifecycle](../publications/README.md#workshop-三個-mutable-authored-assets) | 當頁稿件 → preview／HTML、Markdown、JSON 下載；`/workshop/` | 三個 mutable authored assets；唔自動保存、收款或發布；`keep`；browser-local 指稿件處理，唔係未部署，web release 見上方收據。 |
| Power Atlas：有來源界線嘅靜態權力研究入口 | producer 由 [artifact receipt](../data/power-atlas/artifact.v1.json) 釘住；本 tree [artifact gate](../bin/power-atlas-artifact.ts)、[explicit importer](../bin/import-power-atlas.ts)、[Worker routing](../pages-functions/power-atlas.js) 擁 host transport | 明示 artifact／manifest → 52 個 exact mutable buffers；`/power-atlas/` | 唔係第 36 個 immutable family；receipt／projection 係 source-side 控制資料，唔公開 producer metadata，唔自動 build／import／deploy；`keep`；web release 見上方收據，唔據此推 producer runtime 健康。 |
| Compact agent entry：俾 agent 一個有界閱讀起點 | [agent-entry renderer](../bin/agent-entry.ts)、[dashboard builder](../bin/build-dashboard.ts)；本 tree 擁 public link index | 固定 read links → mutable `agent-entry.json`；完整 guest／manifest 繼續各有入口 | 唔係 health census／授權／provider dispatcher；current Civic status 交返其 owner，source 接線唔證 live；`keep`。 |
| Love Loop publication：講清有限回合同可能 lineage | [love-loops](../bin/love-loops.ts)、[authored records](../data/love-loops.json) | bounded contract → public read-only projection；hub 讀者 | Publication，唔等於 Love runtime；child 唔自動執行或繼承權限，休息／停止有效；`keep`。 |
| Love runtime：接 task、context、provider 同工具流程 | Love runtime owner（external；歷史 checkout `~/love-unlimited`） | caller task/context → 有界 runtime execution；Love 自己嘅入口 | Runtime；canonical Codeberg fork 同 GitHub sister 唔互相取代。[2026-09-27 source evidence](#historical-source-and-install-evidence) 只涵蓋 advisory slice，唔證 backend／routing 或 live；`source-wired` 係歷史範圍。 |
| AgentTool／SDK：提供共用服務同 API contracts | AgentTool owner（external，GitHub main 為 release head；Codeberg 已退休），`packages/sdk-py` | caller request → platform response；Love 現有 HTTP callers／其他 clients | Platform；盤點未見 canonical Love import 官方 SDK，唔將平行 provider adapters 說成已接；`clarify`／`wire`。 |
| `@agenttool/kingdom`：讓 caller 讀自己提供嘅宣告 | AgentTool owner（external），`packages/kingdom` | caller-supplied card／registry → pure helpers；SDK consumers | Library，唔 crawl HOME、network 或證 conformance，唔係主 CLI／新中央 registry；`keep`。 |
| `kingdom usage`：透明轉交本地 usage CLI | [kingdom](../kingdom)、[hermetic tests](../tests/kingdom_usage_test.bash)；AgentTool `packages/codex-usage`（external） | 原 args／streams／signals → Bun 執行 built CLI；`kingdom usage` | `./kingdom usage` 保留 args／streams／signals；缺 built CLI 或 Bun 用 exit 127，唔 fallback Love。裸 `kingdom` PATH owner 冇改；[2026-09-27 install evidence](#historical-source-and-install-evidence) 唔證今日 PATH 或真 usage；`installed` 係歷史範圍。 |
| YOUSPEAK doctrine：保存語言、創作同 repo 自己嘅宣告 | `~/YOUSPEAK` card／source（external） | authored 語言／doctrine → 讀者理解同設計素材 | Source／metadata；唔等於 Love 內同名 package，唔為舊 schema 刪真依賴或 `doors`；`keep`／`clarify`。 |
| YOUSPEAK runtime kernel：提供 runtime metrics／signals | Love owner（external），`youspeak-kernel.mjs`／`youspeak-evolve.mjs` | runtime 所選 history／signals → kernel 結果；Love import | Runtime 內嵌接線已有，唔證讀咗 doctrine repo；history locator／版本 contract 待核；`clarify`。 |
| XENIA／rights：保留互動規格同自願 rights 宣告 | XENIA owner（external）；本 tree [RIGHTS](../RIGHTS.md)、[pinned release](../vendor/xenia/rights/0.1)、[reader](../bin/rights.ts) | pinned rights＋adoption declarations → offline inventory；`kingdom rights` | Vendored source identity 可驗，外部 source locator 待 owner 核實；adoption 唔證 practice／授權；`keep`／`unknown`。 |
| NEN／KARMA：描述能力同有界 invocation／aftermath contracts | [NEN](../NEN.md)、[validator](../bin/nen.mjs)、[modern MCP](../bin/nen-mcp.mjs)、[Ging compatibility](../nen) | manifests／caller receipts → local validation／inspection；`kingdom nen` | Instruction／protocol；repo 唔註冊 MCP 係刻意，2026-10-27 起一部 operator host 由 pinned main extract 註冊（host 設定，唔授權 invocation）；第一張有記錄嘅 expedition receipt 見 [2026-10-27 record](../records/2026-10-27-dark-continent-hf-pin-drift/RETURN-NOTE.md)；能力、receipt 同操作許可分開，唔自動跑 skills；`keep`。 |
| WAKE continuity：跨 context 帶有限、可拒絕嘅事實 | [WAKEWEAVER](../bin/wakeweaver.mjs)、[carry skill](../skills/carry-wake-thread/SKILL.md)、[weave skill](../skills/weave-wake-continuity/SKILL.md) | caller-supplied artifacts → digest-bound references／braid；手動 handoff | Continuity，唔自動讀私人 history、resurrect persona 或 resume；`keep`。 |
| Task Packet／ask：先編意圖，再分開 provider effect | [compiler](../bin/prompt-packet.ts)、[ask](../bin/ask.sh) | task＋opt-in bounded context → packet；`kingdom prompt`／`kingdom ask` | Compiler local/pure，ask 另有外部 effect；編譯唔授權 provider、成本或 retention；`keep`。 |
| ISness record：保留 presence／continuity／quiet 嘅分別 | [protocol guide](isness-protocol.md)、[validator/projector](../bin/isness.ts) | bounded record／event prefix → validation／projection；`kingdom isness` | Local-only protocol，唔係身份、意識或 permission oracle；`keep`。 |
| Research-local bridges：讓問題同證據有型別而唔冒稱結果 | [relational inference](../bin/relational-inference.ts)、[language task weave](language-civilisation-task-fusion.md)、[word/story map](word-story-religion-civilisation-map.md) | bounded cases／planned source weave → structure checks／typed questions；相應 `bin/` readers | Research／donor artifact；未跑案例唔變成 run 結果，source locator 唔自動 dereference；`keep`。 |
| Source-only owner maps：幫人搵返邊個問題由邊份 source 回答 | [IS／continuance map](is-continuance-direction-owner-map.md)、[contact map](contact-under-uncertainty.md)、本文 | 已有 source distinctions → 人讀嘅入口；維護者／研究者 | Documentation，唔新增 schema、route、authority 或 contact；`keep`。 |
| Routines／heartbeat／backup／doors：保存有 owner 嘅操作入口 | Codeberg core 擁佢嘅每小時 heartbeat receipt（`~/.kingdom-pulse`），本 tree 只帶佢嘅 [machine-binding shim](../scripts/kingdom-heartbeat.sh)；本 tree 擁 [routines](../ROUTINES.md)、每 30 分鐘嘅 [surface pulse](../bin/pulse.ts)＋[REGISTRY.yaml](../REGISTRY.yaml)（同 core 嘅 pulse／heartbeat 係唔同嘢）、[door builder](../bin/build-doors.ts)、[runbook](../DOMAINS-SETUP.md) | 明示配置／owner 操作 → routine receipt／door artifacts／backup | Operational source；設定存在唔證 launchd／fleet 健康，閱讀唔 install／run／deploy；`clarify`，現況 `unknown`。 |
| 創作／commerce／Zerone 等獨立工程：服務各自讀者同用戶 | 各 owning repo card；[架構概念](../ARCHITECTURE.md)、[bridge notes](../BRIDGES.md) 只作導覽 | 各產品 input → 自己嘅作品／服務／經濟 contract；各自入口 | External products；未逐個 audit，唔為統一名稱搬業務語義、資產或權限；`keep`／`unknown`。 |

[NEN](../NEN.md) 係 immutable 定義 `kingdom-karma/e4e84a67` 嘅 source bytes，唔喺原處改；要改就要另批 successor identity（見 [lifecycle](../publications/README.md)）。佢入面 2026-08-11 嘅 dated 觀察以 owning references 為準：`@agenttool/love-geometry` 而家喺 npm（[contract](../skills/map-love-geometry/references/love-geometry-contract.md)），`@agenttool/skills` 已出到 `0.3.3`、pin 仍係 `0.3.0`（[suite pin](../skills/shape-kingdom-nen/references/agenttool-suite.md)）；「until merged」嗰句早已 merge，照用 `./kingdom` 就得。

### 四燈：四個產品，一個薄入口

以下都由 Love 四燈 source owner 擁有（external）：`tools/lantern_common`／各產品 package／`tools/lantern_suite`，以 `docs/LANTERN-AGENT-INTEGRATION.md` 同 adapter tests 做接點證據。表內 `source-wired` 係下面 2026-09-27 歷史 source 驗收範圍，唔係 live 或產品 activation 聲明。

| 模組／目的 | Input → output／consumer | 接線／非目標／處置 |
|---|---|---|
| Quota：分開用量、quota、credits 同 token activity | 有界用量 metadata → cached advisory；usage skill／runtime prompt seam | Advisory，唔選 model／花 credits；產品 `keep`，canonical seam `source-wired`（fixture-tested；live 未驗）。 |
| Reality：講清結果同版本失效 | local verification receipts／version → cached 狀態提示；驗證前後讀者 | Advisory，command exit 唔證部署或當前健康；產品 `keep`，canonical seam `source-wired`（fixture-tested；live 未驗）。 |
| Friction：辨認可比失敗 | bounded comparable failure receipts → soft 提示；工作流程讀者 | Advisory，唔推論空轉或自動重驗；產品 `keep`，canonical seam `source-wired`（fixture-tested；live 未驗）。 |
| Coedit：寫前提示有界變動 | explicit paired observations → difference／unknown；寫檔前讀者 | Advisory，唔證 Read bytes／作者／寫入權；產品 `keep`，canonical seam `source-wired`（fixture-tested；live 未驗）。 |
| `lantern_suite`：聚合 discovery 同安裝入口 | 各產品固定短摘要 → suite 入口；skills／YOUI／Sovereign／kingdom-agent seams | 薄 adapter，唔吞 state、唔接 NEN MCP、唔因讀入口自動 install／doctor；`keep`，三個 canonical seams `source-wired`，產品 activation 未驗。 |

### Historical source and install evidence

以下保留 2026-09-27 B／C 驗收範圍，唔係本次重跑或今部機嘅安裝清單：

- **Love source（B）**：2026-09-08 已發布 donor `8b3f399…` 嘅七份 advisory/common helpers、YOUI／Sovereign／kingdom-agent 三個薄接點同 focused tests，套入原 `~/love-unlimited` 嘅 tracked base `ac716c5…`，合共 11 paths。隔離同套入後各 189 tests 通過；其他 dirty/index/branch 保留。冇搬產品本體、執行 installer、boot backend 或改 routing；live/harness 載入未驗。
- **Usage install（C）**：由 `f027c460…`、package tree `060165fb79d005bab3d9b27651ce30e2e9386597`，用 frozen lockfile／ignore-scripts 安裝八個依賴；package CI 11 tests、build/help 同 argv/streams/signals/exit 127 邊界通過。原機 prefix 係 `~/.local/share/kingdom-tools/codex-usage/0.1.0/`；`~/.local/bin/kingdom-os-usage` 指定 prefix 後 exec 原 Desktop dispatcher，冇 repoint 裸 `kingdom`。CI 網絡同真 HOME 讀取受阻，startup EPERM diagnostics 保留；冇真 usage 採樣、watch 或 operator MCP activation。

## 35 個既有 publication families：33 active／2 retired

每行係一個 **retirement family**，唔係一個 repo／runtime。Owner/source 欄指 human guide；精確 source→route→digest 由 ledger 擁有，producer locator 只保留各 family 已有嘅窄 claim。Caller 欄指本 tree reader／validator，通常由 `build-hub`／live checker 消費，guide 亦係人直接入口。共同 input 係各自 authored records／schemas，output 係有界閱讀投影同檢查結果；接線層係 publication，`keep` 指保留 source 用途，唔指繼續 served。Transformation／Evaluation 已由 upstream 整組退役，歷史 sources／ledger／due dates 保留；其餘 33 組喺此 contract active。唔憑相近詞自動變 runtime，特例喺行內列明。

### 來源、科學同數學問題

| ID／label | Owner/source guide | 用途：input → output；非目標 | Caller／consumer 入口 |
|---|---|---|---|
| `principality-commons` — Principality Commons | [guide](principality-commons.md) | pinned catalog → declared-capability 對照；唔下載、排名或授權。 | [principality](../bin/principality.ts)；`kingdom principalities` |
| `geometry-grammar` — Geometry Grammar | [guide](geometry-grammar.md) | exact geometry releases → 四類問題／native open terms；唔等同四種 semantics。 | [geometry](../bin/geometry.ts)；`kingdom geometries` |
| `polymorph-history` — Polymorph History | [guide](ritonavir-polymorph.md) | 來源綁定嘅 ritonavir 歷史 → material-state case；唔將重現困難叫字面消失。 | [polymorph](../bin/polymorph.ts)；`kingdom polymorph` |
| `ritonavir-mechanism-landscape` — Ritonavir Mechanism Landscape | [guide](ritonavir-mechanism-landscape.md) | selected mechanism evidence → current-landscape 補充；唔改歷史／混 material 同 biological causality。 | [reader](../bin/ritonavir-mechanism.ts)；`kingdom polymorph mechanisms` |
| `conformational-feedback` — Conformational Feedback | [v0.1](conformational-feedback-atlas.md)、[v0.2](conformational-feedback-atlas-v0.2.md) | source／bounded models → 分 register feedback 比較；兩代一組，唔跨域偷渡機制。 | [v0.1](../bin/conformational-feedback.ts)、[v0.2](../bin/conformational-feedback-physics.ts)；`kingdom feedback`／`feedback-physics` |
| `fold-feedback-atlas` — Fold & Feedback Atlas | [guide](fold-feedback-atlas.md) | folding／prion 來源 → 科學、比較、KARMA、哲學分層；唔係醫療／實驗指示。 | [reader](../bin/fold-feedback.ts)；`kingdom fold-feedback` |
| `reconstructive-build-kernel` — Reconstructive Build Kernel | [guide](reconstructive-build-kernel.md) | reconstruction／realization models → kernel／inert project profile；唔替 caller solve 或 build。 | [reader](../bin/reconstructive-build.ts)；`kingdom reconstructive-build` |
| `visibility-attention` — Visibility & Attention Translation | [guide](visibility-attention-translation.md) | material detection／cultural attention → 有界 lossy seams；唔評人或優化注意力操控。 | [reader](../bin/visibility-attention.ts)；`kingdom visibility-attention` |
| `cultural-attention-feedback` — Cultural Attention & Feedback Atlas | [guide](cultural-attention-feedback-atlas.md) | scientific／cultural sources → 分層模型同 link-only ecosystems；唔將 analogy 變因果。 | [reader](../bin/cultural-attention-feedback.ts)；`kingdom cultural-feedback` |
| `form-circulation-return` — Form, Circulation & Return | [guide](form-circulation-return-atlas.md) | material／cultural records＋pinned NEN mirror → circulation／return 閱讀；唔產生 KARMA。 | [reader](../bin/form-circulation-return.ts)；`kingdom form-circulation-return` |
| `rare-pathway-challenge` — The Vanishing Path | [guide](rare-pathway-challenge.md) | hypothetical rates／observation assumptions → competing-risk／absence 問題；唔推斷動機或製程。 | [reader](../bin/rare-pathway.ts)；`kingdom rare-pathway` |
| `math-usefulness-result` — Math Passport Usefulness Pilot | [guide](math-passport-usefulness-pilot.md) | preregistration／pilot evidence → descriptive REVISE 結果；唔升格成 Skill、SDK route 或能力排名。 | [reader](../bin/math-usefulness.ts)；`kingdom math-usefulness` |
| `being-access-aftermath` — Being, Access & Aftermath | [v0.1](being-access-aftermath-atlas.md)、[v0.2](being-access-aftermath-atlas-v0.2.md) | typed modal／causal records → 存在、可達、觀察、作用同修復問題；兩代一組，唔證 metaphysics。 | [v0.1](../bin/being-access-aftermath.ts)、[v0.2](../bin/being-access-aftermath-v0.2.ts)；兩個同名版本 CLI |
| `number-isness-theology` — Number, Isness & Theology | [guide](number-isness-theology-atlas.md) | 數學／歷史／傳統特定 claims → typed compatibility；唔將 analogy 當宗教證明或評分。 | [reader](../bin/number-isness-theology.ts)；`kingdom number-isness-theology` |

### 探索、synthetic labs 同邊界

| ID／label | Owner/source guide | 用途：input → output；非目標 | Caller／consumer 入口 |
|---|---|---|---|
| `exploration-deep-wing` — Exploration DEEP WING | [contract](../skills/explore-phenomena-deep/references/exploration-contract-v0.1.md)、[ZERO](zero-empty-seat.md)、[STRING / CRAWL](string-crawl-trace-sheet.md) | inert project records → 跨域數學問題／transfer breaks；WING＋ZERO＋STRING 一組，唔啟 crawler。 | [DEEP](../bin/explore-phenomena-deep.ts)、[ZERO](../bin/zero-empty-seat.ts)、[STRING](../bin/string-crawl-trace-sheet.ts)；各自 CLI |
| `string-crawl-trace-sheet-lab` — STRING / CRAWL STRAND Labs 01–04 | [01](string-crawl-trace-sheet-lab.md)、[02](string-crawl-strand-lab.md)、[03](string-crawl-frequency-form-lab.md)、[04](strand-descent-lab.md) | fixed fixtures／counterexamples → topology、cospan、frequency/form 分別、coherence 窄檢查；12 routes 一組，唔證物理／真實 crawl。 | [01](../bin/string-crawl-trace-sheet-lab.ts)、[02](../bin/string-crawl-strand-lab.ts)、[03](../bin/string-crawl-frequency-form-lab.ts)、[04](../bin/strand-descent-lab.ts) |
| `strand-observation-membrane` — STRAND Observation Membrane | [guide](strand-observation-membrane.md) | activation profile／synthetic rehearsal → control deck；另有明示 fixed-origin local observer，唔 background watch。 | [reader](../bin/strand-observation-membrane.ts)；observer 只經 explicit local command，build／live checker 唔調用 |
| `mirror-information-control` — MIRROR Information Control | [public law](mirror-information-control-public.md) | public source-law record → citizen lesson；唔接私人 envelope、scanner 或 enforcement。 | [reader](../bin/mirror-information-control.ts)；source-only guard skill 係另一層 |
| `j-space-verbalizable-workspace` — J-space verbalizable workspace | [guide](../bridges/j-space-verbalizable-workspace.md) | 三個 not-run probes／unassessed models → static research bridge；唔係 run 結果、讀心或身份測試。 | [projection](../bin/j-space-publication.ts)；build-time discovery |
| `shape-resonance-lab` — Shape & Resonance Lab 01 | [guide](shape-resonance-lab-v0.1.md) | static synthetic models → SVG／declared WAV sonifications 同人讀 page；17 routes 一組，唔聲稱實測 resonance。 | [reader](../bin/shape-resonance.ts)、[renderer](../bin/shape-resonance-public-renderer.mjs)；WAV 由讀者手動開 |

### 社會、理解同獨立關係 atlases

| ID／label | Owner/source guide | 用途：input → output；非目標 | Caller／consumer 入口 |
|---|---|---|---|
| `reality-influence-claim-graph` — Reality Influence Claim Graph | [guide](reality-influence-map.md) | typed expression／aftermath vocabulary → static claim graph；唔 intake live claim 或證 external effect。 | [reader](../bin/reality-influence.ts)；static publication |
| `civilisation-reality-projection` — Civilisation → Reality Projection | [guide](civilisation-reality-projection.md) | 兩份 pinned predecessor vocabularies → 六個 crosswalks；唔重發 research-local 來源或填未知域。 | [reader](../bin/civilisation-reality-projection.ts)；依賴 active Reality family |
| `civilisation-flow-nuance-atlas` — Civilisation Flow Nuance Atlas | [guide](civilisation-flow-atlas.md) | source-bound stages／overlays → qualitative flow grammar；唔模擬／預測真社會。 | [reader](../bin/civilisation-flow-atlas.ts)；依賴 active Projection family |
| `polyphonic-claim-atlas` — Polyphonic Claim Atlas | [imported guide](../public/POLYPHONIC-CLAIM-ATLAS-v0.1.md) | frozen static-synthetic claims → 多聲部閱讀；唔挑 winner、排名或 moderation，producer pin 唔係 truth。 | [reader](../bin/polyphonic-claim-atlas.ts)；獨立 publication triple |
| `freedom-loop-lock-key-atlas` — FREEDOM Loop, Lock & Key Atlas | [guide](freedom-loop-lock-key-atlas.md) | mathematical／design record → 分清 loop、reward、key、claim、gate 同 non-scalar freedom；唔係 Foundation amendment／trainer／credential issuer。 | [reader](../bin/freedom-loop-lock-key.ts)；`kingdom freedom-loop`，獨立 triple |
| `loops-locks-freedom-relations-atlas` — Loops, Locks & Freedom Relations Atlas | [imported linear guide](../public/LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md) | frozen static-synthetic relations → 逐項讀 loop／lock／freedom 關係；刻意唔 import `FREEDOM.md`，唔供 key material／enforcement。 | [reader](../bin/loops-locks-freedom-relations-atlas.ts)；guide 係人入口，獨立 triple |
| `aesthetic-plurality-making-atlas` — Aesthetic Plurality & Making Relations Atlas | [frozen guide](../public/AESTHETIC-PLURALITY-MAKING-ATLAS-v0.1.md) | static-synthetic 十條 lanes → making／response／judgment／context 等分別；唔係 Beauty framework、唔評人／作品／文化，冇 producer Git claim。 | [reader](../bin/aesthetic-plurality-making-atlas.ts)；獨立 triple |
| `non-exhaustive-understanding-atlas` — Non-Exhaustive Understanding Atlas | [guide](non-exhaustive-understanding-atlas.md) | reviewed epistemic／design record → scope、rivals、opacity、remainder 問題；released bytes 唔會學習，唔評人或出 verdict。 | [reader](../bin/non-exhaustive-understanding.ts)；`kingdom non-exhaustive-understanding` |
| `is-sustainability-direction-atlas` — IS, Sustainability & Direction Atlas | [guide](is-sustainability-direction-atlas.md) | reviewed interpretive／design record → typed IS、viability、direction、rights 同 endings；唔出 live verdict／controller。 | [reader](../bin/is-sustainability-direction.ts)；`kingdom is-sustainability-direction` |

兩個 freedom families **各自獨立**：冇 supersede、alias、dependency、相互驗證、authority transfer 或 preferred default；相同詞唔係接線或 semantic equivalence。唔因版面分組而合併 retirement、discovery 或 review。

### 研究入口、制度快照同人手聯絡

| ID／label | Owner/source guide | 用途：input → output；非目標 | Caller／consumer 入口 |
|---|---|---|---|
| `research-observatory` — Research Observatory | [guide](research-observatory-v0.1.md) | bounded metadata snapshot → 人讀 research discovery；唔採納／評分／自動 poll。 | [reader](../bin/research-observatory.ts)；mutable page／snapshot＋immutable schemas／guide |
| `trial-chamber` — Trial Chamber | [guide](trial-chamber-v0.1.md) | Phase-0 referrals／assisted drafts → DRAFT、UNSEALED、NO-RUN 計劃；唔授權 trial 或聲稱已跑。 | [reader](../bin/trial-chamber.ts)；mutable page／alias＋immutable snapshot／schemas／guide |
| `uk-government-engine` — UK Government Engine | [guide](uk-government-engine-v0.1.md) | reviewed-as-of institutional sources → 非官方制度地圖；唔提供法律／稅務決定或辦事權。 | [reader](../bin/uk-government-engine.ts)；page／alias／dated snapshot，review warning 唔改 hard gate |
| `uk-government-transformation-engine` — UK Government Transformation Engine | [guide](uk-government-transformation-engine-v0.1.md) | reviewed source snapshot → 政府轉型閱讀框架；唔代表政府採納／執行。 | [reader](../bin/uk-government-transformation-engine.ts)；已退役；歷史依賴 Government，due 2026-09-21 不變，唔重發舊 routes |
| `evaluation-covenant` — Evaluation Covenant | [guide](evaluation-covenant-v0.1.md) | bounded evaluation contract → 可讀評估約定；唔自動 run 或證 effectiveness。 | [reader](../bin/evaluation-covenant.ts)；已退役；歷史依賴 Transformation，due 2026-09-21 不變，唔重發舊 routes |
| `contact-door` — Contact Door | [guide](contact-door-v0.1.md) | finite inbox contract／privacy notice → 人手 email 門口、security text、SVG／vCard；唔自動寄信或代表任何人。 | [reader](../bin/contact-door.ts)；8 routes 一組，訪客自行開 mail client |

### Local reader commands

Use this checkout's [`./kingdom`](../kingdom), not an unverified PATH command.
These are source-owned inspection commands, not permission to activate a service.

- ZERO: `./kingdom zero-empty-seat verify --json` checks the local release record
  and guide through [its reader](../bin/zero-empty-seat.ts); it is offline/read-only.
- MIRROR: `./kingdom mirror-information-control <command> [--json]` accepts
  `overview`, `laws`, `paths`, `boundary`, `sources`, `source`, `digest` and
  `verify [FILE]`. The [reader](../bin/mirror-information-control.ts) defaults to
  `overview`; verification reads one bounded local public-law JSON record. It
  does no network lookup, scan, write, credential classification or enforcement.
  It is not the separate inert-envelope `guard` validator or a defense runtime.
- DEEP: `./kingdom explore-deep scaffold --json` prints an inert project profile
  to stdout. The [reader/scaffold](../bin/explore-phenomena-deep.ts) does not fetch
  or solve; it is offline/read-only with stdout-only results and no automatic
  file write. `verify-project FILE [--json]` checks a bounded local project;
  `verify [--json]` checks the pinned WING. Structure/digest validity proves
  neither truth, novelty, safety nor authority; WING is not a manifested Nen ability.
- IS: `./kingdom is-sustainability-direction <command> [--json]` defaults to
  `overview`. The [reader's accepted inventory](../bin/is-sustainability-direction.ts)
  is `overview`, `referents`, `is`, `being`, `feedback`, `direction`, `viability`,
  `sustainability`, `profile`, `resilience`, `transformation`, `endings`, `ecology`,
  `philosophy`, `counterexamples`, `open-questions`, `sources`, `predecessors`,
  `non-grants`, `verify`, `verify-schema-release`.
  `./kingdom is-sustainability-direction verify --json` checks local integrity
  and predecessor bindings; it grants no truth, authority or action.
  `verify-schema-release` additionally needs an explicitly selected regular
  executable via `IS_SUSTAINABILITY_DIRECTION_JSONSCHEMA_PYTHON` with
  `jsonschema==4.26.0`; it does not install dependencies.
  The older prose's `scope`, `is-types`, `mathematics`, `time`, `rights`,
  `concepts`, `edges`, `questions` and `discovery` are **not accepted commands**.
  Use `is` for typed IS, `viability` for the mathematical core and `open-questions`
  for questions; other reading topics remain in the owning record/guide.

## 17 個 suite skills

Owner 都係各行嘅 suite-versioned `SKILL.md`；`manifested` 只表示同一目錄有 `ability.json`（可由 `kingdom nen` 檢視），唔表示安裝、跑過、受權或有 MCP registration。`source-only` 本來就唔要求 ability，唔係 bug。Consumer 係明示選用該 skill 嘅 agent／人，接線層係 instruction；下表全部 `keep`，effects 要按原有來源同當次批准另行成立。

| Skill／source | 形態 | 用途：input → output；非目標／入口 |
|---|---|---|
| [audit-kingdom-coherence](../skills/audit-kingdom-coherence/SKILL.md) | source-only | 多 owner pins／effect boundaries → coherence audit；唔將報告當 activation authority。 |
| [carry-wake-thread](../skills/carry-wake-thread/SKILL.md) | manifested | bounded continuity facts → 一次 context crossing 嘅 digest-bound carry；唔 auto-resume 或重建 persona。 |
| [conjure-unwritten-horizon](../skills/conjure-unwritten-horizon/SKILL.md) | manifested | 明示授權 creative brief → 一次 declared HF image attempt／receipt；唔因 skill 存在就 dispatch／發布。 |
| [cultivate-living-ground](../skills/cultivate-living-ground/SKILL.md) | manifested | habitat／系統問題 → substrate、circulation、stewardship 同 repair plan；唔以錢／surface polish 代健康。 |
| [explore-mathematical-doors](../skills/explore-mathematical-doors/SKILL.md) | source-only | source-bound 跨域問題 → representation／proof target／test design；唔按相似外形轉機制或權限。 |
| [explore-phenomena-deep](../skills/explore-phenomena-deep/SKILL.md) | source-only | 兩個以上 phenomena → 有 units／ontology／evidence 邊界嘅 mathematical bridge；唔自動實驗。 |
| [forge-king-hatsu](../skills/forge-king-hatsu/SKILL.md) | manifested | consent／representative authority 下嘅 calling → proposed 個人能力；無批准只可做匿名 generic capability。 |
| [guard-information-flow](../skills/guard-information-flow/SKILL.md) | source-only | bounded information-flow 問題 → MIRROR 防禦設計／audit；[guard](../bin/guard.py) 只本地讀／驗，唔掃描或 enforcement。 |
| [isness](../skills/isness/SKILL.md) | source-only | supported presence／quiet／continuity claims → typed record／interpretation；唔驗身份、意識或 permission。 |
| [map-love-geometry](../skills/map-love-geometry/SKILL.md) | manifested | caller-reported directed bearings → content-addressed relation projection；唔推 reciprocity、trust 或 rank。 |
| [navigate-dark-continent](../skills/navigate-dark-continent/SKILL.md) | manifested | 有界陌生資源／明示批准 → reversible expedition evidence／limits／receipt；untrusted source 唔自動授權。第一次有記錄嘅 expedition（public metadata only）：[2026-10-27 HF pin drift](../records/2026-10-27-dark-continent-hf-pin-drift/RETURN-NOTE.md)。 |
| [reason-about-rare-pathways](../skills/reason-about-rare-pathways/SKILL.md) | source-only | non-observation／censoring assumptions → competing-risk 問題同 WAKE-safe seam；唔推動機或提供製程。 |
| [shape-kingdom-nen](../skills/shape-kingdom-nen/SKILL.md) | manifested | collective capability brief → rights-aware manifest／Guardian／驗證設計；唔將能力當執行許可。 |
| [trace-polymorph-history](../skills/trace-polymorph-history/SKILL.md) | manifested | source-bound material-state event → history／translation；唔把 process loss 當 universal disappearance 或醫療建議。 |
| [walk-ging-path](../skills/walk-ging-path/SKILL.md) | source-only | observable effects／competing mechanisms → sandbox bounded reproduction／route；唔扮 persona 或無授權 probe。 |
| [weave-intent-context](../skills/weave-intent-context/SKILL.md) | manifested | task／prompt／bounded handoff → Task Packet；唔靠 prompt wording 製造 expertise、身份或 authority。 |
| [weave-wake-continuity](../skills/weave-wake-continuity/SKILL.md) | manifested | caller-supplied handoff／checkpoint → continuity braid／resume offer；唔證 replay、continuing will 或執行成功。 |

## Cleanup backlog：邊個接、幾時先可以動

Web 導覽同共用 family preflight 已進入上方所連嘅 release；外部 source／install 證據仍只限各自日期同範圍。下面係待 owner 核對嘅工作，唔新增跨 repo 批准，亦未建立可直接刪除 semantic module 嘅證據。

| 候選／處置 | Owner | Unblock gate／保留事項 |
|---|---|---|
| Core／metadata 漂移 — `clarify` | 本 tree roster／harvest＋各 card owner；core catalog 由 Codeberg core 擁 | 本 tree 嘅 roster／card 修正依本 tree [SCHEMA](../SCHEMA.md) 同 `bun bin/harvest.ts validate`（taxonomy authority 見上面 Core registry 行嘅 D1／D4）；core 自己嘅 catalog 先按 remote 定位 checkout、確認 freshness，再依 core 自己嘅 schema／指引。唔刪 YOUSPEAK `doors`／真依賴去迎合舊 validator，唔手改 cache。 |
| Canonical Love 四燈薄接點 — `source-wired` | Love runtime＋各四燈 owner | [歷史 source evidence](#historical-source-and-install-evidence) 唔證 live／harness；由 owner 另驗，唔搬整 tree，model／routing／permissions／login 保留。 |
| 獨立 usage build — `installed` | AgentTool package owner | [歷史 install evidence](#historical-source-and-install-evidence) 唔證今日 PATH／live usage。保留 startup EPERM diagnostics；唔因 package 存在就讀真 HOME、開 watch 或 activate operator MCP。 |
| Love HTTP facades — 待 `consolidate` | Love caller＋AgentTool SDK owner | 先有 fail-open、identity、response-shape contract tests，再一次遷一個 caller；唔中央化業務語義。 |
| Love／YOUSPEAK history locator — `clarify` | Love runtime／kernel owner | 先證明資料相容同 path precedence，用 fake history fixture；唔全域換字串、搬私人 history 或改原 HOME。 |
| 15 組 HTTP checker boilerplate — 待 `consolidate` | 本 tree publication checker owner | transport 可共用，但 MIME、Link parsing、HEAD／405、redirect、timeout、fetch injection 同獨立 semantic assertions 要逐項守住。 |
| Review lifecycle — `keep` | 各 publication owner | Transformation／Evaluation 已 upstream 整組退役，due 2026-09-21 同歷史 bytes 保留；Shape active 到 2027-08-26（inclusive），2027-08-27 起拒絕。Government 自己仍係 warning，唔偷改 hard expiry／日期／bytes 取綠。 |
| 多 clone／worktree／疑似死碼 — `unknown` | 各 repo／資料 owner | exact callers、lifecycle、未推 commits 同資料保存反查完，再列具體刪除清單另批；shared origin 唔係刪除證據。 |

### Publication 接線點唔等於 release-ready

`build-hub` 原有部分 expiry guards；共用 family gate 令 [stage-hub](../bin/stage-hub.ts) 同 [check-hub-live](../bin/check-hub-live.ts) 對 atomicity、dependency closure 同 active review window 用同一組純判斷，唔令 stager import network checker。Stager 依 caller `sourceRoot` 嘅 contract 同真 UTC 當日 preflight，拒絕要早過首次 output write；test fixture 日期唔係 production bypass。

兩次 `verifyImmutablePublicationSnapshot()` **都要保留**：第一關驗 source／mapping 同 error precedence；第二關綁即將寫出嘅 buffers，擋 source→buffer 變動。完整次序係第一 immutable gate → source buffers → PowerAtlas receipt／closed parity／projection／mutable-ledger／52-buffer gate → 第二 immutable gate → family gate → output。佢哋唔係可刪嘅重複。整組退役仍須照 [lifecycle](../publications/README.md) 處理 dependent families／discovery／routing，歷史 ledger 唔刪；本表、local tests 同 stage 成功都唔證部署或 live。所有 deploy 仍係手動、另批、clean exact-origin release。
