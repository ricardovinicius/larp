from collections.abc import Iterable, Mapping
from typing import Any
from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncConnection

from src.goals.table import goals
from src.tasks.table import TaskStatus, tasks


async def list_goal_rows(connection: AsyncConnection) -> list[Mapping[str, Any]]:
    statement = select(goals).order_by(
        goals.c.due_date.asc().nulls_last(),
        goals.c.created_at.desc(),
        goals.c.id,
    )
    result = await connection.execute(statement)
    return list(result.mappings().all())


async def get_goal_row(
    connection: AsyncConnection,
    goal_id: UUID,
    *,
    for_update: bool = False,
) -> Mapping[str, Any] | None:
    statement = select(goals).where(goals.c.id == goal_id)
    if for_update:
        statement = statement.with_for_update()
    result = await connection.execute(statement)
    return result.mappings().one_or_none()


async def insert_goal(connection: AsyncConnection, values: dict[str, Any]) -> Mapping[str, Any]:
    result = await connection.execute(goals.insert().values(**values).returning(goals))
    return result.mappings().one()


async def update_goal(
    connection: AsyncConnection, goal_id: UUID, values: dict[str, Any]
) -> Mapping[str, Any] | None:
    statement = (
        update(goals)
        .where(goals.c.id == goal_id)
        .values(**values, updated_at=func.now())
        .returning(goals)
    )
    result = await connection.execute(statement)
    return result.mappings().one_or_none()


async def delete_goal(connection: AsyncConnection, goal_id: UUID) -> bool:
    result = await connection.execute(delete(goals).where(goals.c.id == goal_id))
    return result.rowcount == 1


async def get_progress_by_goal(
    connection: AsyncConnection, goal_ids: Iterable[UUID]
) -> dict[UUID, tuple[int, int]]:
    ids = list(goal_ids)
    if not ids:
        return {}

    statement = (
        select(
            tasks.c.goal_id,
            func.count().filter(tasks.c.status == TaskStatus.DONE).label("completed"),
            func.count().filter(tasks.c.status != TaskStatus.CLOSED).label("total"),
        )
        .where(tasks.c.goal_id.in_(ids))
        .group_by(tasks.c.goal_id)
    )
    result = await connection.execute(statement)
    return {
        row.goal_id: (int(row.completed), int(row.total))
        for row in result
        if row.goal_id is not None
    }
