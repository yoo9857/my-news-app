import asyncpg
from typing import List, Optional
from datetime import datetime

from .models import BoardCreate, Board, PostCreate, Post, CommentCreate, Comment

async def create_board(conn: asyncpg.Connection, board: BoardCreate) -> Board:
    row = await conn.fetchrow(
        "INSERT INTO boards (group_id, name, description) VALUES ($1, $2, $3) RETURNING *",
        board.group_id, board.name, board.description
    )
    return Board(**row)

async def get_boards(conn: asyncpg.Connection, group_id: int | None = None, skip: int = 0, limit: int = 100) -> List[Board]:
    if group_id:
        rows = await conn.fetch(
            "SELECT * FROM boards WHERE group_id = $1 ORDER BY created_at DESC OFFSET $2 LIMIT $3",
            group_id, skip, limit
        )
    else:
        rows = await conn.fetch(
            "SELECT * FROM boards ORDER BY created_at DESC OFFSET $1 LIMIT $2",
            skip, limit
        )
    return [Board(**row) for row in rows]

async def get_board(conn: asyncpg.Connection, board_id: int) -> Optional[Board]:
    row = await conn.fetchrow(
        "SELECT * FROM boards WHERE id = $1",
        board_id
    )
    return Board(**row) if row else None

async def create_post(conn: asyncpg.Connection, post: PostCreate, author_id: int) -> Post:
    # board_id가 제공되지 않은 경우 기본값 1을 사용
    board_id = post.board_id if post.board_id is not None else 1
    row = await conn.fetchrow(
        "INSERT INTO posts (board_id, title, content, author_id) VALUES ($1, $2, $3, $4) RETURNING *",
        board_id, post.title, post.content, author_id
    )
    return Post(**row)

async def get_posts(conn: asyncpg.Connection, board_id: int, skip: int = 0, limit: int = 100) -> List[Post]:
    rows = await conn.fetch(
        "SELECT * FROM posts WHERE board_id = $1 ORDER BY created_at DESC OFFSET $2 LIMIT $3",
        board_id, skip, limit
    )
    return [Post(**row) for row in rows]

async def get_post(conn: asyncpg.Connection, post_id: int) -> Optional[Post]:
    row = await conn.fetchrow(
        "SELECT * FROM posts WHERE id = $1",
        post_id
    )
    return Post(**row) if row else None

async def update_post(conn: asyncpg.Connection, post_id: int, post: PostCreate) -> Optional[Post]:
    row = await conn.fetchrow(
        "UPDATE posts SET board_id = $1, title = $2, content = $3, updated_at = $4 WHERE id = $5 RETURNING *",
        post.board_id, post.title, post.content, datetime.now(), post_id
    )
    return Post(**row) if row else None

async def delete_post(conn: asyncpg.Connection, post_id: int) -> bool:
    result = await conn.execute(
        "DELETE FROM posts WHERE id = $1",
        post_id
    )
    return result == 'DELETE 1'

async def create_comment(conn: asyncpg.Connection, comment: CommentCreate, post_id: int, author_id: int) -> Comment:
    row = await conn.fetchrow(
        "INSERT INTO comments (post_id, content, author_id) VALUES ($1, $2, $3) RETURNING *",
        post_id, comment.content, author_id
    )
    return Comment(**row)

async def get_comments_for_post(conn: asyncpg.Connection, post_id: int) -> List[Comment]:
    rows = await conn.fetch(
        "SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC",
        post_id
    )
    return [Comment(**row) for row in rows]

async def delete_comment(conn: asyncpg.Connection, comment_id: int) -> bool:
    result = await conn.execute(
        "DELETE FROM comments WHERE id = $1",
        comment_id
    )
    return result == 'DELETE 1'

async def get_comment(conn: asyncpg.Connection, comment_id: int) -> Optional[Comment]:
    row = await conn.fetchrow(
        "SELECT * FROM comments WHERE id = $1",
        comment_id
    )
    return Comment(**row) if row else None

async def get_best_posts(conn: asyncpg.Connection, limit: int = 10) -> List[Post]:
    rows = await conn.fetch(
        """
        SELECT p.*, COUNT(l.post_id) AS likes_count
        FROM posts p
        LEFT JOIN likes l ON p.id = l.post_id
        GROUP BY p.id
        ORDER BY likes_count DESC, p.created_at DESC
        LIMIT $1
        """,
        limit
    )
    return [Post(**row) for row in rows]

async def get_all_posts(conn: asyncpg.Connection, skip: int = 0, limit: int = 100) -> List[Post]:
    rows = await conn.fetch(
        "SELECT * FROM posts ORDER BY created_at DESC OFFSET $1 LIMIT $2",
        skip, limit
    )
    return [Post(**row) for row in rows]
