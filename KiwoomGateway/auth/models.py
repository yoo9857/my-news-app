from pydantic import BaseModel

class UserBase(BaseModel):
    username: str
    email: str | None = None

class UserCreate(UserBase):
    password: str | None = None
    google_id: str | None = None

class UserInDB(UserBase):
    id: int
    hashed_password: str | None = None
    google_id: str | None = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None