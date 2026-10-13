import pytest

ADMIN_GET_ENDPOINTS = ["/api/admin/users", "/api/admin/tasks", "/api/admin/summary"]


@pytest.mark.parametrize("url", ADMIN_GET_ENDPOINTS)
def test_admin_endpoints_reject_regular_users(client, user_headers, url):
    response = client.get(url, headers=user_headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Admin privileges required"


@pytest.mark.parametrize("url", ADMIN_GET_ENDPOINTS)
def test_admin_endpoints_require_authentication(client, url):
    assert client.get(url).status_code == 401


def test_admin_lists_users_with_task_counts(client, admin_headers, user_headers, other_user_headers, make_task):
    make_task(user_headers)
    make_task(user_headers)

    page = client.get("/api/admin/users", headers=admin_headers).json()
    counts = {u["email"]: u["task_count"] for u in page["items"]}
    assert page["total"] == 3
    assert counts == {"admin@example.com": 0, "alice@example.com": 2, "bob@example.com": 0}


def test_admin_lists_all_tasks_with_owner_and_filters(client, admin_headers, user_headers, other_user_headers, make_task):
    alice_task = make_task(user_headers, title="Alice task")
    make_task(other_user_headers, title="Bob task")

    page = client.get("/api/admin/tasks", headers=admin_headers).json()
    assert page["total"] == 2
    assert {t["owner"]["email"] for t in page["items"]} == {"alice@example.com", "bob@example.com"}

    only_alice = client.get(
        "/api/admin/tasks", params={"owner_id": alice_task["owner_id"]}, headers=admin_headers
    ).json()
    assert [t["title"] for t in only_alice["items"]] == ["Alice task"]


def test_admin_can_manage_any_users_task(client, admin_headers, user_headers, make_task):
    task = make_task(user_headers)
    url = f"/api/tasks/{task['id']}"

    assert client.get(url, headers=admin_headers).status_code == 200
    patched = client.patch(f"{url}/status", json={"status": "COMPLETED"}, headers=admin_headers)
    assert patched.status_code == 200
    assert client.delete(url, headers=admin_headers).status_code == 204


def test_admin_summary_covers_all_users(client, admin_headers, user_headers, other_user_headers, make_task):
    make_task(user_headers, status="COMPLETED")
    make_task(other_user_headers)

    summary = client.get("/api/admin/summary", headers=admin_headers).json()
    assert summary["total_users"] == 3
    assert summary["total"] == 2
    assert summary["completion_rate"] == 50.0


def test_admin_can_promote_user(client, admin_headers, user_headers):
    alice = client.get("/api/auth/me", headers=user_headers).json()

    response = client.patch(f"/api/admin/users/{alice['id']}/role", json={"role": "ADMIN"}, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["role"] == "ADMIN"
    # The role is read from the database on every request, so it applies immediately.
    assert client.get("/api/admin/users", headers=user_headers).status_code == 200


def test_admin_cannot_change_own_role_or_unknown_user(client, admin_headers):
    me = client.get("/api/auth/me", headers=admin_headers).json()
    own = client.patch(f"/api/admin/users/{me['id']}/role", json={"role": "USER"}, headers=admin_headers)
    assert own.status_code == 400

    missing = client.patch("/api/admin/users/99999/role", json={"role": "ADMIN"}, headers=admin_headers)
    assert missing.status_code == 404


def test_regular_user_cannot_change_roles(client, user_headers, other_user_headers):
    bob = client.get("/api/auth/me", headers=other_user_headers).json()
    response = client.patch(f"/api/admin/users/{bob['id']}/role", json={"role": "ADMIN"}, headers=user_headers)
    assert response.status_code == 403
