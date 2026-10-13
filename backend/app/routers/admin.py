"""Admin-only endpoints: /api/admin/*. Every route here requires the ADMIN role."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.dependencies import CurrentAdmin, DbSession, require_admin
from app.models import User
from app.schemas.common import Page, PageParams
from app.schemas.dashboard import AdminSummary
from app.schemas.task import AdminTaskListParams, TaskWithOwner
from app.schemas.user import AdminUserRead, RoleUpdate, UserRead
from app.services import task_service, user_service

# A router-level dependency: the admin check runs before every endpoint below.
router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(require_admin)],
    responses={403: {"description": "Admin privileges required"}},
)


@router.get("/summary", response_model=AdminSummary)
def get_admin_summary(db: DbSession) -> AdminSummary:
    """Task statistics across all users, plus the number of users."""
    summary = task_service.get_summary(db, owner_id=None)
    return AdminSummary(**summary.model_dump(), total_users=user_service.count_users(db))


@router.get("/users", response_model=Page[AdminUserRead])
def list_users(params: Annotated[PageParams, Query()], db: DbSession) -> Page[AdminUserRead]:
    """All users with the number of tasks each one owns."""
    rows, total = user_service.list_users_with_task_counts(db, params)
    items = [
        AdminUserRead(**UserRead.model_validate(user).model_dump(), task_count=task_count)
        for user, task_count in rows
    ]
    return Page[AdminUserRead](items=items, total=total, limit=params.limit, offset=params.offset)


@router.patch("/users/{user_id}/role", response_model=UserRead)
def change_user_role(user_id: int, data: RoleUpdate, admin: CurrentAdmin, db: DbSession) -> User:
    """Promote a user to ADMIN or demote an admin to USER (not yourself)."""
    return user_service.change_role(db, user_id, data.role, acting_admin=admin)


@router.get("/tasks", response_model=Page[TaskWithOwner])
def list_all_tasks(params: Annotated[AdminTaskListParams, Query()], db: DbSession) -> Page[TaskWithOwner]:
    """Every user's tasks, with owner details. Supports the same filters as /api/tasks plus owner_id."""
    tasks, total = task_service.list_tasks(db, params, owner_id=params.owner_id, load_owner=True)
    return Page[TaskWithOwner](
        items=[TaskWithOwner.model_validate(t) for t in tasks],
        total=total,
        limit=params.limit,
        offset=params.offset,
    )
