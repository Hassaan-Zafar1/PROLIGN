import pytest


@pytest.fixture(autouse=True)
async def _clean_db():
    """The mongomock-motor client (patched in the root conftest.py) is a
    single process-wide instance shared by every test — without this,
    conversation/escalation documents from one test leak into the next."""
    yield
    from core.database import get_db

    db = get_db()
    for name in await db.list_collection_names():
        await db[name].delete_many({})
