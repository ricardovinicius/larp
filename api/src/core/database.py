from collections.abc import AsyncIterator
from datetime import datetime

from fastapi import Request
from sqlalchemy import Column, DateTime, MetaData, func
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine, create_async_engine

metadata = MetaData()


def timestamp_columns() -> tuple[Column[datetime], Column[datetime]]:
    return (
        Column(
            "created_at",
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
        Column(
            "updated_at",
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
    )


def create_database_engine(database_url: str) -> AsyncEngine:
    return create_async_engine(database_url, pool_pre_ping=True)


async def get_connection(request: Request) -> AsyncIterator[AsyncConnection]:
    engine: AsyncEngine = request.app.state.db_engine
    async with engine.connect() as connection:
        yield connection
