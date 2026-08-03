"""Unit tests for the pure Groq-response parsing helpers — untouched by the
route tests since those mock chat_completion at a level above these."""
import pytest

from clients.groq_client import extract_message_content, extract_tool_calls
from core.exceptions import ExternalServiceError


class TestExtractMessageContent:
    def test_returns_stripped_content(self):
        response = {"choices": [{"message": {"content": "  hello world  "}}]}
        assert extract_message_content(response) == "hello world"

    def test_returns_empty_string_when_content_is_none(self):
        response = {"choices": [{"message": {"content": None}}]}
        assert extract_message_content(response) == ""

    def test_raises_external_service_error_for_a_malformed_response(self):
        with pytest.raises(ExternalServiceError):
            extract_message_content({"choices": []})


class TestExtractToolCalls:
    def test_parses_a_single_tool_call_with_arguments(self):
        response = {"choices": [{"message": {"tool_calls": [
            {"function": {"name": "answer_faq", "arguments": '{"a": 1}'}}
        ]}}]}
        calls = extract_tool_calls(response)
        assert calls == [{"name": "answer_faq", "arguments": {"a": 1}}]

    def test_returns_empty_list_when_no_tool_calls_present(self):
        response = {"choices": [{"message": {"content": "just text"}}]}
        assert extract_tool_calls(response) == []

    def test_skips_a_call_with_no_function_name(self):
        response = {"choices": [{"message": {"tool_calls": [{"function": {}}]}}]}
        assert extract_tool_calls(response) == []

    def test_malformed_arguments_json_falls_back_to_empty_dict(self):
        response = {"choices": [{"message": {"tool_calls": [
            {"function": {"name": "answer_faq", "arguments": "not-json"}}
        ]}}]}
        calls = extract_tool_calls(response)
        assert calls == [{"name": "answer_faq", "arguments": {}}]

    def test_raises_external_service_error_for_a_malformed_response(self):
        with pytest.raises(ExternalServiceError):
            extract_tool_calls({"choices": []})
