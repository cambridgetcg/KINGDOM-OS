# Ging expedition contract

Use this contract when calling `ging.compile_expedition`. The tool plans a
probe from caller-supplied data; it does not execute the probe or verify a
permission declaration.

Never include credential or secret values. Valid caller strings can be returned
verbatim; use a service or variable name and a sanitized evidence reference.

```json
{
  "question": "Which mechanism turns one framed request into one reply?",
  "boundary": {
    "systems": ["local toy responder fixture"],
    "allowed_actions": ["send one request to the local fixture"],
    "forbidden_actions": ["connect to a private or remote service"],
    "required_permissions": ["caller authorization for the named fixture"]
  },
  "observations": [
    {
      "id": "obs-framing",
      "statement": "Each captured request ends with one newline.",
      "kind": "observed",
      "evidence_ref": "fixture/transcript.txt:1"
    }
  ],
  "hypotheses": [
    {
      "id": "line-frame",
      "mechanism": "A newline terminates each request frame.",
      "explains": ["obs-framing"],
      "probe": {
        "action": "send one request to the local fixture",
        "system": "local toy responder fixture",
        "scope": "one disposable local process",
        "budget": {
          "unit": "requests",
          "limit": 1
        },
        "effect": "reversible_local",
        "authorization": "caller_declared",
        "permission_refs": ["caller authorization for the named fixture"],
        "expected_signal": "one reply appears after the newline",
        "falsifies_if": "the same reply appears before any newline"
      }
    }
  ],
  "unknowns": ["whether empty frames are accepted"]
}
```

Rules:

- IDs are lower-case slugs and unique within their collection.
- `explains` contains observation IDs, not free-form confidence scores.
- `systems`, `allowed_actions`, and `required_permissions` are exact declared
  boundaries. A forbidden action wins a conflict.
- A probe declares one system, an observable budget, and permission references
  from that boundary.
- Only `read_only` and `reversible_local` probes can be selected.
- `caller_declared` records the caller's declaration. It is not credential or
  authorization verification.
- The compiler selects a structurally eligible candidate; it cannot prove that
  the candidate is globally minimal, safe, or authorized to execute.
- Evidence kinds remain distinct:
  - `given` is an explicit task input or premise, not independently checked;
  - `reported` is an attributed claim from another source;
  - `observed` is a directly inspected qualitative signal;
  - `measured` is a directly recorded quantitative signal;
  - `reproduced` is an effect repeated through the recorded procedure.
- A result ranks coverage, not beings, personalities, worth, or certainty.

After an authorized tool or human runs the probe, call `ging.evaluate_probe`:

```json
{
  "selected_probe": {
    "id": "line-frame-probe",
    "hypothesis_id": "line-frame",
    "action": "send one request to the local fixture",
    "system": "local toy responder fixture",
    "scope": "one disposable local process",
    "budget": {
      "unit": "requests",
      "limit": 1
    },
    "effect": "reversible_local",
    "authorization": "caller_declared",
    "permission_refs": ["caller authorization for the named fixture"],
    "expected_signal": "one reply appears after the newline",
    "falsifies_if": "the same reply appears before any newline"
  },
  "receipt": {
    "probe_id": "line-frame-probe",
    "action": "send one request to the local fixture",
    "system": "local toy responder fixture",
    "scope": "one disposable local process",
    "budget": {
      "unit": "requests",
      "limit": 1
    },
    "effect": "reversible_local",
    "authorization": "caller_declared",
    "permission_refs": ["caller authorization for the named fixture"],
    "observed_signal": "one reply appeared after the newline",
    "relation": "matches_expected",
    "evidence_ref": "fixture/run-01.json",
    "divergence": "none observed",
    "side_effects": "none_reported"
  }
}
```

The evaluator requires the receipt's probe ID, action, system, scope, budget,
effect, authorization declaration, and permission references to match the
selected probe exactly. That check binds declarations, not reality: the
assessment remains provisional, and the evaluator does not authenticate the
receipt or prove the probe ran. `none_reported` means no side effect was
reported in this receipt; it is not a universal guarantee that none occurred.
