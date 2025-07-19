import asyncpg
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError

from .models import TokenData, UserInDB
from .security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

async def get_db_conn(request: Request) -> asyncpg.Connection:
    """
    Dependency that provides a database connection from the application's pool.
    """
    if not hasattr(request.app.state, 'db_pool') or request.app.state.db_pool is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection pool not available")
    async with request.app.state.db_pool.acquire() as connection:
        yield connection

async def get_user(conn: asyncpg.Connection, username: str | None = None, google_id: str | None = None) -> UserInDB | None:
    """
    Retrieves a user from the database by username or google_id.
    """
    if username:
        user_record = await conn.fetchrow(
            "SELECT id, username, hashed_password, email, google_id FROM users WHERE username = $1",
            username
        )
    elif google_id:
        user_record = await conn.fetchrow(
            "SELECT id, username, hashed_password, email, google_id FROM users WHERE google_id = $1",
            google_id
        )
    else:
        return None

    if user_record:
        return UserInDB(**user_record)
    return None

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    conn: asyncpg.Connection = Depends(get_db_conn)
) -> UserInDB:
    """
    Decodes the JWT token, validates it, and returns the current user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except (JWTError, ValidationError):
        raise credentials_exception
    
    user = await get_user(conn, token_data.username)
    if user is None:
        raise credentials_exception
    return user
