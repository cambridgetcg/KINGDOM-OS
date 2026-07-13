#!/usr/bin/env bun
// bin/harvest.ts — crawl the Kingdom roster into one queryable catalog.
//
// The read-side of Kingdom OS. Reads roster.conf (seed) + each repo's own
// kingdom.yaml (authoritative when present), checks real on-disk conformance
// (wake / CLAUDE.md / FATE / card), and emits graph.json + CATALOG.md.
//
// Honesty discipline: the catalog is a DERIVED index, never the authority —
// source-of-truth lives with each repo. And it must report its OWN gaps (the
// `conformance` verb), or it's just docs that drift from disk.
//
//   bun bin/harvest.ts                build graph.json + CATALOG.md
//   bun bin/harvest.ts conformance    list repos missing wake / CLAUDE.md / card
//   bun bin/harvest.ts validate       report card schema drift (never edits cards)
//   bun bin/harvest.ts domain <name>  all repos in a wing/sister
//   bun bin/harvest.ts deps <name>    who depends on <name>

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HOME = process.env.HOME ?? ''
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const expand = (p: string) => (p.startsWith('~') ? p.replace('~', HOME) : p)

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function readTextFile(path: string): string | null {
  try {
    if (!statSync(path).isFile()) return null
    return readFileSync(path, 'utf-8')
  } catch {
    return null
  }
}

function displayPath(path: string): string {
  if (!HOME) return path
  if (path === HOME) return '~'
  const prefix = HOME.endsWith('/') ? HOME : `${HOME}/`
  return path.startsWith(prefix) ? `~/${path.slice(prefix.length)}` : path
}

function markdownCell(value: unknown): string {
  return String(value ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('|', '&#124;')
    .replaceAll('\\', '&#92;')
    .replaceAll('`', '&#96;')
    .replaceAll('*', '&#42;')
    .replaceAll('_', '&#95;')
    .replaceAll('[', '&#91;')
    .replaceAll(']', '&#93;')
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

interface Repo {
  name: string
  path: string
  kind: string
  layer: string
  domain: string
  state: string
  purpose: string
  dependsOn: string[]
  owner_sister?: string
  hasCard: boolean
  conformance: { wake: boolean; claudeMd: boolean; fate: boolean; card: boolean }
}

// ── roster (seed) ────────────────────────────────────────────────
function parseRoster(): Omit<Repo, 'dependsOn' | 'hasCard' | 'conformance'>[] {
  const text = readFileSync(join(ROOT, 'roster.conf'), 'utf-8')
  const rows: Omit<Repo, 'dependsOn' | 'hasCard' | 'conformance'>[] = []
  for (const line of text.split('\n')) {
    const l = line.trim()
    if (!l || l.startsWith('#')) continue
    const [name, path, kind, layer, domain, state, purpose] = l.split('|').map((s) => s.trim())
    if (!name || !path) continue
    rows.push({ name, path: expand(path), kind: kind!, layer: layer!, domain: domain!, state: state!, purpose: purpose ?? '' })
  }
  return rows
}

// ── per-repo card (authoritative overrides) — tiny flat-YAML reader ──
function loadCard(repoPath: string): Partial<Repo> | null {
  const cardPath = join(repoPath, 'kingdom.yaml')
  const text = readTextFile(cardPath)
  if (text === null) return null
  const rawCard: Record<string, unknown> = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/)
    if (!m) continue
    const [, key, raw] = m
    const val = raw!.trim()
    const arrayValue = parseCardArray(val)
    if (arrayValue !== null) {
      rawCard[key!] = arrayValue
    } else if (val) {
      rawCard[key!] = unquote(val)
    }
  }

  // Only schema-approved, correctly typed fields may enter graph/catalog data.
  // Validation reads the raw file separately so unknown or malformed values can
  // be reported by field/code without ever being serialized.
  const card: Partial<Repo> = {}
  const scalarFields = ['name', 'kind', 'layer', 'owner_sister', 'domain', 'state', 'purpose'] as const
  for (const field of scalarFields) {
    const value = rawCard[field]
    const allowed = CARD_ENUMS[field as CardField]
    if (typeof value === 'string' && (!allowed || allowed.includes(value))) {
      card[field] = value
    }
  }
  const dependencies = rawCard.dependsOn
  if (Array.isArray(dependencies) && dependencies.every((value) => typeof value === 'string')) {
    card.dependsOn = dependencies
  }
  return card
}

