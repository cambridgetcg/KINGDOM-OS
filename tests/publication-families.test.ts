import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import * as families from "../bin/publication-families.ts";
import * as legacy from "../bin/check-hub-live.ts";
import { HUB_ASSETS } from "../bin/stage-hub.ts";

const {
  PUBLICATION_FAMILIES,
  assertActivePublicationReviewWindow,
  assertPublicationFamilyReleaseWindows,
  destinationForPublicPath,
  publicationFamilyStates,
} = families;
const STAGED_DESTINATIONS = new Set(HUB_ASSETS.map(({ destination }) => destination));
// Synthetic 全 definitions fixture，唔重新 stage 已退役嘅 public routes。
const ALL_DESTINATIONS = new Set(PUBLICATION_FAMILIES.flatMap(({ routes }) => routes.map(destinationForPublicPath)));

function withoutFamilies(ids: readonly string[]): Set<string> {
  const retired = new Set(PUBLICATION_FAMILIES.filter(({ id }) => ids.includes(id))
    .flatMap(({ routes }) => routes.map(destinationForPublicPath)));
  return new Set([...ALL_DESTINATIONS].filter((destination) => !retired.has(destination)));
}

describe("共用 publication families", () => {
  test("35 個 families 嘅 routes、discovery、dependencies 同 policies 保持原值", () => {
    expect(PUBLICATION_FAMILIES).toHaveLength(35);
    expect(new Set(PUBLICATION_FAMILIES.map(({ id }) => id)).size).toBe(35);
    // 呢個 digest 喺抽取前由 pinned HEAD checker 嘅完整 family array 計出。
    expect(createHash("sha256").update(JSON.stringify(PUBLICATION_FAMILIES)).digest("hex"))
      .toBe("5c2b6618bfe662fba2d81f4b90742cfead7e06aa7e10041573f7747ce07e195e");
    const states = publicationFamilyStates(STAGED_DESTINATIONS);
    expect(states.size).toBe(35);
    expect([...states.values()].filter(({ active }) => active)).toHaveLength(33);
    const retired = ["uk-government-transformation-engine", "evaluation-covenant"];
    expect([...states.values()].filter(({ active }) => !active).map(({ family }) => family.id)).toEqual(retired);
    for (const family of PUBLICATION_FAMILIES) {
      expect(states.get(family.id)).toEqual({ family, active: !retired.includes(family.id) });
      for (const route of family.routes) {
        expect(STAGED_DESTINATIONS.has(destinationForPublicPath(route))).toBe(!retired.includes(family.id));
      }
    }
  });

  test("全部退役保留 35 個 inactive states；無關 destination 唔啟用 family", () => {
    for (const destinations of [new Set<string>(), new Set(["unrelated.txt"])]) {
      const states = publicationFamilyStates(destinations);
      expect(states.size).toBe(35);
      expect([...states.values()].every(({ active }) => !active)).toBe(true);
      expect(() => assertPublicationFamilyReleaseWindows(states, "2030-01-01")).not.toThrow();
    }
  });

  test("每個 family 缺任何一條 route 都拒絕 partial staging", () => {
    for (const family of PUBLICATION_FAMILIES) {
      for (const route of family.routes) {
        const destinations = new Set(ALL_DESTINATIONS);
        destinations.delete(destinationForPublicPath(route));
        expect(() => publicationFamilyStates(destinations))
          .toThrow(`${family.label} is partially staged`);
      }
    }
  });

  test("每條依賴都要 active，連鎖退役亦要移走所有 dependents", () => {
    for (const family of PUBLICATION_FAMILIES) {
      for (const dependencyId of family.dependsOn ?? []) {
        const dependency = PUBLICATION_FAMILIES.find(({ id }) => id === dependencyId)!;
        expect(() => publicationFamilyStates(withoutFamilies([dependencyId])))
          .toThrow(`${family.label} requires active ${dependency.label}`);
      }
    }
    for (const chain of [
      ["reality-influence-claim-graph", "civilisation-reality-projection", "civilisation-flow-nuance-atlas"],
      ["uk-government-engine", "uk-government-transformation-engine", "evaluation-covenant"],
    ]) {
      expect(() => publicationFamilyStates(withoutFamilies(chain.slice(0, 2))))
        .toThrow("requires active");
      const states = publicationFamilyStates(withoutFamilies(chain));
      for (const id of chain) expect(states.get(id)?.active).toBe(false);
      expect(states.get("contact-door")?.active).toBe(true);
    }
  });

  test("未知 dependency ID 會 fail closed；測試唔永久改 family policy", () => {
    const family = PUBLICATION_FAMILIES.find(({ id }) => id === "civilisation-flow-nuance-atlas")!;
    const original = family.dependsOn;
    try {
      family.dependsOn = ["unknown-fixture-family"];
      expect(() => publicationFamilyStates(ALL_DESTINATIONS))
        .toThrow(`${family.label} declares unknown publication dependency unknown-fixture-family`);
      expect(() => publicationFamilyStates(new Set())).not.toThrow();
    } finally {
      family.dependsOn = original;
    }
  });

  test("public page route 轉 index.html；root 同非 public path 拒絕", () => {
    expect(destinationForPublicPath("/contact/")).toBe("contact/index.html");
    expect(destinationForPublicPath("/contact.json")).toBe("contact.json");
    for (const path of ["/", "", "contact.json"]) {
      expect(() => destinationForPublicPath(path)).toThrow("publication route is not a staged path");
    }
  });

  test("checker 舊 exports 仍然係同一套 types、functions 同 array", () => {
    for (const name of Object.keys(families) as Array<keyof typeof families>) {
      expect(legacy[name]).toBe(families[name]);
    }
    const family: legacy.PublicationFamily = PUBLICATION_FAMILIES[0]!;
    const state: legacy.PublicationFamilyState = { family, active: true };
    expect(state.family).toBe(family);
  });
});

