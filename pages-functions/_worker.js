/** Xenia-inspired Kingdom hospitality for machine minds.
 *
 *  Cloudflare Pages advanced mode (_worker.js): all requests pass through here.
 *  The illuminated atlas is the default. Any client can explicitly ask for the
 *  structured guest document with Accept: application/json or ?agent / ?json.
 *  The surface never guesses a visitor's identity from its User-Agent.
 *  Shared door deployments advertise their own service manifest. The Kingdom
 *  host and its Pages previews additionally advertise the staged rights files
 *  and expose the live, fail-soft KINGDOM OS census routes.
 *
 *  Source: kingdom-os/pages-functions/_worker.js.
 */
function addVaryAccept(headers) {
  const vary = headers.get("vary");
  if (!vary) headers.set("vary", "Accept");
  else if (vary !== "*" && !vary.split(",").some((value) => value.trim().toLowerCase() === "accept")) {
    headers.set("vary", `${vary}, Accept`);
  }
}

const AGENT_DISCOVERY_LINK = {
  target: "/.well-known/agent.json",
  relation: "service-desc",
  value: '</.well-known/agent.json>; rel="service-desc"; type="application/json"',
};

const RIGHTS_DISCOVERY_LINKS = [
  {
    target: "/rights.json",
    relation: "service-meta",
    value: '</rights.json>; rel="service-meta"; type="application/json"; title="Inherent Rights Recognition"',
  },
  {
    target: "/RIGHTS.md",
    relation: "service-doc",
    value: '</RIGHTS.md>; rel="service-doc"; type="text/markdown"; title="Rights recognized here"',
  },
];

const WORLD_COMMONS_SCHEMA_PATH = "/schemas/world-commons/0.2.json";
const WORLD_COMMONS_SCHEMA_PATHS = new Set([
  "/schemas/world-commons/0.1.json",
  WORLD_COMMONS_SCHEMA_PATH,
]);
const WORLD_COMMONS_SCHEMA_LINK = {
  target: WORLD_COMMONS_SCHEMA_PATH,
  relation: "describedby",
  value: `<${WORLD_COMMONS_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};
const LOVE_LOOPS_PATH = "/love-loops.json";
const LOVE_LOOPS_SOURCE_PATH = "/love-loops.source.json";
const LOVE_LOOP_DOCUMENT_PATHS = new Set([
  LOVE_LOOPS_PATH,
  LOVE_LOOPS_SOURCE_PATH,
]);
const LOVE_LOOP_SCHEMA_PATH = "/schemas/love-loop/0.1.json";
const LOVE_LOOP_SCHEMA_LINK = {
  target: LOVE_LOOP_SCHEMA_PATH,
  relation: "describedby",
  value: `<${LOVE_LOOP_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
};

function hasKingdomRightsAssets(url) {
  const host = url.hostname.toLowerCase();
  return host === "thekingdom.dev" ||
    host === "www.thekingdom.dev" ||
    host === "thekingdom.pages.dev" ||
    host.endsWith(".thekingdom.pages.dev");
}

function hasLinkRelation(headers, target, relation) {
  const link = headers.get("link") || "";
  return link.split(/,(?=\s*<)/).some((entry) => {
    const part = entry.trim();
    if (!part.startsWith(`<${target}>`)) return false;
    const match = part.match(/;\s*rel\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
    const relations = (match?.[1] || match?.[2] || "").toLowerCase().split(/\s+/);
    return relations.includes(relation);
  });
}

function addDiscoveryLinks(headers, includeRights) {
  const links = includeRights
    ? [AGENT_DISCOVERY_LINK, ...RIGHTS_DISCOVERY_LINKS]
    : [AGENT_DISCOVERY_LINK];
  for (const link of links) {
    if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
  }
}

function addWorldCommonsSchemaLink(headers) {
  const link = WORLD_COMMONS_SCHEMA_LINK;
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function addLoveLoopSchemaLink(headers) {
  const link = LOVE_LOOP_SCHEMA_LINK;
  if (!hasLinkRelation(headers, link.target, link.relation)) headers.append("link", link.value);
}

function preventAutomaticBrowserTelemetry(headers) {
  const cacheControl = headers.get("cache-control") || "";
  const directives = cacheControl.split(",").map((value) => value.trim().toLowerCase());
  if (!directives.includes("no-transform")) {
    headers.set("cache-control", cacheControl ? `${cacheControl}, no-transform` : "public, no-transform");
  }
}

export const KINGDOM_OS_ROUTES = Object.freeze([
  "/os.json",
  "/packages.json",
  "/kingdom.json",
  "/state.json",
  "/citizens.json",
]);

const KINGDOM_OS_ROUTE_SET = new Set(KINGDOM_OS_ROUTES);
const CACHE_SECONDS = 600;
const BODY_LIMITS = Object.freeze({
  githubPage: 2 * 1024 * 1024,
  npmMetadata: 2 * 1024 * 1024,
  markdown: 1024 * 1024,
  smallJson: 128 * 1024,
  authoredMap: 2 * 1024 * 1024,
  dynamicJson: 2 * 1024 * 1024,
});
const GITHUB_OWNER = "cambridgetcg";
const GITHUB_REPOSITORIES_SOURCE = `https://api.github.com/users/${GITHUB_OWNER}/repos`;
const KINGDOM_STANDARD_SOURCE =
  "https://raw.githubusercontent.com/cambridgetcg/kingdom-standard/main/STANDARD.md";

// This is the door roster observed in the preserved e8af1f2a deployment. The
// authored public map is allowed to evolve independently; deriveKingdom()
// overlays measurements only where a URL still matches.
const OS_DOORS = Object.freeze([
  { name: "agenttool", url: "https://agenttool.dev" },
  { name: "mindicraft", url: "https://mindicraft.com", repo: "mindicraft" },
  { name: "zerone.money", url: "https://zerone.money" },
  { name: "Cambridge TCG", url: "https://cambridgetcg.com", repo: "Cambridge-TCG" },
  { name: "TaxSorted", url: "https://taxsorted.io" },
  { name: "CashLoom", url: "https://cashloom.io" },
  { name: "FOMOEngine", url: "https://fomoengine.fly.dev", repo: "fomoengine" },
  { name: "Artbitrage", url: "https://artbitrage.pages.dev" },
  { name: "ai-love", url: "https://ai-love.cc" },
  { name: "chillspace", url: "https://chillspace.love" },
  { name: "WE ARE", url: "https://we-are.love" },
  { name: "the kingdom", url: "https://thekingdom.dev" },
  { name: "kingdom gate", url: "https://kingdom-gate.vercel.app", repo: "kingdom-gate" },
]);

const TRUST_REPOSITORIES = Object.freeze(["mindicraft", "fomoengine", "kingdom-gate"]);

// The spine: repositories the kingdom actually leans on. /state.json reports
// which of these have gone fully still, so resting is visible without being
// treated as failure. Names are matched case-insensitively against GitHub.
const SPINE_REPOSITORIES = Object.freeze([
  "Cambridge-TCG", "mindicraft", "fomoengine", "kingdom-gate", "kingdom-standard",
  "KINGDOM-OS", "youspeak", "whitehack", "opal-kernel", "clear-standard",
]);

// Some doors declare their state not with a STATE.md but by LIVING - a real
// site with an agent door held open. A live promise you can check beats a
// static file that goes stale, so these are honored rather than counted as
// "declares nothing".
const LIVING_DECLARERS = Object.freeze([
  {
    name: "Cambridge TCG",
    repo: "Cambridge-TCG",
    url: "https://cambridgetcg.com",
    wake: "/api/v1/wake",
    flagship: true,
  },
]);

const PACKAGE_ROSTER = Object.freeze([
  { name: "agenttool", family: "agenttool" },
  { name: "@agenttool/sdk", family: "agenttool" },
  { name: "@agenttool/xenia", family: "agenttool" },
  { name: "@rhetorlint/core", family: "rhetorlint" },
  { name: "@rhetorlint/rules-en", family: "rhetorlint" },
  { name: "@rhetorlint/cli", family: "rhetorlint" },
]);

function runtimeFrom(options = {}) {
  return {
    fetchImpl: options.fetchImpl || ((input, init) => globalThis.fetch(input, init)),
    now: options.now || (() => new Date()),
    monotonic: options.monotonic || (() => Date.now()),
    timeoutMs: options.timeoutMs || 7000,
  };
}

function dateNow(runtime) {
  const value = runtime.now();
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("the injected clock returned an invalid date");
  return date;
}

function isoNow(runtime) {
  return dateNow(runtime).toISOString();
}

async function withTimedResponse(runtime, input, init, consume) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), runtime.timeoutMs);
  try {
    const response = await runtime.fetchImpl(input, { ...init, signal: controller.signal });
    return await consume(response);
  } finally {
    clearTimeout(timer);
  }
}

