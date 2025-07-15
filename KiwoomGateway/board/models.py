from pydantic import BaseModel
from datetime import datetime

class BoardBase(BaseModel):
    group_id: int
    name: str
    description: str | None = None

class BoardCreate(BoardBase):
    pass

class Board(BoardBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class PostBase(BaseModel):
    title: str
    content: str
    board_id: int | None = 1 # New field

class PostCreate(PostBase):
    pass

class Post(PostBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    post_id: int
    author_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True