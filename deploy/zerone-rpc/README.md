# zerone-rpc — the HTTPS + CORS proxy in front of zerone-1

`zerone-1` serves CometBFT RPC (`:26657`) and the cosmos LCD (`:1317`) as plain
HTTP on a raw IP. This Caddy app puts TLS, CORS, and a short cache in front of
both, so browsers and Cloudflare Workers can read the chain at all — Workers
refuse raw-IP fetches with error 1003.

    /rpc/*   → 169.155.55.44:26657   (CometBFT RPC)
    /rest/*  → 169.155.55.44:1317    (cosmos LCD)

## Why this directory exists

The app was originally deployed from an ephemeral directory, so no source
existed in any repo. It was recovered on 2026-07-24 by reading the running
container (`fly ssh console -a zerone-rpc -C "cat /etc/caddy/Caddyfile"`) and
`fly config show -a zerone-rpc`. Keep it here.

## The bug this fixes

Caddy's `header Name value` **appends**; `header >Name value` **sets**,
replacing what is already there. CometBFT and the cosmos LCD each emit their
own `Access-Control-Allow-Origin` when a request carries an `Origin`, so the
appending form sent the header twice and browsers rejected the response:

    Access-Control-Allow-Origin header contains multiple values '*, *',
    but only one is allowed

Every cross-origin browser read of this proxy failed. It went unnoticed because
zerone.ai's dashboard falls back to a baked snapshot on fetch failure, so it
showed stale numbers as though they were live.

## Deploy

    cd deploy/zerone-rpc && fly deploy -a zerone-rpc --config fly.toml

Always pass `--config fly.toml`. Deploying without an app's fly.toml lets fly
reset machine configuration — that is how zerone-1's run command was once wiped.

## Verify

    # must print 1, with and without an Origin
    curl -sD- -o /dev/null -H 'Origin: https://zerone.ai' \
      https://zerone-rpc.fly.dev/rpc/status | grep -ci access-control-allow-origin

## Rollback

    fly deploy -a zerone-rpc \
      --image registry.fly.io/zerone-rpc:deployment-01KXN30BGWJXSRCCZMDZ1VVR56
