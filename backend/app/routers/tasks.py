"""Task CRUD endpoints: /api/tasks/*."""

from typing import Annotated

from fastapi import APIRouter, Query, status

from app.dependencies import CurrentUser, DbSession
from app.models import Task
from app.schemas.common import Page
from app.schemas.task import TaskCreate, TaskListParams, TaskRead, TaskStatusUpdate, TaskUpdate
from app.services import task_service

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

NOT_FOUND = {404: {"description": "Task not found (or not owned by you)"}}


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(data: TaskCreate, user: CurrentUser, db: DbSession) -> Task:
    """Create a task owned by the caller."""
    return task_service.create_task(db, data, user)


@router.get("", response_model=Page[TaskRead])
def list_my_tasks(
    params: Annotated[TaskListParams, Query()], user: CurrentUser, db: DbSession
) -> Page[TaskRead]:
    """List the caller's own tasks with filtering, title search, sorting and pagination."""
    tasks, total = task_service.list_tasks(db, params, owner_id=user.id)
    return Page[TaskRead](
        items=[TaskRead.model_validate(t) for t in tasks],
        total=total,
        limit=params.limit,
        offset=params.offset,
    )


@router.get("/{task_id}", response_model=TaskRead, responses=NOT_FOUND)
def get_task(task_id: int, user: CurrentUser, db: DbSession) -> Task:
    """Get one task. Admins may read any task."""
    return task_service.get_task_for_user(db, task_id, user)


@router.put("/{task_id}", response_model=TaskRead, responses=NOT_FOUND)
def update_task(task_id: int, data: TaskUpdate, user: CurrentUser, db: DbSession) -> Task:
    """Replace all editable fields of a task (PUT = full update)."""
    return task_service.update_task(db, task_id, data, user)


@router.patch("/{task_id}/status", response_model=TaskRead, responses=NOT_FOUND)
def update_task_status(task_id: int, data: TaskStatusUpdate, user: CurrentUser, db: DbSession) -> Task:
    """Change only the status (PATCH = partial update)."""
    return task_service.update_task_status(db, task_id, data.status, user)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, responses=NOT_FOUND)
def delete_task(task_id: int, user: CurrentUser, db: DbSession) -> None:
    """Delete a task."""
    task_service.delete_task(db, task_id, user)
