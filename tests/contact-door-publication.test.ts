import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CONTACT_DOOR_ALIAS_LOCATOR,
  CONTACT_DOOR_ALIAS_PATH,
  CONTACT_DOOR_ALIAS_URL,
  CONTACT_DOOR_BOUNDARY_KEYS,
  CONTACT_DOOR_CANONICAL_PATH,
  CONTACT_DOOR_CANONICAL_URL,
  CONTACT_DOOR_CARRIER_RECEIPT_LOCATOR,
  CONTACT_DOOR_GUIDE_LOCATOR,
  CONTACT_DOOR_GUIDE_PATH,
  CONTACT_DOOR_GUIDE_URL,
  CONTACT_DOOR_IMMUTABLE_PATHS,
  CONTACT_DOOR_LOCATOR,
  CONTACT_DOOR_MIME_BY_PATH,
  CONTACT_DOOR_MUTABLE_PATHS,
  CONTACT_DOOR_PAGE_LOCATOR,
  CONTACT_DOOR_PAGE_PATH,
  CONTACT_DOOR_PAGE_URL,
  CONTACT_DOOR_PUBLIC_PATHS,
  CONTACT_DOOR_SCHEMA_LOCATOR,
  CONTACT_DOOR_SCHEMA_PATH,
  CONTACT_DOOR_SCHEMA_URL,
  CONTACT_DOOR_SECURITY_LOCATOR,
  CONTACT_DOOR_SECURITY_PATH,
  CONTACT_DOOR_SECURITY_URL,
  CONTACT_DOOR_SVG_LOCATOR,
  CONTACT_DOOR_SVG_PATH,
  CONTACT_DOOR_SVG_URL,
  CONTACT_DOOR_STATE_LOCATOR,
  CONTACT_DOOR_VCARD_LOCATOR,
  CONTACT_DOOR_VCARD_PATH,
  CONTACT_DOOR_VCARD_URL,
  contactDoorPublicDiscovery,
  loadContactDoor,
  loadCurrentContactDoor,
} from "../bin/contact-door.ts";
import {
  PUBLICATION_FAMILIES,
  assertRetiredFamilyDiscoveryAbsent,
  checkContactDoorFamily,
  destinationForPublicPath,
  publicationFamilyStates,
} from "../bin/check-hub-live.ts";
import { HUB_ASSETS, MUTABLE_HUB_DESTINATIONS } from "../bin/stage-hub.ts";
import worker from "../pages-functions/_worker.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");
const json = (path: string): any => JSON.parse(read(path));
const sha256 = (path: string): string => createHash("sha256")
  .update(readFileSync(join(ROOT, path))).digest("hex");

const URLS = [
  CONTACT_DOOR_PAGE_URL,
  CONTACT_DOOR_ALIAS_URL,
  CONTACT_DOOR_SECURITY_URL,
  CONTACT_DOOR_CANONICAL_URL,
  CONTACT_DOOR_SCHEMA_URL,
  CONTACT_DOOR_GUIDE_URL,
  CONTACT_DOOR_SVG_URL,
  CONTACT_DOOR_VCARD_URL,
] as const;

const SOURCES = new Map<string, string>([
  [CONTACT_DOOR_PAGE_PATH, CONTACT_DOOR_PAGE_LOCATOR],
  [CONTACT_DOOR_ALIAS_PATH, CONTACT_DOOR_ALIAS_LOCATOR],
  [CONTACT_DOOR_CANONICAL_PATH, CONTACT_DOOR_LOCATOR],
  [CONTACT_DOOR_SCHEMA_PATH, CONTACT_DOOR_SCHEMA_LOCATOR],
  [CONTACT_DOOR_GUIDE_PATH, CONTACT_DOOR_GUIDE_LOCATOR],
  [CONTACT_DOOR_SECURITY_PATH, CONTACT_DOOR_SECURITY_LOCATOR],
  [CONTACT_DOOR_SVG_PATH, CONTACT_DOOR_SVG_LOCATOR],
  [CONTACT_DOOR_VCARD_PATH, CONTACT_DOOR_VCARD_LOCATOR],
]);

function storageType(path: string): string {
  if (path === CONTACT_DOOR_PAGE_PATH) return "text/html";
  if (path === CONTACT_DOOR_ALIAS_PATH || path === CONTACT_DOOR_CANONICAL_PATH ||
      path === CONTACT_DOOR_SCHEMA_PATH) return "application/json";
  if (path === CONTACT_DOOR_SVG_PATH) return "image/svg+xml";
  return "text/plain";
}

