from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from typing import Optional

from .models import TokenData, UserInDB
from .security import SECRET_KEY, ALGORITHM
import asyncpg
import os

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_db_conn():
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

async def get_user(conn: asyncpg.Connection, username: Optional[str] = None, google_id: Optional[str] = None, email: Optional[str] = None):
    if not username and not google_id and not email:
        return None

    query_parts = []
    values = []
    param_idx = 1

    if username:
        query_parts.append(f"username = ${param_idx}")
        values.append(username)
        param_idx += 1
    if google_id:
        query_parts.append(f"google_id = ${param_idx}")
        values.append(google_id)
        param_idx += 1
    if email:
        query_parts.append(f"email = ${param_idx}")
        values.append(email)
        param_idx += 1

    query = f"SELECT id, username, hashed_password, email, google_id FROM users WHERE {' OR '.join(query_parts)}"
    user_record = await conn.fetchrow(query, *values)
    if user_record:
        return UserInDB(**user_record)
    return None

async def get_current_user(token: str = Depends(oauth2_scheme), conn: asyncpg.Connection = Depends(get_db_conn)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except (JWTError, ValidationError):
        raise credentials_exception
    user = await get_user(conn, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user