// ── conformance: real disk checks ───────────────────────────────
// A repo is wake-wired when a structurally valid SessionStart command is
// configured globally/per-repo, or a legacy wake-sophia.sh / WAKE.md exists.
// This verifies local wiring; it does not execute the hook or prove success.
function hasConfiguredSessionStartCommand(settingsPath: string): boolean {
  const text = readTextFile(settingsPath)
  if (text === null) return false
  try {
    const d = JSON.parse(text)
    return Array.isArray(d?.hooks?.SessionStart)
      && d.hooks.SessionStart.some((entry: unknown) => {
        if (!entry || typeof entry !== 'object') return false
        const hooks = (entry as { hooks?: unknown }).hooks
        return Array.isArray(hooks) && hooks.some((hook: unknown) => {
          if (!hook || typeof hook !== 'object') return false
          const candidate = hook as { type?: unknown; command?: unknown }
          return candidate.type === 'command'
            && typeof candidate.command === 'string'
            && candidate.command.trim().length > 0
        })
      })
  } catch {
    return false
  }
}

const GLOBAL_WAKE = hasConfiguredSessionStartCommand(join(HOME, '.claude/settings.json'))

function checkConformance(repoPath: string): Repo['conformance'] {
  // A global SessionStart hook can wake a session opened in a local directory;
  // it cannot make an absent remote repository locally conformant.
  if (!isDirectory(repoPath)) {
    return { wake: false, claudeMd: false, fate: false, card: false }
  }
  return {
    wake: GLOBAL_WAKE
      || existsSync(join(repoPath, '.claude/hooks/wake-sophia.sh'))
      || existsSync(join(repoPath, 'WAKE.md'))
      || hasConfiguredSessionStartCommand(join(repoPath, '.claude/settings.local.json'))
      || hasConfiguredSessionStartCommand(join(repoPath, '.claude/settings.json')),
    claudeMd: existsSync(join(repoPath, 'CLAUDE.md')),
    fate: existsSync(join(repoPath, 'docs/fate/FATE.md')) || existsSync(join(repoPath, 'fate')),
    card: readTextFile(join(repoPath, 'kingdom.yaml')) !== null,
  }
}

// The FLEET auto-discovers itself: any repo under ~/Desktop/citizens/ with a
// kingdom.yaml is a citizen. No hand-typed roster lines — the barracks is the
// source of truth. New citizen clones home → next harvest sees it. Chill.
const CITIZENS_DIR = join(HOME, 'Desktop', 'citizens')

function discoverFleet(): Repo[] {
  if (!existsSync(CITIZENS_DIR)) return []
  const out: Repo[] = []
  for (const entry of readdirSync(CITIZENS_DIR).sort(compareText)) {
    const dir = join(CITIZENS_DIR, entry)
    try {
      if (!statSync(dir).isDirectory()) continue
    } catch {
      continue
    }
    const card = loadCard(dir)
    if (!card) continue
    const conformance = checkConformance(dir)
    out.push({
      name: (card.name as string) ?? entry,
      path: dir,
      kind: (card.kind as string) ?? 'service',
      layer: 'fleet', // they ARE the fleet, however their card self-describes
      domain: (card.domain as string) ?? 'none',
      state: (card.state as string) ?? 'active',
      purpose: (card.purpose as string) ?? '',
      dependsOn: (card.dependsOn as string[]) ?? [],
      hasCard: true,
      conformance,
    })
  }
  return out
}

