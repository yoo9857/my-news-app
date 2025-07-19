from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
import os

from .models import Group, GroupCreate, GroupMember
from . import crud
from KiwoomGateway.auth.dependencies import get_current_user
from KiwoomGateway.auth.models import UserBase

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

@router.post("/groups/", response_model=Group, status_code=status.HTTP_201_CREATED)
async def create_new_group(
    group: GroupCreate,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    return await crud.create_group(conn, group, current_user.id)

@router.get("/groups/", response_model=list[Group])
async def read_groups(
    skip: int = 0,
    limit: int = 100,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    return await crud.get_groups(conn, skip=skip, limit=limit)

@router.get("/groups/{group_id}", response_model=Group)
async def read_group(
    group_id: int,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    group = await crud.get_group(conn, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@router.put("/groups/{group_id}", response_model=Group)
async def update_existing_group(
    group_id: int,
    group: GroupCreate,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    db_group = await crud.get_group(conn, group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    if db_group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this group")
    return await crud.update_group(conn, group_id, group)

@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_group(
    group_id: int,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    db_group = await crud.get_group(conn, group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    if db_group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this group")
    await crud.delete_group(conn, group_id)
    return

@router.post("/groups/{group_id}/members/", response_model=GroupMember, status_code=status.HTTP_201_CREATED)
async def add_member_to_group(
    group_id: int,
    user_id: int,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    # Only group owner or admin can add members
    group = await crud.get_group(conn, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # For simplicity, only owner can add members for now
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add members to this group")

    return await crud.add_group_member(conn, group_id, user_id)

@router.delete("/groups/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member_from_group(
    group_id: int,
    user_id: int,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    group = await crud.get_group(conn, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Only group owner or admin can remove members
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to remove members from this group")

    await crud.remove_group_member(conn, group_id, user_id)
    return

@router.get("/groups/{group_id}/members/", response_model=list[GroupMember])
async def get_group_members_list(
    group_id: int,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    return await crud.get_group_members(conn, group_id)