from fastapi import APIRouter, Depends, HTTPException, status, Request
import asyncpg
import os
from typing import List

from .models import Transaction, TransactionCreate, TransactionUpdate
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

@router.post("/transactions/request", response_model=Transaction, status_code=status.HTTP_201_CREATED)
async def create_payment_request(
    transaction_data: TransactionCreate,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    # Ensure the user_id in the request matches the authenticated user
    if transaction_data.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create transaction for this user ID")
    
    # Here you would integrate with a Payment Gateway (PG) API
    # For demonstration, we'll just save to DB with 'pending' status
    transaction_data.status = "pending"
    new_transaction = await crud.create_transaction(conn, transaction_data)
    return new_transaction

@router.post("/transactions/webhook", status_code=status.HTTP_200_OK)
async def handle_payment_webhook(request: Request, conn: asyncpg.Connection = Depends(get_db_connection)):
    # This endpoint would receive callbacks from the Payment Gateway
    # You need to implement proper signature verification and parsing of the PG's payload
    payload = await request.json()
    
    # Example: Extract transaction_id and status from payload
    pg_transaction_id = payload.get("pg_transaction_id")
    status_from_pg = payload.get("status") # e.g., 'completed', 'failed'
    
    # Find the corresponding transaction in your DB and update its status
    # This is a simplified example; in real-world, you'd verify the transaction ID
    # and potentially other details from the PG's system.
    
    # Assuming you have a way to map pg_transaction_id to your internal transaction ID
    # For simplicity, let's assume pg_transaction_id is unique and can be used to find the transaction
    # In a real system, you'd query your DB for the transaction using pg_transaction_id
    
    # For now, we'll just log and return success
    print(f"Received webhook for PG Transaction ID: {pg_transaction_id} with status: {status_from_pg}")
    
    # You would typically update your database here
    # Example: await crud.update_transaction_status_by_pg_id(conn, pg_transaction_id, status_from_pg)
    
    return {"message": "Webhook received successfully"}

@router.get("/transactions/me", response_model=List[Transaction])
async def get_my_transactions(
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection),
    skip: int = 0,
    limit: int = 100
):
    transactions = await crud.get_user_transactions(conn, current_user.id, skip=skip, limit=limit)
    return transactions

@router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction_by_id(
    transaction_id: int,
    current_user: UserBase = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    transaction = await crud.get_transaction(conn, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this transaction")
    return transaction