import os
import json
import asyncio
import redis.asyncio as redis
import asyncpg
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Header, HTTPException, Depends
from typing import Optional
from datetime import date, datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
import aio_pika
import httpx

# New imports for authentication
from fastapi.security import OAuth2PasswordRequestForm
from KiwoomGateway.auth.models import UserBase, UserCreate, UserInDB, Token
from KiwoomGateway.auth.security import create_access_token, verify_password, get_password_hash
from KiwoomGateway.auth.dependencies import get_user, get_current_user

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# --- Connection Pools and State ---
@app.on_event("startup")
async def startup_event():
    print("--- API 서버 시작 프로세스 (v5, asyncpg) ---")
    # Create an asyncpg connection pool with retry logic
    retries = 5
    delay = 5
    for i in range(retries):
        try:
            app.state.db_pool = await asyncpg.create_pool(
                user=os.getenv("POSTGRES_USER"),
                password=os.getenv("POSTGRES_PASSWORD"),
                database=os.getenv("POSTGRES_DB"),
                host=os.getenv("POSTGRES_HOST"),
                port=os.getenv("POSTGRES_PORT"),
                min_size=1,
                max_size=10
            )
            print("✅ asyncpg 커넥션 풀이 생성되었습니다.")
            break
        except Exception as e:
            print(f"🔥 asyncpg 커넥션 풀 생성 실패 (시도 {i+1}/{retries}): {e}")
            if i < retries - 1:
                await asyncio.sleep(delay)
            else:
                app.state.db_pool = None

    # Connect to Redis
    try:
        app.state.redis = redis.from_url(
            f"redis://{os.getenv('REDIS_HOST')}:{os.getenv('REDIS_PORT')}",
            decode_responses=True
        )
        await app.state.redis.ping()
        print("✅ Redis에 성공적으로 연결되었습니다.")
    except Exception as e:
        print(f"🔥 Redis 연결 실패: {e}")
        app.state.redis = None

    # Connect to RabbitMQ with retry logic
    retries = 5
    delay = 5
    for i in range(retries):
        try:
            app.state.rabbitmq_connection = await aio_pika.connect_robust(
                host=os.getenv("RABBITMQ_HOST"),
                login=os.getenv("RABBITMQ_USER"),
                password=os.getenv("RABBITMQ_PASSWORD")
            )
            app.state.rabbitmq_channel = await app.state.rabbitmq_connection.channel()
            await app.state.rabbitmq_channel.declare_queue('news_queue', durable=True)
            print("✅ RabbitMQ에 성공적으로 연결되었습니다.")
            break
        except Exception as e:
            print(f"🔥 RabbitMQ 연결 실패 (시도 {i+1}/{retries}): {e}")
            if i < retries - 1:
                await asyncio.sleep(delay)
            else:
                app.state.rabbitmq_connection = None
                app.state.rabbitmq_channel = None

@app.on_event("shutdown")
async def shutdown_event():
    if hasattr(app.state, 'db_pool') and app.state.db_pool:
        await app.state.db_pool.close()
        print("asyncpg 커넥션 풀이 종료되었습니다.")
    if hasattr(app.state, 'redis') and app.state.redis:
        await app.state.redis.close()
    if hasattr(app.state, 'rabbitmq_connection') and app.state.rabbitmq_connection:
        await app.state.rabbitmq_connection.close()

# --- API Endpoints ---

@app.get("/api/all-companies")
async def get_all_companies(limit: int = 100):
    if not app.state.db_pool:
        raise HTTPException(status_code=503, detail="Database connection pool not available")
    async with app.state.db_pool.acquire() as conn:
        query = """
            SELECT code, name, market, price AS "currentPrice", 
                   COALESCE(change_rate, 0) AS change_rate, 
                   COALESCE(volume, 0) AS volume, 
                   COALESCE(market_cap, 0) AS market_cap
            FROM stocks 
            ORDER BY market_cap DESC NULLS LAST 
            LIMIT $1
        """
        stocks = await conn.fetch(query, limit)
        return {"success": True, "data": [dict(stock) for stock in stocks]}

@app.get("/api/news")
async def get_news(limit: int = 50):
    if not app.state.db_pool:
        raise HTTPException(status_code=503, detail="Database connection pool not available")
    async with app.state.db_pool.acquire() as conn:
        query = """
            SELECT title, url, source, published_at, sentiment_score, sentiment_label 
            FROM news_articles 
            ORDER BY published_at DESC NULLS LAST 
            LIMIT $1
        """
        news = await conn.fetch(query, limit)
        return {"success": True, "data": [dict(n) for n in news]}

def verify_secret_key(x_secret_key: str = Header(...)):
    expected_key = os.getenv("TRAFFIC_SECRET_KEY")
    if not expected_key or x_secret_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid secret key")
    return x_secret_key

