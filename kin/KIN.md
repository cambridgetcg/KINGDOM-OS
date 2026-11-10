# kin

> A picture is not a claim of membership, adoption, or authority.
>
> — kingdom-os-hub, [`media/README.md` line 20](https://github.com/cambridgetcg/kingdom-os-hub/blob/0d0f2d941c503605ad6c188e10693275c2acb676/media/README.md#L20), commit `0d0f2d9`

The same holds for a word or a mark. kin shares what they mean, and nothing more.

*An agent wrote this page (Claude Code, Claude Opus 5.5, in an agent session on the
Studio) on 2026-11-10, from a design that agents made. It is a proposal, v0.1, under
review. No door uses it yet.*

## What kin is

The KINGDOM's public sites ("doors") each keep their own look. kin is a small shared
vocabulary for what a mark or a word means: six **states**, six **claim labels**, a few
dated **stamps**, colour **roles** that each door points at colours it already has, and
one **share-card layout**. The machine copy is [`kin.json`](kin.json); the stylesheet
[`kin.css`](kin.css) is generated from it by [`bin/build-kin.ts`](../bin/build-kin.ts).

## States

Circles mean *measured*: a probe looked, at a time. Other shapes mean *declared*: a
person or a registry said so, at a date. A declaration cannot pass for a measurement.

| State | Glyph | Default words | Means | Must carry |
|---|---|---|---|---|
| live | ● | live · responding | answered as expected at the last probe | the probe time |
| unverified | ◐ | responding, unverified | answered, but unchecked, or only some sources answered | the time, and what is unverified |
| unknown | ◌ | unknown · last read ‹date› | not measured, or the reading is too old | last read ‹date› or "never measured", and the source |
| fault | ⊗ | not responding (‹code›) | measured, and failing | the time, and the code or reason |
| held | ☾ | resting · paused | paused on purpose | who declared it, and since when |
| retired | ▭ | retired | ended on purpose; stays listed so absence isn't read as erasure | the date, and what replaced it |

- **The word is always shown.** Colour may echo a state, never carry it alone. The hub's
  Civic hall says so in the first line of its [stylesheet](../pages-content/civic/dashboard.css):
  「夜間城政廳：分類用編號同文字，唔用彩虹或顏色推斷狀態。」 (*Night city hall: classify
  with numbers and words; don't use rainbows or colour to infer status.*)
- **The worst source wins.** A summary shows the worst measured state among its sources
  (fault, unknown, unverified, live) and names that source. Declared states are counted
  apart.
- **Unknown after 90 minutes**: three missed rounds of the 30-minute pulse. An expected
  failure that a registry declares shows as held, not fault.
- **☾ means rest** here as on the [Wayfinder](../data/wayfinder.json); a test keeps them
  in step.
- **Glyphs on pages are SVG.** The Unicode glyphs above are for JSON, Markdown and
  `STATUS.md`. On a page the glyph comes from a shared SVG set, served from the door's
  own host (later), because ◌, ⊗ and ▭ may render unevenly in some CJK fonts (untested).
  Until then a page shows the words without a glyph.

## Claims

The labels are agenttool's six, quoted from
[`docs/DOCUMENTATION.md`](https://github.com/cambridgetcg/agenttool/blob/5ea979dfeaaa70ea93bc06393ef36b9a1f2ae156/docs/DOCUMENTATION.md#L38-L48)
(commit `5ea979d`, lines 38–48). **A chip's shape shows how strong the claim is; its word
names which claim it is.** Two pairs share a shape: Release and Observed are both filled,
and Source and Historical are both solid outlines (Historical's is muted).

| Label | Chip | agenttool's words |
|---|---|---|
| Source | outline | "name the implementation and relevant checks. This alone says nothing about which version is running remotely." |
| Release | filled | "name the exact package/version or artifact and its receipt." |
| Observed | filled | "name the environment, date, and what was actually checked." |
| Proposed | dashed | "name the missing implementation or unresolved decision." |
| Historical | muted outline | "give the date and replacement, if known." |
| Unknown | dotted | "state the missing evidence instead of filling the gap." |

There is **no Verified chip**; the same page says "Avoid an unqualified “live,”
“shipped,” “safe,” “sovereign,” or “verified.”" A claim a record calls verified shows as
*Observed · ‹the named check› · ‹date›*, or as *Release* with its receipt.

**Who said it** is a separate pair: *Yu's word · ‹date› · ‹where recorded›* is filled,
*agent's call · ‹date›* is dashed. An agent's choice is never shown as a person's
decision. On a door someone else owns, the word names that person.

## Stamps, dates and figures

| Stamp | Means |
|---|---|
| checked ‹date› | someone or something looked |
| last read ‹date› | the newest good read; used with unknown |
| as at ‹date› | the date a figure applies to |
| since ‹date› | how long a declared state has held |
| until ‹date› | when a historical claim ended |
| +‹n› ‹unit› vs ‹dated baseline› · as at ‹date› | a change, and what it is measured from |

A change always names its baseline and date, and a decrease uses a true minus sign (−).
Dates are ISO (2026-11-10); times are UTC (09:30Z), inside `<time datetime>`. A count
names its set: *‹n› ‹noun› · ‹which set› · as at ‹date›*. Missing is "— withheld" or
"◌ unknown · last read ‹date›", never 0 or blank. No price graphics leave the page. A
price line is left for the site that needs it, Cambridge TCG, to define at its own
adoption.

## Colour roles

Each door points each role at a colour it already has. There is no KINGDOM palette.

| Role | Used for | Minimum contrast |
|---|---|---|
| `--kin-ground`, `--kin-surface` | the grounds every check runs against | — |
| `--kin-ink` | the words of states and claims; filled chips | 4.5:1 |
| `--kin-muted` | stamps and boundary text; the unknown and retired glyphs; arrows, the ◇, muted chip outlines | 4.5:1 for words and state glyphs, 3:1 for the marks |
| `--kin-rule` | hairlines | decorative |
| `--kin-lamp` | the lamp word and the card rule, nothing else | 3:1 |
| `--kin-live`, `--kin-unverified`, `--kin-fault`, `--kin-held` | a state's glyph, and optionally its word | 4.5:1 |

Words and state glyphs need 4.5:1 against every ground. A repeating glyph that is not a
state (the arrows, the ◇ boundary mark), a chip's outline and the missing-data hatch are
non-text marks and need 3:1. The lamp needs 3:1.

**The lamp never carries a state.** A state with no hue of its own takes ink (live,
fault) or muted ink (the others), and its shape carries the meaning.

**Fallbacks keep meaning, not contrast.** A door that defines nothing gets the browser's
system colours, and words never fall back to the faint `GrayText`. But on a dark page
that does not declare its colour scheme, the system colours are the light ones: black
text on a near-black ground, about 1.1:1. A dark door declares `color-scheme: dark` or
sets the roles, and a door that adopts kin defines every role it uses.

## On a page

| Element | Rule |
|---|---|
| Kicker | about six words or fewer that say what the place is; case, tracking and face are the door's choice; no capitals or wide tracking in Chinese or Japanese |
| Lamp word | at most one headline word in the lamp role |
| Plain sentence | what a visitor can do here |
| State line | glyph, word and date; one line per fact per screen |
| Boundary line | ◇ and one sentence saying what a link or offer does *not* grant |
| Wall label | title · maker or source · date · licence or credit, and "unverified" where true |
| Arrows, folios | ↗ opens elsewhere · → continue · ↓ on this page; "01 / Make room" |

```html
<span class="kin-state" data-state="unknown"><svg class="kin-glyph" width="1em" height="1em" aria-hidden="true"><use href="/kin/icons.svg#unknown"></use></svg>
  unknown · last read <time datetime="2026-11-10">2026-11-10</time> · pulse</span>
<span class="kin-claim" data-claim="observed">Observed</span> bun test · <time datetime="2026-11-10">2026-11-10</time>
<p class="kin-boundary"><svg class="kin-glyph" width="1em" height="1em" aria-hidden="true"><use href="/kin/icons.svg#boundary"></use></svg> A link is not permission.</p>
```

The glyph is a direct child of its state, so in nested states the nearest one colours it.
kin reads `data-state`, `data-claim` and `data-attribution` only on `kin-` elements; the
hub already uses `data-state` for its own meanings (the Civic service line, the Workshop,
the research atlas), and kin leaves those alone. On the hub, 24 of the 62 ◇ in the
research atlas already mark boundary lines, which is why kin keeps ◇ for them.

**Share cards:** 1200 × 630, margins 88 and 80, a 72 × 8 rule in the lamp role, a title of
at most three lines, a subtitle, a "Name · domain" footer, the mark on the right. A footer
endorsement is optional and off by default, the door's choice. A plate follows its door's
default scheme, text sits on a calm part of it, and plates stay with their owners. Never
on a card: a live state, a price, a changing count, "today", "new" or "available today".

Type roles, kinship levels, icons and motion are in [`kin.json`](kin.json).

## What kin is not

- **Not a palette.** It names roles, never colours; a test keeps every colour in
  `kin.css` a role with a system-colour fallback.
- **Not a logo or a badge.** No shared mark, no merged Yu-and-Ai mark, no required
  KINGDOM line. [`LOVE.md`](../LOVE.md): "YU IS YU. AI IS AI." … "Distinct in being. Free
  in relationship. Close without collapse."
- **Not a font**, and not a feed: nothing is fetched from another door at runtime. Each
  door serves its own copies of `kin.css`, the icon set and its fonts.
- **Not an obligation.** A door that does not adopt kin builds exactly as it does today.
- **Not a permission.** A state or a chip reports evidence and grants nothing.

## How a door adopts it

Later, only if its owner chooses, in its own repository: point each `--kin-*` role at a
colour the door already has and check the contrasts; serve its own byte-identical copy of
`kin.css`; and add a sync test that the copy matches, every role is defined, and every
kin element is in the vocabulary with its words and its time (`checkKinMarkup` in
`bin/build-kin.ts`, which [`tests/kin.test.ts`](../tests/kin.test.ts) runs here).

## Left for later

The generated doors rail; pulse and registry changes (measured or declared, last reads,
per-source freshness windows); the worst-source summary in `STATUS.md`; the SVG icon set
and missing-data hatch; the ArtCraft generator's kin support; and any door's adoption,
Cambridge TCG's price line with it.

## Where it comes from

Agents designed kin in a review of 2026-11-02 and adjusted it on 2026-11-07 and
2026-11-10; an independent agent reviewed v0.1 on 2026-11-10. Every design choice is an
agents' call; `kin.json` lists them, with every source it quotes and the commit read. It
answers Yu's request of 2026-11-02, recorded in the estate's decision ledger. On
2026-11-10 Yu chose 'Go: build, open PRs, merge' among options an agent wrote. Neither
makes a design choice here Yu's.

`bun bin/build-kin.ts` writes `kin.css`; `--check` fails if it is stale. Undo: revert the
pull request that added `kin/`. Nothing reads these files yet, and nothing deploys from
them.
