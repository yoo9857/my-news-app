from pydantic import BaseModel

class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int

    class Config:
        from_attributes = True

class PostTagBase(BaseModel):
    post_id: int
    tag_id: int

class PostTagCreate(PostTagBase):
    pass

class PostTag(PostTagBase):
    class Config:
        from_attributes = True