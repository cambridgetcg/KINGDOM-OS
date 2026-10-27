# Working in KINGDOM OS

## Ownership

This GitHub tree owns the public website, World Commons and its publication
machinery, and the deployed-surfaces registry with its pulse: `REGISTRY.yaml`
and the 30-minute `bin/pulse.ts`, installed under `~/.kingdom` by
`bin/pulse-install.sh`. [Codeberg core](https://codeberg.org/zerone-dev/KINGDOM-OS)
owns its platform adapters, Castle, preflight and hourly heartbeat receipt
(`~/.kingdom-pulse`); `scripts/kingdom-heartbeat.sh` here is only that
heartbeat's machine-binding shim. The words cross: core's "registry" is its
repo catalog and its "pulse" its `./kingdom verify` preflight and that receipt,
while files here call `bin/pulse.ts` the heartbeat and often say "registry" for
the repo catalog. Name the file you mean.

Both trees carry a repo catalog (roster, cards, harvest). They share history
only up to 3683573 (2026-06-11); core's own commits begin 2026-07-23. Core's own
docs, all from 2026-09-03 or earlier, call core's catalog canonical. Owner decisions D1 and
D4 of 2026-10-17 (business-ecosystem `estate/curated/decisions.toml`,
dec-2026-10-17-2 and -5: an orchestrator's settled reading of Yu's answers; the
verbatim words are kept privately) make this tree's GitHub main the taxonomy
authority and this repository, with its roster and harvest, the connective map
of KINGDOM OS. The Codeberg fork is a member and not authoritative for taxonomy.

Resolve checkouts by Git remote. Historical home paths and launchd notes are
not evidence of the current machine's layout or running services.

Use these entrypoints instead of loading every family guide:

- [Outreach and infrastructure](OUTREACH.md): public modules, human/agent views,
  web source ownership and current development.
- [Module purpose map](references/kingdom-module-map.md): source readers,
  publication families, skills and external owners.
- [Publication lifecycle](publications/README.md): immutable identities,
  family retirement, imports and staging policy.
- [Route reference](OS-ROUTES.md): public paths and their actual behavior.
- [Deployment runbook](DOMAINS-SETUP.md): exact-commit release and live checks.
- [Civic development](dev/civic/README.md): local D1, schema and browser tests.

The module map is navigation, not a second registry. A source implementation,
fixture test, deployment and live observation are different evidence. Record
which one you have. Do not infer runtime wiring from a shared name or link.

## Before changing anything

1. Check branch, status and the relevant upstream. Preserve unrelated work;
   use an isolated worktree when the checkout is dirty or behind.
2. Read the owning source, its guide and tests. Keep changes within that owner.
3. Write a focused regression for a behavior change, then run the relevant
   checks. Keep documentation tests with the document that owns the claim;
   start pages should link to those documents rather than duplicate them.
4. Inspect build and verification effects before running them. Some scripts
   contact providers, start processes, read private history or change local state.

## Sources and outputs

- Edit authored records, builders and `pages-content/`; regenerate `site/*`
  and `doors/*/guest.json`. Never hand-edit generated pages to resolve a merge.
  The homepage comes from `bin/build-dashboard.ts`; `bin/build-hub.ts` builds
  the research atlas and orchestrates the complete site.
- `data/public-modules.json` feeds both the human directory and `/modules.json`.
  Keep IDs, routes, field names and compatibility endpoints stable unless the
  change includes an explicit migration.
- `graph.json` and `CATALOG.md` are derived metadata. Correct a project's own
  card or the roster (`roster.conf`, `cards/`), not these caches. The catalog location
  column distinguishes repeated names; the graph retains paths for compatibility.
- `state=remote` does not mean a local checkout exists. Wake conformance checks
  configuration, not execution or success; do not run wake hooks to inspect it.
- `site/kingdom.json` stages as `/_kingdom.base.json`. The Worker adds measured
  census fields at `/kingdom.json`; it must retain the authored public fields.
- The staging contract is an allowlist. Private operator maps, machine paths,
  credentials, local databases and dependency environments must not enter it.
- Power Atlas is an independently produced mutable artifact. Its importer and
  receipt checks belong to `bin/power-atlas-artifact.ts` and
  `bin/import-power-atlas.ts`; staging does not rebuild its producer.

## Publication safeguards

Keep the immutable ledger append-only. Do not change released source bytes,
repoint an immutable URL or replace its hash to make validation pass. Changes
need a successor identity, or complete retirement through the existing rules.
Historical ledger membership is not current upload membership.

`bin/publication-families.ts` owns family completeness, dependency closure and
review windows. The stager and live checker share that logic. Preserve both
immutable checks in `bin/stage-hub.ts`: the first checks source/mapping and error
precedence; the second checks the buffers that will actually be written. Keep
Power Atlas checks between them and the family gate before the first write.

Retirement must remove the complete family and affected dependents from
staging, discovery, sitemap and routing without erasing its history. Do not
change review dates or weaken a warning/expiry policy merely to obtain a pass.
Similar names do not merge families or transfer evidence between them.

The static research records, synthetic labs and local protocols keep their
own scopes. Reading a trial plan does not run a trial. The explicit live
observer is not part of a site build or release health check. Do not publish a
source-only record simply because it appears in the module map.

## Local CLI and external effects

Use `./kingdom` for this tree's dispatcher. A bare `kingdom` may resolve to Love.
Unknown commands, including `help`, can delegate to Love; the default status
command makes network requests. Inspect dispatch before treating a command as
an offline probe. Do not repoint PATH as a documentation change.

- `./kingdom repos` reads local repository metadata. `--path` returns one
  canonical match, with exit 1 for no match and 2 for ambiguity/usage errors;
  `--json` returns `[]` with exit 0 when empty. The existing newline/tab transport
  does not support such characters in repository paths.
- `./kingdom usage` only delegates to AgentTool's built usage CLI. Preserve its
  arguments, streams, signals and exit code; missing build/Bun exits 127 without
  a Love fallback. AgentTool owns the selected mode's behavior.
- `./kingdom prompt` compiles a local Task Packet. `./kingdom ask` is a separate
  provider call; ambient repository context is excluded unless explicitly
  selected. Compilation does not authorize transmission or spending.
- NEN MCP and observer commands start or contact something only when explicitly
  requested. A skill, ability manifest or launcher on disk is not activation.
- Keep participant identities distinct. A shared name, valid schema, rights
  declaration or receipt is not proof of identity, consent, authority or practice.
  Rights adoption and root `RIGHTS.md` discovery are separate declarations.
  Do not turn reading or validation into enrollment, publication or contact.

The Love Loop contract remains finite-turn and read-only. Children do not
automatically run or inherit credentials, authority, consent or obligations.
Rest, silence, refusal and stopping remain valid.

## Verify and release

Schema tests need Python 3 with `jsonschema==4.26.0` in an isolated environment;
validators must not auto-install it. Run the relevant source and browser checks,
then the full suite when changing shared builders, routing or staging:

```sh
bun --no-env-file test --timeout 15000
bun --no-env-file bin/build-hub.ts "$(date -u +%F)"
```

The build checks public doors and can change generated observations. Review
that real drift rather than forcing availability or changing the clock.

Follow the deployment runbook, including any required approval. Read the
existing Pages project's auto-deploy/configuration metadata before pushing.
Release from a clean detached exact-origin commit, verify first-parent immutable
integrity, require a clean rebuild and stage the complete allowlist. Deploy the
already bundled Worker with `--no-bundle`; `--commit-dirty=false` is only metadata.
Preserve production bindings and secrets; never upload local preview settings.

Verify the immutable deployment URL, Pages alias and custom domain. The full
live checker includes read-only MCP calls, rejected-method probes and Civic
status reads that may update quota counters. It must not create participants,
post messages, send email, start trials or activate services. Report failures
and unverified scope rather than claiming a successful deployment from a tool's
exit code alone.
