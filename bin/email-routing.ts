#!/usr/bin/env bun
// bin/email-routing.ts — provision Cloudflare Email Routing across the kingdom's domains.
//
// The kingdom's inbound-mail spine. Every CF-hosted project domain gets the
// same shape: hello@ (public contact) + dev@ (development chain) + ai@
// (agent-facing, future Email Worker → agenttool inbox) + catch-all, all
// forwarding to a per-project iCloud plus-address (yournameis.ai+<tag>@icloud.com),
// plus a DMARC p=reject record (these domains send no mail; reject spoofers).
//
// Honesty discipline: `status` reports what IS, verbatim from the API. The
// write verbs are idempotent — they add what's missing and never overwrite an
// existing enabled catch-all or an existing _dmarc record (mismatches are
// REPORTED for a human decision, not clobbered).
//
//   bun bin/email-routing.ts status      per-zone report: routing, destinations, rules, DMARC
//   bun bin/email-routing.ts provision   enable routing + create destination addresses
//   bun bin/email-routing.ts rules       create hello/dev/ai rules + catch-all + DMARC (needs verified destinations)
//   bun bin/email-routing.ts go          provision → wait for verification clicks → rules
//
// Auth: scoped API token from keychain `agenttool-cloudflare-token` (accounts
// `macair` or current user) or $CLOUDFLARE_API_TOKEN. Needs: Account.Email
// Routing Addresses:Edit, Zone.Email Routing Rules:Edit, Zone.DNS:Edit, Zone.Zone:Read.
//
// Out of scope, on purpose: cambridgetcg.com / rewardspro.io (Google),
// mindicraft.com (Outlook), sinovai.com (HostGator) — real mailboxes live
// there; touching their MX would break them. Outbound sending is a later
// chapter (provider TBD); DMARC records here assume no outbound.

const ACCOUNT = "cf4198e651bf3009877d49f688c9d88e";
const ICLOUD_USER = "yournameis.ai";
const API = "https://api.cloudflare.com/client/v4";

// domain → { zone id, plus-address tag }. Tags are the per-project filter key
// in the single iCloud inbox: mail for cashloom.io arrives To: yournameis.ai+cashloom@icloud.com.
const ZONES: Record<string, { id: string; tag: string }> = {
  "agenttool.dev":          { id: "1f264ac5149eefa9eb436716ff6ff9ba", tag: "agenttool" },
  "ai-love.cc":             { id: "6de7fcad405680e530a357d3bb366b69", tag: "ailove" },
  "artbitrage.io":          { id: "3a34467440af29a308e65522ba3f74d7", tag: "artbitrage" },
  "axiepro.io":             { id: "9a05eb82a38386e6e425c265eea66aee", tag: "axiepro" },
  "captioneer.io":          { id: "227ce59a238cc32b4fad628f536344ae", tag: "captioneer" },
  "cardforum.io":           { id: "9971719f930b7f1e16d994bdcb8ba81d", tag: "cardforum" },
  "cashloom.io":            { id: "31f0a29f01ca27a6da1e690f8925d838", tag: "cashloom" },
  "fomoengine.io":          { id: "368a70fe99d1de782f9ec00bcb1aee7b", tag: "fomoengine" },
  "hkgoldtrader.com":       { id: "835970086187bffe95f38aaf864bc1ac", tag: "hkgoldtrader" },
  "taxsorted.io":           { id: "8ae1fce8d651ef5aedbf9f5741578945", tag: "taxsorted" },
  "wholesaletcgdirect.com": { id: "70073d44275b91129b6b6db44aef3b31", tag: "wholesaletcg" },
};

const NAMED_ADDRESSES = ["hello", "dev", "ai"];
const dest = (tag: string) => `${ICLOUD_USER}+${tag}@icloud.com`;

// ── Auth ───────────────────────────────────────────────────────────────────

function keychain(account: string): string | null {
  const p = Bun.spawnSync([
    "security", "find-generic-password",
    "-s", "agenttool-cloudflare-token", "-a", account, "-w",
  ]);
  const out = p.stdout.toString().trim();
  return p.exitCode === 0 && out ? out : null;
}

