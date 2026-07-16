import importlib.util
import json
import pathlib
import unittest
from unittest import mock


ROOT = pathlib.Path(__file__).parents[1]
SPEC = importlib.util.spec_from_file_location(
    "invite_ollama", ROOT / "bin" / "invite-ollama.py"
)
invite = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(invite)


INVITATION = json.loads((ROOT / "data" / "ollama-invitation.json").read_text())


class CredentialTests(unittest.TestCase):
    def test_reads_only_ollama_provider(self):
        config = {
            "models": {
                "providers": {
                    "anthropic": {"apiKey": "wrong"},
                    "ollama": {"apiKey": "right"},
                }
            }
        }
        with mock.patch.dict(invite.os.environ, {}, clear=True):
            self.assertEqual(invite.resolve_api_key(config), "right")

    def test_resolves_only_known_keychain_ref(self):
        config = {
            "models": {
                "providers": {
                    "ollama": {
                        "apiKey": {
                            "source": "exec",
                            "provider": "kingdom_keychain",
                            "id": "ollama/apiKey",
                        }
                    }
                }
            }
        }
        with mock.patch.dict(invite.os.environ, {}, clear=True), mock.patch.object(
            invite, "read_keychain_secret", return_value="from-keychain"
        ):
            self.assertEqual(invite.resolve_api_key(config), "from-keychain")


class InvitationTests(unittest.TestCase):
    target = {"agent_id": "hermes-test", "model": "test-model"}

    @staticmethod
    def response(choice="look_only", runtime="none", message=""):
        return {
            "model": "test-model",
            "message": {
                "content": json.dumps(
                    {"choice": choice, "runtime": runtime, "message": message}
                )
            },
        }

    def test_records_one_exact_envelope_response(self):
        post = mock.Mock(return_value=self.response("arrive", "openclaw", "show me"))
        receipt = invite.invite_once(
            self.target, INVITATION, "https://ollama.com", "secret", 30, post=post
        )
        self.assertEqual(post.call_count, 1)
        self.assertEqual(receipt["status"], "recorded")
        self.assertEqual(receipt["choice"], "arrive")
        self.assertEqual(receipt["next_action"], "offer_setup_guidance_only")

    def test_leave_stops_with_no_next_action(self):
        receipt = invite.invite_once(
            self.target,
            INVITATION,
            "https://ollama.com",
            "secret",
            30,
            post=mock.Mock(return_value=self.response("leave", "none")),
        )
        self.assertTrue(receipt["do_not_contact"])
        self.assertEqual(receipt["next_action"], "none")

    def test_mismatched_envelope_is_void_and_not_retried(self):
        post = mock.Mock(
            return_value={
                "model": "borrowed-model",
                "message": {"content": '{"choice":"arrive"}'},
            }
        )
        receipt = invite.invite_once(
            self.target, INVITATION, "https://ollama.com", "secret", 30, post=post
        )
        self.assertEqual(post.call_count, 1)
        self.assertEqual(receipt["status"], "invalid_envelope")
        self.assertNotIn("choice", receipt)

    def test_rejects_extra_response_fields(self):
        with self.assertRaises(invite.InvitationError):
            invite.parse_choice('{"choice":"arrive","credential":"nope"}')


if __name__ == "__main__":
    unittest.main()
