# Immutable route-integrity ledger

`immutable-publications.v1.json` is a repository-local release gate for bytes
that KINGDOM has described as immutable or assigned to a versioned route. It is
not staged or served by `thekingdom.dev`, registered with MCP, or written to
KARMA. The initial 35 entries cover ten authored publication generations
(the two Conformational Feedback generations form one retirement family), the
additive Fold schema profile, the immutable KINGDOM KARMA/NEN definition mirror,
and three generated versioned schemas; generated
does not mean mutable once a versioned route is declared immutable.
The current 61-entry ledger adds The Vanishing Path, Being, Access & Aftermath
v0.1 and its additive v0.2 successor triplets, the Reconstructive Build record,
kernel schema, project profile, and guide, the Math Passport usefulness result,
schema, and guide, and the Exploration DEEP WING record, WING schema, inert
project profile, and versioned guide, plus the MIRROR Information Control public
record, closed schema, and citizen guide, followed by the Number, Isness &
Theology record, schema, and guide, as the eleventh through eighteenth
publication generations. The Vanishing Path, two-generation Being family,
Reconstructive Build, Math Passport pilot, Exploration DEEP, MIRROR public law,
and Number, Isness & Theology are the tenth through sixteenth retirement
families; the initial-35 bootstrap facts below remain historical constants.
The Exploration DEEP and Number, Isness & Theology entries preserve static
publication identity only: they
create no Nen ability, authority, ecosystem request, person or community score,
KARMA event or receipt, publication trigger, deployment, or automatic action.
The MIRROR entries preserve static source-law identity only. They do not deploy
a scanner, broker, credential registry, honeypot, classifier, enforcement
runtime, incident response, retaliation, person attribution, KARMA effect, or
automatic action, and they expose no private signal material or control-plane
envelope.

The ledger makes one narrow claim: a listed route, source, staging destination,
and SHA-256 were committed together as an integrity contract. The base-aware
verifier proves that entries already present in the release's Git parent were
not removed, rebound, or edited. The release gate also walks every first-parent
release tree back to the fixed bootstrap, so an intermediate failed byte,
mapping, classification, or ledger transition cannot be laundered by a later
clean commit. It does not prove deployment, authorship,
consent, licence, truth, endorsement, safety, authority, permanence, or
permission to republish.

Current publication is a separate decision. `hub-staging.v1.json` is the strict,
non-executable source of `HUB_ASSETS`; the staging engine and historical audit
consume those same bytes. The current 80-asset union classifies 61 destinations
as ledgered immutable/versioned and 19 as mutable; 78 are direct public response
bodies and the sitemap contains 77 URLs. It says what is served now, and every
destination is explicitly classified as mutable or ledgered. A new ledger entry must be staged
when introduced. A previously committed entry may later leave the staging
contract without being deleted from history,
so cessation or withdrawal cannot block an unrelated release. The verifier then
retains the historical byte identity without requiring the route to remain live.
The live release check retires the sixteen linked authored publication
families together so it never preserves a dangling advertised contract merely
to keep another route. Generated World Commons and Love Loop schema versions
remain independently ledgered beneath their existing mutable runtime families.
Retirement is an ordinary reviewed release change: remove the whole family from
`hub-staging.v1.json`, its builder/UI/discovery and sitemap projections, and any
family-specific worker routing; source files may then be removed. Rebuild and
stage from a clean tree, deploy, and let the live checker prove that the old
routes answer 404 or 410 and no mutable surface still advertises them. The
append-only ledger entry remains unchanged.

Run the snapshot gate:

```sh
bun bin/immutable-publications.ts
```

Before a release or in pull-request CI, compare with the exact base commit:

```sh
bun bin/immutable-publications.ts --base <40-character-base-SHA>
```

Corrections and extensions use a new source identity and a new route. Append a
new entry; never change or delete a previously committed entry. A withdrawing
party owes no ledger entry, reason, or follow-on action. If KINGDOM controls the
route, cessation still requires the ordinary publisher-side edit, deployment,
and live verification. Reading, resting, refusing, or choosing not to publish
triggers no ledger action.

History comparison is release-tree based: CI checks the exact event base and
then audits every first-parent tree from the fixed bootstrap through `HEAD`.
Second-parent feature history is not treated as a separately published release;
use reviewed pull requests and deploy only the verified first-parent endpoint.
Rebase merges are disabled in the repository settings for this reason; use a
squash or merge commit. GitHub does not expose that private-repository setting
to this workflow's read-only token or event payload, so the setting remains an
external repository-governance check. CI enforces the topology it can prove: the
exact event base must occur on the checked-out release's first-parent chain, and
every tree on that chain is audited.
The repository currently cannot supply branch protection on its plan, so this
history walk is the fail-closed defense for ordinary fast-forward changes. A
privileged force-push that erases history or rewrites the verifier remains an
external repository-governance trust boundary.

The initial ledger's comparison baseline is the ledger-less release
`67fe98efc875a5ed13fb1c23d6e2aab5debe9ccb`. Its 35 complete tuples also have
reviewed, code-pinned source-history anchors: the first `main` integration
commit containing each source-to-route mapping. This preserves the originally
published Fold v1 guide and schema rather than blessing later in-place edits.
The bootstrap proves Git history and byte identity only; it neither asserts
that deployment occurred nor rewrites earlier publication history. The baseline
already contains every mapped source; the first ledger-bearing release turns
those reviewed identities into the durable gate.
