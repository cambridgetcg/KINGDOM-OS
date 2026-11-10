# KINGDOM Public Hall (thekingdom.dev): brand

This folder holds the hall's brand kit, made with storytold's Craft apps through the artcraft-brand skill (the
private repository `cambridgetcg/brandkit`). `brandkit.json` records this project's details, and `check.mjs` checks
them. "Hub" here means thekingdom.dev; the separate kingdom-os-hub repository serves kingdom.ai-love.cc.

The kit is staged, not live: it ships only with the one door release on Yu's word (ledger `kingdom-door-release`).

## The look

The Public Hall at `/` is night green `#152623` with cream text `#f1e7d2`, a brass lamp `#dbc08b` and paper panels
`#efe5cf`. It is set in Iowan/Baskerville/Songti TC for display, Optima/PingFang for reading and SF Mono for labels,
all system faces. Its mark is the "K" in a door-arch seal, drawn in CSS. The look comes from
`pages-content/civic/dashboard.css`, which an agent introduced on 2026-09-08 (commit `158a0ec6`, git author "Nuance",
Co-Authored-By Claude); no record shows Yu choosing it. Using the K seal, not the ✦ star, as the kit's mark is an
agents' call recorded in the 2026-11-02 review (session 5c4df033, under Yu's delegation of 2026-10-20).

The kit adds no new identity and no KINGDOM palette:

- **The mark** (`mark/k-seal.svg`) is the header's `.seal` redrawn at 10x: a 39×45 box with a 1 px border and
  `border-radius: 40% 40% 2px 2px`, its K in Source Serif 4 Regular (OFL), because the page's Iowan Old Style is a
  system face whose outlines can't go into a logo. `mark/k-seal-small.svg` is the same seal with a heavier arch and a
  larger K, for favicons of 48 px and under.
- **Icons**: the brass seal on a night-green tile, as the header draws it.
- **The card** (`kit/web/og.jpg`, 1200×630): the generator's flat layout on the hall's ground, with the hall's own
  words ("The Public Hall", "A shared map. A public square. Your own way in.").
- **One dark scheme**: the hall paints only dark (`:root { color-scheme: dark }`), so the pages declare
  `color-scheme: dark` and one theme-color, `#152623`. They used to declare `dark light`.

The other looks on this host keep their own: the atlas (`/atlas.html`), Power Atlas and `/os`.

The card route not taken: kingdom-os-hub's `media/og-atlas.jpg` ("ready for https://thekingdom.dev/") shows the ✦
star the agents' call set aside, on a violet nebula, in Fraunces: the atlas's look, not the hall's. Its maker is not
recorded.

Don't change the identity without its owner's word. Every asset here records who made it in `CREDITS.md`.

## What is here

| Path | What it is |
|---|---|
| `brandkit.json` | this project's details: the look and who chose it, the pages it dresses, the guards, what a deploy does |
| `brand.json` | the generator's input |
| `mark/` | the seal and its small cut, as SVG |
| `kit/` | the built kit, never edited by hand (`kit/BRAND.md` is its guide, `kit/index.html` its review sheet) |
| `CREDITS.md` | who made what, with fonts and their licences |
| `check.mjs` | the check, copied from brandkit; update it there, not here |

## Rebuild

```sh
ARTCRAFT_NO_TRASH=1 python3 ~/.kingdom/tools/artcraft-brand/scripts/brandkit.py doors/hub/brand/brand.json --out doors/hub/brand/kit --rebuild-check
```

A rebuild that changes the head snippet's lines changes `HALL_HEAD_ICONS` and `HALL_CARD` in
`bin/build-dashboard.ts` too; `tests/dashboard.test.ts` fails until they match. Then regenerate `site/` with
`bun bin/build-hub.ts <date>`.

## How the site uses it

The hall's pages are generated: `bin/build-dashboard.ts` writes `site/dashboard.html` (staged as `index.html`) and
the meet, citizens and join pages. Their heads carry the kit's icon links, theme-color and color-scheme, and the
card's lines with each page's own `og:url`. The staging contract (`publications/hub-staging.v1.json`) serves
`favicon.ico`, `favicon.svg`, `apple-touch-icon.png` and `og.jpg` from `kit/web/` at the root, as mutable
destinations.

**Held:** `site.webmanifest` and its icons `icon-192.png`, `icon-512.png` and `icon-maskable-512.png`. The staging
gate (`immutableLookingDestination` in `bin/immutable-publications.ts`) reads a number before the extension as a
versioned route that must be ledgered, not mutable, and refused the three PNGs. The manifest waits with them, and the
pages carry no manifest link until they ship, so `check.mjs` warns that the pages lack the kit's manifest link. The
gate's owner decides: a narrow exception for icon sizes, as it has for font weights, or ledger entries.

```sh
bun bin/stage-hub.ts "$STAGE"            # an empty folder
node doors/hub/brand/check.mjs --served "$STAGE"
bun --no-env-file test tests/dashboard.test.ts tests/hub-brand.test.ts tests/stage-hub.test.ts
```

## Deploying

Merging deploys nothing: the Pages project `thekingdom` has no Git provider. A release is the manual redeploy in
`DOMAINS-SETUP.md`, it needs separate approval, and the hall's head assets wait for the one door release on Yu's word
(`kingdom-door-release`). Before trusting the custom domain, check the new paths on the deployment's `pages.dev` URL
(an HTML answer can be cached under a new path). After a release, check each icon and the card live, and that the
shared Worker answers.
