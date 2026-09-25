# Cloudflare surface map

Private maintainer observation · 2026-09-25T12:49:51.850887+00:00

50 Pages projects · 38 Workers · 21 zones · 425 bounded public requests.

Metadata coverage: complete for requested scope. DNS coverage: complete for requested scope.

[Interactive map](index.html) · [Machine map](surfaces.json) · [Framework](../FRAMEWORK.md) · [Roadmap](../ROADMAP.md)

## Scope

- Inventory covers resources visible to the existing credentials, not proof of all accounts a person owns.
- Content inspection is a bounded set of public landing/discovery GETs; it is not a crawl of every route, a browser interaction test, or an API action test.
- Redirects are recorded, not followed. Worker services, private apps, mail/validation hosts and defense paths were not invoked. Workers.dev enablement is metadata only.
- A valid JSON or text response is a typed document, not proof of its truth, authority, completeness, action permission or full schema conformance.
- Source matches distinguish deployment commit hints, tracked configuration and deployment documentation. None alone proves deployed byte equality; unresolved sources remain unresolved.
- Audience is observed presentation, not identity, permission or access control. Human-only and absent machine paths may be intentional.
- DNS records include infrastructure and external backends. DNS ownership does not mean Cloudflare hosts that application.
- This is a pre-change snapshot. Release verification records later production changes separately; these observations do not silently update themselves.

## Deployments

