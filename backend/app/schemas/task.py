"""Request/response shapes for tasks, including list query parameters."""

from datetime import UTC, datetime
from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StringConstraints, computed_field

from app.models import TaskPriority, TaskStatus
from app.schemas.common import PageParams

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Description = Annotated[str, StringConstraints(max_length=2000)]


class TaskCreate(BaseModel):
    title: Title
    description: Description | None = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    # AwareDatetime rejects timestamps without a timezone, so "6 pm" is never ambiguous.
    due_date: AwareDatetime | None = None


class TaskUpdate(BaseModel):
    """PUT body: the complete new state of the task, so every field is required (nullable ones may be null)."""

    title: Title
    description: Description | None
    status: TaskStatus
    priority: TaskPriority
    due_date: AwareDatetime | None


class TaskStatusUpdate(BaseModel):
    """PATCH body: change only the status."""

    status: TaskStatus


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    due_date: datetime | None
    owner_id: int
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def is_overdue(self) -> bool:
        # Same rule as the dashboard's SQL: past due and not completed.
        return (
            self.due_date is not None
            and self.status != TaskStatus.COMPLETED
            and self.due_date < datetime.now(UTC)
        )


class TaskOwner(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str


class TaskWithOwner(TaskRead):
    owner: TaskOwner


class TaskListParams(PageParams):
    """Query parameters for GET /api/tasks."""

    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    search: str | None = Field(None, max_length=100)
    sort_by: Literal["created_at", "due_date", "priority"] = "created_at"
    order: Literal["asc", "desc"] = "desc"


class AdminTaskListParams(TaskListParams):
    """Admins can additionally narrow the list to one user's tasks."""

    owner_id: int | None = None
