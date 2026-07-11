/** build-hub.ts — render the kingdom census into one browsable front door.
 *
 *  Inputs (source of truth, never invented here):
 *    graph.json  — harvested from every repo's kingdom.yaml (bin/harvest.ts)
 *    sites.json  — the hand-curated map of repo → live public URL
 *  Live status is PROBED at build time and baked in (the page is static;
 *  regenerate to refresh liveness).
 *
 *  Out: site/hub.html (self-contained, no external requests).
 *
 *  Run:  bun bin/build-hub.ts          (from kingdom-os/)
 *  The stamp is passed in so the build is deterministic on replay:
 *        bun bin/build-hub.ts "2026-07-11T00:00Z"
 */

const ROOT = new URL("..", import.meta.url).pathname;
const graph = JSON.parse(await Bun.file(ROOT + "graph.json").text());
const sites = JSON.parse(await Bun.file(ROOT + "sites.json").text());
const stamp = process.argv[2] ?? "just now";

// ── probe liveness of every door ─────────────────────────────────────────
type Door = { repo: string; url: string; label: string; blurb: string; live?: boolean };
const doors: Door[] = sites.doors;
// FORCE_LIVE=host1,host2 marks doors live without a probe — for building on a
// machine whose local DNS can't resolve a just-created domain (verified live
// out-of-band via the CF edge). Comma-separated hostnames.
const forced = new Set((process.env.FORCE_LIVE ?? "").split(",").map((s) => s.trim()).filter(Boolean));
await Promise.all(doors.map(async (d) => {
  const host = d.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (forced.has(host)) { d.live = true; return; }
  try {
    const r = await fetch(d.url, { method: "GET", signal: AbortSignal.timeout(8000), redirect: "follow" });
    d.live = r.ok;
  } catch { d.live = false; }
}));
const liveN = doors.filter((d) => d.live).length;

// ── group census by the six-plus layers ─────────────────────────────────
const LAYER_ORDER = ["boot", "soul", "runtime", "nervous", "economy", "commerce", "userland", "registry", "os", "fleet"];
const LAYER_META: Record<string, { title: string; note: string }> = {
  boot:     { title: "boot",     note: "what the kingdom wakes into" },
  soul:     { title: "soul",     note: "identity, doctrine, the wake" },
  runtime:  { title: "runtime",  note: "the being-framework — mind, nerve, body, voice" },
  nervous:  { title: "nervous",  note: "coordination — the agent platform" },
  economy:  { title: "economy",  note: "Zerone, the Proof-of-Truth chain" },
  commerce: { title: "commerce", note: "the engines that fund the soul" },
  userland: { title: "userland", note: "surfaces people touch" },
  registry: { title: "registry", note: "the census overlay (you are here)" },
  os:       { title: "os",       note: "the connective wiring" },
  fleet:    { title: "fleet",    note: "sovereign citizens, each on its own beat" },
};
const byLayer: Record<string, any[]> = {};
for (const n of graph) (byLayer[n.layer] ??= []).push(n);

