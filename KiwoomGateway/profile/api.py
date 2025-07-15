from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
import os

from .models import UserProfile, UserProfileCreate
from . import crud
from auth.dependencies import get_current_user
from auth.models import UserBase

router = APIRouter()

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

@router.get("/profiles/me", response_model=UserProfile)
async def read_my_profile(
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    profile = await crud.get_user_profile(conn, current_user.id)
    if profile is None:
        # If no profile exists, create a default one
        profile = await crud.create_user_profile(conn, current_user.id, UserProfileCreate())
    return profile

@router.put("/profiles/me", response_model=UserProfile)
async def update_my_profile(
    profile: UserProfileCreate,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    updated_profile = await crud.update_user_profile(conn, current_user.id, profile)
    if updated_profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return updated_profile

@router.get("/profiles/{user_id}", response_model=UserProfile)
async def read_user_profile(
    user_id: int,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    profile = await crud.get_user_profile(conn, user_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile