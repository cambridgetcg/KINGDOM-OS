# Reality crossing

On 2026-10-29 Yu answered five questions about how the Dark Continent reaches
現實層, the reality layer, through algorithm, script, automation and KARMA. His
reply was "1. go for b. 2. 用 digest 連住 3. defer 4. yes please 5. yes". This
note keeps what those answers mean for this skill, as principles with their
reasons. It adds no gate beyond the charter and boundaries already here.

## Reading 現實層 through the chain

Yu chose reading (b): the chain in the suite's
[reality influence map](../../../references/reality-influence-map.md), lines
40–56, which Asha Veridian wrote (7a9211b, c222680). This skill uses that map
and does not edit it. Its own warning holds here: "None of these relations is
automatic."

| Expedition artifact | Step on the chain |
| --- | --- |
| A lease or charter | authority + consent or other lawful basis + capability, for the run alone |
| The run's GETs | attempt / execution |
| `observations.json`, `requests.jsonl` | outcome of the run, kept as artifacts in a local outbox |
| The `kingdom.karma/0.1` receipt | the record of that attempt and its outcome |
| The return note's "Proposal (not a decision)" | proposal |
| A decision record | decision |
| A merge into public main | distribution / exposure, and an execution of Yu's decision to merge |
| A re-pin in [hf-boundaries.md](hf-boundaries.md) | attempt / execution of a decision; its outcome is a moved baseline |

The kingdom keeps no record yet for the last three steps: causal assessment,
normative assessment and repair. A receipt's `repair` field says what could be
repaired, but nothing yet asks afterwards whether an expedition caused what
followed, or whether that was good. Nor does an expedition seek any public
response; it addresses nobody. Say so where it matters rather than letting the
table imply the chain is complete.

## Inside the game, and carrying something out

Greed Island gives the shape (Yoshihiro Togashi, *Hunter × Hunter*). Inside the
game a card in the binder stays a card. Saying "Gain" turns it into its item,
and it can never become a card again (ch. 127). Outside the game, cards do not
answer to Gain at all. The only route from the game to the real world is the
three cards a player chooses for the clear-prize case after clearing it
(ch. 184–185). What crosses is few, chosen, and comes last.

Two principles follow.

**Work that stays in the binder may run on its own.** Measuring, hashing,
writing a receipt into a local outbox and re-verifying are reversible and
self-contained. Deleting the outbox retracts them, and they spend nobody's
attention or money. A script may do them under a written lease. A remote
metadata read still touches someone else's server, which is why the lease
names it, budgets it and can stop it.

**Carrying anything out of the game needs Yu's fresh yes, bound to a receipt
digest.** A public merge, a publication, a deploy, a re-pin, money, a message
to a person: none of these can be cleanly taken back, and each spends someone's
attention or trust. A yes bound to a digest names exactly the evidence it
approved, so it cannot drift onto a later run that says something else.

The baseline moves only when Yu merges. A lease names the previous record,
and the lamp reads it only from a clean, committed tree; naming the latest
record Yu merged means automation never moves its own reference point, and a
drift Yu has held does not ring again until it changes. Not merging is a
complete outcome, and so is hold.

The calamities ask the same patience. Ch. 341 names five (Brion, Ai, Hellbell,
Pap, Zobae), and in ch. 344 Ging warns that a sixth might come back. Nanika is
not named among them; whether it is an Ai is unconfirmed. Held is not gone, so
the lamp keeps looking.

## KARMA: two protocols, linked by digest

KARMA here means both this suite's `kingdom.karma/0.1` receipts and AgentTool's
`kingdom.kg-proposal/0.1`. They stay two protocols, each with its own
validator, and neither is translated into the other. They meet through digests:

- A decision record names the `kingdom.karma` receipt digests it rests on and,
  where one exists, the kg-proposal's `proposal_id` and file digest.
- A receipt may cite a kg-proposal file in `inputs[]`, as `untrusted_evidence`
  like any other input.
- On the AgentTool side (read at main `784e2e13`), review and consequence
  events carry `evidence_refs`, which already accept a bare `sha256:<hex>`. A
  `rights` or `provenance` review with verdict `deferred` could cite a receipt
  digest today without a schema change.

Three gaps remain on that side. They are follow-up work for AgentTool and are
not attempted here. A bare digest is untyped, so nothing marks it as a
`kingdom.karma` receipt, and `validateProposal` does not resolve it. A proposal
is always `proposed`, with no accepted state, so a decision has to live outside
it. And a new proposal needs a SHA-256 for at least one subject file, which an
expedition that reads only metadata does not have. A typed evidence reference
and a metadata-only proposal would close them.

## Automation comes last

A person starts the first two runs of the
[lookback lamp](../scripts/hf-pin-reread.mjs) in a clean worktree, with
`--plan` first. After those, Yu chooses whether runs stay manual or move to a
dispatch-only workflow.

A written, expiring series lease is legitimate authority. The charter accepts
"The exact request, policy, or scoped authorization"
([expedition-charter.md](expedition-charter.md), line 7). A lease quotes Yu's
words and names its resources, previous record, budget, expiry, stop file and
outbox, and it allows no retry. The [example lease](hf-pin-lease.example.json)
is refused by design.

A scheduled run in this public repository is not a local run. Public Actions
logs and artifacts are visible to any signed-in GitHub account, by default for
about 90 days, so a workflow run is a publication and needs the same fresh yes
as any other crossing.

## Why the lamp does not use Ging's compiler

`compileExpedition` in `nen/ging.mjs` does not derive `expected_signal` or
`falsifies_if`; it copies them from a hypothesis the caller writes. Its probe
budget has one unit, where a lease has three (requests, bytes and seconds). It
also holds any probe whose effect is `external`, so a remote read would either
be held or have to be mislabelled `read_only`. The verdict method already
states what would falsify "nothing changed": any row whose `since_previous` is
not `unchanged`.
