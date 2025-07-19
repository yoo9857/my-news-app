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

class GoogleUser(BaseModel):
    google_id: str
    email: str
    name: str | None = None
    picture: str | None = None

class UserProfile(BaseModel):
    nickname: str | None = None
    bio: str | None = None
    profile_image_url: str | None = None
    website_url: str | None = None
    location: str | None = None
    theme_color: str | None = None
    background_image_url: str | None = None

class UserResponse(UserBase):
    id: int
    profile: UserProfile | None = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    nickname: str | None = None
    bio: str | None = None
    profile_image_url: str | None = None
    website_url: str | None = None
    location: str | None = None
    theme_color: str | None = None
    background_image_url: str | None = None

class PrivacySettings(BaseModel):
    profile_visibility: str
    show_email: str
    show_activity_feed: bool
    allow_direct_messages: bool
    show_online_status: bool

    class Config:
        from_attributes = True

class PrivacySettingsUpdate(BaseModel):
    profile_visibility: str | None = None
    show_email: str | None = None
    show_activity_feed: bool | None = None
    allow_direct_messages: bool | None = None
    show_online_status: bool | None = None

class NotificationSettings(BaseModel):
    on_new_comment: bool
    on_new_follower: bool
    on_post_like: bool
    on_mention: bool
    on_direct_message: bool
    email_notifications: bool
    push_notifications: bool

    class Config:
        from_attributes = True

class NotificationSettingsUpdate(BaseModel):
    on_new_comment: bool | None = None
    on_new_follower: bool | None = None
    on_post_like: bool | None = None
    on_mention: bool | None = None
    on_direct_message: bool | None = None
    email_notifications: bool | None = None
    push_notifications: bool | None = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class GoogleLoginRequest(BaseModel):
    token: str