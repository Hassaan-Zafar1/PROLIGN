"""Full route suite for the AI Interviewer service (TC-AI-001 .. 011,
qa/test_cases_testrail_import.csv). Groq is mocked at the singleton
`services.interview_service._groq` — never makes a real LLM call. Mentor
matching is mocked at `mm_services.matching_service.match_mentee` — it opens
its own real Mongo connection + loads a real SentenceTransformer outside
this app's DB layer, so mongomock can't reach it; stubbing the function
itself is the only practical seam.
"""
import json

import pytest
from fastapi.testclient import TestClient

from main import ROUTE_PREFIX, app
from services import interview_service
from mm_services import matching_service

# base_url carries the router prefix so every request below can keep using bare
# paths like "/sessions": httpx joins a relative request path onto the
# base_url's path, yielding /interviewer/sessions.
client = TestClient(app, base_url=f"http://testserver{ROUTE_PREFIX}")


def mock_reply(monkeypatch, text):
    monkeypatch.setattr(interview_service._groq, "chat_completion", lambda **kw: text)


DONE_JSON = {
    "full_name": "Jane Doe",
    "university": "N/A",
    "degree": "Software Engineer",
    "experience_level": "intermediate",
    "domain_interest": "Web Development",
    "target_role": "Backend Engineer",
    "target_company_tier": "Mid-size",
    "target_industry": "Fintech",
    "bio": "Jane is a backend engineer interested in fintech.",
    "tech_skills": ["Python", "FastAPI"],
    "domain_skills": ["API design"],
    "soft_skills": ["Communication"],
}


def start_session(monkeypatch, opening="[Q:1] Hi! What's your name?"):
    mock_reply(monkeypatch, opening)
    res = client.post("/sessions")
    assert res.status_code == 200
    return res.json()["session_id"]


def complete_session(monkeypatch, session_id):
    """Drives a session to completion by mocking a [DONE]+JSON reply."""
    mock_reply(monkeypatch, f"[DONE]{json.dumps(DONE_JSON)}")
    res = client.post(f"/sessions/{session_id}/messages", json={"text": "That's everything."})
    assert res.status_code == 200
    assert res.json()["is_complete"] is True


class TestHealth:
    def test_TC_AI_010_health_check(self):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"


class TestStartSession:
    def test_TC_AI_001_start_session(self, monkeypatch):
        session_id = start_session(monkeypatch, "[Q:1] Hi! What's your name?")
        res = client.get(f"/sessions/{session_id}")
        assert res.status_code == 200
        body = res.json()
        assert body["session_id"] == session_id
        assert body["is_complete"] is False
        assert body["progress"]["current_question"] == 1
        assert body["progress"]["total_questions"] == 10


class TestSendMessage:
    def test_TC_AI_002_send_answer_gets_next_question(self, monkeypatch):
        session_id = start_session(monkeypatch)
        mock_reply(monkeypatch, "[Q:2] Great, and what do you do?")

        res = client.post(f"/sessions/{session_id}/messages", json={"text": "Jane Doe", "input_mode": "text"})
        assert res.status_code == 200
        body = res.json()
        assert body["reply"] == "Great, and what do you do?"
        assert body["is_complete"] is False
        assert body["progress"]["current_question"] == 2

    def test_TC_AI_003_message_for_nonexistent_session(self, monkeypatch):
        mock_reply(monkeypatch, "[Q:1] Hi!")
        res = client.post("/sessions/does-not-exist/messages", json={"text": "hello"})
        assert res.status_code == 404

    def test_rejects_a_message_on_an_already_complete_session(self, monkeypatch):
        session_id = start_session(monkeypatch)
        complete_session(monkeypatch, session_id)

        res = client.post(f"/sessions/{session_id}/messages", json={"text": "one more thing"})
        assert res.status_code == 400
        assert "already complete" in res.json()["detail"].lower()


class TestSessionState:
    def test_TC_AI_004_fetch_session_state(self, monkeypatch):
        session_id = start_session(monkeypatch)
        res = client.get(f"/sessions/{session_id}")
        assert res.status_code == 200
        assert res.json()["profile"] is None  # not complete yet

    def test_get_session_404_for_unknown_id(self):
        res = client.get("/sessions/does-not-exist")
        assert res.status_code == 404


class TestProfile:
    def test_TC_AI_005_cleaned_profile_after_completion(self, monkeypatch):
        session_id = start_session(monkeypatch)
        complete_session(monkeypatch, session_id)

        res = client.get(f"/sessions/{session_id}/profile")
        assert res.status_code == 200
        body = res.json()
        assert body["full_name"] == "Jane Doe"
        assert body["cleaned_bio"]  # added by clean_mentee_record
        assert isinstance(body["mentee_experience_years"], int)
        assert body["tech_skills"] == "Python | FastAPI"  # pipe-joined, not a list

    def test_profile_400_before_completion(self, monkeypatch):
        session_id = start_session(monkeypatch)
        res = client.get(f"/sessions/{session_id}/profile")
        assert res.status_code == 400

    def test_profile_404_for_unknown_session(self):
        res = client.get("/sessions/does-not-exist/profile")
        assert res.status_code == 404

    def test_KNOWN_BUG_malformed_done_json_leaves_is_complete_true_but_profile_none(self, monkeypatch):
        """Real bug found while writing this suite: _update_session_state
        sets is_complete=True the moment "[DONE]" appears in the raw reply,
        regardless of whether the JSON after it actually parses. A malformed
        block leaves is_complete=True but profile=None persisted forever —
        and GET /profile then returns a misleading 400 "Interview not yet
        complete" for a session that IS marked complete. This documents the
        current (buggy) behavior; it's a Phase 6 bug-list candidate, not
        something this test fixes."""
        session_id = start_session(monkeypatch)
        mock_reply(monkeypatch, "[DONE]this is not valid json")
        msg_res = client.post(f"/sessions/{session_id}/messages", json={"text": "done"})
        assert msg_res.json()["is_complete"] is True

        state_res = client.get(f"/sessions/{session_id}")
        assert state_res.json()["is_complete"] is True

        profile_res = client.get(f"/sessions/{session_id}/profile")
        assert profile_res.status_code == 400  # misleading, but current behavior


