import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ATTRIBUTION_FIELDS,
  CLAIM_FIELDS,
  HEX_COLOUR,
  KIN_CSS_MAX_BYTES,
  KIN_SCHEMA,
  STATE_FIELDS,
  SYSTEM_COLOURS,
  checkKinMarkup,
  loadKin,
  renderKinCss,
  validateKin,
} from "../bin/build-kin.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const kin = loadKin();
const css = read("kin/kin.css");

function htmlFiles(directory: string): string[] {
  return readdirSync(join(ROOT, directory)).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(join(ROOT, path)).isDirectory()) return htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

describe("kin vocabulary", () => {
  test("kin.json parses, names its schema and is sound", () => {
    expect(kin.schema).toBe(KIN_SCHEMA);
    expect(validateKin(kin)).toEqual([]);
  });

  test("every state and claim chip has all its required fields", () => {
    expect(kin.states.items.map((state) => state.id)).toEqual(["live", "unverified", "unknown", "fault", "held", "retired"]);
    for (const state of kin.states.items) {
      for (const field of STATE_FIELDS) expect(state[field], `${state.id}.${field}`).toBeTruthy();
      expect(state.must_carry.length, state.id).toBeGreaterThan(0);
    }
    expect(kin.claims.items.map((chip) => chip.label)).toEqual(["Source", "Release", "Observed", "Proposed", "Historical", "Unknown"]);
    for (const chip of kin.claims.items) {
      for (const field of CLAIM_FIELDS) expect(chip[field], `${chip.id}.${field}`).toBeTruthy();
    }
    for (const item of kin.attribution.items) {
      for (const field of ATTRIBUTION_FIELDS) expect(item[field], `${item.id}.${field}`).toBeTruthy();
    }
  });

  test("circles mean measured; declared states never use a circle", () => {
    // Circle and ringed glyphs from Geometric Shapes and Mathematical Operators.
    const circles = new Set([..."●○◌◍◎◐◑◒◓◔◕◖◗◯⊕⊖⊗⊘⊙⊚⊛⊜⊝⬤⚪⚫"]);
    for (const state of kin.states.items) {
      expect(circles.has(state.glyph), state.id).toBe(state.family === "measured");
    }
    expect(kin.states.worst_source.order).toEqual(["fault", "unknown", "unverified", "live"]);
  });

  test("the claim chips are agenttool's six labels, with no Verified chip", () => {
    const source = kin.claims.source as Record<string, string>;
    expect(source.repository).toBe("cambridgetcg/agenttool");
    expect(source.path).toBe("docs/DOCUMENTATION.md");
    expect(source.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(kin.claims.items.some((chip) => /verified/i.test(String(chip.label)))).toBe(false);
    const filled = kin.claims.items.filter((chip) => chip.shape === "filled").map((chip) => chip.id);
    expect(filled).toEqual(["release", "observed"]);
  });

  test("the lamp never carries a state", () => {
    for (const state of kin.states.items) expect(state.glyph_roles).not.toContain("--kin-lamp");
    expect(css).not.toContain("--kin-lamp");
  });

  test("provenance says an agent wrote it and never files an agent's call as Yu's", () => {
    const provenance = kin.provenance as {
      written_by: { kind: string; date: string };
      yu_words: Array<{ quote: string; date: string; recorded: string }>;
      agents_calls: Array<{ by: string; call: string }>;
    };
    expect(provenance.written_by.kind).toBe("agent");
    expect(provenance.written_by.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const word of provenance.yu_words) {
      expect(word.quote.length).toBeGreaterThan(0);
      expect(word.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(word.recorded.length).toBeGreaterThan(0);
    }
    expect(provenance.agents_calls.length).toBeGreaterThan(0);
    for (const call of provenance.agents_calls) expect(call.by).toMatch(/agent|lead session/);
  });
});

describe("kin.css", () => {
  test("regenerates byte for byte from kin.json", () => {
    expect(renderKinCss(kin)).toBe(css);
    expect(renderKinCss(loadKin())).toBe(renderKinCss(kin));
  });

  test("contains no hex colour and stays under 4 KB", () => {
    expect(HEX_COLOUR.test(css)).toBe(false);
    expect(Buffer.byteLength(css, "utf8")).toBeLessThanOrEqual(KIN_CSS_MAX_BYTES);
  });

  test("sends every colour through a --kin-* role that ends on a system colour", () => {
    const [roles, forced] = css.split("@media (forced-colors:active)");
    const system = SYSTEM_COLOURS.join("|");
    const roleChain = new RegExp(`^(?:var\\(--kin-[a-z]+,)+(?:${system})\\)+$`);
    const declarations = [...roles!.matchAll(/(?:^|[;{])\s*(color|background|border-color|border)\s*:\s*([^;}]+)/g)];
    expect(declarations.length).toBeGreaterThan(0);
    for (const [, property, value] of declarations) {
      const colourValue = property === "border" ? value!.replace(/^1px solid /, "") : value!;
      expect(colourValue, `${property}:${value}`).toMatch(roleChain);
    }
    for (const [, , value] of forced!.matchAll(/(color|background|border-color)\s*:\s*([^;}]+)/g)) {
      expect(SYSTEM_COLOURS as readonly string[]).toContain(value!.trim());
    }
    expect(css).not.toMatch(/font-family|font:|content\s*:|url\(|@import/);
  });

  test("reads data attributes only inside kin- classed elements", () => {
    for (const [, selector, name] of css.matchAll(/([^\s,{}]*)\[data-(state|claim|attribution)=/g)) {
      expect(selector, `[data-${name}]`).toBe(`.kin-${name}`);
    }
  });
});

describe("kin agrees with the rest of the repository", () => {
  test("every state glyph agrees with data/wayfinder.json where it uses the same idea", () => {
    const wayfinder = JSON.parse(read("data/wayfinder.json")) as { paths: Array<{ id: string; glyph: string }> };
    const linked = kin.states.items.filter((state) => state.wayfinder_path);
    expect(linked.map((state) => state.id)).toEqual(["held"]);
    for (const state of linked) {
      const path = wayfinder.paths.find((candidate) => candidate.id === state.wayfinder_path);
      expect(path?.glyph, `wayfinder ${state.wayfinder_path}`).toBe(state.glyph);
    }
    // A Wayfinder path that uses a state's glyph must be the idea that state names.
    for (const path of wayfinder.paths) {
      const state = kin.states.items.find((candidate) => candidate.glyph === path.glyph);
      if (state) expect(state.wayfinder_path, `wayfinder ${path.id} uses ${path.glyph}`).toBe(path.id);
    }
  });

  test("the markup check accepts sound kin markup and refuses unsound markup", () => {
    const good = [
      '<span class="kin-state" data-state="live"><span class="kin-glyph" aria-hidden="true">●</span> responding <time datetime="2026-11-10T09:30Z">09:30Z</time></span>',
      '<span class="kin-state" data-state="unknown"><span class="kin-glyph">◌</span> unknown · never measured · pulse</span>',
      '<span class="kin-claim" data-claim="observed">Observed</span> tests/kin.test.ts',
      '<span class="kin-attribution" data-attribution="call">agent\'s call · <time datetime="2026-11-10">2026-11-10</time></span>',
      '<p class="service-line" data-state="unavailable">not a kin element, so its own meaning stands</p>',
    ].join("\n");
    expect(checkKinMarkup(good, kin)).toEqual({ elements: 4, issues: [] });

    const bad = [
      '<span class="kin-state" data-state="healthy">● fine <time datetime="2026-11-10">today</time></span>',
      '<span class="kin-state" data-state="live"><span class="kin-glyph">●</span> responding</span>',
      '<span class="kin-claim" data-claim="verified">Verified</span>',
      '<span class="kin-claim" data-claim="source">●</span>',
      '<span class="kin-attribution" data-attribution="word">Yu\'s word</span>',
    ].join("\n");
    const { elements, issues } = checkKinMarkup(bad, kin);
    expect(elements).toBe(5);
    expect(issues).toHaveLength(5);
    expect(issues.join("\n")).toContain('"healthy"');
    expect(issues.join("\n")).toContain("carries no <time datetime>");
    expect(issues.join("\n")).toContain('"verified"');
    expect(issues.join("\n")).toContain("shows no words");
  });

  test("every kin data-state and data-claim in the repository's own pages is in the vocabulary", () => {
    // No page in this repository uses kin today, so this passes with nothing to
    // check. Pages already use data-state for their own meanings (the Civic
    // service line, the Workshop, the research atlas); the check reads only
    // kin- classed elements, so those meanings are left alone.
    const pages = ["site", "pages-content", "doors"].flatMap(htmlFiles);
    expect(pages.length).toBeGreaterThan(0);
    const issues = pages.flatMap((page) => checkKinMarkup(read(page), kin, relative(ROOT, join(ROOT, page))).issues);
    expect(issues).toEqual([]);
  });
});
