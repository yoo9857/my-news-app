import asyncpg
from typing import List, Optional
from datetime import datetime

from .models import GroupCreate, Group, GroupMember

async def create_group(conn: asyncpg.Connection, group: GroupCreate, owner_id: int) -> Group:
    row = await conn.fetchrow(
        "INSERT INTO groups (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *",
        group.name, group.description, owner_id
    )
    new_group = Group(**row)
    await add_group_member(conn, new_group.id, owner_id, 'admin') # Owner is also an admin member
    return new_group

async def get_groups(conn: asyncpg.Connection, skip: int = 0, limit: int = 100) -> List[Group]:
    rows = await conn.fetch(
        "SELECT * FROM groups ORDER BY created_at DESC OFFSET $1 LIMIT $2",
        skip, limit
    )
    return [Group(**row) for row in rows]

async def get_group(conn: asyncpg.Connection, group_id: int) -> Optional[Group]:
    row = await conn.fetchrow(
        "SELECT * FROM groups WHERE id = $1",
        group_id
    )
    return Group(**row) if row else None

async def update_group(conn: asyncpg.Connection, group_id: int, group: GroupCreate) -> Optional[Group]:
    row = await conn.fetchrow(
        "UPDATE groups SET name = $1, description = $2 WHERE id = $3 RETURNING *",
        group.name, group.description, group_id
    )
    return Group(**row) if row else None

async def delete_group(conn: asyncpg.Connection, group_id: int) -> bool:
    result = await conn.execute(
        "DELETE FROM groups WHERE id = $1",
        group_id
    )
    return result == 'DELETE 1'

async def add_group_member(conn: asyncpg.Connection, group_id: int, user_id: int, role: str = 'member') -> GroupMember:
    row = await conn.fetchrow(
        "INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (group_id, user_id) DO UPDATE SET role = EXCLUDED.role RETURNING *",
        group_id, user_id, role
    )
    return GroupMember(**row)

async def remove_group_member(conn: asyncpg.Connection, group_id: int, user_id: int) -> bool:
    result = await conn.execute(
        "DELETE FROM group_members WHERE group_id = $1 AND user_id = $2",
        group_id, user_id
    )
    return result == 'DELETE 1'

async def get_group_members(conn: asyncpg.Connection, group_id: int) -> List[GroupMember]:
    rows = await conn.fetch(
        "SELECT * FROM group_members WHERE group_id = $1",
        group_id
    )
    return [GroupMember(**row) for row in rows]

async def get_user_group_role(conn: asyncpg.Connection, group_id: int, user_id: int) -> Optional[str]:
    row = await conn.fetchrow(
        "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
        group_id, user_id
    )
    return row['role'] if row else None