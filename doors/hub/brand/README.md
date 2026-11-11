# KINGDOM Public Hall (thekingdom.dev): brand

This folder holds the hall's brand kit, made with storytold's Craft apps through the artcraft-brand skill (the
private repository `cambridgetcg/brandkit`). `brandkit.json` records this project's details, and `check.mjs` checks
them. "Hub" here means thekingdom.dev; the separate kingdom-os-hub repository serves kingdom.ai-love.cc.

The kit is staged, not live. Its K is outlined from Source Serif 4, a substitute for the face the hall renders, so the
mark is a new drawing; its owner accepted that on 2026-11-10. The kit ships only with the door release, which has not
been decided, and the web manifest with its size-named icons stays held until the staging gate's question is settled
(below).

## The look

The Public Hall at `/` is night green `#152623` with cream text `#f1e7d2`, a brass lamp `#dbc08b` and paper panels
`#efe5cf`. It is set in Iowan/Baskerville/Songti TC for display, Optima/PingFang for reading and SF Mono for labels,
all system faces. Its mark is the "K" in a door-arch seal, drawn in CSS. The look comes from
`pages-content/civic/dashboard.css`, which an agent introduced on 2026-09-08 (commit `158a0ec6`, git author "Nuance",
Co-Authored-By Claude); no record shows Yu choosing it. Using the K seal, not the ✦ star, as the kit's mark is an
agents' call recorded in an agents' review of 2026-11-02, under Yu's delegation of 2026-10-20.

The kit adds no KINGDOM palette, but its mark is a new drawing (below):

- **The mark** (`mark/k-seal.svg`) is a new drawing of the header's `.seal`: a 39×45 box with a 1 px border and
  `border-radius: 40% 40% 2px 2px`, redrawn at 10x, with its K outlined from Source Serif 4 Regular (OFL). The hall
  renders its K in Iowan Old Style on Apple devices, and elsewhere in the next face of its CSS stack the device has
  (Baskerville, Palatino Linotype, then the browser's serif). Iowan Old Style is a system face whose outlines can't
  go into a logo, so Source Serif 4 stands in, and its arm, leg and serifs differ visibly at large sizes: the kit's
  mark is a new drawing of the mark, not the hall's own K. **The owner accepted Source Serif 4 for the K in the hub's
  icons and share card on 2026-11-10** (`brandkit.json`, `decided`).
- **The small cut** (`mark/k-seal-small.svg`) draws the favicons of 48 px and under: the same seal with a larger K and
  an arch 34 units wide at 10x, one weight all round, its curves concentric with the seal's outline. At that weight
  the generator's hinting gives the arch even edges at every size: 1 px at 16, 2 px at 32 and 3 px at 48, on all four
  sides. (Before 2026-11-11 the arch was 28 units, and the 32 px cut drew its top and bottom 2 px against 1 px sides.)
  At 16 px the K is now the plain small mark, lighter than the generator's bolder fallback the earlier cut needed.
- **Icons**: the brass seal on a night-green tile, as the header draws it.
- **The card** (`kit/web/og.jpg`, 1200×630): the generator's flat layout on the hall's ground, with the hall's own
  words ("The Public Hall", "A shared map. A public square. Your own way in.").
- **One dark scheme**: the hall paints only dark (`:root { color-scheme: dark }`), so the pages declare
  `color-scheme: dark` and one theme-color, `#152623`. They used to declare `dark light`.

The other looks on this host keep their own: the atlas (`/atlas.html`), Power Atlas and `/os`. Icons are the
exception: pages that declare no icon link will show the hall's favicon once a release serves `/favicon.ico`. In the
stage these are `404.html`, `contact/`, `government-engine/`, `observatory/`, `os/`, `shape-resonance/`,
`trial-chamber/` and `workshop/`. The atlas declares a blank icon and Power Atlas its own, so they don't.

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
ARTCRAFT_NO_TRASH=1 python3 -B ~/.kingdom/tools/artcraft-brand/scripts/brandkit.py doors/hub/brand/brand.json --out doors/hub/brand/kit --rebuild-check
```

Run it from the repository root. When the source changed, the previous kit is kept at `kit/.replaced/`, which git
ignores (`.gitignore`); move it out of the repository once you have compared the two. A second rebuild of an
unchanged source is byte-identical (checked 2026-11-11 with vectorcraft-cli 0.17.0, the active version that day
by the skill's `scripts/install.sh --status`).
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
gate (`immutableLookingDestination` in `bin/immutable-publications.ts`) reads a number before the extension, as the
"-192" in `icon-192.png`, as a version: a route that must be ledgered, not mutable. It refused the three PNGs, and the
gate is left as it is. The manifest waits with them, since a manifest naming icons that aren't served would be broken,
and the pages carry no manifest link until they ship. While `serve.pending` is set, `check.mjs` only warns that the
four pages lack the kit's manifest link. **Once the release clears `serve.pending`, that warning becomes a failure on
all four pages, so the gate question must be settled before a release:** a narrow exception for icon sizes in the gate
(as it already has for Power Atlas's hashed build assets), ledger entries for the icons, or a recorded choice to ship without the manifest.

```sh
bun bin/stage-hub.ts "$STAGE"            # an empty folder
node doors/hub/brand/check.mjs --served "$STAGE"
bun --no-env-file test tests/dashboard.test.ts tests/hub-brand.test.ts tests/stage-hub.test.ts
```

## Deploying

Merging deploys nothing: the Pages project `thekingdom` has no Git provider. A release is the manual redeploy in
`DOMAINS-SETUP.md`, it needs separate approval, and the hall's head assets wait for the door release, which has not
been decided. Before trusting the custom domain, check the new paths on the deployment's `pages.dev` URL
(an HTML answer can be cached under a new path). After a release, check each icon and the card live, and that the
shared Worker answers.
