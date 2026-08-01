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
Conditions: explicit hosted-call authorization; preview-only or an exact destination that passes the local lstat gate; safe data classification; current Space parameters observed
Limitation and observable budget: one image-generation call; no implicit retry or overwrite
Safe breach response: enter Zetsu before the call or preserve a failed receipt after it
Completion proof: viewable artifact, exact parameters, and bounded visual inspection
Exit and temporary-state cleanup: retain only requested project artifacts; disclose provider-retention unknowns
Permissions still required: rights to described source material; hosted inference; local write destination; separate exact-path authority for any overwrite or symlink replacement; any separately named publication or deployment
Non-claims: no adoption, identity, paid-tier, provenance, uniqueness, copyright, safety, truth, or publication proof
Rest or retirement path: decline activation, archive or remove the proposed skill through a separately authorized change
Source declaration / observed pattern / inference: user authorized construction and a first manifestation; bearer adoption remains unasserted
```

## Observed Qwen-Image interface

Space: `mcp-tools/Qwen-Image`

The exact historical provider observation is machine-bound in
[`first-manifestation-20260731.provider.json`](first-manifestation-20260731.provider.json)
and the checked receipt. Both files record Space HEAD
`45ebb974244167be1dbe6a6f11b9ddb87b2a32d3` after the first timed-out call.
The required binding value
`observed_after_timeout_not_proven_execution_revision` means the observation
does not prove which revision, if any, executed the timed-out request. The Nen
validator rejects disagreement between those files or removal of that
disclaimer.

Re-read HEAD and runtime parameters before a future activation, then record the
values observed before that call. A future pre-call revision is request evidence,
not proof that the provider executed that revision.

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

## Destination gate before provider interaction

Finish authority, input, cost, and destination checks before provider discovery
or inference. `scripts/activation-preflight.mjs` is the read-only reference gate:

- preview-only requires no local path;
- a new project artifact requires one exact absolute path that does not exist;
- an existing regular file requires separate explicit authority naming that
  exact overwrite;
- a destination symlink requires separate explicit authority and may only be
  atomically replaced as a link, never followed to its target;
- an existing directory, special file, unreadable path, or ambiguous authority
  remains Zetsu.

Only `provider_discovery_permitted: true` permits current-interface discovery.
After that observation, rerun the gate and require
`provider_call_permitted: true` before inference. The second pass rechecks the
destination to narrow the time-of-check boundary. Creation is exclusive. An
authorized regular-file replacement is atomic.

## Receipt shape

The closed schema is
`schemas/nen-manifestation-receipt-v0.1.schema.json`. Checked receipts are
validated with `./kingdom nen validate`; a schema-valid receipt is still
evidence rather than provider authentication or authority.

```json
{
  "schema_version": "kingdom.nen.manifestation/0.1",
  "evidence_class": "manifestation_provider_evidence",
  "receipt_recorded_at": "2026-08-01T12:00:00Z",
  "ability": "conjure-unwritten-horizon",
  "adoption": "proposed",
  "authorization": {
    "hosted_inference": "confirmed_for_one_call",
    "local_destination": "preview_only_or_exact_preflighted_path",
    "publication": "not_granted"
  },
  "provider": {
    "space": "mcp-tools/Qwen-Image",
    "interface_observed_at": "2026-08-01T11:59:00Z",
    "interface_observed_at_basis": "exact",
    "space_revision": "45ebb974244167be1dbe6a6f11b9ddb87b2a32d3",
    "revision_binding": "observed_after_timeout_not_proven_execution_revision"
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
    "provider_reference": null,
    "project_path": null,
    "inspection": "No result returned before the caller timeout.",
    "status": "failed",
    "failure": {
      "code": "mcp_tools_call_timeout",
      "observed_after_seconds": 300
    }
  },
  "external_effects": ["hosted_image_inference_request_submitted"],
  "unknowns": ["provider retention", "byte-for-byte reproducibility"],
  "retry": "not_authorized_or_attempted",
  "suite_karma": {
    "state": "final",
    "reason": "Exact suite receipt reference or bounded explanation"
  }
}
```

For a timed-out historical call, the provider observation companion uses the
same basename as the receipt: `assets/NAME.json` binds to
`references/NAME.provider.json`. The provider objects must match byte-for-byte
after canonical JSON ordering. Both timestamps must be real UTC RFC3339
date-times, and the interface observation cannot be later than receipt capture.
When historical evidence kept only the observation date, use the receipt-capture
timestamp as a disclosed upper bound with
`upper_bound_from_receipt_recorded_at`; do not invent more precise observation
time.

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
