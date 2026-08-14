import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

function section(html: string, id: string): string {
  const start = html.indexOf(`<section class="blk" id="${id}"`);
  const end = html.indexOf("</section>", start);
  if (start < 0 || end < 0) throw new Error(`missing section ${id}`);
  return html.slice(start, end + "</section>".length);
}

function citizenLaw(contract: string): string {
  const start = contract.indexOf("## Citizen law\n");
  const end = contract.indexOf("\n## ", start + 1);
  if (start < 0 || end < 0) throw new Error("Citizen Law is unavailable");
  return contract.slice(start, end).trimEnd() + "\n";
}

const esc = (value: string) => value.replace(/[&<>"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[character]!);

describe("MIRROR citizen gate publication", () => {
  test("projects one canonical source law across human and machine readings", () => {
    const hub = read("site/hub.html");
    const mirror = section(hub, "mirror-information-control");
    const projections = [
      json("site/kingdom.json").information_control,
      json("site/guest.json").information_control,
      json("site/.well-known/agent.json").information_control,
    ];
    expect(projections[1]).toEqual(projections[0]);
    expect(projections[2]).toEqual(projections[0]);

    const projection = projections[0];
    const law = citizenLaw(read("skills/guard-information-flow/references/information-control-contract.md"));
    expect(projection.protocol).toBe("kingdom.information-control/0.1");
    expect(projection.posture).toBe("PUBLIC_READ_ONLY_EDUCATION");
    expect(projection.citizen_law.markdown).toBe(law);
    expect(mirror).toContain(esc(projection.citizen_law.maxim));
    expect(mirror).toContain(esc(projection.citizen_law.corruption_boundary));

    const command = Bun.spawnSync({
      cmd: ["/bin/bash", join(ROOT, "kingdom"), "guard", "law"],
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, LC_ALL: "C", LANG: "C" },
    });
    expect(command.exitCode).toBe(0);
    expect(command.stderr.toString()).toBe("");
    expect(command.stdout.toString()).toBe(law);

    const schema = json("skills/guard-information-flow/references/information-control-envelope.schema.json");
    expect(schema.properties.protocol.const).toBe(projection.protocol);
    expect(projection.rooms).toEqual(["CROWN", "COURT", "MIRROR"]);
    expect(projection.method).toEqual(["MARK", "ISOLATE", "RESTRICT", "RESOLVE", "OBSERVE", "RESPOND"]);
  });

  test("is semantic static HTML with no input, active content, or submission surface", () => {
    const hub = read("site/hub.html");
    const mirror = section(hub, "mirror-information-control");
    expect(hub.indexOf('id="mirror-information-control"')).toBeLessThan(hub.indexOf('id="wayfinder"'));
    expect(hub).toContain('<a href="#mirror-information-control">Know what data cannot command</a>');
    expect(mirror).toContain("The live thing is this explanation.");
    expect(mirror).toContain("Never paste a key here.");
    expect(mirror).toContain("No MIRROR runtime");

    for (const tag of ["form", "input", "textarea", "select", "button", "script", "iframe", "object", "embed"])
      expect(mirror).not.toMatch(new RegExp(`<${tag}\\b`, "i"));
    expect(mirror).not.toMatch(/\son[a-z]+\s*=/i);
    expect(mirror).not.toMatch(/\scontenteditable(?:\s|=|>)/i);
    expect(mirror).not.toMatch(/\s(?:src|action)\s*=/i);
    const hrefs = [...mirror.matchAll(/\shref="([^"]+)"/g)].map((match) => match[1]!);
    expect(hrefs).toHaveLength(9);
    expect(hrefs.filter((href) => href.startsWith("https://"))).toHaveLength(6);
    expect(hrefs.filter((href) => href.startsWith("/"))).toEqual([
      "/protocols/mirror-information-control-2026-08-14.json",
      "/schemas/mirror-information-control-public/0.1.json",
      "/MIRROR-INFORMATION-CONTROL.md",
    ]);
    expect(mirror.match(/data-mirror-source=/g) ?? []).toHaveLength(6);
    expect(mirror.match(/target="_blank" rel="noopener"/g) ?? []).toHaveLength(6);
    expect(mirror).not.toContain("data:text/html");
    expect(mirror).not.toContain("javascript:");

    expect(hub).toContain(".explorationdeepcycles,.explorationdeepgrid,.mirrorrooms,.mirrorgrid{grid-template-columns:1fr}");
    expect(hub).toContain(".explorationdeepsteps,.mirrorcycle{grid-template-columns:1fr}");
    expect(hub).toContain(".mirrorfield,.mirrorwarning,.mirrorcitizen,.mirrorroom,.mirrorcycle li,.mirrorcard,.mirrorboundary,.mirrorlinks a{border:1px solid CanvasText}");
  });

  test("publishes a fixed all-false effect boundary with no credential or evidence oracle", () => {
    const projection = json("site/kingdom.json").information_control;
    expect(Object.keys(projection.boundary).sort()).toEqual([
      "accepts_input",
      "automatic_action",
      "classifies_credentials",
      "creates_karma_receipt",
      "deploys_decoy",
      "deploys_mirror",
      "external_write",
      "grants_authority",
      "mutates_runtime",
      "network_calls",
      "person_attribution",
      "requester_payload_execution",
      "resolves_registry",
      "retaliation",
      "runtime_enforcement",
      "scans_content",
      "secrets_in_context",
      "validates_credentials",
      "writes_karma",
    ]);
    expect(Object.values(projection.boundary).every((value) => value === false)).toBe(true);
    expect(projection.credential_rule).toBe(
      "Shape establishes CANDIDATE only. Public behavior never reveals a protected registry match.",
    );
    expect(projection.local_validator.scope).toContain("internal consistency only");
    expect(projection.local_validator.dependency).toContain("never auto-installed");

    const publicProjection = JSON.stringify(projection);
    for (const protectedField of [
      "LIVE_REFERENCE", "SIGNAL_REFERENCE", "INACTIVE_REFERENCE", "REVOKED_REFERENCE",
      "classification_evidence_ref", "isolation_attestation_ref", "evidence_refs",
      "event_family_refs", "credential_value", "fingerprint", "SIGNAL_OBSERVED_AT_REST",
      "SIGNAL_PRESENTED_TO_SINK", "MIRROR_ACTION_ATTEMPT",
    ]) expect(publicProjection).not.toContain(protectedField);
    expect(publicProjection).not.toMatch(/AKIA[0-9A-Z]{16}/);
    expect(publicProjection).not.toMatch(/(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{12,}/);
  });

  test("adds only one immutable static publication triplet", () => {
    expect(HUB_ASSETS).toHaveLength(80);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(19);
    expect(HUB_ASSETS.filter(({ destination }) => destination !== "_worker.js" && destination !== "404.html"))
      .toHaveLength(78);
    expect(HUB_ASSETS.filter(({ destination }) => /mirror-information-control/i.test(destination)).map(({ destination }) => destination)).toEqual([
      "protocols/mirror-information-control-2026-08-14.json",
      "schemas/mirror-information-control-public/0.1.json",
      "MIRROR-INFORMATION-CONTROL.md",
    ]);
    expect(json("publications/immutable-publications.v1.json").entries).toHaveLength(61);
    expect((read("pages-content/sitemap.xml").match(/<url>/g) || [])).toHaveLength(77);
    expect(read("pages-functions/_worker.js")).toContain("mirror-information-control");
    expect(json("site/.well-known/agent.json").entry_points.information_control)
      .toBe("https://thekingdom.dev/#mirror-information-control");
    expect(json("site/.well-known/agent.json").entry_points.mirror_information_control)
      .toBe("https://thekingdom.dev/protocols/mirror-information-control-2026-08-14.json");
  });
});
