"""Full route suite for the RAG Chatbot service (TC-CHATBOT-001 .. 004,
qa/test_cases_testrail_import.csv). Groq and Slack are mocked at their
respective client singletons — never make a real network call. FAQ vector
search is mocked directly (mongomock-motor can't execute a real
`$vectorSearch` aggregation stage), and the local SentenceTransformer
embedder is mocked too, so no ML model ever loads in this suite.
"""
from fastapi.testclient import TestClient

from main import app
from clients.groq_client import groq_client
from clients.slack_client import slack_client
from services import faq_service
from repositories import conversation_repository

client = TestClient(app)


def groq_tool_response(tool_name):
    return {"choices": [{"message": {"content": None, "tool_calls": [
        {"function": {"name": tool_name, "arguments": "{}"}}
    ]}}]}


def groq_text_response(text):
    return {"choices": [{"message": {"content": text, "tool_calls": []}}]}


def mock_chat_completion(monkeypatch, responses):
    """`responses` is a list consumed in call order — one entry per Groq
    call a single request makes (routing call, then optionally an
    answer/summary-generation call)."""
    it = iter(responses)

    async def fake(*args, **kwargs):
        return next(it)

    monkeypatch.setattr(groq_client, "chat_completion", fake)


def mock_faq_search(monkeypatch, chunks):
    async def fake(embedding, top_k=None):
        return chunks

    monkeypatch.setattr(faq_service.faq_selector, "search_faqs", fake)
    monkeypatch.setattr(faq_service, "embed", _fake_embed)


async def _fake_embed(text):
    return [0.0] * 384


def mock_slack(monkeypatch):
    calls = []

    async def fake(webhook_url, payload):
        calls.append((webhook_url, payload))

    monkeypatch.setattr(slack_client, "send_webhook", fake)
    return calls


class TestHealth:
    def test_TC_CHATBOT_001_health_check(self):
        res = client.get("/")
        assert res.status_code == 200
        assert res.json() == {"status": "ok", "service": "ProLign RAG Chatbot Backend"}


class TestHistory:
    async def test_TC_CHATBOT_002_fetches_recent_conversation_history(self):
        import asyncio
        # Both inserts happen fast enough to risk an identical created_at
        # timestamp, which makes the DB's sort-by-created_at ordering
        # non-deterministic — a small real gap keeps this test honest rather
        # than accidentally depending on insertion-order tiebreaking.
        await conversation_repository.insert_message("sess-1", "user", "Hi there")
        await asyncio.sleep(0.01)
        await conversation_repository.insert_message("sess-1", "assistant", "Hello! How can I help?")

        res = client.get("/history/sess-1")
        assert res.status_code == 200
        messages = res.json()["messages"]
        assert [m["message"] for m in messages] == ["Hi there", "Hello! How can I help?"]

    def test_history_empty_for_unknown_session(self):
        res = client.get("/history/never-seen")
        assert res.status_code == 200
        assert res.json()["messages"] == []


class TestChatFaq:
    def test_TC_CHATBOT_003_answers_an_faq_question(self, monkeypatch):
        mock_faq_search(monkeypatch, [{"question": "How do I book a session?", "answer": "Go to Find Mentors."}])
        mock_chat_completion(monkeypatch, [
            groq_tool_response("answer_faq"),
            groq_text_response("Go to Find Mentors and pick a time slot!"),
        ])

        res = client.post("/chat", json={"session_id": "sess-faq", "message": "How do I book a session?"})
        assert res.status_code == 200
        body = res.json()
        assert body["intent"] == "FAQ"
        assert body["reply"] == "Go to Find Mentors and pick a time slot!"

    def test_unanswered_faq_escalates_and_asks_for_email(self, monkeypatch):
        mock_faq_search(monkeypatch, [])  # no matching FAQ context
        mock_chat_completion(monkeypatch, [groq_tool_response("answer_faq")])
        slack_calls = mock_slack(monkeypatch)

        res = client.post("/chat", json={"session_id": "sess-unanswered", "message": "Do you support crypto payments?"})
        assert res.status_code == 200
        body = res.json()
        assert body["intent"] == "FAQ"
        assert "Could you also share your email" in body["reply"]
        assert slack_calls == []  # pending — no email yet, so Slack isn't notified until follow-up


