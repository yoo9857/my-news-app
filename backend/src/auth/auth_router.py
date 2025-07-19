from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
import asyncpg
import os
from typing import Optional

from .models import UserBase, UserCreate, UserInDB, Token
from .security import create_access_token, verify_password, get_password_hash
from .dependencies import get_user, get_db_conn # get_db_conn will be added/modified in dependencies.py

router = APIRouter()

@router.post("/register", response_model=UserBase)
async def register_user(user: UserCreate, conn: asyncpg.Connection = Depends(get_db_conn), honeypot: Optional[str] = Form(None)):
    if honeypot:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Honeypot field filled. Likely a bot.")

    if user.password and user.google_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot register with both password and Google ID")
    if not user.password and not user.google_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password or Google ID is required")

    existing_user = await get_user(conn, username=user.username)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    
    if user.google_id:
        existing_google_user = await get_user(conn, google_id=user.google_id)
        if existing_google_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google ID already registered")

    hashed_password = get_password_hash(user.password) if user.password else None
    
    new_user = await conn.fetchrow(
        "INSERT INTO users (username, hashed_password, email, google_id) VALUES ($1, $2, $3, $4) RETURNING id, username, email, google_id",
        user.username, hashed_password, user.email, user.google_id
    )
    return UserBase(**new_user)

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), conn: asyncpg.Connection = Depends(get_db_conn)):
    user = await get_user(conn, username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
