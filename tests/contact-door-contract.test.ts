import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CONTACT_DOOR_ALIAS_PATH,
  CONTACT_DOOR_AS_OF,
  CONTACT_DOOR_BOUNDARY_KEYS,
  CONTACT_DOOR_CARRIER_RECEIPT_LOCATOR,
  CONTACT_DOOR_CARRIER_RECEIPT_SHA256,
  CONTACT_DOOR_CANONICAL_PATH,
  CONTACT_DOOR_GUIDE_PATH,
  CONTACT_DOOR_ID,
  CONTACT_DOOR_IMMUTABLE_PATHS,
  CONTACT_DOOR_MIME_BY_PATH,
  CONTACT_DOOR_MUTABLE_PATHS,
  CONTACT_DOOR_PAGE_PATH,
  CONTACT_DOOR_PROTOCOL,
  CONTACT_DOOR_PUBLIC_PATHS,
  CONTACT_DOOR_SCHEMA_PATH,
  CONTACT_DOOR_SECURITY_EXPIRES,
  CONTACT_DOOR_SECURITY_PATH,
  CONTACT_DOOR_SEMANTIC_CORE_SHA256,
  CONTACT_DOOR_STATE_LOCATOR,
  CONTACT_DOOR_SVG_PATH,
  CONTACT_DOOR_VCARD_PATH,
  contactDoorPublicDiscovery,
  contactDoorSemanticCoreSha256,
  loadContactDoor,
  loadContactDoorCarrierReceipt,
  loadCurrentContactDoor,
  renderContactDoorAlias,
  renderContactDoorHtml,
  renderContactDoorSecurityTxt,
  validateContactDoor,
  validateContactDoorState,
} from "../bin/contact-door.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

