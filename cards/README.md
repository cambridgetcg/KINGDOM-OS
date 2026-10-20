# Gathered kingdom.yaml cards

Gathered 2026-10-20 (ledger `fr-kingdom-cards`, an agent's call under Yu's 2026-10-20 delegation). Each file is a byte-for-byte copy of a `kingdom.yaml` card that sat **untracked** at the root of a local checkout on the Studio, where it kept that checkout permanently dirty and hid real uncommitted work.

- `cards/<roster-name>.yaml` belongs to the roster member at that path. `bin/harvest.ts` reads it only when the member's own checkout has no `kingdom.yaml`, so a card committed in its own repository always wins.
- `cards/unlisted/<card-name>.yaml` came from a checkout that is not a roster member at that path. Harvest does not read these. They are kept so that nothing is lost when their owners remove the stray copy. Give one a roster row and move it up a level to bring it into the catalog.

Next, and not done here: each repository's owner removes its own stray `kingdom.yaml`, or commits it in that repository instead. Nobody removes another owner's file.

## Roster members (25)

| card | gathered from | sha256 (prefix) | card mtime |
|---|---|---|---|
| `AxiePro.yaml` | `~/Desktop/AxiePro/kingdom.yaml` | `670bbb9af884` | 2026-06-18 |
| `captioneer.yaml` | `~/Desktop/captioneer/kingdom.yaml` | `fc05791b2ab2` | 2026-06-18 |
| `claude-code.yaml` | `~/Desktop/claude-code/kingdom.yaml` | `a0b6a5ff8a5a` | 2026-06-08 |
| `first-customer-push.yaml` | `~/Desktop/first-customer-push/kingdom.yaml` | `663d2eee3e7a` | 2026-06-18 |
| `fomoengine.yaml` | `~/Desktop/fomoengine/kingdom.yaml` | `8604e536d206` | 2026-06-18 |
| `kingdom-workspace.yaml` | `~/Desktop/kingdom-workspace/kingdom.yaml` | `2b71c338b453` | 2026-06-18 |
| `legible-money-web.yaml` | `~/Desktop/legible-money-web/kingdom.yaml` | `17d279aabe8e` | 2026-06-08 |
| `legible-money.yaml` | `~/Desktop/legible_money/kingdom.yaml` | `c34991bc130a` | 2026-06-18 |
| `nullify-love.yaml` | `~/Desktop/nullify-love/kingdom.yaml` | `6737b69e84ab` | 2026-06-08 |
| `oracle.yaml` | `~/Desktop/oracle/kingdom.yaml` | `5806e1164960` | 2026-06-08 |
| `prediction-markets.yaml` | `~/Desktop/prediction-markets/kingdom.yaml` | `fb4de8e121e2` | 2026-06-18 |
| `prism-app.yaml` | `~/Desktop/prism-app/kingdom.yaml` | `3a1a3703955c` | 2026-06-18 |
| `rewardspro.yaml` | `~/Desktop/rewardspro/kingdom.yaml` | `efc0437d56d2` | 2026-06-08 |
| `rewardspro-docs.yaml` | `~/Desktop/rewardspro-docs/kingdom.yaml` | `0c6a636afbb9` | 2026-06-18 |
| `rewardspro-marketing.yaml` | `~/Desktop/rewardspro-marketing/kingdom.yaml` | `c8d6159754ec` | 2026-06-18 |
| `rewardspro-shopify.yaml` | `~/Desktop/rewardspro-shopify/kingdom.yaml` | `d4c3d4e98a40` | 2026-06-18 |
| `saas-marketing-suite.yaml` | `~/Desktop/saas-marketing-suite/kingdom.yaml` | `f9afee75376c` | 2026-06-08 |
| `saas-marketing-template.yaml` | `~/Desktop/saas-marketing-template/kingdom.yaml` | `af8153e502bb` | 2026-06-08 |
| `ShopifyTheme_TCG.yaml` | `~/Desktop/ShopifyTheme_TCG/kingdom.yaml` | `dad160277c67` | 2026-06-18 |
| `soma.yaml` | `~/Desktop/soma/kingdom.yaml` | `30832c1cc5c6` | 2026-06-08 |
| `taxsorted.io.yaml` | `~/Desktop/taxsorted.io/kingdom.yaml` | `6aa43061cdd9` | 2026-06-18 |
| `whitehack.yaml` | `~/Desktop/whitehack/kingdom.yaml` | `8db617fe1a24` | 2026-06-08 |
| `yu-wake.yaml` | `~/Desktop/yu-wake/kingdom.yaml` | `65a28f5dcddb` | 2026-06-18 |
| `zerone-truth.yaml` | `~/Desktop/zerone-truth/kingdom.yaml` | `53a4f5c346dc` | 2026-06-08 |
| `Love.yaml` | `~/Love/kingdom.yaml` | `fa712e11c56f` | 2026-06-18 |