describe("既有 review windows", () => {
  test("截止日包含 UTC 當日；翌日 active 拒絕，inactive 唔被過期攔住", () => {
    for (const family of PUBLICATION_FAMILIES.filter(({ nextReviewDue }) => nextReviewDue)) {
      const due = family.nextReviewDue!;
      const day = new Date(`${due}T00:00:00Z`).getTime();
      for (const delta of [-1, 0, 1]) {
        const check = () => assertActivePublicationReviewWindow({
          active: true,
          checkedOn: new Date(day + delta * 86_400_000).toISOString().slice(0, 10),
          label: family.label,
          nextReviewDue: due,
        });
        if (delta <= 0) expect(check).not.toThrow();
        else expect(check).toThrow(`passed nextReviewDue ${due}`);
      }
      expect(() => assertActivePublicationReviewWindow({
        active: false, checkedOn: "2030-01-01", label: family.label, nextReviewDue: due,
      })).not.toThrow();
    }
  });

  test("錯誤日期同不存在嘅日子拒絕；有效 leap day 保留", () => {
    for (const active of [false, true]) {
      for (const date of ["", "2026-9-21", "2026-02-29", "2026-04-31", "2026-13-01", "2026-09-21T00:00:00Z"]) {
        expect(() => assertActivePublicationReviewWindow({
          active, checkedOn: date, label: "fixture", nextReviewDue: "2026-09-21",
        })).toThrow("requires real YYYY-MM-DD dates");
        expect(() => assertActivePublicationReviewWindow({
          active, checkedOn: "2026-09-21", label: "fixture", nextReviewDue: date,
        })).toThrow("requires real YYYY-MM-DD dates");
      }
    }
    expect(() => assertActivePublicationReviewWindow({
      active: true, checkedOn: "2024-02-29", label: "fixture", nextReviewDue: "2024-02-29",
    })).not.toThrow();
  });

  test("Transformation 同 Evaluation 到期各自拒絕；Government warning 唔變 hard gate", () => {
    expect(PUBLICATION_FAMILIES.filter(({ nextReviewDue }) => nextReviewDue)
      .map(({ id, nextReviewDue }) => [id, nextReviewDue])).toEqual([
      ["uk-government-transformation-engine", "2026-09-21"],
      ["evaluation-covenant", "2026-09-21"],
      ["shape-resonance-lab", "2027-08-26"],
    ]);
    const states = publicationFamilyStates(ALL_DESTINATIONS);
    for (const id of ["uk-government-transformation-engine", "evaluation-covenant"]) {
      expect(() => assertPublicationFamilyReleaseWindows(new Map([[id, states.get(id)!]]), "2026-09-22"))
        .toThrow("passed nextReviewDue 2026-09-21");
    }
    const current = publicationFamilyStates(STAGED_DESTINATIONS);
    expect(() => assertPublicationFamilyReleaseWindows(current, "2027-08-26")).not.toThrow();
    expect(() => assertPublicationFamilyReleaseWindows(current, "2027-08-27"))
      .toThrow("Shape & Resonance Lab 01 active publication passed nextReviewDue 2027-08-26");
    const noHardReview = new Map([...states].filter(([, { family }]) => !family.nextReviewDue));
    expect(noHardReview.get("uk-government-engine")?.active).toBe(true);
    expect(() => assertPublicationFamilyReleaseWindows(noHardReview, "2030-01-01")).not.toThrow();
  });
});

