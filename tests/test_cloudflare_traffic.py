import contextlib
import copy
from datetime import datetime, timezone, timedelta
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import stat
import tempfile
import threading
import time
import unittest
from unittest import mock
import urllib.error
import urllib.parse


SPEC = importlib.util.spec_from_file_location("cloudflare_traffic", Path(__file__).parents[1] / "bin/cloudflare-traffic.py")
traffic = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(traffic)
ACCOUNT = "a" * 32
ZONE = "b" * 32
DB = "12345678-1234-1234-1234-123456789abc"
KV = "c" * 32
SECRET = "SYNTHETIC_SECRET_MUST_NEVER_APPEAR"
NOW = datetime(2026, 9, 25, 13, 37, tzinfo=timezone.utc)
WINDOW, HISTORY = traffic.windows(NOW)


def setting(fields, **changes):
    return {"enabled": True, "availableFields": list(fields), "maxPageSize": 10000,
            "maxDuration": 32 * 86400, "notOlderThan": 90 * 86400, **changes}


def all_settings():
    http = {"count", "sum_edgeResponseBytes", "avg_sampleInterval"}
    http.update("dimensions_" + dim for dims, _ in traffic.VIEWS.values() for dim in dims)
    account = {}
    for view, dataset in traffic.RUNTIME_DATASETS.items():
        account[dataset] = setting([*traffic.ACCOUNT_METRICS[view], *("dimensions_" + dim for dim in traffic.ACCOUNT_DIMS[view])])
    return {"zone": {traffic.HTTP_DATASET: setting(http), traffic.FIREWALL_DATASET: setting([], enabled=False)},
            "account": account}


