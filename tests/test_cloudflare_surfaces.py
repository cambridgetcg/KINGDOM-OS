import contextlib
import copy
import importlib.util
import io
import json
import os
from pathlib import Path
import stat
import tempfile
import unittest
from unittest import mock


SPEC = importlib.util.spec_from_file_location(
    "cloudflare_surfaces", Path(__file__).parents[1] / "bin/cloudflare-surfaces.py"
)
surfaces = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(surfaces)
JOIN_SPEC = importlib.util.spec_from_file_location(
    "cloudflare_observation", Path(__file__).parents[1] / "bin/cloudflare-build-observation.py"
)
joiner = importlib.util.module_from_spec(JOIN_SPEC)
JOIN_SPEC.loader.exec_module(joiner)


def fixture():
    return {
        "format": "cloudflare-surface-observation/1", "visibility": "private-maintainer",
        "as_of": "2026-09-25T12:00:00Z", "limitations": ["One bounded observation."],
        "coverage": {"pages": 1, "workers": 0, "zones": 1, "public_requests": 1},
        "dns_hosts": [{"host": "example.test", "role": "public", "binding": "pages:example", "state": "observed"}],
        "surfaces": [{"id": "pages:example", "kind": "pages", "name": "example",
            "audience": "mixed", "state": "observed", "source": {"state": "unresolved"},
            "next_action": "Confirm the source.", "findings": [], "purpose": "A public start.",
            "bindings": ["example.test"], "human_start": "https://example.test/",
            "observations": [{"url": "https://example.test/agent.json", "status": 200,
                "content_type": "application/json; charset=utf-8", "bytes_read": 512,
                "html": False, "truncated": False, "valid_json": True, "machine_usable": True}]}],
    }


class ValidationTests(unittest.TestCase):
    def test_complete_fifty_pages_thirty_eight_workers_are_counted_by_kind(self):
        data = fixture()
        template = data["surfaces"][0]
        data["surfaces"] = []
        for kind, count in (("pages", 50), ("worker", 38)):
            for n in range(count):
                row = copy.deepcopy(template)
                row.update(kind=kind, name=f"site-{n}", id=f"{kind}:site-{n}")
                data["surfaces"].append(row)
        data["coverage"].update(pages=50, workers=38, zones=21)
        surfaces.validate(data)
        markup = surfaces.render_html(data)
        self.assertEqual(markup.count("<article "), 88)
        self.assertIn("50 Pages projects · 38 Workers · 21 zones", markup)
        data["coverage"].update(pages=49, workers=39)
        with self.assertRaises(ValueError):
            surfaces.validate(data)

    def test_untyped_negative_and_injected_counts_are_rejected(self):
        for value in (True, -1, 1.0, "1", '<img src=x onerror="alert(1)">', 1_000_001):
            data = fixture()
            data["coverage"]["zones"] = value
            with self.subTest(value=value), self.assertRaises(ValueError):
                surfaces.validate(data)

    def test_duplicate_inconsistent_ids_and_unknown_kinds_are_rejected(self):
        for mutation in (
            lambda d: d["surfaces"].append(copy.deepcopy(d["surfaces"][0])),
            lambda d: d["surfaces"][0].update(kind="worker"),
            lambda d: d["surfaces"][0].update(kind="service", id="service:example"),
        ):
            data = fixture()
            mutation(data)
            with self.assertRaises(ValueError):
                surfaces.validate(data)

    def test_machine_success_requires_boolean_evidence_complete_bytes_and_media_type(self):
        mutations = [
            {"valid_json": "false"}, {"machine_usable": "false"}, {"html": "false"},
            {"truncated": True}, {"content_type": "text/html"}, {"status": 204},
            {"error": "read_failed"}, {"valid_json": False}, {"bytes_read": True},
        ]
        for mutation in mutations:
            data = fixture()
            data["surfaces"][0]["observations"][0].update(mutation)
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                surfaces.validate(data)
        for missing in ("html", "truncated"):
            data = fixture()
            del data["surfaces"][0]["observations"][0][missing]
            with self.assertRaises(ValueError):
                surfaces.validate(data)
        data = fixture()
        data["surfaces"][0]["observations"][0].update(
            url="https://example.test/llms.txt", valid_json=False,
            valid_text=True, content_type="text/plain")
        surfaces.validate(data)

    def test_links_reject_credentials_queries_fragments_controls_and_bad_ports(self):
        bad = ["https://user:pass@example.test/", "https://example.test/?token=PRIVATE_SENTINEL",
            "https://example.test/#PRIVATE_SENTINEL", "https://example.test/\nagent.json",
            "https://example.test/%0aagent.json", "http://example.test/", "javascript:alert(1)",
            "https://example.test:bad/", "https://example.test:8443/"]
        for url in bad:
            data = fixture()
            data["surfaces"][0]["observations"][0]["url"] = url
            with self.subTest(url=url), self.assertRaises(ValueError):
                surfaces.validate(data)
            rendered = surfaces.safe_link(url)
            self.assertNotIn("href=", rendered)
            self.assertNotIn("PRIVATE_SENTINEL", rendered)
        for field in ("human_start", "workers_dev_url"):
            data = fixture()
            data["surfaces"][0][field] = bad[1]
            with self.assertRaises(ValueError):
                surfaces.validate(data)
        data = fixture()
        data["external_document_observations"] = [{"url": bad[1]}]
        with self.assertRaises(ValueError):
            surfaces.validate(data)

    def test_html_and_markdown_escape_untrusted_text(self):
        payload = '<img src=x onerror="alert(1)"> [click](javascript:alert(1)) `code` | next'
        data = fixture()
        data["limitations"] = [payload]
        row = data["surfaces"][0]
        row.update(purpose=payload, findings=[payload], next_action=payload)
        data["dns_hosts"][0]["state"] = payload
        for rendered in (surfaces.render_html(data), surfaces.render_markdown(data)):
            self.assertNotIn("<img", rendered)
            self.assertIn("&lt;img", rendered)
        markdown = surfaces.render_markdown(data)
        self.assertNotIn("[click](javascript:", markdown)
        self.assertIn(r"\[click\]\(javascript:", markdown)
        self.assertIn(r"\| next", markdown)

    def test_partial_and_unknown_coverage_are_visible_without_claiming_completeness(self):
        data = fixture()
        data["coverage"]["metadata_complete"] = False
        for rendered in (surfaces.render_html(data), surfaces.render_markdown(data)):
            self.assertIn("Metadata coverage: incomplete", rendered)
            self.assertIn("DNS coverage: not established", rendered)
            self.assertNotIn("All address/CNAME records", rendered)
        data["coverage"]["dns_complete"] = "true"
        with self.assertRaises(ValueError):
            surfaces.validate(data)


