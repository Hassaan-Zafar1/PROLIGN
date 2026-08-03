# Empty-ish on purpose — its presence here (not just under tests/) makes
# pytest add this directory to sys.path, so tests/test_*.py can
# `from main import app` without path hacks.
#
# The mongomock-motor patch below must live here (not in a fixture): even
# though core/database.py's AsyncIOMotorClient construction is lazy (no
# connection attempt until the first actual DB operation), core/database.py
# does `from motor.motor_asyncio import AsyncIOMotorClient` — a name import
# that freezes to whatever motor.motor_asyncio.AsyncIOMotorClient currently
# is at THAT import's execution time. A fixture-based patch would run too
# late (test modules import `main` → ... → core.database at module scope,
# before any fixture runs). conftest.py is guaranteed to be imported before
# any test_*.py file is collected, so patching here is early enough.
import motor.motor_asyncio
from mongomock_motor import AsyncMongoMockClient

motor.motor_asyncio.AsyncIOMotorClient = AsyncMongoMockClient
