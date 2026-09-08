import { describe, expect, test } from "bun:test";
import {
  SCHEMA_VERSION,
  LIMITS,
  countCodePoints,
  createDraft,
  validateDraft,
  projectDocument,
  safeSourceUrl,
  serializeHtml,
  serializeMarkdown,
  serializeDraft,
  importDraftFile,
  createExampleDraft,
  mountWorkshop,
} from "../pages-content/workshop/workshop.js";

type Draft = ReturnType<typeof createDraft>;
const source = () => ({ name: "渡頭舊鐘", url: "https://example.org/clock?day=1&hour=2", note: "呢個來源只係測試資料，冇讀取。", rights: "" });
const writtenDraft = (): Draft => {
  const draft = createDraft();
  draft.title = "雨停之前";
  draft.byline = "虛構作者";
  draft.body = "雨停之前，船長將一本冇寫完嘅簿留喺窗邊。\n\n佢話，未寫完唔等於唔值得帶走。";
  return draft;
};
const fileFor = (text: string) => new File([text], "草稿.json", { type: "application/json" });
const parseMarkdown = (text: string) => Bun.markdown.html(text);

function maximumDraft(character: string): Draft {
  const draft = createDraft();
  draft.title = character.repeat(LIMITS.title);
  draft.byline = character.repeat(LIMITS.byline);
  draft.body = character.repeat(LIMITS.body);
  draft.rights = character.repeat(LIMITS.rights);
  for (const key of Object.keys(draft.registers)) draft.registers[key] = character.repeat(LIMITS.register);
  draft.sources = Array.from({ length: LIMITS.sources }, () => ({
    name: character.repeat(LIMITS.sourceName),
    url: character.repeat(LIMITS.sourceUrl),
    note: character.repeat(LIMITS.sourceNote),
    rights: character.repeat(LIMITS.sourceRights),
  }));
  return draft;
}

