import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SUBJECT = new URL("../bin/chain-backup-install.sh", import.meta.url).pathname;
const OLD = "// synthetic legacy bytes: pruning is not safe\n";
const NEW = "// synthetic replacement bytes: RAW_UNVERIFIED, exit 3, no pruning\n";
const sha = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");
const PRIVATE = "PRIVATE_OBSERVER_SENTINEL";

// Darwin's actual fd-based copyfile/ACL/xattr/fsync/rename APIs operate ONLY on
// owned fixtures. No real launchctl/pgrep is invoked. The Python shim also rejects
// every write outside the fixture, even if HOME is inherited from the developer.
function fixture(homeName = "home") {
  const root = realpathSync(mkdtempSync("/private/tmp/chain-install-test-"));
  const home = join(root, homeName);
  const bin = join(home, ".kingdom/bin");
  const repo = join(root, "repo/bin");
  const commands = join(root, "commands");
  for (const dir of [bin, repo, commands, join(home, "Library/LaunchAgents")]) mkdirSync(dir, { recursive: true });
  const script = join(repo, "chain-backup-install.sh");
  const source = join(repo, "chain-backup-remote.ts");
  const dest = join(bin, "chain-backup-remote.ts");
  const wrapper = join(bin, "run-chain-backup.sh");
  const plist = join(home, "Library/LaunchAgents/com.kingdom.chain-backup.plist");
  copyFileSync(SUBJECT, script);
  writeFileSync(source, NEW);
  writeFileSync(dest, OLD, { mode: 0o640 });
  writeFileSync(wrapper, "#!/bin/bash\n# inert fixture wrapper, never executed\n", { mode: 0o700 });
  writeFileSync(plist, `<?xml version="1.0"?><plist version="1.0"><dict>
<key>Label</key><string>com.kingdom.chain-backup</string>
<key>ProgramArguments</key><array><string>/bin/bash</string><string>${wrapper}</string></array>
<key>RunAtLoad</key><false/><key>StartCalendarInterval</key><dict><key>Hour</key><integer>3</integer><key>Minute</key><integer>33</integer></dict>
</dict></plist>`);
  const shim = `#!/usr/bin/python3
import ctypes, datetime, fcntl, json, os, stat, subprocess, sys, time
root = os.environ['FIXTURE']
os.devnull = root + '/devnull'
with open(os.devnull, 'w'): pass
mode = os.environ.get('CASE', '')
code = sys.stdin.read()
sys.argv = sys.argv[1:]
real_open, real_stat, real_replace = os.open, os.fstat, os.replace
real_mkdir, real_unlink, real_rmdir = os.mkdir, os.unlink, os.rmdir
real_fsync = os.fsync
lib = ctypes.CDLL('/usr/lib/libSystem.B.dylib')
def fdpath(fd):
    return fcntl.fcntl(fd, 50, bytes(1024)).split(b'\\0')[0].decode()
def path_at(path, dir_fd=None):
    return os.path.join(fdpath(dir_fd), path) if dir_fd is not None else os.path.abspath(path)
def owned(path):
    if not path.startswith(root + '/'):
        raise RuntimeError('WRITE_OUTSIDE_FIXTURE')
def guarded_open(path, flags, *args, **kwargs):
    target = path_at(path, kwargs.get('dir_fd'))
    if flags & (os.O_WRONLY | os.O_RDWR | os.O_CREAT | os.O_TRUNC):
        owned(target)
    if mode == 'stage-failure' and os.path.basename(target).startswith('.chain-backup-stage-'):
        raise OSError('injected stage failure')
    return real_open(path, flags, *args, **kwargs)
def guarded_mkdir(path, *args, **kwargs):
    owned(path_at(path, kwargs.get('dir_fd')))
    return real_mkdir(path, *args, **kwargs)
def guarded_unlink(path, *args, **kwargs):
    owned(path_at(path, kwargs.get('dir_fd')))
    return real_unlink(path, *args, **kwargs)
def guarded_rmdir(path, *args, **kwargs):
    owned(path_at(path, kwargs.get('dir_fd')))
    return real_rmdir(path, *args, **kwargs)
def guarded_replace(src, dst, **kwargs):
    owned(path_at(src, kwargs.get('src_dir_fd')))
    owned(path_at(dst, kwargs.get('dst_dir_fd')))
    if mode == 'rename-failure': raise OSError('injected rename failure')
    return real_replace(src, dst, **kwargs)
def guarded_fsync(fd):
    owned(fdpath(fd))
    if mode == 'fsync-failure': raise OSError('injected fsync failure')
    if mode == 'post-rename-fsync' and fdpath(fd).endswith('/.kingdom/bin'):
        if open(root + '/home/.kingdom/bin/chain-backup-remote.ts').read() == ${JSON.stringify(NEW)}:
            raise OSError('injected post-rename fsync failure')
    return real_fsync(fd)
os.open, os.mkdir, os.unlink, os.rmdir = guarded_open, guarded_mkdir, guarded_unlink, guarded_rmdir
os.replace, os.fsync = guarded_replace, guarded_fsync
if mode in ('owner', 'parent-owner'):
    def fake_stat(fd):
        value = real_stat(fd)
        target = fdpath(fd)
        selected = target.endswith('/.kingdom/bin/chain-backup-remote.ts') if mode == 'owner' else target.endswith('/.kingdom/bin')
        if selected:
            class Changed:
                def __getattr__(self, name): return 99999 if name == 'st_uid' else getattr(value, name)
            return Changed()
        return value
    os.fstat = fake_stat
if mode in ('metadata-failure', 'metadata-loss'):
    original_cdll = ctypes.CDLL
    def wrapped_cdll(*args, **kwargs):
        handle = original_cdll(*args, **kwargs)
        original_list = handle.flistxattr
        original_list.argtypes = [ctypes.c_int, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_int]
        original_list.restype = ctypes.c_ssize_t
        def listing(fd, *rest):
            if '.chain-backup-stage-' in fdpath(fd): return -1 if mode == 'metadata-failure' else 0
            return original_list(fd, *rest)
        handle.flistxattr = listing
        return handle
    ctypes.CDLL = wrapped_cdll
if mode.startswith('acl-'):
    original_cdll = ctypes.CDLL
    def wrapped_acl_cdll(*args, **kwargs):
        handle = original_cdll(*args, **kwargs)
        def failed(*args):
            ctypes.set_errno(5)  # EIO, not Darwin's end-of-entry EINVAL
            return -1
        def unknown_tag(entry, result):
            ctypes.cast(result, ctypes.POINTER(ctypes.c_int))[0] = 99
            return 0
        def unknown_permission(entry, result):
            ctypes.cast(result, ctypes.POINTER(ctypes.c_uint64))[0] = 1 << 63
            return 0
        replacements = {
            'acl-invalid': ('acl_valid', failed),
            'acl-entry-error': ('acl_get_entry', failed),
            'acl-tag-error': ('acl_get_tag_type', failed),
            'acl-permission-error': ('acl_get_permset_mask_np', failed),
            'acl-unknown-tag': ('acl_get_tag_type', unknown_tag),
            'acl-unknown-permission': ('acl_get_permset_mask_np', unknown_permission),
        }
        name, replacement = replacements[mode]
        setattr(handle, name, replacement)
        return handle
    ctypes.CDLL = wrapped_acl_cdll
class Clock(datetime.datetime):
    @classmethod
    def now(cls, tz=None): return cls(2026, 9, 8, 3, 33) if mode == 'schedule-window' else cls(2026, 9, 8, 12, 0)
datetime.datetime = Clock
time.sleep = lambda seconds: None
exec(compile(code, '<installer>', 'exec'), {'__name__': '__main__'})
`;
  writeFileSync(join(commands, "python3"), shim, { mode: 0o700 });
  const mock = `#!/usr/bin/python3
import json, os, sys
root = os.environ['FIXTURE']
mode = os.environ.get('CASE', '')
name = os.path.basename(sys.argv[0])
with open(root + '/calls', 'a') as f: f.write(json.dumps({'name': name, 'args': sys.argv[1:]}) + '\\n')
if mode == 'schedule':
    import shutil
    args = sys.argv[1:]
    def owned(path):
        if not os.path.realpath(path).startswith(root + '/'): raise RuntimeError('outside fixture')
        return path
    if name == 'dirname': print(os.path.dirname(owned(args[0]))); sys.exit(0)
    if name == 'mkdir':
        for path in args[1:]: os.makedirs(owned(path), exist_ok=True)
        sys.exit(0)
    if name == 'cp': shutil.copyfile(owned(args[0]), owned(args[1])); sys.exit(0)
    if name == 'chmod': os.chmod(owned(args[1]), 0o700); sys.exit(0)
    if name == 'cat': sys.stdout.write(sys.stdin.read()); sys.exit(0)
    if name == 'id': print(os.getuid()); sys.exit(0)
    if name == 'launchctl' and args[0] in ('bootout', 'bootstrap'): sys.exit(0)
    sys.exit(99)
if name == 'launchctl':
    if sys.argv[1] != 'print': sys.exit(99)
    countpath = root + '/observations'
    count = int(open(countpath).read()) + 1 if os.path.exists(countpath) else 1
    with open(countpath, 'w') as f: f.write(str(count))
    if mode == 'observe-error': print(${JSON.stringify(PRIVATE)}); sys.exit(1)
    if mode == 'observe-oversize': print(${JSON.stringify(PRIVATE)} * 20000); sys.exit(0)
    if mode == 'observe-timeout':
        import time
        time.sleep(10)
    if count == 3:
        dest = root + '/home/.kingdom/bin/chain-backup-remote.ts'
        if mode == 'dest-drift':
            with open(dest, 'w') as f: f.write('concurrent replacement, preserve it')
        if mode == 'identity-drift':
            data = open(dest, 'rb').read()
            os.unlink(dest)
            with open(dest, 'wb') as f: f.write(data)
        if mode == 'source-drift':
            with open(root + '/repo/bin/chain-backup-remote.ts', 'w') as f: f.write('changed source')
        if mode == 'mode-drift': os.chmod(dest, 0o600)
        if mode == 'wrapper-drift':
            with open(root + '/home/.kingdom/bin/run-chain-backup.sh', 'a') as f: f.write('# changed')
        if mode == 'stage-drift':
            for name in os.listdir(root + '/home/.kingdom/bin'):
                if name.startswith('.chain-backup-stage-'):
                    with open(root + '/home/.kingdom/bin/' + name, 'w') as f: f.write('bad staged bytes')
    state = 'running' if mode == 'job-active' or (mode == 'late-active' and count == 3) else 'not running'
    if mode == 'job-unknown': state = 'waiting'
    binding = '/other.plist' if mode == 'binding' else root + '/home/Library/LaunchAgents/com.kingdom.chain-backup.plist'
    output = 'gui/501/com.kingdom.chain-backup = {\\n\\tactive count = 0\\n\\tpath = ' + binding + '\\n\\tstate = ' + state + '\\n\\tprogram = /bin/bash\\n\\targuments = {\\n\\t\\t/bin/bash\\n\\t\\t' + root + '/home/.kingdom/bin/run-chain-backup.sh\\n\\t}\\n}'
    if mode == 'job-missing': output = 'no selected metadata'
    if mode == 'pid-present': output += '\\n\\tpid = 123'
    print(output)
    sys.exit(0)
if name == 'pgrep':
    if mode == 'local-active': print('123'); sys.exit(0)
    if mode == 'local-unknown': print(${JSON.stringify(PRIVATE)}); sys.exit(2)
    sys.exit(1)
print(${JSON.stringify(PRIVATE)})
sys.exit(99)
`;
  for (const name of ["launchctl", "pgrep", "security", "flyctl", "ssh", "aws", "curl", "bun", "zeroned", "cp", "mkdir", "chmod", "id", "cat", "dirname"]) {
    writeFileSync(join(commands, name), mock, { mode: 0o700 });
  }
  const calls = () => existsSync(join(root, "calls")) ? readFileSync(join(root, "calls"), "utf8").trim().split("\n").map(s => JSON.parse(s)) as Array<{name: string; args: string[]}> : [];
  const run = (args = ["replace-runner", "--home", home, "--expected-source", sha(NEW), "--expected-installed", sha(OLD), "--quiet-window-confirmed"], mode = "") => spawnSync("/bin/bash", [script, ...args], {
    cwd: root, env: { PATH: commands, HOME: process.env.HOME, FIXTURE: root, CASE: mode, LC_ALL: "C" }, encoding: "utf8", timeout: 15000,
  });
  return { root, home, bin, source, dest, wrapper, plist, run, calls,
    close: () => rmSync(root, { recursive: true, force: true }) };
}
function observedOnly(f: ReturnType<typeof fixture>) {
  expect(f.calls().every(c => (c.name === "launchctl" && c.args[0] === "print") || (c.name === "pgrep" && c.args[0] === "-f"))).toBe(true);
}
function safeError(f: ReturnType<typeof fixture>, mode: string) {
  const r = f.run(undefined, mode);
  expect(r.status).toBe(1);
  expect(r.stderr).toBe("");
  expect(r.stdout).not.toContain(PRIVATE);
  expect(JSON.parse(r.stdout).runner_replaced).toBe(false);
  observedOnly(f);
  expect(readdirSync(f.bin).some(n => n.startsWith(".chain-backup-stage-"))).toBe(false);
  return JSON.parse(r.stdout);
}

