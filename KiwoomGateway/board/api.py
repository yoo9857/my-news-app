from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
import os

from .models import Board, BoardCreate, Post, PostCreate, Comment, CommentCreate
from . import crud
from auth.dependencies import get_current_user
from auth.models import UserBase

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

# Board Endpoints
@router.post("/boards/", response_model=Board, status_code=status.HTTP_201_CREATED)
async def create_new_board(
    board: BoardCreate,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    # Optional: Check if current_user has permission to create board in this group
    return await crud.create_board(conn, board)

@router.get("/boards/", response_model=list[Board])
async def read_boards(
    group_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    return await crud.get_boards(conn, group_id=group_id, skip=skip, limit=limit)

@router.get("/boards/{board_id}", response_model=Board)
async def read_board(
    board_id: int,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    board = await crud.get_board(conn, board_id)
    if board is None:
        raise HTTPException(status_code=404, detail="Board not found")
    return board

# Post Endpoints (Modified to use board_id)
@router.post("/boards/{board_id}/posts/", response_model=Post, status_code=status.HTTP_201_CREATED)
async def create_new_post(
    board_id: int,
    post: PostCreate,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    # Optional: Check if current_user has permission to post to this board
    post.board_id = board_id # Assign board_id from path
    return await crud.create_post(conn, post, current_user.id)

@router.get("/boards/{board_id}/posts/", response_model=list[Post])
async def read_posts(
    board_id: int,
    skip: int = 0,
    limit: int = 100,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    return await crud.get_posts(conn, board_id=board_id, skip=skip, limit=limit)

@router.get("/posts/{post_id}", response_model=Post)
async def read_post(
    post_id: int,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    post = await crud.get_post(conn, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.put("/posts/{post_id}", response_model=Post)
async def update_existing_post(
    post_id: int,
    post: PostCreate,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    db_post = await crud.get_post(conn, post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    if db_post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this post")
    return await crud.update_post(conn, post_id, post)

@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_post(
    post_id: int,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    db_post = await crud.get_post(conn, post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    if db_post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    await crud.delete_post(conn, post_id)
    return

@router.post("/posts/{post_id}/comments/", response_model=Comment, status_code=status.HTTP_201_CREATED)
async def create_comment_for_post(
    post_id: int,
    comment: CommentCreate,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    post = await crud.get_post(conn, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return await crud.create_comment(conn, comment, post_id, current_user.id)

@router.get("/posts/{post_id}/comments/", response_model=list[Comment])
async def read_comments_for_post(
    post_id: int,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    return await crud.get_comments_for_post(conn, post_id)

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_comment(
    comment_id: int,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    db_comment = await crud.get_comment(conn, comment_id) # Assuming crud.get_comment exists
    if db_comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    if db_comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    await crud.delete_comment(conn, comment_id)
    return

@router.get("/posts/best", response_model=list[Post])
async def read_best_posts(
    limit: int = 10,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    return await crud.get_best_posts(conn, limit=limit)

@router.post("/posts/", response_model=Post, status_code=status.HTTP_201_CREATED)
async def create_post_without_board_id(
    post: PostCreate,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Create a new post without specifying a board_id in the path.
    The board_id can be included in the request body, otherwise it defaults to 1.
    """
    if not current_user.id:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    return await crud.create_post(conn, post, current_user.id)

@router.get("/posts/", response_model=list[Post])
async def read_all_posts(
    skip: int = 0,
    limit: int = 100,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    return await crud.get_all_posts(conn, skip=skip, limit=limit)
