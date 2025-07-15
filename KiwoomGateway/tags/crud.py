import asyncpg
from typing import List, Optional

from .models import TagCreate, Tag, PostTagCreate, PostTag

async def create_tag(conn: asyncpg.Connection, tag: TagCreate) -> Tag:
    row = await conn.fetchrow(
        "INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *",
        tag.name
    )
    return Tag(**row)

async def get_tag_by_name(conn: asyncpg.Connection, name: str) -> Optional[Tag]:
    row = await conn.fetchrow(
        "SELECT * FROM tags WHERE name = $1",
        name
    )
    return Tag(**row) if row else None

async def get_tag_by_id(conn: asyncpg.Connection, tag_id: int) -> Optional[Tag]:
    row = await conn.fetchrow(
        "SELECT * FROM tags WHERE id = $1",
        tag_id
    )
    return Tag(**row) if row else None

async def add_tag_to_post(conn: asyncpg.Connection, post_id: int, tag_id: int) -> PostTag:
    row = await conn.fetchrow(
        "INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT (post_id, tag_id) DO NOTHING RETURNING *",
        post_id, tag_id
    )
    return PostTag(**row) if row else None

async def get_tags_for_post(conn: asyncpg.Connection, post_id: int) -> List[Tag]:
    rows = await conn.fetch(
        "SELECT t.id, t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = $1",
        post_id
    )
    return [Tag(**row) for row in rows]

async def remove_tag_from_post(conn: asyncpg.Connection, post_id: int, tag_id: int) -> bool:
    result = await conn.execute(
        "DELETE FROM post_tags WHERE post_id = $1 AND tag_id = $2",
        post_id, tag_id
    )
    return result == 'DELETE 1'