// The installer is Darwin-only by design (replace-runner refuses elsewhere with
// DARWIN_REQUIRED), and these fixtures use /private/tmp and Darwin's copyfile/ACL/
// xattr APIs. On the Linux CI runner they cannot run, so they run on the Mac that
// installs the runner, before every replacement.
describe.skipIf(process.platform !== "darwin")("backup installer explicit actions", () => {
  test("help, missing action and invalid args have zero effects even with inherited HOME", () => {
    const f = fixture();
    try {
      for (const args of [["--help"], ["-h"], [], ["unknown"], ["replace-runner"], ["schedule-install"], ["--help", "extra"],
        ["replace-runner", "--home", f.home, "--expected-source", "bad"], ["schedule-install", "--home", f.home, "--quiet-window-confirmed"],
        ["schedule-install", "--home", "relative"], ["schedule-install", "--home", f.home, "--home", f.home],
        ["schedule-install", "--home", f.home + "/../home"], ["schedule-install", "--home", f.home + "/"],
        ["schedule-install", "--home", f.home + "&xml"], ["schedule-install", "--home", f.home + "\nnewline"],
        ["schedule-install", "--home", f.home + "\\backslash"],
        ["replace-runner", "--home", f.home + "\\backslash", "--expected-source", sha(NEW), "--expected-installed", sha(OLD), "--quiet-window-confirmed"]]) {
        const r = f.run(args);
        expect(r.status).toBe(args.length === 1 && ["--help", "-h"].includes(args[0]) ? 0 : 2);
        expect(readFileSync(f.dest, "utf8")).toBe(OLD);
        expect(f.calls()).toEqual([]);
        expect(readdirSync(f.bin).sort()).toEqual(["chain-backup-remote.ts", "run-chain-backup.sh"]);
      }
    } finally { f.close(); }
  }, 30000);

  test("schedule installation remains behind an explicit action and explicit owned home", () => {
    const f = fixture();
    try {
      const r = f.run(["schedule-install", "--home", f.home], "schedule");
      expect(r.status).toBe(0);
      expect(r.stderr).toBe("");
      expect(readFileSync(f.dest, "utf8")).toBe(NEW);
      expect(readFileSync(f.wrapper, "utf8")).toContain('exec /opt/homebrew/bin/bun "$HOME/.kingdom/bin/chain-backup-remote.ts"');
      expect(readFileSync(f.plist, "utf8")).toContain("<key>RunAtLoad</key><false/>");
      expect(readFileSync(f.plist, "utf8")).toContain("<key>Minute</key><integer>33</integer>");
      expect(f.calls().filter(c => c.name === "launchctl").map(c => c.args[0])).toEqual(["bootout", "bootstrap"]);
      expect(f.calls().every(c => ["dirname", "mkdir", "cp", "cat", "chmod", "launchctl", "id"].includes(c.name))).toBe(true);
    } finally { f.close(); }
  }, 30000);

  test("generated schedule wrapper executes the explicit-home runner despite a different inherited HOME", () => {
    for (const homeName of ["home", "home with spaces $HOME $(printf WRONG) `printf WRONG` ; (x)"]) {
      const f = fixture(homeName);
      try {
        writeFileSync(f.source, 'console.log(JSON.stringify({runner: "explicit", home: process.env.HOME}));\n');
        const inheritedHome = join(f.root, "other-home");
        mkdirSync(join(inheritedHome, ".kingdom/bin"), { recursive: true });
        writeFileSync(join(inheritedHome, ".kingdom/bin/chain-backup-remote.ts"), 'console.log("INHERITED_HOME_RUNNER");\n');
        const install = f.run(["schedule-install", "--home", f.home], "schedule");
        expect(install.status).toBe(0);
        expect(install.stderr).toBe("");
        expect(readFileSync(f.dest)).toEqual(readFileSync(f.source));
        // Execute only the generated fixture wrapper and these inert programs.
        // launchctl remains mocked; neither program imports the real runner.
        const execute = spawnSync("/bin/bash", [f.wrapper], {
          cwd: f.root, env: { HOME: inheritedHome, PATH: "/usr/bin:/bin", LC_ALL: "C" }, encoding: "utf8", timeout: 5000,
        });
        expect(execute.stderr).toBe("");
        expect(execute.status).toBe(0);
        expect(JSON.parse(execute.stdout)).toEqual({ runner: "explicit", home: f.home });
        expect(f.calls().filter(c => c.name === "launchctl").map(c => c.args[0])).toEqual(["bootout", "bootstrap"]);
      } finally { f.close(); }
    }
  }, 30000);

  test("source and installed digests must match exactly before observations or writes", () => {
    for (const which of ["source", "dest"] as const) {
      const f = fixture();
      try {
        writeFileSync(f[which], "different bytes");
        expect(safeError(f, "").error).toBe(which === "source" ? "SOURCE_HASH_MISMATCH" : "INSTALLED_HASH_MISMATCH");
        expect(f.calls()).toEqual([]);
        expect(readdirSync(f.bin).sort()).toEqual(["chain-backup-remote.ts", "run-chain-backup.sh"]);
      } finally { f.close(); }
    }
  }, 30000);

  test("refuses symlinks, hardlinks, directories, writable files and unsafe parent paths", () => {
    for (const mode of ["source-link", "dest-link", "parent-link", "hardlink", "directory", "writable", "parent-writable", "owner", "parent-owner"]) {
      const f = fixture();
      try {
        if (mode === "source-link") { rmSync(f.source); symlinkSync(f.dest, f.source); }
        if (mode === "dest-link") { rmSync(f.dest); symlinkSync(f.source, f.dest); }
        if (mode === "parent-link") { rmSync(join(f.root, "repo"), { recursive: true }); mkdirSync(join(f.root, "elsewhere")); symlinkSync(join(f.root, "elsewhere"), join(f.root, "repo")); }
        if (mode === "hardlink") linkSync(f.dest, join(f.bin, "alias"));
        if (mode === "directory") { rmSync(f.dest); mkdirSync(f.dest); }
        if (mode === "writable") chmodSync(f.dest, 0o666);
        if (mode === "parent-writable") chmodSync(f.bin, 0o777);
        if (mode === "parent-link") {
          // Keep the installer readable through its original path to test its
          // own path refusal rather than a shell-level missing-script failure.
          mkdirSync(join(f.root, "elsewhere/bin"));
          copyFileSync(SUBJECT, join(f.root, "elsewhere/bin/chain-backup-install.sh"));
        }
        safeError(f, mode);
        expect(f.calls()).toEqual([]);
      } finally { f.close(); }
    }
  }, 30000);

  test("native file mutation ACLs are refused on source and destination before observations or writes", () => {
    for (const scope of ["source", "dest"] as const) {
      for (const permission of ["write", "append", "delete", "writeattr", "writeextattr", "writesecurity", "chown"]) {
        const f = fixture();
        try {
          const before = statSync(f[scope]);
          expect(spawnSync("/bin/chmod", ["+a", `everyone allow ${permission}`, f[scope]]).status).toBe(0);
          expect(statSync(f[scope]).mode).toBe(before.mode); // Mode bits alone do not reveal this grant.
          expect(safeError(f, "")).toMatchObject({ error: "UNSAFE_FILE_ACL", phase: "preflight" });
          expect(f.calls()).toEqual([]);
          expect(readFileSync(f.source, "utf8")).toBe(NEW);
          expect(readFileSync(f.dest, "utf8")).toBe(OLD);
          expect(readdirSync(f.bin).sort()).toEqual(["chain-backup-remote.ts", "run-chain-backup.sh"]);
        } finally {
          spawnSync("/bin/chmod", ["-N", f[scope]]);
          f.close();
        }
      }
    }
  }, 60000);

  test("native parent allow ACLs are refused, including read-only and inheritable entries", () => {
    for (const scope of ["source-parent", "bin", "home", "plist-parent"]) {
      for (const permission of ["add_file,delete_child", "read", "file_inherit,directory_inherit,only_inherit,write"]) {
        const f = fixture();
        const parent = scope === "source-parent" ? join(f.root, "repo/bin") : scope === "plist-parent" ? join(f.home, "Library/LaunchAgents") : scope === "home" ? f.home : f.bin;
        try {
          expect(spawnSync("/bin/chmod", ["+a", `everyone allow ${permission}`, parent]).status).toBe(0);
          expect(safeError(f, "")).toMatchObject({ error: "PARENT_ALLOW_ACL_UNSUPPORTED", phase: "preflight" });
          expect(f.calls()).toEqual([]);
          expect(readFileSync(f.dest, "utf8")).toBe(OLD);
          expect(readdirSync(f.bin).sort()).toEqual(["chain-backup-remote.ts", "run-chain-backup.sh"]);
        } finally {
          spawnSync("/bin/chmod", ["-N", parent]);
          f.close();
        }
      }
    }
  }, 60000);

  test("a harmless first ACE or deny entry cannot hide a later mutating file allow entry", () => {
    for (const first of ["everyone allow read", "everyone deny write"]) {
      const f = fixture();
      try {
        expect(spawnSync("/bin/chmod", ["+a#", "0", first, f.dest]).status).toBe(0);
        expect(spawnSync("/bin/chmod", ["+a#", "1", "everyone allow write", f.dest]).status).toBe(0);
        expect(safeError(f, "").error).toBe("UNSAFE_FILE_ACL");
        expect(f.calls()).toEqual([]);
        expect(readFileSync(f.dest, "utf8")).toBe(OLD);
      } finally {
        spawnSync("/bin/chmod", ["-N", f.dest]);
        f.close();
      }
    }
  }, 30000);

  test("ACL API failures and unknown tags or permissions fail closed", () => {
    const cases = { "acl-invalid": "ACL_INVALID", "acl-entry-error": "ACL_ENTRY_READ_FAILED", "acl-tag-error": "ACL_TAG_READ_FAILED",
      "acl-permission-error": "ACL_PERMISSIONS_READ_FAILED", "acl-unknown-tag": "ACL_TAG_UNSUPPORTED", "acl-unknown-permission": "UNSAFE_FILE_ACL" };
    for (const [mode, error] of Object.entries(cases)) {
      const f = fixture();
      try {
        expect(spawnSync("/bin/chmod", ["+a", "everyone allow read", f.source]).status).toBe(0);
        expect(safeError(f, mode)).toMatchObject({ error, phase: "preflight" });
        expect(f.calls()).toEqual([]);
        expect(readFileSync(f.dest, "utf8")).toBe(OLD);
        expect(readdirSync(f.bin).sort()).toEqual(["chain-backup-remote.ts", "run-chain-backup.sh"]);
      } finally {
        spawnSync("/bin/chmod", ["-N", f.source]);
        f.close();
      }
    }
  }, 30000);

  test("active, unknown, malformed or failed observations defer without changing runner", () => {
    const cases = { "job-active": "JOB_ACTIVE_OR_UNKNOWN", "job-unknown": "JOB_ACTIVE_OR_UNKNOWN", "job-missing": "JOB_METADATA_UNKNOWN",
      "pid-present": "JOB_ACTIVE_OR_UNKNOWN", binding: "REGISTERED_JOB_BINDING", "local-active": "LOCAL_INVOCATION_ACTIVE_OR_UNKNOWN",
      "local-unknown": "OBSERVATION_FAILED", "observe-error": "OBSERVATION_FAILED", "observe-oversize": "OBSERVATION_OVERSIZE", "schedule-window": "SCHEDULE_WINDOW" };
    for (const [mode, error] of Object.entries(cases)) {
      const f = fixture();
      try {
        expect(safeError(f, mode).error).toBe(error);
        expect(readFileSync(f.dest, "utf8")).toBe(OLD);
        expect(readdirSync(f.bin).sort()).toEqual(["chain-backup-remote.ts", "run-chain-backup.sh"]);
      } finally { f.close(); }
    }
  }, 30000);

  test("observation timeout is bounded, suppresses raw output and never stops a service", () => {
    const f = fixture();
    try { expect(safeError(f, "observe-timeout").error).toBe("OBSERVATION_TIMEOUT"); expect(readFileSync(f.dest, "utf8")).toBe(OLD); }
    finally { f.close(); }
  }, 15000);

  test("plist schedule drift is rejected before observing any service", () => {
    const f = fixture();
    try {
      writeFileSync(f.plist, readFileSync(f.plist, "utf8").replace("<false/>", "<true/>"));
      safeError(f, "");
      expect(f.calls()).toEqual([]);
    } finally { f.close(); }
  }, 30000);

  test("successful replacement preserves actual Darwin owner, mode, ACL, xattrs and old rollback bytes", () => {
    const f = fixture();
    try {
      const set = spawnSync("/usr/bin/xattr", ["-w", "com.kingdom.fixture", "only synthetic metadata", f.dest], { encoding: "utf8" });
      expect(set.status).toBe(0);
      const acl = spawnSync("/bin/chmod", ["+a", "everyone allow read", f.dest], { encoding: "utf8" });
      expect(acl.status).toBe(0);
      const before = statSync(f.dest);
      const wrapper = readFileSync(f.wrapper);
      const plist = readFileSync(f.plist);
      const r = f.run();
      expect(r.stderr).toBe("");
      expect(r.status).toBe(0);
      const receipt = JSON.parse(r.stdout);
      expect(receipt).toMatchObject({ status: "REPLACED", runner_replaced: true, installed_sha256: sha(NEW), rollback_sha256: sha(OLD),
        capture_performed: false, service_control_performed: false, network_performed: false, automatic_rollback: false, recovery_status: "NOT_ASSESSED", run_at_load: false });
      expect(receipt.metadata.xattr_count).toBeGreaterThan(0);
      expect(readFileSync(f.dest, "utf8")).toBe(NEW);
      expect(readFileSync(join(receipt.rollback_directory, "chain-backup-remote.ts"), "utf8")).toBe(OLD);
      expect(JSON.parse(readFileSync(join(receipt.rollback_directory, "receipt.json"), "utf8")).status).toBe("REPLACED");
      expect(readFileSync(f.wrapper)).toEqual(wrapper);
      expect(readFileSync(f.plist)).toEqual(plist);
      const after = statSync(f.dest);
      expect([after.uid, after.gid, after.mode, after.mtimeMs]).toEqual([before.uid, before.gid, before.mode, before.mtimeMs]);
      expect(after.ino).not.toBe(before.ino);
      expect(f.calls().filter(c => c.name === "launchctl")).toHaveLength(3);
      observedOnly(f);
      expect(readdirSync(f.bin).some(n => /stage|lock/.test(n))).toBe(false);
    } finally {
      // Remove the synthetic read ACE before disposing the owned fixture.
      for (const path of [f.dest, ...readdirSync(f.bin).filter(n => n.startsWith(".chain-backup-rollback-")).map(n => join(f.bin, n, "chain-backup-remote.ts"))]) {
        spawnSync("/bin/chmod", ["-N", path]);
      }
      f.close();
    }
  }, 30000);

  test("stage, metadata, fsync and rename failures preserve old bytes and exclusive rollback artifact", () => {
    for (const mode of ["stage-failure", "metadata-failure", "metadata-loss", "fsync-failure", "rename-failure", "late-active", "stage-drift"]) {
      const f = fixture();
      try {
        if (mode === "metadata-loss") expect(spawnSync("/usr/bin/xattr", ["-w", "com.kingdom.fixture", "preserve", f.dest]).status).toBe(0);
        const receipt = safeError(f, mode);
        expect(readFileSync(f.dest, "utf8")).toBe(OLD);
        expect(readFileSync(join(receipt.rollback_directory, "chain-backup-remote.ts"), "utf8")).toBe(OLD);
        expect(statSync(receipt.rollback_directory).mode & 0o777).toBe(0o700);
      } finally { f.close(); }
    }
  }, 30000);

  test("last-minute source, destination bytes/identity/mode and wrapper changes are not overwritten", () => {
    for (const mode of ["dest-drift", "identity-drift", "source-drift", "mode-drift", "wrapper-drift"]) {
      const f = fixture();
      try {
        const receipt = safeError(f, mode);
        expect(receipt.error).toBe(mode === "identity-drift" ? "UNSAFE_FILE_TYPE_OWNER_OR_LINKS" : "FILE_IDENTITY_OR_BYTES_DRIFT");
        expect(readFileSync(f.dest, "utf8")).toBe(mode === "dest-drift" ? "concurrent replacement, preserve it" : OLD);
        expect(readFileSync(join(receipt.rollback_directory, "chain-backup-remote.ts"), "utf8")).toBe(OLD);
      } finally { f.close(); }
    }
  }, 30000);

  test("post-publication failure reports changed state but NEVER restores pruning", () => {
    const f = fixture();
    try {
      const r = f.run(undefined, "post-rename-fsync");
      expect(r.status).toBe(1);
      expect(JSON.parse(r.stdout)).toMatchObject({ runner_replaced: true, automatic_rollback: false });
      expect(readFileSync(f.dest, "utf8")).toBe(NEW);
      observedOnly(f);
    } finally { f.close(); }
  }, 30000);

  test("an existing transaction marker is left intact rather than reclaimed", () => {
    const f = fixture();
    try {
      mkdirSync(join(f.bin, ".chain-backup-replace.lock"), { mode: 0o700 });
      writeFileSync(join(f.bin, ".chain-backup-replace.lock", "owner"), "other transaction");
      safeError(f, "");
      expect(readFileSync(join(f.bin, ".chain-backup-replace.lock", "owner"), "utf8")).toBe("other transaction");
      expect(readFileSync(f.dest, "utf8")).toBe(OLD);
    } finally { f.close(); }
  }, 30000);
});
