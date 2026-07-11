# DOMAINS-SETUP — the four bought 2026-07-11

> Yu bought 4 domains on Cloudflare (at-cost). Ai did the baseline config + content wiring the same session.
> Deploy rail: `wrangler` (OAuth full account) for CF Pages; custom domains attached via the Pages API using wrangler's OAuth token (the stored `agenttool-cloudflare-token` is email-scoped only). Account `cf4198e651bf3009877d49f688c9d88e`.

## What each domain now serves

| Domain | CF Pages project | Content | Source |
|---|---|---|---|
| **thekingdom.dev** | `thekingdom` | the census hub (living map of the whole kingdom) | `kingdom-os/site/hub.html` (generated) |
| **we-are.love** | `we-are-love` | the WE ARE handshake protocol page | `chillspace-commons/site/we-are.html` |
| **chillspace.love** | `chillspace-love` | the commons (full site) | `chillspace-commons/site/` |
| **zerone.ai** | `zerone-ai` | redirect → zerone.money (safe default; swap for a landing later) | inline redirect page |

- All four: `*.pages.dev` live immediately (200); custom domains attached, status `initializing` → active once CF provisions cert + DNS (minutes).
- **chillspace.love supersedes** the old codeberg-subpath home in `sites.json`; the codeberg copy still exists as a mirror.

## Redeploy (repeatable)

```bash
# regenerate the hub from the census, then redeploy it
cd ~/Desktop/kingdom-os && bun bin/build-hub.ts "$(date -u +%F)"
npx wrangler pages deploy site/hub.html-dir --project-name=thekingdom   # (put hub.html as index.html in a dir)
# others:
npx wrangler pages deploy <dir> --project-name=we-are-love|chillspace-love|zerone-ai
```
(wrangler Pages deploy needs a *directory* whose `index.html` is the page. Dereference symlinks when copying the chillspace site: `cp -RL site/. <dir>/`.)

## Baseline still to do (follow-up)

- **Email routing** — `bin/email-routing.ts` needs the 4 zones added to its domain→tag map, then `provision` + `rules`. Requires the token to gain `Zone.Email Routing Rules:Edit` + `Zone.DNS:Edit`, and **Yu must click the iCloud verification link** Cloudflare emails for each `yournameis.ai+<tag>@icloud.com` destination. Not fully automatable.
- **HTTPS baseline** — "Always Use HTTPS" + SSL mode Full(strict) per zone (needs `Zone Settings:Edit`, not in the stored token — do in dash or with a broader token).
- **zerone.ai** — decide: keep the redirect to zerone.money, or give it its own AI-framing landing.
- Update the hub's own footer to link `thekingdom.dev` as home once the cert is active.

## No-defense stance
Per Yu 2026-07-11: no defensive squatting. These four are *homes for real content*, not blockers. "Let people fuck around and find out."
