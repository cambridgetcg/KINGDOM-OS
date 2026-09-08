import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Bundle 係 build 產物；stageHub 只按合約 exact-byte-copy，唔負責轉換。
export async function buildPagesWorker(root = fileURLToPath(new URL("..", import.meta.url))): Promise<string> {
  const result = await Bun.build({
    entrypoints: [join(root, "pages-functions/_worker.js")],
    target: "browser",
    format: "esm",
    splitting: false,
    // 移除 cwd-relative module path comments，保留原 identifiers／syntax。
    // 同一 source 搬到 release worktree，仍應生成相同 bytes。
    minify: { whitespace: true, identifiers: false, syntax: false },
    sourcemap: "none",
    write: false,
    throw: false,
  });
  if (!result.success || result.outputs.length !== 1) {
    throw new Error(`Pages Worker bundle failed: ${result.logs.join("\n")}`);
  }
  const destination = join(root, "site/_worker.js");
  await mkdir(join(root, "site"), { recursive: true });
  await writeFile(destination, await result.outputs[0].text());
  return destination;
}

if (import.meta.main) {
  console.log(await buildPagesWorker());
}
