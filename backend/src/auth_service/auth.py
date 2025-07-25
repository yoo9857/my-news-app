from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "your-secret-key") # Fallback for local development
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", "your-google-client-id") # Fallback for local development

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

print(f"DEBUG: GOOGLE_CLIENT_ID from auth.py (Settings): {settings.GOOGLE_CLIENT_ID}")
print(f"DEBUG: GOOGLE_CLIENT_ID from auth.py (os.environ): {os.environ.get('GOOGLE_CLIENT_ID')}")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
