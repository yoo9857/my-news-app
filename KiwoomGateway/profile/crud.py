import asyncpg
from typing import Optional
from datetime import datetime

from .models import UserProfileCreate, UserProfile

async def get_user_profile(conn: asyncpg.Connection, user_id: int) -> Optional[UserProfile]:
    row = await conn.fetchrow(
        "SELECT * FROM user_profiles WHERE user_id = $1",
        user_id
    )
    return UserProfile(**row) if row else None

async def create_user_profile(conn: asyncpg.Connection, user_id: int, profile: UserProfileCreate) -> UserProfile:
    row = await conn.fetchrow(
        "INSERT INTO user_profiles (user_id, bio, profile_picture_url, location) VALUES ($1, $2, $3, $4) RETURNING *",
        user_id, profile.bio, profile.profile_picture_url, profile.location
    )
    return UserProfile(**row)

async def update_user_profile(conn: asyncpg.Connection, user_id: int, profile: UserProfileCreate) -> UserProfile:
    row = await conn.fetchrow(
        "UPDATE user_profiles SET bio = $1, profile_picture_url = $2, location = $3, updated_at = $4 WHERE user_id = $5 RETURNING *",
        profile.bio, profile.profile_picture_url, profile.location, datetime.now(), user_id
    )
    return UserProfile(**row)