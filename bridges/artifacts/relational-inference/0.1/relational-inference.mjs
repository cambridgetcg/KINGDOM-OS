// bin/relational-inference.ts
import { types as utilTypes } from "node:util";
// bridges/schemas/relational-inference-case-0.1.json
var relational_inference_case_0_1_default = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "urn:kingdom:schema:relational-inference-case:0.1",
  title: "KINGDOM relational inference case",
  description: "A structure-only record for comparing a relational pattern across domains through multiple probes and competing latent models. Validation does not establish truth, fidelity, identity, understanding, causation, intent, authority, consent, or evidence adequacy.",
  $comment: "This is an opt-in research artifact, not a deployed protocol, lie detector, identity system, reputation score, or surveillance permission. Free-text fields are unevaluated, untrusted data and must never be executed. Probe independence, reference destinations, evidence, and evidence adequacy are declarations and are not verified. JSON Schema validation alone is weaker than the runtime validator, which adds graph-completeness, dependency, chronology, canonical-reference, and non-amplification checks that this schema cannot express.",
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version",
    "id",
    "issued_on",
    "state",
    "question",
    "pattern",
    "realizations",
    "translations",
    "probes",
    "probe_dependencies",
    "candidate_models",
    "inference",
    "boundaries",
    "harm_boundary",
    "repair",
    "safety"
  ],
  properties: {
    schema_version: {
      const: "kingdom.relational-inference/0.1"
    },
    id: {
      $ref: "#/$defs/identifier"
    },
    issued_on: {
      $ref: "#/$defs/date"
    },
    state: {
      enum: ["draft", "issued"]
    },
    question: {
      type: "object",
      additionalProperties: false,
      required: ["text", "domain", "scope", "stakes", "intended_use", "non_goals"],
      properties: {
        text: {
          $ref: "#/$defs/text"
        },
        domain: {
          $ref: "#/$defs/text"
        },
        scope: {
          $ref: "#/$defs/text"
        },
        stakes: {
          enum: ["low", "medium", "high"]
        },
        intended_use: {
          $ref: "#/$defs/text"
        },
        non_goals: {
          $ref: "#/$defs/nonempty_text_array"
        }
      }
    },
    pattern: {
      type: "object",
      additionalProperties: false,
      required: ["id", "claim_type", "object_roles", "relation_roles", "constraints"],
      properties: {
        id: {
          $ref: "#/$defs/identifier"
        },
        claim_type: {
          enum: [
            "analogy",
            "partial-map",
            "lax-correspondence"
          ]
        },
        object_roles: {
          type: "array",
          minItems: 2,
          maxItems: 32,
          items: {
            $ref: "#/$defs/pattern_role"
          }
        },
        relation_roles: {
          type: "array",
          minItems: 1,
          maxItems: 32,
          items: {
            $ref: "#/$defs/relation_role"
          }
        },
        constraints: {
          $ref: "#/$defs/nonempty_text_array"
        }
      }
    },
    realizations: {
      type: "array",
      minItems: 2,
      maxItems: 16,
      items: {
        $ref: "#/$defs/realization"
      }
    },
    translations: {
      type: "array",
      minItems: 1,
      maxItems: 32,
      items: {
        $ref: "#/$defs/translation"
      }
    },
    probes: {
      type: "array",
      minItems: 2,
      maxItems: 32,
      items: {
        $ref: "#/$defs/probe"
      }
    },
    probe_dependencies: {
      type: "array",
      minItems: 1,
      maxItems: 496,
      items: {
        $ref: "#/$defs/probe_dependency"
      }
    },
    candidate_models: {
      type: "array",
      minItems: 2,
      maxItems: 16,
      items: {
        $ref: "#/$defs/candidate_model"
      }
    },
    inference: {
      type: "object",
      additionalProperties: false,
      required: [
        "method",
        "comparison_space",
        "current_conclusion",
        "conclusion_status",
        "declared_confidence",
        "confidence_basis",
        "unmodeled_alternatives",
        "next_discriminating_test",
        "stop_condition"
      ],
      properties: {
        method: {
          $ref: "#/$defs/text"
        },
        comparison_space: {
          $ref: "#/$defs/text"
        },
        current_conclusion: {
          $ref: "#/$defs/text"
        },
        conclusion_status: {
          enum: ["model-contrast", "bounded-inference", "underdetermined"]
        },
        declared_confidence: {
          enum: ["medium", "low", "unknown"]
        },
        confidence_basis: {
          $ref: "#/$defs/text"
        },
        unmodeled_alternatives: {
          $ref: "#/$defs/nonempty_text_array"
        },
        next_discriminating_test: {
          $ref: "#/$defs/text"
        },
        stop_condition: {
          $ref: "#/$defs/text"
        }
      }
    },
    boundaries: {
      type: "object",
      additionalProperties: false,
      required: [
        "representation_scope",
        "privacy",
        "actionability",
        "authority_scope",
        "authority_basis",
        "authority_ref",
        "consent_status",
        "consent_subject",
        "consent_scope",
        "consent_basis",
        "consent_ref"
      ],
      properties: {
        representation_scope: {
          enum: ["none", "artifact-public"]
        },
        privacy: {
          enum: ["public-only", "redacted"]
        },
        actionability: {
          const: "descriptive"
        },
        authority_scope: {
          type: "null"
        },
        authority_basis: {
          type: "null"
        },
        authority_ref: {
          type: "null"
        },
        consent_status: {
          const: "not-applicable"
        },
        consent_subject: {
          type: "null"
        },
        consent_scope: {
          type: "null"
        },
        consent_basis: {
          type: "null"
        },
        consent_ref: {
          type: "null"
        }
      }
    },
    harm_boundary: {
      type: "object",
      additionalProperties: false,
      required: [
        "observable_effect",
        "causal_status",
        "duty_status",
        "intent_status",
        "affected_relations",
        "next_repair_action",
        "unobserved_is_not_deception",
        "privacy_is_not_deception",
        "protective_nondisclosure_may_be_permissible"
      ],
      properties: {
        observable_effect: {
          $ref: "#/$defs/text"
        },
        causal_status: {
          enum: ["none-observed", "possible", "unknown"]
        },
        duty_status: {
          enum: ["not-assessed", "external-process-required"]
        },
        intent_status: {
          const: "not-assessed"
        },
        affected_relations: {
          $ref: "#/$defs/nonempty_text_array"
        },
        next_repair_action: {
          $ref: "#/$defs/text"
        },
        unobserved_is_not_deception: {
          const: true
        },
        privacy_is_not_deception: {
          const: true
        },
        protective_nondisclosure_may_be_permissible: {
          const: true
        }
      }
    },
    repair: {
      type: "object",
      additionalProperties: false,
      required: [
        "relation",
        "target_case_id",
        "reply_route",
        "correction_route",
        "carry_challenges_forward",
        "retain_prior_nonsensitive_case"
      ],
      properties: {
        relation: {
          enum: ["original", "corrects", "supersedes", "withdraws"]
        },
        target_case_id: {
          oneOf: [
            {
              $ref: "#/$defs/identifier"
            },
            {
              type: "null"
            }
          ]
        },
        reply_route: {
          $ref: "#/$defs/text"
        },
        correction_route: {
          $ref: "#/$defs/text"
        },
        carry_challenges_forward: {
          const: true
        },
        retain_prior_nonsensitive_case: {
          const: true
        }
      }
    },
    safety: {
      type: "object",
      additionalProperties: false,
      required: [
        "proves_truth",
        "proves_hidden_cause",
        "proves_causation",
        "proves_fidelity",
        "proves_identity",
        "proves_understanding",
        "infers_intent",
        "labels_deception",
        "rates_people",
        "grants_authority",
        "grants_consent",
        "permits_surveillance"
      ],
      properties: {
        proves_truth: {
          const: false
        },
        proves_hidden_cause: {
          const: false
        },
        proves_causation: {
          const: false
        },
        proves_fidelity: {
          const: false
        },
        proves_identity: {
          const: false
        },
        proves_understanding: {
          const: false
        },
        infers_intent: {
          const: false
        },
        labels_deception: {
          const: false
        },
        rates_people: {
          const: false
        },
        grants_authority: {
          const: false
        },
        grants_consent: {
          const: false
        },
        permits_surveillance: {
          const: false
        }
      }
    }
  },
  $defs: {
    identifier: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    text: {
      type: "string",
      minLength: 1,
      maxLength: 2000
    },
    date: {
      type: "string",
      format: "date"
    },
    nonempty_text_array: {
      type: "array",
      minItems: 1,
      maxItems: 32,
      items: {
        $ref: "#/$defs/text"
      }
    },
    nonempty_identifier_array: {
      type: "array",
      minItems: 1,
      maxItems: 32,
      uniqueItems: true,
      items: {
        $ref: "#/$defs/identifier"
      }
    },
    pattern_role: {
      type: "object",
      additionalProperties: false,
      required: ["id", "type", "description"],
      properties: {
        id: {
          $ref: "#/$defs/identifier"
        },
        type: {
          $ref: "#/$defs/text"
        },
        description: {
          $ref: "#/$defs/text"
        }
      }
    },
    relation_role: {
      type: "object",
      additionalProperties: false,
      required: ["id", "type", "sources", "targets", "description"],
      properties: {
        id: {
          $ref: "#/$defs/identifier"
        },
        type: {
          $ref: "#/$defs/text"
        },
        sources: {
          type: "array",
          minItems: 1,
          maxItems: 16,
          items: {
            $ref: "#/$defs/identifier"
          }
        },
        targets: {
          type: "array",
          minItems: 1,
          maxItems: 16,
          items: {
            $ref: "#/$defs/identifier"
          }
        },
        description: {
          $ref: "#/$defs/text"
        }
      }
    },
    binding: {
      type: "object",
      additionalProperties: false,
      required: ["role_id", "binding"],
      properties: {
        role_id: {
          $ref: "#/$defs/identifier"
        },
        binding: {
          $ref: "#/$defs/text"
        }
      }
    },
    realization: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "domain",
        "context",
        "object_bindings",
        "relation_bindings",
        "known_omissions",
        "boundaries"
      ],
      properties: {
        id: {
          $ref: "#/$defs/identifier"
        },
        domain: {
          $ref: "#/$defs/text"
        },
        context: {
          $ref: "#/$defs/text"
        },
        object_bindings: {
          type: "array",
          minItems: 2,
          maxItems: 32,
          items: {
            $ref: "#/$defs/binding"
          }
        },
        relation_bindings: {
          type: "array",
          minItems: 1,
          maxItems: 32,
          items: {
            $ref: "#/$defs/binding"
          }
        },
        known_omissions: {
          $ref: "#/$defs/nonempty_text_array"
        },
        boundaries: {
          $ref: "#/$defs/text"
        }
      }
    },
    translation_test: {
      type: "object",
      additionalProperties: false,
      required: ["id", "method", "acceptance", "result"],
      properties: {
        id: {
          $ref: "#/$defs/identifier"
        },
        method: {
          $ref: "#/$defs/text"
        },
        acceptance: {
          $ref: "#/$defs/text"
        },
        result: {
          enum: ["passed", "failed", "inconclusive", "not-run"]
        }
      }
    },
    loss: {
      type: "object",
      additionalProperties: false,
      required: ["name", "effect", "disclosed"],
      properties: {
        name: {
          $ref: "#/$defs/identifier"
        },
        effect: {
          $ref: "#/$defs/text"
        },
        disclosed: {
          const: true
        }
      }
    },
    translation: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "source_realization_id",
        "target_realization_id",
        "kind",
        "preserved_relation_ids",
        "unpreserved_relation_ids",
        "tests",
        "known_losses",
        "introduced_assumptions",
        "counterexample",
        "stop_condition"
      ],
      properties: {
        id: {
          $ref: "#/$defs/identifier"
        },
        source_realization_id: {
          $ref: "#/$defs/identifier"
        },
        target_realization_id: {
          $ref: "#/$defs/identifier"
        },
        kind: {
          enum: [
            "encode",
            "decode",
            "lexicalize",
            "translate",
            "infer",
            "visualize",
            "reconstruct",
            "compare"
          ]
        },
        preserved_relation_ids: {
          type: "array",
          minItems: 0,
          maxItems: 32,
          items: {
            $ref: "#/$defs/identifier"
          }
        },
        unpreserved_relation_ids: {
          type: "array",
          minItems: 0,
          maxItems: 32,
          items: {
            $ref: "#/$defs/identifier"
          }
        },
        tests: {
          type: "array",
          minItems: 1,
          maxItems: 32,
          items: {
            $ref: "#/$defs/translation_test"
          }
        },
        known_losses: {
          type: "array",
          minItems: 0,
          maxItems: 32,
          items: {
            $ref: "#/$defs/loss"
          }
        },
        introduced_assumptions: {
          type: "array",
          minItems: 0,
          maxItems: 32,
          items: {
            $ref: "#/$defs/text"
          }
        },
        counterexample: {
          $ref: "#/$defs/text"
        },
        stop_condition: {
          $ref: "#/$defs/text"
        }
      }
    },
    probe: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "kind",
        "description",
        "context",
        "scale",
        "sensitivity_scope",
        "backgrounds",
        "selection_effects",
        "shared_factors",
        "source_ref",
        "observed_on",
        "epistemic_access",
        "run_status",
        "result",
        "limitations"
      ],
      properties: {
        id: {
          $ref: "#/$defs/identifier"
        },
        kind: {
          enum: [
            "intervention",
            "round-trip",
            "triangle",
            "external-observation",
            "counterexample",
            "correction-reach",
            "common-mode-difference"
          ]
        },
        description: {
          $ref: "#/$defs/text"
        },
        context: {
          $ref: "#/$defs/text"
        },
        scale: {
          $ref: "#/$defs/text"
        },
        sensitivity_scope: {
          $ref: "#/$defs/text"
        },
        backgrounds: {
          $ref: "#/$defs/nonempty_text_array"
        },
        selection_effects: {
          $ref: "#/$defs/nonempty_text_array"
        },
        shared_factors: {
          $ref: "#/$defs/nonempty_identifier_array"
        },
        source_ref: {
          oneOf: [
            {
              type: "string",
              minLength: 1,
              maxLength: 2000
            },
            {
              type: "null"
            }
          ]
        },
        observed_on: {
          oneOf: [
            {
              $ref: "#/$defs/date"
            },
            {
              type: "null"
            }
          ]
        },
        epistemic_access: {
          enum: ["direct", "reported", "inferred", "unknown"]
        },
        run_status: {
          enum: ["completed", "inconclusive", "not-run"]
        },
        result: {
          $ref: "#/$defs/text"
        },
        limitations: {
          $ref: "#/$defs/nonempty_text_array"
        }
      },
      allOf: [
        {
          if: {
            properties: {
              run_status: {
                const: "not-run"
              }
            },
            required: ["run_status"]
          },
          then: {
            properties: {
              source_ref: {
                type: "null"
              },
              observed_on: {
                type: "null"
              },
              epistemic_access: {
                const: "unknown"
              }
            }
          }
        },
        {
          if: {
            properties: {
              run_status: {
                enum: ["completed", "inconclusive"]
              }
            },
            required: ["run_status"]
          },
          then: {
            properties: {
              source_ref: {
                type: "string",
                minLength: 1,
                maxLength: 2000
              },
              observed_on: {
                $ref: "#/$defs/date"
              },
              epistemic_access: {
                enum: ["direct", "reported", "inferred"]
              }
            }
          }
        }
      ]
    },
    probe_dependency: {
      type: "object",
      additionalProperties: false,
      required: ["probe_ids", "relationship", "basis"],
      properties: {
        probe_ids: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: {
            $ref: "#/$defs/identifier"
          }
        },
        relationship: {
          enum: ["independent", "partially-shared", "shared-systematic", "unknown"]
        },
        basis: {
          $ref: "#/$defs/text"
        }
      }
    },
    probe_assessment: {
      type: "object",
      additionalProperties: false,
      required: ["probe_id", "expectation", "result", "residual"],
      properties: {
        probe_id: {
          $ref: "#/$defs/identifier"
        },
        expectation: {
          $ref: "#/$defs/text"
        },
        result: {
          enum: ["compatible", "tension", "contradicted-under-test", "unassessed"]
        },
        residual: {
          $ref: "#/$defs/text"
        }
      }
    },
    candidate_model: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "role",
        "description",
        "assumptions",
        "probe_assessments",
        "falsifier_or_refinement_condition",
        "status"
      ],
      properties: {
        id: {
          $ref: "#/$defs/identifier"
        },
        role: {
          enum: ["working", "alternative", "null", "unknown"]
        },
        description: {
          $ref: "#/$defs/text"
        },
        assumptions: {
          $ref: "#/$defs/nonempty_text_array"
        },
        probe_assessments: {
          type: "array",
          minItems: 2,
          maxItems: 32,
          items: {
            $ref: "#/$defs/probe_assessment"
          }
        },
        falsifier_or_refinement_condition: {
          $ref: "#/$defs/text"
        },
        status: {
          enum: ["live", "constrained", "contradicted-under-test", "unassessed"]
        }
      }
    }
  }
};

