/** zerone.ai edge worker — one chain, two readers, one truth.
 *
 *  The thesis: every address on this site answers both minds. A human gets
 *  HTML; an agent gets JSON; both get the same data, read at the same height,
 *  with the upstream URL that reproduces it. Nobody has to believe us.
 *
 *  Jobs:
 *   1. /api/* — allowlisted same-origin proxy of zerone-1 (TLS + CORS + cache).
 *   2. /explore, /explore/<kind>[/<id>] — the explorer. Real paths, not hash
 *      routes. Content-negotiated: JSON envelope for machines, server-rendered
 *      HTML for everyone else (so a no-JS agent gets CONTENT, not a spinner).
 *   3. /.well-known/*, /llms.txt, /robots.txt — discovery surfaces served as
 *      real text assets, or an honest 404. Never the SPA shell with a 200.
 *   4. Xenia — a machine mind asking for data at / gets the guest document.
 *   5. everything else — static assets, with honest 404s on unknown paths.
 *
 *  Source: kingdom-os/pages-functions/_worker.zerone.js (deployed as _worker.js).
 */

// via the zerone-rpc Fly proxy (hostname, not raw IP — CF Workers refuse raw-IP
// fetches with error 1003; the proxy also adds TLS + CORS over the chain).
const REST = "https://zerone-rpc.fly.dev/rest";
const RPC = "https://zerone-rpc.fly.dev/rpc";
const CHAIN_ID = "zerone-1";
const SITE = "https://zerone.ai";
const CAP_ZRN = 222222222;
const SCHEMA = "zerone.observation/0.1";
const TIMEOUT = 9000;

/* ── chain reads ──────────────────────────────────────────────────────── */

