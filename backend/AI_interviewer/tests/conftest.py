import pytest


@pytest.fixture(autouse=True)
def _clean_db():
    """The mongomock client (patched in the root conftest.py) is a single
    process-wide instance shared by every test — without this, data from one
    test leaks into the next (e.g. duplicate-key errors on the unique
    session_id index)."""
    yield
    from core.database import get_db

    db = get_db()
    for name in db.list_collection_names():
        db[name].delete_many({})
