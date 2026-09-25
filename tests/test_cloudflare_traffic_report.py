import base64
import contextlib
import copy
import hashlib
from html.parser import HTMLParser
import importlib.util
import io
import json
import os
from pathlib import Path
import stat
import tempfile
import unittest
from unittest import mock


SPEC = importlib.util.spec_from_file_location("traffic_report", Path(__file__).parents[1] / "bin/cloudflare-traffic-report.py")
report = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(report)

WINDOW = {"start": "2026-09-25T10:00:00Z", "end": "2026-09-25T11:00:00Z"}


def observation(view="traffic_total", **overrides):
    result = {"scope": "zone", "name": "example.test", "view": view,
              "dataset": "httpRequestsAdaptiveGroups", "state": "ok", "window": copy.deepcopy(WINDOW),
              "sampled": True, "group_limit": 100, "rows_received": 1, "truncated": False,
              "rows": [{"requests": 125, "bytes": 1024, "dimensions": {}}]}
    result.update(overrides)
    return result


def fixture():
    return {"schema": report.SCHEMA, "observed_at": "2026-09-25T11:05:00Z",
            "window": copy.deepcopy(WINDOW), "history_window": {"start": "2026-09-19T00:00:00Z", "end": "2026-09-25T11:00:00Z"},
            "provider_writes": False, "scope": {"zones_expected": 1, "zone_names": ["example.test"], "account_id": "private-account-id"},
            "coverage": {"complete": True, "observations": 1, "ok": 1, "unavailable": 0, "errors": 0},
            "observations": [observation()], "limitations": ["Provider estimates; bounded window."]}


def recount(data, complete=False):
    data["coverage"] = {"complete": complete, "observations": len(data["observations"]),
                        "ok": sum(o["state"] == "ok" for o in data["observations"]),
                        "unavailable": sum(o["state"] == "unavailable" for o in data["observations"]),
                        "errors": sum(o["state"] == "error" for o in data["observations"])}
    return data


class DocumentParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


