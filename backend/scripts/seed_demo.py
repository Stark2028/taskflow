"""Fill the development database with demo users and tasks (safe to run more than once).

Usage (from backend/, virtualenv active):
    python -m scripts.seed_demo

Every demo account uses the password printed at the end. For local development only.
"""

from datetime import UTC, datetime, timedelta

from app.database.session import SessionLocal
from app.models import Task, TaskPriority, TaskStatus
from app.schemas.user import UserCreate
from app.services import auth_service

DEMO_PASSWORD = "DemoPass123"

# (title, description, status, priority, due in N days or None)
DEMO_TASKS = {
    "demo@taskflow.dev": [
        ("Revise SQL joins and indexing", "Practice INNER vs LEFT JOIN and when a B-tree index helps.", "IN_PROGRESS", "HIGH", 1),
        ("Mock interview: project walkthrough", "Explain TaskFlow architecture in 60 seconds.", "TODO", "HIGH", 2),
        ("Write unit tests for task filters", None, "COMPLETED", "MEDIUM", -3),
        ("Read about JWT expiry and refresh tokens", "Compare localStorage vs httpOnly cookies.", "TODO", "MEDIUM", 5),
        ("Submit IBM ISL application form", "Attach updated resume and project links.", "TODO", "HIGH", -1),
        ("Clean up GitHub profile README", None, "COMPLETED", "LOW", None),
        ("Practice OOP design questions", "Encapsulation, inheritance, polymorphism with examples.", "IN_PROGRESS", "MEDIUM", 7),
        ("Book library room for group study", None, "TODO", "LOW", 10),
        ("Review operating systems notes", "Processes vs threads, deadlocks, scheduling.", "COMPLETED", "MEDIUM", -6),
        ("Prepare questions for the interviewer", None, "TODO", "LOW", None),
    ],
    "priya@taskflow.dev": [
        ("Design onboarding checklist", None, "IN_PROGRESS", "MEDIUM", 3),
        ("Fix login page alignment", "Button overflows on small screens.", "COMPLETED", "LOW", -2),
        ("Quarterly report draft", None, "TODO", "HIGH", -2),
    ],
    "rohan@taskflow.dev": [
        ("Set up CI pipeline", "Run pytest on every push.", "TODO", "HIGH", 4),
        ("Update API documentation", None, "COMPLETED", "MEDIUM", None),
    ],
}

NAMES = {
    "demo@taskflow.dev": "Aarav Sharma",
    "priya@taskflow.dev": "Priya Nair",
    "rohan@taskflow.dev": "Rohan Gupta",
}


def main() -> None:
    now = datetime.now(UTC)
    with SessionLocal() as db:
        for email, tasks in DEMO_TASKS.items():
            if auth_service.get_user_by_email(db, email) is not None:
                print(f"{email} already exists, skipping")
                continue
            user = auth_service.register_user(
                db, UserCreate(full_name=NAMES[email], email=email, password=DEMO_PASSWORD)
            )
            for title, description, status, priority, due_in_days in tasks:
                due_date = None
                if due_in_days is not None:
                    due_date = (now + timedelta(days=due_in_days)).replace(hour=12, minute=30, second=0, microsecond=0)
                db.add(
                    Task(
                        title=title,
                        description=description,
                        status=TaskStatus(status),
                        priority=TaskPriority(priority),
                        due_date=due_date,
                        owner_id=user.id,
                    )
                )
            db.commit()
            print(f"Created {email} with {len(tasks)} tasks")
    print(f"Demo password for all demo accounts: {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
