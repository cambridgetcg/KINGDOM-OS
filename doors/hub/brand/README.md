# KINGDOM Public Hall (thekingdom.dev): brand

This folder is the place for the hall's brand kit, made with storytold's Craft apps through the artcraft-brand
skill (the private repository `cambridgetcg/brandkit`). There is no kit yet (`kind: planned`). `brandkit.json`
records this project's details, and `check.mjs` checks them. "Hub" here means thekingdom.dev; the separate
kingdom-os-hub repository serves kingdom.ai-love.cc.

## The look

The Public Hall at `/` is night green `#152623` with cream text `#f1e7d2`, a brass lamp `#dbc08b` and paper panels
`#efe5cf`. It is set in Iowan/Baskerville/Songti TC for display, Optima/PingFang for reading and SF Mono for labels,
all system faces. Its mark is the "K" in a door-arch seal, drawn in CSS. The look comes from
`pages-content/civic/dashboard.css`, which an agent introduced on 2026-09-08 (commit `158a0ec6`, git author "Nuance",
Co-Authored-By Claude); no record shows Yu choosing it. Using the K seal, not the ✦ star, as the kit's mark is an
agents' call recorded in the 2026-11-02 review (session 5c4df033, under Yu's delegation of 2026-10-20).

A kit would be drawn from this look, with no new identity and no KINGDOM palette. It waits on Yu's go for group A
(ledger `kingdom-visual-grammar`, A2), and it ships only with the door release (ledger `kingdom-door-release`).

The other looks on this host keep their own: the atlas (`/atlas.html`), Power Atlas and `/os`.

Don't change the identity without its owner's word. Every asset here records who made it in `CREDITS.md`.

## What is here

| Path | What it is |
|---|---|
| `brandkit.json` | this project's details: the look and who chose it, the page it dresses, the guards, what a deploy does |
| `CREDITS.md` | who made what, with fonts and their licences |
| `check.mjs` | the check, copied from brandkit; update it there, not here |

`brand.json` (the generator's input) and `kit/` (the built kit, never edited by hand) arrive with the kit.

## Rebuild

No kit yet. Once group A has its go, the kit is generated from this look:

```sh
python3 ~/.kingdom/tools/artcraft-brand/scripts/brandkit.py doors/hub/brand/brand.json --out doors/hub/brand/kit --rebuild-check
```

Nothing is copied: the hub is staged from `publications/hub-staging.v1.json`, so each served kit file gets an entry
mapping `doors/hub/brand/kit/web/<file>` to `<file>`, as `bin/stage-doors.ts` does for WE ARE. Then run:

```sh
bun bin/stage-hub.ts "$STAGE"            # an empty folder
node doors/hub/brand/check.mjs --served "$STAGE"
bun --no-env-file test tests/stage-hub.test.ts tests/dashboard.test.ts
```

`serve.via` in `brandkit.json` names the stager, so without `--served` the check only says where to run it.

## How the site uses it

The hall's page is generated: `bin/build-dashboard.ts` writes `site/dashboard.html`, which stages as `index.html`.
Its head tags (icons, theme-color, color-scheme, the card) are changed in the builder, never in the generated page.
`site.html` lists the generated page, so the check compares its theme-color and color-scheme with the kit's head
snippet once there is a kit. It also lists the atlas (`site/hub.html`) with its own theme-color pair, so the kit
can't re-dress it. Today the hall has no icon, no card and no theme-color, and it declares
`color-scheme: dark light` though it has no light scheme.

## Deploying

Merging deploys nothing: the Pages project `thekingdom` has no Git provider. A release is the manual redeploy in
`DOMAINS-SETUP.md` (stage with `bun bin/stage-hub.ts` into an empty folder, then `wrangler pages deploy … --project-name=thekingdom --branch=main`),
it needs separate approval, and the hall's head assets wait for the one door release on Yu's word
(`kingdom-door-release`). After a release, check each icon and the card live, and that the shared Worker answers.
HTML is served `no-cache`; how long icon files stay cached is not recorded.
