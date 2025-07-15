from pydantic import BaseModel
from datetime import datetime

class GroupBase(BaseModel):
    name: str
    description: str | None = None

class GroupCreate(GroupBase):
    pass

class Group(GroupBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class GroupMemberBase(BaseModel):
    group_id: int
    user_id: int
    role: str = 'member'

class GroupMember(GroupMemberBase):
    joined_at: datetime

    class Config:
        from_attributes = True