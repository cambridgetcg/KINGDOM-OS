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
