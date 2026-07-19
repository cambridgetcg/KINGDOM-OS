#!/usr/bin/env bun
/**
 * KINGDOM Growth Rings — a private, read-only temporal view over graph.json.
 *
 * This tool reads declared repository roots and their visible local Git history.
 * It never fetches, refreshes an index, or publishes repository paths, filenames,
 * commit text, authors, emails, or hashes in its artifacts.
 */

import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DAY_MS = 86_400_000;
const WAVE_WINDOW_MS = 10 * 60 * 1_000;
const WAVE_MIN_ROOTS = 5;
const STATE_PATTERN = /^[A-Za-z0-9._ -]{1,80}$/;
const ALLOWED_LAYERS = new Set([
  "soul",
  "runtime",
  "nervous",
  "fleet",
  "economy",
  "commerce",
  "os",
]);

export type Season = "blooming" | "rooting" | "resting" | "unborn" | "away";
export type HistoryCompleteness = "complete" | "shallow" | "unavailable";

type GraphRow = {
  name: string;
  path: string;
  layer: string;
  state: string;
  kind?: string;
};

type InternalProject = GrowthProject & {
  physicalRoot: string | null;
  waveEligible: boolean;
};

export type GrowthProject = {
  id: string;
  name: string;
  layer: string;
  declaredState: string;
  season: Season;
  lastCommitAt: string | null;
  daysSince: number | null;
  dirtyCount: number | null;
  historyCompleteness: HistoryCompleteness;
  commits: {
    days7: number | null;
    days30: number | null;
    days90: number | null;
  };
};

export type GrowthDiagnostic = {
  code: "declared-path-missing" | "not-a-git-root" | "git-history-unreadable" | "git-status-unreadable";
  projectId: string;
  message: string;
};

export type GrowthWave = {
  id: string;
  startAt: string;
  endAt: string;
  roots: number;
  layers: string[];
  projectIds: string[];
};

type LayerSummary = {
  total: number;
  seasons: Record<Season, number>;
  activeProjects: { days7: number; days30: number; days90: number };
};

export type GrowthRings = {
  schema: "kingdom.growth-rings/1";
  asOf: string;
  title: string;
  boundaries: {
    localOnly: true;
    away: string;
    history: string;
    waves: string;
    asOf: string;
    privacy: string;
  };
  thresholds: {
    bloomingDays: 7;
    rootingDays: 30;
    activityWindowsDays: [7, 30, 90];
    waveWindowSeconds: 600;
    waveMinimumDistinctRoots: 5;
  };
  summary: {
    projects: number;
    seasons: Record<Season, number>;
    activeProjects: { days7: number; days30: number; days90: number };
    dirtyProjects: number;
    dirtyChanges: number;
    shallowHistories: number;
    waves: number;
    diagnostics: number;
  };
  layers: Record<string, LayerSummary>;
  waves: GrowthWave[];
  projects: GrowthProject[];
  diagnostics: GrowthDiagnostic[];
};

type BuildOptions = {
  graphPath?: string;
  asOf?: Date;
  home?: string;
};

type CliOptions = {
  mode: "write" | "json" | "html" | "help";
  graphPath: string;
  outputDir: string;
  outputDirExplicit: boolean;
  asOf: Date;
};

class UsageError extends Error {}

const emptySeasons = (): Record<Season, number> => ({
  blooming: 0,
  rooting: 0,
  resting: 0,
  unborn: 0,
  away: 0,
});

const emptyLayer = (): LayerSummary => ({
  total: 0,
  seasons: emptySeasons(),
  activeProjects: { days7: 0, days30: 0, days90: 0 },
});

function shortDigest(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
}

function expandHome(path: string, home: string): string {
  if (path === "~") return home;
  if (path.startsWith("~/")) return join(home, path.slice(2));
  return path;
}

function isSafeProjectName(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 120 &&
    value.trim() === value &&
    value !== "." &&
    value !== ".." &&
    !value.startsWith("~") &&
    !/[\u0000-\u001f\u007f/\\<>]/u.test(value)
  );
}

