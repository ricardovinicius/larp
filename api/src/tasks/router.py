from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncConnection

from src.core.database import get_connection
from src.tasks import service
from src.tasks.schemas import TaskCreate, TaskRead, TaskUpdate
from src.tasks.table import TaskStatus

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])
Connection = Annotated[AsyncConnection, Depends(get_connection)]


@router.get("", response_model=list[TaskRead])
async def list_tasks(
    connection: Connection,
    goal_id: UUID | None = None,
    unassigned: bool = False,
    status_filter: Annotated[list[TaskStatus] | None, Query(alias="status")] = None,
    parent_id: UUID | None = None,
    top_level_only: bool = False,
    include_closed: bool = False,
) -> list[TaskRead]:
    return await service.list_tasks(
        connection,
        goal_id=goal_id,
        unassigned=unassigned,
        statuses=status_filter,
        parent_id=parent_id,
        top_level_only=top_level_only,
        include_closed=include_closed,
    )


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreate, connection: Connection) -> TaskRead:
    return await service.create_task(connection, payload)


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(task_id: UUID, connection: Connection) -> TaskRead:
    return await service.get_task(connection, task_id)


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(task_id: UUID, payload: TaskUpdate, connection: Connection) -> TaskRead:
    return await service.update_task(connection, task_id, payload)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: UUID, connection: Connection) -> Response:
    await service.delete_task(connection, task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
