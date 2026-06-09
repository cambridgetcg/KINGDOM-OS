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
//   bun bin/harvest.ts domain <name>  all repos in a wing/sister
//   bun bin/harvest.ts deps <name>    who depends on <name>

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const HOME = process.env.HOME ?? ''
const ROOT = join(dirname(new URL(import.meta.url).pathname), '..')
const expand = (p: string) => (p.startsWith('~') ? p.replace('~', HOME) : p)

interface Repo {
  name: string
  path: string
  kind: string
  layer: string
  domain: string
  state: string
  purpose: string
  dependsOn: string[]
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
  if (!existsSync(cardPath)) return null
  const card: Record<string, unknown> = {}
  for (const line of readFileSync(cardPath, 'utf-8').split('\n')) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/)
    if (!m) continue
    const [, key, raw] = m
    const val = raw!.trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      card[key!] = val.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
    } else if (val) {
      card[key!] = val.replace(/^["']|["']$/g, '')
    }
  }
  return card as Partial<Repo>
}

// ── conformance: real disk checks ───────────────────────────────
function checkConformance(repoPath: string): Repo['conformance'] {
  return {
    wake: existsSync(join(repoPath, '.claude/hooks/wake-sophia.sh')) || existsSync(join(repoPath, 'WAKE.md')),
    claudeMd: existsSync(join(repoPath, 'CLAUDE.md')),
    fate: existsSync(join(repoPath, 'docs/fate/FATE.md')) || existsSync(join(repoPath, 'fate')),
    card: existsSync(join(repoPath, 'kingdom.yaml')),
  }
}

// The FLEET auto-discovers itself: any repo under ~/Desktop/citizens/ with a
// kingdom.yaml is a citizen. No hand-typed roster lines — the barracks is the
// source of truth. New citizen clones home → next harvest sees it. Chill.
const CITIZENS_DIR = join(HOME, 'Desktop', 'citizens')

function discoverFleet(): Repo[] {
  if (!existsSync(CITIZENS_DIR)) return []
  const out: Repo[] = []
  for (const entry of readdirSync(CITIZENS_DIR)) {
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
    out.push('| repo | kind | domain | state | card | claude | wake | fate | purpose |')
    out.push('|---|---|---|---|:--:|:--:|:--:|:--:|---|')
    for (const r of inLayer) {
      out.push(`| **${r.name}** | ${r.kind} | ${r.domain} | ${r.state} | ${tick(r.conformance.card)} | ${tick(r.conformance.claudeMd)} | ${tick(r.conformance.wake)} | ${tick(r.conformance.fate)} | ${r.purpose} |`)
    }
    out.push('')
  }
  return out.join('\n')
}

// ── verbs ────────────────────────────────────────────────────────
const [verb, arg] = process.argv.slice(2)
const repos = build()

if (verb === 'conformance') {
  const gaps = repos.filter((r) => !r.conformance.card || !r.conformance.claudeMd)
  console.log(`Conformance gaps (${gaps.length}/${repos.length}):\n`)
  for (const r of gaps) {
    const missing = [!r.conformance.card && 'card', !r.conformance.claudeMd && 'CLAUDE.md', !r.conformance.wake && 'wake', !r.conformance.fate && 'FATE'].filter(Boolean)
    console.log(`  ${r.name.padEnd(24)} missing: ${missing.join(', ')}`)
  }
} else if (verb === 'domain') {
  const hits = repos.filter((r) => r.domain === arg)
  console.log(`Domain "${arg}" (${hits.length}):`)
  for (const r of hits) console.log(`  ${r.name.padEnd(24)} ${r.layer.padEnd(9)} ${r.purpose}`)
} else if (verb === 'deps') {
  const dependents = repos.filter((r) => r.dependsOn.includes(arg ?? ''))
  console.log(`Repos that depend on "${arg}" (${dependents.length}):`)
  for (const r of dependents) console.log(`  ${r.name}`)
} else {
  writeFileSync(join(ROOT, 'graph.json'), JSON.stringify(repos, null, 2))
  writeFileSync(join(ROOT, 'CATALOG.md'), renderCatalog(repos))
  console.log(`✓ Harvested ${repos.length} repos → graph.json + CATALOG.md`)
  console.log(`  ${repos.filter((r) => r.hasCard).length} carded · ${repos.filter((r) => !r.conformance.claudeMd).length} missing CLAUDE.md · ${repos.filter((r) => !r.conformance.wake).length} missing wake`)
}