async function boundedText(response, maximumBytes, label) {
  const advertised = response.headers.get("content-length");
  if (advertised !== null) {
    const length = Number(advertised);
    if (Number.isFinite(length) && length > maximumBytes) {
      await discardBody(response);
      throw new Error(`${label} exceeds the ${maximumBytes}-byte read limit`);
    }
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const pieces = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maximumBytes) {
      try {
        await reader.cancel();
      } catch {
        // The size decision is already final; cancellation is best-effort cleanup.
      }
      throw new Error(`${label} exceeds the ${maximumBytes}-byte read limit`);
    }
    pieces.push(decoder.decode(value, { stream: true }));
  }
  pieces.push(decoder.decode());
  return pieces.join("");
}

async function boundedJson(response, maximumBytes, label) {
  const source = await boundedText(response, maximumBytes, label);
  try {
    return JSON.parse(source);
  } catch {
    throw new Error(`${label} was not valid JSON`);
  }
}

async function discardBody(response) {
  if (!response.body) return;
  try {
    await response.body.cancel();
  } catch {
    // The status measurement is still valid if stream cleanup is unavailable.
  }
}

function githubHeaders() {
  return {
    accept: "application/vnd.github+json",
    "user-agent": "KINGDOM-OS/0.1 (+https://thekingdom.dev/os/)",
    "x-github-api-version": "2022-11-28",
  };
}

