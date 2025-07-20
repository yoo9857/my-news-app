from sqlalchemy.orm import Session
from . import models, schemas, auth

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_profile(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        if user_update.nickname is not None:
            db_user.nickname = user_update.nickname
        if user_update.avatar_url is not None:
            db_user.avatar_url = user_update.avatar_url
        db.commit()
        db.refresh(db_user)
    return db_user

def update_user_password(db: Session, user_id: int, new_password: str):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.hashed_password = auth.get_password_hash(new_password)
        db.commit()
        db.refresh(db_user)
    return db_user

def update_privacy_settings(db: Session, user_id: int, privacy_update: schemas.PrivacySettingsUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        for field, value in privacy_update.model_dump(exclude_unset=True).items():
            setattr(db_user, field, value)
        db.commit()
        db.refresh(db_user)
    return db_user

def update_notification_settings(db: Session, user_id: int, notification_update: schemas.NotificationSettingsUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        for field, value in notification_update.model_dump(exclude_unset=True).items():
            setattr(db_user, field, value)
        db.commit()
        db.refresh(db_user)
    return db_user
