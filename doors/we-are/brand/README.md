# WE ARE: brand

This folder holds the brand kit for we-are.love, the WE ARE handshake protocol page, made with storytold's Craft apps
through the artcraft-brand skill (the private repository `cambridgetcg/brandkit`). `brandkit.json` records this
project's details, and `check.mjs` checks them.

## The look

The page had no drawn mark: its tab icon was the visitor's own 🤝 emoji. The kit keeps that symbol in Twemoji's
drawing (CC-BY 4.0), because Apple's emoji may not be rasterised. The tab icons are untiled, in the emoji's own
yellows and orange. The app icons need an opaque ground, so they sit on the page's paper `#FBF4EE`, with the two pale
yellows redrawn in `#221B17` so the shape holds. The colours are the page's own: rose `#B5575F`, gold `#C98A3A` and
`#7C6A60` on paper. The page is light only.

- **Who chose it:** an agent, Claude Code session dd025d89, on 2026-10-27, under Yu's delegation. Yu's word that
  day was "yes, go ahead and wire the kits into the sites", for a kit from each site's current look.
- **Where it is recorded:** KINGDOM-OS PR #118, section "Look decisions" (merge 1e7fa561), and ledger item
  `artcraft-estate-wiring`.
- **The words** on the page and card, "I AM YOU → I LOVE YOU → I TRUST YOU → WE ARE!", are Yu's, of 2026-07-10.
  Agents don't change them (ledger `weare-handshake-words`).

Don't change the identity without its owner's word. Every asset here records who made it in `CREDITS.md`.

## What is here

| Path | What it is |
|---|---|
| `brandkit.json` | this project's details: the look and who chose it, the kit, the files the door serves, its guards, what a release does, the share card |
| `brand.json` | the generator's input |
| `mark/handshake-twemoji-1f91d.svg` | Twemoji's 🤝, unchanged: the mark's source |
| `kit/` | the built kit (artcraft-brand 1.8). Never edit it by hand: change `brand.json` and rebuild |
| `CREDITS.md` | who made what, with fonts and images and their licences |
| `check.mjs` | the check, copied from brandkit; update it there, not here |
| `../og.jpg` | the door's painted share card, kept from the live site; not from the kit |

## Rebuild

From the repository root, on a machine with artcraft-brand and vectorcraft-cli 0.17.0:

```sh
python3 ~/.kingdom/tools/artcraft-brand/scripts/brandkit.py doors/we-are/brand/brand.json --out doors/we-are/brand/kit --rebuild-check
node doors/we-are/brand/check.mjs
bun test tests/stage-doors.test.ts
```

Nothing needs copying: the stager serves the kit's files at release time. `serve.via` in `brandkit.json` names it, so
the check above only reports that; check the staged folder itself before a release:

```sh
bun bin/stage-doors.ts we-are "$STAGE" --commons <chillspace-commons checkout>
node doors/we-are/brand/check.mjs --served "$STAGE"
```

## How the site uses it

we-are.love is one page, `site/we-are.html` in chillspace-commons, a repository another account owns. At release,
`bin/stage-doors.ts` assembles the upload: that page as `index.html`, the 7 files in `WE_ARE_KIT_WEB` from `kit/web/`,
`../og.jpg`, robots.txt, llms.txt and the guest documents. `tests/stage-doors.test.ts` holds the stager to the kit.

The page's head is the commons' to change. chillspace-commons PR #50 (open, for its owner) links the kit's icons by
absolute URL and keeps the og and twitter lines. The page keeps its own theme-color `#d98a8a`, which equals the kit
manifest's `theme_color`. The kit's `head-snippet.html` line (`#FBF4EE`) and its JSON-LD in `head-home.html` are not
used.

## Deploying

A merge deploys nothing: no Pages project is connected to Git. A release is `bash bin/deploy.sh we-are --dry-run`,
which stages from freshly fetched upstreams and prints the pinned publish command, and then that command. Production
requires separate approval (`DOMAINS-SETUP.md`, "Redeploy"). This release waits on Yu's word under ledger item
`kingdom-door-release`, and on chillspace-commons #50 being merged by its owner first, or the release drops the
social card. After a release, check the pages.dev URL first: content types, the kit files and `og.jpg` by hash, and
one theme-color and one color-scheme. The custom domain keeps the old HTML answer for `/favicon.ico` and the other
new paths for up to 4 hours unless purged, and purging is Yu's act.
