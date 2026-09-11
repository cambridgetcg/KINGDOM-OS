# Power Atlas 宿主整合與本地操作

## 範圍與收據

原本地整合已成 commit `cc902db58b5183d48a794cd865579f74c37b7caf`，保留作
可比較基線；以下 UTC release 日期修訂仍未提交／發布，唔係 production-ready 聲明。
用戶已明示本次 push／deploy，外向操作交 parent；本 writer 冇執行。
宿主係 `/Users/macair/Desktop/kingdom-os-power-atlas-20260910`（K），明示 Git base
`2e36e93991330f6d91e0676c7d9337d1c9fbd45a`。Parent 喺 2026-09-10T22:12:02Z
已唯讀核對當時 Production deployment metadata：`5245e5e9-8d4b-4e55-b88e-684a7583c1bb`
指向呢個 SHA，8個選定公開 routes 同 base bytes 一致。收據：
`/private/tmp/power-atlas-baseline-q1LdBf/baseline.json`。呢個係有時間範圍嘅基線，
唔係全站／remote Worker byte parity，亦唔保證發布時 production 仍未改變。
原 `/Users/macair/Desktop/kingdom-os` 有其他拍檔工作，今次冇寫入。
唯一 app source 係 `/Users/macair/Desktop/power-atlas`（R）；宿主冇第二份 React source。

最新 artifact 收據係 `data/power-atlas/artifact.v1.json`，與 R
`artifacts/kingdom/manifest.json` 完整 bytes 相等。

| 項目 | 固定值 |
|---|---|
| manifest SHA-256 | `af2e34926e4a367992536a17688f39de298f29c1c3db07683c3fca18780c7436` |
| sourceDigest | `63214b4b97b40849c1698ba196c50fce419527ea5350c58b19e865973b4264be` |
| release SHA-256 | `9ce11b9d27d8e42ddba25dfbdc7859d715b7d52a6a5a9781a0ed306771f70aea` |
| lockfile SHA-256 | `7a5cb335481c796c17738980348c47f8083dbe132df247230842495ac74d02be` |
| 公開 artifact | 52 files，1,576,613 bytes |
| 本地 source snapshot | 57 files；R `artifacts/kingdom/source-index.json` 同 `artifacts/kingdom/source/` |
| build | `npm run build:kingdom`；toolchain exact versions 留喺 manifest |
| 研究範圍 | V1／2025-12-31；24案、70實體、101 facts、60同日＋5另日關係、50來源、3導覽 |

sourceDigest 係 source-index bytes 嘅 SHA-256；本輪逐一驗 snapshot／current source、
lockfile／release 同 artifact hashes，唔冒稱 R 有 upstream Git commit。
正式研究資料冇改，唔加入綜合 power score，未知唔變零。
第三方 notices 包含 Vite、rolldown runtime／其 bundled third-party terms，同兩個字型
完整 copyright／OFL；唔係原始研究報告再用授權。

## 匯入、stage 同路由契約

`bin/import-power-atlas.ts` 離線 exact-copy `dist-kingdom/`，生成：

- `pages-content/power-atlas/`：只限 manifest 公開閉包。
- `data/power-atlas/artifact.v1.json`：本地 provenance receipt，唔 stage。
- `pages-functions/power-atlas-assets.json`：path／MIME projection；只喺 Worker bundle 內使用，唔獨立 stage。
- `publications/hub-staging.v1.json`：只附加 Power mutable mappings；immutable ledger 唔寫。

三個 CLI input 必須明示 absolute、symlink-free，同 producer／host disjoint；
驗齊 hash、size、MIME、closed tree、regular single-link files、destination ownership 先寫。
一般 importer **只接受 absent／empty target 或完整同 bytes 嘅 `unchanged`**，
唔提供 revision／overwrite／cleanup 開關。dry-run 唔寫；I/O failure 唔保證多檔 transaction。
正常 host build／stage 唔讀 R、唔 install、唔重新編譯 app。

