# syntax=docker/dockerfile:1.7
# ProLign RAG Chatbot (FastAPI).
#
# Build context is backend/Rag_Chatbot/ (requirements.txt sits one level above
# the app, matching the documented `pip install -r ../requirements.txt`):
#
#   docker build -f Dockerfile backend/Rag_Chatbot/
#
# There is no local vector store to persist: FAQ retrieval is an Atlas
# $vectorSearch against index `faq_vector_index` on Prolign.faqs
# (app/selector/faq_selector.py:34-56). Nothing is built or cached on disk, so
# this container is fully stateless — no volume required.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/opt/hf

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# CPU-only torch first — requirements.txt pins sentence-transformers==3.3.1,
# which otherwise resolves the CUDA torch build and ~2.5 GB of nvidia-* wheels.
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch

COPY requirements.txt /tmp/req.txt
RUN pip install -r /tmp/req.txt

# core/embedder.py:9-16 lazily loads all-MiniLM-L6-v2 inside an lru_cache on the
# first /chat request. Un-baked, the first real user message pays a ~90 MB
# download and raises EmbeddingError (embedder.py:25-26) without HF egress.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# WORKDIR must be the app/ directory itself: every intra-app import is flat
# ("from api.routes import ...", "from core.config import ...") and there is no
# Rag_Chatbot/app/__init__.py, so `app.main:app` from the parent will not
# resolve. Copy the contents of app/ to /app, not the directory itself.
COPY app/ /app/

RUN useradd --create-home --uid 10001 app \
 && chown -R app:app /app /opt/hf
USER app

EXPOSE 8001

# The service's health endpoint is GET / (api/routes.py:18), which becomes
# /rag/ once main.py mounts the router under its prefix.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8001/rag/ || exit 1

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
