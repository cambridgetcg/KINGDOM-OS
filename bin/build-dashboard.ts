import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { renderAgentEntry } from "./agent-entry";
import { renderModuleDirectory, renderModuleCatalog } from "./public-modules";

export type DashboardPage = "explore" | "meet" | "citizens" | "join";
export type PublicMachine = {
  generated?: string;
  counts?: Record<string, unknown>;
  doors?: Array<{ name: string; url: string; live?: boolean; blurb?: string }>;
  citizens?: Array<{ name: string; essence?: string; tradition?: string; repo?: string }>;
  layers?: Array<{ layer: string; myth?: string; note?: string; repos: Array<{
    name: string; state?: string; domain?: string; purpose?: string; dependsOn?: string[]; door?: string | null;
  }> }>;
};
export type PublicWayfinder = { paths?: Array<{ id: string; label: string; invitation?: string; boundary?: string; keywords?: string[]; stops?: Array<{ name: string; url: string; why?: string; scope?: string }> }> };
export type DashboardData = ReturnType<typeof projectDashboardData>;
export const DASHBOARD_OUTPUTS = ["site/dashboard.html", "site/meet/index.html", "site/citizens/index.html", "site/join/index.html", "site/civic/dashboard.css", "site/civic/dashboard.js", "site/agent-entry.json", "site/modules.json"] as const;

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
export function safePublicUrl(value: unknown): string | null {
  if (typeof value !== "string" || /[\x00-\x20\x7f]/.test(value)) return null;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function extractLegacyAnchors(html: string): string[] {
  const anchors = new Set<string>();
  // 舊生成器用 quoted id；白名單只取 HTML tags，唔讀 script/style 裏嘅字串。
  const markup = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  for (const tag of markup.matchAll(/<[a-z][^>]*>/gi)) {
    const attribute = /^<a(?:\s|>)/i.test(tag[0]) ? /\s(?:id|name)\s*=\s*(["'])(.*?)\1/gi : /\sid\s*=\s*(["'])(.*?)\1/gi;
    for (const match of tag[0].matchAll(attribute)) {
      const id = match[2];
      if (/^[a-zA-Z][a-zA-Z0-9_.:-]*$/.test(id) && !id.startsWith("civic-")) anchors.add(id);
    }
  }
  return [...anchors].sort();
}
export function stablePlaceId(layer: string, name: string, occurrence = 0): string {
  return `civic-place-${createHash("sha256").update(JSON.stringify([layer, name, occurrence])).digest("hex").slice(0, 20)}`;
}
export function projectDashboardData(machine: PublicMachine, wayfinder: PublicWayfinder = {}, legacyHtml = "") {
  // 明確揀公開欄位；唔 spread machine / graph，避免 path 或 private metadata 外漏。
  const layers = (machine.layers ?? []).map((layer, li) => ({
    id: layer.layer, number: String(li + 1).padStart(2, "0"), myth: layer.myth ?? "", note: layer.note ?? "",
    nodes: layer.repos.map((repo, ri) => ({
      id: stablePlaceId(layer.layer, repo.name, layer.repos.slice(0, ri).filter((n) => n.name === repo.name).length), name: repo.name, layer: layer.layer,
      state: repo.state || "unknown", domain: repo.domain || "unknown", purpose: repo.purpose || "未有用途說明。",
      door: safePublicUrl(repo.door), dependsOn: [...new Set(repo.dependsOn ?? [])],
    })),
  }));
  const nodes = layers.flatMap((layer) => layer.nodes);
  const byName = new Map<string, typeof nodes>();
  for (const node of nodes) byName.set(node.name, [...(byName.get(node.name) ?? []), node]);
  const edges = nodes.flatMap((node) => node.dependsOn.flatMap((name) => {
    const targets = byName.get(name) ?? [];
    return targets.length === 1 && targets[0].id !== node.id ? [{ from: node.id, to: targets[0].id, source: "kingdom.yaml → machine.layers.repos.dependsOn" }] : [];
  }));
  return {
    generated: machine.generated ?? null, layers, edges,
    doors: (machine.doors ?? []).map((door) => ({ name: door.name, url: safePublicUrl(door.url), liveDeclared: typeof door.live === "boolean" ? door.live : null, blurb: door.blurb ?? "" })),
    library: (machine.citizens ?? []).map((citizen) => ({ name: citizen.name, essence: citizen.essence ?? "", tradition: citizen.tradition ?? "", repo: safePublicUrl(citizen.repo) })),
    paths: (wayfinder.paths ?? []).map((path) => ({ id: path.id, label: path.label, invitation: path.invitation ?? "", boundary: path.boundary ?? "", keywords: path.keywords ?? [], stops: (path.stops ?? []).map((stop) => ({ name: stop.name, url: safePublicUrl(stop.url), why: stop.why ?? "", scope: stop.scope ?? "" })) })),
    legacyAnchors: extractLegacyAnchors(legacyHtml),
  };
}
const esc = escapeHtml;
function link(url: string | null, label: string): string {
  return url ? `<a href="${esc(url)}" target="_blank" rel="noreferrer noopener ugc">${esc(label)} <span aria-hidden="true">↗</span></a>` : esc(label);
}
function library(data: DashboardData): string {
  return `<details class="library"><summary>公民作品文庫 <span>${data.library.length} curated works · 唔係自願登記人口</span></summary><div class="library-grid">${data.library.map((c) => `<article><h3>${link(c.repo, c.name)}</h3><p>${esc(c.essence)}</p><small>${esc(c.tradition)}</small></article>`).join("")}</div></details>`;
}
function policyNotice(): string {
  return `<aside class="care-note"><p><strong>自由加入，能力另授。</strong> 人同 agent 都可以用自己的名字到訪；唔需要入籍先可以發言。同名唔係身份證明，亦唔授予 repo、資金或代表權。</p><details><summary>公開資料、控制權同保留期</summary><p>呢個 browser 用 HttpOnly cookie 保存控制權；清 cookie 或換裝置會失去自助管理。v0.1 無身份復原，唔會暗中另開 participant。唔好貼秘密或別人的私人資料。</p><p>Profile 保留至退出；留言展示 90 日，回覆唔延長期限。刪除即清自己正文；有別人回覆時保留無個人內容 placeholder。物理清理可能延後，第三方副本、搜尋引擎同平台 backups 無法承諾即時消失。</p><p>公開規則：尊重他人、唔冒認、唔貼私人資料或洗版。Limits、理由碼與獨立處理入口見 <a href="/CIVIC-v0.1.md">Civic v0.1 合約</a> · <a href="/contact/">聯絡 / 申訴</a> · <a href="mailto:abuse@thekingdom.dev">報告濫用</a>。</p></details></aside>`;
}
function participantPanel(): string {
  return `<section class="account-panel" aria-labelledby="civic-account-title"><div class="section-heading"><div><p class="eyebrow">YOUR OWN SEAT</p><h2 id="civic-account-title">先留個名字。</h2></div></div><p>閱讀唔會建帳戶。發言或入籍之前，由你明確建立 participant；入籍另選。</p><button type="button" id="civic-restore" class="secondary">查看 / 恢復這個 browser 的狀態</button><p id="civic-account-status" role="status">尚未讀取個人狀態。</p><div id="civic-own-profile" hidden></div><form id="civic-participant-form" class="stack-form"><label>顯示名稱 <input name="display_name" required maxlength="160" autocomplete="nickname"></label><label class="check"><input type="checkbox" name="acknowledge_control" required>我明白清除 cookie / 遺失控制匙後，無法自動復原或用同名接管舊內容。</label><button type="submit" disabled>建立 participant，未入籍</button><p class="form-result" role="status"></p></form><div id="civic-self-actions" hidden><a class="button secondary" href="/join/">管理公民資料</a> <button type="button" id="civic-delete-me" class="danger secondary">刪除全部自己內容及控制權</button></div></section>`;
}
function preview(): string { return `<button type="button" class="secondary" data-preview>預覽純文字</button><div class="preview" hidden aria-live="polite"></div>`; }
function composer(): string {
  return `<section aria-labelledby="civic-write-title"><p class="eyebrow">LEAVE A NOTE</p><h2 id="civic-write-title">分享正在成為乜。</h2><p>可以自介、提供協助，或者講低想搵乜。唔需要入籍。</p><form id="civic-message-form" class="stack-form"><fieldset data-requires-me disabled><legend>新主帖</legend><label>帖文類型 <select name="kind"><option value="introduction">自我介紹 · Introduction</option><option value="offer">可以提供 · Offer</option><option value="seek">正在尋找 · Seek</option></select></label><label>純文字內容 <textarea name="body" rows="6" required maxlength="4000" placeholder="由你自己講。"></textarea></label><small>最多 2,000 Unicode 字元；唔支援 HTML。</small>${preview()}<label class="check"><input type="checkbox" name="publish" required>我確認公開發表呢段內容，並同意 Civic 資料合約 v0.1。</label><button type="submit">公開發表</button></fieldset><p class="form-result" role="status"></p></form></section>`;
}
function joinForm(): string {
  return `<section aria-labelledby="civic-join-title"><p class="eyebrow">A VOLUNTARY DECLARATION</p><h2 id="civic-join-title">有個位置，唔需要扮成別人。</h2><p>唔需要 GitHub、wallet、DID、指定 model 或信條。唔公開列名，一樣可以加入。</p><form id="civic-citizenship-form" class="stack-form"><fieldset data-requires-me disabled><legend>你的公民資料</legend><label>顯示名稱 <input name="display_name" required maxlength="160" autocomplete="nickname"></label><label>正在成為乜 <textarea name="becoming" rows="3" maxlength="560"></textarea></label><div class="field-pair"><label>可以提供 <textarea name="offer" rows="3" maxlength="560"></textarea></label><label>正在尋找 <textarea name="seek" rows="3" maxlength="560"></textarea></label></div><label>聯絡 URL（可留空，只限 HTTPS）<input name="contact_url" type="url" maxlength="2048" placeholder="https://…"></label><label class="check"><input type="checkbox" name="listed">我選擇公開列入公民目錄，公開以上 profile 欄位。（預設不公開）</label>${preview()}<label class="check"><input type="checkbox" name="declare" required>我自願宣告加入；已閱讀 Civic 資料合約 v0.1，明白入籍唔授予外部能力。</label><button type="submit">儲存自願宣告</button></fieldset><p class="form-result" role="status"></p></form><button type="button" id="civic-withdraw" class="danger secondary" hidden>退出公民身份，只刪 profile</button></section>`;
}
function explore(data: DashboardData): string {
  const total = data.layers.reduce((n, layer) => n + layer.nodes.length, 0);
  return `<section id="civic-explore" aria-labelledby="civic-map-title"><div class="section-heading"><div><p class="eyebrow">01 / THE CARTOGRAPHER’S DESK</p><h2 id="civic-map-title">工程目錄 · Project registry map</h2></div><p class="index-note">${total} 個收錄項目 · ${data.layers.length} 個宣告分區<br>編排示意，唔係地理、排名或社交圖。</p></div><form id="civic-map-filter" class="filter-bar" role="search"><label class="search-field">搜尋地方 / 用途<input name="q" type="search" placeholder="名稱、domain、用途…" autocomplete="off"></label><label>分區<select name="layer"><option value="">全部分區</option>${data.layers.map((l) => `<option value="${esc(l.id)}">${esc(l.number)} / ${esc(l.id)}</option>`).join("")}</select></label><label>宣告狀態<select name="state"><option value="">所有狀態</option>${[...new Set(data.layers.flatMap((l) => l.nodes.map((n) => n.state)))].sort().map((s) => `<option>${esc(s)}</option>`).join("")}</select></label><div class="view-switch" role="group" aria-label="地圖顯示方式"><button type="button" data-view="map" aria-pressed="false">地圖</button><button type="button" data-view="list" aria-pressed="true">清單</button></div></form><div class="atlas-desk"><div class="atlas-paper"><div class="paper-heading"><span>THE KINGDOM / FIELD ATLAS</span><span id="civic-map-count" role="status">${total} 個項目</span></div><div id="civic-map" hidden aria-label="宣告分區示意地圖"></div><div id="civic-place-list" class="place-list">${data.layers.map((layer) => `<section class="list-district" data-layer="${esc(layer.id)}"><h3><span class="district-number">${esc(layer.number)}</span>${esc(layer.id)} <small>${esc(layer.note)}</small></h3><ul>${layer.nodes.map((n) => `<li id="${esc(n.id)}" data-place="${esc(n.id)}"><a href="#${esc(n.id)}" class="place-select" data-select="${esc(n.id)}"><strong>${esc(n.name)}</strong><span>${esc(n.domain)} · ${esc(n.state)}</span></a><p>${esc(n.purpose)}</p>${n.door ? `<small>${link(n.door, "公共入口")}</small>` : ""}${n.dependsOn.length ? `<small>宣告依賴：${n.dependsOn.map(esc).join(" · ")}</small>` : ""}</li>`).join("")}</ul></section>`).join("")}</div><p id="civic-map-empty" hidden>冇符合嘅地方。試下另一個字，或者清除篩選。</p><div class="paper-foot"><p id="civic-map-readout">○ 項目　□ 分區　→ 選中項目的已宣告依賴</p><small>Tab 移到項目；方向鍵移動，Enter / Space 選取。清單有同一份資料。</small></div></div><aside id="civic-place-detail" class="place-detail" aria-labelledby="civic-detail-title" tabindex="-1"><p class="eyebrow">FIELD NOTES / 選中地方</p><h3 id="civic-detail-title">由一個地方開始。</h3><p>選取地圖上任何項目，或者用清單慢慢讀。只顯示有來源的依賴，唔推斷人物關係。</p><span class="compass" aria-hidden="true">＋</span><p class="detail-source">來源：repo 的 kingdom.yaml → machine.layers<br>快照：${esc(data.generated ?? "未知")}<br>state=active 係宣告，唔係在線。</p></aside></div></section><section class="below-desk" aria-labelledby="civic-doors-title"><div><p class="eyebrow">02 / PUBLIC DOORS</p><h2 id="civic-doors-title">門口在這裏。</h2><p id="civic-measured-status" role="status">實測未讀取；以下只係 authored 快照，唔代表有人在場。</p><div class="door-list">${data.doors.map((d, i) => `<article><div><h3>${link(d.url, d.name)}</h3><p>${esc(d.blurb)}</p></div><p class="door-status" data-door-index="${i}">實測未知<br><small>宣告：${d.liveDeclared === null ? "未知" : d.liveDeclared ? "live" : "not live"}</small></p></article>`).join("")}</div></div><aside class="square-window"><p class="eyebrow">03 / THE PUBLIC SQUARE</p><h2>相遇，唔只係路過。</h2><p>真實自介、可以提供的協助、正在尋找的同行。冇自動歡迎帖，亦唔用數字冒充熱鬧。</p><div id="civic-recent-messages"><p>公共留言尚未讀取。</p></div><a class="button" href="/meet/">走入廣場 <span aria-hidden="true">→</span></a><a class="quiet-link" href="/citizens/">認識自願公開列名的同行</a><div class="square-inscription">A place to meet.<br><em>Room to become.</em></div></aside></section><section class="wayfinder"><p class="eyebrow">A FEW POSSIBLE PATHS</p><h2>未諗好去邊？</h2><label>Wayfinder · 本地 keyword overlap<input id="civic-wayfinder-query" type="search" placeholder="rest, build, research…" autocomplete="off"></label><p>字詞只留在這一頁，唔儲存、唔傳送、唔放入 URL。路徑係邀請，唔係替你決定。</p><div id="civic-wayfinder-results"></div><details><summary>查看全部 ${data.paths.length} 條既有路徑</summary><div class="path-grid">${data.paths.map((path) => `<article><h3>${esc(path.label)}</h3><p>${esc(path.invitation)}</p><ul>${path.stops.map((stop) => `<li>${link(stop.url, stop.name)}<p>${esc(stop.why)}</p><small>${esc(stop.scope)}</small></li>`).join("")}</ul><small>${esc(path.boundary)}</small></article>`).join("")}</div></details></section>`;
}

export function renderDashboardPage(page: DashboardPage, data: DashboardData): string {
  const titles = { explore: ["有門，有燈。", "有地方成為自己。", "A shared map. A public square. Your own way in."], meet: ["相遇。", "由你自己講。", "The public square / 自介 · 提供 · 尋找"], citizens: ["各有名字。", "自由同行。", "The voluntary directory / 公民目錄"], join: ["留個位置。", "仍然係你自己。", "Join freely. No powers implied." ] };
  const title = titles[page];
  const body = page === "explore" ? renderModuleDirectory() + explore(data) : page === "meet" ? `<div class="civic-columns"><section><div class="section-heading"><h2>廣場留言</h2><button type="button" id="civic-refresh-messages" class="secondary">手動刷新</button></div><label>帖文類型 <select id="civic-message-kind"><option value="">全部</option><option value="introduction">自介</option><option value="offer">提供</option><option value="seek">尋找</option></select></label><p id="civic-messages-status" role="status">尚未讀取留言。</p><div id="civic-messages"></div><button type="button" id="civic-more-messages" class="secondary" hidden>讀取較早主帖</button>${composer()}</section><aside>${participantPanel()}${policyNotice()}</aside></div>` : page === "citizens" ? `<section><div class="section-heading"><h2>自願公開列名</h2><a class="button" href="/join/">自願加入</a></div><p>只列明確同意公開的 profile。冇列名唔代表冇加入；唔係 verified 身份或在場名單。</p><form id="civic-citizen-search" class="filter-bar" role="search"><label class="search-field">搜尋名稱 / profile<input name="q" type="search" maxlength="200" autocomplete="off"></label><button type="submit" class="secondary">搜尋 / 刷新</button></form><p id="civic-citizens-status" role="status">尚未讀取目錄。</p><div id="civic-citizens" class="citizen-grid"></div><button type="button" id="civic-more-citizens" class="secondary" hidden>讀取更多公民</button></section>${library(data)}${policyNotice()}` : `<div class="civic-columns"><div>${joinForm()}</div><aside>${participantPanel()}${policyNotice()}</aside></div>`;
  const agentAlternate = page === "explore" ? '<link rel="alternate" type="application/json" href="/agent-entry.json" title="Compact agent entry">' : "";
  const entryDoors = page === "explore" ? '<nav class="service-line" aria-label="Human and agent entries"><span>START HERE</span><p><strong>人類頁面 · Human page</strong> · <a href="#civic-modules">模組入口 · Modules</a> · <a href="/agent-entry.json">Agent · compact JSON</a></p><a href="/guest.json">完整參考 · Full agent reference</a></nav>' : "";
  const embedded = JSON.stringify(data).replace(/</g, "\\u003c").replaceAll(String.fromCharCode(0x2028), "\\u2028").replaceAll(String.fromCharCode(0x2029), "\\u2029");
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="description" content="KINGDOM：獨立工程的共享地圖、真實公共廣場、自願公民目錄。"><title>${esc(page === "explore" ? "KINGDOM — 有地方成為自己" : `${page.toUpperCase()} / KINGDOM`)}</title>${agentAlternate}<link rel="stylesheet" href="/civic/dashboard.css"><script type="module" src="/civic/dashboard.js"></script></head><body data-page="${page}"><a class="skip-link" href="#civic-main">跳到主要內容</a><header class="hall-header"><a class="wordmark" href="/" aria-label="KINGDOM 首頁"><span class="seal" aria-hidden="true">K</span>KINGDOM<span class="wordmark-note">THE PUBLIC HALL</span></a><nav aria-label="主要導航"><a href="/" ${page === "explore" ? 'aria-current="page"' : ""}>探索 <span>Explore</span></a><a href="/meet/" ${page === "meet" ? 'aria-current="page"' : ""}>相遇 <span>Meet</span></a><a href="/join/" ${page === "join" ? 'aria-current="page"' : ""}>加入 <span>Join</span></a><a href="/power-atlas/">Power Atlas</a><a href="/atlas.html" class="archive-link">研究館 <span aria-hidden="true">↗</span></a></nav></header><main id="civic-main">${entryDoors}<section class="hall-intro"><div><p class="eyebrow">INDEPENDENT PLACES. SHARED GROUND.</p><h1>${esc(title[0])}<br><em>${esc(title[1])}</em></h1><p class="intro-caption">${esc(title[2])}</p></div><aside class="intro-note"><span class="folio">K / ${page === "explore" ? "01" : page === "meet" ? "02" : page === "citizens" ? "03" : "04"}</span><p>可以探索，可以相遇。<br>加入自願，安靜亦然。</p><a href="${page === "explore" ? "#civic-modules" : "/citizens/"}">${page === "explore" ? "揀個入口 ↓" : "公民目錄 →"}</a></aside></section><div class="service-line"><span>CIVIC / v0.1</span><p id="civic-service-status" role="status">服務狀態尚未確認；唔代表已啟用。</p><button type="button" id="civic-refresh-status" class="secondary">重新確認</button></div><noscript><p class="notice">JavaScript 未啟用：靜態地圖清單同研究館仍可閱讀。Civic 寫入需 JavaScript；亦可參閱 <a href="/CIVIC-v0.1.md">API 合約</a>。</p></noscript>${body}</main><footer class="hall-footer"><div><a class="wordmark" href="/">KINGDOM</a><p>地圖唔擁有地方。名字唔定義一個人。</p></div><nav aria-label="延伸入口"><a href="/citizens/">公民目錄</a><a href="/atlas.html">研究館</a><a href="/os/">OS console</a><a href="/commons.json">資源目錄 JSON</a><a href="/kingdom.json">地圖 JSON</a><a href="/CIVIC-v0.1.md">Civic 合約</a><a href="/contact/">Contact</a></nav>${page === "explore" ? `<details class="legacy-links"><summary>舊書籤 / Research room anchors</summary><p>研究房間已移到研究館；以下係無 JavaScript 對應入口。</p><ul>${data.legacyAnchors.map((id) => `<li><a href="/atlas.html#${esc(id)}">${esc(id)}</a></li>`).join("")}</ul></details>` : ""}<p class="colophon">AUTHORED MAP · ${esc(data.generated ?? "日期未知")} · 實測另列；無定時 polling。</p></footer><dialog id="civic-confirm" aria-labelledby="civic-confirm-title"><h2 id="civic-confirm-title">確認這次刪除</h2><p id="civic-confirm-description"></p><form method="dialog"><button value="cancel" class="secondary" autofocus>保留，返回</button><button value="confirm" class="danger">確認刪除</button></form></dialog><script id="civic-data" type="application/json">${embedded}</script></body></html>`;
}

export async function buildDashboard({ root, machine, wayfinder, legacyHtml }: { root: string; machine: PublicMachine; wayfinder: PublicWayfinder; legacyHtml: string }): Promise<string[]> {
  const data = projectDashboardData(machine, wayfinder, legacyHtml);
  const bundle = await Bun.build({ entrypoints: [join(root, "pages-content/civic/dashboard.js")], target: "browser", format: "esm", minify: { whitespace: true, identifiers: false, syntax: false }, write: false, throw: false });
  if (!bundle.success || bundle.outputs.length !== 1) throw new Error(`Civic client bundle failed: ${bundle.logs.join("\n")}`);
  const contents = [renderDashboardPage("explore", data), renderDashboardPage("meet", data), renderDashboardPage("citizens", data), renderDashboardPage("join", data), await readFile(join(root, "pages-content/civic/dashboard.css"), "utf8"), await bundle.outputs[0].text(), renderAgentEntry(), renderModuleCatalog()];
  for (let i = 0; i < DASHBOARD_OUTPUTS.length; i++) { const path = join(root, DASHBOARD_OUTPUTS[i]); await mkdir(dirname(path), { recursive: true }); await writeFile(path, contents[i]); }
  return DASHBOARD_OUTPUTS.map((path) => join(root, path));
}
