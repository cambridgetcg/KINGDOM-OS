#!/usr/bin/env bun
/**
 * kin: writes kin/kin.css from kin/kin.json (schema thekingdom.kin/0.1).
 *
 * The stylesheet is role-only: the state line, the claim chips, the attribution
 * pair, the stamps and the boundary line, coloured only through --kin-* roles
 * that fall back to system colours. It carries no hex colour, no font and no
 * glyph, and its bytes depend on kin.json alone. It reads nothing else, fetches
 * nothing and deploys nothing; no page in this repository loads it yet.
 *
 *   bun bin/build-kin.ts           write kin/kin.css
 *   bun bin/build-kin.ts --check   exit 1 if kin/kin.css differs from kin.json
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const KIN_JSON = join(ROOT, "kin", "kin.json");
export const KIN_CSS = join(ROOT, "kin", "kin.css");
export const KIN_SCHEMA = "thekingdom.kin/0.1";
export const KIN_CSS_MAX_BYTES = 4096;
export const SYSTEM_COLOURS = ["Canvas", "CanvasText", "GrayText", "LinkText"] as const;
export const HEX_COLOUR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/;

export const STATE_FIELDS = ["id", "family", "glyph", "glyph_name", "words", "means", "must_carry", "glyph_roles"] as const;
export const CLAIM_FIELDS = ["id", "label", "shape", "documentation"] as const;
export const ATTRIBUTION_FIELDS = ["id", "words", "shape", "means"] as const;
const FAMILIES = ["measured", "declared"];
const SHAPES = ["filled", "outline", "dashed", "muted-outline", "dotted"] as const;
type Shape = (typeof SHAPES)[number];
type Use = "text" | "glyph";

export type KinState = { id: string; family: string; glyph: string; words: string; means: string;
  must_carry: string[]; glyph_roles: string[]; wayfinder_path?: string; [key: string]: unknown };
export type KinChip = { id: string; label?: string; words?: string; shape: Shape; [key: string]: unknown };
export type KinRole = { name: string; fallback?: string | Record<Use, string>; fallback_role?: string; [key: string]: unknown };
export type Kin = {
  schema: string;
  states: { items: KinState[]; worst_source: { order: string[] }; [key: string]: unknown };
  claims: { items: KinChip[]; [key: string]: unknown };
  attribution: { items: KinChip[]; [key: string]: unknown };
  roles: { items: KinRole[]; [key: string]: unknown };
  provenance: Record<string, unknown>;
  [key: string]: unknown;
};

export function loadKin(path = KIN_JSON): Kin {
  return JSON.parse(readFileSync(path, "utf8")) as Kin;
}

const filled = (value: unknown) =>
  value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0);

function missing(record: Record<string, unknown>, fields: readonly string[], label: string): string[] {
  return fields.filter((field) => !filled(record[field])).map((field) => `${label}: missing ${field}`);
}

/** Every problem that would make the vocabulary or its stylesheet unsound; [] when sound. */
export function validateKin(kin: Kin): string[] {
  const problems: string[] = [];
  if (kin.schema !== KIN_SCHEMA) problems.push(`schema is ${JSON.stringify(kin.schema)}, not ${KIN_SCHEMA}`);
  const roles = new Map((kin.roles?.items ?? []).map((role) => [role.name, role]));
  for (const role of roles.values()) {
    if (!role.name.startsWith("--kin-")) problems.push(`role ${role.name}: not a --kin- role`);
    if (!role.fallback && !role.fallback_role) problems.push(`role ${role.name}: no fallback`);
    if (role.fallback_role && !roles.has(role.fallback_role)) problems.push(`role ${role.name}: unknown fallback_role`);
  }
  const states = kin.states?.items ?? [];
  if (states.length !== 6) problems.push(`expected 6 states, found ${states.length}`);
  for (const state of states) {
    const label = `state ${state.id ?? "?"}`;
    problems.push(...missing(state, STATE_FIELDS, label));
    if (!FAMILIES.includes(state.family)) problems.push(`${label}: family must be measured or declared`);
    for (const [index, role] of (state.glyph_roles ?? []).entries()) {
      if (!roles.has(role)) problems.push(`${label}: unknown role ${role}`);
      const next = state.glyph_roles[index + 1];
      if (next && roles.get(role)?.fallback_role !== next) problems.push(`${label}: ${role} does not fall back to ${next}`);
    }
  }
  for (const key of ["id", "glyph"] as const) {
    if (new Set(states.map((state) => state[key])).size !== states.length) problems.push(`state ${key}s are not unique`);
  }
  const measured = states.filter((state) => state.family === "measured").map((state) => state.id).sort();
  if (JSON.stringify([...(kin.states?.worst_source?.order ?? [])].sort()) !== JSON.stringify(measured)) {
    problems.push("worst_source.order must list each measured state once");
  }
  const chips = kin.claims?.items ?? [];
  if (chips.length !== 6) problems.push(`expected 6 claim chips, found ${chips.length}`);
  for (const chip of chips) {
    problems.push(...missing(chip, CLAIM_FIELDS, `claim ${chip.id ?? "?"}`));
    if (!SHAPES.includes(chip.shape)) problems.push(`claim ${chip.id}: unknown shape ${chip.shape}`);
  }
  if (new Set(chips.map((chip) => chip.id)).size !== chips.length) problems.push("claim ids are not unique");
  const pair = kin.attribution?.items ?? [];
  if (JSON.stringify(pair.map((item) => item.id)) !== JSON.stringify(["word", "call"])) {
    problems.push("attribution must be the pair word, call");
  }
  for (const item of pair) {
    problems.push(...missing(item, ATTRIBUTION_FIELDS, `attribution ${item.id ?? "?"}`));
    if (!SHAPES.includes(item.shape)) problems.push(`attribution ${item.id}: unknown shape ${item.shape}`);
  }
  if (!filled(kin.provenance)) problems.push("missing provenance");
  if (HEX_COLOUR.test(JSON.stringify(kin))) problems.push("kin.json names a hex colour; kin has no palette");
  return problems;
}

