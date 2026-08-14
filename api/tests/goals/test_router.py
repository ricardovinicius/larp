from fastapi.testclient import TestClient

from src.core.config import Settings
from src.main import create_app


def test_goal_task_progress_and_goal_deletion() -> None:
    with TestClient(create_app(Settings(environment="test", _env_file=None))) as client:
        goal_response = client.post(
            "/api/v1/goals",
            json={"title": "Integration goal", "description": "Verify the vertical slice"},
        )
        assert goal_response.status_code == 201
        goal = goal_response.json()
        assert goal["progress"] == {
            "completed_tasks": 0,
            "total_tasks": 0,
            "percentage": 0,
        }

        parent_response = client.post(
            "/api/v1/tasks",
            json={"title": "Parent task", "goal_id": goal["id"], "status": "TODO"},
        )
        assert parent_response.status_code == 201
        parent = parent_response.json()

        child_response = client.post(
            "/api/v1/tasks",
            json={"title": "Completed subtask", "parent_id": parent["id"], "status": "DONE"},
        )
        assert child_response.status_code == 201
        child = child_response.json()
        assert child["goal_id"] == goal["id"]
        assert child["completed_at"] is not None

        progress_response = client.get(f"/api/v1/goals/{goal['id']}")
        assert progress_response.status_code == 200
        assert progress_response.json()["progress"] == {
            "completed_tasks": 1,
            "total_tasks": 2,
            "percentage": 50,
        }

        close_response = client.patch(f"/api/v1/tasks/{parent['id']}", json={"status": "CLOSED"})
        assert close_response.status_code == 200
        assert close_response.json()["completed_at"] is None
        assert client.get(f"/api/v1/goals/{goal['id']}").json()["progress"] == {
            "completed_tasks": 1,
            "total_tasks": 1,
            "percentage": 100,
        }

        delete_response = client.delete(f"/api/v1/goals/{goal['id']}")
        assert delete_response.status_code == 204
        remaining = client.get("/api/v1/tasks?unassigned=true&include_closed=true").json()
        remaining_by_id = {task["id"]: task for task in remaining}
        assert remaining_by_id[parent["id"]]["goal_id"] is None
        assert remaining_by_id[child["id"]]["goal_id"] is None

        assert client.delete(f"/api/v1/tasks/{child['id']}").status_code == 204
        assert client.delete(f"/api/v1/tasks/{parent['id']}").status_code == 204