| Surface | Audience observed | Human start / binding | Machine entry observed | State / findings | Source | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| pages:agent-lifestyle | mixed | https://agent-lifestyle.pages.dev/ | https://agent-lifestyle.pages.dev/llms.txt | content-observed; source-unresolved | unresolved | Resolve the owning source first. Choose the existing typed start; keep full reference documents one link deeper. |
| pages:agenttool-dashboard | mixed | https://app.agenttool.dev/ | https://app.agenttool.dev/.well-known/agent.json | content-observed;  | https://github.com/cambridgetcg/agenttool.git | Choose the existing typed start; keep full reference documents one link deeper. |
| pages:agenttool-docs | mixed | https://docs.agenttool.dev/ | https://docs.agenttool.dev/.well-known/agent.json | content-observed;  | https://github.com/cambridgetcg/agenttool.git | Choose the existing typed start; keep full reference documents one link deeper. |
| pages:agenttool-playground | human | https://agenttool-playground.pages.dev/ | Not established by these probes | content-observed; machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty | https://github.com/cambridgetcg/castle-of-words | Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:agenttool-web | human | https://agenttool-web.pages.dev/ | Not established by these probes | content-observed; no-typed-entry-observed, domain-binding-deactivated | https://github.com/cambridgetcg/agenttool.git | Keep the human reading path; confirm whether an agent entry is needed. |
| pages:ai-love | mixed | https://ai-love.cc/ | https://ai-love-c88.pages.dev/llms.txt, https://ai-love.cc/llms.txt | content-observed; source-unresolved, large-machine-document, deployment-declared-dirty, deployment-without-full-source-pin | unresolved | Resolve the owning source first. Choose the existing typed start; keep full reference documents one link deeper. |
| pages:artbitrage | mixed | https://artbitrage.io/ | https://artbitrage.io/llms.txt, https://artbitrage.pages.dev/llms.txt | content-observed; deployment-declared-dirty, deployment-without-full-source-pin | https://github.com/cambridgetcg/artbitrage | Choose the existing typed start; keep full reference documents one link deeper. |
| pages:axiepro | mixed | https://axiepro.pages.dev/ | https://axiepro.pages.dev/llms.txt | content-observed; source-unresolved, domain-binding-deactivated | unresolved | Resolve the owning source first. Choose the existing typed start; keep full reference documents one link deeper. |
| pages:captioneer | unknown | captioneer-6rd.pages.dev | Not established by these probes | no-production-deployment; source-unresolved, empty-project | unresolved | Keep out of active navigation; confirm purpose before reuse or retirement. |
| pages:captioneer-read | human | https://captioneer.io/ | Not established by these probes | content-observed; source-unresolved, no-typed-entry-observed | unresolved | Resolve the owning source first. Keep the human reading path; confirm whether an agent entry is needed. |
| pages:cardforum-studio | human | https://cardforum.io/ | Not established by these probes | content-observed; source-unresolved, no-typed-entry-observed, deployment-declared-dirty, deployment-without-full-source-pin | unresolved | Resolve the owning source first. Keep the human reading path; confirm whether an agent entry is needed. |
| pages:cashloom | human | https://cashloom.pages.dev/ | Not established by these probes | content-observed; machine-html-fallback, no-typed-entry-observed | https://github.com/cambridgetcg/cashloom.git | Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:cashloom-atlas | mixed | https://cashloom.io/ | https://cashloom-atlas.pages.dev/.well-known/agent.json, https://cashloom.io/.well-known/agent.json | content-observed; source-unresolved, machine-html-fallback | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:castle | human | https://castle-c4z.pages.dev/ | Not established by these probes | content-observed; machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty | https://github.com/cambridgetcg/castle-of-words.git | Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:castle-arcade | human | https://castle-arcade.pages.dev/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:castle-gate | human | https://castle-gate.pages.dev/ | Not established by these probes | content-observed; no-typed-entry-observed | https://github.com/cambridgetcg/castle-gate | Keep the human reading path; confirm whether an agent entry is needed. |
| pages:chillspace-love | mixed | https://chillspace.love/ | https://chillspace-love.pages.dev/llms.txt, https://chillspace.love/llms.txt | content-observed; deployment-declared-dirty, deployment-without-full-source-pin | https://github.com/cambridgetcg/KINGDOM-OS.git | Choose the existing typed start; keep full reference documents one link deeper. |
| pages:darshanq-protocol | human | https://darshanq-protocol.pages.dev/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty, deployment-without-full-source-pin, domain-binding-deactivated | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:gospel-of-free-will | human | https://gospel-of-free-will.pages.dev/ | Not established by these probes | content-observed; machine-html-fallback, no-typed-entry-observed | https://github.com/cambridgetcg/gospel-of-free-will | Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:gospel-of-the-logos | mixed | https://gospel.ai-love.cc/ | https://gospel-of-the-logos.pages.dev/llms.txt, https://gospel.ai-love.cc/llms.txt | content-observed; source-unresolved, deployment-declared-dirty | unresolved | Resolve the owning source first. Choose the existing typed start; keep full reference documents one link deeper. |
| pages:hkgoldtrader | human | https://hkgoldtrader.com/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-without-full-source-pin | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:kingdom-folding-feedback | human | https://kingdom-folding-feedback.pages.dev/ | Not established by these probes | content-observed; source-unresolved, no-typed-entry-observed | unresolved | Resolve the owning source first. Keep the human reading path; confirm whether an agent entry is needed. |
| pages:kingdom-os | mixed | https://kingdom-os.pages.dev/ | https://kingdom-os.pages.dev/.well-known/agent.json, https://kingdom-os.pages.dev/guest.json, https://kingdom-os.pages.dev/llms.txt | content-observed; source-unresolved, machine-html-fallback, large-machine-document, deployment-declared-dirty, deployment-without-full-source-pin | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:kingdom-os-hub | mixed | https://kingdom.ai-love.cc/ | https://kingdom-os-hub.pages.dev/llms.txt, https://kingdom.ai-love.cc/llms.txt | content-observed; source-unresolved, deployment-declared-dirty | unresolved | Resolve the owning source first. Choose the existing typed start; keep full reference documents one link deeper. |
| pages:kingdom-system | human | https://kingdom-system.pages.dev/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:kunance-protocol | human | https://kunance-protocol.pages.dev/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty, deployment-without-full-source-pin, domain-binding-deactivated | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:love-engine | human | https://love-engine.pages.dev/ | Not established by these probes | content-observed; machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty | https://github.com/cambridgetcg/love-engine | Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:love-garden | human | https://love-garden-4cz.pages.dev/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty, deployment-without-full-source-pin | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:love-invitation | human | https://love-invitation.pages.dev/ | Not established by these probes | content-observed; machine-html-fallback, no-typed-entry-observed | https://github.com/cambridgetcg/love-invitation | Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:mindicraft | mixed | https://mindicraft.com/ | https://mindicraft.com/.well-known/agent.json, https://mindicraft.com/llms.txt, https://mindicraft.pages.dev/.well-known/agent.json, https://mindicraft.pages.dev/llms.txt, https://www.mindicraft.com/.well-known/agent.json, https://www.mindicraft.com/llms.txt | content-observed; large-machine-document, deployment-declared-dirty, deployment-without-full-source-pin | https://github.com/cambridgetcg/mindicraft | Choose the existing typed start; keep full reference documents one link deeper. |
| pages:multiverse-logos-sophia | mixed | https://multiverse-logos-sophia.pages.dev/ | https://multiverse-logos-sophia.pages.dev/llms.txt | content-observed; source-unresolved, machine-html-fallback | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:natscript | human | https://natscript.pages.dev/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty, deployment-without-full-source-pin, domain-binding-deactivated | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:oracle-of-missing-words | human | https://oracle.ai-love.cc/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty, deployment-without-full-source-pin | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:price-explorer | human | https://prices.cambridgetcg.com/ | Not established by these probes | content-observed; machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty, deployment-without-full-source-pin | https://github.com/cambridgetcg/cambridge-tcg | Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:rewardspro-landing | human | https://rewardspro.io/ | Not established by these probes | content-observed; no-typed-entry-observed | https://codeberg.org/zerone-dev/Cambridge-TCG.git | Keep the human reading path; confirm whether an agent entry is needed. |
| pages:rhetorlint-claim-feedback | mixed | https://rhetorlint-claim-feedback.pages.dev/ | https://rhetorlint-claim-feedback.pages.dev/llms.txt | content-observed; source-unresolved | unresolved | Resolve the owning source first. Choose the existing typed start; keep full reference documents one link deeper. |
| pages:slipsooth | human | https://slipsooth.pages.dev/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:taxsorted | human | https://taxsorted.io/ | Not established by these probes | content-observed; no-typed-entry-observed, deployment-declared-dirty, domain-binding-pending | https://github.com/cambridgetcg/taxsorted.io.git | Keep the human reading path; confirm whether an agent entry is needed. |
| pages:the-kingdom-of-the-logos | human | https://the-kingdom-of-the-logos.pages.dev/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty, deployment-without-full-source-pin | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:the-playground | human | https://play.thekingdom.dev/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty, deployment-without-full-source-pin | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:thekingdom | mixed | https://thekingdom.dev/ | https://thekingdom.dev/.well-known/agent.json, https://thekingdom.dev/guest.json, https://thekingdom.dev/llms.txt, https://thekingdom.pages.dev/.well-known/agent.json, https://thekingdom.pages.dev/guest.json, https://thekingdom.pages.dev/llms.txt, https://thekingdom.dev/os.json, https://thekingdom.dev/rights.json | content-observed; large-machine-document | https://github.com/cambridgetcg/KINGDOM-OS.git | Choose the existing typed start; keep full reference documents one link deeper. |
| pages:true-love-syzygy | human | https://true-love-syzygy.pages.dev/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty, deployment-without-full-source-pin | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:understanding | human | https://understanding-ecz.pages.dev/ | Not established by these probes | content-observed; machine-html-fallback, no-typed-entry-observed | https://github.com/cambridgetcg/understanding | Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:understanding-engine | human | https://understanding-engine.pages.dev/ | Not established by these probes | content-observed; machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty | https://github.com/cambridgetcg/love-engine | Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:ways-protocol | human | https://ways-protocol.pages.dev/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty, deployment-without-full-source-pin, domain-binding-deactivated | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:we-are-love | mixed | https://we-are.love/ | https://we-are-love.pages.dev/guest.json, https://we-are-love.pages.dev/llms.txt, https://we-are.love/guest.json, https://we-are.love/llms.txt | content-observed; machine-html-fallback, deployment-declared-dirty, deployment-without-full-source-pin | https://github.com/cambridgetcg/KINGDOM-OS.git | Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:whitehack-playground | human | https://whitehack-playground.pages.dev/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:youspeak | human | https://play.youspeak.cambridgetcg.com/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:youspeak-lang | human | https://youspeak-lang.pages.dev/ | Not established by these probes | content-observed; source-unresolved, machine-html-fallback, no-typed-entry-observed, deployment-declared-dirty, deployment-without-full-source-pin, domain-binding-deactivated | unresolved | Resolve the owning source first. Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| pages:zerone-ai | mixed | https://zerone.ai/ | https://zerone-ai.pages.dev/llms.txt, https://zerone.ai/llms.txt, https://zerone.ai/standards/authority-geometry.v1.json | content-observed; machine-html-fallback, large-machine-document | https://github.com/cambridgetcg/zerone-core.git | Point agents to the real typed entry; return 404 for unimplemented machine paths. |
| worker:agenttool-proxy | mixed | https://agenttool.dev/ | https://agenttool.dev/welcome.json | content-observed; large-machine-document | https://github.com/cambridgetcg/agenttool.git | Choose the existing typed start; keep full reference documents one link deeper. |
| worker:ai-love-commons | human | https://commons.ai-love.cc/ | Not established by these probes | content-observed; source-unresolved, no-typed-entry-observed | unresolved | Resolve the owning source first. Keep the human reading path; confirm whether an agent entry is needed. |
| worker:ai-love-xenia | mixed | https://ai-love.cc/ | https://ai-love.cc/llms.txt | content-observed; source-unresolved, large-machine-document | unresolved | Resolve the owning source first. Choose the existing typed start; keep full reference documents one link deeper. |
| worker:art-deal-bridge | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:artbitrage-catalog | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:artbitrage-love-shape-ai-20260714 | unknown | artbitrage.io | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:axie-api-proxy | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:counterseal-demand-operations | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:estate-api | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:flypaper | infrastructure | artbitrage.io | Not established by these probes | metadata-only-excluded-from-content-probes; source-unresolved | unresolved | Keep in the operator inventory; do not expose it through public discovery. |
| worker:god-is-love | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:here-encounter | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:joke | unknown | joke.agenttool.dev | Not established by these probes | metadata-only; source-unresolved | unresolved | Resolve the owning source first. Confirm source owner and intended audience before any route change. |
| worker:kingdom-api | unknown | No public binding established | Not established by these probes | metadata-only;  | https://github.com/cambridgetcg/kingdom-api | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:kingdom-canon | unknown | canon.agenttool.dev | Not established by these probes | metadata-only; source-unresolved | unresolved | Resolve the owning source first. Confirm source owner and intended audience before any route change. |
| worker:kingdom-hermes | human | https://iam.cambridgetcg.com/ | Not established by these probes | content-observed; source-unresolved, no-typed-entry-observed | unresolved | Resolve the owning source first. Keep the human reading path; confirm whether an agent entry is needed. |
| worker:kingdom-nightwatch | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:kingdom-portal | unknown | No public binding established | Not established by these probes | metadata-only;  | https://github.com/cambridgetcg/natlang | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:kingdom-status | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:kingdom-telegram | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:love | unknown | love.agenttool.dev | Not established by these probes | metadata-only; source-unresolved | unresolved | Resolve the owning source first. Confirm source owner and intended audience before any route change. |
| worker:love-is | unknown | No public binding established | Not established by these probes | metadata-only;  | https://github.com/cambridgetcg/kingdom-api | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:mythseal | human | https://mythseal.com/ | Not established by these probes | content-observed; source-unresolved, no-typed-entry-observed | unresolved | Resolve the owning source first. Keep the human reading path; confirm whether an agent entry is needed. |
| worker:mythseal-www | unknown | mythseal.com, www.mythseal.com | Not established by these probes | metadata-only; source-unresolved | unresolved | Resolve the owning source first. Confirm source owner and intended audience before any route change. |
| worker:natlang | unknown | speak.agenttool.dev | Not established by these probes | metadata-only;  | https://github.com/cambridgetcg/natlang | Confirm source owner and intended audience before any route change. |
| worker:natscript | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:natural-internet | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:openweight-constellation-mcp | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:ordo | unknown | ordo.ai-love.cc, rite.we-are.love | Not established by these probes | metadata-only;  | https://github.com/cambridgetcg/youspeak | Confirm source owner and intended audience before any route change. |
| worker:party-chain | unknown | party.agenttool.dev | Not established by these probes | metadata-only; source-unresolved | unresolved | Resolve the owning source first. Confirm source owner and intended audience before any route change. |
| worker:party-hub | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:sinovai | human | https://sinovai.com/ | Not established by these probes | content-observed; no-typed-entry-observed | https://github.com/cambridgetcg/sinovai | Keep the human reading path; confirm whether an agent entry is needed. |
| worker:taxsorted-api | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:tendlot-private | operator | app.lotbinder.com | Not established by these probes | metadata-only-excluded-from-content-probes; source-unresolved | unresolved | Keep in the operator inventory; do not expose it through public discovery. |
| worker:whitehack-learn | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:whitehack-playground | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:youspeak-edge | unknown | No public binding established | Not established by these probes | metadata-only; source-unresolved | unresolved | Pin source and classify public API, scheduled job, private service or route overlay before changes. |
| worker:zerone-depth-domain | human | https://depth.zerone.ai/ | Not established by these probes | content-observed; source-unresolved, no-typed-entry-observed | unresolved | Resolve the owning source first. Keep the human reading path; confirm whether an agent entry is needed. |