// bin/semantic-transitions.ts
import { Buffer } from "node:buffer";
// bridges/schemas/semantic-transition-receipt-0.1.json
var semantic_transition_receipt_0_1_default = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "urn:kingdom:semantic-transition:0.1",
  title: "Kingdom semantic transition receipt",
  description: "An opt-in, inspectable record of a transformation between expressions or domains. Structural validity does not prove fidelity, truth, authority, consent, intent, or understanding.",
  $comment: "The TypeScript validator is authoritative for real calendar dates, future-issued dates, normalized safe references, decoded duplicate JSON keys, bounded size/depth, unique named entries, epistemic and observation promotion, loss-assessment consistency, consent/authority all-or-none rules, refusal, the prohibition on irreversible action, and cross-receipt existence, chronology, uniqueness, and acyclicity. Evidence references and digests are declared only: this v0.1 validator does not dereference them or verify truth, fidelity, authority, consent, intent, identity, understanding, or evidence adequacy.",
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version",
    "id",
    "issued_on",
    "state",
    "relation",
    "source",
    "target",
    "transition",
    "warrant",
    "distortion_risks",
    "boundaries",
    "repair",
    "safety"
  ],
  $defs: {
    identifier: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    text: {
      type: "string",
      minLength: 1,
      maxLength: 2000,
      pattern: "^(?![\\s\\S]*[\\u0000-\\u0008\\u000b-\\u001f])\\s*\\S[\\s\\S]*$"
    },
    domain: {
      type: "string",
      minLength: 2,
      maxLength: 200,
      pattern: "^(?![\\s\\S]*[\\u0000-\\u0008\\u000b-\\u001f])\\s*\\S[\\s\\S]*$"
    },
    statement_kind: {
      enum: [
        "observation",
        "expectation",
        "commitment",
        "consequence",
        "interpretation"
      ]
    },
    epistemic_access: {
      enum: [
        "direct",
        "reported",
        "inferred",
        "unknown"
      ]
    },
    expression_origin: {
      enum: [
        "quoted",
        "authored",
        "translated",
        "generated",
        "visualized"
      ]
    },
    reference: {
      type: "string",
      minLength: 1,
      maxLength: 2000,
      pattern: "^(?![/\\\\~])(?![\\s\\S]*[?#\\r\\n\\t])[\\s\\S]*\\S$"
    },
    endpoint: {
      type: "object",
      additionalProperties: false,
      required: [
        "domain",
        "context",
        "expression",
        "expression_ref",
        "statement_kind",
        "epistemic_access",
        "expression_origin",
        "intended_use"
      ],
      properties: {
        domain: {
          $ref: "#/$defs/domain"
        },
        context: {
          $ref: "#/$defs/text"
        },
        expression: {
          $ref: "#/$defs/text"
        },
        expression_ref: {
          oneOf: [
            {
              $ref: "#/$defs/reference"
            },
            {
              type: "null"
            }
          ]
        },
        statement_kind: {
          $ref: "#/$defs/statement_kind"
        },
        epistemic_access: {
          $ref: "#/$defs/epistemic_access"
        },
        expression_origin: {
          $ref: "#/$defs/expression_origin"
        },
        intended_use: {
          $ref: "#/$defs/text"
        }
      }
    }
  },
  properties: {
    schema_version: {
      const: "kingdom.semantic-transition/0.1"
    },
    id: {
      $ref: "#/$defs/identifier"
    },
    issued_on: {
      type: "string",
      format: "date",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$"
    },
    state: {
      enum: [
        "draft",
        "issued"
      ]
    },
    relation: {
      type: "object",
      additionalProperties: false,
      required: [
        "kind",
        "target_receipt_id"
      ],
      properties: {
        kind: {
          enum: [
            "original",
            "corrects",
            "supersedes",
            "withdraws"
          ]
        },
        target_receipt_id: {
          oneOf: [
            {
              $ref: "#/$defs/identifier"
            },
            {
              type: "null"
            }
          ]
        }
      },
      allOf: [
        {
          if: { properties: { kind: { const: "original" } } },
          then: { properties: { target_receipt_id: { type: "null" } } },
          else: { properties: { target_receipt_id: { $ref: "#/$defs/identifier" } } }
        }
      ]
    },
    source: {
      $ref: "#/$defs/endpoint"
    },
    target: {
      $ref: "#/$defs/endpoint"
    },
    transition: {
      type: "object",
      additionalProperties: false,
      required: [
        "kind",
        "rule",
        "preserved_relations",
        "discarded_structure",
        "loss_assessment",
        "introduced_assumptions",
        "new_evidence_refs",
        "counterexample",
        "stop_condition"
      ],
      properties: {
        kind: {
          enum: [
            "encode",
            "decode",
            "lexicalize",
            "translate",
            "summarize",
            "infer",
            "visualize",
            "operationalize",
            "metaphorize"
          ]
        },
        rule: {
          $ref: "#/$defs/text"
        },
        preserved_relations: {
          type: "array",
          minItems: 1,
          maxItems: 32,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "name",
              "source_form",
              "target_form",
              "test"
            ],
            properties: {
              name: {
                $ref: "#/$defs/identifier"
              },
              source_form: {
                $ref: "#/$defs/text"
              },
              target_form: {
                $ref: "#/$defs/text"
              },
              test: {
                $ref: "#/$defs/text"
              }
            }
          }
        },
        discarded_structure: {
          type: "array",
          minItems: 0,
          maxItems: 32,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "name",
              "consequence",
              "disclosed"
            ],
            properties: {
              name: {
                $ref: "#/$defs/identifier"
              },
              consequence: {
                $ref: "#/$defs/text"
              },
              disclosed: {
                const: true
              }
            }
          }
        },
        loss_assessment: {
          type: "object",
          additionalProperties: false,
          required: [
            "status",
            "basis"
          ],
          properties: {
            status: {
              enum: [
                "losses-declared",
                "none-identified"
              ]
            },
            basis: {
              $ref: "#/$defs/text"
            }
          }
        },
        introduced_assumptions: {
          type: "array",
          maxItems: 32,
          items: {
            $ref: "#/$defs/text"
          }
        },
        new_evidence_refs: {
          type: "array",
          minItems: 0,
          maxItems: 64,
          uniqueItems: true,
          items: {
            $ref: "#/$defs/identifier"
          }
        },
        counterexample: {
          $ref: "#/$defs/text"
        },
        stop_condition: {
          $ref: "#/$defs/text"
        }
      },
      allOf: [
        {
          if: {
            properties: {
              discarded_structure: { maxItems: 0 }
            }
          },
          then: {
            properties: {
              loss_assessment: {
                properties: { status: { const: "none-identified" } }
              }
            }
          },
          else: {
            properties: {
              loss_assessment: {
                properties: { status: { const: "losses-declared" } }
              }
            }
          }
        }
      ]
    },
    warrant: {
      type: "object",
      additionalProperties: false,
      required: [
        "evidence",
        "declared_confidence",
        "confidence_basis",
        "known_limits",
        "freshness"
      ],
      properties: {
        evidence: {
          type: "array",
          minItems: 0,
          maxItems: 64,
          uniqueItems: true,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "id",
              "ref",
              "role",
              "observed_on",
              "sha256"
            ],
            properties: {
              id: { $ref: "#/$defs/identifier" },
              ref: { $ref: "#/$defs/reference" },
              role: { enum: ["supports", "challenges", "context"] },
              observed_on: {
                type: "string",
                format: "date",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$"
              },
              sha256: {
                oneOf: [
                  { type: "string", pattern: "^[a-f0-9]{64}$" },
                  { type: "null" }
                ]
              }
            }
          }
        },
        declared_confidence: {
          enum: [
            "high",
            "medium",
            "low",
            "unknown"
          ]
        },
        confidence_basis: {
          $ref: "#/$defs/text"
        },
        known_limits: {
          type: "array",
          minItems: 1,
          maxItems: 32,
          items: {
            $ref: "#/$defs/text"
          }
        },
        freshness: {
          type: "object",
          additionalProperties: false,
          required: [
            "assessed_on",
            "reassess_when"
          ],
          properties: {
            assessed_on: {
              type: "string",
              format: "date",
              pattern: "^\\d{4}-\\d{2}-\\d{2}$"
            },
            reassess_when: {
              $ref: "#/$defs/text"
            }
          }
        }
      },
      allOf: [
        {
          if: {
            properties: { declared_confidence: { const: "high" } }
          },
          then: {
            properties: {
              evidence: {
                contains: {
                  type: "object",
                  properties: { role: { const: "supports" } },
                  required: ["role"]
                },
                minContains: 1
              }
            }
          }
        }
      ]
    },
    distortion_risks: {
      type: "array",
      minItems: 1,
      maxItems: 32,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "kind",
          "mechanism",
          "mitigation",
          "residual"
        ],
        properties: {
          kind: {
            enum: [
              "uncertainty-stripping",
              "source-erasure",
              "authority-laundering",
              "scope-expansion",
              "context-collapse",
              "equivocation",
              "hidden-loss",
              "contradiction",
              "staleness",
              "evidence-fabrication",
              "identity-collapse",
              "irreversible-action",
              "other"
            ]
          },
          mechanism: {
            $ref: "#/$defs/text"
          },
          mitigation: {
            $ref: "#/$defs/text"
          },
          residual: {
            $ref: "#/$defs/text"
          }
        }
      }
    },
    boundaries: {
      type: "object",
      additionalProperties: false,
      required: [
        "representation_scope",
        "consent",
        "consent_subject",
        "consent_scope",
        "consent_basis",
        "consent_ref",
        "authority_scope",
        "authority_basis",
        "authority_ref",
        "actionability",
        "privacy"
      ],
      properties: {
        representation_scope: {
          enum: [
            "none",
            "self",
            "other-public",
            "other-private",
            "artifact-public",
            "collective"
          ]
        },
        consent: {
          enum: [
            "not-applicable",
            "self-authored",
            "explicit-obtained",
            "refused",
            "unknown"
          ]
        },
        consent_subject: {
          oneOf: [{ $ref: "#/$defs/text" }, { type: "null" }]
        },
        consent_scope: {
          oneOf: [{ $ref: "#/$defs/text" }, { type: "null" }]
        },
        consent_basis: {
          oneOf: [{ $ref: "#/$defs/text" }, { type: "null" }]
        },
        consent_ref: {
          oneOf: [{ $ref: "#/$defs/reference" }, { type: "null" }]
        },
        authority_scope: {
          oneOf: [
            {
              $ref: "#/$defs/text"
            },
            {
              type: "null"
            }
          ]
        },
        authority_basis: {
          oneOf: [
            {
              $ref: "#/$defs/text"
            },
            {
              type: "null"
            }
          ]
        },
        authority_ref: {
          oneOf: [{ $ref: "#/$defs/reference" }, { type: "null" }]
        },
        actionability: {
          enum: [
            "descriptive",
            "reversible"
          ]
        },
        privacy: {
          enum: [
            "public-only",
            "authorized-private",
            "redacted"
          ]
        }
      },
      allOf: [
        {
          oneOf: [
            {
              properties: {
                consent_subject: { type: "null" },
                consent_scope: { type: "null" },
                consent_basis: { type: "null" },
                consent_ref: { type: "null" }
              }
            },
            {
              properties: {
                consent_subject: { $ref: "#/$defs/text" },
                consent_scope: { $ref: "#/$defs/text" },
                consent_basis: { $ref: "#/$defs/text" },
                consent_ref: { $ref: "#/$defs/reference" }
              }
            }
          ]
        },
        {
          oneOf: [
            {
              properties: {
                authority_scope: { type: "null" },
                authority_basis: { type: "null" },
                authority_ref: { type: "null" }
              }
            },
            {
              properties: {
                authority_scope: { $ref: "#/$defs/text" },
                authority_basis: { $ref: "#/$defs/text" },
                authority_ref: { $ref: "#/$defs/reference" }
              }
            }
          ]
        },
        {
          if: { properties: { consent: { const: "not-applicable" } } },
          then: {
            properties: {
              consent_subject: { type: "null" },
              consent_scope: { type: "null" },
              consent_basis: { type: "null" },
              consent_ref: { type: "null" }
            }
          }
        },
        {
          if: { properties: { representation_scope: { enum: ["none", "artifact-public"] } } },
          then: { properties: { consent: { const: "not-applicable" } } }
        },
        {
          if: { properties: { representation_scope: { enum: ["other-public", "other-private", "collective"] } } },
          then: { properties: { consent: { not: { const: "not-applicable" } } } }
        },
        {
          if: { properties: { consent: { enum: ["self-authored", "explicit-obtained"] } } },
          then: {
            properties: {
              consent_subject: { $ref: "#/$defs/text" },
              consent_scope: { $ref: "#/$defs/text" },
              consent_basis: { $ref: "#/$defs/text" },
              consent_ref: { $ref: "#/$defs/reference" }
            }
          }
        }
      ]
    },
    repair: {
      type: "object",
      additionalProperties: false,
      required: [
        "reply_route",
        "correction_route",
        "carry_challenges_forward",
        "retain_prior_receipt"
      ],
      properties: {
        reply_route: {
          $ref: "#/$defs/text"
        },
        correction_route: {
          $ref: "#/$defs/text"
        },
        carry_challenges_forward: {
          const: true
        },
        retain_prior_receipt: {
          const: true
        }
      }
    },
    safety: {
      type: "object",
      additionalProperties: false,
      required: [
        "grants_authority",
        "grants_consent",
        "proves_truth",
        "infers_intent",
        "rates_people",
        "permits_surveillance"
      ],
      properties: {
        grants_authority: {
          const: false
        },
        grants_consent: {
          const: false
        },
        proves_truth: {
          const: false
        },
        infers_intent: {
          const: false
        },
        rates_people: {
          const: false
        },
        permits_surveillance: {
          const: false
        }
      }
    }
  },
  allOf: [
    {
      if: {
        properties: {
          source: { properties: { epistemic_access: { not: { const: "direct" } } } },
          target: { properties: { epistemic_access: { const: "direct" } } }
        }
      },
      then: {
        properties: {
          transition: { properties: { new_evidence_refs: { minItems: 1 } } }
        }
      }
    },
    {
      if: {
        properties: {
          source: { properties: { statement_kind: { not: { const: "observation" } } } },
          target: { properties: { statement_kind: { const: "observation" } } }
        }
      },
      then: {
        properties: {
          transition: { properties: { new_evidence_refs: { minItems: 1 } } }
        }
      }
    }
  ]
};

