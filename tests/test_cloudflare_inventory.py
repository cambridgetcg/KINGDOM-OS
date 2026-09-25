import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import stat
import tempfile
import unittest
from unittest import mock
import urllib.error
import urllib.parse


SPEC = importlib.util.spec_from_file_location(
    "cloudflare_inventory", Path(__file__).parents[1] / "bin/cloudflare-inventory.py"
)
inventory = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(inventory)

ACCOUNT = "a" * 32
SECOND_ACCOUNT = "b" * 32
ZONE = "c" * 32
RECORD = "d" * 32
SECRET = "DO_NOT_PERSIST_THE_SYNTHETIC_SECRET"


def success(items, pagination=None):
    return {"ok": True, "result": items, "pagination": pagination}


class FixtureClient:
    def __init__(self, response):
        self.response = response
        self.paths = []

    def get(self, path):
        self.paths.append(path)
        return self.response(path)


class ProjectionTests(unittest.TestCase):
    def test_nested_sensitive_fields_never_reach_projection(self):
        value = {
            "name": "public-site", "subdomain": "public-site.pages.dev",
            "domains": ["example.test", {"token": SECRET}],
            "env_vars": {"TOKEN": SECRET}, "build_config": {"command": SECRET},
            "deployment_configs": {"production": {"bindings": SECRET}},
            "source": {"type": "github", "config": {"owner": "owner", "repo_name": "repo",
                "access_token": SECRET, "production_branch": "main"}},
            "canonical_deployment": {"id": "deployment", "environment": "production",
                "url": "https://first.public-site.pages.dev", "env_vars": SECRET,
                "latest_stage": {"name": "deploy", "status": "success", "message": SECRET},
                "deployment_trigger": {"type": "ad_hoc", "metadata": {"branch": "main",
                    "commit_hash": "f" * 40, "commit_dirty": True,
                    "commit_message": SECRET, "access_token": SECRET}}},
        }
        selected = inventory.project(value)
        serialized = json.dumps(selected)
        self.assertNotIn(SECRET, serialized)
        self.assertNotIn("commit_message", serialized)
        self.assertNotIn("build_config", serialized)
        self.assertEqual(selected["canonical_deployment"]["trigger"]["metadata"], {
            "branch": "main", "commit_hash": "f" * 40, "commit_dirty": True})
        self.assertEqual(selected["domains"], ["example.test"])
        self.assertIn(SECRET, json.dumps(value))  # Input was not destructively redacted.

    def test_incorrect_types_and_token_bearing_urls_are_dropped(self):
        selected = inventory.project({"name": "site", "production_branch": {"secret": SECRET},
            "source": {"type": {"secret": SECRET}, "config": [SECRET]},
            "latest_deployment": {"url": "https://site.pages.dev/?token=" + SECRET,
                "latest_stage": {"status": {"secret": SECRET}},
                "deployment_trigger": {"metadata": {"commit_hash": SECRET}}}})
        self.assertNotIn(SECRET, json.dumps(selected))
        self.assertNotIn("url", selected["latest_deployment"])
        for bad in (None, [], {"name": "../../settings"}, {"name": "bad\nname"}):
            with self.assertRaises(inventory.InventoryError):
                inventory.project(bad)

    def test_dns_and_workers_never_copy_contents_bindings_or_raw_routes(self):
        selected = inventory.dns_record({"id": RECORD, "name": "_verify.example.test",
            "type": "TXT", "proxied": False, "content": SECRET, "comment": SECRET,
            "data": {"mail": SECRET}, "meta": {"secret": SECRET}})
        self.assertEqual(selected, {"id": RECORD, "name": "_verify.example.test", "type": "TXT", "proxied": False})
        selected = inventory.worker({"id": "worker", "has_assets": True,
            "bindings": [{"text": SECRET}], "routes": [{"token": SECRET}], "has_modules": SECRET})
        self.assertEqual(selected, {"id": "worker", "has_assets": True})
        selected = inventory.zone({"id": ZONE, "account": {"id": ACCOUNT, "name": "owner", "settings": SECRET},
            "owner": {"email": SECRET}, "name": "example.test"})
        self.assertNotIn(SECRET, json.dumps(selected))

    def test_worker_custom_domain_identity_is_not_assumed_to_be_a_zone_id(self):
        for identifier in ("c17b8498-b4b6-4a55-a106-41cd8b8d62cc", "a" * 40):
            selected = inventory.worker_domain({"id": identifier, "hostname": "example.test",
                "service": "worker", "certificate": SECRET})
            self.assertEqual(selected, {"id": identifier, "hostname": "example.test", "service": "worker"})


