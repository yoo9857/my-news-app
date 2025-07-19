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
import logging

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], # Restrict to frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware to add security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    return response


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
                host="rabbitmq",
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



@app.get("/api/posts")
async def get_posts(q: Optional[str] = None, page: int = 1, category: Optional[str] = None):
    if not app.state.db_pool:
        raise HTTPException(status_code=503, detail="Database connection pool not available")
    try:
        async with app.state.db_pool.acquire() as conn:
            base_query = """
                SELECT
                    p.id,
                    p.title,
                    p.content,
                    u.id AS user_id,
                    up.nickname AS user_nickname,
                    p.created_at,
                    p.category
                FROM posts p
                JOIN users u ON p.author_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
            """
            where_clauses = []
            query_params = []
            param_count = 1

            if category and category != "all":
                where_clauses.append(f"p.category = ${param_count}")
                query_params.append(category)
                param_count += 1

            if q:
                where_clauses.append(f"(p.title ILIKE ${param_count} OR p.content ILIKE ${param_count})")
                query_params.append(f"%{q}%")
                param_count += 1

            if where_clauses:
                base_query += " WHERE " + " AND ".join(where_clauses)
            
            base_query += " ORDER BY p.created_at DESC"

            # Pagination
            limit = 10  # Number of posts per page
            offset = (page - 1) * limit
            base_query += f" LIMIT ${param_count} OFFSET ${param_count + 1}"
            query_params.append(limit)
            query_params.append(offset)

            logging.info(f"Executing query: {base_query}")
            logging.info(f"With params: {query_params}")

            records = await conn.fetch(base_query, *query_params)
            
            logging.info(f"Fetched {len(records)} records.")

            posts_data = []
            for record in records:
                posts_data.append({
                    "id": str(record["id"]),
                    "title": record["title"],
                    "content": record["content"],
                    "user": {
                        "nickname": record["user_nickname"] if record["user_nickname"] else str(record["user_id"])
                    },
                    "category": {"name": record["category"] if record["category"] else "General"},
                    "viewCount": 0,
                    "likeCount": 0,
                    "createdAt": record["created_at"].isoformat()
                })
            return {"success": True, "data": posts_data}
    except Exception as e:
        logging.error(f"Error fetching posts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error while fetching posts")

@app.get("/api/posts/{post_id}")
async def get_post_by_id(post_id: int):
    if not app.state.db_pool:
        raise HTTPException(status_code=503, detail="Database connection pool not available")
    try:
        async with app.state.db_pool.acquire() as conn:
            query = """
                SELECT
                    p.id,
                    p.title,
                    p.content,
                    u.id AS user_id,
                    up.nickname AS user_nickname,
                    p.created_at,
                    p.category
                FROM posts p
                JOIN users u ON p.author_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE p.id = $1;
            """
            record = await conn.fetchrow(query, post_id)
            
            if not record:
                raise HTTPException(status_code=404, detail="Post not found")
            
            post_data = {
                "id": str(record["id"]),
                "title": record["title"],
                "content": record["content"],
                "user": {
                    "nickname": record["user_nickname"] if record["user_nickname"] else str(record["user_id"])
                },
                "category": {"name": record["category"] if record["category"] else "General"},
                "viewCount": 0,
                "likeCount": 0,
                "createdAt": record["created_at"].isoformat()
            }
            return {"success": True, "data": post_data}
    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Error fetching post by ID {post_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error while fetching post")

@app.get("/api/comments")
async def get_comments(postId: int):
    if not app.state.db_pool:
        raise HTTPException(status_code=503, detail="Database connection pool not available")
    try:
        async with app.state.db_pool.acquire() as conn:
            query = """
                SELECT
                    c.id,
                    c.content,
                    u.id AS user_id,
                    up.nickname AS user_nickname,
                    c.created_at
                FROM comments c
                LEFT JOIN users u ON c.author_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE c.post_id = $1
                ORDER BY c.created_at ASC;
            """
            records = await conn.fetch(query, postId)
            
            comments_data = []
            for record in records:
                comments_data.append({
                    "id": str(record["id"]),
                    "content": record["content"],
                    "user": {
                        "nickname": record["user_nickname"] if record["user_nickname"] else (str(record["user_id"]) if record["user_id"] else "Unknown User")
                    },
                    "createdAt": record["created_at"].isoformat()
                })
            return {"success": True, "data": comments_data}
    except Exception as e:
        logging.error(f"Error fetching comments for post {postId}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error while fetching comments")



