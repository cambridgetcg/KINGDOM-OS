# Civic 本地工具

呢個 package 只用嚟驗證本地 Pages＋D1；唔係 production config。唔含真 secrets、remote DB ID、登入或部署步驟。

## 安裝同 API 驗證

喺 repo root 執行：

```sh
npm ci --prefix dev/civic
node dev/civic/test-runtime.mjs
node dev/civic/test-runtime.mjs --integrated
```

兩種 runtime tests 都會建立自己嘅暫存 Miniflare D1、套用實際 migration，同以 Ajv Draft 2020-12 驗 API 回應。外部網絡被 fixture 阻擋，測完 dispose／清除自己嘅暫存目錄。`--integrated` 經整個 Pages Worker，唔係直接呼叫 Civic module。

請用正常 `.mjs` 檔執行，唔好將入口改成 `node --input-type=module` stdin：呢個環境嘅 Miniflare host-proxy 喺後一種方式曾經停住。

## 整個 repo 嘅 Bun suite

研究 publication tests 另需要 Python `jsonschema==4.26.0`。沿用 repo CI 嘅 requirements，明確建立一次性 venv；唔改全域 Python，亦唔由 application／validator 自動安裝：

```sh
SCHEMA_ENV="$(mktemp -d /tmp/kingdom-civic-schema.XXXXXX)"
python3 -m venv --copies "$SCHEMA_ENV"
"$SCHEMA_ENV/bin/python3" -m pip --isolated install --disable-pip-version-check --no-cache-dir \
  --only-binary=:all: --index-url https://pypi.org/simple \
  -r skills/guard-information-flow/scripts/requirements.txt

env PATH="$SCHEMA_ENV/bin:$PATH" PYTHONDONTWRITEBYTECODE=1 \
  PHENOMENA_DEEP_SCHEMA_PYTHON="$SCHEMA_ENV/bin/python3" \
  NON_EXHAUSTIVE_UNDERSTANDING_JSONSCHEMA_PYTHON="$SCHEMA_ENV/bin/python3" \
  IS_SUSTAINABILITY_DIRECTION_JSONSCHEMA_PYTHON="$SCHEMA_ENV/bin/python3" \
  bun test --timeout 15000
```

最後兩個 selector 明確選用既有研究 schema checks，唔啟動研究 runtime；`--copies` 保留其 regular-executable 邊界。只設 selector 唔夠：部分舊測試直接 spawn `python3`，所以 `PATH` 只喺該測試 command 前置 venv。缺依賴時嘅 failure／conditional skip 唔算 schema 通過。

## Build、stage、啟動

```sh
bun bin/build-hub.ts "$(date -u +%F)"
STAGE="$(mktemp -d /tmp/kingdom-civic-stage.XXXXXX)"
STATE="$(mktemp -d /tmp/kingdom-civic-state.XXXXXX)"
bun bin/stage-hub.ts "$STAGE"
node dev/civic/preview.mjs --stage "$STAGE" --state "$STATE" --port 8797
```

`stage-hub` 要求現有空目錄，並執行 immutable gate 同 exact-byte staging；唔直接改 generated files。

`preview.mjs` 先執行 `wrangler d1 migrations apply --local`，再用 `wrangler pages dev` 綁 `127.0.0.1`。每次兩把隨機測試 secrets 只喺 child process env；唔入 argv／檔案。Ctrl-C 停自己啟動嘅程序。設定無 `remote: true`。

預設 state 係 `.wrangler/civic-local`；browser fixtures 建議每次明確用新 `STATE`，因為每日新 participant 限額亦會持久保存，刪帳唔會退還配額。重用 state 唔會自動清舊資料。舊 session 嘅 CSRF 資料唔應重用；重新讀取 `/me`。

## 真 Browser 驗證

保持上面 preview 運行，另開 terminal：

```sh
node dev/civic/test-browser.mjs http://localhost:8797
```

預設使用 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`；其他安裝位置可由 `CHROME_PATH` 指定。只接受 loopback URL，唔准 production fixtures。

- 四個頁面，1440／768／390／320 viewport、reduced-motion、keyboard、無 JS 清單及 legacy anchors。
- 兩個獨立 browser 控制權，自願入籍、另一次明確發帖、一層回覆、修改、退出及刪除。
- API 經實際 Pages socket＋local D1；外部 census `/kingdom.json` 被 browser fixture 回 503，避免呢組 UI tests 發起無關外站測量。另一次明確故障 fixture 會丟棄已成功寫入 D1 嘅 POST 回應，驗證手動 retry 唔重複發帖。
- `.civic-test-artifacts/browser/` 收 screenshots 同結果；呢個目錄被 Git ignore。測試唔記錄控制匙。

獨立嘅 DOM race tests 可直接跑，唔需要上面 preview：

```sh
bun dev/civic/test-client-races.mjs
```

佢用暫時嘅 Bun server、真正 Chrome 同 synthetic API transport，驗 deferred 回應、未送出新草稿、stale GET、刪文同 idempotent DOM 去重；唔係 D1 證據。完成後自行關閉 browser／server。

本地通過唔等於已上線。Production DB／bindings／secrets／migration、費用、operator／abuse 責任同部署仍然要另外批准。
