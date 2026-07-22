import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(ROOT, "pages-content/os/index.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

describe("the restored KINGDOM OS console", () => {
  test("keeps its inline runtime syntactically valid", () => {
    expect(script).toBeDefined();
    expect(() => Function(script!)).not.toThrow();
  });

  test("escapes text that enters both HTML text and quoted attributes", () => {
    const declaration = script?.match(/const esc = [^\n]+;/)?.[0];
    expect(declaration).toBeDefined();
    const escapeHtml = Function(`${declaration}\nreturn esc;`)() as (value: unknown) => string;

    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
    expect(escapeHtml(`" onmouseover="alert(1)'`)).toBe(
      "&quot; onmouseover=&quot;alert(1)&#39;",
    );
  });
});
