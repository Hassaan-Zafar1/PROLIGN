# Empty-ish on purpose — its presence here (not just under tests/) makes
# pytest add this directory to sys.path, so tests/test_*.py can
# `from main import app`, `from core.config import settings`, etc. without
# path hacks.
#
# The mongomock patch below MUST live here (not in a fixture) and MUST run
# before any test module executes its own `from main import app`:
# services/interview_service.py constructs a real pymongo.MongoClient and
# calls create_index() on it as a MODULE-LEVEL side effect the instant it's
# imported — by the time a fixture would run, that import (and the real
# network calls it makes) has already happened. conftest.py is guaranteed by
# pytest to be imported before any test_*.py file is collected, so patching
# pymongo.MongoClient here is the only place early enough to matter.
import mongomock
import pymongo

pymongo.MongoClient = mongomock.MongoClient
