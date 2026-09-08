export const SCHEMA_VERSION = "thekingdom.workshop-draft/0.1";

export const LIMITS = Object.freeze({
  title: 160,
  byline: 120,
  body: 24_000,
  register: 6_000,
  rights: 500,
  sources: 8,
  sourceName: 160,
  sourceUrl: 2_048,
  sourceNote: 1_000,
  sourceRights: 500,
  importBytes: 512 * 1_024,
});

const REGISTER_LABELS = Object.freeze({
  observation: "觀察",
  interpretation: "詮釋",
  unknown: "未知",
});
const DECLARATION_NOTICE = "附註分類同權利內容都係作者聲明，工房冇核實，亦冇自動授予使用權。";
const UNSAFE_URL_NOTICE = "只保留文字：網址須為無登入資料、無控制字元嘅完整 HTTPS 網址。";

export function createDraft() {
  return {
    schema_version: SCHEMA_VERSION,
    title: "",
    byline: "",
    body: "",
    registers: { observation: "", interpretation: "", unknown: "" },
    sources: [],
    rights: "",
  };
}

// 只收固定、自己擁有嘅資料欄位；唔 merge 輸入，亦唔讀 accessor。
function closedRecord(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}須為 JSON object。`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${label}唔可以有自訂 prototype。`);
  }
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== keys.length || ownKeys.some((key) => !keys.includes(key))) {
    throw new Error(`${label}有缺少或未支援嘅欄位。`);
  }
  const result = Object.create(null);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new Error(`${label}只接受普通 JSON 資料欄位。`);
    }
    result[key] = descriptor.value;
  }
  return result;
}

export function countCodePoints(text) {
  let count = 0;
  for (const character of text) count += 1;
  return count;
}

function boundedString(value, max, label) {
  if (typeof value !== "string") throw new Error(`${label}須為文字。`);
  if (countCodePoints(value) > max) {
    throw new Error(`${label}超過 ${max.toLocaleString("en-US")} 個 Unicode 字碼點；原文冇截短，請自行縮短再匯出。`);
  }
  return value;
}

export function validateDraft(input) {
  const record = closedRecord(input, ["schema_version", "title", "byline", "body", "registers", "sources", "rights"], "草稿");
  if (record.schema_version !== SCHEMA_VERSION) throw new Error("草稿版本唔支援。請揀工房 v0.1 JSON 草稿。");
  const registers = closedRecord(record.registers, Object.keys(REGISTER_LABELS), "附註");
  const sources = record.sources;
  if (!Array.isArray(sources) || Object.getPrototypeOf(sources) !== Array.prototype || sources.length > LIMITS.sources) {
    throw new Error(`來源須為清單，最多 ${LIMITS.sources} 個。`);
  }
  if (Reflect.ownKeys(sources).length !== sources.length + 1) throw new Error("來源清單唔可以有空位或額外欄位。");
  const clone = createDraft();
  clone.title = boundedString(record.title, LIMITS.title, "標題");
  clone.byline = boundedString(record.byline, LIMITS.byline, "署名");
  clone.body = boundedString(record.body, LIMITS.body, "主文");
  clone.rights = boundedString(record.rights, LIMITS.rights, "作品權利聲明");
  for (const key of Object.keys(REGISTER_LABELS)) {
    clone.registers[key] = boundedString(registers[key], LIMITS.register, REGISTER_LABELS[key]);
  }
  for (let index = 0; index < sources.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(sources, String(index));
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new Error("來源清單只接受普通 JSON 資料。");
    const source = closedRecord(descriptor.value, ["name", "url", "note", "rights"], `來源 ${index + 1}`);
    clone.sources.push({
      name: boundedString(source.name, LIMITS.sourceName, `來源 ${index + 1} 名稱`),
      url: boundedString(source.url, LIMITS.sourceUrl, `來源 ${index + 1} 網址`),
      note: boundedString(source.note, LIMITS.sourceNote, `來源 ${index + 1} 備註`),
      rights: boundedString(source.rights, LIMITS.sourceRights, `來源 ${index + 1} 權利聲明`),
    });
  }
  return clone;
}

