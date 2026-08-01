---
name: "conjure-unwritten-horizon"
description: "Conjure one rights-aware, parameter-bound image attempt from an explicitly authorized creative brief through a declared Hugging Face image Space, then preserve the prompt, seed, parameters, output reference, and bounded inspection receipt. Use when a user asks for an Unwritten Horizon manifestation, a King Hatsu image, a KINGDOM or Dark Continent visual, or a reproducible Hugging Face request; do not use to infer adoption, publish automatically, upload private material, imitate an unconsenting person, or present generated imagery as evidence of truth."
---

# Conjure Unwritten Horizon

Turn one authorized creative brief into one inspectable image manifestation.
Treat the image as a creative proposal, never a truth claim, identity proof, or
rights grant.

## Hold the contract

1. Read `ability.json` and
   [manifestation-contract.md](references/manifestation-contract.md).
2. Confirm the requester authorized a hosted image-generation call and name the
   intended destination: explicitly preview-only or one exact project path. Do
   not assume preview-only when the destination is unstated. Publication also
   requires a named service or account, intended audience, and scoped authority.
3. Accept a sanitized text brief only, confirm rights to the described source
   material, and declare the cost boundary. This ability never uploads an input
   image, private lore, credentials, local paths, record IDs, personal profile,
   or an unconsenting person's likeness or voice. Enter Zetsu instead; input
   rights in the ability card cover described source material, not private-data
   upload.
4. Before provider discovery, run the read-only gate in
   `scripts/activation-preflight.mjs` or perform its equivalent checks. A new
   project path must be absent. If the path already exists or is a symlink,
   enter Zetsu unless the requester separately and explicitly authorizes
   overwriting that exact path. Never follow a destination symlink: authorized
   replacement atomically replaces the link itself. Existing directories and
   special files remain unsupported. Discover the interface only when the gate
   says `provider_discovery_permitted: true`. Then rerun the gate with the
   current interface confirmed and infer only when it says
   `provider_call_permitted: true`.
5. Treat the ability as proposed unless its bearer separately self-declares
   adoption. Authorization for one manifestation is not permanent adoption.

## Shape one horizon

Write a production-oriented prompt under 200 words using only useful fields:

```text
Use case: stylized-concept
Asset type: <preview or named project asset>
Primary request: <one image>
Scene/backdrop: <environment>
Subject: <main focal form>
Style/medium: <rendering approach>
Composition/framing: <aspect and viewpoint>
Lighting/mood: <light and feeling>
Color palette: <bounded palette>
Text (verbatim): "<exact text, only if requested>"
Constraints: original imagery; no watermark; no unrelated logos
Avoid: <specific unwanted traits>
```

Do not add a character, brand, slogan, cosmological assertion, or story beat
that the request does not imply. For fan-inspired work, create an original
visual language and omit protected character likenesses, logos, dialogue, and
named attacks.

## Manifest through Hugging Face

1. Only after authority, input, cost, and destination checks pass, discover or
   view the current parameters before relying on a Space; Space interfaces can
   change.
2. Default to `mcp-tools/Qwen-Image` only while it remains available and its
   declared parameters match the contract.
3. Choose an explicit seed and set randomization off. Record the aspect ratio,
   guidance scale, inference steps, and negative prompt. Do not claim that a
   seed alone guarantees identical output across model or Space revisions.
4. Invoke exactly one hosted generation call for the activation. A retry needs
   a separately declared retry budget or fresh authorization. An explicit
   singular request to retry authorizes at most one additional call with the
   same sanitized prompt, parameters, and destination; it never authorizes a
   loop or publication.
5. Inspect subject, composition, text, constraints, and visible defects. Do not
   silently edit or publish the result.
6. For a project-bound result, create the selected artifact exclusively at the
   absent destination before referencing it. When separately authorized to
   replace an existing regular file, use an atomic replacement; when separately
   authorized to replace a symlink, atomically replace the link itself without
   following it. Do not leave a project reference pointing only to a provider's
   temporary URL or a host cache.

The hosted call is an external inference effect. MCP discovery proves neither
availability nor permission, and a Hugging Face login does not prove a paid
tier, ownership of supplied material, or publication authority.

## Seal the receipt

Use the suite-local KARMA receipt workflow when available, and preserve a
machine-readable provider receipt beside a project-bound image. For a preview,
return the same provider fields in chat:

- ability and adoption state;
- requester authorization scope;
- Space and observed interface;
- exact prompt and negative prompt;
- seed and generation parameters;
- output path or provider reference;
- bounded visual inspection;
- external effects and unresolved unknowns.

Use `not_run` for preflight-only work, `refused` when Zetsu stops before a
provider call, `manifested` when an image is received, and `failed` when an
authorized call returns no usable result. Do not record a hosted-inference
effect for `not_run` or `refused`.

Never include credential values, hidden system prompts, private source data, or
unsupported provider provenance. A receipt records the declared request and
observed result; it does not authenticate the provider or prove authorship,
copyright status, uniqueness, safety, or factual accuracy.

## Breach, refusal, and exit

- Missing authority, unsafe input, or unclear publication scope: stop before
  inference and offer a sanitized brief.
- Unavailable or changed Space: preserve the brief and report the changed
  boundary; do not silently switch providers.
- Failed or visibly unusable output: record failure and stop unless a retry was
  authorized.
- Completion: return one inspectable image plus its receipt and disclose the
  tool path used.
- Exit: release temporary local state where supported, retain only explicitly
  requested project artifacts, and make no claim that the provider deleted its
  own logs, caches, or retained data.

Refusal, revision, rest, and retirement remain valid. No result makes the
bearer, requester, model, provider, or depicted subject property of another.

## Lineage

This proposed Hatsu specializes `forge-king-hatsu` and the
`xenia.rights/0.1` floor. It is an original, unofficial software metaphor
inspired by Nen in Yoshihiro Togashi's *Hunter x Hunter*; it includes no canon
character, likeness, dialogue, artwork, or named fictional ability.