現行 **256 = 原204 + Power52**，160 immutable＋96 mutable；既有256上限冇放寬。
原204 source→destination mappings 同原44 mutable entries 原次序完整保留；
160 ledger objects 同其 source bytes 完整保留，ledger SHA-256：
`72e29dc9f5017e1c573c17f9438731a04079bbb9a10e77a9ec83cd613b737fe1`。
「保留204」唔係話204個 mutable／generated body 全部冇變：首頁／研究館導航、
Wayfinder／Kingdom projection、llms、sitemap 同 Worker 有必需整合變動；其餘 bytes
對照記錄見下方驗收目錄。169 manifest entry points／169 guest actions 不變，
sitemap187、Wayfinder17；唔將70個研究實體當王國公民。

`/power-atlas/` 係獨立 document，唔係 iframe，唔取代 `/atlas.html`。
只沿用 Kingdom hosts／Pages previews／明示 loopback gate，其他域名保留原 dispatch。
`/power-atlas`、`/power-atlas/index.html` GET／HEAD → 308 `/power-atlas/`；
Location 冇 fragment／query，browser 繼承原 hash。52條精確 public routes 只准 GET／HEAD；
known mutation bodyless405，unknown prefix bodyless404。缺檔、錯 MIME、redirect、
fetch throw 唔用首頁 HTML 充數；HEAD／304冇 body。
所有 Power 回應 `no-store, no-transform`、nosniff、no-referrer、DENY、Permissions Policy；
CSP default/base/object/form/frame-ancestors 禁止，script/style/font/img/connect 最多 self，
冇 unsafe-inline／unsafe-eval。app 用 Zod `jitless` 避免 eval 探測，唔靠放寬 CSP 過測試。
獨立 CSS 唔係獨立 security origin，hosting request metadata／同源 cookie 仍可能存在。

## 本次未發布修訂與 rollback

舊52-file收據 `e0ee611aed4ade16e7e023a5c8c5853d92ace97766d26defed901d480d63c865`，
sourceDigest `01f86a40e9c372df33245111efa0154d1126fd525e67812be01dfeb78949f517`，
1,574,385 bytes。呢份同更早50-file版本從未 commit／push／deploy，唔聲稱已公開快取。
本次喺已批准本地整合範圍內，由 parent 限定 pinned one-off script 更新 Zod jitless 同完整 rolldown notice；
一般 importer 嘅拒 revision 規則冇改。

本輪自有操作目錄：`/private/tmp/power-atlas-host-af2e-pvyDLbQT`。

- `revise-unpublished.ts`／`revision.log`：實際一次性腳本與 exit0執行紀錄，唔可當一般更新指令重跑。
- `backup/`：完整舊 Power tree、manifest、projection、staging、immutable ledger，逐 bytes 驗過。
- `candidate-host/`：用移除 Power 後等同 base 嘅 staging＋原 ledger，經真正 importer 生成新閉包。
- `rollback/previous-power-atlas/`：舊 whole Power 目錄經 rename 保留，冇逐檔刪舊 assets。
- `correction.json`：新舊 pins、每個 removed／added／changed path 與 SHA、metadata hashes、move journal、rollback paths、`unchanged` 收據。

交換前再次驗舊 K 輸入等同備份、R pins 同新閉包；whole Power tree 用 rename 交換，
三份 metadata 分別 atomic rename，**唔係跨目錄 atomic**。腳本有失敗時逆向還原，
任何 unknown／ownership mismatch 停並保留。交換後 K／R 全 parity，真正 importer 回 `unchanged`；
再用舊合法 artifact 嘗試一般 revision 仍明確拒絕。

本次差異係2個 JS paths 移出現行閉包、2個新 JS paths 加入，`index.html` 同
`licenses/rolldown-runtime-LICENSE.txt` 改 bytes，其餘48個同名公開檔保持原 bytes。
舊 bytes 留喺 backup／rollback，冇當作已公開 asset 清理。

