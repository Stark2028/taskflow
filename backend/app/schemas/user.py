"""Request/response shapes for users and authentication."""

from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field, StringConstraints

from app.models import UserRole

FullName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Password = Annotated[str, Field(min_length=8, max_length=128)]
# Emails are compared case-insensitively, so they are always stored and looked up in lowercase.
Email = Annotated[EmailStr, AfterValidator(str.lower)]


class UserCreate(BaseModel):
    # There is deliberately no `role` field: public registration can only create USER accounts.
    full_name: FullName
    email: Email
    password: Password


class LoginRequest(BaseModel):
    email: Email
    password: str


class UserUpdate(BaseModel):
    """Partial profile update. Changing the password requires the current password."""

    full_name: FullName | None = None
    current_password: str | None = None
    new_password: Password | None = None


class UserRead(BaseModel):
    """Public view of a user. password_hash is never part of any response."""

    model_config = ConfigDict(from_attributes=True)  # allows building it from an ORM object

    id: int
    full_name: str
    email: str
    role: UserRole
    created_at: datetime


class AdminUserRead(UserRead):
    task_count: int


class RoleUpdate(BaseModel):
    role: UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
