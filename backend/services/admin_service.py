import os
import asyncpg
import asyncio
from fastapi import FastAPI, Request, Header, HTTPException, Depends, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from KiwoomGateway.auth.models import UserBase, UserCreate, UserInDB, Token, GoogleLoginRequest
from KiwoomGateway.auth.security import create_access_token, verify_password, get_password_hash
from KiwoomGateway.auth.dependencies import get_user, get_current_user, get_db_conn
from KiwoomGateway.board.api import router as board_router
from KiwoomGateway.profile.api import router as profile_router
from KiwoomGateway.group.api import router as group_router
from KiwoomGateway.chat.api import router as chat_router
from KiwoomGateway.payment.api import router as payment_router
from KiwoomGateway.likes.api import router as likes_router
from KiwoomGateway.tags.api import router as tags_router
from services.fastapi_server import router as fastapi_server_router # Import the router from fastapi_server.py
import httpx # For Google OAuth
from google.oauth2 import id_token
from google.auth.transport import requests
from typing import Optional

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",  # Your frontend's origin
        "http://localhost:8000",  # Your backend's origin
        # Add any other origins where your frontend might be hosted
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# COOP 및 COEP 헤더 추가를 위한 미들웨어
# @app.middleware("http")
# async def add_coop_coep_headers(request: Request, call_next):
#     response = await call_next(request)
#     response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
#     response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
#     return response

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
            print("PostgreSQL connection pool created successfully.")
            break
        except Exception as e:
            print(f"Attempt {i+1}/{retries} to connect to PostgreSQL failed: {e}")
            if i < retries - 1:
                await asyncio.sleep(delay)
            else:
                raise

@app.on_event("shutdown")
async def shutdown_event():
    await app.state.db_pool.close()



from backend.src.auth.auth_router import router as auth_router # Import the new auth router

@app.get("/api/users/me/", response_model=UserInDB)
async def read_users_me(current_user: UserBase = Depends(get_current_user), conn: asyncpg.Connection = Depends(get_db_conn)):
    # Fetch full user details including google_id from DB
    user_record = await conn.fetchrow("SELECT id, username, hashed_password, email, google_id FROM users WHERE id = $1", current_user.id)
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found")
    return UserInDB(**user_record)

@app.post("/api/log_visit")
async def log_visit(request: Request):
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

app.include_router(board_router, prefix="/api", tags=["Board"])
app.include_router(likes_router, prefix="/api", tags=["Likes"])
app.include_router(tags_router, prefix="/api", tags=["Tags"])
app.include_router(profile_router, prefix="/api", tags=["Profile"])
app.include_router(group_router, prefix="/api", tags=["Group"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])
app.include_router(payment_router, prefix="/api", tags=["Payment"])
app.include_router(fastapi_server_router, prefix="/api", tags=["User Settings"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

@app.get("/api/traffic_stats")
async def get_traffic_stats(secret_key: str = Header(None)):
    expected_key = os.getenv("TRAFFIC_SECRET_KEY")
    if not expected_key or secret_key != expected_key:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid secret key")
    async with app.state.db_pool.acquire() as conn:
        daily_stats = await conn.fetch("SELECT CAST(visit_time AS DATE) as date, COUNT(DISTINCT ip_address) as unique_visitors FROM user_visits GROUP BY date ORDER BY date DESC LIMIT 30")
        top_paths = await conn.fetch("SELECT path, COUNT(*) as visits FROM user_visits GROUP BY path ORDER BY visits DESC LIMIT 10")
        top_user_agents = await conn.fetch("SELECT user_agent, COUNT(*) as visits FROM user_visits GROUP BY user_agent ORDER BY visits DESC LIMIT 10")
        return {
            "success": True,
            "data": {
                "daily_stats": [dict(row) for row in daily_stats],
                "top_paths": [dict(row) for row in top_paths],
                "top_user_agents": [dict(row) for row in top_user_agents]
            }
        }