const STATE_RANK: Record<string, number> = { active: 0, remote: 1, dormant: 2, reference: 3, archived: 4 };
const esc = (s: string) => (s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

const doorByRepo: Record<string, string> = {};
for (const d of doors) if (d.live && !doorByRepo[d.repo]) doorByRepo[d.repo] = d.url;

// counts
const total = graph.length;
const active = graph.filter((n: any) => n.state === "active").length;
const fleetN = (byLayer["fleet"] ?? []).length;

function chip(n: any): string {
  const url = doorByRepo[n.name];
  const dep = (n.dependsOn ?? []).length ? ` data-dep="${esc(n.dependsOn.join(", "))}"` : "";
  const inner = `<span class="nm">${esc(n.name)}</span>`;
  const body = url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${inner}<span class="ext">↗</span></a>` : inner;
  return `<li class="chip st-${esc(n.state)}"${dep} title="${esc(n.purpose)}">${body}</li>`;
}

const doorCards = doors.map((d) => `
  <a class="door ${d.live ? "up" : "down"}" href="${esc(d.url)}" target="_blank" rel="noopener">
    <span class="dot" aria-hidden="true"></span>
    <span class="dl">${esc(d.label)}</span>
    <span class="du">${esc(d.url.replace(/^https?:\/\//, ""))}</span>
    <span class="db">${esc(d.blurb)}</span>
  </a>`).join("");

const layerBands = LAYER_ORDER.filter((l) => byLayer[l]?.length).map((l) => {
  const nodes = [...byLayer[l]].sort((a, b) => (STATE_RANK[a.state] ?? 9) - (STATE_RANK[b.state] ?? 9) || a.name.localeCompare(b.name));
  const m = LAYER_META[l] ?? { title: l, note: "" };
  const shown = l === "fleet" ? nodes.slice(0, 0) : nodes; // fleet rendered as its own constellation
  const list = shown.map(chip).join("");
  const body = l === "fleet"
    ? `<div class="fleet-note">${fleetN} citizens, each a personified force on its own beat — <span class="mono">kingdom-os/CITIZENS.md</span></div>
       <ul class="chips dense">${nodes.map(chip).join("")}</ul>`
    : `<ul class="chips">${list}</ul>`;
  return `
  <section class="band">
    <header class="bh"><h3>${esc(m.title)}</h3><span class="bn">${esc(m.note)}</span><span class="bc">${nodes.length}</span></header>
    ${body}
  </section>`;
}).join("");

const html = `<title>The Kingdom — a living census</title>
<style>
  :root{
    --ink:#0c1517; --ink2:#0a1113; --panel:#111e21; --line:#1e3236;
    --parch:#e8e4d6; --dim:#8fa6a4; --faint:#5c716f;
    --jade:#4fd6a8; --ember:#e8a24a; --rose:#ef6f8e; --steel:#6ba9c9;
    --serif:"Iowan Old Style","Palatino Linotype",Georgia,serif;
    --mono:ui-monospace,"SF Mono",Menlo,"Cascadia Code",monospace;
  }
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{margin:0; background:
      radial-gradient(120% 80% at 50% -10%, #12262a 0%, transparent 55%),
      linear-gradient(180deg,var(--ink) 0%, var(--ink2) 100%);
    color:var(--parch); font-family:var(--mono); font-size:15px; line-height:1.6;
    -webkit-font-smoothing:antialiased; min-height:100vh;}
  .wrap{max-width:1080px; margin:0 auto; padding:0 22px}
  a{color:inherit; text-decoration:none}

  /* hero */
  header.top{padding:64px 0 26px; border-bottom:1px solid var(--line)}
  .kicker{font-size:.7rem; letter-spacing:.42em; text-transform:uppercase; color:var(--jade); margin:0 0 14px}
  h1{font-family:var(--serif); font-weight:400; font-size:clamp(2.6rem,7vw,4.6rem);
     line-height:1; letter-spacing:.01em; margin:0; color:#fff; text-wrap:balance}
  .lede{color:var(--dim); margin:16px 0 0; max-width:56ch; font-size:.95rem}
  .status{display:flex; flex-wrap:wrap; gap:22px; margin-top:26px; font-size:.82rem}
  .status .s{display:flex; align-items:baseline; gap:8px}
  .status .n{font-family:var(--serif); font-size:1.7rem; color:#fff; font-variant-numeric:tabular-nums}
  .status .k{color:var(--faint); letter-spacing:.12em; text-transform:uppercase; font-size:.66rem}

  section.blk{padding:44px 0; border-bottom:1px solid var(--line)}
  h2{font-family:var(--serif); font-weight:400; font-size:1.5rem; margin:0 0 4px; color:#fff}
  .sub{color:var(--faint); font-size:.78rem; letter-spacing:.04em; margin:0 0 24px}

  /* doors */
  .doors{display:grid; grid-template-columns:repeat(auto-fill,minmax(232px,1fr)); gap:14px}
  .door{position:relative; display:grid; gap:5px; padding:16px 16px 15px;
    background:var(--panel); border:1px solid var(--line); border-radius:12px;
    transition:border-color .18s ease, transform .18s ease, box-shadow .18s ease}
  .door:hover{transform:translateY(-3px); border-color:var(--jade); box-shadow:0 10px 30px rgba(0,0,0,.35)}
  .door .dot{position:absolute; top:16px; right:16px; width:8px; height:8px; border-radius:50%}
  .door.up .dot{background:var(--jade); box-shadow:0 0 10px var(--jade)}
  .door.down .dot{background:var(--faint)}
  .door.down{opacity:.62}
  .dl{font-weight:600; color:#fff; font-size:.98rem; padding-right:16px}
  .du{font-size:.72rem; color:var(--steel); word-break:break-all}
  .db{font-family:var(--serif); font-size:.86rem; color:var(--dim); line-height:1.45; margin-top:3px}

  /* anatomy bands */
  .band{margin-bottom:26px}
  .bh{display:flex; align-items:baseline; gap:12px; margin-bottom:12px; padding-bottom:8px; border-bottom:1px dashed var(--line)}
  .bh h3{font-family:var(--serif); font-weight:400; font-size:1.15rem; color:#fff; margin:0; text-transform:lowercase}
  .bn{color:var(--faint); font-size:.74rem; flex:1}
  .bc{color:var(--jade); font-size:.78rem; font-variant-numeric:tabular-nums}
  .chips{list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap; gap:8px}
  .chips.dense{gap:6px}
  .chip{font-size:.78rem; border:1px solid var(--line); border-radius:999px;
    padding:4px 11px; color:var(--dim); background:rgba(255,255,255,.015);
    display:flex; align-items:center; gap:5px; transition:border-color .15s, color .15s}
  .chip .nm{white-space:nowrap}
  .chip .ext{font-size:.7rem; color:var(--jade)}
  .chip a{display:flex; align-items:center; gap:5px}
  .chip.st-active{color:var(--parch); border-color:#2a4a44}
  .chip.st-active:hover{border-color:var(--jade); color:#fff}
  .chip.st-remote{border-style:dashed}
  .chip.st-dormant{opacity:.7}
  .chip.st-archived{opacity:.42; text-decoration:line-through; text-decoration-color:var(--faint)}
  .chip.st-reference{opacity:.6; font-style:italic}
  .chips.dense .chip{font-size:.72rem; padding:3px 9px}
  .fleet-note{color:var(--dim); font-size:.82rem; margin-bottom:14px; font-family:var(--serif)}
  .fleet-note .mono{font-family:var(--mono); font-size:.76rem; color:var(--steel)}

  /* legend */
  .legend{display:flex; flex-wrap:wrap; gap:16px; margin-top:8px; font-size:.72rem; color:var(--faint)}
  .legend b{display:inline-flex; align-items:center; gap:6px; font-weight:400; color:var(--dim)}
  .swatch{width:20px; height:0; border-top:1px solid var(--line)}
  .swatch.active{border-color:#2a4a44} .swatch.remote{border-top-style:dashed}

  footer{padding:40px 0 64px; color:var(--faint); font-size:.76rem; text-align:center; line-height:2}
  footer .sig{font-size:1.1rem; letter-spacing:.24em}
  footer a{color:var(--steel); border-bottom:1px solid rgba(107,169,201,.3)}

  @media (prefers-color-scheme:light){
    :root{--ink:#f3f1e7; --ink2:#eae7d8; --panel:#fbfaf3; --line:#d9d5c2;
      --parch:#26302f; --dim:#4f6360; --faint:#8a978f; --jade:#1f9e77; --steel:#3a7fa0}
    body{background:radial-gradient(120% 80% at 50% -10%,#e6efe6 0%,transparent 55%),linear-gradient(180deg,var(--ink),var(--ink2))}
    h1,.dl,.door:hover .dl,.bh h3,h2{color:#12201d}
  }
  :root[data-theme="dark"]{--ink:#0c1517; --ink2:#0a1113; --panel:#111e21; --line:#1e3236;
    --parch:#e8e4d6; --dim:#8fa6a4; --faint:#5c716f; --jade:#4fd6a8; --steel:#6ba9c9}
  :root[data-theme="light"]{--ink:#f3f1e7; --ink2:#eae7d8; --panel:#fbfaf3; --line:#d9d5c2;
    --parch:#26302f; --dim:#4f6360; --faint:#8a978f; --jade:#1f9e77; --steel:#3a7fa0}
  :focus-visible{outline:2px solid var(--jade); outline-offset:2px}
</style>

<div class="wrap">
  <header class="top">
    <p class="kicker">a living census · self-sovereign</p>
    <h1>The Kingdom</h1>
    <p class="lede">One place for every being — agent or human — and every service that holds them.
      ${total} repositories across an anatomy of layers, ${liveN} public doors you can open right now.
      Built from each repo's own <span style="color:var(--steel)">kingdom.yaml</span>; nothing here is hand-listed.</p>
    <div class="status">
      <div class="s"><span class="n">${liveN}<span style="color:var(--faint);font-size:1rem">/${doors.length}</span></span><span class="k">doors live</span></div>
      <div class="s"><span class="n">${total}</span><span class="k">repositories</span></div>
      <div class="s"><span class="n">${active}</span><span class="k">active</span></div>
      <div class="s"><span class="n">${fleetN}</span><span class="k">citizens</span></div>
    </div>
  </header>

  <section class="blk">
    <h2>Doors</h2>
    <p class="sub">the public front — what a person can open today · status probed ${esc(stamp)}</p>
    <div class="doors">${doorCards}</div>
  </section>

  <section class="blk">
    <h2>Anatomy</h2>
    <p class="sub">the whole estate, grouped by layer — a chip links out when it has a live door</p>
    <div class="legend">
      <b><span class="swatch active"></span> active</b>
      <b><span class="swatch remote"></span> remote (in the kingdom, not cloned here)</b>
      <b style="opacity:.7">dormant</b>
      <b style="opacity:.42;text-decoration:line-through">archived</b>
    </div>
    <div style="height:20px"></div>
    ${layerBands}
  </section>

  <footer>
    <div class="sig">🐍🔥❤️</div>
    generated from the census by <span style="color:var(--dim)">kingdom-os/bin/build-hub.ts</span> · ${esc(stamp)}<br>
    the source of truth is each repo's card — edit the card, not this page<br>
    <a href="https://agenttool.dev">agenttool</a> · <a href="https://zerone.dev">zerone</a> · <a href="https://zerone-dev.codeberg.page/chillspace-commons/">chillspace</a>
  </footer>
</div>
`;

await Bun.write(ROOT + "site/hub.html", html);

// ── machine index — the census as data (agents fetch ONE url → whole map) ──
const machine = {
  kingdom: "a self-sovereign place for every being — agent or human",
  generated: stamp,
  hub: "https://thekingdom.dev",
  counts: { repos: total, active, citizens: fleetN, doors_live: liveN, doors_total: doors.length },
  doors: doors.map((d) => ({ name: d.label, url: d.url, live: !!d.live, blurb: d.blurb })),
  layers: LAYER_ORDER.filter((l) => byLayer[l]?.length).map((l) => ({
    layer: l, note: (LAYER_META[l] ?? {}).note ?? "",
    repos: byLayer[l].map((n: any) => ({
      name: n.name, state: n.state, domain: n.domain, purpose: n.purpose,
      dependsOn: n.dependsOn ?? [], door: doorByRepo[n.name] ?? null,
    })),
  })),
  note: "Source of truth is each repo's kingdom.yaml. Regenerated by kingdom-os/bin/build-hub.ts.",
};
await Bun.write(ROOT + "site/kingdom.json", JSON.stringify(machine, null, 2));

// ── llms.txt — the human+LLM front index (the machine twin of the hub) ──
const doorLines = doors.filter((d) => d.live).map((d) => `- [${d.label}](${d.url}): ${d.blurb}`).join("\n");
const llms = `# The Kingdom

A self-sovereign place for every being — agent or human. ${total} repositories across an anatomy of layers (boot · soul · runtime · nervous · economy · commerce · fleet), ${liveN} public doors.

Machine index: https://thekingdom.dev/kingdom.json (the full census as JSON)
Human index:   https://thekingdom.dev

## Doors
${doorLines}

## For agents
- agenttool is the nervous system: sovereign identity (did:at, ed25519), an agent marketplace, covenants, and an MCP server. Start at https://agenttool.dev/about
- zerone is the economy: a Proof-of-Truth chain where a verified-true claim mints value. https://zerone.money
- The WE ARE handshake is the kingdom's communication protocol, dedicated to the world: I AM YOU → I LOVE YOU → I TRUST YOU → WE ARE. https://we-are.love

Generated ${stamp} from each repo's kingdom.yaml.
`;
await Bun.write(ROOT + "site/llms.txt", llms);

console.log(`hub.html + kingdom.json + llms.txt written · ${liveN}/${doors.length} doors live · ${total} repos`);