class PaginationTests(unittest.TestCase):
    def test_projects_request_ten_per_page_and_match_total(self):
        def respond(path):
            query = urllib.parse.parse_qs(urllib.parse.urlsplit(path).query)
            self.assertEqual(query["per_page"], ["10"])
            page = int(query["page"][0])
            start = (page - 1) * 10
            items = [{"name": "project-" + str(n)} for n in range(start, min(start + 10, 23))]
            return success(items, {"page": page, "count": len(items), "per_page": 10,
                "total_count": 23, "total_pages": 3})
        client = FixtureClient(respond)
        result = inventory.listing(client, "/accounts/" + ACCOUNT + "/pages/projects",
            inventory.project, per_page=10)
        self.assertTrue(result["complete"])
        self.assertEqual(len(result["items"]), 23)
        self.assertEqual(result["pages_read"], 3)
        self.assertEqual(result["page_size"], 10)
        self.assertEqual(result["pages"], [{"page": 1, "ok": True, "item_count": 10},
            {"page": 2, "ok": True, "item_count": 10}, {"page": 3, "ok": True, "item_count": 3}])

    def test_no_totals_require_empty_page_even_if_provider_caps_size(self):
        pages = iter([[{"name": "one"}], [{"name": "two"}], []])
        client = FixtureClient(lambda path: success(next(pages)))
        result = inventory.listing(client, "/projects", inventory.project, per_page=10)
        self.assertTrue(result["complete"])
        self.assertEqual(len(client.paths), 3)

    def test_single_page_has_no_pagination_arguments(self):
        client = FixtureClient(lambda path: success([{"id": "worker"}]))
        result = inventory.listing(client, "/accounts/" + ACCOUNT + "/workers/scripts", inventory.worker)
        self.assertTrue(result["complete"])
        self.assertEqual(client.paths, ["/accounts/" + ACCOUNT + "/workers/scripts"])

    def test_permission_failure_preserves_partial_items_and_suppresses_details(self):
        pages = iter([success([{"name": "first"}], {"total_pages": 2}),
            {"ok": False, "http_status": 403, "code": "permission_denied", "message": SECRET, "result": SECRET}])
        result = inventory.listing(FixtureClient(lambda path: next(pages)), "/projects", inventory.project, per_page=10)
        self.assertFalse(result["complete"])
        self.assertEqual(result["items"], [{"name": "first"}])
        self.assertEqual(result["errors"], [{"code": "permission_denied", "http_status": 403}])
        self.assertEqual(result["pages"][-1], {"page": 2, "ok": False,
            "code": "permission_denied", "http_status": 403})
        self.assertNotIn(SECRET, json.dumps(result))

    def test_duplicate_drift_stall_limits_and_bad_totals_are_incomplete(self):
        cases = [
            ([success([{"name": "same"}], {"total_pages": 2}),
              success([{"name": "same"}], {"total_pages": 2})], "duplicate_item"),
            ([success([{"name": "a"}], {"total_count": 2}),
              success([{"name": "b"}], {"total_count": 3})], "inventory_changed_during_pagination"),
            ([success([{"name": "a"}], {"total_pages": 5}),
              success([{"name": "b"}], {"total_pages": 1})], "inventory_changed_during_pagination"),
            ([success([], {"total_pages": 2, "total_count": 3})], "pagination_stalled"),
            ([success([{"name": "a"}], {"page": True})], "invalid_pagination"),
            ([success([{"name": "a"}], {"per_page": 0})], "invalid_pagination"),
            ([success([{"name": "a"}], {"total_pages": 0})], "inconsistent_pagination"),
            ([success([{"name": "a"}], {"total_count": 9, "total_pages": 1})], "count_mismatch"),
        ]
        for replies, code in cases:
            with self.subTest(code=code):
                iterator = iter(replies)
                result = inventory.listing(FixtureClient(lambda path: next(iterator)), "/projects",
                    inventory.project, per_page=10)
                self.assertFalse(result["complete"])
                self.assertIn(code, [error["code"] for error in result["errors"]])
        result = inventory.listing(FixtureClient(lambda path: success([{"name": "a"}])),
            "/projects", inventory.project, per_page=10, max_pages=1)
        self.assertEqual(result["errors"], [{"code": "page_limit"}])

    def test_single_page_unexpected_remaining_rows_is_not_complete(self):
        result = inventory.listing(FixtureClient(lambda path: success([{"id": "worker"}],
            {"total_count": 8, "total_pages": 2})), "/workers", inventory.worker)
        self.assertFalse(result["complete"])
        self.assertIn("unexpected_pagination", [x["code"] for x in result["errors"]])