describe("草稿同有界安全 clone", () => {
  test("冇 DOM 都可 import；初始真係空白，每次都係獨立 object", () => {
    expect(typeof globalThis.document).toBe("undefined");
    const a = createDraft();
    const b = createDraft();
    expect(a).toEqual({ schema_version: SCHEMA_VERSION, title: "", byline: "", body: "", rights: "", registers: { observation: "", interpretation: "", unknown: "" }, sources: [] });
    a.registers.unknown = "未知道";
    a.sources.push(source());
    expect(b.registers.unknown).toBe("");
    expect(b.sources).toEqual([]);
  });

  test("validator 逐欄重建，唔改原稿、唔共享巢狀引用", () => {
    const draft = writtenDraft();
    draft.sources.push(source());
    const before = JSON.stringify(draft);
    const clone = validateDraft(draft);
    expect(clone).toEqual(draft);
    expect(clone).not.toBe(draft);
    expect(clone.registers).not.toBe(draft.registers);
    expect(clone.sources[0]).not.toBe(draft.sources[0]);
    clone.sources[0].name = "另一份";
    clone.registers.observation = "獨立";
    expect(JSON.stringify(draft)).toBe(before);
  });

  test("Unicode 計 code points，唔當 UTF-16 units 或 grapheme clusters", () => {
    expect(countCodePoints("𠮷雨🌧️")).toBe(4);
    expect(countCodePoints("é")).toBe(2);
    expect(countCodePoints("👨\u200d👩\u200d👧\u200d👦")).toBe(7);
    const draft = writtenDraft();
    draft.title = "𠮷".repeat(LIMITS.title);
    expect(validateDraft(draft).title).toBe(draft.title);
    draft.title += "字";
    const retained = draft.title;
    expect(() => validateDraft(draft)).toThrow("原文冇截短");
    expect(draft.title).toBe(retained);
  });

  const textCases = [
    ["title", LIMITS.title], ["byline", LIMITS.byline], ["body", LIMITS.body], ["rights", LIMITS.rights],
  ] as const;
  for (const [field, max] of textCases) {
    test(`${field} 型別同 ${max} 上限都檢查`, () => {
      const draft = createDraft();
      draft[field] = "界".repeat(max);
      expect(validateDraft(draft)[field]).toBe(draft[field]);
      draft[field] += "界";
      expect(() => validateDraft(draft)).toThrow("超過");
      for (const value of [null, 12, true, {}, []]) {
        (draft as any)[field] = value;
        expect(() => validateDraft(draft)).toThrow("文字");
      }
    });
  }
  for (const key of ["observation", "interpretation", "unknown"]) {
    test(`${key} 附註上限同型別`, () => {
      const draft = createDraft();
      draft.registers[key] = "𠮷".repeat(LIMITS.register);
      expect(validateDraft(draft).registers[key]).toBe(draft.registers[key]);
      draft.registers[key] += "。";
      expect(() => validateDraft(draft)).toThrow("超過");
      draft.registers[key] = 1 as any;
      expect(() => validateDraft(draft)).toThrow("文字");
    });
  }
  for (const [key, max] of [["name", LIMITS.sourceName], ["url", LIMITS.sourceUrl], ["note", LIMITS.sourceNote], ["rights", LIMITS.sourceRights]] as const) {
    test(`來源 ${key} 上限同型別`, () => {
      const draft = createDraft();
      const item = source();
      draft.sources.push(item);
      item[key] = "字".repeat(max);
      expect(validateDraft(draft).sources[0][key]).toBe(item[key]);
      item[key] += "字";
      expect(() => validateDraft(draft)).toThrow("超過");
      item[key] = [] as any;
      expect(() => validateDraft(draft)).toThrow("文字");
    });
  }

  test("版本、closed keys、欄位缺漏、異常 shape 全部拒絕", () => {
    const mutations: ((draft: any) => void)[] = [
      (d) => { d.schema_version = "thekingdom.workshop-draft/9"; },
      (d) => { d.extra = "唔接受"; },
      (d) => { delete d.title; },
      (d) => { d.registers = []; },
      (d) => { d.registers.extra = "唔接受"; },
      (d) => { delete d.registers.unknown; },
      (d) => { d.sources = {}; },
      (d) => { d.sources = [null]; },
      (d) => { d.sources = [{ ...source(), extra: 1 }]; },
      (d) => { const item = source(); delete (item as any).rights; d.sources = [item]; },
      (d) => { d.sources = Array.from({ length: 9 }, source); },
      (d) => { d.sources = new Array(1); },
      (d) => { d.sources.note = "多咗"; },
      (d) => { d[Symbol("多咗")] = 1; },
    ];
    for (const mutate of mutations) {
      const draft = writtenDraft();
      mutate(draft);
      expect(() => validateDraft(draft)).toThrow();
    }
    for (const input of [null, true, 1, "{}", [], new Date()]) expect(() => validateDraft(input)).toThrow();
  });

  test("prototype 污染同 accessor 唔會混入 clone 或被執行", () => {
    for (const key of ["__proto__", "constructor", "prototype"]) {
      const malicious = JSON.parse(serializeDraft(createDraft()));
      Object.defineProperty(malicious, key, { value: { polluted: true }, enumerable: true });
      expect(() => validateDraft(malicious)).toThrow();
      const nested = createDraft();
      Object.defineProperty(nested.registers, key, { value: 1, enumerable: true });
      expect(() => validateDraft(nested)).toThrow();
      const atSource = createDraft();
      atSource.sources.push(source());
      Object.defineProperty(atSource.sources[0], key, { value: 1, enumerable: true });
      expect(() => validateDraft(atSource)).toThrow();
    }
    expect(({} as any).polluted).toBeUndefined();
    let calls = 0;
    const draft = createDraft();
    Object.defineProperty(draft, "body", { get() { calls += 1; return "唔應該讀"; }, enumerable: true });
    expect(() => validateDraft(draft)).toThrow();
    const withArrayGetter = createDraft();
    Object.defineProperty(withArrayGetter.sources, "0", { get() { calls += 1; return source(); }, enumerable: true });
    expect(() => validateDraft(withArrayGetter)).toThrow();
    expect(calls).toBe(0);
    expect(() => validateDraft(Object.assign(Object.create({ extra: 1 }), createDraft()))).toThrow();
    expect(validateDraft(Object.assign(Object.create(null), createDraft()))).toEqual(createDraft());
  });
});