export function safeSourceUrl(value) {
  if (typeof value !== "string" || !/^https:\/\//i.test(value)) return null;
  // URL parser 會食走部分字元；先拒絕，唔偷偷修正成可點擊網址。
  if (/[\s\u0000-\u001f\u007f-\u009f\\\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u.test(value)) return null;
  const authority = value.slice(8).split(/[/?#]/u)[0];
  if (!authority || authority.includes("@")) return null;
  try {
    // 按 Unicode 解碼先查控制字元，唔將中文字嘅 UTF-8 continuation byte 當成 C1。
    for (const character of decodeURIComponent(value)) {
      const code = character.codePointAt(0);
      if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)
        || (code >= 0x200b && code <= 0x200f) || (code >= 0x202a && code <= 0x202e)
        || (code >= 0x2060 && code <= 0x206f) || code === 0xfeff) return null;
    }
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function projectRights(text) {
  return { text, status: text.trim() ? "作者聲明，未核實" : "未知" };
}

export function projectDocument(input) {
  const draft = validateDraft(input);
  return {
    title: draft.title.trim() ? draft.title : "未命名作品",
    byline: draft.byline,
    body: draft.body,
    registers: Object.entries(REGISTER_LABELS)
      .filter(([key]) => draft.registers[key].trim())
      .map(([key, label]) => ({ key, label, text: draft.registers[key] })),
    sources: draft.sources.map((source, index) => ({
      name: source.name.trim() ? source.name : `來源 ${index + 1}`,
      url: source.url,
      note: source.note,
      rights: projectRights(source.rights),
      href: safeSourceUrl(source.url),
      urlWarning: source.url && !safeSourceUrl(source.url) ? UNSAFE_URL_NOTICE : "",
    })),
    rights: projectRights(draft.rights),
    notice: DECLARATION_NOTICE,
  };
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

const DOCUMENT_STYLE = `:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#eee8db;color:#243c32;font:18px/1.85 Georgia,"Songti TC","PMingLiU",serif}main{max-width:800px;margin:3rem auto;padding:clamp(1.2rem,6vw,4rem);background:#fffaf0;border-top:4px solid #ad823e}h1{font-size:2.2em;line-height:1.35}h2{font-size:1.1em;margin-top:2rem}h3{font-size:1em}p,h1,h2,h3,a{overflow-wrap:anywhere;white-space:pre-wrap}header{border-bottom:1px solid #c8bd9e;padding-bottom:1rem}.prose{white-space:pre-wrap;overflow-wrap:anywhere}.byline,.meta{font-size:.85em;color:#586356}section,footer{margin-top:2rem}footer{border-top:1px solid #c8bd9e;padding-top:1rem}a{color:#355c46;text-underline-offset:.2em}li{padding-left:.4rem;margin-bottom:1.4rem}@media print{body{background:white;color:black;font-size:12pt}main{margin:0;max-width:none;padding:0;border:0}a{color:inherit}h1,h2,h3{break-after:avoid}p{orphans:3;widows:3}}`;

function rightsHtml(rights) {
  return `<p class="meta">權利：${escapeHtml(rights.status)}</p>${rights.text ? `<p class="prose">${escapeHtml(rights.text)}</p>` : ""}`;
}

export function serializeHtml(input) {
  const document = projectDocument(input);
  const registers = document.registers.map((item) => `<section><h2>${item.label}</h2><p class="prose">${escapeHtml(item.text)}</p></section>`).join("\n");
  const sources = document.sources.length ? `<section><h2>來源</h2><ol>${document.sources.map((source) => `<li><h3>${escapeHtml(source.name)}</h3>${source.url ? `<p>${source.href ? `<a href="${escapeHtml(source.href)}" rel="noreferrer noopener" referrerpolicy="no-referrer">${escapeHtml(source.url)}</a>` : escapeHtml(source.url)}</p>` : ""}${source.urlWarning ? `<p class="meta">${source.urlWarning}</p>` : ""}${source.note ? `<p class="prose">${escapeHtml(source.note)}</p>` : ""}${rightsHtml(source.rights)}</li>`).join("\n")}</ol></section>` : "";
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; object-src 'none'">
<meta name="referrer" content="no-referrer">
<title>${escapeHtml(document.title)}</title>
<style>${DOCUMENT_STYLE}</style>
</head>
<body><main><article>
<header><h1>${escapeHtml(document.title)}</h1>${document.byline ? `<p class="byline">${escapeHtml(document.byline)}</p>` : ""}</header>
<p class="prose">${escapeHtml(document.body)}</p>
${registers}
${sources}
<footer><h2>作品權利</h2>${rightsHtml(document.rights)}<p class="meta">${document.notice}</p></footer>
</article></main></body>
</html>\n`;
}

// 字元實體令原文唔會變成 Markdown 語法，亦唔會令裸網址自動變 link。
// 只保證普通 Markdown；下游 renderer 嘅額外自訂語法唔屬保證範圍。
function escapeMarkdown(text) {
  return text.replace(/[\u0000- !-/:-@\[-`{-~\u007f]/g, (character) => {
    if (character === "\n") return "\n";
    return `&#${character.codePointAt(0)};`;
  });
}

function markdownDestination(url) {
  return url.replace(/[!"'()*<>\[\]`\\]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`).replaceAll("&", "&amp;");
}

function rightsMarkdown(rights) {
  return `權利：${rights.status}${rights.text ? `\n\n${escapeMarkdown(rights.text)}` : ""}`;
}

export function serializeMarkdown(input) {
  const document = projectDocument(input);
  const parts = [`# ${escapeMarkdown(document.title)}`];
  if (document.byline) parts.push(escapeMarkdown(document.byline));
  if (document.body) parts.push(escapeMarkdown(document.body));
  for (const register of document.registers) parts.push(`## ${register.label}`, escapeMarkdown(register.text));
  if (document.sources.length) {
    parts.push("## 來源");
    document.sources.forEach((source, index) => {
      parts.push(`### ${index + 1}. ${escapeMarkdown(source.name)}`);
      if (source.url) parts.push(source.href ? `[${escapeMarkdown(source.url)}](${markdownDestination(source.href)})` : escapeMarkdown(source.url));
      if (source.urlWarning) parts.push(source.urlWarning);
      if (source.note) parts.push(escapeMarkdown(source.note));
      parts.push(rightsMarkdown(source.rights));
    });
  }
  parts.push("## 作品權利", rightsMarkdown(document.rights), document.notice);
  return `${parts.join("\n\n")}\n`;
}

export function serializeDraft(input) {
  return `${JSON.stringify(validateDraft(input), null, 2)}\n`;
}

export async function importDraftFile(file) {
  if (!file || !Number.isSafeInteger(file.size) || file.size < 0 || file.size > LIMITS.importBytes) {
    throw new Error("草稿檔案上限係 512 KiB；未有讀取，原稿保持不變。");
  }
  let input;
  try {
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > LIMITS.importBytes) throw new Error("size");
    input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error("讀唔到有效 UTF-8 JSON 草稿；原稿保持不變。");
  }
  return validateDraft(input);
}

function element(document, tag, className = "", text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderPreview(input, container) {
  const projected = projectDocument(input);
  const document = container.ownerDocument;
  const fragment = document.createDocumentFragment();
  fragment.append(element(document, "p", "paper-kicker", "作品 / 紙頁預覽"));
  const header = element(document, "header", "paper-header");
  header.append(element(document, "h2", "paper-title", projected.title));
  if (projected.byline) header.append(element(document, "p", "paper-byline", projected.byline));
  fragment.append(header, element(document, "p", "paper-body", projected.body));
  if (!projected.body) {
    fragment.append(element(document, "p", "empty-page", "寫低第一句，\n呢度就會變成你嘅紙頁。"));
    fragment.append(element(document, "p", "paper-meta", "呢段係預覽提示，唔會匯出。"));
  }
  for (const register of projected.registers) {
    const section = element(document, "section", "paper-register");
    section.append(element(document, "h3", "", register.label), element(document, "p", "", register.text));
    fragment.append(section);
  }
  function appendRights(parent, rights) {
    parent.append(element(document, "p", "paper-meta", `權利：${rights.status}`));
    if (rights.text) parent.append(element(document, "p", "", rights.text));
  }
  if (projected.sources.length) {
    const section = element(document, "section", "paper-sources");
    section.append(element(document, "h3", "", "來源"));
    const list = element(document, "ol");
    for (const source of projected.sources) {
      const item = element(document, "li");
      item.append(element(document, "h4", "", source.name));
      if (source.url) {
        const line = element(document, "p");
        if (source.href) {
          const link = element(document, "a", "", source.url);
          link.href = source.href;
          link.target = "_blank";
          link.rel = "noreferrer noopener";
          link.referrerPolicy = "no-referrer";
          line.append(link);
        } else line.textContent = source.url;
        item.append(line);
      }
      if (source.urlWarning) item.append(element(document, "p", "paper-meta", source.urlWarning));
      if (source.note) item.append(element(document, "p", "", source.note));
      appendRights(item, source.rights);
      list.append(item);
    }
    section.append(list);
    fragment.append(section);
  }
  const footer = element(document, "footer", "paper-footer");
  footer.append(element(document, "h3", "", "作品權利"));
  appendRights(footer, projected.rights);
  footer.append(element(document, "p", "paper-meta", projected.notice));
  fragment.append(footer);
  const scrollTop = container.scrollTop;
  container.replaceChildren(fragment);
  container.scrollTop = scrollTop;
}

const DOWNLOADS = Object.freeze({
  html: { filename: "kingdom-workshop.html", mime: "text/html;charset=utf-8", serialize: serializeHtml },
  markdown: { filename: "kingdom-workshop.md", mime: "text/markdown;charset=utf-8", serialize: serializeMarkdown },
  json: { filename: "kingdom-workshop.json", mime: "application/json;charset=utf-8", serialize: serializeDraft },
});

export function downloadText(text, format, document = globalThis.document) {
  if (!Object.hasOwn(DOWNLOADS, format) || !document?.defaultView) throw new Error("下載格式或瀏覽器環境唔支援。");
  const view = document.defaultView;
  const config = DOWNLOADS[format];
  const url = view.URL.createObjectURL(new Blob([text], { type: config.mime }));
  const link = element(document, "a");
  link.href = url;
  link.download = config.filename;
  link.hidden = true;
  let timer;
  const release = () => {
    view.clearTimeout(timer);
    view.URL.revokeObjectURL(url);
    view.removeEventListener("pagehide", release);
  };
  view.addEventListener("pagehide", release, { once: true });
  try {
    document.body.append(link);
    link.click();
    // 等瀏覽器接收下載，再釋放；離頁亦會清理。
    timer = view.setTimeout(release, 1_000);
  } catch (error) {
    release();
    throw error;
  } finally {
    link.remove();
  }
}

export function createExampleDraft() {
  const draft = createDraft();
  draft.title = "雨停之前，借你一盞燈（虛構示例）";
  draft.byline = "工房原創虛構短文";
  draft.body = "最後一班渡輪取消嗰晚，阿澄留喺修鐘舖門口避雨。佢手上有一張未寄出嘅明信片，只寫咗：『我到咗，不過唔係原本嗰個地方。』\n\n舖頭婆婆冇問佢去邊，淨係搬咗盞枱燈出嚟。燈罩有一道裂痕，光落喺紙上，似條彎彎曲曲嘅河。\n\n『寫唔落，可以先畫個窗。』婆婆話。\n\n阿澄畫咗個窗，又喺窗邊加一隻杯。雨停嗰陣，明信片仲未寫完。佢收好張紙，幫婆婆將燈搬返入舖。\n\n呢次佢冇趕下一班船。佢想先記住，原來有啲地方唔使解釋清楚，都可以坐低一陣。";
  draft.registers.observation = "故事入面，婆婆搬出一盞有裂痕嘅燈，阿澄喺明信片上畫咗個窗。呢啲係虛構情節，唔係現實見聞。";
  draft.registers.interpretation = "我想寫嘅唔係有人替你解決晒問題，而係未諗清楚嗰陣，仍然有一個落筆嘅位置。";
  draft.registers.unknown = "明信片會唔會寄出？阿澄之後去邊？故事冇交代，可以留白。";
  draft.rights = "為燈下作品工房寫嘅原創虛構示例；呢句唔係經核實嘅授權證明，亦唔自動授予使用權。";
  return draft;
}

function hasContent(draft) {
  return Boolean(draft.title || draft.byline || draft.body || draft.rights || draft.sources.length || Object.values(draft.registers).some(Boolean));
}

export function mountWorkshop(root) {
  if (!root || root.dataset.mounted === "true") return;
  const document = root.ownerDocument;
  const view = document.defaultView;
  const find = (selector) => root.querySelector(selector);
  const status = find("#status");
  const error = find("#error");
  const preview = find("#preview");
  const sourceContainer = find("#sources");
  const downloads = [...root.querySelectorAll("[data-download]")];
  let draft = createDraft();
  let revision = 0;
  let importRun = 0;
  let sourceSequence = 0;
  const composing = new Set();
  const bindings = [];
  let sourceBindings = [];
  let urlWarnings = [];

  function showStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }
  function showError(message) {
    error.textContent = message;
    error.hidden = !message;
  }
  function setDownloadState(disabled) {
    for (const button of downloads) button.disabled = disabled;
  }
  function refresh() {
    const count = countCodePoints(draft.body);
    find("#body-count").textContent = `${count.toLocaleString("en-US")} / 24,000`;
    find("#source-count").textContent = `${draft.sources.length} / ${LIMITS.sources}`;
    find("[data-add-source]").disabled = draft.sources.length >= LIMITS.sources;
    find("#draft-state").textContent = hasContent(draft) ? "稿件只喺呢頁 · 未自動保存" : "空白稿 · 未自動保存";
    for (const binding of [...bindings, ...sourceBindings]) {
      const invalid = countCodePoints(binding.get()) > binding.max;
      binding.field.setAttribute("aria-invalid", String(invalid));
      const description = [binding.description, invalid ? "error" : ""].filter(Boolean).join(" ");
      if (description) binding.field.setAttribute("aria-describedby", description);
      else binding.field.removeAttribute("aria-describedby");
    }
    for (const { node, source } of urlWarnings) {
      node.hidden = !source.url || Boolean(safeSourceUrl(source.url));
    }
    try {
      renderPreview(draft, preview);
      preview.dataset.state = "current";
      showError("");
      setDownloadState(false);
    } catch (failure) {
      preview.dataset.state = "stale";
      showError(`${failure.message} 預覽暫時保留上一個有效版本，下載已暫停。`);
      setDownloadState(true);
    }
  }

  function bind(field, get, set, max, list) {
    const binding = { field, get, set, max, description: field.getAttribute("aria-describedby") || "" };
    list.push(binding);
    field.value = get();
    const update = (event) => {
      // 只更新正在寫嘅欄位；唔重設 textarea，保留選字、游標同未編輯欄位嘅原始換行。
      set(field.value);
      revision += 1;
      showStatus("");
      if (event.isComposing || composing.size) return;
      refresh();
    };
    field.addEventListener("compositionstart", () => {
      composing.add(field);
      setDownloadState(true);
    });
    field.addEventListener("input", update);
    field.addEventListener("compositionend", (event) => {
      composing.delete(field);
      update(event);
    });
    return binding;
  }

  for (const key of ["title", "byline", "body", "rights"]) {
    bind(find(`#${key}`), () => draft[key], (value) => { draft[key] = value; }, LIMITS[key], bindings);
  }
  for (const key of Object.keys(REGISTER_LABELS)) {
    bind(find(`#${key}`), () => draft.registers[key], (value) => { draft.registers[key] = value; }, LIMITS.register, bindings);
  }

  function renderSources() {
    sourceBindings = [];
    urlWarnings = [];
    const fragment = document.createDocumentFragment();
    draft.sources.forEach((source, index) => {
      const card = element(document, "fieldset", "source-card");
      card.dataset.source = "";
      card.append(element(document, "legend", "", `來源 ${index + 1}`));
      const sequence = ++sourceSequence;
      const fields = [
        ["name", "名稱", LIMITS.sourceName, 1],
        ["url", "網址", LIMITS.sourceUrl, 2],
        ["note", "隨作品匯出嘅備註", LIMITS.sourceNote, 3],
        ["rights", "來源權利聲明", LIMITS.sourceRights, 2],
      ];
      for (const [key, labelText, max, rows] of fields) {
        const group = element(document, "div", "field");
        const field = element(document, "textarea");
        field.id = `source-${sequence}-${key}`;
        field.dataset.sourceField = key;
        field.rows = rows;
        field.spellcheck = false;
        const label = element(document, "label", "", labelText);
        label.htmlFor = field.id;
        label.append(element(document, "span", "", `可留空 · 最多 ${max.toLocaleString("en-US")} 字碼點`));
        if (key === "url") {
          field.placeholder = "https://…（只留低，唔會讀取）";
          field.inputMode = "url";
          const warning = element(document, "p", "source-warning", UNSAFE_URL_NOTICE);
          warning.id = `source-${sequence}-url-note`;
          warning.hidden = true;
          field.setAttribute("aria-describedby", warning.id);
          urlWarnings.push({ node: warning, source });
          group.append(label, field, warning);
        } else {
          if (key === "rights") field.placeholder = "唔知道可以留空；唔會阻止匯出。";
          group.append(label, field);
        }
        bind(field, () => source[key], (value) => { source[key] = value; }, max, sourceBindings);
        card.append(group);
      }
      const remove = element(document, "button", "", "移除呢個來源");
      remove.type = "button";
      remove.dataset.removeSource = "";
      remove.setAttribute("aria-label", `移除來源 ${index + 1}`);
      remove.addEventListener("click", () => {
        if (!canAct()) return;
        if (Object.values(source).some(Boolean) && !view.confirm("移除呢個來源？佢嘅名稱、網址、備註同權利聲明都會離開呢份草稿。")) return;
        draft.sources.splice(index, 1);
        revision += 1;
        renderSources();
        refresh();
        showStatus("已移除來源；其餘內容保留。未自動保存。");
        find("[data-add-source]").focus();
      });
      card.append(remove);
      fragment.append(card);
    });
    sourceContainer.replaceChildren(fragment);
  }

  function canAct() {
    if (!composing.size) return true;
    showError("請先完成而家嘅組字，再換稿或下载；文字仍然留喺編輯區。");
    return false;
  }
  function confirmReplace(action) {
    return !hasContent(draft) || view.confirm(`${action}會取代成份草稿。呢頁冇自動保存；未下載嘅內容會失去。確定繼續？`);
  }
  function replaceDraft(candidate, message) {
    const clone = validateDraft(candidate);
    draft = clone;
    revision += 1;
    for (const binding of bindings) binding.field.value = binding.get();
    find("#register-drawer").open = Object.values(draft.registers).some(Boolean);
    renderSources();
    refresh();
    preview.scrollTop = 0;
    showStatus(message);
  }

  find("#draft-form").addEventListener("submit", (event) => event.preventDefault());
  find("[data-add-source]").addEventListener("click", () => {
    if (!canAct() || draft.sources.length >= LIMITS.sources) return;
    draft.sources.push({ name: "", url: "", note: "", rights: "" });
    revision += 1;
    renderSources();
    refresh();
    showStatus("已加一個空白來源；所有欄位都可留空。");
    sourceContainer.lastElementChild.querySelector('[data-source-field="name"]').focus();
  });
  find("[data-example]").addEventListener("click", () => {
    if (!canAct() || !confirmReplace("載入虛構示例")) return;
    replaceDraft(createExampleDraft(), "已載入原創虛構示例；唔係真實記錄。可以任意改寫，未自動保存。");
  });
  find("[data-clear]").addEventListener("click", () => {
    if (!canAct() || !confirmReplace("清空呢張枱")) return;
    replaceDraft(createDraft(), "呢張枱已清空；已下載嘅檔案冇被刪除。");
  });
  find("#import-draft").addEventListener("change", async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const token = ++importRun;
    input.value = "";
    if (!file || !canAct()) return;
    const atRevision = revision;
    showStatus("喺本機檢查草稿；而家嘅內容仍然保留。");
    try {
      const candidate = await importDraftFile(file);
      if (token !== importRun) return;
      if (revision !== atRevision || composing.size) {
        showStatus("");
        showError("讀檔期間已有新編輯；今次冇換稿。請完成編輯後重新揀檔案。");
        return;
      }
      if (!confirmReplace("匯入 JSON")) {
        showStatus("已取消匯入；原稿保持不變。");
        return;
      }
      replaceDraft(candidate, "已重新開啟 JSON 草稿；全部欄位已驗證。內容只喺呢頁，繼續寫之後記得再下載。");
    } catch (failure) {
      if (token !== importRun) return;
      showStatus("");
      showError(`${failure.message} 冇取代而家嘅草稿。`);
    }
  });
  for (const button of downloads) {
    button.addEventListener("click", () => {
      if (!canAct()) return;
      const format = button.dataset.download;
      try {
        const text = DOWNLOADS[format].serialize(draft);
        downloadText(text, format, document);
        showStatus(`已交畀瀏覽器下載 ${DOWNLOADS[format].filename}；請確認檔案真係保存咗。呢頁仍然冇自動保存。`);
      } catch (failure) {
        showError(`未能下載：${failure.message}`);
      }
    });
  }
  view.addEventListener("beforeunload", (event) => {
    if (!hasContent(draft) && !composing.size) return;
    event.preventDefault();
    event.returnValue = "";
  });
  // 防止瀏覽器嘅表單復原內容被誤當成工房 autosave；只由呢個新 model 初始化。
  renderSources();
  refresh();
  find("#workshop-controls").disabled = false;
  showStatus("");
  root.dataset.mounted = "true";
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-workshop]");
  if (root) mountWorkshop(root);
}