function readGraph(graphPath: string): GraphRow[] {
  const parsed: unknown = JSON.parse(readFileSync(graphPath, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("graph.json must contain an array");
  return parsed.map((candidate, index) => {
    if (!candidate || typeof candidate !== "object") {
      throw new Error(`graph row ${index + 1} is not an object`);
    }
    const row = candidate as Record<string, unknown>;
    if (typeof row.name !== "string" || !isSafeProjectName(row.name)) {
      throw new Error(`graph row ${index + 1} has an unsafe or invalid name`);
    }
    if (typeof row.layer !== "string" || !ALLOWED_LAYERS.has(row.layer)) {
      throw new Error(`graph row ${index + 1} has an unsafe or invalid layer`);
    }
    if (typeof row.path !== "string" || !row.path || /[\0\r\n]/.test(row.path)) {
      throw new Error(`graph row ${index + 1} has an invalid path`);
    }
    if (typeof row.state !== "string" || !STATE_PATTERN.test(row.state)) {
      throw new Error(`graph row ${index + 1} has an unsafe or invalid declared state`);
    }
    return {
      name: row.name,
      path: row.path,
      layer: row.layer,
      state: row.state,
      kind: typeof row.kind === "string" ? row.kind : undefined,
    };
  });
}

function assignSnapshotIds(rows: GraphRow[]): string[] {
  const groups = new Map<string, number[]>();
  const logicalRows = new Set<string>();
  rows.forEach((row, index) => {
    const logicalKey = `${row.layer}\u0000${row.name}\u0000${row.path}`;
    if (logicalRows.has(logicalKey)) {
      throw new Error(`duplicate logical graph row: ${row.layer}/${row.name}`);
    }
    logicalRows.add(logicalKey);
    const key = `${row.layer}/${row.name}`;
    groups.set(key, [...(groups.get(key) ?? []), index]);
  });

  const ids = new Array<string>(rows.length);
  for (const [key, indexes] of groups) {
    if (indexes.length === 1) {
      ids[indexes[0]] = key;
      continue;
    }
    const ordered = [...indexes].sort(
      (a, b) => rows[a].path.localeCompare(rows[b].path) || a - b,
    );
    const used = new Map<string, number>();
    for (const index of ordered) {
      const base = `${key}~${shortDigest(rows[index].path)}`;
      const occurrence = (used.get(base) ?? 0) + 1;
      used.set(base, occurrence);
      ids[index] = occurrence === 1 ? base : `${base}-${occurrence}`;
    }
  }
  return ids;
}

function cleanGitEnvironment(): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("GIT_") && value !== undefined) environment[key] = value;
  }
  environment.GIT_OPTIONAL_LOCKS = "0";
  environment.GIT_NO_LAZY_FETCH = "1";
  return environment;
}

