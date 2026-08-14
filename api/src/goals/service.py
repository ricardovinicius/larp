from collections.abc import Mapping
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncConnection

from src.core.errors import DomainError
from src.goals import repository
from src.goals.schemas import GoalCreate, GoalProgress, GoalRead, GoalUpdate


def _not_found() -> DomainError:
    return DomainError(404, "GOAL_NOT_FOUND", "Goal was not found")


def _to_goal_read(row: Mapping[str, Any], completed: int, total: int) -> GoalRead:
    percentage = completed * 100 // total if total else 0
    return GoalRead(
        **row,
        progress=GoalProgress(
            completed_tasks=completed,
            total_tasks=total,
            percentage=percentage,
        ),
    )


async def list_goals(connection: AsyncConnection) -> list[GoalRead]:
    rows = await repository.list_goal_rows(connection)
    progress = await repository.get_progress_by_goal(connection, (row["id"] for row in rows))
    return [_to_goal_read(row, *progress.get(row["id"], (0, 0))) for row in rows]


async def get_goal(connection: AsyncConnection, goal_id: UUID) -> GoalRead:
    row = await repository.get_goal_row(connection, goal_id)
    if row is None:
        raise _not_found()
    progress = await repository.get_progress_by_goal(connection, [goal_id])
    return _to_goal_read(row, *progress.get(goal_id, (0, 0)))


async def create_goal(connection: AsyncConnection, payload: GoalCreate) -> GoalRead:
    async with connection.begin():
        row = await repository.insert_goal(connection, payload.model_dump())
    return _to_goal_read(row, 0, 0)


async def update_goal(connection: AsyncConnection, goal_id: UUID, payload: GoalUpdate) -> GoalRead:
    async with connection.begin():
        row = await repository.update_goal(
            connection,
            goal_id,
            payload.model_dump(exclude_unset=True),
        )
        if row is None:
            raise _not_found()
    progress = await repository.get_progress_by_goal(connection, [goal_id])
    return _to_goal_read(row, *progress.get(goal_id, (0, 0)))


async def delete_goal(connection: AsyncConnection, goal_id: UUID) -> None:
    async with connection.begin():
        deleted = await repository.delete_goal(connection, goal_id)
        if not deleted:
            raise _not_found()