class TestChatComplaint:
    def test_TC_CHATBOT_004_complaint_triggers_escalation_and_records_pending(self, monkeypatch):
        mock_chat_completion(monkeypatch, [groq_tool_response("escalate_complaint")])
        slack_calls = mock_slack(monkeypatch)

        res = client.post("/chat", json={"session_id": "sess-complaint", "message": "My payment failed twice and no one is helping me!"})
        assert res.status_code == 200
        body = res.json()
        assert body["intent"] == "COMPLAINT"
        assert "escalated" in body["reply"].lower()
        assert "share your email" in body["reply"]
        assert slack_calls == []  # pending, not yet notified

    def test_KNOWN_BUG_email_already_in_the_request_is_never_forwarded_to_the_handler(self, monkeypatch):
        """Real bug found while writing this suite: agent/orchestrator.py's
        route() accepts an `email` parameter but never passes it to
        `handler(session_id, message)` — every escalation-triggering tool
        (escalate_complaint, handle_abusive_message, answer_faq's
        unanswered-FAQ path) always sees email=None on the first turn, even
        when the frontend already sent a known email in ChatRequest.email.
        This documents the CURRENT (buggy) behavior — a Phase 6 bug-list
        candidate, not something this test fixes."""
        mock_chat_completion(monkeypatch, [groq_tool_response("escalate_complaint")])
        mock_slack(monkeypatch)

        res = client.post("/chat", json={
            "session_id": "sess-known-email", "message": "This is broken and I'm upset.",
            "email": "user@example.com",
        })
        body = res.json()
        # If email were actually forwarded, this would finalize immediately
        # (no "share your email" suffix). It doesn't — documenting the bug.
        assert "share your email" in body["reply"]

    def test_followup_message_with_email_finalizes_the_pending_escalation(self, monkeypatch):
        mock_chat_completion(monkeypatch, [groq_tool_response("escalate_complaint")])
        mock_slack(monkeypatch)
        client.post("/chat", json={"session_id": "sess-followup", "message": "This is broken."})

        slack_calls = mock_slack(monkeypatch)
        res = client.post("/chat", json={"session_id": "sess-followup", "message": "sure, it's jane@example.com"})
        assert res.status_code == 200
        body = res.json()
        assert body["intent"] == "EMAIL_CAPTURED"
        assert "got your email on file" in body["reply"]
        assert len(slack_calls) == 1  # now actually notified


class TestChatOffTopicAndAbuse:
    def test_off_topic_message_never_calls_groq_a_second_time_or_touches_slack(self, monkeypatch):
        mock_chat_completion(monkeypatch, [groq_tool_response("handle_off_topic")])
        slack_calls = mock_slack(monkeypatch)

        res = client.post("/chat", json={"session_id": "sess-offtopic", "message": "What's the capital of France?"})
        assert res.status_code == 200
        body = res.json()
        assert body["intent"] == "OFF_TOPIC"
        assert "ProLign" in body["reply"]
        assert slack_calls == []

    def test_abusive_message_escalates_like_a_complaint(self, monkeypatch):
        mock_chat_completion(monkeypatch, [groq_tool_response("handle_abusive_message")])
        mock_slack(monkeypatch)

        res = client.post("/chat", json={"session_id": "sess-abuse", "message": "you are all useless idiots"})
        assert res.status_code == 200
        assert res.json()["intent"] == "VOILENCE"


class TestChatSummary:
    def test_summary_via_chat_always_has_at_least_the_current_message(self, monkeypatch):
        """routes.py saves the user's message BEFORE orchestrator.route()
        ever runs, so by the time summarize_conversation loads history,
        there's always >=1 message — the "no conversation yet" static reply
        (tested directly below) is unreachable through the real /chat
        endpoint, only through direct calls to the service function."""
        mock_chat_completion(monkeypatch, [
            groq_tool_response("summarize_conversation"),
            groq_text_response("- You just said hello."),
        ])

        res = client.post("/chat", json={"session_id": "sess-summary-empty", "message": "can you summarize this?"})
        assert res.status_code == 200
        body = res.json()
        assert body["intent"] == "SUMMARY"
        assert body["reply"] == "- You just said hello."

    async def test_summarize_conversation_service_returns_a_static_reply_for_genuinely_empty_history(self):
        from services import summary_service
        reply = await summary_service.summarize_conversation("sess-truly-empty", "summarize")
        assert "no conversation" in reply.lower()

    def test_summary_with_history_calls_groq_for_the_recap(self, monkeypatch):
        mock_faq_search(monkeypatch, [{"question": "q", "answer": "a"}])
        mock_chat_completion(monkeypatch, [
            groq_tool_response("answer_faq"),
            groq_text_response("Here's the answer."),
        ])
        client.post("/chat", json={"session_id": "sess-summary-full", "message": "How do I book?"})

        mock_chat_completion(monkeypatch, [
            groq_tool_response("summarize_conversation"),
            groq_text_response("- You asked how to book a session."),
        ])
        res = client.post("/chat", json={"session_id": "sess-summary-full", "message": "summarize our chat"})
        assert res.status_code == 200
        body = res.json()
        assert body["intent"] == "SUMMARY"
        assert body["reply"] == "- You asked how to book a session."


class TestValidation:
    def test_blank_session_id_is_rejected_with_422(self):
        res = client.post("/chat", json={"session_id": "   ", "message": "hello"})
        assert res.status_code == 422

    def test_blank_message_is_rejected_with_422(self):
        res = client.post("/chat", json={"session_id": "sess-x", "message": ""})
        assert res.status_code == 422


class TestResilience:
    def test_a_failed_assistant_message_save_does_not_fail_the_request(self, monkeypatch):
        """conversation_service.save_message is wrapped in try/except AppError
        for the ASSISTANT turn only — the user message must always persist,
        but a failure logging the reply shouldn't cost the user their answer."""
        mock_chat_completion(monkeypatch, [groq_tool_response("handle_off_topic")])

        call_count = {"n": 0}
        real_insert = conversation_repository.insert_message

        async def flaky_insert(session_id, role, message, intent=None):
            call_count["n"] += 1
            if call_count["n"] == 2:  # the assistant-turn save
                from core.exceptions import DatabaseError
                raise DatabaseError("simulated failure")
            return await real_insert(session_id, role, message, intent)

        monkeypatch.setattr(conversation_repository, "insert_message", flaky_insert)

        res = client.post("/chat", json={"session_id": "sess-flaky", "message": "hello there"})
        assert res.status_code == 200
        assert res.json()["intent"] == "OFF_TOPIC"