function exactEnvironment(counter?: { value: number }) {
  return {
    ASSETS: {
      fetch(request: Request) {
        if (counter) counter.value += 1;
        const path = new URL(request.url).pathname;
        const source = SOURCES.get(path);
        return new Response(
          request.method === "HEAD" || !source ? null : readFileSync(join(ROOT, source)),
          {
            status: source ? 200 : 404,
            headers: {
              "content-type": source ? storageType(path) : "text/html",
              link: "</poison>; rel=canonical",
              "set-cookie": "contact-door-test=poison",
            },
          },
        );
      },
    },
  };
}

function workerFetcher(): typeof fetch {
  const environment = exactEnvironment();
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    return worker.fetch(request, environment);
  }) as typeof fetch;
}

describe("Contact Door public integration", () => {
  test("stages and ledgers one atomic 3-mutable + 5-immutable family", () => {
    const family = PUBLICATION_FAMILIES.find(({ id }) => id === "contact-door");
    expect(PUBLICATION_FAMILIES).toHaveLength(35);
    expect(family).toEqual({
      id: "contact-door",
      label: "Contact Door",
      routes: CONTACT_DOOR_PUBLIC_PATHS,
      discoveryProperties: ["contact_door"],
      entryPointProperties: [
        "contact_door", "contact_door_alias", "contact_door_security",
        "contact_door_canonical", "contact_door_schema", "contact_door_guide",
        "contact_door_boundary_asset", "contact_door_vcard",
      ],
    });
    expect(CONTACT_DOOR_MUTABLE_PATHS).toHaveLength(3);
    expect(CONTACT_DOOR_IMMUTABLE_PATHS).toHaveLength(5);
    expect(CONTACT_DOOR_PUBLIC_PATHS.every((path) =>
      HUB_ASSETS.some(({ destination }) => destination === destinationForPublicPath(path))))
      .toBe(true);
    expect(HUB_ASSETS.some(({ source }) =>
      source === CONTACT_DOOR_STATE_LOCATOR ||
      source === CONTACT_DOOR_CARRIER_RECEIPT_LOCATOR)).toBe(false);
    expect(CONTACT_DOOR_MUTABLE_PATHS.map(destinationForPublicPath).every((destination) =>
      MUTABLE_HUB_DESTINATIONS.includes(destination))).toBe(true);

    const ledger = json("publications/immutable-publications.v1.json");
    const entries = ledger.entries.filter(({ id }: { id: string }) =>
      id.startsWith("contact-door/0.1/"));
    expect(entries).toHaveLength(5);
    expect(new Set(entries.map(({ route }: { route: string }) => route)))
      .toEqual(new Set(CONTACT_DOOR_IMMUTABLE_PATHS));
    for (const entry of entries) expect(entry.sha256).toBe(sha256(entry.source));

    const staged = new Set(HUB_ASSETS.map(({ destination }) => destination));
    expect(publicationFamilyStates(staged).get("contact-door")?.active).toBe(true);
    const partial = new Set(staged);
    partial.delete(destinationForPublicPath(CONTACT_DOOR_PAGE_PATH));
    expect(() => publicationFamilyStates(partial)).toThrow(/Contact Door is partially staged/);
    const retired = new Set(staged);
    for (const path of CONTACT_DOOR_PUBLIC_PATHS) retired.delete(destinationForPublicPath(path));
    expect(publicationFamilyStates(retired).get("contact-door")?.active).toBe(false);
    expect(() => assertRetiredFamilyDiscoveryAbsent(family!, [{
      label: "stale llms",
      text: CONTACT_DOOR_PAGE_URL,
    }])).toThrow(/Contact Door is retired/);
  });

  test("publishes coherent generated discovery without Wayfinder or MCP reach", () => {
    const immutable = loadContactDoor();
    const current = loadCurrentContactDoor();
    const expected = contactDoorPublicDiscovery(current);
    expect(current.artifact.lifecycle).toBe("ACTIVE");
    expect(current.delivery).toMatchObject({
      configurationState: "ACTIVE_API_VERIFIED",
      routingEnabled: true,
      configuredLiteralRuleCount: 4,
      catchAllEnabled: false,
      subaddressingEnabled: false,
      emailWorkerUsed: false,
      routingDnsRecordsVerified: true,
      endToEndDeliveryProbePerformed: false,
    });
    expect(immutable.artifact.id).toBe(current.artifact.id);
    const kingdom = json("site/kingdom.json");
    const guest = json("site/guest.json");
    const manifest = json("site/.well-known/agent.json");
    expect(kingdom.contact_door).toEqual(expected);
    expect(guest.contact_door).toEqual(expected);
    expect(manifest.contact_door).toEqual(expected);
    expect(Object.fromEntries(Object.entries(manifest.entry_points)
      .filter(([key]) => key.startsWith("contact_door")))).toEqual({
      contact_door: CONTACT_DOOR_PAGE_URL,
      contact_door_alias: CONTACT_DOOR_ALIAS_URL,
      contact_door_security: CONTACT_DOOR_SECURITY_URL,
      contact_door_canonical: CONTACT_DOOR_CANONICAL_URL,
      contact_door_schema: CONTACT_DOOR_SCHEMA_URL,
      contact_door_guide: CONTACT_DOOR_GUIDE_URL,
      contact_door_boundary_asset: CONTACT_DOOR_SVG_URL,
      contact_door_vcard: CONTACT_DOOR_VCARD_URL,
    });
    const actions = guest.next_actions.filter(({ url }: { url?: string }) =>
      URLS.includes(url as any));
    expect(actions).toHaveLength(8);
    expect(actions.every((action: any) => action.method === "GET" &&
      ["mcp", "tool", "write", "execute", "send", "retry", "score", "rank"]
        .every((key) => !(key in action)))).toBe(true);

    const page = read(CONTACT_DOOR_PAGE_LOCATOR);
    expect(page).toContain("Visiting sends nothing.");
    expect(page).toContain("mailto:contact@thekingdom.dev");
    expect(page).toContain("routing API and routing DNS verified: yes");
    expect(page).toContain("Receive-only DMARC: <code>NOT_YET_PUBLISHED</code>");
    expect(page).toContain("End-to-end inbox delivery proven: no");
    expect(page).toContain("no message DATA was sent and no destination-inbox receipt was observed");
    expect(page).not.toMatch(/<(?:script|form|input|textarea|select|button)\b/i);
    expect(JSON.parse(read(CONTACT_DOOR_ALIAS_LOCATOR))).toEqual(expected);
    expect(read(CONTACT_DOOR_SECURITY_LOCATOR)).toContain(
      "Contact: mailto:security@thekingdom.dev\r\n",
    );
    const llms = read("site/llms.txt");
    const sitemap = read("pages-content/sitemap.xml");
    const hub = read("site/hub.html");
    for (const url of URLS) {
      expect(llms).toContain(url);
      expect(sitemap).toContain(`<loc>${url}</loc>`);
      expect(hub).toContain(`href="${new URL(url).pathname}"`);
    }
    const wayfinder = read("site/wayfinder.json");
    for (const url of URLS) expect(wayfinder).not.toContain(url);
    expect(JSON.stringify(manifest.mcp)).not.toContain("contact@thekingdom.dev");
    for (const privateLocator of [
      CONTACT_DOOR_STATE_LOCATOR,
      CONTACT_DOOR_CARRIER_RECEIPT_LOCATOR,
    ]) {
      expect(llms).not.toContain(privateLocator);
      expect(sitemap).not.toContain(privateLocator);
      expect(hub).not.toContain(privateLocator);
      expect(JSON.stringify(kingdom)).not.toContain(privateLocator);
      expect(JSON.stringify(guest)).not.toContain(privateLocator);
      expect(JSON.stringify(manifest)).not.toContain(privateLocator);
    }
    expect(Object.values(expected.authority_boundary)).toEqual(
      Array(CONTACT_DOOR_BOUNDARY_KEYS.length).fill(false),
    );
  });

  test("owns the exact GET/HEAD and bodyless mutation contract on every Kingdom host", async () => {
    const hosts = [
      "thekingdom.dev", "www.thekingdom.dev", "thekingdom.pages.dev",
      "preview-42.thekingdom.pages.dev",
    ];
    for (const host of hosts) {
      for (const path of CONTACT_DOOR_PUBLIC_PATHS) {
        for (const method of ["GET", "HEAD"] as const) {
          const response = await worker.fetch(
            new Request(`https://${host}${path}`, { method }),
            exactEnvironment(),
          );
          expect(response.status).toBe(200);
          expect(response.headers.get("content-type")).toBe(CONTACT_DOOR_MIME_BY_PATH[path]);
          expect(response.headers.get("set-cookie")).toBeNull();
          expect(await response.text()).toBe(
            method === "HEAD" ? "" : read(SOURCES.get(path)!),
          );
        }
      }
    }

    const counter = { value: 0 };
    for (const path of CONTACT_DOOR_PUBLIC_PATHS) {
      for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const) {
        const response = await worker.fetch(
          new Request(`https://thekingdom.dev${path}`, { method }),
          exactEnvironment(counter),
        );
        expect(response.status).toBe(405);
        expect(response.headers.get("allow")).toBe("GET, HEAD");
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(await response.text()).toBe("");
      }
    }
    expect(counter.value).toBe(0);

    const globalLinks = [
      '</.well-known/agent.json>; rel="service-desc"; type="application/json"',
      '</rights.json>; rel="service-meta"; type="application/json"; title="Inherent Rights Recognition"',
      '</RIGHTS.md>; rel="service-doc"; type="text/markdown"; title="Rights recognized here"',
    ];
    const alias = await worker.fetch(
      new Request(`https://thekingdom.dev${CONTACT_DOOR_ALIAS_PATH}`),
      exactEnvironment(),
    );
    expect(alias.headers.get("link")).toBe([
      `<${CONTACT_DOOR_CANONICAL_PATH}>; rel="alternate"; type="application/json"`,
      `<${CONTACT_DOOR_GUIDE_PATH}>; rel="service-doc"; type="text/markdown"`,
      ...globalLinks,
    ].join(", "));
    expect(alias.headers.get("link")).not.toContain(CONTACT_DOOR_SCHEMA_PATH);
    const canonical = await worker.fetch(
      new Request(`https://thekingdom.dev${CONTACT_DOOR_CANONICAL_PATH}`),
      exactEnvironment(),
    );
    expect(canonical.headers.get("link")).toBe([
      `<${CONTACT_DOOR_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
      ...globalLinks,
    ].join(", "));
    for (const path of CONTACT_DOOR_PUBLIC_PATHS) {
      const response = await worker.fetch(
        new Request(`https://thekingdom.dev${path}`),
        exactEnvironment(),
      );
      for (const link of globalLinks) expect(response.headers.get("link")).toContain(link);
    }
  });

  test("leaves shared/near routes alone, fails closed on bad storage, and passes the live-family verifier", async () => {
    const shared = new Response("shared", { headers: { "content-type": "application/json" } });
    expect(await worker.fetch(
      new Request(`https://we-are.love${CONTACT_DOOR_CANONICAL_PATH}`, { method: "POST" }),
      { ASSETS: { fetch: () => shared } },
    )).toBe(shared);

    const near = new Response("near", { headers: { "content-type": "application/octet-stream" } });
    expect(await worker.fetch(
      new Request("https://thekingdom.dev/contact/latest.json", { method: "POST" }),
      { ASSETS: { fetch: () => near } },
    )).toBe(near);

    for (const response of [
      new Response("missing", { status: 404, headers: { "content-type": "application/json", link: "</poison>; rel=canonical" } }),
      new Response("wrong", { headers: { "content-type": "text/html", link: "</poison>; rel=canonical" } }),
    ]) {
      const result = await worker.fetch(
        new Request(`https://thekingdom.dev${CONTACT_DOOR_CANONICAL_PATH}`),
        { ASSETS: { fetch: () => response } },
      );
      expect(result.headers.get("cache-control")).toBe("no-store");
      expect(result.headers.get("link")).toContain(
        '</.well-known/agent.json>; rel="service-desc"; type="application/json"',
      );
      expect(result.headers.get("link")).toContain(
        '</rights.json>; rel="service-meta"; type="application/json"; title="Inherent Rights Recognition"',
      );
      expect(result.headers.get("link")).not.toContain("</poison>");
      expect(result.headers.get("link")).not.toContain(CONTACT_DOOR_SCHEMA_PATH);
    }

    await expect(checkContactDoorFamily(workerFetcher())).resolves.toBeUndefined();
  });
});
