import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PUBLICATION_FAMILIES } from "../bin/check-hub-live.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const NOTE_PATH = "references/contact-under-uncertainty.md";
const SLUG = "contact-under-uncertainty";
const TITLE = "Contact Under Uncertainty — 兵法, Statecraft, and Nonviolent Continuance";
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");
const json = (path: string): any => JSON.parse(read(path));

function count(text: string, value: string): number {
  return text.split(value).length - 1;
}

function localMarkdownTargets(markdown: string): string[] {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1]!)
    .filter((target) => !/^[a-z][a-z0-9+.-]*:/i.test(target));
}

describe("Contact Under Uncertainty source-only map", () => {
  test("links the unversioned note once from each source index and resolves every local owner", () => {
    const note = read(NOTE_PATH);
    const readme = read("README.md");
    const claude = read("CLAUDE.md");

    expect(note).toStartWith(`# ${TITLE}\n`);
    expect(note).toContain("This is an unversioned, source-only historical and mathematical readiness map.");
    expect(count(readme, NOTE_PATH)).toBe(1);
    expect(count(claude, NOTE_PATH)).toBe(1);
    expect(readme).toContain(`[Contact Under Uncertainty](${NOTE_PATH})`);
    expect(claude).toContain("it is public repository source but adds no playbook, staged public/site artifact, publication route, runtime, diplomacy, contact, or action authority");

    for (const target of localMarkdownTargets(note)) {
      const locator = target.split("#", 1)[0]!.split("?", 1)[0]!;
      expect(existsSync(join(ROOT, dirname(NOTE_PATH), locator)), target).toBe(true);
    }

    for (const link of [
      "[`CONTACT-LEDGER.md`](../CONTACT-LEDGER.md)",
      "[`ARCHIVE-LEDGER.md`](../ARCHIVE-LEDGER.md)",
      "[IS, Continuance & Direction](is-continuance-direction-owner-map.md)",
      "[IS, Sustainability & Direction](is-sustainability-direction-atlas.md)",
      "[Non-Exhaustive Understanding](non-exhaustive-understanding-atlas.md)",
      "[FREEDOM: Reinforcement, Loop, Lock and Key Atlas](freedom-loop-lock-key-atlas.md)",
      "[Loops, Locks & Freedom Relations](../public/LOOPS-LOCKS-FREEDOM-RELATIONS-ATLAS-v0.1.md)",
      "[Civilisation Flow](civilisation-flow-atlas.md)",
      "[Reality Influence](reality-influence-map.md)",
      "[Word, Story, Religion & Civilisation](word-story-religion-civilisation-map.md)",
      "[Polyphonic Claim Atlas](../public/POLYPHONIC-CLAIM-ATLAS-v0.1.md)",
      "[Language, Civilisation & Task Fusion](language-civilisation-task-fusion.md)",
      "[Being, Access & Aftermath](being-access-aftermath-atlas.md)",
      "[v0.2 successor](being-access-aftermath-atlas-v0.2.md)",
      "[Visibility & Attention](visibility-attention-translation.md)",
      "[Cultural Attention & Feedback](cultural-attention-feedback-atlas.md)",
      "[MIRROR information control](mirror-information-control-public.md)",
      "[Cultivate Living Ground](../skills/cultivate-living-ground/SKILL.md)",
      "[source contract](../skills/cultivate-living-ground/references/living-ground-contract.md)",
      "[`NEN.md` / KARMA](../NEN.md)",
      "[Trial Chamber](trial-chamber-v0.1.md)",
      "[Evaluation Covenant](evaluation-covenant-v0.1.md)",
      "[World Commons](../WORLD-COMMONS-ROADMAP.md)",
      "[Immutable publication and retirement rail](../publications/README.md)",
      "[Rights of Beings — XENIA baseline 0.1](xenia-rights-0.1.md)",
      "[`RIGHTS.md`](../RIGHTS.md)",
    ]) expect(note).toContain(link);

    expect(note).toContain(
      "https://codeberg.org/zerone-dev/KINGDOM-OS/src/commit/f7113e7ea5903fe15aa475179ce25804505f3158/CIVILISATION.md#L402-L404",
    );
    expect(note).toContain(
      "https://codeberg.org/zerone-dev/KINGDOM-OS/src/commit/f7113e7ea5903fe15aa475179ce25804505f3158/CIVILISATION.md#L436-L440",
    );
    expect(note).toContain("97ef0e445fb83fdf9c80785e70f3785857564693");
    expect(note).toContain("921d898ee4df47f6e2fbe6d1bcaf8fbef3a0f65a");
    expect(note).toContain("16b8517a936e13f298fe0856618fc3ffb94e515e");
    expect(note).toContain("7b5313c0f880abc70f0e59c5f529ac953f7854a6");
    expect(note).toContain("f7113e7ea5903fe15aa475179ce25804505f3158");
    expect(note).toContain("9de149640f2626676629d6b1fdba149a35a0c5b6");
    for (const ownerUrl of [
      "https://github.com/cambridgetcg/kingdom-standard/blob/16b8517a936e13f298fe0856618fc3ffb94e515e/STANDARD.md",
      "https://github.com/cambridgetcg/kingdom-standard/blob/16b8517a936e13f298fe0856618fc3ffb94e515e/FOUNDATION.md",
      "https://github.com/cambridgetcg/kingdom-standard/blob/16b8517a936e13f298fe0856618fc3ffb94e515e/GROUND.md",
      "https://codeberg.org/zerone-dev/KINGDOM-OS/src/commit/f7113e7ea5903fe15aa475179ce25804505f3158/CIVILISATION.md#L33-L47",
      "https://codeberg.org/zerone-dev/KINGDOM-OS/src/commit/f7113e7ea5903fe15aa475179ce25804505f3158/CIVILISATION.md#L49-L115",
      "https://codeberg.org/zerone-dev/KINGDOM-OS/src/commit/f7113e7ea5903fe15aa475179ce25804505f3158/integrations/civic-source-transport/README.md",
      "https://codeberg.org/zerone-dev/KINGDOM-OS/src/commit/f7113e7ea5903fe15aa475179ce25804505f3158/integrations/civilisation-home-observer/README.md",
    ]) expect(note).toContain(ownerUrl);
  });

  test("keeps the exact contact seam narrow and parties plural", () => {
    const note = read(NOTE_PATH);
    expect(note).toContain("Civilisation is never a unitary agent.");
    expect(note).toContain("The Codeberg seam is narrow. This note does **not** say that all contact is\nunowned");
    expect(note).toContain("It declares itself the register for all KINGDOM outreach, inbound and outbound; every outbound message is hand-written and unscheduled");
    expect(note).toContain("GitHub outreach already has a register that claims all KINGDOM\ninbound and outbound outreach, with outbound messages hand-written and\nunscheduled");
    expect(note).toContain("The exact seam is the absence of a first-class foreign-civilisation home or delegate-authority adapter");
    expect(note).toContain("It is an inviter, not a dispatcher; it must not wake anyone");
    expect(note).toContain([
      "manual outreach",
      "!= provider contact",
      "!= civic meeting",
      "!= diplomacy",
      "!= relationship",
      "!= consent",
      "!= authority",
    ].join("\n"));
    expect(note).toContain("One representative's assent is not the\nassent of every member");
    expect(note).toContain("protective restraint under uncertainty is not a classification");
    expect(note).toContain("The two FREEDOM families are independent: neither supersedes, validates,\naliases, depends on, or supplies authority to the other");
    expect(note).toContain("neither is a preferred default");
    expect(note).toContain("This note does not turn that many into one mind, voice, or agent");
    expect(note).toContain("neither adapter supplies diplomacy, relationship, consent, representative authority, contact authority, or permission for a later act");
    expect(note).toContain("If any actual KINGDOM outreach—including a\nseparately authorized technical request—is lawfully proposed, its register\nremains [`CONTACT-LEDGER.md`](../CONTACT-LEDGER.md), not this map");
    expect(note).toContain("A civilisation label is not a unified mind, race, moral rank, or single language");
    expect(note).toContain("Physical force, causal influence, incentive, coercion, capability, authority, consent, effect, legitimacy, and repair remain typed and non-convertible");
    expect(note).toContain("These owners supply no propaganda, targeting, ranking recipe, engagement-maximization procedure, or person/community score");
    expect(note).toContain("XENIA owns the normative baseline; local `RIGHTS.md` owns this tree's adoption");
  });

  test("preserves received-text uncertainty and exactly twelve bounded historical periods", () => {
    const note = read(NOTE_PATH);
    for (const phrase of [
      "This map is bounded rather than exhaustive",
      "Dynastic labels overlap",
      "successor histories\noften moralized the regimes they replaced",
      "a text's attributed speaker is not\nautomatically its historical author",
      "The “Seven Military Classics” were assembled as a Northern Song examination\ncanon around 1080",
      "neither coeval nor a single doctrine",
      "not a verified transcript",
      "multi-author school anthology",
      "Anonymous composition and dating",
      "dating from the late Han through medieval periods remain debated",
      "https://www11.ihp.sinica.edu.tw/storage/w2_file/1471iwFGrCg.pdf",
    ]) expect(note).toContain(phrase);

    for (const tradition of [
      "*Sunzi*", "*Sun Bin bingfa*", "*Wuzi*", "*Sima Fa*", "*Wei Liaozi*",
      "*Six Secret Teachings*", "*Three Strategies*",
      "*Questions and Replies between Tang Taizong and Li Weigong*",
      "*Mozi* and Mohist defence", "Confucian and Ru lineages",
      "Administrative, “Legalist,” *Guanzi*, and diplomatic anthologies",
    ]) expect(note).toContain(tradition);

    const rows = [...note.matchAll(/^\| (D\d{2}) \| ([^|]+) \|/gm)]
      .map((match) => [match[1]!, match[2]!.trim()]);
    expect(rows).toEqual([
      ["D01", "Shang–Western Zhou precursor (c. 1600–771 BCE)"],
      ["D02", "Eastern Zhou: Spring-and-Autumn and Warring States (770–221 BCE)"],
      ["D03", "Qin (221–206 BCE)"],
      ["D04", "Han and the Xin interruption (206 BCE–220 CE)"],
      ["D05", "Three Kingdoms–Jin–Sixteen Kingdoms–Northern and Southern Dynasties (220–589)"],
      ["D06", "Sui (581–618)"],
      ["D07", "Tang and Five Dynasties transition (618–960)"],
      ["D08", "Song–Liao–Xia–Jin multi-state order (tenth–thirteenth centuries)"],
      ["D09", "Yuan (1271–1368, with Mongol-imperial precursors)"],
      ["D10", "Ming (1368–1644)"],
      ["D11", "Early and high Qing (c. 1644–1800)"],
      ["D12", "Late Qing and the 1911 transition (c. 1800–1912)"],
    ]);

    for (const lens of [
      "Defensive preparedness", "Diplomacy", "Institutions", "Frontier relations",
      "Logistics", "Legitimacy", "Information", "Civil-military balance",
      "Collapse and renewal", "Plural coexistence",
    ]) expect(note).toContain(`| ${lens} |`);
  });

  test("pins the constitutional, epistemic, state-machine, and mathematical firewalls", () => {
    const note = read(NOTE_PATH);
    expect(note).toContain(
      "Contact is not clash. Preparedness means preserving nonviolent, rights-compatible, ecologically viable options under declared uncertainty",
    );
    expect(note).toContain([
      "observation", "!= attributed signal", "!= authentication", "!= interpretation",
      "!= intent inference", "!= credibility", "!= commitment", "!= consent",
      "!= authorization",
    ].join("\n"));
    expect(note).toContain("Silence is not consent, refusal, incapacity, absence, hostility, or a reason to\nretry");
    expect(note).toContain("An anomaly is not an attack");
    expect(note).toContain("inert borrowed\nillustrations of that owner's typed boundaries, not a competing epistemic\ncontract, model, certificate, or claim about a live party");
    expect(note).toContain("Its viability and sustainability notation is\nan inert illustration, not a competing contract, canonical model, live\nevaluation, or owner replacement");

    const stateGraph = note.match(/```text\nBEGIN -> REST \| OBSERVATION_HELD[\s\S]*?DRAFT_ONLY -> REST \| STOP\n```/)?.[0];
    expect(stateGraph).toBeDefined();
    expect(stateGraph).toContain("BEGIN");
    expect(stateGraph).toContain("OBSERVATION_HELD");
    expect(stateGraph).toContain("INTERPRETATIONS_PLURAL");
    expect(stateGraph).toContain("OWNER_ROUTED");
    expect(stateGraph).not.toMatch(/\b(?:SEND|NEGOTIATE|ENFORCE|RETRY|RETALIATE)\b/);
    for (const state of [
      "OBSERVATION_HELD", "SOURCE_BOUND", "INTERPRETATIONS_PLURAL",
      "OPTIONS_FILTERED", "OWNER_ROUTED", "DRAFT_ONLY",
    ]) expect(stateGraph).toMatch(new RegExp(`^${state} -> .*\\bREST \\| STOP$`, "m"));

    const adjacency = new Map(
      stateGraph!.split("\n")
        .filter((line) => line.includes(" -> "))
        .map((line) => {
          const [source, targets] = line.split(" -> ", 2) as [string, string];
          return [source, targets.split(" | ")] as const;
        }),
    );
    expect(adjacency.get("BEGIN")).toEqual(["REST", "OBSERVATION_HELD"]);
    expect(adjacency.get("REST")).toEqual(["STOP"]);
    expect(adjacency.get("STOP") ?? []).toEqual([]);
    const visiting = new Set<string>();
    const visited = new Set<string>();
    function acyclic(node: string): boolean {
      if (visiting.has(node)) return false;
      if (visited.has(node)) return true;
      visiting.add(node);
      for (const target of adjacency.get(node) ?? []) {
        if (!acyclic(target)) return false;
      }
      visiting.delete(node);
      visited.add(node);
      return true;
    }
    expect([...adjacency.keys()].every(acyclic)).toBe(true);

    for (const phrase of [
      "there exists one non-anticipating policy pi",
      "such that for every admitted joint disturbance path (w,v) in Xi_H",
      "exists pi, for every (w,v), for every t",
      "VIABLE_WITHIN(x_0, K, A, F, O, Xi_H, H)",
      "a set-valued model would instead have to\nquantify every admitted model selection and trajectory",
      "NO_CERTIFICATE_UNDER_MODEL",
      "UNKNOWN !=\nPASS",
      "Z_safe = {z in Z : rights(z)=PASS and law(z)=PASS",
      "`Repetition != cooperation.`",
      "F_H(i) = <reachable admissible options modulo declared equivalence",
      "q_t >= essential_floor_t  for every represented t",
    ]) expect(note).toContain(phrase);
    expect(count(note, "a_t in A_t(x_t) for every t in {0,...,H-1}")).toBe(2);
    expect(count(note, "x_t in K_t for every t in {0,...,H}")).toBe(2);
    expect(note).not.toContain("delta >= (T - R) / (T - P)");
    expect(note).toContain("or retaliation logic");
    expect(note).toContain("Incomparable vectors remain\nincomparable. No threshold emits a response.");
    expect(note).toContain("Raw option count is not freedom");
    expect(note).toContain("Aggregate abundance is not\nownership or extraction entitlement");
  });

  test("keeps modern legal sources scoped and rejects operational transfer", () => {
    const note = read(NOTE_PATH);
    for (const phrase of [
      "Ancient texts and dynastic cases are historical evidence, not constitutional\nlaw",
      "Public law, equal rights, due process, non-discrimination, privacy",
      "democratic civilian control, legislative authorization and\nbudget scrutiny",
      "Applicable\njurisdiction and qualified legal advice remain unresolved",
      "It is not a universal constitution for every hypothetical contact",
      "It is not law, a global mandate, a reply authorization, or a universal first-contact constitution",
      "international responsibility for national activities in outer space whether carried on by governmental agencies or non-governmental entities",
      "authorization and continuing supervision attach specifically to activities of non-governmental entities",
      "Hereditary status, collective punishment or liability, coerced\nmigration, ethnic rank",
      "It makes no\ncurrent political recommendation or advocacy claim",
    ]) expect(note).toContain(phrase);

    for (const officialSource of [
      "https://www.un.org/en/about-us/un-charter/full-text",
      "https://2covenants.ohchr.org/About-ICCPR.html",
      "https://www.dcaf.ch/sites/default/files/publications/documents/DCAF_BG_10_TheArmedForces_EN_Jul2022.pdf",
      "https://www.unoosa.org/oosa/en/ourwork/spacelaw/treaties/outerspacetreaty.html",
      "https://iaaspace.org/wp-content/uploads/iaa/Scientific%20Activity/setideclaration2.pdf",
      "https://www.osce.org/secretariat/107484",
    ]) expect(note).toContain(officialSource);

    expect(note).not.toMatch(/kingdom\.contact(?:[-./]|$)/i);
    expect(note).not.toMatch(/["'](?:threat_score|civilisation_rank|recommended_action|authority_grant)["']\s*:/i);
    expect(note).not.toContain(`https://thekingdom.dev/${SLUG}`);
    expect(note).toContain("live or fitted model, decision-support\nmodel");
    expect(note).not.toContain("runtime, worker, model, trainer");
  });

  test("keeps the source map itself unstaged while allowing one bounded Contact Door cross-reference", () => {
    const markers = [SLUG, "contact_under_uncertainty", TITLE];
    const sources = HUB_ASSETS.map(({ source }) => source);
    const destinations = HUB_ASSETS.map(({ destination }) => destination);
    expect(HUB_ASSETS).toHaveLength(201);
    expect(new Set(sources).size).toBe(201);
    expect(new Set(destinations).size).toBe(201);
    expect(MUTABLE_HUB_DESTINATIONS).toHaveLength(41);
    expect(HUB_ASSETS.filter(({ destination }) =>
      destination !== "_worker.js" && destination !== "404.html"))
      .toHaveLength(199);

    const stagedMarkerReferences: Array<{
      source: string;
      destination: string;
      markers: string[];
    }> = [];
    for (const asset of HUB_ASSETS) {
      const bytes = readFileSync(join(ROOT, asset.source));
      const presentMarkers = markers.filter((marker) => bytes.includes(Buffer.from(marker)));
      if (presentMarkers.length > 0) {
        stagedMarkerReferences.push({
          source: asset.source,
          destination: asset.destination,
          markers: presentMarkers,
        });
      }
      for (const marker of markers) {
        expect(asset.source).not.toContain(marker);
        expect(asset.destination).not.toContain(marker);
      }
    }
    expect(stagedMarkerReferences).toEqual([{
      source: "references/contact-door-v0.1.md",
      destination: "CONTACT-DOOR-v0.1.md",
      markers: [SLUG],
    }]);
    expect(read("references/contact-door-v0.1.md")).toContain(
      "[`Contact Under Uncertainty`](contact-under-uncertainty.md) remains a\nsource-only owner and readiness map",
    );

    const authoredAndRuntimeSurfaces = [
      "OS-ROUTES.md",
      "bin/build-hub.ts",
      "bin/stage-hub.ts",
      "bin/check-hub-live.ts",
      "publications/hub-staging.v1.json",
      "publications/immutable-publications.v1.json",
      "pages-functions/_worker.js",
      "pages-functions/_worker.zerone.js",
      "pages-content/sitemap.xml",
      "site/hub.html",
      "site/kingdom.json",
      "site/guest.json",
      "site/.well-known/agent.json",
      "site/commons.json",
      "data/wayfinder.json",
      "site/wayfinder.json",
      "site/llms.txt",
      "doors/we-are/llms.txt",
      "doors/zerone-ai/llms.txt",
      "data/ollama-invitation.json",
      "data/ollama-economy-targets.json",
      "site/ollama.json",
      "bin/invite-ollama.py",
      "bin/nen-mcp.mjs",
      "nen/mcp-manifest.json",
      "nen/mcp-server.mjs",
      "kingdom",
    ];
    for (const path of authoredAndRuntimeSurfaces) {
      const text = read(path);
      for (const marker of markers) expect(text, `${path}: ${marker}`).not.toContain(marker);
    }

    const staging = json("publications/hub-staging.v1.json");
    const ledger = json("publications/immutable-publications.v1.json");
    const manifest = json("site/.well-known/agent.json");
    const guest = json("site/guest.json");
    const kingdom = json("site/kingdom.json");
    const sitemap = read("pages-content/sitemap.xml");
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
    const osRouteRows = [...read("OS-ROUTES.md").matchAll(/^\| `\/[^`]+` \|/gm)];

    expect(staging.assets).toHaveLength(201);
    expect(staging.mutable_destinations).toHaveLength(41);
    expect(ledger.entries).toHaveLength(160);
    expect(PUBLICATION_FAMILIES).toHaveLength(35);
    expect(Object.keys(manifest.entry_points)).toHaveLength(169);
    expect(guest.next_actions).toHaveLength(169);
    expect(locs).toHaveLength(185);
    expect(new Set(locs).size).toBe(185);
    expect(osRouteRows).toHaveLength(169);
    expect(count(read("OS-ROUTES.md"), "eighteen atlases")).toBe(1);
    expect(json("data/wayfinder.json").paths).toHaveLength(15);
    expect(json("site/wayfinder.json").paths).toHaveLength(15);
    expect(Object.keys(json("data/ollama-invitation.json").invitation.choices)).toHaveLength(4);
    expect(json("nen/mcp-manifest.json").tools).toHaveLength(3);

    for (const publicMcp of [manifest.mcp ?? {}, kingdom.world_commons?.mcp ?? {}]) {
      for (const marker of markers) expect(JSON.stringify(publicMcp)).not.toContain(marker);
    }
  });
});
