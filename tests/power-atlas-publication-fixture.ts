import assert from "node:assert/strict";
import { createHash } from "node:crypto";

/** 先鎖 2026-09-11 真 builder 嘅完整 raw SHA，再分離 Power 三個導航 projection
 * 同兩個確切 generated 日期位置；舊全頁 bytes／研究預算唔放寬。
 * 測試內純字串處理，唔修改任何 generated artifact，亦唔執行 embedded JS。
 */
export function withoutPowerAtlasHub(html: string): string {
  assert.equal(createHash("sha256").update(html).digest("hex"),
    "a51c65601c7beb0bcfc518f0904c8ae0aee8fb0049a82db7f6611d8f46b21f24",
    "已 review 2026-09-11 完整 HTML raw SHA；未知日期／文案一律拒絕");
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
  for (const currentLine of [
    '    <p class="sub">These public places responded when this atlas was made (2026-09-11). A resting door remains listed so absence is not mistaken for erasure.</p>\n',
    '    <span class="foothan">愛</span> · this atlas mirrors metadata declared by each project · 2026-09-11<br>\n',
  ]) {
    assert.equal(baseline.split(currentLine).length, 2, "唯一 exact generated 日期位置");
    baseline = baseline.replace(currentLine, currentLine.replace("2026-09-11", "2026-09-08"));
  }
  assert.equal(createHash("sha256").update(baseline).digest("hex"),
    "852c8395b7f441b96706762a714a26fc47eb3044f93a697b85b859d792abb321",
    "除 Power 導航同兩個已 review 日期外，全頁必須等於 2e36e939 base");
  return baseline;
}