def rest(items, *, page=1, per_page=50, total=None):
    total = len(items) if total is None else total
    return {"ok": True, "payload": {"success": True, "result": items, "result_info": {
        "page": page, "per_page": per_page, "count": len(items), "total_count": total,
        "total_pages": max(1, (total + per_page - 1) // per_page)}}}


def graphql(scope, data):
    return {"ok": True, "payload": {"data": {"viewer": {"zones" if scope == "zone" else "accounts": [data]}}, "errors": None}}


class FixtureClient:
    def __init__(self, zones=1):
        self.settings = all_settings()
        self.calls = []
        self.zone_count = zones
        self.fail_view = None
        self.metadata_failure = False
        self.live = self.maximum_live = 0
        self.lock = threading.Lock()

    def get_zones_page(self, account_id, page):
        self.calls.append(("zones", page))
        start = (page - 1) * 50
        return rest([{"id": format(index + 1, "032x"), "name": f"zone{index}.test", "account": {"id": account_id},
                      "owner": {"email": SECRET}} for index in range(start, min(start + 50, self.zone_count))],
                    page=page, total=self.zone_count)

    def get_metadata_page(self, account_id, kind, page):
        self.calls.append(("metadata", kind, page))
        if self.metadata_failure:
            return {"ok": False, "code": "permission_denied"}
        items = {"pages": [{"name": "actual-project", "production_script_name": "pages-worker--123-production",
                            "preview_script_name": "pages-worker--123-preview", "uses_functions": True,
                            "deployment_configs": {"TOKEN": SECRET}}],
                 "d1": [{"uuid": DB, "name": "database", "secret": SECRET}],
                 "kv": [{"id": KV, "title": "namespace", "keys": [SECRET]}]}[kind]
        return rest(items, page=page, per_page=10 if kind == "pages" else 50)

    def graphql(self, query, variables):
        traffic.guarded_query(query, variables)
        with self.lock:
            self.live += 1
            self.maximum_live = max(self.maximum_live, self.live)
        try:
            time.sleep(0.0001)
            self.calls.append((query, dict(variables)))
            scope = "zone" if "zones(filter:" in query else "account"
            if "TrafficSettings" in query:
                return graphql(scope, {"settings": self.settings[scope]})
            dataset = traffic.HTTP_DATASET if scope == "zone" else next(value for value in traffic.RUNTIME_DATASETS.values() if value + "(" in query)
            if self.fail_view and self.fail_view in query:
                return {"ok": False, "code": SECRET}
            dims_match = re.search(r"dimensions \{ ([^}]+) \}", query)
            dims = dims_match.group(1).split() if dims_match else []
            values = {
                "clientRequestHTTPHost": "public.test", "clientCountryName": "GB",
                "clientRequestHTTPMethodName": "GET", "edgeResponseStatus": 200, "originResponseStatus": 200,
                "clientRequestPath": "/v1/people/" + SECRET + "?token=" + SECRET,
                "userAgentBrowser": "Chrome", "verifiedBotCategory": "",
                "securityAction": "allow", "securitySource": "firewallRules", "requestSource": "eyeball",
                "datetimeHour": variables["start"], "scriptName": "pages-worker--123-production", "status": "success",
                "databaseId": DB, "namespaceId": KV, "actionType": "read", "responseStatusCode": 200, "result": "success",
            }
            item = {"count": 5, "sum": {"edgeResponseBytes": 100, "requests": 5, "errors": 0, "subrequests": 2,
                    "readQueries": 7, "writeQueries": 2, "rowsRead": 9, "rowsWritten": 3, "objectBytes": 40},
                    "avg": {"sampleInterval": 1}, "dimensions": {key: values[key] for key in dims},
                    "raw_log": SECRET}
            return graphql(scope, {dataset: [item]})
        finally:
            with self.lock:
                self.live -= 1


class WindowTests(unittest.TestCase):
    def test_completed_hour_and_seven_day_history(self):
        self.assertEqual(WINDOW, {"start": "2026-09-24T13:00:00Z", "end": "2026-09-25T13:00:00Z"})
        self.assertEqual(HISTORY["start"], "2026-09-18T13:00:00Z")
        window, _ = traffic.windows(NOW, "2026-09-25T12:00:00+00:00")
        self.assertEqual(window["end"], "2026-09-25T12:00:00Z")

    def test_naive_non_utc_future_and_partial_hours_are_rejected(self):
        for value in ("2026-09-25T13:00:00", "2026-09-25T13:00:00+01:00", "2026-09-25T14:00:00Z",
                      "2026-09-25T13:01:00Z", "2026-02-30T12:00:00Z", SECRET):
            with self.subTest(value=value), self.assertRaises(traffic.TrafficError):
                traffic.windows(NOW, value)
        with self.assertRaises(traffic.TrafficError):
            traffic.windows(NOW.replace(tzinfo=None))


class ProjectionTests(unittest.TestCase):
    def operation(self, path, count=3, sample=1):
        return {"count": count, "sum": {"edgeResponseBytes": 20}, "avg": {"sampleInterval": sample},
                "dimensions": {"clientRequestPath": path, "clientRequestHTTPMethodName": "POST", "edgeResponseStatus": 403,
                               "clientIP": SECRET, "userAgent": SECRET, "clientRequestQuery": SECRET}}

    def test_paths_reduce_to_finite_families_and_merge_counts_without_secrets(self):
        raw = [self.operation("/api/people/" + SECRET), self.operation("/api/token/another?key=" + SECRET, 7)]
        rows = traffic.project_rows(raw, scope="zone", dims=traffic.VIEWS["operations"][0],
            metrics=["sum_edgeResponseBytes", "avg_sampleInterval"], view="operations", window=WINDOW, limit=1000)
        self.assertEqual(rows, [{"requests": 10, "bytes": 40, "sample_interval": 1,
            "dimensions": {"clientRequestHTTPMethodName": "POST", "edgeResponseStatus": 403, "route_family": "api-write-attempt"}}])
        self.assertNotIn(SECRET, json.dumps(rows))
        self.assertNotIn("clientRequestPath", json.dumps(rows))

    def test_route_families_are_finite_and_encoded_probes_are_not_echoed(self):
        cases = {"/.%65nv?token=" + SECRET: "config-probe", "/llms.txt": "discovery", "/": "human-root",
                 "/static/" + SECRET: "static", "/v1/a": "api-read", "/other/" + SECRET: "other",
                 "https://bad.test/?" + SECRET: "other"}
        for path, family in cases.items():
            self.assertEqual(traffic.route_family(path, "GET"), family)
        self.assertEqual(traffic.route_family("/v1/a", "POST"), "api-write-attempt")

    def test_collapsed_sampling_does_not_invent_average_of_averages(self):
        rows = traffic.project_rows([self.operation("/api/a", sample=2), self.operation("/api/b", sample=7)],
            scope="zone", dims=traffic.VIEWS["operations"][0], metrics=["avg_sampleInterval"],
            view="operations", window=WINDOW, limit=1000)
        self.assertNotIn("sample_interval", rows[0])

    def test_hosts_accept_observed_ports_but_never_urls_or_credentials(self):
        hosts = ["thekingdom.dev:2082", "thekingdom.dev:2083", "thekingdom.dev:2086",
                 "thekingdom.dev:2087", "play.thekingdom.dev:443", "EXAMPLE.test:65535"]
        raw = [{"count": 1, "dimensions": {"clientRequestHTTPHost": host}} for host in hosts]
        rows = traffic.project_rows(raw, scope="zone", dims=traffic.VIEWS["hosts"][0], metrics=[],
                                    view="hosts", window=WINDOW, limit=300)
        self.assertEqual({row["dimensions"]["clientRequestHTTPHost"] for row in rows}, {host.lower() for host in hosts})
        for bad in ("user:password@example.test", "user@example.test:443", "https://example.test:443",
                    "example.test:443/path", "example.test:443?token=" + SECRET, "example.test#fragment",
                    "example.test:0", "example.test:65536", "example.test:", "example.test:-1",
                    "example.test:1:443", "example.test: 443", "example.test:443\n", "bad..test:443",
                    "-bad.test:443", "bad-.test:443", ":443"):
            with self.subTest(value=bad), self.assertRaises(traffic.TrafficError):
                traffic.dimension("clientRequestHTTPHost", bad, WINDOW)

    def test_vendor_bot_category_accepts_ampersand_with_bounded_safe_text(self):
        raw = [{"count": 2, "dimensions": {"userAgentBrowser": "Chrome", "verifiedBotCategory": "Monitoring & Analytics",
                                           "userAgent": SECRET}}]
        rows = traffic.project_rows(raw, scope="zone", dims=traffic.VIEWS["clients"][0], metrics=[],
                                    view="clients", window=WINDOW, limit=300)
        self.assertEqual(rows[0]["dimensions"]["verifiedBotCategory"], "Monitoring & Analytics")
        self.assertNotIn(SECRET, json.dumps(rows))
        for bad in ("<script>alert(1)</script>", "Monitoring\nAnalytics", "A" * 81):
            with self.assertRaises(traffic.TrafficError):
                traffic.dimension("verifiedBotCategory", bad, WINDOW)

    def test_invalid_numeric_types_and_provider_shape_fail_closed(self):
        for count in (True, -1, float("nan"), float("inf"), 10**400, SECRET):
            with self.subTest(count=str(count)[:10]), self.assertRaises(traffic.TrafficError):
                traffic.project_rows([{"count": count}], scope="zone", dims=(), metrics=[],
                                     view="traffic_total", window=WINDOW, limit=1)
        with self.assertRaises(traffic.TrafficError):
            traffic.project_rows([{"count": 1}] * 2, scope="zone", dims=(), metrics=[], view="traffic_total", window=WINDOW, limit=1)

    def test_total_limit_one_is_not_top_k_but_operations_use_raw_count(self):
        client = FixtureClient()
        total = traffic.collect_view(client, "zone", ZONE, "test", "traffic_total", traffic.HTTP_DATASET,
                                     client.settings["zone"][traffic.HTTP_DATASET], WINDOW, NOW)
        self.assertFalse(total["truncated"])
        self.assertEqual(total["rows_received"], 1)
        client.settings["zone"][traffic.HTTP_DATASET]["maxPageSize"] = 2
        original = client.graphql
        def duplicate(query, variables):
            reply = original(query, variables)
            rows = reply["payload"]["data"]["viewer"]["zones"][0][traffic.HTTP_DATASET]
            rows.append(copy.deepcopy(rows[0]))
            return reply
        client.graphql = duplicate
        ops = traffic.collect_view(client, "zone", ZONE, "test", "operations", traffic.HTTP_DATASET,
                                   client.settings["zone"][traffic.HTTP_DATASET], WINDOW, NOW)
        self.assertTrue(ops["truncated"])
        self.assertEqual(ops["rows_received"], 2)
        self.assertEqual(len(ops["rows"]), 1)


class CollectionTests(unittest.TestCase):
    def test_complete_fixture_projects_only_allowlisted_aggregates(self):
        client = FixtureClient(4)
        snapshot = traffic.collect(client, ACCOUNT, now=NOW)
        encoded = json.dumps(snapshot)
        self.assertNotIn(SECRET, encoded)
        for forbidden in ("clientRequestPath", "clientIP", "userAgent\"", "deployment_configs", '"raw_log"'):
            self.assertNotIn(forbidden, encoded)
        self.assertEqual(snapshot["scope"]["zones_expected"], 4)
        self.assertEqual(snapshot["coverage"], {"complete": False, "observations": 44, "ok": 40, "unavailable": 4, "errors": 0})
        self.assertLessEqual(client.maximum_live, 3)
        self.assertGreaterEqual(client.maximum_live, 2)
        queries = [call[0] for call in client.calls if isinstance(call[0], str) and call[0].startswith("query")]
        self.assertFalse(any("firewallEventsAdaptiveGroups(" in query for query in queries))
        self.assertFalse(any(re.search(r"\b(clientIP|userAgent|clientRequestQuery|clientRequestReferer)\b", query) for query in queries))
        data_queries = [query for query in queries if "TrafficData" in query and "zones(filter:" in query]
        self.assertEqual(sum('requestSource: "eyeball"' not in query for query in data_queries), 4)

    def test_exact_metadata_join_keeps_storage_effects_separate_from_requests(self):
        snapshot = traffic.collect(FixtureClient(), ACCOUNT, now=NOW)
        by_view = {item["view"]: item for item in snapshot["observations"]}
        self.assertEqual(by_view["pages_functions"]["rows"][0]["dimensions"]["projectName"], "actual-project")
        d1 = by_view["d1_operations"]["rows"][0]
        self.assertNotIn("requests", d1)
        self.assertEqual(d1["write_queries"], 2)
        self.assertEqual(d1["rows_written"], 3)
        self.assertEqual(d1["dimensions"]["databaseName"], "database")
        self.assertEqual(by_view["kv_operations"]["rows"][0]["dimensions"]["namespaceName"], "namespace")
        self.assertIn("application_reads_may_write_quota_or_housekeeping_state", snapshot["limitations"])

    def test_name_lookup_failure_does_not_erase_observed_runtime_counts(self):
        client = FixtureClient()
        client.metadata_failure = True
        snapshot = traffic.collect(client, ACCOUNT, now=NOW)
        pages = next(item for item in snapshot["observations"] if item["view"] == "pages_functions")
        self.assertEqual(pages["state"], "ok")
        self.assertNotIn("projectName", pages["rows"][0]["dimensions"])
        self.assertIn("pages_identity_unmapped", snapshot["limitations"])

    def test_settings_gaps_and_retention_are_not_zero_counts(self):
        client = FixtureClient()
        client.settings["zone"][traffic.HTTP_DATASET]["notOlderThan"] = 2 * 86400
        snapshot = traffic.collect(client, ACCOUNT, now=NOW)
        history = next(item for item in snapshot["observations"] if item["view"] == "timeline")
        self.assertEqual((history["state"], history["reason"], history["rows"]), ("unavailable", "window_outside_retention", []))
        self.assertFalse(any("datetimeHour_ASC" in call[0] for call in client.calls if isinstance(call[0], str)))
        client.settings["zone"][traffic.HTTP_DATASET]["availableFields"].remove("dimensions_clientCountryName")
        country = traffic.collect_view(client, "zone", ZONE, "test", "countries", traffic.HTTP_DATASET,
                                       client.settings["zone"][traffic.HTTP_DATASET], WINDOW, NOW)
        self.assertEqual(country["reason"], "required_fields_unavailable")

    def test_optional_metrics_are_not_queried_when_unavailable(self):
        client = FixtureClient()
        settings = client.settings["zone"][traffic.HTTP_DATASET]
        settings["availableFields"].remove("sum_edgeResponseBytes")
        result = traffic.collect_view(client, "zone", ZONE, "test", "traffic_total", traffic.HTTP_DATASET, settings, WINDOW, NOW)
        self.assertEqual(result["state"], "ok")
        self.assertNotIn("bytes", result["rows"][0])
        self.assertNotIn("edgeResponseBytes", client.calls[-1][0])
        self.assertEqual(result["missing_metrics"], ["sum_edgeResponseBytes"])

    def test_settings_transport_failure_is_an_error_not_a_disabled_dataset(self):
        client = FixtureClient()
        client.graphql = lambda query, variables: {"ok": False, "code": "transport_error"}
        snapshot = traffic.collect(client, ACCOUNT, now=NOW)
        self.assertEqual(snapshot["coverage"], {"complete": False, "observations": 14, "ok": 0, "unavailable": 0, "errors": 14})
        self.assertTrue(all(item["reason"] == "transport_error" for item in snapshot["observations"]))

    def test_valid_empty_success_differs_from_failure_and_errors_are_constant(self):
        client = FixtureClient()
        client.graphql = lambda query, variables: graphql("zone", {traffic.HTTP_DATASET: []})
        obs = traffic.collect_view(client, "zone", ZONE, "test", "hosts", traffic.HTTP_DATASET,
                                   client.settings["zone"][traffic.HTTP_DATASET], WINDOW, NOW)
        self.assertEqual((obs["state"], obs["rows_received"], obs["truncated"]), ("ok", 0, False))
        client.graphql = lambda query, variables: {"ok": False, "code": SECRET}
        obs = traffic.collect_view(client, "zone", ZONE, "test", "hosts", traffic.HTTP_DATASET,
                                   client.settings["zone"][traffic.HTTP_DATASET], WINDOW, NOW)
        self.assertEqual((obs["state"], obs["reason"]), ("error", "invalid_response"))
        self.assertNotIn(SECRET, json.dumps(obs))


class PaginationTests(unittest.TestCase):
    def test_zone_account_filter_pagination_and_exact_total(self):
        client = FixtureClient(51)
        rows = traffic.list_zones(client, ACCOUNT)
        self.assertEqual(len(rows), 51)
        self.assertEqual(client.calls, [("zones", 1), ("zones", 2)])
        self.assertNotIn(SECRET, json.dumps(rows))
        self.assertEqual(traffic.list_zones(FixtureClient(0), ACCOUNT), [])

    def test_incomplete_duplicate_cross_account_and_drifting_inventory_are_fatal(self):
        for mode in ("short", "duplicate", "cross_account", "drift", "boolean_count"):
            client = FixtureClient(51)
            original = client.get_zones_page
            def changed(account, page):
                reply = original(account, page)
                if mode == "short": reply["payload"]["result"] = []
                if mode == "duplicate" and page == 2: reply["payload"]["result"][0]["id"] = format(1, "032x")
                if mode == "cross_account": reply["payload"]["result"][0]["account"]["id"] = "d" * 32
                if mode == "drift" and page == 2: reply["payload"]["result_info"]["total_count"] = 52
                if mode == "boolean_count": reply["payload"]["result_info"]["total_count"] = True
                return reply
            client.get_zones_page = changed
            with self.subTest(mode=mode), self.assertRaises(traffic.TrafficError):
                traffic.list_zones(client, ACCOUNT)

    def test_pages_pagination_joins_exact_names_and_rejects_collisions(self):
        client = FixtureClient()
        def pages(account, kind, page):
            start = (page - 1) * 10
            items = [{"name": "project" + str(i), "production_script_name": "worker-" + str(i)} for i in range(start, min(start + 10, 11))]
            return rest(items, page=page, per_page=10, total=11)
        client.get_metadata_page = pages
        names, complete = traffic.metadata_names(client, ACCOUNT, "pages")
        self.assertTrue(complete)
        self.assertEqual(names["worker-10"], "project10")
        client.get_metadata_page = lambda *args: rest([{"name": "one", "production_script_name": "same"},
            {"name": "two", "production_script_name": "same"}], per_page=10)
        self.assertEqual(traffic.metadata_names(client, ACCOUNT, "pages"), ({}, False))


class Response:
    def __init__(self, payload, url=None):
        self.raw = payload if isinstance(payload, bytes) else json.dumps(payload).encode()
        self.url = url
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def geturl(self): return self.url
    def read(self, limit): return self.raw[:limit]


class Opener:
    def __init__(self, response):
        self.response, self.calls = response, []
    def open(self, request, timeout):
        self.calls.append((request, timeout))
        if isinstance(self.response, Exception): raise self.response
        if self.response.url is None: self.response.url = request.full_url
        return self.response


class TransportTests(unittest.TestCase):
    def test_timeline_uses_introspected_unprefixed_order_enum(self):
        query = traffic.data_query("zone", traffic.HTTP_DATASET, ("datetimeHour",), ["avg_sampleInterval"], "timeline")
        self.assertIn("orderBy: [datetimeHour_ASC]", query)
        self.assertNotIn("dimensions_datetimeHour_ASC", query)
        variables = {"tag": ZONE, **HISTORY, "limit": 1000}
        traffic.guarded_query(query, variables)
        with self.assertRaises(traffic.TrafficError):
            traffic.guarded_query(query.replace("datetimeHour_ASC", "dimensions_datetimeHour_ASC"), variables)

    def test_api_origin_query_only_and_no_raw_error_body(self):
        opener = Opener(Response({"errors": [{"message": SECRET, "extensions": {"code": SECRET}}], "data": {"secret": SECRET}}))
        client = traffic.Client("fixture-token", opener=opener)
        reply = client.graphql(traffic.settings_query("zone"), {"tag": ZONE})
        self.assertEqual(reply, {"ok": False, "code": "graphql_error"})
        request, timeout = opener.calls[0]
        self.assertEqual(request.full_url, traffic.API + "/graphql")
        self.assertEqual((request.method, timeout), ("POST", 30))
        self.assertNotIn(SECRET, json.dumps(reply))
        for bad in ("mutation { deleteAccount }", "query TrafficSettings($tag: string!) { viewer { clientIP } }",
                    traffic.settings_query("zone") + " mutation { deleteAccount }", "query TrafficSettings { __schema { types { name } } }"):
            with self.assertRaises(traffic.TrafficError): client.graphql(bad, {"tag": ZONE})
        self.assertEqual(len(opener.calls), 1)

    def test_get_paths_are_fixed_and_account_filtered(self):
        opener = Opener(Response({"success": True, "result": []}))
        client = traffic.Client("fixture-token", opener=opener)
        client.get_zones_page(ACCOUNT, 1)
        request = opener.calls[0][0]
        parsed = urllib.parse.urlsplit(request.full_url)
        self.assertEqual(parsed.path, "/client/v4/zones")
        self.assertEqual(urllib.parse.parse_qs(parsed.query)["account.id"], [ACCOUNT])
        self.assertEqual(request.method, "GET")
        with self.assertRaises(traffic.TrafficError): client.get_metadata_page(ACCOUNT, "../../tokens", 1)

    def test_redirect_oversize_duplicate_json_and_budget_are_bounded(self):
        for response, reason in ((Response({}, "https://untrusted.test/"), "redirect_refused"),
                                 (Response(b"x" * (traffic.MAX_RESPONSE + 1)), "response_too_large"),
                                 (Response(b'{"success":true,"success":false}'), "invalid_json"),
                                 (Response(b'{"value":NaN}'), "invalid_json")):
            client = traffic.Client("fixture-token", opener=Opener(response))
            self.assertEqual(client.get_zones_page(ACCOUNT, 1)["code"], reason)
        opener = Opener(Response({}))
        client = traffic.Client("fixture-token", opener=opener, budget=traffic.Budget(requests=0))
        self.assertEqual(client.get_zones_page(ACCOUNT, 1)["code"], "request_budget_exhausted")
        self.assertEqual(opener.calls, [])
        self.assertIsNone(traffic.NoRedirect().redirect_request(None, None, 302, "", {}, "https://untrusted.test/"))


class PrivateOutputTests(unittest.TestCase):
    def test_new_output_is_private_and_existing_symlink_shared_directory_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "snapshot.json"
            traffic.safe_write_new(target, {"safe": True})
            self.assertEqual(stat.S_IMODE(target.stat().st_mode), 0o600)
            with self.assertRaises(traffic.TrafficError): traffic.safe_write_new(target, {})
            link = root / "symlink.json"
            link.symlink_to(target)
            with self.assertRaises(traffic.TrafficError): traffic.safe_write_new(link, {})
            root.chmod(0o755)
            with self.assertRaises(traffic.TrafficError): traffic.safe_write_new(root / "shared.json", {})
            root.chmod(0o700)

    def test_failed_reserved_snapshot_is_removed_and_cli_checks_output_before_credentials(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "snapshot.json"
            with self.assertRaises(traffic.TrafficError):
                with traffic.private_output(target) as stream:
                    stream.write("partial")
                    raise traffic.TrafficError("fixture_failure")
            self.assertFalse(target.exists())
            target.write_text("existing")
            with mock.patch.object(traffic, "credential") as credential, contextlib.redirect_stderr(io.StringIO()):
                code = traffic.main(["--account-id", ACCOUNT, "--output", str(target)])
            self.assertEqual(code, 2)
            credential.assert_not_called()

    def test_cli_partial_is_successful_and_stdout_has_no_details(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "snapshot.json"
            output = io.StringIO()
            with mock.patch.object(traffic, "credential", return_value="fixture-token"), mock.patch.object(traffic, "Client", return_value=FixtureClient()), contextlib.redirect_stdout(output):
                code = traffic.main(["--account-id", ACCOUNT, "--output", str(target)])
            self.assertEqual(code, 0)
            summary = json.loads(output.getvalue())
            self.assertEqual(summary["status"], "partial")
            self.assertNotIn(ACCOUNT, output.getvalue())
            self.assertNotIn(SECRET, target.read_text())

    def test_environment_precedence_and_local_oauth_fixture_without_refresh(self):
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            config = home / ".wrangler/config/default.toml"
            config.parent.mkdir(parents=True)
            config.write_text('oauth_token = "fixture-oauth-token"\nrefresh_token = "' + SECRET + '"\n')
            self.assertEqual(traffic.credential(environ={}, home=home), "fixture-oauth-token")
            self.assertEqual(traffic.credential(environ={"CLOUDFLARE_API_TOKEN": "fixture-env-token"}, home=home), "fixture-env-token")
            for bad in ("", "line\nbreak", "token\x00", None):
                with self.assertRaises(traffic.TrafficError):
                    traffic.credential(environ={"CLOUDFLARE_API_TOKEN": bad}, home=home)
            config.unlink()
            other = home / "other.toml"
            other.write_text('oauth_token = "fixture-oauth-token"\n')
            config.symlink_to(other)
            with self.assertRaises(traffic.TrafficError): traffic.credential(environ={}, home=home)


if __name__ == "__main__":
    unittest.main()
