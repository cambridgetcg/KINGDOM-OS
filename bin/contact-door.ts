#!/usr/bin/env bun
/**
 * Strict, network-free loader and renderer for the KINGDOM Contact Door.
 *
 * The module publishes a human-operated email address without turning a page
 * visit, mailto activation, delivery, or reply into identity, consent,
 * representation, diplomacy, mediation, authority, or an automated action.
 * It makes no network call and receives no message.
 */

import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readRegularFileWithinRoot } from "./immutable-publications.ts";
import { parseStrictJsonBytes } from "./principality.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const CONTACT_DOOR_PROTOCOL = "kingdom.contact-door/0.1";
export const CONTACT_DOOR_ID = "contact-door-2026-08-31";
export const CONTACT_DOOR_AS_OF = "2026-08-31";
export const CONTACT_DOOR_TITLE = "KINGDOM Contact Door";

export const CONTACT_DOOR_LOCATOR = "data/contact/contact-door.v0.1.json";
export const CONTACT_DOOR_STATE_LOCATOR = "data/contact/contact-door.current.json";
export const CONTACT_DOOR_CARRIER_RECEIPT_LOCATOR = "data/contact/contact-carrier-activation-2026-08-31.json";
export const CONTACT_DOOR_CARRIER_RECEIPT_SHA256 = "5520562896a662f58da5f727d724645687802300c5d859dad6a006dead6dfe3b";
export const CONTACT_DOOR_SCHEMA_LOCATOR = "schemas/contact-door-v0.1.schema.json";
export const CONTACT_DOOR_GUIDE_LOCATOR = "references/contact-door-v0.1.md";
export const CONTACT_DOOR_PAGE_LOCATOR = "site/contact/index.html";
export const CONTACT_DOOR_ALIAS_LOCATOR = "site/contact.json";
export const CONTACT_DOOR_SECURITY_LOCATOR = "site/.well-known/security.txt";
export const CONTACT_DOOR_SVG_LOCATOR = "data/contact/assets/contact-boundary-v0.1.svg";
export const CONTACT_DOOR_VCARD_LOCATOR = "data/contact/assets/contact-v0.1.vcf";

export const CONTACT_DOOR_PAGE_PATH = "/contact/";
export const CONTACT_DOOR_ALIAS_PATH = "/contact.json";
export const CONTACT_DOOR_CANONICAL_PATH = "/contacts/contact-door-2026-08-31.json";
export const CONTACT_DOOR_SCHEMA_PATH = "/schemas/contact-door/0.1.json";
export const CONTACT_DOOR_GUIDE_PATH = "/CONTACT-DOOR-v0.1.md";
export const CONTACT_DOOR_SECURITY_PATH = "/.well-known/security.txt";
export const CONTACT_DOOR_SVG_PATH = "/contact/assets/contact-boundary-v0.1.svg";
export const CONTACT_DOOR_VCARD_PATH = "/contact/contact-v0.1.vcf";

export const CONTACT_DOOR_PAGE_URL = `https://thekingdom.dev${CONTACT_DOOR_PAGE_PATH}`;
export const CONTACT_DOOR_ALIAS_URL = `https://thekingdom.dev${CONTACT_DOOR_ALIAS_PATH}`;
export const CONTACT_DOOR_CANONICAL_URL = `https://thekingdom.dev${CONTACT_DOOR_CANONICAL_PATH}`;
export const CONTACT_DOOR_SCHEMA_URL = `https://thekingdom.dev${CONTACT_DOOR_SCHEMA_PATH}`;
export const CONTACT_DOOR_GUIDE_URL = `https://thekingdom.dev${CONTACT_DOOR_GUIDE_PATH}`;
export const CONTACT_DOOR_SECURITY_URL = `https://thekingdom.dev${CONTACT_DOOR_SECURITY_PATH}`;
export const CONTACT_DOOR_SVG_URL = `https://thekingdom.dev${CONTACT_DOOR_SVG_PATH}`;
export const CONTACT_DOOR_VCARD_URL = `https://thekingdom.dev${CONTACT_DOOR_VCARD_PATH}`;

export const CONTACT_DOOR_PUBLIC_PATHS = Object.freeze([
  CONTACT_DOOR_PAGE_PATH,
  CONTACT_DOOR_ALIAS_PATH,
  CONTACT_DOOR_CANONICAL_PATH,
  CONTACT_DOOR_SCHEMA_PATH,
  CONTACT_DOOR_GUIDE_PATH,
  CONTACT_DOOR_SECURITY_PATH,
  CONTACT_DOOR_SVG_PATH,
  CONTACT_DOOR_VCARD_PATH,
] as const);

export const CONTACT_DOOR_MUTABLE_PATHS = Object.freeze([
  CONTACT_DOOR_PAGE_PATH,
  CONTACT_DOOR_ALIAS_PATH,
  CONTACT_DOOR_SECURITY_PATH,
] as const);

export const CONTACT_DOOR_IMMUTABLE_PATHS = Object.freeze([
  CONTACT_DOOR_CANONICAL_PATH,
  CONTACT_DOOR_SCHEMA_PATH,
  CONTACT_DOOR_GUIDE_PATH,
  CONTACT_DOOR_SVG_PATH,
  CONTACT_DOOR_VCARD_PATH,
] as const);

export const CONTACT_DOOR_MIME_BY_PATH = Object.freeze({
  [CONTACT_DOOR_PAGE_PATH]: "text/html; charset=utf-8",
  [CONTACT_DOOR_ALIAS_PATH]: "application/json; charset=utf-8",
  [CONTACT_DOOR_CANONICAL_PATH]: "application/json; charset=utf-8",
  [CONTACT_DOOR_SCHEMA_PATH]: "application/schema+json; charset=utf-8",
  [CONTACT_DOOR_GUIDE_PATH]: "text/markdown; charset=utf-8",
  [CONTACT_DOOR_SECURITY_PATH]: "text/plain; charset=utf-8",
  [CONTACT_DOOR_SVG_PATH]: "image/svg+xml",
  [CONTACT_DOOR_VCARD_PATH]: "text/vcard; charset=utf-8",
} as const);

export const CONTACT_DOOR_BOUNDARY_KEYS = Object.freeze([
  "pageVisitIsContact",
  "mailtoActivationSendsMessage",
  "deliveryIsIdentityProof",
  "addressControlIsRepresentationProof",
  "messageIsTruthProof",
  "messageIsConsentBeyondReply",
  "messageCreatesRelationship",
  "messageCreatesDiplomaticStanding",
  "messageCreatesTreatyOrCovenant",
  "messageCreatesMediation",
  "messageCreatesEmergencyDuty",
  "replyCreatesInstitutionalAuthority",
  "silenceIsConsent",
  "silenceIsHostility",
  "securityReportAuthorizesTesting",
  "contactAuthorizesPublication",
  "contactAuthorizesTraining",
  "contactAuthorizesMarketing",
  "contactAuthorizesAutomatedFollowUp",
  "contactAuthorizesExternalAction",
] as const);