class FileBoundaryTests(unittest.TestCase):
    def test_snapshot_is_bounded_regular_json_without_duplicate_keys(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "surfaces.json"
            for content in ('{"x":1,"x":2}', '{"x":NaN}'):
                path.write_text(content)
                with self.assertRaises(ValueError):
                    surfaces.read_snapshot(path)
            path.write_text("x" * 21)
            with mock.patch.object(surfaces, "MAX_SNAPSHOT_BYTES", 20), self.assertRaises(ValueError):
                surfaces.read_snapshot(path)
            link = Path(directory) / "link.json"
            link.symlink_to(path)
            fifo = Path(directory) / "fifo.json"
            os.mkfifo(fifo)
            for unsafe in (link, fifo):
                with self.subTest(path=unsafe.name), self.assertRaises((OSError, ValueError)):
                    surfaces.read_snapshot(unsafe)

    def test_check_has_no_outputs_and_invalid_input_has_content_free_errors(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "surfaces.json"
            path.write_text(json.dumps(fixture()))
            with contextlib.redirect_stdout(io.StringIO()) as stdout:
                self.assertEqual(surfaces.main([str(path), "--check"]), 0)
            self.assertEqual(sorted(p.name for p in path.parent.iterdir()), ["surfaces.json"])
            self.assertEqual(json.loads(stdout.getvalue())["mode"], "validated")
            data = fixture()
            data["coverage"]["zones"] = "PRIVATE_SENTINEL"
            path.write_text(json.dumps(data))
            with contextlib.redirect_stderr(io.StringIO()) as stderr:
                self.assertEqual(surfaces.main([str(path)]), 1)
            self.assertNotIn("PRIVATE_SENTINEL", stderr.getvalue())
            self.assertEqual(sorted(p.name for p in path.parent.iterdir()), ["surfaces.json"])

    def test_projection_replaces_symlink_without_writing_target_and_is_owner_only(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "unrelated.txt"
            target.write_text("keep me")
            output = root / "index.html"
            output.symlink_to(target)
            surfaces.write_projection(output, "new projection")
            self.assertEqual(target.read_text(), "keep me")
            self.assertFalse(output.is_symlink())
            self.assertEqual(output.read_text(), "new projection")
            self.assertEqual(stat.S_IMODE(output.stat().st_mode), 0o600)


class ObservationJoinTests(unittest.TestCase):
    @staticmethod
    def probe(url, *, machine=False):
        return {"url": url, "status": 200, "content_type": "application/json" if machine else "text/html",
            "html": not machine, "truncated": False, "valid_json": machine, "bytes_read": 100,
            "title": "Fixture human start" if not machine else ""}

    @staticmethod
    def inventory(workers, routes, domains=()):
        return {"as_of": "2026-09-25T12:00:00Z", "complete": True,
            "accounts": {"items": [{"id": "account"}]}, "zones": {"items": [{"name": "example.test"}]},
            "accounts_inventory": [{"account_id": "account", "pages": {"items": []},
                "workers": {"items": [{"id": name} for name in workers]},
                "worker_domains": {"items": [{"hostname": host, "service": service} for host, service in domains]},
                "worker_subdomain": {"item": {"subdomain": "fixture"}}}],
            "zone_routes": [{"zone": "example.test", "items": routes}]}

    def build(self, inventory, probes):
        data = joiner.build(inventory, probes, {"rows": []},
            {"zones": [{"zone": "example.test", "complete": True, "records": []}]})
        surfaces.validate(data)
        return {row["id"]: row for row in data["surfaces"]}

    def test_https_apex_is_not_attributed_to_http_redirect_worker(self):
        inventory = self.inventory(["origin", "redirect"],
            [{"pattern": "http://example.test/*", "script": "redirect"}],
            [("example.test", "origin"), ("www.example.test", "redirect")])
        result = self.build(inventory, [self.probe("https://example.test/"), self.probe("https://www.example.test/")])
        self.assertEqual(result["worker:origin"]["human_start"], "https://example.test/")
        self.assertEqual(result["worker:redirect"]["human_start"], "https://www.example.test/")
        self.assertEqual([x["url"] for x in result["worker:redirect"]["observations"]], ["https://www.example.test/"])

    def test_broad_route_on_one_host_does_not_expand_other_host_path_route(self):
        inventory = self.inventory(["worker"], [
            {"pattern": "one.example.test/*", "script": "worker"},
            {"pattern": "two.example.test/api/*", "script": "worker"}])
        result = self.build(inventory, [self.probe("https://one.example.test/"),
            self.probe("https://two.example.test/"), self.probe("https://two.example.test/agent.json", machine=True)])
        self.assertEqual([x["url"] for x in result["worker:worker"]["observations"]], ["https://one.example.test/"])
        self.assertEqual(result["worker:worker"]["audience"], "human")

    def test_more_specific_no_script_rule_excludes_machine_response(self):
        inventory = self.inventory(["worker"], [
            {"pattern": "example.test/*", "script": "worker"},
            {"pattern": "example.test/agent.json", "script": None}])
        result = self.build(inventory, [self.probe("https://example.test/"),
            self.probe("https://example.test/agent.json", machine=True)])
        self.assertEqual([x["url"] for x in result["worker:worker"]["observations"]], ["https://example.test/"])

    def test_html_fallback_truncation_and_string_flags_never_become_machine_success(self):
        raw = self.probe("https://example.test/agent.json", machine=True)
        for mutation in ({"valid_json": "false"}, {"truncated": True}, {"html": True},
                         {"content_type": "text/html"}, {"status": "200"}):
            with self.subTest(mutation=mutation):
                self.assertFalse(joiner.observation({**raw, **mutation})["machine_usable"])
        self.assertTrue(joiner.observation(raw)["machine_usable"])
        robot = self.probe("https://example.test/robots.txt")
        robot.update(html=False, content_type="text/plain")
        self.assertFalse(joiner.observation(robot)["machine_usable"])

    def test_sensitive_redirect_values_are_not_copied_to_snapshot(self):
        for location in ("https://login.test/?token=PRIVATE_SENTINEL", "https://login.test/#PRIVATE_SENTINEL",
                         "https://PRIVATE_SENTINEL@login.test/", "https://login.test/\nPRIVATE_SENTINEL"):
            selected = joiner.observation({**self.probe("https://example.test/"), "location": location})
            self.assertNotIn("location", selected)
            self.assertNotIn("PRIVATE_SENTINEL", json.dumps(selected))

    def test_private_and_defense_workers_remain_metadata_only(self):
        inventory = self.inventory(["tendlot-private", "flypaper"], [],
            [("app.example.test", "tendlot-private"), ("defense.example.test", "flypaper")])
        result = self.build(inventory, [self.probe("https://app.example.test/"),
            self.probe("https://defense.example.test/agent.json", machine=True)])
        for key, audience in (("worker:tendlot-private", "operator"), ("worker:flypaper", "infrastructure")):
            self.assertEqual(result[key]["observations"], [])
            self.assertIsNone(result[key]["human_start"])
            self.assertEqual(result[key]["audience"], audience)


if __name__ == "__main__":
    unittest.main()
