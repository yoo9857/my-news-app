from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
import asyncpg
import os
import json
from typing import Dict, List

from .models import ChatMessage, ChatMessageCreate
from . import crud
from KiwoomGateway.auth.dependencies import get_current_user
from KiwoomGateway.auth.models import UserBase

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, group_id: int, websocket: WebSocket):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)

    def disconnect(self, group_id: int, websocket: WebSocket):
        self.active_connections[group_id].remove(websocket)
        if not self.active_connections[group_id]:
            del self.active_connections[group_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, group_id: int, message: str):
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                await connection.send_text(message)

manager = ConnectionManager()

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

@router.get("/chat/{group_id}/messages", response_model=List[ChatMessage])
async def get_chat_messages(
    group_id: int,
    conn: asyncpg.Connection = Depends(get_db_connection),
    current_user: UserBase = Depends(get_current_user) # Ensure user is authenticated
):
    # Optional: Add logic to check if current_user is a member of the group
    messages = await crud.get_chat_messages_for_group(conn, group_id)
    return messages

@router.websocket("/ws/chat/{group_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    group_id: int,
    conn: asyncpg.Connection = Depends(get_db_connection),
    current_user: UserBase = Depends(get_current_user) # Authenticate via token in query param or header
):
    # For WebSocket authentication, you might need to pass the token in query parameters
    # e.g., ws://localhost:8003/ws/chat/1?token=YOUR_JWT_TOKEN
    # And then retrieve it from websocket.query_params.get("token")
    # For simplicity, assuming get_current_user works with token in headers for initial HTTP handshake
    # or you implement custom WebSocket authentication.

    await manager.connect(group_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            content = message_data.get("content")

            if content:
                chat_message_create = ChatMessageCreate(
                    group_id=group_id,
                    sender_id=current_user.id, # Use authenticated user's ID
                    content=content
                )
                saved_message = await crud.create_chat_message(conn, chat_message_create)
                await manager.broadcast(group_id, json.dumps(saved_message.dict()))
    except WebSocketDisconnect:
        manager.disconnect(group_id, websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(group_id, websocket)
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
