from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
import os

from .models import Tag, TagCreate, PostTag
from . import crud
from KiwoomGateway.auth.dependencies import get_current_user
from KiwoomGateway.auth.models import UserBase

router = APIRouter()

async def get_db_connection():
    conn = None
    try:
        conn = await asyncpg.connect(
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            database=os.getenv("POSTGRES_DB"),
            host=os.getenv("POSTGRES_HOST"),
            port=os.getenv("POSTGRES_PORT")
        )
        yield conn
    finally:
        if conn:
            await conn.close()

@router.post("/tags/", response_model=Tag, status_code=status.HTTP_201_CREATED)
async def create_new_tag(
    tag: TagCreate,
    current_user: UserBase = Depends(get_current_user), # Only authenticated users can create tags
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    return await crud.create_tag(conn, tag)

@router.get("/tags/", response_model=list[Tag])
async def read_tags(
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    # For simplicity, returning all tags. In real app, might add pagination/search
    rows = await conn.fetch("SELECT * FROM tags")
    return [Tag(**row) for row in rows]

@router.post("/posts/{post_id}/tags/{tag_id}", response_model=PostTag, status_code=status.HTTP_201_CREATED)
async def add_tag_to_post(
    post_id: int,
    tag_id: int,
    current_user: UserBase = Depends(get_current_user), # Only authenticated users can add tags
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    # Optional: Check if user is author of post or admin
    return await crud.add_tag_to_post(conn, post_id, tag_id)

@router.get("/posts/{post_id}/tags", response_model=list[Tag])
async def get_tags_for_post(
    post_id: int,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    return await crud.get_tags_for_post(conn, post_id)

@router.delete("/posts/{post_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_tag_from_post(
    post_id: int,
    tag_id: int,
    current_user: UserBase = Depends(get_current_user), # Only authenticated users can remove tags
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    # Optional: Check if user is author of post or admin
    deleted = await crud.remove_tag_from_post(conn, post_id, tag_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Tag not found on post")
    return