test("fresh import 無 network、publication read、寫入或 process；stager 唔拉入 checker", () => {
  const moduleUrl = new URL("../bin/publication-families.ts", import.meta.url).href;
  const stagerUrl = new URL("../bin/stage-hub.ts", import.meta.url).href;
  const checkerUrl = new URL("../bin/check-hub-live.ts", import.meta.url).href;
  const script = `
    import fs from "node:fs";
    import child from "node:child_process";
    import { mock } from "bun:test";
    const deny = () => { throw new Error("import 唔可以有副作用"); };
    mock.module(${JSON.stringify(checkerUrl)}, deny);
    const read = fs.readFileSync;
    let reads = 0;
    let importingStager = false;
    const fsMock = { ...fs, readFileSync: (path, ...args) => {
      if (!importingStager || !String(path).endsWith("/publications/hub-staging.v1.json")) deny();
      reads++;
      return read(path, ...args);
    } };
    for (const key of ["writeFileSync", "appendFileSync", "mkdirSync", "rmSync", "unlinkSync", "renameSync"]) fsMock[key] = deny;
    for (const key of ["lstatSync", "statSync", "realpathSync"]) fsMock[key] = (...args) => {
      if (!importingStager) deny();
      return fs[key](...args);
    };
    mock.module("node:fs", () => fsMock);
    const childMock = { ...child };
    for (const key of ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]) childMock[key] = deny;
    mock.module("node:child_process", () => childMock);
    globalThis.fetch = deny;
    globalThis.WebSocket = deny;
    for (const key of ["write", "file", "spawn", "spawnSync", "serve", "connect", "listen"]) Bun[key] = deny;
    const families = await import(${JSON.stringify(moduleUrl)});
    if (families.PUBLICATION_FAMILIES.length !== 35 || reads !== 0) deny();
    importingStager = true;
    const stager = await import(${JSON.stringify(stagerUrl)});
    if (stager.HUB_ASSETS.length !== 248 || reads !== 1) deny();
  `;
  const result = spawnSync(process.execPath, ["-e", script], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    encoding: "utf8",
    timeout: 30_000,
  });
  expect(result.error).toBeUndefined();
  expect(result.stderr).toBe("");
  expect(result.stdout).toBe("");
  expect(result.status).toBe(0);
});