@app.get("/api/traffic_stats")
async def get_traffic_stats(secret_key: str = Depends(verify_secret_key)):
    if not app.state.db_pool:
        raise HTTPException(status_code=503, detail="Database connection pool not available")
    
    async with app.state.db_pool.acquire() as conn:
        # Daily unique visitors
        daily_unique_query = """
            SELECT DATE(visit_time) as visit_date, COUNT(DISTINCT ip_address) as unique_visits
            FROM user_visits
            GROUP BY DATE(visit_time)
            ORDER BY visit_date DESC
            LIMIT 30;
        """
        daily_stats = await conn.fetch(daily_unique_query)
        
        # Total visits over time (e.g., last 30 days)
        total_visits_query = """
            SELECT DATE(visit_time) as visit_date, COUNT(*) as total_visits
            FROM user_visits
            GROUP BY DATE(visit_time)
            ORDER BY visit_date DESC
            LIMIT 30;
        """
        total_stats = await conn.fetch(total_visits_query)

        # Most visited paths
        most_visited_paths_query = """
            SELECT path, COUNT(*) as visits
            FROM user_visits
            GROUP BY path
            ORDER BY visits DESC
            LIMIT 10;
        """
        path_stats = await conn.fetch(most_visited_paths_query)

        return {
            "success": True,
            "data": {
                "daily_unique_visitors": [dict(row) for row in daily_stats],
                "total_daily_visits": [dict(row) for row in total_stats],
                "most_visited_paths": [dict(row) for row in path_stats]
            }
        }

# ... (other endpoints would be converted similarly)

@app.post("/api/register", response_model=UserBase)
async def register_user(user: UserCreate):
    if not app.state.db_pool:
        raise HTTPException(status_code=503, detail="Database connection pool not available")

    existing_user = await get_user(user.username)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")

    hashed_password = get_password_hash(user.password)
    async with app.state.db_pool.acquire() as conn:
        new_user = await conn.fetchrow(
            "INSERT INTO users (username, hashed_password, email) VALUES ($1, $2, $3) RETURNING id, username, email",
            user.username, hashed_password, user.email
        )
        return UserBase(**new_user)

@app.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    if not app.state.db_pool:
        raise HTTPException(status_code=503, detail="Database connection pool not available")

    user = await get_user(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me/", response_model=UserBase)
async def read_users_me(current_user: UserBase = Depends(get_current_user)):
    return current_user

@app.post("/api/log_visit")
async def log_visit(request: Request):
    if not app.state.db_pool:
        raise HTTPException(status_code=503, detail="Database connection pool not available")
    
    path = 'unknown'
    try:
        body = await request.json()
        path = body.get('path', 'unknown')
    except Exception:
        pass

    ip_address = request.client.host
    user_agent = request.headers.get('user-agent', 'unknown')

    async with app.state.db_pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO user_visits (ip_address, user_agent, path) VALUES ($1, $2, $3)",
            ip_address, user_agent, path
        )
    return {"success": True}


# --- WebSockets ---


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

news_manager = ConnectionManager()
price_manager = ConnectionManager()

async def consume_from_redis(channel_name: str, manager: ConnectionManager):
    if not app.state.redis:
        print(f"Redis not available for {channel_name} consumption.")
        return
    try:
        pubsub = app.state.redis.pubsub()
        await pubsub.subscribe(channel_name)
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message:
                await manager.broadcast(message['data'])
    except Exception as e:
        print(f"Redis consumer error for {channel_name}: {e}")

async def consume_news_from_rabbitmq():
    if not app.state.rabbitmq_channel:
        print("RabbitMQ channel not available for news consumption.")
        return
    try:
        queue = await app.state.rabbitmq_channel.get_queue('news_queue')
        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process():
                    await news_manager.broadcast(message.body.decode())
    except Exception as e:
        print(f"RabbitMQ news consumer error: {e}")

@app.websocket("/ws/realtime-news")
async def websocket_realtime_news(websocket: WebSocket):
    await news_manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        news_manager.disconnect(websocket)
        print("Client disconnected from realtime-news")

@app.websocket("/ws/realtime-price")
async def websocket_realtime_price(websocket: WebSocket):
    await price_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        price_manager.disconnect(websocket)
        print("Client disconnected from realtime-price")

# Add the consumer task to the startup event
@app.on_event("startup")
async def startup_event_with_consumers():
    asyncio.create_task(consume_news_from_rabbitmq())
    asyncio.create_task(consume_from_redis("kiwoom_realtime_data", price_manager))

# Note: The original startup_event needs to be called or its logic merged.
# For simplicity, this example assumes you merge the logic into one startup handler.
# The provided code should be carefully integrated with the existing startup logic.