describe("來源 URL 只將合資格 HTTPS 變成 link", () => {
  for (const url of [
    "javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "file:///tmp/test", "http://example.org", "//example.org", "/relative",
    "https://user:password@example.org", "https://@example.org", "https://name@example.org", " https://example.org", "https://example.org ",
    "https://example.org/\nnext", "https://exa\tmple.org", "https://example.org/\u0000", "https://example.org/\u007f", "https://example.org/\u0085",
    "https://example.org/%0aheader", "https://example.org/%00", "https://example.org/%1F", "https://example.org/%7f",
    "https://example.org/\u202eevil", "https://example.org/\u200b", "https://example.org\\@evil.org", "https:///example.org", "https://", "https://[invalid]", "",
  ]) {
    test(`拒絕 ${JSON.stringify(url)}`, () => expect(safeSourceUrl(url)).toBeNull());
  }
  test("percent-encoded Unicode 正規化後仍可用，控制字元同壞 escapes 仍拒絕", () => {
    for (const original of ["https://example.org/中文/工房?q=字", "https://example.org/𠮷", "https://例子.香港/路#節"]) {
      const normalized = new URL(original).href;
      expect(safeSourceUrl(original)).toBe(normalized);
      expect(safeSourceUrl(normalized)).toBe(normalized);
    }
    for (const value of ["%C2%85", "%E2%80%AE", "%E2%80%8B", "%EF%BB%BF", "%FF", "%wrong"]) {
      expect(safeSourceUrl(`https://example.org/${value}`)).toBeNull();
    }
  });
  test("合法 Unicode、query、fragment 只正規化，冇 fetch", () => {
    expect(safeSourceUrl("HTTPS://EXAMPLE.ORG/路?q=一&b=2#節")).toBe(new URL("https://example.org/路?q=一&b=2#節").href);
    expect(safeSourceUrl("https://example.org/a(b)_[c]?q=%20")).toBe("https://example.org/a(b)_[c]?q=%20");
    expect(safeSourceUrl(null)).toBeNull();
    expect(safeSourceUrl({ toString() { throw new Error("唔應該執行"); } })).toBeNull();
  });
});

describe("共同 projection 同權利界線", () => {
  test("虛構示例有完整主文，冇來源冒認，改寫唔污染下一份", () => {
    const example = createExampleDraft();
    expect(validateDraft(example)).toEqual(example);
    expect(example.title).toContain("虛構");
    expect(countCodePoints(example.body)).toBeGreaterThan(150);
    expect(example.sources).toEqual([]);
    expect(projectDocument(example).rights.status).toBe("作者聲明，未核實");
    const originalBody = example.body;
    example.body = "自己嘅改寫";
    expect(createExampleDraft().body).toBe(originalBody);
    expect(mountWorkshop(null)).toBeUndefined();
  });
  test("主文独立存在，零來源、零附註、權利未知照樣匯出", () => {
    const draft = writtenDraft();
    const document = projectDocument(draft);
    expect(document.body).toBe(draft.body);
    expect(document.registers).toEqual([]);
    expect(document.sources).toEqual([]);
    expect(document.rights).toEqual({ text: "", status: "未知" });
    expect(serializeHtml(draft)).toContain(draft.body);
    expect(serializeMarkdown(draft)).toContain(draft.body);
    expect(JSON.parse(serializeDraft(draft))).toEqual(draft);
    expect(serializeHtml(draft)).not.toContain("<h2>觀察</h2>");
  });
  test("附註 optional、固定次序，唔冒充工具判定", () => {
    const draft = writtenDraft();
    draft.registers.unknown = "未知道鐘係邊個修好。";
    draft.registers.observation = "指針移動咗。";
    draft.registers.interpretation = "  \n ";
    const document = projectDocument(draft);
    expect(document.registers.map((item) => item.key)).toEqual(["observation", "unknown"]);
    expect(document.notice).toContain("作者聲明");
    for (const serialize of [serializeHtml, serializeMarkdown]) {
      expect(serialize(draft)).toContain(draft.registers.observation);
      expect(serialize(draft)).toContain(draft.registers.unknown);
    }
  });
  test("未知同作者自述唔升格為 license 或已核實", () => {
    const draft = writtenDraft();
    draft.rights = "我聲明呢篇係原創。";
    draft.sources = [source(), { name: "", url: "javascript:alert(1)", note: "待查", rights: "某個授權，自述未核實" }];
    const document = projectDocument(draft);
    expect(document.rights.status).toBe("作者聲明，未核實");
    expect(document.sources[0].rights.status).toBe("未知");
    expect(document.sources[1].rights.status).toBe("作者聲明，未核實");
    expect(document.sources[1].name).toBe("來源 2");
    expect(document.sources[1].href).toBeNull();
    expect(document.sources[1].url).toBe("javascript:alert(1)");
    expect(document.sources[1].urlWarning).toContain("只保留文字");
    draft.rights = " \n ";
    expect(projectDocument(draft).rights.status).toBe("未知");
    expect(projectDocument(createDraft()).title).toBe("未命名作品");
  });
});

