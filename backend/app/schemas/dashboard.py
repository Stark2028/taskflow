"""Dashboard statistics."""

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total: int
    completed: int
    in_progress: int
    pending: int  # status TODO (not started yet)
    overdue: int  # past due date and not completed
    completion_rate: float  # percentage 0-100, one decimal place


class AdminSummary(DashboardSummary):
    total_users: int