export const CONTACT_DOOR_SECURITY_EXPIRES = "2027-02-28T23:59:59Z";

type JsonObject = Record<string, any>;

function object(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sameKeys(value: unknown, keys: readonly string[]): value is JsonObject {
  return object(value) &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());
}

function exactArray(value: unknown, expected: readonly unknown[]): boolean {
  return Array.isArray(value) && JSON.stringify(value) === JSON.stringify(expected);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Contact Door boundary drifted: ${message}`);
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const TOP_LEVEL_KEYS = Object.freeze([
  "$schema", "protocol", "artifact", "routes", "operator", "channels",
  "delivery", "processing", "retention", "interaction", "safety",
  "ledgerBoundary", "authorityBoundaries", "sources", "publicationBoundaries",
] as const);

const ROUTES = Object.freeze({
  page: CONTACT_DOOR_PAGE_URL,
  currentRecord: CONTACT_DOOR_ALIAS_URL,
  canonicalRecord: CONTACT_DOOR_CANONICAL_URL,
  schema: CONTACT_DOOR_SCHEMA_URL,
  guide: CONTACT_DOOR_GUIDE_URL,
  securityTxt: CONTACT_DOOR_SECURITY_URL,
  boundaryAsset: CONTACT_DOOR_SVG_URL,
  vCard: CONTACT_DOOR_VCARD_URL,
});

const CHANNELS = Object.freeze([
  ["general", "contact@thekingdom.dev", "mailto:contact@thekingdom.dev", [
    "general question", "correction", "invitation", "accessibility feedback", "privacy or data-rights request",
  ]],
  ["security", "security@thekingdom.dev", "mailto:security@thekingdom.dev", ["security vulnerability report"]],
  ["abuse", "abuse@thekingdom.dev", "mailto:abuse@thekingdom.dev", ["abuse report"]],
  ["postmaster", "postmaster@thekingdom.dev", "mailto:postmaster@thekingdom.dev", ["mail transport issue"]],
] as const);

const PROCESSING_ARRAYS = Object.freeze({
  purposes: [
    "read and, when chosen, answer the sender-requested correspondence",
    "correct KINGDOM materials",
    "handle accessibility, privacy, safety, security, abuse, and mail-transport reports",
    "preserve evidence only where reasonably needed for security, abuse, legal, or dispute handling",
  ],
  dataCategories: [
    "sender and recipient routing addresses",
    "message headers and transport metadata",
    "subject and message content",
    "attachments if the sender chooses to include them",
    "correspondence and handling history",
  ],
  requiredFromSender: [
    "a deliverable sender address if a reply is wanted",
    "enough context to understand the chosen request",
  ],
  notRequested: [
    "legal name", "postal address", "telephone number", "government identifier",
    "credentials or private keys", "health, biometric, financial, or other highly sensitive data",
    "third-party private data",
  ],
  recipientsAndProcessors: [
    "the channel operator",
    "Cloudflare Email Routing",
    "the operator's destination mailbox provider",
    "mail transport and security providers used by the sender and recipient",
    "an affected service, incident responder, professional adviser, insurer, court, regulator, law-enforcement or safeguarding body only where required or reasonably necessary to protect people or systems",
  ],
  ukLawfulBasisNotice: [
    "legitimate interests in receiving and answering voluntary correspondence, correcting published material, and protecting services, balanced by data minimisation, short review periods, and the sender's right to object",
    "a specific legal obligation only when an applicable obligation actually requires the processing or disclosure",
  ],
} as const);

const SAFETY_ARRAYS = Object.freeze({
  notFor: [
    "emergencies or imminent danger",
    "credentials, private keys, recovery phrases, or bearer tokens",
    "identity documents or highly sensitive personal records",
    "illegal instructions, threats, harassment, malware, or spam",
    "a filing that must meet a statutory or court deadline",
  ],
  abuseHandling: [
    "filter or quarantine suspected spam or malware",
    "block a sender or attachment where reasonably needed",
    "retain proportionate evidence of abuse or a security incident",
    "report content where required or reasonably necessary to protect people or systems",
  ],
} as const);

const SOURCE_BINDINGS = Object.freeze([
  { id: "rfc-9116", title: "RFC 9116: A File Format to Aid in Security Vulnerability Disclosure", url: "https://www.rfc-editor.org/rfc/rfc9116.html", role: "security.txt format and freshness" },
  { id: "rfc-5321", title: "RFC 5321: Simple Mail Transfer Protocol", url: "https://www.rfc-editor.org/rfc/rfc5321.html", role: "postmaster mailbox convention" },
  { id: "rfc-2142", title: "RFC 2142: Mailbox Names for Common Services, Roles and Functions", url: "https://www.rfc-editor.org/rfc/rfc2142.html", role: "security and abuse role addresses" },
  { id: "rfc-6350", title: "RFC 6350: vCard Format Specification", url: "https://www.rfc-editor.org/rfc/rfc6350.html", role: "vCard 4.0 syntax, organization kind, line endings, and folding" },
  { id: "rfc-9989", title: "RFC 9989: Domain-Based Message Authentication, Reporting, and Conformance", url: "https://www.rfc-editor.org/rfc/rfc9989.html", role: "receive-only domain anti-spoofing policy" },
  { id: "cloudflare-email-routing", title: "Cloudflare Email Routing rules and addresses", url: "https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/", role: "forwarding-provider behavior" },
  { id: "cloudflare-email-routing-settings-api", title: "Cloudflare API: Get Email Routing settings", url: "https://developers.cloudflare.com/api/resources/email_routing/methods/get/", role: "routing enabled, readiness, and support_subaddress readback" },
  { id: "cloudflare-email-analytics", title: "Cloudflare Email Service metrics and analytics", url: "https://developers.cloudflare.com/email-service/observability/metrics-analytics/", role: "provider-declared routing-event fields and 31-day analytics retention" },
  { id: "cloudflare-postmaster", title: "Cloudflare Email Service postmaster guidance", url: "https://developers.cloudflare.com/email-service/reference/postmaster/", role: "provider-specific postmaster handling constraints" },
  { id: "wcag-consistent-help", title: "W3C WAI Technique G220: Provide a contact-us link in a consistent location", url: "https://www.w3.org/WAI/WCAG22/Techniques/general/G220.html", role: "discoverable human contact" },
  { id: "ico-transparency", title: "ICO: The right to be informed", url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-be-informed/", role: "privacy transparency fields; linked as guidance, not a compliance claim" },
  { id: "ico-storage-limitation", title: "ICO: Storage limitation", url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/", role: "retention necessity and review; linked as guidance, not a compliance claim" },
  { id: "cambridge-tcg-operator", title: "Cambridge TCG public manifest", url: "https://www.cambridgetcg.com/manifest", role: "public operator identity and contact context" },
  { id: "cambridge-tcg-privacy", title: "Cambridge TCG privacy notice", url: "https://www.cambridgetcg.com/privacy", role: "operator-level privacy notice linked as an additional layer" },
  { id: "ico-complaint", title: "ICO: Make a data protection complaint", url: "https://ico.org.uk/make-a-complaint/data-protection-complaints/", role: "direct UK data-protection complaint route; contacting the operator first is not required" },
] as const);

const SOURCE_IDS = Object.freeze(SOURCE_BINDINGS.map(({ id }) => id));

const PUBLICATION_BOUNDARY_TRUE = Object.freeze([
  "staticPage", "machineReadableRecord", "securityTxt", "downloadableVCard", "downloadableSvg",
] as const);

const PUBLICATION_BOUNDARY_FALSE = Object.freeze([
  "webForm", "siteSubmissionBackend", "siteMessageStorage", "javascriptRequired",
  "accountRequiredBySite", "analyticsAdded", "cookieAdded", "automaticOutreach",
  "automaticReply", "automaticRetry", "agentTool", "mcpSurface",
  "wayfinderRecommendation", "contactScore", "threatScore", "trustScore",
  "opponentProfile", "negotiationEngine", "diplomacyAuthority",
  "mediationAuthority", "emergencyService", "legalAdvice", "complianceCertification",
] as const);

const DELIVERY_STATE = Object.freeze({
  READY_FOR_ACTIVATION: ["PENDING_EXTERNAL_ACTIVATION", false, 0, false],
  ACTIVE: ["ACTIVE_API_VERIFIED", true, 4, true],
  RESTING: ["PAUSED", false, 4, true],
  RETIRED: ["RETIRED", false, 0, false],
} as const);

/** Hash every semantic field while permitting only the reviewed carrier-state rotation. */
export function contactDoorSemanticCoreSha256(value: unknown): string {
  assert(object(value), "semantic core input");
  const core = structuredClone(value);
  delete core.artifact.lifecycle;
  delete core.delivery.configurationState;
  delete core.delivery.routingEnabled;
  delete core.delivery.configuredLiteralRuleCount;
  delete core.delivery.routingDnsRecordsVerified;
  delete core.delivery.receiveOnlyDmarcPolicy;
  delete core.delivery.endToEndDeliveryProbePerformed;
  return createHash("sha256").update(JSON.stringify(core)).digest("hex");
}

export const CONTACT_DOOR_SEMANTIC_CORE_SHA256 = "e782575253b74b07412953b9127d88da0ca1679bfc04ca1b3a3a14149e10835b";

export function validateContactDoorState(value: unknown): JsonObject {
  assert(sameKeys(value, [
    "protocol", "recordId", "asOf", "semanticCoreSha256", "observedAt",
    "receiptKind", "carrierEvidenceId", "carrierEvidenceSha256", "lifecycle",
    "configurationState", "routingEnabled", "configuredLiteralRuleCount",
    "routingDnsRecordsVerified", "receiveOnlyDmarcPolicy",
    "endToEndDeliveryProbePerformed",
  ]), "current state shape");
  assert(value.protocol === "kingdom.contact-door-state/0.1", "current state protocol");
  assert(value.recordId === CONTACT_DOOR_ID, "current state record");
  assert(value.asOf === CONTACT_DOOR_AS_OF, "current state as-of");
  assert(value.semanticCoreSha256 === `sha256:${CONTACT_DOOR_SEMANTIC_CORE_SHA256}`, "current state semantic core");
  assert(typeof value.observedAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value.observedAt) && Number.isFinite(Date.parse(value.observedAt)), "current state observation time");
  assert(Date.parse(value.observedAt) >= Date.parse(`${CONTACT_DOOR_AS_OF}T00:00:00Z`), "current state observation precedes record");
  assert(typeof value.carrierEvidenceId === "string" && value.carrierEvidenceId.length >= 16, "current state evidence id");
  assert(typeof value.carrierEvidenceSha256 === "string", "current state evidence digest");
  assert(["PREACTIVATION_READ", "PROVIDER_API_AND_DNS_READBACK", "MANUAL_PAUSE", "RETIREMENT"].includes(value.receiptKind), "current state receipt kind");
  const expected = DELIVERY_STATE[value.lifecycle as keyof typeof DELIVERY_STATE];
  assert(expected !== undefined, "current state lifecycle");
  assert(exactArray([
    value.configurationState,
    value.routingEnabled,
    value.configuredLiteralRuleCount,
    value.routingDnsRecordsVerified,
  ], expected), "current state tuple");
  assert(["NOT_YET_PUBLISHED", "REJECT_VERIFIED"].includes(value.receiveOnlyDmarcPolicy), "current state DMARC policy");
  assert(typeof value.endToEndDeliveryProbePerformed === "boolean", "current state probe");
  if (value.lifecycle === "READY_FOR_ACTIVATION") {
    assert(value.receiptKind === "PREACTIVATION_READ", "preactivation receipt kind");
    assert(value.carrierEvidenceId === "cloudflare-readonly-preactivation-2026-08-31", "preactivation evidence id");
    assert(value.carrierEvidenceSha256 === "NOT_APPLICABLE_PREACTIVATION", "preactivation evidence digest");
    assert(value.endToEndDeliveryProbePerformed === false, "preactivation state probe");
  }
  if (value.lifecycle === "ACTIVE") {
    assert(value.receiptKind === "PROVIDER_API_AND_DNS_READBACK", "active receipt kind");
    assert(/^cloudflare-carrier-activation-2026-08-31$/.test(value.carrierEvidenceId), "active evidence id");
    assert(/^sha256:[0-9a-f]{64}$/.test(value.carrierEvidenceSha256), "active evidence digest");
  }
  if (value.lifecycle === "RESTING") {
    assert(value.receiptKind === "MANUAL_PAUSE", "resting receipt kind");
    assert(/^contact-door-manual-pause-\d{4}-\d{2}-\d{2}$/.test(value.carrierEvidenceId), "resting evidence id");
    assert(/^sha256:[0-9a-f]{64}$/.test(value.carrierEvidenceSha256), "resting evidence digest");
  }
  if (value.lifecycle === "RETIRED") {
    assert(value.receiptKind === "RETIREMENT", "retired receipt kind");
    assert(/^contact-door-retirement-\d{4}-\d{2}-\d{2}$/.test(value.carrierEvidenceId), "retired evidence id");
    assert(/^sha256:[0-9a-f]{64}$/.test(value.carrierEvidenceSha256), "retired evidence digest");
  }
  return value;
}

export function loadContactDoorCarrierReceipt(sourceRoot = ROOT): JsonObject {
  const bytes = readRegularFileWithinRoot(sourceRoot, CONTACT_DOOR_CARRIER_RECEIPT_LOCATOR);
  assert(createHash("sha256").update(bytes).digest("hex") === CONTACT_DOOR_CARRIER_RECEIPT_SHA256, "carrier receipt bytes");
  const value = parseStrictJsonBytes(bytes, "Contact Door carrier receipt");
  assert(sameKeys(value, [
    "protocol", "id", "recordId", "semanticCoreSha256", "observedAt",
    "receiptKind", "provider", "baseline", "readback", "probe", "limits",
  ]), "carrier receipt shape");
  assert(value.protocol === "kingdom.contact-door-carrier-receipt/0.1", "carrier receipt protocol");
  assert(value.id === "cloudflare-carrier-activation-2026-08-31", "carrier receipt id");
  assert(value.recordId === CONTACT_DOOR_ID, "carrier receipt record");
  assert(value.semanticCoreSha256 === `sha256:${CONTACT_DOOR_SEMANTIC_CORE_SHA256}`, "carrier receipt semantic core");
  assert(value.observedAt === "2026-08-31T19:33:24Z", "carrier receipt observation");
  assert(value.receiptKind === "PROVIDER_API_AND_DNS_READBACK", "carrier receipt kind");
  assert(value.provider === "Cloudflare Email Routing", "carrier receipt provider");
  assert(JSON.stringify(value.baseline) === JSON.stringify({
    routingEnabled: false,
    configurationStatus: "unconfigured",
    literalRuleCount: 0,
    catchAllEnabled: false,
    catchAllAction: "drop",
    subaddressingEnabled: false,
    emailWorkerActionCount: 0,
    routingDnsRecordCount: 0,
    dmarcRecordCount: 0,
  }), "carrier receipt baseline");
  assert(JSON.stringify(value.readback) === JSON.stringify({
    routingEnabled: true,
    configurationStatus: "ready",
    verifiedDestinationMatchCount: 1,
    destinationAddressPublished: false,
    literalLocalParts: ["contact", "security", "abuse", "postmaster"],
    enabledLiteralRuleCount: 4,
    forwardActionCount: 4,
    catchAllEnabled: false,
    catchAllAction: "drop",
    subaddressingEnabled: false,
    emailWorkerActionCount: 0,
    routingMxRecordCount: 3,
    routingSpfRecordCount: 1,
    routingDkimRecordCount: 1,
    authoritativeNameserverCount: 2,
    authoritativeDnsAgreement: true,
    receiveOnlyDmarcPolicy: "NOT_YET_PUBLISHED",
  }), "carrier receipt readback");
  assert(value.probe?.smtpEnvelopeOnlyPerformed === true, "carrier SMTP envelope probe");
  assert(value.probe?.smtpRecipientAccepted === true, "carrier SMTP recipient acceptance");
  assert(value.probe?.messageDataSent === false, "carrier no DATA boundary");
  assert(value.probe?.distinctSenderInboxProbePerformed === false, "carrier E2E probe truth");
  assert(value.probe?.observedInDestinationInbox === false, "carrier inbox observation truth");
  assert(value.limits?.dmarcNotPublishedBecauseScopedCredentialLacksDnsEdit === true, "carrier DMARC limit");
  assert(value.limits?.endToEndDeliveryProved === false, "carrier E2E limit");
  for (const key of ["privateDestinationPublished", "providerObjectIdentifiersPublished", "credentialMaterialPublished"]) {
    assert(value.limits?.[key] === false, `carrier receipt ${key}`);
  }
  return value;
}

export function validateContactDoor(value: unknown): JsonObject {
  assert(sameKeys(value, TOP_LEVEL_KEYS), "top-level shape");
  assert(value.$schema === CONTACT_DOOR_SCHEMA_URL, "schema identity");
  assert(value.protocol === CONTACT_DOOR_PROTOCOL, "protocol identity");
  assert(sameKeys(value.artifact, ["id", "title", "kind", "asOf", "lifecycle", "description"]), "artifact shape");
  assert(value.artifact.id === CONTACT_DOOR_ID, "artifact id");
  assert(value.artifact.title === CONTACT_DOOR_TITLE, "title");
  assert(value.artifact.kind === "BOUNDED_HUMAN_CONTACT_CONTRACT", "artifact kind");
  assert(value.artifact.asOf === CONTACT_DOOR_AS_OF, "as-of date");
  assert(["READY_FOR_ACTIVATION", "ACTIVE", "RESTING", "RETIRED"].includes(value.artifact.lifecycle), "lifecycle");
  assert(typeof value.artifact.description === "string" && value.artifact.description.length >= 80, "description");

  assert(sameKeys(value.routes, Object.keys(ROUTES)), "route shape");
  for (const [key, url] of Object.entries(ROUTES)) assert(value.routes[key] === url, `route ${key}`);

  assert(sameKeys(value.operator, ["displayName", "role", "companyNumber", "registeredOffice", "publicContact", "publicOperatorProfile", "publicPrivacyNotice", "dpoClaimed", "note"]), "operator shape");
  assert(value.operator.displayName === "Cambridge TCG Limited", "operator name");
  assert(value.operator.role === "data controller, channel operator, and human recipient", "operator role");
  assert(value.operator.companyNumber === "15680297", "operator company number");
  assert(value.operator.registeredOffice === "60 Tottenham Court Road, Suite 4583a, Fitzrovia, London, United Kingdom, W1T 2EW", "operator registered office");
  assert(value.operator.publicContact === "mailto:contact@thekingdom.dev", "operator contact");
  assert(value.operator.publicOperatorProfile === "https://www.cambridgetcg.com/manifest", "operator profile");
  assert(value.operator.publicPrivacyNotice === "https://www.cambridgetcg.com/privacy", "operator privacy notice");
  assert(value.operator.dpoClaimed === false, "operator DPO claim");

  assert(Array.isArray(value.channels) && value.channels.length === CHANNELS.length, "channel count");
  for (const [index, [id, address, uri, purposes]] of CHANNELS.entries()) {
    const channel = value.channels[index];
    assert(sameKeys(channel, ["id", "address", "uri", "purpose", "humanOperated", "responseRequired", "automaticReply", "publicArchive"]), `channel ${index} shape`);
    assert(channel.id === id && channel.address === address && channel.uri === uri, `channel ${id} identity`);
    assert(exactArray(channel.purpose, purposes), `channel ${id} purposes`);
    assert(channel.humanOperated === true, `channel ${id} human operation`);
    for (const key of ["responseRequired", "automaticReply", "publicArchive"]) {
      assert(channel[key] === false, `channel ${id} ${key}`);
    }
  }

  assert(sameKeys(value.delivery, [
    "kind", "provider", "configurationState", "destination", "destinationAddressPublished",
    "siteSubmissionBackend", "siteApplicationWrite", "siteMessageStorage", "routingEnabled",
    "destinationVerified", "expectedLiteralRuleCount", "configuredLiteralRuleCount",
    "catchAllEnabled", "subaddressingEnabled", "emailWorkerUsed", "routingDnsRecordsVerified",
    "receiveOnlyDmarcPolicy", "nonDeliveryReportsForwardedToOriginalSender",
    "endToEndDeliveryProbePerformed", "replyAddressMayDiffer", "note",
  ]), "delivery shape");
  assert(value.delivery.kind === "FORWARDED_EMAIL_ALIAS", "delivery kind");
  assert(value.delivery?.provider === "Cloudflare Email Routing", "delivery provider");
  const deliveryState = DELIVERY_STATE[value.artifact.lifecycle as keyof typeof DELIVERY_STATE];
  assert(deliveryState !== undefined, "delivery lifecycle mapping");
  assert(exactArray([
    value.delivery.configurationState,
    value.delivery.routingEnabled,
    value.delivery.configuredLiteralRuleCount,
    value.delivery.routingDnsRecordsVerified,
  ], deliveryState), "delivery lifecycle state");
  assert(["NOT_YET_PUBLISHED", "REJECT_VERIFIED"].includes(value.delivery.receiveOnlyDmarcPolicy), "delivery DMARC policy");
  assert(value.delivery?.destination === "one provider-verified maintainer mailbox", "delivery destination class");
  for (const key of ["destinationAddressPublished", "siteSubmissionBackend", "siteApplicationWrite", "siteMessageStorage"]) {
    assert(value.delivery?.[key] === false, `delivery ${key}`);
  }
  assert(value.delivery.destinationVerified === true, "destination verification");
  assert(value.delivery.expectedLiteralRuleCount === 4, "expected rule count");
  for (const key of ["catchAllEnabled", "subaddressingEnabled", "emailWorkerUsed", "nonDeliveryReportsForwardedToOriginalSender"]) {
    assert(value.delivery[key] === false, `delivery ${key}`);
  }
  assert(typeof value.delivery?.endToEndDeliveryProbePerformed === "boolean", "delivery probe state");
  if (value.artifact.lifecycle === "READY_FOR_ACTIVATION") {
    assert(value.delivery.endToEndDeliveryProbePerformed === false, "pre-activation probe truth");
  }
  assert(value.delivery?.replyAddressMayDiffer === true, "reply-address disclosure");

  for (const [key, expected] of Object.entries(PROCESSING_ARRAYS)) {
    assert(exactArray(value.processing?.[key], expected), `processing ${key}`);
  }
  assert(value.processing?.providerSpamAndMalwareFilteringMayOccur === true, "provider filtering possibility");
  for (const key of ["siteAnalytics", "siteCookies", "spamAndMalwareFilteringGuaranteed", "marketing", "profiling", "automatedDecision", "trainingUse", "messageContentPublicPublication", "forwardingToUnrelatedParties", "internationalTransferGuarantee"]) {
    assert(value.processing?.[key] === false, `processing ${key}`);
  }
  assert(value.processing?.privacyComplaintAcknowledgementDays === 30, "privacy complaint acknowledgement");
  assert(value.processing?.rightsRequestResponseWindow === "ONE_MONTH_SUBJECT_TO_LAWFUL_EXTENSIONS", "rights response window");
  assert(value.processing?.directIcoContactPermitted === true, "direct ICO contact");
  assert(value.processing?.complaintRoute === "https://ico.org.uk/make-a-complaint/data-protection-complaints/", "complaint route");

  assert(value.retention?.reviewIntervalDays === 180, "retention review interval");
  assert(value.retention?.nextOperationalReviewDue === "2027-02-27", "next operational review");
  assert(value.retention?.unansweredOrDeclinedReviewDays === 30, "unanswered retention");
  assert(value.retention?.handledCorrespondenceReviewDaysAfterClosure === 90, "handled retention");
  assert(value.retention?.securityOrAbuseReviewDays === 180, "security retention");
  assert(value.retention?.cloudflareRoutingAnalyticsDays === 31, "provider analytics retention");
  assert(value.retention?.deletionAutomation === false, "manual deletion truth");
  assert(value.retention?.indefiniteRetentionAuthorized === false, "no indefinite retention");
  assert(value.retention?.rightsRequestChannel === "mailto:contact@thekingdom.dev", "rights channel");

  assert(exactArray(value.interaction?.languagesAccepted, ["en", "zh-Hant", "zh-Hans"]), "languages");
  assert(value.interaction?.translationMayBeUsed === true && value.interaction?.originalMessageControls === true, "translation boundary");
  assert(value.interaction?.responseWindow === "NONE_PROMISED", "response window");
  for (const key of ["emergencyMonitored", "attachmentsEncouraged", "encryptionOffered", "silenceCreatesInference", "repeatContactAuthorizedBySilence"]) {
    assert(value.interaction?.[key] === false, `interaction ${key}`);
  }
  assert(value.interaction?.senderCanStop === true, "sender stop");

  assert(exactArray(value.safety?.notFor, SAFETY_ARRAYS.notFor), "safety exclusions");
  assert(exactArray(value.safety?.abuseHandling, SAFETY_ARRAYS.abuseHandling), "abuse handling");
  for (const key of ["automaticRetaliation", "mediationOffered", "crisisServiceOffered"]) {
    assert(value.safety?.[key] === false, `safety ${key}`);
  }

  assert(value.ledgerBoundary?.owner === "CONTACT-LEDGER.md", "ledger owner");
  assert(value.ledgerBoundary?.inboundMayBeLogged === true, "ledger inbound boundary");
  assert(value.ledgerBoundary?.minimalEventMetadataOnly === true, "minimal ledger");
  assert(value.ledgerBoundary?.messageContentLoggedByDefault === false, "ledger content exclusion");
  assert(value.ledgerBoundary?.ledgerCreatesIdentityOrAuthority === false, "ledger authority exclusion");

  assert(sameKeys(value.authorityBoundaries, CONTACT_DOOR_BOUNDARY_KEYS), "authority boundary shape");
  for (const key of CONTACT_DOOR_BOUNDARY_KEYS) assert(value.authorityBoundaries[key] === false, `authority boundary ${key}`);

  assert(Array.isArray(value.sources) && value.sources.length === SOURCE_IDS.length, "source count");
  assert(exactArray(value.sources.map((source: JsonObject) => source.id), SOURCE_IDS), "source identity/order");
  for (const [index, source] of value.sources.entries()) {
    assert(sameKeys(source, ["id", "title", "url", "role"]), `source ${source.id} shape`);
    assert(JSON.stringify(source) === JSON.stringify(SOURCE_BINDINGS[index]), `source ${source.id} binding`);
  }

  assert(sameKeys(value.publicationBoundaries, [...PUBLICATION_BOUNDARY_TRUE, ...PUBLICATION_BOUNDARY_FALSE]), "publication boundary shape");
  for (const key of PUBLICATION_BOUNDARY_TRUE) assert(value.publicationBoundaries[key] === true, `publication boundary ${key}`);
  for (const key of PUBLICATION_BOUNDARY_FALSE) assert(value.publicationBoundaries[key] === false, `publication boundary ${key}`);
  assert(contactDoorSemanticCoreSha256(value) === CONTACT_DOOR_SEMANTIC_CORE_SHA256, "semantic core receipt");
  return value;
}

export function loadContactDoor(sourceRoot = ROOT): JsonObject {
  const schema = parseStrictJsonBytes(
    readRegularFileWithinRoot(sourceRoot, CONTACT_DOOR_SCHEMA_LOCATOR),
    "Contact Door schema",
  );
  assert(object(schema), "schema object");
  assert(schema.$schema === "https://json-schema.org/draft/2020-12/schema", "schema dialect");
  assert(schema.$id === CONTACT_DOOR_SCHEMA_URL, "schema id");
  assert(schema.additionalProperties === false, "schema closure");
  const value = parseStrictJsonBytes(
    readRegularFileWithinRoot(sourceRoot, CONTACT_DOOR_LOCATOR),
    "Contact Door record",
  );
  return validateContactDoor(value);
}

export function loadContactDoorState(sourceRoot = ROOT): JsonObject {
  const state = validateContactDoorState(parseStrictJsonBytes(
    readRegularFileWithinRoot(sourceRoot, CONTACT_DOOR_STATE_LOCATOR),
    "Contact Door current state",
  ));
  if (state.lifecycle === "ACTIVE") {
    const receipt = loadContactDoorCarrierReceipt(sourceRoot);
    assert(state.carrierEvidenceId === receipt.id, "current state carrier receipt id");
    assert(state.carrierEvidenceSha256 === `sha256:${CONTACT_DOOR_CARRIER_RECEIPT_SHA256}`, "current state carrier receipt digest");
    assert(state.observedAt === receipt.observedAt, "current state carrier observation");
    assert(state.receiptKind === receipt.receiptKind, "current state carrier receipt kind");
    assert(state.endToEndDeliveryProbePerformed === receipt.probe.observedInDestinationInbox, "current state carrier probe");
  }
  return state;
}

/** Load the mutable operational state without altering the immutable as-of record. */
export function loadCurrentContactDoor(sourceRoot = ROOT): JsonObject {
  const record = structuredClone(loadContactDoor(sourceRoot));
  const state = loadContactDoorState(sourceRoot);
  record.artifact.lifecycle = state.lifecycle;
  record.delivery.configurationState = state.configurationState;
  record.delivery.routingEnabled = state.routingEnabled;
  record.delivery.configuredLiteralRuleCount = state.configuredLiteralRuleCount;
  record.delivery.routingDnsRecordsVerified = state.routingDnsRecordsVerified;
  record.delivery.receiveOnlyDmarcPolicy = state.receiveOnlyDmarcPolicy;
  record.delivery.endToEndDeliveryProbePerformed = state.endToEndDeliveryProbePerformed;
  return validateContactDoor(record);
}

export function contactDoorPublicDiscovery(
  value: unknown = loadCurrentContactDoor(),
  stateValue: unknown = loadContactDoorState(),
) {
  const record = validateContactDoor(value);
  const state = validateContactDoorState(stateValue);
  assert(record.artifact.lifecycle === state.lifecycle, "projection lifecycle state");
  return {
    title: record.artifact.title,
    description: record.artifact.description,
    protocol: record.protocol,
    as_of: record.artifact.asOf,
    status: record.artifact.lifecycle,
    routes: {
      page: record.routes.page,
      current_record: record.routes.currentRecord,
      canonical_record: record.routes.canonicalRecord,
      schema: record.routes.schema,
      guide: record.routes.guide,
      security_txt: record.routes.securityTxt,
      boundary_asset: record.routes.boundaryAsset,
      vcard: record.routes.vCard,
    },
    channels: record.channels.map((channel: JsonObject) => ({
      id: channel.id,
      address: channel.address,
      uri: channel.uri,
      purpose: [...channel.purpose],
      human_operated: channel.humanOperated,
      response_required: channel.responseRequired,
    })),
    operator: {
      display_name: record.operator.displayName,
      role: record.operator.role,
      company_number: record.operator.companyNumber,
      registered_office: record.operator.registeredOffice,
      profile: record.operator.publicOperatorProfile,
      privacy_notice: record.operator.publicPrivacyNotice,
      public_contact: record.operator.publicContact,
    },
    delivery: {
      kind: record.delivery.kind,
      provider: record.delivery.provider,
      configuration_state: record.delivery.configurationState,
      state_observed_at: state.observedAt,
      semantic_core_sha256: state.semanticCoreSha256,
      carrier_evidence_id: state.carrierEvidenceId,
      carrier_evidence_sha256: state.carrierEvidenceSha256,
      routing_enabled: record.delivery.routingEnabled,
      destination_verified: record.delivery.destinationVerified,
      expected_literal_rule_count: record.delivery.expectedLiteralRuleCount,
      configured_literal_rule_count: record.delivery.configuredLiteralRuleCount,
      catch_all_enabled: record.delivery.catchAllEnabled,
      subaddressing_enabled: record.delivery.subaddressingEnabled,
      email_worker_used: record.delivery.emailWorkerUsed,
      routing_dns_records_verified: record.delivery.routingDnsRecordsVerified,
      receive_only_dmarc_policy: record.delivery.receiveOnlyDmarcPolicy,
      non_delivery_reports_forwarded_to_original_sender: record.delivery.nonDeliveryReportsForwardedToOriginalSender,
      site_submission_backend: record.delivery.siteSubmissionBackend,
      site_message_storage: record.delivery.siteMessageStorage,
      end_to_end_delivery_probe_performed: record.delivery.endToEndDeliveryProbePerformed,
      reply_address_may_differ: record.delivery.replyAddressMayDiffer,
    },
    privacy: {
      site_analytics: record.processing.siteAnalytics,
      site_cookies: record.processing.siteCookies,
      marketing: record.processing.marketing,
      profiling: record.processing.profiling,
      automated_decision: record.processing.automatedDecision,
      training_use: record.processing.trainingUse,
      message_content_public_publication: record.processing.messageContentPublicPublication,
      minimal_redacted_event_metadata_may_be_public: record.ledgerBoundary.inboundMayBeLogged,
      provider_spam_and_malware_filtering_may_occur: record.processing.providerSpamAndMalwareFilteringMayOccur,
      spam_and_malware_filtering_guaranteed: record.processing.spamAndMalwareFilteringGuaranteed,
      recipients_and_processors: [...record.processing.recipientsAndProcessors],
      uk_lawful_basis_notice: [...record.processing.ukLawfulBasisNotice],
      privacy_complaint_acknowledgement_days: record.processing.privacyComplaintAcknowledgementDays,
      rights_request_response_window: record.processing.rightsRequestResponseWindow,
      direct_ico_contact_permitted: record.processing.directIcoContactPermitted,
      complaint_route: record.processing.complaintRoute,
      review_interval_days: record.retention.reviewIntervalDays,
      next_operational_review_due: record.retention.nextOperationalReviewDue,
      rights_request_channel: record.retention.rightsRequestChannel,
    },
    authority_boundary: Object.fromEntries(
      CONTACT_DOOR_BOUNDARY_KEYS.map((key) => [key, false]),
    ),
  };
}

export function renderContactDoorAlias(value: unknown = loadCurrentContactDoor()): string {
  return `${JSON.stringify(contactDoorPublicDiscovery(value), null, 2)}\n`;
}

export function renderContactDoorSecurityTxt(value: unknown = loadCurrentContactDoor()): string {
  const record = validateContactDoor(value);
  assert(record.channels[1].address === "security@thekingdom.dev", "security address");
  return [
    "# KINGDOM OS vulnerability disclosure contact",
    "Contact: mailto:security@thekingdom.dev",
    `Policy: ${CONTACT_DOOR_PAGE_URL}#security`,
    `Canonical: ${CONTACT_DOOR_SECURITY_URL}`,
    "Preferred-Languages: en, zh-Hant, zh-Hans",
    `Expires: ${CONTACT_DOOR_SECURITY_EXPIRES}`,
    "",
  ].join("\r\n");
}

