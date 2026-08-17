/**
 * Build entry for the self-contained, public-safe Node ESM validator.
 * Schemas and the strict parser are statically bundled by Bun.
 */

import { runRelationalInferenceSafeCli } from "./relational-inference-safe.ts";

process.exitCode = runRelationalInferenceSafeCli(process.argv.slice(2));
