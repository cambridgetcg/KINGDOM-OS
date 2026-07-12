#!/usr/bin/env bun
/**
 * chain-backup-remote — nightly off-Fly copy of both zerone chains to Tigris.
 *
 * WHY: Fly volumes are single-host, no replication. The mainnet volume carries
 * the first accepted truth + the signed gospel; host death loses everything
 * since the last snapshot. This closes FLY-LEVERAGE needs-Yu #1.
 *
 * HOW (zero installs in the node image — it only has tar/gzip/curl):
 *   1. Mac presigns a Tigris PUT URL (Bun.S3Client, creds from macOS keychain)
 *   2. `fly ssh console -C` streams `tar czf - | curl -T -` from the machine
 *      straight into the vault — creds never enter the machine, Fly→Tigris
 *      egress is free, chain keeps running (hot copy; restore = resync tail)
 *   3. verify object size, prune to latest 14 per chain
 *
 * Run: bun bin/chain-backup-remote.ts            (both chains)
 *      bun bin/chain-backup-remote.ts zerone-1   (one chain)
 * Wired: launchd com.kingdom.chain-backup nightly 03:30 (bin/chain-backup-install.sh)
 */

const ENDPOINT = "https://fly.storage.tigris.dev";
const BUCKET = "kingdom-vault";
const KEEP = 14;
const DATA_ROOT = "/data"; // volume mount; chain home is /data/.zeroned on both nodes

const CHAINS = [
  { app: "zerone-testnet-1", chain: "zerone-testnet-1" }, // lower stakes first
  { app: "zerone-1", chain: "zerone-1" },
];

async function keychain(service: string): Promise<string> {
  const proc = Bun.spawn(["security", "find-generic-password", "-s", service, "-w"], { stdout: "pipe", stderr: "ignore" });
  const out = (await new Response(proc.stdout).text()).trim();
  if ((await proc.exited) !== 0 || !out) throw new Error(`keychain: no ${service}`);
  return out;
}

const s3 = new Bun.S3Client({
  accessKeyId: await keychain("agenttool-tigris-access-key"),
  secretAccessKey: await keychain("agenttool-tigris-secret-key"),
  endpoint: ENDPOINT,
  bucket: BUCKET,
  region: "auto",
});

const only = process.argv[2];
let failed = 0;

for (const { app, chain } of CHAINS) {
  if (only && only !== chain && only !== app) continue;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "Z");
  const key = `chain/${chain}/${chain}-data-${stamp}.tar.gz`;
  console.log(`[${new Date().toISOString()}] ${chain}: streaming ${DATA_ROOT}/.zeroned → s3://${BUCKET}/${key}`);

  const putUrl = s3.presign(key, { method: "PUT", expiresIn: 7200 });
  // Tigris returns 411 on chunked uploads — PUT needs Content-Length, so tar
  // to the machine's ephemeral /tmp first (rootfs has ~7G free; archives <1G),
  // then curl -T <file> which sets the length. Presigned URLs carry no
  // shell-hostile chars beyond & and % — safe inside double quotes.
  // tar exits 1 ("file changed as we read it") on a live LevelDB — that IS the
  // accepted hot-copy semantics (restore = resync tail); only rc>1 is fatal.
  const tmp = `/tmp/${chain}-${stamp}.tar.gz`;
  const remote =
    `bash -c 'tar czf ${tmp} --warning=no-file-changed -C ${DATA_ROOT} .zeroned/data .zeroned/config; rc=$?; ` +
    `if [ $rc -gt 1 ]; then rm -f ${tmp}; exit $rc; fi; ` +
    `curl -sS --fail-with-body -X PUT -T ${tmp} "${putUrl}"; rc=$?; rm -f ${tmp}; exit $rc'`;
  const proc = Bun.spawn(["flyctl", "ssh", "console", "-a", app, "-C", remote], { stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) {
    console.log(`⚠ ${chain}: remote stream FAILED (exit ${code}): ${(err + out).slice(0, 300)}`);
    failed++;
    continue;
  }

  const st = await s3.stat(key).catch(() => null);
  if (!st || !st.size) {
    console.log(`⚠ ${chain}: upload not found in vault after stream — treating as FAILED`);
    failed++;
    continue;
  }
  console.log(`✓ ${chain}: ${(st.size / 1e6).toFixed(1)} MB landed at ${key}`);

  // prune: keep newest KEEP objects for this chain
  const listed = await s3.list({ prefix: `chain/${chain}/`, maxKeys: 1000 });
  const objs = (listed.contents ?? []).sort((a, b) => (a.key < b.key ? -1 : 1)); // stamps sort lexically
  const excess = objs.slice(0, Math.max(0, objs.length - KEEP));
  for (const o of excess) {
    await s3.delete(o.key);
    console.log(`  pruned ${o.key}`);
  }
  console.log(`  vault now holds ${objs.length - excess.length} backups for ${chain}`);
}

if (failed) {
  console.log(`⚠ CHAIN BACKUP: ${failed} chain(s) FAILED — the vault copy is stale for them`);
  process.exit(1);
}
console.log(`[${new Date().toISOString()}] chain backup complete — the kingdom's memory has a second home`);
