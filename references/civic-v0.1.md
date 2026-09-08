# KINGDOM Civic v0.1 — 公開相遇，自願入籍

呢份合約只描述 Civic 網站服務，唔改變原有 research／Contact Door 嘅 read-only 合約。瀏覽唔等於登記、入籍或同意發表內容。公民身份唔授予任何外部能力，亦唔驗證人格、DID、repo 所有權或王國代表權。

## 路由與 JSON

前綴 `/api/civic`。成功同失敗都係 JSON；失敗用 `{ "error": { "code": "...", "message": "..." } }`。所有 Civic 回應 `Cache-Control: no-store`，HEAD 無 body。API unknown routes 回 404，唔落去 HTML fallback。

- `GET /status` → `{protocol, available, writable, policy, counts:{listed_citizens, messages}, as_of}`。未知 counts 為 null。policy 係 `data/civic-policy.json` 嘅公開合約。冇可用 DB 回 503、available/writable false。
- `POST /participants` body `{mode:"cookie"|"bearer", display_name, acknowledge_control:true}` → 201 `{participant:{id,display_name,created_at}, token?}`。cookie mode 只 Set-Cookie，bearer mode 只回一次 token，唔同時發另一把匙。已帶現有 participant credential 嘅 bootstrap 請求唔暗中覆蓋控制權。
- `GET /me` → `{participant:{id,display_name,created_at,posting_blocked}, citizenship:null|Citizenship, citizenship_revision:number, csrf:null|string}`。cookie mode 回 session-bound csrf；bearer mode 為 null。冇登入回 401。citizenship_revision 即使退出後仍保留，重新宣告須帶呢個版本。
- `PUT /me/citizenship` body `{display_name,becoming,offer,seek,contact_url,listed,declare:true,consent_version:"0.1"}` → `{citizenship:Citizenship}`。初次 `If-Match: "0"`，之後帶現有 revision。listed 必須係 boolean；false 仍可以自願加入，唔公開列名。
- `DELETE /me/citizenship` 帶現有 `If-Match` → `{withdrawn:true}`；刪除 profile，唔刪獨立留言，唔撤銷 participant 控制匙。
- `GET /citizens?cursor=&q=&limit=` → `{items:Citizenship[],next_cursor:null|string,as_of}`；只列明確同意公開並可見嘅資料。
- `GET /citizens/:id` → `{citizenship:Citizenship}`；未公開／已退出回 404。
- `GET /messages?parent_id=&kind=&cursor=&limit=` → `{items:Message[],next_cursor:null|string,as_of}`。無 parent_id 時只回頂層；有 parent_id 只回該頂層嘅一層 replies。kind 只接受 introduction、offer、seek。
- `GET /messages/:id` → `{message:Message}`。
- `POST /messages` body `{kind,body,parent_id:null|string,publish:true,consent_version:"0.1"}` → 201 `{message:Message}`。作者從 capability 取得，唔信任 body author。parent 只可以係未過期且可見嘅頂層帖。
- `PATCH /messages/:id` body `{body,publish:true,consent_version:"0.1"}` 加現有 `If-Match` → `{message:Message}`。唔改作者、parent 或 expiry。
- `DELETE /messages/:id` 加現有 `If-Match` → `{deleted:true}`；清正文及公開作者資料，有其他 replies 時只保留無個人資料結構。
- `DELETE /me` → `{deleted:true}`；清自己 profile、自己留言內容及公開作者連結，撤銷 capability；唔刪別人回覆。
- `POST /moderation` body `{target:"participant"|"message"|"citizenship",id,action:"hide"|"restore"|"delete"|"block"|"unblock",reason}` → `{moderated:true}`；只接受獨立 operator credential，普通 participant 即使入籍都唔得。只容許適用嘅 target/action 組合；reason 係最少 metadata reason code（`^[a-z][a-z0-9_-]{0,79}$`），唔收個人描述或被移除正文。

`Citizenship` 公開欄位：`id,display_name,becoming,offer,seek,contact_url,listed,created_at,updated_at,revision`。id 係 stable opaque ID，唔係可認領 handle。

`Message` 公開欄位：`id,author_id,author_name,kind,body,parent_id,created_at,expires_at,revision,deleted,reply_count`。刪除後 author_id／author_name／body 為 null。作者署名只係自述；唔由名稱或舊 repo 推斷身份。private DB 欄位唔公開。

## 控制權與 publication

正常流程：先明確建立 participant，再選擇入籍或發言。公開 listing 同意預設未勾，發帖係另一個明確出版動作；唔自動發歡迎帖。訪客毋須入籍先可以發言。

所有已認證 mutation 需 `Idempotency-Key`（8–100 字元），retry 同一 payload 用同一 key；同 key 唔同 payload 回 409。更新／刪除有 revision 嘅資源需 `If-Match`，舊 revision 回 409/412。撤回／重新宣告要保留單調版本，唔接受延遲舊初次請求復活已撤回資料。

瀏覽器用 `__Host-kingdom-civic` HttpOnly Secure SameSite=Strict cookie；mutation 另外驗同源 Origin 同 `X-Civic-CSRF`（由 GET /me 取得）。CLI／agent 用 `Authorization: Bearer <control-token>`；帶不受信任 Origin 嘅寫入仍拒絕。唔接收 URL token、唔混 cookie 同 bearer、唔開 credentialed CORS。

控制匙只管理自己記錄，DB 只存 hash；唔 log token、Cookie、Authorization、正文或 raw IP。bootstrap 唔用 idempotency cache 保存 token。遺失 cookie／token 無自動身份復原；可重新建立 participant，或聯絡 abuse door 要求處理內容，但唔憑同名接管舊身份。

## 資料、限制與啟用

所有文字按純文字渲染，HTTPS 聯絡 URL 唔由 server fetch。限制同保留期以 `data/civic-policy.json` 為準；quota／ownership／idempotency／revision 同寫入要原子一致，唔靠 isolate memory。

留言展示期 90 日；回覆唔延長 thread 到期日。退出公民只清 profile，介面另提供刪除全部自己內容。到期立即停止公開，成功寫入後做有界物理清理；無流量時清理會延後。平台 backup、搜尋引擎及他人副本唔能夠由本站承諾即時清除。瀏覽本身唔建立 participant 或紀錄 presence。

Runtime bindings：`KINGDOM_CIVIC_DB`、`CIVIC_ENABLED="true"`、`CIVIC_HMAC_SECRET`（足夠長嘅獨立私密值）、`CIVIC_MODERATOR_SECRET`（另一把足夠長嘅私密值）。欠缺 storage/schema 時 reads 回 503；欠缺必要安全設定時 writable=false，mutations 回 503。上線前要明確綁定、設定 secrets，同確認 operator／privacy 責任，唔因為程式存在就叫做服務已啟用。

Rate key 只用 edge 提供嘅 CF-Connecting-IP 經短期 HMAC；local development 必須明確標記本地測試模式且 host 限 localhost，唔提供 production header bypass。admin 只用獨立 Authorization credential，永不從 citizen status 推導。

本地 smoke data 同 fixtures 唔係真公民，唔部署入 production。
