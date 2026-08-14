from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncConnection

from src.core.database import get_connection
from src.goals import service
from src.goals.schemas import GoalCreate, GoalRead, GoalUpdate

router = APIRouter(prefix="/api/v1/goals", tags=["goals"])
Connection = Annotated[AsyncConnection, Depends(get_connection)]


@router.get("", response_model=list[GoalRead])
async def list_goals(connection: Connection) -> list[GoalRead]:
    return await service.list_goals(connection)


@router.post("", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
async def create_goal(payload: GoalCreate, connection: Connection) -> GoalRead:
    return await service.create_goal(connection, payload)


@router.get("/{goal_id}", response_model=GoalRead)
async def get_goal(goal_id: UUID, connection: Connection) -> GoalRead:
    return await service.get_goal(connection, goal_id)


@router.patch("/{goal_id}", response_model=GoalRead)
async def update_goal(goal_id: UUID, payload: GoalUpdate, connection: Connection) -> GoalRead:
    return await service.update_goal(connection, goal_id, payload)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(goal_id: UUID, connection: Connection) -> Response:
    await service.delete_goal(connection, goal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
