from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/health", tags=["health"])


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"


@router.get(
    "/live",
    response_model=HealthResponse,
    summary="Check whether the API process is alive",
)
async def liveness() -> HealthResponse:
    return HealthResponse()


@router.get(
    "/ready",
    response_model=HealthResponse,
    summary="Check whether the API is ready to receive traffic",
)
async def readiness() -> HealthResponse:
    # Add checks for required infrastructure, such as PostgreSQL, here later.
    return HealthResponse()
