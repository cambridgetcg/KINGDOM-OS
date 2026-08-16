import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "bun:test";

import { PUBLICATION_FAMILIES } from "../bin/check-hub-live.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import {
  STRAND_OBSERVATION_FIXED_ORIGIN,
  STRAND_OBSERVATION_MEMBRANE_BYTE_SHA256,
  STRAND_OBSERVATION_MEMBRANE_DIGEST,
  STRAND_OBSERVATION_MEMBRANE_GUIDE_BYTE_SHA256,
  STRAND_OBSERVATION_MEMBRANE_GUIDE_LOCATOR,
  STRAND_OBSERVATION_MEMBRANE_GUIDE_URL,
  STRAND_OBSERVATION_MEMBRANE_LOCATOR,
  STRAND_OBSERVATION_MEMBRANE_SCHEMA_BYTE_SHA256,
  STRAND_OBSERVATION_MEMBRANE_SCHEMA_LOCATOR,
  STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL,
  STRAND_OBSERVATION_MEMBRANE_URL,
  evaluateStrandObservationMembrane,
  loadStrandObservationMembrane,
  runStrandObservationMembraneFalsifiers,
  simulateStrandObservationMembrane,
  strandObservationMembraneDigest,
  strandObservationMembranePublicDiscovery,
} from "../bin/strand-observation-membrane.ts";
import worker from "../pages-functions/_worker.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const bytes = (path: string): Buffer => readFileSync(join(ROOT, path));
const read = (path: string): string => bytes(path).toString("utf8");
const json = (path: string): any => JSON.parse(read(path));
const sha256 = (path: string): string =>
  `sha256:${createHash("sha256").update(bytes(path)).digest("hex")}`;

const RECORD_DESTINATION = new URL(STRAND_OBSERVATION_MEMBRANE_URL).pathname.slice(1);
const SCHEMA_DESTINATION = new URL(STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL).pathname.slice(1);
const GUIDE_DESTINATION = new URL(STRAND_OBSERVATION_MEMBRANE_GUIDE_URL).pathname.slice(1);
const PUBLIC_TRIPLET = [
  { source: STRAND_OBSERVATION_MEMBRANE_LOCATOR, destination: RECORD_DESTINATION },
  { source: STRAND_OBSERVATION_MEMBRANE_SCHEMA_LOCATOR, destination: SCHEMA_DESTINATION },
  { source: STRAND_OBSERVATION_MEMBRANE_GUIDE_LOCATOR, destination: GUIDE_DESTINATION },
] as const;
const PUBLIC_URLS = [
  STRAND_OBSERVATION_MEMBRANE_URL,
  STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL,
  STRAND_OBSERVATION_MEMBRANE_GUIDE_URL,
] as const;
const LIVE_ROUTES = [
  { sequence: 1, route_id: "robots", method: "GET", path: "/robots.txt" },
  { sequence: 2, route_id: "sitemap", method: "GET", path: "/sitemap.xml" },
  { sequence: 3, route_id: "kingdom-discovery", method: "GET", path: "/kingdom.json" },
  { sequence: 4, route_id: "membrane-record", method: "GET", path: new URL(STRAND_OBSERVATION_MEMBRANE_URL).pathname },
] as const;