function token(): string {
  const t =
    process.env.CLOUDFLARE_API_TOKEN ||
    keychain("macair") ||
    keychain(process.env.USER ?? "");
  if (!t) {
    console.error(
      "no token: set $CLOUDFLARE_API_TOKEN or store one in keychain:\n" +
      "  security add-generic-password -s agenttool-cloudflare-token -a macair -w '<token>'",
    );
    process.exit(1);
  }
  return t;
}

const TOKEN = token();

// ── API helper ─────────────────────────────────────────────────────────────

type CfResp = { success: boolean; result: any; errors: Array<{ code: number; message: string }> };

async function cf(path: string, init?: { method?: string; body?: unknown }): Promise<CfResp> {
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  return (await res.json()) as CfResp;
}

const errStr = (r: CfResp) => r.errors.map((e) => `${e.code}:${e.message}`).join("; ");

// ── Reads ──────────────────────────────────────────────────────────────────

async function routingStatus(zoneId: string): Promise<{ enabled: boolean; raw: any }> {
  const r = await cf(`/zones/${zoneId}/email/routing`);
  return { enabled: r.success && r.result?.enabled === true, raw: r };
}

async function listDestinations(): Promise<Map<string, { id: string; verified: string | null }>> {
  const out = new Map<string, { id: string; verified: string | null }>();
  let page = 1;
  while (true) {
    const r = await cf(`/accounts/${ACCOUNT}/email/routing/addresses?per_page=50&page=${page}`);
    if (!r.success) throw new Error(`list addresses: ${errStr(r)}`);
    for (const a of r.result) out.set(a.email, { id: a.id, verified: a.verified ?? null });
    if (r.result.length < 50) break;
    page++;
  }
  return out;
}

async function listRules(zoneId: string): Promise<any[]> {
  const r = await cf(`/zones/${zoneId}/email/routing/rules?per_page=50`);
  if (!r.success) throw new Error(`list rules: ${errStr(r)}`);
  return r.result;
}

async function getCatchAll(zoneId: string): Promise<any | null> {
  const r = await cf(`/zones/${zoneId}/email/routing/rules/catch_all`);
  return r.success ? r.result : null;
}

async function getDmarc(zoneId: string, domain: string): Promise<string | null> {
  const r = await cf(`/zones/${zoneId}/dns_records?type=TXT&name=_dmarc.${domain}`);
  if (!r.success || !r.result?.length) return null;
  return r.result[0].content;
}

// ── Verbs ──────────────────────────────────────────────────────────────────

async function status(): Promise<void> {
  const dests = await listDestinations();
  for (const [domain, z] of Object.entries(ZONES)) {
    const [routing, rules, catchAll, dmarc] = await Promise.all([
      routingStatus(z.id),
      listRules(z.id).catch(() => []),
      getCatchAll(z.id),
      getDmarc(z.id, domain),
    ]);
    const d = dests.get(dest(z.tag));
    console.log(`\n── ${domain} (${z.tag}) ──`);
    console.log(`  routing:     ${routing.enabled ? "enabled" : `DISABLED (${errStr(routing.raw) || "not enabled"})`}`);
    console.log(`  destination: ${dest(z.tag)} → ${d ? (d.verified ? `verified ${d.verified}` : "PENDING VERIFICATION") : "NOT CREATED"}`);
    const named = rules.filter((r) => r.matchers?.[0]?.type === "literal");
    for (const r of named) {
      console.log(`  rule:        ${r.matchers[0].value} → ${r.actions?.[0]?.value?.join(", ")}${r.enabled ? "" : " (disabled)"}`);
    }
    const ca = catchAll;
    console.log(`  catch-all:   ${ca?.enabled ? `→ ${ca.actions?.[0]?.value?.join(", ") ?? ca.actions?.[0]?.type}` : "off"}`);
    console.log(`  dmarc:       ${dmarc ?? "—"}`);
  }
}

