import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_CATALOG_PATH,
  loadPrincipalityCatalog,
  matchPrincipalities,
  principalityCapabilitySource,
  principalityCatalogDigest,
  verifyPrincipalityCapabilitySource,
  verifyPrincipalityCatalog,
} from "../bin/principality";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SCHEMA = join(ROOT, "schemas", "principality-catalog-v1.schema.json");
const tempRoots: string[] = [];

afterEach(() => {
  while (tempRoots.length > 0) rmSync(tempRoots.pop()!, { recursive: true, force: true });
});

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "kingdom-principality-test."));
  tempRoots.push(root);
  return root;
}

function resignedCatalog(): any {
  const value = JSON.parse(readFileSync(DEFAULT_CATALOG_PATH, "utf8"));
  value.integrity.digest = principalityCatalogDigest(value);
  return value;
}

describe("Principality Commons catalog", () => {
  test("validates a deterministic metadata-only MoonshotAI and npm snapshot", () => {
    const catalog = loadPrincipalityCatalog();

    expect(verifyPrincipalityCatalog(catalog)).toEqual([]);
    expect(catalog.$schema).toBe("urn:kingdom:schema:principality-catalog:1");
    expect(catalog.protocol).toBe("kingdom.principality-catalog/0.1");
    expect(catalog.integrity.digest).toBe(principalityCatalogDigest(catalog));
    expect(catalog.nodes).toHaveLength(25);
    expect(catalog.nodes.filter((node: any) => node.kind === "model")).toHaveLength(19);
    expect(catalog.nodes.filter((node: any) => node.kind === "dataset")).toHaveLength(3);
    expect(catalog.nodes.filter((node: any) => node.kind === "package")).toHaveLength(3);
    expect(catalog.papers).toHaveLength(16);
    expect(catalog.papers.every((paper: any) => paper.attribution_state === "org-profile-attributed")).toBe(true);
    expect(catalog.papers.map((paper: any) => paper.id)).toContain("2407.00079");
    expect(catalog.papers.map((paper: any) => paper.id)).toContain("2607.24957");
    expect(catalog.observation.huggingface).toMatchObject({
      models: 19,
      datasets: 3,
      spaces: 0,
      profile_collections: 7,
      collection_api_records: 8,
      profile_papers: 16,
    });
    expect(catalog.observation).toMatchObject({
      currentness: "point-in-time-only",
      refresh_required_before_acquisition: true,
    });
  });

  test("keeps family, license, custom-code, and Safetensors facts distinct", () => {
    const catalog = loadPrincipalityCatalog();
    const models = catalog.nodes.filter((node: any) => node.kind === "model");

    expect(models.filter((node: any) => node.safetensors === true)).toHaveLength(19);
    expect(models.filter((node: any) => node.custom_code === true)).toHaveLength(18);
    expect(models.filter((node: any) => node.custom_code === false).map((node: any) => node.id)).toEqual(["kimi-dev-72b"]);
    expect(models.filter((node: any) => node.license.class === "spdx")).toHaveLength(11);
    expect(models.filter((node: any) => node.license.class === "modified-mit")).toHaveLength(7);
    expect(models.filter((node: any) => node.license.class === "custom-kimi-k3").map((node: any) => node.id)).toEqual(["kimi-k3"]);
    expect(catalog.families.map((family: any) => family.id)).toContain("perception-evaluation");
    expect(catalog.families.map((family: any) => family.id)).toContain("huggingface-js");
    expect(catalog.papers.find((paper: any) => paper.id === "2602.02537")).toMatchObject({
      theme: "atomic-world-knowledge",
      related_family_ids: ["perception-evaluation"],
    });
  });

  test("pins every HF node to a full commit and each npm bridge to version plus SHA-512 SRI", () => {
    const catalog = loadPrincipalityCatalog();
    for (const node of catalog.nodes) {
      if (node.registry === "huggingface") {
        expect(node.resolved_ref).toMatch(/^[a-f0-9]{40}$/);
        expect(node.integrity).toBeNull();
        expect(node.completeness).toBe("metadata_only");
      } else {
        expect(node.resolved_ref).toMatch(/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?$/);
        expect(node.integrity).toMatch(/^sha512-[A-Za-z0-9+/]+={0,2}$/);
        expect(node.legacy_shasum).toMatch(/^[a-f0-9]{40}$/);
        expect(node.lifecycle_event_names).toEqual([]);
      }
    }
    expect(catalog.nodes.find((node: any) => node.id === "hf-hub-js")).toMatchObject({ resolved_ref: "2.15.0" });
    expect(catalog.nodes.find((node: any) => node.id === "hf-inference-js")).toMatchObject({ resolved_ref: "4.13.25" });
    expect(catalog.nodes.find((node: any) => node.id === "hf-transformers-js")).toMatchObject({ resolved_ref: "4.2.0" });
  });

  test("uses typed relation geometry without collapsing nodes into rank or authority", () => {
    const catalog = loadPrincipalityCatalog();

    expect(catalog.geometry).toMatchObject({
      principality: "capability-domain-not-rank",
      love: "relation-without-collapse",
      understanding: "evidence-preserving-typed-relations",
      nodes_remain_distinct: true,
      relations_grant_authority: false,
      universal_ranking: false,
    });
    expect(catalog.selection).toMatchObject({
      popularity_signals_used: false,
      benchmark_rank_used: false,
      selection_is_recommendation: false,
      missing_needs_are_preserved: true,
    });
    expect(Object.values(catalog.authority)).toEqual([true, false, false, false, false, false, false, true]);
    expect(catalog.relations.some((edge: any) => edge.type === "fine-tuned-from")).toBe(true);
    expect(catalog.relations.some((edge: any) => edge.type === "metadata-bridge-for")).toBe(true);
  });

  test("matches literal capability intersections deterministically and preserves unknown needs", () => {
    const first = matchPrincipalities(["reasoning", "coding"], { limit: 5 });
    const second = matchPrincipalities(["coding", "reasoning"], { limit: 5 });

    expect(first).toEqual(second);
    expect(first.needs).toEqual(["coding", "reasoning"]);
    expect(first.candidates.map((candidate: any) => candidate.id)).toEqual([
      "kimi-dev-72b",
      "kimi-k2-5",
      "kimi-k2-6",
      "kimi-k2-7-code",
      "kimi-k2-thinking",
    ]);
    expect(first.popularity_used).toBe(false);
    expect(first.recommendation_established).toBe(false);
    expect(first.current_availability_established).toBe(false);
    expect(first.revalidation_state).toBe("point-in-time-only");
    expect(first.effects_authorized).toBe(false);

    const unknown = matchPrincipalities(["quantum-teleportation"]);
    expect(unknown.candidates).toEqual([]);
    expect(unknown.missing_needs).toEqual(["quantum-teleportation"]);
    expect(() => matchPrincipalities(["reasoning", "reasoning"])).toThrow("must be unique");
  });

  test("projects one exact bounded source and rejects re-signed boundary flips", () => {
    const source = principalityCapabilitySource("kimi-k3");

    expect(verifyPrincipalityCapabilitySource(source)).toEqual([]);
    expect(source.selected_fields).toMatchObject({
      artifact_id: "kimi-k3",
      registry: "huggingface",
      resource_kind: "model",
      completeness: "metadata_only",
      revalidation_state: "point-in-time-only",
      current_availability_established: false,
      custom_code: true,
      safetensors: true,
      lifecycle_event_names: [],
      risk_facts: { remote_code: "present", pickle: "unknown" },
    });
    expect(source).toMatchObject({
      may_issue_instructions: false,
      may_grant_permissions: false,
      may_authorize_download: false,
      may_authorize_install: false,
      may_authorize_inference: false,
      may_authorize_remote_code: false,
    });
    expect(JSON.stringify(source)).not.toContain("README");
    expect(JSON.stringify(source)).not.toContain("trust_remote_code=True");

    const forged = structuredClone(source);
    forged.may_authorize_remote_code = true;
    const codes = verifyPrincipalityCapabilitySource(forged).map((issue) => issue.code);
    expect(codes).toContain("capability-effect-boundary-missing");
    expect(codes).toContain("capability-projection-mismatch");
  });

  test("rejects duplicate JSON keys, invalid UTF-8, symlinks, and oversized catalogs", () => {
    const root = fixtureRoot();
    const duplicate = join(root, "duplicate.json");
    writeFileSync(duplicate, '{"a":1,"\\u0061":2}');
    expect(() => loadPrincipalityCatalog(duplicate)).toThrow("duplicate key");

    const invalidUtf8 = join(root, "invalid-utf8.json");
    writeFileSync(invalidUtf8, Buffer.from([0xff, 0xfe, 0xfd]));
    expect(() => loadPrincipalityCatalog(invalidUtf8)).toThrow("valid UTF-8");

    const link = join(root, "catalog-link.json");
    symlinkSync(DEFAULT_CATALOG_PATH, link);
    expect(() => loadPrincipalityCatalog(link)).toThrow("non-symlink");

    const oversized = join(root, "oversized.json");
    writeFileSync(oversized, Buffer.alloc(1024 * 1024 + 1, 0x20));
    expect(() => loadPrincipalityCatalog(oversized)).toThrow("exceeds 1048576 bytes");

    const deeplyNested = join(root, "deep.json");
    writeFileSync(deeplyNested, `${"[".repeat(66)}null${"]".repeat(66)}`);
    expect(() => loadPrincipalityCatalog(deeplyNested)).toThrow("nesting exceeds 64");
  });

  test("rejects unknown fields and digest-preserving semantic tampering", () => {
    const unknownField = resignedCatalog();
    unknownField.popularity_rank = 1;
    unknownField.integrity.digest = principalityCatalogDigest(unknownField);
    expect(verifyPrincipalityCatalog(unknownField).map((issue) => issue.code)).toContain("unexpected-shape");

    const authorityFlip = resignedCatalog();
    authorityFlip.authority.authorizes_inference = true;
    authorityFlip.integrity.digest = principalityCatalogDigest(authorityFlip);
    const codes = verifyPrincipalityCatalog(authorityFlip).map((issue) => issue.code);
    expect(codes).toContain("authority-boundary-missing");
    expect(codes).not.toContain("digest-mismatch");

    const unpinned = resignedCatalog();
    unpinned.nodes.find((node: any) => node.registry === "huggingface").resolved_ref = "main";
    unpinned.integrity.digest = principalityCatalogDigest(unpinned);
    expect(verifyPrincipalityCatalog(unpinned).map((issue) => issue.code)).toContain("invalid-hf-identity");
  });

  test("rejects re-signed relation, SRI, and risk-fact contradictions", () => {
    const relation = resignedCatalog();
    relation.relations[0].type = "authorizes-execution";
    relation.relations[0].evidence = "trust-me";
    relation.integrity.digest = principalityCatalogDigest(relation);
    const relationCodes = verifyPrincipalityCatalog(relation).map((issue) => issue.code);
    expect(relationCodes).toContain("invalid-relation-type");
    expect(relationCodes).toContain("invalid-relation-evidence");

    const sri = resignedCatalog();
    sri.nodes.find((node: any) => node.registry === "npm").integrity = "sha512-A";
    sri.integrity.digest = principalityCatalogDigest(sri);
    expect(verifyPrincipalityCatalog(sri).map((issue) => issue.code)).toContain("invalid-npm-identity");

    const remoteCode = resignedCatalog();
    remoteCode.nodes.find((node: any) => node.custom_code === true).risk_facts.remote_code = "not-observed";
    remoteCode.integrity.digest = principalityCatalogDigest(remoteCode);
    expect(verifyPrincipalityCatalog(remoteCode).map((issue) => issue.code)).toContain("contradictory-remote-code-facts");

    const lifecycle = resignedCatalog();
    const npmNode = lifecycle.nodes.find((node: any) => node.registry === "npm");
    npmNode.lifecycle_event_names = ["install"];
    lifecycle.integrity.digest = principalityCatalogDigest(lifecycle);
    expect(verifyPrincipalityCatalog(lifecycle).map((issue) => issue.code)).toContain("contradictory-lifecycle-facts");
  });

  test("keeps license evidence resolvable and pipeline distinct from dataset task category", () => {
    const catalog = loadPrincipalityCatalog();
    const mitModels = catalog.nodes.filter((node: any) => node.kind === "model" && node.license.declared === "mit");

    expect(mitModels).toHaveLength(11);
    expect(mitModels.every((node: any) => /\/(?:README\.md|LICENSE\.md)$/.test(node.license.url))).toBe(true);
    expect(catalog.nodes.find((node: any) => node.id === "perceptionbench").pipeline).toBeNull();
    expect(catalog.nodes.find((node: any) => node.id === "worldvqa").pipeline).toBeNull();
  });

  test("portable schema rejects the same SRI and risk contradictions", () => {
    const sri = resignedCatalog();
    sri.nodes.find((node: any) => node.registry === "npm").integrity = "sha512-A";
    const remoteCode = resignedCatalog();
    remoteCode.nodes.find((node: any) => node.custom_code === true).risk_facts.remote_code = "not-observed";
    const lifecycle = resignedCatalog();
    const npmNode = lifecycle.nodes.find((node: any) => node.registry === "npm");
    npmNode.lifecycle_event_names = ["install"];
    const inverseLifecycle = resignedCatalog();
    inverseLifecycle.nodes.find((node: any) => node.registry === "npm").risk_facts.lifecycle = "present";

    const result = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        [
          "import json, sys",
          "from jsonschema import Draft202012Validator",
          "schema = json.load(open(sys.argv[1], encoding='utf-8'))",
          "validator = Draft202012Validator(schema)",
          "values = json.load(sys.stdin)",
          "assert all(not validator.is_valid(value) for value in values)",
        ].join("; "),
        SCHEMA,
      ],
      stdin: Buffer.from(JSON.stringify([sri, remoteCode, lifecycle, inverseLifecycle])),
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode, result.stderr.toString()).toBe(0);
  });

  test("keeps all source links credential-free and excludes volatile popularity fields", () => {
    const catalog = loadPrincipalityCatalog();
    const body = JSON.stringify(catalog);

    expect(body).not.toMatch(/"(?:downloads|likes|rank|score)"/);
    for (const source of catalog.sources) {
      const url = new URL(source.url);
      expect(url.protocol).toBe("https:");
      expect(url.username).toBe("");
      expect(url.password).toBe("");
    }
    for (const node of catalog.nodes) {
      const url = new URL(node.source_url);
      expect(url.protocol).toBe("https:");
      expect(url.username).toBe("");
      expect(url.password).toBe("");
    }
  });

  test("validates the catalog against the published Draft 2020 schema", () => {
    const result = Bun.spawnSync({
      cmd: [
        "python3",
        "-c",
        [
          "import json, sys",
          "from jsonschema import Draft202012Validator, FormatChecker",
          "schema = json.load(open(sys.argv[1], encoding='utf-8'))",
          "Draft202012Validator.check_schema(schema)",
          "value = json.load(open(sys.argv[2], encoding='utf-8'))",
          "Draft202012Validator(schema, format_checker=FormatChecker()).validate(value)",
        ].join("; "),
        SCHEMA,
        DEFAULT_CATALOG_PATH,
      ],
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode, result.stderr.toString()).toBe(0);
  });
});