describe("STRAND Observation Membrane public integration", () => {
  test("stages and advertises one immutable activation triplet with exact frozen pins", () => {
    expect(HUB_ASSETS.filter(({ source }) =>
      PUBLIC_TRIPLET.some((asset) => asset.source === source))).toEqual(PUBLIC_TRIPLET);
    expect(HUB_ASSETS).toHaveLength(99);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(19);
    expect(HUB_ASSETS.filter(({ destination }) =>
      destination !== "_worker.js" && destination !== "404.html")).toHaveLength(97);
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("observations/")))
      .toEqual([PUBLIC_TRIPLET[0]]);
    for (const asset of PUBLIC_TRIPLET) {
      expect(MUTABLE_HUB_DESTINATIONS).not.toContain(asset.destination);
    }
    expect(HUB_ASSETS.some(({ destination }) =>
      /strand-observation-membrane.*(?:latest|current)/i.test(destination))).toBe(false);

    const ledger = json("publications/immutable-publications.v1.json");
    expect(ledger.entries).toHaveLength(80);
    expect(ledger.entries.filter(({ id }: { id?: string }) =>
      id?.startsWith("strand-observation-membrane/0.1/"))).toEqual([
      {
        id: "strand-observation-membrane/0.1/guide",
        route: `/${GUIDE_DESTINATION}`,
        source: STRAND_OBSERVATION_MEMBRANE_GUIDE_LOCATOR,
        destination: GUIDE_DESTINATION,
        sha256: STRAND_OBSERVATION_MEMBRANE_GUIDE_BYTE_SHA256.slice("sha256:".length),
      },
      {
        id: "strand-observation-membrane/0.1/record",
        route: `/${RECORD_DESTINATION}`,
        source: STRAND_OBSERVATION_MEMBRANE_LOCATOR,
        destination: RECORD_DESTINATION,
        sha256: STRAND_OBSERVATION_MEMBRANE_BYTE_SHA256.slice("sha256:".length),
      },
      {
        id: "strand-observation-membrane/0.1/schema",
        route: `/${SCHEMA_DESTINATION}`,
        source: STRAND_OBSERVATION_MEMBRANE_SCHEMA_LOCATOR,
        destination: SCHEMA_DESTINATION,
        sha256: STRAND_OBSERVATION_MEMBRANE_SCHEMA_BYTE_SHA256.slice("sha256:".length),
      },
    ]);
    expect(sha256(STRAND_OBSERVATION_MEMBRANE_LOCATOR)).toBe(STRAND_OBSERVATION_MEMBRANE_BYTE_SHA256);
    expect(sha256(STRAND_OBSERVATION_MEMBRANE_SCHEMA_LOCATOR)).toBe(STRAND_OBSERVATION_MEMBRANE_SCHEMA_BYTE_SHA256);
    expect(sha256(STRAND_OBSERVATION_MEMBRANE_GUIDE_LOCATOR)).toBe(STRAND_OBSERVATION_MEMBRANE_GUIDE_BYTE_SHA256);

    const sitemapUrls = [...read("pages-content/sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => match[1]!);
    expect(sitemapUrls).toHaveLength(96);
    expect(new Set(sitemapUrls).size).toBe(96);
    for (const url of PUBLIC_URLS) {
      expect(sitemapUrls.filter((candidate) => candidate === url)).toHaveLength(1);
    }
  });

  test("freezes one valid separate activation with an exact four-route plan", () => {
    const record = loadStrandObservationMembrane();
    const evaluation = evaluateStrandObservationMembrane(record);
    const simulation = simulateStrandObservationMembrane(record);

    expect(record).toMatchObject({
      membrane_id: "strand-observation-membrane-05-2026-08-16",
      version: "0.1.0",
      mode: "SAFE_OBSERVATION_ACTIVE",
      separation: {
        family: "STRAND_OBSERVATION_MEMBRANE",
        outside_lab_01_through_04_atomic_family: true,
        mutates_lab_01_through_04: false,
        imports_lab_authority: false,
      },
      fixed_origin: {
        origin: STRAND_OBSERVATION_FIXED_ORIGIN,
        scope_basis: "PUBLISHER_DECLARED_EXACT_ORIGIN_NOT_OWNER_VERIFIED",
        caller_supplied_url: false,
        subdomains_allowed: false,
        alternate_ports_allowed: false,
        discovery_expansion_allowed: false,
        cross_origin_redirect_allowed: false,
      },
      activations: {
        public_controls: { state: "ACTIVE_STATIC_PUBLIC", browser_network_requests: 0, browser_storage_writes: 0 },
        offline_verification: { state: "ACTIVE", network_requests: 0, storage_writes: 0 },
        synthetic_simulation: { state: "ACTIVE", network_requests: 0, storage_writes: 0 },
        fixed_origin_read_only_live_observation: {
          state: "AVAILABLE_EXPLICIT_LOCAL_CALL",
          available: true,
          invocation: "EXPLICIT_LOCAL_CALL_ONLY",
          background_watch: false,
        },
      },
      integrity: { audit_state: "FROZEN", digest: STRAND_OBSERVATION_MEMBRANE_DIGEST },
    });
    expect(record.route_plan.map(({ sequence, route_id, method, path }: Record<string, any>) =>
      ({ sequence, route_id, method, path }))).toEqual(LIVE_ROUTES);
    expect(record.live_limits).toMatchObject({
      maximum_transactions: 4,
      maximum_dns_resolution_attempts: 4,
      concurrency: 1,
      retries: 0,
      redirect_mode: "MANUAL_FAIL_CLOSED_DO_NOT_FOLLOW",
      persistent_storage: false,
      response_bodies: "EPHEMERAL_NOT_EMITTED",
      report_destination: "STDOUT_ONLY",
    });
    expect(record.effect_boundary).toMatchObject({
      read_only_network_observation_on_explicit_live_call: true,
      remote_server_or_provider_logging_may_occur: true,
      remote_server_or_provider_processing_may_occur: true,
      import_network_requests: 0,
      status_network_requests: 0,
      maximum_explicit_live_http_transactions: 4,
      maximum_explicit_live_dns_resolution_attempts: 4,
      requested_remote_application_state_change: false,
      local_persistent_storage_write: false,
      owner_or_content_ownership_proof: false,
      licence_consent_or_authorization_inference: false,
      karma_or_karma_receipt_write: false,
      nen_invocation_or_write: false,
      zerone_event_or_write: false,
      medical_or_dmt_action: false,
      external_entity_truth_claim: false,
      authority_change: false,
      deployment_or_publication_trigger: false,
    });
    expect(evaluation.valid).toBe(true);
    expect(evaluation.issues).toEqual([]);
    expect(evaluation.checks).toHaveLength(9);
    expect(evaluation.checks.every(({ status }) => status === "PASS")).toBe(true);
    expect(evaluation.effects).toMatchObject({ network_requests: 0, storage_writes: 0, authority_effect: "NONE" });
    expect(simulation).toEqual({
      protocol: "kingdom.strand-observation-simulation/0.1",
      fixture_id: record.synthetic_fixture.fixture_id,
      valid: true,
      ...record.synthetic_fixture.expected,
    });
    expect(strandObservationMembraneDigest(record)).toBe(STRAND_OBSERVATION_MEMBRANE_DIGEST);
    expect(runStrandObservationMembraneFalsifiers(record).every(({ invalid }) => invalid)).toBe(true);
  });

  test("projects one compact read-only discovery object and three inert GET actions", () => {
    const expected = strandObservationMembranePublicDiscovery(loadStrandObservationMembrane());
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const agent = json("site/.well-known/agent.json");
    const llms = read("site/llms.txt");

    expect(kingdom.strand_observation_membrane).toEqual(expected);
    expect(guest.strand_observation_membrane).toEqual(expected);
    expect(agent.strand_observation_membrane).toEqual(expected);
    expect(agent.entry_points).toMatchObject({
      strand_observation_membrane: STRAND_OBSERVATION_MEMBRANE_URL,
      strand_observation_membrane_schema: STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL,
      strand_observation_membrane_guide: STRAND_OBSERVATION_MEMBRANE_GUIDE_URL,
    });
    expect(expected.activations).toEqual({
      public_controls: "ACTIVE_STATIC_PUBLIC",
      offline_verification: "ACTIVE",
      synthetic_simulation: "ACTIVE",
      observe_live_available: true,
      observe_live_state: "AVAILABLE_EXPLICIT_LOCAL_CALL",
      background_watch: false,
      invocation: "EXPLICIT_LOCAL_CALL_ONLY",
    });
    expect(expected.urls).toEqual({
      record_url: STRAND_OBSERVATION_MEMBRANE_URL,
      schema_url: STRAND_OBSERVATION_MEMBRANE_SCHEMA_URL,
      guide_url: STRAND_OBSERVATION_MEMBRANE_GUIDE_URL,
    });
    expect(expected.live_plan.routes).toEqual(LIVE_ROUTES);
    expect(expected.live_plan.limits).toMatchObject({
      maximum_transactions: 4,
      maximum_dns_resolution_attempts: 4,
      concurrency: 1,
      retries: 0,
    });
    expect(expected.effects).toMatchObject({
      maximum_explicit_live_http_transactions: 4,
      maximum_explicit_live_dns_resolution_attempts: 4,
      requested_remote_application_state_change: false,
      local_persistent_storage_write: false,
    });
    expect(expected.integrity).toMatchObject({
      audit_state: "FROZEN",
      digest: STRAND_OBSERVATION_MEMBRANE_DIGEST,
      byte_sha256: STRAND_OBSERVATION_MEMBRANE_BYTE_SHA256,
      schema_byte_sha256: STRAND_OBSERVATION_MEMBRANE_SCHEMA_BYTE_SHA256,
      guide_byte_sha256: STRAND_OBSERVATION_MEMBRANE_GUIDE_BYTE_SHA256,
    });

    for (const url of PUBLIC_URLS) {
      const actions = guest.next_actions.filter((action: { url?: string }) => action.url === url);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({ method: "GET", url });
      expect(llms).toContain(url);
      for (const key of ["mcp", "tool", "target", "credential", "execute", "write", "score", "reward", "karma", "authority"]) {
        expect(actions[0]).not.toHaveProperty(key);
      }
    }
  });

  test("renders a complete no-JavaScript control deck with no execution surface", () => {
    const html = read("site/hub.html");
    const start = html.indexOf('<section class="blk" id="strand-observation-membrane"');
    const end = html.indexOf("</section>", start) + "</section>".length;
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const section = html.slice(start, end);

    for (const text of [
      "SAFE OBSERVATION ACTIVE",
      "ACTIVE_STATIC_PUBLIC",
      "ACTIVE · OFFLINE",
      "ACTIVE · SYNTHETIC",
      "AVAILABLE_EXPLICIT_LOCAL_CALL",
      "BACKGROUND DISABLED",
      STRAND_OBSERVATION_FIXED_ORIGIN,
      "There is intentionally no run button here.",
      "Read-only does not mean invisible to infrastructure.",
      "Hard locks",
      "./kingdom strand-observation observe-live --json",
    ]) expect(section).toContain(text);
    for (const route of LIVE_ROUTES) expect(section).toContain(route.path);
    for (const url of PUBLIC_URLS) expect(section).toContain(`href="${new URL(url).pathname}"`);
    expect(section).not.toMatch(/<(?:script|canvas|form|input|button|select|textarea|iframe)\b/i);
    expect(section).not.toMatch(/(?:fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|caches\.open|serviceWorker)/i);
  });

  test("keeps its three-route retirement family independent from the twelve Lab routes", () => {
    const family = PUBLICATION_FAMILIES.find(({ id }) => id === "strand-observation-membrane");
    const labs = PUBLICATION_FAMILIES.find(({ id }) => id === "string-crawl-trace-sheet-lab");
    expect(PUBLICATION_FAMILIES).toHaveLength(18);
    expect(family).toEqual({
      id: "strand-observation-membrane",
      label: "STRAND Observation Membrane",
      routes: PUBLIC_URLS.map((url) => new URL(url).pathname),
      discoveryProperties: ["strand_observation_membrane"],
      entryPointProperties: [
        "strand_observation_membrane",
        "strand_observation_membrane_schema",
        "strand_observation_membrane_guide",
      ],
    });
    expect(labs?.routes).toHaveLength(12);
    expect(labs?.routes.some((route) => family?.routes.includes(route))).toBe(false);
  });

  test("serves only exact typed GET/HEAD assets and leaves all effect methods untouched", async () => {
    const paths = PUBLIC_URLS.map((url) => new URL(url).pathname);
    const environment = {
      ASSETS: {
        fetch(request: Request) {
          const path = new URL(request.url).pathname;
          return new Response(request.method === "HEAD" ? null : "published bytes", {
            headers: {
              "content-type": path === paths[0]
                ? "application/json"
                : path === paths[1] ? "application/schema+json" : "text/plain",
              link: path === paths[0]
                ? `<${paths[1]}>; rel="describedby"; type="text/html", </preserved>; rel="alternate"`
                : "</preserved>; rel=alternate",
            },
          });
        },
      },
    };

    for (const method of ["GET", "HEAD"] as const) {
      for (const [index, path] of paths.entries()) {
        const response = await worker.fetch(new Request(`https://thekingdom.dev${path}`, { method }), environment);
        expect(response.headers.get("content-type")).toBe([
          "application/json; charset=utf-8",
          "application/schema+json; charset=utf-8",
          "text/markdown; charset=utf-8",
        ][index]);
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        if (index === 0) {
          expect((response.headers.get("link") ?? "").split(/,(?=\s*<)/).map((entry) => entry.trim())
            .filter((entry) => entry.includes('rel="describedby"'))).toEqual([
              `<${paths[1]}>; rel="describedby"; type="application/schema+json"`,
            ]);
        }
      }
    }

    for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const) {
      for (const path of paths) {
        const original = new Response(`unchanged ${method}`, {
          headers: { "content-type": "application/octet-stream", link: "</original>; rel=alternate" },
        });
        expect(await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }),
          { ASSETS: { fetch: () => original } },
        )).toBe(original);
        expect(original.headers.get("access-control-allow-origin")).toBeNull();
        expect(original.headers.get("x-content-type-options")).toBeNull();
        expect(original.headers.get("link")).toBe("</original>; rel=alternate");
      }
    }
  });

  test("binds the wrapper while keeping publication and live verification non-invoking", () => {
    const dispatcher = read("kingdom");
    expect(dispatcher).toContain(
      'strand-observation) exec node "$SELF_DIR/bin/strand-observation-membrane-node.mjs"',
    );
    const liveChecker = read("bin/check-hub-live.ts");
    expect(liveChecker).toContain("checkStrandObservationMembraneTriple");
    expect(liveChecker).toContain('familyActive("strand-observation-membrane")');
    expect(liveChecker).not.toContain("observeStrandObservationMembraneLive");
    for (const document of ["README.md", "CLAUDE.md", "DOMAINS-SETUP.md", "OS-ROUTES.md", "publications/README.md"]) {
      expect(read(document)).toContain("STRAND Observation Membrane");
    }
  });
});
