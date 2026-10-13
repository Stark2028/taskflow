"""Dashboard statistics: /api/dashboard/*."""

from fastapi import APIRouter

from app.dependencies import CurrentUser, DbSession
from app.schemas.dashboard import DashboardSummary
from app.services import task_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(user: CurrentUser, db: DbSession) -> DashboardSummary:
    """Task counts and completion rate for the caller's own tasks."""
    return task_service.get_summary(db, owner_id=user.id)