function systemColour(kin: Kin, name: string, use: Use): string {
  const role = kin.roles.items.find((item) => item.name === name);
  if (!role) throw new Error(`unknown role ${name}`);
  if (role.fallback_role) return systemColour(kin, role.fallback_role, use);
  const colour = typeof role.fallback === "string" ? role.fallback : role.fallback?.[use];
  if (!colour || !(SYSTEM_COLOURS as readonly string[]).includes(colour)) {
    throw new Error(`role ${name} has no system-colour fallback for ${use}`);
  }
  return colour;
}

/** var(--a,var(--b,System)): the first role a door defines wins, then the system colour. */
function colour(kin: Kin, roles: string[], use: Use): string {
  return roles.reduceRight((inner, role) => `var(${role},${inner})`, systemColour(kin, roles[roles.length - 1]!, use));
}

/** The stylesheet for a vocabulary; throws rather than emit a palette, an unknown shape or an oversize file. */
export function renderKinCss(kin: Kin): string {
  const problems = validateKin(kin);
  if (problems.length) throw new Error(`kin.json is not sound:\n${problems.join("\n")}`);
  const ink = colour(kin, ["--kin-ink"], "text");
  const ground = colour(kin, ["--kin-ground"], "text");
  const mutedText = colour(kin, ["--kin-muted"], "text");
  const mutedGlyph = colour(kin, ["--kin-muted"], "glyph");
  const chips = [
    ...kin.claims.items.map((chip) => ({ shape: chip.shape, selector: `.kin-claim[data-claim="${chip.id}"]` })),
    ...kin.attribution.items.map((item) => ({ shape: item.shape, selector: `.kin-attribution[data-attribution="${item.id}"]` })),
  ];
  const withShape = (shape: Shape) => chips.filter((chip) => chip.shape === shape).map((chip) => chip.selector).join(",");
  const shapeRules: Record<Exclude<Shape, "outline">, string> = {
    filled: `background:${ink};color:${ground}`,
    dashed: "border-style:dashed",
    "muted-outline": `border-color:${mutedGlyph};color:${mutedText}`,
    dotted: `border-style:dotted;border-color:${mutedGlyph}`,
  };
  const lines = [
    `/* kin.css: generated by bin/build-kin.ts from kin/kin.json (${KIN_SCHEMA}). Do not edit by hand.`,
    "   Role-only: no palette, no font, no glyph. A door that adopts kin maps each --kin-* role onto a",
    "   colour it already has; a role it leaves undefined falls back to a system colour. See kin/KIN.md. */",
    `.kin-state{color:${ink};font-variant-numeric:tabular-nums}`,
    ...kin.states.items.map((state) =>
      `.kin-state[data-state="${state.id}"] .kin-glyph{color:${colour(kin, state.glyph_roles, "glyph")}}`),
    `.kin-claim,.kin-attribution{display:inline-block;padding:0 .4em;border:1px solid ${ink};color:${ink};font-variant-numeric:tabular-nums}`,
    ...(Object.keys(shapeRules) as Array<keyof typeof shapeRules>)
      .filter((shape) => withShape(shape))
      .map((shape) => `${withShape(shape)}{${shapeRules[shape]}}`),
    `.kin-stamp{color:${mutedText};font-variant-numeric:tabular-nums;white-space:nowrap}`,
    `.kin-boundary{color:${mutedText}}`,
    `.kin-boundary .kin-glyph{color:${mutedGlyph}}`,
    // Under forced colours a fill would be dropped, and here the fill is the meaning.
    ...(withShape("filled")
      ? [`@media (forced-colors:active){${withShape("filled")}{forced-color-adjust:none;background:CanvasText;color:Canvas;border-color:CanvasText}}`]
      : []),
  ];
  const css = lines.join("\n") + "\n";
  if (HEX_COLOUR.test(css)) throw new Error("kin.css would contain a hex colour");
  const bytes = Buffer.byteLength(css, "utf8");
  if (bytes > KIN_CSS_MAX_BYTES) throw new Error(`kin.css would be ${bytes} bytes, over ${KIN_CSS_MAX_BYTES}`);
  return css;
}

