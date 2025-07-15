from pydantic import BaseModel
from datetime import datetime

class ChatMessageBase(BaseModel):
    content: str

class ChatMessageCreate(ChatMessageBase):
    group_id: int
    sender_id: int

class ChatMessage(ChatMessageBase):
    id: int
    group_id: int
    sender_id: int
    created_at: datetime

    class Config:
        from_attributes = True