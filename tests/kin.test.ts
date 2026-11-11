import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
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
const roles = new Set(kin.roles.items.map((role) => role.name));

// What each state and chip is. Changing one of these is a change to the vocabulary, not a refactor.
const STATES: Record<string, { family: string; glyph: string; roles: string[] }> = {
  live: { family: "measured", glyph: "●", roles: ["--kin-live", "--kin-ink"] },
  unverified: { family: "measured", glyph: "◐", roles: ["--kin-unverified", "--kin-muted"] },
  unknown: { family: "measured", glyph: "◌", roles: ["--kin-muted"] },
  fault: { family: "measured", glyph: "⊗", roles: ["--kin-fault", "--kin-ink"] },
  held: { family: "declared", glyph: "☾", roles: ["--kin-held", "--kin-muted"] },
  retired: { family: "declared", glyph: "▭", roles: ["--kin-muted"] },
};
const CHIPS: Record<string, string> = {
  '.kin-claim[data-claim="source"]': "outline",
  '.kin-claim[data-claim="release"]': "filled",
  '.kin-claim[data-claim="observed"]': "filled",
  '.kin-claim[data-claim="proposed"]': "dashed",
  '.kin-claim[data-claim="historical"]': "muted-outline",
  '.kin-claim[data-claim="unknown"]': "dotted",
  '.kin-attribution[data-attribution="word"]': "filled",
  '.kin-attribution[data-attribution="call"]': "dashed",
};