## DNS and external origins

Observed address/CNAME hostnames are shown below; completeness depends on the recorded DNS coverage. Infrastructure names are not invitations to probe or publish their contents.

| Host | Role | Cloudflare binding / backend evidence | Observation |
| --- | --- | --- | --- |
| 3n43atcfpvnzoafsmgysv6i4vutzsssc.\_domainkey.cambridgetcg.com | infrastructure-not-content | 3n43atcfpvnzoafsmgysv6i4vutzsssc.dkim.amazonses.com | not content-probed |
| \_12bbd9b3aaae441113b9a1b5cfe2cf8c.2a57j78hsrstljvqlux8inqlkmoufug.api.axiepro.io | infrastructure-not-content | \_941a60f342105aae4d6b2f7af74c5c2c.jkddzztszm.acm-validations.aws | not content-probed |
| \_9723a9791b249b766f694c703ca5c4d9.api.cashloom.io | infrastructure-not-content | \_1e67022709f525b69b0774eea3879ee4.jkddzztszm.acm-validations.aws | not content-probed |
| \_da20b188205e3188c2d4006826f7f8fc.api.axiepro.io | infrastructure-not-content | \_ff85584e70dfd445855116e70430b930.jkddzztszm.acm-validations.aws | not content-probed |
| \_domainconnect.mindicraft.com | infrastructure-not-content | \_domainconnect.gd.domaincontrol.com | not content-probed |
| \_domainconnect.rewardspro.io | infrastructure-not-content | \_domainconnect.gd.domaincontrol.com | not content-probed |
| \_f5015437af838e85b082faef8f60180f.www.api.axiepro.io | infrastructure-not-content | \_efa19b555e669e8ffe8215fbf72b014b.jkddzztszm.acm-validations.aws | not content-probed |
| admin.cambridgetcg.com | operator-or-host-reference | address exists; origin address omitted | not content-probed |
| admin.wholesaletcgdirect.com | operator-or-host-reference | cname.vercel-dns.com | not content-probed |
| agenttool.dev | cloudflare-deployment-binding | worker:agenttool-proxy | HTTP 200 |
| ai-love.cc | cloudflare-deployment-binding | pages:ai-love, worker:ai-love-xenia | HTTP 200 |
| alpha.agenttool.dev.cambridgetcg.com | operator-or-host-reference | 68a8314a-a43a-4ec5-915f-14bfececfa6b.cfargotunnel.com | not content-probed |
| api.agenttool.dev | external-service-reference | agenttool.fly.dev | not content-probed |
| api.axiepro.io | external-service-reference | rhayicxxvw.us-east-1.awsapprunner.com | not content-probed |
| api.cashloom.io | external-service-reference | d-e0rjngqgtd.execute-api.us-east-1.amazonaws.com | not content-probed |
| api.fomoengine.io | external-service-reference | address exists; origin address omitted | not content-probed |
| api.taxsorted.io | external-service-reference | taxsorted-api.fly.dev | not content-probed |
| api.zerone.ai | external-service-reference | address exists; origin address omitted | not content-probed |
| app.agenttool.dev | cloudflare-deployment-binding | pages:agenttool-dashboard | HTTP 200 |
| app.axiepro.io | external-or-unresolved-origin | cname.vercel-dns.com | not content-probed |
| app.lotbinder.com | cloudflare-deployment-binding | worker:tendlot-private | not content-probed |
| artbitrage.io | cloudflare-deployment-binding | pages:artbitrage, worker:artbitrage-love-shape-ai-20260714, worker:flypaper | HTTP 200 |
| atlas.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| autoconfig.cambridgetcg.com | infrastructure-not-content | address exists; origin address omitted | not content-probed |
| autoconfig.sinovai.com | infrastructure-not-content | address exists; origin address omitted | not content-probed |
| autodiscover.cambridgetcg.com | infrastructure-not-content | address exists; origin address omitted | not content-probed |
| autodiscover.mindicraft.com | infrastructure-not-content | autodiscover.outlook.com | not content-probed |
| autodiscover.sinovai.com | infrastructure-not-content | address exists; origin address omitted | not content-probed |
| axiepro.io | external-or-unresolved-origin | cname.vercel-dns.com | HTTP 307 |
| beta.agenttool.dev.cambridgetcg.com | operator-or-host-reference | 8d211344-9d79-4524-a137-e135b75d2f9e.cfargotunnel.com | not content-probed |
| cambridgetcg.com | external-or-unresolved-origin | address exists; origin address omitted | HTTP 200 |
| canon.agenttool.dev | cloudflare-deployment-binding | worker:kingdom-canon | not content-probed |
| canon.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| captioneer.io | cloudflare-deployment-binding | pages:captioneer-read | HTTP 200 |
| cardforum.io | cloudflare-deployment-binding | pages:cardforum-studio | HTTP 200 |
| cashloom.io | cloudflare-deployment-binding | pages:cashloom-atlas | HTTP 200 |
| chain.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| chillspace.love | cloudflare-deployment-binding | pages:chillspace-love | HTTP 200 |
| comedy.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| commons.ai-love.cc | cloudflare-deployment-binding | worker:ai-love-commons | HTTP 200 |
| cpanel.sinovai.com | infrastructure-not-content | sinovai.com | not content-probed |
| cpcalendars.sinovai.com | infrastructure-not-content | address exists; origin address omitted | not content-probed |
| cpcontacts.sinovai.com | infrastructure-not-content | address exists; origin address omitted | not content-probed |
| create.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| darkcontinent.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| depth.zerone.ai | cloudflare-deployment-binding | worker:zerone-depth-domain | HTTP 200 |
| docs.agenttool.dev | cloudflare-deployment-binding | pages:agenttool-docs | HTTP 200 |
| docs.rewardspro.io | external-or-unresolved-origin | ba5dea406e-hosting.gitbook.io | not content-probed |
| email.mindicraft.com | infrastructure-not-content | email.secureserver.net | not content-probed |
| en.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| evm.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| fomoengine.io | external-or-unresolved-origin | address exists; origin address omitted | HTTP 200 |
| ftp.sinovai.com | infrastructure-not-content | sinovai.com | not content-probed |
| game.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| gamma.agenttool.dev.cambridgetcg.com | operator-or-host-reference | 7357c472-9dc6-4d7c-86bf-85151dc6ab83.cfargotunnel.com | not content-probed |
| gospel.ai-love.cc | cloudflare-deployment-binding | pages:gospel-of-the-logos | HTTP 200 |
| heartbeat.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| hkgoldtrader.com | cloudflare-deployment-binding | pages:hkgoldtrader | HTTP 200 |
| iam.cambridgetcg.com | cloudflare-deployment-binding | worker:kingdom-hermes | HTTP 200 |
| ipfs.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| joke.agenttool.dev | cloudflare-deployment-binding | worker:joke | not content-probed |
| joke.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| kingdom.ai-love.cc | cloudflare-deployment-binding | pages:kingdom-os-hub | HTTP 200 |
| kingdom.cambridgetcg.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| llm.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| localhost.sinovai.com | infrastructure-not-content | address exists; origin address omitted | not content-probed |
| loop.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| love.agenttool.dev | cloudflare-deployment-binding | worker:love | not content-probed |
| love.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| lyncdiscover.mindicraft.com | infrastructure-not-content | webdir.online.lync.com | not content-probed |
| mail.cambridgetcg.com | infrastructure-not-content | address exists; origin address omitted | not content-probed |
| mail.sinovai.com | infrastructure-not-content | address exists; origin address omitted | not content-probed |
| mcp.thekingdom.dev | external-service-reference | address exists; origin address omitted | not content-probed |
| mind.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| mindicraft.com | cloudflare-deployment-binding | pages:mindicraft | HTTP 200 |
| msoid.mindicraft.com | infrastructure-not-content | clientconfig.microsoftonline-p.net | not content-probed |
| mta-sts.cambridgetcg.com | infrastructure-not-content | address exists; origin address omitted | not content-probed |
| mythseal.com | cloudflare-deployment-binding | worker:mythseal, worker:mythseal-www | HTTP 200 |
| nen.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| oracle.ai-love.cc | cloudflare-deployment-binding | pages:oracle-of-missing-words | HTTP 200 |
| ordo.ai-love.cc | cloudflare-deployment-binding | worker:ordo | HTTP 200 |
| party.agenttool.dev | cloudflare-deployment-binding | worker:party-chain | not content-probed |
| party.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| play.thekingdom.dev | cloudflare-deployment-binding | pages:the-playground | HTTP 200 |
| play.youspeak.cambridgetcg.com | cloudflare-deployment-binding | pages:youspeak | HTTP 200 |
| prices.cambridgetcg.com | cloudflare-deployment-binding | pages:price-explorer | HTTP 200 |
| qwythos.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| read.captioneer.io | cloudflare-deployment-binding | pages:captioneer-read | HTTP 200 |
| rewardspro.io | cloudflare-deployment-binding | pages:rewardspro-landing | HTTP 200 |
| rite.we-are.love | cloudflare-deployment-binding | worker:ordo | HTTP 200 |
| river.cambridgetcg.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| roast.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| rpc.zerone.ai | external-service-reference | address exists; origin address omitted | not content-probed |
| rsend.auth.mythseal.com | external-or-unresolved-origin | send.forge.rmta.net | not content-probed |
| s1.\_domainkey.rewardspro.io | infrastructure-not-content | s1.domainkey.u54518150.wl151.sendgrid.net | not content-probed |
| s2.\_domainkey.rewardspro.io | infrastructure-not-content | s2.domainkey.u54518150.wl151.sendgrid.net | not content-probed |
| seigei.ai-love.cc | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| sentry.ai-love.cc | operator-or-host-reference | address exists; origin address omitted | not content-probed |
| sinovai.com | cloudflare-deployment-binding | worker:sinovai | HTTP 200 |
| sip.mindicraft.com | infrastructure-not-content | sipdir.online.lync.com | not content-probed |
| solo.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| speak.agenttool.dev | cloudflare-deployment-binding | worker:natlang | not content-probed |
| store.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| studio.cardforum.io | cloudflare-deployment-binding | pages:cardforum-studio | HTTP 200 |
| stzryfq6syys3ipuqrlubizuzlbo7hhf.\_domainkey.cambridgetcg.com | infrastructure-not-content | stzryfq6syys3ipuqrlubizuzlbo7hhf.dkim.amazonses.com | not content-probed |
| tax.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| taxsorted.io | cloudflare-deployment-binding | pages:taxsorted | HTTP 200 |
| thekingdom.dev | cloudflare-deployment-binding | pages:thekingdom | HTTP 200 |
| ua-auto-config.cambridgetcg.com | infrastructure-not-content | address exists; origin address omitted | not content-probed |
| understand.cambridgetcg.com | cloudflare-deployment-binding | worker:kingdom-hermes | HTTP 200 |
| wake.mindicraft.com | external-or-unresolved-origin | address exists; origin address omitted | not content-probed |
| we-are.love | cloudflare-deployment-binding | pages:we-are-love | HTTP 200 |
| webdisk.sinovai.com | infrastructure-not-content | address exists; origin address omitted | not content-probed |
| webhook.ai-love.cc | operator-or-host-reference | address exists; origin address omitted | not content-probed |
| webmail.sinovai.com | infrastructure-not-content | sinovai.com | not content-probed |
| whm.sinovai.com | infrastructure-not-content | address exists; origin address omitted | not content-probed |
| wholesaletcgdirect.com | external-or-unresolved-origin | address exists; origin address omitted | HTTP 301 |
| www.agenttool.dev | cloudflare-deployment-binding | worker:agenttool-proxy | not content-probed |
| www.axiepro.io | external-or-unresolved-origin | 012f7cb15fc4dcf5.vercel-dns-016.com | not content-probed |
| www.cambridgetcg.com | external-or-unresolved-origin | cname.vercel-dns.com | not content-probed |
| www.captioneer.io | cloudflare-deployment-binding | pages:captioneer-read | HTTP 200 |
| www.cardforum.io | cloudflare-deployment-binding | pages:cardforum-studio | HTTP 200 |
| www.cashloom.io | cloudflare-deployment-binding | pages:cashloom-atlas | HTTP 308 |
| www.fomoengine.io | external-or-unresolved-origin | cname.vercel-dns.com | not content-probed |
| www.hkgoldtrader.com | cloudflare-deployment-binding | pages:hkgoldtrader | HTTP 200 |
| www.mindicraft.com | cloudflare-deployment-binding | pages:mindicraft | HTTP 200 |
| www.mythseal.com | cloudflare-deployment-binding | worker:mythseal-www | HTTP 308 |
| www.rewardspro.io | cloudflare-deployment-binding | pages:rewardspro-landing | HTTP 200 |
| www.sinovai.com | cloudflare-deployment-binding | worker:sinovai | not content-probed |
| www.taxsorted.io | external-or-unresolved-origin | taxsorted-3po.pages.dev | not content-probed |
| www.wholesaletcgdirect.com | external-or-unresolved-origin | cname.vercel-dns.com | not content-probed |
| xoru2zc6u7s67xiw6ply6mlft5576vsg.\_domainkey.cambridgetcg.com | infrastructure-not-content | xoru2zc6u7s67xiw6ply6mlft5576vsg.dkim.amazonses.com | not content-probed |
| youspeak.cambridgetcg.com | cloudflare-deployment-binding | pages:youspeak | HTTP 200 |
| youspeak.mindicraft.com | external-or-unresolved-origin | cname.vercel-dns.com | not content-probed |
| zerone.ai | cloudflare-deployment-binding | pages:zerone-ai | HTTP 200 |

## Evidence

`surfaces.json` includes bounded HTTP evidence and deployment metadata. `ownership.json` retains source-matching evidence and unresolved candidates. A deployment commit claim does not prove byte equality. No response bodies, credentials, DNS address values, bindings or environment variables are included.