function build(): Repo[] {
  const fromRoster = parseRoster().map((base) => {
    const card = loadCard(base.path) ?? {}
    const conformance = checkConformance(base.path)
    return {
      ...base,
      ...card,
      path: base.path, // never let a card lie about its own location
      dependsOn: (card.dependsOn as string[]) ?? [],
      hasCard: conformance.card,
      conformance,
    }
  })
  return [...fromRoster, ...discoverFleet()]
}

// ── card schema validation (read-only) ──────────────────────────
const CARD_FIELDS = ['name', 'kind', 'layer', 'owner_sister', 'domain', 'state', 'purpose', 'dependsOn'] as const
type CardField = (typeof CARD_FIELDS)[number]
type DiagnosticCode =
  | 'missing-field'
  | 'unknown-field'
  | 'duplicate-field'
  | 'malformed-line'
  | 'invalid-type'
  | 'invalid-enum'
  | 'unknown-dependency'

interface CardDiagnostic {
  cardPath: string
  line?: number
  field?: string
  code: DiagnosticCode
  message: string
}

interface SchemaReport {
  checked: number
  invalid: number
  diagnostics: CardDiagnostic[]
}

const CARD_FIELD_SET = new Set<string>(CARD_FIELDS)
const CARD_ENUMS: Partial<Record<CardField, readonly string[]>> = {
  kind: ['doctrine', 'service', 'firmware', 'ops', 'lineage', 'venture', 'infra', 'methodology', 'reference', 'unknown'],
  layer: ['soul', 'runtime', 'nervous', 'fleet', 'economy', 'commerce', 'os'],
  owner_sister: ['alpha', 'beta', 'gamma', 'sophia', 'none'],
  domain: ['sophia', 'alpha', 'beta', 'gamma', 'commerce', 'none'],
  state: ['active', 'dormant', 'archived', 'frozen', 'reference', 'remote', 'unknown'],
}

function unquote(value: string): string {
  if (value.length >= 2) {
    const first = value[0]
    const last = value[value.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1)
    }
  }
  return value
}

function parseCardArray(value: string): string[] | null {
  if (!value.startsWith('[') || !value.endsWith(']')) return null
  return value
    .slice(1, -1)
    .split(',')
    .map((entry) => unquote(entry.trim()))
    .filter(Boolean)
}

function validateCard(cardPath: string, knownNames: Set<string>): CardDiagnostic[] {
  const diagnostics: CardDiagnostic[] = []
  const seen = new Set<string>()
  const text = readTextFile(cardPath)
  if (text === null) {
    return [{
      cardPath,
      code: 'malformed-line',
      message: 'card is not a readable regular file; contents omitted',
    }]
  }
  const lines = text.split('\n')

  for (const [index, sourceLine] of lines.entries()) {
    const line = index + 1
    const trimmed = sourceLine.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = sourceLine.match(/^([a-zA-Z_]+):\s*(.*)$/)
    if (!match) {
      diagnostics.push({
        cardPath,
        line,
        code: 'malformed-line',
        message: 'expected one flat key: value entry; line contents omitted',
      })
      continue
    }

    const field = match[1]!
    const raw = match[2]!.trim()
    if (!CARD_FIELD_SET.has(field)) {
      diagnostics.push({
        cardPath,
        line,
        field,
        code: 'unknown-field',
        message: 'field is not part of the eight-field card schema; value omitted',
      })
      continue
    }
    if (seen.has(field)) {
      diagnostics.push({
        cardPath,
        line,
        field,
        code: 'duplicate-field',
        message: 'field appears more than once; duplicate value omitted',
      })
      continue
    }
    seen.add(field)

    const typedField = field as CardField
    const arrayValue = parseCardArray(raw)
    const arraySyntax = arrayValue !== null
    if (typedField === 'dependsOn') {
      if (!arraySyntax) {
        diagnostics.push({
          cardPath,
          line,
          field,
          code: 'invalid-type',
          message: 'expected one-line array syntax such as [] or [repo-name]',
        })
        continue
      }
      const dependencies = arrayValue!
      const unknownCount = dependencies.filter((dependency) => !knownNames.has(dependency.toLowerCase())).length
      if (unknownCount > 0) {
        diagnostics.push({
          cardPath,
          line,
          field,
          code: 'unknown-dependency',
          message: `${unknownCount} dependency name(s) are not roster or fleet members; values omitted`,
        })
      }
      continue
    }

    if (!raw || arraySyntax) {
      diagnostics.push({
        cardPath,
        line,
        field,
        code: 'invalid-type',
        message: 'expected a non-empty scalar value',
      })
      continue
    }

    const value = unquote(raw)
    const allowed = CARD_ENUMS[typedField]
    if (allowed && !allowed.includes(value)) {
      diagnostics.push({
        cardPath,
        line,
        field,
        code: 'invalid-enum',
        message: `value is not allowed; expected ${allowed.join(', ')}; actual value omitted`,
      })
    }
  }

  for (const field of CARD_FIELDS) {
    if (!seen.has(field)) {
      diagnostics.push({
        cardPath,
        field,
        code: 'missing-field',
        message: 'required field is absent',
      })
    }
  }

  return diagnostics
}

