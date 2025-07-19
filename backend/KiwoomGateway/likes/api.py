from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
import os

from .models import Like, LikeCreate
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

@router.post("/posts/{post_id}/likes", response_model=Like, status_code=status.HTTP_201_CREATED)
async def like_post(
    post_id: int,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    existing_like = await crud.get_like(conn, post_id, current_user.id)
    if existing_like:
        raise HTTPException(status_code=409, detail="Post already liked by this user")
    
    like_data = LikeCreate(post_id=post_id, user_id=current_user.id)
    return await crud.create_like(conn, like_data)

@router.delete("/posts/{post_id}/likes", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_post(
    post_id: int,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    deleted = await crud.delete_like(conn, post_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Like not found")
    return

@router.get("/posts/{post_id}/likes/count", response_model=int)
async def get_post_likes_count(
    post_id: int,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    return await crud.get_likes_count_for_post(conn, post_id)