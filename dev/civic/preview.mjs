import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { devNull } from "node:os";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const wrangler = resolve(dirname(require.resolve("wrangler/package.json")), "bin/wrangler.js");
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`${name} 缺少值`);
  return args[index + 1];
};
for (let index = 0; index < args.length; index += 2) {
  if (!["--stage", "--state", "--port"].includes(args[index])) throw new Error("只接受 --stage、--state、--port");
}
const stage = resolve(option("--stage", resolve(root, ".civic-stage")));
const state = resolve(option("--state", resolve(root, ".wrangler/civic-local")));
const port = Number(option("--port", "8797"));
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("port 必須介乎 1024–65535");
if (!existsSync(resolve(stage, "_worker.js")) || !existsSync(resolve(stage, "index.html"))) {
  throw new Error("請先 build，再將 exact assets stage 到一個新空目錄；preview 唔會覆蓋舊 staging。");
}

// .dev.vars 會先於 process env；發現就停止，唔讀／覆蓋任何既有 secrets 檔。
if (readdirSync(here).some((name) => name === ".dev.vars" || name.startsWith(".dev.vars."))) {
  throw new Error("dev/civic 有 .dev.vars 檔；本工具只接受 memory-only 測試 secrets，未啟動。");
}
// 每次本地預覽嘅測試 secrets 只留喺 process memory；唔借用 production 登入或 secrets。
const env = Object.fromEntries(
  ["PATH", "HOME", "TMPDIR", "TEMP", "SYSTEMROOT"].filter((key) => process.env[key]).map((key) => [key, process.env[key]]),
);
Object.assign(env, {
  WRANGLER_SEND_METRICS: "false",
  // Wrangler 呢條路徑亦負責 process.env；--env-file 指向 devNull，唔載入 .env。
  CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "true",
  CIVIC_HMAC_SECRET: randomBytes(48).toString("base64url"),
  CIVIC_MODERATOR_SECRET: randomBytes(48).toString("base64url"),
});
let child;
const forwardSignal = (signal) => child?.kill(signal);
process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));
const run = (commandArgs) => new Promise((accept, reject) => {
  child = spawn(process.execPath, [wrangler, ...commandArgs, "--env-file", devNull], { cwd: here, env, stdio: "inherit" });
  child.once("error", reject);
  child.once("exit", (code, signal) => {
    child = undefined;
    if (signal) reject(new Error(`本地程序已停止：${signal}`));
    else if (code !== 0) reject(new Error(`本地 Wrangler exit ${code}`));
    else accept();
  });
});

await run(["d1", "migrations", "apply", "kingdom-civic-local", "--local", "--persist-to", state, "--config", resolve(here, "wrangler.jsonc")]);
console.log(`Civic 本地預覽：http://localhost:${port}（只用本地 D1；唔係 production）`);
await run(["pages", "dev", stage, "--ip", "127.0.0.1", "--port", String(port), "--persist-to", state, "--show-interactive-dev-session=false"]);
