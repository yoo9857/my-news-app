import os
import asyncpg
import asyncio
from fastapi import FastAPI, Request, Header, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from auth.models import UserBase, UserCreate, UserInDB, Token
from auth.security import create_access_token, verify_password, get_password_hash
from auth.dependencies import get_user, get_current_user
from board.api import router as board_router
from profile.api import router as profile_router
from group.api import router as group_router
from chat.api import router as chat_router
from payment.api import router as payment_router
from likes.api import router as likes_router
from tags.api import router as tags_router
import httpx # For Google OAuth

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

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

@app.post("/api/register", response_model=UserBase)
async def register_user(user: UserCreate, conn: asyncpg.Connection = Depends(get_db_connection)):
    if user.password and user.google_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot register with both password and Google ID")
    if not user.password and not user.google_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password or Google ID is required")

    existing_user = await get_user(user.username)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    
    if user.google_id:
        existing_google_user = await conn.fetchrow("SELECT id FROM users WHERE google_id = $1", user.google_id)
        if existing_google_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google ID already registered")

    hashed_password = get_password_hash(user.password) if user.password else None
    
    new_user = await conn.fetchrow(
        "INSERT INTO users (username, hashed_password, email, google_id) VALUES ($1, $2, $3, $4) RETURNING id, username, email, google_id",
        user.username, hashed_password, user.email, user.google_id
    )
    return UserBase(**new_user)

@app.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), conn: asyncpg.Connection = Depends(get_db_connection)):
    user = await get_user(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = "http://localhost:8003/api/auth/google/callback"

@app.get("/api/auth/google")
async def google_auth():
    return {
        "url": f"https://accounts.google.com/o/oauth2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&scope=openid%20email%20profile"
    }

@app.get("/api/auth/google/callback")
async def google_callback(code: str, conn: asyncpg.Connection = Depends(get_db_connection)):
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=token_data)
        token_response.raise_for_status()
        tokens = token_response.json()

    userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
    async with httpx.AsyncClient() as client:
        userinfo_response = await client.get(userinfo_url, headers={"Authorization": f"Bearer {tokens['access_token']}"})
        userinfo_response.raise_for_status()
        user_info = userinfo_response.json()

    google_id = user_info["sub"]
    email = user_info["email"]
    username = user_info.get("name", email.split('@')[0]) # Use name if available, else part of email

    user = await conn.fetchrow("SELECT * FROM users WHERE google_id = $1", google_id)
    if not user:
        # Register new user if not found
        user = await conn.fetchrow(
            "INSERT INTO users (username, email, google_id) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET google_id = EXCLUDED.google_id RETURNING id, username, email, google_id",
            username, email, google_id
        )
        if not user: # If conflict on email, but no google_id, update existing user
             user = await conn.fetchrow("SELECT id, username, email, google_id FROM users WHERE email = $1", email)

    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me/", response_model=UserInDB)
async def read_users_me(current_user: UserBase = Depends(get_current_user), conn: asyncpg.Connection = Depends(get_db_connection)):
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
