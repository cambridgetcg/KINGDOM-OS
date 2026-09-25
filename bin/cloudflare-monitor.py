#!/usr/bin/env python3
"""One bounded private Cloudflare observation; no login, daemon, or deletion.

The collector and renderer are loaded from this release's bin directory. Raw
subprocess output is temporary and never copied into reports or launchd logs.
Python 3.11+, POSIX (launchd output is for macOS).
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
import fcntl
import html
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import signal
import stat
import subprocess
import sys
import tempfile
import threading
import time
import tomllib
import uuid

UTC = timezone.utc
MAX_CONFIG_BYTES = 16_384
MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024
MAX_REPORT_BYTES = 32 * 1024 * 1024
MAX_CHILD_OUTPUT = 1024 * 1024
COLLECTOR_TIMEOUT = 600
RENDERER_TIMEOUT = 60
REFRESH_TIMEOUT = 45
LABEL = "com.kingdom.cloudflare-observer"
_ACTIVE_INTERRUPTION = None


class MonitorError(Exception):
    """Content-free, constant diagnostic codes only."""


def utc(value):
    return value.astimezone(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")


def absolute_path(value):
    if not isinstance(value, str) or not value or any(ord(c) < 32 for c in value):
        raise MonitorError("invalid_path")
    path = Path(value).expanduser()
    if not path.is_absolute() or ".." in path.parts:
        raise MonitorError("absolute_path_required")
    return path


def open_directory(path, *, private=True):
    """Walk every component with no-follow descriptors, including ancestors."""
    path = absolute_path(str(path))
    descriptor = os.open("/", os.O_RDONLY | os.O_DIRECTORY)
    try:
        for component in path.parts[1:]:
            child = os.open(component, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW,
                            dir_fd=descriptor)
            os.close(descriptor)
            descriptor = child
        info = os.fstat(descriptor)
        if private and (info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o700):
            raise MonitorError("directory_not_private")
        return descriptor
    except BaseException:
        os.close(descriptor)
        raise


def private_read(path, limit):
    parent = open_directory(path.parent)
    try:
        descriptor = os.open(path.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK,
                             dir_fd=parent)
        with os.fdopen(descriptor, "rb") as stream:
            info = os.fstat(stream.fileno())
            if (not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid()
                    or stat.S_IMODE(info.st_mode) != 0o600 or info.st_nlink != 1):
                raise MonitorError("file_not_private")
            value = stream.read(limit + 1)
            if len(value) > limit:
                raise MonitorError("file_too_large")
            return value
    finally:
        os.close(parent)


def unique_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise MonitorError("duplicate_json_key")
        result[key] = value
    return result


def parse_json(value):
    return json.loads(value, object_pairs_hook=unique_keys,
                      parse_constant=lambda _: (_ for _ in ()).throw(MonitorError("invalid_json_number")))


def load_config(path):
    value = parse_json(private_read(path, MAX_CONFIG_BYTES))
    if not isinstance(value, dict) or set(value) - {
        "account_id", "output_root", "wrangler_executable",
    }:
        raise MonitorError("invalid_config")
    if not isinstance(value.get("account_id"), str) or not re.fullmatch(r"[0-9a-fA-F]{32}", value["account_id"]):
        raise MonitorError("invalid_account_id")
    root = absolute_path(value.get("output_root"))
    descriptor = open_directory(root)
    os.close(descriptor)
    config = {"account_id": value["account_id"], "output_root": root}
    if "wrangler_executable" in value:
        config["wrangler_executable"] = absolute_path(value["wrangler_executable"])
    return config


def write_new(directory, name, value):
    descriptor = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                         0o600, dir_fd=directory)
    with os.fdopen(descriptor, "wb") as stream:
        os.fchmod(stream.fileno(), 0o600)
        stream.write(value)
        stream.flush()
        os.fsync(stream.fileno())


def json_bytes(value):
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()


def check_replaceable(directory, name):
    try:
        existing = os.stat(name, dir_fd=directory, follow_symlinks=False)
        if (not stat.S_ISREG(existing.st_mode) or existing.st_uid != os.getuid()
                or stat.S_IMODE(existing.st_mode) != 0o600 or existing.st_nlink != 1):
            raise MonitorError("replacement_not_private")
    except FileNotFoundError:
        pass


def replace_private(directory, name, value):
    check_replaceable(directory, name)
    temporary = f".{name}-{uuid.uuid4().hex}.tmp"
    write_new(directory, temporary, value)
    try:
        os.replace(temporary, name, src_dir_fd=directory, dst_dir_fd=directory)
        os.fsync(directory)
    finally:
        try:
            os.unlink(temporary, dir_fd=directory)
        except FileNotFoundError:
            pass


@contextmanager
def exclusive_run(root):
    descriptor = os.open(".monitor.lock", os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW | os.O_NONBLOCK,
                         0o600, dir_fd=root)
    try:
        info = os.fstat(descriptor)
        if (not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid()
                or stat.S_IMODE(info.st_mode) != 0o600 or info.st_nlink != 1):
            raise MonitorError("lock_not_private")
        try:
            fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise MonitorError("run_already_active") from None
        yield
    finally:
        os.close(descriptor)


@contextmanager
def interrupt_cleanup():
    global _ACTIVE_INTERRUPTION
    if threading.current_thread() is not threading.main_thread():
        raise MonitorError("main_thread_required")
    previous = {kind: signal.getsignal(kind) for kind in (signal.SIGTERM, signal.SIGINT)}
    previous_state = _ACTIVE_INTERRUPTION
    state = {"received": False}
    _ACTIVE_INTERRUPTION = state
    def interrupted(_signum, _frame):
        state["received"] = True
    try:
        for kind in previous:
            signal.signal(kind, interrupted)
        yield state
    finally:
        for kind, handler in previous.items():
            signal.signal(kind, handler)
        _ACTIVE_INTERRUPTION = previous_state


def check_interrupted():
    if _ACTIVE_INTERRUPTION is not None and _ACTIVE_INTERRUPTION["received"]:
        raise MonitorError("interrupted")


def stop_group(process):
    def send(kind):
        try:
            os.killpg(process.pid, kind)
            return True
        except ProcessLookupError:
            return True
        except OSError:
            # macOS can report EPERM for an exited, unreaped leader. Establish
            # group absence after reaping; never equate permission failure with
            # successful cleanup of a still-live descendant.
            process.poll()
            try:
                os.killpg(process.pid, 0)
            except ProcessLookupError:
                return True
            except OSError:
                pass
            return False
    process.poll()
    success = send(signal.SIGTERM)
    if process.poll() is None:
        try:
            process.wait(timeout=0.15)
        except subprocess.TimeoutExpired:
            pass
    success = send(signal.SIGKILL) and success
    try:
        process.wait(timeout=5)
    except (subprocess.TimeoutExpired, OSError):
        success = False
    if not success:
        raise MonitorError("child_cleanup_failed")


def run_child(argv, *, cwd, environ, timeout, extra_output=None):
    """Own and reap a process group, including descendants after leader exit."""
    with tempfile.TemporaryFile(dir=cwd) as output:
        process = None
        try:
            check_interrupted()
            process = subprocess.Popen(argv, cwd=cwd, env=environ, stdin=subprocess.DEVNULL,
                                       stdout=output, stderr=output, start_new_session=True,
                                       close_fds=True)
            deadline = time.monotonic() + timeout
            while True:
                check_interrupted()
                output_size = os.fstat(output.fileno()).st_size
                if extra_output is not None:
                    output_size += os.stat(extra_output, follow_symlinks=False).st_size
                if output_size > MAX_CHILD_OUTPUT:
                    return {"state": "output_limit", "returncode": None}
                code = process.poll()
                if code is not None:
                    return {"state": "exited", "returncode": code}
                if time.monotonic() >= deadline:
                    return {"state": "timed_out", "returncode": None}
                time.sleep(0.05)
        finally:
            if process is not None:
                stop_group(process)


def oauth_metadata(environ, home):
    base = home / "Library/Preferences" if sys.platform == "darwin" else Path(
        environ.get("XDG_CONFIG_HOME", str(home / ".config")))
    candidates = [base / ".wrangler/config/default.toml", home / ".wrangler/config/default.toml"]
    for path in candidates:
        try:
            parent = open_directory(path.parent, private=False)
        except FileNotFoundError:
            continue
        try:
            try:
                descriptor = os.open(path.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK,
                                     dir_fd=parent)
            except FileNotFoundError:
                continue
            with os.fdopen(descriptor, "rb") as stream:
                info = os.fstat(stream.fileno())
                if (not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid()
                        or stat.S_IMODE(info.st_mode) & 0o077 or info.st_nlink != 1):
                    raise MonitorError("oauth_config_not_private")
                raw = stream.read(128 * 1024 + 1)
            if len(raw) > 128 * 1024:
                raise MonitorError("oauth_config_too_large")
            data = tomllib.loads(raw.decode())
            token = data.get("oauth_token")
            if not isinstance(token, str) or not token or any(c.isspace() for c in token):
                raise MonitorError("oauth_unavailable")
            expiry = data.get("expiration_time")
            if not isinstance(expiry, str):
                raise MonitorError("oauth_expiry_unknown")
            try:
                parsed = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
                if parsed.tzinfo is None:
                    raise ValueError()
                return parsed.astimezone(UTC)
            except ValueError:
                raise MonitorError("oauth_expiry_unknown") from None
        finally:
            os.close(parent)
    raise MonitorError("oauth_unavailable")


def child_environment(environ):
    env = dict(environ)
    env.update({"CI": "1", "WRANGLER_SEND_METRICS": "false", "BROWSER": "false",
                "NO_COLOR": "1", "PYTHONUNBUFFERED": "1"})
    return env


def checked_executable(path):
    path = absolute_path(str(path))
    parent = open_directory(path.parent, private=False)
    try:
        info = os.stat(path.name, dir_fd=parent, follow_symlinks=False)
        if (not stat.S_ISREG(info.st_mode) or info.st_uid not in (0, os.getuid())
                or stat.S_IMODE(info.st_mode) & 0o022 or not os.access(path, os.X_OK)):
            raise MonitorError("unsafe_executable")
    finally:
        os.close(parent)
    return path


def ensure_auth(config, *, environ, home, now, run_dir):
    if "CLOUDFLARE_API_TOKEN" in environ:
        token = environ["CLOUDFLARE_API_TOKEN"]
        if not token or len(token) > 8192 or any(c.isspace() for c in token):
            raise MonitorError("environment_credential_invalid")
        return "child_environment"
    expiry = oauth_metadata(environ, home)
    if expiry > now + timedelta(minutes=5):
        return "existing_oauth"
    configured = config.get("wrangler_executable")
    candidate = configured or shutil.which("wrangler", path=environ.get("PATH", os.defpath))
    if candidate is None:
        raise MonitorError("wrangler_unavailable")
    # Explicit paths must be exact; resolving the default executable avoids
    # treating a package-manager's bin symlink as our configured release path.
    executable = checked_executable(candidate if configured else Path(candidate).resolve(strict=True))
    # Wrangler writes a debug file even with console logging disabled. Keep
    # that child-only file private, bounded, and temporary too.
    with tempfile.NamedTemporaryFile(dir=run_dir, suffix=".log") as native_log:
        refresh_env = {**environ, "WRANGLER_LOG_PATH": native_log.name, "WRANGLER_LOG_SANITIZE": "true"}
        result = run_child([str(executable), "whoami"], cwd=run_dir, environ=refresh_env,
                           timeout=REFRESH_TIMEOUT, extra_output=native_log.name)
    if result["state"] != "exited" or result["returncode"] != 0:
        raise MonitorError("oauth_refresh_" + (result["state"] if result["state"] != "exited" else "failed"))
    if oauth_metadata(environ, home) <= now + timedelta(minutes=5):
        raise MonitorError("oauth_refresh_unconfirmed")
    return "refreshed_existing_oauth"


def coverage_from_snapshot(path, *, account_id=None, expected_window=None):
    value = parse_json(private_read(path, MAX_SNAPSHOT_BYTES))
    if not isinstance(value, dict) or value.get("schema") != "kingdom.cloudflare-traffic/0.1":
        raise MonitorError("snapshot_invalid")
    if value.get("provider_writes") is not False:
        raise MonitorError("snapshot_not_read_only")
    if account_id is not None and (not isinstance(value.get("scope"), dict)
                                    or value["scope"].get("account_id") != account_id):
        raise MonitorError("snapshot_account_mismatch")
    if expected_window is not None and value.get("window") != expected_window:
        raise MonitorError("snapshot_window_mismatch")
    coverage = value.get("coverage")
    keys = ("observations", "ok", "unavailable", "errors")
    if (not isinstance(coverage, dict) or type(coverage.get("complete")) is not bool
            or any(type(coverage.get(key)) is not int or not 0 <= coverage[key] <= 100_000 for key in keys)
            or coverage["observations"] != sum(coverage[key] for key in keys[1:])
            or (coverage["complete"] and (coverage["unavailable"] or coverage["errors"]))):
        raise MonitorError("snapshot_coverage_invalid")
    return {"complete": coverage["complete"], **{key: coverage[key] for key in keys}}


def fallback_report(directory, report):
    lines = ["# Cloudflare daily observation", "", "Coverage: UNKNOWN", "",
             "This attempt did not produce a verified traffic report. No conclusion about zero traffic or service health is possible.",
             "", f"Run: {report['run_id']}", f"Window end (UTC): {report['window_end']}", "",
             "Diagnostics:", *[f"- {entry['phase']}: {entry['code']}" for entry in report["errors"]], "",
             "Previous evidence is retained. Authentication repair is interactive and must be performed separately.", ""]
    text = "\n".join(lines)
    replace_private(directory, "REPORT.md", text.encode())
    page = '<!doctype html><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Cloudflare observation unavailable</title><pre>' + html.escape(text) + "</pre>\n"
    replace_private(directory, "index.html", page.encode())


def bookmark_page(pointer):
    """Static local entry; links never navigate automatically or leave the run root."""
    def report_link(reference, label):
        if not isinstance(reference, str) or not re.fullmatch(r"runs/\d{8}T\d{6}Z-[0-9a-f]{12}", reference):
            raise MonitorError("invalid_run_reference")
        return f'<p><a href="{html.escape(reference, quote=True)}/index.html">{label}</a></p>'
    page = ['<!doctype html><html lang="en"><head><meta charset="utf-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1">',
            '<meta name="referrer" content="no-referrer">',
            '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; base-uri \'none\'; form-action \'none\'">',
            '<title>Cloudflare local reports</title></head><body><main><h1>Cloudflare local reports</h1>',
            '<p>Latest attempt: <strong>' + html.escape(pointer["state"].upper()) + '</strong></p>',
            '<p>Traffic window (UTC): ' + html.escape(pointer["window"]["start"]) + ' to ' + html.escape(pointer["window"]["end"]) + '</p>',
            '<p>Updated: ' + html.escape(pointer["updated_at"]) + '</p>',
            report_link(pointer["run"], "Open the latest attempt report")]
    if pointer["state"] == "error":
        page.append('<p>This attempt has no verified report. Activity is unknown; a failed observation does not mean zero traffic.</p>')
    elif pointer["state"] == "degraded":
        page.append('<p>Coverage is incomplete. Read the report for unavailable datasets and limitations.</p>')
    previous = pointer.get("last_successful_run")
    if previous is not None and previous != pointer["run"]:
        page.append(report_link(previous, "Open the previous successfully rendered report"))
    page.append('<p><a href="latest.json">Authoritative latest-attempt record</a>. Snapshots remain local until their owner removes them.</p></main></body></html>\n')
    return "\n".join(page).encode()


def run_monitor(config, *, daily=True, now=None, environ=None, home=None, bin_dir=None):
    now = datetime.now(UTC) if now is None else now.astimezone(UTC)
    env = child_environment(os.environ if environ is None else environ)
    home = Path.home() if home is None else Path(home)
    bin_dir = Path(__file__).absolute().parent if bin_dir is None else Path(bin_dir)
    end = now.replace(hour=0, minute=0, second=0, microsecond=0) if daily else now.replace(minute=0, second=0, microsecond=0)
    root_path = config["output_root"]
    root = open_directory(root_path)
    try:
        with exclusive_run(root):
            # Refuse unsafe entry targets before authentication or network work.
            for name in ("latest.json", "index.html"):
                check_replaceable(root, name)
            try:
                os.mkdir("runs", 0o700, dir_fd=root)
            except FileExistsError:
                pass
            runs = open_directory(root_path / "runs")
            run_id = now.strftime("%Y%m%dT%H%M%SZ") + "-" + uuid.uuid4().hex[:12]
            try:
                os.mkdir(run_id, 0o700, dir_fd=runs)
            finally:
                os.close(runs)
            run_path = root_path / "runs" / run_id
            directory = open_directory(run_path)
            report = {"schema": "kingdom.cloudflare-monitor/0.1", "run_id": run_id,
                      "started_at": utc(now), "mode": "previous_utc_day" if daily else "rolling_24h",
                      "window_start": utc(end - timedelta(days=1)), "window_end": utc(end),
                      "state": "error", "coverage": None, "errors": [],
                      "retention": {"policy": "retained_until_owner_removes", "automatic_deletion": False}}
            phase = "authentication"
            try:
                with interrupt_cleanup():
                    report["authentication"] = ensure_auth(config, environ=env, home=home,
                                                           now=now, run_dir=run_path)
                    phase = "collector"
                    collector = bin_dir / "cloudflare-traffic.py"
                    renderer = bin_dir / "cloudflare-traffic-report.py"
                    for script in (collector, renderer):
                        parent = open_directory(script.parent, private=False)
                        try:
                            info = os.stat(script.name, dir_fd=parent, follow_symlinks=False)
                            if (not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid()
                                    or stat.S_IMODE(info.st_mode) & 0o022):
                                raise MonitorError("release_script_unsafe")
                        finally:
                            os.close(parent)
                    snapshot = run_path / "snapshot.json"
                    result = run_child([sys.executable, str(collector), "--account-id", config["account_id"],
                                        "--output", str(snapshot), "--window-end", utc(end)],
                                       cwd=run_path, environ=env, timeout=COLLECTOR_TIMEOUT)
                    if result["state"] != "exited" or result["returncode"] != 0:
                        raise MonitorError("collector_" + (result["state"] if result["state"] != "exited" else "failed"))
                    report["coverage"] = coverage_from_snapshot(snapshot, account_id=config["account_id"],
                        expected_window={"start": report["window_start"], "end": report["window_end"]})
                    phase = "renderer"
                    result = run_child([sys.executable, str(renderer), str(snapshot), "--output-dir", str(run_path)],
                                       cwd=run_path, environ=env, timeout=RENDERER_TIMEOUT)
                    if result["state"] != "exited" or result["returncode"] != 0:
                        raise MonitorError("renderer_" + (result["state"] if result["state"] != "exited" else "failed"))
                    for name in ("REPORT.md", "index.html"):
                        if not private_read(run_path / name, MAX_REPORT_BYTES):
                            raise MonitorError("renderer_output_empty")
                    check_interrupted()
                    report["state"] = "complete" if report["coverage"]["complete"] else "degraded"
            except MonitorError as error:
                report["errors"].append({"phase": phase, "code": str(error)})
            except (OSError, ValueError, subprocess.SubprocessError):
                report["errors"].append({"phase": phase, "code": "local_operation_failed"})
            try:
                if report["state"] == "error":
                    fallback_report(directory, report)
                report["finished_at"] = utc(datetime.now(UTC))
                write_new(directory, "run.json", json_bytes(report))
                last_successful = None
                try:
                    previous = parse_json(private_read(root_path / "latest.json", MAX_CONFIG_BYTES))
                    candidate = previous.get("last_successful_run") if isinstance(previous, dict) else None
                    if isinstance(candidate, str) and re.fullmatch(r"runs/\d{8}T\d{6}Z-[0-9a-f]{12}", candidate):
                        last_successful = candidate
                except FileNotFoundError:
                    pass
                if report["state"] in ("complete", "degraded"):
                    last_successful = "runs/" + run_id
                pointer = {"schema": "kingdom.cloudflare-monitor-latest/0.1", "run": "runs/" + run_id,
                           "state": report["state"], "coverage": report["coverage"],
                           "window": {"start": report["window_start"], "end": report["window_end"]},
                           "updated_at": report["finished_at"],
                           "last_successful_run": last_successful}
                replace_private(root, "latest.json", json_bytes(pointer))
                replace_private(root, "index.html", bookmark_page(pointer))
                return report
            finally:
                os.close(directory)
    finally:
        os.close(root)


def launchd_plist(config_path, config):
    python = Path(sys.executable).resolve(strict=True)
    runner = Path(__file__).absolute()
    # plistlib escapes values as XML; paths are individual argv entries.
    value = {"Label": LABEL, "ProgramArguments": [str(python), str(runner), "--config", str(config_path), "--daily"],
             "WorkingDirectory": str(config["output_root"]), "RunAtLoad": False,
             "StartCalendarInterval": {"Hour": 8, "Minute": 15}, "ProcessType": "Background", "Umask": 0o077,
             "EnvironmentVariables": {"PATH": "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin", "HOME": str(Path.home())},
             "StandardOutPath": str(config["output_root"] / "launchd.stdout.log"),
             "StandardErrorPath": str(config["output_root"] / "launchd.stderr.log")}
    return plistlib.dumps(value, sort_keys=False)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True, help="existing private JSON config (0600, private 0700 parent)")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--daily", action="store_true", help="previous UTC day (default)")
    mode.add_argument("--rolling", action="store_true", help="24h ending at the last completed UTC hour")
    parser.add_argument("--print-launchd", action="store_true", help="print 08:15 local schedule; do not install or start it")
    args = parser.parse_args(argv)
    try:
        config_path = absolute_path(args.config)
        config = load_config(config_path)
        if args.print_launchd:
            sys.stdout.buffer.write(launchd_plist(config_path, config))
            return 0
        report = run_monitor(config, daily=not args.rolling)
        print(json.dumps({"state": report["state"], "run_id": report["run_id"]}))
        return 0 if report["state"] in ("complete", "degraded") else 1
    except (MonitorError, OSError, ValueError, subprocess.SubprocessError) as error:
        code = str(error) if isinstance(error, MonitorError) else "local_operation_failed"
        print(json.dumps({"state": "error", "code": code}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
