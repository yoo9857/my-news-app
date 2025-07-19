from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TransactionBase(BaseModel):
    amount: float
    currency: str = 'KRW'
    status: str = 'pending'
    pg_transaction_id: Optional[str] = None

class TransactionCreate(TransactionBase):
    user_id: int # This will be set by the backend based on current_user

class TransactionUpdate(BaseModel):
    status: str
    pg_transaction_id: Optional[str] = None

class Transaction(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True