from collections.abc import Iterable, Mapping, Sequence
from typing import Any
from uuid import UUID

from sqlalchemy import case, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncConnection

from src.tasks.table import TaskStatus, tasks

STATUS_ORDER = case(
    (tasks.c.status == TaskStatus.BACKLOG, 0),
    (tasks.c.status == TaskStatus.TODO, 1),
    (tasks.c.status == TaskStatus.DOING, 2),
    (tasks.c.status == TaskStatus.DONE, 3),
    else_=4,
)


async def list_task_rows(
    connection: AsyncConnection,
    *,
    goal_id: UUID | None,
    unassigned: bool,
    statuses: Sequence[TaskStatus] | None,
    parent_id: UUID | None,
    top_level_only: bool,
    include_closed: bool,
) -> list[Mapping[str, Any]]:
    statement = select(tasks)
    if goal_id is not None:
        statement = statement.where(tasks.c.goal_id == goal_id)
    elif unassigned:
        statement = statement.where(tasks.c.goal_id.is_(None))
    if statuses:
        statement = statement.where(tasks.c.status.in_(statuses))
    if not include_closed and (not statuses or TaskStatus.CLOSED not in statuses):
        statement = statement.where(tasks.c.status != TaskStatus.CLOSED)
    if parent_id is not None:
        statement = statement.where(tasks.c.parent_id == parent_id)
    elif top_level_only:
        statement = statement.where(tasks.c.parent_id.is_(None))
    statement = statement.order_by(
        STATUS_ORDER,
        tasks.c.position,
        tasks.c.created_at,
        tasks.c.id,
    )
    result = await connection.execute(statement)
    return list(result.mappings().all())


async def get_task_row(
    connection: AsyncConnection,
    task_id: UUID,
    *,
    for_update: bool = False,
) -> Mapping[str, Any] | None:
    statement = select(tasks).where(tasks.c.id == task_id)
    if for_update:
        statement = statement.with_for_update()
    result = await connection.execute(statement)
    return result.mappings().one_or_none()


async def insert_task(connection: AsyncConnection, values: dict[str, Any]) -> Mapping[str, Any]:
    result = await connection.execute(tasks.insert().values(**values).returning(tasks))
    return result.mappings().one()


async def update_task(connection: AsyncConnection, task_id: UUID, values: dict[str, Any]) -> None:
    await connection.execute(
        update(tasks).where(tasks.c.id == task_id).values(**values, updated_at=func.now())
    )


async def update_subtask_goals(
    connection: AsyncConnection, parent_id: UUID, goal_id: UUID | None
) -> None:
    await connection.execute(
        update(tasks)
        .where(tasks.c.parent_id == parent_id)
        .values(goal_id=goal_id, updated_at=func.now())
    )


async def has_subtasks(connection: AsyncConnection, task_id: UUID) -> bool:
    result = await connection.execute(
        select(tasks.c.id).where(tasks.c.parent_id == task_id).limit(1)
    )
    return result.scalar_one_or_none() is not None


async def get_subtask_counts(
    connection: AsyncConnection, parent_ids: Iterable[UUID]
) -> dict[UUID, tuple[int, int]]:
    ids = list(parent_ids)
    if not ids:
        return {}
    statement = (
        select(
            tasks.c.parent_id,
            func.count().filter(tasks.c.status == TaskStatus.DONE).label("completed"),
            func.count().filter(tasks.c.status != TaskStatus.CLOSED).label("total"),
        )
        .where(tasks.c.parent_id.in_(ids))
        .group_by(tasks.c.parent_id)
    )
    result = await connection.execute(statement)
    return {
        row.parent_id: (int(row.completed), int(row.total))
        for row in result
        if row.parent_id is not None
    }


async def list_scope_ids(
    connection: AsyncConnection,
    *,
    parent_id: UUID | None,
    status: TaskStatus,
    exclude_id: UUID | None = None,
    for_update: bool = False,
) -> list[UUID]:
    parent_clause = (
        tasks.c.parent_id.is_(None) if parent_id is None else tasks.c.parent_id == parent_id
    )
    statement = (
        select(tasks.c.id)
        .where(parent_clause, tasks.c.status == status)
        .order_by(tasks.c.position, tasks.c.created_at, tasks.c.id)
    )
    if exclude_id is not None:
        statement = statement.where(tasks.c.id != exclude_id)
    if for_update:
        statement = statement.with_for_update()
    result = await connection.execute(statement)
    return list(result.scalars().all())


async def set_scope_positions(connection: AsyncConnection, task_ids: Sequence[UUID]) -> None:
    for position, task_id in enumerate(task_ids):
        await connection.execute(
            update(tasks)
            .where(tasks.c.id == task_id)
            .values(position=position, updated_at=func.now())
        )


async def delete_task(connection: AsyncConnection, task_id: UUID) -> bool:
    result = await connection.execute(delete(tasks).where(tasks.c.id == task_id))
    return result.rowcount == 1