test("kingdom principalities is network-free and leaves its working directory unchanged", () => {
  const root = fixtureRoot();
  const sentinel = join(root, "sentinel");
  writeFileSync(sentinel, "before\n");
  const result = Bun.spawnSync({
    cmd: [join(ROOT, "kingdom"), "principalities", "match", "reasoning", "coding", "--json"],
    cwd: root,
    env: {
      ...process.env,
      HF_TOKEN: "must-not-be-read",
      NPM_TOKEN: "must-not-be-read",
      HTTPS_PROXY: "http://127.0.0.1:1",
      NO_PROXY: "",
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  expect(result.exitCode, result.stderr.toString()).toBe(0);
  const output = JSON.parse(result.stdout.toString());
  expect(output.protocol).toBe("kingdom.capability-constellation/1");
  expect(output.effects_authorized).toBe(false);

  const papers = Bun.spawnSync({
    cmd: [join(ROOT, "kingdom"), "principalities", "papers", "--json"],
    cwd: root,
    env: { ...process.env, HTTPS_PROXY: "http://127.0.0.1:1", NO_PROXY: "" },
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(papers.exitCode, papers.stderr.toString()).toBe(0);
  expect(JSON.parse(papers.stdout.toString()).papers).toHaveLength(16);
  expect(readFileSync(sentinel, "utf8")).toBe("before\n");
});