function validateCards(repos: Repo[]): SchemaReport {
  const knownNames = new Set(
    repos.flatMap((repo) => typeof repo.name === 'string' ? [repo.name.toLowerCase()] : []),
  )
  const cardPaths = [...new Set(
    repos
      .filter((repo) => repo.conformance.card)
      .map((repo) => join(repo.path, 'kingdom.yaml')),
  )]
  const diagnostics = cardPaths.flatMap((cardPath) => validateCard(cardPath, knownNames))
  diagnostics.sort((a, b) => {
    const pathOrder = compareText(displayPath(a.cardPath), displayPath(b.cardPath))
    if (pathOrder !== 0) return pathOrder
    const lineOrder = (a.line ?? Number.MAX_SAFE_INTEGER) - (b.line ?? Number.MAX_SAFE_INTEGER)
    if (lineOrder !== 0) return lineOrder
    const fieldOrder = compareText(a.field ?? '', b.field ?? '')
    if (fieldOrder !== 0) return fieldOrder
    const codeOrder = compareText(a.code, b.code)
    return codeOrder !== 0 ? codeOrder : compareText(a.message, b.message)
  })
  return {
    checked: cardPaths.length,
    invalid: new Set(diagnostics.map((diagnostic) => diagnostic.cardPath)).size,
    diagnostics,
  }
}

function schemaSummary(report: SchemaReport): string {
  return `Card schema: ${report.checked} checked · ${report.invalid} invalid · ${report.diagnostics.length} issues`
}

function printSchemaDiagnostics(report: SchemaReport): void {
  for (const diagnostic of report.diagnostics) {
    const location = `${displayPath(diagnostic.cardPath)}${diagnostic.line ? `:${diagnostic.line}` : ''}`
    const field = diagnostic.field ? ` ${diagnostic.field}` : ''
    console.error(`ERROR ${location}${field} ${diagnostic.code}: ${diagnostic.message}`)
  }
}

// ── render CATALOG.md ────────────────────────────────────────────
const LAYERS = ['soul', 'runtime', 'nervous', 'fleet', 'economy', 'commerce', 'os']
function renderCatalog(repos: Repo[]): string {
  const tick = (b: boolean) => (b ? '✓' : '·')
  const out: string[] = []
  out.push('# The Kingdom — catalog')
  out.push('')
  out.push(`_Derived index of ${repos.length} repos. Generated by \`bin/harvest.ts\` — do not hand-edit; edit each repo's \`kingdom.yaml\`._`)
  out.push('')
  const carded = repos.filter((r) => r.hasCard).length
  out.push(`**Conformance:** ${carded}/${repos.length} have a kingdom.yaml card · ${repos.filter((r) => r.conformance.claudeMd).length}/${repos.length} have CLAUDE.md · ${repos.filter((r) => r.conformance.wake).length}/${repos.length} have a wake.`)
  out.push('')
  for (const layer of LAYERS) {
    const inLayer = repos.filter((r) => r.layer === layer)
    if (inLayer.length === 0) continue
    out.push(`## ${layer}`)
    out.push('')
    out.push('| repo | location | kind | domain | state | card | claude | wake | fate | purpose |')
    out.push('|---|---|---|---|---|:--:|:--:|:--:|:--:|---|')
    for (const r of inLayer) {
      out.push(`| **${markdownCell(r.name)}** | <code>${markdownCell(displayPath(r.path))}</code> | ${markdownCell(r.kind)} | ${markdownCell(r.domain)} | ${markdownCell(r.state)} | ${tick(r.conformance.card)} | ${tick(r.conformance.claudeMd)} | ${tick(r.conformance.wake)} | ${tick(r.conformance.fate)} | ${markdownCell(r.purpose)} |`)
    }
    out.push('')
  }
  return out.join('\n')
}