class EvidenceTests(unittest.TestCase):
    def test_runtime_security_and_other_breakdowns_never_change_edge_total(self):
        data = fixture()
        data["observations"] += [observation("workers", scope="account", name="Cloudflare account", dataset="workersInvocationsAdaptive", rows=[{"requests": 700, "errors": 9, "subrequests": 5000, "dimensions": {"scriptName": "demo", "status": "success"}}]),
                                 observation("security", rows=[{"requests": 900, "dimensions": {"securityAction": "block"}}]),
                                 observation("operations", rows=[{"requests": 125, "dimensions": {"route_family": "api-write-attempt", "edgeResponseStatus": 200}}])]
        recount(data, complete=True)
        self.assertEqual(report.zone_totals(data), [("example.test", 125, "Sampled estimate")])
        for rendered in (report.render_html(data), report.render_markdown(data)):
            self.assertIn("business effects", rendered.lower())
            self.assertIn("Runtime errors", rendered)
            self.assertIn("Subrequests", rendered)
            self.assertIn("api-write-attempt", rendered)
            self.assertNotIn("private-account-id", rendered)

    def test_unavailable_and_missing_zones_are_unknown_not_zero(self):
        data = fixture()
        data["scope"].update(zones_expected=3, zone_names=["example.test", "missing.test"])
        data["observations"][0].update(state="unavailable", reason="plan_unavailable", rows=[], rows_received=0)
        recount(data)
        self.assertTrue(all(value is None for _, value, _ in report.zone_totals(data)))
        for rendered in (report.render_html(data), report.render_markdown(data)):
            self.assertIn("Degraded / incomplete coverage", rendered)
            self.assertIn("activity unknown", rendered)
            self.assertIn("plan_unavailable", rendered.replace(r"\_", "_"))
            self.assertIn("missing.test", rendered)
            self.assertIn("1 expected zone", rendered)

    def test_explicit_zero_differs_from_empty_or_ambiguous_totals(self):
        data = fixture()
        data["observations"][0]["rows"][0]["requests"] = 0
        self.assertEqual(report.zone_totals(data)[0][1], 0)
        data["observations"][0].update(rows=[], rows_received=0)
        self.assertIsNone(report.zone_totals(data)[0][1])
        data = fixture()
        data["observations"].append(copy.deepcopy(data["observations"][0]))
        recount(data)
        self.assertIsNone(report.zone_totals(data)[0][1])

    def test_truncated_or_different_window_total_cannot_be_presented_as_complete(self):
        data = fixture()
        data["observations"][0]["truncated"] = True
        recount(data)
        self.assertIsNone(report.zone_totals(data)[0][1])
        self.assertIn("TRUNCATED", report.render_html(data))
        data = fixture()
        data["observations"][0]["window"]["start"] = "2026-09-25T09:00:00Z"
        self.assertIsNone(report.zone_totals(data)[0][1])
        self.assertEqual(report.coverage_label(data), "Degraded / incomplete coverage")

    def test_operations_preserve_raw_top_k_coverage_after_route_aggregation(self):
        data = fixture()
        data["observations"] = [observation("operations", rows_received=100, group_limit=100, truncated=True,
            rows=[{"requests": 700, "dimensions": {"route_family": "api-read"}},
                  {"requests": 300, "dimensions": {"route_family": "config-probe"}}])]
        recount(data)
        for rendered in (report.render_html(data), report.render_markdown(data)):
            self.assertIn("Raw returned groups: 100; normalized route groups: 2; raw group limit: 100", rendered)
            self.assertIn("TRUNCATED", rendered)
        data["observations"][0]["view"] = "hosts"
        with self.assertRaises(ValueError):
            report.validate(data)

    def test_timeline_sorts_observed_buckets_without_inventing_missing_hours(self):
        data = fixture()
        data["observations"] = [observation("timeline", rows_received=2, rows=[
            {"requests": 20, "dimensions": {"datetimeHour": "2026-09-25T03:00:00Z"}},
            {"requests": 10, "dimensions": {"datetimeHour": "2026-09-25T01:00:00Z"}}])]
        rendered = report.render_html(data)
        self.assertLess(rendered.index("2026-09-25T01:00:00Z"), rendered.index("2026-09-25T03:00:00Z"))
        self.assertNotIn("2026-09-25T02:00:00Z", rendered)
        self.assertEqual(rendered.count("<meter "), 2)
        self.assertIn("Missing timeline buckets stay missing", rendered)

    def test_probe_contamination_and_client_inference_limits_are_always_visible(self):
        data = fixture()
        data["observations"].append(observation("clients", rows=[{"requests": 1, "dimensions": {"userAgentBrowser": "Chrome", "verifiedBotCategory": ""}}]))
        recount(data)
        for rendered in (report.render_html(data), report.render_markdown(data)):
            self.assertIn("2026-09-25", rendered)
            self.assertIn("cannot reliably isolate or subtract", rendered)
            self.assertIn("Browser claim", rendered)
            self.assertIn("unverified", rendered)
            self.assertIn("Unknown / unclassified", rendered)

    def test_historical_probe_note_requires_an_overlapping_report_window(self):
        data = fixture()
        data["window"] = {"start": "2026-10-02T00:00:00Z", "end": "2026-10-03T00:00:00Z"}
        data["history_window"] = {"start": "2026-09-26T00:00:00Z", "end": "2026-10-03T00:00:00Z"}
        data["observations"][0]["window"] = dict(data["window"])
        data["observed_at"] = "2026-10-03T08:15:00Z"
        for rendered in (report.render_html(data), report.render_markdown(data)):
            self.assertNotIn("known release verification and monitoring probes ran", rendered)
        data["history_window"]["start"] = "2026-09-25T23:00:00Z"
        self.assertIn("known release verification and monitoring probes ran", report.render_html(data))

    def test_storage_effects_are_separate_and_d1_needs_no_http_request_count(self):
        data = fixture()
        data["observations"] += [observation("d1_operations", scope="account", name="Cloudflare account", dataset="d1AnalyticsAdaptiveGroups",
            rows=[{"read_queries": 123, "write_queries": 52, "rows_read": 500, "rows_written": 92, "sample_interval": 1,
                   "dimensions": {"databaseId": "db-id", "databaseName": "exact-database"}}]),
            observation("kv_operations", scope="account", name="Cloudflare account", dataset="kvOperationsAdaptiveGroups",
                rows=[{"requests": 400, "bytes": 1200, "sample_interval": 1,
                       "dimensions": {"namespaceId": "namespace-id", "namespaceName": "exact-namespace", "actionType": "write", "responseStatusCode": 200, "result": "success"}}])]
        recount(data, complete=True)
        self.assertEqual(report.zone_totals(data)[0][1], 125)
        for rendered in (report.render_html(data), report.render_markdown(data)):
            self.assertIn("52", rendered)
            self.assertIn("92", rendered)
            self.assertIn("Write queries", rendered)
            self.assertIn("Rows written", rendered)
            self.assertIn("Storage service evidence only", rendered)
            self.assertIn("causal HTTP request remain unknown", rendered)
            self.assertIn("quota counters and perform expiry cleanup", rendered)
            self.assertIn("does not invoke application endpoints", rendered)
        markup = report.render_html(data)
        self.assertEqual(markup.count('class="evidence storage"'), 2)
        data["observations"][-2]["view"] = "workers"
        with self.assertRaises(ValueError):
            report.validate(data)

    def test_only_explicit_pages_project_mapping_is_displayed(self):
        data = fixture()
        data["observations"] = [observation("pages_functions", scope="account", name="Cloudflare account", rows_received=2,
            rows=[{"requests": 4, "dimensions": {"scriptName": "pages-worker--15965726-production", "projectName": "verified-project", "status": "success"}},
                  {"requests": 8, "dimensions": {"scriptName": "pages-worker--000000-production", "status": "success"}}])]
        recount(data)
        for rendered in (report.render_html(data), report.render_markdown(data)):
            self.assertIn("Pages project", rendered)
            self.assertIn("verified-project", rendered)
            self.assertIn("remain unassigned", rendered)
            self.assertIn("Unknown / unclassified", rendered)

    def test_unavailable_security_events_are_renderable_and_not_zero(self):
        data = fixture()
        data["observations"].append(observation("security_events", state="unavailable", dataset="firewallEventsAdaptiveGroups", rows_received=0, rows=[], reason="plan_unavailable"))
        recount(data)
        self.assertIn("Security event coverage", report.render_html(data))
        self.assertIn("Unavailable — activity unknown", report.render_markdown(data))

    def test_html_and_markdown_injection_remain_inert_text(self):
        payload = '</script><img src="https://evil.invalid/pixel" onerror="alert(1)"> [click](javascript:alert(1)) `x` | next'
        data = fixture()
        data["scope"]["zone_names"] = [payload]
        data["observations"][0].update(name=payload, reason=payload)
        data["observations"][0]["rows"][0]["dimensions"] = {"scriptName": payload}
        data["limitations"] = [payload]
        markup = report.render_html(data)
        markdown = report.render_markdown(data)
        self.assertNotIn("<img", markup)
        self.assertIn("&lt;img", markup)
        self.assertNotIn("[click](javascript:", markdown)
        self.assertIn(r"\| next", markdown)
        parser = DocumentParser()
        parser.feed(markup)
        self.assertEqual(sum(tag == "script" for tag, _ in parser.tags), 1)
        self.assertFalse(any(key.lower().startswith("on") for _, attrs in parser.tags for key in attrs))
        self.assertFalse(any(tag in {"img", "iframe", "form", "object", "link"} for tag, _ in parser.tags))
        self.assertFalse(any("src" in attrs for _, attrs in parser.tags))
        for kind, content in (("script", report.SCRIPT), ("style", report.STYLE)):
            digest = base64.b64encode(hashlib.sha256(content.encode()).digest()).decode()
            self.assertIn(digest, markup)
        self.assertIn("connect-src &#x27;none&#x27;", markup)
        self.assertNotIn("innerHTML", report.SCRIPT)

    def test_raw_dimensions_are_rejected_instead_of_rendered(self):
        for key in ("clientRequestPath", "clientIP", "userAgent", "clientRequestQuery", "referer", "cookie", "sql", "key", "rowContent"):
            data = fixture()
            data["observations"][0]["rows"][0]["dimensions"][key] = "PRIVATE_SENTINEL"
            with self.subTest(key=key), self.assertRaises(ValueError):
                report.render_html(data)
        data = fixture()
        data["observations"][0]["rows"][0]["dimensions"]["route_family"] = "/private/user/123"
        with self.assertRaises(ValueError):
            report.validate(data)

    def test_invalid_numbers_flags_dates_and_coverage_fail_closed(self):
        mutations = [
            lambda d: d.update(provider_writes=True),
            lambda d: d["window"].update(start=d["window"]["end"]),
            lambda d: d.update(observed_at="2026-09-25T11:00:00"),
            lambda d: d["observations"][0].update(sampled="false"),
            lambda d: d["observations"][0].update(rows_received=2),
            lambda d: d["observations"][0].update(state="error"),
            lambda d: d["coverage"].update(ok=2),
            lambda d: d["observations"][0].update(truncated=True),
        ]
        for value in (True, -1, float('nan'), float('inf'), 10**500, "3"):
            mutations.append(lambda d, value=value: d["observations"][0]["rows"][0].update(requests=value))
        for mutation in mutations:
            data = fixture()
            mutation(data)
            with self.subTest(mutation=mutation), self.assertRaises((ValueError, TypeError)):
                report.validate(data)


class FilesystemTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve()
        self.snapshot = self.root / "snapshot.json"
        self.snapshot.write_text(json.dumps(fixture()))
        self.output = self.root / "private"
        self.output.mkdir(mode=0o700)

    def test_cli_writes_two_private_reports_offline_and_reports_partial_success(self):
        data = fixture()
        data["observations"][0].update(state="error", reason="provider_unreachable", rows=[], rows_received=0)
        recount(data)
        self.snapshot.write_text(json.dumps(data))
        with mock.patch("socket.socket", side_effect=AssertionError("network forbidden")), contextlib.redirect_stdout(io.StringIO()) as stdout:
            result = report.main([str(self.snapshot), "--output-dir", str(self.output)])
        self.assertEqual(result, 0)
        self.assertEqual(json.loads(stdout.getvalue())["coverage"], "Degraded / incomplete coverage")
        self.assertEqual(sorted(path.name for path in self.output.iterdir()), ["REPORT.md", "index.html"])
        for path in self.output.iterdir():
            self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)
            self.assertIn("provider_unreachable", path.read_text().replace(r"\_", "_"))

    def test_shared_missing_or_symlink_output_directories_are_rejected(self):
        self.output.chmod(0o755)
        link = self.root / "linked"
        link.symlink_to(self.output, target_is_directory=True)
        for directory in (self.output, link, self.root / "missing"):
            with self.subTest(directory=directory.name), self.assertRaises((ValueError, OSError)):
                report.write_reports(fixture(), directory)
        self.output.chmod(0o700)
        with self.assertRaises(OSError):
            report.write_reports(fixture(), link)
        self.assertEqual(list(self.output.iterdir()), [])

    def test_symlink_ancestor_and_parent_traversal_are_rejected(self):
        link = self.root / "linked"
        link.symlink_to(self.output, target_is_directory=True)
        child = self.output / "child"
        child.mkdir(mode=0o700)
        with self.assertRaises(OSError):
            report.write_reports(fixture(), link / "child")
        with self.assertRaises(ValueError):
            report.write_reports(fixture(), link / ".." / "private")

    def test_existing_symlink_hardlink_and_nonregular_report_targets_are_rejected_atomically(self):
        protected = self.root / "keep.txt"
        protected.write_text("keep me")
        target = self.output / "index.html"
        for kind in ("symlink", "hardlink", "directory"):
            if kind == "symlink":
                target.symlink_to(protected)
            elif kind == "hardlink":
                os.link(protected, target)
            else:
                target.mkdir()
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                report.write_reports(fixture(), self.output)
            self.assertFalse((self.output / "REPORT.md").exists())
            self.assertEqual(protected.read_text(), "keep me")
            target.rmdir() if kind == "directory" else target.unlink()

    def test_foreign_owned_directory_is_rejected(self):
        real_fstat = os.fstat
        def other_owner(fd):
            value = real_fstat(fd)
            if value.st_ino == self.output.stat().st_ino:
                parts = list(value)
                parts[4] = os.getuid() + 999
                return os.stat_result(parts)
            return value
        with mock.patch.object(report.os, "fstat", side_effect=other_owner), self.assertRaises(ValueError):
            report.write_reports(fixture(), self.output)

    def test_utf8_report_bound_is_checked_before_either_report_is_replaced(self):
        for name in ("REPORT.md", "index.html"):
            (self.output / name).write_text("previous report")
        # Multibyte output must be counted as bytes, not Python characters.
        with mock.patch.object(report, "MAX_REPORT_BYTES", 10), \
                mock.patch.object(report, "render_markdown", return_value="small"), \
                mock.patch.object(report, "render_html", return_value="愛" * 4), \
                self.assertRaisesRegex(ValueError, "byte bound"):
            report.write_reports(fixture(), self.output)
        for name in ("REPORT.md", "index.html"):
            self.assertEqual((self.output / name).read_text(), "previous report")
        self.assertEqual(len(list(self.output.iterdir())), 2)

    def test_snapshot_boundaries_duplicate_keys_nonfinite_json_links_and_fifo(self):
        for value in ('{"schema":"a","schema":"b"}', '{"value":NaN}'):
            self.snapshot.write_text(value)
            with self.assertRaises(ValueError):
                report.read_snapshot(self.snapshot)
        self.snapshot.write_bytes(b'x' * 50)
        with mock.patch.object(report, "MAX_BYTES", 20), self.assertRaises(ValueError):
            report.read_snapshot(self.snapshot)
        link = self.root / "link.json"
        link.symlink_to(self.snapshot)
        fifo = self.root / "fifo.json"
        os.mkfifo(fifo)
        for path in (link, fifo):
            with self.subTest(path=path.name), self.assertRaises((ValueError, OSError)):
                report.read_snapshot(path)

    def test_invalid_telemetry_error_does_not_echo_input_or_replace_existing_report(self):
        old = self.output / "REPORT.md"
        old.write_text("previous report")
        data = fixture()
        data["observations"][0]["rows"][0]["requests"] = "PRIVATE_SENTINEL"
        self.snapshot.write_text(json.dumps(data))
        with contextlib.redirect_stderr(io.StringIO()) as stderr:
            result = report.main([str(self.snapshot), "--output-dir", str(self.output)])
        self.assertEqual(result, 1)
        self.assertNotIn("PRIVATE_SENTINEL", stderr.getvalue())
        self.assertEqual(old.read_text(), "previous report")
        self.assertFalse((self.output / "index.html").exists())


if __name__ == "__main__":
    unittest.main()