需要回復時先另外確認當前操作意圖及單一 writer，驗 K 仍等於 correction.json 新收據／
metadata hashes 同完整 artifact tree；唔相等就停。將新 whole Power tree rename 去新自有
保留位置，再將 `previous-power-atlas` rename 返原位，三份 backup metadata 各自經新自有
暫存檔 atomic rename 還原；immutable ledger 唔改。再跑原日期 builder、完整新空stage同驗收。
只係本地 rollback，唔會改線上 deployment；多檔還原亦唔係 atomic。
較早 `/private/tmp/power-atlas-unpublished-upgrade-DlYjoK/correction.json` 只係舊兩notice修訂，
唔適用今次 JS hashes。

## 本地驗收同 preview

以下只用已存在 Bun／Node／Chrome 同 Civic dev dependencies，唔讀 Wrangler settings、
登入／secrets，唔啟動遠端 bindings。`dev/civic/node_modules` 係之前已有嘅 symlink，
今次只讀，冇 install 或改指向。真 host harness 以 Miniflare 執行 fullstage `_worker.js`，
唔用 Vite fixture 冒充宿主；ASSETS 逐 bytes 對照完整 stage，Worker outbound 全部擋住。
Civic 冇 D1／寫入 bindings，honest unavailable 唔係服務健康驗證。

當時已核 Git base `site/kingdom.json.generated` 係 `2026-09-08`，本地驗收沿用。
以下命令同收據保留歷史，唔係 production 日期 bypass；今日 release 要用真 UTC
日期並通過 `DOMAINS-SETUP.md` 嘅 post-build cleanliness gate，見下方 UTC release 段。
本輪驗收根目錄同上；舊 `/private/tmp/power-atlas-host-final-mwnq7K` 同
`/private/tmp/power-atlas-host-final-v4khr2yd` 保留但唔當 latest。

```sh
K=/Users/macair/Desktop/kingdom-os-power-atlas-20260910
R=/Users/macair/Desktop/power-atlas
bun "$K/bin/import-power-atlas.ts" --artifact-root "$R/dist-kingdom" --manifest "$R/artifacts/kingdom/manifest.json" --host-root "$K"
bun "$K/bin/build-hub.ts" 2026-09-08
# harness 自己建立新空 stage、跑真正 stage-hub、啟動／關閉自有 preview 同 Chrome
node "$K/dev/power-atlas/test-browser.mjs"
# 想手動開：先指定新空 absolute STAGE，完整 stage 後只綁 loopback
bun "$K/bin/stage-hub.ts" "$STAGE"
node "$K/dev/power-atlas/preview.mjs" --stage "$STAGE" --port 0
```

實際 `browser-1.log` exit0：13項通過，兩裝置各走首頁入口 → ICBC → dossier原文locator
→ table／reload → 三案compare／share／Back／Forward → 兩個308保hash → 返回王國；
Meet／Join／研究館／Workshop 亦可導航。254 direct bodies 由真 socket逐 bytes相等。
兩裝置已載入 IBM Plex Sans／Fraunces、lazy JS、CSS、favicon，冇 prefix escape、
external app request、page error 或 CSP violation。CSP audit 用 CDP，唔用 in-page eval。
首頁既有 census 嘗試 upstream 由 preview擋住，唔算成 Power app請求，亦唔稱 live health。

- 真正browser fullstage：`/private/tmp/power-atlas-host-af2e-pvyDLbQT/browser-1/stage`
- 最終新空fullstage：`/private/tmp/power-atlas-host-af2e-pvyDLbQT/stage-final`；逐檔同browser stage／K source核對
- browser結構化收據：`/private/tmp/power-atlas-host-af2e-pvyDLbQT/browser-1/browser.json`
- 12張screenshots：`/private/tmp/power-atlas-host-af2e-pvyDLbQT/browser-1/screenshots/`
- 另外兩張真host首頁viewport：`/private/tmp/power-atlas-host-af2e-pvyDLbQT/viewport-screenshots/`；已目視desktop／mobile導航，同ICBC來源／三案比較截圖
- builder／staging logs：`build-hub.log`、`browser-1/stage.log`、`stage-final.log`（以上驗收根目錄內）
- browser當時URL係 `http://127.0.0.1:61914/`；harness退出已dispose preview／Chrome，冇留下服務PID。手動入口係 K `dev/power-atlas/preview.mjs`

