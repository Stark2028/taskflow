"""Reusable FastAPI dependencies: database session, current user, and the admin guard."""

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.security import decode_access_token
from app.database.session import get_db
from app.models import User, UserRole

DbSession = Annotated[Session, Depends(get_db)]

# Reads "Authorization: Bearer <token>". auto_error=False lets us raise our own 401 below
# (with a WWW-Authenticate header) instead of FastAPI's default response.
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    """Authentication: turn the bearer token into a User, or reject the request with 401."""
    if credentials is None:
        raise AuthenticationError("Not authenticated")
    user_id = decode_access_token(credentials.credentials)
    # Load the user on every request, so a deleted user or changed role takes effect immediately.
    user = db.get(User, user_id) if user_id is not None else None
    if user is None:
        raise AuthenticationError("Invalid or expired token")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(user: CurrentUser) -> User:
    """Authorization: the user is known, but are they allowed in? 403 if not an admin."""
    if user.role != UserRole.ADMIN:
        raise PermissionDeniedError("Admin privileges required")
    return user


CurrentAdmin = Annotated[User, Depends(require_admin)]
