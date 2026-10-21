#!/bin/bash
# Explicit local actions. Replacement never runs a capture or controls launchd.
set -euo pipefail
usage() {
  printf '%s\n' \
    'Usage:' \
    '  chain-backup-install.sh replace-runner --home ABSOLUTE_HOME --expected-source SHA256 --expected-installed SHA256 --quiet-window-confirmed' \
    '  chain-backup-install.sh schedule-install --home ABSOLUTE_HOME' \
    '  chain-backup-install.sh --help' \
    'replace-runner: Darwin only; requires an awake quiet interval away from 03:33/wake catch-up.' \
    'Observations are not a cross-host lock or proof that no orphan/manual invocation exists.' \
    'schedule-install: separately authorized wrapper/plist installation and launchd reload.' \
    'Use a trusted Python 3/PATH; no packages are installed. See FLY-LEVERAGE.md.'
}
if [[ $# == 1 && ( $1 == --help || $1 == -h ) ]]; then usage; exit 0; fi
[[ $# -gt 0 ]] || { usage >&2; exit 2; }
action=$1; shift
case "$action" in replace-runner|schedule-install) ;; *) usage >&2; exit 2;; esac
home='' source_sha='' installed_sha='' quiet=''
while [[ $# -gt 0 ]]; do
  case "$1" in
    --home) [[ $# -ge 2 && -z $home ]] || { usage >&2; exit 2; }; home=$2; shift 2;;
    --expected-source) [[ $# -ge 2 && -z $source_sha ]] || { usage >&2; exit 2; }; source_sha=$2; shift 2;;
    --expected-installed) [[ $# -ge 2 && -z $installed_sha ]] || { usage >&2; exit 2; }; installed_sha=$2; shift 2;;
    --quiet-window-confirmed) [[ -z $quiet ]] || { usage >&2; exit 2; }; quiet=yes; shift;;
    *) usage >&2; exit 2;;
  esac
done
# Validate all usage before resolving paths, starting Python or creating anything.
# The schedule template embeds this path in XML. Bun normalizes backslashes in
# module paths, so those cannot name the same supported runner target either.
[[ $home != *\\* && $home != *'&'* && $home != *'<'* && $home != *'>'* && $home != *'"'* && $home != *"'"* ]] || { usage >&2; exit 2; }
[[ $home == /* && $home != / && $home != */ && $home != *//* && $home != *$'\n'* && $home != *$'\r'* && $home != *$'\t'* && $home != */../* && $home != */./* && $home != */.. && $home != */. ]] || { usage >&2; exit 2; }
if [[ $action == replace-runner ]]; then
  [[ $source_sha =~ ^[0-9a-f]{64}$ && $installed_sha =~ ^[0-9a-f]{64}$ && $quiet == yes ]] || { usage >&2; exit 2; }
else
  [[ -z $source_sha && -z $installed_sha && -z $quiet ]] || { usage >&2; exit 2; }
fi
# Do not resolve symlinks here: Python validates every component. Use a trusted
# PATH (documented below); tests supply an entirely owned interpreter/command shim.
script=$0
[[ $script == /* ]] || script="$PWD/$script"
if [[ $action == replace-runner ]]; then
  exec python3 - "$script" "$home" "$source_sha" "$installed_sha" <<'PY'
import ctypes
import datetime
import errno
import hashlib
import json
import os
import plistlib
import re
import selectors
import stat
import subprocess
import sys
import time
import uuid

# Small Darwin-specific transaction, using native copyfile for ACLs/xattrs rather
# than assuming chmod/cp alone preserved them. No runner import or execution.
class Refuse(Exception):
    pass

def require(ok, code):
    if not ok:
        raise Refuse(code)

def digest(data):
    return hashlib.sha256(data).hexdigest()

fds = []
parents = {}
stage = rollback = lock = None
published = False
receipt = {"action": "replace-runner", "phase": "preflight", "recovery_status": "NOT_ASSESSED",
           "capture_performed": False, "service_control_performed": False,
           "network_performed": False, "automatic_rollback": False,
           "quiescence": "bounded local observations only; not a lock against captures or proof of orphan absence"}
try:
    require(sys.platform == "darwin", "DARWIN_REQUIRED")
    uid = os.getuid()
    require(uid != 0 and os.geteuid() == uid, "UNPRIVILEGED_OWNER_REQUIRED")
    script, home, expected_source, expected_installed = sys.argv[1:]
    require(os.path.normpath(script) == script, "NONCANONICAL_SCRIPT_PATH")
    lib = ctypes.CDLL("/usr/lib/libSystem.B.dylib", use_errno=True)
    lib.fcopyfile.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_void_p, ctypes.c_uint32]
    lib.fcopyfile.restype = ctypes.c_int
    lib.acl_get_fd_np.argtypes = [ctypes.c_int, ctypes.c_int]
    lib.acl_get_fd_np.restype = ctypes.c_void_p
    lib.acl_to_text.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_ssize_t)]
    lib.acl_to_text.restype = ctypes.c_void_p
    lib.acl_valid.argtypes = [ctypes.c_void_p]
    lib.acl_valid.restype = ctypes.c_int
    lib.acl_get_entry.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.POINTER(ctypes.c_void_p)]
    lib.acl_get_entry.restype = ctypes.c_int
    lib.acl_get_tag_type.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_int)]
    lib.acl_get_tag_type.restype = ctypes.c_int
    lib.acl_get_permset_mask_np.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_uint64)]
    lib.acl_get_permset_mask_np.restype = ctypes.c_int
    lib.acl_free.argtypes = [ctypes.c_void_p]
    lib.acl_free.restype = ctypes.c_int
    lib.flistxattr.argtypes = [ctypes.c_int, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_int]
    lib.flistxattr.restype = ctypes.c_ssize_t
    lib.fgetxattr.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_uint32, ctypes.c_int]
    lib.fgetxattr.restype = ctypes.c_ssize_t

    def acl(fd, parent=False):
        ctypes.set_errno(0)
        value = lib.acl_get_fd_np(fd, 0x100)  # ACL_TYPE_EXTENDED
        if not value and ctypes.get_errno() == errno.ENOENT:  # No extended ACL
            return b""
        require(value, "ACL_READ_FAILED")
        text = None
        try:
            require(lib.acl_valid(value) == 0, "ACL_INVALID")
            # Darwin sys/acl.h: only read_data, execute, read_attributes,
            # read_extattributes, read_security and synchronize may be granted.
            # Reject unknown permission bits too; do not parse acl_to_text as ls
            # output (native records use ':allow:', not ' allow ').
            readonly = sum(1 << bit for bit in (1, 3, 7, 9, 11, 20))
            for index in range(129):  # ACL_MAX_ENTRIES = 128, plus exhaustion check
                entry = ctypes.c_void_p()
                ctypes.set_errno(0)
                result = lib.acl_get_entry(value, index, ctypes.byref(entry))
                if result == -1 and ctypes.get_errno() == errno.EINVAL:
                    break  # Darwin: exhausted index on a validated ACL
                require(result == 0 and entry.value, "ACL_ENTRY_READ_FAILED")
                require(index < 128, "ACL_TOO_MANY_ENTRIES")
                tag = ctypes.c_int()
                require(lib.acl_get_tag_type(entry, ctypes.byref(tag)) == 0, "ACL_TAG_READ_FAILED")
                require(tag.value in (1, 2), "ACL_TAG_UNSUPPORTED")  # ALLOW, DENY
                if tag.value == 1:
                    require(not parent, "PARENT_ALLOW_ACL_UNSUPPORTED")
                    permissions = ctypes.c_uint64()
                    require(lib.acl_get_permset_mask_np(entry, ctypes.byref(permissions)) == 0,
                            "ACL_PERMISSIONS_READ_FAILED")
                    require(not permissions.value & ~readonly, "UNSAFE_FILE_ACL")
            length = ctypes.c_ssize_t()
            text = lib.acl_to_text(value, ctypes.byref(length))
            require(text and 0 <= length.value <= 65536, "ACL_TEXT_FAILED")
            return ctypes.string_at(text, length.value)
        finally:
            if text:
                lib.acl_free(text)
            lib.acl_free(value)

    def metadata(fd):
        s = os.fstat(fd)
        size = lib.flistxattr(fd, None, 0, 0)
        require(0 <= size <= 65536, "XATTR_LIST_FAILED")
        names = ctypes.create_string_buffer(size)
        require(lib.flistxattr(fd, names, size, 0) == size, "XATTR_LIST_DRIFT")
        attrs = {}
        for name in sorted(names.raw.split(b"\0")):
            if not name:
                continue
            length = lib.fgetxattr(fd, name, None, 0, 0, 0)
            require(0 <= length <= 1048576, "XATTR_READ_FAILED")
            value = ctypes.create_string_buffer(length)
            require(lib.fgetxattr(fd, name, value, length, 0, 0) == length, "XATTR_READ_DRIFT")
            attrs[name.hex()] = digest(value.raw)
        return {"uid": s.st_uid, "gid": s.st_gid, "mode": stat.S_IMODE(s.st_mode),
                "flags": s.st_flags, "mtime_ns": s.st_mtime_ns,
                "acl_sha256": digest(acl(fd)), "xattr_count": len(attrs),
                "xattrs_sha256": digest(json.dumps(attrs, sort_keys=True).encode())}

    def directory(path):
        fd = os.open("/", os.O_RDONLY | os.O_DIRECTORY)
        fds.append(fd)
        current = ""
        for part in path.split("/")[1:]:
            require(part not in ("", ".", ".."), "NONCANONICAL_PATH")
            current += "/" + part
            fd = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            fds.append(fd)
            s = os.fstat(fd)
            # Root-owned sticky shared ancestors are acceptable; the actual home,
            # source and destination directories must be owned and non-shared.
            shared = s.st_uid == 0 and bool(s.st_mode & stat.S_ISVTX)
            require(s.st_uid in (0, uid) and (not s.st_mode & 0o022 or shared), "UNSAFE_PARENT")
            parent_acl = acl(fd, parent=True)
            identity = (s.st_dev, s.st_ino, s.st_uid, s.st_gid, s.st_mode, s.st_flags, digest(parent_acl))
            require(current not in parents or parents[current] == identity, "PARENT_DRIFT")
            parents[current] = identity
        return fd

    def owned_directory(path):
        fd = directory(path)
        s = os.fstat(fd)
        require(s.st_uid == uid and not s.st_mode & 0o022, "UNSAFE_OWNED_DIRECTORY")
        return fd

    def read_file(fd):
        s = os.fstat(fd)
        require(stat.S_ISREG(s.st_mode) and s.st_uid == uid and s.st_nlink == 1,
                "UNSAFE_FILE_TYPE_OWNER_OR_LINKS")
        require(not s.st_mode & 0o7022 and 0 < s.st_size <= 2 * 1024 * 1024, "UNSAFE_FILE_MODE_OR_SIZE")
        acl(fd)  # Native ACE validation permits non-mutating grants only.
        os.lseek(fd, 0, os.SEEK_SET)
        data = os.read(fd, 2 * 1024 * 1024 + 1)
        require(len(data) == s.st_size, "FILE_READ_DRIFT")
        return data

    def snapshot(fd):
        data = read_file(fd)
        s = os.fstat(fd)
        return {"identity": [s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns, s.st_ctime_ns],
                "sha256": digest(data), "metadata": metadata(fd)}

    def open_file(parent, name):
        fd = os.open(name, os.O_RDONLY | os.O_NONBLOCK | os.O_NOFOLLOW, dir_fd=parent)
        fds.append(fd)
        return fd

    def checked(parent, name):
        fd = open_file(parent, name)
        return fd, snapshot(fd)

    homefd = owned_directory(home)
    srcdir = owned_directory(os.path.dirname(script))
    checked(srcdir, os.path.basename(script))
    bindir = owned_directory(home + "/.kingdom/bin")
    plistdir = owned_directory(home + "/Library/LaunchAgents")
    runner = "chain-backup-remote.ts"
    label = "com.kingdom.chain-backup"
    srcfd, source = checked(srcdir, runner)
    dstfd, installed = checked(bindir, runner)
    require(source["sha256"] == expected_source, "SOURCE_HASH_MISMATCH")
    require(installed["sha256"] == expected_installed, "INSTALLED_HASH_MISMATCH")
    require(source["identity"][:2] != installed["identity"][:2], "SOURCE_IS_DESTINATION")
    wrapperfd, wrapper = checked(bindir, "run-chain-backup.sh")
    plistfd, plist_snapshot = checked(plistdir, label + ".plist")
    plist = plistlib.loads(read_file(plistfd))
    wrapperpath = home + "/.kingdom/bin/run-chain-backup.sh"
    plistpath = home + "/Library/LaunchAgents/" + label + ".plist"
    require(plist.get("Label") == label and plist.get("ProgramArguments") == ["/bin/bash", wrapperpath]
            and "Program" not in plist and plist.get("RunAtLoad") is False
            and plist.get("StartCalendarInterval") == {"Hour": 3, "Minute": 33}
            and not plist.get("KeepAlive") and not plist.get("StartInterval"), "PLIST_BINDING_OR_SCHEDULE")

    def command(args, accepted=(0,)):
        # Bound both intake and duration, never forward command output/argv on
        # failure. Only observational launchctl print and PID-only pgrep are used.
        with subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL) as proc:
            output = bytearray()
            deadline = time.monotonic() + 5
            try:
                with selectors.DefaultSelector() as selector:
                    selector.register(proc.stdout, selectors.EVENT_READ)
                    while True:
                        require(time.monotonic() < deadline, "OBSERVATION_TIMEOUT")
                        if not selector.select(min(0.1, max(0, deadline - time.monotonic()))):
                            continue
                        chunk = os.read(proc.stdout.fileno(), 4096)
                        if not chunk:
                            break
                        output.extend(chunk)
                        require(len(output) <= 131072, "OBSERVATION_OVERSIZE")
                code = proc.wait(timeout=max(0.01, deadline - time.monotonic()))
                require(code in accepted, "OBSERVATION_FAILED")
                return code, output.decode("utf-8", errors="strict")
            finally:
                if proc.poll() is None:
                    proc.kill()  # Only our read-only observer subprocess, never a job.
                    proc.wait()

    def quiet():
        now = datetime.datetime.now()
        require(not 198 <= now.hour * 60 + now.minute <= 228, "SCHEDULE_WINDOW")
        _, out = command(["launchctl", "print", "gui/%s/%s" % (uid, label)])
        def field(name):
            values = re.findall(r"^\t" + re.escape(name) + r" = (.+)$", out, re.M)
            require(len(values) == 1, "JOB_METADATA_UNKNOWN")
            return values[0]
        require(field("state") == "not running" and field("active count") == "0"
                and not re.search(r"^\tpid =", out, re.M), "JOB_ACTIVE_OR_UNKNOWN")
        require(field("path") == plistpath and field("program") == "/bin/bash", "REGISTERED_JOB_BINDING")
        args = re.findall(r"^\targuments = \{\n(.*?)^\t\}", out, re.M | re.S)
        require(len(args) == 1 and args[0].splitlines() == ["\t\t/bin/bash", "\t\t" + wrapperpath], "REGISTERED_ARGUMENTS_UNKNOWN")
        code, pids = command(["pgrep", "-f", r"(^|[ /])(chain-backup-remote\.ts|run-chain-backup\.sh|chain-backup-to-tigris\.sh)([ \t]|$)"], (0, 1))
        require(code == 1 and not pids.strip(), "LOCAL_INVOCATION_ACTIVE_OR_UNKNOWN")

    def recheck():
        # Rewalk names as well as checking held descriptors, including metadata.
        for path in list(parents):
            directory(path)
        for parent, name, fd, before in [(srcdir, runner, srcfd, source), (bindir, runner, dstfd, installed),
                (bindir, "run-chain-backup.sh", wrapperfd, wrapper), (plistdir, label + ".plist", plistfd, plist_snapshot)]:
            require(snapshot(fd) == before and checked(parent, name)[1] == before, "FILE_IDENTITY_OR_BYTES_DRIFT")

    def create(parent, name):
        fd = os.open(name, os.O_RDWR | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=parent)
        fds.append(fd)
        return fd

    def write_all(fd, data):
        view = memoryview(data)
        while view:
            count = os.write(fd, view)
            require(count > 0, "SHORT_WRITE")
            view = view[count:]

    def copy(fromfd, tofd, flags):
        os.lseek(fromfd, 0, os.SEEK_SET)
        os.lseek(tofd, 0, os.SEEK_SET)
        require(lib.fcopyfile(fromfd, tofd, None, flags) == 0, "METADATA_COPY_FAILED")
        os.fsync(tofd)

    receipt["phase"] = "observations"
    quiet()
    time.sleep(2)
    quiet()
    recheck()
    # Exclusive transaction marker serializes only other instances of this
    # installer. A stale marker requires inspection, not automatic deletion.
    os.mkdir(".chain-backup-replace.lock", 0o700, dir_fd=bindir)
    lock = True
    receipt["phase"] = "rollback"
    rollback = ".chain-backup-rollback-" + uuid.uuid4().hex
    os.mkdir(rollback, 0o700, dir_fd=bindir)
    rollbackfd = os.open(rollback, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=bindir)
    fds.append(rollbackfd)
    oldfd = create(rollbackfd, runner)
    copy(dstfd, oldfd, 15)  # COPYFILE_ALL
    require(snapshot(oldfd)["sha256"] == expected_installed and metadata(oldfd) == installed["metadata"], "ROLLBACK_VERIFICATION_FAILED")
    receipt["phase"] = "staging"
    stage = ".chain-backup-stage-" + uuid.uuid4().hex
    stagefd = create(bindir, stage)
    write_all(stagefd, read_file(srcfd))
    copy(dstfd, stagefd, 7)  # COPYFILE_METADATA; old times/mode/owner/ACL/xattrs
    staged = snapshot(stagefd)
    require(staged["sha256"] == expected_source and staged["metadata"] == installed["metadata"], "STAGE_VERIFICATION_FAILED")
    receipt.update({"source_sha256": expected_source, "previous_sha256": expected_installed,
                    "rollback_sha256": snapshot(oldfd)["sha256"], "metadata": installed["metadata"],
                    "wrapper_sha256": wrapper["sha256"], "plist_sha256": plist_snapshot["sha256"],
                    "schedule": "03:33 local", "run_at_load": False})
    prepared = create(rollbackfd, "prepared.json")
    write_all(prepared, (json.dumps(dict(receipt, status="PREPARED"), sort_keys=True) + "\n").encode())
    os.fsync(prepared)
    os.fsync(rollbackfd)
    os.fsync(bindir)
    receipt["phase"] = "final_checks"
    quiet()
    recheck()
    require(snapshot(stagefd) == staged and checked(bindir, stage)[1] == staged, "STAGE_DRIFT")
    require(snapshot(oldfd)["sha256"] == expected_installed and metadata(oldfd) == installed["metadata"], "ROLLBACK_DRIFT")
    # The final name check and rename are not a compare-and-swap against hostile
    # same-UID writers. Controlled non-shared parents and a quiet operator window
    # are required. Destination publication itself is a single atomic rename.
    receipt["phase"] = "publication"
    os.replace(stage, runner, src_dir_fd=bindir, dst_dir_fd=bindir)
    published = True
    stage = None
    os.fsync(bindir)
    after = checked(bindir, runner)[1]
    require(after["identity"][:4] == staged["identity"][:4] and after["sha256"] == expected_source
            and after["metadata"] == installed["metadata"], "POST_RENAME_VERIFICATION_FAILED")
    for parent, name, before in [(bindir, "run-chain-backup.sh", wrapper), (plistdir, label + ".plist", plist_snapshot)]:
        require(checked(parent, name)[1] == before, "POST_RENAME_BINDING_DRIFT")
    receipt.update({"status": "REPLACED", "phase": "receipt", "installed_sha256": expected_source})
    final = create(rollbackfd, "receipt.json")
    write_all(final, (json.dumps(receipt, sort_keys=True) + "\n").encode())
    os.fsync(final)
    os.fsync(rollbackfd)
except Exception as error:
    receipt.update({"status": "ERROR", "error": str(error) if isinstance(error, Refuse) else "LOCAL_OPERATION_FAILED"})
    if isinstance(error, OSError):
        receipt["errno"] = error.errno
finally:
    # Never restore the old runner automatically, including after publication or
    # a later capture's exit 3: that would reinstate legacy pruning.
    try:
        if stage:
            os.unlink(stage, dir_fd=bindir)
        if lock:
            os.rmdir(".chain-backup-replace.lock", dir_fd=bindir)
            os.fsync(bindir)
    except OSError:
        receipt.update({"status": "ERROR", "error": "CLEANUP_FAILED"})
    for fd in reversed(fds):
        os.close(fd)
    receipt["runner_replaced"] = published
    if rollback:
        receipt["rollback_directory"] = home + "/.kingdom/bin/" + rollback
    print(json.dumps(receipt, sort_keys=True))
sys.exit(0 if receipt["status"] == "REPLACED" else 1)
PY
fi

# Legacy schedule installation is deliberately a separate, explicit action.
# It creates/overwrites wrapper/plist and reloads launchd; not part of replacement.
KOS="$(cd "$(dirname "$script")/.." && pwd)"
DEST="$home/.kingdom"
LABEL="com.kingdom.chain-backup"
PLIST="$home/Library/LaunchAgents/$LABEL.plist"
mkdir -p "$DEST/bin" "$DEST/logs" "$home/Library/LaunchAgents"
cp "$KOS/bin/chain-backup-remote.ts" "$DEST/bin/chain-backup-remote.ts"
# Bash %q binds the explicit target, including spaces and shell metacharacters,
# without interpreting it as generated code or inheriting a different HOME.
{
  printf '%s\n' '#!/bin/bash' '# launchd wrapper: kingdom chain backup (keychain creds; flyctl on PATH).' 'set -uo pipefail'
  printf 'export HOME=%q\n' "$home"
  # shellcheck disable=SC2016 # HOME expands when the generated wrapper runs.
  printf '%s\n' 'export PATH="/opt/homebrew/bin:/usr/bin:/bin"' 'exec /opt/homebrew/bin/bun "$HOME/.kingdom/bin/chain-backup-remote.ts"'
} > "$DEST/bin/run-chain-backup.sh"
chmod +x "$DEST/bin/run-chain-backup.sh"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>$LABEL</string>
<key>ProgramArguments</key><array><string>/bin/bash</string><string>$DEST/bin/run-chain-backup.sh</string></array>
<key>RunAtLoad</key><false/>
<key>StartCalendarInterval</key><dict><key>Hour</key><integer>3</integer><key>Minute</key><integer>33</integer></dict>
<key>StandardOutPath</key><string>$DEST/logs/chain-backup.log</string>
<key>StandardErrorPath</key><string>$DEST/logs/chain-backup.log</string>
</dict></plist>
EOF
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
printf '%s\n' 'chain backup scheduled: nightly 03:33 (RunAtLoad=false)'