### Bun 測試與未完成項

以下 logs 全喺 `/private/tmp/power-atlas-host-af2e-pvyDLbQT`，用現有 Bun 1.3.13。

| 命令／gate | exit | 實際結果 | log |
|---|---:|---|---|
| pinned unpublished revision | 0 | 備份／swap／R-K parity／`unchanged`／一般revision仍拒 | `revision.log`、`correction.json` |
| `bun bin/build-hub.ts 2026-09-08` | 0 | 全hub＋Worker生成 | `build-hub.log` |
| focused importer／Worker／live／host／stage／advertised／Wayfinder／dashboard／Workshop／Civic／immutable | 0 | 440 pass，0 fail，12 files | `focused-1.log`、`test-commands.json` |
| 第一輪 `bun test --timeout 120000` | 1 | 1715 pass，40 skip，22 fail，133 files | `bun-full-1.log` |
| 修正7個publication收據後focused重驗 | 0 | 59 pass，2既有skip，0 fail，8 files | `focused-repair.log` |
| 最終 `bun test --timeout 120000` | 1 | **1723 pass，40既有skip，15 fail**；1778 tests／133 files，210.16秒 | `bun-full-final.log`、`full-final-command.json` |
| 真staged Worker Chrome | 0 | 13項通過／254 direct byte parity／desktop＋mobile／零CSP | `browser-1.log` |
| 最終 `bun bin/stage-hub.ts` | 0 | 新空完整256檔 | `stage-final.log` |
| 真正 importer 再跑 | 0 | `unchanged`，52 files／1,576,613 bytes | `import-unchanged-final.json` |

7個新增失敗已修：3個mutable Wayfinder digest fixtures、2個current-runbook counts、
2個全hub測量fixtures。原assertions保留，唔新增skip；研究HTML只分離明確Power button／
card／JSON三處增量2,974 bytes，再以SHA核實其餘全頁等同base，原research budget冇放寬。
新完整hub亦有exact1,352,885-byte gate，唔係忽略新增內容。

**上表係補齊 Python 環境前嘅歷史收據。** 當時剩餘15 fail全部係既有Python `ModuleNotFoundError: jsonschema`：
Conformational Feedback Physics4、Polymorph2、Task Packet2、Ritonavir Mechanism3、
Conformational Feedback2、Principality2。六份tests同exact base逐bytes相等，Python import
喺讀schema前已失敗；`baseline-environment.json` 記錄對照同exit1probe。冇重跑完整base，
唔冒稱有獨立base全套收據；冇install或將失敗改skip。

### 最後全套通過 · 2026-09-11

本機已有 `/private/tmp/kingdom-civic-schema.juhyFZ/bin/python3`：Python `3.14.6`、
`jsonschema==4.26.0`。六份失敗 testfiles 先重跑 **98 pass／0 fail**；logs同呼叫收據喺
`/private/tmp/power-atlas-python-diagnostic-4qdLoiOf/`。只改測試子程序環境：PATH前置該既有
`bin`、`PYTHONDONTWRITEBYTECODE=1`、TMPDIR指自有目錄；其他環境沿用，冇安裝或改全域設定。

Parent 用同一 child-only 環境跑 `/opt/homebrew/bin/bun --no-env-file test --timeout 120000`，
**exit0：1778 pass／0 fail，133 files，51,416 assertions，224.57秒**。今輪冇 skip。
命令／退出碼：`/private/tmp/power-atlas-full-python-9tzCi8/command.json`；
完整輸出：`/private/tmp/power-atlas-full-python-9tzCi8/bun-full.log`。既有 temp Python環境
唔保證永久存在；日後重跑先核 interpreter／package版本，唔自行 install。

