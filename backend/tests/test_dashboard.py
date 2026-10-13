from datetime import UTC, datetime, timedelta


def test_summary_for_new_user_is_all_zero(client, user_headers):
    response = client.get("/api/dashboard/summary", headers=user_headers)
    assert response.status_code == 200
    assert response.json() == {
        "total": 0,
        "completed": 0,
        "in_progress": 0,
        "pending": 0,
        "overdue": 0,
        "completion_rate": 0.0,
    }


def test_summary_counts_only_own_tasks(client, user_headers, other_user_headers, make_task):
    past = (datetime.now(UTC) - timedelta(days=2)).isoformat()
    future = (datetime.now(UTC) + timedelta(days=2)).isoformat()

    make_task(user_headers, status="TODO", due_date=past)  # pending + overdue
    make_task(user_headers, status="TODO", due_date=future)  # pending
    make_task(user_headers, status="IN_PROGRESS")
    make_task(user_headers, status="COMPLETED", due_date=past)  # completed, so not overdue
    make_task(other_user_headers, status="COMPLETED")  # someone else's task: ignored

    summary = client.get("/api/dashboard/summary", headers=user_headers).json()
    assert summary == {
        "total": 4,
        "completed": 1,
        "in_progress": 1,
        "pending": 2,
        "overdue": 1,
        "completion_rate": 25.0,
    }


def test_summary_requires_authentication(client):
    assert client.get("/api/dashboard/summary").status_code == 401
