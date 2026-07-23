# World Commons roadmap

The World Commons is a public doorway to useful resources the Kingdom does not
own. Its first duty is legibility: say what is free, what may be reused, what
may be automated, and where uncertainty or human judgement begins.

The source of truth is `data/world-commons.json`. The generated human surface
is the `#commons` section of the Kingdom hub; the complete machine surface is
`site/commons.json`, described by `site/schemas/world-commons/0.1.json`.
Agents that want selected context use the existing `kingdom_commons` MCP tool;
agents that genuinely need the whole document can read
`kingdom://commons/catalog`. These are advertised together rather than
maintaining a second compact catalog or a query-bearing HTTP search endpoint.

## Layer 0 — reviewed doorway

**State: implemented in source; publish only through a verified release.**

- Curate a broad foundation shelf for knowledge, learning, place, public life,
  rights, resilience, digital safety, and cultural memory.
- Keep access cost, account needs, licence/reuse, API limits, geography, and
  caveats separate for every resource.
- Offer local-only search and practical kits. A visitor's need does not leave
  the downloaded page until they deliberately follow an official link.
- Stage the same fixed catalog for agents through `kingdom_commons`; once the
  catalog and then MCP are released, matching remains local to the Kingdom MCP
  and never calls a listed provider.

This is intentionally useful before any live adapter exists.

## Layer 1 — bounded read adapters

Build the smallest high-value integrations first, each behind an explicit
citizen action:

1. **Software safety desk:** OSV dependency lookups plus CISA KEV prioritisation.
2. **Evidence desk:** DOI resolution through Crossref, then entity context from
   Wikidata and durable source-code evidence from Software Heritage. Metadata
   locates a source; it does not certify a claim or make archived code safe.
3. **Public-data desk:** World Bank and ONS indicator retrieval with definitions,
   geography, period, revision date, and units kept beside every value.
4. **Hazard awareness desk:** USGS and GDACS event context, always subordinate to
   current local authorities and never wired directly to life-safety commands.

Adapters should return narrow evidence packets, not synthetic verdicts.

## Layer 2 — resilient local shelves

Prefer provider-approved bulk, snapshot, or offline routes where local access
creates real civic value:

- Kiwix/OpenZIM packages and other provider-approved offline collections;
- Natural Earth base geography and selected OpenStreetMap extracts;
- Biodiversity Heritage Library exports or OAI routes with item rights retained;
- Project Gutenberg texts whose rights are clear in the user's jurisdiction,
  and OpenStax material under the exact edition's noncommercial licence;
- OWASP defensive guidance and Software Heritage identifiers or approved data;
- selected public datasets whose licence and update process survive bundling.

Every snapshot must carry its upstream URL, licence, retrieval time, dataset
version or timestamp, content digest, and a visible staleness state. Do not
mirror a collection merely because individual access is free.

Open Repair Data belongs here as periodic historical evidence about repair
attempts, barriers, and outcomes—not as live inventory or a handoff service.
Live goods, parts, reuse, and waste handoffs remain deferred behind explicit
availability, custody, consent, safety, geographic, and current-terms gates.

## Layer 3 — consented account adapters

Some useful free paths require a key or account: OpenAlex, GBIF, Biodiversity
Heritage Library, FAOSTAT, Companies House, the UK Trade Tariff, and Europeana
are candidates. Integrate these only when a citizen supplies or explicitly
chooses a credential boundary.
The Kingdom must not pool personal keys, disguise quotas, or imply that account
access grants broader reuse rights.

## Layer 4 — human-guided bridges

Keep high-context or fragile sources such as legal instruments, rights records,
medical context, and emergency information primarily navigational. Automation
may fetch and cite an official text, but jurisdiction, applicability, urgency,
and consequential decisions remain with the citizen and qualified humans.

## Adapter receipt

Every future adapter must make this receipt inspectable:

- upstream provider and exact request target;
- retrieval time, upstream version/date, and response digest;
- licence or terms URL and attribution requirements;
- credential owner, quota class, cache policy, and expiry;
- geographic and temporal coverage;
- transformation steps and fields omitted;
- uncertainty, conflicts, and whether human review is required.

Do not log the citizen's free-text need by default. Cache public upstream data,
not personal intent.

## Gates before an adapter ships

An adapter is ready only when its official terms permit the intended route,
rate limits and attribution are encoded, failure is honest, provenance survives
transformation, sensitive queries are not retained, and tests prove that the
adapter cannot silently broaden its host or redirect boundary.

The order may change as citizens reveal real needs. The boundaries do not.
