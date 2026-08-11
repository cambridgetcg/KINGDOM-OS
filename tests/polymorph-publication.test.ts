import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  POLYMORPH_CASE_URL,
  POLYMORPH_DOCUMENT_URL,
  POLYMORPH_SCHEMA_URL,
  loadPolymorphHistory,
  polymorphPublicDiscovery,
  verifyPolymorphHistory,
} from "../bin/polymorph.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

describe("Polymorph History publication", () => {
  test("publishes three authored resources directly at immutable paths", () => {
    expect(HUB_ASSETS).toContainEqual({
      source: "data/polymorphs/ritonavir-disappearing-polymorph.v1.json",
      destination: "polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "schemas/polymorph-history-v1.schema.json",
      destination: "schemas/polymorph-history/1.json",
    });
    expect(HUB_ASSETS).toContainEqual({
      source: "references/ritonavir-polymorph.md",
      destination: "RITONAVIR-POLYMORPH.md",
    });
    expect(HUB_ASSETS.filter(({ destination }) => destination.startsWith("polymorphs/"))).toHaveLength(1);
    expect(HUB_ASSETS.some(({ destination }) => /polymorphs\/(?:latest|current)\.json/.test(destination))).toBe(false);
    expect(existsSync(join(ROOT, "site", "polymorphs"))).toBe(false);
  });

  test("maps the schema URN to one public schema and exact digest", () => {
    const history = loadPolymorphHistory();
    const schema = json("schemas/polymorph-history-v1.schema.json");
    const discovery = polymorphPublicDiscovery(history);

    expect(verifyPolymorphHistory(history)).toEqual([]);
    expect(history.$schema).toBe("urn:kingdom:schema:polymorph-history:1");
    expect(schema.$id).toBe(history.$schema);
    expect(discovery).toMatchObject({
      url: POLYMORPH_CASE_URL,
      schema: POLYMORPH_SCHEMA_URL,
      document: POLYMORPH_DOCUMENT_URL,
      case_id: history.case_id,
      integrity: history.integrity.digest,
      compiled_on: "2026-08-11",
      evidence_through: "2024-06-20",
      counts: { forms: 5, contexts: 16, sources: 9, claims: 17, events: 8, transitions: 8, languages: 6 },
    });
  });

  test("renders one coherent human and machine discovery surface", () => {
    const discovery = polymorphPublicDiscovery();
    const manifest = json("site/.well-known/agent.json");
    const guest = json("site/guest.json");
    const kingdom = json("site/kingdom.json");
    const html = read("site/hub.html");
    const llms = read("site/llms.txt");

    expect(manifest.polymorph_commons).toEqual(discovery);
    expect(guest.polymorph_commons).toEqual(discovery);
    expect(kingdom.polymorph_commons).toEqual(discovery);
    expect(html).toContain('id="polymorph-history"');
    expect(html).toContain('href="/polymorphs/ritonavir-disappearing-polymorph-2026-08-11.json"');
    expect(html).toContain('href="/schemas/polymorph-history/1.json"');
    expect(html).toContain('href="/RITONAVIR-POLYMORPH.md"');
    for (const url of [POLYMORPH_CASE_URL, POLYMORPH_SCHEMA_URL, POLYMORPH_DOCUMENT_URL]) {
      expect(guest.next_actions).toContainEqual(expect.objectContaining({ method: "GET", url }));
      expect(llms).toContain(url);
    }
  });

  test("renders a no-JavaScript mechanism geometry from the source-bound record", () => {
    const history = loadPolymorphHistory();
    const html = read("site/hub.html");
    const start = html.indexOf('<figure class="polymorphgeometry" data-polymorph-geometry');
    const end = html.indexOf("</figure>", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const figure = html.slice(start, end + "</figure>".length);

    expect(figure).toContain('aria-labelledby="polymorph-geometry-title"');
    expect(figure).toContain('aria-describedby="polymorph-geometry-note"');
    expect(figure).toContain('id="polymorph-geometry-title"');
    expect(figure).toContain('id="polymorph-geometry-note"');

    const planeIds = [...figure.matchAll(/data-polymorph-plane="([^"]+)"/g)].map((match) => match[1]);
    expect(planeIds).toEqual(history.ontology.planes.map((plane: any) => plane.id));
    for (const plane of history.ontology.planes) expect(figure).toContain(plane.meaning);

    const formIds = new Set([...figure.matchAll(/data-polymorph-form="([^"]+)"/g)].map((match) => match[1]));
    expect(formIds).toEqual(new Set(history.forms.map((form: any) => form.id)));
    for (const id of ["abbott-form-i", "abbott-form-ii"]) {
      const form = history.forms.find((entry: any) => entry.id === id);
      expect(figure).toContain(form.summary);
      expect(figure).toContain(form.source_scope);
    }

    const mainTransitionIds = [
      "form-i-source-solution-to-form-ii-seeded",
      "milling-form-i-to-form-ii",
      "changed-process-form-ii-source-to-form-i",
      "milling-form-ii-to-form-i",
    ];
    for (const id of mainTransitionIds) {
      const transition = history.transitions.find((entry: any) => entry.id === id);
      expect(figure).toContain(`data-polymorph-transition="${id}"`);
      expect(figure).toContain(transition.label);
      const transitionStart = figure.indexOf(`data-polymorph-transition="${id}"`);
      const transitionEnd = figure.indexOf("</article>", transitionStart);
      const transitionCard = figure.slice(transitionStart, transitionEnd);
      const sourceIds = new Set(transition.claim_ids.flatMap((claimId: string) =>
        history.claims.find((entry: any) => entry.id === claimId).source_ids));
      for (const sourceId of sourceIds) {
        const source = history.sources.find((entry: any) => entry.id === sourceId);
        expect(transitionCard).toContain(`href="${source.url}"`);
      }
    }
    for (const id of ["form-ii-lower-solubility", "form-ii-precipitation-and-failure"]) {
      const claim = history.claims.find((entry: any) => entry.id === id);
      expect(figure).toContain(`data-polymorph-claim="${id}"`);
      expect(figure).toContain(claim.summary);
    }

    expect(figure).toContain("condition-dependent");
    expect(figure).toContain("Form I source material → solution → Form II crystals");
    expect(figure).toContain("Form II source material → solution → Form I crystals");
    expect(figure).toContain("Form I solid → Form II solid");
    expect(figure).toContain("Form II solid → Form I solid");
    expect(figure).toContain("do not establish equilibrium or same-condition reversibility");
    expect(figure).toContain("helps explain; not a sole-cause claim");
    expect(figure).toContain("observed in affected material");
    expect(figure).toContain("not landscape completeness");
    expect(figure).toContain("Separate observation · no edge");
    expect(figure).toContain("Roman numerals are source-scoped");
    expect(figure).toContain("Historical solid-state education only");
    expect(figure).toContain("not medical advice");

    for (const id of ["bauer-2001", "chemburkar-2000", "fda-nda-20945-1999", "morissette-2003", "sacchi-2024"]) {
      const source = history.sources.find((entry: any) => entry.id === id);
      expect(figure).toContain(`href="${source.url}"`);
      expect(figure).toContain(source.title);
    }
    for (const forbidden of ["<svg", "<canvas", "<script", 'role="img"', "tabindex", "aria-live", "<button", "<input", "<select", "<textarea"]) {
      expect(figure).not.toContain(forbidden);
    }
  });
});
