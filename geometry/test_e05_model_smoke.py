import json
import io
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch

from geometry.e05_model_smoke import build_payload, parse_evidence, require_preflight, summarize_http_error, persist_provider_response


class E05ModelSmokeTests(unittest.TestCase):
    def test_requires_local_key_review_and_credit_confirmation(self):
        with self.assertRaisesRegex(ValueError, "BASETEN_API_KEY"):
            require_preflight(None, True, True)
        with self.assertRaisesRegex(ValueError, "reviewed"):
            require_preflight("secret", False, True)
        with self.assertRaisesRegex(ValueError, "credit"):
            require_preflight("secret", True, False)

    def test_payload_is_pinned_image_request(self):
        request = build_payload(b"png", "image/png")
        # Sponsor-issued key is scoped to this exact hackathon endpoint model.
        self.assertEqual(request["model"], "meta-models/muse-spark-open-1026")
        self.assertEqual(request["messages"][1]["content"][1]["type"], "image_url")
        self.assertTrue(request["messages"][1]["content"][1]["image_url"]["url"].startswith("data:image/png;base64,"))
        self.assertEqual(request["reasoning_effort"], "low")
        self.assertGreaterEqual(request["max_tokens"], 2048)

    def test_output_requires_structured_evidence_and_cannot_authorize_arrows(self):
        response = {"choices": [{"finish_reason": "stop", "message": {"content": json.dumps({
            "visible_text": ["ROOM 73"],
            "visual_cues": ["green frame"],
            "uncertainty": "The room number is partly obscured",
            "usable_as_destination_evidence": False,
        })}}], "usage": {"prompt_tokens": 12, "completion_tokens": 8}}
        result = parse_evidence(response)
        self.assertEqual(result["visible_text"], ["ROOM 73"])
        self.assertFalse(result["navigationReady"])
        self.assertEqual(result["usage"]["prompt_tokens"], 12)
        response["choices"][0]["message"]["content"] = "not json"
        with self.assertRaisesRegex(ValueError, "JSON"):
            parse_evidence(response)
        response["choices"][0]["message"]["content"] = json.dumps({
            "visible_text": [], "visual_cues": [], "uncertainty": "", "usable_as_destination_evidence": False,
        })
        response["choices"][0]["finish_reason"] = "length"
        with self.assertRaisesRegex(ValueError, "finish_reason=length"):
            parse_evidence(response)

    def test_null_content_retains_private_provider_response_before_rejection(self):
        response = {"id": "resp-1", "model": "meta-models/muse-spark-open-1026", "choices": [
            {"finish_reason": "length", "message": {"content": None, "reasoning_content": "private thoughts"}}
        ], "usage": {"completion_tokens": 512}}
        with tempfile.TemporaryDirectory() as temp:
            path = persist_provider_response(response, Path(temp))
            self.assertTrue(path.exists())
            self.assertEqual(json.loads(path.read_text())["choices"][0]["finish_reason"], "length")
            with self.assertRaisesRegex(ValueError, "finish_reason=length"):
                parse_evidence(response)

    def test_http_error_summary_preserves_provider_reason_without_key(self):
        error = urllib.error.HTTPError(
            "https://inference.baseten.co/v1/chat/completions", 403, "Forbidden",
            {"Content-Type": "application/json", "X-Request-Id": "req-17"},
            io.BytesIO(b'{"error":{"type":"access_denied","message":"Model not enabled for secret-key"}}'),
        )
        summary = summarize_http_error(error, "secret-key")
        self.assertEqual(summary["http_status"], 403)
        self.assertEqual(summary["provider_error_type"], "access_denied")
        self.assertEqual(summary["provider_request_id"], "req-17")
        self.assertNotIn("secret-key", json.dumps(summary))

    def test_non_json_forbidden_body_is_classified_without_echoing_html(self):
        error = urllib.error.HTTPError(
            "https://inference.baseten.co/v1/chat/completions", 403, "Forbidden",
            {"Content-Type": "text/html"}, io.BytesIO(b"<html>Denied</html>"),
        )
        summary = summarize_http_error(error, "secret-key")
        self.assertEqual(summary["response_kind"], "non_json")
        self.assertNotIn("Denied", json.dumps(summary))


if __name__ == "__main__":
    unittest.main()