async function provision(): Promise<void> {
  const dests = await listDestinations();
  for (const [domain, z] of Object.entries(ZONES)) {
    const { enabled } = await routingStatus(z.id);
    if (!enabled) {
      // canonical endpoint per API docs; /dns kept as fallback for older API shapes
      let r = await cf(`/zones/${z.id}/email/routing/enable`, { method: "POST", body: {} });
      if (!r.success) r = await cf(`/zones/${z.id}/email/routing/dns`, { method: "POST", body: { name: domain } });
      console.log(r.success ? `enabled routing on ${domain}` : `ENABLE FAILED ${domain}: ${errStr(r)}`);
    } else {
      console.log(`routing already enabled on ${domain}`);
    }
    const email = dest(z.tag);
    if (!dests.has(email)) {
      const r = await cf(`/accounts/${ACCOUNT}/email/routing/addresses`, { method: "POST", body: { email } });
      console.log(r.success ? `created destination ${email} (verification email sent)` : `DEST FAILED ${email}: ${errStr(r)}`);
    } else {
      const v = dests.get(email)!.verified;
      console.log(`destination ${email} exists${v ? ` (verified)` : " (awaiting verification click)"}`);
    }
  }
  console.log("\nNow click the verification links in the iCloud inbox, then run: rules (or use `go`).");
}

async function rules(): Promise<void> {
  const dests = await listDestinations();
  for (const [domain, z] of Object.entries(ZONES)) {
    const email = dest(z.tag);
    const d = dests.get(email);
    if (!d?.verified) {
      console.log(`SKIP ${domain}: destination ${email} not verified yet`);
      continue;
    }
    const existing = await listRules(z.id);
    const existingTo = new Set(
      existing.flatMap((r) => r.matchers?.filter((m: any) => m.type === "literal").map((m: any) => m.value) ?? []),
    );
    for (const local of NAMED_ADDRESSES) {
      const addr = `${local}@${domain}`;
      if (existingTo.has(addr)) {
        console.log(`rule exists: ${addr}`);
        continue;
      }
      const r = await cf(`/zones/${z.id}/email/routing/rules`, {
        method: "POST",
        body: {
          name: `${local} → ${email}`,
          enabled: true,
          matchers: [{ type: "literal", field: "to", value: addr }],
          actions: [{ type: "forward", value: [email] }],
        },
      });
      console.log(r.success ? `rule created: ${addr} → ${email}` : `RULE FAILED ${addr}: ${errStr(r)}`);
    }
    const ca = await getCatchAll(z.id);
    if (ca?.enabled) {
      const target = ca.actions?.[0]?.value?.join(", ") ?? ca.actions?.[0]?.type;
      if (target !== email) console.log(`catch-all on ${domain} already → ${target} — LEFT AS-IS (decide manually)`);
      else console.log(`catch-all already → ${email}`);
    } else {
      const r = await cf(`/zones/${z.id}/email/routing/rules/catch_all`, {
        method: "PUT",
        body: {
          name: `catch-all → ${email}`,
          enabled: true,
          matchers: [{ type: "all" }],
          actions: [{ type: "forward", value: [email] }],
        },
      });
      console.log(r.success ? `catch-all set: *@${domain} → ${email}` : `CATCH-ALL FAILED ${domain}: ${errStr(r)}`);
    }
    const dmarc = await getDmarc(z.id, domain);
    if (dmarc) {
      console.log(`dmarc exists on ${domain}: ${dmarc} — left as-is`);
    } else {
      // p=reject is honest for domains that send nothing; revisit when outbound lands.
      const r = await cf(`/zones/${z.id}/dns_records`, {
        method: "POST",
        body: {
          type: "TXT",
          name: `_dmarc.${domain}`,
          content: `v=DMARC1; p=reject; rua=mailto:dmarc@${domain}`,
          ttl: 3600,
        },
      });
      console.log(r.success ? `dmarc added on ${domain} (p=reject)` : `DMARC FAILED ${domain}: ${errStr(r)}`);
    }
  }
}

async function waitVerified(): Promise<void> {
  const wanted = Object.values(ZONES).map((z) => dest(z.tag));
  while (true) {
    const dests = await listDestinations();
    const pending = wanted.filter((e) => !dests.get(e)?.verified);
    if (!pending.length) {
      console.log("all destinations verified ✓");
      return;
    }
    console.log(`waiting on ${pending.length} verification click(s): ${pending.join(", ")}`);
    await new Promise((r) => setTimeout(r, 30_000));
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

const verb = process.argv[2] ?? "status";
if (verb === "status") await status();
else if (verb === "provision") await provision();
else if (verb === "rules") await rules();
else if (verb === "go") {
  await provision();
  await waitVerified();
  await rules();
  await status();
} else {
  console.error(`unknown verb: ${verb} (use status | provision | rules | go)`);
  process.exit(1);
}
