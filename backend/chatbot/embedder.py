"""Local embedding generation using sentence-transformers (no external API)."""

from functools import lru_cache

from sentence_transformers import SentenceTransformer

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIMENSIONS = 384


@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    """Load the embedding model once and cache it for the process lifetime."""
    return SentenceTransformer(EMBEDDING_MODEL_NAME)


async def embed(text: str) -> list[float]:
    """Create an embedding vector for text using a local sentence-transformers model."""
    model = _get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return [float(value) for value in vector]