"""Round-robin pool of API keys with rate-limit cooldown tracking."""

from __future__ import annotations

import itertools
import time


class KeyPool:
    def __init__(self, keys: list[str], cooldown_seconds: float = 30.0):
        if not keys:
            raise ValueError("KeyPool requires at least one API key.")
        self._keys = keys
        self._cooldown_seconds = cooldown_seconds
        self._cooldown_until: dict[str, float] = {}
        self._cycle = itertools.cycle(range(len(keys)))

    def _is_cooling_down(self, key: str) -> bool:
        return time.monotonic() < self._cooldown_until.get(key, 0.0)

    def get_key(self) -> str:
        for _ in range(len(self._keys)):
            idx = next(self._cycle)
            key = self._keys[idx]
            if not self._is_cooling_down(key):
                return key
        return min(self._keys, key=lambda k: self._cooldown_until.get(k, 0.0))

    def mark_rate_limited(self, key: str, cooldown_seconds: float | None = None) -> None:
        wait = cooldown_seconds if cooldown_seconds is not None else self._cooldown_seconds
        self._cooldown_until[key] = time.monotonic() + wait

    def size(self) -> int:
        return len(self._keys)