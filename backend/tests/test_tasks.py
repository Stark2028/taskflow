from datetime import UTC, datetime, timedelta

import pytest


def iso(dt: datetime) -> str:
    return dt.isoformat()


def full_update(**overrides) -> dict:
    body = {
        "title": "Updated title",
        "description": "Updated description",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "due_date": None,
    }
    return {**body, **overrides}


# --- Create -------------------------------------------------------------------------------


def test_create_task_applies_defaults(client, user_headers):
    response = client.post("/api/tasks", json={"title": "  Write report  "}, headers=user_headers)
    assert response.status_code == 201
    task = response.json()
    assert task["title"] == "Write report"  # whitespace stripped
    assert task["status"] == "TODO"
    assert task["priority"] == "MEDIUM"
    assert task["description"] is None
    assert task["is_overdue"] is False


@pytest.mark.parametrize(
    "body",
    [
        {"title": "x", "status": "DONE"},  # not a valid status
        {"title": "x", "priority": "URGENT"},  # not a valid priority
        {"title": ""},  # empty title
        {"title": "x" * 201},  # too long
        {"title": "x", "due_date": "2030-01-01T10:00:00"},  # no timezone
    ],
)
def test_create_task_validation_errors(client, user_headers, body):
    assert client.post("/api/tasks", json=body, headers=user_headers).status_code == 422


def test_create_task_requires_authentication(client):
    assert client.post("/api/tasks", json={"title": "x"}).status_code == 401


# --- Read / update / delete ----------------------------------------------------------------


def test_get_task(client, user_headers, make_task):
    task = make_task(user_headers, title="Read me")
    response = client.get(f"/api/tasks/{task['id']}", headers=user_headers)
    assert response.status_code == 200
    assert response.json()["title"] == "Read me"
    assert client.get("/api/tasks/99999", headers=user_headers).status_code == 404