export function renderContactDoorHtml(value: unknown = loadCurrentContactDoor()): string {
  const record = validateContactDoor(value);
  const channels = record.channels.map((channel: JsonObject) => `
      <article class="door" id="channel-${escapeHtml(channel.id)}">
        <p class="eyebrow">${escapeHtml(channel.id)}</p>
        <h3>${escapeHtml(channel.purpose.join(" · "))}</h3>
        <a class="contact-link" href="${escapeHtml(channel.uri)}">Email ${escapeHtml(channel.address)}</a>
        <p><code>${escapeHtml(channel.address)}</code></p>
        <p>Human-operated. No automatic reply and no response promise.</p>
      </article>`).join("");
  const sources = record.sources.map((source: JsonObject) =>
    `<li><a href="${escapeHtml(source.url)}" rel="external noreferrer">${escapeHtml(source.title)}</a> — ${escapeHtml(source.role)}</li>`,
  ).join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="description" content="A finite human-operated inbound email door for KINGDOM OS.">
  <meta name="robots" content="index, follow">
  <title>KINGDOM Contact Door</title>
  <link rel="canonical" href="${CONTACT_DOOR_PAGE_URL}">
  <link rel="alternate" type="application/json" href="${CONTACT_DOOR_ALIAS_URL}" title="Current machine-readable contact record">
  <link rel="alternate" type="text/vcard" href="${CONTACT_DOOR_VCARD_URL}" title="KINGDOM OS contact vCard">
  <style>
    :root{color-scheme:light dark;--bg:#f4f7f2;--ink:#102019;--card:#fff;--muted:#50665d;--line:#9ab3a7;--accent:#075c47;--focus:#ff9f1c;--warn:#783f04}
    @media(prefers-color-scheme:dark){:root{--bg:#07110d;--ink:#e9fff5;--card:#10231c;--muted:#b2cfc2;--line:#3c6253;--accent:#8ce7c4;--focus:#ffc66d;--warn:#ffd29b}}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:1rem/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    a{color:var(--accent);text-underline-offset:.2em}a:focus-visible{outline:.22rem solid var(--focus);outline-offset:.22rem;border-radius:.15rem}.skip{position:absolute;left:.75rem;top:-8rem;background:var(--card);padding:.75rem;z-index:4}.skip:focus{top:.75rem}
    .shell{width:min(72rem,100% - 2rem);margin:auto}.hero{padding:5rem 0 2.5rem}.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:.78rem;font-weight:750;color:var(--muted)}h1{font-size:clamp(2.5rem,8vw,6.5rem);line-height:.93;margin:.2rem 0 1.25rem;max-width:10ch}h2{font-size:clamp(1.7rem,4vw,2.6rem);line-height:1.1}h3{font-size:1.15rem;line-height:1.3}.lead{font-size:clamp(1.12rem,2.5vw,1.45rem);max-width:46rem}.state{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:.3rem .75rem;font-weight:700}
    .primary{display:inline-block;background:var(--accent);color:var(--bg);font-weight:800;padding:.8rem 1rem;border-radius:.5rem;text-decoration:none;min-height:44px}.primary:hover{text-decoration:underline}.boundary{border-left:.4rem solid var(--focus);padding:1rem 1.25rem;background:var(--card);max-width:55rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:1rem}.door,.panel{background:var(--card);border:1px solid var(--line);border-radius:.7rem;padding:1.2rem}.contact-link{display:inline-block;font-weight:800;min-height:44px;padding:.55rem .7rem;border:2px solid currentColor;border-radius:.4rem}.contact-link+ p{overflow-wrap:anywhere}.diagram{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:.7rem;background:#08120f}section{padding:2.3rem 0}ul{padding-left:1.25rem}.warning{color:var(--warn);font-weight:700}.downloads{display:flex;gap:.8rem;flex-wrap:wrap}.downloads a{min-height:44px;display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:.4rem;padding:.55rem .8rem}footer{border-top:1px solid var(--line);margin-top:3rem;padding:2rem 0 4rem;color:var(--muted)}code{overflow-wrap:anywhere}
    @media(max-width:24rem){.shell{width:min(100% - 1rem,72rem)}.hero{padding-top:3.5rem}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
    @media(forced-colors:active){.primary,.door,.panel,.boundary{border:2px solid CanvasText}.primary{color:LinkText;background:Canvas}}
  </style>
</head>
<body>
  <a class="skip" href="#main">Skip to contact</a>
  <main class="shell" id="main" tabindex="-1">
    <header class="hero">
      <p class="eyebrow">one finite human door · as of ${escapeHtml(record.artifact.asOf)}</p>
      <h1>Contact without capture.</h1>
      <p class="lead">A real inbound email lane for KINGDOM OS. The page has no form, script, account, tracking cookie, autoresponder, or message database.</p>
      <p><span class="state">Door state: ${escapeHtml(record.artifact.lifecycle)} · ${escapeHtml(record.delivery.configurationState)}</span></p>
      <p class="operational-status"><strong>Operational verification:</strong> routing API and routing DNS verified: ${record.delivery.routingEnabled === true && record.delivery.routingDnsRecordsVerified === true ? "yes" : "no"}. Receive-only DMARC: <code>${escapeHtml(record.delivery.receiveOnlyDmarcPolicy)}</code>. End-to-end inbox delivery proven: ${record.delivery.endToEndDeliveryProbePerformed === true ? "yes" : "no"}.${record.delivery.endToEndDeliveryProbePerformed === true ? "" : " The current check stopped after SMTP envelope acceptance; no message DATA was sent and no destination-inbox receipt was observed."}</p>
      <p><a class="primary" href="mailto:contact@thekingdom.dev">Email contact@thekingdom.dev</a></p>
      <div class="boundary">
        <strong>Visiting sends nothing.</strong> Opening a mail link still sends nothing until you choose to send in your own mail client. Delivery is not identity, representation, consent, truth, relationship, diplomacy, mediation, or authority.
      </div>
    </header>

    <section aria-labelledby="doors-title">
      <p class="eyebrow">choose one purpose</p>
      <h2 id="doors-title">Exact role addresses</h2>
      <div class="grid">${channels}
      </div>
      <p>Only these four named base addresses are routed. Catch-all delivery and <code>+tag</code> subaddressing are disabled; there is no Email Worker, form, autoresponder, or wildcard address. Cloudflare does not forward non-delivery reports to the original sender, so a forwarding failure can be silent. Use an independent confirmation path for consequential or time-sensitive matters.</p>
    </section>

    <section aria-labelledby="send-title">
      <p class="eyebrow">minimum necessary</p>
      <h2 id="send-title">What to send</h2>
      <div class="grid">
        <div class="panel"><h3>Useful</h3><ul><li>The exact route, file, statement, or accessibility barrier.</li><li>The kind of response you seek.</li><li>Your preferred language: English, Traditional Chinese, or Simplified Chinese.</li><li>A deliverable reply address only if you want a reply.</li></ul></div>
        <div class="panel"><h3>Do not send</h3><ul><li>Credentials, keys, recovery phrases, or bearer tokens.</li><li>Identity documents or highly sensitive personal records.</li><li>Third-party private data, malware, threats, or illegal instructions.</li><li>Anything that must meet an emergency, statutory, or court deadline.</li></ul><p class="warning">No encryption route is offered in v0.1. Do not email secrets.</p></div>
      </div>
    </section>

    <section id="privacy" aria-labelledby="privacy-title">
      <p class="eyebrow">privacy and handling</p>
      <h2 id="privacy-title">Email uses providers</h2>
      <p>The site accepts no submission. If you email, the sender's provider, transit providers, Cloudflare Email Routing, the destination mailbox provider, and the operator may process addresses, headers, transport metadata, content, attachments, and correspondence history.</p>
      <p>The data controller is <strong>${escapeHtml(record.operator.displayName)}</strong>, company ${escapeHtml(record.operator.companyNumber)}, registered at ${escapeHtml(record.operator.registeredOffice)}. Read the <a href="${escapeHtml(record.operator.publicOperatorProfile)}" rel="external noreferrer">public operator profile</a> and <a href="${escapeHtml(record.operator.publicPrivacyNotice)}" rel="external noreferrer">controller privacy notice</a>. Messages are used only to understand and, when chosen, answer the request; correct KINGDOM materials; handle accessibility, privacy, safety, security, abuse, and mail transport; or preserve proportionate necessary evidence.</p>
      <p>No marketing, profiling, automated decision, public message archive, message-content publication, model training, or unrelated forwarding is added by this door. Minimal redacted event metadata may appear in <code>CONTACT-LEDGER.md</code>. Where required or reasonably necessary to protect people or systems, a bounded disclosure may be made only to an affected service, incident responder, professional adviser, insurer, court, regulator, law-enforcement or safeguarding body. Providers may filter spam or malware, but filtering is not guaranteed.</p>
      <ul>
        <li>Unanswered or declined ordinary inquiries: deletion review within ${escapeHtml(record.retention.unansweredOrDeclinedReviewDays)} days.</li>
        <li>Handled ordinary correspondence: deletion or minimisation review within ${escapeHtml(record.retention.handledCorrespondenceReviewDaysAfterClosure)} days after closure.</li>
        <li>Security or abuse evidence: review within ${escapeHtml(record.retention.securityOrAbuseReviewDays)} days unless an active incident or specific obligation requires longer.</li>
        <li>Cloudflare Email Routing analytics: provider-declared ${escapeHtml(record.retention.cloudflareRoutingAnalyticsDays)}-day event retention.</li>
        <li>Provider trash and backups follow provider schedules; immediate global erasure is not claimed.</li>
      </ul>
      <p>Ask through <a href="mailto:contact@thekingdom.dev">contact@thekingdom.dev</a> for access, correction, deletion, restriction, objection, or a data-protection complaint. The stated UK bases are legitimate interests in receiving voluntary correspondence, correcting published material, and protecting services—with minimisation, short reviews, and a right to object—or a specific legal obligation when one actually applies. Ordinary correspondence has no response promise; Cambridge TCG Limited acknowledges a data-protection complaint within ${escapeHtml(record.processing.privacyComplaintAcknowledgementDays)} days and normally answers an applicable rights request within one month, subject to lawful extensions. You may use the <a href="${escapeHtml(record.processing.complaintRoute)}" rel="external noreferrer">ICO complaint route</a> without contacting Cambridge first. This page does not promise one universal transfer safeguard or compliance outside the stated controller scope.</p>
    </section>

    <section id="security" aria-labelledby="security-title">
      <p class="eyebrow">vulnerability disclosure</p>
      <h2 id="security-title">Report safely; testing is not authorized</h2>
      <p>Email <a href="mailto:security@thekingdom.dev">security@thekingdom.dev</a> with the affected route, observed behavior, impact, and smallest safe reproduction. Minimise personal data. Do not access data that is not yours, degrade availability, persist access, exfiltrate content, or expand testing beyond what is necessary to describe the issue.</p>
      <p>Publishing this address creates no safe harbor, testing permission, confidentiality promise, bounty, SLA, or remediation deadline. For machine discovery, read <a href="${CONTACT_DOOR_SECURITY_PATH}"><code>/.well-known/security.txt</code></a>.</p>
    </section>

    <section aria-labelledby="boundary-title">
      <p class="eyebrow">four boundaries</p>
      <h2 id="boundary-title">Choose → send → deliver → receive</h2>
      <img class="diagram" src="${CONTACT_DOOR_SVG_PATH}" alt="The visitor chooses, a local mail client sends, providers deliver, and one human inbox may receive. Delivery is not identity, representation, consent, or authority." width="1200" height="630">
      <p>A reply is manual and not promised. Because the alias is receive-only, a reply may come from a different Cambridge TCG mailbox address. Verify any consequential claim independently. Silence is not consent, hostility, or permission to retry.</p>
    </section>

    <section aria-labelledby="assets-title">
      <p class="eyebrow">inspect and download</p>
      <h2 id="assets-title">Public contract and assets</h2>
      <div class="downloads">
        <a href="${CONTACT_DOOR_ALIAS_PATH}">Current JSON</a>
        <a href="${CONTACT_DOOR_CANONICAL_PATH}">As-of record</a>
        <a href="${CONTACT_DOOR_SCHEMA_PATH}">Closed schema</a>
        <a href="${CONTACT_DOOR_GUIDE_PATH}">Full guide</a>
        <a href="${CONTACT_DOOR_VCARD_PATH}" download>Organization vCard</a>
        <a href="${CONTACT_DOOR_SVG_PATH}">Boundary SVG</a>
      </div>
    </section>

    <section aria-labelledby="sources-title">
      <p class="eyebrow">bounded source horizon</p>
      <h2 id="sources-title">Standards and guidance</h2>
      <p>Links are design inputs, not imported authority, applicability findings, currentness guarantees, or compliance certificates.</p>
      <ul>${sources}</ul>
    </section>
  </main>
  <footer><div class="shell">KINGDOM Contact Door ${escapeHtml(record.protocol)} · one message is one approach · stopping is complete.</div></footer>
</body>
</html>
`;
}