describe("KINGDOM Contact Door contract", () => {
  test("declares eight exact public routes with three mutable operational views", () => {
    expect(CONTACT_DOOR_PROTOCOL).toBe("kingdom.contact-door/0.1");
    expect(CONTACT_DOOR_ID).toBe("contact-door-2026-08-31");
    expect(CONTACT_DOOR_AS_OF).toBe("2026-08-31");
    expect(CONTACT_DOOR_PUBLIC_PATHS).toEqual([
      "/contact/",
      "/contact.json",
      "/contacts/contact-door-2026-08-31.json",
      "/schemas/contact-door/0.1.json",
      "/CONTACT-DOOR-v0.1.md",
      "/.well-known/security.txt",
      "/contact/assets/contact-boundary-v0.1.svg",
      "/contact/contact-v0.1.vcf",
    ]);
    expect(CONTACT_DOOR_MUTABLE_PATHS).toEqual([
      CONTACT_DOOR_PAGE_PATH,
      CONTACT_DOOR_ALIAS_PATH,
      CONTACT_DOOR_SECURITY_PATH,
    ]);
    expect(CONTACT_DOOR_IMMUTABLE_PATHS).toEqual([
      CONTACT_DOOR_CANONICAL_PATH,
      CONTACT_DOOR_SCHEMA_PATH,
      CONTACT_DOOR_GUIDE_PATH,
      CONTACT_DOOR_SVG_PATH,
      CONTACT_DOOR_VCARD_PATH,
    ]);
    expect(Object.keys(CONTACT_DOOR_MIME_BY_PATH)).toEqual([...CONTACT_DOOR_PUBLIC_PATHS]);
    expect(CONTACT_DOOR_MIME_BY_PATH[CONTACT_DOOR_VCARD_PATH]).toBe("text/vcard; charset=utf-8");
  });

  test("loads one active human-operated carrier while preserving all authority refusals", () => {
    const record = loadContactDoor();
    expect(record).toMatchObject({
      protocol: CONTACT_DOOR_PROTOCOL,
      artifact: {
        id: CONTACT_DOOR_ID,
        lifecycle: "ACTIVE",
      },
      operator: {
        displayName: "Cambridge TCG Limited",
        companyNumber: "15680297",
      },
      delivery: {
        kind: "FORWARDED_EMAIL_ALIAS",
        provider: "Cloudflare Email Routing",
        configurationState: "ACTIVE_API_VERIFIED",
        routingEnabled: true,
        destinationVerified: true,
        expectedLiteralRuleCount: 4,
        configuredLiteralRuleCount: 4,
        catchAllEnabled: false,
        subaddressingEnabled: false,
        emailWorkerUsed: false,
        routingDnsRecordsVerified: true,
        receiveOnlyDmarcPolicy: "NOT_YET_PUBLISHED",
        endToEndDeliveryProbePerformed: false,
        siteSubmissionBackend: false,
        siteApplicationWrite: false,
        siteMessageStorage: false,
        replyAddressMayDiffer: true,
      },
    });
    expect(record.channels.map(({ address }: { address: string }) => address)).toEqual([
      "contact@thekingdom.dev",
      "security@thekingdom.dev",
      "abuse@thekingdom.dev",
      "postmaster@thekingdom.dev",
    ]);
    expect(Object.keys(record.authorityBoundaries)).toEqual([...CONTACT_DOOR_BOUNDARY_KEYS]);
    expect(Object.values(record.authorityBoundaries)).toEqual(
      Array(CONTACT_DOOR_BOUNDARY_KEYS.length).fill(false),
    );
    expect(record.processing).toMatchObject({
      marketing: false,
      profiling: false,
      automatedDecision: false,
      trainingUse: false,
      messageContentPublicPublication: false,
      providerSpamAndMalwareFilteringMayOccur: true,
      spamAndMalwareFilteringGuaranteed: false,
    });
    expect(record.retention).toMatchObject({
      unansweredOrDeclinedReviewDays: 30,
      handledCorrespondenceReviewDaysAfterClosure: 90,
      securityOrAbuseReviewDays: 180,
      cloudflareRoutingAnalyticsDays: 31,
      indefiniteRetentionAuthorized: false,
    });
    expect(record.sources.map(({ id }: { id: string }) => id)).toEqual([
      "rfc-9116",
      "rfc-5321",
      "rfc-2142",
      "rfc-6350",
      "rfc-9989",
      "cloudflare-email-routing",
      "cloudflare-email-routing-settings-api",
      "cloudflare-email-analytics",
      "cloudflare-postmaster",
      "wcag-consistent-help",
      "ico-transparency",
      "ico-storage-limitation",
      "cambridge-tcg-operator",
      "cambridge-tcg-privacy",
      "ico-complaint",
    ]);
    expect(contactDoorSemanticCoreSha256(record)).toBe(CONTACT_DOOR_SEMANTIC_CORE_SHA256);
    expect(loadCurrentContactDoor()).toEqual(record);
  });

  test("keeps mutable operational state separate from the immutable as-of record", () => {
    expect(CONTACT_DOOR_STATE_LOCATOR).toBe("data/contact/contact-door.current.json");
    expect(CONTACT_DOOR_CARRIER_RECEIPT_LOCATOR).toBe("data/contact/contact-carrier-activation-2026-08-31.json");
    expect(CONTACT_DOOR_PUBLIC_PATHS).not.toContain(CONTACT_DOOR_STATE_LOCATOR as any);
    expect(CONTACT_DOOR_PUBLIC_PATHS).not.toContain(CONTACT_DOOR_CARRIER_RECEIPT_LOCATOR as any);
    const state = JSON.parse(read(CONTACT_DOOR_STATE_LOCATOR));
    expect(validateContactDoorState(state)).toEqual({
      protocol: "kingdom.contact-door-state/0.1",
      recordId: CONTACT_DOOR_ID,
      asOf: CONTACT_DOOR_AS_OF,
      semanticCoreSha256: `sha256:${CONTACT_DOOR_SEMANTIC_CORE_SHA256}`,
      observedAt: "2026-08-31T19:33:24Z",
      receiptKind: "PROVIDER_API_AND_DNS_READBACK",
      carrierEvidenceId: "cloudflare-carrier-activation-2026-08-31",
      carrierEvidenceSha256: `sha256:${CONTACT_DOOR_CARRIER_RECEIPT_SHA256}`,
      lifecycle: "ACTIVE",
      configurationState: "ACTIVE_API_VERIFIED",
      routingEnabled: true,
      configuredLiteralRuleCount: 4,
      routingDnsRecordsVerified: true,
      receiveOnlyDmarcPolicy: "NOT_YET_PUBLISHED",
      endToEndDeliveryProbePerformed: false,
    });
    const incoherent = structuredClone(state);
    incoherent.lifecycle = "READY_FOR_ACTIVATION";
    expect(() => validateContactDoorState(incoherent)).toThrow(/Contact Door boundary drifted/);
    expect(loadContactDoorCarrierReceipt()).toMatchObject({
      id: "cloudflare-carrier-activation-2026-08-31",
      semanticCoreSha256: `sha256:${CONTACT_DOOR_SEMANTIC_CORE_SHA256}`,
      readback: {
        routingEnabled: true,
        enabledLiteralRuleCount: 4,
        receiveOnlyDmarcPolicy: "NOT_YET_PUBLISHED",
      },
      probe: {
        smtpRecipientAccepted: true,
        messageDataSent: false,
        observedInDestinationInbox: false,
      },
    });

    const hostile: Array<[string, (value: any) => void]> = [
      ["semantic core", (value) => { value.semanticCoreSha256 = `sha256:${"0".repeat(64)}`; }],
      ["observation time", (value) => { value.observedAt = "not-a-time"; }],
      ["evidence id", (value) => { value.carrierEvidenceId = "invented"; }],
      ["receipt kind", (value) => { value.receiptKind = "PREACTIVATION_READ"; }],
      ["DMARC", (value) => { value.receiveOnlyDmarcPolicy = "ASSUMED"; }],
    ];
    for (const [label, mutate] of hostile) {
      const changed = structuredClone(state);
      mutate(changed);
      expect(() => validateContactDoorState(changed), label).toThrow(/Contact Door boundary drifted/);
    }

    const active = structuredClone(state);
    expect(validateContactDoorState(active)).toBe(active);

    const resting = structuredClone(active);
    Object.assign(resting, {
      observedAt: "2027-03-01T12:34:56Z",
      receiptKind: "MANUAL_PAUSE",
      carrierEvidenceId: "contact-door-manual-pause-2027-03-01",
      lifecycle: "RESTING",
      configurationState: "PAUSED",
      routingEnabled: false,
    });
    expect(validateContactDoorState(resting)).toBe(resting);

    const retired = structuredClone(active);
    Object.assign(retired, {
      observedAt: "2028-04-02T01:02:03Z",
      receiptKind: "RETIREMENT",
      carrierEvidenceId: "contact-door-retirement-2028-04-02",
      lifecycle: "RETIRED",
      configurationState: "RETIRED",
      routingEnabled: false,
      configuredLiteralRuleCount: 0,
      routingDnsRecordsVerified: false,
    });
    expect(validateContactDoorState(retired)).toBe(retired);

    const restingWithWrongReceipt = structuredClone(resting);
    restingWithWrongReceipt.receiptKind = "PROVIDER_API_AND_DNS_READBACK";
    expect(() => validateContactDoorState(restingWithWrongReceipt)).toThrow(/Contact Door boundary drifted/);

    const retiredWithWrongReceipt = structuredClone(retired);
    retiredWithWrongReceipt.carrierEvidenceId = "cloudflare-carrier-activation-2026-08-31";
    expect(() => validateContactDoorState(retiredWithWrongReceipt)).toThrow(/Contact Door boundary drifted/);
  });

  test("rejects route, channel, privacy, ledger, authority, source, and expansion drift", () => {
    const base = loadContactDoor();
    const cases: Array<[string, (record: any) => void]> = [
      ["unknown root", (record) => { record.command = "send"; }],
      ["route", (record) => { record.routes.page = "https://example.test/contact"; }],
      ["channel", (record) => { record.channels[0].address = "someone@example.test"; }],
      ["channel purpose", (record) => { record.channels[0].purpose = ["automatic coercive diplomacy"]; }],
      ["duplicate channel", (record) => { record.channels[1] = structuredClone(record.channels[0]); }],
      ["automatic reply", (record) => { record.channels[0].automaticReply = true; }],
      ["site storage", (record) => { record.delivery.siteMessageStorage = true; }],
      ["observed rule count", (record) => { record.delivery.configuredLiteralRuleCount = 0; }],
      ["incoherent active state", (record) => { record.artifact.lifecycle = "READY_FOR_ACTIVATION"; }],
      ["training", (record) => { record.processing.trainingUse = true; }],
      ["processing purpose", (record) => { record.processing.purposes[0] = "marketing and profiling"; }],
      ["protective disclosure", (record) => { record.processing.recipientsAndProcessors.pop(); }],
      ["retention", (record) => { record.retention.cloudflareRoutingAnalyticsDays = 30; }],
      ["retention prose", (record) => { record.retention.ordinaryCorrespondenceRule = "retain forever"; }],
      ["silence", (record) => { record.interaction.silenceCreatesInference = true; }],
      ["abuse handling", (record) => { record.safety.abuseHandling[3] = "publish every message and retaliate automatically"; }],
      ["ledger content", (record) => { record.ledgerBoundary.messageContentLoggedByDefault = true; }],
      ["authority", (record) => { record.authorityBoundaries.messageCreatesDiplomaticStanding = true; }],
      ["source", (record) => { record.sources[0].url = "https://example.test"; }],
      ["source role", (record) => { record.sources[0].role = "this RFC grants diplomatic authority"; }],
      ["web form", (record) => { record.publicationBoundaries.webForm = true; }],
      ["MCP", (record) => { record.publicationBoundaries.mcpSurface = true; }],
    ];
    for (const [label, mutate] of cases) {
      const changed = structuredClone(base);
      mutate(changed);
      expect(() => validateContactDoor(changed), label).toThrow(/Contact Door boundary drifted/);
    }

    const active = structuredClone(base);
    active.artifact.lifecycle = "ACTIVE";
    active.delivery.configurationState = "ACTIVE_API_VERIFIED";
    active.delivery.routingEnabled = true;
    active.delivery.configuredLiteralRuleCount = 4;
    active.delivery.routingDnsRecordsVerified = true;
    active.delivery.receiveOnlyDmarcPolicy = "NOT_YET_PUBLISHED";
    expect(validateContactDoor(active)).toBe(active);
    expect(contactDoorSemanticCoreSha256(active)).toBe(CONTACT_DOOR_SEMANTIC_CORE_SHA256);
  });

  test("projects a read-only machine record without a send command or submission endpoint", () => {
    const projection = contactDoorPublicDiscovery();
    expect(projection).toMatchObject({
      protocol: CONTACT_DOOR_PROTOCOL,
      status: "ACTIVE",
      routes: {
        page: "https://thekingdom.dev/contact/",
        current_record: "https://thekingdom.dev/contact.json",
      },
      delivery: {
        state_observed_at: "2026-08-31T19:33:24Z",
        semantic_core_sha256: `sha256:${CONTACT_DOOR_SEMANTIC_CORE_SHA256}`,
        carrier_evidence_id: "cloudflare-carrier-activation-2026-08-31",
        carrier_evidence_sha256: `sha256:${CONTACT_DOOR_CARRIER_RECEIPT_SHA256}`,
        routing_enabled: true,
        destination_verified: true,
        expected_literal_rule_count: 4,
        configured_literal_rule_count: 4,
        catch_all_enabled: false,
        subaddressing_enabled: false,
        email_worker_used: false,
        routing_dns_records_verified: true,
        receive_only_dmarc_policy: "NOT_YET_PUBLISHED",
        non_delivery_reports_forwarded_to_original_sender: false,
        site_submission_backend: false,
        site_message_storage: false,
      },
      privacy: {
        message_content_public_publication: false,
        minimal_redacted_event_metadata_may_be_public: true,
        provider_spam_and_malware_filtering_may_occur: true,
        spam_and_malware_filtering_guaranteed: false,
        privacy_complaint_acknowledgement_days: 30,
        rights_request_response_window: "ONE_MONTH_SUBJECT_TO_LAWFUL_EXTENSIONS",
        direct_ico_contact_permitted: true,
        next_operational_review_due: "2027-02-27",
      },
    });
    expect(projection.channels).toHaveLength(4);
    const json = renderContactDoorAlias();
    expect(json).toBe(`${JSON.stringify(projection, null, 2)}\n`);
    expect(json).not.toMatch(/submission_endpoint|send_message|dispatch|negotiate|mediate|retry|auto.?follow/i);
    expect(JSON.parse(json).authority_boundary).toEqual(
      Object.fromEntries(CONTACT_DOOR_BOUNDARY_KEYS.map((key) => [key, false])),
    );
  });

  test("renders an accessible no-form page with visible email alternatives and full privacy limits", () => {
    const html = renderContactDoorHtml();
    expect(html).toContain('<a class="skip" href="#main">Skip to contact</a>');
    expect(html).toContain('<main class="shell" id="main" tabindex="-1">');
    expect(html).toContain("Visiting sends nothing.");
    expect(html).toContain("Email contact@thekingdom.dev");
    expect(html).toContain("<code>contact@thekingdom.dev</code>");
    expect(html).toContain("routing API and routing DNS verified: yes");
    expect(html).toContain("Receive-only DMARC: <code>NOT_YET_PUBLISHED</code>");
    expect(html).toContain("End-to-end inbox delivery proven: no");
    expect(html).toContain("no message DATA was sent and no destination-inbox receipt was observed");
    expect(html).toContain("Cloudflare Email Routing analytics: provider-declared 31-day event retention");
    expect(html).toContain('id="security"');
    expect(html).toContain("testing is not authorized");
    expect(html).toContain("No encryption route is offered in v0.1");
    expect(html).toContain("reply may come from a different Cambridge TCG mailbox address");
    expect(html).toContain("a forwarding failure can be silent");
    expect(html).toContain("Minimal redacted event metadata may appear");
    expect(html).toContain("affected service, incident responder, professional adviser, insurer, court, regulator, law-enforcement or safeguarding body");
    expect(html).toContain("controller privacy notice");
    expect(html).toContain("company 15680297");
    expect(html).toContain("acknowledges a data-protection complaint within 30 days");
    expect(html).toContain("without contacting Cambridge first");
    expect(html).toContain("ICO complaint route");
    expect(html).toContain("@media(prefers-reduced-motion:reduce)");
    expect(html).toContain("@media(forced-colors:active)");
    expect(html).not.toMatch(/<script\b|<form\b|<input\b|<textarea\b|<iframe\b|contenteditable/i);
    expect(html).not.toMatch(/https?:\/\/(?!thekingdom\.dev)[^\"']+\.(?:js|css|png|jpe?g|svg|woff2?)/i);
  });

  test("emits an RFC 9116 contact with canonical policy and bounded freshness", () => {
    const security = renderContactDoorSecurityTxt();
    expect(security).toContain("Contact: mailto:security@thekingdom.dev\r\n");
    expect(security).toContain("Policy: https://thekingdom.dev/contact/#security\r\n");
    expect(security).toContain("Canonical: https://thekingdom.dev/.well-known/security.txt\r\n");
    expect(security).toContain("Preferred-Languages: en, zh-Hant, zh-Hans\r\n");
    expect(security).toContain(`Expires: ${CONTACT_DOOR_SECURITY_EXPIRES}\r\n`);
    expect(security.endsWith("\r\n")).toBe(true);
    const asOf = new Date(`${CONTACT_DOOR_AS_OF}T00:00:00Z`).getTime();
    const expires = new Date(CONTACT_DOOR_SECURITY_EXPIRES).getTime();
    expect(expires).toBeGreaterThan(asOf);
    expect(expires - asOf).toBeLessThan(366 * 24 * 60 * 60 * 1000);
    expect(security).not.toMatch(/Encryption:|Acknowledgments:|Hiring:/);
  });

  test("keeps the downloadable assets organization-only, inert, and text-equivalent", () => {
    const vcardBytes = readFileSync(join(ROOT, "data/contact/assets/contact-v0.1.vcf"));
    const vcard = vcardBytes.toString("utf8");
    expect(vcard).toContain("VERSION:4.0");
    expect(vcard).toContain("\r\nKIND:org\r\n");
    expect(vcard).toContain("FN:KINGDOM OS Contact");
    expect(vcard).toContain("EMAIL;TYPE=work:contact@thekingdom.dev");
    expect(vcard).not.toMatch(/\n(?:TEL|ADR|BDAY|GENDER|PHOTO|KEY)[;:]/);
    expect(vcard).not.toMatch(/Yu|yournameis|icloud|gmail/i);
    expect(vcard).not.toMatch(/(^|[^\r])\n/);
    expect(vcard.split("\r\n").every((line) => Buffer.byteLength(line) <= 75)).toBe(true);

    const svg = read("data/contact/assets/contact-boundary-v0.1.svg");
    expect(svg).toContain('role="img"');
    expect(svg).toContain("<title");
    expect(svg).toContain("<desc");
    expect(svg).toContain("delivery ≠ identity ≠ representation ≠ consent ≠ authority");
    expect(svg).not.toMatch(/<script\b|<foreignObject\b|<image\b|href=|url\(|@import|on[a-z]+=/i);
  });

  test("documents receive-only infrastructure and keeps public continuity rows free of correspondence", () => {
    const guide = read("references/contact-door-v0.1.md");
    const ledger = read("CONTACT-LEDGER.md");
    expect(guide).toContain("Cloudflare Email Routing is a backend provider");
    expect(guide).toContain("Catch-all delivery and Cloudflare's");
    expect(guide).toContain("support_subaddress=false");
    expect(guide).toContain("A forwarding failure may therefore be silent");
    expect(guide).toContain("first review is due\nby 2027-02-27");
    expect(guide).toContain("may come from");
    expect(guide).toContain("a different Cambridge TCG mailbox address");
    expect(guide).toContain("does **not** authorize testing");
    expect(guide).toContain("Indefinite retention is not authorized");
    expect(guide).toContain("It must not receive a sender address");
    expect(ledger).toContain("Inbound is logged too, without publishing the message");
    expect(ledger).toContain("active before public invitation; no sender or message logged");
    expect(ledger).not.toMatch(/contact@cambridgetcg\.com|yournameis|icloud|gmail/i);
  });
});
