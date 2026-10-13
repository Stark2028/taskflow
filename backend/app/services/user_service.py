"""Administrative user operations."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import InvalidOperationError, NotFoundError
from app.models import Task, User, UserRole
from app.schemas.common import PageParams


def list_users_with_task_counts(db: Session, params: PageParams) -> tuple[list[tuple[User, int]], int]:
    # LEFT OUTER JOIN keeps users who have no tasks (their count is 0).
    stmt = (
        select(User, func.count(Task.id).label("task_count"))
        .outerjoin(Task, Task.owner_id == User.id)
        .group_by(User.id)
        .order_by(User.id)
        .limit(params.limit)
        .offset(params.offset)
    )
    rows = [(user, task_count) for user, task_count in db.execute(stmt)]
    total = db.scalar(select(func.count(User.id)))
    return rows, total


def count_users(db: Session) -> int:
    return db.scalar(select(func.count(User.id)))


def change_role(db: Session, user_id: int, role: UserRole, acting_admin: User) -> User:
    if user_id == acting_admin.id:
        # Prevents an admin from accidentally removing the last admin account (themselves).
        raise InvalidOperationError("You cannot change your own role")
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError("User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return user