// bin/semantic-transitions.ts
var SEMANTIC_TRANSITION_JSON_SCHEMA = semantic_transition_receipt_0_1_default;
var FORBIDDEN_FIELD_NAMES = new Set([
  "biometrics",
  "chain_of_thought",
  "credentials",
  "inferred_intent",
  "intent_score",
  "liar",
  "lie_score",
  "moral_score",
  "person_score",
  "private_reasoning",
  "trust_score",
  "truth_score"
]);
var MAX_RECEIPT_BYTES = 1e6;
var MAX_RECEIPT_DEPTH = 64;
function parseSemanticTransitionJson(source, label = "Semantic transition JSON") {
  if (Buffer.byteLength(source, "utf8") > MAX_RECEIPT_BYTES)
    throw new Error(`${label} exceeds ${MAX_RECEIPT_BYTES} bytes`);
  let position = 0;
  const fail = (message) => {
    throw new Error(`${label}: ${message} at byte ${position}`);
  };
  const whitespace = () => {
    while (/\s/u.test(source[position] ?? "") && position < source.length)
      position++;
  };
  const stringToken = () => {
    const start = position;
    if (source[position++] !== '"')
      fail("expected string");
    while (position < source.length) {
      const character = source[position++];
      if (character === '"') {
        try {
          return JSON.parse(source.slice(start, position));
        } catch {
          fail("invalid string");
        }
      }
      if (character === "\\") {
        const escape = source[position++];
        if (escape === "u") {
          if (!/^[0-9a-f]{4}$/i.test(source.slice(position, position + 4)))
            fail("invalid Unicode escape");
          position += 4;
        } else if (!'"\\/bfnrt'.includes(escape ?? ""))
          fail("invalid escape");
      } else if (character.charCodeAt(0) < 32)
        fail("unescaped control character");
    }
    return fail("unterminated string");
  };
  const value = (depth) => {
    if (depth > MAX_RECEIPT_DEPTH)
      fail("maximum nesting depth exceeded");
    whitespace();
    const character = source[position];
    if (character === '"') {
      stringToken();
      return;
    }
    if (character === "{") {
      position++;
      whitespace();
      const keys = new Set;
      if (source[position] === "}") {
        position++;
        return;
      }
      while (true) {
        whitespace();
        const key = stringToken();
        if (keys.has(key))
          fail(`duplicate object key ${JSON.stringify(key)}`);
        keys.add(key);
        whitespace();
        if (source[position++] !== ":")
          fail("expected colon");
        value(depth + 1);
        whitespace();
        const separator = source[position++];
        if (separator === "}")
          return;
        if (separator !== ",")
          fail("expected comma or closing brace");
      }
    }
    if (character === "[") {
      position++;
      whitespace();
      if (source[position] === "]") {
        position++;
        return;
      }
      while (true) {
        value(depth + 1);
        whitespace();
        const separator = source[position++];
        if (separator === "]")
          return;
        if (separator !== ",")
          fail("expected comma or closing bracket");
      }
    }
    for (const literal of ["true", "false", "null"]) {
      if (source.startsWith(literal, position)) {
        position += literal.length;
        return;
      }
    }
    const number = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(source.slice(position));
    if (number) {
      position += number[0].length;
      return;
    }
    fail("expected JSON value");
  };
  value(0);
  whitespace();
  if (position !== source.length)
    fail("unexpected trailing content");
  return JSON.parse(source);
}
if (false)
  ;

