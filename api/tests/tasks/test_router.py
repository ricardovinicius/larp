from fastapi.testclient import TestClient

from src.core.config import Settings
from src.main import create_app


def test_subtask_depth_guard_and_parent_delete_conflict() -> None:
    with TestClient(create_app(Settings(environment="test", _env_file=None))) as client:
        parent = client.post("/api/v1/tasks", json={"title": "Depth parent"}).json()
        child = client.post(
            "/api/v1/tasks", json={"title": "Depth child", "parent_id": parent["id"]}
        ).json()

        grandchild_response = client.post(
            "/api/v1/tasks", json={"title": "Too deep", "parent_id": child["id"]}
        )
        assert grandchild_response.status_code == 422
        assert grandchild_response.json()["code"] == "INVALID_TASK_PARENT"

        delete_parent_response = client.delete(f"/api/v1/tasks/{parent['id']}")
        assert delete_parent_response.status_code == 409
        assert delete_parent_response.json()["code"] == "TASK_HAS_SUBTASKS"

        assert client.delete(f"/api/v1/tasks/{child['id']}").status_code == 204
        assert client.delete(f"/api/v1/tasks/{parent['id']}").status_code == 204


def test_task_reordering_and_completion_timestamp() -> None:
    with TestClient(create_app(Settings(environment="test", _env_file=None))) as client:
        parent = client.post("/api/v1/tasks", json={"title": "Order scope"}).json()
        first = client.post(
            "/api/v1/tasks",
            json={"title": "Order first", "parent_id": parent["id"]},
        ).json()
        second = client.post(
            "/api/v1/tasks",
            json={"title": "Order second", "parent_id": parent["id"]},
        ).json()

        reorder_response = client.patch(
            f"/api/v1/tasks/{second['id']}",
            json={"status": "BACKLOG", "position": 0},
        )
        assert reorder_response.status_code == 200
        listed = client.get(f"/api/v1/tasks?parent_id={parent['id']}").json()
        assert [task["id"] for task in listed] == [second["id"], first["id"]]
        assert [task["position"] for task in listed] == [0, 1]

        done_response = client.patch(f"/api/v1/tasks/{first['id']}", json={"status": "DONE"})
        assert done_response.status_code == 200
        assert done_response.json()["completed_at"] is not None

        reopened_response = client.patch(f"/api/v1/tasks/{first['id']}", json={"status": "TODO"})
        assert reopened_response.status_code == 200
        assert reopened_response.json()["completed_at"] is None

        assert client.delete(f"/api/v1/tasks/{second['id']}").status_code == 204
        assert client.delete(f"/api/v1/tasks/{first['id']}").status_code == 204
        assert client.delete(f"/api/v1/tasks/{parent['id']}").status_code == 204