測試後 parent 再核完整256 staged files逐 bytes等於K source、52個R／K artifact相同、
manifest／release pins不變、immutable ledger等於base、原Cargo tracked diff同初次一致、
`git diff --check`通過。收據：`/private/tmp/power-atlas-full-python-9tzCi8/parent-final-audit.json`。
完整stage仍係13,193,449 bytes；冇因環境修正改任何 app／宿主 source。

逐source→destination base/current SHA、原204 bytes變動、完整256 stage inventory同精確
tracked／untracked列表留喺 `baseline-diff-final.json`。R嘅unit／build／雙target Chrome係
parent已跑嘅獨立收據，logs `/private/tmp/power-atlas-jitless-Qptxc3`；本writer冇寫R或重做研究。

## UTC release 準備 · 2026-09-11（未發布新 bytes）

本輪喺 `2026-09-11T08:48:15Z` 核真 UTC 日期，保留 `cc902db58b5183d48a794cd865579f74c37b7caf`
同先前122-path inventory，冇 amend／reset 舊收據。自有證據根目錄：
`/private/tmp/power-atlas-utc-release-mvcgbqki`。以下全部只係本地 release 準備，
未證明 exact-origin release worktree cleanliness、production upload 或新 live parity。

兩次真正 `bun --no-env-file bin/build-hub.ts "$(date -u +%F)"` 都係 `2026-09-11`，
exit0；`build-1.json`／`build-2.json` 保留完整 site hashes，`before.json` 保留舊
site／input hashes，同目錄有三份 site snapshots。兩次 code／manifest／data／其他
build inputs 不變，輸出完整一致，build-time doors 都15/15；冇用 `FORCE_LIVE`、
fake clock、mock fetch 或 reset 掩蓋 drift。呢個有界重現結果唔保證未來網絡觀察穩定；
下一次 build 有任何未知 drift 都要停止，唔放寬 production post-build gate。

相對上述 commit，12個 generated files 只由 `2026-09-08` 轉 `2026-09-11`：
`site/{hub.html,dashboard.html,kingdom.json,wayfinder.json,commons.json,love-loops.json,guest.json,ollama.json,llms.txt}`
同 `site/{meet,citizens,join}/index.html`。冇新增／移除 door 或改導航內容；Power52個
artifact、研究 immutable bytes、Worker、builders、manifest／資料及所有 counts 不變。
`generated-html-diff.json` 列出 exact 日期位置；其餘逐檔差異同 SHA 見 `stage-audit.json`
及 `final-inventory.json`，唔手改 site、研究資料、產物或授權。

Fixture 先驗完整 hub raw SHA-256
`a51c65601c7beb0bcfc518f0904c8ae0aee8fb0049a82db7f6611d8f46b21f24`，再分離既有
三個 Power projections，同 door-status 說明／footer **兩條完整 exact lines** 嘅已review
日期，最後仍必須等於原 base SHA `852c8395b7f441b96706762a714a26fc47eb3044f93a697b85b859d792abb321`。
唔以 regex 洗任意日期、唔忽略全頁；完整1,352,885 bytes、Power2,974 bytes同原研究
budget 保留。新增同長度未知文案、日期段文案、單一未review日期同舊日期回填 negative
測試，全部拒絕。Generated Wayfinder 先鎖今日 raw SHA
`aecee3035014da639e9969b6c6ac575d8d1d8ccc416e1955500c7411afa224cc`，只喺 test 內還原
唯一 generated field；原16 paths 同 authored source 完整對照不變，其他 assertions 冇刪。