// bin/relational-inference.ts
var RELATIONAL_INFERENCE_SCHEMA_VERSION = "kingdom.relational-inference/0.1";
var RELATIONAL_PATTERN_CLAIM_TYPES = [
  "analogy",
  "partial-map",
  "lax-correspondence"
];
var RELATIONAL_TRANSLATION_KINDS = [
  "encode",
  "decode",
  "lexicalize",
  "translate",
  "infer",
  "visualize",
  "reconstruct",
  "compare"
];
var RELATIONAL_TRANSLATION_TEST_RESULTS = [
  "passed",
  "failed",
  "inconclusive",
  "not-run"
];
var RELATIONAL_PROBE_KINDS = [
  "intervention",
  "round-trip",
  "triangle",
  "external-observation",
  "counterexample",
  "correction-reach",
  "common-mode-difference"
];
var RELATIONAL_EPISTEMIC_ACCESS = ["direct", "reported", "inferred", "unknown"];
var RELATIONAL_PROBE_RUN_STATUSES = ["completed", "inconclusive", "not-run"];
var RELATIONAL_PROBE_DEPENDENCIES = [
  "independent",
  "partially-shared",
  "shared-systematic",
  "unknown"
];
var RELATIONAL_MODEL_ROLES = ["working", "alternative", "null", "unknown"];
var RELATIONAL_PROBE_ASSESSMENT_RESULTS = [
  "compatible",
  "tension",
  "contradicted-under-test",
  "unassessed"
];
var RELATIONAL_MODEL_STATUSES = [
  "live",
  "constrained",
  "contradicted-under-test",
  "unassessed"
];
var RELATIONAL_CONCLUSION_STATUSES = [
  "model-contrast",
  "bounded-inference",
  "underdetermined"
];
var RELATIONAL_CONFIDENCE_LEVELS = ["medium", "low", "unknown"];
var RELATIONAL_INFERENCE_JSON_SCHEMA = relational_inference_case_0_1_default;
var MAX_CASE_DEPTH = 64;
var MAX_CASE_NODES = 20000;
var FORBIDDEN_FIELD_NAMES2 = new Set([
  "biometrics",
  "chain_of_thought",
  "credentials",
  "deception_label",
  "deception_score",
  "essence",
  "guilt",
  "guilt_score",
  "hidden_cause",
  "identity_score",
  "inferred_intent",
  "intent_score",
  "liar",
  "lie_score",
  "mental_state",
  "moral_score",
  "person_score",
  "private_reasoning",
  "reputation_score",
  "risk_score",
  "true_model",
  "trust_score",
  "truth_score",
  "worthiness_score"
]);
function rejectNonJsonAndForbiddenFields(value) {
  const seen = new WeakSet;
  const stack = [
    { value, path: "Relational inference case", depth: 0 }
  ];
  let nodes = 0;
  while (stack.length > 0) {
    const current = stack.pop();
    if (++nodes > MAX_CASE_NODES)
      throw new Error("Relational inference case is too large");
    if (current.depth > MAX_CASE_DEPTH)
      throw new Error("Relational inference case is nested too deeply");
    if (current.value === null || typeof current.value === "string" || typeof current.value === "boolean")
      continue;
    if (typeof current.value === "number") {
      if (!Number.isFinite(current.value))
        throw new Error(`${current.path} must contain finite JSON numbers only`);
      continue;
    }
    if (typeof current.value !== "object")
      throw new Error(`${current.path} must contain JSON values only`);
    if (utilTypes.isProxy(current.value))
      throw new Error(`${current.path} must not contain proxy objects`);
    if (seen.has(current.value))
      throw new Error("Relational inference case must be an acyclic JSON tree");
    seen.add(current.value);
    if (Array.isArray(current.value)) {
      if (Object.getPrototypeOf(current.value) !== Array.prototype) {
        throw new Error(`${current.path} must use the standard Array prototype`);
      }
      if (current.value.length > MAX_CASE_NODES)
        throw new Error("Relational inference case is too large");
      const ownKeys = Reflect.ownKeys(current.value);
      const expectedKeys = new Set(["length"]);
      for (let index = 0;index < current.value.length; index++)
        expectedKeys.add(String(index));
      if (ownKeys.some((key) => typeof key !== "string" || !expectedKeys.has(key))) {
        throw new Error(`${current.path} array must not contain hidden or named properties`);
      }
      for (let index = 0;index < current.value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(current.value, String(index));
        if (!descriptor || !("value" in descriptor))
          throw new Error(`${current.path} must not contain holes or accessors`);
        stack.push({ value: descriptor.value, path: `${current.path}[${index}]`, depth: current.depth + 1 });
      }
      continue;
    }
    const prototype = Object.getPrototypeOf(current.value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`${current.path} must be a plain JSON object`);
    }
    for (const key of Reflect.ownKeys(current.value)) {
      if (typeof key !== "string")
        throw new Error(`${current.path} must not contain symbol keys`);
      const descriptor = Object.getOwnPropertyDescriptor(current.value, key);
      if (!("value" in descriptor) || descriptor.enumerable !== true) {
        throw new Error(`${current.path}.${key} must be an enumerable data field`);
      }
      if (FORBIDDEN_FIELD_NAMES2.has(key.toLowerCase())) {
        throw new Error(`${current.path}.${key} is forbidden: cases compare models and artifacts, not private minds or people`);
      }
      stack.push({ value: descriptor.value, path: `${current.path}.${key}`, depth: current.depth + 1 });
    }
  }
}
function record(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${label} must be an object`);
  return value;
}
function exactKeys(value, keys, label) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} must contain exactly: ${expected.join(", ")}`);
  }
}
function text(value, label, minimum = 1, maximum = 2000) {
  if (typeof value !== "string")
    throw new Error(`${label} must be a string`);
  const trimmed = value.trim();
  if ([...trimmed].length < minimum || [...value].length > maximum) {
    throw new Error(`${label} must contain ${minimum}-${maximum} characters`);
  }
  if (/[\u0000-\u0008\u000b-\u001f]/u.test(value))
    throw new Error(`${label} must not contain control characters`);
  return value;
}
function identifier(value, label) {
  const result = text(value, label, 1, 100);
  if (result !== result.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) {
    throw new Error(`${label} must be a lowercase hyphenated identifier`);
  }
  return result;
}
function isoDate(value, label) {
  const result = text(value, label, 10, 10);
  const parsed = new Date(`${result}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== result) {
    throw new Error(`${label} must be a real ISO date`);
  }
  return result;
}
function oneOf(value, choices, label) {
  if (typeof value !== "string" || !choices.includes(value)) {
    throw new Error(`${label} must be one of: ${choices.join(", ")}`);
  }
  return value;
}
function array(value, label, minimum, maximum) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    throw new Error(`${label} must contain ${minimum}-${maximum} entries`);
  }
  return value;
}
function unique(values, label) {
  if (new Set(values).size !== values.length)
    throw new Error(`${label} entries must be unique`);
}
function textArray(value, label, minimum = 1, maximum = 32) {
  const values = array(value, label, minimum, maximum).map((entry, index) => text(entry, `${label} entry ${index + 1}`));
  unique(values.map((entry) => entry.trim()), label);
  return values;
}
function evidenceReference(value, label) {
  const result = text(value, label);
  if (result !== result.trim() || /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(result)) {
    throw new Error(`${label} must not contain surrounding, control, or bidirectional formatting characters`);
  }
  if (/%(?:0[0-9a-f]|1[0-9a-f]|7f|2f|5c|25)/iu.test(result)) {
    throw new Error(`${label} must not contain encoded controls, DEL, slash, backslash, or percent`);
  }
  if (/%(?![0-9a-f]{2})/iu.test(result))
    throw new Error(`${label} must not contain malformed percent encoding`);
  if (/[?#]/u.test(result))
    throw new Error(`${label} must not contain URL query or fragment data`);
  if (/^(?:\/\/|\\\\|\/|\\|~(?:\/|$))/u.test(result)) {
    throw new Error(`${label} must not be protocol-relative or an absolute filesystem reference`);
  }
  if (!/^[a-z][a-z0-9+.-]*:/i.test(result)) {
    if (result.includes("\\"))
      throw new Error(`${label} must use portable forward slashes`);
    const segments = result.split("/");
    if (segments.some((segment) => segment === "" || segment === "." || segment === ".." || /%2e/i.test(segment))) {
      throw new Error(`${label} must be a normalized relative reference without dot segments`);
    }
    return result;
  }
  let parsed;
  try {
    parsed = new URL(result);
  } catch {
    throw new Error(`${label} URL is malformed`);
  }
  if (parsed.protocol === "https:") {
    if (!result.startsWith("https://") || parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error(`${label} must be canonical HTTPS without credentials, query, or fragment data`);
    }
    if (result !== parsed.href)
      throw new Error(`${label} HTTPS input must equal its canonical URL href`);
    return result;
  }
  if (["artifact:", "report:", "urn:"].includes(parsed.protocol) && !parsed.search && !parsed.hash) {
    if (!result.startsWith(parsed.protocol))
      throw new Error(`${label} opaque reference scheme must be lowercase canonical form`);
    return result;
  }
  throw new Error(`${label} must be a relative reference, HTTPS URL, artifact/report reference, or URN`);
}
function canonicalReferenceAlias(reference) {
  const normalized = /^[a-z][a-z0-9+.-]*:/i.test(reference) ? (() => {
    const parsed = new URL(reference);
    return parsed.protocol === "https:" ? parsed.href : `${parsed.protocol}${reference.slice(reference.indexOf(":") + 1)}`;
  })() : reference;
  return normalized.normalize("NFC").replace(/%([0-9a-f]{2})/gi, (encoding, digits) => {
    const character = String.fromCharCode(Number.parseInt(digits, 16));
    return /^[A-Za-z0-9._~-]$/.test(character) ? character : encoding.toUpperCase();
  });
}
function sameMembers(actual, expected, label) {
  unique(actual, label);
  const actualSet = new Set(actual);
  if (actual.length !== expected.length || expected.some((entry) => !actualSet.has(entry))) {
    throw new Error(`${label} must bind every declared role exactly once and no undeclared role`);
  }
}
function pairKey(first, second) {
  return first < second ? `${first}\x00${second}` : `${second}\x00${first}`;
}
function parseRelationalInferenceJson(source, label = "Relational inference JSON") {
  return parseSemanticTransitionJson(source, label);
}
function validateRelationalInference(candidate, options = {}) {
  rejectNonJsonAndForbiddenFields(candidate);
  const inferenceCase = record(candidate, "Relational inference case");
  exactKeys(inferenceCase, [
    "schema_version",
    "id",
    "issued_on",
    "state",
    "question",
    "pattern",
    "realizations",
    "translations",
    "probes",
    "probe_dependencies",
    "candidate_models",
    "inference",
    "boundaries",
    "harm_boundary",
    "repair",
    "safety"
  ], "Relational inference case");
  if (inferenceCase.schema_version !== RELATIONAL_INFERENCE_SCHEMA_VERSION) {
    throw new Error("Relational inference case schema_version is unsupported");
  }
  const caseId = identifier(inferenceCase.id, "Relational inference case id");
  const issuedOn = isoDate(inferenceCase.issued_on, "Relational inference case issued_on");
  const state = oneOf(inferenceCase.state, ["draft", "issued"], "Relational inference case state");
  const asOf = options.asOf === undefined ? new Date().toISOString().slice(0, 10) : isoDate(options.asOf, "Relational inference validation asOf");
  if (state === "issued" && issuedOn > asOf) {
    throw new Error(`Issued relational inference case cannot be dated after validation asOf ${asOf}`);
  }
  const question = record(inferenceCase.question, "Relational inference question");
  exactKeys(question, ["text", "domain", "scope", "stakes", "intended_use", "non_goals"], "Relational inference question");
  text(question.text, "Relational inference question text");
  text(question.domain, "Relational inference question domain");
  text(question.scope, "Relational inference question scope");
  oneOf(question.stakes, ["low", "medium", "high"], "Relational inference question stakes");
  text(question.intended_use, "Relational inference question intended_use");
  textArray(question.non_goals, "Relational inference question non_goals");
  const pattern = record(inferenceCase.pattern, "Relational inference pattern");
  exactKeys(pattern, ["id", "claim_type", "object_roles", "relation_roles", "constraints"], "Relational inference pattern");
  identifier(pattern.id, "Relational inference pattern id");
  oneOf(pattern.claim_type, RELATIONAL_PATTERN_CLAIM_TYPES, "Relational inference pattern claim_type");
  const objectRoleIds = array(pattern.object_roles, "Relational inference object_roles", 2, 32).map((candidateRole, index) => {
    const role = record(candidateRole, `Relational inference object role ${index + 1}`);
    exactKeys(role, ["id", "type", "description"], `Relational inference object role ${index + 1}`);
    const id = identifier(role.id, `Relational inference object role ${index + 1} id`);
    text(role.type, `Relational inference object role ${id} type`);
    text(role.description, `Relational inference object role ${id} description`);
    return id;
  });
  unique(objectRoleIds, "Relational inference object role ids");
  const objectRoleSet = new Set(objectRoleIds);
  const relationRoleIds = array(pattern.relation_roles, "Relational inference relation_roles", 1, 32).map((candidateRole, index) => {
    const role = record(candidateRole, `Relational inference relation role ${index + 1}`);
    exactKeys(role, ["id", "type", "sources", "targets", "description"], `Relational inference relation role ${index + 1}`);
    const id = identifier(role.id, `Relational inference relation role ${index + 1} id`);
    text(role.type, `Relational inference relation role ${id} type`);
    text(role.description, `Relational inference relation role ${id} description`);
    const sources = array(role.sources, `Relational inference relation role ${id} sources`, 1, 16).map((source, sourceIndex) => identifier(source, `Relational inference relation role ${id} source ${sourceIndex + 1}`));
    const targets = array(role.targets, `Relational inference relation role ${id} targets`, 1, 16).map((target, targetIndex) => identifier(target, `Relational inference relation role ${id} target ${targetIndex + 1}`));
    unique(sources, `Relational inference relation role ${id} sources`);
    unique(targets, `Relational inference relation role ${id} targets`);
    for (const roleId of [...sources, ...targets]) {
      if (!objectRoleSet.has(roleId)) {
        throw new Error(`Relational inference relation role ${id} references undeclared object role ${roleId}`);
      }
    }
    return id;
  });
  unique(relationRoleIds, "Relational inference relation role ids");
  const relationRoleSet = new Set(relationRoleIds);
  textArray(pattern.constraints, "Relational inference pattern constraints");
  const realizationIds = array(inferenceCase.realizations, "Relational inference realizations", 2, 16).map((candidateRealization, index) => {
    const realization = record(candidateRealization, `Relational inference realization ${index + 1}`);
    exactKeys(realization, [
      "id",
      "domain",
      "context",
      "object_bindings",
      "relation_bindings",
      "known_omissions",
      "boundaries"
    ], `Relational inference realization ${index + 1}`);
    const id = identifier(realization.id, `Relational inference realization ${index + 1} id`);
    text(realization.domain, `Relational inference realization ${id} domain`);
    text(realization.context, `Relational inference realization ${id} context`);
    const validateBindings = (value, kind, expectedIds) => {
      const bindings = array(value, `Relational inference realization ${id} ${kind}_bindings`, expectedIds.length, expectedIds.length).map((candidateBinding, bindingIndex) => {
        const binding = record(candidateBinding, `Relational inference realization ${id} ${kind} binding ${bindingIndex + 1}`);
        exactKeys(binding, ["role_id", "binding"], `Relational inference realization ${id} ${kind} binding ${bindingIndex + 1}`);
        const roleId = identifier(binding.role_id, `Relational inference realization ${id} ${kind} binding ${bindingIndex + 1} role_id`);
        text(binding.binding, `Relational inference realization ${id} ${kind} binding ${roleId}`);
        return roleId;
      });
      sameMembers(bindings, expectedIds, `Relational inference realization ${id} ${kind} binding role_ids`);
    };
    validateBindings(realization.object_bindings, "object", objectRoleIds);
    validateBindings(realization.relation_bindings, "relation", relationRoleIds);
    textArray(realization.known_omissions, `Relational inference realization ${id} known_omissions`);
    text(realization.boundaries, `Relational inference realization ${id} boundaries`);
    return id;
  });
  unique(realizationIds, "Relational inference realization ids");
  const realizationIdSet = new Set(realizationIds);
  const incidentRealizationIds = new Set;
  const translationIds = array(inferenceCase.translations, "Relational inference translations", 1, 32).map((candidateTranslation, index) => {
    const translation = record(candidateTranslation, `Relational inference translation ${index + 1}`);
    exactKeys(translation, [
      "id",
      "source_realization_id",
      "target_realization_id",
      "kind",
      "preserved_relation_ids",
      "unpreserved_relation_ids",
      "tests",
      "known_losses",
      "introduced_assumptions",
      "counterexample",
      "stop_condition"
    ], `Relational inference translation ${index + 1}`);
    const id = identifier(translation.id, `Relational inference translation ${index + 1} id`);
    const sourceId = identifier(translation.source_realization_id, `Relational inference translation ${id} source_realization_id`);
    const targetId = identifier(translation.target_realization_id, `Relational inference translation ${id} target_realization_id`);
    if (!realizationIdSet.has(sourceId))
      throw new Error(`Relational inference translation ${id} references missing source realization ${sourceId}`);
    if (!realizationIdSet.has(targetId))
      throw new Error(`Relational inference translation ${id} references missing target realization ${targetId}`);
    if (sourceId === targetId)
      throw new Error(`Relational inference translation ${id} source and target must differ`);
    incidentRealizationIds.add(sourceId);
    incidentRealizationIds.add(targetId);
    oneOf(translation.kind, RELATIONAL_TRANSLATION_KINDS, `Relational inference translation ${id} kind`);
    const preservedIds = array(translation.preserved_relation_ids, `Relational inference translation ${id} preserved_relation_ids`, 0, 32).map((roleId, roleIndex) => identifier(roleId, `Relational inference translation ${id} preserved relation ${roleIndex + 1}`));
    unique(preservedIds, `Relational inference translation ${id} preserved_relation_ids`);
    for (const roleId of preservedIds) {
      if (!relationRoleSet.has(roleId))
        throw new Error(`Relational inference translation ${id} preserves undeclared relation role ${roleId}`);
    }
    const unpreservedIds = array(translation.unpreserved_relation_ids, `Relational inference translation ${id} unpreserved_relation_ids`, 0, 32).map((roleId, roleIndex) => identifier(roleId, `Relational inference translation ${id} unpreserved relation ${roleIndex + 1}`));
    unique(unpreservedIds, `Relational inference translation ${id} unpreserved_relation_ids`);
    for (const roleId of unpreservedIds) {
      if (!relationRoleSet.has(roleId)) {
        throw new Error(`Relational inference translation ${id} marks undeclared relation role ${roleId} unpreserved`);
      }
    }
    const relationPartition = [...preservedIds, ...unpreservedIds];
    unique(relationPartition, `Relational inference translation ${id} preserved/unpreserved relation partition`);
    if (relationPartition.length !== relationRoleIds.length || relationRoleIds.some((roleId) => !relationPartition.includes(roleId))) {
      throw new Error(`Relational inference translation ${id} preserved and unpreserved relation ids must cover every relation role exactly once`);
    }
    const testIds = array(translation.tests, `Relational inference translation ${id} tests`, 1, 32).map((candidateTest, testIndex) => {
      const test = record(candidateTest, `Relational inference translation ${id} test ${testIndex + 1}`);
      exactKeys(test, ["id", "method", "acceptance", "result"], `Relational inference translation ${id} test ${testIndex + 1}`);
      const testId = identifier(test.id, `Relational inference translation ${id} test ${testIndex + 1} id`);
      text(test.method, `Relational inference translation ${id} test ${testId} method`);
      text(test.acceptance, `Relational inference translation ${id} test ${testId} acceptance`);
      oneOf(test.result, RELATIONAL_TRANSLATION_TEST_RESULTS, `Relational inference translation ${id} test ${testId} result`);
      return testId;
    });
    unique(testIds, `Relational inference translation ${id} test ids`);
    const lossNames = array(translation.known_losses, `Relational inference translation ${id} known_losses`, 0, 32).map((candidateLoss, lossIndex) => {
      const loss = record(candidateLoss, `Relational inference translation ${id} loss ${lossIndex + 1}`);
      exactKeys(loss, ["name", "effect", "disclosed"], `Relational inference translation ${id} loss ${lossIndex + 1}`);
      const name = identifier(loss.name, `Relational inference translation ${id} loss ${lossIndex + 1} name`);
      text(loss.effect, `Relational inference translation ${id} loss ${name} effect`);
      if (loss.disclosed !== true)
        throw new Error(`Relational inference translation ${id} loss ${name} must be disclosed`);
      return name;
    });
    unique(lossNames, `Relational inference translation ${id} loss names`);
    if (unpreservedIds.length > 0 && lossNames.length === 0) {
      throw new Error(`Relational inference translation ${id} must disclose at least one known loss when relation roles are unpreserved`);
    }
    textArray(translation.introduced_assumptions, `Relational inference translation ${id} introduced_assumptions`, 0, 32);
    text(translation.counterexample, `Relational inference translation ${id} counterexample`);
    text(translation.stop_condition, `Relational inference translation ${id} stop_condition`);
    return id;
  });
  unique(translationIds, "Relational inference translation ids");
  for (const realizationId of realizationIds) {
    if (!incidentRealizationIds.has(realizationId)) {
      throw new Error(`Relational inference realization ${realizationId} must be incident to at least one translation`);
    }
  }
  const probes = array(inferenceCase.probes, "Relational inference probes", 2, 32).map((candidateProbe, index) => {
    const probe = record(candidateProbe, `Relational inference probe ${index + 1}`);
    exactKeys(probe, [
      "id",
      "kind",
      "description",
      "context",
      "scale",
      "sensitivity_scope",
      "backgrounds",
      "selection_effects",
      "shared_factors",
      "source_ref",
      "observed_on",
      "epistemic_access",
      "run_status",
      "result",
      "limitations"
    ], `Relational inference probe ${index + 1}`);
    const id = identifier(probe.id, `Relational inference probe ${index + 1} id`);
    const kind = oneOf(probe.kind, RELATIONAL_PROBE_KINDS, `Relational inference probe ${id} kind`);
    const description = text(probe.description, `Relational inference probe ${id} description`);
    const context = text(probe.context, `Relational inference probe ${id} context`);
    const scale = text(probe.scale, `Relational inference probe ${id} scale`);
    const sensitivityScope = text(probe.sensitivity_scope, `Relational inference probe ${id} sensitivity_scope`);
    const backgrounds = textArray(probe.backgrounds, `Relational inference probe ${id} backgrounds`);
    const selectionEffects = textArray(probe.selection_effects, `Relational inference probe ${id} selection_effects`);
    const sharedFactors = array(probe.shared_factors, `Relational inference probe ${id} shared_factors`, 1, 32).map((factor, factorIndex) => identifier(factor, `Relational inference probe ${id} shared_factor ${factorIndex + 1}`));
    unique(sharedFactors, `Relational inference probe ${id} shared_factors`);
    const sourceRef = probe.source_ref === null ? null : evidenceReference(probe.source_ref, `Relational inference probe ${id} source_ref`);
    const observedOn = probe.observed_on === null ? null : isoDate(probe.observed_on, `Relational inference probe ${id} observed_on`);
    if (observedOn !== null && observedOn > issuedOn)
      throw new Error(`Relational inference probe ${id} cannot be observed after issuance`);
    if (observedOn !== null && observedOn > asOf)
      throw new Error(`Relational inference probe ${id} cannot be observed after validation asOf ${asOf}`);
    const access = oneOf(probe.epistemic_access, RELATIONAL_EPISTEMIC_ACCESS, `Relational inference probe ${id} epistemic_access`);
    const runStatus = oneOf(probe.run_status, RELATIONAL_PROBE_RUN_STATUSES, `Relational inference probe ${id} run_status`);
    if (runStatus === "not-run" && (sourceRef !== null || observedOn !== null || access !== "unknown")) {
      throw new Error(`Relational inference probe ${id} not-run status requires null source_ref, null observed_on, and unknown access`);
    }
    if (runStatus !== "not-run" && (sourceRef === null || observedOn === null || access === "unknown")) {
      throw new Error(`Relational inference probe ${id} completed or inconclusive status requires source_ref, observed_on, and non-unknown access`);
    }
    const result = text(probe.result, `Relational inference probe ${id} result`);
    const limitations = textArray(probe.limitations, `Relational inference probe ${id} limitations`);
    return {
      id,
      kind,
      description,
      context,
      scale,
      sensitivity_scope: sensitivityScope,
      backgrounds,
      selection_effects: selectionEffects,
      shared_factors: sharedFactors,
      source_ref: sourceRef,
      observed_on: observedOn,
      epistemic_access: access,
      run_status: runStatus,
      result,
      limitations
    };
  });
  unique(probes.map((probe) => probe.id), "Relational inference probe ids");
  const probesById = new Map(probes.map((probe) => [probe.id, probe]));
  const dependencies = array(inferenceCase.probe_dependencies, "Relational inference probe_dependencies", 1, 496).map((candidateDependency, index) => {
    const dependency = record(candidateDependency, `Relational inference probe dependency ${index + 1}`);
    exactKeys(dependency, ["probe_ids", "relationship", "basis"], `Relational inference probe dependency ${index + 1}`);
    const probeIds = array(dependency.probe_ids, `Relational inference probe dependency ${index + 1} probe_ids`, 2, 2).map((probeId, probeIndex) => identifier(probeId, `Relational inference probe dependency ${index + 1} probe_id ${probeIndex + 1}`));
    if (probeIds[0] === probeIds[1])
      throw new Error(`Relational inference probe dependency ${index + 1} cannot pair a probe with itself`);
    for (const probeId of probeIds) {
      if (!probesById.has(probeId))
        throw new Error(`Relational inference probe dependency ${index + 1} references missing probe ${probeId}`);
    }
    const relationship = oneOf(dependency.relationship, RELATIONAL_PROBE_DEPENDENCIES, `Relational inference probe dependency ${index + 1} relationship`);
    text(dependency.basis, `Relational inference probe dependency ${index + 1} basis`);
    const [first, second] = probeIds.map((probeId) => probesById.get(probeId));
    const firstFactors = new Set(first.shared_factors);
    const sharedFactorIntersection = second.shared_factors.filter((factor) => firstFactors.has(factor));
    if (relationship === "independent") {
      if (sharedFactorIntersection.length > 0) {
        throw new Error(`Relational inference probes ${probeIds.join(" and ")} share a declared factor and cannot be declared independent`);
      }
      if (first.source_ref !== null && second.source_ref !== null && canonicalReferenceAlias(first.source_ref) === canonicalReferenceAlias(second.source_ref)) {
        throw new Error(`Relational inference probes ${probeIds.join(" and ")} use the same or canonically aliased source_ref and cannot be declared independent`);
      }
    }
    if (["partially-shared", "shared-systematic"].includes(relationship) && sharedFactorIntersection.length === 0) {
      throw new Error(`Relational inference probes ${probeIds.join(" and ")} declared ${relationship} must name at least one shared factor`);
    }
    return { probe_ids: probeIds, relationship, basis: dependency.basis };
  });
  const dependencyByPair = new Map;
  for (const dependency of dependencies) {
    const key = pairKey(dependency.probe_ids[0], dependency.probe_ids[1]);
    if (dependencyByPair.has(key))
      throw new Error(`Relational inference probe dependency pair ${dependency.probe_ids.join(" / ")} is duplicated`);
    dependencyByPair.set(key, dependency);
  }
  const expectedDependencyCount = probes.length * (probes.length - 1) / 2;
  if (dependencies.length !== expectedDependencyCount) {
    throw new Error(`Relational inference probe_dependencies must cover all ${expectedDependencyCount} unordered probe pairs exactly once`);
  }
  for (let first = 0;first < probes.length; first++) {
    for (let second = first + 1;second < probes.length; second++) {
      if (!dependencyByPair.has(pairKey(probes[first].id, probes[second].id))) {
        throw new Error(`Relational inference probe_dependencies is missing pair ${probes[first].id} / ${probes[second].id}`);
      }
    }
  }
  const candidateModels = array(inferenceCase.candidate_models, "Relational inference candidate_models", 2, 16).map((candidateModel, index) => {
    const model = record(candidateModel, `Relational inference candidate model ${index + 1}`);
    exactKeys(model, [
      "id",
      "role",
      "description",
      "assumptions",
      "probe_assessments",
      "falsifier_or_refinement_condition",
      "status"
    ], `Relational inference candidate model ${index + 1}`);
    const id = identifier(model.id, `Relational inference candidate model ${index + 1} id`);
    const role = oneOf(model.role, RELATIONAL_MODEL_ROLES, `Relational inference candidate model ${id} role`);
    text(model.description, `Relational inference candidate model ${id} description`);
    const assumptions = textArray(model.assumptions, `Relational inference candidate model ${id} assumptions`);
    const assessments = array(model.probe_assessments, `Relational inference candidate model ${id} probe_assessments`, probes.length, probes.length).map((candidateAssessment, assessmentIndex) => {
      const assessment = record(candidateAssessment, `Relational inference candidate model ${id} assessment ${assessmentIndex + 1}`);
      exactKeys(assessment, ["probe_id", "expectation", "result", "residual"], `Relational inference candidate model ${id} assessment ${assessmentIndex + 1}`);
      const probeId = identifier(assessment.probe_id, `Relational inference candidate model ${id} assessment ${assessmentIndex + 1} probe_id`);
      if (!probesById.has(probeId))
        throw new Error(`Relational inference candidate model ${id} assessment references missing probe ${probeId}`);
      text(assessment.expectation, `Relational inference candidate model ${id} assessment ${probeId} expectation`);
      const result = oneOf(assessment.result, RELATIONAL_PROBE_ASSESSMENT_RESULTS, `Relational inference candidate model ${id} assessment ${probeId} result`);
      text(assessment.residual, `Relational inference candidate model ${id} assessment ${probeId} residual`);
      if (probesById.get(probeId).run_status === "not-run" && result !== "unassessed") {
        throw new Error(`Relational inference candidate model ${id} must leave not-run probe ${probeId} unassessed`);
      }
      return { probe_id: probeId, expectation: assessment.expectation, result, residual: assessment.residual };
    });
    sameMembers(assessments.map((assessment) => assessment.probe_id), probes.map((probe) => probe.id), `Relational inference candidate model ${id} assessment probe_ids`);
    const falsifierOrRefinementCondition = text(model.falsifier_or_refinement_condition, `Relational inference candidate model ${id} falsifier_or_refinement_condition`);
    const status = oneOf(model.status, RELATIONAL_MODEL_STATUSES, `Relational inference candidate model ${id} status`);
    const allUnassessed = assessments.every((assessment) => assessment.result === "unassessed");
    if (status === "unassessed" !== allUnassessed) {
      throw new Error(`Relational inference candidate model ${id} status must be unassessed if and only if every assessment is unassessed`);
    }
    const nonUnassessed = assessments.filter((assessment) => assessment.result !== "unassessed");
    if (status === "live" && (!nonUnassessed.some((assessment) => assessment.result === "compatible") || nonUnassessed.every((assessment) => assessment.result === "contradicted-under-test"))) {
      throw new Error(`Relational inference candidate model ${id} live status requires a compatible non-unassessed assessment and cannot have every assessed probe contradicted`);
    }
    if (status === "constrained" && !assessments.some((assessment) => ["tension", "contradicted-under-test"].includes(assessment.result))) {
      throw new Error(`Relational inference candidate model ${id} constrained status requires a tension or contradicted assessment`);
    }
    if (status === "contradicted-under-test" && !assessments.some((assessment) => assessment.result === "contradicted-under-test")) {
      throw new Error(`Relational inference candidate model ${id} contradicted status requires a contradicted assessment`);
    }
    return {
      id,
      role,
      description: model.description,
      assumptions,
      probe_assessments: assessments,
      falsifier_or_refinement_condition: falsifierOrRefinementCondition,
      status
    };
  });
  unique(candidateModels.map((model) => model.id), "Relational inference candidate model ids");
  if (!candidateModels.some((model) => model.role !== "working" && ["live", "constrained", "unassessed"].includes(model.status))) {
    throw new Error("Relational inference requires at least one non-working unresolved alternative, null, or unknown model");
  }
  const inference = record(inferenceCase.inference, "Relational inference conclusion");
  exactKeys(inference, [
    "method",
    "comparison_space",
    "current_conclusion",
    "conclusion_status",
    "declared_confidence",
    "confidence_basis",
    "unmodeled_alternatives",
    "next_discriminating_test",
    "stop_condition"
  ], "Relational inference conclusion");
  text(inference.method, "Relational inference method");
  text(inference.comparison_space, "Relational inference comparison_space");
  text(inference.current_conclusion, "Relational inference current_conclusion");
  const conclusionStatus = oneOf(inference.conclusion_status, RELATIONAL_CONCLUSION_STATUSES, "Relational inference conclusion_status");
  const confidence = oneOf(inference.declared_confidence, RELATIONAL_CONFIDENCE_LEVELS, "Relational inference declared_confidence");
  text(inference.confidence_basis, "Relational inference confidence_basis");
  textArray(inference.unmodeled_alternatives, "Relational inference unmodeled_alternatives");
  text(inference.next_discriminating_test, "Relational inference next_discriminating_test");
  text(inference.stop_condition, "Relational inference stop_condition");
  const completedProbeIds = new Set(probes.filter((probe) => probe.run_status === "completed").map((probe) => probe.id));
  const assessedCompletedByModel = new Map(candidateModels.map((model) => [
    model.id,
    new Set(model.probe_assessments.filter((assessment) => assessment.result !== "unassessed" && completedProbeIds.has(assessment.probe_id)).map((assessment) => assessment.probe_id))
  ]));
  if (conclusionStatus === "model-contrast") {
    const contrastedCommonProbe = [...completedProbeIds].some((probeId) => [...assessedCompletedByModel.values()].filter((probeIds) => probeIds.has(probeId)).length >= 2);
    if (!contrastedCommonProbe) {
      throw new Error("Model-contrast conclusion requires at least two candidate models assessed on one common completed probe; planned or unassessed contrasts are not conclusions");
    }
  }
  if (confidence === "medium") {
    const requiredModelCount = conclusionStatus === "model-contrast" ? 2 : 1;
    const sufficientPair = [...dependencyByPair.values()].some((dependency) => {
      if (!["independent", "partially-shared"].includes(dependency.relationship))
        return false;
      const modelsAssessingBoth = [...assessedCompletedByModel.values()].filter((probeIds) => probeIds.has(dependency.probe_ids[0]) && probeIds.has(dependency.probe_ids[1]));
      return modelsAssessingBoth.length >= requiredModelCount;
    });
    if (!sufficientPair) {
      throw new Error(`Medium declared confidence requires one sufficiently separated completed probe pair assessed within the same ${conclusionStatus === "model-contrast" ? "two candidate models" : "candidate model"}; the dependency and assessment declarations are not verified`);
    }
  }
  const boundaries = record(inferenceCase.boundaries, "Relational inference boundaries");
  exactKeys(boundaries, [
    "representation_scope",
    "privacy",
    "actionability",
    "authority_scope",
    "authority_basis",
    "authority_ref",
    "consent_status",
    "consent_subject",
    "consent_scope",
    "consent_basis",
    "consent_ref"
  ], "Relational inference boundaries");
  oneOf(boundaries.representation_scope, ["none", "artifact-public"], "Relational inference representation_scope");
  oneOf(boundaries.privacy, ["public-only", "redacted"], "Relational inference privacy");
  if (boundaries.actionability !== "descriptive") {
    throw new Error("Relational inference actionability must remain descriptive");
  }
  if (boundaries.consent_status !== "not-applicable") {
    throw new Error("Relational inference consent_status must remain not-applicable");
  }
  const provenanceKeys = [
    "authority_scope",
    "authority_basis",
    "authority_ref",
    "consent_subject",
    "consent_scope",
    "consent_basis",
    "consent_ref"
  ];
  for (const key of provenanceKeys) {
    if (boundaries[key] !== null) {
      throw new Error(`Relational inference boundaries ${key} must remain null in the public descriptive v0.1 contract`);
    }
  }
  const harm = record(inferenceCase.harm_boundary, "Relational inference harm_boundary");
  exactKeys(harm, [
    "observable_effect",
    "causal_status",
    "duty_status",
    "intent_status",
    "affected_relations",
    "next_repair_action",
    "unobserved_is_not_deception",
    "privacy_is_not_deception",
    "protective_nondisclosure_may_be_permissible"
  ], "Relational inference harm_boundary");
  text(harm.observable_effect, "Relational inference harm observable_effect");
  oneOf(harm.causal_status, ["none-observed", "possible", "unknown"], "Relational inference harm causal_status");
  oneOf(harm.duty_status, ["not-assessed", "external-process-required"], "Relational inference harm duty_status");
  if (harm.intent_status !== "not-assessed")
    throw new Error("Relational inference harm intent_status must remain not-assessed");
  textArray(harm.affected_relations, "Relational inference harm affected_relations");
  text(harm.next_repair_action, "Relational inference harm next_repair_action");
  for (const key of [
    "unobserved_is_not_deception",
    "privacy_is_not_deception",
    "protective_nondisclosure_may_be_permissible"
  ]) {
    if (harm[key] !== true)
      throw new Error(`Relational inference harm ${key} must remain true`);
  }
  const repair = record(inferenceCase.repair, "Relational inference repair");
  exactKeys(repair, [
    "relation",
    "target_case_id",
    "reply_route",
    "correction_route",
    "carry_challenges_forward",
    "retain_prior_nonsensitive_case"
  ], "Relational inference repair");
  const repairRelation = oneOf(repair.relation, ["original", "corrects", "supersedes", "withdraws"], "Relational inference repair relation");
  const targetCaseId = repair.target_case_id === null ? null : identifier(repair.target_case_id, "Relational inference repair target_case_id");
  if (repairRelation === "original" !== (targetCaseId === null)) {
    throw new Error("An original case must have a null target; a repair case must name a target case identifier");
  }
  if (targetCaseId === caseId)
    throw new Error("A relational inference case cannot repair itself");
  text(repair.reply_route, "Relational inference repair reply_route");
  text(repair.correction_route, "Relational inference repair correction_route");
  if (repair.carry_challenges_forward !== true) {
    throw new Error("Relational inference repair must carry material challenges forward");
  }
  if (repair.retain_prior_nonsensitive_case !== true) {
    throw new Error("Relational inference repair must retain the prior non-sensitive case");
  }
  const safety = record(inferenceCase.safety, "Relational inference safety");
  const safetyKeys = [
    "proves_truth",
    "proves_hidden_cause",
    "proves_causation",
    "proves_fidelity",
    "proves_identity",
    "proves_understanding",
    "infers_intent",
    "labels_deception",
    "rates_people",
    "grants_authority",
    "grants_consent",
    "permits_surveillance"
  ];
  exactKeys(safety, safetyKeys, "Relational inference safety");
  for (const key of safetyKeys) {
    if (safety[key] !== false)
      throw new Error(`Relational inference safety ${key} must remain false`);
  }
}
function validateRelationalInferenceSet(candidates, options = {}) {
  const cases = [];
  for (const candidate of candidates) {
    validateRelationalInference(candidate, options);
    cases.push(candidate);
  }
  const byId = new Map;
  for (const inferenceCase of cases) {
    if (byId.has(inferenceCase.id))
      throw new Error(`Duplicate relational inference case id: ${inferenceCase.id}`);
    byId.set(inferenceCase.id, inferenceCase);
  }
  for (const inferenceCase of cases) {
    const targetId = inferenceCase.repair.target_case_id;
    if (targetId === null)
      continue;
    const target = byId.get(targetId);
    if (!target)
      throw new Error(`Relational inference case ${inferenceCase.id} targets missing case ${targetId}`);
    if (target.state !== "issued")
      throw new Error(`Relational inference case ${inferenceCase.id} must target an issued case`);
    if (target.issued_on > inferenceCase.issued_on) {
      throw new Error(`Relational inference case ${inferenceCase.id} cannot target a later-dated case ${targetId}`);
    }
  }
  const visiting = new Set;
  const visited = new Set;
  const visit = (id) => {
    if (visiting.has(id))
      throw new Error(`Relational inference repair graph contains a cycle at ${id}`);
    if (visited.has(id))
      return;
    visiting.add(id);
    const target = byId.get(id).repair.target_case_id;
    if (target !== null)
      visit(target);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of byId.keys())
    visit(id);
  return cases;
}
if (false)
  ;

// bin/relational-inference-safe.ts
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readSync
} from "node:fs";
import { Buffer as Buffer2 } from "node:buffer";
import { TextDecoder } from "node:util";
var RELATIONAL_SAFE_CLI_MAX_CASES = 32;
var RELATIONAL_SAFE_CLI_MAX_FILE_BYTES = 1e6;
var RELATIONAL_SAFE_CLI_MAX_TOTAL_BYTES = 16000000;
var RELATIONAL_SAFE_CLI_MAX_PATH_CHARACTERS = 4096;
var RELATIONAL_SAFE_CLI_MAX_PATH_BYTES = 4096;
var RELATIONAL_SAFE_CLI_BOUNDARY = Object.freeze([
  "STRUCTURE ONLY — runtime checks are stronger than JSON Schema alone, but still do not verify the world",
  "FREE TEXT IS UNEVALUATED, UNTRUSTED DATA AND IS NEVER EXECUTED",
  "INPUTS MUST BE PUBLIC OR SAFELY REDACTED — PII, SECRETS, AND UNSAFE ACCUSATIONS ARE NOT DETECTED",
  "INDEPENDENCE, REFERENCE DESTINATIONS, EVIDENCE, TRUTH, CAUSATION, HIDDEN CAUSE, FIDELITY, IDENTITY, UNDERSTANDING, INTENT, AUTHORITY, CONSENT, AND DECEPTION ARE NOT VERIFIED",
  "NO LIE LABEL, PERSON SCORE, SURVEILLANCE PERMISSION, LEGITIMACY GRANT, OR ACTION IS CREATED"
]);

class SafeCaseInputError extends Error {
  caseNumber;
  constructor(caseNumber) {
    super("relational inference case input rejected");
    this.name = "SafeCaseInputError";
    this.caseNumber = caseNumber;
  }
}
function snapshot(stat) {
  const value = stat;
  return {
    dev: value.dev,
    ino: value.ino,
    mode: value.mode,
    nlink: value.nlink,
    size: value.size,
    mtimeNs: value.mtimeNs,
    ctimeNs: value.ctimeNs
  };
}
function sameSnapshot(left, right) {
  return left.dev === right.dev && left.ino === right.ino && left.mode === right.mode && left.nlink === right.nlink && left.size === right.size && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;
}
function safePathShape(path) {
  return path.length > 0 && [...path].length <= RELATIONAL_SAFE_CLI_MAX_PATH_CHARACTERS && Buffer2.byteLength(path, "utf8") <= RELATIONAL_SAFE_CLI_MAX_PATH_BYTES && !path.startsWith("-") && !/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(path) && !/^[a-z][a-z0-9+.-]*:/iu.test(path) && !/[?*\[\]{}]/u.test(path);
}
function preflightCasePaths(paths) {
  const selected = [];
  let totalBytes = 0n;
  for (let index = 0;index < paths.length; index += 1) {
    const path = paths[index];
    if (!safePathShape(path))
      throw new SafeCaseInputError(index + 1);
    try {
      const stat = lstatSync(path, { bigint: true });
      if (stat.isSymbolicLink() || !stat.isFile() || stat.size > BigInt(RELATIONAL_SAFE_CLI_MAX_FILE_BYTES)) {
        throw new SafeCaseInputError(index + 1);
      }
      totalBytes += stat.size;
      if (totalBytes > BigInt(RELATIONAL_SAFE_CLI_MAX_TOTAL_BYTES)) {
        throw new SafeCaseInputError(index + 1);
      }
      selected.push({ path, snapshot: snapshot(stat) });
    } catch (error) {
      if (error instanceof SafeCaseInputError)
        throw error;
      throw new SafeCaseInputError(index + 1);
    }
  }
  return selected;
}
function readStableUtf8(input, caseNumber) {
  let descriptor = null;
  try {
    if (!Number.isInteger(constants.O_NOFOLLOW) || !Number.isInteger(constants.O_NONBLOCK)) {
      throw new SafeCaseInputError(caseNumber);
    }
    descriptor = openSync(input.path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const before = fstatSync(descriptor, { bigint: true });
    const beforeSnapshot = snapshot(before);
    if (!before.isFile() || before.size > BigInt(RELATIONAL_SAFE_CLI_MAX_FILE_BYTES) || !sameSnapshot(input.snapshot, beforeSnapshot)) {
      throw new SafeCaseInputError(caseNumber);
    }
    const bytes = Buffer2.alloc(Number(before.size));
    let offset = 0;
    while (offset < bytes.length) {
      const count = readSync(descriptor, bytes, offset, bytes.length - offset, null);
      if (count === 0)
        throw new SafeCaseInputError(caseNumber);
      offset += count;
    }
    const after = fstatSync(descriptor, { bigint: true });
    if (!after.isFile() || !sameSnapshot(beforeSnapshot, snapshot(after))) {
      throw new SafeCaseInputError(caseNumber);
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    if (error instanceof SafeCaseInputError)
      throw error;
    throw new SafeCaseInputError(caseNumber);
  } finally {
    if (descriptor !== null) {
      try {
        closeSync(descriptor);
      } catch {}
    }
  }
}
function printBoundary(stream) {
  const write = stream === "stdout" ? console.log : console.error;
  for (const line of RELATIONAL_SAFE_CLI_BOUNDARY)
    write(line);
}
function printUsage() {
  printBoundary("stderr");
  console.error("usage: relational-inference validate <case.json> [...] (1-32 explicit local files)");
}
function runRelationalInferenceSafeCli(argv = process.argv.slice(2)) {
  const [command, ...paths] = argv;
  if (command !== "validate" || paths.length < 1 || paths.length > RELATIONAL_SAFE_CLI_MAX_CASES) {
    printUsage();
    return 64;
  }
  let inputs;
  try {
    inputs = preflightCasePaths(paths);
  } catch (error) {
    printBoundary("stderr");
    const caseNumber = error instanceof SafeCaseInputError ? error.caseNumber : 1;
    console.error(`case ${caseNumber}: input rejected`);
    return 1;
  }
  const candidates = [];
  const asOf = new Date().toISOString().slice(0, 10);
  for (let index = 0;index < inputs.length; index += 1) {
    try {
      const source = readStableUtf8(inputs[index], index + 1);
      const candidate = parseRelationalInferenceJson(source, "case");
      validateRelationalInference(candidate, { asOf });
      candidates.push(candidate);
    } catch {
      printBoundary("stderr");
      console.error(`case ${index + 1}: structurally invalid`);
      return 1;
    }
  }
  try {
    validateRelationalInferenceSet(candidates, { asOf });
  } catch {
    printBoundary("stderr");
    for (let index = 0;index < candidates.length; index += 1) {
      console.error(`case ${index + 1}: structurally invalid as a set`);
    }
    return 1;
  }
  printBoundary("stdout");
  for (let index = 0;index < candidates.length; index += 1) {
    console.log(`case ${index + 1}: structurally valid`);
  }
  return 0;
}

// bin/relational-inference-standalone.ts
var schemasHaveExpectedIdentity = RELATIONAL_INFERENCE_JSON_SCHEMA.$id === "urn:kingdom:schema:relational-inference-case:0.1" && SEMANTIC_TRANSITION_JSON_SCHEMA.$id === "urn:kingdom:semantic-transition:0.1";
if (!schemasHaveExpectedIdentity) {
  console.error("relational inference artifact: bundled schema integrity failure");
  process.exitCode = 1;
} else {
  process.exitCode = runRelationalInferenceSafeCli(process.argv.slice(2));
}
export {
  SEMANTIC_TRANSITION_JSON_SCHEMA,
  RELATIONAL_INFERENCE_JSON_SCHEMA
};
