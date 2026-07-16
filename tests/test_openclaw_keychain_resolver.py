import importlib.util
import pathlib
import unittest
from unittest import mock


ROOT = pathlib.Path(__file__).parents[1]
SPEC = importlib.util.spec_from_file_location(
    "keychain_resolver", ROOT / "bin" / "openclaw-keychain-resolver.py"
)
resolver = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(resolver)


class ResolverTests(unittest.TestCase):
    def test_resolves_only_allowlisted_id(self):
        with mock.patch.object(resolver, "read_secret", return_value="secret") as read:
            result = resolver.resolve(
                {
                    "protocolVersion": 1,
                    "provider": "kingdom_keychain",
                    "ids": ["ollama/apiKey"],
                }
            )
        self.assertEqual(result["values"], {"ollama/apiKey": "secret"})
        read.assert_called_once_with("agenttool-ollama-api-key")

    def test_unknown_id_never_touches_keychain(self):
        with mock.patch.object(resolver, "read_secret") as read:
            result = resolver.resolve(
                {
                    "protocolVersion": 1,
                    "provider": "kingdom_keychain",
                    "ids": ["other/apiKey"],
                }
            )
        self.assertEqual(result["values"], {})
        self.assertIn("other/apiKey", result["errors"])
        read.assert_not_called()

    def test_rejects_wrong_protocol(self):
        with self.assertRaises(ValueError):
            resolver.resolve({"protocolVersion": 2, "ids": []})


if __name__ == "__main__":
    unittest.main()
