"""Task business logic: ownership rules, filtering/sorting/pagination, and dashboard statistics."""

from sqlalchemy import Select, case, func, select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import NotFoundError
from app.models import Task, TaskPriority, TaskStatus, User, UserRole
from app.schemas.dashboard import DashboardSummary
from app.schemas.task import TaskCreate, TaskListParams, TaskUpdate

# Priorities are stored as text, and alphabetical order (HIGH < LOW < MEDIUM) is meaningless,
# so sorting uses a CASE expression that maps each priority to a rank.
PRIORITY_RANK = case(
    {TaskPriority.LOW: 1, TaskPriority.MEDIUM: 2, TaskPriority.HIGH: 3},
    value=Task.priority,
)

SORT_COLUMNS = {
    "created_at": Task.created_at,
    "due_date": Task.due_date,
    "priority": PRIORITY_RANK,
}


def _apply_filters(stmt: Select, params: TaskListParams) -> Select:
    # Every value is sent to PostgreSQL as a bound parameter, never pasted into the SQL string,
    # which is what prevents SQL injection.
    if params.status is not None:
        stmt = stmt.where(Task.status == params.status)
    if params.priority is not None:
        stmt = stmt.where(Task.priority == params.priority)
    if params.search:
        # ILIKE '%term%'; autoescape treats % and _ typed by the user as literal characters.
        stmt = stmt.where(Task.title.icontains(params.search, autoescape=True))
    return stmt


def list_tasks(
    db: Session, params: TaskListParams, owner_id: int | None, *, load_owner: bool = False
) -> tuple[list[Task], int]:
    """Return one page of tasks plus the total number of matches.

    owner_id=None lists every user's tasks (admin view).
    """
    stmt = select(Task)
    if owner_id is not None:
        stmt = stmt.where(Task.owner_id == owner_id)
    stmt = _apply_filters(stmt, params)

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))

    sort_column = SORT_COLUMNS[params.sort_by]
    direction = sort_column.asc() if params.order == "asc" else sort_column.desc()
    # Tasks without a due date go last; Task.id breaks ties so pages never overlap or skip rows.
    stmt = stmt.order_by(direction.nulls_last(), Task.id.desc())
    stmt = stmt.limit(params.limit).offset(params.offset)
    if load_owner:
        stmt = stmt.options(joinedload(Task.owner))  # one JOIN instead of one query per task

    return list(db.scalars(stmt)), total


def get_task_for_user(db: Session, task_id: int, user: User) -> Task:
    task = db.get(Task, task_id)
    if task is None or (user.role != UserRole.ADMIN and task.owner_id != user.id):
        # Same 404 whether the task is missing or belongs to someone else, so users
        # cannot discover which task IDs exist.
        raise NotFoundError("Task not found")
    return task


def create_task(db: Session, data: TaskCreate, owner: User) -> Task:
    task = Task(**data.model_dump(), owner_id=owner.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, task_id: int, data: TaskUpdate, user: User) -> Task:
    task = get_task_for_user(db, task_id, user)
    for field, value in data.model_dump().items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


def update_task_status(db: Session, task_id: int, status: TaskStatus, user: User) -> Task:
    task = get_task_for_user(db, task_id, user)
    task.status = status
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int, user: User) -> None:
    task = get_task_for_user(db, task_id, user)
    db.delete(task)
    db.commit()


def get_summary(db: Session, owner_id: int | None) -> DashboardSummary:
    """All counts come from a single aggregate query using COUNT(...) FILTER (WHERE ...)."""
    is_completed = Task.status == TaskStatus.COMPLETED
    stmt = select(
        func.count(Task.id).label("total"),
        func.count(Task.id).filter(is_completed).label("completed"),
        func.count(Task.id).filter(Task.status == TaskStatus.IN_PROGRESS).label("in_progress"),
        func.count(Task.id).filter(Task.status == TaskStatus.TODO).label("pending"),
        func.count(Task.id).filter(Task.due_date < func.now(), ~is_completed).label("overdue"),
    )
    if owner_id is not None:
        stmt = stmt.where(Task.owner_id == owner_id)
    row = db.execute(stmt).one()

    rate = round(row.completed * 100 / row.total, 1) if row.total else 0.0
    return DashboardSummary(
        total=row.total,
        completed=row.completed,
        in_progress=row.in_progress,
        pending=row.pending,
        overdue=row.overdue,
        completion_rate=rate,
    )