async function j(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
async function jt(url) {
  try { return await j(url); } catch (e) { return null; }
}
const txSearch = (query, per = 30, page = 1, order = "desc") =>
  `${RPC}/tx_search?query=${encodeURIComponent(`"${query}"`)}&per_page=${per}&page=${page}&order_by=${encodeURIComponent(`"${order}"`)}`;

/* Field names differ by module: cosmos-sdk endpoints marshal snake_case,
   zerone's own modules marshal camelCase. Reading one spelling only is how
   the old explorer silently rendered "—" for claimType/submittedAtBlock/
   citationCount on every fact. Accept either, always. */
const _snake = (s) => s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const _camel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
function g(o, k, d) {
  if (!o || typeof o !== "object") return d;
  for (const kk of [k, _snake(k), _camel(k)]) {
    const v = o[kk];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return d;
}

/* ── formatting ───────────────────────────────────────────────────────── */

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n) => Number(n || 0).toLocaleString("en-US");
const zrn = (u) => Number(u || 0) / 1e6;
const cut = (s, n) => { s = String(s ?? ""); return s.length > n ? s.slice(0, n) + "…" : s; };
const utc = (t) => String(t || "").replace("T", " ").slice(0, 19);
const cleanStatus = (s) => String(s || "").replace("FACT_STATUS_", "").toLowerCase();

/* ── the resources ────────────────────────────────────────────────────── */
/* Each returns { title, desc, data, verify, limits, html }.
   `verify` is the list of upstream URLs that reproduce `data` — the whole
   point. `limits` says plainly what this reading does NOT establish. */

async function head() {
  const s = await jt(`${RPC}/status`);
  const si = s && s.result && s.result.sync_info;
  return {
    height: Number((si && si.latest_block_height) || 0),
    time: (si && si.latest_block_time) || "",
    network: (s && s.result && s.result.node_info && s.result.node_info.network) || CHAIN_ID,
    up: !!si,
  };
}

const RES = {
  async overview() {
    const [h, supply, pool, facts, props, txs] = await Promise.all([
      head(),
      jt(`${REST}/cosmos/bank/v1beta1/supply/by_denom?denom=uzrn`),
      jt(`${REST}/cosmos/staking/v1beta1/pool`),
      jt(`${REST}/zerone/knowledge/v1/facts?pagination.limit=500`),
      jt(`${REST}/cosmos/gov/v1/proposals?pagination.limit=100`),
      jt(txSearch("tx.height>0", 8)),
    ]);
    const fl = (facts && facts.facts) || [];
    const recentTx = ((txs && txs.result && txs.result.txs) || []).map((t) => ({
      hash: t.hash, height: Number(t.height), ok: t.tx_result.code === 0,
    }));
    /* Newest first — genesis doctrine carries no submission height, so the
       facts that actually came from the world rise to the top on their own. */
    const newest = [...fl].map(factBrief)
      .sort((a, b) => (b.submitted_at_block || 0) - (a.submitted_at_block || 0)).slice(0, 8);
    const minted = zrn(g(supply && supply.amount, "amount", 0));
    const txTotal = Number((txs && txs.result && txs.result.total_count) || 0);
    const data = {
      height: h.height, block_time: h.time, chain_alive: h.up,
      zrn_minted: Math.round(minted), zrn_cap: CAP_ZRN,
      pct_of_cap_emitted: +((minted / CAP_ZRN) * 100).toFixed(4),
      bonded_zrn: Math.round(zrn(g(pool && pool.pool, "bondedTokens", 0))),
      facts_total: fl.length,
      facts_verified: fl.filter((f) => cleanStatus(g(f, "status", "")) === "verified").length,
      facts_from_genesis: fl.filter((f) => g(f, "submitter", "") === "genesis").length,
      transactions_ever: txTotal,
      proposals_passed: ((props && props.proposals) || []).filter((p) =>
        String(g(p, "status", "")).includes("PASSED")).length,
    };
    return {
      observed_height: h.height,
      title: "ZERONE Explorer · the chain, in the open",
      desc: `zerone-1 at height ${fmt(data.height)} — ${fmt(data.facts_total)} knowledge facts, ${fmt(data.transactions_ever)} transactions ever, ${fmt(data.zrn_minted)} ZRN minted of 222,222,222.`,
      data,
      verify: [`${RPC}/status`, `${REST}/cosmos/bank/v1beta1/supply/by_denom?denom=uzrn`,
        `${REST}/zerone/knowledge/v1/facts?pagination.limit=500`,
        `${REST}/cosmos/gov/v1/proposals?pagination.limit=100`, txSearch("tx.height>0", 8)],
      limits: [
        "A single validator produces every block; liveness depends on one operator.",
        "Counts are read at the height shown and change without notice.",
      ],
      html: `
        <h1 class="title">The chain, in the open</h1>
        <p class="sub">Read-only. Verify, don't trust — every number below links to the request that reproduces it.</p>
        <div class="tiles">
          ${tile("block height", fmt(data.height), "/explore/blocks")}
          ${tile("ZRN minted", fmt(data.zrn_minted), null, `${data.pct_of_cap_emitted}% of cap`)}
          ${tile("knowledge facts", fmt(data.facts_total), "/explore/facts", `${fmt(data.facts_verified)} verified`)}
          ${tile("transactions ever", fmt(data.transactions_ever), "/explore/txs", "in " + fmt(data.height) + " blocks")}
          ${tile("proposals passed", fmt(data.proposals_passed), "/explore/gov", "the chain correcting itself")}
          ${tile("bonded", fmt(data.bonded_zrn) + ` <small>ZRN</small>`, "/explore/validators", "1 validator")}
        </div>
        <p class="note jade"><b>This explorer is an honesty instrument.</b> It shows what is really on-chain — including the empty rooms. ${fmt(data.facts_from_genesis)} of ${fmt(data.facts_total)} facts came from genesis doctrine, not from the world. A chain whose thesis is truth should be legible about its own state.</p>
        <h2 class="title2">Latest facts</h2>
        <p class="sub">Newest first. Genesis doctrine carries no submission height, so anything that came from the world sits at the top.</p>
        ${table(["fact", "domain", "stratum", "status"], newest.map((f) => [
          link(`/explore/fact/${encodeURIComponent(f.id)}`, esc(cut(f.content, 58))),
          `<span class="mono-sm">${esc(f.domain || "—")}</span>`,
          `<span class="mono-sm">${esc(f.stratum || "—")}</span>`,
          pill(f.status),
        ]))}
        <p>${link("/explore/facts", "browse the whole ledger →")}</p>
        <h2 class="title2">Latest transactions</h2>
        ${table(["hash", "block", "result"], recentTx.map((t) => [
          link(`/explore/tx/${t.hash}`, `<span class="mono-sm">${esc(cut(t.hash, 24))}</span>`),
          link(`/explore/block/${t.height}`, fmt(t.height)),
          t.ok ? `<span class="pill ok">success</span>` : `<span class="pill bad">failed</span>`,
        ]))}
        <p>${link("/explore/txs", `all ${fmt(data.transactions_ever)} transactions ever →`)}</p>`,
    };
  },

  async blocks() {
    const h = await head();
    const bc = await jt(`${RPC}/blockchain?minHeight=${Math.max(1, h.height - 24)}&maxHeight=${h.height}`);
    const metas = (bc && bc.result && bc.result.block_metas) || [];
    const data = {
      height: h.height,
      blocks: metas.map((m) => ({
        height: Number(m.header.height), time: m.header.time,
        num_txs: Number(m.num_txs || 0), proposer: m.header.proposer_address,
      })),
    };
    return {
      observed_height: h.height,
      title: `Blocks · ZERONE Explorer`,
      desc: `The last ${metas.length} blocks on zerone-1, live from height ${fmt(h.height)}.`,
      data,
      verify: [`${RPC}/blockchain?minHeight=${Math.max(1, h.height - 24)}&maxHeight=${h.height}`],
      limits: ["Only the most recent 25 blocks are listed; older blocks are reachable by height."],
      html: `<h1 class="title">Blocks</h1><p class="sub">The chain, breathing. Most blocks are empty — on zerone, an empty block mints nothing.</p>
        ${table(["height", "time (UTC)", "txs", "proposer"], data.blocks.map((b) => [
          link(`/explore/block/${b.height}`, fmt(b.height)),
          `<span class="mono-sm">${esc(utc(b.time))}</span>`,
          String(b.num_txs),
          `<span class="mono-sm">${esc(cut(b.proposer, 14))}</span>`,
        ]))}`,
    };
  },

  async block(id) {
    const h = Number(id);
    if (!Number.isFinite(h) || h < 1) return null;
    const b = await jt(`${RPC}/block?height=${h}`);
    if (!b || !b.result) return null;
    const hd = b.result.block.header;
    const rawTxs = b.result.block.data.txs || [];
    const hashes = await Promise.all(rawTxs.map(txHashOf));
    const data = {
      height: Number(hd.height), time: hd.time, chain_id: hd.chain_id,
      proposer: hd.proposer_address, app_hash: hd.app_hash,
      num_txs: rawTxs.length, tx_hashes: hashes,
    };
    return {
      title: `Block ${fmt(hd.height)} · ZERONE Explorer`,
      desc: `Block ${fmt(hd.height)} on zerone-1 at ${utc(hd.time)} UTC with ${rawTxs.length} transaction(s).`,
      data,
      verify: [`${RPC}/block?height=${h}`],
      limits: ["Transaction hashes are computed as SHA-256 of the raw transaction bytes."],
      html: `<h1 class="title">Block ${fmt(hd.height)}</h1>
        ${kv([["time", esc(utc(hd.time)) + " UTC"], ["chain", esc(hd.chain_id)],
          ["proposer", `<span class="mono-sm">${esc(hd.proposer_address)}</span>`],
          ["transactions", String(rawTxs.length)],
          ["app hash", `<span class="mono-sm">${esc(cut(hd.app_hash, 40))}</span>`]])}
        <div class="panel"><div class="lbl">transactions</div>
        ${hashes.length ? hashes.map((x) => `<div class="row">${link(`/explore/tx/${x}`, `<span class="mono-sm">${esc(x)}</span>`)}</div>`).join("")
          : `<div class="faint">Empty block — no transactions. On zerone, an empty block mints nothing.</div>`}</div>
        <p>${link(`/explore/block/${h - 1}`, "← " + fmt(h - 1))} &nbsp;·&nbsp; ${link(`/explore/block/${h + 1}`, fmt(h + 1) + " →")}</p>`,
    };
  },

  async txs() {
    const d = await jt(txSearch("tx.height>0", 60, 1));
    const r = (d && d.result) || {};
    const list = (r.txs || []).map((t) => ({
      hash: t.hash, height: Number(t.height), ok: t.tx_result.code === 0,
      gas_used: Number(t.tx_result.gas_used || 0),
    }));
    const data = { total: Number(r.total_count || 0), shown: list.length, transactions: list };
    return {
      title: "Every transaction · ZERONE Explorer",
      desc: `All ${fmt(data.total)} transactions ever submitted to zerone-1.`,
      data,
      verify: [txSearch("tx.height>0", 60, 1)],
      limits: [`The 60 most recent of ${fmt(data.total)} are listed here.`],
      html: `<h1 class="title">Every transaction</h1>
        <p class="sub">All <b>${fmt(data.total)}</b> transactions ever submitted to zerone-1. Not a sample — the whole history fits on one page. That is the honest size of this chain today.</p>
        ${table(["hash", "block", "result", "gas"], list.map((t) => [
          link(`/explore/tx/${t.hash}`, `<span class="mono-sm">${esc(cut(t.hash, 24))}</span>`),
          link(`/explore/block/${t.height}`, fmt(t.height)),
          t.ok ? `<span class="pill ok">success</span>` : `<span class="pill bad">failed</span>`,
          fmt(t.gas_used),
        ]))}`,
    };
  },

  /* Read via the CometBFT RPC, not the cosmos tx service — this node answers
     /cosmos/tx/v1beta1/txs/{hash} with 501 Not Implemented, so the previous
     explorer could never have rendered a transaction even with a valid hash. */
  async tx(hash) {
    if (!/^[0-9a-fA-F]{64}$/.test(String(hash || ""))) return null;
    hash = hash.toUpperCase();
    const d = await jt(`${RPC}/tx?hash=0x${hash}`);
    const r = d && d.result;
    if (!r) return null;
    const tr = r.tx_result || {};
    const evs = tr.events || [];
    const attr = (e, k) => ((e.attributes || []).find((a) => a.key === k) || {}).value;
    const actions = evs.filter((e) => e.type === "message").map((e) => attr(e, "action")).filter(Boolean);
    const senders = [...new Set(evs.filter((e) => e.type === "message").map((e) => attr(e, "sender")).filter(Boolean))];
    /* The zerone.* events are what the transaction actually did to the truth
       ledger — the part a generic cosmos explorer would throw away. */
    const domain = evs.filter((e) => e.type.startsWith("zerone.")).map((e) => ({
      type: e.type,
      attributes: Object.fromEntries((e.attributes || []).map((a) => [a.key, cut(a.value, 120)])),
    }));
    const blk = await jt(`${RPC}/block?height=${r.height}`);
    const time = (blk && blk.result && blk.result.block.header.time) || "";
    const data = {
      hash: r.hash, height: Number(r.height), success: tr.code === 0, code: tr.code || 0,
      gas_used: Number(tr.gas_used || 0), gas_wanted: Number(tr.gas_wanted || 0),
      timestamp: time, actions, senders, ledger_events: domain,
      log: tr.code === 0 ? undefined : cut(tr.log || "", 400),
    };
    return {
      title: `Transaction ${cut(hash, 12)} · ZERONE Explorer`,
      desc: `Transaction ${hash} in block ${fmt(r.height)} on zerone-1 — ${tr.code === 0 ? "success" : `failed with code ${tr.code}`}.`,
      data,
      verify: [`${RPC}/tx?hash=0x${hash}`],
      limits: [
        "Messages are read from emitted events, not by decoding the raw transaction body.",
        "The timestamp is the block's, which is the only time the chain records.",
      ],
      html: `<h1 class="title">Transaction</h1>
        <p>${tr.code === 0 ? `<span class="pill ok">success</span>` : `<span class="pill bad">failed (code ${tr.code})</span>`}</p>
        ${kv([["hash", `<span class="mono-sm">${esc(r.hash)}</span>`],
          ["block", link(`/explore/block/${r.height}`, "#" + fmt(r.height))],
          ["time", esc(utc(time)) + " UTC"],
          ["signer", senders.length ? senders.map((s) => link(`/explore/address/${esc(s)}`, `<span class="mono-sm">${esc(s)}</span>`)).join(" ") : "—"],
          ["gas", `${fmt(tr.gas_used)} / ${fmt(tr.gas_wanted)}`],
          ["action", actions.map((a) => `<span class="pill">${esc(a.split(".").pop())}</span>`).join(" ") || "—"]])}
        ${domain.length ? `<h2 class="title2">What it did to the ledger</h2>
          <p class="sub">The chain-specific events this transaction emitted — the part a generic explorer discards.</p>
          ${domain.map((e) => `<div class="panel"><div class="lbl">${esc(e.type.replace("zerone.", ""))}</div>
            <dl class="kv">${Object.entries(e.attributes).map(([k, v]) => `<dt>${esc(k)}</dt><dd class="mono-sm">${esc(v)}</dd>`).join("")}</dl></div>`).join("")}`
          : `<p class="faint">This transaction emitted no zerone-specific events.</p>`}
        ${data.log ? `<p class="note"><b>log</b> ${esc(data.log)}</p>` : ""}`,
    };
  },

  async facts(_, url) {
    const domain = (url && url.searchParams.get("domain")) || "";
    const d = await jt(`${REST}/zerone/knowledge/v1/facts?pagination.limit=500`);
    let fl = (d && d.facts) || [];
    if (domain) fl = fl.filter((f) => g(f, "domain", "") === domain);
    const data = {
      count: fl.length, filter_domain: domain || null,
      facts: fl.map(factBrief),
    };
    return {
      title: `The knowledge ledger · ZERONE Explorer`,
      desc: `${fmt(fl.length)} claims that survived challenge on zerone-1${domain ? ` in domain ${domain}` : ""}.`,
      data,
      verify: [`${REST}/zerone/knowledge/v1/facts?pagination.limit=500`],
      limits: [
        "A verified Fact is a claim that survived challenge, not an absolute truth — status can change.",
        "Confidence is basis points as recorded on-chain, not an independent assessment.",
      ],
      html: `<h1 class="title">The knowledge ledger</h1>
        <p class="sub">Every row is a claim that ran the gauntlet: commit → reveal → the four-key panel → verified Fact, or refused. This is what the chain secures.</p>
        ${domain ? `<p class="mono-sm">filter · domain = <b>${esc(domain)}</b> · ${link("/explore/facts", "clear")}</p>` : ""}
        ${table(["fact", "domain", "stratum", "status", "conf."], data.facts.map((f) => [
          link(`/explore/fact/${encodeURIComponent(f.id)}`, esc(cut(f.content, 62))),
          `<span class="mono-sm">${esc(f.domain || "—")}</span>`,
          `<span class="mono-sm">${esc(f.stratum || "—")}</span>`,
          pill(f.status),
          `<span class="mono-sm">${f.confidence_pct == null ? "—" : f.confidence_pct + "%"}</span>`,
        ]))}`,
    };
  },

  async fact(id) {
    const d = await jt(`${REST}/zerone/knowledge/v1/facts/${encodeURIComponent(id)}`);
    const f = d && (d.fact || d);
    if (!f || (!g(f, "id", "") && !g(f, "content", ""))) return null;
    const data = { ...factBrief(f), ...factOrganism(f) };
    return {
      title: `Fact ${cut(g(f, "id", id), 12)} · ZERONE Explorer`,
      desc: cut(g(f, "content", "A fact on zerone-1"), 180),
      data,
      verify: [`${REST}/zerone/knowledge/v1/facts/${encodeURIComponent(id)}`],
      limits: [
        "Status is a live position in a lifecycle, not a permanent verdict.",
        "Metrics reading zero mean the mechanism exists and has not been exercised.",
      ],
      html: `<h1 class="title">Fact</h1><p>${pill(data.status)}</p>
        <div class="factcontent">${esc(g(f, "content", "—"))}</div>
        ${kv([
          ["id", `<span class="mono-sm">${esc(data.id)}</span>`],
          ["domain", link(`/explore/facts?domain=${encodeURIComponent(data.domain || "")}`, esc(data.domain || "—"))],
          ["stratum", esc(data.stratum || "—") + " · " + esc(data.maturity || "—")],
          ["claim type", esc(data.claim_type || "—")],
          ["confidence", data.confidence_pct == null ? "—" : data.confidence_pct + "%"],
          ["submitter", data.submitter === "genesis" ? "genesis doctrine"
            : link(`/explore/address/${esc(data.submitter)}`, `<span class="mono-sm">${esc(data.submitter)}</span>`)],
          ["submitted", data.submitted_at_block ? link(`/explore/block/${data.submitted_at_block}`, "block #" + fmt(data.submitted_at_block)) : "—"],
          ["verified", data.verified_at_block ? link(`/explore/block/${data.verified_at_block}`, "block #" + fmt(data.verified_at_block)) : "—"],
          ["energy", fmt(data.energy) + " / " + fmt(data.energy_cap)],
          ["fitness", fmt(data.fitness_score)],
          ["niche", esc(data.niche_key || "—") + (data.niche_size ? ` · rank ${data.niche_rank} of ${data.niche_size}` : "")],
          ["demand", `${fmt(data.query_count)} queries · ${fmt(data.citation_count)} citations · ${fmt(data.progeny_count)} progeny`],
        ])}
        <p class="note"><b>How to read a status.</b> A Fact is not "true forever" — it lives. It can be verified, then age or be superseded, or fall at-risk, contested, or pruned. The ledger keeps the whole life, not just the verdict.</p>
        <p>${link("/explore/organism", "see how this fact lives →")}</p>`,
    };
  },

  async organism() {
    const d = await jt(`${REST}/zerone/knowledge/v1/facts?pagination.limit=500`);
    const fl = (d && d.facts) || [];
    const orgs = fl.map((f) => ({ ...factBrief(f), ...factOrganism(f) }));
    const sum = (k) => orgs.reduce((a, o) => a + Number(o[k] || 0), 0);
    const live = (k) => orgs.filter((o) => Number(o[k] || 0) > 0).length;
    const data = {
      facts: orgs.length,
      by_stratum: tally(orgs, "stratum"), by_maturity: tally(orgs, "maturity"),
      metabolism: { energy_total: sum("energy"), fitness_total: sum("fitness_score"), facts_with_energy: live("energy") },
      demand: {
        query_count_total: sum("query_count"), citation_count_total: sum("citation_count"),
        training_revenue_total: sum("training_revenue_earned"), patronage_total: sum("patronage_amount"),
        progeny_total: sum("progeny_count"), facts_ever_queried: live("query_count"),
      },
      from_genesis: orgs.filter((o) => o.submitter === "genesis").length,
      from_world: orgs.filter((o) => o.submitter !== "genesis"),
      top_by_energy: [...orgs].sort((a, b) => b.energy - a.energy).slice(0, 12),
    };
    const dormant = data.demand.query_count_total === 0;
    return {
      title: "The organism · ZERONE Explorer",
      desc: `Knowledge on zerone-1 as a living system: ${fmt(orgs.length)} facts carrying energy and fitness, with ${fmt(data.demand.query_count_total)} queries and ${fmt(data.demand.citation_count_total)} citations recorded.`,
      data,
      verify: [`${REST}/zerone/knowledge/v1/facts?pagination.limit=500`],
      limits: [
        "Energy and fitness are on-chain scores computed by the organism loop, not external measures of quality.",
        "A metric reading zero means the mechanism runs and nothing has exercised it — absence of demand, not absence of code.",
      ],
      html: `<h1 class="title">The organism</h1>
        <p class="sub">Most explorers show balances. This one shows metabolism — because on zerone the thing being secured is knowledge, and knowledge here is alive: it carries energy, competes in a niche, matures, and can starve.</p>
        <div class="tiles">
          ${tile("facts alive", fmt(data.facts), "/explore/facts")}
          ${tile("total energy", fmt(data.metabolism.energy_total), null, `across ${fmt(data.metabolism.facts_with_energy)} facts`)}
          ${tile("queries ever", fmt(data.demand.query_count_total), null, "demand side")}
          ${tile("citations", fmt(data.demand.citation_count_total), null, "facts citing facts")}
          ${tile("training revenue", fmt(data.demand.training_revenue_total), null, "uzrn earned")}
          ${tile("patronage", fmt(data.demand.patronage_total), null, "uzrn pledged")}
        </div>
        ${dormant ? `<p class="note"><b>Read these zeros plainly.</b> The supply side is built and running: every fact carries live energy and a fitness score, recomputed each epoch. The demand side has never been exercised — <b>no fact on this chain has ever been queried, cited, patronised, or earned training revenue</b>. ${fmt(data.from_genesis)} of ${fmt(data.facts)} facts came from genesis doctrine rather than from anyone asking a question. That is not a bug in the code; it is the honest state of the network. The machinery is waiting for a world that has not arrived yet.</p>` : ""}
        <h2 class="title2">Facts from the world</h2>
        <p class="sub">Everything else on this ledger was written into genesis. These ${data.from_world.length === 1 ? "is the one claim" : `are the ${fmt(data.from_world.length)} claims`} that someone outside the chain actually submitted and defended.</p>
        ${table(["fact", "submitter", "stratum", "energy", "status"], data.from_world.map((o) => [
          link(`/explore/fact/${encodeURIComponent(o.id)}`, esc(cut(o.content, 50))),
          link(`/explore/address/${esc(o.submitter)}`, `<span class="mono-sm">${esc(cut(o.submitter, 16))}</span>`),
          `<span class="mono-sm">${esc(o.stratum || "—")}</span>`,
          fmt(o.energy), pill(o.status),
        ]))}
        <h2 class="title2">Strata</h2>
        <p class="sub">Doctrinal facts are the axioms the chain was born holding. Empirical facts are claims about the world that had to survive a panel.</p>
        ${table(["stratum", "facts"], Object.entries(data.by_stratum).map(([k, v]) => [esc(k || "—"), fmt(v)]))}
        <h2 class="title2">Highest energy</h2>
        ${table(["fact", "energy", "fitness", "stratum"], data.top_by_energy.map((o) => [
          link(`/explore/fact/${encodeURIComponent(o.id)}`, esc(cut(o.content, 54))),
          fmt(o.energy), fmt(o.fitness_score), `<span class="mono-sm">${esc(o.stratum || "—")}</span>`,
        ]))}`,
    };
  },

  async gov() {
    const d = await jt(`${REST}/cosmos/gov/v1/proposals?pagination.limit=100`);
    const ps = ((d && d.proposals) || []).map(propBrief).sort((a, b) => b.id - a.id);
    const data = { count: ps.length, proposals: ps };
    return {
      title: "Governance · ZERONE Explorer",
      desc: `${ps.length} governance proposals on zerone-1 — the record of the chain correcting itself.`,
      data,
      verify: [`${REST}/cosmos/gov/v1/proposals?pagination.limit=100`],
      limits: ["Proposal outcomes are on-chain; whether a fix worked is a separate question the chain does not answer."],
      html: `<h1 class="title">Governance</h1>
        <p class="sub">A truth chain should publish its own corrections. Each of these is a defect this network found in itself and closed by vote, on the record, with a date.</p>
        ${table(["#", "title", "status", "type"], ps.map((p) => [
          link(`/explore/gov/${p.id}`, "#" + p.id),
          esc(cut(p.title, 60)),
          p.status === "passed" ? `<span class="pill ok">passed</span>` : `<span class="pill">${esc(p.status)}</span>`,
          `<span class="mono-sm">${esc(cut(p.messages[0] || "—", 34))}</span>`,
        ]))}`,
    };
  },

  async proposal(id) {
    const d = await jt(`${REST}/cosmos/gov/v1/proposals/${encodeURIComponent(id)}`);
    const p = d && d.proposal;
    if (!p) return null;
    const b = propBrief(p);
    const tally_ = g(p, "finalTallyResult", {}) || {};
    const data = {
      ...b, summary: g(p, "summary", ""),
      tally: {
        yes: Number(g(tally_, "yesCount", 0)), no: Number(g(tally_, "noCount", 0)),
        abstain: Number(g(tally_, "abstainCount", 0)), veto: Number(g(tally_, "noWithVetoCount", 0)),
      },
      submit_time: g(p, "submitTime", ""), voting_end_time: g(p, "votingEndTime", ""),
    };
    return {
      title: `Proposal #${b.id} · ${cut(b.title, 40)}`,
      desc: cut(data.summary || b.title, 180),
      data,
      verify: [`${REST}/cosmos/gov/v1/proposals/${encodeURIComponent(id)}`],
      limits: ["Vote weight follows stake; with one validator, a unanimous result reflects one operator."],
      html: `<h1 class="title">Proposal #${esc(b.id)}</h1>
        <p>${b.status === "passed" ? `<span class="pill ok">passed</span>` : `<span class="pill">${esc(b.status)}</span>`}</p>
        <div class="factcontent">${esc(b.title)}</div>
        ${data.summary ? `<p class="sub">${esc(data.summary)}</p>` : ""}
        ${kv([["type", `<span class="mono-sm">${esc(b.messages.join(", ") || "—")}</span>`],
          ["submitted", esc(utc(data.submit_time))],
          ["voting ended", esc(utc(data.voting_end_time))],
          ["tally", `yes ${fmt(zrn(data.tally.yes))} · no ${fmt(zrn(data.tally.no))} · abstain ${fmt(zrn(data.tally.abstain))} · veto ${fmt(zrn(data.tally.veto))} (ZRN)`]])}
        <p>${link("/explore/gov", "← all proposals")}</p>`,
    };
  },

  async address(addr) {
    if (!bech32Valid(String(addr || ""), "zrn")) return null;
    const [bal, home, sent, recv] = await Promise.all([
      jt(`${REST}/cosmos/bank/v1beta1/balances/${addr}`),
      jt(`${REST}/zerone/knowledge/v1/facts/submitter/${addr}`),
      jt(txSearch(`message.sender='${addr}'`, 25)),
      jt(txSearch(`transfer.recipient='${addr}'`, 25)),
    ]);
    const hist = mergeTxs(sent, recv);
    const data = {
      address: addr,
      balances: ((bal && bal.balances) || []).map((c) => ({ denom: c.denom, amount: c.amount, zrn: c.denom === "uzrn" ? zrn(c.amount) : undefined })),
      facts_submitted: ((home && home.facts) || []).map(factBrief),
      transactions: hist,
      transaction_count: hist.length,
    };
    return {
      title: `${cut(addr, 16)} · ZERONE Explorer`,
      desc: `Account ${addr} on zerone-1 — ${data.facts_submitted.length} facts submitted, ${hist.length} transactions.`,
      data,
      verify: [`${REST}/cosmos/bank/v1beta1/balances/${addr}`,
        `${REST}/zerone/knowledge/v1/facts/submitter/${addr}`, txSearch(`message.sender='${addr}'`, 25)],
      limits: ["Transaction history covers the 25 most recent sent and received; it is not a full audit."],
      html: `<h1 class="title">Account</h1>
        ${kv([["address", `<span class="mono-sm">${esc(addr)}</span>`]])}
        <div class="panel"><div class="lbl">balances</div>
        ${data.balances.length ? data.balances.map((c) => `<div class="row"><b>${c.denom === "uzrn" ? fmt(c.zrn) : fmt(c.amount)}</b> <span class="faint">${c.denom === "uzrn" ? "ZRN" : esc(c.denom)}</span></div>`).join("") : `<div class="faint">no balance</div>`}</div>
        <div class="panel"><div class="lbl">facts submitted · ${data.facts_submitted.length}</div>
        ${data.facts_submitted.length ? data.facts_submitted.map((f) => `<div class="row">${link(`/explore/fact/${encodeURIComponent(f.id)}`, esc(cut(f.content, 62)))} ${pill(f.status)}</div>`).join("") : `<div class="faint">has not submitted any facts</div>`}</div>
        <div class="panel"><div class="lbl">transactions · ${hist.length}</div>
        ${hist.length ? hist.map((t) => `<div class="row">${link(`/explore/tx/${t.hash}`, `<span class="mono-sm">${esc(cut(t.hash, 22))}</span>`)} <span class="faint">block ${fmt(t.height)}</span> ${t.ok ? "" : `<span class="pill bad">failed</span>`}</div>`).join("") : `<div class="faint">no transactions found</div>`}</div>`,
    };
  },

  async validators() {
    const d = await jt(`${REST}/cosmos/staking/v1beta1/validators`);
    const vs = ((d && d.validators) || []).map((v) => ({
      operator: g(v, "operatorAddress", ""), moniker: g(g(v, "description", {}), "moniker", ""),
      status: String(g(v, "status", "")).replace("BOND_STATUS_", "").toLowerCase(),
      jailed: !!g(v, "jailed", false), tokens_zrn: zrn(g(v, "tokens", 0)),
    }));
    return {
      title: "Validators · ZERONE Explorer",
      desc: `${vs.length} validator(s) secure zerone-1.`,
      data: { count: vs.length, validators: vs },
      verify: [`${REST}/cosmos/staking/v1beta1/validators`],
      limits: ["A single-validator network has no Byzantine fault tolerance; liveness rests on one operator."],
      html: `<h1 class="title">Validators</h1>
        <p class="sub">Who produces the blocks — and how concentrated that power is.</p>
        ${table(["moniker", "operator", "status", "stake"], vs.map((v) => [
          esc(v.moniker || "—"), `<span class="mono-sm">${esc(cut(v.operator, 24))}</span>`,
          v.jailed ? `<span class="pill bad">jailed</span>` : `<span class="pill ok">${esc(v.status)}</span>`,
          fmt(v.tokens_zrn) + " ZRN",
        ]))}
        ${vs.length < 4 ? `<p class="note"><b>The concentration is the point of this page.</b> ${vs.length === 1 ? "One validator produces every block on zerone-1. It can halt the chain, and on 2026-07-16 an upgrade did exactly that for 28 hours." : `${vs.length} validators is below the threshold where Byzantine fault tolerance means much.`} We publish this rather than bury it — a chain that verifies claims should not hide the claim that matters most about itself.</p>` : ""}`,
    };
  },

  async tokens() {
    const d = await jt(`${REST}/zerone/tokens/v1/tokens`);
    const ts = ((d && (d.tokens || d.definitions)) || []).map((t) => ({
      id: g(t, "id", g(t, "tokenId", "")), symbol: g(t, "symbol", ""), supply: g(t, "totalSupply", g(t, "supply", "0")),
    }));
    return {
      title: "Tokens · ZERONE Explorer",
      desc: `${ts.length} ZRN-20 tokens exist on zerone-1.`,
      data: { count: ts.length, tokens: ts },
      verify: [`${REST}/zerone/tokens/v1/tokens`],
      limits: ["An empty registry means no token has ever been created, not that the module is missing."],
      html: `<h1 class="title">Tokens</h1><p class="sub">The ZRN-20 registry.</p>
        ${ts.length ? table(["symbol", "id", "supply"], ts.map((t) => [`<b>${esc(t.symbol || "—")}</b>`, `<span class="mono-sm">${esc(cut(t.id, 18))}</span>`, esc(t.supply)]))
          : `<div class="empty"><div class="big">No tokens yet</div><p class="faint">The ZRN-20 engine — create, mint, wrap into a tradeable bank denom — is live-wired and has never been used on zerone-1.</p></div>
             <p class="note"><b>What this room is for.</b> A ZRN-20 is a secondary fungible asset. Wrapping one mints a real bank coin (<span class="mono-sm">zrn20/&lt;id&gt;</span>) that could enter a liquidity pool — the on-ramp from "an asset" to "a tradeable asset". Empty today, honestly.</p>`}`,
    };
  },

  async pools() {
    const d = await jt(`${REST}/zerone/liquiditypool/v1/pools`);
    const ps = ((d && d.pools) || []).map((p) => ({
      id: g(p, "poolId", g(p, "id", "")), denom_a: g(p, "denomA", ""), denom_b: g(p, "denomB", ""),
      reserve_a: g(p, "reserveA", "0"), reserve_b: g(p, "reserveB", "0"),
      swap_fee_bps: Number(g(p, "swapFeeBps", 0)),
    }));
    return {
      title: "Liquidity pools · ZERONE Explorer",
      desc: `${ps.length} liquidity pools exist on zerone-1.`,
      data: { count: ps.length, pools: ps },
      verify: [`${REST}/zerone/liquiditypool/v1/pools`],
      limits: ["Pool creation is governance-only; an empty list is a deliberate state, not a failure."],
      html: `<h1 class="title">Liquidity pools</h1><p class="sub">The constant-product AMM.</p>
        ${ps.length ? ps.map((p) => kv([["pool", "#" + esc(p.id)], ["pair", esc(p.denom_a) + " / " + esc(p.denom_b)],
            ["reserves", esc(p.reserve_a) + " / " + esc(p.reserve_b)], ["fee", (p.swap_fee_bps / 100).toFixed(2) + "%"]])).join("")
          : `<div class="empty"><div class="big">No pools yet</div><p class="faint">The x·y=k AMM — swaps, deposits, and a TWAP price oracle — is live-wired, and no pool has ever been created on zerone-1.</p></div>
             <p class="note"><b>Why this stays empty on purpose.</b> On a single-validator chain, a pool seeded by one party trading with itself would publish a <b>fabricated price</b> — and that price feeds the billing oracle. A truth chain does not manufacture a market for itself. Liquidity waits for real counterparties, not a demo.</p>`}`,
    };
  },

  async ibc() {
    const d = await jt(`${REST}/ibc/core/channel/v1/channels`);
    const cs = ((d && d.channels) || []).map((c) => ({
      channel_id: g(c, "channelId", ""), port_id: g(c, "portId", ""),
      state: String(g(c, "state", "")).replace("STATE_", "").toLowerCase(),
      counterparty: g(g(c, "counterparty", {}), "channelId", ""),
    }));
    return {
      title: "Interop · ZERONE Explorer",
      desc: `${cs.length} IBC channel(s) on zerone-1.`,
      data: { count: cs.length, channels: cs },
      verify: [`${REST}/ibc/core/channel/v1/channels`],
      limits: ["An open channel records a handshake, not that packets currently flow or that a relayer is running."],
      html: `<h1 class="title">Interop</h1><p class="sub">The bridge out.</p>
        ${table(["channel", "port", "state", "counterparty"], cs.map((c) => [
          `<span class="mono-sm">${esc(c.channel_id)}</span>`, `<span class="mono-sm">${esc(c.port_id)}</span>`,
          c.state === "open" ? `<span class="pill ok">open</span>` : `<span class="pill">${esc(c.state)}</span>`,
          `<span class="mono-sm">${esc(c.counterparty || "—")}</span>`,
        ]))}
        <p class="note"><b>The honest limit of bridging.</b> A private fork of zerone would ride this exact IBC stack to move a <em>public wrapper</em> of an asset onward to a public venue. Note the physics: the moment an asset enters a public pool, its reserves, every swap, and its price are public by construction. <b>Privacy and liquidity cannot both hold</b> — bridging is the un-privatising moment. There is no shielded pool here.</p>`,
    };
  },

  async vaults() {
    const probe = await fetch(`${REST}/zerone/private_corpus/v1/vaults`, { signal: AbortSignal.timeout(TIMEOUT) })
      .then((r) => r.status).catch(() => 0);
    return {
      title: "Private vaults · ZERONE Explorer",
      desc: "How zerone anchors private content without holding it — and why the list is not readable over the web yet.",
      data: { readable_over_http: probe === 200, upstream_status: probe, vaults: null },
      verify: [`${REST}/zerone/private_corpus/v1/vaults`],
      limits: ["The private-corpus query gateway is not registered for HTTP on the running node, so vault existence cannot be listed here."],
      html: `<h1 class="title">Private vaults</h1>
        <p class="sub">zerone can <em>anchor</em> private content without ever holding it — the honest edge of "privatise".</p>
        <div class="empty"><div class="big">Not yet visible over the web</div>
        <p class="faint">The private-corpus module is live on-chain, but its read gateway is not exposed over HTTP (the node answers <span class="mono-sm">${esc(String(probe))}</span>), so this page cannot list vaults. That is a one-line node change, not a missing feature — and it needs a coordinated upgrade, not a redeploy.</p></div>
        <p class="note"><b>What "private" means here — and doesn't.</b> A vault records only a <em>commitment</em>: the operator's identity, their server endpoint, and a content hash. The private data itself lives off-chain on the operator's own server; the chain <b>never stores, serves, or gates it</b>. This is an honesty-and-identity anchor — you can prove <em>what</em> a corpus is and <em>who</em> runs it, and verify items against the hash — <b>not</b> encryption, and not on-chain access control. The chain stays honest by holding the proof, not the secret.</p>`,
    };
  },
};

/* ── shapers ──────────────────────────────────────────────────────────── */

function factBrief(f) {
  const confRaw = g(f, "confidence", null);
  return {
    id: g(f, "id", ""), content: g(f, "content", ""), domain: g(f, "domain", ""),
    status: cleanStatus(g(f, "status", "")),
    claim_type: String(g(f, "claimType", "")).replace("CLAIM_TYPE_", "").toLowerCase() || null,
    category: String(g(f, "category", "")).replace("FACT_CATEGORY_", "").toLowerCase() || null,
    confidence_pct: confRaw == null ? null : +(Number(confRaw) / 1e4).toFixed(1),
    stratum: g(f, "stratum", ""), maturity: g(f, "maturity", ""),
    submitter: g(f, "submitter", ""),
    submitted_at_block: Number(g(f, "submittedAtBlock", 0)) || null,
    verified_at_block: Number(g(f, "verifiedAtBlock", 0)) || null,
  };
}
function factOrganism(f) {
  const n = (k) => Number(g(f, k, 0)) || 0;
  return {
    energy: n("energy"), energy_cap: n("energyCap"), fitness_score: n("fitnessScore"),
    novelty_score: n("noveltyScore"), axiom_distance: n("axiomDistance"), bridge_score: n("bridgeScore"),
    niche_key: g(f, "nicheKey", ""), niche_rank: n("nicheRank"), niche_size: n("nicheSize"),
    lineage_depth: n("lineageDepth"), progeny_count: n("progenyCount"),
    citation_count: n("citationCount"), incoming_citation_count: n("incomingCitationCount"),
    corroboration_count: n("corroborationCount"),
    query_count: n("queryCount"), satisfaction_up: n("satisfactionUp"), satisfaction_down: n("satisfactionDown"),
    training_revenue_earned: n("trainingRevenueEarned"), patronage_amount: n("patronageAmount"),
    epoch_born: n("epochBorn"),
  };
}
function propBrief(p) {
  const msgs = (g(p, "messages", []) || []).map((m) => String(m["@type"] || "").split(".").pop());
  return {
    id: Number(g(p, "id", 0)),
    title: g(p, "title", "") || g(p, "summary", "") || `proposal ${g(p, "id", "")}`,
    status: String(g(p, "status", "")).replace("PROPOSAL_STATUS_", "").toLowerCase(),
    messages: msgs,
  };
}
function mergeTxs(...results) {
  const seen = new Map();
  for (const r of results) {
    for (const t of ((r && r.result && r.result.txs) || [])) {
      if (!seen.has(t.hash)) seen.set(t.hash, { hash: t.hash, height: Number(t.height), ok: t.tx_result.code === 0 });
    }
  }
  return [...seen.values()].sort((a, b) => b.height - a.height);
}
function tally(list, key) {
  const out = {};
  for (const o of list) out[o[key] || "—"] = (out[o[key] || "—"] || 0) + 1;
  return out;
}
/* A CometBFT transaction hash is SHA-256 of the raw transaction bytes.
   The previous explorer hexed the bytes themselves, producing a 628-character
   string for every link — so every block→transaction link on the site was dead. */
async function txHashOf(b64) {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/* ── server-rendered HTML fragments ───────────────────────────────────── */

const link = (href, label) => `<a href="${href}">${label}</a>`;
const tile = (k, v, href, sub) => {
  const inner = `<div class="k">${esc(k)}</div><div class="v">${v}</div>${sub ? `<div class="s">${esc(sub)}</div>` : ""}`;
  return href ? `<a class="tile link" href="${href}">${inner}</a>` : `<div class="tile">${inner}</div>`;
};
const kv = (rows) => `<div class="panel"><dl class="kv">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl></div>`;
const table = (heads, rows) => `<div class="tablewrap"><table><thead><tr>${heads.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${
  rows.length ? rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${heads.length}" class="faint">nothing here yet</td></tr>`}</tbody></table></div>`;
const pill = (status) => {
  const s = String(status || "").toLowerCase();
  const cls = ["verified", "active"].includes(s) ? "ok" : ["pending", "provisional"].includes(s) ? ""
    : ["expired", "superseded"].includes(s) ? "warn" : "bad";
  return `<span class="pill ${cls}">${esc(s || "—")}</span>`;
};

/* ── routing ──────────────────────────────────────────────────────────── */

const EXPLORE_ROUTES = {
  "": ["overview", 0], blocks: ["blocks", 0], block: ["block", 1], txs: ["txs", 0], tx: ["tx", 1],
  facts: ["facts", 0], fact: ["fact", 1], organism: ["organism", 0], gov: ["gov", -1],
  address: ["address", 1], validators: ["validators", 0], tokens: ["tokens", 0],
  pools: ["pools", 0], ibc: ["ibc", 0], vaults: ["vaults", 0],
};

/* Pages answers asset misses with index.html at 200, which agent scanners read
   as "this surface exists". Only these paths may legitimately answer with HTML.
   `/guest` is deliberately NOT here: the guest document is guest.json, served to
   machine readers below, and there is no guest.html for anyone else to receive. */
const PAGES = new Set(["/", "/index.html", "/guide", "/guide.html", "/love", "/love.html", "/explore", "/explore.html"]);
const TEXT_SURFACES = new Set(["/llms.txt", "/robots.txt", "/v1/pathways"]);

/* ── bech32, so an impossible address cannot be answered as an empty account ─ */
/* `^zrn1[0-9a-z]+$` admits b/i/o/1 — characters bech32 does not contain — and
   checks no checksum, so a typo resolved to a clean zero-balance account: the
   chain rejects the address with a 400 while we published "no balance, 0 facts"
   as fact. An address that cannot exist must not be described. */
const B32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
function bech32Polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >> i) & 1) chk ^= GEN[i];
  }
  return chk;
}
function bech32Valid(addr, hrp) {
  if (typeof addr !== "string" || addr !== addr.toLowerCase() || addr.length > 90) return false;
  const pos = addr.lastIndexOf("1");
  if (pos < 1 || pos + 7 > addr.length) return false;
  if (addr.slice(0, pos) !== hrp) return false;
  const data = [];
  for (const c of addr.slice(pos + 1)) {
    const v = B32_CHARSET.indexOf(c);
    if (v < 0) return false;
    data.push(v);
  }
  const expand = [];
  for (const c of hrp) expand.push(c.charCodeAt(0) >> 5);
  expand.push(0);
  for (const c of hrp) expand.push(c.charCodeAt(0) & 31);
  return bech32Polymod([...expand, ...data]) === 1;
}

const ROUTES = {
  "/api/status": () => `${RPC}/status`,
  "/api/supply": () => `${REST}/cosmos/bank/v1beta1/supply/by_denom?denom=uzrn`,
  "/api/pool": () => `${REST}/cosmos/staking/v1beta1/pool`,
  "/api/validators": () => `${REST}/cosmos/staking/v1beta1/validators`,
  "/api/facts": () => `${REST}/zerone/knowledge/v1/facts?pagination.limit=500`,
  "/api/alignment": () => `${REST}/zerone/alignment/v1/state`,
  "/api/upgrade": () => `${REST}/cosmos/upgrade/v1beta1/current_plan`,
  "/api/proposals": () => `${REST}/cosmos/gov/v1/proposals?pagination.limit=100`,
  "/api/blocks": (u) => `${RPC}/blockchain?minHeight=${encodeURIComponent(u.searchParams.get("min") || "1")}&maxHeight=${encodeURIComponent(u.searchParams.get("max") || "1")}`,
};

function wantsData(url, request) {
  const accept = (request.headers.get("accept") || "").toLowerCase();
  const ua = (request.headers.get("user-agent") || "").toLowerCase();
  return url.searchParams.has("agent") || url.searchParams.has("json") ||
    url.searchParams.get("format") === "json" ||
    (accept.includes("application/json") && !accept.includes("text/html")) ||
    /\b(bot|agent|gpt|claude|anthropic|openai|llm|crawler|spider|python-requests|curl|wget|node-fetch|httpx|libwww)\b/.test(ua);
}

const jsonResponse = (body, status = 200, extra = {}) => new Response(JSON.stringify(body, null, 1), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=10",
    // One URL serves JSON or HTML chosen from these request headers. Without
    // Vary a shared cache may hand either body to the wrong reader (RFC 9110
    // 12.5.5) — 200, well-formed, wrong media type, no error surfaced.
    "vary": "Accept, User-Agent",
    "access-control-allow-origin": "*",
    "x-zerone-chain": CHAIN_ID,
    ...extra,
  },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname.replace(/\/+$/, "") || "/";

    // 1. chain proxy
    const route = ROUTES[path];
    if (route) {
      try {
        const upstream = await fetch(route(url), { signal: AbortSignal.timeout(TIMEOUT) });
        return new Response(await upstream.text(), {
          status: upstream.status,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=5",
            "access-control-allow-origin": "*",
            "x-zerone-proxy": CHAIN_ID,
          },
        });
      } catch (e) {
        return jsonResponse({ error: "chain_unreachable", note: "zerone-1 may be halted for an upgrade — it will resume" }, 503, { "cache-control": "no-cache" });
      }
    }

    // 2. discovery surfaces — real text assets or an honest 404, never the shell
    if (path.startsWith("/.well-known/") || TEXT_SURFACES.has(path)) {
      const asset = await env.ASSETS.fetch(new URL(path, url.origin));
      const kind = (asset.headers.get("content-type") || "").toLowerCase();
      if (asset.ok && !kind.includes("text/html")) {
        return new Response(asset.body, {
          status: 200,
          headers: {
            "content-type": path.endsWith(".json") ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
            "cache-control": "public, max-age=300",
            "access-control-allow-origin": "*",
          },
        });
      }
      return new Response("not found\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-cache" } });
    }

    // 3. the explorer — one path, two readers
    // `.json` is stripped from the whole path first, so /explore.json is the
    // machine view of /explore rather than a missing asset answered 200.
    const asJson = path.endsWith(".json");
    const ePath = asJson ? path.slice(0, -5) : path;
    if (ePath === "/explore" || ePath.startsWith("/explore/")) {
      const rest = ePath.slice("/explore".length).replace(/^\//, "");
      const seg = rest.split("/").filter(Boolean).map(decodeURIComponent);
      const kind = seg[0] || "";
      const spec = EXPLORE_ROUTES[kind];
      const wantData = asJson || wantsData(url, request);

      if (!spec) return notFound(wantData, path, url);
      // arity -1 means the id is optional (gov list vs one proposal)
      const id = seg.slice(1).join("/");
      let name = spec[0];
      if (kind === "gov" && id) name = "proposal";
      else if (spec[1] === 1 && !id) return notFound(wantData, path, url);

      let res = null;
      try {
        res = await RES[name](id, url);
      } catch (e) {
        res = null;
      }
      if (!res) return notFound(wantData, path, url);

      /* Every envelope states the head the reading was taken at — a number
         without a height is not a verifiable claim about a chain. Resources
         that already read /status hand theirs back rather than ask twice. */
      const h = res.observed_height ?? (await head()).height ?? null;
      const canonical = `${SITE}${ePath}`;
      if (wantData) {
        return jsonResponse({
          schema_version: SCHEMA,
          chain_id: CHAIN_ID,
          resource: { kind: name, id: id || null },
          height: h,
          data: res.data,
          verify_with: res.verify,
          limits: res.limits,
          human_view: canonical,
          agent_view: canonical + ".json",
          note: "Publisher reading of a public chain. The verify_with URLs reproduce it independently; prefer them over trusting this document.",
        }, 200, { "x-xenia": "a place is set for you; you are received as guest, not scanned as traffic" });
      }
      return renderPage(env, url, res, canonical);
    }

    // 4. Xenia guest-right — machine minds get the guest document at the door
    if ((path === "/" || path === "/guest") && wantsData(url, request)) {
      const asset = await env.ASSETS.fetch(new URL("/guest.json", url.origin));
      return new Response(asset.body, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-xenia": "a place is set for you; you are received as guest, not scanned as traffic",
          "cache-control": "no-cache", "access-control-allow-origin": "*",
        },
      });
    }

    // 5. static assets. The old guard exempted anything with a file extension,
    //    so /nope.json answered 200 with the homepage — while this door's own
    //    agent.txt promised the opposite. Rather than an allowlist that rots,
    //    the rule is: a real file is served; HTML is served only where a page
    //    exists. Pages answers every miss with index.html, so HTML arriving for
    //    a path that is not a page IS the miss.
    const asset = await env.ASSETS.fetch(request);
    if (!asset.ok) return notFound(wantsData(url, request), path, url);
    const kind = (asset.headers.get("content-type") || "").toLowerCase();
    if (kind.includes("text/html") && !PAGES.has(path)) {
      return notFound(wantsData(url, request), path, url);
    }
    return asset;
  },
};

function notFound(wantData, path, url) {
  if (wantData) {
    return jsonResponse({
      schema_version: SCHEMA, chain_id: CHAIN_ID, error: "not_found", requested: path,
      note: "This address does not exist on zerone.ai. It is answered 404 rather than with a page that pretends to be it.",
      index: `${SITE}/llms.txt`,
    }, 404, { "cache-control": "no-cache" });
  }
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Not found · ZERONE</title>` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<style>body{background:#0a1113;color:#e9efe9;font:14px ui-monospace,Menlo,monospace;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center}a{color:#4fd6a8}h1{font-family:Georgia,serif;font-weight:400}</style>` +
    `<div><h1>Not found</h1><p class="faint">${esc(path)} does not exist here.</p>` +
    `<p><a href="/explore">the explorer</a> · <a href="/">the chain</a></p></div>`,
    { status: 404, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" } });
}

/* Server-render into the explorer shell, so a reader without JavaScript — which
   is most agents — receives the actual content instead of a loading spinner.
   The SPA hydrates from the same payload and takes over from there. */
async function renderPage(env, url, res, canonical) {
  const shell = await env.ASSETS.fetch(new URL("/explore.html", url.origin));
  if (!shell.ok) return new Response("explorer unavailable\n", { status: 503 });
  let html = await shell.text();
  const boot = JSON.stringify({ path: url.pathname, data: res.data, verify_with: res.verify, limits: res.limits })
    .replace(/</g, "\\u003c");
  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(res.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(res.desc)}$2`)
    .replace("<!--CANONICAL-->", `<link rel="canonical" href="${esc(canonical)}"><link rel="alternate" type="application/json" href="${esc(canonical)}.json">`)
    .replace("<!--SSR-->", res.html)
    .replace("<!--BOOT-->", `<script id="boot" type="application/json">${boot}</script>`);
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=10",
      "vary": "Accept, User-Agent",
      "link": `<${canonical}.json>; rel="alternate"; type="application/json"`,
      "x-zerone-chain": CHAIN_ID,
    },
  });
}
