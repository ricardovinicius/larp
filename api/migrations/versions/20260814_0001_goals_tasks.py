"""Create goals and tasks.

Revision ID: 20260814_0001
Revises:
Create Date: 2026-08-14
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260814_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

task_status = postgresql.ENUM(
    "BACKLOG",
    "TODO",
    "DOING",
    "DONE",
    "CLOSED",
    name="task_status",
    create_type=False,
)


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    task_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "goals",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "tasks",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("goal_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("status", task_status, server_default="BACKLOG", nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "(status = 'DONE' AND completed_at IS NOT NULL) OR "
            "(status <> 'DONE' AND completed_at IS NULL)",
            name="ck_tasks_completed_at_matches_status",
        ),
        sa.CheckConstraint("position >= 0", name="ck_tasks_position_non_negative"),
        sa.ForeignKeyConstraint(["goal_id"], ["goals.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["parent_id"], ["tasks.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tasks_goal_id", "tasks", ["goal_id"])
    op.create_index("ix_tasks_parent_id", "tasks", ["parent_id"])
    op.create_index(
        "ix_tasks_status_parent_position",
        "tasks",
        ["status", "parent_id", "position"],
    )


def downgrade() -> None:
    op.drop_index("ix_tasks_status_parent_position", table_name="tasks")
    op.drop_index("ix_tasks_parent_id", table_name="tasks")
    op.drop_index("ix_tasks_goal_id", table_name="tasks")
    op.drop_table("tasks")
    op.drop_table("goals")
    task_status.drop(op.get_bind(), checkfirst=True)
