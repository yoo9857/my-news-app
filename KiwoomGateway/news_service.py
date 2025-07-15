import os
import asyncio
import asyncpg
import aio_pika
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    retries = 5
    delay = 2
    for i in range(retries):
        try:
            app.state.db_pool = await asyncpg.create_pool(
                user=os.getenv("POSTGRES_USER"),
                password=os.getenv("POSTGRES_PASSWORD"),
                database=os.getenv("POSTGRES_DB"),
                host=os.getenv("POSTGRES_HOST"),
                port=os.getenv("POSTGRES_PORT")
            )
            print("PostgreSQL connection pool created successfully in news_service.")
            break
        except Exception as e:
            print(f"Attempt {i+1}/{retries} to connect to PostgreSQL in news_service failed: {e}")
            if i < retries - 1:
                await asyncio.sleep(delay)
            else:
                raise
    
    async def consume_news():
        rabbitmq_user = os.getenv("RABBITMQ_USER")
        rabbitmq_password = os.getenv("RABBITMQ_PASSWORD")
        rabbitmq_host = os.getenv("RABBITMQ_HOST")
        connection_url = f"amqp://{rabbitmq_user}:{rabbitmq_password}@{rabbitmq_host}/"
        
        connection = await aio_pika.connect_robust(connection_url)
        async with connection:
            channel = await connection.channel()
            queue = await channel.declare_queue('news_queue', durable=True)
            async with queue.iterator() as queue_iter:
                async for message in queue_iter:
                    async with message.process():
                        await manager.broadcast(message.body.decode())
    
    asyncio.create_task(consume_news())

@app.on_event("shutdown")
async def shutdown_event():
    await app.state.db_pool.close()

@app.get("/api/news")
async def get_news(limit: int = 50):
    async with app.state.db_pool.acquire() as conn:
        news = await conn.fetch(
            "SELECT title, url, source, published_at FROM news_articles ORDER BY published_at DESC NULLS LAST LIMIT $1",
            limit
        )
        return {"success": True, "data": [dict(n) for n in news]}

@app.websocket("/ws/realtime-news")
async def websocket_realtime_news(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
