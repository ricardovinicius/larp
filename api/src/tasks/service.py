from collections.abc import Mapping, Sequence
from typing import Any
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncConnection

from src.core.errors import DomainError
from src.goals import repository as goal_repository
from src.tasks import repository
from src.tasks.schemas import TaskCreate, TaskRead, TaskUpdate
from src.tasks.table import TaskStatus


def _task_not_found() -> DomainError:
    return DomainError(404, "TASK_NOT_FOUND", "Task was not found")


def _goal_not_found() -> DomainError:
    return DomainError(404, "GOAL_NOT_FOUND", "Goal was not found")


def _invalid_parent(message: str) -> DomainError:
    return DomainError(422, "INVALID_TASK_PARENT", message)


def _to_task_read(row: Mapping[str, Any], counts: tuple[int, int] = (0, 0)) -> TaskRead:
    return TaskRead(
        **row,
        completed_subtasks=counts[0],
        total_subtasks=counts[1],
    )


async def _require_goal(connection: AsyncConnection, goal_id: UUID) -> None:
    if await goal_repository.get_goal_row(connection, goal_id) is None:
        raise _goal_not_found()


async def _require_parent(
    connection: AsyncConnection, parent_id: UUID, task_id: UUID | None = None
) -> Mapping[str, Any]:
    if task_id is not None and parent_id == task_id:
        raise _invalid_parent("A task cannot be its own parent")
    parent = await repository.get_task_row(connection, parent_id, for_update=True)
    if parent is None:
        raise DomainError(404, "TASK_NOT_FOUND", "Parent task was not found")
    if parent["parent_id"] is not None:
        raise _invalid_parent("Only top-level tasks can have subtasks")
    return parent


async def _read_with_counts(connection: AsyncConnection, row: Mapping[str, Any]) -> TaskRead:
    counts = await repository.get_subtask_counts(connection, [row["id"]])
    return _to_task_read(row, counts.get(row["id"], (0, 0)))


async def list_tasks(
    connection: AsyncConnection,
    *,
    goal_id: UUID | None,
    unassigned: bool,
    statuses: Sequence[TaskStatus] | None,
    parent_id: UUID | None,
    top_level_only: bool,
    include_closed: bool,
) -> list[TaskRead]:
    if goal_id is not None and unassigned:
        raise DomainError(
            400,
            "CONTRADICTORY_FILTERS",
            "goal_id and unassigned=true cannot be used together",
        )
    if parent_id is not None and top_level_only:
        raise DomainError(
            400,
            "CONTRADICTORY_FILTERS",
            "parent_id and top_level_only=true cannot be used together",
        )
    if goal_id is not None:
        await _require_goal(connection, goal_id)
    if parent_id is not None and await repository.get_task_row(connection, parent_id) is None:
        raise _task_not_found()

    rows = await repository.list_task_rows(
        connection,
        goal_id=goal_id,
        unassigned=unassigned,
        statuses=statuses,
        parent_id=parent_id,
        top_level_only=top_level_only,
        include_closed=include_closed,
    )
    counts = await repository.get_subtask_counts(connection, (row["id"] for row in rows))
    return [_to_task_read(row, counts.get(row["id"], (0, 0))) for row in rows]


async def get_task(connection: AsyncConnection, task_id: UUID) -> TaskRead:
    row = await repository.get_task_row(connection, task_id)
    if row is None:
        raise _task_not_found()
    return await _read_with_counts(connection, row)


