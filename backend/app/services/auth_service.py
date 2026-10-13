"""Registration, login and profile updates."""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, ConflictError, InvalidOperationError
from app.core.security import hash_password, verify_password
from app.models import User, UserRole
from app.schemas.user import UserCreate, UserUpdate

# Checking a password against a dummy hash when the email is unknown makes a failed login take
# about the same time either way, so response timing does not reveal which emails are registered.
_DUMMY_HASH = hash_password("dummy-password-used-only-for-timing")


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def register_user(db: Session, data: UserCreate, role: UserRole = UserRole.USER) -> User:
    if get_user_by_email(db, data.email) is not None:
        raise ConflictError("Email is already registered")

    user = User(
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=role,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        # Two simultaneous sign-ups can both pass the check above. The UNIQUE constraint on
        # users.email lets only one commit succeed; the other ends up here.
        db.rollback()
        raise ConflictError("Email is already registered") from exc
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if user is None:
        verify_password(password, _DUMMY_HASH)
        raise AuthenticationError("Invalid email or password")
    if not verify_password(password, user.password_hash):
        raise AuthenticationError("Invalid email or password")
    return user


def update_profile(db: Session, user: User, data: UserUpdate) -> User:
    if data.new_password is not None:
        if data.current_password is None or not verify_password(
            data.current_password, user.password_hash
        ):
            raise InvalidOperationError("Current password is incorrect")
        user.password_hash = hash_password(data.new_password)
    if data.full_name is not None:
        user.full_name = data.full_name
    db.commit()
    db.refresh(user)
    return user
