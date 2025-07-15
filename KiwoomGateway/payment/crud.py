import asyncpg
from typing import List, Optional
from datetime import datetime

from .models import TransactionCreate, Transaction, TransactionUpdate

async def create_transaction(conn: asyncpg.Connection, transaction: TransactionCreate) -> Transaction:
    row = await conn.fetchrow(
        "INSERT INTO transactions (user_id, amount, currency, status, pg_transaction_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        transaction.user_id, transaction.amount, transaction.currency, transaction.status, transaction.pg_transaction_id
    )
    return Transaction(**row)

async def get_transaction(conn: asyncpg.Connection, transaction_id: int) -> Optional[Transaction]:
    row = await conn.fetchrow(
        "SELECT * FROM transactions WHERE id = $1",
        transaction_id
    )
    return Transaction(**row) if row else None

async def get_user_transactions(conn: asyncpg.Connection, user_id: int, skip: int = 0, limit: int = 100) -> List[Transaction]:
    rows = await conn.fetch(
        "SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC OFFSET $2 LIMIT $3",
        user_id, skip, limit
    )
    return [Transaction(**row) for row in rows]

async def update_transaction_status(conn: asyncpg.Connection, transaction_id: int, status: str, pg_transaction_id: Optional[str] = None) -> Optional[Transaction]:
    row = await conn.fetchrow(
        "UPDATE transactions SET status = $1, pg_transaction_id = $2, updated_at = $3 WHERE id = $4 RETURNING *",
        status, pg_transaction_id, datetime.now(), transaction_id
    )
    return Transaction(**row)