import asyncpg
from typing import Optional
from datetime import datetime

from .models import LikeCreate, Like

async def create_like(conn: asyncpg.Connection, like: LikeCreate) -> Like:
    row = await conn.fetchrow(
        "INSERT INTO likes (post_id, user_id) VALUES ($1, $2) RETURNING *",
        like.post_id, like.user_id
    )
    return Like(**row)

async def delete_like(conn: asyncpg.Connection, post_id: int, user_id: int) -> bool:
    result = await conn.execute(
        "DELETE FROM likes WHERE post_id = $1 AND user_id = $2",
        post_id, user_id
    )
    return result == 'DELETE 1'

async def get_like(conn: asyncpg.Connection, post_id: int, user_id: int) -> Optional[Like]:
    row = await conn.fetchrow(
        "SELECT * FROM likes WHERE post_id = $1 AND user_id = $2",
        post_id, user_id
    )
    return Like(**row) if row else None

async def get_likes_count_for_post(conn: asyncpg.Connection, post_id: int) -> int:
    count = await conn.fetchval(
        "SELECT COUNT(*) FROM likes WHERE post_id = $1",
        post_id
    )
    return count