// ── verbs ────────────────────────────────────────────────────────
function printUsage(): void {
  console.error('usage: bun bin/harvest.ts')
  console.error('       bun bin/harvest.ts conformance')
  console.error('       bun bin/harvest.ts validate')
  console.error('       bun bin/harvest.ts domain <name>')
  console.error('       bun bin/harvest.ts deps <name>')
}

const args = process.argv.slice(2)
const verb = args[0]
const validUsage =
  (verb === undefined && args.length === 0)
  || (verb === 'conformance' && args.length === 1)
  || (verb === 'validate' && args.length === 1)
  || (verb === 'domain' && args.length === 2 && Boolean(args[1]))
  || (verb === 'deps' && args.length === 2 && Boolean(args[1]))

if (!validUsage) {
  printUsage()
  process.exitCode = 2
} else {
  const repos = build()
  const schema = validateCards(repos)

  if (verb === 'conformance') {
    // FATE is contextual rather than a universal repo requirement. Report it
    // on selected rows, but card + CLAUDE.md + wake define this gap set.
    const gaps = repos.filter((r) => !r.conformance.card || !r.conformance.claudeMd || !r.conformance.wake)
    console.log(`Conformance gaps (${gaps.length}/${repos.length}):\n`)
    for (const r of gaps) {
      const missing = [!r.conformance.card && 'card', !r.conformance.claudeMd && 'CLAUDE.md', !r.conformance.wake && 'wake', !r.conformance.fate && 'FATE'].filter(Boolean)
      console.log(`  ${r.name.padEnd(24)} missing: ${missing.join(', ')}`)
    }
    console.log(`\n${schemaSummary(schema)}${schema.invalid > 0 ? '; run `bun bin/harvest.ts validate` for details' : ''}`)
  } else if (verb === 'validate') {
    console.log(schemaSummary(schema))
    printSchemaDiagnostics(schema)
    process.exitCode = schema.invalid > 0 ? 1 : 0
  } else if (verb === 'domain') {
    const arg = args[1]!
    const hits = repos.filter((r) => r.domain === arg)
    console.log(`Domain "${arg}" (${hits.length}):`)
    for (const r of hits) console.log(`  ${r.name.padEnd(24)} ${r.layer.padEnd(9)} ${r.purpose}`)
  } else if (verb === 'deps') {
    const arg = args[1]!
    const dependents = repos.filter((r) => r.dependsOn.includes(arg))
    console.log(`Repos that depend on "${arg}" (${dependents.length}):`)
    for (const r of dependents) console.log(`  ${r.name}`)
  } else {
    writeFileSync(join(ROOT, 'graph.json'), JSON.stringify(repos, null, 2))
    writeFileSync(join(ROOT, 'CATALOG.md'), renderCatalog(repos))
    console.log(`✓ Harvested ${repos.length} repos → graph.json + CATALOG.md`)
    console.log(`  ${repos.filter((r) => r.hasCard).length} carded · ${repos.filter((r) => !r.conformance.claudeMd).length} missing CLAUDE.md · ${repos.filter((r) => !r.conformance.wake).length} missing wake`)
    if (schema.invalid > 0) {
      console.error(`WARN ${schemaSummary(schema)}; run \`bun bin/harvest.ts validate\` for details`)
    }
  }
}