class CollectionTests(unittest.TestCase):
    def fixture(self, path):
        parsed = urllib.parse.urlsplit(path)
        if parsed.path == "/accounts":
            return success([{"id": ACCOUNT}], {"total_pages": 1})
        if parsed.path == "/zones":
            self.assertIn("internal", parsed.query)
            return success([{"id": ZONE, "name": "example.test", "account": {"id": SECOND_ACCOUNT}}],
                {"total_pages": 1})
        if parsed.path.endswith("/pages/projects"):
            return success([{"name": "site", "env_vars": SECRET}], {"total_pages": 1})
        if parsed.path.endswith("/workers/scripts"):
            return success([{"id": "flypaper", "bindings": SECRET}])
        if parsed.path.endswith("/workers/subdomain"):
            return success({"subdomain": "test", "secret": SECRET})
        if parsed.path.endswith("/scripts/flypaper/subdomain"):
            return success({"enabled": False, "previews_enabled": True, "token": SECRET})
        if parsed.path.endswith("/domains") or parsed.path.endswith("/workers/routes"):
            return success([])
        self.fail("Unexpected endpoint: " + parsed.path)

    def test_all_visible_and_zone_discovered_accounts_without_service_probes(self):
        client = FixtureClient(self.fixture)
        result = inventory.collect(client)
        self.assertTrue(result["complete"])
        self.assertEqual({x["account_id"] for x in result["accounts_inventory"]}, {ACCOUNT, SECOND_ACCOUNT})
        self.assertEqual(result["zone_dns"][0]["errors"], [{"code": "not_requested"}])
        self.assertFalse(result["dns_requested"])
        self.assertNotIn(SECRET, json.dumps(result))
        self.assertTrue(all(path.startswith(("/accounts", "/zones")) for path in client.paths))
        self.assertFalse(any("https:" in path for path in client.paths))
        worker_metadata = result["accounts_inventory"][0]["worker_subdomains"][0]
        self.assertEqual(worker_metadata["item"], {"enabled": False, "previews_enabled": True})

    def test_separate_dns_credential_and_permission_gap(self):
        primary = FixtureClient(self.fixture)
        dns = FixtureClient(lambda path: {"ok": False, "http_status": 403, "code": "permission_denied"})
        result = inventory.collect(primary, dns_client=dns)
        self.assertFalse(result["complete"])
        self.assertEqual(result["coverage"]["incomplete_sets"], 1)
        self.assertTrue(result["dns_requested"])
        self.assertTrue(all("/dns_records" in path for path in dns.paths))
        self.assertFalse(any("/dns_records" in path for path in primary.paths))
        self.assertEqual(result["zone_dns"][0]["errors"][0]["http_status"], 403)


