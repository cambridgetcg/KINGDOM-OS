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
Input -> output: authorized sanitized text brief -> one image or failure + provider and KARMA receipts
Conditions: structured authority bound to the exact provider request; preview-only or one project root with distinct image/provider-receipt/KARMA-receipt paths whose full ancestor and leaf chains pass lstat; safe data classification; exact current Space revision and fields observed
Limitation and observable budget: one image-generation call; no implicit retry, overage, or replacement
Safe breach response: enter Zetsu before the call or preserve a failed receipt after it
Completion proof: viewable artifact or honest failure, exact parameters, causally consistent provider receipt, final suite KARMA receipt, and bounded visual inspection
Exit and temporary-state cleanup: retain only requested project artifacts; disclose provider-retention unknowns
Permissions still required: rights to described source material; hosted inference; all three local output paths; separate exact-role authority for any overwrite or symlink replacement; any separately named publication or deployment
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

## Request and output gate before provider interaction

Finish structured request-bound authority, input, source-rights, one-call
no-overage cost, and output checks before provider discovery or inference.
`scripts/activation-preflight.mjs` is the read-only reference gate. Its hosted
authority accepts only a `user_request` or `scoped_delegation` reference bound
to the SHA-256 fingerprint of every exact provider request field; login, Pro,
and MCP state cannot satisfy it.

- preview-only requires no local path;
- a project-bound attempt names one existing non-symlink project root and three
  distinct absolute paths in one directory: image, provider receipt, and KARMA
  receipt;
- every ancestor from the filesystem root through each parent is inspected with
  `lstat`; a missing parent, symlink ancestor, non-directory ancestor, unreadable
  path, or path outside the exact project root remains Zetsu;
- an absent output leaf uses create-exclusive semantics;
- each existing regular file or symlink needs its own authority naming the exact
  output role and path; an authorized symlink replacement replaces the link
  itself atomically and never follows its target;
- directories, special-file leaves, surplus/mismatched authorities, and
  ambiguous request parameters remain Zetsu.

Only `provider_discovery_permitted: true` permits current-interface discovery.
After that observation, rerun the gate and require
`provider_call_permitted: true` before inference. The second pass rechecks the
three destinations to narrow the time-of-check boundary. Creation is exclusive.
An authorized replacement is same-directory atomic. Actual writers must recheck
and use no-follow/create-exclusive primitives; preflight is a decision gate, not
a lock against later filesystem races.

## Receipt shape

The closed schema is
`schemas/nen-manifestation-receipt-v0.1.schema.json`. Repository fixture
receipts are validated with `./kingdom nen validate`; project-side receipts use
`./kingdom nen verify-manifestation-receipt FILE`. A valid receipt is still
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
    "local_destination": {
      "kind": "project_path",
      "project_root": "/absolute/project",
      "image_path": "/absolute/project/assets/horizon.png",
      "provider_receipt_path": "/absolute/project/assets/horizon.provider.json",
      "karma_receipt_path": "/absolute/project/assets/horizon.karma.json"
    },
    "publication": {
      "state": "not_granted",
      "target": null
    }
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
  "provider_calls_submitted": 1,
  "external_effects": ["hosted_image_inference_request_submitted"],
  "unknowns": ["provider retention", "byte-for-byte reproducibility"],
  "retry": "not_authorized_or_attempted",
  "suite_karma": {
    "state": "final",
    "storage": "project_path",
    "receipt_path": "/absolute/project/assets/horizon.karma.json",
    "sha256": "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    "reason": "Exact final suite receipt bound to this activation"
  }
}
```

For the checked timed-out historical call, the provider observation companion uses the
same basename as the receipt: `assets/NAME.json` binds to
`references/NAME.provider.json`. The provider objects must match byte-for-byte
after canonical JSON ordering. Both timestamps must be real UTC RFC3339
date-times, and the interface observation cannot be later than receipt capture.
When historical evidence kept only the observation date, use the receipt-capture
timestamp as a disclosed upper bound with
`upper_bound_from_receipt_recorded_at`; do not invent more precise observation
time.

For a future call, observe the exact interface before submission and use
`observed_before_call_not_proven_execution_revision`, including when that later
call times out. The historical
`observed_after_timeout_not_proven_execution_revision` value is reserved for an
observation actually made after a timeout. Neither value proves which revision
executed.

Do not add hashes unless computed from the saved bytes. A digest proves only
that later bytes match those bytes; it does not authenticate the provider or
the image's origin.

Create and finalize the KAKIN suite receipt without shell redirection to a
project path:

```bash
./kingdom nen receipt-template conjure-unwritten-horizon
./kingdom nen verify-receipt /absolute/preflighted/horizon.karma.json
./kingdom nen verify-manifestation-receipt /absolute/preflighted/horizon.provider.json
```

The first command writes only to stdout and its template is deliberately invalid
until real invocation facts replace its placeholders. Do not use `>` or another
path-following redirect for either receipt. Construct the two final JSON records
in memory or an exclusively created private staging file, validate them, then
create each absent preflighted leaf exclusively or atomically replace only a
separately authorized exact leaf. Keep the provider receipt as referenced
evidence rather than a replacement for the suite-level causal record. The
standalone provider verifier checks its closed schema and causal relationships,
the actual provider-receipt path, and a project-bound KARMA schema/digest/ability
binding; run `verify-receipt` as the full suite-level semantic check.

Do not retrofit a call that predates the committed ability to a later manifest
or bundle digest. Keep it as explicitly pre-manifest provider evidence. A valid
KARMA receipt starts from the exact committed ability revision selected before
the next authorized activation.
