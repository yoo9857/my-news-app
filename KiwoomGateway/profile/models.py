from pydantic import BaseModel
from datetime import datetime

class UserProfileBase(BaseModel):
    bio: str | None = None
    profile_picture_url: str | None = None
    location: str | None = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfile(UserProfileBase):
    user_id: int
    updated_at: datetime

    class Config:
        from_attributes = True