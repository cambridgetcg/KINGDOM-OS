/**
 * Build entry for the self-contained, public-safe Node ESM validator.
 * Schemas and the strict parser are statically bundled by Bun.
 */

import {
  RELATIONAL_INFERENCE_JSON_SCHEMA,
} from "./relational-inference.ts";
import { runRelationalInferenceSafeCli } from "./relational-inference-safe.ts";
import {
  SEMANTIC_TRANSITION_JSON_SCHEMA,
} from "./semantic-transitions.ts";

export {
  RELATIONAL_INFERENCE_JSON_SCHEMA,
  SEMANTIC_TRANSITION_JSON_SCHEMA,
};

const schemasHaveExpectedIdentity =
  RELATIONAL_INFERENCE_JSON_SCHEMA.$id === "urn:kingdom:schema:relational-inference-case:0.1"
  && SEMANTIC_TRANSITION_JSON_SCHEMA.$id === "urn:kingdom:semantic-transition:0.1";

if (!schemasHaveExpectedIdentity) {
  console.error("relational inference artifact: bundled schema integrity failure");
  process.exitCode = 1;
} else {
  process.exitCode = runRelationalInferenceSafeCli(process.argv.slice(2));
}