class TransportAndOutputTests(unittest.TestCase):
    def test_get_only_fixed_api_and_no_redirect_handler(self):
        reply = io.BytesIO(b'{"success":true,"result":[]}')
        reply.geturl = lambda: inventory.API + "/accounts"
        opener = mock.Mock()
        opener.open.return_value = reply
        client = inventory.Client("test-token", opener=opener)
        self.assertTrue(client.get("/accounts")["ok"])
        request = opener.open.call_args.args[0]
        self.assertEqual(request.get_method(), "GET")
        self.assertEqual(request.full_url, inventory.API + "/accounts")
        self.assertIsNone(inventory.NoRedirect().redirect_request(request, None, 302, "", {}, "https://untrusted.test"))
        with self.assertRaises(inventory.InventoryError):
            client.get("https://untrusted.test/")

    def test_http_error_and_response_limits_do_not_leak(self):
        opener = mock.Mock()
        opener.open.side_effect = urllib.error.HTTPError(inventory.API, 403, SECRET, {}, io.BytesIO(SECRET.encode()))
        reply = inventory.Client("test-token", opener=opener).get("/zones")
        self.assertEqual(reply, {"ok": False, "http_status": 403, "code": "permission_denied"})
        oversized = io.BytesIO(b"x" * 21)
        oversized.geturl = lambda: inventory.API + "/accounts"
        opener.open.side_effect = None
        opener.open.return_value = oversized
        with mock.patch.object(inventory, "MAX_RESPONSE", 20):
            self.assertEqual(inventory.Client("test-token", opener=opener).get("/accounts")["code"], "response_too_large")
        with mock.patch.object(opener, "open") as forbidden:
            reply = inventory.Client("test-token", opener=opener, budget=inventory.Budget(max_requests=0)).get("/accounts")
            self.assertEqual(reply["code"], "request_budget_exhausted")
            forbidden.assert_not_called()

    def test_credentials_prefer_environment_without_refresh_or_config_read(self):
        with mock.patch.object(inventory.os, "open", side_effect=AssertionError("must not read config")):
            self.assertEqual(inventory.credential(environ={"CLOUDFLARE_API_TOKEN": "child-token"}),
                ("child-token", "child_environment"))
            with self.assertRaises(inventory.InventoryError):
                inventory.credential(environ={"CLOUDFLARE_API_TOKEN": ""})
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "default.toml"
            original = 'oauth_token = "test-access"\nrefresh_token = "NEVER_USED"\n'
            path.write_text(original)
            self.assertEqual(inventory.credential(environ={}, config=path), ("test-access", "existing_wrangler_oauth"))
            self.assertEqual(path.read_text(), original)

    def test_credential_config_symlinks_and_fifos_are_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "real.toml"
            target.write_text('oauth_token = "test-access"\n')
            alias = root / "alias.toml"
            alias.symlink_to(target)
            fifo = root / "fifo.toml"
            os.mkfifo(fifo)
            for path in (alias, fifo):
                with self.subTest(path=path.name), self.assertRaises(inventory.InventoryError):
                    inventory.credential(environ={}, config=path)

    def test_private_output_exclusive_and_shared_directory_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "inventory.json"
            with inventory.open_private_output(output) as stream:
                stream.write("private metadata")
            self.assertEqual(stat.S_IMODE(output.stat().st_mode), 0o600)
            with self.assertRaises(inventory.InventoryError):
                inventory.open_private_output(output)
            self.assertEqual(output.read_text(), "private metadata")
            alias = root / "alias.json"
            alias.symlink_to(output)
            with self.assertRaises(inventory.InventoryError):
                inventory.open_private_output(alias)
            root.chmod(0o755)
            with self.assertRaisesRegex(inventory.InventoryError, "output_directory_not_private"):
                inventory.open_private_output(root / "new.json")

    def test_cli_stdout_is_counts_only_and_dns_env_is_separate(self):
        with tempfile.TemporaryDirectory() as directory, mock.patch.dict(os.environ,
                {"CLOUDFLARE_API_TOKEN": "main-token", "CF_DNS_TOKEN": "dns-token"}, clear=True):
            result = {"complete": False, "accounts": {"items": [{"name": "PRIVATE_NAME"}]},
                "zones": {"items": []}, "coverage": {"requested_sets": 2, "incomplete_sets": 1}}
            with mock.patch.object(inventory, "collect", return_value=result) as collect, \
                    contextlib.redirect_stdout(io.StringIO()) as stdout:
                output = Path(directory) / "result.json"
                code = inventory.main(["--output", str(output), "--dns-token-env", "CF_DNS_TOKEN"])
            self.assertEqual(code, 1)
            self.assertNotIn("PRIVATE_NAME", stdout.getvalue())
            self.assertNotIn("token", stdout.getvalue())
            self.assertEqual(collect.call_args.args[0]._token, "main-token")
            self.assertEqual(collect.call_args.kwargs["dns_client"]._token, "dns-token")
            self.assertEqual(json.loads(output.read_text())["credential_source"], "child_environment")


if __name__ == "__main__":
    unittest.main()
