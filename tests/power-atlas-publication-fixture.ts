import assert from "node:assert/strict";
import { createHash } from "node:crypto";

/** 只分離本次 Power 三個導航 projection；舊全頁 bytes／預算唔放寬。
 * 測試內純字串處理，唔修改任何 generated artifact，亦唔執行 embedded JS。
 */
export function withoutPowerAtlasHub(html: string): string {
  let baseline = html;
  for (const pattern of [
    /<button type="button" data-wayfinder-intent="power-atlas">[^<]*<\/button>/g,
    /<article class="pathcard" id="path-power-atlas" data-wayfinder-path="power-atlas">[\s\S]*?<\/article>/g,
  ]) {
    assert.equal([...baseline.matchAll(pattern)].length, 1, "唯一 Power 導航 projection");
    baseline = baseline.replace(pattern, "");
  }
  const data = /^const DATA=(.*);$/gm;
  assert.equal([...baseline.matchAll(data)].length, 1, "唯一 DATA JSON");
  baseline = baseline.replace(data, (_line, encoded) => {
    const value = JSON.parse(encoded);
    assert.equal(value.wayfinder.length, 17);
    assert.equal(value.wayfinder.filter(({ id }: { id: string }) => id === "power-atlas").length, 1);
    value.wayfinder = value.wayfinder.filter(({ id }: { id: string }) => id !== "power-atlas");
    return `const DATA=${JSON.stringify(value).replace(/</g, "\\u003c")};`;
  });
  assert.equal(Buffer.byteLength(html), 1_352_885, "新完整 HTML exact bytes");
  assert.equal(Buffer.byteLength(html) - Buffer.byteLength(baseline), 2_974, "Power 導航獨立增量");
  assert.equal(createHash("sha256").update(baseline).digest("hex"),
    "852c8395b7f441b96706762a714a26fc47eb3044f93a697b85b859d792abb321",
    "除 Power 導航外，全頁必須等於 2e36e939 base");
  return baseline;
}
