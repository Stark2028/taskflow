"""Schemas shared by several routers: pagination input and paginated output."""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PageParams(BaseModel):
    """limit/offset pagination, validated before any SQL runs."""

    limit: int = Field(10, ge=1, le=100)
    offset: int = Field(0, ge=0)


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int  # number of rows matching the filters, ignoring limit/offset
    limit: int
    offset: int
