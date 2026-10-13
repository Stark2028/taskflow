"""Authentication and profile endpoints: /api/auth/*."""

from fastapi import APIRouter, status

from app.core.config import settings
from app.core.security import create_access_token
from app.dependencies import CurrentUser, DbSession
from app.models import User
from app.schemas.user import LoginRequest, Token, UserCreate, UserRead, UserUpdate
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"description": "Email is already registered"}},
)
def register(data: UserCreate, db: DbSession) -> User:
    """Create a USER account. Public registration can never create an admin."""
    return auth_service.register_user(db, data)


@router.post("/login", response_model=Token, responses={401: {"description": "Invalid email or password"}})
def login(data: LoginRequest, db: DbSession) -> Token:
    """Exchange email + password for a JWT access token."""
    user = auth_service.authenticate(db, data.email, data.password)
    return Token(
        access_token=create_access_token(user.id),
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.get("/me", response_model=UserRead)
def read_me(user: CurrentUser) -> User:
    """Return the logged-in user's profile."""
    return user


@router.patch("/me", response_model=UserRead, responses={400: {"description": "Current password is incorrect"}})
def update_me(data: UserUpdate, user: CurrentUser, db: DbSession) -> User:
    """Update your name and/or password (changing the password requires the current one)."""
    return auth_service.update_profile(db, user, data)
