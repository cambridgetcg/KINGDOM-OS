import contextlib
from datetime import datetime, timedelta, timezone
import importlib.util
import io
import json
import os
from pathlib import Path
import plistlib
import shutil
import signal
import stat
import subprocess
import sys
import tempfile
import time
import unittest
from unittest import mock


SOURCE = Path(__file__).resolve().parents[1] / "bin/cloudflare-monitor.py"
spec = importlib.util.spec_from_file_location("cloudflare_monitor", SOURCE)
monitor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor)
ACCOUNT = "a" * 32
SECRET = "PRIVATE_CREDENTIAL_SENTINEL"
NOW = datetime(2026, 9, 25, 7, 15, tzinfo=timezone.utc)


def private_write(path, value):
    path.write_text(value)
    path.chmod(0o600)


def alive(pid):
    result = subprocess.run(["ps", "-o", "stat=", "-p", str(pid)],
                            capture_output=True, text=True, timeout=2)
    return bool(result.stdout.strip()) and not result.stdout.lstrip().startswith("Z")


class MonitorTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.base = Path(self.temporary.name).resolve()
        self.base.chmod(0o700)
        self.output = self.base / "reports & observations"
        self.output.mkdir(mode=0o700)
        self.config_path = self.base / "config & observer.json"
        private_write(self.config_path, json.dumps({"account_id": ACCOUNT, "output_root": str(self.output)}))
        self.config = monitor.load_config(self.config_path)
        self.tools = self.base / "bin"
        self.tools.mkdir(mode=0o700)
        self.environ = {"PATH": os.defpath, "CLOUDFLARE_API_TOKEN": SECRET}
        self.make_tools()

    def tearDown(self):
        self.temporary.cleanup()

    def make_tools(self, *, complete=True, collector_extra="", renderer_extra=""):
        coverage = {"complete": complete, "observations": 2, "ok": 2 if complete else 1,
                    "unavailable": 0 if complete else 1, "errors": 0}
        payload = {"schema": "kingdom.cloudflare-traffic/0.1", "provider_writes": False,
                   "observed_at": "2026-09-25T07:15:00Z", "limitations": ["adaptive_estimates_not_unique_people"],
                   "scope": {"account_id": ACCOUNT, "zones_expected": 1, "zone_names": ["example.test"]},
                   "coverage": coverage, "observations": [
                       {"scope": "zone", "name": "example.test", "view": "traffic_total", "dataset": "httpRequestsAdaptiveGroups",
                        "state": "ok", "sampled": True, "truncated": False, "group_limit": 100, "rows_received": 1,
                        "rows": [{"requests": 12, "dimensions": {}}]},
                       {"scope": "account", "name": "Cloudflare account", "view": "workers", "dataset": "workersInvocationsAdaptive",
                        "state": "ok" if complete else "unavailable", "sampled": True, "truncated": False,
                        "group_limit": 100, "rows_received": 1 if complete else 0,
                        "rows": [{"requests": 42, "dimensions": {}}] if complete else [],
                        **({} if complete else {"reason": "plan_unavailable"})},
                   ]}
        collector = f'''import json, os, pathlib, sys
from datetime import datetime, timedelta
{collector_extra}
out = pathlib.Path(sys.argv[sys.argv.index("--output") + 1])
assert sys.argv[sys.argv.index("--account-id") + 1] == {ACCOUNT!r}
assert {SECRET!r} not in str(sys.argv)
assert os.environ.get("CI") == "1"
assert os.environ.get("BROWSER") == "false"
data = {payload!r}
end = sys.argv[sys.argv.index("--window-end") + 1]
data["window"] = {{"start": (datetime.fromisoformat(end.replace("Z", "+00:00")) - timedelta(days=1)).isoformat(timespec="seconds").replace("+00:00", "Z"), "end": end}}
data["history_window"] = {{"start": (datetime.fromisoformat(end.replace("Z", "+00:00")) - timedelta(days=7)).isoformat(timespec="seconds").replace("+00:00", "Z"), "end": end}}
for observation in data["observations"]: observation["window"] = data["window"]
fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, "w") as f: json.dump(data, f)
'''
        renderer = f'''import os, pathlib, sys
{renderer_extra}
out = pathlib.Path(sys.argv[sys.argv.index("--output-dir") + 1])
for name in ("REPORT.md", "index.html"):
    fd = os.open(out / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as f: f.write("Coverage: {"COMPLETE" if complete else "DEGRADED"}")
'''
        private_write(self.tools / "cloudflare-traffic.py", collector)
        private_write(self.tools / "cloudflare-traffic-report.py", renderer)

    def run_once(self, **kwargs):
        return monitor.run_monitor(self.config, now=NOW, environ=self.environ,
                                   bin_dir=self.tools, **kwargs)

    def run_path(self, report):
        return self.output / "runs" / report["run_id"]

    def test_daily_window_unique_private_runs_atomic_latest_and_no_deletion(self):
        first = self.run_once()
        second = self.run_once()
        self.assertEqual(first["state"], "complete")
        self.assertEqual(first["window_start"], "2026-09-24T00:00:00Z")
        self.assertEqual(first["window_end"], "2026-09-25T00:00:00Z")
        self.assertNotEqual(first["run_id"], second["run_id"])
        self.assertEqual(first["retention"], {"policy": "retained_until_owner_removes", "automatic_deletion": False})
        latest = json.loads((self.output / "latest.json").read_text())
        self.assertEqual(latest["run"], "runs/" + second["run_id"])
        self.assertEqual(latest["last_successful_run"], latest["run"])
        bookmark = (self.output / "index.html").read_text()
        self.assertIn(f'href="{latest["run"]}/index.html"', bookmark)
        self.assertIn("COMPLETE", bookmark)
        self.assertIn("2026-09-24T00:00:00Z", bookmark)
        self.assertNotIn("previous successfully rendered", bookmark)
        self.assertIn("Content-Security-Policy", bookmark)
        self.assertIn("default-src 'none'", bookmark)
        self.assertNotIn("<script", bookmark)
        self.assertNotIn("http-equiv=\"refresh\"", bookmark)
        self.assertNotIn("https://", bookmark)
        self.assertEqual(len(list((self.output / "runs").iterdir())), 2)
        for path in self.output.rglob("*"):
            self.assertFalse(path.is_symlink())
            self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o700 if path.is_dir() else 0o600)
            if path.is_file():
                self.assertNotIn(SECRET, path.read_text())

    def test_rolling_is_explicit_and_uses_completed_hour(self):
        report = self.run_once(daily=False)
        self.assertEqual(report["mode"], "rolling_24h")
        self.assertEqual(report["window_end"], "2026-09-25T07:00:00Z")
        self.assertEqual(report["window_start"], "2026-09-24T07:00:00Z")

    def test_partial_coverage_is_rendered_and_remains_degraded(self):
        self.make_tools(complete=False)
        report = self.run_once()
        self.assertEqual(report["state"], "degraded")
        self.assertEqual(report["coverage"]["unavailable"], 1)
        self.assertEqual((self.run_path(report) / "REPORT.md").read_text(), "Coverage: DEGRADED")
        self.assertFalse(json.loads((self.output / "latest.json").read_text())["coverage"]["complete"])

    def test_auth_failure_produces_unknown_report_and_preserves_prior_success(self):
        first = self.run_once()
        with mock.patch.object(monitor, "ensure_auth", side_effect=monitor.MonitorError("oauth_unavailable")), \
                mock.patch.object(monitor, "run_child") as child:
            report = self.run_once()
        child.assert_not_called()
        self.assertEqual(report["state"], "error")
        self.assertIsNone(report["coverage"])
        self.assertIn("Coverage: UNKNOWN", (self.run_path(report) / "REPORT.md").read_text())
        self.assertIn("oauth_unavailable", (self.run_path(report) / "index.html").read_text())
        latest = json.loads((self.output / "latest.json").read_text())
        self.assertEqual(latest["run"], "runs/" + report["run_id"])
        self.assertEqual(latest["last_successful_run"], "runs/" + first["run_id"])
        bookmark = (self.output / "index.html").read_text()
        self.assertIn("<strong>ERROR</strong>", bookmark)
        self.assertIn("Activity is unknown", bookmark)
        self.assertIn(f'href="runs/{report["run_id"]}/index.html"', bookmark)
        self.assertIn(f'href="runs/{first["run_id"]}/index.html"', bookmark)
        self.assertIn('href="latest.json"', bookmark)
        self.assertEqual(stat.S_IMODE((self.output / "index.html").stat().st_mode), 0o600)
        self.assertEqual((self.run_path(first) / "REPORT.md").read_text(), "Coverage: COMPLETE")

    def test_child_error_text_never_reaches_persistent_report_or_stdout(self):
        self.make_tools(collector_extra=f"raise RuntimeError({SECRET!r})")
        report = self.run_once()
        self.assertEqual(report["errors"], [{"phase": "collector", "code": "collector_failed"}])
        self.assertEqual({path.name for path in self.run_path(report).iterdir()}, {"run.json", "REPORT.md", "index.html"})
        for path in self.run_path(report).iterdir():
            self.assertNotIn(SECRET, path.read_text())

    def test_renderer_failure_keeps_snapshot_and_creates_unknown_report(self):
        self.make_tools(renderer_extra=f"raise RuntimeError({SECRET!r})")
        report = self.run_once()
        self.assertEqual(report["state"], "error")
        self.assertEqual(report["errors"], [{"phase": "renderer", "code": "renderer_failed"}])
        self.assertTrue((self.run_path(report) / "snapshot.json").is_file())
        self.assertIn("UNKNOWN", (self.run_path(report) / "REPORT.md").read_text())

    def test_rendered_report_has_separate_bound_and_exact_oversize_failure(self):
        rendered = "Coverage: COMPLETE"
        with mock.patch.object(monitor, "MAX_REPORT_BYTES", len(rendered.encode())):
            exact = self.run_once()
        self.assertEqual(exact["state"], "complete")
        # The JSON snapshot is larger than this patched report limit and still
        # validates through its separate unchanged snapshot bound.
        self.assertGreater((self.run_path(exact) / "snapshot.json").stat().st_size, len(rendered))
        with mock.patch.object(monitor, "MAX_REPORT_BYTES", len(rendered.encode()) - 1):
            oversized = self.run_once()
        self.assertEqual(oversized["state"], "error")
        self.assertEqual(oversized["errors"], [{"phase": "renderer", "code": "file_too_large"}])
        self.assertIn("Coverage: UNKNOWN", (self.run_path(oversized) / "REPORT.md").read_text())
        self.assertNotIn(SECRET, (self.run_path(oversized) / "run.json").read_text())
        latest = json.loads((self.output / "latest.json").read_text())
        self.assertEqual(latest["last_successful_run"], "runs/" + exact["run_id"])
        self.assertEqual(monitor.MAX_SNAPSHOT_BYTES, 8 * 1024 * 1024)
        self.assertEqual(monitor.MAX_REPORT_BYTES, 32 * 1024 * 1024)

    def test_config_rejects_secrets_unknown_keys_duplicates_and_public_modes(self):
        for extra in ({"token": SECRET}, {"retention_days": 30}, {"account_id": "invalid"}):
            with self.subTest(extra=tuple(extra)):
                private_write(self.config_path, json.dumps({"account_id": ACCOUNT, "output_root": str(self.output), **extra}))
                with self.assertRaises(monitor.MonitorError):
                    monitor.load_config(self.config_path)
        private_write(self.config_path, '{"account_id":"' + ACCOUNT + '","account_id":"' + ACCOUNT + '"}')
        with self.assertRaisesRegex(monitor.MonitorError, "duplicate_json_key"):
            monitor.load_config(self.config_path)
        private_write(self.config_path, json.dumps({"account_id": ACCOUNT, "output_root": str(self.output)}))
        self.config_path.chmod(0o644)
        with self.assertRaisesRegex(monitor.MonitorError, "file_not_private"):
            monitor.load_config(self.config_path)
        self.config_path.chmod(0o600)
        self.output.chmod(0o755)
        with self.assertRaisesRegex(monitor.MonitorError, "directory_not_private"):
            monitor.load_config(self.config_path)

    def test_paths_symlinks_and_hardlinked_config_are_rejected(self):
        for target, alias in ((self.output, self.base / "linked-dir"), (self.config_path, self.base / "linked-config")):
            alias.symlink_to(target)
            with self.subTest(alias=alias.name), self.assertRaises((OSError, monitor.MonitorError)):
                if alias.name == "linked-dir":
                    monitor.open_directory(alias)
                else:
                    monitor.load_config(alias)
        ancestor = self.base / "linked-ancestor"
        ancestor.symlink_to(self.base, target_is_directory=True)
        with self.assertRaises(OSError):
            monitor.open_directory(ancestor / self.output.name)
        os.link(self.config_path, self.base / "hardlink")
        with self.assertRaisesRegex(monitor.MonitorError, "file_not_private"):
            monitor.load_config(self.config_path)

    def test_concurrent_lock_refuses_before_creating_run(self):
        descriptor = monitor.open_directory(self.output)
        try:
            with monitor.exclusive_run(descriptor):
                with self.assertRaisesRegex(monitor.MonitorError, "run_already_active"):
                    self.run_once()
            self.assertFalse((self.output / "runs").exists())
        finally:
            os.close(descriptor)

    def test_latest_symlink_is_not_followed_or_overwritten(self):
        victim = self.base / "victim"
        private_write(victim, "untouched")
        (self.output / "latest.json").symlink_to(victim)
        with self.assertRaises((OSError, monitor.MonitorError)):
            self.run_once()
        self.assertEqual(victim.read_text(), "untouched")
        self.assertTrue((self.output / "latest.json").is_symlink())

    def test_bookmark_symlink_is_rejected_before_authentication(self):
        victim = self.base / "victim"
        private_write(victim, "untouched")
        (self.output / "index.html").symlink_to(victim)
        with mock.patch.object(monitor, "ensure_auth") as authenticate:
            with self.assertRaisesRegex(monitor.MonitorError, "replacement_not_private"):
                self.run_once()
        authenticate.assert_not_called()
        self.assertEqual(victim.read_text(), "untouched")
        self.assertFalse((self.output / "runs").exists())

    def test_bookmark_escapes_text_and_rejects_external_or_traversing_links(self):
        pointer = {"state": "error", "run": "runs/20260925T071500Z-0123456789ab", "last_successful_run": None,
                   "updated_at": "<img src=x>", "window": {"start": "<script>bad</script>", "end": "end"}}
        page = monitor.bookmark_page(pointer).decode()
        self.assertNotIn("<img", page)
        self.assertNotIn("<script>", page)
        self.assertIn("&lt;script&gt;", page)
        for reference in ("https://example.test/", "runs/../../outside", "runs/20260925T071500Z-0123456789ab?token=private"):
            with self.assertRaisesRegex(monitor.MonitorError, "invalid_run_reference"):
                monitor.bookmark_page({**pointer, "last_successful_run": reference})

    def test_coverage_rejects_false_completeness_and_wrong_counts(self):
        target = self.output / "snapshot.json"
        for coverage in (
            {"complete": True, "observations": 2, "ok": 1, "unavailable": 1, "errors": 0},
            {"complete": False, "observations": 1, "ok": 0, "unavailable": 0, "errors": 0},
            {"complete": True, "observations": True, "ok": 1, "unavailable": 0, "errors": 0},
        ):
            private_write(target, json.dumps({"schema": "kingdom.cloudflare-traffic/0.1", "provider_writes": False, "coverage": coverage}))
            with self.assertRaisesRegex(monitor.MonitorError, "snapshot_coverage_invalid"):
                monitor.coverage_from_snapshot(target)

    def test_snapshot_identity_window_and_read_only_contract_are_bound_to_request(self):
        first = self.run_once()
        snapshot = json.loads((self.run_path(first) / "snapshot.json").read_text())
        target = self.output / "snapshot.json"
        expected = {"start": first["window_start"], "end": first["window_end"]}
        for mutation, code in (
            ({"scope": {"account_id": "b" * 32}}, "snapshot_account_mismatch"),
            ({"window": {"start": "2026-09-23T00:00:00Z", "end": "2026-09-24T00:00:00Z"}}, "snapshot_window_mismatch"),
            ({"provider_writes": True}, "snapshot_not_read_only"),
        ):
            private_write(target, json.dumps({**snapshot, **mutation}))
            with self.subTest(code=code), self.assertRaisesRegex(monitor.MonitorError, code):
                monitor.coverage_from_snapshot(target, account_id=ACCOUNT, expected_window=expected)

    def test_real_renderer_accepts_partial_snapshot_and_reports_unknown_runtime(self):
        self.make_tools(complete=False)
        shutil.copyfile(SOURCE.parent / "cloudflare-traffic-report.py", self.tools / "cloudflare-traffic-report.py")
        result = self.run_once()
        self.assertEqual(result["state"], "degraded")
        text = (self.run_path(result) / "REPORT.md").read_text()
        self.assertIn("Degraded / incomplete coverage", text)
        self.assertIn("plan_unavailable", text.replace(r"\_", "_"))
        self.assertNotIn(ACCOUNT, text)
        self.assertNotIn(SECRET, text)

    def test_auth_skips_refresh_for_environment_or_fresh_oauth(self):
        with mock.patch.object(monitor, "oauth_metadata", return_value=NOW + timedelta(hours=1)) as metadata, \
                mock.patch.object(monitor, "run_child") as child:
            self.assertEqual(monitor.ensure_auth(self.config, environ=self.environ,
                             home=self.base, now=NOW, run_dir=self.output), "child_environment")
            metadata.assert_not_called()
            self.assertEqual(monitor.ensure_auth(self.config, environ={},
                             home=self.base, now=NOW, run_dir=self.output), "existing_oauth")
            child.assert_not_called()

    def test_expiring_auth_uses_only_bounded_whoami_and_requires_refresh_evidence(self):
        config = {**self.config, "wrangler_executable": Path(sys.executable).resolve()}
        with mock.patch.object(monitor, "oauth_metadata", side_effect=[NOW, NOW + timedelta(hours=1)]), \
                mock.patch.object(monitor, "run_child", return_value={"state": "exited", "returncode": 0}) as child:
            self.assertEqual(monitor.ensure_auth(config, environ={"CI": "1"}, home=self.base,
                             now=NOW, run_dir=self.output), "refreshed_existing_oauth")
            self.assertEqual(child.call_args.args[0], [str(config["wrangler_executable"]), "whoami"])
            self.assertEqual(child.call_args.kwargs["timeout"], 45)
            self.assertEqual(child.call_args.kwargs["environ"]["WRANGLER_LOG_SANITIZE"], "true")
            self.assertEqual(child.call_args.kwargs["extra_output"], child.call_args.kwargs["environ"]["WRANGLER_LOG_PATH"])
            self.assertFalse(Path(child.call_args.kwargs["extra_output"]).exists())
        with mock.patch.object(monitor, "oauth_metadata", return_value=NOW), \
                mock.patch.object(monitor, "run_child", return_value={"state": "exited", "returncode": 0}):
            with self.assertRaisesRegex(monitor.MonitorError, "oauth_refresh_unconfirmed"):
                monitor.ensure_auth(config, environ={}, home=self.base, now=NOW, run_dir=self.output)

    def test_unknown_oauth_expiry_never_runs_wrangler(self):
        home = self.base / "home"
        config = home / ".wrangler/config/default.toml"
        config.parent.mkdir(parents=True, mode=0o700)
        private_write(config, f'oauth_token = "{SECRET}"\n')
        with mock.patch.object(monitor, "run_child") as child:
            with self.assertRaisesRegex(monitor.MonitorError, "oauth_expiry_unknown"):
                monitor.ensure_auth(self.config, environ={}, home=home, now=NOW, run_dir=self.output)
            child.assert_not_called()
        private_write(config, f'oauth_token = "{SECRET}"\nexpiration_time = "2026-09-25T09:00:00Z"\n')
        self.assertEqual(monitor.oauth_metadata({}, home), NOW.replace(hour=9, minute=0))

    def test_plist_escapes_paths_pins_release_argv_and_never_starts_at_load(self):
        value = plistlib.loads(monitor.launchd_plist(self.config_path, self.config))
        self.assertEqual(value["StartCalendarInterval"], {"Hour": 8, "Minute": 15})
        self.assertIs(value["RunAtLoad"], False)
        self.assertEqual(value["ProgramArguments"][-3:], ["--config", str(self.config_path), "--daily"])
        self.assertEqual(value["Umask"], 0o077)
        self.assertNotIn(SECRET, json.dumps(value))
        self.assertNotIn("KeepAlive", value)
        self.assertNotIn("CLOUDFLARE_API_TOKEN", value["EnvironmentVariables"])

    def test_cli_failure_returns_nonzero_without_raw_exception(self):
        stdout, stderr = io.StringIO(), io.StringIO()
        with mock.patch.object(monitor, "run_monitor", side_effect=OSError(SECRET)), \
                contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            self.assertEqual(monitor.main(["--config", str(self.config_path)]), 1)
        self.assertNotIn(SECRET, stdout.getvalue() + stderr.getvalue())
        self.assertIn("local_operation_failed", stderr.getvalue())

    def test_signal_handlers_restored(self):
        before = {kind: signal.getsignal(kind) for kind in (signal.SIGINT, signal.SIGTERM)}
        with monitor.interrupt_cleanup() as interrupted:
            os.kill(os.getpid(), signal.SIGTERM)
            self.assertTrue(interrupted["received"])
            with self.assertRaisesRegex(monitor.MonitorError, "interrupted"):
                monitor.check_interrupted()
        self.assertEqual(before, {kind: signal.getsignal(kind) for kind in before})

    def test_real_child_timeout_and_output_limit(self):
        result = monitor.run_child([sys.executable, "-c", "import time; time.sleep(30)"],
                                   cwd=self.output, environ=self.environ, timeout=0.1)
        self.assertEqual(result["state"], "timed_out")
        with mock.patch.object(monitor, "MAX_CHILD_OUTPUT", 1024):
            result = monitor.run_child([sys.executable, "-c", "import os,time; os.write(1,b'x'*4096); time.sleep(30)"],
                                       cwd=self.output, environ=self.environ, timeout=5)
        self.assertEqual(result["state"], "output_limit")
        self.assertEqual(list(self.output.iterdir()), [])

    def test_native_debug_log_counts_toward_child_output_cap(self):
        with tempfile.NamedTemporaryFile(dir=self.output, suffix=".log") as native_log:
            code = f'import pathlib,time;pathlib.Path({native_log.name!r}).write_bytes(b"x"*4096);time.sleep(30)'
            with mock.patch.object(monitor, "MAX_CHILD_OUTPUT", 1024):
                result = monitor.run_child([sys.executable, "-c", code], cwd=self.output,
                                           environ=self.environ, timeout=5, extra_output=native_log.name)
            self.assertEqual(result["state"], "output_limit")
        self.assertEqual(list(self.output.iterdir()), [])

    def test_successful_leader_cleans_sleeping_descendant(self):
        marker = self.base / "descendant.pid"
        script = f'import pathlib,subprocess,sys; p=subprocess.Popen([sys.executable,"-c","import time;time.sleep(30)"]); pathlib.Path({str(marker)!r}).write_text(str(p.pid))'
        result = monitor.run_child([sys.executable, "-c", script], cwd=self.output,
                                   environ=self.environ, timeout=5)
        self.assertEqual(result, {"state": "exited", "returncode": 0})
        self.assertFalse(alive(int(marker.read_text())))

    def test_real_controller_sigterm_stops_owned_descendants(self):
        marker = self.base / "pids.json"
        child = f'import os,pathlib,subprocess,sys,time,json; p=subprocess.Popen([sys.executable,"-c","import time; time.sleep(30)"]); pathlib.Path({str(marker)!r}).write_text(json.dumps([os.getpid(),p.pid])); time.sleep(30)'
        controller = f'''import importlib.util
s=importlib.util.spec_from_file_location("monitor",{str(SOURCE)!r}); m=importlib.util.module_from_spec(s); s.loader.exec_module(m)
try:
    with m.interrupt_cleanup(): m.run_child({[sys.executable, "-c", child]!r}, cwd={str(self.output)!r}, environ={self.environ!r}, timeout=30)
except m.MonitorError: pass
'''
        process = subprocess.Popen([sys.executable, "-c", controller], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            deadline = time.monotonic() + 5
            while not marker.exists() and time.monotonic() < deadline:
                time.sleep(0.025)
            self.assertTrue(marker.exists())
            pids = json.loads(marker.read_text())
            process.send_signal(signal.SIGTERM)
            self.assertEqual(process.wait(timeout=5), 0)
            for pid in pids:
                self.assertFalse(alive(pid))
        finally:
            if process.poll() is None:
                process.kill()
                process.wait(timeout=5)


if __name__ == "__main__":
    unittest.main()
