"""Matching service - business logic layer wrapping MentorMatcher.

MentorMatcher itself is the domain/algorithm engine (embeddings, scoring).
This service owns its lazy singleton lifecycle (expensive to build - loads
a SentenceTransformer model and both Mongo collections) and always calls
refresh_mentees() before matching, since mentees are added continuously
via completed interviews while this process stays alive.
"""

from __future__ import annotations

from typing import Optional

from matcher import MentorMatcher

_matcher: Optional[MentorMatcher] = None


def _get_matcher() -> MentorMatcher:
    global _matcher
    if _matcher is None:
        _matcher = MentorMatcher()
    return _matcher


def match_mentee(mentee_id: str, top_k: int = 5) -> dict:
    """mentee_id is the interview's session_id (also the key in mentee_profiles)."""
    matcher = _get_matcher()
    matcher.refresh_mentees()
    return matcher.match_mentee(mentee_id, top_k=top_k)
