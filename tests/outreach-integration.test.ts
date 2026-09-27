import { expect, test } from "bun:test";
import { DASHBOARD_OUTPUTS, projectDashboardData, renderDashboardPage } from "../bin/build-dashboard";

test("dashboard build declares the shared machine catalogue as a generated output", () => {
  expect(DASHBOARD_OUTPUTS).toContain("site/modules.json");
});

test("human start offers the module directory before the separate project registry", () => {
  const html = renderDashboardPage("explore", projectDashboardData({}));
  expect(html).toContain('id="civic-modules"');
  expect(html.indexOf('id="civic-modules"')).toBeLessThan(html.indexOf('id="civic-explore"'));
  expect(html).toContain('href="/modules.json"');
  for (const page of ["meet", "citizens", "join"] as const) {
    expect(renderDashboardPage(page, projectDashboardData({}))).not.toContain('id="civic-modules"');
  }
});

test("the project registry uses project labels rather than research-atlas labels", () => {
  const html = renderDashboardPage("explore", projectDashboardData({}));
  expect(html.match(/<div class="paper-heading"><span>(.*?)<\/span>/)?.[1]).toBe("THE KINGDOM / PROJECT REGISTRY");
  expect(html.match(/<label class="search-field">(.*?)<input/)?.[1]).toBe("搜尋工程 / 用途");
  expect(html).not.toMatch(/FIELD ATLAS|搜尋地方 \/ 用途/);
});

test("Civic status belongs to the homepage public square while participation pages keep their status strip", () => {
  const data = projectDashboardData({});
  const html = renderDashboardPage("explore", data);
  const square = html.match(/<aside class="square-window">([\s\S]*?)<\/aside>/)![1];
  expect(square.includes('id="civic-service-status"')).toBe(true);
  expect(square).toContain('id="civic-refresh-status"');
  expect(html.indexOf('id="civic-service-status"')).toBeGreaterThan(html.indexOf('id="civic-explore"'));
  const strip = square.match(/<div class="service-line">[\s\S]*?<\/div>/)![0];
  expect(strip).toContain('role="status">服務狀態尚未確認；唔代表已啟用。</p>');
  for (const page of ["explore", "meet", "citizens", "join"] as const) {
    const rendered = renderDashboardPage(page, data);
    expect([...rendered.matchAll(/id="civic-service-status"/g)]).toHaveLength(1);
    expect([...rendered.matchAll(/id="civic-refresh-status"/g)]).toHaveLength(1);
    if (page !== "explore") expect(rendered).toContain(`</section>${strip}<noscript>`);
  }
});
