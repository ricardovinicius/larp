from sqlalchemy import Column, Date, String, Table, Text, text
from sqlalchemy.dialects.postgresql import UUID

from src.core.database import metadata, timestamp_columns

goals = Table(
    "goals",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")),
    Column("title", String(200), nullable=False),
    Column("description", Text, nullable=False, server_default=""),
    Column("due_date", Date, nullable=True),
    *timestamp_columns(),
)
