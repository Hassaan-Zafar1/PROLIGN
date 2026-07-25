"""Wires the AppError hierarchy into FastAPI as a single exception handler."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from core.exceptions import AppError

logger = logging.getLogger("prolign.errors")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        logger.error(
            "AppError on %s %s -> %s: %s",
            request.method, request.url.path, exc.status_code, exc.detail,
        )
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})