describe("HTML 同 Markdown 都只呈現原文", () => {
  const payload = '</title><script>alert("x")</script><img src="https://evil.example/x" onerror="alert(1)"><iframe srcdoc="bad"></iframe>\n# 偷換標題\n[按我](javascript:alert(1))\n![圖](https://evil.example/x)\n<https://evil.example>\nhttps://evil.example/auto\nuser@evil.example\n&amp; **粗體** `程式` [^note]\n[^note]: footnote\n---\n| a | b |';
  const maliciousDraft = () => {
    const draft = writtenDraft();
    draft.title = '</title><script>alert("x")</script>';
    draft.byline = '<img src="https://evil.example/x">';
    draft.body = payload;
    for (const key of Object.keys(draft.registers)) draft.registers[key] = payload;
    draft.rights = payload;
    draft.sources = [{ name: '<svg onload="alert(1)">', url: "javascript:alert(1)", note: payload, rights: payload }];
    return draft;
  };

  test("完整 HTML 有 UTF-8、有限 meta CSP、固定內置樣式同零 active markup", () => {
    const html = serializeHtml(maliciousDraft());
    expect(html.startsWith("<!doctype html>\n<html lang=\"zh-Hant\">\n")).toBe(true);
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain("default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; object-src 'none'");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;amp;");
    expect(html).not.toMatch(/<(?:script|img|iframe|form|svg|object|link|base|embed)\b/i);
    expect(html).not.toMatch(/\bhref="(?:javascript|data|http):/i);
    expect(html).not.toContain("url(");
    expect(html).toContain("javascript:alert(1)");
    expect(html).toContain("@media print");
  });

  test("Markdown raw HTML、headings、images、footnotes、autolinks 全部惰性", () => {
    const markdown = serializeMarkdown(maliciousDraft());
    const html = parseMarkdown(markdown);
    expect(markdown).not.toContain("<script>");
    expect(markdown).not.toContain("javascript:");
    expect(markdown).not.toContain("https://evil.example");
    expect(html).not.toMatch(/<(?:script|img|iframe|svg|object|a|table|strong|code|hr)\b/i);
    expect((html.match(/<h1>/g) || []).length).toBe(1);
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("javascript:alert(1)");
    expect(html).toContain("https://evil.example/auto");
    expect(html).toContain("&amp;amp;");
  });

  test("只有工具加嘅 HTTPS source link 可點，destination 括號唔走位", () => {
    const draft = writtenDraft();
    draft.sources = [{ name: "來源 [x]", url: 'https://example.org/a(b)_[c]?q="x"&next=1', note: "", rights: "" }];
    const html = serializeHtml(draft);
    expect((html.match(/<a /g) || []).length).toBe(1);
    expect(html).toContain('rel="noreferrer noopener" referrerpolicy="no-referrer"');
    expect(html).toContain("&amp;next=1");
    const markdown = serializeMarkdown(draft);
    expect(markdown).toContain("%28b%29_%5Bc%5D");
    const rendered = parseMarkdown(markdown);
    expect((rendered.match(/<a /g) || []).length).toBe(1);
    expect(rendered).toContain('href="https://example.org/');
    expect(rendered).not.toMatch(/<(?:script|img)\b/);
  });

  test("Markdown 唔重新解碼 source URL 嘅實體或改變目的地", () => {
    for (const url of [
      "https://trusted.example&commat;evil.example/",
      "https://example.org/?q=&#10;next",
      "https://example.org/?q=&amp;next=1",
      "https://example.org/?a=1&b=2#note",
      "https://example.org/?q=&quot;link",
    ]) {
      const draft = writtenDraft();
      draft.sources = [{ name: "目的地原樣保留", url, note: "", rights: "" }];
      expect(safeSourceUrl(url)).not.toBeNull();
      const expectedHref = serializeHtml(draft).match(/href="([^"]+)"/)?.[1];
      const renderedHref = parseMarkdown(serializeMarkdown(draft)).match(/href="([^"]+)"/)?.[1];
      expect(renderedHref).toBe(expectedHref);
    }
  });

  test("重覆輸出 deterministic，壞 draft 唔可以借 serializer 繞過驗證", () => {
    const draft = maliciousDraft();
    for (const serialize of [serializeHtml, serializeMarkdown, serializeDraft]) {
      expect(serialize(draft)).toBe(serialize(validateDraft(draft)));
      expect(() => serialize({ ...draft, surprise: true })).toThrow();
    }
  });
});

