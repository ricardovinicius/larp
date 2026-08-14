from enum import StrEnum

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import UUID

from src.core.database import metadata, timestamp_columns


class TaskStatus(StrEnum):
    BACKLOG = "BACKLOG"
    TODO = "TODO"
    DOING = "DOING"
    DONE = "DONE"
    CLOSED = "CLOSED"


task_status_type = Enum(
    TaskStatus,
    name="task_status",
    values_callable=lambda enum: [item.value for item in enum],
)

tasks = Table(
    "tasks",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")),
    Column(
        "goal_id",
        UUID(as_uuid=True),
        ForeignKey("goals.id", ondelete="SET NULL"),
        nullable=True,
    ),
    Column(
        "parent_id",
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="RESTRICT"),
        nullable=True,
    ),
    Column("title", String(200), nullable=False),
    Column("description", Text, nullable=False, server_default=""),
    Column("status", task_status_type, nullable=False, server_default=TaskStatus.BACKLOG.value),
    Column("position", Integer, nullable=False),
    Column("completed_at", DateTime(timezone=True), nullable=True),
    *timestamp_columns(),
    CheckConstraint("position >= 0", name="ck_tasks_position_non_negative"),
    CheckConstraint(
        "(status = 'DONE' AND completed_at IS NOT NULL) OR "
        "(status <> 'DONE' AND completed_at IS NULL)",
        name="ck_tasks_completed_at_matches_status",
    ),
)

Index("ix_tasks_goal_id", tasks.c.goal_id)
Index("ix_tasks_parent_id", tasks.c.parent_id)
Index("ix_tasks_status_parent_position", tasks.c.status, tasks.c.parent_id, tasks.c.position)
