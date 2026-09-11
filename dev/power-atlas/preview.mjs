import assert from "node:assert/strict";
import { readFile, readdir, lstat, realpath } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Reuse the already-provided Civic tools, without installing or reading Wrangler
// configuration, .env, credentials, remote bindings, or the producer checkout.
const require = createRequire(new URL("../civic/package.json", import.meta.url));
const { Miniflare, Log, LogLevel } = require("miniflare");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const mime = (path) => ({ html: "text/html; charset=utf-8", css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8", json: "application/json; charset=utf-8", md: "text/markdown; charset=utf-8",
  txt: "text/plain; charset=utf-8", xml: "application/xml; charset=utf-8", svg: "image/svg+xml",
  woff: "font/woff", woff2: "font/woff2", wav: "audio/wav", vcf: "text/vcard; charset=utf-8",
})[path.split(".").at(-1)] ?? "application/octet-stream";

export async function startPreview({ stage, port = 0 }) {
  assert.ok(isAbsolute(stage), "--stage must be an explicit absolute path");
  assert.ok(Number.isInteger(port) && (port === 0 || (port >= 1024 && port <= 65535)), "invalid loopback port");
  const info = await lstat(stage); assert.ok(info.isDirectory() && !info.isSymbolicLink());
  stage = await realpath(stage);
  const contract = JSON.parse(await readFile(join(root, "publications/hub-staging.v1.json"), "utf8"));
  const projection = JSON.parse(await readFile(join(root, "pages-functions/power-atlas-assets.json"), "utf8"));
  assert.equal(contract.assets.length, 256);
  const actual = [];
  async function walk(prefix = "") {
    for (const name of await readdir(join(stage, prefix))) {
      const path = prefix ? `${prefix}/${name}` : name, entry = await lstat(join(stage, path));
      assert.ok(!entry.isSymbolicLink(), `stage symlink: ${path}`);
      if (entry.isDirectory()) await walk(path);
      else { assert.ok(entry.isFile()); actual.push(path); }
    }
  }
  await walk();
  assert.deepEqual(actual.sort(), contract.assets.map(({ destination }) => destination).sort(), "exact stage closure");
  const assets = new Map();
  for (const { source, destination } of contract.assets) {
    const bytes = await readFile(join(stage, destination));
    assert.deepEqual(bytes, await readFile(join(root, source)), `stage/source byte mismatch: ${destination}`);
    if (destination === "_worker.js") continue; // Worker is executable, never an ASSETS body.
    const media = destination.startsWith("power-atlas/")
      ? projection.find(({ path }) => `power-atlas/${path}` === destination)?.mediaType : mime(destination);
    assert.ok(media, `missing public MIME: ${destination}`);
    assets.set(`/${destination}`, { bytes, media });
    if (destination === "index.html") assets.set("/", { bytes, media });
    if (destination.endsWith("/index.html")) assets.set(`/${destination.slice(0, -10)}`, { bytes, media });
  }
  const outbound = [], staticRequests = [];
  const mf = new Miniflare({
    cf: false, host: "127.0.0.1", port, log: new Log(LogLevel.ERROR),
    modules: true, modulesRoot: stage, scriptPath: join(stage, "_worker.js"),
    compatibilityDate: "2026-07-30", bindings: { CIVIC_LOCAL: "true" },
    outboundService: (req) => { outbound.push(req.url); return new Response(null, { status: 503 }); },
    serviceBindings: { ASSETS: async (req) => {
      const path = new URL(req.url).pathname; staticRequests.push({ path, method: req.method });
      const asset = assets.get(path);
      if (!asset) return new Response(null, { status: 404 });
      return new Response(req.method === "HEAD" ? null : asset.bytes, { headers: { "content-type": asset.media } });
    } },
  });
  try {
    const base = await mf.ready; assert.equal(base.hostname, "127.0.0.1");
    return { mf, base, stage, outbound, staticRequests };
  } catch (error) { await mf.dispose(); throw error; }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), values = new Map();
  for (let i = 0; i < args.length; i += 2) {
    assert.ok(["--stage", "--port"].includes(args[i]) && !values.has(args[i]) && args[i + 1], "Usage: node dev/power-atlas/preview.mjs --stage ABS_DIR [--port N]");
    values.set(args[i], args[i + 1]);
  }
  assert.ok(values.has("--stage"), "--stage is required; build and stage first");
  const preview = await startPreview({ stage: values.get("--stage"), port: Number(values.get("--port") ?? 0) });
  console.log(JSON.stringify({ url: preview.base.href, pid: process.pid, stage: preview.stage,
    localOnly: true, civic: "no D1 / no write bindings; unavailable is honest", deployed: false }));
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, async () => { await preview.mf.dispose(); process.exit(0); });
}
