from sqlalchemy import Boolean, Column, Integer, String
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    nickname = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    # Privacy Settings
    profile_visibility = Column(String, default="public") # public, followers_only, private
    show_email = Column(String, default="private") # public, private
    show_activity_feed = Column(Boolean, default=True)
    allow_direct_messages = Column(Boolean, default=True)
    show_online_status = Column(Boolean, default=True)
    # Notification Settings
    on_new_comment = Column(Boolean, default=True)
    on_new_follower = Column(Boolean, default=True)
    on_post_like = Column(Boolean, default=True)
    on_mention = Column(Boolean, default=True)
    on_direct_message = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
