"""FastAPI application entry point: creates the app and wires up middleware, error handling and routes."""

import logging

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.exceptions import (
    AuthenticationError,
    ConflictError,
    DomainError,
    InvalidOperationError,
    NotFoundError,
    PermissionDeniedError,
)
from app.dependencies import DbSession
from app.routers import admin, auth, dashboard, tasks

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Task management REST API with JWT authentication and role-based access control.",
)

# Browsers may call this API only from the listed frontend origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Which HTTP status each kind of domain error becomes.
ERROR_STATUS_CODES: dict[type[DomainError], int] = {
    NotFoundError: status.HTTP_404_NOT_FOUND,
    ConflictError: status.HTTP_409_CONFLICT,
    AuthenticationError: status.HTTP_401_UNAUTHORIZED,
    PermissionDeniedError: status.HTTP_403_FORBIDDEN,
    InvalidOperationError: status.HTTP_400_BAD_REQUEST,
}


@app.exception_handler(DomainError)
async def handle_domain_error(request: Request, exc: DomainError) -> JSONResponse:
    """One handler for every DomainError subclass, producing the same {"detail": ...} shape as FastAPI."""
    status_code = ERROR_STATUS_CODES.get(type(exc), status.HTTP_400_BAD_REQUEST)
    headers = {"WWW-Authenticate": "Bearer"} if status_code == status.HTTP_401_UNAUTHORIZED else None
    return JSONResponse(status_code=status_code, content={"detail": exc.detail}, headers=headers)


app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)
app.include_router(admin.router)


@app.get("/api/health", tags=["Health"])
def health_check(db: DbSession) -> dict[str, str]:
    """Report whether the API is running and can reach PostgreSQL."""
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        logger.warning("Database health check failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from exc
    return {"status": "ok", "database": "connected"}