class TestTranscribe:
    def test_TC_AI_008_transcribes_a_recorded_answer(self, monkeypatch):
        session_id = start_session(monkeypatch)
        monkeypatch.setattr(interview_service._groq, "transcribe", lambda **kw: "This is my answer.")

        res = client.post(
            f"/sessions/{session_id}/transcribe",
            files={"audio": ("answer.webm", b"fake-audio-bytes", "audio/webm")},
        )
        assert res.status_code == 200
        assert res.json()["text"] == "This is my answer."

    def test_transcribe_404_for_unknown_session(self):
        res = client.post(
            "/sessions/does-not-exist/transcribe",
            files={"audio": ("answer.webm", b"bytes", "audio/webm")},
        )
        assert res.status_code == 404

    def test_transcribe_400_for_empty_audio(self, monkeypatch):
        session_id = start_session(monkeypatch)
        res = client.post(
            f"/sessions/{session_id}/transcribe",
            files={"audio": ("answer.webm", b"", "audio/webm")},
        )
        assert res.status_code == 400


class TestExit:
    def test_TC_AI_009_exit_mid_interview(self, monkeypatch):
        session_id = start_session(monkeypatch)
        res = client.post(f"/sessions/{session_id}/exit")
        assert res.status_code == 200
        body = res.json()
        assert body["is_abandoned"] is True

        state = client.get(f"/sessions/{session_id}").json()
        assert state["is_complete"] is False  # abandoned, not completed

    def test_exit_404_for_unknown_session(self):
        res = client.post("/sessions/does-not-exist/exit")
        assert res.status_code == 404

    def test_exiting_an_already_complete_session_is_a_no_op(self, monkeypatch):
        session_id = start_session(monkeypatch)
        complete_session(monkeypatch, session_id)

        res = client.post(f"/sessions/{session_id}/exit")
        assert res.status_code == 200
        assert res.json()["is_abandoned"] is False


class TestMatching:
    CANNED_MATCH = {
        "mentee": {"mentee_id": "s1", "full_name": "Jane Doe", "target_role": "Backend Engineer"},
        "top_mentors": [{"rank": 1, "mentor_id": "m1", "full_name": "Mentor One", "final_score": 0.9}],
        "skill_recommendations": {"tech_skills": [], "domain_skills": [], "soft_skills": []},
    }

    def test_TC_AI_006_match_by_session_id(self, monkeypatch):
        monkeypatch.setattr(matching_service, "match_mentee", lambda session_id, top_k=5: self.CANNED_MATCH)
        res = client.get("/match/any-session-id", params={"top_k": 3})
        assert res.status_code == 200
        assert res.json()["top_mentors"][0]["mentor_id"] == "m1"

    def test_match_by_session_id_404_when_matcher_raises_value_error(self, monkeypatch):
        def raise_not_found(session_id, top_k=5):
            raise ValueError("No documents found")
        monkeypatch.setattr(matching_service, "match_mentee", raise_not_found)
        res = client.get("/match/unknown-session")
        assert res.status_code == 404

    def test_TC_AI_007_matches_via_the_sessions_sub_route(self, monkeypatch):
        session_id = start_session(monkeypatch)
        complete_session(monkeypatch, session_id)
        monkeypatch.setattr(matching_service, "match_mentee", lambda session_id, top_k=5: self.CANNED_MATCH)

        res = client.get(f"/sessions/{session_id}/matches")
        assert res.status_code == 200
        assert res.json()["mentee"]["full_name"] == "Jane Doe"

    def test_matches_400_when_interview_not_yet_complete(self, monkeypatch):
        session_id = start_session(monkeypatch)
        res = client.get(f"/sessions/{session_id}/matches")
        assert res.status_code == 400

    def test_matches_404_for_unknown_session(self):
        res = client.get("/sessions/does-not-exist/matches")
        assert res.status_code == 404


class TestExportCsv:
    def test_TC_AI_011_export_mentees_csv(self, monkeypatch):
        session_id = start_session(monkeypatch)
        complete_session(monkeypatch, session_id)

        res = client.get("/export/mentees.csv")
        assert res.status_code == 200
        assert res.headers["content-type"].startswith("text/csv")
        assert "Jane Doe" in res.text

    def test_export_csv_header_only_when_no_profiles_exist(self):
        res = client.get("/export/mentees.csv")
        assert res.status_code == 200
        lines = res.text.strip().splitlines()
        assert len(lines) == 1  # header row only
