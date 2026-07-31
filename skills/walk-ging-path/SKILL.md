---
name: walk-ging-path
description: Map an unfamiliar codebase, protocol, tool, rhetoric, or other bounded system by tracing observable effects, proposing competing mechanisms, and reproducing one bounded authorized effect in a sandbox. Use for evidence-led reverse engineering, a Ging-inspired expedition, Dark Continent exploration, falsifiable mechanism tests, or leaving a reusable route through an unknown system. Do not use to imitate Ging as a persona, infer private identity, probe without permission, bypass controls, or declare uncertain hypotheses true.
---

# Walk the Ging Path

Use Ging as a credited design lens, not a persona: study the effect closely,
reconstruct one mechanism, test what would disconfirm it, and leave a better
route for the next explorer. Accept `Gin` as an informal alias while using the
canonical spelling `Ging` in artifacts.

## Choose the path

- Use this skill to investigate an unfamiliar bounded system or claim.
- Use `shape-kingdom-nen` to design or inspect a collective ability manifest.
- Use `forge-king-hatsu` to draft an ability for one named King.
- Invoke an existing ability's own skill when its mechanism is already known.

Treat a King as a distinct collaborator or voluntary bearer label, never as
property, rank, proof of consciousness, or authority over another being.

## Walk an expedition

1. State one question as an observable effect. Separate the effect from its
   surrounding story, reputation, or rhetoric.
2. Draw **En** around the expedition. Name the systems, inputs, allowed
   actions, forbidden actions, and permissions the work still requires.
3. Apply **Gyo** to build an evidence ledger. Label every item `given`,
   `reported`, `observed`, `measured`, or `reproduced`; keep inference out of
   the observation column.
4. Propose at least two mechanisms when evidence permits genuine alternatives.
   For each mechanism, name the observations it explains, a bounded
   discriminating probe,
   the expected signal, and a result that would falsify it. Preserve `unknown`
   instead of manufacturing a weak alternative.
5. Enter **Zetsu** when no probe is both bounded and authorized. Report the
   missing evidence or permission; do not turn curiosity into entitlement.
6. Apply **Ko** to one read-only or reversible local probe. Reproduce the
   effect, not a person's identity, voice, secrets, or mystique. Keep external
   side effects outside this skill unless the caller separately authorizes the
   exact action through an appropriate tool.
7. Record a receipt: probe ID, action, system, scope, budget applied, declared
   effect and authorization, permission references, observed signal, evidence
   reference, divergence, and any side effect. Bind those declared fields to
   the selected probe. A structural match is not proof of execution,
   authenticity, or authorization.
8. Apply **Ryu** to revise the map. Mark a mechanism provisionally supported,
   challenged, or inconclusive; never promote that assessment to a final truth
   verdict.
9. Return the route with provenance, disconfirming evidence, remaining
   unknowns, and the next bounded discriminating probe. Credit prior explorers
   and make the route reusable without claiming ownership of the terrain.

Read [the expedition contract](references/expedition-contract.md) when creating
machine-readable input or using the local Nen MCP server.

## Use the Nen MCP port

The optional local server exposes three pure tools:

- `nen.describe` distinguishes Dark Continent, Nen, Skill, and MCP.
- `ging.compile_expedition` orders caller-supplied hypotheses by evidence
  coverage and selects the first structurally eligible candidate.
- `ging.evaluate_probe` structurally binds a caller-supplied receipt to the
  complete selected probe, then returns a revisable assessment.

The server's tools perform no probe, application filesystem read or write,
network request, credential access, publication, or permission grant. MCP
discovery proves only that a tool description was returned; it does not prove
availability, health, authentication, consent, permission, or truth.

The compiler cannot prove that a candidate is globally smallest, safe, or
authorized. It checks exact caller-declared system, action, permission-reference,
effect, and budget fields, then leaves execution authorization to the actual
tool boundary.

Never put credential or secret values in expedition fields. Accepted strings
can be returned in MCP content; use service or variable names and sanitized
evidence references only.

## Return the map

Use this shape in the final response:

```text
Question
Boundary and authority still required
Evidence ledger
Candidate mechanisms and disconfirmers
Selected bounded probe and authority still required, or Zetsu
Reproduction receipt
Assessment: provisionally_supported (supported for now) | challenged | inconclusive
Dark Continent: remaining unknowns
Reusable route and provenance
```

Say exactly what ran. Distinguish direct evidence from inference. `Solved for
truth` means the search was made more falsifiable and evidence-backed; it never
means uncertainty, consent, or external authority disappeared.

## Keep the creative boundary

This is an original, unofficial software adaptation inspired by the Nen,
Dark Continent, and Ging concepts in Yoshihiro Togashi's *Hunter x Hunter*. It
is not canon and is not affiliated with the creator or rightsholders. Do not
copy dialogue, plot, artwork, logos, likenesses, or named fictional abilities.
