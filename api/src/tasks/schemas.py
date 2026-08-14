from datetime import datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from src.tasks.table import TaskStatus


class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=10_000)
    status: TaskStatus = TaskStatus.BACKLOG
    goal_id: UUID | None = None
    parent_id: UUID | None = None


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=10_000)
    status: TaskStatus | None = None
    goal_id: UUID | None = None
    parent_id: UUID | None = None
    position: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_patch(self) -> Self:
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        for field_name in ("title", "description", "status", "position"):
            if field_name in self.model_fields_set and getattr(self, field_name) is None:
                raise ValueError(f"{field_name} cannot be null")
        return self


class TaskRead(BaseModel):
    id: UUID
    goal_id: UUID | None
    parent_id: UUID | None
    title: str
    description: str
    status: TaskStatus
    position: int
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    completed_subtasks: int
    total_subtasks: int
