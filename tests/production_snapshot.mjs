#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, readlinkSync } from "node:fs";
import { join } from "node:path";

function visit(path, entries) {
  const stat = lstatSync(path, { bigint: true });
  if (stat.isDirectory()) {
    for (const name of readdirSync(path).sort()) visit(join(path, name), entries);
    return;
  }
  const kind = stat.isSymbolicLink() ? "symlink" : stat.isFile() ? "file" : "other";
  const bytes = stat.isSymbolicLink() ? Buffer.from(readlinkSync(path)) : readFileSync(path);
  entries.push({
    path,
    kind,
    mode: Number(stat.mode & 0o777n),
    size: Number(stat.size),
    mtime_ns: stat.mtimeNs.toString(),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

const entries = [];
for (const path of process.argv.slice(2).sort()) visit(path, entries);
entries.sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)));
process.stdout.write(`${JSON.stringify(entries)}\n`);