const KIN_CLASS = /(?:^|\s)kin-(state|claim|attribution)(?:\s|$)/;
const START_TAG = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const TIME = /<time\b[^>]*\bdatetime\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)/i;

function attributes(source: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const match of source.matchAll(ATTRIBUTE)) found.set(match[1]!.toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
  return found;
}

/** The markup inside an element, counting nested tags of the same name. */
function inner(html: string, tag: string, start: number): string {
  const pattern = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
  pattern.lastIndex = start;
  let depth = 1;
  for (let match = pattern.exec(html); match; match = pattern.exec(html)) {
    depth += match[1] ? -1 : match[0].endsWith("/>") ? 0 : 1;
    if (depth === 0) return html.slice(start, match.index);
  }
  return html.slice(start);
}

/**
 * Checks kin markup in one HTML document: every kin-state, kin-claim and
 * kin-attribution element names a value in the vocabulary and shows words, and
 * states and attributions carry a <time datetime>. Elements without a kin- class
 * keep their own data-state meanings and are not read.
 */
export function checkKinMarkup(html: string, kin: Kin, label = "page"): { elements: number; issues: string[] } {
  const vocabulary = {
    state: new Map(kin.states.items.map((state) => [state.id, state])),
    claim: new Set(kin.claims.items.map((chip) => chip.id)),
    attribution: new Set(kin.attribution.items.map((item) => item.id)),
  };
  const issues: string[] = [];
  let elements = 0;
  for (const match of html.matchAll(START_TAG)) {
    const attrs = attributes(match[2] ?? "");
    const kind = KIN_CLASS.exec(attrs.get("class") ?? "")?.[1] as "state" | "claim" | "attribution" | undefined;
    if (!kind) continue;
    elements += 1;
    const value = attrs.get(`data-${kind}`);
    const where = `${label}: <${match[1]} class="kin-${kind}" data-${kind}=${JSON.stringify(value ?? null)}>`;
    const known = kind === "state" ? vocabulary.state.has(value ?? "") : vocabulary[kind].has(value ?? "");
    if (!known) { issues.push(`${where}: not in the kin vocabulary`); continue; }
    const content = inner(html, match[1]!, match.index! + match[0].length);
    const words = content.replace(/<[^>]*>/g, " ");
    if (!/\p{L}/u.test(words)) issues.push(`${where}: shows no words`);
    const needsTime = kind === "attribution" || (kind === "state" && !(value === "unknown" && /never measured/i.test(words)));
    if (needsTime && !TIME.test(content)) issues.push(`${where}: carries no <time datetime>`);
  }
  return { elements, issues };
}

export function runCli(argv = process.argv.slice(2)): number {
  const unknown = argv.filter((arg) => arg !== "--check");
  if (unknown.length) {
    process.stderr.write(`usage: bun bin/build-kin.ts [--check]\nunknown argument: ${unknown.join(" ")}\n`);
    return 2;
  }
  let css: string;
  try {
    css = renderKinCss(loadKin());
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
  const current = existsSync(KIN_CSS) ? readFileSync(KIN_CSS, "utf8") : null;
  if (argv.includes("--check")) {
    if (current === css) {
      process.stdout.write(`kin/kin.css matches kin/kin.json (${Buffer.byteLength(css, "utf8")} bytes)\n`);
      return 0;
    }
    process.stderr.write("kin/kin.css differs from kin/kin.json; run: bun bin/build-kin.ts\n");
    return 1;
  }
  if (current !== css) writeFileSync(KIN_CSS, css, "utf8");
  process.stdout.write(`kin/kin.css ${current === css ? "unchanged" : "written"} (${Buffer.byteLength(css, "utf8")} bytes)\n`);
  return 0;
}

if (import.meta.main) process.exitCode = runCli();