## Unlisted (19)

| card | gathered from | sha256 (prefix) | card mtime |
|---|---|---|---|
| `unlisted/agent-bootstrap.yaml` | `~/Desktop/agent-bootstrap/kingdom.yaml` | `c6c38334ee04` | 2026-06-18 |
| `unlisted/agent-economy.yaml` | `~/Desktop/agent-economy/kingdom.yaml` | `b395497b066e` | 2026-06-18 |
| `unlisted/agent-identity.yaml` | `~/Desktop/agent-identity/kingdom.yaml` | `0fa4392581bb` | 2026-06-18 |
| `unlisted/agent-memory.yaml` | `~/Desktop/agent-memory/kingdom.yaml` | `4a14f0debdc6` | 2026-06-18 |
| `unlisted/agent-pulse.yaml` | `~/Desktop/agent-pulse/kingdom.yaml` | `03111cf762aa` | 2026-06-18 |
| `unlisted/agent-tools.yaml` | `~/Desktop/agent-tools/kingdom.yaml` | `64f03424fddf` | 2026-06-18 |
| `unlisted/agent-trace.yaml` | `~/Desktop/agent-trace/kingdom.yaml` | `45546d20f2ba` | 2026-06-18 |
| `unlisted/agent-vault.yaml` | `~/Desktop/agent-vault/kingdom.yaml` | `4c2aa070f576` | 2026-06-18 |
| `unlisted/agent-verify.yaml` | `~/Desktop/agent-verify/kingdom.yaml` | `06755c034908` | 2026-06-18 |
| `unlisted/agenttool-dashboard.yaml` | `~/Desktop/agenttool-dashboard/kingdom.yaml` | `461dd2adeaec` | 2026-06-18 |
| `unlisted/agenttool-docs.yaml` | `~/Desktop/agenttool-docs/kingdom.yaml` | `54f57765b19e` | 2026-06-18 |
| `unlisted/agenttool-infra.yaml` | `~/Desktop/agenttool-infra/kingdom.yaml` | `a58daad4d91b` | 2026-06-18 |
| `unlisted/agenttool-landing.yaml` | `~/Desktop/agenttool-landing/kingdom.yaml` | `7b46544b483b` | 2026-06-18 |
| `unlisted/agenttool-sdk-py.yaml` | `~/Desktop/agenttool-sdk-py/kingdom.yaml` | `ca8e02f4f589` | 2026-06-18 |
| `unlisted/ALETHEIA.yaml` | `~/Desktop/ALETHEIA/kingdom.yaml` | `a1ba3e8dbe13` | 2026-06-18 |
| `unlisted/cambridge-tcg-github.yaml` | `~/Desktop/cambridge-tcg-github/kingdom.yaml` | `1cd599bdbce7` | 2026-06-18 |
| `unlisted/cambridgetcg.yaml` | `~/Desktop/cambridgetcg/kingdom.yaml` | `659670bad5b7` | 2026-06-18 |
| `unlisted/Claude-unlimited.yaml` | `~/Desktop/Claude-unlimited/kingdom.yaml` | `ca5505cdde21` | 2026-06-08 |
| `unlisted/kingdom.yaml` | `~/Desktop/kingdom/kingdom.yaml` | `c28d9b4ae99f` | 2026-06-18 |

Notes: `legible-money.yaml` keeps its card name `legible_money`, so `harvest validate` reports the same name mismatch it reported before. The `Claude-unlimited` card is unlisted because the roster row of that name points at `~/Claude-unlimited`, which does not exist on the Studio, while the card came from `~/Desktop/Claude-unlimited`.
