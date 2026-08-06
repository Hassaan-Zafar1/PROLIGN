# syntax=docker/dockerfile:1.7
# ProLign AI Interviewer (FastAPI).
#
# IMPORTANT: build context must be backend/, not backend/AI_interviewer/.
# api/routes.py:31-33 and services/interview_service.py:42-44 resolve
# BACKEND_ROOT = Path(__file__).resolve().parents[2] and sys.path.append
# BACKEND_ROOT/"Mentor_Mentee_Match", so the two directories must stay siblings:
#
#   docker build -f AI_interviewer/Dockerfile backend/

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    NLTK_DATA=/opt/nltk_data

WORKDIR /svc

# Two requirements files: AI_interviewer's own, plus Mentor_Mentee_Match's.
# The interviewer cannot boot on its own file alone — main.py -> api/routes.py
# -> mm_services.matching_service -> matcher.py imports numpy/pandas at module
# level, and datacleaning.py imports pandas.
#
# Mentor_Mentee_Match/requirements.txt deliberately does NOT include torch or
# sentence-transformers (confirmed decision, not an oversight): matcher.py:12-16
# already wraps that import in try/except and falls back to a pure-numpy lexical
# hashing + cosine-similarity match (matcher.py:297-324) when the model isn't
# installed — verified by reading the fallback code directly, not assumed. This
# is what keeps this image out of multi-GB territory; the tradeoff is
# keyword/lexical matching instead of semantic-embedding matching.
COPY AI_interviewer/requirements.txt /tmp/req-interviewer.txt
COPY Mentor_Mentee_Match/requirements.txt /tmp/req-match.txt
RUN pip install -r /tmp/req-interviewer.txt -r /tmp/req-match.txt

# Bake NLTK corpora at build time. datacleaning.py:11-14 calls nltk.download()
# at import time on every start — it's try/except-wrapped so a failure only
# silently disables lemmatization (quietly degrading match quality rather than
# erroring), so this is worth baking in rather than relying on runtime egress.
RUN python -c "import nltk; [nltk.download(p, download_dir='/opt/nltk_data', quiet=True) for p in ('punkt','punkt_tab','wordnet','omw-1.4')]"

COPY AI_interviewer/ ./AI_interviewer/
COPY Mentor_Mentee_Match/ ./Mentor_Mentee_Match/

# Drop the legacy v2 monolith. Three reasons:
#   1. api.py collides with the api/ package that main.py:12 actually imports
#      ("from api.routes import router"). Python resolves the package first, so
#      this works today purely by precedence — a fragile thing to ship.
#   2. interviewer.py:253 hardcodes a live Atlas credential as a fallback
#      default; removing it keeps that string out of the image layers.
#   3. Nothing on the serving path imports any of them (only each other).
RUN rm -f AI_interviewer/api.py \
          AI_interviewer/interviewer.py \
          AI_interviewer/cli_runner.py

RUN useradd --create-home --uid 10001 app \
 && chown -R app:app /svc /opt/nltk_data
USER app

# WORKDIR is the service dir so that `main:app` resolves and the flat
# intra-service imports (core.config, api.routes, ...) work. From here
# parents[2] correctly resolves BACKEND_ROOT to /svc.
WORKDIR /svc/AI_interviewer
EXPOSE 8000

# Python-native healthcheck (no curl binary/apt layer needed just for this).
# /interviewer/health, not /health — see main.py's router prefix; a reverse
# proxy can route by prefix but not rewrite it, so the service owns the prefix.
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/interviewer/health',timeout=3).status==200 else 1)" || exit 1

# start-period is long because services/interview_service.py:46-51 does real
# work at import: builds the Groq client and calls create_index(unique=True) on
# two collections. Mongo must be reachable before uvicorn can serve at all.
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
