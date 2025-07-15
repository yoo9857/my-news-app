import asyncpg
from typing import List

from .models import ChatMessage, ChatMessageCreate

async def create_chat_message(conn: asyncpg.Connection, message: ChatMessageCreate) -> ChatMessage:
    row = await conn.fetchrow(
        "INSERT INTO chat_messages (group_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *",
        message.group_id, message.sender_id, message.content
    )
    return ChatMessage(**row)

async def get_chat_messages_for_group(conn: asyncpg.Connection, group_id: int, limit: int = 50) -> List[ChatMessage]:
    rows = await conn.fetch(
        "SELECT * FROM chat_messages WHERE group_id = $1 ORDER BY created_at DESC LIMIT $2",
        group_id, limit
    )
    return [ChatMessage(**row) for row in rows]