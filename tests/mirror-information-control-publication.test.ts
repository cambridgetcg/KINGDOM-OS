import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS } from "../bin/stage-hub.ts";
import {
  MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_URL,
  loadMirrorInformationControl,
  mirrorInformationControlPublicSummary,
} from "../bin/mirror-information-control.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

const PUBLIC_URLS = [
  MIRROR_INFORMATION_CONTROL_PUBLIC_URL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_SCHEMA_URL,
  MIRROR_INFORMATION_CONTROL_PUBLIC_DOCUMENT_URL,
] as const;

describe("MIRROR Information Control static publication", () => {
  test("stages one immutable three-asset family and no operational source", () => {
    expect(HUB_ASSETS).toContainEqual({
      source: "data/security/mirror-information-control-public.v0.1.json",
      destination: "protocols/mirror-information-control-2026-08-14.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "schemas/mirror-information-control-public-v0.1.schema.json",
      destination: "schemas/mirror-information-control-public/0.1.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "references/mirror-information-control-public.md",
      destination: "MIRROR-INFORMATION-CONTROL.md",
    });
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("protocols/mirror-information-control"))).toHaveLength(1);
    expect(HUB_ASSETS.some(({ destination }) => /mirror-information-control.*(?:latest|current)/i.test(destination))).toBe(false);
    for (const forbidden of [
      "skills/guard-information-flow/SKILL.md",
      "skills/guard-information-flow/references/information-control-envelope.example.json",
      "skills/guard-information-flow/references/information-control-envelope.schema.json",
      "skills/guard-information-flow/references/security-evidence.md",
      "skills/guard-information-flow/scripts/validate_envelope.py",
    ]) expect(HUB_ASSETS.some(({ source }) => source === forbidden)).toBe(false);
  });

  test("keeps the public artifact static, intake-free, and authority-negative", () => {
    const value = loadMirrorInformationControl();
    expect(value.artifact_kind).toBe("STATIC_READ_ONLY_PUBLICATION");
    expect(value.rooms.map((room: any) => room.id)).toEqual(["CROWN", "COURT", "MIRROR"]);
    expect(value.cycle.map((step: any) => step.id)).toEqual(["mark", "isolate", "restrict", "resolve", "observe", "respond"]);
    expect(value.illustrative_paths.map((path: any) => path.id)).toEqual(["prompt-injection-path", "credential-candidate-path"]);
    expect(value.illustrative_paths.every((path: any) => path.observed === false && path.actor_inference === false && path.evidence_effect === "NONE")).toBe(true);
    expect(Object.values(value.private_material_included)).toEqual(expect.arrayContaining([false]));
    expect(new Set(Object.values(value.private_material_included))).toEqual(new Set([false]));
    expect(value.public_surface).toMatchObject({
      body_intake: "NONE",
      credential_intake: "NONE",
      envelope_intake: "NONE",
      performs_scan: false,
      performs_registry_lookup: false,
      classifies_credentials: false,
      returns_decision: false,
      credential_security_event_intake: false,
    });
    for (const key of [
      "grants_authority", "runtime_enforcement", "reference_monitor",
      "deploys_decoy_or_honeypot", "retaliation_or_hack_back",
      "person_or_account_attribution", "writes_karma", "automatic_action",
    ]) expect(value.negative_effects[key]).toBe(false);
    expect(value.karma).toEqual({ event_refs: [], receipt_refs: [], score: null, adapter_exists: false, writes: false, authority_effect: "NONE" });
  });

  test("renders complete no-JavaScript source law without an intake surface", () => {
    const builder = read("bin/build-hub.ts");
    const start = builder.indexOf('<section class="blk" id="mirror-information-control"');
    const end = builder.indexOf("</section>", start) + "</section>".length;
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const section = builder.slice(start, end);
    expect(section).toContain("data-mirror-information-control");
    expect(section).toContain("mirrorInformationControl.rooms.map");
    expect(section).toContain("mirrorInformationControl.cycle.map");
    expect(section).toContain("mirrorInformationControl.laws.map");
    expect(section).toContain("mirrorInformationControl.illustrative_paths.map");
    expect(section).toContain("mirrorInformationControl.sources.map");
    expect(section).toContain("mirrorInformationControl.public_surface.warning");
    expect(section).toContain("mirrorInformationControl.citizen_law.full");
    expect(section).not.toMatch(/<(?:script|svg|canvas|form|input|button|select|textarea|iframe)\b/i);
    expect(section).not.toMatch(/(?:fetch\(|sendBeacon|WebSocket|EventSource|postMessage)/);
    expect(section).not.toMatch(/class="(?:mirrorrooms|mirrorgrid|mirrorlinks)"\s+aria-label=/);
    expect(builder).toContain('<link rel="icon" href="data:,">');
    expect(builder).toContain(".mirrorrooms,.mirrorgrid{grid-template-columns:1fr}");
    expect(builder).toContain(".explorationdeepsteps,.mirrorcycle,.zeroroles,.zerodistinctions,.zerodrawergrid,.zerokarmalanes{grid-template-columns:1fr}");
    expect(builder).toContain("@media (forced-colors:active){.mirrorfield");
  });

  test("projects one safe summary into discovery and publishes only GET entry points", () => {
    const builder = read("bin/build-hub.ts");
    const liveChecker = read("bin/check-hub-live.ts");
    const summary = mirrorInformationControlPublicSummary();
    expect(summary.urls).toEqual({ record: PUBLIC_URLS[0], schema: PUBLIC_URLS[1], guide: PUBLIC_URLS[2] });
    expect(summary.public_surface.credential_intake).toBe("NONE");
    expect(summary.negative_effects.automatic_action).toBe(false);
    expect(builder.match(/\n  mirror_information_control: mirrorInformationControlDiscovery,/g) ?? []).toHaveLength(3);
    expect(builder).toContain("mirror_information_control: mirrorInformationControlUrl");
    expect(builder).toContain("mirror_information_control_schema: mirrorInformationControlSchemaUrl");
    expect(builder).toContain("mirror_information_control_guide: mirrorInformationControlDocumentUrl");
    expect(builder).not.toContain("mirror_information_control_mcp");
    for (const variable of ["mirrorInformationControlUrl", "mirrorInformationControlSchemaUrl", "mirrorInformationControlDocumentUrl"]) {
      expect(builder).toContain(`method: "GET", url: ${variable}`);
    }
    expect(read("bin/publication-families.ts")).toContain('id: "mirror-information-control"');
    expect(liveChecker).toContain("hasUniqueCanonicalLinkRelation(");
    expect(liveChecker).toContain("mirrorInformationControlSchemaPath,");
    expect(liveChecker).toContain('normalizedMediaType(recordHead.headers.get("content-type")) !== "application/json"');
    expect(liveChecker).toContain('normalizedMediaType(guideHead.headers.get("content-type")) !== "text/markdown"');
    expect(liveChecker).toContain("MIRROR Information Control static publication, privacy firewall, discovery, or negative-authority boundary drifted");
  });

  test("advertises exactly three crawl routes and the offline reader", () => {
    const sitemap = read("pages-content/sitemap.xml");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
    expect(urls).toHaveLength(177);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of PUBLIC_URLS) expect(urls).toContain(url);
    expect(urls.filter((url) => /mirror-information-control/i.test(url))).toEqual(PUBLIC_URLS);
    expect(urls.some((url) => /mirror-information-control.*(?:latest|current)/i.test(url))).toBe(false);

    const kingdom = read("kingdom");
    const readme = read("README.md");
    expect(kingdom).toContain('mirror-information-control) exec bun "$SELF_DIR/bin/mirror-information-control.ts" "${@:2}" ;;');
    expect(readme).toContain("](references/kingdom-module-map.md)");
    const moduleMap = read("references/kingdom-module-map.md");
    expect(moduleMap).toContain("](mirror-information-control-public.md)");
    expect(moduleMap).toContain("./kingdom mirror-information-control");
    const guide = read("references/mirror-information-control-public.md");
    const staged = JSON.parse(read("publications/hub-staging.v1.json")).assets.map((asset: { destination: string }) => `/${asset.destination}`);
    for (const url of PUBLIC_URLS) {
      expect(guide).toContain(new URL(url).pathname);
      expect(staged).toContain(new URL(url).pathname);
    }
  });
});