describe("JSON 大小、完整驗證同可重新編輯", () => {
  for (const [label, character] of [["四 byte Unicode", "𠮷"], ["JSON 六 byte escape", "\u0001"], ["未配對 surrogate", "\ud800"], ["引號同反斜線", "\\"]]) {
    test(`所有欄位最大值：${label} 仍小於 512 KiB 並完整 roundtrip`, async () => {
      const draft = maximumDraft(character);
      const json = serializeDraft(draft);
      expect(new TextEncoder().encode(json).length).toBeLessThanOrEqual(LIMITS.importBytes);
      expect(validateDraft(JSON.parse(json))).toEqual(draft);
      expect(await importDraftFile(fileFor(json))).toEqual(draft);
      expect(serializeDraft(await importDraftFile(fileFor(json)))).toBe(json);
    });
  }

  test("前後空白、換行、Unicode、原始 URL 都原樣保留", async () => {
    const draft = writtenDraft();
    draft.title = "  標題\r\n下一行  ";
    draft.body += "\r\n𠮷 é\t👨\u200d👩\u200d👧\u200d👦\u0000";
    draft.sources.push({ name: "原文", url: " http://not-safe.example ", note: "保留\r\n原文", rights: "" });
    expect(await importDraftFile(fileFor(serializeDraft(draft)))).toEqual(draft);
  });

  test("先查 size，過大檔案根本唔讀取", async () => {
    let reads = 0;
    const oversized = { size: LIMITS.importBytes + 1, async arrayBuffer() { reads += 1; throw new Error("唔應該讀"); } };
    await expect(importDraftFile(oversized)).rejects.toThrow("512 KiB");
    expect(reads).toBe(0);
    for (const size of [-1, NaN, Infinity, 1.5]) await expect(importDraftFile({ ...oversized, size })).rejects.toThrow();
  });

  test("512 KiB 正好可讀；多一 byte 拒絕", async () => {
    const json = serializeDraft(createDraft());
    const bytes = new TextEncoder().encode(json).length;
    const exact = fileFor(json + " ".repeat(LIMITS.importBytes - bytes));
    expect(exact.size).toBe(LIMITS.importBytes);
    expect(await importDraftFile(exact)).toEqual(createDraft());
    await expect(importDraftFile(fileFor(json + " ".repeat(LIMITS.importBytes - bytes + 1)))).rejects.toThrow("512 KiB");
  });

  test("壞 JSON、UTF-8、版本同型別都拒絕，原稿不受影響", async () => {
    const original = writtenDraft();
    const before = serializeDraft(original);
    for (const text of ["", "{", "null", "[]", "true", '{"__proto__":{"polluted":true}}', JSON.stringify({ ...original, schema_version: "other" }), JSON.stringify({ ...original, body: [] }), JSON.stringify({ ...original, body: "字".repeat(LIMITS.body + 1) })]) {
      await expect(importDraftFile(fileFor(text))).rejects.toThrow();
      expect(serializeDraft(original)).toBe(before);
    }
    await expect(importDraftFile(new File([new Uint8Array([0xff])], "bad.json"))).rejects.toThrow("UTF-8");
    await expect(importDraftFile({ size: 1, async arrayBuffer() { throw new Error("讀取失敗"); } })).rejects.toThrow("原稿保持不變");
    expect(serializeDraft(original)).toBe(before);
  });
});
