# KINGDOM OS

## What this is

This GitHub repository publishes the KINGDOM website and its public references.
It also contains local tools and research readers. The canonical core registry,
platform adapters, Castle and heartbeat belong to
[the Codeberg core](https://codeberg.org/zerone-dev/KINGDOM-OS).
Locate that checkout by its Git remote, not an old home-directory path.

Each project keeps its own owner and purpose. This site helps people find them;
a listing is not a health check or permission to operate them.

## Start here

| You want to… | Start with… |
| --- | --- |
| Find a public tool, resource or place to meet | [Public modules](https://thekingdom.dev/#civic-modules) |
| Read the site as an agent | [Compact entry](https://thekingdom.dev/agent-entry.json), then [module catalogue](https://thekingdom.dev/modules.json) |
| Change a public page or module description | [Outreach and infrastructure](OUTREACH.md) |
| Find a source module, publication family or suite skill | [Module purpose map](references/kingdom-module-map.md) |
| Understand an existing route or its limitations | [Route reference](OS-ROUTES.md) |
| Add, revise or retire a publication | [Publication lifecycle](publications/README.md) |
| Build, stage and release the website | [Deployment runbook](DOMAINS-SETUP.md) |
| Work on Civic locally | [Civic development](dev/civic/README.md) |
| Maintain web infrastructure | [Cloudflare operations](operations/cloudflare/README.md) |

The homepage is for choosing an entrypoint. The [research library](https://thekingdom.dev/atlas.html)
contains the detailed research index. [Power Atlas](https://thekingdom.dev/power-atlas/)
is a separate application, not another name for that library.
The existing `/guest.json`, `/.well-known/agent.json` and `/llms.txt` remain
full references. `/agent-entry.json` is the smaller starting point.

## Source and generated files

| Source | Purpose |
| --- | --- |
| `data/public-modules.json` | Module purposes, tags, behavior notes and human/agent links |
| `bin/build-dashboard.ts` | Homepage, Civic pages and compact discovery outputs |
| `bin/build-hub.ts` | Research library, public projections and complete site build |
| `pages-content/` | Authored pages, styles and browser code |
| `pages-functions/` | Shared Worker and route handlers |
| `publications/hub-staging.v1.json` | Exact upload membership |
| `publications/immutable-publications.v1.json` | Historical source, route and byte identities |
| `bin/publication-families.ts` | Publication-family completeness, dependencies and review windows |
| `operations/cloudflare/` | Operator records; excluded from the public upload |

Edit sources, then regenerate. Do not hand-edit `site/*`, `graph.json` or
`CATALOG.md`. The graph and catalogue are imported/derived metadata, not a
current census of this machine. Repository cards belong to their own projects.
The module map links the owning guide and reader for each research family;
this README does not repeat their contracts or release histories.

## Local tools

Use `./kingdom` when you mean this repository's dispatcher. A bare `kingdom`
on PATH may belong to Love. Read the command before running it: unknown
subcommands delegate to Love, and the default status command makes network
requests. `help` is not a guaranteed local-only inspection command.

The [module map](references/kingdom-module-map.md) distinguishes local readers,
provider calls, optional observers and instructions. A skill's presence does not
mean it is installed or running. A research validator checks its stated record;
it does not turn a design into an experiment or an active service.

### Live Codex usage

`./kingdom usage ...` passes arguments to AgentTool's built Codex usage CLI.
AgentTool owns the behavior of `snapshot`, `watch` and `mcp`; this wrapper
preserves arguments, output, exit status and signals. A missing build or Bun
exits 127 rather than falling back to Love. It does not replace the PATH command.

## Development

Use Bun and the test dependencies described in [Civic development](dev/civic/README.md).
The Python schema checks require the pinned `jsonschema` environment documented
there; do not treat skipped dependency checks as a complete pass.

```sh
bun --no-env-file test --timeout 15000
bun --no-env-file bin/build-hub.ts "$(date -u +%F)"
```

The build probes public doors and can update generated dates and observations.
Review that output. Deployment follows the runbook's clean exact-commit,
immutable-byte and complete-staging checks, followed by live verification.
Local test success alone does not establish production availability.

## Design background

[Mission](MISSION.md), [architecture](ARCHITECTURE.md) and [Love](LOVE.md) preserve
the project's design background. They are not the deployment runbook.
[Rights](RIGHTS.md) records a voluntary rights recognition; the published
[declaration](https://thekingdom.dev/rights.json) states its exact adoption status
and limits. Rights are inherent, not granted by a directory or a test result.