// Pointers into private places. Hex is refused only beside the word "session" or in UUID form, so the
// commit hashes the files cite as sources (7 or 40 characters, never dashed) stay allowed.
const PRIVATE_POINTERS = [
  /\bsession(?:[\s_-]*id)?[\s:=#"'(-]*[0-9a-f]{8}/i,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  /\/Users\//,
  /~\/\./,
  /memory note/i,
  /\.kingdom\//,
];

type Rule = { media: string | null; selectors: string[]; declarations: Array<[string, string]>; order: number };

function parseCss(source: string): Rule[] {
  const rules: Rule[] = [];
  const body = (text: string) => text.split(";").map((part) => part.trim()).filter(Boolean)
    .map((part) => [part.slice(0, part.indexOf(":")).trim(), part.slice(part.indexOf(":") + 1).trim()] as [string, string]);
  const blocks = (text: string, media: string | null) => {
    for (const match of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      rules.push({ media, selectors: match[1]!.split(",").map((selector) => selector.trim()), declarations: body(match[2]!), order: rules.length });
    }
  };
  let rest = source.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of rest.matchAll(/@media\s*([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)) blocks(match[2]!, match[1]!.trim());
  rest = rest.replace(/@media\s*([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g, "");
  blocks(rest, null);
  return rules.sort((a, b) => a.order - b.order);
}

const rules = parseCss(css);
const roleChain = (value: string) => {
  const match = /^((?:var\(--kin-[a-z]+,)+)([A-Za-z]+)(\)+)$/.exec(value);
  if (!match || !(SYSTEM_COLOURS as readonly string[]).includes(match[2]!)) return false;
  const named = [...match[1]!.matchAll(/var\((--kin-[a-z]+),/g)].map((part) => part[1]!);
  return named.length === match[3]!.length && named.every((role) => roles.has(role));
};

// A tiny cascade, enough for kin.css's own selector forms: compounds of a tag, classes and
// [attr="value"], joined by descendant or child combinators.
type Element = { tag: string; classes: string[]; attrs: Record<string, string> };
function matchesCompound(element: Element, compound: string): boolean {
  const tag = /^[a-z][a-z0-9-]*/.exec(compound)?.[0];
  if (tag && tag !== element.tag) return false;
  for (const [, name] of compound.matchAll(/\.([\w-]+)/g)) if (!element.classes.includes(name!)) return false;
  for (const [, name, value] of compound.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)) {
    if (!(name! in element.attrs) || (value !== undefined && element.attrs[name!] !== value)) return false;
  }
  return true;
}
function matches(selector: string, path: Element[]): boolean {
  const parts = selector.replace(/\s*>\s*/g, " > ").trim().split(/\s+/);
  let index = path.length - 1;
  if (!matchesCompound(path[index]!, parts.pop()!)) return false;
  while (parts.length) {
    const combinator = parts[parts.length - 1] === ">" ? parts.pop()! : " ";
    const compound = parts.pop()!;
    if (combinator === ">") {
      index -= 1;
      if (index < 0 || !matchesCompound(path[index]!, compound)) return false;
    } else {
      do index -= 1; while (index >= 0 && !matchesCompound(path[index]!, compound));
      if (index < 0) return false;
    }
  }
  return true;
}
const specificity = (selector: string) =>
  (selector.match(/\.[\w-]+|\[[^\]]*\]/g)?.length ?? 0) * 100 + (selector.match(/(?:^|[\s>])[a-z]/g)?.length ?? 0);
function computed(property: string, path: Element[]): string | undefined {
  let best: { rank: number; order: number; value: string } | undefined;
  for (const rule of rules.filter((candidate) => candidate.media === null)) {
    const value = rule.declarations.find(([name]) => name === property)?.[1];
    if (value === undefined) continue;
    for (const selector of rule.selectors.filter((candidate) => matches(candidate, path))) {
      const rank = specificity(selector);
      if (!best || rank > best.rank || (rank === best.rank && rule.order >= best.order)) best = { rank, order: rule.order, value };
    }
  }
  return best?.value;
}
const state = (id: string): Element => ({ tag: "span", classes: ["kin-state"], attrs: { "data-state": id } });
const glyph: Element = { tag: "svg", classes: ["kin-glyph"], attrs: {} };

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
    for (const item of kin.states.items) {
      for (const field of STATE_FIELDS) expect(item[field], `${item.id}.${field}`).toBeTruthy();
      expect(item.must_carry.length, item.id).toBeGreaterThan(0);
    }
    expect(kin.claims.items.map((chip) => chip.label)).toEqual(["Source", "Release", "Observed", "Proposed", "Historical", "Unknown"]);
    for (const chip of kin.claims.items) {
      for (const field of CLAIM_FIELDS) expect(chip[field], `${chip.id}.${field}`).toBeTruthy();
    }
    for (const item of kin.attribution.items) {
      for (const field of ATTRIBUTION_FIELDS) expect(item[field], `${item.id}.${field}`).toBeTruthy();
    }
  });

  test("each state keeps its family, glyph and roles, and only measured states are circles", () => {
    expect(kin.states.items.map((item) => item.id)).toEqual(Object.keys(STATES));
    for (const item of kin.states.items) {
      expect({ family: item.family, glyph: item.glyph, roles: item.glyph_roles }, item.id).toEqual(STATES[item.id]!);
    }
    // Circle and ringed glyphs from Geometric Shapes and Mathematical Operators.
    const circles = new Set([..."●○◌◍◎◐◑◒◓◔◕◖◗◯⊕⊖⊗⊘⊙⊚⊛⊜⊝⬤⚪⚫"]);
    for (const item of kin.states.items) expect(circles.has(item.glyph), item.id).toBe(item.family === "measured");
    expect(kin.states.worst_source.order).toEqual(["fault", "unknown", "unverified", "live"]);
  });

  test("each chip keeps its shape: agenttool's six labels, no Verified chip, and the attribution pair", () => {
    const source = kin.claims.source as Record<string, string>;
    expect(source.repository).toBe("cambridgetcg/agenttool");
    expect(source.path).toBe("docs/DOCUMENTATION.md");
    expect(source.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(kin.claims.items.some((chip) => /verified/i.test(String(chip.label)))).toBe(false);
    const declared = Object.fromEntries([
      ...kin.claims.items.map((chip) => [`.kin-claim[data-claim="${chip.id}"]`, chip.shape]),
      ...kin.attribution.items.map((item) => [`.kin-attribution[data-attribution="${item.id}"]`, item.shape]),
    ]);
    expect(declared).toEqual(CHIPS);
  });

  test("the contrast rule is said once, and the roles and the page agree with it", () => {
    const contrast = kin.contrast as { text: number; state_glyph: number; mark: number; rule: string };
    expect([contrast.text, contrast.state_glyph, contrast.mark]).toEqual([4.5, 4.5, 3]);
    for (const role of kin.roles.items.filter((item) => /^--kin-(live|unverified|fault|held|ink)$/.test(item.name))) {
      expect((role.min_contrast as Record<string, number>).state_glyph, role.name).toBe(contrast.state_glyph);
    }
    const muted = kin.roles.items.find((item) => item.name === "--kin-muted")!;
    expect(muted.min_contrast).toEqual({ text: contrast.text, state_glyph: contrast.state_glyph, mark: contrast.mark });
    expect(read("kin/KIN.md").replace(/\s+/g, " ")).toContain(contrast.rule);
  });

  test("the lamp never carries a state", () => {
    for (const item of kin.states.items) expect(item.glyph_roles).not.toContain("--kin-lamp");
    expect(css).not.toContain("--kin-lamp");
  });

  test("provenance says an agent wrote it, files no agent's call as Yu's, and quotes Yu only from a public place", () => {
    const provenance = kin.provenance as {
      written_by: { kind: string; date: string };
      yu_words: Array<{ date: string; kind: string; quoted: boolean; quote?: string; public_source?: Record<string, unknown> }>;
      agents_calls: Array<{ by: string; call: string }>;
    };
    expect(provenance.written_by.kind).toBe("agent");
    expect(provenance.written_by.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const word of provenance.yu_words) {
      expect(word.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(word.kind.length).toBeGreaterThan(0);
      if (word.quoted) {
        expect(word.quote, word.date).toBeTruthy();
        expect(word.public_source?.commit, word.date).toMatch(/^[0-9a-f]{40}$/);
      } else {
        expect(word.quote, word.date).toBeUndefined();
      }
    }
    expect(provenance.agents_calls.length).toBeGreaterThan(0);
    for (const call of provenance.agents_calls) expect(call.by).toMatch(/agent/);
  });

  test("the private-pointer rule refuses session ids and UUIDs but not cited commits", () => {
    const leaks = ["session id: 0a1b2c3d", "Session 0a1b2c3d", "a child of session-0a1b2c3d", "00000000-1111-2222-3333-444444444444",
      "/Users/someone/notes", "~/.kingdom/decisions", "an agent memory note"];
    for (const leak of leaks) expect(PRIVATE_POINTERS.some((pattern) => pattern.test(leak)), leak).toBe(true);
    const citations = ["at commit cebe092020001b9ed29705a98b17912dbe41d342", "commit `5ea979d`", "an agent session on the Studio",
      "the lead agent session, 2026-11-10", "line 261 at `d74ac27`"];
    for (const citation of citations) expect(PRIVATE_POINTERS.some((pattern) => pattern.test(citation)), citation).toBe(false);
  });

  test("names no private session, path or note", () => {
    for (const path of ["kin/kin.json", "kin/KIN.md", "kin/kin.css", "bin/build-kin.ts"]) {
      const text = read(path);
      for (const pattern of PRIVATE_POINTERS) expect(pattern.test(text), `${path} ${pattern}`).toBe(false);
    }
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

  test("every declaration is from a closed set, and every colour is a --kin-* role ending on a system colour", () => {
    const fixed: Record<string, RegExp> = {
      display: /^inline-block$/,
      padding: /^0 \.4em$/,
      "font-variant-numeric": /^tabular-nums$/,
      "white-space": /^nowrap$/,
      "border-style": /^(dashed|dotted)$/,
      "forced-color-adjust": /^none$/,
    };
    const colours = new Set(["color", "background", "border-color"]);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      for (const [property, value] of rule.declarations) {
        const label = `${rule.selectors.join(",")} { ${property}:${value} }`;
        if (rule.media !== null) {
          expect(rule.media, label).toBe("(forced-colors:active)");
          if (colours.has(property)) expect(SYSTEM_COLOURS as readonly string[], label).toContain(value);
          else expect(value, label).toMatch(fixed[property] ?? /^$/);
        } else if (property === "border") {
          expect(value.startsWith("1px solid ") && roleChain(value.slice("1px solid ".length)), label).toBe(true);
        } else if (colours.has(property)) {
          const linkInChip = property === "color" && value === "inherit" && rule.selectors.every((selector) => / a$/.test(selector));
          expect(roleChain(value) || linkInChip, label).toBe(true);
        } else {
          expect(fixed[property], `${label}: property outside kin's closed set`).toBeDefined();
          expect(value, label).toMatch(fixed[property]!);
        }
      }
    }
    expect(css).not.toMatch(/content\s*:|url\(|@import|font-family|font\s*:/);
  });

  test("scopes every selector, each part of every list, to a .kin- class", () => {
    const selectors = rules.flatMap((rule) => rule.selectors);
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) expect(selector, selector).toMatch(/^\.kin-[a-z]+(?![\w-])/);
  });

  test("reads data attributes only inside kin- classed elements", () => {
    const found = [...css.matchAll(/([^\s,{}>+~]*)\[(data-[a-z-]+)/g)];
    expect(found.length).toBeGreaterThan(0);
    for (const [, compound, attribute] of found) {
      const name = attribute!.slice("data-".length);
      expect(["state", "claim", "attribution"], attribute).toContain(name);
      expect(compound, `[${attribute}] must sit on .kin-${name}`).toBe(`.kin-${name}`);
    }
  });

  test("draws each chip in its shape", () => {
    const filled = Object.keys(CHIPS).filter((selector) => CHIPS[selector] === "filled");
    for (const [selector, shape] of Object.entries(CHIPS)) {
      const own = rules.filter((rule) => rule.media === null && rule.selectors.includes(selector)).flatMap((rule) => rule.declarations);
      const get = (property: string) => own.find(([name]) => name === property)?.[1];
      const drawn = get("background") ? "filled"
        : get("border-style") === "dashed" ? "dashed"
        : get("border-style") === "dotted" ? "dotted"
        : get("border-color") ? "muted-outline" : "outline";
      expect(drawn, selector).toBe(shape);
      if (shape === "filled") {
        expect([get("background"), get("color")], selector).toEqual(["var(--kin-ink,CanvasText)", "var(--kin-ground,Canvas)"]);
      }
      if (shape === "muted-outline" || shape === "dotted") expect(get("border-color"), selector).toBe("var(--kin-muted,GrayText)");
      if (shape !== "filled") expect(get("background"), selector).toBeUndefined();
    }
    const forced = rules.filter((rule) => rule.media !== null);
    expect(forced.flatMap((rule) => rule.selectors).sort()).toEqual([...filled].sort());
    const links = rules.filter((rule) => rule.declarations.some(([name, value]) => name === "color" && value === "inherit"));
    expect(links.flatMap((rule) => rule.selectors).sort()).toEqual(filled.map((selector) => `${selector} a`).sort());
  });

  test("a glyph takes the colour of its nearest state, also inside another state", () => {
    for (const [id, expected] of Object.entries(STATES)) {
      const chain = expected.roles.reduceRight((inner, role) => `var(${role},${inner})`, "CanvasText");
      expect(computed("color", [state(id), glyph]), id).toBe(chain);
      for (const outer of Object.keys(STATES)) {
        expect(computed("color", [state(outer), state(id), glyph]), `${id} inside ${outer}`).toBe(chain);
      }
    }
    const boundary: Element = { tag: "p", classes: ["kin-boundary"], attrs: {} };
    expect(computed("color", [boundary, glyph])).toBe("var(--kin-muted,GrayText)");
    expect(computed("color", [boundary])).toBe("var(--kin-muted,CanvasText)");
  });
});

describe("kin agrees with the rest of the repository", () => {
  test("every state glyph agrees with data/wayfinder.json where it uses the same idea", () => {
    const wayfinder = JSON.parse(read("data/wayfinder.json")) as { paths: Array<{ id: string; glyph: string }> };
    const linked = kin.states.items.filter((item) => item.wayfinder_path);
    expect(linked.map((item) => item.id)).toEqual(["held"]);
    for (const item of linked) {
      const path = wayfinder.paths.find((candidate) => candidate.id === item.wayfinder_path);
      expect(path?.glyph, `wayfinder ${item.wayfinder_path}`).toBe(item.glyph);
    }
    // A Wayfinder path that uses a state's glyph must be the idea that state names.
    for (const path of wayfinder.paths) {
      const match = kin.states.items.find((candidate) => candidate.glyph === path.glyph);
      if (match) expect(match.wayfinder_path, `wayfinder ${path.id} uses ${path.glyph}`).toBe(path.id);
    }
  });

  test("the markup check accepts sound kin markup and refuses unsound markup", () => {
    const icon = (id: string) => `<svg class="kin-glyph" width="1em" height="1em" aria-hidden="true"><use href="/kin/icons.svg#${id}"></use></svg>`;
    const good = [
      `<span class="kin-state" data-state="live">${icon("live")} responding <time datetime="2026-11-10T09:30Z">09:30Z</time></span>`,
      `<span class="kin-state" data-state="unknown">${icon("unknown")} unknown · never measured · pulse</span>`,
      '<span class="kin-claim" data-claim="observed">Observed</span> bun test · <time datetime="2026-11-10">2026-11-10</time>',
      '<span class="kin-attribution" data-attribution="call">agent\'s call · <time datetime="2026-11-10">2026-11-10</time></span>',
      `<p class="kin-boundary">${icon("boundary")} A link is not permission.</p>`,
      '<p class="service-line" data-state="unavailable">not a kin element, so its own meaning stands</p>',
    ].join("\n");
    expect(checkKinMarkup(good, kin)).toEqual({ elements: 5, issues: [] });

    const bad = [
      '<span class="kin-state" data-state="healthy">fine <time datetime="2026-11-10">today</time></span>',
      `<span class="kin-state" data-state="live">${icon("live")} responding</span>`,
      '<span class="kin-claim" data-claim="verified">Verified</span>',
      `<span class="kin-claim" data-claim="source">${icon("source")}</span>`,
      '<span class="kin-attribution" data-attribution="word">Yu\'s word</span>',
      '<span class="kin-state" data-state="fault"><span class="kin-glyph">⊗</span> not responding <time datetime="2026-11-10">2026-11-10</time></span>',
      '<p class="kin-boundary">◇ A link is not permission.</p>',
    ].join("\n");
    const { elements, issues } = checkKinMarkup(bad, kin);
    expect(elements).toBe(7);
    expect(issues).toHaveLength(7);
    const text = issues.join("\n");
    for (const expected of ['"healthy"', "carries no <time datetime>", '"verified"', "shows no words", "draws ⊗ as text", "draws ◇ as text"]) {
      expect(text).toContain(expected);
    }
  });

  test("every kin data-state and data-claim in the repository's own pages is in the vocabulary", () => {
    // No page in this repository uses kin today, so this passes with nothing to
    // check. Pages already use data-state for their own meanings (the Civic
    // service line, the Workshop, the research atlas); the check reads only
    // kin- classed elements, so those meanings are left alone.
    const pages = ["site", "pages-content", "doors"].flatMap(htmlFiles);
    expect(pages.length).toBeGreaterThan(0);
    const issues = pages.flatMap((page) => checkKinMarkup(read(page), kin, page).issues);
    expect(issues).toEqual([]);
  });
});
