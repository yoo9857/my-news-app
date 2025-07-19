import os
import asyncio
import asyncpg
import redis.asyncio as redis
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, time as dt_time

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

# --- Market Time Logic ---
def is_market_open():
    now = datetime.now().time()
    market_open = dt_time(9, 0, 0)  # 9:00 AM
    market_close = dt_time(15, 30, 0) # 3:30 PM
    return market_open <= now <= market_close

# --- Connection Pools and State ---
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
            print("PostgreSQL connection pool created successfully in stock_service.")
            break
        except Exception as e:
            print(f"Attempt {i+1}/{retries} to connect to PostgreSQL in stock_service failed: {e}")
            if i < retries - 1:
                await asyncio.sleep(delay)
            else:
                raise

    app.state.redis = redis.from_url(
        f"redis://{os.getenv('REDIS_HOST')}:{os.getenv('REDIS_PORT')}",
        decode_responses=True
    )
    
    async def consume_prices():
        while True: # Add a loop for automatic reconnection
            try:
                pubsub = app.state.redis.pubsub()
                await pubsub.subscribe("kiwoom_realtime_data")
                print("Subscribed to kiwoom_realtime_data channel.")
                while True:
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=None) # Block until message
                    if message:
                        # print(f"Received from Redis: {message['data']}") # Debugging line
                        await manager.broadcast(message['data'])
            except redis.exceptions.ConnectionError as e:
                print(f"Redis connection error in consume_prices: {e}. Reconnecting in 5 seconds...")
                await asyncio.sleep(5)
            except Exception as e:
                print(f"An unexpected error occurred in consume_prices: {e}. Reconnecting in 5 seconds...")
                await asyncio.sleep(5)
            finally:
                print("Attempting to re-subscribe to Redis channel.")

    asyncio.create_task(consume_prices())

@app.on_event("shutdown")
async def shutdown_event():
    await app.state.db_pool.close()
    await app.state.redis.close()

@app.get("/api/all-companies")
async def get_all_companies(limit: int = 1500):
    print("======== Request received at /api/all-companies! ========")
    if is_market_open():
        # During market hours, fetch from Redis cache (updated by kiwoom_realtime_server)
        # Or, if direct real-time data is needed, stock_service would subscribe to individual codes
        # For simplicity, we'll assume kiwoom_realtime_server pushes all data to Redis periodically
        # and stock_service fetches from DB for initial load.
        # For live data, the websocket is used.
        pass # This endpoint will primarily serve historical/cached data

    # Always fetch from DB for initial load, real-time updates are via websocket
    async with app.state.db_pool.acquire() as conn:
        stocks = await conn.fetch(
            '''SELECT code, name, market, price AS "currentPrice", 
                   COALESCE(change_rate, 0) AS change_rate, 
                   COALESCE(volume, 0) AS volume, 
                   COALESCE(market_cap, 0) AS market_cap
            FROM stocks ORDER BY market_cap DESC NULLS LAST LIMIT $1''',
            limit
        )
        return {"success": True, "data": [dict(stock) for stock in stocks]}

@app.websocket("/ws/realtime-price")
async def websocket_realtime_price(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)