| 本輪 gate | 結果 | 證據根目錄內路徑 |
|---|---|---|
| focused release／research boundaries | exit0，537 pass／0 fail，17 files | `focused.log`、`focused-command.json` |
| full Bun | exit0，1779 pass／0 fail，133 files，51,435 assertions；冇 skip | `full-bun.log`、`full-command.json` |
| 真 staged Worker Chrome | exit0，13項，desktop／mobile，254 direct bodies exact parity，零page error／CSP／external app request | `browser.log`、`browser/browser.json` |
| 真 Worker viewport | exit0；已目視兩裝置首頁 header，同兩裝置研究館 Wayfinder | `viewport.json`、`browser/screenshots/*-kingdom-actual-viewport.png`、`*-research-room.png` |
| 最後新空完整stage | exit0，256 files／13,193,449 bytes；160 immutable＋96 mutable；全數等於 K source 同 browser stage | `stage-final.log`、`stage-audit.json` |

全Bun沿用已核 Python3.14.6／jsonschema4.26.0，只喺 child PATH 前置
`/private/tmp/kingdom-civic-schema.juhyFZ/bin`、`PYTHONDONTWRITEBYTECODE=1`，TMPDIR
用自有新目錄；冇 install。完整新stage係
`/private/tmp/power-atlas-utc-release-mvcgbqki/stage-final`，inventory SHA-256
`4b85aba733e56c8dff9248df6798a96325cb982c0c5ed30a8ca4b111d923a408`。
Browser 用既有 local harness、新 loopback instance 同隔離 Chrome，冇讀登入／auth/settings，
冇用或停原服務；完成後只 dispose 自有 preview／Chrome。Civic 無 D1／write bindings，
頁面如實 unavailable；既有 census upstream 由 harness 擋住，唔當成 production health。

## 獨立反查與 parent 核對

原整合三份獨立反查 findings 均為空（先於本輪 UTC 日期修訂）：Atlas jitless／授權／source-only replay；宿主 artifact／staging／未發布修訂；宿主路由／headers／browser 證據。兩位宿主 reviewer 另跑181及233個 focused tests，全部通過；冇以此替代完整 Bun 結果。

Parent 已目視 desktop Atlas、mobile ICBC card 同 mobile 王國首頁 viewport；新入口、返回連結同獨立淺紙版面保留。最後核對 R／K manifest 同為 `af2e349…`，release SHA 不變。原 Cargo checkout tracked diff SHA 仍係 `f7d42c84570cc1ab32c356c2dc2454c6650b6408f0b9594b345cf886984c950e`，HEAD `a78e9e1e59a1baaf65e3425bcdefdb269792814e`，與開工觀察一致；呢個係有界 tracked-byte 觀察，唔推斷其他 writer 身份。

`baseline-diff-final.json` 記錄作者完成時嘅 bytes；parent 其後只修正本文件嘅有界 production 基線、批准範圍措辭同驗收補充，冇改公開 artifact 或 staged bytes。

## 日後更新、移除與發布界線

唔用一般 importer改舊receipt、唔手改dist／site／stage、唔同步刪未知檔。
已發布版本嘅更新要先另批 retained-hash／capacity／cache／rollback設計，唔能夠將本次
「未發布」例外套落公開版本；no-store唔保證所有client或第三方冇副本，亦唔保證多請求原子。
256 cap已滿，唔可以順手放寬或清走其他family騰位。

移除亦需另外批准：作為一個family同步處理全部52 staging／mutable entries、owned artifact／
receipt／projection、Power Worker dispatch／import、Wayfinder／首頁／llms／sitemap入口，
由builders再生，驗原204 mappings／ledger／其他域名同功能。刪之前先驗owned閉包並保留收據；
唔用recursive cleanup覆蓋unknown，唔改immutable ledger。公開後移除唔等於撤回第三方副本。

本次用戶已明示 push／deploy；原整合獨立review已完成，日期增量另交 parent 核對。
仍須重新核對實際production並列精確差異、核Git auto-deploy、提交review過嘅
exact-origin SHA，再用既有clean detached release流程做完整站點upload／live byte-header驗收。
本 writer 只引用上述有界production基線收據，冇發布新artifact或驗新live routes；唔只upload Power子目錄，唔撤回或夾帶
原Cargo checkout嘅工作，亦唔以本地Chrome代production parity。