def test_put_replaces_all_fields(client, user_headers, make_task):
    task = make_task(user_headers, title="Old", description="old", priority="LOW")
    due = datetime.now(UTC) + timedelta(days=3)
    response = client.put(
        f"/api/tasks/{task['id']}", json=full_update(due_date=iso(due)), headers=user_headers
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["title"] == "Updated title"
    assert updated["status"] == "IN_PROGRESS"
    assert updated["priority"] == "HIGH"
    assert datetime.fromisoformat(updated["due_date"]) == due
    assert updated["updated_at"] >= task["updated_at"]


def test_put_requires_every_field(client, user_headers, make_task):
    task = make_task(user_headers)
    response = client.put(f"/api/tasks/{task['id']}", json={"title": "Only title"}, headers=user_headers)
    assert response.status_code == 422


def test_patch_status(client, user_headers, make_task):
    task = make_task(user_headers)
    response = client.patch(f"/api/tasks/{task['id']}/status", json={"status": "COMPLETED"}, headers=user_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "COMPLETED"


def test_patch_invalid_status_returns_422(client, user_headers, make_task):
    task = make_task(user_headers)
    response = client.patch(f"/api/tasks/{task['id']}/status", json={"status": "FINISHED"}, headers=user_headers)
    assert response.status_code == 422


def test_delete_task(client, user_headers, make_task):
    task = make_task(user_headers)
    response = client.delete(f"/api/tasks/{task['id']}", headers=user_headers)
    assert response.status_code == 204
    assert response.content == b""
    assert client.get(f"/api/tasks/{task['id']}", headers=user_headers).status_code == 404


def test_overdue_flag(client, user_headers, make_task):
    past = iso(datetime.now(UTC) - timedelta(days=1))
    assert make_task(user_headers, due_date=past)["is_overdue"] is True
    assert make_task(user_headers, due_date=past, status="COMPLETED")["is_overdue"] is False


# --- Ownership -----------------------------------------------------------------------------


def test_users_cannot_access_each_others_tasks(client, user_headers, other_user_headers, make_task):
    task = make_task(user_headers, title="Alice's secret")
    url = f"/api/tasks/{task['id']}"

    assert client.get(url, headers=other_user_headers).status_code == 404
    assert client.put(url, json=full_update(), headers=other_user_headers).status_code == 404
    assert client.patch(f"{url}/status", json={"status": "COMPLETED"}, headers=other_user_headers).status_code == 404
    assert client.delete(url, headers=other_user_headers).status_code == 404

    # The task is untouched.
    unchanged = client.get(url, headers=user_headers).json()
    assert unchanged["title"] == "Alice's secret"
    assert unchanged["status"] == "TODO"


def test_list_only_returns_own_tasks(client, user_headers, other_user_headers, make_task):
    make_task(user_headers, title="Mine")
    make_task(other_user_headers, title="Not mine")
    page = client.get("/api/tasks", headers=user_headers).json()
    assert [t["title"] for t in page["items"]] == ["Mine"]
    assert page["total"] == 1


# --- Filtering, search, sorting, pagination ------------------------------------------------


def test_filter_by_status_and_priority(client, user_headers, make_task):
    make_task(user_headers, title="a", status="TODO", priority="HIGH")
    make_task(user_headers, title="b", status="COMPLETED", priority="HIGH")
    make_task(user_headers, title="c", status="TODO", priority="LOW")

    by_status = client.get("/api/tasks", params={"status": "TODO"}, headers=user_headers).json()
    assert sorted(t["title"] for t in by_status["items"]) == ["a", "c"]

    both = client.get("/api/tasks", params={"status": "TODO", "priority": "HIGH"}, headers=user_headers).json()
    assert [t["title"] for t in both["items"]] == ["a"]


def test_search_is_case_insensitive_and_escapes_wildcards(client, user_headers, make_task):
    make_task(user_headers, title="Prepare IBM interview")
    make_task(user_headers, title="Score 100% on quiz")
    make_task(user_headers, title="Score 1000 points")

    found = client.get("/api/tasks", params={"search": "ibm"}, headers=user_headers).json()
    assert [t["title"] for t in found["items"]] == ["Prepare IBM interview"]

    # "%" is a SQL wildcard; it must be treated as a literal character here.
    percent = client.get("/api/tasks", params={"search": "100%"}, headers=user_headers).json()
    assert [t["title"] for t in percent["items"]] == ["Score 100% on quiz"]


def test_sort_by_priority_uses_rank_not_alphabet(client, user_headers, make_task):
    for priority in ("MEDIUM", "LOW", "HIGH"):
        make_task(user_headers, title=priority, priority=priority)
    page = client.get(
        "/api/tasks", params={"sort_by": "priority", "order": "desc"}, headers=user_headers
    ).json()
    assert [t["priority"] for t in page["items"]] == ["HIGH", "MEDIUM", "LOW"]


def test_sort_by_due_date_puts_missing_dates_last(client, user_headers, make_task):
    now = datetime.now(UTC)
    make_task(user_headers, title="none")
    make_task(user_headers, title="later", due_date=iso(now + timedelta(days=5)))
    make_task(user_headers, title="sooner", due_date=iso(now + timedelta(days=1)))
    page = client.get(
        "/api/tasks", params={"sort_by": "due_date", "order": "asc"}, headers=user_headers
    ).json()
    assert [t["title"] for t in page["items"]] == ["sooner", "later", "none"]


def test_pagination(client, user_headers, make_task):
    for i in range(15):
        make_task(user_headers, title=f"Task {i}")

    first = client.get("/api/tasks", params={"limit": 10, "offset": 0}, headers=user_headers).json()
    second = client.get("/api/tasks", params={"limit": 10, "offset": 10}, headers=user_headers).json()
    assert first["total"] == second["total"] == 15
    assert len(first["items"]) == 10
    assert len(second["items"]) == 5
    first_ids = {t["id"] for t in first["items"]}
    assert first_ids.isdisjoint(t["id"] for t in second["items"])


@pytest.mark.parametrize(
    "params",
    [{"limit": 0}, {"limit": 101}, {"offset": -1}, {"sort_by": "title"}, {"order": "sideways"}],
)
def test_invalid_list_parameters_return_422(client, user_headers, params):
    assert client.get("/api/tasks", params=params, headers=user_headers).status_code == 422
