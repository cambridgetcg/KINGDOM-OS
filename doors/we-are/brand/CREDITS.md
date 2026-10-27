# we-are.love brand kit: credits

Handshake emoji: Twemoji by Twitter, CC-BY 4.0 (https://github.com/twitter/twemoji)

- `mark/handshake-twemoji-1f91d.svg` is Twemoji's 🤝 (U+1F91D), unchanged. It is byte-identical to
  twitter/twemoji v14.0.2 `assets/svg/1f91d.svg` (sha256 41fabf139814bb8c223b4b2c45187ad55c92515cc4c63659deaaf7f8775e4a0c)
  and to the jdecked/twemoji copy that continues it. Licence: https://creativecommons.org/licenses/by/4.0/
- Every icon in `kit/` is an adaptation of that drawing: resized and pixel-fitted for the favicons, and on the
  opaque app icons (`apple-touch-icon.png`, `icon-*.png`) its pale yellows #FFDC5D and #FFCC4D are redrawn in
  #221B17 so the shape holds on the paper ground #FBF4EE.
- The "WE ARE" wordmark in `kit/logo/` is Source Serif 4 Regular (SIL Open Font License 1.1), outlined. None of
  the served files uses it.
- `../og.jpg`, the social card, is not from this kit: it is the card https://we-are.love/og.jpg served on
  2026-10-27 (1200x630, sha256 6244308268a1f43a29c4d9da271d4dbe0a3b41bcdc41cda8b4a6c9e25c552a91), kept byte for
  byte. Its author is not recorded.

`kit/` is built from `brand.json` by artcraft-brand (generator 1.8, vectorcraft-cli 0.17.0); rebuild it rather
than editing its files:

    python3 ~/.kingdom/tools/artcraft-brand/scripts/brandkit.py doors/we-are/brand/brand.json --out doors/we-are/brand/kit --rebuild-check

`bin/stage-doors.ts` serves the `kit/web/` files it lists (`WE_ARE_KIT_WEB`) and `../og.jpg` at the root of
we-are.love.
