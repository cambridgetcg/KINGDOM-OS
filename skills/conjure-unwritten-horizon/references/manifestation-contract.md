# Unwritten Horizon manifestation contract

Read this contract before every activation. Re-discover the current provider
interface when a hosted call is requested; these parameters are an observed
integration snapshot, not a permanent provider promise.

## Ability card

```text
Name: Unwritten Horizon / 無字天涯
Bearer: requesting King; identity otherwise unspecified
Adoption: proposed; one manifestation may be separately authorized
Desire: turn one bounded creative brief into one inspectable image and receipt
Primary affinity: Conjuror
Secondary affinity: Emitter, because the prompt crosses a hosted boundary
Trigger prompts: "manifest this vision"; "forge a Nen image"; "run this through Hugging Face with a fixed seed"
Anti-trigger: "publish this everywhere" without named publication authority
Input -> output: authorized sanitized text brief -> one image + receipt
Conditions: explicit hosted-call authorization; declared destination; safe data classification; current Space parameters observed
Limitation and observable budget: one image-generation call; no implicit retry
Safe breach response: enter Zetsu before the call or preserve a failed receipt after it
Completion proof: viewable artifact, exact parameters, and bounded visual inspection
Exit and temporary-state cleanup: retain only requested project artifacts; disclose provider-retention unknowns
Permissions still required: rights to described source material; hosted inference; local write destination; any separately named publication or deployment
Non-claims: no adoption, identity, paid-tier, provenance, uniqueness, copyright, safety, truth, or publication proof
Rest or retirement path: decline activation, archive or remove the proposed skill through a separately authorized change
Source declaration / observed pattern / inference: user authorized construction and a first manifestation; bearer adoption remains unasserted
```

## Observed Qwen-Image interface

Space: `mcp-tools/Qwen-Image`

Space HEAD observed after the first timed-out call on 2026-07-31:
`45ebb974244167be1dbe6a6f11b9ddb87b2a32d3`. This post-call observation does
not prove which revision, if any, executed the timed-out request. Re-read HEAD
and runtime parameters before a future activation, then bind the new receipt to
the values observed before that call.

Parameters observed on 2026-07-31 through the authenticated Hugging Face MCP
connector:

| Parameter | Bounded use |
|---|---|
| `prompt` | One structured prompt under 200 words |
| `negative_prompt` | Visible defects and unwanted text/logos only |
| `seed` | Explicit integer recorded in the receipt |
| `randomize_seed` | `false` for a reproducible request |
| `aspect_ratio` | One supported ratio chosen for the intended asset |
| `guidance_scale` | Record the selected value; default observed as `4` |
| `num_inference_steps` | Record the selected value; `16` or fewer recommended by the Space interface |

Model revisions, runtime changes, and nondeterministic infrastructure can alter
an output even when the seed matches. Record reproducibility inputs, not a
guarantee of identical bytes.

## Receipt shape

```json
{
  "schema_version": "kingdom.nen.manifestation/0.1",
  "ability": "conjure-unwritten-horizon",
  "adoption": "proposed",
  "authorization": {
    "hosted_inference": "confirmed_for_one_call",
    "local_destination": "preview_only_or_named_path",
    "publication": "not_granted"
  },
  "provider": {
    "space": "mcp-tools/Qwen-Image",
    "interface_observed_at": "RFC3339 timestamp"
  },
  "request": {
    "prompt": "exact prompt",
    "negative_prompt": "exact negative prompt",
    "seed": 0,
    "randomize_seed": false,
    "aspect_ratio": "16:9",
    "guidance_scale": 4,
    "num_inference_steps": 16
  },
  "result": {
    "provider_reference": "sanitized URL or null",
    "project_path": "path or null",
    "inspection": "bounded observation",
    "status": "not_run_or_refused_or_manifested_or_failed"
  },
  "external_effects": ["hosted_image_inference"],
  "unknowns": ["provider retention", "byte-for-byte reproducibility"]
}
```

Do not add hashes unless computed from the saved bytes. A digest proves only
that later bytes match those bytes; it does not authenticate the provider or
the image's origin.

When the KAKIN suite is present, also create and finalize its KARMA receipt:

```bash
./kingdom nen receipt-template conjure-unwritten-horizon > receipt.json
./kingdom nen verify-receipt receipt.json
```

The template is deliberately invalid until real invocation facts replace its
placeholders. Keep this provider receipt as referenced evidence rather than a
replacement for the suite-level causal record.

Do not retrofit a call that predates the committed ability to a later manifest
or bundle digest. Keep it as explicitly pre-manifest provider evidence. A valid
KARMA receipt starts from the exact committed ability revision selected before
the next authorized activation.