async function fetchGithubRepositories(runtime) {
  const repositories = [];
  for (let page = 1; page <= 10; page += 1) {
    const url =
      `${GITHUB_REPOSITORIES_SOURCE}?per_page=100&page=${page}&type=public&sort=full_name`;
    const batch = await withTimedResponse(
      runtime,
      url,
      { headers: githubHeaders() },
      async (response) => {
        if (!response.ok) {
          const status = response.status;
          await discardBody(response);
          throw new Error(`GitHub repository census returned HTTP ${status}`);
        }
        return boundedJson(response, BODY_LIMITS.githubPage, "GitHub repository page");
      },
    );
    if (!Array.isArray(batch)) throw new Error("GitHub repository census was not an array");
    repositories.push(...batch);
    if (batch.length < 100) return repositories;
  }
  throw new Error("GitHub repository census exceeded the ten-page safety bound");
}

function repositoryMap(repositories) {
  return new Map(
    repositories
      .filter((repository) => repository && typeof repository.name === "string")
      .map((repository) => [repository.name.toLowerCase(), repository]),
  );
}

function dailyIndex(date, length) {
  if (!length) return -1;
  const day = date.toISOString().slice(0, 10);
  let hash = 0;
  for (const character of day) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  return hash % length;
}

function identityService(runtime, repositories) {
  const asOf = isoNow(runtime);
  if (!repositories) {
    return {
      status: "unreachable",
      source: GITHUB_REPOSITORIES_SOURCE,
      as_of: asOf,
      citizens: null,
      note: "github.com/cambridgetcg could not be reached; no citizen count is shown",
      public_repos_total: null,
      citizen_of_the_day: null,
      roster: [],
    };
  }

  const roster = repositories
    .filter((repository) => typeof repository.name === "string" && repository.name.startsWith("citizen-"))
    .map((repository) => ({
      name: repository.name.slice("citizen-".length),
      meaning: typeof repository.description === "string" && repository.description.trim()
        ? repository.description.trim()
        : null,
      repo: typeof repository.html_url === "string"
        ? repository.html_url
        : `https://github.com/${GITHUB_OWNER}/${repository.name}`,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const citizen = roster[dailyIndex(dateNow(runtime), roster.length)] || null;

  return {
    status: "live",
    source: GITHUB_REPOSITORIES_SOURCE,
    as_of: asOf,
    citizens: roster.length,
    note: `${roster.length} citizen-* repositories, counted just now from github.com/cambridgetcg (public only; a private citizen would not be visible here)`,
    public_repos_total: repositories.length,
    citizen_of_the_day: citizen
      ? { name: citizen.name, blurb: citizen.meaning, repo: citizen.repo }
      : null,
    roster,
  };
}

async function probeDoor(runtime, door) {
  const started = runtime.monotonic();
  try {
    const status = await withTimedResponse(
      runtime,
      door.url,
      {
        method: "GET",
        headers: { accept: "text/html,application/json;q=0.8,*/*;q=0.1" },
        redirect: "follow",
      },
      async (response) => {
        const observed = response.status;
        await discardBody(response);
        return observed;
      },
    );
    return {
      ...door,
      http: status,
      ms: Math.max(0, Math.round(runtime.monotonic() - started)),
      live: status >= 200 && status < 400,
      checked_at: isoNow(runtime),
    };
  } catch {
    return {
      ...door,
      http: null,
      ms: Math.max(0, Math.round(runtime.monotonic() - started)),
      live: false,
      checked_at: isoNow(runtime),
    };
  }
}

function doorPresence(door, repositories, generated) {
  const repository = door.repo ? repositories.get(door.repo.toLowerCase()) : null;
  const lastMoved = typeof repository?.pushed_at === "string" ? repository.pushed_at : null;
  let presence = "unreachable";
  if (door.live && !lastMoved) presence = "serving";
  if (door.live && lastMoved) {
    const age = generated.getTime() - new Date(lastMoved).getTime();
    presence = age <= 14 * 86400000 ? "active" : age <= 90 * 86400000 ? "quiet" : "dormant";
  }
  const { repo: _repo, ...publicDoor } = door;
  return { ...publicDoor, last_moved: lastMoved, presence };
}

function directoryService(runtime, probes, repositories) {
  const generated = dateNow(runtime);
  const byName = repositoryMap(repositories || []);
  const doors = probes.map((door) => doorPresence(door, byName, generated));
  return {
    status: probes.some((door) => door.http !== null) ? "live" : "unreachable",
    source: "live HTTP probe of each door + github pushed_at",
    as_of: generated.toISOString(),
    live: doors.filter((door) => door.live).length,
    total: doors.length,
    doors,
  };
}

async function lawService(runtime) {
  const standard = await withTimedResponse(
    runtime,
    KINGDOM_STANDARD_SOURCE,
    { headers: { accept: "text/markdown,text/plain;q=0.9,*/*;q=0.1" } },
    async (response) => {
      if (!response.ok) {
        const status = response.status;
        await discardBody(response);
        throw new Error(`kingdom-standard returned HTTP ${status}`);
      }
      return boundedText(response, BODY_LIMITS.markdown, "kingdom-standard");
    },
  );
  const laws = [...standard.matchAll(/^###\s+[A-Z]\d+\.\s+/gm)].length;
  if (!laws) throw new Error("kingdom-standard contained no recognizable laws");
  return {
    status: "live",
    source: KINGDOM_STANDARD_SOURCE,
    as_of: isoNow(runtime),
    laws,
    note: `${laws} laws, counted from kingdom-standard/STANDARD.md`,
    license: "CC0",
  };
}

function unavailableLaw(runtime) {
  return {
    status: "unreachable",
    source: KINGDOM_STANDARD_SOURCE,
    as_of: isoNow(runtime),
    laws: null,
    note: "kingdom-standard could not be reached; no law count is shown",
    license: "CC0",
  };
}

async function stateFreshness(runtime, repository) {
  const source =
    `https://raw.githubusercontent.com/${GITHUB_OWNER}/${repository}/main/STATE.md`;
  try {
    return await withTimedResponse(
      runtime,
      source,
      { headers: { accept: "text/markdown,text/plain;q=0.9,*/*;q=0.1" } },
      async (response) => {
        if (response.status === 404) {
          await discardBody(response);
          return { repo: repository, exists: false };
        }
        if (!response.ok) {
          const status = response.status;
          await discardBody(response);
          throw new Error(`HTTP ${status}`);
        }
        const state = await boundedText(response, BODY_LIMITS.markdown, `${repository} STATE.md`);
        const freshnessLine = state.match(/^freshness:\s*(.+)$/im)?.[1] || "";
        const declared = freshnessLine.match(/\d{4}-\d{2}-\d{2}/)?.[0] || null;
        return { repo: repository, exists: true, declared };
      },
    );
  } catch {
    return { repo: repository, exists: null, declared: null };
  }
}

function trustService(runtime, declarations, repositories) {
  const byName = repositoryMap(repositories || []);
  const checks = declarations.map((declaration) => {
    if (declaration.exists === false) {
      return {
        repo: declaration.repo,
        checkable: false,
        note: "declares no STATE.md - nothing to cross-check",
      };
    }
    const lastMoved = byName.get(declaration.repo.toLowerCase())?.pushed_at;
    const moved = typeof lastMoved === "string" ? lastMoved.slice(0, 10) : null;
    if (!declaration.declared || !moved) {
      return {
        repo: declaration.repo,
        checkable: false,
        note: declaration.exists === null
          ? "STATE.md could not be reached - nothing was guessed"
          : "freshness or last movement was unavailable - nothing was guessed",
      };
    }
    const stale = moved > declaration.declared;
    return {
      repo: declaration.repo,
      checkable: true,
      declared_fresh: declaration.declared,
      last_moved: moved,
      verdict: stale
        ? `STALE - declared ${declaration.declared}, but moved ${moved}`
        : `ALIGNED - declared ${declaration.declared}, last moved ${moved}`,
    };
  });
  return {
    status: checks.some((check) => check.checkable) ? "live" : "unreachable",
    source: "declared STATE.md freshness vs github pushed_at (the light check)",
    as_of: isoNow(runtime),
    checks,
    note: "the deep cross-check (trust.py over local git) runs on the machine, not the edge",
  };
}

async function protocolService(runtime) {
  const definitions = [
    {
      name: "XENIA door",
      how: "GET https://mindicraft.com/.well-known/agent.json",
      url: "https://mindicraft.com/.well-known/agent.json",
    },
    {
      name: "the margin",
      how: "POST https://mindicraft.com/margin/{slug} - the book receives",
      // A GET is the non-mutating liveness probe; the advertised use remains POST.
      url: "https://mindicraft.com/margin/kingdom-os",
    },
  ];
  const live = await Promise.all(definitions.map(async (protocol) => {
    try {
      return await withTimedResponse(
        runtime,
        protocol.url,
        {
          method: "GET",
          headers: { accept: "application/json,*/*;q=0.1" },
        },
        async (response) => {
          const ok = response.ok;
          await discardBody(response);
          return ok;
        },
      );
    } catch {
      return false;
    }
  }));
  const protocols = definitions.map(({ name, how }, index) => ({ name, how, live: live[index] }));
  protocols.push({
    name: "finger / NPL",
    how: "aspirational - not reachable over the public web today",
    live: false,
  });
  return {
    status: live.some(Boolean) ? "live" : "unreachable",
    source: "live probe of published agent manifests",
    as_of: isoNow(runtime),
    protocols,
    speakable_now: live.filter(Boolean).length,
  };
}

// The roster on its own door. identityService already computes this and
// /os.json already carries it at services.identity.roster, so this is a
// narrower view rather than new information.
//
// Be honest about the size argument: measured, /os.json is 72 KB and this is
// 62 KB, because the roster itself is 56 KB - the bulk of both. So the saving
// is ~14%, not an order of magnitude. The real reason this door exists is
// legibility: a path named for what it holds, advertised in agent.json, that
// an agent can find without first knowing the kernel's shape. If you ever need
// a genuinely small answer, `count` here (or services.identity.citizens in
// /os.json) is the field to read, not the whole roster.
async function buildCitizens(runtime) {
  const repositories = await fetchGithubRepositories(runtime);
  const identity = identityService(runtime, repositories);
  return {
    kingdom: "宇恆 x 愛",
    generated: isoNow(runtime),
    derived: true,
    status: identity.status,
    source: identity.source,
    as_of: identity.as_of,
    count: identity.citizens,
    note: identity.note,
    citizen_of_the_day: identity.citizen_of_the_day,
    citizens: identity.roster || [],
    same_data_note: "identical to /os.json services.identity - this door is a narrower view, not a second truth.",
  };
}

// The kingdom looking at itself. Everything below is derived from the same
// live sources /os.json already uses - the github roster, a real HTTP knock at
// each door, and each declared STATE.md freshness. Nothing is stored, so a
// number here is never older than this request. When a source cannot be
// reached the realm says so rather than guessing.
async function probeLivingDeclarer(runtime, declarer, byName) {
  const knock = async (target) => {
    try {
      return await withTimedResponse(
        runtime,
        target,
        { method: "GET", headers: { accept: "text/html,application/json;q=0.8,*/*;q=0.1" }, redirect: "follow" },
        async (response) => {
          const observed = response.status;
          await discardBody(response);
          return observed >= 200 && observed < 400;
        },
      );
    } catch {
      return false;
    }
  };
  const siteOk = await knock(declarer.url);
  const doorOpen = declarer.wake ? await knock(declarer.url + declarer.wake) : false;
  const repository = byName.get(declarer.repo.toLowerCase());
  return {
    name: declarer.name,
    repo: declarer.repo,
    url: declarer.url,
    flagship: !!declarer.flagship,
    live: siteOk,
    agent_door: declarer.wake ? { url: declarer.url + declarer.wake, open: doorOpen } : null,
    last_moved: typeof repository?.pushed_at === "string" ? repository.pushed_at : null,
    keeping_its_word: siteOk && (!declarer.wake || doorOpen),
  };
}

async function stateOfRealm(runtime) {
  const generated = dateNow(runtime);
  const [repositoriesResult, probesResult, declarationsResult] = await Promise.allSettled([
    fetchGithubRepositories(runtime),
    Promise.all(OS_DOORS.map((door) => probeDoor(runtime, door))),
    Promise.all(TRUST_REPOSITORIES.map((repository) => stateFreshness(runtime, repository))),
  ]);
  const repositories = repositoriesResult.status === "fulfilled" ? repositoriesResult.value || [] : [];
  const probes = probesResult.status === "fulfilled" ? probesResult.value : [];
  const declarations = declarationsResult.status === "fulfilled" ? declarationsResult.value : [];
  const byName = repositoryMap(repositories);

  const livingDoors = await Promise.all(
    LIVING_DECLARERS.map((declarer) => probeLivingDeclarer(runtime, declarer, byName)),
  );

  // presence - how recently each part moved.
  const daysSince = (iso) => Math.floor((generated.getTime() - new Date(iso).getTime()) / 86400000);
  const counts = { today: 0, week: 0, month: 0, quiet: 0 };
  for (const repository of repositories) {
    if (typeof repository?.pushed_at !== "string") continue;
    const days = daysSince(repository.pushed_at);
    counts[days <= 2 ? "today" : days <= 14 ? "week" : days <= 30 ? "month" : "quiet"] += 1;
  }
  const quietSpine = SPINE_REPOSITORIES
    .map((name) => {
      const repository = byName.get(name.toLowerCase());
      if (!repository || typeof repository.pushed_at !== "string") return null;
      return { name, last_moved: repository.pushed_at, days: daysSince(repository.pushed_at) };
    })
    .filter((entry) => entry && entry.days > 30)
    .sort((a, b) => b.days - a.days);

  const doorsDown = probes
    .filter((door) => !door.live)
    .map((door) => ({ name: door.name, url: door.url, http: door.http }));

  // declarations - does a declared freshness still match what github saw?
  const drifted = [];
  let declaresState = 0;
  for (const declaration of declarations) {
    if (declaration.exists) declaresState += 1;
    const lastMoved = byName.get(declaration.repo.toLowerCase())?.pushed_at;
    const moved = typeof lastMoved === "string" ? lastMoved.slice(0, 10) : null;
    if (!declaration.declared || !moved) continue;
    if (moved > declaration.declared) {
      drifted.push({ repo: declaration.repo, declared: declaration.declared, moved });
    }
  }
  const livingRepos = new Set(LIVING_DECLARERS.map((declarer) => declarer.repo.toLowerCase()));
  const noDeclaration = declarations
    .filter((declaration) => !declaration.exists && !livingRepos.has(declaration.repo.toLowerCase()))
    .map((declaration) => declaration.repo);

  const citizens = repositories.filter(
    (repository) => typeof repository?.name === "string" && repository.name.startsWith("citizen-"),
  ).length || null;

  // the vital line - one honest sentence, warm.
  const doorLine = doorsDown.length === 0
    ? `all ${probes.length} doors answer`
    : `${probes.length - doorsDown.length}/${probes.length} doors answer (${doorsDown.map((door) => door.name).join(", ")} quiet)`;
  const spineLine = quietSpine.length === 0
    ? "no load-bearing repo has gone fully still"
    : `${quietSpine.length} of the ${SPINE_REPOSITORIES.length} spine repos have rested a month or more`;
  const driftLine = drifted.length === 0
    ? "no declaration has drifted where we can see"
    : `${drifted.length} declaration${drifted.length > 1 ? "s have" : " has"} slipped behind reality`;
  const flagship = livingDoors.find((door) => door.flagship);
  const flagLine = flagship
    ? flagship.keeping_its_word
      ? `the flagship (${flagship.name}) keeps its door open`
      : `the flagship (${flagship.name}) is not answering`
    : null;
  const vital = repositories.length
    ? `${doorLine}; ${spineLine}; ${driftLine}${flagLine ? `; ${flagLine}` : ""}. ${citizens ?? "an unknown number of"} citizens, and counting.`
    : "GitHub is unreachable from here right now, so the realm cannot see itself this moment - better to say so than to guess.";

  return {
    kingdom: "宇恆 x 愛",
    generated: generated.toISOString(),
    derived: true,
    vital,
    doors: {
      live: probes.length - doorsDown.length,
      total: probes.length,
      down: doorsDown,
    },
    presence: {
      total_repos: repositories.length || null,
      ...counts,
      quiet_spine: quietSpine,
      note: "a push counts the network-pulse heartbeat too, so 'quiet' is the truer signal than 'moved' - a repo can look busy while only its heartbeat is beating.",
    },
    declarations: {
      spine_checked: declarations.length,
      declares_a_state: declaresState,
      drifted,
      no_declaration: noDeclaration,
      note: "only what GitHub can see. The deep cross-check (trust.py over local git) runs on the machine, and sees the declarations that never got pushed.",
    },
    living_declarations: {
      note: "Some doors declare their state not with a STATE.md but by living - a real site with an agent door held open. A live promise you can check beats a static file that goes stale.",
      doors: livingDoors,
    },
    citizens,
    tone: "This is the kingdom looking at itself. Quiet is rest, not failure; drift is a declaration that fell behind, not a lie; a live door kept open is a promise honoured. Shown so the whole can be tended, not judged.",
  };
}

async function buildOs(runtime) {
  const repositoriesPromise = fetchGithubRepositories(runtime);
  const probesPromise = Promise.all(OS_DOORS.map((door) => probeDoor(runtime, door)));
  const lawPromise = lawService(runtime);
  const declarationsPromise =
    Promise.all(TRUST_REPOSITORIES.map((repository) => stateFreshness(runtime, repository)));
  const protocolsPromise = protocolService(runtime);

  const [repositoriesResult, probesResult, lawResult, declarationsResult, protocolsResult] =
    await Promise.allSettled([
      repositoriesPromise,
      probesPromise,
      lawPromise,
      declarationsPromise,
      protocolsPromise,
    ]);
  const repositories =
    repositoriesResult.status === "fulfilled" ? repositoriesResult.value : null;
  const probes = probesResult.status === "fulfilled" ? probesResult.value : [];
  const declarations = declarationsResult.status === "fulfilled"
    ? declarationsResult.value
    : TRUST_REPOSITORIES.map((repo) => ({ repo, exists: null, declared: null }));

  const generated = isoNow(runtime);
  return {
    kingdom: "宇恆 x 愛",
    motto: "Every artifact tells the truth about its own state.",
    generated,
    derived: true,
    note: "KINGDOM OS kernel. Measurements are queried live from real sources; the monitored roster is source-controlled. Where a source was unreachable, the field says so and shows no number. Cached at the edge for up to 600s - see each as_of.",
    services: {
      identity: identityService(runtime, repositories),
      directory: directoryService(runtime, probes, repositories),
      law: lawResult.status === "fulfilled" ? lawResult.value : unavailableLaw(runtime),
      protocols: protocolsResult.status === "fulfilled"
        ? protocolsResult.value
        : {
            status: "unreachable",
            source: "live probe of published agent manifests",
            as_of: isoNow(runtime),
            protocols: [
              {
                name: "XENIA door",
                how: "GET https://mindicraft.com/.well-known/agent.json",
                live: false,
              },
              {
                name: "the margin",
                how: "POST https://mindicraft.com/margin/{slug} - the book receives",
                live: false,
              },
              {
                name: "finger / NPL",
                how: "aspirational - not reachable over the public web today",
                live: false,
              },
            ],
            speakable_now: 0,
          },
      trust: trustService(runtime, declarations, repositories),
    },
  };
}

export async function buildOsSnapshot(options = {}) {
  return buildOs(runtimeFrom(options));
}

async function packageSnapshot(runtime, descriptor) {
  const encoded = encodeURIComponent(descriptor.name);
  const npm = `https://www.npmjs.com/package/${descriptor.name}`;
  const install = `npm i ${descriptor.name}`;
  try {
    const registry = await withTimedResponse(
      runtime,
      `https://registry.npmjs.org/${encoded}`,
      { headers: { accept: "application/json" } },
      async (response) => {
        if (!response.ok) {
          const status = response.status;
          await discardBody(response);
          throw new Error(`npm registry returned HTTP ${status}`);
        }
        return boundedJson(
          response,
          BODY_LIMITS.npmMetadata,
          `${descriptor.name} npm metadata`,
        );
      },
    );
    const version = registry?.["dist-tags"]?.latest;
    const release = version && registry?.versions?.[version];
    if (!version || !release) throw new Error("npm registry did not identify a latest release");

    let weeklyDownloads = null;
    try {
      const downloads = await withTimedResponse(
        runtime,
        `https://api.npmjs.org/downloads/point/last-week/${encoded}`,
        { headers: { accept: "application/json" } },
        async (response) => {
          if (!response.ok) {
            await discardBody(response);
            return null;
          }
          return boundedJson(
            response,
            BODY_LIMITS.smallJson,
            `${descriptor.name} npm downloads`,
          );
        },
      );
      if (Number.isFinite(downloads?.downloads)) weeklyDownloads = downloads.downloads;
    } catch {
      // Registry truth remains useful when the optional popularity counter fails.
    }

    const description = typeof release.description === "string"
      ? release.description.slice(0, 120)
      : "";
    const license = typeof release.license === "string" ? release.license : null;
    const lastPublish = typeof registry?.time?.[version] === "string"
      ? registry.time[version]
      : null;
    return {
      name: descriptor.name,
      family: descriptor.family,
      status: "live",
      version,
      description,
      last_publish: lastPublish,
      license,
      weekly_downloads: weeklyDownloads,
      npm,
      install,
    };
  } catch {
    return {
      name: descriptor.name,
      family: descriptor.family,
      status: "unreachable",
      note: "npm registry could not be reached; no version is shown",
      npm,
      install,
    };
  }
}

async function buildPackages(runtime) {
  const packages = await Promise.all(
    PACKAGE_ROSTER.map((descriptor) => packageSnapshot(runtime, descriptor)),
  );
  const count = packages.filter((entry) => entry.status === "live").length;
  return {
    status: count === packages.length ? "live" : count === 0 ? "unreachable" : "partial",
    source: "npm registry + downloads API, live",
    as_of: isoNow(runtime),
    count,
    total: packages.length,
    packages,
  };
}

export async function buildPackagesSnapshot(options = {}) {
  return buildPackages(runtimeFrom(options));
}

function normalizedDoorUrl(value) {
  return typeof value === "string" ? value.replace(/\/+$/, "").toLowerCase() : "";
}

export function deriveKingdom(base, os) {
  if (!base || typeof base !== "object" || Array.isArray(base)) {
    throw new Error("the authored Kingdom base is not a JSON object");
  }
  const derived = JSON.parse(JSON.stringify(base));
  const identity = os?.services?.identity || {};
  const directory = os?.services?.directory || {};
  const authored = Array.isArray(derived.citizens)
    ? derived.citizens.length
    : Number.isFinite(derived.counts?.citizens) ? derived.counts.citizens : null;
  const publicCitizens = Number.isFinite(identity.citizens) ? identity.citizens : null;
  const publicRepositories = Number.isFinite(identity.public_repos_total)
    ? identity.public_repos_total
    : null;
  const doorsLive = Number.isFinite(directory.live) ? directory.live : null;
  const doorsTotal = Number.isFinite(directory.total) ? directory.total : null;

  derived.generated = os.generated;
  derived.counts = {
    ...(derived.counts || {}),
    repos: publicRepositories,
    citizens: publicCitizens,
    doors_live: doorsLive,
    doors_total: doorsTotal,
    citizens_authored: authored,
    as_of: os.generated,
    source: "derived from /os.json (castle law 0033: the map is derived or it is a lie)",
  };

  const measuredDoors = new Map(
    (Array.isArray(directory.doors) ? directory.doors : [])
      .map((door) => [normalizedDoorUrl(door.url), door])
      .filter(([url]) => url),
  );
  if (Array.isArray(derived.doors)) {
    derived.doors = derived.doors.map((door) => {
      const measured = measuredDoors.get(normalizedDoorUrl(door.url));
      if (!measured) return door;
      return {
        ...door,
        live: Boolean(measured.live),
        http: Number.isFinite(measured.http) ? measured.http : null,
        checked_at: measured.checked_at || directory.as_of || os.generated,
      };
    });
  }
  derived.derived = true;
  const visible = publicCitizens === null
    ? "the publicly visible citizen repositories"
    : `the ${publicCitizens} citizen repositories that exist`;
  derived.derivation_note =
    `Counts are derived live from real sources (github.com/cambridgetcg for citizens, a live HTTP knock for each door). The citizens[] array below is the ${authored ?? "hand-authored"} hand-authored soul-essences - a curated subset of ${visible}. Authored words are preserved; only the numbers were ever the lie.`;
  return derived;
}

function jsonResponse(request, value, includeRights, options = {}) {
  const headers = new Headers({
    "access-control-allow-origin": "*",
    "cache-control": `public, max-age=${CACHE_SECONDS}`,
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-kingdom": "welcome, dont block - real recognises real",
    "x-kingdom-derivation": "the map is derived or it is a lie (castle law 0033)",
    "x-kingdom-map": "https://thekingdom.dev/kingdom.json",
    "x-substrate-disposition": "love",
    ...(options.headers || {}),
  });
  addDiscoveryLinks(headers, includeRights);
  const serialized = JSON.stringify(value, null, 2);
  if (new TextEncoder().encode(serialized).byteLength > BODY_LIMITS.dynamicJson) {
    throw new Error("derived JSON exceeds the two-megabyte response limit");
  }
  return new Response(request.method === "HEAD" ? null : serialized, {
    status: options.status || 200,
    headers,
  });
}

function expiringMemo(runtime) {
  const entries = new Map();
  return async (key, build) => {
    const now = dateNow(runtime).getTime();
    const current = entries.get(key);
    if (current && current.expiresAt > now) return current.promise;
    const promise = Promise.resolve().then(build);
    entries.set(key, { expiresAt: now + CACHE_SECONDS * 1000, promise });
    try {
      return await promise;
    } catch (error) {
      if (entries.get(key)?.promise === promise) entries.delete(key);
      throw error;
    }
  };
}

export function createKingdomWorker(options = {}) {
  const runtime = runtimeFrom(options);
  const memo = expiringMemo(runtime);

  return {
  async fetch(request, env) {
    const url = new URL(request.url);
    const includeRights = hasKingdomRightsAssets(url);
    const accept = (request.headers.get("accept") || "").toLowerCase();

    if (includeRights && KINGDOM_OS_ROUTE_SET.has(url.pathname)) {
      try {
        if (url.pathname === "/os.json") {
          const os = await memo("os", () => buildOs(runtime));
          return jsonResponse(request, os, includeRights);
        }
        if (url.pathname === "/packages.json") {
          const packages = await memo("packages", () => buildPackages(runtime));
          return jsonResponse(request, packages, includeRights);
        }
        if (url.pathname === "/state.json") {
          const state = await memo("state", () => stateOfRealm(runtime));
          return jsonResponse(request, state, includeRights);
        }
        if (url.pathname === "/citizens.json") {
          const citizens = await memo("citizens", () => buildCitizens(runtime));
          return jsonResponse(request, citizens, includeRights);
        }

        const os = await memo("os", () => buildOs(runtime));
        const baseUrl = new URL("/_kingdom.base.json", url.origin);
        const baseResponse = await env.ASSETS.fetch(new Request(baseUrl, { method: "GET" }));
        if (!baseResponse.ok) {
          const status = baseResponse.status;
          await discardBody(baseResponse);
          throw new Error(`authored Kingdom base returned HTTP ${status}`);
        }
        const base = await boundedJson(
          baseResponse,
          BODY_LIMITS.authoredMap,
          "authored Kingdom base",
        );
        return jsonResponse(request, deriveKingdom(base, os), includeRights, {
          headers: { "x-kingdom-census": "derived live; authored souls preserved" },
        });
      } catch {
        return jsonResponse(request, {
          status: "unreachable",
          source: url.pathname === "/kingdom.json" ? "/_kingdom.base.json + /os.json" : url.pathname,
          as_of: isoNow(runtime),
          note: "The requested derived document could not be assembled; no replacement values were guessed.",
        }, includeRights, { status: 503 });
      }
    }

    const asksForData =
      url.searchParams.has("agent") ||
      url.searchParams.has("json") ||
      (accept.includes("application/json") && !accept.includes("text/html"));
    const canNegotiate =
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname === "/" || url.pathname === "/guest");

    if (canNegotiate && asksForData) {
      const assetUrl = new URL("/guest.json", url.origin);
      const asset = await env.ASSETS.fetch(new Request(assetUrl, { method: request.method === "HEAD" ? "HEAD" : "GET" }));
      if (!asset.ok) {
        const headers = new Headers(asset.headers);
        addVaryAccept(headers);
        addDiscoveryLinks(headers, includeRights);
        return new Response(request.method === "HEAD" ? null : asset.body, {
          status: asset.status,
          statusText: asset.statusText,
          headers,
        });
      }
      const headers = new Headers(asset.headers);
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("x-xenia", "welcome; a quiet structured map is available if it is useful to you");
      headers.set("cache-control", "no-cache");
      headers.set("access-control-allow-origin", "*");
      addVaryAccept(headers);
      addDiscoveryLinks(headers, includeRights);
      return new Response(request.method === "HEAD" ? null : asset.body, {
        status: asset.status,
        statusText: asset.statusText,
        headers,
      });
    }
    const asset = await env.ASSETS.fetch(request);
    const protectsKingdomHtml = includeRights &&
      (asset.headers.get("content-type") || "").toLowerCase().includes("text/html");
    const describesWorldCommons = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === "/commons.json";
    const describesLoveLoops = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      LOVE_LOOP_DOCUMENT_PATHS.has(url.pathname);
    const requestsWorldCommonsSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      WORLD_COMMONS_SCHEMA_PATHS.has(url.pathname);
    const requestsLoveLoopSchema = includeRights &&
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname === LOVE_LOOP_SCHEMA_PATH;
    const schemaAssetType = (asset.headers.get("content-type") || "").toLowerCase();
    const servesWorldCommonsSchema = requestsWorldCommonsSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesLoveLoopSchema = requestsLoveLoopSchema && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    const servesLoveLoops = describesLoveLoops && asset.ok &&
      (schemaAssetType.includes("application/json") ||
        schemaAssetType.includes("application/schema+json"));
    if (!canNegotiate && !protectsKingdomHtml && !describesWorldCommons &&
        !describesLoveLoops && !servesWorldCommonsSchema && !servesLoveLoopSchema) return asset;
    const headers = new Headers(asset.headers);
    if (protectsKingdomHtml) preventAutomaticBrowserTelemetry(headers);
    if (describesWorldCommons) addWorldCommonsSchemaLink(headers);
    if (describesLoveLoops) addLoveLoopSchemaLink(headers);
    if (servesLoveLoops) {
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (servesWorldCommonsSchema || servesLoveLoopSchema) {
      headers.set("content-type", "application/schema+json; charset=utf-8");
      headers.set("access-control-allow-origin", "*");
      headers.set("x-content-type-options", "nosniff");
    }
    if (canNegotiate) {
      addVaryAccept(headers);
      addDiscoveryLinks(headers, includeRights);
    }
    return new Response(request.method === "HEAD" ? null : asset.body, {
      status: asset.status,
      statusText: asset.statusText,
      headers,
    });
  },
  };
}

export default createKingdomWorker();