async def create_task(connection: AsyncConnection, payload: TaskCreate) -> TaskRead:
    values = payload.model_dump()
    async with connection.begin():
        parent = None
        if payload.parent_id is not None:
            parent = await _require_parent(connection, payload.parent_id)
            if "goal_id" in payload.model_fields_set and payload.goal_id != parent["goal_id"]:
                raise _invalid_parent("A subtask must use its parent's goal")
            values["goal_id"] = parent["goal_id"]
        elif payload.goal_id is not None:
            await _require_goal(connection, payload.goal_id)

        siblings = await repository.list_scope_ids(
            connection,
            parent_id=payload.parent_id,
            status=payload.status,
            for_update=True,
        )
        values["position"] = len(siblings)
        values["completed_at"] = func.now() if payload.status == TaskStatus.DONE else None
        row = await repository.insert_task(connection, values)
    return _to_task_read(row)


async def update_task(connection: AsyncConnection, task_id: UUID, payload: TaskUpdate) -> TaskRead:
    fields = payload.model_fields_set
    changes = payload.model_dump(exclude_unset=True)
    async with connection.begin():
        current = await repository.get_task_row(connection, task_id, for_update=True)
        if current is None:
            raise _task_not_found()

        old_parent_id: UUID | None = current["parent_id"]
        old_status: TaskStatus = current["status"]
        new_parent_id = changes.get("parent_id", old_parent_id)
        new_status = changes.get("status", old_status)
        new_goal_id = changes.get("goal_id", current["goal_id"])

        if "parent_id" in fields and new_parent_id is not None:
            if await repository.has_subtasks(connection, task_id):
                raise _invalid_parent("A task with subtasks cannot become a subtask")
            parent = await _require_parent(connection, new_parent_id, task_id)
            if "goal_id" in fields and new_goal_id != parent["goal_id"]:
                raise _invalid_parent("A subtask must use its parent's goal")
            new_goal_id = parent["goal_id"]
        elif new_parent_id is not None:
            parent = await _require_parent(connection, new_parent_id, task_id)
            if "goal_id" in fields and new_goal_id != parent["goal_id"]:
                raise _invalid_parent("A subtask must use its parent's goal")
            new_goal_id = parent["goal_id"]
        elif new_goal_id is not None:
            await _require_goal(connection, new_goal_id)

        changes["parent_id"] = new_parent_id
        changes["goal_id"] = new_goal_id
        changes.pop("position", None)

        if new_status == TaskStatus.DONE:
            if old_status != TaskStatus.DONE:
                changes["completed_at"] = func.now()
        else:
            changes["completed_at"] = None

        scope_changed = old_parent_id != new_parent_id or old_status != new_status
        await repository.update_task(connection, task_id, changes)

        if old_parent_id is None and current["goal_id"] != new_goal_id:
            await repository.update_subtask_goals(connection, task_id, new_goal_id)

        if scope_changed:
            old_ids = await repository.list_scope_ids(
                connection,
                parent_id=old_parent_id,
                status=old_status,
                exclude_id=task_id,
                for_update=True,
            )
            await repository.set_scope_positions(connection, old_ids)

        if scope_changed or "position" in fields:
            target_ids = await repository.list_scope_ids(
                connection,
                parent_id=new_parent_id,
                status=new_status,
                exclude_id=task_id,
                for_update=True,
            )
            desired = payload.position if "position" in fields else len(target_ids)
            assert desired is not None
            target_ids.insert(min(desired, len(target_ids)), task_id)
            await repository.set_scope_positions(connection, target_ids)

        row = await repository.get_task_row(connection, task_id)
        assert row is not None
    return await _read_with_counts(connection, row)


async def delete_task(connection: AsyncConnection, task_id: UUID) -> None:
    async with connection.begin():
        row = await repository.get_task_row(connection, task_id, for_update=True)
        if row is None:
            raise _task_not_found()
        if await repository.has_subtasks(connection, task_id):
            raise DomainError(
                409,
                "TASK_HAS_SUBTASKS",
                "Delete this task's subtasks before deleting the task",
            )
        await repository.delete_task(connection, task_id)
        remaining = await repository.list_scope_ids(
            connection,
            parent_id=row["parent_id"],
            status=row["status"],
            for_update=True,
        )
        await repository.set_scope_positions(connection, remaining)
