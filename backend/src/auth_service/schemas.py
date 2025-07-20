from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None

class PrivacySettingsUpdate(BaseModel):
    profile_visibility: Optional[str] = None
    show_email: Optional[str] = None
    show_activity_feed: Optional[bool] = None
    allow_direct_messages: Optional[bool] = None
    show_online_status: Optional[bool] = None

class NotificationSettingsUpdate(BaseModel):
    on_new_comment: Optional[bool] = None
    on_new_follower: Optional[bool] = None
    on_post_like: Optional[bool] = None
    on_mention: Optional[bool] = None
    on_direct_message: Optional[bool] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    # Privacy Settings
    profile_visibility: str
    show_email: str
    show_activity_feed: bool
    allow_direct_messages: bool
    show_online_status: bool
    # Notification Settings
    on_new_comment: bool
    on_new_follower: bool
    on_post_like: bool
    on_mention: bool
    on_direct_message: bool
    email_notifications: bool
    push_notifications: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