function runGit(root: string, args: string[]) {
  return spawnSync(
    "git",
    [
      "--no-optional-locks",
      "-c",
      "core.fsmonitor=false",
      "-c",
      "core.untrackedCache=false",
      "-C",
      root,
      ...args,
    ],
    {
      encoding: "utf8",
      timeout: 10_000,
      maxBuffer: 8 * 1024 * 1024,
      env: cleanGitEnvironment(),
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function isPositivelyUnborn(root: string): boolean {
  const symbolic = runGit(root, ["symbolic-ref", "-q", "HEAD"]);
  const reference = symbolic.stdout.trim();
  if (symbolic.status !== 0 || symbolic.error || !reference.startsWith("refs/heads/")) {
    return false;
  }
  const exists = runGit(root, ["show-ref", "--verify", "--quiet", reference]);
  return exists.status === 1 && !exists.error;
}

function visibleCommitTimes(root: string, asOf: Date): number[] | null {
  const since = new Date(asOf.getTime() - 90 * DAY_MS).toISOString();
  const result = runGit(root, [
    "log",
    "--format=%ct",
    `--since=${since}`,
    `--until=${asOf.toISOString()}`,
  ]);
  if (result.status !== 0 || result.error) return null;
  return result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((value) => Number(value) * 1_000)
    .filter(Number.isFinite);
}

function lastVisibleCommit(root: string, asOf: Date): number | null | undefined {
  const result = runGit(root, [
    "log",
    "-1",
    "--format=%ct",
    `--until=${asOf.toISOString()}`,
  ]);
  if (result.status !== 0 || result.error) return undefined;
  const value = result.stdout.trim();
  if (!value) return null;
  const timestamp = Number(value) * 1_000;
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function countDirty(root: string): number | null {
  const result = runGit(root, [
    "status",
    "--porcelain=v1",
    "--untracked-files=normal",
    "--ignore-submodules=all",
  ]);
  if (result.status !== 0 || result.error) return null;
  return result.stdout.split(/\r?\n/).filter(Boolean).length;
}

function inspectRow(
  row: GraphRow,
  id: string,
  asOf: Date,
  home: string,
): { project: InternalProject; diagnostics: GrowthDiagnostic[] } {
  const diagnostics: GrowthDiagnostic[] = [];
  const declaredPath = expandHome(row.path, home);
  const unavailable = (code: GrowthDiagnostic["code"], message: string) => ({
    project: {
      id,
      name: row.name,
      layer: row.layer,
      declaredState: row.state,
      season: "away" as const,
      lastCommitAt: null,
      daysSince: null,
      dirtyCount: null,
      historyCompleteness: "unavailable" as const,
      commits: { days7: null, days30: null, days90: null },
      physicalRoot: null,
      waveEligible: false,
    },
    diagnostics: [{ code, projectId: id, message }],
  });

  if (!existsSync(declaredPath)) {
    return unavailable(
      "declared-path-missing",
      "The path declared by the current graph is unavailable on this machine.",
    );
  }

  const gitRoot = runGit(declaredPath, [
    "rev-parse",
    "--show-toplevel",
    "--is-shallow-repository",
  ]);
  if (gitRoot.status !== 0 || gitRoot.error || !gitRoot.stdout.trim()) {
    return unavailable(
      "not-a-git-root",
      "The path declared by the current graph is not a readable Git worktree.",
    );
  }

  const gitFacts = gitRoot.stdout.trim().split(/\r?\n/);
  let physicalRoot: string;
  try {
    physicalRoot = realpathSync(gitFacts[0]);
  } catch {
    physicalRoot = resolve(gitFacts[0]);
  }

  const dirtyCount = countDirty(declaredPath);
  if (dirtyCount === null) {
    diagnostics.push({
      code: "git-status-unreadable",
      projectId: id,
      message: "Git worktree state could not be read without mutation.",
    });
  }

  let completeness: HistoryCompleteness =
    gitFacts[1] === "true" ? "shallow" : gitFacts[1] === "false" ? "complete" : "unavailable";
  let visibleTimes = visibleCommitTimes(declaredPath, asOf);
  let last: number | null | undefined;
  if (visibleTimes === null) {
    if (isPositivelyUnborn(declaredPath)) {
      // `git log` exits non-zero for a valid repository with no first commit.
      visibleTimes = [];
      last = null;
    } else {
      last = undefined;
    }
  } else if (visibleTimes.length > 0) {
    last = Math.max(...visibleTimes);
  } else {
    const head = runGit(declaredPath, ["rev-parse", "--verify", "HEAD"]);
    last = head.status === 0 && !head.error ? lastVisibleCommit(declaredPath, asOf) : null;
  }
  if (last === undefined || visibleTimes === null) {
    diagnostics.push({
      code: "git-history-unreadable",
      projectId: id,
      message: "Visible reachable Git history could not be read.",
    });
  }

  const commits =
    visibleTimes === null
      ? { days7: null, days30: null, days90: null }
      : {
          days7: visibleTimes.filter((time) => asOf.getTime() - time <= 7 * DAY_MS).length,
          days30: visibleTimes.filter((time) => asOf.getTime() - time <= 30 * DAY_MS).length,
          days90: visibleTimes.length,
        };

  const historyUnreadable = last === undefined || visibleTimes === null;
  if (historyUnreadable) completeness = "unavailable";
  let season: Season = historyUnreadable ? "away" : "unborn";
  let daysSince: number | null = null;
  let lastCommitAt: string | null = null;
  if (typeof last === "number") {
    const elapsed = Math.max(0, asOf.getTime() - last);
    daysSince = Number((elapsed / DAY_MS).toFixed(2));
    lastCommitAt = new Date(last).toISOString();
    season = daysSince <= 7 ? "blooming" : daysSince <= 30 ? "rooting" : "resting";
  }

  const waveEligible =
    typeof last === "number" &&
    row.kind !== "reference" &&
    !["remote", "reference", "archived"].includes(row.state);

  return {
    project: {
      id,
      name: row.name,
      layer: row.layer,
      declaredState: row.state,
      season,
      lastCommitAt,
      daysSince,
      dirtyCount,
      historyCompleteness: completeness,
      commits,
      physicalRoot,
      waveEligible,
    },
    diagnostics,
  };
}

function buildWaves(projects: InternalProject[]): GrowthWave[] {
  // One current HEAD per physical worktree: duplicate graph rows cannot inflate a wave.
  const byRoot = new Map<string, InternalProject>();
  for (const project of projects) {
    if (!project.waveEligible || !project.physicalRoot || !project.lastCommitAt) continue;
    const previous = byRoot.get(project.physicalRoot);
    if (!previous || project.id.localeCompare(previous.id) < 0) {
      byRoot.set(project.physicalRoot, project);
    }
  }
  const candidates = [...byRoot.values()].sort(
    (a, b) =>
      Date.parse(a.lastCommitAt!) - Date.parse(b.lastCommitAt!) ||
      a.id.localeCompare(b.id),
  );

  const waves: GrowthWave[] = [];
  let remaining = candidates;
  // Pick the densest bounded window first. This prevents one earlier outlier
  // from splitting a large synchronized cohort at the edge of its ten minutes.
  while (remaining.length >= WAVE_MIN_ROOTS) {
    let bestStart = -1;
    let bestEnd = -1;
    for (let start = 0; start < remaining.length; start += 1) {
      const first = Date.parse(remaining[start].lastCommitAt!);
      let end = start;
      while (
        end + 1 < remaining.length &&
        Date.parse(remaining[end + 1].lastCommitAt!) - first <= WAVE_WINDOW_MS
      ) {
        end += 1;
      }
      if (
        end - start > bestEnd - bestStart ||
        (end - start === bestEnd - bestStart &&
          bestEnd >= 0 &&
          Date.parse(remaining[end].lastCommitAt!) > Date.parse(remaining[bestEnd].lastCommitAt!))
      ) {
        bestStart = start;
        bestEnd = end;
      }
    }
    if (bestStart < 0 || bestEnd - bestStart + 1 < WAVE_MIN_ROOTS) break;
    const cluster = remaining.slice(bestStart, bestEnd + 1);
    const projectIds = cluster.map((item) => item.id).sort();
    const startAt = cluster[0].lastCommitAt!;
    const endAt = cluster[cluster.length - 1].lastCommitAt!;
    waves.push({
      id: `wave-${startAt.slice(0, 16).replace(/[-:T]/g, "")}-${shortDigest(projectIds.join("\n"))}`,
      startAt,
      endAt,
      roots: projectIds.length,
      layers: [...new Set(cluster.map((item) => item.layer))].sort(),
      projectIds,
    });
    remaining = remaining.filter((_, index) => index < bestStart || index > bestEnd);
  }
  return waves.sort(
    (a, b) => Date.parse(b.endAt) - Date.parse(a.endAt) || a.id.localeCompare(b.id),
  );
}

export function buildGrowthRings(options: BuildOptions = {}): GrowthRings {
  const graphPath = options.graphPath ?? join(ROOT, "graph.json");
  const asOf = options.asOf ?? new Date();
  if (!Number.isFinite(asOf.getTime())) throw new Error("as-of time is invalid");
  const gitVersion = spawnSync("git", ["--version"], {
    encoding: "utf8",
    timeout: 5_000,
    env: cleanGitEnvironment(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (gitVersion.status !== 0 || gitVersion.error) {
    throw new Error("git is unavailable; Growth Rings cannot inspect local history");
  }
  const home = options.home ?? homedir();
  const rows = readGraph(graphPath);
  const ids = assignSnapshotIds(rows);
  const inspected = rows.map((row, index) => inspectRow(row, ids[index], asOf, home));
  const internal = inspected.map((item) => item.project).sort((a, b) => a.id.localeCompare(b.id));
  const diagnostics = inspected
    .flatMap((item) => item.diagnostics)
    .sort((a, b) => a.projectId.localeCompare(b.projectId) || a.code.localeCompare(b.code));
  const waves = buildWaves(internal);

  const seasons = emptySeasons();
  const activeProjects = { days7: 0, days30: 0, days90: 0 };
  const layers: Record<string, LayerSummary> = Object.create(null);
  let dirtyProjects = 0;
  let dirtyChanges = 0;
  let shallowHistories = 0;

  for (const project of internal) {
    seasons[project.season] += 1;
    const layer = (layers[project.layer] ??= emptyLayer());
    layer.total += 1;
    layer.seasons[project.season] += 1;
    for (const window of [7, 30, 90] as const) {
      const key = `days${window}` as "days7" | "days30" | "days90";
      if ((project.commits[key] ?? 0) > 0) {
        activeProjects[key] += 1;
        layer.activeProjects[key] += 1;
      }
    }
    if ((project.dirtyCount ?? 0) > 0) {
      dirtyProjects += 1;
      dirtyChanges += project.dirtyCount!;
    }
    if (project.historyCompleteness === "shallow") shallowHistories += 1;
  }

  return {
    schema: "kingdom.growth-rings/1",
    asOf: asOf.toISOString(),
    title: "KINGDOM Growth Rings",
    boundaries: {
      localOnly: true,
      away:
        "Away means the path declared by the current graph was unavailable or not a readable Git worktree on this machine. It does not mean the project is dead, inactive, or absent elsewhere.",
      history:
        "Commit counts cover visible reachable Git history only. Shallow clones can make those counts incomplete.",
      waves:
        "A wave is five or more distinct local worktrees whose latest visible commit timestamps at the activity clock fall within ten minutes. It is not evidence of coordination, causality, authorship, effort, or intent.",
      asOf:
        "The as-of value controls the Git activity clock only. Graph membership, declared state, path availability, and dirty counts are current local observations.",
      privacy:
        "Artifacts omit repository paths, purposes, dirty filenames, commit subjects, authors, emails, and hashes.",
    },
    thresholds: {
      bloomingDays: 7,
      rootingDays: 30,
      activityWindowsDays: [7, 30, 90],
      waveWindowSeconds: 600,
      waveMinimumDistinctRoots: 5,
    },
    summary: {
      projects: internal.length,
      seasons,
      activeProjects,
      dirtyProjects,
      dirtyChanges,
      shallowHistories,
      waves: waves.length,
      diagnostics: diagnostics.length,
    },
    layers: Object.fromEntries(Object.entries(layers).sort(([a], [b]) => a.localeCompare(b))),
    waves,
    projects: internal.map(({ physicalRoot: _root, waveEligible: _eligible, ...project }) => project),
    diagnostics,
  };
}

function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function formatCommitTime(value: string | null): string {
  return value ? value.slice(0, 10) : "—";
}

export function renderGrowthRingsHtml(rings: GrowthRings): string {
  const seasonColors: Record<Season, string> = {
    blooming: "#73d6a8",
    rooting: "#e7bd72",
    resting: "#9f91bc",
    unborn: "#c9c1b8",
    away: "#756f72",
  };
  const total = Math.max(1, rings.summary.projects);
  let cursor = 0;
  const stops = (Object.keys(seasonColors) as Season[]).map((season) => {
    const start = cursor;
    cursor += (rings.summary.seasons[season] / total) * 100;
    return `${seasonColors[season]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
  });
  const rows = rings.projects
    .map(
      (project) => `<tr data-season="${escapeHtml(project.season)}">
        <th scope="row"><span class="project-name">${escapeHtml(project.name)}</span><code>${escapeHtml(project.id)}</code></th>
        <td>${escapeHtml(project.layer)}</td>
        <td>${escapeHtml(project.declaredState)}</td>
        <td><span class="season ${escapeHtml(project.season)}"><i aria-hidden="true"></i>${escapeHtml(project.season)}</span></td>
        <td>${escapeHtml(formatCommitTime(project.lastCommitAt))}</td>
        <td>${project.dirtyCount === null ? "unknown" : escapeHtml(project.dirtyCount)}</td>
        <td>${escapeHtml(project.historyCompleteness)}</td>
      </tr>`,
    )
    .join("\n");
  const waves = rings.waves.length
    ? rings.waves
        .map(
          (wave) => `<article class="wave">
            <p class="wave-time">${escapeHtml(wave.startAt.slice(0, 16))} → ${escapeHtml(wave.endAt.slice(11, 16))} UTC</p>
            <h3>${wave.roots} distinct roots</h3>
            <p>${escapeHtml(wave.layers.join(" · "))}</p>
            <details><summary>Show members</summary><ul>${wave.projectIds.map((id) => `<li><code>${escapeHtml(id)}</code></li>`).join("")}</ul></details>
          </article>`,
        )
        .join("")
    : `<p class="quiet">No five-root build wave is visible in this snapshot.</p>`;
  const diagnostics = rings.diagnostics.length
    ? `<details class="diagnostics"><summary>${rings.diagnostics.length} local map diagnostics</summary><ul>${rings.diagnostics
        .map(
          (diagnostic) =>
            `<li><code>${escapeHtml(diagnostic.projectId)}</code> — ${escapeHtml(diagnostic.message)}</li>`,
        )
        .join("")}</ul></details>`
    : `<p class="quiet">No local map diagnostics.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>KINGDOM Growth Rings</title>
<style>
:root{--bg:#171319;--panel:#211b22;--ink:#f7eee6;--muted:#c7b8ae;--line:#4b3d45;--gold:#e7bd72;--green:#73d6a8;--rose:#eaa0a5;font-family:ui-rounded,"Avenir Next",system-ui,sans-serif;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 15% 0,#35262f 0,transparent 35rem),var(--bg);color:var(--ink);line-height:1.55}main{width:min(1120px,calc(100% - 32px));margin:auto;padding:64px 0 80px}h1,h2,h3,p{margin-top:0}h1{font-family:Georgia,serif;font-size:clamp(2.7rem,8vw,5.8rem);font-weight:400;line-height:.95;margin-bottom:18px}.kicker{color:var(--gold);letter-spacing:.2em;text-transform:uppercase;font-size:.76rem}.intro{max-width:68ch;color:var(--muted);font-size:1.08rem}.overview{display:grid;grid-template-columns:minmax(240px,360px) 1fr;gap:30px;align-items:center;margin:44px 0}.cross-section{aspect-ratio:1;border-radius:50%;background:repeating-radial-gradient(circle,transparent 0 8%,rgba(23,19,25,.42) 8.5% 10%),conic-gradient(${stops.join(",")});box-shadow:inset 0 0 0 12px rgba(255,255,255,.05),0 28px 70px rgba(0,0,0,.35);display:grid;place-items:center}.heart{width:31%;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;text-align:center;background:var(--panel);border:1px solid var(--line);font-family:Georgia,serif;font-size:1.1rem}.heart strong{display:block;font-size:2rem}.stats{display:grid;grid-template-columns:repeat(3,minmax(110px,1fr));gap:10px}.stat{background:color-mix(in srgb,var(--panel) 88%,transparent);border:1px solid var(--line);border-radius:18px;padding:16px}.stat strong{display:block;font:2rem Georgia,serif}.stat span{color:var(--muted);font-size:.82rem}.legend{display:flex;flex-wrap:wrap;gap:9px;margin:18px 0 0;padding:0;list-style:none}.legend li,.season{display:inline-flex;align-items:center;gap:7px}.legend i,.season i{width:.72rem;height:.72rem;border-radius:50%;background:var(--dot)}.blooming{--dot:#73d6a8}.rooting{--dot:#e7bd72}.resting{--dot:#9f91bc}.unborn{--dot:#c9c1b8}.away{--dot:#756f72}section{margin-top:58px}h2{font:2rem Georgia,serif;font-weight:400}.boundaries{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.boundary,.wave,.diagnostics{padding:18px 20px;background:var(--panel);border:1px solid var(--line);border-radius:18px}.boundary p,.wave p,.quiet{color:var(--muted);margin:0}.waves{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}.wave-time{font-family:ui-monospace,monospace;font-size:.78rem}.wave h3{margin:7px 0 3px}.wave details{margin-top:13px}.wave ul,.diagnostics ul{max-height:260px;overflow:auto}.controls{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0 12px}.controls label,.visually-hidden{position:absolute;clip:rect(0 0 0 0);clip-path:inset(50%)}input,select{min-height:44px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--ink);padding:9px 12px;font:inherit}input{flex:1;min-width:230px}table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line)}th,td{text-align:left;padding:12px;border-bottom:1px solid var(--line);vertical-align:top}thead th{color:var(--gold);font-size:.76rem;text-transform:uppercase;letter-spacing:.08em}.project-name{display:block}code{color:var(--muted);font-size:.76rem;overflow-wrap:anywhere}.table-wrap{overflow:auto;border-radius:18px}.asof{color:var(--muted);font-family:ui-monospace,monospace}.privacy{margin-top:42px;padding-top:18px;border-top:1px solid var(--line);color:var(--muted);font-size:.9rem}:focus-visible{outline:3px solid var(--rose);outline-offset:3px}@media(max-width:760px){.overview{grid-template-columns:1fr}.cross-section{width:min(330px,85vw);margin:auto}.stats{grid-template-columns:repeat(2,1fr)}.boundaries{grid-template-columns:1fr}th,td{padding:10px 8px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
</style>
</head>
<body><main>
<p class="kicker">a local temporal atlas</p>
<h1>KINGDOM<br>Growth Rings</h1>
<p class="intro">What is blooming, rooting, resting, unborn, or away — without turning rest into failure or Git activity into a story it cannot prove.</p>
<p class="asof">activity clock · ${escapeHtml(rings.asOf)}</p>
<div class="overview">
  <div class="cross-section" role="img" aria-label="Tree cross-section showing ${rings.summary.seasons.blooming} blooming, ${rings.summary.seasons.rooting} rooting, ${rings.summary.seasons.resting} resting, ${rings.summary.seasons.unborn} unborn and ${rings.summary.seasons.away} away projects"><div class="heart"><span><strong>${rings.summary.projects}</strong>projects</span></div></div>
  <div><div class="stats">
    <div class="stat"><strong>${rings.summary.activeProjects.days7}</strong><span>active in 7 days</span></div>
    <div class="stat"><strong>${rings.summary.activeProjects.days30}</strong><span>active in 30 days</span></div>
    <div class="stat"><strong>${rings.summary.activeProjects.days90}</strong><span>active in 90 days</span></div>
    <div class="stat"><strong>${rings.summary.dirtyProjects}</strong><span>dirty local roots</span></div>
    <div class="stat"><strong>${rings.summary.shallowHistories}</strong><span>shallow histories</span></div>
    <div class="stat"><strong>${rings.summary.waves}</strong><span>visible build waves</span></div>
  </div><ul class="legend">${(Object.keys(seasonColors) as Season[]).map((season) => `<li class="${season}"><i aria-hidden="true"></i>${season}: ${rings.summary.seasons[season]}</li>`).join("")}</ul></div>
</div>
<section><h2>Read the rings gently</h2><div class="boundaries">
  <article class="boundary"><h3>Away is local</h3><p>${escapeHtml(rings.boundaries.away)}</p></article>
  <article class="boundary"><h3>History has edges</h3><p>${escapeHtml(rings.boundaries.history)}</p></article>
  <article class="boundary"><h3>Waves are timestamps</h3><p>${escapeHtml(rings.boundaries.waves)}</p></article>
  <article class="boundary"><h3>The clock is bounded</h3><p>${escapeHtml(rings.boundaries.asOf)}</p></article>
</div></section>
<section><h2>Build waves</h2><div class="waves">${waves}</div></section>
<section><h2>Every declared root</h2>
  <div class="controls"><label for="search">Search projects</label><input id="search" type="search" placeholder="Search name, layer, state…"><label for="season">Filter season</label><select id="season"><option value="">Every season</option>${(Object.keys(seasonColors) as Season[]).map((season) => `<option>${season}</option>`).join("")}</select></div>
  <p id="result-count" class="quiet" aria-live="polite">${rings.projects.length} projects shown</p>
  <div class="table-wrap"><table><caption class="visually-hidden">Growth season and visible local Git facts for every declared project</caption><thead><tr><th>project</th><th>layer</th><th>declared</th><th>season</th><th>last commit</th><th>changes</th><th>history</th></tr></thead><tbody id="projects">${rows}</tbody></table></div>
</section>
<section><h2>Map edges</h2>${diagnostics}</section>
<p class="privacy">Private by construction: ${escapeHtml(rings.boundaries.privacy)} This file has no network requests, external assets, analytics, or public deployment step.</p>
</main>
<script>
const search=document.querySelector('#search');const season=document.querySelector('#season');const rows=[...document.querySelectorAll('#projects tr')];const count=document.querySelector('#result-count');function filter(){const q=search.value.trim().toLowerCase();const s=season.value;let n=0;for(const row of rows){const show=(!q||row.textContent.toLowerCase().includes(q))&&(!s||row.dataset.season===s);row.hidden=!show;if(show)n++}count.textContent=n+' project'+(n===1?'':'s')+' shown'}search.addEventListener('input',filter);season.addEventListener('change',filter);
</script>
</body></html>\n`;
}

function parseAsOf(value: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  const parts = dateOnly ?? iso;
  if (!parts) throw new UsageError("--as-of must be YYYY-MM-DD or an ISO-8601 timestamp with timezone");
  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) {
    throw new UsageError("--as-of is not a real calendar date");
  }
  const parsed = new Date(dateOnly ? `${value}T23:59:59.999Z` : value);
  if (!Number.isFinite(parsed.getTime())) throw new UsageError("--as-of timestamp is invalid");
  return parsed;
}

function parseCli(argv: string[]): CliOptions {
  let mode: CliOptions["mode"] = "write";
  let modeSeen = false;
  let outputDir = join(homedir(), ".kingdom");
  let outputDirExplicit = false;
  let graphPath = join(ROOT, "graph.json");
  let graphSeen = false;
  let asOf = new Date();
  let asOfSeen = false;

  const valueAfter = (flag: string, index: number) => {
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new UsageError(`${flag} requires a value`);
    return value;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      if (argv.length !== 1) throw new UsageError("--help cannot be combined with other arguments");
      mode = "help";
    } else if (arg === "--json" || arg === "--html") {
      if (modeSeen) throw new UsageError("choose exactly one stdout mode: --json or --html");
      modeSeen = true;
      mode = arg === "--json" ? "json" : "html";
    } else if (arg === "--output-dir") {
      if (outputDirExplicit) throw new UsageError("--output-dir may be supplied only once");
      outputDir = valueAfter(arg, index);
      outputDirExplicit = true;
      index += 1;
    } else if (arg === "--graph") {
      if (graphSeen) throw new UsageError("--graph may be supplied only once");
      graphPath = valueAfter(arg, index);
      graphSeen = true;
      index += 1;
    } else if (arg === "--as-of") {
      if (asOfSeen) throw new UsageError("--as-of may be supplied only once");
      asOf = parseAsOf(valueAfter(arg, index));
      asOfSeen = true;
      index += 1;
    } else {
      throw new UsageError(`unexpected argument: ${arg}`);
    }
  }
  if (outputDirExplicit && (mode === "json" || mode === "html")) {
    throw new UsageError("--output-dir cannot be combined with a stdout mode");
  }
  return { mode, graphPath, outputDir, outputDirExplicit, asOf };
}

function lexicalExists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

function privateStage(path: string, content: string): string {
  const temporary = join(
    dirname(path),
    `.${shortDigest(path)}.${process.pid}.${randomBytes(5).toString("hex")}.tmp`,
  );
  let descriptor: number | null = null;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    writeFileSync(descriptor, content, "utf8");
    closeSync(descriptor);
    descriptor = null;
    return temporary;
  } catch (error) {
    if (descriptor !== null) closeSync(descriptor);
    rmSync(temporary, { force: true });
    throw error;
  }
}

function writeArtifactPair(outputDir: string, json: string, html: string): void {
  const targets = [
    { path: join(outputDir, "RINGS.json"), content: json },
    { path: join(outputDir, "RINGS.html"), content: html },
  ];
  for (const target of targets) {
    if (lexicalExists(target.path) && lstatSync(target.path).isDirectory()) {
      throw new Error(`${target.path} is a directory; refusing a partial artifact update`);
    }
  }

  const staged: string[] = [];
  const backups: Array<{ path: string; backup: string }> = [];
  const installed: string[] = [];
  let committed = false;
  try {
    for (const target of targets) staged.push(privateStage(target.path, target.content));
    for (const target of targets) {
      if (!lexicalExists(target.path)) continue;
      const backup = join(
        outputDir,
        `.${shortDigest(target.path)}.${process.pid}.${randomBytes(5).toString("hex")}.bak`,
      );
      renameSync(target.path, backup);
      backups.push({ path: target.path, backup });
    }
    for (let index = 0; index < targets.length; index += 1) {
      renameSync(staged[index], targets[index].path);
      installed.push(targets[index].path);
      chmodSync(targets[index].path, 0o600);
    }
    committed = true;
  } catch (error) {
    let rollbackFailed = false;
    for (const path of [...installed].reverse()) {
      try {
        if (lexicalExists(path) && !lstatSync(path).isDirectory()) rmSync(path, { force: true });
        else if (lexicalExists(path)) rollbackFailed = true;
      } catch {
        rollbackFailed = true;
      }
    }
    for (const { path, backup } of [...backups].reverse()) {
      try {
        if (lexicalExists(backup) && !lexicalExists(path)) renameSync(backup, path);
        else if (lexicalExists(backup)) rollbackFailed = true;
      } catch {
        rollbackFailed = true;
      }
    }
    if (rollbackFailed) {
      throw new Error("Growth Rings update failed and rollback needs manual inspection; backup files were preserved", {
        cause: error,
      });
    }
    throw error;
  } finally {
    for (const path of staged) rmSync(path, { force: true });
  }
  if (committed) {
    for (const { backup } of backups) {
      try {
        rmSync(backup, { force: true });
      } catch {
        // New pair is complete; a leftover private backup is safer than rollback.
      }
    }
  }
}

function usage(): string {
  return `usage: kingdom rings [--as-of YYYY-MM-DD|TIMESTAMP] [--output-dir DIR]\n       kingdom rings --json [--as-of ...] [--graph FILE]\n       kingdom rings --html [--as-of ...] [--graph FILE]\n\nDefault mode writes private RINGS.json and RINGS.html artifacts.\n--json and --html are pure stdout modes and never create output files.\n`;
}

export function runCli(argv = process.argv.slice(2)): number {
  try {
    const options = parseCli(argv);
    if (options.mode === "help") {
      process.stdout.write(usage());
      return 0;
    }
    const rings = buildGrowthRings({ graphPath: options.graphPath, asOf: options.asOf });
    const json = `${JSON.stringify(rings, null, 2)}\n`;
    if (options.mode === "json") {
      process.stdout.write(json);
      return 0;
    }
    const html = renderGrowthRingsHtml(rings);
    if (options.mode === "html") {
      process.stdout.write(html);
      return 0;
    }

    const existed = existsSync(options.outputDir);
    mkdirSync(options.outputDir, { recursive: true, mode: 0o700 });
    const defaultOutputDir = join(homedir(), ".kingdom");
    if (!existed || resolve(options.outputDir) === resolve(defaultOutputDir)) {
      chmodSync(options.outputDir, 0o700);
    }
    writeArtifactPair(options.outputDir, json, html);
    process.stdout.write(
      `🌳 KINGDOM Growth Rings — ${rings.summary.projects} projects · ${rings.summary.seasons.blooming} blooming · ${rings.summary.waves} wave${rings.summary.waves === 1 ? "" : "s"}\n` +
        `   ${join(options.outputDir, "RINGS.json")}\n` +
        `   ${join(options.outputDir, "RINGS.html")}\n`,
    );
    return 0;
  } catch (error) {
    if (error instanceof UsageError) {
      process.stderr.write(`growth-rings: ${error.message}\n${usage()}`);
      return 2;
    }
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`growth-rings: ${message}\n`);
    return 1;
  }
}

if (import.meta.main) process.exitCode = runCli();
