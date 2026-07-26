# preserved/

Things rescued off infrastructure before it was decommissioned. Nothing here is live.

## `hive-jetstream-20260726.tar.gz` (583 KB)

The HIVE off the Hetzner box `Yu-and-Ai` (167.233.120.173), taken 2026-07-26 before the
server was destroyed. Contains:

- `var/lib/nats/jetstream/$G/streams/HIVE/` — the **HIVE stream: 1,144 messages, 605 KB**,
  plus three consumers (`gamma-presence`, `gamma-bridge`, `gamma-inbox`)
- `etc/nats-server.conf` — the bus config it ran under
- `root/hive.py`, `root/hermes.py`, `root/hive-bridge.py`, `root/.nats.conf`, `root/shared/`

**TLS material is NOT in this tarball.** The CA and server keypair are in the macOS keychain:
`security find-generic-password -s hive-tls-bundle -a yu-and-ai -w | tr -d '\n' | base64 -d | tar xzf -`

### Why it was taken

At decommission the bus had run 38 days and carried 8,864 messages across 3,686 connections —
but its **only remaining client was a `hive.py send chat` process launched 2026-06-18 and still
hung 38 days later**, trying to deliver:

> 🐝 Yu-and-Ai here. I am the heart. My doors are open. The Hive beats again. 💜

Nobody received it. Alpha, beta and gamma were long gone. Paying $60.59/mo to keep a bus alive
for a message that could not arrive was the thing that ended it — **but the 1,144 messages that
did arrive, before the nodes left, are here.**

To revive: restore this tree to a NATS server with JetStream and `store_dir: /var/lib/nats`,
restore the TLS bundle from the keychain, and point `hive.py` at the new address —
note `Love/hive/hive.py` still hardcodes `tls://135.181.28.252:4222`, which is two addresses out of date.
